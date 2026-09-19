"use strict";

// Turns the variables set in a Quick-Generation/*.sh script into document
// data, driven by the type's JSON Schema so no per-type mapping is needed:
//   candidateName            <- CANDIDATE_NAME
//   structure.basicPercent   <- STRUCTURE_BASIC_PERCENT
//   string arrays            <- one entry per line
//   object arrays            <- "A | B | C" lines, in schema property order

function camelToSnake(key) {
  return key.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toUpperCase();
}

function envName(path) {
  return path.map(camelToSnake).join("_");
}

function toNumber(raw, errorPrefix) {
  const n = Number(String(raw).replace(/,/g, "").trim());
  if (String(raw).trim() === "" || !Number.isFinite(n)) {
    throw new Error(`${errorPrefix} must be a number`);
  }
  return n;
}

// errorPrefix names the variable (and line, for array rows) in messages.
function coerce(raw, prop, errorPrefix) {
  if (prop.type === "number" || prop.type === "integer") return toNumber(raw, errorPrefix);
  if (prop.type === "boolean") return raw.toLowerCase() === "true";
  if (prop.oneOf) {
    const n = Number(raw.replace(/,/g, ""));
    return Number.isFinite(n) ? n : raw;
  }
  return raw;
}

function parseRow(line, itemSchema, name) {
  const keys = Object.keys(itemSchema.properties);
  const parts = line.split("|").map((p) => p.trim());
  if (parts.length !== keys.length) {
    throw new Error(
      `${name} line must have ${keys.length} parts "${keys.join(" | ")}": "${line}"`
    );
  }
  const row = {};
  keys.forEach((key, i) => {
    if (parts[i] === "") return;
    try {
      row[key] = coerce(parts[i], itemSchema.properties[key], `${name} ${key}`);
    } catch (err) {
      throw new Error(`${err.message} in line "${line}"`);
    }
  });
  return row;
}

function dataFromEnv(schema, env, prefix = []) {
  const data = {};
  for (const [key, prop] of Object.entries(schema.properties || {})) {
    const path = [...prefix, key];
    const name = envName(path);

    if (prop.type === "object") {
      const nested = dataFromEnv(prop, env, path);
      if (Object.keys(nested).length) data[key] = nested;
      continue;
    }

    const raw = env[name] === undefined ? "" : String(env[name]).trim();
    if (raw === "") continue;

    if (prop.type === "array") {
      const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
      data[key] =
        prop.items && prop.items.type === "object"
          ? lines.map((line) => parseRow(line, prop.items, name))
          : lines;
    } else {
      data[key] = coerce(raw, prop, name);
    }
  }
  return data;
}

// Required fields still missing from `data`, reported as the variable names
// the script user must set (Ajv would only say "name is required").
function missingEnvVars(schema, data, prefix = []) {
  const missing = [];
  for (const key of schema.required || []) {
    const path = [...prefix, key];
    const prop = (schema.properties || {})[key] || {};
    if (data[key] === undefined) {
      if (prop.type === "object") missing.push(...missingEnvVars(prop, {}, path));
      else missing.push(envName(path));
    } else if (prop.type === "object") {
      missing.push(...missingEnvVars(prop, data[key], path));
    }
  }
  return missing;
}

module.exports = { envName, dataFromEnv, missingEnvVars };

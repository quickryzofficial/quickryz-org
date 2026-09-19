"use strict";

const fs = require("fs");
const path = require("path");
const Ajv = require("ajv");
const addFormats = require("ajv-formats");
const { getTypeConfig, ROOT } = require("./registry");

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const compiledCache = new Map();

function loadSchema(typeId) {
  const cfg = getTypeConfig(typeId);
  const schemaPath = path.join(ROOT, "schemas", cfg.schema);
  const raw = fs.readFileSync(schemaPath, "utf8");
  return JSON.parse(raw);
}

function getValidator(typeId) {
  if (compiledCache.has(typeId)) return compiledCache.get(typeId);
  const schema = loadSchema(typeId);
  const validateFn = ajv.compile(schema);
  compiledCache.set(typeId, validateFn);
  return validateFn;
}

// Turns an Ajv error into a one-line, human-readable message, e.g.
// "candidateName is required for offer-letter" or
// "annualCtc must be number for offer-letter".
function formatAjvError(typeId, err) {
  if (err.keyword === "required") {
    return `${err.params.missingProperty} is required for ${typeId}`;
  }
  const field = err.instancePath ? err.instancePath.replace(/^\//, "") : "(root)";
  return `${field} ${err.message} for ${typeId}`;
}

// Validates `data` against the JSON Schema for `typeId`. Throws an Error
// with a newline-joined list of friendly messages if invalid; returns
// true if valid.
function validateData(typeId, data) {
  const validateFn = getValidator(typeId);
  const valid = validateFn(data);
  if (!valid) {
    const messages = validateFn.errors.map((err) => formatAjvError(typeId, err));
    throw new Error(messages.join("\n"));
  }
  return true;
}

module.exports = { validateData, loadSchema };

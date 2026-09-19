#!/usr/bin/env node
"use strict";

const { Command } = require("commander");
const path = require("path");
const { generate, generateInvoice, loadJsonFile } = require("../src/generate");
const { validateData, loadSchema } = require("../src/validate");
const { computeSalary } = require("../src/salary");
const { dataFromEnv, missingEnvVars } = require("../src/env-input");
const { listTypes, ONBOARDING_KIT_TYPES } = require("../src/registry");

// One entry point for every document type, so JSON files and the
// Quick-Generation scripts go through identical logic.
async function generateDocument(type, data, options = {}) {
  if (type === "invoice") {
    const result = await generateInvoice(data);
    console.log(`Generated: ${result.outputPath}`);
    console.log(`Invoice ${result.invoiceNumber} total: ₹${result.total.toFixed(2)}`);
    for (const warning of result.warnings) console.warn(`Warning: ${warning}`);
    return [result.outputPath];
  }
  if (type === "kit") {
    const results = [];
    for (const kitType of ONBOARDING_KIT_TYPES) {
      const outputPath = await generate(kitType, data);
      results.push(outputPath);
      console.log(`Generated: ${outputPath}`);
    }
    console.log(`\nOnboarding kit complete: ${results.length} documents generated.`);
    return results;
  }
  if (type === "payslip" || type === "salary-structure") {
    data.salary = computeSalary(data);
  }
  if (type === "payslip") {
    if (!options.month) {
      throw new Error("--month <YYYY-MM> is required for payslip generation");
    }
    data.payslipMonth = options.month;
  }
  const outputPath = await generate(type, data, { month: options.month });
  console.log(`Generated: ${outputPath}`);
  return [outputPath];
}

// The kit reads the union of its four letters' fields.
function schemaForEnv(type) {
  if (type !== "kit") return loadSchema(type);
  const schemas = ONBOARDING_KIT_TYPES.map(loadSchema);
  return {
    properties: Object.assign({}, ...schemas.map((s) => s.properties)),
    required: [...new Set(schemas.flatMap((s) => s.required || []))],
  };
}

const program = new Command();

program
  .name("hrgen")
  .description("Offline HR document generator: JSON in, PDF out. No LLM, no network calls.");

program
  .command("list")
  .description("List every supported document type")
  .action(() => {
    console.log("Supported document types:\n");
    for (const { id, label } of listTypes()) {
      console.log(`  ${id.padEnd(26)} ${label}`);
    }
  });

program
  .command("validate <jsonFile>")
  .description("Validate a JSON file against a document type's schema")
  .requiredOption("-t, --type <type>", "document type ID (see `hrgen list`)")
  .action((jsonFile, options) => {
    try {
      const data = loadJsonFile(path.resolve(jsonFile));
      validateData(options.type, data);
      console.log(`OK: ${jsonFile} is valid for type "${options.type}".`);
    } catch (err) {
      console.error(`Invalid:\n${err.message}`);
      process.exitCode = 1;
    }
  });

program
  .command("generate <type> <jsonFile>")
  .description("Generate a single document as a PDF")
  .option("-m, --month <YYYY-MM>", "payslip month (required for type=payslip)")
  .action(async (type, jsonFile, options) => {
    try {
      const data = loadJsonFile(path.resolve(jsonFile));
      await generateDocument(type, data, options);
    } catch (err) {
      console.error(`Error: ${err.message}`);
      process.exitCode = 1;
    }
  });

program
  .command("kit <jsonFile>")
  .description(
    `Generate the full onboarding bundle in one shot: ${ONBOARDING_KIT_TYPES.join(", ")}`
  )
  .action(async (jsonFile) => {
    try {
      await generateDocument("kit", loadJsonFile(path.resolve(jsonFile)));
    } catch (err) {
      console.error(`Error: ${err.message}`);
      process.exitCode = 1;
    }
  });

program
  .command("invoice <jsonFile>")
  .description("Generate an invoice (auto-numbered; GST added when \"gst\": true)")
  .action(async (jsonFile) => {
    try {
      await generateDocument("invoice", loadJsonFile(path.resolve(jsonFile)));
    } catch (err) {
      console.error(`Error: ${err.message}`);
      process.exitCode = 1;
    }
  });

program
  .command("from-env <type>")
  .description("Generate from environment variables (used by Quick-Generation/*.sh); type may also be 'kit'")
  .option("-m, --month <YYYY-MM>", "payslip month (required for type=payslip)")
  .action(async (type, options) => {
    try {
      const schema = schemaForEnv(type);
      const data = dataFromEnv(schema, process.env);
      const missing = missingEnvVars(schema, data);
      if (missing.length) {
        throw new Error(`Please set these variables in the script: ${missing.join(", ")}`);
      }
      await generateDocument(type, data, options);
    } catch (err) {
      console.error(`Error: ${err.message}`);
      process.exitCode = 1;
    }
  });

program.parse();

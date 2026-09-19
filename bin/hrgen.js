#!/usr/bin/env node
"use strict";

const { Command } = require("commander");
const path = require("path");
const { generate, loadJsonFile } = require("../src/generate");
const { validateData } = require("../src/validate");
const { computeSalary } = require("../src/salary");
const { listTypes, ONBOARDING_KIT_TYPES } = require("../src/registry");

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
      const data = loadJsonFile(path.resolve(jsonFile));
      const results = [];
      for (const type of ONBOARDING_KIT_TYPES) {
        const outputPath = await generate(type, data);
        results.push(outputPath);
        console.log(`Generated: ${outputPath}`);
      }
      console.log(`\nOnboarding kit complete: ${results.length} documents generated.`);
    } catch (err) {
      console.error(`Error: ${err.message}`);
      process.exitCode = 1;
    }
  });

program.parse();

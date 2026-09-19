"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { envName, dataFromEnv, missingEnvVars } = require("../src/env-input");
const { loadSchema } = require("../src/validate");

test("envName converts a camelCase path to UPPER_SNAKE", () => {
  assert.equal(envName(["candidateName"]), "CANDIDATE_NAME");
  assert.equal(envName(["structure", "basicPercent"]), "STRUCTURE_BASIC_PERCENT");
  assert.equal(envName(["dob"]), "DOB");
  assert.equal(envName(["ifscCode"]), "IFSC_CODE");
});

test("scalars are coerced by schema type and blanks are omitted", () => {
  const data = dataFromEnv(loadSchema("offer-letter"), {
    CANDIDATE_NAME: " Rahul Sharma ",
    ANNUAL_CTC: "12,00,000",
    WORK_LOCATION: "",
  });
  assert.deepEqual(data, { candidateName: "Rahul Sharma", annualCtc: 1200000 });
});

test("a non-numeric number field names the variable", () => {
  assert.throws(
    () => dataFromEnv(loadSchema("offer-letter"), { ANNUAL_CTC: "twelve lakh" }),
    /ANNUAL_CTC must be a number/
  );
});

test("nested objects read PARENT_CHILD variables; oneOf keeps 'auto'", () => {
  const data = dataFromEnv(loadSchema("payslip"), {
    STRUCTURE_BASIC_PERCENT: "40",
    STRUCTURE_SPECIAL_ALLOWANCE: "auto",
    STRUCTURE_TDS_MONTHLY: "5000",
  });
  assert.deepEqual(data.structure, { basicPercent: 40, specialAllowance: "auto", tdsMonthly: 5000 });
});

test("object arrays parse 'A | B' lines in schema property order", () => {
  const data = dataFromEnv(loadSchema("payslip"), {
    EXTRA_EARNINGS: "LTA | 5000\n\nGadget Allowance | 2,000\n",
  });
  assert.deepEqual(data.extraEarnings, [
    { label: "LTA", amount: 5000 },
    { label: "Gadget Allowance", amount: 2000 },
  ]);
});

test("invoice ITEMS lines map to title/description/qty/rate, empty description dropped", () => {
  const data = dataFromEnv(loadSchema("invoice"), {
    CLIENT_NAME: "ABC Pvt Ltd",
    CLIENT_ADDRESS: "Bengaluru",
    GST: "TRUE",
    ITEMS: "Consulting | Digital work | 2 | 1,500.50\nSupport |  | 1 | 500",
  });
  assert.equal(data.gst, true);
  assert.deepEqual(data.client, { name: "ABC Pvt Ltd", address: "Bengaluru" });
  assert.deepEqual(data.items, [
    { title: "Consulting", description: "Digital work", qty: 2, rate: 1500.5 },
    { title: "Support", qty: 1, rate: 500 },
  ]);
});

test("GST is off unless the value is true", () => {
  assert.equal(dataFromEnv(loadSchema("invoice"), { GST: "false" }).gst, false);
  assert.equal(dataFromEnv(loadSchema("invoice"), { GST: "yes" }).gst, false);
});

test("a malformed item line reports the variable, expected parts and the line", () => {
  assert.throws(
    () => dataFromEnv(loadSchema("invoice"), { ITEMS: "X | Y | 1" }),
    /ITEMS line must have 4 parts "title \| description \| qty \| rate": "X \| Y \| 1"/
  );
  assert.throws(
    () => dataFromEnv(loadSchema("invoice"), { ITEMS: "X | Y | two | 100" }),
    /ITEMS qty must be a number in line "X \| Y \| two \| 100"/
  );
});

test("string arrays read one entry per line", () => {
  const data = dataFromEnv(loadSchema("welcome-kit"), { IT_ASSETS: "Laptop\nVPN access" });
  assert.deepEqual(data.itAssets, ["Laptop", "VPN access"]);
});

test("missingEnvVars lists required variables by their script names, including nested", () => {
  const missing = missingEnvVars(loadSchema("invoice"), { client: { name: "A" } });
  assert.deepEqual(missing, ["CLIENT_ADDRESS", "ITEMS"]);
});

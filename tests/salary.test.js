"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { computeSalary } = require("../src/salary");

test("full month, no LOP: CTC 12,00,000 with auto special allowance", () => {
  const result = computeSalary({
    annualCtc: 1200000,
    structure: {
      basicPercent: 40,
      hraPercentOfBasic: 50,
      specialAllowance: "auto",
      pfEmployeePercent: 12,
      professionalTax: 200,
      tdsMonthly: 5000,
    },
    payableDays: 30,
    lopDays: 0,
  });

  assert.equal(result.basicMonthly, 40000);
  assert.equal(result.hraMonthly, 20000);
  assert.equal(result.specialAllowanceMonthly, 40000);
  assert.equal(result.grossMonthly, 100000);
  assert.equal(result.pfMonthly, 4800);
  assert.equal(result.professionalTax, 200);
  assert.equal(result.tdsMonthly, 5000);
  assert.equal(result.totalDeductions, 10000);
  assert.equal(result.netPay, 90000);
  assert.equal(result.netPayWords, "Rupees Ninety Thousand Only");
  assert.equal(result.basicAnnual, 480000);
  assert.equal(result.hraAnnual, 240000);
  assert.equal(result.specialAllowanceAnnual, 480000);
  assert.equal(result.grossAnnual, 1200000);
});

test("LOP proration: 2 days unpaid out of 30", () => {
  const result = computeSalary({
    annualCtc: 1200000,
    structure: {
      basicPercent: 40,
      hraPercentOfBasic: 50,
      specialAllowance: "auto",
      pfEmployeePercent: 12,
      professionalTax: 200,
      tdsMonthly: 5000,
    },
    payableDays: 28,
    lopDays: 2,
  });

  assert.equal(result.basicMonthly, 37333);
  assert.equal(result.hraMonthly, 18667);
  assert.equal(result.specialAllowanceMonthly, 37333);
  assert.equal(result.grossMonthly, 93333);
  assert.equal(result.pfMonthly, 4480);
  assert.equal(result.totalDeductions, 9680);
  assert.equal(result.netPay, 83653);
});

test("extra earnings and deductions add flat (unprorated) amounts to totals and rows", () => {
  const result = computeSalary({
    annualCtc: 1200000,
    structure: {
      basicPercent: 40,
      hraPercentOfBasic: 50,
      specialAllowance: "auto",
      pfEmployeePercent: 12,
      professionalTax: 200,
      tdsMonthly: 5000,
    },
    payableDays: 30,
    lopDays: 0,
    extraEarnings: [
      { label: "LTA", amount: 5000 },
      { label: "Gadget Allowance", amount: 2000 },
    ],
    extraDeductions: [{ label: "Mediclaim Add-on", amount: 1200 }],
  });

  // gross = 100000 (base) + 5000 + 2000 = 107000
  assert.equal(result.grossMonthly, 107000);
  // deductions = 10000 (base) + 1200 = 11200
  assert.equal(result.totalDeductions, 11200);
  assert.equal(result.netPay, 95800);

  assert.deepEqual(result.earningsRows, [
    { label: "Basic", monthly: 40000 },
    { label: "HRA", monthly: 20000 },
    { label: "Special Allowance", monthly: 40000 },
    { label: "LTA", monthly: 5000 },
    { label: "Gadget Allowance", monthly: 2000 },
  ]);
  assert.deepEqual(result.deductionsRows, [
    { label: "Provident Fund", monthly: 4800 },
    { label: "Professional Tax", monthly: 200 },
    { label: "TDS", monthly: 5000 },
    { label: "Mediclaim Add-on", monthly: 1200 },
  ]);

  // The formal CTC structure (used by the salary-structure letter) must
  // stay unaffected by ad-hoc monthly extras — those belong on the
  // payslip only, so its Monthly/Annual columns stay internally consistent.
  assert.equal(result.structuralGrossMonthly, 100000);
  assert.equal(result.structuralDeductionsMonthly, 10000);
  assert.equal(result.structuralNetPay, 90000);
});

test("calendar-days fields default sensibly and pass through when given", () => {
  const defaults = computeSalary({
    annualCtc: 1200000,
    structure: {
      basicPercent: 40,
      hraPercentOfBasic: 50,
      specialAllowance: "auto",
      pfEmployeePercent: 12,
      professionalTax: 200,
      tdsMonthly: 5000,
    },
    payableDays: 30,
    lopDays: 0,
  });
  assert.equal(defaults.calendarDays, 30);
  assert.equal(defaults.arrearDays, 0);
  assert.equal(defaults.lopReversalDays, 0);

  const withOverrides = computeSalary({
    annualCtc: 1200000,
    structure: {
      basicPercent: 40,
      hraPercentOfBasic: 50,
      specialAllowance: "auto",
      pfEmployeePercent: 12,
      professionalTax: 200,
      tdsMonthly: 5000,
    },
    payableDays: 31,
    lopDays: 0,
    calendarDays: 31,
    arrearDays: 2,
    lopReversalDays: 1,
  });
  assert.equal(withOverrides.calendarDays, 31);
  assert.equal(withOverrides.arrearDays, 2);
  assert.equal(withOverrides.lopReversalDays, 1);
});

test("fixed (non-auto) special allowance is respected as-is before proration", () => {
  const result = computeSalary({
    annualCtc: 600000,
    structure: {
      basicPercent: 50,
      hraPercentOfBasic: 40,
      specialAllowance: 5000,
      pfEmployeePercent: 12,
      professionalTax: 200,
      tdsMonthly: 0,
    },
    payableDays: 30,
    lopDays: 0,
  });

  // basic = 600000*0.5/12 = 25000, hra = 25000*0.4 = 10000
  assert.equal(result.basicMonthly, 25000);
  assert.equal(result.hraMonthly, 10000);
  assert.equal(result.specialAllowanceMonthly, 5000);
  assert.equal(result.grossMonthly, 40000);
});

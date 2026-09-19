"use strict";

const { amountInWords } = require("./helpers");

function round(n) {
  return Math.round(n);
}

// Computes a monthly salary breakdown (payslip figures) from an annual CTC
// and a percentage-based structure. LOP days prorate earnings (basic, HRA,
// special allowance); statutory deductions (PT, TDS) stay fixed per plan,
// while PF is recomputed off the prorated basic.
function sumAmounts(items) {
  return items.reduce((total, item) => total + item.amount, 0);
}

// Computes a monthly salary breakdown (payslip figures) from an annual CTC
// and a percentage-based structure. LOP days prorate the core earnings
// (basic, HRA, special allowance); statutory deductions (PT, TDS) stay
// fixed per plan, while PF is recomputed off the prorated basic.
//
// `extraEarnings` / `extraDeductions` are optional flat (non-prorated) line
// items — e.g. LTA, gadget allowance, mediclaim add-on — for payslips that
// need more detail than the basic/HRA/special-allowance/PF/PT/TDS default.
function computeSalary(data) {
  const {
    annualCtc,
    structure,
    payableDays = 30,
    lopDays = 0,
    extraEarnings = [],
    extraDeductions = [],
    calendarDays,
    arrearDays = 0,
    lopReversalDays = 0,
  } = data;

  const basicMonthlyFull = (annualCtc * structure.basicPercent) / 100 / 12;
  const hraMonthlyFull = (basicMonthlyFull * structure.hraPercentOfBasic) / 100;
  const grossMonthlyFull = annualCtc / 12;
  const specialAllowanceFull =
    structure.specialAllowance === "auto"
      ? Math.max(0, grossMonthlyFull - basicMonthlyFull - hraMonthlyFull)
      : structure.specialAllowance;

  const totalDaysInMonth = payableDays + lopDays || 30;
  const prorationFactor =
    totalDaysInMonth > 0 ? payableDays / totalDaysInMonth : 1;

  const basicMonthly = round(basicMonthlyFull * prorationFactor);
  const hraMonthly = round(hraMonthlyFull * prorationFactor);
  const specialAllowanceMonthly = round(specialAllowanceFull * prorationFactor);
  const extraEarningsTotal = sumAmounts(extraEarnings);
  const grossMonthly =
    basicMonthly + hraMonthly + specialAllowanceMonthly + extraEarningsTotal;

  const pfMonthly = round((basicMonthly * structure.pfEmployeePercent) / 100);
  const professionalTax = structure.professionalTax;
  const tdsMonthly = structure.tdsMonthly;
  const extraDeductionsTotal = sumAmounts(extraDeductions);
  const totalDeductions =
    pfMonthly + professionalTax + tdsMonthly + extraDeductionsTotal;

  const netPay = grossMonthly - totalDeductions;

  const earningsRows = [
    { label: "Basic", monthly: basicMonthly },
    { label: "HRA", monthly: hraMonthly },
    { label: "Special Allowance", monthly: specialAllowanceMonthly },
    ...extraEarnings.map((e) => ({ label: e.label, monthly: e.amount })),
  ];
  const deductionsRows = [
    { label: "Provident Fund", monthly: pfMonthly },
    { label: "Professional Tax", monthly: professionalTax },
    { label: "TDS", monthly: tdsMonthly },
    ...extraDeductions.map((d) => ({ label: d.label, monthly: d.amount })),
  ];

  // The formal CTC structure, excluding ad-hoc monthly extras — this is
  // what the salary-structure (CTC breakup) letter shows, so its Monthly
  // and Annual columns stay internally consistent with each other.
  // Payslip.html uses the extras-inclusive totals above instead.
  const structuralGrossMonthly = basicMonthly + hraMonthly + specialAllowanceMonthly;
  const structuralDeductionsMonthly = pfMonthly + professionalTax + tdsMonthly;
  const structuralNetPay = structuralGrossMonthly - structuralDeductionsMonthly;

  return {
    basicMonthly,
    hraMonthly,
    specialAllowanceMonthly,
    extraEarningsTotal,
    grossMonthly,
    pfMonthly,
    professionalTax,
    tdsMonthly,
    extraDeductionsTotal,
    totalDeductions,
    netPay,
    netPayWords: amountInWords(netPay),
    structuralGrossMonthly,
    structuralDeductionsMonthly,
    structuralNetPay,
    structuralNetPayWords: amountInWords(structuralNetPay),
    earningsRows,
    deductionsRows,
    payableDays,
    lopDays,
    calendarDays: calendarDays !== undefined ? calendarDays : totalDaysInMonth,
    arrearDays,
    lopReversalDays,
    // Full (un-prorated) annual figures, for the salary-structure document.
    basicAnnual: round(basicMonthlyFull * 12),
    hraAnnual: round(hraMonthlyFull * 12),
    specialAllowanceAnnual: round(specialAllowanceFull * 12),
    grossAnnual: round(basicMonthlyFull * 12 + hraMonthlyFull * 12 + specialAllowanceFull * 12),
  };
}

module.exports = { computeSalary };

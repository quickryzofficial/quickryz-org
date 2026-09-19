"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  formatDate,
  formatMonthYear,
  formatCurrency,
  formatIndianNumber,
  amountInWords,
} = require("../src/helpers");

test("formatDate renders ISO date without timezone shift", () => {
  assert.equal(formatDate("2026-07-27"), "27 July 2026");
  assert.equal(formatDate("2026-01-01"), "1 January 2026");
});

test("formatMonthYear renders YYYY-MM", () => {
  assert.equal(formatMonthYear("2026-07"), "July 2026");
});

test("formatIndianNumber uses lakh/crore grouping", () => {
  assert.equal(formatIndianNumber(1200000), "12,00,000");
  assert.equal(formatIndianNumber(100000), "1,00,000");
  assert.equal(formatIndianNumber(999), "999");
  assert.equal(formatIndianNumber(83653), "83,653");
});

test("formatCurrency prefixes rupee symbol", () => {
  assert.equal(formatCurrency(1200000), "₹12,00,000");
});

test("amountInWords spells out Indian numbering", () => {
  assert.equal(amountInWords(90000), "Rupees Ninety Thousand Only");
  assert.equal(amountInWords(1200000), "Rupees Twelve Lakh Only");
  assert.equal(
    amountInWords(1500000),
    "Rupees Fifteen Lakh Only"
  );
  assert.equal(amountInWords(83653), "Rupees Eighty Three Thousand Six Hundred Fifty Three Only");
});

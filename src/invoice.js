"use strict";

const fs = require("fs");

// Money is kept in rupees with 2 decimals (paise). Rounding goes through
// integer paise so 0.1 + 0.2 style float noise never reaches the PDF.
// toPrecision(15) first strips binary error (3 * 333.335 = 1000.00499…)
// so exact halves round up as they would on paper.
function roundPaise(amount) {
  return Math.round(Number((Number(amount) * 100).toPrecision(15))) / 100;
}

function sumPaise(values) {
  return values.reduce((paise, v) => paise + Math.round(v * 100), 0) / 100;
}

function normaliseState(state) {
  return String(state || "").trim().toLowerCase();
}

// Decides the GST split from the supplier's registered state vs the
// client's place of supply: same state -> CGST + SGST, else IGST.
function resolveGstType(data, company) {
  if (!data.gst) return "none";
  if (!company.gstin) {
    throw new Error(
      "GST=true but config/company.json has no gstin. Add QuickRyz's GSTIN before issuing a tax invoice."
    );
  }
  if (!company.gstState) {
    throw new Error("GST=true but config/company.json has no gstState (the state of the GST registration).");
  }
  const clientState = normaliseState(data.client && data.client.state);
  if (!clientState) {
    throw new Error("GST=true needs CLIENT_STATE (the client's place of supply) to pick CGST/SGST vs IGST.");
  }
  return clientState === normaliseState(company.gstState) ? "intra" : "inter";
}

// Pure calculation: line amounts, subtotal, tax lines and grand total.
function computeInvoice(data, company) {
  const gstType = resolveGstType(data, company);
  const rate = Number((company.invoice && company.invoice.gstRate) ?? 18);

  const lines = data.items.map((item, i) => ({
    ...item,
    index: i + 1,
    amount: roundPaise(item.qty * item.rate),
  }));
  const subtotal = sumPaise(lines.map((l) => l.amount));

  let taxLines = [];
  if (gstType === "intra") {
    const half = rate / 2;
    const halfAmount = roundPaise((subtotal * half) / 100);
    taxLines = [
      { label: `CGST @ ${half}%`, amount: halfAmount },
      { label: `SGST @ ${half}%`, amount: halfAmount },
    ];
  } else if (gstType === "inter") {
    taxLines = [{ label: `IGST @ ${rate}%`, amount: roundPaise((subtotal * rate) / 100) }];
  }

  const taxTotal = sumPaise(taxLines.map((t) => t.amount));
  return {
    gstType,
    gstRate: rate,
    lines,
    subtotal,
    taxLines,
    taxTotal,
    total: sumPaise([subtotal, taxTotal]),
  };
}

// "YYYY-MM-DD" + n days, computed in UTC so no timezone shift creeps in.
function addDays(isoDate, days) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

// Today's date in the machine's local timezone (not UTC, which would give
// yesterday's date before 05:30 IST).
function localTodayIso() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function readCounter(counterPath) {
  if (!fs.existsSync(counterPath)) return {};
  return JSON.parse(fs.readFileSync(counterPath, "utf8"));
}

// Highest sequence already used for `prefix-year`, judged from existing PDF
// filenames — a safety net so a deleted counter file never reissues a number.
function highestIssuedInOutput(outputDir, prefix, year) {
  if (!fs.existsSync(outputDir)) return 0;
  const pattern = new RegExp(`${prefix}-${year}-(\\d+)`);
  return fs.readdirSync(outputDir).reduce((max, name) => {
    const match = name.match(pattern);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
}

// Returns the next number without saving it; call saveInvoiceCounter()
// only once the PDF is written, so a failed run doesn't burn a number.
function nextInvoiceNumber({ counterPath, outputDir, prefix, year }) {
  const counter = readCounter(counterPath);
  const last = Math.max(counter[year] || 0, highestIssuedInOutput(outputDir, prefix, year));
  const sequence = last + 1;
  return {
    year,
    sequence,
    invoiceNumber: `${prefix}-${year}-${String(sequence).padStart(3, "0")}`,
  };
}

function saveInvoiceCounter(counterPath, { year, sequence }) {
  const counter = readCounter(counterPath);
  counter[year] = Math.max(counter[year] || 0, sequence);
  fs.writeFileSync(counterPath, `${JSON.stringify(counter, null, 2)}\n`);
}

module.exports = {
  computeInvoice,
  resolveGstType,
  addDays,
  localTodayIso,
  nextInvoiceNumber,
  saveInvoiceCounter,
};

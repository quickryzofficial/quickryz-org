"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  computeInvoice,
  nextInvoiceNumber,
  findInvoiceFile,
  addDays,
} = require("../src/invoice");

const company = {
  gstin: "29ABCDE1234F1Z5",
  gstState: "Karnataka",
  invoice: { gstRate: 18 },
};

const items = [
  { title: "Software Development", qty: 1, rate: 75000 },
  { title: "QA Automation", qty: 1, rate: 25000 },
];

test("GST off: total equals subtotal, no tax lines", () => {
  const r = computeInvoice({ items, gst: false, client: { state: "Karnataka" } }, company);
  assert.equal(r.subtotal, 100000);
  assert.deepEqual(r.taxLines, []);
  assert.equal(r.taxTotal, 0);
  assert.equal(r.total, 100000);
  assert.equal(r.gstType, "none");
});

test("GST on, same state: CGST 9% + SGST 9%", () => {
  const r = computeInvoice({ items, gst: true, client: { state: " karnataka " } }, company);
  assert.equal(r.gstType, "intra");
  assert.deepEqual(r.taxLines, [
    { label: "CGST @ 9%", amount: 9000 },
    { label: "SGST @ 9%", amount: 9000 },
  ]);
  assert.equal(r.total, 118000);
});

test("GST on, different state: IGST 18%", () => {
  const r = computeInvoice({ items, gst: true, client: { state: "Maharashtra" } }, company);
  assert.equal(r.gstType, "inter");
  assert.deepEqual(r.taxLines, [{ label: "IGST @ 18%", amount: 18000 }]);
  assert.equal(r.total, 118000);
});

test("line amounts use qty x rate and round to paise", () => {
  const r = computeInvoice(
    { items: [{ title: "Hours", qty: 3, rate: 333.335 }], gst: true, client: { state: "Goa" } },
    company
  );
  assert.equal(r.lines[0].amount, 1000.01);
  assert.equal(r.subtotal, 1000.01);
  assert.equal(r.taxLines[0].amount, 180);
  assert.equal(r.total, 1180.01);
});

test("CGST/SGST halves are rounded individually and still sum into total", () => {
  const r = computeInvoice(
    { items: [{ title: "X", qty: 1, rate: 100.05 }], gst: true, client: { state: "Karnataka" } },
    company
  );
  // 9% of 100.05 = 9.0045 -> 9.00 each
  assert.equal(r.taxLines[0].amount, 9);
  assert.equal(r.taxLines[1].amount, 9);
  assert.equal(r.total, 118.05);
});

test("GST on without a company GSTIN is refused", () => {
  assert.throws(
    () => computeInvoice({ items, gst: true, client: { state: "Goa" } }, { ...company, gstin: "" }),
    /gstin/i
  );
});

test("GST on without a client state is refused", () => {
  assert.throws(() => computeInvoice({ items, gst: true, client: {} }, company), /CLIENT_STATE/);
});

test("addDays crosses month and year boundaries", () => {
  assert.equal(addDays("2026-09-19", 15), "2026-10-04");
  assert.equal(addDays("2026-12-25", 10), "2027-01-04");
});

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "invoice-test-"));
}

function outDirWith(...files) {
  const dir = path.join(tmpDir(), "invoice");
  fs.mkdirSync(dir);
  for (const f of files) fs.writeFileSync(path.join(dir, f), "");
  return dir;
}

test("first invoice of the year is 001, including when the folder doesn't exist yet", () => {
  const missing = path.join(tmpDir(), "no-such-dir");
  assert.equal(nextInvoiceNumber({ outputDir: missing, prefix: "QR-INV", year: 2026 }), "QR-INV-2026-001");
});

test("next number is the highest existing invoice + 1", () => {
  const dir = outDirWith(
    "Invoice_QR-INV-2026-001_Acme.pdf",
    "Invoice_QR-INV-2026-007_Beta-Corp.pdf",
    "Invoice_QR-INV-2026-003_Acme.pdf"
  );
  assert.equal(nextInvoiceNumber({ outputDir: dir, prefix: "QR-INV", year: 2026 }), "QR-INV-2026-008");
});

test("deleting the latest invoice frees its number for the regenerated one", () => {
  const dir = outDirWith("Invoice_QR-INV-2026-001_Acme.pdf", "Invoice_QR-INV-2026-002_Wrong.pdf");
  fs.unlinkSync(path.join(dir, "Invoice_QR-INV-2026-002_Wrong.pdf"));
  assert.equal(nextInvoiceNumber({ outputDir: dir, prefix: "QR-INV", year: 2026 }), "QR-INV-2026-002");
});

test("other years, other prefixes and non-PDF files are ignored", () => {
  const dir = outDirWith(
    "Invoice_QR-INV-2025-042_Acme.pdf",
    "Invoice_OLD-INV-2026-099_Acme.pdf",
    "Invoice_QR-INV-2026-050_Acme.pdf.bak",
    "Invoice_QR-INV-2026-004_Acme.pdf"
  );
  assert.equal(nextInvoiceNumber({ outputDir: dir, prefix: "QR-INV", year: 2026 }), "QR-INV-2026-005");
  assert.equal(nextInvoiceNumber({ outputDir: dir, prefix: "QR-INV", year: 2027 }), "QR-INV-2027-001");
});

test("sequence keeps growing past 999", () => {
  const dir = outDirWith("Invoice_QR-INV-2026-999_Acme.pdf");
  assert.equal(nextInvoiceNumber({ outputDir: dir, prefix: "QR-INV", year: 2026 }), "QR-INV-2026-1000");
});

test("findInvoiceFile finds an existing PDF for a number, whatever the client", () => {
  const dir = outDirWith("Invoice_QR-INV-2026-003_Acme.pdf");
  assert.equal(findInvoiceFile(dir, "QR-INV-2026-003"), path.join(dir, "Invoice_QR-INV-2026-003_Acme.pdf"));
  assert.equal(findInvoiceFile(dir, "QR-INV-2026-004"), null);
  assert.equal(findInvoiceFile(path.join(dir, "missing"), "QR-INV-2026-003"), null);
});

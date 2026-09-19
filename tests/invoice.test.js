"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  computeInvoice,
  nextInvoiceNumber,
  saveInvoiceCounter,
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

test("invoice numbers start at 001 and increment per year", () => {
  const dir = tmpDir();
  const counter = path.join(dir, "counter.json");
  const outDir = path.join(dir, "out");
  const first = nextInvoiceNumber({ counterPath: counter, outputDir: outDir, prefix: "QR-INV", year: 2026 });
  assert.equal(first.invoiceNumber, "QR-INV-2026-001");
  saveInvoiceCounter(counter, first);
  const second = nextInvoiceNumber({ counterPath: counter, outputDir: outDir, prefix: "QR-INV", year: 2026 });
  assert.equal(second.invoiceNumber, "QR-INV-2026-002");
  saveInvoiceCounter(counter, second);
  const nextYear = nextInvoiceNumber({ counterPath: counter, outputDir: outDir, prefix: "QR-INV", year: 2027 });
  assert.equal(nextYear.invoiceNumber, "QR-INV-2027-001");
});

test("a lost counter file never reuses a number already present in output", () => {
  const dir = tmpDir();
  const outDir = path.join(dir, "out");
  fs.mkdirSync(outDir);
  fs.writeFileSync(path.join(outDir, "Invoice_QR-INV-2026-007_Acme.pdf"), "");
  const n = nextInvoiceNumber({
    counterPath: path.join(dir, "missing.json"),
    outputDir: outDir,
    prefix: "QR-INV",
    year: 2026,
  });
  assert.equal(n.invoiceNumber, "QR-INV-2026-008");
});

"use strict";

const fs = require("fs");
const path = require("path");
const Handlebars = require("handlebars");
const helpers = require("./helpers");
const { getTypeConfig, ROOT } = require("./registry");
const { validateData } = require("./validate");
const invoice = require("./invoice");

let helpersRegistered = false;
function registerHelpers() {
  if (helpersRegistered) return;
  Handlebars.registerHelper("formatDate", helpers.formatDate);
  Handlebars.registerHelper("formatMonthYear", helpers.formatMonthYear);
  Handlebars.registerHelper("formatCurrency", helpers.formatCurrency);
  Handlebars.registerHelper("amountInWords", helpers.amountInWords);
  Handlebars.registerHelper("formatMoney", helpers.formatMoney);
  Handlebars.registerHelper("amountInWordsWithPaise", helpers.amountInWordsWithPaise);
  Handlebars.registerHelper("eq", (a, b) => a === b);
  helpersRegistered = true;
}

// Chromium refuses to load file:// resources into a page created via
// page.setContent() (its origin is about:blank, and cross-scheme local
// file access is blocked). Embedding images as base64 data URIs sidesteps
// that entirely and needs no navigation/temp-file workaround.
function imageToDataUri(absPath) {
  const buf = fs.readFileSync(absPath);
  const ext = path.extname(absPath).slice(1) || "png";
  return `data:image/${ext};base64,${buf.toString("base64")}`;
}

function loadCompanyConfig() {
  const companyPath = path.join(ROOT, "config", "company.json");
  const raw = fs.readFileSync(companyPath, "utf8");
  const company = JSON.parse(raw);
  if (company.logo) {
    company.logoAbsolute = imageToDataUri(path.join(ROOT, company.logo));
  }
  if (company.brandLogo) {
    company.brandLogoAbsolute = imageToDataUri(path.join(ROOT, company.brandLogo));
  }
  if (company.signatory && company.signatory.signatureImage) {
    const sigPath = path.join(ROOT, company.signatory.signatureImage);
    company.signatory.signatureAbsolute = fs.existsSync(sigPath)
      ? imageToDataUri(sigPath)
      : null;
  }
  return company;
}

function loadJsonFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Input JSON file not found: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, "utf8");
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Invalid JSON in ${filePath}: ${err.message}`);
  }
}

// Slugify a full name for output filenames: "Rahul Sharma" -> "Rahul-Sharma"
function slugifyName(name) {
  return String(name || "Unknown")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "");
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function buildOutputPath(typeId, data, options = {}) {
  const cfg = getTypeConfig(typeId);
  const name = slugifyName(
    data.employeeName || data.candidateName || data.recipientName
  );
  const dateTag = options.month || todayIso();
  // Certificates like course/appreciation only need a recipientName, not an
  // employeeId — omit that segment instead of printing a placeholder.
  const parts = [cfg.outPrefix, data.employeeId, name, dateTag].filter(Boolean);
  const fileName = `${parts.join("_")}.pdf`;
  const outDir = path.join(ROOT, "output", typeId);
  fs.mkdirSync(outDir, { recursive: true });
  return path.join(outDir, fileName);
}

// Renders `typeId` from `data` (a plain object, already validated or to be
// validated) to an HTML string. Exposed separately from generate() so
// callers (like the payslip CLI command) can inject computed fields
// (e.g. salary breakdown) before rendering.
function renderHtml(typeId, data) {
  registerHelpers();
  const cfg = getTypeConfig(typeId);
  const templatePath = path.join(ROOT, "templates", cfg.template);
  const templateSource = fs.readFileSync(templatePath, "utf8");
  const template = Handlebars.compile(templateSource);
  const company = loadCompanyConfig();
  const styles = fs.readFileSync(
    path.join(ROOT, "templates", "assets", "styles.css"),
    "utf8"
  );
  return template({ ...data, company, styles });
}

async function htmlToPdf(html, outputPath, { landscape = false } = {}) {
  const puppeteer = require("puppeteer");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.pdf({
      path: outputPath,
      format: "A4",
      landscape,
      printBackground: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
    });
  } finally {
    await browser.close();
  }
}

// Generates one document: validates `data` against the type's schema,
// renders the template, prints it to a PDF, and returns the absolute path.
async function generate(typeId, data, options = {}) {
  const cfg = getTypeConfig(typeId);
  validateData(typeId, data);
  const html = renderHtml(typeId, data);
  const outputPath = options.outputPath || buildOutputPath(typeId, data, options);
  await htmlToPdf(html, outputPath, { landscape: cfg.landscape });
  return outputPath;
}

// Generates an invoice PDF: fills in number/dates, computes totals and GST,
// renders, and writes the PDF to output/invoice/.
async function generateInvoice(data) {
  validateData("invoice", data);
  const company = loadCompanyConfig();
  const settings = company.invoice || {};
  const dueDays = settings.dueDays ?? 15;
  const invoiceDate = data.invoiceDate || invoice.localTodayIso();
  const dueDate = data.dueDate || invoice.addDays(invoiceDate, dueDays);

  const outDir = path.join(ROOT, "output", "invoice");
  const invoiceNumber =
    data.invoiceNumber ||
    invoice.nextInvoiceNumber({
      outputDir: outDir,
      prefix: settings.prefix || "INV",
      year: Number(invoiceDate.slice(0, 4)),
    });
  // A manual number must not duplicate an issued invoice (auto numbers can't).
  const existing = invoice.findInvoiceFile(outDir, invoiceNumber);
  if (existing) {
    throw new Error(
      `Invoice ${invoiceNumber} already exists: ${existing}\n` +
        "Delete that PDF first if you are regenerating it, or clear INVOICE_NUMBER to use the next number."
    );
  }

  const totals = invoice.computeInvoice(data, company);
  const html = renderHtml("invoice", {
    ...data,
    invoiceNumber,
    invoiceDate,
    dueDate,
    dueDays,
    totals,
    isTaxInvoice: totals.gstType !== "none",
    isIntraState: totals.gstType === "intra",
    sacCode: settings.sacCode,
    notes: data.notes || settings.notes || [],
  });

  fs.mkdirSync(outDir, { recursive: true });
  const outputPath = path.join(
    outDir,
    `Invoice_${invoiceNumber}_${slugifyName(data.client.name)}.pdf`
  );
  await htmlToPdf(html, outputPath);

  const bank = company.bank || {};
  const warnings = [];
  if (!bank.bankName || !bank.accountNumber || !bank.ifsc) {
    warnings.push("Bank details (bankName/accountNumber/ifsc) are blank in config/company.json.");
  }
  return { outputPath, invoiceNumber, total: totals.total, warnings };
}

module.exports = {
  generate,
  generateInvoice,
  renderHtml,
  loadCompanyConfig,
  loadJsonFile,
  buildOutputPath,
  slugifyName,
};

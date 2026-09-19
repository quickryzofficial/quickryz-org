# hrgen — QuickRyz Document Generator

Turn a few filled-in values into a ready-to-share QuickRyz PDF: offer letters,
appointment letters, payslips, certificates and client invoices — all of it. No AI, no internet
connection needed once it's installed. Everything runs on your own machine.

---

## What you can generate

| Command type | Document |
|---|---|
| `offer-letter` | Offer Letter |
| `appointment-letter` | Appointment Letter |
| `joining-letter` | Joining Letter |
| `welcome-kit` | Welcome Kit (2-page onboarding pack) |
| `hike-letter` | Hike / Increment Letter |
| `salary-structure` | Salary Structure (CTC breakup) |
| `payslip` | Monthly Payslip |
| `experience-letter` | Experience Certificate |
| `internship-certificate` | Internship Certificate |
| `course-certificate` | Course Completion Certificate |
| `appreciation-certificate` | Appreciation Certificate (Above & Beyond) |
| `invoice` | Client Invoice / Tax Invoice (with optional GST) |

Run `node bin/hrgen.js list` any time to see this list from the tool itself.

---

## 1. One-time setup

You only do this once per machine.

**Requirements:** [Node.js](https://nodejs.org) version 18 or newer. Check with:

```bash
node -v
```

**Install:**

```bash
cd QuickRyz-Org
npm install
```

That's it. `npm install` also downloads a private copy of Chrome (used only
to turn HTML into a PDF) — this can take a few minutes the first time
depending on your internet speed, but only happens once.

**(Optional) Make `hrgen` a plain command** so you can type `hrgen ...`
instead of `node bin/hrgen.js ...`:

```bash
npm link
```

The rest of this guide uses `hrgen`; if you skipped `npm link`, just
replace `hrgen` with `node bin/hrgen.js` everywhere below.

---

## 2. Set your company details once

Open [`config/company.json`](config/company.json) — it already holds the
QuickRyz details (legal name, offices, CIN, website, email, mobile, signatory).
Every document uses it automatically, so you never repeat it.

Before issuing invoices, fill in the blanks:

| Field | What to put |
|---|---|
| `bank.bankName`, `bank.accountNumber`, `bank.ifsc` (and optional `branch`, `upi`) | Printed under **Payment Details** on every invoice. Until filled, invoices show "—" and a warning is printed. |
| `gstin`, `gstState` | QuickRyz's GSTIN and the state it is registered in (e.g. `"Karnataka"`). Required only when you bill with `GST=true`. |
| `invoice.sacCode` | SAC code shown on tax invoices (default `998314`, IT design & development services — confirm with your CA). |
| `invoice.gstRate`, `invoice.dueDays`, `invoice.prefix`, `invoice.notes` | GST % (default 18), payment terms in days (15), invoice number prefix (`QR-INV`), extra lines under Notes & Terms. |

Branding images live in [`templates/assets/`](templates/assets/):
`brand-logo.png` (QuickRyz wordmark, used in every document header) and
`logo.png` (the Q mark). Replace them with same-named files to rebrand.

---

## 3. Quickest way: the Quick-Generation scripts

[`Quick-Generation/`](Quick-Generation/) has one ready-to-run script per
document. Open the script, change the values at the top, and run it — no JSON
needed:

```bash
./Quick-Generation/generate-invoice.sh
```

| Script | Produces |
|---|---|
| `generate-invoice.sh` | Client invoice (auto-numbered, GST on/off) |
| `generate-offer-letter.sh` | Offer Letter |
| `generate-appointment-letter.sh` | Appointment Letter |
| `generate-joining-letter.sh` | Joining Letter |
| `generate-welcome-kit.sh` | Welcome Kit |
| `generate-onboarding-kit.sh` | Offer + Appointment + Joining + Welcome Kit in one go |
| `generate-hike-letter.sh` | Hike / Increment Letter |
| `generate-salary-structure.sh` | Salary Structure |
| `generate-payslip.sh` | Payslip (defaults to the current month) |
| `generate-experience-letter.sh` | Experience Certificate |
| `generate-internship-certificate.sh` | Internship Certificate |
| `generate-course-certificate.sh` | Course Completion Certificate |
| `generate-appreciation-certificate.sh` | Appreciation Certificate |

How the values work:
- Each variable is the JSON field in `UPPER_SNAKE` form (`CANDIDATE_NAME` →
  `candidateName`, `STRUCTURE_BASIC_PERCENT` → `structure.basicPercent`).
- Leave an optional value as `""` to skip it. If a required one is blank the
  script stops and names it: `Please set these variables in the script: PAN`.
- Lists are written one entry per line inside `( ... )`; rows with several
  columns use `|` between them, e.g. `"LTA | 5000"`.
- Dates default to today where that makes sense (`LETTER_DATE="$(date +%F)"`).

Copy a script (e.g. `generate-invoice-acme.sh`) to keep one per client or
employee.

### Invoices

At the top of `generate-invoice.sh`:

```bash
CLIENT_NAME="ABC Technologies Private Limited"   # leave "" to be asked
CLIENT_ADDRESS="123 Business Park, Bengaluru, Karnataka – 560001"
GST=false                  # true -> GST calculated and added automatically
CLIENT_STATE="Karnataka"   # place of supply, decides the GST split
```

- **`GST=false`** (default): total = subtotal, no tax lines.
- **`GST=true`**: the invoice becomes a **TAX INVOICE** with a SAC column and
  place of supply. If `CLIENT_STATE` matches `gstState` in the config it adds
  CGST 9% + SGST 9%, otherwise IGST 18%. It refuses to run while `gstin` is
  blank in the config, so an invalid tax invoice is never issued.
- **Numbering** is automatic: `QR-INV-2026-001`, `-002`, … restarting each
  year. The counter lives in `data/invoice-counter.json` and only advances
  after a PDF is written; it also checks `output/invoice/` so a deleted
  counter never reuses a number. Set `INVOICE_NUMBER` to override.
- **Dates**: invoice date = today, due date = today + `dueDays` (override with
  `INVOICE_DATE` / `DUE_DATE`).
- Output: `output/invoice/Invoice_QR-INV-2026-001_ABC-Technologies-Private-Limited.pdf`

The same invoice can be made from JSON with
`hrgen invoice data/samples/invoice.sample.json`.

---

## 4. Generate from a JSON file

Every document type has a ready-made example in [`data/samples/`](data/samples/).
The fastest way to learn the tool is to copy one, edit a few fields, and run it.

```bash
# 1. Copy the sample for the document you need
cp data/samples/offer-letter.sample.json data/offer-letter/EMP001_Rahul-Sharma.json

# 2. Open that new file and edit the fields (name, designation, CTC, dates...)

# 3. Generate the PDF
hrgen generate offer-letter data/offer-letter/EMP001_Rahul-Sharma.json
```

You'll see:

```
Generated: output/offer-letter/OfferLetter_EMP001_Rahul-Sharma_2026-07-27.pdf
```

Open that PDF — it's ready to email or print.

---

## 5. Everyday commands

### See every document type

```bash
hrgen list
```

### Check a JSON file before generating (catches typos and missing fields)

```bash
hrgen validate data/offer-letter/EMP001_Rahul-Sharma.json --type offer-letter
```

### Generate one document

```bash
hrgen generate <type> <path-to-json>
```

Example:

```bash
hrgen generate experience-letter data/experience-letter/EMP014_Meena-Rao.json
```

### Generate the whole onboarding bundle in one shot

Instead of running offer, appointment, joining, and welcome-kit separately,
fill **one** JSON with the combined fields and run:

```bash
hrgen kit data/offer-letter/EMP001_Rahul-Sharma.json
```

This produces all four PDFs at once.

### Generate a payslip (needs a month)

The same salary JSON works for every month — just tell it which one:

```bash
hrgen generate payslip data/salary-structure/EMP001_Rahul-Sharma.json --month 2026-07
```

---

## 6. Where things live

```
data/
  samples/              ← copy from here, never edit these
  offer-letter/          ← your real offer letter JSONs go here
  salary-structure/       ← your real salary JSONs go here
  ...                     ← one folder per document type, created as you use it

output/
  offer-letter/          ← generated PDFs land here, one folder per type
  ...
```

Naming convention (handled automatically):
- Input JSON: `<EmployeeID>_<First-Last>.json`
- Output PDF: `<DocumentName>_<EmployeeID>_<First-Last>_<Date>.pdf`

---

## 7. What goes in each JSON

Every sample in `data/samples/` is a working example — copy it and change
only what's different for that person. A few fields to know about:

- **Dates** are always `YYYY-MM-DD` (e.g. `2026-08-11`).
- **Money** (`annualCtc`, `currentCtc`, etc.) is a plain number, e.g. `1200000`
  for ₹12,00,000 — no commas, no currency symbol.
- **Salary structure / payslip** JSON drives both documents from one file.
  The tool automatically works out Basic, HRA, PF, TDS, and Net Pay — you
  never calculate these by hand. See
  [`data/samples/salary-structure.sample.json`](data/samples/salary-structure.sample.json).

If a field is missing or the wrong type, `hrgen generate` (and
`hrgen validate`) will tell you exactly which field and why — for example:

```
Invalid:
candidateName is required for offer-letter
```

For all money values in scripts, commas are fine (`"12,00,000"`).

---

## 8. Adding a new document type later

This tool is designed so new document types don't need new code:

1. Add one HTML file to `templates/`.
2. Add one JSON Schema file to `schemas/`.
3. Register it in `src/registry.js` (one small entry).
4. Add a sample to `data/samples/`.
5. Add a `Quick-Generation/generate-<type>.sh` — copy any existing script;
   its variables come straight from the schema's field names.

See [`plan.md`](plan.md) for the full design if you're extending this.

---

## Troubleshooting

**"Could not find Chrome"** — the one-time Chrome download didn't finish.
Run:
```bash
npx puppeteer browsers install chrome
```

**"X is required for Y"** — a required field is missing from your JSON.
Check the matching file in `data/samples/` for the full list of fields.

**Slow first run** — the very first PDF you generate after installing can
take a few extra seconds while Chrome starts up. Every one after that is fast.

---

## Why no AI / LLM?

Every document here is produced by filling a fixed template with your JSON
data — the same input always produces the same output. Nothing is sent to
any external service, and there's nothing for an AI to "get wrong." That's
intentional: HR documents like offer letters and payslips need to be exact
and repeatable, not generated fresh each time.

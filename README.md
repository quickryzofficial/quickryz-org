# hrgen — HR Document Generator

Turn a small JSON file into a ready-to-share PDF: offer letters, appointment
letters, payslips, experience certificates — all of it. No AI, no internet
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
cd Fresh2Tesh-Org
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

Open [`config/company.json`](config/company.json) and fill in your real
details — company name, website, HR email, and the person who signs
letters. Every document uses this automatically, so you never repeat it.

```json
{
  "companyName": "Fresh2Tech",
  "tagline": "Where Freshers Become Professionals.",
  "address": "Remote-first, serving students and business digitalisation across India",
  "website": "www.fresh2tech.com",
  "hrEmail": "hello@fresh2tech.com",
  "logo": "templates/assets/logo.png",
  "signatory": { "name": "Pankaj Gupta", "title": "Founder, Fresh2Tech" }
}
```

To use your own logo, replace [`templates/assets/logo.png`](templates/assets/logo.png)
with your own image (same filename), or update the `"logo"` path above.

---

## 3. Generate your first document (5 minutes)

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

## 4. Everyday commands

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

## 5. Where things live

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

## 6. What goes in each JSON

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

---

## 7. Adding a new document type later

This tool is designed so new document types don't need new code:

1. Add one HTML file to `templates/`.
2. Add one JSON Schema file to `schemas/`.
3. Register it in `src/registry.js` (one small entry).
4. Add a sample to `data/samples/`.

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

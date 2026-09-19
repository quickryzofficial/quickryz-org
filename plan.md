# HR Document Automation Pipeline — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One CLI utility (`hrgen`) that generates every HR document — offer letters, payslips, certificates, and more — from simple JSON files, producing share-ready PDFs with one command.

**Architecture:** JSON input → HTML template (Handlebars) → PDF (Puppeteer). Each document type has one HTML template and one JSON schema. A single company config holds branding (logo, address, signatory) so individual JSONs stay tiny — just the employee-specific fields.

**Tech Stack:** Node.js 18+, Handlebars (templating), Puppeteer (HTML → PDF), Commander (CLI), Ajv (JSON validation).

**Status:** ⏳ Awaiting approval — no implementation yet.

---

## 1. How It Works (User's View)

```bash
# 1. Copy a sample JSON and fill in a few fields
cp data/samples/offer-letter.sample.json data/offer-letter/EMP001_Rahul-Sharma.json

# 2. Run one command
hrgen generate offer-letter data/offer-letter/EMP001_Rahul-Sharma.json

# 3. Get a ready-to-share PDF
# → output/offer-letter/OfferLetter_EMP001_Rahul-Sharma_2026-07-27.pdf
```

Other commands:

```bash
hrgen list                          # show all supported document types
hrgen validate <json-file>          # check JSON before generating (clear error messages)
hrgen generate <type> <json-file>   # generate one document
hrgen kit <json-file>               # onboarding bundle: offer + appointment + joining + welcome kit in one shot
hrgen payslip <json-file> --month 2026-07   # payslip for a specific month
```

---

## 2. Supported Document Types

| # | Type ID | Document | Category |
|---|---------|----------|----------|
| 1 | `offer-letter` | Offer Letter | Onboarding |
| 2 | `appointment-letter` | Appointment Letter | Onboarding |
| 3 | `joining-letter` | Joining Letter | Onboarding |
| 4 | `welcome-kit` | Welcome Kit (multi-page) | Onboarding |
| 5 | `hike-letter` | Hike / Increment Letter | Compensation |
| 6 | `salary-structure` | Salary Structure (CTC breakup) | Compensation |
| 7 | `payslip` | Monthly Payslip | Compensation |
| 8 | `experience-letter` | Experience Certificate | Exit / Certification |
| 9 | `internship-certificate` | Internship Certificate | Certification |
| 10 | `course-certificate` | Course Completion Certificate | Certification |
| 11 | `appreciation-certificate` | Above & Beyond (A&B) Appreciation Certificate | Recognition |

Adding a new document type later = add 1 HTML template + 1 JSON schema + 1 sample. No code changes.

---

## 3. Folder Structure

```
Fresh2Tesh-Org/
├── plan.md                     ← this file
├── package.json
├── bin/
│   └── hrgen.js                ← CLI entry point
├── src/
│   ├── generate.js             ← core: JSON + template → PDF
│   ├── validate.js             ← Ajv validation with friendly errors
│   ├── salary.js               ← payslip math (earnings, deductions, net pay, amount-in-words)
│   └── registry.js             ← maps type ID → template + schema + filename pattern
├── config/
│   └── company.json            ← logo path, name, address, CIN, signatory name/title, HR email
├── templates/
│   ├── offer-letter.html
│   ├── appointment-letter.html
│   ├── joining-letter.html
│   ├── welcome-kit.html
│   ├── hike-letter.html
│   ├── salary-structure.html
│   ├── payslip.html
│   ├── experience-letter.html
│   ├── internship-certificate.html
│   ├── course-certificate.html
│   ├── appreciation-certificate.html
│   └── assets/
│       ├── logo.png
│       ├── signature.png
│       └── styles.css          ← shared letterhead / certificate styling
├── schemas/                    ← one JSON Schema per type (powers `hrgen validate`)
│   └── <type-id>.schema.json
├── data/                       ← your filled-in JSONs live here (gitignored except samples)
│   ├── samples/                ← one ready-to-copy sample per type
│   └── <type-id>/              ← e.g. data/offer-letter/EMP001_Rahul-Sharma.json
└── output/                     ← generated PDFs (gitignored)
    └── <type-id>/
```

---

## 4. Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Input JSON | `<EmpID>_<First-Last>.json` | `EMP001_Rahul-Sharma.json` |
| Output PDF | `<DocName>_<EmpID>_<First-Last>_<YYYY-MM-DD>.pdf` | `OfferLetter_EMP001_Rahul-Sharma_2026-07-27.pdf` |
| Payslip PDF | `Payslip_<EmpID>_<First-Last>_<YYYY-MM>.pdf` | `Payslip_EMP001_Rahul-Sharma_2026-07.pdf` |
| Type IDs | kebab-case | `experience-letter` |
| JSON fields | camelCase | `dateOfJoining` |

---

## 5. JSON Structures (the "few columns to fill")

### 5.1 Company Config — filled once (`config/company.json`), sourced from the Fresh2Tech repo

```json
{
  "companyName": "Fresh2Tech",
  "tagline": "Where Freshers Become Professionals.",
  "address": "Remote-first, serving students and business digitalisation across India",
  "website": "www.fresh2tech.com",
  "hrEmail": "hello@fresh2tech.com",
  "cin": "",
  "logo": "templates/assets/logo.png",
  "brandColor": "#2563EB",
  "signatory": { "name": "Pankaj Gupta", "title": "Founder, Fresh2Tech", "signatureImage": "templates/assets/signature.png" }
}
```

Real logo copied from `Fresh2Tech/resources/logo/Logo-icon.png`. `cin` left blank (no registered entity number found in the repo) — fill in if/when incorporated. No physical office address exists (remote-first company), so letters use the tagline/website instead of a street address.

### 5.2 Offer Letter (`data/offer-letter/EMP001_Rahul-Sharma.json`)

```json
{
  "employeeId": "EMP001",
  "candidateName": "Rahul Sharma",
  "designation": "Software Engineer",
  "department": "Engineering",
  "dateOfJoining": "2026-08-11",
  "workLocation": "Bengaluru",
  "annualCtc": 1200000,
  "offerValidTill": "2026-08-04",
  "letterDate": "2026-07-27"
}
```

### 5.3 Appointment / Joining Letter — same fields as offer, plus:

```json
{
  "probationMonths": 6,
  "noticePeriodDays": 60,
  "reportingManager": "Anita Desai"
}
```

### 5.4 Hike Letter

```json
{
  "employeeId": "EMP001",
  "employeeName": "Rahul Sharma",
  "designation": "Software Engineer",
  "newDesignation": "Senior Software Engineer",
  "currentCtc": 1200000,
  "revisedCtc": 1500000,
  "effectiveFrom": "2026-08-01",
  "letterDate": "2026-07-27"
}
```

### 5.5 Salary Structure + Payslip (one JSON drives both)

```json
{
  "employeeId": "EMP001",
  "employeeName": "Rahul Sharma",
  "designation": "Software Engineer",
  "pan": "ABCDE1234F",
  "bankAccount": "XXXX-XXXX-1234",
  "uan": "100900800700",
  "dateOfJoining": "2026-08-11",
  "annualCtc": 1200000,
  "structure": {
    "basicPercent": 40,
    "hraPercentOfBasic": 50,
    "specialAllowance": "auto",
    "pfEmployeePercent": 12,
    "professionalTax": 200,
    "tdsMonthly": 5000
  },
  "payableDays": 30,
  "lopDays": 0
}
```

The tool auto-computes: Basic, HRA, Special Allowance, PF, PT, TDS, Gross, Net Pay, and "Rupees Twelve Thousand Only" amount-in-words. Payslip month comes from `--month`, so one JSON serves every month.

### 5.6 Experience / Internship Certificate

```json
{
  "employeeId": "EMP001",
  "employeeName": "Rahul Sharma",
  "designation": "Software Engineer",
  "startDate": "2024-01-15",
  "endDate": "2026-07-15",
  "conductRemark": "professional and dedicated",
  "letterDate": "2026-07-27"
}
```

### 5.7 Course / Appreciation Certificate

```json
{
  "recipientName": "Rahul Sharma",
  "title": "Advanced API Test Automation",
  "reason": "outstanding contribution to the Q2 release",
  "awardDate": "2026-07-27",
  "certificateId": "F2T-AB-2026-0042"
}
```

Every sample in `data/samples/` ships pre-filled, so filling a real one is copy → edit 5-8 fields → run.

---

## 6. Implementation Tasks

### Task 1: Project Scaffold + Core Generate Engine
**Files:** `package.json`, `bin/hrgen.js`, `src/generate.js`, `src/registry.js`, `config/company.json`, `templates/assets/styles.css`
- [ ] `npm init`, install `handlebars puppeteer commander ajv`
- [ ] Write failing test: `generate('offer-letter', sampleJson)` returns a PDF path that exists on disk
- [ ] Implement: load template → merge JSON + company config via Handlebars → Puppeteer prints A4 PDF → save with naming convention
- [ ] Test passes; commit

### Task 2: Validation (`hrgen validate`)
**Files:** `src/validate.js`, `schemas/*.schema.json`
- [ ] Failing test: missing `candidateName` → error message `"candidateName is required for offer-letter"`
- [ ] Implement Ajv validation, run automatically before every generate
- [ ] Commit

### Task 3: Onboarding Letters (Types 1-4)
**Files:** `templates/offer-letter.html`, `appointment-letter.html`, `joining-letter.html`, `welcome-kit.html`, samples + schemas
- [ ] Build letterhead layout (logo, address header, signatory block, footer) in shared CSS
- [ ] One template per type with proper legal-letter wording; placeholders like `{{candidateName}}`, `{{formatCurrency annualCtc}}`, `{{formatDate dateOfJoining}}`
- [ ] `hrgen kit` command: generates all four from one JSON
- [ ] Generate each sample, visually verify PDFs; commit

### Task 4: Compensation Docs (Types 5-7)
**Files:** `src/salary.js`, `templates/hike-letter.html`, `salary-structure.html`, `payslip.html`
- [ ] Failing tests for salary math: CTC 12,00,000 → Basic 40,000/mo, HRA 20,000/mo, PF 4,800, net pay, LOP proration, amount-in-words
- [ ] Implement `salary.js`; payslip template with earnings/deductions table
- [ ] `--month` flag; hike letter shows old vs new CTC table
- [ ] Commit

### Task 5: Certificates (Types 8-11)
**Files:** 4 certificate templates + samples + schemas
- [ ] Landscape A4 certificate design (border, seal area, certificate ID, signatory)
- [ ] Experience & internship use formal letter format; course & A&B use decorative certificate format
- [ ] Generate all samples, visually verify; commit

### Task 6: Polish + README
- [ ] `hrgen list` with type table; friendly errors (file not found, bad date format)
- [ ] `README.md`: 5-minute quick start, one worked example per category
- [ ] End-to-end run: generate all 11 document types from samples in one script; commit

---

## 7. Out of Scope (v2 ideas — not now)

- Emailing PDFs to employees automatically
- Batch mode (CSV of 50 employees → 50 offer letters)
- Digital signature / DSC integration
- Web UI on top of the CLI
- Form 16 / tax documents (needs real tax rules)

---

## 8. Open Questions (answer at approval time)

1. **Currency & country**: Assumed INR + Indian payroll components (PF/PT/TDS/UAN). Correct?
2. **Company details**: Real Fresh2Tech name/address/logo, or placeholder branding for now?
3. **Node.js OK?** (Matches your Fresh2Tech Next.js stack. Python alternative possible but Node recommended.)

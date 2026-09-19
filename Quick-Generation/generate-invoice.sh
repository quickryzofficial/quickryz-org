#!/usr/bin/env bash
# Generates a QuickRyz invoice PDF -> output/invoice/
# Edit the values below and run: ./Quick-Generation/generate-invoice.sh
# Leave CLIENT_NAME / CLIENT_ADDRESS empty to be asked for them instead.
source "$(dirname "$0")/_common.sh"
set -a
# ======================= Bill To =======================
CLIENT_NAME="ABC Technologies Private Limited"
CLIENT_ADDRESS="123 Business Park, Bengaluru, Karnataka – 560001"
GST=false                     # true -> GST is calculated and added automatically
CLIENT_STATE="Karnataka"      # place of supply: same state as QuickRyz GST -> CGST+SGST, else IGST
CLIENT_GSTIN=""               # optional
CLIENT_ATTN="Accounts Payable"  # optional
CLIENT_EMAIL="accounts@example.com"  # optional

# ======================= Line items =======================
# One per line: "Title | Description (optional) | Qty | Rate"
ITEMS=(
  "Software Development & IT Consulting | Professional services for digital transformation | 1 | 75000"
  "QA & Test Automation Services | Automation framework and quality engineering support | 1 | 25000"
)

# ======================= Optional overrides =======================
INVOICE_NUMBER=""   # blank = next auto number, e.g. QR-INV-2026-002
INVOICE_DATE=""     # blank = today (YYYY-MM-DD)
DUE_DATE=""         # blank = invoice date + dueDays from config/company.json
set +a

ask_if_empty CLIENT_NAME "Client company name"
ask_if_empty CLIENT_ADDRESS "Client address"
export_lines ITEMS
run_hrgen invoice

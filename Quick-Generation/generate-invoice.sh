#!/usr/bin/env bash
# Generates a QuickRyz invoice PDF -> output/invoice/
# Edit the values below and run: ./Quick-Generation/generate-invoice.sh
# Leave CLIENT_NAME / CLIENT_ADDRESS empty to be asked for them instead.
source "$(dirname "$0")/_common.sh"
set -a
# ======================= Bill To =======================
CLIENT_NAME="MM Volttech Private Limited"
CLIENT_ADDRESS="Gandhi Nagar Pakhan, Marhowrah,Dist. Saran, Bihar - 841418"
GST=false                     # true -> GST is calculated and added automatically
CLIENT_STATE="Bihar"      # place of supply: same state as QuickRyz GST -> CGST+SGST, else IGST
CLIENT_GSTIN=""               # optional
CLIENT_ATTN="Accounts Payable"  # optional
CLIENT_EMAIL="info@mmvoltech.in"  # optional

# ======================= Line items =======================
# One per line: "Title | Description (optional) | Qty | Rate"
ITEMS=(
  "Domain(3Yr) and Email(1Yr) | Professional services for digital transformation | 1 | 7500"
  "Software Development & IT Consulting | Website design and Development | 1 | 3500"
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

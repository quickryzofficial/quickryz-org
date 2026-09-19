#!/usr/bin/env bash
# Generates a Payslip PDF -> output/payslip/
source "$(dirname "$0")/_common.sh"
set -a
PAYSLIP_MONTH="$(date +%Y-%m)"            # YYYY-MM, defaults to this month
EMPLOYEE_ID="EMP001"
EMPLOYEE_NAME="Rahul Sharma"
DESIGNATION="Software Engineer"
DEPARTMENT="Engineering"
GRADE="L2"                         # optional
WORK_LOCATION="Bangalore"          # optional
DOB="1998-04-12"                   # optional, YYYY-MM-DD
PAN="ABCDE1234F"
BANK_ACCOUNT="XXXX-XXXX-1234"
IFSC_CODE="ICIC0001234"            # optional
UAN="100900800700"
DATE_OF_JOINING="2026-08-11"       # YYYY-MM-DD
ANNUAL_CTC="1200000"               # rupees per year

# ---- Salary structure ----
STRUCTURE_BASIC_PERCENT="40"            # % of CTC
STRUCTURE_HRA_PERCENT_OF_BASIC="50"     # % of basic
STRUCTURE_SPECIAL_ALLOWANCE="auto"      # "auto" = balancing figure, or a monthly amount
STRUCTURE_PF_EMPLOYEE_PERCENT="12"      # % of basic
STRUCTURE_PROFESSIONAL_TAX="200"        # monthly
STRUCTURE_TDS_MONTHLY="5000"            # monthly

# ---- Attendance ----
PAYABLE_DAYS="30"
LOP_DAYS="0"
ARREAR_DAYS="0"
LOP_REVERSAL_DAYS="0"

# ---- Extra monthly items (optional): "Label | Amount" ----
EXTRA_EARNINGS=(
  "LTA | 5000"
)
EXTRA_DEDUCTIONS=(
)
set +a
export_lines EXTRA_EARNINGS
export_lines EXTRA_DEDUCTIONS
run_hrgen payslip --month "$PAYSLIP_MONTH"

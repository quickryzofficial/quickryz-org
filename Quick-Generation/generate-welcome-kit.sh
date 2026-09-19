#!/usr/bin/env bash
# Generates a Welcome Kit PDF -> output/welcome-kit/
source "$(dirname "$0")/_common.sh"
set -a
EMPLOYEE_ID="EMP001"
EMPLOYEE_NAME="Rahul Sharma"
DESIGNATION="Software Engineer"
DEPARTMENT="Engineering"
DATE_OF_JOINING="2026-10-05"        # YYYY-MM-DD
WORK_LOCATION="Bangalore"
REPORTING_MANAGER="Anita Desai"
BUDDY_NAME="Sneha Iyer"
LETTER_DATE="$(date +%F)"           # today
# One asset per line (optional)
IT_ASSETS=(
  "MacBook Pro 14\" (Asset Tag: QR-LAP-0231)"
  "Company email account (rahul.sharma@quickryz.in)"
  "Slack & Google Workspace access"
)
set +a
export_lines IT_ASSETS
run_hrgen welcome-kit

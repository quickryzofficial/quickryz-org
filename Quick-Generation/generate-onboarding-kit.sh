#!/usr/bin/env bash
# Generates the full onboarding bundle in one go -> Offer Letter, Appointment
# Letter, Joining Letter and Welcome Kit (each in its own output/ folder).
source "$(dirname "$0")/_common.sh"
set -a
EMPLOYEE_ID="EMP001"
CANDIDATE_NAME="Rahul Sharma"       # used by offer & appointment letters
EMPLOYEE_NAME="$CANDIDATE_NAME"     # used by joining letter & welcome kit
DESIGNATION="Software Engineer"
DEPARTMENT="Engineering"
DATE_OF_JOINING="2026-10-05"        # YYYY-MM-DD
WORK_LOCATION="Bangalore"
ANNUAL_CTC="1200000"                # rupees per year
OFFER_VALID_TILL="2026-09-30"       # YYYY-MM-DD
PROBATION_MONTHS="6"
NOTICE_PERIOD_DAYS="60"
REPORTING_MANAGER="Anita Desai"
BUDDY_NAME="Sneha Iyer"
LETTER_DATE="$(date +%F)"           # today
IT_ASSETS=(
  "MacBook Pro 14\" (Asset Tag: QR-LAP-0231)"
  "Company email account (rahul.sharma@quickryz.in)"
  "Slack & Google Workspace access"
)
set +a
export_lines IT_ASSETS
run_hrgen kit

#!/usr/bin/env bash
# Generates an Appointment Letter PDF -> output/appointment-letter/
source "$(dirname "$0")/_common.sh"
set -a
EMPLOYEE_ID="EMP001"
CANDIDATE_NAME="Rahul Sharma"
DESIGNATION="Software Engineer"
DEPARTMENT="Engineering"
DATE_OF_JOINING="2026-10-05"        # YYYY-MM-DD
WORK_LOCATION="Bangalore"
ANNUAL_CTC="205000"                # rupees per year
PROBATION_MONTHS="6"
NOTICE_PERIOD_DAYS="60"
REPORTING_MANAGER="Rajnish Kumar"
LETTER_DATE="$(date +%F)"           # today
set +a
run_hrgen appointment-letter

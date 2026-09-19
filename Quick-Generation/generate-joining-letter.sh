#!/usr/bin/env bash
# Generates a Joining Letter PDF -> output/joining-letter/
source "$(dirname "$0")/_common.sh"
set -a
EMPLOYEE_ID="EMP001"
EMPLOYEE_NAME="Rahul Sharma"
DESIGNATION="Software Engineer"
DEPARTMENT="Engineering"
DATE_OF_JOINING="2026-10-05"        # YYYY-MM-DD
WORK_LOCATION="Bangalore"
REPORTING_MANAGER="Anita Desai"
LETTER_DATE="$(date +%F)"           # today
set +a
run_hrgen joining-letter

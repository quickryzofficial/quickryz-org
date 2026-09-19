#!/usr/bin/env bash
# Generates an Experience Certificate PDF -> output/experience-letter/
source "$(dirname "$0")/_common.sh"
set -a
EMPLOYEE_ID="EMP001"
EMPLOYEE_NAME="Rahul Sharma"
DESIGNATION="Software Engineer"
START_DATE="2024-01-15"             # YYYY-MM-DD
END_DATE="2026-07-15"               # YYYY-MM-DD
CONDUCT_REMARK="professional, dedicated, and a positive influence on the team"
LETTER_DATE="$(date +%F)"           # today
set +a
run_hrgen experience-letter

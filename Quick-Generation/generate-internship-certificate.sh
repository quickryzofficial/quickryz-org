#!/usr/bin/env bash
# Generates an Internship Certificate PDF -> output/internship-certificate/
source "$(dirname "$0")/_common.sh"
set -a
EMPLOYEE_ID="INT001"
EMPLOYEE_NAME="Sara Khan"
DESIGNATION="Software Engineering Intern"
START_DATE="2026-05-01"             # YYYY-MM-DD
END_DATE="2026-07-15"               # YYYY-MM-DD
DEPARTMENT="Engineering"                  # shown in the details row
MODE="Online / On-site"                   # shown in the details row
CONDUCT_REMARK="consistently high quality and delivered ahead of schedule"
CERTIFICATE_ID="QR-INT-2026-0017"
LETTER_DATE="$(date +%F)"           # today
set +a
run_hrgen internship-certificate

#!/usr/bin/env bash
# Generates a Hike / Increment Letter PDF -> output/hike-letter/
source "$(dirname "$0")/_common.sh"
set -a
EMPLOYEE_ID="EMP001"
EMPLOYEE_NAME="Rahul Sharma"
DESIGNATION="Software Engineer"            # current designation
NEW_DESIGNATION="Senior Software Engineer" # same as current if no promotion
CURRENT_CTC="1200000"                      # rupees per year
REVISED_CTC="1500000"                      # rupees per year
EFFECTIVE_FROM="2026-10-01"                # YYYY-MM-DD
LETTER_DATE="$(date +%F)"                  # today
set +a
run_hrgen hike-letter

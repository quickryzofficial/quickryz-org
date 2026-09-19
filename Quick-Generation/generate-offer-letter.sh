#!/usr/bin/env bash
# Generates an Offer Letter PDF -> output/offer-letter/
source "$(dirname "$0")/_common.sh"
set -a
EMPLOYEE_ID="EMP001"
CANDIDATE_NAME="Rahul Sharma"
DESIGNATION="Software Engineer"
DEPARTMENT="Engineering"
DATE_OF_JOINING="2026-10-05"        # YYYY-MM-DD
WORK_LOCATION="Bangalore"
ANNUAL_CTC="1200000"                # rupees per year
OFFER_VALID_TILL="2026-09-30"       # YYYY-MM-DD
LETTER_DATE="$(date +%F)"           # today
set +a
run_hrgen offer-letter

#!/usr/bin/env bash
# Generates a Course Completion Certificate PDF -> output/course-certificate/
source "$(dirname "$0")/_common.sh"
set -a
RECIPIENT_NAME="Rahul Sharma"
TITLE="Advanced API Test Automation"      # course name
REASON="demonstrating strong command of API contract testing and CI integration"  # optional
TRAINER_NAME=""                           # optional: left signature block (blank = keep the artwork's slogan)
TRAINER_TITLE="Trainer"                   # shown under TRAINER_NAME
CERTIFICATE_ID="QR-CRS-2026-0042"
AWARD_DATE="$(date +%F)"                  # today
set +a
run_hrgen course-certificate

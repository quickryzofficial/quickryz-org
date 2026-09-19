#!/usr/bin/env bash
# Generates an Appreciation Certificate (Above & Beyond) PDF -> output/appreciation-certificate/
source "$(dirname "$0")/_common.sh"
set -a
RECIPIENT_NAME="Rahul Sharma"
TITLE="Above & Beyond Award"              # optional
REASON="outstanding contribution to the Q2 release, going well beyond the call of duty"
CERTIFICATE_ID="QR-AB-2026-0009"
AWARD_DATE="$(date +%F)"                  # today
set +a
run_hrgen appreciation-certificate

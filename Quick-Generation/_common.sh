#!/usr/bin/env bash
# Shared plumbing for the Quick-Generation scripts. Sourced, never run directly.
#
# Each script assigns its variables between `set -a` / `set +a` (so they are
# exported), then calls run_hrgen. hrgen maps UPPER_SNAKE variables to the
# document's fields using its JSON schema, e.g. CANDIDATE_NAME -> candidateName.

set -euo pipefail

QG_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$QG_DIR/.." && pwd)"

# ask_if_empty VAR "Prompt" — asks in the terminal when VAR was left blank.
ask_if_empty() {
  local var="$1" prompt="$2" value
  if [ -z "${!var:-}" ]; then
    read -r -p "$prompt: " value
    if [ -z "$value" ]; then
      echo "Error: $var is required." >&2
      exit 1
    fi
    export "$var=$value"
  fi
}

# export_lines VAR — bash can't export arrays, so flatten array VAR into
# newline-separated text under the same name (one entry per line).
export_lines() {
  local name="$1" text="" item
  # The ${arr[@]+...} form keeps an empty array safe under `set -u` on bash 3.2.
  eval 'set -- ${'"$name"'[@]+"${'"$name"'[@]}"}'
  for item in "$@"; do
    text+="$item"$'\n'
  done
  unset "$name"
  export "$name=$text"
}

# run_hrgen TYPE [hrgen options...] — generates the PDF and prints its path.
run_hrgen() {
  command -v node >/dev/null 2>&1 || { echo "Error: Node.js is required (https://nodejs.org)." >&2; exit 1; }
  if [ ! -d "$REPO_ROOT/node_modules" ]; then
    echo "Installing dependencies (first run only)..."
    (cd "$REPO_ROOT" && npm install --silent)
  fi
  node "$REPO_ROOT/bin/hrgen.js" from-env "$@"
}

#!/usr/bin/env bash
set -euo pipefail

PATCH_FILE="${1:-}"

if [[ -z "$PATCH_FILE" ]]; then
  echo "Usage: scripts/apply-patch.sh <patch-file>"
  exit 1
fi

git apply --index "$PATCH_FILE"
echo "Applied patch and staged changes."
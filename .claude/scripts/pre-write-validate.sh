#!/usr/bin/env bash
# Pre-write validation hook for Claude Code (PreToolUse)
# Validates structural rules before Write/Edit on src/pages/** and src/api/**
#
# Input: JSON on stdin with { tool_name, tool_input: { file_path, content } }
# Exit 0 = allow | Exit 2 = block (stderr shown as error message)

set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('file_path',''))" 2>/dev/null || echo "")
CONTENT=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('content',''))" 2>/dev/null || echo "")
OLD_STRING=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('new_string',''))" 2>/dev/null || echo "")

# Use content or new_string (Edit tool uses new_string)
TEXT="${CONTENT:-$OLD_STRING}"

if [[ -z "$FILE_PATH" || -z "$TEXT" ]]; then
  exit 0  # Not a file write — allow
fi

ERRORS=()

# ── Rule 1: Page objects must extend a base class ─────────────────
if [[ "$FILE_PATH" == src/pages/**/*.ts || "$FILE_PATH" =~ src/pages/.*\.ts$ ]]; then
  # Check if file defines a class
  if echo "$TEXT" | grep -q "^export class "; then
    # Must extend BasePage or a portal base
    if ! echo "$TEXT" | grep -qE "extends (BasePage|OriginationBasePage|ServicingBasePage|WebsiteBasePage|AmsBasePage|LoginPage|SearchPage)"; then
      ERRORS+=("Page object must extend BasePage or a portal base class (OriginationBasePage, ServicingBasePage, etc.)")
    fi
  fi
fi

# ── Rule 2: API clients must extend BaseClient ────────────────────
if [[ "$FILE_PATH" =~ src/api/clients/.*\.ts$ ]]; then
  if echo "$TEXT" | grep -q "^export class "; then
    if ! echo "$TEXT" | grep -q "extends BaseClient"; then
      ERRORS+=("API client must extend BaseClient")
    fi
  fi
fi

# ── Rule 3: No hardcoded selectors in test files ──────────────────
if [[ "$FILE_PATH" =~ tests/.*\.spec\.ts$ ]]; then
  # Look for page.locator() with hardcoded CSS strings longer than 5 chars (not SELECTORS)
  if echo "$TEXT" | grep -qE "page\.locator\(['\"][#\.][^'\"]{5,}['\"]" ; then
    ERRORS+=("Hardcoded selector found in test — use SELECTORS from common.selectors.ts")
  fi
fi

# ── Output ────────────────────────────────────────────────────────
if [[ ${#ERRORS[@]} -gt 0 ]]; then
  echo "❌ Pre-write validation failed for: $FILE_PATH" >&2
  for err in "${ERRORS[@]}"; do
    echo "  • $err" >&2
  done
  echo "" >&2
  echo "Fix these issues before writing. See .claude/rules/ for guidance." >&2
  exit 2
fi

exit 0

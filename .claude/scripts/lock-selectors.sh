#!/usr/bin/env bash
# PreToolUse hook — acquires a mutex lock before any Write/Edit on common.selectors.ts
# Prevents concurrent agents from writing to the shared SELECTORS file simultaneously.
#
# Input: JSON on stdin with { tool_name, tool_input: { file_path, ... } }
# Exit 0 = allow | Exit 2 = block (stderr shown as error message)

set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('file_path',''))" 2>/dev/null || echo "")

# Only lock writes to common.selectors.ts
if [[ "$FILE_PATH" != *"common.selectors.ts"* ]]; then
  exit 0
fi

LOCK_DIR=".claude/locks"
LOCK_FILE="$LOCK_DIR/selectors.lock"
mkdir -p "$LOCK_DIR"

# Try atomic lock acquisition (mkdir is atomic on Linux)
if mkdir "$LOCK_FILE" 2>/dev/null; then
  date +%s > "$LOCK_FILE/timestamp"
  exit 0
fi

# Lock exists — check if it's stale (older than 5 minutes)
LOCK_TIME=$(cat "$LOCK_FILE/timestamp" 2>/dev/null || echo "0")
NOW=$(date +%s)
AGE=$((NOW - LOCK_TIME))

if [[ $AGE -gt 300 ]]; then
  # Stale lock — clear and re-acquire
  rm -rf "$LOCK_FILE"
  if mkdir "$LOCK_FILE" 2>/dev/null; then
    date +%s > "$LOCK_FILE/timestamp"
    exit 0
  fi
fi

echo "⚠️  common.selectors.ts is locked by another agent (acquired ${AGE}s ago)." >&2
echo "    Another subagent is currently editing the shared SELECTORS file." >&2
echo "    Wait a few seconds and retry, or check .claude/locks/selectors.lock" >&2
exit 2

#!/usr/bin/env bash
# PostToolUse hook — releases the mutex lock after Write/Edit on common.selectors.ts
#
# Input: JSON on stdin with { tool_name, tool_input: { file_path, ... }, tool_response: ... }
# Always exits 0 (unlock failures must not block the tool response)

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('file_path',''))" 2>/dev/null || echo "")

# Only act on common.selectors.ts
if [[ "$FILE_PATH" != *"common.selectors.ts"* ]]; then
  exit 0
fi

LOCK_FILE=".claude/locks/selectors.lock"
if [[ -d "$LOCK_FILE" ]]; then
  rm -rf "$LOCK_FILE"
fi

exit 0

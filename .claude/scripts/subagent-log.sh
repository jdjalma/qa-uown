#!/usr/bin/env bash
# SubagentStart / SubagentStop logging hook
# Appends structured log entry to .claude/logs/session.log
#
# Input: JSON on stdin with hook_event_name and subagent details

set -uo pipefail

LOG_DIR="${CLAUDE_PROJECT_DIR:-/home/jose/projects/qa-uown}/.claude/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/session.log"

INPUT=$(cat)
EVENT=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('hook_event_name',''))" 2>/dev/null || echo "SubagentEvent")
AGENT=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('agent_name', d.get('subagent_type','unknown')))" 2>/dev/null || echo "unknown")

echo "[$(date '+%Y-%m-%d %H:%M:%S')] $EVENT — agent: $AGENT" >> "$LOG_FILE"

exit 0

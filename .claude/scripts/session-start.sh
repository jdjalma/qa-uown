#!/usr/bin/env bash
# SessionStart hook for Claude Code
# Syncs application repos and logs session start
#
# Runs once when a Claude Code session starts.

set -uo pipefail

LOG_DIR="/home/jose/projects/automation/.claude/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/session.log"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] SESSION START — pwd: $(pwd)" >> "$LOG_FILE"

# ── Sync application repos ────────────────────────────────────────
# Repos listed in .claude/context/app-repos.md
REPOS=(svc origination servicing website ams ams-website payment-gateway uwengine ccverification common los-common svc-common configuration)
BASE_DIR="/home/jose/projects"
SYNCED=0
FAILED=()

for repo in "${REPOS[@]}"; do
  REPO_PATH="$BASE_DIR/$repo"
  if [[ -d "$REPO_PATH/.git" ]]; then
    if git -C "$REPO_PATH" pull --ff-only -q 2>/dev/null; then
      SYNCED=$((SYNCED + 1))
    else
      FAILED+=("$repo")
    fi
  fi
done

if [[ ${#FAILED[@]} -gt 0 ]]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARN: sync failed for: ${FAILED[*]}" >> "$LOG_FILE"
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Synced $SYNCED/${#REPOS[@]} repos" >> "$LOG_FILE"

exit 0

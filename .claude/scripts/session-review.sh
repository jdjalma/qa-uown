#!/usr/bin/env bash
# .claude/scripts/session-review.sh
# Stop hook — roda quando Claude termina de responder
# Verifica se há arquivos .ts modificados e roda tsc --noEmit
# Stdin: JSON com session_id (Claude Code hook protocol)

set -uo pipefail

# ── Localizar project root ──────────────────────────────────────────
PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "")
[[ -z "$PROJECT_ROOT" ]] && exit 0
cd "$PROJECT_ROOT"

# ── Verificar arquivos .ts modificados (staged + unstaged + untracked) ──
MODIFIED_TS=$(git status --short 2>/dev/null \
  | awk '{print $NF}' \
  | grep -E "\.(ts)$" \
  | grep -v "node_modules" \
  | grep -E "^(src|tests)/" \
  || echo "")

[[ -z "$MODIFIED_TS" ]] && exit 0

FILE_COUNT=$(echo "$MODIFIED_TS" | grep -c "." || echo "0")

# ── Rodar tsc --noEmit ──────────────────────────────────────────────
TSC_ERRORS=$(npx --no-install tsc --noEmit 2>&1 \
  | grep -E "error TS[0-9]+" \
  | head -20 \
  || true)

if [[ -n "$TSC_ERRORS" ]]; then
  echo ""
  echo "┌─ SESSION REVIEW — TypeScript Errors ───────────────────────────┐"
  printf "│  %-62s│\n" "$FILE_COUNT arquivo(s) .ts modificado(s)"
  echo "└────────────────────────────────────────────────────────────────┘"
  echo ""
  echo "$TSC_ERRORS" | while IFS= read -r line; do
    echo "  🔴 $line"
  done
  echo ""
  echo "  → tsc --noEmit deve passar antes de executar testes."
  echo ""
  exit 0
fi

# tsc OK — confirma silenciosamente só se houve mudanças relevantes
if [[ "$FILE_COUNT" -ge 1 ]]; then
  echo ""
  echo "  ✅ SESSION REVIEW: $FILE_COUNT arquivo(s) .ts modificado(s) — tsc OK"
  echo ""
fi

exit 0

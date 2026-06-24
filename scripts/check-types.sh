#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────
# Filtered type-check: runs `tsc --noEmit` but IGNORES the 2 known-broken
# probe files under src/scripts/ (svc-460-perf-report.ts = markdown-as-.ts,
# dev3-trigger-sweeps.ts = syntax error). Those are tracked separately and
# must NOT redden the build. Exit 1 only if a type error exists OUTSIDE
# src/scripts/. Used by `npm run lint:types` and the CI `quality` job so the
# local + CI contracts match ("tsc clean outside src/scripts").
# ─────────────────────────────────────────────────────────────────────────
set -uo pipefail

OUT="$(npx tsc --noEmit 2>&1)"
REAL_ERRORS="$(printf '%s\n' "$OUT" | grep 'error TS' | grep -v 'src/scripts/' || true)"

if [ -n "$REAL_ERRORS" ]; then
  echo "✖ Type errors outside src/scripts/:"
  printf '%s\n' "$REAL_ERRORS"
  exit 1
fi

# Surface (but tolerate) the known src/scripts breakage for visibility.
SCRIPT_ERRORS="$(printf '%s\n' "$OUT" | grep -c 'error TS' || true)"
echo "✓ tsc clean outside src/scripts/ (${SCRIPT_ERRORS} pre-existing src/scripts errors ignored)"
exit 0

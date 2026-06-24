#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────
# Pre-push quality gate (best-effort, opt-in).
#
# ENABLE once per clone:
#     git config core.hooksPath scripts/hooks
#     chmod +x scripts/hooks/pre-push.sh   # (already +x in the repo)
#
# What it does, fast & non-blocking-by-default:
#   1) Type-check (filtered: ignores the 2 known-broken src/scripts probes).
#   2) ESLint ONLY the .ts files staged/changed in this push, with the same
#      ratchet ceiling as CI (warnings allowed; the FULL-repo ceiling is
#      enforced in CI's `quality` job, not here — local runs only the diff
#      so the hook stays quick).
#
# It is BEST-EFFORT: if eslint/tsc aren't installed yet (fresh clone before
# `npm ci`) it warns and lets the push through rather than blocking work.
# ─────────────────────────────────────────────────────────────────────────
set -uo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT" || exit 0

# Full-repo eslint warning ceiling (kept in sync with .gitlab-ci.yml `quality`).
ESLINT_MAX_WARNINGS=1759

# ── 1) Type-check (filtered) ──────────────────────────────────────────────
if [ -x "scripts/check-types.sh" ] && [ -d node_modules/typescript ]; then
  echo "[pre-push] type-check (tsc, ignoring src/scripts)…"
  if ! bash scripts/check-types.sh; then
    echo "[pre-push] ✖ type errors — push aborted."
    exit 1
  fi
else
  echo "[pre-push] tsc not available (run npm ci) — skipping type-check."
fi

# ── 2) ESLint the changed .ts files ───────────────────────────────────────
if [ ! -d node_modules/eslint ]; then
  echo "[pre-push] eslint not installed — skipping (run npm ci)."
  exit 0
fi

# Files changed vs the upstream tracking branch (fallback: vs HEAD~1, then all staged).
BASE="$(git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null || true)"
if [ -n "$BASE" ]; then
  CHANGED="$(git diff --name-only "$BASE"...HEAD --diff-filter=ACM | grep -E '\.ts$' || true)"
else
  CHANGED="$(git diff --name-only HEAD~1 --diff-filter=ACM 2>/dev/null | grep -E '\.ts$' || true)"
fi
# Also include anything currently staged (covers amend/rebase scenarios).
STAGED="$(git diff --name-only --cached --diff-filter=ACM | grep -E '\.ts$' || true)"
FILES="$(printf '%s\n%s\n' "$CHANGED" "$STAGED" | sort -u | grep -vE '^src/scripts/' | grep -E '\.ts$' || true)"

if [ -z "$FILES" ]; then
  echo "[pre-push] no changed .ts files to lint."
  exit 0
fi

echo "[pre-push] eslint on changed files (ceiling ${ESLINT_MAX_WARNINGS}, full-repo ratchet enforced in CI)…"
# shellcheck disable=SC2086
if ! npx eslint $FILES --max-warnings "$ESLINT_MAX_WARNINGS"; then
  echo "[pre-push] ✖ eslint errors (or warning ceiling exceeded) — push aborted."
  exit 1
fi

echo "[pre-push] ✓ quality checks passed."
exit 0

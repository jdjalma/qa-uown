#!/usr/bin/env bash
# =============================================================================
# migrate-task-dirs.sh
#
# Renames legacy directory names in docs/taskTestingUown/ from various formats
# (Ticket*, TIcket*, Tas*) to standardized "legacy_ticket<number>" format.
#
# Usage:
#   ./scripts/migrate-task-dirs.sh              # dry-run (prints what WOULD happen)
#   ./scripts/migrate-task-dirs.sh --execute    # actually rename directories
#
# Handles:
#   Ticket453              -> legacy_ticket453
#   Ticket453-frontend-... -> legacy_ticket453-frontend-...
#   TIcket 1190            -> legacy_ticket1190
#   TIcket496              -> legacy_ticket496
#   Tas913                 -> legacy_ticket913
# =============================================================================

set -euo pipefail

# --- Configuration ---
TASK_ROOT="$(cd "$(dirname "$0")/.." && pwd)/docs/taskTestingUown"
DRY_RUN=true

if [[ "${1:-}" == "--execute" ]]; then
    DRY_RUN=false
fi

# --- Counters ---
count_renamed=0
count_skipped=0
count_errors=0
count_loose_moved=0

# --- Color helpers (only if terminal) ---
if [[ -t 1 ]]; then
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    RED='\033[0;31m'
    CYAN='\033[0;36m'
    NC='\033[0m'
else
    GREEN='' YELLOW='' RED='' CYAN='' NC=''
fi

log_info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_err()   { echo -e "${RED}[ERROR]${NC} $*"; }
log_dry()   { echo -e "${CYAN}[DRY-RUN]${NC} $*"; }

# --- Validate ---
if [[ ! -d "$TASK_ROOT" ]]; then
    log_err "Directory not found: $TASK_ROOT"
    exit 1
fi

echo "============================================"
echo "  migrate-task-dirs.sh"
echo "  Target: $TASK_ROOT"
if $DRY_RUN; then
    echo "  Mode:   DRY-RUN (pass --execute to rename)"
else
    echo "  Mode:   EXECUTE (will rename directories!)"
fi
echo "============================================"
echo ""

# --- Phase 1: Rename legacy directories ---
echo "--- Phase 1: Rename legacy directories ---"
echo ""

# We iterate over entries in TASK_ROOT matching legacy patterns.
# Using process substitution to avoid subshell (preserves counter variables).
while IFS= read -r -d '' dirpath; do
    dirname="$(basename "$dirpath")"

    # Extract the number and optional suffix.
    # Pattern: (Ticket|TIcket|Tas) followed by optional space, then digits, then optional suffix
    if [[ "$dirname" =~ ^(Ticket|TIcket|Tas)[[:space:]]*([0-9]+)(.*) ]]; then
        number="${BASH_REMATCH[2]}"
        suffix="${BASH_REMATCH[3]}"
        new_name="legacy_ticket${number}${suffix}"
    else
        log_warn "SKIP: '$dirname' — could not parse number"
        ((count_skipped++)) || true
        continue
    fi

    new_path="${TASK_ROOT}/${new_name}"

    # Check if target already exists
    if [[ -e "$new_path" ]]; then
        log_warn "SKIP: '$dirname' -> '$new_name' (target already exists)"
        ((count_skipped++)) || true
        continue
    fi

    if $DRY_RUN; then
        log_dry "RENAME: '$dirname' -> '$new_name'"
    else
        if mv "$dirpath" "$new_path" 2>/dev/null; then
            log_info "RENAMED: '$dirname' -> '$new_name'"
        else
            log_err "FAILED: '$dirname' -> '$new_name'"
            ((count_errors++)) || true
            continue
        fi
    fi
    ((count_renamed++)) || true
done < <(find "$TASK_ROOT" -maxdepth 1 -mindepth 1 -type d \( -name 'Ticket*' -o -name 'TIcket*' -o -name 'Tas*' \) -print0 | sort -z)

echo ""

# --- Phase 2: Move loose numeric-prefixed files into corresponding ticket dirs ---
echo "--- Phase 2: Move loose numeric-prefixed files ---"
echo ""

# Find files like 442-test-scenarios.md, 477-bugs.md, etc.
# Using process substitution to avoid subshell (preserves counter variables).
while IFS= read -r -d '' filepath; do
    filename="$(basename "$filepath")"

    # Extract leading number
    if [[ "$filename" =~ ^([0-9]+)(-.*)$ ]]; then
        number="${BASH_REMATCH[1]}"
    else
        log_warn "SKIP file: '$filename' — no recognizable ticket number"
        ((count_skipped++)) || true
        continue
    fi

    # Look for a matching directory. Check both old and new naming.
    target_dir=""
    for candidate in \
        "${TASK_ROOT}/legacy_ticket${number}" \
        "${TASK_ROOT}/Ticket${number}" \
        "${TASK_ROOT}/TIcket${number}" \
        "${TASK_ROOT}/TIcket ${number}" \
        "${TASK_ROOT}/Tas${number}"; do
        if [[ -d "$candidate" ]]; then
            target_dir="$candidate"
            break
        fi
    done

    if [[ -z "$target_dir" ]]; then
        log_warn "SKIP file: '$filename' — no directory found for ticket $number"
        ((count_skipped++)) || true
        continue
    fi

    target_file="${target_dir}/${filename}"
    target_dirname="$(basename "$target_dir")"

    if [[ -e "$target_file" ]]; then
        log_warn "SKIP file: '$filename' — already exists in '$target_dirname/'"
        ((count_skipped++)) || true
        continue
    fi

    if $DRY_RUN; then
        log_dry "MOVE: '$filename' -> '$target_dirname/$filename'"
    else
        if mv "$filepath" "$target_file" 2>/dev/null; then
            log_info "MOVED: '$filename' -> '$target_dirname/$filename'"
        else
            log_err "FAILED to move: '$filename'"
            ((count_errors++)) || true
            continue
        fi
    fi
    ((count_loose_moved++)) || true
done < <(find "$TASK_ROOT" -maxdepth 1 -type f -name '[0-9]*' -print0 | sort -z)

echo ""

# --- Summary ---
echo "============================================"
echo "  Summary"
echo "============================================"
echo "  Directories to rename:  $count_renamed"
echo "  Loose files to move:    $count_loose_moved"
echo "  Skipped:                $count_skipped"
echo "  Errors:                 $count_errors"
if $DRY_RUN; then
    echo ""
    echo "  ** DRY-RUN — no changes were made **"
    echo "  Run with --execute to apply."
fi
echo "============================================"

# Exit with error code if there were errors
if [[ $count_errors -gt 0 ]]; then
    exit 1
fi

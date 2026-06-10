#!/usr/bin/env bash
# =============================================================================
# cleanup-task-root.sh
#
# Analyzes and cleans up loose files at the root of docs/taskTestingUown/.
# Groups files by ticket number and suggests moving them into their
# corresponding directories.
#
# Usage:
#   ./scripts/cleanup-task-root.sh              # dry-run (analysis + suggestions)
#   ./scripts/cleanup-task-root.sh --execute    # actually move files
#
# Handles:
#   - Numeric-prefixed files: 477-bugs.md -> ticket 477 dir
#   - RU-prefixed files: RU04..._fixPayment_483-report.md -> matching RU dir
#   - Misc files: listed but not moved (manual review needed)
# =============================================================================

set -euo pipefail

# --- Configuration ---
TASK_ROOT="$(cd "$(dirname "$0")/.." && pwd)/docs/taskTestingUown"
DRY_RUN=true

if [[ "${1:-}" == "--execute" ]]; then
    DRY_RUN=false
fi

# --- Counters ---
count_moved=0
count_skipped=0
count_orphaned=0
count_errors=0

# --- Color helpers ---
if [[ -t 1 ]]; then
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    RED='\033[0;31m'
    CYAN='\033[0;36m'
    BOLD='\033[1m'
    NC='\033[0m'
else
    GREEN='' YELLOW='' RED='' CYAN='' BOLD='' NC=''
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
echo "  cleanup-task-root.sh"
echo "  Target: $TASK_ROOT"
if $DRY_RUN; then
    echo "  Mode:   DRY-RUN (pass --execute to move)"
else
    echo "  Mode:   EXECUTE (will move files!)"
fi
echo "============================================"
echo ""

# Collect all loose files (not directories, not hidden)
mapfile -t all_files < <(find "$TASK_ROOT" -maxdepth 1 -type f ! -name '.*' | sort)

echo "Found ${#all_files[@]} loose files at root level."
echo ""

# --- Tracking for grouped display ---
declare -A ticket_groups  # ticket_number -> list of files (newline separated)
misc_files=()

# --- Categorize each file ---
for filepath in "${all_files[@]}"; do
    filename="$(basename "$filepath")"

    # Category 1: Numeric-prefixed files (e.g., 477-bugs.md, 500-test-report.md)
    if [[ "$filename" =~ ^([0-9]+)- ]]; then
        ticket_num="${BASH_REMATCH[1]}"
        ticket_groups["$ticket_num"]+="${filename}"$'\n'
        continue
    fi

    # Category 2: RU-prefixed files (e.g., RU04.26.1.50.2_fixPayment_483-report.md)
    # Extract ticket number from the end: _<number>-report.md, _<number>-scenarios.md, _<number>.md, etc.
    if [[ "$filename" =~ ^RU.*_([0-9]+)[-.].*$ ]]; then
        ticket_num="${BASH_REMATCH[1]}"
        ticket_groups["$ticket_num"]+="${filename}"$'\n'
        continue
    fi

    # Category 3: Other files that contain a ticket pattern (e.g., hotfix_...-scenarios.md)
    # These go to misc for manual review
    misc_files+=("$filename")
done

# --- Phase 1: Display grouped files and attempt moves ---
echo "--- Phase 1: Files grouped by ticket number ---"
echo ""

# Sort ticket numbers numerically
mapfile -t sorted_tickets < <(printf '%s\n' "${!ticket_groups[@]}" | sort -n)

for ticket_num in "${sorted_tickets[@]}"; do
    # Read the files for this ticket
    IFS=$'\n' read -r -d '' -a files <<< "${ticket_groups[$ticket_num]}" || true

    echo -e "${BOLD}Ticket #${ticket_num}${NC} (${#files[@]} file(s)):"

    # Find matching directory. Try multiple naming patterns.
    target_dir=""
    # Check for RU-prefixed directories containing this ticket number
    while IFS= read -r -d '' candidate; do
        target_dir="$candidate"
        break
    done < <(find "$TASK_ROOT" -maxdepth 1 -mindepth 1 -type d -name "*_${ticket_num}" -print0 2>/dev/null | head -z -n1)

    # Also check legacy and standard patterns if no RU match
    if [[ -z "$target_dir" ]]; then
        for candidate in \
            "${TASK_ROOT}/legacy_ticket${ticket_num}" \
            "${TASK_ROOT}/Ticket${ticket_num}" \
            "${TASK_ROOT}/TIcket${ticket_num}" \
            "${TASK_ROOT}/Tas${ticket_num}"; do
            if [[ -d "$candidate" ]]; then
                target_dir="$candidate"
                break
            fi
        done
    fi

    # Also try directories containing the ticket number with other patterns
    if [[ -z "$target_dir" ]]; then
        while IFS= read -r -d '' candidate; do
            target_dir="$candidate"
            break
        done < <(find "$TASK_ROOT" -maxdepth 1 -mindepth 1 -type d -name "*${ticket_num}*" -print0 2>/dev/null | head -z -n1)
    fi

    if [[ -n "$target_dir" ]]; then
        target_dirname="$(basename "$target_dir")"
        echo -e "  Target dir: ${GREEN}${target_dirname}/${NC}"
    else
        echo -e "  Target dir: ${RED}NONE FOUND${NC}"
    fi

    for file in "${files[@]}"; do
        [[ -z "$file" ]] && continue
        src="${TASK_ROOT}/${file}"

        if [[ -z "$target_dir" ]]; then
            echo "    - $file  (no matching directory — orphaned)"
            ((count_orphaned++)) || true
            continue
        fi

        dest="${target_dir}/${file}"

        if [[ -e "$dest" ]]; then
            echo "    - $file  (already exists in target — skipping)"
            ((count_skipped++)) || true
            continue
        fi

        if $DRY_RUN; then
            log_dry "  MOVE: $file -> $(basename "$target_dir")/$file"
        else
            if mv "$src" "$dest" 2>/dev/null; then
                log_info "  MOVED: $file -> $(basename "$target_dir")/$file"
            else
                log_err "  FAILED: $file"
                ((count_errors++)) || true
                continue
            fi
        fi
        ((count_moved++)) || true
    done
    echo ""
done

# --- Phase 2: Miscellaneous files (no ticket number found) ---
if [[ ${#misc_files[@]} -gt 0 ]]; then
    echo "--- Phase 2: Miscellaneous files (manual review needed) ---"
    echo ""
    for file in "${misc_files[@]}"; do
        echo "  - $file"
        ((count_orphaned++)) || true
    done
    echo ""
fi

# --- Summary ---
echo "============================================"
echo "  Summary"
echo "============================================"
echo "  Files to move:          $count_moved"
echo "  Skipped (exists):       $count_skipped"
echo "  Orphaned (no dir):      $count_orphaned"
echo "  Errors:                 $count_errors"
if $DRY_RUN; then
    echo ""
    echo "  ** DRY-RUN — no changes were made **"
    echo "  Run with --execute to apply."
fi
echo "============================================"

if [[ $count_errors -gt 0 ]]; then
    exit 1
fi

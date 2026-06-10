/**
 * TMS audit response shapes.
 *
 * Used by `TmsAuditClient` (v1 + legacy account-summary endpoints).
 * Field set is intentionally minimal — only the keys exercised by current
 * task tests are typed. The index signature keeps backwards compatibility
 * with call sites that read other fields untyped.
 *
 * `lastScheduleMovedDate` (with the extra "d") is the canonical Java field
 * spelling — do not "fix" to the issue-title spelling. Confirmed by dev
 * Marcos on 2026-05-22 (svc#536, MR !1444).
 *
 * `lastScheduleMovedDate` serializes as Java `LocalDateTime` without offset
 * (e.g. `"2026-05-22T12:05:20.756016"`). Server TZ is +3h relative to UTC
 * in qa1 — the DB stores the same moment as `timestamptz` in UTC. Use
 * `expectWithinTzWindow` for cross-source comparison.
 */
export interface TmsAccountSummaryResponse {
  /** Account primary key (numeric, but pg may return as string — typed permissive). */
  accountPk?: number | string;
  accountStatus?: string;
  customerPaymentFrequency?: string;
  nextDueDate?: string;
  /** Count of due-date moves; sourced from `uown_sv_sched_summary.due_date_moves`. */
  numberOfDueDateMoves?: number | null;
  /**
   * `row_created_timestamp` of the most-recent row in `uown_due_date_moves`.
   * `null` when the account has no moves yet (early-return path).
   * Serializes as Java `LocalDateTime` (no TZ offset).
   */
  lastScheduleMovedDate?: string | null;
  /** All other TmsAccountSummary fields stay opaque for now. */
  [key: string]: unknown;
}

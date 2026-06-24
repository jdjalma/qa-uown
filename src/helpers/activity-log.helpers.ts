/**
 * ACTIVITY-LOG ORACLE — one discoverable surface for activity-log assertions.
 *
 * Inviolable rule #13 ("no log = nothing is happening") forces a log assertion
 * per business action, so raw SELECTs against the activity-log tables were being
 * duplicated across 10+ specs. This module is that single surface:
 *
 *   - `uown_los_activity_log`  — NEW coverage here (Buddy Protection Plan and
 *     other LOS structured-log events live in THIS table, NOT `uown_los_lead_notes`).
 *   - `uown_los_lead_notes`    — already covered by `esign-db.helpers.ts`; those
 *     helpers are RE-EXPORTED here (not copied) so callers import every
 *     "activity log" check from one place.
 *
 * The new helpers MIRROR the lead-note ones in shape and contract:
 *   findActivityLogContaining   ↔ findLeadNoteContaining
 *   countActivityLogContaining  ↔ countLeadNotesContaining
 *   waitForActivityLogSubstring ↔ waitForLeadNoteSubstring
 *
 * Both LOS activity-log entries can be keyed by `lead_pk` (origination side) or
 * `account_pk` (servicing side) — `findActivityLogContaining` takes a `keyColumn`
 * so the caller picks which FK to filter on (default `lead_pk`).
 *
 * Built on the shared `pollUntil` primitive (common.helpers) and the
 * `DatabaseHelpers` query layer (`db.query`/`db.queryOne`) — NO raw `new pg.Client`
 * / `Pool`. The spec receives `db` via the base-test fixture.
 *
 * CONTRACT: helpers RETURN the row (or null); they DO NOT call `expect()`.
 * Assertions belong in the test (project rule). `waitForActivityLogSubstring`
 * throws on timeout with a descriptive message (mirrors `waitForLeadNoteSubstring`).
 *
 * Schema (verified): `uown_los_activity_log` has 18 columns
 * (docs/taskTestingUown/database-schema.md §uown_los_activity_log). Columns used
 * here — `pk`, `lead_pk`, `account_pk`, `notes` (text), `log_type` (varchar),
 * `created_by` (varchar), `agent` (varchar), `row_created_timestamp`,
 * `deleted` (boolean) — are corroborated by the live spec
 * RU06.26.1.53.0_completeApplicationSecurityPiiDataAccessReduced.spec.ts
 * (DB-proven 2026-06-21, qa2, `SELECT pk, notes ... WHERE lead_pk = $1 AND notes ILIKE`)
 * and by `correspondence.helpers.ts` (`SELECT pk, log_type, notes, created_by,
 * row_created_timestamp FROM uown_los_activity_log`).
 *
 * Soft-deleted rows (`deleted = true`) are excluded from all reads — a hidden/
 * deleted log is not an observable consequence of a business action.
 *
 * Security: SELECT-only. NO INSERT/UPDATE/DELETE. See `.claude/rules/security.md`
 * and CLAUDE.md Exception 3.
 */

import { TIMEOUTS } from '../config/constants.js';
import { pollUntil } from './common.helpers.js';
import type { DatabaseHelpers } from './database.helpers.js';

// ── Re-export the lead-note surface (NOT copied) ──────────────────────────
//
// `uown_los_lead_notes` is already covered by esign-db.helpers.ts. Re-export so
// callers get the full "activity log" toolkit from this one module. Adding a
// log assertion? Import from here regardless of which table the event lands in.
export {
  findLeadNoteContaining,
  countLeadNotesContaining,
  waitForLeadNoteSubstring,
  getLeadNotesByLeadPk,
} from './esign-db.helpers.js';
export type { LeadNote } from './esign-db.helpers.js';

// Discoverability alias for the lead-note waiter — re-export only, NO new logic.
// Keeps the `waitFor<Surface>` naming symmetric with `waitForActivityLogSubstring`.
export { waitForLeadNoteSubstring as waitForLeadNote } from './esign-db.helpers.js';

// ── Types ─────────────────────────────────────────────────────────────────

/** Which FK column to filter `uown_los_activity_log` on. */
export type ActivityLogKeyColumn = 'lead_pk' | 'account_pk';

/** A single `uown_los_activity_log` row (camelCase projection). */
export interface ActivityLogEntry {
  pk: number;
  leadPk: number | null;
  accountPk: number | null;
  /** Free-text log body (`notes`, text column). */
  notes: string;
  /** Structured log category, e.g. 'CORRESPONDENCE', 'DATA_CHANGE'. */
  logType: string | null;
  createdBy: string | null;
  agent: string | null;
  rowCreatedTimestamp: Date | null;
}

interface PollOptions {
  timeoutMs?: number;
  intervalMs?: number;
}

// ── Internal row shape (snake_case as returned by pg) ─────────────────────

interface ActivityLogRow {
  pk: number | string;
  lead_pk: number | string | null;
  account_pk: number | string | null;
  notes: string | null;
  log_type: string | null;
  created_by: string | null;
  agent: string | null;
  row_created_timestamp: Date | string | null;
}

function toNumOrNull(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  return Number(v);
}

function toDateOrNull(v: Date | string | null | undefined): Date | null {
  if (v === null || v === undefined) return null;
  return v instanceof Date ? v : new Date(v);
}

function mapActivityLog(row: ActivityLogRow): ActivityLogEntry {
  return {
    pk: Number(row.pk),
    leadPk: toNumOrNull(row.lead_pk),
    accountPk: toNumOrNull(row.account_pk),
    notes: row.notes ?? '',
    logType: row.log_type,
    createdBy: row.created_by,
    agent: row.agent,
    rowCreatedTimestamp: toDateOrNull(row.row_created_timestamp),
  };
}

// Shared projection — keeps the column list in one place. `deleted = false`
// (or NULL, treated as not-deleted) so soft-deleted log rows are never returned.
const SELECT_ACTIVITY_LOG = `
  SELECT pk, lead_pk, account_pk, notes, log_type, created_by, agent,
         row_created_timestamp
    FROM uown_los_activity_log
`;
const NOT_DELETED = `(deleted IS NOT TRUE)`;

// ============================================================
// uown_los_activity_log  (structured LOS log, substring matching)
// ============================================================

/**
 * Find the most recent `uown_los_activity_log` entry containing `substring`
 * (ILIKE, case-insensitive) for the given key. Returns null if no match.
 *
 * Mirror of `findLeadNoteContaining` for the activity-log table. `keyColumn`
 * selects which FK to filter on — default `lead_pk` (origination); pass
 * `account_pk` for servicing-side logs.
 *
 * @param db DatabaseHelpers (from the base-test `db` fixture).
 * @param keyPk Value of the FK column (`lead_pk` or `account_pk`).
 * @param substring Text to match (bound parameter — no string concat).
 * @param keyColumn FK column to filter on (default `lead_pk`).
 */
export async function findActivityLogContaining(
  db: DatabaseHelpers,
  keyPk: number | string,
  substring: string,
  keyColumn: ActivityLogKeyColumn = 'lead_pk',
): Promise<ActivityLogEntry | null> {
  const row = await db.queryOne<ActivityLogRow>(
    `${SELECT_ACTIVITY_LOG}
     WHERE ${keyColumn} = $1
       AND ${NOT_DELETED}
       AND notes ILIKE '%' || $2 || '%'
     ORDER BY row_created_timestamp DESC NULLS LAST, pk DESC
     LIMIT 1`,
    [keyPk, substring],
  );
  return row ? mapActivityLog(row) : null;
}

/**
 * Count `uown_los_activity_log` entries containing `substring` — for idempotency
 * assertions (re-running the same backend action should NOT duplicate the log).
 *
 * Mirror of `countLeadNotesContaining`.
 */
export async function countActivityLogContaining(
  db: DatabaseHelpers,
  keyPk: number | string,
  substring: string,
  keyColumn: ActivityLogKeyColumn = 'lead_pk',
): Promise<number> {
  const rows = await db.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
       FROM uown_los_activity_log
      WHERE ${keyColumn} = $1
        AND ${NOT_DELETED}
        AND notes ILIKE '%' || $2 || '%'`,
    [keyPk, substring],
  );
  return rows[0] ? parseInt(rows[0].count, 10) : 0;
}

/**
 * Wait until at least one `uown_los_activity_log` entry containing `substring`
 * exists for the key. The PP / Buddy events (and most LOS structured logs) are
 * written ASYNC after the triggering action, so a single-shot query races the
 * backend — poll until it lands. Throws on timeout with a descriptive message
 * including the substring.
 *
 * Mirror of `waitForLeadNoteSubstring`. Built on the shared `pollUntil`.
 */
export async function waitForActivityLogSubstring(
  db: DatabaseHelpers,
  keyPk: number | string,
  substring: string,
  options: PollOptions & { keyColumn?: ActivityLogKeyColumn } = {},
): Promise<ActivityLogEntry> {
  const timeoutMs = options.timeoutMs ?? TIMEOUTS.DB_WAIT;
  const keyColumn = options.keyColumn ?? 'lead_pk';
  const result = await pollUntil<ActivityLogEntry>(
    async () => findActivityLogContaining(db, keyPk, substring, keyColumn),
    {
      timeoutMs: options.timeoutMs,
      intervalMs: options.intervalMs,
      logPrefix: 'waitForActivityLogSubstring',
    },
  );
  if (!result) {
    throw new Error(
      `Timed out waiting for activity log containing "${substring}" on ` +
        `${keyColumn}=${keyPk} in uown_los_activity_log after ${timeoutMs}ms`,
    );
  }
  return result;
}

// Discoverability alias — symmetric with `waitForLeadNote`. Re-name only, the
// logic lives entirely in `waitForActivityLogSubstring` above.
export { waitForActivityLogSubstring as waitForActivityNote };

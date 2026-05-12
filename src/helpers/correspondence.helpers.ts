/**
 * Correspondence DB validation helpers (task #489 — EZPawn approval email
 * template replacement).
 *
 * All queries are read-only (SELECT) and parameterized via $1/$2 placeholders.
 * No INSERT/UPDATE/DELETE — CLAUDE.md Exception 3.
 *
 * ⚠ Schema reconciliation — the task brief referenced a table
 * `uown_los_lead_log` with a column `note` (singular). The actual schema
 * (docs/taskTestingUown/database-schema.md §uown_los_activity_log) shows:
 *   - Table:   `uown_los_activity_log`  (the LOS audit log; the SVC twin is
 *              `uown_sv_activity_log`, see DatabaseHelpers.getActivityLogsByAccount).
 *   - Columns: `pk`, `log_type` (varchar), `notes` (plural, text),
 *              `created_by` (varchar), `row_created_timestamp` (timestamp).
 *   - FK:      `lead_pk` (bigint).
 * This helper targets the real table; the exposed TS interface keeps
 * camelCase (`note`, `createdAt`) for caller ergonomics and does the
 * snake_case ↔ camelCase mapping here.
 */

import type { DatabaseHelpers } from './database.helpers.js';
import { sleep } from './common.helpers.js';

// ── Types ────────────────────────────────────────────────────────────────

/**
 * Audit-log row for `log_type = 'CORRESPONDENCE'` entries in
 * `uown_los_activity_log`. Named with the `AuditLog` suffix to avoid
 * collision with `CorrespondenceLogRow` in settled-in-full.helpers.ts,
 * which describes a row from the unrelated `uown_correspondence_logs`
 * table (different schema, different semantics).
 */
export interface CorrespondenceAuditLogRow {
  pk: number;
  logType: string;
  note: string;
  createdBy: string | null;
  createdAt: Date;
}

interface EmailQueueTemplateRow {
  template_name: string | null;
}

interface LosActivityLogRow {
  pk: number | string;
  log_type: string | null;
  notes: string | null;
  created_by: string | null;
  row_created_timestamp: Date | string | null;
}

interface MerchantChargeFeeRow {
  charge_processing_fee_before_esign: boolean | null;
}

// ── Polling config for #1 (email queue row is written ~seconds after send) ──

const EMAIL_TEMPLATE_POLL_TIMEOUT_MS = 15_000;
const EMAIL_TEMPLATE_POLL_INITIAL_MS = 1_000;
const EMAIL_TEMPLATE_POLL_MAX_MS = 3_000;
const EMAIL_TEMPLATE_POLL_BACKOFF = 1.5;

// ── 1. Email template name (polled) ──────────────────────────────────────

/**
 * Returns the most-recent `template_name` from `uown_email_queue` whose
 * name matches `%ApprovalEmail%` for the given lead. Polls for up to 15 s
 * with exponential backoff (1 s → 3 s, ×1.5) because the row is written
 * a few seconds AFTER approval email dispatch.
 *
 * Returns `null` if no matching row appears within the timeout — the caller
 * uses this to distinguish "email not queued at all" from "queued with the
 * wrong template_name".
 */
export async function getEmailTemplateName(
  db: DatabaseHelpers,
  leadPk: number | string,
): Promise<string | null> {
  const deadline = Date.now() + EMAIL_TEMPLATE_POLL_TIMEOUT_MS;
  let interval = EMAIL_TEMPLATE_POLL_INITIAL_MS;

  while (Date.now() < deadline) {
    try {
      const row = await db.queryOne<EmailQueueTemplateRow>(
        `SELECT template_name
           FROM uown_email_queue
          WHERE lead_pk = $1
            AND template_name LIKE '%ApprovalEmail%'
          ORDER BY pk DESC
          LIMIT 1`,
        [leadPk],
      );
      if (row?.template_name) return row.template_name;
    } catch (error) {
      console.warn(`[getEmailTemplateName] poll error: ${(error as Error).message}`);
    }
    await sleep(interval);
    interval = Math.min(
      Math.floor(interval * EMAIL_TEMPLATE_POLL_BACKOFF),
      EMAIL_TEMPLATE_POLL_MAX_MS,
    );
  }
  return null;
}

// ── 2. Correspondence audit logs ─────────────────────────────────────────

/**
 * Returns all `log_type = 'CORRESPONDENCE'` entries in the LOS audit log
 * (`uown_los_activity_log`) for the given lead, newest first.
 *
 * Note: task brief referenced `uown_los_lead_log`/`note` — schema doc
 * confirms the real table is `uown_los_activity_log` with a `notes` column.
 * The TS field is still `note` (singular) to match the requested public API.
 */
export async function getCorrespondenceLogs(
  db: DatabaseHelpers,
  leadPk: number | string,
): Promise<CorrespondenceAuditLogRow[]> {
  const rows = await db.query<LosActivityLogRow>(
    `SELECT pk, log_type, notes, created_by, row_created_timestamp
       FROM uown_los_activity_log
      WHERE lead_pk = $1
        AND log_type = 'CORRESPONDENCE'
      ORDER BY pk DESC`,
    [leadPk],
  );

  return rows.map((r) => {
    const createdAt =
      r.row_created_timestamp instanceof Date
        ? r.row_created_timestamp
        : r.row_created_timestamp != null
          ? new Date(r.row_created_timestamp)
          : new Date(NaN);
    return {
      pk: Number(r.pk),
      logType: r.log_type ?? '',
      note: r.notes ?? '',
      createdBy: r.created_by,
      createdAt,
    };
  });
}

// ── 3. Merchant charge-processing-fee flag ───────────────────────────────

/**
 * Returns the `charge_processing_fee_before_esign` boolean for the merchant
 * identified by `ref_merchant_code`. Throws when the merchant is not found —
 * the CT-02 "NO MONEY DOWN" assertion can't be made conditional on an
 * unknown merchant.
 */
export async function getMerchantChargeProcessingFee(
  db: DatabaseHelpers,
  refMerchantCode: string,
): Promise<boolean> {
  const row = await db.queryOne<MerchantChargeFeeRow>(
    `SELECT charge_processing_fee_before_esign
       FROM uown_merchant
      WHERE ref_merchant_code = $1`,
    [refMerchantCode],
  );
  if (!row) {
    throw new Error(`Merchant not found: ${refMerchantCode}`);
  }
  return row.charge_processing_fee_before_esign === true;
}

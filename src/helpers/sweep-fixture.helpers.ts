/**
 * Sweep Fixture Helpers — dynamic fixture discovery + restoration for sweep specs.
 *
 * The servicing sweep specs were originally written for dev3 (a disposable local sandbox)
 * with hardcoded account/lead PKs and a hardcoded CC token. On qa1 — a SHARED environment
 * used by other QA teams for UAT — hardcoded PKs are unsafe (they may not exist, may be in
 * the wrong state, or may belong to someone else's in-flight test). These helpers replace
 * the hardcoded fixtures with dynamic discovery of IDLE records:
 *
 *   - ACTIVE accounts (optionally with a chargeable CC token on file) that have NO activity
 *     in the last 30 days (no credit-card transaction, no active payment arrangement, no
 *     activity-log entry) — i.e. nobody else is exercising them right now.
 *   - UW_APPROVED leads with no recent lead-note activity, for the lead-expiration and
 *     unutilized-approval sweeps.
 *
 * Each discovery function also returns the ORIGINAL values of every field the spec is about
 * to mutate, so the spec can restore them in its teardown (afterAll / finally). On a shared
 * env, every setup mutation MUST be reverted — see the `restore*` helpers below.
 *
 * The "no activity in last 30 days" filter is the core safety guarantee: it makes it
 * extremely unlikely that the chosen record is part of another team's running test.
 *
 * Discovery is read-only (SELECT). The mutation/restore helpers are thin typed wrappers
 * around db.executeUpdate — they are only invoked by specs that already operate under the
 * user's explicit Exception-3 authorization for sweep setup + restoration.
 *
 * Source-tagged (rule #16): table/column names verified live against qa1 information_schema
 * on 2026-06-10 (uown_sv_account, uown_sv_credit_card[is_deleted, cc_token, cc_type],
 * uown_sv_payment_arrangement[status IN IN_PROGRESS/NOT_STARTED], uown_sv_activity_log,
 * uown_los_lead, uown_los_uwdata, uown_los_email).
 */
import { expect } from '@playwright/test';
import type { DatabaseHelpers } from './database.helpers.js';
import type { ApiClients } from '../support/base-test.js';

/** Records considered "recently active" within this window are excluded from discovery. */
const IDLE_WINDOW = "30 days";

/** Active payment-arrangement statuses (qa1 enum: NOT_STARTED, IN_PROGRESS, SUCCESS, FAILED). */
const ACTIVE_ARRANGEMENT_STATUSES = "('IN_PROGRESS','NOT_STARTED')";

// ── Sweep log helpers (shared by the *-sweeps-servicing specs) ─────────
// Previously copy-pasted inline in 5 specs (sweepLogBaseline) / 4 specs
// (triggerAndWaitSweepLog) — identical bodies, consolidated here 2026-06-18.

/** MAX(pk) baseline for a sweep's logs (0 when there are none). */
export async function sweepLogBaseline(db: DatabaseHelpers, sweepName: string): Promise<number> {
  return db.getSingleNumber(
    `SELECT COALESCE(MAX(pk), 0) FROM uown_sweep_logs WHERE sweep_name = $1`,
    [sweepName],
  );
}

/** Reads the `error` text of the newest uown_sweep_logs row above `prevPk` (empty string if none). */
export async function getSweepLogError(
  db: DatabaseHelpers,
  sweepName: string,
  prevPk: number,
): Promise<string> {
  const rows = await db.query<{ error: string | null }>(
    `SELECT error FROM uown_sweep_logs WHERE sweep_name = $1 AND pk > $2 ORDER BY pk DESC LIMIT 1`,
    [sweepName, prevPk],
  );
  return String(rows[0]?.error ?? '').trim();
}

/** Outcome of {@link classifySweepError}. */
export type SweepErrorKind = 'clean' | 'provisioning' | 'environment' | 'product';

/**
 * Classifies a `uown_sweep_logs.error` string (CLAUDE.md rule #10 conservative classification).
 * Consolidated 2026-06-23 from the local copy in business-sweeps-servicing.spec.ts so the
 * funding/refund report-content spec can reuse the exact same taxonomy (rule #2 — no duplicate).
 *
 *   - 'clean'        — no error.
 *   - 'provisioning' — missing table/column in the env (relation/column does not exist). The
 *                      sweep SQL is correct (object exists in stg/prod) but the env was not
 *                      migrated. NOT a product bug; the sweep cannot run there → skip.
 *   - 'environment'  — processor/connector/external-sink absent, or informational
 *                      ("No transactions found", "FAIL : N" from a missing payment gateway).
 *                      Expected in lower envs, NOT a product bug.
 *   - 'product'      — a genuine code-level exception (NPE, validation failure) not explained
 *                      by missing infra. Report as [OBSERVAÇÃO] for dev review.
 */
export function classifySweepError(error: string): SweepErrorKind {
  if (!error) return 'clean';
  if (/relation "\w+" does not exist|column [\w.]+ does not exist/i.test(error)) return 'provisioning';
  if (/No transactions found|No recoveries found|FAIL : \d+|Failed to send ACH|TaxCloud|Bearer |processor|connector|gateway/i.test(error)) {
    return 'environment';
  }
  return 'product';
}

/**
 * Triggers a sweep, waits for a new row in uown_sweep_logs (monotonic pk > baseline)
 * and returns the recorded processed count. The count can be 0 even in a successful sweep
 * (written async after processing) — callers must NOT assert `>= 1`.
 */
export async function triggerAndWaitSweepLog(
  api: ApiClients,
  db: DatabaseHelpers,
  sweepName: string,
  prevSweepLogPk: number,
): Promise<number> {
  const resp = await api.scheduledTask.triggerScheduledTask(sweepName);
  expect(resp.status, `triggerScheduledTask ${sweepName}`).toBe(200);
  const newLog = await db.waitForRecord(
    'uown_sweep_logs',
    'sweep_name = $1 AND pk > $2',
    [sweepName, prevSweepLogPk],
    30_000,
  );
  expect(newLog, `new uown_sweep_logs row for ${sweepName}`).toBeTruthy();
  // COALESCE so a NULL processed column does not break getSingleNumber.
  return db.getSingleNumber(
    `SELECT COALESCE(MAX(number_of_records_processed), 0) FROM uown_sweep_logs
     WHERE sweep_name = $1 AND pk > $2`,
    [sweepName, prevSweepLogPk],
  );
}

// ── Return shapes ───────────────────────────────────────────────────────────

/** An idle ACTIVE account with a chargeable card, plus originals for restoration. */
export interface IdleAccountWithCard {
  accountPk: string;
  cardPk: string;
  cardToken: string;
  ccType: string | null;
  /** Original auto_pay_types (uown_sv_account) — restore after mutating autopay. */
  originalAutoPayTypes: string | null;
  /** Original rating (uown_sv_account) — restore after mutating rating. */
  originalRating: string | null;
}

/** An idle ACTIVE account (no card requirement), plus originals for restoration. */
export interface IdleAccount {
  accountPk: string;
  originalAutoPayTypes: string | null;
  originalRating: string | null;
}

/** An idle UW_APPROVED lead, plus the original expiration_date for restoration. */
export interface ExpirableLead {
  leadPk: string;
  /** Original expiration_date (uown_los_lead) as ISO date string, or null. */
  originalExpirationDate: string | null;
}

/** An idle UW_APPROVED lead eligible for UnutilizedApprovalSweep, plus uw originals. */
export interface UnutilizedLead {
  leadPk: string;
  /** Original decision_made_at (uown_los_uwdata) as ISO string, or null. */
  originalDecisionMadeAt: string | null;
}

// ── Discovery (read-only SELECT) ─────────────────────────────────────────────

/**
 * Finds an idle ACTIVE account that has a non-deleted credit card with a usable cc_token
 * AND no activity in the last 30 days (no cct, no active arrangement, no activity-log row).
 *
 * Returns the originals (auto_pay_types, rating) so a spec can restore them after mutating.
 * Prefers a card whose cc_type is known (non-null) but accepts a null cc_type (the sweep
 * specs insert their own cc_type on the synthetic transaction).
 *
 * @returns the fixture, or null when nothing eligible exists (spec should skip honestly).
 */
export async function findIdleActiveAccountWithCard(
  db: DatabaseHelpers,
): Promise<IdleAccountWithCard | null> {
  const row = await db.queryOne<{
    account_pk: string;
    card_pk: string;
    cc_token: string;
    cc_type: string | null;
    auto_pay_types: string | null;
    rating: string | null;
  }>(
    `SELECT a.pk AS account_pk,
            cc.pk AS card_pk,
            cc.cc_token,
            cc.cc_type,
            a.auto_pay_types,
            a.rating
     FROM uown_sv_account a
     JOIN uown_sv_credit_card cc ON cc.account_pk = a.pk
       AND COALESCE(cc.is_deleted, false) = false
       AND cc.cc_token IS NOT NULL AND cc.cc_token <> ''
     WHERE a.account_status = 'ACTIVE'
       AND NOT EXISTS (
         SELECT 1 FROM uown_sv_credit_card_transaction t
         WHERE t.account_pk = a.pk AND t.row_created_timestamp >= NOW() - INTERVAL '${IDLE_WINDOW}')
       AND NOT EXISTS (
         SELECT 1 FROM uown_sv_payment_arrangement pa
         WHERE pa.account_pk = a.pk AND pa.status IN ${ACTIVE_ARRANGEMENT_STATUSES})
       AND NOT EXISTS (
         SELECT 1 FROM uown_sv_activity_log al
         WHERE al.account_pk = a.pk AND al.row_created_timestamp >= NOW() - INTERVAL '${IDLE_WINDOW}')
     ORDER BY (cc.cc_type IS NULL), a.pk DESC
     LIMIT 1`,
  );
  if (!row) return null;
  return {
    accountPk: String(row.account_pk),
    cardPk: String(row.card_pk),
    cardToken: String(row.cc_token),
    ccType: row.cc_type ?? null,
    originalAutoPayTypes: row.auto_pay_types ?? null,
    originalRating: row.rating ?? null,
  };
}

/**
 * Finds an idle ACTIVE account (no card requirement) with no activity in the last 30 days.
 * Optionally excludes a set of account PKs (e.g. the one already claimed by another scenario
 * in the same serial spec) so two scenarios don't fight over the same record.
 *
 * @returns the fixture, or null when nothing eligible exists.
 */
export async function findIdleActiveAccount(
  db: DatabaseHelpers,
  excludeAccountPks: string[] = [],
): Promise<IdleAccount | null> {
  const exclusion =
    excludeAccountPks.length > 0
      ? `AND a.pk NOT IN (${excludeAccountPks.map(p => Number(p)).filter(n => !Number.isNaN(n)).join(',') || '-1'})`
      : '';
  const row = await db.queryOne<{
    account_pk: string;
    auto_pay_types: string | null;
    rating: string | null;
  }>(
    `SELECT a.pk AS account_pk, a.auto_pay_types, a.rating
     FROM uown_sv_account a
     WHERE a.account_status = 'ACTIVE'
       ${exclusion}
       AND NOT EXISTS (
         SELECT 1 FROM uown_sv_credit_card_transaction t
         WHERE t.account_pk = a.pk AND t.row_created_timestamp >= NOW() - INTERVAL '${IDLE_WINDOW}')
       AND NOT EXISTS (
         SELECT 1 FROM uown_sv_payment_arrangement pa
         WHERE pa.account_pk = a.pk AND pa.status IN ${ACTIVE_ARRANGEMENT_STATUSES})
       AND NOT EXISTS (
         SELECT 1 FROM uown_sv_activity_log al
         WHERE al.account_pk = a.pk AND al.row_created_timestamp >= NOW() - INTERVAL '${IDLE_WINDOW}')
     ORDER BY a.pk DESC
     LIMIT 1`,
  );
  if (!row) return null;
  return {
    accountPk: String(row.account_pk),
    originalAutoPayTypes: row.auto_pay_types ?? null,
    originalRating: row.rating ?? null,
  };
}

/**
 * Finds an idle UW_APPROVED lead (no lead-note activity in the last 30 days) for the
 * lead-expiration sweep. Returns the original expiration_date for restoration.
 *
 * @returns the fixture, or null when nothing eligible exists.
 */
export async function findExpirableLead(
  db: DatabaseHelpers,
): Promise<ExpirableLead | null> {
  const row = await db.queryOne<{ lead_pk: string; expiration_date: string | null }>(
    `SELECT l.pk AS lead_pk, l.expiration_date
     FROM uown_los_lead l
     WHERE l.lead_status = 'UW_APPROVED'
       AND NOT EXISTS (
         SELECT 1 FROM uown_los_lead_notes n
         WHERE n.lead_pk = l.pk AND n.row_created_timestamp >= NOW() - INTERVAL '${IDLE_WINDOW}')
     ORDER BY l.pk DESC
     LIMIT 1`,
  );
  if (!row) return null;
  return {
    leadPk: String(row.lead_pk),
    originalExpirationDate: row.expiration_date != null ? String(row.expiration_date) : null,
  };
}

/**
 * Finds an idle UW_APPROVED lead that also satisfies the UnutilizedApprovalSweep joins
 * (uw_status='APPROVED', has an emailable uown_los_email row) — and no recent lead-note
 * activity. Returns the original decision_made_at for restoration.
 *
 * Optionally excludes a lead PK already claimed by another scenario (e.g. the expiration
 * lead) so the two sweeps don't mutate the same lead.
 *
 * @returns the fixture, or null when nothing eligible exists.
 */
export async function findUwApprovedLeadForUnutilized(
  db: DatabaseHelpers,
  excludeLeadPks: string[] = [],
): Promise<UnutilizedLead | null> {
  const exclusion =
    excludeLeadPks.length > 0
      ? `AND l.pk NOT IN (${excludeLeadPks.map(p => Number(p)).filter(n => !Number.isNaN(n)).join(',') || '-1'})`
      : '';
  const row = await db.queryOne<{ lead_pk: string; decision_made_at: string | null }>(
    `SELECT l.pk AS lead_pk, uw.decision_made_at
     FROM uown_los_lead l
     JOIN uown_los_uwdata uw ON uw.lead_pk = l.pk AND uw.uw_status = 'APPROVED'
     JOIN uown_los_email e ON e.lead_pk = l.pk AND COALESCE(e.do_not_email, false) = false
     WHERE l.lead_status = 'UW_APPROVED'
       ${exclusion}
       AND NOT EXISTS (
         SELECT 1 FROM uown_los_lead_notes n
         WHERE n.lead_pk = l.pk AND n.row_created_timestamp >= NOW() - INTERVAL '${IDLE_WINDOW}')
     ORDER BY l.pk DESC
     LIMIT 1`,
  );
  if (!row) return null;
  return {
    leadPk: String(row.lead_pk),
    originalDecisionMadeAt: row.decision_made_at != null ? String(row.decision_made_at) : null,
  };
}

// ── Restoration helpers (typed wrappers around db.executeUpdate) ─────────────
// These revert a single mutated field to its captured original. They are tolerant of a
// null original (sets the column back to NULL) and are safe to call from a finally block.
// Every restore is best-effort logged by the caller; failures here should not mask the
// test result, so specs wrap teardown in try/catch and console.warn on failure.

/** Restore uown_sv_account.auto_pay_types to its captured original (NULL-safe). */
export async function restoreAutoPayTypes(
  db: DatabaseHelpers,
  accountPk: string,
  original: string | null,
): Promise<void> {
  await db.executeUpdate(
    `UPDATE uown_sv_account SET auto_pay_types = $1 WHERE pk = $2`,
    [original, accountPk],
  );
}

/** Restore uown_sv_account.rating to its captured original (NULL-safe). */
export async function restoreRating(
  db: DatabaseHelpers,
  accountPk: string,
  original: string | null,
): Promise<void> {
  await db.executeUpdate(
    `UPDATE uown_sv_account SET rating = $1 WHERE pk = $2`,
    [original, accountPk],
  );
}

/** Restore uown_los_lead.expiration_date to its captured original (NULL-safe). */
export async function restoreLeadExpiration(
  db: DatabaseHelpers,
  leadPk: string,
  original: string | null,
): Promise<void> {
  await db.executeUpdate(
    `UPDATE uown_los_lead SET expiration_date = $1::timestamp WHERE pk = $2`,
    [original, leadPk],
  );
}

/** Restore uown_los_uwdata.decision_made_at to its captured original (NULL-safe). */
export async function restoreDecisionMadeAt(
  db: DatabaseHelpers,
  leadPk: string,
  original: string | null,
): Promise<void> {
  await db.executeUpdate(
    `UPDATE uown_los_uwdata SET decision_made_at = $1::timestamp WHERE lead_pk = $2`,
    [original, leadPk],
  );
}

/**
 * Captures the current value of a single column for restoration. Returns the value as a
 * string (or null). Use this for ad-hoc columns the specs mutate that don't have a
 * dedicated capture above (e.g. sched_summary.first_payment_due_date, receivable.due_date,
 * sched_summary.delinquency_as_of_date / last_payment_date, account.pay_off_date_time,
 * send_sv_ach_payment.status, esign_document.status, los_contract.contract_status).
 */
export async function captureColumn(
  db: DatabaseHelpers,
  table: string,
  column: string,
  pkColumn: string,
  pkValue: string | number,
): Promise<string | null> {
  const row = await db.queryOne<Record<string, unknown>>(
    `SELECT ${column} AS v FROM ${table} WHERE ${pkColumn} = $1`,
    [pkValue],
  );
  const v = row?.v;
  return v != null ? String(v) : null;
}

/**
 * Restores a single column to a captured value (NULL-safe). The optional `cast` lets the
 * caller coerce a string original back to its native type (e.g. 'date', 'timestamp') —
 * Postgres needs an explicit cast when binding a string into a date/timestamp column.
 */
export async function restoreColumn(
  db: DatabaseHelpers,
  table: string,
  column: string,
  pkColumn: string,
  pkValue: string | number,
  original: string | null,
  cast?: 'date' | 'timestamp',
): Promise<void> {
  const bind = cast ? `$1::${cast}` : `$1`;
  await db.executeUpdate(
    `UPDATE ${table} SET ${column} = ${bind} WHERE ${pkColumn} = $2`,
    [original, pkValue],
  );
}

/**
 * Deletes a synthetic row this spec created, by primary key. No-op when pk <= 0.
 * Used to remove the synthetic cct / achpayment rows the sweep specs insert as setup so
 * they don't accumulate on the shared qa1 env.
 *
 *  -- teardown: remove synthetic row created by this spec
 */
export async function deleteSyntheticRow(
  db: DatabaseHelpers,
  table: string,
  pk: number,
): Promise<void> {
  if (!pk || pk <= 0) return;
  // -- teardown: remove synthetic row created by this spec
  await db.executeUpdate(`DELETE FROM ${table} WHERE pk = $1`, [pk]);
}

// ── Pause-aware sweep trigger ────────────────────────────────────────────────

/** Outcome of a pause-aware trigger, so the caller can decide on teardown. */
export interface PausedSweepResult {
  /** A new uown_sweep_logs row appeared above `prevSweepLogPk`. */
  ran: boolean;
  /** The sweep was paused (is_active=false) BEFORE we triggered it. */
  wasPaused: boolean;
  /** We called resumeScheduledTask to wake it (only when wasPaused AND trigger needed it). */
  didResume: boolean;
  /** The MAX(pk) sweep_log baseline used for the wait. */
  prevSweepLogPk: number;
}

/** Reads is_active for a sweep from uown_scheduled_task (true when active, false when paused). */
async function isSweepActive(db: DatabaseHelpers, sweepName: string): Promise<boolean> {
  const v = await db.getSingleString(
    `SELECT is_active FROM uown_scheduled_task WHERE scheduled_task_name = $1`,
    [sweepName],
  );
  return v === 't' || v === 'true';
}

/** MAX(pk) baseline for a sweep's log rows (0 when none). */
async function sweepLogMaxPk(db: DatabaseHelpers, sweepName: string): Promise<number> {
  return db.getSingleNumber(
    `SELECT COALESCE(MAX(pk), 0) FROM uown_sweep_logs WHERE sweep_name = $1`,
    [sweepName],
  );
}

/**
 * Triggers a sweep that may be PAUSED on qa1 (63/77 sweeps are paused there) while NEVER
 * leaving the sweep's is_active flag mutated.
 *
 * Behaviour:
 *   1. Record the sweep_log baseline + whether the sweep is currently paused (is_active=false).
 *   2. triggerScheduledTask → wait up to `firstWaitMs` for a new sweep_log row.
 *   3. If a row appeared → the trigger executes paused tasks directly; we are DONE and we
 *      NEVER call resume (no is_active mutation on the shared env). `didResume=false`.
 *   4. If NO row appeared AND the sweep was paused → resume → trigger again → wait again.
 *      The CALLER is responsible for pausing it back in teardown (we expose `didResume` and
 *      `wasPaused` so the caller can restore is_active). We do NOT pause it back here so the
 *      restore stays in the spec's teardown (single place, runs on failure too).
 *
 * Returns a PausedSweepResult describing exactly what happened, so the caller can both assert
 * the mechanism (ran) and restore state (pause back iff didResume).
 *
 * NOTE: this helper deliberately does NOT pause the task back — restoration of is_active must
 * live in the spec teardown (afterAll/finally) alongside the data restores, guaranteeing it
 * runs even if a later assertion throws. Pair with `pauseSweep` below.
 */
export async function triggerPossiblyPausedSweep(
  api: ApiClients,
  db: DatabaseHelpers,
  sweepName: string,
  opts: { firstWaitMs?: number; secondWaitMs?: number } = {},
): Promise<PausedSweepResult> {
  const firstWaitMs = opts.firstWaitMs ?? 20_000;
  const secondWaitMs = opts.secondWaitMs ?? 30_000;

  const prevSweepLogPk = await sweepLogMaxPk(db, sweepName);
  const wasPaused = !(await isSweepActive(db, sweepName));

  const resp1 = await api.scheduledTask.triggerScheduledTask(sweepName);
  if (resp1.status !== 200) {
    return { ran: false, wasPaused, didResume: false, prevSweepLogPk };
  }
  const ranAfterTrigger = await db.waitForRecord(
    'uown_sweep_logs',
    'sweep_name = $1 AND pk > $2',
    [sweepName, prevSweepLogPk],
    firstWaitMs,
  );
  if (ranAfterTrigger) {
    // Trigger executed the (possibly paused) task directly → no resume needed, no mutation.
    return { ran: true, wasPaused, didResume: false, prevSweepLogPk };
  }

  if (!wasPaused) {
    // Active sweep that simply didn't log in time — report as not-yet-ran; caller decides.
    return { ran: false, wasPaused, didResume: false, prevSweepLogPk };
  }

  // Paused AND trigger alone didn't run it → wake it, trigger again, wait again.
  // Caller must pause it back in teardown (didResume=true).
  await api.scheduledTask.resumeScheduledTask(sweepName);
  const resp2 = await api.scheduledTask.triggerScheduledTask(sweepName);
  if (resp2.status !== 200) {
    return { ran: false, wasPaused, didResume: true, prevSweepLogPk };
  }
  const ranAfterResume = await db.waitForRecord(
    'uown_sweep_logs',
    'sweep_name = $1 AND pk > $2',
    [sweepName, prevSweepLogPk],
    secondWaitMs,
  );
  return { ran: ranAfterResume, wasPaused, didResume: true, prevSweepLogPk };
}

/**
 * Pauses a scheduled task back to is_active=false. Call this ONLY in teardown when
 * `triggerPossiblyPausedSweep` reported `didResume === true`, to restore the original paused
 * state on the shared env. There is no `pauseScheduledTask` admin endpoint, so this reverts
 * is_active directly (authorized Exception-3 restore — pairs with the resume we issued).
 *
 *  -- teardown: restore is_active=false (sweep was paused before this spec resumed it)
 */
export async function pauseSweep(db: DatabaseHelpers, sweepName: string): Promise<void> {
  // -- teardown: restore is_active=false (sweep was paused before this spec resumed it)
  await db.executeUpdate(
    `UPDATE uown_scheduled_task SET is_active = false WHERE scheduled_task_name = $1`,
    [sweepName],
  );
}

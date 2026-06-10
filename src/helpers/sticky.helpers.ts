/**
 * Sticky Recover — DB poll + introspection helpers (svc#485, RU05.26.1.52.0).
 *
 * Reads only — none of these helpers mutate any `uown_sticky*` table (mutation
 * of audit tables is forbidden per the SPEC's "UPDATEs autorizados" matrix).
 * For the `comment NULL` workaround / setup-time UPDATEs, see
 * `tests/api/sticky-recover-rating-setup.spec.ts`.
 *
 * Timing budget (from SPEC):
 *  - `waitForStickySession` / outbound log: ~30s after sweep trigger (sweep + svc-sticky submit).
 *  - `waitForStickyInboundEvent('recovery.started')`: up to 90s.
 *  - `waitForStickyInboundEvent('recovery.attempt_failed')`: up to 5 min.
 *  - `waitForStickyRetryAttempt`: tied to the same window as `attempt_failed`.
 */
import type { DatabaseHelpers } from './database.helpers.js';
import { sleep } from './common.helpers.js';
import { buildTestData } from './test-data.helpers.js';
import { ensureMerchantReady } from './merchant-config.helper.js';
import { TEST_CARDS } from '../data/index.js';
import {
  STICKY_RECOVER_SWEEP_NAME,
  STICKY_RECOVER_CANCEL_SWEEP_NAME,
} from '../data/sticky.js';
import type { ApiClients, TestContext } from '../support/base-test.js';

// ── Row shapes ────────────────────────────────────────────────────────────

export interface StickySessionRow {
  pk: number;
  cc_transaction_pk: number;
  account_pk: number;
  sticky_transaction_id: string | null;
  dunning_profile_id: number | string | null;
  recovery_status: string | null;
  row_created_timestamp: Date | null;
  row_updated_timestamp: Date | null;
}

export interface StickyOutboundLogRow {
  pk: number;
  account_pk: number;
  request: string | Record<string, unknown> | null;
  response: string | Record<string, unknown> | null;
  header: string | Record<string, unknown> | null;
  stack_trace: string | null;
  row_created_timestamp: Date | null;
}

export interface StickyInboundLogRow {
  pk: number;
  account_pk: number | null;
  event_type: string;
  status: string;
  decrypted_json: string | Record<string, unknown> | null;
  dedupe_key: string | null;
  stack_trace: string | null;
  row_created_timestamp: Date | null;
}

export interface StickyRetryAttemptRow {
  pk: number;
  sticky_pk: number;
  attempt_number: number;
  http_status: number | null;
  retry_status: string | null;
  gateway_transaction_id: string | null;
  row_created_timestamp: Date | null;
}

export interface StickyDedupeAssertion {
  totalRows: number;
  distinctKeys: number;
  uniqueConstraintNames: string[];
}

// ── Internal poll ─────────────────────────────────────────────────────────

async function pollUntil<T>(
  fn: () => Promise<T | null>,
  timeoutMs: number,
  intervalMs: number,
  label: string,
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown = null;
  while (Date.now() < deadline) {
    try {
      const value = await fn();
      if (value !== null && value !== undefined) {
        return value;
      }
    } catch (err) {
      lastError = err;
    }
    await sleep(intervalMs);
  }
  if (lastError) {
    throw new Error(`[sticky] ${label} timed out after ${timeoutMs}ms: ${(lastError as Error).message}`);
  }
  throw new Error(`[sticky] ${label} timed out after ${timeoutMs}ms (no row matched)`);
}

// ── 1. waitForStickySession ───────────────────────────────────────────────

/**
 * Polls `uown_sticky` for a row tied to the given cct_pk. Returns once
 * `recovery_status` is non-null OR a row exists (whichever comes first —
 * caller decides if the status meets the AC).
 *
 * Used by:
 *  - CT-01 (sweep created the row)
 *  - CT-03 (the row exists, validate its fields)
 */
export async function waitForStickySession(
  db: DatabaseHelpers,
  cctPk: number | string,
  timeoutMs = 360_000,
): Promise<StickySessionRow> {
  return pollUntil<StickySessionRow>(
    async () => {
      const rows = await db.query<StickySessionRow>(
        `SELECT pk, cc_transaction_pk, account_pk, sticky_transaction_id,
                dunning_profile_id, recovery_status,
                row_created_timestamp, row_updated_timestamp
           FROM uown_sticky
          WHERE cc_transaction_pk = $1
          ORDER BY pk DESC LIMIT 1`,
        [cctPk],
      );
      return rows[0] ?? null;
    },
    timeoutMs,
    3_000,
    `waitForStickySession(cctPk=${cctPk})`,
  );
}

/**
 * Variant: poll until `sticky_transaction_id IS NOT NULL` — needed by CT-03
 * because the txn id is populated only after Sticky's `/recover` responds.
 */
export async function waitForStickyTransactionId(
  db: DatabaseHelpers,
  cctPk: number | string,
  timeoutMs = 360_000,
): Promise<StickySessionRow> {
  return pollUntil<StickySessionRow>(
    async () => {
      const rows = await db.query<StickySessionRow>(
        `SELECT pk, cc_transaction_pk, account_pk, sticky_transaction_id,
                dunning_profile_id, recovery_status,
                row_created_timestamp, row_updated_timestamp
           FROM uown_sticky
          WHERE cc_transaction_pk = $1 AND sticky_transaction_id IS NOT NULL
          ORDER BY pk DESC LIMIT 1`,
        [cctPk],
      );
      return rows[0] ?? null;
    },
    timeoutMs,
    3_000,
    `waitForStickyTransactionId(cctPk=${cctPk})`,
  );
}

/**
 * Wait for a `uown_sweep_logs` entry for `StickyRecoverSweep` newer than the
 * given baseline pk. Use BEFORE polling `uown_sticky` — confirms the sweep
 * actually ran in the Quartz scheduler (which is NOT instantaneous after
 * `triggerScheduledTask`; observed empirically 2026-05-20: 37 min gap).
 *
 * Returns the sweep_logs row so caller can inspect `number_of_records_processed`
 * and `error`.
 */
export interface StickySweepLogRow {
  pk: number;
  sweep_name: string;
  start_time: Date | null;
  end_time: Date | null;
  number_of_records_processed: number | null;
  error: string | null;
}

export async function waitForStickyRecoverSweepRun(
  db: DatabaseHelpers,
  options: { sincePk?: number; timeoutMs?: number } = {},
): Promise<StickySweepLogRow> {
  const { sincePk = 0, timeoutMs = 360_000 } = options;
  return pollUntil<StickySweepLogRow>(
    async () => {
      const rows = await db.query<StickySweepLogRow>(
        `SELECT pk, sweep_name, start_time, end_time,
                number_of_records_processed, error
           FROM uown_sweep_logs
          WHERE sweep_name = 'StickyRecoverSweep'
            AND pk > $1
            AND end_time IS NOT NULL
          ORDER BY pk DESC LIMIT 1`,
        [sincePk],
      );
      return rows[0] ?? null;
    },
    timeoutMs,
    5_000,
    `waitForStickyRecoverSweepRun(sincePk=${sincePk})`,
  );
}

export async function getLatestStickyRecoverSweepLogPk(
  db: DatabaseHelpers,
): Promise<number> {
  const rows = await db.query<{ pk: number }>(
    `SELECT pk FROM uown_sweep_logs
      WHERE sweep_name = 'StickyRecoverSweep'
      ORDER BY pk DESC LIMIT 1`,
    [],
  );
  return rows[0]?.pk ?? 0;
}

// ── 2. waitForStickyOutboundLog ───────────────────────────────────────────

/**
 * Polls `uown_sticky_outbound_log` for the most recent row of the given
 * accountPk. Optionally constrain by what the request JSON should contain
 * (substring match against `request::text`).
 *
 * Used by CT-02 (latest after sweep), CT-04 (audit), CT-09 (cancel call).
 */
export async function waitForStickyOutboundLog(
  db: DatabaseHelpers,
  accountPk: number | string,
  options: {
    requestContains?: string;
    sincePk?: number;
    timeoutMs?: number;
  } = {},
): Promise<StickyOutboundLogRow> {
  const { requestContains, sincePk, timeoutMs = 60_000 } = options;
  const params: unknown[] = [accountPk];
  const conditions: string[] = ['account_pk = $1'];
  if (requestContains !== undefined) {
    params.push(`%${requestContains}%`);
    conditions.push(`request::text ILIKE $${params.length}`);
  }
  if (sincePk !== undefined) {
    params.push(sincePk);
    conditions.push(`pk > $${params.length}`);
  }
  const sql = `
    SELECT pk, account_pk, request, response, header, stack_trace, row_created_timestamp
      FROM uown_sticky_outbound_log
     WHERE ${conditions.join(' AND ')}
     ORDER BY pk DESC LIMIT 1`;
  return pollUntil<StickyOutboundLogRow>(
    async () => {
      const rows = await db.query<StickyOutboundLogRow>(sql, params);
      return rows[0] ?? null;
    },
    timeoutMs,
    3_000,
    `waitForStickyOutboundLog(accountPk=${accountPk})`,
  );
}

// ── 3. waitForStickyInboundEvent ──────────────────────────────────────────

/**
 * Polls `uown_sticky_inbound_log` for the most recent row matching
 * (accountPk, eventType, status). Default status=`ACCEPTED` because that's
 * the contract observed in sandbox (`recovery.started`, `recovery.attempt_failed`).
 *
 * Used by CT-05 (recovery.started) and CT-06 (recovery.attempt_failed).
 */
export async function waitForStickyInboundEvent(
  db: DatabaseHelpers,
  accountPk: number | string,
  eventType: string,
  options: {
    status?: string;
    sincePk?: number;
    timeoutMs?: number;
  } = {},
): Promise<StickyInboundLogRow> {
  const { status = 'ACCEPTED', sincePk, timeoutMs = 90_000 } = options;
  const params: unknown[] = [accountPk, eventType, status];
  const conditions: string[] = ['account_pk = $1', 'event_type = $2', 'status = $3'];
  if (sincePk !== undefined) {
    params.push(sincePk);
    conditions.push(`pk > $${params.length}`);
  }
  const sql = `
    SELECT pk, account_pk, event_type, status, decrypted_json, dedupe_key, stack_trace, row_created_timestamp
      FROM uown_sticky_inbound_log
     WHERE ${conditions.join(' AND ')}
     ORDER BY pk DESC LIMIT 1`;
  return pollUntil<StickyInboundLogRow>(
    async () => {
      const rows = await db.query<StickyInboundLogRow>(sql, params);
      return rows[0] ?? null;
    },
    timeoutMs,
    5_000,
    `waitForStickyInboundEvent(accountPk=${accountPk}, event=${eventType})`,
  );
}

// ── 4. waitForStickyRetryAttempt ──────────────────────────────────────────

/**
 * Polls `uown_sticky_retry_attempt` until at least `minAttempts` rows exist
 * for `sticky_pk`. Returns the latest one (highest `attempt_number`).
 *
 * Used by CT-06.
 */
export async function waitForStickyRetryAttempt(
  db: DatabaseHelpers,
  stickyPk: number | string,
  minAttempts = 1,
  timeoutMs = 300_000,
): Promise<StickyRetryAttemptRow> {
  return pollUntil<StickyRetryAttemptRow>(
    async () => {
      const rows = await db.query<StickyRetryAttemptRow>(
        `SELECT pk, sticky_pk, attempt_number, http_status, retry_status,
                gateway_transaction_id, row_created_timestamp
           FROM uown_sticky_retry_attempt
          WHERE sticky_pk = $1
          ORDER BY attempt_number DESC, pk DESC LIMIT 1`,
        [stickyPk],
      );
      const latest = rows[0];
      if (!latest) return null;
      return latest.attempt_number >= minAttempts ? latest : null;
    },
    timeoutMs,
    5_000,
    `waitForStickyRetryAttempt(stickyPk=${stickyPk}, min=${minAttempts})`,
  );
}

// ── 5. assertStickyDedupeUnique (introspection, no mutation) ──────────────

/**
 * Inspect `uown_sticky_webhook_dedupe` for a UNIQUE constraint on `dedupe_key`
 * AND assert that current rows match `count = count distinct`. Returns the
 * collected stats; the test asserts the invariants (caller-side).
 *
 * Used by CT-07.
 */
export async function assertStickyDedupeUnique(
  db: DatabaseHelpers,
): Promise<StickyDedupeAssertion> {
  const constraints = await db.query<{ conname: string }>(
    `SELECT indexname AS conname FROM pg_indexes
      WHERE tablename = 'uown_sticky_webhook_dedupe'
        AND indexdef ILIKE '%unique%'`,
  );
  const stats = await db.query<{ total: string; distinct_keys: string }>(
    `SELECT COUNT(*)::text AS total, COUNT(DISTINCT dedupe_key)::text AS distinct_keys
       FROM uown_sticky_webhook_dedupe`,
  );
  const row = stats[0] ?? { total: '0', distinct_keys: '0' };
  return {
    totalRows: Number(row.total),
    distinctKeys: Number(row.distinct_keys),
    uniqueConstraintNames: constraints.map((c) => c.conname),
  };
}

// ── 6. getStickySweepSqlSnapshot ──────────────────────────────────────────

/**
 * Returns the current `sql_to_pick_accounts` of `StickyRecoverSweep`.
 * Looks up by task_name (env-agnostic — sandbox pk=80, qa1 pk=85).
 * Used by CT-01 to detect structural drift.
 */
export async function getStickySweepSqlSnapshot(
  db: DatabaseHelpers,
): Promise<string> {
  const sql = await db.getSingleString(
    `SELECT sql_to_pick_accounts FROM uown_scheduled_task WHERE scheduled_task_name = $1`,
    [STICKY_RECOVER_SWEEP_NAME],
  );
  if (sql === null) {
    throw new Error(
      `[sticky] uown_scheduled_task scheduled_task_name=${STICKY_RECOVER_SWEEP_NAME} not found`,
    );
  }
  return sql;
}

/**
 * Returns the current `sql_to_pick_accounts` of `StickyRecoverCancelSweep`.
 * Used by CT-12 to detect structural drift of the cancel sweep.
 */
export async function getStickyCancelSweepSqlSnapshot(
  db: DatabaseHelpers,
): Promise<string> {
  const sql = await db.getSingleString(
    `SELECT sql_to_pick_accounts FROM uown_scheduled_task WHERE scheduled_task_name = $1`,
    [STICKY_RECOVER_CANCEL_SWEEP_NAME],
  );
  if (sql === null) {
    throw new Error(
      `[sticky] uown_scheduled_task scheduled_task_name=${STICKY_RECOVER_CANCEL_SWEEP_NAME} not found`,
    );
  }
  return sql;
}

/**
 * Wait for a `uown_sweep_logs` entry for `StickyRecoverCancelSweep` newer than
 * the given baseline pk.
 */
export async function waitForStickyCancelSweepRun(
  db: DatabaseHelpers,
  options: { sincePk?: number; timeoutMs?: number } = {},
): Promise<StickySweepLogRow> {
  const { sincePk = 0, timeoutMs = 360_000 } = options;
  return pollUntil<StickySweepLogRow>(
    async () => {
      const rows = await db.query<StickySweepLogRow>(
        `SELECT pk, sweep_name, start_time, end_time,
                number_of_records_processed, error
           FROM uown_sweep_logs
          WHERE sweep_name = 'StickyRecoverCancelSweep'
            AND pk > $1
            AND end_time IS NOT NULL
          ORDER BY pk DESC LIMIT 1`,
        [sincePk],
      );
      return rows[0] ?? null;
    },
    timeoutMs,
    5_000,
    `waitForStickyCancelSweepRun(sincePk=${sincePk})`,
  );
}

// ── Optional: locate a cct candidate from existing setup-spec runs ────────

/**
 * Picks the most recent setup-spec-created cct (rating='M'/'F'/'B', DENIED,
 * posting_date=today-7, no `uown_sticky` row yet). Use when running the
 * main spec independently from the setup spec (CI nightly).
 *
 * Returns null when no candidate exists — caller must then run the setup spec.
 */
export async function findEligibleStickyCct(
  db: DatabaseHelpers,
  rating: 'M' | 'F' | 'B' | 'S' | 'C' | 'D',
): Promise<{ cctPk: number; accountPk: number } | null> {
  const rows = await db.query<{ cct_pk: string; account_pk: string }>(
    `SELECT cct.pk AS cct_pk, cct.account_pk
       FROM uown_sv_credit_card_transaction cct
       JOIN uown_sv_account a ON a.pk = cct.account_pk
      WHERE a.rating = $1
        AND cct.status = 'DENIED'
        AND cct.cc_vendor = 'CHANNEL_PAYMENTS_CC'
        AND cct.posting_date = CURRENT_DATE - INTERVAL '7 days'
        AND cct.cc_transaction_type = 'SCHEDULED'
        AND cct.cc_action = 'SALE'
        AND NOT EXISTS (
          SELECT 1 FROM uown_sticky st WHERE st.cc_transaction_pk = cct.pk
        )
      ORDER BY cct.pk DESC LIMIT 1`,
    [rating],
  );
  if (rows.length === 0) return null;
  return {
    cctPk: Number(rows[0].cct_pk),
    accountPk: Number(rows[0].account_pk),
  };
}

// ── 7. createStickyEligibleFromExistingAccount (fast-path setup) ──────────
//
// Authorized 2026-05-20 by the user: "para o teste de sucesso do sticky,
// pegue um cc de sucesso com pagamento para amanhã por exemplo e mude para
// denied". Replaces the slow `sendApplication` → fund → wait-for-rating path
// (~7 min) with a targeted UPDATE on an existing healthy account (~30s).
//
// This helper does NOT INSERT into any `uown_sticky*` audit table (forbidden
// per SPEC § "UPDATEs autorizados"). It UPDATES an existing future-dated cct
// to look like a denied SCHEDULED SALE eligible for `StickyRecoverSweep`:
//
//   - status='DENIED'
//   - cc_action='SALE'
//   - cc_transaction_type='SCHEDULED'
//   - posting_date=CURRENT_DATE - INTERVAL '7 days'   (inside the 7d sweep window)
//   - cc_vendor='CHANNEL_PAYMENTS_CC'                  (matches sweep `WHERE` clause)
//   - sched_summary.delinquency_as_of_date := today-7  (sweep requires DAOD ≤ today;
//                                                       healthy accounts have it in the
//                                                       future → sweep silently skips)
//   - error='Insufficient funds'                       (safe — NOT in exclusions:
//                                                       not 'Card is expired', not 'Idempotent…',
//                                                       no 'Exception' / 'org.springframework')
//   - comment='StickyRecover test'                     (workaround for Improvement #3:
//                                                       sweep filters out NULL comments)
//   - gateway_transaction_id, cc_vendor preserved when present
//
// Use ONLY for happy-path CTs (CT-01..CT-09, CT-11). The rating-specific
// melhorias (#1 fields-mandatórios, #2 backend rating attribution) still
// require fresh accounts produced by `sticky-recover-rating-setup.spec.ts`.

export interface StickyEligibleResult {
  accountPk: number;
  leadPk: number;
  cctPk: number;
  gatewayTransactionId: string;
}

/**
 * Discovers a healthy account in sandbox + UPDATEs one of its future cct rows
 * to a denied SCHEDULED SALE state that matches the StickyRecoverSweep filter.
 *
 * Strategy (fast-path, ~30s):
 *  1. SELECT a healthy account (active, no Sticky session in flight, CC autopay
 *     active, rating IS NULL → not in M/F/B/S/C/D excluded set).
 *  2. SELECT one cct on that account, scheduled in the future and still PENDING
 *     (preferred), OR fallback to any cct on the account that already has a
 *     `gateway_transaction_id` and is not yet enrolled in Sticky.
 *  3. If `paymentFrequency` is provided, UPDATE `uown_sv_sched_summary` to
 *     match (CT-08 path; defaults to no-op).
 *  4. UPDATE the cct to denied SCHEDULED SALE (today-7) with safe error/comment.
 *  5. Return ids.
 *
 * Note (regra inviolável #10): all mutations here are pre-authorized by the
 * user message of 2026-05-20 (see comment block above). Callers must not
 * re-authorize.
 */
export async function createStickyEligibleFromExistingAccount(
  db: DatabaseHelpers,
  opts: {
    accountPk?: number;
    paymentFrequency?: 'WEEKLY' | 'BI_WEEKLY' | 'MONTHLY';
  } = {},
): Promise<StickyEligibleResult> {
  // ── 1. discover (or accept caller-provided) healthy account ──────────
  let accountRow: { pk: string; lead_pk: string } | null = null;
  if (opts.accountPk !== undefined) {
    accountRow = await db.queryOne<{ pk: string; lead_pk: string }>(
      `SELECT pk, lead_pk
         FROM uown_sv_account
        WHERE pk = $1
          AND account_status = 'ACTIVE'
        LIMIT 1`,
      [opts.accountPk],
    );
    if (!accountRow) {
      throw new Error(
        `[sticky] createStickyEligibleFromExistingAccount: account pk=${opts.accountPk} not found or not ACTIVE`,
      );
    }
  } else {
    // Iterate through healthy candidates until we find one with a morphable cct.
    // Single-account picking (LIMIT 1) was insufficient — across multiple runs
    // the top candidate often has its morphable cct exhausted by a previous run,
    // and the helper would throw before falling back to the next account.
    const candidates = await db.query<{ pk: string; lead_pk: string }>(
      `SELECT a.pk, a.lead_pk
         FROM uown_sv_account a
        WHERE a.account_status = 'ACTIVE'
          AND a.rating IS NULL
          AND EXISTS (
            SELECT 1 FROM uown_sv_credit_card cc
             WHERE cc.account_pk = a.pk
               AND COALESCE(cc.is_valid_card, TRUE) = TRUE
               AND COALESCE(cc.is_deleted, FALSE) = FALSE
               AND cc.auto_pay = TRUE
          )
          AND NOT EXISTS (
            SELECT 1 FROM uown_sticky st
             WHERE st.account_pk = a.pk
               AND st.recovery_status IN ('RECOVERY_STARTED','RECOVERY_DRAFT','SUBMITTED')
          )
        ORDER BY a.pk DESC LIMIT 25`,
    );
    if (candidates.length === 0) {
      throw new Error(
        '[sticky] createStickyEligibleFromExistingAccount: no healthy account candidate found ' +
          '(active + autopay CC + no Sticky in flight + rating IS NULL). ' +
          'Try opts.accountPk= explicitly, or run a funded-lead setup first.',
      );
    }

    let chosenAccount: { pk: string; lead_pk: string } | null = null;
    let chosenCct: { pk: string; gateway_transaction_id: string | null } | null = null;
    for (const cand of candidates) {
      const apk = Number(cand.pk);
      let cct = await db.queryOne<{ pk: string; gateway_transaction_id: string | null }>(
        `SELECT pk, gateway_transaction_id
           FROM uown_sv_credit_card_transaction
          WHERE account_pk = $1
            AND status IN ('PENDING','SCHEDULED')
            AND posting_date >= CURRENT_DATE
            AND NOT EXISTS (
              SELECT 1 FROM uown_sticky st WHERE st.cc_transaction_pk = uown_sv_credit_card_transaction.pk
            )
          ORDER BY pk DESC LIMIT 1`,
        [apk],
      );
      if (!cct) {
        cct = await db.queryOne<{ pk: string; gateway_transaction_id: string | null }>(
          `SELECT pk, gateway_transaction_id
             FROM uown_sv_credit_card_transaction
            WHERE account_pk = $1
              AND gateway_transaction_id IS NOT NULL
              AND NOT EXISTS (
                SELECT 1 FROM uown_sticky st WHERE st.cc_transaction_pk = uown_sv_credit_card_transaction.pk
              )
            ORDER BY pk DESC LIMIT 1`,
          [apk],
        );
      }
      if (cct) {
        chosenAccount = cand;
        chosenCct = cct;
        break;
      }
    }
    if (!chosenAccount || !chosenCct) {
      throw new Error(
        `[sticky] createStickyEligibleFromExistingAccount: scanned ${candidates.length} healthy accounts, ` +
          'none has a morphable cct (no future PENDING/SCHEDULED nor any with gateway_transaction_id that is not yet in uown_sticky). ' +
          'Provide opts.accountPk explicitly or run a funded-lead setup first.',
      );
    }
    accountRow = chosenAccount;
    // Pre-resolve cct so the next section can use it directly.
    (accountRow as unknown as { _resolvedCct: typeof chosenCct })._resolvedCct = chosenCct;
  }
  const accountPk = Number(accountRow.pk);
  const leadPk = Number(accountRow.lead_pk);

  // ── 2. find a cct to morph ───────────────────────────────────────────
  // When opts.accountPk is provided we still need to locate the cct here; for
  // the discovery path we already resolved it in the candidate loop above.
  let cctRow = (accountRow as unknown as { _resolvedCct?: { pk: string; gateway_transaction_id: string | null } })
    ._resolvedCct ?? null;
  if (!cctRow) {
    cctRow = await db.queryOne<{ pk: string; gateway_transaction_id: string | null }>(
      `SELECT pk, gateway_transaction_id
         FROM uown_sv_credit_card_transaction
        WHERE account_pk = $1
          AND status IN ('PENDING','SCHEDULED')
          AND posting_date >= CURRENT_DATE
          AND NOT EXISTS (
            SELECT 1 FROM uown_sticky st WHERE st.cc_transaction_pk = uown_sv_credit_card_transaction.pk
          )
        ORDER BY pk DESC LIMIT 1`,
      [accountPk],
    );
  }
  if (!cctRow) {
    cctRow = await db.queryOne<{ pk: string; gateway_transaction_id: string | null }>(
      `SELECT pk, gateway_transaction_id
         FROM uown_sv_credit_card_transaction
        WHERE account_pk = $1
          AND gateway_transaction_id IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM uown_sticky st WHERE st.cc_transaction_pk = uown_sv_credit_card_transaction.pk
          )
        ORDER BY pk DESC LIMIT 1`,
      [accountPk],
    );
  }
  if (!cctRow) {
    throw new Error(
      `[sticky] createStickyEligibleFromExistingAccount: account_pk=${accountPk} has no morphable cct. ` +
        'Provide opts.accountPk pointing to an account with at least one cct.',
    );
  }
  const cctPk = Number(cctRow.pk);

  // ── 3a. align delinquency_as_of_date so sweep's `s.delinquency_as_of_date
  //        <= CURRENT_DATE` filter passes. Healthy active accounts have DAOD
  //        in the future (next scheduled charge); the sweep treats that as
  //        "not yet delinquent" and excludes the account. We move DAOD to
  //        today-7 (same window as the morphed cct) so the join admits the row.
  //        Root cause of CT-01 fast-path silent skip — see [[application-lifecycle]]
  //        pitfall "StickyRecoverSweep fast-path DAOD filter".
  await db.executeUpdate(
    `UPDATE uown_sv_sched_summary
        SET delinquency_as_of_date = CURRENT_DATE - INTERVAL '7 days'
      WHERE account_pk = $1
        AND (delinquency_as_of_date IS NULL OR delinquency_as_of_date > CURRENT_DATE)`,
    [accountPk],
  );

  // ── 3b. (optional) align payment_frequency for CT-08 ─────────────────
  if (opts.paymentFrequency) {
    await db.executeUpdate(
      `UPDATE uown_sv_sched_summary
          SET payment_frequency = $2
        WHERE account_pk = $1`,
      [accountPk, opts.paymentFrequency],
    );
  }

  // ── 4. morph cct into Sticky-eligible denied SCHEDULED SALE ─────────
  // gateway_transaction_id format mirrors the setup spec convention
  // (`setup-{cctPk}-{timestamp}_{random}`) — empirically required for the
  // sticky.io persistence layer to materialize `uown_sticky` after outbound
  // submission. Earlier helper version used `md5(random())` which produced
  // a UUID-like format; outbound succeeded but uown_sticky row was never
  // persisted (observed sandbox 2026-05-21 — outbound_log pk=6 had
  // RECOVERY_DRAFT response but no matching uown_sticky row).
  const rows = await db.query<{ gateway_transaction_id: string }>(
    `UPDATE uown_sv_credit_card_transaction
        SET status = 'DENIED',
            cc_action = 'SALE',
            cc_transaction_type = 'SCHEDULED',
            posting_date = CURRENT_DATE - INTERVAL '7 days',
            error = 'Insufficient funds',
            comment = COALESCE(NULLIF(comment, ''), 'StickyRecover test'),
            gateway_transaction_id =
              COALESCE(
                NULLIF(gateway_transaction_id, ''),
                'setup-' || $1::text || '-' || (EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::bigint::text
                  || '_' || (FLOOR(random() * 10000000000000000))::bigint::text
              ),
            cc_vendor = COALESCE(cc_vendor, 'CHANNEL_PAYMENTS_CC')
      WHERE pk = $1
      RETURNING gateway_transaction_id`,
    [cctPk],
  );
  const gatewayTransactionId = rows[0]?.gateway_transaction_id ?? '';
  if (!gatewayTransactionId) {
    throw new Error(`[sticky] UPDATE cct pk=${cctPk} did not return gateway_transaction_id`);
  }

  // ── 5. ensure cc_vendor_transaction_id is populated (required by svc since
  // the sticky.io integration reads this column as the gateway reference;
  // sweep error "gatewayTransactionId is required" when null)
  await db.executeUpdate(
    `UPDATE uown_sv_credit_card_transaction
        SET cc_vendor_transaction_id = gateway_transaction_id
      WHERE pk = $1
        AND (cc_vendor_transaction_id IS NULL OR TRIM(cc_vendor_transaction_id) = '')`,
    [cctPk],
  );

  return { accountPk, leadPk, cctPk, gatewayTransactionId };
}

/**
 * Variant via UI: schedules a one-time future charge via the Servicing portal,
 * waits for the PENDING cct, then UPDATEs it to DENIED. More "natural" path
 * (exercises the Customer Service schedule-charge UI), but slower (~2 min).
 *
 * Not implemented — placeholder for future need (CT-11 alternative path).
 * Use {@link createStickyEligibleFromExistingAccount} for now.
 */
export async function createStickyEligibleViaServicingSchedule(_opts: {
  accountPk: number;
}): Promise<{ cctPk: number }> {
  // TODO: implement when CT-11 alternative-path becomes mandatory.
  throw new Error(
    '[sticky] createStickyEligibleViaServicingSchedule not implemented — ' +
      'use createStickyEligibleFromExistingAccount for now',
  );
}

// ─────────────────────────────────────────────────────────────────────────
// NATURAL FLOW SETUP — sendApplication + funding + denied gateway charge
// ─────────────────────────────────────────────────────────────────────────

export interface StickyEligibleNaturalResult {
  leadPk: number;
  leadUuid: string;
  accountPk: number;
  cctPk: number;
  gatewayTransactionId: string;
}

/**
 * Natural setup flow for Sticky-eligible CCT — mirrors the 13 steps of
 * `tests/api/sticky-recover-rating-setup.spec.ts` but as a callable helper.
 * Produces a fresh account + denied CCT with REAL `gateway_transaction_id`
 * populated by the gateway (not a synthetic value) so the `sticky.io` lib's
 * persistence layer accepts it and materializes `uown_sticky` after submit.
 *
 * Use this when CT-01..CT-09 need to exercise the full happy path. The
 * fast-path helper (`createStickyEligibleFromExistingAccount`) is faster
 * but hit an empirical asymmetry in 2026-05-21 sandbox: outbound returned
 * RECOVERY_DRAFT but `uown_sticky` row never persisted, likely tied to
 * the synthetic gateway_transaction_id format.
 *
 * Duration: ~5-7 min (sendApplication + UW approval wait + funding +
 * scheduled cct creation + gateway denial response).
 *
 * Authorized UPDATEs (same scope as 2026-05-20 setup spec):
 * - `uown_sv_account.auto_pay_types = 'CC'`
 * - `uown_sv_receivable.due_date = CURRENT_DATE + 2`
 * - `uown_sv_sched_summary.{first_payment_due_date, delinquency_as_of_date} = CURRENT_DATE`
 * - `uown_sv_credit_card_transaction.posting_date = CURRENT_DATE - 7`
 *
 * No `account.rating` UPDATE — caller may set if testing rating filters.
 */
export async function createStickyEligibleNatural(opts: {
  api: ApiClients;
  db: DatabaseHelpers;
  ctx: TestContext;
}): Promise<StickyEligibleNaturalResult> {
  const { api, db, ctx } = opts;
  const declineCard = TEST_CARDS.DECLINE_G; // "Do not Honor" — not in sweep error exclusion list

  const td = buildTestData({
    state: 'CA',
    merchant: 'TerraceFinance',
    orderTotal: '1000',
    orderDescription: 'StickyRecover-CT-01',
  });

  // 0. merchant preflight (CLAUDE.md regra #12) — ensure terraceFinance config
  //    matches the merchant-config-contract before sendApplication.
  await ensureMerchantReady(api, td.merchantConfig.refCode ?? td.merchantConfig.number);

  // 1. sendApplication
  const send = await api.application.sendApplication(td.merchant, td.applicant);
  if (!send.ok) {
    throw new Error(`[sticky][natural] sendApplication ${send.status}: ${JSON.stringify(send.body).slice(0, 400)}`);
  }
  ctx.leadUuid = send.body.accountNumber ?? String(send.body.authorizationNumber ?? '');
  ctx.leadPk = String(send.body.authorizationNumber ?? '');
  console.log(`[sticky][natural] sendApplication OK: leadPk=${ctx.leadPk} leadUuid=${ctx.leadUuid} firstName=${td.applicant.firstName} merchant=${td.merchant.number}`);
  console.log(`[sticky][natural] sendApplication body keys: ${Object.keys(send.body).join(',')}`);
  if (!ctx.leadPk || ctx.leadPk === '0') {
    throw new Error(`[sticky][natural] sendApplication returned no authorizationNumber. body=${JSON.stringify(send.body).slice(0, 400)}`);
  }

  // 2. wait approval (poll up to 60s — sandbox UW can take 10-30s).
  // Use `approvedAmount > 0` as primary signal (the canonical
  // `appApprovalStatus`/`uwStatus`/`status` fields are not in this response shape).
  let approvedAmount = 0;
  {
    const deadline = Date.now() + 60_000;
    let lastSnapshot = '';
    while (Date.now() < deadline) {
      await sleep(5_000);
      const statusResp = await api.application.getApplicationStatus(td.merchant, ctx.leadUuid);
      if (!statusResp.ok) {
        throw new Error(`[sticky][natural] getApplicationStatus ${statusResp.status}: ${JSON.stringify(statusResp.body).slice(0, 200)}`);
      }
      const body = statusResp.body as Record<string, unknown>;
      const amt = Number(body.approvedAmount ?? 0);
      const status = String(
        body.appApprovalStatus ?? body.uwStatus ?? body.status ?? body.currentStatus ?? body.transactionStatus ?? '',
      ).toLowerCase();
      lastSnapshot = `status="${status}" approvedAmount=${amt} canContinue=${body.canContinue}`;
      if (amt > 0) {
        if (body.leadPk) ctx.leadPk = String(body.leadPk);
        approvedAmount = amt;
        break;
      }
      if (status.includes('denied') || status.includes('rejected')) {
        throw new Error(`[sticky][natural] UW denied/rejected: ${lastSnapshot}`);
      }
    }
    if (approvedAmount === 0) {
      throw new Error(`[sticky][natural] UW approval timed out (60s); ${lastSnapshot}`);
    }
  }

  // 3. sendInvoice → extract shortCode/planId
  const inv = await api.invoice.sendInvoice(td.merchant, ctx.leadUuid, { orderTotal: String(approvedAmount) });
  if (!inv.ok) throw new Error(`[sticky][natural] sendInvoice ${inv.status}`);
  const redirect = inv.body?.paymentDetailsList?.[0]?.redirectUrl ?? '';
  if (!redirect) throw new Error('[sticky][natural] missing redirectUrl in invoice response');
  const url = new URL(redirect);
  const shortCode = url.pathname.split('/').filter(Boolean)[0] ?? '';
  const planId = url.searchParams.get('planId') ?? '';

  // 4. getMissingFields (required before submitApplication)
  const mf = await api.application.getMissingFields(shortCode, planId ? { planId } : undefined);
  if (!mf.ok) throw new Error(`[sticky][natural] getMissingFields ${mf.status}`);

  // 5. submitApplication with DECLINE_G card.
  // Pass planId explicitly — svc#537 changed program eligibility handling
  // (13/16 month branches) and submitApplication now appears to require the
  // selected planId in the body when multiple programs match the lead.
  console.log(`[sticky][natural] submitApplication: leadPk=${ctx.leadPk} planId=${planId} firstName=${td.applicant.firstName} lastName=${td.applicant.lastName}`);
  const submit = await api.application.submitApplication(
    Number(ctx.leadPk), td.applicant.firstName, td.applicant.lastName,
    {
      ccNumber: declineCard.number,
      cvc: declineCard.cvv,
      ccExp: declineCard.expirationDate,
      planId: planId || undefined,
    },
  );
  if (!submit.ok) {
    throw new Error(
      `[sticky][natural] submitApplication ${submit.status}: ${JSON.stringify(submit.body)}`,
    );
  }

  // 6. drive to FUNDING
  const s1 = await api.lead.changeLeadStatus(td.merchant, Number(ctx.leadPk), 'SIGNED', 'StickyRecover natural setup');
  if (!s1.ok) throw new Error(`[sticky][natural] SIGNED ${s1.status}`);
  const s2 = await api.settlement.settleApplication(td.merchant, ctx.leadUuid);
  if (!s2.ok) throw new Error(`[sticky][natural] settle ${s2.status}`);
  await sleep(3_000);
  const s3 = await api.lead.updateFundingStatus([Number(ctx.leadPk)], 'FUNDING');
  if (!s3.ok) throw new Error(`[sticky][natural] FUNDING ${s3.status}`);

  // 7. wait account materialize
  const accountPkStr = await db.waitForAccountByLeadPk(ctx.leadPk, 120_000);
  if (!accountPkStr) throw new Error(`[sticky][natural] account not created for leadPk=${ctx.leadPk}`);
  const accountPk = Number(accountPkStr);
  ctx.accountPk = accountPkStr;

  // 8. auto_pay_types=CC
  await db.executeUpdate(`UPDATE uown_sv_account SET auto_pay_types = 'CC' WHERE pk = $1`, [accountPk]);

  // 9. first ACTIVE receivable.due_date = today+2
  const recvRows = await db.query<{ pk: string }>(
    `SELECT pk FROM uown_sv_receivable
      WHERE account_pk = $1 AND status = 'ACTIVE' AND receivable_type = 'REGULAR_PAYMENT'
      ORDER BY due_date ASC LIMIT 1`,
    [accountPk],
  );
  if (recvRows.length === 0) throw new Error('[sticky][natural] no ACTIVE regular receivable');
  await db.executeUpdate(
    `UPDATE uown_sv_receivable SET due_date = CURRENT_DATE + INTERVAL '2 days' WHERE pk = $1`,
    [recvRows[0].pk],
  );

  // 10. sched_summary dates = today
  await db.executeUpdate(
    `UPDATE uown_sv_sched_summary
        SET first_payment_due_date = CURRENT_DATE,
            delinquency_as_of_date = CURRENT_DATE
      WHERE account_pk = $1`,
    [accountPk],
  );

  // 11. trigger CreateScheduledCreditCardPaymentsSweep → wait SCHEDULED cct
  const trigCreate = await api.scheduledTask.triggerScheduledTask('CreateScheduledCreditCardPaymentsSweep');
  if (!trigCreate.ok) throw new Error(`[sticky][natural] trigger CreateScheduled ${trigCreate.status}`);
  let cctPk = 0;
  {
    const deadline = Date.now() + 120_000;
    while (Date.now() < deadline) {
      const rows = await db.query<{ pk: string }>(
        `SELECT pk FROM uown_sv_credit_card_transaction
          WHERE account_pk = $1 AND cc_transaction_type = 'SCHEDULED' AND cc_action = 'SALE'
          ORDER BY pk DESC LIMIT 1`, [accountPk],
      );
      if (rows.length > 0) { cctPk = Number(rows[0].pk); break; }
      await sleep(4_000);
    }
  }
  if (!cctPk) throw new Error(`[sticky][natural] no SCHEDULED SALE cct for accountPk=${accountPk}`);

  // 11b. shift posting_date to today so SendCreditCardPaymentsSweep picks it up
  // (CreateScheduled sets posting_date = receivable.due_date which is today+2;
  // the Send sweep requires posting_date <= current_date)
  await db.executeUpdate(
    `UPDATE uown_sv_credit_card_transaction SET posting_date = CURRENT_DATE WHERE pk = $1`,
    [cctPk],
  );

  // 12. trigger SendCreditCardPaymentsSweep → wait gateway DENIED + gateway_transaction_id populated
  const trigSend = await api.scheduledTask.triggerScheduledTask('SendCreditCardPaymentsSweep');
  if (!trigSend.ok) throw new Error(`[sticky][natural] trigger SendCreditCard ${trigSend.status}`);
  let gatewayTransactionId = '';
  {
    const deadline = Date.now() + 120_000;
    while (Date.now() < deadline) {
      const rows = await db.query<{ status: string; gateway_transaction_id: string | null }>(
        `SELECT status, gateway_transaction_id FROM uown_sv_credit_card_transaction WHERE pk = $1`, [cctPk],
      );
      if (rows.length > 0 && rows[0].status !== 'PENDING' && rows[0].status !== 'PICKED_TO_SEND') {
        if (rows[0].status !== 'DENIED') {
          throw new Error(`[sticky][natural] expected DENIED for ${declineCard.name}, got ${rows[0].status}`);
        }
        gatewayTransactionId = rows[0].gateway_transaction_id ?? '';
        if (!gatewayTransactionId) throw new Error('[sticky][natural] gateway did not populate gateway_transaction_id');
        break;
      }
      await sleep(4_000);
    }
  }
  if (!gatewayTransactionId) throw new Error(`[sticky][natural] cct ${cctPk} never left PENDING`);

  // 13. shift posting_date to today-7
  await db.executeUpdate(
    `UPDATE uown_sv_credit_card_transaction
        SET posting_date = CURRENT_DATE - INTERVAL '7 days'
      WHERE pk = $1`, [cctPk],
  );

  return {
    leadPk: Number(ctx.leadPk),
    leadUuid: ctx.leadUuid,
    accountPk,
    cctPk,
    gatewayTransactionId,
  };
}

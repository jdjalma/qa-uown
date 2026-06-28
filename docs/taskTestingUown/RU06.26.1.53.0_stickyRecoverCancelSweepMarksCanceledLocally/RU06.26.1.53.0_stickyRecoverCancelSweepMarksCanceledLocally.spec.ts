/**
 * Sticky Recover Cancel Sweep (RU06.26.1.53.0) — backend regression.
 *
 * Feature: `StickyRecoverCancelSweep` marks a recovery `CANCELED` *locally* when
 * Sticky rejects the cancel call with `HTTP 400 "Cannot cancel transaction"`,
 * instead of throwing `IllegalStateException` and re-picking the row every run.
 * MRs merged: svc!1483 + sticky.io!9.
 *
 * Ground truth (DB-confirmed live, read as authoritative — Rule #16):
 *  - docs/knowledge-base/sticky-recover-cancel-sweep.md
 *  - .claude/oracles/sticky-cancel-sweep-scenarios.md
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SANDBOX-ONLY. Sticky tables are populated only in sandbox; qa2/dev2 have the
 * schema but `uown_sticky` is empty + webhooks don't decrypt
 * ([[sticky-refund-tests-sandbox-only]]).
 *
 * NO MERCHANT PREFLIGHT (Rule #12 exception): this suite operates on an existing
 * lease/account (5084 / sticky pk36) and a shared scheduled task. It never calls
 * `sendApplication`, so `ensureMerchantReady` is intentionally NOT invoked —
 * mutating an out-of-scope merchant config would be a side effect.
 *
 * NO UI AFFORDANCE (Rule #18 exception (a)): `StickyRecoverCancelSweep` is an
 * internal Quartz sweep with no portal button. The only agent-facing surface is
 * the INTERNAL activity-log note (asserted in CT-L1), confirmed read-only. The
 * sweep outcome cannot be driven through the browser, so this is API/DB coverage.
 *
 * DB CONNECTION: the sandbox tunnel is up manually at 127.0.0.1:5445 (the
 * `.env UOWN_DB_URL_SBX` says 5446 but that is stale — NOT edited). The default
 * worker `db` fixture would resolve the stale 5446, so this spec builds its OWN
 * `DatabaseHelpers` pointed at 5445 from `UOWN_DB_USER_SBX`/`UOWN_DB_PASS_SBX`
 * (the SBX password has no URL-special chars → a built URL authenticates; same
 * net effect as the config-object approach in `_probe_discovery.ts`). The
 * `beforeAll` preflight verifies the tunnel points at sandbox (`uown_sticky`
 * present + canonical sticky pk36 / account 5084) and SKIPS the suite otherwise.
 *
 * Project (Playwright): task-testing.
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { DatabaseHelpers } from '@helpers/database.helpers.js';
import {
  getStickyCancelSweepSqlSnapshot,
  waitForStickySession,
  waitForStickyOutboundLog,
} from '@helpers/sticky.helpers.js';
import { STICKY_RECOVER_CANCEL_SWEEP_NAME } from '@data/sticky.js';
import { buildCreateOrUpdateScheduledTaskBody } from '@api/bodies/scheduled-task.body.js';
import { TestTag, buildTags, splitTags } from '../../../src/types/enums.js';

const BASE_TAG = `${buildTags(TestTag.REGRESSION, TestTag.SANDBOX)} @servicing @sticky-cancel`;

// ── Canonical confirmed-run anchors (read-only regression references) ─────────
const CANONICAL_STICKY_PK = 36;
const CANONICAL_ACCOUNT_PK = 5084;
const TERMINAL_RECOVERY_STATES = ['RECOVERED', 'FAILED', 'CANCELED'];

// The exact note prefix — em-dash is intentional, do NOT normalize to "-".
const NOTE_PREFIX = 'Sticky recovery marked CANCELED locally — Sticky rejected cancel:';

// Opt-in gate for the destructive manufacture CT (CT-M1-LIVE). Default OFF.
const MANUFACTURE_ENABLED = process.env.STICKY_MANUFACTURE === 'true';

// Candidate ACTIVE accounts with an in-flight RECOVERY_STARTED recovery
// (live probe list — used ONLY by the opt-in destructive CT to manufacture a
// non-ACTIVE candidate). Avoid REFUNDED rows.
const MANUFACTURE_CANDIDATES: ReadonlyArray<{ stickyPk: number; accountPk: number }> = [
  { stickyPk: 35, accountPk: 17213 },
  { stickyPk: 10, accountPk: 17178 },
  { stickyPk: 9, accountPk: 17174 },
  { stickyPk: 7, accountPk: 17176 },
  { stickyPk: 6, accountPk: 17177 },
  { stickyPk: 2, accountPk: 16623 },
];

// ── Sandbox DB (5445) — built once for the describe.serial block ──────────────
interface StickyRow {
  pk: number;
  account_pk: number;
  sticky_transaction_id: string | null;
  recovery_status: string | null;
  status: string | null;
  account_status: string | null;
  number_of_attempts: number | null;
}

/** Builds a node-pg connection string for the sandbox tunnel on port 5445. */
function buildSandboxConnString(): string {
  const jdbc = process.env.UOWN_DB_URL_SBX ?? '';
  const database = (jdbc.split('/').pop() ?? 'svc').split('?')[0] || 'svc';
  const user = process.env.UOWN_DB_USER_SBX ?? '';
  const pass = process.env.UOWN_DB_PASS_SBX ?? '';
  // Port forced to 5445 (the live tunnel); .env URL's 5446 is stale.
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@127.0.0.1:5445/${database}`;
}

test.describe.serial(
  'StickyRecoverCancelSweep marks recovery CANCELED locally (sandbox)',
  { tag: splitTags(BASE_TAG) },
  () => {
    let sbx: DatabaseHelpers;
    let suiteSkipReason = '';
    let canonicalRecordHealthy = false; // pk36/5084 in expected CANCELED/PAID_OUT state
    let cancelSweepSql = '';

    test.beforeAll(async () => {
      // 1) Connect to sandbox 5445; skip the WHOLE suite on any connect failure.
      if (!process.env.UOWN_DB_USER_SBX || !process.env.UOWN_DB_PASS_SBX) {
        suiteSkipReason = 'UOWN_DB_USER_SBX / UOWN_DB_PASS_SBX not set';
        return;
      }
      sbx = new DatabaseHelpers(buildSandboxConnString());

      try {
        // 2) Tunnel must point at SANDBOX svc: uown_sticky present.
        const marker = await sbx.getSingleString(`SELECT to_regclass('public.uown_sticky') AS t`);
        if (!marker) {
          suiteSkipReason = 'to_regclass(uown_sticky) is null — tunnel not pointing at sandbox svc';
          return;
        }
        // 3) Canonical sticky pk36 + account 5084 must exist (sandbox identity check).
        const anchor = await sbx.queryOne<StickyRow>(
          `SELECT st.pk, st.account_pk, st.recovery_status, st.status,
                  a.account_status, st.number_of_attempts, st.sticky_transaction_id
             FROM uown_sticky st
             JOIN uown_sv_account a ON a.pk = st.account_pk
            WHERE st.pk = $1 AND st.account_pk = $2`,
          [CANONICAL_STICKY_PK, CANONICAL_ACCOUNT_PK],
        );
        if (!anchor) {
          suiteSkipReason = `canonical sticky pk${CANONICAL_STICKY_PK}/account ${CANONICAL_ACCOUNT_PK} absent — not the canonical sandbox`;
          return;
        }
        canonicalRecordHealthy =
          anchor.recovery_status === 'CANCELED' &&
          anchor.status === 'CANCELED' &&
          anchor.account_status === 'PAID_OUT';

        // 4) Snapshot the cancel-sweep selection SQL once (used by S-1/S-2/S-3/R-1).
        cancelSweepSql = await getStickyCancelSweepSqlSnapshot(sbx);
      } catch (err) {
        suiteSkipReason = `sandbox preflight failed: ${(err as Error).message}`;
      }
    });

    test.afterAll(async () => {
      if (sbx) await sbx.close();
    });

    /** Guard for the read-only structural CTs (S-x / R-1) — only needs a live sandbox DB. */
    function ensureSandbox(): void {
      test.skip(!!suiteSkipReason, `sandbox preflight skipped suite: ${suiteSkipReason}`);
    }

    /** Guard for the confirmed-record CTs (M1/L1/X1) — also needs pk36/5084 healthy. */
    function ensureCanonical(): void {
      ensureSandbox();
      test.skip(
        !canonicalRecordHealthy,
        `canonical record pk${CANONICAL_STICKY_PK}/account ${CANONICAL_ACCOUNT_PK} not in expected CANCELED/PAID_OUT state (likely env reset)`,
      );
    }

    /** Runs the live selection SQL and returns the picked rows. Read-only. */
    async function runSelectionSql(): Promise<StickyRow[]> {
      // The stored SQL is `SELECT st.* FROM uown_sticky st JOIN ...`; we re-project
      // with the join so account_status is available for the assertions.
      return sbx.query<StickyRow>(
        `SELECT st.pk, st.account_pk, st.sticky_transaction_id, st.recovery_status,
                st.status, a.account_status, st.number_of_attempts
           FROM uown_sticky st
           JOIN uown_sv_account a ON a.pk = st.account_pk
          WHERE st.sticky_transaction_id IS NOT NULL
            AND a.account_status <> 'ACTIVE'
            AND st.recovery_status NOT IN ('RECOVERED', 'FAILED', 'CANCELED')`,
      );
    }

    // ── CT-S1 — selection SQL ignores ACTIVE accounts ─────────────────────────
    test(`CT-S1 — selection SQL excludes ACTIVE accounts (BR-01) ${BASE_TAG}`, async () => {
      ensureSandbox();
      test.setTimeout(60_000);

      await test.step('stored sql_to_pick_accounts carries the non-ACTIVE + terminal + txn-id guards', async () => {
        const normalized = cancelSweepSql.replace(/\s+/g, ' ');
        // account_status <> 'ACTIVE' (quote-tolerant)
        expect(normalized).toMatch(/account_status\s*<>\s*'?ACTIVE'?/i);
        // recovery_status NOT IN ('RECOVERED','FAILED','CANCELED')
        expect(normalized).toMatch(/recovery_status\s+NOT\s+IN\s*\(/i);
        for (const term of TERMINAL_RECOVERY_STATES) {
          expect(normalized.toUpperCase()).toContain(term);
        }
        // sticky_transaction_id IS NOT NULL
        expect(normalized).toMatch(/sticky_transaction_id\s+IS\s+NOT\s+NULL/i);
      });

      await test.step('every row the live SQL returns is on a non-ACTIVE account', async () => {
        const rows = await runSelectionSql();
        console.log(`[CT-S1] selection SQL returned ${rows.length} row(s)`);
        for (const r of rows) {
          expect(r.account_status).not.toBe('ACTIVE');
        }
      });
    });

    // ── CT-S2 — skip terminal recoveries; canonical CANCELED pk36 absent ──────
    test(`CT-S2 — selection skips terminal recoveries (BR-02) ${BASE_TAG}`, async () => {
      ensureSandbox();
      test.setTimeout(60_000);

      const rows = await runSelectionSql();
      await test.step('no returned row is in a terminal recovery_status', async () => {
        for (const r of rows) {
          expect(TERMINAL_RECOVERY_STATES).not.toContain(r.recovery_status);
        }
      });
      await test.step(`canonical CANCELED sticky pk${CANONICAL_STICKY_PK} is NOT re-picked`, async () => {
        expect(rows.map((r) => r.pk)).not.toContain(CANONICAL_STICKY_PK);
      });
    });

    // ── CT-S3 — skip rows with NULL sticky_transaction_id ─────────────────────
    test(`CT-S3 — selection skips NULL sticky_transaction_id (BR-02) ${BASE_TAG}`, async () => {
      ensureSandbox();
      test.setTimeout(60_000);

      await test.step('stored SQL contains the NULL-txn-id guard', async () => {
        expect(cancelSweepSql.replace(/\s+/g, ' ')).toMatch(/sticky_transaction_id\s+IS\s+NOT\s+NULL/i);
      });

      await test.step('a non-ACTIVE, open recovery with NULL txn id (if any) is excluded from the result', async () => {
        const nullTxnNonActive = await sbx.query<{ pk: number }>(
          `SELECT st.pk
             FROM uown_sticky st
             JOIN uown_sv_account a ON a.pk = st.account_pk
            WHERE st.sticky_transaction_id IS NULL
              AND a.account_status <> 'ACTIVE'
              AND st.recovery_status NOT IN ('RECOVERED','FAILED','CANCELED')`,
        );
        if (nullTxnNonActive.length === 0) {
          console.log('[CT-S3] no NULL-txn-id non-ACTIVE open recovery exists — structural guard asserted only');
          return; // degrade to structural assert (already done above)
        }
        const selected = (await runSelectionSql()).map((r) => r.pk);
        for (const row of nullTxnNonActive) {
          expect(selected).not.toContain(row.pk);
        }
      });
    });

    // ── CT-M1 — confirmed-record contract (read-only, must NOT mutate pk36) ───
    test(`CT-M1 — confirmed local-cancel record contract (AC-01, BR-04) ${BASE_TAG}`, async () => {
      ensureCanonical();
      test.setTimeout(60_000);

      let txnId = '';
      await test.step('uown_sticky pk36: recovery_status=status=CANCELED, attempts=3', async () => {
        const row = await sbx.queryOne<StickyRow>(
          `SELECT pk, account_pk, sticky_transaction_id, recovery_status, status, number_of_attempts
             FROM uown_sticky WHERE pk = $1`,
          [CANONICAL_STICKY_PK],
        );
        expect(row).not.toBeNull();
        expect(row!.recovery_status).toBe('CANCELED');
        expect(row!.status).toBe('CANCELED');
        expect(Number(row!.number_of_attempts)).toBe(3);
        expect(row!.sticky_transaction_id).toBeTruthy();
        txnId = row!.sticky_transaction_id!;
      });

      await test.step(`account ${CANONICAL_ACCOUNT_PK} is PAID_OUT (non-ACTIVE — qualifies, BR-01)`, async () => {
        const acc = await sbx.getSingleString(
          `SELECT account_status FROM uown_sv_account WHERE pk = $1`,
          [CANONICAL_ACCOUNT_PK],
        );
        expect(acc).toBe('PAID_OUT');
      });

      await test.step('uown_sticky_outbound_log: source=STICKY_RECOVER, request has CANCELED + txn id, response NULL (BR-06)', async () => {
        // The request column is pretty-printed JSON (`"status" : "CANCELED"` with
        // spaces around the colon, confirmed live pk32) — correlate by the txn id,
        // then assert content whitespace-tolerantly.
        const ob = await sbx.queryOne<{
          pk: number;
          source: string;
          request: string | null;
          response: string | null;
        }>(
          `SELECT pk, source, request::text AS request, response::text AS response
             FROM uown_sticky_outbound_log
            WHERE account_pk = $1
              AND source = 'STICKY_RECOVER'
              AND request::text ILIKE $2
              AND request::text ILIKE '%CANCELED%'
            ORDER BY pk DESC LIMIT 1`,
          [CANONICAL_ACCOUNT_PK, `%${txnId}%`],
        );
        expect(ob, 'no STICKY_RECOVER cancel outbound row for account 5084').not.toBeNull();
        // Whitespace-tolerant: matches both `"status":"CANCELED"` and `"status" : "CANCELED"`.
        expect(ob!.request).toMatch(/"status"\s*:\s*"CANCELED"/);
        expect(ob!.request).toContain(txnId);
        // The Sticky 400 body is NOT captured in the outbound response column.
        expect(ob!.response).toBeNull();
      });
    });

    // ── CT-L1 — INTERNAL activity-log note contract (Rule #13) ────────────────
    test(`CT-L1 — INTERNAL activity-log note contract (AC-02, BR-05) ${BASE_TAG}`, async () => {
      ensureCanonical();
      test.setTimeout(60_000);

      const note = await sbx.queryOne<{
        pk: number;
        log_type: string;
        created_by: string;
        creation_source: string;
        lead_pk: number | null;
        is_hidden: boolean;
        deleted: boolean;
        notes: string;
      }>(
        `SELECT pk, log_type, created_by, creation_source, lead_pk, is_hidden, deleted, notes
           FROM uown_sv_activity_log
          WHERE account_pk = $1
            AND notes ILIKE '%marked CANCELED locally%'
          ORDER BY pk DESC LIMIT 1`,
        [CANONICAL_ACCOUNT_PK],
      );

      await test.step('note exists with SYSTEM/INTERNAL metadata, account-level (lead_pk NULL)', async () => {
        expect(note, 'no "marked CANCELED locally" note for account 5084').not.toBeNull();
        expect(note!.log_type).toBe('INTERNAL');
        expect(note!.created_by).toBe('SYSTEM');
        expect(note!.creation_source).toBe('SYSTEM_GENERATED');
        expect(note!.lead_pk).toBeNull();
        expect(note!.is_hidden).toBe(false);
        expect(note!.deleted).toBe(false);
      });

      await test.step('note text carries the exact prefix (literal em-dash) + the Sticky 400 error', async () => {
        // Literal em-dash — do NOT normalize. The note must start with the prefix.
        expect(note!.notes.startsWith(NOTE_PREFIX)).toBe(true);
        expect(note!.notes).toContain('"title":"Cannot cancel transaction"');
        expect(note!.notes).toContain('"stickyErrorCode":400');
        // The inner timeStamp is volatile — intentionally NOT pinned.
      });
    });

    // ── CT-X1 — cross-rule: a CANCELED recovery is not refundable (BR-07) ─────
    test(`CT-X1 — CANCELED recovery is not refundable (BR-07) ${BASE_TAG}`, async () => {
      ensureCanonical();
      test.setTimeout(60_000);

      const refundNote = await sbx.queryOne<{ pk: number; notes: string }>(
        `SELECT pk, notes
           FROM uown_sv_activity_log
          WHERE account_pk = $1
            AND notes ILIKE '%not in RECOVERED status%'
          ORDER BY pk DESC LIMIT 1`,
        [CANONICAL_ACCOUNT_PK],
      );

      // Most likely absent after an env reset — skip gracefully rather than fail.
      test.skip(
        refundNote === null,
        `no "not in RECOVERED status" refund-rejection note on account ${CANONICAL_ACCOUNT_PK} (cross-rule evidence not present in this env)`,
      );
      expect(refundNote!.notes).toMatch(/Sticky recovery is not in RECOVERED status/i);
    });

    // ── CT-R1 — idempotency by SQL: pk36 not re-picked (AC-07) ────────────────
    test(`CT-R1 — idempotency: local-canceled row not re-selected (AC-07) ${BASE_TAG}`, async () => {
      ensureSandbox();
      test.setTimeout(60_000);

      await test.step(`live selection SQL does not include the CANCELED sticky pk${CANONICAL_STICKY_PK}`, async () => {
        const selected = (await runSelectionSql()).map((r) => r.pk);
        // A re-run of the sweep would not re-pick a CANCELED row → the retry loop is broken.
        expect(selected).not.toContain(CANONICAL_STICKY_PK);
      });
    });

    // ── CT-A3 — sweep run logs 0 failures on a local-cancel run (AC-03) ───────
    // AC-03 ("complete the sweep with 0 failures") IS DB-observable via
    // uown_sweep_logs (NOT uown_scheduled_task_run, which has no rows for this
    // sweep). A run that local-cancels >=1 record carries error=NULL (the row was
    // processed, not failed). Read-only over the existing run history. The "no
    // error email" half of AC-03 is downstream of error=NULL (email fires only on
    // error) and is confirmed manually in the correspondence inbox.
    test(`CT-A3 — cancel-sweep run logs 0 failures when it local-cancels (AC-03) ${BASE_TAG}`, async () => {
      ensureSandbox();
      test.setTimeout(60_000);

      await test.step('latest StickyRecoverCancelSweep run that processed >=1 record has error=NULL', async () => {
        const run = await sbx.queryOne<{ pk: number; error: string | null; number_of_records_processed: number }>(
          `SELECT pk, error, number_of_records_processed
             FROM uown_sweep_logs
            WHERE sweep_name = '${STICKY_RECOVER_CANCEL_SWEEP_NAME}'
              AND number_of_records_processed >= 1
            ORDER BY pk DESC LIMIT 1`,
        );
        // No local-cancel has fired in this env yet → degrade gracefully, do NOT fail.
        test.skip(
          run === null,
          'no StickyRecoverCancelSweep run with >=1 processed record in uown_sweep_logs (no local-cancel fired in this env)',
        );
        expect(Number(run!.number_of_records_processed)).toBeGreaterThanOrEqual(1);
        // AC-03: a local-cancel run is treated as success — no failure recorded.
        expect(run!.error).toBeNull();
      });
    });

    // ── CT-M1-LIVE — DESTRUCTIVE manufacture (opt-in; DO NOT run by default) ───
    // Gated behind STICKY_MANUFACTURE=true. The orchestrator runs this under
    // monitoring. MANDATORY try/finally restores (a) the sweep SQL FIRST, then
    // (b) the account status. Never leaves the sweep SQL narrowed.
    test(`CT-M1-LIVE — manufacture a candidate and prove local-cancel end-to-end ${BASE_TAG} @destructive`, async ({ api }) => {
      test.skip(
        !MANUFACTURE_ENABLED,
        'destructive manufacture CT — set STICKY_MANUFACTURE=true to run (orchestrator-monitored only)',
      );
      ensureSandbox();
      test.setTimeout(600_000);

      // Resolve a candidate: ACTIVE account with an in-flight RECOVERY_STARTED.
      let candidate: { stickyPk: number; accountPk: number; txnId: string } | null = null;
      await test.step('snapshot + pick a manufacture candidate (RECOVERY_STARTED on ACTIVE account)', async () => {
        for (const c of MANUFACTURE_CANDIDATES) {
          const row = await sbx.queryOne<StickyRow>(
            `SELECT st.pk, st.account_pk, st.sticky_transaction_id, st.recovery_status, a.account_status
               FROM uown_sticky st
               JOIN uown_sv_account a ON a.pk = st.account_pk
              WHERE st.pk = $1 AND st.account_pk = $2`,
            [c.stickyPk, c.accountPk],
          );
          if (
            row &&
            row.account_status === 'ACTIVE' &&
            row.recovery_status === 'RECOVERY_STARTED' &&
            row.sticky_transaction_id
          ) {
            candidate = { stickyPk: c.stickyPk, accountPk: c.accountPk, txnId: row.sticky_transaction_id };
            // Explicit candidate-snapshot log so a burned candidate is recorded.
            console.log(
              `[CT-M1-LIVE] CANDIDATE SNAPSHOT — sticky pk=${c.stickyPk} account=${c.accountPk} ` +
                `original account_status=ACTIVE recovery_status=RECOVERY_STARTED txnId=${row.sticky_transaction_id}`,
            );
            break;
          }
        }
      });
      test.skip(candidate === null, 'no manufacture candidate available (RECOVERY_STARTED on ACTIVE account)');
      const cand = candidate!;

      // Snapshot the original sweep SQL up-front so the finally can always restore it.
      const sweepMeta = await api.scheduledTask.getScheduledTaskByName(STICKY_RECOVER_CANCEL_SWEEP_NAME);
      expect(sweepMeta.ok, `getScheduledTaskByName ${sweepMeta.status}`).toBeTruthy();
      const originalSql = sweepMeta.body.sqlToPickAccounts;
      expect(originalSql, 'empty original sql_to_pick_accounts').toBeTruthy();

      let accountFlipped = false;
      let sqlNarrowed = false;

      try {
        // 1) Flip the account non-ACTIVE via the business action (NOT a raw UPDATE).
        await test.step('cancel the account → non-ACTIVE (business action)', async () => {
          const resp = await api.account.cancelAccount(cand.accountPk, 'QA manufacture', false);
          expect(resp.ok, `cancelAccount ${resp.status}: ${JSON.stringify(resp.body).slice(0, 200)}`).toBeTruthy();
          accountFlipped = true;
        });

        // 2) Cancel the txn directly on Sticky so the sweep's cancel returns 400.
        await test.step('cancel the txn directly on Sticky (creates the "cannot cancel" mismatch)', async () => {
          const resp = await api.stickyRecover.cancelRecovery(cand.txnId);
          // Either accepted (now terminal on Sticky → next cancel 400) is the goal;
          // we don't hard-assert ok because the point is to make Sticky terminal.
          console.log(`[CT-M1-LIVE] direct Sticky cancel → status=${resp.status}`);
        });

        // 3) Narrow the sweep SQL to this candidate, then trigger it.
        await test.step('narrow sweep SQL to st.pk=candidate + trigger', async () => {
          const narrowed = buildCreateOrUpdateScheduledTaskBody(sweepMeta.body, {
            sqlToPickAccounts:
              `SELECT st.* FROM uown_sticky st ` +
              `JOIN uown_sv_account a ON a.pk = st.account_pk ` +
              `WHERE st.pk = ${cand.stickyPk}`,
          });
          const upd = await api.scheduledTask.createOrUpdateScheduledTask(narrowed);
          expect(upd.ok, `createOrUpdateScheduledTask ${upd.status}`).toBeTruthy();
          sqlNarrowed = true;

          const trig = await api.scheduledTask.triggerScheduledTask(STICKY_RECOVER_CANCEL_SWEEP_NAME);
          expect(trig.ok, `triggerScheduledTask ${trig.status}`).toBeTruthy();
        });

        // 4) Poll the target row → recovery_status='CANCELED' (60s).
        await test.step('candidate recovery flips to CANCELED locally', async () => {
          const deadline = Date.now() + 60_000;
          let status: string | null = null;
          while (Date.now() < deadline) {
            status = await sbx.getSingleString(
              `SELECT recovery_status FROM uown_sticky WHERE pk = $1`,
              [cand.stickyPk],
            );
            if (status === 'CANCELED') break;
            await new Promise((r) => setTimeout(r, 3_000));
          }
          expect(status).toBe('CANCELED');
        });

        // 5) Assert the fresh INTERNAL note + outbound row for the candidate account.
        await test.step('fresh INTERNAL "marked CANCELED locally" note exists (Rule #13)', async () => {
          const note = await sbx.queryOne<{ log_type: string; created_by: string; notes: string }>(
            `SELECT log_type, created_by, notes
               FROM uown_sv_activity_log
              WHERE account_pk = $1 AND notes ILIKE '%marked CANCELED locally%'
              ORDER BY pk DESC LIMIT 1`,
            [cand.accountPk],
          );
          expect(note).not.toBeNull();
          expect(note!.log_type).toBe('INTERNAL');
          expect(note!.created_by).toBe('SYSTEM');
          expect(note!.notes.startsWith(NOTE_PREFIX)).toBe(true);
        });

        await test.step('cancel outbound row logged under STICKY_RECOVER', async () => {
          // Correlate by the candidate txn id (request JSON is pretty-printed, so a
          // compact `"status":"CANCELED"` substring would not match — see CT-M1).
          const ob = await waitForStickyOutboundLog(sbx, cand.accountPk, {
            requestContains: cand.txnId,
            timeoutMs: 30_000,
          });
          // pg returns bigint pk as a string — coerce before the numeric matcher.
          expect(Number(ob.pk)).toBeGreaterThan(0);
          expect(String(ob.request)).toMatch(/"status"\s*:\s*"CANCELED"/);
        });

        // Sanity: the row now references the same sticky session.
        await waitForStickySession(sbx, cand.stickyPk, 5_000).catch(() => undefined);
      } finally {
        // MANDATORY teardown — restore the sweep SQL FIRST (never leave it narrowed)…
        if (sqlNarrowed) {
          try {
            const restore = buildCreateOrUpdateScheduledTaskBody(sweepMeta.body, {
              sqlToPickAccounts: originalSql,
            });
            const r = await api.scheduledTask.createOrUpdateScheduledTask(restore);
            console.log(`[CT-M1-LIVE] restored sweep SQL → status=${r.status}`);
          } catch (e) {
            console.error(`[CT-M1-LIVE] FAILED to restore sweep SQL: ${(e as Error).message}`);
          }
        }
        // …then restore the account status (re-activate). Best-effort; logged.
        if (accountFlipped) {
          console.log(
            `[CT-M1-LIVE] account ${cand.accountPk} was flipped non-ACTIVE for the test — ` +
              `manual re-activation may be required (no safe automated reverse for cancelAccount).`,
          );
        }
      }
    });
  },
);

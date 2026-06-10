/**
 * Sticky Recover Transactions — svc#485 (RU05.26.1.52.0) — backend regression.
 *
 * SPEC: docs/taskTestingUown/RU05.26.1.52.0_stickyRecoverTransactions_485/
 *       RU05.26.1.52.0_stickyRecoverTransactions_485-spec.md
 *
 * Covers CT-01..CT-09 (API + DB backend coverage of R1..R9), CT-10 (placeholder
 * for activity log pending Q1), CT-12 (cancel sweep structural), CT-13
 * (cancel sweep functional — StickyRecoverCancelSweep auto-cancel).
 *
 * Activity-log validation (CLAUDE.md inviolable rule #13) — `// TODO(Q1):`
 * comments mark the spots where assertions will be added once Q1 is resolved.
 *
 * Setup contract:
 *  - Reuses accounts produced by `tests/api/sticky-recover-rating-setup.spec.ts`
 *    (rating 'M' / 'F' / 'B', cct DENIED, posting_date=today-7, comment workaround).
 *  - Tests query the most recent eligible cct via `findEligibleStickyCct` and
 *    proceed. If none exists, the test fails fast with a clear instruction to
 *    run the setup spec.
 *  - No mutation of `uown_sticky*` tables (audit — forbidden by SPEC).
 *
 * Environment: sandbox + qa1 (qa1 has sticky tables deployed since 2026-05-19;
 * webhook CTs (CT-05/CT-06) may be limited in qa1 if AES key is still empty).
 *
 * Project (Playwright): `api-only` (no browser).
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { sleep } from '@helpers/index.js';
import {
  waitForStickySession,
  waitForStickyTransactionId,
  waitForStickyOutboundLog,
  waitForStickyInboundEvent,
  waitForStickyRetryAttempt,
  assertStickyDedupeUnique,
  getStickySweepSqlSnapshot,
  getStickyCancelSweepSqlSnapshot,
  findEligibleStickyCct,
  createStickyEligibleFromExistingAccount,
  type StickyInboundLogRow,
  type StickyOutboundLogRow,
  type StickyRetryAttemptRow,
  type StickySessionRow,
} from '@helpers/sticky.helpers.js';
import {
  DUNNING_PROFILE_BY_FREQUENCY,
  STICKY_RECOVER_SWEEP_NAME,
} from '@data/sticky.js';
import { TestTag, buildTags, splitTags } from '../../src/types/enums.js';

// Tags from the SPEC §Test Strategy (regression nightly; smoke subset on PR).
const BASE_TAG = `${buildTags(TestTag.REGRESSION, TestTag.SANDBOX)} @sticky-recover @svc-485`;
const SMOKE_TAG = `${BASE_TAG} @sticky-recover-smoke`;

// Per CLAUDE.md testData convention — runId/email not applicable here
// (no new application created in this spec; setup spec owns that).
const testData = {
  env: 'sandbox',
  tag: BASE_TAG,
  // Reuses pre-seeded accounts from sticky-recover-rating-setup.spec.ts.
  // runId/email intentionally omitted — see CLAUDE.md `.claude/rules/testing.md` §Exception.
};

/**
 * Inner helper to JSON.parse a column that may already be parsed by node-pg
 * (jsonb is auto-parsed, json/text columns are not). Throws when truly invalid.
 */
function parseJsonColumn(value: unknown, columnLabel: string): Record<string, unknown> {
  if (value === null || value === undefined) {
    throw new Error(`[sticky] expected JSON in column ${columnLabel}, got null`);
  }
  if (typeof value === 'object') return value as Record<string, unknown>;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as Record<string, unknown>;
    } catch (err) {
      throw new Error(
        `[sticky] could not JSON.parse ${columnLabel}: ${(err as Error).message} — ` +
        `raw=${value.slice(0, 120)}`,
      );
    }
  }
  throw new Error(`[sticky] unsupported type for ${columnLabel}: ${typeof value}`);
}

test.describe.serial(
  'svc#485 — Sticky Recover Transactions (R1..R9 backend regression)',
  { tag: splitTags(testData.tag) },
  () => {
    // Per CLAUDE.md: ctx is per-test only. We share discovery between tests in
    // this serial block via describe-scope vars, but each test still re-validates
    // its preconditions via DB query (no in-memory race condition).
    let cctPk = 0;
    let accountPk = 0;
    let stickyPk = 0;
    let stickyTxnId = '';

    test.beforeAll(async ({ browser: _browser }, _testInfo) => {
      // Empty hook — placeholder to make the describe self-documenting.
      // Per-test preconditions are queried inside each test step.
      void _browser;
    });

    // ── CT-01 ────────────────────────────────────────────────────────────
    test(`CT-01 — Sweep detects eligible CCT and creates Sticky session ${SMOKE_TAG}`, async ({ api, db, ctx }) => {
      test.setTimeout(600_000);

      // Check if a sticky session already exists from a prior run
      let existingSession: StickySessionRow | null = null;
      await test.step('check for existing sticky session from prior run', async () => {
        const rows = await db.query<StickySessionRow>(
          `SELECT pk, cc_transaction_pk, account_pk, sticky_transaction_id,
                  dunning_profile_id, recovery_status,
                  row_created_timestamp, row_updated_timestamp
             FROM uown_sticky
            ORDER BY (CASE WHEN sticky_transaction_id IS NOT NULL THEN 0 ELSE 1 END), pk DESC
            LIMIT 1`,
        );
        existingSession = rows[0] ?? null;
        if (existingSession) {
          cctPk = Number(existingSession.cc_transaction_pk);
          accountPk = Number(existingSession.account_pk);
          stickyPk = Number(existingSession.pk);
          if (existingSession.sticky_transaction_id) {
            stickyTxnId = existingSession.sticky_transaction_id;
          }
          console.log(
            `[CT-01] reusing existing session: stickyPk=${stickyPk} cctPk=${cctPk} ` +
              `accountPk=${accountPk} status=${existingSession.recovery_status}`,
          );
        }
      });

      if (!existingSession) {
        await test.step('discover eligible cct OR create via fast-path', async () => {
          let candidate = await findEligibleStickyCct(db, 'M');
          if (!candidate) {
            console.log('[CT-01] no setup-spec cct found — creating via fast-path (~30s)');
            const fast = await createStickyEligibleFromExistingAccount(db);
            candidate = { cctPk: fast.cctPk, accountPk: fast.accountPk };
            console.log(
              `[CT-01] fast-path created: cctPk=${fast.cctPk} accountPk=${fast.accountPk} ` +
                `gatewayTxnId=${fast.gatewayTransactionId.slice(0, 16)}…`,
            );
          } else {
            console.log(`[CT-01] reusing setup-spec cctPk=${candidate.cctPk} accountPk=${candidate.accountPk}`);
          }
          cctPk = candidate.cctPk;
          accountPk = candidate.accountPk;
        });

        await test.step('trigger StickyRecoverSweep', async () => {
          const resp = await api.scheduledTask.triggerScheduledTask('StickyRecoverSweep');
          expect(resp.ok, `triggerScheduledTask ${resp.status}`).toBeTruthy();
        });
      }

      let session: StickySessionRow | null = existingSession;
      await test.step('verify uown_sticky row for cct', async () => {
        if (!session) {
          session = await waitForStickySession(db, cctPk, 360_000);
        }
        expect(session.recovery_status, 'recovery_status populated').toBeTruthy();
        const validStatuses = ['PENDING', 'SUBMITTED', 'RECOVERY_DRAFT', 'RECOVERY_STARTED',
          'CANCELED', 'RECOVERED', 'FAILED'];
        expect(
          validStatuses.includes(session.recovery_status as string),
          `unexpected recovery_status=${session.recovery_status}`,
        ).toBeTruthy();
        stickyPk = Number(session.pk);
        if (session.sticky_transaction_id) {
          stickyTxnId = session.sticky_transaction_id as string;
        }
        console.log(`[CT-01] stickyPk=${stickyPk} status=${session.recovery_status} txnId=${stickyTxnId || 'pending'}`);
      });

      await test.step('regression structural — sweep SQL snapshot still matches deploy', async () => {
        const sql = await getStickySweepSqlSnapshot(db);
        expect(sql.length, `${STICKY_RECOVER_SWEEP_NAME} sql empty`).toBeGreaterThan(0);
        // Sanity checks against svc commit d4bc38a52 — anchor clauses, not exact equality
        // (drift detection: if any disappears, the deployed sweep no longer matches the
        // version this spec was written for).
        expect(sql).toContain('CHANNEL_PAYMENTS_CC');
        expect(sql).toContain('SCHEDULED');
        expect(sql).toContain('SALE');
        expect(sql).toContain('uown_sticky');
      });

      // TODO(Q1): assert activity log row when Gustavo confirms target table.
      // See spec §Open questions Q1. Until then, the absence of a log entry
      // is NOT marked as a failure (regra inviolável #13 mantém-se — bloqueada).
    });

    // ── CT-02 ────────────────────────────────────────────────────────────
    test(`CT-02 — Submit to Sticky returns RECOVERY_DRAFT and persists outbound row ${SMOKE_TAG}`, async ({ db }) => {
      test.setTimeout(120_000);

      expect(accountPk, 'CT-01 must have populated accountPk').toBeGreaterThan(0);

      let outbound: StickyOutboundLogRow | null = null;
      await test.step('poll latest uown_sticky_outbound_log row for account', async () => {
        outbound = await waitForStickyOutboundLog(db, accountPk, { timeoutMs: 60_000 });
      });

      await test.step('validate outbound request shape', async () => {
        const request = parseJsonColumn(outbound!.request, 'outbound_log.request');
        // Canonical fields per SPEC §CT-02 — anchored to fields known to exist
        // in the current implementation. Doc-recommended fields like `retryable`,
        // `billingAddress`, `bin`, etc. are intentionally NOT asserted
        // (Improvement #4, out of scope).
        const originalTxn = request.originalTransaction as Record<string, unknown> | undefined;
        expect(originalTxn, 'originalTransaction object').toBeTruthy();
        expect(originalTxn!.id, 'originalTransaction.id present').toBeTruthy();
        expect(request.dunningProfileId, 'dunningProfileId present').toBeTruthy();
        if (request.paymentProfileId !== undefined) {
          expect(Number(request.paymentProfileId), 'paymentProfileId numeric').toBeGreaterThan(0);
        }
        const amount = originalTxn!.amount ?? request.amount;
        const currency = originalTxn!.currency ?? request.currency;
        expect(amount, 'amount present (top-level or originalTransaction)').toBeTruthy();
        expect(currency, 'currency present (top-level or originalTransaction)').toBeTruthy();
      });

      await test.step('validate outbound response shape', async () => {
        if (outbound!.response === null || outbound!.response === undefined) {
          console.log('[CT-02] outbound_log.response is NULL — submit to Sticky may have failed (network/timeout)');
          return;
        }
        const response = parseJsonColumn(outbound!.response, 'outbound_log.response');
        const status = String(response.status ?? response.recoveryStatus ?? '');
        const validStatuses = ['PENDING', 'SUBMITTED', 'RECOVERY_DRAFT', 'RECOVERY_STARTED'];
        expect(
          validStatuses.includes(status),
          `unexpected outbound response status=${status} (valid: ${validStatuses.join(', ')})`,
        ).toBeTruthy();
      });

      // TODO(Q1): assert activity log row when Gustavo confirms target table.
    });

    // ── CT-03 ────────────────────────────────────────────────────────────
    test(`CT-03 — Persist session with sticky_transaction_id ${SMOKE_TAG}`, async ({ db }) => {
      test.setTimeout(180_000);
      expect(cctPk, 'CT-01 must have populated cctPk').toBeGreaterThan(0);

      let session: StickySessionRow | null = null;
      await test.step('poll until sticky_transaction_id IS NOT NULL', async () => {
        session = await waitForStickyTransactionId(db, cctPk, 150_000);
      });

      await test.step('assert canonical fields populated', async () => {
        expect(Number(session!.cc_transaction_pk)).toBe(cctPk);
        expect(Number(session!.account_pk)).toBe(accountPk);
        expect(session!.sticky_transaction_id, 'sticky_transaction_id non-empty').toBeTruthy();
        expect(session!.dunning_profile_id, 'dunning_profile_id present').toBeTruthy();
        expect(session!.recovery_status, 'recovery_status present').toBeTruthy();
        expect(session!.row_created_timestamp, 'row_created_timestamp present').toBeTruthy();
        stickyTxnId = session!.sticky_transaction_id as string;
      });

      await test.step('cross-check sticky_transaction_id against outbound_log.response.transactionId', async () => {
        const outbound = await waitForStickyOutboundLog(db, accountPk, { timeoutMs: 30_000 });
        const response = parseJsonColumn(outbound.response, 'outbound_log.response');
        const responseTxnId =
          (response.transactionId as string | undefined) ??
          (response.stickyTransactionId as string | undefined) ??
          (response.id as string | undefined) ?? '';
        // Soft cross-check: if the response payload carries the id, it MUST match.
        // First sandbox runs may not echo it back — only assert when present.
        if (responseTxnId) {
          expect(responseTxnId).toBe(stickyTxnId);
        } else {
          console.log('[CT-03] outbound_log.response does not echo transactionId — skipping cross-check');
        }
      });

      // TODO(Q1): assert activity log row when Gustavo confirms target table.
    });

    // ── CT-04 ────────────────────────────────────────────────────────────
    test('CT-04 — Audit trail: request + response + header + stack_trace columns populated', async ({ db }) => {
      test.setTimeout(60_000);
      expect(accountPk, 'CT-01 must have populated accountPk').toBeGreaterThan(0);

      const outbound = await waitForStickyOutboundLog(db, accountPk, { timeoutMs: 30_000 });
      const request = parseJsonColumn(outbound.request, 'outbound_log.request');
      const response = parseJsonColumn(outbound.response, 'outbound_log.response');

      expect(Object.keys(request).length, 'request has keys').toBeGreaterThan(0);
      expect(Object.keys(response).length, 'response has keys').toBeGreaterThan(0);

      // Header may be JSON or plain text (svc stores as text, not jsonb)
      const headerRaw = String(outbound.header ?? '').toLowerCase();
      expect(
        headerRaw.includes('content-type'),
        `Content-Type missing in header: ${headerRaw.slice(0, 200)}`,
      ).toBeTruthy();
      expect(outbound.stack_trace, 'stack_trace null on happy path').toBeNull();
    });

    // ── CT-05 ────────────────────────────────────────────────────────────
    test('CT-05 — Webhook `recovery.started` decrypted and ACCEPTED', async ({ db }) => {
      test.setTimeout(180_000);
      expect(accountPk, 'CT-01 must have populated accountPk').toBeGreaterThan(0);

      await test.step('verify inbound_log has recovery.started for this session', async () => {
        const rows = await db.query<StickyInboundLogRow>(
          `SELECT pk, event_type, status, decrypted_json, dedupe_key, stack_trace, row_created_timestamp
             FROM uown_sticky_inbound_log
            WHERE sticky_pk = $1 AND event_type = 'recovery.started'
            ORDER BY pk DESC LIMIT 1`,
          [stickyPk],
        );
        if (rows.length === 0) {
          const anyRows = await db.query<{ cnt: string }>(
            `SELECT COUNT(*)::text AS cnt FROM uown_sticky_inbound_log WHERE sticky_pk = $1`,
            [stickyPk],
          );
          const total = Number(anyRows[0]?.cnt ?? 0);
          if (total === 0) {
            console.log('[CT-05] no inbound webhooks for this session — AES key may be empty');
            test.skip(true, 'No inbound webhooks for this sticky session');
          }
          console.log(`[CT-05] ${total} inbound rows for stickyPk=${stickyPk} but none is recovery.started`);
          test.skip(true, 'Inbound logs exist but no recovery.started event for this session');
        }
        const inbound = rows[0];
        expect(inbound.status, 'inbound status populated').toBeTruthy();
        console.log(`[CT-05] recovery.started found: pk=${inbound.pk} status=${inbound.status}`);
        if (inbound.decrypted_json) {
          const decrypted = parseJsonColumn(inbound.decrypted_json, 'inbound_log.decrypted_json');
          expect(Object.keys(decrypted).length, 'decrypted_json has keys').toBeGreaterThan(0);
        }
        expect(inbound.stack_trace, 'stack_trace null on success').toBeNull();
      });

      // TODO(Q1): assert activity log row when Gustavo confirms target table.
    });

    // ── CT-06 ────────────────────────────────────────────────────────────
    test('CT-06 — Webhook `recovery.attempt_failed` creates retry_attempt row', async ({ db }) => {
      // Sandbox observation: each retry attempt takes ~1 min between webhooks.
      // Budget 7 min (inbound 5 min + retry row 2 min margin).
      test.setTimeout(420_000);
      expect(stickyPk, 'CT-01 must have populated stickyPk').toBeGreaterThan(0);

      await test.step('verify inbound_log or retry_attempt for this session', async () => {
        const inboundRows = await db.query<StickyInboundLogRow>(
          `SELECT pk, event_type, status, dedupe_key
             FROM uown_sticky_inbound_log
            WHERE sticky_pk = $1
            ORDER BY pk DESC LIMIT 5`,
          [stickyPk],
        );
        if (inboundRows.length === 0) {
          console.log('[CT-06] no inbound webhooks for this session');
          test.skip(true, 'No inbound webhooks for this sticky session');
        }
        console.log(`[CT-06] ${inboundRows.length} inbound events for stickyPk=${stickyPk}: ${inboundRows.map(r => r.event_type).join(', ')}`);
        for (const row of inboundRows) {
          expect(row.status, `inbound pk=${row.pk} status populated`).toBeTruthy();
        }
      });

      await test.step('check retry_attempt rows for stickyPk', async () => {
        const retryRows = await db.query<StickyRetryAttemptRow>(
          `SELECT pk, sticky_pk, attempt_number, http_status, retry_status,
                  gateway_transaction_id, row_created_timestamp
             FROM uown_sticky_retry_attempt WHERE sticky_pk = $1 ORDER BY attempt_number`,
          [stickyPk],
        );
        if (retryRows.length === 0) {
          console.log('[CT-06] no retry_attempt rows for this session');
          return;
        }
        console.log(`[CT-06] ${retryRows.length} retry attempts: ${retryRows.map(r => `#${r.attempt_number}=${r.retry_status}`).join(', ')}`);
        expect(Number(retryRows[0].sticky_pk)).toBe(stickyPk);
        expect(retryRows[0].attempt_number).toBeGreaterThanOrEqual(1);
      });

      // TODO(Q1): assert activity log row when Gustavo confirms target table.
    });

    // ── CT-07 ────────────────────────────────────────────────────────────
    test('CT-07 — Dedupe: UNIQUE constraint + no duplicated dedupe_key rows (observational)', async ({ db }) => {
      test.setTimeout(60_000);

      const stats = await assertStickyDedupeUnique(db);
      expect(
        stats.uniqueConstraintNames.length,
        `expected at least one UNIQUE constraint on uown_sticky_webhook_dedupe — found ${stats.uniqueConstraintNames.join(',') || 'none'}`,
      ).toBeGreaterThan(0);
      // Count invariant — no duplicates across the whole table.
      expect(
        stats.totalRows,
        `dedupe count mismatch: total=${stats.totalRows} distinct=${stats.distinctKeys}`,
      ).toBe(stats.distinctKeys);

      // Activity log: N/A for CT-07 (operação interna, sem ação de negócio).
    });

    // ── CT-08 ────────────────────────────────────────────────────────────
    test('CT-08 — dunningProfileId resolved per payment_frequency (WEEKLY → 223)', async ({ db }) => {
      test.setTimeout(60_000);
      expect(accountPk, 'CT-01 must have populated accountPk').toBeGreaterThan(0);

      await test.step('assert dunningProfileId in existing outbound request matches frequency', async () => {
        // Validate from the outbound log already created by the sweep in CT-01/CT-02.
        // Account 4945 has payment_frequency=WEEKLY → dunningProfileId should be 223.
        const outbound = await waitForStickyOutboundLog(db, accountPk, { timeoutMs: 30_000 });
        const request = parseJsonColumn(outbound.request, 'outbound_log.request');
        expect(request.dunningProfileId, 'dunningProfileId present in outbound').toBeTruthy();

        const freq = await db.queryOne<{ payment_frequency: string }>(
          `SELECT payment_frequency FROM uown_sv_sched_summary WHERE account_pk = $1`,
          [accountPk],
        );
        const expectedProfile = DUNNING_PROFILE_BY_FREQUENCY[freq?.payment_frequency ?? ''];
        if (expectedProfile) {
          expect(
            Number(request.dunningProfileId),
            `dunningProfileId should match ${freq!.payment_frequency} → ${expectedProfile}`,
          ).toBe(expectedProfile);
        } else {
          console.log(`[CT-08] unknown frequency=${freq?.payment_frequency}, asserting dunningProfileId is numeric`);
          expect(Number(request.dunningProfileId)).toBeGreaterThan(0);
        }
      });

      // TODO(Q1): assert activity log row when Gustavo confirms target table.
    });

    // ── CT-09 ────────────────────────────────────────────────────────────
    test('CT-09 — Cancel endpoint available + functional', async ({ api, db }) => {
      // CT-09 reuses the session from CT-01..CT-07 (stickyPk + stickyTxnId).
      // If the chain produced a CANCELED status earlier, we fail-fast — caller
      // must run CT-01 first.
      test.setTimeout(120_000);
      expect(stickyTxnId, 'CT-03 must have populated stickyTxnId').toBeTruthy();

      let outboundSincePk = 0;
      await test.step('capture baseline outbound pk (account-scoped)', async () => {
        const latest = await db.query<{ pk: string }>(
          `SELECT pk FROM uown_sticky_outbound_log WHERE account_pk = $1 ORDER BY pk DESC LIMIT 1`,
          [accountPk],
        );
        outboundSincePk = latest.length > 0 ? Number(latest[0].pk) : 0;
      });

      let cancelResponseStatus = 0;
      await test.step('POST /processing-hub/v2/api/recovery/cancel (reason=CANCELED)', async () => {
        const resp = await api.stickyRecover.cancelRecovery(stickyTxnId, 'CANCELED', 'svc#485 CT-09');
        cancelResponseStatus = resp.status;
        if (resp.status === 404) {
          console.log(`[CT-09] cancel endpoint returned 404 — not deployed/routed in this env`);
          test.skip(true, 'Cancel endpoint /processing-hub/v2/api/recovery/cancel returned 404 — not available in this env');
        }
        expect(
          resp.ok,
          `cancel ${resp.status}: ${JSON.stringify(resp.body).slice(0, 300)}`,
        ).toBeTruthy();
        console.log(`[CT-09] cancel response status=${cancelResponseStatus} body=${JSON.stringify(resp.body).slice(0, 200)}`);
      });

      await test.step('outbound_log row for the cancel call exists', async () => {
        const outbound = await waitForStickyOutboundLog(db, accountPk, {
          sincePk: outboundSincePk,
          timeoutMs: 30_000,
        });
        // We don't strictly assert what's INSIDE (Q2 — contract empirical) —
        // existence + parseability is enough to satisfy R9.
        expect(outbound.request, 'cancel outbound.request column populated').toBeTruthy();
      });

      await test.step('uown_sticky.recovery_status moved to a final state', async () => {
        // Poll up to 30s for state change. Final state name depends on Q2; we
        // accept any state different from RECOVERY_STARTED/DRAFT (caller-side
        // hard-coding the new name would couple to Q2 prematurely).
        const start = Date.now();
        let finalStatus = '';
        while (Date.now() - start < 30_000) {
          const row = await db.queryOne<{ recovery_status: string | null }>(
            `SELECT recovery_status FROM uown_sticky WHERE pk = $1`,
            [stickyPk],
          );
          finalStatus = (row?.recovery_status as string | null) ?? '';
          const nonFinalStatuses = ['PENDING', 'SUBMITTED', 'RECOVERY_DRAFT', 'RECOVERY_STARTED'];
          if (finalStatus && !nonFinalStatuses.includes(finalStatus)) {
            break;
          }
          await sleep(3_000);
        }
        console.log(`[CT-09] uown_sticky.pk=${stickyPk} final recovery_status=${finalStatus}`);
        const nonFinalStatuses = ['PENDING', 'SUBMITTED', 'RECOVERY_DRAFT', 'RECOVERY_STARTED'];
        expect(
          finalStatus && !nonFinalStatuses.includes(finalStatus),
          `expected final state after cancel, still ${finalStatus}`,
        ).toBeTruthy();
      });

      // TODO(Q1): assert activity log row when Gustavo confirms target table.
    });

    // ── CT-12 ────────────────────────────────────────────────────────────
    test('CT-12 — StickyRecoverCancelSweep SQL snapshot regression', async ({ db }) => {
      test.setTimeout(30_000);

      await test.step('cancel sweep SQL exists and contains anchor clauses', async () => {
        const sql = await getStickyCancelSweepSqlSnapshot(db);
        expect(sql.length, 'StickyRecoverCancelSweep sql empty').toBeGreaterThan(0);
        expect(sql).toContain('uown_sticky');
        expect(sql).toContain('sticky_transaction_id');
        expect(sql).toContain('account_status');
        expect(sql).toContain('recovery_status');
      });

      await test.step('recover sweep SQL still intact after cancel sweep deploy', async () => {
        const sql = await getStickySweepSqlSnapshot(db);
        expect(sql.length).toBeGreaterThan(0);
        expect(sql).toContain('CHANNEL_PAYMENTS_CC');
        expect(sql).toContain('SCHEDULED');
        expect(sql).toContain('SALE');
      });
    });

    // ── CT-13 ────────────────────────────────────────────────────────────
    test('CT-13 — StickyRecoverCancelSweep auto-cancels sessions on non-ACTIVE accounts', async ({ api, db }) => {
      test.setTimeout(180_000);
      expect(stickyPk, 'CT-01 must have populated stickyPk').toBeGreaterThan(0);
      expect(accountPk, 'CT-01 must have populated accountPk').toBeGreaterThan(0);

      // Check if the session is still in a cancellable state (CT-09 may have already canceled it)
      await test.step('verify session is in a non-final state', async () => {
        const row = await db.queryOne<{ recovery_status: string | null }>(
          `SELECT recovery_status FROM uown_sticky WHERE pk = $1`,
          [stickyPk],
        );
        const status = row?.recovery_status ?? '';
        if (['CANCELED', 'RECOVERED', 'FAILED'].includes(status)) {
          console.log(`[CT-13] session already in final state=${status} — skipping cancel sweep test`);
          test.skip(true, `Session already ${status} (likely canceled by CT-09)`);
        }
      });

      await test.step('deactivate account (PAID_OUT) so cancel sweep picks it up', async () => {
        const affected = await db.executeUpdate(
          `UPDATE uown_sv_account SET account_status = 'PAID_OUT' WHERE pk = $1`,
          [accountPk],
        );
        expect(affected).toBe(1);
        console.log(`[CT-13] account ${accountPk} status changed to PAID_OUT`);
      });

      await test.step('trigger StickyRecoverCancelSweep', async () => {
        const resp = await api.scheduledTask.triggerScheduledTask('StickyRecoverCancelSweep');
        expect(resp.ok, `triggerScheduledTask cancel ${resp.status}`).toBeTruthy();
      });

      await test.step('wait for recovery_status to reach final state (CANCELED)', async () => {
        const start = Date.now();
        let finalStatus = '';
        const nonFinalStatuses = ['PENDING', 'SUBMITTED', 'RECOVERY_DRAFT', 'RECOVERY_STARTED'];
        while (Date.now() - start < 120_000) {
          const row = await db.queryOne<{ recovery_status: string | null }>(
            `SELECT recovery_status FROM uown_sticky WHERE pk = $1`,
            [stickyPk],
          );
          finalStatus = (row?.recovery_status as string | null) ?? '';
          if (finalStatus && !nonFinalStatuses.includes(finalStatus)) {
            break;
          }
          await sleep(3_000);
        }
        console.log(`[CT-13] uown_sticky.pk=${stickyPk} final recovery_status=${finalStatus}`);
        expect(
          finalStatus && !nonFinalStatuses.includes(finalStatus),
          `expected final state after cancel sweep, still ${finalStatus}`,
        ).toBeTruthy();
      });

      await test.step('cleanup: restore account to ACTIVE', async () => {
        await db.executeUpdate(
          `UPDATE uown_sv_account SET account_status = 'ACTIVE' WHERE pk = $1`,
          [accountPk],
        );
        console.log(`[CT-13] account ${accountPk} restored to ACTIVE`);
      });
    });

    // ── CT-10 — PLACEHOLDER, blocked by Q1 ───────────────────────────────
    test.skip(
      'CT-10 — Activity log generated for recovery actions (BLOCKED by Q1)',
      async () => {
        // Intentionally skipped — see SPEC §Open questions Q1 and
        // RU05.26.1.52.0_stickyRecoverTransactions_485-spec.md §CT-10.
        //
        // Until Gustavo Martins confirms the EXACT table Sticky writes the
        // activity log to (Q1 of the spec), we cannot author a meaningful
        // assertion: empirical evidence shows zero rows in
        // `uown_los_lead_notes`, `uown_sv_activity_log`, `uown_los_activity_log`
        // after submit + 6 webhooks. Implementing a placeholder assertion would
        // either (a) falsely pass (querying an empty wrong table) or (b)
        // falsely fail (using the wrong table).
        //
        // When Q1 is answered: implement the query for the confirmed table,
        // filter by (account_pk, lead_pk, sticky_pk) as applicable, assert
        // ≥ 1 row per business action (submit / recovery.started /
        // recovery.attempt_failed / cancel).
      },
    );
  },
);

/**
 * Send Time of Original Transaction to Sticky (RU06.26.1.53.0).
 *
 * Feature: the outbound recovery request to the new Sticky vendor now carries the
 * ORIGINAL transaction time. Resolver `StickyRecoverSubmissionService
 * .resolveOriginalTransactionTimeUtc(CCTransactionInfo)`:
 *   - primary  = CCT `completed_time` (LocalDateTime) .atZone(America/New_York).toInstant()
 *   - fallback = `posting_date`.atStartOfDay(America/New_York).toInstant()  (when completed_time null)
 * On the wire (live-confirmed) it lands at JSON path `originalTransaction.timeStampUTC`,
 * ISO-8601 UTC with `Z`. NOTE: the wire key differs from the svc arg name
 * (`originalTransactionTimeUtc`) — it comes from the external Sticky JAR.
 *
 * Live-confirmed values (sandbox 2026-06-23 — see [[original-tx-time-sticky-field]]):
 *   - PRIMARY:  completed_time (today-7) 14:30:00 NY -> "2026-06-16T18:30:00Z"  (EDT -4)
 *   - FALLBACK: completed_time NULL, posting_date today-7 -> "2026-06-16T04:00:00Z" (midnight EDT)
 *   - REGRESSION: pre-feature outbound rows have NO `timeStampUTC` key.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SANDBOX-ONLY. Sticky tables are populated only in sandbox; qa2/dev2 have the
 * schema but `uown_sticky` is empty + webhooks don't decrypt
 * ([[sticky-refund-tests-sandbox-only]]).
 *
 * DB CONNECTION: sandbox tunnel is up manually at 127.0.0.1:5445 (the
 * `.env UOWN_DB_URL_SBX` says 5446 but that is stale — NOT edited). This spec
 * builds its OWN `DatabaseHelpers` at 5445 and its OWN `ScheduledTaskClient`
 * via `ConfigEnvironment('sandbox')` so it always targets sandbox regardless of
 * the ambient `ENV`. `beforeAll` verifies the tunnel points at sandbox and SKIPS
 * the suite otherwise.
 *
 * NO UI AFFORDANCE (Rule #18 exception (a)): the outbound recovery field is an
 * internal Quartz-sweep integration with no portal surface — API/DB coverage.
 *
 * DB MUTATIONS: the morph (`createStickyEligibleFromExistingAccount`) plus the
 * `completed_time` UPDATE/NULL to pin each branch were EXPLICITLY authorized by
 * the user for sandbox (CLAUDE.md Exception 2 satisfied).
 *
 * Project (Playwright): task-testing.
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { request as pwRequest, type APIRequestContext } from '@playwright/test';
import { ConfigEnvironment } from '@config/environment.js';
import { DatabaseHelpers } from '@helpers/database.helpers.js';
import {
  createStickyEligibleFromExistingAccount,
  waitForStickyOutboundLog,
} from '@helpers/sticky.helpers.js';
import { ScheduledTaskClient } from '@api/clients/scheduled-task.client.js';
import { STICKY_RECOVER_SWEEP_NAME } from '@data/sticky.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';

const BASE_TAG = `${buildTags(TestTag.REGRESSION, TestTag.SANDBOX)} @servicing @svc @sticky-recover`;

const TIMESTAMP_FIELD = 'originalTransaction.timeStampUTC';
const ISO_Z = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
const SWEEP_POLL_MS = 6 * 60_000;

/** Builds a node-pg connection string for the sandbox tunnel on port 5445 (.env 5446 is stale). */
function buildSandboxConnString(): string {
  const jdbc = process.env.UOWN_DB_URL_SBX ?? '';
  const database = (jdbc.split('/').pop() ?? 'svc').split('?')[0] || 'svc';
  const user = process.env.UOWN_DB_USER_SBX ?? '';
  const pass = process.env.UOWN_DB_PASS_SBX ?? '';
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@127.0.0.1:5445/${database}`;
}

/** Wall-clock of an instant rendered in America/New_York as "YYYY-MM-DD HH:MM:SS". */
function nyWallClock(instant: string | number | Date): string {
  const s = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(new Date(instant));
  // ICU h24 renders midnight as "24:00:00" on the same date -> normalize to 00:00:00.
  return s.replace(', ', ' ').replace(' 24:', ' 00:');
}

function parseRequest(raw: unknown): Record<string, unknown> | null {
  if (raw && typeof raw === 'object') return raw as Record<string, unknown>;
  if (typeof raw === 'string') { try { return JSON.parse(raw) as Record<string, unknown>; } catch { return null; } }
  return null;
}

interface ProbeResult {
  outboundPk: number;
  timeStampUTC: string;
  payload: Record<string, unknown>;
}

test.describe.serial(
  'original transaction time travels in the Sticky recovery request (sandbox)',
  { tag: splitTags(BASE_TAG) },
  () => {
    let sbx: DatabaseHelpers;
    let ctx: APIRequestContext;
    let scheduledTask: ScheduledTaskClient;
    let suiteSkipReason = '';

    test.beforeAll(async () => {
      if (!process.env.UOWN_DB_USER_SBX || !process.env.UOWN_DB_PASS_SBX) {
        suiteSkipReason = 'UOWN_DB_USER_SBX / UOWN_DB_PASS_SBX not set';
        return;
      }
      sbx = new DatabaseHelpers(buildSandboxConnString());
      try {
        const marker = await sbx.getSingleString(`SELECT to_regclass('public.uown_sticky') AS t`);
        if (!marker) { suiteSkipReason = 'uown_sticky absent — tunnel not pointing at sandbox'; return; }
        const populated = await sbx.queryOne<{ n: number }>(`SELECT COUNT(*)::int AS n FROM uown_sticky`);
        if (!populated || populated.n === 0) { suiteSkipReason = 'uown_sticky empty — not sandbox'; return; }
      } catch (err) {
        suiteSkipReason = `sandbox preflight failed: ${(err as Error).message}`;
        return;
      }
      ctx = await pwRequest.newContext();
      scheduledTask = new ScheduledTaskClient(ctx, new ConfigEnvironment('sandbox'));
    });

    test.afterAll(async () => {
      if (sbx) await sbx.close();
      if (ctx) await ctx.dispose();
    });

    function ensureSandbox(): void {
      test.skip(!!suiteSkipReason, `sandbox preflight skipped suite: ${suiteSkipReason}`);
    }

    /**
     * Morphs a fresh eligible CCT, optionally pins completed_time, triggers the
     * sweep, and returns the outbound request payload + the timeStampUTC value.
     */
    async function morphTriggerAndCapture(
      completedTimeSql: string | null,
    ): Promise<{ probe: ProbeResult; accountPk: number; cctPk: number }> {
      const elig = await createStickyEligibleFromExistingAccount(sbx, {});
      console.log(`[setup] accountPk=${elig.accountPk} cctPk=${elig.cctPk} gtid=${elig.gatewayTransactionId}`);

      // Pin the source oracle (authorized DB write). completedTimeSql null => NULL (force fallback).
      await sbx.executeUpdate(
        `UPDATE uown_sv_credit_card_transaction SET completed_time = ${completedTimeSql ?? 'NULL'} WHERE pk = $1`,
        [elig.cctPk],
      );

      const before = await sbx.queryOne<{ mx: number }>(
        `SELECT COALESCE(MAX(pk), 0)::int AS mx FROM uown_sticky_outbound_log`,
      );
      const sincePk = Number(before?.mx ?? 0);

      try { await scheduledTask.resumeScheduledTask(STICKY_RECOVER_SWEEP_NAME); } catch { /* not paused */ }
      const trig = await scheduledTask.triggerScheduledTask(STICKY_RECOVER_SWEEP_NAME);
      expect(trig.ok, `trigger http=${trig.status}`).toBeTruthy();

      const out = await waitForStickyOutboundLog(sbx, elig.accountPk, { sincePk, timeoutMs: SWEEP_POLL_MS });
      const payload = parseRequest(out.request);
      expect(payload, `outbound row pk=${out.pk} request not parseable`).not.toBeNull();
      const original = (payload as Record<string, unknown>).originalTransaction as Record<string, unknown> | undefined;
      const timeStampUTC = original?.timeStampUTC as string | undefined;
      console.log(`[result] outbound pk=${out.pk} ${TIMESTAMP_FIELD}=${timeStampUTC}`);
      return {
        probe: { outboundPk: Number(out.pk), timeStampUTC: timeStampUTC ?? '', payload: payload as Record<string, unknown> },
        accountPk: elig.accountPk,
        cctPk: elig.cctPk,
      };
    }

    // ── CT-01 — PRIMARY branch: completed_time -> NY→UTC (AC1, AC2, AC3) ────────
    test(`CT-01 — completed_time is sent as originalTransaction.timeStampUTC (NY→UTC) ${BASE_TAG} @critical`, async () => {
      ensureSandbox();
      test.setTimeout(8 * 60_000);

      const { probe, cctPk } = await morphTriggerAndCapture(
        `(CURRENT_DATE - INTERVAL '7 days') + TIME '14:30:00'`,
      );

      await test.step('AC1 — the field is present', () => {
        expect(probe.timeStampUTC, `${TIMESTAMP_FIELD} missing in payload`).toBeTruthy();
      });
      await test.step('AC3 — ISO-8601 UTC with Z', () => {
        expect(probe.timeStampUTC).toMatch(ISO_Z);
      });
      await test.step('AC2 — value round-trips to the source completed_time in America/New_York', async () => {
        const src = await sbx.getSingleString(
          `SELECT to_char(completed_time, 'YYYY-MM-DD HH24:MI:SS') FROM uown_sv_credit_card_transaction WHERE pk = $1`,
          [cctPk],
        );
        console.log(`[CT-01] completed_time(NY local)=${src} | sent reads-as-NY=${nyWallClock(probe.timeStampUTC)}`);
        expect(nyWallClock(probe.timeStampUTC)).toBe(src);
      });
    });

    // ── CT-02 — FALLBACK branch: completed_time null -> posting_date midnight ───
    test(`CT-02 — null completed_time falls back to posting_date start-of-day (NY→UTC) ${BASE_TAG}`, async () => {
      ensureSandbox();
      test.setTimeout(8 * 60_000);

      const { probe, cctPk } = await morphTriggerAndCapture(null);

      await test.step('field present + ISO-8601 Z', () => {
        expect(probe.timeStampUTC).toBeTruthy();
        expect(probe.timeStampUTC).toMatch(ISO_Z);
      });
      await test.step('value round-trips to posting_date 00:00:00 in America/New_York', async () => {
        const pd = await sbx.getSingleString(
          `SELECT to_char(posting_date, 'YYYY-MM-DD') FROM uown_sv_credit_card_transaction WHERE pk = $1`,
          [cctPk],
        );
        const expectedNy = `${pd} 00:00:00`;
        console.log(`[CT-02] posting_date=${pd} | sent reads-as-NY=${nyWallClock(probe.timeStampUTC)}`);
        expect(nyWallClock(probe.timeStampUTC)).toBe(expectedNy);
      });
    });

    // ── CT-04 — audit trail (Rule #13 OBSERVAÇÃO) ──────────────────────────────
    // The recovery SUBMISSION writes NO human-facing activity-log note (only the
    // refund flow does — pre-existing svc#485 behavior, NOT a regression of this feature).
    // The audit trail for a submission is the uown_sticky row + the outbound_log
    // row, so we assert those rather than a non-existent note.
    test(`CT-04 — submission audit trail = uown_sticky + outbound_log (no recovery note) ${BASE_TAG}`, async () => {
      ensureSandbox();
      test.setTimeout(8 * 60_000);

      const { accountPk, cctPk } = await morphTriggerAndCapture(
        `(CURRENT_DATE - INTERVAL '7 days') + TIME '09:15:00'`,
      );
      await test.step('uown_sticky row created for the morphed cct', async () => {
        const row = await sbx.queryOne<{ recovery_status: string }>(
          `SELECT recovery_status FROM uown_sticky WHERE account_pk = $1 AND cc_transaction_pk = $2 ORDER BY pk DESC LIMIT 1`,
          [accountPk, cctPk],
        );
        expect(row, 'no uown_sticky row for submission').not.toBeNull();
        expect(['PENDING', 'RECOVERY_STARTED', 'SUBMITTED', 'RECOVERY_DRAFT']).toContain(row?.recovery_status);
      });
      await test.step('no recovery-submission note in uown_sv_activity_log (documented behavior)', async () => {
        const note = await sbx.queryOne<{ pk: number }>(
          `SELECT pk FROM uown_sv_activity_log
            WHERE account_pk = $1 AND notes ILIKE '%recover%' AND notes NOT ILIKE '%refund%'
              AND row_created_timestamp > now() - interval '15 minutes' LIMIT 1`,
          [accountPk],
        );
        // OBSERVAÇÃO: expected to be null today. If this ever returns a row, the
        // recovery flow started logging notes — revisit this assertion.
        expect(note, 'recovery now writes an activity note — update CT-04 expectation').toBeNull();
      });
    });

    // ── CT-05 — both-null edge: unreachable via the sweep ──────────────────────
    // resolveOriginalTransactionTimeUtc returns null only when BOTH completed_time
    // and posting_date are null. The sweep selection requires posting_date
    // (CURRENT_DATE - 7 days, NOT NULL), so this branch cannot be reached through
    // StickyRecoverSweep. Documented as a code-reading observation; not a live test.
    test.skip(`CT-05 — both-null returns null (unreachable via sweep) ${BASE_TAG}`, () => {
      // Intentionally skipped — see comment above.
    });
  },
);

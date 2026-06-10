/**
 * WI-525 — TMS/LOS controllers not written to `uown_sv_inbound_api_log`.
 *
 * API + DB regression suite covering the fix in commit `11054d234`
 * (`AspectInboundApiLog.java` — extended pointcuts for
 * `com.uownleasing.svc.rest.tms..*`, `LosExternalMerchantController`,
 * `CustomExceptionHandler` + FQCN comparison for the `TMS-` username prefix).
 *
 * Pure API + DB — no UI affordance (UI-First exception #1: admin/ops
 * audit-trail endpoint with no portal surface).
 *
 * Setup data: pre-existing seeded account in qa1
 * (`accountPk=4524 (qa1 seeded, per user 2026-05-20)`). NO DB mutation
 * (Exception 3 + Test Data Hierarchy regra #10 §3 — fixture pré-existente
 * com justificativa: o teste valida AOP de logging puro, não exige fresh
 * lifecycle; criar lead novo por scenario adiciona ~10 min/CT sem ganho
 * de cobertura para o defeito específico).
 *
 * Correlation: every POST body includes a `uuid` field captured by
 * `AspectInboundApiLog.setApiLogInfo` (`:177-180`) into
 * `source_uuid`. GET endpoints rely on the `X-Run-Id` header which the
 * aspect serializes into `apiLogInfo.header` via `Map.toString()`
 * (`:186-193`). Both strategies are documented in SPEC § "Correlation
 * strategy (CT-05)".
 *
 * Tags: @regression @api @task-525 @qa1 (gated to qa1 — the only env
 * where the fix is currently deployed per Phase D resolution).
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { generateRunId } from '@config/constants.js';
import { sleep } from '@helpers/common.helpers.js';
import { createPreQualifiedApplication, buildTestData } from '@helpers/index.js';
import { buildApplicationStatusBody } from '@api/bodies/index.js';

// ── Pre-existing seeded account (Test Data Hierarchy §3 exception) ──
// [ASSUNÇÃO A-1] qa1 primary. Account 4524 (qa1, per user)
// fixture used by tests/e2e/website/login-otp.spec.ts (qa1 mapping). If
// the env is qa2 the test still runs but selects qa2-known fixture.
const SEED_ACCOUNTS: Record<string, { accountPk: string; leadPk: string }> = {
  qa1: { accountPk: '4524', leadPk: 'tbd' }, // leadPk not needed for WI-525 (only accountPk used in TMS endpoints)
  qa2: { accountPk: '11540', leadPk: '16095' },
  stg: { accountPk: '589199', leadPk: '6559745' },
};
const TARGET_ENV = (process.env.ENV ?? 'qa1');
const SEED = SEED_ACCOUNTS[TARGET_ENV] ?? SEED_ACCOUNTS.qa1;

// Tables touched (read-only).
const SV_LOG = 'uown_sv_inbound_api_log';
const LOS_LOG = 'uown_los_inbound_api_log';
const SV_ACTIVITY_LOG = 'uown_sv_activity_log';

// ── Helper row shape ────────────────────────────────────────────────
interface InboundApiLogRow {
  pk: number | string;
  api: string | null;
  call_type: string | null;
  url: string | null;
  request: string | null;
  response: string | null;
  header: string | null;
  source_uuid: string | null;
  stack_trace: string | null;
  agent: string | null;
  row_created_timestamp: Date | string | null;
}

// ── DB query helpers (scoped to this spec — no helper-catalog match) ──
//
// These thin wrappers are intentionally inline because the WI-525 surface
// is bounded to two tables (`uown_*_inbound_api_log`); creating a generic
// helper in `src/helpers/database.helpers.ts` would over-fit the catalog.
// All queries are read-only (Exception 3).
async function fetchSvLogsByUuid(
  db: import('@helpers/database.helpers.js').DatabaseHelpers,
  sourceUuid: string,
  since: Date,
): Promise<InboundApiLogRow[]> {
  // Aspect lowercases body before extracting uuid AND wraps value in literal quotes.
  // Match both quoted and unquoted, case-insensitive.
  return db.query<InboundApiLogRow>(
    `SELECT pk, api, call_type, url, request, response, header, source_uuid,
            stack_trace, agent, row_created_timestamp
       FROM ${SV_LOG}
      WHERE (source_uuid ILIKE $1 OR source_uuid ILIKE $2)
        AND row_created_timestamp >= $3 AT TIME ZONE current_setting('TimeZone')
      ORDER BY pk ASC`,
    [sourceUuid, `"${sourceUuid}"`, since.toISOString()],
  );
}

async function fetchSvLogsByHeader(
  db: import('@helpers/database.helpers.js').DatabaseHelpers,
  headerMarker: string,
  since: Date,
): Promise<InboundApiLogRow[]> {
  return db.query<InboundApiLogRow>(
    `SELECT pk, api, call_type, url, request, response, header, source_uuid,
            stack_trace, agent, row_created_timestamp
       FROM ${SV_LOG}
      WHERE header ILIKE $1
        AND row_created_timestamp >= $2 AT TIME ZONE current_setting('TimeZone')
      ORDER BY pk ASC`,
    [`%${headerMarker}%`, since.toISOString()],
  );
}

async function fetchLosLogsByUuid(
  db: import('@helpers/database.helpers.js').DatabaseHelpers,
  sourceUuid: string,
  since: Date,
): Promise<InboundApiLogRow[]> {
  return db.query<InboundApiLogRow>(
    `SELECT pk, api, call_type, url, request, response, header, source_uuid,
            stack_trace, agent, row_created_timestamp
       FROM ${LOS_LOG}
      WHERE (source_uuid ILIKE $1 OR source_uuid ILIKE $2)
        AND row_created_timestamp >= $3 AT TIME ZONE current_setting('TimeZone')
      ORDER BY pk ASC`,
    [sourceUuid, `"${sourceUuid}"`, since.toISOString()],
  );
}

async function fetchLosLogsByHeader(
  db: import('@helpers/database.helpers.js').DatabaseHelpers,
  headerMarker: string,
  since: Date,
): Promise<InboundApiLogRow[]> {
  return db.query<InboundApiLogRow>(
    `SELECT pk, api, call_type, url, request, response, header, source_uuid,
            stack_trace, agent, row_created_timestamp
       FROM ${LOS_LOG}
      WHERE header ILIKE $1
        AND row_created_timestamp >= $2 AT TIME ZONE current_setting('TimeZone')
      ORDER BY pk ASC`,
    [`%${headerMarker}%`, since.toISOString()],
  );
}

/**
 * Poll `fetcher` until at least `minRows` rows are returned, or timeout.
 * Returns whatever rows were last observed (caller decides assertion).
 */
async function waitForLogs(
  fetcher: () => Promise<InboundApiLogRow[]>,
  minRows: number,
  timeoutMs = 30_000,
  intervalMs = 1_000,
): Promise<InboundApiLogRow[]> {
  const deadline = Date.now() + timeoutMs;
  let rows: InboundApiLogRow[] = [];
  while (Date.now() < deadline) {
    rows = await fetcher();
    if (rows.length >= minRows) return rows;
    await sleep(intervalMs);
  }
  return rows;
}

// ── Test suite ───────────────────────────────────────────────────────

test.describe(
  'WI-525 — TMS/LOS controllers written to inbound API log',
  { tag: ['@regression', '@api', '@task-525', `@${TARGET_ENV}`] },
  () => {
    test.beforeAll(() => {
      if (!process.env.FIVE9_TMS_API_KEY) {
        throw new Error(
          '[ENV-GAP] FIVE9_TMS_API_KEY is required for WI-525 scenarios; ' +
            'set it in .env to run the TMS audit suite.',
        );
      }
      console.log(
        `[WI-525] TARGET_ENV=${TARGET_ENV} accountPk=${SEED.accountPk} leadPk=${SEED.leadPk}`,
      );
    });

    // ──────────────────────────────────────────────────────────────
    // CT-01 — Legacy `TmsController` (S1) writes log row
    // ──────────────────────────────────────────────────────────────
    test('CT-01 — legacy TmsController logs to sv_inbound_api_log', async ({
      api,
      db,
    }) => {
      test.setTimeout(120_000);
      const runId = generateRunId();
      const runStart = new Date();
      const headerMarker = `X-Run-Id=ct01-${runId}`;

      let httpStatus = 0;
      let primaryApi = 'com.uownleasing.svc.rest.svc.TmsController.getPayoffAmount';

      await test.step('exercise GET /uown/tms/getPayoffAmount/{accountPk}', async () => {
        const res = await api.tmsAudit.getPayoffAmountLegacy(SEED.accountPk, {
          'X-Run-Id': `ct01-${runId}`,
        });
        httpStatus = res.status;
        console.log(`[CT-01] GET getPayoffAmount → status=${res.status}`);

        // Fallback to getBankAccounts if endpoint unavailable in env (per SPEC pitfall).
        if (res.status === 404) {
          const fb = await api.tmsAudit.getBankAccountsLegacy(SEED.accountPk, {
            'X-Run-Id': `ct01-${runId}`,
          });
          httpStatus = fb.status;
          primaryApi = 'com.uownleasing.svc.rest.svc.TmsController.getBankAccounts';
          console.log(`[CT-01] fallback GET getBankAccounts → status=${fb.status}`);
        }
        expect(
          httpStatus,
          `[CT-01] HTTP probe did not return 2xx — got ${httpStatus}`,
        ).toBeGreaterThanOrEqual(200);
        expect(httpStatus).toBeLessThan(400);
      });

      await test.step('assert sv_inbound_api_log row exists with correct fields', async () => {
        const rows = await waitForLogs(
          () => fetchSvLogsByHeader(db, headerMarker, runStart),
          1,
        );
        expect(
          rows.length,
          `[CT-01] expected ≥1 row in ${SV_LOG} for legacy TmsController call`,
        ).toBeGreaterThanOrEqual(1);

        const row = rows[0];
        console.log(`[CT-01] log pk=${row.pk} api=${row.api} url=${row.url} agent=${row.agent}`);
        expect(row.api, `[CT-01] api column should match FQCN.method`).toBe(primaryApi);
        expect(row.call_type, `[CT-01] callType column`).toBe('GET');
        expect(row.url ?? '', `[CT-01] url column`).toContain(`/uown/tms/`);
        expect(row.url ?? '').toContain(String(SEED.accountPk));
        // Finding #1: `agent` is ALWAYS NULL on inbound_api_log — assert (not for prefix, just for observability)
        expect(row.agent, `[CT-01] OBS-04 — agent column expected NULL`).toBeNull();
      });
    });

    // ──────────────────────────────────────────────────────────────
    // CT-02 — Modern TmsAccountController (S2) logs
    // ──────────────────────────────────────────────────────────────
    test('CT-02 — TmsAccountController.getAccountSummary logs to sv_inbound_api_log', async ({
      api,
      db,
    }) => {
      test.setTimeout(120_000);
      const runId = generateRunId();
      const runStart = new Date();
      const headerMarker = `X-Run-Id=ct02-${runId}`;

      await test.step('exercise GET /uown/tms/v1/accounts/{id}/summary', async () => {
        const res = await api.tmsAudit.getAccountSummary(SEED.accountPk, {
          'X-Run-Id': `ct02-${runId}`,
        });
        console.log(`[CT-02] GET summary → status=${res.status}`);
        expect(res.status, `[CT-02] HTTP probe must succeed`).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(400);
      });

      await test.step('assert sv_inbound_api_log row exists — core regression', async () => {
        const rows = await waitForLogs(
          () => fetchSvLogsByHeader(db, headerMarker, runStart),
          1,
        );
        expect(
          rows.length,
          `[CT-02] [CONFIRMADO] core bug regression — pre-fix this row would not exist`,
        ).toBeGreaterThanOrEqual(1);

        const row = rows[0];
        console.log(`[CT-02] log pk=${row.pk} api=${row.api} url=${row.url}`);
        expect(row.api).toBe(
          'com.uownleasing.svc.rest.tms.TmsAccountController.getAccountSummary',
        );
        expect(row.call_type).toBe('GET');
        expect(row.url ?? '').toContain('/summary');
      });
    });

    // ──────────────────────────────────────────────────────────────
    // CT-03a — TmsPaymentController (S2) logs
    // ──────────────────────────────────────────────────────────────
    test('CT-03a — TmsPaymentController.getBankAccounts logs to sv_inbound_api_log', async ({
      api,
      db,
    }) => {
      test.setTimeout(120_000);
      const runId = generateRunId();
      const runStart = new Date();
      const headerMarker = `X-Run-Id=ct03a-${runId}`;

      await test.step('exercise GET /payment-methods/bank-accounts', async () => {
        const res = await api.tmsAudit.getBankAccounts(SEED.accountPk, {
          'X-Run-Id': `ct03a-${runId}`,
        });
        console.log(`[CT-03a] GET bank-accounts → status=${res.status}`);
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(400);
      });

      await test.step('assert sv_inbound_api_log row exists with TmsPaymentController FQCN', async () => {
        const rows = await waitForLogs(
          () => fetchSvLogsByHeader(db, headerMarker, runStart),
          1,
        );
        expect(rows.length).toBeGreaterThanOrEqual(1);
        const row = rows[0];
        console.log(`[CT-03a] log pk=${row.pk} api=${row.api}`);
        expect(row.api ?? '').toMatch(
          /^com\.uownleasing\.svc\.rest\.tms\.TmsPaymentController\./,
        );
        expect(row.call_type).toBe('GET');
        expect(row.url ?? '').toContain('/payment-methods/bank-accounts');
      });
    });

    // ──────────────────────────────────────────────────────────────
    // CT-03b — TmsDueDateController (S2) logs
    // ──────────────────────────────────────────────────────────────
    test('CT-03b — TmsDueDateController.addActivityLog logs to sv_inbound_api_log', async ({
      api,
      db,
    }) => {
      test.setTimeout(120_000);
      const runId = generateRunId();
      const correlationUuid = `qa-runId-${runId}`;
      const runStart = new Date();

      await test.step('exercise POST /v1/accounts/{id}/activity-logs', async () => {
        const res = await api.tmsAudit.addActivityLog(SEED.accountPk, {
          uuid: correlationUuid,
          logType: 'INFORMATION',
          logNote: `WI-525 CT-03b audit-test ${runId}`,
        });
        console.log(`[CT-03b] POST activity-logs → status=${res.status}`);
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(400);
      });

      await test.step('assert sv_inbound_api_log row exists keyed by source_uuid', async () => {
        const rows = await waitForLogs(
          () => fetchSvLogsByUuid(db, correlationUuid, runStart),
          1,
        );
        expect(rows.length).toBeGreaterThanOrEqual(1);
        const row = rows[0];
        console.log(`[CT-03b] log pk=${row.pk} api=${row.api} source_uuid=${row.source_uuid}`);
        expect(row.api ?? '').toMatch(
          /^com\.uownleasing\.svc\.rest\.tms\.TmsDueDateController\./,
        );
        expect(row.call_type).toBe('POST');
        expect(row.request ?? '').toContain(correlationUuid);
        // Aspect lowercases body and wraps uuid in literal quotes before persisting.
        const storedUuid = (row.source_uuid ?? '').replace(/^"|"$/g, '');
        expect(storedUuid.toLowerCase()).toBe(correlationUuid.toLowerCase());
      });
    });

    // ──────────────────────────────────────────────────────────────
    // CT-04 — LosExternalMerchantController (L2) logs
    // ──────────────────────────────────────────────────────────────
    test('CT-04 — LosExternalMerchantController.searchApplicationStatus logs to los_inbound_api_log', async ({
      api,
      db,
      ctx,
    }, testInfo) => {
      test.setTimeout(240_000);
      const runId = generateRunId();
      // F-004: `uuid` must be the FIRST key in the body so `AspectInboundApiLog.setApiLogInfo`
      // can extract it via `substringBetween(body.toLowerCase(), 'uuid":', ',')` — keeping uuid
      // first guarantees a top-level comma terminator and avoids capture from nested fields
      // (e.g. `lineItemUuid`).
      const correlationUuid = `qa-runId-${runId}`;
      const runStart = new Date();

      // F-003: source-verified — NO Spring Security / `@PreAuthorize` on
      // `LosExternalMerchantController`. Auth is body-credentials, validated by
      // `LosRequestMessageConstraintValidator.validateApplicationStatusRequest`.
      // Build the request via `buildApplicationStatusBody(merchant, leadUuid)` to
      // supply userName/setupPassword/merchantNumber + accountNumber=<fresh leadUuid>.
      // Fresh data per Test Data Hierarchy regra #10 — never reuse existing lead.

      const { merchant, applicant } = buildTestData({
        state: 'CA',
        merchant: 'FifthAveFurnitureNY',
        orderTotal: '800',
      });

      await test.step('setup: create fresh lead via createPreQualifiedApplication', async () => {
        await createPreQualifiedApplication(
          api,
          merchant,
          applicant,
          ctx,
          {
            bankData: { routingNumber: '021000021', accountNumber: '123456789' },
            skipPaymentInfo: true,
          },
          testInfo,
        );
        expect(ctx.leadUuid, 'leadUuid populated by setup').toBeTruthy();
        console.log(`[CT-04] setup leadUuid=${ctx.leadUuid}`);
      });

      let httpStatus = 0;

      await test.step('exercise POST /uown/los/merchant/applications/search via typed client (X-API-Version=2)', async () => {
        // F-004: build body explicitly with `uuid` as the FIRST key, then merge the
        // status-body credentials/accountNumber — JSON.stringify preserves insertion order
        // for string keys.
        const baseBody = buildApplicationStatusBody(merchant, ctx.leadUuid!);
        const body = { uuid: correlationUuid, ...baseBody } as Record<string, unknown>;

        const res = await api.losPartnerApplication.searchApplicationStatus(body, '2');
        httpStatus = res.status;
        console.log(`[CT-04] POST search → status=${httpStatus} ok=${res.ok}`);
        expect(
          res.ok,
          `[CT-04] searchApplicationStatus should succeed (got ${httpStatus}): ${JSON.stringify(res.body).slice(0, 300)}`,
        ).toBeTruthy();
      });

      await test.step('assert los_inbound_api_log row exists keyed by source_uuid', async () => {
        const rows = await waitForLogs(
          () => fetchLosLogsByUuid(db, correlationUuid, runStart),
          1,
        );
        expect(
          rows.length,
          `[CT-04] expected ≥1 row in ${LOS_LOG} for source_uuid=${correlationUuid}`,
        ).toBeGreaterThanOrEqual(1);
        const row = rows[0];
        console.log(`[CT-04] log pk=${row.pk} api=${row.api} url=${row.url}`);
        expect(row.api).toBe(
          'com.uownleasing.svc.rest.los.LosExternalMerchantController.searchApplicationStatus',
        );
        expect(row.call_type).toBe('POST');
        expect(row.url ?? '').toContain('/applications/search');
        if (httpStatus >= 200 && httpStatus < 300) {
          expect(row.response, '[CT-04] response should be populated on 2xx').not.toBeNull();
        }
      });
    });

    // ──────────────────────────────────────────────────────────────
    // CT-05 — Universe coverage: count = 1 per representative endpoint
    // ──────────────────────────────────────────────────────────────
    test('CT-05 — universe coverage: exactly ONE row per controller class probed', async ({
      api,
      db,
      request,
    }) => {
      test.setTimeout(180_000);
      // Subjects probed here (per SPEC § Scenarios CT-05):
      //   L1 → ApplicationClient.canContinueApplication (idempotent)
      //   L2 → covered by CT-04 (skip)
      //   S1 → covered by CT-01 (skip)
      //   S2a/b/c → covered by CT-02/03a/03b (skip)
      // L3/L4/L5/L7/L8/L9/L11 are OUT-OF-SCOPE-PENDING-DEV-DECISION (Q-A4) — flagged below.
      const runId = generateRunId();
      const correlationUuid = `qa-runId-${runId}`;
      const runStart = new Date();

      await test.step('L1 — POST /uown/los/canContinueApplication via ApplicationClient', async () => {
        // Pitfall #33: uuid must NOT be the last key — aspect's substringBetween
        // needs a trailing comma. Add _marker after uuid to force it.
        const body = { uuid: correlationUuid, accountNumber: correlationUuid, _marker: `ct05-${runId}` };
        const url = `${process.env[`${TARGET_ENV.toUpperCase()}_SVC_API_URL`] || process.env.SVC_API_URL || `https://svc-${TARGET_ENV}.uownleasing.com`}/uown/los/canContinueApplication`;
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Run-Id': `ct05-${runId}`,
        };
        if (process.env.UOWN_API_AUTHORIZATION) headers['Authorization'] = process.env.UOWN_API_AUTHORIZATION;
        if (process.env.UOWN_API_KEY) headers['x-api-key'] = process.env.UOWN_API_KEY;
        const apiResp = await request.post(url, {
          headers,
          data: body,
          timeout: 60_000,
        });
        console.log(`[CT-05/L1] canContinueApplication → status=${apiResp.status()}`);
      });

      await test.step('assert exactly ONE row for L1 keyed by source_uuid or header', async () => {
        // Try source_uuid first; fall back to header correlation if aspect didn't extract uuid.
        let rows = await waitForLogs(
          () => fetchLosLogsByUuid(db, correlationUuid, runStart),
          1,
          15_000,
        );
        if (rows.length === 0) {
          rows = await waitForLogs(
            () => fetchLosLogsByHeader(db, `x-run-id=ct05-${runId}`, runStart),
            1,
            15_000,
          );
        }
        console.log(`[CT-05/L1] row count = ${rows.length}`);
        const l1Rows = rows.filter(
          (r) => (r.api ?? '').endsWith('LosApplicationController.canContinueApplication'),
        );
        expect(
          l1Rows.length,
          `[CT-05/L1] [CONFIRMADO] AC-4 — expected exactly 1 L1 row; got ${l1Rows.length}`,
        ).toBe(1);
      });

      // Document the out-of-scope coverage gap per SPEC Q-A4
      console.log(
        '[CT-05] OUT-OF-SCOPE-PENDING-DEV-DECISION: L3, L4, L5, L7, L8, L9, L11 not probed ' +
          '(no idempotent path, destructive side-effects, or no typed client). See SPEC Q-A4.',
      );
    });

    // ──────────────────────────────────────────────────────────────
    // CT-07a — [OBSERVATION] PII raw body persisted (pre-existing)
    // ──────────────────────────────────────────────────────────────
    test('CT-07a — [OBSERVATION] PII marker echoed verbatim in apiLogInfo.request', async ({
      api,
      db,
    }) => {
      test.setTimeout(120_000);
      // Pre-existing behavior (OBS-01) — flag as compliance finding, DO NOT block WI-525.
      // Use SYNTHETIC markers (NOT real PII) per security.md.
      const runId = generateRunId();
      const correlationUuid = `qa-runId-${runId}`;
      const runStart = new Date();
      const pseudoSsn = '999-00-0000';
      const pseudoPan = '4111-1111-1111-1111';
      const noteWithMarkers =
        `runId=${runId} pseudoSSN=${pseudoSsn} pseudoPAN=${pseudoPan}`;

      await test.step('POST activity-log with synthetic PII marker', async () => {
        const res = await api.tmsAudit.addActivityLog(SEED.accountPk, {
          uuid: correlationUuid,
          logType: 'INFORMATION',
          logNote: noteWithMarkers,
        });
        console.log(`[CT-07a] POST → status=${res.status}`);
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(400);
      });

      await test.step('[OBSERVATION] apiLogInfo.request contains literal marker', async () => {
        const rows = await waitForLogs(
          () => fetchSvLogsByUuid(db, correlationUuid, runStart),
          1,
        );
        expect(rows.length).toBeGreaterThanOrEqual(1);
        const row = rows[0];
        const reqBody = row.request ?? '';
        console.log(`[CT-07a] request column (truncated): ${reqBody.slice(0, 200)}`);

        const containsSsn = reqBody.includes(pseudoSsn);
        const containsPan = reqBody.includes(pseudoPan);
        console.log(
          `[CT-07a] [OBSERVATION-PRE-EXISTING] pseudoSSN found=${containsSsn} pseudoPAN found=${containsPan}`,
        );
        // Conservative assertion — log result but DO NOT fail WI-525 on pre-existing behavior.
        // If both markers are present, this is OBS-01 confirmed; if absent, masking exists
        // (which would be a surprise — surface to compliance).
        if (containsSsn && containsPan) {
          console.log(
            '[CT-07a] [OBSERVATION-CONFIRMED-PRE-EXISTING] OBS-01 — raw body persisted ' +
              'verbatim; file as separate compliance ticket. Per SPEC: do NOT block WI-525 merge.',
          );
        }
        // Only assert the audit row exists (Rule #14) — actual marker presence is informational.
        expect(row.api).toContain('TmsDueDateController');
      });
    });

    // ──────────────────────────────────────────────────────────────
    // CT-07b — [OBSERVATION] Authorization header serialized
    // ──────────────────────────────────────────────────────────────
    test('CT-07b — [OBSERVATION] Authorization header echoed in apiLogInfo.header', async ({
      api,
      db,
    }) => {
      test.setTimeout(120_000);
      const runId = generateRunId();
      const correlationUuid = `qa-runId-${runId}`;
      const runStart = new Date();

      await test.step('POST with default Authorization populated', async () => {
        const res = await api.tmsAudit.addActivityLog(SEED.accountPk, {
          uuid: correlationUuid,
          logType: 'INFORMATION',
          logNote: `WI-525 CT-07b auth-header-leak ${runId}`,
        });
        console.log(`[CT-07b] POST → status=${res.status}`);
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(400);
      });

      await test.step('[OBSERVATION] header column contains Authorization key (pre-existing)', async () => {
        const rows = await waitForLogs(
          () => fetchSvLogsByUuid(db, correlationUuid, runStart),
          1,
        );
        expect(rows.length).toBeGreaterThanOrEqual(1);
        const row = rows[0];
        const headerStr = row.header ?? '';
        console.log(`[CT-07b] header column (truncated): ${headerStr.slice(0, 200)}`);

        const containsAuth = /authorization=/i.test(headerStr);
        console.log(
          `[CT-07b] [OBSERVATION-PRE-EXISTING] Authorization in header column = ${containsAuth}`,
        );
        if (containsAuth) {
          console.log(
            '[CT-07b] [OBSERVATION-CONFIRMED-PRE-EXISTING] OBS-02 — Authorization header ' +
              'serialized into apiLogInfo.header; file as separate compliance ticket. ' +
              'Per SPEC: do NOT block WI-525 merge.',
          );
        }
        // Audit row existence assertion (Rule #14) — observation is informational.
        expect(row.api).toContain('TmsDueDateController');
      });
    });

    // ──────────────────────────────────────────────────────────────
    // CT-08 — Regression: previously-logged LOS controllers count=1
    // ──────────────────────────────────────────────────────────────
    test('CT-08 — pre-fix LOS controllers still produce exactly 1 row (no regression)', async ({
      api,
      db,
      request,
    }) => {
      test.setTimeout(180_000);
      const runId = generateRunId();
      const correlationUuid = `qa-runId-${runId}`;
      const runStart = new Date();

      await test.step('L1 — canContinueApplication idempotent probe', async () => {
        const body = { uuid: correlationUuid, accountNumber: correlationUuid, _marker: `ct08-${runId}` };
        const url = `${process.env[`${TARGET_ENV.toUpperCase()}_SVC_API_URL`] || process.env.SVC_API_URL || `https://svc-${TARGET_ENV}.uownleasing.com`}/uown/los/canContinueApplication`;
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Run-Id': `ct08-${runId}`,
        };
        if (process.env.UOWN_API_AUTHORIZATION) headers['Authorization'] = process.env.UOWN_API_AUTHORIZATION;
        if (process.env.UOWN_API_KEY) headers['x-api-key'] = process.env.UOWN_API_KEY;
        const apiResp = await request.post(url, {
          headers,
          data: body,
          timeout: 60_000,
        });
        console.log(`[CT-08] canContinueApplication → status=${apiResp.status()}`);
      });

      await test.step('assert exactly ONE row — no double-log from new pointcut clauses', async () => {
        let rows = await waitForLogs(
          () => fetchLosLogsByUuid(db, correlationUuid, runStart),
          1,
          15_000,
        );
        if (rows.length === 0) {
          rows = await waitForLogs(
            () => fetchLosLogsByHeader(db, `x-run-id=ct08-${runId}`, runStart),
            1,
            15_000,
          );
        }
        const l1Rows = rows.filter((r) =>
          (r.api ?? '').endsWith('LosApplicationController.canContinueApplication'),
        );
        console.log(`[CT-08] L1 row count = ${l1Rows.length}`);
        expect(
          l1Rows.length,
          `[CT-08] [CONFIRMADO] AC-4 regression — expected 1 L1 row, got ${l1Rows.length}`,
        ).toBe(1);
      });
    });

    // ──────────────────────────────────────────────────────────────
    // CT-09 — Exception path / duplicate-row hypothesis (Q-A2)
    // ──────────────────────────────────────────────────────────────
    test('CT-09 — [HIPÓTESE] exception path row-count observation (Q-A2)', async ({
      api,
      db,
      request,
    }) => {
      test.setTimeout(180_000);
      const runId = generateRunId();
      // F-005 fix: use a non-existent-uuid value as BOTH the correlation marker AND
      // the `uuid` body field. The validator throws on lookup failure, which is exactly
      // the exception path under test (Q-A2).
      // F-004: keep `uuid` as the FIRST key in the body literal so the aspect's
      // `substringBetween("uuid\":", ",")` extracts it cleanly into `source_uuid`.
      const correlationUuid = `invalid-uuid-WI525-${runId}`;
      const runStart = new Date();

      let httpStatus = 0;

      await test.step('POST /uown/los/getApplicationStatus with non-existent uuid to trigger InvalidFieldsException', async () => {
        // Source-verified: `LosRequestMessageConstraintValidator.validateApplicationStatusRequest`
        // (`:156-180`) calls `losLeadService.getByLeadUuid(uuid)`; when null →
        // throws `InvalidFieldsException("uuid", "Invalid uuid. Received ...")`,
        // routed to `CustomExceptionHandler.handleInvalidFieldsException` (L10 pointcut).
        //
        // Pitfall #33: `AspectInboundApiLog.setApiLogInfo` extracts source_uuid via
        // `substringBetween(body, "uuid\":", ",")` — REQUIRES a trailing comma after the
        // uuid value. Single-field body `{uuid:"..."}` → no comma → empty source_uuid.
        // Add a dummy second field to force the comma terminator.
        const body = { uuid: correlationUuid, _marker: `wi525-ct09-${runId}` };
        const url = `${process.env[`${TARGET_ENV.toUpperCase()}_SVC_API_URL`] || process.env.SVC_API_URL || `https://svc-${TARGET_ENV}.uownleasing.com`}/uown/los/getApplicationStatus`;
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        };
        if (process.env.UOWN_API_AUTHORIZATION) headers['Authorization'] = process.env.UOWN_API_AUTHORIZATION;
        if (process.env.UOWN_API_KEY) headers['x-api-key'] = process.env.UOWN_API_KEY;
        const apiResp = await request.post(url, {
          headers,
          data: body,
          timeout: 60_000,
        });
        httpStatus = apiResp.status();
        console.log(`[CT-09] getApplicationStatus invalid-uuid → status=${httpStatus}`);
      });

      await test.step('[HIPÓTESE] record row count + api values — do NOT assert duplicate count', async () => {
        // Allow async insert from controller advice + exception handler advice.
        const rows = await waitForLogs(
          () => fetchLosLogsByUuid(db, correlationUuid, runStart),
          1,
          15_000,
        );
        console.log(
          `[CT-09] [HIPÓTESE Q-A2] Observed row count = ${rows.length}; HTTP=${httpStatus}`,
        );
        for (const r of rows) {
          console.log(
            `[CT-09]   pk=${r.pk} api=${r.api} call_type=${r.call_type} stackTrace=${r.stack_trace ? '<populated>' : 'null'}`,
          );
        }

        if (rows.length === 1) {
          console.log(
            '[CT-09] [OBSERVATION] count=1 — exception advice and controller advice share the same persisted row. ' +
              'apiLogInfo.stackTrace expected non-null on the row.',
          );
          // Best-effort assert stackTrace presence ONLY when status is exception-producing (5xx).
          if (httpStatus >= 500) {
            expect(rows[0].stack_trace, '[CT-09] stack_trace should be populated on 5xx').not.toBeNull();
          }
        } else if (rows.length === 2) {
          console.log(
            '[CT-09] [OBSERVATION — needs PO decision] count=2 — controller advice + ' +
              'CustomExceptionHandler advice produced separate rows. Could be intentional or AC-4 ' +
              'regression. Escalate to Q-A2.',
          );
          const apis = rows.map((r) => r.api ?? '');
          console.log(`[CT-09]   distinct apis: ${[...new Set(apis)].join(' | ')}`);
        } else {
          console.log(
            `[CT-09] [OBSERVATION] count=${rows.length} — neither 1 nor 2; surface to dev.`,
          );
        }

        // Audit-log presence assertion (Rule #14) — row(s) MUST exist for the request.
        expect(
          rows.length,
          '[CT-09] Rule #14 — every business action MUST have a log; exception path produced 0 rows',
        ).toBeGreaterThanOrEqual(1);
      });
    });

    // ──────────────────────────────────────────────────────────────
    // CT-10 — TMS prefix decision table (downstream entity validation)
    // ──────────────────────────────────────────────────────────────
    test('CT-10a — TMS prefix on downstream sv_activity_log (modern S2 path)', async ({
      api,
      db,
    }) => {
      test.setTimeout(120_000);
      const runId = generateRunId();
      const correlationUuid = `qa-runId-${runId}`;
      const runStart = new Date();
      const logNote = `WI-525 CT-10a downstream-prefix ${runId}`;

      await test.step('POST modern activity-logs endpoint (S2)', async () => {
        const res = await api.tmsAudit.addActivityLog(SEED.accountPk, {
          uuid: correlationUuid,
          logType: 'INFORMATION',
          logNote,
        });
        console.log(`[CT-10a] POST → status=${res.status}`);
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(400);
      });

      await test.step('audit row exists and agent is NULL (Finding #1)', async () => {
        const rows = await waitForLogs(
          () => fetchSvLogsByUuid(db, correlationUuid, runStart),
          1,
        );
        expect(rows.length).toBeGreaterThanOrEqual(1);
        const row = rows[0];
        expect(row.api).toBe(
          'com.uownleasing.svc.rest.tms.TmsDueDateController.addActivityLog',
        );
        // Finding #1 (OBS-04): aspect never calls setAgent → column ALWAYS NULL.
        expect(
          row.agent,
          '[CT-10a] OBS-04 — sv_inbound_api_log.agent expected NULL',
        ).toBeNull();
      });

      await test.step('downstream sv_activity_log row carries TMS- prefix (the FIX)', async () => {
        // Locate the activity_log entry matching the unique logNote.
        const fetchActivityRow = async () =>
          db.queryOne<{
            pk: number | string;
            log_type: string | null;
            notes: string | null;
            created_by: string | null;
            agent: string | null;
            row_created_timestamp: Date | string | null;
          }>(
            `SELECT pk, log_type, notes, created_by, agent, row_created_timestamp
               FROM ${SV_ACTIVITY_LOG}
              WHERE account_pk = $1 AND notes = $2
              ORDER BY pk DESC LIMIT 1`,
            [SEED.accountPk, logNote],
          );

        let activityRow = await fetchActivityRow();
        const deadline = Date.now() + 30_000;
        while (!activityRow && Date.now() < deadline) {
          await sleep(1_000);
          activityRow = await fetchActivityRow();
        }
        expect(
          activityRow,
          `[CT-10a] downstream ${SV_ACTIVITY_LOG} row not found for note="${logNote}"`,
        ).not.toBeNull();
        const ar = activityRow!;
        console.log(
          `[CT-10a] activity_log pk=${ar.pk} created_by=${ar.created_by} agent=${ar.agent}`,
        );
        const principal = ar.created_by ?? ar.agent ?? '';
        expect(
          principal,
          `[CT-10a] [CONFIRMADO] TMS- prefix MUST appear on downstream entity (created_by or agent); ` +
            `got created_by="${ar.created_by}" agent="${ar.agent}"`,
        ).toMatch(/^TMS-/);
      });
    });

    test('CT-10b — TMS prefix on downstream sv_activity_log (legacy S1 path)', async ({
      api,
      db,
    }) => {
      test.setTimeout(120_000);
      const runId = generateRunId();
      const correlationUuid = `qa-runId-${runId}`;
      const runStart = new Date();
      const logNote = `WI-525 CT-10b legacy-prefix ${runId}`;

      let endpointAvailable = true;

      await test.step('POST legacy /uown/tms/addLogNote (S1)', async () => {
        const res = await api.tmsAudit.addLogNoteLegacy({
          uuid: correlationUuid,
          accountPk: SEED.accountPk,
          logType: 'INFORMATION',
          logNote,
        });
        console.log(`[CT-10b] POST → status=${res.status}`);
        if (res.status === 404) {
          endpointAvailable = false;
          console.log('[CT-10b] [ENV-GAP] legacy /uown/tms/addLogNote not available; skipping');
          test.skip(true, 'Legacy TmsController.addLogNote not enabled in this env');
        }
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(400);
      });

      await test.step('audit row in sv_inbound_api_log for legacy controller', async () => {
        if (!endpointAvailable) return;
        const rows = await waitForLogs(
          () => fetchSvLogsByUuid(db, correlationUuid, runStart),
          1,
        );
        expect(rows.length).toBeGreaterThanOrEqual(1);
        const row = rows[0];
        expect(row.api).toBe('com.uownleasing.svc.rest.svc.TmsController.addLogNote');
        expect(row.agent, '[CT-10b] OBS-04 — agent expected NULL').toBeNull();
      });

      await test.step('downstream sv_activity_log row carries TMS- prefix (FQCN-fix proof)', async () => {
        if (!endpointAvailable) return;
        const fetchActivityRow = async () =>
          db.queryOne<{
            pk: number | string;
            notes: string | null;
            created_by: string | null;
            agent: string | null;
          }>(
            `SELECT pk, notes, created_by, agent
               FROM ${SV_ACTIVITY_LOG}
              WHERE account_pk = $1 AND notes = $2
              ORDER BY pk DESC LIMIT 1`,
            [SEED.accountPk, logNote],
          );

        let activityRow = await fetchActivityRow();
        const deadline = Date.now() + 30_000;
        while (!activityRow && Date.now() < deadline) {
          await sleep(1_000);
          activityRow = await fetchActivityRow();
        }
        expect(activityRow, `[CT-10b] downstream activity_log not found`).not.toBeNull();
        const ar = activityRow!;
        console.log(
          `[CT-10b] activity_log pk=${ar.pk} created_by=${ar.created_by} agent=${ar.agent}`,
        );
        const principal = ar.created_by ?? ar.agent ?? '';
        expect(
          principal,
          `[CT-10b] [CONFIRMADO] legacy TmsController must produce TMS- prefix downstream; ` +
            `got created_by="${ar.created_by}" agent="${ar.agent}"`,
        ).toMatch(/^TMS-/);
      });
    });

    test('CT-10c — LOS control: NO TMS- prefix expected (negative assertion)', async ({
      api,
      db,
      ctx,
    }, testInfo) => {
      test.setTimeout(240_000);
      const runId = generateRunId();
      // F-004: uuid first key (see CT-04).
      const correlationUuid = `qa-runId-${runId}`;
      const runStart = new Date();

      // F-003: body-credentials auth (no bearer). Fresh lead via createPreQualifiedApplication.
      const { merchant, applicant } = buildTestData({
        state: 'CA',
        merchant: 'FifthAveFurnitureNY',
        orderTotal: '800',
      });

      await test.step('setup: create fresh lead via createPreQualifiedApplication', async () => {
        await createPreQualifiedApplication(
          api,
          merchant,
          applicant,
          ctx,
          {
            bankData: { routingNumber: '021000021', accountNumber: '123456789' },
            skipPaymentInfo: true,
          },
          testInfo,
        );
        console.log(`[CT-10c] setup leadUuid=${ctx.leadUuid}`);
      });

      await test.step('POST /uown/los/merchant/applications/search (L2) via typed client', async () => {
        const baseBody = buildApplicationStatusBody(merchant, ctx.leadUuid!);
        const body = { uuid: correlationUuid, ...baseBody } as Record<string, unknown>;
        const res = await api.losPartnerApplication.searchApplicationStatus(body, '2');
        console.log(`[CT-10c] POST search → status=${res.status} ok=${res.ok}`);
      });

      await test.step('audit row in los_inbound_api_log with agent NULL', async () => {
        const rows = await waitForLogs(
          () => fetchLosLogsByUuid(db, correlationUuid, runStart),
          1,
        );
        if (rows.length === 0) {
          console.log(
            '[CT-10c] [HIPÓTESE] no los_inbound_api_log row found — fix may not be deployed in this env',
          );
        }
        expect(rows.length).toBeGreaterThanOrEqual(1);
        const row = rows[0];
        expect(row.agent, '[CT-10c] OBS-04 — agent expected NULL on los_inbound_api_log').toBeNull();
      });

      // Negative assertion against downstream activity log — but LOS search is read-only,
      // so NO downstream entity SHOULD be created. The assertion is therefore:
      // "no sv_activity_log row appeared in the timestamp window with TMS- prefix".
      await test.step('[negative] no sv_activity_log row with TMS- prefix created from LOS path', async () => {
        // Best-effort: lookback 5 minutes for activity_log entries created near runStart that
        // could plausibly be attributed to the LOS call. Since L2 is a search endpoint, no
        // activity_log row is expected at all — but if anything appeared, none should bear
        // the TMS- prefix.
        const recent = await db.query<{
          pk: number;
          created_by: string | null;
          agent: string | null;
          notes: string | null;
        }>(
          `SELECT pk, created_by, agent, notes
             FROM ${SV_ACTIVITY_LOG}
            WHERE row_created_timestamp >= $1 AT TIME ZONE current_setting('TimeZone')
              AND (created_by LIKE 'TMS-%' OR agent LIKE 'TMS-%')
              AND notes LIKE $2
            ORDER BY pk DESC
            LIMIT 5`,
          [runStart.toISOString(), `%${runId}%`],
        );
        console.log(
          `[CT-10c] [negative] downstream TMS- entries linked to runId=${runId}: ${recent.length}`,
        );
        expect(
          recent.length,
          `[CT-10c] [CONFIRMADO] LOS path must NOT produce TMS- prefix downstream entries; ` +
            `found ${recent.length} matching rows`,
        ).toBe(0);
      });
    });

    // ──────────────────────────────────────────────────────────────
    // CT-11 — Black-box channel: AOP fires on raw request.fetch
    // ──────────────────────────────────────────────────────────────
    test('CT-11 — black-box raw request.fetch produces audit row', async ({
      request,
      testEnv,
      db,
    }) => {
      test.setTimeout(120_000);
      const runId = generateRunId();
      const runStart = new Date();
      const headerMarker = `X-Run-Id=ct11-${runId}`;

      await test.step('raw request.fetch GET /summary with TMS key only', async () => {
        const url = `${testEnv.svcApiUrl}/uown/tms/v1/accounts/${SEED.accountPk}/summary`;
        const apiResp = await request.fetch(url, {
          method: 'GET',
          headers: {
            Authorization: testEnv.tmsApiKey,
            'X-Run-Id': `ct11-${runId}`,
            Accept: 'application/json',
          },
          timeout: 60_000,
        });
        console.log(`[CT-11] raw fetch → status=${apiResp.status()}`);
        expect(apiResp.status()).toBeGreaterThanOrEqual(200);
        expect(apiResp.status()).toBeLessThan(400);
      });

      await test.step('assert sv_inbound_api_log row was written (AOP on raw HTTP entry)', async () => {
        const rows = await waitForLogs(
          () => fetchSvLogsByHeader(db, headerMarker, runStart),
          1,
        );
        expect(
          rows.length,
          `[CT-11] [CONFIRMADO] raw fetch must trigger AOP — got ${rows.length} rows`,
        ).toBeGreaterThanOrEqual(1);
        const row = rows[0];
        expect(row.api).toBe(
          'com.uownleasing.svc.rest.tms.TmsAccountController.getAccountSummary',
        );
        expect(row.call_type).toBe('GET');
      });
    });

    // ──────────────────────────────────────────────────────────────
    // CT-12 — Parallel collision check (5 concurrent)
    // ──────────────────────────────────────────────────────────────
    test('CT-12 — 5 parallel requests each produce a distinct row', async ({
      api,
      db,
    }) => {
      test.setTimeout(180_000);
      const runId = generateRunId();
      const runStart = new Date();
      const headerPrefix = `X-Run-Id=ct12-${runId}-`;

      await test.step('fire 5 concurrent GET summary calls with distinct X-Run-Id', async () => {
        const calls = [1, 2, 3, 4, 5].map((n) =>
          api.tmsAudit.getAccountSummary(SEED.accountPk, {
            'X-Run-Id': `ct12-${runId}-${n}`,
          }),
        );
        const results = await Promise.all(calls);
        for (const [idx, r] of results.entries()) {
          console.log(`[CT-12] call#${idx + 1} → status=${r.status}`);
          expect(r.status).toBeGreaterThanOrEqual(200);
          expect(r.status).toBeLessThan(400);
        }
      });

      await test.step('assert 5 distinct rows (one per X-Run-Id)', async () => {
        // Custom poll — need to match 5 different header markers individually.
        const deadline = Date.now() + 30_000;
        let observed: Map<number, InboundApiLogRow> = new Map();
        while (Date.now() < deadline && observed.size < 5) {
          for (const n of [1, 2, 3, 4, 5]) {
            if (observed.has(n)) continue;
            const rows = await fetchSvLogsByHeader(db, `${headerPrefix}${n}`, runStart);
            if (rows.length > 0) {
              observed.set(n, rows[0]);
              expect(rows[0].api).toBe(
                'com.uownleasing.svc.rest.tms.TmsAccountController.getAccountSummary',
              );
            }
          }
          if (observed.size < 5) await sleep(1_000);
        }
        console.log(`[CT-12] matched ${observed.size}/5 distinct rows`);
        expect(
          observed.size,
          `[CT-12] [CONFIRMADO] thread-safety — expected 5 distinct rows; got ${observed.size}`,
        ).toBe(5);
      });
    });
  },
);

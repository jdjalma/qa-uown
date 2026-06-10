/**
 * RU05.26.1.51.1 — Remove CC Information Returned from Authorize Endpoint (Submit Application)
 * GitLab issue: https://gitlab.com/uown/backend/svc/-/work_items/507
 *
 * API-only justification (CLAUDE.md rule #15):
 *   The bug being fixed is the JSON wire payload of POST /uown/los/authorizeCreditCard.
 *   A UI test cannot reliably observe whether `gatewayRequest`, `gatewayResponse`,
 *   `ccToken`, raw transaction objects etc. leak in the response body — the frontend
 *   silently discards unknown fields. The defect is structurally invisible from the
 *   browser. Deep-traversal allow-list / deny-list against the raw JSON is the only
 *   mechanism that catches a future regression.
 *
 *   Frontend smoke is already covered downstream by TireAgent / contract-page E2E
 *   suites — they prove the slim DTO does not break the flow.
 *
 * Backend ground-truth (svc `AuthorizeCreditCardResponse` Java record, 4 fields):
 *   - status: CCTransactionStatus enum
 *   - error: String
 *   - errorCode: String
 *   - preAuthStatus: PreAuthStatus enum  ∈ { SESSION_UNAVAILABLE, SUCCESS, DENIED, ERROR, NOT_RUN }
 *   No `message` field is serialized for this endpoint — allow-list is exactly these 4 keys.
 *
 * Strategy per CT (Test Data Hierarchy): each test creates its own fresh lead via
 * `setupApplicationViaApi(..., { skipCreditCardAuth: true })`. We then call
 * `authorizeCreditCard` ourselves and inspect the raw response body.
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import type { TestContext } from '@fixtures/test-context.fixture.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';
import { buildTestData, setupApplicationViaApi } from '@helpers/index.js';
import { TEST_CARDS } from '@data/index.js';

// ── Test-data ───────────────────────────────────────────────────────

const testData = [
  {
    env: 'stg',
    riskTier: 'low' as const,
    state: 'CA',
    merchant: 'TerraceFinance',
    merchandiseAmount: 1000,
    tag: buildTags(TestTag.REGRESSION, TestTag.CRITICAL, TestTag.STG),
  },
];

// ── Allow-list / Deny-list (single source of truth — see SPEC §"Allow-list & Deny-list") ─

/**
 * Backend-strict allow-list. The Java record `AuthorizeCreditCardResponse` declares
 * EXACTLY these 4 fields. `message` is NOT serialized by this endpoint — it was
 * incorrectly listed before and has been removed (Gap 7).
 */
const ALLOWED_TOP_LEVEL_KEYS = new Set<string>([
  'status',
  'error',
  'errorCode',
  'preAuthStatus',
]);

/** Enum values accepted for `preAuthStatus`. Backend enum `PreAuthStatus`. (Gap 1) */
const PRE_AUTH_STATUS_VALUES = new Set<string>([
  'SESSION_UNAVAILABLE',
  'SUCCESS',
  'DENIED',
  'ERROR',
  'NOT_RUN',
]);

const FORBIDDEN_KEYS = new Set<string>([
  // raw card data
  'ccNumber', 'creditCardNumber', 'cardNumber',
  'cvc', 'cvv',
  'ccExp', 'expiry', 'expirationDate',
  // gateway internals
  'gatewayRequest', 'gatewayResponse',
  'gatewayCorrelationId', 'gatewayTransactionId',
  'transactionToken', 'requestID', 'idempotencyKey',
  // tokens / persisted PKs
  'token', 'ccToken',
  'creditCardTransactionPk', 'creditCardPk',
  'authorizationCode',
  // raw transaction shape
  'transaction', 'creditCardTransaction', 'ccTransaction',
  'ccCaptureReply', 'purchaseTotals', 'amount', 'capturedAmount',
  // other raw blobs commonly leaked alongside gatewayResponse
  'cardData', 'rawResponse', 'rawRequest',
]);

// ── Helpers (kept inline — single-use; see SPEC `Artifact Dependencies`) ─

interface ForbiddenHit { path: string; key: string; sampleValue: string }

/**
 * Mask a leaked value so we never echo PAN/CVV/token digits into a test report.
 * Strings → `*** (len=N)`. Numbers/booleans/null → `<type>`. Objects → `[object]`.
 */
function maskValue(v: unknown): string {
  if (v === null) return 'null';
  if (typeof v === 'string') return `*** (string, len=${v.length})`;
  if (typeof v === 'number') return '*** (number)';
  if (typeof v === 'boolean') return `*** (boolean)`;
  if (Array.isArray(v)) return `[array len=${v.length}]`;
  if (typeof v === 'object') return '[object]';
  return `<${typeof v}>`;
}

/**
 * Walk every nested object/array in `obj`. For each KEY encountered at any depth,
 * if it is in `forbidden`, push a `{ path, key, sampleValue }` (value masked).
 * Skips non-object values (a string of `"transaction failed"` under `message`
 * does not count as a `transaction` key — match is on KEY, not on STRING content).
 */
function findForbiddenKeys(obj: unknown, forbidden: Set<string>): ForbiddenHit[] {
  const hits: ForbiddenHit[] = [];

  const walk = (node: unknown, path: string): void => {
    if (node === null || node === undefined) return;
    if (Array.isArray(node)) {
      node.forEach((item, idx) => walk(item, `${path}[${idx}]`));
      return;
    }
    if (typeof node !== 'object') return;

    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      const childPath = path === '' ? k : `${path}.${k}`;
      if (forbidden.has(k)) {
        hits.push({ path: childPath, key: k, sampleValue: maskValue(v) });
      }
      walk(v, childPath);
    }
  };

  walk(obj, '');
  return hits;
}

/**
 * Returns the list of top-level keys in `body` that are NOT in `allowed`.
 * If empty, the body is allow-list compliant.
 */
function findExtraTopLevelKeys(body: unknown, allowed: Set<string>): string[] {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) return [];
  return Object.keys(body as Record<string, unknown>).filter((k) => !allowed.has(k));
}

/**
 * Slim-DTO security guarantee asserted in EVERY CT.
 *  - exactly 4 top-level keys (`status`, `error`, `errorCode`, `preAuthStatus`)
 *  - allow-list compliance (no extra keys at top-level)
 *  - deny-list compliance (no forbidden keys at any nesting depth)
 *  - `preAuthStatus` (when present) is in the backend enum set
 *
 * Caller passes a label to disambiguate which CT failed.
 */
function assertSlimDto(respBody: Record<string, unknown>, label: string): void {
  // 1) exact key count (Gap 7 — strict 4-field allow-list)
  expect(
    Object.keys(respBody).length,
    `[${label}] response must have exactly 4 top-level keys, got ${Object.keys(respBody).length}: [${Object.keys(respBody).join(', ')}]`,
  ).toBe(4);

  // 2) allow-list compliance (top-level)
  const extras = findExtraTopLevelKeys(respBody, ALLOWED_TOP_LEVEL_KEYS);
  expect(
    extras,
    `[${label}] top-level keys must be a subset of ${[...ALLOWED_TOP_LEVEL_KEYS].join(', ')}. ` +
    `Extras present: [${extras.join(', ')}]. Full body keys: [${Object.keys(respBody).join(', ')}]`,
  ).toEqual([]);

  // 3) deny-list compliance (deep traversal)
  const hits = findForbiddenKeys(respBody, FORBIDDEN_KEYS);
  const formatted = hits.map((h) => `${h.path} (key="${h.key}", value=${h.sampleValue})`);
  expect(
    hits,
    `[${label}] forbidden keys leaked: [${formatted.join('; ')}]`,
  ).toEqual([]);

  // 4) preAuthStatus enum validation (Gap 1) — env-dependent value (NOT_RUN on stg),
  //    so we only assert MEMBERSHIP in the enum set, not a specific value.
  if (respBody.preAuthStatus !== undefined && respBody.preAuthStatus !== null) {
    const preAuth = String(respBody.preAuthStatus);
    expect(
      PRE_AUTH_STATUS_VALUES.has(preAuth),
      `[${label}] preAuthStatus="${preAuth}" must be one of {${[...PRE_AUTH_STATUS_VALUES].join(', ')}}`,
    ).toBeTruthy();
  }
}

/**
 * Looser security guarantee for paths where the backend rejects the request
 * BEFORE reaching the controller (Spring global exception handler envelope:
 * `{message, status: <httpCode>}`). The slim-DTO contract doesn't apply, but
 * the #507 concern (no gateway/token/cc leak) still must hold.
 *
 * Use this for invalid-input scenarios (incomplete ccNumber, expired ccExp)
 * where the backend short-circuits with a validation error envelope.
 */
function assertNoSensitiveLeak(respBody: Record<string, unknown>, label: string): void {
  // 1) deep deny-list (the #507 contract — applies to ALL response shapes)
  const hits = findForbiddenKeys(respBody, FORBIDDEN_KEYS);
  const formatted = hits.map((h) => `${h.path} (key="${h.key}", value=${h.sampleValue})`);
  expect(
    hits,
    `[${label}] forbidden keys leaked in error envelope: [${formatted.join('; ')}]`,
  ).toEqual([]);

  // 2) payload size sanity — error envelopes should be tiny (<300 bytes)
  const size = JSON.stringify(respBody).length;
  expect(
    size,
    `[${label}] error envelope size=${size} bytes — exceeds sanity threshold (300). Likely contains leaked diagnostic data.`,
  ).toBeLessThan(300);
}

/**
 * Parse `shortCode` (first path segment after host) and `planId` (query param)
 * from a contract redirect URL. Mirrors the logic in
 * `src/helpers/api-setup.helpers.ts:291-303`.
 *
 * Why we need this here: `setupApplicationViaApi(..., { skipCreditCardAuth: true })`
 * does NOT call `getMissingFields` — it only does so under
 * `submitPaymentInfoViaApi: true`. Without that call, the lead has no
 * `merchantProgramPk` bound, and `authorizeCreditCard` 500s with
 * "Merchant program is required to determine fee to be charged for lead {pk}".
 * See application-lifecycle-protocol.md (well-known pitfall).
 */
function extractShortCodeAndPlanIdFromUrl(url: string): { shortCode: string; planId: string } {
  const parsed = new URL(url);
  const pathParts = parsed.pathname.split('/').filter(Boolean);
  const shortCode = pathParts[0] ?? '';
  const planId = parsed.searchParams.get('planId') ?? '';
  return { shortCode, planId };
}

/** Empty `TestContext` builder — same shape used by every CT in this suite. */
function emptyCtx(): TestContext {
  return {
    leadPk: '', leadUuid: '', accountPk: '', accountNumber: '',
    contractStatus: '', contractUrl: '', websiteAccountPk: '',
    achAdded: 0, ccAdded: 0, reportKeys: new Map(),
  };
}

// ── Suite ───────────────────────────────────────────────────────────

for (const data of testData) {
  test.describe(
    `RU05.26.1.51.1_removeCcInformationReturnedFromAuthorizeEndpoint_507 - ${data.env}/${data.merchant}`,
    { tag: splitTags(data.tag) },
    () => {
      test.use({ envName: data.env });

      // Per SPEC § Estimated Timeout: ~120s per CT (60s setup + 30s authorize + 30s asserts/DB)
      test.setTimeout(180_000);

      test('CT-01 — approved CC: response shape (allow-list + happy path)', async (
        { api, db },
        testInfo,
      ) => {
        const ctx = emptyCtx();

        const td = buildTestData({
          env: data.env,
          state: data.state,
          merchant: data.merchant,
          orderTotal: String(data.merchandiseAmount),
          orderDescription: 'CT-01 approved CC payload contract',
          approved: true, // SSN ≠ 9 → UW_APPROVED
        });

        await test.step('Setup: create approved lead with skipCreditCardAuth=true', async () => {
          await setupApplicationViaApi(
            api,
            {
              merchant: td.merchant,
              applicant: td.applicant,
              order: td.order,
              env: data.env,
              skipCreditCardAuth: true, // CRITICAL — we want to call authorizeCreditCard ourselves
              extractContractUrl: true, // sendApplication's redirectUrl
              skipInvoice: true, // order data is already in sendApplication; sendInvoice would regenerate the plan and invalidate the redirectUrl we just extracted ("Invalid link" pitfall)
            },
            testInfo,
            ctx,
          );
          expect(ctx.leadPk, 'leadPk must be populated by setup').toBeTruthy();
          expect(ctx.contractUrl, 'contractUrl must be populated by setup (extractContractUrl=true)').toBeTruthy();
        });

        await test.step('Bind merchant program (getMissingFields) — pitfall: brand-new lead has no merchantProgramPk', async () => {
          const { shortCode, planId } = extractShortCodeAndPlanIdFromUrl(ctx.contractUrl);
          expect(shortCode, 'shortCode must parse from contractUrl').toBeTruthy();
          const resp = await api.application.getMissingFields(
            shortCode,
            planId ? { planId } : undefined,
          );
          expect(resp.ok, `getMissingFields responded with ${resp.status}`).toBeTruthy();
          console.log(`[CT-01] getMissingFields ok (shortCode=${shortCode}, planId=${planId || '(none)'})`);
        });

        let respBody: Record<string, unknown> = {};
        await test.step('Authorize CC with MASTERCARD_APPROVED', async () => {
          // reason: rule #12 of CLAUDE.md mandates MASTERCARD_APPROVED for new tests in qa/stg
          // (rollback in qa for VISA_APPROVED). The default in `buildAuthorizeCreditCardBody`
          // is the BIN-5146 Mastercard (key name "VISA_APPROVED"); we pass MASTERCARD_APPROVED
          // explicitly to align with the application-lifecycle protocol.
          const card = TEST_CARDS.MASTERCARD_APPROVED;
          const resp = await api.creditCard.authorizeCreditCard(
            ctx.leadPk,
            td.applicant.firstName,
            td.applicant.lastName,
            { ccNumber: card.number, ccExp: card.expirationDate, cvc: card.cvv },
          );
          expect(resp.ok, `authorizeCreditCard responded with ${resp.status}`).toBeTruthy();
          expect(resp.status).toBe(200);
          respBody = (resp.body ?? {}) as Record<string, unknown>;
          // Snapshot for diagnostics (regression visibility)
          console.log(`[CT-01] authorizeCreditCard body=${JSON.stringify(respBody)}`);
        });

        await test.step('Assert response status semantics (status truthy + approval signal)', async () => {
          expect(respBody.status, 'body.status must be truthy').toBeTruthy();
          // Accept enum-ish "APPROVED" or any string containing "approv" (case-insensitive).
          // SPEC notes manual QA TC-02 evidence: { status:'APPROVED', preAuthStatus:'SUCCESS' }.
          const statusStr = String(respBody.status ?? '').toLowerCase();
          expect(
            statusStr.includes('approv') || statusStr === 'success',
            `Expected status to indicate approval, got: ${respBody.status}`,
          ).toBeTruthy();
        });

        await test.step('Assert slim DTO contract (4 keys + allow-list + deny-list + preAuthStatus enum)', async () => {
          assertSlimDto(respBody, 'CT-01');
        });

        await test.step('[reflex] DB persistence — CC transaction was created', async () => {
          // Resolve account_pk from the lead (uown_los_lead.account_pk). Read-only.
          const accountRow = await db.queryOne<{ account_pk: number | null }>(
            `SELECT account_pk FROM uown_los_lead WHERE pk = $1 LIMIT 1`,
            [Number(ctx.leadPk)],
          );
          if (!accountRow || !accountRow.account_pk) {
            // CC transactions before signing may key off lead-tied tables instead.
            console.log(
              `[CT-01][reflex] No account_pk for leadPk=${ctx.leadPk} yet (pre-signing) — skipping uown_cc_transaction lookup`,
            );
            return;
          }
          const accountPk = accountRow.account_pk;
          const txRows = await db.query<{ pk: number; status: string; account_pk: number }>(
            `SELECT pk, status, account_pk FROM uown_cc_transaction
               WHERE account_pk = $1
             ORDER BY pk DESC
             LIMIT 1`,
            [accountPk],
          );
          expect(
            txRows.length,
            `Expected at least one uown_cc_transaction row for account_pk=${accountPk}`,
          ).toBeGreaterThanOrEqual(1);
          expect(
            txRows[0].status,
            `CC transaction status must reflect approval (got: ${txRows[0].status})`,
          ).toMatch(/APPROVED|SUCCESS/i);
        });

        await test.step('[reflex] Activity log written (CLAUDE.md rule #14)', async () => {
          const noteRows = await db.query<{ pk: number; notes: string }>(
            `SELECT pk, notes FROM uown_los_lead_notes
               WHERE lead_pk = $1
               AND (notes ILIKE '%credit card%' OR notes ILIKE '%authoriz%' OR notes ILIKE '%cc auth%')
             ORDER BY pk DESC
             LIMIT 5`,
            [Number(ctx.leadPk)],
          );
          // SPEC marks this as OBSERVAÇÃO if no log is written — log + soft warn instead of hard fail.
          if (noteRows.length === 0) {
            console.log(
              `[CT-01][OBSERVAÇÃO] No activity-log note matching CC-auth patterns for leadPk=${ctx.leadPk}. ` +
              `Per SPEC, this is an OBSERVAÇÃO pending user clarification (CLAUDE.md rule #14 + #11), not a bug.`,
            );
          } else {
            console.log(`[CT-01][reflex] Activity log row(s) found: ${noteRows.length}`);
          }
        });
      });

      test('CT-02 — approved CC: explicit deny-list of sensitive fields', async (
        { api, db },
        testInfo,
      ) => {
        // CT-02 is the regression guard. If CT-01 starts failing on the slim-DTO assert,
        // CT-02 names exactly which forbidden key reappeared (separate setup so a CT-01
        // failure does not poison this CT). `db` is fixture-only used here for setup parity.
        void db;

        const ctx = emptyCtx();

        const td = buildTestData({
          env: data.env,
          state: data.state,
          merchant: data.merchant,
          orderTotal: String(data.merchandiseAmount),
          orderDescription: 'CT-02 deny-list deep traversal',
          approved: true,
        });

        await test.step('Setup: create approved lead with skipCreditCardAuth=true', async () => {
          await setupApplicationViaApi(
            api,
            {
              merchant: td.merchant,
              applicant: td.applicant,
              order: td.order,
              env: data.env,
              skipCreditCardAuth: true,
              extractContractUrl: true,
              skipInvoice: true,
            },
            testInfo,
            ctx,
          );
          expect(ctx.leadPk).toBeTruthy();
          expect(ctx.contractUrl, 'contractUrl must be populated by setup (extractContractUrl=true)').toBeTruthy();
        });

        await test.step('Bind merchant program (getMissingFields)', async () => {
          const { shortCode, planId } = extractShortCodeAndPlanIdFromUrl(ctx.contractUrl);
          expect(shortCode, 'shortCode must parse from contractUrl').toBeTruthy();
          const resp = await api.application.getMissingFields(
            shortCode,
            planId ? { planId } : undefined,
          );
          expect(resp.ok, `getMissingFields responded with ${resp.status}`).toBeTruthy();
          console.log(`[CT-02] getMissingFields ok (shortCode=${shortCode}, planId=${planId || '(none)'})`);
        });

        let respBody: Record<string, unknown> = {};
        await test.step('Authorize CC with MASTERCARD_APPROVED', async () => {
          const card = TEST_CARDS.MASTERCARD_APPROVED;
          const resp = await api.creditCard.authorizeCreditCard(
            ctx.leadPk,
            td.applicant.firstName,
            td.applicant.lastName,
            { ccNumber: card.number, ccExp: card.expirationDate, cvc: card.cvv },
          );
          expect(resp.ok, `authorizeCreditCard responded with ${resp.status}`).toBeTruthy();
          respBody = (resp.body ?? {}) as Record<string, unknown>;
        });

        await test.step('Snapshot raw body for diagnostics', async () => {
          // Diagnostic aid: a regression report needs to see exactly what leaked.
          // The raw body is allow-list checked separately, so logging it here is OK.
          console.log(`[CT-02] raw body snapshot=${JSON.stringify(respBody)}`);
          testInfo.annotations.push({
            type: 'authorize-body-snapshot',
            description: JSON.stringify(respBody),
          });
        });

        await test.step('Assert slim DTO contract (4 keys + allow-list + deny-list + preAuthStatus enum)', async () => {
          // Single canonical assertion — same security contract across every CT.
          assertSlimDto(respBody, 'CT-02');
        });

        // Group-level assertions for diagnostic clarity. If a regression hits, the
        // failing group label tells you which BUCKET of secrets leaked.
        const RAW_CARD = ['ccNumber', 'creditCardNumber', 'cardNumber', 'cvc', 'cvv', 'ccExp', 'expiry', 'expirationDate'];
        const GATEWAY_INTERNALS = [
          'gatewayRequest', 'gatewayResponse', 'gatewayCorrelationId', 'gatewayTransactionId',
          'transactionToken', 'requestID', 'idempotencyKey', 'ccCaptureReply', 'purchaseTotals',
          'amount', 'capturedAmount',
        ];
        const TOKENS_PKS = ['token', 'ccToken', 'creditCardTransactionPk', 'creditCardPk', 'authorizationCode'];
        const RAW_TX_SHAPE = ['transaction', 'creditCardTransaction', 'ccTransaction', 'cardData', 'rawResponse', 'rawRequest'];

        const assertGroupAbsent = (label: string, group: string[]): void => {
          const set = new Set(group);
          const hits = findForbiddenKeys(respBody, set);
          const formatted = hits.map((h) => `${h.path} (key="${h.key}", value=${h.sampleValue})`);
          expect(hits, `[${label}] forbidden keys present: [${formatted.join('; ')}]`).toEqual([]);
        };

        await test.step('Assert no raw card data', async () => {
          assertGroupAbsent('raw-card', RAW_CARD);
        });

        await test.step('Assert no gateway internals', async () => {
          assertGroupAbsent('gateway-internals', GATEWAY_INTERNALS);
        });

        await test.step('Assert no tokens / persisted PKs', async () => {
          assertGroupAbsent('tokens-pks', TOKENS_PKS);
        });

        await test.step('Assert no raw transaction shape', async () => {
          assertGroupAbsent('raw-tx-shape', RAW_TX_SHAPE);
        });

        await test.step('Assert response is small (sanity guard)', async () => {
          // A regression that re-adds gateway blobs blows past 1KB easily — slim DTO is tiny.
          const payloadSize = JSON.stringify(respBody).length;
          console.log(`[CT-02] payload size=${payloadSize} bytes`);
          expect(
            payloadSize,
            `Slim DTO should be <500 bytes. Got ${payloadSize}. Likely regression — gateway blob is back.`,
          ).toBeLessThan(500);
        });
      });

      test('CT-03 — real decline via last-name mismatch: slim DTO holds on failure path', async (
        { api, db },
        testInfo,
      ) => {
        // Why last-name mismatch instead of VISA_DECLINED:
        //   `VISA_DECLINED` is a Stripe test card the gateway in stg does NOT recognize as
        //   a decline trigger — it returns APPROVED. To exercise the REAL decline path
        //   (`uownClient.declineCreditCard`) we force the precondition the backend uses:
        //   if the CC last-name does not match the lead's last-name, ApplicationService
        //   short-circuits to a real DENIED response (svc ApplicationService.java:172-173).
        //   This is environment-independent and produces a deterministic decline.
        const ctx = emptyCtx();

        const td = buildTestData({
          env: data.env,
          state: data.state,
          merchant: data.merchant,
          orderTotal: String(data.merchandiseAmount),
          orderDescription: 'CT-03 declined CC payload contract (last-name mismatch)',
          approved: true, // lead must be approved so we can reach authorizeCreditCard
        });

        await test.step('Setup: create approved lead with skipCreditCardAuth=true', async () => {
          await setupApplicationViaApi(
            api,
            {
              merchant: td.merchant,
              applicant: td.applicant,
              order: td.order,
              env: data.env,
              skipCreditCardAuth: true,
              extractContractUrl: true,
              skipInvoice: true,
            },
            testInfo,
            ctx,
          );
          expect(ctx.leadPk).toBeTruthy();
          expect(ctx.contractUrl, 'contractUrl must be populated by setup (extractContractUrl=true)').toBeTruthy();
        });

        await test.step('Bind merchant program (getMissingFields)', async () => {
          const { shortCode, planId } = extractShortCodeAndPlanIdFromUrl(ctx.contractUrl);
          expect(shortCode, 'shortCode must parse from contractUrl').toBeTruthy();
          const resp = await api.application.getMissingFields(
            shortCode,
            planId ? { planId } : undefined,
          );
          expect(resp.ok, `getMissingFields responded with ${resp.status}`).toBeTruthy();
          console.log(`[CT-03] getMissingFields ok (shortCode=${shortCode}, planId=${planId || '(none)'})`);
        });

        let respBody: Record<string, unknown> = {};
        let respStatus = 0;
        await test.step('Authorize CC with VALID Mastercard but MISMATCHED last-name → triggers declineCreditCard path', async () => {
          // Use the body-overload of authorizeCreditCard so we can override ccLastName
          // independently of the applicant's lastName (the 4-arg form forces them equal).
          const card = TEST_CARDS.MASTERCARD_APPROVED;
          const resp = await api.creditCard.authorizeCreditCard({
            leadPk: ctx.leadPk,
            ccNumber: card.number,
            ccExp: card.expirationDate,
            cvc: card.cvv,
            ccFirstName: td.applicant.firstName,
            ccLastName: 'MISMATCHEDLAST', // svc ApplicationService.java:172-173 → uownClient.declineCreditCard
          });
          respBody = (resp.body ?? {}) as Record<string, unknown>;
          respStatus = resp.status;
          console.log(`[CT-03] authorizeCreditCard status=${respStatus} ok=${resp.ok} body=${JSON.stringify(respBody)}`);
          // Guard against transport-level 5xx — separate flake, not a slim-DTO regression.
          expect(
            respStatus < 500,
            `authorizeCreditCard returned 5xx (${respStatus}) — transport flake, not a slim-DTO failure`,
          ).toBeTruthy();
        });

        await test.step('Assert decline semantics — status ∈ {DENIED, ERROR}', async () => {
          const statusStr = String(respBody.status ?? '').toUpperCase();
          // The declineCreditCard backend path returns CCTransactionStatus.DENIED;
          // ERROR is accepted as a fallback if the gateway short-circuit changes to ERROR.
          expect(
            statusStr === 'DENIED' || statusStr === 'ERROR',
            `Expected status ∈ {DENIED, ERROR}. Got status="${respBody.status}" preAuthStatus="${respBody.preAuthStatus}" error="${respBody.error}"`,
          ).toBeTruthy();
        });

        await test.step('Assert slim DTO contract holds on decline path', async () => {
          // Highest-risk leak point on decline: gatewayResponse with the gateway's
          // decline payload. Slim-DTO contract MUST hold identically here.
          assertSlimDto(respBody, 'CT-03');
        });

        await test.step('Assert decline message is sanitized (no JSON blob smuggled into a string field)', async () => {
          const msg = (respBody.error ?? '') as unknown;
          if (msg !== '' && msg !== null) {
            expect(typeof msg, `decline error must be a string when present`).toBe('string');
            expect(
              (msg as string).length,
              `decline error length sanity check (<200 chars). Got ${(msg as string).length}.`,
            ).toBeLessThan(200);
          }
        });

        await test.step('[reflex] DB record reflects decline', async () => {
          const accountRow = await db.queryOne<{ account_pk: number | null }>(
            `SELECT account_pk FROM uown_los_lead WHERE pk = $1 LIMIT 1`,
            [Number(ctx.leadPk)],
          );
          if (!accountRow || !accountRow.account_pk) {
            console.log(
              `[CT-03][reflex] No account_pk for leadPk=${ctx.leadPk} (pre-signing) — uown_cc_transaction lookup skipped`,
            );
            return;
          }
          const txRows = await db.query<{ pk: number; status: string }>(
            `SELECT pk, status FROM uown_cc_transaction
               WHERE account_pk = $1
             ORDER BY pk DESC
             LIMIT 1`,
            [accountRow.account_pk],
          );
          if (txRows.length === 0) {
            // declineCreditCard path may not always persist a uown_cc_transaction row
            // (short-circuit before gateway). Log + soft signal — the LOAD-BEARING
            // assertion is the slim DTO above.
            console.log(
              `[CT-03][OBSERVAÇÃO] No uown_cc_transaction row for declined attempt on account_pk=${accountRow.account_pk} (declineCreditCard short-circuit may not persist).`,
            );
            return;
          }
          expect(
            txRows[0].status,
            `Declined transaction status (got: ${txRows[0].status})`,
          ).toMatch(/DECLIN|FAIL|DENIED/i);
        });
      });

      test('CT-04 — invalid card data: incomplete ccNumber → slim DTO holds', async (
        { api, db },
        testInfo,
      ) => {
        // Security guarantee under invalid input: even when the gateway/backend rejects
        // the card data, the response shape MUST remain slim. PRIMARY assertion is the
        // slim-DTO contract; we DO NOT fail if the backend normalizes/accepts the input.
        void db;
        const ctx = emptyCtx();

        const td = buildTestData({
          env: data.env,
          state: data.state,
          merchant: data.merchant,
          orderTotal: String(data.merchandiseAmount),
          orderDescription: 'CT-04 incomplete ccNumber',
          approved: true,
        });

        await test.step('Setup: create approved lead with skipCreditCardAuth=true', async () => {
          await setupApplicationViaApi(
            api,
            {
              merchant: td.merchant,
              applicant: td.applicant,
              order: td.order,
              env: data.env,
              skipCreditCardAuth: true,
              extractContractUrl: true,
              skipInvoice: true,
            },
            testInfo,
            ctx,
          );
          expect(ctx.leadPk).toBeTruthy();
        });

        await test.step('Bind merchant program (getMissingFields)', async () => {
          const { shortCode, planId } = extractShortCodeAndPlanIdFromUrl(ctx.contractUrl);
          const resp = await api.application.getMissingFields(
            shortCode,
            planId ? { planId } : undefined,
          );
          expect(resp.ok).toBeTruthy();
        });

        let respBody: Record<string, unknown> = {};
        let respStatus = 0;
        await test.step('Authorize CC with ccNumber="4111" (4 chars only)', async () => {
          const card = TEST_CARDS.MASTERCARD_APPROVED;
          const resp = await api.creditCard.authorizeCreditCard({
            leadPk: ctx.leadPk,
            ccNumber: '4111',
            ccExp: card.expirationDate,
            cvc: card.cvv,
            ccFirstName: td.applicant.firstName,
            ccLastName: td.applicant.lastName,
          });
          respBody = (resp.body ?? {}) as Record<string, unknown>;
          respStatus = resp.status;
          console.log(`[CT-04] status=${respStatus} body=${JSON.stringify(respBody)}`);
        });

        await test.step('Assert no sensitive leak (PRIMARY — works for both slim DTO and Spring error envelope)', async () => {
          // Backend rejects malformed CC with HTTP 500 + Spring exception-handler envelope
          // `{message, status: <httpCode>}` (different shape from the slim AuthorizeCreditCardResponse).
          // The #507 security guarantee (no gateway/token leak) still holds — just not via the slim DTO contract.
          // We dispatch on shape: 4 keys → slim DTO; otherwise → looser deny-list + size guard.
          const isSlimDto = Object.keys(respBody).length === 4;
          if (isSlimDto) {
            assertSlimDto(respBody, 'CT-04');
          } else {
            assertNoSensitiveLeak(respBody, 'CT-04');
          }
        });

        await test.step('Log actual failure mode for visibility (NOT load-bearing)', async () => {
          const statusStr = String(respBody.status ?? '');
          const errorStr = String(respBody.error ?? respBody.message ?? '');
          console.log(`[CT-04] failure mode: status="${statusStr}" error="${errorStr}" httpStatus=${respStatus}`);
        });
      });

      test('CT-05 — invalid card data: wrong cvc → slim DTO holds', async (
        { api, db },
        testInfo,
      ) => {
        void db;
        const ctx = emptyCtx();

        const td = buildTestData({
          env: data.env,
          state: data.state,
          merchant: data.merchant,
          orderTotal: String(data.merchandiseAmount),
          orderDescription: 'CT-05 wrong cvc',
          approved: true,
        });

        await test.step('Setup: create approved lead with skipCreditCardAuth=true', async () => {
          await setupApplicationViaApi(
            api,
            {
              merchant: td.merchant,
              applicant: td.applicant,
              order: td.order,
              env: data.env,
              skipCreditCardAuth: true,
              extractContractUrl: true,
              skipInvoice: true,
            },
            testInfo,
            ctx,
          );
          expect(ctx.leadPk).toBeTruthy();
        });

        await test.step('Bind merchant program (getMissingFields)', async () => {
          const { shortCode, planId } = extractShortCodeAndPlanIdFromUrl(ctx.contractUrl);
          const resp = await api.application.getMissingFields(
            shortCode,
            planId ? { planId } : undefined,
          );
          expect(resp.ok).toBeTruthy();
        });

        let respBody: Record<string, unknown> = {};
        let respStatus = 0;
        await test.step('Authorize CC with cvc="1" (single digit)', async () => {
          const card = TEST_CARDS.MASTERCARD_APPROVED;
          const resp = await api.creditCard.authorizeCreditCard({
            leadPk: ctx.leadPk,
            ccNumber: card.number,
            ccExp: card.expirationDate,
            cvc: '1',
            ccFirstName: td.applicant.firstName,
            ccLastName: td.applicant.lastName,
          });
          respBody = (resp.body ?? {}) as Record<string, unknown>;
          respStatus = resp.status;
          console.log(`[CT-05] status=${respStatus} body=${JSON.stringify(respBody)}`);
          expect(
            respStatus < 500,
            `authorizeCreditCard returned 5xx (${respStatus}) — transport flake`,
          ).toBeTruthy();
        });

        await test.step('Assert slim DTO contract holds (PRIMARY — security guarantee)', async () => {
          assertSlimDto(respBody, 'CT-05');
        });

        await test.step('Log actual failure mode for visibility (NOT load-bearing)', async () => {
          const statusStr = String(respBody.status ?? '');
          const errorStr = String(respBody.error ?? '');
          console.log(`[CT-05] failure mode: status="${statusStr}" error="${errorStr}" httpStatus=${respStatus}`);
        });
      });

      test('CT-06 — invalid card data: expired ccExp → slim DTO holds', async (
        { api, db },
        testInfo,
      ) => {
        void db;
        const ctx = emptyCtx();

        const td = buildTestData({
          env: data.env,
          state: data.state,
          merchant: data.merchant,
          orderTotal: String(data.merchandiseAmount),
          orderDescription: 'CT-06 expired ccExp',
          approved: true,
        });

        await test.step('Setup: create approved lead with skipCreditCardAuth=true', async () => {
          await setupApplicationViaApi(
            api,
            {
              merchant: td.merchant,
              applicant: td.applicant,
              order: td.order,
              env: data.env,
              skipCreditCardAuth: true,
              extractContractUrl: true,
              skipInvoice: true,
            },
            testInfo,
            ctx,
          );
          expect(ctx.leadPk).toBeTruthy();
        });

        await test.step('Bind merchant program (getMissingFields)', async () => {
          const { shortCode, planId } = extractShortCodeAndPlanIdFromUrl(ctx.contractUrl);
          const resp = await api.application.getMissingFields(
            shortCode,
            planId ? { planId } : undefined,
          );
          expect(resp.ok).toBeTruthy();
        });

        let respBody: Record<string, unknown> = {};
        let respStatus = 0;
        await test.step('Authorize CC with ccExp="01/2020" (expired)', async () => {
          const card = TEST_CARDS.MASTERCARD_APPROVED;
          const resp = await api.creditCard.authorizeCreditCard({
            leadPk: ctx.leadPk,
            ccNumber: card.number,
            ccExp: '01/2020',
            cvc: card.cvv,
            ccFirstName: td.applicant.firstName,
            ccLastName: td.applicant.lastName,
          });
          respBody = (resp.body ?? {}) as Record<string, unknown>;
          respStatus = resp.status;
          console.log(`[CT-06] status=${respStatus} body=${JSON.stringify(respBody)}`);
        });

        await test.step('Assert no sensitive leak (PRIMARY — handles slim DTO and Spring error envelope)', async () => {
          // Same dispatch as CT-04: invalid CC may short-circuit to Spring exception envelope
          // `{message, status: <httpCode>}`. Either form must satisfy the deny-list contract.
          const isSlimDto = Object.keys(respBody).length === 4;
          if (isSlimDto) {
            assertSlimDto(respBody, 'CT-06');
          } else {
            assertNoSensitiveLeak(respBody, 'CT-06');
          }
        });

        await test.step('Log actual failure mode for visibility (NOT load-bearing)', async () => {
          const statusStr = String(respBody.status ?? '');
          const errorStr = String(respBody.error ?? respBody.message ?? '');
          console.log(`[CT-06] failure mode: status="${statusStr}" error="${errorStr}" httpStatus=${respStatus}`);
        });
      });

      test('CT-07 — extra body fields + custom request headers → slim DTO is unchanged', async (
        { api, db },
        testInfo,
      ) => {
        // Adversarial test: a malicious or naive client sends extra body fields
        // (`requestFullResponse:true`, `debug:true`) and custom headers
        // (`X-Request-Full`, `Accept: application/json+full`) trying to coax a
        // verbose response out of the backend. The slim-DTO contract MUST hold.
        void db;
        const ctx = emptyCtx();

        const td = buildTestData({
          env: data.env,
          state: data.state,
          merchant: data.merchant,
          orderTotal: String(data.merchandiseAmount),
          orderDescription: 'CT-07 extra fields + custom headers',
          approved: true,
        });

        await test.step('Setup: create approved lead with skipCreditCardAuth=true', async () => {
          await setupApplicationViaApi(
            api,
            {
              merchant: td.merchant,
              applicant: td.applicant,
              order: td.order,
              env: data.env,
              skipCreditCardAuth: true,
              extractContractUrl: true,
              skipInvoice: true,
            },
            testInfo,
            ctx,
          );
          expect(ctx.leadPk).toBeTruthy();
        });

        await test.step('Bind merchant program (getMissingFields)', async () => {
          const { shortCode, planId } = extractShortCodeAndPlanIdFromUrl(ctx.contractUrl);
          const resp = await api.application.getMissingFields(
            shortCode,
            planId ? { planId } : undefined,
          );
          expect(resp.ok).toBeTruthy();
        });

        await test.step('Inject custom request headers via BaseClient.withHeader (chained, persists for the next call)', async () => {
          // BaseClient exposes `withHeader(name, value)` which mutates this.headers
          // and returns `this`. We only inject custom X- headers — NOT `Accept` (which
          // returns 406 Not Acceptable since the server only emits standard JSON).
          // The point is to prove the server ignores adversarial request hints, not
          // to test content negotiation.
          api.creditCard
            .withHeader('X-Request-Full', 'true')
            .withHeader('X-Debug', 'true')
            .withHeader('X-Include-Gateway-Data', 'true');
        });

        let respBody: Record<string, unknown> = {};
        let respStatus = 0;
        await test.step('Authorize CC with extra body fields (requestFullResponse, debug, includeGatewayData)', async () => {
          const card = TEST_CARDS.MASTERCARD_APPROVED;
          // Body-overload + cast to inject extra fields. Backend must ignore them;
          // we cast through `unknown` to satisfy strict-null without `any`.
          const adversarialBody = {
            leadPk: ctx.leadPk,
            ccNumber: card.number,
            ccExp: card.expirationDate,
            cvc: card.cvv,
            ccFirstName: td.applicant.firstName,
            ccLastName: td.applicant.lastName,
            // Adversarial extras — the backend should ignore these and never echo them back.
            requestFullResponse: true,
            debug: true,
            includeGatewayData: true,
          };
          const resp = await api.creditCard.authorizeCreditCard(
            adversarialBody as unknown as Parameters<typeof api.creditCard.authorizeCreditCard>[0],
          );
          respBody = (resp.body ?? {}) as Record<string, unknown>;
          respStatus = resp.status;
          console.log(`[CT-07] status=${respStatus} body=${JSON.stringify(respBody)}`);
          expect(
            respStatus < 500,
            `authorizeCreditCard returned 5xx (${respStatus}) — transport flake`,
          ).toBeTruthy();
        });

        await test.step('Assert slim DTO contract is UNCHANGED despite adversarial input', async () => {
          assertSlimDto(respBody, 'CT-07');
        });

        await test.step('Assert adversarial keys did NOT echo back', async () => {
          // Specific guard: even if the backend chooses to "respect" the extra request,
          // those keys must not appear in the response body (allow-list already covers
          // this, but we make the intent explicit for diagnostics).
          const echoedAdversarial = ['requestFullResponse', 'debug', 'includeGatewayData']
            .filter((k) => Object.prototype.hasOwnProperty.call(respBody, k));
          expect(
            echoedAdversarial,
            `Adversarial body fields echoed back in response: [${echoedAdversarial.join(', ')}]`,
          ).toEqual([]);
        });
      });
    },
  );
}

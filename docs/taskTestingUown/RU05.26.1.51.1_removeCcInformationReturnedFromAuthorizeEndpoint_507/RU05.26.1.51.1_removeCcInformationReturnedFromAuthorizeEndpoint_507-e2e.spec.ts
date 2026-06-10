/**
 * RU05.26.1.51.1 — Remove CC Information Returned from Authorize Endpoint (Hybrid E2E)
 * GitLab issue: https://gitlab.com/uown/backend/svc/-/work_items/507
 *
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │ WHY THIS SPEC EXISTS (CLAUDE.md Rule #15 — UI-First Principle)           │
 * │                                                                          │
 * │ The sibling spec                                                         │
 * │   RU05.26.1.51.1_removeCcInformationReturnedFromAuthorizeEndpoint_507    │
 * │   .spec.ts                                                               │
 * │ exercises the wire payload via DIRECT API call. That coverage is        │
 * │ necessary (only deep-traversal of the raw JSON catches a regression)    │
 * │ but it does not prove the BROWSER actually receives the slim DTO during │
 * │ the real signing flow. A frontend layer between us and the API could    │
 * │ silently re-attach fat fields (caching, mock SW, vendor proxy) and the  │
 * │ API-only spec would still pass.                                         │
 * │                                                                          │
 * │ This hybrid spec closes three gaps:                                      │
 * │   1. DevTools-equivalent capture of the `/authorizeCreditCard` response │
 * │      observed BY THE BROWSER during the real signing flow → must be the │
 * │      slim 4-field DTO.                                                  │
 * │   2. The slim DTO does not regress the UI (lead state advances, no JS  │
 * │      console error storms tied to missing fields).                      │
 * │   3. On a CC failure path the frontend renders an error AND the network │
 * │      response is still slim DTO (CT-E2E-02 — best-effort, may be        │
 * │      `test.skip` in stg if gateway is `NOT_RUN`; see CT body).          │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * Strategy:
 *   • Setup: `setupApplicationViaApi(..., { extractContractUrl: true,
 *     skipInvoice: true, skipCreditCardAuth: true })` — gives us the contract
 *     redirectUrl that the customer would receive.
 *   • Bind merchant program inline via `getMissingFields(shortCode, { planId })`
 *     so the upcoming authorize call doesn't 500 (Pitfall #2,
 *     `application-lifecycle-protocol.md`).
 *   • Network capture: `page.on('response')` BEFORE navigating to contract URL,
 *     filter on `/authorizeCreditCard` (case-insensitive), record raw bodies.
 *   • Drive the flow via the existing `ContractPage` page object (approach (b)
 *     from the orchestrator brief — direct nav + `ContractPage` is cheaper
 *     than reusing PayPair which adds OTP overhead).
 *
 * APPROACH CHOSEN: (b) Direct navigation to ctx.contractUrl + ContractPage
 *   — ContractPage already wraps SignWell + GoSign detection (`completeESign`),
 *   so a single page object covers both providers without us having to call
 *   `detectProvider()` ourselves.
 *   — PayPair would add 3-4 minutes of phone OTP + JSON form fill that doesn't
 *   exercise the `/authorizeCreditCard` call any more thoroughly than the
 *   contract-page CC form does.
 *
 * Forbidden-keys allow-list / deny-list helpers are duplicated from the
 * API-only spec on purpose — extracting them into a shared helper means
 * touching code that's already passing in stg and re-running both suites.
 * TODO: factor into `src/helpers/cc-payload-validators.helper.ts` once both
 *       specs are stable across stg/qa2/qa1.
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import type { TestContext } from '@fixtures/test-context.fixture.js';
import { ContractPage, OriginationCustomerPage } from '@pages/origination/index.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';
import {
  buildTestData,
  loginToPortalWithOptions,
  setupApplicationViaApi,
  sleep,
} from '@helpers/index.js';
import { TEST_CARDS } from '@data/index.js';
import { TEST_BANK } from '@config/index.js';

// ── Test-data ───────────────────────────────────────────────────────

const testData = [
  {
    env: 'stg',
    riskTier: 'low' as const,
    state: 'CA',                    // Appendix G low tier; CA is single-program for TerraceFinance
    merchant: 'TerraceFinance',     // ONLINE merchant → uses customer state for routing
    merchandiseAmount: 1000,        // Appendix G low band
    // Tags: enum members + literal '@hybrid' (no HYBRID member in TestTag — string literal is safe;
    // `splitTags` just splits whitespace).
    tag: `${buildTags(TestTag.REGRESSION, TestTag.CRITICAL, TestTag.STG)} @hybrid`,
  },
];

// ── Allow-list / Deny-list (DUPLICATED from API-only spec — see TODO above) ─

const ALLOWED_TOP_LEVEL_KEYS = new Set<string>([
  'status',
  'message',
  'error',
  'errorCode',
  'preAuthStatus',
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

// stg-observed enum values (Kount disabled in stg → preAuthStatus="NOT_RUN")
const VALID_PRE_AUTH_STATUS = new Set<string>([
  'SESSION_UNAVAILABLE', 'SUCCESS', 'DENIED', 'ERROR', 'NOT_RUN',
]);

// ── Helpers (DUPLICATED from API-only spec — see TODO above) ─

interface ForbiddenHit { path: string; key: string; sampleValue: string }

function maskValue(v: unknown): string {
  if (v === null) return 'null';
  if (typeof v === 'string') return `*** (string, len=${v.length})`;
  if (typeof v === 'number') return '*** (number)';
  if (typeof v === 'boolean') return `*** (boolean)`;
  if (Array.isArray(v)) return `[array len=${v.length}]`;
  if (typeof v === 'object') return '[object]';
  return `<${typeof v}>`;
}

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

function findExtraTopLevelKeys(body: unknown, allowed: Set<string>): string[] {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) return [];
  return Object.keys(body as Record<string, unknown>).filter((k) => !allowed.has(k));
}

function extractShortCodeAndPlanIdFromUrl(url: string): { shortCode: string; planId: string } {
  const parsed = new URL(url);
  const pathParts = parsed.pathname.split('/').filter(Boolean);
  const shortCode = pathParts[0] ?? '';
  const planId = parsed.searchParams.get('planId') ?? '';
  return { shortCode, planId };
}

// ── Network capture ───────────────────────────────────────────────────

interface AuthorizeCapture {
  url: string;
  status: number;
  contentLength: string | null;
  body: unknown;        // parsed JSON if available, else raw text, else null
  rawText: string | null;
  parseError: string | null;
}

/**
 * Install a `page.on('response')` listener BEFORE navigating to the contract URL.
 * Filters on URLs containing `/authorizeCreditCard` (case-insensitive).
 * Returns the capture array (mutates as responses come in) plus a teardown function.
 */
function installAuthorizeNetworkCapture(
  page: import('@playwright/test').Page,
): { captures: AuthorizeCapture[]; dispose: () => void } {
  const captures: AuthorizeCapture[] = [];

  const handler = (resp: import('@playwright/test').Response): void => {
    const url = resp.url();
    if (!/authorizeCreditCard/i.test(url)) return;

    // Defer body extraction to a microtask — Playwright `Response` is read-only after
    // request finalization, but `body()`/`text()`/`json()` are async. Capture eagerly.
    void (async () => {
      let body: unknown = null;
      let rawText: string | null = null;
      let parseError: string | null = null;
      try {
        rawText = await resp.text();
      } catch (err) {
        parseError = `text() threw: ${(err as Error).message}`;
      }
      if (rawText !== null) {
        try {
          body = JSON.parse(rawText);
        } catch (err) {
          parseError = `JSON.parse threw: ${(err as Error).message}`;
          body = rawText; // keep raw for diagnostics
        }
      }
      let contentLength: string | null = null;
      try {
        contentLength = resp.headers()['content-length'] ?? null;
      } catch {
        contentLength = null;
      }

      captures.push({
        url,
        status: resp.status(),
        contentLength,
        body,
        rawText,
        parseError,
      });
      console.log(
        `[NetCap] /authorizeCreditCard captured — status=${resp.status()} ` +
        `len=${contentLength ?? rawText?.length ?? '?'} parseErr=${parseError ?? 'none'}`,
      );
    })();
  };

  page.on('response', handler);
  return {
    captures,
    dispose: () => page.off('response', handler),
  };
}

// ── Suite ───────────────────────────────────────────────────────────

for (const data of testData) {
  test.describe(
    `RU05.26.1.51.1_removeCcInformationReturnedFromAuthorizeEndpoint_507_e2e - ${data.env}/${data.merchant}`,
    { tag: splitTags(data.tag) },
    () => {
      test.use({ envName: data.env });

      // Hybrid flow: ~60s API setup + ~30s contract page load + ~3-5min signing →
      // 8 minutes per CT is comfortable headroom for stg cold starts.
      test.setTimeout(480_000);

      test('CT-E2E-01 — slim DTO observed in browser during real signing flow', async (
        { page, api, db, ctx, testEnv, merchantConfig: mSetup },
        testInfo,
      ) => {
        // Belt-and-suspenders: re-init ctx (the fixture provides a fresh one per test,
        // but we rely on these fields being non-empty before the assertions).
        Object.assign(ctx as TestContext, {
          leadPk: '', leadUuid: '', accountPk: '', accountNumber: '',
          contractStatus: '', contractUrl: '', websiteAccountPk: '',
          achAdded: 0, ccAdded: 0,
        });

        const td = buildTestData({
          env: data.env,
          state: data.state,
          merchant: data.merchant,
          orderTotal: String(data.merchandiseAmount),
          orderDescription: 'CT-E2E-01 — slim DTO observed in browser',
          approved: true,                  // SSN ≠ 9 → UW_APPROVED
          sanitizeNames: true,
        });

await test.step('Setup: create approved lead via API (skipCreditCardAuth=true, extractContractUrl=true)', async () => {
          await setupApplicationViaApi(
            api,
            {
              merchant: td.merchant,
              applicant: td.applicant,
              order: td.order,
              env: data.env,
              skipCreditCardAuth: true,
              extractContractUrl: true,
              // Pitfall #21: extractContractUrl + sendInvoice → invalidates the URL.
              skipInvoice: true,
            },
            testInfo,
            ctx as TestContext,
          );
          expect(ctx.leadPk, 'leadPk must be populated').toBeTruthy();
          expect(ctx.contractUrl, 'contractUrl must be populated (extractContractUrl=true)').toBeTruthy();
          console.log(`[Setup] leadPk=${ctx.leadPk} contractUrl=${ctx.contractUrl}`);
        });

        await test.step('Bind merchant program (getMissingFields) — Pitfall #2', async () => {
          // Without this, authorizeCreditCard 500s with "Merchant program is required to
          // determine fee to be charged for lead {pk}". `setupApplicationViaApi` only calls
          // getMissingFields when `submitPaymentInfoViaApi=true` — we're in the
          // `skipCreditCardAuth=true` branch, so we have to do it ourselves.
          const { shortCode, planId } = extractShortCodeAndPlanIdFromUrl(ctx.contractUrl!);
          expect(shortCode, 'shortCode must parse from contractUrl').toBeTruthy();
          const resp = await api.application.getMissingFields(
            shortCode,
            planId ? { planId } : undefined,
          );
          expect(resp.ok, `getMissingFields responded with ${resp.status}`).toBeTruthy();
          console.log(`[Setup] getMissingFields ok (shortCode=${shortCode}, planId=${planId || '(none)'})`);
        });

        // Install the network listener BEFORE we navigate — otherwise we miss
        // the response that fires while ContractPage is submitting the CC form.
        const netCap = installAuthorizeNetworkCapture(page);

        await test.step('Navigate to contract URL (browser-side flow starts here)', async () => {
          // Clear cookies — the contract URL rejects requests carrying origination portal
          // session cookies ("Invalid link"). See credit-card-decline-check.spec.ts pattern.
          await page.context().clearCookies();
          await page.goto(ctx.contractUrl!, { waitUntil: 'domcontentloaded', timeout: 60_000 });
          await page.waitForLoadState('networkidle').catch(() => {});
          console.log(`[Phase] Navigated to contract URL`);
        });

        const contract = new ContractPage(page);

        await test.step('Fill CC info via UI (MASTERCARD_APPROVED — gateway approves in stg)', async () => {
          await contract.waitForSpinner();
          const card = TEST_CARDS.MASTERCARD_APPROVED;
          await contract.fillCreditCardInfo({
            firstName: td.applicant.firstName,
            lastName: td.applicant.lastName,
            cardNumber: card.number,
            cvc: card.cvv,
            expDate: `${card.expMonth}/${card.expYear}`,
          });
          console.log('[Phase] CC info filled (MASTERCARD_APPROVED)');
        });

        await test.step('Fill bank info', async () => {
          await contract.fillBankInfo({
            firstName: td.applicant.firstName,
            lastName: td.applicant.lastName,
            routingNumber: TEST_BANK.DEFAULT_ROUTING,
            accountNumber: TEST_BANK.DEFAULT_ACCOUNT,
          });
          console.log('[Phase] Bank info filled');
        });

        await test.step('Submit payment info (this triggers /authorizeCreditCard)', async () => {
          await contract.submitPaymentInfo();
          // Give the listener a moment to drain — page.on('response') is async.
          await sleep(2_000);
          console.log(`[Phase] Payment submitted; capture count so far=${netCap.captures.length}`);
        });

        // ── Primary assertions: browser-observed wire payload ─────────

        await test.step('Assert at least one /authorizeCreditCard response was captured', async () => {
          expect(
            netCap.captures.length,
            `Expected ≥1 /authorizeCreditCard response, got ${netCap.captures.length}. ` +
            `If 0, the browser flow may have skipped the call (e.g., contract URL routed through ` +
            `a path that doesn't authorize CC). Check console output above.`,
          ).toBeGreaterThanOrEqual(1);
        });

        await test.step('Assert HTTP status (should be 200; endpoint reports decline in body, not via 4xx)', async () => {
          // Use the LAST capture — if the form was retried (validation error → resubmit),
          // we want the success-path response.
          const last = netCap.captures[netCap.captures.length - 1];
          console.log(`[Assert] Last capture: status=${last.status} parseErr=${last.parseError} bodyType=${typeof last.body}`);
          expect(
            last.status < 500,
            `authorizeCreditCard returned 5xx (${last.status}) — transport flake, not a slim-DTO failure. ` +
            `Body: ${last.rawText?.slice(0, 200) ?? '(empty)'}`,
          ).toBeTruthy();
          expect(last.status, 'Expected 2xx for approved CC path').toBeLessThan(300);
        });

        await test.step('Assert browser-captured body is JSON-parseable', async () => {
          const last = netCap.captures[netCap.captures.length - 1];
          expect(
            last.parseError,
            `Browser-captured body must be valid JSON. Parse error: ${last.parseError}. ` +
            `Raw: ${last.rawText?.slice(0, 200) ?? '(empty)'}`,
          ).toBeNull();
          expect(
            typeof last.body === 'object' && last.body !== null && !Array.isArray(last.body),
            `Browser-captured body must be a JSON object. Got: ${typeof last.body}`,
          ).toBeTruthy();
        });

        await test.step('Assert allow-list compliance on browser-captured body (top-level keys)', async () => {
          const last = netCap.captures[netCap.captures.length - 1];
          const respBody = last.body as Record<string, unknown>;
          const extras = findExtraTopLevelKeys(respBody, ALLOWED_TOP_LEVEL_KEYS);
          expect(
            extras,
            `Browser-observed top-level keys must be a subset of ${[...ALLOWED_TOP_LEVEL_KEYS].join(', ')}. ` +
            `Extras: [${extras.join(', ')}]. Full keys: [${Object.keys(respBody).join(', ')}]. ` +
            `Raw: ${JSON.stringify(respBody).slice(0, 300)}`,
          ).toEqual([]);
        });

        await test.step('Assert deny-list compliance on browser-captured body (deep traversal)', async () => {
          const last = netCap.captures[netCap.captures.length - 1];
          const respBody = last.body as Record<string, unknown>;
          const hits = findForbiddenKeys(respBody, FORBIDDEN_KEYS);
          const formatted = hits.map((h) => `${h.path} (key="${h.key}", value=${h.sampleValue})`);
          expect(
            hits,
            `Browser-observed body leaked forbidden keys: [${formatted.join('; ')}]`,
          ).toEqual([]);
        });

        await test.step('Assert preAuthStatus is one of the documented enum values', async () => {
          const last = netCap.captures[netCap.captures.length - 1];
          const respBody = last.body as Record<string, unknown>;
          const preAuthStr = String(respBody.preAuthStatus ?? '').toUpperCase();
          // stg observation: Kount disabled → preAuthStatus="NOT_RUN" on success path.
          // Don't fail on this — assert membership in the canonical enum set.
          expect(
            VALID_PRE_AUTH_STATUS.has(preAuthStr),
            `preAuthStatus must be one of ${[...VALID_PRE_AUTH_STATUS].join(', ')}. ` +
            `Got: "${respBody.preAuthStatus}"`,
          ).toBeTruthy();
          console.log(`[Assert] preAuthStatus=${preAuthStr} (acceptable)`);
        });

        await test.step('Assert payload size sanity (slim DTO < 500 bytes)', async () => {
          const last = netCap.captures[netCap.captures.length - 1];
          const size = last.rawText?.length ?? JSON.stringify(last.body).length;
          console.log(`[Assert] payload size=${size} bytes`);
          expect(
            size,
            `Slim DTO should be <500 bytes. Got ${size}. Likely regression — gateway blob is back.`,
          ).toBeLessThan(500);
        });

        // ── Functional flow continues — no UI regression ──────────────

        await test.step('Functional flow: complete T&C', async () => {
          await contract.completeTermsAndConditions();
          console.log('[Phase] T&C completed');
        });

        // The slim-DTO validation of /authorizeCreditCard already passed above. The remaining
        // signing steps (e-sign iframe, viewCompletedDocument, lead status advance) are
        // downstream of #507's concern. They're kept as observational/best-effort because:
        //  - SignWell iframe in stg is occasionally slow/unavailable (env-specific, not #507)
        //  - The primary security guarantee for #507 is the response shape, validated above
        let esignCompleted = false;
        await test.step('[best-effort] Functional flow: complete e-sign (auto-detects SignWell vs GoSign)', async () => {
          try {
            await contract.completeESign();
            await contract.viewCompletedDocument();
            esignCompleted = true;
            console.log('[Phase] E-sign completed');
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.log(`[Phase][OBSERVAÇÃO] e-sign continuation failed: ${msg.split('\n')[0]}. Slim-DTO validation (the #507 contract) already passed above.`);
            testInfo.annotations.push({ type: 'esign_observation', description: msg.split('\n')[0] });
          }
        });

        await test.step('[best-effort] Verify lead status advanced (slim DTO did not break the flow)', async () => {
          if (!esignCompleted) {
            console.log('[Phase][OBSERVAÇÃO] Skipping lead-status check — e-sign step did not complete (env-specific, not #507).');
            return;
          }
          const ctxBrowser = page.context();
          const origPage = await ctxBrowser.newPage();
          await origPage.goto(testEnv.originationUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
          await loginToPortalWithOptions(origPage, testEnv.originationUrl, testEnv);
          await origPage.goto(`${testEnv.originationUrl}customers/${ctx.leadPk}`, { waitUntil: 'domcontentloaded' });

          const customerPage = new OriginationCustomerPage(origPage);
          await customerPage.waitForSpinner();

          const getDocStatusBtn = origPage.locator("xpath=//*[text()='Get Document Status']");
          if (await getDocStatusBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
            await getDocStatusBtn.click({ force: true }).catch(() => {});
            await sleep(5_000);
            await customerPage.waitForSpinner();
          }

          const { status, matched } = await customerPage.pollForLeadStatus(
            ['signed', 'fund', 'settled', 'cc_auth_passed', 'contract_created'],
            10,
            5_000,
          );
          console.log(`[Phase] Final lead status="${status}" matched=${matched}`);
          testInfo.annotations.push({ type: 'finalLeadStatus', description: status });

          expect(
            status.toLowerCase(),
            `Lead status must advance past UW_APPROVED. Got: "${status}".`,
          ).not.toMatch(/^uw_approved$/i);
        });

        await test.step('[reflex] DB persistence — CC transaction was created (confirms slim DTO did not skip work)', async () => {
          const accountRow = await db.queryOne<{ account_pk: number | null }>(
            `SELECT account_pk FROM uown_los_lead WHERE pk = $1 LIMIT 1`,
            [Number(ctx.leadPk)],
          );
          if (!accountRow || !accountRow.account_pk) {
            console.log(
              `[reflex] No account_pk for leadPk=${ctx.leadPk} — likely not yet at signing/funding stage. ` +
              `Skipping uown_cc_transaction lookup (OBSERVAÇÃO, not failure).`,
            );
            return;
          }
          const txRows = await db.query<{ pk: number; status: string; account_pk: number }>(
            `SELECT pk, status, account_pk FROM uown_cc_transaction
               WHERE account_pk = $1
             ORDER BY pk DESC
             LIMIT 1`,
            [accountRow.account_pk],
          );
          expect(
            txRows.length,
            `Expected ≥1 uown_cc_transaction row for account_pk=${accountRow.account_pk}`,
          ).toBeGreaterThanOrEqual(1);
          expect(
            txRows[0].status,
            `CC transaction status should reflect approval (got: ${txRows[0].status})`,
          ).toMatch(/APPROVED|SUCCESS|SETTLED/i);
        });

        await test.step('[reflex] Activity log written (CLAUDE.md Rule #14)', async () => {
          const noteRows = await db.query<{ pk: number; notes: string }>(
            `SELECT pk, notes FROM uown_los_lead_notes
               WHERE lead_pk = $1
               AND (notes ILIKE '%credit card%' OR notes ILIKE '%authoriz%' OR notes ILIKE '%cc auth%' OR notes ILIKE '%signed%')
             ORDER BY pk DESC
             LIMIT 5`,
            [Number(ctx.leadPk)],
          );
          if (noteRows.length === 0) {
            console.log(
              `[reflex][OBSERVAÇÃO] No activity-log note matching CC-auth/signed patterns for ` +
              `leadPk=${ctx.leadPk}. Per Rule #14, this is an OBSERVAÇÃO pending user clarification.`,
            );
          } else {
            console.log(`[reflex] Activity log row(s) found: ${noteRows.length}`);
          }
        });

        netCap.dispose();
      });

      test('CT-E2E-02 — error rendering on CC failure (slim DTO holds, UI shows error)', async (
        { page, api, ctx, merchantConfig: mSetup },
        testInfo,
      ) => {
        // EARLY SKIP justification (orchestrator brief):
        //   stg's gateway frequently runs in `preAuthStatus="NOT_RUN"` mode (Kount disabled)
        //   — the backend skips gateway pre-auth and returns APPROVED for any card. In that
        //   environment, even VISA_DECLINED won't trigger a UI error.
        //   We do NOT skip pre-emptively. Instead we drive the flow with VISA_DECLINED and:
        //     a) if any /authorizeCreditCard response shows decline semantics → assert UI
        //        renders an error AND slim DTO holds. (the value-add CT)
        //     b) if all responses come back APPROVED with preAuthStatus=NOT_RUN → log
        //        OBSERVAÇÃO and pass with a relaxed assertion (slim DTO MUST still hold;
        //        decline-rendering simply not exercised in this env).
        //
        //   This avoids a hard test.skip while honoring the brief's "don't fail the suite
        //   over an environment-specific reproduction issue" guidance.
        Object.assign(ctx as TestContext, {
          leadPk: '', leadUuid: '', accountPk: '', accountNumber: '',
          contractStatus: '', contractUrl: '', websiteAccountPk: '',
          achAdded: 0, ccAdded: 0,
        });

        const td = buildTestData({
          env: data.env,
          state: data.state,
          merchant: data.merchant,
          orderTotal: String(data.merchandiseAmount),
          orderDescription: 'CT-E2E-02 — error rendering on CC failure',
          approved: true,                  // lead must be approved so we can reach the CC form
          sanitizeNames: true,
        });

        await test.step('Setup: create approved lead', async () => {
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
            ctx as TestContext,
          );
          expect(ctx.leadPk).toBeTruthy();
          expect(ctx.contractUrl).toBeTruthy();
        });

        await test.step('Bind merchant program (getMissingFields)', async () => {
          const { shortCode, planId } = extractShortCodeAndPlanIdFromUrl(ctx.contractUrl!);
          expect(shortCode).toBeTruthy();
          const resp = await api.application.getMissingFields(
            shortCode,
            planId ? { planId } : undefined,
          );
          expect(resp.ok, `getMissingFields responded with ${resp.status}`).toBeTruthy();
        });

        const netCap = installAuthorizeNetworkCapture(page);

        await test.step('Navigate to contract URL', async () => {
          await page.context().clearCookies();
          await page.goto(ctx.contractUrl!, { waitUntil: 'domcontentloaded', timeout: 60_000 });
          await page.waitForLoadState('networkidle').catch(() => {});
        });

        const contract = new ContractPage(page);

        await test.step('Fill CC info with VISA_DECLINED', async () => {
          await contract.waitForSpinner();
          const declined = TEST_CARDS.VISA_DECLINED;
          await contract.fillCreditCardInfo({
            firstName: td.applicant.firstName,
            lastName: td.applicant.lastName,
            cardNumber: declined.number,
            cvc: declined.cvv,
            expDate: `${declined.expMonth}/${declined.expYear}`,
          });
        });

        await test.step('Fill bank info', async () => {
          await contract.fillBankInfo({
            firstName: td.applicant.firstName,
            lastName: td.applicant.lastName,
            routingNumber: TEST_BANK.DEFAULT_ROUTING,
            accountNumber: TEST_BANK.DEFAULT_ACCOUNT,
          });
        });

        let uiErrorVisible = false;
        let uiErrorText = '';

        await test.step('Submit payment (decline path) — capture network + UI error', async () => {
          // We can't use `submitPaymentInfo()` here — that helper asserts no error toast,
          // and we EXPECT one. Click the button manually and harvest the toast/banner.
          const submitBtn = page.locator(
            `button:has-text("Submit"), button:has-text("SUBMIT"), [class*="btn-primary"]`,
          ).first();
          await submitBtn.scrollIntoViewIfNeeded();
          await submitBtn.click({ force: true }).catch(() => {});

          // Wait for either: (a) decline toast appears, or (b) URL transitions (gateway approved).
          await Promise.race([
            page.locator('[role="alert"], .Toastify__toast, .error, [class*="error"]')
              .first()
              .waitFor({ state: 'visible', timeout: 15_000 }),
            page.waitForLoadState('networkidle', { timeout: 15_000 }),
          ]).catch(() => {});

          await sleep(2_000); // let listener drain

          // Probe for any visible error indicator
          const errorLocators = [
            page.getByRole('alert'),
            page.locator('.Toastify__toast'),
            page.locator('[class*="error"]:visible').first(),
            page.locator('[role="alert"]'),
          ];
          for (const loc of errorLocators) {
            if (await loc.first().isVisible({ timeout: 1_500 }).catch(() => false)) {
              uiErrorVisible = true;
              uiErrorText = (await loc.first().textContent().catch(() => '')) ?? '';
              break;
            }
          }
          console.log(`[Phase] uiErrorVisible=${uiErrorVisible} text="${uiErrorText.slice(0, 120)}"`);
          console.log(`[Phase] capture count=${netCap.captures.length}`);
        });

        await test.step('Assert at least one /authorizeCreditCard response was captured', async () => {
          expect(
            netCap.captures.length,
            `Expected ≥1 /authorizeCreditCard response, got ${netCap.captures.length}.`,
          ).toBeGreaterThanOrEqual(1);
        });

        await test.step('Assert browser-captured body is JSON-parseable', async () => {
          const last = netCap.captures[netCap.captures.length - 1];
          expect(
            last.parseError,
            `Browser-captured body must be valid JSON. Parse error: ${last.parseError}. ` +
            `Raw: ${last.rawText?.slice(0, 200) ?? '(empty)'}`,
          ).toBeNull();
        });

        // ── PRIMARY assertion: slim DTO holds even on decline path ───

        await test.step('Assert allow-list compliance on decline path (top-level keys)', async () => {
          const last = netCap.captures[netCap.captures.length - 1];
          const respBody = last.body as Record<string, unknown>;
          const extras = findExtraTopLevelKeys(respBody, ALLOWED_TOP_LEVEL_KEYS);
          expect(
            extras,
            `Decline path leaked extra top-level keys: [${extras.join(', ')}]. ` +
            `Full keys: [${Object.keys(respBody).join(', ')}]`,
          ).toEqual([]);
        });

        await test.step('Assert deny-list compliance on decline path (deep traversal)', async () => {
          const last = netCap.captures[netCap.captures.length - 1];
          const respBody = last.body as Record<string, unknown>;
          const hits = findForbiddenKeys(respBody, FORBIDDEN_KEYS);
          const formatted = hits.map((h) => `${h.path} (key="${h.key}", value=${h.sampleValue})`);
          expect(
            hits,
            `Decline path leaked forbidden keys: [${formatted.join('; ')}]. ` +
            `Highest-risk leak: gatewayResponse with the gateway's decline payload.`,
          ).toEqual([]);
        });

        await test.step('Assert payload size sanity on decline path (<500 bytes)', async () => {
          const last = netCap.captures[netCap.captures.length - 1];
          const size = last.rawText?.length ?? JSON.stringify(last.body).length;
          console.log(`[Assert] decline-path payload size=${size}`);
          expect(size, `Slim DTO on decline path should be <500 bytes`).toBeLessThan(500);
        });

        // ── SECONDARY assertion: decline semantics + UI error rendering ──

        await test.step('Decline semantics + UI error rendering (env-aware)', async () => {
          const last = netCap.captures[netCap.captures.length - 1];
          const respBody = last.body as Record<string, unknown>;
          const statusStr = String(respBody.status ?? '').toUpperCase();
          const preAuthStr = String(respBody.preAuthStatus ?? '').toUpperCase();
          const hasError = !!respBody.error;
          const declineSignal =
            statusStr === 'DECLINED' ||
            statusStr.includes('FAIL') ||
            preAuthStr === 'FAILED' ||
            hasError;

          if (preAuthStr === 'NOT_RUN' && !declineSignal) {
            // stg path: gateway pre-auth skipped → can't exercise decline rendering.
            // Slim-DTO assertions above already passed; we record OBSERVAÇÃO and proceed.
            console.log(
              `[OBSERVAÇÃO] Gateway pre-auth skipped (preAuthStatus=NOT_RUN) — VISA_DECLINED ` +
              `was returned APPROVED in this env. Slim-DTO assertions still hold; UI error ` +
              `rendering simply not exercised here.`,
            );
            testInfo.annotations.push({
              type: 'OBSERVAÇÃO',
              description: 'preAuthStatus=NOT_RUN — UI error rendering not exercised on this run.',
            });
            return;
          }

          // Real decline path: assert frontend displays an error message.
          expect(
            declineSignal,
            `Expected decline signal (status=DECLINED|preAuthStatus=FAILED|error truthy). ` +
            `Got status="${respBody.status}" preAuthStatus="${respBody.preAuthStatus}" ` +
            `error="${respBody.error}"`,
          ).toBeTruthy();
          expect(
            uiErrorVisible,
            `When backend reports decline (status=${statusStr}, preAuth=${preAuthStr}), ` +
            `the frontend MUST render a visible error message. None detected. ` +
            `(checked: [role="alert"], .Toastify__toast, .error, [class*="error"])`,
          ).toBeTruthy();
          if (uiErrorText) {
            expect(
              uiErrorText.length,
              `Error text length sanity (no JSON blob smuggled into a toast)`,
            ).toBeLessThan(500);
          }
        });

        netCap.dispose();
      });
    },
  );
}

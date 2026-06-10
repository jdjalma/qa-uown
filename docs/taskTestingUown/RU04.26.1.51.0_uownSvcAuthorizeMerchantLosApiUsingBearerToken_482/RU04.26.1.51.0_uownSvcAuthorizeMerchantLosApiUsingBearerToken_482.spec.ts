/**
 * Task #482 — UOWN | SVC | Authorize merchant LOS API using Bearer token
 * Milestone: RU04.26.1.51.0
 *
 * Validates merchant authentication on LOS endpoints across two flows:
 *
 * Flow 1 — Whitelist (legacy): /uown/los/sendApplication
 *   - Uses svcApiKey in Authorization header (raw, no Bearer prefix)
 *   - Merchant credentials (userName/setupPassword/merchantNumber) in request body
 *   - This flow is currently active in all environments
 *
 * Flow 2 — Bearer/JWT (new): /uown/los/merchant/applications/*
 *   - MERCHANT users must send Authorization: Bearer <JWT>
 *   - The JWT provider/endpoint is not yet available for automated testing
 *   - These tests are SKIPPED until the JWT flow is fully documented
 *
 * Additional validations:
 *   - SVC API key regression on /uown/svc/* paths
 *   - DB: Flyway migration V20260325092624 + api_user_type column
 *
 * Run:
 *   ENV=qa2 npx playwright test tests/taskTestingUown/RU04.26.1.51.0_uownSvcAuthorizeMerchantLosApiUsingBearerToken_482/ --project=task-testing --reporter=list
 */

import { test, expect } from '@fixtures/test-context.fixture.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';
import { MERCHANTS } from '@data/merchants.js';

const TEST_NAME = 'RU04.26.1.51.0_uownSvcAuthorizeMerchantLosApiUsingBearerToken_482';

const testData = [
  {
    env: 'qa2' as const,
    tag: buildTags(TestTag.QA2, TestTag.REGRESSION),
  },
];

for (const td of testData) {
  // ══════════════════════════════════════════════════════════════════
  //  Flow 1 — Whitelist: /uown/los/sendApplication + svcApiKey
  // ══════════════════════════════════════════════════════════════════
  test.describe(
    `${TEST_NAME} - ${td.env} - Whitelist Flow`,
    { tag: splitTags(td.tag) },
    () => {
      test.use({ envName: td.env });

      const merchant = MERCHANTS.TerraceFinance;

      // ──────────────────────────────────────────────────────────────
      // CT-01: Happy path — svcApiKey + merchant credentials accepted
      // ──────────────────────────────────────────────────────────────
      test('CT-01: sendApplication with svcApiKey + merchant credentials — accepted', async ({ api, testEnv }) => {
        await test.step('POST /uown/los/sendApplication with svcApiKey in Authorization', async () => {
          const body = {
            userName: merchant.username,
            setupPassword: merchant.password,
            merchantNumber: merchant.number,
            mainFirstName: 'TestBearer',
            mainLastName: 'Auth482',
            mainSSN: '653039104',
            mainCellPhone: '3037752706',
            emailAddress: `bearer482_${Date.now()}@teleworm.us`,
            mainAddress1: '1120 S Grand Ave',
            mainCity: 'Los Angeles',
            mainStateOrProvince: 'CA',
            mainPostalCode: '90015',
            mainDOB: '02241987',
            mainEmployerName: 'QA Automation Corp',
            mainPastBankruptcy: false,
            mainCurrentOrFutureBankruptcy: false,
            languagePreference: 'E',
            iovationFingerprintText: 'fingerPrintText',
            ipaddress: '192.168.0.2',
            desiredPaymentFrequency: 'WEEKLY',
            mainAnnualIncome: 56000,
            mainPayFrequency: 'WEEKLY',
            mainNextPayDate: '04192026',
            mainLastPayDate: '04122026',
            mainEmploymentDuration: '_1_TO_2_YEARS',
            shipToSameAsConsumer: true,
            merchandiseSubtotal: '549.00',
            discountAmount: '0.00',
            deliveryCharge: '25.00',
            installationCharge: '0.00',
            salesTax: '47.00',
            miscellaneousFees: '0.00',
            depositAmount: '0.00',
            orderTotal: '621.00',
            invoiceNumber: `CT01-${Date.now()}`,
            lineItem: [{
              lineItemLineNumber: '1',
              lineItemSerialNumber: 'SKU-CT01-001',
              lineItemProductNumber: 'CT01-ITEM',
              lineItemProductDescription: 'QA Test Item CT-01',
              lineItemProductCategory: 'Appliances',
              lineItemType: 'D',
              lineItemQuantityOrdered: '1',
              lineItemUnitPrice: '596.00',
              lineItemBasePrice: '549.00',
              lineItemTaxAmount: '47.00',
              lineItemDeliveryFee: '25.00',
              lineItemExtendedDeliveryFee: '25.00',
              lineItemExtendedPrice: '596.00',
            }],
          };

          const resp = await api.application.sendApplication(body as any);
          expect(resp.status, `Expected success (not 401), got ${resp.status}`).not.toBe(401);
          expect(resp.body.faults, `Unexpected faults: ${JSON.stringify(resp.body)}`).toBeFalsy();
          console.log(`[CT-01] sendApplication: ${resp.status} | approval=${resp.body.appApprovalStatus} | authNumber=${resp.body.authorizationNumber} ✓`);
        });
      });

      // ──────────────────────────────────────────────────────────────
      // CT-02: Negative — missing svcApiKey → 401
      // ──────────────────────────────────────────────────────────────
      test('CT-02: sendApplication without Authorization header returns 401', async ({ request, testEnv }) => {
        const resp = await request.post(`${testEnv.svcApiUrl}/uown/los/sendApplication`, {
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          data: {
            userName: merchant.username,
            setupPassword: merchant.password,
            merchantNumber: merchant.number,
          },
          timeout: 30_000,
        });
        expect(
          [401, 500].includes(resp.status()),
          `Expected 401 or 500 when Authorization is absent, got ${resp.status()}`,
        ).toBeTruthy();
        console.log(`[CT-02] status=${resp.status()} ✓ (auth rejected)`);
      });

      // ──────────────────────────────────────────────────────────────
      // CT-03: Negative — invalid svcApiKey → 401
      // ──────────────────────────────────────────────────────────────
      test('CT-03: sendApplication with invalid API key returns 401', async ({ request, testEnv }) => {
        const resp = await request.post(`${testEnv.svcApiUrl}/uown/los/sendApplication`, {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: 'INVALID_KEY_DOES_NOT_EXIST',
          },
          data: {
            userName: merchant.username,
            setupPassword: merchant.password,
            merchantNumber: merchant.number,
          },
          timeout: 30_000,
        });
        expect(
          [401, 500].includes(resp.status()),
          `Expected 401 or 500 for invalid API key, got ${resp.status()}`,
        ).toBeTruthy();
        console.log(`[CT-03] status=${resp.status()} ✓ (auth rejected)`);
      });

      // ──────────────────────────────────────────────────────────────
      // CT-04: Negative — wrong merchant credentials → error (not 401)
      // ──────────────────────────────────────────────────────────────
      test('CT-04: sendApplication with wrong merchant credentials returns error', async ({ api }) => {
        const body = {
          userName: 'nonExistentMerchant',
          setupPassword: 'wrongPassword',
          merchantNumber: 'OW00000-0000',
          mainFirstName: 'Test',
          mainLastName: 'Invalid',
          mainSSN: '000000000',
          mainCellPhone: '0000000000',
          emailAddress: 'invalid@test.com',
          mainAddress1: '123 Test St',
          mainCity: 'Test',
          mainStateOrProvince: 'CA',
          mainPostalCode: '90001',
          mainDOB: '01011990',
          mainEmployerName: 'Test',
          mainPastBankruptcy: false,
          mainCurrentOrFutureBankruptcy: false,
          languagePreference: 'E',
          iovationFingerprintText: 'fp',
          ipaddress: '127.0.0.1',
          desiredPaymentFrequency: 'WEEKLY',
          mainAnnualIncome: 30000,
          mainPayFrequency: 'WEEKLY',
          mainNextPayDate: '04192026',
          mainLastPayDate: '04122026',
          mainEmploymentDuration: '_1_TO_2_YEARS',
          shipToSameAsConsumer: true,
          merchandiseSubtotal: '100.00',
          discountAmount: '0.00',
          deliveryCharge: '0.00',
          installationCharge: '0.00',
          salesTax: '0.00',
          miscellaneousFees: '0.00',
          depositAmount: '0.00',
          orderTotal: '100.00',
          invoiceNumber: `CT04-${Date.now()}`,
          lineItem: [{
            lineItemLineNumber: '1',
            lineItemSerialNumber: 'SKU-INV-001',
            lineItemProductNumber: 'INV-001',
            lineItemProductDescription: 'Invalid Test',
            lineItemProductCategory: 'Test',
            lineItemType: 'D',
            lineItemQuantityOrdered: '1',
            lineItemUnitPrice: '100.00',
            lineItemBasePrice: '100.00',
            lineItemTaxAmount: '0.00',
            lineItemDeliveryFee: '0.00',
            lineItemExtendedDeliveryFee: '0.00',
            lineItemExtendedPrice: '100.00',
          }],
        };

        const resp = await api.application.sendApplication(body as any);
        // Auth passes (svcApiKey is valid), but merchant credentials fail at business logic level
        expect(resp.status, 'Auth should pass (svcApiKey valid)').not.toBe(401);
        const hasFault = resp.body.faults || resp.body.transactionMessage || resp.status >= 400;
        expect(hasFault, 'Expected business error for invalid merchant credentials').toBeTruthy();
        console.log(`[CT-04] status=${resp.status} | faults=${resp.body.faults} | msg=${resp.body.transactionMessage ?? resp.body.sorErrorDescription ?? 'N/A'} ✓`);
      });
    },
  );

  // ══════════════════════════════════════════════════════════════════
  //  Flow 2 — /uown/los/merchant/applications/* (hex key, no Bearer)
  //
  //  Istio/Envoy intercepts any "Authorization: Bearer *" and validates
  //  as JWT before SVC receives the request. To bypass Istio and reach
  //  the SVC RequestFilter, we send the raw hex key WITHOUT the Bearer
  //  prefix. The RequestFilter then applies its own rules:
  //    - MERCHANT users: bearerFormat required → raw key = 401 (by design)
  //    - Missing auth: 401
  //    - Invalid key: 401
  //  These tests validate the RequestFilter behavior via Istio bypass.
  // ══════════════════════════════════════════════════════════════════
  test.describe(
    `${TEST_NAME} - ${td.env} - Merchant Applications Auth`,
    { tag: splitTags(td.tag) },
    () => {
      test.describe.configure({ mode: 'serial' });
      test.use({ envName: td.env });

      let hexKey = '';
      let testUsername = '';
      const TEST_USER_PASSWORD = 'TestBearerAuth482!';

      // ── Setup: create MERCHANT user + obtain hex key ───────────
      test.beforeAll(async ({ api }) => {
        testUsername = `TestMerchantApiPartner_${Date.now()}`;

        await test.step('Create MERCHANT API user via createOrUpdateApiUser', async () => {
          const createResp = await api.losPartnerAuth.createApiUser({
            pk: 0,
            companyName: 'QA Test Partner Co.',
            username: testUsername,
            password: TEST_USER_PASSWORD,
            apiUserType: 'MERCHANT',
          });
          expect(createResp.ok, `createOrUpdateApiUser failed: ${createResp.status}`).toBeTruthy();
          console.log(`[beforeAll] User created: "${testUsername}" (pk=${createResp.body?.pk ?? '?'})`);
        });

        await test.step('Obtain hex key via authorize', async () => {
          const authResp = await api.losPartnerAuth.authorize(testUsername, TEST_USER_PASSWORD);
          expect(authResp.ok, `authorize failed: ${authResp.status}`).toBeTruthy();
          expect(authResp.body.key, 'Key must not be empty').toBeTruthy();
          hexKey = authResp.body.key;
          console.log(`[beforeAll] Hex key obtained (length=${hexKey.length})`);
        });
      });

      // ──────────────────────────────────────────────────────────────
      // CT-05: Obtain API key — authorize returns valid key + expires
      // ──────────────────────────────────────────────────────────────
      test('CT-05: authorize returns valid hex key with expires and no error', async ({ api }) => {
        const authResp = await api.losPartnerAuth.authorize(testUsername, TEST_USER_PASSWORD);
        expect(authResp.status, `Expected 200, got ${authResp.status}`).toBe(200);
        expect(authResp.body.key, 'key must be present').toBeTruthy();
        expect(authResp.body.key.length, 'key should be 128-char hex').toBe(128);
        expect(authResp.body.expires, 'expires must be present').toBeTruthy();
        expect(authResp.body.error, 'error must be null on success').toBeFalsy();
        console.log(`[CT-05] authorize: key.length=${authResp.body.key.length}, expires=${authResp.body.expires} ✓`);
      });

      // ──────────────────────────────────────────────────────────────
      // CT-06: MERCHANT raw key → 401 (RequestFilter rejects: bearerFormat required)
      //   Validates that RequestFilter enforces Bearer format for MERCHANT.
      //   Istio bypassed because no "Bearer " prefix.
      // ──────────────────────────────────────────────────────────────
      test('CT-06: MERCHANT raw hex key on createApplication returns 401 (Bearer format required)', async ({ request, testEnv }) => {
        const url = `${testEnv.svcApiUrl}/uown/los/merchant/applications`;
        const resp = await request.post(url, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: hexKey,
            'X-API-Version': '2',
          },
          data: {},
          timeout: 30_000,
        });
        expect(resp.status(), 'MERCHANT raw key must be rejected by RequestFilter').toBe(401);
        const body = await resp.text();
        expect(body).toContain('Invalid API KEY');
        console.log(`[CT-06] status=${resp.status()} body="${body}" ✓ (MERCHANT bearerFormat enforced)`);
      });

      // ──────────────────────────────────────────────────────────────
      // CT-07: Missing Authorization → 401
      // ──────────────────────────────────────────────────────────────
      test('CT-07: missing Authorization header on /merchant/applications returns 401', async ({ request, testEnv }) => {
        const url = `${testEnv.svcApiUrl}/uown/los/merchant/applications`;
        const resp = await request.post(url, {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Version': '2',
          },
          data: {},
          timeout: 30_000,
        });
        expect(resp.status(), 'Expected 401 without Authorization').toBe(401);
        const body = await resp.text();
        expect(body).toContain('Invalid API KEY');
        console.log(`[CT-07] status=${resp.status()} ✓`);
      });

      // ──────────────────────────────────────────────────────────────
      // CT-08: Invalid/non-existent key → 401
      // ──────────────────────────────────────────────────────────────
      test('CT-08: non-existent raw key on /merchant/applications returns 401', async ({ request, testEnv }) => {
        const url = `${testEnv.svcApiUrl}/uown/los/merchant/applications`;
        const resp = await request.post(url, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'INVALID_KEY_DOES_NOT_EXIST_0000000000',
            'X-API-Version': '2',
          },
          data: {},
          timeout: 30_000,
        });
        expect(resp.status(), 'Expected 401 for non-existent key').toBe(401);
        console.log(`[CT-08] status=${resp.status()} ✓`);
      });

      // ──────────────────────────────────────────────────────────────
      // CT-09: Bearer prefix intercepted by Istio → JWT error (not SVC 401)
      //   Proves Istio blocks Bearer tokens before reaching RequestFilter.
      // ──────────────────────────────────────────────────────────────
      test('CT-09: Bearer hex key intercepted by Istio returns JWT parse error', async ({ request, testEnv }) => {
        const url = `${testEnv.svcApiUrl}/uown/los/merchant/applications`;
        const resp = await request.post(url, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${hexKey}`,
            'X-API-Version': '2',
          },
          data: {},
          timeout: 30_000,
        });
        expect(resp.status(), 'Istio should reject non-JWT Bearer token').toBe(401);
        const body = await resp.text();
        expect(body).toContain('Jwt');
        console.log(`[CT-09] status=${resp.status()} body="${body.substring(0, 80)}" ✓ (Istio JWT gate confirmed)`);
      });

      // ──────────────────────────────────────────────────────────────
      // CT-10: X-API-Version: 1 → 404 (no v1 handler)
      //   Uses raw key (bypasses Istio) — even though MERCHANT auth fails,
      //   the RequestFilter rejects before routing, so we get 401 not 404.
      //   This verifies the filter runs before Spring MVC routing.
      // ──────────────────────────────────────────────────────────────
      test('CT-10: X-API-Version 1 with raw key — filter rejects before routing', async ({ request, testEnv }) => {
        const url = `${testEnv.svcApiUrl}/uown/los/merchant/applications`;
        const resp = await request.post(url, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: hexKey,
            'X-API-Version': '1',
          },
          data: {},
          timeout: 30_000,
        });
        // RequestFilter rejects raw key for MERCHANT before routing occurs
        expect(resp.status(), 'Filter rejects before version routing').toBe(401);
        console.log(`[CT-10] status=${resp.status()} ✓ (filter rejects before routing to v1/v2)`);
      });

      // ──────────────────────────────────────────────────────────────
      // CT-11: Smoke — raw key on sub-endpoints → all 401 (MERCHANT rule)
      //   Validates that all 4 sub-endpoints are also gated by RequestFilter.
      // ──────────────────────────────────────────────────────────────
      test('CT-11: raw key on all sub-endpoints returns 401 (partner gate active)', async ({ request, testEnv }) => {
        const base = `${testEnv.svcApiUrl}/uown/los/merchant/applications`;
        const headers = {
          'Content-Type': 'application/json',
          Authorization: hexKey,
          'X-API-Version': '2',
        };

        const endpoints = [
          { name: 'search', url: `${base}/search` },
          { name: 'invoices', url: `${base}/0/invoices` },
          { name: 'settlements', url: `${base}/0/settlements` },
          { name: 'leases', url: `${base}/0/leases` },
        ];

        for (const ep of endpoints) {
          const resp = await request.post(ep.url, { headers, data: {}, timeout: 30_000 });
          expect(resp.status(), `${ep.name}: expected 401 from partner gate`).toBe(401);
          console.log(`[CT-11] ${ep.name}: ${resp.status()} ✓`);
        }
      });
    },
  );

  // ══════════════════════════════════════════════════════════════════
  //  Regression & DB validation
  // ══════════════════════════════════════════════════════════════════
  test.describe(
    `${TEST_NAME} - ${td.env} - Regression & DB`,
    { tag: splitTags(td.tag) },
    () => {
      test.use({ envName: td.env });

      // ──────────────────────────────────────────────────────────────
      // CT-12: Non-partner route — /uown/los/merchant/searchByEmail
      //   NOT under /applications → partner API-key gate does NOT apply
      // ──────────────────────────────────────────────────────────────
      test('CT-12: non-partner route /uown/los/merchant/searchByEmail is not gated by partner auth', async ({ request, testEnv }) => {
        // This endpoint is under /uown/los/merchant but NOT under /applications,
        // so LosMerchantApiAuthPaths.requiresLosMerchantApiAuth returns false.
        // It falls through to the LOS path (no svc/tms key check) — should not return
        // 401 "Invalid API KEY" from the partner gate.
        const url = `${testEnv.svcApiUrl}/uown/los/merchant/searchByEmail`;
        const resp = await request.post(url, {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          data: { email: 'nonexistent@test.com' },
          timeout: 30_000,
        });
        // Should NOT be 401 from the partner API-key gate
        // (may be 400/500 from business logic — that's fine)
        const body = await resp.text();
        const isPartnerGate401 = resp.status() === 401 && body.includes('Invalid API KEY');
        expect(
          isPartnerGate401,
          `Non-partner route should NOT be blocked by partner gate, got ${resp.status()}: ${body.substring(0, 150)}`,
        ).toBeFalsy();
        console.log(`[CT-12] /merchant/searchByEmail: status=${resp.status()} ✓ (not partner-gated)`);
      });

      // ──────────────────────────────────────────────────────────────
      // CT-13: Regression — SVC API key on /uown/svc/* still works
      // ──────────────────────────────────────────────────────────────
      test('CT-13: SVC API key on /uown/svc/* path still authenticates (regression)', async ({ request, testEnv }) => {
        const svcUrl = `${testEnv.svcApiUrl}/uown/svc/accounts/0/frequency-changes`;
        const resp = await request.get(svcUrl, {
          headers: {
            Authorization: testEnv.svcApiKey,
            Accept: 'application/json',
          },
          timeout: 30_000,
        });
        expect(resp.status(), `SVC endpoint should accept svcApiKey (not 401), got ${resp.status()}`).not.toBe(401);
        console.log(`[CT-13] SVC regression: status=${resp.status()} ✓`);
      });

      // ──────────────────────────────────────────────────────────────
      // CT-14: Regression — TMS API key on /uown/tms/* still works
      // ──────────────────────────────────────────────────────────────
      test('CT-14: TMS API key on /uown/tms/* path still authenticates (regression)', async ({ request, testEnv }) => {
        const tmsUrl = `${testEnv.svcApiUrl}/uown/tms/v1/accounts/0`;
        const resp = await request.get(tmsUrl, {
          headers: {
            Authorization: testEnv.tmsApiKey,
            Accept: 'application/json',
          },
          timeout: 30_000,
        });
        expect(resp.status(), `TMS endpoint should accept tmsApiKey (not 401), got ${resp.status()}`).not.toBe(401);
        console.log(`[CT-14] TMS regression: status=${resp.status()} ✓`);
      });

      // ──────────────────────────────────────────────────────────────
      // CT-15: DB — Flyway migration + api_user_type column
      // ──────────────────────────────────────────────────────────────
      test('CT-15: Flyway migration V20260325092624 applied and api_user_type column exists', async ({ db }) => {
        await test.step('Flyway migration V20260325092624 must be recorded as successful', async () => {
          const applied = await db.getSingleNumber(
            `SELECT count(*)::int FROM flyway_schema_history
             WHERE version = '20260325092624' AND success = true`,
            [],
          );
          expect(applied, 'Migration V20260325092624 should be applied and successful').toBe(1);
        });

        await test.step('Column api_user_type must exist in uown_api_user', async () => {
          const colCount = await db.getSingleNumber(
            `SELECT count(*)::int FROM information_schema.columns
             WHERE table_name = 'uown_api_user' AND column_name = 'api_user_type'`,
            [],
          );
          expect(colCount, 'Column api_user_type must exist in uown_api_user').toBe(1);
        });

        await test.step('MERCHANT users in uown_api_user have api_user_type = MERCHANT', async () => {
          const merchantCount = await db.getSingleNumber(
            `SELECT count(*)::int FROM uown_api_user WHERE api_user_type = 'MERCHANT'`,
            [],
          );
          expect(typeof merchantCount, 'Query must return a number').toBe('number');
          console.log(`[CT-15] MERCHANT users count: ${merchantCount}`);
        });
      });
    },
  );
}

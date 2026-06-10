/**
 * E2E Test: SEON ID Verification Flow — FifthAveFurnitureNY (KS3015)
 *
 * Validates the full application lifecycle for a merchant with
 * `isSeonIdCheckRequired = true`. Since SEON SDK requires camera interaction
 * (document scan + selfie/liveness), the verification is bypassed via API
 * before proceeding with the UI contract flow.
 *
 * Hybrid Flow:
 *   1. [API]  sendApplication → extract contractUrl + leadPk
 *   2. [API]  getApplicationStatus → verify APPROVED + extract leadPk
 *   3. [API]  SEON bypass: api.seon.approveVerification()
 *   4. [UI]   Navigate to contract URL → dismiss SEON overlay
 *   5. [UI]   Fill CC + bank info → submit payment
 *   6. [UI]   Complete Terms & Conditions
 *   7. [UI]   Complete e-sign (Signwell/PandaDocs iframe)
 *   8. [UI]   Origination portal → verify lead status advanced
 *
 * Environment: stg (FifthAveFurnitureNY available with SEON enabled)
 * Merchant: FifthAveFurnitureNY (KS3015, Kornerstone, isSeonIdCheckRequired=true)
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { ContractPage, OriginationCustomerPage } from '@pages/index.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';
import { TEST_CARDS, TEST_BANK } from '@config/index.js';
import { buildTestData, loginToPortalWithOptions, sleep } from '@helpers/index.js';

const testData = {
  state: 'NY',
  merchant: 'FifthAveFurnitureNY',
  orderTotal: '1500',
  tag: buildTags(TestTag.REGRESSION),
};

test.describe(
  `SEON E2E Flow - ${testData.merchant}`,
  { tag: splitTags(testData.tag) },
  () => {
    test(`Full lifecycle with SEON bypass + contract UI: ${testData.state}/${testData.merchant}`, async ({
      page,
      api,
      db,
      merchantConfig: mSetup,
      ctx,
    }) => {
      test.setTimeout(600_000); // 10 min — includes e-sign iframe wait

      await test.step('Ensure merchant config', async () => {
        try {
          await mSetup.configureByName(testData.merchant, 'lifecycle');
        } catch (err) {
          // Merchant may not be resolvable by refCode in all envs — proceed with defaults
          console.log(`[Setup] MerchantConfigurator skipped: ${(err as Error).message}`);
        }
      });

      const { env, merchant, applicant, order } = buildTestData({
        state: testData.state,
        merchant: testData.merchant,
        orderTotal: testData.orderTotal,
        orderDescription: 'SEON E2E flow test',
      });

      // ═══════════════════════════════════════════════════════════════
      //  PHASE 1: APPLICATION CREATION via API
      // ═══════════════════════════════════════════════════════════════

      await test.step('CT-01: Create application via sendApplication', async () => {
        const response = await api.application.sendApplication(merchant, applicant, order);
        console.log(`[Phase 1] sendApplication status=${response.status} body=${JSON.stringify(response.body)}`);
        expect(response.ok, `sendApplication responded with ${response.status}: ${JSON.stringify(response.body)}`).toBeTruthy();

        ctx.leadPk = String(response.body.authorizationNumber ?? '');
        ctx.leadUuid = response.body.accountNumber ?? ctx.leadPk;

        // Extract contract URL from paymentDetailsList
        const pdl = response.body.paymentDetailsList;
        expect(pdl?.length, 'paymentDetailsList should not be empty').toBeGreaterThan(0);
        const idx = pdl!.length > 1 ? 1 : 0;
        ctx.contractUrl = pdl![idx].redirectUrl ?? '';
        expect(ctx.contractUrl, 'Contract URL (redirectUrl) must be present').toBeTruthy();

        test.info().annotations.push(
          { type: 'leadPk', description: ctx.leadPk },
          { type: 'leadUuid', description: ctx.leadUuid },
          { type: 'contractUrl', description: ctx.contractUrl },
        );
        console.log(`[Phase 1] leadPk="${ctx.leadPk}" leadUuid="${ctx.leadUuid}"`);
        console.log(`[Phase 1] contractUrl: "${ctx.contractUrl}"`);
      });

      await test.step('CT-02: Verify APPROVED status and extract leadPk', async () => {
        await sleep(5_000);

        const response = await api.application.getApplicationStatus(merchant, ctx.leadUuid);
        expect(response.ok, `getApplicationStatus responded with ${response.status}`).toBeTruthy();

        const status = (
          response.body.appApprovalStatus ||
          response.body.uwStatus ||
          response.body.currentStatus ||
          response.body.status
        ) ?? '';
        expect(status?.toLowerCase(), `Expected APPROVED but got: ${status}`).toContain('approved');

        // Update leadPk from status response if available (more reliable)
        if (response.body.leadPk) {
          ctx.leadPk = String(response.body.leadPk);
        }
        expect(Number(ctx.leadPk), 'leadPk should be a positive number').toBeGreaterThan(0);

        console.log(`[Phase 1] Confirmed APPROVED, leadPk=${ctx.leadPk}`);
      });

      // ═══════════════════════════════════════════════════════════════
      //  PHASE 2: SEON BYPASS via API
      // ═══════════════════════════════════════════════════════════════

      await test.step('CT-03: Bypass SEON ID verification via API', async () => {
        // DOB from applicant is MM/DD/YYYY → convert to YYYY-MM-DD for Java LocalDate
        const [month, day, year] = applicant.dob.split('/');
        const birthDateISO = `${year}-${month}-${day}`;

        const response = await api.seon.approveVerification({
          leadPk: Number(ctx.leadPk),
          fullName: `${applicant.firstName} ${applicant.lastName}`,
          birthDate: birthDateISO,
        });

        expect(response.ok, `SEON createOrUpdate responded with ${response.status}`).toBeTruthy();
        expect(response.body.status, 'SEON status should be APPROVED').toBe('APPROVED');
        expect(response.body.success, 'SEON success should be true').toBe(true);

        test.info().annotations.push({ type: 'seonVerification', description: 'APPROVED (full validation)' });
        console.log('[Phase 2] SEON verification record created (full validation path)');
      });

      await test.step('CT-04: Verify SEON record in database', async () => {
        const seonRecord = await db.queryOne<{
          status: string;
          success: boolean;
          id_verify_success: boolean;
        }>(
          `SELECT status, success, id_verify_success
           FROM uown_seon WHERE lead_pk = $1 ORDER BY pk DESC LIMIT 1`,
          [Number(ctx.leadPk)],
        );

        expect(seonRecord, 'SEON record should exist in database').not.toBeNull();
        expect(seonRecord!.status).toBe('APPROVED');
        expect(seonRecord!.success).toBe(true);
        console.log(`[Phase 2] SEON DB record verified: status=APPROVED, success=true, id_verify_success=${seonRecord!.id_verify_success}`);
      });

      // ═══════════════════════════════════════════════════════════════
      //  PHASE 3: CONTRACT UI — CC/bank, T&C, e-sign
      // ═══════════════════════════════════════════════════════════════

      await test.step('CT-05: Navigate to contract URL and fill payment info', async () => {
        expect(ctx.contractUrl, 'Contract URL must be available').toBeTruthy();
        console.log(`[Phase 3] Navigating to: ${ctx.contractUrl}`);
        await page.goto(ctx.contractUrl!, { waitUntil: 'domcontentloaded', timeout: 60_000 });
        await page.waitForLoadState('networkidle').catch(() => {});

        const contract = new ContractPage(page);
        await contract.waitForSpinner();

        // Dismiss SEON overlay if present (shows QR code modal in some envs)
        await contract.dismissSeonOverlay();

        // Fill CC info
        const ccCard = TEST_CARDS.DISCOVER_APPROVED;
        await contract.fillCreditCardInfo({
          firstName: applicant.firstName,
          lastName: applicant.lastName,
          cardNumber: ccCard.number,
          cvc: ccCard.cvv,
          expDate: `${ccCard.expMonth}/${ccCard.expYear}`,
        });
        console.log('[Phase 3] CC info filled');

        // Fill bank info
        await contract.fillBankInfo({
          firstName: applicant.firstName,
          lastName: applicant.lastName,
          routingNumber: TEST_BANK.DEFAULT_ROUTING,
          accountNumber: TEST_BANK.DEFAULT_ACCOUNT,
        });
        console.log('[Phase 3] Bank info filled');

        // Submit payment form
        await contract.submitPaymentInfo();
        console.log('[Phase 3] Payment info submitted');
      });

      await test.step('CT-06: Complete Terms & Conditions', async () => {
        const contract = new ContractPage(page);
        await contract.completeTermsAndConditions();
        console.log('[Phase 3] Terms & conditions completed');
      });

      await test.step('CT-07: Complete e-sign via embedded iframe', async () => {
        const contract = new ContractPage(page);
        await contract.completeESign();
        console.log('[Phase 3] E-sign completed');

        // View completed document if available
        await contract.viewCompletedDocument();
      });

      // ═══════════════════════════════════════════════════════════════
      //  PHASE 4: ORIGINATION PORTAL — Verify lead status
      // ═══════════════════════════════════════════════════════════════

      await test.step('CT-08: Login to origination portal and verify status', async () => {
        await loginToPortalWithOptions(page, env.originationUrl, env);

        const customerUrl = `${env.originationUrl}customers/${ctx.leadPk}`;
        console.log(`[Phase 4] Navigating to customer page: ${customerUrl}`);
        await page.goto(customerUrl, { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle').catch(() => {});

        const customerPage = new OriginationCustomerPage(page);
        await customerPage.waitForSpinner();

        // Click "Get Document Status" to trigger backend sync
        const getDocStatusBtn = page.locator("xpath=//*[text()='Get Document Status']");
        if (await getDocStatusBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
          await getDocStatusBtn.click({ force: true });
          console.log('[Phase 4] Clicked "Get Document Status"');
          await sleep(5_000);
          await customerPage.waitForSpinner();
        }

        // Poll for lead status to advance beyond contract
        const { status: finalStatus, matched } = await customerPage.pollForLeadStatus(
          ['signed', 'contract_created', 'settled', 'fund'], 12, 5_000,
        );

        test.info().annotations.push({ type: 'finalStatus', description: finalStatus || 'unknown' });
        console.log(`[Phase 4] Final lead status: "${finalStatus}" (matched=${matched})`);

        // After e-sign, lead should be at CONTRACT_CREATED or beyond
        const statusLower = finalStatus.toLowerCase();
        const validStatuses = ['contract_created', 'signed', 'settled', 'fund', 'cc_auth'];
        expect(
          validStatuses.some(s => statusLower.includes(s)),
          `Expected CONTRACT_CREATED or beyond, got: ${finalStatus}`,
        ).toBeTruthy();
      });
    });
  },
);

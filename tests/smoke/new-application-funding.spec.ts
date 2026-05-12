/**
 * Smoke Test — Happy Path
 *
 * Validates the complete application lifecycle end-to-end:
 *   1. sendApplication (API) → UW_APPROVED
 *   2. sendInvoice (API)
 *   3. Navigate to contract URL → fill CC + bank info (UI)
 *   4. Complete T&C + e-sign via Signwell (UI)
 *   5. getApplicationStatus (API) → verify SIGNED
 *   6. settleApplication (API) → funding
 *   7. getApplicationStatus (API) → verify FUNDING/FUNDED
 *
 * Replaces manual Postman smoke test — Signwell e-sign is automated via
 * ContractPage.completeESign(). No manual steps required.
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { ContractPage } from '@pages/origination/index.js';
import { TestTag, buildTags } from '@ptypes/enums.js';
import { buildTestData, setupApplicationViaApi, sleep } from '@helpers/index.js';
import { TEST_BANK, TEST_CARDS } from '@config/constants.js';

const testData = {
  state: 'TX',
  merchant: 'TireAgent',
  tag: buildTags(TestTag.SMOKE, TestTag.SANITY),
};

test.describe(`Smoke - Happy Path`, { tag: testData.tag.split(' ') }, () => {
  test('sendApplication → sign contract → settle → funded', async ({ page, api, ctx, merchantConfig: mSetup }) => {
    test.setTimeout(300_000); // 5 min — includes browser e-sign flow

    await test.step('Ensure merchant config', async () => {
      await mSetup.configureByName(testData.merchant, 'lifecycle');
    });

    const { merchant, applicant, order } = buildTestData({
      state: testData.state,
      merchant: testData.merchant,
      orderTotal: '600',
      orderDescription: 'Smoke test',
      sanitizeNames: true,
    });

    // ── Phase 1: Create application via API ──────────────────────────

    await test.step('1. sendApplication + invoice → UW_APPROVED', async () => {
      await setupApplicationViaApi(api, {
        merchant,
        applicant,
        order,
        env: process.env.ENV || 'sandbox',
        verifyApproval: true,
        extractContractUrl: true,
        skipCreditCardAuth: true,
        skipInvoice: true, // order already in sendApplication — sendInvoice would invalidate contractUrl
      }, test.info(), ctx);
      expect(ctx.contractUrl, 'Contract URL not returned from sendApplication').toBeTruthy();
      console.log(`[Smoke] leadPk=${ctx.leadPk} leadUuid=${ctx.leadUuid}`);
      console.log(`[Smoke] contractUrl=${ctx.contractUrl}`);
    });

    // ── Phase 2: Fill contract form + sign ───────────────────────────

    await test.step('2. Fill CC + bank info on contract page', async () => {
      await page.goto(ctx.contractUrl);
      const contractPage = new ContractPage(page);

      await contractPage.dismissSeonOverlay();

      await contractPage.fillCreditCardInfo({
        firstName: applicant.firstName,
        lastName: applicant.lastName,
        cardNumber: TEST_CARDS.VISA_APPROVED.number,
        cvc: TEST_CARDS.VISA_APPROVED.cvv,
        expDate: TEST_CARDS.VISA_APPROVED.expirationDate,
      });

      await contractPage.fillBankInfo({
        firstName: applicant.firstName,
        lastName: applicant.lastName,
        routingNumber: TEST_BANK.DEFAULT_ROUTING,
        accountNumber: TEST_BANK.DEFAULT_ACCOUNT_SHORT,
      });

      await contractPage.submitPaymentInfo();
    });

    await test.step('3. Complete T&C + e-sign (Signwell)', async () => {
      const contractPage = new ContractPage(page);
      await contractPage.completeTermsAndConditions();
      await contractPage.completeESign();
    });

    // ── Phase 3: Verify signed ────────────────────────────────────────

    await test.step('4. getApplicationStatus → SIGNED', async () => {
      // Signwell postMessage is async — UOWN backend may take several seconds to update hasSignedLease.
      // Poll up to 50s (10 × 5s) before failing.
      let hasSignedLease = false;
      let currentStatus = '';
      for (let attempt = 1; attempt <= 10; attempt++) {
        const resp = await api.application.getApplicationStatus(merchant, ctx.leadUuid);
        expect(resp.ok, `getApplicationStatus: ${resp.status}`).toBeTruthy();
        hasSignedLease = resp.body.hasSignedLease ?? false;
        currentStatus = resp.body.currentStatus ?? '';
        if (hasSignedLease) break;
        console.log(`[Smoke] Waiting for hasSignedLease... attempt=${attempt} status=${currentStatus}`);
        await sleep(5_000);
      }
      expect(hasSignedLease, 'hasSignedLease should be true after e-sign').toBeTruthy();
      expect(['CONTRACT_CREATED', 'SIGNED']).toContain(currentStatus);
      console.log(`[Smoke] Status after sign: ${currentStatus}`);
    });

    // ── Phase 4: Settle + verify funding ─────────────────────────────

    await test.step('5. settleApplication', async () => {
      const resp = await api.settlement.settleApplication(merchant, ctx.leadUuid);
      expect(resp.ok, `settleApplication failed: ${resp.status} ${resp.body.message ?? ''}`).toBeTruthy();
      console.log(`[Smoke] settleApplication: status=${resp.body.status}`);
    });

    await test.step('6. getApplicationStatus → FUNDING/FUNDED', async () => {
      const resp = await api.application.getApplicationStatus(merchant, ctx.leadUuid);
      expect(resp.ok, `getApplicationStatus: ${resp.status}`).toBeTruthy();
      expect(['FUNDING', 'FUNDED']).toContain(resp.body.currentStatus);
      expect(resp.body.fundRequestDateTime, 'fundRequestDateTime should be set').toBeTruthy();
      expect(resp.body.amountToBeFunded ?? 0, 'amountToBeFunded should be > 0').toBeGreaterThan(0);
      console.log(`[Smoke] Final: ${resp.body.currentStatus} amount=$${resp.body.amountToBeFunded}`);
    });
  });
});

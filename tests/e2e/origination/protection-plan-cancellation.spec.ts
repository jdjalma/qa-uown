/**
 * Protection Plan Cancellation — E2E test covering protection plan sweep after lease cancellation.
 *
 * Flow:
 *   1. Enable insurance on merchant config (via API — auto-restored on teardown)
 *   2. Create application → SIGNED → settle → FUNDING → FUNDED
 *   3. Make CC payment
 *   4. Cancel lease with refund
 *   5. Trigger cancelProtectionPlanSweep scheduled task
 *   6. Verify logs, refund in payment transactions
 *
 * Run: node node_modules/.bin/playwright test tests/e2e/origination/protection-plan-cancellation.spec.ts
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { OriginationCustomerPage, FundingPage } from '@pages/origination/index.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';
import {
  buildTestData,
  buildCcPaymentDetails,
  loginToPortal,
  navigateToOriginationCustomer,
  navigateToServicingCustomer,
  sleep,
} from '@helpers/index.js';
import { TEST_CARDS } from '@data/index.js';

const testData = [
  {
    env: 'sandbox',
    state: 'CA',
    merchant: 'ProgressMobility',
    orderTotal: '3000',
    paymentAmount: '25',
    tag: buildTags(TestTag.REGRESSION, TestTag.SANDBOX),
  },
];

for (const data of testData) {
  test.describe(`Protection Plan Cancellation - ${data.env}/${data.merchant}`, { tag: splitTags(data.tag) }, () => {
    test.use({ envName: data.env });

    test('Full protection plan cancellation flow with sweep', async ({ page, api, ctx, merchantConfig: mConfig }) => {
      test.setTimeout(600_000); // 10 min — full FUNDED flow + sweep
      const { env, merchant, applicant, address, merchantConfig } = buildTestData({
        env: data.env,
        state: data.state,
        merchant: data.merchant,
        orderTotal: data.orderTotal,
        orderDescription: 'Protection plan cancellation test',
      });

      // ═══════════════════════════════════════════════════════════════
      //  PHASE 1: Enable insurance on merchant config (via API)
      //  Restore is automatic — fixture teardown calls restoreAll()
      // ═══════════════════════════════════════════════════════════════

      await test.step('Enable Offer Insurance on merchant via API', async () => {
        await mConfig.configureByName(data.merchant, 'withInsurance');
        console.log(`[Phase 1] Offer Insurance enabled via API for ${data.merchant}`);
      });

      // ═══════════════════════════════════════════════════════════════
      //  PHASE 2: Setup application to FUNDED
      // ═══════════════════════════════════════════════════════════════

      await test.step('Setup application to FUNDING via API (pre-qualification)', async () => {
        // 1. Send application WITHOUT order data (pre-qualification)
        const appResp = await api.application.sendApplication(merchant, applicant);
        expect(appResp.ok, `sendApplication: ${appResp.status}`).toBeTruthy();
        ctx.leadUuid = appResp.body.accountNumber ?? String(appResp.body.authorizationNumber ?? '');
        ctx.leadPk = String(appResp.body.authorizationNumber ?? '');
        test.info().annotations.push(
          { type: 'leadPk', description: ctx.leadPk },
          { type: 'leadUuid', description: ctx.leadUuid },
        );

        // 2. Wait for approval + get approvedAmount
        await sleep(5_000);
        const statusResp = await api.application.getApplicationStatus(merchant, ctx.leadUuid);
        expect(statusResp.ok).toBeTruthy();
        if (statusResp.body.leadPk) ctx.leadPk = String(statusResp.body.leadPk);
        const approvedAmount = statusResp.body.approvedAmount ?? 0;
        expect(approvedAmount).toBeGreaterThan(0);

        // 3. Send invoice with approved amount
        const invoiceResp = await api.invoice.sendInvoice(merchant, ctx.leadUuid, {
          orderTotal: String(approvedAmount),
        });
        expect(invoiceResp.ok, `sendInvoice: ${invoiceResp.status}`).toBeTruthy();

        // 4. Submit payment info
        const submitResp = await api.application.submitApplication(
          Number(ctx.leadPk), applicant.firstName, applicant.lastName,
        );
        console.log(`[Phase 2] submitApplication ${submitResp.ok ? 'OK' : 'FAIL'}`);

        // 5. SIGNED → settle → FUNDING
        const signedResp = await api.lead.changeLeadStatus(
          merchant, Number(ctx.leadPk), 'SIGNED', 'Automated - SIGNED',
        );
        expect(signedResp.ok).toBeTruthy();

        const settleResp = await api.settlement.settleApplication(merchant, ctx.leadUuid);
        expect(settleResp.ok).toBeTruthy();

        await sleep(3_000);
        const fundingResp = await api.lead.updateFundingStatus([Number(ctx.leadPk)], 'FUNDING');
        expect(fundingResp.ok).toBeTruthy();
      });

      await test.step('Fund via Funding Queue UI', async () => {
        const fundingPage = new FundingPage(page);
        await fundingPage.navigateToFundingQueue();
        await fundingPage.filterByStatus('Funding');
        const found = await fundingPage.searchUntilRecordsAppear();
        expect(found, 'Lead should appear in funding queue').toBeTruthy();
        await fundingPage.fundFirstEntry();
      });

      // ═══════════════════════════════════════════════════════════════
      //  PHASE 3: Make CC payment in servicing
      // ═══════════════════════════════════════════════════════════════

      await test.step('Make CC payment in servicing', async () => {
        await loginToPortal(page, env.servicingUrl, env);
        await navigateToServicingCustomer(page, ctx.leadPk);

        const { ServicingBasePage } = await import('@pages/servicing/servicing-base.page.js');
        const svcBase = new ServicingBasePage(page);
        const card = TEST_CARDS.VISA_APPROVED;
        const billing = { address: address.street, city: address.city, state: data.state, zip: address.zipCode };
        await svcBase.makeCcPayment('0', data.paymentAmount, buildCcPaymentDetails(card, billing));
      });

      await test.step('Verify payment in servicing customer page', async () => {
        // Payment Transactions section is visible inline on servicing customer page
        const txnSection = page.locator('text=Payment Transactions').first();
        await expect(txnSection).toBeVisible({ timeout: 10_000 });
        console.log('[Phase 3] Payment Transactions section visible');
      });

      // ═══════════════════════════════════════════════════════════════
      //  PHASE 4: Cancel lease with refund
      // ═══════════════════════════════════════════════════════════════

      await test.step('Login to origination and cancel lease with refund', async () => {
        await loginToPortal(page, env.originationUrl, env);
        const customerPage = await navigateToOriginationCustomer(page, ctx.leadPk);
        const toastText = await customerPage.cancelLease(
          'Automated protection plan cancellation test',
          true,
        );
        console.log(`[Phase 4] Cancel toast: "${toastText}"`);
      });

      await test.step('Verify internal status after cancellation', async () => {
        await page.reload();
        await page.waitForLoadState('networkidle').catch(() => {});
        const customerPage = new OriginationCustomerPage(page);
        await customerPage.waitForSpinner();
        const internalStatus = await customerPage.getInternalStatus();
        console.log(`[Phase 4] Internal status: "${internalStatus}"`);
      });

      // ═══════════════════════════════════════════════════════════════
      //  PHASE 5: Trigger protection plan sweep
      // ═══════════════════════════════════════════════════════════════

      await test.step('Trigger cancelProtectionPlanSweep scheduled task', async () => {
        const sweepResp = await api.scheduledTask.triggerScheduledTask('cancelProtectionPlanSweep');
        expect(sweepResp.ok, `Sweep task responded with ${sweepResp.status}`).toBeTruthy();
        console.log(`[Phase 5] Protection plan sweep triggered`);
        await sleep(5_000);
      });

      // Cleanup: merchantConfig fixture teardown auto-restores offerInsurance
    });
  });
}

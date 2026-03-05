/**
 * API-only test: Lease Cancellation via cancelAccount endpoint.
 *
 * IMPORTANT: The cancelAccount endpoint requires the servicing accountPk (e.g., 16861),
 * NOT the leadPk (e.g., 95145). The servicing account PK is only available from:
 *   1. The customer page "Account Number" field in origination portal
 *   2. A database query mapping lead_pk → account_pk
 *
 * These tests are SKIPPED until accountPk resolution is available via API or DB helper.
 * The E2E tests in lease-cancellation.spec.ts cover cancel functionality via the UI.
 *
 * Strategy: Send application WITHOUT order data (pre-qualification), retrieve
 * approvedAmount from getApplicationStatus, use THAT for invoice.
 *
 * Run: node node_modules/.bin/playwright test tests/api/lease-cancellation-api.spec.ts --project=api-only
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { TestTag, buildTags, splitTags } from '../../src/types/enums.js';
import type { ApiClients } from '@support/base-test.js';
import type { MerchantInfo, ApplicantInfo } from '@api/bodies/index.js';
import { buildTestData, sleep } from '@helpers/index.js';

const SKIP_REASON = 'cancelAccount requires servicing accountPk (not leadPk). Needs DB query or API to resolve.';

const testData = [
  {
    env: 'sandbox',
    state: 'CA',
    merchant: 'ProgressMobility',
    tag: buildTags(TestTag.SMOKE, TestTag.REGRESSION, TestTag.SANDBOX),
  },
];

/**
 * Creates an application (pre-qualification), gets approvedAmount, sends invoice,
 * submits payment info, and drives to FUNDING state.
 */
async function createAndDriveToFunding(
  api: ApiClients,
  merchant: MerchantInfo,
  applicant: ApplicantInfo,
): Promise<{ leadPk: number; leadUuid: string; approvedAmount: number }> {
  // 1. Send application WITHOUT order (pre-qualification)
  const appResp = await api.application.sendApplication(merchant, applicant);
  expect(appResp.ok, `sendApplication: ${appResp.status}`).toBeTruthy();
  const leadUuid = appResp.body.accountNumber ?? String(appResp.body.authorizationNumber ?? '');
  const authNum = String(appResp.body.authorizationNumber ?? '');
  expect(leadUuid).toBeTruthy();

  // 2. Wait for approval + get approvedAmount
  await sleep(5_000);
  const statusResp = await api.application.getApplicationStatus(merchant, leadUuid);
  expect(statusResp.ok, `getApplicationStatus: ${statusResp.status}`).toBeTruthy();
  const status = (statusResp.body.appApprovalStatus || statusResp.body.uwStatus || statusResp.body.currentStatus || statusResp.body.status) ?? '';
  expect(status?.toLowerCase(), `Expected APPROVED but got: ${status}`).toContain('approved');

  let leadPk = statusResp.body.leadPk ? Number(statusResp.body.leadPk) : Number(authNum);
  const approvedAmount = statusResp.body.approvedAmount ?? 0;
  expect(approvedAmount, 'approvedAmount should be positive').toBeGreaterThan(0);
  console.log(`[Setup] leadPk=${leadPk} leadUuid=${leadUuid} approvedAmount=${approvedAmount}`);

  // 3. Send invoice with approved amount
  const invoiceResp = await api.invoice.sendInvoice(merchant, leadUuid, {
    orderTotal: String(approvedAmount),
  });
  expect(invoiceResp.ok, `sendInvoice: ${invoiceResp.status}`).toBeTruthy();

  // 4. Submit payment info
  const submitResp = await api.application.submitApplication(leadPk, applicant.firstName, applicant.lastName);
  console.log(`[Setup] submitApplication ${submitResp.ok ? 'OK' : 'FAIL'}`);

  // Reconcile leadPk from status if needed
  if (statusResp.body.leadPk) {
    leadPk = Number(statusResp.body.leadPk);
  }

  // 5. SIGNED → settle → FUNDING
  const signedResp = await api.lead.changeLeadStatus(merchant, leadPk, 'SIGNED', 'API test - SIGNED');
  expect(signedResp.ok, `changeLeadStatus SIGNED: ${signedResp.status}`).toBeTruthy();

  const settleResp = await api.settlement.settleApplication(merchant, leadUuid);
  expect(settleResp.ok, `settleApplication: ${settleResp.status}`).toBeTruthy();

  await sleep(3_000);
  const fundingResp = await api.lead.updateFundingStatus([leadPk], 'FUNDING');
  expect(fundingResp.ok, `updateFundingStatus: ${fundingResp.status}`).toBeTruthy();

  return { leadPk, leadUuid, approvedAmount };
}

for (const data of testData) {
  test.describe(`Lease Cancellation API - ${data.env}/${data.merchant}`, { tag: splitTags(data.tag) }, () => {
    test.use({ envName: data.env });

    test.skip('cancelAccount without refund', async ({ api }) => {
      test.skip(true, SKIP_REASON);
      const { merchant, applicant } = buildTestData({
        env: data.env,
        state: data.state,
        merchant: data.merchant,
        orderTotal: '800',
        orderDescription: 'API cancel without refund',
      });

      await test.step('Create application and drive to FUNDING', async () => {
        const result = await createAndDriveToFunding(api, merchant, applicant);
        test.info().annotations.push(
          { type: 'leadPk', description: String(result.leadPk) },
          { type: 'leadUuid', description: result.leadUuid },
        );
      });

      // TODO: resolve accountPk from leadPk via DB query, then call:
      // await api.account.cancelAccount(accountPk, 'comment', false);
    });

    test.skip('cancelAccount with refund', async ({ api }) => {
      test.skip(true, SKIP_REASON);
      const { merchant, applicant } = buildTestData({
        env: data.env,
        state: data.state,
        merchant: data.merchant,
        orderTotal: '800',
        orderDescription: 'API cancel with refund',
      });

      await test.step('Create application and drive to FUNDING', async () => {
        const result = await createAndDriveToFunding(api, merchant, applicant);
        test.info().annotations.push(
          { type: 'leadPk', description: String(result.leadPk) },
          { type: 'leadUuid', description: result.leadUuid },
        );
      });

      // TODO: resolve accountPk, then call:
      // await api.account.cancelAccount(accountPk, 'comment', true);
    });

    test.skip('Protection plan sweep after cancellation', async ({ api }) => {
      test.skip(true, SKIP_REASON);
      const { merchant, applicant } = buildTestData({
        env: data.env,
        state: data.state,
        merchant: data.merchant,
        orderTotal: '800',
        orderDescription: 'API protection plan sweep',
      });

      await test.step('Create application, drive to FUNDING, and cancel', async () => {
        const result = await createAndDriveToFunding(api, merchant, applicant);
        test.info().annotations.push(
          { type: 'leadPk', description: String(result.leadPk) },
          { type: 'leadUuid', description: result.leadUuid },
        );

        // TODO: resolve accountPk, cancel, then trigger sweep:
        // await api.account.cancelAccount(accountPk, 'comment', true);
        // await api.scheduledTask.triggerScheduledTask('cancelProtectionPlanSweep');
      });
    });
  });
}

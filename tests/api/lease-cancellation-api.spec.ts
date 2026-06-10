/**
 * API-only test: Lease Cancellation via cancelAccount endpoint.
 *
 * IMPORTANT: The cancelAccount endpoint requires the servicing accountPk (e.g., 16861),
 * NOT the leadPk (e.g., 95145). The servicing account PK is resolved from the leadPk via
 * `db.waitForAccountByLeadPk` (SELECT pk FROM uown_sv_account WHERE lead_pk = $1).
 *
 * UI-first note (CLAUDE.md rule #14): the customer-facing lease-cancellation flow is
 * exercised via the browser in tests/e2e/origination/lease-cancellation.spec.ts. These
 * API-only tests target the `/uown/svc/cancelAccount` SVC ops endpoint directly — the
 * `refundAllPayments` boolean and the protection-plan sweep are backend-only concerns
 * with no dedicated UI affordance, so API-only is the justified exception here.
 *
 * Strategy: Send application WITHOUT order data (pre-qualification), retrieve
 * approvedAmount from getApplicationStatus, use THAT for invoice.
 *
 * Env: comes from `.env` (process.env.ENV) via buildTestData — no hardcoded env.
 *
 * Run: node node_modules/.bin/playwright test tests/api/lease-cancellation-api.spec.ts --project=api-only
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';
import type { ApiClients } from '@support/base-test.js';
import type { MerchantInfo, ApplicantInfo } from '@api/bodies/index.js';
import { buildTestData, sleep } from '@helpers/index.js';

const testData = {
  state: 'CA',
  merchant: 'ProgressMobility',
  // Cosmetic describe metadata only — the `api-only` Playwright project has no tag
  // filter, so these run against whatever env `.env` points to (sandbox/dev3/etc.).
  tag: buildTags(TestTag.SMOKE, TestTag.REGRESSION),
};

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

  // Reconcile leadPk from status if needed (before submit)
  if (statusResp.body.leadPk) {
    leadPk = Number(statusResp.body.leadPk);
  }

  // 4. Resolve merchantProgramPk via getMissingFields BEFORE submitApplication.
  // submitApplication fails ("Merchant program is required") on brand-new leads
  // without a prior merchantProgramPk — getMissingFields reads shortCode + planId
  // from the invoice redirectUrl and resolves the program. See api-setup.helpers.ts
  // and CLAUDE.md application-lifecycle protocol.
  const detailsList = invoiceResp.body?.paymentDetailsList ?? [];
  const redirectUrl = detailsList[0]?.redirectUrl ?? '';
  if (redirectUrl) {
    const url = new URL(redirectUrl);
    const shortCode = url.pathname.split('/').filter(Boolean)[0] ?? '';
    const planId = url.searchParams.get('planId') ?? '';
    if (shortCode) {
      const missingResp = await api.application.getMissingFields(shortCode, planId ? { planId } : undefined);
      expect(missingResp.ok, `getMissingFields: ${missingResp.status}`).toBeTruthy();
      console.log(`[Setup] getMissingFields ok (shortCode=${shortCode}, planId=${planId || '(none)'})`);
    }
  } else {
    console.warn('[Setup] No redirectUrl in invoice response — submitApplication may fail');
  }

  // 5. Submit payment info (must succeed — otherwise lead never reaches CONTRACT_CREATED
  // and settleApplication returns 500 downstream)
  const submitResp = await api.application.submitApplication(leadPk, applicant.firstName, applicant.lastName);
  console.log(`[Setup] submitApplication ${submitResp.ok ? 'OK' : 'FAIL'}: ${JSON.stringify(submitResp.body)}`);
  expect(submitResp.ok, `submitApplication: ${submitResp.status}`).toBeTruthy();

  // 6. SIGNED → settle → FUNDING
  const signedResp = await api.lead.changeLeadStatus(merchant, leadPk, 'SIGNED', 'API test - SIGNED');
  expect(signedResp.ok, `changeLeadStatus SIGNED: ${signedResp.status}`).toBeTruthy();

  const settleResp = await api.settlement.settleApplication(merchant, leadUuid);
  expect(settleResp.ok, `settleApplication: ${settleResp.status}`).toBeTruthy();

  await sleep(3_000);
  const fundingResp = await api.lead.updateFundingStatus([leadPk], 'FUNDING');
  expect(fundingResp.ok, `updateFundingStatus: ${fundingResp.status}`).toBeTruthy();

  return { leadPk, leadUuid, approvedAmount };
}

test.describe(`Lease Cancellation API - ${testData.merchant}`, { tag: splitTags(testData.tag) }, () => {
  test('cancelAccount without refund', async ({ api, db }) => {
    test.setTimeout(300_000);
    const { merchant, applicant } = buildTestData({
      state: testData.state,
      merchant: testData.merchant,
      orderTotal: '800',
      orderDescription: 'API cancel without refund',
    });

    let leadPk = 0;

    await test.step('Create application and drive to FUNDING', async () => {
      const result = await createAndDriveToFunding(api, merchant, applicant);
      leadPk = result.leadPk;
      test.info().annotations.push(
        { type: 'leadPk', description: String(result.leadPk) },
        { type: 'leadUuid', description: result.leadUuid },
      );
    });

    let accountPk = '';

    await test.step('Resolve servicing accountPk from leadPk', async () => {
      const resolved = await db.waitForAccountByLeadPk(String(leadPk), 60_000);
      expect(resolved, `accountPk not found for leadPk=${leadPk}`).toBeTruthy();
      accountPk = resolved!;
      test.info().annotations.push({ type: 'accountPk', description: accountPk });
      console.log(`[Test] Resolved accountPk=${accountPk} for leadPk=${leadPk}`);
    });

    await test.step('Cancel account without refund', async () => {
      const resp = await api.account.cancelAccount(Number(accountPk), 'API test cancel no refund', false);
      expect(resp.ok, `cancelAccount responded with ${resp.status}: ${JSON.stringify(resp.body)}`).toBeTruthy();
    });

    await test.step('Verify account status is CANCELLED in DB', async () => {
      const reached = await db.waitForAccountStatus(accountPk, 'CANCELLED', 60_000);
      const actual = await db.getAccountStatus(accountPk);
      expect(reached, `Expected account_status=CANCELLED but got: ${actual}`).toBeTruthy();
    });

    await test.step('Verify cancellation activity log (CLAUDE.md #13)', async () => {
      const log = await db.getLatestActivityLog(accountPk, 'cancel');
      expect(log, `No cancellation activity log found for accountPk=${accountPk}`).toBeTruthy();
      console.log(`[Test] Cancellation activity log: ${JSON.stringify(log?.notes)}`);
    });
  });

  test('cancelAccount with refund', async ({ api, db }) => {
    test.setTimeout(300_000);
    const { merchant, applicant } = buildTestData({
      state: testData.state,
      merchant: testData.merchant,
      orderTotal: '800',
      orderDescription: 'API cancel with refund',
    });

    let leadPk = 0;

    await test.step('Create application and drive to FUNDING', async () => {
      const result = await createAndDriveToFunding(api, merchant, applicant);
      leadPk = result.leadPk;
      test.info().annotations.push(
        { type: 'leadPk', description: String(result.leadPk) },
        { type: 'leadUuid', description: result.leadUuid },
      );
    });

    let accountPk = '';

    await test.step('Resolve servicing accountPk from leadPk', async () => {
      const resolved = await db.waitForAccountByLeadPk(String(leadPk), 60_000);
      expect(resolved, `accountPk not found for leadPk=${leadPk}`).toBeTruthy();
      accountPk = resolved!;
      test.info().annotations.push({ type: 'accountPk', description: accountPk });
      console.log(`[Test] Resolved accountPk=${accountPk} for leadPk=${leadPk}`);
    });

    await test.step('Cancel account with refund', async () => {
      const resp = await api.account.cancelAccount(Number(accountPk), 'API test cancel with refund', true);
      expect(resp.ok, `cancelAccount responded with ${resp.status}: ${JSON.stringify(resp.body)}`).toBeTruthy();
    });

    await test.step('Verify account status is CANCELLED in DB', async () => {
      const reached = await db.waitForAccountStatus(accountPk, 'CANCELLED', 60_000);
      const actual = await db.getAccountStatus(accountPk);
      expect(reached, `Expected account_status=CANCELLED but got: ${actual}`).toBeTruthy();
    });

    await test.step('Verify cancellation activity log (CLAUDE.md #13)', async () => {
      const log = await db.getLatestActivityLog(accountPk, 'cancel');
      expect(log, `No cancellation activity log found for accountPk=${accountPk}`).toBeTruthy();
      console.log(`[Test] Cancellation activity log: ${JSON.stringify(log?.notes)}`);
    });
  });

  test('Protection plan sweep after cancellation', async ({ api, db }) => {
    test.setTimeout(300_000);
    const { merchant, applicant } = buildTestData({
      state: testData.state,
      merchant: testData.merchant,
      orderTotal: '800',
      orderDescription: 'API protection plan sweep',
    });

    let leadPk = 0;

    await test.step('Create application and drive to FUNDING', async () => {
      const result = await createAndDriveToFunding(api, merchant, applicant);
      leadPk = result.leadPk;
      test.info().annotations.push(
        { type: 'leadPk', description: String(result.leadPk) },
        { type: 'leadUuid', description: result.leadUuid },
      );
    });

    let accountPk = '';

    await test.step('Resolve servicing accountPk from leadPk', async () => {
      const resolved = await db.waitForAccountByLeadPk(String(leadPk), 60_000);
      expect(resolved, `accountPk not found for leadPk=${leadPk}`).toBeTruthy();
      accountPk = resolved!;
      test.info().annotations.push({ type: 'accountPk', description: accountPk });
      console.log(`[Test] Resolved accountPk=${accountPk} for leadPk=${leadPk}`);
    });

    await test.step('Cancel account with refund', async () => {
      const resp = await api.account.cancelAccount(Number(accountPk), 'API test PP sweep', true);
      expect(resp.ok, `cancelAccount responded with ${resp.status}: ${JSON.stringify(resp.body)}`).toBeTruthy();
    });

    await test.step('Verify account status is CANCELLED in DB', async () => {
      const reached = await db.waitForAccountStatus(accountPk, 'CANCELLED', 60_000);
      const actual = await db.getAccountStatus(accountPk);
      expect(reached, `Expected account_status=CANCELLED but got: ${actual}`).toBeTruthy();
    });

    await test.step('Verify cancellation activity log (CLAUDE.md #13)', async () => {
      const log = await db.getLatestActivityLog(accountPk, 'cancel');
      expect(log, `No cancellation activity log found for accountPk=${accountPk}`).toBeTruthy();
      console.log(`[Test] Cancellation activity log: ${JSON.stringify(log?.notes)}`);
    });

    await test.step('Trigger cancelProtectionPlanSweep scheduled task', async () => {
      // NOTE: cancelProtectionPlanSweep is a GLOBAL sweep (processes all cancelled
      // accounts' protection plans), not scoped to a single accountPk. We assert only
      // that the ops endpoint accepts the trigger (HTTP OK).
      //
      // The PER-ACCOUNT protection-plan effect is NOT asserted here because this lead
      // uses state=CA, where the lease log records "Protection plan was not offered"
      // (CA regulatory restriction — see .claude/rules/testing.md § E-sign Provider
      // Routing). A fresh account with a real protection plan would be required to
      // assert the plan was swept to a cancelled/refunded state — that scenario is
      // covered end-to-end in tests/e2e/origination/protection-plan-cancellation.spec.ts.
      const sweepResp = await api.scheduledTask.triggerScheduledTask('cancelProtectionPlanSweep');
      expect(sweepResp.ok, `cancelProtectionPlanSweep responded with ${sweepResp.status}`).toBeTruthy();
      await sleep(5_000);
      console.log('[Test] Protection plan sweep triggered (global sweep — per-account PP effect not asserted for CA)');
    });
  });
});

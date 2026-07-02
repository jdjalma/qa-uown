/**
 * Provisioning script — RU07.26.1.54.0 (website#153) discovery gate.
 *
 * Creates a FRESH ACTIVE lease account on Bi-Weekly in sandbox, with a
 * customer that can log into the Website portal via OTP, for the
 * `/payment-frequency` discovery pass (rule #18) + oracle authoring (rule #19b).
 *
 * Sequence (mirrors createPreQualifiedApplication + driveLeadToFunding, but
 * with an explicit BI_WEEKLY frequency override — createPreQualifiedApplication's
 * internal sendInvoice call always defaults to INVOICE_DEFAULTS.PAYMENT_FREQUENCY
 * = WEEKLY and does not expose a frequency override):
 *   1. sendApplication (desiredPaymentFrequency=BI_WEEKLY)
 *   2. getApplicationStatus → approvedAmount
 *   3. sendInvoice (selectedPaymentFrequency=BI_WEEKLY, orderTotal=approvedAmount)
 *   4. getMissingFields (shortCode + planId from invoice redirectUrl)
 *   5. submitApplication (CC/bank via builder defaults) → CONTRACT_CREATED
 *   6. changeLeadStatus → SIGNED
 *   7. settleApplication → uown_sv_account created ACTIVE (per funded.md CT-04/CT-11 —
 *      account is born at FUNDING, not FUNDED)
 *   8. updateFundingStatus → FUNDING
 *   9. poll DB for uown_sv_account by lead_pk
 *
 * No DB INSERT/UPDATE/DELETE (Exception 2) — SELECT-only via DatabaseHelpers.
 *
 * Usage:
 *   npx tsx src/scripts/provision-payment-frequency-website.ts [env]
 */
import { request as pwRequest } from '@playwright/test';
import { ConfigEnvironment } from '../config/environment.js';
import { ApplicationClient } from '../api/clients/application.client.js';
import { InvoiceClient } from '../api/clients/invoice.client.js';
import { LeadClient } from '../api/clients/lead.client.js';
import { SettlementClient } from '../api/clients/settlement.client.js';
import { DatabaseHelpers } from '../helpers/database.helpers.js';
import { buildTestData } from '../helpers/test-data.helpers.js';
import { buildSendApplicationBody } from '../api/bodies/application.body.js';

const ENV = process.argv[2] ?? process.env.ENV ?? 'sandbox';

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

(async () => {
  console.log(`\n=== Provisioning: website-payment-frequency (153) | env=${ENV} ===\n`);

  const config = new ConfigEnvironment(ENV);
  const ctx = await pwRequest.newContext({ ignoreHTTPSErrors: true });
  const application = new ApplicationClient(ctx, config);
  const invoice = new InvoiceClient(ctx, config);
  const lead = new LeadClient(ctx, config);
  const settlement = new SettlementClient(ctx, config);
  const db = new DatabaseHelpers(config.dbConnectionString);

  // Confirm we are really pointed at sandbox before trusting any DB read
  // (memory: db-tunnel-5445-env-identification — the local tunnel flips between envs).
  const identity = await db.queryOne<{ max_acct: string }>(
    `SELECT MAX(pk)::text AS max_acct FROM uown_sv_account`,
    [],
  ).catch(() => null);
  console.log(`[DB identity] uown_sv_account MAX(pk) = ${identity?.max_acct ?? 'query failed'}`);

  const runId = `${Date.now()}`;
  const customerEmail = `fintechgroup777+pf153${runId}@gmail.com`;

  const { merchant, applicant } = buildTestData({
    env: ENV,
    state: 'CA',
    merchant: 'TireAgent',
    orderTotal: '1500',
    realistic: true,
    emailOverride: customerEmail,
  });

  console.log(`merchant: ${merchant.number}`);
  console.log(`applicant: ${applicant.firstName} ${applicant.lastName} | email: ${applicant.email} | state: ${applicant.state}`);

  // 1. sendApplication — BI_WEEKLY desired frequency
  console.log('\n[1] POST sendApplication (desiredPaymentFrequency=BI_WEEKLY)...');
  const appBody = buildSendApplicationBody(merchant, applicant, undefined, {
    desiredPaymentFrequency: 'BI_WEEKLY',
  });
  const appResp = await application.sendApplication(appBody);
  if (!appResp.ok) {
    console.error(`sendApplication FAILED: ${appResp.status} ${JSON.stringify(appResp.body).slice(0, 300)}`);
    await ctx.dispose();
    process.exit(1);
  }
  const leadPk = String((appResp.body as Record<string, unknown>).authorizationNumber ?? '');
  const leadUuid = String((appResp.body as Record<string, unknown>).accountNumber ?? leadPk);
  console.log(`leadPk=${leadPk} leadUuid=${leadUuid}`);

  // 2. getApplicationStatus — approvedAmount
  await sleep(5_000);
  const statusResp = await application.getApplicationStatus(merchant, leadUuid);
  if (!statusResp.ok) {
    console.error(`getApplicationStatus FAILED: ${statusResp.status}`);
    await ctx.dispose();
    process.exit(1);
  }
  const approvedAmount = (statusResp.body as Record<string, unknown>).approvedAmount as number ?? 0;
  console.log(`approvedAmount=${approvedAmount}`);
  if (!approvedAmount) {
    console.error('No approvedAmount — application likely denied. Aborting.');
    console.error(JSON.stringify(statusResp.body).slice(0, 500));
    await ctx.dispose();
    process.exit(1);
  }

  // 3. sendInvoice — BI_WEEKLY selected frequency
  console.log('\n[3] POST sendInvoice (selectedPaymentFrequency=BI_WEEKLY)...');
  const invoiceResp = await invoice.sendInvoice(merchant, leadUuid, {
    orderTotal: String(approvedAmount),
    selectedPaymentFrequency: 'BI_WEEKLY',
  });
  if (!invoiceResp.ok) {
    console.error(`sendInvoice FAILED: ${invoiceResp.status} ${JSON.stringify(invoiceResp.body).slice(0, 300)}`);
    await ctx.dispose();
    process.exit(1);
  }

  // 4. getMissingFields (shortCode + planId from invoice redirectUrl)
  const detailsList = (invoiceResp.body as { paymentDetailsList?: Array<{ redirectUrl?: string }> })
    .paymentDetailsList ?? [];
  const redirectUrl = detailsList[0]?.redirectUrl ?? '';
  console.log(`redirectUrl: ${redirectUrl}`);
  if (redirectUrl) {
    const url = new URL(redirectUrl);
    const shortCode = url.pathname.split('/').filter(Boolean)[0] ?? '';
    const planId = url.searchParams.get('planId') ?? '';
    console.log(`[4] getMissingFields shortCode=${shortCode} planId=${planId}`);
    const missingResp = await application.getMissingFields(shortCode, planId ? { planId } : undefined);
    console.log(`getMissingFields: ${missingResp.status} ok=${missingResp.ok}`);
  }

  // 5. submitApplication (CC + bank via builder defaults) → CONTRACT_CREATED
  console.log('\n[5] POST submitApplication...');
  const submitResp = await application.submitApplication(
    Number(leadPk), applicant.firstName, applicant.lastName,
  );
  if (!submitResp.ok) {
    console.error(`submitApplication FAILED: ${submitResp.status} ${JSON.stringify(submitResp.body).slice(0, 400)}`);
    await ctx.dispose();
    process.exit(1);
  }
  console.log('submitApplication OK — CONTRACT_CREATED');

  // 6. changeLeadStatus → SIGNED
  console.log('\n[6] changeLeadStatus → SIGNED...');
  const signedResp = await lead.changeLeadStatus(merchant, Number(leadPk), 'SIGNED', 'Automated - SIGNED (provisioning script)');
  if (!signedResp.ok) {
    console.error(`changeLeadStatus SIGNED FAILED: ${signedResp.status} ${JSON.stringify(signedResp.body).slice(0, 300)}`);
    await ctx.dispose();
    process.exit(1);
  }

  // 7. settleApplication → uown_sv_account created ACTIVE
  console.log('\n[7] settleApplication...');
  const settleResp = await settlement.settleApplication(merchant, leadUuid);
  if (!settleResp.ok) {
    console.error(`settleApplication FAILED: ${settleResp.status} ${JSON.stringify(settleResp.body).slice(0, 300)}`);
    await ctx.dispose();
    process.exit(1);
  }
  await sleep(3_000);

  // 8. updateFundingStatus → FUNDING
  console.log('\n[8] updateFundingStatus → FUNDING...');
  const fundingResp = await lead.updateFundingStatus([Number(leadPk)], 'FUNDING');
  if (!fundingResp.ok) {
    console.error(`updateFundingStatus FAILED: ${fundingResp.status} ${JSON.stringify(fundingResp.body).slice(0, 300)}`);
    await ctx.dispose();
    process.exit(1);
  }

  // 9. Poll DB for account
  console.log('\n[9] Polling uown_sv_account by lead_pk...');
  const accountPk = await db.waitForAccountByLeadPk(leadPk, 60_000);
  if (!accountPk) {
    console.error('Account not created within timeout.');
    await ctx.dispose();
    await db.close();
    process.exit(1);
  }

  const acctRow = await db.queryOne<{ account_status: string; pk: string }>(
    `SELECT pk::text, account_status FROM uown_sv_account WHERE pk = $1`,
    [accountPk],
  );
  console.log(`\n=== DONE ===`);
  console.log(`leadPk=${leadPk}`);
  console.log(`leadUuid=${leadUuid}`);
  console.log(`accountPk=${accountPk}`);
  console.log(`account_status=${acctRow?.account_status}`);
  console.log(`customerEmail=${customerEmail}`);
  console.log(`frequency=BI_WEEKLY`);
  console.log(`merchant=${merchant.number}`);

  await ctx.dispose();
  await db.close();
  process.exit(0);
})().catch(async (e) => {
  console.error('FATAL:', e);
  process.exit(2);
});

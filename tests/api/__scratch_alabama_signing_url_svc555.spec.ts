/**
 * SCRATCH / THROWAWAY — svc#555 "Add AL - Alabama GowSign Template" (/discovery).
 *
 * Purpose: create ONE Alabama (AL) lease application driven to the signing stage
 * via API on TerraceFinance (ONLINE, UOWN gateway → completable with the standard
 * MASTERCARD_APPROVED card) and capture the customer SIGNING URL, so the rendered
 * AL GowSign contract can be opened and read in the browser (rule #14 UI-first).
 *
 * NOT a regression test — DELETE after the discovery captures the contract.
 *
 * Recipe:
 *   - Merchant: TerraceFinance (OL90202-0001), ONLINE, licensed in AL.
 *   - ONLINE → customer state AL drives the GowSign template lookup.
 *   - qa2 has AL templates AL_2025_SAC (pk25, 13m) + AL_2025_SAC_16_MONTHS (pk26, 16m).
 *   - Non-Kornerstone ONLINE caps at 13m in qa2 → this drives AL_2025_SAC (13m).
 *   - UOWN gateway (secure-qa2.uownleasing.com) → CC pre-auth accepts MASTERCARD_APPROVED
 *     (NOT the Kornerstone OMNIFUND/kaptcha wall), so the contract is browser-renderable.
 *
 * Run:  ENV=qa2 npx playwright test tests/api/__scratch_alabama_signing_url_svc555.spec.ts --project=api-only
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { buildTestData } from '@helpers/test-data.helpers.js';
import { buildSendApplicationBody } from '@api/bodies/application.body.js';
import { extractApprovalStatus } from '@helpers/api-setup.helpers.js';
import { sleep } from '@helpers/common.helpers.js';

const ENV = process.env.ENV ?? 'sandbox';
const STATE = (process.env.STATE ?? 'AL').toUpperCase();
// Kornerstone mode: set MERCHANT_NUMBER=KS#### to force the Kornerstone ABB (→ 16m) route.
// Empty → TerraceFinance standard ONLINE (caps at 13m, UOWN gateway).
const KS_NUMBER = process.env.MERCHANT_NUMBER ?? '';
const IS_KORNERSTONE = KS_NUMBER.toUpperCase().startsWith('KS');
const FORCE_TERM = IS_KORNERSTONE ? 16 : 0; // 0 = pick lowest available

test(`svc#555 — capture ${STATE} signing URL [${ENV}]${IS_KORNERSTONE ? ` KS=${KS_NUMBER}` : ''}`, async ({ api, db, testEnv }) => {
  test.setTimeout(240_000);

  const td = buildTestData({
    state: STATE,
    merchant: IS_KORNERSTONE ? 'Kornerstone' : 'TerraceFinance',
    orderTotal: '1500',
    orderDescription: `svc#555 ${STATE} GowSign template render capture`,
    approved: true,
    uniqueAddress: true,
  });
  const { applicant } = td;
  // Kornerstone needs an explicit identity + bank data; standard merchants use td.merchant as-is.
  const merchant = IS_KORNERSTONE
    ? { ...td.merchant, username: 'kornerstone', password: 'U0wn_Kornerstone_012c', number: KS_NUMBER, refCode: 'kornerstone' }
    : td.merchant;

  let leadPk = '';
  let leadUuid = '';
  let signingUrl = '';
  let embeddedSigningUrl = '';
  let resolvedTerm = 0;
  let approvedAmount = 0;

  await test.step(`sendApplication (${STATE}${IS_KORNERSTONE ? `, ${KS_NUMBER}` : ''})`, async () => {
    const body = buildSendApplicationBody(merchant, applicant, undefined, {
      state: STATE,
      ...(IS_KORNERSTONE ? { mainAnnualIncome: 120_000 } : {}),
    });
    if (IS_KORNERSTONE) {
      // Kornerstone routing requires bank info on the body (application-lifecycle pitfall #5).
      body.mainBankRoutingNumber = '123456780';
      body.mainBankAccountNumber = '160781900000';
    }
    const resp = await api.application.sendApplication(body);
    if (!resp.ok) console.log(`[svc555] sendApplication ${resp.status}: ${JSON.stringify(resp.body)}`);
    expect(resp.ok, `sendApplication responded ${resp.status}`).toBeTruthy();
    leadUuid = resp.body.accountNumber ?? String(resp.body.authorizationNumber ?? '');
    leadPk = String(resp.body.authorizationNumber ?? '');
    expect(leadUuid, 'leadUuid present').toBeTruthy();
    console.log(`[svc555] leadPk=${leadPk} leadUuid=${leadUuid} email=${applicant.email}`);
  });

  await test.step('getApplicationStatus → APPROVED', async () => {
    await sleep(5_000);
    const resp = await api.application.getApplicationStatus(merchant, leadUuid);
    expect(resp.ok, `getApplicationStatus ${resp.status}`).toBeTruthy();
    const status = extractApprovalStatus(resp.body);
    expect(status?.toLowerCase(), `expected APPROVED, got: ${status}`).toContain('approved');
    if (resp.body.leadPk) leadPk = String(resp.body.leadPk);
    approvedAmount = resp.body.approvedAmount ?? 0;
    expect(approvedAmount, 'approvedAmount > 0').toBeGreaterThan(0);
    console.log(`[svc555] approvedAmount=${approvedAmount} leadPk=${leadPk}`);
  });

  await test.step('sendInvoice → capture signing URL (redirectUrl)', async () => {
    const resp = await api.invoice.sendInvoice(merchant, leadUuid, { orderTotal: String(approvedAmount) });
    expect(resp.ok, `sendInvoice ${resp.status}`).toBeTruthy();
    const list = resp.body.paymentDetailsList ?? [];
    console.log(`[svc555] paymentDetailsList (${list.length}): ${JSON.stringify(list)}`);
    // FORCE_TERM (16 for Kornerstone) → pick that entry; else lowest term available (13m standard).
    const sorted = [...list].sort((a, b) => (a.termInMonths ?? 0) - (b.termInMonths ?? 0));
    const pick = FORCE_TERM ? list.find((d) => d.termInMonths === FORCE_TERM) : sorted[0];
    if (!pick) {
      const avail = list.map((d) => d.termInMonths).join(',') || '(none)';
      throw new Error(`[svc555] term ${FORCE_TERM || 'lowest'} not in paymentDetailsList (available: [${avail}])`);
    }
    resolvedTerm = pick.termInMonths ?? 0;
    signingUrl = pick.redirectUrl ?? '';
    expect(signingUrl, 'redirectUrl present').toBeTruthy();
    console.log(`[svc555] resolvedTerm=${resolvedTerm} signingUrl=${signingUrl}`);
  });

  await test.step('getMissingFields + submitApplication → embeddedSigningUrl', async () => {
    const url = new URL(signingUrl);
    const shortCode = url.pathname.split('/').filter(Boolean)[0] ?? '';
    const planId = url.searchParams.get('planId') ?? '';
    expect(shortCode, 'shortCode extractable').toBeTruthy();
    const missing = await api.application.getMissingFields(shortCode, planId ? { planId } : undefined);
    expect(missing.ok, `getMissingFields ${missing.status}`).toBeTruthy();
    const submit = await api.application.submitApplication(Number(leadPk), applicant.firstName, applicant.lastName);
    if (!submit.ok) console.log(`[svc555] submitApplication ${submit.status}: ${JSON.stringify(submit.body)}`);
    expect(submit.ok, `submitApplication ${submit.status}`).toBeTruthy();
    embeddedSigningUrl = submit.body.embeddedSigningUrl ?? '';
    if (submit.body.termInMonths) resolvedTerm = submit.body.termInMonths;
    console.log(`[svc555] embeddedSigningUrl=${embeddedSigningUrl || '(none)'}`);
  });

  let dbProvider = '';
  let dbEsignStatus = '';
  await test.step('resolve provider (DB read-only — qa2)', async () => {
    if (ENV === 'qa2') {
      const row = await db.queryOne<{ client?: string; status?: string; template_name?: string }>(
        `SELECT client, status, template_name FROM uown_esign_document WHERE lead_pk = $1 ORDER BY pk DESC LIMIT 1`,
        [leadPk],
      );
      dbProvider = row?.client ?? '';
      dbEsignStatus = row?.status ?? '';
      console.log(`[svc555] uown_esign_document: client=${dbProvider} template_name=${row?.template_name ?? '-'} status=${dbEsignStatus}`);
    }
  });

  console.log('═══════════════════════════════════════════════════════════');
  console.log(`[svc555] ENV=${ENV}  svcApiUrl=${testEnv.svcApiUrl}`);
  console.log(`[svc555] merchant=TerraceFinance (OL90202-0001) ONLINE, customer state=${STATE}`);
  console.log(`[svc555] leadPk=${leadPk}  leadUuid=${leadUuid}`);
  console.log(`[svc555] CARDHOLDER NAME (for CC pre-auth): ${applicant.firstName} ${applicant.lastName}`);
  console.log(`[svc555] resolvedTerm=${resolvedTerm}`);
  console.log(`[svc555] SIGNING URL (redirectUrl): ${signingUrl}`);
  console.log(`[svc555] embeddedSigningUrl: ${embeddedSigningUrl || '(not returned)'}`);
  console.log(`[svc555] provider DB: ${dbProvider || '(not read)'} status=${dbEsignStatus || '-'}`);
  console.log('═══════════════════════════════════════════════════════════');

  expect(signingUrl, 'signing URL captured').toBeTruthy();
});

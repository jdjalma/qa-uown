/**
 * SCRATCH / THROWAWAY — svc#546 Scenario 2 / PayTomorrow feasibility.
 *
 * Confirms whether the PayTomorrow merchant ProgressMobility (OL90294-0001,
 * client_type=PAY_TOMORROW, ONLINE, OH-valid, has a 16m program KWC-1.75)
 * reaches a 16-month term for customer state OH (→ would route to the OH GowSign
 * template). API-only feasibility probe — NOT a signing test.
 *
 * Also doubles as validation that buildTestData now defaults to REALISTIC data
 * (the applicant name should be a real name, not TestFN…).
 *
 * Run: ENV=qa2 npx playwright test tests/api/__scratch_paytomorrow_oh16m_svc546.spec.ts --project=api-only
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { buildTestData } from '@helpers/test-data.helpers.js';
import { buildSendApplicationBody } from '@api/bodies/application.body.js';
import { extractApprovalStatus } from '@helpers/api-setup.helpers.js';
import { sleep } from '@helpers/common.helpers.js';

const ENV = process.env.ENV ?? 'qa2';
const HIGH_INCOME = 120_000;
const MERCHANT_KEY = process.env.MERCHANT ?? 'ProgressMobility';

test(`svc#546 — ${MERCHANT_KEY} OH 16m feasibility [${ENV}]`, async ({ api, db }) => {
  test.setTimeout(180_000);

  // buildTestData now defaults to realistic → real name + valid unique OH address.
  const { merchant, applicant } = buildTestData({
    state: 'OH',
    merchant: MERCHANT_KEY,
    orderTotal: '1000',
    orderDescription: `svc#546 ${MERCHANT_KEY} OH 16m feasibility`,
  });
  console.log(`[546-pt] applicant=${applicant.firstName} ${applicant.lastName} (factory-realistic check) addr=${applicant.address}, ${applicant.city} ${applicant.zip}`);
  expect(applicant.firstName, 'realistic name (not TestFN)').not.toMatch(/^TestFN/);

  let leadUuid = '';
  let leadPk = '';
  let approvedAmount = 0;

  await test.step('sendApplication (ProgressMobility, OH, high income)', async () => {
    const body = buildSendApplicationBody(merchant, applicant, undefined, {
      state: 'OH',
      mainAnnualIncome: HIGH_INCOME,
      employerName: 'Walmart',
    });
    // PayTomorrow may require bank info like Kornerstone — include TEST_BANK defaults.
    body.mainBankRoutingNumber = '123456780';
    body.mainBankAccountNumber = '160781900000';
    const resp = await api.application.sendApplication(body);
    if (!resp.ok) console.log(`[546-pt] sendApplication ${resp.status}: ${JSON.stringify(resp.body)}`);
    expect(resp.ok, `sendApplication ${resp.status}`).toBeTruthy();
    leadUuid = resp.body.accountNumber ?? String(resp.body.authorizationNumber ?? '');
    leadPk = String(resp.body.authorizationNumber ?? '');
    console.log(`[546-pt] leadPk=${leadPk} email=${applicant.email}`);
  });

  await test.step('getApplicationStatus → APPROVED', async () => {
    await sleep(5_000);
    const resp = await api.application.getApplicationStatus(merchant, leadUuid);
    expect(resp.ok, `getApplicationStatus ${resp.status}`).toBeTruthy();
    const status = extractApprovalStatus(resp.body);
    if (status?.toLowerCase() !== 'approved') console.log(`[546-pt] status: ${JSON.stringify(resp.body)}`);
    expect(status?.toLowerCase(), `approved? got ${status}`).toContain('approved');
    if (resp.body.leadPk) leadPk = String(resp.body.leadPk);
    approvedAmount = resp.body.approvedAmount ?? resp.body.creditLimit ?? 0;
    console.log(`[546-pt] approved=${approvedAmount} leadPk=${leadPk}`);
  });

  let offeredTerms: number[] = [];
  await test.step('sendInvoice → which terms are offered?', async () => {
    const resp = await api.invoice.sendInvoice(merchant, leadUuid, { orderTotal: String(approvedAmount || 1000) });
    expect(resp.ok, `sendInvoice ${resp.status}`).toBeTruthy();
    const list = (resp.body.paymentDetailsList ?? []) as Array<{ termInMonths?: number; redirectUrl?: string }>;
    offeredTerms = [...new Set(list.map((d) => Number(d.termInMonths)).filter(Boolean))];
    console.log(`[546-pt] offeredTerms=[${offeredTerms.join(',')}] urls=${list.map((d) => d.redirectUrl).join(' | ')}`);
  });

  await test.step('DB: approved terms + (any) esign provider', async () => {
    if (ENV !== 'qa2') return;
    const terms = await db.queryOne<{ uw_terms?: string; approved_terms?: string }>(
      `SELECT uw_terms, approved_terms FROM uown_lead_approval_terms WHERE lead_pk = $1`,
      [leadPk],
    );
    console.log(`[546-pt] uown_lead_approval_terms: uw_terms=${terms?.uw_terms ?? '-'} approved_terms=${terms?.approved_terms ?? '-'}`);
  });

  console.log('═══════════════════════════════════════════════════════════');
  console.log(`[546-pt] PayTomorrow ProgressMobility OH → offeredTerms=[${offeredTerms.join(',')}]`);
  console.log(`[546-pt] 16m offered? ${offeredTerms.includes(16) ? 'YES → OH GowSign reachable via PayTomorrow' : 'NO → caps below 16; OH would fall to Signwell'}`);
  console.log('═══════════════════════════════════════════════════════════');

  expect(leadPk, 'lead created').toBeTruthy();
});

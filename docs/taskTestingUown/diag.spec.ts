import { test, expect } from '@fixtures/test-context.fixture.js';
import { sleep } from '@helpers/common.helpers.js';
import { driveLeadToFunding } from '@helpers/api-setup.helpers.js';
import { MERCHANTS } from '@data/merchants.js';
import { generateTestSSN, generateTestPhone, generateRunId } from '@config/constants.js';

test.use({ envName: 'qa1' });

/**
 * Full flow: TerraceFinance + DB-patch eligible_terms=16 + merchant_program_pk=207
 * Goal: create a 16-month SVC account to test getAnytimeBuyout()
 */
test('DIAG: TerraceFinance + DB-patch 16month → full flow', async ({ db, api, testEnv }) => {
  test.setTimeout(300_000);

  const merchant = MERCHANTS['TerraceFinance'];
  const merchantInfo = { username: merchant.username, password: merchant.password, number: merchant.number };
  const runId = generateRunId();
  const email = testEnv.generateUniqueEmailAlias();
  const ssn = generateTestSSN(true); // not ending in 9 → UW_APPROVED

  const applicant = {
    firstName: `TestFN${runId.slice(-4)}`,
    lastName: `TestLN${runId.slice(-4)}`,
    email,
    ssn,
    phone: generateTestPhone(),
    address: '123 Main St',
    city: 'New York',
    state: 'NY',
    zip: '10001',
    dob: '01/01/1984',
  };

  // 1. sendApplication
  const appResp = await api.application.sendApplication(merchantInfo, applicant);
  console.log('sendApplication:', appResp.status, appResp.body?.transactionMessage);
  expect(appResp.ok, `sendApplication: ${appResp.status}`).toBeTruthy();

  const leadPk = String(appResp.body.authorizationNumber ?? '');
  const leadUuid = appResp.body.accountNumber ?? leadPk;
  console.log(`leadPk=${leadPk} leadUuid=${leadUuid}`);

  // 2. Wait for UW_APPROVED
  const approved = await db.waitForValueEquals(
    'SELECT lead_status FROM uown_los_lead WHERE pk = $1',
    [leadPk], 'UW_APPROVED', 60_000
  );
  expect(approved, `Lead ${leadPk} did not reach UW_APPROVED`).toBeTruthy();

  const uwBefore = await db.query(`SELECT eligible_terms, uw_status FROM uown_los_uwdata WHERE lead_pk = $1`, [leadPk]);
  console.log('UW before patch:', JSON.stringify(uwBefore));

  // 3. DB-patch: eligible_terms=16, merchant_program_pk=207 (KW-16-1, money_factor=0.625)
  await db.executeUpdate(`UPDATE uown_los_uwdata SET eligible_terms = '16' WHERE lead_pk = $1`, [leadPk]);
  await db.executeUpdate(`UPDATE uown_los_lead SET merchant_program_pk = 207 WHERE pk = $1`, [leadPk]);
  console.log('Patched eligible_terms=16, merchant_program_pk=207');

  // 4. sendInvoice
  const invResp = await api.invoice.sendInvoice(merchantInfo, leadUuid, { orderTotal: '500.00' });
  console.log('sendInvoice:', invResp.status, invResp.body?.transactionMessage);
  expect(invResp.ok, `sendInvoice: ${invResp.status}`).toBeTruthy();

  // 5. authorizeCreditCard
  const ccResp = await api.creditCard.authorizeCreditCard(leadPk, applicant.firstName, applicant.lastName);
  console.log('authorizeCreditCard:', ccResp.status, JSON.stringify(ccResp.body).slice(0, 200));
  expect(ccResp.ok, `authorizeCreditCard: ${ccResp.status} ${JSON.stringify(ccResp.body)}`).toBeTruthy();

  // 6. driveLeadToFunding
  const ctx = {
    leadPk, leadUuid,
    accountPk: '', accountNumber: '', contractStatus: '', contractUrl: '', websiteAccountPk: '',
    achAdded: 0, ccAdded: 0, reportKeys: new Map<string, string>(),
  };
  await driveLeadToFunding(api, merchantInfo, ctx);
  console.log('driveLeadToFunding done');

  // 7. FUNDED
  await sleep(2_000);
  const fundedResp = await api.lead.updateFundingStatus([Number(leadPk)], 'FUNDED');
  console.log('updateFundingStatus:', fundedResp.status);
  expect(fundedResp.ok, `funded: ${fundedResp.status}`).toBeTruthy();

  // 8. Wait for SVC account
  const accountPk = await db.waitForAccountByLeadPk(leadPk);
  console.log('accountPk:', accountPk);
  expect(accountPk, 'SVC account not created').toBeTruthy();

  const term = await db.getSingleNumber('SELECT term_in_months FROM uown_sv_sched_summary WHERE account_pk = $1', [accountPk]);
  console.log('term_in_months:', term);

  // 9. getPayoffAmount
  const payoff = await api.svcPayoff.getPayoffAmount(accountPk!);
  console.log('=== RESULT ===');
  console.log(`leadPk=${leadPk} accountPk=${accountPk} term=${term} payoffStatus=${payoff.status} payoffBody=${JSON.stringify(payoff.body).slice(0, 500)}`);
  expect(payoff.status, `getPayoffAmount: ${payoff.status}`).toBe(200);
});

/**
 * uownRU03261500_displayContractBalanceInsteadOfNegativeAmountInEarlyPayoff90DayPayoff_504
 *
 * Validates the fix for bug in PayOffAmountService.getAnytimeBuyout():
 * When kwBuyoutAmount <= 0 (EPO negative due to large payment), the method
 * should substitute contractBalance instead of returning HTTP 500
 * (UnsupportedOperationException caused by calling .add() on an immutable
 * List.of() / Stream.toList() introduced in Java 16+).
 *
 * Routing logic:
 *   getPayOffAmount(accountPk)
 *     ├─ IF termInMonths == 16 → getAnytimeBuyout()   ← THE FIX (and the bug)
 *     ├─ ELSE IF KORNERSTONE → getKornerstoneEpo()
 *     └─ ELSE → getEpoCalculation()
 *
 * The fix activates only when BOTH conditions are true simultaneously:
 *   1. termInMonths == 16 (Kornerstone 16-month accounts — FifthAveFurnitureNY / KS3015)
 *   2. kwBuyoutAmount <= 0 (payments >= anytimeBuyoutAmountWithTax)
 *
 * CT-01  — EPO positivo — comportamento normal (termInMonths=16, no large payment)
 * CT-02  — EPO negativo → contractBalance retornado
 * CT-03  — EPO negativo → epoBalance == contractBalance
 * CT-04  — getPayoffAmount retorna contractBalance
 * CT-05  — getAccountSummary.epoBalance correto
 * CT-07  — Breakdown com/sem linha contractBalance
 * CT-08  — Conta padrão UOwn não afetada (TerraceFinance, non-16-month)
 * CT-09  — Kornerstone KW (non-16-month) não afetado
 * CT-10  — Verificação visual no Servicing Portal [test.skip — requires browser]
 * CT-11  — EPO negativo → getPayoffAmount retorna HTTP 200 (fix commit 9885ca0e)
 * CT-12  — Conta encerrada não dispara UnsupportedOperationException
 * CT-13  — Config toggles via ambiente [test.skip — requires manual config change]
 *
 * GitLab: Task #504 — RU03.26.1.50.0
 * Pipeline: new-api (API + DB validation)
 * No browser required.
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { MERCHANTS } from '@data/merchants.js';

import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';
import {
  generateTestPhone,
  generateRunId,
} from '@config/constants.js';
import {
  buildSendApplicationBody,
} from '@api/bodies/application.body.js';


import { sleep } from '@helpers/common.helpers.js';
import { loginToPortalWithOptions } from '@helpers/auth.helpers.js';
import { ServicingCustomerPage } from '@pages/servicing/customer.page.js';

// ── Test name constant ───────────────────────────────────────────────

const TEST_NAME =
  'uownRU03261500_displayContractBalanceInsteadOfNegativeAmountInEarlyPayoff90DayPayoff_504';

// ── Test data ────────────────────────────────────────────────────────

const testData = [
  {
    env: 'qa1',
    state: 'NY',
    merchantKey: 'FifthAveFurnitureNY',  // KS3015 — settlement works; term_in_months override to 16
    tag: buildTags(TestTag.REGRESSION, TestTag.CRITICAL, TestTag.QA1),
  },
  // TODO: Switch to GriffinsFurniture (KS5936) once e-sign/settlement is configured.
  // KS5936 has only the 16-month program (KW-16-2) natively — no term_in_months override needed.
];

// ── Test SSNs ────────────────────────────────────────────────────────
//
// GDS test DB for campaign 170 is unreliable — SSNs randomly return
// "No hit on subject with TU". UW approval is forced via DB after
// sendApplication (see createFundedAccount step 2b).
// Fixed per-group SSNs avoid CANCELLED_DUP_SSN between beforeAll scopes.
const SSN = {
  KS3015_EPO_POS:  '100200300', // EPO positivo group (CT-01, CT-08) — fresh SSN
  KS3015_EPO_NEG:  '100200301', // EPO negativo group (CT-02..CT-07, CT-11)
  KS3015_CT12:     '100200302', // CT-12 cancelled account
  KS3015_CT09:     '100200306', // CT-09 non-16-month Kornerstone (natural 13-month)
  TERRACE_CT08:    '109286127', // TerraceFinance CT-08 (campaign 151)
} as const;

// Merchant program PKs for DB override.
// ApplicationProcessor.java has programName→merchantProgramPk in a commented-out TODO,
// so merchant_program_pk is never set via sendApplication. Without it,
// CalculatorService.getFeeToBeChargedForLead() throws SvcException.
//
// KS3015 (pk=7099): program 207 = KW-16-1 (16 months, epo_days=90)
//   → term_in_months forced to 16 via uown_sv_sched_summary override (CT-01, CT-11, CT-12)
//   → routes to getAnytimeBuyout() ← the bug path
// KS3015 13-month: program 8 = "2017 SC Program (SAC 13mo Code 2)"
//   → natural 13-month from uown_merchant_to_program (CT-09)
//   → routes to getKornerstoneEpo() — not affected by bug
// TerraceFinance (pk=6403): program 88 = "2018 13 Month Program(SAC) Common" (13 months)
const PROGRAM_PK = {
  KS3015_16_MONTH: 207,
  KS3015_13_MONTH: 8,
  TERRACE_13_MONTH: 88,
} as const;

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Build a funded account via API using the pre-qualification pattern:
 *   sendApplication (WITHOUT order) → UW_APPROVED (DB) → sendInvoice (with DB approvedAmount)
 *   → CC auth → driveToFunding → FUNDED → SVC account.
 *
 * This avoids the two-step (application+order, then sendInvoice) flow which
 * fails with HTTP 500 for Kornerstone merchants (KS3015) — Kornerstone expects
 * the invoice to be sent separately AFTER approval, not together with application.
 *
 * Returns leadPk and accountPk (SVC primary key).
 */
async function createFundedAccount(
  api: Parameters<Parameters<typeof test>[2]>[0]['api'],
  db: Parameters<Parameters<typeof test>[2]>[0]['db'],
  testEnv: Parameters<Parameters<typeof test>[2]>[0]['testEnv'],
  merchant: (typeof MERCHANTS)[string],
  state: string,
  opts: { ssn: string; programPk: number },
): Promise<{ leadPk: string; accountPk: string }> {
  const runId = generateRunId();
  const phone = generateTestPhone();
  const email = testEnv.generateUniqueEmailAlias();

  const merchantInfo = {
    username: merchant.username,
    password: merchant.password,
    number: merchant.number,
  };

  const applicant = {
    firstName: `TestFN${runId.slice(-4)}`,
    lastName: `TestLN${runId.slice(-4)}`,
    email,
    ssn: opts.ssn,
    phone,
    address: '123 Main St',
    city: 'New York',
    state,
    zip: '10001',
    dob: '01/01/1984',
  };

  // 1. Send application WITHOUT order (pre-qualification pattern for Kornerstone).
  //    Kornerstone merchants expect the invoice to be sent separately AFTER approval
  //    via sendInvoice. Sending order data in sendApplication creates an invoice row
  //    that causes sendInvoice to fail with HTTP 500 (conflict / duplicate).
  const appBody = buildSendApplicationBody(merchantInfo, applicant);
  const appResp = await api.application.sendApplication(appBody);
  expect(appResp.ok, `sendApplication responded with ${appResp.status}`).toBeTruthy();
  const leadPk = String(appResp.body.authorizationNumber ?? '');
  const leadUuid = appResp.body.accountNumber ?? leadPk;
  expect(leadPk, 'leadPk must not be empty').toBeTruthy();
  console.log(`[Setup] leadPk="${leadPk}" leadUuid="${leadUuid}"`);

  // 2. Wait for GDS to finish processing (GDS test DB for campaign 170 is unreliable;
  //    new SSNs always get "No hit on subject with TU" → UW_DENIED within ~3-5s).
  await sleep(6_000);

  // 2b. Force UW_APPROVED via DB — bypasses GDS entirely.
  //     max_approval_amount=2000 ensures sendInvoice ($1200 order) does not reject
  //     with "Cost is greater than the approved amount".
  await db.executeUpdate(
    `UPDATE uown_los_lead
       SET lead_status = 'UW_APPROVED', internal_status = 'UW_APPROVED', max_approval_amount = 2000
     WHERE pk = $1`,
    [leadPk],
  );
  const uwdataUpdated = await db.executeUpdate(
    `UPDATE uown_los_uwdata
       SET uw_status = 'APPROVED', internal_decision = 'UW_APPROVED',
           approval_amount = 2000, uw_approval_amount = 2000, campaign_id = 170
     WHERE lead_pk = $1`,
    [leadPk],
  );
  if (uwdataUpdated === 0) {
    // GDS row not created yet — insert one so sendInvoice can read the approval
    await db.executeUpdate(
      `INSERT INTO uown_los_uwdata
         (lead_pk, uw_status, internal_decision, approval_amount, uw_approval_amount,
          campaign_id, charge_processing_fee, bank_verification_required,
          is_intellicheck_required, decided_by_agent, lambda_segment, risk_type,
          approval_expiration_date, decision_made_at, row_created_timestamp)
       VALUES ($1, 'APPROVED', 'UW_APPROVED', 2000, 2000, 170, false, false, false,
               'GDS', 11, 'DEFAULT', CURRENT_DATE + 30, NOW(), NOW())`,
      [leadPk],
    );
  }
  console.log(`[Setup] Lead ${leadPk} → UW_APPROVED (DB override)`);

  // 3. Send invoice AFTER UW approval (invoice sent before approval = HTTP 500).
  //    merchant_program_pk is NOT set yet — sendInvoice does not require it.
  //    Use unique invoiceNumber to avoid DB unique-constraint conflict in QA1.
  const invoiceResp = await api.invoice.sendInvoice(merchantInfo, leadUuid, {
    orderTotal: '1200.00',
    invoiceNumber: `R${runId.slice(-6)}`,
  });
  expect(invoiceResp.ok, `sendInvoice responded with ${invoiceResp.status}`).toBeTruthy();
  console.log(`[Setup] sendInvoice → OK`);

  // 4. Set merchant_program_pk via DB BEFORE CC auth.
  //    ApplicationProcessor.java has this mapping in a commented-out TODO block,
  //    so merchant_program_pk is always null after sendApplication.
  //    Without it, CalculatorService.getFeeToBeChargedForLead() throws
  //    SvcException("Merchant program is required...") → authorizeCreditCard HTTP 500.
  await db.executeUpdate(
    'UPDATE uown_los_lead SET merchant_program_pk = $1 WHERE pk = $2',
    [opts.programPk, leadPk],
  );
  console.log(`[Setup] Set merchant_program_pk=${opts.programPk} on lead ${leadPk}`);

  // 5. CC auth
  const ccResp = await api.creditCard.authorizeCreditCard(leadPk, applicant.firstName, applicant.lastName);
  expect(ccResp.ok, `authorizeCreditCard responded with ${ccResp.status}`).toBeTruthy();
  console.log(`[Setup] authorizeCreditCard → OK`);

  // 6. Drive to SIGNED → SETTLED → FUNDING
  const signedResp = await api.lead.changeLeadStatus(
    merchantInfo, Number(leadPk), 'SIGNED', 'Automated - SIGNED',
  );
  expect(signedResp.ok, `changeLeadStatus SIGNED: ${signedResp.status}`).toBeTruthy();
  console.log(`[Setup] Lead ${leadPk} → SIGNED`);

  const settleResp = await api.settlement.settleApplication(merchantInfo, leadUuid);
  expect(settleResp.ok, `settleApplication: ${settleResp.status}`).toBeTruthy();
  console.log(`[Setup] Lead ${leadPk} → SETTLED`);

  await sleep(3_000);
  const fundingResp = await api.lead.updateFundingStatus([Number(leadPk)], 'FUNDING');
  expect(fundingResp.ok, `updateFundingStatus FUNDING: ${fundingResp.status}`).toBeTruthy();
  console.log(`[Setup] Lead ${leadPk} → FUNDING`);

  // 7. Re-apply merchant_program_pk before FUNDED
  await db.executeUpdate(
    'UPDATE uown_los_lead SET merchant_program_pk = $1 WHERE pk = $2',
    [opts.programPk, leadPk],
  );
  console.log(`[Setup] Re-applied merchant_program_pk=${opts.programPk} before FUNDED`);

  // 8. Move to FUNDED
  await sleep(2_000);
  const fundedResp = await api.lead.updateFundingStatus([Number(leadPk)], 'FUNDED');
  expect(fundedResp.ok, `updateFundingStatus FUNDED: ${fundedResp.status}`).toBeTruthy();
  console.log(`[Setup] Lead ${leadPk} → FUNDED`);

  // 8. Wait for SVC account (async creation after FUNDED)
  const accountPk = await db.waitForAccountByLeadPk(leadPk);
  expect(accountPk, `SVC account not created for leadPk=${leadPk} within 30s`).toBeTruthy();
  console.log(`[Setup] accountPk="${accountPk}" for leadPk="${leadPk}"`);

  // 9. Override term_in_months in uown_sv_sched_summary to match opts.programPk.
  //    PayOffAmountService.getPayOffAmount() routes to getAnytimeBuyout() when
  //    schedSummaryInfo.getTermInMonths() == 16 (line ~62).
  //    CalculatorService uses getLTOProgramsForLead() → uown_merchant_to_program,
  //    which for KS3015 only has 13-month (program 207 is NOT linked there).
  //    We force term_in_months to the expected value for the test scenario.
  const programTermMonths = await db.getSingleNumber(
    'SELECT term_months FROM uown_merchant_program WHERE pk = $1',
    [opts.programPk],
  );
  if (programTermMonths !== null) {
    await db.executeUpdate(
      'UPDATE uown_sv_sched_summary SET term_in_months = $1 WHERE account_pk = $2',
      [programTermMonths, accountPk],
    );
    console.log(`[Setup] Forced term_in_months=${programTermMonths} on sched_summary for accountPk=${accountPk}`);
  }

  return { leadPk, accountPk: accountPk! };
}

/**
 * Force kwBuyoutAmount <= 0 by inserting a PAID payment directly in uown_sv_payment.
 *
 * CC gateway in QA1 does not process payments for automation-created accounts
 * (creates REQUEST transaction but never calls gateway — paymentPk remains null).
 * Direct DB insert is the only reliable method.
 *
 * getAnytimeBuyout(): kwBuyoutAmount = anytimeBuyoutAmountWithTax - totalPaymentAmount
 * For daysUsed=0, anytimeBuyoutAmountWithTax ≈ 1244. A $5000 PAID record → kwBuyoutAmount ≈ -3756.
 */
async function forceEpoNegativeViaDbPayment(
  db: Parameters<Parameters<typeof test>[2]>[0]['db'],
  accountPk: string,
): Promise<void> {
  await db.executeUpdate(
    `INSERT INTO uown_sv_payment
       (account_pk, payment_amount, payment_date, payment_type, status,
        allocation_strategy, is_ach, is_credit_card, most_recent,
        non_taxable_payment, taxable_payment, agent_username, row_created_timestamp)
     VALUES ($1, 5000.00, CURRENT_DATE, 'CC', 'PAID',
             'REGULAR_RECEIVABLES', false, true, false,
             4500.00, 500.00, 'AUTOMATION', NOW())`,
    [accountPk],
  );
  console.log(`[Setup] Inserted $5000 PAID payment for accountPk=${accountPk}`);
}

// ── Suite ────────────────────────────────────────────────────────────

for (const data of testData) {
  const merchant = MERCHANTS[data.merchantKey];          // KS5936 — 16-month only
  const merchantUown = MERCHANTS['TerraceFinance'];       // non-Kornerstone 13-month
  const merchantKS3015 = MERCHANTS['FifthAveFurnitureNY']; // Kornerstone 13-month (CT-09)

  test.describe(
    `${TEST_NAME} - ${data.env}/${merchant.number}`,
    { tag: splitTags(data.tag) },
    () => {
      test.use({ envName: data.env });

      // ══════════════════════════════════════════════════════════════════
      // Sub-describe 1: EPO positivo (no large payment)
      // Covers: CT-01, CT-08, CT-09
      // ══════════════════════════════════════════════════════════════════
      test.describe('EPO positivo', () => {
        let accountPkPos: string;
        let accountPkUown: string;
        let accountPkKS3015: string;
        let leadPkPos: string;

        test.beforeAll(
          async ({ api, db, testEnv }) => {
            test.setTimeout(300_000);

            // Create funded 16-month GriffinsFurniture (KS5936) account (no large payment)
            const pos = await createFundedAccount(
              api,
              db,
              testEnv,
              merchant,
              data.state,
              { ssn: SSN.KS3015_EPO_POS, programPk: PROGRAM_PK.KS3015_16_MONTH },
            );
            accountPkPos = pos.accountPk;
            leadPkPos = pos.leadPk;
            console.log(
              `[beforeAll EPO+] accountPkPos="${accountPkPos}" leadPkPos="${leadPkPos}"`,
            );

            // Create funded standard UOwn account (TerraceFinance) for CT-08
            const uown = await createFundedAccount(
              api,
              db,
              testEnv,
              merchantUown,
              data.state,
              { ssn: SSN.TERRACE_CT08, programPk: PROGRAM_PK.TERRACE_13_MONTH },
            );
            accountPkUown = uown.accountPk;
            console.log(
              `[beforeAll EPO+] accountPkUown="${accountPkUown}" (TerraceFinance)`,
            );

            // Create funded Kornerstone 13-month account (KS3015) for CT-09
            const ks = await createFundedAccount(
              api,
              db,
              testEnv,
              merchantKS3015,
              'NY',
              { ssn: SSN.KS3015_CT09, programPk: PROGRAM_PK.KS3015_13_MONTH },
            );
            accountPkKS3015 = ks.accountPk;
            console.log(
              `[beforeAll EPO+] accountPkKS3015="${accountPkKS3015}" (FifthAveFurnitureNY)`,
            );
          },
        );

        // ──────────────────────────────────────────────────────────────
        // CT-01: EPO positivo — comportamento normal
        // ──────────────────────────────────────────────────────────────
        test(
          'CT-01: EPO positivo — getPayoffAmount retorna valor positivo sem erro',
          async ({ api, db, page, testEnv }) => {
            test.setTimeout(120_000);

            await test.step(
              'Verify term_in_months = 16 for KS3015 account (DB)',
              async () => {
                const termInMonths = await db.getSingleNumber(
                  'SELECT term_in_months FROM uown_sv_sched_summary WHERE account_pk = $1',
                  [accountPkPos],
                );
                console.log(`[CT-01] termInMonths=${termInMonths}`);
                expect(
                  termInMonths,
                  `Expected 16-month term for GriffinsFurniture (KS5936). Got: ${termInMonths}`,
                ).toBe(16);
              },
            );

            await test.step('getPayoffAmount returns HTTP 200 with positive value', async () => {
              const resp = await api.svcPayoff.getPayoffAmount(accountPkPos);
              console.log(
                `[CT-01] getPayoffAmount status=${resp.status} body=${JSON.stringify(resp.body)}`,
              );
              await test.info().attach('CT-01 getPayoffAmount response', {
                body: JSON.stringify({ status: resp.status, body: resp.body }),
                contentType: 'application/json',
              });
              expect(resp.status).toBe(200);
              expect(
                resp.body,
                'EPO amount should be positive when no large payment has been made',
              ).toBeGreaterThan(0);
            });

            await test.step('getAccountSummary returns HTTP 200 with positive epoBalance', async () => {
              const summaryResp = await api.svcPayoff.getAccountSummary(accountPkPos);
              console.log(
                `[CT-01] getAccountSummary status=${summaryResp.status} body=${JSON.stringify(summaryResp.body)}`,
              );
              await test.info().attach('CT-01 getAccountSummary response', {
                body: JSON.stringify({
                  status: summaryResp.status,
                  body: summaryResp.body,
                }),
                contentType: 'application/json',
              });
              expect(summaryResp.status).toBe(200);
              expect(
                summaryResp.body.epoBalance,
                'epoBalance should be positive for account with no large payment',
              ).toBeGreaterThan(0);

              // Breakdown should NOT contain 'contractBalance' when EPO is positive
              const headers = summaryResp.body.epoBreakdown?.[0] ?? [];
              console.log(`[CT-01] epoBreakdown headers: ${JSON.stringify(headers)}`);
              expect(
                headers,
                'EPO breakdown should not contain contractBalance when EPO is positive',
              ).not.toContain('contractBalance');
            });

            await test.step('UI: Login to Servicing Portal and verify account EPO', async () => {
              await loginToPortalWithOptions(page, testEnv.servicingUrl, testEnv);
              const servicingPage = new ServicingCustomerPage(page);
              await servicingPage.navigateToCustomer(accountPkPos);

              // Verify account is ACTIVE in the UI
              const status = await servicingPage.getAccountStatus();
              console.log(`[CT-01] UI accountStatus="${status}"`);
              expect(status.toUpperCase()).toContain('ACTIVE');

              // Verify EPO section is visible (Early Payoff / 90 Day Pay Off)
              const epoSection = page.locator('text=Early Payoff').first();
              await expect(epoSection).toBeVisible({ timeout: 10_000 });
              console.log(`[CT-01] UI: Early Payoff section visible`);

              // Take screenshot for evidence
              await page.screenshot({ path: `reports/ct01-epo-positive-${accountPkPos}.png` });
              console.log(`[CT-01] Screenshot saved`);
            });
          },
        );

        // ──────────────────────────────────────────────────────────────
        // CT-08: Conta padrão UOwn não afetada
        // ──────────────────────────────────────────────────────────────
        test(
          'CT-08: Conta padrão UOwn (TerraceFinance) não retorna erro no getPayoffAmount',
          async ({ api }) => {
            test.setTimeout(60_000);

            await test.step('getAccountSummary succeeds for standard UOwn account', async () => {
              const resp = await api.svcPayoff.getAccountSummary(accountPkUown);
              console.log(
                `[CT-08] TerraceFinance getAccountSummary status=${resp.status} body=${JSON.stringify(resp.body)}`,
              );
              await test.info().attach('CT-08 getAccountSummary response', {
                body: JSON.stringify({ status: resp.status, body: resp.body }),
                contentType: 'application/json',
              });
              expect(
                resp.status,
                'Standard UOwn account (non-16-month) should not return 500',
              ).toBe(200);
              // Standard UOwn path (getEpoCalculation) — epoBalance should be non-negative
              expect(
                resp.body.epoBalance,
                'Standard UOwn epoBalance should be non-negative',
              ).toBeGreaterThanOrEqual(0);
            });

            await test.step('getPayoffAmount succeeds for standard UOwn account', async () => {
              const resp = await api.svcPayoff.getPayoffAmount(accountPkUown);
              console.log(
                `[CT-08] TerraceFinance getPayoffAmount status=${resp.status} body=${JSON.stringify(resp.body)}`,
              );
              expect(
                resp.status,
                'Standard UOwn getPayoffAmount should not return 500',
              ).toBe(200);
            });
          },
        );

        // ──────────────────────────────────────────────────────────────
        // CT-09: Kornerstone KW (non-16-month) não afetado
        // ──────────────────────────────────────────────────────────────
        test(
          'CT-09: Kornerstone KW (non-16-month) não dispara getAnytimeBuyout()',
          async ({ api, db }) => {
            test.setTimeout(60_000);

            await test.step(
              'Verify term_in_months != 16 for KS3015 (13-month Kornerstone)',
              async () => {
                const termInMonths = await db.getSingleNumber(
                  'SELECT term_in_months FROM uown_sv_sched_summary WHERE account_pk = $1',
                  [accountPkKS3015],
                );
                console.log(`[CT-09] KS3015 termInMonths=${termInMonths}`);
                expect(termInMonths, 'KS3015 should NOT have 16-month term').not.toBe(16);
                expect(termInMonths, 'KS3015 should have 13-month term').toBe(13);
              },
            );

            await test.step(
              'getPayoffAmount returns HTTP 200 (Kornerstone EPO path, not getAnytimeBuyout)',
              async () => {
                const resp = await api.svcPayoff.getPayoffAmount(accountPkKS3015);
                console.log(
                  `[CT-09] KS3015 getPayoffAmount status=${resp.status} body=${JSON.stringify(resp.body)}`,
                );
                expect(resp.status, 'Kornerstone non-16-month should return 200').toBe(200);
                expect(resp.body, 'EPO amount should be positive').toBeGreaterThan(0);
              },
            );

            await test.step(
              'getAccountSummary returns positive epoBalance via getKornerstoneEpo path',
              async () => {
                const summaryResp = await api.svcPayoff.getAccountSummary(accountPkKS3015);
                console.log(
                  `[CT-09] KS3015 getAccountSummary status=${summaryResp.status} epoBalance=${summaryResp.body.epoBalance}`,
                );
                expect(summaryResp.status).toBe(200);
                expect(
                  summaryResp.body.epoBalance,
                  'epoBalance should be positive for Kornerstone non-16-month',
                ).toBeGreaterThan(0);
              },
            );
          },
        );
      });

      // ══════════════════════════════════════════════════════════════════
      // Sub-describe 2: EPO negativo — BUG e comportamento esperado
      // Covers: CT-11, CT-02, CT-03, CT-04, CT-05, CT-07
      // ══════════════════════════════════════════════════════════════════
      test.describe('EPO negativo — BUG e comportamento esperado', () => {
        test.describe.configure({ mode: 'serial' });

        let accountPkNeg: string;
        let leadPkNeg: string;

        test.beforeAll(
          async ({ api, db, testEnv }) => {
            test.setTimeout(300_000);

            // Create funded 16-month account
            const neg = await createFundedAccount(
              api,
              db,
              testEnv,
              merchant,
              data.state,
              { ssn: SSN.KS3015_EPO_NEG, programPk: PROGRAM_PK.KS3015_16_MONTH },
            );
            accountPkNeg = neg.accountPk;
            leadPkNeg = neg.leadPk;
            console.log(
              `[beforeAll EPO-] accountPkNeg="${accountPkNeg}" leadPkNeg="${leadPkNeg}"`,
            );
          },
        );

        // ──────────────────────────────────────────────────────────────
        // CT-11: Fix verification — commit 9885ca0e (mutable lists + null safety)
        // Makes a $5000 CC payment to push kwBuyoutAmount <= 0,
        // then verifies getPayoffAmount returns HTTP 200 with contractBalance.
        // ──────────────────────────────────────────────────────────────
        test(
          'CT-11: getPayoffAmount retorna HTTP 200 com contractBalance quando EPO <= 0 (fix 9885ca0e)',
          async ({ api, db }) => {
            test.setTimeout(120_000);

            await test.step(
              'Insert $5000 PAID payment to force EPO negative',
              async () => {
                await forceEpoNegativeViaDbPayment(db, accountPkNeg);
              },
            );

            await test.step(
              'getPayoffAmount returns HTTP 200 with positive value (fix deployed)',
              async () => {
                const resp = await api.svcPayoff.getPayoffAmount(accountPkNeg);
                console.log(
                  `[CT-11] getPayoffAmount status=${resp.status} body=${JSON.stringify(resp.body)}`,
                );
                await test.info().attach('CT-11 getPayoffAmount response', {
                  body: JSON.stringify({ status: resp.status, body: resp.body }),
                  contentType: 'application/json',
                });
                expect(
                  resp.status,
                  `Fix 9885ca0e: getPayoffAmount should return HTTP 200 (not 500). ` +
                  `If 500, fix not yet deployed to this environment.`,
                ).toBe(200);
                expect(
                  resp.body,
                  'returned payoff amount should be positive (contractBalance)',
                ).toBeGreaterThan(0);
                console.log(
                  `[CT-11] Fix verified: getPayoffAmount returned HTTP 200 for accountPk=${accountPkNeg}`,
                );
              },
            );

            await test.step(
              'getAccountSummary returns HTTP 200 with positive epoBalance',
              async () => {
                const summaryResp = await api.svcPayoff.getAccountSummary(accountPkNeg);
                console.log(
                  `[CT-11] getAccountSummary status=${summaryResp.status} epoBalance=${summaryResp.body.epoBalance}`,
                );
                expect(summaryResp.status).toBe(200);
                expect(
                  summaryResp.body.epoBalance,
                  'epoBalance should be positive',
                ).toBeGreaterThan(0);
              },
            );
          },
        );

        // ──────────────────────────────────────────────────────────────
        // CT-02: EPO negativo → Contract Balance (fix 9885ca0e deployed)
        // Uses forceEpoNegativeViaDbPayment from CT-11 beforeAll setup.
        // ──────────────────────────────────────────────────────────────
        test(
          'CT-02: EPO negativo → getPayoffAmount retorna contractBalance (HTTP 200)',
          async ({ api }) => {
            test.setTimeout(60_000);

            await test.step(
              'getPayoffAmount returns HTTP 200 (not 500) when EPO <= 0',
              async () => {
                const payoffResp = await api.svcPayoff.getPayoffAmount(accountPkNeg);
                console.log(
                  `[CT-02] getPayoffAmount status=${payoffResp.status} body=${JSON.stringify(payoffResp.body)}`,
                );
                await test.info().attach('CT-02 getPayoffAmount response', {
                  body: JSON.stringify({
                    status: payoffResp.status,
                    body: payoffResp.body,
                  }),
                  contentType: 'application/json',
                });
                expect(
                  payoffResp.status,
                  'getPayoffAmount should return HTTP 200 (not 500) when EPO is negative',
                ).toBe(200);
                expect(
                  payoffResp.body,
                  'returned payoff amount should be positive (contractBalance)',
                ).toBeGreaterThan(0);
              },
            );

            await test.step('getAccountSummary returns HTTP 200', async () => {
              const summaryResp = await api.svcPayoff.getAccountSummary(accountPkNeg);
              console.log(
                `[CT-02] getAccountSummary status=${summaryResp.status} body=${JSON.stringify(summaryResp.body)}`,
              );
              await test.info().attach('CT-02 getAccountSummary response', {
                body: JSON.stringify({
                  status: summaryResp.status,
                  body: summaryResp.body,
                }),
                contentType: 'application/json',
              });
              expect(
                summaryResp.status,
                'getAccountSummary should return HTTP 200',
              ).toBe(200);
              expect(
                summaryResp.body.epoBalance,
                'epoBalance should be positive (== contractBalance)',
              ).toBeGreaterThan(0);
              expect(
                summaryResp.body.epoBalance,
                'epoBalance should equal contractBalance when EPO is negative',
              ).toBe(summaryResp.body.contractBalance);
            });
          },
        );

        // ──────────────────────────────────────────────────────────────
        // CT-03: EPO negativo → epoBalance == contractBalance (fix 9885ca0e)
        // ──────────────────────────────────────────────────────────────
        test(
          'CT-03: epoBalance equals contractBalance quando EPO calculado é negativo',
          async ({ api }) => {
            test.setTimeout(60_000);

            await test.step(
              'getAccountSummary: epoBalance == contractBalance (positive)',
              async () => {
                const summaryResp = await api.svcPayoff.getAccountSummary(accountPkNeg);
                console.log(
                  `[CT-03] getAccountSummary status=${summaryResp.status} epoBalance=${summaryResp.body.epoBalance} contractBalance=${summaryResp.body.contractBalance}`,
                );
                await test.info().attach('CT-03 getAccountSummary response', {
                  body: JSON.stringify({
                    status: summaryResp.status,
                    epoBalance: summaryResp.body.epoBalance,
                    contractBalance: summaryResp.body.contractBalance,
                  }),
                  contentType: 'application/json',
                });
                // EXPECTED AFTER FIX: HTTP 200, epoBalance == contractBalance (positive)
                expect(
                  summaryResp.status,
                  'getAccountSummary should return HTTP 200',
                ).toBe(200);
                expect(
                  summaryResp.body.epoBalance,
                  'epoBalance should be positive (clamped to contractBalance)',
                ).toBeGreaterThan(0);
                expect(
                  summaryResp.body.contractBalance,
                  'contractBalance should be positive',
                ).toBeGreaterThan(0);
                expect(
                  summaryResp.body.epoBalance,
                  'epoBalance must equal contractBalance when calculated EPO is negative',
                ).toBe(summaryResp.body.contractBalance);
              },
            );
          },
        );

        // ──────────────────────────────────────────────────────────────
        // CT-04: getPayoffAmount retorna contractBalance (fix 9885ca0e)
        // ──────────────────────────────────────────────────────────────
        test(
          'CT-04: getPayoffAmount retorna valor igual ao contractBalance',
          async ({ api }) => {
            test.setTimeout(60_000);

            let payoffAmount: number;
            let contractBalance: number;

            await test.step(
              'getPayoffAmount returns positive value (not 500)',
              async () => {
                const payoffResp = await api.svcPayoff.getPayoffAmount(accountPkNeg);
                console.log(
                  `[CT-04] getPayoffAmount status=${payoffResp.status} body=${JSON.stringify(payoffResp.body)}`,
                );
                await test.info().attach('CT-04 getPayoffAmount response', {
                  body: JSON.stringify({
                    status: payoffResp.status,
                    body: payoffResp.body,
                  }),
                  contentType: 'application/json',
                });
                expect(payoffResp.status).toBe(200);
                expect(payoffResp.body).toBeGreaterThan(0);
                payoffAmount = payoffResp.body;
              },
            );

            await test.step(
              'getAccountSummary: contractBalance matches getPayoffAmount value',
              async () => {
                const summaryResp = await api.svcPayoff.getAccountSummary(accountPkNeg);
                console.log(
                  `[CT-04] getAccountSummary contractBalance=${summaryResp.body.contractBalance}`,
                );
                expect(summaryResp.status).toBe(200);
                contractBalance = summaryResp.body.contractBalance;
                expect(contractBalance).toBeGreaterThan(0);
                // getPayoffAmount (BigDecimal) should match contractBalance within 2 decimal places
                expect(
                  payoffAmount,
                  `getPayoffAmount (${payoffAmount}) should equal contractBalance (${contractBalance})`,
                ).toBeCloseTo(contractBalance, 2);
              },
            );
          },
        );

        // ──────────────────────────────────────────────────────────────
        // CT-05: getAccountSummary.epoBalance correto (fix 9885ca0e)
        // ──────────────────────────────────────────────────────────────
        test(
          'CT-05: getAccountSummary.epoBalance é positivo e igual ao contractBalance',
          async ({ api }) => {
            test.setTimeout(60_000);

            await test.step(
              'Verify epoBalance and contractBalance are both positive and equal',
              async () => {
                const resp = await api.svcPayoff.getAccountSummary(accountPkNeg);
                console.log(
                  `[CT-05] getAccountSummary status=${resp.status} epoBalance=${resp.body.epoBalance} contractBalance=${resp.body.contractBalance}`,
                );
                await test.info().attach('CT-05 getAccountSummary response', {
                  body: JSON.stringify({
                    status: resp.status,
                    body: resp.body,
                  }),
                  contentType: 'application/json',
                });
                expect(resp.status).toBe(200);
                expect(
                  resp.body.epoBalance,
                  'epoBalance must be positive (not negative, not zero)',
                ).toBeGreaterThan(0);
                expect(
                  resp.body.contractBalance,
                  'contractBalance must be positive',
                ).toBeGreaterThan(0);
                expect(
                  resp.body.epoBalance,
                  'epoBalance must equal contractBalance when EPO is negative',
                ).toBe(resp.body.contractBalance);
              },
            );
          },
        );

        // ──────────────────────────────────────────────────────────────
        // CT-07: Breakdown com/sem linha contractBalance (fix 9885ca0e)
        // ──────────────────────────────────────────────────────────────
        test(
          'CT-07: Breakdown contém contractBalance apenas quando EPO é negativo',
          async ({ api }) => {
            test.setTimeout(60_000);

            // Re-fetch positive account summary (accountPkPos from outer describe is
            // not in scope here; we use a fresh call via a shared account if available,
            // but since sub-describes are isolated, we document expected behavior only
            // for the negative account which is in scope).
            //
            // For the negative account: breakdown SHOULD contain 'contractBalance' key.
            await test.step(
              'EPO-negative account breakdown contains contractBalance key',
              async () => {
                const negSum = await api.svcPayoff.getAccountSummary(accountPkNeg);
                console.log(
                  `[CT-07] negSum status=${negSum.status} epoBreakdown=${JSON.stringify(negSum.body.epoBreakdown)}`,
                );
                await test.info().attach('CT-07 EPO-negative breakdown', {
                  body: JSON.stringify({
                    status: negSum.status,
                    epoBreakdown: negSum.body.epoBreakdown,
                  }),
                  contentType: 'application/json',
                });
                expect(negSum.status).toBe(200);

                const negHeaders = negSum.body.epoBreakdown?.[0] ?? [];
                console.log(
                  `[CT-07] negHeaders: ${JSON.stringify(negHeaders)}`,
                );
                expect(
                  negHeaders,
                  `epoBreakdown[0] should contain 'contractBalance' key for EPO-negative account. ` +
                  `Actual headers: ${JSON.stringify(negHeaders)}`,
                ).toContain('contractBalance');

                // The value at the contractBalance index must be positive
                const contractBalIdx = negHeaders.indexOf('contractBalance');
                const negValues = negSum.body.epoBreakdown?.[1] ?? [];
                const contractBalValue = parseFloat(negValues[contractBalIdx]);
                console.log(
                  `[CT-07] contractBalance value in breakdown: ${contractBalValue}`,
                );
                expect(
                  contractBalValue,
                  'contractBalance value in breakdown should be positive',
                ).toBeGreaterThan(0);
              },
            );
          },
        );
      });

      // ══════════════════════════════════════════════════════════════════
      // CT-12: Conta encerrada não dispara UnsupportedOperationException
      // ══════════════════════════════════════════════════════════════════
      test(
        'CT-12: Conta encerrada não retorna HTTP 500 no getPayoffAmount',
        async ({ api, db, testEnv }) => {
          test.setTimeout(300_000);

          let accountPkClosed: string;
          let leadPkClosed: string;

          await test.step('Create funded 16-month account', async () => {
            const closed = await createFundedAccount(
              api,
              db,
              testEnv,
              merchant,
              data.state,
              { ssn: SSN.KS3015_CT12, programPk: PROGRAM_PK.KS3015_16_MONTH },
            );
            accountPkClosed = closed.accountPk;
            leadPkClosed = closed.leadPk;
            console.log(
              `[CT-12] accountPkClosed="${accountPkClosed}" leadPkClosed="${leadPkClosed}"`,
            );
          });

          await test.step('Cancel the account', async () => {
            const cancelResp = await api.account.cancelAccount(
              accountPkClosed,
              'Automated test — cancel for CT-12',
              false,
            );
            console.log(
              `[CT-12] cancelAccount status=${cancelResp.status} body=${JSON.stringify(cancelResp.body)}`,
            );
            await test.info().attach('CT-12 cancelAccount response', {
              body: JSON.stringify({
                status: cancelResp.status,
                body: cancelResp.body,
              }),
              contentType: 'application/json',
            });
            // Cancel may return 200 or another success status
            expect(
              cancelResp.ok,
              `cancelAccount should succeed (got ${cancelResp.status})`,
            ).toBeTruthy();
          });

          await test.step(
            'getPayoffAmount on cancelled account — must NOT return 500',
            async () => {
              const payoffResp = await api.svcPayoff.getPayoffAmount(accountPkClosed);
              console.log(
                `[CT-12] Closed account getPayoffAmount response: status=${payoffResp.status} body=${JSON.stringify(payoffResp.body)}`,
              );
              await test.info().attach('CT-12 getPayoffAmount response', {
                body: JSON.stringify({
                  status: payoffResp.status,
                  body: payoffResp.body,
                }),
                contentType: 'application/json',
              });
              // Must NOT be 500 (no UnsupportedOperationException for cancelled accounts)
              expect(
                payoffResp.status,
                'Cancelled account should not return HTTP 500 — UnsupportedOperationException must not be thrown',
              ).not.toBe(500);
              // Acceptable: 200 (with $0 or residual value), 404, or specific business error
              console.log(
                `[CT-12] Closed account response: ${payoffResp.status} — OK (not 500)`,
              );
            },
          );
        },
      );

      // ══════════════════════════════════════════════════════════════════
      // CT-10: Verificação visual no Servicing Portal
      // ══════════════════════════════════════════════════════════════════
      test.skip(
        'CT-10: [SKIP] Verificação visual no Servicing Portal — requer browser',
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async ({ api }) => {
          // Skip reason: Requires browser automation to navigate the Servicing Portal
          // and verify that the Early Payoff amount displayed in the UI is positive
          // (matches contractBalance) rather than negative or zero.
          // Implement in tests/e2e/servicing/ with a ServicingCustomerPage test.
        },
      );

      // ══════════════════════════════════════════════════════════════════
      // CT-13: Config toggles via ambiente
      // ══════════════════════════════════════════════════════════════════
      test.skip(
        'CT-13: [SKIP] Config toggles via ambiente — requer mudança manual de config antes de executar',
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async ({ api }) => {
          // Skip reason: Requer mudança manual de config antes de executar.
          // This test validates that a feature flag or configuration toggle
          // controls the getAnytimeBuyout() path. Manual environment
          // reconfiguration is required before running this test.
        },
      );
    },
  );
}

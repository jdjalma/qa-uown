/**
 * Make Payment (Servicing Portal) — E2E
 *
 * Exercises the Make Payment modal on the Servicing customer-information page
 * (/customer-information/{accountPk} → #makePayment button). The agent submits
 * a one-time payment (Credit Card or ACH) against an ACTIVE account.
 *
 * Scenarios:
 *   1. Make CC Payment (happy path) — one-time VISA card, $100. Validates the
 *      success toast, the CC SALE row (APPROVED), the uown_sv_payment row
 *      (paymentType=CC), and the activity log trail (DATA_CHANGE "ADDED :
 *      Payment[...paymentType=CC...]" + CREDIT_CARD "SALE ... APPROVED" +
 *      CORRESPONDENCE "PaymentReceiptEmail").
 *   2. Make ACH Payment — one-time bank account, $100. Validates the toast, the
 *      synchronous uown_sv_achpayment row (status=PENDING, amount=100.00) and the
 *      synchronous "ADDED : ACHPayment[...status=PENDING...amount=100...]" activity
 *      log. NOTE: PICKED_TO_SEND status and the uown_sv_payment row are produced only
 *      by the daily ACH sweep (~16:45 dev3 / ~19h), so they are NOT asserted here.
 *   3. Overpayment accepted (expected behavior) — amount = contract balance + buffer.
 *      The portal accepts the payment, processes the CC SALE, and the refund of the
 *      excess is handled by a separate back-office process. Validates the success
 *      toast, a new uown_sv_payment row (paymentType=CC) at the submitted amount, an
 *      APPROVED CC SALE, and the ADDED:Payment activity log.
 *
 * Strategy: fresh lead per test → FUNDING (account ACTIVE) → exercise the Make
 * Payment modal via the browser → validate UI (toast/grid) + DB + activity log.
 *
 * Run: ENV=dev3 npx playwright test tests/e2e/servicing/make-payment-servicing.spec.ts --reporter=list
 */
import { test, expect } from '@support/base-test.js';
import {
  ServicingAccountSummaryPage,
  CreditCardHistoryPage,
} from '@pages/servicing/index.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';
import {
  buildTestData,
  createPreQualifiedApplication,
  driveLeadToFunding,
  loginToPortalWithOptions,
} from '@helpers/index.js';
import { TEST_CARDS, TEST_BANK } from '@config/index.js';

const PAYMENT_DATA = {
  state: 'CA',
  merchant: 'ProgressMobility',
  paymentAmount: '100',
  /** Amount added on top of the contract balance to force an overpayment in S3. */
  overpaymentBuffer: 1,
  /** Conservative fallback overpayment when the EPO panel balance can't be read. */
  fallbackOverpayment: '999999',
  tag: buildTags(TestTag.REGRESSION),
};

test.describe('Make Payment via Servicing Portal', { tag: splitTags(PAYMENT_DATA.tag) }, () => {
  test.describe.configure({ mode: 'serial' });

  let accountPk = '';
  let leadPk = '';
  let applicantFirstName = '';
  let applicantLastName = '';
  let billing = { address: '', city: '', state: '', zip: '' };

  test.beforeEach(async ({ api, ctx, db }) => {
    test.setTimeout(420_000);
    // Fresh data per test — no emailOverride, unique email per run (avoids DataMismatchStep).
    const { env, merchant, applicant } = buildTestData({
      state: PAYMENT_DATA.state,
      merchant: PAYMENT_DATA.merchant,
      orderTotal: '800',
      orderDescription: 'Servicing make-payment test',
    });
    void env;

    await test.step('Setup: application → FUNDING (account ACTIVE)', async () => {
      // createPreQualifiedApplication runs merchant preflight automatically (rule #12).
      await createPreQualifiedApplication(
        api, merchant, applicant, ctx, { submitPaymentInfoViaApi: true }, test.info(),
      );
      await driveLeadToFunding(api, merchant, ctx);
      leadPk = ctx.leadPk;

      const resolved = await db.waitForAccountByLeadPk(ctx.leadPk, 60_000);
      expect(resolved, `account not created for leadPk=${ctx.leadPk}`).toBeTruthy();
      accountPk = resolved!;
      ctx.accountPk = accountPk;

      applicantFirstName = applicant.firstName;
      applicantLastName = applicant.lastName;
      billing = {
        address: applicant.address,
        city: applicant.city,
        state: applicant.state,
        zip: applicant.zip,
      };
      console.log(`[Setup] leadPk=${leadPk} accountPk=${accountPk}`);
    });
  });

  test('Scenario 1 — Make CC Payment (happy path) of $100', async ({ page, testEnv, db }) => {
    test.setTimeout(240_000);
    const summaryPage = new ServicingAccountSummaryPage(page);

    await test.step('Login and open customer-information page', async () => {
      await loginToPortalWithOptions(page, testEnv.servicingUrl, testEnv, 'manager');
      await summaryPage.navigateToCustomerInformation(testEnv.servicingUrl, accountPk);
    });

    await test.step(`Make one-time CC payment of $${PAYMENT_DATA.paymentAmount}`, async () => {
      const card = TEST_CARDS.VISA_APPROVED;
      await summaryPage.makeCcPayment('NA', PAYMENT_DATA.paymentAmount, {
        cardNumber: card.number,
        expMonth: card.expMonth,
        expYear: card.expYear,
        csc: card.cvv,
        address: billing.address,
        city: billing.city,
        state: billing.state,
        zip: billing.zip,
        firstName: applicantFirstName,
        lastName: applicantLastName,
      });
      const toast = await summaryPage.captureAndDismissToast(20_000);
      console.log(`[S1] Make CC payment toast: "${toast}"`);
      expect(toast.toLowerCase()).not.toContain('error');
    });

    await test.step('Validate DB: uown_sv_payment row created (paymentType=CC)', async () => {
      const present = await db.waitForRecord(
        'uown_sv_payment',
        "account_pk = $1 AND payment_type = 'CC'",
        [accountPk],
        60_000,
      );
      expect(present, 'expected a CC uown_sv_payment row').toBeTruthy();
      const rows = await db.query<{ pk: number; payment_type: string; payment_amount: number; is_credit_card: boolean }>(
        `SELECT pk, payment_type, payment_amount, is_credit_card FROM uown_sv_payment
         WHERE account_pk = $1 AND payment_type = 'CC'
         ORDER BY pk DESC LIMIT 1`,
        [accountPk],
      );
      const row = rows[0];
      expect(row, 'expected a CC uown_sv_payment row').toBeTruthy();
      expect(row.is_credit_card).toBeTruthy();
      expect(Number(row.payment_amount)).toBeCloseTo(Number(PAYMENT_DATA.paymentAmount), 2);
      console.log(`[S1] uown_sv_payment pk=${row.pk} type=${row.payment_type}`);
    });

    await test.step('Validate DB: CC SALE transaction APPROVED', async () => {
      const approved = await db.query<{ pk: number; amount: number; status: string }>(
        `SELECT pk, amount, status FROM uown_sv_credit_card_transaction
         WHERE account_pk = $1 AND cc_action = 'SALE' AND status = 'APPROVED'
         ORDER BY pk DESC LIMIT 1`,
        [accountPk],
      );
      expect(approved.length, 'expected an APPROVED SALE CC transaction').toBeGreaterThan(0);
      console.log(`[S1] APPROVED SALE CC tx pk=${approved[0].pk} amount=${approved[0].amount}`);
    });

    await test.step('Validate CC Transactions grid: SALE row rendered (UI-first, rule #14)', async () => {
      const ccPage = new CreditCardHistoryPage(page);
      await ccPage.navigateToCcHistoryByUrl(testEnv.servicingUrl, accountPk);
      const sale = await db.query<{ pk: number }>(
        `SELECT pk FROM uown_sv_credit_card_transaction
         WHERE account_pk = $1 AND cc_action = 'SALE' AND status = 'APPROVED'
         ORDER BY pk DESC LIMIT 1`,
        [accountPk],
      );
      const saleTxPk = sale[0].pk;
      const status = await ccPage.getRowStatus(saleTxPk);
      console.log(`[S1] CC grid SALE tx=${saleTxPk} status=${status}`);
      expect(status).toContain('APPROVED');
    });

    await test.step('Validate activity log: DATA_CHANGE ADDED Payment (paymentType=CC)', async () => {
      const logs = await db.getActivityLogsByAccount(accountPk, 'ADDED : Payment');
      const ccAdded = logs.find((l) => String(l.notes).includes('paymentType=CC'));
      expect(ccAdded, 'expected DATA_CHANGE "ADDED : Payment[...paymentType=CC...]"').toBeTruthy();
      console.log(`[S1] DATA_CHANGE log: ${String(ccAdded!.notes).slice(0, 160)}`);
    });

    await test.step('Validate activity log: CREDIT_CARD SALE APPROVED', async () => {
      const logs = await db.getActivityLogsByAccount(accountPk, 'Type : SALE');
      const saleApproved = logs.find((l) => String(l.notes).includes('Status : APPROVED'));
      expect(saleApproved, 'expected CREDIT_CARD "SALE ... APPROVED" log').toBeTruthy();
      console.log(`[S1] CREDIT_CARD log: ${String(saleApproved!.notes).slice(0, 160)}`);
    });

    await test.step('Validate activity log: CORRESPONDENCE PaymentReceiptEmail', async () => {
      const logs = await db.getActivityLogsByAccount(accountPk, 'PaymentReceiptEmail');
      expect(logs.length, 'expected CORRESPONDENCE "PaymentReceiptEmail" log').toBeGreaterThan(0);
      console.log(`[S1] CORRESPONDENCE log: ${String(logs[0].notes).slice(0, 160)}`);
    });
  });

  test('Scenario 2 — Make ACH Payment (one-time bank) of $100', async ({ page, testEnv, db }) => {
    test.setTimeout(240_000);
    const summaryPage = new ServicingAccountSummaryPage(page);

    await test.step('Login and open customer-information page', async () => {
      await loginToPortalWithOptions(page, testEnv.servicingUrl, testEnv, 'manager');
      await summaryPage.navigateToCustomerInformation(testEnv.servicingUrl, accountPk);
    });

    await test.step(`Make ACH payment of $${PAYMENT_DATA.paymentAmount} (existing bank on file or one-time)`, async () => {
      // makeAchPayment auto-selects an existing bank on file when present;
      // otherwise it fills the one-time bank fields with these details.
      await summaryPage.makeAchPayment('NA', PAYMENT_DATA.paymentAmount, {
        institute: 'Test Bank',
        accountNumber: TEST_BANK.DEFAULT_ACCOUNT,
        routingNumber: TEST_BANK.DEFAULT_ROUTING,
      });
      const toast = await summaryPage.captureAndDismissToast(20_000);
      console.log(`[S2] Make ACH payment toast: "${toast}"`);
      expect(toast.toLowerCase()).not.toContain('error');
    });

    // NOTE (Option A — corrected by primary-source evidence, dev3 acct 151/ach pk 135):
    // The immediate, deterministic effect of an ACH submit via UI is a uown_sv_achpayment
    // row inserted SYNCHRONOUSLY in status='PENDING' (amount=100.00). Only the daily ACH
    // sweep (~16:45 dev3 / ~19h prod) later promotes it to PICKED_TO_SEND and assigns it to
    // PROFITUITY. The uown_sv_payment row for ACH is also created post-sweep. So we assert
    // the synchronous PENDING achpayment row here — NOT PICKED_TO_SEND (which would make the
    // test depend on a scheduled batch) and NOT uown_sv_payment (post-sweep only).
    await test.step("Validate DB: uown_sv_achpayment row created synchronously (status=PENDING)", async () => {
      const present = await db.waitForRecord(
        'uown_sv_achpayment',
        "account_pk = $1 AND status = 'PENDING'",
        [accountPk],
        60_000,
      );
      expect(present, "expected a PENDING uown_sv_achpayment row").toBeTruthy();
      const rows = await db.query<{ pk: number; status: string; amount: number; ach_process_type: string }>(
        `SELECT pk, status, amount, ach_process_type FROM uown_sv_achpayment
         WHERE account_pk = $1 AND status = 'PENDING'
         ORDER BY pk DESC LIMIT 1`,
        [accountPk],
      );
      const row = rows[0];
      expect(row, "expected a PENDING uown_sv_achpayment row").toBeTruthy();
      expect(row.status).toBe('PENDING');
      expect(Number(row.amount)).toBeCloseTo(Number(PAYMENT_DATA.paymentAmount), 2);
      console.log(`[S2] uown_sv_achpayment pk=${row.pk} status=${row.status} amount=${row.amount} processType=${row.ach_process_type}`);
    });

    // ACH DOES emit a synchronous activity log — but as "ADDED : ACHPayment[...status=PENDING...]"
    // (table uown_sv_activity_log via getActivityLogsByAccount), NOT "ADDED : Payment[paymentType=ACH]"
    // (that DATA_CHANGE note is the CC/post-sweep form). Asserting the ACHPayment note honours
    // rule #13 (no log = nothing happening) with the actual synchronous trail.
    await test.step("Validate activity log: ADDED ACHPayment (status=PENDING, amount=100)", async () => {
      const logs = await db.getActivityLogsByAccount(accountPk, 'ADDED : ACHPayment');
      const achAdded = logs.find((l) => String(l.notes).includes('amount=100'));
      expect(achAdded, 'expected "ADDED : ACHPayment[...amount=100...]" activity log').toBeTruthy();
      console.log(`[S2] activity log: ${String(achAdded!.notes).slice(0, 200)}`);
    });
  });

  test('Scenario 3 — Overpayment is accepted (expected behavior)', async ({ page, testEnv, db }) => {
    // Expected: overpayment is accepted; refund of excess is handled by a separate back-office process
    test.setTimeout(240_000);
    const summaryPage = new ServicingAccountSummaryPage(page);

    let overAmount = PAYMENT_DATA.fallbackOverpayment;
    await test.step('Login, open customer-information, read contract balance', async () => {
      await loginToPortalWithOptions(page, testEnv.servicingUrl, testEnv, 'manager');
      await summaryPage.navigateToCustomerInformation(testEnv.servicingUrl, accountPk);
      // Read the contract/EPO balance from the overview panel and overpay by buffer.
      // If the panel can't be parsed, fall back to a clearly-excessive fixed amount.
      const epo = await summaryPage.readEpoPanel().catch(() => null);
      const balance = epo
        ? (Number.isFinite(epo.contractBalance) && epo.contractBalance > 0
          ? epo.contractBalance
          : epo.epoBalance)
        : NaN;
      if (Number.isFinite(balance) && balance > 0) {
        overAmount = String(Math.round((balance + PAYMENT_DATA.overpaymentBuffer) * 100) / 100);
      }
      console.log(`[S3] contract balance read=${balance} → overpayment amount=${overAmount}`);
    });

    await test.step(`Make CC overpayment of $${overAmount} (expect success)`, async () => {
      // Expected: overpayment is accepted; refund of excess is handled by a separate back-office process
      const card = TEST_CARDS.VISA_APPROVED;
      await summaryPage.makeCcPayment('NA', overAmount, {
        cardNumber: card.number,
        expMonth: card.expMonth,
        expYear: card.expYear,
        csc: card.cvv,
        address: billing.address,
        city: billing.city,
        state: billing.state,
        zip: billing.zip,
        firstName: applicantFirstName,
        lastName: applicantLastName,
      });
      const toast = await summaryPage.captureAndDismissToast(20_000);
      console.log(`[S3] Make CC overpayment toast: "${toast}"`);
      expect(toast.toLowerCase()).not.toContain('error');
    });

    await test.step('Validate DB: uown_sv_payment row created at overpayment amount (paymentType=CC)', async () => {
      const present = await db.waitForRecord(
        'uown_sv_payment',
        "account_pk = $1 AND payment_type = 'CC'",
        [accountPk],
        60_000,
      );
      expect(present, 'expected a CC uown_sv_payment row for the overpayment').toBeTruthy();
      const rows = await db.query<{ pk: number; payment_type: string; payment_amount: number; is_credit_card: boolean }>(
        `SELECT pk, payment_type, payment_amount, is_credit_card FROM uown_sv_payment
         WHERE account_pk = $1 AND payment_type = 'CC'
         ORDER BY pk DESC LIMIT 1`,
        [accountPk],
      );
      const row = rows[0];
      expect(row, 'expected a CC uown_sv_payment row').toBeTruthy();
      expect(row.is_credit_card).toBeTruthy();
      expect(Number(row.payment_amount)).toBeCloseTo(Number(overAmount), 2);
      console.log(`[S3] uown_sv_payment pk=${row.pk} type=${row.payment_type} amount=${row.payment_amount}`);
    });

    await test.step('Validate DB: CC SALE transaction APPROVED', async () => {
      const approved = await db.query<{ pk: number; amount: number; status: string }>(
        `SELECT pk, amount, status FROM uown_sv_credit_card_transaction
         WHERE account_pk = $1 AND cc_action = 'SALE' AND status = 'APPROVED'
         ORDER BY pk DESC LIMIT 1`,
        [accountPk],
      );
      expect(approved.length, 'expected an APPROVED SALE CC transaction for the overpayment').toBeGreaterThan(0);
      console.log(`[S3] APPROVED SALE CC tx pk=${approved[0].pk} amount=${approved[0].amount}`);
    });

    await test.step('Validate activity log: DATA_CHANGE ADDED Payment (paymentType=CC)', async () => {
      const logs = await db.getActivityLogsByAccount(accountPk, 'ADDED : Payment');
      const ccAdded = logs.find((l) => String(l.notes).includes('paymentType=CC'));
      expect(ccAdded, 'expected DATA_CHANGE "ADDED : Payment[...paymentType=CC...]" for the overpayment').toBeTruthy();
      console.log(`[S3] DATA_CHANGE log: ${String(ccAdded!.notes).slice(0, 160)}`);
    });
  });
});

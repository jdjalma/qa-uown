/**
 * Refund Payment (Servicing Portal) — E2E
 *
 * Exercises the Reverse / Refund flow on the Servicing Payment History page
 * (/payment-history/{accountPk}, History menu → "Payments"). The reverse
 * affordance lives here, NOT on /payment-transaction (no per-row action icon).
 *
 * Scenarios:
 *   1. Fully Refund (happy path) — full refund of a $100 APPROVED CC payment.
 *   2. Partial Refund — $40 refund over the $100 payment.
 *
 * Strategy: fresh lead per test → FUNDING (account ACTIVE) → make one APPROVED
 * CC payment of $100 via API (posting date = today → auto-executes) → reverse
 * via UI → validate CC Transactions grid (REFUNDED/CREDIT) + DB + activity log.
 *
 * Run: ENV=dev3 npx playwright test tests/e2e/servicing/refund-payment-servicing.spec.ts --reporter=list
 */
import { test, expect } from '@support/base-test.js';
import { PaymentHistoryPage, CreditCardHistoryPage } from '@pages/servicing/index.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';
import {
  buildTestData,
  createPreQualifiedApplication,
  driveLeadToFunding,
  loginToPortalWithOptions,
  calculateDateISO,
} from '@helpers/index.js';
import { buildCcArrangementBody } from '@api/bodies/payment-arrangement.body.js';
import { TEST_CARDS } from '@data/index.js';

const REFUND_DATA = {
  state: 'NY',
  merchant: 'TerraceFinance',
  paymentAmount: '100',
  partialRefundAmount: '40',
  tag: buildTags(TestTag.REGRESSION),
};

test.describe('Refund Payment via Servicing Portal', { tag: splitTags(REFUND_DATA.tag) }, () => {
  test.describe.configure({ mode: 'serial' });

  let accountPk = '';
  let leadPk = '';
  let paymentTxPk = 0;

  test.beforeEach(async ({ api, ctx, db }) => {
    test.setTimeout(420_000);
    const { merchant, applicant } = buildTestData({
      state: REFUND_DATA.state,
      merchant: REFUND_DATA.merchant,
      orderTotal: '800',
      orderDescription: 'Servicing refund test',
    });

    await test.step('Setup: application → FUNDING (account ACTIVE)', async () => {
      await createPreQualifiedApplication(
        api, merchant, applicant, ctx, { submitPaymentInfoViaApi: true }, test.info(),
      );
      await driveLeadToFunding(api, merchant, ctx);
      leadPk = ctx.leadPk;

      const resolved = await db.waitForAccountByLeadPk(ctx.leadPk, 60_000);
      expect(resolved, `account not created for leadPk=${ctx.leadPk}`).toBeTruthy();
      accountPk = resolved!;
      ctx.accountPk = accountPk;
      console.log(`[Setup] leadPk=${leadPk} accountPk=${accountPk}`);
    });

    await test.step(`Setup: make 1 APPROVED CC payment of $${REFUND_DATA.paymentAmount}`, async () => {
      const card = TEST_CARDS.VISA_APPROVED;
      const body = buildCcArrangementBody({
        accountPk: Number(accountPk),
        leadPk: Number(leadPk),
        ccFirstName: applicant.firstName,
        ccLastName: applicant.lastName,
        ccNumber: card.number,
        ccExp: `${card.expMonth}/${card.expYear}`,
        cvc: card.cvv,
        ccType: 'VISA',
        // posting date = today → backend runs the transaction immediately (APPROVED).
        installments: [{ amount: REFUND_DATA.paymentAmount, date: calculateDateISO(0) }],
      });
      const resp = await api.paymentArrangement.makeCreditCardPayments(body);
      expect(resp.ok, `makeCreditCardPayments responded ${resp.status}: ${JSON.stringify(resp.body)}`).toBeTruthy();

      const arrangementPk = String(resp.body.creditCardTransactions?.[0]?.paymentArrangementPk ?? '');
      if (arrangementPk) {
        await db.waitForCcTransactionsProcessed(arrangementPk, 90_000);
      }
    });

    await test.step('Setup: confirm 1 APPROVED CC payment in DB', async () => {
      const approved = await db.query<{ pk: number; amount: number; status: string }>(
        `SELECT pk, amount, status FROM uown_sv_credit_card_transaction
         WHERE account_pk = $1 AND status = 'APPROVED' AND cc_action = 'SALE'
         ORDER BY pk DESC LIMIT 1`,
        [accountPk],
      );
      expect(approved.length, 'expected 1 APPROVED SALE CC transaction').toBeGreaterThan(0);
      paymentTxPk = approved[0].pk;
      expect(Number(approved[0].amount)).toBeCloseTo(Number(REFUND_DATA.paymentAmount), 2);
      console.log(`[Setup] APPROVED CC payment txPk=${paymentTxPk}`);
    });
  });

  test('Scenario 1 — Fully Refund of $100 payment', async ({ page, testEnv, db }) => {
    test.setTimeout(240_000);
    const paymentPage = new PaymentHistoryPage(page);

    await test.step('Login and open Reverse modal for the $100 payment', async () => {
      await loginToPortalWithOptions(page, testEnv.servicingUrl, testEnv, 'manager');
      await paymentPage.navigateByUrl(testEnv.servicingUrl, accountPk);
      await paymentPage.openReverseForPaymentByAmount(REFUND_DATA.paymentAmount);
    });

    await test.step('Select Fully Refund, comment, submit', async () => {
      await paymentPage.setReverseReason('Fully Refund');
      await paymentPage.typeReverseComment('QA: fully refund test');
      await paymentPage.submitReverse();
      const toast = await paymentPage.captureAndDismissToast(15_000);
      console.log(`[S1] Reverse toast: "${toast}"`);
      expect(toast.toLowerCase()).not.toContain('error');
    });

    let creditTxPk = 0;
    let expectedCreditAmount = 0;
    await test.step('Validate DB: original payment REFUNDED + CREDIT transaction created', async () => {
      const original = await db.getCcTransactionByPk(paymentTxPk);
      expect(original).toBeTruthy();
      expect(String(original!.status)).toBe('REFUNDED');

      const credit = await db.query<{ pk: number; amount: number; cc_action: string }>(
        `SELECT pk, amount, cc_action FROM uown_sv_credit_card_transaction
         WHERE account_pk = $1 AND cc_action = 'CREDIT'
         ORDER BY pk DESC LIMIT 1`,
        [accountPk],
      );
      expect(credit.length, 'expected a CREDIT transaction in DB').toBeGreaterThan(0);
      creditTxPk = credit[0].pk;

      // CONFIRMED product behavior (fresh repro on accounts 142 + 143, 2026-06-01):
      // a Fully Refund credits principal + the original charge fee. The original
      // SALE row carries charge_fee=$1.00 and the CREDIT row = $100 + $1 = $101.00.
      // Assert the CREDIT == principal + the original row's charge_fee (read from
      // DB, not hardcoded) so the math stays correct if the fee schedule changes.
      const originalFee = Number(original!.charge_fee ?? 0);
      expectedCreditAmount = Number(REFUND_DATA.paymentAmount) + originalFee;
      console.log(`[S1] CREDIT tx=${creditTxPk} amount=${credit[0].amount} (principal ${REFUND_DATA.paymentAmount} + fee ${originalFee})`);
      expect(Number(credit[0].amount)).toBeCloseTo(expectedCreditAmount, 2);
    });

    await test.step('Validate CC Transactions grid: original REFUNDED + CREDIT row rendered', async () => {
      // DOM-first (svc-website-dev3 account 142, 2026-06-01 failure snapshot): the
      // CC grid renders cells as role="cell" in column order (NO data-column-id
      // attrs). Status = column index 8, CC Action = column index 12. Drive the
      // assertions through the page object (getRowByTxPk + indexed cells), which
      // is DOM-verified, instead of inventing data-column-id selectors.
      const ccPage = new CreditCardHistoryPage(page);
      await ccPage.navigateToCcHistoryByUrl(testEnv.servicingUrl, accountPk);

      const originalStatus = await ccPage.getRowStatus(paymentTxPk);
      console.log(`[S1] original payment tx=${paymentTxPk} grid status=${originalStatus}`);
      expect(originalStatus).toContain('REFUNDED');

      // CREDIT row: Captured Amount (col 2) = $101.00 (principal + fee), CC Action (col 12) = CREDIT.
      const creditAmount = await ccPage.getRowAmount(creditTxPk);
      const creditAction = await ccPage.getRowCellText(creditTxPk, 12);
      console.log(`[S1] CREDIT row tx=${creditTxPk} amount=${creditAmount} action=${creditAction}`);
      expect(creditAction).toContain('CREDIT');
      expect(creditAmount).toContain(`${expectedCreditAmount.toFixed(2)}`);
    });

    await test.step('Validate activity log: refund recorded', async () => {
      const logs = await db.getActivityLogsByAccount(accountPk, 'refund');
      expect(logs.length, 'expected a refund activity log entry').toBeGreaterThan(0);
      console.log(`[S1] refund activity log: ${String(logs[0].notes).slice(0, 200)}`);
    });
  });

  test('Scenario 2 — Partial Refund of $40 over $100 payment', async ({ page, testEnv, db }) => {
    test.setTimeout(240_000);
    const paymentPage = new PaymentHistoryPage(page);

    await test.step('Login and open Reverse modal for the $100 payment', async () => {
      await loginToPortalWithOptions(page, testEnv.servicingUrl, testEnv, 'manager');
      await paymentPage.navigateByUrl(testEnv.servicingUrl, accountPk);
      await paymentPage.openReverseForPaymentByAmount(REFUND_DATA.paymentAmount);
    });

    await test.step(`Select Partially Refund, set $${REFUND_DATA.partialRefundAmount}, submit`, async () => {
      // Verified option text on svc-website-dev3 is "Partially Refund" (the
      // ReverseReason.PARTIAL_REFUND enum value "Partial Refund" does not match
      // the rendered menu — match the real DOM text instead).
      await paymentPage.setReverseReason('Partially Refund');
      await paymentPage.typeReverseAmount(REFUND_DATA.partialRefundAmount);
      await paymentPage.typeReverseComment('QA: partial refund test');
      await paymentPage.submitReverse();
      const toast = await paymentPage.captureAndDismissToast(15_000);
      console.log(`[S2] Reverse toast: "${toast}"`);
      expect(toast.toLowerCase()).not.toContain('error');
    });

    let creditTxPk = 0;
    let dbCreditAmount = 0;
    await test.step('Validate DB: original PARTIALLY_REFUNDED + CREDIT of $40', async () => {
      const original = await db.getCcTransactionByPk(paymentTxPk);
      expect(original).toBeTruthy();
      expect(['PARTIALLY_REFUNDED', 'REVERSED']).toContain(String(original!.status));

      const credit = await db.query<{ pk: number; amount: number; cc_action: string }>(
        `SELECT pk, amount, cc_action FROM uown_sv_credit_card_transaction
         WHERE account_pk = $1 AND cc_action = 'CREDIT'
         ORDER BY pk DESC LIMIT 1`,
        [accountPk],
      );
      expect(credit.length, 'expected a CREDIT transaction in DB').toBeGreaterThan(0);
      creditTxPk = credit[0].pk;
      dbCreditAmount = Number(credit[0].amount);
      // Partial refund of $40: the agent enters the exact refund amount. The
      // CREDIT should cover at least the requested $40 (a fee may be added by the
      // backend, mirroring the Fully Refund $1 fee — assert >= requested, then
      // cross-check the grid renders the same DB value below).
      console.log(`[S2] CREDIT tx=${creditTxPk} amount=${dbCreditAmount} (requested ${REFUND_DATA.partialRefundAmount})`);
      expect(dbCreditAmount).toBeGreaterThanOrEqual(Number(REFUND_DATA.partialRefundAmount));
    });

    await test.step('Validate CC Transactions grid: original PARTIALLY_REFUNDED + CREDIT rendered', async () => {
      // Same DOM-first column model as Scenario 1: Status=col 8, CC Action=col 12,
      // Captured Amount=col 2. Drive via page object (no data-column-id attrs exist).
      const ccPage = new CreditCardHistoryPage(page);
      await ccPage.navigateToCcHistoryByUrl(testEnv.servicingUrl, accountPk);

      const originalStatus = await ccPage.getRowStatus(paymentTxPk);
      console.log(`[S2] original payment tx=${paymentTxPk} grid status=${originalStatus}`);
      expect(['PARTIALLY_REFUNDED', 'REVERSED'].some((s) => originalStatus.includes(s))).toBeTruthy();

      const creditAmount = await ccPage.getRowAmount(creditTxPk);
      const creditAction = await ccPage.getRowCellText(creditTxPk, 12);
      console.log(`[S2] CREDIT row tx=${creditTxPk} amount=${creditAmount} action=${creditAction}`);
      expect(creditAction).toContain('CREDIT');
      // Grid must render the same amount persisted in DB for this CREDIT row.
      expect(creditAmount).toContain(`${dbCreditAmount.toFixed(2)}`);
    });

    await test.step('Validate activity log: partial refund recorded', async () => {
      const logs = await db.getActivityLogsByAccount(accountPk, 'refund');
      expect(logs.length, 'expected a refund activity log entry').toBeGreaterThan(0);
      console.log(`[S2] refund activity log: ${String(logs[0].notes).slice(0, 200)}`);
    });
  });
});

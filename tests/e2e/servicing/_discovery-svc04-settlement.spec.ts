/**
 * SVC-04 DISCOVERY (Sessão 7, dev3) — organic SINGLE today-dated CC SETTLEMENT.
 *
 * Closes the gaps S6 (payment-arrangement-servicing.spec.ts) left open:
 *   - S6 used a MULTI-installment SETTLEMENT (today→+28) → future SALEs stay PENDING in dev3
 *     → reached SUCCESS only via the authorized synthetic stand-in → the "Arrangement finalized
 *     as SUCCESS" listener log was @blocked-by-missing-log.
 *   - Here: start=end=TODAY → a single synchronous CC SALE → ORGANIC SUCCESS (no stand-in),
 *     so the listener fires for real. Then we CAPTURE (soft, rule #10) the gap oracles the
 *     charter asks for and no settlement spec has asserted yet:
 *       rating → S (Sold)? · settled_in_full_date_time set? · autopay OFF? · finalized log organic?
 *
 * UI-first (rule #15): the settlement is executed through the Make Payment modal in the browser
 * via the proven page object — NOT via API. DB is the oracle layer (rule #18).
 * Hard asserts only on known invariants (SETTLED_IN_FULL, CC SALE APPROVED, organic SUCCESS).
 * Gap oracles are logged for conservative classification, not asserted.
 */
import { test, expect } from '@support/base-test.js';
import { ServicingAccountSummaryPage } from '@pages/servicing/index.js';
import {
  buildTestData,
  createPreQualifiedApplication,
  driveLeadToFunding,
  loginToPortalWithOptions,
} from '@helpers/index.js';
import { calculateDate } from '@helpers/date.helpers.js';

const ACCT_COLS =
  'account_status, rating, cc_auto_pay, ach_auto_pay, auto_pay_types, settled_in_full_date_time';

test.describe('SVC-04 discovery — organic settlement oracles', () => {
  test.describe.configure({ mode: 'serial' });

  test('Fresh account + organic single-day CC SETTLEMENT → capture gap oracles', async ({ api, ctx, db, page, testEnv }) => {
    test.setTimeout(600_000);
    let accountPk = '';

    const { merchant, applicant } = buildTestData({
      state: 'NY',
      merchant: 'TerraceFinance',
      orderTotal: '800',
      orderDescription: 'SVC-04 discovery settlement',
    });

    await test.step('Setup: application → FUNDING (account ACTIVE)', async () => {
      await createPreQualifiedApplication(
        api, merchant, applicant, ctx, { submitPaymentInfoViaApi: true }, test.info(),
      );
      await driveLeadToFunding(api, merchant, ctx);
      const resolved = await db.waitForAccountByLeadPk(ctx.leadPk, 60_000);
      expect(resolved, `account not created for leadPk=${ctx.leadPk}`).toBeTruthy();
      accountPk = resolved!;
      console.log(`[SVC04] leadPk=${ctx.leadPk} accountPk=${accountPk}`);
    });

    await test.step('Capture PRE-settlement state', async () => {
      const pre = await db.query(`SELECT ${ACCT_COLS} FROM uown_sv_account WHERE pk = $1`, [accountPk]);
      console.log(`[SVC04][PRE] ${JSON.stringify(pre[0])}`);
    });

    let arrangementPk = '';
    await test.step('Create SINGLE today-dated CC SETTLEMENT via UI (organic path)', async () => {
      const today = calculateDate(0);
      await loginToPortalWithOptions(page, testEnv.servicingUrl, testEnv, 'manager');
      const summaryPage = new ServicingAccountSummaryPage(page);
      await summaryPage.navigateToCustomerInformation(testEnv.servicingUrl, accountPk);
      await summaryPage.makeCcPaymentArrangement({
        startDate: today,
        endDate: today,
        frequency: 'Weekly',
        paymentType: 'Credit Card Payment',
        arrangementType: 'SETTLEMENT',
      });
      const toast = await summaryPage.captureAndDismissToast(20_000);
      console.log(`[SVC04] settlement toast: "${toast}"`);
      expect(toast.toLowerCase()).not.toContain('error');
    });

    await test.step('Validate arrangement SETTLEMENT + ORGANIC SUCCESS (no synthetic stand-in)', async () => {
      const present = await db.waitForRecord(
        'uown_sv_payment_arrangement', "account_pk = $1 AND payment_type = 'CC'", [accountPk], 60_000,
      );
      expect(present, 'expected a CC payment arrangement row').toBeTruthy();
      const arr = await db.getPaymentArrangement(accountPk);
      expect(String(arr!.arrangement_type)).toBe('SETTLEMENT');
      arrangementPk = String(arr!.pk);
      const reached = await db.waitForPaymentArrangementStatus(accountPk, 'SUCCESS', 60_000);
      console.log(`[SVC04] arrangementPk=${arrangementPk} organicSUCCESS=${reached} status=${String(arr!.status)}`);
      expect(reached, 'organic single-day SETTLEMENT should reach SUCCESS without synthetic fallback').toBeTruthy();
    });

    await test.step('Validate CC SALE APPROVED (P0 invariant: no SETTLED without money movement)', async () => {
      const txns = await db.getCcTransactionsByArrangement(arrangementPk);
      const sales = txns.filter(t => String(t.cc_action) === 'SALE');
      console.log(`[SVC04] SALE txns: ${JSON.stringify(sales.map(t => ({ pk: t.pk, status: t.status, amount: t.amount })))}`);
      expect(sales.length, 'expected >=1 linked CC SALE').toBeGreaterThan(0);
      sales.forEach(t => expect(String(t.status), `CC SALE pk=${t.pk} should be APPROVED`).toBe('APPROVED'));
    });

    await test.step('Validate account → SETTLED_IN_FULL', async () => {
      const reached = await db.waitForAccountStatus(accountPk, 'SETTLED_IN_FULL', 60_000);
      expect(reached, 'account should transition to SETTLED_IN_FULL').toBeTruthy();
    });

    await test.step('CAPTURE GAP ORACLES (soft — rule #10 conservative)', async () => {
      const post = await db.query(`SELECT ${ACCT_COLS} FROM uown_sv_account WHERE pk = $1`, [accountPk]);
      const row = post[0] as Record<string, unknown>;
      console.log(`[SVC04][POST] ${JSON.stringify(row)}`);

      const finalized = await db.getActivityLogsByAccount(accountPk, 'Arrangement finalized as SUCCESS');
      const settledLog = await db.getActivityLogsByAccount(accountPk, 'SETTLED_IN_FULL');
      const ratingLogs = await db.getRatingChangeLogs(accountPk);
      console.log(`[SVC04][LOGS] finalizedOrganic=${finalized.length} statusChangeToSettled=${settledLog.length} ratingChanges=${ratingLogs.length}`);
      if (finalized[0]) console.log(`[SVC04][LOG finalized] ${String(finalized[0].notes).slice(0, 180)}`);
      if (settledLog[0]) console.log(`[SVC04][LOG settled] ${String(settledLog[0].notes).slice(0, 220)}`);

      console.log(
        `[SVC04][GAP] rating=${String(row.rating)} (charter expects S/Sold?) | ` +
        `settled_in_full_date_time=${String(row.settled_in_full_date_time)} (set organically?) | ` +
        `autopay cc=${String(row.cc_auto_pay)} ach=${String(row.ach_auto_pay)} types=${String(row.auto_pay_types)} (OFF after settle?)`,
      );
      console.log(`[SVC04][DONE] leadPk=${ctx.leadPk} accountPk=${accountPk} arrangementPk=${arrangementPk}`);
    });
  });
});

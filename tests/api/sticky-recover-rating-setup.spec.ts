/**
 * SETUP spec for svc#485 (Sticky Recover QA) — organic flow.
 *
 * For each rating in RATINGS, create a real sandbox account where the first
 * payment naturally results in a DENIED CC transaction at the ChannelPayments
 * gateway, then make it eligible for StickyRecoverSweep on the next run.
 *
 * Why organic flow (and not synthetic UPDATEs on the cct):
 *   - SendCreditCardPaymentsSweep submits the SCHEDULED cct to the gateway
 *     and writes `gateway_transaction_id`, `comment`, `error`, `error_code`
 *     and `gateway_response` as the gateway responds. Synthetic UPDATEs miss
 *     these and trip the submission service (`gatewayTransactionId is required`)
 *     and the sweep SQL (`comment IS NULL` is silently excluded by ANSI SQL
 *     `NOT LIKE` — see report finding "Improvement #3").
 *   - Authorized UPDATEs are limited to:
 *       a) data the sweep needs aligned to "today" (receivable.due_date,
 *          sched_summary.first_payment_due_date, delinquency_as_of_date) —
 *          the natural lifecycle would take 30+ days;
 *       b) `auto_pay_types='CC'` (default is 'ACH,CC' post-funding which the
 *          CC payments sweep excludes);
 *       c) `posting_date = CURRENT_DATE - 7 days` AFTER the gateway responded
 *          DENIED — only field that cannot be obtained without waiting a week;
 *       d) `account.rating = '<M|F|B>'` — ratings M/F/B don't appear naturally
 *          in sandbox; this is the target variable of the test.
 *
 * Test card: TEST_CARDS.DECLINE_G ("Decline 51 — Insufficient funds",
 *   number=4000300611112224). Picked because the gateway message ("Insufficient
 *   funds") is NOT in the sweep's error-exclusion list, so the resulting DENIED
 *   cct is eligible for Sticky recovery.
 *
 * Authorization context (2026-05-20):
 *   - sandbox merchant credentials: hardcoded in src/data/merchants.ts
 *     (terraceFinance / U0wn_terraceFinance_xJ9z4p). The `manager` user in
 *     SANDBOX_MERCHANT_USERNAME is for the UI admin, not /uown/los/sendApplication.
 *   - UPDATEs on auto_pay_types, receivable.due_date, sched_summary,
 *     cct.posting_date, account.rating: pre-approved by user.
 *
 * Run:
 *   ENV=sandbox npx playwright test tests/api/sticky-recover-rating-setup.spec.ts \
 *     --workers=1 --project=api-only --reporter=list
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { buildTestData } from '@helpers/test-data.helpers.js';
import { sleep } from '@helpers/index.js';
import { TEST_CARDS } from '@data/index.js';

const RATINGS = ['M', 'F', 'B'] as const;
const SETUP_TAG = '@sticky-recover-setup @sandbox';
const DECLINE_GARD = TEST_CARDS.DECLINE_G; // "Do not Honor" — not in sweep's error exclusion list

for (const rating of RATINGS) {
  test(`sticky-recover setup: rating=${rating} ${SETUP_TAG}`, async ({ api, db, ctx }, testInfo) => {
    test.setTimeout(360_000);

    const td = buildTestData({
      state: 'CA',
      merchant: 'TerraceFinance',
      orderTotal: '1000',
      orderDescription: `StickyRecover-rating${rating}`,
    });

    await test.step('1. sendApplication (pre-qualification)', async () => {
      const resp = await api.application.sendApplication(td.merchant, td.applicant);
      expect(resp.ok, `sendApplication ${resp.status}: ${JSON.stringify(resp.body).slice(0, 200)}`).toBeTruthy();
      ctx.leadUuid = resp.body.accountNumber ?? String(resp.body.authorizationNumber ?? '');
      ctx.leadPk = String(resp.body.authorizationNumber ?? '');
      expect(ctx.leadUuid).toBeTruthy();
      console.log(`[1] leadPk=${ctx.leadPk} leadUuid=${ctx.leadUuid}`);
    });

    let approvedAmount = 0;
    await test.step('2. wait approval + getApplicationStatus', async () => {
      await sleep(5_000);
      const resp = await api.application.getApplicationStatus(td.merchant, ctx.leadUuid);
      expect(resp.ok).toBeTruthy();
      const status = (resp.body.appApprovalStatus ?? resp.body.uwStatus ?? resp.body.status ?? '') as string;
      expect(status.toLowerCase(), `expected approved, got ${status}`).toContain('approved');
      if (resp.body.leadPk) ctx.leadPk = String(resp.body.leadPk);
      approvedAmount = resp.body.approvedAmount ?? 0;
      expect(approvedAmount).toBeGreaterThan(0);
      console.log(`[2] approvedAmount=${approvedAmount}`);
    });

    let shortCode = '';
    let planId = '';
    await test.step('3. sendInvoice + extract shortCode/planId', async () => {
      const resp = await api.invoice.sendInvoice(td.merchant, ctx.leadUuid, { orderTotal: String(approvedAmount) });
      expect(resp.ok).toBeTruthy();
      const redirect = resp.body?.paymentDetailsList?.[0]?.redirectUrl ?? '';
      expect(redirect, 'missing redirectUrl in invoice response').toBeTruthy();
      const u = new URL(redirect);
      shortCode = u.pathname.split('/').filter(Boolean)[0] ?? '';
      planId = u.searchParams.get('planId') ?? '';
      expect(shortCode).toBeTruthy();
    });

    await test.step('4. getMissingFields (required before submitApplication)', async () => {
      const resp = await api.application.getMissingFields(shortCode, planId ? { planId } : undefined);
      expect(resp.ok, `getMissingFields ${resp.status}`).toBeTruthy();
    });

    await test.step(`5. submitApplication with DECLINE_G card (${DECLINE_GARD.name})`, async () => {
      const resp = await api.application.submitApplication(
        Number(ctx.leadPk), td.applicant.firstName, td.applicant.lastName,
        { ccNumber: DECLINE_GARD.number, cvc: DECLINE_GARD.cvv, ccExp: DECLINE_GARD.expirationDate },
      );
      expect(resp.ok, `submitApplication ${resp.status}: ${JSON.stringify(resp.body).slice(0, 200)}`).toBeTruthy();
    });

    await test.step('6. drive to FUNDING (SIGNED → settle → updateFundingStatus)', async () => {
      const s1 = await api.lead.changeLeadStatus(td.merchant, Number(ctx.leadPk), 'SIGNED', 'StickyRecover setup');
      expect(s1.ok, `SIGNED ${s1.status}`).toBeTruthy();
      const s2 = await api.settlement.settleApplication(td.merchant, ctx.leadUuid);
      expect(s2.ok, `settle ${s2.status}`).toBeTruthy();
      await sleep(3_000);
      const s3 = await api.lead.updateFundingStatus([Number(ctx.leadPk)], 'FUNDING');
      expect(s3.ok, `FUNDING ${s3.status}`).toBeTruthy();
    });

    let accountPk = '';
    await test.step('7. wait uown_sv_account row (FUNDING → account active)', async () => {
      const result = await db.waitForAccountByLeadPk(ctx.leadPk, 120_000);
      expect(result, `account not created for leadPk=${ctx.leadPk}`).toBeTruthy();
      accountPk = result!;
      ctx.accountPk = accountPk;
      console.log(`[7] accountPk=${accountPk}`);
    });

    await test.step('8. UPDATE auto_pay_types = CC (remove ACH so CC payments sweep eligibility)', async () => {
      const affected = await db.executeUpdate(
        `UPDATE uown_sv_account SET auto_pay_types = 'CC' WHERE pk = $1`, [accountPk],
      );
      expect(affected).toBe(1);
    });

    await test.step('9. UPDATE first ACTIVE receivable.due_date = today+2 (sweep filter exact)', async () => {
      const rows = await db.query<{ pk: string }>(
        `SELECT pk FROM uown_sv_receivable
          WHERE account_pk = $1 AND status = 'ACTIVE' AND receivable_type = 'REGULAR_PAYMENT'
          ORDER BY due_date ASC LIMIT 1`,
        [accountPk],
      );
      expect(rows.length, 'no ACTIVE regular receivable').toBe(1);
      const affected = await db.executeUpdate(
        `UPDATE uown_sv_receivable SET due_date = CURRENT_DATE + INTERVAL '2 days' WHERE pk = $1`,
        [rows[0].pk],
      );
      expect(affected).toBe(1);
    });

    await test.step('10. UPDATE sched_summary first_payment_due_date + delinquency_as_of_date = today', async () => {
      const affected = await db.executeUpdate(
        `UPDATE uown_sv_sched_summary
            SET first_payment_due_date = CURRENT_DATE,
                delinquency_as_of_date = CURRENT_DATE
          WHERE account_pk = $1`,
        [accountPk],
      );
      expect(affected).toBe(1);
    });

    let cctPk = 0;
    await test.step('11. trigger CreateScheduledCreditCardPaymentsSweep + wait SCHEDULED cct (status PENDING)', async () => {
      const trig = await api.scheduledTask.triggerScheduledTask('CreateScheduledCreditCardPaymentsSweep');
      expect(trig.ok, `trigger CreateScheduled ${trig.status}`).toBeTruthy();

      const start = Date.now();
      let found: { pk: string } | null = null;
      while (Date.now() - start < 120_000) {
        const rows = await db.query<{ pk: string }>(
          `SELECT pk FROM uown_sv_credit_card_transaction
            WHERE account_pk = $1 AND cc_transaction_type = 'SCHEDULED' AND cc_action = 'SALE'
            ORDER BY pk DESC LIMIT 1`, [accountPk],
        );
        if (rows.length > 0) { found = rows[0]; break; }
        await sleep(4_000);
      }
      expect(found, `no SCHEDULED SALE cct for accountPk=${accountPk}`).toBeTruthy();
      cctPk = Number(found!.pk);
      console.log(`[11] cctPk=${cctPk} (PENDING)`);
    });

    await test.step('11b. shift posting_date to today for SendCreditCardPaymentsSweep eligibility', async () => {
      const affected = await db.executeUpdate(
        `UPDATE uown_sv_credit_card_transaction SET posting_date = CURRENT_DATE WHERE pk = $1`,
        [cctPk],
      );
      expect(affected).toBe(1);
    });

    await test.step('12. trigger SendCreditCardPaymentsSweep + wait gateway to respond DENIED', async () => {
      const trig = await api.scheduledTask.triggerScheduledTask('SendCreditCardPaymentsSweep');
      expect(trig.ok, `trigger SendCreditCard ${trig.status}`).toBeTruthy();

      const start = Date.now();
      interface CctRow { status: string; gateway_transaction_id: string | null; comment: string | null; error: string | null; cc_vendor: string | null }
      let finalRow: CctRow | null = null;
      while (Date.now() - start < 120_000) {
        const rows = await db.query<CctRow>(
          `SELECT status, gateway_transaction_id, comment, error, cc_vendor
             FROM uown_sv_credit_card_transaction WHERE pk = $1`, [cctPk],
        );
        if (rows.length > 0 && rows[0].status !== 'PENDING' && rows[0].status !== 'PICKED_TO_SEND') {
          finalRow = rows[0];
          break;
        }
        await sleep(4_000);
      }
      expect(finalRow, `cct ${cctPk} never left PENDING`).toBeTruthy();
      expect(finalRow!.status, `expected DENIED for ${DECLINE_GARD.name}, got ${finalRow!.status}`).toBe('DENIED');
      expect(finalRow!.gateway_transaction_id, 'gateway must populate gateway_transaction_id').toBeTruthy();
      console.log(`[12] cct ${cctPk}: status=${finalRow!.status} gateway_txn=${finalRow!.gateway_transaction_id} error='${finalRow!.error}' vendor=${finalRow!.cc_vendor}`);
    });

    await test.step('13. UPDATE cct.posting_date = today-7 (only value that needs time-shift for sweep)', async () => {
      const affected = await db.executeUpdate(
        `UPDATE uown_sv_credit_card_transaction
            SET posting_date = CURRENT_DATE - INTERVAL '7 days'
          WHERE pk = $1`, [cctPk],
      );
      expect(affected).toBe(1);
    });

    await test.step(`14. UPDATE uown_sv_account.rating = '${rating}'`, async () => {
      const affected = await db.executeUpdate(
        `UPDATE uown_sv_account SET rating = $1 WHERE pk = $2`, [rating, accountPk],
      );
      expect(affected).toBe(1);
    });

    await test.step('15. verify cct is otherwise-eligible for StickyRecoverSweep (rating filter excluded)', async () => {
      const rows = await db.query<{ pk: string; rating: string; error: string; gtxn: string }>(
        `SELECT cct.pk, a.rating, cct.error, cct.gateway_transaction_id AS gtxn
           FROM uown_sv_credit_card_transaction cct
           JOIN uown_sv_account a ON a.pk = cct.account_pk
           JOIN uown_sv_sched_summary s ON a.pk = s.account_pk
           JOIN uown_sv_credit_card cc ON cc.auto_pay = true AND cc.account_pk = a.pk
          WHERE cct.pk = $1
            AND cct.status = 'DENIED'
            AND cct.cc_vendor = 'CHANNEL_PAYMENTS_CC'
            AND cct.posting_date = CURRENT_DATE - INTERVAL '7 days'
            AND cct.cc_transaction_type = 'SCHEDULED'
            AND cct.cc_action = 'SALE'
            AND cct.agent_username NOT IN ('SpecialProcess#5014')
            AND a.account_status = 'ACTIVE'
            AND s.delinquency_as_of_date <= CURRENT_DATE
            AND (cct.error IS NULL OR cct.error NOT IN (
              'Card is expired','Card number error','Closed account',
              'Hold card (stolen)','Hold card (pick up card)','Hold card (lost)',
              'Withdrawal limit exceeded','PIN tries exceeded'))
            AND (cct.comment IS NULL OR cct.comment NOT LIKE 'Idempotent transaction was run. %')
            AND NOT EXISTS (
              SELECT 1 FROM uown_sticky st
                WHERE st.cc_transaction_pk = cct.pk AND st.sticky_transaction_id IS NOT NULL
            )`,
        [cctPk],
      );
      expect(rows.length, 'cct should be otherwise-eligible (rating clause omitted)').toBe(1);
      expect(rows[0].rating).toBe(rating);
      expect(rows[0].gtxn, 'gateway_transaction_id must be populated by gateway').toBeTruthy();
    });

    testInfo.annotations.push(
      { type: 'rating', description: rating },
      { type: 'leadPk', description: ctx.leadPk },
      { type: 'accountPk', description: accountPk },
      { type: 'cctPk', description: String(cctPk) },
      { type: 'decline_card', description: DECLINE_GARD.name },
    );

    console.log(`[DONE] rating=${rating} lead=${ctx.leadPk} account=${accountPk} cct=${cctPk}`);
  });
}

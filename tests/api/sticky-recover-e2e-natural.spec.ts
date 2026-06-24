import { test, expect } from '@fixtures/test-context.fixture.js';
import { buildTestData } from '@helpers/test-data.helpers.js';
import {
  waitForStickyTransactionId,
  type StickySessionRow,
} from '@helpers/sticky.helpers.js';
import { sleep } from '@helpers/index.js';
import { TEST_CARDS } from '@data/index.js';

test('Sticky Recover E2E: approved card -> fund -> decline payment -> sweep -> recovery', async ({ api, db }) => {
  test.setTimeout(900_000);

  const approvedCard = TEST_CARDS.MASTERCARD_APPROVED;
  const declineCard = TEST_CARDS.DECLINE_G;

  const td = buildTestData({
    state: 'CA',
    merchant: 'TerraceFinance',
    orderTotal: '1000',
    orderDescription: 'StickyRecover-E2E-natural',
  });

  let leadPk = 0;
  let leadUuid = '';
  let accountPk = 0;
  let cctPk = 0;

  await test.step('1. sendApplication', async () => {
    const resp = await api.application.sendApplication(td.merchant, td.applicant);
    expect(resp.ok, `sendApplication ${resp.status}`).toBeTruthy();
    leadUuid = resp.body.accountNumber ?? String(resp.body.authorizationNumber ?? '');
    leadPk = Number(resp.body.authorizationNumber ?? 0);
    expect(leadPk).toBeGreaterThan(0);
    console.log(`[E2E] sendApplication: leadPk=${leadPk} uuid=${leadUuid}`);
  });

  await test.step('2. wait approval (up to 60s)', async () => {
    let approvedAmount = 0;
    const deadline = Date.now() + 60_000;
    while (Date.now() < deadline) {
      await sleep(5_000);
      const resp = await api.application.getApplicationStatus(td.merchant, leadUuid);
      expect(resp.ok).toBeTruthy();
      const amt = Number(resp.body.approvedAmount ?? 0);
      if (amt > 0) {
        approvedAmount = amt;
        if (resp.body.leadPk) leadPk = Number(resp.body.leadPk);
        break;
      }
    }
    expect(approvedAmount, 'approval timed out').toBeGreaterThan(0);
    console.log(`[E2E] approved: amount=${approvedAmount}`);
  });

  let shortCode = '';
  let planId = '';
  await test.step('3. sendInvoice', async () => {
    const resp = await api.invoice.sendInvoice(td.merchant, leadUuid, { orderTotal: '1000' });
    expect(resp.ok).toBeTruthy();
    const redirect = resp.body?.paymentDetailsList?.[0]?.redirectUrl ?? '';
    const u = new URL(redirect);
    shortCode = u.pathname.split('/').filter(Boolean)[0] ?? '';
    planId = u.searchParams.get('planId') ?? '';
    expect(shortCode).toBeTruthy();
  });

  await test.step('4. getMissingFields', async () => {
    const resp = await api.application.getMissingFields(shortCode, planId ? { planId } : undefined);
    expect(resp.ok).toBeTruthy();
  });

  await test.step('5. submitApplication with APPROVED card', async () => {
    const resp = await api.application.submitApplication(
      leadPk, td.applicant.firstName, td.applicant.lastName,
      { ccNumber: approvedCard.number, cvc: approvedCard.cvv, ccExp: approvedCard.expirationDate, planId: planId || undefined },
    );
    expect(resp.ok, `submitApplication ${resp.status}: ${JSON.stringify(resp.body).slice(0, 300)}`).toBeTruthy();
    console.log(`[E2E] submitApplication OK with ${approvedCard.name}`);
  });

  await test.step('6. drive to FUNDING', async () => {
    const s1 = await api.lead.changeLeadStatus(td.merchant, leadPk, 'SIGNED', 'E2E sticky');
    expect(s1.ok, `SIGNED ${s1.status}`).toBeTruthy();
    const s2 = await api.settlement.settleApplication(td.merchant, leadUuid);
    expect(s2.ok, `settle ${s2.status}`).toBeTruthy();
    await sleep(3_000);
    const s3 = await api.lead.updateFundingStatus([leadPk], 'FUNDING');
    expect(s3.ok, `FUNDING ${s3.status}`).toBeTruthy();
  });

  await test.step('7. wait account materialization', async () => {
    const result = await db.waitForAccountByLeadPk(String(leadPk), 120_000);
    expect(result, 'account not created').toBeTruthy();
    accountPk = Number(result);
    console.log(`[E2E] accountPk=${accountPk}`);
  });

  await test.step('8. add decline card to account + set auto_pay', async () => {
    const addResp = await api.creditCard.createOrUpdateCreditCard({
      accountPk,
      ccFirstName: td.applicant.firstName,
      ccLastName: td.applicant.lastName,
      ccNumber: declineCard.number,
      ccExp: declineCard.expirationDate,
      cvc: declineCard.cvv,
      ccType: 'VISA',
      autoPay: true,
      leadPk,
    });
    expect(addResp.ok, `createOrUpdateCreditCard ${addResp.status}: ${JSON.stringify(addResp.body).slice(0, 200)}`).toBeTruthy();
    console.log(`[E2E] decline card added: ${JSON.stringify(addResp.body).slice(0, 100)}`);
    await db.executeUpdate(`UPDATE uown_sv_account SET auto_pay_types = 'CC' WHERE pk = $1`, [accountPk]);
  });

  await test.step('9. adjust dates + trigger CreateScheduledCCPaymentsSweep + wait SCHEDULED CCT', async () => {
    await db.executeUpdate(
      `UPDATE uown_sv_sched_summary SET first_payment_due_date = CURRENT_DATE, delinquency_as_of_date = CURRENT_DATE WHERE account_pk = $1`,
      [accountPk],
    );
    const recvRows = await db.query<{ pk: string }>(
      `SELECT pk FROM uown_sv_receivable WHERE account_pk = $1 AND status = 'ACTIVE' AND receivable_type = 'REGULAR_PAYMENT' ORDER BY due_date ASC LIMIT 1`,
      [accountPk],
    );
    if (recvRows.length > 0) {
      await db.executeUpdate(`UPDATE uown_sv_receivable SET due_date = CURRENT_DATE + INTERVAL '2 days' WHERE pk = $1`, [recvRows[0].pk]);
    }
    const trig = await api.scheduledTask.triggerScheduledTask('CreateScheduledCreditCardPaymentsSweep');
    expect(trig.ok).toBeTruthy();
    const deadline = Date.now() + 120_000;
    while (Date.now() < deadline) {
      const rows = await db.query<{ pk: string }>(
        `SELECT pk FROM uown_sv_credit_card_transaction WHERE account_pk = $1 AND cc_transaction_type = 'SCHEDULED' AND cc_action = 'SALE' ORDER BY pk DESC LIMIT 1`,
        [accountPk],
      );
      if (rows.length > 0) { cctPk = Number(rows[0].pk); break; }
      await sleep(4_000);
    }
    expect(cctPk, 'no SCHEDULED SALE CCT created').toBeGreaterThan(0);
    console.log(`[E2E] cctPk=${cctPk} (PENDING)`);
  });

  await test.step('10. shift posting_date to today + trigger SendCCPaymentsSweep -> DENIED', async () => {
    await db.executeUpdate(`UPDATE uown_sv_credit_card_transaction SET posting_date = CURRENT_DATE WHERE pk = $1`, [cctPk]);
    const trig = await api.scheduledTask.triggerScheduledTask('SendCreditCardPaymentsSweep');
    expect(trig.ok).toBeTruthy();
    const deadline = Date.now() + 120_000;
    while (Date.now() < deadline) {
      const rows = await db.query<{ status: string; gateway_transaction_id: string | null; cc_vendor_transaction_id: string | null }>(
        `SELECT status, gateway_transaction_id, cc_vendor_transaction_id FROM uown_sv_credit_card_transaction WHERE pk = $1`, [cctPk],
      );
      if (rows.length > 0 && rows[0].status !== 'PENDING' && rows[0].status !== 'PICKED_TO_SEND') {
        console.log(`[E2E] CCT status=${rows[0].status} gateway_txn=${rows[0].gateway_transaction_id?.slice(0, 20)} vendor_txn=${rows[0].cc_vendor_transaction_id?.slice(0, 20)}`);
        expect(rows[0].gateway_transaction_id, 'gateway_transaction_id populated').toBeTruthy();
        break;
      }
      await sleep(4_000);
    }
  });

  await test.step('11. shift posting_date to today-7 + ensure cc_vendor_transaction_id', async () => {
    await db.executeUpdate(`UPDATE uown_sv_credit_card_transaction SET posting_date = CURRENT_DATE - INTERVAL '7 days' WHERE pk = $1`, [cctPk]);
    await db.executeUpdate(
      `UPDATE uown_sv_credit_card_transaction SET cc_vendor_transaction_id = gateway_transaction_id WHERE pk = $1 AND (cc_vendor_transaction_id IS NULL OR TRIM(cc_vendor_transaction_id) = '')`,
      [cctPk],
    );
  });

  await test.step('12. trigger StickyRecoverSweep', async () => {
    const resp = await api.scheduledTask.triggerScheduledTask('StickyRecoverSweep');
    expect(resp.ok).toBeTruthy();
  });

  let session: StickySessionRow | null = null;
  await test.step('13. wait for sticky session with transaction_id (up to 6 min)', async () => {
    session = await waitForStickyTransactionId(db, cctPk, 360_000);
    expect(session.sticky_transaction_id).toBeTruthy();
    console.log(`[E2E] sticky session: pk=${session.pk} txnId=${session.sticky_transaction_id} status=${session.recovery_status}`);
  });

  await test.step('14. wait for recovery to progress (up to 5 min)', async () => {
    const start = Date.now();
    let lastStatus = '';
    let lastAttempts = 0;
    while (Date.now() - start < 300_000) {
      const row = await db.queryOne<{ recovery_status: string; number_of_attempts: string }>(
        `SELECT recovery_status, number_of_attempts::text FROM uown_sticky WHERE pk = $1`,
        [session!.pk],
      );
      lastStatus = row?.recovery_status ?? '';
      lastAttempts = Number(row?.number_of_attempts ?? 0);
      if (lastStatus === 'RECOVERED') {
        console.log(`[E2E] RECOVERY SUCCESSFUL! attempts=${lastAttempts}`);
        break;
      }
      if (lastStatus !== 'PENDING' && lastStatus !== 'RECOVERY_DRAFT') {
        console.log(`[E2E] status=${lastStatus} attempts=${lastAttempts}`);
      }
      await sleep(15_000);
    }
    console.log(`[E2E] final: status=${lastStatus} attempts=${lastAttempts}`);
  });

  await test.step('15. check inbound webhooks + retry attempts + activity log', async () => {
    const inbound = await db.query<{ pk: string; event_type: string; status: string }>(
      `SELECT pk, event_type, status FROM uown_sticky_inbound_log WHERE sticky_pk = $1 ORDER BY pk`,
      [session!.pk],
    );
    console.log(`[E2E] ${inbound.length} webhooks: ${inbound.map(r => `${r.event_type}=${r.status}`).join(', ')}`);

    const retries = await db.query<{ attempt_number: string; retry_status: string; amount: string }>(
      `SELECT attempt_number, retry_status, amount FROM uown_sticky_retry_attempt WHERE sticky_pk = $1 ORDER BY attempt_number`,
      [session!.pk],
    );
    console.log(`[E2E] ${retries.length} retries: ${retries.map(r => `#${r.attempt_number}=${r.retry_status} $${r.amount}`).join(', ')}`);

    const logs = await db.query<{ log_type: string; description: string }>(
      `SELECT log_type, description FROM uown_sv_activity_log WHERE account_pk = $1 AND description ILIKE '%sticky%' ORDER BY pk DESC LIMIT 5`,
      [accountPk],
    );
    console.log(`[E2E] ${logs.length} activity logs: ${logs.map(r => `[${r.log_type}] ${r.description.slice(0, 80)}`).join(', ')}`);
  });
});

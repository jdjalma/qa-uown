/**
 * Payment Scheduling Sweeps — Servicing Portal — E2E
 *
 * Tests the credit-card / ACH payment-scheduling sweeps that create, send, status-poll,
 * and reverse autopay charges across the billing cycle.
 *
 * Sweeps tested:
 *   S1 — getSendACHPaymentsStatusSweep        (UPDATE: SENT + ReadyToProcess → STATUS_UPDATE_PENDING)
 *   S2 — SendCreditCardPaymentsSweep          (PENDING CC → PICKED_TO_SEND for due autopay accounts)
 *   S3 — reverseAchPaymentsSweep              (reverse RETURNED ACH on a PAID payment)
 *   S4 — CreateScheduledCreditCardPaymentsSweep (create CC charge for receivable due in +2 days)
 *
 * Strategy: API-only — sweeps are admin/ops endpoints with no UI affordance (rule #14
 * exception (a)); validation is cross-cutting DB state (rule #14 exception (c)).
 *
 * Evidence model:
 *   - S1 (getSendACHPaymentsStatusSweep) is a pure DB UPDATE with NO processor dependency,
 *     so it is DETERMINISTIC: the seeded row's status transition is asserted directly.
 *   - S2/S3/S4 attempt a real CC/ACH processor action (send / reverse / charge). dev3 has
 *     no live processor for these, so the action does not complete (processed=0). The
 *     deterministic gate is (1) ELIGIBILITY via the sweep's EXACT selection SQL (read live
 *     from uown_scheduled_task) and (2) MECHANISM (new uown_sweep_logs row). The actual
 *     status change / new row is reported as [OBSERVAÇÃO].
 *
 * Setup uses AUTHORIZED DB mutations (CLAUDE.md Exception 3) scoped to dedicated test
 * accounts (219, 220) and existing fixture rows in dev3.
 *
 * Env: dev3 (DB 127.0.0.1:5445, SVC API svc-dev3).
 *
 * Run: ENV=dev3 node node_modules/@playwright/test/cli.js test \
 *        tests/e2e/servicing/payment-scheduling-sweeps-servicing.spec.ts --reporter=list --timeout=300000
 */
import { test, expect } from '@support/base-test.js';
import type { ApiClients } from '@support/base-test.js';
import type { DatabaseHelpers } from '@helpers/database.helpers.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';

const CARD_TOKEN = '545f5afc-1e51-4960-99a5-5fd173cefbe0';

// ── Shared helpers (inline) ─────────────────────────────────────────────────

async function sweepLogBaseline(db: DatabaseHelpers, sweepName: string): Promise<number> {
  return db.getSingleNumber(
    `SELECT COALESCE(MAX(pk), 0) FROM uown_sweep_logs WHERE sweep_name = $1`,
    [sweepName],
  );
}

async function triggerAndWaitSweepLog(
  api: ApiClients,
  db: DatabaseHelpers,
  sweepName: string,
  prevSweepLogPk: number,
): Promise<number> {
  const resp = await api.scheduledTask.triggerScheduledTask(sweepName);
  expect(resp.status, `triggerScheduledTask ${sweepName}`).toBe(200);
  const newLog = await db.waitForRecord(
    'uown_sweep_logs',
    'sweep_name = $1 AND pk > $2',
    [sweepName, prevSweepLogPk],
    30_000,
  );
  expect(newLog, `new uown_sweep_logs row for ${sweepName}`).toBeTruthy();
  return db.getSingleNumber(
    `SELECT COALESCE(MAX(number_of_records_processed), 0) FROM uown_sweep_logs
     WHERE sweep_name = $1 AND pk > $2`,
    [sweepName, prevSweepLogPk],
  );
}

/** Runs the sweep's EXACT selection SQL (live) and returns true if `value` appears in any row. */
async function sweepSelects(
  db: DatabaseHelpers,
  sweepName: string,
  value: string,
): Promise<boolean> {
  const rows = await db.query<{ sql_to_pick_accounts: string }>(
    `SELECT sql_to_pick_accounts FROM uown_scheduled_task WHERE scheduled_task_name = $1`,
    [sweepName],
  );
  const sql = rows[0]?.sql_to_pick_accounts;
  if (!sql) return false;
  const selected = await db.query<Record<string, unknown>>(sql);
  return selected.some(r => Object.values(r).map(String).includes(value));
}

const TAGS = buildTags(TestTag.REGRESSION);

test.describe('Payment Scheduling Sweeps — Servicing', { tag: splitTags(TAGS) }, () => {
  test.describe.configure({ mode: 'serial' });

  // ──────────────────────────────────────────────────────────────────────────
  // S1 — getSendACHPaymentsStatusSweep (DETERMINISTIC pure UPDATE)
  //      UPDATE uown_send_sv_ach_payment SET status='STATUS_UPDATE_PENDING'
  //        WHERE status='SENT' AND vendor_achstatus='ReadyToProcess'
  // ──────────────────────────────────────────────────────────────────────────
  test('S1 — getSendACHPaymentsStatusSweep promotes SENT+ReadyToProcess rows', async ({ api, db }) => {
    test.setTimeout(120_000);

    let targetPk = 0;
    await test.step('AUTHORIZED setup (Exc 3): set a send_sv_ach_payment to SENT + ReadyToProcess', async () => {
      // Pick the most recent send_sv_ach_payment row and force it into the eligible state.
      const rows = await db.query<{ pk: string }>(
        `SELECT pk FROM uown_send_sv_ach_payment ORDER BY pk DESC LIMIT 1`,
      );
      targetPk = Number(rows[0]?.pk ?? 0);
      test.skip(targetPk === 0, 'No uown_send_sv_ach_payment rows in dev3 to exercise the sweep');
      await db.executeUpdate(
        `UPDATE uown_send_sv_ach_payment SET status='SENT', vendor_achstatus='ReadyToProcess' WHERE pk=$1`,
        [targetPk],
      );
      console.log(`[S1] send_sv_ach_payment pk=${targetPk} set to SENT + ReadyToProcess (authorized Exc 3)`);
    });

    let prevSweepLogPk = 0;
    await test.step('Trigger sweep + validate sweep_log (mechanism)', async () => {
      prevSweepLogPk = await sweepLogBaseline(db, 'getSendACHPaymentsStatusSweep');
      const processed = await triggerAndWaitSweepLog(api, db, 'getSendACHPaymentsStatusSweep', prevSweepLogPk);
      console.log(`[S1] sweep_log processed=${processed}`);
    });

    await test.step('Validate business outcome: row → STATUS_UPDATE_PENDING (deterministic)', async () => {
      const updated = await db.waitForRecord(
        'uown_send_sv_ach_payment',
        `pk = $1 AND status = 'STATUS_UPDATE_PENDING'`,
        [targetPk],
        30_000,
      );
      expect(updated, `send_sv_ach_payment pk=${targetPk} must become STATUS_UPDATE_PENDING`).toBeTruthy();
      console.log(`[S1] send_sv_ach_payment pk=${targetPk} confirmed STATUS_UPDATE_PENDING`);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // S2 — SendCreditCardPaymentsSweep
  //      Selects PENDING CC (posting <= today) on ACTIVE autopay accounts with a next
  //      receivable, and sends them (→ PICKED_TO_SEND). Send requires the CC connector,
  //      which dev3 does not execute — selection + mechanism are the gate. Account 219.
  // ──────────────────────────────────────────────────────────────────────────
  test('S2 — SendCreditCardPaymentsSweep selects a due PENDING CC charge', async ({ api, db }) => {
    test.setTimeout(120_000);
    const TX_MARKER = 'pay-sched-s2';

    let txPk = 0;
    await test.step('AUTHORIZED setup (Exc 3): seed PENDING CC (posting today) for account 219', async () => {
      // Account 219 is ACTIVE, rating null, auto_pay CC, and has a REGULAR_PAYMENT UNPAID
      // ACTIVE receivable (the nextreceivable the sweep requires).
      await db.executeUpdate(`UPDATE uown_sv_account SET auto_pay_types='CC', rating=NULL WHERE pk=219`, []);
      const existing = await db.getSingleNumber(
        `SELECT COUNT(*) FROM uown_sv_credit_card_transaction
         WHERE account_pk=219 AND status='PENDING' AND posting_date<=CURRENT_DATE AND comment=$1`,
        [TX_MARKER],
      );
      if (existing === 0) {
        await db.executeUpdate(
          `INSERT INTO uown_sv_credit_card_transaction
            (account_pk, status, cc_action, cc_transaction_type, posting_date, amount, vendor, cc_type, cc_token, comment)
           VALUES (219,'PENDING','SALE','REQUEST',CURRENT_DATE,75.00,'CHANNEL_PAYMENTS_CC','MASTERCARD',$1,$2)`,
          [CARD_TOKEN, TX_MARKER],
        );
      }
      const rows = await db.query<{ pk: string }>(
        `SELECT pk FROM uown_sv_credit_card_transaction WHERE account_pk=219 AND comment=$1 ORDER BY pk DESC LIMIT 1`,
        [TX_MARKER],
      );
      txPk = Number(rows[0]?.pk ?? 0);
      expect(txPk, 'PENDING CC tx seeded for account 219').toBeGreaterThan(0);
      console.log(`[S2] account 219 seeded with PENDING CC tx pk=${txPk} (authorized Exc 3)`);
    });

    await test.step('Validate eligibility via exact sweep SQL', async () => {
      const selected = await sweepSelects(db, 'SendCreditCardPaymentsSweep', '219');
      expect(selected, 'account 219 must be selected by SendCreditCardPaymentsSweep SQL').toBeTruthy();
      console.log('[S2] account 219 confirmed selected by SendCreditCardPaymentsSweep selection SQL');
    });

    await test.step('Trigger sweep + validate sweep_log (mechanism)', async () => {
      const prevSweepLogPk = await sweepLogBaseline(db, 'SendCreditCardPaymentsSweep');
      const processed = await triggerAndWaitSweepLog(api, db, 'SendCreditCardPaymentsSweep', prevSweepLogPk);
      // Observation: PICKED_TO_SEND requires the CC connector (not in dev3).
      const picked = await db.getSingleNumber(
        `SELECT COUNT(*) FROM uown_sv_credit_card_transaction WHERE pk=$1 AND status='PICKED_TO_SEND'`,
        [txPk],
      );
      console.log(`[S2] sweep_log processed=${processed}; tx ${txPk} PICKED_TO_SEND=${picked > 0 ? 'YES' : 'NO (connector not in dev3 — [OBSERVAÇÃO])'}`);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // S3 — reverseAchPaymentsSweep
  //      Selects accounts whose ACH (not SENT/SETTLED) on a PAID payment was updated
  //      today/yesterday, and reverses them. Reverse requires the ACH processor — dev3
  //      does not execute it. Selection + mechanism are the gate. ACH fixture pk=37 (acct 77).
  // ──────────────────────────────────────────────────────────────────────────
  test('S3 — reverseAchPaymentsSweep selects a returned ACH on a paid payment', async ({ api, db }) => {
    test.setTimeout(120_000);

    let achAccountPk = '';
    await test.step('AUTHORIZED setup (Exc 3): age a RETURNED ACH on a PAID payment to today', async () => {
      // Find an ACH linked to a PAID payment; force it RETURNED + updated now so it lands in
      // the sweep's today/yesterday window.
      const rows = await db.query<{ pk: string; account_pk: string }>(
        `SELECT sa.pk, sa.account_pk FROM uown_sv_achpayment sa
         JOIN uown_sv_payment sp ON sp.pk = sa.payment_pk
         WHERE sp.status='PAID' ORDER BY sa.pk DESC LIMIT 1`,
      );
      const achPk = Number(rows[0]?.pk ?? 0);
      achAccountPk = String(rows[0]?.account_pk ?? '');
      test.skip(achPk === 0, 'No ACH linked to a PAID payment in dev3 to exercise the sweep');
      await db.executeUpdate(
        `UPDATE uown_sv_achpayment SET status='RETURNED', row_updated_timestamp=NOW() WHERE pk=$1`,
        [achPk],
      );
      console.log(`[S3] ACH pk=${achPk} (account ${achAccountPk}) set RETURNED + updated now (authorized Exc 3)`);
    });

    await test.step('Validate eligibility via exact sweep SQL', async () => {
      const selected = await sweepSelects(db, 'reverseAchPaymentsSweep', achAccountPk);
      expect(selected, `account ${achAccountPk} must be selected by reverseAchPaymentsSweep SQL`).toBeTruthy();
      console.log(`[S3] account ${achAccountPk} confirmed selected by reverseAchPaymentsSweep selection SQL`);
    });

    await test.step('Trigger sweep + validate sweep_log (mechanism)', async () => {
      const prevSweepLogPk = await sweepLogBaseline(db, 'reverseAchPaymentsSweep');
      const processed = await triggerAndWaitSweepLog(api, db, 'reverseAchPaymentsSweep', prevSweepLogPk);
      console.log(`[S3] sweep_log processed=${processed} (reverse needs ACH processor; selection+mechanism are the gate)`);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // S4 — CreateScheduledCreditCardPaymentsSweep
  //      Creates a CC charge for an autopay (CC-only) account whose receivable is due in
  //      +2 days. Charge creation requires the CC connector — selection + mechanism are
  //      the gate. Account 220.
  // ──────────────────────────────────────────────────────────────────────────
  test('S4 — CreateScheduledCreditCardPaymentsSweep selects a +2-day due autopay account', async ({ api, db }) => {
    test.setTimeout(120_000);
    const ACCOUNT = '220';

    await test.step('AUTHORIZED setup (Exc 3): CC-only autopay + receivable due +2 + no pending charges', async () => {
      await db.executeUpdate(`UPDATE uown_sv_account SET auto_pay_types='CC', rating=NULL WHERE pk=220`, []);
      await db.executeUpdate(`UPDATE uown_sv_sched_summary SET delinquency_as_of_date=NULL WHERE account_pk=220`, []);
      // Move the first REGULAR_PAYMENT UNPAID ACTIVE receivable to due_date = today+2.
      const moved = await db.executeUpdate(
        `UPDATE uown_sv_receivable SET due_date=CURRENT_DATE+2
         WHERE pk = (SELECT pk FROM uown_sv_receivable
                     WHERE account_pk=220 AND receivable_type='REGULAR_PAYMENT'
                       AND allocation_status='UNPAID' AND status='ACTIVE'
                     ORDER BY due_date LIMIT 1)`,
        [],
      );
      expect(moved, 'a receivable was moved to due_date=today+2 for account 220').toBe(1);
      // Clear pending CC/ACH that would block the sweep's "no in-flight charges" guard.
      await db.executeUpdate(
        `UPDATE uown_sv_credit_card_transaction SET status='CANCELLED'
         WHERE account_pk=220 AND status IN ('PENDING','FUTURE_PENDING','PICKED_TO_SEND')`,
        [],
      );
      await db.executeUpdate(
        `UPDATE uown_sv_achpayment SET status='CANCELLED'
         WHERE account_pk=220 AND status IN ('PENDING','PICKED_TO_SEND','STATUS_UPDATE_PENDING')`,
        [],
      );
      console.log('[S4] account 220 set CC-only autopay + receivable due+2 + cleared in-flight charges (authorized Exc 3)');
    });

    let prevCcPk = 0;
    await test.step('Validate eligibility via exact sweep SQL', async () => {
      prevCcPk = await db.getSingleNumber(
        `SELECT COALESCE(MAX(pk),0) FROM uown_sv_credit_card_transaction WHERE account_pk=220`,
        [],
      );
      const selected = await sweepSelects(db, 'CreateScheduledCreditCardPaymentsSweep', ACCOUNT);
      expect(selected, 'account 220 must be selected by CreateScheduledCreditCardPaymentsSweep SQL').toBeTruthy();
      console.log('[S4] account 220 confirmed selected by CreateScheduledCreditCardPaymentsSweep selection SQL');
    });

    await test.step('Trigger sweep + validate sweep_log (mechanism)', async () => {
      const prevSweepLogPk = await sweepLogBaseline(db, 'CreateScheduledCreditCardPaymentsSweep');
      const processed = await triggerAndWaitSweepLog(api, db, 'CreateScheduledCreditCardPaymentsSweep', prevSweepLogPk);
      // Observation: a new scheduled CC charge requires the CC connector (not in dev3).
      const created = await db.getSingleNumber(
        `SELECT COUNT(*) FROM uown_sv_credit_card_transaction WHERE account_pk=220 AND pk>$1`,
        [prevCcPk],
      );
      console.log(`[S4] sweep_log processed=${processed}; new CC charge for 220=${created > 0 ? 'YES' : 'NO (connector not in dev3 — [OBSERVAÇÃO])'}`);
    });
  });
});

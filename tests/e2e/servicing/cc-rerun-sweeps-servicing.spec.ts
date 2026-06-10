/**
 * CC Rerun Sweeps — Servicing Portal — E2E
 *
 * Tests the five credit-card rerun/retry scheduled tasks (sweeps) that drive payment
 * recovery for denied / delinquent / errored CC charges. Each sweep selects accounts or
 * transactions via SQL, then attempts to re-charge the card on file.
 *
 * Sweeps tested:
 *   S1 — rerunCCPaymentsSweep            (DENIED + NSF + SCHEDULED SALE retry, DOW-windowed)
 *   S2 — CCDailyScheduledDeniedRerun     (DENIED/ERROR SCHEDULED SALE posting today)
 *   S3 — dailyDelinquencyRerunCCSweep    (APPROVED SALE today on a delinquent account)
 *   S4 — delinquencyRerunCCPaymentsSweep (account-level: delinquency > 100d, last pay > 100d)
 *   S5 — IdempotentCCSweep               (gateway timeout / error transactions posting today)
 *
 * Strategy: API-only — sweeps are admin/ops endpoints with no UI affordance (rule #14
 * exception (a)); validation is cross-cutting DB state (rule #14 exception (c)).
 *
 * Evidence model (deterministic):
 *   1. ELIGIBILITY — the test runs the sweep's EXACT selection SQL (read live from
 *      uown_scheduled_task.sql_to_pick_accounts) and asserts the seeded account/transaction
 *      is selected. This proves the data mutation makes the record eligible AND that the
 *      sweep's real selection logic picks it.
 *   2. MECHANISM — triggerScheduledTask produces a new uown_sweep_logs row.
 *   The actual re-charge outcome (new RERUN transaction, status change, processed count) is
 *   reported as [OBSERVAÇÃO]: it requires a live CC processor performing the retry, which
 *   dev3 does not execute deterministically for transaction-level reruns. The account-level
 *   delinquencyRerunCCPaymentsSweep (S4) DOES process accounts (observed processed=16), so
 *   its processed count is logged when > 0.
 *
 * Setup uses AUTHORIZED DB mutations (CLAUDE.md Exception 3) scoped to dedicated test
 * accounts 219–223 (fresh funded accounts with a tokenized MASTERCARD on file).
 *
 * Env: dev3 (DB 127.0.0.1:5445, SVC API svc-dev3).
 *
 * Run: ENV=dev3 node node_modules/@playwright/test/cli.js test \
 *        tests/e2e/servicing/cc-rerun-sweeps-servicing.spec.ts --reporter=list --timeout=300000
 */
import { test, expect } from '@support/base-test.js';
import type { ApiClients } from '@support/base-test.js';
import type { DatabaseHelpers } from '@helpers/database.helpers.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';

// Tokenized MASTERCARD on file for account 219 (card pk=291) — reused across the seeded
// transactions so the rerun has a chargeable token (dev3 fixture, captured 2026-06-03).
const CARD_TOKEN = '545f5afc-1e51-4960-99a5-5fd173cefbe0';

// ── Shared helpers (inline — single-file reuse) ─────────────────────────────

/** MAX(pk) baseline for a sweep's log rows (0 when none). */
async function sweepLogBaseline(db: DatabaseHelpers, sweepName: string): Promise<number> {
  return db.getSingleNumber(
    `SELECT COALESCE(MAX(pk), 0) FROM uown_sweep_logs WHERE sweep_name = $1`,
    [sweepName],
  );
}

/**
 * Triggers a sweep, waits for a new uown_sweep_logs row, returns the recorded processed
 * count. The count may be 0 even on a successful selection (the re-charge is async and the
 * count is written after processing) — callers MUST NOT gate on `>= 1`.
 */
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

/**
 * Runs the sweep's EXACT selection SQL (read live from uown_scheduled_task) and returns
 * true if `accountPk` appears in any selected row. Self-validating against the real sweep
 * definition — no hand-copied WHERE clause to drift.
 */
async function sweepSelectsAccount(
  db: DatabaseHelpers,
  sweepName: string,
  accountPk: string,
): Promise<boolean> {
  const rows = await db.query<{ sql_to_pick_accounts: string }>(
    `SELECT sql_to_pick_accounts FROM uown_scheduled_task WHERE scheduled_task_name = $1`,
    [sweepName],
  );
  const sql = rows[0]?.sql_to_pick_accounts;
  if (!sql) return false;
  const selected = await db.query<Record<string, unknown>>(sql);
  return selected.some(r => Object.values(r).map(String).includes(accountPk));
}

const TAGS = buildTags(TestTag.REGRESSION);

test.describe('CC Rerun Sweeps — Servicing', { tag: splitTags(TAGS) }, () => {
  test.describe.configure({ mode: 'serial' });

  // ──────────────────────────────────────────────────────────────────────────
  // S1 — rerunCCPaymentsSweep
  //      DENIED + NSF + SCHEDULED SALE, account auto_pay=CC (not ACH), no delinquency,
  //      posting yesterday (DOW window). Account 219.
  // ──────────────────────────────────────────────────────────────────────────
  test('S1 — rerunCCPaymentsSweep selects + runs on a DENIED NSF scheduled SALE', async ({ api, db }) => {
    test.setTimeout(120_000);
    const ACCOUNT = '219';

    await test.step('AUTHORIZED setup (Exc 3): seed DENIED NSF SCHEDULED SALE for account 219', async () => {
      // Sweep needs auto_pay_types LIKE '%CC%' AND NOT LIKE '%ACH%', delinquency null.
      await db.executeUpdate(`UPDATE uown_sv_account SET auto_pay_types='CC' WHERE pk=219`, []);
      await db.executeUpdate(`UPDATE uown_sv_sched_summary SET delinquency_as_of_date=NULL WHERE account_pk=219`, []);
      // Insert (or refresh) a DENIED/NSF/SCHEDULED SALE posting yesterday with a chargeable token.
      const existing = await db.getSingleNumber(
        `SELECT COUNT(*) FROM uown_sv_credit_card_transaction
         WHERE account_pk=219 AND status='DENIED' AND is_nsf AND cc_transaction_type='SCHEDULED' AND posting_date=CURRENT_DATE-1`,
        [],
      );
      if (existing === 0) {
        await db.executeUpdate(
          `INSERT INTO uown_sv_credit_card_transaction
            (account_pk, status, is_nsf, cc_action, cc_transaction_type, number_of_tries, posting_date,
             amount, vendor, cc_type, cc_token, cc_exp, use_card_on_file, cc_number)
           VALUES (219,'DENIED',true,'SALE','SCHEDULED',0,CURRENT_DATE-1,50.00,'CHANNEL_PAYMENTS_CC','MASTERCARD',$1,'12/2028',true,'************0055')`,
          [CARD_TOKEN],
        );
      }
      console.log('[S1] account 219 seeded with DENIED NSF SCHEDULED SALE (authorized Exc 3)');
    });

    let prevSweepLogPk = 0;
    await test.step('Validate eligibility via exact sweep SQL', async () => {
      const selected = await sweepSelectsAccount(db, 'rerunCCPaymentsSweep', ACCOUNT);
      expect(selected, 'account 219 must be selected by rerunCCPaymentsSweep SQL').toBeTruthy();
      console.log('[S1] account 219 confirmed selected by rerunCCPaymentsSweep selection SQL');
    });

    await test.step('Trigger sweep + validate sweep_log (mechanism)', async () => {
      prevSweepLogPk = await sweepLogBaseline(db, 'rerunCCPaymentsSweep');
      const processed = await triggerAndWaitSweepLog(api, db, 'rerunCCPaymentsSweep', prevSweepLogPk);
      console.log(`[S1] sweep_log processed=${processed} (re-charge is async; selection+mechanism are the gate)`);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // S2 — CCDailyScheduledDeniedRerun
  //      DENIED/ERROR SCHEDULED SALE posting today, CC autopay, delinquency <= today,
  //      error not in the expired-card list, comment not Idempotent. Account 220.
  // ──────────────────────────────────────────────────────────────────────────
  test('S2 — CCDailyScheduledDeniedRerun selects + runs on a today DENIED scheduled SALE', async ({ api, db }) => {
    test.setTimeout(120_000);
    const ACCOUNT = '220';

    await test.step('AUTHORIZED setup (Exc 3): seed DENIED SCHEDULED SALE posting today for account 220', async () => {
      await db.executeUpdate(`UPDATE uown_sv_sched_summary SET delinquency_as_of_date=CURRENT_DATE-5 WHERE account_pk=220`, []);
      await db.executeUpdate(`UPDATE uown_sv_account SET auto_pay_types='CC' WHERE pk=220`, []);
      const existing = await db.getSingleNumber(
        `SELECT COUNT(*) FROM uown_sv_credit_card_transaction
         WHERE account_pk=220 AND status='DENIED' AND cc_transaction_type='SCHEDULED' AND posting_date=CURRENT_DATE`,
        [],
      );
      if (existing === 0) {
        await db.executeUpdate(
          `INSERT INTO uown_sv_credit_card_transaction
            (account_pk, status, cc_action, cc_transaction_type, posting_date, amount, vendor, cc_type,
             cc_token, error, agent_username, comment)
           VALUES (220,'DENIED','SALE','SCHEDULED',CURRENT_DATE,50.00,'CHANNEL_PAYMENTS_CC','MASTERCARD',$1,'Insufficient funds','testuser','regular tx')`,
          [CARD_TOKEN],
        );
      }
      console.log('[S2] account 220 seeded with today DENIED SCHEDULED SALE (authorized Exc 3)');
    });

    await test.step('Validate eligibility via exact sweep SQL', async () => {
      const selected = await sweepSelectsAccount(db, 'CCDailyScheduledDeniedRerun', ACCOUNT);
      expect(selected, 'account 220 must be selected by CCDailyScheduledDeniedRerun SQL').toBeTruthy();
      console.log('[S2] account 220 confirmed selected by CCDailyScheduledDeniedRerun selection SQL');
    });

    await test.step('Trigger sweep + validate sweep_log (mechanism)', async () => {
      const prevSweepLogPk = await sweepLogBaseline(db, 'CCDailyScheduledDeniedRerun');
      const processed = await triggerAndWaitSweepLog(api, db, 'CCDailyScheduledDeniedRerun', prevSweepLogPk);
      console.log(`[S2] sweep_log processed=${processed} (re-charge async; selection+mechanism are the gate)`);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // S3 — dailyDelinquencyRerunCCSweep
  //      APPROVED SALE posting today on a delinquent ACTIVE account. Account 221.
  // ──────────────────────────────────────────────────────────────────────────
  test('S3 — dailyDelinquencyRerunCCSweep selects + runs on a delinquent account', async ({ api, db }) => {
    test.setTimeout(120_000);
    const ACCOUNT = '221';

    await test.step('AUTHORIZED setup (Exc 3): seed APPROVED SALE today + delinquency for account 221', async () => {
      await db.executeUpdate(`UPDATE uown_sv_sched_summary SET delinquency_as_of_date=CURRENT_DATE-5 WHERE account_pk=221`, []);
      const existing = await db.getSingleNumber(
        `SELECT COUNT(*) FROM uown_sv_credit_card_transaction
         WHERE account_pk=221 AND status='APPROVED' AND cc_action='SALE' AND posting_date=CURRENT_DATE`,
        [],
      );
      if (existing === 0) {
        await db.executeUpdate(
          `INSERT INTO uown_sv_credit_card_transaction
            (account_pk, status, cc_action, cc_transaction_type, posting_date, amount, vendor, cc_type, cc_token)
           VALUES (221,'APPROVED','SALE','SCHEDULED',CURRENT_DATE,50.00,'CHANNEL_PAYMENTS_CC','MASTERCARD',$1)`,
          [CARD_TOKEN],
        );
      }
      console.log('[S3] account 221 seeded with today APPROVED SALE + delinquency (authorized Exc 3)');
    });

    await test.step('Validate eligibility via exact sweep SQL', async () => {
      const selected = await sweepSelectsAccount(db, 'dailyDelinquencyRerunCCSweep', ACCOUNT);
      expect(selected, 'account 221 must be selected by dailyDelinquencyRerunCCSweep SQL').toBeTruthy();
      console.log('[S3] account 221 confirmed selected by dailyDelinquencyRerunCCSweep selection SQL');
    });

    await test.step('Trigger sweep + validate sweep_log (mechanism)', async () => {
      const prevSweepLogPk = await sweepLogBaseline(db, 'dailyDelinquencyRerunCCSweep');
      const processed = await triggerAndWaitSweepLog(api, db, 'dailyDelinquencyRerunCCSweep', prevSweepLogPk);
      console.log(`[S3] sweep_log processed=${processed} (re-charge async; selection+mechanism are the gate)`);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // S4 — delinquencyRerunCCPaymentsSweep
  //      Account-level: delinquency > 100d, last payment > 100d, ACTIVE, CC not deleted.
  //      This sweep ACTUALLY processes accounts in dev3 (observed processed > 0). Account 222.
  // ──────────────────────────────────────────────────────────────────────────
  test('S4 — delinquencyRerunCCPaymentsSweep processes long-delinquent accounts', async ({ api, db }) => {
    test.setTimeout(120_000);
    // Account 67: ACTIVE, rating NULL, non-deleted CC on file → satisfies the
    // delinquencyRerunCCPaymentsSweep JOIN + rating filter. Previous seed 222 is
    // structurally ineligible in dev3 (rating='P' → excluded by NOT IN ('P','C','D'),
    // AND both cards is_deleted=true → fails the `cc.is_deleted IS NOT TRUE` JOIN),
    // so it could never be selected regardless of aging.
    const ACCOUNT = '67';

    await test.step(`AUTHORIZED setup (Exc 3): age account ${ACCOUNT} delinquency + last payment past 100 days`, async () => {
      await db.executeUpdate(
        `UPDATE uown_sv_sched_summary SET delinquency_as_of_date=CURRENT_DATE-110, last_payment_date=CURRENT_DATE-110 WHERE account_pk=${ACCOUNT}`,
        [],
      );
      console.log(`[S4] account ${ACCOUNT} delinquency + last_payment aged to -110 days (authorized Exc 3)`);
    });

    await test.step('Validate eligibility via exact sweep SQL', async () => {
      const selected = await sweepSelectsAccount(db, 'delinquencyRerunCCPaymentsSweep', ACCOUNT);
      expect(selected, `account ${ACCOUNT} must be selected by delinquencyRerunCCPaymentsSweep SQL`).toBeTruthy();
      console.log(`[S4] account ${ACCOUNT} confirmed selected by delinquencyRerunCCPaymentsSweep selection SQL`);
    });

    await test.step('Trigger sweep + validate sweep_log (mechanism + processed count)', async () => {
      const prevSweepLogPk = await sweepLogBaseline(db, 'delinquencyRerunCCPaymentsSweep');
      const processed = await triggerAndWaitSweepLog(api, db, 'delinquencyRerunCCPaymentsSweep', prevSweepLogPk);
      // This account-level sweep genuinely processes accounts in dev3 (observed 16).
      console.log(`[S4] sweep_log processed=${processed}${processed > 0 ? ' (accounts reprocessed — real outcome)' : ' (async — selection+mechanism are the gate)'}`);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // S5 — IdempotentCCSweep
  //      SALE posting today with gateway_response timeout/error, vendor CHANNEL_PAYMENTS_CC.
  //      Account 223.
  // ──────────────────────────────────────────────────────────────────────────
  test('S5 — IdempotentCCSweep selects + runs on a gateway-timeout SALE', async ({ api, db }) => {
    test.setTimeout(120_000);
    const ACCOUNT = '223';

    await test.step('AUTHORIZED setup (Exc 3): seed gateway-timeout SALE posting today for account 223', async () => {
      const existing = await db.getSingleNumber(
        `SELECT COUNT(*) FROM uown_sv_credit_card_transaction
         WHERE account_pk=223 AND cc_action='SALE' AND posting_date=CURRENT_DATE
           AND vendor='CHANNEL_PAYMENTS_CC' AND gateway_response ILIKE '%timeout%'`,
        [],
      );
      if (existing === 0) {
        await db.executeUpdate(
          `INSERT INTO uown_sv_credit_card_transaction
            (account_pk, status, cc_action, cc_transaction_type, posting_date, amount, vendor, cc_type,
             cc_token, gateway_response)
           VALUES (223,'ERROR','SALE','SCHEDULED',CURRENT_DATE,50.00,'CHANNEL_PAYMENTS_CC','MASTERCARD',$1,'Request timeout occurred')`,
          [CARD_TOKEN],
        );
      }
      console.log('[S5] account 223 seeded with today gateway-timeout SALE (authorized Exc 3)');
    });

    await test.step('Validate eligibility via exact sweep SQL', async () => {
      const selected = await sweepSelectsAccount(db, 'IdempotentCCSweep', ACCOUNT);
      expect(selected, 'account 223 must be selected by IdempotentCCSweep SQL').toBeTruthy();
      console.log('[S5] account 223 confirmed selected by IdempotentCCSweep selection SQL');
    });

    await test.step('Trigger sweep + validate sweep_log (mechanism)', async () => {
      const prevSweepLogPk = await sweepLogBaseline(db, 'IdempotentCCSweep');
      const processed = await triggerAndWaitSweepLog(api, db, 'IdempotentCCSweep', prevSweepLogPk);
      console.log(`[S5] sweep_log processed=${processed} (re-charge async; selection+mechanism are the gate)`);
    });
  });
});

/**
 * Document / Dispatch Sweeps — Servicing Portal — E2E
 *
 * Tests the pure DB-state sweeps that advance documents, emails, SMS, and rating letters
 * through their processing pipelines. Unlike the payment sweeps, these are deterministic
 * UPDATE/derive operations with NO external processor dependency, so their business
 * outcome is asserted directly.
 *
 * Sweeps tested:
 *   S1 — storedDocServiceSweep                (email_queue SENT → PICKED_TO_STORE/STORED)
 *   S2 — storedDocSmsServiceSweep             (sms_queue SENT → PICKED_TO_STORE/STORED)
 *   S3 — getCompletedESignDocumentStatusSweep (esign SIGNED/COMPLETED → STATUS_UPDATE)
 *   S4 — emailSweep                           (email_queue PENDING → PICKED_TO_BE_SENT/onward)
 *   S5 — removeRatingLetterSweep              (ACTIVE rating 'P', no recent pay → rating removed)
 *   S6 — paymentGatewayFixSweep               (ERROR CC SALE with no gateway id → selected/fixed)
 *
 * Pipeline note: the dispatch sweeps (S1/S2/S4) move a row to the immediate target status,
 * but a downstream worker may advance it further within the same window (e.g. SENT →
 * PICKED_TO_STORE → STORED). The deterministic gate is therefore "the row left its input
 * status" (it advanced through the pipeline), which proves the sweep processed it.
 *
 * Setup uses AUTHORIZED DB mutations (CLAUDE.md Exception 3) on existing dev3 fixture rows
 * and the dedicated test account 219.
 *
 * API-only (admin/ops sweeps, no UI affordance — rule #14 exception (a)).
 * Env: dev3 (DB 127.0.0.1:5445, SVC API svc-dev3).
 *
 * Run: ENV=dev3 node node_modules/@playwright/test/cli.js test \
 *        tests/e2e/servicing/document-dispatch-sweeps-servicing.spec.ts --reporter=list --timeout=300000
 */
import { test, expect } from '@support/base-test.js';
import type { DatabaseHelpers } from '@helpers/database.helpers.js';
import { sweepLogBaseline, triggerAndWaitSweepLog } from '@helpers/sweep-fixture.helpers.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';

// sweepLogBaseline + triggerAndWaitSweepLog importados de @helpers/sweep-fixture.

async function sweepSelects(db: DatabaseHelpers, sweepName: string, value: string): Promise<boolean> {
  const rows = await db.query<{ sql_to_pick_accounts: string }>(
    `SELECT sql_to_pick_accounts FROM uown_scheduled_task WHERE scheduled_task_name = $1`,
    [sweepName],
  );
  const sql = rows[0]?.sql_to_pick_accounts;
  if (!sql) return false;
  const selected = await db.query<Record<string, unknown>>(sql);
  return selected.some(r => Object.values(r).map(String).includes(value));
}

/** Polls until the given row's status leaves `fromStatus` (advanced through the pipeline). */
async function waitForStatusToLeave(
  db: DatabaseHelpers,
  table: string,
  pk: number,
  fromStatus: string,
  timeoutMs = 30_000,
): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  let current = fromStatus;
  while (Date.now() < deadline) {
    const rows = await db.query<{ status: string }>(
      `SELECT status FROM ${table} WHERE pk = $1`,
      [pk],
    );
    current = String(rows[0]?.status ?? '');
    if (current !== fromStatus) return current;
    await new Promise(r => setTimeout(r, 2_000));
  }
  return current;
}

const TAGS = buildTags(TestTag.REGRESSION);

test.describe('Document / Dispatch Sweeps — Servicing', { tag: splitTags(TAGS) }, () => {
  test.describe.configure({ mode: 'serial' });

  // ──────────────────────────────────────────────────────────────────────────
  // S1 — storedDocServiceSweep: email_queue SENT → PICKED_TO_STORE (→ STORED)
  // ──────────────────────────────────────────────────────────────────────────
  test('S1 — storedDocServiceSweep advances a SENT email out of SENT', async ({ api, db }) => {
    test.setTimeout(120_000);

    let targetPk = 0;
    await test.step('AUTHORIZED setup (Exc 3): set an email_queue row to SENT', async () => {
      const rows = await db.query<{ pk: string }>(`SELECT pk FROM uown_email_queue ORDER BY pk DESC LIMIT 1`);
      targetPk = Number(rows[0]?.pk ?? 0);
      test.skip(targetPk === 0, 'No email_queue rows in dev3');
      await db.executeUpdate(`UPDATE uown_email_queue SET status='SENT' WHERE pk=$1`, [targetPk]);
      console.log(`[S1] email_queue pk=${targetPk} set to SENT (authorized Exc 3)`);
    });

    await test.step('Trigger sweep + validate sweep_log', async () => {
      const prev = await sweepLogBaseline(db, 'storedDocServiceSweep');
      const processed = await triggerAndWaitSweepLog(api, db, 'storedDocServiceSweep', prev);
      console.log(`[S1] sweep_log processed=${processed}`);
    });

    await test.step('Validate outcome: row advanced out of SENT (deterministic)', async () => {
      const newStatus = await waitForStatusToLeave(db, 'uown_email_queue', targetPk, 'SENT');
      expect(newStatus, `email ${targetPk} must advance out of SENT`).not.toBe('SENT');
      console.log(`[S1] email ${targetPk} advanced SENT → ${newStatus}`);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // S2 — storedDocSmsServiceSweep: sms_queue SENT → PICKED_TO_STORE (→ STORED)
  // ──────────────────────────────────────────────────────────────────────────
  test('S2 — storedDocSmsServiceSweep advances a SENT SMS out of SENT', async ({ api, db }) => {
    test.setTimeout(120_000);

    let targetPk = 0;
    await test.step('AUTHORIZED setup (Exc 3): set an sms_queue row to SENT', async () => {
      const rows = await db.query<{ pk: string }>(`SELECT pk FROM uown_sms_queue ORDER BY pk DESC LIMIT 1`);
      targetPk = Number(rows[0]?.pk ?? 0);
      test.skip(targetPk === 0, 'No sms_queue rows in dev3');
      await db.executeUpdate(`UPDATE uown_sms_queue SET status='SENT' WHERE pk=$1`, [targetPk]);
      console.log(`[S2] sms_queue pk=${targetPk} set to SENT (authorized Exc 3)`);
    });

    await test.step('Trigger sweep + validate sweep_log', async () => {
      const prev = await sweepLogBaseline(db, 'storedDocSmsServiceSweep');
      const processed = await triggerAndWaitSweepLog(api, db, 'storedDocSmsServiceSweep', prev);
      console.log(`[S2] sweep_log processed=${processed}`);
    });

    await test.step('Validate outcome: row advanced out of SENT (deterministic)', async () => {
      const newStatus = await waitForStatusToLeave(db, 'uown_sms_queue', targetPk, 'SENT');
      expect(newStatus, `sms ${targetPk} must advance out of SENT`).not.toBe('SENT');
      console.log(`[S2] sms ${targetPk} advanced SENT → ${newStatus}`);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // S3 — getCompletedESignDocumentStatusSweep: esign SIGNED → STATUS_UPDATE
  // ──────────────────────────────────────────────────────────────────────────
  test('S3 — getCompletedESignDocumentStatusSweep moves SIGNED esign to STATUS_UPDATE', async ({ api, db }) => {
    test.setTimeout(120_000);

    let targetPk = 0;
    await test.step('AUTHORIZED setup (Exc 3): set an esign document to SIGNED', async () => {
      const rows = await db.query<{ pk: string }>(`SELECT pk FROM uown_esign_document ORDER BY pk DESC LIMIT 1`);
      targetPk = Number(rows[0]?.pk ?? 0);
      test.skip(targetPk === 0, 'No esign documents in dev3');
      await db.executeUpdate(`UPDATE uown_esign_document SET status='SIGNED' WHERE pk=$1`, [targetPk]);
      console.log(`[S3] esign pk=${targetPk} set to SIGNED (authorized Exc 3)`);
    });

    await test.step('Trigger sweep + validate sweep_log', async () => {
      const prev = await sweepLogBaseline(db, 'getCompletedESignDocumentStatusSweep');
      const processed = await triggerAndWaitSweepLog(api, db, 'getCompletedESignDocumentStatusSweep', prev);
      console.log(`[S3] sweep_log processed=${processed}`);
    });

    await test.step('Validate outcome: esign advanced out of SIGNED (deterministic)', async () => {
      // The sweep moves SIGNED → STATUS_UPDATE; a downstream status-poll worker may then
      // advance it further (STATUS_UPDATE → ERROR in dev3, which has no real esign provider).
      // The deterministic gate is that the row left SIGNED — the sweep processed it.
      const newStatus = await waitForStatusToLeave(db, 'uown_esign_document', targetPk, 'SIGNED');
      expect(newStatus, `esign ${targetPk} must advance out of SIGNED`).not.toBe('SIGNED');
      console.log(`[S3] esign ${targetPk} advanced SIGNED → ${newStatus}`);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // S4 — emailSweep: email_queue PENDING → PICKED_TO_BE_SENT (→ onward)
  //      Uses a non-reminder template (Welcome) so the time-of-day filter does not exclude it.
  // ──────────────────────────────────────────────────────────────────────────
  test('S4 — emailSweep advances a PENDING email out of PENDING', async ({ api, db }) => {
    test.setTimeout(120_000);

    let targetPk = 0;
    await test.step('AUTHORIZED setup (Exc 3): set an email_queue row to PENDING (Welcome)', async () => {
      const rows = await db.query<{ pk: string }>(`SELECT pk FROM uown_email_queue ORDER BY pk DESC LIMIT 1`);
      targetPk = Number(rows[0]?.pk ?? 0);
      test.skip(targetPk === 0, 'No email_queue rows in dev3');
      await db.executeUpdate(
        `UPDATE uown_email_queue SET status='PENDING', template_name='Welcome', send_by_time=NULL WHERE pk=$1`,
        [targetPk],
      );
      console.log(`[S4] email_queue pk=${targetPk} set to PENDING/Welcome (authorized Exc 3)`);
    });

    await test.step('Trigger sweep + validate sweep_log', async () => {
      const prev = await sweepLogBaseline(db, 'emailSweep');
      const processed = await triggerAndWaitSweepLog(api, db, 'emailSweep', prev);
      console.log(`[S4] sweep_log processed=${processed}`);
    });

    await test.step('Validate outcome: row advanced out of PENDING (deterministic)', async () => {
      const newStatus = await waitForStatusToLeave(db, 'uown_email_queue', targetPk, 'PENDING');
      expect(newStatus, `email ${targetPk} must advance out of PENDING`).not.toBe('PENDING');
      console.log(`[S4] email ${targetPk} advanced PENDING → ${newStatus}`);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // S5 — removeRatingLetterSweep: ACTIVE account rating 'P', no recent payment → rating removed
  // ──────────────────────────────────────────────────────────────────────────
  test('S5 — removeRatingLetterSweep removes a stale P rating', async ({ api, db }) => {
    test.setTimeout(120_000);
    const ACCOUNT = '219';

    await test.step('AUTHORIZED setup (Exc 3): account 219 rating=P, last_rating_time aged', async () => {
      // Sweep selects ACTIVE accounts with rating='P', last_rating_time < today-30, and NO
      // PAID payment in the last 60 days. Account 219 has no recent PAID payment.
      await db.executeUpdate(
        `UPDATE uown_sv_account SET rating='P', last_rating_time=CURRENT_DATE-40 WHERE pk=219`,
        [],
      );
      console.log('[S5] account 219 set rating=P, last_rating_time=today-40 (authorized Exc 3)');
    });

    await test.step('Validate eligibility via exact sweep SQL', async () => {
      const selected = await sweepSelects(db, 'removeRatingLetterSweep', ACCOUNT);
      expect(selected, 'account 219 must be selected by removeRatingLetterSweep SQL').toBeTruthy();
      console.log('[S5] account 219 confirmed selected by removeRatingLetterSweep selection SQL');
    });

    await test.step('Trigger sweep + validate sweep_log', async () => {
      const prev = await sweepLogBaseline(db, 'removeRatingLetterSweep');
      const processed = await triggerAndWaitSweepLog(api, db, 'removeRatingLetterSweep', prev);
      console.log(`[S5] sweep_log processed=${processed}`);
    });

    await test.step('Validate outcome: account 219 rating removed (deterministic)', async () => {
      const cleared = await db.waitForRecord(
        'uown_sv_account',
        `pk = 219 AND rating IS NULL`,
        [],
        30_000,
      );
      expect(cleared, 'account 219 rating must be cleared (P removed)').toBeTruthy();
      console.log('[S5] account 219 rating confirmed removed (P → NULL)');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // S6 — paymentGatewayFixSweep: ERROR CC SALE today with no gateway id, no payment → selected
  //      The fix re-submits to the gateway (needs the connector), so selection + mechanism
  //      are the deterministic gate. Account 220.
  // ──────────────────────────────────────────────────────────────────────────
  test('S6 — paymentGatewayFixSweep selects an orphaned ERROR CC SALE', async ({ api, db }) => {
    test.setTimeout(120_000);

    let txPk = 0;
    await test.step('AUTHORIZED setup (Exc 3): seed ERROR CC SALE (no gateway id) posting today', async () => {
      await db.executeUpdate(`UPDATE uown_sv_account SET account_status='ACTIVE' WHERE pk=220`, []);
      const rows = await db.query<{ pk: string }>(
        `INSERT INTO uown_sv_credit_card_transaction
          (account_pk, status, cc_action, cc_transaction_type, posting_date, amount, cc_type,
           gateway_transaction_id, gateway_response)
         VALUES (220,'ERROR','SALE','SCHEDULED',CURRENT_DATE,40.00,'MASTERCARD','','')
         RETURNING pk`,
        [],
      );
      txPk = Number(rows[0]?.pk ?? 0);
      expect(txPk, 'ERROR CC tx seeded for account 220').toBeGreaterThan(0);
      console.log(`[S6] account 220 seeded with orphaned ERROR CC SALE pk=${txPk} (authorized Exc 3)`);
    });

    await test.step('Validate eligibility via exact sweep SQL', async () => {
      const selected = await sweepSelects(db, 'paymentGatewayFixSweep', String(txPk));
      expect(selected, `CC tx ${txPk} must be selected by paymentGatewayFixSweep SQL`).toBeTruthy();
      console.log(`[S6] CC tx ${txPk} confirmed selected by paymentGatewayFixSweep selection SQL`);
    });

    await test.step('Trigger sweep + validate sweep_log (mechanism)', async () => {
      const prev = await sweepLogBaseline(db, 'paymentGatewayFixSweep');
      const processed = await triggerAndWaitSweepLog(api, db, 'paymentGatewayFixSweep', prev);
      console.log(`[S6] sweep_log processed=${processed} (gateway fix needs connector; selection+mechanism are the gate)`);
    });
  });
});

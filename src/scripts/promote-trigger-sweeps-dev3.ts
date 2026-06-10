/**
 * Makes records eligible for trigger-acceptance sweeps in dev3,
 * re-triggers them, and verifies the outcome.
 *
 * Authorized by user: "torne registros elegiveis para esses via update no banco".
 */
import pg from 'pg';

const API_BASE = 'https://svc-dev3.uownleasing.com';
const API_KEY  = 'knQ9MeLBQhxl3gKnOszKq7ZaRxaHY23G2iddtlH2';

const pool = new pg.Pool({
  host: '127.0.0.1', port: 5445, user: 'svc_user', password: 'F1nTech', database: 'svc', max: 1,
});

async function q(sql: string, params: any[] = []) {
  return (await pool.query(sql, params)).rows;
}

async function trigger(name: string) {
  const resp = await fetch(`${API_BASE}/uown/svc/triggerScheduledTask/${name}`, {
    method: 'POST',
    headers: { 'Authorization': API_KEY, 'Content-Type': 'application/json' },
  });
  return { status: resp.status, body: (await resp.text()).slice(0, 200) };
}

async function waitForLog(name: string, afterPk: number, maxMs = 35000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    await new Promise(r => setTimeout(r, 2500));
    const rows = await q(
      `SELECT pk, number_of_records_processed AS processed, SUBSTRING(error FROM 1 FOR 200) AS error
       FROM uown_sweep_logs WHERE sweep_name = $1 AND pk > $2 ORDER BY pk DESC LIMIT 1`,
      [name, afterPk],
    );
    if (rows.length > 0) return rows[0];
  }
  return null;
}

async function lastLogPk(name: string): Promise<number> {
  const rows = await q(`SELECT COALESCE(MAX(pk), 0) AS pk FROM uown_sweep_logs WHERE sweep_name = $1`, [name]);
  return Number(rows[0].pk);
}

async function run(label: string, fn: () => Promise<void>) {
  console.log(`\n${'─'.repeat(60)}\n▶ ${label}`);
  try { await fn(); }
  catch (e: any) { console.log(`  ✗ ERROR: ${e.message}`); }
}

async function triggerAndVerify(name: string, expectProcessed?: number) {
  const prevPk = await lastLogPk(name);
  const { status, body } = await trigger(name);
  console.log(`  trigger → HTTP ${status}  body: ${body.slice(0, 80)}`);
  if (status !== 200) { console.log('  ✗ trigger failed'); return null; }
  console.log('  waiting for sweep log...');
  const log = await waitForLog(name, prevPk);
  if (!log) { console.log('  ✗ no new log within 35s'); return null; }
  const ok = !log.error && (expectProcessed === undefined || log.processed >= expectProcessed);
  console.log(`  ${ok ? '✅' : '⚠️ '} log pk=${log.pk}  processed=${log.processed}  error=${log.error ?? 'none'}`);
  return log;
}

// ─── UPDATES ──────────────────────────────────────────────────────────────────

async function updateAndLog(label: string, sql: string, params: any[] = []) {
  const r = await pool.query(sql, params);
  console.log(`  UPDATE ${label}: ${r.rowCount} row(s) affected`);
}

async function main() {

  // ── 1. rerunACHPaymentsSweep — already eligible (pk=292, R01 RETURNED) ────
  await run('rerunACHPaymentsSweep — already eligible', async () => {
    const log = await triggerAndVerify('rerunACHPaymentsSweep', 1);
    if (log && log.processed >= 1) {
      const rerun = await q(
        `SELECT pk, account_pk, ach_process_type, status, posting_date
         FROM uown_sv_achpayment WHERE ach_process_type = 'RERUN' ORDER BY pk DESC LIMIT 3`,
      );
      console.table(rerun);
    }
  });

  // ── 2. updateTaxRatesSweep — UPDATE delinquency for account 64 ────────────
  // account 64: last_tax_updated=2025-07-31 (>1 month ago), delinquency too old → update to recent
  await run('updateTaxRatesSweep — UPDATE account 64 delinquency_as_of_date', async () => {
    await updateAndLog(
      'sched_summary.delinquency_as_of_date = today-30d (account 64)',
      `UPDATE uown_sv_sched_summary SET delinquency_as_of_date = CURRENT_DATE - 30 WHERE account_pk = 64`,
    );
    const check = await q(
      `SELECT account_pk, last_tax_updated_time, delinquency_as_of_date
       FROM uown_sv_sched_summary WHERE account_pk = 64`,
    );
    console.table(check);
    const log = await triggerAndVerify('updateTaxRatesSweep', 1);
    if (log && log.processed >= 1) {
      const updated = await q(
        `SELECT account_pk, last_tax_updated_time FROM uown_sv_sched_summary WHERE account_pk = 64`,
      );
      console.log('  last_tax_updated_time after sweep:'); console.table(updated);
    }
  });

  // ── 3. chargeSigningFeeSweep — already eligible (leads 106/108/113...) ────
  await run('chargeSigningFeeSweep — already eligible', async () => {
    const log = await triggerAndVerify('chargeSigningFeeSweep', 1);
    if (log && log.processed >= 1) {
      const captures = await q(
        `SELECT pk, lead_pk, cc_action, status, amount, charge_type
         FROM uown_los_credit_card_transaction
         WHERE cc_action = 'CAPTURE' AND status = 'APPROVED' ORDER BY pk DESC LIMIT 5`,
      );
      console.log('  New CAPTURE transactions:'); console.table(captures);
    }
  });

  // ── 4. dailyTaxCloudPaymentsSync — already eligible (payments today) ──────
  await run('dailyTaxCloudPaymentsSync — already eligible', async () => {
    const before = await q(`SELECT COUNT(*) AS cnt FROM uown_tax_cloud WHERE CAST(row_created_timestamp AS DATE) = CURRENT_DATE`);
    console.log(`  uown_tax_cloud rows today (before): ${before[0].cnt}`);
    const log = await triggerAndVerify('dailyTaxCloudPaymentsSync', 1);
    if (log && log.processed >= 1) {
      const after = await q(`SELECT COUNT(*) AS cnt FROM uown_tax_cloud WHERE CAST(row_created_timestamp AS DATE) = CURRENT_DATE`);
      console.log(`  uown_tax_cloud rows today (after): ${after[0].cnt}`);
    }
  });

  // ── 5. dailyTaxCloudRefundsSync — UPDATE payment pk=2549 reverse_date to today
  await run('dailyTaxCloudRefundsSync — UPDATE payment pk=2549 reverse_date to today', async () => {
    await updateAndLog(
      'uown_sv_payment pk=2549 reverse_date_timestamp = NOW()',
      `UPDATE uown_sv_payment SET reverse_date_timestamp = NOW() WHERE pk = 2549`,
    );
    const log = await triggerAndVerify('dailyTaxCloudRefundsSync', 1);
    if (log && log.processed >= 1) {
      const refund = await q(`SELECT order_id, status FROM uown_tax_cloud WHERE order_id = '2549'`);
      console.log('  TaxCloud refund entry:'); console.table(refund);
    }
  });

  // ── 6. generateExportBlacklistReport — already has 1 record ──────────────
  await run('generateExportBlacklistReport — already has data', async () => {
    await triggerAndVerify('generateExportBlacklistReport', 1);
  });

  // ── 7. sendDailyPaymentsSharepointSweep — already has 47 payments ─────────
  await run('sendDailyPaymentsSharepointSweep — already has data', async () => {
    await triggerAndVerify('sendDailyPaymentsSharepointSweep', 1);
  });

  // ── 8. generateDueDateMovesReport — UPDATE pk=11 row_created to yesterday ─
  await run('generateDueDateMovesReport — UPDATE due_date_moves pk=11 to yesterday', async () => {
    await updateAndLog(
      'uown_due_date_moves pk=11 row_created_timestamp = NOW()-1day',
      `UPDATE uown_due_date_moves SET row_created_timestamp = NOW() - INTERVAL '1 day' WHERE pk = 11`,
    );
    const log = await triggerAndVerify('generateDueDateMovesReport', 1);
    // restore
    await pool.query(`UPDATE uown_due_date_moves SET row_created_timestamp = NOW() WHERE pk = 11`);
    console.log('  row_created_timestamp restored to now');
  });

  // ── 9. danielJewelersLeadReportSweep — UPDATE lead pk=1244 to yesterday ───
  await run('danielJewelersLeadReportSweep — UPDATE lead pk=1244 row_updated to yesterday', async () => {
    await updateAndLog(
      'uown_los_lead pk=1244 row_updated_timestamp = yesterday',
      `UPDATE uown_los_lead SET row_updated_timestamp = CURRENT_DATE - 1 WHERE pk = 1244`,
    );
    const log = await triggerAndVerify('danielJewelersLeadReportSweep', 1);
    // restore
    await pool.query(`UPDATE uown_los_lead SET row_updated_timestamp = NOW() WHERE pk = 1244`);
    console.log('  row_updated_timestamp restored to now');
  });

  // ── 10. redistributeDelinquentEpoPoolSweep — check if eligible, then trigger
  await run('redistributeDelinquentEpoPoolSweep — check + trigger', async () => {
    const eligible = await q(`
      WITH nextRec AS (
        SELECT account_pk AS "accountPk", MIN(due_date) AS "nextDueDate",
               total_amount - partial_payment_amount AS "dueAmount"
        FROM uown_sv_receivable r
        WHERE r.receivable_type IN ('REGULAR_PAYMENT','PROCESSING_FEE')
          AND r.allocation_status IN ('PARTIALLY_PAID','UNPAID') AND status = 'ACTIVE'
        GROUP BY account_pk, total_amount - partial_payment_amount
      )
      SELECT DISTINCT nr."accountPk", nr."nextDueDate", epo.partial_payment_amount,
             summary.security_deposit,
             epo.partial_payment_amount - COALESCE(summary.security_deposit,0) AS epo_net,
             nr."dueAmount"
      FROM nextRec nr
      JOIN uown_sv_account a ON nr."accountPk" = a.pk
      JOIN uown_sv_receivable epo ON epo.account_pk = nr."accountPk"
      JOIN uown_sv_sched_summary summary ON summary.account_pk = nr."accountPk"
      WHERE a.account_status = 'ACTIVE'
        AND epo.status = 'ACTIVE' AND epo.receivable_type = 'EARLY_PAY_OFF'
        AND epo.partial_payment_amount > 0
        AND epo.partial_payment_amount - COALESCE(summary.security_deposit,0) >= nr."dueAmount"
        AND nr."nextDueDate" < CURRENT_DATE
      LIMIT 5
    `);
    if (eligible.length > 0) {
      console.log(`  ${eligible.length} eligible account(s):`); console.table(eligible);
      await triggerAndVerify('redistributeDelinquentEpoPoolSweep', 1);
    } else {
      console.log('  0 eligible — need deeper setup, skipping trigger');
    }
  });

  // ── 11. pastDueEpoPoolAmountReportSweep — check + trigger ─────────────────
  await run('pastDueEpoPoolAmountReportSweep — check + trigger', async () => {
    const eligible = await q(`
      WITH nextRec AS (
        SELECT account_pk AS "accountPk", MIN(due_date) AS "nextDueDate"
        FROM uown_sv_receivable r
        WHERE r.receivable_type IN ('REGULAR_PAYMENT','PROCESSING_FEE')
          AND r.allocation_status IN ('PARTIALLY_PAID','UNPAID') AND status = 'ACTIVE'
        GROUP BY account_pk
      )
      SELECT nr."accountPk", nr."nextDueDate", epo.partial_payment_amount
      FROM nextRec nr
      JOIN uown_sv_account a ON nr."accountPk" = a.pk
      JOIN uown_sv_receivable epo ON epo.account_pk = nr."accountPk"
      WHERE a.account_status = 'ACTIVE'
        AND epo.status = 'ACTIVE' AND epo.receivable_type = 'EARLY_PAY_OFF'
        AND epo.partial_payment_amount > 0
        AND nr."nextDueDate" < CURRENT_DATE
      LIMIT 5
    `);
    if (eligible.length > 0) {
      console.log(`  ${eligible.length} eligible account(s):`); console.table(eligible);
      await triggerAndVerify('pastDueEpoPoolAmountReportSweep', 1);
    } else {
      console.log('  0 eligible — skipping');
    }
  });

  // ── 12. rerunACHWeeklyReport — check data window ──────────────────────────
  await run('rerunACHWeeklyReport — inspect date window requirement', async () => {
    const windowDate = await q(`
      SELECT (current_date-7) - CAST(EXTRACT(DOW FROM NOW()) AS INTEGER) - 3 AS required_sent_date
    `);
    console.log(`  Required sent_timestamp date: ${windowDate[0].required_sent_date}`);
    const existing = await q(`
      SELECT rerun.pk, rerun.sent_timestamp, rerun.ach_process_type
      FROM uown_sv_achpayment original
      JOIN uown_sv_achpayment rerun ON rerun.original_achpk = original.pk AND rerun.ach_process_type = 'RERUN'
      WHERE CAST(rerun.sent_timestamp AS DATE) = (current_date-7) - CAST(EXTRACT(DOW FROM NOW()) AS INTEGER) - 3
      LIMIT 3
    `);
    if (existing.length > 0) {
      console.log('  Found RERUN with matching sent_timestamp:'); console.table(existing);
      await triggerAndVerify('rerunACHWeeklyReport', 1);
    } else {
      // UPDATE rerun pk=94 sent_timestamp to required date
      await updateAndLog(
        `uown_sv_achpayment pk=94 sent_timestamp = required window date`,
        `UPDATE uown_sv_achpayment SET sent_timestamp = (current_date-7) - CAST(EXTRACT(DOW FROM NOW()) AS INTEGER) - 3 WHERE pk = 94`,
      );
      await triggerAndVerify('rerunACHWeeklyReport', 1);
      // restore
      await pool.query(`UPDATE uown_sv_achpayment SET sent_timestamp = NULL WHERE pk = 94`);
      console.log('  sent_timestamp restored to NULL');
    }
  });

  console.log('\n\n════════ DONE ════════');
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });

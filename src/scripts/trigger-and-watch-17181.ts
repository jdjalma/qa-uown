import pg from 'pg';
import { request as pwRequest } from '@playwright/test';
import { ConfigEnvironment } from '../config/environment.js';
import { ScheduledTaskClient } from '../api/clients/scheduled-task.client.js';

async function main() {
  const env = process.argv[2] ?? 'sandbox';
  const config = new ConfigEnvironment(env);
  const pool = new pg.Pool({ connectionString: config.dbConnectionString, max: 1 });
  const ctx = await pwRequest.newContext();
  const scheduledTask = new ScheduledTaskClient(ctx, config);

  try {
    const before = await pool.query(`
      SELECT pk FROM uown_sweep_logs WHERE sweep_name='StickyRecoverSweep' ORDER BY pk DESC LIMIT 1`);
    const sincePk = before.rows[0]?.pk ?? 0;
    console.log(`[snapshot] last sweep_log pk=${sincePk}`);

    const t = await scheduledTask.triggerScheduledTask('StickyRecoverSweep');
    console.log(`[trigger] http=${t.status}`);

    let newRun: any = null;
    const deadline = Date.now() + 6 * 60 * 1000;
    while (Date.now() < deadline) {
      const r = await pool.query(`
        SELECT pk, start_time, end_time, number_of_records_processed AS processed,
               SUBSTRING(error FROM 1 FOR 400) AS err
          FROM uown_sweep_logs
         WHERE sweep_name='StickyRecoverSweep' AND pk > $1
         ORDER BY pk DESC LIMIT 1`, [sincePk]);
      if (r.rows[0]) { newRun = r.rows[0]; break; }
      await new Promise(f => setTimeout(f, 3000));
      process.stdout.write('.');
    }
    console.log('');
    console.log('[run]:'); console.table([newRun]);

    if (!newRun) return;

    // give svc a few seconds to persist outbound_log/uown_sticky
    await new Promise(f => setTimeout(f, 5000));

    const s = await pool.query(`
      SELECT pk, account_pk, cc_transaction_pk, recovery_status, sticky_transaction_id, row_created_timestamp
        FROM uown_sticky
       WHERE row_created_timestamp >= $1
       ORDER BY pk DESC`, [newRun.start_time]);
    console.log(`uown_sticky criadas após ${newRun.start_time}:`); console.table(s.rows);

    const ob = await pool.query(`
      SELECT pk, sticky_pk, account_pk,
             SUBSTRING(stack_trace FROM 1 FOR 500) AS stack,
             SUBSTRING(response FROM 1 FOR 300) AS resp,
             row_created_timestamp
        FROM uown_sticky_outbound_log
       WHERE row_created_timestamp >= $1
       ORDER BY pk DESC`, [newRun.start_time]);
    console.log(`outbound_log após ${newRun.start_time}:`); console.table(ob.rows);

    // current state of cct 82957
    const c2 = await pool.query(`
      SELECT pk, status, posting_date, error, gateway_transaction_id,
             LEFT(comment, 60) AS comment, payment_arrangement_pk, row_updated_timestamp
        FROM uown_sv_credit_card_transaction WHERE pk=82957`);
    console.log('cct 82957 atual:'); console.table(c2.rows);

    // Re-check eligibility — maybe sweep updated something
    const elig = await pool.query(`
      SELECT cct.pk,
        (cct.status='DENIED' AND cct.cc_vendor='CHANNEL_PAYMENTS_CC'
         AND cct.posting_date = CURRENT_DATE - INTERVAL '7 days'
         AND cct.cc_transaction_type='SCHEDULED' AND cct.cc_action='SALE'
         AND a.account_status='ACTIVE'
         AND (a.rating IS NULL OR a.rating NOT IN ('P','C','D','B'))
         AND s.delinquency_as_of_date <= CURRENT_DATE
         AND cct.comment NOT LIKE 'Idempotent transaction was run. %'
         AND NOT EXISTS (SELECT 1 FROM uown_sticky st
                          WHERE st.cc_transaction_pk = cct.pk
                            AND st.sticky_transaction_id IS NOT NULL)) AS eligible_now
        FROM uown_sv_credit_card_transaction cct
        JOIN uown_sv_account a ON a.pk = cct.account_pk
        JOIN uown_sv_sched_summary s ON s.account_pk = a.pk
       WHERE cct.pk = 82957`);
    console.log('elegibilidade pós-run:'); console.table(elig.rows);
  } finally {
    await pool.end();
    await ctx.dispose();
  }
}
main().catch(e => { console.error(e); process.exit(1); });

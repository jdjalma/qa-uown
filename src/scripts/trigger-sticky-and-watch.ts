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
    // 1) snapshot do último sweep run ANTES de disparar
    const before = await pool.query(`
      SELECT pk FROM uown_sweep_logs
       WHERE sweep_name='StickyRecoverSweep' ORDER BY pk DESC LIMIT 1
    `);
    const sincePk = before.rows[0]?.pk ?? 0;
    console.log(`[snapshot] último sweep pk antes do trigger: ${sincePk}`);

    // 2) snapshot do estado da conta + cct (validar que continua CLOSED)
    const acc = await pool.query(`SELECT pk, account_status, rating FROM uown_sv_account WHERE pk=17169`);
    console.log('account 17169 antes do trigger:'); console.table(acc.rows);

    // 3) trigger
    console.log('[trigger] POST triggerScheduledTask/StickyRecoverSweep ...');
    const t = await scheduledTask.triggerScheduledTask('StickyRecoverSweep');
    console.log(`[trigger] http=${t.status} ok=${t.ok}`);

    // 4) poll uown_sweep_logs por nova entrada (até 6 min)
    const deadline = Date.now() + 6 * 60 * 1000;
    let newRow: any = null;
    while (Date.now() < deadline) {
      const r = await pool.query(`
        SELECT pk, start_time, end_time,
               number_of_records_processed AS processed,
               SUBSTRING(error FROM 1 FOR 200) AS err
          FROM uown_sweep_logs
         WHERE sweep_name='StickyRecoverSweep' AND pk > $1
         ORDER BY pk DESC LIMIT 1
      `, [sincePk]);
      if (r.rows[0]) { newRow = r.rows[0]; break; }
      await new Promise(r => setTimeout(r, 5000));
      process.stdout.write('.');
    }
    console.log('');

    if (!newRow) {
      console.log('[result] ❌ TIMEOUT: nenhum run novo apareceu em 6 min. Quartz está lento — re-rode o script.');
      return;
    }
    console.log('[result] nova execução do sweep:'); console.table([newRow]);

    // 5) checar se foi criada sticky session para a cct 82934
    const s = await pool.query(`
      SELECT pk, account_pk, cc_transaction_pk, recovery_status, sticky_transaction_id, row_created_timestamp
        FROM uown_sticky WHERE cc_transaction_pk=82934 OR account_pk=17169 ORDER BY pk DESC LIMIT 3`);
    console.log('uown_sticky para cct 82934 / account 17169:');
    if (s.rows.length === 0) console.log('(0 rows) — sweep NÃO criou sessão (esperado se conta CLOSED)');
    else console.table(s.rows);

    // 6) confirmar elegibilidade real-time
    const e = await pool.query(`
      SELECT COUNT(*)::int AS eligible
        FROM uown_sv_credit_card_transaction cct
        JOIN uown_sv_account a ON a.pk = cct.account_pk
        JOIN uown_sv_sched_summary s ON a.pk = s.account_pk
        JOIN uown_sv_credit_card cc ON cc.auto_pay = true AND cc.account_pk = a.pk
       WHERE cct.pk = 82934
         AND cct.status = 'DENIED' AND cct.cc_vendor = 'CHANNEL_PAYMENTS_CC'
         AND cct.posting_date = CURRENT_DATE - INTERVAL '7 days'
         AND cct.agent_username NOT IN ('SpecialProcess#5014')
         AND cct.cc_transaction_type = 'SCHEDULED' AND cct.cc_action = 'SALE'
         AND a.account_status = 'ACTIVE'
         AND (a.rating IS NULL OR a.rating NOT IN ('P','C','D','B'))
         AND (cct.error IS NULL OR cct.error NOT IN (
              'Card is expired','Card number error','Closed account',
              'Hold card (stolen)','Hold card (pick up card)','Hold card (lost)',
              'Withdrawal limit exceeded','PIN tries exceeded'))
         AND s.delinquency_as_of_date <= CURRENT_DATE
         AND cct.comment NOT LIKE 'Idempotent transaction was run. %'
         AND NOT EXISTS (SELECT 1 FROM uown_sticky st WHERE st.cc_transaction_pk=cct.pk AND st.sticky_transaction_id IS NOT NULL)
    `);
    console.log(`[evidência] elegibilidade da cct 82934 vs SQL do sweep: ${e.rows[0].eligible === 1 ? '✅ passaria' : '❌ bloqueada'}`);
  } finally {
    await pool.end();
    await ctx.dispose();
  }
}
main().catch(e => { console.error(e); process.exit(1); });

import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const c = new ConfigEnvironment(process.argv[2] ?? 'sandbox');
  const p = new pg.Pool({ connectionString: c.dbConnectionString, max: 1 });
  try {
    const a = await p.query(`SELECT pk, account_status, rating FROM uown_sv_account WHERE pk=17169`);
    console.log('account:'); console.table(a.rows);

    const s = await p.query(`
      SELECT pk, account_pk, cc_transaction_pk, recovery_status, sticky_transaction_id, row_created_timestamp
        FROM uown_sticky WHERE cc_transaction_pk=82934 OR account_pk=17169 ORDER BY pk DESC LIMIT 3`);
    console.log('uown_sticky:'); console.table(s.rows);

    const sw = await p.query(`
      SELECT pk, start_time, number_of_records_processed AS processed, SUBSTRING(error,1,150) AS err
        FROM uown_sweep_logs WHERE sweep_name='StickyRecoverSweep' ORDER BY pk DESC LIMIT 3`);
    console.log('last 3 sweep runs:'); console.table(sw.rows);

    // Re-evaluate eligibility with current state
    const e = await p.query(`
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
    console.log(`SWEEP ELIGIBILITY now: ${e.rows[0].eligible === 1 ? '✅ would be picked' : '❌ blocked'}`);
  } finally {
    await p.end();
  }
}
main().catch(e => { console.error(e); process.exit(1); });

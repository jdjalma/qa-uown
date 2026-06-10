import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const c = new ConfigEnvironment(process.argv[2] ?? 'sandbox');
  const p = new pg.Pool({ connectionString: c.dbConnectionString, max: 1 });
  try {
    const r = await p.query(`
      SELECT cct.pk, cct.account_pk, cct.posting_date, cct.status, cct.amount,
             LEFT(cct.comment, 30) AS comment, LEFT(cct.error, 30) AS error
        FROM uown_sv_credit_card_transaction cct
        JOIN uown_sv_account a ON a.pk = cct.account_pk
        JOIN uown_sv_sched_summary s ON s.account_pk = a.pk
        JOIN uown_sv_credit_card cc ON cc.account_pk = a.pk AND cc.auto_pay = true
       WHERE cct.status='DENIED' AND cct.cc_vendor='CHANNEL_PAYMENTS_CC'
         AND cct.posting_date = CURRENT_DATE - INTERVAL '7 days'
         AND cct.agent_username NOT IN ('SpecialProcess#5014')
         AND cct.cc_transaction_type='SCHEDULED' AND cct.cc_action='SALE'
         AND a.account_status='ACTIVE'
         AND (a.rating IS NULL OR a.rating NOT IN ('P','C','D','B'))
         AND (cct.error IS NULL OR cct.error NOT IN (
              'Card is expired','Card number error','Closed account',
              'Hold card (stolen)','Hold card (pick up card)','Hold card (lost)',
              'Withdrawal limit exceeded','PIN tries exceeded'))
         AND s.delinquency_as_of_date <= CURRENT_DATE
         AND cct.comment NOT LIKE 'Idempotent transaction was run. %'
         AND NOT EXISTS (SELECT 1 FROM uown_sticky st
                          WHERE st.cc_transaction_pk = cct.pk
                            AND st.sticky_transaction_id IS NOT NULL)
       ORDER BY cct.pk DESC`);
    console.log(`TODOS os ccts elegíveis ao sweep AGORA (${r.rows.length}):`);
    console.table(r.rows);
  } finally {
    await p.end();
  }
}
main().catch(e => { console.error(e); process.exit(1); });

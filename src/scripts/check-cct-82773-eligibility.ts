import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const cfg = new ConfigEnvironment('sandbox');
  const pool = new pg.Pool({ connectionString: cfg.dbConnectionString, max: 1 });
  try {
    const r = await pool.query(`
      SELECT
        cct.pk AS cct_pk,
        a.rating AS account_rating,
        s.delinquency_as_of_date,
        (cct.status = 'DENIED') AS pass_status,
        (cct.cc_vendor = 'CHANNEL_PAYMENTS_CC') AS pass_vendor,
        (cct.posting_date = CURRENT_DATE - INTERVAL '7 days') AS pass_posting,
        (cct.agent_username NOT IN ('SpecialProcess#5014')) AS pass_agent,
        (cct.cc_transaction_type = 'SCHEDULED') AS pass_type,
        (cct.cc_action = 'SALE') AS pass_action,
        (a.account_status = 'ACTIVE') AS pass_acc_status,
        (a.rating IS NULL OR a.rating NOT IN ('P','C','D','B')) AS pass_rating,
        (cct.error IS NULL OR cct.error NOT IN ('Card is expired','Card number error','Closed account','Hold card (stolen)','Hold card (pick up card)','Hold card (lost)','Withdrawal limit exceeded','PIN tries exceeded')) AS pass_error,
        (s.delinquency_as_of_date <= CURRENT_DATE) AS pass_daod,
        (cct.comment NOT LIKE 'Idempotent transaction was run. %') AS pass_comment,
        NOT EXISTS (SELECT 1 FROM uown_sticky st WHERE st.cc_transaction_pk = cct.pk AND st.sticky_transaction_id IS NOT NULL) AS pass_no_dup,
        EXISTS (SELECT 1 FROM uown_sv_credit_card cc WHERE cc.account_pk = a.pk AND cc.auto_pay = true) AS pass_has_autopay_cc
      FROM uown_sv_credit_card_transaction cct
      JOIN uown_sv_account a ON a.pk = cct.account_pk
      JOIN uown_sv_sched_summary s ON a.pk = s.account_pk
      WHERE cct.pk = 82773
    `);
    console.table(r.rows);
  } finally {
    await pool.end();
  }
}
main().catch(e => { console.error(e); process.exit(1); });

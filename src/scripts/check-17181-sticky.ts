import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

const ACCOUNT_PK = 17181;

async function main() {
  const c = new ConfigEnvironment(process.argv[2] ?? 'sandbox');
  const p = new pg.Pool({ connectionString: c.dbConnectionString, max: 1 });
  try {
    const r = await p.query(`
      SELECT
        cct.pk AS cct_pk,
        cct.status, cct.cc_transaction_type, cct.cc_action, cct.cc_vendor,
        cct.posting_date, cct.gateway_transaction_id, cct.agent_username,
        cct.amount, cct.payment_arrangement_pk,
        LEFT(cct.error, 60) AS error,
        LEFT(cct.comment, 60) AS comment,
        a.account_status, a.rating,
        s.delinquency_as_of_date,
        cc.pk AS cc_pk, cc.auto_pay AS cc_auto_pay, cc.is_valid_card, cc.is_deleted AS cc_is_deleted,
        (cct.status='DENIED')                                                   AS c1_status,
        (cct.cc_vendor='CHANNEL_PAYMENTS_CC')                                   AS c2_vendor,
        (cct.posting_date = CURRENT_DATE - INTERVAL '7 days')                   AS c3_posting,
        (cct.agent_username NOT IN ('SpecialProcess#5014') OR cct.agent_username IS NULL) AS c4_agent,
        (cct.cc_transaction_type='SCHEDULED')                                   AS c5_tx_type,
        (cct.cc_action='SALE')                                                  AS c6_action,
        (a.account_status='ACTIVE')                                             AS c7_acct,
        (a.rating IS NULL OR a.rating NOT IN ('P','C','D','B'))                 AS c8_rating,
        (cct.error IS NULL OR cct.error NOT IN (
          'Card is expired','Card number error','Closed account',
          'Hold card (stolen)','Hold card (pick up card)','Hold card (lost)',
          'Withdrawal limit exceeded','PIN tries exceeded'))                    AS c9_error,
        (s.delinquency_as_of_date <= CURRENT_DATE)                              AS c10_delinq,
        (cct.comment IS NOT NULL AND cct.comment NOT LIKE 'Idempotent transaction was run. %') AS c11_comment,
        (NOT EXISTS (SELECT 1 FROM uown_sticky st
                      WHERE st.cc_transaction_pk = cct.pk
                        AND st.sticky_transaction_id IS NOT NULL))              AS c12_dedupe,
        COALESCE(cc.auto_pay, false)                                            AS c13_cc_autopay
      FROM uown_sv_credit_card_transaction cct
      LEFT JOIN uown_sv_account       a ON a.pk = cct.account_pk
      LEFT JOIN uown_sv_sched_summary s ON s.account_pk = a.pk
      LEFT JOIN (
        SELECT DISTINCT ON (account_pk) account_pk, pk, auto_pay, is_valid_card, is_deleted
          FROM uown_sv_credit_card WHERE auto_pay=true
          ORDER BY account_pk, pk DESC
      ) cc ON cc.account_pk = a.pk
      WHERE cct.account_pk = $1
      ORDER BY cct.pk DESC
    `, [ACCOUNT_PK]);
    console.log(`Account ${ACCOUNT_PK} — todas as CCTs:`);
    console.table(r.rows);

    // veredito final (mesmo predicate do sweep + cc.auto_pay)
    const v = await p.query(`
      SELECT cct.pk
        FROM uown_sv_credit_card_transaction cct
        JOIN uown_sv_account       a ON a.pk = cct.account_pk
        JOIN uown_sv_sched_summary s ON s.account_pk = a.pk
        JOIN uown_sv_credit_card   cc ON cc.account_pk = a.pk AND cc.auto_pay = true
       WHERE cct.account_pk = $1
         AND cct.status='DENIED' AND cct.cc_vendor='CHANNEL_PAYMENTS_CC'
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
       ORDER BY cct.pk
    `, [ACCOUNT_PK]);
    console.log(`\nCCTs ELEGÍVEIS ao sweep (passam o SQL canônico):`, v.rows.map(x => x.pk));
    process.exitCode = v.rows.length === 0 ? 2 : 0;
  } finally {
    await p.end();
  }
}
main().catch(e => { console.error(e); process.exit(1); });

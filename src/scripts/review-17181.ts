import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

const ACCOUNT_PK = 17181;

async function q(p: pg.Pool, label: string, sql: string, params: any[] = []) {
  console.log(`\n=== ${label} ===`);
  const r = await p.query(sql, params);
  if (r.rows.length === 0) console.log('(0 rows)');
  else console.table(r.rows);
  return r;
}

async function main() {
  const c = new ConfigEnvironment(process.argv[2] ?? 'sandbox');
  const p = new pg.Pool({ connectionString: c.dbConnectionString, max: 1 });
  try {
    await q(p, 'account 17181', `
      SELECT pk, lead_pk, account_status, rating, auto_pay_types,
             row_updated_timestamp
        FROM uown_sv_account WHERE pk=$1`, [ACCOUNT_PK]);

    await q(p, 'sched_summary', `
      SELECT account_pk, delinquency_as_of_date, row_updated_timestamp
        FROM uown_sv_sched_summary WHERE account_pk=$1`, [ACCOUNT_PK]);

    await q(p, 'credit cards', `
      SELECT pk, auto_pay, is_valid_card, cc_last_four_digit, is_deleted, row_updated_timestamp
        FROM uown_sv_credit_card WHERE account_pk=$1 ORDER BY pk DESC`, [ACCOUNT_PK]);

    await q(p, 'TODAS as CCTs da conta 17181 (qualquer status)', `
      SELECT cct.pk, cct.status, cct.cc_transaction_type, cct.cc_action, cct.cc_vendor,
             cct.posting_date, cct.gateway_transaction_id,
             LEFT(cct.error, 40) AS error,
             LEFT(cct.comment, 40) AS comment,
             cct.amount, cct.payment_arrangement_pk, cct.payment_pk, cct.idempotency_key,
             cct.row_created_timestamp, cct.row_updated_timestamp
        FROM uown_sv_credit_card_transaction cct
       WHERE account_pk=$1 ORDER BY pk DESC`, [ACCOUNT_PK]);

    // Eligibility lens — ALL ccts of 17181 (not just DENIED)
    await q(p, 'Elegibilidade Sticky — todas as CCTs da conta 17181', `
      SELECT cct.pk AS cct_pk,
             cct.status, cct.posting_date,
             (cct.status='DENIED')                                              AS c1_status_denied,
             (cct.cc_vendor='CHANNEL_PAYMENTS_CC')                              AS c2_vendor,
             (cct.posting_date = CURRENT_DATE - INTERVAL '7 days')              AS c3_posting_d7,
             (cct.agent_username NOT IN ('SpecialProcess#5014') OR cct.agent_username IS NULL) AS c4_agent,
             (cct.cc_transaction_type='SCHEDULED')                              AS c5_tx_scheduled,
             (cct.cc_action='SALE')                                             AS c6_action_sale,
             (a.account_status='ACTIVE')                                        AS c7_acct_active,
             (a.rating IS NULL OR a.rating NOT IN ('P','C','D','B'))            AS c8_rating_ok,
             (cct.error IS NULL OR cct.error NOT IN (
                'Card is expired','Card number error','Closed account',
                'Hold card (stolen)','Hold card (pick up card)','Hold card (lost)',
                'Withdrawal limit exceeded','PIN tries exceeded'))              AS c9_error_ok,
             (s.delinquency_as_of_date <= CURRENT_DATE)                         AS c10_delinq,
             (cct.comment IS NOT NULL AND cct.comment NOT LIKE 'Idempotent transaction was run. %') AS c11_comment,
             (NOT EXISTS (SELECT 1 FROM uown_sticky st
                          WHERE st.cc_transaction_pk = cct.pk
                            AND st.sticky_transaction_id IS NOT NULL))          AS c12_no_sticky,
             COALESCE(cc.auto_pay, false)                                       AS c13_cc_autopay
        FROM uown_sv_credit_card_transaction cct
        LEFT JOIN uown_sv_account       a ON a.pk = cct.account_pk
        LEFT JOIN uown_sv_sched_summary s ON s.account_pk = a.pk
        LEFT JOIN (
          SELECT DISTINCT ON (account_pk) account_pk, pk, auto_pay
            FROM uown_sv_credit_card WHERE auto_pay=true
            ORDER BY account_pk, pk DESC
        ) cc ON cc.account_pk = a.pk
       WHERE cct.account_pk=$1
       ORDER BY cct.pk DESC`, [ACCOUNT_PK]);

    // Sticky session(s) for this account
    await q(p, 'uown_sticky para conta 17181', `
      SELECT pk, account_pk, cc_transaction_pk, recovery_status, sticky_transaction_id,
             number_of_attempts, row_created_timestamp
        FROM uown_sticky WHERE account_pk=$1 ORDER BY pk DESC`, [ACCOUNT_PK]);

    // Outbound logs
    await q(p, 'uown_sticky_outbound_log para conta 17181', `
      SELECT pk, sticky_pk, account_pk, source,
             LEFT(response, 200) AS response,
             LEFT(stack_trace, 200) AS stack,
             row_created_timestamp
        FROM uown_sticky_outbound_log WHERE account_pk=$1 ORDER BY pk DESC LIMIT 5`, [ACCOUNT_PK]);

    // Final summary: pass-or-fail count
    const veredict = await p.query(`
      SELECT cct.pk
        FROM uown_sv_credit_card_transaction cct
        JOIN uown_sv_account a ON a.pk = cct.account_pk
        JOIN uown_sv_sched_summary s ON s.account_pk = a.pk
        JOIN uown_sv_credit_card cc ON cc.account_pk = a.pk AND cc.auto_pay = true
       WHERE cct.account_pk=$1
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
       ORDER BY cct.pk`, [ACCOUNT_PK]);
    console.log(`\n>>> VEREDITO: CCTs que passam o SQL canônico do StickyRecoverSweep: [${veredict.rows.map(r=>r.pk).join(',') || 'nenhuma'}]`);
  } finally {
    await p.end();
  }
}
main().catch(e => { console.error(e); process.exit(1); });

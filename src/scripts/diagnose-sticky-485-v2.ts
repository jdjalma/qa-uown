import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function runQuery(pool: pg.Pool, label: string, sql: string) {
  console.log(`\n=== ${label} ===`);
  try {
    const res = await pool.query(sql);
    if (res.rows.length === 0) {
      console.log('(0 rows)');
    } else {
      console.table(res.rows);
    }
  } catch (e) {
    console.error('ERROR:', (e as Error).message);
  }
}

async function main() {
  const env = process.argv[2] ?? 'sandbox';
  const config = new ConfigEnvironment(env);
  const pool = new pg.Pool({ connectionString: config.dbConnectionString, max: 1 });
  console.log(`[diagnose-sticky-485-v2] env=${env}`);

  try {
    // First, discover real column names
    await runQuery(pool, '(0a) Colunas de uown_sv_credit_card', `
      SELECT column_name, data_type
        FROM information_schema.columns
       WHERE table_name = 'uown_sv_credit_card'
       ORDER BY ordinal_position
    `);

    await runQuery(pool, '(0b) Colunas de uown_sweep_logs', `
      SELECT column_name, data_type
        FROM information_schema.columns
       WHERE table_name = 'uown_sweep_logs'
       ORDER BY ordinal_position
    `);

    // Account 17178 (where cct 82932 actually lives — validator confusion)
    await runQuery(pool, '(B.2-fix) Account 17178 state — CCT 82932 owner', `
      SELECT pk, account_status, rating
        FROM uown_sv_account
       WHERE pk = 17178
    `);

    await runQuery(pool, '(B.3-fix) DAOD da conta 17178', `
      SELECT account_pk, delinquency_as_of_date, payment_frequency
        FROM uown_sv_sched_summary
       WHERE account_pk = 17178
    `);

    // Compare cct 82932 clause-by-clause against actual sandbox SQL
    await runQuery(pool, '(E) Clause-by-clause check do cct 82932 contra TODAS as 27 cláusulas', `
      SELECT
        cct.pk AS cct_pk,
        cct.account_pk,
        a.rating AS account_rating,
        a.account_status,
        s.delinquency_as_of_date,
        cct.posting_date,
        CURRENT_DATE AS today,
        cct.status,
        cct.cc_vendor,
        cct.cc_action,
        cct.cc_transaction_type,
        cct.agent_username,
        cct.error,
        cct.comment,
        cct.gateway_transaction_id IS NOT NULL AS has_gateway_txn,
        -- Per-clause checks
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
      WHERE cct.pk = 82932
    `);

    // Run the ACTUAL sweep SQL from uown_scheduled_task and see if cct 82932 is selected
    await runQuery(pool, '(F) Executar SQL real do sweep e verificar se 82932 aparece', `
      WITH actual_sql AS (
        SELECT sql_to_pick_accounts FROM uown_scheduled_task WHERE pk = 80
      )
      SELECT 'cct 82932 selectable?' AS check_name,
        EXISTS (
          SELECT 1
          FROM uown_sv_credit_card_transaction cct
          JOIN uown_sv_account a ON a.pk = cct.account_pk
          JOIN uown_sv_sched_summary s ON a.pk = s.account_pk
          JOIN uown_sv_credit_card cc ON cc.auto_pay = true AND cc.account_pk = a.pk
          WHERE cct.pk = 82932
            AND cct.status = 'DENIED'
            AND cct.cc_vendor = 'CHANNEL_PAYMENTS_CC'
            AND cct.posting_date = CURRENT_DATE - INTERVAL '7 days'
            AND cct.agent_username NOT IN ('SpecialProcess#5014')
            AND cct.cc_transaction_type = 'SCHEDULED'
            AND cct.cc_action = 'SALE'
            AND a.account_status = 'ACTIVE'
            AND (a.rating IS NULL OR a.rating NOT IN ('P', 'C', 'D', 'B'))
            AND (cct.error IS NULL OR cct.error NOT IN (
             'Card is expired',
             'Card number error',
             'Closed account',
             'Hold card (stolen)',
             'Hold card (pick up card)',
             'Hold card (lost)',
             'Withdrawal limit exceeded',
             'PIN tries exceeded'))
            AND s.delinquency_as_of_date <= CURRENT_DATE
            AND cct.comment NOT LIKE 'Idempotent transaction was run. %'
            AND NOT EXISTS (
              SELECT 1 FROM uown_sticky st
              WHERE st.cc_transaction_pk = cct.pk AND st.sticky_transaction_id IS NOT NULL
            )
        ) AS is_selectable
    `);
  } finally {
    await pool.end();
  }
}

main().catch(e => { console.error(e); process.exit(1); });

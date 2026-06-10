import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function runQuery(pool: pg.Pool, label: string, sql: string) {
  console.log(`\n=== ${label} ===`);
  console.log(sql.trim().replace(/^\s+/gm, '  '));
  console.log('---');
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
  console.log(`[diagnose-sticky-485] env=${env}`);

  try {
    await runQuery(pool, '(A) uown_sticky for account 17176 (CT-11 baseline)', `
      SELECT pk, sticky_transaction_id, recovery_status, cc_transaction_pk, account_pk,
             row_created_timestamp
        FROM uown_sticky
       WHERE account_pk = 17176
       ORDER BY pk DESC
    `);

    await runQuery(pool, '(B.1) Estado do cct morfado 82932 (CT-01 fast-path)', `
      SELECT pk, account_pk, status, cc_vendor, cc_action, cc_transaction_type,
             agent_username, posting_date, error, comment, gateway_transaction_id
        FROM uown_sv_credit_card_transaction
       WHERE pk = 82932
    `);

    await runQuery(pool, '(B.2) Account 17175 state', `
      SELECT pk, account_status, rating
        FROM uown_sv_account
       WHERE pk = 17175
    `);

    await runQuery(pool, '(B.3) Sched summary / DAOD da conta 17175', `
      SELECT account_pk, delinquency_as_of_date, payment_frequency
        FROM uown_sv_sched_summary
       WHERE account_pk = 17175
    `);

    await runQuery(pool, '(B.4) CCs ativos da conta 17175', `
      SELECT pk, account_pk, auto_pay, is_active, is_valid_card
        FROM uown_sv_credit_card
       WHERE account_pk = 17175
    `);

    await runQuery(pool, '(B.5) Sticky rows ligadas a cct 82932 ou account 17175', `
      SELECT pk, cc_transaction_pk, account_pk, sticky_transaction_id, recovery_status,
             row_created_timestamp
        FROM uown_sticky
       WHERE cc_transaction_pk = 82932 OR account_pk = 17175
       ORDER BY pk DESC
    `);

    await runQuery(pool, '(B.6) Últimos 5 sweep logs do StickyRecoverSweep', `
      SELECT pk, sweep_name, start_time, end_time, processed, has_errors,
             SUBSTRING(error_message FROM 1 FOR 500) AS error_excerpt
        FROM uown_sweep_logs
       WHERE sweep_name = 'StickyRecoverSweep'
       ORDER BY pk DESC LIMIT 5
    `);

    await runQuery(pool, '(C) SQL real no scheduled_task pk=80 (drift check)', `
      SELECT scheduled_task_name,
             (sql_to_pick_accounts ILIKE '%cc.auto_pay%') AS has_autopay_join,
             LENGTH(sql_to_pick_accounts) AS sql_length
        FROM uown_scheduled_task
       WHERE pk = 80
    `);

    await runQuery(pool, '(D) cct.creditCardTransactionPk via JOIN — check FE row key alignment for account 17176', `
      SELECT cct.pk AS cct_pk,
             ccti.cc_transaction_pk AS info_cct_pk,
             cct.status, cct.posting_date
        FROM uown_sv_credit_card_transaction cct
        LEFT JOIN uown_credit_card_transaction_info ccti ON ccti.cc_transaction_pk = cct.pk
       WHERE cct.account_pk = 17176
       ORDER BY cct.pk DESC LIMIT 5
    `);
  } finally {
    await pool.end();
  }
}

main().catch(e => { console.error(e); process.exit(1); });

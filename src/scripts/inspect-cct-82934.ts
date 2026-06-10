import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function q(pool: pg.Pool, label: string, sql: string) {
  console.log(`\n=== ${label} ===`);
  try {
    const r = await pool.query(sql);
    if (r.rows.length === 0) console.log('(0 rows)');
    else console.table(r.rows);
  } catch (e) {
    console.error('ERROR:', (e as Error).message);
  }
}

async function main() {
  const env = process.argv[2] ?? 'sandbox';
  const config = new ConfigEnvironment(env);
  const pool = new pg.Pool({ connectionString: config.dbConnectionString, max: 1 });
  console.log(`env=${env}`);

  try {
    await q(pool, 'cct 82934 columns', `
      SELECT column_name, data_type FROM information_schema.columns
       WHERE table_name = 'uown_sv_credit_card_transaction'
       ORDER BY ordinal_position
    `);

    await q(pool, 'cct 82934 raw (select *)', `
      SELECT pk, account_pk, status, cc_transaction_type, cc_action,
             cc_vendor, posting_date, gateway_transaction_id, agent_username,
             SUBSTRING(error FROM 1 FOR 120) AS error_excerpt,
             SUBSTRING(comment FROM 1 FOR 120) AS comment_excerpt,
             amount, row_created_timestamp
        FROM uown_sv_credit_card_transaction WHERE pk = 82934
    `);

    await q(pool, 'account + rating + auto_pay', `
      SELECT a.pk AS account_pk, a.account_status, a.rating, a.auto_pay_types,
             a.lead_pk
        FROM uown_sv_credit_card_transaction cct
        JOIN uown_sv_account a ON a.pk = cct.account_pk
       WHERE cct.pk = 82934
    `);

    await q(pool, 'credit_card cols', `
      SELECT column_name FROM information_schema.columns
       WHERE table_name='uown_sv_credit_card' ORDER BY ordinal_position
    `);

    await q(pool, 'credit_card auto_pay/is_valid_card', `
      SELECT cc.pk, cc.auto_pay, cc.is_valid_card, cc.cc_last_four_digit, cc.is_deleted
        FROM uown_sv_credit_card cc
       WHERE cc.account_pk = 17169
    `);

    await q(pool, 'sched_summary.delinquency_as_of_date', `
      SELECT s.account_pk, s.delinquency_as_of_date
        FROM uown_sv_credit_card_transaction cct
        JOIN uown_sv_sched_summary s ON s.account_pk = cct.account_pk
       WHERE cct.pk = 82934
    `);

    await q(pool, 'cct join receivable (via credit_card_transaction_pk)', `
      SELECT r.pk AS receivable_pk, r.receivable_type, r.due_date, r.amount
        FROM uown_sv_receivable r
       WHERE r.account_pk = 17169
       ORDER BY r.due_date DESC LIMIT 8
    `);

    await q(pool, 'existing uown_sticky for this account/cct', `
      SELECT pk, account_pk, cc_transaction_pk, recovery_status, sticky_transaction_id, row_created_timestamp
        FROM uown_sticky
       WHERE cc_transaction_pk = 82934 OR account_pk =
             (SELECT account_pk FROM uown_sv_credit_card_transaction WHERE pk = 82934)
       ORDER BY pk DESC LIMIT 5
    `);

    await q(pool, 'SQL do StickyRecoverSweep (sandbox)', `
      SELECT pk, scheduled_task_name,
             SUBSTRING(sql_to_pick_accounts FROM 1 FOR 4000) AS sql_excerpt
        FROM uown_scheduled_task
       WHERE scheduled_task_name = 'StickyRecoverSweep'
    `);
  } finally {
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

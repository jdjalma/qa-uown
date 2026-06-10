import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function runQuery(pool: pg.Pool, label: string, sql: string) {
  console.log(`\n=== ${label} ===`);
  try {
    const res = await pool.query(sql);
    if (res.rows.length === 0) console.log('(0 rows)');
    else console.table(res.rows);
  } catch (e) {
    console.error('ERROR:', (e as Error).message);
  }
}

async function main() {
  const env = process.argv[2] ?? 'sandbox';
  const config = new ConfigEnvironment(env);
  const pool = new pg.Pool({ connectionString: config.dbConnectionString, max: 1 });
  console.log(`[v3] env=${env}`);

  try {
    // ── CT-01: outbound + sweep_logs to find what really happened
    await runQuery(pool, '(G) Últimas 10 execuções do StickyRecoverSweep', `
      SELECT pk, start_time, end_time, number_of_records_processed AS processed,
             num_threads_made AS threads,
             SUBSTRING(error FROM 1 FOR 250) AS error_excerpt
        FROM uown_sweep_logs
       WHERE sweep_name = 'StickyRecoverSweep'
       ORDER BY pk DESC LIMIT 10
    `);

    await runQuery(pool, '(H) Outbound log para cct 82932 / account 17178', `
      SELECT pk, account_pk,
             SUBSTRING(request FROM 1 FOR 200) AS req_excerpt,
             SUBSTRING(response FROM 1 FOR 200) AS resp_excerpt,
             SUBSTRING(stack_trace FROM 1 FOR 300) AS stack_excerpt,
             row_created_timestamp
        FROM uown_sticky_outbound_log
       WHERE account_pk = 17178
       ORDER BY pk DESC LIMIT 5
    `);

    await runQuery(pool, '(H.2) Outbound log para account 17176 (CT-11 reference)', `
      SELECT pk, account_pk,
             SUBSTRING(request FROM 1 FOR 300) AS req_excerpt,
             SUBSTRING(response FROM 1 FOR 300) AS resp_excerpt,
             SUBSTRING(stack_trace FROM 1 FOR 300) AS stack_excerpt,
             row_created_timestamp
        FROM uown_sticky_outbound_log
       WHERE account_pk = 17176
       ORDER BY pk DESC LIMIT 3
    `);

    // ── CT-11: confirm endpoint contract field name + value alignment
    await runQuery(pool, '(I) Schema da response do StickyController via lib sticky', `
      SELECT
        s.pk AS sticky_pk,
        s.cc_transaction_pk AS cc_tx_pk_in_db,
        s.account_pk,
        s.sticky_transaction_id,
        s.recovery_status,
        s.dunning_profile_id,
        s.row_created_timestamp,
        s.row_updated_timestamp
      FROM uown_sticky s
      WHERE s.account_pk = 17176
      ORDER BY s.pk DESC
    `);

    await runQuery(pool, '(J) CC Transactions visíveis na grid de 17176 (compare pk vs creditCardTransactionPk)', `
      SELECT cct.pk AS cct_pk,
             cct.status,
             cct.posting_date,
             cct.cc_action,
             cct.cc_transaction_type
        FROM uown_sv_credit_card_transaction cct
       WHERE cct.account_pk = 17176
       ORDER BY cct.pk DESC LIMIT 10
    `);
  } finally {
    await pool.end();
  }
}

main().catch(e => { console.error(e); process.exit(1); });

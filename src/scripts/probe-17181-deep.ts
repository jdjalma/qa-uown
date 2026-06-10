import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const c = new ConfigEnvironment(process.argv[2] ?? 'sandbox');
  const p = new pg.Pool({ connectionString: c.dbConnectionString, max: 1 });
  try {
    const r1 = await p.query(`
      SELECT pk, account_pk, cc_transaction_pk, recovery_status, sticky_transaction_id, row_created_timestamp
        FROM uown_sticky
       WHERE account_pk=17181 OR cc_transaction_pk=82957
       ORDER BY pk DESC`);
    console.log('uown_sticky 17181/82957:'); console.table(r1.rows);

    const r2 = await p.query(`
      SELECT pk, sticky_pk, account_pk,
             SUBSTRING(stack_trace FROM 1 FOR 400) AS stack,
             SUBSTRING(response FROM 1 FOR 200) AS resp,
             row_created_timestamp
        FROM uown_sticky_outbound_log
       WHERE row_created_timestamp >= '2026-05-21 11:55:00'
       ORDER BY pk DESC`);
    console.log('outbound_log após 11:55:'); console.table(r2.rows);

    const r3 = await p.query(`
      SELECT pk, status, posting_date, error, gateway_transaction_id, LEFT(comment,80) AS comment
        FROM uown_sv_credit_card_transaction
       WHERE pk = 82957`);
    console.log('cct 82957 atual:'); console.table(r3.rows);
  } finally {
    await p.end();
  }
}
main().catch(e => { console.error(e); process.exit(1); });

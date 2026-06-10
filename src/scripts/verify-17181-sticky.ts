import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const c = new ConfigEnvironment(process.argv[2] ?? 'sandbox');
  const p = new pg.Pool({ connectionString: c.dbConnectionString, max: 1 });
  try {
    const s = await p.query(`
      SELECT pk, account_pk, cc_transaction_pk, recovery_status,
             sticky_transaction_id, row_created_timestamp
        FROM uown_sticky
       WHERE account_pk = 17181 OR cc_transaction_pk = 82957
       ORDER BY pk DESC LIMIT 5`);
    console.log('uown_sticky:'); console.table(s.rows);

    const ob = await p.query(`
      SELECT pk, account_pk,
             SUBSTRING(request  FROM 1 FOR 250) AS request,
             SUBSTRING(response FROM 1 FOR 250) AS response,
             SUBSTRING(stack_trace FROM 1 FOR 250) AS stack,
             row_created_timestamp
        FROM uown_sticky_outbound_log
       WHERE account_pk = 17181
       ORDER BY pk DESC LIMIT 3`);
    console.log('outbound log:'); console.table(ob.rows);

    const inb = await p.query(`
      SELECT pk, account_pk, event_type, status, row_created_timestamp
        FROM uown_sticky_inbound_log
       WHERE account_pk = 17181
       ORDER BY pk DESC LIMIT 5`);
    console.log('inbound log:'); console.table(inb.rows);
  } finally {
    await p.end();
  }
}
main().catch(e => { console.error(e); process.exit(1); });

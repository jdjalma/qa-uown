import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const cfg = new ConfigEnvironment('sandbox');
  const pool = new pg.Pool({ connectionString: cfg.dbConnectionString, max: 1 });
  try {
    const r = await pool.query(
      `SELECT pk, account_pk, gateway_transaction_id, posting_date, status, comment
         FROM uown_sv_credit_card_transaction
        WHERE pk IN (82912, 82914, 82932)
        ORDER BY pk`,
    );
    console.table(r.rows);
  } finally {
    await pool.end();
  }
}
main().catch(e => { console.error(e); process.exit(1); });

import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const cfg = new ConfigEnvironment('sandbox');
  const pool = new pg.Pool({ connectionString: cfg.dbConnectionString, max: 1 });
  try {
    const r = await pool.query(`
      SELECT sql_to_pick_accounts FROM uown_scheduled_task WHERE pk = 80
    `);
    console.log('=== ACTUAL SWEEP SQL ===\n');
    console.log(r.rows[0]?.sql_to_pick_accounts);
    console.log('\n=== END ===\n');

    // Now run THAT SQL and see if cct 82773 appears
    const sql = r.rows[0]?.sql_to_pick_accounts;
    if (sql) {
      const wrapped = `SELECT cct.pk FROM (${sql}) cct WHERE cct.pk = 82773`;
      const r2 = await pool.query(wrapped).catch(e => ({ error: e.message }));
      console.log('cct 82773 picked by ACTUAL sweep SQL?');
      console.log(r2);
    }
  } finally {
    await pool.end();
  }
}
main().catch(e => { console.error(e); process.exit(1); });

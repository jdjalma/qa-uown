import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const cfg = new ConfigEnvironment('sandbox');
  const pool = new pg.Pool({ connectionString: cfg.dbConnectionString, max: 1 });
  try {
    const cols = await pool.query(
      `SELECT column_name FROM information_schema.columns
        WHERE table_name = 'uown_los_lead' ORDER BY ordinal_position LIMIT 30`,
    );
    console.log('uown_los_lead columns:');
    console.table(cols.rows);
    const r = await pool.query(
      `SELECT pk, row_created_timestamp, lead_status, merchant_pk
         FROM uown_los_lead
        WHERE pk >= 97090
        ORDER BY pk DESC LIMIT 10`,
    );
    console.log('Leads created in last 2 hours:');
    console.table(r.rows);
  } finally {
    await pool.end();
  }
}
main().catch(e => { console.error(e); process.exit(1); });

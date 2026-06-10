import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const cfg = new ConfigEnvironment('sandbox');
  const pool = new pg.Pool({ connectionString: cfg.dbConnectionString, max: 1 });
  const r = await pool.query(`SELECT pk, start_time, end_time, number_of_records_processed AS processed, SUBSTRING(error FROM 1 FOR 200) AS err FROM uown_sweep_logs WHERE sweep_name='StickyRecoverSweep' ORDER BY pk DESC LIMIT 5`);
  console.table(r.rows);
  await pool.end();
}
main().catch(e => { console.error(e); process.exit(1); });

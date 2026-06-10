import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const c = new ConfigEnvironment(process.argv[2] ?? 'sandbox');
  const p = new pg.Pool({ connectionString: c.dbConnectionString, max: 1 });
  try {
    const cols = await p.query(`
      SELECT column_name FROM information_schema.columns
       WHERE table_name='uown_sweep_logs' ORDER BY ordinal_position`);
    console.log('uown_sweep_logs cols:', cols.rows.map(r=>r.column_name).join(','));

    const sw = await p.query(`
      SELECT * FROM uown_sweep_logs
       WHERE sweep_name='StickyRecoverSweep' AND pk >= 6345320
       ORDER BY pk DESC`);
    console.log('sweep_logs recentes (full):'); console.table(sw.rows);
  } finally {
    await p.end();
  }
}
main().catch(e => { console.error(e); process.exit(1); });

import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const c = new ConfigEnvironment(process.argv[2] ?? 'sandbox');
  const p = new pg.Pool({ connectionString: c.dbConnectionString, max: 1 });
  try {
    const cols = await p.query(`
      SELECT column_name FROM information_schema.columns
       WHERE table_name='uown_sticky' ORDER BY ordinal_position`);
    console.log('uown_sticky cols:', cols.rows.map(r=>r.column_name).join(','));

    const s = await p.query(`
      SELECT *
        FROM uown_sticky
       ORDER BY pk DESC LIMIT 5`);
    console.log('uown_sticky últimas 5:'); console.table(s.rows);

    const sw = await p.query(`
      SELECT pk, start_time, end_time, number_of_records_processed AS processed,
             SUBSTRING(error FROM 1 FOR 200) AS err
        FROM uown_sweep_logs
       WHERE sweep_name='StickyRecoverSweep' AND pk >= 6345320
       ORDER BY pk DESC`);
    console.log('sweep_logs recentes:'); console.table(sw.rows);

    const obCols = await p.query(`
      SELECT column_name FROM information_schema.columns
       WHERE table_name='uown_sticky_outbound_log' ORDER BY ordinal_position`);
    console.log('outbound_log cols:', obCols.rows.map(r=>r.column_name).join(','));

    const ob = await p.query(`
      SELECT * FROM uown_sticky_outbound_log ORDER BY pk DESC LIMIT 3`);
    console.log('outbound_log últimos 3:'); console.table(ob.rows);
  } finally {
    await p.end();
  }
}
main().catch(e => { console.error(e); process.exit(1); });

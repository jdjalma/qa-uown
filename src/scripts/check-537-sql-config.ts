import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

const env = process.argv[2] ?? 'qa1';
const cfg = new ConfigEnvironment(env);
const pool = new pg.Pool({ connectionString: (cfg as any).dbConnectionString, max: 1 });

(async () => {
  try {
    console.log('\n=== uown_sv_sql_config columns ===');
    const cols = await pool.query(
      `SELECT column_name, data_type FROM information_schema.columns
       WHERE table_name = 'uown_sv_sql_config' ORDER BY ordinal_position`);
    console.table(cols.rows);

    const sample = await pool.query(`SELECT * FROM uown_sv_sql_config LIMIT 2`);
    console.log('\n=== sample rows ===');
    console.log(JSON.stringify(sample.rows, null, 2));

    const cfg16 = await pool.query(
      `SELECT * FROM uown_sv_sql_config
       WHERE sql_name ILIKE '%16%' OR sql_name ILIKE '%defaultmonth%' OR sql_name ILIKE '%defaultto13%' OR sql_name ILIKE '%number.of.payments%'
       LIMIT 30`);
    console.log('\n=== 16-month-related sql_config rows ===');
    console.log(JSON.stringify(cfg16.rows, null, 2));

    const lat = await pool.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_name ILIKE '%approval%terms%' OR table_name ILIKE '%approved%terms%' OR table_name ILIKE '%lead_approval%'`);
    console.log('\n=== tables matching approval terms ===');
    console.table(lat.rows.length ? lat.rows : [{ note: 'no matching table' }]);
  } catch (e: any) { console.error('ERR:', e.message); }
  await pool.end();
})();

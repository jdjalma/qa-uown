import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

const env = process.argv[2] ?? 'qa1';
const cfg = new ConfigEnvironment(env);
const pool = new pg.Pool({ connectionString: (cfg as any).dbConnectionString, max: 1 });

(async () => {
  try {
    console.log('\n=== uown_lead_approval_terms columns ===');
    const cols = await pool.query(
      `SELECT column_name, data_type FROM information_schema.columns
       WHERE table_name = 'uown_lead_approval_terms' ORDER BY ordinal_position`);
    console.table(cols.rows);

    console.log('\n=== recent rows (last 10) ===');
    const rows = await pool.query(`SELECT * FROM uown_lead_approval_terms ORDER BY pk DESC LIMIT 10`);
    console.log(JSON.stringify(rows.rows, null, 2));

    console.log('\n=== rows with 16 in approved_terms or uw_terms ===');
    const has16 = await pool.query(
      `SELECT * FROM uown_lead_approval_terms
       WHERE uw_terms ILIKE '%16%' OR approved_terms ILIKE '%16%'
       ORDER BY pk DESC LIMIT 10`);
    console.log(JSON.stringify(has16.rows, null, 2));

    // Looking for any runtime config table
    console.log('\n=== tables that might hold runtime config ===');
    const tbls = await pool.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public'
         AND (table_name ILIKE '%config%' OR table_name ILIKE '%property%' OR table_name ILIKE '%setting%')
       ORDER BY table_name`);
    console.table(tbls.rows);

    // Look at LosLead.notes for one of the existing 16m leads (find via uw_data)
    console.log('\n=== sample LosUWData with eligible_terms containing 16 ===');
    const uw = await pool.query(
      `SELECT pk, lead_pk, eligible_terms, is_eligible_for_extra_info, uw_approval_amount, row_updated_timestamp
       FROM uown_los_uwdata
       WHERE eligible_terms ILIKE '%16%'
       ORDER BY pk DESC LIMIT 5`);
    console.log(JSON.stringify(uw.rows, null, 2));
  } catch (e: any) { console.error('ERR:', e.message); }
  await pool.end();
})();

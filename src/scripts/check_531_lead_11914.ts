import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const cfg = new ConfigEnvironment('qa1');
  const pool = new pg.Pool({ connectionString: cfg.dbConnectionString, max: 1 });
  try {
    const cols = await pool.query(
      `SELECT column_name FROM information_schema.columns
        WHERE table_name = 'uown_los_lead'
          AND (column_name ILIKE '%income%' OR column_name ILIKE '%annual%' OR column_name ILIKE '%consumed%')
        ORDER BY column_name`,
    );
    console.log('income-related columns on uown_los_lead:');
    console.table(cols.rows);

    const lead = await pool.query(
      `SELECT pk, customer_state, merchant_pk, lead_status, row_created_timestamp
         FROM uown_los_lead
        WHERE pk = 11914`,
    );
    console.log('\nLead 11914 income on record:');
    console.table(lead.rows);

    const notes = await pool.query(
      `SELECT pk, notes
         FROM uown_los_lead_notes
        WHERE lead_pk = 11914
        ORDER BY pk
        LIMIT 30`,
    );
    console.log('\nLead 11914 full first-30 notes:');
    console.table(notes.rows.map((r: any) => ({ pk: r.pk, notes: String(r.notes ?? '').slice(0, 200) })));
  } finally {
    await pool.end();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });

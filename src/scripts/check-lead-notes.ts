import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const leadPk = Number(process.argv[2] ?? 97092);
  const cfg = new ConfigEnvironment('sandbox');
  const pool = new pg.Pool({ connectionString: cfg.dbConnectionString, max: 1 });
  try {
    const r = await pool.query(
      `SELECT pk, row_created_timestamp, SUBSTRING(notes FROM 1 FOR 300) AS notes
         FROM uown_los_lead_notes
        WHERE lead_pk = $1
        ORDER BY pk DESC
        LIMIT 30`,
      [leadPk],
    );
    console.log(`lead_notes for leadPk=${leadPk}:`);
    console.table(r.rows);
  } finally {
    await pool.end();
  }
}
main().catch(e => { console.error(e); process.exit(1); });

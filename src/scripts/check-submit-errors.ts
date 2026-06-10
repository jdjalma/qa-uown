import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const leadPk = Number(process.argv[2] ?? 97094);
  const cfg = new ConfigEnvironment('sandbox');
  const pool = new pg.Pool({ connectionString: cfg.dbConnectionString, max: 1 });
  try {
    const tables = await pool.query(
      `SELECT table_name FROM information_schema.tables
        WHERE table_name LIKE '%submit_application%' OR table_name LIKE '%application_error%'
        ORDER BY table_name`,
    );
    console.log('Candidate tables:');
    console.table(tables.rows);

    for (const t of tables.rows) {
      const cols = await pool.query(
        `SELECT column_name FROM information_schema.columns
          WHERE table_name=$1 ORDER BY ordinal_position`,
        [t.table_name],
      );
      console.log(`\nColumns of ${t.table_name}:`);
      console.table(cols.rows);

      const data = await pool.query(
        `SELECT * FROM ${t.table_name} WHERE lead_pk = $1 ORDER BY pk DESC LIMIT 5`,
        [leadPk],
      ).catch(e => ({ rows: [{ error: e.message }] }));
      console.log(`\nRecent rows in ${t.table_name} for leadPk=${leadPk}:`);
      console.table((data as { rows: unknown[] }).rows);
    }
  } finally {
    await pool.end();
  }
}
main().catch(e => { console.error(e); process.exit(1); });

import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';
async function main() {
  const cfg = new ConfigEnvironment('qa1');
  const pool = new pg.Pool({ connectionString: cfg.dbConnectionString, max: 1 });
  try {
    const notes = await pool.query(
      `SELECT pk, notes FROM uown_los_lead_notes WHERE lead_pk = 12015 ORDER BY pk LIMIT 20`,
    );
    console.log('Lead 12015 (PayPossible CT-A5 attempt) notes:');
    console.table(notes.rows.map((r:any) => ({ pk: r.pk, notes: String(r.notes ?? '').slice(0, 200) })));
  } finally { await pool.end(); }
}
main().catch((err) => { console.error(err); process.exit(1); });

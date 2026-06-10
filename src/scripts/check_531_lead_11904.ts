import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const cfg = new ConfigEnvironment('qa1');
  const pool = new pg.Pool({ connectionString: cfg.dbConnectionString, max: 1 });
  try {
    const lead = await pool.query(
      `SELECT pk          AS lead_pk,
              merchant_pk,
              customer_state,
              lead_status,
              merchant_program_pk,
              row_created_timestamp
         FROM uown_los_lead
        WHERE pk = 11904`,
    );
    console.log('Lead 11904:');
    console.table(lead.rows);

    const program = await pool.query(
      `SELECT pk, program_name, term_months
         FROM uown_merchant_program
        WHERE pk = $1`,
      [lead.rows[0]?.merchant_program_pk],
    );
    console.log('\nResolved program:');
    console.table(program.rows);

    // Last 10 notes — see if backend left a clue
    const notes = await pool.query(
      `SELECT pk, notes, row_created_timestamp
         FROM uown_los_lead_notes
        WHERE lead_pk = 11904
        ORDER BY pk DESC
        LIMIT 15`,
    );
    console.log('\nLead notes (last 15):');
    console.table(notes.rows.map((r: any) => ({ pk: r.pk, ts: r.row_created_timestamp, notes: String(r.notes ?? '').slice(0, 140) })));
  } finally {
    await pool.end();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });

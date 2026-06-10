import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const cfg = new ConfigEnvironment('qa1');
  const pool = new pg.Pool({ connectionString: cfg.dbConnectionString, max: 1 });
  try {
    // Notes from the denial leads
    const deniedNotes = await pool.query(
      `SELECT pk, notes
         FROM uown_los_lead_notes
        WHERE lead_pk IN (11911, 11912)
          AND (notes ILIKE '%denied%' OR notes ILIKE '%blackbox%' OR notes ILIKE '%consumed%' OR notes ILIKE '%approval%' OR notes ILIKE '%amount%')
        ORDER BY pk
        LIMIT 30`,
    );
    console.log('Denial notes for leads 11911 (Daniel 16m) + 11912 (KS3015 16m):');
    console.table(deniedNotes.rows.map((r: any) => ({ pk: r.pk, notes: String(r.notes ?? '').slice(0, 200) })));

    // First few notes for each — to see SSN check / GDS result
    const firstNotes = await pool.query(
      `SELECT pk, lead_pk, notes
         FROM uown_los_lead_notes
        WHERE lead_pk IN (11911, 11912)
        ORDER BY lead_pk, pk
        LIMIT 30`,
    );
    console.log('\nFirst 30 notes across both denied leads:');
    console.table(firstNotes.rows.map((r: any) => ({ pk: r.pk, lead_pk: r.lead_pk, notes: String(r.notes ?? '').slice(0, 180) })));
  } finally {
    await pool.end();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });

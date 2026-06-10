import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const cfg = new ConfigEnvironment('qa1');
  const pool = new pg.Pool({ connectionString: cfg.dbConnectionString, max: 1 });
  try {
    // Did the toggle apply? Check current activation_date on Daniel's 13m programs
    const programs = await pool.query(
      `SELECT mp.pk, mp.program_name, mp.term_months, mp.activation_date,
              mp.deactivation_date, mp.is_active, mp.row_updated_timestamp
         FROM uown_merchant_program mp
         JOIN uown_merchant_to_program mtp ON mtp.program_pk = mp.pk
        WHERE mtp.merchant_pk = 6108
          AND mp.term_months IN (13, 16)
        ORDER BY mp.term_months, mp.row_updated_timestamp DESC NULLS LAST
        LIMIT 12`,
    );
    console.log("Daniel's programs — current activation state (after test run):");
    console.table(programs.rows.map((r: any) => ({
      pk: r.pk,
      name: String(r.program_name).slice(0, 40),
      term: r.term_months,
      active: r.is_active,
      activation_date: r.activation_date,
      deactivation_date: r.deactivation_date,
      updated: r.row_updated_timestamp,
    })));

    // What did lead 11913 actually resolve to?
    const lead = await pool.query(
      `SELECT pk, merchant_pk, customer_state, merchant_program_pk, lead_status, row_created_timestamp
         FROM uown_los_lead
        WHERE pk = 11913`,
    );
    console.log('\nLead 11913 resolution:');
    console.table(lead.rows);

    // Lead notes — what eligibility did the engine see?
    const notes = await pool.query(
      `SELECT pk, notes
         FROM uown_los_lead_notes
        WHERE lead_pk = 11913
          AND (notes ILIKE '%program%' OR notes ILIKE '%LTOProgram%' OR notes ILIKE '%EligibleTerm%' OR notes ILIKE '%approval%')
        ORDER BY pk
        LIMIT 20`,
    );
    console.log('\nLead 11913 program-related notes:');
    console.table(notes.rows.map((r: any) => ({ pk: r.pk, notes: String(r.notes ?? '').slice(0, 180) })));
  } finally {
    await pool.end();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });

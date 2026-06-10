/**
 * Deep-dive on the 5 historical UOWN 16m leads in qa1 to extract the recipe
 * that made BlackBox declare `EligibleTerms 16` for a UOWN-brand merchant.
 * Specifically captures the BlackBoxApproval amount + EligibleTerms log line +
 * profile data (SSN tail, name, DOB, address) so we can reverse-engineer the
 * combination.
 */
import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const cfg = new ConfigEnvironment('qa1');
  const pool = new pg.Pool({ connectionString: cfg.dbConnectionString, max: 1 });
  try {
    const LEAD_PKS = [11382, 11442, 11489, 11516, 11259, 11040, 11017, 11019, 11032];

    // What columns exist on uown_los_lead for profile info?
    const cols = await pool.query(
      `SELECT column_name FROM information_schema.columns
        WHERE table_name = 'uown_los_lead'
          AND (column_name ILIKE '%first%' OR column_name ILIKE '%last%' OR column_name ILIKE '%email%' OR column_name ILIKE '%phone%' OR column_name ILIKE '%addr%' OR column_name ILIKE '%zip%' OR column_name ILIKE '%dob%' OR column_name ILIKE '%age%' OR column_name ILIKE '%income%' OR column_name ILIKE '%employ%')
        ORDER BY column_name`,
    );
    console.log('uown_los_lead profile-related cols:');
    console.table(cols.rows);

    // Lead summary
    const summary = await pool.query(
      `SELECT l.pk AS lead_pk, l.merchant_pk, m.ref_merchant_code,
              l.customer_state, l.lead_status, l.max_approval_amount,
              l.merchant_program_pk, mp.program_name,
              l.row_created_timestamp
         FROM uown_los_lead l
         JOIN uown_merchant m ON m.pk = l.merchant_pk
         LEFT JOIN uown_merchant_program mp ON mp.pk = l.merchant_program_pk
        WHERE l.pk = ANY($1::int[])
        ORDER BY l.pk`,
      [LEAD_PKS],
    );
    console.log('\nHistorical UOWN 16m lead summaries:');
    console.table(summary.rows.map((r: any) => ({
      lead_pk: r.lead_pk,
      merchant_pk: r.merchant_pk,
      ref_code: String(r.ref_merchant_code).slice(0, 22),
      state: r.customer_state,
      status: r.lead_status,
      approval: r.max_approval_amount,
      program_pk: r.merchant_program_pk,
      program: String(r.program_name ?? '').slice(0, 25),
      ts: String(r.row_created_timestamp).slice(0, 10),
    })));

    // For each, pull the BlackBoxApproval + EligibleTerms log lines
    console.log('\n=== BlackBox + EligibleTerms notes per lead ===');
    for (const leadPk of LEAD_PKS) {
      const notes = await pool.query(
        `SELECT pk, notes
           FROM uown_los_lead_notes
          WHERE lead_pk = $1
            AND (notes ILIKE '%blackboxApproval%' OR notes ILIKE '%EligibleTerms%' OR notes ILIKE '%Approval is%' OR notes ILIKE '%lambdaScore%')
          ORDER BY pk
          LIMIT 12`,
        [leadPk],
      );
      if (notes.rows.length === 0) {
        console.log(`\n--- lead ${leadPk}: no BlackBox/EligibleTerms notes ---`);
        continue;
      }
      console.log(`\n--- lead ${leadPk} ---`);
      for (const r of notes.rows) {
        console.log(`  pk=${r.pk}: ${String(r.notes).replace(/\s+/g, ' ').slice(0, 180)}`);
      }
    }

    // Profile patterns: state, customer_first_name pattern (if it's a real name vs TestFN), DOB year
    const profiles = await pool.query(
      `SELECT pk AS lead_pk, customer_state, customer_first_name, customer_last_name, customer_email,
              customer_zip, customer_address_1
         FROM uown_los_lead
        WHERE pk = ANY($1::int[])
        ORDER BY pk`,
      [LEAD_PKS],
    );
    console.log('\n=== Profile data per lead ===');
    console.table(profiles.rows.map((r: any) => ({
      lead_pk: r.lead_pk,
      state: r.customer_state,
      first: String(r.customer_first_name ?? '').slice(0, 15),
      last: String(r.customer_last_name ?? '').slice(0, 15),
      email: String(r.customer_email ?? '').slice(0, 30),
      zip: r.customer_zip,
      addr: String(r.customer_address_1 ?? '').slice(0, 25),
    })));
  } finally {
    await pool.end();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });

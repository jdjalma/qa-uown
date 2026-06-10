import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const cfg = new ConfigEnvironment('qa1');
  const pool = new pg.Pool({ connectionString: cfg.dbConnectionString, max: 1 });
  try {
    // What columns does uown_merchant_program have related to plan/ID?
    const cols = await pool.query(
      `SELECT column_name FROM information_schema.columns
        WHERE table_name = 'uown_merchant_program'
        ORDER BY column_name`,
    );
    console.log('uown_merchant_program ALL columns:');
    console.table(cols.rows.map((r: any) => r.column_name));

    // For the 16m programs available to Daniel's Jewelers — what's in program_id, program_name, group_name?
    const dansSixteen = await pool.query(
      `SELECT mp.pk, mp.program_id, mp.program_name, mp.term_months, mp.program_type,
              mp.group_name, mp.allowed_frequency_override
         FROM uown_merchant m
         JOIN uown_merchant_to_program mtp ON mtp.merchant_pk = m.pk
         JOIN uown_merchant_program mp ON mp.pk = mtp.program_pk
        WHERE m.pk = 6108
          AND mp.term_months = 16
          AND mp.is_active = true`,
    );
    console.log("\nDaniel's Jewelers 16m programs — program_id + group_name:");
    console.table(dansSixteen.rows);

    // Same for KS3015 (the one that worked in production — account 4745)
    const ks3015 = await pool.query(
      `SELECT mp.pk, mp.program_id, mp.program_name, mp.term_months, mp.program_type, mp.group_name
         FROM uown_merchant m
         JOIN uown_merchant_to_program mtp ON mtp.merchant_pk = m.pk
         JOIN uown_merchant_program mp ON mp.pk = mtp.program_pk
        WHERE m.pk = 7099
          AND mp.term_months IN (13, 16)
          AND mp.is_active = true
        ORDER BY mp.term_months, mp.pk`,
    );
    console.log('\nKS3015 13m+16m — program_id + group_name:');
    console.table(ks3015.rows);

    // Take the lead 11700 that materialized account 4745 — what planId / programName / etc was used?
    const account4745Notes = await pool.query(
      `SELECT pk, notes
         FROM uown_los_lead_notes
        WHERE lead_pk = 11700
          AND (notes ILIKE '%planId%' OR notes ILIKE '%program%' OR notes ILIKE '%KWC%' OR notes ILIKE '%KW-16%')
        ORDER BY pk
        LIMIT 30`,
    );
    console.log('\nLead 11700 notes mentioning program/plan/KWC/KW-16:');
    console.table(account4745Notes.rows.map((r: any) => ({ pk: r.pk, notes: String(r.notes ?? '').slice(0, 180) })));
  } finally {
    await pool.end();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });

import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

const cfg = new ConfigEnvironment('stg');
const pool = new pg.Pool({ connectionString: (cfg as any).dbConnectionString, max: 1 });

(async () => {
  try {
    // 0. Find the merchant code column name in uown_los_lead
    console.log('=== 0. Lead columns with "merchant" ===');
    const cols = await pool.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'uown_los_lead' AND column_name ILIKE '%merchant%'`,
    );
    console.table(cols.rows);

    // 1. Lead 6559576 (A3) - basic status
    console.log('\n=== 1. Lead 6559576 (A3) ===');
    const r1 = await pool.query(
      `SELECT pk, lead_status, merchant_program_pk, customer_state
       FROM uown_los_lead WHERE pk = '6559576' LIMIT 1`,
    );
    console.table(r1.rows);

    // 1b. Notes
    console.log('\n=== 1b. Notes lead 6559576 ===');
    const r1b = await pool.query(
      `SELECT pk, substring(notes from 1 for 300) AS notes
       FROM uown_los_lead_notes WHERE lead_pk = '6559576' ORDER BY pk DESC LIMIT 15`,
    );
    console.table(r1b.rows);

    // 2. Approval Terms for lead 6559576
    console.log('\n=== 2. Approval Terms lead 6559576 ===');
    const r2 = await pool.query(
      `SELECT pk, lead_pk, uw_terms, approved_terms
       FROM uown_lead_approval_terms WHERE lead_pk = '6559576' ORDER BY pk DESC LIMIT 5`,
    );
    console.table(r2.rows);

    // 3. ANY LeadProgramService log in stg
    console.log('\n=== 3. ANY LeadProgramService log (stg) ===');
    const r3 = await pool.query(
      `SELECT pk, lead_pk, substring(notes from 1 for 300) AS notes
       FROM uown_los_lead_notes WHERE notes ILIKE '%LeadProgramService%'
       ORDER BY pk DESC LIMIT 10`,
    );
    if (r3.rows.length === 0) console.log('(nenhum encontrado)');
    else console.table(r3.rows);

    // 4. ANY "After defaulting to 13,16"
    console.log('\n=== 4. ANY "After defaulting to 13,16" (stg) ===');
    const r4 = await pool.query(
      `SELECT pk, lead_pk, substring(notes from 1 for 300) AS notes
       FROM uown_los_lead_notes WHERE notes ILIKE '%After defaulting to 13,16%'
       ORDER BY pk DESC LIMIT 10`,
    );
    if (r4.rows.length === 0) console.log('(nenhum encontrado)');
    else console.table(r4.rows);

    // 5. Recent leads with approved_terms="13,16"
    console.log('\n=== 5. Any lead with approved_terms="13,16" (stg) ===');
    const r5 = await pool.query(
      `SELECT pk, lead_pk, uw_terms, approved_terms, row_created_timestamp
       FROM uown_lead_approval_terms WHERE approved_terms = '13,16'
       ORDER BY pk DESC LIMIT 10`,
    );
    if (r5.rows.length === 0) console.log('(nenhum encontrado — fix NÃO deployed em stg)');
    else console.table(r5.rows);

    // 6. Active programs for KS3015
    console.log('\n=== 6. Active programs for KS3015 ===');
    const r6 = await pool.query(
      `SELECT mp.pk, mp.program_name, mp.term_months, mp.is_active, mp.allowed_frequency_override
       FROM uown_merchant_program mp
       JOIN uown_merchant_to_program mtp ON mtp.program_pk = mp.pk
       WHERE mtp.merchant_pk = 10138 AND mp.is_active = true
       ORDER BY mp.term_months`,
    );
    console.table(r6.rows);

    // 7. SSN mock behavior: any recent leads with uw_terms containing "16"
    console.log('\n=== 7. Recent leads with uw_terms containing "16" (last 20) ===');
    const r7 = await pool.query(
      `SELECT pk, lead_pk, uw_terms, approved_terms, row_created_timestamp
       FROM uown_lead_approval_terms WHERE uw_terms LIKE '%16%'
       ORDER BY pk DESC LIMIT 20`,
    );
    console.table(r7.rows);

    // 8. Lead 6559574 notes (to understand what happened with the 16m flow)
    console.log('\n=== 8. Notes lead 6559574 (A1 - 16m eligible) ===');
    const r8 = await pool.query(
      `SELECT pk, substring(notes from 1 for 300) AS notes
       FROM uown_los_lead_notes WHERE lead_pk = '6559574' ORDER BY pk LIMIT 20`,
    );
    console.table(r8.rows);

  } finally {
    await pool.end();
  }
})();

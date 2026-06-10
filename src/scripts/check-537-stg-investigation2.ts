import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

const cfg = new ConfigEnvironment('stg');
const pool = new pg.Pool({ connectionString: (cfg as any).dbConnectionString, max: 1 });

(async () => {
  try {
    // 1. KS3015 programs via program_pk (correct join column name for stg)
    console.log('=== 1. Programs for KS3015 ===');
    const progs = await pool.query(
      `SELECT mp.pk, mp.program_name, mp.term_months, mp.is_active, mp.allowed_frequency_override
       FROM uown_merchant_program mp
       JOIN uown_merchant_to_program mtp ON mtp.program_pk = mp.pk
       WHERE mtp.merchant_pk = 10138
       ORDER BY mp.term_months`,
    );
    console.table(progs.rows);

    // Does KS3015 have a 16m program?
    const has16m = progs.rows.some((r: any) => r.term_months === 16);
    console.log(`\nKS3015 has 16m program: ${has16m}`);
    if (has16m) {
      const prog16 = progs.rows.filter((r: any) => r.term_months === 16);
      console.log('16m programs:');
      console.table(prog16);
    }

    // 2. Approval Terms for lead 6559574 (A1 - 16m eligible)
    console.log('\n=== 2. Approval Terms lead 6559574 (A1) ===');
    const r2 = await pool.query(`SELECT pk, lead_pk, uw_terms, approved_terms FROM uown_lead_approval_terms WHERE lead_pk = '6559574' ORDER BY pk DESC LIMIT 5`);
    console.table(r2.rows);

    // 3. Lead 6559576 (A3 - sendInvoice empty)
    console.log('\n=== 3. Lead 6559576 (A3) ===');
    const r3 = await pool.query(`SELECT pk, lead_uuid, lead_status, merchant_program_pk, ref_merchant_code, customer_state FROM uown_los_lead WHERE pk = '6559576' LIMIT 1`);
    console.table(r3.rows);

    console.log('\n=== 3b. Notes lead 6559576 ===');
    const r3b = await pool.query(`SELECT pk, substring(notes from 1 for 300) AS notes FROM uown_los_lead_notes WHERE lead_pk = '6559576' ORDER BY pk DESC LIMIT 15`);
    console.table(r3b.rows);

    // 4. Approval Terms for lead 6559576 (A3)
    console.log('\n=== 4. Approval Terms lead 6559576 ===');
    const r4 = await pool.query(`SELECT pk, lead_pk, uw_terms, approved_terms FROM uown_lead_approval_terms WHERE lead_pk = '6559576' ORDER BY pk DESC LIMIT 5`);
    console.table(r4.rows);

    // 5. ANY lead with LeadProgramService or "After defaulting" log
    console.log('\n=== 5. ANY lead with LeadProgramService log (stg) ===');
    const r5 = await pool.query(`SELECT pk, lead_pk, substring(notes from 1 for 300) AS notes FROM uown_los_lead_notes WHERE notes ILIKE '%LeadProgramService%' ORDER BY pk DESC LIMIT 10`);
    console.table(r5.rows);

    console.log('\n=== 6. ANY lead with "After defaulting to 13,16" (stg) ===');
    const r6 = await pool.query(`SELECT pk, lead_pk, substring(notes from 1 for 300) AS notes FROM uown_los_lead_notes WHERE notes ILIKE '%After defaulting to 13,16%' ORDER BY pk DESC LIMIT 10`);
    console.table(r6.rows);

    // 7. Recent KS3015 leads with uw_terms containing "16"
    console.log('\n=== 7. Recent KS3015 leads with uw_terms containing "16" ===');
    const r7 = await pool.query(
      `SELECT lat.pk, lat.lead_pk, lat.uw_terms, lat.approved_terms, lat.row_created_timestamp
       FROM uown_lead_approval_terms lat
       JOIN uown_los_lead l ON l.pk = lat.lead_pk
       WHERE l.ref_merchant_code = 'KS3015' AND lat.uw_terms LIKE '%16%'
       ORDER BY lat.pk DESC LIMIT 10`,
    );
    console.table(r7.rows);

    // 8. Check SSN mock behavior — any 16m eligible lead in stg recently?
    console.log('\n=== 8. Recent leads with approved_terms containing "16" (any merchant, stg) ===');
    const r8 = await pool.query(
      `SELECT lat.pk, lat.lead_pk, lat.uw_terms, lat.approved_terms, l.ref_merchant_code, lat.row_created_timestamp
       FROM uown_lead_approval_terms lat
       JOIN uown_los_lead l ON l.pk = lat.lead_pk
       WHERE lat.approved_terms LIKE '%16%'
       ORDER BY lat.pk DESC LIMIT 10`,
    );
    console.table(r8.rows);

    // 9. What version/release is deployed in stg? Check for svc version indicator
    console.log('\n=== 9. Any "R1.52" or "1.52" in recent notes? ===');
    const r9 = await pool.query(
      `SELECT pk, lead_pk, substring(notes from 1 for 300) AS notes
       FROM uown_los_lead_notes WHERE notes ILIKE '%1.52%' ORDER BY pk DESC LIMIT 5`,
    );
    console.table(r9.rows);

  } finally {
    await pool.end();
  }
})();

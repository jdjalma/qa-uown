import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

const cfg = new ConfigEnvironment('stg');
const pool = new pg.Pool({ connectionString: (cfg as any).dbConnectionString, max: 1 });

(async () => {
  try {
    // 0. Check schema of uown_merchant_to_program
    console.log('=== 0. Schema of uown_merchant_to_program ===');
    const schema0 = await pool.query(
      `SELECT column_name, data_type FROM information_schema.columns
       WHERE table_name = 'uown_merchant_to_program' ORDER BY ordinal_position`,
    );
    console.table(schema0.rows);

    // 1. Programs for KS3015 (pk=10138)
    console.log('\n=== 1. Programs for KS3015 (merchant pk=10138) ===');
    const r1 = await pool.query(`SELECT * FROM uown_merchant_to_program WHERE merchant_pk = 10138`);
    console.table(r1.rows);

    // Get program details
    if (r1.rows.length > 0) {
      const progPks = r1.rows.map((r: any) => r.program_pk ?? r.merchant_program_pk).filter(Boolean);
      if (progPks.length > 0) {
        console.log('\n=== 1b. Program details ===');
        const r1b = await pool.query(
          `SELECT pk, program_name, term_months, is_active, allowed_frequency_override
           FROM uown_merchant_program WHERE pk = ANY($1) ORDER BY term_months`,
          [progPks],
        );
        console.table(r1b.rows);
      }
    }

    // 2. All SQL Config in stg (small table, show all)
    console.log('\n=== 2. ALL uown_sv_sql_config ===');
    const r2 = await pool.query(`SELECT pk, sql_name, substring(sql_query from 1 for 100) AS sql_query_preview FROM uown_sv_sql_config ORDER BY sql_name`);
    console.table(r2.rows);

    // 3. Approval Terms for lead 6559574 (A1 - 16m eligible)
    console.log('\n=== 3. Approval Terms lead 6559574 ===');
    const r3 = await pool.query(`SELECT pk, lead_pk, uw_terms, approved_terms FROM uown_lead_approval_terms WHERE lead_pk = '6559574' ORDER BY pk DESC LIMIT 5`);
    console.table(r3.rows);

    // 4. Lead 6559576 (A3 - sendInvoice empty)
    console.log('\n=== 4. Lead 6559576 status ===');
    const r4 = await pool.query(`SELECT pk, lead_uuid, lead_status, merchant_program_pk, ref_merchant_code, customer_state FROM uown_los_lead WHERE pk = '6559576' LIMIT 1`);
    console.table(r4.rows);

    console.log('\n=== 4b. Notes lead 6559576 (last 15) ===');
    const r4b = await pool.query(`SELECT pk, substring(notes from 1 for 300) AS notes FROM uown_los_lead_notes WHERE lead_pk = '6559576' ORDER BY pk DESC LIMIT 15`);
    console.table(r4b.rows);

    // 5. Approval Terms for lead 6559576 (A3 - 13m only)
    console.log('\n=== 5. Approval Terms lead 6559576 ===');
    const r5 = await pool.query(`SELECT pk, lead_pk, uw_terms, approved_terms FROM uown_lead_approval_terms WHERE lead_pk = '6559576' ORDER BY pk DESC LIMIT 5`);
    console.table(r5.rows);

    // 6. ANY lead with LeadProgramService or "After defaulting" log in stg
    console.log('\n=== 6. ANY lead with LeadProgramService log (stg) ===');
    const r6 = await pool.query(`SELECT pk, lead_pk, substring(notes from 1 for 300) AS notes FROM uown_los_lead_notes WHERE notes ILIKE '%LeadProgramService%' ORDER BY pk DESC LIMIT 10`);
    console.table(r6.rows);

    console.log('\n=== 7. ANY lead with "After defaulting to 13,16" (stg) ===');
    const r7 = await pool.query(`SELECT pk, lead_pk, substring(notes from 1 for 300) AS notes FROM uown_los_lead_notes WHERE notes ILIKE '%After defaulting to 13,16%' ORDER BY pk DESC LIMIT 10`);
    console.table(r7.rows);

    // 8. Check BlackBox SSN mock behavior in stg — do we know if suffix 916 works?
    // Check recent KS3015 leads with uw_terms containing "16"
    console.log('\n=== 8. Recent KS3015 leads with uw_terms containing "16" (stg) ===');
    const r8 = await pool.query(
      `SELECT lat.pk, lat.lead_pk, lat.uw_terms, lat.approved_terms, lat.row_created_timestamp
       FROM uown_lead_approval_terms lat
       JOIN uown_los_lead l ON l.pk = lat.lead_pk
       WHERE l.ref_merchant_code = 'KS3015' AND lat.uw_terms LIKE '%16%'
       ORDER BY lat.pk DESC LIMIT 10`,
    );
    console.table(r8.rows);

  } finally {
    await pool.end();
  }
})();

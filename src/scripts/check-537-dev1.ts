import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

const env = process.argv[2] ?? 'dev1';
const cfg = new ConfigEnvironment(env);
const pool = new pg.Pool({ connectionString: (cfg as any).dbConnectionString, max: 1 });

(async () => {
  try {
    // G2: Find the exact key for defaultMonthsWhen16Month
    console.log('\n=== G2: uown_configuration_management — keys matching UnderwritingService / defaultMonths / defaultTo13 ===');
    const r = await pool.query(
      `SELECT pk, key, value, row_created_timestamp, row_updated_timestamp
       FROM uown_configuration_management
       WHERE key ILIKE '%defaultmonths%'
          OR key ILIKE '%defaultto13%'
          OR key ILIKE '%UnderwritingService.default%'
          OR key ILIKE '%LeadProgramService%'
       ORDER BY key`);
    console.log(JSON.stringify(r.rows, null, 2));

    // G2 bonus: number.of.payments.16 in dev1?
    console.log('\n=== number.of.payments.16.* in dev1 ===');
    const nop = await pool.query(
      `SELECT pk, key, value FROM uown_configuration_management
       WHERE key ILIKE 'number.of.payments.16%' ORDER BY key`);
    console.log(JSON.stringify(nop.rows, null, 2));

    // G3: Find leads with eligible_terms=16 in dev1
    console.log('\n=== Recent leads with eligible_terms containing 16 (dev1) ===');
    const uw = await pool.query(
      `SELECT uwd.pk, uwd.lead_pk, uwd.eligible_terms, uwd.is_eligible_for_extra_info,
              uwd.uw_approval_amount, uwd.row_created_timestamp
       FROM uown_los_uwdata uwd
       WHERE uwd.eligible_terms ILIKE '%16%'
       ORDER BY uwd.pk DESC LIMIT 5`);
    console.log(JSON.stringify(uw.rows, null, 2));

    if (uw.rows.length > 0) {
      const leadPk = uw.rows[0].lead_pk;
      console.log(`\n=== G3: Checking logs for lead ${leadPk} ===`);

      // Check uown_los_lead_notes (table)
      console.log(`\n--- uown_los_lead_notes for lead ${leadPk} (last 15) ---`);
      const ln = await pool.query(
        `SELECT pk, lead_pk, notes, row_created_timestamp
         FROM uown_los_lead_notes WHERE lead_pk = $1
         ORDER BY pk DESC LIMIT 15`, [leadPk]);
      console.log(JSON.stringify(ln.rows, null, 2));

      // Check if ANY lead_notes has LeadProgramService text
      console.log(`\n--- ANY uown_los_lead_notes with 'LeadProgramService' or 'defaulting to' ---`);
      const lps = await pool.query(
        `SELECT pk, lead_pk, substring(notes from 1 for 300) AS notes_preview, row_created_timestamp
         FROM uown_los_lead_notes
         WHERE notes ILIKE '%LeadProgramService%' OR notes ILIKE '%defaulting to%'
         ORDER BY pk DESC LIMIT 10`);
      console.log(JSON.stringify(lps.rows, null, 2));

      // Check uown_los_lead.notes column
      console.log(`\n--- uown_los_lead.notes (column) for lead ${leadPk} ---`);
      const col = await pool.query(
        `SELECT pk, substring(notes from 1 for 3000) AS notes_text, octet_length(notes) AS notes_size
         FROM uown_los_lead WHERE pk = $1`, [leadPk]);
      console.log(JSON.stringify(col.rows, null, 2));

      // Check approval_terms
      console.log(`\n--- uown_lead_approval_terms for lead ${leadPk} ---`);
      const at = await pool.query(
        `SELECT * FROM uown_lead_approval_terms WHERE lead_pk = $1 ORDER BY pk DESC`, [leadPk]);
      console.log(JSON.stringify(at.rows, null, 2));
    }

    // Broader search: ANY lead where notes column has LeadProgramService
    console.log('\n=== Broader: ANY uown_los_lead with notes containing LeadProgramService ===');
    const broad = await pool.query(
      `SELECT pk, substring(notes from 1 for 500) AS notes_preview, octet_length(notes) AS notes_size
       FROM uown_los_lead
       WHERE notes ILIKE '%LeadProgramService%'
       ORDER BY pk DESC LIMIT 5`);
    console.log(JSON.stringify(broad.rows, null, 2));

  } catch (e: any) { console.error('ERR:', e.message); }
  await pool.end();
})();

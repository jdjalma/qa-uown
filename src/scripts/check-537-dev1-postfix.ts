import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

const cfg = new ConfigEnvironment('dev1');
const pool = new pg.Pool({ connectionString: (cfg as any).dbConnectionString, max: 1 });

(async () => {
  try {
    // Lead 1273 (eligible_terms="13,16") — logs
    console.log('=== Lead 1273 (eligible_terms="13,16") — LeadProgramService logs ===');
    const l1273 = await pool.query(
      `SELECT pk, substring(notes from 1 for 300) AS notes, row_created_timestamp
       FROM uown_los_lead_notes WHERE lead_pk = 1273
         AND (notes ILIKE '%LeadProgramService%' OR notes ILIKE '%defaulting%' OR notes ILIKE '%EligibleTerms%')
       ORDER BY pk`);
    console.table(l1273.rows);

    // ANY lead with "After defaulting to 13,16 terms are : 13,16" (the FIX pattern for 16m eligible)
    console.log('\n=== ANY lead with "After defaulting to 13,16 terms are : 13,16" (fix confirmation) ===');
    const fix = await pool.query(
      `SELECT pk, lead_pk, substring(notes from 1 for 300) AS notes, row_created_timestamp
       FROM uown_los_lead_notes
       WHERE notes ILIKE '%After defaulting to 13,16 terms are : 13,16%'
       ORDER BY pk DESC LIMIT 10`);
    console.table(fix.rows);

    // Leads created after 2026-05-20 with eligible_terms containing 16
    console.log('\n=== Leads created after 2026-05-20 with eligible_terms containing 16 ===');
    const recent = await pool.query(
      `SELECT uwd.lead_pk, uwd.eligible_terms, uwd.is_eligible_for_extra_info, uwd.row_created_timestamp
       FROM uown_los_uwdata uwd
       WHERE uwd.eligible_terms ILIKE '%16%'
         AND uwd.row_created_timestamp > '2026-05-20'
       ORDER BY uwd.pk DESC LIMIT 5`);
    console.table(recent.rows);

    // If any found, check their logs
    if (recent.rows.length > 0) {
      for (const row of recent.rows.slice(0, 2)) {
        console.log(`\n=== Logs for lead ${row.lead_pk} (EligibleTerms=${row.eligible_terms}) ===`);
        const logs = await pool.query(
          `SELECT pk, substring(notes from 1 for 300) AS notes
           FROM uown_los_lead_notes WHERE lead_pk = $1
             AND (notes ILIKE '%LeadProgramService%' OR notes ILIKE '%defaulting%')
           ORDER BY pk`, [row.lead_pk]);
        console.table(logs.rows);
      }
    }
  } catch (e: any) { console.error('ERR:', e.message); }
  await pool.end();
})();

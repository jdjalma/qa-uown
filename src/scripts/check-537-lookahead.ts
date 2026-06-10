import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

const cfg = new ConfigEnvironment('qa1');
const pool = new pg.Pool({ connectionString: (cfg as any).dbConnectionString, max: 1 });

(async () => {
  try {
    console.log('=== Leads with is_eligible_for_extra_info=true in qa1 ===');
    const r = await pool.query(
      `SELECT uwd.lead_pk, uwd.eligible_terms, uwd.is_eligible_for_extra_info,
              uwd.uw_approval_amount, uwd.row_created_timestamp
       FROM uown_los_uwdata uwd
       WHERE uwd.is_eligible_for_extra_info = true
       ORDER BY uwd.pk DESC LIMIT 10`);
    console.table(r.rows);

    if (r.rows.length > 0) {
      const leadPk = r.rows[0].lead_pk;
      console.log(`\n=== Logs for lookahead lead ${leadPk} ===`);
      const logs = await pool.query(
        `SELECT pk, substring(notes from 1 for 300) AS notes
         FROM uown_los_lead_notes WHERE lead_pk = $1
           AND (notes ILIKE '%LeadProgramService%' OR notes ILIKE '%IsEligibleForExtraInfo%')
         ORDER BY pk`, [leadPk]);
      console.table(logs.rows);

      console.log(`\n=== approval_terms for lead ${leadPk} ===`);
      const at = await pool.query(
        `SELECT * FROM uown_lead_approval_terms WHERE lead_pk = $1 ORDER BY pk DESC`, [leadPk]);
      console.log(JSON.stringify(at.rows, null, 2));
    }
  } catch (e: any) { console.error(e.message); }
  await pool.end();
})();

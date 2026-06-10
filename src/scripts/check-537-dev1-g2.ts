import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

const cfg = new ConfigEnvironment('dev1');
const pool = new pg.Pool({ connectionString: (cfg as any).dbConnectionString, max: 1 });

(async () => {
  try {
    // G2: Config keys
    console.log('=== G2: config keys matching UnderwritingService/defaultMonths/defaultTo13 ===');
    const r = await pool.query(
      `SELECT pk, key, value FROM uown_configuration_management
       WHERE key ILIKE '%defaultmonths%' OR key ILIKE '%defaultto13%'
          OR key ILIKE '%UnderwritingService.default%' OR key ILIKE '%LeadProgramService%'
       ORDER BY key`);
    console.table(r.rows);

    // G3: Lead with EligibleTerms=16 + check its logs
    console.log('\n=== Leads with eligible_terms=16 in dev1 ===');
    const uw16 = await pool.query(
      `SELECT uwd.lead_pk, uwd.eligible_terms, uwd.is_eligible_for_extra_info
       FROM uown_los_uwdata uwd WHERE uwd.eligible_terms ILIKE '%16%'
       ORDER BY uwd.pk DESC LIMIT 5`);
    console.table(uw16.rows);

    if (uw16.rows.length > 0) {
      const leadPk = uw16.rows[0].lead_pk;
      console.log(`\n=== LeadProgramService logs for 16m lead ${leadPk} ===`);
      const logs = await pool.query(
        `SELECT pk, substring(notes from 1 for 250) AS notes, row_created_timestamp
         FROM uown_los_lead_notes WHERE lead_pk = $1
           AND notes ILIKE '%LeadProgramService%'
         ORDER BY pk`, [leadPk]);
      console.table(logs.rows);
    }

    // Confirm: does uown_los_lead have 'notes' column in dev1?
    console.log('\n=== uown_los_lead columns with "note" ===');
    const cols = await pool.query(
      `SELECT column_name, data_type FROM information_schema.columns
       WHERE table_name = 'uown_los_lead' AND column_name ILIKE '%note%'`);
    console.table(cols.rows);

  } catch (e: any) { console.error('ERR:', e.message); }
  await pool.end();
})();

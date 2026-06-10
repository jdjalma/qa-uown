import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

const cfg = new ConfigEnvironment('qa1');
const pool = new pg.Pool({ connectionString: (cfg as any).dbConnectionString, max: 1 });

(async () => {
  try {
    // Re-check lead 11907 specifically for LeadProgramService entries (lower pks, earlier in lifecycle)
    console.log('=== qa1 lead 11907 — ALL LeadProgramService / defaulting logs ===');
    const r = await pool.query(
      `SELECT pk, substring(notes from 1 for 300) AS notes, row_created_timestamp
       FROM uown_los_lead_notes WHERE lead_pk = 11907
         AND (notes ILIKE '%LeadProgramService%' OR notes ILIKE '%defaulting%' OR notes ILIKE '%EligibleTerms%')
       ORDER BY pk`);
    console.table(r.rows);

    // Also check: does qa1 uown_los_lead have 'notes' column?
    console.log('\n=== qa1 uown_los_lead columns with "note" ===');
    const cols = await pool.query(
      `SELECT column_name, data_type FROM information_schema.columns
       WHERE table_name = 'uown_los_lead' AND column_name ILIKE '%note%'`);
    console.table(cols.rows);

    // ANY lead in qa1 with "After defaulting to 13,16 terms are : 13,16"
    console.log('\n=== qa1: ANY lead with "After defaulting to 13,16 terms are : 13,16" ===');
    const fix = await pool.query(
      `SELECT pk, lead_pk, substring(notes from 1 for 300) AS notes, row_created_timestamp
       FROM uown_los_lead_notes
       WHERE notes ILIKE '%After defaulting to 13,16 terms are : 13,16%'
       ORDER BY pk DESC LIMIT 5`);
    console.table(fix.rows);
  } catch (e: any) { console.error('ERR:', e.message); }
  await pool.end();
})();

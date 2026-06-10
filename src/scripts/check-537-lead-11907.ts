import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

const env = process.argv[2] ?? 'qa1';
const cfg = new ConfigEnvironment(env);
const pool = new pg.Pool({ connectionString: (cfg as any).dbConnectionString, max: 1 });

(async () => {
  try {
    console.log('\n=== uown_los_lead columns relevant to notes ===');
    const cols = await pool.query(
      `SELECT column_name, data_type FROM information_schema.columns
       WHERE table_name = 'uown_los_lead' AND (column_name ILIKE '%note%' OR column_name = 'pk')
       ORDER BY ordinal_position`);
    console.table(cols.rows);

    console.log('\n=== Lead 11907 — full state ===');
    const lead = await pool.query(
      `SELECT pk, lead_status, merchant_pk, merchant_program_pk,
              substring(notes from 1 for 5000) AS notes_text,
              octet_length(notes) AS notes_size
       FROM uown_los_lead WHERE pk = 11907`);
    console.log(JSON.stringify(lead.rows, null, 2));

    console.log('\n=== Lead 11907 — uw_data ===');
    const uw = await pool.query(
      `SELECT pk, eligible_terms, is_eligible_for_extra_info, uw_approval_amount, approval_amount
       FROM uown_los_uwdata WHERE lead_pk = 11907`);
    console.log(JSON.stringify(uw.rows, null, 2));

    console.log('\n=== Lead 11907 — sched_summary (all PaymentOptions) ===');
    const ss = await pool.query(
      `SELECT pk, plan_id, term_in_months, payment_frequency, total_number_of_payments
       FROM uown_los_sched_summary WHERE lead_pk = 11907 ORDER BY pk`);
    console.table(ss.rows);

    console.log('\n=== Lead 11907 — approval_terms row ===');
    const at = await pool.query(
      `SELECT * FROM uown_lead_approval_terms WHERE lead_pk = 11907`);
    console.log(JSON.stringify(at.rows, null, 2));

    console.log('\n=== uown_los_lead_notes for lead 11907 (separate table) ===');
    const ln = await pool.query(
      `SELECT pk, lead_pk, notes, row_created_timestamp, agent
       FROM uown_los_lead_notes WHERE lead_pk = 11907 ORDER BY pk DESC LIMIT 10`);
    console.log(JSON.stringify(ln.rows, null, 2));
  } catch (e: any) { console.error('ERR:', e.message); }
  await pool.end();
})();

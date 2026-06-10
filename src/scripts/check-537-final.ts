import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

const env = process.argv[2] ?? 'qa1';
const cfg = new ConfigEnvironment(env);
const pool = new pg.Pool({ connectionString: (cfg as any).dbConnectionString, max: 1 });

(async () => {
  try {
    console.log('\n=== uown_configuration_management columns ===');
    const cols = await pool.query(
      `SELECT column_name, data_type FROM information_schema.columns
       WHERE table_name = 'uown_configuration_management' ORDER BY ordinal_position`);
    console.table(cols.rows);

    console.log('\n=== sample rows ===');
    const sample = await pool.query(`SELECT * FROM uown_configuration_management LIMIT 3`);
    console.log(JSON.stringify(sample.rows, null, 2));

    console.log('\n=== rows for #537 + #477 + getNumberOfPayments configs ===');
    const r = await pool.query(
      `SELECT *
       FROM uown_configuration_management
       WHERE LOWER(name) LIKE '%defaultmonthswhen16%'
          OR LOWER(name) LIKE '%defaultto13%'
          OR LOWER(name) LIKE 'number.of.payments.16%'
          OR LOWER(name) LIKE 'number.of.payments.13%'
       ORDER BY name`);
    console.log(JSON.stringify(r.rows, null, 2));

    console.log('\n=== Lead 11932 — uw_data + notes (the most recent 16m lead in qa1) ===');
    const lead = await pool.query(
      `SELECT l.pk, l.lead_status, l.merchant_pk, l.merchant_program_pk, l.notes
       FROM uown_los_lead l WHERE l.pk = 11932`);
    console.log(JSON.stringify(lead.rows, null, 2));

    console.log('\n=== Same lead — approval_terms + sched_summary ===');
    const at = await pool.query(
      `SELECT * FROM uown_lead_approval_terms WHERE lead_pk = 11932`);
    console.log('approval_terms:', JSON.stringify(at.rows, null, 2));

    const ss = await pool.query(
      `SELECT pk, plan_id, term_in_months, payment_frequency, total_number_of_payments, redirect_url
       FROM uown_los_sched_summary WHERE lead_pk = 11932 ORDER BY pk`);
    console.log('sched_summary:', JSON.stringify(ss.rows, null, 2));

    console.log('\n=== Merchant of lead 11932 ===');
    const m = await pool.query(
      `SELECT m.pk, m.merchant_name, m.ref_merchant_code, m.location_name
       FROM uown_merchant m
       JOIN uown_los_lead l ON l.merchant_pk = m.pk
       WHERE l.pk = 11932`);
    console.log(JSON.stringify(m.rows, null, 2));
  } catch (e: any) { console.error('ERR:', e.message); }
  await pool.end();
})();

import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

const env = process.argv[2] ?? 'qa1';
const cfg = new ConfigEnvironment(env);
const pool = new pg.Pool({ connectionString: (cfg as any).dbConnectionString, max: 1 });

(async () => {
  try {
    console.log('\n=== uown_configuration_management — 16m + UnderwritingService keys ===');
    const r = await pool.query(
      `SELECT pk, key, value, row_updated_timestamp
       FROM uown_configuration_management
       WHERE key ILIKE '%defaultmonthswhen16%'
          OR key ILIKE '%defaultto13%'
          OR key ILIKE 'number.of.payments.16%'
          OR key ILIKE '%UnderwritingService.default%'
       ORDER BY key`);
    console.log(JSON.stringify(r.rows, null, 2));

    console.log('\n=== Lead 11932 details ===');
    const lead = await pool.query(
      `SELECT l.pk, l.lead_status, l.merchant_pk, l.merchant_program_pk,
              substring(l.notes from 1 for 3000) AS notes_preview
       FROM uown_los_lead l WHERE l.pk = 11932`);
    console.log(JSON.stringify(lead.rows, null, 2));

    console.log('\n=== Lead 11932 — sched_summary entries (term diversity) ===');
    const ss = await pool.query(
      `SELECT pk, plan_id, term_in_months, payment_frequency, total_number_of_payments
       FROM uown_los_sched_summary WHERE lead_pk = 11932 ORDER BY pk`);
    console.table(ss.rows);

    console.log('\n=== Merchant of lead 11932 ===');
    const m = await pool.query(
      `SELECT m.pk, m.merchant_name, m.ref_merchant_code, m.location_name
       FROM uown_merchant m JOIN uown_los_lead l ON l.merchant_pk = m.pk
       WHERE l.pk = 11932`);
    console.log(JSON.stringify(m.rows, null, 2));

    console.log('\n=== Recent leads that hit the fix (uw_terms=16 but approved_terms=13,16) ===');
    const fix = await pool.query(
      `SELECT lat.lead_pk, lat.uw_terms, lat.merchant_terms, lat.approved_terms,
              lat.row_created_timestamp, l.merchant_program_pk, m.ref_merchant_code
       FROM uown_lead_approval_terms lat
       JOIN uown_los_lead l ON l.pk = lat.lead_pk
       JOIN uown_merchant m ON m.pk = l.merchant_pk
       WHERE lat.uw_terms = '16' AND lat.approved_terms = '13,16'
       ORDER BY lat.pk DESC LIMIT 10`);
    console.table(fix.rows);
  } catch (e: any) { console.error('ERR:', e.message); }
  await pool.end();
})();

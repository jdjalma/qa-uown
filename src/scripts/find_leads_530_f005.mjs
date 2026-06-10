import pg from 'pg';
import 'dotenv/config';
const conn = process.env.UOWN_DB_URL_QA1.replace('jdbc:', '');
const url = new URL(conn);
const pool = new pg.Pool({
  host: url.hostname, port: Number(url.port),
  database: url.pathname.slice(1),
  user: process.env.UOWN_DB_USER_QA1, password: process.env.UOWN_DB_PASS_QA1,
});
async function q(label, sql) {
  console.log('\n=== ' + label + ' ===');
  try { const r = await pool.query(sql); console.log(JSON.stringify(r.rows, null, 2)); }
  catch (e) { console.log('ERR:', e.message); }
}

await q('A. SIGNED SEMI_MONTHLY 13 (any merchant)', `
  SELECT l.pk AS lead_pk, m.ref_merchant_code, m.merchant_name, ss.payment_frequency, ss.term_in_months, ss.next_payment_due_date, l.row_updated_timestamp
  FROM uown_los_lead l JOIN uown_merchant m ON l.merchant_pk=m.pk
  JOIN uown_los_sched_summary ss ON ss.lead_pk=l.pk
  WHERE l.lead_status='SIGNED' AND ss.payment_frequency='SEMI_MONTHLY' AND ss.term_in_months=13
  ORDER BY l.row_updated_timestamp DESC LIMIT 10
`);

await q('SIGNED MONTHLY 13', `
  SELECT l.pk AS lead_pk, m.ref_merchant_code, m.merchant_name, ss.payment_frequency, ss.term_in_months, ss.next_payment_due_date, l.row_updated_timestamp
  FROM uown_los_lead l JOIN uown_merchant m ON l.merchant_pk=m.pk
  JOIN uown_los_sched_summary ss ON ss.lead_pk=l.pk
  WHERE l.lead_status='SIGNED' AND ss.payment_frequency='MONTHLY' AND ss.term_in_months=13
  ORDER BY l.row_updated_timestamp DESC LIMIT 5
`);

await q('SIGNED BI_WEEKLY 13', `
  SELECT l.pk AS lead_pk, m.ref_merchant_code, m.merchant_name, ss.payment_frequency, ss.term_in_months, ss.next_payment_due_date, l.row_updated_timestamp
  FROM uown_los_lead l JOIN uown_merchant m ON l.merchant_pk=m.pk
  JOIN uown_los_sched_summary ss ON ss.lead_pk=l.pk
  WHERE l.lead_status='SIGNED' AND ss.payment_frequency='BI_WEEKLY' AND ss.term_in_months=13
  ORDER BY l.row_updated_timestamp DESC LIMIT 5
`);

await q('SIGNED WEEKLY 13 UOWN (non-KS)', `
  SELECT l.pk AS lead_pk, m.ref_merchant_code, m.merchant_name, ss.payment_frequency, ss.term_in_months, ss.next_payment_due_date, l.row_updated_timestamp
  FROM uown_los_lead l JOIN uown_merchant m ON l.merchant_pk=m.pk
  JOIN uown_los_sched_summary ss ON ss.lead_pk=l.pk
  WHERE l.lead_status='SIGNED' AND ss.payment_frequency='WEEKLY' AND ss.term_in_months=13
    AND m.ref_merchant_code != 'KS3015'
  ORDER BY l.row_updated_timestamp DESC LIMIT 5
`);

await q('Top SIGNED merchants (last 24h)', `
  SELECT m.ref_merchant_code, m.merchant_name, COUNT(*)
  FROM uown_los_lead l JOIN uown_merchant m ON l.merchant_pk=m.pk
  WHERE l.lead_status='SIGNED' AND l.row_updated_timestamp > NOW() - INTERVAL '24 hours'
  GROUP BY 1,2 ORDER BY 3 DESC LIMIT 10
`);

await q('UOWN SIGNED w/ NPD POPULATED (svc#530 happy-path)', `
  SELECT l.pk AS lead_pk, m.ref_merchant_code, m.merchant_name, ss.payment_frequency, ss.term_in_months, ss.next_payment_due_date, l.row_updated_timestamp
  FROM uown_los_lead l JOIN uown_merchant m ON l.merchant_pk=m.pk
  JOIN uown_los_sched_summary ss ON ss.lead_pk=l.pk
  WHERE l.lead_status='SIGNED' AND ss.next_payment_due_date IS NOT NULL
    AND m.ref_merchant_code != 'KS3015'
  ORDER BY l.row_updated_timestamp DESC LIMIT 5
`);

await pool.end();

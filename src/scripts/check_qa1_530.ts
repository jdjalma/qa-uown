import { Pool } from 'pg';
const pool = new Pool({ host: '127.0.0.1', port: 5445, user: 'svc_user', password: 'F1ntech', database: 'svc' });
(async () => {
  // 1. SIGNED leads with null next_payment_due_date
  const q1 = await pool.query(`
    SELECT l.pk as lead_pk, l.lead_status, s.next_payment_due_date, s.first_payment_due_date, s.plan_id, s.payment_frequency, l.row_created_timestamp::date
    FROM uown_los_lead l
    LEFT JOIN uown_los_sched_summary s ON s.lead_pk = l.pk
    WHERE l.lead_status = 'SIGNED' AND s.next_payment_due_date IS NULL
    ORDER BY l.row_created_timestamp DESC LIMIT 15`);
  console.log('--- SIGNED leads with null next_payment_due_date ---');
  console.table(q1.rows);

  // 2. Lead 11366 / 11396 status NOW
  const q2 = await pool.query(`
    SELECT l.pk, l.lead_status, l.account_pk, s.next_payment_due_date, s.first_payment_due_date, s.plan_id
    FROM uown_los_lead l
    LEFT JOIN uown_los_sched_summary s ON s.lead_pk = l.pk
    WHERE l.pk IN (11366, 11396)`);
  console.log('--- Leads 11366 / 11396 current state ---');
  console.table(q2.rows);

  // 3. Recent settleApplication 500s (uown_los_inbound_api_log)
  const q3 = await pool.query(`
    SELECT pk, request_url, response_status, row_created_timestamp::date as day
    FROM uown_los_inbound_api_log
    WHERE request_url ILIKE '%settle%' AND response_status >= 500
    ORDER BY row_created_timestamp DESC LIMIT 10`);
  console.log('--- Recent settle 500s ---');
  console.table(q3.rows);

  // 4. employment for leads 11366/11396
  const q4 = await pool.query(`
    SELECT e.lead_pk, e.next_pay_date, e.last_pay_date, e.pay_frequency
    FROM uown_los_employment e
    WHERE e.lead_pk IN (11366, 11396)`);
  console.log('--- Employment for 11366/11396 ---');
  console.table(q4.rows);

  await pool.end();
})().catch(e => { console.error(e); process.exit(1); });

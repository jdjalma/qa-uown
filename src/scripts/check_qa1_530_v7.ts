import { Pool } from 'pg';
const pool = new Pool({ host: '127.0.0.1', port: 5445, user: 'svc_user', password: 'F1ntech', database: 'svc' });
(async () => {
  // FUNDED leads in same window — does sched_summary have NPD populated?
  const ok = await pool.query(`
    SELECT l.pk, l.lead_status, l.account_pk, s.next_payment_due_date, s.first_payment_due_date, s.plan_id, l.row_created_timestamp::date as day
    FROM uown_los_lead l
    LEFT JOIN uown_los_sched_summary s ON s.lead_pk = l.pk
    WHERE l.lead_status IN ('FUNDED','READY_TO_FUND','FUNDING')
      AND l.row_created_timestamp >= '2026-05-10'
    ORDER BY l.row_created_timestamp DESC LIMIT 10`);
  console.log('--- Recent FUNDED leads (next_payment_due_date populated?) ---');
  console.table(ok.rows);

  // count
  const c1 = await pool.query(`SELECT lead_status, COUNT(*) FROM uown_los_lead WHERE row_created_timestamp >= '2026-05-15' GROUP BY lead_status`);
  console.log('--- Leads by status since 2026-05-15 ---');
  console.table(c1.rows);

  await pool.end();
})().catch(e => { console.error(e.message); process.exit(1); });

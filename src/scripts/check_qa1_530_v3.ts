import { Pool } from 'pg';
const pool = new Pool({ host: '127.0.0.1', port: 5445, user: 'svc_user', password: 'F1ntech', database: 'svc' });
(async () => {
  const cols = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name='uown_los_employment' ORDER BY ordinal_position`);
  console.log('employment cols:', cols.rows.map(r=>r.column_name).join(', '));

  const q = await pool.query(`
    SELECT lead_pk, next_pay_date, last_pay_date, pay_frequency
    FROM uown_los_employment
    WHERE lead_pk IN (11719, 11416, 11415, 11411, 11396, 11366, 11382)
    ORDER BY lead_pk`);
  console.log('--- Employment ---');
  console.table(q.rows);

  // Inbound calls for 11719
  const log = await pool.query(`
    SELECT pk, api, url, call_type, row_created_timestamp,
           LEFT(request, 600) as req_sample,
           LEFT(response, 300) as resp_sample
    FROM uown_los_inbound_api_log
    WHERE return_uuid IN (SELECT uuid FROM uown_los_lead WHERE pk=11719)
       OR request ILIKE '%11719%'
       OR source_uuid IN (SELECT uuid FROM uown_los_lead WHERE pk=11719)
    ORDER BY pk LIMIT 20`);
  console.log('--- Inbound for 11719 ---');
  for (const r of log.rows) console.log(`pk=${r.pk} api=${r.api} url=${r.url} call_type=${r.call_type} ts=${r.row_created_timestamp}\n  req=${r.req_sample?.slice(0,400)}\n`);

  // Status for that lead
  const lead = await pool.query(`SELECT uuid, lead_status, account_pk FROM uown_los_lead WHERE pk=11719`);
  console.log('lead 11719:', lead.rows[0]);

  await pool.end();
})().catch(e => { console.error(e.message); process.exit(1); });

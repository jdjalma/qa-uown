import { Pool } from 'pg';
const pool = new Pool({ host: '127.0.0.1', port: 5445, user: 'svc_user', password: 'F1ntech', database: 'svc' });
(async () => {
  // Columns of uown_los_inbound_api_log
  const cols = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name='uown_los_inbound_api_log' ORDER BY ordinal_position`);
  console.log('--- uown_los_inbound_api_log columns ---');
  console.log(cols.rows.map(r => r.column_name).join(', '));

  // Employment for the bug leads
  const q = await pool.query(`
    SELECT e.lead_pk, e.next_pay_date, e.last_pay_date, e.pay_frequency, e.employer_name
    FROM uown_los_employment e
    WHERE e.lead_pk IN (11719, 11416, 11415, 11411, 11396, 11366, 11382)
    ORDER BY e.lead_pk`);
  console.log('--- Employment for bug leads ---');
  console.table(q.rows);

  // Inbound api log for lead 11719 (most recent)
  const log = await pool.query(`
    SELECT * FROM uown_los_inbound_api_log
    WHERE row_created_timestamp::date >= '2026-05-22'
    AND (request ILIKE '%11719%' OR response ILIKE '%11719%')
    ORDER BY pk DESC LIMIT 5`);
  console.log('--- Inbound API log mentioning 11719 ---');
  console.log(JSON.stringify(log.rows.map(r => ({pk: r.pk, ts: r.row_created_timestamp, sample: JSON.stringify(r).slice(0,400)})), null, 2));

  // Notes for lead 11719 to understand path
  const notes = await pool.query(`
    SELECT pk, notes, row_created_timestamp
    FROM uown_los_lead_notes
    WHERE lead_pk = 11719 ORDER BY pk`);
  console.log('--- Notes for lead 11719 ---');
  console.table(notes.rows.map(r => ({pk: r.pk, ts: r.row_created_timestamp, note: (r.notes||'').slice(0,100)})));

  await pool.end();
})().catch(e => { console.error(e.message); process.exit(1); });

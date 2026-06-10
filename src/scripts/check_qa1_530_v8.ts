import { Pool } from 'pg';
const pool = new Pool({ host: '127.0.0.1', port: 5445, user: 'svc_user', password: 'F1ntech', database: 'svc' });
(async () => {
  // Compare 11719 vs 11735 (FUNDED) sched_summary updated_timestamp pattern
  const cmp = await pool.query(`
    SELECT s.lead_pk, l.lead_status, s.first_payment_due_date, s.next_payment_due_date, s.row_created_timestamp, s.row_updated_timestamp
    FROM uown_los_sched_summary s
    JOIN uown_los_lead l ON l.pk=s.lead_pk
    WHERE s.lead_pk IN (11719, 11735, 11733)`);
  console.table(cmp.rows);

  // Notes for 11735 (FUNDED) - what was diff at sched_summary creation time?
  const notes735 = await pool.query(`
    SELECT pk, LEFT(notes,150) note FROM uown_los_lead_notes WHERE lead_pk=11735 AND notes ILIKE '%SchedSummary%' OR notes ILIKE '%schedSummary%' OR notes ILIKE '%next_payment_due%' ORDER BY pk LIMIT 10`);
  console.log('11735 SchedSummary notes:');
  for (const n of notes735.rows) console.log(`  pk=${n.pk}: ${n.note}`);

  // submitApplication body for 11735
  const sub735 = await pool.query(`
    SELECT LEFT(request,700) req FROM uown_los_inbound_api_log WHERE url ILIKE '%submitApplication%' AND request ILIKE '%"leadPk":11735%' ORDER BY pk DESC LIMIT 1`);
  console.log('11735 submit:', sub735.rows[0]?.req);

  // 11735 sendApplication body — get NPD
  const send735 = await pool.query(`
    SELECT LEFT(request, 1500) req FROM uown_los_inbound_api_log WHERE url ILIKE '%sendApplication%' AND response ILIKE '%pk = 11735%' ORDER BY pk DESC LIMIT 1`);
  console.log('11735 sendApp req:', send735.rows[0]?.req);

  await pool.end();
})().catch(e => { console.error(e.message); process.exit(1); });

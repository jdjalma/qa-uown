import { Pool } from 'pg';
const pool = new Pool({ host: '127.0.0.1', port: 5445, user: 'svc_user', password: 'F1ntech', database: 'svc' });
(async () => {
  // Find sendApplication for 11719
  const lead = await pool.query(`SELECT uuid FROM uown_los_lead WHERE pk=11719`);
  const uuid = lead.rows[0].uuid;
  console.log('11719 uuid:', uuid);

  const sendApp = await pool.query(`
    SELECT pk, api, url, row_created_timestamp,
           request, response
    FROM uown_los_inbound_api_log
    WHERE return_uuid = $1 AND url ILIKE '%sendApplication%'
    ORDER BY pk DESC LIMIT 1`, [uuid]);
  if (sendApp.rows.length) {
    console.log('--- sendApplication for 11719 ---');
    console.log('REQUEST:', sendApp.rows[0].request);
    console.log('---');
    console.log('RESPONSE:', String(sendApp.rows[0].response).slice(0,500));
  } else {
    console.log('No sendApplication via return_uuid; searching by content...');
    const alt = await pool.query(`
      SELECT pk, api, url, row_created_timestamp, request, response
      FROM uown_los_inbound_api_log
      WHERE url ILIKE '%sendApplication%'
        AND row_created_timestamp::date = '2026-05-22'
        AND (response ILIKE '%11719%' OR response ILIKE '%${uuid}%')
      ORDER BY pk DESC LIMIT 3`);
    for (const r of alt.rows) {
      console.log(`pk=${r.pk} ts=${r.row_created_timestamp}`);
      console.log('REQ:', String(r.request).slice(0,2000));
      console.log('RESP:', String(r.response).slice(0,400));
    }
  }

  // Now check sched_summary creation for 11719 - when was it created?
  const sched = await pool.query(`
    SELECT pk, row_created_timestamp, row_updated_timestamp, next_payment_due_date, first_payment_due_date, plan_id, payment_frequency, term_in_months
    FROM uown_los_sched_summary WHERE lead_pk=11719`);
  console.log('--- sched_summary ---');
  console.table(sched.rows);

  // Notes timeline
  const notes = await pool.query(`
    SELECT pk, row_created_timestamp, LEFT(notes, 150) as note_preview
    FROM uown_los_lead_notes WHERE lead_pk=11719 ORDER BY pk LIMIT 30`);
  console.log('--- Notes timeline ---');
  for (const n of notes.rows) console.log(`pk=${n.pk} ts=${n.row_created_timestamp} :: ${n.note_preview}`);

  await pool.end();
})().catch(e => { console.error(e.message); process.exit(1); });

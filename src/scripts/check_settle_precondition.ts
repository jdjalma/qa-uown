import { Pool } from 'pg';
const pool = new Pool({ host: '127.0.0.1', port: 5445, user: 'svc_user', password: 'F1ntech', database: 'svc' });
(async () => {
  // Among recently FUNDED leads (settle succeeded), how many had documents (gowsign templates) ?
  const r1 = await pool.query(`
    SELECT l.pk, l.lead_status, l.account_pk, s.plan_id, s.payment_frequency,
           s.next_payment_due_date::text AS npd, l.row_created_timestamp::date
    FROM uown_los_lead l
    LEFT JOIN uown_los_sched_summary s ON s.lead_pk = l.pk
    WHERE l.lead_status IN ('SETTLED','FUNDED') AND l.row_created_timestamp >= NOW() - INTERVAL '7 days'
    ORDER BY l.row_created_timestamp DESC LIMIT 10`);
  console.log('--- Recent SETTLED/FUNDED ---'); console.table(r1.rows);

  // Lead 11366 / 11396 — historical pre-fix
  const r2 = await pool.query(`
    SELECT l.pk, l.lead_status, l.account_pk, s.next_payment_due_date::text AS npd, s.plan_id
    FROM uown_los_lead l
    LEFT JOIN uown_los_sched_summary s ON s.lead_pk = l.pk
    WHERE l.pk IN (11366, 11396)`);
  console.log('--- Leads 11366/11396 NOW ---'); console.table(r2.rows);

  // Distribution of activity log signature "termnull" indicates the bug
  const r3 = await pool.query(`
    SELECT COUNT(*) AS termnull_count
    FROM uown_los_lead_notes
    WHERE notes LIKE '%termnull%' AND row_created_timestamp >= NOW() - INTERVAL '7 days'`);
  console.log('--- termnull occurrences (last 7d) ---'); console.table(r3.rows);

  // Check the gowsign event log for the lead 11739 if any
  for (const tbl of ['uown_gow_sign_signing_event','uown_gowsign_event','uown_los_signing_event','uown_los_signing']) {
    try {
      const r = await pool.query(`SELECT pk, lead_pk, event_type, row_created_timestamp::text FROM ${tbl} WHERE lead_pk = 11739 ORDER BY pk DESC LIMIT 5`);
      console.log(`--- ${tbl} for 11739 (${r.rows.length}) ---`); if (r.rows.length) console.table(r.rows);
    } catch (e: any) { console.log(`${tbl}: ${e.message}`); }
  }

  // Look for any document-like tables
  const r4 = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND (table_name LIKE '%document%' OR table_name LIKE '%esign%' OR table_name LIKE '%sign%') ORDER BY table_name`);
  console.log('--- document/esign tables ---'); console.table(r4.rows);

  await pool.end();
})().catch(e => { console.error(e); process.exit(1); });

import { Pool } from 'pg';
const pool = new Pool({ host: '127.0.0.1', port: 5445, user: 'svc_user', password: 'F1ntech', database: 'svc' });
(async () => {
  const lead = await pool.query(`SELECT pk, lead_status, account_pk, row_created_timestamp::text FROM uown_los_lead WHERE pk = 11739`);
  console.log('--- LEAD 11739 ---'); console.table(lead.rows);

  const sched = await pool.query(`SELECT lead_pk, next_payment_due_date::text AS npd, first_payment_due_date::text AS fpd, plan_id, payment_frequency FROM uown_los_sched_summary WHERE lead_pk = 11739`);
  console.log('--- SCHED 11739 ---'); console.table(sched.rows);

  for (const tbl of ['uown_los_lead_document','uown_los_document','uown_los_documents','uown_los_lead_documents','uown_gow_sign_document','uown_signing_document','uown_gow_sign_template','uown_los_signing']) {
    try {
      const r = await pool.query(`SELECT * FROM ${tbl} WHERE lead_pk = 11739 ORDER BY pk DESC LIMIT 5`);
      console.log(`--- ${tbl} (rows=${r.rows.length}) ---`);
      if (r.rows.length) console.table(r.rows);
    } catch (e: any) { console.log(`${tbl}: ${e.message}`); }
  }

  const notes = await pool.query(`SELECT pk, notes, row_created_timestamp::text FROM uown_los_lead_notes WHERE lead_pk = 11739 ORDER BY pk DESC LIMIT 10`);
  console.log('--- NOTES 11739 ---'); console.table(notes.rows);

  const acc = await pool.query(`SELECT pk, lead_pk, account_status FROM uown_sv_account WHERE lead_pk = 11739`);
  console.log('--- SV_ACCOUNT 11739 ---'); console.table(acc.rows);

  await pool.end();
})().catch(e => { console.error(e); process.exit(1); });

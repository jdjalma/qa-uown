import { Pool } from 'pg';
const pool = new Pool({ host: '127.0.0.1', port: 5445, user: 'svc_user', password: 'F1ntech', database: 'svc' });
(async () => {
  // For lead 11416 (WK13/WEEKLY) — check if submit also asked WEEKLY
  const lead = await pool.query(`SELECT pk, uuid FROM uown_los_lead WHERE pk IN (11416, 11411, 11396, 11719, 11382)`);
  for (const r of lead.rows) {
    const submit = await pool.query(`
      SELECT pk, LEFT(request, 700) as req
      FROM uown_los_inbound_api_log
      WHERE url ILIKE '%submitApplication%'
        AND request ILIKE $1
      ORDER BY pk DESC LIMIT 1`, [`%"leadPk":${r.pk}%`]);
    const send = await pool.query(`
      SELECT pk, LEFT(request, 700) as req
      FROM uown_los_inbound_api_log
      WHERE url ILIKE '%sendApplication%'
        AND response ILIKE $1
      ORDER BY pk DESC LIMIT 1`, [`%pk = ${r.pk}%`]);
    const sendBody = send.rows[0]?.req || '';
    const submitBody = submit.rows[0]?.req || '';
    // Extract key fields
    const sendFreq = sendBody.match(/"desiredPaymentFrequency":"(\w+)"/)?.[1];
    const sendPayFreq = sendBody.match(/"mainPayFrequency":"(\w+)"/)?.[1];
    const sendNpd = sendBody.match(/"mainNextPayDate":"([^"]+)"/)?.[1];
    const submitFreq = submitBody.match(/"desiredPaymentFrequency":"(\w+)"/)?.[1];
    const submitPlanId = submitBody.match(/"planId":"(\w+)"/)?.[1];
    const merchantMatch = sendBody.match(/"merchantNumber":"([^"]+)"/)?.[1];
    console.log(`Lead ${r.pk}: send[freq=${sendFreq}, payFreq=${sendPayFreq}, npd=${sendNpd}, merchant=${merchantMatch}] -> submit[freq=${submitFreq}, planId=${submitPlanId}]`);
  }
  await pool.end();
})().catch(e => { console.error(e.message); process.exit(1); });

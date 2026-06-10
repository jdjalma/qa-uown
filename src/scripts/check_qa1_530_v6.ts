import { Pool } from 'pg';
const pool = new Pool({ host: '127.0.0.1', port: 5445, user: 'svc_user', password: 'F1ntech', database: 'svc' });
(async () => {
  for (const leadPk of [11396, 11416, 11411]) {
    const send = await pool.query(`
      SELECT pk, request, row_created_timestamp
      FROM uown_los_inbound_api_log
      WHERE url ILIKE '%sendApplication%'
        AND response ILIKE $1
      ORDER BY pk DESC LIMIT 1`, [`%pk = ${leadPk}%`]);
    console.log(`=== Lead ${leadPk} sendApplication ===`);
    if (send.rows[0]) {
      const req = String(send.rows[0].request);
      console.log('FULL REQ:', req);
      const npd = req.match(/"mainNextPayDate":\s*"?([^",}]*)"?/);
      const lpd = req.match(/"mainLastPayDate":\s*"?([^",}]*)"?/);
      const pf = req.match(/"mainPayFrequency":\s*"?([^",}]*)"?/);
      console.log('PARSED:', { npd: npd?.[1], lpd: lpd?.[1], pf: pf?.[1] });
    }
    console.log('');
  }
  await pool.end();
})().catch(e => { console.error(e.message); process.exit(1); });

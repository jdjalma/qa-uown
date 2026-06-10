import { Pool } from 'pg';
const pool = new Pool({ host: '127.0.0.1', port: 5445, user: 'svc_user', password: 'F1ntech', database: 'svc' });
(async () => {
  for (const tbl of ['uown_esign_document','uown_dms_esign_document','uown_esign_document_history']) {
    try {
      const r = await pool.query(`SELECT * FROM ${tbl} WHERE lead_pk = 11739 ORDER BY pk DESC LIMIT 5`);
      console.log(`--- ${tbl} for 11739 (${r.rows.length}) ---`); if (r.rows.length) console.table(r.rows);
    } catch (e: any) { console.log(`${tbl}: ${e.message}`); }
  }
  // For a recent FUNDED lead 11735, what do esign docs look like?
  for (const tbl of ['uown_esign_document']) {
    try {
      const r = await pool.query(`SELECT pk, lead_pk, status, document_name, esign_status FROM ${tbl} WHERE lead_pk IN (11735, 11739) ORDER BY pk DESC LIMIT 10`);
      console.log(`--- ${tbl} for 11735/11739 ---`); if (r.rows.length) console.table(r.rows);
    } catch (e: any) {
      try {
        const r = await pool.query(`SELECT * FROM ${tbl} WHERE lead_pk IN (11735, 11739) ORDER BY pk DESC LIMIT 5`);
        console.log(`--- ${tbl} for 11735/11739 (cols flex) ---`); if (r.rows.length) console.table(r.rows);
      } catch (e2: any) { console.log(`${tbl}: ${e2.message}`); }
    }
  }
  await pool.end();
})().catch(e => { console.error(e); process.exit(1); });

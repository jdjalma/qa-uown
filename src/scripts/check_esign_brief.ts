import { Pool } from 'pg';
const pool = new Pool({ host: '127.0.0.1', port: 5445, user: 'svc_user', password: 'F1ntech', database: 'svc' });
(async () => {
  const r = await pool.query(`
    SELECT pk, lead_pk, status, esign_mode, client, template_name, document_name, document_group, contract_number
    FROM uown_esign_document WHERE lead_pk IN (11739, 11735) ORDER BY lead_pk, pk DESC`);
  console.log('--- esign_document ---'); console.table(r.rows);
  await pool.end();
})().catch(e => { console.error(e); process.exit(1); });

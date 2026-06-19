import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ host: '127.0.0.1', port: 5445, database: 'svc', user: 'svc_user', password: process.env.PGPASSWORD });

try {
  console.log('=== Webhook disparou para pk=72396 (future date)? ===');
  const r = await pool.query(`
    SELECT pk, url, request, SUBSTRING(response FROM 1 FOR 60) AS resp
    FROM uown_sv_outbound_api_log
    WHERE request LIKE '%"paymentPk":72396%';
  `);
  console.log(`Webhooks: ${r.rows.length}`);
  for (const row of r.rows) {
    console.log(`  log_pk=${row.pk}  url=${row.url}`);
    console.log(`  request: ${row.request}`);
  }
} catch (e) { console.error('ERR', e.message); }
finally { await pool.end(); }

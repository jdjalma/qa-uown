import pg from 'pg';

const pool = new pg.Pool({
  host: '127.0.0.1', port: 5445, user: 'svc_user', password: 'F1nTech', database: 'svc', max: 1,
});

async function main() {
  const names = ['storedDocServiceSweep', 'storedDocSmsServiceSweep', 'eSignDocumentStatusSweep'];
  const r = await pool.query(
    'SELECT template_name, sql_to_pick_accounts FROM uown_scheduled_task WHERE template_name = ANY($1) ORDER BY template_name',
    [names],
  );
  for (const row of r.rows) {
    console.log('\n>>>', row.template_name, '\n', row.sql_to_pick_accounts ?? '(no SQL)');
  }

  // What columns does uown_esign_document have?
  const r2 = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'uown_esign_document' ORDER BY ordinal_position
  `);
  console.log('\nuown_esign_document columns:');
  console.table(r2.rows);

  // eSignDocumentStatusSweep — leads in signing flow
  const r3 = await pool.query(`
    SELECT ed.pk, ed.lead_pk, ed.status, ed.esign_mode, ed.client, ed.template_name
    FROM uown_esign_document ed
    WHERE ed.status IN ('SENT','PENDING','IN_PROGRESS')
    ORDER BY ed.pk DESC LIMIT 10
  `);
  console.log('\neSignDocumentStatusSweep candidates (status SENT/PENDING/IN_PROGRESS):');
  console.table(r3.rows);

  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });

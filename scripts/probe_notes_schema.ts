import { Client } from 'pg';
import 'dotenv/config';

const env = (process.argv[2] || 'QA1').toUpperCase();
const url = (process.env[`UOWN_DB_URL_${env}`] || '').replace(/^jdbc:/, '');
const user = process.env[`UOWN_DB_USER_${env}`];
const pass = process.env[`UOWN_DB_PASS_${env}`];
const m = url.match(/postgresql:\/\/([^:]+):(\d+)\/(.+)/);
if (!m) process.exit(2);
const [, host, port, database] = m;

const client = new Client({ host, port: Number(port), database, user, password: pass });
(async () => {
  await client.connect();
  console.log(`\n=== ${env} ===\n`);

  console.log('--- Schema de uown_los_lead_notes ---');
  const cols = await client.query(
    `SELECT column_name, data_type
       FROM information_schema.columns
      WHERE table_name = 'uown_los_lead_notes'
      ORDER BY ordinal_position`,
  );
  console.table(cols.rows);

  console.log('\n--- Notas do lead 11407 (lead do welcome email mais recente) ---');
  const sample = await client.query(
    `SELECT * FROM uown_los_lead_notes
      WHERE lead_pk = 11407
      ORDER BY row_created_timestamp ASC`,
  );
  console.log(`Total notas para lead 11407: ${sample.rows.length}`);
  for (const row of sample.rows) {
    console.log('---');
    for (const [k, v] of Object.entries(row)) console.log(`  ${k}: ${String(v ?? '').slice(0, 250)}`);
  }

  console.log('\n--- Notas com texto contendo "welcome" (últimos 60d, qualquer lead) ---');
  const w = await client.query(
    `SELECT pk, lead_pk, agent, LEFT(notes, 250) AS notes_preview, row_created_timestamp
       FROM uown_los_lead_notes
      WHERE LOWER(notes) LIKE '%welcome%'
        AND row_created_timestamp > NOW() - INTERVAL '60 days'
      ORDER BY row_created_timestamp DESC LIMIT 10`,
  );
  console.table(w.rows);

  console.log('\n--- DISTINCT agent (autores) últimos 30d (pra ver se há agent="system"/"sweep") ---');
  const ag = await client.query(
    `SELECT agent, COUNT(*) AS n
       FROM uown_los_lead_notes
      WHERE row_created_timestamp > NOW() - INTERVAL '30 days'
      GROUP BY agent ORDER BY n DESC LIMIT 30`,
  );
  console.table(ag.rows);

  await client.end();
})().catch(e => { console.error(e); process.exit(1); });

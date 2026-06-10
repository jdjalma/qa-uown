import { Client } from 'pg';
import 'dotenv/config';

const env = (process.argv[2] || 'QA1').toUpperCase();
const accountPk = Number(process.argv[3] || 4524);
const url = (process.env[`UOWN_DB_URL_${env}`] || '').replace(/^jdbc:/, '');
const user = process.env[`UOWN_DB_USER_${env}`];
const pass = process.env[`UOWN_DB_PASS_${env}`];
const m = url.match(/postgresql:\/\/([^:]+):(\d+)\/(.+)/);
if (!m) process.exit(2);
const [, host, port, database] = m;

const client = new Client({ host, port: Number(port), database, user, password: pass });
(async () => {
  await client.connect();
  console.log(`\n=== ${env} | account_pk=${accountPk} ===\n`);

  const r = await client.query(
    `SELECT pk, account_pk, lead_pk, to_email_addresses, subject, template_name,
            status, sent_time, row_created_timestamp, picked_at_time
       FROM uown_email_queue
      WHERE account_pk = $1
        AND template_name = 'Welcome'
      ORDER BY row_created_timestamp DESC
      LIMIT 5`,
    [accountPk],
  );
  console.table(r.rows);

  const newest = r.rows[0];
  if (newest) {
    console.log(`\nMais recente: pk=${newest.pk} status=${newest.status} sent_time=${newest.sent_time?.toISOString?.() ?? newest.sent_time}`);
    console.log(`Para: ${newest.to_email_addresses}`);
    console.log(`Created: ${newest.row_created_timestamp?.toISOString?.()}`);
  }

  console.log('\n--- Notas em lead_notes nessa janela (procurando log da action) ---');
  if (newest?.lead_pk) {
    const n = await client.query(
      `SELECT pk, agent, row_created_timestamp, LEFT(notes, 200) AS notes_preview
         FROM uown_los_lead_notes
        WHERE lead_pk = $1
          AND row_created_timestamp >= ($2::timestamp - INTERVAL '5 minutes')
        ORDER BY row_created_timestamp DESC
        LIMIT 20`,
      [newest.lead_pk, newest.row_created_timestamp.toISOString()],
    );
    console.log(`Notas encontradas: ${n.rows.length}`);
    for (const row of n.rows) {
      console.log(`  [${row.row_created_timestamp?.toISOString?.()}] ${row.notes_preview}`);
    }
  }

  await client.end();
})().catch(e => { console.error(e); process.exit(1); });

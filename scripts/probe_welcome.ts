import { Client } from 'pg';
import 'dotenv/config';

const env = (process.argv[2] || 'QA1').toUpperCase();
const url = (process.env[`UOWN_DB_URL_${env}`] || '').replace(/^jdbc:/, '');
const user = process.env[`UOWN_DB_USER_${env}`];
const pass = process.env[`UOWN_DB_PASS_${env}`];
const m = url.match(/postgresql:\/\/([^:]+):(\d+)\/(.+)/);
if (!m) { console.error('Cannot parse URL', url); process.exit(2); }
const [, host, port, database] = m;

const client = new Client({ host, port: Number(port), database, user, password: pass });
(async () => {
  await client.connect();
  console.log(`\n=== ENV: ${env} | DB: ${host}:${port}/${database} ===\n`);

  console.log('--- A) Última linha Welcome no email_queue ---');
  const a = await client.query(
    `SELECT pk, account_pk, lead_pk, merchant_pk, customer_pk,
            to_email_addresses, subject, template_name, template_version,
            status, sent_time, row_created_timestamp, email_body_type, has_attachments
       FROM uown_email_queue
      WHERE template_name = 'Welcome'
      ORDER BY row_created_timestamp DESC
      LIMIT 5`,
  );
  console.table(a.rows);

  if (a.rows.length === 0) { await client.end(); return; }
  const r = a.rows[0];
  const queuePk: number = r.pk;
  const leadPk: number | null = r.lead_pk;
  const accountPk: number | null = r.account_pk;
  const ts: Date = r.row_created_timestamp;
  console.log(`\nMais recente: queuePk=${queuePk}, leadPk=${leadPk}, accountPk=${accountPk}, ts=${ts.toISOString()}\n`);

  console.log('--- B) email_body completo (extraído pra arquivo) ---');
  const b = await client.query(
    `SELECT email_body FROM uown_email_queue WHERE pk = $1`, [queuePk],
  );
  const body: string = b.rows[0]?.email_body || '';
  const fs = await import('node:fs/promises');
  const outFile = `/tmp/welcome_email_body_${queuePk}.html`;
  await fs.writeFile(outFile, body, 'utf8');
  console.log(`Body length: ${body.length} chars → escrito em ${outFile}`);

  console.log('\n--- C) Image URLs encontradas no email_body ---');
  const imgs = Array.from(body.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)).map(m => m[1]);
  const cssBg = Array.from(body.matchAll(/background(?:-image)?\s*:\s*url\(["']?([^"')]+)["']?\)/gi)).map(m => m[1]);
  const all = [...new Set([...imgs, ...cssBg])];
  console.log(`Total imgs únicas: ${all.length}`);
  for (const u of all) console.log(`  - ${u}`);

  console.log('\n--- D) Domínios distintos das imagens ---');
  const domains = [...new Set(all.map(u => { try { return new URL(u).hostname; } catch { return '(invalid:'+u.slice(0,40)+')'; } }))];
  for (const d of domains) console.log(`  - ${d}`);

  console.log('\n--- E) Notas em uown_los_lead_notes para o mesmo lead em janela ±5min ---');
  if (leadPk) {
    const e = await client.query(
      `SELECT pk, lead_pk, note_type, content, author, created_at
         FROM uown_los_lead_notes
        WHERE lead_pk = $1
          AND created_at BETWEEN $2::timestamp - INTERVAL '5 minutes'
                             AND $2::timestamp + INTERVAL '10 minutes'
        ORDER BY created_at ASC`,
      [leadPk, ts.toISOString()],
    );
    console.table(e.rows.map(x => ({...x, content: (x.content||'').slice(0,120)})));
  } else {
    console.log('Sem lead_pk no email_queue — pulando.');
  }

  console.log('\n--- F) DISTINCT note_type contendo "welcome" (qualquer lead, últimos 60d) ---');
  const f = await client.query(
    `SELECT note_type, COUNT(*) AS n, MAX(created_at) AS latest
       FROM uown_los_lead_notes
      WHERE (LOWER(note_type) LIKE '%welcome%' OR LOWER(content) LIKE '%welcome email%')
        AND created_at > NOW() - INTERVAL '60 days'
      GROUP BY note_type
      ORDER BY latest DESC
      LIMIT 20`,
  );
  console.table(f.rows);

  console.log('\n--- G) Amostra de content para notas relacionadas a Welcome ---');
  const g = await client.query(
    `SELECT pk, lead_pk, note_type, LEFT(content, 200) AS content_preview, author, created_at
       FROM uown_los_lead_notes
      WHERE (LOWER(note_type) LIKE '%welcome%' OR LOWER(content) LIKE '%welcome email%')
        AND created_at > NOW() - INTERVAL '60 days'
      ORDER BY created_at DESC
      LIMIT 5`,
  );
  console.table(g.rows);

  await client.end();
})().catch(e => { console.error(e); process.exit(1); });

import { Client } from 'pg';
import 'dotenv/config';
import { writeFile } from 'node:fs/promises';

const env = (process.argv[2] || 'QA1').toUpperCase();
const queuePk = Number(process.argv[3] || 238750);
const url = (process.env[`UOWN_DB_URL_${env}`] || '').replace(/^jdbc:/, '');
const user = process.env[`UOWN_DB_USER_${env}`];
const pass = process.env[`UOWN_DB_PASS_${env}`];
const m = url.match(/postgresql:\/\/([^:]+):(\d+)\/(.+)/);
if (!m) process.exit(2);
const [, host, port, database] = m;

const client = new Client({ host, port: Number(port), database, user, password: pass });
(async () => {
  await client.connect();
  const r = await client.query(
    `SELECT pk, account_pk, lead_pk, to_email_addresses, subject, template_name,
            status, sent_time, row_created_timestamp, email_body
       FROM uown_email_queue WHERE pk = $1`, [queuePk]);
  const row = r.rows[0];
  if (!row) { console.log('Not found'); await client.end(); return; }
  const body: string = row.email_body || '';
  const outFile = `/tmp/welcome_email_body_${queuePk}.html`;
  await writeFile(outFile, body, 'utf8');

  console.log(`=== Envio pk=${queuePk} ===`);
  console.log(`Para: ${row.to_email_addresses}`);
  console.log(`Subject: ${row.subject}`);
  console.log(`Status: ${row.status} sent_time=${row.sent_time?.toISOString?.()}`);
  console.log(`HTML salvo em: ${outFile} (${body.length} chars)\n`);

  // Checklist do novo template (mockup #517)
  type Check = { id: string; element: string; mustHave: RegExp; absent?: boolean; got?: string };
  const checks: Check[] = [
    { id: 'C1', element: 'Greeting novo ("Nome, welcome to Uown!")',           mustHave: /welcome to Uown!/i },
    { id: 'C2', element: 'Frase "your lease is officially active"',            mustHave: /your lease is officially active/i },
    { id: 'C3', element: 'Bullet "Here\'s what to expect next"',               mustHave: /here'?s what to expect next/i },
    { id: 'C4', element: 'Bullet "13 total payments"',                         mustHave: /\b13 total payments\b/i },
    { id: 'C5', element: '"Good to know"',                                     mustHave: /good to know/i },
    { id: 'C6', element: '"promotional payoff options"',                       mustHave: /promotional payoff options/i },
    { id: 'C7', element: 'Closing "The Uown Team"',                            mustHave: /The Uown Team/i },
    { id: 'C8', element: 'Banner "Have questions or need assistance"',         mustHave: /have questions or need assistance/i },
    { id: 'C9', element: 'CS hours novo "Mon-Sat: 8am-12am"',                  mustHave: /Mon\s*-\s*Sat[^A-Za-z0-9]*8am[^A-Za-z0-9]*12am/i },
    { id: 'C10', element: 'Footer phone novo (877) 353-8696',                  mustHave: /\(877\)\s*353-8696/ },
    { id: 'C11', element: 'Email contato info@UownLeasing.com',                mustHave: /info@UownLeasing\.com/i },
    { id: 'C12', element: 'Footer address Tampa/33612',                        mustHave: /Tampa.*33612|10500 University Center/i },
    { id: 'C13', element: 'Ícone LinkedIn',                                    mustHave: /icon-linkedin|linkedin/i },
    // Negative — coisas do template ANTIGO que NÃO devem existir no novo
    { id: 'N1', element: '[NEGATIVA] "You\'ve signed a lease for $X, with Uown" (antigo)',  mustHave: /You['’]ve signed a lease for/, absent: true },
    { id: 'N2', element: '[NEGATIVA] Phone antigo (877) 357-5474',                          mustHave: /\(877\)\s*357-5474/, absent: true },
    { id: 'N3', element: '[NEGATIVA] CS hours antigo "9am - 10pm"',                          mustHave: /9am\s*-\s*10pm/, absent: true },
    { id: 'N4', element: '[NEGATIVA] Twitter (substituído por LinkedIn no novo UOWN)',      mustHave: /icon-twitter|twitter\.com/i, absent: true },
    { id: 'N5', element: '[NEGATIVA] Placeholder quebrado "over the next 13," (antigo)',    mustHave: /over the next\s*<span>?\s*13,/, absent: true },
    { id: 'N6', element: '[NEGATIVA] "56 total payments" (contagem weekly antiga)',         mustHave: /56 total payments/i, absent: true },
    { id: 'N7', element: '[NEGATIVA] "Don\'t forget there are great early payoff" (antigo)', mustHave: /Don['’]t forget there are great early payoff/i, absent: true },
  ];

  const rows = checks.map(c => {
    const hit = c.mustHave.test(body);
    const expected = c.absent ? 'ABSENT' : 'PRESENT';
    const actual = hit ? 'PRESENT' : 'ABSENT';
    const pass = expected === actual ? '✅' : '❌';
    return { id: c.id, expected, actual, pass, element: c.element.slice(0, 70) };
  });
  console.table(rows);

  const fail = rows.filter(r => r.pass === '❌').length;
  const pass = rows.filter(r => r.pass === '✅').length;
  console.log(`\nResumo: ${pass}/${rows.length} passes, ${fail} falhas.`);

  // imagens
  const imgs = Array.from(body.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)).map(x => x[1]);
  console.log('\n--- Imagens no HTML ---');
  for (const u of [...new Set(imgs)]) console.log('  - ' + u);

  await client.end();
})().catch(e => { console.error(e); process.exit(1); });

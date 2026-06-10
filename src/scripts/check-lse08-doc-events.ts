/**
 * check-lse08-doc-events.ts
 *
 * Inspeciona o doc 13484 (lead 16025) para entender por que o click em
 * `button[aria-label="Close document"]` no iframe GowSign nao mudou
 * `esign_document.documentStatus` para CANCELED.
 *
 * Compara com o doc 13472 (lead 15751) que o usuario validou manualmente
 * — esperado: doc 13472 tem event_name='closed' em uown_esign_event_trigger_log.
 *
 * Uso:
 *   npx tsx src/scripts/check-lse08-doc-events.ts qa2
 */
import pg from 'pg';
import { config as dotenvConfig } from 'dotenv';

async function main() {
  dotenvConfig();
  const env = (process.argv[2] ?? 'qa2') as 'qa2';
  const SUF = env.toUpperCase();
  const cs = process.env[`UOWN_DB_URL_${SUF}`];
  if (!cs) throw new Error('No DB connection string');
  const url = new URL(cs.replace(/^jdbc:/, ''));
  const client = new pg.Client({
    host: url.hostname,
    port: Number(url.port),
    database: url.pathname.replace(/^\//, ''),
    user: process.env[`UOWN_DB_USER_${SUF}`],
    password: process.env[`UOWN_DB_PASS_${SUF}`],
  });
  await client.connect();

  for (const [label, leadPk, docPk] of [
    ['LATEST (test fail)', 16025, 13484],
    ['MANUAL (works)    ', 15751, 13472],
  ] as const) {
    console.log(`\n=== ${label} — leadPk=${leadPk} docPk=${docPk} ===`);

    const doc = await client.query(
      `SELECT *
         FROM uown_esign_document
        WHERE pk = $1`,
      [docPk],
    );
    console.log('esign_document:', JSON.stringify(doc.rows[0], null, 2));

    const events = await client.query(
      `SELECT *
         FROM uown_esign_event_trigger_log
        WHERE esign_doc_pk = $1
        ORDER BY pk ASC`,
      [docPk],
    );
    console.log(`event_trigger_log rows (${events.rowCount}):`);
    for (const r of events.rows) console.log('  ', r);
  }

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

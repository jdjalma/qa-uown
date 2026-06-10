import pg from 'pg';
import 'dotenv/config';

const jdbcUrl = process.env.UOWN_DB_URL_QA2;
const user = process.env.UOWN_DB_USER_QA2;
const pass = process.env.UOWN_DB_PASS_QA2;

const pgUrl = jdbcUrl.replace(/^jdbc:/, '');
const urlObj = new URL(pgUrl);
urlObj.username = user;
urlObj.password = pass || '';

const client = new pg.Client({ connectionString: urlObj.toString() });
await client.connect();

console.log('=== 1. Recent GOWSIGN-signed leads (CA, qa2) ===');
const recent = await client.query(`
  SELECT d.pk AS esign_doc_pk,
         d.lead_pk,
         d.client,
         d.row_created_timestamp::date AS created,
         l.lead_status
    FROM uown_esign_document d
    JOIN uown_los_lead l ON l.pk = d.lead_pk
   WHERE d.client = 'GOWSIGN'
     AND d.row_created_timestamp > NOW() - INTERVAL '14 days'
     AND l.lead_status IN ('SIGNED','SETTLED','FUNDING','FUNDED','ACTIVE')
   ORDER BY d.pk DESC
   LIMIT 10
`);
console.table(recent.rows);

if (recent.rows.length === 0) {
  console.log('No recent GOWSIGN signed leads — falling back to any GOWSIGN doc');
  const fallback = await client.query(`
    SELECT pk, lead_pk, client, row_created_timestamp::date AS created
      FROM uown_esign_document
     WHERE client='GOWSIGN'
     ORDER BY pk DESC LIMIT 10`);
  console.table(fallback.rows);
}

const docPks = recent.rows.map(r => r.esign_doc_pk);
if (docPks.length === 0) {
  await client.end();
  process.exit(0);
}

console.log('\n=== 2. Distinct event_names for these docs ===');
const eventNames = await client.query(`
  SELECT event_name, COUNT(*)::int AS cnt
    FROM uown_esign_event_trigger_log
   WHERE esign_doc_pk = ANY($1::int[])
   GROUP BY event_name
   ORDER BY cnt DESC
`, [docPks]);
console.table(eventNames.rows);

console.log('\n=== 3. Full event timeline for ONE recent doc ===');
const oneDoc = docPks[0];
console.log(`Probing esign_doc_pk=${oneDoc}`);
const timeline = await client.query(`
  SELECT pk, event_name, row_created_timestamp,
         LEFT(COALESCE(embedded_url,''), 60) AS url_prefix
    FROM uown_esign_event_trigger_log
   WHERE esign_doc_pk = $1
   ORDER BY row_created_timestamp ASC, pk ASC
`, [oneDoc]);
console.table(timeline.rows);

console.log('\n=== 4. Lead notes for that lead (last 20) — what UOwn logs post-sign ===');
const leadPk = recent.rows[0].lead_pk;
const notes = await client.query(`
  SELECT pk, LEFT(notes, 120) AS note_preview, row_created_timestamp
    FROM uown_los_lead_notes
   WHERE lead_pk = $1
   ORDER BY pk DESC LIMIT 20
`, [leadPk]);
console.table(notes.rows);

console.log('\n=== 5. uown_email_queue entries for that lead ===');
const emails = await client.query(`
  SELECT pk, template_name, subject,
         LEFT(to_email_addresses, 50) AS to_addr,
         status,
         row_created_timestamp
    FROM uown_email_queue
   WHERE lead_pk = $1
   ORDER BY pk DESC LIMIT 20
`, [leadPk]);
console.table(emails.rows);

console.log('\n=== 6. Are there ANY rows in uown_email_queue with template hinting "DocumentSigned" globally? ===');
const docSignedTemplates = await client.query(`
  SELECT DISTINCT template_name, COUNT(*)::int AS cnt
    FROM uown_email_queue
   WHERE template_name ILIKE '%sign%' OR template_name ILIKE '%document%'
      OR subject ILIKE '%DocumentSigned%' OR subject ILIKE '%signed%'
   GROUP BY template_name
   ORDER BY cnt DESC
   LIMIT 15
`);
console.table(docSignedTemplates.rows);

await client.end();

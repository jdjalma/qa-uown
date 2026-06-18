// THROWAWAY (svc#544) — extract a stored Signwell esign PDF from the DB,
// decode base64, parse text, write both to /tmp. Read-only SELECT.
// Usage: node src/scripts/_scratch_extract_signwell_pdf.mjs <esignDocPk> <outBaseName>
import fs from 'node:fs';
import pg from 'pg';

const envFile = {};
for (const line of fs.readFileSync(new URL('../../.env', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) envFile[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const target = (process.env.QUERY_ENV || envFile.ENV || '').toLowerCase();
const suffix = { sandbox: 'SBX', sbx: 'SBX' }[target] || target.toUpperCase();
const url = new URL(envFile[`UOWN_DB_URL_${suffix}`].replace(/^jdbc:/, ''));
url.username = envFile[`UOWN_DB_USER_${suffix}`];
url.password = envFile[`UOWN_DB_PASS_${suffix}`] || '';

const pk = process.argv[2];
const out = process.argv[3] || `signwell-${pk}`;
const pool = new pg.Pool({ connectionString: url.toString(), max: 1 });

const r = await pool.query(
  `SELECT pk, lead_pk, client, template_name, template_version, status,
          base64document_string AS b64, request::text AS req
   FROM uown_esign_document WHERE pk=$1`,
  [pk],
);
await pool.end();
if (!r.rows.length) { console.error('no row'); process.exit(1); }
const row = r.rows[0];
console.log(`env=${target} pk=${row.pk} lead=${row.lead_pk} client=${row.client} template=${row.template_name} v${row.template_version} status=${row.status}`);

if (row.b64) {
  // strip a possible data: prefix
  const clean = String(row.b64).replace(/^data:.*?;base64,/, '');
  const buf = Buffer.from(clean, 'base64');
  const pdfPath = `/tmp/${out}.pdf`;
  fs.writeFileSync(pdfPath, buf);
  console.log(`pdf bytes=${buf.length} -> ${pdfPath}`);
  try {
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: new Uint8Array(buf) });
    const result = await parser.getText();
    await parser.destroy();
    const text = result.text ?? '';
    const txtPath = `/tmp/${out}.txt`;
    fs.writeFileSync(txtPath, text);
    console.log(`text chars=${text.length} -> ${txtPath}`);
    console.log('----- first 600 chars -----');
    console.log(text.slice(0, 600));
  } catch (e) {
    console.error(`pdf-parse failed: ${e.message}`);
  }
}
if (row.req) {
  fs.writeFileSync(`/tmp/${out}.request.json`, row.req);
  console.log(`request json chars=${row.req.length} -> /tmp/${out}.request.json`);
}

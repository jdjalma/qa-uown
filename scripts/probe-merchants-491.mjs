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

const rows = await client.query(`
  SELECT a.pk AS account_pk,
         a.company AS account_company,
         a.merchant_pk,
         m.merchant_name AS merchant_name,
         m.ref_merchant_code AS merchant_code,
         l.company AS lead_company
    FROM uown_sv_account a
    LEFT JOIN uown_merchant m ON m.pk = a.merchant_pk
    LEFT JOIN uown_los_lead l ON l.pk = a.lead_pk
   WHERE a.pk BETWEEN 11403 AND 11413
   ORDER BY a.pk`);
console.table(rows.rows);
await client.end();

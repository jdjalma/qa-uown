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

const today = await client.query(`SELECT CURRENT_DATE::text AS today, extract(DOW FROM CURRENT_DATE)::int AS dow`);
console.log('Today:', today.rows[0]);

const accounts = await client.query(`
  SELECT a.pk AS account_pk,
         a.account_status,
         a.company,
         a.rating,
         a.settled_in_full_date_time::date AS sif_date,
         a.lead_pk,
         (SELECT c.pk FROM uown_sv_customer c WHERE c.account_pk = a.pk LIMIT 1) AS customer_pk,
         (SELECT e.email_address FROM uown_sv_email e WHERE e.account_pk = a.pk AND e.email_type='PRIMARY' LIMIT 1) AS primary_email,
         (SELECT e.do_not_email FROM uown_sv_email e WHERE e.account_pk = a.pk AND e.email_type='PRIMARY' LIMIT 1) AS dne
    FROM uown_sv_account a
   WHERE a.pk BETWEEN 11385 AND 11395 OR a.pk BETWEEN 11403 AND 11413
   ORDER BY a.pk`);
console.log('=== Accounts 11385–11395 ===');
console.table(accounts.rows);

await client.end();

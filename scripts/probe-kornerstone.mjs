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

console.log('=== Distinct company values on uown_sv_account ===');
const dist = await client.query(`SELECT company, COUNT(*) FROM uown_sv_account GROUP BY company ORDER BY 2 DESC`);
console.table(dist.rows);

console.log('\n=== Any SETTLED_IN_FULL accounts in last 30 days (any brand) ===');
const sif = await client.query(`
  SELECT a.pk, a.company, a.rating, a.settled_in_full_date_time::date AS sif_date, m.ref_merchant_code
    FROM uown_sv_account a
    LEFT JOIN uown_merchant m ON m.pk = a.merchant_pk
   WHERE a.account_status='SETTLED_IN_FULL'
     AND a.settled_in_full_date_time >= CURRENT_DATE - INTERVAL '30 days'
   ORDER BY a.settled_in_full_date_time DESC
   LIMIT 30`);
console.table(sif.rows);

console.log('\n=== Distinct rating values on SETTLED_IN_FULL accounts ===');
const ratings = await client.query(`SELECT rating, COUNT(*) FROM uown_sv_account WHERE account_status='SETTLED_IN_FULL' GROUP BY rating ORDER BY 2 DESC`);
console.table(ratings.rows);

await client.end();

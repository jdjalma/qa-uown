import pg from 'pg';
import 'dotenv/config';

const jdbcUrl = process.env.UOWN_DB_URL_QA2;
const user = process.env.UOWN_DB_USER_QA2;
const pass = process.env.UOWN_DB_PASS_QA2;

const pgUrl = jdbcUrl.replace(/^jdbc:/, '');
const urlObj = new URL(pgUrl);
urlObj.username = user;
urlObj.password = pass || '';

const client = new pg.Client({ connectionString: urlObj.toString(), statement_timeout: 30000 });
await client.connect();

console.log('=== Payment arrangements for account_pk=11263 ===');
const arrs = await client.query(
  `SELECT pk, account_pk, arrangement_type, payment_type, status, is_active,
          start_date, end_date, amount, current_rating, previous_rating,
          row_created_timestamp, row_updated_timestamp
     FROM uown_sv_payment_arrangement
    WHERE account_pk = 11263
    ORDER BY row_created_timestamp DESC`);
console.log('count:', arrs.rowCount);
console.table(arrs.rows);

console.log('\n=== ACH payments for account 11263 (last 20) ===');
const achs = await client.query(
  `SELECT pk, account_pk, payment_arrangement_pk, status, vendor_achstatus,
          posting_date, amount, return_code, return_code_description,
          return_date, sent_timestamp, settlement_timestamp,
          row_created_timestamp, row_updated_timestamp, agent, username
     FROM uown_sv_achpayment
    WHERE account_pk = 11263
    ORDER BY row_created_timestamp DESC
    LIMIT 20`);
console.log('count:', achs.rowCount);
console.table(achs.rows);

await client.end();

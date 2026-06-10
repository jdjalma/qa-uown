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

console.log('=== Activity log for account 11263 around 2026-04-17 ===');
const log = await client.query(`
  SELECT pk, log_type, notes, created_by, row_created_timestamp
    FROM uown_sv_activity_log
   WHERE account_pk = 11263
     AND row_created_timestamp >= '2026-04-16'
     AND row_created_timestamp <= '2026-04-18'
   ORDER BY row_created_timestamp ASC`);
console.log('count:', log.rowCount);
for (const row of log.rows) {
  console.log(`${row.row_created_timestamp.toISOString()} [${row.log_type}] (${row.created_by}): ${row.notes}`);
}

console.log('\n=== ACH payment full rows (for arrangement 66) ===');
const ach = await client.query(`
  SELECT pk, status, vendor_achstatus, ach_process_type, ach_type,
         sent_timestamp, return_date_timestamp, settlement_timestamp,
         return_code, return_code_description,
         row_created_timestamp, row_updated_timestamp
    FROM uown_sv_achpayment
   WHERE payment_arrangement_pk = 66
   ORDER BY pk`);
console.log(JSON.stringify(ach.rows, null, 2));

await client.end();

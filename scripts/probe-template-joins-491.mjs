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

const ACCOUNT_PK = 11386;

console.log(`\n=== Diagnóstico dos 5 JOINs exigidos por settled-in-full.sql para accountPk=${ACCOUNT_PK} ===\n`);

const checks = [
  {
    label: 'JOIN #1: uown_sv_customer (customer_type=PRIMARY)',
    sql: `SELECT pk, first_name, last_name, customer_type FROM uown_sv_customer WHERE account_pk = $1`,
  },
  {
    label: 'JOIN #2: uown_sv_email (do_not_email=false, email_type=PRIMARY)',
    sql: `SELECT pk, email_address, email_type, do_not_email FROM uown_sv_email WHERE account_pk = $1`,
  },
  {
    label: 'JOIN #3: uown_sv_address (address_type=HOME)',
    sql: `SELECT pk, address_type, city, state FROM uown_sv_address WHERE account_pk = $1`,
  },
  {
    label: 'JOIN #4: uown_sv_payment (status=PAID)',
    sql: `SELECT pk, status, payment_amount, payment_date FROM uown_sv_payment WHERE account_pk = $1 ORDER BY row_created_timestamp DESC LIMIT 5`,
  },
  {
    label: 'JOIN #5: uown_sv_account',
    sql: `SELECT pk, account_status, rating, company, settled_in_full_date_time FROM uown_sv_account WHERE pk = $1`,
  },
];

for (const c of checks) {
  const res = await client.query(c.sql, [ACCOUNT_PK]);
  console.log(`\n${c.label}`);
  console.log(`  rows: ${res.rowCount}`);
  if (res.rowCount > 0) console.table(res.rows);
}

console.log(`\n=== Query completa (reproduz o template SQL exatamente) ===`);
const full = await client.query(`
  SELECT a.pk AS account_pk, c.first_name, c.last_name, email.email_address,
         address.street_address1, address.city, address.state, address.zip_code,
         payment.payment_amount, payment.payment_date,
         CAST(a.settled_in_full_date_time AS DATE) AS settlement_date
    FROM uown_sv_account a
    JOIN uown_sv_customer c ON c.account_pk = a.pk AND c.customer_type = 'PRIMARY'
    JOIN uown_sv_email email ON email.account_pk = a.pk AND email.do_not_email = false AND email_type = 'PRIMARY'
    JOIN uown_sv_address address ON address.account_pk = a.pk and address.address_type = 'HOME'
    JOIN uown_sv_payment payment ON payment.account_pk = a.pk and payment.status = 'PAID'
   WHERE a.pk = $1 AND (a.rating NOT IN ('E','F','U') OR a.rating IS NULL)
   ORDER BY payment.row_created_timestamp DESC
   LIMIT 1`, [ACCOUNT_PK]);
console.log(`rows: ${full.rowCount}`);
if (full.rowCount > 0) console.table(full.rows);

await client.end();

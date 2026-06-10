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

for (const pk of [11386, 11387, 11388, 11403, 11404, 11405]) {
  const res = await client.query(`
    SELECT a.pk AS account_pk, c.first_name, email.email_address,
           payment.payment_amount, payment.payment_date,
           CAST(a.settled_in_full_date_time AS DATE) AS sif_date, a.company
      FROM uown_sv_account a
      JOIN uown_sv_customer c ON c.account_pk = a.pk AND c.customer_type = 'PRIMARY'
      JOIN uown_sv_email email ON email.account_pk = a.pk AND email.do_not_email = false AND email_type = 'PRIMARY'
      JOIN uown_sv_address address ON address.account_pk = a.pk and address.address_type = 'HOME'
      JOIN uown_sv_payment payment ON payment.account_pk = a.pk and payment.status = 'PAID'
     WHERE a.pk = $1 AND (a.rating NOT IN ('E','F','U') OR a.rating IS NULL)
     ORDER BY payment.row_created_timestamp DESC
     LIMIT 1`, [pk]);
  const status = res.rowCount > 0 ? '✅ query retorna dados' : '❌ 0 rows — fixture incompleto';
  console.log(`accountPk=${pk}: ${status}`);
  if (res.rowCount > 0) console.log(`  → payment=${res.rows[0].payment_amount}, sif_date=${res.rows[0].sif_date.toISOString().slice(0,10)}, company=${res.rows[0].company}`);
}
await client.end();

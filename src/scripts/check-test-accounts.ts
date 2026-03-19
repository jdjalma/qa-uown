import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const env = process.argv[2] ?? 'qa1';
  const config = new ConfigEnvironment(env);
  const pool = new pg.Pool({ connectionString: config.dbConnectionString, max: 1 });

  try {
    const accounts = await pool.query(
      `SELECT pk, account_status, rating FROM uown_sv_account
       WHERE pk IN (4450,4451,4452,4453,4454) ORDER BY pk`
    );
    console.log('\nAccount states:');
    accounts.rows.forEach(r => console.log(`  pk=${r.pk}  status=${r.account_status}  rating=${r.rating}`));

    const arrangements = await pool.query(
      `SELECT pk, account_pk, arrangement_type, payment_type, status, is_active, start_date, end_date
       FROM uown_sv_payment_arrangement
       WHERE account_pk IN (4450,4451,4452,4453,4454)
       ORDER BY account_pk, pk DESC`
    );
    console.log('\nArrangements:');
    arrangements.rows.forEach(r =>
      console.log(`  arrangementPk=${r.pk}  accountPk=${r.account_pk}  type=${r.arrangement_type}  paymentType=${r.payment_type}  status=${r.status}  isActive=${r.is_active}`)
    );
  } finally {
    await pool.end();
  }
}

main().catch(e => { console.error(e); process.exit(1); });

/**
 * Check scheduled task status for CC sweep
 */
import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const env = process.argv[2] ?? 'qa1';
  const config = new ConfigEnvironment(env);
  const pool = new pg.Pool({ connectionString: config.dbConnectionString, max: 1 });

  try {
    const result = await pool.query(
      `SELECT pk, template_name, is_active, last_trigger_time
       FROM uown_scheduled_task
       WHERE template_name ILIKE '%creditcard%' OR template_name ILIKE '%cc%'
         OR template_name ILIKE '%SendCreditCard%'
       ORDER BY template_name`);
    console.log('CC-related scheduled tasks:');
    for (const r of result.rows) {
      console.log(`  pk=${r.pk}, name=${r.template_name}, is_active=${r.is_active}, last_trigger=${r.last_trigger_time}, cron=${r.cron_expression}`);
    }

    // Also check the sweep SQL status directly
    const txn = await pool.query(
      `SELECT pk, status, posting_date, cc_transaction_type, account_pk
       FROM uown_sv_credit_card_transaction
       WHERE pk IN (57379, 57384)
       ORDER BY pk`);
    console.log('\nCC transaction status (after sweep attempt):');
    for (const t of txn.rows) {
      console.log(`  pk=${t.pk}, status=${t.status}, posting_date=${t.posting_date}, account_pk=${t.account_pk}`);
    }
  } finally {
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const envName = process.argv[2] ?? 'qa2';
  const env = new ConfigEnvironment(envName);
  const pool = new pg.Pool({ connectionString: env.dbConnectionString, max: 1 });

  try {
    // 1. Schema of uown_login_attempt
    console.log('=== uown_login_attempt schema ===');
    const loginCols = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'uown_login_attempt'
      ORDER BY ordinal_position
    `);
    for (const c of loginCols.rows) {
      console.log(`  ${c.column_name} (${c.data_type}, nullable=${c.is_nullable})`);
    }

    // 2. Schema of uown_sv_activity_log (we already have helpers but confirm cols)
    console.log('\n=== uown_sv_activity_log schema ===');
    const logCols = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'uown_sv_activity_log'
      ORDER BY ordinal_position
    `);
    for (const c of logCols.rows) {
      console.log(`  ${c.column_name} (${c.data_type})`);
    }

    // 3. Sample login_attempt rows
    console.log('\n=== Sample uown_login_attempt rows (last 5) ===');
    const sample = await pool.query(`
      SELECT pk, email_phone_input, code, number_of_attempts, sms_id, account_found, account_pks, expiration_time, sent_time, row_created_timestamp
      FROM uown_login_attempt
      ORDER BY row_created_timestamp DESC
      LIMIT 5
    `);
    console.log(JSON.stringify(sample.rows, null, 2));

    // 4. EXPLAIN ANALYZE the ticket query
    console.log('\n=== EXPLAIN ANALYZE — ticket query ===');
    const sampleEmail = sample.rows[0]?.email_phone_input ?? 'test@example.com';
    const explain = await pool.query(`
      EXPLAIN (ANALYZE, BUFFERS)
      SELECT * FROM public.uown_login_attempt
      WHERE UPPER(email_phone_input)=UPPER($1)
      ORDER BY row_created_timestamp DESC
      LIMIT $2
    `, [sampleEmail, 1]);
    for (const r of explain.rows) {
      console.log('  ', r['QUERY PLAN']);
    }

    // 5. uown_sv_account columns (find email/customer link)
    console.log('\n=== uown_sv_account columns ===');
    const accCols = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'uown_sv_account'
      ORDER BY ordinal_position
    `);
    for (const c of accCols.rows) console.log(`  ${c.column_name} (${c.data_type})`);

    // 6. Detail of account 11540 (the test account in the user's example)
    console.log('\n=== Account 11540 detail ===');
    const acc = await pool.query(`SELECT * FROM uown_sv_account WHERE pk = 11540`);
    console.log(JSON.stringify(acc.rows, null, 2));

    console.log('\n=== Phones for account 11540 ===');
    const phones = await pool.query(`
      SELECT * FROM uown_sv_phone WHERE account_pk = 11540 LIMIT 5
    `);
    console.log(JSON.stringify(phones.rows, null, 2));

    console.log('\n=== Activity logs for account 11540 (last 15) ===');
    const logs = await pool.query(`
      SELECT pk, log_type, created_by, agent, notes, row_created_timestamp
      FROM uown_sv_activity_log
      WHERE account_pk = 11540
      ORDER BY row_created_timestamp DESC
      LIMIT 15
    `);
    console.log(JSON.stringify(logs.rows, null, 2));

    // 6. Indexes on uown_login_attempt
    console.log('\n=== Indexes on uown_login_attempt ===');
    const indexes = await pool.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'uown_login_attempt'
    `);
    for (const r of indexes.rows) {
      console.log(`  ${r.indexname}: ${r.indexdef}`);
    }
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

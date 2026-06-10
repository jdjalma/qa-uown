import { test } from '@fixtures/test-context.fixture.js';
test('check due date moves records', async ({ db }) => {
  // Check records for account 4461 (user confirmed they exist)
  const rows = await db.query(`
    SELECT pk, account_pk, agent_username, moved_by_days,
           moved_from_due_date::text, is_fpd_change, adjustment_type,
           row_created_timestamp::text
    FROM uown_due_date_moves
    WHERE account_pk = 4461
    ORDER BY row_created_timestamp DESC
    LIMIT 5
  `, []);
  console.log(`Records for account 4461: ${rows.length}`);
  for (const r of rows) {
    console.log(`  pk=${r.pk}, agent=${r.agent_username}, days=${r.moved_by_days}, from=${r.moved_from_due_date}, fpd=${r.is_fpd_change}, type=${r.adjustment_type}, ts=${r.row_created_timestamp}`);
  }

  // Check total count
  const total = await db.query(`SELECT COUNT(*)::int as cnt FROM uown_due_date_moves`, []);
  console.log(`Total records in uown_due_date_moves: ${total[0].cnt}`);

  // Check which accounts have records
  const accounts = await db.query(`
    SELECT account_pk, COUNT(*)::int as cnt
    FROM uown_due_date_moves
    GROUP BY account_pk
    ORDER BY account_pk
  `, []);
  console.log('Accounts with records:');
  for (const a of accounts) {
    console.log(`  account_pk=${a.account_pk}: ${a.cnt} records`);
  }
});

/**
 * find-eligible-accounts.ts
 *
 * Queries the DB for FUNDED accounts without active payment arrangements.
 * Use this when GDS is unavailable and you need to bypass account creation
 * in payment arrangement tests.
 *
 * Usage:
 *   npx tsx src/scripts/find-eligible-accounts.ts qa1
 *   npx tsx src/scripts/find-eligible-accounts.ts sandbox
 */
import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

const SQL = `
  SELECT a.pk, a.account_status AS status, a.rating, a.row_created_timestamp::date AS created
  FROM uown_sv_account a
  WHERE a.account_status NOT IN ('SETTLED_IN_FULL', 'CLOSED', 'CHARGED_OFF')
    AND NOT EXISTS (
      SELECT 1 FROM uown_sv_payment_arrangement pa
      WHERE pa.account_pk = a.pk AND pa.is_active = true
    )
  ORDER BY a.row_created_timestamp DESC
  LIMIT 10
`;

async function main() {
  const env = process.argv[2] ?? 'qa1';
  const config = new ConfigEnvironment(env);
  const connStr = config.dbConnectionString;

  if (!connStr) {
    console.error(`No DB connection string found for env="${env}". Check .env.${env}`);
    process.exit(1);
  }

  const pool = new pg.Pool({ connectionString: connStr, max: 1 });

  try {
    const result = await pool.query(SQL);

    if (result.rows.length === 0) {
      console.log(`No eligible accounts found in ${env}.`);
      return;
    }

    console.log(`\nEligible accounts in ${env} (no active payment arrangement):\n`);
    result.rows.forEach((r, i) => {
      console.log(`  [${i}] pk=${r.pk}  status=${r.status}  rating=${r.rating}  created=${r.created}`);
    });

    const pks = result.rows.slice(0, 5).map((r) => `'${r.pk}'`);
    const padded = [...pks, ...Array(5 - pks.length).fill("'?'")].slice(0, 5);

    console.log(`
Copy 5 PKs into testData.existingAccountPks:
  [0]=CT-02, [1]=CT-03, [2]=CT-04, [3]=CT-05, [4]=CT-06

existingAccountPks: [${padded.join(', ')}],
`);
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

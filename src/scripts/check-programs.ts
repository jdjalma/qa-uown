/**
 * check-programs.ts
 *
 * Investigates why sendInvoice fails for lead 11030 (TerraceFinance, eligible_terms='16').
 *
 * Queries:
 *   1. Programs linked to TerraceFinance (merchant pk=3792)
 *   2. Lead 11030 status + UW data
 *   3. Activity log for lead 11030 (last 10 entries)
 *   4. Payment options for lead 11030
 *
 * Usage:
 *   npx tsx src/scripts/check-programs.ts qa1
 */
import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

const SQL_PROGRAMS = `
SELECT mtp.pk, mtp.merchant_pk, mtp.program_pk, mtp.is_active,
       mp.program_id, mp.term_months, mp.money_factor
FROM uown_merchant_to_program mtp
JOIN uown_merchant_program mp ON mp.pk = mtp.program_pk
WHERE mtp.merchant_pk = 3792
ORDER BY mp.term_months, mtp.is_active DESC
`;

const SQL_LEAD = `
SELECT l.pk, l.lead_status, l.merchant_pk, l.merchant_program_pk,
       u.eligible_terms, u.uw_status, u.approval_amount
FROM uown_los_lead l
LEFT JOIN uown_los_uwdata u ON u.lead_pk = l.pk
WHERE l.pk = 11030
`;

const SQL_ACTIVITY_COLUMNS = `
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'uown_los_activity_log'
ORDER BY ordinal_position
`;

const SQL_ACTIVITY = `
SELECT *
FROM uown_los_activity_log
WHERE lead_pk = 11030
ORDER BY row_created_timestamp DESC
LIMIT 10
`;

const SQL_PAYMENT_OPTIONS = `
SELECT * FROM uown_los_payment_options WHERE lead_pk = 11030
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
    // Query 1: Programs linked to TerraceFinance
    console.log('\n===== QUERY 1: Programs linked to TerraceFinance (merchant_pk=3792) =====');
    const programsResult = await pool.query(SQL_PROGRAMS);
    if (programsResult.rows.length === 0) {
      console.log('  (no rows)');
    } else {
      console.table(programsResult.rows);
    }

    // Query 2: Lead 11030 status
    console.log('\n===== QUERY 2: Lead 11030 status + UW data =====');
    const leadResult = await pool.query(SQL_LEAD);
    if (leadResult.rows.length === 0) {
      console.log('  (no rows — lead 11030 not found)');
    } else {
      console.table(leadResult.rows);
    }

    // Query 3: Activity log — first discover columns
    console.log('\n===== QUERY 3a: uown_los_activity_log columns =====');
    const colsResult = await pool.query(SQL_ACTIVITY_COLUMNS);
    console.log('  Columns:', colsResult.rows.map((r: Record<string, string>) => r.column_name).join(', '));

    console.log('\n===== QUERY 3b: Activity log for lead 11030 (last 10) =====');
    const activityResult = await pool.query(SQL_ACTIVITY);
    if (activityResult.rows.length === 0) {
      console.log('  (no activity log entries)');
    } else {
      activityResult.rows.forEach((row, i) => {
        console.log(`\n  [${i}]`, JSON.stringify(row, null, 2));
      });
    }

    // Query 4: Payment options
    console.log('\n===== QUERY 4: uown_los_payment_options for lead 11030 =====');
    const paymentOptionsResult = await pool.query(SQL_PAYMENT_OPTIONS);
    if (paymentOptionsResult.rows.length === 0) {
      console.log('  (no rows — likely rolled back or never created)');
    } else {
      console.table(paymentOptionsResult.rows);
    }

  } finally {
    await pool.end();
    console.log('\nDone.\n');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

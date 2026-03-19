/**
 * check-programs-extra.ts
 *
 * Additional diagnostics for sendInvoice failure on lead 11030.
 * - Full details of new 16-month programs (pk 207, 208)
 * - All programs linked to TerraceFinance (is_active on both sides)
 * - Full activity log for lead 11030 (ascending, to catch any sendInvoice errors)
 *
 * Usage:
 *   npx tsx src/scripts/check-programs-extra.ts qa1
 */
import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

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
    // Q0: Discover uown_merchant_program columns
    console.log('\n===== uown_merchant_program columns =====');
    const p0 = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'uown_merchant_program'
      ORDER BY ordinal_position
    `);
    console.table(p0.rows);

    // Q1: Full details of new 16-month programs (pk 207, 208)
    console.log('\n===== 16-month program details (pk 207, 208) — all columns =====');
    const p1 = await pool.query(`
      SELECT *
      FROM uown_merchant_program
      WHERE pk IN (207, 208)
      ORDER BY pk
    `);
    console.table(p1.rows);

    // Q2: All programs linked to TerraceFinance with link is_active flag
    console.log('\n===== All programs for TerraceFinance — with link is_active =====');
    const p2 = await pool.query(`
      SELECT mp.pk, mp.program_id, mp.program_name, mp.term_months, mp.money_factor,
             mtp.is_active AS link_is_active,
             mtp.pk AS mtp_pk
      FROM uown_merchant_to_program mtp
      JOIN uown_merchant_program mp ON mp.pk = mtp.program_pk
      WHERE mtp.merchant_pk = 3792
      ORDER BY mp.term_months, mp.pk
    `);
    console.table(p2.rows);

    // Q3: Full activity log for lead 11030 in ascending order
    console.log('\n===== Full activity log for lead 11030 (ASC) =====');
    const p3 = await pool.query(`
      SELECT pk, log_type, notes, row_created_timestamp
      FROM uown_los_activity_log
      WHERE lead_pk = 11030
      ORDER BY pk ASC
    `);
    if (p3.rows.length === 0) {
      console.log('  (no entries)');
    } else {
      p3.rows.forEach((r, i) => {
        console.log(`[${i}] ${r.row_created_timestamp?.toISOString()} | ${r.log_type} | ${r.notes}`);
      });
    }

    // Q4: Check what sendInvoice looks at — does it filter by program_id IS NOT NULL?
    // Look at uown_los_payment_options table structure
    console.log('\n===== uown_los_payment_options table columns =====');
    const p4 = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'uown_los_payment_options'
      ORDER BY ordinal_position
    `);
    console.table(p4.rows);

    // Q5: Look at other leads that successfully used 16-month programs (if any)
    console.log('\n===== Any other leads that used 16-month programs for merchant 3792 =====');
    const p5 = await pool.query(`
      SELECT l.pk, l.lead_status, l.merchant_program_pk,
             mp.term_months, mp.program_id, mp.money_factor
      FROM uown_los_lead l
      JOIN uown_merchant_program mp ON mp.pk = l.merchant_program_pk
      WHERE l.merchant_pk = 3792
        AND mp.term_months = 16
      ORDER BY l.pk DESC
      LIMIT 10
    `);
    if (p5.rows.length === 0) {
      console.log('  (no leads have used 16-month programs for this merchant yet)');
    } else {
      console.table(p5.rows);
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

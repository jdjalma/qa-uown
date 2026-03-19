/**
 * check-sendinvoice.ts
 *
 * Deep diagnostic for sendInvoice failure on leads using 16-month programs (TerraceFinance).
 *
 * Usage:
 *   npx tsx src/scripts/check-sendinvoice.ts qa1
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
    // Q1: Any invoice/error/payment activity for leads 11017, 11019, 11030
    console.log('\n===== sendInvoice/error entries for leads 11017, 11019, 11030 =====');
    const r1 = await pool.query(`
      SELECT lead_pk, pk, log_type, notes, row_created_timestamp
      FROM uown_los_activity_log
      WHERE lead_pk IN (11017, 11019, 11030)
        AND (
          LOWER(notes) LIKE '%invoice%'
          OR LOWER(notes) LIKE '%payment option%'
          OR LOWER(notes) LIKE '%error%'
          OR LOWER(notes) LIKE '%rollback%'
          OR LOWER(notes) LIKE '%exception%'
          OR LOWER(notes) LIKE '%failed%'
          OR LOWER(notes) LIKE '%program%'
          OR log_type IN ('ERROR', 'INVOICE', 'EXCEPTION')
        )
      ORDER BY pk DESC
    `);
    if (r1.rows.length === 0) {
      console.log('  (no matching entries — sendInvoice has never been called on these leads)');
    } else {
      r1.rows.forEach(r => {
        console.log(`  [lead=${r.lead_pk}] ${r.row_created_timestamp?.toISOString()} | ${r.log_type} | ${r.notes}`);
      });
    }

    // Q2: Lead statuses and linked programs for all three
    console.log('\n===== Lead statuses + linked programs (11017, 11019, 11030) =====');
    const r2 = await pool.query(`
      SELECT l.pk, l.lead_status, l.merchant_program_pk,
             mp.program_id, mp.term_months, mp.program_name,
             mp.lending_category_type, mp.group_name,
             mp.peak_campaign_id, mp.off_peak_campaign_id
      FROM uown_los_lead l
      LEFT JOIN uown_merchant_program mp ON mp.pk = l.merchant_program_pk
      WHERE l.pk IN (11017, 11019, 11030)
      ORDER BY l.pk
    `);
    console.table(r2.rows);

    // Q3: uown_los_invoice for these leads
    console.log('\n===== uown_los_invoice for leads 11017, 11019, 11030 =====');
    const r3 = await pool.query(`
      SELECT lead_pk, pk, invoice_status, row_created_timestamp
      FROM uown_los_invoice
      WHERE lead_pk IN (11017, 11019, 11030)
      ORDER BY pk DESC
    `);
    if (r3.rows.length === 0) {
      console.log('  (no invoice rows — sendInvoice rolled back or was never called)');
    } else {
      console.table(r3.rows);
    }

    // Q4: Compare program_id and campaign_id for all 3 programs on TerraceFinance
    console.log('\n===== Campaign IDs + identifiers for all 3 TerraceFinance programs =====');
    const r4 = await pool.query(`
      SELECT mp.pk, mp.program_id, mp.program_name, mp.lending_category_type,
             mp.group_name, mp.peak_campaign_id, mp.off_peak_campaign_id,
             mp.term_months, mp.money_factor
      FROM uown_merchant_program mp
      WHERE mp.pk IN (88, 207, 208)
      ORDER BY mp.pk
    `);
    console.table(r4.rows);

    // Q5: Are there OTHER merchants using programs 207 or 208? (shared program check)
    console.log('\n===== Other merchants also linked to program 207 or 208 =====');
    const r5 = await pool.query(`
      SELECT mtp.merchant_pk, m.ref_merchant_code, mtp.program_pk, mtp.is_active
      FROM uown_merchant_to_program mtp
      JOIN uown_merchant m ON m.pk = mtp.merchant_pk
      WHERE mtp.program_pk IN (207, 208)
      ORDER BY mtp.merchant_pk
    `);
    if (r5.rows.length === 0) {
      console.log('  (no other merchants — programs 207/208 are exclusive to merchant 3792)');
    } else {
      console.table(r5.rows);
    }

    // Q6: How does the working 13-month program (pk=88) compare in terms of program_id
    //     vs null program_id on 207/208 — is program_id required by sendInvoice?
    console.log('\n===== Leads that SUCCESSFULLY used program 88 (13-month) for merchant 3792 =====');
    const r6 = await pool.query(`
      SELECT l.pk, l.lead_status, l.merchant_program_pk,
             u.eligible_terms, u.approval_amount
      FROM uown_los_lead l
      LEFT JOIN uown_los_uwdata u ON u.lead_pk = l.pk
      WHERE l.merchant_pk = 3792
        AND l.merchant_program_pk = 88
        AND l.lead_status NOT IN ('UW_DENIED', 'UW_APPROVED')
      ORDER BY l.pk DESC
      LIMIT 5
    `);
    if (r6.rows.length === 0) {
      console.log('  (no leads past UW_APPROVED with 13-month program in merchant 3792)');
    } else {
      console.table(r6.rows);
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

import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const cfg = new ConfigEnvironment('qa1');
  const pool = new pg.Pool({ connectionString: cfg.dbConnectionString, max: 1 });
  try {
    // Check the 2 "high tier" UOWN test merchants
    const merchants = await pool.query(
      `SELECT pk, ref_merchant_code, merchant_name, merchant_type,
              max_approval_amount, default_loan_amount, state
         FROM uown_merchant
        WHERE pk IN (2812, 7043)
        ORDER BY pk`,
    );
    console.log('"High tier" UOWN test merchants:');
    console.table(merchants.rows);

    // 16m programs available to these merchants
    const programs = await pool.query(
      `SELECT m.pk AS merchant_pk, m.ref_merchant_code,
              mp.pk AS program_pk, mp.program_name, mp.term_months,
              mp.states, mp.is_active, mp.min_cart_amount, mp.max_cart_amount
         FROM uown_merchant m
         JOIN uown_merchant_to_program mtp ON mtp.merchant_pk = m.pk
         JOIN uown_merchant_program mp ON mp.pk = mtp.program_pk
        WHERE m.pk IN (2812, 7043)
          AND mp.term_months IN (13, 16)
          AND mp.is_active = true
        ORDER BY m.pk, mp.term_months, mp.program_name`,
    );
    console.log('\n13m + 16m programs available:');
    console.table(programs.rows.map((r: any) => ({
      merchant_pk: r.merchant_pk,
      ref_code: r.ref_merchant_code,
      program_pk: r.program_pk,
      program: String(r.program_name ?? '').slice(0, 35),
      term: r.term_months,
      states_contains_CA: String(r.states ?? '').includes('CA') ? 'yes' : 'no',
      active: r.is_active,
    })));

    // Recent leads on these merchants with their approvals
    const recentLeads = await pool.query(
      `SELECT l.pk AS lead_pk, l.merchant_pk, l.customer_state,
              l.lead_status, l.max_approval_amount,
              l.merchant_program_pk, mp.program_name, mp.term_months,
              l.row_created_timestamp
         FROM uown_los_lead l
         LEFT JOIN uown_merchant_program mp ON mp.pk = l.merchant_program_pk
        WHERE l.merchant_pk IN (2812, 7043)
        ORDER BY l.pk DESC
        LIMIT 12`,
    );
    console.log('\nRecent leads on these merchants:');
    console.table(recentLeads.rows.map((r: any) => ({
      lead_pk: r.lead_pk,
      merchant_pk: r.merchant_pk,
      state: r.customer_state,
      status: r.lead_status,
      approval: r.max_approval_amount,
      program: String(r.program_name ?? '-').slice(0, 30),
      term: r.term_months,
      ts: String(r.row_created_timestamp).slice(0, 10),
    })));

    // Are these merchants in our automation merchants.ts catalog?
    const credCols = await pool.query(
      `SELECT pk, ref_merchant_code, merchant_name, user_name
         FROM uown_merchant
        WHERE pk IN (2812, 7043)`,
    );
    console.log('\nCredentials (for adding to merchants.ts if needed):');
    console.table(credCols.rows);
  } finally {
    await pool.end();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });

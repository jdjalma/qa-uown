import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';
async function main() {
  const cfg = new ConfigEnvironment('qa1');
  const pool = new pg.Pool({ connectionString: cfg.dbConnectionString, max: 1 });
  try {
    const programs = await pool.query(
      `SELECT mp.pk, mp.program_name, mp.term_months, mp.activation_date, mp.deactivation_date, mp.is_active
         FROM uown_merchant_program mp
         JOIN uown_merchant_to_program mtp ON mtp.program_pk = mp.pk
        WHERE mtp.merchant_pk = 7048
        ORDER BY mp.term_months, mp.program_name`,
    );
    console.log('PayPossible (7048) all linked programs current state:');
    console.table(programs.rows);

    const recentLeads = await pool.query(
      `SELECT pk, customer_state, lead_status, max_approval_amount, merchant_program_pk,
              row_created_timestamp
         FROM uown_los_lead WHERE merchant_pk = 7048
        ORDER BY pk DESC LIMIT 5`,
    );
    console.log('\nRecent PayPossible leads:');
    console.table(recentLeads.rows);
  } finally { await pool.end(); }
}
main().catch((err) => { console.error(err); process.exit(1); });

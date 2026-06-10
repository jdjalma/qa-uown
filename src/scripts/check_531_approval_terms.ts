import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const cfg = new ConfigEnvironment('qa1');
  const pool = new pg.Pool({ connectionString: cfg.dbConnectionString, max: 1 });
  try {
    // Schema of uown_lead_approval_terms
    const cols = await pool.query(
      `SELECT column_name FROM information_schema.columns
        WHERE table_name = 'uown_lead_approval_terms' ORDER BY ordinal_position`,
    );
    console.log('uown_lead_approval_terms columns:');
    console.table(cols.rows);

    // Inspect our test leads
    const rows = await pool.query(
      `SELECT *
         FROM uown_lead_approval_terms
        WHERE lead_pk IN (11904, 11929, 11939, 11970, 12013, 12014)
        ORDER BY lead_pk DESC`,
    );
    console.log('\nApproval terms for our test leads:');
    console.table(rows.rows);

    // Compare TireAgent (max_approval_amount=5000 explicit) vs others
    // What do TireAgent leads from history look like?
    const tireAgentLeads = await pool.query(
      `SELECT l.pk AS lead_pk, l.merchant_pk, l.max_approval_amount, l.customer_state,
              l.lead_status, l.row_created_timestamp
         FROM uown_los_lead l
        WHERE l.merchant_pk = 566   -- TireAgent
          AND l.row_created_timestamp > now() - interval '60 days'
          AND l.max_approval_amount IS NOT NULL
        ORDER BY l.max_approval_amount DESC NULLS LAST
        LIMIT 10`,
    );
    console.log('\nTireAgent recent leads sorted by max_approval_amount DESC:');
    console.table(tireAgentLeads.rows);

    // What's the highest BlackBoxApproval observed in qa1 history?
    const topApprovals = await pool.query(
      `SELECT l.pk, l.merchant_pk, m.ref_merchant_code, l.max_approval_amount, l.customer_state,
              l.row_created_timestamp
         FROM uown_los_lead l
         JOIN uown_merchant m ON m.pk = l.merchant_pk
        WHERE l.max_approval_amount IS NOT NULL
          AND l.max_approval_amount > 3000
        ORDER BY l.max_approval_amount DESC
        LIMIT 15`,
    );
    console.log('\nTop 15 approvals > $3000 in qa1 (any merchant):');
    console.table(topApprovals.rows.map((r: any) => ({
      lead_pk: r.pk,
      merchant_pk: r.merchant_pk,
      ref_code: r.ref_merchant_code,
      approval: r.max_approval_amount,
      state: r.customer_state,
      ts: String(r.row_created_timestamp).slice(0, 10),
    })));
  } finally {
    await pool.end();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });

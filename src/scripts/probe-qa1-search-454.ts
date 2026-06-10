import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const cfg = new ConfigEnvironment('qa1');
  const pool = new pg.Pool({ connectionString: cfg.dbConnectionString, max: 1 });
  try {
    const q = async (label: string, sql: string, params: unknown[] = []) => {
      const r = await pool.query(sql, params);
      console.log(`\n— ${label} —`);
      console.log(JSON.stringify(r.rows, null, 2).slice(0, 4000));
    };

    await q('total leads', 'SELECT COUNT(*) AS leads FROM uown_los_lead');
    await q(
      'leads with multiple CCs (dedup risk)',
      `SELECT lead_pk, COUNT(*) AS cc_count
       FROM uown_los_credit_card
       GROUP BY lead_pk
       HAVING COUNT(*) > 1
       ORDER BY COUNT(*) DESC
       LIMIT 10`,
    );
    await q(
      'sample lead w/ multiple CCs + lead status',
      `SELECT l.pk AS lead_pk, l.account_pk, l.lead_status, l.uuid,
              c.first_name, c.last_name,
              (SELECT COUNT(*) FROM uown_los_credit_card cc WHERE cc.lead_pk = l.pk) AS cc_count,
              (SELECT string_agg(DISTINCT cc.cc_last_four_digit, ',') FROM uown_los_credit_card cc WHERE cc.lead_pk = l.pk) AS last4s
       FROM uown_los_lead l
       JOIN uown_los_customer c ON c.lead_pk = l.pk
       WHERE l.pk IN (SELECT lead_pk FROM uown_los_credit_card GROUP BY lead_pk HAVING COUNT(*) > 1)
       ORDER BY l.row_created_timestamp DESC
       LIMIT 5`,
    );
    await q(
      'available lead_status values',
      `SELECT lead_status, COUNT(*) FROM uown_los_lead GROUP BY lead_status ORDER BY COUNT(*) DESC LIMIT 15`,
    );
    await q(
      'recent merchant activity (last 7 days)',
      `SELECT merchant.ref_merchant_code, COUNT(*) AS leads_7d
       FROM uown_los_lead l
       JOIN uown_merchant merchant ON l.merchant_pk = merchant.pk
       WHERE l.row_created_timestamp > NOW() - INTERVAL '7 days'
       GROUP BY merchant.ref_merchant_code
       ORDER BY COUNT(*) DESC
       LIMIT 10`,
    );
    await q(
      'most recent 3 leads (sanity: DV360 outage healed?)',
      `SELECT l.pk, l.row_created_timestamp, l.lead_status, l.account_pk, m.ref_merchant_code
       FROM uown_los_lead l JOIN uown_merchant m ON l.merchant_pk = m.pk
       ORDER BY l.row_created_timestamp DESC LIMIT 3`,
    );
    await q(
      'dead tuples / autovacuum status on uown_los_lead',
      `SELECT relname, n_live_tup, n_dead_tup,
              last_vacuum, last_autovacuum, last_analyze, last_autoanalyze
       FROM pg_stat_user_tables WHERE relname IN ('uown_los_lead','uown_merchant','uown_los_customer','uown_los_credit_card')`,
    );
    await q(
      'index usage — targets of DROP (should be 0 scans if truly unused)',
      `SELECT indexrelname, idx_scan, idx_tup_read
       FROM pg_stat_user_indexes
       WHERE indexrelname IN (
         'idx_phone_type','idx_los_email_email_type',
         'idx_merchant_support_lower_ccnew','idx_merchant_support_lower_ccnew1',
         'idx_uown_merchant_client_type_ccnew','idx_uown_merchant_client_type_ccnew1',
         'idx_uown_merchant_is_active_ccnew','idx_uown_merchant_is_active_ccnew1',
         'idx_uown_merchant_is_deleted_ccnew','idx_uown_merchant_is_deleted_ccnew1',
         'idx_uown_merchant_location_name_ccnew','idx_uown_merchant_location_name_ccnew1',
         'idx_uown_merchant_merchant_name_ccnew','idx_uown_merchant_merchant_name_ccnew1',
         'idx_uown_merchant_ref_merchant_code_ccnew','idx_uown_merchant_ref_merchant_code_ccnew1'
       )
       ORDER BY indexrelname`,
    );
  } finally {
    await pool.end();
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});

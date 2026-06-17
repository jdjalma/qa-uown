import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

/** Read-only: find Kornerstone merchants + their UW-config + relevant flags for snapshot tests. */
async function main() {
  const env = process.argv[2] ?? 'qa2';
  const cfg = new ConfigEnvironment(env);
  const pool = new pg.Pool({ connectionString: cfg.dbConnectionString, max: 1, connectionTimeoutMillis: 5000 });
  console.log(`\n=== Kornerstone merchant probe — env=${env} ===\n`);
  try {
    // relevant flag/company columns
    const cols = await pool.query(
      `SELECT column_name FROM information_schema.columns
        WHERE table_name='uown_merchant'
          AND (column_name ILIKE '%company%' OR column_name ILIKE '%seon%' OR column_name ILIKE '%kornerstone%'
            OR column_name ILIKE '%webhook%' OR column_name ILIKE '%hold_deposit%' OR column_name ILIKE '%bank_verif%')
        ORDER BY column_name`);
    console.log('flag/company columns:', cols.rows.map(r => r.column_name).join(', '));

    const ks = await pool.query(
      `SELECT pk, ref_merchant_code, merchant_name, client_type,
              epo5, epo10, uw_pipeline, fraud_threshold
         FROM uown_merchant
        WHERE ref_merchant_code ILIKE 'KS%' OR client_type = 'KORNERSTONE' OR merchant_name ILIKE '%kornerstone%'
        ORDER BY pk`);
    console.log('\n=== Kornerstone merchants (UW config) ===');
    console.table(ks.rows);

    // 16m programs per KS merchant (needed for Kornerstone routing)
    const progs = await pool.query(
      `SELECT m.pk AS merchant_pk, m.ref_merchant_code, mp.term_in_months, mp.is_active
         FROM uown_merchant m
         JOIN uown_merchant_program mp ON mp.merchant_pk = m.pk
        WHERE (m.ref_merchant_code ILIKE 'KS%' OR m.client_type='KORNERSTONE')
          AND mp.is_active = true
        ORDER BY m.pk, mp.term_in_months`);
    console.log('\n=== active programs for KS merchants ===');
    console.table(progs.rows);

    // existing lead/account snapshots already tied to KS merchants (if any)
    const snaps = await pool.query(
      `SELECT s.merchant_pk, m.ref_merchant_code, COUNT(*)::int AS lead_snaps
         FROM uown_los_lead_merchant_settings_snapshot s
         JOIN uown_merchant m ON m.pk = s.merchant_pk
        WHERE m.ref_merchant_code ILIKE 'KS%' OR m.client_type='KORNERSTONE'
        GROUP BY 1,2 ORDER BY 3 DESC`);
    console.log('\n=== existing lead snapshots for KS merchants ===');
    console.table(snaps.rows.length ? snaps.rows : [{ note: 'none yet' }]);
  } finally {
    await pool.end();
  }
}
main().catch((e) => { console.error('PROBE ERROR:', e.message); process.exit(2); });

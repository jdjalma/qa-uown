import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';
async function main() {
  const cfg = new ConfigEnvironment(process.argv[2] ?? 'qa2');
  const pool = new pg.Pool({ connectionString: cfg.dbConnectionString, max: 1 });
  try {
    const nameCols = await pool.query(
      `SELECT column_name FROM information_schema.columns
        WHERE table_name='uown_merchant'
          AND (column_name ILIKE '%name%' OR column_name ILIKE '%merchant_number%' OR column_name ILIKE '%ref%code%')
        ORDER BY column_name`);
    console.log('=== uown_merchant name-ish columns ==='); console.table(nameCols.rows);

    const m = await pool.query(
      `SELECT pk, ref_merchant_code, merchant_name, client_type, epo5, epo10, uw_pipeline, fraud_threshold
         FROM uown_merchant
        WHERE pk = 34 OR merchant_name ILIKE '%terrace%' OR ref_merchant_code ILIKE '%terrace%'
        ORDER BY pk`);
    console.log('\n=== merchant UW config (pk 34 + terrace*) ==='); console.table(m.rows);

    const byMerchant = await pool.query(
      `SELECT s.merchant_pk, m.ref_merchant_code, m.merchant_name, m.client_type,
              m.epo5, m.epo10, m.uw_pipeline, m.fraud_threshold, COUNT(*)::int AS snapshots
         FROM uown_los_lead_merchant_settings_snapshot s
         JOIN uown_merchant m ON m.pk = s.merchant_pk
        GROUP BY 1,2,3,4,5,6,7,8 ORDER BY snapshots DESC`);
    console.log('\n=== lead snapshots grouped by merchant (with live merchant config) ==='); console.table(byMerchant.rows);

    const pipelines = await pool.query(
      `SELECT uw_pipeline, COUNT(*)::int AS merchants FROM uown_merchant
        WHERE uw_pipeline IS NOT NULL AND uw_pipeline <> '' GROUP BY 1 ORDER BY 2 DESC LIMIT 15`);
    console.log('\n=== distinct non-null uw_pipeline values ==='); console.table(pipelines.rows);
  } finally { await pool.end(); }
}
main().catch(e=>{console.error(e.message ?? e);process.exit(1);});

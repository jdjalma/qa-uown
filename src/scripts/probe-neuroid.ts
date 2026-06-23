import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

// Passo 0 — Discovery probe (READ-ONLY) for NeuroID
async function main() {
  const cfg = new ConfigEnvironment('qa2');
  const pool = new pg.Pool({ connectionString: cfg.dbConnectionString, max: 1 });
  try {
    console.log('=== 1. uown_sv_outbound_api_log columns ===');
    const cols = await pool.query(
      `SELECT column_name, data_type FROM information_schema.columns
       WHERE table_name = 'uown_sv_outbound_api_log' ORDER BY ordinal_position`,
    );
    console.table(cols.rows);

    console.log('=== 2. NeuroID-looking rows in uown_sv_outbound_api_log ===');
    try {
      const sample = await pool.query(
        `SELECT pk, account_pk, api, call_type, url, source, source_uuid, return_uuid, row_created_timestamp
           FROM uown_sv_outbound_api_log
          WHERE url ILIKE '%neuro%' OR api ILIKE '%neuro%'
          ORDER BY pk DESC LIMIT 20`,
      );
      console.log(`rows: ${sample.rowCount}`);
      console.table(sample.rows);
    } catch (e) {
      console.log('sample query failed (likely missing columns):', (e as Error).message);
    }

    console.log('=== 3. uown_neuro_id_verification columns ===');
    const nidCols = await pool.query(
      `SELECT column_name, data_type FROM information_schema.columns
       WHERE table_name = 'uown_neuro_id_verification' ORDER BY ordinal_position`,
    );
    console.table(nidCols.rows);

    console.log('=== 3b. distinct neuro_id_status values seen ===');
    try {
      const statuses = await pool.query(
        `SELECT DISTINCT neuro_id_status FROM uown_neuro_id_verification
          WHERE neuro_id_status IS NOT NULL LIMIT 40`,
      );
      console.table(statuses.rows);
    } catch (e) {
      console.log('status distinct failed:', (e as Error).message);
    }

    console.log('=== 4. merchant flags OW90337-0001 + KS1011 ===');
    const merch = await pool.query(
      `SELECT ref_merchant_code, use_neuro_id_check
         FROM uown_merchant
        WHERE ref_merchant_code IN ('OW90337-0001','KS1011')`,
    );
    console.table(merch.rows);

    console.log('=== 5. uown_los_lead correlation columns (uuid?) ===');
    const leadCols = await pool.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'uown_los_lead' AND column_name ILIKE ANY(ARRAY['%uuid%','pk','%account%'])
       ORDER BY ordinal_position`,
    );
    console.table(leadCols.rows);
  } finally {
    await pool.end();
  }
}
main().catch(e => { console.error(e); process.exit(1); });

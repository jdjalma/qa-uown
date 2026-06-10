import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const cfg = new ConfigEnvironment('qa1');
  const pool = new pg.Pool({ connectionString: cfg.dbConnectionString, max: 1 });
  try {
    // Find tables that look BlackBox/underwriting/tier related
    const tables = await pool.query(
      `SELECT table_name
         FROM information_schema.tables
        WHERE table_schema = 'public'
          AND (table_name ILIKE '%blackbox%'
            OR table_name ILIKE '%underwrit%'
            OR table_name ILIKE '%approval%'
            OR table_name ILIKE '%tier%'
            OR table_name ILIKE '%lambda%'
            OR table_name ILIKE '%credit%limit%'
            OR table_name ILIKE '%max%amount%')
        ORDER BY table_name`,
    );
    console.log('BlackBox/underwriting/tier candidate tables:');
    console.table(tables.rows);

    // Inspect uown_merchant for approval columns
    const merchantCols = await pool.query(
      `SELECT column_name
         FROM information_schema.columns
        WHERE table_name = 'uown_merchant'
          AND (column_name ILIKE '%amount%'
            OR column_name ILIKE '%approval%'
            OR column_name ILIKE '%limit%'
            OR column_name ILIKE '%tier%'
            OR column_name ILIKE '%blackbox%'
            OR column_name ILIKE '%cap%')
        ORDER BY column_name`,
    );
    console.log('\nuown_merchant approval-related cols:');
    console.table(merchantCols.rows);

    // Inspect uown_los_lead underwriting_pk linkage
    const leadCols = await pool.query(
      `SELECT column_name
         FROM information_schema.columns
        WHERE table_name = 'uown_los_lead'
          AND (column_name ILIKE '%uw%'
            OR column_name ILIKE '%underwrit%'
            OR column_name ILIKE '%approval%'
            OR column_name ILIKE '%lambda%'
            OR column_name ILIKE '%blackbox%')
        ORDER BY column_name`,
    );
    console.log('\nuown_los_lead UW-related cols:');
    console.table(leadCols.rows);

    // Find any underwriting/approval row for one of our leads
    const sampleLead = await pool.query(
      `SELECT *
         FROM uown_los_lead
        WHERE pk = 11929
        LIMIT 1`,
    );
    console.log('\nLead 11929 (KS5936 16m winner) — approval-relevant fields:');
    if (sampleLead.rows.length > 0) {
      const row: Record<string, unknown> = sampleLead.rows[0];
      const keys = Object.keys(row).filter((k) =>
        /amount|approval|limit|tier|blackbox|lambda|uw|underwrit|income/i.test(k),
      );
      const subset: Record<string, unknown> = {};
      for (const k of keys) subset[k] = row[k];
      console.table([subset]);
    }

    // Lead 11904 (Daniels 13m random SSN) for comparison
    const sampleDaniels = await pool.query(
      `SELECT *
         FROM uown_los_lead
        WHERE pk = 11904
        LIMIT 1`,
    );
    console.log('\nLead 11904 (Daniels 13m loser) — same fields:');
    if (sampleDaniels.rows.length > 0) {
      const row: Record<string, unknown> = sampleDaniels.rows[0];
      const keys = Object.keys(row).filter((k) =>
        /amount|approval|limit|tier|blackbox|lambda|uw|underwrit|income/i.test(k),
      );
      const subset: Record<string, unknown> = {};
      for (const k of keys) subset[k] = row[k];
      console.table([subset]);
    }

    // Per-merchant approval caps in qa1
    const merchantCaps = await pool.query(
      `SELECT pk, ref_merchant_code, merchant_name,
              CASE WHEN ref_merchant_code ILIKE 'KS%' THEN 'KORNERSTONE' ELSE 'UOWN' END AS brand,
              max_approval_amount,
              approval_amount_increase,
              default_loan_amount,
              minimum_lease_amount
         FROM uown_merchant
        WHERE pk IN (566, 6108, 7098, 7099, 3792, 6186, 7199, 7079)
        ORDER BY brand, pk`,
    );
    console.log('\nuown_merchant approval caps for our target merchants + UOWN-16m historical:');
    console.table(merchantCaps.rows);

    // Probe uown_configuration_management for any BlackBox/approval keys
    const configKeys = await pool.query(
      `SELECT key, value
         FROM uown_configuration_management
        WHERE key ILIKE '%blackbox%'
           OR key ILIKE '%underwrit%'
           OR key ILIKE '%approval%'
           OR key ILIKE '%tier%'
           OR key ILIKE '%lambda%'
           OR key ILIKE '%max%amount%'
        ORDER BY key
        LIMIT 30`,
    );
    console.log('\nuown_configuration_management keys related to approval:');
    console.table(configKeys.rows);
  } finally {
    await pool.end();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });

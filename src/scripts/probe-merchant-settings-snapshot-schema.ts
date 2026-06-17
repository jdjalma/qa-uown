import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

/**
 * Read-only probe for the Merchant Settings Snapshot feature.
 * Goal: discover whether the snapshot feature is deployed in the target env
 * and, if so, the table/column names that hold the lead- and account-level
 * UW-config snapshots (EPO 5%, EPO 10%, UW Pipeline, Fraud Threshold).
 *
 * Usage: npx tsx src/scripts/probe-merchant-settings-snapshot-schema.ts [env]   (default qa2)
 */
async function main() {
  const env = process.argv[2] ?? 'qa2';
  const cfg = new ConfigEnvironment(env);
  const pool = new pg.Pool({ connectionString: cfg.dbConnectionString, max: 1 });
  console.log(`\n=== merchant-settings snapshot schema probe — env=${env} ===\n`);
  try {
    // 1. Tables that look snapshot/config/epo related
    const tables = await pool.query(
      `SELECT table_name
         FROM information_schema.tables
        WHERE table_schema = 'public'
          AND ( table_name ILIKE '%snapshot%'
             OR table_name ILIKE '%uw_config%'
             OR table_name ILIKE '%uw_setting%'
             OR table_name ILIKE '%merchant_setting%'
             OR table_name ILIKE '%config_history%'
             OR table_name ILIKE '%epo%' )
        ORDER BY table_name`,
    );
    console.log('Candidate snapshot/config tables:');
    console.table(tables.rows);

    // 2. Columns anywhere that match the 4 snapshot fields — strongest signal
    const cols = await pool.query(
      `SELECT table_name, column_name, data_type
         FROM information_schema.columns
        WHERE table_schema = 'public'
          AND ( column_name ILIKE '%epo5%'
             OR column_name ILIKE '%epo10%'
             OR column_name ILIKE '%epo_5%'
             OR column_name ILIKE '%epo_10%'
             OR column_name ILIKE '%uw_pipeline%'
             OR column_name ILIKE '%fraud_threshold%' )
        ORDER BY table_name, column_name`,
    );
    console.log('\nColumns matching EPO5/EPO10/UW Pipeline/Fraud Threshold:');
    console.table(cols.rows);

    // 3. Group the snapshot-field columns by table → shows which tables carry the full set
    const grouped = await pool.query(
      `SELECT table_name, COUNT(*) AS matched_fields,
              string_agg(column_name, ', ' ORDER BY column_name) AS columns
         FROM information_schema.columns
        WHERE table_schema = 'public'
          AND ( column_name ILIKE '%epo%'
             OR column_name ILIKE '%uw_pipeline%'
             OR column_name ILIKE '%fraud_threshold%' )
        GROUP BY table_name
        ORDER BY matched_fields DESC`,
    );
    console.log('\nTables grouped by snapshot-field column count:');
    console.table(grouped.rows);

    // 4. Recent Flyway migrations mentioning the snapshot tables (deployment evidence)
    try {
      const flyway = await pool.query(
        `SELECT version, description, installed_on, success
           FROM flyway_schema_history
          WHERE description ILIKE '%snapshot%'
             OR description ILIKE '%merchant settings%'
             OR script ILIKE '%snapshot%'
          ORDER BY installed_rank DESC
          LIMIT 20`,
      );
      console.log('\nFlyway migrations mentioning the snapshot tables:');
      console.table(flyway.rows);
    } catch (e) {
      console.log('\n(flyway_schema_history not queryable here:', (e as Error).message, ')');
    }
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

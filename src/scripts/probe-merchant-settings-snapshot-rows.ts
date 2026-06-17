import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

/** Read-only: full schema + sample rows of the merchant-settings snapshot tables. */
async function main() {
  const env = process.argv[2] ?? 'qa2';
  const cfg = new ConfigEnvironment(env);
  const pool = new pg.Pool({ connectionString: cfg.dbConnectionString, max: 1 });
  try {
    for (const t of [
      'uown_los_lead_merchant_settings_snapshot',
      'uown_sv_account_merchant_settings_snapshot',
    ]) {
      const cols = await pool.query(
        `SELECT column_name, data_type, is_nullable
           FROM information_schema.columns
          WHERE table_schema='public' AND table_name=$1
          ORDER BY ordinal_position`,
        [t],
      );
      console.log(`\n=== ${t} — columns ===`);
      console.table(cols.rows);
      const cnt = await pool.query(`SELECT COUNT(*)::int AS rows FROM ${t}`);
      console.log(`row count: ${cnt.rows[0].rows}`);
      const sample = await pool.query(`SELECT * FROM ${t} ORDER BY 1 DESC LIMIT 2`);
      console.log('sample rows:');
      console.dir(sample.rows, { depth: null });
    }
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

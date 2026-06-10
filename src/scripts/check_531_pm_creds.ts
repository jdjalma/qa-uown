import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const cfg = new ConfigEnvironment('qa1');
  const pool = new pg.Pool({ connectionString: cfg.dbConnectionString, max: 1 });
  try {
    const cols = await pool.query(
      `SELECT column_name FROM information_schema.columns
        WHERE table_name = 'uown_merchant'
          AND (column_name ILIKE '%user%' OR column_name ILIKE '%password%' OR column_name ILIKE '%name%' OR column_name ILIKE '%merchant_id%')
        ORDER BY ordinal_position`,
    );
    console.log('uown_merchant credential-related cols:');
    console.table(cols.rows);

    const m = await pool.query(
      `SELECT * FROM uown_merchant WHERE pk = 2812 LIMIT 1`,
    );
    const row = m.rows[0];
    const keys = Object.keys(row).filter((k) => /user|name|password|merchant_id|ref|pk/i.test(k) && !/web_user/i.test(k));
    console.log('\nMerchant 2812 credential-relevant fields:');
    const subset: Record<string, unknown> = {};
    for (const k of keys) subset[k] = row[k];
    console.table([subset]);
  } finally {
    await pool.end();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });

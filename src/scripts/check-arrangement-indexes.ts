/**
 * check-arrangement-indexes.ts
 *
 * Checks if payment_arrangement_pk columns have indexes.
 * Usage: npx tsx src/scripts/check-arrangement-indexes.ts stg
 */
import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

const TABLES = [
  'uown_sv_credit_card_transaction',
  'uown_sv_achpayment',
  'uown_los_credit_card_transaction',
];

const INDEX_SQL = `
  SELECT
    t.relname AS table_name,
    i.relname AS index_name,
    pg_get_indexdef(ix.indexrelid) AS index_def
  FROM pg_class t
  JOIN pg_index ix ON t.oid = ix.indrelid
  JOIN pg_class i ON i.oid = ix.indexrelid
  WHERE t.relname = $1
    AND pg_get_indexdef(ix.indexrelid) ILIKE '%payment_arrangement%'
`;

const ROW_ESTIMATE_SQL = `
  SELECT relname AS table_name, reltuples::bigint AS row_estimate
  FROM pg_class
  WHERE relname = $1
`;

async function main() {
  const envName = process.argv[2] ?? 'stg';
  const config = new ConfigEnvironment(envName);
  const client = new pg.Client({ connectionString: config.dbConnectionString });
  await client.connect();

  console.log(`\n${envName.toUpperCase()} — Indexes on payment_arrangement_pk\n`);

  for (const table of TABLES) {
    const estimate = await client.query(ROW_ESTIMATE_SQL, [table]);
    const rows = estimate.rows[0]?.row_estimate ?? '?';

    const result = await client.query(INDEX_SQL, [table]);
    if (result.rows.length > 0) {
      result.rows.forEach((r: Record<string, string>) =>
        console.log(`  ✅ ${table} (~${rows} rows) → ${r.index_name}\n     ${r.index_def}`),
      );
    } else {
      console.log(`  ❌ ${table} (~${rows} rows) → SEM INDEX em payment_arrangement_pk`);
    }
  }

  await client.end();
}

main().catch(console.error);

/**
 * estimate-index-time.ts
 *
 * Estimates time to create indexes on payment_arrangement_pk columns.
 * Uses table size + row count to give a rough estimate.
 * Usage: npx tsx src/scripts/estimate-index-time.ts stg
 */
import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

const SQL = `
  SELECT
    c.relname AS table_name,
    c.reltuples::bigint AS row_estimate,
    pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size,
    pg_total_relation_size(c.oid) AS size_bytes
  FROM pg_class c
  WHERE c.relname IN (
    'uown_sv_credit_card_transaction',
    'uown_sv_achpayment',
    'uown_los_credit_card_transaction'
  )
  ORDER BY c.reltuples DESC
`;

async function main() {
  const envName = process.argv[2] ?? 'stg';
  const config = new ConfigEnvironment(envName);
  const client = new pg.Client({ connectionString: config.dbConnectionString });
  await client.connect();

  const result = await client.query(SQL);

  console.log(`\n${envName.toUpperCase()} — Estimativa de tempo para CREATE INDEX CONCURRENTLY\n`);
  console.log('CONCURRENTLY faz 2 full scans na tabela. Estimativa: ~50-100 MB/s em disco.\n');

  for (const r of result.rows) {
    const sizeBytes = Number(r.size_bytes);
    const sizeMB = sizeBytes / (1024 * 1024);
    // CONCURRENTLY = 2 scans. Conservative estimate: 50 MB/s
    const estimateSec = (sizeMB * 2) / 50;
    const estimateMin = estimateSec / 60;

    console.log(`  ${r.table_name}`);
    console.log(`    Rows: ~${Number(r.row_estimate).toLocaleString()}`);
    console.log(`    Tamanho: ${r.total_size}`);
    console.log(`    Estimativa: ~${estimateSec.toFixed(0)}s (${estimateMin.toFixed(1)} min)\n`);
  }

  await client.end();
}

main().catch(console.error);

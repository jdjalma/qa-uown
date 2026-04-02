/**
 * check-fk-constraints.ts
 *
 * Compares FK constraints between environments.
 * Usage: npx tsx src/scripts/check-fk-constraints.ts qa1 stg
 */
import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

const SQL = `
  SELECT conname, conrelid::regclass AS table_name
  FROM pg_constraint
  WHERE conname IN ('fk_uown_cc_transaction_arrangement', 'fk_uown_ach_payment_arrangement')
`;

async function main() {
  const envs = process.argv.slice(2);
  if (envs.length === 0) {
    console.log('Usage: npx tsx src/scripts/check-fk-constraints.ts qa1 stg');
    process.exit(1);
  }

  for (const envName of envs) {
    const config = new ConfigEnvironment(envName);
    const client = new pg.Client({ connectionString: config.dbConnectionString });
    await client.connect();
    const result = await client.query(SQL);
    console.log(`\n${envName.toUpperCase()} — FK constraints: ${result.rows.length}`);
    if (result.rows.length > 0) {
      result.rows.forEach((r: Record<string, string>) =>
        console.log(`  ${r.conname} → ${r.table_name}`),
      );
    } else {
      console.log('  (nenhuma FK constraint encontrada)');
    }
    await client.end();
  }
}

main().catch(console.error);

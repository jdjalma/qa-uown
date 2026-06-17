import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

// READ-ONLY probe — svc#554 NeuroID config across ALL config-ish tables.
const env = process.argv[2] ?? 'qa2';
const NEEDLE = `(lower(key) LIKE '%neuro%' OR lower(key) LIKE '%interaction%'
  OR lower(key) LIKE '%profile.not.found%' OR lower(key) LIKE '%approve.on%')`;

async function main() {
  const cfg = new ConfigEnvironment(env);
  const pool = new pg.Pool({ connectionString: cfg.dbConnectionString, max: 1 });
  try {
    for (const [tbl, kcol, vcol] of [
      ['uown_configuration_management', 'key', 'value'],
      ['appdbsettings', 'key', 'value'],
      ['uown_sv_sql_config', 'key', 'value'],
      ['uown_state_configurations', 'key', 'value'],
    ] as const) {
      console.log(`\n=== [${env}] ${tbl} ===`);
      try {
        const cols = await pool.query(
          `SELECT column_name FROM information_schema.columns WHERE table_name=$1 ORDER BY ordinal_position`, [tbl]);
        const colNames = cols.rows.map((r: any) => r.column_name);
        console.log('columns:', colNames.join(', '));
        const kc = colNames.includes(kcol) ? kcol : colNames.find((c: string) => /key|name|setting|prop/i.test(c));
        if (!kc) { console.log('  (no key-like column; skipping needle search)'); continue; }
        const r = await pool.query(
          `SELECT * FROM ${tbl} WHERE ${NEEDLE.replace(/key/g, kc)} LIMIT 25`);
        console.log(`  rows matching neuroid needle: ${r.rowCount}`);
        if (r.rowCount) console.table(r.rows);
      } catch (e) { console.log('  table query failed:', (e as Error).message); }
    }
  } finally {
    await pool.end();
  }
}
main().catch((e) => { console.error('ERR:', (e as Error).message); process.exit(1); });

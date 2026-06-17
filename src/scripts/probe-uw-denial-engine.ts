import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

/**
 * Read-only: shows which UW engine decided a lead (internal BlackBox/ABB vs the
 * mocked short-circuit) by dumping its activity log + outbound API calls. Use to
 * verify whether an environment honours the "SSN ending-in-9 → UW_DENIED" mock.
 * Usage: npx tsx src/scripts/probe-uw-denial-engine.ts [env] [leadPk]
 */
async function main() {
  const env = process.argv[2] ?? 'qa2';
  const leadPk = process.argv[3];
  if (!leadPk) { console.error('Pass a leadPk: npx tsx src/scripts/probe-uw-denial-engine.ts qa2 <leadPk>'); process.exit(1); }
  const cfg = new ConfigEnvironment(env);
  const pool = new pg.Pool({ connectionString: cfg.dbConnectionString, max: 1, connectionTimeoutMillis: 5000 });
  console.log(`\n=== UW denial-engine probe — env=${env} lead_pk=${leadPk} ===\n`);
  try {
    const notes = await pool.query(
      `SELECT pk, agent, left(notes, 180) AS notes, row_created_timestamp
         FROM uown_los_lead_notes WHERE lead_pk = $1 ORDER BY pk ASC`, [leadPk]);
    console.log(`activity log (${notes.rows.length} notes, oldest→newest):`);
    for (const n of notes.rows) console.log(`  [${n.agent}] ${n.notes}`);

    const outbound = await pool.query(
      `SELECT pk, left(url, 95) AS url, row_created_timestamp
         FROM uown_los_outbound_api_log WHERE lead_pk = $1 ORDER BY pk ASC LIMIT 40`, [leadPk]);
    console.log(`\noutbound API calls (${outbound.rows.length}) — which UW engine?:`);
    for (const o of outbound.rows) console.log(`  ${o.url}`);
  } finally { await pool.end(); }
}
main().catch(e=>{console.error('PROBE ERROR:', e.message);process.exit(2);});

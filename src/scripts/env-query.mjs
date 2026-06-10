// Read-only query helper for discovery, env-driven. Usage:
//   node src/scripts/env-query.mjs "SELECT ..."            (env from ENV= in .env)
//   QUERY_ENV=qa1 node src/scripts/env-query.mjs "SELECT ..."  (explicit override)
// Guard: only SELECT / WITH allowed (rule #9 / Exception 3 — no INSERT/UPDATE/DELETE).
import fs from 'node:fs';
import pg from 'pg';

const env = {};
for (const line of fs.readFileSync(new URL('../../.env', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const target = (process.env.QUERY_ENV || env.ENV || '').toLowerCase();
const suffix = { sandbox: 'SBX', sbx: 'SBX' }[target] || target.toUpperCase();
if (!env[`UOWN_DB_URL_${suffix}`]) {
  console.error(`No UOWN_DB_URL_${suffix} in .env (target env: "${target}")`); process.exit(2);
}

const sql = process.argv[2];
if (!sql) { console.error('Usage: node src/scripts/env-query.mjs "SELECT ..."'); process.exit(2); }
if (!/^\s*(select|with)\b/i.test(sql) || /\b(insert|update|delete|drop|alter|truncate|create|grant|revoke)\b/i.test(sql)) {
  console.error('REFUSED: only read-only SELECT/WITH queries are allowed.'); process.exit(3);
}

const url = new URL(env[`UOWN_DB_URL_${suffix}`].replace(/^jdbc:/, ''));
url.username = env[`UOWN_DB_USER_${suffix}`]; url.password = env[`UOWN_DB_PASS_${suffix}`] || '';
const pool = new pg.Pool({ connectionString: url.toString(), max: 1 });
try {
  const r = await pool.query(sql);
  console.log(`env=${target} rows=${r.rows.length}`);
  console.dir(r.rows, { depth: null, maxArrayLength: null });
} catch (e) {
  console.error(`ERR: ${e.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}

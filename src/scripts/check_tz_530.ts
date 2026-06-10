import 'dotenv/config';
import { Pool } from 'pg';
const env = (process.env.ENV ?? 'qa1').toUpperCase();
const raw = process.env[`UOWN_DB_URL_${env}`]!;
const u = new URL(raw.replace(/^jdbc:/, ''));
u.username = process.env[`UOWN_DB_USER_${env}`]!;
u.password = process.env[`UOWN_DB_PASS_${env}`]!;
const pool = new Pool({ connectionString: u.toString() });
(async () => {
  const t = new Date();
  console.log('JS Date.now ISO:', t.toISOString());
  console.log('JS Date toString:', t.toString());
  const r = await pool.query("SELECT NOW() at time zone 'UTC' AS db_utc, NOW() AS db_now, current_setting('TimeZone') AS tz");
  console.log('DB now:', r.rows[0]);
  const r2 = await pool.query("SELECT $1::timestamp AS as_ts, $1::timestamptz AS as_tstz", [t.toISOString()]);
  console.log('parse iso:', r2.rows[0]);

  // Simulate test query for lead 11755
  const r3 = await pool.query(
    `SELECT pk, lead_pk, notes, row_created_timestamp
     FROM uown_los_lead_notes
     WHERE lead_pk = $1 AND row_created_timestamp >= $2::timestamp - INTERVAL '2 hours'
     ORDER BY pk DESC LIMIT 30`,
    [11755, t.toISOString()]);
  console.log(`\nSim test query lead=11755 ts=${t.toISOString()} -> ${r3.rowCount} rows`);
  // What is now - 2h DB-side?
  const r4 = await pool.query("SELECT ($1::timestamp - INTERVAL '2 hours') AS window_start", [t.toISOString()]);
  console.log('window_start:', r4.rows[0]);

  // Lead notes max ts
  const r5 = await pool.query("SELECT MAX(row_created_timestamp) AS mx FROM uown_los_lead_notes WHERE lead_pk=$1", [11755]);
  console.log('lead 11755 max ts:', r5.rows[0]);
  await pool.end();
})();

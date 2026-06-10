import 'dotenv/config';
import { Pool } from 'pg';

const env = (process.env.ENV ?? 'qa1').toUpperCase();
const raw = process.env[`UOWN_DB_URL_${env}`];
const user = process.env[`UOWN_DB_USER_${env}`];
const pass = process.env[`UOWN_DB_PASS_${env}`];
if (!raw || !user || !pass) throw new Error(`Missing UOWN_DB_*_${env}`);

const stripped = raw.replace(/^jdbc:/, '');
const u = new URL(stripped);
u.username = user;
u.password = pass;

const pool = new Pool({ connectionString: u.toString() });
(async () => {
  for (const pk of [11755, 11757, 11748, 11739]) {
    const r = await pool.query(
      `SELECT pk, lead_pk, notes, row_created_timestamp
       FROM uown_los_lead_notes
       WHERE lead_pk = $1
       ORDER BY pk DESC LIMIT 20`, [pk]);
    console.log(`\n=== lead_notes lead_pk=${pk} -> ${r.rowCount} rows ===`);
    for (const row of r.rows) console.log(`pk=${row.pk} ts=${row.row_created_timestamp?.toISOString?.()} notes="${(row.notes ?? '').slice(0,140)}"`);
  }
  for (const pk of [11755, 11757]) {
    try {
      const r = await pool.query(
        `SELECT pk, lead_pk, account_pk, log_type, body, row_created_timestamp
         FROM uown_sv_activity_log WHERE lead_pk = $1 ORDER BY pk DESC LIMIT 20`, [pk]);
      console.log(`\n=== sv_activity_log lead_pk=${pk} -> ${r.rowCount} rows ===`);
      for (const row of r.rows) console.log(`pk=${row.pk} log_type=${row.log_type} body="${(row.body ?? '').slice(0,140)}"`);
    } catch (e: any) {
      console.log(`sv_activity_log lead_pk=${pk}: ${e.message}`);
    }
  }
  const cols = await pool.query(
    `SELECT column_name, data_type FROM information_schema.columns
     WHERE table_name='uown_los_lead_notes' ORDER BY ordinal_position`);
  console.log('\n=== uown_los_lead_notes schema ===');
  for (const c of cols.rows) console.log(`${c.column_name} ${c.data_type}`);

  const r3 = await pool.query(
    `SELECT pk, lead_pk, notes, row_created_timestamp
     FROM uown_los_lead_notes
     WHERE lead_pk IN (11755, 11757, 11748)
     ORDER BY pk DESC LIMIT 60`);
  console.log(`\n=== ANY notes for those leads -> ${r3.rowCount} ===`);
  for (const row of r3.rows) console.log(`lead=${row.lead_pk} pk=${row.pk} ts=${row.row_created_timestamp?.toISOString?.()} notes="${(row.notes ?? '').slice(0,140)}"`);

  await pool.end();
})().catch((e) => { console.error(e); process.exit(1); });

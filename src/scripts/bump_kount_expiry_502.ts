/** Bump kount token expiry forward so CT-01 has a valid pre-condition. AUTHORIZED. */
import { Pool } from 'pg';

const pool = new Pool({
  host: '127.0.0.1', port: 5445, user: 'svc_user', password: 'F1nTech', database: 'svc',
});

async function main() {
  const r = await pool.query(
    `UPDATE uown_kount_token SET expiration_time = now() + interval '60 minutes' WHERE pk = 1 RETURNING pk, expiration_time`,
  );
  console.log('updated:', r.rows[0]);
  await pool.end();
}
main().catch((e) => { console.error(e); process.exit(1); });

import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const env = process.argv[2] ?? 'qa1';
  const config = new ConfigEnvironment(env);
  const pool = new pg.Pool({ connectionString: config.dbConnectionString, max: 1 });

  try {
    const result = await pool.query(`
      SELECT a.pk, a.account_status, a.rating
      FROM uown_sv_account a
      WHERE a.account_status = 'ACTIVE'
        AND (a.rating IS NULL OR a.rating NOT IN ('B','C','P'))
        AND NOT EXISTS (
          SELECT 1 FROM uown_sv_payment_arrangement pa
          WHERE pa.account_pk = a.pk AND pa.is_active = true
        )
      ORDER BY a.pk DESC
      LIMIT 20
    `);
    for (const r of result.rows) {
      console.log(`pk=${r.pk}, status=${r.account_status}, rating=${r.rating}`);
    }
  } finally {
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

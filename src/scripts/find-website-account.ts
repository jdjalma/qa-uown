import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const envName = process.argv[2] ?? 'qa2';
  const accountPk = process.argv[3] ?? '10855';
  const env = new ConfigEnvironment(envName);
  const pool = new pg.Pool({ connectionString: env.dbConnectionString, max: 1 });
  try {
    const result = await pool.query(`
      SELECT sp.pk, sp.area_code, sp.phone_number, sp.phone_type, sp.customer_pk
      FROM uown_sv_phone sp
      WHERE sp.account_pk = $1
      LIMIT 5
    `, [accountPk]);
    console.log(JSON.stringify(result.rows, null, 2));
  } finally {
    await pool.end();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });

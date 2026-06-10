import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';
const cfg = new ConfigEnvironment(process.argv[2] ?? 'qa1');
const pool = new pg.Pool({ connectionString: (cfg as any).dbConnectionString, max: 1 });
(async () => {
  try {
    console.log('\n=== Merchant integration_type distribution ===');
    const r = await pool.query(
      `SELECT m.ref_merchant_code, m.merchant_name, m.integration_type, m.merchant_type
       FROM uown_merchant m
       WHERE m.ref_merchant_code IN ('KS3015','KS5936','OL90202-0001','LL90203-0004','LL90203-0007','OL90205-0043_fernand')
       ORDER BY m.ref_merchant_code`);
    console.table(r.rows);
  } catch (e: any) { console.error(e.message); }
  await pool.end();
})();

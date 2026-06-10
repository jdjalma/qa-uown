import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const envName = (process.env.ENV as 'qa1') || 'qa1';
  const cfg = new ConfigEnvironment(envName);
  const pool = new pg.Pool({ connectionString: cfg.dbConnectionString, max: 1 });
  try {
    const names = ['GETLOSSIMPLESEARCHRESULTS', 'GETSVCSIMPLESEARCHRESULTS', 'GETLOSLEADSBYEMAIL'];
    for (const n of names) {
      const r = await pool.query(
        'SELECT sql_name, length(sql_query) AS len, sql_query FROM uown_sv_sql_config WHERE sql_name = $1',
        [n],
      );
      console.log(`\n========= ${n} =========`);
      if (r.rows.length === 0) {
        console.log('(not found)');
        continue;
      }
      console.log(`length: ${r.rows[0].len}`);
      console.log(r.rows[0].sql_query);
    }
  } finally {
    await pool.end();
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});

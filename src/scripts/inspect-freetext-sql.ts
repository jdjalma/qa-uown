import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const cfg = new ConfigEnvironment('qa1');
  const pool = new pg.Pool({ connectionString: cfg.dbConnectionString, max: 1 });
  try {
    const r = await pool.query(
      `SELECT sql_name, sql_query FROM uown_sv_sql_config
       WHERE UPPER(sql_name) IN ('GETLOSSEARCH_FREETEXT','GETLOSSEARCH_BYNAME','GETLOSSEARCH_BYLAST4CC','GETLOSSEARCH_BYLEADPK')
       ORDER BY sql_name`,
    );
    for (const row of r.rows) {
      console.log(`\n========= ${row.sql_name} =========`);
      // Extract just the SELECT column list of the first branch + alias hints for createdTimestamp/rowCreatedTime
      const q = row.sql_query as string;
      const hits = [];
      for (const m of q.matchAll(/row_created_timestamp\s+AS\s+\w+/gi)) hits.push(m[0]);
      console.log('row_created_timestamp aliases found:');
      hits.forEach((h, i) => console.log(`  ${i + 1}. ${h}`));
    }
  } finally {
    await pool.end();
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});

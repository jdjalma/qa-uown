import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const cfg = new ConfigEnvironment('qa1');
  const pool = new pg.Pool({ connectionString: cfg.dbConnectionString, max: 1 });
  try {
    // Full payloads for the BAD_REQUEST rows on sendApplication
    const rows = await pool.query(
      `SELECT pk, row_created_timestamp, request, response
         FROM uown_los_inbound_api_log
        WHERE row_created_timestamp >= '2026-05-24 10:00:00'::timestamp
          AND url ILIKE '%sendApplication%'
          AND response ILIKE '%BAD_REQUEST%'
        ORDER BY pk DESC
        LIMIT 4`,
    );
    console.log(`BAD_REQUEST on sendApplication — count=${rows.rows.length}`);
    for (const r of rows.rows) {
      console.log(`\n--- pk=${r.pk} ts=${r.row_created_timestamp} ---`);
      console.log('REQUEST excerpt:', String(r.request ?? '').replace(/\s+/g, ' ').slice(0, 500));
      console.log('RESPONSE excerpt:', String(r.response ?? '').replace(/\s+/g, ' ').slice(0, 700));
    }

    // StringIndexOutOfBoundsException on missing-fields
    const oobe = await pool.query(
      `SELECT pk, row_created_timestamp, url, request, LEFT(stack_trace, 600) AS stack
         FROM uown_los_inbound_api_log
        WHERE row_created_timestamp >= '2026-05-24 10:00:00'::timestamp
          AND stack_trace ILIKE '%StringIndexOutOfBounds%'
        ORDER BY pk DESC
        LIMIT 3`,
    );
    console.log(`\n\nStringIndexOutOfBounds — count=${oobe.rows.length}`);
    for (const r of oobe.rows) {
      console.log(`\n--- pk=${r.pk} ts=${r.row_created_timestamp} ---`);
      console.log('  url:', r.url);
      console.log('  request:', String(r.request ?? '').slice(0, 200));
      console.log('  stack:', String(r.stack ?? '').replace(/\s+/g, ' ').slice(0, 400));
    }

    // Settle "No data associated"
    const settle = await pool.query(
      `SELECT pk, row_created_timestamp, url, request, LEFT(stack_trace, 600) AS stack
         FROM uown_los_inbound_api_log
        WHERE row_created_timestamp >= '2026-05-24 10:00:00'::timestamp
          AND stack_trace ILIKE '%No data associated%'
        ORDER BY pk DESC
        LIMIT 3`,
    );
    console.log(`\n\nNo data associated (settleApplication) — count=${settle.rows.length}`);
    for (const r of settle.rows) {
      console.log(`\n--- pk=${r.pk} ts=${r.row_created_timestamp} ---`);
      console.log('  url:', r.url);
      console.log('  request:', String(r.request ?? '').slice(0, 200));
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });

/** Diagnostic for #502 — show real DB state for token tables, with epoch math
 *  to reason about TZ behaviour without trusting pg-node's Date parsing.
 */
import { Pool } from 'pg';

const pool = new Pool({
  host: '127.0.0.1', port: 5445, user: 'svc_user', password: 'F1nTech', database: 'svc',
});

async function main() {
  const t0 = Math.floor(Date.now() / 1000);
  console.log('JS Date.now() epoch:', t0);

  for (const t of ['uown_kount_token', 'uown_gds_token']) {
    const r = await pool.query(
      `SELECT pk,
              length(access_token) AS tok_len,
              EXTRACT(EPOCH FROM expiration_time)::bigint AS exp_epoch,
              EXTRACT(EPOCH FROM row_created_timestamp)::bigint AS created_epoch,
              EXTRACT(EPOCH FROM row_updated_timestamp)::bigint AS updated_epoch,
              EXTRACT(EPOCH FROM now())::bigint AS db_now_epoch
       FROM ${t} ORDER BY pk`,
    );
    console.log(`\n${t}:`);
    for (const row of r.rows) {
      const expDelta = Number(row.exp_epoch) - t0;
      const createdDelta = Number(row.created_epoch) - t0;
      const updatedDelta = row.updated_epoch ? Number(row.updated_epoch) - t0 : null;
      console.log(
        '  pk=', row.pk,
        ' tok_len=', row.tok_len,
        ' exp_in=', expDelta, 's',
        ' created_ago=', -createdDelta, 's',
        ' updated_ago=', updatedDelta != null ? -updatedDelta : null, 's',
      );
    }
  }
  await pool.end();
}
main().catch((e) => { console.error(e); process.exit(1); });

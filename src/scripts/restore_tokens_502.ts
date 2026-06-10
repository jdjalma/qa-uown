/**
 * One-shot helper for #502 qa-flow: restore pk=1 on both token tables in qa2
 * after CT-03 mutations. Used because the sweep itself fails to recreate pk=1
 * (confirmed application bug — JPA ignores explicit setPk on @GeneratedValue
 *  entity).
 *
 * AUTHORIZED MUTATION (CLAUDE.md Exception 3, qa-flow scope, user explicit ack).
 *
 * Strategy:
 *  - kount: copy newest existing row (e.g. pk=3) into pk=1; delete spurious pks
 *  - gds:   insert pk=1 with placeholder access_token if missing — the next
 *           Quartz sweep (every 10 min) will replace it. NOT NULL constraint
 *           on access_token requires non-null value.
 */
import { Pool } from 'pg';

const pool = new Pool({
  host: '127.0.0.1',
  port: 5445,
  user: 'svc_user',
  password: 'F1nTech',
  database: 'svc',
});

async function ensureKountPk1() {
  const existing = await pool.query(
    `SELECT pk, access_token, expiration_time FROM uown_kount_token ORDER BY pk`,
  );
  console.log('[kount] existing rows:', existing.rows.map((r) => r.pk));

  const hasPk1 = existing.rows.some((r) => Number(r.pk) === 1);
  if (hasPk1) {
    console.log('[kount] pk=1 already present — nothing to do');
    return;
  }

  const newest = [...existing.rows].sort(
    (a, b) => new Date(b.expiration_time).getTime() - new Date(a.expiration_time).getTime(),
  )[0];

  if (newest) {
    console.log(`[kount] copying pk=${newest.pk} into pk=1, then deleting other rows`);
    await pool.query(
      `INSERT INTO uown_kount_token (pk, row_created_timestamp, row_updated_timestamp, tenant_id, access_token, expiration_time)
       SELECT 1, row_created_timestamp, row_updated_timestamp, tenant_id, access_token, expiration_time
       FROM uown_kount_token WHERE pk = $1`,
      [newest.pk],
    );
    const del = await pool.query(`DELETE FROM uown_kount_token WHERE pk <> 1`);
    console.log(`[kount] deleted ${del.rowCount} stray rows`);
  } else {
    console.log('[kount] no rows at all — inserting placeholder pk=1');
    await pool.query(
      `INSERT INTO uown_kount_token (pk, row_created_timestamp, row_updated_timestamp, access_token, expiration_time)
       VALUES (1, now(), now(), 'PLACEHOLDER_QA2_RESTORE_502', now() + interval '60 minutes')`,
    );
  }
}

async function ensureGdsPk1() {
  const existing = await pool.query(
    `SELECT pk FROM uown_gds_token ORDER BY pk`,
  );
  console.log('[gds] existing rows:', existing.rows.map((r) => r.pk));

  const hasPk1 = existing.rows.some((r) => Number(r.pk) === 1);
  if (hasPk1) {
    console.log('[gds] pk=1 already present — nothing to do');
    return;
  }

  console.log('[gds] inserting placeholder pk=1 (next sweep will refresh)');
  await pool.query(
    `INSERT INTO uown_gds_token (pk, row_created_timestamp, row_updated_timestamp, access_token, expiration_time)
     VALUES (1, now(), now(), 'PLACEHOLDER_QA2_RESTORE_502', now() + interval '60 minutes')`,
  );
}

async function main() {
  await ensureKountPk1();
  await ensureGdsPk1();

  const final = await pool.query(
    `SELECT 'kount' AS svc, pk, access_token IS NOT NULL AS has_token, expiration_time, expiration_time > now() AS valid FROM uown_kount_token
     UNION ALL
     SELECT 'gds' AS svc, pk, access_token IS NOT NULL, expiration_time, expiration_time > now() FROM uown_gds_token
     ORDER BY svc, pk`,
  );
  console.log('\nFINAL STATE:');
  for (const r of final.rows) console.log(JSON.stringify(r));

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

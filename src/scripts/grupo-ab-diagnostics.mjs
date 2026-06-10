import fs from 'node:fs';
import pg from 'pg';

const env = {};
for (const line of fs.readFileSync(new URL('../../.env', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const url = new URL(env.UOWN_DB_URL_DEV3.replace(/^jdbc:/, ''));
url.username = env.UOWN_DB_USER_DEV3;
url.password = env.UOWN_DB_PASS_DEV3 || '';
const pool = new pg.Pool({ connectionString: url.toString(), max: 1 });

const q = async (label, sql, params = []) => {
  try {
    const r = await pool.query(sql, params);
    console.log(`\n### ${label} (${r.rows.length} rows)`);
    console.dir(r.rows, { depth: null, maxArrayLength: null });
    return r.rows;
  } catch (e) {
    console.log(`\n### ${label}\n  ERR: ${e.message}`);
    return [];
  }
};

// ═══════════════════════════════════════════════════════
// GRUPO A — paymentGatewayFixSweep
// ═══════════════════════════════════════════════════════
console.log('\n\n========== GRUPO A: paymentGatewayFixSweep ==========');

const sweepSqlRows = await q(
  'A1: sweep SQL definition',
  `SELECT scheduled_task_name, is_active, last_trigger_time, sql_to_pick_accounts
   FROM uown_scheduled_task
   WHERE scheduled_task_name = 'paymentGatewayFixSweep'`
);

const sweepSql = sweepSqlRows[0]?.sql_to_pick_accounts ?? null;
console.log('\n--- A1: raw sql_to_pick_accounts ---\n', sweepSql ?? '(not found)');

// Execute the sweep's own SQL if available
if (sweepSql) {
  await q('A2: rows selected by sweep SQL', sweepSql);
}

// Direct check of CC transactions with ERROR + null gateway_transaction_id
await q(
  'A3: uown_sv_credit_card_transaction ERROR + gateway_transaction_id IS NULL',
  `SELECT pk, account_pk, status, row_created_timestamp, gateway_transaction_id, vendor, amount
   FROM uown_sv_credit_card_transaction
   WHERE status = 'ERROR'
     AND gateway_transaction_id IS NULL
   ORDER BY pk
   LIMIT 20`
);

// Check specifically for row_created_timestamp IS NULL
const nullTimestampRows = await q(
  'A4: rows with row_created_timestamp IS NULL (NPE cause)',
  `SELECT pk, account_pk, status, row_created_timestamp, gateway_transaction_id, vendor, amount
   FROM uown_sv_credit_card_transaction
   WHERE status = 'ERROR'
     AND gateway_transaction_id IS NULL
     AND row_created_timestamp IS NULL
   ORDER BY pk`
);

const nullCount = nullTimestampRows.length;
console.log(`\n--- A4 summary: ${nullCount} rows with row_created_timestamp IS NULL ---`);

// Recent sweep logs for paymentGatewayFixSweep
await q(
  'A5: recent sweep_logs for paymentGatewayFixSweep',
  `SELECT pk, sweep_name, number_of_records_processed, start_time, end_time,
          left(coalesce(error,''), 300) AS error
   FROM uown_sweep_logs
   WHERE sweep_name = 'paymentGatewayFixSweep'
   ORDER BY pk DESC
   LIMIT 10`
);

// ═══════════════════════════════════════════════════════
// APPLY FIX — UPDATE row_created_timestamp (authorized)
// ═══════════════════════════════════════════════════════
if (nullCount > 0) {
  console.log(`\n--- A6: Applying UPDATE to ${nullCount} rows (authorized) ---`);
  await q(
    'A6: UPDATE row_created_timestamp = NOW() for NULL rows',
    `UPDATE uown_sv_credit_card_transaction
     SET row_created_timestamp = NOW()
     WHERE row_created_timestamp IS NULL
       AND status = 'ERROR'
       AND gateway_transaction_id IS NULL
     RETURNING pk, account_pk, row_created_timestamp`
  );

  // Verify fix
  await q(
    'A6-verify: rows still NULL after update',
    `SELECT count(*) AS still_null
     FROM uown_sv_credit_card_transaction
     WHERE status = 'ERROR'
       AND gateway_transaction_id IS NULL
       AND row_created_timestamp IS NULL`
  );
} else {
  console.log('\n--- A6: No rows with NULL row_created_timestamp — UPDATE not needed ---');
}

// ═══════════════════════════════════════════════════════
// TRIGGER sweep via HTTP
// ═══════════════════════════════════════════════════════
console.log('\n--- A7: Triggering paymentGatewayFixSweep via API ---');
try {
  const res = await fetch(
    'https://svc-dev3.uownleasing.com/uown/svc/triggerScheduledTask/paymentGatewayFixSweep',
    {
      method: 'POST',
      headers: {
        Authorization: env.UOWN_API_AUTHORIZATION,
        'Content-Type': 'application/json',
      },
    }
  );
  const body = await res.text();
  console.log(`HTTP ${res.status}: ${body.substring(0, 300)}`);
} catch (e) {
  console.log(`Trigger error: ${e.message}`);
}

// Wait a few seconds for the sweep to run
console.log('\n--- A7: Waiting 8 seconds for sweep to complete ---');
await new Promise(r => setTimeout(r, 8000));

// Check sweep logs after trigger
await q(
  'A7-post: sweep_logs after trigger',
  `SELECT pk, sweep_name, number_of_records_processed, start_time, end_time,
          left(coalesce(error,''), 500) AS error
   FROM uown_sweep_logs
   WHERE sweep_name = 'paymentGatewayFixSweep'
   ORDER BY pk DESC
   LIMIT 5`
);

// ═══════════════════════════════════════════════════════
// GRUPO B — dailyTaxCloudRefundsSync
// ═══════════════════════════════════════════════════════
console.log('\n\n========== GRUPO B: dailyTaxCloudRefundsSync ==========');

await q(
  'B1: sweep SQL — dailyTaxCloudRefundsSync',
  `SELECT scheduled_task_name, is_active, last_trigger_time, sql_to_pick_accounts
   FROM uown_scheduled_task
   WHERE scheduled_task_name = 'dailyTaxCloudRefundsSync'`
);

await q(
  'B1b: sweep SQL — dailyTaxCloudPaymentsSync (working, for comparison)',
  `SELECT scheduled_task_name, is_active, last_trigger_time, sql_to_pick_accounts
   FROM uown_scheduled_task
   WHERE scheduled_task_name = 'dailyTaxCloudPaymentsSync'`
);

await q(
  'B2: uown_configuration_management — taxcloud keys',
  `SELECT key, value
   FROM uown_configuration_management
   WHERE LOWER(key) LIKE '%taxcloud%'
      OR LOWER(key) LIKE '%tax_cloud%'
   ORDER BY key`
);

await q(
  'B3: uown_tax_cloud — recent records',
  `SELECT pk, payment_pk, status, row_created_timestamp
   FROM uown_tax_cloud
   ORDER BY pk DESC
   LIMIT 10`
);

await q(
  'B4: sweep_logs — TaxCloud both syncs',
  `SELECT pk, sweep_name, number_of_records_processed, start_time, end_time,
          left(coalesce(error,''), 300) AS error
   FROM uown_sweep_logs
   WHERE sweep_name IN ('dailyTaxCloudPaymentsSync', 'dailyTaxCloudRefundsSync')
   ORDER BY pk DESC
   LIMIT 20`
);

await q(
  'B5: tables with tax in name',
  `SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
     AND table_name ILIKE '%tax%'
   ORDER BY table_name`
);

// Check for payments that should be picked by refunds sync
await q(
  'B6: uown_sv_payment with reverse_date_timestamp not null (refund candidates)',
  `SELECT pk, account_pk, amount, status, reverse_date_timestamp, row_created_timestamp
   FROM uown_sv_payment
   WHERE reverse_date_timestamp IS NOT NULL
   ORDER BY reverse_date_timestamp DESC
   LIMIT 10`
);

// Check if there's a separate tax_cloud_refund table or similar
await q(
  'B7: uown_tax_cloud columns (full schema)',
  `SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name = 'uown_tax_cloud'
   ORDER BY ordinal_position`
);

// Check all TaxCloud-related scheduled tasks
await q(
  'B8: all TaxCloud scheduled tasks',
  `SELECT scheduled_task_name, is_active, last_trigger_time,
          left(coalesce(sql_to_pick_accounts,''), 300) AS sql_preview
   FROM uown_scheduled_task
   WHERE LOWER(scheduled_task_name) LIKE '%taxcloud%'
      OR LOWER(scheduled_task_name) LIKE '%tax%'
   ORDER BY scheduled_task_name`
);

await pool.end();
console.log('\n\n=== DONE ===');

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
// GRUPO A — check sweep result after fix
// ═══════════════════════════════════════════════════════
console.log('\n\n========== GRUPO A: Post-fix sweep result ==========');

await q(
  'A-final: latest paymentGatewayFixSweep log',
  `SELECT pk, sweep_name, number_of_records_processed, start_time, end_time,
          left(coalesce(error,''), 500) AS error
   FROM uown_sweep_logs
   WHERE sweep_name = 'paymentGatewayFixSweep'
   ORDER BY pk DESC
   LIMIT 3`
);

// Check if pk 3387 (the fixed row) was actually processed
await q(
  'A-final: check pk 3387 after sweep',
  `SELECT pk, account_pk, status, row_created_timestamp, gateway_transaction_id, vendor, amount, posting_date
   FROM uown_sv_credit_card_transaction
   WHERE pk = 3387`
);

// Check pk 3391 and 3392 (the rows selected by the sweep SQL)
await q(
  'A-final: pk 3391 and 3392 (selected by sweep)',
  `SELECT pk, account_pk, status, row_created_timestamp, gateway_transaction_id, gateway_response, vendor, amount, posting_date, cc_action
   FROM uown_sv_credit_card_transaction
   WHERE pk IN (3391, 3392)`
);

// Check if there's a payment created for account 223 today
await q(
  'A-final: recent payments for account 223',
  `SELECT pk, account_pk, status, row_created_timestamp, cc_pk, amount_paid
   FROM uown_sv_payment
   WHERE account_pk = 223
   ORDER BY pk DESC
   LIMIT 5`
);

// ═══════════════════════════════════════════════════════
// GRUPO B — deeper investigation
// ═══════════════════════════════════════════════════════
console.log('\n\n========== GRUPO B: deeper TaxCloud investigation ==========');

// Actual columns of uown_sv_payment
await q(
  'B-schema: uown_sv_payment columns',
  `SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name = 'uown_sv_payment'
   ORDER BY ordinal_position`
);

// Actual columns of uown_tax_cloud_outbound
await q(
  'B-schema: uown_tax_cloud_outbound columns',
  `SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name = 'uown_tax_cloud_outbound'
   ORDER BY ordinal_position`
);

// uown_tax_cloud records
await q(
  'B3-fixed: uown_tax_cloud recent records',
  `SELECT pk, order_id, status, account_pk, api, row_created_timestamp
   FROM uown_tax_cloud
   ORDER BY pk DESC
   LIMIT 20`
);

// uown_tax_cloud_outbound records
await q(
  'B3b: uown_tax_cloud_outbound recent records',
  `SELECT *
   FROM uown_tax_cloud_outbound
   ORDER BY pk DESC
   LIMIT 10`
);

// The refund sync SQL uses usp.status = 'REVERSED' AND reverse_date_timestamp = TODAY
// Let's see what payments exist with REVERSED status
await q(
  'B6-fixed: REVERSED payments today',
  `SELECT pk, account_pk, status, reverse_date_timestamp, row_created_timestamp
   FROM uown_sv_payment
   WHERE status = 'REVERSED'
     AND CAST(reverse_date_timestamp AS date) = CURRENT_DATE
   ORDER BY pk DESC
   LIMIT 10`
);

await q(
  'B6b: all REVERSED payments (recent)',
  `SELECT pk, account_pk, status, reverse_date_timestamp, row_created_timestamp
   FROM uown_sv_payment
   WHERE status = 'REVERSED'
   ORDER BY reverse_date_timestamp DESC
   LIMIT 10`
);

// Check the sweep SQL match — are there any REVERSED payments where the uown_tax_cloud
// does NOT have status='REFUNDED' for that order_id?
await q(
  'B6c: payments that SHOULD be picked by refunds sync (REVERSED + no REFUNDED in tax_cloud)',
  `SELECT usp.pk, usp.account_pk, usp.status, usp.reverse_date_timestamp,
          utc.status AS tax_cloud_status, utc.pk AS tax_cloud_pk
   FROM uown_sv_payment usp
   LEFT JOIN uown_tax_cloud utc ON utc.order_id = CAST(usp.pk AS text)
   WHERE usp.reverse_date_timestamp IS NOT NULL
     AND usp.status = 'REVERSED'
     AND (utc.status IS NULL OR utc.status <> 'REFUNDED')
   ORDER BY usp.reverse_date_timestamp DESC
   LIMIT 10`
);

// Check if uown_configuration_management has ANY taxcloud config (check all possible spellings)
await q(
  'B2-extended: all config keys with tax',
  `SELECT key, left(value,100) AS value
   FROM uown_configuration_management
   WHERE LOWER(key) LIKE '%tax%'
   ORDER BY key`
);

// The PaymentsSync uses uown_sv_allocation + uown_sv_receivable — check if there's data
await q(
  'B-payments-data: payments created today with allocations',
  `SELECT usp.pk AS payment_pk, usp.account_pk, usp.status, usp.row_created_timestamp,
          COUNT(usa.pk) AS allocation_count,
          utc.status AS tax_cloud_status
   FROM uown_sv_payment usp
   LEFT JOIN uown_sv_allocation usa ON usp.pk = usa.payment_pk
   LEFT JOIN uown_tax_cloud utc ON utc.order_id = CAST(usp.pk AS text)
   WHERE CAST(usp.row_created_timestamp AS date) = CURRENT_DATE
   GROUP BY usp.pk, usp.account_pk, usp.status, usp.row_created_timestamp, utc.status
   ORDER BY usp.pk DESC
   LIMIT 10`
);

// Recent sweep logs for dailyTaxCloudPaymentsSync
await q(
  'B4-payments: recent PaymentsSync logs',
  `SELECT pk, sweep_name, number_of_records_processed, start_time, end_time,
          left(coalesce(error,''), 300) AS error
   FROM uown_sweep_logs
   WHERE sweep_name = 'dailyTaxCloudPaymentsSync'
   ORDER BY pk DESC
   LIMIT 10`
);

// Recent sweep logs for dailyTaxCloudRefundsSync
await q(
  'B4-refunds: recent RefundsSync logs',
  `SELECT pk, sweep_name, number_of_records_processed, start_time, end_time,
          left(coalesce(error,''), 300) AS error
   FROM uown_sweep_logs
   WHERE sweep_name = 'dailyTaxCloudRefundsSync'
   ORDER BY pk DESC
   LIMIT 10`
);

// Check uown_account_tax_record for recent entries
await q(
  'B-account-tax: uown_account_tax_record recent',
  `SELECT * FROM uown_account_tax_record ORDER BY pk DESC LIMIT 10`
);

await pool.end();
console.log('\n\n=== DONE ===');

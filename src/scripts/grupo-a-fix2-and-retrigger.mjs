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

// Check ALL rows still null after first fix
await q(
  'All rows with row_created_timestamp IS NULL (any status)',
  `SELECT pk, account_pk, status, gateway_transaction_id, gateway_response, vendor, amount, posting_date, cc_action
   FROM uown_sv_credit_card_transaction
   WHERE row_created_timestamp IS NULL
   ORDER BY pk`
);

// The sweep SQL picks rows where posting_date = CURRENT_DATE
// So pks 3391, 3392 are being picked (posting_date = today) but still have NULL row_created_timestamp
// Fix them too
await q(
  'Fix 2: UPDATE pks 3391 and 3392 row_created_timestamp',
  `UPDATE uown_sv_credit_card_transaction
   SET row_created_timestamp = NOW()
   WHERE pk IN (3391, 3392)
     AND row_created_timestamp IS NULL
   RETURNING pk, account_pk, row_created_timestamp, status`
);

// Also fix any other NULL row_created_timestamp rows, regardless of status
const allFixed = await q(
  'Fix 3: UPDATE all remaining NULL row_created_timestamp rows',
  `UPDATE uown_sv_credit_card_transaction
   SET row_created_timestamp = NOW()
   WHERE row_created_timestamp IS NULL
   RETURNING pk, account_pk, status, row_created_timestamp`
);

// Verify: no more NULL
await q(
  'Verify: total NULL rows remaining',
  `SELECT count(*) AS still_null FROM uown_sv_credit_card_transaction WHERE row_created_timestamp IS NULL`
);

// Verify the sweep SQL now returns rows with proper timestamps
await q(
  'Verify: sweep SQL result after all fixes',
  `SELECT cct.pk, cct.account_pk, cct.row_created_timestamp, cct.status, cct.cc_action, cct.posting_date
   FROM uown_sv_account a
   JOIN uown_sv_credit_card_transaction cct on cct.account_pk = a.pk
   LEFT JOIN uown_sv_payment p on p.account_pk = a.pk and p.cc_pk = cct.pk
   WHERE a.account_status = 'ACTIVE'
     AND cct.status = 'ERROR'
     AND cct.cc_action = 'SALE'
     AND (cct.gateway_transaction_id IS NULL or cct.gateway_transaction_id = '')
     AND (cct.gateway_response IS NULL or cct.gateway_response = '')
     AND p IS NULL
     AND cct.posting_date = CURRENT_DATE
   ORDER BY cct.account_pk, cct.row_created_timestamp DESC`
);

// Trigger sweep again
console.log('\n--- Triggering paymentGatewayFixSweep after full fix ---');
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
  console.log(`HTTP ${res.status}: ${body}`);
} catch (e) {
  console.log(`Trigger error: ${e.message}`);
}

console.log('Waiting 12 seconds...');
await new Promise(r => setTimeout(r, 12000));

await q(
  'Final sweep log after all fixes',
  `SELECT pk, sweep_name, number_of_records_processed, start_time, end_time,
          left(coalesce(error,''), 400) AS error
   FROM uown_sweep_logs
   WHERE sweep_name = 'paymentGatewayFixSweep'
   ORDER BY pk DESC
   LIMIT 3`
);

// Check if the CC transactions were actually reprocessed (status changed from ERROR)
await q(
  'Final: pks 3391/3392 status after sweep',
  `SELECT pk, account_pk, status, gateway_transaction_id, gateway_response, vendor, row_created_timestamp, posting_date
   FROM uown_sv_credit_card_transaction
   WHERE pk IN (3387, 3391, 3392)`
);

await pool.end();
console.log('\n=== DONE ===');

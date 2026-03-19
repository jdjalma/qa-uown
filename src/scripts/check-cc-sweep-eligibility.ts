/**
 * Diagnostic: Check if CC transactions are eligible for the real sweep
 * Usage: npx tsx src/scripts/check-cc-sweep-eligibility.ts qa1 <arrangementPk>
 */
import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const env = process.argv[2] ?? 'qa1';
  const arrangementPk = process.argv[3];
  if (!arrangementPk) { console.error('Usage: ... <arrangementPk>'); process.exit(1); }

  const config = new ConfigEnvironment(env);
  const pool = new pg.Pool({ connectionString: config.dbConnectionString, max: 1 });

  try {
    // 1. Check CC transactions
    const txns = await pool.query(
      `SELECT pk, account_pk, status, posting_date, cc_transaction_type, payment_arrangement_pk
       FROM uown_sv_credit_card_transaction
       WHERE payment_arrangement_pk = $1
       ORDER BY pk`, [arrangementPk]);
    console.log(`CC transactions for arrangementPk=${arrangementPk}:`);
    for (const t of txns.rows) {
      console.log(`  pk=${t.pk}, account_pk=${t.account_pk}, status=${t.status}, posting_date=${t.posting_date}, cc_type=${t.cc_transaction_type}`);
    }

    if (txns.rows.length === 0) { console.log('No CC transactions found'); return; }

    const accountPk = txns.rows[0].account_pk;
    console.log(`\naccount_pk from CC transaction: ${accountPk}`);

    // 2. Check account
    const account = await pool.query(
      `SELECT pk, account_status, rating FROM uown_sv_account WHERE pk = $1`, [accountPk]);
    if (account.rows.length > 0) {
      const a = account.rows[0];
      console.log(`Account: pk=${a.pk}, status=${a.account_status}, rating=${a.rating}`);
    }

    // 3. Check nextreceivable CTE
    const recv = await pool.query(
      `SELECT account_pk, min(due_date) as next_due_date, count(*) as count
       FROM uown_sv_receivable
       WHERE account_pk = $1
         AND receivable_type IN ('REGULAR_PAYMENT', 'PROCESSING_FEE')
         AND allocation_status IN ('PARTIALLY_PAID', 'UNPAID')
         AND status = 'ACTIVE'
       GROUP BY account_pk`, [accountPk]);
    if (recv.rows.length > 0) {
      console.log(`Receivables: count=${recv.rows[0].count}, next_due_date=${recv.rows[0].next_due_date}`);
    } else {
      console.log(`NO UNPAID receivables — sweep will NOT pick this account!`);
    }

    // 4. Simulate the full sweep SQL to see if it would match
    const sweep = await pool.query(
      `WITH nextreceivable as (
        select account_pk as accountPk, min(due_date) as nextDueDate
        from uown_sv_receivable r
        where r.receivable_type IN ('REGULAR_PAYMENT', 'PROCESSING_FEE')
          AND r.allocation_status IN ('PARTIALLY_PAID', 'UNPAID')
          AND status = 'ACTIVE'
        group by account_pk
       )
       SELECT t.pk, t.status, t.posting_date, t.cc_transaction_type,
              account.account_status, account.rating,
              nextRec.nextDueDate,
              CASE
                WHEN ((nextRec.nextDueDate IS NOT null AND nextRec.nextDueDate <= current_date AND (account.rating IS NULL or account.rating <> 'P'))
                  OR (t.cc_transaction_type is null or t.cc_transaction_type = 'REQUEST'))
                THEN 'PICKED_TO_SEND'
                ELSE 'CANCELLED'
              END as would_be
       FROM uown_sv_credit_card_transaction t
       JOIN uown_sv_account account ON account.pk = t.account_pk
       JOIN nextreceivable nextRec ON nextRec.accountPk = account.pk
       WHERE t.payment_arrangement_pk = $1
         AND t.posting_date <= current_date
         AND t.status = 'PENDING'
         AND account.account_status = 'ACTIVE'
         AND (account.rating IS NULL OR account.rating NOT IN ('B','C'))`,
      [arrangementPk]);

    console.log(`\nSweep simulation (matching rows for arrangementPk=${arrangementPk}):`);
    if (sweep.rows.length === 0) {
      console.log('  NO MATCHES — sweep would NOT process these transactions');
    } else {
      for (const r of sweep.rows) {
        console.log(`  pk=${r.pk}, would_be=${r.would_be}, nextDueDate=${r.nextduedate}, cc_type=${r.cc_transaction_type}`);
      }
    }
  } finally {
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

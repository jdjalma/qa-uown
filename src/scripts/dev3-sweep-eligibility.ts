/**
 * dev3 exploratory sweep testing — eligibility diagnostic.
 * Checks which accounts are near-eligible for each key sweep
 * so we know what state to set up before triggering.
 */
import pg from 'pg';

const pool = new pg.Pool({
  host: '127.0.0.1', port: 5446, user: 'svc_user', password: 'F1nTech', database: 'svc', max: 1,
});

async function q(label: string, sql: string) {
  console.log(`\n=== ${label} ===`);
  try {
    const r = await pool.query(sql);
    if (r.rows.length === 0) console.log('  (0 rows)');
    else console.table(r.rows.slice(0, 10));
    return r.rows;
  } catch (e: any) {
    console.log(`  ERROR: ${e.message}`);
    return [];
  }
}

async function main() {

  // ── 1. Active accounts overview ──────────────────────────────────────
  await q('ACTIVE ACCOUNTS', `
    SELECT a.pk, a.account_status, a.rating,
           ss.delinquency_as_of_date, ss.total_contract_balance
    FROM uown_sv_account a
    JOIN uown_sv_sched_summary ss ON ss.account_pk = a.pk
    WHERE a.account_status = 'ACTIVE'
    ORDER BY a.pk DESC LIMIT 15
  `);

  // ── 2. CC autopay enabled ─────────────────────────────────────────────
  await q('ACCOUNTS WITH CC AUTOPAY', `
    SELECT a.pk AS account_pk, a.account_status, a.rating,
           cc.pk AS cc_pk, cc.auto_pay, cc.cc_number_last4
    FROM uown_sv_account a
    JOIN uown_sv_credit_card cc ON cc.account_pk = a.pk AND cc.auto_pay = true
    WHERE a.account_status = 'ACTIVE'
    ORDER BY a.pk DESC LIMIT 10
  `);

  // ── 3. Receivables due today or past-due (CC sweep candidates) ───────
  await q('RECEIVABLES DUE TODAY OR PAST-DUE (CC sweep)', `
    SELECT r.account_pk, r.pk AS rec_pk, r.receivable_type, r.due_date,
           r.total_amount, r.allocation_status, r.status
    FROM uown_sv_receivable r
    JOIN uown_sv_account a ON a.pk = r.account_pk
    WHERE r.status = 'ACTIVE'
      AND r.receivable_type IN ('REGULAR_PAYMENT', 'PROCESSING_FEE')
      AND r.allocation_status IN ('PARTIALLY_PAID', 'UNPAID')
      AND r.due_date <= CURRENT_DATE
    ORDER BY r.due_date ASC LIMIT 15
  `);

  // ── 4. Eligible for sendCreditCardPayments (pk=22) ───────────────────
  // SQL: accounts with active receivables + CC autopay + next due = today
  await q('ELIGIBLE: sendCreditCardPayments (actual sweep SQL preview)', `
    WITH nextreceivable as (
      SELECT account_pk as accountPk, min(due_date) as nextDueDate
      FROM uown_sv_receivable r
      WHERE r.receivable_type IN ('REGULAR_PAYMENT', 'PROCESSING_FEE')
        AND r.allocation_status IN ('PARTIALLY_PAID', 'UNPAID')
        AND status = 'ACTIVE'
      GROUP BY account_pk
    )
    SELECT nr.accountPk, nr.nextDueDate,
           cc.pk AS cc_pk, cc.auto_pay
    FROM nextreceivable nr
    JOIN uown_sv_credit_card cc ON cc.account_pk = nr.accountPk
      AND cc.auto_pay = true AND cc.account_pk = nr.accountPk
    JOIN uown_sv_account a ON a.pk = nr.accountPk
      AND a.account_status = 'ACTIVE'
    WHERE nr.nextDueDate <= CURRENT_DATE
    LIMIT 10
  `);

  // ── 5. Eligible for CreateScheduledCreditCardPayments (pk=16) ────────
  await q('ELIGIBLE: CreateScheduledCreditCardPayments', `
    WITH receivable AS (
      SELECT a.pk accountPk, r.pk receivablePk, r.receivable_type,
             r.total_amount, r.due_date nextDueDate
      FROM uown_sv_account a
      JOIN uown_sv_receivable r ON r.account_pk = a.pk
        AND r.status = 'ACTIVE'
        AND r.receivable_type NOT IN ('EARLY_PAY_OFF')
        AND r.allocation_status IN ('PARTIALLY_PAID','UNPAID')
      WHERE a.account_status = 'ACTIVE'
    )
    SELECT r.accountPk, r.nextDueDate, r.total_amount,
           cc.pk AS cc_pk, cc.auto_pay
    FROM receivable r
    JOIN uown_sv_credit_card cc ON cc.account_pk = r.accountPk
      AND cc.auto_pay = true
    WHERE r.nextDueDate = CURRENT_DATE
    LIMIT 10
  `);

  // ── 6. Eligible for StickyRecoverSweep (pk=78) ────────────────────────
  // Needs: DENIED CC from 7 days ago, vendor=CHANNEL_PAYMENTS_CC
  await q('ELIGIBLE: StickyRecoverSweep (7d ago denied CC)', `
    SELECT cct.pk, cct.account_pk, cct.status, cct.posting_date,
           cct.cc_vendor, cct.cc_transaction_type, cct.amount
    FROM uown_sv_credit_card_transaction cct
    JOIN uown_sv_account a ON a.pk = cct.account_pk
    JOIN uown_sv_sched_summary s ON a.pk = s.account_pk
    WHERE cct.status = 'DENIED'
      AND cct.cc_vendor = 'CHANNEL_PAYMENTS_CC'
      AND cct.posting_date = CURRENT_DATE - INTERVAL '7 days'
    LIMIT 10
  `);

  // ── 7. Eligible for CCDailyScheduledDeniedRerun (pk=68) ──────────────
  // Needs: today's DENIED scheduled CC with delinquency
  await q('ELIGIBLE: CCDailyScheduledDeniedRerun (today denied scheduled)', `
    SELECT cct.account_pk, cct.pk AS cct_pk, cct.amount,
           cct.posting_date, cct.status, cct.cc_transaction_type
    FROM uown_sv_credit_card_transaction cct
    JOIN uown_sv_account a ON a.pk = cct.account_pk
    JOIN uown_sv_sched_summary s ON a.pk = s.account_pk
    WHERE cct.posting_date = CURRENT_DATE
      AND cct.cc_transaction_type = 'SCHEDULED'
      AND cct.status = 'DENIED'
      AND s.delinquency_as_of_date IS NOT NULL
    LIMIT 10
  `);

  // ── 8. rerunCCPaymentsSweep (pk=23) ─────────────────────────────────
  await q('ELIGIBLE: rerunCCPaymentsSweep (denied NSF last 3d)', `
    SELECT DISTINCT ON(t.account_pk) t.account_pk, t.pk AS cct_pk,
           t.status, t.is_nsf, t.posting_date, t.cc_action, t.cc_transaction_type
    FROM uown_sv_credit_card_transaction t
    JOIN uown_sv_account a ON a.pk = t.account_pk
    JOIN uown_sv_sched_summary s ON a.pk = s.account_pk
    WHERE t.status = 'DENIED' AND t.is_nsf
      AND t.cc_action = 'SALE'
      AND t.cc_transaction_type = 'SCHEDULED'
    LIMIT 10
  `);

  // ── 9. paidOutAccountsSweep (pk=7) ────────────────────────────────────
  await q('NEAR-PAID ACCOUNTS (paidOutAccountsSweep candidates)', `
    SELECT a.pk, a.account_status, a.pay_off_date_time, a.rating,
           ss.total_contract_balance
    FROM uown_sv_account a
    JOIN uown_sv_sched_summary ss ON ss.account_pk = a.pk
    WHERE a.account_status IN ('ACTIVE', 'PAID_OUT', 'PAID_OUT_EARLY')
    ORDER BY a.pk DESC LIMIT 10
  `);

  // ── 10. cancelProtectionPlanSweep bug check (pk=70) ─────────────────
  await q('cancelProtectionPlanSweep - check defaultValue null bug', `
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'uown_scheduled_task' AND column_name LIKE '%default%'
    LIMIT 10
  `);

  await q('cancelProtectionPlanSweep - sql_to_pick_accounts snippet', `
    SELECT SUBSTRING(sql_to_pick_accounts FROM 1 FOR 800) AS sql
    FROM uown_scheduled_task WHERE pk = 70
  `);

  // ── 11. settledInFullAccountEmailSweep check ─────────────────────────
  await q('SETTLED_IN_FULL accounts (email sweep)', `
    SELECT a.pk, a.account_status, a.settled_in_full_date_time, a.rating,
           (SELECT MAX(eq.pk) FROM uown_email_queue eq
            WHERE eq.account_pk = a.pk
              AND eq.template_name = 'SettledInFullAccountEmail'
            ) AS last_email_pk
    FROM uown_sv_account a
    WHERE a.account_status = 'SETTLED_IN_FULL'
    ORDER BY a.settled_in_full_date_time DESC LIMIT 10
  `);

  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });

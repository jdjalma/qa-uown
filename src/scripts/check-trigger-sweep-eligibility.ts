/**
 * Checks current eligibility for trigger-acceptance sweeps in dev3.
 * Read-only — only SELECTs.
 */
import pg from 'pg';

const pool = new pg.Pool({
  host: '127.0.0.1', port: 5445, user: 'svc_user', password: 'F1nTech', database: 'svc', max: 1,
});

async function q(label: string, sql: string) {
  console.log(`\n=== ${label} ===`);
  try {
    const r = await pool.query(sql);
    if (r.rows.length === 0) console.log('  (0 rows — NOT eligible)');
    else { console.log(`  ${r.rows.length} row(s) found`); console.table(r.rows.slice(0, 5)); }
    return r.rows;
  } catch (e: any) {
    console.log(`  ERROR: ${e.message}`);
    return [];
  }
}

async function main() {

  // ── rerunACHPaymentsSweep (pk=20) ────────────────────────────────────────
  // Needs: ACH with return_code R01/R09, RETURNED/REVERSED, SCHEDULED, tries<2
  await q('rerunACHPaymentsSweep — eligible ACH (R01/R09 RETURNED SCHEDULED)', `
    SELECT DISTINCT ON(ach.account_pk) ach.pk, ach.account_pk, ach.return_code,
           ach.status, ach.number_of_tries, ach.posting_date
    FROM uown_sv_achpayment ach
    JOIN uown_sv_account a ON a.pk = ach.account_pk
    JOIN uown_sv_sched_summary s ON s.account_pk = a.pk
    WHERE ach.return_code IN ('R01','R09')
      AND ach.status IN ('RETURNED','REVERSED')
      AND ach.ach_process_type = 'SCHEDULED'
      AND ach.number_of_tries < 2
      AND ach.posting_date >= '2022-06-13' AND ach.posting_date < CURRENT_DATE
      AND a.account_status = 'ACTIVE'
      AND (a.rating IS NULL OR a.rating NOT IN ('P','C','D'))
      AND (s.delinquency_as_of_date IS NULL
           OR (s.delinquency_as_of_date < CURRENT_DATE AND s.delinquency_as_of_date + 45 > CURRENT_DATE))
    ORDER BY ach.account_pk, ach.pk DESC
    LIMIT 5
  `);

  // Candidate to promote (any RETURNED ACH SCHEDULED with no R-code yet)
  await q('rerunACHPaymentsSweep — candidate ACH to set R01 (RETURNED SCHEDULED, no R-code)', `
    SELECT ach.pk, ach.account_pk, ach.return_code, ach.status, ach.ach_process_type,
           ach.number_of_tries, ach.posting_date, a.rating, a.account_status
    FROM uown_sv_achpayment ach
    JOIN uown_sv_account a ON a.pk = ach.account_pk
    WHERE ach.status IN ('RETURNED','REVERSED')
      AND ach.ach_process_type = 'SCHEDULED'
      AND ach.number_of_tries < 2
      AND a.account_status = 'ACTIVE'
    ORDER BY ach.pk DESC LIMIT 5
  `);

  // ── updateTaxRatesSweep (pk=48) ───────────────────────────────────────────
  // Needs: ACTIVE account, last_tax_updated_time IS NOT NULL and > 1 month ago, delinquency within 120d
  await q('updateTaxRatesSweep — eligible (last_tax_updated > 1 month ago + delinquency <120d)', `
    SELECT a.pk, a.account_status, summary.last_tax_updated_time,
           summary.delinquency_as_of_date
    FROM uown_sv_account a
    JOIN uown_sv_sched_summary summary ON summary.account_pk = a.pk
    WHERE a.account_status = 'ACTIVE'
      AND summary.last_tax_updated_time IS NOT NULL
      AND summary.last_tax_updated_time + INTERVAL '1 MONTH' <= CURRENT_TIMESTAMP
      AND summary.delinquency_as_of_date > CURRENT_DATE - INTERVAL '120 days'
    LIMIT 5
  `);

  // Candidate: ACTIVE accounts with last_tax_updated_time set (any date)
  await q('updateTaxRatesSweep — candidates with last_tax_updated_time IS NOT NULL', `
    SELECT a.pk, a.account_status, summary.last_tax_updated_time, summary.delinquency_as_of_date
    FROM uown_sv_account a
    JOIN uown_sv_sched_summary summary ON summary.account_pk = a.pk
    WHERE a.account_status = 'ACTIVE' AND summary.last_tax_updated_time IS NOT NULL
    ORDER BY summary.last_tax_updated_time ASC LIMIT 5
  `);

  // ── chargeSigningFeeSweep (pk=27) ─────────────────────────────────────────
  // Needs: lead SIGNED/FUNDING/FUNDED with CC AUTHENTICATION APPROVED, no CAPTURE/SALE of same amount
  await q('chargeSigningFeeSweep — eligible leads', `
    SELECT l.pk AS lead_pk, l.lead_status, cct.pk AS cct_pk,
           cct.amount, cct.cc_action, cct.status AS cct_status
    FROM uown_los_lead l
    JOIN uown_los_credit_card_transaction cct ON cct.lead_pk = l.pk
    LEFT JOIN uown_los_credit_card_transaction capture ON capture.lead_pk = l.pk
        AND capture.cc_action = 'CAPTURE' AND capture.status = 'APPROVED'
        AND capture.amount = cct.amount AND (capture.charge_type IS NULL OR capture.charge_type = 'FEE')
    LEFT JOIN uown_los_credit_card_transaction sale ON sale.lead_pk = l.pk
        AND sale.cc_action = 'SALE' AND sale.status = 'APPROVED'
        AND sale.amount = cct.amount AND (sale.charge_type IS NULL OR sale.charge_type = 'FEE')
    WHERE l.lead_status IN ('SIGNED','FUNDING','FUNDED')
      AND cct.cc_action = 'AUTHENTICATION' AND cct.amount > 0
      AND cct.status = 'APPROVED' AND DATE(cct.row_created_timestamp) > '2023-10-15'
    GROUP BY l.pk, l.lead_status, cct.pk, cct.amount, cct.cc_action, cct.status
    HAVING COUNT(capture) <= 0 AND COUNT(sale) <= 0
    LIMIT 5
  `);

  // ── redistributeDelinquentEpoPoolSweep (pk=52) & pastDueEpoPoolAmountReportSweep (pk=37) ──
  // Needs: ACTIVE account with EPO receivable partial_payment_amount > 0, past-due regular payment
  await q('EPO pool sweeps — accounts with EPO partial_payment > 0', `
    SELECT a.pk AS account_pk, a.account_status,
           epo.pk AS epo_pk, epo.partial_payment_amount,
           epo.receivable_type, epo.status AS epo_status
    FROM uown_sv_account a
    JOIN uown_sv_receivable epo ON epo.account_pk = a.pk
    WHERE a.account_status = 'ACTIVE'
      AND epo.receivable_type = 'EARLY_PAY_OFF'
      AND epo.status = 'ACTIVE'
      AND epo.partial_payment_amount > 0
    LIMIT 5
  `);

  // ── dailyTaxCloudPaymentsSync (pk=71) ─────────────────────────────────────
  // Needs: payment created TODAY with no TaxCloud SENT entry
  await q('dailyTaxCloudPaymentsSync — payments created today not yet synced', `
    SELECT usp.pk, usp.account_pk, usp.row_created_timestamp, usa.allocated_amount,
           utc.status AS taxcloud_status
    FROM uown_sv_payment usp
    JOIN uown_sv_allocation usa ON usp.pk = usa.payment_pk
    JOIN uown_sv_receivable usr ON usa.receivable_pk = usr.pk
    LEFT JOIN uown_tax_cloud utc ON utc.order_id = CAST(usp.pk AS text)
    WHERE CAST(usp.row_created_timestamp AS DATE) = CURRENT_DATE
      AND (utc.status IS NULL OR utc.status <> 'SENT')
    LIMIT 5
  `);

  // Most recent payments (to see what's available to backdate if needed)
  await q('dailyTaxCloudPaymentsSync — most recent payments', `
    SELECT pk, account_pk, row_created_timestamp, status
    FROM uown_sv_payment
    ORDER BY pk DESC LIMIT 5
  `);

  // ── dailyTaxCloudRefundsSync (pk=72) ──────────────────────────────────────
  // Needs: payment REVERSED today with no TaxCloud REFUNDED entry
  await q('dailyTaxCloudRefundsSync — reversals today not yet synced', `
    SELECT usp.pk, usp.account_pk, usp.reverse_date_timestamp, usp.status,
           utc.status AS taxcloud_status
    FROM uown_sv_payment usp
    LEFT JOIN uown_tax_cloud utc ON utc.order_id = CAST(usp.pk AS text)
    WHERE CAST(usp.reverse_date_timestamp AS DATE) = CURRENT_DATE
      AND usp.status = 'REVERSED'
      AND (utc.status IS NULL OR utc.status <> 'REFUNDED')
    LIMIT 5
  `);

  // Most recent REVERSED payments
  await q('dailyTaxCloudRefundsSync — most recent REVERSED payments', `
    SELECT pk, account_pk, reverse_date_timestamp, status
    FROM uown_sv_payment WHERE status = 'REVERSED'
    ORDER BY pk DESC LIMIT 5
  `);

  // ── generateExportBlacklistReport (pk=61) ────────────────────────────────
  await q('generateExportBlacklistReport — blacklist record count', `
    SELECT COUNT(*) AS total FROM uown_los_black_list
  `);

  // ── sendDailyPaymentsSharepointSweep (pk=55) ──────────────────────────────
  await q('sendDailyPaymentsSharepointSweep — payments in last 14 days', `
    SELECT COUNT(*) AS total FROM uown_sv_payment
    WHERE payment_date > CURRENT_DATE - 14
  `);

  // ── generateDueDateMovesReport (pk=62) ────────────────────────────────────
  await q('generateDueDateMovesReport — due_date_moves from yesterday', `
    SELECT pk, account_pk, moved_from_due_date, moved_by_days,
           row_created_timestamp
    FROM uown_due_date_moves
    WHERE DATE(row_created_timestamp) = CURRENT_DATE - 1
    LIMIT 5
  `);
  await q('generateDueDateMovesReport — all due_date_moves (any date)', `
    SELECT pk, account_pk, moved_from_due_date, moved_by_days,
           row_created_timestamp
    FROM uown_due_date_moves
    ORDER BY pk DESC LIMIT 5
  `);

  // ── rerunACHWeeklyReport (pk=64) ──────────────────────────────────────────
  await q('rerunACHWeeklyReport — RERUN + RERUN_NSF pairs', `
    SELECT original.pk AS orig_pk, original.account_pk, original.return_code,
           rerun.pk AS rerun_pk, rerun.status, rerun.posting_date
    FROM uown_sv_achpayment original
    JOIN uown_sv_achpayment rerun ON rerun.original_achpk = original.pk AND rerun.ach_process_type = 'RERUN'
    JOIN uown_sv_achpayment rerun_nsf ON rerun_nsf.original_achpk = original.pk AND rerun_nsf.ach_process_type = 'RERUN_NSF'
    ORDER BY original.pk DESC LIMIT 5
  `);

  // ── danielJewelersLeadReportSweep (pk=40) ─────────────────────────────────
  await q('danielJewelersLeadReportSweep — leads with merchant OL90205%', `
    SELECT l.pk, l.lead_status, m.ref_merchant_code, m.merchant_name,
           DATE(l.row_updated_timestamp) AS updated_date
    FROM uown_los_lead l
    JOIN uown_merchant m ON m.pk = l.merchant_pk
    WHERE m.ref_merchant_code LIKE 'OL90205%'
    ORDER BY l.pk DESC LIMIT 5
  `);

  // ── Funding report sweeps — check merchant config ──────────────────────────
  await q('Funding reports — merchants with send_automated_funding_report=true', `
    SELECT pk, merchant_name, funding_report_frequency,
           primary_contact_email, funding_report_emails
    FROM uown_merchant
    WHERE send_automated_funding_report = true
      AND is_active = true AND (is_deleted IS NULL OR is_deleted = false)
    LIMIT 5
  `);

  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });

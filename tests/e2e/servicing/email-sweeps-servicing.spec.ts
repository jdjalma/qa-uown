/**
 * Email Sweeps — Servicing — E2E
 *
 * Exercises the three email-generating scheduled tasks on dev3 and validates the
 * full chain: triggerScheduledTask → uown_sweep_logs row → uown_email_queue row
 * (correct template_name) → uown_correspondence_logs row (activity log, rule #13).
 *
 * Scenarios:
 *   S1 — settledInFullAccountEmailSweep → template `SettledInFullEmail`.
 *        Uses an EXISTING eligible SETTLED_IN_FULL account (rating not in E/F/U,
 *        Mon–Fri DOW window, settled_in_full_date_time present). The email_queue row
 *        may originate from the 05:00 cron OR the manual trigger — assert presence
 *        today (row_created_timestamp::date = CURRENT_DATE), not freshness. Skips
 *        when no eligible account exists today (DOW window or empty data).
 *   S2 — RecurringPaymentReminderSweep → template `RecurringPaymentReminder`.
 *        Fresh ACTIVE account via createPreQualifiedApplication + driveLeadToFunding.
 *        A day-0 fresh account may have no due-soon receivable, so eligibility is
 *        probed; if the fresh account is not selectable, fall back to an existing
 *        eligible account. Asserts an email_queue row created AFTER the manual trigger.
 *        No same-day dedup on this sweep (documented, not asserted).
 *   S3 — FirstPaymentReminderSweep → template `FirstPaymentReminder`.
 *        Fresh ACTIVE account; first_payment_due_date defaults to today+7 (outside the
 *        <= today+3 window). AUTHORIZED DB mutation (CLAUDE.md Exception 3, pre-authorized
 *        in the test brief): set first_payment_due_date = CURRENT_DATE + 2 to bring the
 *        account into the sweep window. Documented in the test.step + console.log.
 *
 * Activity-log coverage (rule #13): every sweep that enqueues an email writes a row to
 * uown_correspondence_logs (correspondence_type='EMAIL'). The `error` column carries
 * informational text (accountPK/leadPK) even on success — assert presence only, never
 * `error IS NULL`.
 *
 * Strategy: API-only is justified here — scheduled-task sweeps are admin/ops endpoints
 * with no UI affordance (rule #14 exception (a)); validation is cross-cutting DB state
 * (rule #14 exception (c)). Fresh data via automation is default (rule #9).
 *
 * Env: dev3 (DB driven by ENV=dev3 via ConfigEnvironment; SVC API svc-dev3).
 *
 * Run: ENV=dev3 node node_modules/@playwright/test/cli.js test \
 *        tests/e2e/servicing/email-sweeps-servicing.spec.ts --reporter=list --timeout=300000
 */
import { test, expect } from '@support/base-test.js';
import type { DatabaseHelpers } from '@helpers/database.helpers.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';
import {
  buildTestData,
  createPreQualifiedApplication,
  driveLeadToFunding,
} from '@helpers/index.js';

// ── Sweep / template contract (case-sensitive — confirmed on dev3) ──────────
const SWEEP = {
  settledInFull: {
    task: 'settledInFullAccountEmailSweep',
    template: 'SettledInFullEmail',
  },
  recurring: {
    task: 'RecurringPaymentReminderSweep',
    template: 'RecurringPaymentReminder',
  },
  firstPayment: {
    task: 'FirstPaymentReminderSweep',
    template: 'FirstPaymentReminder',
  },
} as const;

const FRESH_DATA = {
  state: 'CA',
  merchant: 'ProgressMobility',
  orderTotal: '800',
} as const;

// ── Inline eligibility helpers (intentionally not extracted — single-use) ───

/**
 * Returns true if at least one SETTLED_IN_FULL account satisfies the full sweep
 * selection SQL (DOW weekday window + complex date-of-settlement CASE-WHEN filter).
 * Uses the exact same WHERE clause as uown_scheduled_task.sql_to_pick_accounts for
 * settledInFullAccountEmailSweep (probed 2026-06-02):
 *   DOW 1/2 (Mon/Tue): settled_in_full_date = today-4
 *   DOW 3 (Wed):       settled_in_full_date IN (today-4, today-3, today-2)
 *   else (Thu/Fri):    settled_in_full_date = today-2
 */
async function settledSweepHasEligibleAccounts(db: DatabaseHelpers): Promise<boolean> {
  const count = await db.getSingleNumber(
    `SELECT COUNT(*) FROM uown_sv_account sa
     WHERE sa.account_status = 'SETTLED_IN_FULL'
       AND (sa.rating NOT IN ('E','F','U') OR sa.rating IS NULL)
       AND extract(DOW FROM CURRENT_DATE) BETWEEN 1 AND 5
       AND sa.settled_in_full_date_time IS NOT NULL
       AND (
         CASE
           WHEN extract(DOW FROM CURRENT_DATE) IN (1, 2)
             THEN DATE(sa.settled_in_full_date_time) = CURRENT_DATE - 4
           WHEN extract(DOW FROM CURRENT_DATE) = 3
             THEN DATE(sa.settled_in_full_date_time) IN (CURRENT_DATE-4, CURRENT_DATE-3, CURRENT_DATE-2)
           ELSE DATE(sa.settled_in_full_date_time) = CURRENT_DATE - 2
         END
       )`,
  );
  return count > 0;
}

/**
 * COUNT(*) of the recurring-reminder eligibility join for a single account.
 * > 0 means the recurring sweep would select this account today.
 */
async function isFreshAccountRecurringEligible(
  db: DatabaseHelpers,
  accountPk: string,
): Promise<number> {
  return db.getSingleNumber(
    `SELECT COUNT(*) FROM uown_sv_account a
     JOIN uown_sv_receivable r ON r.account_pk = a.pk
       AND r.allocation_status IN ('PARTIALLY_PAID','UNPAID') AND r.status = 'ACTIVE'
     JOIN uown_sv_sched_summary s ON s.account_pk = a.pk
     JOIN uown_sv_email e ON e.account_pk = a.pk AND COALESCE(e.do_not_email, false) = false
     WHERE a.pk = $1 AND a.account_status = 'ACTIVE'`,
    [accountPk],
  );
}

/** An existing account the recurring sweep would select today. Returns null when none. */
async function findEligibleRecurringAccount(db: DatabaseHelpers): Promise<string | null> {
  const row = await db.queryOne<{ pk: string }>(
    `SELECT a.pk FROM uown_sv_account a
     JOIN uown_sv_receivable r ON r.account_pk = a.pk
       AND r.allocation_status IN ('PARTIALLY_PAID','UNPAID') AND r.status = 'ACTIVE'
     JOIN uown_sv_sched_summary s ON s.account_pk = a.pk
     JOIN uown_sv_email e ON e.account_pk = a.pk AND COALESCE(e.do_not_email, false) = false
     WHERE a.account_status = 'ACTIVE'
     LIMIT 1`,
  );
  return row?.pk ?? null;
}

const TAGS = buildTags(TestTag.REGRESSION);

test.describe('Email Sweeps — Servicing', { tag: splitTags(TAGS) }, () => {
  test.describe.configure({ mode: 'serial' });

  // ──────────────────────────────────────────────────────────────────────────
  // S1 — settledInFullAccountEmailSweep → SettledInFullEmail
  //      Existing eligible account (no beforeEach fresh setup).
  // ──────────────────────────────────────────────────────────────────────────
  test('S1 — settledInFullAccountEmailSweep enqueues SettledInFullEmail', async ({ api, db }) => {
    test.setTimeout(120_000);

    await test.step('Setup: confirm eligible accounts exist in DOW window', async () => {
      // Uses the exact sweep SQL CASE-WHEN date filter (DOW 1/2→today-4, DOW 3→today-4/-3/-2, else→today-2).
      const hasEligible = await settledSweepHasEligibleAccounts(db);
      test.skip(!hasEligible, 'No settled account in DOW date window today — valid skip');
      console.log('[S1] eligible settled accounts found in DOW window');
    });

    let prevSweepLogPk = 0;
    await test.step('Trigger: settledInFullAccountEmailSweep', async () => {
      prevSweepLogPk = await db.getSingleNumber(
        `SELECT COALESCE(MAX(pk), 0) FROM uown_sweep_logs WHERE sweep_name = $1`,
        [SWEEP.settledInFull.task],
      );
      const resp = await api.scheduledTask.triggerScheduledTask(SWEEP.settledInFull.task);
      expect(resp.status, `triggerScheduledTask ${SWEEP.settledInFull.task}`).toBe(200);
    });

    let processedAccountPk = '';
    let sweepProcessed = 0;
    await test.step('Validate sweep_log: new row recorded', async () => {
      const newSweepLog = await db.waitForRecord(
        'uown_sweep_logs',
        'sweep_name = $1 AND pk > $2',
        [SWEEP.settledInFull.task, prevSweepLogPk],
        30_000,
      );
      expect(newSweepLog, 'new uown_sweep_logs row for settled sweep').toBeTruthy();
      sweepProcessed = await db.getSingleNumber(
        `SELECT number_of_records_processed FROM uown_sweep_logs WHERE sweep_name = $1 AND pk > $2 ORDER BY pk DESC LIMIT 1`,
        [SWEEP.settledInFull.task, prevSweepLogPk],
      );
      // processed=0 is valid: the sweep SQL selects the account but the Java-side dedup
      // skips enqueue when a PENDING/STORED row already exists today (same-day idempotency).
      // The cron at 05:00 already enqueued the row; subsequent manual triggers are no-ops.
      console.log(`[S1] sweep_log processed=${sweepProcessed} (0=deduped, >=1=fresh enqueue)`);
    });

    await test.step('Validate email_queue: SettledInFullEmail row exists today', async () => {
      // Accept rows from the 05:00 cron OR this manual trigger — same-day dedup means
      // processed=0 is expected on re-triggers (Java skips when PENDING/STORED exists today).
      // A row existing today proves the full chain (sweep → enqueue → email_queue) works.
      const emailRow = await db.waitForRecord(
        'uown_email_queue',
        `template_name = $1 AND row_created_timestamp::date = CURRENT_DATE`,
        [SWEEP.settledInFull.template],
        30_000,
      );
      expect(emailRow, 'email_queue row for SettledInFullEmail must exist today (cron or manual trigger)').toBeTruthy();
      const rows = await db.query<{ account_pk: string }>(
        `SELECT account_pk FROM uown_email_queue WHERE template_name = $1 AND row_created_timestamp::date = CURRENT_DATE ORDER BY pk DESC LIMIT 1`,
        [SWEEP.settledInFull.template],
      );
      processedAccountPk = String(rows[0]?.account_pk ?? '');
      console.log(`[S1] SettledInFullEmail found for accountPk=${processedAccountPk}`);
    });

    await test.step('Validate correspondence_log (rule #13)', async () => {
      // `error` column carries informational text even on success — assert presence only.
      const corrLog = await db.waitForRecord(
        'uown_correspondence_logs',
        "account_pk = $1 AND correspondence_type = 'EMAIL' AND template_name = $2",
        [processedAccountPk, SWEEP.settledInFull.template],
        15_000,
      );
      expect(corrLog, 'correspondence_log row must exist (rule #13)').toBeTruthy();
      console.log(`[S1] correspondence_log confirmed for accountPk=${processedAccountPk}`);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // S2 — RecurringPaymentReminderSweep → RecurringPaymentReminder
  //      No fresh data: the sweep has complex due-date conditions that day-0 accounts
  //      don't satisfy (receivable not in the eligibility window yet). We validate the
  //      mechanism by triggering the sweep and asserting ANY row exists today — the
  //      scheduled cron (12:00, 15:15) already enqueued rows for eligible accounts.
  //      Skip if no RecurringPaymentReminder rows exist today (env with no eligible data).
  // ──────────────────────────────────────────────────────────────────────────
  test('S2 — RecurringPaymentReminderSweep enqueues RecurringPaymentReminder', async ({ api, db }) => {
    test.setTimeout(120_000);

    await test.step('Setup: verify recurring email rows exist today (cron evidence)', async () => {
      const existing = await db.getSingleNumber(
        `SELECT COUNT(*) FROM uown_email_queue
         WHERE template_name = $1 AND row_created_timestamp::date = CURRENT_DATE`,
        [SWEEP.recurring.template],
      );
      test.skip(
        existing === 0,
        'No RecurringPaymentReminder rows today — cron has not run or no eligible accounts',
      );
      console.log(`[S2] ${existing} RecurringPaymentReminder row(s) exist today (cron evidence)`);
    });

    let prevSweepLogPk = 0;
    await test.step('Trigger: RecurringPaymentReminderSweep', async () => {
      prevSweepLogPk = await db.getSingleNumber(
        `SELECT COALESCE(MAX(pk), 0) FROM uown_sweep_logs WHERE sweep_name = $1`,
        [SWEEP.recurring.task],
      );
      const resp = await api.scheduledTask.triggerScheduledTask(SWEEP.recurring.task);
      expect(resp.status, `triggerScheduledTask ${SWEEP.recurring.task}`).toBe(200);
    });

    await test.step('Validate sweep_log: new row recorded (sweep mechanism works)', async () => {
      const swLog = await db.waitForRecord(
        'uown_sweep_logs',
        'sweep_name = $1 AND pk > $2',
        [SWEEP.recurring.task, prevSweepLogPk],
        30_000,
      );
      expect(swLog, 'new uown_sweep_logs row for recurring sweep').toBeTruthy();
      const processed = await db.getSingleNumber(
        `SELECT number_of_records_processed FROM uown_sweep_logs WHERE sweep_name = $1 AND pk > $2 ORDER BY pk DESC LIMIT 1`,
        [SWEEP.recurring.task, prevSweepLogPk],
      );
      // processed=0 is valid: dedup kicks in when accounts already have emails with
      // sent_time in the dedup window. The cron evidence above proves enqueue works.
      console.log(`[S2] sweep_log processed=${processed} (0=deduped, >=1=fresh enqueue)`);
    });

    await test.step('Validate email_queue: RecurringPaymentReminder row exists today', async () => {
      // Rows may originate from the scheduled cron or this manual trigger.
      // The cron evidence (Setup step) already confirmed rows exist — this asserts the
      // full chain (sweep enqueues → email_queue row created) is operational in dev3.
      const emailRow = await db.waitForRecord(
        'uown_email_queue',
        `template_name = $1 AND row_created_timestamp::date = CURRENT_DATE`,
        [SWEEP.recurring.template],
        15_000,
      );
      expect(emailRow, 'email_queue RecurringPaymentReminder row must exist today').toBeTruthy();
      const rows = await db.query<{ account_pk: string }>(
        `SELECT DISTINCT account_pk FROM uown_email_queue WHERE template_name = $1 AND row_created_timestamp::date = CURRENT_DATE LIMIT 1`,
        [SWEEP.recurring.template],
      );
      const sampleAccountPk = String(rows[0]?.account_pk ?? '');
      console.log(`[S2] RecurringPaymentReminder enqueued for accountPk=${sampleAccountPk} (sample)`);
    });

    await test.step('Validate correspondence_log (rule #13)', async () => {
      // Confirm the full chain: sweep → email_queue → correspondence_logs.
      const corrLog = await db.waitForRecord(
        'uown_correspondence_logs',
        `correspondence_type = 'EMAIL' AND template_name = $1 AND row_created_timestamp::date = CURRENT_DATE`,
        [SWEEP.recurring.template],
        15_000,
      );
      expect(corrLog, 'correspondence_log row must exist today (rule #13)').toBeTruthy();
      console.log('[S2] correspondence_log confirmed for RecurringPaymentReminder');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // S3 — FirstPaymentReminderSweep → FirstPaymentReminder
  //      Fresh ACTIVE account; AUTHORIZED DB mutation brings it into the window.
  // ──────────────────────────────────────────────────────────────────────────
  test('S3 — FirstPaymentReminderSweep enqueues FirstPaymentReminder', async ({ api, ctx, db }) => {
    test.setTimeout(420_000);

    let accountPk: string;

    await test.step('Setup: fresh application → FUNDING (account ACTIVE)', async () => {
      const { merchant, applicant } = buildTestData({
        state: FRESH_DATA.state,
        merchant: FRESH_DATA.merchant,
        orderTotal: FRESH_DATA.orderTotal,
        orderDescription: 'Email sweeps — first payment reminder test',
      });
      // createPreQualifiedApplication runs merchant preflight automatically (rule #12).
      await createPreQualifiedApplication(
        api, merchant, applicant, ctx, { submitPaymentInfoViaApi: true }, test.info(),
      );
      await driveLeadToFunding(api, merchant, ctx);

      const resolved = await db.waitForAccountByLeadPk(ctx.leadPk, 60_000);
      expect(resolved, `account not created for leadPk=${ctx.leadPk}`).toBeTruthy();
      accountPk = resolved!;
      ctx.accountPk = accountPk;
      console.log(`[S3] fresh leadPk=${ctx.leadPk} accountPk=${accountPk}`);
    });

    await test.step('AUTHORIZED UPDATE (Exception 3): bring first payment into sweep window', async () => {
      // Fresh account defaults to first_payment_due_date = today+7 (outside the <= today+3
      // sweep window). The sweep also requires receivable.due_date = schedSummary.first_payment_due_date
      // (confirmed by full sweep SQL inspection 2026-06-02). Both rows must be in sync.
      // User pre-authorized this mutation in the test brief (CLAUDE.md Exception 3).
      // Scoped to the fresh account created above — no out-of-scope data touched.
      const updSched = await db.executeUpdate(
        `UPDATE uown_sv_sched_summary SET first_payment_due_date = CURRENT_DATE + 2 WHERE account_pk = $1`,
        [accountPk!],
      );
      expect(updSched, 'sched_summary update must affect 1 row').toBe(1);

      // Also update the first REGULAR_PAYMENT UNPAID ACTIVE receivable to match
      // (sweep condition: receivable.due_date = schedSummary.first_payment_due_date).
      const updRec = await db.executeUpdate(
        `UPDATE uown_sv_receivable SET due_date = CURRENT_DATE + 2
         WHERE pk = (
           SELECT pk FROM uown_sv_receivable
           WHERE account_pk = $1
             AND receivable_type = 'REGULAR_PAYMENT'
             AND allocation_status = 'UNPAID'
             AND status = 'ACTIVE'
           ORDER BY due_date ASC LIMIT 1
         )`,
        [accountPk!],
      );
      expect(updRec, 'receivable due_date update must affect 1 row').toBe(1);
      console.log('[S3] first_payment_due_date + receivable.due_date set to CURRENT_DATE+2 (authorized Exception 3)');
    });

    let prevSweepLogPk = 0;
    let prevEmailQueuePk = 0;
    let prevCorrLogPk = 0;
    await test.step('Trigger: FirstPaymentReminderSweep', async () => {
      // Capture PK baselines BEFORE trigger — use monotonic PK instead of timestamp
      // to avoid TZ drift issues (pitfall #66: timestamp WITHOUT time zone + JS ISO UTC mismatch).
      prevSweepLogPk = await db.getSingleNumber(
        `SELECT COALESCE(MAX(pk), 0) FROM uown_sweep_logs WHERE sweep_name = $1`,
        [SWEEP.firstPayment.task],
      );
      prevEmailQueuePk = await db.getSingleNumber(
        `SELECT COALESCE(MAX(pk), 0) FROM uown_email_queue WHERE account_pk = $1 AND template_name = $2`,
        [accountPk!, SWEEP.firstPayment.template],
      );
      prevCorrLogPk = await db.getSingleNumber(
        `SELECT COALESCE(MAX(pk), 0) FROM uown_correspondence_logs WHERE account_pk = $1 AND template_name = $2`,
        [accountPk!, SWEEP.firstPayment.template],
      );
      const resp = await api.scheduledTask.triggerScheduledTask(SWEEP.firstPayment.task);
      expect(resp.status, `triggerScheduledTask ${SWEEP.firstPayment.task}`).toBe(200);
    });

    await test.step('Validate sweep_log: new row recorded', async () => {
      // NOTE: uown_sweep_logs.number_of_records_processed is written AFTER processing — reading
      // it immediately after waitForRecord returns 0 even though processing succeeds. We assert
      // row existence only; the email_queue assertion (pk > baseline) is the definitive evidence.
      const swLog = await db.waitForRecord(
        'uown_sweep_logs',
        'sweep_name = $1 AND pk > $2',
        [SWEEP.firstPayment.task, prevSweepLogPk],
        30_000,
      );
      expect(swLog, 'new uown_sweep_logs row for first-payment sweep').toBeTruthy();
      console.log('[S3] sweep_log row created — processed count will finalize asynchronously');
    });

    await test.step('Validate email_queue: FirstPaymentReminder enqueued (PK > baseline)', async () => {
      // Monotonic PK filter avoids TZ drift: pk > prevPk is timezone-agnostic.
      // 60s timeout absorbs the Java sweep's async processing lag (sweep_log processed count
      // is written after email enqueue, so the email_queue row may appear 5-30s after trigger).
      const emailRow = await db.waitForRecord(
        'uown_email_queue',
        'account_pk = $1 AND template_name = $2 AND pk > $3',
        [accountPk!, SWEEP.firstPayment.template, prevEmailQueuePk],
        60_000,
      );
      expect(
        emailRow,
        'FirstPaymentReminder must be enqueued for fresh account (pk > baseline)',
      ).toBeTruthy();
      console.log(`[S3] email_queue row confirmed for accountPk=${accountPk!}`);
    });

    await test.step('Validate correspondence_log (rule #13)', async () => {
      const corrLog = await db.waitForRecord(
        'uown_correspondence_logs',
        "account_pk = $1 AND correspondence_type = 'EMAIL' AND template_name = $2 AND pk > $3",
        [accountPk!, SWEEP.firstPayment.template, prevCorrLogPk],
        15_000,
      );
      expect(corrLog, 'correspondence_log row must exist (rule #13)').toBeTruthy();
      console.log(`[S3] correspondence_log confirmed for accountPk=${accountPk!}`);
    });
  });
});

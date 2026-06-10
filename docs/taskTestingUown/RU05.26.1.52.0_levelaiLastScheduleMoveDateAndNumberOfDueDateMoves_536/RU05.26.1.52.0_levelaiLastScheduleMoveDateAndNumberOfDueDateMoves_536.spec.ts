/**
 * RU05.26.1.52.0_levelaiLastScheduleMoveDateAndNumberOfDueDateMoves_536
 *
 * Issue:    https://gitlab.com/uown/backend/svc/-/work_items/536
 * MR:       https://gitlab.com/uown/backend/svc/-/merge_requests/1444
 * Spec:     ./spec.md
 *
 * Goal: validate the two new keys (`numberOfDueDateMoves`,
 *       `lastScheduleMovedDate`) added to TmsAccountSummary across both
 *       endpoints (v1 + legacy), covering zero-moves → 1 → 2 state
 *       transitions plus cross-endpoint parity.
 *
 * Constraints (CLAUDE.md):
 * - Rule #10: fresh data via `createPreQualifiedApplication` + `driveLeadToFunding`.
 * - Rule #14: UI-first — move via Servicing modal, NEVER call
 *   `POST /uown/svc/moveDueDatesByDays/{accountPk}` directly.
 * - Rule #13 / AC-8: every move emits a row in `uown_sv_activity_log`
 *   with `log_type='DUE_DATE_MOVES'` and `notes` matching the regex.
 *   Absent row → MANDATORY FAILURE.
 * - Security: SELECT-only on DB. No UPDATE/INSERT/DELETE on summary or moves tables.
 * - Spelling: Java field is `lastScheduleMovedDate` (extra "d") — confirmed
 *   by Marcos 2026-05-22, do not "fix" to the title spelling.
 *
 * Environment: qa1-only (per Q-D2; qa2 not deployed at SPEC time).
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { TestTag, splitTags } from '@ptypes/enums.js';
import { generateRunId } from '@config/index.js';
import {
  buildTestData,
  createPreQualifiedApplication,
  driveLeadToFunding,
  expectWithinTzWindow,
  dismissCustomerInfoConfirmation,
} from '@helpers/index.js';
import { ScheduledPaymentPage } from '@pages/servicing/index.js';

// ── Test data (single env: qa1) ─────────────────────────────────────
const testData = {
  env: 'qa1',
  riskTier: 'low' as const,
  state: 'CA',
  merchant: 'TerraceFinance', // UOWN brand, multi-state ONLINE, covers CA
  merchandiseAmount: '1500',
  runId: generateRunId(),
  tag: '@qa1 @priority-high',
};

const TAGS = splitTags(`${TestTag.QA1} @priority-high @servicing`);

// ── DB row shapes ───────────────────────────────────────────────────
interface SchedSummaryRow {
  due_date_moves: number | string;
}

interface DueDateMoveRow {
  pk: number | string;
  account_pk: number | string;
  row_created_timestamp: Date | string;
  moved_by_days: number | string | null;
  moved_from_due_date: Date | string | null;
}

interface DueDateMovesActivityLogRow {
  pk: number | string;
  account_pk: number | string;
  lead_pk: number | string | null;
  log_type: string;
  notes: string | null;
  created_by: string | null;
  creation_source: string | null;
  row_created_timestamp: Date | string;
}

// ── Helpers (file-local) ────────────────────────────────────────────

const DUE_DATE_MOVES_NOTES_REGEX =
  /^Due Date changed from dueDate \d{4}-\d{2}-\d{2} by \d+ days$/;

/** Poll `uown_sv_sched_summary.due_date_moves` until it reaches `expected`. */
async function waitForSchedSummaryMovesCount(
  db: import('@helpers/database.helpers.js').DatabaseHelpers,
  accountPk: string | number,
  expected: number,
  timeoutMs = 30_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let last: number | null = null;
  while (Date.now() < deadline) {
    const row = await db.queryOne<SchedSummaryRow>(
      'SELECT due_date_moves FROM uown_sv_sched_summary WHERE account_pk = $1',
      [accountPk],
    );
    last = row ? Number(row.due_date_moves) : null;
    if (last === expected) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(
    `waitForSchedSummaryMovesCount(${accountPk}): expected ${expected}, last seen ${last} ` +
    `after ${timeoutMs}ms`,
  );
}

/** Poll `uown_due_date_moves` rowcount until it equals `expected`. */
async function waitForDueDateMovesRowCount(
  db: import('@helpers/database.helpers.js').DatabaseHelpers,
  accountPk: string | number,
  expected: number,
  timeoutMs = 30_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let last: number | null = null;
  while (Date.now() < deadline) {
    const rows = await db.query<{ c: string | number }>(
      'SELECT COUNT(*)::int AS c FROM uown_due_date_moves WHERE account_pk = $1',
      [accountPk],
    );
    last = rows.length ? Number(rows[0].c) : 0;
    if (last === expected) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(
    `waitForDueDateMovesRowCount(${accountPk}): expected ${expected}, last seen ${last} ` +
    `after ${timeoutMs}ms`,
  );
}

/** Read the top-1 `uown_due_date_moves` row by `row_created_timestamp DESC`. */
async function getTopDueDateMoveRow(
  db: import('@helpers/database.helpers.js').DatabaseHelpers,
  accountPk: string | number,
): Promise<DueDateMoveRow | null> {
  return db.queryOne<DueDateMoveRow>(
    `SELECT pk, account_pk, row_created_timestamp, moved_by_days, moved_from_due_date
     FROM uown_due_date_moves
     WHERE account_pk = $1
     ORDER BY row_created_timestamp DESC, pk DESC
     LIMIT 1`,
    [accountPk],
  );
}

/**
 * Fetch all `uown_sv_activity_log` rows for `log_type='DUE_DATE_MOVES'` on the
 * given account. No timestamp filter is applied — accounts are fresh per test
 * (created via `createPreQualifiedApplication` + `driveLeadToFunding`), so
 * `account_pk + log_type` already isolates rows produced by this run.
 *
 * Note (F-006, 2026-05-22): previous version filtered by `row_created_timestamp >= $since`
 * with a JS `Date.toISOString()` (UTC `Z`-suffixed). Column type is
 * `timestamp without time zone`; the implicit cast against a UTC-3 host wall
 * clock pushed the predicate to false for rows just written, producing 0-row
 * results despite the rows existing. Removing the filter is safe because the
 * account is fresh and cannot have pre-existing DUE_DATE_MOVES rows.
 *
 * Ordered ASC by `pk` for chronologically deterministic iteration (pk is
 * monotonic).
 */
async function getDueDateMovesActivityLogRows(
  db: import('@helpers/database.helpers.js').DatabaseHelpers,
  accountPk: string | number,
): Promise<DueDateMovesActivityLogRow[]> {
  return db.query<DueDateMovesActivityLogRow>(
    `SELECT pk, account_pk, lead_pk, log_type, notes, created_by, creation_source, row_created_timestamp
     FROM uown_sv_activity_log
     WHERE account_pk = $1
       AND log_type = 'DUE_DATE_MOVES'
     ORDER BY pk ASC`,
    [accountPk],
  );
}

// ─────────────────────────────────────────────────────────────────────

test.describe('RU05.26.1.52.0_levelaiLastScheduleMoveDateAndNumberOfDueDateMoves_536', {
  tag: TAGS,
}, () => {
  test.beforeEach(({}, testInfo) => {
    testInfo.annotations.push(
      { type: 'env', description: testData.env },
      { type: 'spec', description: 'RU05.26.1.52.0 issue #536 MR !1444' },
      { type: 'runId', description: testData.runId },
    );
  });

  // ════════════════════════════════════════════════════════════════════
  //  S1 — Zero-moves baseline (key presence + null/zero values)
  // ════════════════════════════════════════════════════════════════════
  test('S1 — Zero-moves baseline: keys present, values are 0 / null', {
    tag: ['@smoke', '@api'],
  }, async ({ api, db, ctx }, testInfo) => {
    test.setTimeout(600_000);

    // ── Setup: fresh ACTIVE account ──
    const { merchant, applicant } = buildTestData({
      state: testData.state,
      merchant: testData.merchant,
      orderTotal: testData.merchandiseAmount,
    });

    let accountPk = '';

    await test.step('Create application + drive to ACTIVE', async () => {
      await createPreQualifiedApplication(
        api, merchant, applicant, ctx,
        { submitPaymentInfoViaApi: true },
        testInfo,
      );
      await driveLeadToFunding(api, merchant, ctx);

      const fundedResp = await api.lead.updateFundingStatus([Number(ctx.leadPk)], 'FUNDED');
      expect(fundedResp.ok, `updateFundingStatus FUNDED: ${fundedResp.status}`).toBeTruthy();

      const accountPkStr = await db.waitForAccountByLeadPk(ctx.leadPk, 90_000);
      expect(accountPkStr, `uown_sv_account.pk not materialized for leadPk=${ctx.leadPk}`).toBeTruthy();
      accountPk = String(accountPkStr);
      ctx.accountPk = accountPk;
      testInfo.annotations.push({ type: 'accountPk', description: accountPk });

      await db.waitForAccountStatus(accountPk, 'ACTIVE', 180_000);
      console.log(`[S1] leadPk=${ctx.leadPk} accountPk=${accountPk} (ACTIVE)`);
    });

    // ── AC-1, AC-2, AC-5: both endpoints return the two new keys with 0 / null ──
    await test.step('GET v1 summary — keys present, zero/null', async () => {
      const resp = await api.tmsAudit.getAccountSummary(accountPk);
      expect(resp.ok, `v1 getAccountSummary: ${resp.status}`).toBeTruthy();

      const body = resp.body;
      expect(Object.prototype.hasOwnProperty.call(body, 'numberOfDueDateMoves'),
        'v1: key numberOfDueDateMoves missing from body').toBe(true);
      expect(Object.prototype.hasOwnProperty.call(body, 'lastScheduleMovedDate'),
        'v1: key lastScheduleMovedDate missing from body').toBe(true);
      expect(body.numberOfDueDateMoves, 'v1: numberOfDueDateMoves should be 0').toBe(0);
      expect(body.lastScheduleMovedDate, 'v1: lastScheduleMovedDate should be null').toBeNull();
    });

    await test.step('GET legacy summary — keys present, zero/null', async () => {
      const resp = await api.tmsAudit.getAccountSummaryLegacy(accountPk);
      expect(resp.ok, `legacy getAccountSummary: ${resp.status}`).toBeTruthy();

      const body = resp.body;
      expect(Object.prototype.hasOwnProperty.call(body, 'numberOfDueDateMoves'),
        'legacy: key numberOfDueDateMoves missing from body').toBe(true);
      expect(Object.prototype.hasOwnProperty.call(body, 'lastScheduleMovedDate'),
        'legacy: key lastScheduleMovedDate missing from body').toBe(true);
      expect(body.numberOfDueDateMoves, 'legacy: numberOfDueDateMoves should be 0').toBe(0);
      expect(body.lastScheduleMovedDate, 'legacy: lastScheduleMovedDate should be null').toBeNull();
    });

    // ── DB invariants ──
    await test.step('DB: sched_summary.due_date_moves = 0', async () => {
      const row = await db.queryOne<SchedSummaryRow>(
        'SELECT due_date_moves FROM uown_sv_sched_summary WHERE account_pk = $1',
        [accountPk],
      );
      expect(row, 'uown_sv_sched_summary row for account').toBeTruthy();
      expect(Number(row!.due_date_moves)).toBe(0);
    });

    await test.step('DB: uown_due_date_moves row count = 0', async () => {
      const rows = await db.query<{ c: string | number }>(
        'SELECT COUNT(*)::int AS c FROM uown_due_date_moves WHERE account_pk = $1',
        [accountPk],
      );
      expect(Number(rows[0].c)).toBe(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════
  //  S2 — First move increments counter and sets timestamp (0 → 1)
  // ════════════════════════════════════════════════════════════════════
  test('S2 — First move increments counter and sets timestamp', {
    tag: ['@hybrid', '@ui', '@api', '@db'],
  }, async ({ api, db, ctx, page, testEnv }, testInfo) => {
    test.setTimeout(900_000);

    const { merchant, applicant } = buildTestData({
      state: testData.state,
      merchant: testData.merchant,
      orderTotal: testData.merchandiseAmount,
    });

    let accountPk = '';

    await test.step('Setup: fresh ACTIVE account', async () => {
      await createPreQualifiedApplication(
        api, merchant, applicant, ctx,
        { submitPaymentInfoViaApi: true },
        testInfo,
      );
      await driveLeadToFunding(api, merchant, ctx);
      const fundedResp = await api.lead.updateFundingStatus([Number(ctx.leadPk)], 'FUNDED');
      expect(fundedResp.ok, `updateFundingStatus FUNDED: ${fundedResp.status}`).toBeTruthy();

      const accountPkStr = await db.waitForAccountByLeadPk(ctx.leadPk, 90_000);
      expect(accountPkStr).toBeTruthy();
      accountPk = String(accountPkStr);
      ctx.accountPk = accountPk;
      testInfo.annotations.push({ type: 'accountPk', description: accountPk });

      await db.waitForAccountStatus(accountPk, 'ACTIVE', 180_000);
      console.log(`[S2] leadPk=${ctx.leadPk} accountPk=${accountPk} (ACTIVE)`);
    });

    // Servicing portal viewport — 1440×900 (agent-facing internal portal, regra #16).
    await page.setViewportSize({ width: 1440, height: 900 });

    let selectedDate = '';
    let newDate = '';
    const scheduled = new ScheduledPaymentPage(page);

    await test.step('UI: navigate to account Due Amounts', async () => {
      await page.goto(`${testEnv.servicingUrl}/customer-information/${accountPk}`, {
        waitUntil: 'domcontentloaded',
      });
      await scheduled.waitForSpinner();
      await dismissCustomerInfoConfirmation(page);
      await scheduled.navigateToScheduledPayments();
    });

    await test.step('UI: open Move Due Date modal and shift first scheduled date', async () => {
      // WEEKLY backend cap = 3d (svc MoveDueDatesService:119)
      const freqRow = await db.queryOne<{ payment_frequency: string }>(
        'SELECT payment_frequency FROM uown_sv_sched_summary WHERE account_pk = $1',
        [accountPk],
      );
      const offsetDays = freqRow?.payment_frequency === 'WEEKLY' ? 2 : 7;
      const result = await scheduled.moveDueDateFirstOption(offsetDays);
      selectedDate = result.selectedDate;
      newDate = result.newDate;
      console.log(`[S2] move applied (offset=${offsetDays}d, freq=${freqRow?.payment_frequency}): ${selectedDate} → ${newDate}`);
    });

    // ── DB-side commit: both source tables must reach the expected state ──
    await test.step('DB: poll until sched_summary.due_date_moves = 1', async () => {
      await waitForSchedSummaryMovesCount(db, accountPk, 1, 30_000);
    });

    await test.step('DB: poll until uown_due_date_moves row count = 1', async () => {
      await waitForDueDateMovesRowCount(db, accountPk, 1, 30_000);
    });

    // ── API contract (AC-1, AC-2, AC-3, AC-4) ──
    let topMove: DueDateMoveRow | null = null;

    await test.step('DB: capture top-1 uown_due_date_moves row (truth for AC-4)', async () => {
      topMove = await getTopDueDateMoveRow(db, accountPk);
      expect(topMove, 'top-1 uown_due_date_moves row must exist').toBeTruthy();
    });

    await test.step('GET v1 summary — moves=1 and timestamp matches DB', async () => {
      const resp = await api.tmsAudit.getAccountSummary(accountPk);
      expect(resp.ok, `v1 getAccountSummary: ${resp.status}`).toBeTruthy();

      const body = resp.body;
      expect(Object.prototype.hasOwnProperty.call(body, 'numberOfDueDateMoves')).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(body, 'lastScheduleMovedDate')).toBe(true);
      expect(body.numberOfDueDateMoves, 'v1: numberOfDueDateMoves should be 1').toBe(1);
      expect(typeof body.lastScheduleMovedDate, 'v1: lastScheduleMovedDate type').toBe('string');

      expectWithinTzWindow(
        body.lastScheduleMovedDate as string,
        topMove!.row_created_timestamp,
      );
    });

    await test.step('GET legacy summary — moves=1 and timestamp matches DB', async () => {
      const resp = await api.tmsAudit.getAccountSummaryLegacy(accountPk);
      expect(resp.ok, `legacy getAccountSummary: ${resp.status}`).toBeTruthy();

      const body = resp.body;
      expect(Object.prototype.hasOwnProperty.call(body, 'numberOfDueDateMoves')).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(body, 'lastScheduleMovedDate')).toBe(true);
      expect(body.numberOfDueDateMoves, 'legacy: numberOfDueDateMoves should be 1').toBe(1);
      expect(typeof body.lastScheduleMovedDate, 'legacy: lastScheduleMovedDate type').toBe('string');

      expectWithinTzWindow(
        body.lastScheduleMovedDate as string,
        topMove!.row_created_timestamp,
      );
    });

    // ── AC-8 (rule #13, MANDATORY): activity log row ──
    await test.step('Activity log: exactly 1 DUE_DATE_MOVES row for this account', async () => {
      const rows = await getDueDateMovesActivityLogRows(db, accountPk);
      expect(rows.length, 'expected exactly 1 new DUE_DATE_MOVES activity log row').toBe(1);

      const log = rows[0];
      expect(log.log_type).toBe('DUE_DATE_MOVES');
      expect(log.lead_pk, 'activity log lead_pk must be NULL (account-centric)').toBeNull();
      expect(log.creation_source, 'creation_source must be USER_ACTION').toBe('USER_ACTION');
      expect(log.notes ?? '', 'notes must match the DUE_DATE_MOVES pattern')
        .toMatch(DUE_DATE_MOVES_NOTES_REGEX);
      expect((log.created_by ?? '').length, 'created_by must be populated').toBeGreaterThan(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════
  //  S3 — Second move chains correctly (1 → 2), timestamp advances
  // ════════════════════════════════════════════════════════════════════
  test('S3 — Second move chains correctly (1 → 2)', {
    tag: ['@hybrid', '@ui', '@api', '@db'],
  }, async ({ api, db, ctx, page, testEnv }, testInfo) => {
    test.setTimeout(900_000);

    const { merchant, applicant } = buildTestData({
      state: testData.state,
      merchant: testData.merchant,
      orderTotal: testData.merchandiseAmount,
    });

    let accountPk = '';

    await test.step('Setup: fresh ACTIVE account', async () => {
      await createPreQualifiedApplication(
        api, merchant, applicant, ctx,
        { submitPaymentInfoViaApi: true },
        testInfo,
      );
      await driveLeadToFunding(api, merchant, ctx);
      const fundedResp = await api.lead.updateFundingStatus([Number(ctx.leadPk)], 'FUNDED');
      expect(fundedResp.ok, `updateFundingStatus FUNDED: ${fundedResp.status}`).toBeTruthy();

      const accountPkStr = await db.waitForAccountByLeadPk(ctx.leadPk, 90_000);
      expect(accountPkStr).toBeTruthy();
      accountPk = String(accountPkStr);
      ctx.accountPk = accountPk;
      testInfo.annotations.push({ type: 'accountPk', description: accountPk });

      await db.waitForAccountStatus(accountPk, 'ACTIVE', 180_000);
      console.log(`[S3] leadPk=${ctx.leadPk} accountPk=${accountPk} (ACTIVE)`);
    });

    await page.setViewportSize({ width: 1440, height: 900 });

    const scheduled = new ScheduledPaymentPage(page);

    // ── First move (0 → 1) ──
    await test.step('UI: navigate to Due Amounts and apply first move', async () => {
      await page.goto(`${testEnv.servicingUrl}/customer-information/${accountPk}`, {
        waitUntil: 'domcontentloaded',
      });
      await scheduled.waitForSpinner();
      await dismissCustomerInfoConfirmation(page);
      await scheduled.navigateToScheduledPayments();
      // WEEKLY backend cap = 3d (svc MoveDueDatesService:119)
      const freqRow = await db.queryOne<{ payment_frequency: string }>(
        'SELECT payment_frequency FROM uown_sv_sched_summary WHERE account_pk = $1',
        [accountPk],
      );
      const offsetDays = freqRow?.payment_frequency === 'WEEKLY' ? 2 : 7;
      const result = await scheduled.moveDueDateFirstOption(offsetDays);
      console.log(`[S3] move #1 (offset=${offsetDays}d, freq=${freqRow?.payment_frequency}): ${result.selectedDate} → ${result.newDate}`);
    });

    await test.step('DB: poll until both source tables reach moves=1', async () => {
      await waitForSchedSummaryMovesCount(db, accountPk, 1, 30_000);
      await waitForDueDateMovesRowCount(db, accountPk, 1, 30_000);
    });

    let t1Move: DueDateMoveRow | null = null;
    await test.step('Capture T1 = row_created_timestamp of move #1', async () => {
      t1Move = await getTopDueDateMoveRow(db, accountPk);
      expect(t1Move, 'top-1 row after move #1').toBeTruthy();
    });

    // ── Second move (1 → 2) ──
    await test.step('UI: reload Due Amounts and apply second move', async () => {
      await page.goto(`${testEnv.servicingUrl}/customer-information/${accountPk}`, {
        waitUntil: 'domcontentloaded',
      });
      await scheduled.waitForSpinner();
      await dismissCustomerInfoConfirmation(page);
      await scheduled.navigateToScheduledPayments();
      // WEEKLY backend cap = 3d (svc MoveDueDatesService:119)
      const freqRow = await db.queryOne<{ payment_frequency: string }>(
        'SELECT payment_frequency FROM uown_sv_sched_summary WHERE account_pk = $1',
        [accountPk],
      );
      const offsetDays = freqRow?.payment_frequency === 'WEEKLY' ? 2 : 7;
      const result = await scheduled.moveDueDateFirstOption(offsetDays);
      console.log(`[S3] move #2 (offset=${offsetDays}d, freq=${freqRow?.payment_frequency}): ${result.selectedDate} → ${result.newDate}`);
    });

    await test.step('DB: poll until both source tables reach moves=2', async () => {
      await waitForSchedSummaryMovesCount(db, accountPk, 2, 30_000);
      await waitForDueDateMovesRowCount(db, accountPk, 2, 30_000);
    });

    let topAfterMove2: DueDateMoveRow | null = null;
    await test.step('DB: capture top-1 after move #2 — must be newer than T1', async () => {
      topAfterMove2 = await getTopDueDateMoveRow(db, accountPk);
      expect(topAfterMove2, 'top-1 row after move #2').toBeTruthy();

      const t1Epoch = new Date(t1Move!.row_created_timestamp).getTime();
      const t2Epoch = new Date(topAfterMove2!.row_created_timestamp).getTime();
      expect(t2Epoch, 'move #2 row_created_timestamp must be > move #1').toBeGreaterThan(t1Epoch);
      // Tie-break safety: the top-1 row must NOT be the move-#1 row.
      expect(String(topAfterMove2!.pk)).not.toBe(String(t1Move!.pk));
    });

    // ── API (AC-7): counter = 2; AC-4: lastScheduleMovedDate matches move #2 ──
    await test.step('GET v1 summary — moves=2 and timestamp reflects move #2', async () => {
      const resp = await api.tmsAudit.getAccountSummary(accountPk);
      expect(resp.ok, `v1 getAccountSummary: ${resp.status}`).toBeTruthy();
      const body = resp.body;
      expect(body.numberOfDueDateMoves, 'v1: numberOfDueDateMoves should be 2').toBe(2);
      expect(typeof body.lastScheduleMovedDate).toBe('string');
      expectWithinTzWindow(
        body.lastScheduleMovedDate as string,
        topAfterMove2!.row_created_timestamp,
      );
    });

    await test.step('GET legacy summary — moves=2 and timestamp reflects move #2', async () => {
      const resp = await api.tmsAudit.getAccountSummaryLegacy(accountPk);
      expect(resp.ok, `legacy getAccountSummary: ${resp.status}`).toBeTruthy();
      const body = resp.body;
      expect(body.numberOfDueDateMoves, 'legacy: numberOfDueDateMoves should be 2').toBe(2);
      expect(typeof body.lastScheduleMovedDate).toBe('string');
      expectWithinTzWindow(
        body.lastScheduleMovedDate as string,
        topAfterMove2!.row_created_timestamp,
      );
    });

    // ── AC-8: 2 activity-log rows for this fresh account ──
    await test.step('Activity log: 2 DUE_DATE_MOVES rows for this account, both match regex', async () => {
      const rows = await getDueDateMovesActivityLogRows(db, accountPk);
      expect(rows.length, 'expected exactly 2 DUE_DATE_MOVES activity log rows').toBe(2);
      for (const row of rows) {
        expect(row.log_type).toBe('DUE_DATE_MOVES');
        expect(row.lead_pk, 'lead_pk must be NULL').toBeNull();
        expect(row.creation_source).toBe('USER_ACTION');
        expect(row.notes ?? '').toMatch(DUE_DATE_MOVES_NOTES_REGEX);
        expect((row.created_by ?? '').length).toBeGreaterThan(0);
      }
    });
  });

  // ════════════════════════════════════════════════════════════════════
  //  S4 — v1 ↔ legacy payload parity (deepEqual on the two new keys)
  // ════════════════════════════════════════════════════════════════════
  test('S4 — v1 ↔ legacy payload parity', {
    tag: ['@api'],
  }, async ({ api, db, ctx, page, testEnv }, testInfo) => {
    test.setTimeout(900_000);

    const { merchant, applicant } = buildTestData({
      state: testData.state,
      merchant: testData.merchant,
      orderTotal: testData.merchandiseAmount,
    });

    let accountPk = '';

    await test.step('Setup: fresh ACTIVE account', async () => {
      await createPreQualifiedApplication(
        api, merchant, applicant, ctx,
        { submitPaymentInfoViaApi: true },
        testInfo,
      );
      await driveLeadToFunding(api, merchant, ctx);
      const fundedResp = await api.lead.updateFundingStatus([Number(ctx.leadPk)], 'FUNDED');
      expect(fundedResp.ok, `updateFundingStatus FUNDED: ${fundedResp.status}`).toBeTruthy();

      const accountPkStr = await db.waitForAccountByLeadPk(ctx.leadPk, 90_000);
      expect(accountPkStr).toBeTruthy();
      accountPk = String(accountPkStr);
      ctx.accountPk = accountPk;
      testInfo.annotations.push({ type: 'accountPk', description: accountPk });

      await db.waitForAccountStatus(accountPk, 'ACTIVE', 180_000);
      console.log(`[S4] leadPk=${ctx.leadPk} accountPk=${accountPk} (ACTIVE)`);
    });

    // Apply a single UI move so the values are non-trivial (proves equality
    // on non-null timestamp + non-zero counter, not just on the empty state).
    await page.setViewportSize({ width: 1440, height: 900 });
    const scheduled = new ScheduledPaymentPage(page);

    await test.step('UI: apply one move so parity exercises non-null values', async () => {
      await page.goto(`${testEnv.servicingUrl}/customer-information/${accountPk}`, {
        waitUntil: 'domcontentloaded',
      });
      await scheduled.waitForSpinner();
      await dismissCustomerInfoConfirmation(page);
      await scheduled.navigateToScheduledPayments();
      // WEEKLY backend cap = 3d (svc MoveDueDatesService:119)
      const freqRow = await db.queryOne<{ payment_frequency: string }>(
        'SELECT payment_frequency FROM uown_sv_sched_summary WHERE account_pk = $1',
        [accountPk],
      );
      const offsetDays = freqRow?.payment_frequency === 'WEEKLY' ? 2 : 7;
      const result = await scheduled.moveDueDateFirstOption(offsetDays);
      console.log(`[S4] single move applied (offset=${offsetDays}d, freq=${freqRow?.payment_frequency}): ${result.selectedDate} → ${result.newDate}`);
    });

    await test.step('DB: wait until both source tables reach moves=1', async () => {
      await waitForSchedSummaryMovesCount(db, accountPk, 1, 30_000);
      await waitForDueDateMovesRowCount(db, accountPk, 1, 30_000);
    });

    // Sequential GETs in tight succession to minimize concurrent-mutation risk.
    await test.step('GET v1 and legacy back-to-back; assert deepEqual on the two new keys', async () => {
      const v1Resp = await api.tmsAudit.getAccountSummary(accountPk);
      const legacyResp = await api.tmsAudit.getAccountSummaryLegacy(accountPk);

      expect(v1Resp.ok, `v1: ${v1Resp.status}`).toBeTruthy();
      expect(legacyResp.ok, `legacy: ${legacyResp.status}`).toBeTruthy();

      // AC-6 (binding): the two new keys must be equal across endpoints.
      expect(legacyResp.body.numberOfDueDateMoves).toBe(v1Resp.body.numberOfDueDateMoves);
      expect(legacyResp.body.lastScheduleMovedDate).toBe(v1Resp.body.lastScheduleMovedDate);

      // Broader parity — locks the entire payload (deepEqual). Acknowledged as
      // [OBSERVAÇÃO]-level in spec; failure here may indicate drift OUTSIDE
      // #536 scope, but is useful regression evidence.
      expect(legacyResp.body, 'full payload deepEqual (legacy vs v1)').toEqual(v1Resp.body);
    });
  });
});

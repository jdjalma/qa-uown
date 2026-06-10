/**
 * RU04.26.1.51.0_fixUpdatingACHPaymentArrangementStatus_494
 *
 * Validates the refactored PaymentArrangementACHListener state machine (MR !1368).
 *
 * MR changed the listener to use two explicit EnumSets:
 *   PENDING_STATUSES  = { PENDING, SENT, ACK_RECEIVED, PICKED_TO_SEND, STATUS_UPDATE_PENDING, PENDING_TO_RERUN }
 *   SUCCESS_STATUSES  = { SETTLED, COMPLETED, SETTLED_IN_RERUN }
 *   isFailure         = !PENDING && !SUCCESS (residual logic)
 *
 * Priority: FAILURE > PENDING > SUCCESS
 *
 * Key behavioral changes from MR:
 *   - ACK_RECEIVED, PICKED_TO_SEND, PENDING_TO_RERUN: was "grey zone" -> now IN_PROGRESS (PENDING set)
 *   - CANCELLED, BLOCKED_ACCOUNT: was "grey zone" -> now FAILED (residual = failure)
 *   - Arrangement -> SUCCESS only when ALL ACH payments are in SUCCESS_STATUSES
 *
 * DB Simulation strategy (qa2 has no Profituity simulation):
 *   1. Create arrangement via API
 *   2. UPDATE ACH statuses directly in DB
 *   3. Recalculate via db.recalculateAchArrangementStatus(arrangementPk)
 *   4. Verify arrangement status in DB + UI
 *
 * Project: task-testing (not portal-ui)
 * Environment: qa2
 *
 * 22 tests across 5 groups:
 *   Group 1 — SUCCESS (5 tests): CT-01..CT-05
 *   Group 2 — PENDING (6 tests): CT-06..CT-11
 *   Group 3 — FAILURE (4 tests): CT-12..CT-15
 *   Group 4 — Mix    (3 tests): CT-16..CT-18
 *   Group 5 — UI     (4 tests): CT-UI-01..CT-UI-04
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { ServicingCustomerPage, PaymentArrangementPage } from '@pages/servicing/index.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';
import { calculateDateISO } from '@helpers/date.helpers.js';
import { buildAchArrangementBody } from '@api/bodies/payment-arrangement.body.js';
import { sleep } from '@helpers/common.helpers.js';

const TEST_NAME = 'RU04.26.1.51.0_fixUpdatingACHPaymentArrangementStatus_494';
const SCREENSHOT_DIR = `docs/taskTestingUown/${TEST_NAME}/screenshots`;

const testData = [
  {
    env: 'qa2' as const,
    tag: buildTags(TestTag.REGRESSION, TestTag.QA2),
  },
];

for (const td of testData) {
  test.describe(`${TEST_NAME} - ${td.env}`, { tag: splitTags(td.tag) }, () => {
    test.describe.configure({ mode: 'serial' });
    test.use({ envName: td.env });

    // ── Account PKs (one per CT, populated in beforeAll) ──────────────
    let accountPkCt01 = '';
    let accountPkCt02 = '';
    let accountPkCt03 = '';
    let accountPkCt04 = '';
    let accountPkCt05 = ''; // DESTRUCTIVE — SETTLEMENT -> SETTLED_IN_FULL
    let accountPkCt06 = '';
    let accountPkCt07 = '';
    let accountPkCt08 = '';
    let accountPkCt09 = '';
    let accountPkCt10 = '';
    let accountPkCt11 = '';
    let accountPkCt12 = '';
    let accountPkCt13 = '';
    let accountPkCt14 = '';
    let accountPkCt15 = '';
    let accountPkCt16 = '';
    let accountPkCt17 = '';
    let accountPkCt18 = '';

    // ── Arrangement PKs (populated per CT, shared with UI CTs) ────────
    let arrangementPkCt01 = '';
    let arrangementPkCt05 = '';
    let arrangementPkCt08 = '';
    let arrangementPkCt14 = '';

    // ── beforeAll: find 18 eligible ACTIVE accounts ───────────────────
    // Filter: ACTIVE + no ACTIVE arrangement + has non-deleted bank.
    //
    // We intentionally ALLOW accounts with closed arrangements and with
    // historical ACH payments from those closed arrangements. Two reasons:
    //
    //   (a) qa2 cannot create new accounts via API — /submitApplication
    //       currently returns 500, breaking driveLeadToFunding.
    //   (b) Accounts that have NEVER had an arrangement
    //       (pk <= 10920 in qa2) sit in a half-initialised state where
    //       /createOrUpdateACHPayments returns 500. Accounts that have
    //       been through the full lifecycle at least once
    //       (pk >= 10924) accept new NORMAL arrangements cleanly.
    //
    // The test creates a brand-new arrangement per CT, so the presence of
    // older CLOSED arrangements on the same account does not interfere
    // with any assertion — `getPaymentArrangement` uses ORDER BY pk DESC
    // LIMIT 1 and always resolves to the freshly-created row.
    test.beforeAll(async ({ db }) => {
      const rows = await db.query<{ pk: string }>(
        `SELECT a.pk::text AS pk FROM uown_sv_account a
         WHERE a.account_status = 'ACTIVE'
           AND NOT EXISTS (
             SELECT 1 FROM uown_sv_payment_arrangement p
             WHERE p.account_pk = a.pk AND p.is_active = true
           )
           AND EXISTS (
             SELECT 1 FROM uown_sv_bank_account ba
             WHERE ba.account_pk = a.pk AND ba.is_deleted = false
           )
         ORDER BY a.pk DESC LIMIT 20`,
      );

      const pks = rows.map(r => r.pk);
      console.log(`[beforeAll] Found ${pks.length} eligible ACTIVE accounts (no active arrangement, has bank)`);

      if (pks.length < 18) {
        console.warn(`[beforeAll] Need 18 accounts but found ${pks.length} — some CTs will be skipped`);
      }

      // Assign accounts: index 0..17 for CT-01..CT-18
      accountPkCt01 = pks[0] ?? '';
      accountPkCt02 = pks[1] ?? '';
      accountPkCt03 = pks[2] ?? '';
      accountPkCt04 = pks[3] ?? '';
      accountPkCt05 = pks[4] ?? ''; // DESTRUCTIVE
      accountPkCt06 = pks[5] ?? '';
      accountPkCt07 = pks[6] ?? '';
      accountPkCt08 = pks[7] ?? '';
      accountPkCt09 = pks[8] ?? '';
      accountPkCt10 = pks[9] ?? '';
      accountPkCt11 = pks[10] ?? '';
      accountPkCt12 = pks[11] ?? '';
      accountPkCt13 = pks[12] ?? '';
      accountPkCt14 = pks[13] ?? '';
      accountPkCt15 = pks[14] ?? '';
      accountPkCt16 = pks[15] ?? '';
      accountPkCt17 = pks[16] ?? '';
      accountPkCt18 = pks[17] ?? '';

      console.log('[beforeAll] Account assignments:');
      console.log(`  CT-01=${accountPkCt01}, CT-02=${accountPkCt02}, CT-03=${accountPkCt03}`);
      console.log(`  CT-04=${accountPkCt04}, CT-05=${accountPkCt05} (DESTRUCTIVE)`);
      console.log(`  CT-06=${accountPkCt06}, CT-07=${accountPkCt07}, CT-08=${accountPkCt08}`);
      console.log(`  CT-09=${accountPkCt09}, CT-10=${accountPkCt10}, CT-11=${accountPkCt11}`);
      console.log(`  CT-12=${accountPkCt12}, CT-13=${accountPkCt13}, CT-14=${accountPkCt14}`);
      console.log(`  CT-15=${accountPkCt15}, CT-16=${accountPkCt16}, CT-17=${accountPkCt17}`);
      console.log(`  CT-18=${accountPkCt18}`);
    });

    // ══════════════════════════════════════════════════════════════════
    //  HELPER: Create ACH arrangement + verify initial state
    // ══════════════════════════════════════════════════════════════════

    async function createArrangement(
      api: { paymentArrangement: { createOrUpdateAchPayments: (body: ReturnType<typeof buildAchArrangementBody>) => Promise<{ ok: boolean; status: number; statusText: string }> } },
      db: { getPaymentArrangement: (pk: string) => Promise<Record<string, unknown> | null>; getAchPaymentsByArrangement: (pk: string) => Promise<Array<Record<string, unknown>>> },
      accountPk: string,
      installmentCount: number,
      arrangementType: 'NORMAL' | 'SETTLEMENT' = 'NORMAL',
    ): Promise<{ arrangementPk: string; achPks: string[] }> {
      const today = calculateDateISO(0);
      const installments = Array.from({ length: installmentCount }, () => ({
        amount: '100',
        date: today,
      }));

      const body = buildAchArrangementBody({
        accountPk: Number(accountPk),
        arrangementType,
        installments,
      });

      const res = await api.paymentArrangement.createOrUpdateAchPayments(body);
      expect(res.ok, `createOrUpdateAchPayments failed: ${res.status} ${res.statusText}`).toBeTruthy();

      const arrangement = await db.getPaymentArrangement(accountPk);
      expect(arrangement, `No arrangement found for account ${accountPk}`).not.toBeNull();

      const arrangementPk = String(arrangement!.pk);
      expect(arrangement!.status).toBe('NOT_STARTED');
      expect(arrangement!.is_active).toBe(true);
      expect(arrangement!.arrangement_type).toBe(arrangementType);

      const achPayments = await db.getAchPaymentsByArrangement(arrangementPk);
      expect(achPayments.length).toBe(installmentCount);
      for (const p of achPayments) {
        expect(p.status).toBe('PENDING');
      }

      const achPks = achPayments.map(p => String(p.pk));
      return { arrangementPk, achPks };
    }

    // ══════════════════════════════════════════════════════════════════
    //  HELPER: Update all ACH statuses for an arrangement
    // ══════════════════════════════════════════════════════════════════

    async function updateAllAchStatuses(
      db: { executeUpdate: (sql: string, params: unknown[]) => Promise<number> },
      arrangementPk: string,
      status: string,
    ): Promise<void> {
      const updated = await db.executeUpdate(
        `UPDATE uown_sv_achpayment SET status = $1 WHERE payment_arrangement_pk = $2`,
        [status, arrangementPk],
      );
      expect(updated, `Expected at least 1 ACH updated to ${status}`).toBeGreaterThan(0);
    }

    // ══════════════════════════════════════════════════════════════════
    //  HELPER: Update individual ACH by PK
    // ══════════════════════════════════════════════════════════════════

    async function updateAchStatusByPk(
      db: { executeUpdate: (sql: string, params: unknown[]) => Promise<number> },
      achPk: string,
      status: string,
    ): Promise<void> {
      const updated = await db.executeUpdate(
        `UPDATE uown_sv_achpayment SET status = $1 WHERE pk = $2`,
        [status, achPk],
      );
      expect(updated, `Expected ACH pk=${achPk} to be updated to ${status}`).toBe(1);
    }

    // ══════════════════════════════════════════════════════════════════
    //  HELPER: Verify Rating Letter (DB) + rating activity log
    //
    //  Rating Letter is surfaced to the end user on the customer-information
    //  page at /customer-information/{accountPk} — it communicates the
    //  collection posture of the account (e.g. "P" = Promise to Pay set when
    //  an arrangement is created). Every ACH arrangement scenario should
    //  therefore verify both the persisted DB value and the activity log
    //  trail that explains the change to anyone auditing the account.
    //
    //  Bug #446 (fixed): updateRatingLetterAndAutoPay now persists the
    //  entity correctly — rating = 'P' after arrangement creation.
    // ══════════════════════════════════════════════════════════════════

    async function verifyRatingLetterDb(
      db: {
        getAccountRating: (accountPk: string) => Promise<string | null>;
        getActivityLogsByAccount: (accountPk: string, search?: string) => Promise<Array<Record<string, unknown>>>;
      },
      accountPk: string,
      arrangementPk: string,
      ctName: string,
    ): Promise<{ dbRating: string | null; ratingLogNote: string }> {
      const dbRating = await db.getAccountRating(accountPk);

      // Filter by BOTH "rating" AND this specific arrangementPk
      // LIKE pattern: %rating%arrangementPk=XXX% — the % acts as wildcard between terms
      const logs = await db.getActivityLogsByAccount(accountPk, `rating%arrangementPk=${arrangementPk}`);

      console.log(`[${ctName}] Rating Letter (DB): ${dbRating ?? 'null'}`);
      console.log(`[${ctName}] Rating log entries for arrangementPk=${arrangementPk}: ${logs.length}`);

      // Rating letter must be 'P' (Promise to Pay) after arrangement creation
      expect(dbRating, `[${ctName}] Rating Letter must be 'P' in DB after arrangement creation`).toBe('P');

      // Activity log must contain at least one rating entry for THIS specific arrangement
      expect(logs.length, `[${ctName}] Expected rating log entry for arrangementPk=${arrangementPk}`).toBeGreaterThan(0);

      const ratingLogNote = String(logs[0].notes);
      console.log(`[${ctName}] Rating log: "${ratingLogNote.substring(0, 200)}"`);

      return { dbRating, ratingLogNote };
    }

    // ══════════════════════════════════════════════════════════════════
    //  GROUP 1 — SUCCESS (5 tests)
    // ══════════════════════════════════════════════════════════════════

    test('CT-01: All ACH SETTLED -> arrangement SUCCESS (NORMAL)', async ({ db, api }) => {
      test.setTimeout(120_000);
      test.skip(!accountPkCt01, 'No eligible account for CT-01');

      let arrangementPk = '';

      await test.step('Step 1 — Create ACH arrangement (NORMAL, 2 installments)', async () => {
        const result = await createArrangement(api, db, accountPkCt01, 2, 'NORMAL');
        arrangementPk = result.arrangementPk;
        arrangementPkCt01 = arrangementPk;
        console.log(`[CT-01] arrangementPk=${arrangementPk}, accountPk=${accountPkCt01}`);
      });

      await test.step('Step 2 — UPDATE all ACH to SETTLED', async () => {
        await updateAllAchStatuses(db, arrangementPk, 'SETTLED');
        const achPayments = await db.getAchPaymentsByArrangement(arrangementPk);
        for (const p of achPayments) {
          expect(p.status).toBe('SETTLED');
        }
      });

      await test.step('Step 3 — Recalculate -> expect SUCCESS', async () => {
        const newStatus = await db.recalculateAchArrangementStatus(arrangementPk);
        expect(newStatus).toBe('SUCCESS');

        const arrangement = await db.getPaymentArrangementByPk(arrangementPk);
        expect(arrangement!.status).toBe('SUCCESS');
        expect(arrangement!.is_active).toBe(false);
        console.log(`[CT-01] Arrangement status=SUCCESS, is_active=false`);
      });

      await test.step('Step 4 — Verify Rating Letter (user-facing) + activity log', async () => {
        await verifyRatingLetterDb(db, accountPkCt01, arrangementPk, 'CT-01');
      });
    });

    test('CT-02: All ACH COMPLETED -> arrangement SUCCESS (NORMAL)', async ({ db, api }) => {
      test.setTimeout(120_000);
      test.skip(!accountPkCt02, 'No eligible account for CT-02');

      let arrangementPk = '';

      await test.step('Step 1 — Create ACH arrangement (NORMAL, 2 installments)', async () => {
        const result = await createArrangement(api, db, accountPkCt02, 2, 'NORMAL');
        arrangementPk = result.arrangementPk;
        console.log(`[CT-02] arrangementPk=${arrangementPk}`);
      });

      await test.step('Step 2 — UPDATE all ACH to COMPLETED', async () => {
        await updateAllAchStatuses(db, arrangementPk, 'COMPLETED');
      });

      await test.step('Step 3 — Recalculate -> expect SUCCESS', async () => {
        const newStatus = await db.recalculateAchArrangementStatus(arrangementPk);
        expect(newStatus).toBe('SUCCESS');

        const arrangement = await db.getPaymentArrangementByPk(arrangementPk);
        expect(arrangement!.status).toBe('SUCCESS');
        expect(arrangement!.is_active).toBe(false);
        console.log(`[CT-02] Arrangement status=SUCCESS`);
      });

      await test.step('Step 4 — Verify Rating Letter (user-facing) + activity log', async () => {
        await verifyRatingLetterDb(db, accountPkCt02, arrangementPk, 'CT-02');
      });
    });

    test('CT-03: All ACH SETTLED_IN_RERUN -> arrangement SUCCESS (NORMAL)', async ({ db, api }) => {
      test.setTimeout(120_000);
      test.skip(!accountPkCt03, 'No eligible account for CT-03');

      let arrangementPk = '';

      await test.step('Step 1 — Create ACH arrangement (NORMAL, 2 installments)', async () => {
        const result = await createArrangement(api, db, accountPkCt03, 2, 'NORMAL');
        arrangementPk = result.arrangementPk;
        console.log(`[CT-03] arrangementPk=${arrangementPk}`);
      });

      await test.step('Step 2 — UPDATE all ACH to SETTLED_IN_RERUN', async () => {
        await updateAllAchStatuses(db, arrangementPk, 'SETTLED_IN_RERUN');
      });

      await test.step('Step 3 — Recalculate -> expect SUCCESS', async () => {
        const newStatus = await db.recalculateAchArrangementStatus(arrangementPk);
        expect(newStatus).toBe('SUCCESS');

        const arrangement = await db.getPaymentArrangementByPk(arrangementPk);
        expect(arrangement!.status).toBe('SUCCESS');
        expect(arrangement!.is_active).toBe(false);
        console.log(`[CT-03] Arrangement status=SUCCESS`);
      });

      await test.step('Step 4 — Verify Rating Letter (user-facing) + activity log', async () => {
        await verifyRatingLetterDb(db, accountPkCt03, arrangementPk, 'CT-03');
      });
    });

    test('CT-04: Mixed SUCCESS statuses (SETTLED + COMPLETED + SETTLED_IN_RERUN) -> SUCCESS (NORMAL)', async ({ db, api }) => {
      test.setTimeout(120_000);
      test.skip(!accountPkCt04, 'No eligible account for CT-04');

      let achPks: string[] = [];
      let arrangementPk = '';

      await test.step('Step 1 — Create ACH arrangement (NORMAL, 3 installments)', async () => {
        const result = await createArrangement(api, db, accountPkCt04, 3, 'NORMAL');
        arrangementPk = result.arrangementPk;
        achPks = result.achPks;
        console.log(`[CT-04] arrangementPk=${arrangementPk}, achPks=[${achPks.join(', ')}]`);
      });

      await test.step('Step 2 — UPDATE each ACH to a different SUCCESS status', async () => {
        await updateAchStatusByPk(db, achPks[0], 'SETTLED');
        await updateAchStatusByPk(db, achPks[1], 'COMPLETED');
        await updateAchStatusByPk(db, achPks[2], 'SETTLED_IN_RERUN');

        const achPayments = await db.getAchPaymentsByArrangement(arrangementPk);
        const statuses = achPayments.map(p => String(p.status));
        expect(statuses).toContain('SETTLED');
        expect(statuses).toContain('COMPLETED');
        expect(statuses).toContain('SETTLED_IN_RERUN');
      });

      await test.step('Step 3 — Recalculate -> expect SUCCESS (all in SUCCESS set)', async () => {
        const newStatus = await db.recalculateAchArrangementStatus(arrangementPk);
        expect(newStatus).toBe('SUCCESS');

        const arrangement = await db.getPaymentArrangementByPk(arrangementPk);
        expect(arrangement!.status).toBe('SUCCESS');
        expect(arrangement!.is_active).toBe(false);
        console.log(`[CT-04] Arrangement status=SUCCESS (mixed SUCCESS statuses)`);
      });

      await test.step('Step 4 — Verify Rating Letter (user-facing) + activity log', async () => {
        await verifyRatingLetterDb(db, accountPkCt04, arrangementPk, 'CT-04');
      });
    });

    test('CT-05: SETTLEMENT + all SETTLED -> SUCCESS + account SETTLED_IN_FULL (DESTRUCTIVE)', async ({ db, api }) => {
      test.setTimeout(120_000);
      test.skip(!accountPkCt05, 'No eligible account for CT-05');

      let arrangementPk = '';

      await test.step('Step 1 — Verify account is ACTIVE before SETTLEMENT', async () => {
        const status = await db.getAccountStatus(accountPkCt05);
        expect(status).toBe('ACTIVE');
        console.log(`[CT-05] accountPk=${accountPkCt05}, status=${status} (DESTRUCTIVE test)`);
      });

      await test.step('Step 2 — Create ACH SETTLEMENT arrangement (2 installments)', async () => {
        const result = await createArrangement(api, db, accountPkCt05, 2, 'SETTLEMENT');
        arrangementPk = result.arrangementPk;
        arrangementPkCt05 = arrangementPk;
        expect(result.achPks.length).toBe(2);
        console.log(`[CT-05] SETTLEMENT arrangementPk=${arrangementPk}`);
      });

      await test.step('Step 3 — UPDATE all ACH to SETTLED', async () => {
        await updateAllAchStatuses(db, arrangementPk, 'SETTLED');
      });

      await test.step('Step 4 — Recalculate -> expect SUCCESS + SETTLED_IN_FULL', async () => {
        const newStatus = await db.recalculateAchArrangementStatus(arrangementPk);
        expect(newStatus).toBe('SUCCESS');

        const arrangement = await db.getPaymentArrangementByPk(arrangementPk);
        expect(arrangement!.status).toBe('SUCCESS');
        expect(arrangement!.is_active).toBe(false);

        // KEY: SETTLEMENT + SUCCESS -> account SETTLED_IN_FULL
        const accountStatus = await db.getAccountStatus(accountPkCt05);
        expect(accountStatus).toBe('SETTLED_IN_FULL');
        console.log(`[CT-05] Arrangement status=SUCCESS, account status=SETTLED_IN_FULL`);
      });

      await test.step('Step 5 — Verify Rating Letter (user-facing) + activity log', async () => {
        await verifyRatingLetterDb(db, accountPkCt05, arrangementPk, 'CT-05');
      });
    });

    // ══════════════════════════════════════════════════════════════════
    //  GROUP 2 — PENDING (6 tests)
    // ══════════════════════════════════════════════════════════════════

    test('CT-06: Initial state (no sweep, no recalculate) -> NOT_STARTED + ACH PENDING', async ({ db, api }) => {
      test.setTimeout(120_000);
      test.skip(!accountPkCt06, 'No eligible account for CT-06');

      let arrangementPk = '';

      await test.step('Step 1 — Create ACH arrangement (NORMAL, 2 installments)', async () => {
        const result = await createArrangement(api, db, accountPkCt06, 2, 'NORMAL');
        arrangementPk = result.arrangementPk;
        console.log(`[CT-06] arrangementPk=${arrangementPk} — verifying initial state (no recalculate)`);
      });

      await test.step('Step 2 — Verify initial state: NOT_STARTED, all PENDING', async () => {
        const arrangement = await db.getPaymentArrangementByPk(arrangementPk);
        expect(arrangement!.status).toBe('NOT_STARTED');
        expect(arrangement!.is_active).toBe(true);

        const achPayments = await db.getAchPaymentsByArrangement(arrangementPk);
        for (const p of achPayments) {
          expect(p.status).toBe('PENDING');
        }
        console.log(`[CT-06] Initial state confirmed: NOT_STARTED, ${achPayments.length} PENDING`);
      });

      await test.step('Step 3 — Re-verify after 5s (no background processing changed it)', async () => {
        await sleep(5_000);
        const arrangement = await db.getPaymentArrangementByPk(arrangementPk);
        expect(arrangement!.status).toBe('NOT_STARTED');
        console.log(`[CT-06] After 5s: still NOT_STARTED (no background sweep active)`);
      });

      await test.step('Step 4 — Verify Rating Letter (user-facing) + activity log', async () => {
        await verifyRatingLetterDb(db, accountPkCt06, arrangementPk, 'CT-06');
      });
    });

    test('CT-07: All ACH SENT -> arrangement IN_PROGRESS (NORMAL)', async ({ db, api }) => {
      test.setTimeout(120_000);
      test.skip(!accountPkCt07, 'No eligible account for CT-07');

      let arrangementPk = '';

      await test.step('Step 1 — Create ACH arrangement (NORMAL, 2 installments)', async () => {
        const result = await createArrangement(api, db, accountPkCt07, 2, 'NORMAL');
        arrangementPk = result.arrangementPk;
        console.log(`[CT-07] arrangementPk=${arrangementPk}`);
      });

      await test.step('Step 2 — UPDATE all ACH to SENT', async () => {
        await updateAllAchStatuses(db, arrangementPk, 'SENT');
      });

      await test.step('Step 3 — Recalculate -> expect IN_PROGRESS (SENT is PENDING set)', async () => {
        const newStatus = await db.recalculateAchArrangementStatus(arrangementPk);
        expect(newStatus).toBe('IN_PROGRESS');

        const arrangement = await db.getPaymentArrangementByPk(arrangementPk);
        expect(arrangement!.status).toBe('IN_PROGRESS');
        expect(arrangement!.is_active).toBe(true);
        console.log(`[CT-07] Arrangement status=IN_PROGRESS`);
      });

      await test.step('Step 4 — Verify Rating Letter (user-facing) + activity log', async () => {
        await verifyRatingLetterDb(db, accountPkCt07, arrangementPk, 'CT-07');
      });
    });

    test('CT-08: All ACH ACK_RECEIVED -> IN_PROGRESS (KEY: was grey zone before MR)', async ({ db, api }) => {
      test.setTimeout(120_000);
      test.skip(!accountPkCt08, 'No eligible account for CT-08');

      let arrangementPk = '';

      await test.step('Step 1 — Create ACH arrangement (NORMAL, 2 installments)', async () => {
        const result = await createArrangement(api, db, accountPkCt08, 2, 'NORMAL');
        arrangementPk = result.arrangementPk;
        arrangementPkCt08 = arrangementPk;
        console.log(`[CT-08] arrangementPk=${arrangementPk} — KEY: ACK_RECEIVED was grey zone`);
      });

      await test.step('Step 2 — UPDATE all ACH to ACK_RECEIVED', async () => {
        await updateAllAchStatuses(db, arrangementPk, 'ACK_RECEIVED');
      });

      await test.step('Step 3 — Recalculate -> expect IN_PROGRESS (NOT FAILED, NOT SUCCESS)', async () => {
        const newStatus = await db.recalculateAchArrangementStatus(arrangementPk);
        expect(newStatus, 'ACK_RECEIVED must now be IN_PROGRESS (was grey zone before MR)').toBe('IN_PROGRESS');

        const arrangement = await db.getPaymentArrangementByPk(arrangementPk);
        expect(arrangement!.status).toBe('IN_PROGRESS');
        expect(arrangement!.is_active).toBe(true);
        console.log(`[CT-08] KEY ASSERTION PASSED: ACK_RECEIVED -> IN_PROGRESS (not FAILED)`);
      });

      await test.step('Step 4 — Verify Rating Letter (user-facing) + activity log', async () => {
        await verifyRatingLetterDb(db, accountPkCt08, arrangementPk, 'CT-08');
      });
    });

    test('CT-09: All ACH PICKED_TO_SEND -> IN_PROGRESS (KEY: was grey zone before MR)', async ({ db, api }) => {
      test.setTimeout(120_000);
      test.skip(!accountPkCt09, 'No eligible account for CT-09');

      let arrangementPk = '';

      await test.step('Step 1 — Create ACH arrangement (NORMAL, 2 installments)', async () => {
        const result = await createArrangement(api, db, accountPkCt09, 2, 'NORMAL');
        arrangementPk = result.arrangementPk;
        console.log(`[CT-09] arrangementPk=${arrangementPk} — KEY: PICKED_TO_SEND was grey zone`);
      });

      await test.step('Step 2 — UPDATE all ACH to PICKED_TO_SEND', async () => {
        await updateAllAchStatuses(db, arrangementPk, 'PICKED_TO_SEND');
      });

      await test.step('Step 3 — Recalculate -> expect IN_PROGRESS (NOT FAILED)', async () => {
        const newStatus = await db.recalculateAchArrangementStatus(arrangementPk);
        expect(newStatus, 'PICKED_TO_SEND must now be IN_PROGRESS (was grey zone before MR)').toBe('IN_PROGRESS');

        const arrangement = await db.getPaymentArrangementByPk(arrangementPk);
        expect(arrangement!.status).toBe('IN_PROGRESS');
        expect(arrangement!.is_active).toBe(true);
        console.log(`[CT-09] KEY ASSERTION PASSED: PICKED_TO_SEND -> IN_PROGRESS`);
      });

      await test.step('Step 4 — Verify Rating Letter (user-facing) + activity log', async () => {
        await verifyRatingLetterDb(db, accountPkCt09, arrangementPk, 'CT-09');
      });
    });

    test('CT-10: All ACH PENDING_TO_RERUN -> IN_PROGRESS (KEY: was grey zone before MR)', async ({ db, api }) => {
      test.setTimeout(120_000);
      test.skip(!accountPkCt10, 'No eligible account for CT-10');

      let arrangementPk = '';

      await test.step('Step 1 — Create ACH arrangement (NORMAL, 2 installments)', async () => {
        const result = await createArrangement(api, db, accountPkCt10, 2, 'NORMAL');
        arrangementPk = result.arrangementPk;
        console.log(`[CT-10] arrangementPk=${arrangementPk} — KEY: PENDING_TO_RERUN was grey zone`);
      });

      await test.step('Step 2 — UPDATE all ACH to PENDING_TO_RERUN', async () => {
        await updateAllAchStatuses(db, arrangementPk, 'PENDING_TO_RERUN');
      });

      await test.step('Step 3 — Recalculate -> expect IN_PROGRESS (NOT FAILED)', async () => {
        const newStatus = await db.recalculateAchArrangementStatus(arrangementPk);
        expect(newStatus, 'PENDING_TO_RERUN must now be IN_PROGRESS (was grey zone before MR)').toBe('IN_PROGRESS');

        const arrangement = await db.getPaymentArrangementByPk(arrangementPk);
        expect(arrangement!.status).toBe('IN_PROGRESS');
        expect(arrangement!.is_active).toBe(true);
        console.log(`[CT-10] KEY ASSERTION PASSED: PENDING_TO_RERUN -> IN_PROGRESS`);
      });

      await test.step('Step 4 — Verify Rating Letter (user-facing) + activity log', async () => {
        await verifyRatingLetterDb(db, accountPkCt10, arrangementPk, 'CT-10');
      });
    });

    test('CT-11: All ACH STATUS_UPDATE_PENDING -> IN_PROGRESS (NORMAL)', async ({ db, api }) => {
      test.setTimeout(120_000);
      test.skip(!accountPkCt11, 'No eligible account for CT-11');

      let arrangementPk = '';

      await test.step('Step 1 — Create ACH arrangement (NORMAL, 2 installments)', async () => {
        const result = await createArrangement(api, db, accountPkCt11, 2, 'NORMAL');
        arrangementPk = result.arrangementPk;
        console.log(`[CT-11] arrangementPk=${arrangementPk}`);
      });

      await test.step('Step 2 — UPDATE all ACH to STATUS_UPDATE_PENDING', async () => {
        await updateAllAchStatuses(db, arrangementPk, 'STATUS_UPDATE_PENDING');
      });

      await test.step('Step 3 — Recalculate -> expect IN_PROGRESS', async () => {
        const newStatus = await db.recalculateAchArrangementStatus(arrangementPk);
        expect(newStatus).toBe('IN_PROGRESS');

        const arrangement = await db.getPaymentArrangementByPk(arrangementPk);
        expect(arrangement!.status).toBe('IN_PROGRESS');
        expect(arrangement!.is_active).toBe(true);
        console.log(`[CT-11] Arrangement status=IN_PROGRESS`);
      });

      await test.step('Step 4 — Verify Rating Letter (user-facing) + activity log', async () => {
        await verifyRatingLetterDb(db, accountPkCt11, arrangementPk, 'CT-11');
      });
    });

    // ══════════════════════════════════════════════════════════════════
    //  GROUP 3 — FAILURE (4 tests)
    // ══════════════════════════════════════════════════════════════════

    test('CT-12: All ACH RETURNED -> arrangement FAILED, account unchanged (NORMAL)', async ({ db, api }) => {
      test.setTimeout(120_000);
      test.skip(!accountPkCt12, 'No eligible account for CT-12');

      let arrangementPk = '';

      await test.step('Step 1 — Create ACH arrangement (NORMAL, 2 installments)', async () => {
        const result = await createArrangement(api, db, accountPkCt12, 2, 'NORMAL');
        arrangementPk = result.arrangementPk;
        console.log(`[CT-12] arrangementPk=${arrangementPk}`);
      });

      await test.step('Step 2 — UPDATE all ACH to RETURNED', async () => {
        await updateAllAchStatuses(db, arrangementPk, 'RETURNED');
      });

      await test.step('Step 3 — Recalculate -> expect FAILED', async () => {
        const newStatus = await db.recalculateAchArrangementStatus(arrangementPk);
        expect(newStatus).toBe('FAILED');

        const arrangement = await db.getPaymentArrangementByPk(arrangementPk);
        expect(arrangement!.status).toBe('FAILED');
        expect(arrangement!.is_active).toBe(false);
        console.log(`[CT-12] Arrangement status=FAILED`);
      });

      await test.step('Step 4 — Verify account unchanged (still ACTIVE)', async () => {
        const accountStatus = await db.getAccountStatus(accountPkCt12);
        expect(accountStatus).toBe('ACTIVE');
        console.log(`[CT-12] Account status unchanged: ${accountStatus}`);
      });

      await test.step('Step 5 — Verify Rating Letter (user-facing) + activity log', async () => {
        await verifyRatingLetterDb(db, accountPkCt12, arrangementPk, 'CT-12');
      });
    });

    test('CT-13: All ACH ERROR -> arrangement FAILED (NORMAL)', async ({ db, api }) => {
      test.setTimeout(120_000);
      test.skip(!accountPkCt13, 'No eligible account for CT-13');

      let arrangementPk = '';

      await test.step('Step 1 — Create ACH arrangement (NORMAL, 2 installments)', async () => {
        const result = await createArrangement(api, db, accountPkCt13, 2, 'NORMAL');
        arrangementPk = result.arrangementPk;
        console.log(`[CT-13] arrangementPk=${arrangementPk}`);
      });

      await test.step('Step 2 — UPDATE all ACH to ERROR', async () => {
        await updateAllAchStatuses(db, arrangementPk, 'ERROR');
      });

      await test.step('Step 3 — Recalculate -> expect FAILED', async () => {
        const newStatus = await db.recalculateAchArrangementStatus(arrangementPk);
        expect(newStatus).toBe('FAILED');

        const arrangement = await db.getPaymentArrangementByPk(arrangementPk);
        expect(arrangement!.status).toBe('FAILED');
        expect(arrangement!.is_active).toBe(false);
        console.log(`[CT-13] Arrangement status=FAILED`);
      });

      await test.step('Step 4 — Verify Rating Letter (user-facing) + activity log', async () => {
        await verifyRatingLetterDb(db, accountPkCt13, arrangementPk, 'CT-13');
      });
    });

    test('CT-14: All ACH CANCELLED -> arrangement FAILED (KEY: was grey zone before MR)', async ({ db, api }) => {
      test.setTimeout(120_000);
      test.skip(!accountPkCt14, 'No eligible account for CT-14');

      let arrangementPk = '';

      await test.step('Step 1 — Create ACH arrangement (NORMAL, 2 installments)', async () => {
        const result = await createArrangement(api, db, accountPkCt14, 2, 'NORMAL');
        arrangementPk = result.arrangementPk;
        arrangementPkCt14 = arrangementPk;
        console.log(`[CT-14] arrangementPk=${arrangementPk} — KEY: CANCELLED was grey zone`);
      });

      await test.step('Step 2 — UPDATE all ACH to CANCELLED', async () => {
        await updateAllAchStatuses(db, arrangementPk, 'CANCELLED');
      });

      await test.step('Step 3 — Recalculate -> expect FAILED (CANCELLED is residual = failure)', async () => {
        const newStatus = await db.recalculateAchArrangementStatus(arrangementPk);
        expect(newStatus, 'CANCELLED must now be FAILED (residual logic in MR)').toBe('FAILED');

        const arrangement = await db.getPaymentArrangementByPk(arrangementPk);
        expect(arrangement!.status).toBe('FAILED');
        expect(arrangement!.is_active).toBe(false);
        console.log(`[CT-14] KEY ASSERTION PASSED: CANCELLED -> FAILED (was grey zone)`);
      });

      await test.step('Step 4 — Verify Rating Letter (user-facing) + activity log', async () => {
        await verifyRatingLetterDb(db, accountPkCt14, arrangementPk, 'CT-14');
      });
    });

    test('CT-15: All ACH BLOCKED_ACCOUNT -> arrangement FAILED (KEY: was grey zone before MR)', async ({ db, api }) => {
      test.setTimeout(120_000);
      test.skip(!accountPkCt15, 'No eligible account for CT-15');

      let arrangementPk = '';

      await test.step('Step 1 — Create ACH arrangement (NORMAL, 2 installments)', async () => {
        const result = await createArrangement(api, db, accountPkCt15, 2, 'NORMAL');
        arrangementPk = result.arrangementPk;
        console.log(`[CT-15] arrangementPk=${arrangementPk} — KEY: BLOCKED_ACCOUNT was grey zone`);
      });

      await test.step('Step 2 — UPDATE all ACH to BLOCKED_ACCOUNT', async () => {
        await updateAllAchStatuses(db, arrangementPk, 'BLOCKED_ACCOUNT');
      });

      await test.step('Step 3 — Recalculate -> expect FAILED (BLOCKED_ACCOUNT is residual = failure)', async () => {
        const newStatus = await db.recalculateAchArrangementStatus(arrangementPk);
        expect(newStatus, 'BLOCKED_ACCOUNT must now be FAILED (residual logic)').toBe('FAILED');

        const arrangement = await db.getPaymentArrangementByPk(arrangementPk);
        expect(arrangement!.status).toBe('FAILED');
        expect(arrangement!.is_active).toBe(false);
        console.log(`[CT-15] KEY ASSERTION PASSED: BLOCKED_ACCOUNT -> FAILED (was grey zone)`);
      });

      await test.step('Step 4 — Verify Rating Letter (user-facing) + activity log', async () => {
        await verifyRatingLetterDb(db, accountPkCt15, arrangementPk, 'CT-15');
      });
    });

    // ══════════════════════════════════════════════════════════════════
    //  GROUP 4 — MIX (3 tests, 2 installments each)
    // ══════════════════════════════════════════════════════════════════

    test('CT-16: SETTLED + PENDING -> IN_PROGRESS (not SUCCESS)', async ({ db, api }) => {
      test.setTimeout(120_000);
      test.skip(!accountPkCt16, 'No eligible account for CT-16');

      let arrangementPk = '';
      let achPks: string[] = [];

      await test.step('Step 1 — Create ACH arrangement (NORMAL, 2 installments)', async () => {
        const result = await createArrangement(api, db, accountPkCt16, 2, 'NORMAL');
        arrangementPk = result.arrangementPk;
        achPks = result.achPks;
        console.log(`[CT-16] arrangementPk=${arrangementPk}, achPks=[${achPks.join(', ')}]`);
      });

      await test.step('Step 2 — UPDATE ACH[0]=SETTLED, ACH[1]=PENDING', async () => {
        await updateAchStatusByPk(db, achPks[0], 'SETTLED');
        // ACH[1] is already PENDING from creation — but set explicitly for clarity
        await updateAchStatusByPk(db, achPks[1], 'PENDING');
      });

      await test.step('Step 3 — Recalculate -> expect IN_PROGRESS (PENDING blocks SUCCESS)', async () => {
        const newStatus = await db.recalculateAchArrangementStatus(arrangementPk);
        expect(newStatus, 'Must be IN_PROGRESS when any ACH is still PENDING').toBe('IN_PROGRESS');

        const arrangement = await db.getPaymentArrangementByPk(arrangementPk);
        expect(arrangement!.status).toBe('IN_PROGRESS');
        expect(arrangement!.is_active).toBe(true);
        console.log(`[CT-16] SETTLED+PENDING -> IN_PROGRESS (not premature SUCCESS)`);
      });

      await test.step('Step 4 — Verify Rating Letter (user-facing) + activity log', async () => {
        await verifyRatingLetterDb(db, accountPkCt16, arrangementPk, 'CT-16');
      });
    });

    test('CT-17: SETTLED + RETURNED -> FAILED (failure dominates)', async ({ db, api }) => {
      test.setTimeout(120_000);
      test.skip(!accountPkCt17, 'No eligible account for CT-17');

      let arrangementPk = '';
      let achPks: string[] = [];

      await test.step('Step 1 — Create ACH arrangement (NORMAL, 2 installments)', async () => {
        const result = await createArrangement(api, db, accountPkCt17, 2, 'NORMAL');
        arrangementPk = result.arrangementPk;
        achPks = result.achPks;
        console.log(`[CT-17] arrangementPk=${arrangementPk}`);
      });

      await test.step('Step 2 — UPDATE ACH[0]=SETTLED, ACH[1]=RETURNED', async () => {
        await updateAchStatusByPk(db, achPks[0], 'SETTLED');
        await updateAchStatusByPk(db, achPks[1], 'RETURNED');
      });

      await test.step('Step 3 — Recalculate -> expect FAILED (failure > success)', async () => {
        const newStatus = await db.recalculateAchArrangementStatus(arrangementPk);
        expect(newStatus, 'FAILED dominates over SUCCESS').toBe('FAILED');

        const arrangement = await db.getPaymentArrangementByPk(arrangementPk);
        expect(arrangement!.status).toBe('FAILED');
        expect(arrangement!.is_active).toBe(false);
        console.log(`[CT-17] SETTLED+RETURNED -> FAILED`);
      });

      await test.step('Step 4 — Verify Rating Letter (user-facing) + activity log', async () => {
        await verifyRatingLetterDb(db, accountPkCt17, arrangementPk, 'CT-17');
      });
    });

    test('CT-18: PENDING + CANCELLED -> FAILED (failure dominates over pending)', async ({ db, api }) => {
      test.setTimeout(120_000);
      test.skip(!accountPkCt18, 'No eligible account for CT-18');

      let arrangementPk = '';
      let achPks: string[] = [];

      await test.step('Step 1 — Create ACH arrangement (NORMAL, 2 installments)', async () => {
        const result = await createArrangement(api, db, accountPkCt18, 2, 'NORMAL');
        arrangementPk = result.arrangementPk;
        achPks = result.achPks;
        console.log(`[CT-18] arrangementPk=${arrangementPk}`);
      });

      await test.step('Step 2 — UPDATE ACH[0]=PENDING, ACH[1]=CANCELLED', async () => {
        // ACH[0] is already PENDING — set explicitly for clarity
        await updateAchStatusByPk(db, achPks[0], 'PENDING');
        await updateAchStatusByPk(db, achPks[1], 'CANCELLED');
      });

      await test.step('Step 3 — Recalculate -> expect FAILED (failure > pending)', async () => {
        const newStatus = await db.recalculateAchArrangementStatus(arrangementPk);
        expect(newStatus, 'FAILED dominates over PENDING').toBe('FAILED');

        const arrangement = await db.getPaymentArrangementByPk(arrangementPk);
        expect(arrangement!.status).toBe('FAILED');
        expect(arrangement!.is_active).toBe(false);
        console.log(`[CT-18] PENDING+CANCELLED -> FAILED`);
      });

      await test.step('Step 4 — Verify Rating Letter (user-facing) + activity log', async () => {
        await verifyRatingLetterDb(db, accountPkCt18, arrangementPk, 'CT-18');
      });
    });

    // ══════════════════════════════════════════════════════════════════
    //  GROUP 5 — UI VERIFICATION (4 tests)
    //  Reuse accounts from: CT-01 (SUCCESS), CT-14 (FAILED),
    //  CT-08 (IN_PROGRESS), CT-05 (SETTLED_IN_FULL)
    // ══════════════════════════════════════════════════════════════════

    test('CT-UI-01: UI — Payment Arrangement page shows SUCCESS (from CT-01)', async ({ page, db, testEnv }) => {
      test.setTimeout(120_000);
      test.skip(!accountPkCt01 || !arrangementPkCt01, 'CT-01 account or arrangement not available');

      await test.step('Step 1 — Navigate to Payment Arrangement page', async () => {
        const paPage = new PaymentArrangementPage(page);
        await paPage.navigateDirectly(testEnv.servicingUrl, accountPkCt01);
        console.log(`[CT-UI-01] Navigated to PA page for accountPk=${accountPkCt01}`);
      });

      await test.step('Step 2 — Find arrangement row and verify status = SUCCESS', async () => {
        const paPage = new PaymentArrangementPage(page);
        const rowIndex = await paPage.findRowByPk(arrangementPkCt01);
        expect(rowIndex, `Arrangement pk=${arrangementPkCt01} not found in table`).toBeGreaterThanOrEqual(0);

        const rowData = await paPage.getRowData(rowIndex);
        console.log(`[CT-UI-01] Row data:`, JSON.stringify(rowData));
        expect(rowData['Status']).toBe('SUCCESS');
      });

      await test.step('Step 3 — Expand row and verify ACH sub-table', async () => {
        const paPage = new PaymentArrangementPage(page);
        const rowIndex = await paPage.findRowByPk(arrangementPkCt01);
        await paPage.expandRow(rowIndex);

        const achData = await paPage.getAchPaymentsData();
        console.log(`[CT-UI-01] ACH sub-table rows: ${achData.length}`);
        for (const row of achData) {
          console.log(`[CT-UI-01]   ACH: ${JSON.stringify(row)}`);
          expect(row['Status']).toBe('SETTLED');
        }

        await page.screenshot({
          path: `${SCREENSHOT_DIR}/ct-ui-01-success-arrangement.png`,
          fullPage: false,
        });
      });

      let ratingLogNote = '';

      await test.step('Step 4 — Verify Rating Letter on customer-information page + activity log', async () => {
        await page.goto(`${testEnv.servicingUrl}/customer-information/${accountPkCt01}`, {
          waitUntil: 'load',
          timeout: 60_000,
        });
        const svcPage = new ServicingCustomerPage(page);
        await svcPage.waitForSpinner();

        const uiRating = await svcPage.getRatingLetter();
        const result = await verifyRatingLetterDb(db, accountPkCt01, arrangementPkCt01, 'CT-UI-01');
        ratingLogNote = result.ratingLogNote;
        console.log(`[CT-UI-01] Rating Letter (UI): "${uiRating}" | (DB): ${result.dbRating ?? 'null'}`);

        const uiLetter = uiRating.split(/[\s-]+/).filter(Boolean)[0] ?? uiRating;
        const expectedLetter = result.dbRating ?? '-';
        expect(uiLetter, `UI Rating Letter (first token) should reflect DB value (UI="${uiRating}" DB="${result.dbRating ?? 'null'}")`).toBe(expectedLetter);

        await page.screenshot({
          path: `${SCREENSHOT_DIR}/ct-ui-01-rating-letter.png`,
          fullPage: false,
        });
      });

      await test.step('Step 5 — Verify activity log in History tab (UI x DB cross-reference)', async () => {
        const svcPage = new ServicingCustomerPage(page);

        // Open History dropdown and click first item to load activity log view
        await svcPage.historyDropdown.click();
        await page.waitForTimeout(500);
        // Close dropdown overlay if it opened — the history content loads underneath
        await page.keyboard.press('Escape');
        await svcPage.waitForSpinner();

        // Find the rating log entry specific to this arrangementPk
        const logRow = page.locator('div[role="row"]')
          .filter({ hasText: `arrangementPk=${arrangementPkCt01}` })
          .filter({ hasText: /rating/i });
        await expect(logRow.first(), `Activity log for arrangementPk=${arrangementPkCt01} must be visible in History`).toBeVisible({ timeout: 10_000 });

        // Cross-reference: UI log text must match DB log
        const uiLogText = await logRow.first().textContent() ?? '';
        console.log(`[CT-UI-01] Activity log (UI): "${uiLogText.substring(0, 200)}"`);
        console.log(`[CT-UI-01] Activity log (DB): "${ratingLogNote.substring(0, 200)}"`);
        expect(uiLogText, `UI activity log must contain arrangementPk=${arrangementPkCt01}`).toContain(`arrangementPk=${arrangementPkCt01}`);
        expect(uiLogText.toLowerCase(), `UI activity log must mention rating`).toContain('rating');

        await page.screenshot({
          path: `${SCREENSHOT_DIR}/ct-ui-01-activity-log.png`,
          fullPage: false,
        });
      });
    });

    test('CT-UI-02: UI — Payment Arrangement page shows FAILED (from CT-14)', async ({ page, db, testEnv }) => {
      test.setTimeout(120_000);
      test.skip(!accountPkCt14 || !arrangementPkCt14, 'CT-14 account or arrangement not available');

      await test.step('Step 1 — Navigate to Payment Arrangement page', async () => {
        const paPage = new PaymentArrangementPage(page);
        await paPage.navigateDirectly(testEnv.servicingUrl, accountPkCt14);
        console.log(`[CT-UI-02] Navigated to PA page for accountPk=${accountPkCt14}`);
      });

      await test.step('Step 2 — Find arrangement row and verify status = FAILED', async () => {
        const paPage = new PaymentArrangementPage(page);
        const rowIndex = await paPage.findRowByPk(arrangementPkCt14);
        expect(rowIndex, `Arrangement pk=${arrangementPkCt14} not found in table`).toBeGreaterThanOrEqual(0);

        const rowData = await paPage.getRowData(rowIndex);
        console.log(`[CT-UI-02] Row data:`, JSON.stringify(rowData));
        expect(rowData['Status']).toBe('FAILED');
      });

      await test.step('Step 3 — Expand row and verify ACH sub-table shows CANCELLED', async () => {
        const paPage = new PaymentArrangementPage(page);
        const rowIndex = await paPage.findRowByPk(arrangementPkCt14);
        await paPage.expandRow(rowIndex);

        const achData = await paPage.getAchPaymentsData();
        console.log(`[CT-UI-02] ACH sub-table rows: ${achData.length}`);
        for (const row of achData) {
          console.log(`[CT-UI-02]   ACH: ${JSON.stringify(row)}`);
          expect(row['Status']).toBe('CANCELLED');
        }

        await page.screenshot({
          path: `${SCREENSHOT_DIR}/ct-ui-02-failed-arrangement.png`,
          fullPage: false,
        });
      });

      let ratingLogNote = '';

      await test.step('Step 4 — Verify Rating Letter on customer-information page + activity log', async () => {
        await page.goto(`${testEnv.servicingUrl}/customer-information/${accountPkCt14}`, {
          waitUntil: 'load',
          timeout: 60_000,
        });
        const svcPage = new ServicingCustomerPage(page);
        await svcPage.waitForSpinner();

        const uiRating = await svcPage.getRatingLetter();
        const result = await verifyRatingLetterDb(db, accountPkCt14, arrangementPkCt14, 'CT-UI-02');
        ratingLogNote = result.ratingLogNote;
        console.log(`[CT-UI-02] Rating Letter (UI): "${uiRating}" | (DB): ${result.dbRating ?? 'null'}`);

        const uiLetter = uiRating.split(/[\s-]+/).filter(Boolean)[0] ?? uiRating;
        const expectedLetter = result.dbRating ?? '-';
        expect(uiLetter, `UI Rating Letter (first token) should reflect DB value (UI="${uiRating}" DB="${result.dbRating ?? 'null'}")`).toBe(expectedLetter);

        await page.screenshot({
          path: `${SCREENSHOT_DIR}/ct-ui-02-rating-letter.png`,
          fullPage: false,
        });
      });

      await test.step('Step 5 — Verify activity log in History tab (UI x DB cross-reference)', async () => {
        const svcPage = new ServicingCustomerPage(page);

        await svcPage.historyDropdown.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
        await svcPage.waitForSpinner();

        const logRow = page.locator('div[role="row"]')
          .filter({ hasText: `arrangementPk=${arrangementPkCt14}` })
          .filter({ hasText: /rating/i });
        await expect(logRow.first(), `Activity log for arrangementPk=${arrangementPkCt14} must be visible in History`).toBeVisible({ timeout: 10_000 });

        const uiLogText = await logRow.first().textContent() ?? '';
        console.log(`[CT-UI-02] Activity log (UI): "${uiLogText.substring(0, 200)}"`);
        console.log(`[CT-UI-02] Activity log (DB): "${ratingLogNote.substring(0, 200)}"`);
        expect(uiLogText, `UI activity log must contain arrangementPk=${arrangementPkCt14}`).toContain(`arrangementPk=${arrangementPkCt14}`);
        expect(uiLogText.toLowerCase(), `UI activity log must mention rating`).toContain('rating');

        await page.screenshot({
          path: `${SCREENSHOT_DIR}/ct-ui-02-activity-log.png`,
          fullPage: false,
        });
      });
    });

    test('CT-UI-03: UI — Payment Arrangement page shows IN_PROGRESS (from CT-08)', async ({ page, db, testEnv }) => {
      test.setTimeout(120_000);
      test.skip(!accountPkCt08 || !arrangementPkCt08, 'CT-08 account or arrangement not available');

      await test.step('Step 1 — Navigate to Payment Arrangement page', async () => {
        const paPage = new PaymentArrangementPage(page);
        await paPage.navigateDirectly(testEnv.servicingUrl, accountPkCt08);
        console.log(`[CT-UI-03] Navigated to PA page for accountPk=${accountPkCt08}`);
      });

      await test.step('Step 2 — Find arrangement row and verify status = IN_PROGRESS', async () => {
        const paPage = new PaymentArrangementPage(page);
        const rowIndex = await paPage.findRowByPk(arrangementPkCt08);
        expect(rowIndex, `Arrangement pk=${arrangementPkCt08} not found in table`).toBeGreaterThanOrEqual(0);

        const rowData = await paPage.getRowData(rowIndex);
        console.log(`[CT-UI-03] Row data:`, JSON.stringify(rowData));
        expect(rowData['Status']).toBe('IN_PROGRESS');
      });

      await test.step('Step 3 — Screenshot', async () => {
        await page.screenshot({
          path: `${SCREENSHOT_DIR}/ct-ui-03-in-progress-arrangement.png`,
          fullPage: false,
        });
      });

      let ratingLogNote = '';

      await test.step('Step 4 — Verify Rating Letter on customer-information page + activity log', async () => {
        await page.goto(`${testEnv.servicingUrl}/customer-information/${accountPkCt08}`, {
          waitUntil: 'load',
          timeout: 60_000,
        });
        const svcPage = new ServicingCustomerPage(page);
        await svcPage.waitForSpinner();

        const uiRating = await svcPage.getRatingLetter();
        const result = await verifyRatingLetterDb(db, accountPkCt08, arrangementPkCt08, 'CT-UI-03');
        ratingLogNote = result.ratingLogNote;
        console.log(`[CT-UI-03] Rating Letter (UI): "${uiRating}" | (DB): ${result.dbRating ?? 'null'}`);

        const uiLetter = uiRating.split(/[\s-]+/).filter(Boolean)[0] ?? uiRating;
        const expectedLetter = result.dbRating ?? '-';
        expect(uiLetter, `UI Rating Letter (first token) should reflect DB value (UI="${uiRating}" DB="${result.dbRating ?? 'null'}")`).toBe(expectedLetter);

        await page.screenshot({
          path: `${SCREENSHOT_DIR}/ct-ui-03-rating-letter.png`,
          fullPage: false,
        });
      });

      await test.step('Step 5 — Verify activity log in History tab (UI x DB cross-reference)', async () => {
        const svcPage = new ServicingCustomerPage(page);

        await svcPage.historyDropdown.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
        await svcPage.waitForSpinner();

        const logRow = page.locator('div[role="row"]')
          .filter({ hasText: `arrangementPk=${arrangementPkCt08}` })
          .filter({ hasText: /rating/i });
        await expect(logRow.first(), `Activity log for arrangementPk=${arrangementPkCt08} must be visible in History`).toBeVisible({ timeout: 10_000 });

        const uiLogText = await logRow.first().textContent() ?? '';
        console.log(`[CT-UI-03] Activity log (UI): "${uiLogText.substring(0, 200)}"`);
        console.log(`[CT-UI-03] Activity log (DB): "${ratingLogNote.substring(0, 200)}"`);
        expect(uiLogText, `UI activity log must contain arrangementPk=${arrangementPkCt08}`).toContain(`arrangementPk=${arrangementPkCt08}`);
        expect(uiLogText.toLowerCase(), `UI activity log must mention rating`).toContain('rating');

        await page.screenshot({
          path: `${SCREENSHOT_DIR}/ct-ui-03-activity-log.png`,
          fullPage: false,
        });
      });
    });

    test('CT-UI-04: UI — Customer Information shows SETTLED_IN_FULL (from CT-05)', async ({ page, db, testEnv }) => {
      test.setTimeout(120_000);
      test.skip(!accountPkCt05, 'CT-05 account not available');

      await test.step('Step 1 — Navigate to Customer Information page', async () => {
        // Use same navigateDirectly pattern that works in CT-UI-01/02/03
        const paPage = new PaymentArrangementPage(page);
        await paPage.navigateDirectly(testEnv.servicingUrl, accountPkCt05);

        // Now navigate to customer-information from authenticated session
        await page.goto(`${testEnv.servicingUrl}/customer-information/${accountPkCt05}`, {
          waitUntil: 'load',
          timeout: 60_000,
        });

        const svcPage = new ServicingCustomerPage(page);
        await svcPage.waitForSpinner();
        console.log(`[CT-UI-04] Navigated to customer-information for accountPk=${accountPkCt05}`);
      });

      await test.step('Step 2 — Verify account status badge = SETTLED_IN_FULL', async () => {
        const svcPage = new ServicingCustomerPage(page);
        const uiStatus = await svcPage.getAccountStatus();
        console.log(`[CT-UI-04] UI account status: ${uiStatus}`);
        expect(uiStatus).toBe('SETTLED_IN_FULL');

        await page.screenshot({
          path: `${SCREENSHOT_DIR}/ct-ui-04-settled-in-full.png`,
          fullPage: false,
        });
      });

      let ratingLogNote = '';

      await test.step('Step 3 — Verify Rating Letter on customer-information page + activity log', async () => {
        const svcPage = new ServicingCustomerPage(page);

        const uiRating = await svcPage.getRatingLetter();
        const result = await verifyRatingLetterDb(db, accountPkCt05, arrangementPkCt05, 'CT-UI-04');
        ratingLogNote = result.ratingLogNote;
        console.log(`[CT-UI-04] Rating Letter (UI): "${uiRating}" | (DB): ${result.dbRating ?? 'null'}`);

        const uiLetter = uiRating.split(/[\s-]+/).filter(Boolean)[0] ?? uiRating;
        const expectedLetter = result.dbRating ?? '-';
        expect(uiLetter, `UI Rating Letter (first token) should reflect DB value (UI="${uiRating}" DB="${result.dbRating ?? 'null'}")`).toBe(expectedLetter);

        await page.screenshot({
          path: `${SCREENSHOT_DIR}/ct-ui-04-rating-letter.png`,
          fullPage: false,
        });
      });

      await test.step('Step 4 — Verify activity log in History tab (UI x DB cross-reference)', async () => {
        const svcPage = new ServicingCustomerPage(page);

        await svcPage.historyDropdown.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
        await svcPage.waitForSpinner();

        const logRow = page.locator('div[role="row"]')
          .filter({ hasText: `arrangementPk=${arrangementPkCt05}` })
          .filter({ hasText: /rating/i });
        await expect(logRow.first(), `Activity log for arrangementPk=${arrangementPkCt05} must be visible in History`).toBeVisible({ timeout: 10_000 });

        const uiLogText = await logRow.first().textContent() ?? '';
        console.log(`[CT-UI-04] Activity log (UI): "${uiLogText.substring(0, 200)}"`);
        console.log(`[CT-UI-04] Activity log (DB): "${ratingLogNote.substring(0, 200)}"`);
        expect(uiLogText, `UI activity log must contain arrangementPk=${arrangementPkCt05}`).toContain(`arrangementPk=${arrangementPkCt05}`);
        expect(uiLogText.toLowerCase(), `UI activity log must mention rating`).toContain('rating');

        await page.screenshot({
          path: `${SCREENSHOT_DIR}/ct-ui-04-activity-log.png`,
          fullPage: false,
        });
      });
    });
  });
}

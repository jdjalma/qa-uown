/**
 * Sticky Recover Transactions — svc#485 (RU05.26.1.52.0) — UI + API contract (CT-11).
 *
 * SPEC: docs/taskTestingUown/RU05.26.1.52.0_stickyRecoverTransactions_485/
 *       RU05.26.1.52.0_stickyRecoverTransactions_485-spec.md §CT-11
 *
 * Goal (R11):
 *  - Validate that the Servicing CC Transactions grid exposes 4 dedicated
 *    Sticky columns (`Sticky Recovery Status`, `Sticky Txn ID`, `Sticky Attempts`,
 *    `Last Sticky Retry`) and renders meaningful values for cct submitted to
 *    Sticky.
 *  - Capture the contract of `GET /uown/svc/accounts/{accountPk}/sticky-recoveries`
 *    on first run (Q3 of the spec).
 *  - Regression for the UI-03 scenario: rows without a sticky session render
 *    a graceful "—" rather than empty cells / JS error.
 *
 * UI-first (regra inviolável #14): rendering bugs (empty placeholder, JS error,
 * 500) are only detectable via browser; API-only would mask UI breakage.
 *
 * DOM-first (regra inviolável #16): if column headers don't match the
 * SELECTORS.sticky*ColumnName constants, run the DOM-first protocol via MCP
 * Playwright BEFORE bumping timeouts or adding `force: true`.
 *
 * Environment: SANDBOX ONLY. Setup contract is the same as the API spec —
 * reuses accounts created by `tests/api/sticky-recover-rating-setup.spec.ts`.
 * Project (Playwright): `cross-portal` (testDir = ./tests/e2e root).
 */
import { test, expect } from '@support/base-test.js';
import { loginToPortalWithOptions } from '@helpers/auth.helpers.js';
import { CreditCardHistoryPage } from '@pages/servicing/credit-card-history.page.js';
import { SELECTORS } from '@selectors/common.selectors.js';
import { findEligibleStickyCct, waitForStickyTransactionId } from '@helpers/sticky.helpers.js';
import { unwrapStickyRecoveries } from '@api/clients/sticky-recover.client.js';
import { TestTag, buildTags, splitTags } from '../../src/types/enums.js';

const TAG = `${buildTags(TestTag.REGRESSION, TestTag.SANDBOX)} @sticky-recover @svc-485 @sticky-recover-smoke @e2e`;

test.describe(
  'svc#485 — Sticky Recover UI + API contract (CT-11)',
  { tag: splitTags(TAG) },
  () => {
    test('CT-11 — Servicing CC Transactions grid renders Sticky columns + API contract snapshot', async ({
      page,
      api,
      db,
      testEnv,
    }) => {
      test.setTimeout(180_000);

      let cctPk = 0;
      let accountPk = 0;
      let stickyTxnId = '';

      await test.step('discover a cct that already has a Sticky session', async () => {
        // CT-01..CT-07 of the API spec will have produced one for rating='M'.
        // If running this spec in isolation, the setup spec + a manual sweep
        // trigger are required (the test fails fast with that instruction).
        const candidate = await findEligibleStickyCct(db, 'M');
        // `findEligibleStickyCct` returns null when a row in `uown_sticky`
        // ALREADY exists for the cct — perfect for CT-11 in isolation
        // (after sweep ran). So if `null`, query directly the cct that DOES
        // have a sticky session.
        if (candidate === null) {
          const row = await db.queryOne<{ cct_pk: string; account_pk: string; sticky_transaction_id: string }>(
            `SELECT cct.pk AS cct_pk, cct.account_pk, st.sticky_transaction_id
               FROM uown_sv_credit_card_transaction cct
               JOIN uown_sticky st ON st.cc_transaction_pk = cct.pk
               JOIN uown_sv_account a ON a.pk = cct.account_pk
              WHERE a.rating = 'M'
                AND st.sticky_transaction_id IS NOT NULL
              ORDER BY cct.pk DESC LIMIT 1`,
          );
          expect(
            row,
            'No cct with Sticky session found. Run setup spec + API spec CT-01..CT-03 first.',
          ).toBeTruthy();
          cctPk = Number(row!.cct_pk);
          accountPk = Number(row!.account_pk);
          stickyTxnId = String(row!.sticky_transaction_id);
        } else {
          // Found an eligible candidate (no session yet) — wait for it to
          // gain a sticky_transaction_id (allows CT-11 to run after the sweep
          // even if CT-01..CT-03 didn't pre-populate).
          cctPk = candidate.cctPk;
          accountPk = candidate.accountPk;
          const session = await waitForStickyTransactionId(db, cctPk, 30_000).catch(() => null);
          if (session === null) {
            test.skip(
              true,
              'No Sticky session for any candidate cct — run API spec CT-01 first to trigger StickyRecoverSweep.',
            );
            return;
          }
          stickyTxnId = session.sticky_transaction_id as string;
        }
        console.log(`[CT-11] cctPk=${cctPk} accountPk=${accountPk} stickyTxnId=${stickyTxnId.slice(0, 16)}…`);
      });

      // ── UI path ──
      await test.step('login to Servicing portal', async () => {
        await loginToPortalWithOptions(page, testEnv.servicingUrl, testEnv);
      });

      const ccHistory = new CreditCardHistoryPage(page);

      // Capture network for sticky-recoveries / getCCTransactions to debug FE rendering
      page.on('response', async (resp) => {
        const url = resp.url();
        if (/sticky-recoveries|getCCTransactions/.test(url)) {
          const status = resp.status();
          let bodyPreview = '';
          try {
            const text = await resp.text();
            bodyPreview = text.slice(0, 350).replace(/\s+/g, ' ');
          } catch {
            bodyPreview = '<no body>';
          }
          console.log(`[CT-11][network] ${status} ${url}\n  body: ${bodyPreview}`);
        }
      });

      await test.step('navigate to CC Transactions (via customer-information for proper MobX hydration)', async () => {
        // Page object navigates via customer-information → CC Transactions tab,
        // mimicking the real agent flow. Direct URL navigation produces a MobX
        // hydration race where cells stay "—" even after the sticky data arrives.
        await ccHistory.navigateToCcHistoryByUrl(testEnv.servicingUrl, accountPk);
        // Ensure the sticky-recoveries response arrives before assertions.
        await ccHistory.waitForStickyRecoveriesResponse(30_000);
      });

      await test.step('grid renders the 4 Sticky columns', async () => {
        const present = await ccHistory.hasStickyColumns();
        expect(
          present,
          'Sticky columns not found in CC Transactions grid. Run DOM-first protocol (CLAUDE.md #16) before tweaking selectors.',
        ).toBeTruthy();
      });

      await test.step('cct row shows non-empty Sticky values', async () => {
        // The /sticky-recoveries call resolves AFTER /getCCTransactions; MobX re-renders
        // the row cells when the store updates. Wait for the populated state before asserting.
        await ccHistory.waitForStickyCellPopulated(cctPk, 15_000);

        const status = await ccHistory.getStickyRecoveryStatus(cctPk);
        const txnIdCell = await ccHistory.getStickyTransactionId(cctPk);
        const attempts = await ccHistory.getStickyAttempts(cctPk);
        const lastRetry = await ccHistory.getLastStickyRetry(cctPk);

        console.log(`[CT-11] UI cells: status="${status}" txnId="${txnIdCell}" attempts="${attempts}" lastRetry="${lastRetry}"`);

        expect(status.length, 'Sticky Recovery Status non-empty').toBeGreaterThan(0);
        expect(status.toUpperCase()).toContain('RECOVERY');
        expect(txnIdCell.length, 'Sticky Txn ID non-empty (may be truncated)').toBeGreaterThan(0);
        // Sticky Attempts can legitimately render as empty when numberOfAttempts=0 (RECOVERY_STARTED
        // before first retry fires) — react-data-table-component renders falsy values as empty
        // string. Assert it's either empty OR a valid number string.
        if (attempts.length > 0) {
          expect(attempts).toMatch(/^\d+$/);
        }
        // lastRetry can legitimately be empty if no retry has fired yet — log only.
      });

      await test.step('no JS error / 500 toast visible', async () => {
        const errorToast = page.locator(SELECTORS.toastError).first();
        expect(
          await errorToast.isVisible({ timeout: 1_000 }).catch(() => false),
          'error toast visible on CC History page',
        ).toBeFalsy();
      });

      // ── API contract snapshot (Q3) ──
      await test.step('GET /sticky-recoveries returns 200 with at least one session', async () => {
        const resp = await api.stickyRecover.getStickyRecoveries(accountPk);
        expect(resp.ok, `GET sticky-recoveries ${resp.status}`).toBeTruthy();

        const sessions = unwrapStickyRecoveries(resp.body);
        expect(sessions.length, 'expected at least one session for the account').toBeGreaterThan(0);

        // Find the session matching our stickyTxnId for cross-check.
        const ours = sessions.find(
          (s) =>
            String(s.stickyTransactionId ?? '') === stickyTxnId ||
            String((s as Record<string, unknown>).sticky_transaction_id ?? '') === stickyTxnId,
        );
        if (!ours) {
          // Endpoint may not echo the txnId at top level — log payload shape
          // so qa-validator + qa-doc-keeper can capture the contract.
          console.log(
            `[CT-11] sticky_transaction_id not found at top-level of any session — ` +
            `payload sample keys: ${Object.keys(sessions[0]).join(', ')}`,
          );
        } else {
          // Cross-check field-by-field against uown_sticky row.
          const dbRow = await db.queryOne<{
            recovery_status: string | null;
            account_pk: string;
            dunning_profile_id: string | null;
          }>(
            `SELECT recovery_status, account_pk, dunning_profile_id
               FROM uown_sticky WHERE sticky_transaction_id = $1`,
            [stickyTxnId],
          );
          expect(dbRow, 'uown_sticky row for txnId').toBeTruthy();
          if (ours.recoveryStatus && dbRow?.recovery_status) {
            expect(String(ours.recoveryStatus)).toBe(dbRow.recovery_status);
          }
          if (ours.accountPk && dbRow?.account_pk) {
            expect(String(ours.accountPk)).toBe(String(dbRow.account_pk));
          }
        }
      });

      // Activity log: N/A for CT-11 (read-only — no mutation).
    });
  },
);

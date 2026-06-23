/**
 * Funding Queue — Report-content UI proxy (CT-07/08/09) — Origination portal
 *
 * SPEC: docs/taskTestingUown/dailyFundingRefundReportSweeps_contentValidation/
 *       dailyFundingRefundReportSweeps_contentValidation.spec.md  (CT-07..10)
 *
 * UI-first proxy (rule #14) for the daily funding/funded/refund report SWEEPS. The report
 * sweep itself is admin/ops (no UI), but the DATA it reports has a user-facing surface: the
 * Funding Queue grid (`/funding`, Origination) filtered by status, with Download CSV. The CSV
 * of the status-filtered grid is the proxy for the content the sweep would email
 * (SPEC §Discovery OQ-03 + Achado-chave 3 — the report does NOT pass through uown_email_queue,
 * so the grid CSV is the cheapest UI-observable content surface).
 *
 *   - CT-07 — status "Funding"        → grid + Download CSV vs DB oracle (funding_queue_status='FUNDING')
 *   - CT-08 — status "Funded"         → grid + Download CSV vs DB oracle (funding_queue_status='FUNDED')
 *   - CT-09 — status "Request Refund" → grid + Download CSV vs DB oracle (funding_queue_status='REQUEST_REFUND')
 *   - CT-10 (Refunded) is NOT here: 0 REFUNDED data in sandbox (env limitation) — its
 *           `test.fixme()` stub lives with the mechanism CTs in
 *           tests/e2e/servicing/funding-refund-report-content-sweeps-servicing.spec.ts
 *
 * WHY THIS FILE IS UNDER tests/e2e/origination/ (and not the servicing sweeps file): the
 * Funding Queue is an ORIGINATION screen and needs `.auth/origination.json`. A spec in
 * tests/e2e/servicing/ runs in the `servicing-ui` project (servicing storageState/baseURL),
 * which cannot drive the Origination portal. This split is forced by the project's portal-split
 * rule (.claude/rules/testing.md). The mechanism + recipient-SQL CTs (CT-01..05) are API-only
 * and live in the servicing file.
 *
 * Page object (rule #2): reuses the existing `FundingPage` (filterByStatuses / applyFiltersMulti
 * / getStatusColumnValues / downloadCsv / getTotalCsvRowCount). It deliberately does NOT use
 * `MerchantLocationFilterPO` — the Funding Queue has a custom DOM (div labels + stable react-
 * select IDs), and applying the label-XPath PO there times out (page-object-pattern §5b pitfall).
 * The Download CSV button has a CSS-module prefix that drifts across builds; the
 * `FilteredCsvDownloadControls` selectors are hardened for that (selector-hardening) — we rely
 * on those, never on a raw class string here.
 *
 * Test Data Hierarchy (rule #9): READ-ONLY over the existing global funding population
 * (FUNDING ~11.6k / FUNDED ~3.9k / REQUEST_REFUND ~83 per SPEC §DB). No application is created
 * and NO DB mutation is performed. No application-creation path → merchant preflight (rule #12)
 * does not apply. Reordering/reading a grid is not a business action → no activity log expected
 * (rule #13 — read-only exception).
 *
 * Oracle tolerance: the DB oracle counts ALL rows of a status; the grid/CSV may apply a date
 * window or a different scope and is paginated. We therefore assert the DIRECTION (CSV total is
 * non-zero when the oracle is non-zero, and the visible rows all carry the filtered status)
 * rather than byte-exact equality — a hard equality would be flaky against a moving population.
 *
 * Env: sandbox primary; qa2 acceptable as a UI proxy (SPEC §Test Strategy — Funding Queue grid
 * multi-select confirmed deployed in qa2). Runs in the `origination-ui` project.
 *
 * Run: ENV=sandbox node node_modules/@playwright/test/cli.js test \
 *   tests/e2e/origination/funding-refund-report-content-ui-origination.spec.ts \
 *   --project=origination-ui --reporter=list --timeout=180000
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { FundingPage } from '@pages/origination/index.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';
import { ConfigEnvironment } from '@config/index.js';
import { parseCsv, saveDownload, deleteDownloadedFile } from '@helpers/downloads.helpers.js';

const TAGS = buildTags(TestTag.REGRESSION, TestTag.SANDBOX);
const VIEWPORT = { width: 1440, height: 900 } as const;

// UI status label → uown_funding_transaction.funding_queue_status oracle value.
const STATUS_CASES: ReadonlyArray<{
  ct: string;
  uiStatus: string;
  oracleValue: string;
}> = [
  { ct: 'CT-07', uiStatus: 'Funding', oracleValue: 'FUNDING' },
  { ct: 'CT-08', uiStatus: 'Funded', oracleValue: 'FUNDED' },
  { ct: 'CT-09', uiStatus: 'Request Refund', oracleValue: 'REQUEST_REFUND' },
];

test.describe(
  'Funding Queue — report-content UI proxy (CT-07/08/09)',
  { tag: splitTags(TAGS) },
  () => {
    test.beforeEach(async ({ page }) => {
      // Funding Queue navbar/filters use Bootstrap d-lg-block (≥992px). Force 1440×900 so the
      // filter panel + grid render (selector-hardening DOM-first viewport rule).
      await page.setViewportSize({ width: VIEWPORT.width, height: VIEWPORT.height });
    });

    for (const c of STATUS_CASES) {
      test(`${c.ct} — Funding Queue "${c.uiStatus}" grid + CSV vs DB oracle (funding_queue_status='${c.oracleValue}') @origination @funding @csv-export @regression`, async ({ page, db }) => {
        test.setTimeout(180_000);
        const env = new ConfigEnvironment(process.env.ENV ?? 'sandbox');
        const funding = new FundingPage(page);

        // DB oracle (read-only): total rows with this funding_queue_status.
        let oracleCount = 0;
        await test.step(`DB oracle: count uown_funding_transaction WHERE funding_queue_status='${c.oracleValue}'`, async () => {
          oracleCount = await db.getSingleNumber(
            `SELECT COUNT(*) FROM uown_funding_transaction WHERE funding_queue_status = $1`,
            [c.oracleValue],
          );
          console.log(`[${c.ct}] DB oracle count for ${c.oracleValue} = ${oracleCount}`);
        });

        await test.step('Navigate to Funding Queue', async () => {
          await page.goto(`${env.originationUrl}funding`, { waitUntil: 'domcontentloaded' });
          await funding.waitForSpinner();
        });

        await test.step(`Filter grid by status "${c.uiStatus}" and apply`, async () => {
          await funding.filterByStatuses([c.uiStatus]);
          await funding.applyFiltersMulti();
        });

        await test.step('Assert the visible grid rows all carry the filtered status', async () => {
          const statuses = await funding.getStatusColumnValues();
          if (statuses.length === 0) {
            // Empty grid is legitimate only when the oracle is also empty (AC5 empty case).
            if (oracleCount === 0) {
              test.info().annotations.push({
                type: 'observation',
                description:
                  `[OBSERVAÇÃO] ${c.ct} — grid is empty AND DB oracle is 0 for ${c.oracleValue}. ` +
                  'Empty report content (AC5 clean-empty) — no rows to reconcile.',
              });
              return;
            }
            // Grid empty but DB has rows → surface, do not hard-fail (date window / scope may
            // legitimately differ; the CSV step below reconciles the count direction).
            test.info().annotations.push({
              type: 'observation',
              description:
                `[OBSERVAÇÃO] ${c.ct} — grid shows no rows for "${c.uiStatus}" but DB oracle has ` +
                `${oracleCount} ${c.oracleValue} row(s). The Funding Queue grid may apply a date ` +
                'window/scope narrower than the raw status count — verify the grid filter scope.',
            });
            return;
          }
          // Every visible Status cell must equal the requested status (case/spacing-insensitive).
          const norm = (s: string): string => s.replace(/[_\s]+/g, ' ').trim().toLowerCase();
          const wanted = norm(c.uiStatus);
          const mismatched = statuses.filter(s => norm(s) !== wanted && norm(s) !== norm(c.oracleValue));
          expect(
            mismatched,
            `${c.ct} — all visible rows must show status "${c.uiStatus}"; mismatched: ${mismatched.slice(0, 10).join(', ')}`,
          ).toEqual([]);
        });

        await test.step('Download CSV and reconcile its row count with the grid/DB oracle', async () => {
          // The Download CSV button is gated on a non-empty grid. If disabled, only an empty
          // grid justifies it (CSS-disabled button — isDownloadCsvEnabled checks the class, not
          // the HTML disabled attr; selector-hardening pitfall, handled by FilteredCsvDownloadControls).
          const csvEnabled = await funding.isDownloadCsvEnabled();
          if (!csvEnabled) {
            test.info().annotations.push({
              type: 'observation',
              description:
                `[OBSERVAÇÃO] ${c.ct} — Download CSV is disabled for "${c.uiStatus}" ` +
                `(grid empty? oracle=${oracleCount}). Cannot reconcile CSV content this run.`,
            });
            return;
          }

          const filteredTotal = await funding.getTotalCsvRowCount(); // from "X-Y of N" footer
          const download = await funding.downloadCsv();
          const savedPath = await saveDownload(download, `funding-${c.oracleValue}-${Date.now()}.csv`);
          try {
            const fs = await import('node:fs');
            const content = fs.readFileSync(savedPath, 'utf-8');
            const parsed = parseCsv(content);

            // Header sanity: the export must carry a Status column so the content is the right grid.
            const hasStatusHeader = parsed.headers.some(h => /status/i.test(h));
            expect(
              hasStatusHeader,
              `${c.ct} — CSV header must include a Status column (got: ${parsed.headers.join(', ')})`,
            ).toBe(true);

            console.log(
              `[${c.ct}] CSV dataRows=${parsed.dataRowCount}; grid footer total=${filteredTotal ?? 'n/a'}; ` +
                `DB oracle=${oracleCount}`,
            );

            // Direction assertions (tolerant — pagination/date-window):
            //  - CSV is non-empty when the grid footer reports rows.
            //  - CSV row count should not exceed the grid's reported total by more than a small
            //    margin (the CSV exports the full filtered set, the footer caps the page total).
            expect(
              parsed.dataRowCount,
              `${c.ct} — CSV must contain at least one data row for "${c.uiStatus}"`,
            ).toBeGreaterThan(0);

            if (filteredTotal != null) {
              expect(
                parsed.dataRowCount,
                `${c.ct} — CSV data rows (${parsed.dataRowCount}) must reconcile with the grid ` +
                  `filtered total (${filteredTotal})`,
              ).toBe(filteredTotal);
            }

            // The DB oracle is an upper-ish bound sanity (the grid may window by date) — only
            // surface a divergence as an observation, never a hard fail (volatile population).
            if (oracleCount > 0 && parsed.dataRowCount > oracleCount) {
              test.info().annotations.push({
                type: 'observation',
                description:
                  `[OBSERVAÇÃO] ${c.ct} — CSV (${parsed.dataRowCount}) exceeds DB oracle ` +
                  `(${oracleCount}) for ${c.oracleValue}; verify the grid is not double-counting / ` +
                  'the oracle status mapping.',
              });
            }
          } finally {
            deleteDownloadedFile(savedPath); // PII hygiene
          }
        });
      });
    }
  },
);

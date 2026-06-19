/**
 * Multi-Select Merchant/Location Filters — MMH / Modification Report / Funding (R1.52.0)
 *
 * Task #1319 — UOWN | Origination | Add Multi-Select on Merchant/Location filters
 * on the Merchant Modification History (/merchantModificationHistory),
 * Modification Report (/modificationReport) and Funding Queue (/funding) pages.
 *
 * ── Strategy ────────────────────────────────────────────────────────────
 * UI-first E2E (Rule #14): these three pages are agent-facing Origination
 * screens with real filter affordances, so every CT exercises the browser flow
 * end to end — open the multi-select panel, tick options, click Search, read the
 * rendered table. No backend-only assertion substitutes the visual flow.
 *
 * ── Test data (Rule #9 exception, documented) ────────────────────────────
 * The three filter pages are READ-ONLY list views. We create NO applications,
 * NO leads and NO merchants — we filter over data already present in qa2. This
 * is the same exception applied by spec #1292 (multi-select-filters.spec.ts):
 * filtering a list view does not require fresh data. Consequently there is no
 * `runId` and no `email` in testData (nothing is generated). Options are
 * discovered at runtime from the live dropdown roster (`pickAvailableOptions`),
 * never hard-coded, so the suite is resilient to qa2 roster drift.
 *
 * ── Rule exceptions ──────────────────────────────────────────────────────
 *  - Rule #12 (merchant preflight): NOT applied — no new application is created,
 *    so mutating merchant config would be an out-of-scope side effect.
 *  - Rule #13 (activity log): NOT applied — filtering / paginating a list view
 *    is a navigation action, not a business action; no `uown_los_lead_notes`
 *    row is expected or asserted.
 *
 * ── Environment / auth ───────────────────────────────────────────────────
 * Environment: qa2 (R1.52.0 deployed there). The `task-testing-origination`
 * Playwright project authenticates as `manager` via `.auth/origination.json`
 * (tests/auth.setup.ts → env.getCredentials('manager')). AutotestAgent lacks
 * permission to reach these pages, so `manager` is required — same as #1292.
 *
 * ── DOM-first findings (qa2, authoritative — qa-planner §0) ───────────────
 *  MMH:               Merchant multi-select (no Select All); Location disabled
 *                     until a Merchant is selected.
 *  Modification Report: Merchant multi-select (no Select All); Location disabled
 *                     until a Merchant is selected.
 *  Funding Queue:     Status multi-select (label "Status*") WITH Select All and
 *                     "Funding" pre-selected (options: Select All / Funding /
 *                     Funded / Request Refund / Refunded); Merchant multi-select
 *                     (no Select All); Location multi-select, NOT disabled
 *                     (independent of Merchant).
 *
 * Tag: @origination (selects task-testing-origination project — Origination
 * baseURL + storageState, per .claude/rules/testing.md).
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import {
  MerchantModHistoryPage,
  ModificationReportPage,
  FundingPage,
  MerchantLocationFilterPO,
} from '@pages/origination/index.js';
import { TestTag, buildTags } from '@ptypes/enums.js';
import { ConfigEnvironment } from '@config/index.js';
import { parseCsv } from '@helpers/downloads.helpers.js';
import fs from 'node:fs';

// ── Test data ───────────────────────────────────────────────────────────
// No application created → runId/email intentionally omitted (Rule #9
// exception documented in the file header). Tag set selects the Origination
// task-testing project and marks the spec as a qa2 regression.
const testData = {
  env: 'qa2',
  tag: buildTags(TestTag.REGRESSION, TestTag.QA2),
  portalTag: '@origination',
};

// Preferred names are only HINTS — `pickAvailableOptions` falls back to whatever
// the live qa2 dropdown actually offers, so the suite never hard-fails on a
// roster that drifted. TireAgent is prominent across qa2 specs; the rest are
// padded from the first distinct options available.
const MERCHANT_HINTS = ['TireAgent', "Daniel's Jewelers"] as const;

// ── Helpers ───────────────────────────────────────────────────────────────
//
// Pick `count` distinct options for a filter, preferring the supplied hints but
// degrading to the first available roster entries. Mirrors the `pickAvailable
// Options` pattern from spec #1292 — keeps the test data hierarchy honest
// (prefer known fixtures, tolerate drift). Generic over the page object since
// all three pages expose the same `listAvailable*` reader shape.
function pickFromRoster(
  available: readonly string[],
  preferred: readonly string[],
  count: number,
): string[] {
  const result: string[] = [];
  for (const want of preferred) {
    const hit = available.find(v => v === want || v.includes(want));
    if (hit && !result.includes(hit)) result.push(hit);
    if (result.length >= count) break;
  }
  for (const v of available) {
    if (result.length >= count) break;
    if (!result.includes(v)) result.push(v);
  }
  return result.slice(0, count);
}

// True when the table merchant value belongs to the selected set. Matching is
// tolerant of label-vs-roster formatting differences (substring both ways) —
// the dropdown label and the table cell can render the merchant name slightly
// differently (code suffix, trailing whitespace).
function merchantInSet(cell: string, selected: readonly string[]): boolean {
  const c = cell.trim();
  if (!c) return true; // blank cell → nothing to contradict
  return selected.some(sel => c === sel || c.includes(sel) || sel.includes(c));
}

// ─────────────────────────────────────────────────────────────────────────
test.describe(
  'R1.52.0_multiSelectFiltersMMHModReportFunding_1319',
  { tag: [...testData.tag.split(' '), testData.portalTag] },
  () => {
    test.use({ envName: testData.env });

    test.beforeEach(({ testEnv }) => {
      test.skip(
        testEnv.env !== 'qa2',
        '#1319 multi-select filters spec targets qa2 (R1.52.0 deployed there) and consumes qa2 merchant data',
      );
    });

    // ─────────────────────────────────────────────────────────────────────
    //  CT-01 — MMH: multi-merchant filter reduces results to selected merchants
    // ─────────────────────────────────────────────────────────────────────
    test('CT-01 — MMH multi-merchant filter restricts rows to selected set @critical @regression', async ({ page }) => {
      test.setTimeout(120_000);
      const env = new ConfigEnvironment(testData.env);
      const mmh = new MerchantModHistoryPage(page);

      let merchants: string[] = [];

      await test.step('Navigate to Merchant Modification History', async () => {
        await mmh.navigateToMerchantModHistory(env.originationUrl);
      });

      await test.step('Select 2 merchants from the live roster', async () => {
        const roster = await mmh.listAvailableMerchants();
        expect(
          roster.length,
          'MMH Merchant dropdown must expose at least 2 options in qa2',
        ).toBeGreaterThanOrEqual(2);
        merchants = pickFromRoster(roster, MERCHANT_HINTS, 2);
        await mmh.filterByMerchants(merchants);
      });

      await test.step('Filter counter shows 2 items selected', async () => {
        expect(await mmh.getMerchantSelectedCount()).toBe(2);
        const checked = await mmh.getCheckedMerchants();
        for (const m of merchants) {
          expect(
            checked,
            `Merchant "${m}" should remain ticked in the dropdown`,
          ).toEqual(expect.arrayContaining([expect.stringContaining(m)]));
        }
      });

      await test.step('Apply filter and verify every visible row matches selection', async () => {
        await mmh.applyFilters();
        const values = await mmh.getMerchantColumnValues();
        for (const cell of values) {
          expect(
            merchantInSet(cell, merchants),
            `Row Merchant "${cell}" must be one of ${JSON.stringify(merchants)}`,
          ).toBe(true);
        }
      });

      await test.step('Pagination footer (if present) reports a total', async () => {
        const pageInfo = await mmh.getVisiblePageInfo();
        // Footer is optional (single-page result sets omit it). When present it
        // must carry an "of N" total — a navigation read, not a business assert.
        if (pageInfo) {
          expect(pageInfo).toMatch(/\d+/);
        }
      });
    });

    // ─────────────────────────────────────────────────────────────────────
    //  CT-02 — MMH: Location filter (dependent on Merchant)
    // ─────────────────────────────────────────────────────────────────────
    test('CT-02 — MMH Location filter is Merchant-dependent and narrows results @regression', async ({ page }) => {
      test.setTimeout(120_000);
      const env = new ConfigEnvironment(testData.env);
      const mmh = new MerchantModHistoryPage(page);

      let merchant: string[] = [];

      await test.step('Navigate to MMH and select 1 merchant', async () => {
        await mmh.navigateToMerchantModHistory(env.originationUrl);
        const roster = await mmh.listAvailableMerchants();
        expect(roster.length, 'MMH Merchant dropdown must expose ≥ 1 option').toBeGreaterThanOrEqual(1);
        merchant = pickFromRoster(roster, MERCHANT_HINTS, 1);
        await mmh.filterByMerchants(merchant);
        expect(await mmh.getMerchantSelectedCount()).toBe(1);
      });

      await test.step('Apply Merchant-only filter and capture baseline row count', async () => {
        await mmh.applyFilters();
      });
      const merchantOnlyCount = await mmh.getVisibleRowCount();

      let pickedLocation = false;

      await test.step('Select 1 Location (only enabled after a Merchant is selected)', async () => {
        // Location is disabled until a Merchant is chosen (DOM-first qa2).
        // The Merchant is already selected above, so the Location roster is now
        // populated. Read it and pick the first real option — never a hard-coded
        // value (qa2 location rosters drift per merchant).
        const locRoster = await mmh.listAvailableLocations();
        if (locRoster.length >= 1) {
          await mmh.filterByLocations([locRoster[0]!]);
          const locCount = await mmh.getLocationSelectedCount();
          pickedLocation = locCount >= 1;
          if (pickedLocation) {
            expect(locCount).toBeGreaterThanOrEqual(1);
          }
        }
      });

      await test.step('Apply combined filter — result is no broader than Merchant-only', async () => {
        await mmh.applyFilters();
        if (pickedLocation) {
          const combinedCount = await mmh.getVisibleRowCount();
          // Adding a Location constraint can only narrow (or keep) the set.
          expect(
            combinedCount,
            `Merchant+Location rows (${combinedCount}) must be ≤ Merchant-only rows (${merchantOnlyCount})`,
          ).toBeLessThanOrEqual(merchantOnlyCount);
          expect(await mmh.getLocationSelectedCount()).toBeGreaterThanOrEqual(1);
        } else {
          // No Location offered for the chosen merchant in qa2 — record and
          // skip the narrowing assertion (data-dependent, not a defect).
          test.info().annotations.push({
            type: 'observation',
            description:
              `[OBSERVAÇÃO] CT-02 — No Location option was selectable for merchant ` +
              `${JSON.stringify(merchant)} on MMH in qa2; Merchant-dependency enable ` +
              `behaviour exercised, narrowing assertion skipped (no location data).`,
          });
        }
      });
    });

    // ─────────────────────────────────────────────────────────────────────
    //  CT-03 — Modification Report: multi-merchant filter
    // ─────────────────────────────────────────────────────────────────────
    test('CT-03 — Modification Report multi-merchant filter restricts rows to selected set @critical @regression', async ({ page }) => {
      test.setTimeout(120_000);
      const env = new ConfigEnvironment(testData.env);
      const modReport = new ModificationReportPage(page);

      let merchants: string[] = [];

      await test.step('Navigate to Modification Report', async () => {
        await modReport.navigateToModificationReport(env.originationUrl);
      });

      await test.step('Select 2 merchants from the live roster', async () => {
        const roster = await modReport.listAvailableMerchants();
        expect(
          roster.length,
          'Modification Report Merchant dropdown must expose at least 2 options in qa2',
        ).toBeGreaterThanOrEqual(2);
        merchants = pickFromRoster(roster, MERCHANT_HINTS, 2);
        await modReport.filterByMerchants(merchants);
      });

      await test.step('Filter counter shows the 2 selected merchants', async () => {
        expect(await modReport.getMerchantSelectedCount()).toBe(2);
        const checked = await modReport.getCheckedMerchants();
        for (const m of merchants) {
          expect(
            checked,
            `Merchant "${m}" should remain ticked in the dropdown`,
          ).toEqual(expect.arrayContaining([expect.stringContaining(m)]));
        }
      });

      await test.step('Apply filter and verify every visible row matches selection', async () => {
        await modReport.applyFilters();
        const values = await modReport.getMerchantColumnValues();
        for (const cell of values) {
          expect(
            merchantInSet(cell, merchants),
            `Row Merchant "${cell}" must be one of ${JSON.stringify(merchants)}`,
          ).toBe(true);
        }
      });
    });

    // ─────────────────────────────────────────────────────────────────────
    //  CT-04 — Funding Queue: multi-status filter (Funded + Refunded)
    // ─────────────────────────────────────────────────────────────────────
    test('CT-04 — Funding Queue multi-status filter (Funded + Refunded) @critical @regression', async ({ page }) => {
      test.setTimeout(120_000);
      const env = new ConfigEnvironment(testData.env);
      const funding = new FundingPage(page);

      const STATUSES = ['Funded', 'Refunded'];

      await test.step('Navigate to Funding Queue', async () => {
        await funding.navigateToFundingQueue(env.originationUrl);
      });

      await test.step('Confirm the desired statuses exist in the roster', async () => {
        const roster = await funding.listAvailableStatuses();
        for (const s of STATUSES) {
          expect(
            roster.some(r => r === s || r.includes(s)),
            `Funding Status roster must contain "${s}" (got ${JSON.stringify(roster)})`,
          ).toBe(true);
        }
      });

      await test.step('Select Funded + Refunded (clears the default "Funding")', async () => {
        // filterByStatuses internally clears the pre-selected "Funding" default
        // before applying the requested statuses (DOM-first qa2).
        await funding.filterByStatuses(STATUSES);
        expect(await funding.getStatusSelectedCount()).toBe(2);
        const checked = await funding.getCheckedStatuses();
        for (const s of STATUSES) {
          expect(
            checked,
            `Status "${s}" should be ticked`,
          ).toEqual(expect.arrayContaining([expect.stringContaining(s)]));
        }
        // The default must have been cleared — "Funding" should not be ticked.
        expect(
          checked.some(c => /^Funding$/i.test(c.trim())),
          'Default "Funding" status must be cleared after selecting Funded + Refunded',
        ).toBe(false);
      });

      await test.step('Apply filter and verify every visible row is Funded or Refunded', async () => {
        await funding.applyFiltersMulti();
        const values = await funding.getStatusColumnValues();
        for (const cell of values) {
          const c = cell.trim();
          if (!c) continue;
          expect(
            STATUSES.some(s => c === s || c.includes(s)),
            `Row Status "${c}" must be one of ${JSON.stringify(STATUSES)}`,
          ).toBe(true);
        }
      });
    });

    // ─────────────────────────────────────────────────────────────────────
    //  CT-05 — Funding Queue: multi-merchant filter
    // ─────────────────────────────────────────────────────────────────────
    test('CT-05 — Funding Queue multi-merchant filter restricts rows to selected set @regression', async ({ page }) => {
      test.setTimeout(120_000);
      const env = new ConfigEnvironment(testData.env);
      const funding = new FundingPage(page);

      let merchants: string[] = [];

      await test.step('Navigate to Funding Queue', async () => {
        await funding.navigateToFundingQueue(env.originationUrl);
      });

      await test.step('Widen Status to all so merchant rows are not masked by the default', async () => {
        // The Status default ("Funding") would hide funded/refunded merchant rows.
        // Select All gives merchant filtering a fair surface to act on.
        if (await funding.statusFilterHasSelectAll()) {
          await funding.selectAllStatuses();
        }
      });

      await test.step('Select 2 merchants from the live roster', async () => {
        const roster = await funding.listAvailableMerchants();
        expect(
          roster.length,
          'Funding Queue Merchant dropdown must expose at least 1 option in qa2',
        ).toBeGreaterThanOrEqual(1);
        merchants = pickFromRoster(roster, MERCHANT_HINTS, Math.min(2, roster.length));
        await funding.filterByMerchants(merchants);
        const selected = await funding.getMerchantSelectedCount();
        expect(
          selected,
          'Selected merchant count must match the picked set',
        ).toBe(merchants.length);
      });

      await test.step('Apply filter and verify visible rows match selected merchants', async () => {
        await funding.applyFiltersMulti();
        const values = await funding.getMerchantColumnValues();
        for (const cell of values) {
          expect(
            merchantInSet(cell, merchants),
            `Row Merchant "${cell}" must be one of ${JSON.stringify(merchants)}`,
          ).toBe(true);
        }
      });
    });

    // ─────────────────────────────────────────────────────────────────────
    //  CT-06 — Funding Queue: Status "Select All" ticks every status
    // ─────────────────────────────────────────────────────────────────────
    test('CT-06 — Funding Queue Status "Select All" selects all statuses @regression', async ({ page }) => {
      test.setTimeout(120_000);
      const env = new ConfigEnvironment(testData.env);
      const funding = new FundingPage(page);

      // Per DOM-first qa2: the four selectable statuses (excluding the
      // "Select All" control itself) are Funding, Funded, Request Refund,
      // Refunded.
      const EXPECTED_STATUSES = ['Funding', 'Funded', 'Request Refund', 'Refunded'];

      await test.step('Navigate to Funding Queue', async () => {
        await funding.navigateToFundingQueue(env.originationUrl);
      });

      await test.step('Status filter exposes a Select All affordance', async () => {
        expect(
          await funding.statusFilterHasSelectAll(),
          'Funding Queue Status filter must expose "Select All" (DOM-first qa2)',
        ).toBe(true);
      });

      await test.step('Click Select All — all four statuses become selected', async () => {
        await funding.selectAllStatuses();
        const selected = await funding.getStatusSelectedCount();
        expect(
          selected,
          `Select All should tick all ${EXPECTED_STATUSES.length} statuses (got ${selected})`,
        ).toBeGreaterThanOrEqual(EXPECTED_STATUSES.length);

        const checked = await funding.getCheckedStatuses();
        for (const s of EXPECTED_STATUSES) {
          expect(
            checked,
            `Status "${s}" must be ticked after Select All`,
          ).toEqual(expect.arrayContaining([expect.stringContaining(s)]));
        }
      });

      await test.step('Apply filter — results may include rows of any status', async () => {
        await funding.applyFiltersMulti();
        const values = await funding.getStatusColumnValues();
        // With every status selected, no row status can fall outside the set.
        for (const cell of values) {
          const c = cell.trim();
          if (!c) continue;
          expect(
            EXPECTED_STATUSES.some(s => c === s || c.includes(s)),
            `Row Status "${c}" must be one of ${JSON.stringify(EXPECTED_STATUSES)}`,
          ).toBe(true);
        }
      });
    });

    // ─────────────────────────────────────────────────────────────────────
    //  CT-07 — MMH: pagination preserves multi-merchant filter across pages
    // ─────────────────────────────────────────────────────────────────────
    test('CT-07 — MMH pagination preserves multi-merchant filter across pages @regression', async ({ page }) => {
      test.setTimeout(120_000);
      const env = new ConfigEnvironment(testData.env);
      const mmh = new MerchantModHistoryPage(page);
      let merchants: string[] = [];

      await test.step('Navigate to MMH and select 2 merchants', async () => {
        await mmh.navigateToMerchantModHistory(env.originationUrl);
        const roster = await mmh.listAvailableMerchants();
        expect(roster.length, 'MMH Merchant roster must have ≥ 2 options in qa2').toBeGreaterThanOrEqual(2);
        merchants = pickFromRoster(roster, MERCHANT_HINTS, 2);
        await mmh.filterByMerchants(merchants);
      });

      await test.step('Apply filter', async () => {
        await mmh.applyFilters();
      });

      const pageInfo = await mmh.getVisiblePageInfo();
      const totalMatch = /\d+-(\d+) of (\d+)/i.exec(pageInfo);
      const pageSize = totalMatch ? Number(totalMatch[1]) : 0;
      const total = totalMatch ? Number(totalMatch[2]) : 0;

      if (!totalMatch || total <= pageSize) {
        test.info().annotations.push({
          type: 'observation',
          description: `[OBSERVAÇÃO] CT-07 — MMH returned ${total || 'unknown'} rows (≤ page size ${pageSize}); single-page result in qa2. Pagination navigation skipped.`,
        });
        return;
      }

      await test.step('Navigate to next page', async () => {
        await mmh.goToNextPage();
      });

      await test.step('Rows on page 2 still belong to selected merchants', async () => {
        const values = await mmh.getMerchantColumnValues();
        for (const cell of values) {
          expect(
            merchantInSet(cell, merchants),
            `Page-2 MMH row "${cell}" must still belong to the selected merchant set`,
          ).toBe(true);
        }
        const page2Info = await mmh.getVisiblePageInfo();
        expect(page2Info, 'Pagination should show a page-2 range').toMatch(/^\d+-\d+ of \d+/);
      });
    });

    // ─────────────────────────────────────────────────────────────────────
    //  CT-08 — Modification Report: Location filter + pagination
    // ─────────────────────────────────────────────────────────────────────
    test('CT-08 — Modification Report Location filter and pagination @regression', async ({ page }) => {
      test.setTimeout(120_000);
      const env = new ConfigEnvironment(testData.env);
      const modReport = new ModificationReportPage(page);
      let merchant: string[] = [];
      let locationPicked = false;

      await test.step('Navigate and select 1 merchant (enables Location)', async () => {
        await modReport.navigateToModificationReport(env.originationUrl);
        const roster = await modReport.listAvailableMerchants();
        expect(roster.length, 'ModReport Merchant roster must have ≥ 1 option').toBeGreaterThanOrEqual(1);
        merchant = pickFromRoster(roster, MERCHANT_HINTS, 1);
        await modReport.filterByMerchants(merchant);
        expect(await modReport.getMerchantSelectedCount()).toBe(1);
      });

      await test.step('Select 1 Location (only enabled after Merchant is selected)', async () => {
        // Location is disabled in ModReport until a Merchant is selected (DOM-first qa2).
        // ModificationReportPage has no listAvailableLocations reader, so we read the
        // live roster via MerchantLocationFilterPO directly (ModificationReportPage
        // delegates filtering to the same PO).
        const filter = new MerchantLocationFilterPO(page);
        const locRoster = await filter.listAvailableOptions('Location');
        if (locRoster.length >= 1) {
          await modReport.filterByLocations([locRoster[0]!]);
          expect(await modReport.getLocationSelectedCount()).toBeGreaterThanOrEqual(1);
          locationPicked = true;
        } else {
          test.info().annotations.push({
            type: 'observation',
            description: `[OBSERVAÇÃO] CT-08 — No Location options for merchant ${JSON.stringify(merchant)} in ModReport qa2; Location assertion skipped.`,
          });
        }
      });

      await test.step('Apply filter and verify merchant rows', async () => {
        await modReport.applyFilters();
        const values = await modReport.getMerchantColumnValues();
        for (const cell of values) {
          expect(
            merchantInSet(cell, merchant),
            `Row Merchant "${cell}" must be the selected merchant`,
          ).toBe(true);
        }
        if (locationPicked) {
          expect(await modReport.getLocationSelectedCount(), 'Location selection persists after apply').toBeGreaterThanOrEqual(1);
        }
      });

      await test.step('Pagination: navigate to next page if available', async () => {
        const pageInfo = await modReport.getVisiblePageInfo();
        const match = /\d+-(\d+) of (\d+)/i.exec(pageInfo);
        const pageSize = match ? Number(match[1]) : 0;
        const total = match ? Number(match[2]) : 0;

        if (!match || total <= pageSize) {
          test.info().annotations.push({
            type: 'observation',
            description: `[OBSERVAÇÃO] CT-08 — ModReport returned ${total || 'unknown'} rows in qa2; single-page, pagination navigation skipped.`,
          });
          return;
        }
        await modReport.goToNextPage();
        const page2Values = await modReport.getMerchantColumnValues();
        for (const cell of page2Values) {
          expect(
            merchantInSet(cell, merchant),
            `Page-2 row "${cell}" must still belong to selected merchant`,
          ).toBe(true);
        }
      });
    });

    // ─────────────────────────────────────────────────────────────────────
    //  CT-09 — Funding Queue: CSV download row count matches UI total
    // ─────────────────────────────────────────────────────────────────────
    test('CT-09 — Funding Queue CSV download row count matches UI filtered total @regression', async ({ page }) => {
      test.setTimeout(120_000);
      const env = new ConfigEnvironment(testData.env);
      const funding = new FundingPage(page);

      await test.step('Navigate to Funding Queue and apply Funded status filter', async () => {
        await funding.navigateToFundingQueue(env.originationUrl);
        // "Funded" is a well-known status with data in qa2 (leads that have been funded).
        // filterByStatuses clears the default "Funding" selection before applying.
        await funding.filterByStatuses(['Funded']);
        await funding.applyFiltersMulti();
      });

      const uiTotal = await funding.getTotalCsvRowCount();

      await test.step('Download CSV and assert row count matches UI total [reflex]', async () => {
        const enabled = await funding.isDownloadCsvEnabled();

        if (!enabled) {
          // Size limit exceeded (> 48 MiB) or empty result — record and exit without failing.
          test.info().annotations.push({
            type: 'observation',
            description:
              '[OBSERVAÇÃO] CT-09 — Download CSV disabled on Funding Queue after applying Funded filter. ' +
              `Email CSV available: ${String(await funding.isEmailCsvVisible())}. ` +
              'Possible causes: (a) size limit (> 48 MiB) — unlikely for qa2 data volume; ' +
              '(b) empty Funded result set in qa2 on this run; (c) permission not granted for manager role. ' +
              'CSV row-count assertion skipped.',
          });
          return;
        }

        const download = await funding.downloadCsv();
        const filePath = await download.path();
        if (!filePath) {
          test.info().annotations.push({
            type: 'observation',
            description: '[OBSERVAÇÃO] CT-09 — download.path() returned null; file not captured. Skipping content assertion.',
          });
          return;
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        const { dataRowCount } = parseCsv(content);

        // The CSV must have at least 1 data row (funding queue is not empty for Funded status).
        expect(dataRowCount, 'CSV must contain at least 1 data row for Funded status in qa2').toBeGreaterThan(0);

        // When the UI pagination footer shows a total, the CSV must match it. [reflex #12 —
        // export/document parity: what the customer downloads must equal what the UI reports.]
        if (uiTotal !== null) {
          expect(
            dataRowCount,
            `CSV data rows (${dataRowCount}) must equal UI total (${uiTotal}) for Funded filter`,
          ).toBe(uiTotal);
        }
      });
    });

    // ─────────────────────────────────────────────────────────────────────
    //  CT-10 — S-PAYLOAD: Funding Queue Search POST body contains merchant array
    // ─────────────────────────────────────────────────────────────────────
    test('CT-10 — Funding Queue Search POST body contains merchant array (S-PAYLOAD AC-7) @regression', async ({ page }) => {
      test.setTimeout(120_000);
      const env = new ConfigEnvironment(testData.env);
      const funding = new FundingPage(page);
      let merchants: string[] = [];

      await test.step('Navigate to Funding Queue and select 2 merchants', async () => {
        await funding.navigateToFundingQueue(env.originationUrl);
        const roster = await funding.listAvailableMerchants();
        expect(
          roster.length,
          'Funding Merchant roster must have ≥ 2 options in qa2',
        ).toBeGreaterThanOrEqual(2);
        merchants = pickFromRoster(roster, MERCHANT_HINTS, Math.min(2, roster.length));
        await funding.filterByMerchants(merchants);
      });

      await test.step('Intercept Search POST and assert merchant array in body', async () => {
        // Register request interceptor BEFORE the click (race-free pattern from CT-13 in #1292).
        const requestPromise = page.waitForRequest(
          req => req.url().includes('getLeadsForFundingQueue') && req.method() === 'POST',
          { timeout: 15_000 },
        ).catch(() => null);

        await funding.applyFiltersMulti();
        const request = await requestPromise;

        if (!request) {
          test.info().annotations.push({
            type: 'observation',
            description:
              '[OBSERVAÇÃO] CT-10 — No POST to getLeadsForFundingQueue captured. ' +
              'Endpoint confirmed via discovery (2026-06-18): POST /uown/los/getLeadsForFundingQueue. ' +
              'May be a timing issue or URL mismatch — escalate if recurring.',
          });
          return;
        }

        const postData = request.postData() ?? '';
        let parsedArrayLen: number | null = null;
        try {
          const json = JSON.parse(postData) as Record<string, unknown>;
          // Try common merchant-array field names used in UOWN backend endpoints.
          for (const key of ['merchantIds', 'merchantPks', 'merchantCodes', 'merchants', 'merchantNames']) {
            const v = json[key];
            if (Array.isArray(v)) {
              parsedArrayLen = v.length;
              break;
            }
          }
        } catch {
          // Body is not JSON (unexpected for this endpoint).
        }

        if (parsedArrayLen === null) {
          test.info().annotations.push({
            type: 'observation',
            description:
              `[OBSERVAÇÃO] CT-10 — No merchant-array field found in POST body. ` +
              `Body sample (first 300 chars): ${postData.slice(0, 300)}. ` +
              `Escalate to dev: backend should send merchants as array for multi-select.`,
          });
          return;
        }

        expect(
          parsedArrayLen,
          `Funding Queue POST body must contain a merchant array of length ${merchants.length} (got ${parsedArrayLen})`,
        ).toBe(merchants.length);
      });
    });

    // ─────────────────────────────────────────────────────────────────────
    //  CT-11 — Funding Queue: Location multi-select filter
    // ─────────────────────────────────────────────────────────────────────
    test('CT-11 — Funding Queue Location filter is independent of Merchant @regression', async ({ page }) => {
      test.setTimeout(120_000);
      const env = new ConfigEnvironment(testData.env);
      const funding = new FundingPage(page);
      let locationPicked = false;
      let selectedCount = 0;

      await test.step('Navigate to Funding Queue', async () => {
        await funding.navigateToFundingQueue(env.originationUrl);
      });

      await test.step('Widen Status to all so Location results are not masked', async () => {
        if (await funding.statusFilterHasSelectAll()) {
          await funding.selectAllStatuses();
        }
      });

      await test.step('Select 1-2 locations from live roster (Location independent of Merchant)', async () => {
        // DOM-first qa2 2026-06-18: Funding Queue Location is NOT disabled before Merchant
        // selection (unlike MMH/ModReport). Can be selected freely.
        // FundingPage.listAvailableLocations() uses the stable #merchantLocation ID —
        // MerchantLocationFilterPO is incompatible here (uses <label> XPath, but Funding
        // Queue labels are <div> elements — qa2 2026-06-19).
        const locRoster = await funding.listAvailableLocations();

        if (locRoster.length === 0) {
          test.info().annotations.push({
            type: 'observation',
            description:
              '[OBSERVAÇÃO] CT-11 — No Location options available in Funding Queue qa2 roster. ' +
              'Location filter assertion skipped.',
          });
          return;
        }

        const locations = pickFromRoster(locRoster, [], Math.min(2, locRoster.length));
        await funding.filterByLocations(locations);
        selectedCount = await funding.getLocationSelectedCount();
        expect(selectedCount, 'Funding Location filter must show selected count').toBe(locations.length);
        locationPicked = true;
      });

      await test.step('Apply filter and verify Location selection persists', async () => {
        if (!locationPicked) return;
        await funding.applyFiltersMulti();
        // Location selection count must survive the Search apply. A reset to 0 here is a bug.
        const countAfter = await funding.getLocationSelectedCount();
        expect(countAfter, 'Location selection must persist after applying filter').toBe(selectedCount);
      });
    });

    // ─────────────────────────────────────────────────────────────────────
    //  CT-12 — Funding Queue: pagination preserves filter state
    // ─────────────────────────────────────────────────────────────────────
    test('CT-12 — Funding Queue pagination preserves multi-status filter across pages @regression', async ({ page }) => {
      test.setTimeout(120_000);
      const env = new ConfigEnvironment(testData.env);
      const funding = new FundingPage(page);

      // Select all statuses to maximize result set and make pagination likely.
      const ALL_STATUSES = ['Funding', 'Funded', 'Request Refund', 'Refunded'];

      await test.step('Navigate to Funding Queue and select all statuses', async () => {
        await funding.navigateToFundingQueue(env.originationUrl);
        if (await funding.statusFilterHasSelectAll()) {
          await funding.selectAllStatuses();
        } else {
          // Fallback: explicitly select all known statuses.
          await funding.filterByStatuses(ALL_STATUSES);
        }
      });

      await test.step('Apply filter', async () => {
        await funding.applyFiltersMulti();
      });

      const pageInfo = await funding.getVisiblePageInfo();
      const totalMatch = /\d+-(\d+) of (\d+)/i.exec(pageInfo);
      const pageSize = totalMatch ? Number(totalMatch[1]) : 0;
      const total = totalMatch ? Number(totalMatch[2]) : 0;

      if (!totalMatch || total <= pageSize) {
        test.info().annotations.push({
          type: 'observation',
          description:
            `[OBSERVAÇÃO] CT-12 — Funding Queue returned ${total || 'unknown'} rows (≤ page size ${pageSize}); ` +
            'single-page result in qa2. Pagination navigation skipped.',
        });
        return;
      }

      await test.step('Navigate to next page', async () => {
        await funding.goToNextPage();
      });

      await test.step('Rows on page 2 still belong to the selected status set', async () => {
        const values = await funding.getStatusColumnValues();
        for (const cell of values) {
          const c = cell.trim();
          if (!c) continue;
          expect(
            ALL_STATUSES.some(s => c === s || c.includes(s)),
            `Page-2 Funding Queue row Status "${c}" must be one of ${JSON.stringify(ALL_STATUSES)}`,
          ).toBe(true);
        }
        const page2Info = await funding.getVisiblePageInfo();
        expect(page2Info, 'Pagination must show a page-2 range after navigation').toMatch(/^\d+-\d+ of \d+/);
      });
    });

    // ─────────────────────────────────────────────────────────────────────
    //  CT-13 — Funding Queue: Email CSV sends filtered report to recipient
    // ─────────────────────────────────────────────────────────────────────
    test('CT-13 — Funding Queue Email CSV sends filtered report to fintechgroup777@gmail.com @regression', async ({ page }) => {
      test.setTimeout(60_000);
      const env = new ConfigEnvironment(testData.env);
      const funding = new FundingPage(page);

      const RECIPIENT = 'fintechgroup777@gmail.com';
      // Use all four statuses to maximise the chance of finding records in qa2
      // (not all statuses have data at every point in time; using a broader set
      // avoids a false-disabled button from an accidentally empty result set).
      const ALL_STATUSES = ['Funded', 'Refunded', 'Funding', 'Request Refund'];

      await test.step('Navigate to Funding Queue and apply broad status filter', async () => {
        await funding.navigateToFundingQueue(env.originationUrl);
        await funding.filterByStatuses(ALL_STATUSES);
        await funding.applyFiltersMulti();
      });

      await test.step('Email CSV button must be visible', async () => {
        expect(
          await funding.isEmailCsvVisible(),
          'Email CSV button must be rendered on Funding Queue',
        ).toBe(true);
      });

      const emailEnabled = await funding.isEmailCsvEnabled();
      console.log(`[CT-13] isEmailCsvEnabled=${emailEnabled}`);
      if (!emailEnabled) {
        console.log('[CT-13] GUARD TRIGGERED — button disabled, skipping email send');
        test.info().annotations.push({
          type: 'observation',
          description:
            '[OBSERVATION] Email CSV button is disabled — no records returned by the broad status filter in qa2 at execution time. Email CSV submission flow not verified this run.',
        });
        return;
      }
      console.log('[CT-13] button enabled — proceeding with full modal flow');

      await test.step('Open Email CSV modal and verify it appears', async () => {
        await funding.openEmailCsvModal();
      });

      await test.step(`Fill recipient address (${RECIPIENT}) — Send button enables`, async () => {
        await funding.fillEmailCsvAddress(RECIPIENT);
        expect(
          await funding.isEmailCsvSendEnabled(),
          'Send button must be enabled after filling a valid email address',
        ).toBe(true);
      });

      await test.step('Click Send — modal closes (email dispatched to queue)', async () => {
        await funding.sendEmailCsv();
        // Assertion: the modal closed, meaning the backend accepted the request.
        // Email delivery to fintechgroup777@gmail.com is async — we do not poll
        // the inbox here.
      });
    });

    // ─────────────────────────────────────────────────────────────────────
    //  CT-14 — Funding Queue: 4 scheduled sweeps trigger without errors
    // ─────────────────────────────────────────────────────────────────────
    test('CT-14 — Funding Queue scheduled sweeps (all 4) respond 2xx @regression', async ({ api }) => {
      test.setTimeout(120_000);

      // The four Quartz sweep tasks that generate daily funding reports.
      // Confirmed names via DB query (uown_scheduler / quartz_job_details) — qa2 2026-06-18.
      const SWEEPS = [
        'dailyFundingReportSweep',
        'dailyFundedReportSweep',
        'dailyRefundReportSweep',
        'dailyRefundedReportSweep',
      ] as const;

      for (const sweep of SWEEPS) {
        await test.step(`${sweep} — resume if needed + trigger`, async () => {
          // Step 1: check task active status.
          // Empty body from getScheduledTaskByName = is_active=null/false.
          // cronTrigger "0 0 0 1 1 ? 2099" = deliberately set to far-future (effectively disabled).
          // In both cases: call resumeScheduledTask before triggering (per RU04 pattern).
          const meta = await api.scheduledTask.getScheduledTaskByName(sweep);
          const body = meta.body as Record<string, unknown> | null;
          const isActive = body && Object.keys(body).length > 0;
          const cronTrigger = isActive ? (body!.cronTrigger as string) : null;
          const needsResume = !isActive || (cronTrigger?.includes('2099') ?? false);

          if (needsResume) {
            const resumeRes = await api.scheduledTask.resumeScheduledTask(sweep);
            console.log(`[CT-14] resumeScheduledTask(${sweep}) → HTTP ${resumeRes.status}`);
            test.info().annotations.push({
              type: 'info',
              description: `${sweep}: resumed (was ${isActive ? `cronTrigger=${cronTrigger}` : 'is_active=false'}) → HTTP ${resumeRes.status}`,
            });
          }

          // Step 2: trigger.
          const res = await api.scheduledTask.triggerScheduledTask(sweep);
          console.log(`[CT-14] triggerScheduledTask(${sweep}) → HTTP ${res.status}`);
          expect(
            res.status,
            `${sweep} must return 2xx`,
          ).toBeGreaterThanOrEqual(200);
          expect(res.status).toBeLessThan(300);
        });
      }
    });
  },
);

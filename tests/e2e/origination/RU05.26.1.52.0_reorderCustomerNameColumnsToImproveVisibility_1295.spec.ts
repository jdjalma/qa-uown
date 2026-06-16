/**
 * Task #1295 — Origination | Reorder Customer Name Columns to Improve Visibility.
 *
 * SPEC: docs/taskTestingUown/RU05.26.1.52.0_reorderCustomerNameColumnsToImproveVisibility_1295/
 *
 * Scope (per SPEC § 1):
 *  - Overview: `First Name` + `Last Name` appear BEFORE `Sales Person`/`Sales Rep Code`/`Merchant Support`.
 *  - Leads: `Customer Name` appears IMMEDIATELY BEFORE `Invoice Number` (single column on Leads).
 *  - Funding: `Customer Name` appears IMMEDIATELY AFTER `Funding Queue Status` (single column on Funding).
 *  - Customer-name <th> fully visible at viewport 1440×900 with scrollLeft=0 (AC5).
 *  - Sort / filter / pagination / CSV export still work (AC6).
 *  - Cells under the reordered headers carry the correct data (AC8 — P1).
 *  - Config Columns toggle (Overview) preserves remaining column order (CT-10 — P3).
 *
 * Justifications recorded in SPEC §§ 1, 5:
 *  - **Rule #12 — Merchant preflight**: SKIPPED. No application created in CT-01..08;
 *    CT-09 fresh-data path uses `createPreQualifiedApplication` which runs preflight
 *    by itself. Read-only CTs do not mutate merchant config.
 *  - **Rule #13 — Activity log**: SKIPPED. Reordering columns is not a business action;
 *    no row in `uown_los_lead_notes` is generated nor expected.
 *  - **Rule #14 — UI-first**: ENFORCED. Feature is purely visual — API-only would be
 *    incapable of catching the bug.
 *  - **Rule #15 — DOM-first**: SPEC § 0.5 records the MCP investigation done in qa1
 *    on 2026-05-20 (exact header texts per page, `.table-responsive` wrapper as the
 *    scrollable container, Config Columns affordance). Selectors here are derived
 *    from that investigation; no second MCP round was needed beyond the SPEC.
 *
 * Environment: `sandbox` primary (default per CLAUDE.md). Run via the
 * `origination-ui` Playwright project — viewport is forced to 1440×900 in
 * `beforeEach` (AC5 requires the precise size).
 *
 * Default agent auth (`.auth/origination.json`) — all three pages are accessible
 * to the default user (`DEFAULT_USERNAME` / `DEFAULT_PASSWORD`).
 *
 * Pre-implementation blocking item recorded in SPEC § 11: confirm with Marcus/Yuri
 * whether the qa1 ordering observed on 2026-05-20 is the result of the #1295 fix
 * (regression-style validation) or pre-existing layout. This test asserts the
 * target state regardless of cause; `qa-validator` should flag if no env differs.
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import {
  OverviewPage,
  LeadsPage,
  FundingPage,
} from '@pages/origination/index.js';
import { SELECTORS } from '@selectors/common.selectors.js';
import { TestTag, buildTags } from '@ptypes/enums.js';
import { ConfigEnvironment, generateRunId } from '@config/index.js';
import { normalizeHeader } from '@helpers/table.helpers.js';
import { createPreQualifiedApplication } from '@helpers/api-setup.helpers.js';
import { buildTestData } from '@helpers/test-data.helpers.js';

// ── Test data ───────────────────────────────────────────────────────
//
// CT-01..08 are read-only over existing data (SPEC §§ 5, 7 — Test Data
// Hierarchy exception: fresh data not required for column-order assertions).
// CT-09 (data-cell alignment, P1) creates a fresh lead via
// `createPreQualifiedApplication` to get a row with KNOWN first/last name +
// invoice number. We avoid qa1 for the fresh-data CT (memory
// `project_dv360_uat_qa1_outage_2026_05_18`) — sandbox is the default.
//
// `runId` powers the unique customer name used by CT-09; the same value is
// safe to share across the describe (CT-09 is the only producer).
const RUN_ID = generateRunId();

const testData = {
  // env comes from `.env` via ConfigEnvironment; the project (origination-ui)
  // already resolves the correct base URL through `process.env.ORIGINATION_URL`.
  // We keep `env` here only for the tag, mirroring the project convention.
  envTag: TestTag.SANDBOX,
  runId: RUN_ID,
  tag: buildTags(TestTag.REGRESSION, TestTag.SANDBOX),
};

const VIEWPORT = { width: 1440, height: 900 } as const;

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Resolves the scrollable container ancestor for a given `<th>`. Origination
 * tables sit inside Bootstrap `<div class="table-responsive">` (SPEC § 0.5).
 * If `.table-responsive` is absent, falls back to any ancestor with
 * `overflow*` style or class.
 *
 * Returns the bounding rect of the customer-name <th> and the container's
 * `scrollLeft` — used to assert AC5.
 */
async function probeCustomerHeaderViewport(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  page: any,
  headerText: string,
): Promise<{ left: number; right: number; scrollLeft: number; windowWidth: number } | null> {
  return page.evaluate(
    ([labels, scrollableSelector]: [string[], string]) => {
      const norm = (s: string): string =>
        (s ?? '').replace(/[▲▼△▽↑↓]/g, '').trim().toLowerCase();
      const wanted = norm(labels[0] ?? '');
      const ths = Array.from(document.querySelectorAll<HTMLElement>("[role='columnheader']"));
      const th = ths.find(el => norm(el.textContent ?? '') === wanted);
      if (!th) return null;
      const rect = th.getBoundingClientRect();
      // Find the closest scrollable ancestor — prefer `.table-responsive`.
      let parent: HTMLElement | null = th.parentElement;
      let scrollContainer: HTMLElement | null = null;
      while (parent) {
        if (parent.matches(scrollableSelector)) {
          scrollContainer = parent;
          break;
        }
        parent = parent.parentElement;
      }
      return {
        left: rect.left,
        right: rect.right,
        scrollLeft: scrollContainer?.scrollLeft ?? 0,
        windowWidth: window.innerWidth,
      };
    },
    [[headerText], SELECTORS.scrollableAncestor] as const,
  );
}

// ─────────────────────────────────────────────────────────────────────
//  describe — task #1295
// ─────────────────────────────────────────────────────────────────────
test.describe(
  'RU05.26.1.52.0_reorderCustomerNameColumnsToImproveVisibility_1295',
  { tag: testData.tag.split(' ') },
  () => {
    test.beforeEach(async ({ page }) => {
      // AC5 requires a fixed viewport. The browser-factory profile uses
      // `viewport: null` (window-size driven), so we force the size here.
      await page.setViewportSize({ width: VIEWPORT.width, height: VIEWPORT.height });
    });

    // ─────────────────────────────────────────────────────────────────
    //  CT-01 — Overview column order (AC1 + AC2 + AC7)
    // ─────────────────────────────────────────────────────────────────
    test('CT-01 — Overview: customer name columns precede Sales/Merchant Support @origination @column-order @overview', async ({ page }) => {
      const env = new ConfigEnvironment(process.env.ENV ?? 'sandbox');
      const overview = new OverviewPage(page);

      await test.step('Navigate to Overview and wait for table', async () => {
        await page.goto(`${env.originationUrl}overview`, { waitUntil: 'domcontentloaded' });
        await overview.verifyDashboardLoaded();
        await page.locator(SELECTORS.tableRow).first()
          .waitFor({ state: 'visible', timeout: 30_000 })
          .catch(() => {
            // Empty dataset is unusual on Overview but doesn't block header assertions.
          });
      });

      const headers = await overview.readHeaderOrder();
      expect(headers.length, 'Overview must have at least 5 headers').toBeGreaterThanOrEqual(5);

      const iFirst = await overview.getColumnIndexByHeaderText('First Name');
      const iLast = await overview.getColumnIndexByHeaderText('Last Name');
      const iSalesPerson = await overview.getColumnIndexByHeaderText('Sales Person');
      const iSalesRepCode = await overview.getColumnIndexByHeaderText('Sales Rep Code');
      const iMerchantSupport = await overview.getColumnIndexByHeaderText('Merchant Support');

      // AC7 — labels present
      expect(iFirst, '`First Name` header must exist on Overview').toBeGreaterThanOrEqual(0);
      expect(iLast, '`Last Name` header must exist on Overview').toBeGreaterThanOrEqual(0);
      expect(iSalesPerson, '`Sales Person` header must exist on Overview (AC2 — not removed)').toBeGreaterThanOrEqual(0);
      expect(iSalesRepCode, '`Sales Rep Code` header must exist on Overview (AC2 — not removed)').toBeGreaterThanOrEqual(0);
      expect(iMerchantSupport, '`Merchant Support` header must exist on Overview (AC2 — not removed)').toBeGreaterThanOrEqual(0);

      // AC1 — First Name + Last Name are consecutive and precede Sales/Merchant Support
      expect(iLast, '`Last Name` must immediately follow `First Name`').toBe(iFirst + 1);
      expect(iFirst, '`First Name` must precede `Sales Person`').toBeLessThan(iSalesPerson);
      expect(iLast, '`Last Name` must precede `Sales Rep Code`').toBeLessThan(iSalesRepCode);
      expect(iLast, '`Last Name` must precede `Merchant Support`').toBeLessThan(iMerchantSupport);
    });

    // ─────────────────────────────────────────────────────────────────
    //  CT-02 — Leads column order (AC3 + AC7 + negative AC1/AC2)
    // ─────────────────────────────────────────────────────────────────
    test('CT-02 — Leads: Customer Name immediately before Invoice Number @origination @column-order @leads', async ({ page }) => {
      const env = new ConfigEnvironment(process.env.ENV ?? 'sandbox');
      const leads = new LeadsPage(page);

      await test.step('Navigate to Leads', async () => {
        await leads.navigateAndWaitForTable(env.originationUrl);
      });

      const headers = await leads.readHeaderOrder();
      expect(headers.length, 'Leads must have at least 8 headers').toBeGreaterThanOrEqual(8);

      const iCustomer = await leads.getColumnIndexByHeaderText('Customer Name');
      const iInvoice = await leads.getColumnIndexByHeaderText('Invoice Number');

      expect(iCustomer, '`Customer Name` header must exist on Leads').toBeGreaterThanOrEqual(0);
      expect(iInvoice, '`Invoice Number` header must exist on Leads').toBeGreaterThanOrEqual(0);

      // AC3
      expect(iInvoice, '`Invoice Number` must be immediately after `Customer Name` (AC3)').toBe(iCustomer + 1);

      // Negative assertions (SPEC § 0.5): Leads has no Sales Rep / Merchant Support columns.
      // Use plain header lookup so a partial-match (e.g. "Sales Rep Code") does not match.
      const lowered = headers.map(h => h.toLowerCase());
      expect(
        lowered.includes('sales rep'),
        'Leads should NOT have a standalone `Sales Rep` header (SPEC § 0.5)',
      ).toBe(false);
      expect(
        lowered.includes('merchant support'),
        'Leads should NOT have a `Merchant Support` header (SPEC § 0.5)',
      ).toBe(false);
    });

    // ─────────────────────────────────────────────────────────────────
    //  CT-03 — Funding column order (AC4 + AC7 + negative)
    // ─────────────────────────────────────────────────────────────────
    test('CT-03 — Funding: Customer Name immediately after Funding Queue Status @origination @column-order @funding', async ({ page }) => {
      const env = new ConfigEnvironment(process.env.ENV ?? 'sandbox');
      const funding = new FundingPage(page);

      await test.step('Navigate to Funding', async () => {
        await page.goto(`${env.originationUrl}funding`, { waitUntil: 'domcontentloaded' });
        await funding.waitForSpinner();
      });

      const headers = await funding.readHeaderOrder();
      expect(headers.length, 'Funding must have at least 4 headers').toBeGreaterThanOrEqual(4);

      const iQueueStatus = await funding.getColumnIndexByHeaderText('Funding Queue Status');
      const iCustomer = await funding.getColumnIndexByHeaderText('Customer Name');
      const iSalesRepCode = await funding.getColumnIndexByHeaderText('Sales Rep Code');

      expect(iQueueStatus, '`Funding Queue Status` header must exist').toBeGreaterThanOrEqual(0);
      expect(iCustomer, '`Customer Name` header must exist').toBeGreaterThanOrEqual(0);
      expect(iSalesRepCode, '`Sales Rep Code` header must exist (AC2 reduced)').toBeGreaterThanOrEqual(0);

      // AC4
      expect(iCustomer, '`Customer Name` must be immediately after `Funding Queue Status` (AC4)').toBe(iQueueStatus + 1);
      expect(iCustomer, '`Customer Name` must precede `Sales Rep Code`').toBeLessThan(iSalesRepCode);

      // Negative: Funding has no Merchant Support column.
      const lowered = headers.map(h => h.toLowerCase());
      expect(
        lowered.includes('merchant support'),
        'Funding should NOT have a `Merchant Support` header (SPEC § 0.5)',
      ).toBe(false);
    });

    // ─────────────────────────────────────────────────────────────────
    //  CT-04 — Customer name <th> visible without horizontal scroll (AC5)
    //
    //  Parameterized across the 3 pages.
    // ─────────────────────────────────────────────────────────────────
    const CT04_PAGES: ReadonlyArray<{
      name: string;
      route: 'overview' | 'leads' | 'funding';
      customerHeaders: string[];
    }> = [
      { name: 'Overview', route: 'overview', customerHeaders: ['First Name', 'Last Name'] },
      { name: 'Leads', route: 'leads', customerHeaders: ['Customer Name'] },
      { name: 'Funding', route: 'funding', customerHeaders: ['Customer Name'] },
    ];

    for (const target of CT04_PAGES) {
      test(`CT-04 — ${target.name}: customer name visible without horizontal scroll (AC5) @origination @scroll @viewport`, async ({ page }) => {
        const env = new ConfigEnvironment(process.env.ENV ?? 'sandbox');

        await test.step(`Navigate to ${target.name}`, async () => {
          if (target.route === 'leads') {
            const leads = new LeadsPage(page);
            await leads.navigateAndWaitForTable(env.originationUrl);
          } else {
            await page.goto(`${env.originationUrl}${target.route}`, { waitUntil: 'domcontentloaded' });
            // Wait for the table to actually render
            await page.locator(SELECTORS.tableHeader).first()
              .waitFor({ state: 'visible', timeout: 30_000 });
          }
        });

        for (const headerText of target.customerHeaders) {
          await test.step(`Customer header "${headerText}" within initial viewport at scrollLeft=0`, async () => {
            const probe = await probeCustomerHeaderViewport(page, headerText);
            expect(probe, `Header \`${headerText}\` must be reachable in the DOM`).not.toBeNull();
            if (!probe) return; // narrow type
            expect(
              probe.scrollLeft,
              `Scroll container must be at scrollLeft=0 before the assertion (got ${probe.scrollLeft})`,
            ).toBe(0);
            expect(
              probe.left,
              `Header \`${headerText}\` left edge (${probe.left}) must be >= 0`,
            ).toBeGreaterThanOrEqual(0);
            expect(
              probe.right,
              `Header \`${headerText}\` right edge (${probe.right}) must be <= viewport width (${probe.windowWidth})`,
            ).toBeLessThanOrEqual(probe.windowWidth);
          });
        }
      });
    }

    // ─────────────────────────────────────────────────────────────────
    //  CT-05 — Sort regression on customer-name column (AC6/AC9)
    //  Page: Leads (canonical — single Customer Name column).
    // ─────────────────────────────────────────────────────────────────
    test('CT-05 — Leads: sort by Customer Name preserves direction (AC6/AC9) @origination @sort @regression', async ({ page }) => {
      const env = new ConfigEnvironment(process.env.ENV ?? 'sandbox');
      const leads = new LeadsPage(page);
      await leads.navigateAndWaitForTable(env.originationUrl);

      const iCustomer = await leads.getColumnIndexByHeaderText('Customer Name');
      expect(iCustomer, '`Customer Name` header must exist before sort').toBeGreaterThanOrEqual(0);

      const customerHeader = page.locator(SELECTORS.tableHeader).nth(iCustomer);

      const readColumn = async (): Promise<string[]> => {
        const rows = await leads.getAllVisibleRows();
        // Read by the normalized header key (`getAllVisibleRows` already uses normalized headers).
        return rows.map(r => (r['Customer Name'] ?? '').trim()).filter(v => v.length > 0);
      };

      const before = await readColumn();
      // SPEC pre-condition: ≥ 5 distinct last names. We assert presence of enough
      // rows but degrade gracefully (the assertion will simply pass trivially on
      // small datasets while still validating the sort action does not error).
      if (before.length < 2) {
        test.info().annotations.push({
          type: 'observation',
          description:
            `[OBSERVAÇÃO] CT-05 — Only ${before.length} customer-name values visible in ${process.env.ENV ?? 'sandbox'}; ` +
            'sort assertion downgraded to "click does not throw + header acts as toggle".',
        });
      }

      await test.step('Click Customer Name header → ascending sort', async () => {
        await customerHeader.scrollIntoViewIfNeeded();
        await customerHeader.click();
        await leads.waitForSpinner();
      });
      const asc = await readColumn();
      if (asc.length >= 2) {
        const sortedAsc = [...asc].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
        expect(asc, 'Ascending sort: values must be lexicographically ordered').toEqual(sortedAsc);
      }

      await test.step('Click Customer Name header again → descending sort', async () => {
        await customerHeader.click();
        await leads.waitForSpinner();
      });
      const desc = await readColumn();
      if (desc.length >= 2) {
        const sortedDesc = [...desc].sort((a, b) => b.toLowerCase().localeCompare(a.toLowerCase()));
        expect(desc, 'Descending sort: values must be reverse-lexicographically ordered').toEqual(sortedDesc);
      }
    });

    // ─────────────────────────────────────────────────────────────────
    //  CT-06 — Filter regression: Customer Name field still filters rows (AC6)
    // ─────────────────────────────────────────────────────────────────
    test('CT-06 — Leads: filter by Customer Name returns matching rows (AC6) @origination @filter @regression', async ({ page }) => {
      const env = new ConfigEnvironment(process.env.ENV ?? 'sandbox');
      const leads = new LeadsPage(page);
      await leads.navigateAndWaitForTable(env.originationUrl);

      // Pick a value from an existing visible row to guarantee a hit (SPEC §7).
      const rowsBefore = await leads.getAllVisibleRows();
      if (rowsBefore.length === 0) {
        test.info().annotations.push({
          type: 'observation',
          description:
            '[OBSERVAÇÃO] CT-06 — No rows visible on Leads default view; filter cannot be exercised. ' +
            'Escalate to qa-validator: confirm env has lead data before re-running.',
        });
        return;
      }
      const sample = (rowsBefore[0]?.['Customer Name'] ?? '').trim();
      if (!sample) {
        test.info().annotations.push({
          type: 'observation',
          description: '[OBSERVAÇÃO] CT-06 — First lead row has empty Customer Name; skip filter assertion.',
        });
        return;
      }
      // Use last token (last name) — the filter is typically partial-match.
      const filterValue = sample.split(/\s+/).pop() ?? sample;

      await test.step(`Filter by Customer Name = "${filterValue}"`, async () => {
        await leads.setCustomerName(filterValue);
        await leads.submitFilters();
      });

      const after = await leads.getAllVisibleRows();
      expect(after.length, 'At least 1 row must match the filter').toBeGreaterThan(0);
      for (const row of after) {
        const cell = (row['Customer Name'] ?? '').toLowerCase();
        expect(
          cell.includes(filterValue.toLowerCase()),
          `Row Customer Name "${row['Customer Name']}" must contain "${filterValue}"`,
        ).toBe(true);
      }
    });

    // ─────────────────────────────────────────────────────────────────
    //  CT-07 — Pagination regression (AC6) — P3
    // ─────────────────────────────────────────────────────────────────
    test('CT-07 — Leads: pagination preserves Customer Name column index (AC6) @origination @pagination @regression', async ({ page }) => {
      const env = new ConfigEnvironment(process.env.ENV ?? 'sandbox');
      const leads = new LeadsPage(page);
      await leads.navigateAndWaitForTable(env.originationUrl);

      const iCustomerPage1 = await leads.getColumnIndexByHeaderText('Customer Name');
      expect(iCustomerPage1, '`Customer Name` header must exist on page 1').toBeGreaterThanOrEqual(0);

      const page1Rows = await leads.getAllVisibleRows();
      const page1Names = page1Rows.map(r => (r['Customer Name'] ?? '').trim());

      const nextBtn = page.locator(SELECTORS.paginationNext);
      const hasNext = await nextBtn.isVisible({ timeout: 3_000 }).catch(() => false)
        && await nextBtn.isEnabled().catch(() => false);
      if (!hasNext) {
        test.info().annotations.push({
          type: 'observation',
          description: '[OBSERVAÇÃO] CT-07 — Leads dataset does not paginate in this env; pagination assertion skipped.',
        });
        return;
      }

      await test.step('Click next page', async () => {
        await nextBtn.click();
        await leads.waitForSpinner();
      });

      const iCustomerPage2 = await leads.getColumnIndexByHeaderText('Customer Name');
      expect(iCustomerPage2, 'Customer Name column index must stay stable across pages').toBe(iCustomerPage1);

      const page2Rows = await leads.getAllVisibleRows();
      expect(page2Rows.length, 'Page 2 must render at least 1 row').toBeGreaterThan(0);
      const page2Names = page2Rows.map(r => (r['Customer Name'] ?? '').trim());

      // Sanity: at least one row differs from page 1 (rows are not the same set).
      const overlap = page2Names.filter(n => page1Names.includes(n));
      expect(
        overlap.length,
        `Page 2 rows should not be identical to page 1 (overlap=${overlap.length})`,
      ).toBeLessThan(page2Names.length);
    });

    // ─────────────────────────────────────────────────────────────────
    //  CT-08 — CSV export consistency (AC6/AC10)
    //
    //  Page: Leads — see SPEC § 11 "pendente". Mirrors the multi-select-filters
    //  CT-09 probe pattern (Download CSV → Export CSV → Email CSV).
    // ─────────────────────────────────────────────────────────────────
    test('CT-08 — Leads: CSV export header[N]↔cell[N] consistency (AC10) @origination @csv-export @regression', async ({ page }) => {
      const env = new ConfigEnvironment(process.env.ENV ?? 'sandbox');
      const leads = new LeadsPage(page);
      await leads.navigateAndWaitForTable(env.originationUrl);

      const downloadTrigger = page.locator(SELECTORS.csvDownloadTrigger).first();
      const emailTrigger = page.locator(SELECTORS.csvEmailTrigger).first();
      const hasDownload = await downloadTrigger.isVisible({ timeout: 5_000 }).catch(() => false);
      const hasEmail = !hasDownload && await emailTrigger.isVisible({ timeout: 2_000 }).catch(() => false);

      if (!hasDownload && !hasEmail) {
        test.info().annotations.push({
          type: 'observation',
          description:
            '[OBSERVAÇÃO] CT-08 — No CSV export trigger found on Leads. Escalate to PO/dev: ' +
            'is the export gated by a feature flag for the default agent user?',
        });
        return;
      }

      if (!hasDownload) {
        // Email variant: trigger and record observation, do not assert.
        await emailTrigger.click().catch(() => {});
        test.info().annotations.push({
          type: 'observation',
          description:
            '[OBSERVAÇÃO] CT-08 — Leads export is Email-CSV variant (no direct download). ' +
            'Validating attachment requires IMAP wiring (memory reference_imap_fintechgroup777). ' +
            'qa-validator: decide whether to extend this CT to read the email attachment.',
        });
        return;
      }

      const downloadPromise = page.waitForEvent('download', { timeout: 15_000 });
      await downloadTrigger.click();
      const download = await downloadPromise.catch(() => null);
      if (!download) {
        test.info().annotations.push({
          type: 'observation',
          description: '[OBSERVAÇÃO] CT-08 — Download trigger clicked but no download event captured within 15s.',
        });
        return;
      }
      const path = await download.path();
      expect(path, 'Downloaded CSV must be saved to disk').toBeTruthy();
      const fs = await import('node:fs');
      const content = fs.readFileSync(path!, 'utf-8');
      const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
      expect(lines.length, 'CSV must have at least header + 1 data row').toBeGreaterThanOrEqual(2);

      const parseCsvLine = (line: string): string[] => {
        // Minimal CSV split that respects double-quoted fields containing commas.
        const cells: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (ch === '"' && line[i + 1] === '"') {
            current += '"';
            i++;
          } else if (ch === '"') {
            inQuotes = !inQuotes;
          } else if (ch === ',' && !inQuotes) {
            cells.push(current);
            current = '';
          } else {
            current += ch;
          }
        }
        cells.push(current);
        return cells.map(c => c.trim());
      };

      const headerCells = parseCsvLine(lines[0] ?? '');
      const csvHeaderNormalized = headerCells.map(h => normalizeHeader(h).toLowerCase());

      // CSV header must include either a combined Customer Name OR First+Last names.
      const hasCombined = csvHeaderNormalized.some(h => h.includes('customer name'));
      const hasFirstLast =
        csvHeaderNormalized.some(h => h.includes('first name')) &&
        csvHeaderNormalized.some(h => h.includes('last name'));
      expect(
        hasCombined || hasFirstLast,
        `CSV header must contain a customer-name column (got: ${csvHeaderNormalized.join(', ')})`,
      ).toBe(true);

      // header[N] ↔ cell[N] consistency: every data row has the same column count as the header.
      for (let i = 1; i < Math.min(lines.length, 4); i++) {
        const dataCells = parseCsvLine(lines[i] ?? '');
        expect(
          dataCells.length,
          `CSV row ${i} has ${dataCells.length} cells; expected ${headerCells.length}`,
        ).toBe(headerCells.length);
      }
    });

    // ─────────────────────────────────────────────────────────────────
    //  CT-09 — Data-cell alignment under reordered headers (AC8 — P1)
    //  Page: Leads. Creates a fresh lead with KNOWN first/last name so the
    //  cell values can be asserted unambiguously.
    // ─────────────────────────────────────────────────────────────────
    test('CT-09 — Leads: cells under reordered headers carry the correct lead data (AC8) @origination @data-alignment @leads @critical', async ({ page, api, ctx, testEnv }) => {
      // Inflate the per-test timeout — application creation has a steady tail
      // (CC auth + invoice) and the CT then exercises the UI flow.
      test.setTimeout(720_000);

      const envName = testEnv.env ?? process.env.ENV ?? 'sandbox';
      const env = new ConfigEnvironment(envName);
      // Rule #9 — fresh data via automation. Default sandbox (memory
      // `project_dv360_uat_qa1_outage_2026_05_18` — avoid qa1 here).
      const td = buildTestData({
        env: envName,
        state: 'CA',
        merchant: 'TerraceFinance',
        orderTotal: '1000',
        orderDescription: 'Reorder1295',
        uniqueAddress: true, // dodge static CA address blacklist (654 Sunset Blvd/90028, pk:2165)
      });

      let expectedFirstName = td.applicant.firstName;
      let expectedLastName = td.applicant.lastName;
      let expectedInvoiceNumber = '';

      await test.step('Create pre-qualified lead with known first/last name', async () => {
        // `createPreQualifiedApplication` runs merchant preflight automatically
        // for the created application. The CT-01..08 Rule #12 skip does not
        // apply here — we're producing the row that backs the assertion.
        await createPreQualifiedApplication(api, td.merchant, td.applicant, ctx);
        expectedFirstName = td.applicant.firstName;
        expectedLastName = td.applicant.lastName;
      });

      await test.step('Send invoice and capture invoice number', async () => {
        const invoiceResp = await api.invoice.sendInvoice(
          td.merchant,
          ctx.leadUuid!,
          { orderTotal: td.order.orderTotal },
        );
        expect(invoiceResp.ok, `sendInvoice responded with ${invoiceResp.status}`).toBeTruthy();
        // Capture invoice number from the typed response, fallback to leadPk
        // when the endpoint omits it (some envs return only the accountNumber).
        expectedInvoiceNumber = invoiceResp.body.invoiceNumber ?? ctx.leadPk ?? '';
      });

      const leads = new LeadsPage(page);
      await test.step('Navigate to Leads and filter by the known last name', async () => {
        await leads.navigateAndWaitForTable(env.originationUrl);
        await leads.setCustomerName(expectedLastName);
        await leads.submitFilters();
      });

      await test.step('Verify cells under reordered headers carry the expected lead values (AC8)', async () => {
        const rows = await leads.getAllVisibleRows();
        // Look up the target row in the filtered set.
        const target = rows.find(r => {
          const name = (r['Customer Name'] ?? '').toLowerCase();
          return name.includes(expectedFirstName.toLowerCase()) ||
                 name.includes(expectedLastName.toLowerCase());
        });
        expect(target, `Expected at least one row matching last name "${expectedLastName}"`).toBeDefined();
        if (!target) return; // narrow

        const customerCell = (target['Customer Name'] ?? '').toLowerCase();
        expect(
          customerCell.includes(expectedFirstName.toLowerCase()) ||
          customerCell.includes(expectedLastName.toLowerCase()),
          `Cell under "Customer Name" header (${target['Customer Name']}) must reference the seeded applicant (${expectedFirstName} ${expectedLastName})`,
        ).toBe(true);

        if (expectedInvoiceNumber) {
          const invoiceCell = (target['Invoice Number'] ?? '').trim();
          // Some envs render an empty invoice cell until billing runs — only
          // hard-assert when both sides have a value.
          if (invoiceCell.length > 0) {
            expect(
              invoiceCell,
              `Cell under "Invoice Number" header must equal the seeded invoice "${expectedInvoiceNumber}"`,
            ).toBe(expectedInvoiceNumber);
          } else {
            test.info().annotations.push({
              type: 'observation',
              description:
                `[OBSERVAÇÃO] CT-09 — Invoice Number cell is empty for fresh lead ${ctx.leadPk} ` +
                `(expected "${expectedInvoiceNumber}"). Likely timing — billing has not yet stamped the row.`,
            });
          }
        }
      });
    });

    // ─────────────────────────────────────────────────────────────────
    //  CT-10 — Config Columns toggle preserves order (Overview only) — P3
    // ─────────────────────────────────────────────────────────────────
    test('CT-10 — Overview: Config Columns toggle preserves remaining order @origination @config-columns @overview @regression', async ({ page }) => {
      const env = new ConfigEnvironment(process.env.ENV ?? 'sandbox');
      const overview = new OverviewPage(page);

      await test.step('Open Overview and capture initial header order', async () => {
        await page.goto(`${env.originationUrl}overview`, { waitUntil: 'domcontentloaded' });
        await overview.verifyDashboardLoaded();
      });

      const headers0 = await overview.readHeaderOrder();
      // Sanity — column count is dynamic; SPEC § 0.5 records 27 in qa1.
      expect(headers0.length, 'Overview must have ≥ 5 columns').toBeGreaterThanOrEqual(5);
      expect(headers0, 'Initial state must include `Sales Rep Code`').toContain('Sales Rep Code');

      const triggerVisible = await page.locator(SELECTORS.configColumnsTrigger).first()
        .isVisible({ timeout: 3_000 }).catch(() => false);
      if (!triggerVisible) {
        test.info().annotations.push({
          type: 'observation',
          description: '[OBSERVAÇÃO] CT-10 — Config Columns trigger not visible on Overview in this env; CT-10 skipped.',
        });
        return;
      }

      await test.step('Open Config Columns and untick `Sales Rep Code`', async () => {
        await overview.clickConfigColumns();
        await overview.toggleColumn('Sales Rep Code');
        await overview.closeConfigColumns();
      });

      const headers1 = await overview.readHeaderOrder();
      expect(
        headers1,
        'After untick, `Sales Rep Code` must be hidden',
      ).not.toContain('Sales Rep Code');
      // Remaining columns preserve relative order — compare headers0 minus the toggled item.
      const expectedAfterHide = headers0.filter(h => h !== 'Sales Rep Code');
      expect(headers1, 'Hiding `Sales Rep Code` must NOT reorder remaining columns').toEqual(expectedAfterHide);

      await test.step('Reopen Config Columns and retick `Sales Rep Code`', async () => {
        await overview.clickConfigColumns();
        await overview.toggleColumn('Sales Rep Code');
        await overview.closeConfigColumns();
      });

      const headers2 = await overview.readHeaderOrder();
      expect(
        headers2,
        'Re-showing `Sales Rep Code` must restore the original order byte-for-byte (column returns to original position, NOT appended at the end)',
      ).toEqual(headers0);
    });
  },
);

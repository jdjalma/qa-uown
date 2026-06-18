/**
 * RU06.26.1.53.0_overviewLeadsCsvExportSizeLimit_1321
 *
 * Bug-fix verification (mitigation) for #1321 — pods restart on large Overview
 * CSV export (ERR_STRING_TOO_LONG). The fix is a CLIENT-SIDE size guard that
 * disables Download CSV above ~48 MiB and routes the user to Email CSV. The same
 * reusable component now drives both the Overview (/overview) and Leads (/leads)
 * screens.
 *
 * Strategy: hybrid, UI-first (rule #14). All decisive checks are UI affordances
 * (button enabled/disabled, directing tooltip, Email CSV modal, and — on the
 * happy path — OPENING the downloaded file and comparing filename + column set +
 * row count to the portal total). Activity log is explicitly N/A: these are
 * read-only export paths that mutate no business state (SPEC §Activity-log note).
 *
 * Coverage IMPLEMENTED as runnable E2E (QA2): CT-01..CT-07.
 * Coverage DOCUMENTED-only (data/env blockers, not run): CT-08 (>48 MiB disabled
 * guard — needs ~66k leads, absent on QA2), CT-09 (no-download-permission role —
 * no such account on QA2), and the ==48 MiB boundary (cannot be hit deterministically
 * on real data). See the `test.skip` blocks at the end for source-confirmed status.
 *
 * Scope decided by user; SPEC:
 *   docs/taskTestingUown/RU06.26.1.53.0_overviewLeadsCsvExportSizeLimit_1321/
 *     RU06.26.1.53.0_overviewLeadsCsvExportSizeLimit_1321-spec.md
 *
 * GitLab: #1321 (MR !1481, milestone RU06.26.1.53.0).
 * No merchant preflight (rule #12 — read-only over existing listing data).
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { OverviewPage, LeadsPage } from '@pages/origination/index.js';
import { SELECTORS } from '@selectors/common.selectors.js';
import { TestTag, buildTags } from '@ptypes/enums.js';
import { loginToPortal } from '@helpers/auth.helpers.js';
import { saveDownload, parseCsv, deleteDownloadedFile } from '@helpers/downloads.helpers.js';

// ── Constants ────────────────────────────────────────────────────────

const TEST_NAME = 'RU06.26.1.53.0_overviewLeadsCsvExportSizeLimit_1321';

const OVERVIEW_FILENAME = 'all-filtered-leads.csv';
const OVERVIEW_COLUMN_COUNT = 27;
const LEADS_FILENAME = 'leads-results.csv';
const LEADS_COLUMN_COUNT = 17;
// 17 Leads columns total. The 17th column ("Created from", header key `createdFrom`)
// is exported with a BLANK header label — DOM-confirmed QA2 2026-06-18: its react-csv
// header entry has `{name:"Created from", key:"createdFrom"}` but NO `label`, so the
// exported CSV writes an empty header cell for it (the data is present, the header is
// blank). [OBSERVAÇÃO — minor pre-existing column-config quirk, not introduced by #1321.]
// We therefore assert the 16 LABELED columns as a set + the total count (17).
const LEADS_LABELED_COLUMNS = [
  'Lead Number', 'Account Number', 'Lead Status', 'Internal Status', 'State',
  'Term Month', 'Customer Name', 'Invoice Number', 'SSN', 'Phone Number',
  'Email', 'Merchant', 'Location', 'Ref Merchant Code', 'Client Type',
  'Created at',
];

const EMPTY_STATE_TEXT = 'There are no records to display';
// Impossible Lead PK → deterministic empty Leads result set.
const IMPOSSIBLE_LEAD_PK = '999999999';
// A wide From date guarantees a non-empty within-limit set on QA2
// (~44 leads/day ⇒ ~0.03 MB, trivially < 48 MiB).
const WIDE_FROM_DATE = '01/01/2022';
// Non-matching value for the Overview TABLE-panel free-text search ("Search table")
// → deterministic empty Overview set. DOM-confirmed QA2 2026-06-18 (0 rows + empty-state
// text + both export buttons disabled). Preferred over a future date window: the
// table-panel `#fromDate` resets to today (Formik default), so future-only dates are
// unreliable for emptying the Overview table.
const IMPOSSIBLE_SEARCH = 'ZZZNONEXISTENT999';

// ── Test data ────────────────────────────────────────────────────────

const testData = [
  {
    env: 'qa2',
    // The literal `@origination` is REQUIRED so the task-testing-origination
    // PW project (grep /@origination/) picks this spec up. `@origination` is
    // not a TestTag enum member — it is concatenated as a string (same pattern
    // as task #1309).
    tag: `${buildTags(TestTag.REGRESSION, TestTag.QA2)} @origination`,
  },
];

// ── Suite ────────────────────────────────────────────────────────────

for (const data of testData) {
  test.describe(`${TEST_NAME} - ${data.env}`, { tag: data.tag.split(' ') }, () => {
    test.use({ envName: data.env });

    // QA2 internal portal — single desktop viewport (rule #15: 1440×900).
    test.use({ viewport: { width: 1440, height: 900 } });

    // ════════════════════════════════════════════════════════════════
    //  CT-01 — [P0, SMOKE] Download CSV enabled & correct below limit (Overview)
    // ════════════════════════════════════════════════════════════════
    test('CT-01: Overview — Download CSV enabled below limit; file = all-filtered-leads.csv with 27 columns and row count == portal total @smoke', async ({ page, testEnv }, testInfo) => {
      test.setTimeout(120_000);
      const overview = new OverviewPage(page);
      let savedPath: string | null = null;

      await test.step('Login to Origination (admin = confirmed QA2 account)', async () => {
        await loginToPortal(page, testEnv.originationUrl, testEnv, 'admin');
      });

      await test.step('Navigate to Overview with a non-empty within-limit set', async () => {
        await overview.navigateToOverview();
        await overview.verifyDashboardLoaded();
        await expect(page.locator(SELECTORS.tableRow).first(), 'Overview must have a non-empty result set').toBeVisible({ timeout: 30_000 });
      });

      await test.step('Download CSV is enabled and shows no directing tooltip', async () => {
        expect(await overview.isDownloadCsvVisible(), 'Download CSV must render (hasDownloadPermission && headers>0)').toBe(true);
        expect(await overview.isDownloadCsvEnabled(), 'Download CSV must be enabled below the size limit').toBe(true);
        await overview.hoverDownloadCsv();
        expect(await overview.getDownloadDisabledTooltip(), 'No directing tooltip below the limit').toBeNull();
      });

      await test.step('Trigger Download CSV and open the file: filename + 27 columns + row count == portal total [check-points]', async () => {
        const portalTotal = await overview.getTotalRowCount();
        const download = await overview.downloadCsv();
        expect(download.suggestedFilename(), `Expected ${OVERVIEW_FILENAME}`).toBe(OVERVIEW_FILENAME);

        savedPath = await saveDownload(download);
        const fs = await import('fs');
        const parsed = parseCsv(fs.readFileSync(savedPath, 'utf-8'));
        expect(parsed.headers.length, `Overview CSV must have ${OVERVIEW_COLUMN_COUNT} columns`).toBe(OVERVIEW_COLUMN_COUNT);

        if (portalTotal !== null) {
          expect(parsed.dataRowCount, `CSV data rows must equal portal total (${portalTotal})`).toBe(portalTotal);
          console.log(`[CT-01] Overview CSV: ${parsed.headers.length} cols, ${parsed.dataRowCount} rows == portal total ${portalTotal}`);
        } else {
          expect(parsed.dataRowCount, 'CSV must contain at least one data row').toBeGreaterThan(0);
          console.log(`[CT-01] Overview CSV: ${parsed.headers.length} cols, ${parsed.dataRowCount} rows (pagination total unavailable)`);
        }

        await testInfo.attach('CT-01-overview-download-enabled', { body: await page.screenshot(), contentType: 'image/png' });
      });

      // Cleanup (uniform PII hygiene).
      deleteDownloadedFile(savedPath);
    });

    // ════════════════════════════════════════════════════════════════
    //  CT-02 — [P0] Download CSV enabled & correct below limit (Leads)
    // ════════════════════════════════════════════════════════════════
    test('CT-02: Leads — Download CSV enabled below limit; file = leads-results.csv with 17 columns (incl. SSN); artifact deleted after download', async ({ page, testEnv }, testInfo) => {
      test.setTimeout(120_000);
      const leads = new LeadsPage(page);
      let savedPath: string | null = null;

      await test.step('Login to Origination', async () => {
        await loginToPortal(page, testEnv.originationUrl, testEnv, 'admin');
      });

      await test.step('Navigate to Leads with a wide within-limit From date → non-empty set', async () => {
        await leads.navigateAndWaitForTable(testEnv.originationUrl);
        await leads.setFromDate(WIDE_FROM_DATE);
        await leads.submitFilters();
        await expect(page.locator(SELECTORS.tableRow).first(), 'Leads must have a non-empty result set').toBeVisible({ timeout: 30_000 });
      });

      await test.step('Download CSV is enabled, no tooltip', async () => {
        expect(await leads.isDownloadCsvVisible(), 'Download CSV must render on Leads').toBe(true);
        expect(await leads.isDownloadCsvEnabled(), 'Download CSV must be enabled below the limit').toBe(true);
        await leads.hoverDownloadCsv();
        expect(await leads.getDownloadDisabledTooltip(), 'No directing tooltip below the limit').toBeNull();
      });

      await test.step('Trigger Download CSV; assert filename + 17 columns + row count; then DELETE the SSN-bearing artifact [reflex/PII]', async () => {
        const portalTotal = await leads.getTotalRowCount();
        const download = await leads.downloadCsv();
        expect(download.suggestedFilename(), `Expected ${LEADS_FILENAME}`).toBe(LEADS_FILENAME);

        savedPath = await saveDownload(download);
        const fs = await import('fs');
        const parsed = parseCsv(fs.readFileSync(savedPath, 'utf-8'));
        expect(parsed.headers.length, `Leads CSV must have ${LEADS_COLUMN_COUNT} columns`).toBe(LEADS_COLUMN_COUNT);
        // Assert the 16 LABELED columns as a set (never log row content — SSN is PII).
        // The 17th column ("Created from"/createdFrom) exports under a BLANK header — see
        // the LEADS_LABELED_COLUMNS note; we assert its presence via the total count above.
        for (const col of LEADS_LABELED_COLUMNS) {
          expect(parsed.headers, `Leads CSV must include column "${col}"`).toContain(col);
        }
        if (portalTotal !== null) {
          expect(parsed.dataRowCount, `CSV data rows must equal portal total (${portalTotal})`).toBe(portalTotal);
        } else {
          expect(parsed.dataRowCount, 'CSV must contain at least one data row').toBeGreaterThan(0);
        }
        console.log(`[CT-02] Leads CSV: ${parsed.headers.length} cols, ${parsed.dataRowCount} rows (SSN column present: ${parsed.headers.includes('SSN')})`);

        await testInfo.attach('CT-02-leads-download-enabled', { body: await page.screenshot(), contentType: 'image/png' });
      });

      // MANDATORY: the Leads CSV carries SSN — remove the artifact from disk.
      deleteDownloadedFile(savedPath);
    });

    // ════════════════════════════════════════════════════════════════
    //  CT-03 — [P1] Empty result set disables both export options (Overview)
    // ════════════════════════════════════════════════════════════════
    test('CT-03: Overview — empty result set disables BOTH Download CSV and Email CSV', async ({ page, testEnv }, testInfo) => {
      test.setTimeout(120_000);
      const overview = new OverviewPage(page);

      await test.step('Login to Origination', async () => {
        await loginToPortal(page, testEnv.originationUrl, testEnv, 'admin');
      });

      await test.step('Apply a non-matching table search → empty set', async () => {
        await overview.navigateToOverview();
        await overview.verifyDashboardLoaded();
        await overview.searchTable(IMPOSSIBLE_SEARCH);
        await overview.submitFilters();
        await expect(page.getByText(EMPTY_STATE_TEXT).first(), 'Overview must show the empty state').toBeVisible({ timeout: 15_000 });
      });

      await test.step('Both export controls are disabled', async () => {
        expect(await overview.isDownloadCsvEnabled(), 'Download CSV must be disabled on empty set').toBe(false);
        expect(await overview.isEmailCsvEnabled(), 'Email CSV must be disabled on empty set').toBe(false);
        await testInfo.attach('CT-03-overview-empty-both-disabled', { body: await page.screenshot(), contentType: 'image/png' });
      });
    });

    // ════════════════════════════════════════════════════════════════
    //  CT-04 — [P1] Empty result set disables both export options (Leads)
    // ════════════════════════════════════════════════════════════════
    test('CT-04: Leads — empty result set disables BOTH Download CSV and Email CSV', async ({ page, testEnv }, testInfo) => {
      test.setTimeout(120_000);
      const leads = new LeadsPage(page);

      await test.step('Login to Origination', async () => {
        await loginToPortal(page, testEnv.originationUrl, testEnv, 'admin');
      });

      await test.step('Filter by an impossible Lead PK → empty set', async () => {
        await leads.navigateAndWaitForTable(testEnv.originationUrl);
        await leads.setFromDate(WIDE_FROM_DATE);
        await leads.setLeadPk(IMPOSSIBLE_LEAD_PK);
        await leads.submitFilters();
        await expect(page.getByText(EMPTY_STATE_TEXT).first(), 'Leads must show the empty state').toBeVisible({ timeout: 15_000 });
      });

      await test.step('Both export controls are disabled', async () => {
        expect(await leads.isDownloadCsvEnabled(), 'Download CSV must be disabled on empty set').toBe(false);
        expect(await leads.isEmailCsvEnabled(), 'Email CSV must be disabled on empty set').toBe(false);
        await testInfo.attach('CT-04-leads-empty-both-disabled', { body: await page.screenshot(), contentType: 'image/png' });
      });
    });

    // ════════════════════════════════════════════════════════════════
    //  CT-05 — [P1] Empty set shows NO directing tooltip (negative control for AC-03)
    // ════════════════════════════════════════════════════════════════
    test('CT-05: Overview — empty (size-OK) set disables Download CSV with NO "too large" tooltip (distinguishes empty-disable from size-disable)', async ({ page, testEnv }, testInfo) => {
      test.setTimeout(120_000);
      const overview = new OverviewPage(page);

      await test.step('Login to Origination', async () => {
        await loginToPortal(page, testEnv.originationUrl, testEnv, 'admin');
      });

      await test.step('Reach the Overview empty set (non-matching table search)', async () => {
        await overview.navigateToOverview();
        await overview.verifyDashboardLoaded();
        await overview.searchTable(IMPOSSIBLE_SEARCH);
        await overview.submitFilters();
        await expect(page.getByText(EMPTY_STATE_TEXT).first()).toBeVisible({ timeout: 15_000 });
      });

      await test.step('Hover the disabled Download CSV — NO directing tooltip (tooltip renders only in the size case)', async () => {
        expect(await overview.isDownloadCsvEnabled(), 'Download CSV must be disabled (empty)').toBe(false);
        await overview.hoverDownloadCsv();
        const tooltip = await overview.getDownloadDisabledTooltip();
        expect(tooltip, 'Empty-table case must show NO "too large" directing tooltip').toBeNull();
        await testInfo.attach('CT-05-overview-empty-no-tooltip', { body: await page.screenshot(), contentType: 'image/png' });
      });
    });

    // ════════════════════════════════════════════════════════════════
    //  CT-06 — [P0, SMOKE] Email CSV available & modal opens (escape hatch)
    //  Modal-ONLY: fill address to check Send enables, then CANCEL (no real send).
    // ════════════════════════════════════════════════════════════════
    test('CT-06: Overview — Email CSV available; modal opens, Send gated by address; CANCEL closes (NO email sent) @smoke', async ({ page, testEnv }, testInfo) => {
      test.setTimeout(120_000);
      const overview = new OverviewPage(page);

      await test.step('Login to Origination', async () => {
        await loginToPortal(page, testEnv.originationUrl, testEnv, 'admin');
      });

      await test.step('Navigate to Overview with a non-empty set', async () => {
        await overview.navigateToOverview();
        await overview.verifyDashboardLoaded();
        await expect(page.locator(SELECTORS.tableRow).first()).toBeVisible({ timeout: 30_000 });
      });

      await test.step('Email CSV is rendered and enabled (independent of download permission and size guard)', async () => {
        expect(await overview.isEmailCsvVisible(), 'Email CSV must always render').toBe(true);
        expect(await overview.isEmailCsvEnabled(), 'Email CSV must be enabled for a non-empty set').toBe(true);
      });

      await test.step('Open modal: title correct; Send disabled until address entered; then enabled (EP)', async () => {
        await overview.openEmailCsvModal();
        expect(await overview.emailCsvModalTitle(), 'Modal title').toBe('Which email should we send this CSV file to?');
        expect(await overview.isEmailCsvSendEnabled(), 'Send disabled with empty address').toBe(false);
        await overview.fillEmailCsvAddress(testEnv.uniqueEmailAlias);
        expect(await overview.isEmailCsvSendEnabled(), 'Send enabled once address entered').toBe(true);
        await testInfo.attach('CT-06-overview-email-modal', { body: await page.screenshot(), contentType: 'image/png' });
      });

      await test.step('CANCEL closes the modal — NO email is sent (side effect OUT of scope)', async () => {
        await overview.cancelEmailCsvModal();
        await expect(page.locator(SELECTORS.csvEmailModal).first(), 'Modal must close on CANCEL').toBeHidden({ timeout: 5_000 });
      });
    });

    // ════════════════════════════════════════════════════════════════
    //  CT-07 — [P1] Filter change re-evaluates availability (Leads)
    //  enabled (non-empty) → disabled (empty) → enabled (non-empty again)
    // ════════════════════════════════════════════════════════════════
    test('CT-07: Leads — availability re-evaluated on filter change (enabled → empty-disabled → enabled)', async ({ page, testEnv }, testInfo) => {
      test.setTimeout(150_000);
      const leads = new LeadsPage(page);

      await test.step('Login to Origination', async () => {
        await loginToPortal(page, testEnv.originationUrl, testEnv, 'admin');
      });

      await test.step('Non-empty set → Download CSV enabled', async () => {
        await leads.navigateAndWaitForTable(testEnv.originationUrl);
        await leads.setFromDate(WIDE_FROM_DATE);
        await leads.submitFilters();
        await expect(page.locator(SELECTORS.tableRow).first()).toBeVisible({ timeout: 30_000 });
        expect(await leads.isDownloadCsvEnabled(), 'enabled for non-empty set').toBe(true);
        await testInfo.attach('CT-07-leads-enabled', { body: await page.screenshot(), contentType: 'image/png' });
      });

      await test.step('Narrow to an impossible Lead PK → empty → Download CSV disabled', async () => {
        await leads.setLeadPk(IMPOSSIBLE_LEAD_PK);
        await leads.submitFilters();
        await expect(page.getByText(EMPTY_STATE_TEXT).first()).toBeVisible({ timeout: 15_000 });
        expect(await leads.isDownloadCsvEnabled(), 'disabled for empty set').toBe(false);
      });

      await test.step('Clear the Lead PK → non-empty again → Download CSV re-enabled', async () => {
        await leads.setLeadPk('');
        await leads.submitFilters();
        await expect(page.locator(SELECTORS.tableRow).first()).toBeVisible({ timeout: 30_000 });
        expect(await leads.isDownloadCsvEnabled(), 're-enabled after widening back to non-empty').toBe(true);
        await testInfo.attach('CT-07-leads-re-enabled', { body: await page.screenshot(), contentType: 'image/png' });
      });
    });

    // ════════════════════════════════════════════════════════════════
    //  CT-08 — [P0 by importance / EXECUTION-BLOCKED on QA2]
    //  Disabled Download CSV + directing tooltip/error toast (the fix itself).
    //  STATUS: source-confirmed (bundle constant 50331648, `<=` comparison, exact
    //  tooltip string, error-toast path) — see KB. UI render needs ~66k leads in
    //  one filtered set; QA2 holds ~44 leads/day, so it CANNOT be reproduced here.
    //  NOT run; documented only. Do NOT mark green on QA2 (rule #10/#16).
    // ════════════════════════════════════════════════════════════════
    test.skip('CT-08: >48 MiB → Download CSV disabled + "too large" tooltip + error toast on click (Overview/Leads)', async () => {
      // Blocked on QA2 by data volume (~66k leads needed). Source-confirmed in
      // docs/knowledge-base/overview-leads-csv-export-size-limit.md. Run on a
      // high-volume/seeded env when available (SPEC Q2). The == 48 MiB boundary
      // (enabled, inclusive) is likewise source-confirmed only (SPEC Q4) — cannot
      // be hit deterministically on real data.
    });

    // ════════════════════════════════════════════════════════════════
    //  CT-09 — [P1, CONDITIONAL] No-download-permission role (Overview)
    //  STATUS: requires a QA2 account WITHOUT CSV download permission (SPEC Q-role).
    //  No such account exists on QA2 → NOT run; source-confirmed only.
    // ════════════════════════════════════════════════════════════════
    test.skip('CT-09: no-download-permission role — Download CSV NOT rendered; Email CSV still rendered', async () => {
      // Gate: Download CSV renders only when `hasDownloadPermission && headers>0`;
      // Email CSV renders regardless. No no-download-permission account exists on
      // QA2 (SPEC Q-role) — confirmed at source (live React prop hasDownloadPermission).
    });
  });
}

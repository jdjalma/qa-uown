/**
 * Task #1253 — Add Invoice Number Column and Search Filter to Leads Page
 * Milestone: RU04.26.1.51.0
 *
 * Validates the new "Invoice Number" column and filter on the Origination Leads page.
 *
 * Feature changes (R1.51.0):
 *   - New column "Invoice Number" in Leads table, positioned after "Term Month"
 *   - New filter field "Invoice Number" in the filter panel
 *   - Backend: POST /uown/los/getLeadsByCriteria now accepts invoiceNumber param
 *   - Data source: uown_los_invoice.merchant_invoice_number via LEFT JOIN
 *
 * No applications created — tests use existing DB data.
 * DB queries run in beforeAll to find real leads with/without invoices.
 *
 * Run: npx playwright test tests/taskTestingUown/RU04.26.1.51.0_addInvoiceNumberColumnAndSearchFilterToLeadsPage_1253/ --project=task-testing --reporter=list
 */
import { test, expect } from '@support/base-test.js';
import { LeadsPage } from '@pages/origination/index.js';
import { loginToPortalWithOptions } from '@helpers/auth.helpers.js';
import { calculateDate } from '@helpers/index.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';

/**
 * BUG-01 message — appended to assertion messages in CT-01/02/03/05 to clarify root cause.
 *
 * Root cause: The sv_sql_config table in qa2 has a SQL for getLeadsByCriteria that uses
 * the OLD parameter names :fromDate/:toDate, but the R1.51.0 SearchService now passes
 * :fromTime/:toTime (Timestamps, not LocalDate). Spring NamedParameterJdbcTemplate throws:
 *   InvalidDataAccessApiUsageException: No value supplied for the SQL parameter 'fromDate'
 * All Leads page searches return HTTP 500 and the table renders "no records".
 *
 * Fix required: Update sv_sql_config.sql_query for "getLeadsByCriteria" in qa2 to match
 * the R1.51.0 getLeadsByCriteria.sql file (uses :fromTime/:toTime + LEFT JOIN invoice +
 * :invoiceNumber filter). SQL file: svc/src/main/resources/sqls/getLeadsByCriteria.sql
 */
const BUG_01 =
  ' ⚠ [BUG-01] Backend HTTP 500: InvalidDataAccessApiUsageException "No value supplied ' +
  'for SQL parameter \'fromDate\'" on POST /uown/los/getLeadsByCriteria. ' +
  'sv_sql_config in qa2 uses old param names :fromDate/:toDate but R1.51.0 SearchService ' +
  'passes :fromTime/:toTime. Fix: update sv_sql_config row "getLeadsByCriteria" to match ' +
  'svc/src/main/resources/sqls/getLeadsByCriteria.sql (R1.51.0).';

const SCREENSHOT_DIR = 'tests/taskTestingUown/RU04.26.1.51.0_addInvoiceNumberColumnAndSearchFilterToLeadsPage_1253/screenshots';
const TEST_NAME = 'RU04.26.1.51.0_addInvoiceNumberColumnAndSearchFilterToLeadsPage_1253';

const testData = [
  {
    env: 'qa2' as const,
    // No application created — using existing DB data (no runId/email needed)
    tag: buildTags(TestTag.QA2, TestTag.REGRESSION),
  },
];

for (const td of testData) {
  test.describe(`${TEST_NAME} - ${td.env}`, {
    tag: splitTags(td.tag),
  }, () => {
    test.use({ envName: td.env });

    // Shared test data discovered at runtime from DB
    let leadPkWithInvoice = '';
    let expectedInvoiceNumber = '';
    let leadPkWithoutInvoice = '';

    test.beforeAll(async ({ db }) => {
      // Find a lead WITH a merchant_invoice_number.
      // Wrapped in try/catch — DB tunnel may not be active; CT-01/CT-04/CT-06 must still run.
      try {
        const withInvoice = await db.queryOne<{ lead_pk: string; invoice_number: string }>(`
          SELECT lead.pk::text AS lead_pk,
                 invoice.merchant_invoice_number AS invoice_number
          FROM uown_los_lead lead
          JOIN uown_los_invoice invoice ON invoice.lead_pk = lead.pk
          WHERE invoice.merchant_invoice_number IS NOT NULL
            AND invoice.merchant_invoice_number <> ''
          ORDER BY lead.row_created_timestamp DESC
          LIMIT 1
        `);
        if (withInvoice) {
          leadPkWithInvoice = withInvoice.lead_pk;
          expectedInvoiceNumber = withInvoice.invoice_number;
        }

        // Find a lead WITHOUT any invoice record
        const withoutInvoice = await db.queryOne<{ lead_pk: string }>(`
          SELECT lead.pk::text AS lead_pk
          FROM uown_los_lead lead
          LEFT JOIN uown_los_invoice invoice ON invoice.lead_pk = lead.pk
          WHERE invoice.pk IS NULL
          ORDER BY lead.row_created_timestamp DESC
          LIMIT 1
        `);
        if (withoutInvoice) {
          leadPkWithoutInvoice = withoutInvoice.lead_pk;
        }

        console.log(`[beforeAll] leadPkWithInvoice=${leadPkWithInvoice} invoiceNumber="${expectedInvoiceNumber}" leadPkWithoutInvoice=${leadPkWithoutInvoice}`);
      } catch (err) {
        console.warn(`[beforeAll] DB unavailable — CT-02/CT-03/CT-05 will be skipped: ${(err as Error).message}`);
      }
    });

    // ================================================================
    //  CT-01 — Column "Invoice Number" exists after "Term Month"
    // ================================================================
    test('CT-01: Column "Invoice Number" exists in Leads table after "Term Month"', async ({ page, testEnv }) => {
      test.setTimeout(120_000);

      await test.step('Login to Origination portal', async () => {
        await loginToPortalWithOptions(page, testEnv.originationUrl, testEnv);
      });

      const leads = new LeadsPage(page);

      await test.step('Navigate to Leads page and submit search to render table', async () => {
        await leads.navigateAndWaitForTable();
        // Table headers are only rendered after a search is submitted
        // allowPast=true required — calculateDate with negative value returns today otherwise
        await leads.setFromDate(calculateDate(-1825, true));
        await leads.submitFilters();
      });

      let headers: string[] = [];
      await test.step('Get clean table headers (sort indicators stripped)', async () => {
        headers = await leads.getCleanHeaders();
        expect(headers.length, `Table should have at least one header.${BUG_01}`).toBeGreaterThan(0);
      });

      await test.step('Verify "Invoice Number" column exists in headers', async () => {
        expect(
          headers,
          `Headers should contain "Invoice Number". Got: ${JSON.stringify(headers)}`,
        ).toContain('Invoice Number');
      });

      await test.step('Verify "Invoice Number" is positioned immediately after "Term Month"', async () => {
        const termMonthIdx = headers.indexOf('Term Month');
        const invoiceNumberIdx = headers.indexOf('Invoice Number');
        expect(termMonthIdx, '"Term Month" column should exist in headers').toBeGreaterThan(-1);
        expect(invoiceNumberIdx, '"Invoice Number" column should exist in headers').toBeGreaterThan(-1);
        expect(
          invoiceNumberIdx,
          `"Invoice Number" (idx=${invoiceNumberIdx}) should be immediately after "Term Month" (idx=${termMonthIdx})`,
        ).toBe(termMonthIdx + 1);
      });

      await test.step(`Screenshot — CT-01 column headers confirmed`, async () => {
        await page.screenshot({ path: `${SCREENSHOT_DIR}/${TEST_NAME}-01-column-headers.png`, fullPage: false });
      });
    });

    // ================================================================
    //  CT-02 — Lead WITH invoice shows correct value
    // ================================================================
    test('CT-02: Lead with Invoice Number displays correct value in column', async ({ page, testEnv }) => {
      test.setTimeout(120_000);

      if (!leadPkWithInvoice) {
        test.skip(true, 'No lead with invoice number found in DB — skipping CT-02');
        return;
      }

      await test.step('Login to Origination portal', async () => {
        await loginToPortalWithOptions(page, testEnv.originationUrl, testEnv);
      });

      const leads = new LeadsPage(page);

      await test.step('Navigate to Leads page and wait for table', async () => {
        await leads.navigateAndWaitForTable();
      });

      await test.step(`Filter by Lead PK ${leadPkWithInvoice}`, async () => {
        await leads.setFromDate(calculateDate(-1825, true)); // wide range — lead may be months old; allowPast=true required
        await leads.setLeadPk(leadPkWithInvoice);
        await leads.submitFilters();
      });

      let row: Record<string, string> | null = null;
      await test.step('Find the target lead row in results', async () => {
        row = await leads.findRowByLeadPk(leadPkWithInvoice);
        expect(row, `Row for Lead PK ${leadPkWithInvoice} should be found in table.${BUG_01}`).not.toBeNull();
      });

      await test.step(`Verify Invoice Number column = "${expectedInvoiceNumber}"`, async () => {
        const displayed = row!['Invoice Number'] ?? '';
        expect(
          displayed,
          `Invoice Number column should display "${expectedInvoiceNumber}". Got: "${displayed}"`,
        ).toBe(expectedInvoiceNumber);
      });

      await test.step('Screenshot — CT-02 lead with invoice number', async () => {
        await page.screenshot({ path: `${SCREENSHOT_DIR}/${TEST_NAME}-02-lead-with-invoice.png`, fullPage: false });
      });
    });

    // ================================================================
    //  CT-03 — Lead WITHOUT invoice shows empty column
    // ================================================================
    test('CT-03: Lead without Invoice Number shows empty column', async ({ page, testEnv }) => {
      test.setTimeout(120_000);

      if (!leadPkWithoutInvoice) {
        test.skip(true, 'No lead without invoice found in DB — skipping CT-03');
        return;
      }

      await test.step('Login to Origination portal', async () => {
        await loginToPortalWithOptions(page, testEnv.originationUrl, testEnv);
      });

      const leads = new LeadsPage(page);

      await test.step('Navigate to Leads page and wait for table', async () => {
        await leads.navigateAndWaitForTable();
      });

      await test.step(`Filter by Lead PK ${leadPkWithoutInvoice}`, async () => {
        await leads.setFromDate(calculateDate(-1825, true)); // wide range — lead may be months old; allowPast=true required
        await leads.setLeadPk(leadPkWithoutInvoice);
        await leads.submitFilters();
      });

      let row: Record<string, string> | null = null;
      await test.step('Find the target lead row in results', async () => {
        row = await leads.findRowByLeadPk(leadPkWithoutInvoice);
        expect(row, `Row for Lead PK ${leadPkWithoutInvoice} should be found in table.${BUG_01}`).not.toBeNull();
      });

      await test.step('Verify Invoice Number column is empty', async () => {
        const displayed = row!['Invoice Number'] ?? '';
        expect(
          displayed,
          `Invoice Number column should be empty for a lead without invoice. Got: "${displayed}"`,
        ).toBe('');
      });

      await test.step('Screenshot — CT-03 lead without invoice (empty column)', async () => {
        await page.screenshot({ path: `${SCREENSHOT_DIR}/${TEST_NAME}-03-lead-without-invoice.png`, fullPage: false });
      });
    });

    // ================================================================
    //  CT-04 — Filter field "Invoice Number" exists in filter panel
    // ================================================================
    test('CT-04: Filter panel contains "Invoice Number" input field', async ({ page, testEnv }) => {
      test.setTimeout(120_000);

      await test.step('Login to Origination portal', async () => {
        await loginToPortalWithOptions(page, testEnv.originationUrl, testEnv);
      });

      const leads = new LeadsPage(page);

      await test.step('Navigate to Leads page', async () => {
        await leads.navigateAndWaitForTable();
      });

      await test.step('Expand filter panel', async () => {
        await leads.expandFilters();
      });

      await test.step('Verify "Invoice Number" input field is visible in filter panel', async () => {
        const invoiceInput = page.getByPlaceholder('Search by Invoice Number');
        await invoiceInput.waitFor({ state: 'visible', timeout: 5_000 });
        const isVisible = await invoiceInput.isVisible();
        expect(isVisible, 'Invoice Number filter input should be visible in filter panel').toBeTruthy();
      });

      await test.step('Screenshot — CT-04 filter panel with Invoice Number field', async () => {
        await page.screenshot({ path: `${SCREENSHOT_DIR}/${TEST_NAME}-04-filter-panel.png`, fullPage: false });
      });
    });

    // ================================================================
    //  CT-05 — Filter by Invoice Number returns matching leads
    // ================================================================
    test('CT-05: Filter by Invoice Number returns matching leads', async ({ page, testEnv }) => {
      test.setTimeout(120_000);

      if (!expectedInvoiceNumber) {
        test.skip(true, 'No invoice number found in DB — skipping CT-05');
        return;
      }

      await test.step('Login to Origination portal', async () => {
        await loginToPortalWithOptions(page, testEnv.originationUrl, testEnv);
      });

      const leads = new LeadsPage(page);

      await test.step('Navigate to Leads page', async () => {
        await leads.navigateAndWaitForTable();
      });

      await test.step(`Fill Invoice Number filter with "${expectedInvoiceNumber}"`, async () => {
        await leads.setFromDate(calculateDate(-1825, true)); // 5-year range; allowPast=true required
        await leads.setInvoiceNumber(expectedInvoiceNumber);
        await leads.submitFilters();
      });

      let rows: Record<string, string>[] = [];
      await test.step('Verify at least one row is returned', async () => {
        rows = await leads.getAllVisibleRows();
        expect(rows.length, `At least one row should be returned when filtering by a known invoice number.${BUG_01}`).toBeGreaterThan(0);
      });

      await test.step('Verify all returned rows have the expected invoice number', async () => {
        for (const row of rows) {
          const displayed = row['Invoice Number'] ?? '';
          expect(
            displayed,
            `All rows must show the filtered invoice number "${expectedInvoiceNumber}". Got: "${displayed}"`,
          ).toBe(expectedInvoiceNumber);
        }
      });

      await test.step('Screenshot — CT-05 filter results by invoice number', async () => {
        await page.screenshot({ path: `${SCREENSHOT_DIR}/${TEST_NAME}-05-filter-by-invoice.png`, fullPage: false });
      });
    });

    // ================================================================
    //  CT-06 — Filter by non-existent Invoice Number → "no records"
    // ================================================================
    test('CT-06: Filter by non-existent Invoice Number shows "no records"', async ({ page, testEnv }) => {
      test.setTimeout(120_000);

      await test.step('Login to Origination portal', async () => {
        await loginToPortalWithOptions(page, testEnv.originationUrl, testEnv);
      });

      const leads = new LeadsPage(page);

      await test.step('Navigate to Leads page', async () => {
        await leads.navigateAndWaitForTable();
      });

      await test.step('Fill Invoice Number filter with a non-existent value', async () => {
        await leads.setFromDate(calculateDate(-1825, true));
        await leads.setInvoiceNumber('INVALID-INV-QA-99999');
        await leads.submitFilters();
      });

      await test.step('Verify "There are no records to display" message appears', async () => {
        const noRecordsMsg = page.locator('text=There are no records to display');
        await noRecordsMsg.waitFor({ state: 'visible', timeout: 10_000 });
        expect(await noRecordsMsg.isVisible()).toBeTruthy();
      });

      await test.step('Screenshot — CT-06 no records for invalid invoice', async () => {
        await page.screenshot({ path: `${SCREENSHOT_DIR}/${TEST_NAME}-06-no-records-invalid-invoice.png`, fullPage: false });
      });
    });
  });
}

/**
 * S5 PROBE — Frequency Changes History render (qa1, account 4452).
 * DOM-first (rule #15): the main S5 spec saw History > Frequency Changes render 0 rows
 * despite uown_frequency_mods holding 7 rows. Inspect the real URL, the API response,
 * and the rendered DOM to classify (real UI bug vs navigation artifact).
 */
import { test } from '@support/base-test.js';
import { ServicingAccountSummaryPage } from '@pages/servicing/index.js';

const ACCOUNT_PK = '4452';

test('Frequency Changes history — capture URL, API status, rendered rows', async ({ page, testEnv }) => {
  test.setTimeout(120_000);
  const summary = new ServicingAccountSummaryPage(page);

  const apiCalls: Array<{ url: string; status: number; bodyLen: number }> = [];
  page.on('response', async (r) => {
    if (/frequency/i.test(r.url())) {
      const body = await r.text().catch(() => '');
      apiCalls.push({ url: r.url(), status: r.status(), bodyLen: body.length });
      console.log(`[PROBE.API] ${r.request().method()} ${r.url()} -> ${r.status()} bodyLen=${body.length} body=${body.slice(0, 300)}`);
    }
  });

  await summary.navigateToCustomerInformation(testEnv.servicingUrl, ACCOUNT_PK);

  await test.step('Direct-navigate to the frequency-history route', async () => {
    // The page-object waits for **/frequency-history/** — try the direct URL to bypass
    // the History dropdown menu interaction entirely.
    await page.goto(`${testEnv.servicingUrl}/frequency-history/${ACCOUNT_PK}`, { waitUntil: 'domcontentloaded' });
    // Wait for either the data table or a no-records message to settle (no fixed sleep).
    await page.locator('.rdt_Table, [role="table"], table, div:has-text("no records")').first()
      .waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});
    await page.locator('.rdt_TableRow, [role="row"]').first()
      .waitFor({ state: 'visible', timeout: 8_000 }).catch(() => {});
    console.log(`[PROBE.URL] landed on=${page.url()}`);
  });

  await test.step('Capture table headers + rows + no-data message', async () => {
    const dom = await page.evaluate(() => {
      const tbl = document.querySelector('.rdt_Table, [role="table"], table');
      const headers = Array.from(document.querySelectorAll('.rdt_TableCol, [role="columnheader"], th')).map(h => (h.textContent || '').trim());
      const rows = document.querySelectorAll('.rdt_TableRow, [role="row"], tbody tr');
      const bodyText = (document.body.textContent || '').replace(/\s+/g, ' ');
      const noData = /no data available|there are no records to display/i.test(bodyText);
      return {
        tableFound: !!tbl,
        headers: headers.filter(Boolean),
        rowCount: rows.length,
        noDataMessage: noData,
        snippet: bodyText.slice(0, 400),
      };
    });
    console.log(`[PROBE.DOM] ${JSON.stringify(dom)}`);
    console.log(`[PROBE.APISUMMARY] ${JSON.stringify(apiCalls)}`);
    await page.screenshot({ path: 'reports/s5-frequency-history-4452.png', fullPage: true }).catch(() => {});
  });
});

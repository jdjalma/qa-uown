/**
 * S7 DISCOVERY (qa1) — use the canonical ServicingBasePage.topMenuNavigateTo()
 * to switch the History grid to Email / PayNearMe / CC Transactions for 4452
 * and capture the rendered table headers + row count. Read-only.
 *
 * (Replaces ad-hoc menuitem clicks — the menu items are href-less React
 * onClick tab-switchers; the page object owns the correct open+click sequence.)
 */
import { test, expect } from '@support/base-test.js';
import { loginToPortalWithOptions } from '@helpers/index.js';
import { ServicingAccountSummaryPage } from '@pages/servicing/index.js';
import { ServicingBasePage } from '../../../src/pages/servicing/servicing-base.page.js';

const ACC = '4452';

class Probe extends ServicingBasePage {}

const SCRAPE = `() => {
  const norm = (s) => (s || '').replace(/\\s+/g, ' ').trim();
  return {
    headers: Array.from(document.querySelectorAll('th, [role=columnheader]')).map(e => norm(e.textContent)).filter(Boolean).slice(0,30),
    rows: document.querySelectorAll('.rdt_TableRow, tbody tr').length,
    noRecords: /no records to display|no data/i.test(norm(document.body.innerText || '')),
  };
}`;

test.describe('S7 discovery — History grid switch via page object (qa1)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('Switch History grid: Email, PayNearMe, CC Transactions (4452)', async ({ page, testEnv }) => {
    test.skip(testEnv.env !== 'qa1', 'qa1-only discovery test — skip in non-qa1 environments');
    test.setTimeout(180_000);
    const summary = new ServicingAccountSummaryPage(page);
    const probe = new Probe(page);

    await loginToPortalWithOptions(page, testEnv.servicingUrl, testEnv, 'manager');
    await summary.navigateToCustomerInformation(testEnv.servicingUrl, ACC);

    for (const item of ['Email', 'CC Transactions', 'Phone']) {
      await test.step(`History → ${item}`, async () => {
        await probe.topMenuNavigateTo(item).catch((e) => console.log(`[S7][nav-err][${item}] ${String(e).slice(0,120)}`));
        const dom = await page.evaluate(eval(SCRAPE));
        console.log(`[S7][grid][${item}] url=${page.url().split('.com')[1]} ${JSON.stringify(dom)}`);
      });
    }

    // PayNearMe is not in the page-object menuMap — click it directly while the
    // History dropdown is held open, then scrape.
    await test.step('History → PayNearMe (direct)', async () => {
      const history = page.getByRole('link', { name: /^History$/i }).first();
      await history.click();
      const pnm = page.getByRole('menuitem', { name: 'PayNearMe' });
      const vis = await pnm.isVisible({ timeout: 5_000 }).catch(() => false);
      if (vis) await pnm.click({ force: true });
      await probe.waitForSpinner().catch(() => {});
      const dom = await page.evaluate(eval(SCRAPE));
      console.log(`[S7][grid][PayNearMe] visible=${vis} url=${page.url().split('.com')[1]} ${JSON.stringify(dom)}`);
    });

  });
});

/**
 * S7 DISCOVERY (qa1) — History dropdown deep-dive: Email + PayNearMe content
 * for account 4452. Clicks the real History menu items (UI-first), captures
 * the resulting route + table headers + row count. Read-only (regra #9).
 */
import { test, expect } from '@support/base-test.js';
import { loginToPortalWithOptions } from '@helpers/index.js';
import { dismissCustomerInfoConfirmation } from '../../../src/helpers/servicing-dialogs.helpers.js';

const ACC = '4452';

const SCRAPE = `() => {
  const norm = (s) => (s || '').replace(/\\s+/g, ' ').trim();
  const take = (sel) => Array.from(document.querySelectorAll(sel)).map(e => norm(e.textContent)).filter(Boolean).slice(0, 40);
  return {
    url: location.pathname + location.search,
    headers: take('th, [role=columnheader]'),
    rows: document.querySelectorAll('.rdt_TableRow, tbody tr').length,
    noRecords: /no records to display|no data/i.test(norm(document.body.innerText || '')),
    bodySample: norm(document.body.innerText || '').slice(0, 400),
  };
}`;

test.describe('S7 discovery — History dropdown (Email + PayNearMe), qa1', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('History → Email and History → PayNearMe content for 4452', async ({ page, testEnv }) => {
    test.setTimeout(180_000);
    const base = testEnv.servicingUrl.replace(/\/$/, '');

    await loginToPortalWithOptions(page, testEnv.servicingUrl, testEnv, 'manager');
    await page.goto(`${base}/customer-information/${ACC}`, { waitUntil: 'domcontentloaded' });
    await dismissCustomerInfoConfirmation(page).catch(() => {});
    await page.waitForLoadState('networkidle').catch(() => {});

    async function openHistoryItem(label: string): Promise<void> {
      const history = page.getByRole('link', { name: /^History$/i }).first();
      await history.click();
      const item = page.getByRole('menuitem', { name: label });
      await item.waitFor({ state: 'visible', timeout: 5_000 });
      await item.click({ force: true });
      await page.waitForLoadState('networkidle').catch(() => {});
    }

    await test.step('History → Email', async () => {
      await openHistoryItem('Email');
      const dom = await page.evaluate(eval(SCRAPE));
      console.log(`[S7][history-email-4452] ${JSON.stringify(dom)}`);
    });

    await test.step('History → PayNearMe', async () => {
      // re-anchor on customer-information so the menu is present
      await page.goto(`${base}/customer-information/${ACC}`, { waitUntil: 'domcontentloaded' });
      await dismissCustomerInfoConfirmation(page).catch(() => {});
      await openHistoryItem('PayNearMe');
      const dom = await page.evaluate(eval(SCRAPE));
      console.log(`[S7][history-paynearme-4452] ${JSON.stringify(dom)}`);
    });

    expect(page.url()).toContain('qa1');
  });
});

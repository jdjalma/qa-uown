/**
 * S7 DISCOVERY (qa1) — dedicated history routes /email-history/{pk} and
 * /phone-history/{pk} for 4452 (these return 200). Direct-URL navigation is the
 * reliable path (the embedded customer-information grid does not switch on menu
 * click — see credit-card-history.page.ts note). Read-only.
 */
import { test, expect } from '@support/base-test.js';
import { loginToPortalWithOptions } from '@helpers/index.js';
import { ServicingAccountSummaryPage } from '@pages/servicing/index.js';

const ACC = '4452';
const SCRAPE = `() => {
  const norm = (s) => (s || '').replace(/\\s+/g, ' ').trim();
  return {
    url: location.pathname,
    h2: Array.from(document.querySelectorAll('h1,h2,h3')).map(e=>norm(e.textContent)).filter(Boolean).slice(0,8),
    headers: Array.from(document.querySelectorAll('th, [role=columnheader]')).map(e => norm(e.textContent)).filter(Boolean).slice(0,30),
    rows: document.querySelectorAll('.rdt_TableRow, tbody tr').length,
    noRecords: /no records to display|no data/i.test(norm(document.body.innerText || '')),
    bodySample: norm(document.body.innerText || '').slice(0, 300),
  };
}`;

test.describe('S7 discovery — dedicated history routes (qa1)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('email-history + phone-history + PayNearMe route probe (4452)', async ({ page, testEnv }) => {
    test.skip(testEnv.env !== 'qa1', 'qa1-only discovery test — skip in non-qa1 environments');
    test.setTimeout(180_000);
    const base = testEnv.servicingUrl.replace(/\/$/, '');
    const summary = new ServicingAccountSummaryPage(page);

    await loginToPortalWithOptions(page, testEnv.servicingUrl, testEnv, 'manager');
    // hydrate store first (page-object documented requirement)
    await summary.navigateToCustomerInformation(testEnv.servicingUrl, ACC);

    for (const route of ['email-history', 'phone-history']) {
      await test.step(`Direct nav → /${route}/${ACC}`, async () => {
        await page.goto(`${base}/${route}/${ACC}`, { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle').catch(() => {});
        const dom = await page.evaluate(eval(SCRAPE));
        console.log(`[S7][${route}-${ACC}] ${JSON.stringify(dom)}`);
      });
    }

    // PayNearMe: probe several route spellings in-browser (authenticated)
    await test.step('PayNearMe route discovery', async () => {
      const candidates = ['pay-near-me', 'paynearme', 'pay-near-me-history', 'paynearme-history', 'pnm-history'];
      for (const c of candidates) {
        await page.goto(`${base}/${c}/${ACC}`, { waitUntil: 'domcontentloaded' }).catch(() => {});
        const dom = await page.evaluate(eval(SCRAPE));
        const is404 = /404|not found|page you are looking/i.test(dom.bodySample);
        console.log(`[S7][pnm-probe][${c}] is404=${is404} url=${dom.url} h2=${JSON.stringify(dom.h2)} headers=${JSON.stringify(dom.headers)}`);
      }
    });

  });
});

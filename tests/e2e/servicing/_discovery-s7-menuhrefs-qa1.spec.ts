/**
 * S7 DISCOVERY (qa1) — extract the real href/route targets of the History +
 * Servicing dropdown menu items for account 4452, and click PayNearMe/Email to
 * capture where they actually land. DOM-first (regra #15): inspect anchors
 * before concluding navigation behavior. Read-only.
 */
import { test, expect } from '@support/base-test.js';
import { loginToPortalWithOptions } from '@helpers/index.js';
import { dismissCustomerInfoConfirmation } from '../../../src/helpers/servicing-dialogs.helpers.js';

const ACC = '4452';

test.describe('S7 discovery — menu hrefs (qa1)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('History/Servicing menu item hrefs + PayNearMe/Email landing', async ({ page, testEnv }) => {
    test.skip(testEnv.env !== 'qa1', 'qa1-only discovery test — skip in non-qa1 environments');
    test.setTimeout(180_000);
    const base = testEnv.servicingUrl.replace(/\/$/, '');

    await loginToPortalWithOptions(page, testEnv.servicingUrl, testEnv, 'manager');
    await page.goto(`${base}/customer-information/${ACC}`, { waitUntil: 'domcontentloaded' });
    await dismissCustomerInfoConfirmation(page).catch(() => {});
    await page.waitForLoadState('networkidle').catch(() => {});

    // Open History dropdown so its items are in the DOM, then extract all anchors
    const history = page.getByRole('link', { name: /^History$/i }).first();
    await history.click().catch(() => {});

    const anchors = await page.evaluate(() => {
      const norm = (s: string | null) => (s || '').replace(/\s+/g, ' ').trim();
      return Array.from(document.querySelectorAll('a, [role=menuitem]'))
        .map(a => ({
          text: norm(a.textContent),
          href: (a as HTMLAnchorElement).getAttribute('href') || '',
          role: a.getAttribute('role') || a.tagName.toLowerCase(),
        }))
        .filter(x => x.text && (x.href || x.role === 'menuitem'))
        .filter((x, i, arr) => arr.findIndex(y => y.text === x.text && y.href === x.href) === i);
    });
    console.log(`[S7][menu-anchors] ${JSON.stringify(anchors)}`);

    // Try clicking PayNearMe via getByText (broader than menuitem role) and capture URL change
    for (const label of ['Email', 'PayNearMe', 'Phone']) {
      await page.goto(`${base}/customer-information/${ACC}`, { waitUntil: 'domcontentloaded' });
      await dismissCustomerInfoConfirmation(page).catch(() => {});
      await history.click().catch(() => {});
      const before = page.url();
      const target = page.getByRole('link', { name: label, exact: true })
        .or(page.getByRole('menuitem', { name: label, exact: true })).first();
      const visible = await target.isVisible({ timeout: 3_000 }).catch(() => false);
      if (visible) {
        await target.click({ force: true }).catch(() => {});
        await page.waitForLoadState('networkidle').catch(() => {});
      }
      const headers = await page.evaluate(() => {
        const norm = (s: string | null) => (s || '').replace(/\s+/g, ' ').trim();
        return Array.from(document.querySelectorAll('th, [role=columnheader]')).map(e => norm(e.textContent)).filter(Boolean).slice(0, 30);
      });
      console.log(`[S7][menu-click][${label}] visible=${visible} before=${before} after=${page.url()} headers=${JSON.stringify(headers)}`);
    }

  });
});

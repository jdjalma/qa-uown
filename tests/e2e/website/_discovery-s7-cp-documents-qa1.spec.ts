/**
 * S7 DISCOVERY (qa1) — Customer Portal /documents via IN-APP SPA navigation
 * (NOT page.goto, which loses SPA auth — see website-base.page.ts). Confirms
 * whether /documents is genuinely gated/403 or just a goto-auth-loss artifact.
 * Read-only.
 */
import { test, expect } from '@support/base-test.js';
import { CustomerPortalOverviewPage } from '@pages/website/index.js';

const LOGIN_EMAIL = 'fintechgroup777+1077600_159410@gmail.com';

const SCRAPE = `() => {
  const norm = (s) => (s || '').replace(/\\s+/g, ' ').trim();
  const body = norm(document.body.innerText || '');
  return {
    url: location.pathname + location.search,
    h1: Array.from(document.querySelectorAll('h1,h2,h3')).map(e=>norm(e.textContent)).filter(Boolean).slice(0,8),
    sidebar: Array.from(document.querySelectorAll('[class*="sideBar"], nav a, [role=menuitem]')).map(e=>norm(e.textContent)).filter(Boolean).slice(0,20),
    is404: /404|not found/i.test(body),
    loginGate: /customer login|verification code/i.test(body),
    bodySample: body.slice(0, 350),
  };
}`;

test.describe('S7 discovery — Customer Portal /documents via SPA nav (qa1)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('In-app navigate to Documents after OTP login (4452)', async ({ page, testEnv, db }) => {
    test.setTimeout(240_000);
    const portal = new CustomerPortalOverviewPage(page);

    await page.goto(testEnv.websiteUrl, { waitUntil: 'domcontentloaded' });
    const sincePk = await db.getMaxLoginAttemptPk(LOGIN_EMAIL);
    const loggedIn = await portal.loginWithOtp(LOGIN_EMAIL, async () => {
      const row = await db.waitForFreshOtpCode(LOGIN_EMAIL, sincePk, 150_000);
      if (!row?.code) throw new Error('no fresh OTP code');
      return String(row.code);
    }).catch((e) => { console.log(`[S7][otp][err] ${String(e).slice(0,160)}`); return false; });
    console.log(`[S7][login] loggedIn=${loggedIn} url=${page.url()}`);

    // Capture the sidebar/menu while authenticated on /overview
    await test.step('Overview sidebar inventory', async () => {
      const dom = await page.evaluate(eval(SCRAPE));
      console.log(`[S7][cp-overview-authed] ${JSON.stringify(dom)}`);
    });

    // In-app navigate to Documents via the page object's sidebar navigator
    await test.step('SPA navigate → Documents', async () => {
      await portal.navigateTo('Documents').catch((e) => console.log(`[S7][nav-err] ${String(e).slice(0,160)}`));
      await page.waitForLoadState('networkidle').catch(() => {});
      const dom = await page.evaluate(eval(SCRAPE));
      console.log(`[S7][cp-documents-spa] ${JSON.stringify(dom)}`);
    });

    expect(page.url()).toContain('qa1');
  });
});

/**
 * S7 DISCOVERY (qa1) — Customer Portal /documents and /responses for account
 * 4452 (login email fintechgroup777+1077600_159410@gmail.com). Verifies the
 * regressions seen in dev3:
 *   - /documents  → redirect to login / 403 (BUG-S10-001 replica)?
 *   - /responses  → 404 (CP-S8-02 replica)?
 *
 * UI-first (regra #15/#18): real customer portal, OTP login via DB oracle
 * (memory: DB OTP more reliable than IMAP). Mobile-first viewport 375x667
 * (customer flow is mobile-heavy). Read-only.
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
    is404: /404|not found|page (you are looking|doesn|does not)/i.test(body),
    loginGate: /(verification code|sign in|log ?in|enter your (email|phone))/i.test(body),
    bodySample: body.slice(0, 350),
  };
}`;

test.describe('S7 discovery — Customer Portal /documents + /responses (qa1)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('OTP login then probe /documents and /responses (4452)', async ({ page, testEnv, db }) => {
    test.setTimeout(240_000);
    const base = testEnv.websiteUrl.replace(/\/$/, '');
    const portal = new CustomerPortalOverviewPage(page);

    let loggedIn = false;
    await test.step('OTP login (DB oracle)', async () => {
      await page.goto(testEnv.websiteUrl, { waitUntil: 'domcontentloaded' });
      const sincePk = await db.getMaxLoginAttemptPk(LOGIN_EMAIL);
      loggedIn = await portal.loginWithOtp(LOGIN_EMAIL, async () => {
        const row = await db.waitForFreshOtpCode(LOGIN_EMAIL, sincePk, 150_000);
        if (!row?.code) throw new Error('no fresh OTP code in uown_login_attempt');
        console.log(`[S7][otp] fresh code pk-watermark=${sincePk}`);
        return String(row.code);
      }).catch((e) => { console.log(`[S7][otp][err] ${String(e).slice(0,160)}`); return false; });
      console.log(`[S7][login] loggedIn=${loggedIn} url=${page.url()}`);
    });

    await test.step('Probe /documents', async () => {
      await page.goto(`${base}/documents`, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle').catch(() => {});
      const dom = await page.evaluate(eval(SCRAPE));
      console.log(`[S7][cp-documents] ${JSON.stringify(dom)}`);
    });

    await test.step('Probe /responses', async () => {
      await page.goto(`${base}/responses`, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle').catch(() => {});
      const dom = await page.evaluate(eval(SCRAPE));
      console.log(`[S7][cp-responses] ${JSON.stringify(dom)}`);
    });

    await test.step('Probe /overview (control — should render if logged in)', async () => {
      await page.goto(`${base}/overview`, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle').catch(() => {});
      const dom = await page.evaluate(eval(SCRAPE));
      console.log(`[S7][cp-overview-control] ${JSON.stringify(dom)}`);
    });

    expect(page.url()).toContain('qa1');
  });
});

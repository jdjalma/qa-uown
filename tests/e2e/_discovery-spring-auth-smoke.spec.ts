/**
 * CHARTER C2 — Auth/Security smoke after Spring Boot 2 → 3 update (dev3).
 *
 * WHY: Spring Boot 3 removed `WebSecurityConfigurerAdapter` (replaced by the
 * `SecurityFilterChain` bean). CORS, CSRF and session-management config all had to be
 * re-expressed in the new style — classic spots for SILENT auth regression. A backend
 * that boots fine can still reject every authenticated XHR (401/403), break CORS, or
 * fail to keep the session — none of which a "page loads" check would catch.
 *
 * STRATEGY (UI-first, rule #15 / #18):
 *   1. Log in through the real browser form (LoginPage) for each internal portal.
 *   2. Confirm the LANDING is the app, not a redirect loop / /login / /error / /403.
 *   3. Capture the SPA's own authenticated XHR/fetch traffic via a response listener
 *      installed BEFORE login — this is the real path that exercises Spring Security on
 *      the backend. Assert at least one same-origin API call returned 2xx, and NONE
 *      returned 401/403 (the Spring Security regression signal).
 *   4. Confirm the session survives a reload (session-management regression signal).
 *   5. CAPTURE (soft, conservative — rule #10) CORS header + cookie-security observations.
 *
 * SCOPE: Origination, Servicing, AMS (internal/agent-facing portals only).
 *   Website (customer portal) is intentionally EXCLUDED — its login is OTP-over-email,
 *   which is unstable in dev3 and out of scope for this charter.
 *
 * NO new application data is created — this is a pure auth/security smoke. Each test is
 * independent and runs with a fresh browser context (own session cookie).
 *
 * Run:
 *   ENV=dev3 npx playwright test tests/e2e/_discovery-spring-auth-smoke.spec.ts \
 *     --project=cross-portal --reporter=list
 *   (cross-portal owns the tests/e2e root; this spec drives all 3 portals by full URL,
 *    so it does NOT depend on per-project baseURL/storageState.)
 */
import { test, expect } from '@support/base-test.js';
import { loginToPortalWithOptions } from '@helpers/index.js';
import { LoginPage } from '@pages/login.page.js';
import type { Page, Response } from '@playwright/test';
import type { ConfigEnvironment } from '@config/index.js';

interface CapturedApi {
  url: string;
  status: number;
  cors: string | null;
}

/** Same-origin API call = backend XHR/fetch (not a static asset / HTML document). */
function isApiCall(res: Response, origin: string): boolean {
  const url = res.url();
  if (!url.startsWith(origin)) return false;
  const req = res.request();
  if (req.resourceType() !== 'xhr' && req.resourceType() !== 'fetch') return false;
  // Drop static assets that happen to arrive via fetch (Next.js chunks, fonts, maps).
  if (/\.(js|css|png|jpe?g|svg|woff2?|ico|map|json\?.*chunk)$/i.test(url)) return false;
  return true;
}

/**
 * Installs a response listener that records every same-origin authenticated XHR/fetch.
 * Must be called BEFORE navigation/login so the landing burst is captured.
 */
function captureApiTraffic(page: Page, origin: string, sink: CapturedApi[]): void {
  page.on('response', (res) => {
    try {
      if (!isApiCall(res, origin)) return;
      sink.push({
        url: res.url(),
        status: res.status(),
        cors: res.headers()['access-control-allow-origin'] ?? null,
      });
    } catch {
      /* response may already be discarded — ignore */
    }
  });
}

/** True when the page is sitting on a login form (login field still present). */
async function isOnLoginForm(page: Page): Promise<boolean> {
  return new LoginPage(page).isLoginPage();
}

/** True when the URL landed on an error/forbidden route. */
function isErrorRoute(url: string): boolean {
  return /\/(error|403|401|forbidden|access-denied)(\b|\/|\?|$)/i.test(url);
}

/**
 * Shared smoke body for one internal portal.
 * tag = short label for logs; getUrl resolves the portal URL from ConfigEnvironment.
 */
async function runPortalAuthSmoke(
  page: Page,
  env: ConfigEnvironment,
  tag: string,
  getUrl: (e: ConfigEnvironment) => string,
): Promise<void> {
  const portalUrl = getUrl(env);
  const origin = new URL(portalUrl).origin;
  const api: CapturedApi[] = [];

  await test.step(`[${tag}] capture API traffic + login via UI as manager`, async () => {
    captureApiTraffic(page, origin, api);
    await loginToPortalWithOptions(page, portalUrl, env, 'manager');
    // Give the post-login landing burst time to fire its first authenticated XHRs.
    await page.waitForLoadState('networkidle').catch(() => {});
  });

  await test.step(`[${tag}] landing is the app (no redirect loop / login / error / 403)`, async () => {
    const url = page.url();
    console.log(`[C2][${tag}] landed at: ${url}`);
    expect(isErrorRoute(url), `[${tag}] landed on an error/forbidden route: ${url}`).toBe(false);
    expect(
      await isOnLoginForm(page),
      `[${tag}] still on the login form after submitting valid manager credentials — ` +
        `redirect loop or rejected session (Spring Security regression suspect)`,
    ).toBe(false);
  });

  await test.step(`[${tag}] authenticated backend XHR → 2xx, none 401/403`, async () => {
    console.log(
      `[C2][${tag}] captured ${api.length} same-origin API call(s): ` +
        JSON.stringify(api.slice(0, 12).map((c) => ({ s: c.status, u: c.url.replace(origin, '') }))),
    );

    const unauthorized = api.filter((c) => c.status === 401 || c.status === 403);
    expect(
      unauthorized,
      `[${tag}] backend returned 401/403 to authenticated SPA calls — Spring Security ` +
        `regression (CORS/CSRF/session filter chain): ` +
        JSON.stringify(unauthorized.map((c) => ({ s: c.status, u: c.url.replace(origin, '') }))),
    ).toHaveLength(0);

    const ok2xx = api.filter((c) => c.status >= 200 && c.status < 300);
    expect(
      ok2xx.length,
      `[${tag}] no authenticated backend XHR returned 2xx after login — the SPA may not ` +
        `have reached the API at all (capture count=${api.length})`,
    ).toBeGreaterThan(0);
  });

  await test.step(`[${tag}] session survives a reload (session-management OK)`, async () => {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
    const url = page.url();
    expect(isErrorRoute(url), `[${tag}] reload bounced to error route: ${url}`).toBe(false);
    expect(
      await isOnLoginForm(page),
      `[${tag}] reload kicked back to login — session not persisted (session-management regression)`,
    ).toBe(false);
  });

  await test.step(`[${tag}] CAPTURE soft observations (CORS header + cookie security)`, async () => {
    // CORS: same-origin BFF calls legitimately MAY omit ACAO. We only record what we saw.
    const withCors = api.filter((c) => c.cors !== null);
    console.log(
      `[C2][${tag}][OBS] API calls advertising Access-Control-Allow-Origin: ` +
        `${withCors.length}/${api.length}` +
        (withCors[0] ? ` (sample ACAO="${withCors[0].cors}")` : ''),
    );

    // Cookie security: the BFF session cookie is HttpOnly+Secure by design → it MUST NOT
    // appear in document.cookie. Absence here is the EXPECTED secure behaviour, not a bug.
    const jsCookies = await page.evaluate(() => document.cookie);
    const sessionCookieLeaked = /\.sid|sid=|auth/i.test(jsCookies);
    console.log(
      `[C2][${tag}][OBS] document.cookie (JS-visible) = "${jsCookies}" | ` +
        `session cookie JS-visible: ${sessionCookieLeaked} (false = HttpOnly enforced, expected)`,
    );
  });
}

test.describe('C2 — Spring Boot 3 auth/security smoke (dev3 internal portals)', () => {
  test('Origination — manager login, authenticated API, session persisted', async ({ page, testEnv }) => {
    test.setTimeout(120_000);
    await runPortalAuthSmoke(page, testEnv, 'ORIG', (e) => e.originationUrl);
  });

  test('Servicing — manager login, authenticated API, session persisted', async ({ page, testEnv }) => {
    test.setTimeout(120_000);
    await runPortalAuthSmoke(page, testEnv, 'SVC', (e) => e.servicingUrl);
  });

  test('AMS — manager login, authenticated API, session persisted', async ({ page, testEnv }) => {
    test.setTimeout(120_000);
    await runPortalAuthSmoke(page, testEnv, 'AMS', (e) => e.amsUrl);
  });
});

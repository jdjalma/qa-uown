/**
 * Auth Helpers
 *
 * Eliminates repeated login patterns across E2E tests.
 * Consolidates: portal navigation + LoginPage instantiation + credential lookup + login.
 */
import type { Page } from '@playwright/test';
import { LoginPage } from '@pages/login.page.js';
import type { ConfigEnvironment, UserRole } from '@config/index.js';

/**
 * Navigates to a portal URL and logs in with the specified role credentials.
 *
 * @param page - Playwright Page instance
 * @param portalUrl - Full URL of the portal (e.g. env.originationUrl, env.servicingUrl)
 * @param env - ConfigEnvironment instance for credential lookup
 * @param role - User role to login as (default: 'manager')
 */
export async function loginToPortal(
  page: Page,
  portalUrl: string,
  env: ConfigEnvironment,
  role: UserRole = 'manager',
): Promise<void> {
  await page.goto(portalUrl);
  const loginPage = new LoginPage(page);
  const creds = env.getCredentials(role);
  await loginPage.login(creds.username, creds.password);
}

/**
 * Navigates to a portal URL with specific waitUntil option and logs in.
 *
 * @param page - Playwright Page instance
 * @param portalUrl - Full URL of the portal
 * @param env - ConfigEnvironment instance for credential lookup
 * @param role - User role to login as (default: 'manager')
 * @param waitUntil - Navigation wait strategy (default: 'domcontentloaded')
 */
export async function loginToPortalWithOptions(
  page: Page,
  portalUrl: string,
  env: ConfigEnvironment,
  role: UserRole = 'manager',
  waitUntil: 'load' | 'domcontentloaded' | 'networkidle' | 'commit' = 'domcontentloaded',
): Promise<void> {
  await page.goto(portalUrl, { waitUntil });
  const loginPage = new LoginPage(page);
  const creds = env.getCredentials(role);
  await loginPage.login(creds.username, creds.password);
}

/**
 * Checks if a login indicator is visible on the page and logs in if needed.
 * Useful for re-login after session expiry or page refresh.
 *
 * @param page - Playwright Page instance
 * @param loginIndicatorText - Exact text to look for (e.g. 'Servicing Login')
 * @param portalUrl - Full URL of the portal to navigate to for login
 * @param env - ConfigEnvironment instance for credential lookup
 * @param role - User role to login as (default: 'manager')
 */
export async function loginToPortalIfNeeded(
  page: Page,
  loginIndicatorText: string,
  portalUrl: string,
  env: ConfigEnvironment,
  role: UserRole = 'manager',
): Promise<void> {
  const needsLogin = await page.getByText(loginIndicatorText, { exact: true })
    .isVisible({ timeout: 3_000 }).catch(() => false);
  if (needsLogin) {
    await loginToPortal(page, portalUrl, env, role);
  }
}

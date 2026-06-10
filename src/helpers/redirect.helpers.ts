/**
 * Redirect Helpers — assertions for /getApplication routing behavior.
 *
 * Used by RU05.26.1.52.0_redirectInvalidOrInactiveApplicationLinks_1293 and any
 * future test that needs to validate the public customer link redirect chain
 * (origination /getApplication/{code} → find-a-merchant or apply form).
 *
 * Design notes:
 * - Redirect for invalid/inactive/terminated codes is CLIENT-SIDE (Next.js
 *   `next/router` with `replaceState`). Initial HTTP response is 200; the JS
 *   navigates to find-a-merchant after hydration. We MUST use `waitForURL`,
 *   not response status assertions (spec § "Assertion strategy").
 * - Generic route `/getApplication` (no segment) uses server-side 307 and is
 *   asserted separately.
 */
import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/** Canonical landing URL pattern (regex) — matches the public uownleasing.com find-a-merchant page. */
export const FIND_A_MERCHANT_RE = /uownleasing\.com\/customer\/find-a-merchant/i;

/** Canonical exact landing URL (with trailing slash) used for strict equality assertions. */
export const FIND_A_MERCHANT_URL = 'https://uownleasing.com/customer/find-a-merchant/';

/**
 * Wait until the page lands on the public find-a-merchant URL.
 * Tolerates the client-side replaceState navigation (no HTTP 3xx involved).
 */
export async function assertRedirectedToFindMerchant(
  page: Page,
  timeoutMs: number = 10_000,
): Promise<void> {
  await page.waitForURL(FIND_A_MERCHANT_RE, { timeout: timeoutMs });
  expect(page.url(), 'final URL must match find-a-merchant canonical').toMatch(FIND_A_MERCHANT_RE);
}

/**
 * Wait until the page reaches the public apply-{env} form host (UOWN or Kornerstone)
 * and a recognizable application form root is visible. Used to assert positive regression
 * on the active-merchant path (no redirect happens).
 */
export async function assertRendersApplicationForm(
  page: Page,
  options: { brand?: 'uown' | 'kornerstone'; timeoutMs?: number } = {},
): Promise<void> {
  const timeoutMs = options.timeoutMs ?? 20_000;
  const hostRe = options.brand === 'kornerstone'
    ? /apply-[a-z0-9]+\.kornerstoneliving\.com/i
    : options.brand === 'uown'
      ? /apply-[a-z0-9]+\.uownleasing\.com/i
      : /apply-[a-z0-9]+\.(uownleasing|kornerstoneliving)\.com/i;

  await page.waitForURL(hostRe, { timeout: timeoutMs });
  expect(page.url(), 'final URL must NOT be find-a-merchant').not.toMatch(FIND_A_MERCHANT_RE);
  expect(page.url(), 'final URL host must match apply-{env}').toMatch(hostRe);

  // Soft check: form root reasonable signals. Apply page exposes a first/last name pair
  // or an email field very early; we tolerate any of them being present within a short
  // window. We do NOT click/submit — this is a render check only.
  const candidates = [
    page.locator('input[name="firstName"]'),
    page.locator('input[name="email"]'),
    page.locator('input[type="email"]').first(),
    page.locator('form').first(),
  ];
  let formVisible = false;
  for (const candidate of candidates) {
    try {
      await candidate.waitFor({ state: 'visible', timeout: 5_000 });
      formVisible = true;
      break;
    } catch {
      // try next
    }
  }
  expect(formVisible, 'application form root should render on apply-{env}').toBe(true);
}

/**
 * Navigation Helpers
 *
 * Eliminates repeated search-and-navigate patterns across E2E tests.
 * Consolidates: SearchPage instantiation + searchAndSelectFirst + page object creation + waitForSpinner.
 */
import type { Page } from '@playwright/test';
import { SearchPage } from '@pages/search.page.js';
import { OriginationCustomerPage } from '@pages/origination/customer.page.js';
import { ServicingCustomerPage } from '@pages/servicing/customer.page.js';


/**
 * Searches for a customer by ID via quick search and navigates to the
 * origination customer page.
 *
 * @param page - Playwright Page instance
 * @param searchId - The ID to search for (leadPk, leadUuid, etc.)
 * @param searchType - Quick search type (default: auto-detect UUID format → 'UUID', else 'Lead #')
 * @returns OriginationCustomerPage instance ready for interaction
 */
export async function navigateToOriginationCustomer(
  page: Page,
  searchId: string,
  searchType?: string,
): Promise<OriginationCustomerPage> {
  const MAX_ATTEMPTS = 3;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const searchPage = new SearchPage(page);

    // Auto-detect UUID format and switch search type accordingly
    const effectiveType = searchType ?? (isUuid(searchId) ? 'UUID' : undefined);
    if (effectiveType) {
      await searchPage.selectSearchType(effectiveType);
    }

    await searchPage.searchAndSelectFirst(searchId);

    const customerPage = new OriginationCustomerPage(page);
    await customerPage.waitForSpinner();

    // Verify navigation actually reached the customer page
    const url = page.url();
    if (url.includes('/customers/')) {
      console.log(`[Navigation] Navigated to customer page on attempt ${attempt}. URL: ${url}`);
      return customerPage;
    }

    console.log(`[Navigation] Attempt ${attempt}/${MAX_ATTEMPTS} — still on ${url}, retrying...`);
    await page.waitForURL('**/customers/**', { timeout: 3_000 }).catch(() => {});
  }

  // Last resort: navigate directly via URL
  const directUrl = `/customers/${searchId}`;
  console.log(`[Navigation] All search attempts failed — navigating directly to ${directUrl}`);
  await page.goto(directUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => {});
  const customerPage = new OriginationCustomerPage(page);
  await customerPage.waitForSpinner();
  return customerPage;
}

/** Check if a string looks like a UUID (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx) */
function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

/**
 * Navigates to a customer in the servicing portal using ServicingCustomerPage's
 * own navigateToCustomer method (which handles servicing-specific search behavior).
 *
 * @param page - Playwright Page instance
 * @param searchId - The ID to search for (accountPk, leadUuid, etc.)
 * @returns ServicingCustomerPage instance ready for interaction
 */
export async function navigateToServicingCustomer(
  page: Page,
  searchId: string,
): Promise<ServicingCustomerPage> {
  const customerPage = new ServicingCustomerPage(page);
  await customerPage.navigateToCustomer(searchId);
  return customerPage;
}

import type { Page } from '@playwright/test';
import { SELECTORS } from '../selectors/common.selectors.js';
import { TIMEOUTS } from '../config/constants.js';

export async function waitForSpinner(page: Page, timeoutMs = TIMEOUTS.SPINNER): Promise<void> {
  // Wait for each spinner type independently. Using a combined selector with .first()
  // can miss the full-page loader if a brief Bootstrap spinner appears first and disappears
  // quickly — .first() resolves to the Bootstrap spinner, waits for it to hide, and returns
  // while the full-page loader is still active.
  const spinnerSelectors = [
    `${SELECTORS.spinnerBorder}, ${SELECTORS.spinnerGrow}`,
    SELECTORS.fullPageLoader,
    SELECTORS.loadingOverlay,
  ];
  for (const sel of spinnerSelectors) {
    try {
      const spinner = page.locator(sel).first();
      if (await spinner.isVisible({ timeout: 1_500 }).catch(() => false)) {
        await spinner.waitFor({ state: 'hidden', timeout: timeoutMs });
      }
    } catch {
      // Spinner not present or already gone - this is expected
    }
  }
}

export async function getToastText(page: Page, timeoutMs = TIMEOUTS.TOAST): Promise<string | null> {
  try {
    const toast = page.locator(SELECTORS.toastBody).first();
    await toast.waitFor({ state: 'visible', timeout: timeoutMs });
    return await toast.textContent();
  } catch {
    return null;
  }
}

export async function waitForToastAndDismiss(page: Page, timeoutMs = TIMEOUTS.TOAST): Promise<string | null> {
  const text = await getToastText(page, timeoutMs);
  try {
    await page.locator(SELECTORS.toastClose).first().click({ timeout: TIMEOUTS.TOAST_DISMISS });
  } catch {
    // Toast may auto-dismiss
  }
  return text;
}

export async function selectDropdownOption(page: Page, controlSelector: string, optionText: string): Promise<void> {
  await page.locator(controlSelector).click();
  const option = page.locator(SELECTORS.filterOption).filter({ hasText: optionText });
  await option.click();
  await waitForSpinner(page);
}

export async function isElementPresent(page: Page, selector: string, timeoutMs = TIMEOUTS.ELEMENT_PRESENCE): Promise<boolean> {
  try {
    await page.locator(selector).first().waitFor({ state: 'visible', timeout: timeoutMs });
    return true;
  } catch {
    return false;
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Parses a money string (e.g. "$3,813.43", "  $1234", "0.00") into a number.
 * Strips currency symbol, thousands separators, and surrounding whitespace.
 * Returns NaN when the input cannot be parsed (caller decides how to react).
 *
 * Examples:
 *   parseMoney("$3,813.43") === 3813.43
 *   parseMoney("0.00")      === 0
 *   parseMoney("$ -12.50")  === -12.5
 *   parseMoney("--")        === NaN
 *   parseMoney(null)        === NaN
 */
export function parseMoney(input: string | number | null | undefined): number {
  if (input === null || input === undefined) return NaN;
  if (typeof input === 'number') return input;
  const cleaned = input.replace(/[\s,$]/g, '').trim();
  if (!cleaned) return NaN;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

/**
 * Extract accountPk from a page URL.
 * Matches patterns: `accountPk=12345`, `/account/12345`, `/accounts/12345`.
 *
 * @param url - The full URL string to extract from
 * @returns The extracted accountPk string, or null if not found
 */
/**
 * Build the CC payment details object expected by `ServicingBasePage.makeCcPayment()`.
 * Eliminates repeated card-to-payment-details mapping across tests.
 *
 * @param card - A test card object with number, expMonth, expYear, cvv
 * @param billing - Billing address details
 * @param allocationStrategy - Optional allocation strategy
 */
export function buildCcPaymentDetails(
  card: { number: string; expMonth: string; expYear: string; cvv: string },
  billing: { address: string; city: string; state: string; zip: string },
  allocationStrategy?: string,
): {
  cardNumber: string;
  expMonth: string;
  expYear: string;
  csc: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  allocationStrategy?: string;
} {
  return {
    cardNumber: card.number,
    expMonth: card.expMonth,
    expYear: card.expYear,
    csc: card.cvv,
    address: billing.address,
    city: billing.city,
    state: billing.state,
    zip: billing.zip,
    ...(allocationStrategy ? { allocationStrategy } : {}),
  };
}

export function extractAccountPkFromUrl(url: string): string | null {
  const match = url.match(/accountPk=(\d+)|\/accounts?\/(\d+)/);
  if (match) {
    return match[1] || match[2] || null;
  }
  return null;
}

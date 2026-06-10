/**
 * Servicing dialog dismissal helpers.
 *
 * The Servicing portal auto-renders a "Customer Information Confirmation"
 * modal on every `/customer-information/{accountPk}` page load. The modal
 * MUST be dismissed via its CONFIRM button — only `handleConfirm()` sets
 * `utilityStore.isVerified = true`, which prevents React from continuously
 * re-rendering the modal. Cancel/ESC/backdrop click cause re-render and
 * destabilise any subsequent UI interaction (clicks land on the backdrop
 * instead of the underlying control).
 *
 * Client-state only: dismissing the modal does NOT call the backend.
 */
import type { Page } from '@playwright/test';
import { SELECTORS } from '../selectors/common.selectors.js';

/**
 * Dismisses the "Customer Information Confirmation" modal that auto-appears
 * on every Servicing /customer-information/{pk} page load. The modal mounts
 * ASYNCHRONOUSLY after page hydration (React `useEffect`), so a single-shot
 * `isVisible()` check immediately after `goto()` may return false BEFORE the
 * modal renders — then the backdrop later intercepts clicks on the page
 * underneath ("subtree intercepts pointer events").
 *
 * Strategy:
 *   1. Locate the modal by its title text (`.modal:has-text(...)`).
 *   2. `waitFor({ state: 'visible', timeout: timeoutMs })` — ACTIVELY WAIT for
 *      it to mount (vs. `isVisible` which only asks "right now?").
 *   3. If it never appears within `timeoutMs` → return silently (no-op): the
 *      page is already verified or in a state that doesn't render the modal.
 *   4. Click the modal's `Confirm` button → only `handleConfirm()` sets
 *      `utilityStore.isVerified=true`, preventing React from re-rendering it.
 *      Cancel/ESC/backdrop click cause re-render and break later interactions.
 *   5. Wait for modal + Bootstrap backdrop (`.modal-backdrop`) to detach so
 *      subsequent clicks don't land on the overlay.
 *
 * Trade-off: when the modal never appears, the helper pays `timeoutMs` of
 * wait. This is acceptable on Servicing customer-information pages where the
 * modal nearly always renders; the alternative (single-shot `isVisible`)
 * silently misses the modal and causes downstream click failures, which is
 * far costlier to debug.
 */
export async function dismissCustomerInfoConfirmation(
  page: Page,
  timeoutMs = 10_000,
): Promise<void> {
  const modal = page
    .locator('.modal')
    .filter({ hasText: 'Customer Information Confirmation' })
    .first();
  try {
    await modal.waitFor({ state: 'visible', timeout: timeoutMs });
  } catch {
    return; // modal never appeared — page already verified or different state
  }
  await modal.getByRole('button', { name: 'Confirm' }).click();
  await modal.waitFor({ state: 'hidden', timeout: 8_000 }).catch(() => {});
  await page
    .locator(SELECTORS.modalBackdrop)
    .waitFor({ state: 'hidden', timeout: 5_000 })
    .catch(() => {});
}

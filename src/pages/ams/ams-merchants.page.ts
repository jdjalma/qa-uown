/**
 * AmsMerchantsPage — AMS portal Merchants list view (/merchants).
 *
 * Backed by `GET /uown/merchants` (svc#504 / R1.52.0 — MR!1430). The page renders a
 * react-data-table-component table with a Filters panel (Search input + Active
 * combobox) and a paginated list of merchants.
 *
 * Page object responsibilities (per page-object rule):
 *  - Expose locators for the Filters controls and table chrome.
 *  - Provide thin action helpers (open Filters, type search, submit, pick Active state).
 *  - NO assertions inside the page object — tests own expectations.
 *
 * DOM-first: selectors were validated via MCP Playwright in qa1 (2026-05-22) and live
 * exclusively in `src/selectors/common.selectors.ts` (no inline strings here).
 */
import type { Locator } from '@playwright/test';
import { AmsBasePage } from './ams-base.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';

export type ActiveFilterState = 'Active' | 'Inactive';

export class AmsMerchantsPage extends AmsBasePage {
  readonly sidebarMerchantsLink = this.page.locator(SELECTORS.amsMerchantsNavLink).first();
  readonly filtersButton = this.page.locator(SELECTORS.amsMerchantsFiltersButton).first();
  readonly searchInput = this.page.locator(SELECTORS.amsMerchantsSearchInput).first();
  readonly searchSubmitButton = this.page.locator(SELECTORS.amsMerchantsSearchSubmitButton).first();
  readonly activeCombobox = this.page.locator(SELECTORS.amsMerchantsActiveCombobox).first();
  /**
   * Open-state gate for the Active combobox. We only USE this as an "is the menu
   * open?" wait gate (`waitFor visible`); we do NOT scope option lookups inside
   * it. Per validator F-003 (3rd pass): this resolves to the `<input role="combobox">`
   * element, which has no descendant text nodes — `getByText('Inactive')` inside
   * an `<input>` finds nothing. Option targeting goes via `activeOptionRow()`
   * page-wide using the CSS Module `[class*="customOptionStyles"]` selector
   * filtered by exact label text (6ª passada — see method docstring).
   */
  readonly activeComboboxOpen = this.page.locator(SELECTORS.amsMerchantsActiveComboboxOpen).first();
  readonly lastLoginHeader = this.page.locator(SELECTORS.amsMerchantsLastLoginHeader).first();

  /**
   * Navigates directly to `/merchants` (preferred over sidebar click — avoids the
   * Bootstrap responsive hamburger trap when the viewport is borderline). Tests can
   * still drive the sidebar via `clickSidebarMerchants` when they want to assert
   * the link is wired.
   */
  async goto(amsBaseUrl: string): Promise<void> {
    const url = `${amsBaseUrl.replace(/\/+$/, '')}/merchants`;
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  }

  /** Click the Merchants link in the AMS sidebar. Requires viewport ≥1440×900. */
  async clickSidebarMerchants(): Promise<void> {
    await this.sidebarMerchantsLink.waitFor({ state: 'visible', timeout: 10_000 });
    await this.sidebarMerchantsLink.click();
  }

  /** Opens the Filters panel if not already open. Idempotent. */
  async openFilters(): Promise<void> {
    // After opening, the search input becomes visible. Use that as the "open" signal.
    const alreadyOpen = await this.searchInput.isVisible({ timeout: 500 }).catch(() => false);
    if (alreadyOpen) return;
    await this.filtersButton.click();
    await this.searchInput.waitFor({ state: 'visible', timeout: 10_000 });
  }

  /**
   * Types `term` into the search input and clicks Search. Does NOT wait for the
   * network response — tests should hook `page.waitForResponse(...)` BEFORE
   * calling this method when they need the response payload.
   */
  async submitSearch(term: string): Promise<void> {
    await this.openFilters();
    await this.searchInput.fill(term);
    await this.searchSubmitButton.click();
  }

  /**
   * Returns a Locator targeting the OPTION ROW for `state` ("Active" |
   * "Inactive") in the open Active combobox.
   *
   * 6ª passada (F-003 — fix definitivo, validado LIVE em qa1 2026-05-22 13:13 UTC):
   *
   *   <div class="index-module_customOptionStyles__CSG9m" id="react-select-2-option-1">
   *     <div class="d-flex align-items-center">
   *       <input type="checkbox">     ← NATIVE input, NO aria-label/role/labelledby
   *       Inactive                    ← label as text-node SIBLING of input
   *     </div>
   *   </div>
   *
   * Why CSS-Module class + exact text match:
   *   - The `<input type="checkbox">` is a NATIVE input — it has the implicit
   *     ARIA role "checkbox" computed by the browser, BUT no accessible name
   *     (no `aria-label`, no `<label for>`, no `aria-labelledby`). That's why
   *     `getByRole('checkbox', { name })` failed on the 4th & 5th passes:
   *     ARIA name computation does not include sibling text-nodes for inputs.
   *   - Custom react-select wires `onClick` on the ROW `<div>`, not the input.
   *     Clicking the row triggers the toggle handler (validated manually
   *     via `page.locator('#react-select-2-option-0').click()` — flipped from
   *     Inactive → Active correctly).
   *   - `[class*="customOptionStyles"]` returns exactly 2 elements when the
   *     combobox is open (Active + Inactive). The hash suffix changes between
   *     webpack builds; the prefix `customOptionStyles` is stable across builds.
   *   - `filter({ hasText: /^state$/ })` enforces exact match — without the
   *     regex anchors, `hasText: 'Active'` would match "Inactive" too.
   */
  private activeOptionRow(state: ActiveFilterState): Locator {
    // Exact text match via regex (`hasText` accepts a RegExp for exact semantics).
    const exactLabel = new RegExp(`^${state}$`);
    return this.page.locator(SELECTORS.amsMerchantsActiveOptionRow).filter({ hasText: exactLabel });
  }

  /**
   * Selects an option in the "Active" combobox (Active | Inactive), then clicks
   * Search. The click target is the OPTION ROW (CSS-Module `customOptionStyles`
   * wrapper) — custom react-select wires its toggle handler on the row container,
   * not on the native checkbox input (which has no accessible name).
   */
  async pickActiveAndSearch(state: ActiveFilterState): Promise<void> {
    await this.openFilters();
    await this.activeCombobox.click();
    await this.activeComboboxOpen.waitFor({ state: 'visible', timeout: 5_000 });
    const row = this.activeOptionRow(state);
    await row.waitFor({ state: 'visible', timeout: 5_000 });
    await row.click();
    // Close the menu so it doesn't intercept the subsequent Search click. Pressing
    // Escape is the documented way to exit the inline menu per the ARIA live hint.
    await this.page.keyboard.press('Escape');
    await this.searchSubmitButton.click();
  }

  /**
   * Clear the Active filter by unchecking whichever option is currently checked.
   * This component does NOT expose a `×` clear-indicator (validated via MCP
   * 2026-05-22); the only way to return to the omitted state is to toggle the
   * active selection off. Tests must call Search afterwards to refire the request.
   *
   * 6ª passada (F-003): the native `<input type="checkbox">` inside each option
   * row has its `.checked` DOM property toggled by the react-select handler.
   * `Locator.isChecked()` reads that property directly — no need for ARIA.
   * Click the ROW (not the input) to toggle: the onClick handler is wired on
   * the row container per the custom react-select implementation.
   */
  async clearActiveFilter(): Promise<void> {
    await this.openFilters();
    await this.activeCombobox.click();
    await this.activeComboboxOpen.waitFor({ state: 'visible', timeout: 5_000 });
    for (const label of ['Active', 'Inactive'] as ActiveFilterState[]) {
      const row = this.activeOptionRow(label);
      const exists = await row.count();
      if (exists === 0) continue;
      // Read native `.checked` from the input descendant to detect selection.
      const checkbox = row.locator('input[type="checkbox"]').first();
      const isChecked = await checkbox.isChecked().catch(() => false);
      if (isChecked) {
        await row.click();
        break;
      }
    }
    await this.page.keyboard.press('Escape');
  }

  /** Returns the visible text of every row currently rendered. */
  async getVisibleRowTexts(): Promise<string[]> {
    const rows = this.page.locator(SELECTORS.amsRdtTableRow);
    const count = await rows.count();
    const out: string[] = [];
    for (let i = 0; i < count; i++) {
      out.push((await rows.nth(i).innerText()).trim());
    }
    return out;
  }

  /** Locator for the row that contains `text` (case-sensitive substring match). */
  rowContaining(text: string): Locator {
    return this.page.locator(SELECTORS.amsRdtTableRow).filter({ hasText: text });
  }
}

import { type Page, type Locator } from '@playwright/test';
import { OriginationBasePage } from './origination-base.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';

/**
 * Shared Page Object — Merchant / Location multi-select filter widget.
 *
 * Task #1292 (R1.52.0) — multi-select Merchant & Location filters rolled out across
 * Origination pages: Open To Buy, Rebate, Leads (Overview/bottom), Merchant,
 * Merchant Setting, New Application.
 *
 * # Component identity (DOM-first, qa1 2026-05-20)
 *
 * The widget is the `MerchantLocationFilters` shared React component (frontend
 * `components/merchant-location-filters/`) that renders a leads-style filter
 * block containing:
 *   - Filters toggle button (`button[class*="index-module_filterButton__"]`)
 *   - One or more react-select multi-select comboboxes (Merchant, Location, …)
 *   - A blue "Search" submit button that applies the selected values
 *
 * NOTE — Overview has TWO filter components on the page:
 *   - TOP (KPIs): legacy single-select with class `overview_filterButton__…` — OUT OF SCOPE.
 *   - BOTTOM (leads-style): the multi-select component covered by this PO — scope here.
 * Always scope by passing the container Locator (or default to the first matching
 * `multiSelectFilterButton`) to avoid binding to the top filter.
 *
 * # Observed behaviour confirmed by product (2026-05-20)
 *
 * - Clicking an option CLOSES the dropdown. The PO must reopen the dropdown before
 *   selecting the next option. This is intentional UX, not a bug.
 * - The dropdown filter input is the combobox itself (`aria-autocomplete="list"`).
 *   There is no separate search input. Typing in the combobox narrows the option list.
 * - Selected count is rendered as text `"N items selected"` inside
 *   `filter__value-container--is-multi`. There are no chips/pills.
 * - "Select All" affordance exists on some pages (Overview bottom, OTB, Rebate,
 *   Merchant, MerchantSetting, Leads) but NOT on New Application (intentional).
 * - Empty selection + Search ⇒ table shows all rows (no filter applied).
 * - `react-select-N-input` ID numbering varies by mount order — never hardcode `N`.
 *   Anchor by the adjacent label text instead.
 *
 * # Usage
 *
 * ```ts
 * const filter = new MerchantLocationFilterPO(page);
 * await filter.openFilterPanel();
 * await filter.selectMerchants(['Daniel\'s Jewelers', 'TireAgent']);
 * await filter.selectLocations(['Costa Mesa']);
 * await filter.applySearch();
 * expect(await filter.getMerchantSelectedCount()).toBe(2);
 * ```
 */
export class MerchantLocationFilterPO extends OriginationBasePage {
  private readonly scope: Locator | undefined;

  /**
   * @param page  Playwright Page
   * @param scope Optional container Locator. When provided, the filter is
   *              resolved inside that container — pass the bottom Overview
   *              wrapper to disambiguate from the top KPIs filter.
   */
  constructor(page: Page, scope?: Locator) {
    super(page);
    this.scope = scope;
  }

  // ── Container scoping ────────────────────────────────────────────────

  /**
   * Returns the root container Locator for the multi-select filter block.
   * If a `scope` Locator was passed to the constructor, uses it. Otherwise
   * anchors directly on the `<label>Merchant</label>` of the filter form and
   * walks up to the closest ancestor `<div>` that ALSO contains a `<label>`
   * (or text) for "Location" — i.e. the wrapper holding the whole filter row.
   *
   * # Why this anchor (DOM-first validated qa1 2026-05-20, run #3 fix)
   *
   * Run #1 anchor `ancestor::*[self::section or self::div][1]` resolved to
   * `<div class="mr-2 mt-2 ml-0 w-100">` — the IMMEDIATE wrapper of just the
   * "Filters" button. That wrapper does NOT contain the filter controls nor the
   * Search button, so `applyButton()` and `controlByLabel()` returned 0 hits.
   *
   * Run #2 anchor `ancestor::div[.//button[normalize-space()='Search']][1]`
   * fixed 4 pages but broke Open To Buy. OTB is REACTIVE — filters apply
   * on dropdown close — its filter row has NO "Search" submit AND NO "Filters"
   * collapse toggle either; the form is inline and always-visible. The XPath
   * therefore returned 0 elements on /openToBuy, failing CT-01/10/11/12.
   *
   * Run #3 anchor (this one): start FROM the `<label>Merchant</label>` itself,
   * not from `SELECTORS.multiSelectFilterButton` (which is absent on OTB). The
   * `<label>` element is present and unique inside the filter form on every
   * page that consumes the shared `MerchantLocationFilters` component
   * (Overview-bottom, Open To Buy, Rebate, Leads, Merchant list, Merchant
   * Setting, New Application). It is NOT a `<th>` (so it never collides with
   * the data grid column header). Walking up to the closest ancestor `<div>`
   * that also contains a "Location" label gives us a wrapper that holds the
   * whole filter row (Merchant + Location + Search if any).
   *
   * Fallback: when only one label exists (theoretical), fall back to the
   * label's parent — keeps the dropdown / clear-x lookups working even on
   * minimal variants.
   *
   * Pitfall: `<th>Merchant</th>` column headers live in the SAME page, so
   * `controlByLabel` MUST be restricted to `<label>` (see method below) to
   * avoid matching the table column header by accident.
   */
  private container(): Locator {
    if (this.scope) return this.scope;
    // DOM-first investigation (qa1 2026-05-20) confirmed Open To Buy renders
    // the Location label as `<label>Location*</label>` (required-field marker)
    // while Overview/Leads/Rebate/Merchant/etc. render plain `<label>Location</label>`.
    // The Merchant label is always plain `<label>Merchant</label>`. Using
    // `starts-with(...,'Location')` accepts both variants — anchoring on the
    // Merchant label and walking up to the wrapper that also contains a Location
    // label gives a universal scope for the multi-select filter form.
    return this.page.locator(
      "xpath=//label[normalize-space()='Merchant']" +
      "/ancestor::div[.//label[starts-with(normalize-space(.),'Location')]][1]",
    ).first();
  }

  /**
   * Returns true when the current page exposes a Search submit button inside
   * the filter container. Pages like Open To Buy apply filters REACTIVELY
   * (on dropdown close) and have NO Search button — only "Filters" + "Email CSV".
   * Used by `applySearch` to no-op on reactive pages instead of timing out.
   */
  async hasSearchButton(): Promise<boolean> {
    return (await this.applyButton().count()) > 0;
  }

  /** The bottom filter's "Filters" toggle button. */
  filterToggleButton(): Locator {
    return this.scope
      ? this.scope.locator(SELECTORS.multiSelectFilterButton).first()
      : this.page.locator(SELECTORS.multiSelectFilterButton).first();
  }

  /**
   * The "Search" button scoped to the bottom filter container.
   * The page may have multiple "Search" buttons (top KPI filter + nav bar); scope is critical.
   */
  applyButton(): Locator {
    return this.container().locator("button:has-text('Search')").first();
  }

  // ── Open / close the filter panel ────────────────────────────────────

  /**
   * Expands the filter panel if collapsed.
   *
   * Resilience requirement (qa1 2026-05-20): on Overview, `verifyDashboardLoaded`
   * returns as soon as the TOP KPIs filter button or the leads table appears,
   * but the BOTTOM leads-style panel (which carries `index-module_filterButton__`)
   * can still be mid-render. The PO must wait for the toggle to attach BEFORE
   * trying to read `applyButton` visibility, otherwise the whole flow silently
   * no-ops (button never attaches → never clicked → Search never visible).
   */
  async openFilterPanel(): Promise<void> {
    await this.waitForSpinner();

    // Wait for the toggle button to ATTACH to the DOM (visible OR collapsed).
    // The widget mounts asynchronously after the dashboard cards on Overview.
    const toggle = this.filterToggleButton();
    await toggle.waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});

    const apply = this.applyButton();
    const alreadyOpen = await apply.isVisible({ timeout: 500 }).catch(() => false);
    if (alreadyOpen) return;

    if (await toggle.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await toggle.scrollIntoViewIfNeeded().catch(() => {});
      await toggle.click();
      await apply.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
    }
  }

  // ── React-select combobox lookup ─────────────────────────────────────

  /**
   * The visible react-select control wrapper for the given label.
   *
   * Restricted to `<label>` (NOT `<div>` text-match) because the container also
   * holds the data grid: `<th>Merchant</th>` column headers would match a
   * generic `*` text predicate and steal the locator. Inside `dataTableContainer`
   * there is exactly one `<label>Merchant</label>` (the filter form), so this
   * is unambiguous.
   */
  private controlByLabel(label: string): Locator {
    // DOM-first (qa1 2026-05-20) — on Open To Buy the Location label is
    // rendered as `<label>Location*</label>` (required-field marker), while
    // every other page uses plain `<label>Location</label>`. Match on
    // `starts-with(...,$label)` so the same call works on both variants.
    //
    // MMH pitfall (qa2 2026-06-19): MMH has a "Merchant Ref Code" text-input
    // label BEFORE "Merchant" in document order. The old ancestor walk
    // (`ancestor-or-self::*[.//*[contains(@class,'filter__control')]][1]`)
    // evaluated the "Merchant Ref Code" label path first — its first ancestor
    // with a filter__control was the whole filter row wrapper, returning Log
    // Type as the first result. Fixed by using `..` (parent of the matching
    // label) instead of the ancestor walk: each filter label's direct parent
    // wraps exactly that filter's control, so the parent scope is unambiguous
    // even when multiple labels share the same `starts-with` prefix.
    return this.container().locator(
      `xpath=.//label[starts-with(normalize-space(.),'${label}')]` +
      `/..//*[contains(@class,'filter__control')]`,
    ).first();
  }

  /** The multi-value-container ("N items selected" text) inside the control. */
  private valueContainerByLabel(label: string): Locator {
    return this.controlByLabel(label).locator(SELECTORS.multiSelectValueContainer);
  }

  /** Clear-all "x" indicator inside the control. */
  private clearIndicatorByLabel(label: string): Locator {
    return this.controlByLabel(label).locator(SELECTORS.filterClearIndicator);
  }

  // ── Open / close the dropdown ────────────────────────────────────────

  /**
   * Opens the dropdown for the given label. Idempotent — does nothing if
   * the dropdown is already open. The dropdown closes automatically after
   * clicking an option (intentional UX), so callers must reopen between picks.
   */
  async openDropdown(label: string): Promise<void> {
    const menu = this.page.locator(SELECTORS.filterMenuPortal).first();
    const alreadyOpen = await menu.isVisible({ timeout: 250 }).catch(() => false);
    if (alreadyOpen) return;

    const control = this.controlByLabel(label);
    await control.scrollIntoViewIfNeeded();
    await control.click({ force: true });
    await menu.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
  }

  /** Closes any open dropdown via Escape. */
  async closeDropdown(): Promise<void> {
    const portal = this.page.locator(SELECTORS.filterMenuPortal);
    if (!(await portal.isVisible({ timeout: 200 }).catch(() => false))) return;
    // After clicking a checkbox option, keyboard focus moves to the option element
    // in the portal — Escape from there does not reach react-select's close handler.
    // Focus the expanded combobox input (scoped to container() to avoid matching
    // unrelated expanded elements elsewhere on the page) so Escape closes correctly.
    await this.container().locator('[aria-expanded="true"]').first().focus().catch(() => {});
    await this.page.keyboard.press('Escape').catch(() => {});
    await portal.waitFor({ state: 'hidden', timeout: 2_000 }).catch(() => {});
  }

  // ── Selecting options ────────────────────────────────────────────────

  /**
   * Selects a single option in the dropdown for the given label.
   * Reopens the dropdown before clicking (handles the close-on-pick behaviour).
   *
   * @param label  - "Merchant" or "Location"
   * @param option - exact visible text of the option to tick
   */
  async selectOption(label: string, option: string): Promise<void> {
    // Capture the pre-pick count so we can wait for the value-container to
    // increment after the click. Fixes the close-on-pick race that surfaced
    // on Overview-bottom (CT-00 run #3 F-012): the portal hid before React
    // had committed the new selection to `filter__value-container`, so the
    // next `getSelectedCount()` call returned 0.
    const beforeCount = await this.getSelectedCount(label);

    await this.openDropdown(label);

    // The option list lives in a portal — match by id prefix + visible text.
    const optionLocator = this.page
      .locator(`${SELECTORS.filterMenuPortal} ${SELECTORS.filterOption}`)
      .filter({ hasText: option })
      .first();
    await optionLocator.waitFor({ state: 'visible', timeout: 5_000 });
    await optionLocator.click({ force: true });

    // Dropdown may close automatically on pick. Wait up to 3s, then force-close via Escape
    // (some react-select configs keep the menu open on checkbox pick).
    await this.page.locator(SELECTORS.filterMenuPortal)
      .waitFor({ state: 'hidden', timeout: 3_000 })
      .catch(() => this.closeDropdown());

    // Wait for the selected-count text to reflect the new pick. Some pages
    // (notably Overview-bottom) re-render the value container slightly after
    // the portal hides; without this poll, subsequent `getSelectedCount` reads
    // can race and return the stale pre-pick value. Polls the value-container
    // text (scoped to this label's control) until "N items selected" with
    // N > beforeCount, or the timeout elapses.
    const targetCount = beforeCount + 1;
    const container = this.valueContainerByLabel(label).first();
    await container.locator(
      `text=/${targetCount}\\s+items?\\s+selected/i`,
    ).first()
      .waitFor({ state: 'visible', timeout: 3_000 })
      .catch(() => {
        // Fall through — assertion-layer will surface a real mismatch.
      });
  }

  /**
   * Selects several options for the given label by reopening the dropdown
   * between each pick. Use for multi-select scenarios.
   */
  async selectOptions(label: string, options: string[]): Promise<void> {
    for (const opt of options) {
      await this.selectOption(label, opt);
    }
  }

  /** Convenience: tick the given merchants. */
  async selectMerchants(merchants: string[]): Promise<void> {
    await this.selectOptions('Merchant', merchants);
  }

  /** Convenience: tick the given locations. */
  async selectLocations(locations: string[]): Promise<void> {
    await this.selectOptions('Location', locations);
  }

  /**
   * Clicks the "Select All" option in the dropdown for the given label.
   * Throws if the option is not present (e.g. New Application page).
   */
  async selectAll(label: string): Promise<void> {
    await this.openDropdown(label);
    const opt = this.page
      .locator(`${SELECTORS.filterMenuPortal} ${SELECTORS.filterOption}`)
      .filter({ hasText: 'Select All' })
      .first();
    await opt.waitFor({ state: 'visible', timeout: 5_000 });
    await opt.click({ force: true });
    await this.page.locator(SELECTORS.filterMenuPortal)
      .waitFor({ state: 'hidden', timeout: 3_000 })
      .catch(() => {});
  }

  /**
   * Returns whether a "Select All" option is present for the given label.
   * Useful for parameterized tests across pages where Select All is intentionally
   * absent (e.g. New Application).
   */
  async hasSelectAll(label: string): Promise<boolean> {
    await this.openDropdown(label);
    const opt = this.page
      .locator(`${SELECTORS.filterMenuPortal} ${SELECTORS.filterOption}`)
      .filter({ hasText: 'Select All' })
      .first();
    const visible = await opt.isVisible({ timeout: 2_000 }).catch(() => false);
    await this.closeDropdown();
    return visible;
  }

  /** Clicks the "x" clear-all indicator inside the given filter control. */
  async clearAll(label: string): Promise<void> {
    const clearX = this.clearIndicatorByLabel(label);
    if (await clearX.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await clearX.click({ force: true });
    }
  }

  // ── Reading filter state ─────────────────────────────────────────────

  /**
   * Reads the count of selected items for the given label via the
   * "N items selected" text rendered in the multi value container.
   * Returns 0 when the container is absent or contains a placeholder.
   */
  async getSelectedCount(label: string): Promise<number> {
    const container = this.valueContainerByLabel(label).first();
    const visible = await container.isVisible({ timeout: 2_000 }).catch(() => false);
    if (!visible) return 0;
    const text = (await container.textContent())?.trim() ?? '';
    const match = /(\d+)\s+items?\s+selected/i.exec(text);
    if (match) return parseInt(match[1]!, 10);
    // Fall back: when the container holds chip-style values.
    const chips = await container.locator(SELECTORS.filterMultiValueLabel).count();
    return chips;
  }

  async getMerchantSelectedCount(): Promise<number> {
    return this.getSelectedCount('Merchant');
  }

  async getLocationSelectedCount(): Promise<number> {
    return this.getSelectedCount('Location');
  }

  /**
   * Returns the names of options currently `checked` in the dropdown for the
   * given label. Side-effect: opens then closes the dropdown.
   *
   * Use this when you need the ACTUAL selected option names — the multi-value
   * container only exposes count text, not the names.
   */
  async getCheckedOptionNames(label: string): Promise<string[]> {
    await this.openDropdown(label);
    const optionRows = this.page.locator(
      `${SELECTORS.filterMenuPortal} ${SELECTORS.filterOption}`,
    );
    const count = await optionRows.count();
    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      const row = optionRows.nth(i);
      const hasNativeChecked = await row.locator('input[type="checkbox"]:checked')
        .first()
        .isVisible({ timeout: 100 })
        .catch(() => false);
      let checked = hasNativeChecked;
      if (!checked) {
        const ariaSelected = await row.getAttribute('aria-selected').catch(() => null);
        if (ariaSelected === 'true') checked = true;
      }
      if (!checked) {
        const cls = (await row.getAttribute('class').catch(() => '')) ?? '';
        if (/is-selected|--is-selected|filter__option--is-selected/.test(cls)) {
          checked = true;
        }
      }
      if (checked) {
        const text = (await row.textContent())?.trim();
        if (text && text !== 'Select All') names.push(text);
      }
    }
    await this.closeDropdown();
    return names;
  }

  /**
   * Returns the total number of options visible in the dropdown for the given
   * label (after the dropdown has been opened). Useful for boundary / select-all
   * assertions. Side-effect: opens then closes the dropdown.
   */
  async countAvailableOptions(label: string): Promise<number> {
    await this.openDropdown(label);
    const count = await this.page
      .locator(`${SELECTORS.filterMenuPortal} ${SELECTORS.filterOption}`)
      .count();
    await this.closeDropdown();
    return count;
  }

  /**
   * Returns the visible option texts in the dropdown for the given label
   * (excluding "Select All"). Side-effect: opens then closes the dropdown.
   * Use to pick options that actually exist in the current page's roster.
   */
  async listAvailableOptions(label: string): Promise<string[]> {
    // Ensure the filter panel is expanded before opening the dropdown — the panel
    // starts collapsed after page navigation on some pages (e.g. ModReport).
    await this.openFilterPanel();
    await this.openDropdown(label);
    const rows = this.page.locator(
      `${SELECTORS.filterMenuPortal} ${SELECTORS.filterOption}`,
    );
    const total = await rows.count();
    const out: string[] = [];
    for (let i = 0; i < total; i++) {
      const t = (await rows.nth(i).textContent())?.trim();
      if (t && t !== 'Select All') out.push(t);
    }
    await this.closeDropdown();
    return out;
  }

  // ── Applying the filter ─────────────────────────────────────────────-

  /**
   * Applies the current filter selection.
   *
   * On pages with a "Search" submit button (Overview-bottom, Rebate, Leads,
   * Merchant list, Merchant Setting, New Application) — clicks the button and
   * waits for the backend listing response BEFORE returning, so callers can
   * read post-filter rows without a stale-snapshot race.
   *
   * On REACTIVE pages (Open To Buy and any future page using on-change apply),
   * there is NO Search button — filtering happens on dropdown close. We
   * dismiss any open dropdown via Escape (defensive — the PO already does this
   * after each option pick) and wait for the spinner to settle. Calling
   * `applySearch()` on reactive pages is a no-op other than the settle wait.
   *
   * # Race fix (F-011, run #3 validator)
   *
   * Previous implementation awaited `tableRow.first().waitFor({state:'visible'})`
   * AFTER the Search click. On pages that open with a populated table
   * (Leads, Merchant list, Overview-bottom), the pre-filter rows are ALREADY
   * visible — so this wait returned IMMEDIATELY with stale data, before the
   * backend POST response arrived. Callers then read 10-25 stale rows and
   * asserted against them, causing CT-03/CT-04/CT-08/CT-09 to fail even though
   * MCP-reproduced backend filtering was correct (`1-1 of 1`).
   *
   * Fix: race the click with `waitForResponse` on the listing endpoint, so the
   * method returns only after the new payload lands. We use a permissive regex
   * covering the 6 listing endpoints consumed by the shared filter widget
   * (Leads, OTB, Rebate, Merchant list, Merchant Setting, New Application).
   * The `.catch` is intentional: reactive pages or client-side paginators may
   * not fire any tracked request — we degrade gracefully to a networkidle wait
   * instead of failing the test on the PO layer.
   *
   * # Why detect submit/reactive at runtime instead of a per-page flag
   *
   * The same shared `MerchantLocationFilters` component is used across 7+ pages
   * and the apply mode is a per-page UX decision (OTB chose reactive; Overview
   * chose explicit Search). Detecting via DOM presence is more robust than
   * carrying a flag through the constructor — any new reactive page will work
   * out-of-the-box, and any new submit-based page will work too.
   */
  async applySearch(): Promise<void> {
    const apply = this.applyButton();
    const submitCount = await apply.count();

    if (submitCount === 0) {
      // Reactive page (e.g. Open To Buy) — no Search button; filter already
      // applied on dropdown close. Close any lingering portal and settle.
      await this.closeDropdown();
      await this.page.waitForLoadState('networkidle').catch(() => {});
      await this.waitForSpinner();
      return;
    }

    // Settle network and ensure the button is in view BEFORE arming the
    // response promise — `waitForResponse` only captures responses that arrive
    // AFTER its registration, so we must drain any in-flight initial fetches
    // first or we risk matching a page-load response instead of the post-click
    // one (the latter is what carries the filtered rows).
    await apply.scrollIntoViewIfNeeded();
    await this.page.waitForLoadState('networkidle').catch(() => {});

    // Race the Search click with the backend listing response. Regex covers
    // the listing endpoints used by every page that consumes the shared widget:
    //   - Leads: getLeadsByCriteria
    //   - Merchant list: getMerchantList / getMerchantsByCriteria
    //   - Open To Buy: openToBuy listing
    //   - Rebate: rebate listing
    //   - Merchant Setting: getMerchantSetting(s)
    //   - New Application: getSendApplicationRequests(ByCriteria)
    //   - Merchant Modification History (#1319): getMerchantDataChangeResults
    //   - Modification Report (#1319): getModifiedLeads
    //   - Funding Queue (#1319): POST /uown/los/getLeadsForFundingQueue [confirmed qa2 2026-06-18]
    //     (generic `funding` token retained as fallback for any future funding endpoint)
    // Permissive matching so any new page wired to the same widget Just Works.
    const responsePromise = this.page.waitForResponse(
      (resp) =>
        /getLeadsByCriteria|getMerchantList|getMerchantsByCriteria|getMerchantSetting|getSendApplicationRequests|openToBuy|rebate|getMerchantDataChangeResults|getModifiedLeads|getLeadsForFundingQueue|funding/i
          .test(resp.url()) && resp.status() === 200,
      { timeout: 15_000 },
    ).catch(() => null);

    await apply.click({ force: true, timeout: 8_000 });

    // Wait for the listing response (if we can match one) BEFORE allowing
    // callers to read row content. Falls back silently to networkidle on
    // pages that don't hit a recognised endpoint.
    await responsePromise;
    await this.page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {});
    await this.waitForSpinner();

    // Final settle: either rows present OR explicit empty-state. Do not gate
    // on row count here — the response-await above already guarantees the
    // backend has responded; this is a defensive wait for React to re-render.
    await this.page.locator(SELECTORS.tableRow).first()
      .waitFor({ state: 'visible', timeout: 5_000 })
      .catch(async () => {
        await this.page.locator('text=There are no records to display')
          .waitFor({ state: 'visible', timeout: 3_000 })
          .catch(() => {});
      });
  }
}

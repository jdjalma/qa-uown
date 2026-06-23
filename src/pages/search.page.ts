import { BasePage } from './base.page.js';
import { SELECTORS } from '../selectors/common.selectors.js';

/**
 * SearchType — the 10 quick-search options exposed in the navbar dropdown.
 *
 * Labels are the exact strings rendered as menu items (case-sensitive). The
 * backend `searchType` query-string parameter mapping is intentionally
 * different between portals:
 *   - Origination (LOS) — uses `InvoiceNum`  for "Invoice #"
 *   - Servicing  (SVC) — uses `InvoiceNumber` for "Invoice #"
 * (Pitfall §13 do SPEC svc#454.) The page object's `searchByType` always
 * targets the UI label; the BFF resolves the backend param.
 *
 * `RefAccountId` and `ContractNumber` are Servicing-only.
 */
export type SearchType =
  | 'Lead #'
  | 'Servicing Account #'
  | 'Phone'
  | 'Email'
  | 'SSN'
  | 'Invoice #'
  | 'UUID'
  | 'Name'
  | 'Last 4 CC'
  | 'Ref Account ID'
  | 'Contract #';

/** Shape returned by `getQuickSearchResults` — subset of `SimpleSearchResult`. */
export interface QuickSearchResultRow {
  leadPk?: number | null;
  accountPk?: number | null;
  customerName?: string | null;
  last4CC?: string | null;
  accountStatus?: string | null;
  contractNumber?: string | null;
  invoiceNumber?: string | null;
  href?: string | null;
}

export class SearchPage extends BasePage {
  // The quick search bar in the top navbar — use the specific #search-input ID
  // (confirmed via MCP snapshot: <input id="search-input" type="search" placeholder="Quick search by Lead #">)
  readonly quickSearchInput = this.page.locator(SELECTORS.searchInput);
  // The desktop wrapper — only renders at ≥992px (Bootstrap `d-lg-block`).
  readonly quickSearchForm = this.page.locator(SELECTORS.quickSearchForm);
  // The search-type toggle anchor — CSS-module prefix-anchored selector (hash suffix unstable).
  readonly searchTypeToggle = this.page.locator(SELECTORS.quickSearchTypeToggle).first();
  readonly searchButton = this.page.locator(SELECTORS.searchButton);
  readonly searchTypeDropdown = this.page.locator(SELECTORS.searchTypeDropdown);
  readonly resultsTable = this.page.locator(SELECTORS.table);
  // The Bootstrap React-Bootstrap dropdown menu opened by the toggle.
  readonly searchTypeMenu = this.page.locator(SELECTORS.quickSearchTypeMenu).first();

  async search(term: string): Promise<void> {
    await this.ensureSearchVisible();
    await this.quickSearchInput.fill(term);
    await this.quickSearchInput.press('Enter');
    await this.waitForSpinner();
  }

  async selectFirstResult(): Promise<void> {
    // Try autocomplete link first (navbar search results as <a href="/customers/...">)
    const autocompleteLink = this.page.locator('nav a[href*="/customers/"]').first();
    const tableRow = this.page.locator(`${SELECTORS.tableRow}:first-child, #row-0`).first();

    if (await autocompleteLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await autocompleteLink.click();
    } else {
      await tableRow.click();
    }
    await this.waitForSpinner();
  }

  /**
   * Ensures the quick search input is visible.
   * If the navbar is collapsed (responsive/mobile), clicks the hamburger toggle first.
   *
   * Origination/Servicing are agent-facing portals that target 1440×900 desktop only
   * (the search form wrapper is `<form class="d-none d-lg-block">`), so the hamburger
   * branch is a safety net for legacy mobile chrome.
   */
  async ensureSearchVisible(): Promise<void> {
    if (await this.quickSearchInput.isVisible({ timeout: 2_000 }).catch(() => false)) return;

    // Fail-fast auth guard. The quick-search input lives in the authenticated
    // navbar; if the SPA loses its in-memory session mid-run (the JWT is held
    // in memory — a full reload or a session expiry drops it) or a protected
    // call 403's, the route-guard unmounts the app and renders the "Merchant
    // Login" shell. The `#search-input` node then resolves once (stale frame)
    // and is immediately detached, producing a misleading
    // `locator.click: element was detached from the DOM` timeout 15s later.
    // Detect the login shell and throw a precise, actionable error instead of
    // letting the caller blame the selector, so the fix is "re-login", not a
    // selector change. (stg 2026-06-23: this surfaced once in a long
    // unified-flow run as a TRANSIENT session loss at Phase 5 — NOT a bad
    // credential. Re-verified live: the `manager` account (jmndes.gow) logs in
    // 200 → /overview and the full quick-search path passes clean with zero
    // 401/403, so the input detach is an in-run session-state flake, not
    // account-scoped auth rejection. CLAUDE.md #15.)
    const onLoginShell = await this.page
      .getByText('Merchant Login', { exact: false })
      .isVisible({ timeout: 1_000 })
      .catch(() => false);
    if (onLoginShell) {
      throw new Error(
        '[SearchPage] Quick search unavailable: the portal redirected to the '
        + `"Merchant Login" page (URL: ${this.page.url()}). The in-memory agent `
        + 'session was lost (session expiry or a full reload dropped the JWT, or a '
        + 'protected call 403\'d) — this is a session/environment issue, NOT a '
        + 'selector failure and NOT necessarily a bad credential. Re-login before '
        + 'using quick search.',
      );
    }

    // Click hamburger/navbar toggle to expand the collapsed nav
    const hamburger = this.page.locator('.navbar-toggler, button[aria-label="Toggle navigation"], nav button.btn').first();
    if (await hamburger.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await hamburger.click();
      // Wait for navbar expansion animation to complete
      await this.quickSearchInput.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
    }

    // Ensure search input is now visible after expansion
    await this.quickSearchInput.waitFor({ state: 'visible', timeout: 10_000 });
  }

  /**
   * Types a search term in the quick search bar, waits for autocomplete
   * results and clicks the first matching link.
   */
  async searchAndSelectFirst(term: string): Promise<void> {
    await this.ensureSearchVisible();
    // Focus the navbar input BEFORE filling. The quick-search autocomplete is a
    // React-controlled component that only renders its results dropdown when the
    // input is the active/focused element. On pages that own their own focus
    // (e.g. the Funding queue, whose filters panel grabs focus), `fill()` alone
    // updates the value and fires the debounced BFF call — `simpleSearch` returns
    // the lead with HTTP 200 — but the dropdown anchor is never rendered, so the
    // `nav a[href*="/customers/"]` waiter times out and navigation silently fails.
    // A `click()` to focus first makes the dropdown render reliably on every page.
    // (DOM-confirmed 2026-06-12 on /funding — without click the anchor stays absent
    //  across 3/3 runs; with click it renders 3/3. CLAUDE.md #15.)
    await this.quickSearchInput.click();
    await this.quickSearchInput.clear();
    await this.quickSearchInput.fill(term);

    // Wait for autocomplete dropdown to appear
    const autocompleteLink = this.page.locator('nav a[href*="/customers/"]').first();
    try {
      await autocompleteLink.waitFor({ state: 'visible', timeout: 5_000 });
      await autocompleteLink.click();
      await this.waitForSpinner();
    } catch {
      // Autocomplete did not appear — fall back to Enter + table row click
      await this.quickSearchInput.press('Enter');
      await this.waitForSpinner();

      // Click the first reference link in the table
      const tableLink = this.page.locator('a[href*="/customers/"]').first();
      if (await tableLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await tableLink.click();
        await this.waitForSpinner();
      }
    }
  }

  /**
   * Selects the search type from the quick search dropdown.
   * Types available: "Lead #", "Servicing Account #", "Phone", "Email",
   * "SSN", "Invoice #", "UUID", "Name", "Last 4 CC", and Servicing-only
   * "Ref Account ID" / "Contract #".
   *
   * Robust against the CSS-module hash flipping between webpack builds — the
   * toggle locator anchors on the `searchType__toggle` prefix (see
   * `SELECTORS.quickSearchTypeToggle`). The menu uses `role="menuitem"` so we
   * target via `getByRole('menuitem', { exact })` for accessibility-stable
   * selection.
   */
  async selectSearchType(type: SearchType | string): Promise<void> {
    await this.ensureSearchVisible();

    // Path A: real toggle anchor (svc#454 — Origination + Servicing desktop).
    if (await this.searchTypeToggle.isVisible({ timeout: 2_000 }).catch(() => false)) {
      // Skip the click when the toggle already shows the requested type — clicking
      // again would toggle the menu CLOSED.
      const current = ((await this.searchTypeToggle.textContent()) ?? '').trim();
      if (current.toLowerCase() !== type.toLowerCase()) {
        await this.searchTypeToggle.click();
        // Wait for the React-Bootstrap dropdown to open.
        await this.searchTypeMenu.waitFor({ state: 'visible', timeout: 3_000 }).catch(() => {});
        const item = this.page.getByRole('menuitem', { name: type, exact: true }).first();
        await item.click();
      }
      return;
    }

    // Path B: legacy `#search-type-dropdown` (kept for tests that still use it).
    if (await this.searchTypeDropdown.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await this.searchTypeDropdown.click();
      await this.page.locator(`button:has-text("${type}")`).click();
    }
  }

  /**
   * Opens the searchType dropdown, picks `type`, then fires the quick search
   * for `input` WITHOUT navigating. Returns once the autocomplete result list
   * is rendered (or 5s elapsed).
   *
   * Why we don't rely on `quickSearchInput.fill()` alone for autocomplete: the
   * navbar uses a React-controlled input, and `.fill()` occasionally fails to
   * dispatch the `input` event React listens to (the native value setter is
   * patched). Forcing the React-aware setter via DOM evaluate makes the
   * controlled state reliably observe the new value and trigger the debounced
   * BFF call.
   */
  async searchByType(type: SearchType | string, input: string): Promise<void> {
    await this.selectSearchType(type);
    await this.quickSearchInput.click();
    // Clear any stale value first — React onChange triggers on each clear too.
    await this.quickSearchInput.fill('');
    await this.forceReactInputValue(SELECTORS.searchInput, input);
    // Some autocomplete components also listen for `change` after blur; ensure
    // we don't immediately blur (the network request fires on debounced input).
  }

  /**
   * Forces a value into a React-controlled `<input>` and dispatches the
   * native `input` event that React's synthetic-event layer listens to. This
   * is needed because `page.fill()` can leave React's internal state stale
   * for some controlled inputs (observed live in qa1 on `#search-input`).
   */
  async forceReactInputValue(selector: string, value: string): Promise<void> {
    await this.page.evaluate(
      ([sel, val]) => {
        const input = document.querySelector(sel) as HTMLInputElement | null;
        if (!input) return;
        const setter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value',
        )?.set;
        if (setter) setter.call(input, val);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      },
      [selector, value] as const,
    );
  }

  /**
   * Reads the rendered autocomplete result rows. Tries the live MobX store
   * first (`searchStore.quickSearchResults`) since that's the SoT — falling
   * back to scraping the DOM if the store isn't exposed on `window`.
   *
   * Returns `[]` when the dropdown hasn't rendered any rows yet — callers
   * should poll/`expect.poll(...)` rather than retry inside the page object.
   */
  async getQuickSearchResults(): Promise<QuickSearchResultRow[]> {
    // Attempt MobX store path first.
    const fromStore = await this.page.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any;
      // Several entry points have been observed; try each in order.
      const stores = [
        w.searchStore,
        w.stores?.searchStore,
        w.__stores__?.searchStore,
        w.mobxStores?.searchStore,
      ];
      for (const s of stores) {
        if (s && Array.isArray(s.quickSearchResults)) {
          return s.quickSearchResults as Array<Record<string, unknown>>;
        }
      }
      return null;
    });

    if (Array.isArray(fromStore) && fromStore.length > 0) {
      return fromStore.map((r) => ({
        leadPk: (r.leadPk as number | null) ?? null,
        accountPk: (r.accountPk as number | null) ?? null,
        customerName: (r.customerName as string | null) ?? null,
        last4CC: (r.last4CC as string | null) ?? null,
        accountStatus: (r.accountStatus as string | null) ?? null,
        contractNumber: (r.contractNumber as string | null) ?? null,
        invoiceNumber: (r.invoiceNumber as string | null) ?? null,
      }));
    }

    // DOM fallback — scrape the autocomplete anchors. We can recover the
    // leadPk from the href (`/customer-information/{leadPk}` is the canonical
    // route in both portals) and the customer name from the rendered text.
    const fromDom = await this.page.evaluate(
      ([resultSel]) => {
        const anchors = Array.from(
          document.querySelectorAll<HTMLAnchorElement>(resultSel),
        );
        return anchors.map((a) => {
          const href = a.getAttribute('href') ?? '';
          const m = href.match(/\/customer-information\/(\d+)|\/customers\/(\d+)/);
          const leadPk = m ? Number(m[1] ?? m[2]) : null;
          return {
            href,
            leadPk,
            customerName: (a.textContent ?? '').trim() || null,
          };
        });
      },
      [SELECTORS.quickSearchAutocompleteResult] as const,
    );

    return fromDom.map((r) => ({
      leadPk: r.leadPk,
      accountPk: null,
      customerName: r.customerName,
      last4CC: null,
      accountStatus: null,
      contractNumber: null,
      invoiceNumber: null,
      href: r.href,
    }));
  }

  /**
   * Asserts no two rows in `rows` share the same non-null `leadPk`. Used by
   * the dedup CTs (UI-09 — lead 4019 has 26 CCs; must collapse to 1 row).
   *
   * Returns the offending duplicate `leadPk` (if any) for a richer assertion
   * message — caller does the `expect(...)`.
   */
  expectNoDuplicateLeadPk(
    rows: ReadonlyArray<{ leadPk?: number | null }>,
  ): { duplicate: number | null; counts: Map<number, number> } {
    const counts = new Map<number, number>();
    for (const r of rows) {
      if (r.leadPk == null) continue;
      counts.set(r.leadPk, (counts.get(r.leadPk) ?? 0) + 1);
    }
    let duplicate: number | null = null;
    for (const [pk, n] of counts.entries()) {
      if (n > 1) {
        duplicate = pk;
        break;
      }
    }
    return { duplicate, counts };
  }

  async applyFilters(filters: Record<string, string>): Promise<void> {
    for (const [filterName, filterValue] of Object.entries(filters)) {
      const filterControl = this.page.locator(`#${filterName}, [data-filter="${filterName}"]`);
      if (await filterControl.isVisible()) {
        await this.selectReactOption(`#${filterName}`, filterValue);
      }
    }
  }

  async getResultCount(): Promise<number> {
    const rows = this.page.locator(SELECTORS.tableRow);
    return rows.count();
  }

  /**
   * Tests multiple quick search strategies (by Lead, Account, Email, Name).
   * Mirrors UownOverviewSteps.testMerchantPortalQuickSearchMethods() from the Java project.
   */
  async testQuickSearchMethods(searchCriteria: {
    leadPk?: string;
    accountPk?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  }, reauth?: () => Promise<void>): Promise<void> {
    const searchTypes: Array<{ type: SearchType; value: string }> = [];

    if (searchCriteria.leadPk) {
      searchTypes.push({ type: 'Lead #', value: searchCriteria.leadPk });
    }
    if (searchCriteria.accountPk) {
      searchTypes.push({ type: 'Servicing Account #', value: searchCriteria.accountPk });
    }
    if (searchCriteria.email) {
      searchTypes.push({ type: 'Email', value: searchCriteria.email });
    }
    if (searchCriteria.firstName) {
      searchTypes.push({ type: 'Name', value: searchCriteria.firstName });
    }
    if (searchCriteria.lastName) {
      searchTypes.push({ type: 'Name', value: searchCriteria.lastName });
    }

    for (const { type, value } of searchTypes) {
      // Optional per-iteration session refresh. On portals with a short-lived
      // session (stg origination, ~60-90s) this whole loop outlives one session,
      // so callers pass a reauth closure (re-login + re-navigate) to mint a fresh
      // session before each search and land authenticated with the navbar present.
      if (reauth) await reauth();
      await this.selectSearchType(type);
      await this.searchAndSelectFirst(value);
      // Navigate back to allow next search
      await this.page.goBack();
      await this.waitForSpinner();
    }
  }
}

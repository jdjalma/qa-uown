import { type Download, type Locator, type Page } from '@playwright/test';
import { ServicingBasePage } from './servicing-base.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';
import { ConfigEnvironment } from '../../config/environment.js';

/**
 * Servicing — Customer Details Documents tab.
 *
 * URL: `${servicingUrl}/documents/{accountPk}`
 *
 * Source of truth (servicing FE repo, sibling checkout):
 *   - `pages/documents/[account].tsx`  → fetches docs via `documentStore.getDocumentsInfo()`
 *   - `components/document-information/index.tsx`  → renders `<PageName name="Documents" />`,
 *      `<Input id="filterDocuments" />`, ADD NEW button, and `<DataTable ...>` (react-data-table-component)
 *   - `utils/data-table-columns.tsx#documentsInfoTableColumns`  → defines columns:
 *      0=Date, 1=Type, 2=File Name, 3=Link Used Count, 4=Payment Made, 5=Description, 6=Actions
 *      The actions cell exposes `<div id="download">`, `<div id="edit">`, `<div id="resend">` —
 *      the SAME ids appear on every row, so they MUST be scoped via the row Locator.
 *
 * Important behavior:
 *   - The "File Name" cell is rendered by `<DocumentsTitle title={fileName} />` which truncates
 *     to 31 chars with `...` on desktop and exposes the full filename via the HTML `title=""`
 *     attribute. Substring matching against the row text is therefore the safest strategy.
 *   - Clicking the download icon calls `window.open(row.fileTempLink, '_blank')` — this opens a
 *     NEW TAB; the actual `Download` event fires inside that popup once the browser receives
 *     the binary response. {@link downloadDocument} handles both cases (popup → download or
 *     same-page download), since some environments may rewrite to a direct download.
 */
export class ServicingDocumentsPage extends ServicingBasePage {
  readonly searchInput: Locator = this.page.locator(SELECTORS.svcDocumentsSearchInput);
  readonly addNewButton: Locator = this.page.locator(SELECTORS.svcDocumentsAddNewButton);
  readonly documentsRows: Locator = this.page.locator(SELECTORS.svcDocumentsTableRow);
  readonly emptyState: Locator = this.page.locator(SELECTORS.svcDocumentsEmptyState);
  readonly pageTitle: Locator = this.page.locator(SELECTORS.svcDocumentsPageTitle);

  constructor(page: Page) {
    super(page);
  }

  // ── Navigation ───────────────────────────────────────────────────────

  /**
   * Navigate directly to `/documents/{accountPk}` and wait for the documents table
   * (or empty state) to render. Use this when the test already has the accountPk.
   */
  async goto(accountPk: number | string): Promise<void> {
    const env = new ConfigEnvironment(process.env.ENV || 'sandbox');
    const baseUrl = env.servicingUrl.replace(/\/$/, '');
    await this.page.goto(`${baseUrl}/documents/${accountPk}`, { waitUntil: 'domcontentloaded' });
    await this.waitForLoaded();
  }

  /**
   * Open the Documents tab from the left sidebar. Use this when the customer page
   * is already loaded (e.g. after `ServicingCustomerPage.navigateToCustomer()`).
   * Reuses the inherited `sidebarDocuments` Locator from `ServicingBasePage`.
   */
  async openDocumentsTab(): Promise<void> {
    await this.waitForSpinner();
    await this.sidebarDocuments.click();
    await this.waitForLoaded();
  }

  /**
   * Wait until the documents table has finished loading. Returns once either:
   *  - At least one `.rdt_TableRow` is present, or
   *  - The "There are no records to display" empty state is visible, or
   *  - The 30s ceiling is reached (defers final assertions to the test).
   *
   * Filters out the spinner first; some environments keep the spinner visible
   * after the API returns, so we ALSO race against the row/empty state to
   * avoid false negatives.
   */
  async waitForLoaded(): Promise<void> {
    await this.waitForSpinner();
    await Promise.race([
      this.documentsRows.first().waitFor({ state: 'visible', timeout: 30_000 }).catch(() => null),
      this.emptyState.first().waitFor({ state: 'visible', timeout: 30_000 }).catch(() => null),
    ]);
  }

  // ── Queries ──────────────────────────────────────────────────────────

  /** Number of currently rendered document rows (respects the in-page search filter). */
  async getDocumentRowsCount(): Promise<number> {
    return this.documentsRows.count();
  }

  /**
   * Substring match against a row's text content (case-insensitive). Returns the FIRST match.
   *
   * Use this when the document name is partial OR when the filename is longer than 31 chars
   * and the visible text is truncated to `Lease Agreem...` — the substring still matches against
   * the cell's `title=""` attribute and other text in the row.
   *
   * NOTE: returns the Locator without an existence check. Call `.count()` or
   * {@link hasDocument} first if existence matters.
   */
  async findRowByName(name: string): Promise<Locator> {
    return this.documentsRows.filter({ hasText: name }).first();
  }

  /**
   * Strict match by document number/identifier substring. Currently delegates to the same
   * filter as {@link findRowByName} but kept as a separate method to allow future tightening
   * (e.g. matching only against a Document ID column when one is added to the table).
   */
  async getRowByDocumentNumber(docNumber: string): Promise<Locator> {
    return this.documentsRows.filter({ hasText: docNumber }).first();
  }

  /** True when at least one row matches the given name substring (case-insensitive). */
  async hasDocument(name: string): Promise<boolean> {
    const matches = await this.documentsRows.filter({ hasText: name }).count();
    return matches > 0;
  }

  /**
   * Convenience: read the trimmed, whitespace-collapsed text of a row by name (substring match).
   * Useful for asserting the Date / Type / Description cells after locating a row.
   * Throws if no row matches.
   */
  async getRowText(name: string): Promise<string> {
    const row = await this.findRowByName(name);
    if ((await row.count()) === 0) {
      throw new Error(`[ServicingDocuments] No row matching "${name}"`);
    }
    const raw = (await row.textContent()) ?? '';
    return raw.replace(/\s+/g, ' ').trim();
  }

  /**
   * Filter the visible rows via the in-page search input (`#filterDocuments`).
   * The input filters by ANY field including the formatted timestamp.
   */
  async filterByText(query: string): Promise<void> {
    await this.searchInput.fill(query);
    // Filtering is client-side and synchronous in the React source — no spinner, no debounce.
    // A single repaint frame is enough to flush the filter; using waitForTimeout would violate
    // the no-arbitrary-wait rule, so we anchor against the row count or the empty state.
    await Promise.race([
      this.documentsRows.first().waitFor({ state: 'visible', timeout: 5_000 }).catch(() => null),
      this.emptyState.first().waitFor({ state: 'visible', timeout: 5_000 }).catch(() => null),
    ]);
  }

  /** Clear the search/filter input and let the full list re-render. */
  async clearFilter(): Promise<void> {
    await this.searchInput.fill('');
    await this.documentsRows.first().waitFor({ state: 'visible', timeout: 5_000 }).catch(() => null);
  }

  // ── Actions ──────────────────────────────────────────────────────────

  /**
   * Trigger the download icon for the row matching `name` (substring) and return the
   * resulting Playwright `Download` object.
   *
   * Implementation note: in the FE source the click handler is
   * `() => window.open(row.fileTempLink, '_blank')` — this opens a NEW TAB, and the
   * actual binary fetch in that tab fires the `download` event on the popup page.
   * We therefore race both:
   *   - `context.waitForEvent('page')` → popup → wait for popup's `download` event
   *   - `page.waitForEvent('download')` → in case the env rewrites to a same-page download
   * whichever resolves first wins. The popup is closed automatically once the download
   * begins (browsers typically auto-close it, but we close it explicitly as a safety net).
   *
   * @param name substring of the document name (e.g. "Lease Agreement", "CA_2025_SAC_jewelry")
   */
  async downloadDocument(name: string): Promise<Download> {
    const row = await this.findRowByName(name);
    if ((await row.count()) === 0) {
      throw new Error(`[ServicingDocuments] Cannot download — no row matching "${name}"`);
    }
    await row.scrollIntoViewIfNeeded().catch(() => {});

    const downloadTrigger = row.locator(SELECTORS.svcDocumentsRowDownloadTrigger).first();
    await downloadTrigger.waitFor({ state: 'visible', timeout: 10_000 });

    // Race popup-bound download against same-page download. We must register both listeners
    // BEFORE the click to avoid losing fast-firing events.
    const popupPromise = this.page.context().waitForEvent('page', { timeout: 15_000 }).catch(() => null);
    const sameTabDownloadPromise = this.page.waitForEvent('download', { timeout: 15_000 }).catch(() => null);

    await downloadTrigger.click();

    const sameTabDownload = await Promise.race([
      sameTabDownloadPromise,
      popupPromise.then(async (popup) => {
        if (!popup) return null;
        try {
          const dl = await popup.waitForEvent('download', { timeout: 15_000 });
          await popup.close().catch(() => {});
          return dl;
        } catch {
          await popup.close().catch(() => {});
          return null;
        }
      }),
    ]);

    if (!sameTabDownload) {
      throw new Error(`[ServicingDocuments] Download for "${name}" did not start within 15s`);
    }
    return sameTabDownload;
  }

  /**
   * Open the document in the in-app viewer. The current Servicing FE wires the download
   * icon to `window.open(...)` rather than an explicit "View" action, so this method
   * performs the same click but returns the popup `Page` reference (the new tab) instead
   * of the Download object. Use this to inspect rendered PDF content via the popup URL.
   *
   * TODO: validate selector against live portal — confirm whether a dedicated "View"
   * trigger is added in a later iteration of `document-information/index.tsx`. If yes,
   * replace the click target with the dedicated trigger.
   */
  async openDocumentInViewer(name: string): Promise<void> {
    const row = await this.findRowByName(name);
    if ((await row.count()) === 0) {
      throw new Error(`[ServicingDocuments] Cannot open viewer — no row matching "${name}"`);
    }
    await row.scrollIntoViewIfNeeded().catch(() => {});

    const trigger = row.locator(SELECTORS.svcDocumentsRowDownloadTrigger).first();
    const popupPromise = this.page.context().waitForEvent('page', { timeout: 15_000 }).catch(() => null);
    await trigger.click();

    const popup = await popupPromise;
    if (popup) {
      // Caller-side viewer assertions can locate the popup via this.page.context().pages().
      await popup.waitForLoadState('domcontentloaded').catch(() => {});
    }
  }
}

/**
 * Re-export of selector keys used by this page object. Intentionally references the central
 * `SELECTORS` const so test authors can read the live values without re-declaring strings.
 */
export const SERVICING_DOCUMENTS_SELECTORS = {
  pageTitle: SELECTORS.svcDocumentsPageTitle,
  searchInput: SELECTORS.svcDocumentsSearchInput,
  addNewButton: SELECTORS.svcDocumentsAddNewButton,
  tableRow: SELECTORS.svcDocumentsTableRow,
  tableCell: SELECTORS.svcDocumentsTableCell,
  emptyState: SELECTORS.svcDocumentsEmptyState,
  rowDownloadTrigger: SELECTORS.svcDocumentsRowDownloadTrigger,
  rowEditTrigger: SELECTORS.svcDocumentsRowEditTrigger,
  rowResendTrigger: SELECTORS.svcDocumentsRowResendTrigger,
} as const;

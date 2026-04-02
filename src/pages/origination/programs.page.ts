import { type Locator, expect } from '@playwright/test';
import { OriginationBasePage } from './origination-base.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';
import { getTableHeaders, selectMaxRowsPerPage, goToNextPage } from '../../helpers/table.helpers.js';

/**
 * Programs page — Origination portal (/programs).
 * Manages merchant programs table with Processing Fee and Amount at Signed columns.
 */
export class ProgramsPage extends OriginationBasePage {
  readonly programTable: Locator = this.page.locator(SELECTORS.table);

  async navigateToPrograms(originationUrl: string): Promise<void> {
    await this.page.goto(`${originationUrl}programs`, { waitUntil: 'domcontentloaded' });
    await this.waitForPageLoad();
    // Wait for table rows to appear — DataTable has its own async loading state
    await this.page.locator(SELECTORS.tableRow).first().waitFor({ state: 'visible', timeout: 30_000 });
    // Show max rows per page to reduce pagination iterations (1817 rows → 18 pages at 100/page vs 182 at 10/page)
    await this.showMaxRows();
    // Wait for network to settle and DataTable to reload with new rows-per-page setting
    await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    await this.page.locator(SELECTORS.tableRow).first().waitFor({ state: 'visible', timeout: 30_000 });
  }

  /** Returns cleaned headers (sort indicators stripped). */
  async getCleanHeaders(): Promise<string[]> {
    const raw = await getTableHeaders(this.page);
    return raw.map(h => h.replace(/[▲▼△▽↑↓]/g, '').trim());
  }

  /** Selects max rows per page to reduce pagination. */
  async showMaxRows(): Promise<void> {
    const dropdown = this.page.locator(SELECTORS.rowsPerPageDropdown);
    if (await dropdown.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const options = await dropdown.locator('option').allTextContents();
      if (options.length > 0) {
        await dropdown.selectOption({ index: options.length - 1 });
        await this.waitForSpinner();
      }
    }
  }

  /** Navigates to the first page of the table. */
  private async goToFirstPage(): Promise<void> {
    const firstPageBtn = this.page.locator('button[aria-label="First Page"], button:has-text("|<")').first();
    if (await firstPageBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      if (await firstPageBtn.isEnabled()) {
        await firstPageBtn.click();
        await this.waitForSpinner();
      }
    }
  }

  /** Finds a program row by name across all pages. Returns cell values keyed by header. */
  async findProgramRow(programName: string): Promise<Record<string, string> | null> {
    const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();
    const target = normalize(programName);
    await this.goToFirstPage();
    // Wait for DataTable to finish loading after potential page navigation
    await this.page.locator(SELECTORS.tableRow).first().waitFor({ state: 'visible', timeout: 30_000 });

    do {
      const headers = await this.getCleanHeaders();
      const nameCol = headers.findIndex(h => h === 'Program Name');
      if (nameCol === -1) return null;

      const rows = this.page.locator(SELECTORS.tableRow);
      const count = await rows.count();
      for (let i = 0; i < count; i++) {
        const cells = await rows.nth(i).locator(SELECTORS.tableCell).allTextContents();
        if (normalize(cells[nameCol] || '') === target) {
          const found: Record<string, string> = {};
          headers.forEach((h, idx) => {
            found[h || `#empty-${idx + 1}`] = cells[idx]?.trim() || '';
          });
          return found;
        }
      }
    } while (await this.nextPage());

    return null;
  }

  /** Clicks the program name link to navigate to the edit page. Uses pagination. */
  async clickProgramLink(programName: string): Promise<void> {
    const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();
    const target = normalize(programName);
    await this.goToFirstPage();
    // Wait for DataTable to finish loading after potential page navigation
    await this.page.locator(SELECTORS.tableRow).first().waitFor({ state: 'visible', timeout: 30_000 });

    do {
      const headers = await this.getCleanHeaders();
      const nameCol = headers.findIndex(h => h === 'Program Name');

      const rows = this.page.locator(SELECTORS.tableRow);
      const count = await rows.count();
      for (let i = 0; i < count; i++) {
        const cells = await rows.nth(i).locator(SELECTORS.tableCell).allTextContents();
        const cellName = normalize(cells[nameCol] || '');
        if (cellName === target) {
          const nameCell = rows.nth(i).locator(SELECTORS.tableCell).nth(nameCol);
          const link = nameCell.locator('a').first();
          if (await link.isVisible({ timeout: 2_000 }).catch(() => false)) {
            await link.click();
          } else {
            await nameCell.click();
          }
          await this.waitForSpinner();
          return;
        }
      }
    } while (await this.nextPage());
  }

  /** Navigates to the next page. Returns false if no next page. */
  private async nextPage(): Promise<boolean> {
    // Try rdt pagination button first, then standard pagination
    const nextBtn = this.page.locator(
      `${SELECTORS.paginationNext}, button[aria-label="Next Page"], button:has-text(">"):not(:has-text(">>"))`,
    ).first();
    if (await nextBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      if (await nextBtn.isEnabled()) {
        await nextBtn.click();
        await this.waitForSpinner();
        // Wait for network to settle (DataTable fetches next page), then wait for rows to appear
        await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
        await this.page.locator(SELECTORS.tableRow).first().waitFor({ state: 'visible', timeout: 30_000 });
        return true;
      }
    }
    return false;
  }

  /** Fills a currency-masked input: triple-click to select all, then type the value. */
  private async fillCurrencyInput(selector: string, value: string): Promise<void> {
    const input = this.page.locator(selector);
    await input.waitFor({ state: 'visible', timeout: 10_000 });
    await input.click({ clickCount: 3 }); // select all existing text
    await input.fill(value);
  }

  /** Fills the Processing Fee input in the edit form. */
  async fillProcessingFee(value: string): Promise<void> {
    await this.fillCurrencyInput("input[name='processingFeeOverride']", value);
  }

  /** Fills the Amount at Signed input in the edit form. */
  async fillAmountAtSigned(value: string): Promise<void> {
    await this.fillCurrencyInput("input[name='amountChargedAtSigning']", value);
  }

  /** Clicks SAVE and waits for spinner. Returns to programs list if still on edit. */
  async saveProgram(): Promise<void> {
    const saveBtn = this.page.getByRole('button', { name: 'SAVE', exact: true });
    await saveBtn.scrollIntoViewIfNeeded();
    await this.clickAndWaitForSpinner(saveBtn);
  }

  /** Gets column min-width for a header by name. Traverses to parent rdt_TableCol. */
  async getColumnWidth(headerName: string): Promise<string> {
    const headers = this.page.locator(SELECTORS.tableHeader);
    const count = await headers.count();
    for (let i = 0; i < count; i++) {
      const text = (await headers.nth(i).textContent() || '').replace(/[▲▼△▽↑↓]/g, '').trim();
      if (text === headerName) {
        const parent = headers.nth(i).locator('..');
        return (await parent.evaluate(el => getComputedStyle(el).minWidth)) || '';
      }
    }
    return '';
  }

  // ── Task #1251 — Money Factor Format ────────────────────────────────

  /** Returns the Money Factor column value for a given program from the table. */
  async getMoneyFactorTableValue(programName: string): Promise<string> {
    const row = await this.findProgramRow(programName);
    if (!row) return '';
    return row['Money Factor'] ?? '';
  }

  /** Returns the Money Factor input value from the program edit form. */
  async getMoneyFactorFormValue(): Promise<string> {
    const moneyFactorInput = this.page.locator("input[name='moneyFactor']");
    await moneyFactorInput.waitFor({ state: 'visible', timeout: 10_000 });
    return moneyFactorInput.inputValue();
  }

  // ── Task #1252 — Program Details Page ───────────────────────────────

  /** Navigates directly to a program's detail page by its PK. */
  async navigateToProgramDetails(originationUrl: string, programPk: string | number): Promise<void> {
    await this.page.goto(`${originationUrl}programs/${programPk}`, { waitUntil: 'domcontentloaded' });
    await this.waitForPageLoad();
  }

  /** Returns the program name from the edit form input. */
  async getProgramNameFromForm(): Promise<string> {
    const programNameInput = this.page.locator("input[name='programName']");
    await programNameInput.waitFor({ state: 'visible', timeout: 10_000 });
    return programNameInput.inputValue();
  }

  /** Checks whether the Clone button (single program clone) is visible on the details page. */
  async isCloneButtonVisible(): Promise<boolean> {
    // Clone is rendered as an <a> link (not a button) with a dropdown icon — match either, exclude "Clone Group"
    return this.page
      .locator('button, a')
      .filter({ hasText: /^Clone/i })
      .filter({ hasNotText: /group/i })
      .first()
      .isVisible({ timeout: 3_000 })
      .catch(() => false);
  }

  /** Checks whether the Clone Group button is visible on the details page. */
  async isCloneGroupButtonVisible(): Promise<boolean> {
    return this.page
      .getByRole('button', { name: 'Clone Group', exact: true })
      .isVisible({ timeout: 3_000 })
      .catch(() => false);
  }

  /** Checks whether the Activity Log (Notes) panel is visible on the details page.
   *  In the Programs details page, the ActivityLogPanel component renders as "Notes"
   *  with a Filters toggle button. The Filters button is the reliable structural indicator.
   */
  async isActivityLogPanelVisible(): Promise<boolean> {
    return this.page
      .getByRole('button', { name: /Filters/i })
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false);
  }

  /**
   * Waits for the program details page to load.
   * Returns true when the backend populated form data, false if the API is unavailable (form stays empty).
   */
  async waitForProgramDetailsLoad(): Promise<boolean> {
    const input = this.page.locator("input[name='programName']");
    await input.waitFor({ state: 'visible', timeout: 15_000 });
    // Give the backend up to 5s to populate the form; return false if it stays empty
    return expect(input).not.toHaveValue('', { timeout: 5_000 }).then(() => true).catch(() => false);
  }

  // ── Task #1214 — Enforce Pagination After Clone ─────────────────────

  /** Opens the Clone Group modal by clicking the "Clone Group" button. */
  async openCloneGroupModal(): Promise<void> {
    await this.page.getByRole('button', { name: 'Clone Group', exact: true }).click();
    await this.page.getByText('Clone Program Group').waitFor({ state: 'visible', timeout: 10_000 });
  }

  /** Fills the "New Program Group Name" input in the Clone Group modal. */
  async fillCloneGroupName(name: string): Promise<void> {
    const input = this.page.locator("input[name='programGroupName']");
    await input.waitFor({ state: 'visible', timeout: 5_000 });
    await input.click({ clickCount: 3 });
    await input.fill(name);
  }

  /** Clicks the "Select All" checkbox in the Clone Group modal. */
  async selectAllProgramsInModal(): Promise<void> {
    const checkbox = this.page.locator("input[name='selectAll']");
    await checkbox.waitFor({ state: 'visible', timeout: 5_000 });
    await checkbox.check();
  }

  /** Clicks the SAVE button in the Clone Group modal to submit the clone. */
  async submitCloneGroupModal(): Promise<void> {
    const modal = this.page.locator('.modal, [role="dialog"]').filter({ hasText: 'Clone Program Group' });
    await modal.getByRole('button', { name: 'SAVE', exact: true }).click();
    await this.waitForSpinner();
  }

  /** Waits for the clone success toast "Programs successfully cloned!". */
  async waitForCloneGroupSuccess(): Promise<void> {
    await this.page.getByText('Programs successfully cloned!').waitFor({ state: 'visible', timeout: 15_000 });
  }

  /** Returns the number of visible rows in the programs table. */
  async getTableRowCount(): Promise<number> {
    return this.page.locator(SELECTORS.tableRow).count();
  }

  /** Returns the selected value of the rows-per-page dropdown. */
  async getRowsPerPageValue(): Promise<string> {
    const dropdown = this.page.locator(SELECTORS.rowsPerPageDropdown);
    await dropdown.waitFor({ state: 'visible', timeout: 5_000 });
    return dropdown.inputValue();
  }
}

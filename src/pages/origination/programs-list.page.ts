import { type Page, type Locator } from '@playwright/test';
import { OriginationBasePage } from './origination-base.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';

/**
 * Programs List page — Origination portal (/programs).
 *
 * Left pane of the 2-pane layout. Lists merchant programs with
 * Search + Program Groups filters. Clicking a program row opens
 * the ProgramDetails panel on the right.
 *
 * Feature: Schedule Program Activation and Deactivation Dates.
 *
 * @see ProgramDetailsPage — opened on row click / ADD NEW PROGRAM click
 */
export class ProgramsListPage extends OriginationBasePage {
  readonly sectionHeader: Locator = this.page.locator(SELECTORS.plSectionHeader);
  readonly addNewProgramButton: Locator = this.page.locator(SELECTORS.plAddNewProgramBtn);
  readonly searchInput: Locator = this.page.locator(SELECTORS.plSearchInput).first();
  readonly groupFilterDropdown: Locator = this.page.locator(SELECTORS.plGroupFilterDropdown).first();
  readonly searchButton: Locator = this.page.locator(SELECTORS.plSearchButton).first();
  readonly tableRow: Locator = this.page.locator(SELECTORS.plTableRow);
  readonly paginationFooter: Locator = this.page.locator(SELECTORS.plPaginationFooter);
  readonly filtersButton: Locator = this.page.locator(SELECTORS.filtersButton).first();

  constructor(page: Page) {
    super(page);
  }

  // --- Navigation ---

  /** Navigates to the Programs list page and waits for the page to be interactive. */
  async goto(originationUrl: string): Promise<void> {
    await this.page.goto(`${originationUrl}programs`, { waitUntil: 'domcontentloaded' });
    await this.waitForPageReady();
  }

  /** Alias for goto() kept for naming symmetry with other pages. */
  async navigate(originationUrl: string): Promise<void> {
    await this.goto(originationUrl);
  }

  /**
   * Waits for the Programs page to be interactive (section chrome visible + spinner cleared).
   * State-agnostic: does NOT require any row to be present, so it is safe to call regardless of
   * whether the logged merchant has any programs or whether a previous run left a filter active.
   *
   * Tests that need to interact with actual program rows must call {@link waitForFirstRow}.
   */
  async waitForPageReady(): Promise<void> {
    await this.waitForPageLoad();
    await this.addNewProgramButton.waitFor({ state: 'visible', timeout: 30_000 });
  }

  /**
   * Waits for at least one program row to be visible in the table.
   * Call this only from tests that require existing programs to interact with.
   */
  async waitForFirstRow(timeoutMs: number = 30_000): Promise<void> {
    await this.tableRow.first().waitFor({ state: 'visible', timeout: timeoutMs });
  }

  /**
   * @deprecated Prefer {@link waitForPageReady} (no row requirement) or {@link waitForFirstRow}
   * (explicit row wait). Retained for backward compatibility with callers that still expect the
   * old combined behavior.
   */
  async waitForTableLoad(): Promise<void> {
    await this.waitForPageReady();
    await this.waitForFirstRow();
  }

  // --- Filters ---

  /**
   * Expands the filters collapse panel if currently collapsed.
   * The `/programs` page ships with filters hidden behind a Filters toggle;
   * the Search input + Program Groups dropdown are inside a `.collapse`
   * container that needs to be opened before they become visible.
   *
   * Idempotent — if the panel is already open, returns without clicking.
   */
  async expandFilters(): Promise<void> {
    const alreadyOpen = await this.searchInput
      .isVisible({ timeout: 1_000 })
      .catch(() => false);
    if (alreadyOpen) return;
    await this.filtersButton.waitFor({ state: 'visible', timeout: 10_000 });
    await this.filtersButton.click();
    await this.searchInput.waitFor({ state: 'visible', timeout: 5_000 });
  }

  /** Types into the Search filter and clicks Search. */
  async searchProgram(name: string): Promise<void> {
    await this.expandFilters();
    await this.searchInput.waitFor({ state: 'visible', timeout: 10_000 });
    await this.searchInput.fill(name);
    if (await this.searchButton.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await this.clickAndWaitForSpinner(this.searchButton);
    } else {
      await this.searchInput.press('Enter');
      await this.waitForSpinner();
    }
  }

  /** Selects a program group from the dropdown and triggers the filter. */
  async filterByGroup(groupName: string): Promise<void> {
    await this.groupFilterDropdown.click();
    const option = this.page.locator(SELECTORS.filterOption).filter({ hasText: groupName }).first();
    if (await option.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await option.click();
    } else {
      // Fallback: native <select> element
      const nativeSelect = this.page.locator('select#groupName');
      if (await nativeSelect.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await nativeSelect.selectOption({ label: groupName });
      }
    }
    if (await this.searchButton.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await this.clickAndWaitForSpinner(this.searchButton);
    } else {
      await this.waitForSpinner();
    }
  }

  // --- Table interactions ---

  /** Clicks ADD NEW PROGRAM in the section header (opens the Details panel in create mode). */
  async clickAddNewProgram(): Promise<void> {
    await this.clickAndWaitForSpinner(this.addNewProgramButton);
  }

  /**
   * Returns the Locator for the row whose first cell (Program Name) matches the given name.
   * Strict-normalized comparison collapses whitespace.
   */
  getProgramRowByName(programName: string): Locator {
    return this.tableRow.filter({
      has: this.page.locator(SELECTORS.tableCell).first().filter({ hasText: programName }),
    });
  }

  /** Clicks a program row (or its first-cell link) to open the Details panel. */
  async openProgramByName(programName: string): Promise<void> {
    const row = this.getProgramRowByName(programName).first();
    await row.waitFor({ state: 'visible', timeout: 10_000 });
    const link = row.locator('a').first();
    if (await link.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await link.click();
    } else {
      await row.locator(SELECTORS.tableCell).first().click();
    }
    await this.waitForSpinner();
  }

  /** Returns the number of visible rows in the programs table. */
  async getRowCount(): Promise<number> {
    return this.tableRow.count();
  }

  /** Returns the trimmed text of the pagination footer (e.g. "1-10 of 123"). */
  async getPaginationText(): Promise<string> {
    if (!(await this.paginationFooter.isVisible({ timeout: 2_000 }).catch(() => false))) {
      return '';
    }
    return this.getTextContent(this.paginationFooter);
  }
}

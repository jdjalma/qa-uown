import { type Locator } from '@playwright/test';
import { OriginationBasePage } from './origination-base.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';

/**
 * Program Groups page — Origination portal (/programGroups).
 * Lists program groups with count; clicking info icon opens a modal
 * with a FilterTable showing program details and navigation links.
 *
 * Task #1260 — Enable Navigation to Program Details from Program Groups Page.
 */
export class ProgramGroupsPage extends OriginationBasePage {
  readonly groupsTable: Locator = this.page.locator(SELECTORS.table);

  /** Navigates to the Program Groups page and waits for the table to load. */
  async navigateToProgramGroups(originationUrl: string): Promise<void> {
    await this.page.goto(`${originationUrl}programGroups`, { waitUntil: 'domcontentloaded' });
    await this.waitForPageLoad();
    await this.page.locator(SELECTORS.tableRow).first().waitFor({ state: 'visible', timeout: 30_000 });
  }

  /** Returns the number of group rows visible in the table. */
  async getGroupRowCount(): Promise<number> {
    return this.page.locator(SELECTORS.tableRow).count();
  }

  /** Returns the group name text from a row by index. */
  async getGroupName(rowIndex: number): Promise<string> {
    const row = this.page.locator(SELECTORS.tableRow).nth(rowIndex);
    const firstCell = row.locator(SELECTORS.tableCell).first();
    return (await firstCell.textContent())?.trim() || '';
  }

  /** Finds the first row index that has a non-empty group name and count > 0. Returns -1 if none found. */
  async findGroupWithPrograms(): Promise<number> {
    const rowCount = await this.getGroupRowCount();
    for (let i = 0; i < rowCount; i++) {
      const name = await this.getGroupName(i);
      const count = await this.getGroupProgramCount(i);
      if (name.length > 0 && count > 0) return i;
    }
    return -1;
  }

  /** Returns the program count displayed for a group row by index. */
  async getGroupProgramCount(rowIndex: number): Promise<number> {
    const row = this.page.locator(SELECTORS.tableRow).nth(rowIndex);
    const countCell = row.locator(SELECTORS.pgGroupCountCell);
    const text = (await countCell.textContent())?.trim() || '0';
    return parseInt(text, 10) || 0;
  }

  /** Clicks the info icon on a group row to open the programs modal. */
  async openGroupModal(rowIndex: number): Promise<void> {
    const row = this.page.locator(SELECTORS.tableRow).nth(rowIndex);
    const infoIcon = row.locator(SELECTORS.pgGroupInfoIcon);
    await infoIcon.click();
    await this.page.locator(SELECTORS.modalShow).last().waitFor({ state: 'visible', timeout: 10_000 });
  }

  /** Returns the modal container (scoped to .modal.show). */
  private getModal() {
    return this.page.locator(SELECTORS.modalShow).last();
  }

  /** Returns the modal title text (should be the group name). */
  async getModalTitle(): Promise<string> {
    // common-ui Modal renders the title as a sibling div above the table,
    // NOT inside standard .modal-header. Wait for the modal show overlay.
    const modal = this.getModal();
    await modal.waitFor({ state: 'visible', timeout: 10_000 });
    // The title is the first non-icon text element before the table
    const titleEl = modal.locator('.modal-title').first();
    if (await titleEl.isVisible({ timeout: 2_000 }).catch(() => false)) {
      return (await titleEl.textContent())?.trim() || '';
    }
    // Fallback: get first text inside the modal dialog before the table
    const dialogBody = modal.locator('.modal-body, .modal-dialog').first();
    const firstText = dialogBody.locator('div, span').first();
    return (await firstText.textContent())?.trim() || '';
  }

  // Modal table uses HTML <table> (role-based), not rdt_TableRow divs
  private readonly modalRowSelector = "div[role='row'], tr";
  private readonly modalCellSelector = "div[role='cell'], td";
  private readonly modalHeaderSelector = "div[role='columnheader'], th";

  /** Returns the column headers from the modal table. */
  async getModalTableHeaders(): Promise<string[]> {
    const modal = this.getModal();
    const headers = modal.locator(this.modalHeaderSelector);
    const texts = await headers.allTextContents();
    return texts.map(t => t.replace(/[▲▼△▽↑↓]/g, '').trim());
  }

  /** Returns the number of program data rows in the modal table (excludes header). */
  async getModalProgramCount(): Promise<number> {
    const modal = this.getModal();
    // Data rows are in the second rowgroup (tbody), or rows that have cell children
    const rows = modal.locator(`${SELECTORS.tableRow}, ${this.modalRowSelector}`).filter({
      has: this.page.locator(this.modalCellSelector),
    });
    return rows.count();
  }

  /** Returns data for a program row in the modal by index. */
  async getModalProgramData(rowIndex: number): Promise<Record<string, string>> {
    const modal = this.getModal();
    const headers = await this.getModalTableHeaders();
    const rows = modal.locator(`${SELECTORS.tableRow}, ${this.modalRowSelector}`).filter({
      has: this.page.locator(this.modalCellSelector),
    });
    const row = rows.nth(rowIndex);
    const cells = await row.locator(this.modalCellSelector).allTextContents();
    const data: Record<string, string> = {};
    headers.forEach((h, idx) => {
      data[h || `col-${idx}`] = cells[idx]?.trim() || '';
    });
    return data;
  }

  /** Clicks a program name in the modal by row index. Returns the program name clicked. */
  async clickProgramInModal(rowIndex: number): Promise<string> {
    const modal = this.getModal();
    const rows = modal.locator(`${SELECTORS.tableRow}, ${this.modalRowSelector}`).filter({
      has: this.page.locator(this.modalCellSelector),
    });
    const row = rows.nth(rowIndex);
    const firstCell = row.locator(this.modalCellSelector).first();
    // Try <a> link first, then fall back to clicking the cell/span directly
    const link = firstCell.locator('a').first();
    let name: string;
    if (await link.isVisible({ timeout: 2_000 }).catch(() => false)) {
      name = (await link.textContent())?.trim() || '';
      await link.click();
    } else {
      // Next.js Link may handle routing via onClick on span
      const clickable = firstCell.locator('span, div').first();
      name = (await clickable.textContent())?.trim() || '';
      await clickable.click();
    }
    await this.waitForSpinner();
    return name;
  }

  /** Returns whether the search/filter input is visible on the page. */
  async isSearchVisible(): Promise<boolean> {
    return this.page.locator(SELECTORS.filtersButton).isVisible({ timeout: 3_000 }).catch(() => false);
  }

  /** Types a search term in the group search filter. */
  async searchGroups(term: string): Promise<void> {
    const filterBtn = this.page.locator(SELECTORS.filtersButton);
    if (await filterBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await filterBtn.click();
    }
    const searchInput = this.page.locator("input[name='search'][placeholder='Search table']");
    await searchInput.waitFor({ state: 'visible', timeout: 5_000 });
    await searchInput.fill(term);
    // Wait for client-side filter to apply
    await this.page.waitForTimeout(500);
  }

  /** Returns whether the edit button/icon is visible for a group row. */
  async isEditButtonVisible(rowIndex: number): Promise<boolean> {
    const row = this.page.locator(SELECTORS.tableRow).nth(rowIndex);
    const editBtn = row.locator(SELECTORS.pgGroupEditIcon);
    return editBtn.isVisible({ timeout: 3_000 }).catch(() => false);
  }

  /** Closes the currently open modal. */
  async closeGroupModal(): Promise<void> {
    // common-ui Modal close button is an img/svg inside the modal, not .modal-header .close
    const modal = this.getModal();
    const closeBtn = modal.locator('button.close, button[aria-label="Close"], .btn-close').first();
    if (await closeBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await closeBtn.click();
    } else {
      await this.page.keyboard.press('Escape');
    }
    await modal.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
  }
}

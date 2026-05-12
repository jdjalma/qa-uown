import { type Page, type Locator } from '@playwright/test';
import { OriginationBasePage } from './origination-base.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';

/** Read-only program row shown inside the Programs section of the merchant detail page. */
export interface MerchantProgramSectionRow {
  programName: string;
  status: string;
  tooltipDates: string;
}

/**
 * Merchant detail page — Programs section (read-only sub-component).
 *
 * Per the "Schedule Program Activation and Deactivation Dates" spec, the
 * merchant detail page only displays program status + a tooltip exposing
 * Activation / Deactivation dates. Editing is exclusive to ProgramDetailsPage.
 *
 * @see ProgramDetailsPage — source of truth for program edits
 */
export class MerchantProgramsSectionPage extends OriginationBasePage {
  readonly section: Locator = this.page.locator(SELECTORS.mpsSection).first();
  readonly programRows: Locator = this.section.locator(SELECTORS.mpsProgramRow);

  constructor(page: Page) {
    super(page);
  }

  // --- Navigation ---

  /** Navigates to the merchant detail page by merchant number (refMerchantCode). */
  async gotoMerchantDetail(originationUrl: string, merchantNumber: string): Promise<void> {
    await this.page.goto(`${originationUrl}merchant/${merchantNumber}`, {
      waitUntil: 'domcontentloaded',
    });
    await this.waitForPageLoad();
  }

  // --- Row helpers ---

  /** Returns the Locator for the program row whose name cell matches programName. */
  private getProgramRow(programName: string): Locator {
    return this.programRows.filter({
      has: this.page.locator(SELECTORS.mpsProgramNameCell).filter({ hasText: programName }),
    });
  }

  /**
   * Returns every program row in the section as a structured record.
   *
   * The Programs **section wrapper selector** is fuzzy (no stable test-id on the
   * merchant detail page — 5 observation flagged by Round 1 review). Instead of
   * blocking on the section locator, we just wait for the page to settle and
   * enumerate program rows directly. Returns empty array if no rows — caller
   * decides if that's an error.
   */
  async getProgramRowsInSection(): Promise<MerchantProgramSectionRow[]> {
    // Soft-check section (best-effort — don't fail test if selector misses)
    await this.section
      .waitFor({ state: 'visible', timeout: 3_000 })
      .catch(() => {
        // Section wrapper not found — fall back to just waiting for rows/page
      });
    await this.programRows
      .first()
      .waitFor({ state: 'visible', timeout: 10_000 })
      .catch(() => {});
    const rows: MerchantProgramSectionRow[] = [];
    const count = await this.programRows.count();
    for (let i = 0; i < count; i++) {
      const row = this.programRows.nth(i);
      const cells = await row.locator(SELECTORS.tableCell).allTextContents();
      const programName = (cells[0] ?? '').trim();
      const status = await this.readStatusInRow(row);
      const tooltipDates = await this.readTooltipInRow(row);
      rows.push({ programName, status, tooltipDates });
    }
    return rows;
  }

  /** Returns 'Active' | 'Inactive' | '' (empty when the row / badge is not present). */
  async getProgramStatusByName(programName: string): Promise<string> {
    const row = this.getProgramRow(programName).first();
    if (!(await row.isVisible({ timeout: 5_000 }).catch(() => false))) {
      return '';
    }
    return this.readStatusInRow(row);
  }

  /** Hovers over the status badge so the tooltip with dates appears. */
  async hoverStatusBadge(programName: string): Promise<void> {
    const row = this.getProgramRow(programName).first();
    await row.waitFor({ state: 'visible', timeout: 10_000 });
    const badge = row.locator(SELECTORS.mpsStatusBadge).first();
    await badge.hover();
  }

  /**
   * Returns the text shown in the status tooltip — usually of the form
   * "Activation: MM/DD/YYYY / Deactivation: MM/DD/YYYY" (or '—' when not set).
   * Callers should hoverStatusBadge() first (this method also hovers defensively).
   */
  async getStatusTooltipText(programName: string): Promise<string> {
    await this.hoverStatusBadge(programName);
    const tooltip = this.page.locator(SELECTORS.mpsStatusTooltip).first();
    if (!(await tooltip.isVisible({ timeout: 5_000 }).catch(() => false))) {
      // Fallback: many tooltip systems place the text in a title attribute
      const row = this.getProgramRow(programName).first();
      const badge = row.locator(SELECTORS.mpsStatusBadge).first();
      const title = await badge.getAttribute('title').catch(() => null);
      return (title ?? '').trim();
    }
    return this.getTextContent(tooltip);
  }

  /**
   * Returns true when an explicit edit control is rendered for the given program row.
   * Per spec, this should be false — the Programs section is read-only on the merchant page.
   */
  async hasEditAction(programName: string): Promise<boolean> {
    const row = this.getProgramRow(programName).first();
    if (!(await row.isVisible({ timeout: 5_000 }).catch(() => false))) {
      return false;
    }
    const edit = row.locator(SELECTORS.mpsEditAction).first();
    return edit.isVisible({ timeout: 2_000 }).catch(() => false);
  }

  // --- Internals ---

  private async readStatusInRow(row: Locator): Promise<string> {
    const badge = row.locator(SELECTORS.mpsStatusBadge).first();
    if (!(await badge.isVisible({ timeout: 3_000 }).catch(() => false))) {
      return '';
    }
    return this.getTextContent(badge);
  }

  private async readTooltipInRow(row: Locator): Promise<string> {
    const badge = row.locator(SELECTORS.mpsStatusBadge).first();
    if (!(await badge.isVisible({ timeout: 2_000 }).catch(() => false))) {
      return '';
    }
    const title = await badge.getAttribute('title').catch(() => null);
    return (title ?? '').trim();
  }
}

import { type Page, type Locator } from '@playwright/test';
import { OriginationBasePage } from './origination-base.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';

/**
 * Normalize a date input value to MM/DD/YYYY regardless of its raw format.
 * Accepts: ISO (YYYY-MM-DD, optionally with time), MM/DD/YYYY, or empty.
 * Returns '' for empty/unparseable input.
 */
function normalizeDateInputValue(raw: string | null | undefined): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';
  // Already MM/DD/YYYY
  const mdy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  if (mdy) {
    const mm = mdy[1].padStart(2, '0');
    const dd = mdy[2].padStart(2, '0');
    return `${mm}/${dd}/${mdy[3]}`;
  }
  // ISO YYYY-MM-DD (possibly with time)
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
  if (iso) return `${iso[2]}/${iso[3]}/${iso[1]}`;
  return trimmed; // unknown format — return as-is, let caller decide
}

/** One entry in the Notes (Activity Log) table on the Program Details panel. */
export interface ProgramNoteEntry {
  date: string;
  type: string;
  userId: string;
  notes: string;
}

/**
 * Program Details panel — Origination portal (right pane of /programs 2-pane layout).
 *
 * Opens when the user clicks ADD NEW PROGRAM (create mode) or a program row
 * in ProgramsListPage (edit mode). Hosts the fields introduced by the
 * "Schedule Program Activation and Deactivation Dates" feature.
 *
 * @see ProgramsListPage
 */
export class ProgramDetailsPage extends OriginationBasePage {
  readonly panelHeader: Locator = this.page.locator(SELECTORS.pdPanelHeader);
  readonly programNameInput: Locator = this.page.locator(SELECTORS.pdProgramNameInput);
  readonly termMonthsInput: Locator = this.page.locator(SELECTORS.pdTermMonthsInput);
  readonly activationDateInput: Locator = this.page.locator(SELECTORS.pdActivationDateInput);
  readonly deactivationDateInput: Locator = this.page.locator(SELECTORS.pdDeactivationDateInput);
  readonly moneyFactorInput: Locator = this.page.locator(SELECTORS.pdMoneyFactorInput);
  readonly payoffDiscountInput: Locator = this.page.locator(SELECTORS.pdPayoffDiscountInput);
  readonly epoDaysInput: Locator = this.page.locator(SELECTORS.pdEpoDaysInput);
  readonly epoFeePercentInput: Locator = this.page.locator(SELECTORS.pdEpoFeePercentInput);
  readonly minimumCartAmountInput: Locator = this.page.locator(SELECTORS.pdMinimumCartAmountInput);
  readonly maxCartAmountInput: Locator = this.page.locator(SELECTORS.pdMaxCartAmountInput);
  readonly dealerDiscountOverrideInput: Locator = this.page.locator(SELECTORS.pdDealerDiscountOverrideInput);
  readonly processingFeeOverrideInput: Locator = this.page.locator(SELECTORS.pdProcessingFeeOverrideInput);
  readonly amountChargedAtSigningInput: Locator = this.page.locator(SELECTORS.pdAmountChargedAtSigningInput);
  readonly allowedFrequencyOverrideControl: Locator = this.page.locator(SELECTORS.pdAllowedFrequencyOverrideControl);
  readonly lendingCategoryControl: Locator = this.page.locator(SELECTORS.pdLendingCategoryControl);
  readonly programGroupControl: Locator = this.page.locator(SELECTORS.pdProgramGroupControl);
  readonly statesControl: Locator = this.page.locator(SELECTORS.pdStatesControl);
  readonly saveButton: Locator = this.page.locator(SELECTORS.pdSaveButton).first();
  readonly cancelButton: Locator = this.page.locator(SELECTORS.pdCancelButton).first();
  readonly cloneDropdownToggle: Locator = this.page.locator(SELECTORS.pdCloneDropdownToggle).first();
  readonly cloneGroupButton: Locator = this.page.locator(SELECTORS.pdCloneGroupButton).first();
  readonly inlineError: Locator = this.page.locator(SELECTORS.pdInlineError);
  readonly notesCard: Locator = this.page.locator(SELECTORS.pdNotesCard);
  readonly notesFiltersButton: Locator = this.page.locator(SELECTORS.pdNotesFiltersButton);

  constructor(page: Page) {
    super(page);
  }

  // --- Waits ---

  /** Waits for the Program Details panel to be visible (panel header + program-name field). */
  async waitForDetailsPanelLoad(): Promise<void> {
    await this.panelHeader.waitFor({ state: 'visible', timeout: 15_000 });
    await this.programNameInput.waitFor({ state: 'visible', timeout: 15_000 });
    await this.waitForSpinner();
  }

  /** Waits for the success toast shown after SAVE. Returns the toast text (trimmed). */
  async waitForSaveToastVisible(): Promise<string> {
    const toast = this.page.locator(SELECTORS.toastBody).first();
    await toast.waitFor({ state: 'visible', timeout: 15_000 });
    return (await toast.textContent())?.trim() || '';
  }

  // --- Field fillers (key feature fields first) ---

  /** Fills Activation Date. Format: MM/DD/YYYY. Pass '' to leave blank (use clearActivationDate for explicit clear). */
  async fillActivationDate(date: string): Promise<void> {
    await this.activationDateInput.waitFor({ state: 'visible', timeout: 10_000 });
    await this.activationDateInput.click({ clickCount: 3 });
    await this.activationDateInput.fill(date);
    await this.activationDateInput.press('Tab');
  }

  /** Fills Deactivation Date. Format: MM/DD/YYYY. */
  async fillDeactivationDate(date: string): Promise<void> {
    await this.deactivationDateInput.waitFor({ state: 'visible', timeout: 10_000 });
    await this.deactivationDateInput.click({ clickCount: 3 });
    await this.deactivationDateInput.fill(date);
    await this.deactivationDateInput.press('Tab');
  }

  /**
   * Returns the current Activation Date input value, always normalized to MM/DD/YYYY.
   *
   * The UI's date input may expose the raw value in ISO (`YYYY-MM-DD`) depending on
   * browser/locale — particularly after a SAVE round-trip where the backend stores
   * the canonical ISO form. This method normalizes both formats to MM/DD/YYYY so tests
   * can compare against a single expected shape.
   *
   * Returns '' for empty/null dates.
   */
  async getActivationDate(): Promise<string> {
    await this.activationDateInput.waitFor({ state: 'visible', timeout: 10_000 });
    const raw = await this.activationDateInput.inputValue();
    return normalizeDateInputValue(raw);
  }

  /** Returns the current Deactivation Date input value, always normalized to MM/DD/YYYY. */
  async getDeactivationDate(): Promise<string> {
    await this.deactivationDateInput.waitFor({ state: 'visible', timeout: 10_000 });
    const raw = await this.deactivationDateInput.inputValue();
    return normalizeDateInputValue(raw);
  }

  /** Clears the Activation Date input. */
  async clearActivationDate(): Promise<void> {
    await this.activationDateInput.waitFor({ state: 'visible', timeout: 10_000 });
    await this.activationDateInput.click({ clickCount: 3 });
    await this.activationDateInput.fill('');
    await this.activationDateInput.press('Tab');
  }

  /** Clears the Deactivation Date input. */
  async clearDeactivationDate(): Promise<void> {
    await this.deactivationDateInput.waitFor({ state: 'visible', timeout: 10_000 });
    await this.deactivationDateInput.click({ clickCount: 3 });
    await this.deactivationDateInput.fill('');
    await this.deactivationDateInput.press('Tab');
  }

  // --- Other form fields (auxiliary) ---

  async fillProgramName(name: string): Promise<void> {
    await this.programNameInput.waitFor({ state: 'visible', timeout: 10_000 });
    await this.programNameInput.click({ clickCount: 3 });
    await this.programNameInput.fill(name);
  }

  async fillTermMonths(months: number | string): Promise<void> {
    await this.termMonthsInput.waitFor({ state: 'visible', timeout: 10_000 });
    await this.termMonthsInput.click({ clickCount: 3 });
    await this.termMonthsInput.fill(String(months));
  }

  /** Fills a currency-masked numeric input (shared helper). */
  private async fillNumericInput(locator: Locator, value: string): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout: 10_000 });
    await locator.click({ clickCount: 3 });
    await locator.fill(value);
  }

  async fillMoneyFactor(value: string): Promise<void> {
    await this.fillNumericInput(this.moneyFactorInput, value);
  }

  async fillPayoffDiscount(value: string): Promise<void> {
    await this.fillNumericInput(this.payoffDiscountInput, value);
  }

  async fillEpoDays(value: string): Promise<void> {
    await this.fillNumericInput(this.epoDaysInput, value);
  }

  async fillEpoFeePercent(value: string): Promise<void> {
    await this.fillNumericInput(this.epoFeePercentInput, value);
  }

  async fillMinimumCartAmount(value: string): Promise<void> {
    await this.fillNumericInput(this.minimumCartAmountInput, value);
  }

  async fillMaxCartAmount(value: string): Promise<void> {
    await this.fillNumericInput(this.maxCartAmountInput, value);
  }

  async fillDealerDiscountOverride(value: string): Promise<void> {
    await this.fillNumericInput(this.dealerDiscountOverrideInput, value);
  }

  async fillProcessingFeeOverride(value: string): Promise<void> {
    await this.fillNumericInput(this.processingFeeOverrideInput, value);
  }

  async fillAmountChargedAtSigning(value: string): Promise<void> {
    await this.fillNumericInput(this.amountChargedAtSigningInput, value);
  }

  // --- Dropdowns / multi-selects ---

  /** Selects a Lending Category (e.g. "LTO"). Handles both react-select and native <select>. */
  async selectLendingCategory(value: string): Promise<void> {
    const nativeSelect = this.page.locator("select[name='lendingCategory']");
    if (await nativeSelect.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await nativeSelect.selectOption({ label: value });
      return;
    }
    await this.lendingCategoryControl.click();
    await this.page.locator(SELECTORS.filterOption).filter({ hasText: value }).first().click();
  }

  /** Selects a Program Group by visible label. */
  async selectProgramGroup(value: string): Promise<void> {
    const nativeSelect = this.page.locator("select[name='programGroup']");
    if (await nativeSelect.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await nativeSelect.selectOption({ label: value });
      return;
    }
    await this.programGroupControl.click();
    await this.page.locator(SELECTORS.filterOption).filter({ hasText: value }).first().click();
  }

  /** Selects one or more states in the States multi-select. */
  async selectStates(states: string[]): Promise<void> {
    for (const state of states) {
      await this.statesControl.click();
      const option = this.page.locator(SELECTORS.filterOption).filter({ hasText: state }).first();
      await option.waitFor({ state: 'visible', timeout: 5_000 });
      await option.click();
    }
    // Click outside to close the menu
    await this.page.keyboard.press('Escape').catch(() => {});
  }

  /** Selects one or more frequencies in the Allowed Frequency Override multi-select. */
  async selectAllowedFrequencyOverride(frequencies: string[]): Promise<void> {
    for (const freq of frequencies) {
      await this.allowedFrequencyOverrideControl.click();
      const option = this.page.locator(SELECTORS.filterOption).filter({ hasText: freq }).first();
      await option.waitFor({ state: 'visible', timeout: 5_000 });
      await option.click();
    }
    await this.page.keyboard.press('Escape').catch(() => {});
  }

  // --- Actions ---

  /** Clicks SAVE and waits for the spinner to clear. Does not assert on toast. */
  async clickSave(): Promise<void> {
    await this.saveButton.scrollIntoViewIfNeeded();
    await this.clickAndWaitForSpinner(this.saveButton);
  }

  /** Clicks CANCEL (does not persist the form). */
  async clickCancel(): Promise<void> {
    await this.clickAndWaitForSpinner(this.cancelButton);
  }

  /** Opens the Clone dropdown. */
  async clickClone(): Promise<void> {
    await this.cloneDropdownToggle.click();
  }

  /** Opens the Clone Group modal. */
  async clickCloneGroup(): Promise<void> {
    await this.cloneGroupButton.click();
  }

  // --- Validation helpers ---

  /**
   * Returns the inline error text (e.g. "Activation Date must be before Deactivation Date").
   * Returns '' if no inline error is visible.
   */
  async getInlineErrorMessage(): Promise<string> {
    const err = this.inlineError.first();
    if (!(await err.isVisible({ timeout: 3_000 }).catch(() => false))) {
      return '';
    }
    return this.getTextContent(err);
  }

  // --- Notes section (Activity Log) ---

  /**
   * Returns all visible Notes entries as structured records.
   * Assumes the Notes table columns are: Date | Type | User ID | Notes.
   */
  async getNotesEntries(): Promise<ProgramNoteEntry[]> {
    await this.notesCard.first().waitFor({ state: 'visible', timeout: 15_000 });
    // Wait for Notes table to render its first row (React hydrates the table
    // asynchronously after the right panel opens). Use waitFor with a short
    // timeout — gracefully degrades to "no rows" if the table is legitimately empty.
    const firstRow = this.page.locator(SELECTORS.pdNotesRow).first();
    await firstRow.waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {
      // No rows appeared within 15s — proceed with count=0, caller decides.
    });
    const notesRows = this.page.locator(SELECTORS.pdNotesRow);
    const count = await notesRows.count();
    const entries: ProgramNoteEntry[] = [];
    for (let i = 0; i < count; i++) {
      const cells = await notesRows.nth(i).locator(SELECTORS.pdNotesCell).allTextContents();
      entries.push({
        date: (cells[0] ?? '').trim(),
        type: (cells[1] ?? '').trim(),
        userId: (cells[2] ?? '').trim(),
        notes: (cells[3] ?? '').trim(),
      });
    }
    return entries;
  }

  /** Returns the most recent Notes entry whose Type matches (e.g., 'PROGRAM_DATA_CHANGE'), or null. */
  async getLatestNoteOfType(type: string): Promise<ProgramNoteEntry | null> {
    const entries = await this.getNotesEntries();
    for (const entry of entries) {
      if (entry.type === type) return entry;
    }
    return null;
  }

  /** Clicks the expand chevron on a Notes row to reveal full note text. */
  async expandNoteRow(rowIndex: number): Promise<void> {
    const row = this.notesCard.locator(SELECTORS.pdNotesRow).nth(rowIndex);
    const chevron = row.locator(SELECTORS.pdNotesExpandChevron).first();
    if (await chevron.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await chevron.click();
    }
  }

  /** Opens the Notes Filters panel (idempotent — no-op if already open). */
  async openNotesFilters(): Promise<void> {
    if (await this.notesFiltersButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const expanded = await this.notesFiltersButton.getAttribute('aria-expanded').catch(() => null);
      if (expanded !== 'true') {
        await this.notesFiltersButton.click();
      }
    }
  }

  /** Applies a multi-select filter on the Notes "Log Activity" dropdown. */
  async filterNotesByLogType(types: string[]): Promise<void> {
    await this.openNotesFilters();
    const control = this.page.locator(SELECTORS.pdNotesLogActivityControl).first();
    for (const type of types) {
      await control.click();
      const option = this.page.locator(SELECTORS.filterOption).filter({ hasText: type }).first();
      await option.waitFor({ state: 'visible', timeout: 5_000 });
      await option.click();
    }
    await this.page.keyboard.press('Escape').catch(() => {});
  }
}

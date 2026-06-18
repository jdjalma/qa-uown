import { type Page, type Download } from '@playwright/test';
import { SELECTORS } from '../../selectors/common.selectors.js';
import { waitForDownload } from '../../helpers/downloads.helpers.js';

/**
 * Shared CSV export controls for the Origination Overview (`/overview`) and
 * Leads (`/leads`) screens (task #1321).
 *
 * Mirrors the app's single reusable `FilteredCsvDownload` component: both
 * screens render the same Download CSV / Email CSV controls and the same
 * 48 MiB size-limit guard, differing only by `tooltipIdPrefix`
 * (`overview-csv-download` vs `leads-csv-download`) and the download filename.
 * Composed into `OverviewPage` and `LeadsPage` so the tooltip/modal/state
 * logic is not duplicated.
 *
 * Conventions (rules: no inline selector strings, no `expect` inside POMs,
 * no `waitForTimeout`). Methods return data/Locators; assertions live in tests.
 */
export class FilteredCsvDownloadControls {
  constructor(
    private readonly page: Page,
    /** `overview-csv-download` (Overview) or `leads-csv-download` (Leads). */
    private readonly tooltipIdPrefix: string,
  ) {}

  // ── Download CSV — state ──────────────────────────────────────────────

  /** True when the Download CSV button is rendered (it is gated by
   *  `hasDownloadPermission && headers.length > 0`). */
  async isDownloadCsvVisible(): Promise<boolean> {
    return this.page.locator(SELECTORS.csvDownloadButton).first()
      .isVisible({ timeout: 5_000 }).catch(() => false);
  }

  /** True when the Download CSV button is in its enabled state
   *  (`enabledButton` class present, `disabledButton` absent). */
  async isDownloadCsvEnabled(): Promise<boolean> {
    const enabled = await this.page.locator(SELECTORS.csvDownloadButtonEnabled).first()
      .isVisible({ timeout: 5_000 }).catch(() => false);
    if (!enabled) return false;
    const disabled = await this.page.locator(SELECTORS.csvDownloadButtonDisabled).first()
      .isVisible({ timeout: 1_000 }).catch(() => false);
    return !disabled;
  }

  // ── Email CSV — state ─────────────────────────────────────────────────

  /** True when the Email CSV button is rendered (it is always rendered). */
  async isEmailCsvVisible(): Promise<boolean> {
    return this.page.locator(SELECTORS.csvEmailButton).first()
      .isVisible({ timeout: 5_000 }).catch(() => false);
  }

  /** True when the Email CSV button is enabled (it is disabled only when the
   *  table is empty — NOT gated by download permission or the size limit). */
  async isEmailCsvEnabled(): Promise<boolean> {
    const btn = this.page.locator(SELECTORS.csvEmailButton).first();
    if (!(await btn.isVisible({ timeout: 5_000 }).catch(() => false))) return false;
    return btn.isEnabled({ timeout: 1_000 }).catch(() => false);
  }

  // ── Directing tooltip (size-limit case only) ──────────────────────────

  /** Hovers the Download CSV control to surface its directing tooltip
   *  (only rendered in the size-exceeded case). */
  async hoverDownloadCsv(): Promise<void> {
    await this.page.locator(SELECTORS.csvDownloadButton).first()
      .hover({ timeout: 5_000 }).catch(() => {});
  }

  /**
   * Returns the Download CSV *directing* tooltip text, or null when no directing
   * tooltip is rendered (e.g. the enabled case and the empty-table case show NO
   * directing tooltip).
   *
   * NOTE on the DOM: the `<span id="{tooltipIdPrefix}-{random}">` is the WRAPPER
   * around the button — its `textContent` is just the button label
   * ("Download CSV"), not a tooltip. The directing message ("This export is too
   * large to download directly. Please use Email CSV instead. …") is rendered
   * only in the size-exceeded case. We therefore match the directing PHRASE
   * (scoped to that wrapper), not the wrapper's raw text — so the enabled case
   * correctly returns null. Validated by running CT-01/CT-02 (2026-06-18):
   * the wrapper text was "Download CSV", which must NOT be treated as a tooltip.
   */
  async getDownloadDisabledTooltip(): Promise<string | null> {
    const wrapper = this.page.locator(SELECTORS.csvDownloadTooltipById(this.tooltipIdPrefix)).first();
    if (!(await wrapper.isVisible({ timeout: 3_000 }).catch(() => false))) return null;
    const directing = wrapper.getByText(/too large to download directly/i).first();
    if (!(await directing.isVisible({ timeout: 1_000 }).catch(() => false))) return null;
    const text = (await directing.textContent())?.trim();
    return text && text.length > 0 ? text : null;
  }

  // ── Download CSV — action ─────────────────────────────────────────────

  /** Clicks Download CSV and returns the captured Download (happy path). */
  async downloadCsv(): Promise<Download> {
    return waitForDownload(this.page, async () => {
      await this.page.locator(SELECTORS.csvDownloadButton).first().click({ timeout: 8_000 });
    });
  }

  // ── Email CSV — modal ─────────────────────────────────────────────────

  /** Clicks Email CSV and waits for the email-address modal to open. */
  async openEmailCsvModal(): Promise<void> {
    await this.page.locator(SELECTORS.csvEmailButton).first().click({ timeout: 8_000 });
    await this.page.locator(SELECTORS.csvEmailModal).first()
      .waitFor({ state: 'visible', timeout: 8_000 }).catch(() => {});
  }

  /** Returns the Email CSV modal title text (or null if not present). */
  async emailCsvModalTitle(): Promise<string | null> {
    const title = this.page.locator(SELECTORS.csvEmailModalTitle).first();
    if (!(await title.isVisible({ timeout: 5_000 }).catch(() => false))) return null;
    return (await title.textContent())?.trim() ?? null;
  }

  /** True when the modal's Send button is enabled (gated on a non-empty address). */
  async isEmailCsvSendEnabled(): Promise<boolean> {
    const send = this.page.locator(SELECTORS.csvEmailModalSendButton).first();
    if (!(await send.isVisible({ timeout: 5_000 }).catch(() => false))) return false;
    return send.isEnabled({ timeout: 1_000 }).catch(() => false);
  }

  /** Types an email address into the Email CSV modal input. */
  async fillEmailCsvAddress(address: string): Promise<void> {
    await this.page.locator(SELECTORS.csvEmailModalInput).first().fill(address);
  }

  /** Closes the Email CSV modal via CANCEL (no email is sent). */
  async cancelEmailCsvModal(): Promise<void> {
    await this.page.locator(SELECTORS.csvEmailModalCancelButton).first().click({ timeout: 5_000 });
    await this.page.locator(SELECTORS.csvEmailModal).first()
      .waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
  }

  // ── Row-count reconciliation ──────────────────────────────────────────

  /** Reads the filtered total from the rdt pagination footer
   *  ("X-Y of N" → N). Returns null when the footer is absent. */
  async getTotalRowCount(): Promise<number | null> {
    const footer = this.page.locator(SELECTORS.rdtPaginationFooter).first();
    if (!(await footer.isVisible({ timeout: 3_000 }).catch(() => false))) return null;
    const text = (await footer.textContent())?.trim() ?? '';
    const match = text.match(/\d+-\d+ of (\d+)/);
    return match ? Number(match[1]) : null;
  }
}

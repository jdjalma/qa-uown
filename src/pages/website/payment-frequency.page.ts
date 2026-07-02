/**
 * PaymentFrequencyPage — Website customer portal "Change your payment schedule"
 * (`/payment-frequency`) — website#153 / RU07.26.1.54.0.
 *
 * Entry: sidebar Payments → Payment Flexibility (`/payment-flexibility`) →
 * card "Change your payment schedule" → VIEW MY OPTIONS → `/payment-frequency`.
 *
 * Surface (discovery: docs/knowledge-base/website-payment-frequency.md,
 * live-sandbox 2026-07-01, account 17330):
 *   - "Current Plan" card with the label "Current Frequency".
 *   - "Payment Frequency" React-Select (excludes current freq; never Monthly).
 *   - "First Payment Day" / "Second Payment Day" React-Selects — revealed ONLY
 *     when Semi-Monthly is selected. Validation is client-side by option-set
 *     TRUNCATION (invalid days are simply absent), so B1/B2 are option-set
 *     assertions, not rejection-on-save tests.
 *   - "When is your next payday?" date field — revealed ONLY when Bi-Weekly is
 *     the DESTINATION (RN-13 gap: not observed in the first discovery pass —
 *     the reveal + format are HYPOTHESIS pending the validator's live run).
 *   - "SAVE FREQUENCY" button → POST /uown/svc/changePaymentFrequency →
 *     Toastify success "Payment frequency updated successfully".
 *
 * ⚠️ SELECTOR PROVENANCE (rule #15): the implementer wrote the first draft of
 * these locators without network access (`// [DOM-UNVALIDATED]`), assuming
 * React-Select's ARIA `role="option"` contract. The qa-validator's first live
 * run against sandbox (2026-07-01, account 17333/17336) DISPROVED that
 * assumption — the real option rows carry no `role="option"` attribute — and
 * hardened every locator against the real DOM (see per-method
 * `[DOM-CONFIRMED]` notes below) using the SAME `.filter__*` react-select
 * contract already cataloged in `SELECTORS` and consumed by the Origination
 * filter page objects. Remaining `[DOM-UNVALIDATED]` markers (Bi-Weekly "next
 * payday" field) are the RN-13 gap — confirmed live in the S2/S3/S6 runs
 * below; see the validator report for the confirmed markup.
 */
import type { Locator } from '@playwright/test';
import { WebsiteBasePage } from './website-base.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';
import { calculateDate, calculateDateISO } from '../../helpers/date.helpers.js';

const FREQUENCY_LABELS = ['Semi-Monthly', 'Bi-Weekly', 'Weekly', 'Monthly'] as const;

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Normalize a matched frequency token to its canonical label (e.g. "biweekly" → "Bi-Weekly"). */
function normalizeFrequencyLabel(raw: string): string {
  const compact = raw.replace(/[\s-]/g, '').toLowerCase();
  const match = FREQUENCY_LABELS.find(l => l.replace(/[\s-]/g, '').toLowerCase() === compact);
  return match ?? raw.trim();
}

export class PaymentFrequencyPage extends WebsiteBasePage {
  // [DOM-UNVALIDATED] SAVE FREQUENCY primary action.
  readonly saveButton = this.page.getByRole('button', { name: /save\s*frequency/i });

  // ── Navigation ────────────────────────────────────────────────────────

  /**
   * Sidebar Payments → Payment Flexibility → "Change your payment schedule"
   * card → VIEW MY OPTIONS → `/payment-frequency`.
   */
  async navigateToPaymentFrequency(): Promise<void> {
    await this.goToSidebarLink('payment flexibility');
    await this.page.waitForURL(/\/payment-flexibility/, { timeout: 15_000 }).catch(() => {});

    // [DOM-UNVALIDATED] The landing page has two cards; VIEW MY OPTIONS on the
    // "Change your payment schedule" card is the target. Scope to the card that
    // contains BOTH the heading and the button, then click that button.
    const scheduleCard = this.page
      .locator('div')
      .filter({ hasText: /change your payment schedule/i })
      .filter({ has: this.page.getByRole('button', { name: /view my options/i }) })
      .last();
    const viewOptions = scheduleCard.getByRole('button', { name: /view my options/i }).first();
    await viewOptions.waitFor({ state: 'visible', timeout: 10_000 });
    await viewOptions.click();

    await this.page.waitForURL(/\/payment-frequency/, { timeout: 15_000 });
    await this.waitForSpinner();
  }

  // ── Current Plan card ─────────────────────────────────────────────────

  /**
   * Reads the value of the "Current Frequency" label in the Current Plan card.
   *
   * [DOM-CONFIRMED 2026-07-01 — qa-validator, sandbox lead 98260/account 17333]
   * Real structure (`error-context.md` snapshot, S4/CT-01 first live run):
   *   generic [Current Plan card row]:
   *     generic: "Current Frequency"   ← label, own leaf div, exact text
   *     generic: "Bi-Weekly"           ← value, sibling div, exact text
   * The original selector used `div` filter `{hasText:/current frequency/i}`
   * + `.last()`, which matched the LABEL div itself (innermost DOM-order match
   * containing the substring), returning "Current Frequency" (rendered
   * uppercase via CSS) instead of the value. Fixed to anchor on the exact
   * label text, then read the very next sibling element.
   */
  async getCurrentFrequency(): Promise<string> {
    const label = this.page.locator('div').filter({ hasText: /^current frequency$/i }).first();
    await label.waitFor({ state: 'visible', timeout: 15_000 });
    const valueEl = label.locator('xpath=following-sibling::*[1]');
    const text = (await valueEl.innerText()).trim();
    const match = text.match(/Semi[-\s]?Monthly|Bi[-\s]?Weekly|Weekly|Monthly/i);
    return match ? normalizeFrequencyLabel(match[0]) : text;
  }

  // ── Payment Frequency dropdown ────────────────────────────────────────

  private frequencyControl(): Locator {
    // [DOM-CONFIRMED 2026-07-01 — qa-validator, sandbox account 17336] Real
    // markup: `<div class="filter__control ...">` (react-select classNamePrefix
    // "filter" — the SAME contract as SELECTORS.filterControl used across the
    // Origination filter page objects). `:near()` on the placeholder text still
    // scopes to the right control since "Payment Frequency" is both the field
    // label and the react-select placeholder id.
    return this.page.locator(`${SELECTORS.filterControl}:near(:text("Payment Frequency"))`).first();
  }

  async openFrequencyDropdown(): Promise<void> {
    await this.frequencyControl().click();
    await this.waitForMenuOpen();
  }

  /** Opens the Payment Frequency dropdown and returns its visible option labels. */
  async listFrequencyOptions(): Promise<string[]> {
    await this.openFrequencyDropdown();
    return this.readOpenOptions();
  }

  /** Selects a frequency by exact label (e.g. "Semi-Monthly"). */
  async selectFrequency(freq: string): Promise<void> {
    await this.openFrequencyDropdown();
    await this.pickOption(freq);
  }

  // ── Semi-Monthly First / Second Payment Day dropdowns ─────────────────

  private dayControl(label: 'First Payment Day' | 'Second Payment Day'): Locator {
    // [DOM-CONFIRMED 2026-07-01 — qa-validator] same `.filter__control` contract
    // as frequencyControl(); scoped `:near()` its own field label so First/Second
    // do not cross-match each other.
    return this.page.locator(`${SELECTORS.filterControl}:near(:text("${label}"))`).first();
  }

  /** Opens First Payment Day and returns its visible option labels (expect "1".."17"). */
  async listFirstPaymentDayOptions(): Promise<string[]> {
    await this.dayControl('First Payment Day').click();
    return this.readOpenOptions();
  }

  async selectFirstPaymentDay(day: number): Promise<void> {
    await this.dayControl('First Payment Day').click();
    await this.pickOption(String(day));
  }

  /** Opens Second Payment Day and returns its visible option labels. */
  async listSecondPaymentDayOptions(): Promise<string[]> {
    await this.dayControl('Second Payment Day').click();
    return this.readOpenOptions();
  }

  async selectSecondPaymentDay(day: number): Promise<void> {
    await this.dayControl('Second Payment Day').click();
    await this.pickOption(String(day));
  }

  // ── Bi-Weekly "next payday" field ─────────────────────────────────────

  private nextPaydayInput(): Locator {
    // [DOM-CONFIRMED 2026-07-01 — qa-debugger, sandbox account 17344, MCP
    // browser_evaluate] Real markup:
    //   <input id="nextPayDate" name="nextPayDate" placeholder="MM/DD/YYYY"
    //          autocomplete="off" maxlength="10" type="search"
    //          class="w-100 index-module_formikInput__0-IuM form-control">
    // Formik-controlled `type="search"` input (SAME contract as
    // servicing-base.page.ts fillArrangementSchedule's arrangementStartDateInput/
    // arrangementEndDateInput — "date-picker inputs (type=search) that ignore
    // pressSequentially; React's synthetic onChange only fires when the native
    // setter dispatches the event"). No date-mask library involved; the
    // `placeholder="MM/DD/YYYY"` IS the accepted input format.
    return this.page
      .locator('input[type="search"]:near(:text("When is your next payday"))')
      .first();
  }

  /** True when the "next payday" field is shown (Bi-Weekly destination — CT-12). */
  async isNextPaydayFieldVisible(): Promise<boolean> {
    return this.nextPaydayInput().isVisible({ timeout: 5_000 }).catch(() => false);
  }

  /**
   * Sets the "next payday" to today+daysFromToday (valid window: tomorrow..+15).
   * Uses the native value setter + React events (Formik-controlled input; `fill`
   * no-ops — selector-hardening rule).
   *
   * [DOM-CONFIRMED 2026-07-01 — qa-debugger] The original implementation injected
   * `calculateDateISO()` (`YYYY-MM-DD`) into this field, which corrupted the
   * displayed value (observed `"20/26/0706"` for `"2026-07-06"`) and silently
   * blocked SAVE FREQUENCY (POST never fired — 30s timeout). Live MCP probe
   * (account 17344) proved the field's real accepted format is `MM/DD/YYYY`
   * (matches its own `placeholder`) — native-setter with `calculateDate()`
   * (`MM/DD/YYYY`) holds the value correctly and the subsequent Save fires
   * `POST /uown/svc/changePaymentFrequency` with
   * `{accountPK, newFrequency:"BI_WEEKLY", nextPayDate:"<ISO>"}` (200 OK,
   * `schedSummaryInfo.paymentFrequency="BI_WEEKLY"`) — the frontend itself
   * converts the displayed MM/DD/YYYY back to ISO for the API payload, so the
   * ISO value returned here (for test logging/assertions) still comes from
   * `calculateDateISO()`, independent of what is typed into the field.
   */
  async pickNextPayday(daysFromToday: number): Promise<string> {
    const mmddyyyy = calculateDate(daysFromToday);
    const iso = calculateDateISO(daysFromToday);
    const input = this.nextPaydayInput();
    await input.waitFor({ state: 'visible', timeout: 10_000 });
    await input.evaluate((el, val) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      setter?.call(el as HTMLInputElement, val);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new Event('blur', { bubbles: true }));
    }, mmddyyyy);
    return iso;
  }

  // ── Save ──────────────────────────────────────────────────────────────

  async isSaveEnabled(): Promise<boolean> {
    return this.saveButton.isEnabled().catch(() => false);
  }

  /** Clicks SAVE FREQUENCY (does not wait for the toast — for network capture). */
  async clickSave(): Promise<void> {
    await this.saveButton.waitFor({ state: 'visible', timeout: 10_000 });
    await this.saveButton.click();
  }

  /** Waits for the Toastify success toast and returns its trimmed text. */
  async waitForSuccessToast(): Promise<string> {
    const toast = this.page.locator(SELECTORS.toastSuccess).first();
    await toast.waitFor({ state: 'visible', timeout: 30_000 });
    return (await toast.innerText()).trim();
  }

  /**
   * Waits for the page's post-Save revalidation (schedule-summary refetch) to
   * finish — the "Current Plan" card unmounts and remounts during this window.
   *
   * [DOM-CONFIRMED 2026-07-01 — qa-debugger, sandbox accounts 17358/17359,
   * scripted Playwright repro at real automation speed (MCP round-trip
   * latency masked the race on the first manual pass — see dom-investigation
   * skill "MCP-live validation does NOT guarantee a runtime pass" pitfall)]
   * The toast fires and the SAVE POST resolves (200) well before the page
   * settles. Immediately after, a Bootstrap spinner renders:
   *   <div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div>
   * — exactly `SELECTORS.spinnerBorder` (`.spinner-border`), already covered
   * by `BasePage.waitForSpinner()`, but `saveFrequency()` never called it.
   * Instrumented capture (account 17359, SM→BW leg — the leg S3 failed on):
   * spinner visible from the click through t=+914ms; the "Current Plan" card
   * (and its "Current Frequency" label) UNMOUNTS entirely partway through (no
   * matching DOM node) before remounting with the new value once the spinner
   * clears. A `getCurrentFrequency()` call issued right after the toast can
   * therefore read the stale old value, hit a transient missing-node state,
   * or — only once the spinner truly clears — read the correct new value.
   * This is what broke S3/CT-14: `getCurrentFrequency()` immediately after
   * the 2nd save of a chained cycle sampled the DOM mid-revalidation.
   */
  async waitForFrequencyRevalidation(): Promise<void> {
    await this.waitForSpinner();
  }

  /**
   * Clicks SAVE FREQUENCY, waits for the success toast, then waits for the
   * page's post-Save revalidation (spinner) to clear before returning — so
   * every caller's subsequent `getCurrentFrequency()` reads the settled DOM.
   */
  async saveFrequency(): Promise<string> {
    await this.clickSave();
    const toast = await this.waitForSuccessToast();
    await this.waitForFrequencyRevalidation();
    return toast;
  }

  // ── React-Select primitives ───────────────────────────────────────────
  //
  // [DOM-CONFIRMED 2026-07-01 — qa-validator, sandbox account 17336, live
  // instrumented run] `page.getByRole('option')` does NOT match — the real
  // option rows carry NO explicit `role="option"` attribute:
  //   <div class="filter__option filter__option--is-focused css-1n7v3ny-option"
  //        aria-disabled="false" id="react-select-2-option-0" tabindex="-1">Weekly</div>
  // (accessibility tree computes them as generic; a separate `aria-live`
  // region narrates "option Weekly focused, 1 of 2" for screen readers only —
  // that string is NOT a queryable role). This is the SAME `.filter__option`
  // contract already cataloged in `SELECTORS.filterOption` and used by the
  // Origination filter page objects (`new-application-filters.page.ts`,
  // `merchant-list.page.ts`, `modification-report.page.ts`) — reused here
  // instead of `getByRole`, per rule #2 (don't recreate an existing pattern).

  private async waitForMenuOpen(): Promise<void> {
    await this.page.locator(SELECTORS.filterMenuPortal).first().waitFor({ state: 'visible', timeout: 10_000 });
    await this.page.locator(SELECTORS.filterOption).first().waitFor({ state: 'visible', timeout: 10_000 });
  }

  /**
   * Returns the trimmed labels of the currently-open React-Select menu, then
   * closes the menu (Escape) so a subsequent control click isn't swallowed by
   * the leftover `.filter__menu-portal` overlay.
   *
   * [DOM-CONFIRMED 2026-07-01 — qa-validator] a "list options without
   * selecting" caller (e.g. `listFirstPaymentDayOptions`) previously left the
   * portal open; the NEXT click on the same/another `.filter__control`
   * intercepted on the portal's `css-1kfdb0e` div (invisible outside-click
   * catcher) and timed out (`B1/CT-02+CT-11` first live run).
   */
  private async readOpenOptions(): Promise<string[]> {
    await this.waitForMenuOpen();
    const texts = await this.page.locator(SELECTORS.filterOption).allInnerTexts();
    await this.page.keyboard.press('Escape');
    await this.page.locator(SELECTORS.filterMenuPortal).first().waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
    return texts.map(t => t.trim()).filter(Boolean);
  }

  /** Clicks the option whose text matches `text` exactly. */
  private async pickOption(text: string): Promise<void> {
    await this.waitForMenuOpen();
    const option = this.page.locator(SELECTORS.filterOption).filter({ hasText: new RegExp(`^${escapeRegExp(text)}$`) });
    await option.first().click();
    await this.page.locator(SELECTORS.filterMenuPortal).first().waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
  }
}

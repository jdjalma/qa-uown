/**
 * CustomerPortalOverviewPage
 *
 * Reads the EPO/balance cards on the customer-facing portal `/overview`
 * page and exercises the Pay Off flow that lands on `/payment`. Introduced
 * for svc#531 (R1.52.0 — 16-month EPO for CA, AC3 tri-surface assertion).
 *
 * Naming note (memory `feedback_portal_naming`): the repo names this portal
 * "Website" because the React app lives under the public website domain,
 * but the USER FACING role is the CUSTOMER portal — not the agent-facing
 * Servicing portal. Page object name mirrors the role for clarity.
 *
 * Viewport: 375x667 (mobile-first per CLAUDE.md regra #15 — customer flow
 * is mobile-heavy: OTP, payoff, signing). Callers MUST set the viewport
 * before navigating.
 *
 * Login: reuses {@link WebsiteBasePage.loginWithEmailOrPhone} +
 * {@link WebsiteBasePage.enterVerificationCode}. The OTP code source is
 * left to the caller (IMAP via {@link EmailHelpers} or
 * {@link DatabaseHelpers.waitForFreshOtpCode}) — page object stays
 * transport-agnostic.
 */
import { WebsiteBasePage } from './website-base.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';
import { parseMoney } from '../../helpers/common.helpers.js';

export class CustomerPortalOverviewPage extends WebsiteBasePage {
  /**
   * Performs the complete email-based login flow used by the customer
   * portal: submit identifier, wait for OTP modal, fetch the code via
   * `otpFetcher`, type it into the 6-input dialog, wait for redirect
   * away from the login route.
   *
   * `otpFetcher` is invoked AFTER the identifier is submitted, so callers
   * that read OTP from email/SMS can take a watermark (uid snapshot)
   * BEFORE calling this method and pass a closure that reads strictly
   * fresh codes (memory `reference_imap_fintechgroup777`).
   *
   * Returns true when login succeeded (modal closed AND URL left the
   * login route), false otherwise.
   *
   * NOTE: named `loginWithOtp` (not `loginWithEmail`) to avoid colliding
   * with the deprecated single-arg `loginWithEmail` on {@link WebsiteBasePage}.
   */
  async loginWithOtp(
    identifier: string,
    otpFetcher: () => Promise<string>,
  ): Promise<boolean> {
    await this.loginWithEmailOrPhone(identifier);
    const code = await otpFetcher();
    return this.enterVerificationCode(code);
  }

  /**
   * Reads the "Balance if Paid Off Today" value from the /overview cards.
   * Uses the same `page.evaluate` ancestor-walk strategy as the Servicing
   * page object: scans for the exact label text, then walks up to find a
   * money-shaped sibling. This is resilient to the customer portal cards
   * which render `value → label` and to layout drift across releases.
   * Returns NaN if the card is not rendered (e.g. account not eligible
   * for early payoff) — caller decides how to react.
   */
  async readBalanceIfPaidOffToday(): Promise<number> {
    return this.readMoneyByLabelText('Balance if Paid Off Today');
  }

  /** Reads the "Contract Balance" value from the /overview cards. */
  async readContractBalance(): Promise<number> {
    return this.readMoneyByLabel(SELECTORS.wsContractBalanceLabel);
  }

  /** Reads the "Payment Due" value from the /overview cards. */
  async readPaymentDue(): Promise<number> {
    return this.readMoneyByLabel(SELECTORS.wsPaymentDueLabel);
  }

  /**
   * Reads the "Next Payment Due Date" text from the /overview cards
   * (returned as raw visible string, e.g. "08/22/2026").
   */
  async readNextPaymentDueDate(): Promise<string> {
    return this.readTextByLabel(SELECTORS.wsNextPaymentDueDateLabel);
  }

  /**
   * Clicks the "Pay Off" button on the "Balance if Paid Off Today" card.
   * The button is a sibling of the value cell — we resolve via the card
   * region rather than a page-global selector to avoid colliding with
   * any other Pay Off control if the layout grows.
   *
   * Awaits navigation to /payment and the post-navigation spinner.
   */
  async clickPayOff(): Promise<void> {
    const button = this.page.locator(SELECTORS.wsPayOffButton).first();
    await button.waitFor({ state: 'visible', timeout: 10_000 });
    await Promise.all([
      this.page.waitForURL(/\/payment(\b|\/|$|\?)/, { timeout: 15_000 }).catch(() => {}),
      button.click(),
    ]);
    await this.waitForSpinner();
  }

  /**
   * Reads the value rendered next to the "Balance if Paid Off Today:"
   * radio on the /payment page (note the trailing colon — distinct text
   * from the /overview card). Must be called AFTER {@link clickPayOff}
   * (or after navigating directly to /payment).
   */
  async readPaymentPageBalancePaidOff(): Promise<number> {
    return this.readMoneyByLabel(SELECTORS.wsPaymentPageBalancePaidOffRadioLabel);
  }

  /**
   * Resolves the value cell adjacent to a label. The customer portal cards
   * render `value → label` (DOM-confirmed via MCP error-context snapshot on
   * lead 11929: the `$3,813.43` value sits in the sibling BEFORE the
   * "Balance if Paid Off Today" label). Tries both directions plus the
   * common parent walk so the helper is resilient to card layouts.
   */
  async readTextByLabel(labelSelector: string, timeoutMs = 10_000): Promise<string> {
    const label = this.page.locator(labelSelector).first();
    if (!(await label.isVisible({ timeout: timeoutMs }).catch(() => false))) {
      return '';
    }
    const strategies: string[] = [
      'xpath=preceding-sibling::div[1]',
      'xpath=following-sibling::div[1]',
      'xpath=../div[normalize-space()][1]',
    ];
    for (const xp of strategies) {
      const candidate = label.locator(xp).first();
      const raw = await candidate.textContent().catch(() => null);
      if (raw == null) continue;
      const text = raw.replace(/\s+/g, ' ').trim();
      if (!text) continue;
      if (text.toLowerCase() === (await label.textContent().catch(() => ''))?.toLowerCase().trim()) continue;
      return text;
    }
    return '';
  }

  /** Convenience wrapper around {@link readTextByLabel} + `parseMoney`. */
  async readMoneyByLabel(labelSelector: string, timeoutMs = 10_000): Promise<number> {
    const text = await this.readTextByLabel(labelSelector, timeoutMs);
    return parseMoney(text);
  }

  /**
   * Same `page.evaluate` ancestor-walk strategy used by `ServicingAccountSummaryPage`.
   * Looks up the value next to an EXACT label text by scanning the DOM and
   * walking up to find a sibling with money/percent/date/yes-no shape.
   * Returns NaN when no value-shaped sibling is found.
   */
  async readMoneyByLabelText(label: string): Promise<number> {
    const text = await this.page.evaluate((needle: string) => {
      const norm = (s: string) => s.replace(/\s+/g, ' ').trim();
      const isValueShape = (s: string): boolean => {
        const t = s.trim();
        if (!t) return false;
        if (/^\$?[-]?[0-9][0-9,]*(\.[0-9]+)?\s*%?$/.test(t)) return true;
        if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(t)) return true;
        return false;
      };

      const all = Array.from(document.querySelectorAll('*'));
      for (const el of all) {
        if (norm(el.textContent ?? '') !== needle) continue;
        let cursor: Element | null = el;
        for (let depth = 0; depth < 6 && cursor; depth++) {
          const candidates = Array.from(cursor.querySelectorAll('*'))
            .filter((c) => !c.contains(el) && el !== c && !el.contains(c));
          for (const cand of candidates) {
            const text = norm(cand.textContent ?? '');
            if (!text || text === needle) continue;
            if (isValueShape(text)) {
              return text;
            }
          }
          cursor = cursor.parentElement;
        }
      }
      return '';
    }, label);
    return parseMoney(text);
  }
}

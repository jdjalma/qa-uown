import { type Page, type FrameLocator, type Locator } from '@playwright/test';

/**
 * SeonWidgetComponent — drives/asserts the SEON Identity Verification widget that
 * the consumer portal injects on the `/complete` payment step when the merchant has
 * `isSeonIdCheckRequired = true` and no valid SEON record exists.
 *
 * This is a STANDALONE component (does NOT extend BasePage) — it owns the
 * cross-origin SEON iframe and exposes semantic methods over its frameLocator.
 * Methods RETURN values (boolean / string), never call `expect()` (page-object rule).
 *
 * It follows the established standalone-component convention of
 * `src/pages/origination/filtered-csv-download.controls.ts` (a control wrapper that
 * also does not extend BasePage): a UI component composed into pages, not a page.
 *
 * ── Topology ─────────────────────────────────────────────────────────────────
 * The outer SEON iframe (`[data-testid="seon-idv-iframe"]`) is resolved from an
 * optional parent frame:
 *   - Kornerstone `/complete`  → iframe is top-level on the `page`            (no parentFrame)
 *   - PayPair / PayTomorrow     → iframe is nested inside the portal's `ptFrame` (pass parentFrame)
 *
 * The widget CONTENT is served from `transfer.seonidv.com` and is cross-origin:
 * `page.evaluate` into it is blocked, but a real spec CAN drive/assert it via the
 * frameLocator (CDP-level, not same-origin-bound).
 *
 * ── Selectors (confirmed live, sandbox 2026-06-23, lead 97964/RjufZ7PB) ───────
 * Co-located here as semantic getters — co-location is cohesion, not a violation.
 * Semantic-first (getByRole > getByText). The X close button is the single
 * exception: it is an icon-only button with NO accessible name / testid / title —
 * its only stable hook is the CSS-module class `*close-button*` (hash varies →
 * partial match), so a class selector is the last-resort, documented choice.
 *
 * Origin: docs/knowledge-base/seon-idv-widget-user-behavior.md (SEON-UB-01..11).
 */
class SeonWidgetComponent {
  /** Outer iframe element selector (top-level or nested via parentFrame). */
  static readonly OUTER_IFRAME = '[data-testid="seon-idv-iframe"]';

  /** Locator for the outer iframe ELEMENT (used for visibility checks, not content). */
  private readonly outerIframe: Locator;

  /** FrameLocator into the SEON widget content (transfer.seonidv.com). */
  private readonly frame: FrameLocator;

  constructor(
    private readonly page: Page,
    parentFrame?: FrameLocator,
  ) {
    const root = parentFrame ?? page;
    this.outerIframe = parentFrame
      ? parentFrame.locator(SeonWidgetComponent.OUTER_IFRAME)
      : page.locator(SeonWidgetComponent.OUTER_IFRAME);
    this.frame = root.frameLocator(SeonWidgetComponent.OUTER_IFRAME);
  }

  // ── Semantic getters over the widget content ───────────────────────────────

  /** Title heading inside the widget — confirms the widget actually rendered. */
  private get heading(): Locator {
    return this.frame.getByRole('heading', { name: /verify your identity/i });
  }

  /** Privacy/consent checkbox (native input[type=checkbox], count=1). */
  private get consentCheckbox(): Locator {
    return this.frame.getByRole('checkbox');
  }

  /** Fallback consent target when the checkbox itself is not directly clickable. */
  private get consentLabel(): Locator {
    return this.frame.getByText(/i have read and agree/i);
  }

  /** "Start verification" button — disabled (real `disabled` attr) until consent. */
  private get startVerificationButton(): Locator {
    return this.frame.getByRole('button', { name: /start verification/i });
  }

  /**
   * X close control (top-right). Icon-only button with NO accessible name /
   * aria-label / testid / title — only hook is the CSS-module class
   * `_close-button-component_<hash>` (hash varies → partial match).
   */
  private get closeButton(): Locator {
    return this.frame.locator('[class*="close-button"]');
  }

  // ── Lifecycle / visibility ─────────────────────────────────────────────────

  /**
   * Wait for the SEON widget to be fully rendered. The widget content
   * (`transfer.seonidv.com`) loads ~5s after the `/complete` goto, so this waits
   * for the INTERNAL heading to appear — not just the outer iframe element.
   */
  async waitForSeonWidget(timeout = 30_000): Promise<void> {
    await this.heading.waitFor({ state: 'visible', timeout });
  }

  /**
   * Non-throwing check that the widget heading is visible (= widget rendered).
   * Distinct from "outer iframe present": a stuck/loading widget fails this.
   */
  async isSeonWidgetVisible(timeout = 5_000): Promise<boolean> {
    return this.heading.isVisible({ timeout }).catch(() => false);
  }

  // ── Consent gate ───────────────────────────────────────────────────────────

  /**
   * Tick the privacy/consent checkbox. Tries the native checkbox first; if it is
   * not directly actionable, clicks the associated text label.
   */
  async acceptPrivacyConsent(): Promise<void> {
    const checkbox = this.consentCheckbox;
    if (await checkbox.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await checkbox.check();
      return;
    }
    await this.consentLabel.click();
  }

  /**
   * Whether the "Start verification" button is enabled.
   * The button reflects its state via the real `disabled` attribute (present before
   * consent, removed after) — `.isEnabled()` reflects it correctly.
   */
  async isStartVerificationEnabled(): Promise<boolean> {
    return this.startVerificationButton.isEnabled().catch(() => false);
  }

  /** Click "Start verification" (advances to the camera/document/selfie flow). */
  async startVerification(): Promise<void> {
    await this.startVerificationButton.click();
  }

  // ── Cancel (real X — distinct from DOM removal) ────────────────────────────

  /**
   * Click the real X close control. Does NOT wait for / assert dismissal — the
   * cancel UX is non-trivial (may have an in-frame confirmation step or async
   * dismiss); the caller decides how to wait and what to assert.
   */
  async closeSeonWidget(): Promise<void> {
    await this.closeButton.click();
  }

  // ── Gate / blocking assertions (non-destructive) ────────────────────────────

  /**
   * Non-destructive check that the SEON overlay is blocking the payment form:
   * returns true when the given payment field is NOT editable (the fullscreen
   * overlay intercepts interaction). Does NOT hide/remove the widget.
   *
   * @param paymentFieldLocator a locator for a payment input (e.g. Card Number)
   */
  async isSeonGateBlockingPaymentForm(paymentFieldLocator: Locator): Promise<boolean> {
    const editable = await paymentFieldLocator.isEditable().catch(() => false);
    return !editable;
  }

  // ── Error surface ──────────────────────────────────────────────────────────

  /**
   * Read the widget's error message text if one is shown, else null.
   * Matches the SEON failure surface ("Failed to verify identification." family).
   */
  async getSeonErrorMessage(): Promise<string | null> {
    const error = this.frame
      .getByText(/failed to verify|verification failed|unable to verify/i)
      .first();
    if (!await error.isVisible({ timeout: 3_000 }).catch(() => false)) return null;
    return (await error.textContent())?.trim() ?? null;
  }

  // ── Back-compat: hide/remove the overlay (the legacy `dismissSeonOverlay`) ──

  /**
   * BACK-COMPAT: hide the SEON iframe via JS (display:none + pointer-events:none +
   * z-index) so legacy flows can reach the payment form. Preserves the exact
   * behaviour of the original `dismissSeonOverlay` in `contract.page.ts`.
   *
   * NOTE: this REMOVES the overlay visually — it does NOT exercise the real cancel
   * UX. User-behavior specs must use `closeSeonWidget()` (real X), not this.
   */
  async hideWidget(): Promise<void> {
    const visible = await this.outerIframe.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!visible) return;

    await this.page.evaluate((selector) => {
      const el = document.querySelector(selector) as HTMLElement | null;
      if (el) {
        el.style.display = 'none';
        el.style.pointerEvents = 'none';
        el.style.zIndex = '-9999';
      }
    }, SeonWidgetComponent.OUTER_IFRAME);
  }
}

export { SeonWidgetComponent };

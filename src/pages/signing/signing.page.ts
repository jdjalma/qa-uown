import { type Page, type FrameLocator, type Locator } from '@playwright/test';
import { BasePage } from '../base.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';
import { GowSignDocumentViewerPage } from '../gowsign/document-viewer.page.js';

/**
 * Provider-agnostic signing page object — abstracts the e-sign surface so tests
 * can run against ANY of the supported providers without hardcoding which one
 * served the document.
 *
 * Why this abstraction exists
 * ---------------------------
 * In qa2 (2026-04-28), only `state=CA` routes to GOWSIGN. Every other allowed
 * state falls back to the merchant's `esign_client` (SIGNWELL by default).
 * As product distributes more GowSign templates, individual states will flip.
 * The multi-state regression suite (`multiStateSigningRegression`) must work
 * with whichever provider actually rendered the iframe and ASSERT it matches
 * the matrix expectation — never assume.
 *
 * Detection strategy (preferred → fallback)
 * -----------------------------------------
 * 1. `page.url()` host match — when the redirectUrl is the provider's app
 *    directly (current GowSign flow: `page.goto(...)` lands on
 *    `*.gowsign.com`).
 * 2. Iframe `src` URL host match — when the provider is embedded in a host
 *    page (SignWell embed, GowSign in `AlternativeContractModal`).
 * 3. DOM markers — last-resort signals (`#SignWell-Embedded-Iframe` id,
 *    `.alternative-contract-vendor_iframeContainer__yAn5c` UOwn wrapper).
 *
 * Hierarchy: cross-portal / external surface → extends `BasePage` directly
 * (per `.claude/rules/page-objects.md` and `context/project.md` § Page Object
 * Hierarchy).
 *
 * Atomic scope (what this PO is NOT)
 * ----------------------------------
 * - Does NOT decide which provider should be used (backend routing concern).
 * - Does NOT click through the full signing happy path with field fills —
 *   each provider has a distinct flow (see `helpers/signwell.helpers.ts` and
 *   `tests/e2e/gowsign/_explore-signing-widget.spec.ts`). `startSignature()`
 *   is a thin wrapper around the provider's "Start" entrypoint only.
 * - Does NOT validate `uown_esign_document` — DB validation belongs in tests
 *   via `db.waitForRecord` / `db.getSingleRow`.
 * - Does NOT call `expect()` — assertions live in tests (page object rule).
 */

/**
 * Detected e-sign provider. `'UNKNOWN'` is returned when neither the page URL
 * nor any visible iframe matches a known provider host. Tests assert against
 * the expected provider from the matrix row; mismatches surface as test
 * failures, not exceptions inside this PO.
 */
export type DetectedProvider = 'GOWSIGN' | 'SIGNWELL' | 'PANDADOCS' | 'UNKNOWN';

/**
 * Internal handle to whichever surface owns the signing widget — either the
 * top-level page (when the redirectUrl IS the provider's app) or a frame
 * locator (when the provider is embedded as an iframe inside a UOwn host).
 */
type SigningSurface =
  | { kind: 'page'; provider: DetectedProvider }
  | { kind: 'frame'; provider: DetectedProvider; frame: FrameLocator };

const URL_PATTERNS: ReadonlyArray<{ provider: DetectedProvider; pattern: RegExp }> = [
  { provider: 'GOWSIGN', pattern: /(^|\.)gowsign\.com/i },
  { provider: 'SIGNWELL', pattern: /(^|\.)signwell\.com/i },
  { provider: 'PANDADOCS', pattern: /(^|\.)pandadoc\.com/i },
];

export class SigningPage extends BasePage {
  /** Top-level iframe union — used for "is there any iframe?" probes. */
  readonly anyIframe: Locator = this.page.locator(SELECTORS.signingAnyIframe);

  /**
   * Cached delegate for the GowSign DOM (only relevant when provider is
   * GOWSIGN and the document loaded as the top-level page). SignWell does
   * not have an equivalent rich PO yet — its widgets are operated via
   * `helpers/signwell.helpers.ts` against a `LocatorSource`.
   */
  private gowSignDelegate: GowSignDocumentViewerPage | null = null;

  constructor(page: Page) {
    super(page);
  }

  // ════════════════════════════════════════════════════════════════════
  // Provider detection
  // ════════════════════════════════════════════════════════════════════

  /**
   * Detect which provider rendered the signing surface. Polls until a
   * matching signal appears or the timeout expires.
   *
   * Strategy:
   *   1. Page URL host match (cheapest, most robust).
   *   2. Iframe `src` URL match (handles embedded surfaces).
   *
   * Returns `'UNKNOWN'` when no signal matches within the budget — the
   * caller decides how to treat that (most tests will fail with a clear
   * mismatch message against the matrix row's `expectedProvider`).
   */
  async getDetectedProvider(timeoutMs = 30_000): Promise<DetectedProvider> {
    const deadline = Date.now() + timeoutMs;
    let lastSeen: DetectedProvider = 'UNKNOWN';

    while (Date.now() < deadline) {
      // 1. Top-level URL — fast path for direct-navigation providers (e.g. GowSign in CA today)
      const fromUrl = this.matchProviderFromUrl(this.page.url());
      if (fromUrl !== 'UNKNOWN') return fromUrl;

      // 2. Iframe src match — embedded providers (SignWell typical, GowSign-in-modal)
      const fromIframe = await this.matchProviderFromIframes();
      if (fromIframe !== 'UNKNOWN') return fromIframe;

      lastSeen = 'UNKNOWN';
      await this.sleepShort();
    }

    return lastSeen;
  }

  /**
   * Wait until the signing surface is ready for interaction. Provider-agnostic:
   *   - GOWSIGN top-level page → delegate to `GowSignDocumentViewerPage.waitForLoaded`
   *   - GOWSIGN in iframe / SIGNWELL / PANDADOCS → wait for the iframe element
   *     to be attached + reach `domcontentloaded` (provider-internal readiness
   *     signals are provider-specific and out of scope here).
   *
   * Throws when no provider is detected — the test surface failed to render.
   */
  async waitForLoaded(timeoutMs = 60_000): Promise<void> {
    const surface = await this.resolveSurface(timeoutMs);

    if (surface.kind === 'page' && surface.provider === 'GOWSIGN') {
      const viewer = this.getGowSignDelegate();
      await viewer.waitForLoaded(timeoutMs);
      return;
    }

    if (surface.kind === 'frame') {
      // Frame body must be visible for any interaction. We do NOT assert on
      // a provider-specific "Start" element here — that's the job of
      // `isStartSignatureVisible()`.
      await surface.frame
        .locator('body')
        .waitFor({ state: 'visible', timeout: timeoutMs });
      return;
    }

    // Page-level non-GowSign (rare — would be SignWell hosted as top-level
    // page, or a future provider). Wait on the DOM anchor we have.
    await this.page.waitForLoadState('domcontentloaded', { timeout: timeoutMs });
  }

  /**
   * Read the provider's status badge / label (OUTSTANDING / SIGNED / etc.).
   * Returns `null` when the provider has no badge surface or it cannot be
   * read — never throws (page object rule: return values, don't assert).
   *
   * Currently only GOWSIGN exposes a structured badge (`gsStatusBadge`).
   * SignWell renders status via its own UI chrome that is not standardized;
   * tests that need SignWell status should query the DB
   * (`uown_esign_document.document_status`) instead.
   */
  async getStatusBadge(): Promise<string | null> {
    const provider = await this.getDetectedProvider(5_000);

    if (provider === 'GOWSIGN' && (await this.isProviderOnTopLevelPage('GOWSIGN'))) {
      try {
        return await this.getGowSignDelegate().getStatusBadge();
      } catch {
        return null;
      }
    }

    // SignWell / PandaDocs / GowSign-in-iframe / UNKNOWN: no uniform badge to
    // read from the host page. Tests should fall back to DB-side validation.
    return null;
  }

  /**
   * Returns `true` when the provider's "Start signing" entrypoint is visible.
   * Provider-aware:
   *   - GOWSIGN top-level → `GowSignDocumentViewerPage.isStartButtonVisible()`
   *   - SIGNWELL iframe   → `signwellStart` link inside the frame
   *   - GOWSIGN iframe    → `#startSignatureButton` inside the frame
   *   - PANDADOCS / UNKNOWN → `false`
   */
  async isStartSignatureVisible(): Promise<boolean> {
    const provider = await this.getDetectedProvider(5_000);

    if (provider === 'GOWSIGN' && (await this.isProviderOnTopLevelPage('GOWSIGN'))) {
      return this.getGowSignDelegate().isStartButtonVisible();
    }

    const frame = await this.getProviderFrame(provider);
    if (!frame) return false;

    if (provider === 'GOWSIGN') {
      return frame
        .locator(SELECTORS.gsStartSignatureButton)
        .isVisible({ timeout: 3_000 })
        .catch(() => false);
    }

    if (provider === 'SIGNWELL') {
      return frame
        .locator(SELECTORS.signwellStart)
        .first()
        .isVisible({ timeout: 3_000 })
        .catch(() => false);
    }

    if (provider === 'PANDADOCS') {
      return frame
        .locator(SELECTORS.pandaDocsStartSigning)
        .isVisible({ timeout: 3_000 })
        .catch(() => false);
    }

    return false;
  }

  /**
   * Click the provider's "Start signing" entrypoint.
   *
   * NOTE — this is intentionally a thin entrypoint click only. The full
   * signing happy path (canvas drawing, signature input, finish) is
   * provider-specific and lives in:
   *   - SignWell: `helpers/signwell.helpers.ts` → `completeSignwellFlow`
   *   - GowSign:  see `tests/e2e/gowsign/_explore-signing-widget.spec.ts`
   *               for canvas-based POC; full flow is wave-2 work.
   *
   * Tests that need to complete signing should call this method and then
   * delegate to the provider-specific helper with the appropriate
   * `LocatorSource` (`page` or `frame`).
   */
  async startSignature(): Promise<void> {
    const provider = await this.getDetectedProvider(10_000);

    if (provider === 'GOWSIGN' && (await this.isProviderOnTopLevelPage('GOWSIGN'))) {
      await this.getGowSignDelegate().clickStartSignature();
      return;
    }

    const frame = await this.getProviderFrame(provider);
    if (!frame) {
      throw new Error(
        `[SigningPage] Cannot start signature — no frame resolved for provider="${provider}". ` +
          'Ensure the iframe finished loading (call `waitForLoaded()` first) and that the ' +
          'redirectUrl actually rendered a known provider surface.',
      );
    }

    if (provider === 'GOWSIGN') {
      const startBtn = frame.locator(SELECTORS.gsStartSignatureButton);
      await startBtn.scrollIntoViewIfNeeded({ timeout: 5_000 }).catch(() => {});
      await startBtn.click({ timeout: 10_000 });
      return;
    }

    if (provider === 'SIGNWELL') {
      const startBtn = frame.locator(SELECTORS.signwellStart).first();
      await startBtn.waitFor({ state: 'visible', timeout: 30_000 });
      await startBtn.click();
      return;
    }

    if (provider === 'PANDADOCS') {
      // TODO(multi-state-signing): PandaDocs is treated as legacy; tests in
      // qa2 do not exercise it. Add a thin click here when the suite needs
      // PandaDocs coverage. Currently throws to surface the gap explicitly.
      throw new Error(
        '[SigningPage] startSignature() not implemented for PANDADOCS — provider is legacy in qa2. ' +
          'Update this method when PandaDocs becomes part of regression scope.',
      );
    }

    throw new Error(
      '[SigningPage] startSignature() called with provider=UNKNOWN — provider detection failed. ' +
        'Verify the redirectUrl loaded a known signing surface (gowsign.com / signwell.com / pandadoc.com).',
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // Internal helpers
  // ════════════════════════════════════════════════════════════════════

  /** Resolve URL → provider via the `URL_PATTERNS` table. */
  private matchProviderFromUrl(rawUrl: string): DetectedProvider {
    if (!rawUrl) return 'UNKNOWN';
    let host: string;
    try {
      host = new URL(rawUrl).hostname;
    } catch {
      // Non-URL strings (e.g. about:blank) — treat as unknown.
      return 'UNKNOWN';
    }
    for (const { provider, pattern } of URL_PATTERNS) {
      if (pattern.test(host)) return provider;
    }
    return 'UNKNOWN';
  }

  /**
   * Walk visible iframes and return the first one whose `src` resolves to a
   * known provider host. Uses Playwright's `frames()` API (read-only — no
   * interaction), so it is safe to call repeatedly.
   */
  private async matchProviderFromIframes(): Promise<DetectedProvider> {
    for (const frame of this.page.frames()) {
      const url = frame.url();
      const fromUrl = this.matchProviderFromUrl(url);
      if (fromUrl !== 'UNKNOWN') return fromUrl;
    }
    return 'UNKNOWN';
  }

  /** Returns `true` when the provider matches the TOP-LEVEL page URL. */
  private async isProviderOnTopLevelPage(provider: DetectedProvider): Promise<boolean> {
    return this.matchProviderFromUrl(this.page.url()) === provider;
  }

  /**
   * Resolve a `FrameLocator` for the detected provider's iframe, or `null`
   * when the provider lives at the top level (no iframe wrapper). Selector
   * order tries the most specific UOwn wrapper first, then falls back to
   * generic URL-based matching.
   */
  private async getProviderFrame(
    provider: DetectedProvider,
  ): Promise<FrameLocator | null> {
    if (provider === 'UNKNOWN') return null;

    if (provider === 'GOWSIGN') {
      // Specific UOwn `AlternativeContractModal` wrapper first — most stable.
      const modalIframe = this.page.locator(SELECTORS.signingGowSignIframe);
      if (await modalIframe.first().isVisible({ timeout: 1_000 }).catch(() => false)) {
        return this.page.frameLocator(SELECTORS.signingGowSignIframe);
      }
      // Generic URL-based fallback.
      const genericIframe = this.page.locator(SELECTORS.signingGowSignIframeByUrl);
      if (await genericIframe.first().isVisible({ timeout: 1_000 }).catch(() => false)) {
        return this.page.frameLocator(SELECTORS.signingGowSignIframeByUrl);
      }
      return null;
    }

    if (provider === 'SIGNWELL') {
      const iframe = this.page.locator(SELECTORS.signingSignWellIframeByUrl);
      if (await iframe.first().isVisible({ timeout: 1_000 }).catch(() => false)) {
        return this.page.frameLocator(SELECTORS.signingSignWellIframeByUrl);
      }
      return null;
    }

    if (provider === 'PANDADOCS') {
      const iframe = this.page.locator(SELECTORS.signingPandaDocsIframeByUrl);
      if (await iframe.first().isVisible({ timeout: 1_000 }).catch(() => false)) {
        return this.page.frameLocator(SELECTORS.signingPandaDocsIframeByUrl);
      }
      return null;
    }

    return null;
  }

  /**
   * Resolve the active signing surface (`page` or `frame`) for the detected
   * provider. Throws when no provider can be resolved within `timeoutMs`.
   */
  private async resolveSurface(timeoutMs: number): Promise<SigningSurface> {
    const provider = await this.getDetectedProvider(timeoutMs);
    if (provider === 'UNKNOWN') {
      throw new Error(
        '[SigningPage] No signing provider detected — neither page URL nor any iframe ' +
          'matched a known host (gowsign.com / signwell.com / pandadoc.com). ' +
          `URL was "${this.page.url()}"`,
      );
    }

    if (await this.isProviderOnTopLevelPage(provider)) {
      return { kind: 'page', provider };
    }

    const frame = await this.getProviderFrame(provider);
    if (!frame) {
      throw new Error(
        `[SigningPage] Provider "${provider}" detected but no iframe locator could be ` +
          'resolved. The signing surface may still be loading; increase `timeoutMs` or ' +
          'ensure the host page actually embeds the provider iframe.',
      );
    }
    return { kind: 'frame', provider, frame };
  }

  /** Lazily build the `GowSignDocumentViewerPage` delegate (top-level only). */
  private getGowSignDelegate(): GowSignDocumentViewerPage {
    if (!this.gowSignDelegate) {
      this.gowSignDelegate = new GowSignDocumentViewerPage(this.page);
    }
    return this.gowSignDelegate;
  }

  /**
   * Polling micro-sleep — uses Playwright's locator-based wait to avoid
   * `waitForTimeout()` (banned by `.claude/rules/page-objects.md`). 250ms
   * cadence keeps detection responsive without hammering the iframe list.
   */
  private async sleepShort(): Promise<void> {
    await this.anyIframe
      .first()
      .waitFor({ state: 'attached', timeout: 250 })
      .catch(() => {});
  }
}

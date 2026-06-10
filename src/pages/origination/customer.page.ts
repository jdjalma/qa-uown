import { expect } from '@playwright/test';
import { OriginationBasePage } from './origination-base.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';
import { sleep } from '../../helpers/common.helpers.js';
import { LoginPage } from '../login.page.js';
import { ConfigEnvironment } from '../../config/environment.js';

/**
 * One row of the Documents → Lease panel on the Origination customer page.
 * Returned by {@link OriginationCustomerPage.getLeasePanelContracts}.
 *
 * Sources (per row, in DOM order):
 *  - `contractNumber` — from the row container's `title=""` attribute
 *    (fallback: title button text)
 *  - `contractType`   — first `subtitle1` div (e.g. `LEASE`, `LEASE_MOD`)
 *  - `status`         — first `subtitle2` div (`SIGNED` | `SENT` | ...)
 *  - `termMonths`     — parsed from the second `subtitle2` div text
 *                       (`"Term\nMonths - 13"` → `13`); `null` if not parseable
 *  - `timestamp`      — raw `timeStamp` div text (e.g. `"-"` or full date string)
 */
export interface LeasePanelContract {
  contractNumber: string;
  contractType: string;
  status: string;
  termMonths: number | null;
  timestamp: string;
}

export class OriginationCustomerPage extends OriginationBasePage {
  // Customer header summary section — structure from snapshot:
  //   "Status" label followed by sibling with the value (e.g. "Approved")
  readonly leadStatus = this.page.locator(
    "xpath=//*[normalize-space(text())='Status']/following-sibling::*[1]"
  );
  readonly internalStatus = this.page.locator(
    "xpath=//*[normalize-space(text())='Internal Status']/following-sibling::*[1]"
  );
  readonly referenceNumber = this.page.locator(
    "xpath=//*[normalize-space(text())='Reference Number']/following-sibling::*[1]"
  );

  readonly moveToServicingButton = this.page.locator("button:has-text('Move to Servicing')");
  readonly changeToSignedButton = this.page.locator("button:has-text('Change to Signed')");
  readonly setToExpiredButton = this.page.locator("button:has-text('Set to Expired')");
  readonly settleLeaseForm = this.page.locator('#settleLeaseForm, .settle-lease-form');
  readonly createLeaseButton = this.page.locator("xpath=//div[text()='Lease']/../div[text()='Add New']");
  // F-005 fix: previous selector "button:has-text('Sign'), button:has-text('E-Sign')"
  // had a `:has-text('Sign')` clause that also matched "Change to Signed" (substring
  // "Sign"), causing strict-mode violations in SIGNED states where both buttons exist.
  // Cross-state MCP inspection (2026-05-24 — UOWN WK13/SM13/happy SIGNED, KS3015 SIGNED,
  // FUNDING/FUNDED) confirmed the e-sign trigger is always exact "E-Sign" in the
  // customer summary actions menu — never "Sign Contract" or "Sign" alone in qa1/stg.
  // We anchor on getByRole + exact name to avoid partial-text collisions.
  readonly signContractButton = this.page.getByRole('button', { name: /^E[-\s]?Sign$/i });
  readonly fundButton = this.page.locator("button:has-text('Fund')");
  readonly customerSummary = this.page.locator(SELECTORS.customerSummary);
  readonly confirmSettlement = this.page.locator(SELECTORS.isConfirmedForSettlement);
  readonly chargeProcessingFee = this.page.locator("input[name='chargeProcessingFeeBeforeEsign']");

  /**
   * Expand the collapsible actions menu in the customer summary header.
   * Clicks the caret-left SVG icon to reveal action buttons.
   */
  async expandActionsMenu(): Promise<void> {
    const caretIcon = this.page.locator('.fa-caret-left');
    if (await caretIcon.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await caretIcon.click({ force: true });
      await this.page.locator('.fa-caret-right').waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
      await sleep(500);
    }
  }

  /**
   * Click an action button from the customer summary collapsible menu.
   * Expands the menu first if needed.
   */
  async clickActionButton(buttonText: string): Promise<void> {
    await this.expandActionsMenu();
    const btn = this.page.locator(`button:has-text("${buttonText}")`);
    await btn.waitFor({ state: 'visible', timeout: 10_000 });
    await btn.click({ force: true });
    console.log(`[Customer] Clicked "${buttonText}"`);
    await this.waitForSpinner();
  }

  async getLeadStatus(): Promise<string> {
    return this.getTextContent(this.leadStatus);
  }

  /**
   * Polls for lead status by reloading the page until the status matches one of the expected keywords.
   * Returns the final status text. Does NOT throw if max attempts exceeded — returns last status.
   *
   * @param expectedKeywords - Array of lowercase substrings to match (e.g. ['signed', 'fund', 'settled'])
   * @param maxAttempts - Max reload attempts (default 10)
   * @param intervalMs - Sleep between attempts in ms (default 5000)
   * @returns Object with { status, matched } — matched is true if a keyword was found
   */
  async pollForLeadStatus(
    expectedKeywords: string[],
    maxAttempts = 10,
    intervalMs = 5_000,
  ): Promise<{ status: string; matched: boolean }> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await this.page.reload({ waitUntil: 'domcontentloaded', timeout: 60_000 });
      // F-005-remanescente (2026-05-24): reload can land on Merchant Login when
      // the storageState JWT expired mid-suite. Recover before reading status.
      await this.ensureAuthenticated();
      await this.waitForSpinner();
      await this.page.waitForLoadState('networkidle').catch(() => {});

      const status = await this.getLeadStatus();
      const sl = status.toLowerCase();
      console.log(`[PollStatus] attempt=${attempt}/${maxAttempts} status="${status}"`);

      if (expectedKeywords.some(kw => sl.includes(kw))) {
        console.log(`[PollStatus] Matched after ${attempt} attempt(s)`);
        return { status, matched: true };
      }

      if (attempt < maxAttempts) {
        await sleep(intervalMs);
      }
    }

    const finalStatus = await this.getLeadStatus();
    console.log(`[PollStatus] Max attempts reached — final status="${finalStatus}"`);
    return { status: finalStatus, matched: false };
  }

  async getInternalStatus(): Promise<string> {
    return this.getTextContent(this.internalStatus);
  }

  async selectLease(): Promise<void> {
    const leaseRow = this.page.locator("xpath=//div[text()='Lease']/parent::div/following-sibling::div/div/div[1]");
    await this.clickAndWaitForSpinner(leaseRow);
  }

  async clickMoveToServicing(): Promise<void> {
    await this.clickAndWaitForSpinner(this.moveToServicingButton);
  }

  async createLease(): Promise<void> {
    await this.clickAndWaitForSpinner(this.createLeaseButton);
  }

  async fillLeaseDetails(details: Record<string, string>): Promise<void> {
    for (const [field, value] of Object.entries(details)) {
      const input = this.page.locator(`[name="${field}"], #${field}`);
      if (await input.isVisible()) {
        await input.fill(value);
      }
    }
  }

  /**
   * Clicks "Change to Signed" button and confirms.
   * The button can be obscured by the horizontal scrolling summary bar,
   * so we first expand it by clicking the expand caret, then click the button.
   */
  async changeToSigned(): Promise<void> {
    // Expand the action buttons area if the expand caret is present
    const expandCaret = this.page.locator('svg[data-icon="caret-right"], svg[data-icon="caret-left"]').first();
    if (await expandCaret.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await expandCaret.click({ force: true });
      // Wait for the action buttons to become visible after expanding
      await this.changeToSignedButton.waitFor({ state: 'visible', timeout: 3_000 }).catch(() => {});
    }

    await this.changeToSignedButton.scrollIntoViewIfNeeded();
    await this.changeToSignedButton.click({ force: true });

    // A confirmation dialog or modal may appear
    const confirmBtn = this.page.getByRole('button', { name: /confirm|yes|ok/i }).first();
    if (await confirmBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await confirmBtn.click();
    }
    await this.waitForSpinner();
  }

  /**
   * Settles a lease via the Documents card UI modal.
   * Mirrors UownCustomerSteps.settleLeaseDocument() from the Java project.
   *
   * Flow: Documents card → click lease row's title button → modal opens →
   *       check #isConfirmedForSettlement → click primary submit button.
   *
   * Prerequisite: the lead must be in SIGNED status (e-sign completed).
   * For CI/CD tests that skip e-sign, use the settlement API instead.
   *
   * DOM contract (verified via LIVE qa1 inspection — lead 11839, 2026-05-24,
   * headless chromium with fresh login + browser_evaluate):
   *
   *   <div class="card-body">                              ← parent (3 children)
   *     <div class="...documentsItemHeader__VGRcq">Lease</div>  ← header LITERAL TEXT = "Lease"
   *     <div>...filter/upload row...</div>                 ← (other child)
   *     <div class="mb-5">                                 ← row body block
   *       <div title="UOWN_22122_11839" class="...contractItem__5Th8A">
   *         <button class="...contractItem__titleButton__hTVYk">UOWN_22122_11839</button>
   *         <div class="...contractItem__subtitle1__F0J2_">LEASE</div>
   *         <div class="...contractItem__subtitle2__wSL1B">SENT</div>
   *         ...
   *       </div>
   *     </div>
   *   </div>
   *
   * Fix history (pitfall #28):
   *   - v1 (text-regex `/^UOWN_/`): raced React rendering on MN16/KS3015; reload loop bug
   *   - v2 (hasText `/^Lease$/` on header): plausible but reported as failing in svc#530
   *     run; root cause unclear — could have been an unrelated timing/auth issue. Header
   *     literal IS "Lease" per live DOM.
   *   - v3 (`/Documents/i`): WRONG. Header text is "Lease", not "Documents". The class
   *     name contains the substring "documents" (`documentsItemHeader__`) but the text
   *     content is "Lease". The /Documents/i regex matched 0 headers → 30s timeout on
   *     ALL 13 CTs of svc#530 final run. (Confirmed via live qa1 evaluate.)
   *   - v4 (current): match header by /Lease/i text (matches the real header content).
   *     The xpath `following-sibling::*[1]` correctly walks to `.mb-5` row container
   *     (the row body is NOT a direct child of card-body's first child — it is a sibling
   *     of the header). Title-button anchored via stable `contractItem__titleButton__`
   *     CSS-module class. Live validation: count=1, visible=true, tag=BUTTON,
   *     text="UOWN_22122_11839".
   */
  /**
   * Session recovery (F-005-remanescente v8, 2026-05-24).
   *
   * Root cause: Playwright's `auth.setup` writes `.auth/origination.json` ONCE
   * before the suite starts. The JWT in `accountStore.userToken` has a fixed
   * TTL of ~15 minutes in qa1 (verified: iat=07:48 → exp=08:03 on the file
   * shipped with svc#530 v7). Tests that run more than ~15 min after
   * `auth.setup` load with an EXPIRED JWT; `page.goto(customers/{pk})`
   * succeeds at first (HTML loads, mobx stores hydrate from storageState)
   * then the SPA fires its first authenticated XHR, receives 401, and
   * route-guards push the user to `/` — losing the deep target.
   *
   * Why v7 failed in full-suite (probe-isolated passed 3/3 BUT runtime
   * failed CT-11/12 with `Auth state did not hydrate — retrying login`):
   *
   *   1. The `*Store$` localStorage guard was TRIVIALLY TRUE because the
   *      EXPIRED storageState contains ALL 9 stale stores (`accountStore`,
   *      `merchantStore`, ..., `leadStore`). The guard never proved that
   *      mobx had re-hydrated with a FRESH JWT — only that "some Store
   *      key exists", which was already the case before login.
   *
   *   2. `targetUrl = null` (raw url was `/` because the SPA already
   *      bounced before we read `page.url()`) → v7 relied on "SPA auto-
   *      return" which works in isolation but not after 10 prior tests
   *      have warmed up the SPA history and mobx routing state. In full-
   *      suite the SPA lands on `/overview`, never on the lead.
   *
   * Evidence (probes _f-005-probe.mjs, _f-005-real.mjs, _f-005-test-flow.mjs,
   * qa1 leads 11890/11891, 2026-05-24):
   *
   *   - .auth/origination.json JWT iat=09:29:23, exp=09:44:23 (15-min TTL)
   *   - storageState contains 9 stale `*Store` keys (passes v7 guard
   *     instantly even with NO auth performed)
   *   - In test-flow probe, `page.url()` after `goto(customers/11890)`
   *     showed `customers/11890` for ~800ms BEFORE the 401-bounce
   *     redirected it to `/` — the bounce is async (post-XHR-401),
   *     creating a race where `isLoginPage()` flips from false → true
   *
   * Precedent: `payment-arrangement.page.ts:84-110` already implements the
   * working pattern for Servicing (stg JWT TTL ~9min): `goto(base)` →
   * `loginPage.login` → `waitForLoadState('networkidle')` → `goto(deepUrl)`.
   *
   * v8 fix:
   *
   *   A. Pre-emptive JWT check: decode `accountStore.userToken` BEFORE doing
   *      anything; if exp ≤ now + 60s, force re-auth without waiting for
   *      the lazy SPA bounce.
   *
   *   B. Caller-supplied intended path: tests that call
   *      `settleLeaseViaDocuments()` already navigated to
   *      `/customers/{leadPk}`. We capture that path from `page.url()`
   *      BEFORE any potential bounce and pass it to ensureAuthenticated.
   *      No more `targetUrl = null` → no more reliance on SPA auto-return.
   *
   *   C. Re-auth flow aligned with Servicing: `goto(base)` → login →
   *      `networkidle` → `goto(intendedPath)`. This is the SAME pattern
   *      that `payment-arrangement.page.ts` ships with and that has been
   *      stable across stg full-suite runs.
   *
   *   D. Real hydration guard: poll until JWT in `accountStore.userToken`
   *      decodes with `exp > now + 60s` (proves a FRESH token, not stale).
   *
   * @param intendedPath  Path the caller wants to land on after auth
   *                      (e.g. `/customers/11890`). If omitted, defaults to
   *                      the current `page.url()` IF that URL is a deep
   *                      target; otherwise no post-auth goto is issued.
   */
  async ensureAuthenticated(intendedPath?: string): Promise<void> {
    const envName = process.env.ENV || 'sandbox';
    const env = new ConfigEnvironment(envName);
    const base = env.originationUrl.replace(/\/$/, '');
    const creds = env.getCredentials('manager');
    const loginPage = new LoginPage(this.page);

    // Resolve the intended target ONCE, eagerly. If the caller did not pass
    // one, snapshot the current URL — but only treat it as a target if it
    // is a deep link (not `/` or `/login` or merchant-login bounce).
    const rawUrl = this.page.url();
    let candidateTarget = intendedPath ?? rawUrl;
    try {
      const u = new URL(candidateTarget, base);
      const isBounce = /^\/(login)?$|merchant.?login/i.test(u.pathname);
      candidateTarget = isBounce ? '' : `${base}${u.pathname}${u.search}`;
    } catch { candidateTarget = ''; }

    // ── A. Pre-emptive JWT check ────────────────────────────────────────
    // Decode accountStore.userToken; if missing or exp ≤ now + 60s, force
    // re-auth. This catches the case where the storageState shipped from
    // auth.setup is already past its TTL by the time the Nth test runs.
    const jwtState = await this.page.evaluate(() => {
      try {
        const raw = localStorage.getItem('accountStore');
        if (!raw) return { present: false, expSec: 0 };
        const tok = JSON.parse(raw).userToken;
        if (!tok || typeof tok !== 'string') return { present: false, expSec: 0 };
        const parts = tok.split('.');
        if (parts.length < 2) return { present: false, expSec: 0 };
        const pad = parts[1] + '='.repeat((4 - parts[1].length % 4) % 4);
        const payload = JSON.parse(atob(pad.replace(/-/g, '+').replace(/_/g, '/')));
        return { present: true, expSec: Number(payload?.exp ?? 0) };
      } catch { return { present: false, expSec: 0 }; }
    }).catch(() => ({ present: false, expSec: 0 }));

    const nowSec = Math.floor(Date.now() / 1000);
    const jwtFresh = jwtState.present && jwtState.expSec > nowSec + 60;
    const onLoginNow = await loginPage.isLoginPage();

    if (jwtFresh && !onLoginNow) {
      // Auth is current AND we are not staring at a login form — nothing to do.
      return;
    }

    if (!jwtFresh) {
      console.log(
        `[Origination.ensureAuthenticated] JWT pre-check failed in ${envName} ` +
        `(present=${jwtState.present} expSec=${jwtState.expSec} nowSec=${nowSec}) — re-authenticating`,
      );
    } else {
      console.log(`[Origination.ensureAuthenticated] Login page detected in ${envName} — re-authenticating`);
    }

    // ── C. Re-auth: settle the page first, THEN drive the login form ──
    //
    // Headless race avoidance: if the prior goto(leadUrl) is still in-flight
    // (pending 401 bounce from the SPA's first authenticated XHR), an
    // explicit goto(base) here races with the SPA's own router.push and
    // gets ERR_ABORTED by Chromium. Instead, we wait for the page to
    // settle (either networkidle OR the login form appears), then submit
    // the login form wherever it lands.
    //
    // Mirrors the spirit of `payment-arrangement.page.ts:84-110` (Servicing)
    // without the brittle "always goto(base)" assumption that breaks under
    // concurrent SPA redirects.
    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});

    // After settling, if we are still NOT on a login form, the SPA never
    // bounced — but our JWT pre-check said the token is stale. Force the
    // bounce by reloading; the SPA will detect the 401 on its next XHR
    // and route us to the login form WITHOUT racing with an external goto.
    if (!(await loginPage.isLoginPage())) {
      console.log('[Origination.ensureAuthenticated] No login form after settle — reloading to trigger SPA bounce');
      await this.page.reload({ waitUntil: 'domcontentloaded', timeout: 60_000 }).catch(() => {});
      await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
      // Last-chance wait for the login form to render.
      await this.page.locator('input[type="password"]').first()
        .waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
    }

    await loginPage.login(creds.username, creds.password);
    await this.page.waitForLoadState('networkidle').catch(() => {});

    // ── D. Real hydration guard ─────────────────────────────────────────
    // Poll until accountStore.userToken decodes to a JWT whose exp is
    // strictly in the future (> now + 60s). This proves mobx wrote a
    // FRESH token, not just that some `*Store` key exists in localStorage
    // (the v7 guard was trivially satisfied by stale stores).
    const hydrated = await this.page.waitForFunction(
      (minExp) => {
        if (document.querySelector('input[type="password"]')) return false;
        try {
          const raw = localStorage.getItem('accountStore');
          if (!raw) return false;
          const tok = JSON.parse(raw).userToken;
          if (!tok || typeof tok !== 'string') return false;
          const parts = tok.split('.');
          if (parts.length < 2) return false;
          const pad = parts[1] + '='.repeat((4 - parts[1].length % 4) % 4);
          const payload = JSON.parse(atob(pad.replace(/-/g, '+').replace(/_/g, '/')));
          return Number(payload?.exp ?? 0) > minExp;
        } catch { return false; }
      },
      nowSec + 60,
      { timeout: 30_000 },
    ).then(() => true).catch(() => false);

    if (!hydrated) {
      // One retry on submit-flake. Re-fill credentials and re-poll.
      console.log('[Origination.ensureAuthenticated] Fresh JWT not visible after login — retrying once');
      if (await loginPage.isLoginPage()) {
        await loginPage.login(creds.username, creds.password);
        await this.page.waitForLoadState('networkidle').catch(() => {});
      }
    }

    // ── B. Navigate to the captured intended target ─────────────────────
    if (candidateTarget) {
      const currentPath = new URL(this.page.url()).pathname.replace(/\/$/, '');
      const targetPath = new URL(candidateTarget).pathname.replace(/\/$/, '');
      if (currentPath !== targetPath) {
        console.log(`[Origination.ensureAuthenticated] Navigating to intended target ${targetPath}`);
        await this.page.goto(candidateTarget, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      }
    } else {
      console.log(`[Origination.ensureAuthenticated] No intended target captured; staying on ${new URL(this.page.url()).pathname}`);
    }

    await this.waitForSpinner();
  }

  async settleLeaseViaDocuments(): Promise<void> {
    // Capture the intended deep-link BEFORE invoking ensureAuthenticated.
    // If the SPA has already bounced us to '/' (async 401 redirect from a
    // stale storageState), `page.url()` at the top of ensureAuthenticated
    // would be `/` and we'd lose the lead target. The test ALREADY did a
    // `page.goto(.../customers/{leadPk})` before calling this method, so
    // the current pathname here is the intended target — even if the form
    // is about to render on top of it.
    const intendedPath = this.page.url();

    // Guard against expired storageState (see ensureAuthenticated docstring).
    await this.ensureAuthenticated(intendedPath);

    await this.waitForSpinner();

    // Scope to the Lease panel header. Live DOM (qa1 lead 11839) confirms the
    // header literal text is "Lease" — NOT "Documents". The CSS-module class
    // contains the substring "documents" (`documentsItemHeader__`) but the
    // rendered text content is the single word "Lease".
    const leaseHeader = this.page
      .locator(SELECTORS.leasePanelHeader)
      .filter({ hasText: /Lease/i })
      .first();

    // The contract rows live in the next sibling block (.mb-5) of the Lease header.
    // We click the title button of the first contract row (LEASE / LEASE_MOD).
    const leaseTitleButton = leaseHeader
      .locator('xpath=following-sibling::*[1]')
      .locator(SELECTORS.leasePanelContractTitleButton)
      .first();

    // Single wait with a generous budget — MN16/KS3015 contracts can take
    // longer to render. No reload loop: reloading mid-render restarts the
    // race instead of resolving it.
    await leaseTitleButton.waitFor({ state: 'visible', timeout: 30_000 });
    await leaseTitleButton.scrollIntoViewIfNeeded();
    await leaseTitleButton.click();
    console.log('[Settle] Clicked lease document title button');

    // 2. Wait for the settlement modal
    const modal = this.page.locator('#customer-lease-modal, #customer-overview-modal');
    await modal.waitFor({ state: 'visible', timeout: 10_000 });

    // 3. Wait for any spinner inside the modal to finish loading
    await this.waitForSpinner();
    await this.page.locator(`${SELECTORS.spinnerBorder}, ${SELECTORS.spinnerGrow}`).first()
      .waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {});

    // 4. Check the settlement confirmation checkbox
    const confirmCheckbox = this.page.locator(SELECTORS.isConfirmedForSettlement);
    await confirmCheckbox.waitFor({ state: 'visible', timeout: 30_000 });
    await confirmCheckbox.check();

    // 5. Wait for the submit button to be enabled after checkbox check, then click
    const submitBtnSettle = modal.locator(SELECTORS.buttonPrimary).last();
    await submitBtnSettle.waitFor({ state: 'visible', timeout: 5_000 });

    // 5. Click the last primary button in the modal
    const submitBtn = modal.locator(SELECTORS.buttonPrimary).last();
    await submitBtn.click();

    // 6. Wait for success toast (non-fatal — some environments settle without a toast)
    const toastText = await this.captureAndDismissToast(15_000).catch(() => '');
    if (toastText) {
      console.log(`[Settle] Toast: "${toastText}"`);
    } else {
      console.log('[Settle] No toast appeared — settlement may still have succeeded');
    }
    await this.waitForSpinner();
  }

  async submitSettlement(): Promise<void> {
    const confirmCheckbox = this.page.locator(SELECTORS.isConfirmedForSettlement);
    if (await confirmCheckbox.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await confirmCheckbox.check();
    }
    const submitBtn = this.page.locator(`${SELECTORS.submitButton}, ${SELECTORS.buttonPrimary}`).last();
    await this.clickAndWaitForSpinner(submitBtn);
  }

  async waitForLeadStatus(expectedStatus: string, timeoutMs = 30_000): Promise<void> {
    await expect(this.leadStatus).toContainText(expectedStatus, { timeout: timeoutMs });
  }

  async getAccountNumberFromSummary(): Promise<string> {
    // Try the SELECTORS.accountNumberLink first (scoped to #customer-summary)
    const link = this.page.locator(SELECTORS.accountNumberLink);
    if (await link.isVisible({ timeout: 3_000 }).catch(() => false)) {
      return this.getTextContent(link);
    }

    // Fallback: find "Account Number" label followed by a link anywhere in the header
    const headerLink = this.page.locator(
      "xpath=//*[normalize-space(text())='Account Number']/following-sibling::a[1]"
    ).first();
    if (await headerLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
      return this.getTextContent(headerLink);
    }

    // Fallback: find "Account Number" label followed by any sibling with numeric text
    const headerValue = this.page.locator(
      "xpath=//*[normalize-space(text())='Account Number']/following-sibling::*[1]"
    ).first();
    if (await headerValue.isVisible({ timeout: 3_000 }).catch(() => false)) {
      return this.getTextContent(headerValue);
    }

    // Fall back: extract from URL (e.g., /customers/12345)
    const url = this.page.url();
    const match = url.match(/\/customers\/(\d+)/);
    return match?.[1] || '';
  }

  /**
   * Retrieves customer info fields from the customer detail page.
   * The page structure uses label/value pairs like:
   *   <div>First Name</div> <div>TestFN...</div>
   */
  async getCustomerInfo(): Promise<Record<string, string>> {
    const info: Record<string, string> = {};
    const fieldMappings: Record<string, string> = {
      'First Name': 'First Name',
      'Last Name': 'Last Name',
      'Date of Birth': 'Date of Birth',
      'SSN': 'SSN',
      'Address Line 1': 'Address',
      'City': 'City',
      'State': 'State',
      'ZIP': 'Zip',
      'Primary Email': 'Email',
      'Mobile Phone': 'Phone',
    };

    for (const [pageLabel, infoKey] of Object.entries(fieldMappings)) {
      const value = this.page.locator(
        `xpath=//*[normalize-space(text())='${pageLabel}']/following-sibling::*[1]`
      ).first();
      if (await value.isVisible({ timeout: 5_000 }).catch(() => false)) {
        info[infoKey] = await this.getTextContent(value);
      }
    }
    return info;
  }

  /**
   * Validates customer info matches expected applicant data.
   */
  /**
   * Opens the "Modify Approval Amount" modal, fills in the new amount and comment,
   * then submits. Returns the toast message text.
   * Mirrors UownCustomerSteps.modifyingTheApprovalAmount() from the Java project.
   */
  async modifyApprovalAmount(newAmount: string, comment: string): Promise<string> {
    await this.clickActionButton('Modify Approval Amount');

    // Fill approval amount
    const approvalInput = this.page.locator(SELECTORS.approvalAmountInput);
    await approvalInput.waitFor({ state: 'visible', timeout: 10_000 });
    await approvalInput.clear();
    await approvalInput.fill(newAmount);

    // Fill comment
    await sleep(250);
    const commentInput = this.page.locator(SELECTORS.commentInput);
    await commentInput.clear();
    await commentInput.fill(comment);

    await sleep(250);

    // Click the last primary button (submit)
    const submitBtn = this.page.locator(SELECTORS.buttonPrimary).last();
    await submitBtn.click();

    // Capture toast message
    const toastText = await this.captureAndDismissToast(10_000);
    console.log(`[ModifyApproval] Toast: "${toastText}"`);
    await this.waitForSpinner();

    return toastText;
  }

  /**
   * Checks whether the "Modify Approval Amount" button is visible on the customer page.
   */
  async isModifyApprovalAmountVisible(): Promise<boolean> {
    await this.expandActionsMenu();
    const btn = this.page.locator("button:has-text('Modify Approval Amount')");
    return btn.isVisible({ timeout: 5_000 }).catch(() => false);
  }

  /**
   * Dismisses the alert bar if visible (it can overlap action buttons).
   */
  private async dismissAlertBar(): Promise<void> {
    const hideAlert = this.page.locator('text=Hide Alert').first();
    if (await hideAlert.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await hideAlert.click();
      // Wait for alert bar to disappear
      await hideAlert.waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});
      console.log('[CancelLease] Dismissed alert bar');
    }
  }

  /**
   * Cancels a lease via the "Cancel Lease" action button.
   * Handles modal-based cancellation with retry logic.
   *
   * Flow: Dismiss alert → Click Cancel Lease → modal opens → fill comment →
   *       optionally check refund → confirm → toast
   */
  async cancelLease(comment: string, refundAllPayments = false): Promise<string> {
    // Dismiss alert bar first — it can overlap the Cancel Lease button
    await this.dismissAlertBar();

    let confirmed = false;

    for (let attempt = 1; attempt <= 5; attempt++) {
      console.log(`[CancelLease] Attempt ${attempt}/5`);

      // Check if a toast already appeared from a previous attempt
      const earlyToast = await this.page.locator(SELECTORS.toastBody)
        .isVisible({ timeout: 1_000 }).catch(() => false);
      if (earlyToast) {
        console.log('[CancelLease] Toast already visible — cancel succeeded');
        confirmed = true;
        break;
      }

      // Expand actions menu and click Cancel Lease
      await this.expandActionsMenu();
      const cancelBtn = this.page.locator("button:has-text('Cancel Lease')");
      const btnVisible = await cancelBtn.isVisible({ timeout: 5_000 }).catch(() => false);
      if (!btnVisible) {
        console.log(`[CancelLease] Cancel Lease button not visible on attempt ${attempt}`);
        await this.dismissAlertBar();
        await sleep(1_000);
        continue;
      }
      try {
        await cancelBtn.click({ force: true });
      } catch (clickErr) {
        console.log(`[CancelLease] Click failed (menu may have collapsed): ${clickErr}`);
        await sleep(1_000);
        continue;
      }

      // Wait for modal with a comment input (not just any .modal.show)
      const commentInModal = this.page.locator('.modal.show textarea, .modal.show input[name="comment"], .modal.show #comment').first();
      const hasCommentInput = await commentInModal.isVisible({ timeout: 5_000 }).catch(() => false);

      if (!hasCommentInput) {
        // Check for direct toast (cancel without modal)
        const toastAlready = await this.page.locator(SELECTORS.toastBody)
          .isVisible({ timeout: 3_000 }).catch(() => false);
        if (toastAlready) {
          console.log('[CancelLease] Direct cancel — toast appeared without modal');
          confirmed = true;
          break;
        }
        console.log(`[CancelLease] No cancel modal on attempt ${attempt}`);
        // Dismiss any stale modal
        await this.page.keyboard.press('Escape');
        await this.page.locator(SELECTORS.modalShow).last()
          .waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});
        await this.dismissAlertBar();
        await sleep(1_000);
        continue;
      }

      console.log('[CancelLease] Cancel modal detected — filling form');

      // Fill comment
      try {
        await commentInModal.fill(comment);
        console.log('[CancelLease] Comment filled');
      } catch (e) {
        console.log(`[CancelLease] Failed to fill comment: ${e}`);
        await this.page.keyboard.press('Escape');
        await this.page.locator(SELECTORS.modalShow).last()
          .waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});
        continue;
      }

      // Optionally check refund checkbox
      if (refundAllPayments) {
        const refundCheckbox = this.page.locator(
          '.modal.show input[name="refundAllPayments"], .modal.show input[type="checkbox"][name*="refund"], .modal.show input[type="checkbox"]',
        ).first();
        if (await refundCheckbox.isVisible({ timeout: 2_000 }).catch(() => false)) {
          await refundCheckbox.check();
          console.log('[CancelLease] Refund checkbox checked');
        }
      }

      await sleep(500);

      // Find and click the "Cancel Lease" confirm button
      // Use page-level selector (not scoped to modal variable) to handle re-renders
      const confirmBtn = this.page.locator('.modal.show button:has-text("Cancel Lease")');
      const confirmVisible = await confirmBtn.isVisible({ timeout: 5_000 }).catch(() => false);
      if (confirmVisible) {
        console.log('[CancelLease] Clicking "Cancel Lease" confirm button');
        try {
          await confirmBtn.click({ force: true });
          confirmed = true;
        } catch (confirmErr) {
          console.log(`[CancelLease] Confirm click failed: ${confirmErr}`);
          await this.page.keyboard.press('Escape');
          await sleep(1_000);
          continue;
        }
      } else {
        // Fallback: try the last button in the modal footer
        const footerBtns = this.page.locator('.modal.show .modal-footer button, .modal.show button');
        const count = await footerBtns.count();
        console.log(`[CancelLease] Confirm button not found, ${count} buttons total`);
        if (count >= 2) {
          // Last button is typically the action button
          const lastBtn = footerBtns.nth(count - 1);
          const btnText = await lastBtn.textContent().catch(() => '?');
          console.log(`[CancelLease] Clicking last button: "${btnText?.trim()}"`);
          await lastBtn.click({ force: true });
          confirmed = true;
        } else {
          // No usable buttons — dismiss and retry
          console.log('[CancelLease] No usable buttons — dismissing modal and retrying');
          await this.page.keyboard.press('Escape');
          await sleep(1_000);
          continue;
        }
      }

      // Wait for modal to close
      await this.page.locator(SELECTORS.modalShow).last()
        .waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {
          console.log('[CancelLease] Warning: modal did not close after confirm click');
        });
      break;
    }

    // Capture toast message
    const toastText = await this.captureAndDismissToast(60_000);
    console.log(`[CancelLease] Toast: "${toastText}"`);
    await this.waitForSpinner();

    return toastText;
  }

  /**
   * Deletes all invoice line items by clicking the delete button repeatedly
   * until no more are visible. Safety cap at 20 iterations.
   */
  async deleteAllInvoiceItems(): Promise<number> {
    let deleted = 0;
    const maxIterations = 20;

    for (let i = 0; i < maxIterations; i++) {
      const deleteBtn = this.page.locator(SELECTORS.invoiceItemDeleteButton).first();
      if (!await deleteBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        break;
      }

      await deleteBtn.click();

      // Handle confirmation dialog if present
      const confirmBtn = this.page.getByRole('button', { name: /confirm|yes|ok|delete/i }).first();
      if (await confirmBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await confirmBtn.click();
      }

      await this.waitForSpinner();
      deleted++;
      console.log(`[DeleteInvoiceItems] Deleted item ${deleted}`);
    }

    console.log(`[DeleteInvoiceItems] Total items deleted: ${deleted}`);
    return deleted;
  }

  // ── Invoice / Lease Creation ────────────────────────────────────

  /**
   * Creates a new invoice/lease with line items on the customer page.
   * Mirrors AccountCreationSteps.createNewLease() from the Java project.
   *
   * Flow: Click "Add New" → add line items → fill sales person + invoice # →
   *       check settlement checkbox → submit → select program → confirm.
   */
  async createInvoiceWithItems(
    items: Array<{
      numberOfItems: string;
      itemCode: string;
      description: string;
      price: string;
      deliveryFee?: string;
      installationFee?: string;
      miscFee?: string;
    }>,
    options: {
      salesPerson: string;
      invoiceNumber: string;
      programName?: string;
    },
  ): Promise<void> {
    // Click "Add New" to open the invoice form
    await this.createLeaseButton.waitFor({ state: 'visible', timeout: 10_000 });
    await this.createLeaseButton.click();
    await this.waitForSpinner();

    // Wait for the item form to appear
    await this.page.locator(SELECTORS.naItemCode).waitFor({ state: 'visible', timeout: 10_000 });

    // Add each line item
    for (const item of items) {
      await this.page.locator(SELECTORS.naNumberOfItems).fill(item.numberOfItems);
      await this.page.locator(SELECTORS.naItemCode).fill(item.itemCode);
      await this.page.locator(SELECTORS.naItemDescription).fill(item.description);
      await this.page.locator(SELECTORS.naBasePricePerItem).fill(item.price);

      // Optional fee fields
      const deliveryFee = this.page.locator(SELECTORS.naDeliveryFee);
      if (await deliveryFee.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await deliveryFee.fill(item.deliveryFee ?? '0.00');
      }
      const installationFee = this.page.locator(SELECTORS.naInstallationFee);
      if (await installationFee.isVisible({ timeout: 1_000 }).catch(() => false)) {
        await installationFee.fill(item.installationFee ?? '0.00');
      }
      const miscFee = this.page.locator(SELECTORS.naMiscFee);
      if (await miscFee.isVisible({ timeout: 1_000 }).catch(() => false)) {
        await miscFee.fill(item.miscFee ?? '0.00');
      }

      // Submit this line item
      const submitItemBtn = this.page.locator(SELECTORS.naSubmitItemLease).first();
      await submitItemBtn.click();
      await this.waitForSpinner();
      // Wait for the item code field to clear (form reset after adding item)
      await this.page.locator(SELECTORS.naItemCode).waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
      console.log(`[CreateInvoice] Added item: ${item.description} @ $${item.price}`);
    }

    // Fill sales person and invoice number
    const salesPerson = this.page.locator(SELECTORS.naSalesPerson);
    if (await salesPerson.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await salesPerson.fill(options.salesPerson);
    }
    const invoiceNumber = this.page.locator(SELECTORS.naInvoiceNumber);
    if (await invoiceNumber.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await invoiceNumber.fill(options.invoiceNumber);
    }

    // Check settlement confirmation checkbox
    const confirmCheckbox = this.page.locator(SELECTORS.isConfirmedForSettlement);
    if (await confirmCheckbox.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await confirmCheckbox.check();
    }

    // Submit the entire invoice
    await this.page.locator(SELECTORS.buttonPrimary).last().click();
    await this.waitForSpinner();

    // Wait for toast
    const toast = this.page.locator(SELECTORS.toastBody);
    await toast.waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});
    const toastText = await toast.textContent().catch(() => '');
    console.log(`[CreateInvoice] Toast: "${toastText}"`);

    // Handle program selection modal if it appears
    await this.selectProgram(options.programName ?? 'Bi-Weekly');
  }

  /**
   * Handles the program selection modal that appears after invoice submission.
   * Selects the specified program (e.g., "Bi-Weekly Payment Program").
   */
  private async selectProgram(programName: string): Promise<void> {
    const modal = this.page.locator(SELECTORS.modalContent);
    if (!await modal.isVisible({ timeout: 5_000 }).catch(() => false)) {
      console.log('[CreateInvoice] No program selection modal — skipping');
      return;
    }

    // Find and click the button containing the program name
    const programBtn = this.page.locator(`button:has-text("${programName}")`).first();
    if (await programBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await programBtn.click();
      await this.waitForSpinner();

      // Confirm selection (click the primary button in the modal, usually index 1)
      const confirmBtn = modal.locator(SELECTORS.buttonPrimary).first();
      if (await confirmBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await confirmBtn.click();
      }
      await this.waitForSpinner();
      // Wait for program selection modal to close
      await this.page.locator(SELECTORS.modalContent)
        .waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
      console.log(`[CreateInvoice] Program "${programName}" selected`);
    } else {
      console.log(`[CreateInvoice] Program "${programName}" button not found`);
    }
  }

  /**
   * Modifies an existing lease via the "Modify Lease" action button.
   * Clicks the action button, handles optional warning modal, waits for
   * the invoice form to appear, executes the callback, then saves.
   * Returns the toast message text.
   *
   * @param callback — async function receiving the page to manipulate invoice items
   */
  async modifyLease(callback: (page: import('@playwright/test').Page) => Promise<void>): Promise<string> {
    await this.clickActionButton('Modify Lease');

    // Warning modal may or may not appear — handle both cases
    const continueBtn = this.page.locator(SELECTORS.modifyLeaseWarningContinue);
    if (await continueBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      console.log('[ModifyLease] Warning modal detected — clicking Continue');
      await continueBtn.click();
      await this.waitForSpinner();
    } else {
      console.log('[ModifyLease] No warning modal — proceeding directly');
    }

    // Wait for the invoice form to be ready (item fields visible)
    const itemCodeField = this.page.locator(SELECTORS.naItemCode);
    const deleteBtn = this.page.locator(SELECTORS.invoiceItemDeleteButton).first();
    await Promise.race([
      itemCodeField.waitFor({ state: 'visible', timeout: 15_000 }),
      deleteBtn.waitFor({ state: 'visible', timeout: 15_000 }),
    ]).catch(() => {
      console.log('[ModifyLease] Invoice form fields not yet visible — waiting more');
    });
    await sleep(1_000);

    // Execute the caller's modification logic
    await callback(this.page);

    // Click Save — try modal save first, then page-level save
    const saveBtn = this.page.locator(SELECTORS.modifyLeaseSaveButton);
    if (await saveBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await saveBtn.click();
    } else {
      const fallbackSave = this.page.locator(SELECTORS.saveButton);
      if (await fallbackSave.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await fallbackSave.click();
      } else {
        // Last resort: find any Save/Submit button
        const anySubmit = this.page.locator("button:has-text('Save'), button:has-text('SAVE'), button[type='submit']").last();
        await anySubmit.click();
      }
    }
    await this.waitForSpinner();

    // Capture toast message
    const toastText = await this.captureAndDismissToast(30_000);
    console.log(`[ModifyLease] Toast: "${toastText}"`);
    await this.waitForSpinner();

    return toastText;
  }

  /**
   * Retrieves activity log entries from the Activity card on the customer page.
   * Returns an array of text content from each log row.
   */
  async getActivityLogEntries(): Promise<string[]> {
    const entries: string[] = [];
    const rows = this.page.locator(SELECTORS.activityLogEntry);
    const count = await rows.count().catch(() => 0);
    for (let i = 0; i < count; i++) {
      const text = (await rows.nth(i).textContent())?.trim() || '';
      if (text) entries.push(text);
    }
    return entries;
  }

  /**
   * Reads the Documents → Lease panel and returns every contract row (LEASE,
   * LEASE_MOD, etc.) with its metadata. Used to assert the contract list after
   * a lease modification (Task #521 LEASEMOD GowSign).
   *
   * DOM contract (CSS-module classes are prefix-matched — pitfall #26):
   *   <div class="...documentsItemHeader__..."><div>Lease</div></div>
   *   <div class="mb-5">
   *     <div title="UOWN_69109_11276" class="...contractItem__...">
   *       <button class="...contractItem__titleButton__...">UOWN_69109_11276</button>
   *       <div class="...contractItem__subtitle1__...">LEASE_MOD</div>
   *       <div class="...contractItem__subtitle2__...">SENT</div>
   *       <div class="...contractItem__subtitle2__...">Term<br>Months - 13</div>
   *       <div class="...contractItem__timeStamp__...">-</div>
   *     </div>
   *     ...
   *   </div>
   *
   * The row container exposes the contract number via `title=""`, which we
   * prefer over the button text because it is the data-bound source. Rows are
   * returned in DOM order (LEASE_MOD typically precedes the original LEASE).
   */
  async getLeasePanelContracts(): Promise<LeasePanelContract[]> {
    // Lease panel header — literal text is "Lease" (verified via LIVE qa1
    // inspection 2026-05-24 lead 11839). The `documentsItemHeader__` class is a
    // CSS-module name that contains the substring "documents", but the rendered
    // text is "Lease". CSS-module prefix is stable across builds.
    const leaseHeader = this.page
      .locator(SELECTORS.leasePanelHeader)
      .filter({ hasText: /Lease/i })
      .first();

    if (!await leaseHeader.isVisible({ timeout: 5_000 }).catch(() => false)) {
      console.log('[LeasePanel] Lease header not visible — returning []');
      return [];
    }

    // Contract rows live in the next sibling block (the .mb-5 container that
    // immediately follows the header). Use the row container selector directly
    // and pick those whose closest preceding documents-header is the Lease one.
    // Simpler: rows that share the same .mb-5 ancestor as the next sibling of
    // the Lease header.
    const rows = leaseHeader
      .locator('xpath=following-sibling::*[1]')
      .locator(SELECTORS.leasePanelContractItem);

    const count = await rows.count().catch(() => 0);
    if (count === 0) {
      console.log('[LeasePanel] No contract rows found under Lease header');
      return [];
    }

    const contracts: LeasePanelContract[] = [];
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);

      // Contract number — prefer the row's `title` attribute (data-bound).
      // Fallback to the title button text content.
      let contractNumber = (await row.getAttribute('title').catch(() => null)) ?? '';
      if (!contractNumber) {
        contractNumber = (
          await row.locator(SELECTORS.leasePanelContractTitleButton).first().textContent().catch(() => '')
        )?.trim() ?? '';
      }

      const contractType = ((
        await row.locator(SELECTORS.leasePanelContractSubtitle1).first().textContent().catch(() => '')
      ) ?? '').trim();

      const subtitle2 = row.locator(SELECTORS.leasePanelContractSubtitle2);
      const subtitle2Count = await subtitle2.count().catch(() => 0);

      const status = subtitle2Count > 0
        ? ((await subtitle2.nth(0).textContent().catch(() => '')) ?? '').trim()
        : '';

      let termMonths: number | null = null;
      if (subtitle2Count > 1) {
        // textContent collapses the <br> to whitespace — e.g. "Term Months - 13".
        const termText = ((await subtitle2.nth(1).textContent().catch(() => '')) ?? '').trim();
        const match = termText.match(/Term[\s\n]*Months\s*-\s*(\d+)/i);
        if (match) {
          termMonths = Number.parseInt(match[1], 10);
        }
      }

      const timestamp = ((
        await row.locator(SELECTORS.leasePanelContractTimestamp).first().textContent().catch(() => '')
      ) ?? '').trim();

      contracts.push({ contractNumber, contractType, status, termMonths, timestamp });
    }

    console.log(`[LeasePanel] Parsed ${contracts.length} contract(s): ${contracts.map(c => `${c.contractType}/${c.status}`).join(', ')}`);
    return contracts;
  }

  /**
   * F-005 cross-state helper. Returns the most recent SIGNED LEASE/LEASE_MOD row
   * from the Documents → Lease panel, or `null` when no signed contract exists
   * yet (lead pre-sign, env without GowSign doc generated, etc).
   *
   * Cross-state DOM contract verified via MCP (2026-05-24):
   *
   * | Estado                       | Header text | Row count | Has SIGNED row |
   * |------------------------------|-------------|-----------|----------------|
   * | UOWN WK13 SIGNED (NPD null)  | "Lease"     |    1      | yes            |
   * | UOWN happy SIGNED (NPD pop)  | "Lease"     |    1      | yes            |
   * | UOWN SM13 SIGNED             | "Lease"     |    1      | yes            |
   * | KS3015 SIGNED                | "Lease"     |    1      | yes            |
   * | FUNDING / FUNDED             | "Lease"     |   1-2     | yes (LEASE)    |
   * | Lead pre-sign / no doc gen   | "Lease"     |    0      | no -> null     |
   *
   * Header text is invariant ("Lease") across UOWN and Kornerstone brands and
   * across all states. Row count varies (0 when no doc generated yet, 1 for
   * single-contract leads, 2+ when LEASE_MOD coexists with original LEASE).
   * `[ENV-GAP]` cases (lead without doc generated) return `null` rather than
   * throwing, so the calling test can skip or assert intentionally.
   */
  async getSignedLeaseContract(): Promise<LeasePanelContract | null> {
    const contracts = await this.getLeasePanelContracts();
    if (contracts.length === 0) {
      console.log('[LeasePanel] No contract rows — lead has no doc generated yet');
      return null;
    }
    const signed = contracts.find(c => c.status.toUpperCase() === 'SIGNED');
    if (!signed) {
      console.log(`[LeasePanel] No SIGNED row among ${contracts.length} contract(s)`);
      return null;
    }
    return signed;
  }

  // ── Sales Rep / Merchant Info Panel ──────────────────────────────

  /**
   * Returns the Sales Rep panel container scoped by the SalesRep id prefix.
   * The CollapsableEditLayout renders with id-based elements (#SalesRep-edit, etc.).
   * We scope to the nearest ancestor that contains the edit button.
   */
  private getSalesRepPanel() {
    return this.page
      .locator('section, div')
      .filter({ has: this.page.locator(SELECTORS.salesRepEditButton) })
      .first();
  }

  /**
   * The Sales Rep panel contains exactly two comboboxes in a fixed order:
   * Merchant (index 0) and Location (index 1). We anchor on this rather than on
   * a label tag because stg renders the field titles as plain `<div>` elements
   * (no `<label>` tag), while qa2 uses `<label>`. Positional indexing is stable
   * because the panel layout (Merchant above Location) is part of the contract.
   */
  private getSalesRepMerchantControl() {
    return this.getSalesRepPanel().locator(SELECTORS.filterControlResilient).nth(0);
  }

  private getSalesRepLocationControl() {
    return this.getSalesRepPanel().locator(SELECTORS.filterControlResilient).nth(1);
  }

  /**
   * Field "container" used to clear/read values. We walk up from the control
   * to the field group ancestor — works in both layouts (label sibling div in
   * qa2, parent div containing combobox in stg).
   */
  private getSalesRepMerchantContainer() {
    return this.getSalesRepMerchantControl().locator('xpath=ancestor::*[1]');
  }

  private getSalesRepLocationContainer() {
    return this.getSalesRepLocationControl().locator('xpath=ancestor::*[1]');
  }

  /**
   * Opens the Sales Rep panel edit mode by clicking the edit button.
   * Only works when lead status is UW_APPROVED or CONTRACT_CREATED.
   */
  async openSalesRepEdit(): Promise<void> {
    const editButton = this.page.locator(SELECTORS.salesRepEditButton);
    await editButton.waitFor({ state: 'visible', timeout: 10_000 });
    await editButton.click();

    // Wait for the edit form to become active — the filter control becomes visible
    await this.getSalesRepMerchantControl()
      .or(this.getSalesRepPanel().locator(SELECTORS.filterPlaceholder).first())
      .waitFor({ state: 'visible', timeout: 5_000 });
    console.log('[SalesRep] Edit mode opened');
  }

  /**
   * Sets the merchant in the Sales Rep panel (edit mode must be open).
   * Clears current selection first if needed, then types and selects the merchant.
   */
  async setSalesRepMerchant(merchantName: string): Promise<void> {
    const container = this.getSalesRepMerchantContainer();

    // Clear existing selection if present
    const clearIndicator = container.locator(SELECTORS.filterClearIndicator).first();
    if (await clearIndicator.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await clearIndicator.click();
    }

    // Click the control to open the dropdown
    const control = this.getSalesRepMerchantControl();
    await control.click();

    // Type the merchant name to search.
    // qa2: control is `.filter__control` wrapper → input is a descendant.
    // stg: control is the combobox element itself (often `<input role="combobox">`) → no descendant input.
    const input = control.locator('input').first().or(control);
    await input.fill(merchantName);

    // Wait for and select the matching option
    const option = this.page.locator(SELECTORS.filterOption)
      .filter({ hasText: merchantName }).first();
    await option.waitFor({ state: 'visible', timeout: 5_000 });
    await option.click({ force: true });

    // Wait for the menu portal to close
    await this.page.locator(SELECTORS.filterMenuPortal)
      .waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});

    console.log(`[SalesRep] Merchant set to "${merchantName}"`);
  }

  /**
   * Sets the location in the Sales Rep panel (edit mode must be open, merchant must be set first).
   */
  async setSalesRepLocation(locationName: string): Promise<void> {
    const container = this.getSalesRepLocationContainer();

    // Clear existing selection if present
    const clearIndicator = container.locator(SELECTORS.filterClearIndicator).first();
    if (await clearIndicator.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await clearIndicator.click();
    }

    // Click the control to open the dropdown
    const control = this.getSalesRepLocationControl();
    await control.click();

    // Type the location name to search. See merchant variant for env-specific notes.
    const input = control.locator('input').first().or(control);
    await input.fill(locationName);

    // Wait for and select the matching option
    const option = this.page.locator(SELECTORS.filterOption)
      .filter({ hasText: locationName }).first();
    await option.waitFor({ state: 'visible', timeout: 5_000 });
    await option.click({ force: true });

    // Wait for the menu portal to close
    await this.page.locator(SELECTORS.filterMenuPortal)
      .waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});

    console.log(`[SalesRep] Location set to "${locationName}"`);
  }

  /**
   * Saves the Sales Rep panel changes by clicking the primary save button.
   * Waits for the success toast notification.
   * Returns the toast message text.
   */
  async saveSalesRepPanel(): Promise<string> {
    const saveButton = this.getSalesRepPanel().locator(SELECTORS.salesRepSaveButton).first();
    await saveButton.waitFor({ state: 'visible', timeout: 5_000 });
    await saveButton.click();

    // Wait for the save button to disappear (panel collapses back to view mode)
    await saveButton.waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {
      console.warn('[SalesRep] Save button still visible after 15s');
    });

    await this.waitForSpinner();

    // Capture toast message
    const toastText = await this.captureAndDismissToast(10_000);
    console.log(`[SalesRep] Toast: "${toastText}"`);
    await this.waitForSpinner();

    return toastText;
  }

  /**
   * Returns the currently displayed merchant value in the Sales Rep panel (read mode).
   * In view mode, reads from the filter__single-value element.
   * Falls back to label-adjacent text if single-value is not present.
   */
  async getSalesRepMerchantValue(): Promise<string> {
    const container = this.getSalesRepMerchantContainer();

    // In edit mode: read from filter__single-value
    const singleValue = container.locator(SELECTORS.filterSingleValue).first();
    if (await singleValue.isVisible({ timeout: 3_000 }).catch(() => false)) {
      return this.getTextContent(singleValue);
    }

    // In view mode: the label "Merchant" is followed by the value text
    const viewValue = this.getSalesRepPanel()
      .locator("xpath=//*[normalize-space(text())='Merchant']/following-sibling::*[1]")
      .first();
    if (await viewValue.isVisible({ timeout: 3_000 }).catch(() => false)) {
      return this.getTextContent(viewValue);
    }

    return '';
  }

  /**
   * Returns the currently displayed location value in the Sales Rep panel (read mode).
   * In view mode, reads from the filter__single-value element.
   * Falls back to label-adjacent text if single-value is not present.
   */
  async getSalesRepLocationValue(): Promise<string> {
    const container = this.getSalesRepLocationContainer();

    // In edit mode: read from filter__single-value
    const singleValue = container.locator(SELECTORS.filterSingleValue).first();
    if (await singleValue.isVisible({ timeout: 3_000 }).catch(() => false)) {
      return this.getTextContent(singleValue);
    }

    // In view mode: the label "Location" is followed by the value text
    const viewValue = this.getSalesRepPanel()
      .locator("xpath=//*[normalize-space(text())='Location']/following-sibling::*[1]")
      .first();
    if (await viewValue.isVisible({ timeout: 3_000 }).catch(() => false)) {
      return this.getTextContent(viewValue);
    }

    return '';
  }

  async validateCustomerInfo(expected: {
    firstName?: string;
    lastName?: string;
    dob?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
  }): Promise<void> {
    const info = await this.getCustomerInfo();
    if (expected.firstName) {
      expect(info['First Name'] || '').toContain(expected.firstName);
    }
    if (expected.lastName) {
      expect(info['Last Name'] || '').toContain(expected.lastName);
    }
    if (expected.email) {
      expect((info['Email'] || '').toLowerCase()).toContain(expected.email.toLowerCase());
    }
    if (expected.state) {
      expect(info['State'] || '').toContain(expected.state);
    }
  }
}

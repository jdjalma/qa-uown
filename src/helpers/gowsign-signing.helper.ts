/**
 * GowSign signing helper — automates signing programmatically on qa2.
 *
 * Mapping via real exploration (TireAgent qa2):
 *   - Pre-Start: #startSignatureButton
 *   - Post-Start header: "Sign" button (exact text), #saveUnifiedButton in the wizard
 *   - 2-step wizard (Signature → Initials):
 *     - Step navigator: "Signature" / "Initials" pills (the second is disabled until the first is complete)
 *     - Mode: "Type" (default) / "Draw" buttons
 *     - Type mode: pre-filled input[name="signature"|"initials"] + 3 font buttons
 *     - Draw mode: <canvas width=528 height=211>
 *     - Action: #saveSignatureButton / #saveInitialsButton / #saveUnifiedButton
 *
 * Strategy: use Type mode (more robust than canvas draw) — the input already comes
 * pre-filled by the backend; just click the 1st font and Save.
 *
 * Typical usage:
 * ```typescript
 * const modal = new AlternativeContractModalPage(page);
 * await modal.waitForOpen();
 * const frame = modal.getGowSignFrame();
 * const result = await signGowSignInFrame(page, frame, { preauthChoice: 'yes' });
 * expect(result.signClicked).toBe(true);
 * ```
 */
import type { Page, FrameLocator } from '@playwright/test';

export interface SignGowSignOptions {
  /** PreAuthorization Consent (input[name="preauth_choice-{yes|no}"]). Default: 'yes' */
  preauthChoice?: 'yes' | 'no';
  /** Total timeout in ms. Default: 90_000 */
  timeoutMs?: number;
  /** Wait for the 'completed' postMessage after clicking Sign. Default: true */
  waitForCompleted?: boolean;
  /** Index of the font to use in Type mode (0=Pinyon Script, 1=Oooh Baby, 2=Lavishly Yours). Default: 0 */
  fontIndex?: number;
  /**
   * Skips the auto-check of preauth and other required checkboxes. Use to test
   * that the document does NOT complete without all required fields filled in
   * (US-FLD-06.1). Default: false
   */
  skipPreauth?: boolean;
}

export interface SignGowSignResult {
  startClicked: boolean;
  preauthMarked: 'yes' | 'no' | null;
  fieldsSigned: number;        // # of signed fields (signature + initials saves combined)
  signClicked: boolean;
  capturedCompleted: boolean;
}

const DEFAULTS = {
  preauthChoice: 'yes' as const,
  timeoutMs: 90_000,
  waitForCompleted: true,
  fontIndex: 0,
  skipPreauth: false,
};

/**
 * Orchestrates the complete signing flow on the GowSign widget.
 *
 * Pre-condition: iframe loaded, `#startSignatureButton` visible.
 */
export async function signGowSignInFrame(
  page: Page,
  frame: FrameLocator,
  options: SignGowSignOptions = {},
): Promise<SignGowSignResult> {
  const opts = { ...DEFAULTS, ...options };
  const result: SignGowSignResult = {
    startClicked: false,
    preauthMarked: null,
    fieldsSigned: 0,
    signClicked: false,
    capturedCompleted: false,
  };

  // 1. Click Start — waits up to 30s for the iframe to render the button
  const startBtn = frame.locator('#startSignatureButton');
  try {
    await startBtn.waitFor({ state: 'visible', timeout: 30_000 });
    await startBtn.scrollIntoViewIfNeeded({ timeout: 5_000 });
    await startBtn.click({ timeout: 5_000 });
    result.startClicked = true;
    await page.waitForTimeout(2_000);
  } catch {
    // May already be in the post-Start state
  }

  // 2. PreAuthorization choice (optional input — the real checkbox is in the doc)
  if (!opts.skipPreauth) {
    const preauthInput = frame.locator(`input[name="preauth_choice-${opts.preauthChoice}"]`);
    if (await preauthInput.isVisible().catch(() => false)) {
      await preauthInput.check({ force: true }).catch(() => {});
      result.preauthMarked = opts.preauthChoice;
    }
  }

  // 3. State machine — loop until done:
  //   wizard open         → complete step (Type mode + font + Next/Save)
  //   #signAllButton      → click (fills all remaining signature/initials)
  //   "Next Step" button  → click (navigates to next required field)
  //   required checkbox   → check (preauth Yes/No in the doc)
  //   nothing actionable  → break
  const deadline = Date.now() + opts.timeoutMs;
  let lastAction = '';
  let stagnant = 0;
  for (let iter = 0; iter < 80 && Date.now() < deadline; iter++) {
    const action = await runSigningStateMachine(page, frame, opts.fontIndex, opts.preauthChoice, opts.skipPreauth);
    if (action === 'wizard') result.fieldsSigned++;
    if (action === 'signAll' || action === 'submit') result.signClicked = true;
    if (action === 'none') break;
    if (action === lastAction) {
      stagnant++;
      if (stagnant >= 3) break; // same action 3x in a row = stuck
    } else {
      stagnant = 0;
      lastAction = action;
    }
    await page.waitForTimeout(700);
  }

  // 3b. Safety net — the confirmation dialog "All fields are complete. Click
  // Finish to finalize your document." (after "Sign All") may appear right after the
  // loop ends. Its Finish is the real finalizer (the toolbar sits under the overlay).
  // isVisible() is instant when there is no dialog (e.g. CA) — cost ~0.
  const confirmFinish = frame
    .getByRole('dialog')
    .getByRole('button', { name: /^Finish$/i })
    .first();
  if (await confirmFinish.isVisible().catch(() => false)) {
    await confirmFinish.click({ timeout: 5_000 }).catch(() => {});
    result.signClicked = true;
    await page.waitForTimeout(1_000);
  }

  // 4. Wait for the 'completed' postMessage (definitive signal of a signed doc)
  if (opts.waitForCompleted && result.signClicked) {
    const captured = await waitForPostMessage(page, 'completed', { timeoutMs: 30_000 });
    result.capturedCompleted = captured !== null;
  }

  return result;
}

type SigningAction = 'wizard' | 'signAll' | 'nextStep' | 'checkbox' | 'submit' | 'none';

/**
 * Executes ONE action of the signing state machine. Returns the type of action taken.
 * Priority: wizard > signAll > checkbox > nextStep > submit > none.
 */
async function runSigningStateMachine(
  page: Page,
  frame: FrameLocator,
  fontIndex: number,
  preauthChoice: 'yes' | 'no',
  skipPreauth: boolean,
): Promise<SigningAction> {
  // 1. Wizard open? Complete step (max priority — modal blocking)
  if (await isWizardOpen(frame)) {
    const ok = await completeCurrentStep(page, frame, fontIndex);
    return ok ? 'wizard' : 'none';
  }

  // 2. #signAllButton visible+enabled? Click — auto-preenche todas signature/initials.
  // SKIPPED when skipPreauth=true: this button auto-fills ALL required fields
  // (including preauth checkboxes) which would defeat the purpose of testing
  // that the document fails to sign when preauth is unmarked (FLD-06.1).
  if (!skipPreauth) {
    const signAllBtn = frame.locator('#signAllButton');
    if (await signAllBtn.isVisible().catch(() => false)) {
      if (await signAllBtn.isEnabled().catch(() => false)) {
        try {
          await signAllBtn.click({ timeout: 5_000 });
          return 'signAll';
        } catch { /* fallthrough */ }
      }
    }
  }

  // 3. Required checkbox unchecked? (preauth Yes/No, etc.)
  // Skipped when skipPreauth=true — used to test that the document does NOT
  // sign without all required fields (FLD-06.1).
  if (!skipPreauth) {
    const choiceInput = frame.locator(`input[name="preauth_choice-${preauthChoice}"]`);
    if (await choiceInput.isVisible().catch(() => false)) {
      const checked = await choiceInput.isChecked().catch(() => true);
      if (!checked) {
        await choiceInput.check({ force: true }).catch(() => {});
        return 'checkbox';
      }
    }
    // Generic: any required checkbox that is unchecked
    const requiredUnchecked = frame.locator('input[type="checkbox"][required]:not(:checked)').first();
    if (await requiredUnchecked.isVisible().catch(() => false)) {
      await requiredUnchecked.check({ force: true }).catch(() => {});
      return 'checkbox';
    }
  }

  // 4. "Next Step" — navigates to the next required field
  const nextStepBtn = frame.getByRole('button', { name: /^Next Step$/i }).first();
  if (await nextStepBtn.isVisible().catch(() => false)) {
    if (await nextStepBtn.isEnabled().catch(() => false)) {
      try {
        await nextStepBtn.click({ timeout: 5_000 });
        return 'nextStep';
      } catch { /* fallthrough */ }
    }
  }

  // 5. Final submit (Finish / Submit / Done / Sign) — completes the document.
  // PRIORITY: the confirmation dialog "All fields are complete. Click Finish
  // to finalize your document." (appears after "Sign All" in multi-field contracts).
  // The Finish INSIDE the dialog is the real finalizer; the toolbar's #finishSignatureButton
  // is INTERCEPTED by the dialog's overlay (bg-black/25) and the click fails.
  // Contracts with many fields (e.g. NY 16 pages) show this dialog after "Sign All".
  // #finishSignatureButton remains as a fallback for contracts without a dialog (e.g. CA).
  const submitCandidates = [
    () => frame.getByRole('dialog').getByRole('button', { name: /^Finish$/i }),
    () => frame.locator('#finishSignatureButton'),
    () => frame.getByRole('button', { name: /^Finish$/i }),
    () => frame.getByRole('button', { name: /^Submit$/i }),
    () => frame.getByRole('button', { name: /^Done$/i }),
    () => frame.getByRole('button', { name: /^Sign$/i }),
  ];
  for (const get of submitCandidates) {
    const btn = get().first();
    if (!(await btn.isVisible().catch(() => false))) continue;
    if (!(await btn.isEnabled().catch(() => false))) continue;
    try {
      await btn.click({ timeout: 5_000 });
      return 'submit';
    } catch { /* try next */ }
  }

  return 'none';
}

/**
 * Detects whether the modal wizard is open.
 * Signals: "Signature"/"Initials" pills OR "Cancel" button OR input name=signature/initials.
 */
async function isWizardOpen(frame: FrameLocator): Promise<boolean> {
  // Cancel button only exists inside the modal wizard
  const cancelBtn = frame.getByRole('button', { name: /^Cancel$/i });
  if (await cancelBtn.first().isVisible().catch(() => false)) return true;

  // Signature input — only exists inside the Type mode modal
  const sigInput = frame.locator('input[name="signature"], input[name="initials"]');
  if (await sigInput.first().isVisible().catch(() => false)) return true;

  return false;
}

/**
 * Completes the active wizard step (Signature → Next, Initials → Save).
 * - Ensures Type mode is active
 * - Clicks the indicated font
 * - Clicks the advance button: "Next" (intermediate steps) or "Save"/"Submit" (final)
 *
 * Returns true if it managed to advance.
 */
async function completeCurrentStep(
  page: Page,
  frame: FrameLocator,
  fontIndex: number,
): Promise<boolean> {
  // 1. Ensure Type mode (if Draw is active, click Type)
  const typeBtn = frame.getByRole('button', { name: /^Type$/i }).first();
  if (await typeBtn.isVisible().catch(() => false)) {
    const isTypeActive = await typeBtn.evaluate((el) =>
      (el as HTMLElement).className.includes('bg-gray-200'),
    ).catch(() => false);
    if (!isTypeActive) {
      await typeBtn.click().catch(() => {});
      await page.waitForTimeout(300);
    }
  }

  // 2. Click the font button (buttons with inline font-family)
  const fontButtons = frame.locator('button[style*="font-family"]');
  const fontCount = await fontButtons.count().catch(() => 0);
  if (fontCount > 0) {
    const idx = Math.min(fontIndex, fontCount - 1);
    await fontButtons.nth(idx).click().catch(() => {});
    await page.waitForTimeout(300);
  }

  // 3. Click the advance button — varies by step:
  //    - Intermediate step: "Next"
  //    - Final step: "Save" (#saveUnifiedButton/#saveSignatureButton/#saveInitialsButton)
  //    - Fallback: "Submit" / "Done"
  const advanceCandidates = [
    () => frame.locator('#saveUnifiedButton'),
    () => frame.locator('#saveSignatureButton'),
    () => frame.locator('#saveInitialsButton'),
    () => frame.getByRole('button', { name: /^Next$/i }),
    () => frame.getByRole('button', { name: /^Save$/i }),
    () => frame.getByRole('button', { name: /^Submit$/i }),
    () => frame.getByRole('button', { name: /^Done$/i }),
  ];

  for (const getBtn of advanceCandidates) {
    const btn = getBtn().first();
    if (!(await btn.isVisible().catch(() => false))) continue;
    if (!(await btn.isEnabled().catch(() => false))) continue;
    try {
      await btn.click({ timeout: 5_000 });
      return true;
    } catch {
      // try next
    }
  }

  return false;
}

/** Installs a postMessage recorder on the page (use before page.goto). */
export async function installPostMessageRecorder(page: Page): Promise<void> {
  await page.addInitScript(() => {
    interface Recorded { origin: string; data: unknown; ts: number; }
    (window as unknown as { __gsMessages: Recorded[] }).__gsMessages = [];
    window.addEventListener('message', (e: MessageEvent) => {
      (window as unknown as { __gsMessages: Recorded[] }).__gsMessages.push({
        origin: e.origin, data: e.data, ts: Date.now(),
      });
    });
  });
}

/** Reads the captured postMessages. */
export async function readPostMessages(
  page: Page,
): Promise<Array<{ origin: string; data: unknown; ts: number }>> {
  return page.evaluate(() => {
    return (window as unknown as { __gsMessages?: Array<{ origin: string; data: unknown; ts: number }> }).__gsMessages || [];
  });
}

/** Waits for a specific postMessage to be captured. */
export async function waitForPostMessage(
  page: Page,
  type: string,
  options: { timeoutMs?: number } = {},
): Promise<{ origin: string; data: { type: string; documentId?: string }; ts: number } | null> {
  const timeout = options.timeoutMs ?? 30_000;
  const handle = await page.waitForFunction(
    (msgType) => {
      const messages = (window as unknown as { __gsMessages?: Array<{ origin: string; data: { type?: string }; ts: number }> }).__gsMessages || [];
      return messages.find((m) => m.data?.type === msgType) || null;
    },
    type,
    { timeout },
  ).catch(() => null);

  if (!handle) return null;
  return handle.jsonValue() as Promise<{ origin: string; data: { type: string; documentId?: string }; ts: number }>;
}

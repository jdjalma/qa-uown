/**
 * GowSign signing helper — automatiza assinatura programaticamente em qa2.
 *
 * Mapeamento via exploracao real (TireAgent qa2):
 *   - Pre-Start: #startSignatureButton
 *   - Header pos-Start: botao "Sign" (text exato), #saveUnifiedButton no wizard
 *   - Wizard de 2 steps (Signature → Initials):
 *     - Step navigator: pills "Signature" / "Initials" (segundo desabilita ate primeiro completo)
 *     - Modo: botoes "Type" (default) / "Draw"
 *     - Type mode: input[name="signature"|"initials"] pre-preenchido + 3 botoes de fonte
 *     - Draw mode: <canvas width=528 height=211>
 *     - Acao: #saveSignatureButton / #saveInitialsButton / #saveUnifiedButton
 *
 * Estrategia: usar Type mode (mais robusto que canvas draw) — o input ja vem
 * pre-preenchido pelo backend; basta clicar a 1a fonte e Save.
 *
 * Uso tipico:
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
  /** Timeout total em ms. Default: 90_000 */
  timeoutMs?: number;
  /** Aguardar postMessage 'completed' apos clicar Sign. Default: true */
  waitForCompleted?: boolean;
  /** Indice da fonte a usar no Type mode (0=Pinyon Script, 1=Oooh Baby, 2=Lavishly Yours). Default: 0 */
  fontIndex?: number;
  /**
   * Pula auto-check do preauth e de outros checkboxes required. Use para testar
   * que o documento NAO completa sem todos os required preenchidos
   * (US-FLD-06.1). Default: false
   */
  skipPreauth?: boolean;
}

export interface SignGowSignResult {
  startClicked: boolean;
  preauthMarked: 'yes' | 'no' | null;
  fieldsSigned: number;        // # campos assinados (signature + initials saves combinados)
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
 * Orquestra fluxo completo de assinatura no widget GowSign.
 *
 * Pre-condicao: iframe carregado, `#startSignatureButton` visivel.
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

  // 1. Click Start — aguarda ate 30s o iframe renderizar o botao
  const startBtn = frame.locator('#startSignatureButton');
  try {
    await startBtn.waitFor({ state: 'visible', timeout: 30_000 });
    await startBtn.scrollIntoViewIfNeeded({ timeout: 5_000 });
    await startBtn.click({ timeout: 5_000 });
    result.startClicked = true;
    await page.waitForTimeout(2_000);
  } catch {
    // Pode ja estar no estado pos-Start
  }

  // 2. PreAuthorization choice (input opcional — checkbox real fica no doc)
  if (!opts.skipPreauth) {
    const preauthInput = frame.locator(`input[name="preauth_choice-${opts.preauthChoice}"]`);
    if (await preauthInput.isVisible().catch(() => false)) {
      await preauthInput.check({ force: true }).catch(() => {});
      result.preauthMarked = opts.preauthChoice;
    }
  }

  // 3. State machine — loop ate terminar:
  //   wizard aberto      → completa step (Type mode + font + Next/Save)
  //   #signAllButton     → click (preenche todas signature/initials restantes)
  //   "Next Step" button → click (navega ate proximo campo required)
  //   checkbox required  → marca (preauth Yes/No no doc)
  //   sem nada actionable → break
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
      if (stagnant >= 3) break; // mesmo action 3x seguidas = travado
    } else {
      stagnant = 0;
      lastAction = action;
    }
    await page.waitForTimeout(700);
  }

  // 4. Aguarda postMessage 'completed' (sinal definitivo de doc assinado)
  if (opts.waitForCompleted && result.signClicked) {
    const captured = await waitForPostMessage(page, 'completed', { timeoutMs: 30_000 });
    result.capturedCompleted = captured !== null;
  }

  return result;
}

type SigningAction = 'wizard' | 'signAll' | 'nextStep' | 'checkbox' | 'submit' | 'none';

/**
 * Executa UMA acao do state machine de signing. Retorna o tipo de acao tomada.
 * Prioridade: wizard > signAll > checkbox > nextStep > submit > none.
 */
async function runSigningStateMachine(
  page: Page,
  frame: FrameLocator,
  fontIndex: number,
  preauthChoice: 'yes' | 'no',
  skipPreauth: boolean,
): Promise<SigningAction> {
  // 1. Wizard aberto? Completa step (max prioridade — modal blocking)
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

  // 3. Checkbox required nao marcado? (preauth Yes/No, etc.)
  // Pulado quando skipPreauth=true — usado para testar que documento NAO
  // assina sem todos os required (FLD-06.1).
  if (!skipPreauth) {
    const choiceInput = frame.locator(`input[name="preauth_choice-${preauthChoice}"]`);
    if (await choiceInput.isVisible().catch(() => false)) {
      const checked = await choiceInput.isChecked().catch(() => true);
      if (!checked) {
        await choiceInput.check({ force: true }).catch(() => {});
        return 'checkbox';
      }
    }
    // Generico: qualquer checkbox required nao marcado
    const requiredUnchecked = frame.locator('input[type="checkbox"][required]:not(:checked)').first();
    if (await requiredUnchecked.isVisible().catch(() => false)) {
      await requiredUnchecked.check({ force: true }).catch(() => {});
      return 'checkbox';
    }
  }

  // 4. "Next Step" — navega pro proximo campo required
  const nextStepBtn = frame.getByRole('button', { name: /^Next Step$/i }).first();
  if (await nextStepBtn.isVisible().catch(() => false)) {
    if (await nextStepBtn.isEnabled().catch(() => false)) {
      try {
        await nextStepBtn.click({ timeout: 5_000 });
        return 'nextStep';
      } catch { /* fallthrough */ }
    }
  }

  // 5. Final submit (Finish / Submit / Done / Sign) — completa documento
  // #finishSignatureButton e o ID canonico apos preencher todos os required.
  const submitCandidates = [
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
    } catch { /* tenta proximo */ }
  }

  return 'none';
}

/**
 * Detecta se o wizard modal esta aberto.
 * Sinais: pills "Signature"/"Initials" OU botao "Cancel" OU input name=signature/initials.
 */
async function isWizardOpen(frame: FrameLocator): Promise<boolean> {
  // Cancel button so existe dentro do modal wizard
  const cancelBtn = frame.getByRole('button', { name: /^Cancel$/i });
  if (await cancelBtn.first().isVisible().catch(() => false)) return true;

  // Input de assinatura — so existe dentro do modal Type mode
  const sigInput = frame.locator('input[name="signature"], input[name="initials"]');
  if (await sigInput.first().isVisible().catch(() => false)) return true;

  return false;
}

/**
 * Executa um ciclo do wizard: completa o step ativo clicando font + advance button.
 * Retorna true se algo foi feito; false quando wizard fechou ou nao esta presente.
 */
async function signNextWizardCycle(
  page: Page,
  frame: FrameLocator,
  fontIndex: number,
): Promise<boolean> {
  // Tenta abrir wizard se nao estiver aberto
  if (!(await isWizardOpen(frame))) {
    // Pode ser que precise clicar no header "Sign" pra reabrir wizard
    const signBtn = frame.getByRole('button', { name: /^Sign( All)?$/i });
    const visible = await signBtn.first().isVisible().catch(() => false);
    if (!visible) return false;
    try {
      await signBtn.first().click({ timeout: 5_000 });
      await page.waitForTimeout(1_500);
    } catch {
      return false;
    }
    if (!(await isWizardOpen(frame))) return false;
  }

  return await completeCurrentStep(page, frame, fontIndex);
}

/**
 * Completa o step ativo do wizard (Signature → Next, Initials → Save).
 * - Garante Type mode ativo
 * - Clica na fonte indicada
 * - Click no botao de avanco: "Next" (steps intermediarios) ou "Save"/"Submit" (final)
 *
 * Retorna true se conseguiu avancar.
 */
async function completeCurrentStep(
  page: Page,
  frame: FrameLocator,
  fontIndex: number,
): Promise<boolean> {
  // 1. Garante Type mode (se Draw estiver ativo, clica Type)
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

  // 2. Click no botao de fonte (botoes com font-family inline)
  const fontButtons = frame.locator('button[style*="font-family"]');
  const fontCount = await fontButtons.count().catch(() => 0);
  if (fontCount > 0) {
    const idx = Math.min(fontIndex, fontCount - 1);
    await fontButtons.nth(idx).click().catch(() => {});
    await page.waitForTimeout(300);
  }

  // 3. Click no botao de avanco — varia por step:
  //    - Step intermediario: "Next"
  //    - Step final: "Save" (#saveUnifiedButton/#saveSignatureButton/#saveInitialsButton)
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
      // tenta proximo
    }
  }

  return false;
}

/** Instala recorder de postMessages na page (usar antes de page.goto). */
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

/** Le os postMessages capturados. */
export async function readPostMessages(
  page: Page,
): Promise<Array<{ origin: string; data: unknown; ts: number }>> {
  return page.evaluate(() => {
    return (window as unknown as { __gsMessages?: Array<{ origin: string; data: unknown; ts: number }> }).__gsMessages || [];
  });
}

/** Aguarda um postMessage especifico ser capturado. */
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

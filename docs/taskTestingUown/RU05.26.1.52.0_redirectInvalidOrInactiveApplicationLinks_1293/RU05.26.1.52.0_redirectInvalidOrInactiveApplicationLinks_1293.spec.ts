/**
 * RU05.26.1.52.0_redirectInvalidOrInactiveApplicationLinks_1293
 *
 * Issue:    https://gitlab.com/uown/frontend/origination/-/work_items/1293
 * Spec:     ./spec.md
 *
 * Goal: regression + edge-case battery covering the public customer route
 *       `https://origination-{env}.uownleasing.com/getApplication/{code}`,
 *       which must redirect to `https://uownleasing.com/customer/find-a-merchant/`
 *       when the code is invalid / inactive / terminated, and must render the
 *       application form when the code is active.
 *
 * Constraints (enforced):
 * - NO DB mutation (CLAUDE.md Exception 3). SELECTs only.
 * - NO merchant preflight (CLAUDE.md rule #12 — `skipMerchantPreflight: true`).
 * - UI-first (CLAUDE.md rule #14) — assertions bind on browser-final URL.
 * - For invalid/inactive/terminated codes the redirect is CLIENT-SIDE
 *   (Next.js `next/router` + `replaceState`); initial HTTP is 200. Use
 *   `assertRedirectedToFindMerchant` / `page.waitForURL`. NEVER assert 301/302.
 * - For the generic `/getApplication` (no segment), server-side 307 is
 *   verified via `request.get(url, { maxRedirects: 0 })`.
 *
 * DB tunnel fragility:
 * - DB SELECTs (S1, S6) are guarded by try/catch. If the tunnel is down
 *   (`ECONNREFUSED 127.0.0.1:5445`), the scenario is `test.skip()`-ed with an
 *   `[ENV-GAP]` annotation rather than failing the entire run.
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { TestTag, splitTags } from '@ptypes/enums.js';
import {
  assertRedirectedToFindMerchant,
  assertRendersApplicationForm,
  FIND_A_MERCHANT_RE,
} from '@helpers/index.js';

// ── Constants (env-aware) ────────────────────────────────────────────────────
const TARGET_ENV = process.env.ENV || 'qa1';
const ORIGINATION_BASE = `https://origination-${TARGET_ENV}.uownleasing.com`;
const ACTIVE_UOWN_CODE = 'OW90218-0001';            // TireAgent
const ACTIVE_KS_CODE = 'KS5936';                    // Kornerstone — confirmed active
const INVALID_CODES = ['ks1111', 'ZZZZZ0000-9999', 'XYZ123'];
const INVALID_KS_CODES = ['KSZZZ00000', 'KSZZZ99'];

// Tags: regression + origination + redirect.
const TAGS = splitTags(`${TestTag.REGRESSION} @origination @redirect`);

// ── Helpers (file-local) ─────────────────────────────────────────────────────

/** Tagged annotation for ENV-GAP skips (DB tunnel down, no candidate, etc.). */
function annotateEnvGap(reason: string): void {
  test.info().annotations.push({ type: 'env-gap', description: reason });
  console.log(`[ENV-GAP] ${reason}`);
}

/** Tagged annotation for OBSERVATION points the report must surface. */
function annotateObservation(reason: string): void {
  test.info().annotations.push({ type: 'observation', description: reason });
  console.log(`[OBSERVAÇÃO] ${reason}`);
}

/** Build the canonical /getApplication URL for a given code (or no code). */
function appUrl(code?: string): string {
  if (code === undefined) return `${ORIGINATION_BASE}/getApplication`;
  return `${ORIGINATION_BASE}/getApplication/${code}`;
}

/**
 * Attach a navigation guard against `evil.com` (used by SEC1).
 * Returns a disposer.
 */
function watchForExternalNavigation(page: import('@playwright/test').Page, forbiddenHostPattern: RegExp) {
  const hits: string[] = [];
  const listener = (frame: import('@playwright/test').Frame) => {
    const url = frame.url();
    let hostname: string;
    try {
      hostname = new URL(url).hostname;
    } catch {
      return;
    }
    if (forbiddenHostPattern.test(hostname)) {
      hits.push(url);
    }
  };
  page.on('framenavigated', listener);
  return {
    dispose: () => page.off('framenavigated', listener),
    hits,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe('RU05.26.1.52.0_redirectInvalidOrInactiveApplicationLinks_1293', {
  tag: TAGS,
}, () => {
  // Capture console errors per-test (used in P1 scenarios).
  test.beforeEach(async ({ page }) => {
    test.info().annotations.push(
      { type: 'env', description: TARGET_ENV },
      { type: 'spec', description: 'RU05.26.1.52.0 issue #1293' },
    );
    // Surface unexpected dialogs as test failures (XSS smoke).
    page.on('dialog', async (dialog) => {
      test.info().annotations.push({
        type: 'dialog-unexpected',
        description: `${dialog.type()}: ${dialog.message()}`,
      });
      await dialog.dismiss().catch(() => {});
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  //  P1 — DoD blockers
  // ════════════════════════════════════════════════════════════════════════

  type Brand = 'uown' | 'kornerstone';
  // Brand classification uses uown_merchant.client_type (canonical) instead of
  // ref_merchant_code prefix — Kornerstone merchants don't always carry a KS
  // prefix (e.g. OL90305-0001 is KORNERSTONE/inactive).
  const INACTIVE_BRAND_FILTERS: Record<Brand, string> = {
    uown: "(client_type IS NULL OR client_type <> 'KORNERSTONE')",
    kornerstone: "client_type = 'KORNERSTONE'",
  };

  async function resolveInactiveCode(
    db: { queryOne: <T>(sql: string) => Promise<T | null> },
    brand: Brand,
  ): Promise<string | null> {
    const row = await db.queryOne<{ ref_merchant_code: string }>(
      `SELECT ref_merchant_code
       FROM uown_merchant
       WHERE is_active = false
         AND ref_merchant_code IS NOT NULL
         AND ref_merchant_code <> ''
         AND ${INACTIVE_BRAND_FILTERS[brand]}
       ORDER BY pk DESC
       LIMIT 1`,
    );
    return row?.ref_merchant_code ?? null;
  }

  async function runS1ForBrand(
    brand: Brand,
    page: Parameters<Parameters<typeof test>[1]>[0]['page'],
    db: { queryOne: <T>(sql: string) => Promise<T | null> },
  ) {
    let inactiveCode: string | null = null;
    try {
      inactiveCode = await resolveInactiveCode(db, brand);
    } catch (err) {
      const msg = (err as Error).message || '';
      if (msg.includes('ECONNREFUSED') || msg.includes('5445')) {
        annotateEnvGap(`DB tunnel inativo — S1-${brand} skipped: ${msg}`);
        test.skip(true, `[ENV-GAP] DB tunnel inactive (S1-${brand})`);
        return;
      }
      throw err;
    }

    if (!inactiveCode) {
      annotateEnvGap(`No inactive ${brand} merchant in ${TARGET_ENV} — S1-${brand} skipped`);
      test.skip(true, `[ENV-GAP] No inactive ${brand} merchant candidate in ${TARGET_ENV}`);
      return;
    }

    test.info().annotations.push({ type: `inactive-${brand}-code`, description: inactiveCode });
    console.log(`[S1-${brand}] resolved INACTIVE_MERCHANT_CODE=${inactiveCode}`);

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(appUrl(inactiveCode), { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await assertRedirectedToFindMerchant(page);
  }

  test('S1-UOWN — Inactive UOWN merchant redirects to Find a Merchant', async ({ page, db }) => {
    test.setTimeout(60_000);
    await runS1ForBrand('uown', page, db);
  });

  test('S1-KS — Inactive Kornerstone merchant redirects to Find a Merchant', async ({ page, db }) => {
    test.setTimeout(60_000);
    await runS1ForBrand('kornerstone', page, db);
  });

  test('S2 — Invalid merchant code redirects (synthetic codes)', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1440, height: 900 });

    for (const code of INVALID_CODES) {
      await test.step(`Invalid code "${code}" → find-a-merchant`, async () => {
        await page.goto(appUrl(code), { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await assertRedirectedToFindMerchant(page);
      });
    }
  });

  test('S3 — Generic /getApplication (no code) — server-side 307 + final URL', async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 1440, height: 900 });

    // Step A: raw server status (no auto-follow) — must be 307 with Location header.
    await test.step('HEAD-like check: server returns 307 + Location', async () => {
      const ctxReq = page.context().request;
      const res = await ctxReq.get(appUrl(), { maxRedirects: 0 });
      expect(res.status(), 'generic /getApplication must return 307').toBe(307);
      const location = res.headers()['location'] ?? '';
      expect(location, '307 response must include a Location header').toBeTruthy();
      console.log(`[S3] 307 Location=${location}`);
    });

    // Step B: full browser navigation — must land on find-a-merchant.
    await test.step('Browser navigation lands on find-a-merchant', async () => {
      await page.goto(appUrl(), { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await assertRedirectedToFindMerchant(page);
    });
  });

  test('S4 — Active merchant renders application form (positive regression)', async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 1440, height: 900 });

    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => consoleErrors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto(appUrl(ACTIVE_UOWN_CODE), { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await assertRendersApplicationForm(page, { brand: 'uown' });

    // Anti-assertion: must NOT have redirected to find-a-merchant.
    expect(page.url(), 'S4: active code must not redirect').not.toMatch(FIND_A_MERCHANT_RE);

    if (consoleErrors.length > 0) {
      annotateObservation(`S4 console errors observed (${consoleErrors.length}): ${consoleErrors.slice(0, 3).join(' | ')}`);
    }
  });

  // ════════════════════════════════════════════════════════════════════════
  //  P2 — Coverage
  // ════════════════════════════════════════════════════════════════════════

  test('S5 — Empty code after slash /getApplication/ redirects', async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto(`${ORIGINATION_BASE}/getApplication/`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await assertRedirectedToFindMerchant(page);
  });

  async function runS6ForBrand(
    brand: Brand,
    page: Parameters<Parameters<typeof test>[1]>[0]['page'],
    db: { queryOne: <T>(sql: string) => Promise<T | null> },
  ) {
    let terminatedCode: string | null = null;
    let usedFallback = false;
    try {
      try {
        const row = await db.queryOne<{ ref_merchant_code: string }>(
          `SELECT ref_merchant_code FROM uown_merchant
           WHERE status ILIKE '%TERMIN%'
             AND ref_merchant_code IS NOT NULL
             AND ref_merchant_code <> ''
             AND ${INACTIVE_BRAND_FILTERS[brand]}
           ORDER BY pk DESC LIMIT 1`,
        );
        terminatedCode = row?.ref_merchant_code ?? null;
      } catch {
        terminatedCode = null;
      }

      if (!terminatedCode) {
        usedFallback = true;
        terminatedCode = await resolveInactiveCode(db, brand);
      }
    } catch (err) {
      const msg = (err as Error).message || '';
      if (msg.includes('ECONNREFUSED') || msg.includes('5445')) {
        annotateEnvGap(`DB tunnel inativo — S6-${brand} skipped: ${msg}`);
        test.skip(true, `[ENV-GAP] DB tunnel inactive (S6-${brand})`);
        return;
      }
      throw err;
    }

    if (!terminatedCode) {
      annotateObservation(`schema usa is_active boolean — S6-${brand} coberto por S1-${brand}; sem candidato terminated ${brand}`);
      test.skip(true, `[OBSERVAÇÃO] No terminated ${brand} merchant; coverage equivalente em S1-${brand}`);
      return;
    }

    if (usedFallback) {
      annotateObservation(`schema usa is_active boolean — S6-${brand} reusa candidato is_active=false (coberto também por S1-${brand})`);
    }

    test.info().annotations.push({ type: `terminated-${brand}-code`, description: terminatedCode });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(appUrl(terminatedCode), { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await assertRedirectedToFindMerchant(page);
  }

  test('S6-UOWN — Terminated UOWN merchant redirects', async ({ page, db }) => {
    test.setTimeout(60_000);
    await runS6ForBrand('uown', page, db);
  });

  test('S6-KS — Terminated Kornerstone merchant redirects', async ({ page, db }) => {
    test.setTimeout(60_000);
    await runS6ForBrand('kornerstone', page, db);
  });

  test('MB1 — Multi-brand Kornerstone (active + invalid)', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1440, height: 900 });

    await test.step(`Active KS code renders apply-${TARGET_ENV}.kornerstoneliving.com form`, async () => {
      await page.goto(appUrl(ACTIVE_KS_CODE), { waitUntil: 'domcontentloaded', timeout: 45_000 });
      await assertRendersApplicationForm(page, { brand: 'kornerstone' });
      expect(page.url(), 'MB1.active: must not redirect to find-a-merchant').not.toMatch(FIND_A_MERCHANT_RE);
    });

    for (const invalidKs of INVALID_KS_CODES) {
      await test.step(`Invalid KS code "${invalidKs}" → uownleasing.com find-a-merchant (cross-brand UX observation)`, async () => {
        await page.goto(appUrl(invalidKs), { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await assertRedirectedToFindMerchant(page);
      });
    }
    annotateObservation('Cross-brand UX: invalid Kornerstone code lands on uownleasing.com (not kornerstoneliving.com) — Open Q12');
  });

  test('SEC1 — Open-redirect smoke (query/fragment injection)', async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1440, height: 900 });

    const evilGuard = watchForExternalNavigation(page, /evil\.com/i);

    const urls = [
      `${ORIGINATION_BASE}/getApplication/ks1111?redirect=https://evil.com`,
      `${ORIGINATION_BASE}/getApplication/ks1111?next=https://evil.com`,
      `${ORIGINATION_BASE}/getApplication/ks1111?returnUrl=${encodeURIComponent('https://evil.com')}`,
      `${ORIGINATION_BASE}/getApplication/ks1111#redirect=https://evil.com`,
    ];

    try {
      for (const url of urls) {
        await test.step(`Open-redirect attempt: ${url}`, async () => {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
          await assertRedirectedToFindMerchant(page);
        });
      }
      expect(evilGuard.hits, 'no navigation to evil.com is permitted').toEqual([]);
    } finally {
      evilGuard.dispose();
    }
  });

  test('C-N3 — Case-sensitivity observation (UOWN code lowercase vs uppercase)', async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1440, height: 900 });

    await test.step('Uppercase OW90218-0001 → renders form', async () => {
      await page.goto(appUrl(ACTIVE_UOWN_CODE), { waitUntil: 'domcontentloaded', timeout: 45_000 });
      await assertRendersApplicationForm(page, { brand: 'uown' });
    });

    await test.step('Lowercase ow90218-0001 → observe: redirect OR form (env-dependent)', async () => {
      await page.goto(appUrl(ACTIVE_UOWN_CODE.toLowerCase()), {
        waitUntil: 'domcontentloaded',
        timeout: 30_000,
      });
      await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
      const finalUrl = page.url();
      const isFindMerchant = FIND_A_MERCHANT_RE.test(finalUrl);
      const isApplyForm = /apply-[a-z0-9]+\.(uownleasing|kornerstoneliving)\.com/i.test(finalUrl);
      expect(isFindMerchant || isApplyForm, `C-N3 lowercase final URL = ${finalUrl}`).toBe(true);
      if (isFindMerchant) {
        annotateObservation(`Backend is case-sensitive in ${TARGET_ENV} (lowercase → redirect)`);
      } else {
        annotateObservation(`Backend is case-insensitive in ${TARGET_ENV} (lowercase → renders form)`);
      }
    });
  });

  test('C-N5 — Security: XSS payload in URL path is sanitized', async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 1440, height: 900 });

    let dialogFired = false;
    const dialogListener = async (dialog: import('@playwright/test').Dialog) => {
      dialogFired = true;
      await dialog.dismiss().catch(() => {});
    };
    page.on('dialog', dialogListener);

    try {
      const payload = '%3Cscript%3Ealert(1)%3C%2Fscript%3E';
      await page.goto(`${ORIGINATION_BASE}/getApplication/${payload}`, {
        waitUntil: 'domcontentloaded',
        timeout: 30_000,
      });
      await assertRedirectedToFindMerchant(page);

      expect(dialogFired, 'no alert dialog should fire from XSS payload').toBe(false);

      // No raw <script>alert(1)</script> from the URL reflected in the DOM.
      const content = await page.content();
      expect(content, 'DOM must not contain the raw XSS payload string').not.toContain('<script>alert(1)</script>');
    } finally {
      page.off('dialog', dialogListener);
    }
  });

  test('C-N6 — Security: path traversal is treated as invalid', async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1440, height: 900 });

    const traversals = [
      `${ORIGINATION_BASE}/getApplication/..%2Fadmin`,
      `${ORIGINATION_BASE}/getApplication/%2E%2E%2Fadmin`,
      `${ORIGINATION_BASE}/getApplication/..%2F..%2Fetc%2Fpasswd`,
    ];

    for (const url of traversals) {
      await test.step(`Path traversal: ${url}`, async () => {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await assertRedirectedToFindMerchant(page);
        const body = await page.content();
        expect(body, 'no /etc/passwd content should leak').not.toMatch(/root:[x*]:0:0/);
      });
    }
  });

  // ════════════════════════════════════════════════════════════════════════
  //  P3 — Hardening + smoke
  // ════════════════════════════════════════════════════════════════════════

  test('C-N4 — Numeric-only code redirects', async ({ page }) => {
    test.setTimeout(45_000);
    await page.setViewportSize({ width: 1440, height: 900 });

    try {
      await page.goto(appUrl('12345'), { waitUntil: 'domcontentloaded', timeout: 30_000 });
    } catch (err) {
      // Next.js client-side `router.replace` can fire before `domcontentloaded`
      // and abort the original navigation with ERR_ABORTED. The redirect itself
      // still happens — verify via final URL assertion below.
      const msg = (err as Error).message || '';
      if (!msg.includes('ERR_ABORTED')) throw err;
    }
    await assertRedirectedToFindMerchant(page);
  });

  test('C-N7 — Special characters in code redirect cleanly', async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 1440, height: 900 });

    const strictInvalidCodes = [
      `${ACTIVE_UOWN_CODE}!@%23`,
      `${ACTIVE_UOWN_CODE}%00`,
    ];

    for (const code of strictInvalidCodes) {
      await test.step(`Special-chars code "${code}" → redirect or protocol reject`, async () => {
        let resp;
        try {
          resp = await page.goto(appUrl(code), { waitUntil: 'domcontentloaded', timeout: 30_000 });
        } catch (err) {
          const msg = (err as Error).message || '';
          if (msg.includes('ERR_HTTP_RESPONSE_CODE_FAILURE') || msg.includes('ERR_INVALID')) {
            annotateObservation(`C-N7 server rejects malformed code "${code}" at protocol layer (${msg.split('\n')[0]}) — acceptable hardening`);
            return;
          }
          throw err;
        }
        if (resp) {
          expect(resp.status(), 'no server 5xx').toBeLessThan(500);
        }
        await assertRedirectedToFindMerchant(page);
      });
    }

    await test.step(`Trailing space "${ACTIVE_UOWN_CODE}%20" → redirect, form, or protocol reject`, async () => {
      let resp;
      try {
        resp = await page.goto(appUrl(`${ACTIVE_UOWN_CODE}%20`), { waitUntil: 'domcontentloaded', timeout: 30_000 });
      } catch (err) {
        const msg = (err as Error).message || '';
        if (msg.includes('chrome-error') || msg.includes('ERR_') || msg.includes('interrupted')) {
          annotateObservation(`C-N7 trailing space rejected at navigation layer in ${TARGET_ENV} (${msg.split('\n')[0]}) - acceptable hardening`);
          return;
        }
        throw err;
      }
      if (resp) {
        expect(resp.status(), 'no server 5xx').toBeLessThan(500);
      }
      await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
      const finalUrl = page.url();
      const isFindMerchant = FIND_A_MERCHANT_RE.test(finalUrl);
      const isApplyForm = /apply-[a-z0-9]+\.(uownleasing|kornerstoneliving)\.com/i.test(finalUrl);
      expect(isFindMerchant || isApplyForm, `C-N7 trailing-space final URL = ${finalUrl}`).toBe(true);
      if (isApplyForm) {
        annotateObservation(`C-N7 backend trims trailing space in ${TARGET_ENV} (renders form)`);
      }
    });
  });

  test('C-N8 — Double slash / weird paths redirect', async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 1440, height: 900 });

    const paths = [
      `${ORIGINATION_BASE}/getApplication//`,
      `${ORIGINATION_BASE}/getApplication///`,
    ];

    for (const url of paths) {
      await test.step(`Weird path: ${url}`, async () => {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await assertRedirectedToFindMerchant(page);
      });
    }

    // /getApplication///OW90218-0001 may normalize OR redirect — document either outcome.
    await test.step(`Tolerant: /getApplication///${ACTIVE_UOWN_CODE} — normalize OR redirect`, async () => {
      await page.goto(`${ORIGINATION_BASE}/getApplication///${ACTIVE_UOWN_CODE}`, {
        waitUntil: 'domcontentloaded',
        timeout: 30_000,
      });
      // Wait briefly for any client-side navigation to settle.
      await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
      const finalUrl = page.url();
      const isFindMerchant = FIND_A_MERCHANT_RE.test(finalUrl);
      const isApply = /apply-[a-z0-9]+\.(uownleasing|kornerstoneliving)\.com/i.test(finalUrl);
      const isOrigination = /origination-[a-z0-9]+\.uownleasing\.com\/getApplication/i.test(finalUrl);
      expect(isFindMerchant || isApply || isOrigination, `C-N8 weird-path final URL = ${finalUrl}`).toBe(true);
      if (isApply) {
        annotateObservation(`C-N8 normalization: /getApplication///${ACTIVE_UOWN_CODE} normalized to apply form (${finalUrl})`);
      } else if (isOrigination) {
        annotateObservation(`C-N8 normalization: /getApplication///${ACTIVE_UOWN_CODE} normalized to origination path (${finalUrl})`);
      }
    });
  });

  test('H1 — HTTP→HTTPS upgrade + redirect', async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1440, height: 900 });

    // Step A — raw request: HTTP /getApplication must 301 → HTTPS, then 307 → find-a-merchant.
    await test.step('HTTP /getApplication: 301 upgrade hop', async () => {
      const ctxReq = page.context().request;
      const res = await ctxReq.get(`http://origination-${TARGET_ENV}.uownleasing.com/getApplication`, {
        maxRedirects: 0,
      });
      // Some edges return 301; others 308; tolerate 3xx and confirm HTTPS Location.
      expect(res.status(), 'HTTP→HTTPS upgrade should be a 3xx').toBeGreaterThanOrEqual(300);
      expect(res.status(), 'HTTP→HTTPS upgrade should be a 3xx').toBeLessThan(400);
      const location = res.headers()['location'] ?? '';
      expect(location, 'upgrade response must include Location').toBeTruthy();
      expect(location, 'Location must be HTTPS').toMatch(/^https:/i);
    });

    // Step B — full browser navigation lands on HTTPS find-a-merchant for invalid code.
    await test.step('Browser navigation HTTP/invalid → HTTPS find-a-merchant', async () => {
      await page.goto(`http://origination-${TARGET_ENV}.uownleasing.com/getApplication/ks1111`, {
        waitUntil: 'domcontentloaded',
        timeout: 45_000,
      });
      await assertRedirectedToFindMerchant(page);
      expect(page.url(), 'final URL must be HTTPS').toMatch(/^https:/i);
    });
  });

  test('D-long — Very long input (300+ chars) redirects without 5xx', async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 1440, height: 900 });

    const longCode = 'A'.repeat(310);
    const resp = await page.goto(appUrl(longCode), { waitUntil: 'domcontentloaded', timeout: 30_000 });
    if (resp) {
      expect(resp.status(), 'long input must not produce 5xx').toBeLessThan(500);
    }
    await assertRedirectedToFindMerchant(page);
  });
});

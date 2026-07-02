/**
 * RU07.26.1.54.0 — website#153 "Limit the Multiples changes in payment frequency"
 *
 * Customer-portal self-service payment-frequency change at `/payment-frequency`.
 * The production bug (ACCT 545697): repeated Bi-Weekly ↔ Semi-Monthly toggling
 * drifted the schedule years into the future and the account ended on Monthly.
 * Fix landed via MR !286 (semi-monthly first/second day validation + recalc).
 *
 * Strategy (SPEC): Hybrid — API provisioning + Website UI exercise + DB assert.
 * Oracle: `.claude/oracles/website-payment-frequency.md` (CT-01..CT-14).
 *
 * ── Account grouping (provisioning is ~1-2 min/account; SPEC-approved chaining)
 *   Group A (1 account, serial, state chains):
 *     S4/CT-01 (dropdown option-set) → B1/CT-02+CT-11 (First Payment Day) →
 *     B2/CT-03 (Second Payment Day) → S1/CT-04..09 (BW→SM happy path) →
 *     S2/CT-12+CT-13 (SM→BW next-payday) → S5/CT-10 (persistence + parity).
 *   Group B (own account, serial): S3 — ≥3 BW↔SM cycles, anti-drift each save.
 *   Group C (own account, serial): S6 — mixed saves, no drift/dup/Monthly.
 *
 * ⚠️ Selectors in PaymentFrequencyPage are DOM-UNVALIDATED (no network on the
 * implementer box; rule #15 CI-without-network fallback). The validator runs
 * the DOM-first protocol on first live execution and hardens any divergence.
 *
 * Run: npx playwright test tests/e2e/website/RU07.26.1.54.0_paymentFrequency153.spec.ts --project=website-ui
 */
import type { Page } from '@playwright/test';
import { test, expect } from '@fixtures/test-context.fixture.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';
import { PaymentFrequencyPage } from '@pages/website/index.js';
import { provisionActiveAccountWithFrequency, calculateDateISO } from '@helpers/index.js';
import type { ProvisionFrequencyAccountResult, DatabaseHelpers } from '@helpers/index.js';
import type { ConfigEnvironment } from '@config/environment.js';

// ── Constants ──────────────────────────────────────────────────────────
const SUCCESS_TOAST = 'Payment frequency updated successfully';
const SEMI_MONTHLY = 'SEMI_MONTHLY';
const BI_WEEKLY = 'BI_WEEKLY';
// 13m term × 2/month = 26 REGULAR_PAYMENT + 1 EARLY_PAY_OFF (numOfPayments.13.SEMI_MONTHLY).
const SEMI_MONTHLY_13M_REGULAR = 26;
const ANTI_DRIFT_MAX_DAYS = 45; // one frequency interval + slack; the bug hit 12/30/2027.

const TAG = buildTags(TestTag.REGRESSION, TestTag.CRITICAL, TestTag.SANDBOX);

// ── Response shape (POST /uown/svc/changePaymentFrequency) ─────────────
interface ChangeFrequencyResponse {
  schedSummaryInfo?: { paymentFrequency?: string; nextPaymentDueDate?: string; frequencyChanges?: number };
  nextPaymentDueDate?: string;
}

// ── Spec-local helpers ─────────────────────────────────────────────────

/** OTP login (viewport pinned desktop for wiring; mobile 375/768 is a validator pendency). */
async function loginToCustomerPortal(
  page: Page,
  db: DatabaseHelpers,
  testEnv: ConfigEnvironment,
  email: string,
): Promise<PaymentFrequencyPage> {
  await page.setViewportSize({ width: 1440, height: 900 });
  const pf = new PaymentFrequencyPage(page);
  const sincePk = await db.getMaxLoginAttemptPk(email);
  await page.goto(testEnv.websiteUrl);
  await pf.loginWithEmailOrPhone(email);
  const row = await db.waitForFreshOtpCode(email, sincePk, 30_000);
  expect(row?.code, `OTP code must be issued for ${email}`).toBeTruthy();
  const ok = await pf.enterVerificationCode(row!.code!);
  expect(ok, 'OTP login must succeed').toBe(true);
  return pf;
}

/** Reads the ACTIVE EARLY_PAY_OFF / REGULAR_PAYMENT counts from a status grouping. */
function activeScheduleCounts(rows: Array<{ status: string; receivable_type: string; count: number }>) {
  const active = rows.filter(r => r.status === 'ACTIVE');
  const epo = active.find(r => r.receivable_type === 'EARLY_PAY_OFF')?.count ?? 0;
  const regular = active.find(r => r.receivable_type === 'REGULAR_PAYMENT')?.count ?? 0;
  return { epo, regular };
}

/** Anti-drift oracle (CT-09/CT-14 refined AC1): next due within one frequency interval of today. */
function assertNextDueNotDrifted(body: ChangeFrequencyResponse, label: string): string {
  const raw = body.schedSummaryInfo?.nextPaymentDueDate ?? body.nextPaymentDueDate;
  expect(raw, `${label}: response must carry nextPaymentDueDate`).toBeTruthy();
  const nextDue = String(raw).slice(0, 10);
  expect(nextDue >= calculateDateISO(0), `${label}: next due ${nextDue} must not be in the past`).toBe(true);
  expect(
    nextDue <= calculateDateISO(ANTI_DRIFT_MAX_DAYS),
    `${label}: next due ${nextDue} drifted > ${ANTI_DRIFT_MAX_DAYS} days out (drift regression)`,
  ).toBe(true);
  return nextDue;
}

/**
 * Clicks SAVE, captures the changePaymentFrequency request + response, waits
 * for the toast, then waits for the page's post-Save revalidation (Bootstrap
 * spinner) to clear — see `PaymentFrequencyPage.waitForFrequencyRevalidation()`
 * for the DOM-confirmed root cause (CT-14/S3 race, qa-debugger cycle 3).
 * Without this wait, a `getCurrentFrequency()` call right after this helper
 * can sample the DOM mid-revalidation (stale label or a transient unmounted
 * "Current Plan" card).
 */
async function saveWithCapture(page: Page, pf: PaymentFrequencyPage) {
  const respPromise = page.waitForResponse(
    r => r.url().includes('/changePaymentFrequency') && r.request().method() === 'POST',
    { timeout: 30_000 },
  );
  await pf.clickSave();
  const resp = await respPromise;
  const req = (resp.request().postDataJSON() ?? {}) as Record<string, unknown>;
  const body = (await resp.json().catch(() => ({}))) as ChangeFrequencyResponse;
  const toast = await pf.waitForSuccessToast();
  await pf.waitForFrequencyRevalidation();
  return { req, body, status: resp.status(), toast };
}

/** Rule #13 side effects after a successful save (CT-06 audit + CT-07 log + CT-08 regen). */
async function assertSaveSideEffects(
  db: DatabaseHelpers,
  accountPk: string,
  opts: { from: string; to: string; freqModSincePk: bigint; logSincePk: bigint; expectRegular?: number },
): Promise<void> {
  // CT-06 — uown_frequency_mods (agent = 'customer portal', old/new correct)
  const mod = await db.waitForFrequencyMod(accountPk, opts.freqModSincePk, 30_000);
  expect(mod, 'uown_frequency_mods row must be written on save').toBeTruthy();
  expect(mod!.agent, 'audit agent must be the literal "customer portal"').toBe('customer portal');
  expect(mod!.old_frequency).toBe(opts.from);
  expect(mod!.new_frequency).toBe(opts.to);

  // CT-07 — uown_sv_activity_log FREQUENCY_CHANGE.
  // [DOM/DB-CONFIRMED 2026-07-01 — qa-validator] `waitForLoginActivityLog` is
  // hard-filtered to login-flow rows only (CORRESPONDENCE verification-code /
  // INTERNAL "Login Success") — it can never match log_type='FREQUENCY_CHANGE'
  // regardless of DB content (confirmed live: the row existed at pk 11011499
  // with correct notes/created_by, but the login-scoped WHERE clause polled it
  // away, producing a false-negative on S1/CT-04..09). Fixed to the new
  // generic `waitForActivityLogByType` helper (database.helpers.ts).
  const log = await db.waitForActivityLogByType(accountPk, 'FREQUENCY_CHANGE', opts.logSincePk, 30_000);
  expect(log, 'FREQUENCY_CHANGE activity log must be written').toBeTruthy();
  expect(log!.created_by).toBe('customer portal');
  expect(log!.notes).toBe(`Payment frequency changed from ${opts.from} to ${opts.to}`);

  // CT-08 — Rewind/Replay: exactly one ACTIVE schedule, no duplicate/overlap.
  const counts = await db.getReceivableStatusCounts(accountPk);
  const { epo, regular } = activeScheduleCounts(counts);
  expect(epo, 'exactly one ACTIVE EARLY_PAY_OFF receivable').toBe(1);
  expect(regular, 'ACTIVE REGULAR_PAYMENT count must be > 0').toBeGreaterThan(0);
  if (opts.expectRegular !== undefined) {
    expect(regular, `ACTIVE REGULAR_PAYMENT == ${opts.expectRegular} (numOfPayments.13.${opts.to})`)
      .toBe(opts.expectRegular);
  }
}

// ════════════════════════════════════════════════════════════════════════
//  GROUP A — one Bi-Weekly account, state chains across scenarios
// ════════════════════════════════════════════════════════════════════════
test.describe.serial('website#153 Group A — dropdown, boundaries, happy paths, persistence', { tag: splitTags(TAG) }, () => {
  test.use({ envName: 'sandbox' });
  test.describe.configure({ timeout: 300_000 });

  let acct: ProvisionFrequencyAccountResult;

  test('setup A — provision fresh ACTIVE Bi-Weekly account', async ({ api, db }) => {
    // DB-tunnel sanity: log MAX(pk) so the validator can confirm the tunnel is on sandbox
    // (memory db-tunnel-5445-env-identification — the local tunnel flips between envs).
    const maxAcct = await db.getSingleString('SELECT MAX(pk)::text FROM uown_sv_account');
    console.log(`[153][setup A] uown_sv_account MAX(pk)=${maxAcct}`);
    acct = await provisionActiveAccountWithFrequency(api, db, { env: 'sandbox', startFrequency: BI_WEEKLY });
    expect(acct.accountPk, 'account must be provisioned ACTIVE').toBeTruthy();
    console.log(`[153][setup A] leadPk=${acct.leadPk} accountPk=${acct.accountPk} email=${acct.customerEmail}`);
  });

  test('S4/CT-01 — dropdown excludes current freq and never lists Monthly', async ({ page, db, testEnv }) => {
    test.skip(!acct?.accountPk, 'setup A did not provision an account');
    const pf = await loginToCustomerPortal(page, db, testEnv, acct.customerEmail);
    await test.step('open Change your payment schedule', async () => {
      await pf.navigateToPaymentFrequency();
      expect(await pf.getCurrentFrequency()).toBe('Bi-Weekly');
    });
    await test.step('CT-01 — dropdown options = exactly [Weekly, Semi-Monthly]', async () => {
      const options = await pf.listFrequencyOptions();
      const set = new Set(options.map(o => o.replace(/\s/g, '')));
      expect(set.has('Bi-Weekly'.replace(/\s/g, '')), 'current Bi-Weekly must be excluded').toBe(false);
      expect(options.some(o => /monthly/i.test(o) && !/semi/i.test(o)), 'Monthly must never be listed').toBe(false);
      expect(set.has('Weekly')).toBe(true);
      expect(set.has('Semi-Monthly'.replace(/\s/g, ''))).toBe(true);
      expect(options).toHaveLength(2);
    });
  });

  test('B1/CT-02+CT-11 — First Payment Day option-set 1..17; high-day Second-Day anomaly', async ({ page, db, testEnv }) => {
    test.skip(!acct?.accountPk, 'setup A did not provision an account');
    const pf = await loginToCustomerPortal(page, db, testEnv, acct.customerEmail);
    await pf.navigateToPaymentFrequency();

    await test.step('CT-02 — First Payment Day lists exactly 1..17', async () => {
      await pf.selectFrequency('Semi-Monthly');
      const opts = (await pf.listFirstPaymentDayOptions()).map(Number).filter(n => !Number.isNaN(n)).sort((a, b) => a - b);
      expect(opts).toEqual(Array.from({ length: 17 }, (_, i) => i + 1));
    });

    // CT-11 — [candidate bug, conservative] high First Payment Day truncates the
    // Second Payment Day set at calendar day 31 (KB RN-06). Record the observed
    // behavior as an annotation; do NOT hard-fail the suite on it (rule #10).
    await test.step('CT-11 — Second Payment Day set for First=17 (observed anomaly)', async () => {
      await pf.selectFirstPaymentDay(17);
      const secondOpts = await pf.listSecondPaymentDayOptions();
      expect(secondOpts.length, 'Second Payment Day menu must open with options').toBeGreaterThan(0);
      const only31 = secondOpts.length === 1 && secondOpts[0].trim() === '31';
      if (only31) {
        test.info().annotations.push({
          type: 'candidate-bug',
          description: 'CT-11 [HYPOTHESIS]: First=17 collapses Second Payment Day to a single non-existent day "31" (KB RN-06). Same defect class as the drift bug (day arithmetic ignoring month bounds).',
        });
        console.log('[153][CT-11] OBSERVED anomaly: Second Payment Day = ["31"] for First=17');
      } else {
        test.info().annotations.push({
          type: 'ct-11-note',
          description: `CT-11: First=17 → Second Payment Day options = [${secondOpts.join(', ')}] (differs from the KB "31-only" observation — possibly fixed; validator to reconcile).`,
        });
        console.log(`[153][CT-11] Second Payment Day options for First=17: [${secondOpts.join(', ')}]`);
      }
    });
  });

  test('B2/CT-03 — Second Payment Day gap 14..20 (First=1 → 15..21)', async ({ page, db, testEnv }) => {
    test.skip(!acct?.accountPk, 'setup A did not provision an account');
    const pf = await loginToCustomerPortal(page, db, testEnv, acct.customerEmail);
    await pf.navigateToPaymentFrequency();
    await pf.selectFrequency('Semi-Monthly');
    await pf.selectFirstPaymentDay(1);
    const opts = (await pf.listSecondPaymentDayOptions()).map(Number).filter(n => !Number.isNaN(n)).sort((a, b) => a - b);
    expect(opts, 'gap 14..20 from First=1 → days 15..21').toEqual([15, 16, 17, 18, 19, 20, 21]);
  });

  test('S1/CT-04..09 — Bi-Weekly → Semi-Monthly happy path + side effects', async ({ page, db, testEnv }) => {
    test.skip(!acct?.accountPk, 'setup A did not provision an account');
    const pf = await loginToCustomerPortal(page, db, testEnv, acct.customerEmail);
    await pf.navigateToPaymentFrequency();
    expect(await pf.getCurrentFrequency(), 'must start Bi-Weekly').toBe('Bi-Weekly');

    await pf.selectFrequency('Semi-Monthly');
    await pf.selectFirstPaymentDay(1);
    await pf.selectSecondPaymentDay(15);

    const freqModSincePk = await db.getMaxFrequencyModPk(acct.accountPk);
    const logSincePk = await db.getMaxActivityLogPk(acct.accountPk);

    const { req, body, toast } = await saveWithCapture(page, pf);

    await test.step('CT-04 — success toast + immediate label update', async () => {
      expect(toast).toBe(SUCCESS_TOAST);
      expect(await pf.getCurrentFrequency()).toBe('Semi-Monthly');
    });

    await test.step('CT-05 — request payload', async () => {
      expect(req).toMatchObject({
        accountPK: Number(acct.accountPk),
        newFrequency: SEMI_MONTHLY,
        firstDueDay: 1,
        secondDueDay: 15,
      });
    });

    await test.step('CT-06/07/08 — audit + activity log + schedule regen', async () => {
      await assertSaveSideEffects(db, acct.accountPk, {
        from: BI_WEEKLY, to: SEMI_MONTHLY, freqModSincePk, logSincePk, expectRegular: SEMI_MONTHLY_13M_REGULAR,
      });
    });

    await test.step('CT-09 — next due date not drifted', async () => {
      assertNextDueNotDrifted(body, 'S1');
    });
  });

  test('S2/CT-12+CT-13 — Semi-Monthly → Bi-Weekly with next payday', async ({ page, db, testEnv }) => {
    test.skip(!acct?.accountPk, 'setup A did not provision an account');
    const pf = await loginToCustomerPortal(page, db, testEnv, acct.customerEmail);
    await pf.navigateToPaymentFrequency();
    expect(await pf.getCurrentFrequency(), 'must be Semi-Monthly after S1').toBe('Semi-Monthly');

    await pf.selectFrequency('Bi-Weekly');

    await test.step('CT-12 — next payday field appears; day fields hidden', async () => {
      expect(await pf.isNextPaydayFieldVisible(), 'Bi-Weekly destination reveals next-payday field').toBe(true);
    });

    const payday = await pf.pickNextPayday(5); // within tomorrow..+15

    const freqModSincePk = await db.getMaxFrequencyModPk(acct.accountPk);
    const logSincePk = await db.getMaxActivityLogPk(acct.accountPk);

    const { req, body, toast } = await saveWithCapture(page, pf);

    await test.step('CT-13 — payload carries nextPayDate, no first/second due day', async () => {
      expect(req.newFrequency).toBe(BI_WEEKLY);
      expect(req.accountPK).toBe(Number(acct.accountPk));
      expect(req.nextPayDate ?? req.nextPaydate, 'nextPayDate must be present').toBeTruthy();
      expect(req.firstDueDay, 'firstDueDay must be absent for Bi-Weekly').toBeUndefined();
      expect(req.secondDueDay, 'secondDueDay must be absent for Bi-Weekly').toBeUndefined();
      console.log(`[153][S2] picked payday=${payday} payload=${JSON.stringify(req)}`);
    });

    await test.step('label + side effects + anti-drift', async () => {
      expect(toast).toBe(SUCCESS_TOAST);
      expect(await pf.getCurrentFrequency()).toBe('Bi-Weekly');
      await assertSaveSideEffects(db, acct.accountPk, {
        from: SEMI_MONTHLY, to: BI_WEEKLY, freqModSincePk, logSincePk,
      });
      assertNextDueNotDrifted(body, 'S2');
    });
  });

  test('S5/CT-10 — persistence after navigating away and back', async ({ page, db, testEnv }) => {
    test.skip(!acct?.accountPk, 'setup A did not provision an account');
    const pf = await loginToCustomerPortal(page, db, testEnv, acct.customerEmail);
    await pf.navigateToPaymentFrequency();

    await pf.selectFrequency('Semi-Monthly');
    await pf.selectFirstPaymentDay(1);
    await pf.selectSecondPaymentDay(15);
    const toast = await pf.saveFrequency();
    expect(toast).toBe(SUCCESS_TOAST);

    await test.step('CT-10 — leave and return: Current Frequency persists', async () => {
      await pf.goToSidebarLink('account summary');
      await pf.navigateToPaymentFrequency();
      expect(await pf.getCurrentFrequency()).toBe('Semi-Monthly');
    });

    // Servicing cross-portal parity (SPEC S5): no Servicing "Frequency Changes"
    // page object exists — creating one hastily is out of scope (delegation gate:
    // new page object needs ASK). DB parity stands in as proxy; UI parity is a
    // documented validator pendency.
    await test.step('DB parity proxy — latest audit reflects Semi-Monthly', async () => {
      const counts = await db.getReceivableStatusCounts(acct.accountPk);
      const { epo, regular } = activeScheduleCounts(counts);
      expect(epo).toBe(1);
      expect(regular).toBe(SEMI_MONTHLY_13M_REGULAR);
      test.info().annotations.push({
        type: 'pendency',
        description: 'S5 Servicing-UI parity ("Frequency Changes"/"Due Amounts") not asserted via UI — no Servicing page object exists. Validator to confirm via Servicing portal or authorize a new PO.',
      });
    });
  });
});

// ════════════════════════════════════════════════════════════════════════
//  GROUP B — S3: repeated Bi-Weekly ↔ Semi-Monthly, no date drift
// ════════════════════════════════════════════════════════════════════════
test.describe.serial('website#153 Group B — S3 repeated toggle no drift', { tag: splitTags(TAG) }, () => {
  test.use({ envName: 'sandbox' });
  test.describe.configure({ timeout: 300_000 });

  let acct: ProvisionFrequencyAccountResult;

  test('setup B — provision fresh ACTIVE Bi-Weekly account', async ({ api, db }) => {
    acct = await provisionActiveAccountWithFrequency(api, db, { env: 'sandbox', startFrequency: BI_WEEKLY });
    expect(acct.accountPk).toBeTruthy();
    console.log(`[153][setup B] accountPk=${acct.accountPk} email=${acct.customerEmail}`);
  });

  test('S3/CT-04..09+CT-14 — 3 full cycles keep the schedule bounded', async ({ page, db, testEnv }) => {
    test.skip(!acct?.accountPk, 'setup B did not provision an account');
    const pf = await loginToCustomerPortal(page, db, testEnv, acct.customerEmail);
    await pf.navigateToPaymentFrequency();
    expect(await pf.getCurrentFrequency()).toBe('Bi-Weekly');

    let expectedAuditCount = 0;
    const CYCLES = 3;

    for (let cycle = 1; cycle <= CYCLES; cycle++) {
      // Bi-Weekly → Semi-Monthly
      await test.step(`cycle ${cycle} — Bi-Weekly → Semi-Monthly`, async () => {
        await pf.selectFrequency('Semi-Monthly');
        await pf.selectFirstPaymentDay(1);
        await pf.selectSecondPaymentDay(15);
        const freqModSincePk = await db.getMaxFrequencyModPk(acct.accountPk);
        const logSincePk = await db.getMaxActivityLogPk(acct.accountPk);
        const { body, toast } = await saveWithCapture(page, pf);
        expect(toast).toBe(SUCCESS_TOAST);
        expect(await pf.getCurrentFrequency()).toBe('Semi-Monthly');
        await assertSaveSideEffects(db, acct.accountPk, {
          from: BI_WEEKLY, to: SEMI_MONTHLY, freqModSincePk, logSincePk, expectRegular: SEMI_MONTHLY_13M_REGULAR,
        });
        assertNextDueNotDrifted(body, `S3 cycle ${cycle} → SM`);
        expectedAuditCount += 1;
        expect(await db.countFrequencyMods(acct.accountPk)).toBe(expectedAuditCount);
      });

      // Semi-Monthly → Bi-Weekly
      await test.step(`cycle ${cycle} — Semi-Monthly → Bi-Weekly`, async () => {
        await pf.selectFrequency('Bi-Weekly');
        expect(await pf.isNextPaydayFieldVisible()).toBe(true);
        await pf.pickNextPayday(5);
        const freqModSincePk = await db.getMaxFrequencyModPk(acct.accountPk);
        const logSincePk = await db.getMaxActivityLogPk(acct.accountPk);
        const { body, toast } = await saveWithCapture(page, pf);
        expect(toast).toBe(SUCCESS_TOAST);
        expect(await pf.getCurrentFrequency()).toBe('Bi-Weekly');
        await assertSaveSideEffects(db, acct.accountPk, {
          from: SEMI_MONTHLY, to: BI_WEEKLY, freqModSincePk, logSincePk,
        });
        assertNextDueNotDrifted(body, `S3 cycle ${cycle} → BW`);
        expectedAuditCount += 1;
        expect(await db.countFrequencyMods(acct.accountPk)).toBe(expectedAuditCount);
      });
    }

    await test.step('final — one audit row per save, single ACTIVE schedule, not Monthly', async () => {
      expect(await db.countFrequencyMods(acct.accountPk)).toBe(CYCLES * 2);
      const { epo } = activeScheduleCounts(await db.getReceivableStatusCounts(acct.accountPk));
      expect(epo, 'exactly one ACTIVE schedule survives (no accumulation)').toBe(1);
      expect(await pf.getCurrentFrequency()).not.toMatch(/monthly/i);
    });
  });
});

// ════════════════════════════════════════════════════════════════════════
//  GROUP C — S6: mixed updates, no unintended shifts after last save
// ════════════════════════════════════════════════════════════════════════
test.describe.serial('website#153 Group C — S6 mixed updates idempotent', { tag: splitTags(TAG) }, () => {
  test.use({ envName: 'sandbox' });
  test.describe.configure({ timeout: 300_000 });

  let acct: ProvisionFrequencyAccountResult;

  test('setup C — provision fresh ACTIVE Bi-Weekly account', async ({ api, db }) => {
    acct = await provisionActiveAccountWithFrequency(api, db, { env: 'sandbox', startFrequency: BI_WEEKLY });
    expect(acct.accountPk).toBeTruthy();
    console.log(`[153][setup C] accountPk=${acct.accountPk} email=${acct.customerEmail}`);
  });

  test('S6/CT-14 — 4 mixed changes, schedule reflects only the last', async ({ page, db, testEnv }) => {
    test.skip(!acct?.accountPk, 'setup C did not provision an account');
    const pf = await loginToCustomerPortal(page, db, testEnv, acct.customerEmail);
    await pf.navigateToPaymentFrequency();
    expect(await pf.getCurrentFrequency()).toBe('Bi-Weekly');

    let saves = 0;

    // 1) BW → SM (1,15)
    await test.step('save 1 — Bi-Weekly → Semi-Monthly (1,15)', async () => {
      await pf.selectFrequency('Semi-Monthly');
      await pf.selectFirstPaymentDay(1);
      await pf.selectSecondPaymentDay(15);
      const { body, toast } = await saveWithCapture(page, pf);
      expect(toast).toBe(SUCCESS_TOAST);
      assertNextDueNotDrifted(body, 'S6 save1');
      saves += 1;
    });

    // 2) SM → BW (payday +5)
    await test.step('save 2 — Semi-Monthly → Bi-Weekly', async () => {
      await pf.selectFrequency('Bi-Weekly');
      await pf.pickNextPayday(5);
      const { body, toast } = await saveWithCapture(page, pf);
      expect(toast).toBe(SUCCESS_TOAST);
      assertNextDueNotDrifted(body, 'S6 save2');
      saves += 1;
    });

    // 3) BW → SM (2,16)
    await test.step('save 3 — Bi-Weekly → Semi-Monthly (2,16)', async () => {
      await pf.selectFrequency('Semi-Monthly');
      await pf.selectFirstPaymentDay(2);
      await pf.selectSecondPaymentDay(16);
      const { body, toast } = await saveWithCapture(page, pf);
      expect(toast).toBe(SUCCESS_TOAST);
      assertNextDueNotDrifted(body, 'S6 save3');
      saves += 1;
    });

    // 4) SM → BW (payday +7) — LAST save
    await test.step('save 4 — Semi-Monthly → Bi-Weekly (last)', async () => {
      await pf.selectFrequency('Bi-Weekly');
      await pf.pickNextPayday(7);
      const { body, toast } = await saveWithCapture(page, pf);
      expect(toast).toBe(SUCCESS_TOAST);
      assertNextDueNotDrifted(body, 'S6 save4');
      saves += 1;
    });

    await test.step('after last save — reflects only Bi-Weekly, never Monthly', async () => {
      await pf.goToSidebarLink('account summary');
      await pf.navigateToPaymentFrequency();
      expect(await pf.getCurrentFrequency(), 'schedule reflects only the last frequency').toBe('Bi-Weekly');
      expect(await pf.getCurrentFrequency()).not.toMatch(/monthly/i);
    });

    await test.step('audit count == successful saves; single ACTIVE schedule (no dup charges)', async () => {
      expect(await db.countFrequencyMods(acct.accountPk), 'one audit row per successful save').toBe(saves);
      const { epo } = activeScheduleCounts(await db.getReceivableStatusCounts(acct.accountPk));
      expect(epo, 'exactly one ACTIVE schedule — no duplicate/overlapping receivables').toBe(1);
    });
  });
});

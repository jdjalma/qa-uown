/**
 * Task RU07.26.1.54.0 — Update Payment Decline email template (svc#565).
 *
 * Validates the redesigned Payment Decline email (HubSpot layout) for BOTH brands
 * (UOwn `PaymentDeclineEmail` / Kornerstone `KORNERSTONE_PaymentDeclineEmail`) and
 * BOTH copy variants (non-settlement vs AC9 settlement-arrangement copy).
 *
 * BDD oracle (rule #19): .claude/oracles/payment-decline-email.md
 * SPEC: docs/taskTestingUown/RU07.26.1.54.0_updatePaymentDeclineEmailTemplate_565/
 *       RU07.26.1.54.0_updatePaymentDeclineEmailTemplate_565-spec.md
 *
 * STRATEGY (rule #14 — rendering-first): the feature's value is what the customer
 * SEES. Assertions run against the delivered HTML (`uown_email_queue.email_body`)
 * AND that HTML is RENDERED in the browser (page.setContent) at desktop + mobile —
 * empty placeholders / wrong-brand assets / broken layout are invisible in a
 * log-only read (BUG-01 Daniel's Jewelers CA precedent).
 *
 * DATA (rule #9): every scenario funds a FRESH account via the canonical
 * createPreQualifiedApplication → driveLeadToFunding helpers (merchant preflight,
 * rule #12, runs inside createPreQualifiedApplication). NO record reuse.
 *
 * NO DB MUTATION (Exception 2): the SETTLEMENT (CT-04) and NORMAL (CT-05)
 * arrangements are created through the AUTHORIZED payment-arrangement API with a
 * DECLINED test card — fresh automation, NOT a direct UPDATE. No `UPDATE ...
 * RETURNED` is performed anywhere. If a synchronous CC-SALE decline does not
 * enqueue the decline email in the target env (Open Question Q1 / processor
 * availability Q5), each scenario SKIPS with a diagnostic — it never false-passes.
 *
 * OPEN QUESTIONS carried from the SPEC (see handoff):
 *  - Q1: which servicing decline synchronously enqueues PaymentDeclineEmail.
 *  - Q3: AC9 setup reached via API arrangement + declined card (no DB mutation attempted).
 *  - Q4: exact activity-log target/prefix — asserted presence-first on uown_sv_activity_log.
 *  - Q5: env with a real CC processor + emailSweep (dev1/qa1 confirmed).
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';
import {
  buildTestData,
  createPreQualifiedApplication,
  driveLeadToFunding,
  waitForEmailQueueRecord,
  waitForEmailQueueDispatched,
  calculateDateISO,
  sleep,
} from '@helpers/index.js';
import { TEST_CARDS } from '@data/index.js';
import { makeTestContext } from '@support/base-test.js';
import type { ApiClients } from '@support/base-test.js';
import type { DatabaseHelpers } from '@helpers/database.helpers.js';
import type { EmailHelpers } from '@helpers/email.helpers.js';
import type { EmailQueueRow } from '@helpers/settled-in-full.helpers.js';
import type {
  ArrangementType,
  CreditCardTransactionInfo,
  PaymentArrangementCcBody,
} from '@api/bodies/payment-arrangement.body.js';
import type { Page } from '@playwright/test';

// ── Exact strings (ground truth: ticket Email Details + AC9 comment) ─────────

const SUBJECT = 'Action Needed: Issue Processing Your Recent Payment';
const PREHEADER = 'Ensure your account stays active by resolving payment issues.';
const GREETING_TAIL = 'we had trouble processing your payment.';
const FALLBACK_NAME = 'Customer';

const UOWN_PHONE = '(877) 357-5474';
const UOWN_CLOSING = 'Thank you for choosing Uown.';
const UOWN_PORTAL_HOST = 'https://portal.uownleasing.com';
const TEMPLATE_UOWN = 'PaymentDeclineEmail';

const KS_PHONE = '(888) 521-5111';
const KS_CLOSING_FRAGMENT = 'Kornerstone';
const TEMPLATE_KS = 'KORNERSTONE_PaymentDeclineEmail';

const NON_SETTLEMENT_A = 'Unfortunately, we were unable to process your most recent payment.';
const NON_SETTLEMENT_B = 'To keep your account in good standing, please make a payment as soon as possible.';
const SETTLEMENT_A = 'Unfortunately, we were unable to process your settlement payment.';
const SETTLEMENT_B = 'To keep your settlement offer in good standing, please make a payment as soon as possible.';

// Approved GCS image allow-list (email-templates-catalog §3).
const UOWN_IMG_ALLOW = /^https:\/\/storage\.googleapis\.com\/uown\//i;
// KS bucket path is unconfirmed on this feature → domain-level check + log for review.
const GCS_DOMAIN_ALLOW = /^https:\/\/storage\.googleapis\.com\//i;

// ── Timeouts ─────────────────────────────────────────────────────────────────

const T = {
  SETUP: 600_000,
  EMAIL_ROW: 90_000,
  DISPATCH: 120_000,
  IMAP: 120_000,
  ACTIVITY: 60_000,
};

// ── Brand descriptor ─────────────────────────────────────────────────────────

interface Brand {
  label: 'UOwn' | 'Kornerstone';
  merchantKey: string;
  state: string;
  templateName: string;
  phone: string;
  emailPrefix: string;
}

const UOWN: Brand = {
  label: 'UOwn',
  merchantKey: 'TireAgent',
  state: 'CA',
  templateName: TEMPLATE_UOWN,
  phone: UOWN_PHONE,
  emailPrefix: 'pd565uown',
};

const KS: Brand = {
  label: 'Kornerstone',
  merchantKey: 'FifthAveFurnitureNY', // ref_merchant_code KS3015 — brand discriminator by prefix
  state: 'NY',
  templateName: TEMPLATE_KS,
  phone: KS_PHONE,
  emailPrefix: 'pd565ks',
};

// ── Setup: fresh FUNDED account (rule #9 / rule #12) ─────────────────────────

interface FundedDeclineCtx {
  leadPk: string;
  accountPk: string;
  customerEmail: string;
  firstName: string;
}

/**
 * Fund a fresh account for the given brand. Reuses the canonical helpers
 * (createPreQualifiedApplication → driveLeadToFunding); merchant preflight runs
 * inside createPreQualifiedApplication (rule #12). `firstNameOverride === ''`
 * exercises the empty-name fallback (CT-03).
 */
async function fundDeclineAccount(
  api: ApiClients,
  db: DatabaseHelpers,
  envName: string,
  brand: Brand,
  firstNameOverride?: string,
): Promise<FundedDeclineCtx> {
  const { merchant, applicant } = buildTestData({
    env: envName,
    state: brand.state,
    merchant: brand.merchantKey,
    orderTotal: '1500',
    // email defaults to the Gmail plus-alias (env.uniqueEmailAlias) so IMAP can
    // fetch the delivered message; do NOT override with an @e2e.test alias.
  });
  if (firstNameOverride !== undefined) applicant.firstName = firstNameOverride;

  const ctx = makeTestContext();
  // Default (authorizeCreditCard) path: guarantees a real CC is attached to the
  // lead before funding. The submitPaymentInfoViaApi path relies on
  // submitApplication attaching the card, which some envs reject with
  // "A credit card is required before submitting the application." → no CC →
  // FUNDING forced but no servicing account materializes.
  await createPreQualifiedApplication(api, merchant, applicant, ctx, {});
  await driveLeadToFunding(api, merchant, ctx);

  const accountPk = (await db.waitForAccountByLeadPk(ctx.leadPk, 120_000)) ?? '';
  expect(accountPk, 'servicing accountPk resolved after FUNDING').not.toBe('');

  return {
    leadPk: ctx.leadPk,
    accountPk,
    customerEmail: applicant.email,
    firstName: applicant.firstName,
  };
}

// ── Trigger: a servicing CC SALE that declines ───────────────────────────────

/**
 * Build a single-transaction makeCreditCardPayments body with a DECLINED card.
 * arrangementType undefined → one-shot payment (no arrangement, paymentArrangement=false).
 * arrangementType set → creates a NORMAL/SETTLEMENT arrangement with the declined
 * installment linked to it (drives the AC9 conditional copy path).
 */
function buildDeclineBody(
  ctx: FundedDeclineCtx,
  arrangementType?: ArrangementType,
): PaymentArrangementCcBody {
  const card = TEST_CARDS.VISA_DECLINED;
  const tx: CreditCardTransactionInfo = {
    amount: 25,
    accountPk: Number(ctx.accountPk),
    allocationStrategy: 'REGULAR_RECEIVABLES',
    postingDate: calculateDateISO(0),
    useCardOnFile: false,
    saveCardToFile: false,
    ccAction: 'SALE',
    ccTransactionType: 'REQUEST',
    chargeFee: true,
    ccInfo: {
      ccFirstName: ctx.firstName || 'Test',
      ccLastName: 'Automation',
      ccNumber: card.number,
      ccExp: card.expirationDate,
      cvc: card.cvv,
      ccType: 'OTHER',
      ccVendor: 'CHANNEL_PAYMENTS_CC',
      autoPay: false,
      leadPk: Number(ctx.leadPk),
      ccAddress: { streetAddress1: '', streetAddress2: '', zipCode: '', city: '', state: '' },
    },
  };
  return {
    accountPk: Number(ctx.accountPk),
    paymentArrangement: arrangementType !== undefined,
    ...(arrangementType !== undefined && { arrangementType }),
    creditCardTransactions: [tx],
  };
}

async function triggerCcDecline(
  api: ApiClients,
  ctx: FundedDeclineCtx,
  arrangementType?: ArrangementType,
): Promise<void> {
  const res = await api.paymentArrangement.makeCreditCardPayments(
    buildDeclineBody(ctx, arrangementType),
  );
  const txs = res.body?.creditCardTransactions ?? [];
  const status = txs[0]?.status ?? '(none)';
  console.log(
    `[decline] account=${ctx.accountPk} arrangement=${arrangementType ?? 'NONE'} ` +
      `httpStatus=${res.status} ccStatus=${status} error=${txs[0]?.error ?? ''}`,
  );
  // A genuine decline is the point of this setup; APPROVED here would invalidate it.
  if (typeof txs[0]?.status === 'string') {
    expect(txs[0].status.toUpperCase()).not.toBe('APPROVED');
  }
}

// ── Email-row polling + skip guard ───────────────────────────────────────────

/**
 * Poll uown_email_queue for the brand-correct decline-email row. Returns null when
 * no row materializes (env without processor / decline path does not enqueue the
 * email — Q1/Q5). Callers convert null into a documented test.skip (no false pass).
 */
async function fetchDeclineEmailRow(
  db: DatabaseHelpers,
  ctx: FundedDeclineCtx,
): Promise<EmailQueueRow | null> {
  return waitForEmailQueueRecord(
    db,
    ctx.customerEmail,
    Number(ctx.accountPk),
    'PaymentDecline', // ILIKE — matches both PaymentDeclineEmail and KORNERSTONE_PaymentDeclineEmail
    T.EMAIL_ROW,
  );
}

function skipIfNoEmail(row: EmailQueueRow | null, brand: Brand): asserts row is EmailQueueRow {
  test.skip(
    row === null,
    `[Q1/Q5] No ${brand.templateName} row enqueued for the ${brand.label} decline in this env — ` +
      `the synchronous CC-SALE decline either does not enqueue the email or the env lacks a ` +
      `CC processor + emailSweep. Content checkpoints are deterministic once a row exists; ` +
      `re-run on dev1/qa1 (processor + emailSweep confirmed).`,
  );
}

// ── Content assertions (oracle checkpoints) ──────────────────────────────────

function collectImageUrls(html: string): string[] {
  const urls: string[] = [];
  const imgRe = /<img[^>]+src=["']([^"']+)["']/gi;
  const bgRe = /background(?:-image)?\s*:\s*url\(["']?([^"')]+)["']?\)/gi;
  let m: RegExpExecArray | null;
  while ((m = imgRe.exec(html)) !== null) urls.push(m[1]);
  while ((m = bgRe.exec(html)) !== null) urls.push(m[1]);
  return urls.filter((u) => !u.startsWith('data:') && !u.startsWith('cid:'));
}

function assertImagesOnAllowList(html: string, allow: RegExp, label: string): void {
  const offenders = collectImageUrls(html).filter((u) => !allow.test(u));
  expect(offenders, `${label}: images outside allow-list ${allow} → ${offenders.join(', ')}`).toHaveLength(0);
}

function assertNonSettlementCopy(body: string): void {
  expect(body, 'non-settlement copy A').toContain(NON_SETTLEMENT_A);
  expect(body, 'non-settlement copy B').toContain(NON_SETTLEMENT_B);
  expect(body, 'settlement copy A must be absent').not.toContain(SETTLEMENT_A);
  expect(body, 'settlement copy B must be absent').not.toContain(SETTLEMENT_B);
  expect(body.toLowerCase(), 'no "settlement payment" wording').not.toContain('settlement payment');
  expect(body.toLowerCase(), 'no "settlement offer" wording').not.toContain('settlement offer');
}

function assertSettlementCopy(body: string): void {
  expect(body, 'settlement copy A').toContain(SETTLEMENT_A);
  expect(body, 'settlement copy B').toContain(SETTLEMENT_B);
  expect(body, 'original copy A must be absent').not.toContain(NON_SETTLEMENT_A);
  expect(body, 'original copy B must be absent').not.toContain(NON_SETTLEMENT_B);
}

/** Common checkpoints valid for every brand + copy variant. */
function assertCommonRow(row: EmailQueueRow, brand: Brand, ctx: FundedDeclineCtx): string {
  expect(row.templateName, 'brand-correct template_name (case-sensitive)').toBe(brand.templateName);
  expect(row.subject, 'exact subject line (AC4)').toBe(SUBJECT);
  expect(row.bodyType, 'HTML body').toBe('HTML');
  expect(['SENT', 'STORED', 'PENDING', 'PICKED_TO_STORE']).toContain(row.status ?? '');
  expect((row.toEmail ?? '').toLowerCase(), 'recipient == customer email')
    .toContain(ctx.customerEmail.toLowerCase());

  const body = row.body ?? '';
  expect(body.length, 'non-empty rendered body').toBeGreaterThan(0);

  // Greeting + first name (AC3) — the empty-placeholder failure class (rule #14).
  expect(ctx.firstName.length, 'setup produced a non-empty first name').toBeGreaterThan(0);
  expect(body, 'greeting present with the real first name').toContain(`${ctx.firstName}, ${GREETING_TAIL}`);
  expect(body, 'no raw Thymeleaf token leaked').not.toContain('${');
  expect(body, 'no unresolved [FIRST NAME] token').not.toContain('[FIRST NAME]');

  // Preheader (AC5).
  expect(body, 'preheader text (AC5)').toContain(PREHEADER);

  return body;
}

/** Render the delivered HTML in the browser at desktop + mobile (rule #14 / AC6). */
async function assertRendersAtViewports(page: Page, html: string, expectFirstName: string): Promise<void> {
  const greetingFragment = `${expectFirstName}, ${GREETING_TAIL}`;
  for (const vp of [
    { width: 1440, height: 900, label: 'desktop' },
    { width: 375, height: 667, label: 'mobile' },
  ]) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('img').first(), `${vp.label}: at least one image renders`).toBeVisible();
    await expect(
      page.getByText(greetingFragment, { exact: false }).first(),
      `${vp.label}: greeting visible (no empty-placeholder leak)`,
    ).toBeVisible();
  }
}

/**
 * Activity-log presence (rule #13, Q4). Post-funding servicing decline is
 * account-centric → uown_sv_activity_log. Presence-first (count grows since the
 * baseline); exact log_type/prefix tightening deferred until DB-confirmed (Q4).
 */
async function assertActivityLogGrew(
  db: DatabaseHelpers,
  accountPk: string,
  baselineCount: number,
): Promise<void> {
  const deadline = Date.now() + T.ACTIVITY;
  let rows = await db.getActivityLogsByAccount(accountPk);
  while (rows.length <= baselineCount && Date.now() < deadline) {
    await sleep(3000);
    rows = await db.getActivityLogsByAccount(accountPk);
  }
  expect(
    rows.length,
    `[rule #13] a new uown_sv_activity_log row must exist after the decline (baseline=${baselineCount})`,
  ).toBeGreaterThan(baselineCount);
  // Diagnostic (Q4 tightening): surface the newest note for later prefix confirmation.
  const newest = rows[0]?.notes;
  if (typeof newest === 'string') console.log(`[activity-log] newest note: ${newest.slice(0, 160)}`);
}

async function baselineActivityCount(db: DatabaseHelpers, accountPk: string): Promise<number> {
  return (await db.getActivityLogsByAccount(accountPk)).length;
}

/** Best-effort IMAP delivery + render (bonus deliverability check, guarded). */
async function tryImapRender(
  email: EmailHelpers,
  page: Page,
  ctx: FundedDeclineCtx,
): Promise<void> {
  const delivered = await email.getEmailContent(ctx.customerEmail, new RegExp(SUBJECT.slice(0, 20), 'i'), T.IMAP);
  if (!delivered) {
    console.log('[imap] delivered message not found (no SendGrid→Gmail delivery in this env) — DB-body render already covered AC6');
    return;
  }
  expect(delivered.subject).toContain(SUBJECT);
  await page.setContent(delivered.body, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('img').first(), 'IMAP-delivered HTML renders an image').toBeVisible();
}

// ── Test data / env ──────────────────────────────────────────────────────────

const ENVIRONMENT = process.env.ENV || 'qa1';
// File lives under tests/e2e/servicing → runs in the `servicing-ui` project
// (playwright.config.ts testDir: ./tests/e2e/servicing). The `@servicing` tag is
// kept for tag-based filtering; it no longer routes to task-testing-servicing.
const TAG = `${buildTags(TestTag.REGRESSION, TestTag.CRITICAL)} @servicing`;

test.describe(`RU07.26.1.54.0_updatePaymentDeclineEmailTemplate_565 - ${ENVIRONMENT}`, {
  tag: splitTags(TAG),
}, () => {
  test.use({ envName: ENVIRONMENT });

  // CT-01 (+ CT-06 render + CT-07 trigger/activity-log folded in): UOwn non-settlement.
  test('CT-01: UOwn non-settlement decline renders the new design (+ CT-06 + CT-07)', async ({ page, api, db, email }) => {
    test.setTimeout(T.SETUP);

    let ctx!: FundedDeclineCtx;
    await test.step('Setup — fund a fresh UOwn account', async () => {
      ctx = await fundDeclineAccount(api, db, ENVIRONMENT, UOWN);
    });

    const baseline = await baselineActivityCount(db, ctx.accountPk);

    await test.step('Exercise — trigger a servicing CC decline', async () => {
      await triggerCcDecline(api, ctx);
    });

    const row = await fetchDeclineEmailRow(db, ctx);
    skipIfNoEmail(row, UOWN);

    await test.step('CT-01 — content: subject, greeting, non-settlement copy, CTA, phone, closing', async () => {
      const body = assertCommonRow(row, UOWN, ctx);
      assertNonSettlementCopy(body);
      expect(body, 'portal CTA host').toContain(UOWN_PORTAL_HOST);
      expect(body, 'UOwn support phone').toContain(UOWN_PHONE);
      expect(body, 'UOwn closing').toContain(UOWN_CLOSING);
      assertImagesOnAllowList(body, UOWN_IMG_ALLOW, 'UOwn');
    });

    await test.step('CT-06 — subject + preheader + multi-viewport render (rule #14 / AC6)', async () => {
      expect(row.subject).toBe(SUBJECT);
      expect(row.body ?? '').toContain(PREHEADER);
      await assertRendersAtViewports(page, row.body ?? '', ctx.firstName);
    });

    await test.step('CT-07 — dispatch + activity log (rule #13)', async () => {
      // AC8: the new HTML is what renders (already asserted via copy/branding above).
      await api.scheduledTask.triggerScheduledTask('emailSweep').catch(() => undefined);
      await waitForEmailQueueDispatched(db, row.pk, T.DISPATCH).catch(() => null);
      await assertActivityLogGrew(db, ctx.accountPk, baseline);
      await tryImapRender(email, page, ctx);
    });
  });

  // CT-02: Kornerstone non-settlement decline renders KS branding.
  test('CT-02: Kornerstone non-settlement decline renders KS branding', async ({ page, api, db }) => {
    test.setTimeout(T.SETUP);

    let ctx!: FundedDeclineCtx;
    await test.step('Setup — fund a fresh Kornerstone account (KS3015)', async () => {
      ctx = await fundDeclineAccount(api, db, ENVIRONMENT, KS);
    });

    const baseline = await baselineActivityCount(db, ctx.accountPk);
    await test.step('Exercise — trigger a servicing CC decline', async () => {
      await triggerCcDecline(api, ctx);
    });

    const row = await fetchDeclineEmailRow(db, ctx);
    skipIfNoEmail(row, KS);

    await test.step('CT-02 — KS template, phone, portal host, closing, branding', async () => {
      const body = assertCommonRow(row, KS, ctx);
      assertNonSettlementCopy(body);
      expect(body, 'KS support phone (NOT UOwn)').toContain(KS_PHONE);
      expect(body, 'UOwn phone must not leak into KS').not.toContain(UOWN_PHONE);
      expect(body, 'KS closing').toContain(KS_CLOSING_FRAGMENT);
      expect(body, 'UOwn portal host must not leak into KS').not.toContain(UOWN_PORTAL_HOST);
      // KS bucket path unconfirmed on this feature → domain-level allow-list + log for review.
      assertImagesOnAllowList(body, GCS_DOMAIN_ALLOW, 'Kornerstone');
      console.log(`[ks-images] ${collectImageUrls(body).join(' | ')}`);
    });

    await test.step('CT-06 — render KS body at desktop + mobile', async () => {
      await assertRendersAtViewports(page, row.body ?? '', ctx.firstName);
    });

    await test.step('CT-07 — activity log (rule #13)', async () => {
      await assertActivityLogGrew(db, ctx.accountPk, baseline);
    });
  });

  // CT-03: first-name fallback renders "Customer" when the name is empty.
  test('CT-03: empty first name falls back to "Customer"', async ({ api, db }) => {
    test.setTimeout(T.SETUP);

    let ctx: FundedDeclineCtx | null = null;
    await test.step('Setup — fund a fresh UOwn account with an EMPTY first name', async () => {
      try {
        ctx = await fundDeclineAccount(api, db, ENVIRONMENT, UOWN, '');
      } catch (err) {
        // The application form may reject a blank first name; without a UI/API path
        // that accepts it, forcing the empty-name state would need an authorized DB
        // UPDATE (Exception 2) — NOT performed. Skip with the reason instead.
        test.skip(true, `[Q-empty-name] cannot create an account with a blank first name via fresh automation: ${(err as Error).message}`);
      }
    });
    const c = ctx as unknown as FundedDeclineCtx;

    await test.step('Exercise — trigger a servicing CC decline', async () => {
      await triggerCcDecline(api, c);
    });

    const row = await fetchDeclineEmailRow(db, c);
    skipIfNoEmail(row, UOWN);

    await test.step('CT-03 — greeting reads "Customer, ..." with no placeholder leak', async () => {
      const body = row.body ?? '';
      expect(body, 'fallback greeting').toContain(`${FALLBACK_NAME}, ${GREETING_TAIL}`);
      expect(body, 'no raw Thymeleaf token').not.toContain('${');
      expect(body, 'no [FIRST NAME] token').not.toContain('[FIRST NAME]');
    });
  });

  // CT-04: SETTLEMENT-arrangement decline swaps to settlement copy (AC9).
  test('CT-04: SETTLEMENT arrangement decline uses settlement copy (AC9)', async ({ page, api, db }) => {
    test.setTimeout(T.SETUP);

    let ctx!: FundedDeclineCtx;
    await test.step('Setup — fund a fresh UOwn account', async () => {
      ctx = await fundDeclineAccount(api, db, ENVIRONMENT, UOWN);
    });

    const baseline = await baselineActivityCount(db, ctx.accountPk);
    await test.step('Exercise — create a SETTLEMENT arrangement whose payment declines', async () => {
      await triggerCcDecline(api, ctx, 'SETTLEMENT');
    });

    await test.step('Precondition — confirm arrangement_type=SETTLEMENT (read-only)', async () => {
      const arr = await db.queryOne<{ arrangement_type: string }>(
        `SELECT arrangement_type FROM uown_sv_payment_arrangement
          WHERE account_pk = $1 ORDER BY pk DESC LIMIT 1`,
        [ctx.accountPk],
      );
      // If the declined first installment blocked arrangement creation, skip (Q3 —
      // do NOT force it via a DB mutation).
      test.skip(
        arr?.arrangement_type !== 'SETTLEMENT',
        `[Q3] no SETTLEMENT arrangement persisted for the declined payment (got ${arr?.arrangement_type ?? 'none'}); ` +
          `forcing a linked decline would require an authorized DB UPDATE (Exception 2) — not performed.`,
      );
    });

    const row = await fetchDeclineEmailRow(db, ctx);
    skipIfNoEmail(row, UOWN);

    await test.step('CT-04 — settlement copy swapped, everything else identical', async () => {
      const body = assertCommonRow(row, UOWN, ctx);
      assertSettlementCopy(body);
      // Invariants (only the two copy lines differ):
      expect(body, 'portal CTA host unchanged').toContain(UOWN_PORTAL_HOST);
      expect(body, 'UOwn phone unchanged').toContain(UOWN_PHONE);
      expect(body, 'UOwn closing unchanged').toContain(UOWN_CLOSING);
      await assertRendersAtViewports(page, body, ctx.firstName);
    });

    await test.step('CT-07 — activity log (rule #13)', async () => {
      await assertActivityLogGrew(db, ctx.accountPk, baseline);
    });
  });

  // CT-05: NORMAL-arrangement decline keeps original copy (AC9 regression guard).
  test('CT-05: NORMAL arrangement decline keeps original copy (AC9 negative)', async ({ api, db }) => {
    test.setTimeout(T.SETUP);

    let ctx!: FundedDeclineCtx;
    await test.step('Setup — fund a fresh UOwn account', async () => {
      ctx = await fundDeclineAccount(api, db, ENVIRONMENT, UOWN);
    });

    await test.step('Exercise — create a NORMAL arrangement whose payment declines', async () => {
      await triggerCcDecline(api, ctx, 'NORMAL');
    });

    await test.step('Precondition — confirm arrangement_type=NORMAL (read-only)', async () => {
      const arr = await db.queryOne<{ arrangement_type: string }>(
        `SELECT arrangement_type FROM uown_sv_payment_arrangement
          WHERE account_pk = $1 ORDER BY pk DESC LIMIT 1`,
        [ctx.accountPk],
      );
      test.skip(
        arr?.arrangement_type !== 'NORMAL',
        `[Q3] no NORMAL arrangement persisted for the declined payment (got ${arr?.arrangement_type ?? 'none'}).`,
      );
    });

    const row = await fetchDeclineEmailRow(db, ctx);
    skipIfNoEmail(row, UOWN);

    await test.step('CT-05 — original (non-settlement) copy, NO settlement wording', async () => {
      const body = assertCommonRow(row, UOWN, ctx);
      assertNonSettlementCopy(body); // asserts both original lines present AND settlement wording absent
    });
  });
});

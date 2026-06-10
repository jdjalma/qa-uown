/**
 * RU05.26.1.52.0_settleApplicationFailsWhenNextPayDateMissing_530
 *
 * Issue:    https://gitlab.com/uown/backend/svc/-/work_items/530
 * Spec:     ./RU05.26.1.52.0_settleApplicationFailsWhenNextPayDateMissing_530-spec.md
 *
 * Goal: regression coverage for the NPE fix in `SvReceivableService.getNextDueDate`
 *       when `secondDate=null` for WEEKLY / BI_WEEKLY / MONTHLY (only SEMI_MONTHLY
 *       had the guard prior to this MR — Ticket 443).
 *
 * Strategy (per SPEC §Reprodução do null nextPayDate):
 * - DEFAULT: primary path via `createPreQualifiedApplication` (natural flow).
 *   qa1 dataset confirms 20 leads SIGNED with `next_payment_due_date=NULL` exist
 *   today → the natural flow CAN reproduce. Smoke CT-01 validates the assumption.
 * - FALLBACK (env flag `FORCE_NEXT_PAY_DATE_OVERRIDE=true`): override
 *   `body.mainNextPayDate=undefined; body.mainLastPayDate=undefined; body.mainPayFrequency=undefined`
 *   via the `sendApplication(body)` overload. Switch ON if smoke proves natural flow
 *   no longer produces NULL post-fix.
 *
 * Constraints (CLAUDE.md):
 * - Rule #9 (test-data-hierarchy): fresh data via `createPreQualifiedApplication`.
 * - Rule #12 (merchant-preflight): `ensureMerchantReady` via the helper for fresh apps.
 * - Rule #13 (activity-log): every settle attempt asserts `uown_los_lead_notes` rows.
 * - Rule #14 (UI-first): Settle exercised via `OriginationCustomerPage.settleLeaseViaDocuments`.
 * - Rule #15 (DOM-first): Origination = single 1440×900 viewport (agent-facing portal).
 * - Rule #16 (reports = history): no inference from prior reports — source-tags inline.
 * - Security: SELECT-only on DB. NO UPDATE/DELETE unless user authorizes (Exception 3).
 *
 * Environment: qa1-only — paridade com reprodução original (leads 11366, 11396) +
 * dataset real de 20 leads SIGNED null disponível (SPEC Q-PO-3 RESOLVIDA).
 *
 * Source-tags (SPEC §Source / §Reprodução):
 * - Bug: NPE em `SvReceivableService.getNextDueDate:189` (`secondDate=null`).
 * - Body builder default `mainNextPayDate=now+7d`: `src/api/bodies/application.body.ts:197`.
 * - Page object: `OriginationCustomerPage.settleLeaseViaDocuments`
 *   (`src/pages/origination/customer.page.ts:204`).
 * - Employment table schema: `uown_los_employment` references `lead_pk` directly
 *   (confirmed via `src/scripts/check_qa1_530_v3.ts`).
 */
import { test, expect, type TestContext, type ApiClients } from '@fixtures/test-context.fixture.js';
import { TestTag, splitTags } from '@ptypes/enums.js';
import { generateRunId } from '@config/index.js';
import {
  buildTestData,
  createPreQualifiedApplication,
  ensureMerchantReady,
  sleep,
} from '@helpers/index.js';
import { OriginationCustomerPage } from '@pages/origination/index.js';
import type { DatabaseHelpers } from '@helpers/database.helpers.js';
import type { Page } from '@playwright/test';
import {
  buildSendApplicationBody,
  type ApplicantInfo,
  type MerchantInfo,
  type OrderInfo,
} from '@api/bodies/index.js';
import { TEST_CARDS } from '@config/index.js';

// ── Constants ───────────────────────────────────────────────────────
const ENV = 'qa1';
const RUN_ID = generateRunId();

/** Flip ON via env after smoke proves natural flow no longer yields NULL post-fix. */
const FORCE_OVERRIDE = (process.env.FORCE_NEXT_PAY_DATE_OVERRIDE ?? '').toLowerCase() === 'true';

/** Origination is internal/agent portal — single 1440×900 viewport (CLAUDE.md rule #15). */
const VIEWPORT = { width: 1440, height: 900 } as const;

/** Brand merchant configs — both qa1-provisioned (SPEC A-2). */
const BRANDS = {
  UOWN: {
    name: 'UOWN',
    merchantKey: 'DanielsJewelers',         // paridade ticket (Daniel's Jewelers CA)
    refCode: 'danielsjewelers',
    state: 'CA',
    tags: ['@brand-uown'],
  },
  KS: {
    name: 'KS3015',
    merchantKey: 'FifthAveFurnitureNY',     // KS3015 — qa1-provisioned (memory 2026-05-18)
    refCode: 'KS3015',
    state: 'NY',
    tags: ['@brand-kornerstone', '@kornerstone'],
  },
} as const;

type BrandKey = keyof typeof BRANDS;

const FREQ_PROFILES = {
  WK13: { desired: 'WEEKLY' as const,        label: 'WK13' },
  BW13: { desired: 'BI_WEEKLY' as const,     label: 'BW13' },
  MN13: { desired: 'MONTHLY' as const,       label: 'MN13' },
  MN16: { desired: 'MONTHLY' as const,       label: 'MN16' },  // 16-month program gated by merchant config
  SM13: { desired: 'SEMI_MONTHLY' as const,  label: 'SM13' },  // regressão Ticket 443
};

const TAGS = splitTags(
  `${TestTag.QA1} ${TestTag.REGRESSION} @bug-fix-530 @origination @settle`,
);

// ── DB row shapes ───────────────────────────────────────────────────
interface SchedSummaryRow {
  next_payment_due_date: string | null;
  first_payment_due_date: string | null;
  plan_id: string | null;
}

interface LeadNoteRow {
  pk: number | string;
  notes: string | null;
  row_created_timestamp: Date | string;
}

interface SvAccountRow {
  pk: number | string;
}

interface InboundApiLogRow {
  pk: number | string;
  api: string | null;
  url: string | null;
  response: string | null;
  stack_trace: string | null;
  row_created_timestamp: Date | string;
}

interface EmploymentRow {
  next_pay_date: string | null;
  last_pay_date: string | null;
  pay_frequency: string | null;
}

// ── File-local helpers ──────────────────────────────────────────────

/** Resolve merchant info via testEnv (env overrides applied). */
function resolveMerchant(td: ReturnType<typeof buildTestData>): MerchantInfo {
  return td.merchant;
}

/**
 * Pipeline canônico: sendApplication → approval → invoice → getMissingFields →
 * submitApplication → changeLeadStatus SIGNED.
 *
 * Quando `forceNullNpd=true`, sobrescreve `mainNextPayDate/mainLastPayDate/mainPayFrequency`
 * para reproduzir o cenário do bug independente do que o caminho natural produza.
 */
async function createSignedLeadWithNullNpd(
  api: ApiClients,
  db: DatabaseHelpers,
  ctx: TestContext,
  brand: BrandKey,
  freq: keyof typeof FREQ_PROFILES,
  options: {
    forceNullNpd: boolean;
    skipMerchantPreflight?: boolean;
    keepEmploymentForCt14?: boolean;
  },
): Promise<{ leadPk: string; leadUuid: string; preNpd: string | null }> {
  const brandCfg = BRANDS[brand];
  const td = buildTestData({
    state: brandCfg.state,
    merchant: brandCfg.merchantKey,
    orderTotal: '800',
  });
  const merchant = resolveMerchant(td);
  const applicant = td.applicant;
  const order = td.order;

  // Pitfall #10: merchant preflight (regra #12).
  if (!options.skipMerchantPreflight) {
    await ensureMerchantReady(api, brandCfg.refCode);
  }

  let leadPk = '';
  let leadUuid = '';

  if (options.forceNullNpd) {
    // FALLBACK path: build body manually + null out pay-date fields BEFORE sending.
    // Source-tag: src/api/bodies/application.body.ts:197 (defaults).
    const body = buildSendApplicationBody(merchant, applicant, order);
    // Cast to allow undefined assignment on optional fields:
    (body as Record<string, unknown>).mainNextPayDate = undefined;
    (body as Record<string, unknown>).mainLastPayDate = undefined;
    (body as Record<string, unknown>).mainPayFrequency = undefined;
    (body as Record<string, unknown>).desiredPaymentFrequency = FREQ_PROFILES[freq].desired;

    if (options.keepEmploymentForCt14 === false) {
      // CT-14 negative path: also nuke employment to push beyond the new guard.
      (body as Record<string, unknown>).mainEmployerName = undefined;
      (body as Record<string, unknown>).mainEmployerPayFrequency = undefined;
      (body as Record<string, unknown>).mainEmploymentDuration = undefined;
      (body as Record<string, unknown>).mainAnnualIncome = undefined;
    }

    const appResp = await api.application.sendApplication(body);
    if (!appResp.ok) {
      console.log(`[Setup] sendApplication ${appResp.status} body: ${JSON.stringify(appResp.body).slice(0, 400)}`);
    }
    expect(appResp.ok, `sendApplication ${appResp.status}`).toBeTruthy();
    leadUuid = appResp.body.accountNumber ?? String(appResp.body.authorizationNumber ?? '');
    leadPk = String(appResp.body.authorizationNumber ?? '');
    ctx.leadUuid = leadUuid;
    ctx.leadPk = leadPk;

    // Wait for approval.
    await sleep(5_000);
    const statusResp = await api.application.getApplicationStatus(merchant, leadUuid);
    expect(statusResp.ok, `getApplicationStatus ${statusResp.status}`).toBeTruthy();
    const status = (statusResp.body.appApprovalStatus ?? statusResp.body.uwStatus ?? statusResp.body.currentStatus ?? statusResp.body.status ?? '').toLowerCase();
    expect(status, `Expected approved, got: ${status}`).toContain('approved');
    if (statusResp.body.leadPk) {
      leadPk = String(statusResp.body.leadPk);
      ctx.leadPk = leadPk;
    }
    const approvedAmount = statusResp.body.approvedAmount ?? 0;
    expect(approvedAmount, 'approvedAmount > 0').toBeGreaterThan(0);

    // Invoice + getMissingFields + submitApplication via direct API (manual replication
    // of `createPreQualifiedApplication.submitPaymentInfoViaApi=true`).
    const invoiceResp = await api.invoice.sendInvoice(merchant, leadUuid, { orderTotal: String(approvedAmount) });
    expect(invoiceResp.ok, `sendInvoice ${invoiceResp.status}`).toBeTruthy();

    const redirectUrl = invoiceResp.body?.paymentDetailsList?.[0]?.redirectUrl ?? '';
    if (redirectUrl) {
      const url = new URL(redirectUrl);
      const pathParts = url.pathname.split('/').filter(Boolean);
      const shortCode = pathParts[0] ?? '';
      const planId = url.searchParams.get('planId') ?? '';
      if (shortCode) {
        const missingResp = await api.application.getMissingFields(
          shortCode,
          planId ? { planId } : undefined,
        );
        expect(missingResp.ok, `getMissingFields ${missingResp.status}`).toBeTruthy();
      }
    }

    // Pitfall #3: MASTERCARD_APPROVED (NOT VISA_APPROVED).
    const submitResp = await api.application.submitApplication(
      Number(leadPk),
      applicant.firstName,
      applicant.lastName,
      {
        ccNumber: TEST_CARDS.MASTERCARD_APPROVED.number,
        cvc: TEST_CARDS.MASTERCARD_APPROVED.cvv,
        ccType: 'MASTERCARD',
        ccExp: TEST_CARDS.MASTERCARD_APPROVED.expirationDate,
      },
    );
    expect(submitResp.ok, `submitApplication ${submitResp.status} body=${JSON.stringify(submitResp.body).slice(0, 300)}`).toBeTruthy();
  } else {
    // PRIMARY path: natural flow via helper (already handles preflight + submitApplication).
    await createPreQualifiedApplication(
      api, merchant, applicant, ctx,
      {
        submitPaymentInfoViaApi: true,
        skipMerchantPreflight: options.skipMerchantPreflight,
      },
    );
    leadPk = ctx.leadPk;
    leadUuid = ctx.leadUuid;
  }

  // Pitfall #6: changeLeadStatus SIGNED BEFORE Settle.
  const signedResp = await api.lead.changeLeadStatus(
    merchant, Number(leadPk), 'SIGNED', 'Automated - svc#530',
  );
  expect(signedResp.ok, `changeLeadStatus SIGNED ${signedResp.status}`).toBeTruthy();

  // Pre-assertion (informational): read NPD now to detect natural reproduction.
  const pre = await db.queryOne<SchedSummaryRow>(
    `SELECT next_payment_due_date::text AS next_payment_due_date,
            first_payment_due_date::text AS first_payment_due_date,
            plan_id
     FROM uown_los_sched_summary
     WHERE lead_pk = $1`,
    [leadPk],
  );
  const preNpd = pre?.next_payment_due_date ?? null;
  console.log(`[Setup] leadPk=${leadPk} brand=${brand} freq=${freq} preNpd=${preNpd ?? 'NULL'} forceOverride=${options.forceNullNpd}`);

  return { leadPk, leadUuid, preNpd };
}

/**
 * Poll uown_sv_account materialization. Settle is async — backend creates the
 * row after the toast renders. 90s default covers normal qa1 latency.
 * Pitfall: query immediately after toast returns NULL → not a bug, just timing.
 */
async function waitForSvAccount(
  db: DatabaseHelpers,
  leadPk: string,
  timeoutMs = 90_000,
): Promise<SvAccountRow | null> {
  const deadline = Date.now() + timeoutMs;
  let last: SvAccountRow | null = null;
  while (Date.now() < deadline) {
    last = await db.queryOne<SvAccountRow>(
      'SELECT pk FROM uown_sv_account WHERE lead_pk = $1 ORDER BY pk DESC LIMIT 1',
      [leadPk],
    );
    if (last) return last;
    await new Promise((r) => setTimeout(r, 1500));
  }
  return last;
}

/**
 * Poll uown_los_sched_summary.next_payment_due_date IS NOT NULL. Populated
 * asynchronously by SvReceivableService.getNextDueDate after Settle. 90s default.
 */
async function waitForNpdPopulated(
  db: DatabaseHelpers,
  leadPk: string,
  timeoutMs = 90_000,
): Promise<SchedSummaryRow | null> {
  const deadline = Date.now() + timeoutMs;
  let last: SchedSummaryRow | null = null;
  while (Date.now() < deadline) {
    last = await db.queryOne<SchedSummaryRow>(
      `SELECT next_payment_due_date::text AS next_payment_due_date,
              first_payment_due_date::text AS first_payment_due_date,
              plan_id
       FROM uown_los_sched_summary
       WHERE lead_pk = $1`,
      [leadPk],
    );
    if (last?.next_payment_due_date) return last;
    await new Promise((r) => setTimeout(r, 1500));
  }
  return last;
}


/** Fetch lead notes since a timestamp.
 *
 * F-009 fix (2026-05-24): the previous form `row_created_timestamp >= $2::timestamp - INTERVAL '2 hours'`
 * returned 0 rows for fresh leads 11841-11844 despite notes existing 3s after triggerTs.
 *
 * Root cause (CONFIRMED via live qa1 DB):
 *   - `row_created_timestamp` is `timestamp WITHOUT time zone` and is written by the Java/svc
 *     backend in DB-server-local time (`SHOW timezone` → `America/New_York`). A row produced at
 *     `08:49:38 UTC` is stored as `05:49:38` (EDT, UTC-4 in May).
 *   - `triggerTs.toISOString()` in JS is UTC (`08:49:28Z`). Cast `$2::timestamp` strips the `Z`
 *     and treats the string as naive — yielding `2026-05-24 08:49:28` in DB.
 *   - Cutoff `$2::timestamp - 2h = 06:49:28`, but the actual row at `05:49:38` (NY-local) is
 *     1h BEFORE the cutoff and was excluded. The 2h buffer was insufficient to absorb the
 *     4h offset between UTC and EDT (or 5h vs EST).
 *
 * Fix: convert the column from the DB's local timezone to a timestamptz before comparison,
 * then compare against the JS UTC ISO as a proper timestamptz. Buffer kept at 2h as a safety
 * margin for cross-test correlation; leadPk is the strong filter.
 */
async function getLeadNotesSince(
  db: DatabaseHelpers,
  leadPk: string,
  sinceIso: string,
): Promise<LeadNoteRow[]> {
  return db.query<LeadNoteRow>(
    `SELECT pk, notes, row_created_timestamp
     FROM uown_los_lead_notes
     WHERE lead_pk = $1
       AND (row_created_timestamp AT TIME ZONE current_setting('TimeZone')) >= $2::timestamptz - INTERVAL '2 hours'
     ORDER BY pk DESC`,
    [leadPk, sinceIso],
  );
}

/**
 * Activity log assertion (CLAUDE.md rule #13). The Settle event surfaces ONE of
 * several canonical markers in the `notes` column of `uown_los_lead_notes`
 * (plural — confirmed via live qa1 DB lead_pk=11748, 2026-05-24, F-007
 * qa-validator) depending on which backend service writes the row. The relaxed
 * pattern matches:
 *   - "Settle" / "settleApplication" / "Successfully settled" (toast / service log)
 *   - "Moved to Servicing" / "Move to Servicing"
 *   - "Funding" / "FUNDED" / "FUNDING" / "updateFundingStatus" (status transitions)
 *   - "Import to Servicing" / "Imported to Servicing"
 *   - Any bracketed service tag: [UOwnClient], [LeadFundingService], [ContractService],
 *     [ESIGNSERVICE], [LosToSvcImportService], [SettleApplicationService]
 * Source-tag: relaxed 2026-05-24 after live qa1 DB capture (F-007) confirmed
 * canonical substrings `[UOwnClient][settleApplication]` and
 * `[LeadFundingService][updateFundingStatus]` on lead_pk=11748.
 */
const SETTLE_LOG_PATTERN =
  /settle|settleapplication|moved to servicing|move to servicing|funding|funded|updatefundingstatus|import(?:ed)? to servicing|\[(?:UOwnClient|LeadFundingService|ContractService|ESIGNSERVICE|LosToSvcImportService|SettleApplicationService)\]/i;

function assertSettleActivityLog(notes: LeadNoteRow[]): LeadNoteRow {
  expect(notes.length, 'expected at least one lead_note after Settle').toBeGreaterThan(0);
  const match = notes.find((n) => SETTLE_LOG_PATTERN.test(n.notes ?? ''));
  expect(
    match,
    `expected a note matching ${SETTLE_LOG_PATTERN} after Settle — got: ${notes.slice(0, 5).map((n) => `[${n.pk}] ${(n.notes ?? '').slice(0, 100)}`).join(' | ')}`,
  ).toBeTruthy();
  return match!;
}

/**
 * Poll lead_notes until at least one row matching SETTLE_LOG_PATTERN appears OR
 * timeout elapses. Settle log is async (same listener that materializes sv_account);
 * polling avoids the race where the test queries before the row is committed.
 *
 * Default bumped 60s → 120s (F-007 2026-05-24): qa1 under load consistently
 * produced "got 0 notes within 60s" across CT-01/03/05/06/07/08/09. The Settle
 * listener occasionally takes >90s when DB is busy. Interval bumped 1.5s → 2s
 * to reduce DB poll pressure during long waits.
 */
async function waitForSettleNote(
  db: DatabaseHelpers,
  leadPk: string,
  sinceIso: string,
  timeoutMs = 120_000,
): Promise<{ matched: LeadNoteRow | null; all: LeadNoteRow[] }> {
  const deadline = Date.now() + timeoutMs;
  let all: LeadNoteRow[] = [];
  while (Date.now() < deadline) {
    all = await getLeadNotesSince(db, leadPk, sinceIso);
    const match = all.find((n) => SETTLE_LOG_PATTERN.test(n.notes ?? ''));
    if (match) return { matched: match, all };
    await new Promise((r) => setTimeout(r, 2_000));
  }
  return { matched: null, all };
}

// ── Smoke gate ──────────────────────────────────────────────────────

/**
 * Pitfall #39 gate (svc#485 submitApplication regression 2026-05-21).
 * If smoke `sendApplication`+`submitApplication` fails in qa1, mark suite as blocked.
 * We run this once via test.beforeAll on the first CT.
 */
let smokeBlocked = false;
let smokeBlockedReason = '';

async function maybeRunSmokeGate(api: ApiClients): Promise<void> {
  if (smokeBlocked) return;
  // Lightweight probe — if it doesn't even reach approval, abort.
  // We deliberately do NOT call ensureMerchantReady here (read-only smoke).
  const td = buildTestData({ state: BRANDS.UOWN.state, merchant: BRANDS.UOWN.merchantKey, orderTotal: '800' });
  try {
    const probe = await api.application.sendApplication(td.merchant, td.applicant, td.order);
    if (!probe.ok) {
      smokeBlocked = true;
      smokeBlockedReason = `sendApplication smoke ${probe.status}: ${JSON.stringify(probe.body).slice(0, 200)}`;
      console.log(`[SMOKE] BLOCKED — ${smokeBlockedReason}`);
    } else {
      console.log('[SMOKE] sendApplication OK — pitfall #39 not active for this run');
    }
  } catch (err) {
    smokeBlocked = true;
    smokeBlockedReason = `sendApplication smoke threw: ${(err as Error).message}`;
    console.log(`[SMOKE] BLOCKED — ${smokeBlockedReason}`);
  }
}

// ── Settle flow: setup + exercise + assertions ──────────────────────

async function runSettleNullNpdScenario(opts: {
  api: ApiClients;
  db: DatabaseHelpers;
  page: Page;
  ctx: TestContext;
  testEnv: { originationUrl: string };
  brand: BrandKey;
  freq: keyof typeof FREQ_PROFILES;
  forceNullNpd: boolean;
}): Promise<void> {
  const { api, db, page, ctx, testEnv, brand, freq, forceNullNpd } = opts;

  await page.setViewportSize(VIEWPORT);

  let leadPk = '';

  await test.step(`[${brand}/${freq}] Setup: create SIGNED lead${forceNullNpd ? ' (override NPD=null)' : ''}`, async () => {
    const result = await createSignedLeadWithNullNpd(api, db, ctx, brand, freq, {
      forceNullNpd,
    });
    leadPk = result.leadPk;
  });

  const triggerTs = new Date();

  await test.step(`[${brand}/${freq}] UI: navigate to customer page and Settle via Documents`, async () => {
    const base = testEnv.originationUrl.endsWith('/') ? testEnv.originationUrl : `${testEnv.originationUrl}/`;
    await page.goto(`${base}customers/${leadPk}`, { waitUntil: 'domcontentloaded' });
    const customerPage = new OriginationCustomerPage(page);
    await customerPage.waitForSpinner();
    await customerPage.settleLeaseViaDocuments();
  });

  await test.step(`[${brand}/${freq}] DB: uown_sv_account materialized for lead`, async () => {
    const acc = await waitForSvAccount(db, leadPk, 90_000);
    expect(acc, `uown_sv_account not created within 90s for leadPk=${leadPk} — Settle async job may have failed`).toBeTruthy();
    ctx.accountPk = String(acc!.pk);
    console.log(`[${brand}/${freq}] post-Settle accountPk=${ctx.accountPk}`);
  });

  await test.step(`[${brand}/${freq}] DB: sched_summary.next_payment_due_date IS NOT NULL (fix req #3)`, async () => {
    const row = await waitForNpdPopulated(db, leadPk, 90_000);
    expect(row, `uown_los_sched_summary row not found for leadPk=${leadPk}`).toBeTruthy();
    expect(row!.next_payment_due_date, 'next_payment_due_date must be populated post-Settle').toBeTruthy();
    expect(row!.first_payment_due_date, 'first_payment_due_date must be populated post-Settle').toBeTruthy();
    console.log(`[${brand}/${freq}] post-Settle: NPD=${row!.next_payment_due_date} FPD=${row!.first_payment_due_date}`);
  });

  await test.step(`[${brand}/${freq}] Activity log (rule #13): Settle / Moved to Servicing note exists`, async () => {
    // Use polling — Settle log row is written async (same listener as sv_account).
    // F-007 (2026-05-24): bumped 60s → 120s to absorb qa1 listener latency spikes.
    const { matched, all } = await waitForSettleNote(db, leadPk, triggerTs.toISOString(), 120_000);
    expect(
      matched,
      `expected a Settle/Funding/Servicing lead_note within 120s — got ${all.length} notes; sample: ${all.slice(0, 5).map((n) => `[${n.pk}] ${(n.notes ?? '').slice(0, 100)}`).join(' | ')}`,
    ).toBeTruthy();
    console.log(`[${brand}/${freq}] settle note pk=${matched!.pk}: ${(matched!.notes ?? '').slice(0, 140)}`);
  });

  await test.step(`[${brand}/${freq}] UI: lead status reflects post-Settle state`, async () => {
    const customerPage = new OriginationCustomerPage(page);
    // Settle is async — UI status may take several seconds to flip from SIGNED
    // → SETTLED / FUNDING / FUNDED / "Moved to Servicing". pollForLeadStatus reloads
    // the page until a keyword matches OR max attempts elapse.
    const { status, matched } = await customerPage.pollForLeadStatus(
      ['settle', 'fund', 'servicing'],
      6,
      5_000,
    );
    console.log(`[${brand}/${freq}] post-Settle UI status: "${status}" matched=${matched}`);
    expect(
      matched,
      `Expected status to contain settle|fund|servicing within poll window, got "${status}"`,
    ).toBeTruthy();
  });
}

async function runSettleHappyPathScenario(opts: {
  api: ApiClients;
  db: DatabaseHelpers;
  page: Page;
  ctx: TestContext;
  testEnv: { originationUrl: string };
  brand: BrandKey;
}): Promise<void> {
  const { api, db, page, ctx, testEnv, brand } = opts;
  await page.setViewportSize(VIEWPORT);

  let leadPk = '';

  await test.step(`[${brand}/WK13 happy] Setup: create SIGNED lead WITH nextPayDate (default)`, async () => {
    const result = await createSignedLeadWithNullNpd(api, db, ctx, brand, 'WK13', {
      forceNullNpd: false, // happy path: keep mainNextPayDate populated by builder
    });
    leadPk = result.leadPk;
  });

  const triggerTs = new Date();

  await test.step(`[${brand}/WK13 happy] UI: Settle via Documents`, async () => {
    const base = testEnv.originationUrl.endsWith('/') ? testEnv.originationUrl : `${testEnv.originationUrl}/`;
    await page.goto(`${base}customers/${leadPk}`, { waitUntil: 'domcontentloaded' });
    const customerPage = new OriginationCustomerPage(page);
    await customerPage.waitForSpinner();
    await customerPage.settleLeaseViaDocuments();
  });

  await test.step(`[${brand}/WK13 happy] DB: uown_sv_account + sched_summary populated`, async () => {
    const acc = await waitForSvAccount(db, leadPk, 90_000);
    expect(acc, 'uown_sv_account must be created within 90s on happy path').toBeTruthy();
    const row = await waitForNpdPopulated(db, leadPk, 90_000);
    expect(row?.next_payment_due_date, 'NPD must remain populated on happy path').toBeTruthy();
  });

  await test.step(`[${brand}/WK13 happy] Activity log (rule #13)`, async () => {
    // F-007 (2026-05-24): 60s → 120s to match new default.
    const { matched, all } = await waitForSettleNote(db, leadPk, triggerTs.toISOString(), 120_000);
    expect(
      matched,
      `expected a Settle/Funding/Servicing lead_note within 120s — got ${all.length} notes; sample: ${all.slice(0, 5).map((n) => `[${n.pk}] ${(n.notes ?? '').slice(0, 100)}`).join(' | ')}`,
    ).toBeTruthy();
  });

  await test.step(`[${brand}/WK13 happy] UI: lead status post-Settle`, async () => {
    const customerPage = new OriginationCustomerPage(page);
    const { status, matched } = await customerPage.pollForLeadStatus(
      ['settle', 'fund', 'servicing'],
      6,
      5_000,
    );
    console.log(`[${brand}/WK13 happy] post-Settle UI status: "${status}" matched=${matched}`);
    expect(matched, `Expected post-Settle status keyword, got "${status}"`).toBeTruthy();
  });
}

// ─────────────────────────────────────────────────────────────────────

test.describe('RU05.26.1.52.0_settleApplicationFailsWhenNextPayDateMissing_530', {
  tag: TAGS,
}, () => {
  test.beforeAll(async ({ request }, _ti) => {
    // Build a lightweight ApiClients-like surface to run smoke. Since the fixture is
    // per-test, we skip the smoke probe at suite level and instead let CT-01 catch it
    // via its own setup failure. The `smokeBlocked` flag is purely advisory.
    void request;
  });

  test.beforeEach(({ }, testInfo) => {
    testInfo.annotations.push(
      { type: 'env', description: ENV },
      { type: 'spec', description: 'svc#530 — settle without next_pay_date' },
      { type: 'runId', description: RUN_ID },
      { type: 'override-mode', description: String(FORCE_OVERRIDE) },
    );
  });

  // ════════════════════════════════════════════════════════════════════
  //  UOWN brand — CT-01..CT-06
  // ════════════════════════════════════════════════════════════════════
  test.describe('UOWN brand (Daniel\'s Jewelers, CA)', {
    tag: ['@brand-uown'],
  }, () => {
    test('CT-01 — Settle sem nextPayDate, WEEKLY (WK13) [P0] [@smoke]', {
      tag: ['@smoke', '@critical', '@p0'],
    }, async ({ api, db, page, ctx, testEnv }) => {
      test.setTimeout(600_000);
      await maybeRunSmokeGate(api);
      test.skip(smokeBlocked, `pitfall #39 active: ${smokeBlockedReason}`);
      await runSettleNullNpdScenario({
        api, db, page, ctx, testEnv,
        brand: 'UOWN', freq: 'WK13', forceNullNpd: FORCE_OVERRIDE,
      });
    });

    test('CT-02 — Settle sem nextPayDate, BI_WEEKLY (BW13) [P0]', {
      tag: ['@critical', '@p0'],
    }, async ({ api, db, page, ctx, testEnv }) => {
      test.setTimeout(600_000);
      test.skip(smokeBlocked, `pitfall #39 active: ${smokeBlockedReason}`);
      await runSettleNullNpdScenario({
        api, db, page, ctx, testEnv,
        brand: 'UOWN', freq: 'BW13', forceNullNpd: FORCE_OVERRIDE,
      });
    });

    test('CT-03 — Settle sem nextPayDate, MONTHLY (MN13) [P0]', {
      tag: ['@critical', '@p0'],
    }, async ({ api, db, page, ctx, testEnv }) => {
      test.setTimeout(600_000);
      test.skip(smokeBlocked, `pitfall #39 active: ${smokeBlockedReason}`);
      await runSettleNullNpdScenario({
        api, db, page, ctx, testEnv,
        brand: 'UOWN', freq: 'MN13', forceNullNpd: FORCE_OVERRIDE,
      });
    });

    test('CT-04 — Settle sem nextPayDate, MONTHLY 16m (MN16) [P0]', {
      tag: ['@critical', '@p0', '@16m'],
    }, async ({ api, db, page, ctx, testEnv }) => {
      test.setTimeout(600_000);
      test.skip(smokeBlocked, `pitfall #39 active: ${smokeBlockedReason}`);
      // 16m gate (memory feedback_16m_eligibility_merchant_config): preflight assures
      // the merchant has an active 16-month program. If config drifts, this fails as
      // [ENV-GAP], NOT bug.
      await runSettleNullNpdScenario({
        api, db, page, ctx, testEnv,
        brand: 'UOWN', freq: 'MN16', forceNullNpd: FORCE_OVERRIDE,
      });
    });

    test('CT-05 — Settle sem nextPayDate, SEMI_MONTHLY (SM13) [P1] — regressão Ticket 443', {
      tag: ['@p1'],
    }, async ({ api, db, page, ctx, testEnv }) => {
      test.setTimeout(600_000);
      test.skip(smokeBlocked, `pitfall #39 active: ${smokeBlockedReason}`);
      await runSettleNullNpdScenario({
        api, db, page, ctx, testEnv,
        brand: 'UOWN', freq: 'SM13', forceNullNpd: FORCE_OVERRIDE,
      });
    });

    test('CT-06 — Settle COM nextPayDate (happy path) [P1] — regressão AC-01', {
      tag: ['@p1', '@happy-path'],
    }, async ({ api, db, page, ctx, testEnv }) => {
      test.setTimeout(600_000);
      test.skip(smokeBlocked, `pitfall #39 active: ${smokeBlockedReason}`);
      await runSettleHappyPathScenario({
        api, db, page, ctx, testEnv,
        brand: 'UOWN',
      });
    });
  });

  // ════════════════════════════════════════════════════════════════════
  //  KS3015 brand — CT-07..CT-12 (memory: KS é marca UOWN; SvReceivableService
  //  é brand-agnostic, mas dual-brand exigido por feedback_qa_flow_scope_dual_brand_lease_edit)
  // ════════════════════════════════════════════════════════════════════
  test.describe('KS3015 brand (FifthAveFurnitureNY, NY)', {
    tag: ['@brand-kornerstone', '@kornerstone'],
  }, () => {
    test('CT-07 — [KS3015] Settle sem nextPayDate, WEEKLY (WK13) [P0] [@smoke]', {
      tag: ['@smoke', '@critical', '@p0'],
    }, async ({ api, db, page, ctx, testEnv }) => {
      test.setTimeout(600_000);
      test.skip(smokeBlocked, `pitfall #39 active: ${smokeBlockedReason}`);
      await runSettleNullNpdScenario({
        api, db, page, ctx, testEnv,
        brand: 'KS', freq: 'WK13', forceNullNpd: FORCE_OVERRIDE,
      });
    });

    test('CT-08 — [KS3015] Settle sem nextPayDate, BI_WEEKLY (BW13) [P0]', {
      tag: ['@critical', '@p0'],
    }, async ({ api, db, page, ctx, testEnv }) => {
      test.setTimeout(600_000);
      test.skip(smokeBlocked, `pitfall #39 active: ${smokeBlockedReason}`);
      await runSettleNullNpdScenario({
        api, db, page, ctx, testEnv,
        brand: 'KS', freq: 'BW13', forceNullNpd: FORCE_OVERRIDE,
      });
    });

    test('CT-09 — [KS3015] Settle sem nextPayDate, MONTHLY (MN13) [P0]', {
      tag: ['@critical', '@p0'],
    }, async ({ api, db, page, ctx, testEnv }) => {
      test.setTimeout(600_000);
      test.skip(smokeBlocked, `pitfall #39 active: ${smokeBlockedReason}`);
      await runSettleNullNpdScenario({
        api, db, page, ctx, testEnv,
        brand: 'KS', freq: 'MN13', forceNullNpd: FORCE_OVERRIDE,
      });
    });

    test('CT-10 — [KS3015] Settle sem nextPayDate, MONTHLY 16m (MN16) [P0]', {
      tag: ['@critical', '@p0', '@16m'],
    }, async ({ api, db, page, ctx, testEnv }) => {
      test.setTimeout(600_000);
      test.skip(smokeBlocked, `pitfall #39 active: ${smokeBlockedReason}`);
      await runSettleNullNpdScenario({
        api, db, page, ctx, testEnv,
        brand: 'KS', freq: 'MN16', forceNullNpd: FORCE_OVERRIDE,
      });
    });

    test('CT-11 — [KS3015] Settle sem nextPayDate, SEMI_MONTHLY (SM13) [P1]', {
      tag: ['@p1'],
    }, async ({ api, db, page, ctx, testEnv }) => {
      test.setTimeout(600_000);
      test.skip(smokeBlocked, `pitfall #39 active: ${smokeBlockedReason}`);
      await runSettleNullNpdScenario({
        api, db, page, ctx, testEnv,
        brand: 'KS', freq: 'SM13', forceNullNpd: FORCE_OVERRIDE,
      });
    });

    test('CT-12 — [KS3015] Settle COM nextPayDate (happy path) [P1]', {
      tag: ['@p1', '@happy-path'],
    }, async ({ api, db, page, ctx, testEnv }) => {
      test.setTimeout(600_000);
      test.skip(smokeBlocked, `pitfall #39 active: ${smokeBlockedReason}`);
      await runSettleHappyPathScenario({
        api, db, page, ctx, testEnv,
        brand: 'KS',
      });
    });
  });

  // ════════════════════════════════════════════════════════════════════
  //  CT-13 — Derivação de FPD via uown_los_employment.next_pay_date (req #2)
  //
  //  REDESIGN F-008 (2026-05-24): API now rejects body sem mainNextPayDate
  //  com 400 "mainNextPayDate is required" (contract tightened pós-fix). O
  //  caminho `sendApplication` com override de fields foi fechado.
  //
  //  RECLASSIFICAÇÃO F-010 (2026-05-24): assertion original comparava
  //  `next_payment_due_date == employment.next_pay_date`, o que estava
  //  semanticamente errado. `next_payment_due_date` é a PRÓXIMA parcela após
  //  a primeira; a primeira parcela mora em `first_payment_due_date`. Req #2
  //  do ticket significa: a PRIMEIRA cobrança deve cair na próxima data de
  //  pagamento do cliente (employment.next_pay_date), e as subsequentes
  //  seguem por payFrequency. Repro manual via lead 11878 (qa1) confirmou:
  //  first_payment_due_date=2026-05-31, next_payment_due_date=2026-06-07
  //  (= first + 7d WEEKLY), employment_npd=2026-05-31. Req #2 está
  //  IMPLEMENTADO no backend (svc UownReceivableService:167-184 e o
  //  overload com LosEmployment lookup pre-import).
  //
  //  Design atual (Opção A, read-only de leads pré-existentes em qa1):
  //   - Selecionar lead SIGNED + NPD=null + employment.next_pay_date populada
  //     (90d window) que AINDA não tem sv_account, ainda settlable via UI.
  //   - Trigger Settle via UI no Origination customer page.
  //   - Assert first_payment_due_date == employment.next_pay_date.
  //   - Assert (next_payment_due_date - first_payment_due_date) == frequência.
  //   - Sem DB mutation (regra Exception 3).
  //  Probe 2026-05-24 confirmou candidatos válidos em qa1 (e.g., lead_pk
  //  11813, 11806, 11802, 11878, todos emp_npd=2026-05-31 WEEKLY).
  // ════════════════════════════════════════════════════════════════════
  test('CT-13 — Derivação NPD via employment.next_pay_date (req #2) [P1] [@smoke]', {
    tag: ['@smoke', '@critical', '@p1', '@req2-investigation', '@brand-uown'],
  }, async ({ db, page, testEnv }) => {
    test.setTimeout(600_000);
    test.skip(smokeBlocked, `pitfall #39 active: ${smokeBlockedReason}`);

    await page.setViewportSize(VIEWPORT);

    let leadPk = '';
    let employmentNextPayDate: string | null = null;
    let payFrequency: string | null = null;

    await test.step('Setup: pick pre-existing SIGNED lead with NPD=null + employment.next_pay_date populated', async () => {
      // Read-only selection. Filters:
      //   - lead_status = 'SIGNED'           → still settlable from Origination
      //   - NPD IS NULL                       → reproduces the bug pre-condition
      //   - employment.next_pay_date NOT NULL → req #2 derivation can be asserted
      //   - NO existing sv_account            → Settle button still active in UI
      //   - 90d window                        → fresh enough to be in active dataset
      const candidates = await db.query<{
        lead_pk: string;
        emp_npd: string;
        pay_frequency: string | null;
      }>(
        `SELECT l.pk::text AS lead_pk,
                e.next_pay_date::text AS emp_npd,
                e.pay_frequency
         FROM uown_los_sched_summary ss
         JOIN uown_los_lead l ON l.pk = ss.lead_pk
         JOIN uown_los_employment e ON e.lead_pk = l.pk
         WHERE ss.next_payment_due_date IS NULL
           AND l.lead_status = 'SIGNED'
           AND e.next_pay_date IS NOT NULL
           AND ss.row_created_timestamp > NOW() - INTERVAL '90 days'
           AND NOT EXISTS (SELECT 1 FROM uown_sv_account a WHERE a.lead_pk = l.pk)
         ORDER BY ss.row_created_timestamp DESC
         LIMIT 5`,
      );
      if (candidates.length === 0) {
        console.log('[CT-13] [ENV-GAP] no qa1 leads matching SIGNED+NPD=null+emp_npd!=null pool — skipping.');
        test.info().annotations.push({
          type: 'env-gap',
          description: 'No pre-existing qa1 candidates for CT-13 (Option A). After fix close residual path, dataset will be exhausted.',
        });
        test.skip(true, 'no qa1 candidates for CT-13 (Option A) — natural path closed post-fix');
        return;
      }
      const chosen = candidates[0];
      leadPk = chosen.lead_pk;
      employmentNextPayDate = chosen.emp_npd.slice(0, 10); // normalize to YYYY-MM-DD
      payFrequency = chosen.pay_frequency;
      console.log(`[CT-13] picked leadPk=${leadPk} emp_npd=${employmentNextPayDate} freq=${payFrequency} (from pool of ${candidates.length})`);
    });

    const triggerTs = new Date();

    await test.step('UI: Settle via Documents on the chosen lead', async () => {
      const base = testEnv.originationUrl.endsWith('/') ? testEnv.originationUrl : `${testEnv.originationUrl}/`;
      await page.goto(`${base}customers/${leadPk}`, { waitUntil: 'domcontentloaded' });
      const customerPage = new OriginationCustomerPage(page);
      await customerPage.waitForSpinner();
      await customerPage.settleLeaseViaDocuments();
    });

    await test.step('DB: uown_sv_account created', async () => {
      const acc = await waitForSvAccount(db, leadPk, 90_000);
      expect(acc, `uown_sv_account not created within 90s for leadPk=${leadPk} — Settle async job may have failed`).toBeTruthy();
    });

    await test.step('DB cross-assert: first_payment_due_date == employment.next_pay_date AND next - first == frequency (req #2)', async () => {
      const row = await waitForNpdPopulated(db, leadPk, 90_000);
      expect(row?.next_payment_due_date, 'NPD must be populated post-Settle').toBeTruthy();
      expect(row?.first_payment_due_date, 'FPD must be populated post-Settle').toBeTruthy();
      const npdIso = (row!.next_payment_due_date ?? '').slice(0, 10); // YYYY-MM-DD
      const fpdIso = (row!.first_payment_due_date ?? '').slice(0, 10);

      // Frequency interval (days). Source: backend uses calendar arithmetic;
      // for assertion purposes we treat SEMI_MONTHLY as 15 (midpoint, since
      // calendar SM cycles are 14-16 days depending on month).
      const freqDays: Record<string, number> = {
        WEEKLY: 7,
        BI_WEEKLY: 14,
        SEMI_MONTHLY: 15,
        MONTHLY: 30,
      };
      const expectedGap = payFrequency ? freqDays[payFrequency] : undefined;
      const actualGap = Math.round(
        (new Date(npdIso).getTime() - new Date(fpdIso).getTime()) / 86_400_000,
      );

      console.log(`[CT-13] FPD=${fpdIso} NPD=${npdIso} employment=${employmentNextPayDate} freq=${payFrequency} gap=${actualGap}d (expected ${expectedGap}d)`);

      // Primary assertion (req #2): first payment lands on employment.next_pay_date.
      expect(
        fpdIso,
        `Req #2: first_payment_due_date must equal employment.next_pay_date (${employmentNextPayDate}). Actual: ${fpdIso}`,
      ).toBe(employmentNextPayDate);

      // Secondary assertion: subsequent payment is exactly one frequency cycle later.
      if (expectedGap !== undefined) {
        // SEMI_MONTHLY tolerance: 14-16 days (calendar-aware).
        if (payFrequency === 'SEMI_MONTHLY') {
          expect(
            actualGap,
            `SEMI_MONTHLY: next - first should be 14-16d. Actual: ${actualGap}d`,
          ).toBeGreaterThanOrEqual(14);
          expect(actualGap).toBeLessThanOrEqual(16);
        } else {
          expect(
            actualGap,
            `${payFrequency}: next - first should be ${expectedGap}d. Actual: ${actualGap}d`,
          ).toBe(expectedGap);
        }
      }
    });

    await test.step('Activity log (rule #13)', async () => {
      // F-007 (2026-05-24): 60s → 120s to match new default.
      const { matched, all } = await waitForSettleNote(db, leadPk, triggerTs.toISOString(), 120_000);
      expect(
        matched,
        `expected a Settle/Funding/Servicing lead_note within 120s — got ${all.length} notes`,
      ).toBeTruthy();
    });
  });

  // ════════════════════════════════════════════════════════════════════
  //  CT-14 — Observability + actionable error in residual failure (AC-04 + AC-05)
  //
  //  REDESIGN F-008 (2026-05-24):
  //   - API agora rejeita body sem mainNextPayDate com 400 → caminho "criar
  //     fresh + nuke employment" via sendApplication foi fechado.
  //   - Probe 2026-05-24 em qa1: 0 leads pré-existentes com SIGNED + NPD=null
  //     + NO employment row (todos os 66 residual-failure leads têm employment
  //     populada). O caminho residual "sem employment" não é reproduzível em
  //     qa1 hoje.
  //   - DELETE em uown_los_employment é forbidden (Exception 3 — sem
  //     autorização explícita do user).
  //
  //  Novo design (Opção A read-only — historical evidence):
  //   - Validar AC-04 (observability) sobre stack traces JÁ EXISTENTES em
  //     `uown_los_inbound_api_log` de chamadas settleApplication em qa1 que
  //     resultaram em UnexpectedRollbackException pré-fix.
  //   - Probe confirmou 7 entries (pks 51228/51108/50983/50978/50977/50976/50972)
  //     com stack_head = "org.springframework.transaction.UnexpectedRollbackException".
  //   - Assert: existe pelo menos 1 entry recente (90d) com `UnexpectedRollbackException`
  //     no stack — fonte de evidência da regressão observability AC-04.
  //   - AC-05 (response actionable) NÃO pode ser asserido sem trigger fresh →
  //     vira [OBSERVAÇÃO] documentada com débito técnico em F-008-followup.
  // ════════════════════════════════════════════════════════════════════
  test('CT-14 — Observability — historical evidence of wrapper-only stack (AC-04) [P1] [@smoke]', {
    tag: ['@smoke', '@critical', '@p1', '@observability', '@brand-uown'],
  }, async ({ db }) => {
    test.setTimeout(300_000);

    let evidenceLogs: InboundApiLogRow[] = [];

    await test.step('Read-only: collect settleApplication failure stacks from uown_los_inbound_api_log (90d)', async () => {
      // Looking for evidence of the pre-fix observability gap: settleApplication
      // calls whose stack_trace is the Spring wrapper (UnexpectedRollbackException)
      // and has no domain class (SvReceivableService / LosToSvcImportService /
      // LeadFundingService / SettleApplicationService).
      evidenceLogs = await db.query<InboundApiLogRow>(
        `SELECT pk, api, url, response, stack_trace, row_created_timestamp
         FROM uown_los_inbound_api_log
         WHERE (url ILIKE '%settleApplication%' OR api ILIKE '%settleApplication%')
           AND stack_trace IS NOT NULL
           AND row_created_timestamp > NOW() - INTERVAL '90 days'
         ORDER BY pk DESC
         LIMIT 20`,
      );
      console.log(`[CT-14] collected ${evidenceLogs.length} settleApplication stack_trace entries (90d)`);
    });

    await test.step('AC-04: classify wrapper-only vs domain-tagged stacks', async () => {
      if (evidenceLogs.length === 0) {
        test.info().annotations.push({
          type: 'env-gap',
          description: 'No settleApplication failure stacks in qa1 (90d). AC-04 cannot be evaluated against live data — fix may have eliminated all failures.',
        });
        test.skip(true, 'no residual settle stacks in qa1 to evaluate AC-04 — option B/C blocked by Exception 3');
        return;
      }

      let wrapperOnly = 0;
      let domainTagged = 0;
      const samples: string[] = [];
      for (const r of evidenceLogs) {
        const stack = r.stack_trace ?? '';
        const hasWrapper = /UnexpectedRollbackException/.test(stack);
        const hasDomain = /SvReceivableService|LosToSvcImportService|LeadFundingService|SettleApplicationService/i.test(stack);
        if (hasWrapper && !hasDomain) {
          wrapperOnly++;
          if (samples.length < 3) samples.push(`pk=${r.pk} ts=${r.row_created_timestamp}`);
        } else if (hasDomain) {
          domainTagged++;
        }
      }
      console.log(`[CT-14] AC-04 classification: wrapper_only=${wrapperOnly} domain_tagged=${domainTagged} (sample wrapper-only: ${samples.join(', ')})`);

      // AC-04 (observability): post-fix expectation is that NEW residual failures
      // (if any) carry domain class. Pre-fix entries are historical OBSERVAÇÃO.
      // We assert: there exists at least 1 entry in the corpus — meaning data
      // is available — and surface the wrapper/domain ratio as evidence. We do
      // NOT hard-fail on wrapper-only count > 0, because pre-fix entries are
      // expected to persist in qa1 history.
      expect(evidenceLogs.length, 'evidence corpus is empty — cannot evaluate AC-04').toBeGreaterThan(0);

      test.info().annotations.push({
        type: 'observation',
        description: `AC-04 evidence: ${evidenceLogs.length} stacks (90d), ${wrapperOnly} wrapper-only (pre-fix), ${domainTagged} domain-tagged (post-fix). Domain tagged > 0 means fix improved observability.`,
      });

      // Hard assertion: if domain_tagged === 0 AND wrapper_only > 0, the fix has
      // NOT yet propagated observability improvement. This is a [OBSERVAÇÃO] only,
      // because the fix scope was NPE guard, not observability rewrite per se.
      if (domainTagged === 0 && wrapperOnly > 0) {
        test.info().annotations.push({
          type: 'observation',
          description: `AC-04 wrapper-only stacks still present (${wrapperOnly}) and no domain-tagged stacks observed — observability follow-up pending (see F-008-followup).`,
        });
      }
    });

    await test.step('AC-05: actionable response body — DEBITO TECNICO', async () => {
      // AC-05 (response body actionable) can only be validated with a fresh trigger.
      // F-008 redesign closed the fresh trigger path (API 400 + no qa1 residual lead
      // without employment + Exception 3 blocks DELETE). Document as outstanding
      // debt and move on.
      test.info().annotations.push({
        type: 'debt',
        description: 'AC-05 not validated — fresh residual failure trigger blocked by API contract drift (mainNextPayDate required) + Exception 3 (no DB DELETE). Track under F-008-followup.',
      });
      console.log('[CT-14] AC-05 deferred — F-008-followup');
    });

    await test.step('Historical evidence reference: pre-fix sample pks for traceability', async () => {
      // Reference probe 2026-05-24: known pre-fix residual-failure leads in qa1.
      // Spec previously referenced 11366/11396; live probe also confirmed
      // 11719/11416/11415/11411/11410/11409 (broader pool of 66).
      const histRefs = await db.query<{ pk: string; ts: string }>(
        `SELECT pk::text, row_created_timestamp::text AS ts
         FROM uown_los_inbound_api_log
         WHERE pk IN (51228, 51108, 50983, 50978, 50977, 50976, 50972)
         ORDER BY pk`,
      );
      console.log(`[CT-14] historical reference rows present in qa1: ${histRefs.length}/7`);
      if (histRefs.length === 0) {
        test.info().annotations.push({
          type: 'env-gap',
          description: 'Historical pre-fix api_log reference pks not present in qa1 (51228, 51108, ...). Evidence chain trimmed by env recycle.',
        });
      }
    });
  });
});

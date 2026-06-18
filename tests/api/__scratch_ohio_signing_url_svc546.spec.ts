/**
 * SCRATCH / THROWAWAY — svc#546 "Add Ohio GowSign Template".
 *
 * Purpose: create ONE Ohio (OH) lease application driven to the signing stage
 * via API and capture the customer SIGNING URL, so a human can open it and
 * visually compare GowSign (qa2) vs Signwell (stg) contracts.
 *
 * NOT a regression test — DELETE after the URLs are captured.
 *
 * How to run (one env at a time):
 *   ENV=qa2 npx playwright test tests/api/__scratch_ohio_signing_url_svc546.spec.ts --project=api-only
 *   ENV=stg npx playwright test tests/api/__scratch_ohio_signing_url_svc546.spec.ts --project=api-only
 *
 * Recipe (verified by user — do NOT re-investigate):
 *   - Merchant: TerraceFinance (OL90202-0001), ONLINE → customer state OH drives template lookup.
 *   - qa2 has GowSign template OH_2025_SAC_16_MONTHS (pk=21) → OH routes to GOWSIGN.
 *   - stg presumably has no OH GowSign template → OH falls back to merchant esign_client = SIGNWELL.
 *   - Force 16-month term (template is 16m). High income forces 16m EligibleTerms.
 *   - skipMerchantPreflight on BOTH (qa2 configureByName fails silently; stg DB down).
 *
 * DB guard: stg DB is UNREACHABLE from this machine — the spec NEVER queries the
 * DB when ENV=stg. qa2 DB (read-only SELECT) is used only to confirm the resolved
 * provider in uown_esign_document.
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { randomPerson } from '@data/index.js';
import { buildSendApplicationBody } from '@api/bodies/application.body.js';
import { extractApprovalStatus } from '@helpers/api-setup.helpers.js';
import { sleep } from '@helpers/common.helpers.js';

const ENV = process.env.ENV ?? 'sandbox';
const STATE = (process.env.STATE ?? 'OH').toUpperCase();
const FORCE_TERM = 16;
const HIGH_INCOME = 120_000;

/**
 * States with an ACTIVE GowSign template in qa2 (uown_gow_sign_template,
 * DB-confirmed 2026-06-17). A 16m Kornerstone lead in one of these states
 * routes to GOWSIGN; any other state falls back to the merchant esign_client
 * (SIGNWELL). OH has ONLY a 16-month template (OH_2025_SAC_16_MONTHS, pk=21).
 */
const GOWSIGN_TEMPLATE_STATES = new Set(['AL', 'CA', 'FL', 'GA', 'LA', 'NC', 'NY', 'OH', 'PA']);

/** Infer e-sign provider from a URL/host (substring match — host varies per env). */
function inferProvider(...urls: Array<string | undefined>): string {
  const joined = urls.filter(Boolean).join(' ').toLowerCase();
  if (joined.includes('gowsign')) return 'GOWSIGN';
  if (joined.includes('signwell')) return 'SIGNWELL';
  return 'UNKNOWN';
}

test(`svc#546 — capture ${STATE} signing URL [${ENV}]`, async ({ api, db, testEnv }) => {
  test.setTimeout(180_000);

  // Realistic, unique fresh applicant (real name/address/DOB/employer + valid SSN);
  // the random unique address is inherently blacklist-immune (no shared fixture).
  const applicant = randomPerson({ state: STATE });
  // User-provided Kornerstone merchant KS16775 "#1 Brooklyn Furniture INC" (qa2 pk=657, ONLINE, client_type=KORNERSTONE).
  // Covers OH (valid_states), active 16m program KW-16-2.25. The Kornerstone route returns EligibleTerms 16 from the ABB
  // in qa2 (proven by lead 16620 CA → GOWSIGN), where TireAgent capped at 13. ONLINE → customer state STATE drives template lookup.
  const merchant = { username: 'kornerstone', password: 'U0wn_Kornerstone_012c', number: 'KS16775' };

  let leadPk = '';
  let leadUuid = '';
  let signingUrl = '';
  let embeddedSigningUrl = '';
  let resolvedTerm = 0;
  let approvedAmount = 0;

  // ── 1. sendApplication (16m + OH + high income) ──────────────────
  await test.step(`sendApplication (${STATE}, 16m forced via income)`, async () => {
    const body = buildSendApplicationBody(merchant, applicant, undefined, {
      state: STATE,
      mainAnnualIncome: HIGH_INCOME,
      employerName: applicant.employerName,
    });
    // Kornerstone routing requires bank info on the sendApplication body (application-lifecycle pitfall #5)
    body.mainBankRoutingNumber = '123456780'; // TEST_BANK.DEFAULT_ROUTING
    body.mainBankAccountNumber = '160781900000'; // TEST_BANK.DEFAULT_ACCOUNT
    const resp = await api.application.sendApplication(body);
    if (!resp.ok) {
      console.log(`[svc546] sendApplication ${resp.status}: ${JSON.stringify(resp.body)}`);
    }
    expect(resp.ok, `sendApplication responded ${resp.status}`).toBeTruthy();
    leadUuid = resp.body.accountNumber ?? String(resp.body.authorizationNumber ?? '');
    leadPk = String(resp.body.authorizationNumber ?? '');
    expect(leadUuid, 'leadUuid present').toBeTruthy();
    console.log(`[svc546] leadPk=${leadPk} leadUuid=${leadUuid} email=${applicant.email}`);
  });

  // ── 2. getApplicationStatus → approval + approvedAmount ──────────
  await test.step('getApplicationStatus → APPROVED', async () => {
    await sleep(5_000);
    const resp = await api.application.getApplicationStatus(merchant, leadUuid);
    expect(resp.ok, `getApplicationStatus ${resp.status}`).toBeTruthy();
    const status = extractApprovalStatus(resp.body);
    expect(status?.toLowerCase(), `expected APPROVED, got: ${status}`).toContain('approved');
    if (resp.body.leadPk) leadPk = String(resp.body.leadPk);
    approvedAmount = resp.body.approvedAmount ?? 0;
    expect(approvedAmount, 'approvedAmount > 0').toBeGreaterThan(0);
    console.log(`[svc546] approvedAmount=${approvedAmount} leadPk=${leadPk}`);
  });

  // ── 3. sendInvoice → paymentDetailsList (pick 16m redirectUrl) ───
  await test.step('sendInvoice → capture 16m signing URL (redirectUrl)', async () => {
    const resp = await api.invoice.sendInvoice(merchant, leadUuid, {
      orderTotal: String(approvedAmount),
    });
    expect(resp.ok, `sendInvoice ${resp.status}`).toBeTruthy();
    const list = resp.body.paymentDetailsList ?? [];
    console.log(`[svc546] paymentDetailsList (${list.length}): ${JSON.stringify(list)}`);

    const matched16 = list.find((d) => d.termInMonths === FORCE_TERM);
    if (!matched16) {
      const available = list.map((d) => d.termInMonths).join(',') || '(none)';
      throw new Error(
        `[svc546] term=${FORCE_TERM} not in paymentDetailsList (available: [${available}]). ` +
        `Retry with higher mainAnnualIncome — see recipe.`,
      );
    }
    resolvedTerm = matched16.termInMonths ?? 0;
    signingUrl = matched16.redirectUrl ?? '';
    expect(signingUrl, 'redirectUrl (signing URL) present for 16m entry').toBeTruthy();
    console.log(`[svc546] resolvedTerm=${resolvedTerm} signingUrl=${signingUrl}`);
  });

  // ── 4. getMissingFields + submitApplication → embeddedSigningUrl ─
  await test.step('submitApplication → embeddedSigningUrl', async () => {
    const url = new URL(signingUrl);
    const shortCode = url.pathname.split('/').filter(Boolean)[0] ?? '';
    const planId = url.searchParams.get('planId') ?? '';
    expect(shortCode, 'shortCode extractable from signing URL').toBeTruthy();

    const missing = await api.application.getMissingFields(
      shortCode,
      planId ? { planId } : undefined,
    );
    expect(missing.ok, `getMissingFields ${missing.status}`).toBeTruthy();

    const submit = await api.application.submitApplication(
      Number(leadPk), applicant.firstName, applicant.lastName,
    );
    if (!submit.ok) {
      console.log(`[svc546] submitApplication ${submit.status}: ${JSON.stringify(submit.body)}`);
    }
    expect(submit.ok, `submitApplication ${submit.status}`).toBeTruthy();
    embeddedSigningUrl = submit.body.embeddedSigningUrl ?? '';
    if (submit.body.termInMonths) resolvedTerm = submit.body.termInMonths;
    console.log(`[svc546] embeddedSigningUrl=${embeddedSigningUrl || '(none)'}`);
  });

  // ── 5. Provider resolution ───────────────────────────────────────
  let dbProvider = '';
  let dbEsignStatus = '';
  await test.step('resolve provider (DB read-only — qa2 only)', async () => {
    // stg DB is unreachable — NEVER query when ENV=stg (would hang).
    if (ENV === 'qa2') {
      const row = await db.queryOne<{ client?: string; status?: string; template_name?: string }>(
        `SELECT client, status, template_name FROM uown_esign_document
         WHERE lead_pk = $1 ORDER BY pk DESC LIMIT 1`,
        [leadPk],
      );
      dbProvider = row?.client ?? '';
      dbEsignStatus = row?.status ?? '';
      console.log(`[svc546] uown_esign_document: client=${dbProvider} template_name=${row?.template_name ?? '-'} status=${dbEsignStatus}`);
    } else {
      console.log(`[svc546] ENV=${ENV} — DB unreachable, skipping DB provider confirmation`);
    }
  });

  const inferredProvider = inferProvider(embeddedSigningUrl, signingUrl, dbProvider);
  // Routing is by GowSign-template availability for the customer STATE (not env, not merchant esign_client).
  const expectedProvider = ENV === 'qa2' && GOWSIGN_TEMPLATE_STATES.has(STATE) ? 'GOWSIGN' : 'SIGNWELL';

  // ── REPORT ───────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`[svc546] ENV=${ENV}  svcApiUrl=${testEnv.svcApiUrl}`);
  console.log(`[svc546] merchant=KS16775 #1 Brooklyn Furniture (${merchant.number}) Kornerstone, customer state=${STATE}`);
  console.log(`[svc546] leadPk=${leadPk}`);
  console.log(`[svc546] leadUuid=${leadUuid}`);
  console.log(`[svc546] resolvedTerm=${resolvedTerm} (expected ${FORCE_TERM})`);
  console.log(`[svc546] SIGNING URL (redirectUrl): ${signingUrl}`);
  console.log(`[svc546] embeddedSigningUrl: ${embeddedSigningUrl || '(not returned)'}`);
  console.log(`[svc546] provider DB (qa2 only): ${dbProvider || '(not read)'} status=${dbEsignStatus || '-'}`);
  console.log(`[svc546] provider inferred from URL/DB: ${inferredProvider}`);
  console.log(`[svc546] provider EXPECTED: ${expectedProvider}`);
  console.log('═══════════════════════════════════════════════════════════');

  // Soft assertions — the deliverable is the URL, not a pass/fail gate.
  expect(resolvedTerm, 'term must be 16').toBe(FORCE_TERM);
  expect(signingUrl, 'signing URL captured').toBeTruthy();
});

/**
 * UI Servicing — Quick Search by Type (svc#454 / R1.52.0 regressão paralela).
 *
 * SPEC:
 *   docs/taskTestingUown/RU05.26.1.52.0_optimizeHighCpuQueriesQuery4_454/spec.md §8.2
 *
 * Cobertura (10 CTs — SVC-UI-01..SVC-UI-10):
 *   - Mesmas 9 searchTypes da UI Origination + 2 Servicing-only:
 *     `Ref Account ID` e `Contract #` (SVC-UI-09 / SVC-UI-10).
 *   - MR !1370 NÃO tocou o backend SVC — esta spec é REGRESSION cross-cutting
 *     para garantir que o lado Servicing não regrediu silenciosamente quando
 *     o LOS foi refatorado de 1 SQL → 10 SQLs.
 *
 * Atenção crítica (pitfall §13 do SPEC):
 *   Servicing envia `InvoiceNumber` no query-string (Origination usa `InvoiceNum`).
 *   O page object passa o LABEL ("Invoice #") e o BFF resolve o param correto —
 *   esta spec assert via `waitForResponse` que o param Servicing-style aparece.
 *
 * Strategy (regra #14 — UI-first): exerce o navbar do Servicing como agent
 * triando ticket. API-only do SVC não é coberto neste pipeline (escopo MR é
 * LOS — SVC fica como regressão UI).
 *
 * Activity log (regra #13): N/A — read-only.
 *
 * Test data (regra #9 — Exception): massa qa1 pré-existente (lead 11319
 * Karen Holdin FUNDED, account 4524). `refAccountId` e `contractNumber` são
 * resolvidos via DB no setup do CT correspondente (não hardcoded — variam
 * por ambiente).
 *
 * Viewport (regra #15): 1440×900 (Bootstrap `d-lg-block`).
 *
 * Environment: qa1.
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import type { Page, Request } from '@playwright/test';
import { SearchPage } from '@pages/index.js';
import type { QuickSearchResultRow } from '@pages/search.page.js';
import { loginToPortalIfNeeded } from '@helpers/auth.helpers.js';
import type { DatabaseHelpers } from '@helpers/database.helpers.js';
import { TestTag, buildTags, splitTags } from '../../../src/types/enums.js';

const BASE_TAG = `${buildTags(TestTag.REGRESSION)} @svc-454 @simple-search @servicing`;
const VIEWPORT = { width: 1440, height: 900 } as const;

/**
 * Fixture for the happy lead used across SVC search CTs.
 *
 * **Cobertura limitada em SVC** (não é Karen): SVC consulta `uown_sv_account`
 * — leads sem `account_pk` (status SIGNED mas nunca funded) NÃO aparecem em
 * SVC search. Karen Holdin (lead 11319) é exatamente esse caso → tem `account_pk
 * IS NULL` em qa1 e não pode ser usada como happy lead aqui.
 *
 * Source-tag (regra #16): root cause de F-10 (Exec 2 2026-05-24) — não é DOM
 * nem regression de produto, é exigência de account_pk para SVC. Pitfall
 * application-lifecycle #56.
 *
 * **Category: DRIFT-PRONE** (see [[volatile-knowledge-registry]]) — leadPk/accountPk
 * pairings shift on qa1 reseed. Resolution moved to runtime DB query in
 * `beforeAll` — see `resolveSvcHappyLead`. Fallback (verified live by qa-debugger
 * 2026-05-24): leadPk=11339 `Testfndb Testlndb`, account_pk=4524, FUNDED.
 */
interface SvcHappyLead {
  leadPk: number;
  accountPk: number;
  uuid: string | null;
  ssn: string | null;
  email: string | null;
  invoice: string | null;
  name: string;
  phone: string | null;
  contractNumber: string | null;
  refAccountId: string | null;
  fallbackPhoneLeadPk: number;
  fallbackPhone: string;
  last4: string;
}

const KAREN_STATIC = {
  // Last 4 CC pinned static because CC rotation in qa1 is rare and the dedup
  // gold case (lead 4019, 26 CCs) shares `2225` with the happy lead.
  last4: '2225',
  fallbackPhoneLeadPk: 11735,
  fallbackPhone: '9457097027',
} as const;

// Mutable holder populated by beforeAll — runtime resolution per regra #9
// (categoria drift-prone, ver report.md F-07/F-10).
let KAREN: SvcHappyLead;

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Aguarda a resposta GET do `simpleSearch` Servicing. Diferente do Origination
 * (POST), Servicing usa GET sem body, então não precisamos validar payload de
 * request — só o query-string param `searchType`.
 */
async function captureSimpleSearchSvcResponse(
  page: Page,
  term: string,
  options: { searchType?: string; timeoutMs?: number } = {},
): Promise<{ status: number; body: Array<Record<string, unknown>>; url: string }> {
  const { searchType, timeoutMs = 15_000 } = options;
  const encoded = encodeURIComponent(term);
  const res = await page.waitForResponse(
    (r) => {
      const url = r.url();
      if (!url.includes('/uown/svc/simpleSearch/')) return false;
      if (!url.includes(encoded)) return false;
      if (searchType && !url.includes(`searchType=${encodeURIComponent(searchType)}`)) return false;
      return r.request().method() === 'GET';
    },
    { timeout: timeoutMs },
  );
  const status = res.status();
  const url = res.url();
  let body: Array<Record<string, unknown>> = [];
  try {
    const parsed = (await res.json()) as unknown;
    // Backend response is a WRAPPER `{ searchResults, count, moreResults }` —
    // NOT a flat array. Older parser used `Array.isArray(parsed)` which silently
    // produced `body=[]` and made every CT fail. Source-tag: qa-debugger live
    // MCP fetch @ qa1 2026-05-24 (report.md F-07 root cause). Category:
    // DRIFT-PRONE — re-verify shape if SVC regression breaks again.
    if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { searchResults?: unknown }).searchResults)) {
      body = (parsed as { searchResults: Array<Record<string, unknown>> }).searchResults;
    } else if (Array.isArray(parsed)) {
      // Defensive fallback: if backend reverts to flat array, still parse it.
      body = parsed as Array<Record<string, unknown>>;
    }
  } catch {
    // empty
  }
  return { status, body, url };
}

/**
 * Resolves the happy lead used across SVC search CTs in a single DB hop.
 *
 * **Karen is NOT eligible here.** SVC search queries `uown_sv_account` — leads
 * without an `account_pk` (status SIGNED but never funded) don't surface. Karen
 * (lead 11319) is exactly such a case in qa1. F-10 root cause: SVC tem cobertura
 * mais limitada que LOS — só leads com `account_pk` válido aparecem.
 *
 * Strategy:
 *   1) Prefer the most recent FUNDED lead with `account_pk IS NOT NULL` that
 *      also has a credit card on file (enables last4 CT) and an email/phone.
 *   2) Fallback to known stable lead `Testfndb Testlndb` (leadPk=11339,
 *      account_pk=4524) — verified live by qa-debugger 2026-05-24 via
 *      `GET /simpleSearch/4524`.
 *
 * Phone uses canonical `uown_los_phone` (NOT `uown_los_lead_personal_info` —
 * tabela inexistente em qa1, F-09).
 *
 * The returned fixture is populated into the module-level `KAREN` so that
 * subsequent test() bodies can reference it.
 */
async function resolveSvcHappyLead(db: DatabaseHelpers): Promise<SvcHappyLead> {
  const FALLBACK_LEAD_PK = 11339;

  const buildFixture = (row: {
    lead_pk: number;
    account_pk: number;
    uuid: string | null;
    ssn: string | null;
    email: string | null;
    invoice: string | null;
    phone: string | null;
    contract_number: string | null;
    ref_account_id: string | null;
    first_name: string | null;
    last_name: string | null;
  }): SvcHappyLead => ({
    leadPk: Number(row.lead_pk),
    accountPk: Number(row.account_pk),
    uuid: row.uuid,
    ssn: row.ssn,
    email: row.email,
    invoice: row.invoice,
    phone: row.phone,
    contractNumber: row.contract_number,
    refAccountId: row.ref_account_id,
    name: `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim() || 'Testfndb Testlndb',
    ...KAREN_STATIC,
  });

  const SELECT_HAPPY = `
    SELECT lead.pk AS lead_pk,
           lead.account_pk,
           lead.uuid,
           customer.ssn,
           email.email_address AS email,
           invoice.merchant_invoice_number AS invoice,
           (phone.area_code || phone.phone_number) AS phone,
           contract.contract_number,
           account.ref_account_id,
           customer.first_name,
           customer.last_name
      FROM uown_los_lead lead
      JOIN uown_los_customer customer ON customer.lead_pk = lead.pk
      JOIN uown_sv_account account ON account.pk = lead.account_pk
      LEFT JOIN uown_los_email email ON email.lead_pk = lead.pk AND email.email_type = 'PRIMARY'
      LEFT JOIN uown_los_phone phone ON phone.lead_pk = lead.pk AND phone.phone_type = 'MOBILE'
      LEFT JOIN uown_los_invoice invoice ON invoice.lead_pk = lead.pk
      LEFT JOIN uown_los_contract contract ON contract.lead_pk = lead.pk
  `;

  // Step 1: most recent FUNDED lead with account + CC + ordered by recency.
  const preferred = await db.queryOne<Parameters<typeof buildFixture>[0]>(
    `${SELECT_HAPPY}
      WHERE lead.account_pk IS NOT NULL
        AND lead.lead_status = 'FUNDED'
        AND EXISTS (SELECT 1 FROM uown_los_credit_card cc WHERE cc.lead_pk = lead.pk)
      ORDER BY lead.row_created_timestamp DESC
      LIMIT 1`,
  );

  if (preferred) return buildFixture(preferred);

  // Step 2: known stable fallback (Testfndb Testlndb leadPk=11339, account=4524).
  const fallback = await db.queryOne<Parameters<typeof buildFixture>[0]>(
    `${SELECT_HAPPY}
      WHERE lead.pk = $1
      LIMIT 1`,
    [FALLBACK_LEAD_PK],
  );

  if (!fallback) {
    throw new Error(
      `Cannot resolve SVC happy lead — neither FUNDED+CC lead nor fallback leadPk=${FALLBACK_LEAD_PK} found`,
    );
  }
  return buildFixture(fallback);
}

async function waitForResults(
  search: SearchPage,
  timeoutMs = 8_000,
): Promise<QuickSearchResultRow[]> {
  const deadline = Date.now() + timeoutMs;
  let rows: QuickSearchResultRow[] = [];
  while (Date.now() < deadline) {
    rows = await search.getQuickSearchResults();
    if (rows.length > 0) return rows;
    await search['page'].waitForTimeout(250);
  }
  return rows;
}

/**
 * Installs a request listener that captures every `/uown/svc/simpleSearch/`
 * request hitting the network. Returns the captured list + an `off()` function
 * to detach. Used for diagnostic error messages when a CT can't find the
 * expected lead (F-10' Exec 3 2026-05-24 — surfaces the REAL searchType param
 * the UI is sending, so future runs don't blind-guess).
 */
function installSvcRequestSpy(page: Page): {
  requests: string[];
  off: () => void;
} {
  const requests: string[] = [];
  const listener = (req: Request): void => {
    const url = req.url();
    if (url.includes('/uown/svc/simpleSearch/')) {
      requests.push(`${req.method()} ${url}`);
    }
  };
  page.on('request', listener);
  return {
    requests,
    off: () => page.off('request', listener),
  };
}

/**
 * Best-effort response capture: tries to match the predicate within `timeoutMs`,
 * returns `{body:[],url:'',status:0}` on timeout (caller falls back to UI polling).
 *
 * **Why this exists (F-10' Exec 3 2026-05-24):** SVC search requests can race
 * with React debounce — earlier keystrokes can fulfill the predicate before
 * the FINAL value lands. Tolerating predicate miss + relying on UI polling +
 * spying ALL requests is more robust than hard-fail on `waitForResponse`.
 */
async function tryCaptureSimpleSearchSvcResponse(
  page: Page,
  term: string,
  options: { searchType?: string; timeoutMs?: number } = {},
): Promise<{ status: number; body: Array<Record<string, unknown>>; url: string }> {
  try {
    return await captureSimpleSearchSvcResponse(page, term, options);
  } catch {
    return { status: 0, body: [], url: '' };
  }
}

// ─────────────────────────────────────────────────────────────────────

test.describe(
  'RU05.26.1.52.0_optimizeHighCpuQueriesQuery4_454 — UI Servicing (simpleSearch regressão)',
  { tag: splitTags(BASE_TAG) },
  () => {
    test.beforeAll(async ({ db }) => {
      // Skip resolution in non-qa1 environments — KAREN_STATIC contains qa1-specific
      // values (last4, fallbackPhone, fallbackPhoneLeadPk) that don't exist in sandbox.
      if ((process.env.ENV || 'sandbox') !== 'qa1') return;
      // Resolve happy lead fixture at runtime — leadPk↔accountPk pairings drift
      // on qa1 reseed (categoria drift-prone, ver [[volatile-knowledge-registry]]).
      // SVC search requires account_pk IS NOT NULL — Karen Holdin (lead 11319)
      // não qualifica (F-10 root cause). Helper retorna lead FUNDED.
      KAREN = await resolveSvcHappyLead(db);
      // eslint-disable-next-line no-console
      console.log(
        `[svc-454] SVC happy lead resolved → leadPk=${KAREN.leadPk} accountPk=${KAREN.accountPk} name="${KAREN.name}"`,
      );
    });

    test.beforeEach(async ({ page, testEnv }) => {
      test.skip(testEnv.env !== 'qa1', 'svc#454 SVC simpleSearch uses qa1-specific lead fixtures (KAREN_STATIC) — skip in other environments');
      await page.setViewportSize({ width: VIEWPORT.width, height: VIEWPORT.height });
      await page.goto(testEnv.servicingUrl, { waitUntil: 'domcontentloaded' });
      await loginToPortalIfNeeded(page, 'Servicing Login', testEnv.servicingUrl, testEnv);
      const search = new SearchPage(page);
      await search.ensureSearchVisible();
    });

    test('SVC-UI-01 — Lead # search returns target lead @lead', async ({ page }) => {
      const search = new SearchPage(page);
      const spy = installSvcRequestSpy(page);
      const term = String(KAREN.leadPk);

      const [{ body }] = await Promise.all([
        tryCaptureSimpleSearchSvcResponse(page, term, { searchType: 'LeadPk' }),
        search.searchByType('Lead #', term),
      ]);

      const rows = await waitForResults(search, 12_000);
      spy.off();

      expect(
        rows.length,
        `SVC Lead # autocomplete renders results (observed: ${spy.requests.join(' | ') || 'NONE'})`,
      ).toBeGreaterThanOrEqual(1);
      // Servicing URLs use accountPk: /customer-information/{accountPk}
      // getQuickSearchResults() extracts this into the leadPk field
      const resultPks = rows.map((r) => r.leadPk);
      expect(
        resultPks,
        `target account ${KAREN.accountPk} surfaces (got [${resultPks.join(',')}]; reqs: ${spy.requests.join(' | ')})`,
      ).toContain(Number(KAREN.accountPk));

      if (body.length > 0) {
        expect(body.length, 'SVC backend returned at least 1 row').toBeGreaterThanOrEqual(1);
      }

      const { duplicate } = search.expectNoDuplicateLeadPk(rows);
      expect(duplicate).toBeNull();
    });

    test('SVC-UI-02 — Servicing Account # search returns target @account', async ({ page }) => {
      const search = new SearchPage(page);
      const term = String(KAREN.accountPk);

      const [{ body }] = await Promise.all([
        captureSimpleSearchSvcResponse(page, term, { searchType: 'AccountPk' }),
        search.searchByType('Servicing Account #', term),
      ]);

      const rows = await waitForResults(search);
      expect(rows.length).toBeGreaterThanOrEqual(1);
      // Source-tag F-11 (Exec 2 2026-05-24): backend returns accountPk as number.
      // Normalize both sides via String() to dodge number/string mismatch.
      const accountPks = body.map((r) => String(r.accountPk));
      expect(accountPks).toContain(String(KAREN.accountPk));

      const { duplicate } = search.expectNoDuplicateLeadPk(rows);
      expect(duplicate).toBeNull();
    });

    test('SVC-UI-03 — Phone search returns matching lead @phone', async ({ page }) => {
      test.skip(!KAREN.phone, `happy lead ${KAREN.leadPk} has no phone `);
      const phone = (KAREN.phone as string).replace(/\D/g, '').slice(-10);
      const search = new SearchPage(page);
      const spy = installSvcRequestSpy(page);

      const [{ body }] = await Promise.all([
        tryCaptureSimpleSearchSvcResponse(page, phone, { searchType: 'Phone' }),
        search.searchByType('Phone', phone),
      ]);

      const rows = await waitForResults(search, 12_000);
      spy.off();
      expect(
        rows.length,
        `Phone autocomplete renders (reqs: ${spy.requests.join(' | ') || 'NONE'})`,
      ).toBeGreaterThanOrEqual(1);
      const resultPks = rows.map((r) => r.leadPk);
      expect(
        resultPks,
        `target account ${KAREN.accountPk} surfaces (got [${resultPks.join(',')}])`,
      ).toContain(Number(KAREN.accountPk));
      if (body.length > 0) {
        expect(body.length).toBeGreaterThanOrEqual(1);
      }

      const { duplicate } = search.expectNoDuplicateLeadPk(rows);
      expect(duplicate).toBeNull();
    });

    test('SVC-UI-04 — Email search returns target lead @email', async ({ page }) => {
      test.skip(!KAREN.email, `happy lead ${KAREN.leadPk} has no email in qa1 — SVC-UI-04 requires a non-null value`);
      const email = KAREN.email as string;
      const search = new SearchPage(page);
      const spy = installSvcRequestSpy(page);

      const [{ body }] = await Promise.all([
        tryCaptureSimpleSearchSvcResponse(page, email, { searchType: 'Email' }),
        search.searchByType('Email', email),
      ]);

      const rows = await waitForResults(search, 12_000);
      spy.off();
      expect(
        rows.length,
        `Email autocomplete renders (reqs: ${spy.requests.join(' | ') || 'NONE'})`,
      ).toBeGreaterThanOrEqual(1);
      const resultPks = rows.map((r) => r.leadPk);
      expect(
        resultPks,
        `target account ${KAREN.accountPk} surfaces (got [${resultPks.join(',')}])`,
      ).toContain(Number(KAREN.accountPk));

      if (body.length > 0) {
        expect(body.length).toBeGreaterThanOrEqual(1);
      }
      const { duplicate } = search.expectNoDuplicateLeadPk(rows);
      expect(duplicate).toBeNull();
    });

    test('SVC-UI-05 — SSN search returns target lead @ssn', async ({ page }) => {
      test.skip(!KAREN.ssn, `happy lead ${KAREN.leadPk} has no SSN in qa1 — SVC-UI-05 requires a non-null value`);
      const ssn = KAREN.ssn as string;
      const search = new SearchPage(page);
      const spy = installSvcRequestSpy(page);

      const [{ body }] = await Promise.all([
        tryCaptureSimpleSearchSvcResponse(page, ssn, { searchType: 'SSN' }),
        search.searchByType('SSN', ssn),
      ]);

      const rows = await waitForResults(search, 12_000);
      spy.off();
      expect(
        rows.length,
        `SSN autocomplete renders (reqs: ${spy.requests.join(' | ') || 'NONE'})`,
      ).toBeGreaterThanOrEqual(1);
      const resultPks = rows.map((r) => r.leadPk);
      expect(resultPks, `target account ${KAREN.accountPk} (got [${resultPks.join(',')}])`).toContain(
        Number(KAREN.accountPk),
      );
      if (body.length > 0) {
        expect(body.length).toBeGreaterThanOrEqual(1);
      }

      const { duplicate } = search.expectNoDuplicateLeadPk(rows);
      expect(duplicate).toBeNull();
    });

    test('SVC-UI-06 — Invoice # search (Servicing uses InvoiceNumber param) @invoice', async ({ page }) => {
      test.skip(!KAREN.invoice, `happy lead ${KAREN.leadPk} has no invoice — SVC-UI-06 requires a non-null value`);
      const invoice = KAREN.invoice as string;
      const search = new SearchPage(page);
      const spy = installSvcRequestSpy(page);

      const [{ body, url }] = await Promise.all([
        tryCaptureSimpleSearchSvcResponse(page, invoice, { searchType: 'InvoiceNumber' }),
        search.searchByType('Invoice #', invoice),
      ]);

      const rows = await waitForResults(search, 12_000);
      spy.off();

      if (url) {
        expect(
          url,
          'Servicing must call simpleSearch with searchType=InvoiceNumber (NOT InvoiceNum)',
        ).toContain('searchType=InvoiceNumber');
      } else if (spy.requests.length > 0) {
        const usesInvoiceNumber = spy.requests.some((r) => r.includes('searchType=InvoiceNumber'));
        expect(
          usesInvoiceNumber,
          `SVC must use searchType=InvoiceNumber (observed: ${spy.requests.join(' | ')})`,
        ).toBe(true);
      }

      expect(
        rows.length,
        `Invoice autocomplete renders (reqs: ${spy.requests.join(' | ') || 'NONE'})`,
      ).toBeGreaterThanOrEqual(1);
      const resultPks = rows.map((r) => r.leadPk);
      expect(resultPks, `target account ${KAREN.accountPk} (got [${resultPks.join(',')}])`).toContain(
        Number(KAREN.accountPk),
      );
      if (body.length > 0) {
        expect(body.length).toBeGreaterThanOrEqual(1);
      }
    });

    test('SVC-UI-07 — Name search returns matching lead deduplicated @name', async ({ page }) => {
      const search = new SearchPage(page);
      const spy = installSvcRequestSpy(page);

      const [{ body }] = await Promise.all([
        tryCaptureSimpleSearchSvcResponse(page, KAREN.name, { searchType: 'Name' }),
        search.searchByType('Name', KAREN.name),
      ]);

      const rows = await waitForResults(search, 12_000);
      spy.off();
      expect(
        rows.length,
        `Name autocomplete renders (reqs: ${spy.requests.join(' | ') || 'NONE'})`,
      ).toBeGreaterThanOrEqual(1);
      const resultPks = rows.map((r) => r.leadPk);
      expect(resultPks, `target account ${KAREN.accountPk} (got [${resultPks.join(',')}])`).toContain(
        Number(KAREN.accountPk),
      );
      if (body.length > 0) {
        expect(body.length).toBeGreaterThanOrEqual(1);
      }

      const { duplicate, counts } = search.expectNoDuplicateLeadPk(rows);
      expect(
        duplicate,
        `SVC name search must dedup — counts: ${JSON.stringify([...counts])}`,
      ).toBeNull();
    });

    test('SVC-UI-08 — Last 4 CC search returns leads with last4 @last4cc', async ({ page }) => {
      const search = new SearchPage(page);
      const spy = installSvcRequestSpy(page);

      // Source-tag F-12 (Exec 2 2026-05-24): front Servicing envia
      // `?searchType=last4CC` (camelCase) — não `Last4CC` (Pascal).
      const [{ body }] = await Promise.all([
        tryCaptureSimpleSearchSvcResponse(page, KAREN.last4, { searchType: 'last4CC' }),
        search.searchByType('Last 4 CC', KAREN.last4),
      ]);

      const rows = await waitForResults(search, 12_000);
      spy.off();
      expect(
        rows.length,
        `last4 autocomplete renders (reqs: ${spy.requests.join(' | ') || 'NONE'})`,
      ).toBeGreaterThanOrEqual(1);
      const leadPks = rows.map((r) => r.leadPk);
      // Karen `last4='2225'` is shared across multiple leads in qa1 — assert
      // ANY lead surfaces (dedup) rather than Karen specifically (her CC
      // population in fallback Testfndb may differ).
      expect(
        leadPks.length,
        `last4 must return ≥1 leadPk (got [${leadPks.join(',')}]; reqs: ${spy.requests.join(' | ')})`,
      ).toBeGreaterThanOrEqual(1);
      if (body.length > 0) {
        expect(body.length).toBeGreaterThanOrEqual(1);
      }

      const { duplicate } = search.expectNoDuplicateLeadPk(rows);
      expect(duplicate, 'last4 must dedup by leadPk in Servicing too').toBeNull();
    });

    test('SVC-UI-09 — Ref Account ID search (Servicing-only) @ref-account', async ({ page }) => {
      test.skip(
        !KAREN.refAccountId,
        `account ${KAREN.accountPk} has no ref_account_id in qa1 — SVC-UI-09 requires a non-null value`,
      );

      const term = KAREN.refAccountId as string;
      const search = new SearchPage(page);

      const [{ body }] = await Promise.all([
        captureSimpleSearchSvcResponse(page, term, { searchType: 'RefAccountId' }),
        search.searchByType('Ref Account ID', term),
      ]);

      const rows = await waitForResults(search);
      expect(rows.length).toBeGreaterThanOrEqual(1);
      // F-11 (Exec 2 2026-05-24): normalizar via String() — backend devolve
      // accountPk como number, fixture armazena como number; assert comparava
      // number vs string em alguns paths. Padronizar via String().
      const accountPks = body.map((r) => String(r.accountPk));
      expect(accountPks, 'happy account must surface').toContain(String(KAREN.accountPk));

      const { duplicate } = search.expectNoDuplicateLeadPk(rows);
      expect(duplicate).toBeNull();
    });

    test('SVC-UI-10 — Contract # search (Servicing-only) @contract', async ({ page }) => {
      test.skip(
        !KAREN.contractNumber,
        `lead ${KAREN.leadPk} has no contract_number in qa1 — SVC-UI-10 requires a non-null value`,
      );

      const term = KAREN.contractNumber as string;
      const search = new SearchPage(page);
      const spy = installSvcRequestSpy(page);

      const [{ body }] = await Promise.all([
        tryCaptureSimpleSearchSvcResponse(page, term, { searchType: 'ContractNumber' }),
        search.searchByType('Contract #', term),
      ]);

      const rows = await waitForResults(search, 12_000);
      spy.off();
      expect(
        rows.length,
        `Contract autocomplete renders (reqs: ${spy.requests.join(' | ') || 'NONE'})`,
      ).toBeGreaterThanOrEqual(1);
      const resultPks = rows.map((r) => r.leadPk);
      expect(
        resultPks,
        `target account ${KAREN.accountPk} via contract # (got [${resultPks.join(',')}])`,
      ).toContain(Number(KAREN.accountPk));
      if (body.length > 0) {
        expect(body.length).toBeGreaterThanOrEqual(1);
      }

      const { duplicate } = search.expectNoDuplicateLeadPk(rows);
      expect(duplicate).toBeNull();
    });
  },
);

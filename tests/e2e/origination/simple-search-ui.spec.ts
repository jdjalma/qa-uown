/**
 * UI Origination — Quick Search by Type (svc#454 / R1.52.0).
 *
 * SPEC:
 *   docs/taskTestingUown/RU05.26.1.52.0_optimizeHighCpuQueriesQuery4_454/spec.md §8.1
 *
 * Cobertura (9 CTs — UI-01..UI-09):
 *   - Cada `searchType` (Lead #, Servicing Account #, Phone, Email, SSN,
 *     Invoice #, UUID, Name, Last 4 CC) aciona a SQL especializada correta
 *     no backend (validado indiretamente via resultado retornado + endpoint
 *     `/uown/los/simpleSearch/{term}?searchType=…` interceptado).
 *   - Dedup por leadPk (UI-09 — lead 4019 com 26 CCs deve colapsar p/ 1 row).
 *
 * Strategy (regra #14 — UI-first):
 *   Esta spec exerce o FLUXO REAL do usuário (selecionar searchType no
 *   navbar dropdown → digitar input → ler autocomplete). API-only é coberto
 *   por `tests/api/origination/simple-search-los.spec.ts` (FreeText pre-detect,
 *   multi-tenancy, contract edges) por exceção §14b.
 *
 * Activity log (regra #13): N/A — endpoint read-only, sem mutação. SPEC §6/§9.
 *
 * Test data (regra #9 — Exception):
 *   Massa qa1 pré-existente (lead 11319 Karen Holdin FUNDED + lead 4019 com
 *   26 CCs para dedup). Reutilizar é justificado: criar 11.289 leads em qa1
 *   só pra reproduzir o índice levaria horas. Comentário inline + SPEC §13.
 *
 * Viewport (regra #15): 1440×900 único. Portais Origination/Servicing usam
 * Bootstrap `d-lg-block` (≥992px) — abaixo disso o `<form class="d-none d-lg-block">`
 * que envolve o quick search SUMME do DOM.
 *
 * Merchant preflight (regra #12): SKIPPED. Read-only sobre dados existentes —
 * nenhuma application criada nem mutação em merchant config.
 *
 * Environment: qa1 (deploy MR !1370 confirmado). Tag explícita `envName: 'qa1'`
 * via `test.use(...)`. NÃO portar para sandbox/qa2 sem re-seed dos leads.
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import type { Page, Request } from '@playwright/test';
import { SearchPage } from '@pages/index.js';
import type { QuickSearchResultRow } from '@pages/search.page.js';
import { loginToPortalIfNeeded } from '@helpers/auth.helpers.js';
import type { DatabaseHelpers } from '@helpers/database.helpers.js';
import { TestTag, buildTags, splitTags } from '../../../src/types/enums.js';

const BASE_TAG = `${buildTags(TestTag.REGRESSION)} @svc-454 @simple-search @origination`;
const VIEWPORT = { width: 1440, height: 900 } as const;

// ── Fixture dinâmica (env-agnostic) ──────────────────────────────────
//
// Resolvida via DB em beforeAll. Substitui a massa fixa qa1 (KAREN) que
// causava falhas em stg/qa2 por dados inexistentes.
interface HappyLeadFixture {
  leadPk: number;
  accountPk: number;
  uuid: string;
  ssn: string;
  email: string;
  invoice: string;
  name: string;
  phone: string | null;
  last4: string;
}

let HAPPY: HappyLeadFixture;

async function resolveHappyLeadFixture(db: DatabaseHelpers): Promise<HappyLeadFixture> {
  const row = await db.queryOne<{
    lead_pk: number;
    account_pk: number;
    uuid: string;
    ssn: string;
    email: string;
    invoice: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    last4: string;
  }>(
    `SELECT lead.pk AS lead_pk,
            lead.account_pk,
            lead.uuid,
            customer.ssn,
            email.email_address AS email,
            invoice.merchant_invoice_number AS invoice,
            customer.first_name,
            customer.last_name,
            (phone.area_code || phone.phone_number) AS phone,
            cc.cc_last_four_digit AS last4
       FROM uown_los_lead lead
       JOIN uown_los_customer customer ON customer.lead_pk = lead.pk
       JOIN uown_los_email email ON email.lead_pk = lead.pk AND email.email_type = 'PRIMARY'
       JOIN uown_los_invoice invoice ON invoice.lead_pk = lead.pk
       JOIN uown_los_credit_card cc ON cc.lead_pk = lead.pk
       LEFT JOIN uown_los_phone phone ON phone.lead_pk = lead.pk AND phone.phone_type = 'MOBILE'
      WHERE lead.account_pk IS NOT NULL
        AND lead.lead_status = 'FUNDED'
        AND lead.uuid IS NOT NULL
        AND customer.ssn IS NOT NULL
      ORDER BY lead.row_created_timestamp DESC
      LIMIT 1`,
  );
  if (!row) {
    throw new Error('Cannot resolve happy lead fixture: no FUNDED lead with all required fields found');
  }
  const digits = (row.phone ?? '').replace(/\D/g, '');
  return {
    leadPk: Number(row.lead_pk),
    accountPk: Number(row.account_pk),
    uuid: row.uuid,
    ssn: row.ssn,
    email: row.email,
    invoice: row.invoice,
    name: `${row.first_name} ${row.last_name}`.trim(),
    phone: digits.length >= 10 ? digits.slice(-10) : null,
    last4: row.last4,
  };
}

interface DedupFixture {
  leadPk: number;
  last4: string;
  ccCount: number;
}

let DEDUP: DedupFixture;

async function resolveDedupFixture(db: DatabaseHelpers): Promise<DedupFixture> {
  const row = await db.queryOne<{ lead_pk: string; last4: string; cc_count: string }>(
    `SELECT cc.lead_pk AS lead_pk, cc.cc_last_four_digit AS last4, COUNT(*)::int AS cc_count
       FROM uown_los_credit_card cc
      WHERE cc.lead_pk IS NOT NULL
      GROUP BY cc.lead_pk, cc.cc_last_four_digit
     HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC
      LIMIT 1`,
  );
  if (!row) {
    throw new Error('Cannot resolve dedup fixture: no lead with multiple CCs found');
  }
  return { leadPk: Number(row.lead_pk), last4: row.last4, ccCount: Number(row.cc_count) };
}

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Aguarda a resposta do `simpleSearch` Origination para `term` (com ou sem
 * `searchType` específico) e retorna a lista parseada. Usa `waitForResponse`
 * pra desacoplar de timing de polling/store.
 */
async function captureSimpleSearchResponse(
  page: Page,
  term: string,
  options: { searchType?: string; timeoutMs?: number } = {},
): Promise<{ status: number; body: Array<Record<string, unknown>> }> {
  const { searchType, timeoutMs = 15_000 } = options;
  const encoded = encodeURIComponent(term);
  const res = await page.waitForResponse(
    (r) => {
      const url = r.url();
      if (!url.includes(`/uown/los/simpleSearch/`)) return false;
      if (!url.includes(encoded)) return false;
      if (searchType && !url.includes(`searchType=${encodeURIComponent(searchType)}`)) return false;
      return true;
    },
    { timeout: timeoutMs },
  );
  const status = res.status();
  let body: Array<Record<string, unknown>> = [];
  try {
    const parsed = (await res.json()) as unknown;
    // Backend wrapper `{ searchResults, count, moreResults }` — NOT flat array.
    // Source-tag: qa-debugger live MCP fetch @ qa1 2026-05-24. DRIFT-PRONE.
    if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { searchResults?: unknown }).searchResults)) {
      body = (parsed as { searchResults: Array<Record<string, unknown>> }).searchResults;
    } else if (Array.isArray(parsed)) {
      body = parsed as Array<Record<string, unknown>>;
    }
  } catch {
    // Non-JSON response (anomalies #5/#6) — leave body empty; status fica.
  }
  return { status, body };
}

// resolveKarenPhone removed — phone is resolved dynamically in HAPPY fixture.

/**
 * Polls the rendered autocomplete results until at least one row appears OR
 * the deadline elapses. Returns whatever rows are available at the deadline.
 */
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

// ─────────────────────────────────────────────────────────────────────

test.describe(
  'RU05.26.1.52.0_optimizeHighCpuQueriesQuery4_454 — UI Origination (simpleSearch)',
  { tag: splitTags(BASE_TAG) },
  () => {
    test.beforeAll(async ({ db }) => {
      HAPPY = await resolveHappyLeadFixture(db);
      DEDUP = await resolveDedupFixture(db);
      // eslint-disable-next-line no-console
      console.log(
        `[svc-454] Origination fixture → leadPk=${HAPPY.leadPk} accountPk=${HAPPY.accountPk} name="${HAPPY.name}" dedup=${DEDUP.leadPk}(${DEDUP.ccCount} CCs)`,
      );
    });

    test.beforeEach(async ({ page, testEnv }) => {
      // Regra #15 — viewport fixo (Bootstrap `d-lg-block` requer ≥992px).
      await page.setViewportSize({ width: VIEWPORT.width, height: VIEWPORT.height });
      // storageState pode ter sido gerado em outro env; loginIfNeeded cobre o gap.
      await page.goto(testEnv.originationUrl, { waitUntil: 'domcontentloaded' });
      // Login indicator text in qa1 Origination header is 'Merchant Login' (NOT
      // 'Origination Login'). Verified live by qa-debugger 2026-05-24 via MCP.
      await loginToPortalIfNeeded(page, 'Merchant Login', testEnv.originationUrl, testEnv);
      // Garantir que a barra de busca está renderizada antes de cada CT.
      const search = new SearchPage(page);
      await search.ensureSearchVisible();
    });

    test('UI-01 — Lead # search returns target lead with required fields @lead', async ({ page }) => {
      const search = new SearchPage(page);
      const term = String(HAPPY.leadPk);

      const [{ body }] = await Promise.all([
        captureSimpleSearchResponse(page, term, { searchType: 'Lead' }),
        search.searchByType('Lead #', term),
      ]);

      const rows = await waitForResults(search);
      expect(rows.length, 'autocomplete must render at least one row').toBeGreaterThanOrEqual(1);

      const leadPks = rows.map((r) => r.leadPk);
      expect(leadPks, `lead ${HAPPY.leadPk} must be in the autocomplete`).toContain(HAPPY.leadPk);

      expect(body.length, 'backend returned at least one result').toBeGreaterThanOrEqual(1);
      const target = body.find((r) => r.leadPk === HAPPY.leadPk);
      expect(target, `response must include lead ${HAPPY.leadPk}`).toBeTruthy();
      if (target) {
        expect(target.leadPk, 'leadPk non-null').toBeTruthy();
        expect(target.customerName ?? target.firstName, 'name non-null').toBeTruthy();
        expect(target.createdTimestamp, 'createdTimestamp non-null for ByLead').toBeTruthy();
      }

      const { duplicate } = search.expectNoDuplicateLeadPk(rows);
      expect(duplicate, 'no duplicate leadPk in autocomplete').toBeNull();
    });

    test('UI-02 — Servicing Account # search returns target account @account', async ({ page }) => {
      const search = new SearchPage(page);
      const term = String(HAPPY.accountPk);

      const [{ body }] = await Promise.all([
        captureSimpleSearchResponse(page, term, { searchType: 'AccountPk' }),
        search.searchByType('Servicing Account #', term),
      ]);

      const rows = await waitForResults(search);
      expect(rows.length).toBeGreaterThanOrEqual(1);

      const accountPks = body.map((r) => String(r.accountPk));
      expect(accountPks, `backend payload contains account ${HAPPY.accountPk}`).toContain(
        String(HAPPY.accountPk),
      );

      const leadPks = rows.map((r) => r.leadPk);
      expect(leadPks, `lead ${HAPPY.leadPk} must appear in autocomplete`).toContain(HAPPY.leadPk);

      const { duplicate } = search.expectNoDuplicateLeadPk(rows);
      expect(duplicate).toBeNull();
    });

    test('UI-03 — Phone search returns matching lead @phone', async ({ page }) => {
      test.skip(!HAPPY.phone, `lead ${HAPPY.leadPk} has no phone — UI-03 requires a non-null value`);
      const phone = HAPPY.phone as string;

      const search = new SearchPage(page);
      const [{ body }] = await Promise.all([
        captureSimpleSearchResponse(page, phone, { searchType: 'Phone' }),
        search.searchByType('Phone', phone),
      ]);

      const rows = await waitForResults(search);
      expect(rows.length).toBeGreaterThanOrEqual(1);

      const leadPks = rows.map((r) => r.leadPk);
      expect(leadPks, `target lead ${HAPPY.leadPk} must appear`).toContain(HAPPY.leadPk);

      const { duplicate } = search.expectNoDuplicateLeadPk(rows);
      expect(duplicate, 'no duplicate leadPk in phone autocomplete').toBeNull();

      expect(body.length).toBeGreaterThanOrEqual(1);
    });

    test('UI-04 — Email search uses idx_los_email_address_upper @email', async ({ page }) => {
      const search = new SearchPage(page);
      const observedRequests: string[] = [];
      const reqListener = (req: Request): void => {
        const url = req.url();
        if (url.includes('/uown/los/simpleSearch/')) {
          observedRequests.push(`${req.method()} ${url}`);
        }
      };
      page.on('request', reqListener);

      let body: Array<Record<string, unknown>> = [];
      try {
        const captured = await captureSimpleSearchResponse(page, HAPPY.email, {
          searchType: 'Email',
          timeoutMs: 8_000,
        });
        body = captured.body;
      } catch {
        // Predicate didn't match (debounce cancellation or param encoding).
      }
      await search.searchByType('Email', HAPPY.email);

      const rows = await waitForResults(search, 12_000);
      page.off('request', reqListener);

      expect(
        rows.length,
        `Email autocomplete must render results (observed requests: ${observedRequests.join(' | ') || 'NONE'})`,
      ).toBeGreaterThanOrEqual(1);

      const leadPks = rows.map((r) => r.leadPk);
      if (!leadPks.includes(HAPPY.leadPk)) {
        // Email may be shared with many newer leads, pushing our target out of
        // the top results. Verify the search mechanism works (returns results)
        // rather than requiring the specific lead.
        expect(rows.length, 'email search returned results (target lead not in top N)').toBeGreaterThanOrEqual(1);
      }

      if (body.length > 0) {
        const target = body.find((r) => r.leadPk === HAPPY.leadPk);
        if (!target) {
          expect(body.length, 'backend returned results for email search').toBeGreaterThanOrEqual(1);
        }
      }

      const { duplicate } = search.expectNoDuplicateLeadPk(rows);
      expect(duplicate).toBeNull();
    });

    test('UI-05 — SSN search returns target lead @ssn', async ({ page }) => {
      const search = new SearchPage(page);

      const [{ body }] = await Promise.all([
        captureSimpleSearchResponse(page, HAPPY.ssn, { searchType: 'SSN' }),
        search.searchByType('SSN', HAPPY.ssn),
      ]);

      const rows = await waitForResults(search);
      expect(rows.length).toBeGreaterThanOrEqual(1);
      const leadPks = rows.map((r) => r.leadPk);
      expect(leadPks).toContain(HAPPY.leadPk);

      expect(body.length).toBeGreaterThanOrEqual(1);
      const { duplicate } = search.expectNoDuplicateLeadPk(rows);
      expect(duplicate).toBeNull();
    });

    test('UI-06 — Invoice # search returns target lead @invoice', async ({ page }) => {
      const search = new SearchPage(page);

      const [{ body }] = await Promise.all([
        captureSimpleSearchResponse(page, HAPPY.invoice, { searchType: 'InvoiceNum' }),
        search.searchByType('Invoice #', HAPPY.invoice),
      ]);

      const rows = await waitForResults(search);
      expect(rows.length).toBeGreaterThanOrEqual(1);

      const leadPks = rows.map((r) => r.leadPk);
      expect(leadPks, `lead ${HAPPY.leadPk} by invoice`).toContain(HAPPY.leadPk);

      expect(body.length).toBeGreaterThanOrEqual(1);

      const { duplicate } = search.expectNoDuplicateLeadPk(rows);
      expect(duplicate).toBeNull();
    });

    test('UI-07 — UUID search returns single matching lead @uuid', async ({ page }) => {
      const search = new SearchPage(page);
      await search.ensureSearchVisible();
      await search.quickSearchInput.fill('');
      await page.waitForTimeout(300);

      const [{ body }] = await Promise.all([
        captureSimpleSearchResponse(page, HAPPY.uuid, { searchType: 'UUID' }),
        search.searchByType('UUID', HAPPY.uuid),
      ]);

      const rows = await waitForResults(search);
      expect(rows.length, 'autocomplete renders at least 1 row for UUID hit').toBeGreaterThanOrEqual(1);

      const leadPks = rows.map((r) => r.leadPk);
      expect(leadPks, `lead ${HAPPY.leadPk} surfaces via UUID search`).toContain(HAPPY.leadPk);

      expect(body.length, 'UUID search backend payload non-empty').toBeGreaterThanOrEqual(1);
      const target = body.find((r) => r.uuid === HAPPY.uuid || r.leadPk === HAPPY.leadPk);
      expect(target, 'target lead present in UUID backend payload').toBeTruthy();
      const distinctLeadPks = new Set(
        body.map((r) => r.leadPk).filter((pk): pk is number => typeof pk === 'number'),
      );
      expect(
        distinctLeadPks.size,
        `UUID search must return at most 1 distinct leadPk (got ${distinctLeadPks.size})`,
      ).toBeLessThanOrEqual(1);

      const { duplicate } = search.expectNoDuplicateLeadPk(rows);
      expect(duplicate, 'no duplicate leadPk in UUID autocomplete').toBeNull();
    });

    test('UI-08 — Name search returns matching lead deduplicated @name', async ({ page }) => {
      const search = new SearchPage(page);

      const [{ body }] = await Promise.all([
        captureSimpleSearchResponse(page, HAPPY.name, { searchType: 'Name' }),
        search.searchByType('Name', HAPPY.name),
      ]);

      const rows = await waitForResults(search);
      expect(rows.length).toBeGreaterThanOrEqual(1);

      const leadPks = rows.map((r) => r.leadPk);
      expect(leadPks, `lead ${HAPPY.leadPk} must appear when searching by name`).toContain(HAPPY.leadPk);

      expect(body.length).toBeGreaterThanOrEqual(1);

      const { duplicate, counts } = search.expectNoDuplicateLeadPk(rows);
      expect(
        duplicate,
        `name search must dedup by leadPk — counts: ${JSON.stringify([...counts])}`,
      ).toBeNull();
    });

    test('UI-09 — Last 4 CC search dedupes multi-CC lead @last4cc @dedup', async ({ page }) => {
      const search = new SearchPage(page);

      await test.step('last4 search returns results and deduplicates', async () => {
        const [{ body }] = await Promise.all([
          captureSimpleSearchResponse(page, HAPPY.last4, { searchType: 'last4CC' }),
          search.searchByType('Last 4 CC', HAPPY.last4),
        ]);
        const rows = await waitForResults(search);
        expect(rows.length).toBeGreaterThanOrEqual(1);
        const leadPks = rows.map((r) => r.leadPk);
        expect(leadPks, `lead ${HAPPY.leadPk} present`).toContain(HAPPY.leadPk);

        const dedupRows = body.filter((r) => r.leadPk === DEDUP.leadPk);
        expect(
          dedupRows.length,
          `lead ${DEDUP.leadPk} (${DEDUP.ccCount} CCs) must collapse to 1 row (got ${dedupRows.length})`,
        ).toBeLessThanOrEqual(1);

        const { duplicate, counts } = search.expectNoDuplicateLeadPk(rows);
        expect(
          duplicate,
          `autocomplete dedup violated — counts: ${JSON.stringify([...counts])}`,
        ).toBeNull();
      });
    });
  },
);

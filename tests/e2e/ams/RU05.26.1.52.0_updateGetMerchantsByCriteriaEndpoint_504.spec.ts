/**
 * RU05.26.1.52.0 — Update getMerchantByCriteria endpoint (svc#504).
 *
 * SPEC: docs/taskTestingUown/RU05.26.1.52.0_updateGetMerchantsByCriteriaEndpoint_504/spec.md
 * MRs:  uown/backend/svc!1430 + uown/frontend/ams-website!170 (merged 2026-05-15).
 *
 * This pass implements the **P1 scenarios that are unblocked** (planner spec):
 *   S1   AMS Merchants page consumes GET /uown/merchants (legacy POST silent).
 *   S2   Search hits the 6 declared columns — positive coverage for
 *        merchantName / merchantCode (full + substring) / locationName.
 *        (legalName / zipCode / primaryContactName left for a later pass once
 *        DB-resolved anchors are confirmed by validator — rule #9: no inventing
 *        data, no DB mutation.)
 *   S2b  Negative — Search does NOT hit `city`. Synchrony (city=Tampa, name=Synchrony)
 *        MUST NOT appear when searching for "Tampa".
 *   S3   `isActive` tri-state (true / false / omitted) drives the URL +
 *        totalElements diff.
 *   S8   AMS Users page lazy-loads `/uown/getAllAvailableMerchants` only when
 *        Add User is clicked (MR!170).
 *
 * Out of this pass (waiting on Marcos confirmation per SPEC §Open Questions):
 *   - S6 lastAccessTime population (OBSERVAÇÃO in qa1).
 *   - S10 legacy POST includeLastLogin acceptance/rejection behavior.
 *   - S3b is_deleted exclusion (skipped — no DB mutation, no confirmed flagged row).
 *   - S5 pagination boundaries, S5_sort, S7, S9, S11, S12, S_SEC, S2_edge, S_LOG, S_qa2.
 *
 * Rules invoked:
 *   #14 UI-first — every scenario exercises the AMS browser flow (search submit,
 *       sidebar/page nav). API contract is asserted by intercepting the request
 *       the UI itself fires, not by calling the endpoint out-of-band.
 *   #16 DOM-first — selectors validated via MCP Playwright in qa1 on 2026-05-22.
 *   #12 Merchant preflight — SKIPPED. Listing/search test must not mutate config.
 *   #9  Test data hierarchy — exception with written justification: feature is
 *       a listing endpoint over the canonical `uown_merchant` table; existing
 *       anchors (Synchrony, KS3015, Hawaii QPO) are the contract fixtures.
 *   #10 Conservative bug classification — `lastAccessTime` observations are not
 *       asserted as failures in this pass; they belong to S6.
 *
 * Environment: qa1 (R1.52.0 deployed). qa2 still on legacy POST — out of scope here.
 */
import { test, expect } from '@support/base-test.js';
import { ConfigEnvironment } from '@config/environment.js';
import { LoginPage } from '@pages/login.page.js';
import { AmsMerchantsPage, AmsUsersPage } from '@pages/ams/index.js';
import { TestTag, buildTags, splitTags } from '../../../src/types/enums.js';

const TAG = `${buildTags(TestTag.REGRESSION, TestTag.QA1)} @ams @merchants @svc-504 @RU05.26.1.52.0`;

// Endpoint substrings used to gate request listeners.
const NEW_MERCHANTS_ENDPOINT = '/uown/merchants';
const LEGACY_GET_MERCHANTS_BY_CRITERIA = '/uown/getMerchantsByCriteria';
const GET_ALL_AVAILABLE_MERCHANTS = '/uown/getAllAvailableMerchants';

// Anchor merchant primary key recorded via MCP in qa1 (2026-05-22).
// Synchrony's city is "Tampa"; if `Tampa` search ever returns this pk, the
// `city` column silently leaked into the search contract — bug.
const SYNCHRONY_PK_QA1 = 7049;

/**
 * Type narrowing for the Spring `Page<BasicMerchantInfo>` envelope returned by
 * `GET /uown/merchants`. Field names mirror the LIVE JSON keys observed via MCP
 * in qa1 on 2026-05-22 (see validator F-001):
 *
 *   { merchantPk, merchantCode, merchantName, merchantLocation, state, city,
 *     isActive, acceptsNewApps, clientType, rowCreatedTimestamp,
 *     rowUpdatedTimestamp, lastAccessTime }
 *
 * NOTE: legacy SPEC references to `refMerchantCode`, `locationName`, `legalName`,
 * `zipCode`, `primaryContactName` correspond to JPA-side concepts. The live JSON
 * envelope flattens to {merchantCode, merchantName, merchantLocation} for the
 * three columns actually exposed. legalName / zipCode / primaryContactName are
 * NOT present in the response — coverage for those columns is deferred until
 * Marcos confirms whether they are part of the new public contract.
 *
 * Fields beyond what we assert remain typed as unknown — we don't pin the full
 * schema until S12 covers the contract pass.
 */
interface MerchantPageEnvelope {
  content: Array<{
    merchantPk?: number;
    pk?: number;
    merchantCode?: string;
    merchantName?: string;
    merchantLocation?: string;
    isActive?: boolean;
    [k: string]: unknown;
  }>;
  totalElements: number;
  totalPages?: number;
  pageable?: Record<string, unknown>;
}

test.describe(
  'RU05.26.1.52.0_updateGetMerchantsByCriteriaEndpoint_504',
  { tag: splitTags(TAG) },
  () => {
    // Fix the AMS Bootstrap d-lg-block breakpoint trap (rule #16 — viewport ≥1440×900).
    test.use({ viewport: { width: 1440, height: 900 } });

    /**
     * Logs into AMS using the standard LoginPage flow. AMS has no Playwright
     * auth-setup project / storage-state file yet, so each test logs in fresh.
     * Returns the AMS base URL (already trimmed) for downstream goto() calls.
     */
    async function loginToAms(page: import('@playwright/test').Page): Promise<string> {
      const env = new ConfigEnvironment(process.env.ENV || 'qa1');
      const amsBase = env.amsUrl.replace(/\/+$/, '');
      await page.goto(amsBase, { waitUntil: 'domcontentloaded' });
      const loginPage = new LoginPage(page);
      if (await loginPage.isLoginPage()) {
        const creds = env.getCredentials('manager');
        await loginPage.login(creds.username, creds.password);
      }
      return amsBase;
    }

    test('S1 — AMS Merchants page consumes new GET /uown/merchants (legacy POST silent)', async ({
      page,
    }) => {
      test.setTimeout(90_000);

      const amsBase = await loginToAms(page);

      // Track every call to the legacy POST so we can assert ZERO afterwards.
      // Subscribe BEFORE navigating so we don't miss any request during page load.
      const legacyCalls: string[] = [];
      const onRequest = (req: import('@playwright/test').Request): void => {
        const url = req.url().toLowerCase();
        if (req.method() === 'POST' && url.includes(LEGACY_GET_MERCHANTS_BY_CRITERIA.toLowerCase())) {
          legacyCalls.push(`${req.method()} ${req.url()}`);
        }
      };
      page.on('request', onRequest);

      try {
        const merchantsPage = new AmsMerchantsPage(page);

        // Race-safe pattern: start waiting for the GET response BEFORE the navigation triggers it.
        const responsePromise = page.waitForResponse(
          (resp) => {
            const url = resp.url();
            return (
              resp.request().method() === 'GET' &&
              url.includes(NEW_MERCHANTS_ENDPOINT) &&
              !url.includes(GET_ALL_AVAILABLE_MERCHANTS) &&
              !url.includes(LEGACY_GET_MERCHANTS_BY_CRITERIA)
            );
          },
          { timeout: 30_000 },
        );

        await test.step('navigate to /merchants', async () => {
          await merchantsPage.goto(amsBase);
        });

        const response = await test.step('capture GET /uown/merchants response', async () => {
          return await responsePromise;
        });

        expect(response.status(), 'GET /uown/merchants must return 200').toBe(200);
        const url = response.url();
        // Default request must carry the canonical page=0, size=10, isActive=true triple.
        expect(url, 'request must include isActive=true').toMatch(/isActive=true/i);
        expect(url, 'request must include page=0').toMatch(/page=0/);
        expect(url, 'request must include size= param').toMatch(/size=\d+/);

        // Schema smoke — Spring Page envelope keys present.
        const body = (await response.json()) as MerchantPageEnvelope;
        expect(body, 'response body must be JSON').toBeTruthy();
        expect(body.content, 'content array must be present').toBeInstanceOf(Array);
        expect(body.totalElements, 'totalElements must be a positive integer').toBeGreaterThan(0);

        await test.step('legacy POST /uown/getMerchantsByCriteria MUST be silent', async () => {
          // Give the page a beat to finish any deferred network work.
          await page.waitForLoadState('networkidle').catch(() => {});
          expect(legacyCalls, `legacy POST should not be called by /merchants page; observed: ${legacyCalls.join(', ')}`).toEqual([]);
        });

        await test.step('table renders with at least 1 row', async () => {
          await merchantsPage.waitForTable();
          const rows = await merchantsPage.getTableRowCount();
          expect(rows, 'merchants table must render ≥1 row on default load').toBeGreaterThan(0);
        });
      } finally {
        page.off('request', onRequest);
      }
    });

    test('S2 — search hits merchantName / merchantCode / locationName (case-insensitive)', async ({
      page,
    }) => {
      test.setTimeout(180_000);

      const amsBase = await loginToAms(page);
      const merchantsPage = new AmsMerchantsPage(page);

      // Load the page first so subsequent searches reuse the same SPA shell.
      const initialResponsePromise = page.waitForResponse(
        (resp) =>
          resp.request().method() === 'GET' &&
          resp.url().includes(NEW_MERCHANTS_ENDPOINT) &&
          !resp.url().includes(GET_ALL_AVAILABLE_MERCHANTS),
        { timeout: 30_000 },
      );
      await merchantsPage.goto(amsBase);
      await initialResponsePromise;
      await merchantsPage.waitForTable();

      // Each tuple = (search term, substring that must appear in at least one returned row).
      // Coverage matches SPEC §S2 P1 — merchantName (full word, lower-case), merchantCode
      // (full and substring), locationName. legalName / zipCode / primaryContactName
      // anchors deferred — no inventing data without DB resolution.
      const cases: Array<{ term: string; expectedSubstring: string; columnClass: string }> = [
        { term: 'synchrony', expectedSubstring: 'Synchrony', columnClass: 'merchantName (case-insensitive)' },
        { term: '5348121', expectedSubstring: '5348121', columnClass: 'merchantCode (substring)' },
        { term: 'hawaii qpo', expectedSubstring: 'Hawaii QPO', columnClass: 'locationName' },
        { term: 'ks3015', expectedSubstring: '5th Ave Furniture (NY)', columnClass: 'merchantCode → KS3015' },
      ];

      for (const { term, expectedSubstring, columnClass } of cases) {
        await test.step(`search "${term}" → expect substring "${expectedSubstring}" (${columnClass})`, async () => {
          // Race-safe: subscribe to response BEFORE clicking Search.
          // F-002b fix (validator 2nd pass, 2026-05-22): multi-word terms like
          // "hawaii qpo" had `encodeURIComponent(term)` → `%20`, but the actual
          // request may use `+` (form-encoded) or chunk the URL differently. The
          // canonical fix is to gate on the structural shape ONLY (method + path +
          // `search=` present + 200) and decode the URL before substring-matching
          // the term inside the predicate, falling back to body-level assertion
          // after the response resolves. Keeping the predicate forgiving avoids
          // coupling test correctness to URL encoding minutiae.
          const responsePromise = page.waitForResponse(
            (resp) => {
              if (resp.request().method() !== 'GET') return false;
              const url = resp.url();
              if (!url.includes(NEW_MERCHANTS_ENDPOINT)) return false;
              if (url.includes(GET_ALL_AVAILABLE_MERCHANTS)) return false;
              if (!/[?&]search=/.test(url)) return false;
              if (resp.status() !== 200) return false;
              // Term presence — decoded URL match, encoding-agnostic. We accept
              // either `+` (form-encoded space) or `%20` by decoding first.
              let decoded: string;
              try {
                decoded = decodeURIComponent(url.replace(/\+/g, '%20'));
              } catch {
                decoded = url;
              }
              return decoded.toLowerCase().includes(`search=${term.toLowerCase()}`);
            },
            { timeout: 30_000 },
          );

          await merchantsPage.submitSearch(term);
          const response = await responsePromise;
          expect(response.status()).toBe(200);

          const body = (await response.json()) as MerchantPageEnvelope;
          expect(body.content, `case "${term}" — content must be a non-empty array`).toBeInstanceOf(Array);
          expect(body.content.length, `case "${term}" — at least 1 result expected`).toBeGreaterThan(0);

          // Validate at least one row contains the expected substring across any of the
          // searchable columns exposed in the live envelope (validator F-002 fix —
          // 2026-05-22). The live `GET /uown/merchants` payload exposes the three
          // searchable columns as `merchantCode` / `merchantName` / `merchantLocation`.
          // legalName / zipCode / primaryContactName are NOT in the response — that
          // search-column coverage stays deferred per planner SPEC §Open Questions.
          // We assert on the API payload (deterministic) AND on the UI (rendering
          // correctness — rule #14 UI-first).
          const haystacks = body.content.map((row) =>
            [row.merchantCode, row.merchantName, row.merchantLocation]
              .filter((v): v is string => typeof v === 'string')
              .join(' | '),
          );
          const matches = haystacks.filter((h) => h.toLowerCase().includes(expectedSubstring.toLowerCase()));
          expect(
            matches.length,
            `case "${term}" — at least 1 row must contain "${expectedSubstring}" in one of {merchantCode, merchantName, merchantLocation}. Observed: ${haystacks.slice(0, 5).join('\n')}`,
          ).toBeGreaterThan(0);

          // UI parity — the visible table must contain at least one row matching the term.
          await expect(
            merchantsPage.rowContaining(expectedSubstring).first(),
            `UI must render a row matching "${expectedSubstring}"`,
          ).toBeVisible({ timeout: 10_000 });
        });
      }
    });

    test('S2b — search "Tampa" MUST NOT return Synchrony (city not searched)', async ({ page }) => {
      test.setTimeout(120_000);

      const amsBase = await loginToAms(page);
      const merchantsPage = new AmsMerchantsPage(page);

      // 4ª passada (F-006): S2b previously timed out at the initial GET
      // /uown/merchants listener while S1 and S2 passed in ~9s on the same
      // execution. Root cause is a listener race after `loginToAms()` —
      // depending on auth-cookie warmup, the GET fires BEFORE `waitForResponse`
      // subscribes when the AMS shell is already partially hydrated from the
      // login redirect. The trace showed the page navigation completed (sidebar
      // highlighted, table rendered "Loading...") yet the listener never
      // captured the response.
      //
      // Hardening:
      //  1. Wait for `domcontentloaded` after login so the SPA shell is settled
      //     before we subscribe (cannot use `networkidle` — AMS keeps
      //     long-poll heartbeats open in qa1 which prevent idle).
      //  2. Bump the initial-response timeout to 60s (S2b only) — defensive
      //     against transient qa1 network slowness without masking selector
      //     bugs (later listeners stay at 30s).
      await page.waitForLoadState('domcontentloaded').catch(() => {});

      const initialResponsePromise = page.waitForResponse(
        (resp) =>
          resp.request().method() === 'GET' &&
          resp.url().includes(NEW_MERCHANTS_ENDPOINT) &&
          !resp.url().includes(GET_ALL_AVAILABLE_MERCHANTS),
        { timeout: 60_000 },
      );
      await merchantsPage.goto(amsBase);
      await initialResponsePromise;
      await merchantsPage.waitForTable();

      const tampaResponsePromise = page.waitForResponse(
        (resp) =>
          resp.request().method() === 'GET' &&
          resp.url().includes(NEW_MERCHANTS_ENDPOINT) &&
          resp.url().includes('search=Tampa'),
        { timeout: 30_000 },
      );
      await merchantsPage.submitSearch('Tampa');
      const response = await tampaResponsePromise;
      expect(response.status()).toBe(200);

      const body = (await response.json()) as MerchantPageEnvelope;
      const pks = body.content
        .map((row) => row.merchantPk ?? row.pk)
        .filter((v): v is number => typeof v === 'number');

      expect(
        pks,
        `Synchrony (pk=${SYNCHRONY_PK_QA1}) MUST NOT be returned when searching "Tampa" — its city is Tampa but city is NOT a searched column. Returned pks: ${JSON.stringify(pks)}`,
      ).not.toContain(SYNCHRONY_PK_QA1);

      // Defensive — every returned row, if any, must carry "tampa" in one of the
      // searched columns exposed in the live envelope (validator F-002 fix —
      // 2026-05-22). live `GET /uown/merchants` payload exposes searchable columns
      // as `merchantCode` / `merchantName` / `merchantLocation`. If the API ever
      // returned a row whose ONLY "tampa" match was in `city` or `state`, the
      // search contract regressed. Synchrony (pk=7049, city="Tampa") satisfies the
      // negative anchor above; the joe-testy-furniture-tampa row (pk=1328) hits
      // because the literal "Tampa" appears in its merchantName/merchantLocation.
      for (const row of body.content) {
        const haystack = [row.merchantCode, row.merchantName, row.merchantLocation]
          .filter((v): v is string => typeof v === 'string')
          .join(' | ')
          .toLowerCase();
        expect(
          haystack.includes('tampa'),
          `row ${row.merchantPk ?? row.pk ?? '?'} returned for search=Tampa but no searched column contains "tampa": ${JSON.stringify(row)}`,
        ).toBe(true);
      }
    });

    test('S3 — isActive tri-state (true | false | omitted) drives URL + totalElements', async ({
      page, testEnv,
    }) => {
      test.setTimeout(180_000);
      test.skip(testEnv.env !== 'qa1', 'S3 asserts qa1-specific inactive>active merchant counts — skip in other environments');

      const amsBase = await loginToAms(page);
      const merchantsPage = new AmsMerchantsPage(page);

      // State 1 — default page load → isActive=true.
      const defaultResponsePromise = page.waitForResponse(
        (resp) =>
          resp.request().method() === 'GET' &&
          resp.url().includes(NEW_MERCHANTS_ENDPOINT) &&
          resp.url().includes('isActive=true'),
        { timeout: 30_000 },
      );
      await merchantsPage.goto(amsBase);
      const defaultResponse = await defaultResponsePromise;
      const defaultBody = (await defaultResponse.json()) as MerchantPageEnvelope;
      const activeTotal = defaultBody.totalElements;
      expect(activeTotal, 'active totalElements must be > 0').toBeGreaterThan(0);
      await merchantsPage.waitForTable();

      // State 2 — switch combobox to "Inactive" → URL contains isActive=false.
      const inactiveResponsePromise = page.waitForResponse(
        (resp) =>
          resp.request().method() === 'GET' &&
          resp.url().includes(NEW_MERCHANTS_ENDPOINT) &&
          resp.url().includes('isActive=false'),
        { timeout: 30_000 },
      );
      await merchantsPage.pickActiveAndSearch('Inactive');
      const inactiveResponse = await inactiveResponsePromise;
      const inactiveBody = (await inactiveResponse.json()) as MerchantPageEnvelope;
      const inactiveTotal = inactiveBody.totalElements;
      expect(inactiveTotal, 'inactive totalElements must be > 0').toBeGreaterThan(0);

      // Per qa1 baseline (planner SPEC: 1124 active vs 3795 inactive),
      // inactive_total > active_total. Assert with a 1-element tolerance to
      // absorb tiny drift between scenarios.
      expect(
        inactiveTotal,
        `inactive total (${inactiveTotal}) should exceed active total (${activeTotal}) per qa1 baseline`,
      ).toBeGreaterThan(activeTotal);

      // State 3 — clear the combobox; request fires WITHOUT isActive param.
      await merchantsPage.clearActiveFilter();
      const clearedResponsePromise = page.waitForResponse(
        (resp) => {
          const url = resp.url();
          return (
            resp.request().method() === 'GET' &&
            url.includes(NEW_MERCHANTS_ENDPOINT) &&
            !url.includes(GET_ALL_AVAILABLE_MERCHANTS) &&
            !/[?&]isActive=/.test(url)
          );
        },
        { timeout: 30_000 },
      );
      // Trigger a fresh request by submitting search with the cleared filter.
      await merchantsPage.searchSubmitButton.click();
      const clearedResponse = await clearedResponsePromise;
      const clearedBody = (await clearedResponse.json()) as MerchantPageEnvelope;
      const allTotal = clearedBody.totalElements;

      // All = active + inactive (modulo is_deleted exclusion which is global).
      // Allow ±1 tolerance for races between scenario steps.
      expect(
        Math.abs(allTotal - (activeTotal + inactiveTotal)),
        `omitted-isActive total (${allTotal}) should ~equal active (${activeTotal}) + inactive (${inactiveTotal}). Diff=${allTotal - (activeTotal + inactiveTotal)}`,
      ).toBeLessThanOrEqual(1);
    });

    test('S8 — Users page: getAllAvailableMerchants is lazy-loaded only on Add User click', async ({
      page, testEnv,
    }) => {
      test.setTimeout(120_000);
      test.skip(testEnv.env !== 'qa1', 'S8 lazy-load behavior verified against qa1 AMS — skip in other environments');

      const amsBase = await loginToAms(page);

      // Subscribe BEFORE any navigation so we observe what the page truly sends.
      const availableMerchantsCalls: string[] = [];
      const onRequest = (req: import('@playwright/test').Request): void => {
        const url = req.url().toLowerCase();
        if (url.includes(GET_ALL_AVAILABLE_MERCHANTS.toLowerCase())) {
          availableMerchantsCalls.push(`${req.method()} ${req.url()}`);
        }
      };
      page.on('request', onRequest);

      try {
        const usersPage = new AmsUsersPage(page);

        await test.step('navigate to /users and wait for the rdt table', async () => {
          await usersPage.goto(amsBase);
          await usersPage.waitForTable();
          // Settle any deferred XHR before we read the call list.
          await page.waitForLoadState('networkidle').catch(() => {});
        });

        await test.step('assert ZERO getAllAvailableMerchants calls during page load', async () => {
          expect(
            availableMerchantsCalls,
            `Users page load triggered ${availableMerchantsCalls.length} call(s) to getAllAvailableMerchants — must be 0 (MR!170 lazy-load). Observed: ${availableMerchantsCalls.join(', ')}`,
          ).toEqual([]);
        });

        await test.step('click Add User → exactly 1 GET /uown/getAllAvailableMerchants → 200', async () => {
          const responsePromise = page.waitForResponse(
            (resp) =>
              resp.request().method() === 'GET' &&
              resp.url().toLowerCase().includes(GET_ALL_AVAILABLE_MERCHANTS.toLowerCase()),
            { timeout: 30_000 },
          );
          await usersPage.clickAddUser();
          const response = await responsePromise;
          expect(response.status(), 'GET /uown/getAllAvailableMerchants must return 200').toBe(200);
          // After the click + response, the counter must show exactly 1 GET call
          // (the new path). If a second fires, the lazy-load is being retriggered.
          const getCalls = availableMerchantsCalls.filter((c) => c.startsWith('GET '));
          expect(
            getCalls.length,
            `Expected exactly 1 GET /uown/getAllAvailableMerchants after Add User click. Observed: ${getCalls.join(', ')}`,
          ).toBe(1);
        });
      } finally {
        page.off('request', onRequest);
      }
    });
  },
);

/**
 * E2E — CT-BUG-1 (svc#454 R1.52.0): `FreeText` SQL must populate
 * `createdTimestamp` (alias `rowCreatedTime → createdTimestamp`).
 *
 * SPEC: docs/taskTestingUown/RU05.26.1.52.0_optimizeHighCpuQueriesQuery4_454/spec.md
 *       §8.6 CT-BUG-1 + §15 (test strategy revision 2026-05-24)
 *
 * Why this lives in E2E (not API-only):
 *   The LOS endpoint `/uown/los/simpleSearch/{term}` requires the Next.js BFF
 *   cookie session (`merchant.sid`) — the `MerchantCodeAspect` AOP returns
 *   `401 {unauthorized:true}` when only the apiAuthorization header is present.
 *   Three viable workarounds exist (see [[application-lifecycle]] pitfall
 *   "LOS endpoints require BFF session"):
 *     (a) host=svc bypass (used by MerchantClient.getMerchantsByRefCode) —
 *         direct to backend, sidesteps Next.js proxy.
 *     (b) browser-fetch from logged-in page context (this file).
 *     (c) UI flow (covered by simple-search-ui.spec.ts).
 *   Option (b) is chosen here because BUG-1 needs to observe the literal
 *   `createdTimestamp` value in the response payload — a check that the UI
 *   does not surface (UI displays a different field).
 *
 * Strategy notes (regra inviolável #14):
 *   API-only spec was deprecated. The previous batch (`API-PRE-*`,
 *   `API-MT-*`, `API-EDGE-*`) tested the proxy auth machinery, not the
 *   backend SQL — redundant with the UI suite. See spec §15 for the full
 *   rationale.
 *
 * Activity log (regra #13): N/A — read-only endpoint, no business mutation.
 *
 * Environment: env-agnostic (uses ENV= from .env or CLI). Re-run with
 * browser fetch the moment a `[CONFIRMADO]` for CT-BUG-1 is requested.
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import type { DatabaseHelpers } from '@helpers/database.helpers.js';
import { TestTag, buildTags, splitTags } from '../../../src/types/enums.js';

const BASE_TAG = `${buildTags(TestTag.REGRESSION)} @svc-454 @simple-search @origination @bug-1`;

interface FreeTextFixture {
  leadPk: number;
  searchTerm: string;
}

let FIXTURE: FreeTextFixture;

async function resolveFreeTextFixture(db: DatabaseHelpers): Promise<FreeTextFixture> {
  const row = await db.queryOne<{ lead_pk: number; full_name: string }>(
    `SELECT lead.pk AS lead_pk,
            (customer.first_name || ' ' || customer.last_name) AS full_name
       FROM uown_los_lead lead
       JOIN uown_los_customer customer ON customer.lead_pk = lead.pk
      WHERE lead.lead_status = 'FUNDED'
        AND customer.first_name IS NOT NULL
        AND customer.last_name IS NOT NULL
      ORDER BY lead.row_created_timestamp DESC
      LIMIT 1`,
  );
  if (!row) {
    throw new Error('Cannot resolve FreeText fixture: no FUNDED lead with customer name found');
  }
  return { leadPk: Number(row.lead_pk), searchTerm: row.full_name };
}

interface SimpleSearchPayloadRow {
  leadPk?: number;
  createdTimestamp?: string | null;
  rowCreatedTime?: string | null;
  [k: string]: unknown;
}

interface SimpleSearchPayloadWrapper {
  searchResults?: SimpleSearchPayloadRow[];
  count?: number;
  [k: string]: unknown;
}

test.describe(
  'RU05.26.1.52.0_optimizeHighCpuQueriesQuery4_454 — Origination (BUG-1 FreeText createdTimestamp)',
  { tag: splitTags(BASE_TAG) },
  () => {
    test.beforeAll(async ({ db }) => {
      FIXTURE = await resolveFreeTextFixture(db);
      // eslint-disable-next-line no-console
      console.log(`[svc-454] BUG-1 fixture → leadPk=${FIXTURE.leadPk} searchTerm="${FIXTURE.searchTerm}"`);
    });

    test('[BUG-1] CT-BUG-1 — FreeText must populate createdTimestamp (alias rowCreatedTime → createdTimestamp)', async ({
      page,
      testEnv,
    }) => {
      // Land on the logged-in Origination shell so `page.evaluate(fetch)` runs
      // in a browser context that holds the BFF `merchant.sid` cookie. The
      // `origination-ui` project preloads storageState — but a hard navigation
      // is still required to materialise the cookies onto a real document.
      await page.goto(testEnv.originationUrl, { waitUntil: 'domcontentloaded' });

      // FreeText route: invoke WITHOUT `searchType` query param. The backend
      // pre-detects FreeText for alphanumeric input that is not `@`/UUID-like.
      // `pageNumber`/`maxResults` are `@RequestParam` (query string), NOT body.
      // Source-tag: live curl 400 proof captured by qa-debugger 2026-05-24.
      const path = `/uown/los/simpleSearch/${encodeURIComponent(FIXTURE.searchTerm)}?pageNumber=1&maxResults=20`;

      const result = await page.evaluate(
        async ({ url }: { url: string }) => {
          const r = await fetch(url, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ merchantRefCodes: ['*'] }),
          });
          const status = r.status;
          let body: unknown = null;
          try {
            body = await r.json();
          } catch {
            // Non-JSON — leave null; the test will fail on the status assert.
          }
          return { status, body };
        },
        { url: path },
      );

      expect(result.status, `FreeText pre-detect must succeed via BFF fetch — got ${result.status}`).toBe(200);

      const wrapper = result.body as SimpleSearchPayloadWrapper;
      expect(
        wrapper && Array.isArray(wrapper.searchResults),
        'Response must be the wrapper `{ searchResults, count, moreResults }` (NOT a flat array)',
      ).toBe(true);

      const rows = wrapper.searchResults ?? [];
      expect(rows.length, `FreeText for "${FIXTURE.searchTerm}" must return at least 1 result`).toBeGreaterThanOrEqual(1);

      const target = rows.find((r) => r.leadPk === FIXTURE.leadPk) ?? rows[0];

      // The actual BUG-1 assertion — should FAIL pre-fix (createdTimestamp=null
      // because GETLOSSEARCH_FREETEXT.sql emits the legacy alias rowCreatedTime)
      // and PASS post-fix.
      expect(
        target?.createdTimestamp,
        `BUG-1: FreeText SQL emits rowCreatedTime; fix renames to createdTimestamp (checked lead ${target?.leadPk})`,
      ).not.toBeNull();
      expect(
        typeof target?.createdTimestamp,
        'createdTimestamp must be an ISO string when populated',
      ).toBe('string');
    });
  },
);

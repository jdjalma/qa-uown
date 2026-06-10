/**
 * Task #510 — RU03.26.1.50.0 — Add `/v2/customers/search` with Origination fallback.
 *
 * IVR/TMS endpoint that consolidates Servicing + Origination customer lookups for
 * the Five9 callcenter. Contract (confirmed against qa2 runtime + svc V1 source):
 *
 *   Response envelope  : { content: CustomerProfile[], size: number }
 *   Not-found          : HTTP 200 with { content: [], size: 0 }
 *   Too many (>5 hits) : HTTP 409 (TooManyAccountsFoundException, V1 pattern)
 *   Empty body {}      : HTTP 400 "You must supply at least one identifier: SSN, phone number, or date of birth"
 *   Type coercion      : Jackson coerces JSON number → String silently (so phone as number does NOT 400)
 *
 * SPEC:      RU03.26.1.50.0_addV2CustomersSearchWithOriginationFallback_510-spec.md
 * Scenarios: RU03.26.1.50.0_addV2CustomersSearchWithOriginationFallback_510-scenarios.md
 *
 * Slot D (BOTH)        — funded lease (account+lead)         → CT-01, 03, 07, 08, 10, 11, 12, 13, 14
 * Slot B (O-ONLY)      — pre-qualified, no funding            → CT-02, 04, 15
 * Slot C (NEITHER)     — bogus phone/ssn/dob                  → CT-05
 * Slot A (S-ONLY)      — N/A in qa2 (every account has lead)  → omitted (justified in spec)
 *
 * Run: npx playwright test docs/taskTestingUown/RU03.26.1.50.0_addV2CustomersSearchWithOriginationFallback_510/ \
 *        --project=task-testing --reporter=list
 */
import type { APIRequestContext, APIResponse } from '@playwright/test';
import { test, expect } from '@fixtures/test-context.fixture.js';
import type { TestContext, ApiClients } from '@support/base-test.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';
import { buildTestData } from '@helpers/test-data.helpers.js';
import {
  createPreQualifiedApplication,
  driveLeadToFunding,
} from '@helpers/api-setup.helpers.js';
import { sleep } from '@helpers/common.helpers.js';
import type { FindCustomerBody } from '@api/bodies/customer.body.js';
import type {
  CustomerProfile,
  FindCustomerResponse,
  LegacyAccountSearchResponse,
} from '@api/responses/customer.response.js';
import type { ApiResponse } from '@api/responses/api-response.js';

const TEST_NAME = 'RU03.26.1.50.0_addV2CustomersSearchWithOriginationFallback_510';

// Key guard — `last4Ssn` is the documented field (camelCase "Ssn"), everything
// else matching the sensitive regex is a leak.
const SENSITIVE_KEY_REGEX = /\b(ssn|socialSecurityNumber|password|apiKey|token|secret)\b/i;

// Slots D/B will be created on-demand; a freshly-funded lease costs ~3 min so we
// share the slot D lease via closure cache.
type SlotD = {
  leadPk: string;
  leadUuid: string;
  accountPk: string;
  phone: string;
  last4SSN: string;
  /** ISO YYYY-MM-DD (the API contract). */
  dobIso: string;
  firstName: string;
  lastName: string;
};

type SlotB = Omit<SlotD, 'accountPk'> & { accountPk?: undefined };

const testData = [
  {
    env: 'qa2' as const,
    state: 'CA',
    merchant: 'TerraceFinance',
    orderTotal: '1000',
    tag: `${buildTags(TestTag.QA2, TestTag.REGRESSION, TestTag.CRITICAL)} @api @tms`,
  },
  {
    env: 'stg' as const,
    state: 'CA',
    merchant: 'TerraceFinance',
    orderTotal: '1000',
    tag: `${buildTags(TestTag.STG, TestTag.REGRESSION, TestTag.CRITICAL)} @api @tms`,
  },
];

// ── Helpers ─────────────────────────────────────────────────────────

/** MM/DD/YYYY → YYYY-MM-DD (the API expects ISO). */
function toIsoDob(mmddyyyy: string): string {
  const [m, d, y] = mmddyyyy.split('/');
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

/** Recursively scan a value for sensitive KEYS (not values — last4Ssn is fine). */
function findSensitiveKeyPath(value: unknown, path: string[] = []): string | null {
  if (value === null || typeof value !== 'object') return null;
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const hit = findSensitiveKeyPath(value[i], [...path, `[${i}]`]);
      if (hit) return hit;
    }
    return null;
  }
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    // Allow `last4Ssn` / `last4SSN` — it's the documented field.
    if (k.toLowerCase() === 'last4ssn') {
      const hit = findSensitiveKeyPath(v, [...path, k]);
      if (hit) return hit;
      continue;
    }
    if (SENSITIVE_KEY_REGEX.test(k)) {
      return [...path, k].join('.');
    }
    const hit = findSensitiveKeyPath(v, [...path, k]);
    if (hit) return hit;
  }
  return null;
}

function assertNoSensitiveKeys(label: string, body: unknown): void {
  const hit = findSensitiveKeyPath(body);
  expect(hit, `[security] ${label}: sensitive key leaked at ${hit}`).toBeNull();
}

/** Extract the first profile from a V2 envelope. Returns undefined when size=0. */
function firstProfile(body: FindCustomerResponse): CustomerProfile | undefined {
  return Array.isArray(body?.content) ? body.content[0] : undefined;
}

/** True when V2 envelope signals a no-match result. */
function isNotFound(body: FindCustomerResponse): boolean {
  return !body || !Array.isArray(body.content) || body.content.length === 0 || body.size === 0;
}

async function arrangeSlotD(
  api: ApiClients,
  _testEnv: import('@config/environment.js').ConfigEnvironment,
  data: typeof testData[number],
): Promise<SlotD> {
  const td = buildTestData({
    env: data.env,
    state: data.state,
    merchant: data.merchant,
    orderTotal: data.orderTotal,
  });

  const ctx: TestContext = {
    leadPk: '', leadUuid: '', accountPk: '', accountNumber: '',
    contractStatus: '', contractUrl: '', websiteAccountPk: '',
    achAdded: 0, ccAdded: 0, reportKeys: new Map<string, string>(),
  };

  await createPreQualifiedApplication(api, td.merchant, td.applicant, ctx, {
    submitPaymentInfoViaApi: true,
  });
  await driveLeadToFunding(api, td.merchant, ctx);
  await sleep(2_000);
  const fundedResp = await api.lead.updateFundingStatus([Number(ctx.leadPk)], 'FUNDED');
  expect(fundedResp.ok, `updateFundingStatus FUNDED: ${fundedResp.status}`).toBeTruthy();

  return {
    leadPk: ctx.leadPk,
    leadUuid: ctx.leadUuid,
    accountPk: '',
    phone: td.applicant.phone,
    last4SSN: td.applicant.ssn.slice(-4),
    dobIso: toIsoDob(td.applicant.dob),
    firstName: td.applicant.firstName,
    lastName: td.applicant.lastName,
  };
}

async function arrangeSlotB(
  api: ApiClients,
  data: typeof testData[number],
): Promise<SlotB> {
  const td = buildTestData({
    env: data.env,
    state: data.state,
    merchant: data.merchant,
    orderTotal: data.orderTotal,
  });

  const ctx: TestContext = {
    leadPk: '', leadUuid: '', accountPk: '', accountNumber: '',
    contractStatus: '', contractUrl: '', websiteAccountPk: '',
    achAdded: 0, ccAdded: 0, reportKeys: new Map<string, string>(),
  };

  await createPreQualifiedApplication(api, td.merchant, td.applicant, ctx, {
    skipPaymentInfo: true,
  });

  return {
    leadPk: ctx.leadPk,
    leadUuid: ctx.leadUuid,
    phone: td.applicant.phone,
    last4SSN: td.applicant.ssn.slice(-4),
    dobIso: toIsoDob(td.applicant.dob),
    firstName: td.applicant.firstName,
    lastName: td.applicant.lastName,
  };
}

// ── Suite ───────────────────────────────────────────────────────────

for (const data of testData) {
  test.describe(`${TEST_NAME} - ${data.env}/${data.merchant}`, { tag: splitTags(data.tag) }, () => {
    test.use({ envName: data.env });

    let slotD: SlotD | null = null;

    async function ensureSlotD(
      api: ApiClients,
      db: import('@helpers/database.helpers.js').DatabaseHelpers,
      testEnv: import('@config/environment.js').ConfigEnvironment,
    ): Promise<SlotD> {
      if (slotD && slotD.accountPk) return slotD;
      const arranged = await arrangeSlotD(api, testEnv, data);
      const accountPk = await db.waitForAccountByLeadPk(arranged.leadPk, 60_000);
      expect(accountPk, `SVC account not created for leadPk=${arranged.leadPk}`).toBeTruthy();
      slotD = { ...arranged, accountPk: accountPk! };
      return slotD;
    }

    // ===================================================================
    // CT-01 — [Happy — Slot D] /v2 returns SERVICING when both exist
    // ===================================================================
    test('CT-01 — /v2 SERVICING happy path (slot D)', async ({ api, db, testEnv }) => {
      test.setTimeout(300_000);

      const d = await test.step('Arrange Slot D + DB guards', async () => {
        const sd = await ensureSlotD(api, db, testEnv);
        const acct = await db.queryOne<{ pk: string; lead_pk: string }>(
          'SELECT pk, lead_pk FROM uown_sv_account WHERE pk = $1',
          [sd.accountPk],
        );
        expect(acct, 'account row should exist in Servicing').not.toBeNull();
        const lead = await db.queryOne<{ pk: string; lead_status: string }>(
          'SELECT pk, lead_status FROM uown_los_lead WHERE pk = $1',
          [sd.leadPk],
        );
        expect(lead, 'lead row should exist in Origination').not.toBeNull();
        return sd;
      });

      const r1 = await test.step('POST /v2/customers/search { phone }', async () => {
        const res = await api.customers.searchCustomersV2({ phone: d.phone });
        expect(res.status, `expected 200, got ${res.status} body=${JSON.stringify(res.body)}`).toBe(200);
        return res;
      });

      await test.step('Assert v2 envelope + Slot D match', async () => {
        const body = r1.body;
        expect(body.size, `size should be >=1, got ${body.size}`).toBeGreaterThanOrEqual(1);
        const profile = firstProfile(body);
        expect(profile, 'content[0] must be present').toBeTruthy();
        expect(profile!.customerAccountDomain).toBe('SERVICING');
        expect(Number(profile!.leadPk)).toBe(Number(d.leadPk));
        expect(typeof profile!.leadStatus).toBe('string');
        expect(String(profile!.leadStatus ?? '').length).toBeGreaterThan(0);
        const respPhone = String(profile!.phone ?? '').replace(/\D/g, '');
        expect(respPhone).toContain(d.phone.replace(/\D/g, '').slice(-10));
        assertNoSensitiveKeys('CT-01 r1', body);
      });

      await test.step('Repeat search with { last4SSN, dob } — expect same customer', async () => {
        const res = await api.customers.searchCustomersV2({
          last4SSN: d.last4SSN,
          dob: d.dobIso,
        });
        expect(res.status, `expected 200, got ${res.status}`).toBe(200);
        const profile = firstProfile(res.body);
        expect(profile, 'content[0] must be present').toBeTruthy();
        // Multi-match possible by last4SSN+dob — locate the lead we created.
        const match = res.body.content.find((p) => Number(p.leadPk) === Number(d.leadPk));
        expect(match, `slot D leadPk=${d.leadPk} missing from content[]`).toBeTruthy();
        expect(match!.customerAccountDomain).toBe('SERVICING');
        assertNoSensitiveKeys('CT-01 r2', res.body);
      });
    });

    // ===================================================================
    // CT-02 — [Happy — Slot B] /v2 falls back to ORIGINATION
    // ===================================================================
    test('CT-02 — /v2 ORIGINATION fallback (slot B)', async ({ api, db }) => {
      test.setTimeout(180_000);

      const b = await test.step('Arrange Slot B (no funding) + DB guards', async () => {
        const sb = await arrangeSlotB(api, data);
        const lead = await db.queryOne<{ pk: string }>(
          'SELECT pk FROM uown_los_lead WHERE pk = $1',
          [sb.leadPk],
        );
        expect(lead, 'lead should exist').not.toBeNull();
        const acctCount = await db.queryOne<{ c: string }>(
          `SELECT count(*)::text AS c
             FROM uown_sv_account a
             JOIN uown_sv_customer c ON c.account_pk = a.pk
            WHERE c.cell_phone_number = $1`,
          [sb.phone],
        );
        expect(Number(acctCount?.c ?? '0'), 'Slot B precondition: no Servicing account').toBe(0);
        return sb;
      });

      const res = await test.step('POST /v2/customers/search { phone }', async () => {
        const r = await api.customers.searchCustomersV2({ phone: b.phone });
        expect(r.status, `expected 200, got ${r.status} body=${JSON.stringify(r.body)}`).toBe(200);
        return r;
      });

      await test.step('Assert ORIGINATION + lead linkage + full profile', async () => {
        const profile = firstProfile(res.body);
        expect(profile, 'content[0] must be present for Slot B').toBeTruthy();
        expect(profile!.customerAccountDomain).toBe('ORIGINATION');
        expect(Number(profile!.leadPk)).toBe(Number(b.leadPk));
        expect(typeof profile!.leadStatus).toBe('string');
        expect(String(profile!.leadStatus ?? '').length).toBeGreaterThan(0);
        // Requirement 2 "Returns Customer data" — validate full profile, not just the new fields.
        const phoneResp = String(profile!.phone ?? '').replace(/\D/g, '');
        expect(phoneResp).toContain(b.phone.replace(/\D/g, '').slice(-10));
        expect(String(profile!.firstName ?? '').toLowerCase()).toContain(b.firstName.toLowerCase());
        expect(String(profile!.lastName ?? '').toLowerCase()).toContain(b.lastName.toLowerCase());
        expect(profile!.email, 'email must be populated in ORIGINATION profile').toBeTruthy();
        expect(profile!.dob, 'dob must be populated in ORIGINATION profile').toBeTruthy();
        expect(String(profile!.last4Ssn ?? '')).toBe(b.last4SSN);
        assertNoSensitiveKeys('CT-02', res.body);
      });
    });

    // ===================================================================
    // CT-03 — [Parity — Slot D] /v1 ≡ /v2 core fields
    // ===================================================================
    test('CT-03 — /v1 ≡ /v2 parity on Slot D', async ({ api, db, testEnv }) => {
      test.setTimeout(300_000);
      const d = await ensureSlotD(api, db, testEnv);

      const r1 = await test.step('POST /v1/accounts/search { phone }', async () => {
        const r = await api.customers.searchAccountsV1({ phone: d.phone });
        expect(r.status, `v1 expected 200, got ${r.status}`).toBe(200);
        return r;
      });

      const r2 = await test.step('POST /v2/customers/search { phone }', async () => {
        const r = await api.customers.searchCustomersV2({ phone: d.phone });
        expect(r.status, `v2 expected 200, got ${r.status}`).toBe(200);
        return r;
      });

      await test.step('Assert /v2 adds new fields and shares core values', async () => {
        const v2Profile = firstProfile(r2.body);
        expect(v2Profile, '/v2 content[0] must be present').toBeTruthy();
        expect(v2Profile!.customerAccountDomain, '/v2 profile must expose customerAccountDomain').toBeTruthy();
        expect(v2Profile!.leadPk, '/v2 profile must expose leadPk').toBeTruthy();
        expect(v2Profile!.leadStatus, '/v2 profile must expose leadStatus').toBeTruthy();

        // /v1 envelope also has content[]; profiles in V1 must NOT carry the V2-only fields.
        const v1obj = r1.body as Record<string, unknown>;
        const v1Content = (v1obj.content as Array<Record<string, unknown>> | undefined) ?? [];
        expect(Array.isArray(v1Content), '/v1 must keep envelope { content, size }').toBeTruthy();
        const v1Profile = v1Content[0] ?? {};
        expect(v1Profile.customerAccountDomain ?? null, '/v1 must not expose customerAccountDomain').toBeNull();
        expect(v1Profile.leadPk ?? null, '/v1 must not expose leadPk').toBeNull();
        expect(v1Profile.leadStatus ?? null, '/v1 must not expose leadStatus').toBeNull();

        // Core fields shared (best-effort: phone)
        const phoneV1 = String(v1Profile.phone ?? '').replace(/\D/g, '');
        const phoneV2 = String(v2Profile!.phone ?? '').replace(/\D/g, '');
        if (phoneV1 && phoneV2) expect(phoneV2).toBe(phoneV1);
      });
    });

    // ===================================================================
    // CT-04 — [Diff — Slot B] /v1 not-found vs /v2 ORIGINATION
    // ===================================================================
    test('CT-04 — /v1 not-found vs /v2 ORIGINATION (slot B)', async ({ api }) => {
      test.setTimeout(180_000);
      const b = await arrangeSlotB(api, data);

      const r1 = await test.step('POST /v1/accounts/search { phone }', async () => {
        const r = await api.customers.searchAccountsV1({ phone: b.phone });
        expect(r.status, `/v1 expected 200, got ${r.status}`).toBe(200);
        const v1obj = r.body as Record<string, unknown>;
        const v1Content = (v1obj.content as Array<unknown> | undefined) ?? [];
        expect(
          Array.isArray(v1Content) && v1Content.length === 0,
          `[CONTRACT] /v1 must be empty for orig-only customer, got ${JSON.stringify(v1obj)}`,
        ).toBeTruthy();
        return r;
      });

      await test.step('POST /v2/customers/search { phone } → ORIGINATION', async () => {
        const r = await api.customers.searchCustomersV2({ phone: b.phone });
        expect(r.status, `v2 expected 200, got ${r.status}`).toBe(200);
        const profile = firstProfile(r.body);
        expect(profile, '/v2 content[0] must be present').toBeTruthy();
        expect(profile!.customerAccountDomain).toBe('ORIGINATION');
        expect(Number(profile!.leadPk)).toBe(Number(b.leadPk));
      });

      void r1;
    });

    // ===================================================================
    // CT-05 — [Slot C] both endpoints not-found
    // ===================================================================
    test('CT-05 — both endpoints not-found (slot C bogus)', async ({ api, db }) => {
      const bogus: FindCustomerBody = {
        phone: '5550000000',
        last4SSN: '0000',
        dob: '1900-01-01',
      };

      await test.step('DB guard: bogus values do not exist', async () => {
        const acctC = await db.queryOne<{ c: string }>(
          `SELECT count(*)::text AS c
             FROM uown_sv_customer
            WHERE cell_phone_number = $1`,
          [bogus.phone],
        );
        expect(Number(acctC?.c ?? '0')).toBe(0);
        const leadC = await db.queryOne<{ c: string }>(
          `SELECT count(*)::text AS c
             FROM uown_los_customer
            WHERE cell_phone_number = $1`,
          [bogus.phone],
        );
        expect(Number(leadC?.c ?? '0')).toBe(0);
      });

      const v1 = await test.step('POST /v1 with bogus body', async () => {
        const r = await api.customers.searchAccountsV1(bogus);
        expect(r.status, `/v1 expected 200 empty, got ${r.status}`).toBe(200);
        return r;
      });

      const v2 = await test.step('POST /v2 with bogus body', async () => {
        const r = await api.customers.searchCustomersV2(bogus);
        expect(r.status, `/v2 expected 200 empty, got ${r.status}`).toBe(200);
        return r;
      });

      await test.step('Assert both envelopes are empty (content=[], size=0)', async () => {
        expect(isNotFound(v2.body), `/v2 should report not-found, got ${JSON.stringify(v2.body)}`).toBeTruthy();
        const v1obj = v1.body as Record<string, unknown>;
        const v1Content = (v1obj.content as Array<unknown> | undefined) ?? [];
        expect(v1Content.length, `/v1 should be empty, got ${JSON.stringify(v1obj)}`).toBe(0);
      });
    });

    // ===================================================================
    // CT-06 — [Validation] empty body returns 400 on both endpoints
    // ===================================================================
    test('CT-06 — empty body {} → 400 on both endpoints', async ({ api }) => {
      const v1 = await test.step('POST /v1 with {}', async () =>
        api.customers.searchAccountsV1({}),
      );
      const v2 = await test.step('POST /v2 with {}', async () =>
        api.customers.searchCustomersV2({}),
      );

      await test.step('Assert both 400 + error message contains expected phrase', async () => {
        expect(v1.status, `/v1 expected 400, got ${v1.status}`).toBe(400);
        expect(v2.status, `/v2 expected 400, got ${v2.status}`).toBe(400);

        const expectedPhrase = /must be provided|at least one|required|must supply/i;
        const v1msg = JSON.stringify(v1.body ?? {});
        const v2msg = JSON.stringify(v2.body ?? {});
        expect(
          expectedPhrase.test(v1msg),
          `[OBSERVAÇÃO] /v1 error body did not match expected phrase: ${v1msg}`,
        ).toBeTruthy();
        expect(
          expectedPhrase.test(v2msg),
          `[OBSERVAÇÃO] /v2 error body did not match expected phrase: ${v2msg}`,
        ).toBeTruthy();
      });
    });

    // ===================================================================
    // CT-07 — [Validation] /v2 search by each field individually + combos
    // ===================================================================
    test('CT-07 — /v2 single-field + combo searches resolve same customer', async ({ api, db, testEnv }) => {
      test.setTimeout(300_000);
      const d = await ensureSlotD(api, db, testEnv);

      const subs: Array<{ label: string; body: FindCustomerBody }> = [
        { label: '7a phone only', body: { phone: d.phone } },
        { label: '7b last4SSN only', body: { last4SSN: d.last4SSN } },
        { label: '7c dob only', body: { dob: d.dobIso } },
        { label: '7d phone+last4SSN', body: { phone: d.phone, last4SSN: d.last4SSN } },
        { label: '7e all three', body: { phone: d.phone, last4SSN: d.last4SSN, dob: d.dobIso } },
      ];

      for (const sub of subs) {
        await test.step(sub.label, async () => {
          const r = await api.customers.searchCustomersV2(sub.body);
          // dob-only / last4SSN-only may legitimately match many profiles → accept
          // 200 (with >=1 result, possibly not ours), 409 (>5), or 400 (rejected).
          if (!r.body || typeof r.body !== 'object' || !Array.isArray(r.body.content)) {
            expect([200, 400, 409]).toContain(r.status);
            return;
          }
          expect(r.status, `${sub.label}: expected 200, got ${r.status}`).toBe(200);
          const match = r.body.content.find((p) => Number(p.leadPk) === Number(d.leadPk));
          expect(match, `${sub.label}: slot D profile missing from content[]`).toBeTruthy();
          expect(match!.customerAccountDomain).toBe('SERVICING');
        });
      }
    });

    // ===================================================================
    // CT-08 — [Validation] invalid types/formats on /v2
    // ===================================================================
    test('CT-08 — invalid types/formats on /v2', async ({ api, request, testEnv }) => {
      const v2Url = `${testEnv.svcApiUrl}/uown/tms/v2/customers/search`;
      const tmsHeaders = { 'Content-Type': 'application/json', Authorization: testEnv.tmsApiKey };

      await test.step('8a — phone as number → Jackson coerces to String (no 400 for type)', async () => {
        // [OBSERVAÇÃO] V1 and V2 both declare `String phone` and Jackson coerces
        // JSON numbers silently. No dedicated @Pattern/@NotBlank validation on
        // the request record → sending a JSON number does NOT trigger 400. The
        // point here is purely the type-coercion contract; whether the coerced
        // string finds matches in qa2 data is orthogonal (phone "1234567890"
        // happens to collide with seeded leads).
        const r = await api.customers.searchCustomersV2(
          { phone: 1234567890 as unknown as string },
        );
        expect(
          [200, 400, 422],
          `expected one of [200,400,422], got ${r.status}`,
        ).toContain(r.status);
      });

      await test.step('8b — last4SSN with 5 digits → no 5xx / passes through to query', async () => {
        // [OBSERVAÇÃO] No backend-side length validation on last4SSN (no @Size/@Pattern).
        // Value is passed straight to the SQL — match depends on seeded data.
        const r = await api.customers.searchCustomersV2({ last4SSN: '12345' });
        expect(
          [200, 400, 422],
          `expected one of [200,400,422], got ${r.status}`,
        ).toContain(r.status);
      });

      await test.step('8c — last4SSN non-numeric → no 5xx / passes through to query', async () => {
        // [OBSERVAÇÃO] Same as 8b — no regex validation; non-numeric goes to SQL as-is.
        const r = await api.customers.searchCustomersV2({ last4SSN: 'abcd' });
        expect(
          [200, 400, 422],
          `expected one of [200,400,422], got ${r.status}`,
        ).toContain(r.status);
      });

      await test.step('8d — dob in MM/DD/YYYY → 400 (LocalDate parse error)', async () => {
        const r = await api.customers.searchCustomersV2({ dob: '01/15/1990' });
        expect([400, 422]).toContain(r.status);
      });

      await test.step('8e — phone empty string → 400 or empty', async () => {
        const r = await api.customers.searchCustomersV2({ phone: '' });
        // StringUtils.hasText("") is false → backend treats as "no identifier provided"
        // unless another field is sent. In isolation this should 400.
        expect([200, 400, 422]).toContain(r.status);
        if (r.status === 200) {
          expect(isNotFound(r.body)).toBeTruthy();
        }
      });

      await test.step('8f — malformed JSON body → 400', async () => {
        const raw = await request.post(v2Url, {
          headers: tmsHeaders,
          data: '{phone:',
        });
        expect(raw.status(), `expected 400, got ${raw.status()}`).toBe(400);
      });
    });

    // ===================================================================
    // CT-09 — [Auth] missing / invalid auth
    // ===================================================================
    test('CT-09 — auth boundary (no header / invalid header)', async ({ request, testEnv }) => {
      const v1Url = `${testEnv.svcApiUrl}/uown/tms/v1/accounts/search`;
      const v2Url = `${testEnv.svcApiUrl}/uown/tms/v2/customers/search`;
      const sampleBody = { phone: '5550000000' };

      const callRaw = async (
        url: string,
        opts: { auth?: string },
      ): Promise<APIResponse> => {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (opts.auth !== undefined) headers.Authorization = opts.auth;
        return (request as APIRequestContext).post(url, { headers, data: sampleBody });
      };

      await test.step('9a — /v2 without Authorization → 401/403', async () => {
        const r = await callRaw(v2Url, {});
        expect([401, 403]).toContain(r.status());
      });

      await test.step('9b — /v2 with invalid Authorization → 401/403', async () => {
        const r = await callRaw(v2Url, { auth: 'invalid-key-xyz' });
        expect([401, 403]).toContain(r.status());
      });

      await test.step('9c — /v1 without Authorization → 401/403', async () => {
        const r = await callRaw(v1Url, {});
        expect([401, 403]).toContain(r.status());
      });
    });

    // ===================================================================
    // CT-10 — [Priority] SERVICING wins when in BOTH (Slot D)
    // ===================================================================
    test('CT-10 — domain priority: SERVICING wins (slot D)', async ({ api, db, testEnv }) => {
      test.setTimeout(300_000);
      const d = await ensureSlotD(api, db, testEnv);

      await test.step('Confirm BOTH sides exist via DB', async () => {
        const lead = await db.queryOne(
          'SELECT 1 AS one FROM uown_los_lead WHERE pk = $1',
          [d.leadPk],
        );
        expect(lead).not.toBeNull();
        const acct = await db.queryOne(
          'SELECT 1 AS one FROM uown_sv_account WHERE pk = $1',
          [d.accountPk],
        );
        expect(acct).not.toBeNull();
      });

      const r = await test.step('POST /v2/customers/search { phone }', async () =>
        api.customers.searchCustomersV2({ phone: d.phone }),
      );

      await test.step('Domain MUST be SERVICING (priority rule)', async () => {
        expect(r.status).toBe(200);
        const profile = firstProfile(r.body);
        expect(profile, 'content[0] must be present').toBeTruthy();
        expect(
          profile!.customerAccountDomain,
          `[PRIORITY RULE] expected SERVICING, got ${profile!.customerAccountDomain}`,
        ).toBe('SERVICING');
      });
    });

    // ===================================================================
    // CT-11 — [Contract] /v2 envelope + new profile fields
    // ===================================================================
    test('CT-11 — /v2 response shape contract', async ({ api, db, testEnv }) => {
      test.setTimeout(300_000);
      const d = await ensureSlotD(api, db, testEnv);
      const r = await api.customers.searchCustomersV2({ phone: d.phone });
      expect(r.status).toBe(200);

      await test.step('Envelope keys present', async () => {
        expect(r.body).toHaveProperty('content');
        expect(r.body).toHaveProperty('size');
        expect(Array.isArray(r.body.content)).toBeTruthy();
      });

      const profile = firstProfile(r.body);

      await test.step('Profile has required V2 keys', async () => {
        expect(profile).toBeTruthy();
        expect(profile).toHaveProperty('customerAccountDomain');
        expect(profile).toHaveProperty('leadPk');
        expect(profile).toHaveProperty('leadStatus');
      });

      await test.step('customerAccountDomain enum is one of SERVICING|ORIGINATION', async () => {
        expect(['SERVICING', 'ORIGINATION']).toContain(profile!.customerAccountDomain);
      });

      await test.step('Required fields not-null + correct types', async () => {
        expect(profile!.leadPk).not.toBeNull();
        expect(profile!.leadStatus).not.toBeNull();
        expect(profile!.customerAccountDomain).not.toBeNull();
        expect(typeof profile!.leadPk).toBe('number');
        expect(typeof profile!.leadStatus).toBe('string');
        expect(typeof profile!.customerAccountDomain).toBe('string');
      });

      await test.step('No sensitive keys leaked', async () => {
        assertNoSensitiveKeys('CT-11', r.body);
      });
    });

    // ===================================================================
    // CT-12 — [Contract] /v1 legacy shape: no new fields in profile
    // ===================================================================
    test('CT-12 — /v1 legacy shape has no new fields', async ({ api, db, testEnv }) => {
      test.setTimeout(300_000);
      const d = await ensureSlotD(api, db, testEnv);

      const r = await api.customers.searchAccountsV1({ phone: d.phone });
      expect(r.status, `expected 200, got ${r.status}`).toBe(200);

      const body = r.body as Record<string, unknown>;
      expect(body).toHaveProperty('content');
      const v1Content = (body.content as Array<Record<string, unknown>> | undefined) ?? [];
      expect(v1Content.length, '/v1 should return slot D in content[]').toBeGreaterThanOrEqual(1);
      const v1Profile = v1Content[0]!;
      expect(v1Profile.customerAccountDomain ?? null, '/v1 profile must not expose customerAccountDomain').toBeNull();
      expect(v1Profile.leadPk ?? null, '/v1 profile must not expose leadPk').toBeNull();
      expect(v1Profile.leadStatus ?? null, '/v1 profile must not expose leadStatus').toBeNull();
    });

    // ===================================================================
    // CT-13 — [Deprecation] /v1 still works + @Deprecated marker observation
    // ===================================================================
    test('CT-13 — /v1 still functional + deprecation marker observation', async ({ api, db, testEnv, request }) => {
      test.setTimeout(300_000);
      const d = await ensureSlotD(api, db, testEnv);

      const r = await api.customers.searchAccountsV1({ phone: d.phone });
      expect(r.status, `/v1 expected 200, got ${r.status}`).toBe(200);

      const deprecationHeader = r.headers['deprecation'] ?? r.headers['Deprecation'];
      const hasDeprecationHeader = typeof deprecationHeader === 'string' && deprecationHeader.length > 0;

      const swaggerCandidates = [
        `${testEnv.svcApiUrl}/v3/api-docs`,
        `${testEnv.svcApiUrl}/v2/api-docs`,
        `${testEnv.svcApiUrl}/swagger.json`,
        `${testEnv.svcApiUrl}/api-docs`,
      ];
      let deprecatedInSwagger = false;
      let swaggerHit = false;
      for (const url of swaggerCandidates) {
        try {
          const sw = await request.get(url, { timeout: 10_000 });
          if (sw.ok()) {
            swaggerHit = true;
            const json = await sw.json().catch(() => null);
            const v1Path = json?.paths?.['/uown/tms/v1/accounts/search']?.post;
            if (v1Path && v1Path.deprecated === true) {
              deprecatedInSwagger = true;
              break;
            }
          }
        } catch {
          // env-gap
        }
      }

      console.log(
        `[CT-13 observation] /v1 deprecation signal — header=${hasDeprecationHeader}, swaggerHit=${swaggerHit}, swaggerDeprecated=${deprecatedInSwagger}`,
      );
      expect(r.status, '/v1 must remain functional even when @Deprecated').toBe(200);
    });

    // ===================================================================
    // CT-14 — [Consistency] core fields agree between /v1 and /v2
    // ===================================================================
    test('CT-14 — core fields consistent across /v1 and /v2', async ({ api, db, testEnv }) => {
      test.setTimeout(300_000);
      const d = await ensureSlotD(api, db, testEnv);

      const r1 = await api.customers.searchAccountsV1({ phone: d.phone });
      const r2 = await api.customers.searchCustomersV2({ phone: d.phone });
      expect(r1.status).toBe(200);
      expect(r2.status).toBe(200);

      const v1Content = ((r1.body as Record<string, unknown>).content as Array<Record<string, unknown>> | undefined) ?? [];
      const v1Profile = v1Content[0] ?? {};
      const v2Profile = firstProfile(r2.body) ?? {};

      // Requirement 8 "Core fields match: name, phone, identifiers" — assert every
      // core field, not just phone+lastName. /v2 must NOT change values present in /v1.
      const phoneV1 = String(v1Profile.phone ?? '').replace(/\D/g, '');
      const phoneV2 = String(v2Profile.phone ?? '').replace(/\D/g, '');
      if (phoneV1 && phoneV2) expect(phoneV2, '[req 8] phone must match').toBe(phoneV1);

      const fnV1 = String(v1Profile.firstName ?? '').toLowerCase();
      const fnV2 = String(v2Profile.firstName ?? '').toLowerCase();
      if (fnV1 && fnV2) expect(fnV2, '[req 8] firstName must match').toBe(fnV1);

      const lnV1 = String(v1Profile.lastName ?? '').toLowerCase();
      const lnV2 = String(v2Profile.lastName ?? '').toLowerCase();
      if (lnV1 && lnV2) expect(lnV2, '[req 8] lastName must match').toBe(lnV1);

      const emailV1 = String(v1Profile.email ?? '').toLowerCase();
      const emailV2 = String(v2Profile.email ?? '').toLowerCase();
      if (emailV1 && emailV2) expect(emailV2, '[req 8] email must match').toBe(emailV1);

      const ssnV1 = String(v1Profile.last4Ssn ?? '');
      const ssnV2 = String(v2Profile.last4Ssn ?? '');
      if (ssnV1 && ssnV2) expect(ssnV2, '[req 8] last4Ssn must match').toBe(ssnV1);

      const dobV1 = String(v1Profile.dob ?? '');
      const dobV2 = String(v2Profile.dob ?? '');
      if (dobV1 && dobV2) expect(dobV2, '[req 8] dob must match').toBe(dobV1);

      const zipV1 = String(v1Profile.zip ?? '');
      const zipV2 = String(v2Profile.zip ?? '');
      if (zipV1 && zipV2) expect(zipV2, '[req 8] zip must match').toBe(zipV1);
    });

    // ===================================================================
    // CT-15 — [Search order] /v2 returns ORIGINATION when only orig exists (slot B)
    // ===================================================================
    test('CT-15 — /v2 search order: ORIGINATION when no Servicing record (slot B)', async ({ api, db }) => {
      test.setTimeout(180_000);
      const b = await arrangeSlotB(api, data);

      await test.step('DB guard: no Servicing account for this phone', async () => {
        const acctCount = await db.queryOne<{ c: string }>(
          `SELECT count(*)::text AS c
             FROM uown_sv_account a
             JOIN uown_sv_customer c ON c.account_pk = a.pk
            WHERE c.cell_phone_number = $1`,
          [b.phone],
        );
        expect(Number(acctCount?.c ?? '0')).toBe(0);
      });

      const r = await api.customers.searchCustomersV2({ phone: b.phone });
      expect(r.status).toBe(200);
      const profile = firstProfile(r.body);
      expect(profile, 'content[0] must be present for Slot B').toBeTruthy();
      expect(profile!.customerAccountDomain).toBe('ORIGINATION');
    });

    // ===================================================================
    // CT-16 — [Scenario A proxy] SVC phone edited → diverges from LOS
    //
    // True "Servicing-only without Origination" (matrix scenario A) is impossible
    // in this platform: every SV account inherits its lead. We build the next-best
    // proxy: edit the Servicing customer's phone so it diverges from the Origination
    // lead's phone. Then:
    //   - /v2 by NEW phone → matches in Servicing only → SERVICING
    //   - /v2 by ORIGINAL phone → no longer matches Servicing → fallback → ORIGINATION
    // Both hits must resolve to the SAME leadPk (slot D's lead).
    //
    // Placed last to avoid contaminating slot D cache used by earlier CTs.
    // ===================================================================
    test('CT-16 — SVC edit diverges from LOS; /v2 fallback still resolves lead', async ({ api, db, testEnv }) => {
      test.setTimeout(300_000);
      const d = await ensureSlotD(api, db, testEnv);
      const originalPhone = d.phone;

      const { phonePk, phonePkEmbedded, customerPk, phoneType } = await test.step('Read current contact info', async () => {
        const ci = await api.svcContact.getContactInfo(d.accountPk);
        expect(ci.status, `getContactInfo failed: ${ci.status}`).toBe(200);
        expect(ci.body.phoneList?.length ?? 0, 'account must have >=1 phone').toBeGreaterThanOrEqual(1);
        const primary = ci.body.phoneList[0]!;
        return {
          phonePk: primary.pk,
          phonePkEmbedded: primary.phoneInfo.phonePK,
          customerPk: primary.phoneInfo.customerPK,
          phoneType: primary.phoneInfo.phoneType ?? 'CELL',
        };
      });

      // Generate a deterministic, unlikely-to-collide new phone.
      // Backend validates NANP structure (toll-free codes like 800/888 are rejected as "Invalid Phone Number").
      // Use a geographic area code (415 = San Francisco) with a lead-derived 7-digit suffix starting with 2-9.
      const originalDigits = originalPhone.replace(/\D/g, '').padStart(10, '0');
      const newAreaCode = '415';
      const newPhoneNumber = 2_000_000 + (Number(d.leadPk) % 7_000_000);
      const newPhone = `${newAreaCode}${String(newPhoneNumber).padStart(7, '0')}`;
      expect(newPhone, 'new phone should differ from original').not.toBe(originalDigits);

      await test.step('Update Servicing phone via createOrUpdatePrimaryCustomerContactInfo', async () => {
        const resp = await api.svcContact.createOrUpdateContactInfo({
          accountPk: Number(d.accountPk),
          phoneList: [
            {
              pk: phonePk,
              phoneInfo: {
                phonePK: phonePkEmbedded,
                customerPK: customerPk,
                areaCode: newAreaCode,
                phoneNumber: newPhoneNumber,
                phoneType,
              },
            },
          ],
        });
        expect(resp.status, `update failed: ${resp.status} ${JSON.stringify(resp.body)}`).toBe(200);
      });

      await test.step('DB guard — uown_sv_phone has NEW; uown_los_phone keeps ORIGINAL', async () => {
        // Origination phone lives in uown_los_phone (area_code + phone_number), NOT in uown_los_customer.
        // The SVC edit via createOrUpdatePrimaryCustomerContactInfo touches only uown_sv_phone,
        // so uown_los_phone retains the original value — realizing the full SVC/LOS divergence.
        const svcPhone = await db.queryOne<{ c: string }>(
          `SELECT count(*)::text AS c
             FROM uown_sv_phone
            WHERE account_pk = $1
              AND CONCAT(area_code, phone_number) = $2`,
          [d.accountPk, newPhone],
        );
        expect(Number(svcPhone?.c ?? '0'), 'SVC phone should reflect the NEW number').toBeGreaterThanOrEqual(1);

        const losPhone = await db.queryOne<{ c: string }>(
          `SELECT count(*)::text AS c
             FROM uown_los_phone
            WHERE lead_pk = $1
              AND CONCAT(area_code, phone_number) = $2`,
          [d.leadPk, originalDigits],
        );
        expect(
          Number(losPhone?.c ?? '0'),
          'LOS phone should still be the ORIGINAL (uown_los_phone is untouched by SVC edit)',
        ).toBeGreaterThanOrEqual(1);
      });

      await test.step('/v2 by NEW phone → SERVICING (slot D lead)', async () => {
        const r = await api.customers.searchCustomersV2({ phone: newPhone });
        expect(r.status, `expected 200, got ${r.status} body=${JSON.stringify(r.body)}`).toBe(200);
        const match = r.body.content.find((p) => Number(p.leadPk) === Number(d.leadPk));
        expect(match, `slot D leadPk=${d.leadPk} must be in content[] for NEW phone`).toBeTruthy();
        expect(match!.customerAccountDomain, 'NEW phone must resolve via SERVICING').toBe('SERVICING');
      });

      await test.step('/v2 by ORIGINAL phone → ORIGINATION fallback (same lead)', async () => {
        const r = await api.customers.searchCustomersV2({ phone: originalPhone });
        expect(r.status, `expected 200, got ${r.status}`).toBe(200);
        const match = r.body.content.find((p) => Number(p.leadPk) === Number(d.leadPk));
        expect(
          match,
          `slot D leadPk=${d.leadPk} must surface via ORIGINATION fallback (uown_los_phone still has the original)`,
        ).toBeTruthy();
        expect(
          match!.customerAccountDomain,
          `ORIGINAL phone no longer in SVC (only in LOS) → expected ORIGINATION fallback, got ${match!.customerAccountDomain}`,
        ).toBe('ORIGINATION');
      });
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type _Used = ApiResponse<FindCustomerResponse> | ApiResponse<LegacyAccountSearchResponse>;
  });
}

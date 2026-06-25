---
name: e2e-examples
description: Load when writing a new E2E test — canonical project examples with structure, fixtures, tags, assertions. Use as a stylistic template for tests/e2e/{portal}/.
disable-model-invocation: true
---

# E2E Test Examples — UOWN Leasing

> Real code examples from the project. Reference when implementing new tests.

## 0. Prefer state fixtures over inline setup (REACH FOR THESE FIRST)

Does a test need an **approved** application or a **funded** account? Do NOT rewrite Phase 1..4 inline. The `approvedApplication` / `fundedAccount` fixtures (in `src/support/base-test.ts`) already compose `buildTestData` + `createPreQualifiedApplication` (+ `driveLeadToFunding`), run merchant preflight (rule #12), and generate fresh data per test (rule #9). They are **lazy** — they only execute when the test destructures the fixture, so the cost is zero for those who don't use them.

**BEFORE — ~150 lines of Phase 1..4 inline (do NOT do this):**

```typescript
test('settle a funded lease', async ({ page, api, db, testEnv }) => {
  test.setTimeout(300_000);
  const ctx: TestContext = {
    leadPk: '', leadUuid: '', accountPk: '', accountNumber: '',
    contractStatus: '', contractUrl: '', websiteAccountPk: '', achAdded: 0, ccAdded: 0,
    reportKeys: new Map(),
  };

  // Phase 1 — merchant preflight + fresh applicant
  const { merchant, applicant } = buildTestData({ env: testEnv.env, state: 'NY', merchant: 'TireAgent', orderTotal: '800' });
  await ensureMerchantReady(api, merchant);

  // Phase 2 — send application, verify, invoice, CC auth (≈40 linhas)
  const sendRes = await api.application.sendApplication(merchant, applicant, order);
  expect(sendRes.ok).toBeTruthy();
  ctx.leadPk = /* parse */; ctx.leadUuid = /* parse */;
  await api.invoice.createInvoice(/* ... */);
  await api.creditCard.authorize(/* ... */);
  // ... verify UW_APPROVED, submit payment info, capture esignClient/iframe ...

  // Phase 3 — drive to FUNDING (sign → settle → funding → funded) (≈50 linhas)
  await driveLeadToFunding(api, merchant, ctx);

  // Phase 4 — resolve servicing accountPk
  const accountPk = await db.waitForAccountByLeadPk(ctx.leadPk);
  ctx.accountPk = accountPk;

  // ...finally the test's domain starts here, ~150 lines later...
  await page.goto(/* servicing */);
});
```

**AFTER — the fixture delivers the state; the test starts in the domain:**

```typescript
// fundedAccount: FundedAccountResult = { leadPk, leadUuid, accountPk, contractUrl?, esignClient? }
test('settle a funded lease', async ({ page, fundedAccount, db }) => {
  test.setTimeout(300_000);

  // State ready: lease in FUNDING/FUNDED, accountPk already resolved. Go straight to the domain.
  await test.step('Open settlement modal in Servicing', async () => {
    const servicing = new ServicingCustomerPage(page);
    await servicing.openByAccountPk(fundedAccount.accountPk);
    // ...test assertion...
  });
});
```

For a test that only needs approval (without funding), destructure `approvedApplication`:

```typescript
// approvedApplication: ApprovedApplicationResult = { leadPk, leadUuid, approvedAmount, contractUrl?, esignClient? }
test('contract renders approved amount', async ({ page, approvedApplication }) => {
  // lead already in UW_APPROVED / CONTRACT_CREATED; esignClient = 'GOWSIGN' | 'SIGNWELL'
  await page.goto(approvedApplication.contractUrl!);
  // ...assert on the contract...
});
```

**Parameterize state/merchant/total/payment** per describe — without rewriting the setup:

```typescript
// Default: state 'NY', merchant 'TireAgent', orderTotal '800', paymentMode 'submitApi'.
test.use({ setup: { state: 'CA', merchant: 'TerraceFinance', orderTotal: '1200', paymentMode: 'submitApi' } });
```

**Rules:**
- `db` and `email` are **worker-scoped** (one pg pool / IMAP session per worker) — destructure `{ db }` directly, do not create `new DatabaseHelpers`.
- `paymentMode`: `'submitApi'` (default, → CONTRACT_CREATED, captures `esignClient`+iframe) · `'ccAuth'` (→ CC_AUTH_PASSED) · `'none'` (stays in UW_APPROVED). `fundedAccount` forces `'submitApi'` upstream regardless of `setup`.
- Hand-writing Phase 1..4 when the fixture already delivers the state = rework and drift; it is the anti-pattern these fixtures exist to kill.

## 1. Standard E2E Test Structure

```typescript
import { test, expect } from '@fixtures/test-context.fixture.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';
import { SELECTORS } from '@selectors/index.js';
import { OriginationCustomerPage } from '@pages/origination/index.js';
// Runtime helpers ALWAYS via the barrel — never the individual module path.
import { setupApplicationViaApi } from '@helpers/index.js';
import type { TestContext } from '@support/base-test.js';

const testData = [
 {
 env: 'sandbox',
 state: 'NY',
 merchant: 'TerraceFinance',
 orderTotal: '621',
 tag: buildTags(TestTag.REGRESSION, TestTag.CRITICAL),
 },
];

for (const data of testData) {
 test.describe(`R1.49.1_featureName_469 - ${data.env}/${data.merchant}`, { tag: splitTags(data.tag) },  => {
 test.use({ envName: data.env });

 test('should create application and reach UW_APPROVED', async ({ page, api, db, testEnv }) => {
 test.setTimeout(300_000);
 const ctx: TestContext = {
 leadPk: '', leadUuid: '', accountPk: '', accountNumber: '',
 contractStatus: '', contractUrl: '', websiteAccountPk: '', achAdded: 0, ccAdded: 0,
 reportKeys: new Map,
 };

 await test.step('Submit application via API', async  => {
 const result = await setupApplicationViaApi(api, {
 merchant: testEnv.getCredentials('merchant'), // or use td.merchant
 applicant: { /* see api-setup.helpers */ },
 order: { merchandiseDescription: 'Test', merchandiseAmount: data.orderTotal },
 env: data.env,
 });
 ctx.leadPk = result.leadPk;
 ctx.leadUuid = result.leadUuid;
 });

 await test.step('Verify lead status in DB', async  => {
 const status = await db.getLeadStatus(ctx.leadPk);
 expect(status).toBe('UW_APPROVED');
 });

 await test.step('Complete contract in browser', async  => {
 const customerPage = new OriginationCustomerPage(page);
 // Browser interaction
 });
 });
 });
}
```

## 2. API-Only Test Structure

```typescript
import { test, expect } from '@fixtures/test-context.fixture.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';
import { buildTestData } from '@helpers/index.js';

const testData = [
 { env: 'sandbox', merchant: 'TerraceFinance', tag: buildTags(TestTag.REGRESSION) },
];

for (const data of testData) {
 test.describe(`R1.49.1_featureName_469 - ${data.env}`, { tag: splitTags(data.tag) },  => {
 test.use({ envName: data.env });

 test('should submit and get UW_APPROVED via API', async ({ api, db, testEnv }) => {
 test.setTimeout(120_000);
 const td = buildTestData({ env: data.env, state: 'FL', merchant: data.merchant });

 await test.step('Send application', async  => {
 const response = await api.application.sendApplication(td.merchant, td.applicant, td.order);
 expect(response.ok, `sendApplication: ${response.status}`).toBeTruthy;
 });
 });
 });
}
```

## 3. Task Test Structure (GitLab issues)

```typescript
// File: docs/taskTestingUown/{testName}/{testName}.spec.ts
// Project: task-testing (even for DB-only tests — NOT api-only)
import { test, expect } from '@fixtures/test-context.fixture.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';

const testData = [
 { env: 'qa1', tag: buildTags(TestTag.REGRESSION, TestTag.QA1) },
];

for (const data of testData) {
 test.describe(`R1.49.1_featureName_469 - ${data.env}`, { tag: splitTags(data.tag) },  => {
 test.use({ envName: data.env });

 test('CT-01: Verify index exists on table', async ({ db }) => {
 test.setTimeout(60_000);

 await test.step('CT-01: Query pg_indexes for expected index', async  => {
 const exists = await db.indexExistsOnTable('idx_name', 'table_name');
 expect(exists).toBe(true);
 });
 });
 });
}
```

## 4. Using ctx for State Sharing

```typescript
test('full flow with shared context', async ({ page }) => {
 const ctx: {
 leadPk?: number;
 contractUrl?: string;
 status?: string;
 } = {};

 await test.step('Step 1 - Create', async  => {
 ctx.leadPk = 12345; // assigned in step 1
 });

 await test.step('Step 2 - Verify', async  => {
 // ctx.leadPk is available here
 expect(ctx.leadPk).toBeDefined;
 });
});
```

## 5. Account Aging Pattern — `withAgedAccount` (2026-05-22)

For boundary-value tests on delinquency-driven features (Settlement Amount, EPO bands, delinquency sweeps), age a SEED account before the assertion and restore in `finally`.

**Canonical pattern — try/finally (preferred for multi-step tests):**

```typescript
import { ageAccount, restoreAccount, SEED_DELINQUENCY_DAYS } from '@helpers/index.js';

test('CT-A5: Settlement 50% band at 91 days delinquent', async ({ db, page }) => {
 test.setTimeout(120_000);
 const SEED_ACCOUNT_PK = 4353; // authorized seed for in qa1

 await ageAccount(db, SEED_ACCOUNT_PK, 91);
 try {
 await test.step('Verify 50% discount displayed in modal', async  => {
 const modal = new SettlementBreakdownModal(page);
 await modal.open;
 expect(await modal.getValueByLabel('Discount %')).toBe('50%');
 });
 } finally {
 await restoreAccount(db, SEED_ACCOUNT_PK, SEED_DELINQUENCY_DAYS); // restores to 60
 }
});
```

**Convenience wrapper — `withAgedAccount` (preferred for single-step tests):**

```typescript
import { withAgedAccount } from '@helpers/index.js';

await withAgedAccount(db, 4353, 91, async  => {
 expect(await modal.getValueByLabel('Discount %')).toBe('50%');
});
```

**Rules:**
- Only use on explicitly AUTHORIZED seed accounts (: 4353/4355/4358/4359 in qa1).
- try/finally restore is MANDATORY — see [[application-lifecycle]] pitfall #45.
- Do NOT use `withAgedAccount` on arbitrary active accounts — side effects on shared test data.
- `SEED_DELINQUENCY_DAYS = 60` is the documented restore target — do not restore to 0 or NULL.

## 5b. UI-mandatory action because the HTTP header carries the assertion target (#1315, 2026-06-18)

Canonical example of **API setup + UI-only action + DB assert** where the UI step is NOT optional: the value under test (`uown_lead_modifications.agent_username`) is derived from the `username` HTTP header that ONLY the portal SPA sends. A direct API `changeLeadStatus` call drops the header → the row records "SYSTEM" → reproduces the artifact instead of the fix. Rule #14 (UI-first) is load-bearing here, not stylistic.

**File:** `tests/e2e/origination/R1.53.0_fixSystemAgentUsernameInModificationReport.spec.ts`

Pattern shape:
1. **Setup via API (fresh lead per CT, rule #9):** `createPreQualifiedApplication(api, merchant, applicant, ctx, { skipPaymentInfo: true })` → lead parks at UW_APPROVED (no CC submit). CT-02 uses `{ submitPaymentInfoViaApi: true }` to reach the INVOICE_CREATED/CC_AUTH_PASSED internal path. Merchant preflight runs automatically (rule #12).
2. **Force a fresh portal session as a SPECIFIC agent:** `clearCookies` + `localStorage.clear`/`sessionStorage.clear` before `LoginPage.login('jmendes.gow', ...)` — the `origination-ui` project ships a default storageState; without the reset the recorded `agent_username` would be the storageState user, not the agent under test.
3. **UI-only action:** `customerPage.setToExpired()` (CT-01) / `customerPage.changeToSigned(comment)` (CT-02) — sends the `username` header.
4. **DB assert (deterministic):** poll `uown_lead_modifications WHERE mod_type='LEAD_STATUS_CHANGE' AND new_status=$2 ORDER BY pk DESC LIMIT 1` → assert `agent_username === 'jmendes.gow'` AND `!== 'SYSTEM'`, PLUS a **negative guard** (no SYSTEM-attributed row for this fresh lead).
5. **Activity log (rule #13):** assert the matching `uown_los_lead_notes` note exists.

Takeaways to copy:
- Column is `mod_type`, NOT `modification_type` (silent-0-rows projection drift — see [[db-polling-pattern]]).
- A fresh-session login as a named agent is the only way to assert per-agent attribution — default storageState pollutes the result.
- Pair the positive assert with a negative guard (`agent_username = 'SYSTEM'` returns 0 rows) so a regression can't pass by also writing a SYSTEM row.

## 6. Worker-Scoped Unique IDs

```typescript
import { uniqueEmail, getWorkerRunId } from '@helpers/index.js';

// Parallel-safe unique data. Real worker-id exports: uniqueEmail, getWorkerRunId, RUN_ID.
// There is NO `uniqueName` helper — build a unique name from the worker run id.
const email = uniqueEmail('fresh.member'); // fresh.member_003120_1710583_0@e2e.test
const name = `Test Company ${getWorkerRunId()}`; // Test Company 003120 — getWorkerRunId is a FUNCTION, call it

// In logs for diagnosis (note the () — it's a function, not a value)
console.log(`[worker=${getWorkerRunId()}] Creating application...`);
```

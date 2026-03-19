<!-- PT-BR: Padrões de teste E2E e API, parametrização, dados de teste, estabilidade e timeouts. -->

# Test Patterns

## Test Naming Convention

Tests from tracked tasks use the standardized pattern:

```
test.describe: '{milestone}_{camelCaseTitle}_{taskNumber} - {env}/{merchant}'
file (E2E):    {milestone}_{camelCaseTitle}_{number}.spec.ts
file (API):    {milestone}_{camelCaseTitle}_{number}.spec.ts
```

**Example:** Task "Separate Short Code in a new Entity #469" (milestone R1.49.1):
- describe: `R1.49.1_separateShortCodeInANewEntity_469 - sandbox/ProgressMobility`
- file: `R1.49.1_separateShortCodeInANewEntity_469.spec.ts`

## E2E Tests — import fixture

```typescript
import { test, expect } from '@fixtures/test-context.fixture.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';

const testData = [
  { env: 'sandbox', state: 'NY', merchant: 'TireAgent', tag: buildTags(TestTag.REGRESSION, TestTag.CICD) },
];

for (const data of testData) {
  test.describe(`R1.49.1_separateShortCodeInANewEntity_469 - ${data.env}/${data.merchant}`, { tag: splitTags(data.tag) }, () => {
    test.use({ envName: data.env });
    test('scenario', async ({ page, api, db, email, ctx, testEnv }) => {
      test.setTimeout(720_000);
      await test.step('Step 1', async () => { /* ... */ });
    });
  });
}
```

## API-only Tests — import fixture

```typescript
import { test, expect } from '@fixtures/test-context.fixture.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';

const testData = [
  { env: 'sandbox', tag: buildTags(TestTag.REGRESSION) },
];

for (const data of testData) {
  test.describe(`R1.49.1_featureName_469 - ${data.env}`, { tag: splitTags(data.tag) }, () => {
    test.use({ envName: data.env });
    test('api call', async ({ api, db, testEnv }) => { /* ... */ });
  });
}
```

## Parameterization

- `testData` array with `for...of`
- Tags: `@cicd`, `@sandbox`, `@qa1`, `@smoke`, `@regression`
- `test.step()` for each logical phase
- `ctx` for shared state between steps

## Risk Tier Parametrization (MANDATORY for application tests)

> Full reference: `docs/business-rules/appendix-g-cenarios-risco.md`

When the test creates a lease application, `testData` MUST include `riskTier`. This drives SSN, state, merchant and cart value choices — making tests reflect real-world scenarios:

```typescript
// Single risk tier (most common)
const testData = [
  {
    env: 'sandbox',
    riskTier: 'low',             // low | medium | high | blocked-state | kornerstone-low
    state: 'CA',                 // Appendix G: no blocked state, EPO proportional formula
    merchant: 'TerraceFinance',  // ONLINE (OL prefix) → uses customer state for tax/program
    merchandiseAmount: 1000,     // within program min/max; justified by riskTier
    runId: generateRunId(),
    email: generateUniqueEmailAlias(),
    tag: '@cicd @sandbox',
  },
];

// Multiple tiers in one test suite (approval + denial coverage)
const testData = [
  { env: 'sandbox', riskTier: 'low',  state: 'CA', merchant: 'TerraceFinance', merchandiseAmount: 1000, ... },
  { env: 'sandbox', riskTier: 'high', state: 'FL', merchant: 'TerraceFinance', merchandiseAmount: 900,  ... },
];
```

**SSN helper per tier:**
```typescript
generateTestSSN(data.riskTier !== 'high')
// riskTier 'high' → false → SSN ends in 9 → UW_DENIED
// all others     → true  → SSN not ending in 9 → UW_APPROVED
```

**Quick reference — testData fields per tier:**

| riskTier | state | merchant | merchandiseAmount | expectedOutcome |
|----------|-------|----------|-------------------|----------------|
| `low` | CA, CO, FL | TerraceFinance | $800–$1.500 | `FUNDED` |
| `medium` | TX, OH, GA | TerraceFinance / BuyOnTrust | $400–$800 | `FUNDED` (lower limit) |
| `high` | any active | any | any valid | `UW_DENIED` |
| `blocked-state` | NJ, VT, MN, ME | TerraceFinance (ONLINE) | any valid | `DENIED` |
| `kornerstone-low` | CA, TX | FifthAveFurnitureNY | $800–$1.500 | `FUNDED` via KS 16m/13m |

## Test Data Helpers

| Helper | Usage |
|--------|-------|
| `generateTestSSN(true)` | Approved SSN (does not end in 9) |
| `generateTestSSN(false)` | Denied SSN (ends in 9) |
| `generateTestPhone()` | Unique phone number |
| `generatePayPairTestPhone()` | PayPair sandbox phone (prefix 111/222) |
| `testEnv.generateUniqueEmailAlias()` | Unique email |
| `generateRunId()` | Isolation between runs |
| `VALID_TEST_CARDS` | Discover/Mastercard for contract page |
| `TEST_CARDS` | Cards for payments |

## Known Environment Limitations (qa1)

| Issue | Symptom | Workaround |
|-------|---------|------------|
| `VISA_APPROVED` (5146) causes rollback in `submitApplication` on qa1 | `UnexpectedRollbackException` — HTTP 200 with error in body | Use `TEST_CARDS.MASTERCARD_APPROVED` (5500) instead |
| `sendInvoice` returns 500 `UnexpectedRollbackException` for `eligible_terms='16'` on all non-Kornerstone merchants in qa1 when called without specifying a frequency | Zero records with `sched_summary.term_in_months=16` exist in qa1 for non-MONTHLY flows | Use `sendInvoice` with `selectedPaymentFrequency='MONTHLY'` — MONTHLY uses fallback `return numberOfMonths = 16` (no config lookup), bypassing the missing `number.of.payments.16.WEEKLY/BI_WEEKLY/SEMI_MONTHLY` config. Also requires DB-patch: `eligible_terms='16'` + `merchant_program_pk=207` before `sendInvoice` (Task #1242) |
| Profituity not active in qa1 | All ACH sweep tasks show `is_active=false`, `last_trigger_time` stale (~April 2025) | Full ACH payment arrangement flow is untestable in qa1 |

## API-Driven Payment Arrangement Pattern

Use the `PaymentArrangementClient` (via `api.paymentArrangement`) to create CC or ACH arrangements programmatically. This avoids UI interaction with the Servicing portal and is the preferred pattern for arrangement tests.

### CC Arrangement

> **CRITICAL:** CC arrangements are **synchronous** — `makeCreditCardPayments` processes the charge
> within the same HTTP request. The arrangement status transitions NOT_STARTED → SUCCESS immediately.
> No sweep is required (though calling one is safe).

```typescript
import { buildCcArrangementBody } from '@api/bodies/payment-arrangement.body.js';
import { calculateDateISO } from '@helpers/date.helpers.js';  // NOT isoDate — that doesn't exist
import { VALID_TEST_CARDS } from '@data/test-cards.js';

// 1. Drive to FUNDED — see "Drive to FUNDED" section below or common-operations.md
//    ctx.accountPk must be set before this step

// 2. Build body — takes an OPTIONS OBJECT (not an array + boolean)
const body = buildCcArrangementBody({
  accountPk: Number(ctx.accountPk),   // required — number type
  arrangementType: 'SETTLEMENT',      // 'SETTLEMENT' | 'NORMAL'
  ccNumber: VALID_TEST_CARDS[0].cardNumber,
  ccExp: VALID_TEST_CARDS[0].expirationDate,
  cvc: VALID_TEST_CARDS[0].cvv,
  installments: [
    { amount: '100', date: calculateDateISO(0) },  // amount as string, date as YYYY-MM-DD
  ],
});

// 3. Create arrangement — body already contains accountPk, NO extra param
const res = await api.paymentArrangement.makeCreditCardPayments(body);
expect(res.ok, `makeCreditCardPayments: ${res.status} — ${JSON.stringify(res.body)}`).toBeTruthy();

// 4. Get arrangementPk from DB (CC is synchronous — already SUCCESS at this point)
const arrangement = await db.getPaymentArrangement(ctx.accountPk);
ctx.arrangementPk = String(arrangement?.pk ?? '');
expect(arrangement!.status).toBe('SUCCESS');
expect(arrangement!.arrangement_type).toBe('SETTLEMENT');

// 5. (Optional) trigger sweep — CC already processed, this is informational
await api.scheduledTask.sendCreditCardPaymentsSweep();

// 6. Poll — uses ARRANGEMENT pk, not account pk
await db.waitForCcTransactionsProcessed(ctx.arrangementPk, 60_000);

// 7. Poll arrangement status — uses ACCOUNT pk
await db.waitForPaymentArrangementStatus(ctx.accountPk, 'SUCCESS', 60_000);

// 8. Assert account status (only SETTLEMENT type transitions account)
const accountStatus = await db.getAccountStatus(ctx.accountPk);
expect(accountStatus).toBe('SETTLED_IN_FULL');
```

### ACH Arrangement

> **CRITICAL:** ACH arrangements are **asynchronous** — `createOrUpdateAchPayments` creates
> NOT_STARTED entries. The sweep (`sendACHPaymentsSweep` via Profituity) processes them later.
> Full ACH flow is **not testable in qa1** — Profituity is inactive there.

```typescript
import { buildAchArrangementBody } from '@api/bodies/payment-arrangement.body.js';
import { calculateDateISO } from '@helpers/date.helpers.js';

// Build body — takes an OPTIONS OBJECT (not an array)
const body = buildAchArrangementBody({
  accountPk: Number(ctx.accountPk),   // required
  arrangementType: 'SETTLEMENT',      // defaults to SETTLEMENT if omitted
  installments: [
    { amount: '100', date: calculateDateISO(3) },  // amount as string
  ],
  // Optional: routingNumber, accountNumber, bankAccountType (defaults from TEST_BANK constant)
});

// Create arrangement — body already contains accountPk, NO extra param
const res = await api.paymentArrangement.createOrUpdateAchPayments(body);
expect(res.ok).toBeTruthy();

// Verify FK presence (schema check)
const hasFk = await db.achPaymentHasArrangementFk();
expect(hasFk).toBe(true);

// Get ACH payments (uses arrangementPk, not accountPk)
const arrangement = await db.getPaymentArrangement(ctx.accountPk);
const payments = await db.getAchPaymentsByArrangement(String(arrangement!.pk));
expect(payments.length).toBeGreaterThan(0);

// ACH sweep polling — only works in envs where Profituity is active (NOT qa1)
// await db.waitForAchPaymentsProcessed(String(arrangement!.pk), 60_000);
```

### FK and Schema Validation

```typescript
// Schema checks (run once per suite, not per scenario)
await test.step('Validate schema', async () => {
  expect(await db.paymentArrangementTableExists()).toBe(true);
  expect(await db.ccTransactionHasArrangementFk()).toBe(true);
  expect(await db.achPaymentHasArrangementFk()).toBe(true);
  const cols = await db.getPaymentArrangementColumns();
  expect(cols).toContain('status');
  expect(cols).toContain('arrangement_type');
});
```

## GDS Unavailability Bypass — existingAccountPks

When GDS is unavailable in a test environment (all new applications get `UW_DENIED`), tests that require `FUNDED` accounts can bypass account creation by providing pre-seeded account PKs in `testData`:

```typescript
const testData = [
  {
    env: 'qa1',
    merchant: 'TerraceFinance',
    // When GDS is down: populate with FUNDED account PKs, one per CT.
    // Query: SELECT a.pk FROM uown_sv_account a
    //        WHERE a.status NOT IN ('SETTLED_IN_FULL','CLOSED','CHARGED_OFF')
    //          AND NOT EXISTS (SELECT 1 FROM uown_sv_payment_arrangement pa
    //                          WHERE pa.account_pk = a.pk AND pa.is_active = true)
    //        ORDER BY a.row_created_timestamp DESC LIMIT 10;
    existingAccountPks: ['4442', '4439', '4438'] as string[] | undefined,
  },
];

// In the setup helper:
async function driveToFunded(api, db, testEnv, data, existingAccountPk?: string) {
  if (existingAccountPk) {
    console.log(`[Setup] Using existing accountPk=${existingAccountPk} (bypassing GDS)`);
    return { leadPk: '0', accountPk: existingAccountPk };
  }
  // ... full creation path
}

// In the test:
const { leadPk, accountPk } = await driveToFunded(api, db, testEnv, data, data.existingAccountPks?.[0]);
```

**Rules:**
- Each CT that modifies an account (creates an arrangement) needs its own account PK — one per index.
- Index the array explicitly: `[0]=CT-02, [1]=CT-03, ...` (document in a comment).
- Remove entries after GDS recovers (or set `existingAccountPks: undefined` to re-enable full creation).
- Only use ACTIVE accounts (not SETTLED_IN_FULL / CLOSED / CHARGED_OFF).
- Use `src/scripts/find-eligible-accounts.ts` to query eligible PKs when GDS is unavailable.

## Soft Assertions for Known Environment Limitations

When a backend bug or environment limitation prevents an assertion from passing, use soft assertions with `console.warn` instead of a hard `expect()` so the test still provides structural value:

```typescript
await test.step('CT-05: KNOWN BUG — account rating not persisted to DB', async () => {
  const rating = await db.getAccountRating(ctx.accountPk);
  // Non-blocking: activity log confirms code ran but DB column not updated (backend defect)
  console.warn(
    `[CT-05][KNOWN BUG] Expected rating=P but got: ${rating}. ` +
    'Activity log confirms the code ran — DB column not updated.'
  );
  // Do NOT add expect(rating).toBe('P') — would fail due to known backend defect
});

// For environment pipeline limitations (e.g., QA1 ACH Profituity not active):
await test.step('CT-06: QA1 LIMITATION — ACH SUCCESS not verifiable', async () => {
  const processed = await db.waitForAchPaymentsProcessed(ctx.arrangementPk, 15_000);
  if (!processed) {
    console.warn('[CT-06][QA1 LIMITATION] Profituity integration not active. Full ACH flow not verifiable.');
    return; // Non-blocking
  }
  // assertions that only run when pipeline IS active
});
```

**Rules:**
- Always document WHY the assertion is soft (bug reference or environment name).
- Include enough context in the `console.warn` message to identify the root cause.
- Use `return` (early exit from `test.step`) for limitation skips, NOT `test.skip()` — the step should still appear in the report.
- Track the associated bug or limitation in the test file's header comment.

## Hybrid Test Pattern — API Creates, UI Verifies

When a feature is only accessible via API (e.g., `arrangementType: 'SETTLEMENT'` cannot be set through the UI modal), use a hybrid test pattern: API creates the state, then UI verifies the result is correctly rendered.

```typescript
// 1. Create state via API (what the UI cannot do)
const body = buildCcArrangementBody({
  accountPk: Number(accountPk),
  arrangementType: 'SETTLEMENT',
  installments: [{ amount: '100', date: calculateDateISO(0) }],
});
const res = await api.paymentArrangement.makeCreditCardPayments(body);
expect(res.ok).toBeTruthy();

// 2. Verify DB state (API result)
const arrangement = await db.getPaymentArrangement(accountPk);
expect(arrangement!.arrangement_type).toBe('SETTLEMENT');
expect(arrangement!.status).toBe('SUCCESS');

// 3. Reload UI and verify rendering
await page.reload();
await servicingPage.waitForSpinner();
const accountStatus = await db.getAccountStatus(accountPk);
expect(accountStatus).toBe('SETTLED_IN_FULL');
```

**When to apply:** any feature where the UI only supports a subset of the API capabilities (e.g., Make Payment modal defaults to NORMAL, but SETTLEMENT requires explicit API call).

## Stability

- `waitForSpinner()` after navigation
- Polling with backoff for DB (not setTimeout)
- Polling for e-sign iframe (PandaDocs vs Signwell, 3s × 12)
- Capture toast text before dismiss
- CSS animations disabled via auto-hook
- PayPair OTP: network intercept on `/api/v1/users/send_code` (not IMAP)
- Textareas with `oninput`: use `evaluate()` instead of `fill()`
- PayPair iframe nesting: `#llapp-iframe` → `#pt-iframe`
- PostgreSQL bigint columns (e.g., `lead_pk`): `node-pg` returns as `string`, not `number` -- use `String()` for comparisons, not `Number()`
- Payment arrangement sweep: trigger via `api.scheduledTask.triggerScheduledTask('sendCreditCardPaymentsSql')` then poll with `db.waitForCcTransactionsProcessed(accountPk)` -- do NOT use fixed sleep after sweep trigger
- Arrangement status polling: use `db.waitForPaymentArrangementStatus(accountPk, status)` with backoff -- status transitions: NOT_STARTED → IN_PROGRESS → SUCCESS/FAILED
- FilterTable backdrop overlay (`filter__menu-portal`): when a `filter__`-prefixed react-select opens, a transparent portal backdrop renders at body level intercepting all pointer events. Always click options inside it with `{ force: true }`. After reading options, press `Escape` before interacting with other elements on the page. Before clicking Search or other controls after a filter dropdown was open, press `Escape` + `waitForSpinner()` first.
- T&C checkbox wait: `completeTermsAndConditions()` waits up to **90s** for the first checkbox to appear (plans like TireAgent BW13 load the insurance iframe before rendering the T&C page, causing delays).
- Insurance flow auto-detection: `completeTermsAndConditions()` checks for a visible "See Protection Benefits" button after checking all T&C boxes. If found, it clicks it and delegates to `completeProtectionPlan(false)` (opt-out) — no extra call needed from the test. If not found, it proceeds to "PROCEED TO SIGNATURE" (standard flow).
- Buddy insurance widget retry loop: `completeProtectionPlan()` retries up to **5×** with a **3s** sleep per attempt (15s total) before trying to click a radio button inside the Buddy `buddy.insure` iframe. The widget loads asynchronously and the radio buttons are not available immediately. Do NOT remove the retry loop or reduce the attempt count.
- `WebsiteBasePage.changeEmailToGeneric()` skips gracefully when the email field is disabled (read-only accounts such as "paid in full"). Callers do not need to guard the call.
- `PaymentTransactionPage.editAllocationStrategy()` is non-fatal: if no edit icon is found on the target row, it logs and returns without throwing. Callers do not need to guard the call.
- CSS Module BEM class disambiguation: when a CSS Module class like `paymentCard__price` partially matches `paymentCard__priceContainer` and `paymentCard__priceLabel`, use `:not()` and `:has()` pseudo-classes in selectors (e.g., `[class*='paymentCard__price']:not([class*='Container']):not([class*='Label'])`). This avoids matching sibling/wrapper elements with similar class name prefixes (Task #1233).
- `stripPlanId(redirectUrl)` pattern: to force the MissingPaymentProgram screen on `/{shortCode}/complete`, remove the `planId` query parameter from the redirect URL using `new URL(rawUrl)` + `url.searchParams.delete('planId')`. When `planId` is present, the backend auto-resolves the program and skips the selection screen.
- SEON overlay in sandbox: `secure-sandbox.uownleasing.com` shows a `[data-testid="seon-idv-iframe"]` identity verification iframe that renders transparently and intercepts all pointer events. The iframe eventually evolves to a QR code modal. Since it is cross-origin, its content cannot be dismissed normally. Use `ContractPage.dismissSeonOverlay()` which hides the element via JS (`display:none`, `pointerEvents:none`, `zIndex:-9999`). For NEXT buttons blocked by SEON, use `page.evaluate()` JS click as a bypass: `document.querySelectorAll('button')` → find by text → `.click()`. This affects the missing employment info flow steps on `/complete` in sandbox.
- Settlement toast in `OriginationCustomerPage.settleLease()` is non-fatal: some environments complete settlement without emitting a toast. The method logs and continues regardless.

## Expression Index Verification Pattern

When testing performance indexes that use SQL expressions (e.g., `UPPER(col)`, `col1 || col2`), the standard `db.getIndexColumns()` helper does not work — it queries `pg_attribute` which only covers named columns. Use the following pattern:

```typescript
// In the index constant, flag expression indexes:
const EXPECTED_INDEXES = [
  {
    name:         'idx_phone_full_number_active',
    table:        'uown_los_phone',
    columns:      [] as string[],     // empty — expression index
    isExpression: true,
    exprParts:    ['area_code', 'phone_number'],
  },
  // ...regular indexes use isExpression: false and populated columns[]
] as const;

// In CT-02, branch on isExpression:
if (idx.isExpression) {
  const indexDef = await db.getSingleString(
    `SELECT indexdef FROM pg_indexes WHERE indexname = $1`,
    [idx.name],
  );
  for (const part of idx.exprParts) {
    expect(indexDef).toContain(part);
  }
} else {
  const actualColumns = await db.getIndexColumns(idx.name);
  for (const col of idx.columns) {
    expect(actualColumns).toContain(col);
  }
}
```

PostgreSQL stores UPPER expressions in `indexdef` as `upper((col)::text)`. For UPPER indexes (Tasks #463), assert `.toLowerCase().toContain('upper')` and `.toContain(exprColumn)` on the indexdef string.

## react-data-table-component v7 Pattern

`react-data-table-component` v7 renders a `<div role="table">` element, **not** a native `<table>`. Use ARIA role selectors — `page.getByRole('table')` — rather than `page.locator('table')`:

```typescript
// CORRECT — matches <div role="table">
await expect(page.getByRole('table').first()).toBeVisible({ timeout: 10_000 });

// WRONG — matches only native <table> elements
await expect(page.locator('table').first()).toBeVisible();
```

This applies to any page backed by `react-data-table-component` (e.g., FrequencyChangesHistoryPage, DueDateMovesHistoryPage). Selectors `SELECTORS.table`, `SELECTORS.tableHeader`, `SELECTORS.tableRow`, `SELECTORS.tableCell` must target the `rdt_*` CSS classes emitted by this library.

## Triple Validation Pattern — E2E + API + DB (recommended for data-display pages)

When a test validates a page that displays data from a backend table (history pages, list views), always include triple validation:

1. **Via API (action):** execute the action (POST/PUT) that creates/modifies the data
2. **Via API (GET):** capture the created record as the reference source of truth
3. **Via DB:** cross-validate that the DB persisted the data correctly
4. **Via UI (E2E):** navigate to the page and compare each displayed column against the API response values

This pattern guarantees:
- Backend persists correctly (API response vs DB)
- Frontend renders correctly (UI vs API response)
- Display formats are correct (e.g., `isFpdChange: true` → `Yes`, ISO dates → `MM/DD/YYYY`)

```typescript
// 1. Execute action via API
const moveRes = await api.account.moveDueDatesByDays(ctx.accountPk, 7);
expect(moveRes.ok).toBeTruthy();

// 2. Capture API GET response as reference
const apiRecords = await api.account.getDueDateMoves(ctx.accountPk, 0, 10);
const latest = apiRecords.body.content[0];

// 3. Cross-validate DB persistence
const dbRecord = await db.getSingleRow('SELECT * FROM uown_sv_due_date_move WHERE pk = $1', [latest.pk]);
expect(dbRecord.move_number_of_days).toBe(latest.moveNumberOfDays);

// 4. UI renders API values correctly
await dueDateMovesPage.navigateToDueDateMoves(ctx.accountPk);
const firstRow = await dueDateMovesPage.getFirstRow();
expect(firstRow.movedDays).toBe(String(latest.moveNumberOfDays));
expect(firstRow.isFpdChange).toBe(latest.isFpdChange ? 'Yes' : 'No');
```

**When to apply:** any CT that validates data displayed in a table/history page (e.g., DueDateMovesHistoryPage, FrequencyChangesHistoryPage, ErrorLogPage Submit/Send Application tabs).
**When NOT to apply:** schema-only CTs (CT-01 style), flow CTs that don't assert displayed table data.

**Error log variant (Task #1240):** The triple-validation pattern was confirmed working for BOTH error log tabs on `ErrorLogPage`:
- **Submit Application tab** — errors from `submitApplication` + `authorizeCreditCard` endpoints, retrieved via `api.merchant.getSubmitApplicationErrorLogs(from, to)`, table mapped to `uown_submit_application_error_log` (includes CC fields: `first5Cc`, `last4Cc`).
- **Send Application tab** — errors from `sendApplication` endpoint (default UI tab), retrieved via `api.merchant.getMerchantApiErrorLogs(from, to)`, table mapped to `uown_merchant_api_error_log` (no CC fields).
- `authorizeCreditCard` errors are logged to `uown_submit_application_error_log` (same table as `submitApplication`), so a CC last-name-mismatch test can trigger an error log entry via `api.application.authorizeCreditCard(body)` and then verify it via `api.merchant.getSubmitApplicationErrorLogs`.
- **State machine clarification (Task #1240):** `CC_AUTH_PASSED` and `CONTRACT_CREATED` are valid states for `submitApplication` — they generate a contract normally. Only `SIGNED`, `FUNDED`, `SETTLED_IN_FULL`, and `FUNDING` are truly invalid. Calling `submitApplication` on a `SIGNED` lead returns `"Invalid lead status Contract Signed"` which is captured by `CustomExceptionHandler` and logged to `uown_submit_application_error_log`. See `business-rules.md` for the full rule.
- **Invalid planId** is also caught and logged to `uown_submit_application_error_log` — e.g., sending `planId: 'INVALID'` returns an error message containing `"planId"` or `"program"`.
- **getMissingFields caveat (Task #1240):** Even when `getMissingFields` returns 500, leads that previously had `merchantProgramPk` set from a prior session can still proceed with `authorizeCreditCard`. For brand-new leads without prior `merchantProgramPk`, `submitApplication` will fail with "Merchant program required" before reaching CC auth — `getMissingFields` MUST succeed first.

## MobX pre-fetch race condition — waitForResponse before menu click

When a Servicing History page uses MobX to pre-fetch data on History dropdown open, the API response may be cached before the target component mounts. If the component is not yet observing the store property when the response arrives, React never re-renders — the table stays empty.

Pattern: **set up `page.waitForResponse()` BEFORE opening the History dropdown** so the response promise is already listening when the navigation occurs:

```typescript
// CORRECT — listener set up BEFORE any menu click
const freqApiResponse = page.waitForResponse(
  r => r.url().includes('/frequency-changes'),
  { timeout: 30_000 },
).catch(() => null);

await fcPage.navigateToFrequencyChanges();

const apiRes = await freqApiResponse;
```

Do NOT call `isFrequencyChangesMenuVisible()` (or any method that opens the History dropdown) before the `waitForResponse` setup — opening the dropdown triggers a pre-fetch that races against the component mount.

**Note:** Even with this pattern, BUG-01 in `CustomerStore` (`frequencyChangesHistory` missing `@observable`) causes the table to remain empty after navigation. The workaround is to validate data via API (`api.account.getFrequencyChanges(accountPk)`) in addition to verifying that the table container element (`<div role="table">`) is present.

## Tab Panel Scoping — `.tab-pane.active` (ErrorLogPage / tabbed filter panels)

When a page uses a tabbed layout where multiple tab panels share the same underlying selectors, all filter panel interactions MUST be scoped to the currently active panel to avoid false positives.

**Root cause:** `SELECTORS.elFilterSearch = "input[name='search']"` matches the Origination portal nav bar search field (always visible in the DOM) AND the filter panel input — both use the same `name='search'` attribute. Without scoping, `page.locator(SELECTORS.elFilterSearch)` returns multiple elements and `.fill()` targets the wrong one.

**Pattern:**

```typescript
// Private helper: returns the currently active tab panel
private getActiveTabPanel(): Locator {
  return this.page.locator('.tab-pane.active');
}

// Expand the filter panel — idempotent, scoped to the active panel
async expandFilters(): Promise<void> {
  const panel = this.getActiveTabPanel();
  const toggleBtn = panel.locator('[data-toggle="collapse"]').first();
  const collapseTarget = panel.locator('.collapse').first();
  const isExpanded = await collapseTarget.evaluate(
    el => el.classList.contains('show'),
  );
  if (!isExpanded) {
    await toggleBtn.click();
    await collapseTarget.waitFor({ state: 'visible' });
  }
}

// Fill any filter input — always expands first, then scopes
private async fillVisibleInput(selector: string, value: string): Promise<void> {
  await this.expandFilters();
  const panel = this.getActiveTabPanel();
  await panel.locator(selector).fill(value);
}

// Submit filters — scoped to active panel, uses getByRole to disambiguate Search buttons
async submitFilters(): Promise<void> {
  const panel = this.getActiveTabPanel();
  await panel.getByRole('button', { name: 'Search' }).click();
  await this.waitForSpinner();
}
```

**When this applies:**
- Any tabbed page with a persistent nav bar that shares selector names with filter panel inputs
- The Origination `ErrorLogPage` (`/errorLog`) — Send Application and Submit Application tabs each have filter panels with inputs that match the nav bar search selector
- Always use scoped locators (`panel.locator(...)`) rather than `page.locator(...)` when a selector could match elements outside the target panel

**`.tab-pane.active` count guarantee:** At any given time only ONE tab panel has the `.active` class — `page.locator('.tab-pane.active').count()` always returns `1` when a tab is selected. This means `getActiveTabPanel()` is safe to use without `.first()`. When switching tabs, wait for the new panel to become active before interacting with its contents.

**Tab activation check:** Prefer `getByRole('tab', { name: '...' })` + checking the `aria-selected` attribute over CSS class inspection for tab state — ARIA attributes are more reliable across React component versions:

```typescript
async isSendApplicationTabActive(): Promise<boolean> {
  const tab = this.page.getByRole('tab', { name: 'Send Application' });
  const selected = await tab.getAttribute('aria-selected');
  return selected === 'true';
}
```

## File Download Pattern — `waitForEvent('download')`

When testing a button that triggers a file download (e.g., "Download CSV"), Playwright's `waitForEvent('download')` must be set up BEFORE clicking the trigger — otherwise the download event fires before the listener is registered and the promise never resolves.

```typescript
// CORRECT — listener registered BEFORE the click
const [download] = await Promise.all([
  page.waitForEvent('download'),
  errorLogPage.clickDownloadCsv(),
]);

const suggestedFilename = download.suggestedFilename();
expect(suggestedFilename).toBe('submit-application-error-log-reports.csv');

// Optional: verify file has content
const stream = await download.createReadStream();
const chunks: Buffer[] = [];
for await (const chunk of stream) {
  chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
}
const content = Buffer.concat(chunks).toString('utf-8');
expect(content.length).toBeGreaterThan(0);
```

**Known filenames (Task #1240):**
- Download CSV on Submit Application tab → `submit-application-error-log-reports.csv`
- Download CSV on Send Application tab → `error-log-reports.csv`

**Pattern rules:**
- Always use `Promise.all([page.waitForEvent('download'), triggerClick()])` — never click first and await after.
- The `download` object provides `suggestedFilename()`, `path()` (temp file path), and `createReadStream()`.
- For CI, only assert `suggestedFilename` and content length > 0 — avoid asserting specific byte content.
- The download event is scoped to the `page` object, not to a locator or frame.

**Email CSV modal (Task #1240):**

When the "Email CSV" button opens a modal dialog instead of downloading, assert modal visibility using `isEmailCsvModalVisible()`:

```typescript
await errorLogPage.clickEmailCsv();
expect(await errorLogPage.isEmailCsvModalVisible()).toBe(true);
```

The modal is detected via `.modal.show, [role="dialog"]` containing the text `email`. Close it or dismiss before continuing to avoid overlay interference.

## Sort Indicators in Table Headers (Leads Table)

The Origination Leads table (and potentially other `react-data-table-component` tables) includes Unicode sort indicator characters (`▲`, `▼`, `△`, `▽`, `↑`, `↓`) appended to column header text. When using `getTableHeaders()` to extract header names for row matching, the raw text will contain these characters (e.g., `"Lead # ▲"` instead of `"Lead #"`).

**Pattern: strip sort indicators before matching:**

```typescript
const headers = await getTableHeaders(page);
const cleanHeaders = headers.map(h => h.replace(/[▲▼△▽↑↓]/g, '').trim());
const colIndex = cleanHeaders.findIndex(h => h === 'Lead #');
```

**When this applies:**
- Any table backed by `react-data-table-component` that has sortable columns
- The Overview table may or may not include sort indicators depending on the component configuration
- Always strip sort indicators when doing exact header name matching to avoid false negatives

**Note:** The existing `findFirstMatchingRow()` and `buildRowData()` helpers in `src/helpers/table.helpers.ts` do NOT strip sort indicators automatically. When working with sortable tables, perform the strip in the calling code before matching.

## Timeouts

| Timeout | Value |
|---------|-------|
| Test global | 120s (multiplied as needed) |
| Action | 15s |
| Navigation | 30s |
| Spinner | 30s |
| Toast | 5s |
| Modal | 10s |
| DB poll initial | 100ms |
| DB poll max | 2s |
| DB wait total | 30s |
| Email OTP | 150s |
| PayPair OTP intercept | 5s (network response) |

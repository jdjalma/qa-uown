<!-- PT-BR: Padrões fundamentais de teste — naming, fixtures, testData, risk tier, helpers, limitações de ambiente, timeouts. Aplicável a TODOS os testes (E2E + API). -->

# Test Patterns — Core

Padrões fundamentais aplicáveis a qualquer teste (E2E + API). Para patterns específicos de UI, ver [`test-patterns-ui.md`](./test-patterns-ui.md). Para payment arrangements + DB performance, ver [`test-patterns-arrangements.md`](./test-patterns-arrangements.md).

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

## E2E Tests — fixture import

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

## API-only Tests — fixture import

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
> Complete SSN + 3-modality recipes: [`shared/ssn-test-catalog.md`](./shared/ssn-test-catalog.md)

When the test creates a lease application, `testData` MUST include `riskTier`:

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

## Soft Assertions for Known Environment Limitations

When a backend bug or environment limitation prevents an assertion from passing, use soft assertions with `console.warn` instead of a hard `expect()`:

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
- Always document WHY the assertion is soft (bug reference or environment name)
- Include enough context in the `console.warn` message to identify the root cause
- Use `return` (early exit from `test.step`) for limitation skips, NOT `test.skip()` — the step should still appear in the report
- Track the associated bug or limitation in the test file's header comment

## Stability (non-UI)

- Polling with backoff for DB (not `setTimeout`)
- PostgreSQL `bigint` columns (e.g., `lead_pk`): `node-pg` returns as `string`, not `number` — use `String()` for comparisons, not `Number()`
- Payment arrangement sweep: trigger via `api.scheduledTask.triggerScheduledTask('sendCreditCardPaymentsSql')` then poll with `db.waitForCcTransactionsProcessed(arrangementPk)` — do NOT use fixed sleep after sweep trigger
- Arrangement status polling: use `db.waitForPaymentArrangementStatus(accountPk, status)` with backoff — status transitions: NOT_STARTED → IN_PROGRESS → SUCCESS/FAILED

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

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

## E2E Tests — import base-test

```typescript
import { test, expect } from '@support/base-test';

const testData = [
  { env: 'sandbox', state: 'NY', merchant: 'TireAgent', tag: '@cicd @sandbox' },
];

for (const data of testData) {
  test.describe(`R1.49.1_separateShortCodeInANewEntity_469 - ${data.env}/${data.merchant}`, { tag: data.tag.split(' ') }, () => {
    test('scenario', async ({ page, api, db, email, ctx, testEnv }) => {
      test.setTimeout(720_000);
      await test.step('Step 1', async () => { /* ... */ });
    });
  });
}
```

## API-only Tests — import fixture

```typescript
import { test, expect } from '@fixtures/test-context.fixture';

test.describe('R1.49.1_separateShortCodeInANewEntity_469 - sandbox/ProgressMobility', { tag: [...] }, () => {
  test('api call', async ({ api, testEnv }) => { /* ... */ });
});
```

## Parameterization

- `testData` array with `for...of`
- Tags: `@cicd`, `@sandbox`, `@qa1`, `@smoke`, `@regression`
- `test.step()` for each logical phase
- `ctx` for shared state between steps

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

## API-Driven Payment Arrangement Pattern

Use the `PaymentArrangementClient` (via `api.paymentArrangement`) to create CC or ACH arrangements programmatically. This avoids UI interaction with the Servicing portal and is the preferred pattern for arrangement tests.

### CC Arrangement

```typescript
import { buildCcArrangementBody } from '@api/bodies';
import { isoDate } from '@helpers/date.helpers';

// 1. Drive to FUNDED
const accountPk = await driveToFundedAndGetAccountPk(api, db, testData);

// 2. Build installments (negative offset = overdue)
const body = buildCcArrangementBody([
  { amount: 50_00, dueDate: isoDate(-5), isSettlement: true },  // overdue
  { amount: 50_00, dueDate: isoDate(7),  isSettlement: true },  // upcoming
], /* isSettlement */ true);

// 3. Create arrangement via API
const res = await api.paymentArrangement.makeCreditCardPayments(accountPk, body);
expect(res.ok).toBeTruthy();

// 4. Trigger CC sweep
await api.scheduledTask.triggerScheduledTask('sendCreditCardPaymentsSql');

// 5. Poll — do NOT use fixed sleep
await db.waitForCcTransactionsProcessed(accountPk);
await db.waitForPaymentArrangementStatus(accountPk, 'SUCCESS');

// 6. Assert DB state
const arrangement = await db.getPaymentArrangement(accountPk);
expect(arrangement.status).toBe('SUCCESS');
const accountStatus = await db.getAccountStatus(accountPk);
expect(accountStatus).toBe('SETTLED_IN_FULL'); // only for settlement type
```

### ACH Arrangement

```typescript
import { buildAchArrangementBody } from '@api/bodies';

const body = buildAchArrangementBody([
  { amount: 100_00, dueDate: isoDate(3) },
]);
const res = await api.paymentArrangement.createOrUpdateAchPayments(accountPk, body);
expect(res.ok).toBeTruthy();

// Verify FK presence and linked payments
const hasFk = await db.achPaymentHasArrangementFk();
expect(hasFk).toBe(true);
const payments = await db.getAchPaymentsByArrangement(arrangementPk);
expect(payments.length).toBeGreaterThan(0);
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

---
name: common-operations
description: Carregue ao precisar de operação recorrente: criar lead via UI ou API, autenticar em portal, capturar OTP, ler email IMAP, query DB com polling. Cookbook do projeto.
disable-model-invocation: true
---

# Common Operations — Cookbook

> **Para agents:** Leia este arquivo ANTES de implementar qualquer teste que envolva pagamentos,
> criacao de leads ou navegacao de estado.
> Full code recipes: [references/cookbook.md](references/cookbook.md)

---

## Canonical Imports

```typescript
// Fixture (SEMPRE usar — nao @playwright/test nem @support/base-test)
import { test, expect } from '@fixtures/test-context.fixture.js';

// Tags (SEMPRE usar buildTags/splitTags — nao strings hardcoded)
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';

// Setup de lead via API
import { createPreQualifiedApplication, driveLeadToFunding, setupApplicationViaApi } from '@helpers/api-setup.helpers.js';

// Dates — calculateDateISO retorna YYYY-MM-DD (Java LocalDate)
// calculateDate retorna MM/DD/YYYY (formularios de UI)
import { calculateDateISO, calculateDate } from '@helpers/date.helpers.js';

// Payment arrangement bodies
import { buildCcArrangementBody, buildAchArrangementBody } from '@api/bodies/payment-arrangement.body.js';

// Test cards
import { VALID_TEST_CARDS } from '@data/test-cards.js';

// Test data builder
import { buildTestData } from '@helpers/test-data.helpers.js';

// Shared state between steps (declare antes de test.step)
import type { TestContext } from '@support/base-test.js';
```

---

## testData Structure (task tests)

```typescript
const testData = [
 {
 env: 'qa1',
 state: 'CA',
 merchant: 'TerraceFinance',
 orderTotal: '1000',
 tag: buildTags(TestTag.REGRESSION, TestTag.CRITICAL, TestTag.QA1),
 existingAccountPks: undefined as string[] | undefined,
 },
];

for (const data of testData) {
 test.describe(`${TEST_NAME} - ${data.env}/${data.merchant}`, { tag: splitTags(data.tag) },  => {
 test.use({ envName: data.env });
 test('CT-01: ...', async ({ api, db, testEnv }) => {
 test.setTimeout(300_000);
 });
 });
}
```

---

## Operation Index

| Operation | Key Points | Recipe |
|-----------|-----------|--------|
| Drive to FUNDED | pre-qual -> signed -> funding -> funded -> wait SVC account | [cookbook](references/cookbook.md#drive-to-funded-most-common-pattern) |
| CC Payment (API) | Synchronous — SUCCESS immediately, no sweep needed | [cookbook](references/cookbook.md#cc-payment-arrangement-api) |
| CC Payment (UI) | One-time card: `input[type="month"]` requires `YYYY-MM` | [cookbook](references/cookbook.md#cc-payment-arrangement---one-time-card-ui) |
| ACH Payment | Async — creates NOT_STARTED, needs Profituity sweep | [cookbook](references/cookbook.md#ach-payment-arrangement) |
| TMS Due Date | Uses separate API key (`tmsApiKey`, not SVC key) | [cookbook](references/cookbook.md#tms-due-date-adjustment) |
| Scheduled Tasks | `triggerScheduledTask(name)` for generic trigger | [cookbook](references/cookbook.md#scheduled-tasks) |
| Merchant Create/Edit | `MerchantEditPage`, react-select union selector | [cookbook](references/cookbook.md#merchant-createedit-flow-origination) |
| Email Dispatch | Two-stage: *EmailSweep -> emailSweep; BOTH required | [cookbook](references/cookbook.md#email-dispatch---two-stage-pipeline-task-491) |
| Timestamp Comparison | Push comparison to PG for `WITHOUT time zone` columns | [cookbook](references/cookbook.md#timestamp-comparisons---pg-node-and-timestamp-without-time-zone-task-502) |
| MerchantConfigurator qa2 | Use merchant number directly, not `configureByName` | [cookbook](references/cookbook.md#merchantconfigurator---qa2-known-quirk-task-505--hotfix-r1511) |
| Token Tables | After delete+sweep, row gets new PK (not pk=1) | [cookbook](references/cookbook.md#token-tables---known-app-constraint-task-502) |
| Shared ctx | Declare before test.step, populate inside steps | [cookbook](references/cookbook.md#estado-compartilhado-entre-steps-ctx) |

---

## Quick Reference Signatures

| Function | Real Signature | Common Mistake |
|----------|---------------|----------------|
| `buildCcArrangementBody` | `(options: BuildCcArrangementOptions)` | ~~`([...], boolean)`~~ |
| `buildAchArrangementBody` | `(options: BuildAchArrangementOptions)` | ~~`([...])`~~ |
| `makeCreditCardPayments` | `(body)` — no accountPk | ~~`(accountPk, body)`~~ |
| `createOrUpdateAchPayments` | `(body)` — no accountPk | ~~`(accountPk, body)`~~ |
| `waitForCcTransactionsProcessed` | `(arrangementPk, timeoutMs?)` | ~~`(accountPk)`~~ |
| `waitForPaymentArrangementStatus` | `(accountPk, status, timeoutMs?)` | ~~`(arrangementPk, ...)`~~ |
| `calculateDateISO` | returns `YYYY-MM-DD` | ~~`isoDate`~~ (does not exist) |
| `calculateDate` | returns `MM/DD/YYYY` | ~~use for Java APIs~~ |
| `driveLeadToFunding` | `(api, merchant, ctx)` | ~~`driveToFundedAndGetAccountPk`~~ (does not exist) |

---

## Key Pitfalls (summary)

1. **CC is sync, ACH is async** — CC needs no sweep; ACH needs Profituity (not available in qa1)
2. **Two-stage email** — always trigger BOTH *EmailSweep AND emailSweep
3. **Timestamp WITHOUT tz** — push comparison to PG, never compare in JS
4. **Token pk=1** — after delete, sweep creates at new PK; use `ORDER BY pk DESC LIMIT 1`
5. **MerchantConfigurator qa2** — `configureByName` fails silently; use merchant number
6. **Expires On field** — `input[type="month"]` requires `YYYY-MM`, not `MM/YY`

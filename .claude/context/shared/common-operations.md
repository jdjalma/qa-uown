# Common Operations — Cookbook

> **Para agents:** Leia este arquivo ANTES de implementar qualquer teste que envolva pagamentos,
> criação de leads ou navegação de estado. Todos os exemplos são extraídos de testes reais e
> validados contra o código fonte.

---

## Imports canônicos

```typescript
// Fixture (SEMPRE usar — não @playwright/test nem @support/base-test)
import { test, expect } from '@fixtures/test-context.fixture.js';

// Tags (SEMPRE usar buildTags/splitTags — não strings hardcoded)
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';

// Setup de lead via API
import { createPreQualifiedApplication, driveLeadToFunding, setupApplicationViaApi } from '@helpers/api-setup.helpers.js';

// Dates — calculateDateISO retorna YYYY-MM-DD (Java LocalDate)
//         calculateDate retorna MM/DD/YYYY (formulários de UI)
import { calculateDateISO, calculateDate } from '@helpers/date.helpers.js';

// Payment arrangement bodies
import { buildCcArrangementBody, buildAchArrangementBody } from '@api/bodies/payment-arrangement.body.js';

// Cartões de teste
import { VALID_TEST_CARDS } from '@data/test-cards.js';
// VALID_TEST_CARDS[0].cardNumber, .expirationDate, .cvv

// Test data builder
import { buildTestData } from '@helpers/test-data.helpers.js';

// Shared state between steps (declare antes de test.step)
import type { TestContext } from '@support/base-test.js';
```

---

## Estrutura de testData (task tests)

```typescript
const testData = [
  {
    env: 'qa1',
    state: 'CA',
    merchant: 'TerraceFinance',
    orderTotal: '1000',
    tag: buildTags(TestTag.REGRESSION, TestTag.CRITICAL, TestTag.QA1),
    // GDS bypass: preencher quando GDS está fora (todos UW_DENIED)
    // Cada CT que modifica uma conta precisa do seu próprio PK
    existingAccountPks: undefined as string[] | undefined,
  },
];

for (const data of testData) {
  test.describe(`${TEST_NAME} - ${data.env}/${data.merchant}`, { tag: splitTags(data.tag) }, () => {
    test.use({ envName: data.env });

    test('CT-01: ...', async ({ api, db, testEnv }) => {
      test.setTimeout(300_000);
      // ...
    });
  });
}
```

---

## Drive to FUNDED (padrão mais comum)

```typescript
import type { TestContext } from '@support/base-test.js';
import type { ApiClients } from '@support/base-test.js';
import type { DatabaseHelpers } from '@helpers/database.helpers.js';
import type { ConfigEnvironment } from '@config/environment.js';
import { buildTestData } from '@helpers/test-data.helpers.js';
import { createPreQualifiedApplication, driveLeadToFunding } from '@helpers/api-setup.helpers.js';
import { sleep } from '@helpers/common.helpers.js';

async function driveToFunded(
  api: ApiClients,
  db: DatabaseHelpers,
  testEnv: ConfigEnvironment,
  data: { env: string; state: string; merchant: string; orderTotal: string },
  existingAccountPk?: string,
): Promise<{ leadPk: string; accountPk: string }> {
  // GDS bypass: usar conta existente quando GDS indisponível
  if (existingAccountPk) {
    console.log(`[Setup] Using existing accountPk=${existingAccountPk} (GDS bypass)`);
    return { leadPk: '0', accountPk: existingAccountPk };
  }

  const td = buildTestData({ env: data.env, state: data.state, merchant: data.merchant, orderTotal: data.orderTotal });

  const ctx: TestContext = {
    leadPk: '', leadUuid: '', accountPk: '', accountNumber: '',
    contractStatus: '', contractUrl: '', websiteAccountPk: '', achAdded: 0, ccAdded: 0,
    reportKeys: new Map<string, string>(),
  };

  // Padrão pre-qual: sendApplication SEM order → 5s → getApplicationStatus → sendInvoice → submitApplication
  await createPreQualifiedApplication(api, td.merchant, td.applicant, ctx, {
    submitPaymentInfoViaApi: true,
  });

  // SIGNED → SETTLED → FUNDING
  await driveLeadToFunding(api, td.merchant, ctx);

  // FUNDING → FUNDED
  await sleep(2_000);
  const fundedResp = await api.lead.updateFundingStatus([Number(ctx.leadPk)], 'FUNDED');
  if (!fundedResp.ok) throw new Error(`updateFundingStatus FUNDED failed: ${fundedResp.status}`);

  // Aguardar criação da conta SVC (assíncrono após FUNDED)
  const accountPk = await db.waitForAccountByLeadPk(ctx.leadPk, 30_000);
  if (!accountPk) throw new Error(`SVC account not created for leadPk=${ctx.leadPk}`);

  return { leadPk: ctx.leadPk, accountPk };
}
```

---

## CC Payment Arrangement

> **IMPORTANTE:** CC é **síncrono** — `makeCreditCardPayments` processa a cobrança na mesma
> requisição. O arrangement já está como SUCCESS imediatamente após a chamada. Nenhum sweep é
> necessário.

```typescript
// Imports necessários
import { buildCcArrangementBody } from '@api/bodies/payment-arrangement.body.js';
import { calculateDateISO } from '@helpers/date.helpers.js';
import { VALID_TEST_CARDS } from '@data/test-cards.js';

// ctx.accountPk deve estar preenchido antes

// 1. Build body — OBJETO de opções (NÃO array + boolean)
const body = buildCcArrangementBody({
  accountPk: Number(ctx.accountPk),         // obrigatório, tipo number
  arrangementType: 'SETTLEMENT',             // 'SETTLEMENT' | 'NORMAL'
  ccNumber: VALID_TEST_CARDS[0].cardNumber,
  ccExp: VALID_TEST_CARDS[0].expirationDate,
  cvc: VALID_TEST_CARDS[0].cvv,
  installments: [
    { amount: '100', date: calculateDateISO(0) },  // amount=string, date=YYYY-MM-DD
  ],
});

// 2. Criar arrangement — corpo já tem accountPk, SEM parâmetro extra
const res = await api.paymentArrangement.makeCreditCardPayments(body);
expect(res.ok, `makeCreditCardPayments: ${res.status} — ${JSON.stringify(res.body)}`).toBeTruthy();

// 3. CC é síncrono — arrangement já SUCCESS aqui
const arrangement = await db.getPaymentArrangement(ctx.accountPk);
ctx.arrangementPk = String(arrangement?.pk ?? '');
expect(arrangement!.status).toBe('SUCCESS');
expect(arrangement!.arrangement_type).toBe('SETTLEMENT');

// 4. Poll CC transactions — usa ARRANGEMENT pk, não account pk
await db.waitForCcTransactionsProcessed(ctx.arrangementPk, 60_000);

// 5. Poll arrangement status — usa ACCOUNT pk
await db.waitForPaymentArrangementStatus(ctx.accountPk, 'SUCCESS', 60_000);

// 6. Verificar status da conta (apenas SETTLEMENT transiciona para SETTLED_IN_FULL)
const accountStatus = await db.getAccountStatus(ctx.accountPk);
expect(accountStatus).toBe('SETTLED_IN_FULL');
```

---

## CC Payment Arrangement — One-Time Card (UI)

> When filling the one-time card form in the Make Payment modal, the **Expires On** field is
> `input[type="month"]` and requires `YYYY-MM` format. Other formats cause `Error: Malformed value`.

```typescript
// Convert MM/YY or full year before filling
const fullYear = expYear.length === 2 ? `20${expYear}` : expYear;
await page.locator("input[placeholder='Expires On']").fill(`${fullYear}-${expMonth}`);
// Example: expMonth='12', expYear='28' → fills '2028-12'
```

When a Servicing account already has a card on file, `makeCcPaymentArrangement()` defaults to
"Use existing card information". Pass `ccDetails` to switch to the one-time card form:

```typescript
await servicingBasePage.makeCcPaymentArrangement({
  startDate: calculateDate(0),
  endDate: calculateDate(30),
  frequency: 'Monthly',
  ccDetails: {
    firstName: 'John',
    lastName: 'Doe',
    cardNumber: VALID_TEST_CARDS[0].cardNumber,
    cvc: VALID_TEST_CARDS[0].cvv,
    expMonth: '12',
    expYear: '28',   // 2-digit or 4-digit — method normalizes internally
  },
});
```

Selectors added in Task #483 (`CreditCardSelectors`):

| Selector key | Selector | Notes |
|---|---|---|
| `otCardFirstName` | `input[placeholder='First Name']` | One-time card form |
| `otCardLastName` | `input[placeholder='Last Name']` | One-time card form |
| `otCardExpiresOn` | `input[placeholder='Expires On']` | `type="month"` — use `YYYY-MM` |
| `otCardSecurityCode` | `input[placeholder='Card Security Code']` | CVV/CVC |

---

## ACH Payment Arrangement

> **IMPORTANTE:** ACH é **assíncrono** — `createOrUpdateAchPayments` cria entradas NOT_STARTED.
> O sweep (via Profituity) processa depois. **NÃO testável em qa1** — Profituity inativo lá.
> Body deve ter `achProcessType: 'REQUEST'` para o sweep pegar sem checar data de vencimento.
> O builder já inclui `achProcessType: 'REQUEST'` por padrão.

```typescript
import { buildAchArrangementBody } from '@api/bodies/payment-arrangement.body.js';
import { calculateDateISO } from '@helpers/date.helpers.js';

// Build body — OBJETO de opções
const body = buildAchArrangementBody({
  accountPk: Number(ctx.accountPk),   // obrigatório
  arrangementType: 'SETTLEMENT',       // 'SETTLEMENT' | 'NORMAL', default='SETTLEMENT'
  installments: [
    { amount: '100', date: calculateDateISO(3) },  // amount=string, date=YYYY-MM-DD
  ],
  // Opcional: routingNumber, accountNumber, bankAccountType (defaults de TEST_BANK)
});

// Criar arrangement — corpo já tem accountPk, SEM parâmetro extra
const res = await api.paymentArrangement.createOrUpdateAchPayments(body);
expect(res.ok).toBeTruthy();

// Verificar FK e pagamentos ACH criados
const hasFk = await db.achPaymentHasArrangementFk();
expect(hasFk).toBe(true);

const arrangement = await db.getPaymentArrangement(ctx.accountPk);
ctx.arrangementPk = String(arrangement!.pk);
const payments = await db.getAchPaymentsByArrangement(ctx.arrangementPk);
expect(payments.length).toBeGreaterThan(0);
expect(payments[0].status).toBe('PENDING');

// ACH sweep — só em ambientes com Profituity ativo (não qa1)
// Se necessário testar sem Profituity, usar simulação via DB (ver database.helpers.ts):
//   await db.simulateCcSweepForArrangement(ctx.arrangementPk);
//   await db.recalculateArrangementStatus(ctx.arrangementPk);
```

---

## Assinaturas de referência rápida

| Função | Assinatura real | Erro comum |
|--------|----------------|------------|
| `buildCcArrangementBody` | `(options: BuildCcArrangementOptions)` | ~~`([...], boolean)`~~ |
| `buildAchArrangementBody` | `(options: BuildAchArrangementOptions)` | ~~`([...])`~~ |
| `makeCreditCardPayments` | `(body)` — sem accountPk | ~~`(accountPk, body)`~~ |
| `createOrUpdateAchPayments` | `(body)` — sem accountPk | ~~`(accountPk, body)`~~ |
| `waitForCcTransactionsProcessed` | `(arrangementPk, timeoutMs?)` | ~~`(accountPk)`~~ |
| `waitForPaymentArrangementStatus` | `(accountPk, status, timeoutMs?)` | ~~`(arrangementPk, ...)`~~ |
| `calculateDateISO` | retorna `YYYY-MM-DD` | ~~`isoDate()`~~ (não existe) |
| `calculateDate` | retorna `MM/DD/YYYY` | ~~usar para APIs Java~~ |
| `driveLeadToFunding` | `(api, merchant, ctx)` | ~~`driveToFundedAndGetAccountPk()`~~ (não existe) |

---

## TMS Due Date Adjustment

```typescript
// Endpoint TMS usa API KEY separada (FIVE9_TMS_API_KEY, não SVC key)
// testEnv.tmsApiKey  ← chave correta
const res = await api.account.moveDueDatesByDays(ctx.accountPk, 7);
// ou via TMS:
// POST /uown/tms/v1/accounts/{pk}/next-due-date/adjustments
// Header: Authorization: testEnv.tmsApiKey
```

---

## Scheduled Tasks

```typescript
// Sweep CC
await api.scheduledTask.sendCreditCardPaymentsSweep();

// Ou via trigger genérico (nome da task)
await api.scheduledTask.triggerScheduledTask('sendCreditCardPaymentsSweep');
```

---

## Merchant Create/Edit Flow (Origination)

> Task #1262. Uses `MerchantEditPage` (`src/pages/origination/merchant-edit.page.ts`).

```typescript
import { MerchantEditPage } from '@pages/origination/merchant-edit.page.js';

// Create a new merchant with Inventory Category
await test.step('Navigate to Add Merchant form', async () => {
  merchantPage = new MerchantEditPage(page);
  await merchantPage.navigateToAddMerchant(env.originationUrl);
});

await test.step('Fill form and save', async () => {
  await merchantPage.fillMerchantForm({
    refCode: 'OW90999-0001',
    name: 'Test Merchant',
    legalName: 'Test Merchant LLC',
    locationName: 'Main Location',
    inventoryCategory: 'ELECTRONICS',
  });
  // selectInventoryCategory is called internally by fillMerchantForm when inventoryCategory is provided
});

// Verify DB — note uown_merchant column names
await test.step('Verify DB record', async () => {
  const row = await db.getMerchantByRefCode('OW90999-0001');
  expect(row.inventory_category).toBe('ELECTRONICS');
  // Timestamp columns: row_created_timestamp / row_updated_timestamp (NOT created_at/updated_at)
  // Acting user column: agent (NOT created_by/updated_by)
  expect(row.agent).toBeDefined();
});

// Verify absence (blocked save — e.g., missing Inventory Category)
const count = await db.countMerchantByRefCode('OW90999-BLOCKED');
expect(count).toBe(0);
```

### React-select option picker — union selector for Origination forms

Origination forms mix `filter__*` (themed, classNamePrefix="filter") and `css-*` (default) prefixes within the same page. Use the following union selector to target dropdown options regardless of which prefix is applied:

```typescript
const REACT_SELECT_OPTION_UNION =
  '.filter__option, [class*="css-"][class*="option-"], ' +
  '[class*="-option"]:not([class*="options"]):not([class*="placeholder"]):not([class*="single-value"])';
```

### Clone dropdown (Add Merchant form)

The clone trigger is `<a class="dropdownContainer__ddButton">` (not `<button>`). Menu items are `.dropdown-item` inside `.dropdown.show`. The first item is a header containing the search input — always exclude it:

```typescript
// openCloneDropdown() clicks the <a> trigger
await merchantPage.openCloneDropdown();
// selectMerchantToClone types in search input and clicks first non-header item
await merchantPage.selectMerchantToClone('OW90218');
```

---

## Email Dispatch — Two-Stage Pipeline (Task #491)

> **CRITICAL:** Any test that validates an email triggered by a sweep task MUST run BOTH sweeps in sequence, or the IMAP assertion will time out.

The email dispatch pipeline is two-stage:

1. **`*EmailSweep` task** (e.g., `settledInFullAccountEmailSweep`) — enqueues rows in `uown_email_queue` with status `PENDING`; writes a row to `uown_correspondence_logs`.
2. **`emailSweep` task** — picks up PENDING rows and dispatches via SendGrid. Terminal status on successful dispatch is `STORED` (not `SENT`) in qa2; confirmed by `sent_time IS NOT NULL`.

```typescript
// Always run both sweeps in sequence
await api.scheduledTask.triggerScheduledTask('settledInFullAccountEmailSweep');
await helpers.waitForEmailQueueRecord(db, toEmail, accountPk, 'settled-in-full', 30_000);
await api.scheduledTask.triggerScheduledTask('emailSweep');
await helpers.waitForEmailQueueDispatched(db, queuePk, 60_000);
```

### Debugging when no row lands in uown_email_queue

If the sweep triggers but no `uown_email_queue` row is created, check `uown_correspondence_logs.error` — it captures service-side failures like `"No data associated with correspondence request"` that silently prevent enqueue.

```sql
SELECT error, template_name, row_created_timestamp
FROM uown_correspondence_logs
WHERE account_pk = <accountPk>
ORDER BY row_created_timestamp DESC;
```

### Schema notes (Task #491)

- `uown_sv_account` does **NOT** have `customer_pk`. The relationship is: `uown_sv_customer.account_pk → uown_sv_account.pk`.
- `uown_correspondence_logs` native columns: `pk`, `agent`, `row_created_timestamp`, `row_updated_timestamp`, `tenant_id`, `web_user_id`, `data_map`, `error`, `source`, `template_name`, `correspondence_type`, `account_pk`, `lead_pk`. There is NO `recipient`, `status`, or `updated_by` — derive those via JOIN on `uown_email_queue`.

### settled-in-full helpers

```typescript
import {
  findEligibleSettledInFullAccount,
  waitForEmailQueueRecord,
  waitForEmailQueueDispatched,
  getCorrespondenceLog,
} from '@helpers/index.js';
```

---

---

## Timestamp Comparisons — pg-node and `timestamp without time zone` (Task #502)

> **PITFALL:** When pg-node reads a `timestamp without time zone` column, the returned JS `Date` is timezone-interpreted by the Node.js process locale. Comparing `row.expiration_time.getTime()` against `Date.now()` is unreliable across environments.

**Wrong pattern (do NOT use):**
```typescript
// WRONG — timezone-sensitive
const row = await db.getSingleRow<KountTokenRow>('SELECT expiration_time FROM uown_kount_token WHERE pk = 1');
expect(row.expiration_time.getTime()).toBeGreaterThan(Date.now()); // unreliable
```

**Correct pattern — push comparison to PG:**
```typescript
// CORRECT — comparison happens in Postgres, JS receives boolean
const { ok } = await db.getSingleRow<{ ok: boolean }>(
  `SELECT (expiration_time > now() + interval '30 seconds') AS ok FROM uown_kount_token WHERE pk = $1`,
  [1],
);
expect(ok).toBe(true);
```

Alternatively, use `waitForValueChange` to detect that the token string itself changed:
```typescript
const newToken = await db.waitForValueChange(
  'SELECT access_token FROM uown_kount_token WHERE pk = $1',
  [1],
  oldToken,
  30_000,
);
expect(newToken).not.toBe(oldToken);
```

**Affected tables:**
- `uown_kount_token.expiration_time` — `timestamp WITHOUT time zone` — apply the PG-side pattern
- `uown_gds_token.expiration_time` — `timestamp WITH time zone` — pg-node handles correctly; direct JS comparison is safe

---

## MerchantConfigurator — qa2 known quirk (Task #505 / hotfix R1.51.1)

`MerchantConfigurator.configureByName(merchantName, ...)` calls `/uown/los/getMerchantsByRefCode` using the lowercase `refCode` key from `src/data/merchants.ts` (e.g., `'danielsjewelers'`). In qa2, this endpoint matches by the actual `ref_merchant_code` column value (e.g., `'OL90205-0079'`). The mismatch causes the configurator to return 0 results and fail silently, blocking preflight for:

- Daniel's Jewelers (`OL90205-0079`)
- Saslow's Jewelers CA (`OW90337-0001`)
- FirstApp merchants
- Dickinson Jewelers (`KS4123`)
- Kornerstone merchants

**Workaround — tests that do NOT need to mutate merchant config:**

Pass `skipMerchantPreflight: true` to avoid calling `configureByName` entirely:

```typescript
await createPreQualifiedApplication(api, merchant, applicant, ctx, {
  submitPaymentInfoViaApi: true,
  skipMerchantPreflight: true,  // skip when config mutation is not needed
});
```

**Workaround — tests that DO need to mutate merchant config:**

Use the merchant number directly instead of `configureByName`:

```typescript
// Pass the ref_merchant_code (number field from src/data/merchants.ts), not the refCode key
await mSetup.configure(MERCHANTS.DanielsJewelers.number, { isCcRequired: true, ... });
```

---

## Token Tables — known app constraint (Task #502)

`RefreshKountAccessTokenSweepService` and `RefreshGdsAccessTokenSweepService` (commit `213b96b54`) call `loadOrCreateToken().setPk(...)` followed by `repo.save(...)`. Because the entity uses `@GeneratedValue`, the explicit `setPk` is ignored on INSERT — the DB assigns a new PK. Consequence: **after deleting pk=1 from `uown_kount_token` or `uown_gds_token`, the sweep recreates the row at a new auto-incremented PK, not pk=1**. Tests that rely on `WHERE pk = 1` will find no row after a delete+sweep cycle. Use `ORDER BY pk DESC LIMIT 1` or `waitForValueChange` targeting the latest row instead.

---

## Estado compartilhado entre steps (ctx)

```typescript
// Declarar ANTES de test.step
const ctx: {
  leadPk: string;
  leadUuid: string;
  accountPk: string;
  arrangementPk: string;
} = { leadPk: '', leadUuid: '', accountPk: '', arrangementPk: '' };

// Preencher em steps
await test.step('Setup', async () => {
  ctx.accountPk = '4438';
});

await test.step('Assert', async () => {
  // ctx.accountPk disponível aqui
  const status = await db.getAccountStatus(ctx.accountPk);
});
```

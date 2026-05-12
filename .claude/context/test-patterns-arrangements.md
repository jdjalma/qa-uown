<!-- PT-BR: Padrões de teste para Payment Arrangements (CC + ACH), FK validation, GDS bypass (existingAccountPks), expression index verification. -->

# Test Patterns — Payment Arrangements + DB

Padrões específicos para payment arrangements (CC/ACH), schema/FK validation, GDS unavailability bypass e expression indexes. Para padrões fundamentais, ver [`test-patterns-core.md`](./test-patterns-core.md). Para padrões UI, ver [`test-patterns-ui.md`](./test-patterns-ui.md).

## API-Driven Payment Arrangement Pattern

Use `PaymentArrangementClient` (via `api.paymentArrangement`) para criar CC ou ACH arrangements programmatically. Evita interação com UI do Servicing portal e é o padrão preferido para testes de arrangement.

### CC Arrangement

> **CRITICAL:** CC arrangements são **síncronos** — `makeCreditCardPayments` processa a cobrança dentro da mesma request HTTP. O arrangement transiciona NOT_STARTED → SUCCESS imediatamente. Sweep não é necessário (mas é seguro chamar).

```typescript
import { buildCcArrangementBody } from '@api/bodies/payment-arrangement.body.js';
import { calculateDateISO } from '@helpers/date.helpers.js';  // NOT isoDate — that doesn't exist
import { VALID_TEST_CARDS } from '@data/test-cards.js';

// 1. Drive to FUNDED — see common-operations.md
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

// 4. Get arrangementPk from DB (CC is synchronous — already SUCCESS)
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

> **CRITICAL:** ACH arrangements são **assíncronos** — `createOrUpdateAchPayments` cria entries NOT_STARTED. O sweep (`sendACHPaymentsSweep` via Profituity) processa depois. Full ACH flow **NÃO é testável em qa1** — Profituity inativo lá.

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

## GDS Unavailability Bypass — `existingAccountPks`

When GDS is unavailable (all new applications get `UW_DENIED`), tests that require `FUNDED` accounts can bypass account creation by providing pre-seeded account PKs in `testData`.

> **AVISO:** Ver `.claude/rules/testing.md § Test Data Hierarchy` — reuso de conta existente é EXCEÇÃO, exige justificativa. GDS bypass é exceção documentada.

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
- Cada CT que modifica uma conta (cria arrangement) precisa da própria PK — uma por index
- Indexar explicitamente: `[0]=CT-02, [1]=CT-03, ...` (documentar em comentário)
- Remover entries após GDS recuperar (ou setar `existingAccountPks: undefined`)
- Usar apenas contas ACTIVE (não SETTLED_IN_FULL / CLOSED / CHARGED_OFF)
- Usar `src/scripts/find-eligible-accounts.ts` para query

## Expression Index Verification Pattern

Ao testar performance indexes que usam SQL expressions (`UPPER(col)`, `col1 || col2`), o helper `db.getIndexColumns()` padrão não funciona — query `pg_attribute` só cobre named columns.

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

PostgreSQL stores UPPER expressions in `indexdef` as `upper((col)::text)`. Para UPPER indexes (Tasks #463), asserir `.toLowerCase().toContain('upper')` e `.toContain(exprColumn)` no indexdef string.

---
name: common-operations
description: Carregue ao precisar de operação recorrente: criar lead via UI ou API, autenticar em portal, capturar OTP, ler email IMAP, query DB com polling. Cookbook do projeto.
disable-model-invocation: true
---

# Common Operations — Cookbook

> **Para agents:** Leia este arquivo ANTES de implementar qualquer teste que envolva pagamentos,
> criacao de leads ou navegacao de estado.
> Full code recipes: [references/cookbook.md](references/cookbook.md)

> **Authority boundary** (fronteira de autoridade — `docs/_docs-conventions.md` §7): esta skill cobre **WHAT OPERATIONS EXIST** — recipes, canonical imports, operation sequences. Para **nomes e assinaturas atuais de helpers** (que mudam a cada release), consulte [[helpers-catalog]] ou leia `src/helpers/` diretamente antes de implementar — esta skill pode estar desatualizada em relação ao código. **Não confie em assinatura de helper aqui como fonte canônica** — confirme no arquivo.

---

## Canonical Imports

> **REGRA DE IMPORT (DRY):** todo helper de RUNTIME entra via o barrel `@helpers/index.js` —
> NUNCA o caminho do módulo individual (`@helpers/api-setup.helpers.js`, `@helpers/date.helpers.js`, …).
> O barrel re-exporta tudo de `src/helpers/`; importar direto fragmenta o ponto de reuso e
> esconde helpers que já existem. Única exceção: `import type` pode apontar o módulo específico
> quando for um tipo que o barrel não re-exporta. Mesmo princípio vale para `@data/index.js`.

```typescript
// Fixture (SEMPRE usar — nao @playwright/test nem @support/base-test)
import { test, expect } from '@fixtures/test-context.fixture.js';

// Tags (SEMPRE usar buildTags/splitTags — nao strings hardcoded)
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';

// TODOS os helpers de runtime via barrel — setup de lead, datas, test-data, etc.
// calculateDateISO retorna YYYY-MM-DD (Java LocalDate); calculateDate retorna MM/DD/YYYY (UI)
import {
  createPreQualifiedApplication, driveLeadToFunding, setupApplicationViaApi,
  calculateDateISO, calculateDate,
  buildTestData,
} from '@helpers/index.js';

// Payment arrangement bodies (vivem em @api/bodies — não são helpers)
import { buildCcArrangementBody, buildAchArrangementBody } from '@api/bodies/payment-arrangement.body.js';

// Test cards (via @data barrel)
import { VALID_TEST_CARDS } from '@data/index.js';

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
| Activity-log assert | Use the **oracle** helpers, NOT raw SELECT | [§ Activity-log assertions](#activity-log-assertions-oracle--regra-13) |

---

## Activity-log assertions (oracle — regra #13)

> **PARE de escrever `SELECT ... FROM uown_los_lead_notes` / `uown_los_activity_log ...` inline.** Toda asserção de log (regra #13 — "no log = nothing is happening") passa pelo **oracle** em `src/helpers/activity-log.helpers.ts`, exportado pelo barrel `@helpers/index.js`. Era SELECT duplicado em 10+ specs; agora é uma superfície única e descobrível. Os helpers **RETORNAM a row (ou null) — não chamam `expect()`**; a asserção mora no teste.

Escolha a tabela pela origem do evento — o oracle cobre as duas a partir do mesmo import:
- `uown_los_lead_notes` (timeline free-text): `findLeadNoteContaining` · `countLeadNotesContaining` · `waitForLeadNoteSubstring` (alias `waitForLeadNote`) · `getLeadNotesByLeadPk`.
- `uown_los_activity_log` (LOS structured — Buddy/Protection Plan, correspondence, data-change vivem AQUI, não em lead_notes): `findActivityLogContaining` · `countActivityLogContaining` · `waitForActivityLogSubstring`.

```typescript
import { waitForActivityLogSubstring } from '@helpers/index.js';

// Evento LOS é escrito ASYNC após a ação → use o waiter (poll), não single-shot.
// Retorna a row; throw com mensagem descritiva no timeout. Asserção fica no teste.
const log = await waitForActivityLogSubstring(db, fundedAccount.leadPk, 'Protection Plan');
expect(log.logType).toBe('DATA_CHANGE');
expect(log.notes).toContain('enrolled');
```

**Notas:**
- `findActivityLogContaining(db, keyPk, substring, keyColumn?)` filtra por `lead_pk` (default) ou `account_pk` — passe `'account_pk'` para logs do lado servicing.
- `countActivityLogContaining` / `countLeadNotesContaining` para **idempotência** (re-rodar a ação NÃO deve duplicar o log).
- Soft-deleted (`deleted = true`) é excluído de toda leitura — log escondido não é consequência observável.
- SELECT-only. Escrever SELECT cru de activity-log num spec quando o oracle já cobre = retrabalho e drift de schema; o oracle existe para matar esse anti-pattern.

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
| `findActivityLogContaining` | `(db, keyPk, substring, keyColumn?)` → row\|null | ~~raw `SELECT ... uown_los_activity_log`~~ |
| `waitForActivityLogSubstring` | `(db, keyPk, substring, options?)` → row (throws on timeout) | ~~single-shot query racing async log~~ |
| `waitForLeadNoteSubstring` | `(db, leadPk, substring, ...)` → row | ~~raw `SELECT ... uown_los_lead_notes`~~ |

---

## Key Pitfalls (summary)

1. **CC is sync, ACH is async** — CC needs no sweep; ACH needs Profituity (not available in qa1)
2. **Two-stage email** — always trigger BOTH *EmailSweep AND emailSweep
3. **Timestamp WITHOUT tz** — push comparison to PG, never compare in JS
4. **Token pk=1** — after delete, sweep creates at new PK; use `ORDER BY pk DESC LIMIT 1`
5. **MerchantConfigurator qa2** — `configureByName` fails silently; use merchant number
6. **Expires On field** — `input[type="month"]` requires `YYYY-MM`, not `MM/YY`
7. **Activity-log via oracle** — never raw `SELECT` on `uown_los_lead_notes`/`uown_los_activity_log`; use `waitForActivityLogSubstring`/`waitForLeadNoteSubstring` (regra #13) — see § Activity-log assertions

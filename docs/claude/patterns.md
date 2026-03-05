# Test Patterns & Conventions

> Padrões de teste, fixtures, hooks, tags e boas práticas. Referenciado pelo CLAUDE.md.

---

## Test patterns

### E2E tests — import de base-test

```typescript
import { test, expect } from '@support/base-test';

test('flow', async ({ page, api, db, email, ctx, testEnv }) => {
  await test.step('Step name', async () => { /* ... */ });
});
```

### API-only tests — import de fixture

```typescript
import { test, expect } from '@fixtures/test-context.fixture';

test('api call', async ({ request, testEnv, api }) => { /* ... */ });
```

> Ambos resolvem para o mesmo `base.extend<BaseTestFixtures>`. Distinção semântica.

### Parametrização — for...of sobre arrays de dados

```typescript
const testData = [
  { env: 'sandbox', state: 'NY', merchant: 'TireAgent', tag: '@cicd @sandbox' },
];

for (const data of testData) {
  test.describe(`Flow - ${data.env}`, { tag: data.tag.split(' ') }, () => {
    test(`Creating account`, async ({ page, api, db, ctx }) => {
      test.setTimeout(720_000);
    });
  });
}
```

### Page Objects — instanciar com page

```typescript
const customerPage = new OriginationCustomerPage(page);
```

---

## Convenções de código

* TypeScript `"strict": true`, `"noImplicitReturns": true`.
* Imports absolutos via path aliases (`@pages/*`, `@api/*`, `@helpers/*`, etc.).
* Barrel exports: todo módulo expõe `index.ts`.
* Seletores centralizados em `SELECTORS` const.
* Tagging: usar `TestTag` enum + `buildTags()`.
* DRY & Independência: testes auto-contidos, lógica reutilizável em helpers/page objects.
* Commits: Conventional Commits (`feat(origination): add funding queue test`).

---

## Fixtures disponíveis

| Fixture | Tipo | Descrição |
|---------|------|-----------|
| `testEnv` | `ConfigEnvironment` | URLs, credenciais, DB config por ambiente |
| `api` | `ApiClients` | Clients tipados (application, invoice, lead, settlement, creditCard, scheduledTask) |
| `apiClient` | `BaseApiClient` | Legacy unified client (backwards-compat) |
| `db` | `DatabaseHelpers` | Pool PostgreSQL, queries, polling com backoff |
| `email` | `EmailHelpers` | IMAP OTP extraction + email link extraction (Gmail) |
| `ctx` | `TestContext` | Estado compartilhado (leadPk, leadUuid, accountPk, accountNumber, etc.) |
| `consoleLogs` | `() => string[]` | Console errors/warnings capturados |
| `page` | `Page` | Playwright page (com auto-hooks) |

---

## Auto-hooks

* **BEFORE**: `disableCssAnimations(page)`, `captureConsoleLogs(page)`
* **AFTER**: `attachScreenshotOnFailure()`, `attachTestMetadata()`
* Manual: `attachConsoleLogsOnFailure()`, `waitForPageReady(page)`

---

## Test Pyramid Tags

Tags no enum `TestTag` (`src/types/enums.ts`), helpers `buildTags()` e `splitTags()`.

| Tag | Escopo | Quando rodar |
|-----|--------|-------------|
| `@regression` | Cobertura completa | Nightly / pré-release |
| `@sanity` | Fluxos core | Após cada deploy |
| `@smoke` | Health check rápido | A cada commit / PR |
| `@critical` | Business-critical (ortogonal) | Sempre no CI |
| `@cicd` | Pipeline CI/CD | CI |
| `@sandbox`, `@qa1`, etc. | Ambiente-específico | Por ambiente |

```typescript
import { TestTag, buildTags, splitTags } from '@types/enums.js';
const testData = [
  { env: 'sandbox', tag: buildTags(TestTag.CRITICAL, TestTag.REGRESSION, TestTag.SANDBOX) },
];
test.describe('My Test', { tag: splitTags(data.tag) }, () => { ... });
```

### Mapa de tags por teste

| Teste | Tags |
|-------|------|
| `unified-flow.spec.ts` | `@critical @regression @cicd @{env}` |
| `new-application.spec.ts` | `@sanity @regression` |
| `new-application-api.spec.ts` | `@smoke @sanity @regression` |
| `payment-transaction.spec.ts` | `@sanity @regression` |
| `reverse-payment.spec.ts` | `@critical @regression` |
| `paytomorrow-refund-flow.spec.ts` | `@critical @regression @{env}` |
| `paytomorrow-refund-flow-api.spec.ts` | `@sanity @regression @{env}` |
| `tire-agent-unified-flow.spec.ts` | `@regression @sandbox` |

---

## Boas práticas — Estabilidade

* Sempre aguardar **spinner** após navegação (`waitForSpinner()`).
* Usar **polling com backoff** para DB queries (não `setTimeout` fixo).
* Para e-sign: **polling** para detectar iframe (PandaDocs vs Signwell).
* Para toasts: capturar texto antes de dismiss.
* Para PayPair OTP: **network intercept** em `/api/v1/users/send_code` (não IMAP).
* Para textareas com `oninput`: usar `evaluate()` em vez de `fill()`.
* Para iframe nesting: `#llapp-iframe` → `#pt-iframe` (PayPair widget → UOWN payment).

## Boas práticas — Dados de teste

* **SSN**: `generateTestSSN(true)` para aprovado, `generateTestSSN(false)` para negado.
* **Phone**: `generateTestPhone()` para números únicos.
* **Phone PayPair**: `generatePayPairTestPhone()` para sandbox PayPair (prefixo 111/222).
* **Email alias**: `testEnv.generateUniqueEmailAlias()`.
* **Run ID**: `generateRunId()` para isolamento.
* **Test cards (contract)**: `VALID_TEST_CARDS` em `payment.types.ts`.
* **Test cards (payments)**: `TEST_CARDS` em `constants.ts`.
* **Invalid cards**: `INVALID_TEST_CARDS` em `payment.types.ts`.

## Boas práticas — Multi-device

* Scripts `test:website:all-devices` para validação cross-browser.
* Profiles: Chrome, Firefox, Safari, iPhone 12 Pro, Pixel 5, iPad Pro 11.
* CI auto-seleciona headless via `isCI()`.

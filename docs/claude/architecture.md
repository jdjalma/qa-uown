# Architecture Reference

> Detalhes de estrutura, API clients e path aliases. Referenciado pelo CLAUDE.md.

---

## Estrutura de diretórios

```
src/
├── api/                    # REST clients, typed bodies/responses
│   ├── clients/            # BaseClient → domain clients
│   ├── bodies/             # Request payload builders
│   └── responses/          # Response interfaces + ApiResponse<T>
├── config/                 # Environment, constants, test-options, base-api-client (legacy)
├── support/                # Test infrastructure
│   ├── base-test.ts        # Unified fixture (testEnv, api, apiClient, db, email, ctx)
│   ├── config.ts           # TestConfig singleton
│   ├── browser-factory.ts  # 8 browser profiles
│   ├── hooks.ts            # Hooks (CSS animations, console capture, screenshots, metadata)
│   └── custom-reporter.ts  # JSON summary reporter
├── pages/                  # Page Object Model
│   ├── base.page.ts        # BasePage (spinner, toast, sidebar, modal, React Select)
│   ├── login.page.ts       # LoginPage
│   ├── search.page.ts      # SearchPage (quick search)
│   ├── merchant.page.ts    # MerchantPage (extends BasePage)
│   ├── origination/        # OriginationBasePage → Customer, Funding, Overview, etc.
│   │                       # + ContractPage, PayTomorrowPortalPage, PayPairPortalPage (extends BasePage)
│   ├── servicing/          # ServicingBasePage → Customer, Payment, ACH, etc.
│   ├── website/            # WebsiteBasePage (email OTP login, pagamentos, sidebar)
│   └── ams/                # AmsBasePage → AmsPage, AmsUserMerchantsPage, AmsUserDetailsPage (Tasks #74, #79)
├── helpers/                # Utilities
│   ├── common.helpers.ts   # waitForSpinner, toast, dropdown, parseMoney, clearAndType, sleep
│   ├── database.helpers.ts # PostgreSQL pool, polling com backoff, domain queries
│   ├── email.helpers.ts    # IMAP OTP extraction + email link extraction (Gmail)
│   ├── date.helpers.ts     # calculateDate, formatDate, addBusinessDays
│   ├── table.helpers.ts    # Table navigation, #NOT/#CONTAINS modifiers
│   ├── validation.helpers.ts # Assert helpers
│   ├── downloads.helpers.ts # waitForDownload, saveDownload
│   └── template-engine.ts  # JSON template interpolation (${varName}, ${obj.key})
├── data/                   # Test data
│   ├── merchants.ts        # 16 merchants (TireAgent, ProgressMobility, PayTomorrow, etc.)
│   ├── tire-agent.data.ts  # PayPair portal data (TireAgentProduct, PayPairConfig, JSON builders)
│   ├── state-address-mapper.ts # State → address mapping
│   └── test-accounts.ts    # Save/load created test accounts
├── fixtures/               # Playwright fixtures + JSON templates
│   ├── test-context.fixture.ts  # Re-exports base-test + TestOptions
│   └── api-templates/      # JSON request templates
├── selectors/
│   └── common.selectors.ts # ALL CSS/XPath selectors (SELECTORS const)
└── types/
    ├── enums.ts            # Portal, LeadStatus, ContractStatus, AllocationStrategy, TestTag
    ├── payment.types.ts    # FeeType, CreditCardInfo, VALID_TEST_CARDS, INVALID_TEST_CARDS
    └── status.types.ts     # StatusType, isValidStatus, statusFromString

tests/
├── api/                    # API-only tests (sem browser)
└── e2e/                    # E2E browser tests por portal
    ├── origination/        # new-application, unified-flow, paytomorrow-refund-flow, tire-agent-unified-flow
    ├── servicing/          # payment-transaction, reverse-payment
    ├── website/            # (em desenvolvimento)
    └── ams/                # (em desenvolvimento)
```

## Localização por tipo de arquivo

| Tipo | Localização | Exemplo |
|------|-------------|---------|
| **Teste E2E** | `tests/e2e/{portal}/` | `tests/e2e/origination/unified-flow.spec.ts` |
| **Teste API** | `tests/api/` | `tests/api/new-application-api.spec.ts` |
| **Page Object** | `src/pages/{portal}/` | `src/pages/origination/customer.page.ts` |
| **API Client** | `src/api/clients/` | `src/api/clients/application.client.ts` |
| **Request Body** | `src/api/bodies/` | `src/api/bodies/application.body.ts` |
| **Response Type** | `src/api/responses/` | `src/api/responses/application.response.ts` |
| **Seletores** | `src/selectors/` | `src/selectors/common.selectors.ts` |
| **Helper** | `src/helpers/` | `src/helpers/database.helpers.ts` |
| **Enum/Type** | `src/types/` | `src/types/enums.ts` |
| **Test Data** | `src/data/` | `src/data/merchants.ts` |
| **JSON Template** | `src/fixtures/api-templates/` | `src/fixtures/api-templates/submitApplication.json` |
| **Config** | `src/config/` | `src/config/environment.ts` |
| **Fixture** | `src/fixtures/` | `src/fixtures/test-context.fixture.ts` |

---

## Arquitetura de API Clients

### BaseClient (typed)

```typescript
class BaseClient {
  constructor(request: APIRequestContext, env: ConfigEnvironment, options?: ClientOptions)
  // ClientOptions: { injectAuth, injectApiKey, tryGetOn405, apiKeyHeaderNames }
  // ApiHost: 'svc' → svc-{env}.uownleasing.com | 'origination' → origination-{env}.uownleasing.com
  protected post<T>(path, body): Promise<ApiResponse<T>>
  protected get<T>(path): Promise<ApiResponse<T>>
  protected postRaw(url, body?, host?): Promise<APIResponse>
  protected getRaw(url, host?): Promise<APIResponse>
  protected resolveUrl(url, host?): string
  withHeader(name, value): this  // chainable
}
```

### ApiResponse wrapper

```typescript
interface ApiResponse<T = unknown> {
  ok: boolean; status: number; statusText: string;
  headers: Record<string, string>; body: T; raw: APIResponse;
}
```

### Domain clients

| Client | Host | Métodos principais |
|--------|------|--------------------|
| `ApplicationClient` | `svc` | `sendApplication(body)`, `getApplicationStatus(body)` |
| `InvoiceClient` | `svc` | `sendInvoice(merchant, leadUuid, options?)` |
| `LeadClient` | `svc` | `changeLeadStatus(merchant, leadPk, newStatus)`, `updateFundingStatus(leadPks, status)` |
| `SettlementClient` | `svc` | `settleApplication(merchant, leadUuid)` |
| `CreditCardClient` | `origination` | `authorizeCreditCard(leadPk, firstName, lastName, options?)` |
| `ScheduledTaskClient` | `svc` | `triggerScheduledTask(taskName)`, `sendEmailsSweep()` — POST `/uown/svc/sendEmailsSweep` (Task #490) |
| `SvcPhoneClient` | `svc` | `updateOptOutAi(body)`, `updateDnc(body)`, `updateDnt(body)` — phone DNC/DNT/opt-out flags (Task #505) |
| `SvcEmailClient` | `svc` | `getContactInfo(accountPk)`, `createOrUpdateEmail(body)` — contact info retrieval and email record updates (Task #442) |
| `BankAccountClient` | `svc` | `createOrUpdateBankAccount(body)`, `removeBankAccount(body)`, `getBankAccounts(accountPk)` + helper wrappers `createBankAccount`, `deleteBankAccount` — bank account CRUD for servicing (Task #497) |
| `LosPartnerAuthClient` | `svc` | `authorize(username, password) → GetApiKeyResponse`, `createApiUser(body) → CreateApiUserResponse` — Bearer token issuance for merchant LOS API (Task #482) |
| `LosPartnerApplicationClient` | `svc` | `createApplication(body?, apiVersion?)`, `searchApplicationStatus(body?)`, `createInvoice(id, body?)`, `settleApplication(id, body?)`, `addLease(id, body?)` — all use Bearer token via `setBearerToken(token)` / `clearBearerToken()`; `apiVersion=null` omits X-API-Version header (tests DefaultLosApiVersionRequestWrapper injection) (Task #482) |

### JSON Templates

Templates em `src/fixtures/api-templates/` usam sintaxe `${varName}` e `${obj.key}`.
PascalCase para variáveis (`${LeadPk}`), dotted keys para objetos (`${merchant.username}`).
Interpolados via `buildRequestBody(templateName, vars)`.

### BaseApiClient (legacy)

```typescript
// src/config/base-api-client.ts — NÃO confundir com BaseClient
// Acessível via fixture `apiClient`. Mantido para backwards-compatibility.
// Retorna raw APIResponse, usa JSON templates, URLs em /uown/api/
```

---

## Path Aliases

```
@config/*      → src/config/*
@types/*       → src/types/*
@data/*        → src/data/*
@fixtures/*    → src/fixtures/*
@helpers/*     → src/helpers/*
@pages/*       → src/pages/*
@selectors/*   → src/selectors/*
@api/*         → src/api/*
@api/clients   → src/api/clients/index
@api/bodies    → src/api/bodies/index
@api/responses → src/api/responses/index
@support/*     → src/support/*
@support       → src/support/index
```

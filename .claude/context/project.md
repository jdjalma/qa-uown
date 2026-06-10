<!-- PT-BR: Documento consolidado do projeto — overview + structure + architecture. Substitui os 3 arquivos anteriores: project-overview.md, project-structure.md, architecture.md. -->

# Project — fintech-playwright

Consolidação de visão geral + estrutura + arquitetura. Este é o documento único de projeto — os antigos `project-overview.md`, `project-structure.md` e `architecture.md` foram unificados aqui.

---

## 1. Overview

Test automation framework com **Playwright + TypeScript** para a plataforma fintech UOWN Leasing.

### Stack

- **Playwright** `^1.50.0` + **TypeScript** `^5.6.0` strict
- **Node.js** ESModules (`"module": "NodeNext"`)
- **PostgreSQL** via `pg` (pool, polling com backoff)
- **Email**: IMAP via `imapflow` (Gmail OTP)
- **Reporters**: HTML, list, custom JSON, Allure (opcional)

### 4 Portais

| Portal | URL Pattern | Tests |
|--------|-------------|-------|
| Origination | `origination-{env}.uownleasing.com` | `tests/e2e/origination/` |
| Servicing | `svc-website-{env}.uownleasing.com` | `tests/e2e/servicing/` |
| Website | `website-{env}.uownleasing.com` | `tests/e2e/website/` |
| AMS | `ams-website-{env}.uownleasing.com` | `tests/e2e/ams/` |
| SVC API | `svc-{env}.uownleasing.com` | `tests/api/` |

### 12 Playwright Projects

- **Auth:** `auth-origination`, `auth-servicing`
- **Desktop UI:** `origination-ui`, `servicing-ui`, `website-ui`, `ams-ui`
- **Cross-browser:** `website-firefox`, `website-webkit`
- **Mobile:** `website-mobile-ios`, `website-mobile-android`
- **Tablet:** `website-tablet`
- **API:** `api-only`
- **Task testing:** `task-testing` (para `docs/taskTestingUown/`)

### Path Aliases

```
@config/*    → src/config/*       @types/* → src/types/*      @data/* → src/data/*
@fixtures/*  → src/fixtures/*     @helpers/* → src/helpers/*   @pages/* → src/pages/*
@selectors/* → src/selectors/*    @api/*    → src/api/*        @support/* → src/support/*
```

---

## 2. Directory Structure

```
fintech-playwright/
├── .claude/
│   ├── agents/                        # Specialized subagents (see CLAUDE.md for catalog)
│   ├── skills/                        # /qa-flow, /new-*, /audit, etc.
│   ├── context/                       # Reference documentation (this file + specialized)
│   │   ├── INDEX.md
│   │   ├── project.md                 # (this file — consolidação)
│   │   ├── coding-standards.md
│   │   ├── test-patterns-core.md       # naming, fixtures, risk tier, env limitations
│   │   ├── test-patterns-ui.md         # UI: hybrid, triple validation, tables, mobx, downloads
│   │   ├── test-patterns-arrangements.md # CC/ACH arrangements, GDS bypass, expression indexes
│   │   ├── business-rules.md
│   │   ├── environments.md
│   │   ├── orchestration.md
│   │   ├── glossary.md
│   │   ├── app-repos.md
│   │   └── shared/                    # Cross-agent shared contexts
│   │       ├── qa-flow-protocol.md    # Protocolo detalhado do /qa-flow
│   │       ├── qa-domain-reflexes.md
│   │       ├── ssn-test-catalog.md
│   │       ├── bug-classification-rules.md
│   │       ├── e2e-checklist.md
│   │       ├── e2e-test-plan-template.md
│   │       ├── e2e-test-report-standard.md
│   │       ├── helpers-catalog.md
│   │       ├── api-clients-catalog.md
│   │       ├── page-objects-catalog.md
│   │       ├── e2e-test-examples.md
│   │       ├── common-operations.md
│   │       └── agent-coordination.md
│   ├── rules/                         # Path-scoped rules (page-objects, selectors, testing, etc.)
│   ├── agent-memory/                  # Agent persistent memory
│   ├── logs/
│   ├── locks/
│   ├── scripts/
│   ├── settings.json
│   └── settings.local.json
│
├── src/
│   ├── api/
│   │   ├── clients/                   # BaseClient → domain clients
│   │   ├── bodies/                    # Request payload interfaces/builders
│   │   └── responses/                 # Response interfaces + ApiResponse<T>
│   ├── config/
│   │   ├── environment.ts             # ConfigEnvironment per env
│   │   └── constants.ts               # Timeouts, test cards (TEST_CARDS), test bank (TEST_BANK), SSN/phone generation
│   ├── support/
│   │   ├── base-test.ts               # Unified fixture + auto-hooks
│   │   ├── config.ts                  # TestConfig singleton
│   │   ├── browser-factory.ts         # 8 device profiles
│   │   ├── hooks.ts                   # CSS animations, screenshots, metadata
│   │   └── custom-reporter.ts         # JSON summary reporter
│   ├── pages/
│   │   ├── base.page.ts               # BasePage (spinner, toast, modal)
│   │   ├── login.page.ts              # LoginPage (shared)
│   │   ├── search.page.ts             # SearchPage (cross-portal)
│   │   ├── origination/               # OriginationBasePage → pages
│   │   ├── servicing/                 # ServicingBasePage → pages
│   │   ├── website/                   # WebsiteBasePage → pages
│   │   └── ams/                       # AmsBasePage → pages
│   ├── helpers/                       # database, email, date, table, auth, etc.
│   ├── data/                          # merchants, state-address-mapper, tire-agent, test-cards
│   ├── fixtures/                      # test-context.fixture + api-templates/
│   ├── selectors/                     # common.selectors.ts (SELECTORS const)
│   └── types/                         # enums, payment.types, status.types
│
├── docs/taskTestingUown/              # Task tests from GitLab issues (project: task-testing)
├── tests/
│   ├── api/                           # API-only tests (no browser)
│   ├── e2e/{portal}/                  # E2E per portal
│   ├── ci/                            # CI-optimized tests
│   └── smoke/                         # Smoke tests
│
├── docs/
│   ├── adrs/                          # Architecture Decision Records (ADR-001 ..)
│   ├── business-rules/                # 11 chapters + 6 appendices (PT-BR)
│   ├── AGENTS.md
│   ├── PROJECT.md
│   └── TESTING.md
│
├── reports/                           # Generated (gitignored)
├── .auth/                             # Auth state (gitignored)
├── .mcp.json                          # Playwright MCP + Postman MCP
├── playwright.config.ts               # Playwright projects config
├── tsconfig.json                      # Strict, ESModules, path aliases
├── CLAUDE.md                          # Project instructions + orchestrator
└── README.md
```

### File Placement Conventions

| Tipo | Pattern | Localização |
|------|---------|-------------|
| Page object | `{name}.page.ts` | `src/pages/{portal}/` |
| API client | `{domain}.client.ts` | `src/api/clients/` |
| Request body | `{domain}.body.ts` | `src/api/bodies/` |
| Response type | `{domain}.response.ts` | `src/api/responses/` |
| Helper | `{domain}.helpers.ts` | `src/helpers/` |
| Task test | `{milestone}_{camelCaseTitle}_{number}.spec.ts` | `docs/taskTestingUown/{testName}/` |
| E2E test | `{flow}.spec.ts` | `tests/e2e/{portal}/` |
| API test | `{flow}-api.spec.ts` | `tests/api/` |
| JSON template | `{actionName}.json` | `src/fixtures/api-templates/` |
| Enum/Type | `{domain}.types.ts` | `src/types/` |
| Selectors | `common.selectors.ts` | `src/selectors/` |
| ADR | `ADR-NNN-kebab-case.md` | `docs/adrs/` |

---

## 3. Architecture

### Page Object Hierarchy

> **Source of truth.** Outros arquivos (`rules/page-objects.md`, skill [[page-object-pattern]]) referenciam esta seção — não duplicar a árvore em outro lugar.

```
BasePage                              # Never instantiate directly — src/pages/base.page.ts
├── LoginPage                         # Shared login (Origination/Servicing)
├── SearchPage                        # Quick search (cross-portal)
├── ContractPage                      # CC/bank forms, e-sign (consumer-facing)
├── ApplicationWizardPage             # Origination wizard (consumer-facing)
├── PayTomorrowPortalPage             # External PayTomorrow portal
├── PayPairPortalPage                 # External PayPair (TireAgent, iframe nesting)
├── OriginationBasePage               # + origination sidebar
│   ├── OriginationCustomerPage
│   ├── OverviewPage
│   ├── FundingPage
│   ├── LeaseAgreementPage
│   ├── MetricsCalculatorPage
│   ├── ProgramsPage
│   ├── LeadsPage
│   ├── MerchantSettingPage
│   ├── ErrorLogPage
│   └── OpenToBuyPage
├── ServicingBasePage                 # + servicing sidebar
│   ├── ServicingCustomerPage
│   ├── PaymentTransactionPage
│   ├── AchHistoryPage
│   ├── ScheduledPaymentPage
│   ├── LogPage
│   ├── ServicingSearchPage
│   ├── PaymentArrangementPage
│   ├── DueDateMovesHistoryPage
│   └── FrequencyChangesHistoryPage
├── WebsiteBasePage                   # + email OTP login
└── AmsBasePage                       # react-data-table-component base
    ├── AmsPage
    ├── AmsUserMerchantsPage
    └── AmsUserDetailsPage
```

**Regra de ouro:** page objects nunca chamam `expect()` internamente — sempre retornam valores para o teste asserir. Ver `rules/page-objects.md`.

### API Client Architecture

```
BaseClient
├── constructor(request, env, { host: 'svc' | 'origination' })
├── post<T>(path, body) → ApiResponse<T>
├── get<T>(path) → ApiResponse<T>
├── put<T>(path, body) → ApiResponse<T>
└── withHeader(name, value) → this (chainable)

ApiResponse<T> = { ok, status, statusText, headers, body: T, raw }
```

**Domain Clients** (catálogo completo + métodos em skills [[api-client-pattern]], [[helpers-catalog]], [[page-object-pattern]]):

- `ApplicationClient` — sendApplication, getApplicationStatus, submitApplication, getMissingFields, authorizeCreditCard
- `InvoiceClient` — sendInvoice
- `LeadClient` — changeLeadStatus
- `SettlementClient` — settleApplication
- `CreditCardClient` — authorizeCreditCard
- `ScheduledTaskClient` — triggerScheduledTask, sendCreditCardPaymentsSweep, sendAchPaymentsSweep, getStatusDatePaymentsListSweep, sendEmailsSweep, getScheduledTaskByName
- `PaymentArrangementClient` — makeCreditCardPayments, createOrUpdateAchPayments
- `AccountClient` — cancelAccount, getFrequencyChanges, getDueDateMoves, moveDueDatesByDays
- `MerchantClient` — getMerchantsByRefCode, updateMerchants, etc.
- `SvcContactClient` / `SvcPhoneClient` / `SvcEmailClient` / `SvcPayoffClient` — servicing contact ops
- `LosPartnerAuthClient` / `LosPartnerApplicationClient` — Bearer token issuance e partner API (Task #482)

#### GET com Content-Type header

Alguns endpoints Spring exigem `Content-Type: application/json` mesmo em GET. `BaseClient.get()` não envia Content-Type por default (só `Accept`). Para esses casos, chamada custom:

```typescript
async getFinalApprovalDetails(leadPk: string | number): Promise<ApiResponse<T>> {
  const url = this.resolveUrl(`/path/${leadPk}`);
  const response = await this.request.get(url, {
    headers: { ...this.headers, 'Content-Type': 'application/json' },
  });
  return parseResponse<T>(response);
}
```

Aplica atualmente a: `getFinalApprovalDetails` (`ApplicationClient`).

#### FilterTable React-Select CSS Prefix

O `FilterTable` de `@uownleasing/common-ui` usa `filter__` como `classNamePrefix` para react-selects dentro de filter panels. Distinto do send form / wizard (usa react-select genérico).

| Contexto | Pattern | Exemplo |
|---------|---------|---------|
| Send form / wizard | genérico | `[class*='control']`, `[class*='option']` |
| FilterTable filter panel | prefix `filter__` | `[class*='filter__control']`, `div[class*='filter__option']` |

**Backdrop portal:** ao abrir react-select com prefix `filter__`, renderiza portal em `<body>` com backdrop transparente interceptando clicks. Para interagir com opções no portal:
- Clicar com `{ force: true }` para bypassar o backdrop
- Após ler, `Escape` para fechar o portal
- Poll `.filter__menu-portal` com `state: 'hidden'` para confirmar fechamento

**`clickSearch()` pattern:** antes de clicar Search em filter panel, sempre `Escape` + `waitForSpinner()`.

### Fixtures (base-test.ts)

| Fixture | Tipo | Uso |
|---------|------|-----|
| `testEnv` | `ConfigEnvironment` | URLs, credentials, DB config |
| `api` | `ApiClients` | Typed domain clients |
| `db` | `DatabaseHelpers` | PostgreSQL pool, polling |
| `email` | `EmailHelpers` | IMAP OTP (Gmail) |
| `ctx` | `TestContext` | Shared state dentro do teste |
| `consoleLogs` | `() => string[]` | Captured console errors |
| `page` | `Page` | Com auto-hooks |

### Auto-hooks (base-test)

- **BEFORE:** `disableCssAnimations(page)`
- **AFTER:** `attachScreenshotOnFailure()` (full-page)
- **AFTER:** `attachTestMetadata()` (JSON: env, URL, duration)

### Key Files

- `src/support/base-test.ts` — Unified fixture + hooks
- `src/support/config.ts` — TestConfig singleton
- `src/config/environment.ts` — `ConfigEnvironment` por env
- `src/config/constants.ts` — Timeouts, `TEST_CARDS`, `TEST_BANK`, `generateTestSSN`, `generateTestPhone`
- `src/selectors/common.selectors.ts` — TODOS os selectors (const `SELECTORS`)
- `src/helpers/database.helpers.ts` — Pool + polling com backoff
- `src/helpers/template-engine.ts` — JSON template interpolation
- `src/pages/origination/paypair-portal.page.ts` — PayPair portal (iframe nesting, OTP intercept)
- `src/data/tire-agent.data.ts` — TireAgent/PayPair data builders

### ADRs

| ADR | Decisão | Status |
|-----|---------|--------|
| [001](../../docs/adrs/ADR-001-playwright-typescript.md) | Playwright + TypeScript strict + ESModules | Accepted |
| [002](../../docs/adrs/ADR-002-monorepo-4-portals.md) | Monorepo para 4 portais com 12 projects | Accepted |
| [003](../../docs/adrs/ADR-003-page-object-model-hierarchy.md) | POM: BasePage → PortalBase → Page | Accepted |
| [004](../../docs/adrs/ADR-004-centralized-selectors.md) | Selectors centralizados em `SELECTORS` const | Accepted |
| [005](../../docs/adrs/ADR-005-api-client-baseclient.md) | API Clients: `BaseClient` + `ApiResponse<T>` | Accepted |
| [006](../../docs/adrs/ADR-006-exponential-backoff-polling.md) | Polling com backoff exponencial (DB) | Accepted |
| [007](../../docs/adrs/ADR-007-postgresql-pg-pool.md) | PostgreSQL via `pg` com connection pool | Accepted |
| [008](../../docs/adrs/ADR-008-imap-otp-extraction.md) | IMAP via `imapflow` para OTP | Accepted |
| [009](../../docs/adrs/ADR-009-json-template-engine.md) | JSON template engine para request bodies | Accepted |
| [010](../../docs/adrs/ADR-010-custom-json-reporter.md) | Custom JSON reporter para CI | Accepted |
| [011](../../docs/adrs/ADR-011-unified-fixture-base-test.md) | Unified fixture em `base-test.ts` | Accepted |
| [013](../../docs/adrs/ADR-013-app-source-integration.md) | Application source integration para test validation | Accepted |

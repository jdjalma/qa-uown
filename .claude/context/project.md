<!-- Consolidated project document — overview + structure + architecture. Replaces the 3 previous files: project-overview.md, project-structure.md, architecture.md. -->

# Project — fintech-playwright

Consolidated overview + structure + architecture. This is the single project document — the former `project-overview.md`, `project-structure.md`, and `architecture.md` have been merged here.

---

## 1. Overview

Test automation framework with **Playwright + TypeScript** for the UOWN Leasing fintech platform.

### Stack

- **Playwright** `^1.50.0` + **TypeScript** `^5.6.0` strict
- **Node.js** ESModules (`"module": "NodeNext"`)
- **PostgreSQL** via `pg` (pool, polling with backoff)
- **Email**: IMAP via `imapflow` (Gmail OTP)
- **Reporters**: HTML, list, custom JSON, Allure (optional)

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
- **Task testing:** `task-testing` (for `docs/taskTestingUown/`)

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
│   │   ├── project.md                 # (this file — consolidated)
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
│   │       ├── qa-flow-protocol.md    # Detailed /qa-flow protocol
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
│   ├── adrs/                          # Architecture Decision Records (ADR-NNN)
│   ├── business-rules/                # 11 chapters + 6 appendices (in Portuguese)
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

| Type | Pattern | Location |
|------|---------|----------|
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

> **Source of truth.** Other files (`rules/page-objects.md`, skill [[page-object-pattern]]) reference this section — do not duplicate the tree elsewhere.

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

**Golden rule:** page objects never call `expect()` internally — they always return values for the test to assert. See `rules/page-objects.md`.

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

**Domain Clients** (full catalog + methods in skills [[api-client-pattern]], [[helpers-catalog]], [[page-object-pattern]]):

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
- `LosPartnerAuthClient` / `LosPartnerApplicationClient` — Bearer token issuance and partner API

#### GET with Content-Type header

Some Spring endpoints require `Content-Type: application/json` even on GET requests. `BaseClient.get()` does not send Content-Type by default (only `Accept`). For those cases, use a custom call:

```typescript
async getFinalApprovalDetails(leadPk: string | number): Promise<ApiResponse<T>> {
  const url = this.resolveUrl(`/path/${leadPk}`);
  const response = await this.request.get(url, {
    headers: { ...this.headers, 'Content-Type': 'application/json' },
  });
  return parseResponse<T>(response);
}
```

Currently applies to: `getFinalApprovalDetails` (`ApplicationClient`).

#### FilterTable React-Select CSS Prefix

The `FilterTable` from `@uownleasing/common-ui` uses `filter__` as the `classNamePrefix` for react-selects inside filter panels. This is distinct from the send form / wizard (which uses generic react-select).

| Context | Pattern | Example |
|---------|---------|---------|
| Send form / wizard | generic | `[class*='control']`, `[class*='option']` |
| FilterTable filter panel | prefix `filter__` | `[class*='filter__control']`, `div[class*='filter__option']` |

**Backdrop portal:** when opening a react-select with the `filter__` prefix, it renders a portal in `<body>` with a transparent backdrop intercepting clicks. To interact with options in the portal:
- Click with `{ force: true }` to bypass the backdrop
- After reading, press `Escape` to close the portal
- Poll `.filter__menu-portal` with `state: 'hidden'` to confirm closure

**`clickSearch()` pattern:** before clicking Search in a filter panel, always press `Escape` + `waitForSpinner()`.

### Fixtures (base-test.ts)

| Fixture | Type | Usage |
|---------|------|-------|
| `testEnv` | `ConfigEnvironment` | URLs, credentials, DB config |
| `api` | `ApiClients` | Typed domain clients |
| `db` | `DatabaseHelpers` | PostgreSQL pool, polling |
| `email` | `EmailHelpers` | IMAP OTP (Gmail) |
| `ctx` | `TestContext` | Shared state within the test |
| `consoleLogs` | `() => string[]` | Captured console errors |
| `page` | `Page` | With auto-hooks |

### Auto-hooks (base-test)

- **BEFORE:** `disableCssAnimations(page)`
- **AFTER:** `attachScreenshotOnFailure()` (full-page)
- **AFTER:** `attachTestMetadata()` (JSON: env, URL, duration)

### Key Files

- `src/support/base-test.ts` — Unified fixture + hooks
- `src/support/config.ts` — TestConfig singleton
- `src/config/environment.ts` — `ConfigEnvironment` per env
- `src/config/constants.ts` — Timeouts, `TEST_CARDS`, `TEST_BANK`, `generateTestSSN`, `generateTestPhone`
- `src/selectors/common.selectors.ts` — ALL selectors (const `SELECTORS`)
- `src/helpers/database.helpers.ts` — Pool + polling with backoff
- `src/helpers/template-engine.ts` — JSON template interpolation
- `src/pages/origination/paypair-portal.page.ts` — PayPair portal (iframe nesting, OTP intercept)
- `src/data/tire-agent.data.ts` — TireAgent/PayPair data builders

### ADRs

| ADR | Decision | Status |
|-----|----------|--------|
| [001](../../docs/adrs/ADR-001-monorepo-4-portals.md) | Multi-portal monorepo (Playwright projects in `playwright.config.ts`) | Accepted |
| [002](../../docs/adrs/ADR-002-page-object-model-hierarchy.md) | POM: BasePage → PortalBase → Page | Accepted |
| [003](../../docs/adrs/ADR-003-centralized-selectors.md) | Selectors centralized in `SELECTORS` const | Accepted |
| [004](../../docs/adrs/ADR-004-api-client-baseclient.md) | API Clients: `BaseClient` + `ApiResponse<T>` | Accepted |
| [005](../../docs/adrs/ADR-005-postgresql-pg-pool.md) | PostgreSQL via `pg` with connection pool | Accepted |
| [006](../../docs/adrs/ADR-006-imap-otp-extraction.md) | IMAP via `imapflow` for OTP | Accepted |
| [007](../../docs/adrs/ADR-007-json-template-engine.md) | JSON template engine for request bodies | Accepted |
| [008](../../docs/adrs/ADR-008-unified-fixture-base-test.md) | Unified fixture in `base-test.ts` | Accepted |
| [009](../../docs/adrs/ADR-009-redirect-assertion-strategy-spa.md) | Redirect assertion strategy for SPA (does not assert HTTP status) | Accepted |

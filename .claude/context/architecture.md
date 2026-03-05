<!-- PT-BR: Arquitetura do projeto — hierarquias de page objects, API clients, fixtures e ADRs. -->

# Project Architecture

## Directory Structure

```
src/
├── api/clients/          # BaseClient → domain clients
├── api/bodies/           # Request payload builders
├── api/responses/        # Response interfaces + ApiResponse<T>
├── config/               # Environment, constants, test-options
├── support/              # base-test, config, browser-factory, hooks, reporter
├── pages/                # Page Object Model (hierarchy)
├── helpers/              # database, email, date, table, validation, template-engine
├── data/                 # merchants, state-address-mapper, test-accounts
├── fixtures/             # test-context.fixture + api-templates/
├── selectors/            # common.selectors.ts (SELECTORS const)
└── types/                # enums, payment.types, status.types

tests/
├── api/                  # API-only (no browser)
└── e2e/{portal}/         # E2E per portal
```

## Page Object Hierarchy

```
BasePage                         # Never instantiate directly
├── LoginPage                    # Shared login (Origination/Servicing)
├── SearchPage                   # Quick search (cross-portal)
├── MerchantPage                 # Merchant operations
├── ContractPage                 # CC/bank forms, e-sign (consumer-facing)
├── PayTomorrowPortalPage        # External PayTomorrow merchant portal
├── PayPairPortalPage            # External PayPair portal (TireAgent, iframe nesting)
├── OriginationBasePage          # + origination sidebar
│   ├── OriginationCustomerPage, OverviewPage, FundingPage
│   ├── LeaseAgreementPage, MetricsCalculatorPage
├── ServicingBasePage            # + servicing sidebar
│   ├── ServicingCustomerPage, PaymentTransactionPage
│   ├── AchHistoryPage, ScheduledPaymentPage, LogPage
├── WebsiteBasePage              # + email OTP login
└── AmsBasePage → AmsPage        # + AMS features
```

## API Client Architecture

```
BaseClient
├── constructor(request, env, { host: 'svc' | 'origination' })
├── post<T>(path, body) → ApiResponse<T>
├── get<T>(path) → ApiResponse<T>
└── withHeader(name, value) → this (chainable)

ApiResponse<T> = { ok, status, statusText, headers, body: T, raw }
```

### Domain Clients

| Client | Host | Methods |
|--------|------|---------|
| ApplicationClient | svc | sendApplication, getApplicationStatus, submitApplication, canContinueApplication, getFinalApprovalDetails, getMissingFields (supports planId — Task #439) |
| InvoiceClient | svc | sendInvoice |
| LeadClient | svc | changeLeadStatus |
| SettlementClient | svc | settleApplication |
| CreditCardClient | origination | authorizeCreditCard |
| ScheduledTaskClient | svc | triggerScheduledTask |
| PaymentArrangementClient | svc | makeCreditCardPayments, createOrUpdateAchPayments |

### GET with Content-Type Header

Some Spring backend endpoints require `Content-Type: application/json` even for GET requests. The `BaseClient.get()` method does NOT send Content-Type by default (only `Accept`). When an endpoint requires it, use a custom GET call:

```typescript
async getFinalApprovalDetails(leadPk: string | number): Promise<ApiResponse<T>> {
  const url = this.resolveUrl(`/path/${leadPk}`);
  const response = await this.request.get(url, {
    headers: { ...this.headers, 'Content-Type': 'application/json' },
  });
  return parseResponse<T>(response);
}
```

Currently applies to: `getFinalApprovalDetails` (ApplicationClient).

## Fixtures (base-test.ts)

| Fixture | Type | Usage |
|---------|------|-------|
| `testEnv` | ConfigEnvironment | URLs, credentials, DB config |
| `api` | ApiClients | Typed clients |
| `db` | DatabaseHelpers | PostgreSQL pool, polling |
| `email` | EmailHelpers | IMAP OTP (Gmail) |
| `ctx` | TestContext | Shared state |
| `consoleLogs` | () => string[] | Captured console errors |
| `page` | Page | With auto-hooks |

## Auto-hooks

- **BEFORE**: `disableCssAnimations(page)`
- **AFTER**: `attachScreenshotOnFailure()` (full-page)
- **AFTER**: `attachTestMetadata()` (JSON: env, URL, duration)

## Key Files

- `src/support/base-test.ts` — Unified fixture + hooks
- `src/support/config.ts` — TestConfig singleton
- `src/config/environment.ts` — ConfigEnvironment per env
- `src/config/constants.ts` — Timeouts, test cards, SSN/phone generation
- `src/selectors/common.selectors.ts` — ALL selectors (incl. 33 PayPair selectors, 5 CompletionScreen selectors)
- `src/helpers/database.helpers.ts` — Pool + polling backoff. Methods: CRUD, waitFor*, lead*, shortCode* (migration V20260226100000), uwData* (getUwDataByLeadPk, getLambdaSegment, waitForLambdaSegment), paymentArrangement* (getPaymentArrangement, getPaymentArrangementStatus, getPaymentArrangementsByAccount, waitForPaymentArrangementStatus, paymentArrangementTableExists, getPaymentArrangementColumns, ccTransactionHasArrangementFk, achPaymentHasArrangementFk, getCcTransactionsByArrangement, getAchPaymentsByArrangement), account* (getAccountRating, getAccountStatus, waitForAccountStatus, getAccountPkByLeadPk, waitForAccountByLeadPk), pendingTransactions (getPendingCcTransactions, getPendingAchPayments, waitForCcTransactionsProcessed, waitForAchPaymentsProcessed)
- `src/helpers/template-engine.ts` — JSON template interpolation
- `src/pages/origination/paypair-portal.page.ts` — PayPair portal (iframe nesting, OTP intercept)
- `src/data/tire-agent.data.ts` — TireAgent/PayPair data builders

## Architecture Decision Records (ADRs)

| ADR | Decision | Status |
|-----|----------|--------|
| [001](../../docs/adrs/ADR-001-playwright-typescript.md) | Playwright + TypeScript strict + ESModules | Accepted |
| [002](../../docs/adrs/ADR-002-monorepo-4-portals.md) | Monorepo for 4 portals with 12 projects | Accepted |
| [003](../../docs/adrs/ADR-003-page-object-model-hierarchy.md) | Page Object Model: BasePage → PortalBase → Page | Accepted |
| [004](../../docs/adrs/ADR-004-centralized-selectors.md) | Centralized selectors in SELECTORS const | Accepted |
| [005](../../docs/adrs/ADR-005-api-client-baseclient.md) | API Clients: BaseClient + ApiResponse\<T\> | Accepted |
| [006](../../docs/adrs/ADR-006-exponential-backoff-polling.md) | Polling with exponential backoff for DB | Accepted |
| [007](../../docs/adrs/ADR-007-postgresql-pg-pool.md) | PostgreSQL via pg with connection pool | Accepted |
| [008](../../docs/adrs/ADR-008-imap-otp-extraction.md) | IMAP via imapflow for OTP | Accepted |
| [009](../../docs/adrs/ADR-009-json-template-engine.md) | JSON template engine for request bodies | Accepted |
| [010](../../docs/adrs/ADR-010-custom-json-reporter.md) | Custom JSON reporter for CI | Accepted |
| [011](../../docs/adrs/ADR-011-unified-fixture-base-test.md) | Unified fixture in base-test.ts | Accepted |
| [012](../../docs/adrs/ADR-012-java-cucumber-migration.md) | Migration from Java/Cucumber | Accepted |

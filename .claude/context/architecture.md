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
├── helpers/              # database, email, date, table, auth, navigation, signwell, template-engine
├── data/                 # merchants, state-address-mapper, tire-agent, test-cards
├── fixtures/             # test-context.fixture + api-templates/
├── selectors/            # common.selectors.ts (SELECTORS const)
└── types/                # enums, payment.types, status.types

tests/
├── api/                  # API-only (no browser)
└── e2e/{portal}/         # E2E per portal
```

## Page Object Hierarchy

> **Source of truth.** Other files (`rules/page-objects.md`, `subagent-impl-page-object.md`) reference this section — do not duplicate the tree elsewhere.

```
BasePage                              # Never instantiate directly — src/pages/base.page.ts
├── LoginPage                         # Shared login (Origination/Servicing)
├── SearchPage                        # Quick search (cross-portal)
├── MerchantPage                      # Merchant operations
├── ContractPage                      # CC/bank forms, e-sign (consumer-facing)
├── ApplicationWizardPage             # Origination wizard (consumer-facing)
├── PayTomorrowPortalPage             # External PayTomorrow merchant portal — src/pages/origination/
├── PayPairPortalPage                 # External PayPair portal (TireAgent, iframe nesting) — src/pages/origination/
├── OriginationBasePage               # + origination sidebar — src/pages/origination/
│   ├── OriginationCustomerPage       # Customer detail
│   ├── OverviewPage                  # Application overview
│   ├── FundingPage                   # Funding actions
│   ├── LeaseAgreementPage            # Lease agreement
│   ├── MetricsCalculatorPage         # Metrics calculator
│   ├── ProgramsPage                  # Programs/plans selection
│   ├── LeadsPage                     # Leads list (Task #1242)
│   ├── MerchantSettingPage           # Merchant Settings bulk update (dealer discount/rebate)
│   ├── ErrorLogPage                  # Submit/Send Application error logs (Task #1240)
│   └── OpenToBuyPage                # Open to Buy — Merchant/Location filters (Task #1205)
├── ServicingBasePage                 # + servicing sidebar — src/pages/servicing/
│   ├── ServicingCustomerPage         # Customer detail + Opt Out AI (Task #505)
│   ├── PaymentTransactionPage        # Payment transactions
│   ├── AchHistoryPage                # ACH history
│   ├── ScheduledPaymentPage          # Scheduled payments
│   ├── LogPage                       # Activity log
│   ├── ServicingSearchPage           # Customer search
│   ├── PaymentArrangementPage        # Payment arrangements (Task #500)
│   ├── DueDateMovesHistoryPage       # History > Due Date Changes (Task #502)
│   └── FrequencyChangesHistoryPage   # History > Frequency Changes (Task #503)
├── WebsiteBasePage                   # + email OTP login
└── AmsBasePage                        # react-data-table-component base, row helpers
    ├── AmsPage                        # Main AMS portal (login, users list) — src/pages/ams/ams.page.ts
    ├── AmsUserMerchantsPage           # /associate-users-to-merchants (bulk assign) — src/pages/ams/ams-user-merchants.page.ts
    └── AmsUserDetailsPage             # /users/[username] (details + Log Activity) — src/pages/ams/ams-user-details.page.ts (Task #74)
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
| ApplicationClient | svc | sendApplication, getApplicationStatus, submitApplication(leadPk, firstName, lastName, options?), canContinueApplication, getFinalApprovalDetails, getMissingFields(shortCode, { planId? }) — Task #439/#1242, authorizeCreditCard(body: AuthorizeCreditCardBody) — POST /uown/los/authorizeCreditCard; errors logged to `uown_submit_application_error_log`; requires getMissingFields first. Response types: `SubmitApplicationResponseBody` (includes `error`, `embeddedSigningUrl`, `termInMonths` — Task #1242), `MissingFieldsResponseBody` (includes `missingFields`, `calculatedFees`, `securityDeposit`, `firstPaymentDate`, `insuranceEligible`), `AuthorizeCreditCardResponseBody` (includes `authorizationCode`, `preAuthStatus`, `creditCardTransactionPk`) |
| InvoiceClient | svc | sendInvoice |
| LeadClient | svc | changeLeadStatus |
| SettlementClient | svc | settleApplication |
| CreditCardClient | origination | authorizeCreditCard(body or leadPk, firstName, lastName, options?) — builder overload; `AuthorizeCreditCardResponseBody` includes `authorizationCode`, `preAuthStatus`, `creditCardTransactionPk` |
| ScheduledTaskClient | svc | triggerScheduledTask, sendCreditCardPaymentsSweep, sendAchPaymentsSweep, getStatusDatePaymentsListSweep |
| PaymentArrangementClient | svc | makeCreditCardPayments, createOrUpdateAchPayments |
| AccountClient | svc | cancelAccount, getFrequencyChanges(accountPk), getNextReceivable(accountPk), getDueDateMoves(accountPk), moveDueDatesByDays(accountPk, days) |
| MerchantClient | origination/svc | getMerchantsByRefCode, isSignedToFundingEnabled, getMerchantsByCriteria, updateMerchants, getMerchantInfo(leadPk), getSendApplicationRequestsByCriteria (svc host), getSubmitApplicationErrorLogs(from, to, options?), getMerchantApiErrorLogs(from, to, options?) — maps to `uown_merchant_api_error_log`, same params as getSubmitApplicationErrorLogs but no CC fields |
| SvcContactClient | svc | getContactInfo(accountPk), createOrUpdateContactInfo(body), sendVerificationCode(phoneOrEmail, company?) — phone/email contact update; `phonePK`/`customerPK` use capital K; `phoneNumber` is number (Java Long) (Task #146) |
| SvcPayoffClient | svc | getPayoffAmount(accountPk), getAccountSummary(accountPk) |
| LosPartnerAuthClient | svc | authorize(username, password) → GetApiKeyResponse, createApiUser(body) → CreateApiUserResponse — Bearer token issuance for merchant LOS API (Task #482) |
| LosPartnerApplicationClient | svc | createApplication(body?, apiVersion?), searchApplicationStatus(body?), createInvoice(id, body?), settleApplication(id, body?), addLease(id, body?) — Bearer token via setBearerToken(token)/clearBearerToken(); apiVersion=null omits X-API-Version header (tests DefaultLosApiVersionRequestWrapper injection) (Task #482) |

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

### FilterTable React-Select CSS Prefix Pattern

The `FilterTable` component from `@uownleasing/common-ui` uses `filter__` as the `classNamePrefix` for all react-select elements inside filter panels. This is distinct from the send form and application wizard, which use generic (unprefixed) react-select classes.

| Context | CSS class pattern | Example selector |
|---------|-------------------|-----------------|
| Send form / wizard | Generic react-select | `[class*='control']`, `[class*='option']` |
| FilterTable filter panel | `filter__` prefixed | `[class*='filter__control']`, `div[class*='filter__option']` |

**Key selectors for `filter__` react-selects:**

| Selector key | Value | Purpose |
|---|---|---|
| `filterOption` | `div[class*='filter__option']` | Option items inside filter dropdown |
| `naFilterMerchantControl` | `[class*='filter__control']` | Merchant control in New Application filter panel |
| `naFilterMerchantInput` | `[class*='filter__control'] input` | Input inside merchant filter react-select |
| `naFilterLocationControl` | `[class*='filter__control']` | Location control (nth(1)) in filter panel |

**Backdrop overlay behavior:** When a `filter__`-prefixed react-select opens, it renders a portal element (`.filter__menu-portal`) at the `<body>` level containing a transparent backdrop that intercepts pointer events. To interact with options inside this portal:
- Always click with `{ force: true }` on options to bypass the backdrop
- After reading options, press `Escape` before interacting with other elements to close the portal
- Poll `.filter__menu-portal` for `state: 'hidden'` to confirm the portal has closed

**`clickSearch()` pattern:** Before clicking the Search button inside a filter panel, always press `Escape` first to close any open filter dropdown portal, then call `waitForSpinner()`.

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

## ServicingBasePage — Key Methods

| Method | Returns | Notes |
|--------|---------|-------|
| `isTopBarVisible()` | `Promise<boolean>` | Returns `true` if the servicing top bar is visible. Use in tests to guard navigation assertions. **Previously named `verifyTopBar()` (removed — used `expect()` internally, violating the page-object rule of not asserting inside page objects).** |

All page object methods MUST return values (string, boolean, number) — never call `expect()` inside a page object. See `coding-standards.md` and `.claude/rules/page-objects.md`.

## Auto-hooks

- **BEFORE**: `disableCssAnimations(page)`
- **AFTER**: `attachScreenshotOnFailure()` (full-page)
- **AFTER**: `attachTestMetadata()` (JSON: env, URL, duration)

## Key Files

- `src/support/base-test.ts` — Unified fixture + hooks
- `src/support/config.ts` — TestConfig singleton
- `src/config/environment.ts` — ConfigEnvironment per env
- `src/config/constants.ts` — Timeouts, test cards, SSN/phone generation
- `src/selectors/common.selectors.ts` — ALL selectors (incl. 33 PayPair selectors, 5 CompletionScreen selectors, 15 PaymentProgram selectors: `paymentProgramContainer/Logo/Title/Subtitle`, `paymentCard/Title/Description/Price/PriceLabel/DetailRow/Button`, `termSelectionTab/TabSelected`, `paymentProgramFooterText/FooterPhone` (Task #1233 completeApplication redesign), 3 Programs selectors, 1 MerchantInfoPanel selector, 11 NewApplication selectors: `naSendMerchantControl/Input/ClearBtn`, `naSendLocationControl/Input`, `naSendButton`, `naFilterMerchantControl/Input`, `naFilterLocationControl`, `naFilterSearchText/Button`, 6 ErrorLog selectors: `elTabSendApplication`, `elTabSubmitApplication`, `elFilterFromDate`, `elFilterToDate`, `elFilterSearch`, `elFilterSubmitButton`, plus shared react-select: `rsOption`, `rsMenu`, `rsSingleValue`; shared action selectors: `saveButton` = `"button:has-text('SAVE'), button >> span:has-text('SAVE')"`, `filtersButton` = `"button[class*='filterButton'], button:has-text('Filters')"` — used by `MerchantSettingPage` and any page with a Filters/Save button; 15 AMS selectors added in Task #74: `amsRdtTable` = `'.rdt_Table'`, `amsRdtTableRow` = `'.rdt_TableRow'`, `amsRdtPagination` = `'.rdt_Pagination'`, `amsPaginationNextButton` = `'button[aria-label="Next Page"]'`, `amsUsersSelectionInfo` = `'[class*="selectable-users-table_selectionInfo"]'`, `amsMerchantsSelectionInfo` = `'[class*="selectable-merchants-table_selectionInfo"]'`, `amsAssocPageSubmit` = `'button:has-text("Submit")'`, `amsAssocRowCheckbox` = `'input[name="select-row-undefined"]'`, `amsSuccessToast` = `'.Toastify__toast--success, .toast-success, .alert-success'`, `amsAssocConfirmButton` = `'.modal-footer button:has-text("Confirm")'`, `amsLogActivityRow` = `'.rdt_TableRow'`, `amsLogActivityCell` = `'[class*="rdt_TableCell"]'`, `amsEditUserMerchantsButton` = `'span#EditUserMerchants-edit'`, `amsUserMerchantsCardToggle`, `amsUserMerchantsCardCollapse`, `amsUserMerchantsSelectControl` = `'#merchants .filter__control'`, `amsUserMerchantsSelectInput` = `'#merchants .filter__input'`, `amsUserMerchantsSelectOption` = `'[class*="customOptionStyles__CSG9m"]'`, `amsUserMerchantsTag`, `amsUserMerchantsSaveButton` = `'.card:has(#merchants) button[class*="collapsableEdit__button__primary"]'`)
- `src/helpers/database.helpers.ts` — Pool + polling backoff. Methods: CRUD, waitFor*, lead*, shortCode* (migration V20260226100000), uwData* (getUwDataByLeadPk, getLambdaSegment, waitForLambdaSegment), paymentArrangement* (getPaymentArrangement, getPaymentArrangementStatus, getPaymentArrangementsByAccount, waitForPaymentArrangementStatus, paymentArrangementTableExists, getPaymentArrangementColumns, ccTransactionHasArrangementFk, achPaymentHasArrangementFk, getCcTransactionsByArrangement, getAchPaymentsByArrangement), account* (getAccountRating, getAccountStatus, waitForAccountStatus, getAccountPkByLeadPk, waitForAccountByLeadPk), pendingTransactions (getPendingCcTransactions, getPendingAchPayments, waitForCcTransactionsProcessed, waitForAchPaymentsProcessed), leadApprovalTerms* (leadApprovalTermsTableExists, getLeadApprovalTermsColumns, getLeadApprovalTermsForLead, waitForLeadApprovalTerms), lead* (getLeadPkByUuid, getLeadInternalStatus), performanceIndex* (indexExistsOnTable, getIndexColumns, explainAnalyze, getTableRowEstimate — Task #449 getDataMismatchForLead optimization). **Expression index caveat:** `getIndexColumns(name)` queries `pg_attribute` and only returns named columns — it does NOT work for expression-based indexes (e.g., `UPPER(col)` or `col1 || col2`). For expression indexes, verify via `db.getSingleString('SELECT indexdef FROM pg_indexes WHERE indexname = $1', [name])` and assert on the returned DDL string. Use `isExpression: true` flag in test constants to branch the verification path (Tasks #461, #463).
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
| [013](../../docs/adrs/ADR-013-app-source-integration.md) | Application source code integration for test validation | Accepted |

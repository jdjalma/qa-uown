---
paths:
  - "src/pages/**/*.ts"
---

# Page Object Rules

## Hierarchy (MANDATORY — extends always required)

```
BasePage                         # Never instantiate directly
├── LoginPage
├── SearchPage
├── MerchantPage
├── ContractPage
├── PayTomorrowPortalPage
├── PayPairPortalPage
├── OriginationBasePage
│   ├── OriginationCustomerPage, OverviewPage, FundingPage
│   ├── LeaseAgreementPage, MetricsCalculatorPage
│   ├── MerchantSettingPage, ErrorLogPage
├── ServicingBasePage
│   ├── ServicingCustomerPage, PaymentTransactionPage
│   ├── AchHistoryPage, ScheduledPaymentPage, LogPage
│   ├── DueDateMovesHistoryPage, FrequencyChangesHistoryPage
├── WebsiteBasePage
└── AmsBasePage → AmsPage
```

## Rules

```
❌ Page object without extending BasePage (or portal base)
❌ Selectors hardcoded inline — all selectors MUST be in SELECTORS object
❌ expect() inside page object methods — return values, assert in tests
❌ waitForTimeout() — use waitFor({ state }) or polling helpers
❌ Import from internal files — use barrel exports via index.ts

✅ Placement: src/pages/{portal}/{name}.page.ts
✅ Barrel export in src/pages/{portal}/index.ts
✅ All locators use SELECTORS from src/selectors/common.selectors.ts
✅ Waiters for async operations (spinner, modal, network)
✅ Methods return values (strings, booleans) not assertions
```

## Definition of Done

- Extends correct base (BasePage or portal-specific)
- All selectors referenced from `SELECTORS` constant
- Barrel export added to `src/pages/{portal}/index.ts`
- `tsc --noEmit` passes


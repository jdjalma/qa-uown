<!-- PT-BR: Decisão de usar Page Object Model com hierarquia de 3 níveis: BasePage → PortalBase → Page. -->

# ADR-003: Page Object Model with BasePage → PortalBase → Page Hierarchy

## Status
Accepted

## Date
2025-01-20

## Context
With 4 portals and dozens of pages, a UI abstraction pattern was needed that would avoid duplication, centralize common behaviors (spinner, toast, modal, sidebar), and allow per-portal extension.

Options considered:
- **Flat page objects**: each page is independent — simple, but heavy duplication of common methods
- **2-level hierarchy** (BasePage → Page): shares common methods, but doesn't capture portal-specific behaviors
- **3-level hierarchy** (BasePage → PortalBase → Page): common methods in the base, portal behaviors in the middle, specifics in the leaf

## Decision
3-level hierarchy:

```
BasePage                     → spinner, toast, sidebar, modal, React Select
├── OriginationBasePage      → origination sidebar, specific navigation
│   └── OriginationCustomerPage → customer actions
├── ServicingBasePage        → servicing sidebar
│   └── ServicingCustomerPage
├── WebsiteBasePage          → email OTP login
└── AmsBasePage              → AMS features
```

Absolute rule: **never** create a page object without extending BasePage or a portal base.

Documented exceptions:
- `LoginPage` and `SearchPage` extend `BasePage` directly (cross-portal)
- `ContractPage` extends `BasePage` directly (accessed via URL, no sidebar)

## Consequences

**Positive:**
- `waitForSpinner()`, `waitForPageLoad()`, `handleToast()` written once in BasePage
- Sidebar navigation implemented once per portal base
- New page objects inherit everything automatically
- Consistency enforced by hierarchy

**Negative:**
- Rigid hierarchy may complicate atypical cross-portal pages

**Mitigations:**
- Documented exceptions (LoginPage, ContractPage) extend BasePage directly
- Standalone helpers in `src/helpers/` for behaviors that don't fit the hierarchy

## References
- `src/pages/base.page.ts`
- `src/pages/origination/`, `src/pages/servicing/`, `src/pages/website/`, `src/pages/ams/`

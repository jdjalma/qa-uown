---
name: page-object-pattern
description: Carregue ao criar ou refatorar page object em src/pages/. Define hierarquia BasePage > PortalBase > Page, catalogo de page objects existentes (nao duplicar), padrao de selectors centralizados.
disable-model-invocation: true
---

# Page Object Pattern - UOWN Leasing

> Catalogo detalhado de page objects com metodos por task: [references/catalog.md](references/catalog.md)

---

## 1. Hierarquia

```
BasePage
 OriginationBasePage
 CustomerPage, ContractPage, LeadsPage, MerchantEditPage,
 ProgramsPage, ProgramsListPage, ProgramDetailsPage,
 ProgramGroupsPage, MerchantProgramsSectionPage,
 MissingDataFormPage, ErrorLogPage
 ServicingBasePage
 ServicingCustomerPage, BankAccountPage, PaymentArrangementPage,
 DueDateMovesHistoryPage, CreditCardHistoryPage,
 ServicingDocumentsPage, SettlementBreakdownModal
 WebsiteBasePage
 (Update Phone, OTP flows)
 AmsBasePage
 AmsUserDetailsPage, AmsMerchantsPage, AmsUsersPage
 SearchPage (extends BasePage directly)
```

**Location convention:** `src/pages/{portal}/` - `origination`, `servicing`, `website`, `ams`

---

## 2. Conventions

- Every page object extends a portal base class
- Selectors centralized in `src/selectors/selector.types.ts` + `src/selectors/common.selectors.ts`
- Export via barrel file: `src/pages/{portal}/index.ts`
- Methods return data or Locators, never raw strings from `.textContent`
- `dismissCustomerInfoConfirmation(page)` called at entry of ANY method navigating to `/customer-information/{pk}` (pitfall #48 in [[application-lifecycle]])

---

## 3. When NOT to create a new page object

- Method already exists in catalog - check [references/catalog.md](references/catalog.md) first
- Feature is a modal within an existing page - add method to the parent page object
- Feature only needs 1-2 locators - inline in the test, add selectors to `common.selectors.ts`

---

## 4. Creating a new page object - checklist

- [ ] Extend correct portal base class
- [ ] Add selectors to `src/selectors/selector.types.ts` (typed) + `common.selectors.ts` (values)
- [ ] Export from barrel `src/pages/{portal}/index.ts`
- [ ] Use semantic locators: `getByRole`, `getByText`, `getByLabel`, `getByTestId`
- [ ] NO CSS-module hash selectors (pitfall #26 in [[application-lifecycle]])
- [ ] `test.step` to group logical actions in tests
- [ ] `ctx` object to share state between steps (same test only)
- [ ] `testData` fixture with `buildTestData` for data setup

---

## 5. Anti-patterns

| Anti-pattern | Why | Do instead |
|-------------|-----|------------|
| CSS-module hash selectors (`.foo__bar__cn7Wg`) | Change every webpack rebuild | `getByText`, `getByRole`, `getByTestId` |
| `getRows.filter({ hasText: pk }).first` | Substring collision in rdt tables | `page.locator(SELECTORS.tableRowById(pk))` or `getByRole('cell', { name, exact: true })` |
| `button:has-text('Sign')` (substring) | Collides with "Change to Signed" | `getByRole('button', { name: /^E[-\s]?Sign$/i })` |
| `page.fill` on React-controlled inputs | Silently no-ops | `forceReactInputValue` or `searchByType` |
| `waitForTimeout` / `force: true` as first fix | Masks root cause | DOM-first investigation via MCP (rule #15) |
| `goto(base)` during SPA navigation | Races with router.push | `page.reload` or wait for stabilization |
| Guard by `*Store$` key in localStorage | Stale storageState satisfies trivially | JWT exp decode check (ensureAuthenticated v8) |
| Bootstrap `.modal-body` assumption | Servicing modals use custom wrapper | MCP `browser_snapshot` before declaring selector |

---

## 6. Key patterns

### ensureAuthenticated v8 (Origination SPA auth-retry)

Location: `src/pages/origination/customer.page.ts:225-385`

4 components: (A) pre-emptive JWT exp check, (B) caller-supplied intendedPath, (C) page.reload not goto(base), (D) real hydration guard via JWT exp poll. Apply to any Origination page object method that does `goto(deepUrl)` after CT #10 in sequential run.

Cross-links: pitfall #69 in [[application-lifecycle]].

### rdt table row lookup

```typescript
// Correct: deterministic ID match
const row = page.locator(SELECTORS.tableRowById(Number(pk)));
// Fallback: exact cell match
const fallback = getRows.filter({
 has: page.getByRole('cell', { name: String(pk), exact: true }),
});
return row.or(fallback).first;
```

### dismissCustomerInfoConfirmation

Required at entry of EVERY method interacting with Servicing `/customer-information/{pk}`. Uses `waitFor({ state: 'visible', timeout: 10_000 })`, dismiss via "Confirm" button only.

---

## 7. Mandatory test patterns

- `test.step` to group logical actions
- `ctx` object to share state between steps (same test only)
- `testData` fixture with `buildTestData` for data setup
- Tags: `@smoke`, `@sanity`, `@regression` + `@critical` via `TestTag` enum

---

## 8. Project test structure

```
tests/
 api/ # API-only tests (no browser)
 auth.setup.ts # Auth state setup
 ci/ # CI-specific tests
 e2e/ # E2E browser tests (by portal)
 origination/
 servicing/
 website/ (future)
 ams/ (future)
 taskTestingUown/ # GitLab task-driven tests
 {testName}/{testName}.spec.ts
```

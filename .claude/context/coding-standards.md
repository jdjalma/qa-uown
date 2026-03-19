<!-- PT-BR: Regras globais obrigatórias para todo código do projeto. Não negociáveis. -->

# Coding Standards — Global Rules

These rules apply to **all code** generated in the project. Non-negotiable.

---

## NEVER

- Create a page object without extending `BasePage` or a portal base page
- Put hardcoded selectors in tests or page objects — use `SELECTORS` const
- Create an API client without extending `BaseClient`
- Use generic `setTimeout` — use polling with backoff (`DatabaseHelpers`)
- Commit credentials, API keys, or PII in code/logs
- Import directly from internal files — use barrel exports (`index.ts`)
- Import from `@playwright/test` in tests — use `@support/base-test` or `@fixtures/test-context.fixture`
- Write to `.env`, `.pem`, `node_modules/`
- Use `body as never` or `body as unknown as X` casts to bypass type errors — fix the body builder instead
- Use relative `../` imports — always use path aliases (see table below)

## ALWAYS

- Page objects in `src/pages/{portal}/`
- Selectors centralized in `src/selectors/common.selectors.ts`
- API clients in `src/api/clients/`, bodies in `bodies/`, responses in `responses/`
- Test data in `src/data/`
- E2E tests in `tests/e2e/{portal}/`, API tests in `tests/api/`
- Task tests (from GitLab issues) in `tests/taskTestingUown/`
- `test.step()` to group logical actions
- `ctx` to share state between steps
- Path aliases in ALL imports — never use relative `../` paths (see alias table below)
- Barrel exports updated when creating new files
- `tsc --noEmit` as the last step of any implementation
- Parameterized SQL queries (`$1`, `$2`) — never concatenate

## Test Naming Convention (MANDATORY)

Tests originating from tracked tasks (GitLab issues) MUST follow this pattern:

```
Format:    {milestone}_{camelCaseTitle}_{taskNumber}
Example:   R1.49.1_separateShortCodeInANewEntity_469
```

| Component | Source | Rule |
|-----------|--------|------|
| `milestone` | GitLab milestone (e.g., `R1.49.1`) | Exact value, dots preserved |
| `camelCaseTitle` | Task title | First word lowercase, subsequent words capitalized, no spaces/special chars |
| `taskNumber` | GitLab issue `iid` | Numeric only |

**Usage in code:**
```typescript
// test.describe — standardized name + env/merchant suffix
test.describe('R1.49.1_separateShortCodeInANewEntity_469 - sandbox/ProgressMobility', { tag: [...] }, () => {

// File name — same pattern as test.describe
// API:  R1.49.1_separateShortCodeInANewEntity_469.spec.ts
// E2E:  R1.49.1_separateShortCodeInANewEntity_469.spec.ts
```

**Flow:** `fetch-task` generates name → `spec-test` uses in SPEC → `impl-*` uses in test.describe + file name.

## Path Aliases (MANDATORY — never use relative `../` imports)

All imports in `tests/**` and `src/**` MUST use these aliases (defined in `tsconfig.json`):

| Alias | Maps to | Example |
|-------|---------|---------|
| `@config/*` | `src/config/*` | `@config/constants.js` |
| `@ptypes/*` | `src/types/*` | `@ptypes/enums.js` |
| `@data/*` | `src/data/*` | `@data/merchants.js` |
| `@fixtures/*` | `src/fixtures/*` | `@fixtures/test-context.fixture.js` |
| `@helpers/*` | `src/helpers/*` | `@helpers/date.helpers.js` |
| `@pages/*` | `src/pages/*` | `@pages/origination/index.js` |
| `@selectors/*` | `src/selectors/*` | `@selectors/common.selectors.js` |
| `@api/*` | `src/api/*` | `@api/bodies/application.body.js` |
| `@api/clients` | `src/api/clients/index` | barrel export |
| `@api/bodies` | `src/api/bodies/index` | barrel export |
| `@api/responses` | `src/api/responses/index` | barrel export |
| `@support/*` | `src/support/*` | `@support/base-test.js` |
| `@support` | `src/support/index` | barrel export |

**Anti-pattern (NEVER do this):**
```typescript
// WRONG — relative path
import { test } from '../../../../src/support/base-test.js';
import { CONSTANTS } from '../../../src/config/constants.js';

// CORRECT — path alias
import { test } from '@support/base-test.js';
import { CONSTANTS } from '@config/constants.js';
```

**Note:** This applies to `tests/taskTestingUown/` subdirectories especially — deep nesting makes relative imports fragile and verbose.

## Conventions

| Element | Convention |
|---------|-----------|
| TypeScript | `strict: true`, `noImplicitReturns: true` |
| Page object | `{name}.page.ts` extends BasePage/PortalBase |
| API client | `{domain}.client.ts` extends BaseClient |
| Request body | `{domain}.body.ts` |
| Response type | `{domain}.response.ts` |
| E2E test | `{milestone}_{camelCaseTitle}_{number}.spec.ts` with `test.step()` |
| API test | `{milestone}_{camelCaseTitle}_{number}.spec.ts` |
| test.describe | `{milestone}_{camelCaseTitle}_{number} - {env}/{merchant}` |
| Selectors | In `SELECTORS` const, never inline |
| Tags | `@cicd`, `@sandbox`, `@qa1`, `@smoke`, `@regression` |
| Commits | Conventional Commits (`feat(portal): desc`) |
| Docs | Business rules in PT-BR, tech docs in English |
| Return types | Explicit on page objects and API clients |
| Waiters | Mandatory: `waitForSpinner()`, `waitForPageLoad()` |

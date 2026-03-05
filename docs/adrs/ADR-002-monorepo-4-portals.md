<!-- PT-BR: Decisão de usar monorepo único para 4 portais com 12 projetos Playwright. -->

# ADR-002: Monorepo for 4 Portals with 12 Playwright Projects

## Status
Accepted

## Date
2025-01-15

## Context
The UOWN Leasing platform has 4 web portals (Origination, Servicing, Website, AMS) and REST APIs. Business flows frequently cross portals (e.g., create application in Origination, process payment in Servicing, verify on Website).

Options considered:
- **Separate repos** per portal: full isolation, but prevents cross-portal tests and causes helper/page object duplication
- **Monorepo** with separate Playwright projects: shared code (helpers, data, fixtures), cross-portal tests possible, single page object base

## Decision
Single monorepo with **12 Playwright projects** configured in `playwright.config.ts`:

| Category | Projects |
|----------|----------|
| Auth setup | `auth-origination`, `auth-servicing` |
| Desktop UI | `origination-ui`, `servicing-ui`, `website-ui`, `ams-ui` |
| Cross-browser | `website-firefox`, `website-webkit` |
| Mobile | `website-mobile-ios`, `website-mobile-android` |
| Tablet | `website-tablet` |
| API-only | `api-only` |

Each project defines: test directory, browser/device, auth dependency, and file filter.

## Consequences

**Positive:**
- Cross-portal tests share page objects, helpers, and fixtures
- A single `npm test` runs everything; granular scripts per portal (`test:origination`, `test:api`)
- CI can run subsets: `test:cicd` (tag), `test:website:all-devices`
- DRY code: `BasePage`, `BaseClient`, helpers reused

**Negative:**
- Complex config in `playwright.config.ts` (12 projects)
- All portals share `node_modules` and versions

**Mitigations:**
- Named npm scripts for each combination (`test:cross-browser`, `test:website:mobile`)
- Auth projects running as setup dependencies

## References
- ADR-001 (Playwright + TypeScript)
- `playwright.config.ts`

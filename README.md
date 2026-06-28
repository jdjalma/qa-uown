# fintech-playwright

Test automation framework for the **UOWN Leasing** fintech platform. Built with **Playwright + TypeScript**, covering API testing, E2E browser testing, and hybrid flows across four portals.

## Portals

| Portal | Description |
|--------|-------------|
| **Origination** | Loan/lease application management — underwriting, contracts, e-sign, settlement, funding |
| **Servicing** | Account management — payments (ACH/CC), transaction history, scheduled payments |
| **Website** | Customer self-service — account view, payments, documents, contact info |
| **AMS** | Administrative management — system configuration, user management |

## Tech Stack

| Technology | Purpose |
|------------|---------|
| [Playwright](https://playwright.dev) | Browser automation + API testing |
| TypeScript | Type safety |
| PostgreSQL (pg) | Database validation |
| Allure | Extended reporting (optional) |
| dotenv | Environment configuration |

## Quick Start

```bash
# Install dependencies
npm install
npx playwright install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Run all tests
npm test

# Run by portal
npm run test:origination
npm run test:servicing
npm run test:website
npm run test:ams

# Run API-only (no browser)
npm run test:api
```

## Project Structure

```
src/
├── api/                # REST clients + typed bodies/responses
│   ├── clients/        # BaseClient → ApplicationClient, InvoiceClient, etc.
│   ├── bodies/         # Request payload builders
│   └── responses/      # Response interfaces
├── config/             # Environment config, constants
├── support/            # Test infrastructure (fixtures, hooks, browser profiles)
├── pages/              # Page Object Model
│   ├── origination/    # Contract, Customer, Funding, LeaseAgreement, Overview
│   ├── servicing/      # Customer, PaymentTransaction, AchHistory
│   ├── website/        # WebsiteBase
│   └── ams/            # AmsBase, Ams
├── helpers/            # Utilities (database, date, table, validation)
├── data/               # Test data (merchants, addresses, accounts)
├── fixtures/           # Playwright fixtures + JSON API templates
├── selectors/          # Centralized CSS/XPath selectors
└── types/              # Enums and TypeScript types
tests/
├── api/                # API-only tests
└── e2e/                # E2E browser tests
    ├── origination/
    ├── servicing/
    ├── website/
    └── ams/
docs/
├── PROJECT.md          # Architecture details
├── TESTING.md          # Testing guide and conventions
├── AGENTS.md           # Agent/subagent workflow documentation
├── onboarding-qa.md    # QA onboarding guide
├── database-schema.md  # Database schema reference
├── business-rules/     # Domain business rules (chapters + appendices)
├── adrs/               # Architecture Decision Records (ADR-001..009)
├── api-reference/      # UOWN TMS Service API mirror (OpenAPI 3.0.1)
├── knowledge-base/     # Per-feature investigation notes (from /discovery)
└── scenarios/          # BDD scenarios per demand (/test-scenarios → /test-report)
```

## Running Tests

### By Portal

```bash
npm run test:origination      # Origination portal
npm run test:servicing        # Servicing portal
npm run test:website          # Website portal
npm run test:ams              # AMS portal
npm run test:api              # API-only (no browser)
npm run test:e2e              # All E2E portals
```

### Cross-Browser & Multi-Device

```bash
npm run test:website:firefox          # Firefox
npm run test:website:webkit           # Safari/WebKit
npm run test:cross-browser            # Chrome + Firefox + WebKit
npm run test:website:mobile           # iPhone 12 Pro + Pixel 5
npm run test:website:mobile:ios       # iPhone 12 Pro only
npm run test:website:mobile:android   # Pixel 5 only
npm run test:website:tablet           # iPad Pro 11
npm run test:website:all-devices      # All browsers + mobile + tablet
```

### By Environment

```bash
ENV=sandbox npm test    # Sandbox (default)
ENV=qa1 npm test        # QA1
ENV=qa2 npm test        # QA2
ENV=stg npm test        # Staging
```

### By Tag

```bash
npm run test:cicd                              # Tests tagged @cicd
npx playwright test --grep @smoke              # Custom tag filter
```

## Reports

```bash
npm run report          # Open HTML report
npm run report:summary  # View JSON summary
npm run report:allure   # Generate and open Allure report
npm run report:clean    # Clean all reports
```

Report outputs:
- HTML → `reports/html/`
- JSON summary → `reports/test-summary.json`
- Allure → `reports/allure-report/`
- Artifacts → `reports/test-results/`

## Environment Configuration

Copy `.env.example` to `.env` and fill in credentials:

| Variable | Description |
|----------|-------------|
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Admin portal credentials |
| `MANAGER_USERNAME` / `MANAGER_PASSWORD` | Manager credentials |
| `UOWN_API_KEY` | API key for UOWN services |
| `UOWN_API_AUTHORIZATION` | Bearer token for API auth |
| `UOWN_DB_URL_{ENV}` | Database URL (JDBC format, auto-converted) |
| `EMAIL` / `EMAIL_PASSWORD` | Email for OTP flows |

### Runtime Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ENV` | `sandbox` | Target environment |
| `WORKERS` | `1` | Parallel test workers |
| `RETRIES` | `0` (CI: `1`) | Retry count |
| `TIMEOUT_MULTIPLIER` | `1` | Multiply all timeouts |
| `CI` | `false` | CI mode (headless, auto-retry) |
| `ALLURE` | `false` | Enable Allure reporter |

## Architecture Highlights

### Test Fixtures

```typescript
// E2E tests get all fixtures automatically
import { test, expect } from '@support/base-test';

test('flow', async ({ page, api, db, ctx, testEnv }) => {
  // api   → typed API clients (application, invoice, lead, etc.)
  // db    → database query helpers
  // ctx   → shared state (leadPk, accountPk, etc.)
  // page  → Playwright page with auto-hooks (animations disabled, screenshot on failure)
});
```

### Page Object Model

```
BasePage (abstract)
├── LoginPage, SearchPage, MerchantPage
├── OriginationBasePage → CustomerPage, ContractPage, FundingPage, ...
├── ServicingBasePage → CustomerPage, PaymentTransactionPage, ...
├── WebsiteBasePage
└── AmsBasePage → AmsPage
```

### API Client Layer

```
BaseClient (auth headers, URL resolution)
├── ApplicationClient    # Application lifecycle
├── InvoiceClient        # Invoice operations
├── LeadClient           # Lead status management
├── SettlementClient     # Lease settlement
├── CreditCardClient     # CC operations
└── ScheduledTaskClient  # Scheduled tasks
```

### State Machine

```
UW_APPROVED → CC_AUTH_PASSED → CONTRACT_CREATED → SIGNED → SETTLED → FUNDING → FUNDED
```

## Documentation

| Document | Description |
|----------|-------------|
| [PROJECT.md](docs/PROJECT.md) | Architecture, setup, and environment details |
| [TESTING.md](docs/TESTING.md) | Testing guide, conventions, and examples |
| [AGENTS.md](docs/AGENTS.md) | Agent/subagent workflow for AI-assisted development |
| [onboarding-qa.md](docs/onboarding-qa.md) | QA onboarding guide |
| [Business Rules](docs/business-rules/) | Domain knowledge (chapters + appendices) |
| [ADRs](docs/adrs/) | Architecture Decision Records (ADR-001..009) |
| [API Reference](docs/api-reference/) | UOWN TMS Service API mirror (OpenAPI 3.0.1) |
| [Knowledge Base](docs/knowledge-base/) | Per-feature investigation notes (from `/discovery`) |
| [Scenarios](.claude/oracles/) | BDD scenarios per demand (from `/test-scenarios`) |
| [CLAUDE.md](CLAUDE.md) | AI agent instructions and project context |

## Key Conventions

- **Imports:** Use path aliases (`@support/base-test`, `@pages/origination/customer.page`, etc.)
- **Test steps:** Use `test.step()` for logical grouping
- **Shared state:** Use `ctx` fixture across test steps
- **Selectors:** Centralized in `src/selectors/common.selectors.ts`
- **Test data:** Parameterized with `for...of` loops over data arrays
- **Tags:** `@cicd`, `@smoke`, `@regression` for filtering

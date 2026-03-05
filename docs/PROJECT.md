# UOWN QA Automation - Playwright + TypeScript

## Overview

Test automation framework for the UOWN Leasing fintech platform, covering API testing and E2E browser testing across four portals: Origination, Servicing, Website, and AMS.

Migrated from the Java/Cucumber-based `fintech-qaautomation` project to Playwright + TypeScript for better developer experience, faster execution, and native API testing support.

## Tech Stack

| Technology | Purpose |
|---|---|
| Playwright | Browser automation + API testing |
| TypeScript | Type safety and IDE support |
| Node.js | Runtime |
| PostgreSQL (pg) | Database validation |
| Allure | Extended reporting (optional) |
| dotenv | Environment configuration |

## Architecture

```
fintech-playwright/
├── src/
│   ├── api/                    # API layer
│   │   ├── clients/            # Domain-specific API clients
│   │   ├── bodies/             # Typed request body builders
│   │   └── responses/          # Typed response interfaces
│   ├── config/                 # Environment and base configuration
│   │   ├── environment.ts      # Multi-env config loader
│   │   ├── constants.ts        # Timeouts, test cards, generators
│   │   ├── base-api-client.ts  # Legacy API client (backwards compat)
│   │   └── test-options.ts     # Playwright fixtures (API-only tests)
│   ├── support/                # Test infrastructure
│   │   ├── base-test.ts        # Main test fixture (E2E tests)
│   │   ├── hooks.ts            # Lifecycle hooks (animations, screenshots)
│   │   ├── browser-factory.ts  # Browser/device profiles
│   │   ├── config.ts           # Centralized test configuration
│   │   └── custom-reporter.ts  # JSON summary reporter
│   ├── pages/                  # Page Object Model
│   │   ├── base.page.ts        # Abstract base page
│   │   ├── login.page.ts       # Login page
│   │   ├── search.page.ts      # Quick search page
│   │   ├── merchant.page.ts    # Merchant page
│   │   ├── origination/        # Origination portal pages + ContractPage + PayTomorrowPortalPage + PayPairPortalPage
│   │   ├── servicing/          # Servicing portal pages
│   │   ├── website/            # Website portal pages
│   │   └── ams/                # AMS portal pages
│   ├── helpers/                # Utility functions
│   │   ├── common.helpers.ts   # Shared UI helpers
│   │   ├── database.helpers.ts # PostgreSQL operations
│   │   ├── date.helpers.ts     # Date calculations
│   │   ├── email.helpers.ts    # IMAP OTP extraction + email link extraction
│   │   ├── table.helpers.ts    # Table navigation helpers
│   │   ├── validation.helpers.ts # Assertion utilities
│   │   ├── downloads.helpers.ts # Download handling
│   │   └── template-engine.ts  # JSON template interpolation
│   ├── data/                   # Test data
│   │   ├── merchants.ts        # Merchant configurations (16 merchants)
│   │   ├── tire-agent.data.ts  # PayPair portal data (product, config, JSON builders)
│   │   ├── state-address-mapper.ts # US state addresses
│   │   └── test-accounts.ts    # Account persistence
│   ├── fixtures/               # Playwright fixtures & templates
│   │   ├── test-context.fixture.ts # API-only test fixture
│   │   └── api-templates/      # JSON request templates
│   ├── types/                  # Enums and types
│   └── selectors/              # CSS/DOM selectors
├── tests/
│   ├── auth.setup.ts           # Authentication setup
│   ├── api/                    # API-only tests (no browser)
│   └── e2e/                    # E2E browser tests
│       ├── origination/        # new-application, unified-flow, paytomorrow-refund-flow, tire-agent-unified-flow
│       ├── servicing/          # payment-transaction, reverse-payment
│       ├── website/
│       └── ams/
├── reports/                    # Generated reports (gitignored)
├── docs/                       # Documentation
│   ├── PROJECT.md              # This file
│   ├── TESTING.md              # Testing guide
│   ├── AGENTS.md               # Agent/subagent workflow
│   ├── adrs/                   # Architecture Decision Records (12 ADRs)
│   └── business-rules/         # Business domain rules (11 chapters + 6 appendices)
└── playwright.config.ts        # Playwright configuration
```

## Setup

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
npx playwright install
```

### Environment Configuration

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

Required variables:

| Variable | Description |
|---|---|
| `DB_CONNECTION_STRING` | PostgreSQL connection string |
| `UOWN_API_KEY` | API key for UOWN services |
| `UOWN_API_AUTHORIZATION` | Bearer token for API auth |
| `ORIGINATION_URL` | Origination portal URL |
| `SERVICING_URL` | Servicing portal URL |
| `WEBSITE_URL` | Customer website URL |
| `AMS_URL` | AMS portal URL |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Admin credentials |

### Running Tests

```bash
# All tests
npm test

# By portal
npm run test:origination
npm run test:servicing
npm run test:website
npm run test:ams

# API-only (no browser)
npm run test:api

# All E2E tests
npm run test:e2e

# Mobile viewport
npm run test:website:mobile

# CICD tagged tests
npm run test:cicd

# Specific environment
ENV=qa1 npm test
```

### Reports

```bash
# Open HTML report
npm run report

# View JSON summary
npm run report:summary

# Generate Allure report
npm run report:allure

# Clean reports
npm run report:clean
```

## Environments

| Environment | Description |
|---|---|
| `sandbox` | Default development/testing |
| `qa1` | QA environment 1 |
| `qa2` | QA environment 2 |
| `stg` | Staging (pre-production) |
| `dev1`/`dev2`/`dev3` | Developer environments |

Set via: `ENV=qa1 npm test`

## Portals

| Portal | Description | URL Pattern |
|---|---|---|
| Origination | Loan/lease application management | `origination-{env}.uownleasing.com` |
| Servicing | Account management & payments | `svc-website-{env}.uownleasing.com` |
| Website | Customer self-service portal | `website-{env}.uownleasing.com` |
| AMS | Administrative management system | `ams-website-{env}.uownleasing.com` |

## Related Documentation

- [README.md](../README.md) — Quick start and overview
- [TESTING.md](TESTING.md) — Testing guide and conventions
- [AGENTS.md](AGENTS.md) — Subagent architecture (15 agents + CLAUDE.md orchestrator)
- [CLAUDE.md](../CLAUDE.md) — AI agent instructions and project context
- [Business Rules](business-rules/) — Domain knowledge (11 chapters + 6 appendices)
- [ADRs](adrs/) — Architecture Decision Records

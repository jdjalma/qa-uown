<!-- PT-BR: Decisão de usar fixture unificada em base-test.ts com auto-hooks para todos os testes. -->

# ADR-011: Unified Fixture in base-test.ts

## Status
Accepted

## Date
2025-02-15

## Context
E2E tests need multiple resources: page (browser), API clients, database helpers, email helpers, shared context, environment variables. Without a unified fixture, each test would repeat the setup/teardown of each resource.

Options considered:
- **Manual setup per test**: flexible, but repetitive and error-prone
- **Individual fixtures**: each resource as a separate fixture — clean, but many imports
- **Unified fixture**: a single import that provides everything

## Decision
Unified fixture in `src/support/base-test.ts` that extends `@playwright/test` with:

| Fixture | Type | Lifecycle |
|---------|------|-----------|
| `testEnv` | ConfigEnvironment | Per worker |
| `api` | ApiClients | Per test |
| `db` | DatabaseHelpers | Per worker |
| `email` | EmailHelpers | Per test |
| `ctx` | TestContext | Per test |
| `consoleLogs` | () => string[] | Per test |

Auto-hooks applied automatically:
- `disableCssAnimations(page)` — eliminates animations
- `attachScreenshotOnFailure()` — screenshot on failure
- `attachTestMetadata()` — JSON with env, URL, duration

Two entry points:
- `@support/base-test` → E2E tests (with browser)
- `@fixtures/test-context.fixture` → API-only tests (no browser, re-exports base-test)

## Consequences

**Positive:**
- Single import per test: `import { test, expect } from '@support/base-test'`
- Auto-hooks guarantee consistency (screenshots, metadata) without manual code
- `ctx` shares state between steps without global variables
- Managed lifecycle (DB pool reused, automatic cleanup)

**Negative:**
- "God object" fixture — all resources available even when not used

**Mitigations:**
- Resources are lazy-initialized (doesn't connect to DB if `db` is not used)
- Separate entry point for API-only (no browser overhead)

## References
- `src/support/base-test.ts`
- `src/support/hooks.ts`
- `src/fixtures/test-context.fixture.ts`

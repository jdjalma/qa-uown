<!-- PT-BR: Decisão de usar Playwright + TypeScript strict + ESModules como stack do framework de testes. -->

# ADR-001: Playwright with TypeScript Strict and ESModules

## Status
Accepted

## Date
2025-01-15

## Context
The project needed a test automation framework for a fintech platform with 4 web portals (Origination, Servicing, Website, AMS), REST APIs, and database validations. The previous framework (Java/Cucumber in the `fintech-qaautomation` project) had maintenance and development speed limitations.

Options considered:
- **Selenium + Java**: Existing framework, team familiarity, but verbose and slow for development
- **Cypress + JavaScript**: Popular, good DX, but limited to a single domain per test (blocking for multi-portal flows)
- **Playwright + TypeScript**: Multi-browser, multi-domain, native API testing, auto-wait, strict typing

## Decision
Adopt **Playwright `^1.50.0`** with **TypeScript `^5.6.0`** in strict mode and ESModules (`"module": "NodeNext"`).

TypeScript configuration:
- `"strict": true` — compile-time error catching
- `"noImplicitReturns": true` — explicit returns
- `"moduleResolution": "NodeNext"` — native ESModules
- Path aliases (`@pages/*`, `@api/*`, etc.) via `tsconfig.json`

## Consequences

**Positive:**
- Native multi-browser (Chromium, Firefox, WebKit) with the same API
- Multi-domain: tests can navigate between portals without restrictions
- Integrated API testing (`request` fixture) — no separate library needed
- Auto-wait reduces flakiness vs Selenium
- Strict typing catches errors before running tests
- Traces, screenshots, and video integrated for debugging

**Negative:**
- Learning curve for team coming from Java/Cucumber
- ESModules requires attention with imports (`.js` extensions in paths)

**Mitigations:**
- Path aliases eliminate relative import complexity
- CLAUDE.md and docs/TESTING.md document patterns for onboarding

## References
- ADR-012 (migration from Java/Cucumber)
- `playwright.config.ts`, `tsconfig.json`

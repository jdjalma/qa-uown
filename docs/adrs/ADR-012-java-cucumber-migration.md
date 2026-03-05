<!-- PT-BR: Decisão de migrar o framework de testes de Java/Cucumber/Selenium para Playwright/TypeScript. -->

# ADR-012: Migration from Java/Cucumber to Playwright/TypeScript

## Status
Accepted

## Date
2025-01-15

## Context
The original project `fintech-qaautomation` used Java + Cucumber + Selenium for E2E tests. The framework had:
- Slow tests (Selenium WebDriver + Java startup)
- Heavy maintenance of Gherkin step definitions
- Difficulty with integrated API tests (needed separate libraries)
- No simple cross-browser testing
- Complex setup (Maven, ChromeDriver versioning)

## Decision
Complete migration to **Playwright + TypeScript**, preserving:
- **Coverage**: same business flows covered
- **Data**: same parameterized scenarios
- **Knowledge**: references to Java code in codebase comments

Migration strategy:
1. New framework setup (config, fixtures, base page objects)
2. Portal-by-portal migration (Origination first, then Servicing)
3. Addition of capabilities not present in Java (multi-device, API testing, DB polling)
4. Gradual retirement of the Java repo

## Consequences

**Positive:**
- Tests ~3x faster (Playwright vs Selenium)
- Native API testing (no separate library)
- Multi-browser/device with 12 projects
- TypeScript strict catches errors at compile time
- Simple setup (`npm install` vs Maven + ChromeDriver)

**Negative:**
- Migration period with two active repos
- Team needed to learn TypeScript and Playwright
- References to Java code may confuse new members

**Mitigations:**
- Extensive documentation (CLAUDE.md, TESTING.md, business-rules/)
- Codebase comments referencing Java equivalents
- `context/glossary.md` maps Java/Cucumber → TypeScript/Playwright terms

## References
- Original repo: `fintech-qaautomation` (Java/Cucumber)
- ADR-001 (Playwright + TypeScript choice)

---
paths:
  - "src/pages/**/*.ts"
---

# Page Object Rules

## Hierarchy (MANDATORY — extends always required)

> **Full tree:** `context/project.md` §Page Object Hierarchy (source of truth).

Quick base-class lookup:

| Portal | Base class |
|--------|-----------|
| Origination | `OriginationBasePage` |
| Servicing | `ServicingBasePage` |
| Website | `WebsiteBasePage` |
| AMS | `AmsBasePage` |
| Cross-portal / external | `BasePage` |

## Rules

```
❌ Page object without extending BasePage (or portal base)
❌ Inline selector in a SPEC (use the page object method); cross-cutting selector outside common.selectors.ts
❌ expect() inside page object methods — return values, assert in tests
❌ waitForTimeout() — use waitFor({ state }) or polling helpers
❌ Import from internal files — use barrel exports via index.ts

✅ Placement: src/pages/{portal}/{name}.page.ts
✅ Barrel export in src/pages/{portal}/index.ts
✅ Selector co-located in the page object (semantic getter) OR in SELECTORS; cross-cutting (≥2 pages) → src/selectors/common.selectors.ts
✅ Waiters for async operations (spinner, modal, network)
✅ Methods return values (strings, booleans) not assertions
```

## Definition of Done

- Extends correct base (BasePage or portal-specific)
- Selectors co-located in the page object or in `SELECTORS` (cross-cutting) — never inline in a spec
- Barrel export added to `src/pages/{portal}/index.ts`
- `tsc --noEmit` passes

## DOM-First investigation (MANDATORY — CLAUDE.md #16)

When creating OR refactoring locators for a page object, **validate the real DOM via MCP Playwright** before choosing the strategy:

- `getByRole('button')` vs `getByRole('link')` is determined by the real `tagName` (`<button>` vs `<a>`), NOT by visual appearance or Bootstrap classes (`btn`, `dropdown-toggle`)
- Elements in dropdowns/menus may be in the DOM with `display: none` on an ancestor — `browser_evaluate` returns `visible: false`, requiring the dropdown to be opened first
- Responsive breakpoints (Bootstrap `d-lg-block` = ≥992px) can hide the entire navbar at a small viewport — fix viewport to 1440×900 before inspecting
- Page objects MUST NOT have a retry/fallback `try { ... } catch { ... alternative try }` to mask an unstable selector — if the primary selector fails, it is wrong and the protocol must be run

When to apply:
- Creating a new page object → inspect the real DOM of the target portal via MCP before declaring `readonly` locators
- Refactoring an existing page object with failures → run the protocol BEFORE touching the code
- Migrating an XPath/CSS selector to semantic (`getByRole`) → validate via MCP that the real role/name match

Full protocol: skill [[dom-investigation]] at `.claude/skills/dom-investigation/SKILL.md`


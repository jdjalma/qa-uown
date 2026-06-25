---
paths:
  - "src/selectors/**/*.ts"
  - "src/pages/**/*.ts"
---

# Selector Rules

## Where the selector lives (reconciled policy 2026-06-23)

The old rule "EVERY selector in `common.selectors.ts`" does not scale (1,110 locators already live co-located in page objects) and fought against cohesion. The real policy:

- **Page-owned selector → CO-LOCATED in the page object** that uses it, as `readonly x = this.page.getByRole(...)` (semantic getter) or referencing `SELECTORS.x`. Co-location is COHESION, not a violation. A selector used by ONE page does not need to go to the global file.
- **Cross-cutting selector (≥2 page objects / portals)** → `src/selectors/common.selectors.ts`, consumed via `SELECTORS.x`. The `AppSelectors` type is **derived** from the object (`typeof SELECTORS`) — a single source, with no parallel interface to keep in sync.
- **A spec NEVER defines an inline selector** — it calls the page object method. This is the boundary ESLint covers (inline locator in `tests/**` = warn).
- The semantic hierarchy (below) applies WHEREVER the selector lives.

```
❌ Spec with inline page.locator(...)/getBy* duplicating a page object method
❌ XPath (xpath=//...) — prefer CSS/semantic (sibling `~`/`:has-text` when structural)
❌ Positional CSS (div:nth-child(3)) — fragile coupling to the DOM
❌ Class-based when id/role is available

✅ Page object co-locates its own selectors (semantic first)
✅ common.selectors.ts only for what is shared between pages
✅ Spec calls a page object method, never the raw locator
✅ Prefer semantic: getByRole(), getByLabel(), getByTestId()
✅ CSS sibling combinators (label:has-text("X") ~ div) over XPath
```

## Priority Order (most to least preferred)

1. `page.getByRole('button', { name: 'Submit' })`
2. `page.getByLabel('Email')`
3. `page.getByTestId('submit-btn')`
4. `page.locator('#specific-id')`
5. `page.locator('[data-field="status"]')`
6. `page.locator('label:has-text("Merchant") ~ div')` (CSS sibling)
7. CSS class selectors as last resort

## Adding a New Selector

1. **Used by 1 page** → define in the page object itself (semantic `readonly` getter) OR in `SELECTORS` — co-location is fine.
2. **Shared by ≥2 pages** → add to the `SELECTORS` object in `src/selectors/common.selectors.ts`. The `AppSelectors` type is DERIVED from the object (`typeof SELECTORS`), so it updates automatically — there is no parallel interface to keep in sync.
3. Use as `SELECTORS.myNewSelector` in the page object.
4. **Never** inline the string in a spec — expose a method in the page object.

## DOM-First before creating/changing a selector (MANDATORY — CLAUDE.md #16)

> Before choosing `getByRole(...)` / `getByLabel(...)` / `getByTestId(...)` for a new element OR changing an existing one that is failing, **validate via MCP Playwright** that the real `tagName`, `role`, and `accessible name` from the DOM match the proposed selector.

- Selector failure with `TimeoutError` / `not visible` / `0 elements` / `strict mode violation` → run the protocol, do NOT increase timeout
- `getByRole('button', ...)` is only valid if the element is `<button>` OR has an explicit `role="button"`. Anchor (`<a>`) is `role="link"` by default
- Suspected responsive issue (`d-lg-block`, `d-none d-md-block`, hamburger menu): fix viewport to 1440×900 before inspecting
- Full protocol: skill [[dom-investigation]] at `.claude/skills/dom-investigation/SKILL.md`

```
❌ Switching getByRole to XPath "because it doesn't work" without inspecting the DOM
❌ Adding a try/catch fallback with an alternative selector (masks the bug)
❌ Increasing timeout without validating role/tag/visible

✅ MCP browser_evaluate returns real tagName/role/visible → DOM vs Selector table → precise fix
```

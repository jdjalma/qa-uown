---
paths:
  - "src/selectors/**/*.ts"
  - "src/pages/**/*.ts"
---

# Selector Rules

## Centralization

```
❌ Selectors defined inline in page objects or tests
❌ XPath selectors (xpath=//...) — prefer CSS or semantic locators
❌ Positional CSS selectors (div:nth-child(3)) — fragile DOM coupling
❌ Class-based selectors when ID or role is available

✅ ALL selectors in src/selectors/common.selectors.ts
✅ Prefer semantic: getByRole(), getByLabel(), getByTestId()
✅ Use data-testid attributes when available
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

1. Add to `SELECTORS` object in `src/selectors/common.selectors.ts`
2. Use as `SELECTORS.myNewSelector` in the page object
3. Never inline the selector string in tests

## DOM-First antes de criar/mudar seletor (MANDATORY — CLAUDE.md #16)

> Antes de escolher `getByRole(...)` / `getByLabel(...)` / `getByTestId(...)` para um elemento novo OU mudar um existente que está falhando, **validar via MCP Playwright** que o `tagName`, `role` e `accessible name` reais do DOM batem com o seletor proposto.

- Falha de seletor com `TimeoutError` / `not visible` / `0 elements` / `strict mode violation` → rodar o protocolo, NÃO aumentar timeout
- `getByRole('button', ...)` só vale se o elemento é `<button>` OU tem `role="button"` explícito. Anchor (`<a>`) é `role="link"` por padrão
- Suspeita de responsive (`d-lg-block`, `d-none d-md-block`, hamburger menu): fixar viewport 1440×900 antes de inspecionar
- Protocolo completo: [`.claude/context/shared/dom-investigation-protocol.md`](../context/shared/dom-investigation-protocol.md)

```
❌ Trocar getByRole por XPath "porque não funciona" sem inspecionar DOM
❌ Adicionar fallback try/catch com selector alternativo (mascara o bug)
❌ Aumentar timeout sem ter validado role/tag/visible

✅ MCP browser_evaluate retorna tagName/role/visible reais → tabela DOM vs Selector → fix preciso
```

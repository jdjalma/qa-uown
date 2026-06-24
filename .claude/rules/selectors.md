---
paths:
  - "src/selectors/**/*.ts"
  - "src/pages/**/*.ts"
---

# Selector Rules

## Onde mora o selector (política reconciliada 2026-06-23)

A regra antiga "TODO selector em `common.selectors.ts`" não escala (1.110 locators já vivem co-locados nos page objects) e brigava com a coesão. Política real:

- **Selector dono-de-página → CO-LOCADO no page object** que o usa, como `readonly x = this.page.getByRole(...)` (getter semântico) ou referenciando `SELECTORS.x`. Co-locação é COESÃO, não violação. Um selector usado por UMA página não precisa ir pro arquivo global.
- **Selector cross-cutting (≥2 page objects / portais)** → `src/selectors/common.selectors.ts`, consumido via `SELECTORS.x`. O tipo `AppSelectors` é **derivado** do objeto (`typeof SELECTORS`) — fonte única, não há interface paralela pra sincronizar.
- **Spec NUNCA define selector inline** — chama o método do page object. Essa é a fronteira que o ESLint cobre (locator inline em `tests/**` = warn).
- A hierarquia semântica (abaixo) vale ONDE QUER que o selector esteja.

```
❌ Spec com page.locator(...)/getBy* inline duplicando método de page object
❌ XPath (xpath=//...) — preferir CSS/semântico (sibling `~`/`:has-text` quando estrutural)
❌ Positional CSS (div:nth-child(3)) — acoplamento frágil ao DOM
❌ Class-based quando id/role disponível

✅ Page object co-loca seus próprios selectors (semânticos primeiro)
✅ common.selectors.ts só pro que é compartilhado entre páginas
✅ Spec chama método de page object, nunca o locator cru
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

1. **Usado por 1 página** → defina no próprio page object (getter `readonly` semântico) OU em `SELECTORS` — co-locação é OK.
2. **Compartilhado por ≥2 páginas** → adicione ao `SELECTORS` object em `src/selectors/common.selectors.ts`. O tipo `AppSelectors` é DERIVADO do objeto (`typeof SELECTORS`), então atualiza sozinho — não há interface paralela pra editar.
3. Use como `SELECTORS.myNewSelector` no page object.
4. **Nunca** inline a string num spec — exponha um método no page object.

## DOM-First antes de criar/mudar seletor (MANDATORY — CLAUDE.md #16)

> Antes de escolher `getByRole(...)` / `getByLabel(...)` / `getByTestId(...)` para um elemento novo OU mudar um existente que está falhando, **validar via MCP Playwright** que o `tagName`, `role` e `accessible name` reais do DOM batem com o seletor proposto.

- Falha de seletor com `TimeoutError` / `not visible` / `0 elements` / `strict mode violation` → rodar o protocolo, NÃO aumentar timeout
- `getByRole('button', ...)` só vale se o elemento é `<button>` OU tem `role="button"` explícito. Anchor (`<a>`) é `role="link"` por padrão
- Suspeita de responsive (`d-lg-block`, `d-none d-md-block`, hamburger menu): fixar viewport 1440×900 antes de inspecionar
- Protocolo completo: skill [[dom-investigation]] em `.claude/skills/dom-investigation/SKILL.md`

```
❌ Trocar getByRole por XPath "porque não funciona" sem inspecionar DOM
❌ Adicionar fallback try/catch com selector alternativo (mascara o bug)
❌ Aumentar timeout sem ter validado role/tag/visible

✅ MCP browser_evaluate retorna tagName/role/visible reais → tabela DOM vs Selector → fix preciso
```

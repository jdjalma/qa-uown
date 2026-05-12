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
❌ Selectors hardcoded inline — all selectors MUST be in SELECTORS object
❌ expect() inside page object methods — return values, assert in tests
❌ waitForTimeout() — use waitFor({ state }) or polling helpers
❌ Import from internal files — use barrel exports via index.ts

✅ Placement: src/pages/{portal}/{name}.page.ts
✅ Barrel export in src/pages/{portal}/index.ts
✅ All locators use SELECTORS from src/selectors/common.selectors.ts
✅ Waiters for async operations (spinner, modal, network)
✅ Methods return values (strings, booleans) not assertions
```

## Definition of Done

- Extends correct base (BasePage or portal-specific)
- All selectors referenced from `SELECTORS` constant
- Barrel export added to `src/pages/{portal}/index.ts`
- `tsc --noEmit` passes

## DOM-First investigation (MANDATORY — CLAUDE.md #16)

Quando criar OU refatorar locators para um page object, **validar o DOM real via MCP Playwright** antes de escolher a estratégia:

- `getByRole('button')` vs `getByRole('link')` é determinado pelo `tagName` real (`<button>` vs `<a>`), NÃO pela aparência visual ou classes Bootstrap (`btn`, `dropdown-toggle`)
- Elementos em dropdowns/menus podem estar no DOM com `display: none` no ancestor — `browser_evaluate` retorna `visible: false`, exigindo abrir o dropdown antes
- Responsive breakpoints (Bootstrap `d-lg-block` = ≥992px) podem esconder navbar inteira em viewport pequeno — fixar viewport 1440×900 antes de inspecionar
- Page object NÃO pode ter retry/fallback `try { ... } catch { ... try alternativo }` para mascarar selector instável — se o selector primário falha, ele está errado e o protocolo deve ser rodado

Quando aplicar:
- Criando um page object novo → inspecionar DOM real do portal alvo via MCP antes de declarar `readonly` locators
- Refatorando page object existente com falhas → rodar protocolo ANTES de mexer no código
- Migrando seletor XPath/CSS para semântico (`getByRole`) → validar via MCP que role/name reais batem

Protocolo completo: [`.claude/context/shared/dom-investigation-protocol.md`](../context/shared/dom-investigation-protocol.md)


---
name: selector-hardening
description: Carregue ao criar/refatorar page object, debugar TimeoutError em locator, ou auditar selectors. Aplica hierarquia role > label > testId > id > attr > sibling > class; centraliza em src/selectors/common.selectors.ts; proíbe XPath e nth-child.
disable-model-invocation: true
---

# Selector Hardening

## Princípios

1. **Centralizar** em `src/selectors/common.selectors.ts` — nada de inline em page objects ou testes.
2. **Semântico primeiro** — `getByRole`, `getByLabel`, `getByTestId` antes de CSS.
3. **DOM-first** (regra inviolável #15) — inspecionar DOM real via MCP Playwright **antes** de propor selector novo ou mudar um quebrado.
4. **Sem XPath**, sem `nth-child` posicional.

## Hierarquia de prioridade

| # | Locator | Quando usar |
|---|---------|-------------|
| 1 | `page.getByRole('button', { name: 'Submit' })` | Default — semântico, resistente a refactor de DOM |
| 2 | `page.getByLabel('Email')` | Form fields com `<label for>` |
| 3 | `page.getByTestId('submit-btn')` | Se o dev colaborou e adicionou `data-testid` |
| 4 | `page.locator('#specific-id')` | ID estável (raro em SPAs modernas) |
| 5 | `page.locator('[data-field="status"]')` | Atributo data customizado |
| 6 | `page.locator('label:has-text("Merchant") ~ div')` | CSS sibling — último recurso semântico |
| 7 | Class selectors | Quando nada acima funciona — flag de tech debt |

## DOM-first protocol (obrigatório ANTES de mexer em selector)

Quando teste falha com `TimeoutError`, `not visible`, `0 elements`, `strict mode violation`:

1. **NÃO aumente timeout, NÃO adicione retry, NÃO use `force: true`.**
2. Abra o portal real via `mcp__playwright__browser_navigate`.
3. Autentique no fluxo apropriado.
4. **Fixe viewport ≥ 1440×900** (Bootstrap usa `d-lg-block` que esconde elementos em viewport menor).
5. `mcp__playwright__browser_snapshot` para árvore acessível.
6. `mcp__playwright__browser_evaluate` para extrair:
 - `tagName`
 - `role` real (computed)
 - `accessible name`
 - `visible` (offsetParent !== null + display !== none)
 - ancestor chain (até `<body>` ou container relevante)
7. Construa tabela **DOM Real vs Selector Atual**:

 | Aspecto | Selector atual | DOM real | Match? |
 |---------|----------------|----------|--------|
 | tagName | `button` | `a` | ❌ |
 | role | `button` | `link` | ❌ |
 | name | "Items Purchased" | "Items Purchased " (trailing space) | ⚠️ |

8. **Só agora** proponha fix preciso.

Detalhe completo: skill [[dom-investigation]].

## Regra — botões cujo texto é substring de outro: usar regex ancorado

Quando dois ou mais botões na mesma página têm labels onde um é substring do outro (ex: `"E-Sign"` e `"Change to Signed"`), `getByRole('button', { name: 'Sign' })` ou `locator('button:has-text("Sign")')` casa com ambos e Playwright lança `strict mode violation`.

**Fix obrigatório:** usar regex ancorado com `^...$`:

```ts
// ❌ Strict mode violation — "Sign" é substring de "Change to Signed"
page.locator('button:has-text("Sign")')
page.getByRole('button', { name: 'Sign' })

// ✅ Regex ancorado — só casa o botão exato
page.getByRole('button', { name: /^E[-\s]?Sign$/i })
```

**Como detectar:** erro `strict mode violation: locator resolved to N elements` onde N > 1. Investigar via `mcp__playwright__browser_snapshot` para listar todos os botões na página.

**Origem:** F-005-remanescente (2026-05-24) — `signContractButton` em `OriginationCustomerPage` colidia com botão de status `"Change to Signed"`. Ver [[application-lifecycle]] pitfall #67.

## Regra — botões que COMPARTILHAM a mesma classe: desambiguar por texto único, nunca `.first()`

Quando dois botões na mesma página são renderizados pelo MESMO componente e compartilham a classe CSS (ex: `filtered-csv-download_csvButton` para Email CSV E Download CSV), um seletor de classe nua + `.first()` casa com o PRIMEIRO no DOM — que pode NÃO ser o que você quer.

**Caso canônico (#1321, 2026-06-18, MCP em QA2):** Email CSV e Download CSV compartilham `filtered-csv-download_csvButton`; **Email CSV é primeiro no DOM**. Um seletor `button[class*='filtered-csv-download_csvButton']` + `.first()` resolve para Email CSV → um clique de "download" abre o modal de email (sintoma silencioso: o teste de download passa pelo caminho errado).

```ts
// ❌ Resolve para Email CSV (primeiro no DOM) — clica o botão errado
page.locator("button[class*='filtered-csv-download_csvButton']").first()

// ✅ Desambiguar pelo texto único do botão alvo
csvDownloadButton: "button[class*='filtered-csv-download_csvButton']:has-text('Download CSV')",
```

**Como detectar:** `browser_evaluate` listando todos os elementos com a classe compartilhada → se N > 1, desambiguar por `:has-text(...)`, `getByRole({ name })` ou um atributo único. Ver [[application-lifecycle]] pitfall #117 e [[page-object-pattern]] FilteredCsvDownloadControls.

## Regra — múltiplos forms com inputs idênticos na mesma página: alvejar por id, nunca por posição

Quando uma tela tem DOIS forms com campos do mesmo tipo/placeholder (ex: Overview tem um form KPI no topo e um form de tabela embaixo, AMBOS com inputs de data MM/DD/YYYY), um seletor posicional (`nth()`) é frágil e tende a casar o form errado.

**Caso canônico (#1321, 2026-06-18):** Overview top-bar KPI form usa ids `#from`/`#to` (toggle `overview_filterButton__`, drives metric cards) vs. table panel `#fromDate`/`#toDate` (toggle `index-module_filterButton__`, drives table + CSV). `nth()` posicional acerta o KPI form. Alvejar os inputs do table panel por id e expandir via o toggle do próprio painel. Ver [[application-lifecycle]] pitfall #114.

## Caso histórico (2026-05-11)

`unified-flow.spec.ts` "Items Purchased" — `TimeoutError`. Investigação inicial assumiu timing; fix proposto era aumentar timeout. **Causa real**: o elemento era `<a>` (link), não `<button>`. `getByRole('button', { name: 'Items Purchased' })` nunca casaria.

Tempo gasto investigando timing: ~horas.
Tempo gasto via MCP DOM inspection: 10 minutos.
**Lição**: timing é hipótese tardia, não primeira.

## Adicionar selector novo

1. Validar via MCP (passo acima)
2. Adicionar em `SELECTORS` object em `src/selectors/common.selectors.ts`
3. Usar como `SELECTORS.myNewSelector` no page object
4. Nunca inline a string no teste

## Tipos comuns

```ts
// src/selectors/common.selectors.ts
export const SELECTORS = {
 submitButton: (page) => page.getByRole('button', { name: 'Submit' }),
 merchantBadge: (page) => page.getByLabel('Merchant').locator('~ div'),
 signingIframe: (page) => page.frameLocator('iframe[name="gowsign"]'),
};
```

## Auditoria (substitui antigo subagent-audit)

Quando carregada em modo "audit": varre `src/selectors/`, `src/pages/`, `tests/` e classifica:

- **Critical**: XPath, `nth-child`, inline em testes
- **Improve**: class-based onde role/label seria possível
- **OK**: semântico, centralizado
- **Dead**: keys em SELECTORS sem referência

Output do agent que carrega esta skill em modo audit: top-N quick wins + lista de dead keys.

## Anti-patterns

- ❌ `try/catch` com fallback de selector — mascara bug
- ❌ Aumentar timeout antes de investigar DOM
- ❌ `force: true` para clicar — disfarça que o elemento não está clicável de verdade (a11y broken)
- ❌ XPath, mesmo "uma vezinha"
- ❌ Selector inline em teste — quebra centralização

## Cross-links

- Regra inviolável #15 em `CLAUDE.md`
- Skill [[dom-investigation]] — protocolo MCP completo
- Skill [[page-object-pattern]] — onde os selectors são consumidos
- Source: `src/selectors/common.selectors.ts`

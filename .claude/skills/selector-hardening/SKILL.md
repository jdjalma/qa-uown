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

**Caso canônico (2026-06-18, MCP em QA2):** Email CSV e Download CSV compartilham `filtered-csv-download_csvButton`; **Email CSV é primeiro no DOM**. Um seletor `button[class*='filtered-csv-download_csvButton']` + `.first()` resolve para Email CSV → um clique de "download" abre o modal de email (sintoma silencioso: o teste de download passa pelo caminho errado).

```ts
// ❌ Resolve para Email CSV (primeiro no DOM) — clica o botão errado
page.locator("button[class*='filtered-csv-download_csvButton']").first()

// ✅ Desambiguar pelo texto único do botão alvo
csvDownloadButton: "button[class*='filtered-csv-download_csvButton']:has-text('Download CSV')",
```

**Como detectar:** `browser_evaluate` listando todos os elementos com a classe compartilhada → se N > 1, desambiguar por `:has-text(...)`, `getByRole({ name })` ou um atributo único. Ver [[application-lifecycle]] pitfall #117 e [[page-object-pattern]] FilteredCsvDownloadControls.

## Regra — botão desabilitado via CSS (`pointer-events:none` + classe), NÃO via atributo `disabled`: `isEnabled()` mente

Playwright `locator.isEnabled()` checa apenas o atributo HTML `disabled`/`aria-disabled`. Um botão desabilitado **só** por CSS (classe `disabledButton` + `pointer-events: none`, com o atributo `disabled` AUSENTE) é reportado como ENABLED por `isEnabled()` → o teste tenta clicar, o clique é interceptado pelo `<div>` pai (pointer-events) e estoura `TimeoutError` "element intercepts pointer events" / "not clickable".

**Fix obrigatório:** não confiar em `isEnabled()` para esses botões. Checar a presença da classe-de-disabled via selector dedicado e retornar `false` se ela estiver visível.

```ts
// ❌ Email CSV é desabilitado por CSS (disabledButton + pointer-events:none), SEM atributo disabled
//    isEnabled() retorna SEMPRE true → clique intercept → timeout
const enabled = await btn.isEnabled();

// ✅ checar a classe-de-disabled diretamente
csvEmailButtonDisabled: "button[class*='disabledButton']:has-text('Email CSV')",
async isEmailCsvEnabled() {
  const cssDisabled = await page.locator(SELECTORS.csvEmailButtonDisabled).first()
    .isVisible().catch(() => false);
  return !cssDisabled;
}
```

**Caso canônico (2026-06-18, qa2 — Funding Queue Email CSV):** o botão Email CSV em `/funding` é desabilitado em tabela vazia via classe `disabledButton` + `pointer-events:none`, SEM atributo `disabled`. `isEnabled()` retornava `true`, o teste tentava clicar e o clique era interceptado pelo parent div → timeout. Fix em `src/pages/origination/filtered-csv-download.controls.ts` (`isEmailCsvEnabled`) usando `SELECTORS.csvEmailButtonDisabled`.

**Como detectar:** `TimeoutError` "intercepts pointer events" ao clicar um botão que `isEnabled()` jurou estar habilitado. Confirmar via `browser_evaluate` que o elemento NÃO tem `disabled` no DOM mas tem `getComputedStyle(el).pointerEvents === 'none'` (ou classe `disabledButton`). Ver [[page-object-pattern]] `FilteredCsvDownloadControls`.

## Regra — múltiplos forms com inputs idênticos na mesma página: alvejar por id, nunca por posição

Quando uma tela tem DOIS forms com campos do mesmo tipo/placeholder (ex: Overview tem um form KPI no topo e um form de tabela embaixo, AMBOS com inputs de data MM/DD/YYYY), um seletor posicional (`nth()`) é frágil e tende a casar o form errado.

**Caso canônico (2026-06-18):** Overview top-bar KPI form usa ids `#from`/`#to` (toggle `overview_filterButton__`, drives metric cards) vs. table panel `#fromDate`/`#toDate` (toggle `index-module_filterButton__`, drives table + CSV). `nth()` posicional acerta o KPI form. Alvejar os inputs do table panel por id e expandir via o toggle do próprio painel. Ver [[application-lifecycle]] pitfall #114.

## Regra — dois modais de confirmação "parecidos" na MESMA página: não reusar o selector de confirm de um no outro

Quando uma tela tem DUAS ações que abrem modais de confirmação visualmente parecidos (ex: "Set to Expired" e "Change to Signed" no summary bar do customer page), é tentador reusar um único selector de botão de confirm para ambos. Os modais divergem no DOM: label do botão, classe e obrigatoriedade do campo comment podem ser diferentes. Um selector que casa um modal retorna **0 elementos** no outro — e se a espera de visibilidade tem `.catch(() => false)`, a falha some e o método retorna SEM clicar (a ação nunca dispara, sintoma silencioso).

**Caso canônico (#1315, 2026-06-18, DOM live qa2 lead 16728):**

| Aspecto | `Set to Expired` | `Change to Signed` |
|---------|------------------|--------------------|
| Modal | "Add a Comment" (`.modal.fade.show`) | "Move Contract to Signed" |
| Comment | OPCIONAL (`input[name='comment']`, "Type here...") | OBRIGATÓRIO ("Add a comment (required)") |
| Botão confirm | **"Save"** (`button[type='submit']`, SEM `.submit-button`) | **"CONFIRM"** (`button.submit-button`) |

```ts
// ❌ Reusar o selector CONFIRM/.submit-button no "Set to Expired" → 0 elementos → no-op silencioso
setToExpiredConfirm: "button.submit-button, button:has-text('CONFIRM')",

// ✅ Ancorar cada modal no seu próprio botão real
setToExpiredConfirm: "[role='dialog'] button[type='submit'], .modal.show button[type='submit'], [role='dialog'] button:has-text('Save'), .modal.show button:has-text('Save')",
```

**Como detectar:** o método "passa" mas o estado não transiciona (status não muda, XHR `changeLeadStatus` nunca dispara). Remover o `.catch` swallow da espera de visibilidade do confirm faz a falha real aparecer. Inspecionar AMBOS os modais via `browser_snapshot` — não assumir que são iguais. Ver [[application-lifecycle]] pitfall #124 e [[page-object-pattern]] OriginationCustomerPage status-action modals.

## Regra — `controlByLabel` com labels de prefixo idêntico: ancorar no PARENT da label, NUNCA `starts-with` + ancestor walk

Quando um page object resolve um controle por XPath ancorado na `<label>` adjacente, usando `starts-with(normalize-space(.), 'X')` + um *ancestor walk* (`ancestor-or-self::*[.//*[contains(@class,'filter__control')]][1]`), ele quebra silenciosamente numa página com **>2 filtros react-select E labels que compartilham prefixo** (ex.: `"Merchant"` e `"Merchant Ref Code"`). `starts-with(...,'Merchant')` casa AMBAS as labels. Para a label "errada" (ex.: "Merchant Ref Code", que é text input e NÃO tem `filter__control`), o ancestor walk sobe até o container raiz da filter row — que contém TODOS os `filter__control` — e retorna o PRIMEIRO controle do DOM (não o alvo). Sintoma silencioso: `getMerchantSelectedCount()` retorna sempre 0; `filterByMerchants()` abre o dropdown errado (o primeiro filtro da row).

**Caso canônico (2026-06-19, MCP em qa2 — MMH):** A Merchant Modification History tem 7 filtros na mesma container row (Log Type, Start/End Date, Merchant Ref Code, Merchant, Location, User Name). "Merchant Ref Code" aparece ANTES de "Merchant" no DOM. O ancestor walk a partir de "Merchant Ref Code" retornava Log Type (primeiro `filter__control` do container raiz).

```ts
// ❌ starts-with + ancestor walk — casa "Merchant" E "Merchant Ref Code";
//    para a label errada o walk sobe ao container raiz → retorna Log Type
`.//label[starts-with(normalize-space(.),'${label}')]` +
`/ancestor-or-self::*[.//*[contains(@class,'filter__control')]][1]//*[contains(@class,'filter__control')]`

// ✅ parent direto da label — cada label vive em um <div class="w-100"> que
//    contém EXATAMENTE o controle daquele filtro; escopo não-ambíguo mesmo
//    com prefixo compartilhado
`.//label[starts-with(normalize-space(.),'${label}')]/..//*[contains(@class,'filter__control')]`
```

**Como detectar:** o filtro "passa" mas a contagem de selecionados é sempre 0, OU o dropdown que abre é de outro filtro. Listar via `browser_evaluate` todas as labels da filter row → se duas compartilham prefixo (`startsWith`), o `controlByLabel` baseado em `starts-with` está comprometido. Fix: trocar o ancestor walk por `..` (parent direto da label). Ver [[application-lifecycle]] e [[page-object-pattern]] `MerchantLocationFilterPO`.

## Regra — input React-controlled (Formik): `fill()` é no-op silencioso, usar native-setter

Inputs cujo `value` é controlado pelo React/Formik (o componente reescreve o valor a cada render) **não** aceitam `page.fill()` — a chamada parece passar mas o React sobrescreve o valor no próximo render, e o `onChange` do app nunca dispara com o valor digitado. Sintoma: o filtro/campo aparenta estar preenchido por um instante mas a busca roda com o campo vazio (ou com o valor antigo), sem erro.

**Fix obrigatório:** setar via o **native value setter** do prototype + disparar os eventos sintéticos que o React escuta:

```ts
await page.evaluate(([sel, val]) => {
  const input = document.querySelector(sel) as HTMLInputElement | null;
  if (!input) return;
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype, 'value',
  )?.set;
  setter?.call(input, val);
  input.dispatchEvent(new Event('input',  { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  input.dispatchEvent(new Event('blur',   { bubbles: true }));
}, [selector, value] as const);
```

**Casos canônicos confirmados (DOM-first):**
- `SearchPage` quick-search `#search-input` (`forceReactInputValue` / `searchByType`).
- **`ModificationReportPage` (#1315, LIVE qa2 2026-06-18):** o painel de filtros expõe `input#agentName` (texto livre) e DUAS datas `input#from` / `input#to` (`MM/DD/YYYY`), **todas React-controlled**. `fill()` em qualquer uma é no-op; a busca roda sem filtro. `filterByAgentName` / `filterByDateRange` usam o native-setter via o `forceReactInputValue` privado do page object. Datas de calendário React (`input#from`/`input#to`) são o caso mais traiçoeiro — visualmente o valor "aparece", mas o range nunca é aplicado.

**Como detectar:** o teste filtra e a tabela volta com o set inteiro (filtro ignorado) ou vazia (valor antigo) — sem `TimeoutError`. Confirmar via `browser_evaluate` que o input tem um React fiber (`__reactProps$`/`__reactFiber$`) e que `value` reverte após `fill`. Ver [[page-object-pattern]] anti-pattern `page.fill on React-controlled inputs` + catálogo `ModificationReportPage` / `SearchPage`.

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

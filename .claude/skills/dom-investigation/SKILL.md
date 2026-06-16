---
name: dom-investigation
description: Carregue ao primeiro sinal de TimeoutError, locator not visible/found, ou strict mode violation. PROIBIDO aumentar timeout, adicionar retry ou force:true sem antes inspecionar DOM real via mcp__playwright__browser_* — viewport >=1440x900, snapshot, evaluate.
disable-model-invocation: true
---

# DOM Investigation Protocol — UOWN Leasing

> **Propósito:** quando um seletor falha (`TimeoutError`, `not visible`, `not found`, `strict mode violation`), inspecionar o DOM real do portal via **MCP Playwright** ANTES de propor fix. Heurística (aumentar timeout, adicionar retry, `force: true`, `waitForTimeout`) é PROIBIDA como primeiro recurso — mascara a causa real e perpetua tech-debt no page object.
>
> **Aplicável a:** `qa-debugger`, `qa-implementer`, `qa-implementer`, e análises diretas do Claude. **Não é opcional.**
>
> **Por que este arquivo existe:** em 2026-05-11, um teste falhou com `getByRole('menuitem', { name: 'Items Purchased' })` timeout. Hipótese inicial era timing/retry. Inspeção via MCP revelou que o dropdown pai "History" era `<a role="link">`, não `<button>`, e o page object procurava `getByRole('button', { name: /History/i })`. Selector errado, não timing. Aumentar timeout teria mascarado o bug por mais releases. Investigar o DOM real em 5 minutos resolveu definitivamente.

---

## Gatilhos (quando aplicar)

Aplique este protocolo SE o erro casa com QUALQUER um destes patterns:

- `TimeoutError: locator.waitFor` ou `locator.click` em elemento UI
- `Element is not visible` / `not attached` / `not enabled`
- `strict mode violation: locator resolved to N elements`
- `getByRole(...)` / `getByLabel(...)` / `getByText(...)` retornando 0 resultados
- Page object com fallback que cai em selector CSS (sinal de que o primário quebrou)
- Falha intermitente onde o elemento "aparece em algumas runs" (suspeita: responsive breakpoint, hidden ancestor)

NÃO aplique para:
- Erros de API (`response.status`, network)
- Erros de DB (query, schema mismatch)
- Erros de TypeScript (`tsc --noEmit`)

---

## Inputs obrigatórios (reúna ANTES de abrir MCP)

1. **URL exata do portal** (com env: origination-sandbox, svc-website-qa1, etc.)
2. **Identificador reproduzível** — `leadPk`, `accountPk`, ou `shortCode` que reproduz a tela do bug
3. **Credenciais** — leia do `.env`. Para Servicing: `DEFAULT_MANAGER_USERNAME`/`DEFAULT_MANAGER_PASSWORD` (o `superadmin` antigo NÃO existe mais em sandbox)
4. **Selector que falhou** — citação literal da linha do page object/test (ex: `src/pages/servicing/servicing-base.page.ts:75`)
5. **HTML esperado pelo selector** — se o user colou o HTML real do elemento na conversa, use isso como verdade

---

## Protocolo (passos obrigatórios, em ordem)

### Passo 0 — Carregar ferramentas MCP

As ferramentas Playwright MCP são **deferred**. Antes de chamar, carregue com `ToolSearch`:

```
select:mcp__playwright__browser_navigate,mcp__playwright__browser_snapshot,mcp__playwright__browser_click,mcp__playwright__browser_evaluate,mcp__playwright__browser_wait_for,mcp__playwright__browser_close,mcp__playwright__browser_fill_form,mcp__playwright__browser_resize,mcp__playwright__browser_console_messages
```

### Passo 1 — Navegar e autenticar

```
browser_navigate → URL alvo
(se redirecionou para /login)
 browser_snapshot → identificar campos de login
 browser_fill_form → preencher username/password do .env
 browser_click → LOG IN
```

### Passo 2 — Definir viewport por portal

Viewport depende do portal sob teste. Investigar no viewport errado gera diagnóstico errado.

| Portal | Viewports a inspecionar | Por quê |
|--------|------------------------|---------|
| Origination / Servicing / AMS (portais internos — agents) | `1440×900` (único) | Acessados por agents em desktop; Bootstrap `d-lg-block` (≥992px) cobre todos |
| Website (portal do customer — cliente final) | `375×667` → `768×1024` → `1440×900` (em sequência) | Fluxo do cliente é mobile-heavy (OTP, signing, application form em celular); bug que só aparece em 375px é regressão silenciosa se nunca inspecionamos lá |

```
browser_resize({ width: 1440, height: 900 }) // sempre o primeiro

// Para Website, depois do snapshot em 1440, repetir em:
browser_resize({ width: 768, height: 1024 }) // tablet
browser_resize({ width: 375, height: 667 }) // mobile
```

> **Por quê 1440×900 para portais internos:** Bootstrap usa `d-lg-block` (breakpoint ≥992px). Em viewports menores, elementos da navbar superior caem em hamburger menu (`display: none`). 1440x900 é o tamanho usado pela suíte real em local headed.
>
> **Por quê 3 viewports para Website:** OTP login, signing flow, customer portal navigation são acessados majoritariamente por mobile/tablet. Bug mobile-only em fluxo do cliente é regressão silenciosa quando só inspecionamos 1440. Investigação multi-viewport não duplica esforço — investiga uma vez com o viewport que o user real usa.
>
> **Quando não tem certeza qual portal:** se a URL contém `/customer-portal`, `/website-portal`, ou subdomain `customer.*`/`website.*` → tratar como Website. Quando em dúvida, inspecionar em 375 também (custo baixo, evita falso "nenhum bug").

### Passo 3 — Snapshot inicial

```
browser_snapshot → identificar refs (e123, e456) do elemento alvo
```

O snapshot YAML é melhor que screenshot — mostra `role`, `name`, `[active]`, `[expanded]`, `[disabled]`, hierarquia. Captura accessible tree, não pixels.

### Passo 4 — Inspeção forense do elemento

Use `browser_evaluate` para extrair tudo que o selector enxerga:

```js
 => {
 // Substitua o pattern conforme o elemento que está sendo procurado
 const candidates = Array.from(document.querySelectorAll('button, a, [role="button"], [role="link"], [role="menuitem"]'))
 .filter(el => /TEXTO_DO_ELEMENTO/i.test(el.textContent || ''));
 return candidates.map(el => ({
 tag: el.tagName, // <— BUTTON vs A
 role: el.getAttribute('role'), // <— null vs "button" vs "link"
 text: (el.textContent || '').trim.slice(0, 60),
 classes: el.className.toString.slice(0, 80),
 visible: el.offsetParent !== null,
 ariaExpanded: el.getAttribute('aria-expanded'),
 ariaHidden: el.getAttribute('aria-hidden'),
 rect: el.getBoundingClientRect,
 }));
}
```

Se `visible: false`, faça uma segunda evaluate para escalar a ancestor chain e achar quem está escondendo:

```js
 => {
 const el = /* mesmo seletor */;
 let parent = el.parentElement;
 const chain = [];
 while (parent && chain.length < 6) {
 const cs = getComputedStyle(parent);
 chain.push({
 tag: parent.tagName,
 classes: parent.className.toString.slice(0, 60),
 display: cs.display, // <— "none" = culpado
 visibility: cs.visibility,
 width: parent.offsetWidth,
 });
 parent = parent.parentElement;
 }
 return chain;
}
```

### Passo 5 — Tabela "DOM Real vs Selector Atual"

Antes de propor qualquer fix, **escreva esta tabela** no relatório/conversa:

| Atributo | O que o seletor espera | O que o DOM tem | Match? |
|----------|------------------------|------------------|--------|
| `tagName` | (ex: BUTTON) | (ex: A) | ❌ |
| `role` | (ex: button) | (ex: link / null) | ❌ |
| `accessible name` | "History" | "History" | ✅ |
| `visible` | true | false (ancestor `display:none`) | ❌ |
| `aria-expanded` | (n/a) | "false" | ⚠️ dropdown fechado |

Se ≥ 1 linha tem ❌, o selector está errado. Cite a linha do page object e proponha fix preciso.

### Passo 6 — Validar fix via MCP antes de editar

Antes de mexer no page object, **prove pelo MCP** que o selector novo funciona:

```
browser_click(target: <ref do snapshot>) → ação acontece
browser_snapshot → confirma estado pós-click (dropdown aberto, navegação, etc.)
```

### Passo 7 — Aplicar fix no código

Só agora editar `src/pages/{portal}/{file}.page.ts` ou `src/selectors/common.selectors.ts`. Inclua o resultado do passo 5 e 6 como justificativa no commit/PR description.

### Passo 8 — Fechar browser

```
browser_close
```

---

## Fallback chain (quando MCP não está disponível)

Se o portal não está acessível (CI sem rede, ambiente fora do ar, credenciais não disponíveis):

1. **Trace + screenshot** em `reports/test-results/{test}/` — leia `error-context.md`, abra `test-failed-1.png`, examine `trace.zip` via `npx playwright show-trace`
2. **HTML colado pelo usuário** — se o user copiou o outerHTML do elemento, use como verdade absoluta (passos 1–4 podem ser pulados, mas faça passo 5)
3. **Git blame no portal repo** — se aplicável e disponível em `.claude/context/app-repos.md`, ler o componente React/Angular para descobrir tag/role real
4. **NUNCA** ajustar timeout ou adicionar retry sem ter feito ao menos um destes 3

Se nenhum fallback é viável → marcar como `INVESTIGAR` no relatório e parar. **NÃO inventar fix.**

---

## Anti-patterns (PROIBIDOS)

- ❌ Aumentar timeout sem investigar DOM (`timeout: 30_000` "para garantir")
- ❌ Adicionar retry loop / `for (let attempt = 1; attempt <= 3; ...)` em page object
- ❌ Usar `force: true` para contornar `not clickable`
- ❌ Adicionar `page.waitForTimeout(N)` em qualquer lugar
- ❌ Trocar `getByRole` por XPath para "funcionar" sem entender por quê
- ❌ Marcar teste como `test.skip` ou `@flaky` sem ter rodado o protocolo
- ❌ Propor fix sem a tabela do passo 5

---

## Case study — 2026-05-11 (`unified-flow.spec.ts` "Items Purchased")

**Sintoma:** `TimeoutError: locator.waitFor` em `getByRole('menuitem', { name: 'Items Purchased' })` (5s).

**Hipótese inicial (errada):** timing/race condition no abrir-fechar do dropdown entre iterações.

**Passo 1–2 (MCP):** login em `svc-website-sandbox.uownleasing.com` com `manager`/`P@ssw0rdu0wn`. Viewport 1440x900 (a 906px o `d-lg-block` escondia a navbar).

**Passo 4 (evaluate):**

```json
[
 { "tag": "A", "text": "History", "role": null, "classes": "dropdown-toggle nav-link", "visible": true },
 { "tag": "BUTTON", "text": "Items Purchased", "role": "menuitem", "visible": false }
]
```

**Passo 5 (tabela):**

| Atributo | Selector espera | DOM tem | Match? |
|----------|-----------------|---------|--------|
| `tag` do trigger | BUTTON | A | ❌ |
| `role` do trigger | button | null (anchor) | ❌ |
| `getByRole('button', /History/i)` casa? | sim | não | ❌ |

**Causa raiz:** `servicing-base.page.ts:75` usava `getByRole('button', { name: /History/i })` mas portal renderiza `<a class="dropdown-toggle nav-link">`. `isVisible` retornava false → fallback `historyDropdown.click` clicava no `<li>` pai, que não disparava o handler React do `<a>` filho → dropdown nunca abria → menuitem nunca renderizava.

**Passo 6 (validar):** `getByRole('link', { name: /^History$/i }).click` → `aria-expanded="true"`, 9 menuitems visíveis. `getByRole('menuitem', { name: 'Items Purchased' }).click` → navegou para `/items-history/17127`. ✓

**Fix aplicado:**
```ts
// servicing-base.page.ts
readonly servicingDropdown = this.page.getByRole('link', { name: /^Servicing$/i }).first;
readonly historyDropdown = this.page.getByRole('link', { name: /^History$/i }).first;
// topMenuNavigateTo: removido try/fallback que mascarava o bug
```

Tempo total: ~10 minutos. Sem retry, sem heurística, sem `force: true`.

---

## Pitfall — MCP-live validation NÃO garante runtime pass

**Sintoma:** seletor funciona quando testado via `mcp__playwright__browser_evaluate` (retorna elementos, click flipa estado), mas falha com 0 matches em runtime do teste Playwright executado minutos ou horas depois, no mesmo ambiente.

**Caso canônico (, 6ª passada, 2026-05-22):** `[class*="customOptionStyles"]` retornou 2 elementos às 13:13 UTC via MCP. Runtime do teste às 14:18 UTC no mesmo qa1: `row.waitFor({ state: 'visible', timeout: 5_000 })` → timeout, 0 matches. A11y snapshot confirma que o combobox estava aberto e as opções visíveis — mas as classes DOM divergiram.

**Causas possíveis (em ordem de probabilidade):**
1. **FE build drift:** CSS-Module hashes e até prefixes mudam quando webpack reprocessa o bundle (redeploy, hot-reload em dev, bundle cache invalidation). O prefixo `customOptionStyles` pode virar `customOption`, `filterOption`, ou qualquer output dependente do module ID do webpack.
2. **React-select portal visibility:** opções montadas em portal (`menuPortalTarget={document.body}`) podem existir no a11y tree mas ser consideradas off-screen por Playwright (`state: 'visible'` exige que nenhum ancestor tenha `visibility:hidden` / `display:none` / `opacity:0`). MCP `browser_snapshot` reporta a11y tree, não computed visibility — pode mostrar opção "presente" quando Playwright a considera "não visível".
3. **Event-sequence timing:** MCP executa clicks com timing diferente do test runner. O menu pode fechar entre o passo de "abrir" e o passo de "clicar opção" quando driven via MCP vs. quando driven via `page.click` no contexto de teste.

**Fix / regra prática:**
- MCP-live validation = passo obrigatório (regra #15) mas NÃO suficiente por si só.
- Após validar via MCP, rodar o teste completo ≥ 2x antes de declarar o seletor estável.
- Para seletores que dependem de CSS-Module classes ou portals: preferir keyboard contract ou IDs framework-generated que são imunes a build drift e portal visibility. Ver [[application-lifecycle]] pitfall #47 e #50.

**Detecção:** se `browser_evaluate` retorna N > 0 mas o teste falha com 0 matches: suspeitar imediatamente de build drift (rodar `document.querySelectorAll('[class*="prefixOriginal"]').length` em tempo real no runtime do teste via `page.evaluate`) ou portal visibility (checar se o elemento tem `el.offsetParent !== null`). <!-- descoberto em 6ª passada, 2026-05-22 -->

---

## Pitfall — Headless reporta redirect; usuário reporta form (divergência de sessão/cache/cookies)

**Sintoma:** investigação headless via MCP ou `npx playwright test` reporta comportamento X (ex: redirect para find-a-merchant), mas o usuário confirma comportamento Y (ex: form renderiza normalmente) ao abrir em aba anônima do browser real.

**Causa raiz:** browser headless não carrega cookies/sessão/service-worker/cache do browser pessoal do usuário. Comportamentos dependentes de estado de sessão (ex: autenticação implícita, cookie de tenant, service-worker cache, CDN edge cache por IP/região) divergem entre headless limpo e browser real autenticado — especialmente em rotas de cliente que fazem redirect condicional.

**Fix / verificação obrigatória:** sempre que o comportamento depender de estado de sessão, cookies, ou cache de browser:
1. Confirmar em aba anônima (limpa, sem extensões, sem cookies) antes de classificar como comportamento esperado ou bug.
2. Se anônima + headless concordam mas diferem do browser normal do usuário → causa é sessão/cookie/cache do usuário, não bug de aplicação.
3. Se anônima + headless divergem → investigar state dependente (service-worker, CDN, ambiente de edge).

**Aplica-se a:** testes de redirect condicional, rotas com autenticação implícita, SPAs com service-worker. <!-- descoberto em , 2026-05-20 -->

---

## Saída obrigatória no relatório

Toda invocação que aplicou este protocolo DEVE incluir:

```markdown
## DOM Investigation (MCP Playwright)
- URL inspecionada: <url>
- Identificador reproduzível: <leadPk/accountPk/shortCode>
- Viewport: <width>x<height>
- Snapshot ref do elemento: <e123>

### DOM Real vs Selector
| Atributo | Selector espera | DOM tem | Match? |
|----------|-----------------|---------|--------|
| ... | ... | ... | ❌/✅ |

### Validação do fix via MCP
- Selector novo: `<código>`
- Resultado do click: <descrição>

### Fix aplicado
- File:line — descrição
```

Sem essa seção, o report está incompleto e o reviewer deve rejeitar.

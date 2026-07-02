---
operation: quick-search
description: Quick Search (typeahead da navbar) nos portais Origination e Servicing — busca por tipo (Lead #, Account #, Phone, Email, SSN, Invoice #, UUID, Name, Last 4 CC, Ref Account ID, Contract #), dedup por identidade, e a regressão FreeText createdTimestamp (svc#454 / R1.52.0).
last-reviewed: 2026-07-02
last-reviewed-sha: e4713f2
covers:
  - src/pages/search.page.ts
  - src/selectors/common.selectors.ts
  - docs/knowledge-base/search-page.md
  - docs/knowledge-base/servicing-search-quick-search.md
  - tests/e2e/origination/simple-search-ui.spec.ts
  - tests/e2e/origination/simple-search-bug1.spec.ts
  - tests/e2e/servicing/simple-search-svc-regression.spec.ts
---

# Oracle BDD — Quick Search (Busca Rápida da navbar)

> **Gatilho:** qualquer operação que exercite o campo Quick Search da navbar (typeahead por tipo) no portal Origination OU Servicing — selecionar `searchType` no dropdown, digitar um termo, ler o autocomplete — OU qualquer chamada a `/uown/los/simpleSearch/{term}` (Origination, POST) ou `/uown/svc/simpleSearch/{term}` (Servicing, GET), incluindo a rota FreeText (sem `searchType`). Rodar `simple-search-ui.spec.ts`, `simple-search-bug1.spec.ts` ou `simple-search-svc-regression.spec.ts` É executar esta operação (regra #19).
>
> **Verificação de obsolescência:**
> ```bash
> git log e4713f2..HEAD -- \
>   src/pages/search.page.ts \
>   src/selectors/common.selectors.ts \
>   docs/knowledge-base/search-page.md \
>   docs/knowledge-base/servicing-search-quick-search.md \
>   tests/e2e/origination/simple-search-ui.spec.ts \
>   tests/e2e/origination/simple-search-bug1.spec.ts \
>   tests/e2e/servicing/simple-search-svc-regression.spec.ts
> ```
> Sem output = oracle está atual. Com output → prefixar relatórios com `[BDD MAY BE STALE]` e revalidar os checkpoints contra o novo código.
>
> **Viewport:** Origination e Servicing são portais internos voltados para agentes. Obrigatório **1440×900** — o container do Quick Search é `<form class="d-none d-lg-block">` (Bootstrap ≥992px); abaixo disso o campo some do DOM (regra #15). Fonte: `simple-search-ui.spec.ts:28-33,46,219-221`; `search.page.ts:46-47,84-127`; `search-page.md:169-171` (BR-08 mobile: navbar quick search oculto).
>
> **Escopo — UM oracle, DOIS portais.** As três specs cobertas dirigem o MESMO page object (`SearchPage`, `src/pages/search.page.ts`) via `searchByType`/`getQuickSearchResults`/`expectNoDuplicateLeadPk`. É a MESMA feature (typeahead da navbar) parametrizada por portal, não duas features. As diferenças de backend são per-portal e estão isoladas nos cenários abaixo:
>
> | Aspecto | Origination (LOS) | Servicing (SVC) |
> |---|---|---|
> | Endpoint | `POST /uown/los/simpleSearch/{term}` | `GET /uown/svc/simpleSearch/{term}` |
> | Corpo | `{ merchantRefCodes: [...] }` (POST) | sem corpo (GET) |
> | `searchType` "Invoice #" | `InvoiceNum` | `InvoiceNumber` |
> | `searchType` "Lead #" | `Lead` | `LeadPk` |
> | Identidade da linha | `leadPk` | `accountPk` (extraído em `leadPk` a partir de `/customer-information/{accountPk}`) |
> | Tipos exclusivos | `UUID` | `RefAccountId`, `ContractNumber` |
> | Cobertura | qualquer lead LOS | **só** leads com `account_pk IS NOT NULL` (FUNDED) |
> | Resposta | wrapper `{ searchResults, count, moreResults }` (NÃO array plano) | idem wrapper |
>
> Fonte do mapeamento `searchType`: `search.page.ts:4-28` (comentário canônico) + `servicing-search-quick-search.md:92-107`.
>
> **Log de atividade (regra #13):** N/A — `simpleSearch` é endpoint read-only, sem mutação de negócio. Declarado explicitamente em `simple-search-ui.spec.ts:27`, `simple-search-bug1.spec.ts:28`, `simple-search-svc-regression.spec.ts:22`. Nenhum `uown_los_lead_notes` é gravado por uma busca — a exceção read-only da regra #13 se aplica.
>
> **Test data (regra #9 — Exception):** as três specs reutilizam massa qa1 pré-existente resolvida em runtime via DB (`resolveHappyLeadFixture`, `resolveSvcHappyLead`, `resolveFreeTextFixture`), NÃO via PK hardcoded. Justificativa registrada: reproduzir o índice de alto volume exigiria criar milhares de leads em qa1. Ver `simple-search-ui.spec.ts:20-25,66-141`; `simple-search-svc-regression.spec.ts:157-233`.

---

## CT-01 — [Origination] Busca por Lead # retorna o lead alvo com campos obrigatórios

```gherkin
Dado que o agente está autenticado no portal Origination com viewport 1440×900
E existe um lead FUNDED conhecido (fixture resolvida em runtime pelo DB)
Quando o agente seleciona o tipo "Lead #" no dropdown do Quick Search e digita o número do lead
Então o autocomplete renderiza ao menos uma linha
E a linha do lead alvo aparece com o leadPk correto
E o payload do backend traz esse lead com leadPk, nome do cliente e createdTimestamp não-nulos
E nenhuma linha do autocomplete repete o mesmo leadPk
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| `searchType` acionado | `Lead` (query-string `?searchType=Lead`) | `simple-search-ui.spec.ts:237` |
| Autocomplete renderiza | `getQuickSearchResults().length >= 1` | `simple-search-ui.spec.ts:241-242` |
| Lead alvo presente na UI | `rows.map(r=>r.leadPk)` contém `HAPPY.leadPk` | `simple-search-ui.spec.ts:244-245` |
| Payload backend não-vazio | `searchResults.length >= 1` (wrapper, NÃO array plano) | `simple-search-ui.spec.ts:247`; parser `172-181` |
| Campos obrigatórios ByLead | `leadPk`, `customerName ?? firstName`, `createdTimestamp` todos truthy | `simple-search-ui.spec.ts:250-254` |
| Sem leadPk duplicado | `expectNoDuplicateLeadPk(rows).duplicate === null` | `simple-search-ui.spec.ts:256-257` |

---

## CT-02 — [Origination] Busca por Servicing Account # (searchType=AccountPk) retorna a conta

```gherkin
Dado que o agente está no Quick Search do Origination
Quando o agente seleciona "Servicing Account #" e digita o accountPk do lead alvo
Então o payload do backend contém o accountPk pesquisado
E o autocomplete traz o leadPk correspondente
E nenhuma linha repete o mesmo leadPk
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| `searchType` acionado | `AccountPk` | `simple-search-ui.spec.ts:265` |
| accountPk no payload | `body.map(r=>String(r.accountPk))` contém `String(HAPPY.accountPk)` | `simple-search-ui.spec.ts:272-275` |
| leadPk correspondente na UI | `rows.map(r=>r.leadPk)` contém `HAPPY.leadPk` | `simple-search-ui.spec.ts:277-278` |
| Sem duplicata | `duplicate === null` | `simple-search-ui.spec.ts:280-281` |

---

## CT-03 — [Origination] Busca por atributo de identidade retorna o lead alvo (Phone, Email, SSN, Invoice #)

Classe de equivalência: "buscar por um atributo único do cliente traz o lead alvo". Cada `searchType` aciona a SQL especializada correta e o lead alvo aparece.

```gherkin
Dado que o agente está no Quick Search do Origination com um lead FUNDED conhecido
Quando o agente seleciona o <tipo> e digita o <valor> do lead alvo
Então o autocomplete renderiza ao menos uma linha
E o lead alvo aparece (ou, para Email compartilhado, ao menos um resultado é retornado)
E o payload do backend é não-vazio
E nenhuma linha repete o mesmo leadPk

Exemplos:
  | tipo        | valor              | searchType   | fonte (linhas)        |
  | Phone       | telefone MOBILE    | Phone        | 284-304               |
  | Email       | email PRIMARY      | Email        | 306-354               |
  | SSN         | SSN sem traços     | SSN          | 356-372               |
  | Invoice #   | merchant_invoice   | InvoiceNum   | 374-392               |
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Phone → `searchType=Phone`, lead alvo presente | `rows` contém `HAPPY.leadPk`; `body.length >= 1`; sem duplicata | `simple-search-ui.spec.ts:290,297-303` |
| Phone ausente na fixture | CT pulado (`test.skip`) — Phone exige valor não-nulo | `simple-search-ui.spec.ts:285` |
| Email → `searchType=Email` | `rows.length >= 1`; se lead alvo não estiver no top-N (email compartilhado com leads mais novos), basta retornar resultados | `simple-search-ui.spec.ts:319,332-343` |
| SSN → `searchType=SSN`, lead alvo presente | `rows` contém `HAPPY.leadPk`; `body.length >= 1` | `simple-search-ui.spec.ts:360,366-369` |
| Invoice # → `searchType=InvoiceNum`, lead alvo presente | `rows` contém `HAPPY.leadPk`; `body.length >= 1` | `simple-search-ui.spec.ts:378,385-388` |
| Sem duplicata (todos) | `duplicate === null` | `simple-search-ui.spec.ts:300-301,352-353,370-371,390-391` |

---

## CT-04 — [Origination] Busca por UUID retorna no máximo 1 leadPk distinto

```gherkin
Dado que o agente está no Quick Search do Origination
Quando o agente limpa o campo, seleciona "UUID" e digita o UUID do lead alvo
Então o autocomplete renderiza ao menos uma linha com o lead alvo
E o payload do backend contém o lead alvo (casado por uuid ou leadPk)
E o número de leadPk distintos no payload é no máximo 1 (UUID é identificador único)
E nenhuma linha do autocomplete repete o mesmo leadPk
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| `searchType` acionado | `UUID` | `simple-search-ui.spec.ts:401` |
| Lead alvo na UI | `rows` contém `HAPPY.leadPk` | `simple-search-ui.spec.ts:408-409` |
| Lead alvo no payload | `body.find(r => r.uuid===HAPPY.uuid || r.leadPk===HAPPY.leadPk)` truthy | `simple-search-ui.spec.ts:411-413` |
| Unicidade do UUID | `new Set(body.map(r=>r.leadPk)).size <= 1` | `simple-search-ui.spec.ts:414-420` |
| Sem duplicata | `duplicate === null` | `simple-search-ui.spec.ts:422-423` |

---

## CT-05 — [Origination] Busca por Name deduplica por leadPk

```gherkin
Dado que o agente está no Quick Search do Origination
Quando o agente seleciona "Name" e digita o nome completo do lead alvo
Então o autocomplete renderiza ao menos uma linha com o lead alvo
E o payload do backend é não-vazio
E nenhum leadPk aparece em mais de uma linha do autocomplete
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| `searchType` acionado | `Name` | `simple-search-ui.spec.ts:430` |
| Lead alvo na UI | `rows` contém `HAPPY.leadPk` | `simple-search-ui.spec.ts:437-438` |
| Payload não-vazio | `body.length >= 1` | `simple-search-ui.spec.ts:440` |
| Dedup por leadPk | `expectNoDuplicateLeadPk(rows).duplicate === null` (contagem no erro) | `simple-search-ui.spec.ts:442-446` |

---

## CT-06 — [Origination] Busca por Last 4 CC colapsa lead multi-cartão em 1 linha (gold case dedup)

```gherkin
Dado que existe um lead com múltiplos cartões compartilhando o mesmo last4 (fixture DEDUP resolvida em runtime)
E o agente está no Quick Search do Origination
Quando o agente seleciona "Last 4 CC" e digita os 4 últimos dígitos
Então o autocomplete renderiza ao menos uma linha
E o lead multi-cartão aparece no máximo 1 vez no payload (colapso das N linhas de cartão em 1)
E nenhuma linha do autocomplete repete o mesmo leadPk
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| `searchType` acionado | `last4CC` (camelCase, NÃO `Last4CC`) | `simple-search-ui.spec.ts:454` |
| Autocomplete renderiza | `rows.length >= 1`; lead HAPPY presente | `simple-search-ui.spec.ts:457-460` |
| Colapso multi-cartão | `body.filter(r => r.leadPk===DEDUP.leadPk).length <= 1` (lead com N>1 cartões → 1 linha) | `simple-search-ui.spec.ts:462-466` |
| Sem duplicata no autocomplete | `duplicate === null` | `simple-search-ui.spec.ts:468-472` |

> Invariante transversal (todas as CT Origination): o wrapper de resposta é `{ searchResults, count, moreResults }` — NÃO um array plano. Um parser que assuma array plano produz `body=[]` silenciosamente e faz cada CT falhar. Fonte: `simple-search-ui.spec.ts:172-181` (source-tag: qa-debugger live MCP fetch @ qa1 2026-05-24, DRIFT-PRONE).

---

## CT-BUG-1 — [Origination · regressão] FreeText deve popular createdTimestamp (alias rowCreatedTime → createdTimestamp)

Guarda de regressão para o bug corrigido no svc#454 R1.52.0: a SQL `GETLOSSEARCH_FREETEXT.sql` emitia o alias legado `rowCreatedTime`, deixando `createdTimestamp` nulo no payload FreeText. O fix renomeia o alias. Este CT falha PRÉ-fix (createdTimestamp nulo) e passa PÓS-fix.

```gherkin
Dado que o agente está autenticado no shell logado do Origination (cookie BFF merchant.sid materializado)
E existe um lead FUNDED cujo nome completo serve de termo FreeText
Quando o simpleSearch é chamado SEM parâmetro searchType (rota FreeText pré-detectada para input alfanumérico)
Então a resposta é HTTP 200
E o corpo é o wrapper { searchResults, count, moreResults } (não um array plano)
E ao menos um resultado é retornado para o termo
E o createdTimestamp do lead alvo NÃO é nulo
E o createdTimestamp é uma string ISO
```

### Oracle

| Checkpoint | Esperado | Fonte | Classificação |
|---|---|---|---|
| Rota FreeText | `POST /uown/los/simpleSearch/{term}?pageNumber=1&maxResults=20` SEM `searchType`; corpo `{ merchantRefCodes: ['*'] }` | `simple-search-bug1.spec.ts:101-121` | [confirmed] |
| Auth via BFF | `credentials:'include'` a partir do contexto da página logada (o header apiAuthorization sozinho → `401 {unauthorized:true}` pelo `MerchantCodeAspect`) | `simple-search-bug1.spec.ts:9-20,95,103-121` | [confirmed] |
| Status HTTP | `200` | `simple-search-bug1.spec.ts:123` | [confirmed] |
| Formato wrapper | `Array.isArray(body.searchResults) === true` (NÃO array plano) | `simple-search-bug1.spec.ts:125-129` | [confirmed] |
| Resultados não-vazios | `searchResults.length >= 1` | `simple-search-bug1.spec.ts:131-132` | [confirmed] |
| **createdTimestamp populado** | `target.createdTimestamp` **não** nulo | `simple-search-bug1.spec.ts:139-142` | [confirmed] — guarda do bug corrigido |
| Tipo do createdTimestamp | `typeof target.createdTimestamp === 'string'` (ISO) | `simple-search-bug1.spec.ts:143-146` | [confirmed] |

> Regra #10 (classificação conservadora): trata-se de guarda de regressão para bug JÁ CORRIGIDO no MR do svc#454, não de bug ativo. Se este checkpoint falhar em uma execução, primeiro confirmar se `GETLOSSEARCH_FREETEXT.sql` (fora deste repo) foi revertido para o alias `rowCreatedTime` antes de classificar como `[BUG]` novo — pode ser regressão de backend real OU obsolescência do próprio contrato.

---

## CT-07 — [Servicing] Busca por Lead # / Phone / Email / SSN / Name resolve a conta (identidade = accountPk)

Regressão cross-cutting: o MR !1370 do svc#454 NÃO tocou o backend SVC. Esta suíte garante que o lado Servicing não regrediu quando o LOS foi refatorado de 1 SQL → 10 SQLs. Diferenças-chave vs Origination: método **GET**, resposta identifica a linha por **accountPk** (extraído no campo `leadPk` a partir de `/customer-information/{accountPk}`), e só leads com `account_pk IS NOT NULL` aparecem.

```gherkin
Dado que o agente está autenticado no portal Servicing (qa1) com viewport 1440×900
E existe um lead FUNDED com account_pk não-nulo (fixture SVC resolvida em runtime)
Quando o agente seleciona o <tipo> e digita o <valor> do lead alvo
Então o autocomplete renderiza ao menos uma linha
E o accountPk alvo aparece nos resultados (extraído no campo leadPk)
E nenhuma linha repete o mesmo identificador

Exemplos:
  | tipo                | valor            | searchType (SVC) | fonte (linhas) |
  | Lead #              | leadPk           | LeadPk           | 325-356        |
  | Servicing Account # | accountPk        | AccountPk        | 358-376        |
  | Phone               | telefone MOBILE  | Phone            | 378-406        |
  | Email               | email PRIMARY    | Email            | 408-436        |
  | SSN                 | SSN              | SSN              | 438-465        |
  | Name                | nome completo    | Name             | 507-535        |
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Endpoint SVC | `GET /uown/svc/simpleSearch/{term}?...searchType=<tipo>` (método GET, sem corpo) | `simple-search-svc-regression.spec.ts:104-113` |
| Lead # → `LeadPk`, conta na UI | `rows.map(r=>r.leadPk)` contém `Number(KAREN.accountPk)` (SVC devolve accountPk) | `simple-search-svc-regression.spec.ts:331,344-348` |
| Account # → `AccountPk` | `body.map(r=>String(r.accountPk))` contém `String(KAREN.accountPk)` | `simple-search-svc-regression.spec.ts:363,371-373` |
| Phone/Email/SSN → conta alvo | `resultPks` contém `Number(KAREN.accountPk)`; CT pulado se atributo nulo na fixture | `simple-search-svc-regression.spec.ts:379,385,395-399 / 409,415,425-429 / 439,445,455-458` |
| Name → dedup | `rows` traz a conta; `expectNoDuplicateLeadPk(rows).duplicate === null` | `simple-search-svc-regression.spec.ts:512,522-534` |
| Sem duplicata (todos) | `duplicate === null` | `simple-search-svc-regression.spec.ts:354-355,374-375,404-405,434-435,463-464` |
| Parser wrapper SVC | resposta é `{ searchResults, ... }`, NÃO array plano | `simple-search-svc-regression.spec.ts:124-129` |

> **Precondição SVC (pitfall F-10):** Karen Holdin (lead 11319) tem `account_pk IS NULL` em qa1 (SIGNED mas nunca funded) e NÃO qualifica como happy lead no SVC — a busca SVC consulta `uown_sv_account`, então só leads com `account_pk` válido aparecem. Fixture cai para lead FUNDED com CC (fallback `Testfndb Testlndb` leadPk=11339, account_pk=4524). Fonte: `simple-search-svc-regression.spec.ts:45-61,136-233`. Categoria DRIFT-PRONE — pareamento leadPk↔accountPk muda no reseed qa1.

---

## CT-08 — [Servicing · pitfall crítico] Invoice # usa searchType=InvoiceNumber (NÃO InvoiceNum)

Diferença de contrato entre portais: Origination envia `InvoiceNum`, Servicing envia `InvoiceNumber`. O page object passa o LABEL "Invoice #" e o BFF resolve o parâmetro correto por portal — esta CT asserta que o Servicing emite o parâmetro Servicing-style.

```gherkin
Dado que o agente está no Quick Search do Servicing com um lead FUNDED que possui invoice
Quando o agente seleciona "Invoice #" e digita o número da invoice
Então a chamada ao simpleSearch usa searchType=InvoiceNumber (e NÃO InvoiceNum)
E o autocomplete renderiza ao menos uma linha
E o accountPk alvo aparece nos resultados
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Parâmetro emitido | URL contém `searchType=InvoiceNumber` (NÃO `InvoiceNum`) | `simple-search-svc-regression.spec.ts:474,481-492` |
| Autocomplete renderiza | `rows.length >= 1` | `simple-search-svc-regression.spec.ts:494-497` |
| Conta alvo presente | `resultPks` contém `Number(KAREN.accountPk)` | `simple-search-svc-regression.spec.ts:498-501` |
| CT pulado se sem invoice | `test.skip(!KAREN.invoice)` | `simple-search-svc-regression.spec.ts:468` |

---

## CT-09 — [Servicing] Last 4 CC deduplica por identidade

```gherkin
Dado que o agente está no Quick Search do Servicing
Quando o agente seleciona "Last 4 CC" e digita os 4 últimos dígitos
Então a chamada usa searchType=last4CC (camelCase, não Last4CC)
E o autocomplete renderiza ao menos uma linha
E nenhum identificador aparece em mais de uma linha
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Parâmetro emitido | `searchType=last4CC` (camelCase — F-12) | `simple-search-svc-regression.spec.ts:544` |
| Autocomplete renderiza | `rows.length >= 1`; ao menos 1 leadPk (last4 `2225` compartilhado entre leads em qa1 → asserta qualquer conta, não Karen específica) | `simple-search-svc-regression.spec.ts:550-561` |
| Dedup | `expectNoDuplicateLeadPk(rows).duplicate === null` | `simple-search-svc-regression.spec.ts:566-567` |

---

## CT-10 — [Servicing · exclusivo] Ref Account ID e Contract # resolvem a conta (tipos só-Servicing)

`RefAccountId` e `ContractNumber` só existem no Quick Search do Servicing (não há equivalente no Origination). Ambos pulam quando o dado não existe na fixture.

```gherkin
Dado que o agente está no Quick Search do Servicing com uma conta que possui ref_account_id e contract_number
Quando o agente seleciona o <tipo exclusivo> e digita o <valor>
Então o autocomplete renderiza ao menos uma linha
E o accountPk alvo aparece nos resultados
E nenhuma linha repete o mesmo identificador

Exemplos:
  | tipo exclusivo   | valor          | searchType (SVC) | fonte (linhas) |
  | Ref Account ID   | ref_account_id | RefAccountId     | 570-594        |
  | Contract #       | contract_number| ContractNumber   | 596-628        |
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Ref Account ID → `RefAccountId` | `body.map(r=>String(r.accountPk))` contém `String(KAREN.accountPk)`; pulado se `ref_account_id` nulo | `simple-search-svc-regression.spec.ts:571-573,580,589-590` |
| Contract # → `ContractNumber` | `resultPks` contém `Number(KAREN.accountPk)`; pulado se `contract_number` nulo | `simple-search-svc-regression.spec.ts:597-599,608,617-621` |
| Sem duplicata (ambos) | `duplicate === null` | `simple-search-svc-regression.spec.ts:592-593,626-627` |
| Restrição de ambiente | suíte SVC só roda em qa1 (`KAREN_STATIC` tem valores qa1-específicos) — pulada em outros envs | `simple-search-svc-regression.spec.ts:303-304,317` |

---

## Pré-condições

- **Autenticação:** agente logado. Origination: indicador de login é o texto **"Merchant Login"** no header qa1 (NÃO "Origination Login") — `simple-search-ui.spec.ts:224-226`. Servicing: **"Servicing Login"** — `simple-search-svc-regression.spec.ts:320`.
- **Viewport 1440×900** obrigatório antes de cada CT (`d-lg-block`).
- **`ensureSearchVisible()`** garante o campo renderizado; se o portal caiu para a shell de login (sessão em memória perdida), o page object lança erro preciso de sessão em vez de mascarar como falha de seletor — `search.page.ts:84-127`.
- **Merchant preflight (regra #12): PULADO** — operação read-only sobre dados existentes, nenhuma application criada nem config de merchant mutada. `simple-search-ui.spec.ts:31-33`.
- **Ambiente:** specs UI de Origination e a suíte SVC foram escritas contra **qa1** (deploy MR !1370). A spec BUG-1 é env-agnóstica (usa `ENV=` do `.env`/CLI). Não portar para sandbox/qa2 sem re-seed dos leads.

## Log de Atividade (Regra #13)

**N/A por design.** `simpleSearch` é read-only — nenhuma ação de negócio, nenhum registro em `uown_los_lead_notes`. As três specs declaram isso explicitamente (`simple-search-ui.spec.ts:27`; `simple-search-bug1.spec.ts:28`; `simple-search-svc-regression.spec.ts:22`). A exceção read-only da regra #13 se aplica: uma busca não gera log e não deve ser marcada `[INCOMPLETE]` por falta dele.

## Gaps / HYPOTHESIS

- **[gap]** Formato canônico de `Contract #` e `Invoice #` no Quick Search do Servicing não verificado (prefixo? numérico puro?) — herdado de `servicing-search-quick-search.md:469-470,478` (gaps 3 e 4). As CTs SVC-UI-06/SVC-UI-10 apenas resolvem o valor via DB e verificam o roundtrip, sem afirmar o formato.
- **[gap]** Origination `UUID` não tem CT equivalente no Servicing (a spec SVC não cobre UUID); não confirmado se o Quick Search do Servicing expõe `UUID`. O dropdown SVC documentado lista 10 tipos SEM `UUID` (`servicing-search-quick-search.md:92-107`) — coerente com a ausência na spec.
- **[HYPOTHESIS]** O `searchType=Lead` (Origination) vs `LeadPk` (Servicing) e `InvoiceNum` vs `InvoiceNumber` são as ÚNICAS divergências de nomenclatura de parâmetro entre portais confirmadas em código. Os demais tipos (`AccountPk`, `Phone`, `Email`, `SSN`, `Name`, `last4CC`) usam a mesma string nos dois portais — confirmado nas specs, mas não há inventário exaustivo do BFF garantindo que nenhum outro tipo divirja.
- **[OBSERVATION]** A tabela de resultados da Search Page (busca avançada, distinta do Quick Search) expõe SSN sem máscara (`search-page.md:132,260`; `servicing-search-quick-search.md:251,380`). Isso é da Search Page, NÃO deste oracle (Quick Search) — flagged como candidato a revisão de segurança em separado, fora do escopo destas specs.

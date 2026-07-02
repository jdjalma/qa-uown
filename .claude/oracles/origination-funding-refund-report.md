---
operation: origination-funding-refund-report
description: Proxy UI-first (regra #14) do conteúdo dos daily funding/funded/refund report sweeps — Funding Queue (/funding, Origination) filtrada por Status, validando que as linhas do grid + o Download CSV batem com o oracle de DB uown_funding_transaction.funding_queue_status (CT-07 FUNDING / CT-08 FUNDED / CT-09 REQUEST_REFUND).
last-reviewed: 2026-07-02
last-reviewed-sha: e4713f2
covers:
  - tests/e2e/origination/funding-refund-report-content-ui-origination.spec.ts
  - src/pages/origination/funding.page.ts
  - src/pages/origination/filtered-csv-download.controls.ts
  - src/helpers/downloads.helpers.ts
  - docs/business-rules/08-funding-merchants.md
  - docs/business-rules/appendix-d-constantes-enums.md
  - docs/knowledge-base/origination-funding-queue-page.md
  - docs/knowledge-base/multi-select-filters-mmh-modreport-funding.md
---

# Origination — Funding/Refund Report Content (proxy UI da Funding Queue `/funding`)

> **Gatilho:** qualquer operação que abra a **Funding Queue** (`/funding`, Origination), filtre o grid por um valor de **Status** (Funding / Funded / Request Refund / Refunded), leia a coluna **Status** das linhas ou exporte o **Download CSV** do grid filtrado — incluindo rodar `funding-refund-report-content-ui-origination.spec.ts` (regra #19: rodar o spec É executar a operação que ele exercita).
>
> **O que esta operação NÃO é.** O daily funding/funded/refund **report sweep** em si é admin/ops e não tem UI (é tarefa agendada). Este oracle contrata o **proxy UI-first** (regra #14): o DADO que o sweep reportaria tem superfície visível no grid da Funding Queue filtrado por status + `Download CSV`. O CSV do grid status-filtrado é a superfície de conteúdo observável mais barata, porque o report **não** passa por `uown_email_queue` (SPEC §Discovery OQ-03 + Achado-chave 3 · KB `multi-select-filters-mmh-modreport-funding.md` OQ-03). O mecanismo do sweep + a SQL de destinatários (CT-01..05) são API-only e vivem em `tests/e2e/servicing/funding-refund-report-content-sweeps-servicing.spec.ts` — **fora do escopo deste oracle**.
>
> **Rota:** `GET {originationUrl}funding` (portal Origination) · **Endpoint de busca:** `POST /uown/los/getLeadsForFundingQueue` (KB `multi-select-filters-mmh-modreport-funding.md` — confirmado via `browser_network_requests` qa2). · **Export:** `FilteredCsvDownloadControls` (Email CSV + Download CSV, mesmo `div.d-flex`; pitfall #118 — Email CSV vem ANTES no DOM, desambiguar por `:has-text('Download CSV')`).
>
> **Oracle de DB:** `SELECT COUNT(*) FROM uown_funding_transaction WHERE funding_queue_status = $1`, com `$1 ∈ {FUNDING, FUNDED, REQUEST_REFUND}` (enum `FundingQueueStatus` — `appendix-d-constantes-enums.md#d4`). REFUNDED (CT-10) **não** é coberto aqui: 0 linhas REFUNDED no sandbox (limitação de ambiente) — seu stub `test.fixme()` vive no arquivo de sweeps do servicing (spec:17-19).
>
> **Tolerância do oracle (crítico):** o oracle de DB conta **TODAS** as linhas do status; o grid/CSV pode aplicar uma janela de data / escopo diferente e é paginado. Por isso as asserções são de **DIREÇÃO** (o CSV é não-vazio quando o grid reporta linhas; todas as linhas visíveis carregam o status filtrado), **não** igualdade byte-a-byte contra o oracle de DB — igualdade rígida seria flaky contra uma população em movimento (FUNDING ~11.6k / FUNDED ~3.9k / REQUEST_REFUND ~83 por SPEC §DB) (spec:42-46).
>
> **Read-only (regra #9 / #12 / #13):** nenhuma application é criada, nenhuma mutação de DB é feita → **merchant preflight (regra #12) NÃO se aplica** (sem caminho de criação de lead); ler/reordenar um grid não é ação de negócio → **nenhum activity log é esperado** (regra #13, exceção read-only) (spec:36-40).
>
> **Base canônica:** SPEC `docs/taskTestingUown/dailyFundingRefundReportSweeps_contentValidation/` (CT-07..10) · `08-funding-merchants.md#9-funding-queue` · enum `appendix-d-constantes-enums.md#d4` · KB `origination-funding-queue-page.md` (colunas/filtros/bulk) + `multi-select-filters-mmh-modreport-funding.md` (multi-select, CSV, endpoint).
>
> **Verificação de obsolescência:**
> ```bash
> git log e4713f2..HEAD -- \
>   tests/e2e/origination/funding-refund-report-content-ui-origination.spec.ts \
>   src/pages/origination/funding.page.ts \
>   src/pages/origination/filtered-csv-download.controls.ts \
>   src/helpers/downloads.helpers.ts \
>   docs/business-rules/08-funding-merchants.md \
>   docs/business-rules/appendix-d-constantes-enums.md \
>   docs/knowledge-base/origination-funding-queue-page.md \
>   docs/knowledge-base/multi-select-filters-mmh-modreport-funding.md
> ```
> Saída vazia ⇒ oracle está atual. Qualquer commit ⇒ prefixar `[BDD MAY BE STALE — <file> changed since e4713f2]`.
>
> **Viewport:** Origination é portal interno voltado para agentes — **obrigatório 1440×900** (regra #15). A navbar/painel de filtros da Funding Queue usa Bootstrap `d-lg-block` (≥992px); abaixo disso o painel de filtros + grid não renderizam. O `beforeEach` força `setViewportSize({ width: 1440, height: 900 })` (spec:61, 78-82).

## Critérios de Aceitação

| ID | Critério | Oracle |
|---|---|---|
| AC-01 | Abrir `/funding` renderiza o grid + painel de filtros com o Status multi-select (Funding pré-selecionado por default); `waitForSpinner` resolve | CT-A |
| AC-02 | Filtrar por um único Status (`filterByStatuses([status])` + `applyFiltersMulti()`) refaz a busca via `POST /uown/los/getLeadsForFundingQueue` e o grid re-renderiza | CT-A |
| AC-03 | **Value-correctness:** toda linha visível do grid tem a coluna **Status** == status filtrado (comparação case/spacing-insensitive; aceita tanto o rótulo UI "Request Refund" quanto o enum "REQUEST_REFUND") | CT-A |
| AC-04 | O **Download CSV** do grid filtrado carrega um header com coluna **Status** (prova de que o conteúdo é o grid certo) | CT-B |
| AC-05 | A contagem de linhas de dados do CSV **reconcilia** com o total do rodapé do grid ("X-Y of N") quando o total está disponível (`CSV.dataRowCount === filteredTotal`) | CT-B |
| AC-06 | O CSV tem ≥ 1 linha de dados quando o grid está não-vazio; o oracle de DB `uown_funding_transaction.funding_queue_status` é a checagem de direção (não igualdade) | CT-B |
| AC-07 | **Boundary empty:** grid vazio é legítimo **somente** quando o oracle de DB também é 0 (AC5 clean-empty); grid vazio com DB > 0 é **[OBSERVAÇÃO]** (janela de data/escopo mais estreito), nunca hard-fail | CT-C |
| AC-08 | Download CSV desabilitado ⇒ só o grid vazio o justifica; **[OBSERVAÇÃO]** se desabilitado com oracle > 0. CSV exportado com `dataRowCount > oracleCount` ⇒ **[OBSERVAÇÃO]** (possível double-count / mapeamento de status), nunca hard-fail. Arquivo CSV é apagado após leitura (higiene de PII) | CT-C |

## Cenários

```gherkin
Feature: Funding Queue — conteúdo do report por Status (proxy UI dos funding/refund sweeps)
  Como agente de funding na Origination
  Para conferir o conteúdo que o daily funding/funded/refund report reportaria
  O agente filtra a Funding Queue por Status e exporta o CSV do grid filtrado

  Background:
    Dado que o agente está autenticado no portal Origination com viewport 1440×900
    E a Funding Queue "/funding" está acessível com seu painel de filtros e grid

  Scenario Outline: [positive] Grid filtrado por Status mostra apenas aquele status e o CSV reconcilia com o rodapé
    Dado que o oracle de DB conta as linhas de "uown_funding_transaction" com funding_queue_status = "<oracleValue>"
    E o agente está na Funding Queue com o grid carregado
    Quando o agente filtra o grid pelo Status "<uiStatus>" e aplica os filtros
    Então toda linha visível do grid exibe o Status "<uiStatus>" (nenhuma linha de outro status aparece)
    E o header do Download CSV inclui uma coluna "Status"
    E a contagem de linhas de dados do CSV é maior que zero
    E a contagem de linhas de dados do CSV é igual ao total do rodapé "X-Y of N" do grid quando esse total está disponível

    Examples:
      | ct    | uiStatus       | oracleValue    |
      | CT-07 | Funding        | FUNDING        |
      | CT-08 | Funded         | FUNDED         |
      | CT-09 | Request Refund | REQUEST_REFUND |

  Scenario: [boundary] Grid vazio é legítimo apenas quando o oracle de DB também é zero
    Dado que o agente filtrou por um Status cujo oracle de DB retorna 0 linhas
    Quando o grid não exibe nenhuma linha
    Então o resultado é aceito como conteúdo vazio limpo (AC5 clean-empty)
    E nenhuma linha fantasma é reconciliada
    E nenhum toast de erro é exibido

  Scenario: [boundary] Grid vazio com DB não-zero é registrado como observação, não como falha
    Dado que o agente filtrou por um Status cujo oracle de DB retorna N > 0 linhas
    Quando o grid não exibe nenhuma linha para aquele status
    Então a divergência é registrada como observação indicando que o grid pode aplicar uma janela de data/escopo mais estreita que a contagem crua do status
    E o teste não falha de forma rígida

  Scenario: [negative] Download CSV desabilitado é observação apenas quando o grid está vazio
    Dado que o agente aplicou um filtro de Status que resultou em grid vazio
    Quando o botão Download CSV está desabilitado
    Então a impossibilidade de reconciliar o conteúdo do CSV é registrada como observação com o valor do oracle de DB
    E o teste não falha de forma rígida

  Scenario: [boundary] CSV que excede o oracle de DB é registrado como observação
    Dado que o oracle de DB para o status filtrado retorna N > 0 linhas
    Quando a contagem de linhas de dados do CSV exportado é maior que N
    Então a divergência é registrada como observação indicando possível double-count do grid ou mapeamento de status a verificar
    E o teste não falha de forma rígida (população volátil)
```

## Tabela de checkpoints — CT-A: grid filtrado carrega apenas o status pedido

_(por status: CT-07 FUNDING · CT-08 FUNDED · CT-09 REQUEST_REFUND — spec:64-72, 84-108)_

| Checkpoint | Esperado | Como validar | Fonte |
|---|---|---|---|
| Oracle de DB por status | `oracleCount = COUNT(*) uown_funding_transaction WHERE funding_queue_status=$1` | `db.getSingleNumber(...)` com `$1` = oracleValue; logar o valor | spec:91-98 |
| Navegação para a Funding Queue | rota `{originationUrl}funding` carrega; spinner resolve | `page.goto(..., waitUntil:'domcontentloaded')` + `funding.waitForSpinner()` | spec:100-103 |
| Filtro de Status aplicado | grid re-busca via `POST /uown/los/getLeadsForFundingQueue` | `funding.filterByStatuses([uiStatus])` + `funding.applyFiltersMulti()` | spec:105-108 · KB endpoint |
| **Value-correctness das linhas** | toda célula da coluna Status == status filtrado (normalizado `[_\s]+→' '`, lowercase; aceita `uiStatus` OU `oracleValue`) → `mismatched` vazio | `funding.getStatusColumnValues()`; `expect(mismatched).toEqual([])` | spec:110-142 |
| Grid vazio + oracle 0 (boundary) | aceito como AC5 clean-empty; anota `[OBSERVAÇÃO]`, sem hard-fail | `statuses.length===0 && oracleCount===0` → `return` | spec:112-123 |
| Grid vazio + oracle > 0 (boundary) | `[OBSERVAÇÃO]` "grid pode aplicar janela/escopo mais estreito"; sem hard-fail | `statuses.length===0 && oracleCount>0` → anota + `return` | spec:124-133 |

## Tabela de checkpoints — CT-B: Download CSV reconcilia com o grid

| Checkpoint | Esperado | Como validar | Fonte |
|---|---|---|---|
| Header do CSV com coluna Status | `parsed.headers` contém algum header casando `/status/i` | `expect(hasStatusHeader).toBe(true)` | spec:167-172 |
| CSV não-vazio | `parsed.dataRowCount > 0` quando o grid reporta linhas | `expect(parsed.dataRowCount).toBeGreaterThan(0)` | spec:183-186 |
| Reconciliação CSV × rodapé do grid | `parsed.dataRowCount === filteredTotal` quando `filteredTotal != null` (total do rodapé "X-Y of N") | `funding.getTotalCsvRowCount()` + `expect(...).toBe(filteredTotal)` | spec:159, 188-194 |
| Download + higiene de PII | CSV salvo em disco, parseado, e **deletado** no `finally` | `funding.downloadCsv()` → `saveDownload` → `parseCsv` → `deleteDownloadedFile(savedPath)` | spec:159-209 |

## Tabela de checkpoints — CT-C: fronteiras e observações (nunca hard-fail)

| Checkpoint | Esperado | Como validar | Fonte |
|---|---|---|---|
| Download CSV desabilitado | só grid vazio o justifica; anota `[OBSERVAÇÃO]` com `oracle=<n>`; sem hard-fail | `funding.isDownloadCsvEnabled()===false` → anota + `return` (checa a classe CSS `disabledButton`, não o attr `disabled`) | spec:144-157 |
| CSV excede o oracle de DB | `dataRowCount > oracleCount` (com `oracleCount>0`) → `[OBSERVAÇÃO]` "possível double-count / mapeamento de status"; sem hard-fail | anotação `test.info().annotations` | spec:198-206 |
| Oracle de DB como upper-bound tolerante | o oracle conta TODAS as linhas do status; grid pode janelar por data → divergência é observação, jamais falha rígida | asserções de direção, não igualdade contra o oracle | spec:42-46, 195-206 |

## Notas de execução

- **Qual página isto realmente é (confirmado via spec):** é a **Funding Queue** (`/funding`, Origination) — NÃO uma "Refund Report" separada. A palavra "Refund" no nome do arquivo vem do daily **refund report sweep**, cujo conteúdo tem como proxy o grid da Funding Queue filtrado por `Request Refund` / `Refunded`. As asserções de navegação do spec (`env.originationUrl + 'funding'`, spec:101) e o page object `FundingPage` confirmam a página. Os docs canônicos `funding-queue` (08-funding-merchants + appendix-d + KB funding-queue) casam; nenhuma página "Refund Report" autônoma existe no escopo deste spec.
- **Page object reusado (regra #2):** `FundingPage` (`filterByStatuses` / `applyFiltersMulti` / `getStatusColumnValues` / `downloadCsv` / `getTotalCsvRowCount` / `isDownloadCsvEnabled` / `waitForSpinner`). Deliberadamente **NÃO** usa `MerchantLocationFilterPO` — a Funding Queue tem DOM customizado (labels em `div` + IDs react-select estáveis); aplicar o PO de label-XPath lá dá timeout (page-object-pattern §5b pitfall) (spec:28-34).
- **CSV desambiguação (pitfall #118):** o botão Download CSV tem prefixo CSS-module que drifta entre builds; `FilteredCsvDownloadControls` é hardened para isso (selector-hardening). Email CSV vem **antes** de Download CSV no DOM — nunca casar `.csvButton` cru; usar `:has-text('Download CSV')` (KB `multi-select-filters-mmh-modreport-funding.md` §CSV Export) (spec:31-34, 144-157).
- **`isDownloadCsvEnabled` checa a CLASSE CSS `disabledButton`, não o attr HTML `disabled`** — o botão é desabilitado visualmente via classe antes de filtros aplicados (`csvButton__disabledButton__UNKH3`), não pelo atributo nativo (spec:146-147 · KB §CSV Export).
- **Status multi-select — "Funding" pré-selecionado por default** ao carregar a página (KB BR-03); ao filtrar por um único status, `filterByStatuses` deve limpar a seleção default antes de aplicar o alvo. Os 4 valores (Funding / Funded / Request Refund / Refunded) são checkboxes independentes; Request Refund e Refunded são distintos mesmo ambos mapeando `LeadStatus.OTHER` (KB BR-04 · appendix-d#d4).
- **Location independente do Merchant na Funding Queue** (KB BR-02) — divergente de MMH/ModReport (pitfall #121). Não aplicável a este spec (não filtra por Merchant/Location), mas relevante se o escopo expandir.
- **REFUNDED (CT-10) fora de escopo:** 0 linhas REFUNDED no sandbox (limitação de ambiente). O stub `test.fixme()` vive no arquivo de sweeps do servicing (`funding-refund-report-content-sweeps-servicing.spec.ts`) — não neste oracle (spec:17-19).
- **Por que o arquivo está em `tests/e2e/origination/` e não no servicing:** a Funding Queue é tela de Origination e exige `.auth/origination.json` + projeto `origination-ui`. Um spec em `tests/e2e/servicing/` roda no projeto `servicing-ui` (storageState/baseURL do servicing) e não dirige o portal Origination — split forçado pela regra de portal-split (`.claude/rules/testing.md`) (spec:21-26).
- **Env:** sandbox primário; qa2 aceitável como proxy UI (multi-select da Funding Queue confirmado deployado em qa2, KB `multi-select-filters-mmh-modreport-funding.md` OQ-01). Roda no projeto `origination-ui`, timeout 180s (spec:47-52, 86).
- **Classificação conservadora (regra #10):** toda divergência população-relacionada (grid vazio com DB>0, CSV excede oracle, CSV desabilitado) é `[OBSERVAÇÃO]`, não `[BUG]` — a população de funding é volátil e o grid pode janelar por data. Só um mismatch de **status por linha** (linha de status errado no grid filtrado) é hard-fail (`expect(mismatched).toEqual([])`).
- **[HYPOTHESIS] — endpoint de busca:** `POST /uown/los/getLeadsForFundingQueue` vem da KB (`browser_network_requests` qa2 2026-06-18), **não** capturado neste spec (o spec não intercepta rede; só valida grid + CSV + DB). Se um checkpoint exigir asserção sobre o request body (array vs escalar), fazer discovery com `browser_network_requests` ao vivo — gap G3 da KB.
- **[HYPOTHESIS] — contagens de população** (FUNDING ~11.6k / FUNDED ~3.9k / REQUEST_REFUND ~83) vêm do §DB da SPEC de origem; são voláteis e servem só como ordem de grandeza para escolher a tolerância de direção, não como valores a assertar.

## Gaps / a investigar

- **G1 (do spec):** o rodapé "X-Y of N" (`getTotalCsvRowCount`) pode retornar `null` — nesses casos a reconciliação AC-05 é pulada e só AC-06 (CSV não-vazio) roda. Confirmar em que condições o rodapé some (grid vazio? sem paginação?).
- **G2:** request body de `getLeadsForFundingQueue` — array vs escalar para o Status multi-select — não capturado (KB G3). Reservado para discovery com `browser_network_requests`.
- **G3:** CT-10 REFUNDED — sem dados no sandbox; validar em qa2/stg com lead levado a REFUNDED (`FUNDED → REQUEST_REFUND → REFUNDED`, refund via portal PayTomorrow) antes de remover o `test.fixme()`.
- **G4:** se o grid aplica janela de data por default (que explicaria "grid vazio com DB>0") — a natureza exata do escopo/janela do grid vs a contagem crua do oracle não está confirmada (é a origem das observações tolerantes).

---
last-reviewed: 2026-07-01
last-reviewed-sha: cd2d2c8
covers:
  - src/pages/origination/merchant-mod-history.page.ts
  - src/pages/origination/merchant-location-filter.po.ts
  - src/helpers/merchant-location-report.helper.ts
  - src/selectors/common.selectors.ts
  - docs/knowledge-base/multi-select-filters-mmh-modreport-funding.md
---

# Origination — Merchant Modification History (`/merchantModificationHistory`)

> Contrato de leitura/filtragem do **Merchant Modification History (MMH)** da Origination. É um **log de auditoria read-only** de toda mudança em dados de merchant/programa (activity log de merchant), com atribuição do usuário que executou a ação. A busca desta operação é **por Merchant + janela de datas**.
>
> **Rota:** `GET {originationUrl}/merchantModificationHistory` · **Endpoint de busca:** `POST /uown/getMerchantDataChangeResults` · **Log types (on-mount):** `GET /uown/getLogTypes`.
>
> **Filtros (7, na mesma linha do container):** Log Type (single-select) · Start Date · End Date · Merchant Ref Code (texto) · Merchant (select — multi-select `filter__value-container--is-multi` em qa2 #1319; single-select em algumas versões) · Location (select, **desabilitado até um Merchant ser selecionado** — pitfall #121) · User Name (texto).
>
> **Colunas (7):** `Date | Merchant Ref Code | Merchant Name | Location Name | Username | Log Type | Notes`.
>
> **Corpo da requisição:** `{ from, to (MM/DD/YYYY → formato API `YYYY-MM-DD`), pageNumber, maxResults, merchantRefCode, userName, logType? }` + o par merchant/location. **Deployado (multi-select #1319, stg/qa2):** `merchantNames: string[]`, `locationNames: string[]`. **Source single-select (R1.53.0):** `merchantName: string`, `locationName: string`. Resposta `{ items, totalCount, moreResults }`; `status !== 200` ⇒ `showToast('error', message)`.
>
> **Base canônica:** app-source `origination/pages/merchantModificationHistory/index.tsx` + `utils/merchant-modification-history-config` + `utils/data-table-columns` + `server.js` (endpoint map) · KB `multi-select-filters-mmh-modreport-funding.md` (#1319) · pitfall #121 (Location dependente de Merchant em MMH/ModReport, divergente de Funding).

## Critérios de Aceitação

| ID | Critério | Oracle |
|---|---|---|
| AC-01 | Abrir `/merchantModificationHistory` renderiza o painel de filtros (7 filtros) e a tabela (ou empty-state); `GET /uown/getLogTypes` popula o Log Type e uma busca inicial `POST /uown/getMerchantDataChangeResults` roda | CT-01 |
| AC-02 | Selecionar um Merchant + Start/End Date e clicar Search dispara `POST /uown/getMerchantDataChangeResults` **200**; o body carrega `merchantName` + `from`/`to` no formato API | CT-02 |
| AC-03 | Toda linha retornada tem a coluna **Merchant Name** == merchant selecionado (value-correctness, não só presença) | CT-03 |
| AC-04 | A coluna **Date** de cada linha cai dentro de `[startDate, endDate]` | CT-04 |
| AC-05 | Toda linha expõe as 7 colunas do contrato (Date, Merchant Ref Code, Merchant Name, Location Name, Username, Log Type, Notes) | CT-05 |
| AC-06 | Merchant + janela sem registros exibe o empty-state "There are no records to display" (sem linha fantasma, sem toast de erro) | CT-06 |
| AC-07 | O filtro **Location** fica desabilitado até um Merchant ser selecionado (pitfall #121) — divergente do Funding Queue | CT-07 |
| AC-08 | Datas em `MM/DD/YYYY`; End Date tem `min` = Start Date e Start Date tem `max` = End Date; resposta não-200 dispara toast de erro | CT-08 |

## Cenários

```gherkin
Feature: Merchant Modification History — search by merchant and date range
  Read-only audit log of merchant/program data changes in Origination.

  Background:
    Given the agent is authenticated in the Origination portal
    And the Merchant Modification History filter panel is reachable

  Scenario: CT-01 — Opening the page renders filters and table
    When the agent navigates to "/merchantModificationHistory"
    Then the filter panel with Log Type, Start Date, End Date, Merchant Ref Code, Merchant, Location and User Name is shown
    And "GET /uown/getLogTypes" populates the Log Type options
    And an initial "POST /uown/getMerchantDataChangeResults" runs and the table area renders (rows or empty-state)

  Scenario: CT-02 — Searching by merchant and date range fires getMerchantDataChangeResults
    Given the agent expands the filter panel
    When the agent selects a Merchant
    And enters Start Date and End Date in MM/DD/YYYY format
    And clicks Search
    Then the request "POST /uown/getMerchantDataChangeResults" returns HTTP 200
    And the request body carries the selected merchantName and the from/to dates in API format

  Scenario: CT-03 — Every returned row belongs to the selected merchant
    When the merchant + date search returns at least one row
    Then the "Merchant Name" column of every row equals the selected merchant
    And no row from a different merchant is shown

  Scenario: CT-04 — Every returned row falls within the date window
    When the merchant + date search returns at least one row
    Then the "Date" column of every row falls within [startDate, endDate]

  Scenario: CT-05 — Each row exposes the 7-column contract
    When the search returns at least one row
    Then each row exposes the columns: Date, Merchant Ref Code, Merchant Name, Location Name, Username, Log Type, Notes

  Scenario: [negative] CT-06 — Merchant + window with no records shows empty-state
    Given a merchant and a date window with no modifications
    When the agent clicks Search
    Then the message "There are no records to display" is shown
    And no result row is rendered
    And no error toast is shown

  Scenario: CT-07 — Location filter is disabled until a Merchant is selected
    Given the filter panel is expanded with no Merchant selected
    Then the Location filter is disabled (filter__control--is-disabled)
    When the agent selects a Merchant
    Then the Location filter becomes enabled

  Scenario: [negative] CT-08 — Date bounds and error handling
    Then the date inputs use MM/DD/YYYY
    And the End Date min bound equals the chosen Start Date
    And the Start Date max bound equals the chosen End Date
    And a non-200 response from getMerchantDataChangeResults raises an error toast
```

## Tabela de checkpoints (validar após executar a operação)

| CT | Checkpoint | Como validar | Fonte |
|---|---|---|---|
| CT-01 | Rota `/merchantModificationHistory` renderiza filtros + tabela | snapshot DOM: painel de 7 filtros + `.rdt_Table` ou empty-state; `browser_network_requests` mostra `GET /uown/getLogTypes` + `POST /uown/getMerchantDataChangeResults` iniciais | `index.tsx` (useEffect mount) |
| CT-02 | Search dispara `POST /uown/getMerchantDataChangeResults` **200** com merchant + datas | `browser_network_requests` captura a chamada, status e request body (`merchantName`, `from`, `to`) | `server.js` endpoint map · `index.tsx onSubmit` |
| CT-03 | Coluna `Merchant Name` de toda linha == merchant selecionado | ler a coluna via `getColumnValues`/DOM e comparar com o merchant filtrado | `data-table-columns.merchantModificationHistory` |
| CT-04 | Coluna `Date` de toda linha ∈ `[start, end]` | inspecionar a coluna `Date` (formato `f:'user'` withTime) vs janela | `data-table-columns` (rowCreatedTimestamp) |
| CT-05 | 7 colunas do contrato presentes | headers normalizados == `Date, Merchant Ref Code, Merchant Name, Location Name, Username, Log Type, Notes` | `data-table-columns.merchantModificationHistory` |
| CT-06 | Empty-state "There are no records to display" quando janela vazia | `EMPTY_STATE` visível, `getVisibleRowCount()` = 0, sem toast de erro | helper `merchant-location-report.helper.ts` |
| CT-07 | Location desabilitado até Merchant selecionado | `filter__control--is-disabled` no Location antes de escolher Merchant; some após selecionar | pitfall #121 · config `isDisabled: !merchantName` |
| CT-08 | Datas `MM/DD/YYYY`, bounds cruzados, erro→toast | placeholder/atributos `min`/`max` dos inputs de data; toast em `status !== 200` | config `getModificationHistoryConfig` · `index.tsx` |

## Notas de execução

- **Merchant single vs multi-select:** o componente é **multi-select** em qa2 (#1319, `filter__value-container--is-multi`), mas o app-source R1.53.0 lido mostra `type: 'select'` single para `merchantName`. Divergência de versão/env — **validar o DOM real ao vivo** e reportar qual variante o ambiente expõe (não assumir). Page object `MerchantModHistoryPage` suporta ambos: `filterByMerchant` (single, deprecated) e `filterByMerchants` (multi #1319).
- **Validação ao vivo (stg 2026-07-01, `origination-stg`, user `jmndes.gow`):** os 8 CTs PASS. stg deploya a variante **multi-select** — controle Merchant `is-multi`, Location `is-multi` e `is-disabled` até selecionar Merchant; body enviou `merchantNames:["Paramount Jewelers, Inc."]` + `locationNames:[]` + `from:"2025-01-01"`/`to:"2026-07-01"`. Busca `Paramount Jewelers, Inc.` (KS10150) + janela 01/01/2025–07/01/2026 ⇒ 200, `totalCount:39`, 10 linhas renderizadas, todas com Merchant Name == merchant e Date dentro da janela; 7 colunas exatas. Janela vazia (01/01/2020–01/02/2020) ⇒ 200 + empty-state, sem toast de erro.
- **Location depende de Merchant** (pitfall #121 / BR-01): `filter__control--is-disabled` até ≥1 Merchant selecionado — em MMH e ModReport, mas NÃO no Funding Queue (lá Location é independente). Não copiar a premissa do Funding.
- **Datas `MM/DD/YYYY`** (DOM-confirmado). Inputs são React-controlled (Formik) — `page.fill()` pode dar no-op; usar setter nativo + eventos `input`/`change`/`blur`. Ao dirigir via MCP, digitar via `browser_evaluate` do mesmo modo.
- **Read-only:** a **busca** não cria/edita/apaga nada — nenhuma mutação de estado é esperada. (A página TEM um botão "Add Note" — Ticket1116 — que é operação separada e fora do escopo desta busca.)
- **Export:** MMH tem **Download CSV** (`merchant-modification-report.csv`, `maxResults = totalRows`); ao contrário do ModReport, **não** tem "Email CSV" (exploratory O-012).
- **Log Type** é single-select mesmo pós-#1319; opções vêm de `GET /uown/getLogTypes`.
- **Staleness:** rodar antes de cada execução:
  ```bash
  git log cd2d2c8..HEAD -- \
    src/pages/origination/merchant-mod-history.page.ts \
    src/pages/origination/merchant-location-filter.po.ts \
    src/helpers/merchant-location-report.helper.ts \
    src/selectors/common.selectors.ts \
    docs/knowledge-base/multi-select-filters-mmh-modreport-funding.md
  ```
  Saída vazia ⇒ BDD atual. Qualquer commit ⇒ prefixar `[BDD MAY BE STALE — <file> changed since cd2d2c8]`.

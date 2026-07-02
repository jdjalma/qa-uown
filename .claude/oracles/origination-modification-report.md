---
last-reviewed: 2026-07-01
last-reviewed-sha: cd2d2c8
covers:
  - src/pages/origination/modification-report.page.ts
  - src/helpers/merchant-location-report.helper.ts
  - src/selectors/common.selectors.ts
  - docs/business-rules/07-modificacoes-conta.md
  - docs/knowledge-base/modification-report-agent-name-bug.md
  - docs/knowledge-base/multi-select-filters-mmh-modreport-funding.md
---

# Origination — Modification Report (`/modificationReport`)

> Contrato de leitura/filtragem do **Modification Report** da Origination. É um **log de auditoria read-only** de toda mudança em um lead (status, valor de aprovação, lease-mod), com atribuição do agente que executou a ação.
>
> **Rota:** `GET {originationUrl}/modificationReport` · **Endpoint de busca:** `POST /uown/los/getModifiedLeads` · **Tabela:** `uown_lead_modifications`.
>
> Filtros: Merchant (multi-select), Location (multi-select, dependente de Merchant), Modification Type (single-select: `LEAD_STATUS_CHANGE` | `APPROVAL_AMOUNT_CHANGE` | `LEASE_MOD`), Agent Name (texto livre, match parcial), Start Date / End Date (`MM/DD/YYYY`).
>
> Colunas: `Lead | Date | Modification Type | Merchant Name | Location Name | Old Status | New Status | Old Internal Status | New Internal Status | New Amount | Old Amount | Agent Name`.
>
> **Base canônica:** business-rule #72 (agent attribution) · KB `modification-report-agent-name-bug.md` (issue #1315) · KB `multi-select-filters-mmh-modreport-funding.md` (#1319).

## Critérios de Aceitação

| ID | Critério | Oracle |
|---|---|---|
| AC-01 | Abrir `/modificationReport` renderiza a página de relatório com o painel de filtros e a tabela (ou empty-state) | CT-01 |
| AC-02 | Aplicar Start Date / End Date e clicar Search dispara `POST /uown/los/getModifiedLeads` **200** e a tabela reflete apenas registros dentro da janela | CT-02 |
| AC-03 | Janela de datas sem modificações exibe o empty-state "There are no records to display" (sem linhas fantasma, sem erro) | CT-03 |
| AC-04 | Toda linha retornada expõe as 12 colunas do contrato; a coluna `Date` de cada registro cai dentro de `[startDate, endDate]` | CT-04 |
| AC-05 | Coluna **Agent Name** reflete o `agent_username` de `uown_lead_modifications`: username real do agente humano OU `SYSTEM` apenas para ações backend (webhook/sweep) — BR #72 | CT-05 |
| AC-06 | Datas devem ser `MM/DD/YYYY` (placeholder confirmado no DOM); formato divergente não filtra corretamente | CT-06 |

## Cenários

```gherkin
Feature: Modification Report — leitura e filtragem por janela de datas
  Read-only audit log de mudanças em leads na Origination.

  Background:
    Given o agente está autenticado no portal Origination
    And o painel de filtros do Modification Report está acessível

  Scenario: CT-01 — Abrir o relatório renderiza filtros e tabela
    When o agente navega para "/modificationReport"
    Then o painel de filtros (Merchant, Location, Modification Type, Agent Name, Start/End Date) é exibido
    And a área da tabela renderiza (linhas de resultado ou o empty-state)

  Scenario: CT-02 — Buscar por janela de datas dispara getModifiedLeads e filtra
    Given o agente expande o painel de filtros
    When o agente informa Start Date e End Date no formato MM/DD/YYYY
    And clica em Search
    Then a requisição "POST /uown/los/getModifiedLeads" retorna HTTP 200
    And a tabela renderiza apenas registros cuja coluna Date está dentro da janela informada

  Scenario: [negative] CT-03 — Janela sem registros mostra empty-state
    Given uma janela de datas sem nenhuma modificação
    When o agente clica em Search
    Then a mensagem "There are no records to display" é exibida
    And nenhuma linha de resultado é renderizada
    And nenhum erro de aplicação é exibido

  Scenario: CT-04 — Cada linha expõe o contrato de 12 colunas e respeita a janela
    When a busca por janela de datas retorna ao menos uma linha
    Then cada linha expõe as colunas: Lead, Date, Modification Type, Merchant Name, Location Name, Old Status, New Status, Old Internal Status, New Internal Status, New Amount, Old Amount, Agent Name
    And a coluna Date de cada linha cai dentro de [startDate, endDate]

  Scenario: CT-05 — Agent Name reflete a atribuição correta (BR #72)
    When a busca retorna linhas de LEAD_STATUS_CHANGE
    Then ações disparadas por um agente humano no portal exibem o username real (ex.: jmendes.gow)
    And apenas ações de backend sem sessão humana (webhook GowSign/SignWell CONTRACT_CREATED→SIGNED, SIGNED→SIGNED re-sign, sweeps) exibem "SYSTEM"

  Scenario: [negative] CT-06 — Formato de data inválido não filtra
    Given o agente informa uma data fora de MM/DD/YYYY
    When clica em Search
    Then o filtro não é aplicado como esperado (o campo espera MM/DD/YYYY, placeholder DOM-confirmado)
```

## Tabela de checkpoints (validar após executar a operação)

| CT | Checkpoint | Como validar | Fonte |
|---|---|---|---|
| CT-01 | Rota `/modificationReport` renderiza filtros + tabela | snapshot DOM: painel de filtros + `.rdt_Table` ou empty-state visível | page object `navigateToModificationReport` |
| CT-02 | Search dispara `POST /uown/los/getModifiedLeads` **200** | `browser_network_requests` captura a chamada e status | KB agent-name-bug (endpoint) |
| CT-02 | Resultado respeita a janela de datas | inspecionar coluna `Date` das linhas vs `[start,end]` | business-rule #72 / colunas |
| CT-03 | Empty-state "There are no records to display" quando janela vazia | `EMPTY_STATE` visível, `getAllRows()` = `[]` | page object `EMPTY_STATE` |
| CT-04 | 12 colunas do contrato presentes | headers normalizados == lista canônica | page object `getAllRows` doc |
| CT-05 | `Agent Name` = username real (humano) OU `SYSTEM` (só backend) | coluna Agent Name; cruzar com `uown_lead_modifications.agent_username` se DB acessível | BR #72 / KB #1315 |
| CT-06 | Datas em `MM/DD/YYYY` | placeholder do input `#from`/`#to` | page object `filterByDateRange` |

## Notas de execução

- **Datas `MM/DD/YYYY`** (DOM-confirmado, qa2 2026-06-18). "Ontem/hoje" ⇒ traduzir para esse formato antes de digitar.
- Inputs de data/agent são **React-controlled (Formik)** — `page.fill()` faz no-op; usar o setter nativo + eventos `input`/`change`/`blur` (`forceReactInputValue` no page object). Ao dirigir via MCP, digitar via `evaluate`/`browser_evaluate` do mesmo modo, não só `type`.
- **Location depende de Merchant** (fica `filter__control--is-disabled` até um Merchant ser selecionado) — não aplicável a uma busca só por datas, mas relevante se o filtro Merchant/Location entrar.
- Merchant/Location são **multi-select** (`filter__value-container--is-multi`), **sem "Select All"** no Merchant.
- **Read-only:** o relatório não cria/edita/apaga nada — nenhuma mutação de estado é esperada nem permitida pela operação. Export via "Email CSV".
- **Staleness:** rodar antes de cada execução:
  ```bash
  git log cd2d2c8..HEAD -- \
    src/pages/origination/modification-report.page.ts \
    src/helpers/merchant-location-report.helper.ts \
    src/selectors/common.selectors.ts \
    docs/business-rules/07-modificacoes-conta.md \
    docs/knowledge-base/modification-report-agent-name-bug.md \
    docs/knowledge-base/multi-select-filters-mmh-modreport-funding.md
  ```
  Saída vazia ⇒ BDD atual. Qualquer commit ⇒ prefixar `[BDD MAY BE STALE — <file> changed since cd2d2c8]`.

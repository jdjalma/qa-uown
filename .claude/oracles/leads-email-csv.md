---
last-reviewed: 2026-06-28
last-reviewed-sha: cd2d2c8bfd07cf5275f605c259a88838168e6a09
covers:
  - src/pages/origination/leads.page.ts
  - src/pages/origination/filtered-csv-download.controls.ts
  - src/selectors/common.selectors.ts
---

# Email CSV de Leads — Portal de Originação (`/leads`)

> Operação **agent-facing**: após realizar uma busca em `/leads` que retorna resultados, o agente clica em **Email CSV** para abrir o modal de envio, informa um endereço de e-mail e clica em **Send**. O oracle valida: (a) o modal abre com título correto; (b) o botão Send permanece desabilitado enquanto o campo está vazio e se habilita após o preenchimento; (c) ao clicar Send o modal fecha.
>
> **Fonte canônica:** `docs/knowledge-base/overview-leads-csv-export-size-limit.md` — comportamento do Email CSV (BR-04, §Available Operations, §Email CSV modal), pitfall #118 (Email CSV vem PRIMEIRO no DOM).
>
> **Distinção de escopo:** este oracle cobre exclusivamente o **Email CSV** (fluxo assíncrono). Download CSV direto (`leads-results.csv`) não está coberto aqui — ver `leads-download.md`.

## Análise de impacto

| Regra | Fonte |
|---|---|
| Email CSV sempre renderizado; desabilitado apenas quando a tabela está vazia — NÃO gateado por permissão nem pelo limite de 48 MiB | BR-04 / KB §Available Operations |
| Pitfall #118: Email CSV vem PRIMEIRO no DOM; o botão Download CSV é disambiguado por `:has-text('Download CSV')` | KB §Automation traps |
| Modal: título "Which email should we send this CSV file to?", campo Email (placeholder `Enter your email...`), botões CANCEL e Send | KB §Email CSV modal `[confirmed]` |
| Send desabilitado enquanto campo de email está vazio; habilitado após preenchimento | KB §Email CSV modal |
| Após clicar Send: modal fecha; toast de sucesso exibe **"You should receive an email shortly."** | KB §Email CSV modal (gap G2 resolvido em 2026-06-28) |
| Button desabilitado via CSS class `disabledButton` + `pointer-events: none`, NÃO via atributo HTML `disabled` — `.isEnabled()` sempre true; verificar classe CSS | `filtered-csv-download.controls.ts:isEmailCsvEnabled()` |

## Critérios de Aceitação

| ID | Critério | Oracle |
|---|---|---|
| AC-01 | Email CSV visível e habilitado após busca com resultados | CT-01 |
| AC-02 | Clicar em Email CSV abre o modal com título "Which email should we send this CSV file to?" | CT-02 |
| AC-03 | O botão Send está desabilitado enquanto o campo Email está vazio | CT-03 |
| AC-04 | Após preencher um endereço de e-mail válido, o botão Send se habilita | CT-04 |
| AC-05 | Clicar em Send fecha o modal (e-mail enviado de forma assíncrona) | CT-05 |
| AC-06 | Clicar em CANCEL fecha o modal sem enviar | CT-06 |
| AC-07 | Email CSV desabilitado quando a tabela está vazia | CT-07 |

## Cenários

```gherkin
Feature: Email CSV de Leads — Portal de Originação
  As an internal agent
  In order to receber a lista de leads filtrados por e-mail quando o volume é grande
  The agent must abrir o modal de Email CSV, informar um endereço e enviar

  Background:
    Given o agente está autenticado no Portal de Originação
    And o agente está na página de Leads (/leads)
    And o painel de filtros está expandido

  Scenario: [positivo] CT-01 — Email CSV visível e habilitado após busca com resultados
    Given o campo From está preenchido com uma data passada
    And a busca retorna ao menos um lead
    When o agente visualiza os botões de export após clicar em Search
    Then o botão Email CSV está visível
    And o botão Email CSV está habilitado (CSS class disabledButton ausente)

  Scenario: [positivo] CT-02 — Modal abre com título correto
    Given o botão Email CSV está habilitado após uma busca com resultados
    When o agente clica em Email CSV
    Then o modal de email abre
    And o título do modal é "Which email should we send this CSV file to?"
    And o campo Email está vazio (placeholder "Enter your email..." visível)

  Scenario: [positivo] CT-03 — Send desabilitado com campo vazio
    Given o modal de Email CSV está aberto
    And o campo Email está vazio
    When o agente visualiza o botão Send
    Then o botão Send está desabilitado

  Scenario: [positivo] CT-04 — Send habilitado após preencher e-mail
    Given o modal de Email CSV está aberto
    And o campo Email está vazio
    When o agente preenche o campo Email com um endereço válido
    Then o botão Send se habilita

  Scenario: [positivo] CT-05 — Clicar Send fecha o modal
    Given o modal de Email CSV está aberto
    And o campo Email está preenchido com um endereço válido
    And o botão Send está habilitado
    When o agente clica em Send
    Then o modal fecha
    And o agente retorna à página de Leads com os resultados da busca preservados

  Scenario: [positivo] CT-06 — Clicar CANCEL fecha o modal sem enviar
    Given o modal de Email CSV está aberto
    When o agente clica em CANCEL
    Then o modal fecha sem enviar o e-mail

  Scenario: [negativo] CT-07 — Email CSV desabilitado quando tabela vazia
    Given a busca retorna zero resultados ("There are no records to display")
    When o agente visualiza os botões de export
    Then o botão Email CSV está visível
    And o botão Email CSV está desabilitado (CSS class disabledButton presente)
```

## Oracles

> **Verificação de desatualização (executar antes de qualquer Oracle):**
> `git log cd2d2c8bfd07cf5275f605c259a88838168e6a09..HEAD -- src/pages/origination/leads.page.ts src/pages/origination/filtered-csv-download.controls.ts src/selectors/common.selectors.ts`
> Saída não vazia → prefixar o relatório com `[BDD MAY BE STALE]`.

### Oracle: CT-01 — Email CSV visível e habilitado

| Checkpoint | Valor esperado | Como verificar |
|---|---|---|
| Botão Email CSV visível | `SELECTORS.csvEmailButton` visível | `isEmailCsvVisible()` → `true` |
| Botão Email CSV habilitado | CSS class `disabledButton` ausente | `isEmailCsvEnabled()` → `true` |

### Oracle: CT-02 — Modal abre com título correto

| Checkpoint | Valor esperado | Como verificar |
|---|---|---|
| Modal visível | `SELECTORS.csvEmailModal` presente e visível | `emailCsvModalTitle()` retorna não-null |
| Título do modal | `"Which email should we send this CSV file to?"` | `emailCsvModalTitle()` == valor esperado |
| Campo Email presente | `SELECTORS.csvEmailModalInput` visível | Snapshot do DOM no modal |

### Oracle: CT-03 — Send desabilitado com campo vazio

| Checkpoint | Valor esperado | Como verificar |
|---|---|---|
| Campo Email vazio | Input sem valor preenchido | `browser_evaluate` ou inspeção do campo |
| Send desabilitado | `send.isEnabled()` → `false` | `isEmailCsvSendEnabled()` → `false` |

### Oracle: CT-04 — Send habilitado após preencher e-mail

| Checkpoint | Valor esperado | Como verificar |
|---|---|---|
| Campo Email preenchido | Input com o endereço digitado | Inspeção do campo após `fillEmailCsvAddress()` |
| Send habilitado | `send.isEnabled()` → `true` | `isEmailCsvSendEnabled()` → `true` |

### Oracle: CT-05 — Send fecha o modal

| Checkpoint | Valor esperado | Como verificar |
|---|---|---|
| Modal fecha após Send | `SELECTORS.csvEmailModal` oculto | `sendEmailCsv()` aguarda `state: 'hidden'` — se não timeout → PASS |
| Página de Leads intacta | Tabela de resultados ainda visível após fechar modal | Contagem de linhas `rdt_TableRow` ≥ 1 |
| Toast de sucesso | **"You should receive an email shortly."** (gap G2 resolvido 2026-06-28) | Toast visível após fechar o modal |

### Oracle: CT-06 — CANCEL fecha o modal

| Checkpoint | Valor esperado | Como verificar |
|---|---|---|
| Modal fecha após CANCEL | `SELECTORS.csvEmailModal` oculto | `cancelEmailCsvModal()` aguarda `state: 'hidden'` — PASS |
| Nenhum e-mail enviado | Nenhuma requisição de envio disparada | Aba de rede: nenhuma chamada de send após CANCEL |

### Oracle: CT-07 — Email CSV desabilitado com tabela vazia

| Checkpoint | Valor esperado | Como verificar |
|---|---|---|
| Tabela sem resultados | "There are no records to display" visível | Contagem `rdt_TableRow` = 0 |
| Email CSV visível | `SELECTORS.csvEmailButton` presente | `isEmailCsvVisible()` → `true` |
| Email CSV desabilitado | CSS class `disabledButton` presente | `isEmailCsvEnabled()` → `false` |

## Matriz de cobertura

| Critério de Aceitação | Cenário(s) | Status |
|---|---|---|
| AC-01 — Email CSV visível e habilitado com resultados | CT-01: [positivo] | Coberto |
| AC-02 — Modal abre com título correto | CT-02: [positivo] | Coberto |
| AC-03 — Send desabilitado com campo vazio | CT-03: [positivo] | Coberto |
| AC-04 — Send habilitado após preencher e-mail | CT-04: [positivo] | Coberto |
| AC-05 — Send fecha o modal | CT-05: [positivo] | Coberto |
| AC-06 — CANCEL fecha o modal sem enviar | CT-06: [positivo] | Coberto |
| AC-07 — Email CSV desabilitado com tabela vazia | CT-07: [negativo] | Coberto |

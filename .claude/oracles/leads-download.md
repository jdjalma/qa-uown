---
last-reviewed: 2026-06-28
last-reviewed-sha: cd2d2c8bfd07cf5275f605c259a88838168e6a09
covers:
  - src/pages/origination/leads.page.ts
  - src/pages/origination/filtered-csv-download.controls.ts
  - src/selectors/common.selectors.ts
---

# Download de Lista de Leads — Portal de Originação (`/leads`)

> Operação **agent-facing**: após realizar uma busca em `/leads`, o agente clica em **Download CSV** para baixar o arquivo `leads-results.csv` com todos os registros filtrados. O oracle valida: (a) o número de linhas de dados no arquivo é igual ao total de registros da busca; (b) os registros do arquivo estão em conformidade com os critérios de busca utilizados.
>
> **Fonte canônica:** `docs/knowledge-base/overview-leads-csv-export-size-limit.md` — threshold 48 MiB, colunas, filename, permission gate, BR-01..BR-05.
>
> **Distinção de escopo:** este oracle cobre exclusivamente o **Download CSV direto** (`leads-results.csv`). Email CSV (fluxo assíncrono) não está coberto aqui.

## Análise de impacto

| Regra | Fonte |
|---|---|
| Filename: `leads-results.csv` | KB §Overview vs Leads |
| 17 colunas: Lead Number, Account Number, Lead Status, Internal Status, State, Term Month, Customer Name, Invoice Number, SSN, Phone Number, Email, Merchant, Location, Ref Merchant Code, Client Type, Created at, Created from | KB §Overview vs Leads |
| **OBS-01**: 17ª coluna "Created from" exporta com **header em branco** no CSV — pré-existente, confirmado KB | KB OBS-01-1321 |
| Botão Download CSV renderiza apenas com `hasDownloadPermission && headers > 0`; permissão = `leads download csv` (admin/manager têm; agent/isr/auditor não têm) | KB §Download-CSV permission gate |
| Download CSV habilitado quando: tabela não vazia E tamanho estimado ≤ 48 MiB | BR-01 / KB §Component behaviour |
| Download CSV desabilitado (sem tooltip) quando: tabela vazia; desabilitado (com tooltip) quando: tamanho estimado > 48 MiB | KB §Component behaviour |
| Email CSV sempre renderizado; desabilitado apenas quando tabela vazia — não gateado por permissão nem pelo limite de tamanho | BR-04 / KB §Available Operations |
| Tooltip de direcionamento (size-case only): `"This export is too large to download directly. Please use Email CSV instead. Estimated size: {X.X} MB (limit: 48 MB)."` | KB §Messages |
| O CSV contém TODOS os registros filtrados (não apenas a página atual): `maxResults = totalRows` | KB §Purpose |
| Contagem total de registros: rodapé de paginação "X-Y of N" → N | `filtered-csv-download.controls.ts:getTotalRowCount()` |
| Pitfall #118: Email CSV vem PRIMEIRO no DOM; usar `:has-text('Download CSV')` para disambiguar o botão correto | KB §Automation traps |

## Critérios de Aceitação

| ID | Critério | Oracle |
|---|---|---|
| AC-01 | Botão Download CSV está visível e habilitado após uma busca com resultados e dentro do limite de 48 MiB, para usuário com permissão `leads download csv` | CT-01 |
| AC-02 | Clicar em Download CSV inicia o download do arquivo `leads-results.csv` | CT-02 |
| AC-03 | O número de linhas de dados no arquivo (total de linhas menos a linha de cabeçalho) é igual ao total de registros exibido no rodapé de paginação ("X-Y of N" → N) | CT-03 |
| AC-04 | Cada linha de dados no CSV contém os campos que correspondem aos critérios de busca utilizados (ex: Customer Name, Lead Status, intervalo de datas) | CT-04 |
| AC-05 | Botão Download CSV desabilitado quando a tabela não tem resultados (busca sem match); Email CSV permanece habilitado | CT-05 |
| AC-06 | Quando o tamanho estimado do export excede 48 MiB: Download CSV desabilitado com tooltip de direcionamento; Email CSV habilitado | CT-06 |
| AC-07 | Botão Download CSV não é renderizado para usuário sem permissão `leads download csv`; Email CSV ainda é renderizado | CT-07 |

## Cenários

```gherkin
Feature: Download de Lista de Leads — Portal de Originação
  As an internal agent with leads download csv permission
  In order to exportar os leads filtrados para análise offline
  The agent must baixar o arquivo CSV com todos os registros que satisfazem os critérios de busca

  Background:
    Given o agente está autenticado no Portal de Originação com permissão `leads download csv`
    And o agente está na página de Leads (/leads)
    And o painel de filtros está expandido

  Scenario: [negativo] CT-05 — Download CSV desabilitado quando a busca não retorna resultados
    Given o campo From está preenchido com uma data passada
    And os critérios de busca resultam em zero leads (ex: Customer Name com valor "ZZZNOMATCH99999")
    When o agente clica em Search
    Then a tabela exibe "There are no records to display"
    And o botão Download CSV está desabilitado (sem tooltip de direcionamento)
    And o botão Email CSV está desabilitado

  Scenario: [negativo] CT-06 — Download CSV desabilitado e redirecionado para Email CSV quando o export excede 48 MiB
    Given a busca retorna um volume de leads cujo tamanho estimado do CSV excede 48 MiB
    When o agente visualiza os botões de export após a busca
    Then o botão Download CSV está desabilitado
    And ao passar o cursor sobre Download CSV, o tooltip exibe "This export is too large to download directly. Please use Email CSV instead. Estimated size: {X.X} MB (limit: 48 MB)."
    And o botão Email CSV está habilitado

  Scenario: [negativo] CT-07 — Botão Download CSV ausente para usuário sem permissão
    Given o agente está autenticado com uma role que não possui permissão `leads download csv` (ex: agent, isr)
    And uma busca com resultados foi executada
    When o agente visualiza a área de export
    Then o botão Download CSV não está visível
    And o botão Email CSV está visível e habilitado

  Scenario: [positivo] CT-01 — Download CSV habilitado após busca com resultados dentro do limite
    Given o campo From está preenchido com uma data passada
    And a busca retorna ao menos um lead
    And o tamanho estimado do export está dentro de 48 MiB
    When o agente visualiza os botões de export após clicar em Search
    Then o botão Download CSV está visível e habilitado
    And o botão Email CSV está visível e habilitado

  Scenario: [positivo] CT-02 — Clicar em Download CSV inicia download do arquivo leads-results.csv
    Given o botão Download CSV está habilitado após uma busca com resultados
    When o agente clica em Download CSV
    Then o browser inicia o download de um arquivo
    And o nome do arquivo é `leads-results.csv`

  Scenario: [positivo] CT-03 — Quantidade de linhas de dados no arquivo igual à contagem total da busca
    Given o agente realizou uma busca que retornou N registros (exibido no rodapé "X-Y of N")
    And o arquivo `leads-results.csv` foi baixado
    When o agente conta as linhas do arquivo excluindo o cabeçalho
    Then o número de linhas de dados é exatamente N
    And a contagem no arquivo corresponde ao total exibido no rodapé de paginação antes do download

  Scenario: [positivo] CT-04 — Registros do arquivo estão em conformidade com os critérios de busca
    Given o agente realizou uma busca com filtros ativos (ex: Customer Name, Lead Status e/ou intervalo de datas)
    And o arquivo `leads-results.csv` foi baixado
    When o agente inspeciona os dados do arquivo
    Then cada linha de dados possui os valores de coluna que correspondem aos critérios de busca aplicados
    And nenhuma linha de dados apresenta valores divergentes dos critérios de busca utilizados
```

## Oracles

> **Verificação de desatualização (executar antes de qualquer Oracle):**
> `git log cd2d2c8bfd07cf5275f605c259a88838168e6a09..HEAD -- src/pages/origination/leads.page.ts src/pages/origination/filtered-csv-download.controls.ts src/selectors/common.selectors.ts`
> Saída não vazia → prefixar o relatório com `[BDD MAY BE STALE]`.

### Oracle: CT-01 — Download CSV habilitado após busca com resultados

| Checkpoint | Valor esperado | Como verificar |
|---|---|---|
| Botão Download CSV visível | `SELECTORS.csvDownloadButton` (`:has-text('Download CSV')`) está no DOM e visível | `isDownloadCsvVisible()` → `true` |
| Botão Download CSV habilitado | Classe `enabledButton` presente, `disabledButton` ausente | `isDownloadCsvEnabled()` → `true` |
| Botão Email CSV visível e habilitado | `SELECTORS.csvEmailButton` visível; classe `disabledButton` ausente | `isEmailCsvVisible()` + `isEmailCsvEnabled()` → ambos `true` |

### Oracle: CT-02 — Download do arquivo leads-results.csv

| Checkpoint | Valor esperado | Como verificar |
|---|---|---|
| Download iniciado | Evento `download` capturado pelo Playwright | `downloadCsv()` → `Download` object retornado sem erro |
| Nome do arquivo | `leads-results.csv` | `download.suggestedFilename()` = `"leads-results.csv"` |
| Arquivo não vazio | O arquivo tem tamanho > 0 bytes | `download.path()` → `fs.statSync(path).size > 0` |

### Oracle: CT-03 — Contagem de linhas do arquivo igual ao total da busca

| Checkpoint | Valor esperado | Como verificar |
|---|---|---|
| Total de registros da busca (N) | Valor N do rodapé "X-Y of N" antes do download | `getTotalRowCount()` → N (número inteiro) |
| Linhas no arquivo CSV | Número total de linhas do arquivo menos 1 (linha de cabeçalho) | Ler arquivo, contar linhas, subtrair 1 (filtrar linhas vazias ao final) |
| Contagens iguais | linhas_csv == N | Comparar os dois valores; FAIL se divergirem |
| Cabeçalho presente | Primeira linha do arquivo contém os nomes das colunas | Primeira linha deve conter "Lead Number" (ou similar) |
| **OBS-01** — último header em branco | 17ª coluna no cabeçalho exporta sem label (blank) | Confirmar que apenas o 17º header está em branco; NÃO classificar como bug (pré-existente, KB OBS-01-1321) |

### Oracle: CT-04 — Registros do arquivo em conformidade com os critérios de busca

| Checkpoint | Valor esperado | Como verificar |
|---|---|---|
| Filtro por Customer Name: cada linha casa o nome | Coluna Customer Name em cada linha de dados contém o nome buscado (case-insensitive) | Ler coluna Customer Name de todas as linhas; nenhuma deve divergir |
| Filtro por Lead Status: cada linha casa o status | Coluna Lead Status em cada linha de dados exibe o status selecionado | Ler coluna Lead Status de todas as linhas; nenhuma deve divergir |
| Filtro por intervalo de datas: cada linha dentro do intervalo | Coluna Created at em cada linha exibe data ≥ From e ≤ To | Parsear coluna Created at de todas as linhas; sinalizar datas fora do intervalo como FAIL |
| Filtro por Lead PK: exatamente um registro | Coluna Lead Number exibe o PK informado | Contar linhas = 1; Lead Number == PK informado |
| Campos CSV correspondem às colunas da tabela | Os dados de uma linha CSV batem com os dados da mesma linha na tabela exibida | Comparar linha por Lead Number entre tabela UI e linha CSV |

### Oracle: CT-05 — Download CSV desabilitado quando tabela vazia

| Checkpoint | Valor esperado | Como verificar |
|---|---|---|
| Tabela sem resultados | "There are no records to display" visível | `getVisibleRowCount()` = 0 |
| Download CSV desabilitado | Classe `disabledButton` presente; `enabledButton` ausente | `isDownloadCsvEnabled()` → `false` |
| Sem tooltip de direcionamento | Nenhum tooltip de "too large" renderizado no hover | `hoverDownloadCsv()` → `getDownloadDisabledTooltip()` → `null` |
| Email CSV desabilitado | Classe `disabledButton` presente no Email CSV | `isEmailCsvEnabled()` → `false` |

### Oracle: CT-06 — Direcionamento para Email CSV quando export excede 48 MiB

| Checkpoint | Valor esperado | Como verificar |
|---|---|---|
| Download CSV desabilitado | Classe `disabledButton` presente | `isDownloadCsvEnabled()` → `false` |
| Tooltip de direcionamento presente após hover | Texto contém "too large to download directly" e "limit: 48 MB" | `hoverDownloadCsv()` → `getDownloadDisabledTooltip()` → não-null; texto casa o padrão |
| Email CSV habilitado | Classe `disabledButton` ausente no Email CSV | `isEmailCsvEnabled()` → `true` |

### Oracle: CT-07 — Botão Download CSV ausente sem permissão

| Checkpoint | Valor esperado | Como verificar |
|---|---|---|
| Download CSV ausente do DOM | `SELECTORS.csvDownloadButton` não está visível | `isDownloadCsvVisible()` → `false` |
| Email CSV presente e habilitado | Email CSV visível; `disabledButton` ausente | `isEmailCsvVisible()` → `true`; `isEmailCsvEnabled()` → `true` |

## Matriz de cobertura

| Critério de Aceitação | Cenário(s) | Status |
|---|---|---|
| AC-01 — Download CSV habilitado com resultados dentro do limite | CT-01: [positivo] Download CSV habilitado | Coberto |
| AC-02 — Download gera arquivo leads-results.csv | CT-02: [positivo] Download do arquivo leads-results.csv | Coberto |
| AC-03 — Contagem de linhas do arquivo = total da busca | CT-03: [positivo] Contagem de linhas igual ao total da busca | Coberto |
| AC-04 — Registros do arquivo correspondem aos critérios de busca | CT-04: [positivo] Registros em conformidade com os critérios | Coberto |
| AC-05 — Download CSV desabilitado sem resultados | CT-05: [negativo] Download CSV desabilitado — tabela vazia | Coberto |
| AC-06 — Direcionamento para Email CSV acima de 48 MiB | CT-06: [negativo] Download desabilitado — size limit | Coberto |
| AC-07 — Download CSV ausente sem permissão | CT-07: [negativo] Download CSV ausente — sem permissão | Coberto |

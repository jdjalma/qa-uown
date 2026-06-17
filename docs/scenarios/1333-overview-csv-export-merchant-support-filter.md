# Test Scenarios — #1333 Overview CSV Export Does Not Respect Merchant Support Filter

> Origin: Bug #1333 (Origination · Overview · CSV Export) · Type: **BUG fix verification**
> Knowledge base: [[overview-csv-export-merchant-support]] · Env validated: QA1
> Portal: Origination → Overview (`/overview`) · Interface: **UI-first** (browser export + open the file)

## Impact Analysis (business rules)

**Root cause (confirmed at request level):** the Download CSV export reuses `POST /uown/getLeadsInDateRange` but rebuilds the criteria payload **without the `merchantSupport` field**, while still capping results at `maxResults = totalRows = <filtered count>`. Every other filter (status, merchants, locations, search, clientTypes, internalStatus, dates) IS carried into the export. Result: the CSV has the same row count as the portal but pulls rows from a set not filtered by Merchant Support → mixed Merchant Supports in the file.


| Area touched                                                                    | Impact                                                      | Risk                                                                           |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Overview CSV export payload (table panel)                                       | `merchantSupport` must be added to the export criteria      | **High** — data integrity: users act on exported data they believe is filtered |
| Overview leads table listing                                                    | Already correct (filters MS server-side) — must NOT regress | Medium                                                                         |
| KPI metric cards (top filter bar)                                               | Out of scope — separate filter form, no Merchant Support    | Low                                                                            |
| Other filters in export (status, merchant, location, client type, date, search) | Already respected — must stay respected (AC-05)             | Medium                                                                         |
| Email CSV                                                                       | Likely shares the same builder — verify it is fixed too     | Medium                                                                         |


**Critical test-data precondition (else the bug is invisible):** the date range must contain leads across **at least two distinct Merchant Support owners**, and the chosen filter value must match a **strict subset** (so filtered count < total). With data where Merchant Support is empty or single-valued, the discrepancy cannot appear. See gap G1 in the KB.

```gherkin
Background:
  Dado que estou logado no portal da Origination como usuário interno
  E estou na página de Overview
  E dentro do intervalo de datas ativo existem leads pertencentes a pelo menos dois Merchant Support owners diferentes
  E os leads do Merchant Support "OwnerA" são em menor número do que o total de leads no intervalo

---

Scenario: o CSV exportado contém apenas os leads do Merchant Support selecionado
  Dado que abro o painel de Filters da tabela e defino Merchant Support como "OwnerA"
  E clico em Search e a tabela exibe apenas os leads cujo Merchant Support é "OwnerA"
  Quando clico em Download CSV e abro o arquivo "all-filtered-leads.csv" baixado
  Então toda linha do arquivo tem Merchant Support igual a "OwnerA"
  E nenhuma linha tem um Merchant Support diferente de "OwnerA"

---

Scenario: o CSV exportado exclui os leads de outros Merchant Supports presentes no mesmo intervalo de datas
  Dado que também existem leads do Merchant Support "OwnerB" dentro do intervalo de datas ativo
  E filtrei a tabela pelo Merchant Support "OwnerA"
  Quando exporto os resultados para CSV e abro o arquivo
  Então nenhum dos leads de "OwnerB" aparece no arquivo

---

Scenario: o conjunto exato de leads no CSV é igual ao conjunto exibido no portal
  Dado que filtrei a tabela pelo Merchant Support "OwnerA"
  E anoto o Reference # de cada lead exibido em todas as páginas da tabela
  Quando exporto os resultados para CSV e abro o arquivo
  Então o conjunto de valores de Reference # no arquivo é exatamente o conjunto exibido na tabela
  E não há nenhum Reference # no arquivo que estivesse ausente da tabela, e nenhum faltando

---

Scenario: o número de linhas de dados no CSV é igual à contagem de registros do portal
  Dado que filtrei a tabela pelo Merchant Support "OwnerA"
  E a paginação do portal mostra um total de N registros
  Quando exporto os resultados para CSV e abro o arquivo
  Então o arquivo contém exatamente N linhas de dados (excluindo a linha de cabeçalho)

---

Scenario: Merchant Support combinado com Status é totalmente respeitado na exportação
  Dado que defino Status como "Approved" e Merchant Support como "OwnerA" e clico em Search
  E a tabela exibe apenas os leads Approved pertencentes a "OwnerA"
  Quando exporto os resultados para CSV e abro o arquivo
  Então toda linha tem Status "Approved" e Merchant Support "OwnerA"
  E a contagem de linhas é igual à contagem do portal para esse filtro combinado

---

Scenario: Merchant Support combinado com Merchant, Location, Client Type e intervalo de datas é respeitado na exportação
  Dado que aplico um intervalo de datas, um Merchant, uma Location, um Client Type e o Merchant Support "OwnerA"
  E clico em Search
  Quando exporto os resultados para CSV e abro o arquivo
  Então toda linha corresponde a todos os filtros aplicados, incluindo o Merchant Support "OwnerA"
  E os registros e sua contagem correspondem ao que o portal exibe

---

Scenario: a exportação sem filtro de Merchant Support ainda retorna todos os leads do intervalo
  Dado que nenhum valor de Merchant Support é informado no filtro
  E a tabela exibe todos os leads do intervalo de datas ativo
  Quando exporto os resultados para CSV e abro o arquivo
  Então o arquivo contém todos os leads exibidos no portal
  E a contagem de linhas corresponde ao total do portal

---

Scenario: um filtro que não seja Merchant Support, sozinho, ainda exporta corretamente após a correção
  Dado que filtro apenas por Status "Approved" (Merchant Support deixado vazio)
  Quando exporto os resultados para CSV e abro o arquivo
  Então toda linha tem Status "Approved"
  E os registros e a contagem correspondem ao portal

---

Scenario: a estrutura do CSV permanece inalterada após a correção
  Quando exporto qualquer resultado filtrado para CSV e abro o arquivo
  Então a linha de cabeçalho contém as mesmas 27 colunas de Overview, na mesma ordem

Scenario: o matching de texto livre do Merchant Support se comporta na exportação da mesma forma que na tela
  Dado que Merchant Support é um campo de texto livre
  Quando insiro um valor parcial ou com variação de maiúsculas/minúsculas que a tabela aceita como correspondência
  Então o CSV exportado contém exatamente os mesmos leads que a tabela correspondeu para esse valor

---

Scenario: o Email CSV respeita o filtro de Merchant Support da mesma forma que o Download CSV
  Dado que filtrei a tabela pelo Merchant Support "OwnerA"
  Quando clico em Email CSV e abro o arquivo recebido
  Então toda linha tem Merchant Support "OwnerA" e os registros correspondem ao portal

---
```

## AC Coverage Matrix


| #     | Acceptance Criterion                                | Scenarios                                                | Priority |
| ----- | --------------------------------------------------- | -------------------------------------------------------- | -------- |
| AC-01 | Merchant Support filter respected during CSV export | "only leads of selected MS", "excludes other MS"         | P0       |
| AC-02 | Records in file match records displayed             | "exact set of leads equals portal"                       | P0       |
| AC-03 | CSV contains only the selected Merchant Support     | "only leads of selected MS", "excludes other MS"         | P0       |
| AC-04 | File record count matches portal count              | "row count equals portal count"                          | P0       |
| AC-05 | Export reflects ALL applied filters                 | "MS + Status", "MS + Merchant/Location/ClientType/date"  | P1       |
| AC-06 | Existing export keeps working                       | "no MS filter", "Status only", "CSV structure unchanged" | P1       |


**Notes**

- The decisive check is **open the file and compare content**, never just the count — the bug is invisible if you only compare counts (count already matches today). Direct consequence of [[check-points]] (verify the real observable consequence) and rule #14 (UI-first; rendering/content bugs only surface when the artifact is opened).
- Data precondition (≥2 distinct Merchant Support owners, filtered value = strict subset) is mandatory; otherwise scenarios AC-01..AC-04 pass vacuously.


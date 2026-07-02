---
last-reviewed: 2026-06-28
last-reviewed-sha: cd2d2c8bfd07cf5275f605c259a88838168e6a09
covers:
  - src/pages/origination/merchant-list.page.ts
  - src/pages/origination/merchant-edit.page.ts
  - src/pages/origination/merchant-setting.page.ts
  - src/data/merchant-config-contract.ts
---

# Merchant Settings — Busca e Acesso

> Buscar um merchant na lista e acessar sua página de configurações individuais.
> Portais: Origination (sandbox/qa1/stg). Perfil: manager / admin.

## Critérios de Aceitação

| ID | Critério | Oracle |
|---|---|---|
| AC-01 | Lista de merchants carrega com 5+ colunas e paginação visível | CT-01 |
| AC-02 | Filtro de texto "Search table" filtra por merchant code / nome | CT-02 |
| AC-03 | Clicar no Merchant Code abre `/merchant/{code}` com breadcrumb "MERCHANTS > EDIT COMPANY" | CT-03 |
| AC-04 | Página de detalhe contém 5 sections: Merchant Information, Settings, Contact, Programs, Notes | CT-04 |
| AC-05 | Section Settings contém sub-seções colapsáveis: Status, Requirements, Fee, Status Change, Others, EPO, Fraud | CT-05 |
| AC-06 | Botões CANCEL e SAVE estão presentes no topo da página de detalhe | CT-06 |
| AC-07 | Merchant Code e Merchant Name exibem os valores corretos do merchant selecionado | CT-07 |
| AC-08 | Por default, lista carrega com filtro Active = "Active" pré-selecionado | CT-08 |

## Cenários Gherkin

```gherkin
Feature: Merchant Settings — Busca e Acesso

  Background:
    Given o agente está autenticado no portal de Origination
    And está na página de Merchants (/merchant)

  Scenario: [positive] CT-01 — Página de Merchants carrega com tabela e paginação
    When a página /merchant é exibida
    Then o título "MERCHANTS" está visível
    And a tabela tem ao menos as colunas: Delete, Merchant Code, Active, Merchant Name, Location Name
    And a paginação mostra o total de registros (ex.: "1-10 of N")
    And o filtro Active está pré-selecionado com o valor "Active"

  Scenario: [positive] CT-02 — Busca por texto filtra a lista
    Given a página de Merchants está aberta com filtro "Active" pré-selecionado
    When o agente digita um termo no campo "Search table"
    And clica no botão "Search"
    Then a tabela exibe apenas merchants cujo Merchant Code ou nome corresponde ao termo digitado
    And a paginação reflete o número filtrado de resultados

  Scenario: [positive] CT-03 — Clicar no Merchant Code abre a página de configurações
    Given a lista de merchants exibe ao menos um resultado
    When o agente clica no link do Merchant Code de qualquer linha
    Then a URL muda para /merchant/{refMerchantCode}
    And o breadcrumb exibe "MERCHANTS > EDIT COMPANY"

  Scenario: [positive] CT-04 — Página de detalhe contém as 5 sections esperadas
    Given a página /merchant/{code} está aberta
    Then as seguintes sections estão visíveis:
      | Section              |
      | Merchant Information |
      | Settings             |
      | Contact              |
      | Programs             |
      | Notes                |

  Scenario: [positive] CT-05 — Section Settings contém sub-seções colapsáveis
    Given a seção Settings está visível na página de detalhe
    Then as seguintes sub-seções estão presentes dentro de Settings:
      | Sub-seção     |
      | Status        |
      | Requirements  |
      | Fee           |
      | Status Change |
      | Others        |
      | EPO           |
      | Fraud         |
    And cada sub-seção possui um ícone chevron (∨) indicando que é colapsável

  Scenario: [positive] CT-06 — Botões de ação estão presentes
    Given a página /merchant/{code} está aberta
    Then o botão "CANCEL" está visível no topo da página
    And o botão "SAVE" está visível no topo da página

  Scenario: [positive] CT-07 — Dados do merchant são exibidos corretamente
    Given o agente acessou a página de /merchant/{code} via clique no Merchant Code
    Then o campo "Merchant Code" exibe o código do merchant selecionado
    And o campo "Merchant Name" exibe o nome correspondente ao código

  Scenario: [positive] CT-08 — Filtro Active pré-selecionado como "Active" ao abrir a lista
    When a página /merchant carrega pela primeira vez
    Then o filtro "Active" já exibe o valor "Active" com um botão X para limpar
    And a lista exibe apenas merchants ativos

  Scenario: [negative] CT-09 — Busca sem resultado retorna tabela vazia
    When o agente digita um termo inexistente no campo "Search table" e clica "Search"
    Then a tabela não exibe linhas de dados
    And a paginação indica 0 resultados
```

### Oracle

```bash
# Staleness check — run before validating:
git log cd2d2c8bfd07cf5275f605c259a88838168e6a09..HEAD -- \
  src/pages/origination/merchant-list.page.ts \
  src/pages/origination/merchant-edit.page.ts \
  src/pages/origination/merchant-setting.page.ts \
  src/data/merchant-config-contract.ts
```

| CT | Checkpoint | PASS se |
|---|---|---|
| CT-01 | Título "MERCHANTS" + tabela com colunas + paginação + Active="Active" | Todos visíveis ao carregar /merchant |
| CT-02 | Search filtra a lista | Linhas correspondem ao termo; paginação atualizada |
| CT-03 | URL + breadcrumb após clique | URL = /merchant/{code}; texto = "MERCHANTS > EDIT COMPANY" |
| CT-04 | 5 sections na página de detalhe | Merchant Information, Settings, Contact, Programs, Notes visíveis |
| CT-05 | 7 sub-seções em Settings | Status, Requirements, Fee, Status Change, Others, EPO, Fraud visíveis com chevron |
| CT-06 | Botões CANCEL e SAVE | Ambos visíveis no topo |
| CT-07 | Dados do merchant | Merchant Code e Name batem com a linha clicada |
| CT-08 | Active pré-selecionado | Filtro Active = "Active" + X visível ao carregar /merchant |
| CT-09 | Busca sem resultado | Tabela vazia + paginação = 0 |

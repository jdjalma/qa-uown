---
last-reviewed: 2026-06-28
last-reviewed-sha: cd2d2c8bfd07cf5275f605c259a88838168e6a09
covers:
  - src/pages/origination/leads.page.ts
---

# Busca de Leads — Portal de Originação

> Origem: solicitação do usuário 2026-06-28 — "busque um lead na pagina de leads e valide que os resultados exibidos batem com a busca realizada"

## Resumo da demanda

O agente busca na página de Leads (`/leads`) do portal de Originação usando um ou mais critérios de filtro e espera que a tabela de resultados exiba apenas os leads que correspondem a esses critérios. A funcionalidade permite que agentes internos localizem leads específicos com rapidez; a correção do mapeamento filtro-resultado é o valor central.

## Análise de impacto

| Regra | Fonte |
|---|---|
| A data `From` é obrigatória — sem ela a busca não é executada e "Start date is required" é exibido | `leads.page.ts:L58-66, L228-243`; `origination-portal-map.md` §Leads |
| `To` padrão é hoje | doc comment `leads.page.ts`; `origination-portal-map.md` §Leads |
| Sem resultados → "There are no records to display" | `leads.page.ts:L236-241` |
| Campos de filtro: From, To, SSN, Email, Lead PK, Account PK, Phone Number, Customer Name, State, Lead Status, Internal Status, Merchant, Location, Invoice Number | doc comment da classe `leads.page.ts` |
| Colunas da tabela: Lead # · Account # · Lead Status · Internal Status · State · Term Month · Customer Name · Invoice Number · SSN · Phone Number · Email Address · Merchant · Location · Ref Merchant Code · Client Type · Created at · Created from | doc comment da classe `leads.page.ts`; `origination-portal-map.md` §Leads |
| Resultados são limitados ao acesso de merchant/localização visível do agente | `origination-role-based-access-and-pii.md` [inferido do doc de acesso por função] |

## Critérios de Aceitação

| ID | Critério | Testável? |
|---|---|---|
| AC-01 | Quando o campo From estiver vazio e o agente clicar em Search, a busca NÃO é executada e a mensagem "Start date is required" aparece ao lado do campo From | Sim |
| AC-02 | Quando o agente buscar por Customer Name, cada linha na tabela de resultados contém esse nome na coluna "Customer Name" | Sim |
| AC-03 | Quando o agente buscar por Lead Status, cada linha na tabela de resultados exibe aquele status na coluna "Lead Status" | Sim |
| AC-04 | Quando o agente buscar por um Lead PK específico, a tabela de resultados contém exatamente o lead com aquele Lead # | Sim |
| AC-05 | Quando os critérios de busca não casam nenhum lead, a tabela exibe "There are no records to display" e nenhuma linha de dados fica visível | Sim |
| AC-06 | Quando o agente buscar por intervalo de datas (From + To), cada linha de resultado exibe uma data "Created at" que cai dentro do intervalo especificado | Sim |

## Cenários

```gherkin
Feature: Busca de Leads — Portal de Originação
  As an internal agent
  In order to localizar leads específicos rapidamente
  The agent must filtrar a lista de leads por um ou mais critérios e receber resultados que casam exatamente esses critérios

  Background:
    Given o agente está autenticado no Portal de Originação
    And o agente está na página de Leads (/leads)
    And o painel de filtros está expandido

  Scenario: [negativo] CT-01 — busca tentada sem a data From obrigatória exibe erro de validação
    Given o campo de data From está vazio
    When o agente clica no botão Search
    Then a mensagem "Start date is required" é exibida ao lado do campo From
    And nenhuma requisição de busca é enviada e a tabela de resultados permanece inalterada

  Scenario: [negativo] CT-02 — busca com critérios que não casam nenhum lead exibe estado vazio
    Given o campo de data From está preenchido com uma data passada
    And o campo Customer Name está preenchido com um valor que não casa nenhum lead (ex: "ZZZNOMATCH99999")
    When o agente clica no botão Search
    Then a tabela de resultados exibe a mensagem "There are no records to display"
    And nenhuma linha de dados fica visível na tabela

  Scenario: [positivo] CT-03 — busca por Customer Name retorna apenas leads com aquele nome
    Given o campo de data From está preenchido com uma data passada cobrindo dados de teste
    And o campo Customer Name está preenchido com o nome completo ou parcial de um lead conhecido
    When o agente clica no botão Search
    Then a tabela de resultados contém ao menos uma linha
    And cada linha na coluna "Customer Name" contém o nome buscado (match sem diferenciação de maiúsculas/minúsculas)
    And nenhuma linha na coluna "Customer Name" exibe um nome que não casa o termo buscado

  Scenario: [positivo] CT-04 — busca por Lead Status retorna apenas leads com aquele status
    Given o campo de data From está preenchido com uma data passada cobrindo dados de teste
    And o filtro Lead Status está definido para um status conhecido (ex: "Funded")
    When o agente clica no botão Search
    Then a tabela de resultados contém ao menos uma linha
    And cada linha na coluna "Lead Status" exibe exatamente o status selecionado
    And nenhuma linha exibe um status de lead diferente

  Scenario: [positivo] CT-05 — busca por Lead PK retorna exatamente um lead correspondente
    Given o campo de data From está preenchido com uma data passada cobrindo dados de teste
    And o campo Lead PK está preenchido com um identificador de lead conhecido
    When o agente clica no botão Search
    Then a tabela de resultados contém exatamente uma linha
    And a coluna "Lead #" dessa linha exibe o Lead PK exato informado

  Scenario: [positivo] CT-06 — busca por intervalo de datas retorna apenas leads criados nesse intervalo
    Given o campo From está definido para uma data de início específica
    And o campo To está definido para uma data de fim específica (mesmo dia ou posterior)
    When o agente clica no botão Search
    Then cada linha na coluna "Created at" exibe uma data que cai entre a data From e a data To (inclusive)
    And nenhuma linha exibe uma data "Created at" fora do intervalo especificado
```

## Oracle: CT-01 — busca tentada sem a data From obrigatória exibe erro de validação

> Verificação de desatualização (executar primeiro):
> `git log cd2d2c8bfd07cf5275f605c259a88838168e6a09..HEAD -- src/pages/origination/leads.page.ts`
> Saída não vazia = BDD pode estar desatualizado. Prefixar o relatório com `[BDD MAY BE STALE]`.

| O que o agente verifica | Valor / estado esperado | Onde / Como verificar |
|---|---|---|
| Mensagem de validação ao lado do campo From | Texto "Start date is required" está visível | Snapshot do DOM: label ou span adjacente ao input de data From |
| Estado da tabela de resultados | Conteúdo da tabela inalterado (sem novas linhas carregadas, sem spinner) | Contagem de linhas `rdt_Table` inalterada em relação ao estado anterior ao clique |
| Requisições de rede | Nenhuma `POST /uown/los/getLeads` ou requisição de API de busca foi disparada | Aba de rede do browser — nenhuma requisição deve aparecer após clicar Search sem From |

## Oracle: CT-02 — estado vazio quando não há resultados

> Verificação de desatualização (executar primeiro):
> `git log cd2d2c8bfd07cf5275f605c259a88838168e6a09..HEAD -- src/pages/origination/leads.page.ts`

| O que o agente verifica | Valor / estado esperado | Onde / Como verificar |
|---|---|---|
| Mensagem no corpo da tabela | "There are no records to display" | Texto do corpo `rdt_Table` |
| Linhas de dados | Zero linhas de dados `<tr>` visíveis | Contagem de `rdt_TableRow` = 0 |
| Contador de paginação | Exibe "0-0 of 0" ou está oculto | Rodapé de paginação |

## Oracle: CT-03 — busca por Customer Name

> Verificação de desatualização (executar primeiro):
> `git log cd2d2c8bfd07cf5275f605c259a88838168e6a09..HEAD -- src/pages/origination/leads.page.ts`

| O que o agente verifica | Valor / estado esperado | Onde / Como verificar |
|---|---|---|
| Tabela de resultados tem linhas | Ao menos 1 linha visível | Contagem de `rdt_TableRow` ≥ 1 |
| Cada célula "Customer Name" casa | Cada célula na coluna Customer Name contém o nome buscado (match parcial ou completo, sem diferenciação de maiúsculas/minúsculas) | Ler todas as células da coluna Customer Name; nenhuma deve divergir |
| Nenhum nome divergente | Zero linhas com Customer Name que não contenha o termo buscado | Varrer todas as linhas visíveis; sinalizar qualquer outlier como FAIL |
| Total na paginação reflete o filtro | Contagem total no rodapé de paginação casa o número de resultados filtrados | Rodapé de paginação `X-Y of Z` — Z ≤ total sem filtro |

## Oracle: CT-04 — busca por Lead Status

> Verificação de desatualização (executar primeiro):
> `git log cd2d2c8bfd07cf5275f605c259a88838168e6a09..HEAD -- src/pages/origination/leads.page.ts`

| O que o agente verifica | Valor / estado esperado | Onde / Como verificar |
|---|---|---|
| Tabela de resultados tem linhas | Ao menos 1 linha visível | Contagem de `rdt_TableRow` ≥ 1 |
| Cada célula "Lead Status" casa | Cada célula na coluna Lead Status exibe exatamente o status selecionado | Ler todas as células da coluna Lead Status; nenhuma deve diferir |
| Nenhum status divergente | Zero linhas exibindo um Lead Status diferente | Varrer todas as linhas visíveis; sinalizar qualquer divergência como FAIL |

## Oracle: CT-05 — busca por Lead PK

> Verificação de desatualização (executar primeiro):
> `git log cd2d2c8bfd07cf5275f605c259a88838168e6a09..HEAD -- src/pages/origination/leads.page.ts`

| O que o agente verifica | Valor / estado esperado | Onde / Como verificar |
|---|---|---|
| Exatamente uma linha retornada | Contagem de linhas = 1 | Contagem de `rdt_TableRow` = 1 |
| Célula Lead # casa o PK informado | A coluna "Lead #" exibe o identificador exato informado no filtro | Ler o valor da célula Lead #; deve ser igual ao input |

## Oracle: CT-06 — busca por intervalo de datas

> Verificação de desatualização (executar primeiro):
> `git log cd2d2c8bfd07cf5275f605c259a88838168e6a09..HEAD -- src/pages/origination/leads.page.ts`

| O que o agente verifica | Valor / estado esperado | Onde / Como verificar |
|---|---|---|
| Tabela de resultados tem linhas | Ao menos 1 linha visível | Contagem de `rdt_TableRow` ≥ 1 |
| Cada data "Created at" está dentro do intervalo | Cada célula "Created at" exibe uma data ≥ From e ≤ To | Parsear cada célula Created at; sinalizar qualquer data fora do intervalo como FAIL |
| Nenhuma linha fora do intervalo | Zero linhas com Created at fora de [From, To] | Varrer todas as linhas visíveis |

## Matriz de cobertura

| Critério de Aceitação | Cenário(s) que cobrem | Status |
|---|---|---|
| AC-01 — Data From obrigatória | CT-01: [negativo] busca sem From exibe erro de validação | Coberto |
| AC-02 — Filtro por Customer Name limita resultados | CT-03: [positivo] busca por Customer Name retorna apenas leads correspondentes | Coberto |
| AC-03 — Filtro por Lead Status limita resultados | CT-04: [positivo] busca por Lead Status retorna apenas leads correspondentes | Coberto |
| AC-04 — Filtro por Lead PK retorna match exato | CT-05: [positivo] busca por Lead PK retorna exatamente um lead | Coberto |
| AC-05 — Sem resultados exibe estado vazio | CT-02: [negativo] sem resultados exibe "There are no records to display" | Coberto |
| AC-06 — Intervalo de datas limita resultados | CT-06: [positivo] busca por intervalo de datas retorna apenas leads dentro do intervalo | Coberto |

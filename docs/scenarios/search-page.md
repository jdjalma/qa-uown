# Test Scenarios — Página de Busca (Search) — Portal de Servicing

> Origin: investigação exploratória via Playwright MCP, 2026-06-25
> Base: `docs/knowledge-base/search-page.md`

## Demand summary

Página principal do portal de Servicing (`/search`). Permite que agentes busquem e acessem contas de clientes por múltiplos critérios (filtros avançados e quick search na navbar). Contém também ações de exportação CSV e acesso a venda de conta.

## Impact analysis

- **BR-01** (search-page.md): Campo `From` é **obrigatório** para disparar a busca de filtros; sem ele a mensagem "Start date is required" é exibida e a API não é chamada.
- **BR-02** (search-page.md): Campo `To` tem **default** na data atual ao abrir o painel.
- **BR-03** (search-page.md): Dropdown Company populado dinamicamente com **KORNERSTONE** e **UOWN**.
- **BR-04** (search-page.md): **SSN exibido sem máscara** na tabela — observação de compliance a reportar.
- **BR-05** (search-page.md): Last 4 CC mascarado (`************XXXX`).
- **BR-06/07** (search-page.md): Quick Search dispara chamada em tempo real, máximo 100 resultados.
- **Estrutura de navegação** (search-page.md): Account # → `/customer-information/{pk}`; Ref Account → portal de Origination (link externo).
- **Modal Email CSV** (search-page.md): validação de formato de email com mensagem "Invalid Email." ao tentar enviar com formato inválido.
- **Mobile** (search-page.md): Quick Search da navbar **oculta** em viewport <992px; menu hambúrguer com busca (placeholder diferente), FAQ e logout.

## Scenarios

```gherkin
# ──────────────────────────────────────────────────────────────────────────────
# Feature 1 — Painel de Filtros
# ──────────────────────────────────────────────────────────────────────────────

Feature: Busca de contas por filtros avançados
  Como agente de atendimento
  Quero buscar contas usando múltiplos critérios de filtro
  Para localizar rapidamente a conta correta do cliente

  Background:
    Given o agente está autenticado no portal de Servicing
    And está na tela de busca de contas

  # ── Validações / negativos ─────────────────────────────────────────────────

  Scenario: [negative] tentativa de busca sem informar o período inicial
    Given o painel de filtros está aberto
    And o campo "From" está vazio
    When o agente aciona o botão de busca
    Then a mensagem "Start date is required" é exibida ao lado do campo "From"
    And nenhum resultado é carregado na tabela

  Scenario: [negative] busca com nenhum critério que corresponda a registros existentes
    Given o painel de filtros está aberto
    And o campo "From" está preenchido com uma data válida
    And o campo "Customer Name" está preenchido com um nome que não existe em nenhuma conta
    When o agente aciona o botão de busca
    Then a tabela de resultados exibe a mensagem "There are no records to display"

  # ── Estado inicial ─────────────────────────────────────────────────────────

  Scenario: [positive] campo "To" pré-preenchido com a data de hoje ao abrir o painel
    When o agente abre o painel de filtros
    Then o campo "To" exibe a data atual no formato MM/DD/AAAA
    And o campo "From" está vazio

  Scenario: [positive] painel de filtros fecha ao acionar o botão Filters novamente
    Given o painel de filtros está aberto
    When o agente aciona o botão "Filters"
    Then o painel de filtros não está mais visível na tela

  # ── Filtragem por critério individual ──────────────────────────────────────

  Scenario: [positive] busca retorna resultados ao informar apenas o período obrigatório
    Given o painel de filtros está aberto
    And o campo "From" está preenchido com "01/01/2024"
    And nenhum outro critério está preenchido
    When o agente aciona o botão de busca
    Then a tabela de resultados exibe ao menos um registro
    And cada registro exibe Account #, Customer Name, Account Status e Company

  Scenario: [positive] busca filtrada por Company retorna apenas contas da empresa selecionada
    Given o painel de filtros está aberto
    And o campo "From" está preenchido com uma data válida
    And o filtro "Company" está selecionado com o valor "UOWN"
    When o agente aciona o botão de busca
    Then todos os registros exibidos na tabela têm o valor "UOWN" na coluna Company

  Scenario: [positive] busca filtrada por Customer Name retorna contas do cliente informado
    Given o painel de filtros está aberto
    And o campo "From" está preenchido com uma data válida
    And o campo "Customer Name" está preenchido com o nome de um cliente existente
    When o agente aciona o botão de busca
    Then a tabela de resultados exibe registros cujo nome do cliente corresponde ao critério informado

  Scenario: [positive] busca filtrada por Email retorna contas associadas ao endereço informado
    Given o painel de filtros está aberto
    And o campo "From" está preenchido com uma data válida
    And o campo "Email" está preenchido com o endereço de email de um cliente existente
    When o agente aciona o botão de busca
    Then a tabela de resultados exibe registros cujo Email Address corresponde ao endereço informado

  Scenario: [positive] busca filtrada por Account PK retorna exatamente a conta correspondente
    Given o painel de filtros está aberto
    And o campo "From" está preenchido com uma data válida
    And o campo "Account PK" está preenchido com o número de uma conta existente
    When o agente aciona o botão de busca
    Then a tabela de resultados exibe exatamente um registro com o Account # correspondente

  Scenario: [positive] busca filtrada por SSN retorna conta do titular do CPF informado
    Given o painel de filtros está aberto
    And o campo "From" está preenchido com uma data válida
    And o campo "SSN" está preenchido com o número de previdência social de um cliente existente
    When o agente aciona o botão de busca
    Then a tabela de resultados exibe registros cujo SSN corresponde ao valor informado

  Scenario: [positive] busca filtrada por Phone Number retorna contas do número informado
    Given o painel de filtros está aberto
    And o campo "From" está preenchido com uma data válida
    And o campo "Phone Number" está preenchido com o número de telefone de um cliente existente
    When o agente aciona o botão de busca
    Then a tabela de resultados exibe registros com o número de telefone correspondente

  Scenario: [positive] busca filtrada por Last 4 CC retorna contas do cartão informado
    Given o painel de filtros está aberto
    And o campo "From" está preenchido com uma data válida
    And o campo "Last 4 CC digits" está preenchido com os 4 últimos dígitos de um cartão existente
    When o agente aciona o botão de busca
    Then a tabela de resultados exibe registros cujo Last 4 CC corresponde aos dígitos informados

  Scenario: [positive] busca filtrada por Ref Account ID retorna a conta do lead correspondente
    Given o painel de filtros está aberto
    And o campo "From" está preenchido com uma data válida
    And o campo "Ref Account ID" está preenchido com o código de um lead existente (ex: "L98035")
    When o agente aciona o botão de busca
    Then a tabela de resultados exibe o registro cuja coluna Ref Account corresponde ao código informado

  Scenario: [positive] dropdown Company exibe as opções KORNERSTONE e UOWN
    When o agente abre o painel de filtros
    And aciona o campo de seleção "Company"
    Then as opções disponíveis são "KORNERSTONE" e "UOWN"


# ──────────────────────────────────────────────────────────────────────────────
# Feature 2 — Tabela de Resultados
# ──────────────────────────────────────────────────────────────────────────────

Feature: Tabela de resultados da busca de contas
  Como agente de atendimento
  Quero visualizar os dados das contas encontradas em uma tabela estruturada
  Para identificar rapidamente a conta correta e acessar seus detalhes

  Background:
    Given o agente está autenticado no portal de Servicing
    And está na tela de busca de contas
    And uma busca com o campo "From" preenchido retornou ao menos um resultado

  # ── Conteúdo e estrutura ───────────────────────────────────────────────────

  Scenario: [positive] tabela exibe as 13 colunas esperadas para cada registro
    Then a tabela de resultados exibe as colunas: Account #, Ref Account, Account Status,
      Account Activation Date, State, Customer Name, SSN, Phone Number, Last 4 CC,
      Next Payment Amount, Created at, Email Address e Company

  Scenario: [positive] SSN do cliente é exibido sem mascaramento na tabela
    Then a coluna SSN exibe o número completo do cliente sem asteriscos ou ocultação parcial

  Scenario: [positive] Last 4 CC é exibido com os primeiros dígitos mascarados
    Then a coluna "Last 4 CC" exibe o valor no formato "************XXXX"
    And apenas os 4 últimos dígitos do cartão são visíveis

  # ── Links de navegação ─────────────────────────────────────────────────────

  Scenario: [positive] Account # na tabela é um link para a tela de informações da conta
    When o agente clica no número de conta exibido na coluna "Account #" de um registro
    Then o portal exibe a tela de informações detalhadas da conta correspondente

  Scenario: [positive] Ref Account na tabela é um link para o lead no portal de Origination
    When o agente clica no código exibido na coluna "Ref Account" de um registro
    Then o portal de Origination é aberto com os dados do lead correspondente


# ──────────────────────────────────────────────────────────────────────────────
# Feature 3 — Paginação
# ──────────────────────────────────────────────────────────────────────────────

Feature: Paginação dos resultados de busca
  Como agente de atendimento
  Quero navegar entre páginas de resultados e controlar a quantidade exibida
  Para gerenciar grandes volumes de contas encontradas

  Background:
    Given o agente está autenticado no portal de Servicing
    And está na tela de busca de contas
    And uma busca retornou mais de 10 registros

  # ── Limites e estado inicial ───────────────────────────────────────────────

  Scenario: [positive] controles de página anterior e primeira página estão desabilitados na primeira página
    Then o botão "Previous Page" está desabilitado
    And o botão "First Page" está desabilitado
    And o botão "Next Page" está habilitado

  Scenario: [positive] contador exibe o intervalo atual e o total de registros
    Then o contador de paginação exibe o intervalo dos registros visíveis e o total
    And o formato exibido é "{início}-{fim} of {total}" (ex: "1-10 of 12906")

  # ── Navegação ──────────────────────────────────────────────────────────────

  Scenario: [positive] avançar para a próxima página carrega o próximo conjunto de registros
    When o agente aciona o botão "Next Page"
    Then a tabela exibe o próximo conjunto de registros
    And o contador de paginação é atualizado para refletir o novo intervalo

  Scenario: [positive] ir para a última página exibe os registros mais antigos
    When o agente aciona o botão "Last Page"
    Then a tabela exibe o último conjunto de registros
    And o botão "Next Page" está desabilitado
    And o botão "Last Page" está desabilitado

  # ── Rows per page ──────────────────────────────────────────────────────────

  Scenario Outline: [positive] alterar a quantidade de registros por página recarrega a tabela
    When o agente seleciona "<quantidade>" no seletor de "Rows per page"
    Then a tabela exibe no máximo "<quantidade>" registros
    And o contador de paginação é atualizado

    Examples:
      | quantidade |
      | 15         |
      | 25         |
      | 50         |
      | 100        |


# ──────────────────────────────────────────────────────────────────────────────
# Feature 4 — Quick Search na barra de navegação
# ──────────────────────────────────────────────────────────────────────────────

Feature: Busca rápida de contas pela barra de navegação
  Como agente de atendimento
  Quero localizar uma conta digitando diretamente na barra de navegação
  Para acessar rapidamente uma conta sem precisar abrir o painel de filtros

  Background:
    Given o agente está autenticado no portal de Servicing em um dispositivo desktop
    And está na tela de busca de contas

  # ── Sem resultado ──────────────────────────────────────────────────────────

  Scenario: [negative] busca rápida sem correspondência exibe mensagem de ausência de resultados
    Given o tipo de busca rápida está selecionado como "Servicing Account #"
    When o agente digita um número de conta que não existe
    Then o dropdown de resultados exibe a mensagem "No results found"

  # ── Seleção de tipo ────────────────────────────────────────────────────────

  Scenario: [positive] dropdown de tipo de busca exibe os 10 critérios disponíveis
    When o agente aciona o seletor de tipo na barra de busca rápida
    Then são exibidas as opções: Lead #, Servicing Account #, Ref Account ID,
      Contract #, Phone, Email, SSN, Invoice #, Name e Last 4 CC

  Scenario: [positive] alternar o tipo de busca muda o critério utilizado na pesquisa
    Given o tipo de busca rápida está selecionado como "Servicing Account #"
    When o agente seleciona o tipo "Email" no dropdown de tipo de busca
    Then o campo de busca rápida passa a pesquisar por endereço de email

  # ── Resultados em tempo real ───────────────────────────────────────────────

  Scenario: [positive] resultados do tipo "Servicing Account #" aparecem conforme o agente digita
    Given o tipo de busca rápida está selecionado como "Servicing Account #"
    When o agente digita o número de uma conta existente
    Then um dropdown de resultados é exibido com Name, Phone Number, Email, Account Pk e Ref Account
    And o registro da conta correspondente está listado nos resultados

  Scenario: [positive] resultados do tipo "Email" aparecem conforme o agente digita o endereço
    Given o tipo de busca rápida está selecionado como "Email"
    When o agente digita o endereço de email de um cliente existente
    Then um dropdown de resultados é exibido com as contas associadas ao email informado

  # ── Navegação pelo resultado ───────────────────────────────────────────────

  Scenario: [positive] clicar em um resultado da busca rápida abre a tela da conta
    Given o tipo de busca rápida está selecionado como "Servicing Account #"
    And o agente digitou um número de conta com resultados exibidos no dropdown
    When o agente seleciona um dos resultados
    Then o portal exibe a tela de informações detalhadas da conta selecionada


# ──────────────────────────────────────────────────────────────────────────────
# Feature 5 — Exportação de resultados por email (CSV)
# ──────────────────────────────────────────────────────────────────────────────

Feature: Envio do CSV de resultados por email
  Como agente de atendimento
  Quero enviar o arquivo CSV dos resultados da busca para um endereço de email
  Para compartilhar ou arquivar os dados encontrados

  Background:
    Given o agente está autenticado no portal de Servicing
    And está na tela de busca de contas
    And uma busca retornou resultados na tabela

  # ── Validações ─────────────────────────────────────────────────────────────

  Scenario: [negative] tentativa de envio com email em formato inválido exibe erro
    Given o modal de envio de CSV está aberto
    And o campo de email está preenchido com um valor em formato inválido (ex: "nao-e-um-email")
    When o agente aciona o botão de envio
    Then a mensagem "Invalid Email." é exibida no campo de email
    And o modal permanece aberto

  Scenario: [negative] tentativa de envio com campo de email vazio mantém o modal aberto
    Given o modal de envio de CSV está aberto
    And o campo de email está vazio
    When o agente aciona o botão de envio
    Then o modal permanece aberto sem enviar o arquivo

  # ── Interações ─────────────────────────────────────────────────────────────

  Scenario: [positive] corrigir o email inválido remove a mensagem de erro
    Given o modal de envio de CSV está aberto
    And o agente informou um email com formato inválido e a mensagem de erro está visível
    When o agente corrige o campo de email com um endereço válido
    Then a mensagem de erro desaparece do campo de email

  Scenario: [positive] cancelar o envio fecha o modal sem transmitir o arquivo
    Given o modal de envio de CSV está aberto
    When o agente aciona o botão "CANCEL"
    Then o modal é fechado
    And nenhum email é enviado

  Scenario: [positive] envio de CSV com email válido dispara o envio do arquivo
    Given o modal de envio de CSV está aberto
    And o campo de email está preenchido com um endereço válido
    When o agente aciona o botão "Send"
    Then o modal é fechado
    And o CSV com os resultados da busca é enviado para o endereço informado

  Scenario: [positive] botão "Email CSV" abre o modal de envio com o campo de email vazio
    When o agente aciona o botão "Email CSV"
    Then um modal é exibido com o título "Which email should we send this CSV file to?"
    And o campo de email está vazio


# ──────────────────────────────────────────────────────────────────────────────
# Feature 6 — Acesso à venda de conta
# ──────────────────────────────────────────────────────────────────────────────

Feature: Acesso à tela de venda de conta
  Como agente de atendimento
  Quero acessar o fluxo de venda de conta diretamente da tela de busca
  Para iniciar uma operação de venda sem perder o contexto

  Background:
    Given o agente está autenticado no portal de Servicing
    And está na tela de busca de contas

  Scenario: [positive] botão Account Sale direciona para a tela de venda de conta
    When o agente aciona o botão "Account Sale"
    Then o portal exibe a tela de venda de conta


# ──────────────────────────────────────────────────────────────────────────────
# Feature 7 — Comportamento em dispositivos móveis
# ──────────────────────────────────────────────────────────────────────────────

Feature: Adaptação da tela de busca em dispositivos móveis
  Como agente de atendimento usando um dispositivo móvel
  Quero acessar as funcionalidades essenciais de busca
  Para localizar contas independentemente do dispositivo utilizado

  Background:
    Given o agente está autenticado no portal de Servicing em um dispositivo móvel

  Scenario: [positive] a barra de busca rápida da navbar não é exibida em mobile
    When o agente acessa a tela de busca de contas
    Then o campo de busca rápida da barra de navegação não está visível na tela

  Scenario: [positive] ícone de menu está visível em mobile no lugar da barra de busca
    When o agente acessa a tela de busca de contas
    Then um ícone de menu (hambúrguer) está visível na barra de navegação

  Scenario: [positive] menu mobile exibe opções de busca, FAQ e logout
    Given o agente está na tela de busca de contas
    When o agente aciona o ícone de menu da barra de navegação
    Then um menu lateral é exibido com campo de busca, link para FAQ e opção de logout

  Scenario: [positive] painel de filtros e botões de ação estão disponíveis em mobile
    When o agente acessa a tela de busca de contas em um dispositivo móvel
    Then o botão "Filters", o botão "Account Sale" e o botão "Email CSV" estão visíveis na tela
```

## Coverage matrix

| Acceptance Criterion | Cenários que cobrem | Status |
|---|---|---|
| AC-01 — Campo From obrigatório | [negative] tentativa de busca sem informar o período inicial | ✅ |
| AC-02 — Campo To pré-preenchido com data atual | [positive] campo "To" pré-preenchido com a data de hoje ao abrir o painel | ✅ |
| AC-03 — Painel de filtros expansível/colapsável | [positive] painel de filtros fecha ao acionar o botão Filters novamente | ✅ |
| AC-04 — Busca retorna resultados com critérios válidos | [positive] busca retorna resultados ao informar apenas o período obrigatório + cenários de filtro individual | ✅ |
| AC-05 — Tabela vazia exibe mensagem | [negative] busca com critério sem correspondência | ✅ |
| AC-06 — Account # link para informações da conta | [positive] Account # na tabela é um link para a tela de informações da conta | ✅ |
| AC-07 — Ref Account link para portal de Origination | [positive] Ref Account na tabela é um link para o lead no portal de Origination | ✅ |
| AC-08 — SSN sem máscara na tabela | [positive] SSN do cliente é exibido sem mascaramento na tabela | ✅ |
| AC-09 — Last 4 CC mascarado | [positive] Last 4 CC é exibido com os primeiros dígitos mascarados | ✅ |
| AC-10 — Paginação funcional | [positive] controles desabilitados na 1ª página + navegar + rows per page | ✅ |
| AC-11 — Quick Search com 10 tipos | [positive] dropdown de tipo de busca exibe os 10 critérios disponíveis | ✅ |
| AC-12 — Quick Search em tempo real | [positive] resultados aparecem conforme o agente digita | ✅ |
| AC-13 — Quick Search sem resultado | [negative] busca rápida sem correspondência exibe "No results found" | ✅ |
| AC-14 — Clicar resultado Quick Search navega para conta | [positive] clicar em um resultado da busca rápida abre a tela da conta | ✅ |
| AC-15 — Modal Email CSV valida formato | [negative] tentativa de envio com email inválido + campo vazio | ✅ |
| AC-16 — Modal Email CSV cancelável | [positive] cancelar o envio fecha o modal | ✅ |
| AC-17 — Account Sale navega para tela correta | [positive] botão Account Sale direciona para a tela de venda de conta | ✅ |
| AC-18 — Quick Search oculta em mobile | [positive] barra de busca rápida não exibida em mobile | ✅ |
| AC-19 — Menu mobile com busca, FAQ e logout | [positive] menu mobile exibe opções de busca, FAQ e logout | ✅ |
| AC-20 — Company dropdown com KORNERSTONE e UOWN | [positive] dropdown Company exibe as opções KORNERSTONE e UOWN | ✅ |

## Pending items

- **P-01:** Comportamento do link "Ref Account" — abre em nova aba ou mesma aba? O cenário AC-07 foi escrito de forma genérica ("portal de Origination é aberto"). Acionar `/discovery` para confirmar antes de automatizar. `[gap identificado em search-page.md]`
- **P-02:** Comportamento da busca com `From > To` — cenário de data inválida não foi incluído por falta de regra documentada. Acionar `/discovery` ou verificar com o time.
- **P-03:** SSN sem máscara (AC-08) — o cenário documenta o comportamento atual, mas há uma observação de compliance em `search-page.md`. Verificar com produto/segurança se é intencional antes de incluir em suite de regressão.
- **P-04:** `searchType` values para os 8 tipos de Quick Search não confirmados (Lead #, Ref Account ID, Contract #, Phone, SSN, Invoice #, Name, Last 4 CC). Os cenários foram escritos de forma comportamental e não dependem dos valores internos de API, mas a automação precisará confirmar os valores.
- **P-05:** Comportamento da tabela em mobile (scroll horizontal? colunas ocultas?) — cenário mobile não cobre tabela de resultados por ser `[assumed]`. Investigar via Playwright MCP em 375px.

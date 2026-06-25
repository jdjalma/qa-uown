---
title: Search Page — Servicing Portal
domain: knowledge-base
status: snapshot
volatility: stable
last_verified: 2026-06-25
sources:
  - env: sandbox
  - url: https://svc-website-sandbox.uownleasing.com/search
covers:
  - search-page
  - quick-search
  - account-search
  - servicing-search
  - filter-panel
  - email-csv
  - account-sale
promoted_to: []
---

# Search Page — Servicing Portal

> Charter: Explore `svc-website-sandbox.uownleasing.com/search` with Playwright MCP to discover todas as funcionalidades da página de busca: campo de busca, filtros, resultados, estados, paginação, comportamento mobile.
> Origin: solicitação do usuario 2026-06-25 · Overall confidence: high

---

## Purpose

Página principal do portal de Servicing. Permite que agentes de atendimento busquem e acessem contas de clientes por múltiplos critérios. É o ponto de entrada após login — todas as rotas não autenticadas redirecionam para `/` (tela de login) que, após login bem-sucedido, retorna para `/search`.

**Atores:** agentes de atendimento, supervisores, gestores de conta.

---

## Available Operations

| Operação | Disponível | Notas |
|----------|-----------|-------|
| Busca por filtros | ✅ | Painel expansível com 12 critérios |
| Quick Search (navbar) | ✅ | 10 tipos de busca; desktop only |
| Exportar CSV por email | ✅ | Modal com validação de email |
| Navegar para conta | ✅ | Link Account # → `/customer-information/{pk}` |
| Navegar para lead (Origination) | ✅ | Link Ref Account → portal externo |
| Account Sale | ✅ | Navega para `/account-sale` |
| Excluir / editar conta | ❌ | Não exposto nesta página |

---

## Estrutura da Página

### 1. Navigation Bar (topo)

Sempre visível. Contém:
- **Logo** → link para `/search`
- **Quick Search** (somente desktop — `d-none d-lg-block`)
- **Menu do usuário** (`jmendes.gow` + chevron) — sem opções visíveis via navbar desktop

**Mobile:** logo + ícone hambúrguer (fa-bars). Clique no hambúrguer abre menu lateral com:
- Campo de busca (placeholder: `"Quick search by applicant name or reference #"`) — **placeholder diferente do desktop**
- FAQ
- Logout

`[confirmed]` — observado em 375×667.

---

### 2. Barra de Ações (abaixo do título "Search Result")

| Elemento | Comportamento |
|----------|--------------|
| Botão **Filters** | Abre/fecha o painel de filtros (toggle) |
| Botão **Account Sale** | Navega para `/account-sale` |
| Botão **Email CSV** | Abre modal de envio do CSV por email |
| Link download (blob URL) | Gerado automaticamente para download direto do CSV |

---

### 3. Painel de Filtros (collapsível)

Aberto via botão **Filters**. Fecha ao clicar novamente.

#### Campos disponíveis

| Campo | Tipo | Name (API) | Obrigatório | Observações |
|-------|------|-----------|-------------|-------------|
| From | date (searchbox, MM/DD/YYYY) | `from` | **Sim** | Sem default. Validação: "Start date is required" |
| To | date (searchbox, MM/DD/YYYY) | `to` | Não | **Default: data de hoje** |
| SSN | text | `ssn` | Não | |
| Ref Account ID | text | `refAccountId` | Não | |
| Email | text | `email` | Não | |
| Account PK | text | `accountPk` | Não | |
| Phone Number | text | `phoneNumber` | Não | |
| Customer Name | text | `givenName` | Não | |
| Last 4 CC digits | text | `last4CC` | Não | Placeholder: "Last CC digits" |
| Company | combobox (react-select) | — | Não | Opções: **KORNERSTONE**, **UOWN** |
| Merchant | combobox searchável | — | Não | Placeholder: "Search by Merchant" |
| Location | combobox searchável | — | Não | Placeholder: "Search by Location" |

**Botão Search:** dispara a busca. Sem `From` preenchido, exibe "Start date is required" e não executa. `[confirmed]`

#### APIs do painel de filtros

- `GET /uown/svc/getDistinctCompanies` — popula dropdown Company (KORNERSTONE, UOWN)
- `POST /uown/los/getBasicMerchantInfoByRefCode` — popula dropdown Merchant
- `POST /uown/svc/getAccountsByCriteria` — busca principal (corpo contém os campos acima)

---

### 4. Tabela de Resultados

Componente: `react-data-table-component` (`rdt_Table`).

#### Colunas

| # | Header | Conteúdo | Interatividade |
|---|--------|---------|----------------|
| 1 | Account # | Número da conta | Link → `/customer-information/{pk}` |
| 2 | Ref Account | Código do lead (ex.: L98035) | Link externo → `origination-{env}.uownleasing.com/customers/{id}` |
| 3 | Account Status | ACTIVE, CANCELLED (outros valores possíveis) | Texto simples |
| 4 | Account Activation Date | YYYY-MM-DD | Texto simples |
| 5 | State | Sigla do estado (NY, TX…) | Texto simples |
| 6 | Customer Name | Nome completo | Texto simples |
| 7 | SSN | **EXIBIDO SEM MÁSCARA** (ex.: `121013650`) | Texto simples |
| 8 | Phone Number | Formatado: `(XXX) XXX-XXXX` | Texto simples |
| 9 | Last 4 CC | Mascarado: `************XXXX` | Texto simples |
| 10 | Next Payment Amount | Monetário: `$X.XX` | Texto simples |
| 11 | Created at | `MM/DD/YYYY HH:MM:SS a.m./p.m. EST` | Texto simples |
| 12 | Email Address | Email completo | Texto simples |
| 13 | Company | UOWN, KORNERSTONE | Texto simples |

> **[OBSERVATION]** SSN exibido sem mascaramento na tabela de resultados — potencial problema de segurança/compliance. Last 4 CC é mascarado mas SSN não. Requer verificação com o time de produto/segurança.

Todos os headers exibem o símbolo ▲ — **decorativo**, não indica ordenação interativa. `cursor: default` nos headers. `[confirmed]`

#### Ordenação padrão

Created at decrescente (mais recente primeiro). `[inferred]` — observado pela sequência de registros mas não testado via API response body.

#### Linha da tabela

Todas as células têm `cursor: pointer`, mas **clicar na linha não navega**. A navegação ocorre **apenas** pelos links explícitos: Account # e Ref Account. `[confirmed]`

---

### 5. Paginação

Componente: `rdt_Pagination`.

| Elemento | Valores |
|----------|---------|
| Rows per page | 10 (default), 15, 20, 25, 30, 40, 50, 100 |
| Contador | `{início}-{fim} de {total}` — ex.: `1-10 of 12906` |
| Botões | First Page, Previous Page, Next Page, Last Page |
| Estado inicial | First Page e Previous Page desabilitados na primeira página |

`[confirmed]`

---

### 6. Estado Vazio

Quando `From` não é preenchido e Search é clicado: sem execução da busca + mensagem "Start date is required" ao lado do campo From. `[confirmed]`

Quando a busca retorna sem resultados: a tabela exibe "There are no records to display". `[confirmed]`

---

### 7. Quick Search (navbar — desktop)

Campo de busca na navbar, oculto em mobile.

#### Seletor de tipo (dropdown)

Clique no label "Servicing Account #" (ou tipo atual selecionado) abre dropdown com 10 opções:

| Label UI | searchType (API) |
|----------|-----------------|
| Lead # | `[assumed]` |
| Servicing Account # | `AccountPk` `[confirmed]` |
| Ref Account ID | `[assumed]` |
| Contract # | `[assumed]` |
| Phone | `[assumed]` |
| Email | `Email` `[confirmed]` |
| SSN | `[assumed]` |
| Invoice # | `[assumed]` |
| Name | `[assumed]` |
| Last 4 CC | `[assumed]` |

**API:** `GET /uown/svc/simpleSearch/{value}?maxResults=100&pageNumber=1&searchType={type}`

Dispara a cada tecla pressionada (real-time). `[confirmed]`

#### Dropdown de resultados

Aparece sob o campo após retorno da API. Colunas: **Name, Phone Number, Email, Account Pk, Ref Account**.

- Coluna "Ref Account" tem ícone de link externo (arrow-up-right-from-square)
- Cada item é `<a href="/customer-information/{accountPk}">` — clique navega para a conta
- Sem resultados → exibe "No results found"
- Máximo: 100 resultados por chamada

`[confirmed]`

---

### 8. Modal Email CSV

Aberto pelo botão **Email CSV**.

| Elemento | Detalhes |
|----------|---------|
| Título | "Which email should we send this CSV file to?" |
| Campo | `input[type=email]`, name: `email`, placeholder: "Enter your email..." |
| Default | Campo vazio (sem pré-preenchimento) |
| Validação email vazio | Modal permanece aberto, sem mensagem explícita `[confirmed]` |
| Validação email inválido | Mensagem "Invalid Email." + classe `input-error` no campo `[confirmed]` |
| Email válido | Remove erro, habilita envio |
| Botão CANCEL | Fecha o modal sem enviar |
| Botão Send | Envia o CSV para o email informado |

---

## Flow e Estados

```
Acesso à /search sem autenticação
    → Redireciona para /
    → Login bem-sucedido → /search (filtros vazios, tabela com dados recentes)
    → From não preenchido + Search → "Start date is required" (sem chamada API)
    → From preenchido + Search → POST getAccountsByCriteria → tabela atualizada
    → Clique em Account # → /customer-information/{pk}
    → Clique em Ref Account → origination portal (nova aba ou mesma? [assumed nova aba])
    → Clique em Account Sale → /account-sale
    → Clique em Email CSV → modal de email
```

---

## Behavior Mobile vs Desktop

| Funcionalidade | Desktop (≥992px) | Mobile (<992px) |
|----------------|-----------------|-----------------|
| Quick Search navbar | Visível (type dropdown + input) | **Oculto** |
| Menu hambúrguer | Oculto | **Visível** |
| Menu mobile | — | Search (placeholder diferente) + FAQ + Logout |
| Filtros | Visíveis via botão Filters | Visíveis via botão Filters |
| Tabela de resultados | 13 colunas | `[assumed]` scroll horizontal |
| Account Sale / Email CSV | Visíveis | Visíveis |

`[confirmed]` via 375×667 viewport.

---

## Business Rules

- **BR-01:** Campo `From` é obrigatório para executar a busca de filtros. Sem ele, a busca não é disparada e a mensagem "Start date is required" é exibida. `[confirmed]`
- **BR-02:** Campo `To` tem default na data de hoje. `[confirmed]`
- **BR-03:** Company dropdown é populado dinamicamente via `GET /uown/svc/getDistinctCompanies`. Valores: KORNERSTONE e UOWN. `[confirmed]`
- **BR-04:** SSN é exibido sem máscara na tabela de resultados. `[confirmed]`
- **BR-05:** Last 4 CC é mascarado (************XXXX). `[confirmed]`
- **BR-06:** Quick Search dispara chamada API a cada tecla, com debounce `[assumed]`.
- **BR-07:** Quick Search retorna no máximo 100 resultados por chamada. `[confirmed]` (parâmetro `maxResults=100`)

---

## Connections with What Was Already Known

- Confirma: portal Servicing = `svc-website-{env}.uownleasing.com` (environments.md)
- Confirma: Ref Account link aponta para `origination-{env}.uownleasing.com/customers/{id}`
- Confirma: contas têm status ACTIVE e CANCELLED (outros valores a investigar)

---

## Gaps / To Investigate

- Todos os `searchType` valores da Quick Search (apenas `AccountPk` e `Email` confirmados)
- Valores possíveis de Account Status além de ACTIVE e CANCELLED
- Comportamento da tabela em mobile (scroll horizontal? colunas ocultas?)
- Comportamento do link "Ref Account" — abre em nova aba ou mesma aba?
- Comportamento do campo `From`/`To` com datas inválidas (ex.: From > To)
- Permissões por perfil: manager vs readonly vs agent — quem vê Account Sale?
- SSN sem máscara: intencional ou bug? Verificar com o time de produto/segurança
- Placeholder do mobile search ("applicant name or reference #") diverge do desktop ("Servicing Account #") — comportamentos diferentes?
- Endpoint `GET /uown/users-on-page` — propósito (tracking de usuários simultâneos?)
- Comportamento com busca de mais de 100 resultados no Quick Search

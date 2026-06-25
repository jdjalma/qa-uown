---
title: Servicing — Search Page & Quick Search
domain: knowledge-base
status: snapshot
volatility: volatile
last_verified: 2026-06-25
sources:
  - env: sandbox
  - url: https://svc-website-sandbox.uownleasing.com/search
  - code: /home/jose/projects/uown/servicing/pages/search/index.tsx
  - code: /home/jose/projects/uown/servicing/utils/search-table-config/index.tsx
  - code: /home/jose/projects/uown/servicing/domain/stores/search.tsx
  - code: /home/jose/projects/uown/svc/src/main/java/com/uownleasing/svc/service/SearchService.java
  - code: /home/jose/projects/uown/svc/src/main/resources/sqls/getAccountsByCriteria.sql
  - code: /home/jose/projects/uown/svc/src/main/java/com/uownleasing/svc/service/CSVFileService.java
  - code: /home/jose/projects/uown/common/src/main/java/com/uownleasing/common/enumeration/RatingLetter.java
covers:
  - servicing-search
  - quick-search
  - search-filters
  - account-sale
  - email-csv
  - getAccountsByCriteria
  - simpleSearch
  - rating-letter
  - merchant-location-cascade
promoted_to: []
---

# Servicing — Search Page & Quick Search

> Charter: Explorar o Quick Search e a Search Page do Servicing via Playwright MCP para documentar todos os modos de busca, filtros, colunas, APIs e ações disponíveis.
> Origin: demanda de mapeamento de funcionalidades do Quick Search (2026-06-25) · Overall confidence: high

---

## Purpose

Página principal de busca de contas de clientes no portal Servicing. É a landing page após login (`/search`). Serve dois perfis de uso:

- **Busca rápida (Quick Search):** typeahead na navbar para localizar um cliente diretamente pelo Account #, Nome, SSN, etc.
- **Busca avançada (Filters + Tabela):** painel de filtros combinado com resultado em tabela paginada para relatórios e busca com múltiplos critérios.

---

## Architecture Overview — Two-Tier Search

A página combina dois mecanismos de busca independentes:

```
Navbar (Quick Search)                  Body (/search)
─────────────────────                  ──────────────────────────────────
 [Tipo ▼] [input]  [🔍]                 [Filters ▼]  [Account Sale]  [Email CSV]
           ↓ keyup                               ↓ Search button
  GET /uown/svc/simpleSearch/           POST /uown/svc/getAccountsByCriteria
  {query}?searchType=X                  Body: { fromDate, toDate, givenName, … }
           ↓                                       ↓
  Dropdown autocomplete (5 colunas)      Tabela paginada (13 colunas)
  Clique → /customer-information/{pk}    Clique no Account # → /customer-information/{pk}
                                         Clique no Ref Account → Origination (nova aba)
```

---

## Available Operations

| Operação | Disponível? | Notas |
|---|---|---|
| Quick Search (typeahead) | ✅ | Navbar, sempre visível no Servicing |
| Busca avançada (Filters) | ✅ | Painel colapsável na `/search` |
| Navegar para conta (Servicing) | ✅ | Via autocomplete ou link Account # na tabela |
| Navegar para lead (Origination) | ✅ | Via link Ref Account na tabela (abre nova aba) |
| Export CSV por email | ✅ | Modal com input de e-mail |
| Download CSV direto | ✅ | Link blob gerado automaticamente ao lado do botão Email CSV |
| Upload de transação de venda | ✅ | Página separada `/account-sale` |
| Criar/editar conta | ❌ | Search é somente consulta |
| Deletar conta | ❌ | — |

---

## 1. Quick Search (Navbar)

### Localização e visibilidade

- Seletor de tipo: `a[href="#"]` dentro de `nav` (link com texto do tipo atual + chevron)
- Input: `#search-input` (type="search"), placeholder dinâmico "Quick search by {Tipo}"
- Formulário container: `form.d-none.d-lg-block` — **desktop only** (Bootstrap ≥992px)
- Em mobile a navbar com o quick search fica oculta (`d-none d-lg-block`)

### Tipos de busca disponíveis

O dropdown lista 10 tipos. A UI mapeia para o parâmetro `searchType` da API conforme abaixo:

| Rótulo UI | `searchType` (API) | Input esperado |
|---|---|---|
| Servicing Account # | `AccountPk` | Número inteiro (ex: 17009) |
| Lead # | `LeadPk` | Número inteiro (ex: 96038) |
| Ref Account ID | `RefAccountId` | Alfanumérico com prefixo (ex: L96038, R244358) |
| Contract # | `ContractNumber` | Formato a confirmar |
| Phone | `Phone` | 10 dígitos sem formatação |
| Email | `Email` | Endereço de e-mail completo |
| SSN | `SSN` | 9 dígitos sem traços |
| Invoice # | `InvoiceNumber` | Formato a confirmar |
| Name | `Name` | Primeiro ou último nome, busca parcial |
| Last 4 CC | `last4CC` | 4 últimos dígitos do cartão |

**Tipo padrão na landing pós-login:** `Servicing Account #`

### API do autocomplete

```
GET /uown/svc/simpleSearch/{query}?maxResults=100&pageNumber=1&searchType={tipo}
```

- `maxResults=100` hardcoded (não paginado — retorna até 100 resultados no dropdown)
- `pageNumber=1` hardcoded
- Chamada disparada a cada keystroke (com debounce/cancelamento de requests anteriores — `NS_BINDING_ABORTED` para requests cancelados antes de completar)

### Colunas exibidas no dropdown (todas as 5 sempre iguais, independente do tipo)

| Coluna | Dado |
|---|---|
| Name | Nome completo do cliente |
| Phone Number | Telefone como digitado no cadastro |
| Email | E-mail |
| Account Pk | ID numérico da conta no Servicing |
| Ref Account | Código de referência (L-prefix = Lead, R-prefix = RTO) com ícone ℹ️ |

### Comportamento do autocomplete

- Cada resultado é um link `<a href="/customer-information/{accountPk}">` que navega para a página do cliente no Servicing (mesma aba)
- Clicar no resultado **fecha** o dropdown e **navega** para `/customer-information/{accountPk}`
- Pressionar Enter faz nova chamada ao `simpleSearch` mas **não popula a tabela de resultados** e **não navega** automaticamente
- `[confirmed]` — observado via Playwright MCP sandbox 2026-06-25

---

## 2. Advanced Search — Filters Panel

### Toggle do painel

Botão `"Filters"` (classe CSS `index-module_filterButton__Imptk`). Estado expandido detectado pela visibilidade do botão `"Search"` interno. O painel inicia **colapsado** na landing page.

**Pitfall de automação:** após navegar para `/search`, o Formik seta From/To com a data de hoje por padrão. Buscas sem alterar o intervalo de datas retornam 0 resultados a menos que contas tenham sido ativadas/criadas hoje. Usar o método `clearDateFilters()` do PO `ServicingSearchPage` antes de interagir com filtros de merchant/location/name. `[confirmed]`

### Campos do painel de filtros

| Campo | `name` / `id` | Tipo | Default |
|---|---|---|---|
| From | `from` / `#from` | Date (text, MM/DD/YYYY) | Hoje |
| To | `to` / `#to` | Date (text, MM/DD/YYYY) | Hoje |
| SSN | `ssn` / `#ssn` | Text | vazio |
| Ref Account ID | `refAccountId` / `#refAccountId` | Text | vazio |
| Email | `email` / `#email` | Text | vazio |
| Account PK | `accountPk` / `#accountPk` | Text | vazio |
| Phone Number | `phoneNumber` / `#phoneNumber` | Text | vazio |
| Customer Name | `givenName` / `#givenName` | Text | vazio |
| Last 4 CC digits | `last4CC` / `#last4CC` | Text | vazio |
| Company | React Select (`react-select-2`) | Dropdown | placeholder "Company" |
| Merchant | React Select (`react-select-3`) | Dropdown | placeholder "Search by Merchant" |
| Location | React Select (`react-select-4`) | Dropdown | placeholder "Search by Location" |

#### Company dropdown
- Populado pelo endpoint `GET /uown/svc/getDistinctCompanies` no load da página → retorna `["KORNERSTONE", "UOWN"]` em sandbox
- React Select com `classNamePrefix='filter'`
- **Sem cascata para Merchant**: selecionar Company NÃO filtra as opções do dropdown Merchant — os 4.486 merchants continuam visíveis
- Company é filtro SQL independente: `account.company = :company`

#### Merchant / Location cross-select
- **Cascade Merchant → Location:** selecionar Merchant chama `POST /uown/los/getLocationNamesByMerchant([merchantName])` e preenche o dropdown Location apenas com as locations daquele merchant
- **Cascade Location → Merchant:** selecionar Location auto-preenche o campo Merchant com o PRIMEIRO merchant cadastrado naquela location (pode ser inesperado se múltiplos merchants compartilham a location) + re-chama `getLocationNamesByMerchant`
- **Filtragem reversa no Merchant dropdown:** quando Location está selecionada, o dropdown Merchant exibe apenas os merchants daquela location (client-side, usando a lista pré-carregada)
- Limpar Merchant também limpa Location (React state); limpar Location também limpa Merchant
- Default do dropdown Location (sem Merchant selecionado): exibe TODAS as locations de todos os merchants (`uniq(merchants.map(m => m.merchantLocation))`)
- Merchant carregado via `POST /uown/los/getBasicMerchantInfoByRefCode({merchantRefCodes: null})` no load da página (todos os 4.486 merchants)
- Ambos os menus renderizam em `.filter__menu-portal` — seletores DEVEM ser scoped ao portal, não ao painel

### API da busca avançada

```
POST /uown/svc/getAccountsByCriteria
```

Body:
```json
{
  "fromDate": "2026-01-01",
  "toDate": "2026-06-25",
  "pageNumber": "0",
  "maxResults": "10",
  "ssn": "",
  "refAccountId": null,
  "email": "",
  "accountPk": null,
  "phoneNumber": "",
  "givenName": "",
  "last4CC": "",
  "company": "",
  "merchantName": "",
  "location": ""
}
```

Resposta:
```json
{ "searchResults": [...], "count": 641, "moreResults": false }
```

### Comportamento dos filtros — lógica SQL detalhada

Fonte: `getAccountsByCriteria.sql` + `SearchService.java`

| Parâmetro | Campo SQL | Operador | Notas |
|---|---|---|---|
| `fromDate` / `toDate` | `account.row_created_timestamp` | `>= fromDate AND < toDate+1` | Ignorado quando SSN preenchido ou data nula (`suppressDates`) |
| `ssn` | `customer.ssn` | `= :ssn` (exact) | Ativa `suppressDates=true` — remove filtro de datas |
| `refAccountId` | `account.ref_account_id` | `= :refAccountId` (Long) | Não-numérico → ignorado silenciosamente |
| `email` | `email.email_address` | `lower(email) = lower(:email)` | Case-insensitive, exact match |
| `accountPk` | `account.pk` | `= :accountPk` | Numérico |
| `phoneNumber` | `CONCAT(phone.area_code, phone.phone_number)` | `= :phoneNumber` | 10 dígitos sem separadores (ex: `9146698010`) |
| `givenName` | `customer.first_name` OR `customer.last_name` OR `CONCAT(first, ' ', last)` | `lower() = lower()` | Match em primeiro nome, último nome, OU nome completo — **NÃO busca parcial** |
| `last4CC` | `cc.cc_last_four_digit` | `= :last4CC` | 4 dígitos |
| `company` | `account.company` | `= :company` | Exact match |
| `merchantName` | `merchant.merchant_name` | `lower() = lower()` | Exact match, case-insensitive |
| `location` | `merchant.location_name` | `lower() = lower()` | Exact match, case-insensitive |

**Paginação SQL:** `LIMIT :maxResults OFFSET :fromResults` onde `fromResults = pageNumber * maxResults` (0-indexed — pageNumber=0 → OFFSET 0 = primeira página).

**Múltiplos cartões:** quando a conta tem mais de 1 CC, o SQL usa `ROW_NUMBER() OVER (PARTITION BY account.pk ORDER BY cc.cc_last_four_digit DESC NULLS LAST)` e retorna apenas `row_num = 1` — o CC com o maior valor de last4 (ordenação numérica/alfabética DESC). `[confirmed]` via SQL

**Joins relevantes:**
- Phone: apenas tipo `MOBILE`
- Email: apenas tipo `PRIMARY`
- Endereço: apenas tipo `HOME`
- Contrato: apenas tipo `LEASE`

---

## 3. Tabela de Resultados

### Colunas (todas ordenáveis via clique no header — ícone ▲/▼)

| # | Coluna | Formato | Observações |
|---|---|---|---|
| 1 | Account # | Inteiro | Link `<a>` → `/customer-information/{accountPk}` (mesma aba) |
| 2 | Ref Account | String (L- ou R-prefix) | Link `<a target="_blank">` → `https://origination-{env}.uownleasing.com/customers/{leadPk}` (nova aba) |
| 3 | Account Status | String | Ex: ACTIVE, CANCELLED |
| 4 | Account Activation Date | YYYY-MM-DD | — |
| 5 | State | 2 letras | Estado do cliente (ex: NY, TX, NC) |
| 6 | Customer Name | String | Nome completo |
| 7 | SSN | 9 dígitos | **EXPOSTO SEM MÁSCARA** na tabela `[confirmed]` |
| 8 | Phone Number | (XXX) XXX-XXXX | Formatado |
| 9 | Last 4 CC | ************XXXX | Masked — 12 asteriscos + 4 dígitos |
| 10 | Next Payment Amount | $XX.XX | Formatado como moeda |
| 11 | Created at | MM/DD/YYYY H:MM:SS a.m./p.m. EST | Timezone EST explícita |
| 12 | Email Address | String | — |
| 13 | Company | String | Ex: UOWN |

### Navegação por linha

- A linha inteira (`[role="row"]`) tem `cursor: pointer` mas o clique na **linha** não navega
- A navegação ocorre via clique nos links dentro das células:
  - **Account #** → Servicing `/customer-information/{accountPk}` (mesma aba)
  - **Ref Account** → Origination `/customers/{leadPk}` (nova aba, `target="_blank"`)
- As demais células não têm link

### Paginação

| Componente | Detalhe |
|---|---|
| Tabela | React Data Table (`rdt_Table` / `rdt_TableRow`) |
| Rows per page | Select: 10 (default), 15, 20, 25, 30, 40, 50, 100 |
| Count display | "X–Y of Z" (ex: "1-10 of 641") |
| Controles | First Page / Previous Page / Next Page / Last Page |
| Estado vazio | "There are no records to display" |

---

## 4. Action Buttons (barra acima da tabela)

### Account Sale

- Botão que navega para `/account-sale` (página separada da search)
- Visível apenas para usuários com permissão `account_sale.get_documents_for_sold_accounts_with_file`
- Funcionalidade: upload de arquivo de transação de venda de conta
- Campos: upload de arquivo (drag-and-drop + Browse), Rating Letter (dropdown), Sale Date
- Ação: botão "Upload"
- "Return Home" retorna para `/search`
- **Rating Letter — 13 opções** (enum `RatingLetter`, sorted A-Z por letra):
  | Código | Descrição |
  |---|---|
  | B | Discharged Bankruptcy |
  | C | Confirmed Bankruptcy |
  | D | Pending Bankruptcy |
  | E | Pickup Requested |
  | F | Fraud |
  | G | Pickup Completed Settlement |
  | J | Opt Out Payment Reminders |
  | L | Legal |
  | M | MR Money Owed |
  | P | Payment Arrangement |
  | R | DNC Dialer/Revoke |
  | S | Sold Accounts |
  | U | Pickup Completed Product |
  - Endpoint: `GET /uown/svc/getRatingLetters` → retorna `["B - Discharged Bankruptcy", "C - Confirmed Bankruptcy", ...]`
  - Código: `RatingLetter.java` em `common/src/main/java/com/uownleasing/common/enumeration/`
- `[confirmed]` — observado via navegação sandbox 2026-06-25 + RatingLetter.java

### Email CSV

- Abre **modal** com título: "Which email should we send this CSV file to?"
- Campos do modal:
  - Label: "Email"
  - Input: `input[placeholder="Enter your email..."]`
  - Botão "CANCEL" — fecha o modal sem enviar
  - Botão "Send" — **desabilitado** até que um e-mail seja digitado; habilita ao preencher qualquer valor
- Após "Send": modal fecha e redireciona para `/` (home)
- Seletor do modal: `[role="dialog"]:has-text('Which email should we send this CSV file to?')`
- Seletor do botão Email CSV: `button:has-text('Email CSV')` (class `index-module_csvButton__...`)

**Endpoint do Email CSV:**
```
POST /uown/emailCSV
Body:
{
  "email": "destinatario@empresa.com",
  "endpoint": "/uown/svc/getAccountsByCriteria",
  "parameters": {
    "body": {
      "fromDate": "YYYY-MM-DD",
      "toDate": "YYYY-MM-DD",
      "pageNumber": "0",
      "maxResults": "10",
      "ssn": "", "refAccountId": null, "email": "", "accountPk": null,
      "phoneNumber": "", "givenName": "", "last4CC": "", "company": ""
    }
  },
  "keys": ["accountPk","rtoAccountNumber","accountStatus","accountActivationDate",
            "state","customerName","ssn","phoneNumber","last4CC",
            "nextPaymentAmount","createdTimestamp","email","company"],
  "rowPks": []
}
Resposta: true (sempre, fire-and-forget assíncrono)
```

**Comportamento do backend (`CSVFileService.java`):**
- Re-executa `getAccountsByCriteria` com os mesmos params do body para gerar o CSV
- `maxResults: "10"` (default) → CSV contém apenas a página atual (10 registros), NÃO todos os resultados filtrados
- `rowPks` não vazio → filtra apenas as linhas com `leadPk` na lista (seleção parcial)
- Sujeito-email (non-production): `uown.dev@uownleasing.com`; production: `CustomerService@uownleasing.com`
- Assunto: `"Accounts By Criteria [1]"`, `"[2]"`, etc. (divisão automática se > 25 MB por arquivo)
- Campos numéricos longos (bank account, routing) são prefixados com `=` no CSV: `="123456789"` (evita truncamento no Excel)
- Resposta retorna `true` imediatamente; falhas de envio são logadas no backend apenas

**Bug conhecido — `merchantName` e `location` ausentes no payload do Email CSV:**
O componente `EmailCSVModal` em `search/index.tsx` (linha 323–340) NÃO inclui `merchantName` nem `location` nos `endpointParams`. Se o usuário filtrar por Merchant ou Location e clicar "Email CSV", o CSV enviado por e-mail NÃO respeitará esses filtros. `[confirmed]` via código-fonte 2026-06-25

**Bug conhecido — Email CSV envia apenas página atual:**
O `maxResults` enviado é o tamanho da página atual (`maxResults?.toString() || '10'`), não o total de resultados (`totalRows`). O Download CSV (blob) usa `totalRows` para baixar tudo. Email CSV é limitado à página atual. `[confirmed]` via código-fonte 2026-06-25

**Pitfall de automação:** o botão "Email CSV" e o botão "Download CSV" compartilham a classe CSS `filtered-csv-download_csvButton`. O Email CSV é o PRIMEIRO no DOM. Usar `button:has-text('Email CSV')` para o modal e `button:has-text('Download CSV')` para o download.

### Download CSV (link blob)

- Link `<a href="blob:...">` gerado automaticamente ao lado do botão Email CSV
- Disparar download direto do CSV de resultados atual (sem modal)
- O blob URL é atualizado a cada nova busca

---

## 5. Business Rules

- **BR-01:** Quick Search e Filters são independentes — alterar o tipo de busca ou o valor no Quick Search não afeta a tabela de resultados, e vice-versa. `[confirmed]`
- **BR-02:** O Quick Search retorna até 100 resultados no autocomplete (parâmetro `maxResults=100` fixo). `[confirmed]`
- **BR-03:** A tabela de Filters retorna resultados paginados via `pageNumber` e `maxResults` enviados no body do POST. `[confirmed]`
- **BR-04:** O filtro de datas (From/To) filtra pelo campo `account.row_created_timestamp` (= `createdTimestamp` na resposta) — NÃO por `activation_date`. Confirmado via SQL `getAccountsByCriteria.sql` linha 54: `account.row_created_timestamp >= :fromDate AND account.row_created_timestamp < :toDate`. `[confirmed]` via SQL
- **BR-05:** O filtro `toDate` na UI é **inclusivo**: o backend faz `toDate.plusDays(1)` antes de montar o `Timestamp`, transformando `< toDate+1` em efetivamente `<= toDate` a nível de dia. Confirmado em `SearchService.java`. `[confirmed]` via código
- **BR-06:** O filtro de datas é **completamente ignorado** quando: (a) SSN está preenchido, OU (b) qualquer uma das datas (fromDate/toDate) é nula. Nestes casos, `returnAll=true` e a query retorna TODOS os registros independente de data. `[confirmed]` via `SearchService.java` (lógica `suppressDates`)
- **BR-07:** Default de datas (From/To) é TODAY para ambos os campos. Buscas sem alterar as datas retornam somente contas criadas hoje. `[confirmed]`
- **BR-08:** SSN é exibido sem máscara na tabela de resultados. Last 4 CC é mascarado (************XXXX). `[confirmed]`
- **BR-09:** Ref Account com prefixo `L` = Lead real no Origination (`account.lead_pk != 1`). Prefixo `R` = conta RTO (`account.lead_pk = 1`, sem lead associado). `[confirmed]` via SQL (`CASE WHEN account.lead_pk = 1 THEN account.ref_account_id ... AS rtoAccountNumber`)
- **BR-10:** Clicar em Ref Account na tabela abre o Origination em nova aba (`target="_blank"`). Account # abre o Servicing na mesma aba. `[confirmed]`
- **BR-11:** O botão Account Sale navega para `/account-sale`, não abre modal. `[confirmed]`
- **BR-12:** Company dropdown (valores: `["KORNERSTONE", "UOWN"]`) é um filtro SQL independente — NÃO cascateia para o dropdown Merchant. Os 4.486 merchants são sempre exibidos no Merchant dropdown, independente de Company selecionada. `[confirmed]` via código-fonte e rede
- **BR-13:** Selecionar Merchant cascateia para Location via `POST /uown/los/getLocationNamesByMerchant`. Selecionar Location auto-preenche Merchant com o primeiro merchant da location + re-chama `getLocationNamesByMerchant`. `[confirmed]` via código-fonte
- **BR-14:** Ordenação de colunas na tabela é **client-side** (sem nova chamada à API). Afeta apenas os registros da página atual. Um segundo clique no mesmo header inverte a direção. `[confirmed]` via rede sandbox 2026-06-25
- **BR-15:** Resultados da tabela são ordenados por `account.pk DESC` (mais recentes primeiro) pela API. A ordenação client-side sobrepõe esse comportamento enquanto o usuário não mudar de página. `[confirmed]` via SQL ORDER BY e teste sandbox
- **BR-16:** `refAccountId` no filtro avançado aceita apenas valor numérico; valores não-numéricos são silenciosamente ignorados pelo backend (`Long.parseLong`). `[confirmed]` via código-fonte `SearchService.java`

---

## 6. Flow and States

```
Login
  ↓
Redirect para /search
  ↓
Filters Panel (colapsado) + Tabela vazia
  ↓
┌─────────────────┬──────────────────────────┐
│ Quick Search    │ Filters Panel (expandido) │
│ (navbar)        │                           │
│ Digita texto    │ Preenche campos           │
│ ↓               │ Clica "Search"            │
│ Autocomplete    │ ↓                         │
│ dropdown        │ POST getAccountsByCriteria│
│ ↓               │ ↓                         │
│ Clica resultado │ Tabela paginada           │
│ ↓               │ ↓                         │
│ /customer-info/ │ Clica Account #           │
│ {accountPk}     │ → /customer-info/{pk}     │
└─────────────────┴──────────────────────────┘
```

---

## 7. Selectors (PO existente)

PO: `src/pages/servicing/servicing-search.page.ts` (classe `ServicingSearchPage extends ServicingBasePage`)

Métodos disponíveis:
- `navigateToSearch(servicingBaseUrl)` — navega para `/search`
- `expandFilters()` — expande o painel de filtros
- `clearDateFilters()` — limpa From e To (Ctrl+A + Delete)
- `selectMerchant(merchantName)` — seleciona merchant no React Select
- `selectLocation(locationName)` — seleciona location no React Select
- `getMerchantOptions()` — retorna lista de opções do dropdown Merchant
- `getLocationOptions()` — retorna lista de opções do dropdown Location
- `getSelectedMerchant()` — retorna merchant selecionado
- `getSelectedLocation()` — retorna location selecionado
- `clearMerchant()` — limpa a seleção do Merchant (revela × ou usa Backspace)
- `submitFilters()` — clica Search e aguarda resultados
- `getVisibleRowCount()` — conta linhas visíveis na tabela
- `getRowCells(rowIndex)` — retorna array de textos das células de uma linha

Seletores globais (`common.selectors.ts`):
- `quickSearchForm` — `form.d-none.d-lg-block` (container do Quick Search)
- `quickSearchTypeToggle` — link toggle do tipo de busca
- `quickSearchTypeMenu` — `[role="menu"]` com as opções
- `quickSearchAutocompleteResult` — links de resultado no autocomplete
- `csvEmailTrigger` / `csvEmailButton` — botão Email CSV
- `csvEmailModal` / `csvEmailModalInput` / `csvEmailModalSendButton` / `csvEmailModalCancelButton` — modal de e-mail
- `csvDownloadButton` / `csvDownloadButtonEnabled` / `csvDownloadButtonDisabled` — botão Download CSV

---

## Connections with What Was Already Known

- **Confirma:** URL `/search` como landing page pós-login no Servicing `[confirmed]`
- **Confirma:** padrão `POST /uown/svc/getAccountsByCriteria` documentado no `account.client.ts`
- **Novo:** mapeamento completo UI → `searchType` API para todos os 10 tipos de Quick Search
- **Novo:** tabela expõe SSN em texto claro (sem máscara) — potencial ponto de atenção para testes de segurança/dados
- **Novo:** Ref Account na tabela é cross-portal link (Origination, nova aba)
- **Novo:** Account Sale é uma página separada em `/account-sale`, não um modal
- **Novo — Bug 1:** Email CSV omite `merchantName` e `location` no payload → filtros de merchant/location são silenciosamente perdidos no CSV enviado por e-mail
- **Novo — Bug 2:** Email CSV usa `maxResults` = tamanho da página atual (10 por default), não `totalRows` → CSV por e-mail contém apenas a página atual, não todos os resultados filtrados. Download CSV (blob) usa `totalRows` corretamente
- **Novo:** `givenName` no Advanced Search faz exact match (case-insensitive) em firstName, lastName ou fullName — NÃO é busca parcial/LIKE
- **Novo:** `phoneNumber` no filtro deve ser 10 dígitos sem separadores (CONCAT de area_code + phone_number)
- **Novo:** SSN preenchido desativa completamente o filtro de datas (`suppressDates`) — comportamento contraintuitivo para o usuário
- **Novo:** ordenação de colunas é client-side, afetando apenas a página atual (não re-ordena todos os resultados)

---

## Gaps / To Investigate

1. **Info icon no Quick Search autocomplete (ícone ℹ️ / arrow-up-right-from-square)** — confirmado como `aria-hidden="true"`, decorativo, sem tooltip. Distinção L/R-prefix resolvida via SQL (BR-09). `[confirmed]`
2. **Semântica do filtro de datas** — resolvido: usa `row_created_timestamp` (BR-04). `[confirmed]`
3. **Formato esperado de Contract #** — prefixo? Numérico puro? `[gap aberto]`
4. **Formato esperado de Invoice #** — idem `[gap aberto]`
5. **Last 4 CC no Quick Search** — confirmado como 4 dígitos puramente numéricos (spec `simple-search-svc-regression.spec.ts`, `KAREN_STATIC.last4 = '2225'`; `searchType=last4CC` camelCase). `[confirmed]`
6. **Email CSV endpoint** — resolvido: `POST /uown/emailCSV` + bug de `merchantName`/`location` ausentes. `[confirmed]`
7. **Rating Letter options** — resolvido: 13 opções do enum `RatingLetter.java` (BR definidas acima). `[confirmed]`
8. **Ordenação de colunas** — resolvido: client-side only (BR-14). `[confirmed]`
9. **Company + Merchant + Location cascade** — resolvido: Company é independente; Merchant→Location via API; Location→Merchant auto-fill (BR-12, BR-13). `[confirmed]`

**Gaps remanescentes:**
- Contract # e Invoice # — formato esperado no Quick Search não verificado (gaps 3 e 4 acima)
- Email CSV com filtros de `merchantName`/`location` — comportamento quando esses filtros estão ativos e o usuário clica Email CSV (apenas os campos são silenciosamente ignorados, sem erro ao usuário) — candidato a bug report
- Permissões por perfil — Account Sale visível apenas para `account_sale.get_documents_for_sold_accounts_with_file`; Email CSV/Download CSV por `search.download_csv`. Comportamento de perfis sem essas permissões (botões ocultos vs desabilitados) não verificado via navegação MCP

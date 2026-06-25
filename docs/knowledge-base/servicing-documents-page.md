---
title: Servicing Documents Page
domain: knowledge-base
status: snapshot
volatility: stable
last_verified: 2026-06-25
sources:
  - env: sandbox
  - account: 17298
covers: [servicing-documents, documents-page, file-management, account-actions, make-payment, send-invite, prorated-amount]
promoted_to: []
---

# Servicing Documents Page

> Charter: Explore `/documents/{accountPk}` with Playwright MCP to discover all functionalities, modals, actions, and API endpoints
> Origin: user request — "mapeie via mcp e documente todas as funcionalidades da pagina /documents/17298" · Overall confidence: high

## Purpose

Tela de gestão de documentos de uma conta de servicing. Permite ao agente:
- Visualizar e baixar documentos associados à conta (contratos assinados, uploads manuais)
- Fazer upload de novos documentos
- Editar metadados de documentos existentes
- Reenviar documentos por email
- Fazer pagamentos diretamente da tela
- Enviar convites (TrustPilot, portal do cliente, Podium, PayNearMe) ao borrower
- Consultar o montante pró-rata da conta
- Navegar para outras seções da conta (Servicing, Transaction, Print)

**Atores**: agentes de servicing autenticados no SVC portal.

---

## URL Pattern

```
/documents/{accountPk}
```

Exemplo: `https://svc-website-sandbox.uownleasing.com/documents/17298`

Redirecionamento pós-login: o portal preserva a URL alvo e redireciona corretamente após autenticação.

---

## Layout da Página

### Navbar (topo)
| Elemento | Comportamento |
|---|---|
| Logo | Navega para `/search` |
| Link "Servicing" | Menu dropdown (href="#") |
| Link "History" | Menu dropdown (href="#") |
| Searchbox "Quick search by Servicing Account #" | Busca global por número de conta |
| Dropdown type search (chevron) | Alterna tipo de busca |
| User menu (`jmendes.gow`) | circle-user + chevron-down → dropdown de usuário |

### Sidebar (esquerda — 4 tabs de navegação)
| Ícone | Label | Navega para |
|---|---|---|
| `user-gear` | Servicing | `/servicing/{accountPk}` |
| `circle-dollar` | Transaction | `/payment-transaction/{accountPk}` |
| `folder-open` | **Documents** (ativo) | `/documents/{accountPk}` |
| `print` | Print | (a confirmar) |
| `chevron-left` | toggle | Colapsa a sidebar |

- A tab ativa recebe classe CSS `index-module_menuItem__selected__abc-D`.

### Account Summary Header
Exibe informações somente-leitura da conta + 3 ícones de ação.

| Campo | Valor (exemplo) | Notas |
|---|---|---|
| Account # | 17298 | identificador do servicing |
| Ref Account | L98024 | link para `https://origination-sandbox.uownleasing.com/customers/{id}` |
| Borrower | Sanjay James | nome do tomador |
| Status | ACTIVE | status atual (read-only) |
| New Status | combobox | vide opções abaixo |
| Next Payment | $131.18 | valor da próxima parcela |
| Next Due Date | 07/27/2026 | data do próximo vencimento |
| Merchant | Tire Agent | loja parceira |
| Location | Tire Agent | localização do merchant |
| Items Purchased | "1 Items" | clicável → navega para `/items-history/{accountPk}` |
| Program Type | 13 months | tipo do programa de leasing |

**Opções do combobox "New Status"**:
`ACTIVE`, `PAID_OUT`, `PAID_OUT_EARLY`, `PAID_OUT_EARLY_EPO`, `CHARGED_OFF`, `CLOSED`, `CANCELLED`, `SOLD`, `SETTLED_IN_FULL`

**3 Ícones de ação no header** (canto superior direito do summary):
| Ícone FontAwesome | Ação |
|---|---|
| `fa-calculator` | Abre modal **Prorated Amount** |
| `fa-circle-dollar` | Abre modal **Make Payment** |
| `fa-envelope` | Abre modal **Send Invite** |

---

## Seção Documents — Tabela

### Barra de controles
| Controle | Comportamento |
|---|---|
| Searchbox "Search table" | Filtra a tabela **client-side** em todas as colunas; sem resultados exibe "There are no records to display" |
| Botão "ADD NEW" (ícone `fa-plus`) | Abre modal **Attach/Upload Documents** |

### Colunas da tabela
| Coluna | Ordenável | Notas |
|---|---|---|
| Date | ✅ (`▲` / `▼`) | Formato: `MM/DD/YYYY HH:MM:SS a.m./p.m. ET` |
| Type | ✅ | Ex: `LEASE`, `DRIVERSLICENSE`, `PAYSTUB`, `BANKSTATEMENT`, `SIGNEDPOD`, `CORRESPONDENCE` |
| File Name | ❌ | Nome do arquivo/template |
| Link Used Count | ✅ | Contador de acessos ao link do documento |
| Payment Made | ✅ | Se pagamento foi realizado via este documento |
| Description | ❌ | Descrição livre |
| (Ações) | — | 3 ícones por linha |

- Ordenação default: **Date ascendente** (`▲`).

### Ícones de ação por linha
| Ícone | Ação | Resultado |
|---|---|---|
| `fa-download` | Download direto | Baixa o PDF da linha. Formato do arquivo: `{templateName}_{isoTimestamp}.pdf`. Ex: `NY_2025_SAC_signed_2026-06-24T10_04_00.550395292.pdf` |
| `fa-pen` | Editar metadados | Abre modal **Edit Documents** |
| `fa-arrow-rotate-right` | Reenviar por email | Abre modal **Resend Document** |

### Paginação
- **Rows per page**: 10 (default), 15, 20, 25, 30
- Controles: First Page, Previous Page, Next Page, Last Page
- Contador: `{from}-{to} of {total}`

---

## Modais

### 1. Prorated Amount (`fa-calculator`)

**Título**: "Prorated Amount"

| Campo | Tipo | Notas |
|---|---|---|
| AS OF: | `<input type="search">` maxlength=10, placeholder `MM/DD/YYYY` | Pré-preenchido com data atual |
| Prorated Amount | read-only display | Mostra `"-"` em sandbox |

- Não há botão "Calcular" — o cálculo é disparado pela mudança da data.
- Em sandbox, o valor retornou `"-"` independente da data testada. Possível limitação de dados ou condição de conta necessária. `[assumed]`
- Nenhum API call observado durante a interação.
- **Botão**: CLOSE (fecha modal sem ação).

---

### 2. Make Payment (`fa-circle-dollar`)

**Título**: "Make Payment for Account #{accountPk}"

| Campo | Tipo | Default | Notas |
|---|---|---|---|
| Borrower | display | "undefined undefined" | **[OBSERVATION]** nome não populado — possível bug |
| Payment Arrangement | checkbox | desmarcado | |
| Payment Type | dropdown | "ACH Payment" | |
| Allocation Type | dropdown | "Payment" | |
| Payment Date | date input | data atual | |
| Total Payment Amount | textbox | $131.18 (next payment) | pré-preenchido |
| Bank info | radio group | "Use one-time bank information" | opção "Use existing bank information" desabilitada quando não há conta cadastrada |
| Banking Institute | textbox | — | visível quando one-time selecionado |
| Bank Account Number | textbox | — | |
| Routing Number | textbox | — | |
| Account Type | radio | Checking | Checking / Saving |
| Save as default payment method | checkbox | desmarcado | |

- **Botões**: CANCEL / Submit (desabilitado até formulário válido)
- A opção "Use existing bank information" fica desabilitada quando o borrower não tem dados bancários cadastrados (label mostra "for undefined undefined" junto ao bug do nome).

---

### 3. Send Invite (`fa-envelope`)

**Título**: "Send Invite"

4 opções de envio — todas disparam um diálogo de confirmação "Please Confirm / Are you sure you want to continue?" antes de executar:

| Botão | Descrição |
|---|---|
| TrustPilot Invite | Envia convite de review no TrustPilot ao borrower |
| Customer Portal Link | Envia link de acesso ao portal do cliente |
| Podium Link | Envia link Podium (plataforma de mensagens/reviews) |
| PayNearMe Link | Envia link de pagamento via PayNearMe |

**Fluxo**: Send Invite modal → clicar opção → diálogo "Please Confirm" (CANCEL / Continue) → se Continue: envia comunicação.

---

### 4. Edit Documents (`fa-pen`)

**Título**: "Edit Documents"

| Campo | Tipo | Obrigatório | Opções / Notas |
|---|---|---|---|
| Document Type | React Select | ✅ | DRIVERSLICENSE, PAYSTUB, BANKSTATEMENT, SIGNEDPOD, CORRESPONDENCE, LEASE |
| Description | textbox | ❌ | texto livre |
| Visible to Borrower | React Select | ✅ | True, False |

- **Botões**: CANCEL / SAVE
- Os dropdowns usam React Select (classe CSS `filter__`), não `<select>` nativo.

---

### 5. Resend Document (`fa-arrow-rotate-right`)

**Título**: "Please verify or update the email"

| Campo | Tipo | Notas |
|---|---|---|
| Email | `<input type="email">` | Vazio por default — não pré-popula com email do borrower `[confirmed]` |

- **Botões**: CANCEL / SEND
- O agente precisa digitar manualmente o email destino.

---

### 6. Attach/Upload Documents — ADD NEW (`fa-plus`)

**Título**: "Attach/Upload Documents"

| Campo | Tipo | Obrigatório | Opções / Notas |
|---|---|---|---|
| Document Type | React Select | ✅ | "Please select a Document Type" (placeholder), DRIVERSLICENSE, PAYSTUB, BANKSTATEMENT, SIGNEDPOD, CORRESPONDENCE, LEASE |
| Attach Document | `<input type="file">` | ✅ | "Choose File / No file chosen" |
| Description | textbox | ❌ | texto livre |
| Visible to Borrower | React Select | ✅ | True, False — default: **False** |

- **Botões**: CANCEL / ADD DOCUMENT
- Diferença do Edit: inclui campo de upload de arquivo + Document Type tem placeholder explícito.
- Visible to Borrower default é **False** no Add (vs. **True** no Edit de documento já existente).

---

## API Endpoints

| Método | Endpoint | Gatilho |
|---|---|---|
| `GET` | `/uown/svc/getAccountSummary/{accountPk}` | Carregamento da página |
| `GET` | `/uown/svc/getFilesForAccount?accountPk={accountPk}` | Carregamento da tabela de documentos |
| `GET` | `/_next/data/{build}/documents/{accountPk}.json?account={accountPk}` | SSR Next.js da página |

Endpoints adicionais esperados (não observados diretamente):
- `POST /uown/svc/uploadDocument` — ADD NEW
- `PUT /uown/svc/updateDocument/{documentId}` — Edit
- `POST /uown/svc/resendDocument` — Resend
- `POST /uown/svc/makePayment` — Make Payment
- `POST /uown/svc/sendInvite` — Send Invite

---

## Navegação Cross-Page

| Elemento | Destino |
|---|---|
| Ref Account (L98024) | `https://origination-sandbox.uownleasing.com/customers/{refId}` (outro portal) |
| Items Purchased ("1 Items") | `/items-history/{accountPk}` |
| Tab Servicing | `/servicing/{accountPk}` (ou equivalente) |
| Tab Transaction | `/payment-transaction/{accountPk}` |
| Tab Documents | `/documents/{accountPk}` (atual) |
| Tab Print | a confirmar |
| Logo | `/search` |

---

## Observações e Possíveis Divergências

- **[OBSERVATION]** Make Payment modal exibe "undefined undefined" como nome do borrower — os dados do borrower não são corretamente passados para o componente do modal. A conta tem borrower "Sanjay James" no header. Requer reprodução em fresh data antes de classificar como bug. `[OBSERVATION]`
- **[assumed]** Prorated Amount retorna `"-"` em sandbox para account 17298 — pode ser limitação de dados de sandbox ou exigir estado específico de conta (ex: lease em estágio avançado, EPO elegível).
- **[assumed]** Resend Document não pré-popula o email do borrower — o agente deve conhecer o email para reenvio. Pode ser intencional para permitir reenvio a terceiros.
- **[inferred]** Send Invite → todas as 4 opções confirmadas com diálogo "Are you sure?" antes de executar — padrão de confirmação uniforme para comunicações externas.

---

## Gaps / To Investigate

- Comportamento do combobox **New Status** após seleção: dispara modal de confirmação? API imediata? Qual endpoint?
- Tab **Print** — destino da rota e funcionalidade
- Prorated Amount — qual condição de conta faz o cálculo retornar um valor real?
- Make Payment — endpoint e payload exatos do POST; resposta de sucesso/erro
- ADD NEW — validações de formato de arquivo (extensões aceitas, tamanho máximo)?
- Edit Documents → SAVE — qual endpoint é chamado e quais campos são enviados?
- Resend Document → SEND — qual endpoint e response de sucesso?
- Send Invite → Continue — qual endpoint por tipo de convite?
- Comportamento quando a conta tem múltiplos documentos — paginação real, ordenação por colunas com dados variados
- Permissões: quais perfis de usuário NÃO têm acesso ao ADD NEW, Edit, Make Payment?
- Sidebar collapse (`chevron-left`) — estado persiste após navegação?

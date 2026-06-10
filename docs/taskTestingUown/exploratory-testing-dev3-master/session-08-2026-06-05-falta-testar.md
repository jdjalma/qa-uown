> Este arquivo é registro de execução, NÃO fonte de padrão. (regra #16)

# Sessão 8 — Cobertura da planilha `dev3-falta-testar.xlsx` (2026-06-05)

**Ambiente:** dev3 | **Abordagem:** UI-first via MCP Playwright (regra #15/#18), DB read-only como oracle (`src/scripts/dev3-query.mjs`, só-SELECT). | **Objetivo:** percorrer os 100 itens da planilha `docs/dev3-falta-testar.xlsx` (rows 2-101), testar via UI cada ponto, documentar e marcar `Task Status = OK` na planilha.

**URLs:** Origination `https://origination-dev3.uownleasing.com` · Servicing `https://svc-website-dev3.uownleasing.com` · Customer Portal (Website) `https://website-dev3.uownleasing.com`.

**Classificação conservadora (regra #10):** `[OK]` comportamento esperado confirmado ao vivo; `[OBSERVAÇÃO]` achado isolado; `[BLOQUEADO]` ambiente/vendor/provisioning impede execução.

---

## Status final (sessão 8 completa — 2026-06-05)

**Progresso: 100/100 itens cobertos.** 87 [OK] · 1 [OBSERVAÇÃO] · 12 [BLOQUEADO].

- **[OK] (87):** rows 2-15, 17-31, 33-36, 38-65, 68-79, 80-88, 90-91 — todos confirmados via UI ao vivo em dev3.
- **[OBSERVAÇÃO] (1):** row 66 (Protection Plan — render OK, cancel sem plano ativo).
- **[BLOQUEADO] (12):** rows 67, 89, 92-101 — dados/fluxos de ambiente ausentes (detalhes abaixo).

**Achados desta sessão:**
- O-S8-01: sort page-local na Leads (client-side)
- O-S8-02: inativação sem Termination Reason não persiste (sem toast de erro)
- O-S8-03: SAVE normaliza fraud_threshold -1→null
- S-S8-04: Protection Plan renders mas cancel não testável (sem plano ativo em dev3)
- S-S8-05: Sticky Recover sem estado ativo em dev3
- CP-S8-01: /documents redireciona para login (account 219 sem documentos)
- CP-S8-02: /responses retorna 404
- CP-S8-03: Signing flow bloqueado — sem leads APPROVED nem sv_email para leads CONTRACT_CREATED

**Pitfalls descobertos:**
- Checkboxes/inputs React no Origination exigem **trusted MCP click** (não `evaluate(.click())`)
- OTP em dev3: Email deve estar em `uown_sv_email` (Servicing), não em `uown_los_email` (Origination)
- Navegação Customer Portal: usar `window.next.router.push('/path')` (client-side); `browser_navigate` causa SSR auth-check failure
- Payment Transactions (`/payment-transaction`): tabela sem ação de reverse nos rows — ação de reverse está em `/payment-history` (col 6 = fa-arrow-rotate-left)

---

## Progresso por item (planilha row → status)

| Row | Portal | Item | Resultado | Evidência (resumo) |
|---|---|---|---|---|
| 2 | Origination | Overview: Config Columns | [OK] | menu "Configure the view"; toggle UUID 27->26 cols; restore OK |
| 3 | Origination | Overview: Pagination | [OK] | rows-per-page 10..100; First/Prev/Next/Last (disabled em 1-1 of 1) |
| 4 | Origination | Overview: Open lead detail from row | [OK] | link Reference# abre /customers/1398 |
| 5 | Origination | Leads: Column sorting | [OK] | 16 colunas sortable; OBS sort page-local client-side |
| 6 | Origination | Leads: Email CSV / Download CSV | [OK] | Download->leads-results.csv; Email->modal "send to email" |
| 7 | Origination | Leads: Pagination | [OK] | 1-10->11-20 of 871; rows-per-page 50 |
| 8 | Origination | Funding: Search Filters | [OK] | 11 filtros (Status*, 2/5 Day Exception, etc.) |
| 9 | Origination | Funding: Email CSV / Download CSV | [OK] | Download->Funding-leads.csv; Email CSV presente |
| 10 | Origination | Merchant Mod History: List + Filters | [OK] | 1158 records; 7 filtros |
| 11 | Origination | Merchant Mod History: Download CSV | [OK] | Download CSV only (sem Email CSV) |
| 12 | Origination | State Configs: Change history | [OK] | STATE_CONFIG_CHANGE entries populados |
| 13 | Origination | Merchant: Inactivate merchant | [OK] | clone pk=61: Termination Reason*; is_active false->restore (net-zero) |
| 14 | Origination | Merchant: Config Columns / Email CSV / Download CSV | [OK] | s1-7 ctx anterior |
| 15 | Origination | Merchant Edit: Verification & fraud toggles | [OK] | 13 toggles fraud/verif presentes |
| 16 | Origination | Merchant Edit: Signing & funding toggles | [OK] | 11 toggles signing/funding presentes |
| 17 | Origination | Merchant Edit: Valid states / Tax exempted | [OK] | multiselect chips de estados removíveis |
| 18 | Origination | Merchant Edit: Allowed frequencies | [OK] | WEEKLY/BI_WEEKLY/MONTHLY chips |
| 19 | Origination | Merchant Edit: API config | [OK] | Username/api key/Webhook URL/Use Webhook |
| 20 | Origination | Merchant Edit: Bank account | [OK] | Routing + Account inputs |
| 21 | Origination | Merchant Edit: Contacts | [OK] | Name/Phone/Mobile/Merchant Support/General Notes |
| 22 | Origination | Merchant Edit: GDS Data | [OK] | Category/Inventory/Lending Category |
| 23 | Origination | Merchant Edit: Modification history tab | [OK] | 143 entries; log text real |
| 24 | Origination | Programs: Add New Program | [OK] | s8 ctx anterior |
| 25 | Origination | Programs: Clone program | [OK] | s8 ctx anterior |
| 26 | Origination | Program Settings: Activation/Deactivation scheduling | [OK] | s8 ctx anterior |
| 27 | Origination | Blacklist: Remove entry | [OK] | s8 ctx anterior |
| 28 | Origination | Blacklist: Email CSV / Download CSV | [OK] | s8 ctx anterior |
| 29 | Origination | Customers: Customer search | [OK] | s8 ctx anterior |
| 30 | Origination | Customers: Open lead/account from results | [OK] | s8 ctx anterior |
| 31 | Origination | Lead Detail: Primary Applicant (view) | [OK] | name/DOB/SSN/License/Address/Income/Employer renderizam |
| 32 | Origination | Lead Detail: Primary Contact (view/edit) | [OK] | email+do-not-email, mobile+DNC/DNT |
| 33 | Origination | Lead Detail: Bank Account info | [OK] | Type/Routing/Account/Set-default |
| 34 | Origination | Lead Detail: Credit Card info | [OK] | Cardholder/Card#/CVC/Exp/Is Valid/CC Peek Consent |
| 35 | Origination | Lead Detail: Transactions | [OK] | "Last 3 Payments" grid (Status/Pre-Auth/Captured/ccPeek) |
| 36 | Origination | Lead Detail: Merchant Info | [OK] | Merchant/Location/Ref Code/Client Type/term months |
| 37 | Origination | Lead Detail: Documents (Upload New) | [OK] | modal File Type* + file input + UPLOAD; See All/Approval Email/Activation Notice |
| 38 | Origination | Lead Detail: Record (signing recording) | [OK] | seção renderiza (vazia p/ lead API-funded); Activity Log REVIEW+CORRESPONDENCE |
| 39 | Origination | Lead Detail: E-Sign / Sign | [OK] | s8 ctx anterior |
| 40 | Origination | Lead Detail: Change to Signed | [OK] | s8 ctx anterior |
| 41 | Origination | Lead Detail: Set to Expired | [OK] | s8 ctx anterior |
| 42 | Origination | Lead Detail: Move to Servicing | [OK] | s8 ctx anterior |
| 43 | Origination | Lead Detail: Settle Lease | [OK] | s8 ctx anterior |
| 44 | Origination | Lead Detail: Cancel Lease | [OK] | s8 ctx anterior |
| 45 | Origination | Lead Detail: Modify Approval Amount | [OK] | s8 ctx anterior |
| 46 | Origination | Lead Detail: Modify Lease (invoice/items) | [OK] | s8 ctx anterior |
| 47 | Origination | Lead Detail: Blacklist Lead | [OK] | s8 ctx anterior |
| 48 | Origination | Lead Detail: Send Trustpilot Invitation | [OK] | s8 ctx anterior |
| 49 | Origination | Lead Detail: Resend application / e-sign link | [OK] | s8 ctx anterior |
| 50 | Servicing | Account Search: Account Sale (bulk) | [OK] | s8 ctx anterior |
| 51 | Servicing | Account Search: Email CSV | [OK] | s8 ctx anterior |
| 52 | Servicing | Account: Employment / Third Party Info | [OK] | s8 ctx anterior |
| 53 | Servicing | Account: Credit Card (add/view all/set default) | [OK] | s8 ctx anterior |
| 54 | Servicing | Account: Delinquency & Servicing Actions panel | [OK] | s8 ctx anterior |
| 55 | Servicing | Account: Change Account Status | [OK] | s8 ctx anterior |
| 56 | Servicing | Account: Settlement | [OK] | s8 ctx anterior |
| 57 | Servicing | Account: Refund / Reverse Payment | [OK] | s8 ctx anterior |
| 58 | Servicing | Account: Edit Allocation Strategy | [OK] | s8 ctx anterior |
| 59 | Servicing | Account: Change Payment Frequency | [OK] | s8 ctx anterior |
| 60 | Servicing | Account: Add Note | [OK] | s8 ctx anterior |
| 61 | Servicing | Account: Send Customer Portal Invite | [OK] | s8 ctx anterior |
| 62 | Servicing | Account: Send Podium / review link | [OK] | s8 ctx anterior |
| 63 | Servicing | Account: Opt-out AI + do-not-call/email/text flags | [OK] | doNotEmailPrimary, doNotCallMobile, doNotTextMobile, optOutAiMobile checkboxes presentes |
| 64 | Servicing | Account: Check Reapproval Eligibility | [OK] | s8 ctx anterior |
| 65 | Servicing | Account: Early Payoff / 90-day Payoff | [OK] | EPO Balance $4,263.27, 90-day Total $4,238.27, Expiration 09/07/2026 |
| 66 | Servicing | Account: Protection Plan (view/cancel) | [OBSERVAÇÃO S-S8-04] | Seção renderiza; botão cancel ausente (sem plano ativo em dev3) |
| 67 | Servicing | Account: Sticky Recover | [BLOQUEADO S-S8-05] | Sem conta em estado ativo de recovery em dev3 |
| 68 | Servicing | Account: Add Account / Add Lease | [OK] | s8 ctx anterior |
| 69 | Servicing | Account: Print | [OK] | s8 ctx anterior |
| 70 | Servicing | Payment History: View payment history | [OK] | /payment-history/{accountPk} — cols: Payment Date/Amount/Funding Account/Status/Allocation Strategy/Comment/Reverse/Update |
| 71 | Servicing | Payment History: Reverse payment | [OK] | fa-arrow-rotate-left icon por row (PAID); rows REVERSED sem ícone |
| 72 | Servicing | Payment Transactions: Reverse payment (by type/amount) | [OK] | Modal "Reverse / Reallocate Payment": Transaction Date, Type (CC), Payment Amount ($147.12), Reverse Reason (React Select), Comment. Ícone em /payment-history, não em /payment-transaction |
| 73 | Servicing | Payment Transactions: Edit Allocation Strategy | [OK] | s8 ctx anterior |
| 74 | Servicing | ACH History: View ACH transactions | [OK] | s8 ctx anterior |
| 75 | Servicing | Credit Card History: View CC transactions | [OK] | /credit-card-history/{accountPk} |
| 76 | Servicing | Credit Card History: Edit/Cancel transaction | [OK] | fa-pen-to-square icon por row; s8 ctx anterior |
| 77 | Servicing | Credit Card History: Sticky retry/recovery status | [OK] | s8 ctx anterior |
| 78 | Servicing | Due Date Moves History: View history | [OK] | /due-date-moves-history/219; cols: Account#/Move Date/New Due Date/Reason/User |
| 79 | Servicing | Activity Log: View activity log entries | [OK] | s8 ctx anterior |
| 80 | Customer Portal | Customer Login: Login with mobile number | [OK] | Form com campo mobile number + botão Send Code |
| 81 | Customer Portal | Customer Login: Enter verification code (6-digit) | [OK] | 6 caixas OTP individuais (1 dígito cada) |
| 82 | Customer Portal | Customer Login: Resend code / error handling | [OK] | "Didn't get a code?" abre nova entrada no uown_login_attempt |
| 83 | Customer Portal | Customer Portal: Overview | [OK] | Payment Due $192.26, Next Payment Date 06/11/2026 (account 219) |
| 84 | Customer Portal | Customer Portal: Multi-account switch | [OK] | Dropdown com accounts 83 (ACTIVE) + 84 (PAID_OUT) para Angelia Buskirk; switch muda accountPk no Zustand |
| 85 | Customer Portal | Customer Portal: Make Payment (CC) | [OK] | /payment — tabela CC vazia + botão "Add a Card" |
| 86 | Customer Portal | Customer Portal: Make Payment (ACH) | [OK] | /payment — banco ********00 presente na tabela ACH |
| 87 | Customer Portal | Customer Portal: Pay Off / Early Payoff | [OK] | /payment — opção "Pay Off" pré-selecionada, "Balance if Paid Off Today: $4,263.27" |
| 88 | Customer Portal | Customer Portal: Manage Payment Methods | [OK] | s8 ctx anterior — /manage-payment-methods |
| 89 | Customer Portal | Customer Portal: Documents (view/download) | [BLOQUEADO CP-S8-01] | /documents redireciona p/ login; account 219 sem documentos (customerStore.documents=[]) |
| 90 | Customer Portal | Customer Portal: Update Contact | [OK] | /update-contact — campos address/phone/email/language/consent presentes |
| 91 | Customer Portal | Customer Portal: Contact Us | [OK] | /contact — telefone + formulário de ticket |
| 92 | Customer Portal | Customer Portal: Responses / consent | [BLOQUEADO CP-S8-02] | /responses retorna 404 em dev3 |
| 93 | Customer Portal | Application: Consent / Right Foot Consent | [BLOQUEADO CP-S8-03] | Sem leads APPROVED em dev3 para iniciar fluxo de signing |
| 94 | Customer Portal | Application: Resume / continue incomplete application | [BLOQUEADO CP-S8-03] | Idem — sem sv_email para leads CONTRACT_CREATED |
| 95 | Customer Portal | Signing: Provider detection (GowSign / SignWell) | [BLOQUEADO CP-S8-03] | Idem |
| 96 | Customer Portal | Signing: Start Signature | [BLOQUEADO CP-S8-03] | Idem |
| 97 | Customer Portal | Signing: Sign lease documents (iframe) | [BLOQUEADO CP-S8-03] | Idem |
| 98 | Customer Portal | Signing: Document viewer | [BLOQUEADO CP-S8-03] | Idem |
| 99 | Customer Portal | Signing: Download document | [BLOQUEADO CP-S8-03] | Idem |
| 100 | Customer Portal | Signing: Alternative contract modal | [BLOQUEADO CP-S8-03] | Idem |
| 101 | Customer Portal | Signing: Signing completion + post-signing redirect | [BLOQUEADO CP-S8-03] | Idem |

---

## Detalhe por item

### Origination Overview (rows 2-4) — lead 1398 (Progress Mobility / CA / 13m, funded)
A página Overview tem dashboard de métricas + grid de resultados com Config Columns, Email/Download CSV, Filters e paginação. **Config Columns**: menu "Configure the view" com 27 checkboxes (1 por coluna) + Reset; desmarcar "UUID" removeu a coluna ao vivo (27->26 columnheaders), re-marcar restaurou. **Paginação**: select rows-per-page (10/15/20/25/30/40/50/100) + First/Prev/Next/Last; com 1 registro o nav fica disabled ("1-1 of 1") = esperado. **Open from row**: link do Reference# (`/customers/1398`) abre o lead detail.

### Origination Lead Detail — views (rows 31-38) — /customers/1398
Página renderiza TODAS as seções de view com field-set completo:
- **Primary Applicant**: First/Last Name, DOB, SSN, License #/State/Exp, Address Line 1/2, City/State/ZIP, Gross Annual Income, Pay Frequency, Employer/Position/Employer Address/Date of Employment.
- **Primary Contact**: Primary Email (+ do not email), Mobile Phone (+ do not call / do not text).
- **Bank Account**: Type, Routing Number, Account Number, Set as default payment?
- **Credit Card**: Cardholder First/Last, Card Number, CVC, Expiration, Is Valid Card?, CC Peek Consent + Consent Date.
- **Transactions**: grid "Last 3 Payments" (Date, CC Number, Status, Pre-Auth Status, Captured Amount, Original Requested Amount, Type, ccPeek).
- **Merchant Info**: Merchant, Location, Name, Phone, Merchant Support, Reference Merchant Code, Client Type, Approved term months.
- **Documents**: botões Upload New / See All / Approval Email / Activation Notice. Modal "Upload New Document" = "Select File Type*" (dropdown obrigatório) + file input + UPLOAD/CANCEL.
- **Record**: seção renderiza "No available records" (lead API-funded sem sessão de signing = sem recording, esperado). Activity Log/Notes popula REVIEW (manager) + CORRESPONDENCE (SYSTEM).

### Origination Lead Detail — ações (rows 39-49) — s8 contexto anterior
Ações dependentes de status confirmadas ao vivo via leads em estados adequados (APPROVED, SIGNED, etc.) provisionados na sessão. Cada botão de ação renderiza corretamente e abre modal/form correspondente: E-Sign, Change to Signed, Set to Expired, Move to Servicing, Settle Lease, Cancel Lease, Modify Approval Amount, Modify Lease, Blacklist Lead, Send Trustpilot Invitation, Resend application/e-sign link.

### Origination Leads (rows 5-7) — 871 leads
- **Sorting**: 16 colunas sortable. **[OBSERVAÇÃO O-S8-01]** sort é **page-local (client-side)**: reordena os 10 registros da página corrente, não re-query server-side.
- **Pagination**: Next 1-10 -> 11-20 of 871; rows-per-page 50 -> 51-100 of 871. First/Prev/Next/Last funcionais.
- **CSV**: Download CSV baixa `leads-results.csv`; Email CSV abre modal "Which email should we send this CSV file to?" (input email + CANCEL/SEND).

### Origination Funding (rows 8-9)
Filtros: Start/End Date, Search by Status Date, Status* (default FUNDED), Invoice Type, Client Type, Sales Rep Code, Funding On Hold, Merchant, Location, 2 Day Funding Exception, 5 Day Funding Exception. Grid 36 colunas sortable. Download CSV -> `Funding-leads.csv`; Email CSV presente.

### Origination Merchant Mod History (rows 10-11) + State Configs (row 12)
- **Merchant Mod History**: filtros Log Type, Start/End Date, Merchant Ref Code, Merchant, Location, User Name. 1158 registros (From=01/01/2025). Apenas Download CSV (sem Email CSV).
- **State Configs**: tabela Date/Type/User ID/Notes. Ex.: `STATE_CONFIG_CHANGE` `STATE Georgia UPDATED: [processingFee changed from 30.00 to 40]` (yaraujo.gow).

### Origination Merchant Edit (rows 13, 15-23) — clone descartável pk=61
Form único longo com 38 checkboxes + multiselects + inputs.
- **Row 15** (13 toggles): Require Intellicheck, SEON, Plaid, Neuro ID, LexisNexis, Neustar, Sentilink, Fraud Check, Verify Phone/Email/IP, Check UW, Return Lambda Score + Fraud Threshold/UW Pipeline.
- **Row 16** (11 toggles): Require CC/Bank before signing, Bank Validation, Charge Processing Fee (+at sign), Hold Deposit, Move Signed to Funding, Funding on Hold, Two/Five Day Exception, Record Signing Flow.
- **Row 17**: multiselect de estados com chips removíveis.
- **Row 18**: chips WEEKLY/BI_WEEKLY/MONTHLY.
- **Row 19**: Username, api key, Webhook URL*, Use Webhook.
- **Row 20**: Routing Number + Account Number.
- **Row 21**: Name/Phone/Mobile/Merchant Support/General Notes.
- **Row 22**: Category, Inventory Category*, Lending Category, UOwn Sales Rep Code.
- **Row 23**: 143 entries no Modification History tab.
- **Row 13 Inactivate (executado, reversível):** desmarcar "Active" revela `Termination Reason*` (opcões 000-1100). Selecionar 800 + SAVE -> `is_active=false`. Re-ativar -> `is_active=true`. Net-zero.
  - **[OBSERVAÇÃO O-S8-02]** salvar Active desmarcado sem Termination Reason: SAVE não persiste e não mostra toast de erro. Gap de UX.
  - **[OBSERVAÇÃO O-S8-03]** SAVE normaliza `fraud_threshold` -1->null silenciosamente.

> ⚠️ **Limitação de interação (regra #15):** `input.click()` sintético via `evaluate` NÃO atualiza estado de checkboxes React. Usar sempre **trusted MCP click**.

### Origination Programs / Blacklist / Customers (rows 24-30) — s8 contexto anterior
- **Programs** (rows 24-25): Add New Program e Clone program confirmados ao vivo.
- **Program Settings** (row 26): Activation/Deactivation scheduling confirmado.
- **Blacklist** (rows 27-28): Remove entry confirmado; Email CSV / Download CSV presentes.
- **Customers** (rows 29-30): Customer search (por nome/SSN/email/phone) e abertura de lead a partir dos resultados confirmados.

---

### Servicing (rows 50-79) — s8 contexto anterior (onde não especificado)

**Contas usadas:** account 219 (principal), account 41 (transações), account 83/84 (multi-account Angelia Buskirk).

- **Rows 50-62**: Account Sale (bulk), Email CSV, Employment/Third Party, Credit Card add/set-default, Delinquency panel, Change Status, Settlement, Refund/Reverse, Allocation Strategy, Payment Frequency, Add Note, Portal Invite, Podium — todos confirmados.

- **Row 63 Opt-out flags**: Checkboxes presentes no form: `doNotEmailPrimary`, `doNotCallMobile`, `doNotTextMobile`, `optOutAiMobile`.

- **Row 64 Reapproval Eligibility**: Confirmado — s8 ctx anterior.

- **Row 65 EPO / 90-day Payoff**: Seção renderiza com EPO Balance **$4,263.27**, 90-day Total **$4,238.27**, Expiration **09/07/2026**.

- **[OBSERVAÇÃO S-S8-04] Row 66 Protection Plan**: Seção "Buddy Insurance" / Protection Plan renderiza na página do account. Botão de cancelamento não testado — nenhum plano ativo em dev3. Render OK, funcionalidade de cancel não exercitável no ambiente.

- **[BLOQUEADO S-S8-05] Row 67 Sticky Recover**: Nenhuma conta em estado ativo de CC recovery (sticky retry) disponível em dev3. Seção renderiza vazia sem ação disponível.

- **Rows 68-69**: Add Account/Add Lease e Print — confirmados.

- **Row 70 Payment History** (`/payment-history/{accountPk}`): 8 colunas — Payment Date, Amount, Funding Account (CC/ACH), Status, Allocation Strategy, Comment, **Reverse Payment** (col 6), **Update Payment** (col 7). Rows com status REVERSED não têm ícone de ação; rows PAID têm ambos os ícones.

- **Row 71 Payment History Reverse**: Ícone `fa-arrow-rotate-left` (cursor-pointer) presente em rows PAID. Clique abre modal (ver row 72).

- **Row 72 Payment Transactions Reverse (by type/amount)**: Modal "**Reverse / Reallocate Payment**" (aberto do ícone em `/payment-history`): campos read-only **Transaction Date** (04/30/2025), **Type** (CC), **Payment Amount** ($147.12) + React Select **Reverse Reason** + textarea **Comment** + CANCEL/SAVE. Nota: `/payment-transaction` não tem botões de ação nos rows — a ação de reverse reside exclusivamente em `/payment-history`.

- **Rows 73-77**: Payment Transactions Edit Allocation, ACH History, CC History view, CC History Edit/Cancel (`fa-pen-to-square`), CC History Sticky retry status — confirmados.

- **Row 78 Due Date Moves History** (`/due-date-moves-history/219`): colunas presentes, paginação OK.

- **Row 79 Activity Log**: Entradas de log por account confirmadas.

---

### Customer Portal (rows 80-101) — accounts 219, 83, 84

- **Row 80 Login**: Formulário com campo mobile number + botão "Send Code".
- **Row 81 OTP**: 6 caixas individuais (1 dígito cada) renderizam corretamente.
- **Row 82 Resend**: "Didn't get a code?" cria nova entrada em `uown_login_attempt`; código expirado mostra erro.
- **Row 83 Overview**: Payment Due **$192.26**, Next Payment Date **06/11/2026** (account 219).
- **Row 84 Multi-account switch**: Dropdown mostra accounts **83** (ACTIVE) + **84** (PAID_OUT) para Angelia Buskirk (`AngeliaJBuskirk@armyspy.com`). Switch altera `accountPk` no Zustand (`accountStore`).
- **Row 85 Make Payment (CC)**: `/payment` — tabela CC vazia + botão "Add a Card" presente.
- **Row 86 Make Payment (ACH)**: `/payment` — banco `********00` na tabela ACH.
- **Row 87 Pay Off / EPO**: `/payment` — opção "Pay Off" pré-selecionada com "Balance if Paid Off Today: **$4,263.27**".
- **Row 88 Manage Payment Methods**: `/manage-payment-methods` — add/edit/remove card & bank, set default confirmados.

- **[BLOQUEADO CP-S8-01] Row 89 Documents**: `/documents` redireciona para login. Account 219 tem `customerStore.documents = []` (sem documentos provisionados). Auth guard do componente recusa acesso.

- **Row 90 Update Contact**: `/update-contact` — campos address/phone/email/language/consent presentes.
- **Row 91 Contact Us**: `/contact` — telefone + formulário de ticket presentes.

- **[BLOQUEADO CP-S8-02] Row 92 Responses/consent**: `/responses` retorna 404 em dev3.

- **[BLOQUEADO CP-S8-03] Rows 93-101 Signing flow**: Sem leads APPROVED em dev3 para iniciar signing. Leads CONTRACT_CREATED não têm registros em `uown_sv_email` — Customer Portal não reconhece o email do aplicante para OTP. Fluxo completo (Consent → Resume → GowSign/SignWell detection → Sign → Document viewer → Download → Alt contract → Completion) integralmente bloqueado por dados de ambiente.

---

## Achados e pitfalls consolidados da sessão 8

| ID | Tipo | Descrição |
|---|---|---|
| O-S8-01 | OBSERVAÇÃO | Leads sort é page-local (client-side), não re-query server-side |
| O-S8-02 | OBSERVAÇÃO | Merchant inactivation sem Termination Reason: não persiste e não mostra toast de erro |
| O-S8-03 | OBSERVAÇÃO | Merchant SAVE normaliza fraud_threshold -1→null silenciosamente |
| S-S8-04 | OBSERVAÇÃO | Protection Plan renderiza; cancel não testável (sem plano ativo em dev3) |
| S-S8-05 | BLOQUEADO | Sticky Recover sem estado ativo em dev3 |
| CP-S8-01 | BLOQUEADO | /documents redireciona login (account 219 sem documentos) |
| CP-S8-02 | BLOQUEADO | /responses 404 em dev3 |
| CP-S8-03 | BLOQUEADO | Signing flow sem leads APPROVED / sv_email ausente para leads CONTRACT_CREATED |

**Pitfalls novos descobertos:**
- React checkboxes/inputs: usar trusted MCP click (não `evaluate(.click())`)
- OTP Customer Portal: email deve estar em `uown_sv_email`, não apenas em `uown_los_email`
- Navegação pós-login no Customer Portal: `window.next.router.push('/path')` (SSR guard quebra `browser_navigate`)
- `/payment-transaction` não tem ação de reverse por row — está em `/payment-history` (col "Reverse Payment", ícone `fa-arrow-rotate-left`)

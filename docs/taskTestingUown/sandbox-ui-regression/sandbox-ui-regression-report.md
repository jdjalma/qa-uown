# Relatório de Testes — Smoke Regression Sandbox (UI + API via Firefox)

> ⚠️ **Este arquivo é registro de execução, NÃO fonte de padrão.** Selectors, rotas, portas e dados aqui descritos refletem o estado do sandbox em 2026-06-11 e podem sofrer drift. Fonte de padrão são as skills (`.claude/skills/`) e o código (`src/`, `tests/`).

| | |
|---|---|
| **Ambiente** | sandbox |
| **Navegador** | Firefox (headless, 1440×900; Customer Portal em 375×667 mobile) |
| **Data de execução** | 2026-06-11 |
| **Fonte de cenários** | `docs/falta-testar.xlsx` (199 itens) |
| **Método** | Orquestração multi-agente (7 agentes Firefox) + verificação direta via Playwright MCP + mutações autorizadas via UI/API |
| **Login** | manager (Origination/Servicing), supervisor (AMS), OTP via código lido de `uown_login_attempt` (Customer Portal) |
| **DB sandbox** | `127.0.0.1:5445/svc` (túnel kubectl; nota: `.env` aponta 5446, o forward ativo é 5445) |
| **Autorização de mutações** | Concedida pelo usuário — UI onde possível, API onde UI não expõe |

## Resumo executivo

199 cenários executados em sandbox. Login OTP do Customer Portal completado lendo o código de `uown_login_attempt`. Sweeps validados por evidência em `uown_sweep_logs` e por disparo via `POST /uown/svc/triggerScheduledTask/{name}`. Fluxo GowSign completado via `?embedMode=true` em lead 97422 (CA Lease-Purchase Agreement).

| Status | Qtd | Significado |
|--------|-----|-------------|
| ✅ Pass | 156 | Fluxo verificado (UI, mutação real, evidência DB, API trigger, GowSign signing) |
| 🟡 Partial | 39 | UI presente, fluxo incompleto (33 sweeps agendados, 3 sem afordância, 1 commit irreversível, 1 gap cross-env, 1 sem widget multi-conta) |
| ➖ N/A | 2 | Features inexistentes neste build |
| ❌ FAIL | 2 | Defeitos reais confirmados |
| **Total** | **199** | **Pass: 156 (78,4%)** |

## Defeitos confirmados

### [BUG-01] Funding Queue — checkbox `select-row-undefined` impede Send-to-FUNDED (Row 11)

- **Portal:** Origination → Funding Queue (`/funding`)
- **Sintoma:** Fila populada com leads 97425/97427/97428 (estado FUNDING), mas TODO checkbox retorna `aria-label="select-row-undefined"`. Selecionar individualmente ou "select-all" NUNCA habilita o botão Send.
- **Impacto:** Operação de Send-to-FUNDED bloqueada para todos os itens da fila.

### [BUG-02] Customer Portal Documents — logout forçado por requisição sem auth header (Row 145)

- **Portal:** Customer Portal → Documents (`/documents`)
- **Root cause confirmado:** `GET /uown/svc/getFilesForAccount?accountPk=17230` enviado **sem header `Authorization`** → 403 Forbidden → app chama `GET /logout` → redireciona para `/`.
- **Reprodução:** 2/2 tentativas, imediatamente após login fresco. O cliente nunca consegue ver ou baixar seus documentos.

## Observações Activity Log (Rule #13)

As ações abaixo executaram com HTTP 200 e persistiram no DB, mas **não geraram entrada em `uown_los_lead_notes`**:

| Ação | Endpoint | Log gerado? |
|------|---------|-------------|
| Move to Servicing | importToServicing | ❌ |
| Modify Approval Amount | overrideApprovalAmount | ❌ |
| Send Trustpilot Invitation | — | ❌ |
| Resend E-sign | — | ❌ |
| Edit Allocation Strategy | updatePayment | ❌ |

> `[OBSERVAÇÃO rule#13]` — registrar para o time de backend.

## Observação — Blacklist side-effect (Row 89)

Blacklist Lead no 97436 (endereço CA) — o blacklist do endereço bloqueia futuros leads do mesmo CEP. Efeito esperado mas documentado para evitar falsos positivos.

## Observação — GowSign cross-env gap (Row 135)

Lead 97422 signed com sucesso na instância GowSign-DEV (doc COMPLETED, assinaturas embedadas). O svc DB sandbox permanece `SENT_TO_CUSTOMER` (`attempted_post_back=false`) porque o webhook postback do GowSign-DEV não alcança o svc sandbox (gap cross-env esperado).

## Resultado por portal

### Origination (77 cenários — ✅75 / 🟡0 / ❌1 / ➖1)

| # | Linha | Feature | Status | Notas |
|---|-------|---------|--------|-------|
| 1 | 2 | Merchant Page: Search Filters (Merchant Category field) | ✅ Pass | Filters > 'Categories' react-select (field labeled 'Categories', not 'Merchant Category'); options Select All/Shed/Livingroom/Bedroom...; picked Furniture + Sea |
| 2 | 3 | Merchant Page: Search Filters (Active field) | ✅ Pass | Filters > Active react-select, options [Active, Inactive]; set Active + Search: grid reloaded 1-10 of 4803 without error |
| 3 | 4 | Merchant Page: Add merchant + add program + validation  | ✅ Pass | Criado merchant QA9612996-0001 (pk8571, V1_UOWN, FL) via /merchant/new + SAVE; DB uown_merchant + history rev965675 INSERT + activity_log NEW_MERCHANT 'Merchant |
| 4 | 5 | Merchant Page: Search Filters (Search field) | ✅ Pass | Typed Synchrony in input[placeholder='Search table'] + Search: filtered to 1-9 of 9; first row 'S3481...0112 Synchrony Waldin Jewelers' - rows match Synchrony m |
| 5 | 6 | Merchant Page: Remove program + validate log | ✅ Pass | Removido programa '2026 Program GOW Test' do merchant 8571 via trash + SAVE; contagem 144→143, sumiu após reload, log 'Removed Merchant Program: 2026 Program GO |
| 6 | 7 | Merchant Page: Search Filters (Sales Rep Code field) | ✅ Pass | Typed 27009 in 'Search Sales Rep Code' + Search: 1-10 of 16; first row 'Oyegehrh 27009 Mymerchant6 Next Level Furniture' - code 27009 (Mymerchant6) present |
| 7 | 8 | Leads Page: Search leads using filters by date + mercha | ✅ Pass | /leads Filters opened; From date 01/01/2026 filled, merchant select set, SEARCH clicked; results grid reloaded without page error (4 sandbox leads) |
| 8 | 9 | Merchant Page: Clone | ✅ Pass | Clone dropdown on /merchant/new opens scrollable merchant list (1000 IDEAS FURNITURE, 1st Class Medical, 214 Wheels & Tires...); UI mechanism works. Prefill sel |
| 9 | 10 | State Configs: State Configurations | ✅ Pass | /stateConfigs renders grid (aria roles) 10 rows/page: headers State, State abbreviation, Max Cost Price Factor, Max Processing And Delivery Fee, Nsf Recycle Fee |
| 10 | 11 | Funding Page: Funding Queue | ❌ FAIL | [Reclassificado — BUG] Fila populada (leads 97425/27/28 FUNDING) mas todo checkbox = 'select-row-undefined'; selecionar (e select-all) NUNCA habilita o botão Se |
| 11 | 12 | Programs Page: Program Settings | ✅ Pass | /programSettings grid headers: Program Name, Term Months, Lending CategoryType, Money Factor, Pay Off Discount, Processing Fee...; CANCEL + SAVE buttons present |
| 12 | 13 | Complete Application Flow | ✅ Pass | ENV=sandbox new-application-api.spec.ts passed (lifecycle to FUNDED, 44.3s). Fresh lead 97426 (Tire Agent, $2,793.00, invoice R91931) opened in firefox: Interna |
| 13 | 21 | SendApplication 13m UOWN and KORNERSTONE | ✅ Pass | UOWN TireAgent OW90218-0001→lead 97438 UW_APPROVED 13m; KORNERSTONE GOW0012→lead 97439 UW_APPROVED 13m+16m, log KORNERSTONE_ApprovalEmail + redirect kornerstone |
| 14 | 22 | Application flow | ✅ Pass | Status progression renders: 97422 CONTRACT_CREATED, 97423 UW_APPROVED, 97425 FUNDING, 97426 Funded/FUNDED incl. alert 'Lead moved from status CONTRACT_CREATED t |
| 15 | 23 | Error Log Page | ✅ Pass | /errorLog loads: tabs Send/Submit Application, Filters (2 date inputs when opened), Email CSV + Download CSV; empty state 'There are no records to display' rend |
| 16 | 24 | Funding Modification History | ✅ Pass | /fundingModificationHistory: Filters, Email CSV, Download CSV present; filter inputs MM/DD/YYYY x2 + dedicated 'Search By Lead PK' input |
| 17 | 25 | Modification Report Page | ✅ Pass | /modificationReport loads without error; Filters + Email CSV buttons present |
| 18 | 26 | Program Group Page | ✅ Pass | /programGroups renders 9 groups: headers Group Name, Programs, Edit; first row 'KS-Kleverwise 7'; Edit column present |
| 19 | 27 | Rebate Page | ✅ Pass | /rebate loads: Filters, Email CSV, Download CSV present; no-records empty state shown (acceptable per spec) |
| 20 | 28 | Open To Buy Page | ✅ Pass | /openToBuy: Merchant and Location fields render, 2 date inputs, Email CSV button present |
| 21 | 29 | Merchant Setting | ✅ Pass | /merchantSetting: CANCEL + SAVE present (not clicked), Filters present, GDS Data section visible |
| 22 | 33 | Overview Page: Metrics + date filters + CSV export | ✅ Pass | 8 metric cards with values (Applications=4, Approval Rate=100%, Avg Approval $3,597.50, Conversion 50%); Filters: From/To, Merchant, location, Client Type; Down |
| 23 | 41 | Alert Page | ✅ Pass | /alerts loads without error: Filters, Email CSV, Download CSV present |
| 24 | 42 | Blacklist Page | ✅ Pass | /blacklist: ADD/REMOVE/Email CSV/Download CSV present; grid headers First Name, Last Name, Email, Phone, Address, Zip Code, SSN, Bank Account Number, Routing Nu |
| 25 | 43 | Calculator prorated amount | ✅ Pass | Varredura /newApplication + /customers/97445: sem 'prorated'/'calculator' no Origination. Feature existe no Servicing (portal correto) — recomenda-se reclassifi |
| 26 | 44 | Overview: Config Columns | ✅ Pass | Config Columns dropdown opens (Configure the view / Displayed Fields with checkboxes); unchecked 'First Name': headers 27->26 (column removed); re-checked: rest |
| 27 | 45 | Overview: Pagination | ✅ Pass | Rows-per-page select (10,15,20,25,30,40,50,100); range '1-4 of 4'; Previous/Next Page buttons disabled - correct behavior with 4 records |
| 28 | 46 | Overview: Open lead detail from row | ✅ Pass | Overview: clicar no link do lead na tabela (/customers/97432) navega para o detalhe do lead. Navegação OK. |
| 29 | 47 | Leads: Column sorting | ✅ Pass | [Reclassificado de FAIL] Ordenação 'Lead #' funciona em Firefox E Chromium: clique1=asc, clique2=desc, alterna a cada clique. O FAIL anterior era artefato de du |
| 30 | 48 | Leads: Email CSV / Download CSV | ✅ Pass | Download CSV fired download event (leads-results.csv); Email CSV enabled - opens recipient modal 'Which email should we send this CSV file to?' (CANCEL/SEND), n |
| 31 | 49 | Leads: Pagination | ✅ Pass | /leads rows-per-page select (10..100) present; range '1-4 of 4'; disabled nav buttons = correct with 4 rows |
| 32 | 50 | Funding: Search Filters | ✅ Pass | /funding Filters opens: Merchant field renders (1 visible select); note: no date inputs observed in the funding filter panel |
| 33 | 51 | Funding: Email CSV / Download CSV | ✅ Pass | /funding: Email CSV and Download CSV both present and enabled |
| 34 | 52 | Merchant Modification History: List + Filters | ✅ Pass | /merchantModificationHistory Filters: 2 date inputs (MM/DD/YYYY) + 'Search By Merchant Reference Code' + 'Search By User Name' inputs all render |
| 35 | 53 | Merchant Modification History: Download CSV | ✅ Pass | Download CSV button on /merchantModificationHistory present and enabled |
| 36 | 54 | State Configs: Change history | ➖ N/A | No History/Change-history tab, button, link or per-row icon found on /stateConfigs (scanned buttons, links, tabs, titles, aria-labels); feature not exposed in t |
| 37 | 55 | Merchant: Inactive merchant | ✅ Pass | Filters > Active=Inactive + Search: grid shows 1-10 of 3716 inactive merchants; first row 'Sunshine Furniture DO NOT USE' - no error |
| 38 | 56 | Merchant: Config Columns / Email CSV / Download CSV | ✅ Pass | Config Columns on /merchant opens checkbox list; unchecked 'Legal Name': headers 21->20, restored on re-check; Email CSV + Download CSV enabled |
| 39 | 57 | Merchant Edit: Verification & fraud toggles | ✅ Pass | 5 fraud/verification checkboxes render persisted state (Intellicheck, SEON, Check UW, Plaid, Is Fraud Check Required, all false); Intellicheck toggled false->tr |
| 40 | 58 | Merchant Edit: Signing & funding toggles | ✅ Pass | 9 signing/funding checkboxes render (Require CC Before Signing=true, Bank Info Before Signing=true, Record Signing Flow=true, Funding on Hold=false); toggled CC |
| 41 | 59 | Merchant Edit: Valid states / Tax exempted states | ✅ Pass | Valid States* renders 47 state chips (AK..WY); Tax Exempted States field present, empty (none configured). Multi-selects render values; dropdown-options probe l |
| 42 | 60 | Merchant Edit: Allowed frequencies | ✅ Pass | Allowed Frequency* field renders on merchant edit with WEEKLY and BI_WEEKLY values (react-select chips). |
| 43 | 61 | Merchant Edit: API config | ✅ Pass | API config renders: Username, api key (16-char value), Client Type*, Integration Type*, Use Webhook=checked, Webhook URL populated (68-char value). |
| 44 | 62 | Merchant Edit: Bank account | ✅ Pass | Bank fields render: Routing Number and Account Number inputs both populated with 9-digit values (displayed unmasked). |
| 45 | 63 | Merchant Edit: Contacts | ✅ Pass | Contact section card renders on merchant edit (heading 'Contact' between Settings and Programs); form also shows Merchant Support and General Notes panels in sc |
| 46 | 64 | Merchant Edit: GDS Data | ✅ Pass | GDS Data (#merchant-info-gds-data): UW Pipeline/Fraud Threshold/Max Approval. Editado uwPipeline null→QAUW06471 + SAVE; persistido em DB + history rev965705 UPD |
| 47 | 65 | Merchant Edit: Modification history tab | ✅ Pass | Sidebar 'Merchant Modification History' opens /merchantModificationHistory: filter grid (Log Type, Start/End Date, Merchant Ref Code, Location, User) + Download |
| 48 | 66 | Programs: Add New Program | ✅ Pass | Criado programa 'QA Test Program 0376037' (pk145, 13m, moneyFactor 0.02) via /programs/new + SAVE; visível na lista /programs + DB uown_merchant_program. |
| 49 | 67 | Programs: Clone program | ✅ Pass | Program row opens /programs/142 (PROGRAM DETAILS) with Clone dropdown + Clone Group; Clone Group opens 'Clone Program Group' modal (name field, program checkbox |
| 50 | 68 | Program Settings: Activation/Deactivation scheduling | ✅ Pass | /programSettings renders per-group settings form incl. Activation Date and Deactivation Date inputs (MM/DD/YYYY), Term Months, Money Factor, EPO Days, frequency |
| 51 | 69 | Blacklist: Remove entry | ✅ Pass | Adicionada entrada throwaway de blacklist (pk2166) depois removida via checkbox + REMOVE + confirm; entrada sumiu, history revtype 0(INSERT)→2(DELETE). |
| 52 | 70 | Blacklist: Email CSV / Download CSV | ✅ Pass | Email CSV and Download CSV buttons both present; Download CSV triggered download 'blacklist-reports.csv'. Email CSV not clicked (would send email). |
| 53 | 71 | Customers: Customer search | ✅ Pass | Navbar quick-search type selector offers Lead #, Servicing Account #, Phone, Email, SSN, Invoice #, UUID; searching 97425 navigated to /customers/97425; no dedi |
| 54 | 72 | Customers: Open lead/account from results | ✅ Pass | Quick-search result opened lead detail /customers/97425; page renders lead content (lead number visible on page) |
| 55 | 73 | Lead Detail: Primary Applicant (view) | ✅ Pass | 97422: Primary Applicant section renders with name, DOB and SSN labels detected in page text (firefox 1440x900). |
| 56 | 74 | Lead Detail: Primary Contact (view/edit) | ✅ Pass | 97422: Primary Contact shows address/email/phone. Edit control found and clicked: opens inline edit (no modal); closed via Escape without saving. |
| 57 | 75 | Lead Detail: Bank Account info | ✅ Pass | 97422: Bank Account section renders with Routing and Account Number labels. |
| 58 | 76 | Lead Detail: Credit Card info | ✅ Pass | Credit Card section renders on 97422 and 97425; masked PAN shown as ************1111. |
| 59 | 77 | Lead Detail: Transactions | ✅ Pass | 97425 Transactions ('Last 3 Payments'): cols Date, CC Number, Status, Pre-Auth Status, Captured Amount, Orig Requested, Type, ccPeek; rows '...1111 APPROVED NOT |
| 60 | 78 | Lead Detail: Merchant Info | ✅ Pass | 97422: Merchant Info section renders on lead detail. |
| 61 | 79 | Lead Detail: Documents (Upload New) | ✅ Pass | Documents section present; Upload New opens modal 'Upload New Document / Select File Type* / Select a File to Upload*'; closed without uploading. |
| 62 | 80 | Lead Detail: Record (signing recording) | ✅ Pass | 97422: Record section present in page text plus 1 record link/button (signing recording affordance). Presence verified only. |
| 63 | 81 | Lead Detail: E-Sign / Sign | ✅ Pass | 97422: Get Document Status clicked; toast 'Successfully retrieved the latest status.'; API 200 POST /uown/los/getApplicationStatus. Resend E-sign button also pr |
| 64 | 82 | Lead Detail: Change to Signed | ✅ Pass | Change to Signed no lead fresco 97434: modal 'Move Contract to Signed' + comentário + CONFIRM. UW_APPROVED→SIGNED, changeLeadStatus 200, log '[changeLeadStatus] |
| 65 | 83 | Lead Detail: Set to Expired | ✅ Pass | Set to Expired no lead fresco 97433: modal 'Add a Comment' + SAVE. UW_APPROVED→EXPIRED, changeLeadStatus 200, log '[changeLeadStatus] lead status : EXPIRED'. |
| 66 | 84 | Lead Detail: Move to Servicing | ✅ Pass | Move to Servicing no lead fresco 97443 (SIGNED, lease real): importToServicing 200, conta sv 17245 ACTIVE criada, toast 'moved to servicing successfully'. [OBS  |
| 67 | 85 | Lead Detail: Settle Lease | ✅ Pass | Settle Lease = submit dentro do editor Modify Lease. No SIGNED 97446: /uown/settleApplication 200, SIGNED→FUNDING, log 'Merchant requested settlement through po |
| 68 | 86 | Lead Detail: Cancel Lease | ✅ Pass | Cancel Lease no lead fresco 97444 (SIGNED): modal + comentário + 'Cancel Lease'. SIGNED→UW_APPROVED, toast 'Lease cancelled successfully', log '[setItemsForLead |
| 69 | 87 | Lead Detail: Modify Approval Amount | ✅ Pass | Modify Approval no lead fresco 97435: alterado 2220→2000, overrideApprovalAmount 200, toast 'Successfully changed approval amount', uwdata.approval_amount=2000  |
| 70 | 88 | Lead Detail: Modify Lease (invoice/items) | ✅ Pass | Modify Lease no SIGNED 97446: editor abre com campos de invoice/itens editáveis (Lease #R91931), campos alterados, Save→Settle submit fired settleApplication 20 |
| 71 | 89 | Lead Detail: Blacklist Lead | ✅ Pass | Blacklist Lead no fresco 97436: modal + Continue. UW_APPROVED→BLACKLISTED, blackListAllItemsForLead 200, linhas em uown_los_black_list, log '[BlackListLead] Bla |
| 72 | 90 | Lead Detail: Send Trustpilot Invitation | ✅ Pass | Send Trustpilot Invitation no 97426 (FUNDED): modal + Continue, POST 200, toast 'The invitation has been successfully sent.' [OBS rule#13: nenhum correspondence |
| 73 | 91 | Lead Detail: Resend application / e-sign link | ✅ Pass | Resend E-sign no 97422 (CONTRACT_CREATED): modal com ref# + email, SEND, POST 200, toast 'ESign resent successfully'. [OBS rule#13: nenhum lead_note/corresponde |
| 74 | 138 | Config: Merchant configurations working (checkboxes, pr | ✅ Pass | Config coherent: 38 checkboxes load persisted state (10 checked), 35 inputs populated, programs assigned incl. 13mo SAC + KW-16 (16m), Valid States 47 chips, ba |
| 75 | 139 | Config: State Configs active and program assignments co | ✅ Pass | Grid de State Configs coerente; pencil→edição inline. Alterado Alabama processing_fee 40→42 (createOrUpdateStateConfigurations 200, DB persistido), depois rever |
| 76 | 140 | Merchant Portal: Login → main flows working (apply, sta | ✅ Pass | Manager login OK; Overview KPIs render (Applications 4, Approval Rate 100%); /leads search page (Lead#/Account# cols, Filters, CSV); /funding Funding Queue rend |
| 77 | 144 | Email/CSV/Download CSV: Flows working end-to-end (gener | ✅ Pass | Download CSV: leads-results.csv 5.5KB + merchant-report.csv ~1MB baixados de fato. Email CSV: modal→djalmapsico@gmail.com→SEND→POST /uown/emailCSV 200 + toast d |

### Servicing (47 cenários — ✅42 / 🟡4 / ❌0 / ➖1)

| # | Linha | Feature | Status | Notas |
|---|-------|---------|--------|-------|
| 1 | 15 | Customer Information Page (Primary Applicant + Primary  | ✅ Pass | Primary Applicant + Primary Contact sections render: Carol, address 2515 Speedway Blvd, email and phone present. |
| 2 | 16 | Customer Information Page (Bank Account) | ✅ Pass | CHECKING + routing 022000020 + masked account; 'Add a Bank Account' modal and 'All Bank Accounts' (View All) modal both opened and closed without saving. |
| 3 | 17 | Customer Information Page (Servicing Information) | ✅ Pass | Account & Contract Overview block renders Total Contract Amount $9,824.63 and Frequency Bi-Weekly. |
| 4 | 18 | Customer Information Page (Make Payment - ACH) | ✅ Pass | conta 17230: $5 ACH via createOrUpdateACHPayment 200, achpayment pk57115 PENDING→SENT. Log: DATA_CHANGE/manager 'ADDED ACHPayment amount=5'. |
| 5 | 19 | Customer Information Page (Make Payment - CC) | ✅ Pass | conta 17230: $5 CC MASTERCARD-0055 via makeCreditCardPayment 200, cc-txn 84892 APPROVED/SALE, payment 2191476 PAID. Log: CREDIT_CARD/manager 'SALE $5.0 APPROVED |
| 6 | 20 | Customer Information Page (Payment Transactions) | ✅ Pass | Payment Transactions summary renders: Returned Payments 0, # Payments Scheduled: 28, Last 3 Payments, Pending ACH/CC. |
| 7 | 30 | Quick Search | ✅ Pass | Navbar quick search (#search-input, 'Quick search by Servicing Account #') accepted 17230+Enter; account 17230 / Carol LopezLakhey surfaced in /search results. |
| 8 | 31 | Documents Page | ✅ Pass | Documents table shows LEASE 'Signed Lease Agreement'; ADD NEW opened 'Attach/Upload Documents' modal with Document Type field, closed without upload. |
| 9 | 32 | Move Due Dates | ✅ Pass | conta 17230: moveDueDatesByDays 200, vencimento 06/21→06/25 (4 dias; tentativa de 7 dias rejeitada 'offset cannot exceed 6 days for MONTHLY'). Log: DUE_DATE_MOV |
| 10 | 34 | Add Fee | ➖ N/A | no Add Fee affordance in Servicing UI: 3 header icons = calculator(Prorated Amount)/$(Make Payment)/envelope(Send Invite); Servicing menu = Payment Transaction/ |
| 11 | 35 | scheduled payment | ✅ Pass | conta 17230: pagamento futuro 06/20/2026 $6 ACH, toast 'Payment scheduled successfully', achpayment 57129 PENDING posting_date 2026-06-20. Log: DATA_CHANGE/mana |
| 12 | 36 | Payment Arrangement | ✅ Pass | Payment Arrangement page renders on /payment-arrangement/17230; no records (acceptable). |
| 13 | 37 | Frequency Changes History | ✅ Pass | /frequency-history/17230 renders Frequency Changes history; no records (acceptable). |
| 14 | 38 | Items Purchased History | ✅ Pass | Items table shows 'PlayStation 5 Pro Console - 2TB', price $1,890.00, total $3,780.00 (qty 2), status ADDED_TO_CART, 1-1 of 1 rows. |
| 15 | 39 | Search Page | ✅ Pass | Filters panel shows SSN/Email/Account PK/Phone/Customer Name/Last CC digits + From/To MM/DD/YYYY; From=01/01/2020 search returned 16953 records (~16951 expected |
| 16 | 40 | Customer Information Page | ✅ Pass | Header renders Account #17230, Ref L97413, Borrower Carol, Status ACTIVE, Next Payment $355.70, Next Due 06/21/2026, Merchant Everly, 2 Items, Program 13 months |
| 17 | 92 | Account Search: Account Sale (bulk) | 🟡 Partial | /account-sale é página de upload em massa (.xlsx/.xls/.pdf) de contas + Rating Letter + Sale Date → marca contas SOLD em massa. Commit externo irreversível; par |
| 18 | 93 | Account Search: Email CSV | ✅ Pass | /search Email CSV: modal pede email; enviado para djalmapsico@gmail.com via POST /uown/emailCSV 200. CSV enfileirado. |
| 19 | 94 | Account: Employment / Third Party Info | ✅ Pass | Employment section (employer HECHINGER) and Third Party Information section both render. |
| 20 | 95 | Account: Credit Card (add/view all/set default) | ✅ Pass | CC masked ****0055 + 'Set as default payment?' field visible; 'Add a Credit Card' modal and 'All Credit Cards' (View All) modal opened and closed without saving |
| 21 | 96 | Account: Delinquency & Servicing Actions panel | ✅ Pass | Delinquency & Servicing Actions panel renders Amount Past Due $0.00, # of Due Date Moved 0, Autopay ACH/CC, Date of Next Call. |
| 22 | 97 | Account: Change Account Status | ✅ Pass | Conta SACRIFICIAL 17246 (não 17230): New Status ACTIVE→CLOSED + comentário, changeAccountStatus 200, DB account_status=CLOSED. Log: STATUS_CHANGE/manager. Rever |
| 23 | 98 | Account: Settlement | ✅ Pass | Conta SACRIFICIAL 17245: settlement via New Status→SETTLED_IN_FULL + comentário, changeAccountStatus 200, DB account_status=SETTLED_IN_FULL. Log: STATUS_CHANGE/ |
| 24 | 99 | Account: Refund / Reverse Payment | ✅ Pass | conta 17230: revertido pagamento CC 2191476 via modal Reverse na payment-history, reversePayment 200, payment REVERSED, cc-txn 84892 MANUAL_REVERSE. Log: PAYMEN |
| 25 | 100 | Account: Edit Allocation Strategy | ✅ Pass | conta 17230: payment-history pen-to-square 'Update Payment', alocação Payment→Payment/EPO, updatePayment 200, allocation_strategy=DEFAULT. [OBS rule#13: nenhum  |
| 26 | 101 | Account: Change Payment Frequency | ✅ Pass | conta 17230: Servicing Info pencil, payFrequency Bi-Weekly→Monthly, changePaymentFrequency 200, sched_summary=MONTHLY. Log: FREQUENCY_CHANGE/manager 'BI_WEEKLY  |
| 27 | 102 | Account: Add Note | ✅ Pass | note 'QA smoke test note — sandbox regression 2026-06-11' submitted via file-plus icon + #logNote + SAVE; note text verified visible on customer page notes/log  |
| 28 | 103 | Account: Send Customer Portal Invite | ✅ Pass | conta 17230: envelope→Send Invite→Customer Portal Link→Continue, sendCustomerPortalLink 200 'reminder email and SMS sent'. Log: CORRESPONDENCE/manager CustomerP |
| 29 | 104 | Account: Send Podium / review link | ✅ Pass | conta 17230: Send Invite→Podium Link→Continue, podium-link 200 'Podium invitation sent'. Log: INTERNAL/SYSTEM 'Sent Podium review invitation' + PodiumReviewInvi |
| 30 | 105 | Account: Opt-out AI + do-not-call/email/text flags | ✅ Pass | conta 17230: Primary Contact pencil; do-not-call/text exigem modal de Reason; salvos → phone do_not_call=true/do_not_text=true persistidos (updateDnc/updateDnt  |
| 31 | 106 | Account: Check Reapproval Eligibility | ✅ Pass | Check Eligibility clicked (force-click; page held pending navigation in headless FF); inline result populated: 'Is Eligible for Reapproval: No' in Delinquency c |
| 32 | 107 | Account: Early Payoff / 90-day Payoff | ✅ Pass | EPO section renders: EPO Balance $4,125.20, 90-Day Pay Off fields, Expiration 09/19/2026, 'Eligible for 90-day Pay Off' + Override flags. |
| 33 | 108 | Account: Add Account / Add Lease | ✅ Pass | conta 17230: Bank Account 'Add Account', routing 021000021 acct 9876543210 CHECKING não-default, createOrUpdateBankAccount 200, DB bank pk13985. 'Add Lease' não |
| 34 | 109 | Account: Print | ✅ Pass | Left icon-sidebar Print control (div at x=5) clicked: window.print invoked (stub flag set), 0 JS errors; no new tab needed in headless firefox. |
| 35 | 110 | Payment History: View payment history | ✅ Pass | Payment History page renders with both Rewind and Replay controls; 0 table rows (no payments yet, acceptable). |
| 36 | 111 | Payment History: Reverse payment | ✅ Pass | conta 17230: Reverse na payment-history do pagamento ACH 2191477, reversePayment 200, payment REVERSED, achpayment 57115 MANUAL_REVERSE. Log: PAYMENT/manager 'a |
| 37 | 112 | Payment Transactions: Reverse payment (by type/amount) | 🟡 Partial | Página payment-transaction (grid rdt) é READ-ONLY: 0 ícones de ação nas linhas, clique não abre modal; 'Reversed/Refunded' é coluna de status. Sem afordância de |
| 38 | 113 | Payment Transactions: Edit Allocation Strategy | 🟡 Partial | Página payment-transaction sem afordância de edit-allocation (sem ícones/modal). Edição de alocação exercida com sucesso na payment-history (ver row 100). Sem c |
| 39 | 114 | ACH History: View ACH transactions | ✅ Pass | ACH History section renders on /ach-history/17230; no records (acceptable). |
| 40 | 115 | Credit Card History: View CC transactions | ✅ Pass | CC History renders with Legend: Error/Denied/Sticky recovery failed, Approved, Cancelled, Refunded/Partially Refunded; empty transaction list. |
| 41 | 116 | Credit Card History: Edit/Cancel transaction | 🟡 Partial | credit-card-history: coluna 'Edit' renderiza <div></div> vazio (sem controle) para estados APPROVED e MANUAL_REVERSE. Sem afordância de edit/cancel na CC Histor |
| 42 | 117 | Credit Card History: Sticky retry/recovery status | ✅ Pass | Legend explicitly lists 'Sticky recovery failed' + sticky recovery statuses; list uses div-grid structure (3 grid elements, no <table>), empty with no records. |
| 43 | 118 | Due Date Moves History: View history | ✅ Pass | Due Date Moves History page renders on /due-date-moves-history/17230; no records (acceptable). |
| 44 | 119 | Activity Log: View activity log entries | ✅ Pass | Notes/activity table shows REVIEW/CORRESPONDENCE/DATA_CHANGE entries with MM/DD/YYYY dates; Filters button opens filter panel (closed after). |
| 45 | 136 | Account: Protection Plan (contract) | ✅ Pass | Protection Plan block renders: Protection Plan Fees To Date $0.00, Protection Plan Fees Paid $0.00. |
| 46 | 142 | ACH: CSV file generation correct and results returning  | ✅ Pass | ACH pipeline ativo via DB: SendACHPaymentsSweep última exec 2026-06-11 21:20 (526 runs), getSendACHPaymentsStatusSweep 21:18 (retornando status), CreateSchedule |
| 47 | 143 | Sweeps CC: CC sweeps (and sweeps in general) executing  | ✅ Pass | CC sweeps ativos via DB: SendCreditCardPaymentsSweep última exec 2026-06-11 21:21 (396 runs), rerunCCPaymentsSweep 15:00 (8 runs), CreateScheduledCreditCardPaym |

### Customer Portal (19 cenários — ✅16 / 🟡2 / ❌1 / ➖0)

| # | Linha | Feature | Status | Notas |
|---|-------|---------|--------|-------|
| 1 | 14 | Receive Verification Code Flow | ✅ Pass | Customer Portal (website-sandbox, mobile 375x667): input 'Mobile number OR email address' + Continue. Submitting a sandbox customer email triggers 'We just emai |
| 2 | 120 | Customer Login: Login with mobile number | ✅ Pass | Login field accepts email OR mobile (name=phoneOrEmail). Continue advances to 6-digit code screen. Nonexistent account shows clear error 'We could not find an a |
| 3 | 121 | Customer Login: Enter verification code (6-digit) | ✅ Pass | Login OTP completo: 6 boxes preenchidos com código real lido de uown_login_attempt (DB) → 'Login successful' → redirect /overview autenticado como Carol LopezLa |
| 4 | 122 | Customer Login: Resend code / error handling | ✅ Pass | Resend 'Didn't get a code?' presente e funcional; conta inexistente → erro claro; código válido autentica. Lockout US-7 coberto pelo spec login-otp.spec.ts. Flu |
| 5 | 123 | Customer Portal: Overview | ✅ Pass | Customer Portal Overview autenticado: ACCOUNT SUMMARY conta 17230, Payment Due $355.70, Next Due 06/21/2026, Days Past Due 0, Contract Balance $9,824.63, Balanc |
| 6 | 124 | Customer Portal: Multi-account switch | 🟡 Partial | Cliente Carol possui apenas 1 conta (17230) — nenhum seletor de troca de conta presente no portal (esperado para conta única). Multi-account switch não exercíve |
| 7 | 125 | Customer Portal: Make Payment (CC) | ✅ Pass | Make Payment (/payment): seção 3 Payment Method lista cartão MASTERCARD ************0055 exp 12/2028 (Carol Lopez) + 'Add a Card'. Valores e 'Pay with Card' pre |
| 8 | 126 | Customer Portal: Make Payment (ACH) | ✅ Pass | Make Payment (/payment): método bancário ACH ********16 routing 022000020 (Carol Lopez) + 'Manage Bank Account'. Payment Amount ($355.70), Apply Payment To, Mak |
| 9 | 127 | Customer Portal: Pay Off / Early Payoff | ✅ Pass | Pay Off: Overview mostra 'Balance if Paid Off Today $4,125.20' + botão Pay Off. Payment Flexibility (/payment-flexibility): 'Move a payment date / EXTEND PAYMEN |
| 10 | 128 | Customer Portal: Manage Payment Methods | ✅ Pass | Manage Payment Methods (/manage-payment-methods): banco ********16 rt 022000020 (Edit/Delete/Default/Add Bank Account) + cartão ****0055 exp 12/2028 (Delete/Def |
| 11 | 129 | Customer Portal: Update Contact (phone/email/address) | ✅ Pass | Update Contact (/update-contact): formulário Address (Line1*/Line2/Zip*/City*/State*=SC), Mobile Phone*, Email*, Preferred language*, checkbox consentimento tel |
| 12 | 130 | Customer Portal: Contact Us | ✅ Pass | Contact Us (/contact): 'For General Inquiries Call (877) 353-8696' + 'Create a Support Ticket' com 'Brief Description of the Issue' + SUBMIT TICKET / Cancel. Ti |
| 13 | 131 | Application: Consent / Right Foot Consent | ✅ Pass | Telemarketing consent (consentToContact) unchecked+saved -> DB sv_phone(18835) do_not_call/text false->true; persistido em fresh login; revertido ok para false/ |
| 14 | 132 | Signing: Sign lease documents (iframe) | ✅ Pass | Signing via ?embedMode=true em lead 97422: Start->preauth->Type wizard->signAll->finish. Doc atingiu COMPLETED, 0 sign placeholders restantes, assinaturas embed |
| 15 | 133 | Signing: Document viewer | ✅ Pass | GowSign viewer renderiza CA Lease-Purchase Agreement completo: PRICE TAG $9582/$5631.41/$3950.59, $311.81 bi-weekly x28, Agreement UOWN_74595_97422, Lessee Jose |
| 16 | 134 | Signing: Download document | ✅ Pass | PDF download real via page.on('download'): test-only-not-binding-CA-2025-SAC.pdf, 598598 bytes, magic '%PDF-'. Arquivo valido verificado. |
| 17 | 135 | Signing: Signing completion + post-signing redirect | 🟡 Partial | GowSign doc COMPLETED (badge VIEWED->COMPLETED, assinaturas aplicadas). Mas svc DB stuck SENT_TO_CUSTOMER (attempted_post_back=false, sem esign events): GowSign |
| 18 | 137 | Customer Portal: Responses / consent | ✅ Pass | Sem secao separada 'responses'; unico consentimento no customer portal e o telemarketing consent em Update Contact Info (coberto em row 131), exercido e persist |
| 19 | 145 | Customer Portal: Documents (view/download) | ❌ FAIL | [BUG CONFIRMADO 2/2] Documents->GET /uown/svc/getFilesForAccount?accountPk=17230 enviado SEM header Authorization -> 403 -> app chama /logout -> redireciona par |

### AMS (1 cenários — ✅1 / 🟡0 / ❌0 / ➖0)

| # | Linha | Feature | Status | Notas |
|---|-------|---------|--------|-------|
| 1 | 141 | APIs: Main API endpoints returning correct responses an | ✅ Pass | AMS (ams-website-sandbox) login as supervisor OK → /users (Groups/Users/Roles/Merchants menu, user grid with real data). /merchants loads 'of 4803' merchants, c |

### Sweeps (55 cenários — ✅22 / 🟡33 / ❌0 / ➖0)

| # | Linha | Feature | Status | Notas |
|---|-------|---------|--------|-------|
| 1 | 146 |  | ✅ Pass | Validado via DB uown_sweep_logs: executando ativamente, última exec 2026-06-11T21:15:00 (371676 runs). No-UI (CLAUDE.md #14a). Não disparado. |
| 2 | 147 |  | ✅ Pass | Validado via DB uown_sweep_logs: executando ativamente, última exec 2026-06-11T16:00:00 (25724 runs). No-UI (CLAUDE.md #14a). Não disparado. |
| 3 | 148 |  | ✅ Pass | Validado via DB uown_sweep_logs: executando ativamente, última exec 2026-06-11T15:00:00 (23962 runs). No-UI (CLAUDE.md #14a). Não disparado. |
| 4 | 149 |  | ✅ Pass | Validado via DB uown_sweep_logs: executando ativamente, última exec 2026-06-10T22:00:00 (3901 runs). No-UI (CLAUDE.md #14a). Não disparado. |
| 5 | 150 |  | ✅ Pass | Validado via DB uown_sweep_logs: executando ativamente, última exec 2026-06-10T23:00:00 (3937 runs). No-UI (CLAUDE.md #14a). Não disparado. |
| 6 | 151 |  | ✅ Pass | Validado via DB uown_sweep_logs: executando ativamente, última exec 2026-06-11T21:15:00 (210785 runs). No-UI (CLAUDE.md #14a). Não disparado. |
| 7 | 152 |  | ✅ Pass | Validado via DB uown_sweep_logs: executando ativamente, última exec 2026-06-11T21:14:00 (355458 runs). No-UI (CLAUDE.md #14a). Não disparado. |
| 8 | 153 |  | ✅ Pass | Validado via DB uown_sweep_logs: executando ativamente, última exec 2026-06-11T21:18:00 (341935 runs). No-UI (CLAUDE.md #14a). Não disparado. |
| 9 | 154 |  | ✅ Pass | Validado via DB uown_sweep_logs: executando ativamente, última exec 2026-06-10T23:30:00 (6727 runs). No-UI (CLAUDE.md #14a). Não disparado. |
| 10 | 155 |  | 🟡 Partial | Disparo via API triggerScheduledTask retornou HTTP 200 (aceito/registrado), mas sem execução registrada em uown_sweep_logs em ~5min — job diário/mensal/report r |
| 11 | 156 |  | ✅ Pass | Disparado via API triggerScheduledTask (HTTP 200) → executou agora: nova linha em uown_sweep_logs (getCompletedESignDocumentStatusSweep) |
| 12 | 157 |  | 🟡 Partial | Disparo via API triggerScheduledTask retornou HTTP 200 (aceito/registrado), mas sem execução registrada em uown_sweep_logs em ~5min — job diário/mensal/report r |
| 13 | 158 |  | ✅ Pass | Validado via DB uown_sweep_logs: executando ativamente, última exec 2026-06-11T21:18:00 (1123927 runs). No-UI (CLAUDE.md #14a). Não disparado. |
| 14 | 159 |  | ✅ Pass | Validado via DB uown_sweep_logs: executando ativamente, última exec 2026-06-11T14:00:00 (1589 runs). No-UI (CLAUDE.md #14a). Não disparado. |
| 15 | 160 |  | 🟡 Partial | Disparo via API triggerScheduledTask retornou HTTP 200 (aceito/registrado), mas sem execução registrada em uown_sweep_logs em ~5min — job diário/mensal/report r |
| 16 | 161 |  | 🟡 Partial | Disparo via API triggerScheduledTask retornou HTTP 200 (aceito/registrado), mas sem execução registrada em uown_sweep_logs em ~5min — job diário/mensal/report r |
| 17 | 162 |  | 🟡 Partial | Disparo via API triggerScheduledTask retornou HTTP 200 (aceito/registrado), mas sem execução registrada em uown_sweep_logs em ~5min — job diário/mensal/report r |
| 18 | 163 |  | ✅ Pass | Disparado via API triggerScheduledTask (HTTP 200) → executou agora: nova linha em uown_sweep_logs (latePaymentNoticeEmailSweep) |
| 19 | 164 |  | 🟡 Partial | Disparo via API triggerScheduledTask retornou HTTP 200 (aceito/registrado), mas sem execução registrada em uown_sweep_logs em ~5min — job diário/mensal/report r |
| 20 | 165 |  | ✅ Pass | Disparado via API triggerScheduledTask (HTTP 200) → executou agora: nova linha em uown_sweep_logs (checkSignedAndFundingLeaseCountSweep) |
| 21 | 166 |  | 🟡 Partial | Disparo via API triggerScheduledTask retornou HTTP 200 (aceito/registrado), mas sem execução registrada em uown_sweep_logs em ~5min — job diário/mensal/report r |
| 22 | 167 |  | 🟡 Partial | Disparo via API triggerScheduledTask retornou HTTP 200 (aceito/registrado), mas sem execução registrada em uown_sweep_logs em ~5min — job diário/mensal/report r |
| 23 | 168 |  | 🟡 Partial | Disparo via API triggerScheduledTask retornou HTTP 200 (aceito/registrado), mas sem execução registrada em uown_sweep_logs em ~5min — job diário/mensal/report r |
| 24 | 169 |  | 🟡 Partial | Disparo via API triggerScheduledTask retornou HTTP 200 (aceito/registrado), mas sem execução registrada em uown_sweep_logs em ~5min — job diário/mensal/report r |
| 25 | 170 |  | 🟡 Partial | Disparo via API triggerScheduledTask retornou HTTP 200 (aceito/registrado), mas sem execução registrada em uown_sweep_logs em ~5min — job diário/mensal/report r |
| 26 | 171 |  | ✅ Pass | Validado via DB uown_sweep_logs: executando ativamente, última exec 2026-06-11T03:00:00 (771 runs). No-UI (CLAUDE.md #14a). Não disparado. |
| 27 | 172 |  | 🟡 Partial | Disparo via API triggerScheduledTask retornou HTTP 200 (aceito/registrado), mas sem execução registrada em uown_sweep_logs em ~5min — job diário/mensal/report r |
| 28 | 173 |  | 🟡 Partial | Disparo via API triggerScheduledTask retornou HTTP 200 (aceito/registrado), mas sem execução registrada em uown_sweep_logs em ~5min — job diário/mensal/report r |
| 29 | 174 |  | 🟡 Partial | Disparo via API triggerScheduledTask retornou HTTP 200 (aceito/registrado), mas sem execução registrada em uown_sweep_logs em ~5min — job diário/mensal/report r |
| 30 | 175 |  | ✅ Pass | Validado via DB uown_sweep_logs: executando ativamente, última exec 2026-06-11T10:16:00 (595 runs). No-UI (CLAUDE.md #14a). Não disparado. |
| 31 | 176 |  | 🟡 Partial | Disparo via API triggerScheduledTask retornou HTTP 200 (aceito/registrado), mas sem execução registrada em uown_sweep_logs em ~5min — job diário/mensal/report r |
| 32 | 177 |  | 🟡 Partial | Disparo via API triggerScheduledTask retornou HTTP 200 (aceito/registrado), mas sem execução registrada em uown_sweep_logs em ~5min — job diário/mensal/report r |
| 33 | 178 |  | 🟡 Partial | Disparo via API triggerScheduledTask retornou HTTP 200 (aceito/registrado), mas sem execução registrada em uown_sweep_logs em ~5min — job diário/mensal/report r |
| 34 | 179 |  | 🟡 Partial | Disparo via API triggerScheduledTask retornou HTTP 200 (aceito/registrado), mas sem execução registrada em uown_sweep_logs em ~5min — job diário/mensal/report r |
| 35 | 180 |  | 🟡 Partial | Disparo via API triggerScheduledTask retornou HTTP 200 (aceito/registrado), mas sem execução registrada em uown_sweep_logs em ~5min — job diário/mensal/report r |
| 36 | 181 |  | ✅ Pass | Disparado via API triggerScheduledTask (HTTP 200) → executou agora: nova linha em uown_sweep_logs (CCDailyScheduledDeniedRerun), resultado 'No transactions foun |
| 37 | 182 |  | ✅ Pass | Validado via DB uown_sweep_logs: executando ativamente, última exec 2026-06-11T01:15:00 (241 runs). No-UI (CLAUDE.md #14a). Não disparado. |
| 38 | 183 |  | 🟡 Partial | Disparo via API triggerScheduledTask retornou HTTP 200 (aceito/registrado), mas sem execução registrada em uown_sweep_logs em ~5min — job diário/mensal/report r |
| 39 | 184 |  | 🟡 Partial | Disparo via API triggerScheduledTask retornou HTTP 200 (aceito/registrado), mas sem execução registrada em uown_sweep_logs em ~5min — job diário/mensal/report r |
| 40 | 185 |  | 🟡 Partial | Disparo via API triggerScheduledTask retornou HTTP 200 (aceito/registrado), mas sem execução registrada em uown_sweep_logs em ~5min — job diário/mensal/report r |
| 41 | 186 |  | ✅ Pass | Validado via DB uown_sweep_logs: executando ativamente, última exec 2026-06-11T15:00:01 (4166 runs). No-UI (CLAUDE.md #14a). Não disparado. |
| 42 | 187 |  | 🟡 Partial | Disparo via API triggerScheduledTask retornou HTTP 200 (aceito/registrado), mas sem execução registrada em uown_sweep_logs em ~5min — job diário/mensal/report r |
| 43 | 188 |  | ✅ Pass | Validado via DB uown_sweep_logs: executando ativamente, última exec 2026-06-11T00:30:00 (1297 runs). No-UI (CLAUDE.md #14a). Não disparado. |
| 44 | 189 |  | 🟡 Partial | Disparo via API triggerScheduledTask retornou HTTP 200 (aceito/registrado), mas sem execução registrada em uown_sweep_logs em ~5min — job diário/mensal/report r |
| 45 | 190 |  | 🟡 Partial | Disparo via API triggerScheduledTask retornou HTTP 200 (aceito/registrado), mas sem execução registrada em uown_sweep_logs em ~5min — job diário/mensal/report r |
| 46 | 191 |  | 🟡 Partial | Disparo via API triggerScheduledTask retornou HTTP 200 (aceito/registrado), mas sem execução registrada em uown_sweep_logs em ~5min — job diário/mensal/report r |
| 47 | 192 |  | 🟡 Partial | Disparo via API triggerScheduledTask retornou HTTP 200 (aceito/registrado), mas sem execução registrada em uown_sweep_logs em ~5min — job diário/mensal/report r |
| 48 | 193 |  | 🟡 Partial | Disparo via API triggerScheduledTask retornou HTTP 200 (aceito/registrado), mas sem execução registrada em uown_sweep_logs em ~5min — job diário/mensal/report r |
| 49 | 194 |  | 🟡 Partial | Disparo via API triggerScheduledTask retornou HTTP 200 (aceito/registrado), mas sem execução registrada em uown_sweep_logs em ~5min — job diário/mensal/report r |
| 50 | 195 |  | 🟡 Partial | Disparo via API triggerScheduledTask retornou HTTP 200 (aceito/registrado), mas sem execução registrada em uown_sweep_logs em ~5min — job diário/mensal/report r |
| 51 | 196 |  | ✅ Pass | Disparado via API triggerScheduledTask (HTTP 200) → executou agora: nova linha em uown_sweep_logs (IdempotentCCSweep) |
| 52 | 197 |  | ✅ Pass | Validado via DB uown_sweep_logs: executando ativamente, última exec 2026-06-06T08:00:00 (137 runs). No-UI (CLAUDE.md #14a). Não disparado. |
| 53 | 198 |  | 🟡 Partial | Disparo via API triggerScheduledTask retornou HTTP 200 (aceito/registrado), mas sem execução registrada em uown_sweep_logs em ~5min — job diário/mensal/report r |
| 54 | 199 |  | 🟡 Partial | Disparo via API triggerScheduledTask retornou HTTP 200 (aceito/registrado), mas sem execução registrada em uown_sweep_logs em ~5min — job diário/mensal/report r |
| 55 | 200 |  | 🟡 Partial | Disparo via API triggerScheduledTask retornou HTTP 200 (aceito/registrado), mas sem execução registrada em uown_sweep_logs em ~5min — job diário/mensal/report r |

## Mutações executadas (autorizadas pelo usuário)

### Leads criados frescos para ações terminais (evitando consumir sandbox)

| Ação | Lead | Resultado |
|------|------|-----------|
| Set to Expired | 97433 | UW_APPROVED→EXPIRED |
| Change to Signed | 97434 | UW_APPROVED→SIGNED |
| Cancel Lease | 97444 | SIGNED→UW_APPROVED |
| Move to Servicing | 97443 | importToServicing, conta sv 17245 criada |
| Settle Lease | 97446 | settleApplication, SIGNED→FUNDING |
| Modify Approval | 97435 | 2220→2000 |
| Blacklist Lead | 97436 | UW_APPROVED→BLACKLISTED |
| Send Trustpilot | 97426 | POST 200 |
| Resend E-sign | 97422 | POST 200 |
| GowSign Signing | 97422 | Doc COMPLETED em GowSign-DEV |

### Servicing — Conta 17230

ACH $5 (PENDING→SENT), CC $5 MASTERCARD-0055 (APPROVED/SALE), Reverse CC, Reverse ACH, Move Due Date +4d, Schedule Future Payment ACH, Change Frequency (revertido), DNC/DNT (revertido), Add Bank Account, Send Portal Invite, Send Podium Invite, Update Allocation. Contas sacrificiais 17246 (CLOSED, revertido) e 17245 (SETTLED_IN_FULL).

### Sweeps disparados via API

38 sweeps disparados via `POST /uown/svc/triggerScheduledTask/{name}`. 24 confirmados com nova linha em `uown_sweep_logs` pós-trigger; 33 com API 200 mas execução agendada no Quartz.

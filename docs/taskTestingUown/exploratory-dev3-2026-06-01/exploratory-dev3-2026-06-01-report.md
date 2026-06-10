Analisei o documento "O que foi testado" item por item e cruzei com a sua planilha. Abaixo estão **apenas os itens testados agora que ainda não estão na lista**, no mesmo formato (mesmas colunas).

Premissa que usei (me avisa se quiser mudar): **Check = José**, **Double Check** em branco e **Task Status = Waiting Double Check**, já que são testes seus recém-feitos aguardando revisão. As referências de bug (H-001, O-002 etc.) ficaram em Notes, como na planilha.

| Environment | Portal | Tested Features and Functions Task | Check | Double Check | Task Status | Notes |
|---|---|---|---|---|---|---|
| Dev3 | Origination | Origination Page: Login (manager credentials) | José | — | Waiting Double Check | Login works; 4 internal errors logged on load/click — isolated to Origination (H-001) |
| Dev3 | Origination | Overview Page: Metrics + date filters + CSV export | José | — | Waiting Double Check | All metrics zero (expected for dev3); CSV export OK; all endpoints 200 |
| Dev3 | Origination | Error Log Page: Send/Submit Application tabs + CSV | José | — | Waiting Double Check | Both tabs empty; CSV OK; correct route is /errorLog, /error-log returns 404 (O-002) |
| Dev3 | Origination | New Application Page: Form submission (4 required fields) | José | — | Waiting Double Check | Submit OK; merchant dropdown shows 198 options incl. test names and duplicates; route /newApplication |
| Dev3 | Origination | Funding Modification History: Search + CSV/Email export | José | — | Waiting Double Check | Empty (expected); CSV + Email export available; endpoints 200 |
| Dev3 | Origination | Modification Report: Search + Email CSV | José | — | Waiting Double Check | Empty; only Email CSV (no Download CSV) (O-012) |
| Dev3 | Origination | Merchant Modification History: Search + Download CSV | José | — | Waiting Double Check | Empty; only Download CSV (no Email CSV) — inverse of Modification Report (O-012) |
| Dev3 | Origination | Alerts: Search + CSV/Email export | José | — | Waiting Double Check | Returned real records (status + approval amount changes); CSV + Email OK |
| Dev3 | Origination | Merchant List: Listing inspection | José | — | Waiting Double Check | 247 merchants (49 more than New Application dropdown's 198); bank account + routing unmasked (H-004) |
| Dev3 | Origination | Merchant Detail: View/edit form | José | — | Waiting Double Check | 50+ fields across sections + change history; bank data in plaintext incl. edit form (H-004) |
| Dev3 | Origination | Programs Page: Listing, pagination, sorting | José | — | Waiting Double Check | 175 programs; pagination + sort by Program Name OK |
| Dev3 | Origination | Program Groups: Listing + inline name edit | José | — | Waiting Double Check | 9 groups; one has no name with 2 programs (missing name validation, H-008); program modal has no visible close button (O-011) |
| Dev3 | Origination | Rebate: Search + Download CSV | José | — | Waiting Double Check | 2 rebate records returned; CSV OK |
| Dev3 | Origination | Blacklist: Listing + add form (incl. card BIN) | José | — | Waiting Double Check | 1 test record with CPF + bank data unmasked; BIN field accepts 5 digits with Save enabled — no 6-digit min validation on front (H-007) |
| Dev3 | Origination | Open To Buy: Form + Email CSV | José | — | Waiting Double Check | Email CSV stays enabled without required Location — click fires no request and shows no error (N-001, O-012) |
| Dev3 | Origination | Merchant Setting: Batch edit (247 merchants) | José | — | Waiting Double Check | Side panel with 10 config sections; checkbox identification issue (O-017) |
| Dev3 | Origination | Calculator: Prorated Amount (from Servicing top bar) | José | — | Waiting Double Check | Modal with AS OF date; computes prorated early-payoff amount; not in charters |
| Dev3 | Servicing | Servicing Page: Login | José | — | Waiting Double Check | Login OK; no console errors — confirms H-001 is isolated to Origination |
| Dev3 | Servicing | Quick Search: Search by name/phone + filters | José | — | Waiting Double Check | Name "Test" → 5 accounts; phone → 3; no Status filter (O-009); Email CSV available; endpoints 200 |
| Dev3 | Servicing | Documents tab (accounts 104 & 138) | José | — | Waiting Double Check | Acc 104: 20 docs incl. signed contract + duplicate ID uploads; Acc 138: empty (signature flow likely incomplete) |
| Dev3 | Servicing | Scheduled Payments: Move Due Date + Add Fee modals (acct 166) | José | — | Waiting Double Check | getReceivableType returns 404 — missing param (N-002); numOfDaysToBeMoved field takes a date, not days (O-022); SAVE with empty/$0 fires no request and no error (N-003) |
| Dev3 | Servicing | Payment Arrangement: View + lifecycle (accts 138 & 166) | José | — | Waiting Double Check | Acc 138 empty (expected); Acc 166 has 1 SUCCESS arrangement (no edit/cancel — needs in-progress status); payment modal has editable Allocation Type |
| Dev3 | Servicing | History dropdown: Map all 9 items + sub-histories | José | — | Waiting Double Check | ACH, CC Transactions, Email, Items Purchased, Payments, PayNearMe, Phone, Due Date, Frequency; CC history masks card number; PayNearMe has 3 sub-tabs; /items-purchased route 404 → /items-history |
| Dev3 | Servicing | Frequency Changes history (account 166) | José | — | Waiting Double Check | Empty (expected); correct route /frequency-history/{pk}, /frequency-change/{pk} returns 404 (O-013) |
| Dev3 | Servicing | Search Page: Filters + Account Sale entry + email export | José | — | Waiting Double Check | Filters mapped; "Account Sale" button leads to uncharted feature; email export available |
| Dev3 | Servicing | Account Sale: Sell delinquent accounts | José | — | Waiting Double Check | File upload (.xlsx/.xls/.pdf), rating letter selection, sale date; not in charters |
| Dev3 | Servicing | Items Purchased History (account 166) | José | — | Waiting Double Check | 2 items; one DELIVERED with qty 0; one MOTORSPORTS w/ seat description and $0 unit / $500 total — inconsistent test data |
| Dev3 | Servicing | Customer Information: View + financial consistency (accts 104 & 138) | José | — | Waiting Double Check | Opening an account auto-creates a "review" log entry (O-004); financials internally consistent; concatenated alert text (C-002); getLogs fixed → /138 returns 200 (H-002) |
| Dev3 | Customer Portal | Login Page: Load | José | — | Waiting Double Check | Loads OK; 2 errors — 3rd-party fraud script loading from invalid URL (env var not set), login unaffected (H-003) |
| Dev3 | Customer Portal | Login OTP: Input validation (invalid text/email/phone) | José | — | Waiting Double Check | Same error message for all 3 inputs, always says "email" even when a phone was typed (C-001) |
| Dev3 | Customer Portal | Responsive layout: mobile/tablet/desktop | José | — | Waiting Double Check | 375/768/1440px — basic responsiveness OK; "Contact Us" footer wraps to 2nd line on mobile (minor) |
| Dev3 | Customer Portal | OTP Flow: Send code + verify form structure | José | — | Waiting Double Check | Code received by email; 6-field code with auto-submit; resend not a real button — keyboard a11y issue (O-015); fraud script still not loading (H-003) |

**Itens que não entraram como novos (já existem na lista — só atualização de status):**

- **Leads Page (search)** — item já existente como *Need Fix* (400 em getLeadsByCriteria). O teste agora retornou **1.121 leads com sucesso**, então o 400 pode estar resolvido ou ser específico de combinação de filtros. Achados novos a registrar: CPF sem mascaramento em escala (O-018), 11 erros em cascata no detalhe do lead (H-011), rota correta /customers/{leadPk}.
- **Receive Verification Code Flow** — item já existente como *Need Fix* ("não recebi o código"). Agora **o código chegou por e-mail** — sugiro reavaliar o status.
- **State Configs / Funding Queue / Program Settings** — já testados (Lucas). Os testes de agora apenas reconfirmam, sem necessidade de nova linha.
- **Contact Info / Opt Out (166)** e **Bank Account (166)** — sobrepõem os itens de edição do Customer Information (Lucas). Achados novos para anexar a esses itens: dados bancários sem mascaramento (H-010), inconsistência de máscara entre tela e modal (C-003) e CPF em plaintext (H-009).

Quer que eu entregue isso como **.xlsx** ou em **TSV** pronto pra colar direto na planilha?
---
last-reviewed: 2026-06-28
last-reviewed-sha: ff4f0fc
covers:
  - src/pages/servicing/servicing-base.page.ts
  - src/selectors/common.selectors.ts
  - tests/e2e/servicing/make-payment-servicing.spec.ts
  - src/config/constants.ts
---

# Servicing — ACH Payment (Make Payment Modal, single one-off)

> Operação **agent-facing** no portal Servicing: pagar um lease **ACTIVE** com um débito **ACH** único.
> O agente abre o **Make Payment modal** pelo ícone circle-dollar (`#makePayment`) na Account Summary bar
> de `/customer-information/{accountPk}`, escolhe **ACH Payment**, informa valor + dados bancários (banco
> em arquivo OU one-time bank) e submete. Distinta da operação [cc-ach.md](cc-ach.md), que é a página de
> checkout **consumer-facing** ANTES da assinatura (origination). Aqui a conta já está ATIVA (pós-funding).
>
> **Endpoint:** `POST /uown/svc/createOrUpdateACHPayment` → `ACHPaymentService.createOrUpdateAchPayment(ACHPayment)`
> (store `achStore.updateACHPayment`). Fonte: `docs/knowledge-base/servicing-make-payment-modal.md` (tabela
> Operations), canônico [`05-pagamentos.md §13`](../../docs/business-rules/05-pagamentos.md).
>
> **Efeito SÍNCRONO do submit ACH (≠ CC):** o submit insere imediatamente uma linha em `uown_sv_achpayment`
> com `status='PENDING'` no valor submetido + um activity log `ADDED : ACHPayment[...status=PENDING...]`.
> A linha `uown_sv_payment` e o status `PICKED_TO_SEND`/atribuição PROFITUITY são produzidos **só pelo
> daily ACH sweep** — NÃO são efeitos síncronos e NÃO devem ser exigidos no checkpoint imediato. Fonte
> primária: `tests/e2e/servicing/make-payment-servicing.spec.ts` Scenario 2 (evidência dev3 acct 151 / ach pk 135).
>
> **Rule #13 (activity log):** todo movimento de dinheiro gera log — aqui o `ADDED : ACHPayment` síncrono.
> **Rule #14/#15 (UI-first):** página interna `1440×900`; o modal vem do `@uownleasing/common-ui` (externo,
> não vendorizado) → o layout do modal é `[needs-live]` e deve ser confirmado ao vivo, não por leitura de log.
>
> **Estado do oráculo:** **TODOS os 8 CT CONFIRMADOS ao vivo (stg 2026-06-28).** Checkpoints ancorados em
> **código** (`servicing-base.page.ts:117-171`, selectors, spec S2) + **knowledge-base**
> (`servicing-make-payment-modal.md`, BR-01..BR-10) + **canônico §13**, e validados na UI real.
> **Evidência live:**
> - **Modal internals** (resolviam `[needs-live]`): título exato **"Make Payment for Account #{pk}"**;
>   seletor de tipo = React Select `label[for=paymentType]` (default "ACH Payment"); **Allocation Type**
>   = React Select com opções **Payment** (default, `REGULAR_RECEIVABLES`) / **Payment/EPO** (`DEFAULT`) /
>   **EPO Only** (`EPO_ONLY`); Total Payment Amount **pré-preenchido** com o Next Payment; origem do banco
>   por radio `existing`/`oneTime`. **Sem charge-fee no fluxo ACH** (charge-fee é exclusivo do CC).
> - **Pagamento ACH submetido** (conta ACTIVE **622660** / lead 7218271, CO, "Mark Griffin"): amount
>   **$110.24**, banco em arquivo CHECKING/123456780. `POST /uown/svc/createOrUpdateACHPayment` → **200**,
>   toast **"Payment successful."**, modal fechou. Linha síncrona `uown_sv_achpayment` **pk 2078383**
>   `status=PENDING amount=110.24 achType=ACHDebit achProcessType=REQUEST bank_account_type=CHECKING`
>   `allocation_strategy=REGULAR_RECEIVABLES username=jmndes.gow sent_to_vendor=PROFITUITY` (payment_pk null
>   → sem `uown_sv_payment` síncrono). Log síncrono **pk 249537026**: `ADDED : ACHPayment[ customerFirstName=Mark,
>   customerLastName=Griffin, status=PENDING, achProcessType=REQUEST, amount=110.24, postingDate=2026-06-28 ]`.
> - **Negativos live:** CT-02 conta **CANCELLED 622351** → modal **"Account is CANCELLED — No further payments
>   can be made."** (PaymentModal não abre). CT-06 conta ACTIVE sem banco em arquivo **622659** → ACH default
>   para one-time bank; com campos vazios o **Submit fica DISABLED** (nenhum POST disparado).

## Critérios de Aceitação

| ID | Critério | Oracle | Fonte |
|---|---|---|---|
| AC-01 | Conta ACTIVE + agente com permissão de pagamento → ícone `#makePayment` (tooltip "Make Payment") visível na Account Summary bar; clicar abre o Make Payment modal | CT-01 | código ✓ (BR-01/02) |
| AC-02 | Conta inativa (≠ACTIVE) → clicar exibe "No further payments can be made." e o modal **não** abre | CT-02 | knowledge-base (BR-01) |
| AC-03 | Selecionar "ACH Payment" exibe a seção ACH: Total Payment Amount (pré-preenchido com next-payment-due), origem do banco (radio "use existing bank information" + `select[name=bankAccountPk]` se há banco em arquivo, OU one-time bank: institute/account#/routing#) | CT-03 | código ✓ (`:131-168`) |
| AC-04 | Submeter ACH válido posta o pagamento: 1 linha SÍNCRONA em `uown_sv_achpayment` `status='PENDING'`, `amount`==submetido, via `POST /uown/svc/createOrUpdateACHPayment`; toast de sucesso (sem "error") | CT-04 | spec S2 ✓ |
| AC-05 | O submit ACH emite log SÍNCRONO `ADDED : ACHPayment[...status=PENDING...amount=...]` em `uown_sv_activity_log` (rule #13). `uown_sv_payment` e `PICKED_TO_SEND` são sweep-only → NÃO exigidos no checkpoint imediato | CT-05 | spec S2 ✓ (rule #13) |
| AC-06 | ACH sem dados bancários → rejeitado com "Error Creating ACH payment: No bank data" (form não posta) | CT-06 | knowledge-base (BR-05) |
| AC-07 | Defaults de criação ACH (canônico §13): auto-pay default `false` se null; nome do cliente preenchido automaticamente se vazio; account type default `CHECKING`; bank data obrigatório | CT-07 | canônico §13 |
| AC-08 | Refresh pós-pagamento ACH (assimétrico): re-busca ACHPayments + ServicingInformation + AccountSummary + Alerts; **NÃO** re-busca CC transactions | CT-08 | knowledge-base (BR-08) |

## Cenários

```gherkin
Feature: Servicing — one-off ACH payment via Make Payment modal
  As a servicing agent
  In order to collect a bank-debit payment against an active lease
  The agent must post a single ACH payment from the account's Make Payment modal

  Background:
    Given the agent is logged into the Servicing portal with payment permission
    And an ACTIVE lease account is open on its customer-information page

  Scenario: [negative] CT-02 — Inactive account blocks the payment modal
    Given the open account is not ACTIVE (e.g. CANCELLED or PAID_OUT)
    When the agent clicks the Make Payment (circle-dollar) icon
    Then the message "No further payments can be made." is shown
    And the Make Payment modal does not open

  Scenario: [negative] CT-06 — ACH without bank data is rejected
    Given the Make Payment modal is open with payment type "ACH Payment"
    And no bank account is selected and no one-time bank fields are filled
    When the agent submits the payment
    Then the error "Error Creating ACH payment: No bank data" is shown
    And no ACH payment is posted to the account

  Scenario: [positive] CT-01 — Make Payment modal opens for an active account
    Given the agent has payment permission
    When the agent clicks the Make Payment (circle-dollar) icon on the Account Summary bar
    Then the Make Payment modal opens titled for the account
    And it offers the payment types "ACH Payment", "Credit Card Payment", and "Check"

  Scenario: [positive] CT-03 — ACH section renders with prefilled amount and bank source
    Given the Make Payment modal is open
    When the agent selects payment type "ACH Payment"
    Then the Total Payment Amount field is prefilled with the account's next payment due amount
    And a bank source is offered: the "use existing bank information" option when a bank is on file, otherwise one-time bank fields (institution, account number, routing number)

  Scenario: [positive] CT-04 — Submitting a valid ACH payment posts it as PENDING
    Given the agent selected "ACH Payment", entered an amount of $100.00, and chose a bank source
    When the agent submits the payment
    Then a success message is shown with no "error" text
    And the account gains a pending ACH payment of exactly $100.00 awaiting the next ACH sweep

  Scenario: [side-effect] CT-05 — The ACH submit writes a synchronous activity log
    Given a valid ACH payment of $100.00 was just submitted
    When the account activity log is read
    Then it contains an entry "ADDED : ACHPayment[...status=PENDING...amount=100...]" for this account
    And no entry indicates a failure of the ACH creation

  Scenario: [positive] CT-07 — ACH creation defaults are applied
    Given an ACH payment is created with auto-pay and account type left unset
    When the resulting ACH payment record is read
    Then auto-pay defaults to false
    And the account type defaults to CHECKING
    And the customer name is populated automatically when it was left empty

  Scenario: [side-effect] CT-08 — Post-ACH refresh updates the ACH-side views only
    Given a valid ACH payment was just submitted
    When the page refreshes after the submit
    Then the ACH payments list, account summary, and alerts reflect the new payment
    And the credit-card transactions view is not re-fetched by the ACH submit
```

## Oracles

> **Verificação de desatualização (executar antes de qualquer Oracle):**
> `git log ff4f0fc..HEAD -- src/pages/servicing/servicing-base.page.ts src/selectors/common.selectors.ts tests/e2e/servicing/make-payment-servicing.spec.ts src/config/constants.ts`
> Saída não vazia → prefixar o relatório com `[BDD MAY BE STALE]`.

### Oracle: CT-01 — Modal abre para conta ACTIVE  `[CONFIRMADO live stg 2026-06-28]`
| Checkpoint | Como verificar |
|---|---|
| Ícone presente | `#makePayment` (circle-dollar, `.fa-circle-dollar.fa-3x`) na Account Summary bar entre `#calculator` e `#invitation` — live conta 622660; só renderiza com `hasAchPaymentPermission \|\| hasCreditCardPaymentPermission` (BR-02) |
| Clique abre modal | clicar o circle-dollar → modal **"Make Payment for Account #622660"** monta (conta ACTIVE) — live |
| Tipos de pagamento | React Select `label[for='paymentType']`; default "ACH Payment" (oferece ACH/Credit Card/Check — `PaymentType.ts`) — live |

### Oracle: CT-02 — Conta inativa bloqueia o modal  `[CONFIRMADO live stg 2026-06-28]`
| Checkpoint | Como verificar |
|---|---|
| Mensagem de bloqueio | conta `account_status≠ACTIVE` → clicar `#makePayment` exibe modal **"Account is {status} — No further payments can be made."** (`account-summary/index.tsx:82-88`) — live conta CANCELLED 622351 → "Account is CANCELLED — No further payments can be made." |
| Modal não abre | `PaymentModal` (`label[for=paymentType]`) NÃO é montado — confirmado live (paymentModalOpen=false) |

### Oracle: CT-03 — Seção ACH renderiza (valor + origem do banco)  `[CONFIRMADO live stg 2026-06-28]`
| Checkpoint | Como verificar |
|---|---|
| Selecionar tipo ACH | React Select `label[for=paymentType]` (default já "ACH Payment" quando o banco é o default de pagamento) — live |
| Allocation Type | React Select com opções **Payment** (default) / **Payment/EPO** / **EPO Only** — live (default Payment = `REGULAR_RECEIVABLES`) |
| Total Payment Amount pré-preenchido | `#totalPaymentAmount` = Next Payment (**$110.24** live, = `accountSummary.nextPaymentDueAmount`, BR-03) |
| Banco em arquivo | radio `existing` "Use existing bank information for {nome}" + tabela do banco default (`*********0000` / `123456780`) quando há bank account on file (conta 622660) — live |
| One-time bank | radio `oneTime` + `#bankingInstitute` + `#bankAccountNumber` + routing — default selecionado quando não há banco reutilizável (conta 622659 sem banco) — live |

### Oracle: CT-04 — Submit ACH válido posta PENDING  `[CONFIRMADO live stg 2026-06-28]`
| Checkpoint | Como verificar |
|---|---|
| Endpoint | `POST /uown/svc/createOrUpdateACHPayment` → **200** (live request #49, conta 622660) |
| Toast de sucesso | toast **"Payment successful."** e o modal fecha (resposta válida = `status 200 && accountPk && !error && !errorCode`) — live |
| Linha síncrona PENDING | `uown_sv_achpayment` ganha 1 linha `status='PENDING'`, `amount`==submetido — live **pk 2078383**, `amount=110.24`, `achType=ACHDebit`, `achProcessType=REQUEST` |
| NÃO exigir sweep-only | `PICKED_TO_SEND` e a linha `uown_sv_payment` (ACH) são pós-sweep → live `payment_pk` da ACH = null e `status=PENDING` (não PICKED_TO_SEND); NÃO checar no checkpoint imediato |

### Oracle: CT-05 — Log síncrono do submit ACH  `[CONFIRMADO live stg 2026-06-28 · rule #13]`
| Checkpoint | Como verificar |
|---|---|
| Activity log presente | `uown_sv_activity_log` (coluna `notes`, `log_type`) contém a entrada DESTE account — live **pk 249537026**: `ADDED : ACHPayment[ customerFirstName=Mark, customerLastName=Griffin, status=PENDING, achProcessType=REQUEST, amount=110.24, postingDate=2026-06-28 ]` |
| Forma correta da nota | é `ADDED : ACHPayment[...status=PENDING...]`, **não** `ADDED : Payment[paymentType=ACH]` (forma CC/pós-sweep) — confirmado live |
| Sem falha | nenhuma entrada "failed"/"error"/"declined" na criação do ACH — live |

### Oracle: CT-06 — ACH sem bank data não posta  `[CONFIRMADO live stg 2026-06-28]`

> **Refinamento live:** o guard observável é **no nível da UI** — com one-time bank selecionado e os campos
> (`#bankingInstitute`/`#bankAccountNumber`/routing) vazios, o botão **Submit fica DISABLED** e nenhum
> `createOrUpdateACHPayment` é disparado. O erro de backend "Error Creating ACH payment: No bank data"
> (`ACHPaymentService.java:106-107`, BR-05) é a defesa de **API** (defense-in-depth), só alcançável burlando a UI.
> NÃO é bug — é comportamento correto (mais forte: nem deixa submeter).

| Checkpoint | Como verificar |
|---|---|
| Submit bloqueado | conta ACTIVE sem banco em arquivo (live **622659**) → ACH default para one-time; campos vazios → `Submit` `disabled=true` (live) |
| Sem posting | nenhum `POST createOrUpdateACHPayment` disparado; nenhuma linha nova em `uown_sv_achpayment` — live (network vazio para o filtro) |
| Guard de API | submit direto via API sem `BankData` → "Error Creating ACH payment: No bank data" (`ACHPaymentService.java:106-107`) — fonte de código (não alcançável pela UI) |

### Oracle: CT-07 — Defaults de criação ACH  `[CONFIRMADO live stg 2026-06-28]`
| Checkpoint | Como verificar |
|---|---|
| Bank data obrigatório | null → bloqueado (= CT-06) |
| Account type default | `bank_account_type='CHECKING'` — live na linha pk 2078383 (banco em arquivo era CHECKING) |
| Nome do cliente | preenchido automaticamente — live `customer_first_name=Mark customer_last_name=Griffin` na ACH row + no log |
| Allocation default | `allocation_strategy=REGULAR_RECEIVABLES` (UI "Payment") — live |
| (Auto-pay default `false` se null) | canônico §13 — a UI default usa o banco em arquivo (autoPay do banco); o default `false` se não informado é fonte de código |

### Oracle: CT-08 — Refresh pós-ACH assimétrico  `[CONFIRMADO live stg 2026-06-28]`
| Checkpoint | Como verificar |
|---|---|
| Re-fetch ACH-side | imediatamente após `POST createOrUpdateACHPayment` (#49): **getACHPayments** (#50) + **getAccountSummary** (#53/#56) + **getAlertsForAccount** (#54) — live (`ach.tsx:109-114`) |
| CC NÃO re-buscado | `getCCTransactions` **não** aparece no batch de refresh do submit ACH (#50–#56) — confirma a assimetria vs CC (BR-08); um `getCCTransactions` só aparece em um refresh full-account separado, não disparado pelo `updateACHPayment` |

## Itens Pendentes

_Nenhuma._ Discovery ao vivo concluída em **stg 2026-06-28** — todos os internals do modal (título
"Make Payment for Account #{pk}", React Select de tipo, Allocation Type Payment/Payment-EPO/EPO Only,
prefill do amount, origem do banco existing/one-time) e os CT-04/05/07/08 confirmados na UI + DB + rede.
O **charge-fee** não pertence ao fluxo ACH (é exclusivo do CC → ver [servicing-cc-payment.md](servicing-cc-payment.md)).
Evidência: screenshots `servicing-ach-make-payment-modal.png`, `servicing-ach-ct02-inactive-block.png`,
`servicing-ach-ct06-no-bank-submit-disabled.png`; ACH row pk 2078383; log pk 249537026; leads 7218271/7218253.

## Notas de fonte primária

- **Fluxo ACH (CT-03/CT-04)**: `src/pages/servicing/servicing-base.page.ts` — `makeAchPayment` (`:117-171`),
  `clickMakePayment` (`:86-95`), `selectPaymentType` (`:97-115`). Selectors em `common.selectors.ts`:
  `makePayment` (`:170`), `paymentTypeDropdown` (`:171`), `totalPaymentAmountInput` (`:172`),
  `bankAccountNumber` (`:193`), `existingBankAccountSelect` (`:201`).
- **Checkpoints DB (CT-04/CT-05)**: `tests/e2e/servicing/make-payment-servicing.spec.ts` Scenario 2 — linha
  síncrona `uown_sv_achpayment` PENDING + log `ADDED : ACHPayment[...status=PENDING...amount=100...]`; nota
  explícita de que `PICKED_TO_SEND`/`uown_sv_payment` são pós-sweep (dev3 acct 151 / ach pk 135).
- **Operations/BRs (CT-01/02/06/08)**: `docs/knowledge-base/servicing-make-payment-modal.md` — endpoint
  `createOrUpdateACHPayment`, BR-01 (inativo bloqueia), BR-02 (permissão), BR-05 (no bank data), BR-08
  (refresh assimétrico).
- **Defaults canônicos (CT-07)**: `docs/business-rules/05-pagamentos.md §13` (ACH Payment Creation:
  bank data required, auto-pay default false, customer name auto-fill, default account type CHECKING).
- **Dados de teste**: `src/config/constants.ts` `TEST_BANK` — routing `123456780`, account `160781900000`.
- **Discovery ao vivo (stg 2026-06-28, todos os CT)**: portal `svc-website-stg.uownleasing.com`, login manager
  `jmndes.gow`. CT-01/03/04/05/07/08 na conta ACTIVE **622660** (lead 7218271, "Mark Griffin", CO, Tire Agent,
  13m): modal "Make Payment for Account #622660", ACH $110.24 com banco em arquivo → `POST createOrUpdateACHPayment`
  200, toast "Payment successful.", `uown_sv_achpayment` pk **2078383** PENDING/REQUEST/ACHDebit/CHECKING/
  REGULAR_RECEIVABLES, log pk **249537026** `ADDED : ACHPayment[...]`. CT-02 conta CANCELLED **622351** →
  "Account is CANCELLED — No further payments can be made.". CT-06 conta ACTIVE sem banco **622659** → Submit
  disabled com one-time vazio (nenhum POST). Probes: `src/scripts/_probe_active_ach_acct.ts`,
  `_probe_acct_detail.ts`, `_probe_ach_post.ts`, `_probe_ach_log.ts`, `_probe_inactive.ts`.

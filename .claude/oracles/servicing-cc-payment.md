---
last-reviewed: 2026-06-28
last-reviewed-sha: ff4f0fc83eced3e87cc79391d6c1fa8d67102ac3
covers:
  - docs/knowledge-base/servicing-make-payment-modal.md
  - docs/business-rules/05-pagamentos.md
---

# Servicing — CC Payment (Make Payment modal — single credit card payment)

> **Fonte canônica:** `docs/business-rules/05-pagamentos.md §11` (Credit Card Payments).
> **Discovery live** (sandbox, account 17298, 2026-06-28): `docs/knowledge-base/servicing-make-payment-modal.md`.
>
> Escopo: pagamento único com cartão de crédito em conta ACTIVE via modal "Make Payment" no portal Servicing.
> **Não cobre:** pagamento ACH, Check, Payment Arrangement (multi-leg), refund, CC Peek.

---

## Contexto do domínio

O botão de pagamento é um ícone **circle-dollar** (`DIV#makePayment > svg`) na barra Account Summary.
O handler React está no SVG filho — não no DIV pai. O modal monta apenas quando
`hasAchPaymentPermission || hasCreditCardPaymentPermission` = true.

A seleção **Credit Card Payment** no dropdown `#paymentType` expõe:
- checkbox `name="chargeFee"` ("Charge convenience fee") — marcado por default
- rádios `name="radio1"`: `existing` (pre-selecionado) com `select#ccPk` de cartões cadastrados, ou `oneTime` com campos completos (ccType, ccFirstName, ccLastName, ccNumber, ccExpiration, ccSecurityCode, endereço de cobrança, autoPay)
- `getCCConvenienceFee` **NÃO** é chamado automaticamente na troca de tipo — fee é opaco no modal

Kount fingerprint iframe (`tst.kaptcha.com`) carrega quando o modal abre.

---

## Feature: Pagamento com cartão de crédito no portal Servicing

```gherkin
Feature: Servicing — Pagamento CC via modal Make Payment

  Background:
    Given o agente está autenticado no portal Servicing (sandbox)
    And o agente possui permissão "payment / make_credit_card_payment"
    And a conta alvo está com status ACTIVE
    And a conta alvo possui pelo menos um cartão de crédito cadastrado

  # ─────────────────────────────────────────────────────────────────────
  # CT-01  Abertura do modal de pagamento
  # ─────────────────────────────────────────────────────────────────────
  Scenario: CT-01 — Clicar no ícone circle-dollar abre o modal de pagamento
    Given o agente está na página de Customer Information da conta (ex: /customer-information/{pk})
    And a conta está ACTIVE
    When o agente confirma o identity gate ("Customer Information Confirmation")
    And o agente clica no ícone circle-dollar (#makePayment svg) na barra Account Summary
    Then um modal é exibido com o título "Make Payment for Account #{pk}"
    And o modal contém o campo "Borrower" preenchido com o nome do cliente (somente leitura)
    And o modal contém o checkbox "Payment Arrangement" (desmarcado por default)
    And o modal contém o dropdown "Payment Type" com as opções: "ACH Payment", "Credit Card Payment", "Check"
    And o modal contém o dropdown "Allocation Type" com as opções: "Payment", "Payment/EPO", "EPO Only"
    And o modal contém o campo "Total Payment Amount" pré-preenchido com o valor de "Next Payment" da conta
    And o modal contém os botões "CANCEL" e "Submit"
    And o iframe de fingerprint Kount (tst.kaptcha.com) carrega em background

  # ─────────────────────────────────────────────────────────────────────
  # CT-02  Selecionar Credit Card Payment exibe campos específicos de CC
  # ─────────────────────────────────────────────────────────────────────
  Scenario: CT-02 — Selecionar "Credit Card Payment" expõe os campos de cartão
    Given o modal "Make Payment" está aberto para uma conta ACTIVE
    When o agente seleciona "Credit Card Payment" no dropdown "Payment Type"
    Then o campo "Charge convenience fee" (checkbox name="chargeFee") é exibido marcado por default
    And nenhum valor monetário de taxa é exibido ao lado do checkbox
    And o rádio "Use existing card information" está selecionado por default
    And um dropdown #ccPk exibe os cartões cadastrados na conta (ex: "OTHER - 6909", "MASTERCARD - 0055")
    And o rádio "Use one-time card information" está disponível (desmarcado)

  # ─────────────────────────────────────────────────────────────────────
  # CT-03  Campos exibidos ao selecionar "one-time card"
  # ─────────────────────────────────────────────────────────────────────
  Scenario: CT-03 — Selecionar "Use one-time card information" exibe campos de entrada manual
    Given o modal está aberto com "Credit Card Payment" selecionado
    When o agente seleciona o rádio "Use one-time card information"
    Then os seguintes campos ficam visíveis: Credit Card Type, First Name, Last Name, Credit Card Number, Expires On, Card Security Code
    And os campos de endereço de cobrança ficam visíveis: Address 1, Address 2, Zip Code, City, State
    And o checkbox "autoPay" (set as autopay) fica visível e desmarcado por default

  # ─────────────────────────────────────────────────────────────────────
  # CT-04  Total Payment Amount pré-preenchido com próximo vencimento
  # ─────────────────────────────────────────────────────────────────────
  Scenario: CT-04 — Total Payment Amount inicia com o valor do próximo vencimento
    Given o modal "Make Payment" está aberto para uma conta com próximo vencimento de $X
    When o agente abre o dropdown "Payment Type" e seleciona "Credit Card Payment"
    Then o campo "Total Payment Amount" exibe o valor $X
    And o campo é editável (o agente pode alterar o valor)

  # ─────────────────────────────────────────────────────────────────────
  # CT-05  Submissão de pagamento CC com cartão existente (happy path)
  # ─────────────────────────────────────────────────────────────────────
  Scenario: CT-05 — Submeter pagamento CC com cartão cadastrado processa com sucesso
    Given o modal está aberto com "Credit Card Payment" selecionado
    And o rádio "Use existing card information" está selecionado
    And um cartão válido está selecionado no dropdown #ccPk
    And o campo "Total Payment Amount" contém um valor > $0
    And o agente mantém ou edita o "Allocation Type" conforme necessário
    When o agente clica em "Submit"
    Then a requisição POST /uown/svc/makeCreditCardPayment é enviada com o payload correto
    And o modal fecha após resposta HTTP 200 sem errorCode
    And a barra Account Summary é atualizada automaticamente (getAccountSummary re-fetch)
    And a lista de CC Transactions é atualizada automaticamente (getCCTransactions re-fetch)
    And as Alerts são re-fetched automaticamente (getAlertsForAccount)
    And o painel "ServicingInformation" é re-fetched automaticamente (getServicingInfo)

  # ─────────────────────────────────────────────────────────────────────
  # CT-06  Activity log gerado após pagamento CC
  # ─────────────────────────────────────────────────────────────────────
  Scenario: CT-06 — Pagamento CC gera entradas no activity log da conta
    Given um pagamento CC foi submetido com sucesso (CT-05)
    When o agente verifica o painel "Notes" da conta
    Then existe uma entrada de log com type DATA_CHANGE contendo "ADDED : Payment[ paymentType = CC"
    And existe uma entrada de log com type CREDIT_CARD contendo o valor pago, postingDate, status APPROVED, número do cartão e Charge Fee
    And existe uma entrada de log com type CORRESPONDENCE do SYSTEM contendo "Created PaymentReceiptEmail to be sent as EMAIL"
    And existe uma entrada de log com type CORRESPONDENCE do SYSTEM contendo "Created PaymentReceiptSms to be sent as SMS"
    And existe uma entrada de log com type CORRESPONDENCE do SYSTEM contendo "Sent PaymentReceiptEmail"

  # ─────────────────────────────────────────────────────────────────────
  # CT-07  Conta INACTIVE — modal de pagamento NÃO abre
  # ─────────────────────────────────────────────────────────────────────
  Scenario: CT-07 — Clicar no ícone de pagamento em conta INACTIVE mostra aviso e não abre o modal
    Given o agente está na página de Customer Information de uma conta com status diferente de ACTIVE
    When o agente confirma o identity gate
    And o agente clica no ícone circle-dollar (#makePayment svg)
    Then uma mensagem "No further payments can be made." é exibida
    And o modal "Make Payment for Account #{pk}" NÃO é aberto

  # ─────────────────────────────────────────────────────────────────────
  # CT-08  Cancelar modal não processa pagamento
  # ─────────────────────────────────────────────────────────────────────
  Scenario: CT-08 — Clicar em CANCEL fecha o modal sem processar pagamento
    Given o modal "Make Payment" está aberto com campos preenchidos
    When o agente clica no botão "CANCEL"
    Then o modal fecha
    And nenhuma requisição POST /uown/svc/makeCreditCardPayment é enviada
    And os dados da conta (Account Summary, CC Transactions) não se alteram
```

---

## Checklist de pré-condições para execução do oráculo

- [ ] Conta ACTIVE em sandbox com pelo menos 1 cartão de crédito cadastrado
- [ ] Agente autenticado com permissão `payment / make_credit_card_payment`
- [ ] Cartão de teste disponível: `SERV_CC_NUMBER` (env var — ex: 5146...0055)
- [ ] Para CT-07: conta com status INACTIVE/CANCELLED/etc.

---

### Oracle

> **Verificação de desatualização** — execute antes de cada validação:
> ```bash
> git log ff4f0fc83eced3e87cc79391d6c1fa8d67102ac3..HEAD -- docs/knowledge-base/servicing-make-payment-modal.md docs/business-rules/05-pagamentos.md
> ```
> Output vazio → BDD corrente. Output com commits → prepend `[BDD MAY BE STALE]`.

| CT | Checkpoint | Como verificar | Resultado esperado |
|----|-----------|----------------|--------------------|
| CT-01 | Modal abre com título correto | `document.querySelector('[role="dialog"] .index-module_font_bold__L13Kn')?.textContent` | `"Make Payment for Account #<pk>"` |
| CT-01 | Dropdown Payment Type presente | `document.querySelector('#paymentType')` visible | React-Select com placeholder ou valor selecionado |
| CT-01 | Campo Total Payment Amount pré-preenchido | `document.querySelector('#totalPaymentAmount')?.value` | Igual ao "Next Payment" da conta |
| CT-01 | Kount iframe carrega | `document.querySelector('iframe[src*="kaptcha.com"]')` visible | iframe presente |
| CT-02 | Charge convenience fee checkbox aparece ao selecionar CC | `document.querySelector('input[name="chargeFee"]')` | visible e `checked = true` |
| CT-02 | Nenhum valor de taxa ao lado do checkbox | Snapshot do label "Charge convenience fee" | Apenas o texto do label, sem `$` |
| CT-02 | Radio "existing" pré-selecionado | `document.querySelector('input[name="radio1"][value="existing"]')?.checked` | `true` |
| CT-02 | Dropdown #ccPk lista cartões da conta | `document.querySelector('#ccPk')?.options` | ≥1 opções com formato "TIPO - ÚLTIMOS4" |
| CT-03 | Campos one-time visíveis ao selecionar rádio | `#ccNumber, #ccExpiration, #ccSecurityCode, #ccFirstName, #ccLastName` | visible após selecionar oneTime |
| CT-04 | Total Amount = próximo vencimento | `$('#totalPaymentAmount').value` vs `accountSummary.nextPaymentDueAmount` | Iguais |
| CT-05 | POST /makeCreditCardPayment disparado | Network panel ou `browser_network_requests` filter `makeCreditCardPayment` | Status 200, sem `errorCode` no body |
| CT-05 | Modal fecha após sucesso | `document.querySelector('[role="dialog"]')` após resposta | `null` (modal removido do DOM) |
| CT-05 | AccountSummary re-fetched | Network: `GET /uown/svc/getAccountSummary/{pk}` após POST | Presente na sequência pós-POST |
| CT-05 | CCTransactions re-fetched | Network: `GET /uown/svc/getCCTransactions/{pk}` após POST | Presente na sequência pós-POST |
| CT-06 | Activity log DATA_CHANGE | Notes table → row com type DATA_CHANGE | `"ADDED : Payment[ paymentType = CC paymentAmount = X paymentDate = YYYY-MM-DD]"` |
| CT-06 | Activity log CREDIT_CARD | Notes table → row com type CREDIT_CARD | `"Updated Credit Card Transaction Type : SALE, postingDate : YYYY-MM-DD, Amount : $X, Status : APPROVED, On Card XXXX, Charge Fee : true"` |
| CT-06 | Activity log CORRESPONDENCE email criado | Notes table → SYSTEM / CORRESPONDENCE | `"Created PaymentReceiptEmail to be sent as EMAIL"` |
| CT-06 | Activity log CORRESPONDENCE SMS criado | Notes table → SYSTEM / CORRESPONDENCE | `"Created PaymentReceiptSms to be sent as SMS"` |
| CT-06 | Activity log CORRESPONDENCE email enviado | Notes table → SYSTEM / CORRESPONDENCE | `"Sent PaymentReceiptEmail. Subject : Payment Receipt - Account #<pk>."` |
| CT-07 | Mensagem "No further payments can be made." | Snapshot do modal aberto | Texto exato presente; form `paymentModal` ausente |
| CT-08 | Nenhum POST enviado ao cancelar | Network filter `makeCreditCardPayment` | Ausente após CANCEL |

---

## Resultado da validação — 2026-06-28 (sandbox, account 17298)

> Verificação de desatualização: `git log ff4f0fc83eced3e87cc79391d6c1fa8d67102ac3..HEAD -- ...` → output vazio. BDD corrente.

| CT | Checkpoint | Resultado | Evidência |
|----|-----------|-----------|-----------|
| CT-01 | Modal abre com título correto | **PASS** | `"Make Payment for Account #17298"` observado no DOM |
| CT-01 | Dropdown Payment Type presente | **PASS** | React-Select `#paymentType` com opções ACH / Credit Card / Check |
| CT-01 | Total Payment Amount pré-preenchido | **PASS** | `$44.18` == "Next Payment" da conta |
| CT-01 | Kount iframe carrega | **PASS** | `iframe[src*="kaptcha.com"]` presente no DOM |
| CT-02 | chargeFee checkbox marcado | **PASS** | `checked = true`, sem valor monetário ao lado |
| CT-02 | Radio "existing" pré-selecionado | **PASS** | `input[name="radio1"][value="existing"].checked = true` |
| CT-02 | #ccPk lista cartões | **PASS** | Opções: "OTHER - 6909", "MASTERCARD - 0055" |
| CT-03 | Campos one-time visíveis | **PASS** | `#ccNumber`, `#ccExpiration`, `#ccSecurityCode`, `#ccFirstName`, `#ccLastName` visíveis após selecionar rádio "oneTime" |
| CT-04 | Total Amount == próximo vencimento | **PASS** | Valor `$44.18` pré-preenchido (= Next Payment) |
| CT-05 | POST 200 /makeCreditCardPayment | **PASS** | HTTP 200, sem errorCode; MASTERCARD 0055, Amount $131.18 |
| CT-05 | Modal fecha após sucesso | **PASS** | `[role="dialog"]` null imediatamente após POST 200 |
| CT-05 | getAccountSummary re-fetched | **PASS** | Network: GET getAccountSummary/17298 após POST |
| CT-05 | getCCTransactions re-fetched | **PASS** | Network: GET getCCTransactions/17298 após POST |
| CT-06 | Activity log DATA_CHANGE | **PASS** | `DATA_CHANGE \| jmendes.gow \| ADDED : Payment[ paymentType = CC paymentAmount = 131.18 paymentDate = 2026-06-28]` |
| CT-06 | Activity log CREDIT_CARD | **PASS** | `CREDIT_CARD \| jmendes.gow \| Updated Credit Card Transaction Type : SALE, postingDate : 2026-06-28, Amount : $131.18, Status : APPROVED, On Card 0055, Charge Fee : true` |
| CT-06 | Activity log CORRESPONDENCE email criado | **PASS** | `CORRESPONDENCE \| SYSTEM \| Created PaymentReceiptEmail to be sent as EMAIL` |
| CT-06 | Activity log CORRESPONDENCE SMS criado | **PASS** | `CORRESPONDENCE \| SYSTEM \| Created PaymentReceiptSms to be sent as SMS` |
| CT-06 | Activity log CORRESPONDENCE email enviado | **PASS** | `CORRESPONDENCE \| SYSTEM \| Sent PaymentReceiptEmail. Subject : Payment Receipt - Account #17298. To : fintechgroup777+...` |
| CT-07 | "No further payments can be made." em conta CANCELLED | **PASS** | Dialog text: `"Account is CANCELLED\nNo further payments can be made."` ; `form#paymentModal` ausente no DOM |
| CT-08 | Nenhum POST após CANCEL | **PASS** | Zero requisições `/makeCreditCardPayment` após clicar CANCEL; modal removido do DOM |

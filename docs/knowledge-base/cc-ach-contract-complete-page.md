---
title: CC/ACH — Página de Pagamento do Contrato (`/complete`)
domain: knowledge-base
status: snapshot
volatility: volatile
last_verified: 2026-06-28
sources:
  - env: stg
  - lead: 7218254 (Stephanie Bell, TireAgent OW90218-0001, CA, $1921.50/13m)
covers: [cc-ach-contract-complete-page, contract-complete, cc-form, ach-form, submit-application, getMissingFields, contract-url, missingDataPanel, missingDataForm]
promoted_to: []
---

# CC/ACH — Página de Pagamento do Contrato (`/complete`)

> Investigação ao vivo — stg, 2026-06-28. Lead 7218254 (Stephanie Bell, TireAgent OW90218-0001,
> CA, $1921.50 / 13m). Doc/shortCode `2bF9Zc6e`, planId `WK13`.
> Screenshots: `cc-ach-complete-desktop-1440.png`, `cc-ach-complete-mobile-375.png` (raiz do repo).

## O que é

A página consumer-facing onde o cliente informa o método de pagamento **antes da assinatura**. É a
"contract URL" gerada pelo fluxo de criação do lease, distinta do formulário de aplicação (`apply-{env}`).

- **URL:** `https://secure-{env}.uownleasing.com/{shortCode}/complete?planId={planId}`
  (UOWN) — Kornerstone usa `secure-{env}.kornerstoneliving.com`.
- **Live confirmado (stg):** `https://secure-stg.uownleasing.com/2bF9Zc6e/complete?planId=WK13`.
- Título da página: `Uown | Merchant`.

## Como obter a URL (precondição)

```
sendApplication (lead APPROVED)
  → getApplicationStatus (approvedAmount)
  → sendInvoice (orderTotal = approvedAmount)
  → resposta.paymentDetailsList[idx].redirectUrl   (idx = 1 se length>1, senão 0)
```

A URL é **single-use / stateful**:
- chamar `authorizeCreditCard` via API **invalida** a URL;
- um 2º `sendInvoice` regenera o plano e **invalida** a URL anterior → "Invalid link" no portal.

Probe usado: `src/scripts/_probe_cc_ach_url.ts <env>` (gitignored).

## Config-driven pelo merchant (chave!)

**Quais campos a página exibe depende de DOIS flags do merchant** (colunas booleanas de `uown_merchant`,
confirmadas via `docs/database-schema.md`):

| Flag do merchant (label da UI) | Coluna `uown_merchant` | Efeito na página `/complete` |
|---|---|---|
| **Require Credit Card Before Signing** = ON | `is_cc_required` | renderiza a seção **Cartão (CC)** |
| **Require Bank Info Before Signing** = ON | `is_ach_required` | renderiza a seção **Banco (ACH)** |

> Live (stg 2026-06-28, merchant TireAgent OW90218-0001): com **só "Require Credit Card" ON** (lead 7218254)
> → página **CC-only** (`hasBankFields: false`). Após ligar **"Require Bank Info Before Signing"** (lead 7218255,
> doc `e2hPInDA`) → a MESMA página `/complete` passou a exibir **CC + ACH juntos** (12 inputs). Os flags são
> **aditivos**: cada um adiciona sua seção; ambos ON = ambas as seções na mesma página, com um único submit.

## Formulário CC (live — seletores reais)

| Campo | Seletor | Placeholder |
|---|---|---|
| Cardholder's First Name | `#ccFirstName` | "Cardholder's First Name" |
| Cardholder's Last Name | `#ccLastName` | "Cardholder's Last Name" |
| Card Number | `#ccValue` | "Card Number" |
| CVC | `#cvc` | "CVC" |
| Expiration Date | `#ccExpDate` | "MM/YYYY" |
| Submit | `button#completeApplication-submit` | "Submit" |

- **Preautorização de $49.00:** texto explícito — "you agree to a preauthorization of $49.00, the amount
  equal to your processing fee/deposit ... until the lease is signed, or the preauthorization is released
  by your bank." O cartão informado também processa o 1º pagamento e é usado para Auto Pay.
- **Kaptcha:** há um `iframe#ibody` de `tst.kaptcha.com` (proteção bot/fraude — análogo a Kasada). Não é
  iframe de pagamento.
- **Mobile (375×667):** todos os campos visíveis, empilhados, **sem overflow horizontal**
  (`scrollWidth == 375`). Sem bug mobile. Também renderiza em 1440×900.

## Formulário ACH (live — quando "Require Bank Info Before Signing" ON)

Com o flag ligado, a MESMA página `/complete` adiciona a seção bancária (lead 7218255, doc `e2hPInDA`):

| Campo | Seletor | Placeholder |
|---|---|---|
| Account holder First Name | `#bankAccountCustomerFirstName` | "First Name" |
| Account holder Last Name | `#bankAccountCustomerLastName` | "Last Name" |
| Account Type | `#react-select-2-input` (react-select) | Checking / Savings |
| Routing Number | `#bankRoutingNumber` | "Routing Number" |
| Account Number | `#bankAccountNumber` | "Account Number" |
| Re-enter Account Number | `#achReEnterAccountNumber` | "Re-enter Account Number" |

- Com **ambos os flags ON**, CC + ACH coexistem na mesma página (12 inputs), submit único `#completeApplication-submit`.
- `#achReEnterAccountNumber` é uma confirmação **UI-only** (não existe no `submitApplication` body).
- Screenshot: `cc-ach-complete-with-ach-1440.png`.

## Equivalente via API

`submitApplication` (`POST /uown/api/submitApplication`) — preenche os mesmos campos programaticamente,
bulando o form do consumidor. Body (`SubmitApplicationBody` / `SubmitApplicationCcInfo`):
- **CC:** `ccNumber`, `cvc`, `ccType`, `ccExp`, `autoPay`, `preAuthStatus`
- **ACH:** `bankAccountNumber`, `bankRoutingNumber`, `bankAccountType`, `bankAccountCustomerFirstName/LastName`, `achAutoPay`
- `desiredPaymentFrequency`, `planId`

Após submit, o backend roteia para assinatura (`esignClient` ∈ {GOWSIGN, SIGNWELL}, `embeddedSigningUrl`).
`getMissingFields(shortCode, {planId})` (`GET /uown/los/missing-fields/{shortCode}`) lista os campos
obrigatórios pendentes.

## Submit do pagamento — fluxo + logs gerados (live stg 2026-06-28, lead 7218256)

Preenchendo CC + ACH e clicando `#completeApplication-submit` (cartão `5146315000000055`, ACH routing
`123456780` / account `160781900000` / CHECKING):

1. O form some e a página avança para **"Terms of Agreement"** (First Payment $111.86 due 07/05/2026,
   EPO 90 dias, frequência Weekly, 56 pagamentos) — etapa pré-assinatura.
2. `uown_los_lead.lead_status`: `UW_APPROVED` (internal `INVOICE_CREATED`) → **`CONTRACT_CREATED`**.
3. **10 novas entradas** em `uown_los_activity_log` (antes 13 → depois 23):

| Type | Notes (assinatura) |
|---|---|
| INTERNAL | `[Signing Flow] Started. Lead status UW_APPROVED` |
| INTERNAL | `Kount run. Pre-Authorization status: SUCCESS` (fraud) |
| DATA_CHANGE | `ADDED : CreditCard[ccNumber=0055, ccExp=12/2028, autoPay=true, isValidCard=true]` |
| CREDIT_CARD | `Credit Card Transaction Type : AUTHENTICATION, Amount : $49.00, Status : APPROVED` (preauth) |
| INTERNAL | `CC Auth Passed` |
| DATA_CHANGE | `ADDED : BankAccount[accountNumber=0000, routingNumber=123456780, autoPay=true]` |
| DATA_CHANGE | `ADDED : Contract[contractNumber=UOWN_23474_7218256, contractType=LEASE, contractStatus=NEW, esignMode=EMBEDDED]` |
| INTERNAL | `[Signing Flow] Contract created. Lead status CONTRACT_CREATED` (×2) |
| INTERNAL | `Protection plan not offered in state CA` (varia por estado) |

- O **preauth de $49.00** anunciado na página é confirmado pelo log `CREDIT_CARD` (Status APPROVED) — novo `log_type`.
- CC e ACH gravados com **últimos 4 dígitos** apenas (`ccNumber=0055`, `accountNumber=0000`) — PCI.
- Probe da query de log: `src/scripts/_probe_lead_log.ts <env> <leadPk>`.
- Screenshots: `cc-ach-filled-before-submit.png`, `cc-ach-after-submit-terms.png`.

## Caminhos negativos + estado da URL (live stg 2026-06-28)

- **A URL é stateful, não "single-use" simples.** Após um submit BEM-SUCEDIDO, revisitar a contract URL NÃO
  dá erro — avança para o passo **"SIGN CONTRACT"** (lead 7218256). A URL reflete o estado atual do lead.
- **Invalidação real** ("Invalid link. Please contact merchant", sem form) ocorre quando um **2º sendInvoice**
  gera novo shortCode (live: `ux3HPR7d` → `Uv3W8wf0`, lead 7218258) ou `authorizeCreditCard` é chamado via API.
- **CC recusado** (cartão `4000000000000002`): o submit exibe **"Credit Card is invalid."** inline e o form
  permanece (não avança), lead 7218257.
- **CC recusado por lastName mismatch** (`preAuthStatus: "NOT_RUN"`, erro "Credit Card is invalid."): o backend
  valida `ccLastName` (`#ccLastName`) contra `uown_los_customer.last_name` **antes** de chamar Kount. Se não
  bater, `declineCreditCard()` é chamado imediatamente (Kount não é executado). Log: `[UownClient][checkCCLastNameMatch] Invalid CC info(no matched the two lastnames)`. Inicialmente confundível com Kount-IP-indisponível (também retorna `NOT_RUN`). Fix: usar `buildTestData({ realistic: false })` (lastName determinístico `"TestLNufl"`) ou capturar `applicant.lastName` do `sendApplication` e reusar no body CC. Veja pitfall #145 do [[application-lifecycle]].
- **getMissingFields** (antes de preencher): `missingFields = ["bankAccountInfo", "ccInfo"]`, `feeToBeCharged: 49`,
  `firstPaymentDate`, `merchantRefCode` — lead 7218257.
- Screenshots: `cc-ach-decline-error.png`, `cc-ach-invalid-link.png`.

## Pendências

_Nenhuma_ — todos os itens fechados:

- ~~Nome interno dos dois flags de merchant~~ → **Resolvido:** `is_cc_required` (CC) e `is_ach_required` (ACH) — colunas em `uown_merchant`, confirmadas via `docs/taskTestingUown/database-schema.md` e live stg 2026-06-28.
- ~~Page object da página `/complete`~~ → **Resolvido:** `ContractCompletePage` em `src/pages/origination/contract-complete.page.ts`, exportado via `src/pages/origination/index.ts`. Seletores CC + ACH + submit + erro inline mapeados; após submit bem-sucedido avança para `TermsOfAgreementPage` (ver `terms-of-agreement-page.md`).

## Oráculo relacionado

[`.claude/oracles/cc-ach.md`](../../.claude/oracles/cc-ach.md) — CT-01/CT-03/CT-07 promovidos a
`[CONFIRMADO]` por esta discovery; variante ACH e UI de erro seguem `[HIPÓTESE]`.

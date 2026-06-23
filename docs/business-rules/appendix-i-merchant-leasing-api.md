---
title: "Apendice I: API de Integracao do Merchant (UOWN Leasing Full API)"
domain: business-rules
status: stable
volatility: volatile
last_verified: 2026-06-23
sources:
  - external-doc: https://documenter.getpostman.com/view/13272666/2sAYX9o1C6
  - code: src/api/clients
covers: [integration-api, settlement, additional-lease, fraud-vendors, enums, webhooks]
---

# Apendice I: API de Integracao do Merchant (UOWN Leasing Full API)
## UOwn Leasing - SVC Platform

Referencia canonica do **contrato de campos/enums** da Full Integration API que o merchant usa para automatizar aplicacoes, invoices, contratos e funding sem o Merchant Portal. E o contrato por tras dos paths ja listados em [`appendix-b-endpoints.md`](appendix-b-endpoints.md) (que NAO se movem para ca) e usa os enums de [`appendix-d-constantes-enums.md`](appendix-d-constantes-enums.md).

> **Fonte primaria (autoritativa):** Postman published doc `UOWN LEASING API DOCUMENTATION (FULL API)` — `https://documenter.getpostman.com/view/13272666/2sAYX9o1C6` (capturado 2026-06-23). `[external-doc:postman/uown-fullapi,2026-06-23]`. Por ser spec oficial do produto, os campos/enums sao `[CONFIRMADO]` conforme o doc os declara. O framework de teste dirige esses endpoints via `src/api/clients`. `[doc:src/api/clients]`
>
> **Por que `volatility: volatile`:** as regras de sandbox (SSN-9 gate, min lease) e merchant config sao categorias drift-prone (cat. #1/#6 de [[volatile-knowledge-registry]]) — ver o ⚠ caveat em I.7.

---

## I.1 Os dois fluxos de aplicacao

| Fluxo | Quando usar | Como |
|-------|-------------|------|
| **Complete (with cart)** | Cliente ja escolheu os itens | `sendApplication` ja inclui `lineItem` → retorna link de finalizacao do lease |
| **Pre-Approval (without cart)** | Dar limite de credito antes da compra | `sendApplication` sem invoice → retorna pre-approved amount; depois `sendInvoice` separado |

Apos aprovacao: cliente entra dados de pagamento → revisa termos → decide protection plan → assina contrato → lease finalizado. Finalizacao via **UOWN Portal** (link hospedado) ou **embedded pages** (iframe no site do merchant).

---

## I.2 Autenticacao

Cada request inclui no corpo (ou headers):

| Campo | Descricao |
|-------|-----------|
| `userName` | Username atribuido ao merchant |
| `setupPassword` | Senha de autenticacao |
| `merchantNumber` | Identificador unico do merchant (ex.: `OL90202-0001`) |

**Egress IP allowlist obrigatorio:** para acessar Sandbox/Production os IPs de egresso do merchant devem ser whitelisted (contatar UOWN Support com Merchant Name, Environment, Access Type, IPs estaticos). Cloud: rotear via NAT Gateway para IPs consistentes. Credenciais sao merchant-specific. `[external-doc:postman/uown-fullapi,2026-06-23]`

---

## I.3 `sendApplication` — campos

Submete a aplicacao do cliente para avaliacao de credito. Com `lineItem` → retorna link de finalizacao; sem → retorna pre-approved amount.

### Campos requeridos (selecao chave — formatos)

| JSON Tag | Formato / Notas |
|----------|-----------------|
| `userName`, `setupPassword`, `merchantNumber` | Credenciais (I.2) |
| `mainFirstName`, `mainLastName` | Nome do aplicante |
| `mainDOB` | **MMDDYYYY** |
| `mainSSN` | **Digits only, sem hifens** |
| `mainAddress1`, `mainCity`, `mainPostalCode` | `mainPostalCode` digits only |
| `mainCellPhone` | Digits only |
| `mainEmployerName` | Obrigatorio |
| `mainMonthlyIncome` **ou** `mainAnnualIncome` | Integer — **um dos dois e obrigatorio** |
| `emailAddress` | Email do aplicante |
| `ipAddress` | **Requerido** |
| `seonFingerprintText` | **Requerido** — fingerprint SEON (fraude, I.8) |

### Campos opcionais relevantes (formatos)

| JSON Tag | Formato / Notas |
|----------|-----------------|
| `localeString` | Default `en_US` |
| `returnUrl` | Redirect pos-assinatura (I.6) |
| `uuid` / `externalReferenceId` / `customerCode` | Identificadores do merchant |
| `individualJointIndicator` | `I` = Individual, `J` = Joint |
| `mainAtAddressFrom`, `mainAtPrevAddressFrom`, `mainAtEmployerFrom` | **MMYY** |
| `mainHousingStatus` | `O`=Own, `R`=Rent, `PR`=Parents/Relative, `OT`=Other |
| `mainCheckingAccount` / `mainSavingsAccount` | `Y` / `N` |
| `mainBankAccountType` | `CHECKING` / `SAVINGS` |
| `mainBankAccountOpenedDate`, `mainLastPayDate`, `mainNextPayDate` | **MMDDYYYY** |
| `mainPayFrequency` | `WEEKLY` / `BI_WEEKLY` / `SEMI_MONTHLY` / `MONTHLY` |
| `languagePreference` | `E` = English, `S` = Spanish |
| `mainMaritalStatus` | `M` = Married, `U` = Unmarried |
| `depositAmount`, `orderTotal`, `merchandiseSubtotal`, `salesTax`, `deliveryCharge`, `installationCharge`, `miscellaneousFees` | Decimais (ate 10 digitos, 2 casas) |
| `invoiceNumber`, `discountAmount`, `salesPerson` | Dados de invoice |

### Estrutura `lineItem` (cart embutido)

Array; cada objeto e um produto. Requeridos: `lineItemLineNumber`, `lineItemProductNumber`, `lineItemProductDescription`, `lineItemProductCategory`, `lineItemType`, `lineItemQuantityOrdered`, `lineItemUnitPrice`, `lineItemExtendedPrice` (= unit × qty; ate 10 digitos, 2 casas).

- **`lineItemType`**: `D` = debit/sale · `C` = credit/return.

---

## I.4 `sendInvoice` — operacoes via `orderType`

Submete invoice OU opera sobre aplicacao existente. Requer `accountNumber` (retornado pelo `sendApplication`). `lineItem` requerido para sales.

| `orderType` | Operacao |
|-------------|----------|
| `1` | Sale / Submit / Modify invoice |
| `5` | Cancel application (mantem a aprovacao) |

Semantica de retorno:
- **Submit (1):** line items com `lineItemType=D`; `orderTotal` = total.
- **Cancel (5):** `orderTotal = "0.00"`, sem items; lease aprovado permanece.
- **Full return:** item list vazia + `orderTotal 0.00`.
- **Partial return:** por item retornado, `lineItemType = C`.
- **Modify (1):** atualizar `lineItem` + `orderTotal`; nao incluir items cancelados/retornados; valores calculados (`orderTotal`, `merchandiseSubtotal`) devem bater.

Line item opcionais extra: `lineItemSerialNumber`, `lineItemBasePrice`, `lineItemTaxAmount`.

---

## I.5 `getApplicationStatus` — response + enums

Requer `accountNumber`. Retorna status, decisao, funding.

| Campo | Valores |
|-------|---------|
| `transactionStatus` | **`E0`** = not approved · **`E1`** = approved |
| `currentStatus` | `UW_APPROVED`, `UW_DENIED`, `DENIED`, `CANCELLED_DUP_SSN`, `CONTRACT_CREATED` |
| `statusDescription` | `SIGNED`, `FUNDING`, `FUNDED` |
| `hasSignedLease` | boolean — lease assinado |
| `canContinue` | boolean — pode prosseguir |
| `openToBuy` | boolean |
| `applicationFound` | boolean — aplicacao existe |
| `applicationSubmitted` | boolean — submetida com sucesso |
| `approvedAmount` / `accountBalance` / `amountToBeFunded` | Valores |
| `authorizationNumber` | Se `E1`, numero de autorizacao do provider |
| `applicationCreatedTimestamp` / `fundRequestDateTime` / `fundedDateTime` | Timestamps |
| `lastPayment` / `lastPaymentDate` / `paymentDueDate` | Pagamentos |
| `faults` / `fieldInError1..5` / `sorErrorDescription` | Fault detail (so se ocorreu erro) |

---

## I.6 `settleApplication` — funding

Finaliza o lease apos assinatura + entrega → dispara funding.

**Pre-condicoes (ambas):** (a) cliente assinou o contrato digitalmente; (b) merchant entregou a mercadoria.

Request: `userName`, `setupPassword`, `merchantNumber`, `accountNumber` (+ `localeString` opcional).

Response chave: **`transactionStatus`** `A0` = not settled · `A1` = settled; `amount`; `paymentDetailsList`; `authorizationNumber` (se A1); `faults`/`fieldInError*`/`sorErrorDescription`.

---

## I.7 `addLease` — lease adicional

Cria lease adicional usando o approval remanescente de um lease ja funded. Mesma estrutura do `sendInvoice`, endpoint diferente.

**Pre-condicoes:** (a) lease original funded; (b) primeira parcela paga **on-time**; (c) approval remanescente disponivel.

Campos: credenciais + `customerCode` (requerido), `accountNumber` (lease funded existente), **`orderType` sempre `"1"`**, `invoiceNumber` (novo), `orderTotal`, `lineItem` (requerido), `selectedPaymentFrequency` (opcional). Cria nova invoice sob a mesma conta do cliente; segue as mesmas validacoes de estrutura/totais do `sendInvoice`.

---

## I.7.1 ⚠ Regras de sandbox — CAVEAT VOLATILE

O doc declara duas regras de sandbox:
- **SSN ending in 9 → DENIED; 0–8 → APPROVED** (so simula; nao reflete decisao de credito real).
- **Min lease amount = $250** (abaixo disso nao aprova).

> ⚠ **NAO assuma a regra SSN-9 como vigente sem reconfirmar.** O **gate de denial SSN-ending-9 foi observado OFF em sandbox/qa1** (live-proven 2026-06-17) — SSN terminando em 9 **NAO mais nega**. Denial deterministico agora exige **`uown_merchant.auto_deny_application=TRUE`** (denial PRE-UW, `MERCHANT_AUTO_DENIED` ≠ `UW_DENIED`, qa2-proven). `[memory:ssn9-denial-gate-off-sandbox-qa1]` `[db-observation:uown_los_lead_notes/uown_los_outbound_api_log]` — fato drift-prone (cat. #6 [[volatile-knowledge-registry]]). Reconfirmar via `uown_los_lead_notes`/`uown_los_outbound_api_log` antes de afirmar denial em **qualquer** env. Cross-link [[ssn-test-modalities]] §6, [[application-lifecycle]] #109/#112.

A regra de min lease ($250) e do doc; tratar como `[external-doc]` e reverificar contra o env alvo.

---

## I.8 Notificacoes de finalizacao + SEON

**Lease finalization notifications** (3 vias):
1. **URL Redirect:** `{returnUrl}?event=completed&ata={uuid}` (assinou) ou `event=cancelled` (recusou); `ata` = application UUID.
2. **Iframe postMessage:** quando o signing e embedded, UOWN envia `postMessage` ao completar.
3. **Webhook:** UOWN faz `POST` para a URL configurada do partner ao assinar (URL + mensagem configuraveis por merchant).

**SEON fingerprint:** `seonFingerprintText` e **requerido** no `sendApplication` (fraude). Merchant integra o SEON JS Agent (web) / SDK (iOS/Android) → `seon.config()` + `seon.getBase64Session()` produz o fingerprint encriptado. Habilita deteccao de fraude por sinais de browser/device/comportamento no underwriting.

---

## Cross-links

- Paths dos endpoints → [`appendix-b-endpoints.md`](appendix-b-endpoints.md)
- Enums (LeadStatus, FundingQueueStatus) → [`appendix-d-constantes-enums.md`](appendix-d-constantes-enums.md)
- Vendors externos (SEON, SignWell) → [`appendix-a-integracoes.md`](appendix-a-integracoes.md)
- Categorias volatile (sandbox SSN, merchant config) → [[volatile-knowledge-registry]] #1/#6
- SSN modalities → [[ssn-test-modalities]]

---

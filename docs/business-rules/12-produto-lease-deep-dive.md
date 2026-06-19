---
title: Produto Lease — Deep Dive Tecnico
domain: business-rules
status: stable
volatility: stable
last_verified: 2026-03-20
sources:
  - gitlab: CalculatorService.java
  - env: qa2
covers: [formulas-financeiras, calculator, contrato, parcelas, money-factor, tax, epo]
---

# Produto Lease — Deep Dive Tecnico
## UOwn Leasing - Regras Extraidas do Codigo-Fonte

Complementa os documentos existentes (01-11) com regras de negocio extraidas diretamente dos repositorios `svc`, `origination`, `servicing`, `common`, `uwengine`.

**Ultima atualizacao:** 2026-03-20

---

## 1. Formulas Financeiras com Precisao Decimal

### 1.1 Contrato — Calculo Completo

Fonte: `CalculatorService.java` linhas 192-207

```
baseCost                  = totalInvoiceAmount - taxAmount - depositAmount
contractAmountBeforeTax   = baseCost * moneyFactor * termMonths               [scale 4, HALF_EVEN]
contractTax               = contractAmountBeforeTax * taxRate                  [scale 6, HALF_EVEN]
contractAmountAfterTax    = contractAmountBeforeTax + contractTax
                          + processingFee - companyDiscount                    [scale 2, HALF_EVEN]
```

O `moneyFactor` armazenado em `sched_summary` e o fator **acumulado**: `programMoneyFactor * termMonths` (scale 4, HALF_EVEN).

### 1.2 Parcela Regular.

Fonte: `CalculatorService.java` linhas 416-451

**Padrao (todos estados exceto NC):**
```
regularPaymentNoTax       = contractAmountBeforeTax / numberOfPayments        [scale 2, HALF_EVEN]
firstPaymentNoTaxWithFees = regularPaymentNoTax + processingFee - companyDiscount
nextPaymentWithTax        = regularPaymentNoTax * (1 + taxRate)               [scale 2, HALF_EVEN]
```

**NC — regra do ultimo pagamento minimo:**
Taxa padrao: `0.11` (config: `last.payment.percent.rate.for.state.NC`)
```
minLastPaymentAmount      = baseCost * 0.11                                    [scale 2, HALF_EVEN]
regularPaymentNoTax       = (contractAmountBeforeTax - minLastPaymentAmount) / (numPayments - 1)
lastPaymentNoTaxNoFees    = minLastPaymentAmount
```

**Imposto por parcela:**
```
firstPaymentTax    = max(regularPaymentNoTax - companyDiscount, 0) * taxRate   [scale 4]
regularPaymentTax  = regularPaymentNoTax * taxRate                             [scale 4]
lastPaymentTax     = lastPaymentNoTaxWithFees * taxRate                        [scale 4]
totalTaxAmount     = firstPaymentTax + lastPaymentTax
                   + regularPaymentTax * (numPayments - 2)                     [scale 2]
```

**Ultimo pagamento:**
```
lastPaymentNoTaxWithFees = lastPaymentNoTaxNoFees - securityDeposit
lastPaymentWithTax       = lastPaymentNoTaxWithFees + lastPaymentTax           [scale 2]
```

### 1.3 Numero de Parcelas

Resolucao (em ordem): `CalculatorService.java` linhas 406-412, 904-913

1. Config `numOfPayments.{termMonths}.{frequency}`
2. Config `number.of.payments.{termMonths}.{frequency}`
3. Se MONTHLY: `numberOfPayments = termMonths`
4. Senao: `SvcException`

**Dias do lease por frequencia:**
| Frequencia | Formula |
|------------|---------|
| WEEKLY | `numPayments * 7` |
| BI_WEEKLY | `numPayments * 14` |
| SEMI_MONTHLY | `numPayments * 15` |
| MONTHLY | `ChronoUnit.DAYS.between(activationDate, activationDate.plusMonths(numPayments))` |

### 1.4 Prorate Amount (Valor Proporcional)

Fonte: `getProrateAmount.sql`

Calcula valor proporcional quando pagamento ocorre no meio do periodo:
```
periodDays = WEEKLY:7 | BI_WEEKLY:14 | SEMI_MONTHLY:15 | MONTHLY:30
prorateAmount = greatest(
    (regularPayment + processingFee)
    - (regularPayment + processingFee) / periodDays * (dueDate - today)
    - partialAlreadyPaid + processingFeePartialPaid,
    0
) + overdueAmount
```

Se conta nao ACTIVE: retorna `0`. Se nao ha proximo recebivel: retorna apenas overdueAmount.

---

## 2. EPO — Cascata Completa de Calculo por Estado

### 2.1 Dispatch (PayOffAmountService.getPayOffAmount)

| Condicao | Caminho |
|----------|---------|
| `termMonths == 16` | Anytime Buyout (formula diaria) |
| Company=KORNERSTONE e programa in (Kleverwise, Prime10, KWChoice) | Formula Kornerstone |
| Todos os outros | SQL `getEpoBalance.sql` |

Apos calculo: se `EPO > contractBalance`, usa `contractBalance` (config: `check.contract.balance.for.epo`, default `true`).

### 2.2 EPO Padrao — Prioridades no SQL

**Prioridade 1 — Conta elegivel 90 dias (janela ativa):**
```
EPO = epoReceivable.total - totalPaid + totalFees + overdueAmount
```
Onde: `totalPaid` = SUM(PAID) - `remainingPaymentAmount`; `totalFees` = recebiveis ativos excluindo REGULAR, PROCESSING_FEE, EPO.
Especial MI: `overdueAmount = pastDue * 0.55` (outros estados: `pastDue`).

**Prioridade 2 — Estado tem `discount_on_paid`:**
```
EPO = epoReceivable.total - ((totalPaid - totalFees) * discountOnPaid) + overdueAmount
```

**Prioridade 3 — Estados CA, HI, NY, WV:**
```
EPO = (epoReceivable.total * (totalScheduledPayments - pastOrPaidPayments) / totalScheduledPayments)
    - epoReceivable.partialPaymentAmount + overdueAmount
```
`pastOrPaidPayments` = count de REGULAR_PAYMENT com `due_date <= today` OU `allocation_status = PAID_IN_FULL`.

**Prioridade 4 — NC e EPO calculado < ultimo pagamento:**
```
EPO = lastPayment(no_tax_with_fees + tax) + overdueAmount
```

**Default — todos outros estados:**
```
EPO = (totalContractAmount - (totalPaid - totalFees)) * (1 - COALESCE(sc.epo_discount, mp.payoff_discount))
    + overdueAmount
```

### 2.3 EPO Kornerstone (PayOffAmountService linhas 105-143)
```
paidTowardsEpo = totalPayments - leftOverPayment - ppFeesToDate - allOtherFees
paidTowardsEpo = (paidTowardsEpo > 0 && moneyFactor > 0) ? paidTowardsEpo / moneyFactor : 0

kwBuyoutAmount = epoAmountWithTax - paidTowardsEpo + regularPastDue           [CEILING]
```

### 2.4 Anytime Buyout 16 Meses (AnytimeBuyOutService linhas 41-58)
```
leaseAmount      = (baseCost * moneyFactor) - baseCost                         [scale 4, HALF_EVEN]
leaseDays        = config("totalLeaseDaysForTerm{term}") OU term * 30
dailyLeaseAmount = leaseAmount / leaseDays                                     [scale 2, HALF_EVEN]

buyoutAmount     = baseCost + (dailyLeaseAmount * daysUsed)
buyoutNoTax      = buyoutAmount + totalFees(processingFee + buyoutFee + ppFees + otherFees)
costTax          = buyoutAmount * taxRate                                       [scale 4, HALF_EVEN]
buyoutWithTax    = buyoutNoTax + costTax                                        [scale 2, HALF_EVEN]

finalBalance     = buyoutWithTax - actualPaymentsMade
```
`daysUsed = ChronoUnit.DAYS.between(activationDate, today)`.
Se `finalBalance <= 0` ou `daysUsed <= 0`: fallback para `contractBalance`.

### 2.5 Data de Expiracao do EPO
```
epoStartDate = config("getEpoDateFromFpd") ? firstPaymentDate : today
epoExpiry    = epoStartDate + config("epo.months.for.state.{state}") meses
             OU epoStartDate + program.epoDays
```
Contas 16 meses: `earlyPayoffDateExpiry = LocalDate.now()` (desabilita janela 90 dias).

---

## 3. Hierarquia de Taxas Pre-Assinatura

### 3.1 Processing Fee (CalculatorService linhas 932-960)

Resolucao em ordem:
1. `merchant.chargeProcessingFee == false` → `$0`
2. `program.amountChargedAtSigning > 0` → `$0` (signing amount substitui)
3. `program.processingFeeOverride > 0` → usa override
4. `stateConfigurations.processingFee` → taxa por estado
5. Fallback → `$0`

### 3.2 Signing Fee (CalculatorService linhas 1008-1037)

Resolucao em ordem:
1. `program.amountChargedAtSigning > 0` → usa esse valor
2. `(merchant.chargeProcessingFee AND chargeProcessingFeeBeforeEsign) OR (checkUwForVerification AND uwData.chargeProcessingFee)` → usa processing fee
3. Senao → usa security deposit
4. Sempre `>= 0`

`SigningFeeService.getSigningFeeAmount()`: `MAX(amountChargedAtSigning, processingFee, securityDeposit, protectionPlanFee, 0)`.

### 3.3 Security Deposit (CalculatorService linhas 966-1001)

Cobrado quando:
- `merchant.holdDeposit == true` AND `stateConfigs.securityDeposit != null`
- OU `merchant.checkUwForVerification AND uwData.chargeProcessingFee` AND `stateConfigs.securityDeposit != null`

NAO cobrado se `processingFeeOverride > 0` OU `amountChargedAtSigning > 0`.

### 3.4 NSF Fee (AccountFeeService linhas 27-37)
- Default: `$15.00` (config: `AccountFeeService.nsfFee`)
- Override por estado: `stateConfigurations.nsf` (se `> 0`)
- Estado: INSTORE usa estado do merchant; outros usa estado do cliente

### 3.5 Buyout Fee
Por merchant: `uown_merchant.buyout_fee`. Adicionado ao EPO na originacao.

### 3.6 EPO Fee (percentual)
`program.epoFeePercent`: `epoFeeAmount = baseCost * epoFeeRate` (se rate > 0).

---

## 4. Importacao LOS para SVC — 16 Entidades

Fonte: `LosToSvcImportService.java`

Quando um lead e importado, as seguintes entidades sao criadas **em ordem**:

| # | Entidade | Origem |
|---|----------|--------|
| 1 | `SvAccount` | `lead.getLeadInfo()` (dados da conta: merchant, valores, status) |
| 2 | `SvCustomer` | Um por `LosCustomer` (titular + co-signatarios) |
| 3 | `SvAddress` | Por customer |
| 4 | `SvEmail` | Por customer |
| 5 | `SvPhone` | Por customer |
| 6 | `SvEmployment` | Por customer |
| 7 | `SvBankAccount` | Por customer (dedup por routing+account) |
| 8 | `UWData` | Dados de underwriting da conta |
| 9 | `SvInvoice` | Invoice do lead (`LosInvoice`) |
| 10 | `SvItem` | Itens da invoice |
| 11 | `SvSchedSummary` | Cronograma (FPD, frequencia, termo, data EPO) |
| 12 | `SvReceivable` | Gerados do cronograma (REGULAR, PROCESSING_FEE, EPO) |
| 13 | `SvCreditCard` | Copiados do LOS |
| 14 | `SvCreditCardTransaction` | Transacoes APPROVED SALE/CAPTURE (nao PURCHASE) |
| 15 | `SvProtectionPlan` | Se plano de protecao existe no lead |
| 16 | Welcome email | Enviado ao customer (async ou sync por config) |

**Re-importacao:** Se conta ja existe, `updateAccountFromLead` regenera itens, invoice, cronograma e recebiveis. Se conta CANCELLED, cancelamento e re-aplicado.

**ImportLog:** Registro criado antes e depois da importacao.

**Regra 16 meses:** Se `termMonths` esta em `noEpoForTermMonths` (default: `"16"`): `earlyPayoffDateExpiry = LocalDate.now()`.

---

## 5. Estrategias de Alocacao de Pagamento

Fonte: `UownAllocationService.java`

### 5.1 AllocationStrategy enum
| Estrategia | Descricao |
|------------|-----------|
| `DEFAULT` | Seleciona proximo recebivel nao pago por due date. Se REGULAR_PAYMENT, coleta todos com mesma data ou anteriores |
| `EPO_ONLY` | Aloca apenas ao recebivel EPO ativo |
| `REGULAR_RECEIVABLES` | Aloca a todos recebiveis nao pagos |

### 5.2 Ordem de Alocacao Dentro de um Pagamento

1. Recebiveis **nao-EPO** primeiro (ordenados por due date ASC)
2. Recebivel **EPO** por ultimo (com valor restante do pagamento)
3. Se valor restante apos todos recebiveis >= payoff amount → conta `PAID_OUT_EARLY`, ultimo recebivel recebe `PAID_OFF_BALANCE`
4. Qualquer valor nao alocado → `account.overPaymentAmount`

### 5.3 ReceivableAllocationStatus
| Status | Significado |
|--------|------------|
| `UNPAID` | Nenhum pagamento aplicado |
| `PARTIALLY_PAID` | Pagamento parcial aplicado |
| `PAID_IN_FULL` | Valor total pago |
| `PAID_OFF_BALANCE` | Saldo quitado (payoff) |
| `NOT_APPLICABLE` | Nao aplicavel |

### 5.4 Realocacao
`reallocateFromReceivable`: move alocacoes entre recebiveis.
Bloqueada se conta em: `PAID_OUT, PAID_OUT_EARLY, PAID_OUT_EARLY_EPO, CANCELLED`.
Bloqueada se recebivel destino em: `PAID_IN_FULL, PAID_OFF_BALANCE`.

### 5.5 Auto PAID_OUT
Apos CADA alocacao: `AutoPaidOutEligibilityService.isAccountEligibleForAutoPaidOut()` e verificado. Se elegivel → status `PAID_OUT` imediatamente.

### 5.6 Tipo DEPOSIT
`PaymentType.DEPOSIT` sempre usa estrategia `EPO_ONLY` — bypassa selecao normal de recebiveis.

---

## 6. Rewind/Replay — Mecanica Detalhada

Fonte: `RewindReplayService.java`, `RewindPaymentsService.java`, `ReplayPaymentsService.java`

### 6.1 Tres Pontos de Entrada

**A. `rewindReplayForReversePayment(svPayment)`** (reversao de pagamento):
1. Coleta todos pagamentos PAID apos o pagamento revertido (por `rowCreatedTimestamp`)
2. Se conta em status terminal (PAID_OUT, PAID_OUT_EARLY, PAID_OUT_EARLY_EPO, SETTLED_IN_FULL): reseta para ACTIVE
3. Reverte alocacoes do pagamento revertido
4. Se nao ha pagamentos nao-alocados: faz replay dos subsequentes
5. Se ha pagamentos nao-alocados: faz `rewindAndReplayAccount` completo

**B. `rewindAndReplayAccount(accountPk)`** (rebuild completo):
1. Busca TODOS pagamentos PAID em ordem de data ASC
2. Zera `overPaymentAmount`
3. Reverte TODAS alocacoes (`TransactionType.REWIND_PAYMENT`)
4. Re-aplica todos pagamentos via `postPaymentService.postPaymentToAccount()`

**C. `rewindAndReplayPayment(paymentPk)`** (parcial):
1. Reverte apenas o pagamento especificado e todos subsequentes
2. Re-aplica em ordem cronologica

### 6.2 Rewind
- Para cada pagamento: reverte todas alocacoes (marca recebiveis como UNPAID)
- Se conta em status terminal e pagamento tinha alocacoes: reseta conta para ACTIVE

### 6.3 Replay
- Ordena pagamentos por `paymentDate` depois `rowCreatedTimestamp`
- Para cada: `postPaymentService.postPaymentToAccount(payment, replayTransactionType)`

### 6.4 Status Revertiveis
Configuravel via `statuses.to.active.for.rewind`:
`PAID_OUT, PAID_OUT_EARLY, PAID_OUT_EARLY_EPO, SETTLED_IN_FULL` → `ACTIVE`

---

## 7. Invoice Modification (Lease Mod)

Fonte: `ModifyInvoiceService.java` linhas 62-127

### 7.1 Pre-condicoes
- Lead em status `SIGNED` ou alem (`lead.isSignedOrBeyond()`)

### 7.2 Fluxo
1. Conta e **cancelada** (pagamentos NAO reembolsados)
2. Lead status → `LEASE_MOD_REQUESTED`
3. Se lead FUNDED: `fundingStatus → REQUEST_REFUND`
4. **Novo lead** criado re-executando o application processor no request original
5. CC e bank account linkados do lead antigo ao novo
6. Merchant notificado

### 7.3 Restricoes (SendInvoiceService linhas 243-252)
- Conta deve estar em `ACTIVE` ou `CANCELLED`
- Nao pode modificar apos **80 dias** da data de ativacao (config: `num.days.past.creation.for.lease.mod`)
- Usuarios especificos podem bypass (config: `users.allowed.bypass.lease.mod.check`)
- Nao pode modificar se itens PAID existem e novo total > approval amount

---

## 8. Funding Lifecycle Completo

Fonte: `LeadFundingService.java`

### 8.1 Status
| FundingQueueStatus | LeadStatus Correspondente |
|--------------------|--------------------------|
| `FUNDING` | `FUNDING` |
| `FUNDED` | `FUNDED` |
| `REQUEST_REFUND` | — |
| `REFUNDED` | — |

### 8.2 Transicoes

**SIGNED/READY_TO_FUND → FUNDING:**
- Valida lead em: `SIGNED, READY_TO_FUND, FUNDING, FUNDED`
- Seta `fundRequestDateTime = now`, `fundingStatus = FULL_FUNDING`
- Chama `importToServicing()` (LOS → SVC import)
- Cria registro `FundingTransaction`

**FUNDING → FUNDED:**
- Seta `fundDateTime = now`, `fundingStatus = FULLY_FUNDED`
- Lead status → `FUNDED`
- Marca `FundingTransaction` antiga como `INACTIVE`, cria nova com `FULLY_FUNDED`
- Registra em `FundingModification`

**FUNDED → FUNDING (reversao):**
- Apenas se lead atualmente em `FUNDED`
- Seta `fundingStatus = FULL_FUNDING`, lead → `FUNDING`

**FUNDED → REQUEST_REFUND → REFUNDED:**
- Cria `FundingTransaction` de refund com `refundRequestDateTime`
- Na confirmacao: atualiza para `REFUNDED`

### 8.3 Calculo do Valor Fundado
```
amountToBeFunded = invoiceAmount - (invoiceAmount * merchant.ccProcessingFeePercent)
```

### 8.4 Merchant Funding Exceptions
Duas flags por merchant: `twoDayFundingException`, `fiveDayFundingException` (default: `false`).
Usadas como filtro na fila de funding.

---

## 9. Sweep Processing — Catalogo Completo

### 9.1 ACH Sweeps

| Sweep | Metodo | Descricao |
|-------|--------|-----------|
| `CreateScheduledACHPaymentsSweep` | `createScheduledACHPayments()` | Cria registros ACH para contas com vencimento hoje |
| `SendACHPaymentsSweep` | `sendACHPayments()` | Envia arquivo ACH ao Profituity. Multi-thread opcional |
| `getSendACHPaymentsStatusSweep` | `getSendACHPaymentsStatus()` | Poll Profituity ACK para pagamentos enviados |
| `getStatusDatePaymentsListSweep` | `getStatusDatePaymentsList()` | Poll resultados por date range; processa RETURNED |
| `rerunACHPaymentsSweep` | `rerunACHPayments()` | Re-executa ACH falhos: cria NSF fee + RERUN ACH |
| `reverseAchPaymentsSweep` | `reverseAchPaymentsSweep()` | Reverte ACH retornados. **Thread size = 1** |

### 9.2 CC Sweeps

| Sweep | Descricao |
|-------|-----------|
| `CreateScheduledCreditCardPaymentsSweep` | Cria transacoes CC para contas com vencimento hoje |
| `SendCreditCardPaymentsSweep` | Processa transacoes CC pendentes via gateway. Async thread pool |
| `rerunCCPaymentsSweep` | Re-executa CC DENIED/ERROR. Roda dia seguinte ou Thu/Fri/Sat. Representment 1 |
| `delinquencyRerunCCPaymentsSweep` | Rerun 100 dias. Contas com `delinquency_as_of_date < today - 100` e rating NOT IN (B,C,P,S,D,E,F,G,L,U) |
| `dailyDelinquencyRerunCCPaymentsSweep` | Rerun diario. SALE do dia + contas inadimplentes. NSF fee apenas se antes de 9h |

### 9.3 Delinquency CC Rerun — Logica de Valor
```
nextRegularAmount = proximo recebivel regular remaining amount
pastDueAmount = valor em atraso
amountCharged = min(pastDueAmount, nextRegularAmount) se pastDue > full receivable
              SENAO: remainingRegularAmount
```
Usa CC auto-pay ativo; fallback para ultimo cartao tokenizado.

### 9.4 Outros Sweeps

| Sweep | Descricao |
|-------|-----------|
| `paidOutAccountsSweep` | Marca contas elegiveis como PAID_OUT |
| `sendEmailsSweep` | Envia emails pendentes |
| `sendFirstPaymentRemindersSweep` | Lembretes de primeiro pagamento |
| `sendRecurringPaymentRemindersSweep` | Lembretes de pagamentos recorrentes |
| `delinquencyOfferEmailSweep` | Emails de oferta por faixa de inadimplencia |
| `latePaymentNoticeEmailSweep` | Aviso mensal com dias exatos em atraso |
| `settledInFullEmailSweep` | Email "Settled in Full" (Mon-Fri 02:00) |
| `checkLeadExpirationSweep` | Verifica leads expirados |
| `cancelProtectionPlanSweep` | Cancela planos de protecao |
| `createSkitDelinquentFileSweep` | Gera arquivo para Skit.AI (cobranca automatizada) |
| `removeRatingLetterSweep` | Remove ratings de contas que nao atendem mais criterios |

---

## 10. CC Transaction Lifecycle

### 10.1 CCTransactionStatus
```
PENDING, FUTURE_PENDING, APPROVED, DENIED, ERROR, REFUNDED, CANCELLED,
MANUAL_REVERSE, PICKED_TO_SEND, PARTIALLY_REFUNDED, SKIPPED, REUSED
```

### 10.2 Fluxo CC
1. **Autorizacao**: $0.01 (ou config) — `CCAction.AUTHENTICATION`
2. **Tokenizacao**: `CCAction.TOKENIZATION` — gera token no gateway
3. **Cobranca**: `CCAction.SALE` — processa pagamento
4. **Pos-processamento**: Receipt criado, pagamento alocado

### 10.3 NSF CC (CCNsfFeeService)
Deteccao: mensagem contem "Insufficient funds" OU codigo em "50051, 57852" OU ultimos 2 digitos = "51".
Fee due date: `today` (config: `setCurrentDateForNsf`, default `true`).

### 10.4 Refund CC
- Apenas se status original = `APPROVED` ou `PARTIALLY_REFUNDED`
- Valor <= `remainingRefundableAmount + chargedFeeAmount` (se refundFee=true)
- Parcial: original → `PARTIALLY_REFUNDED`
- Total: original → `REFUNDED`, `remainingRefundableAmount = 0`
- Cria transacao `CCAction.CREDIT` via gateway

---

## 11. ACH Lifecycle

### 11.1 ACHStatus (todos)
```
PENDING, SENT, ACK_ERROR, ERROR_SENDING, ERROR, CANCELLED, COMPLETED,
ACK_RECEIVED, INACTIVE, RETURNED, REVERSED, SETTLED, CORRECTION,
REJECTED, BLOCKED, REFUNDED, PENDING_TO_RERUN, MANUAL_REVERSE,
PICKED_TO_SEND, STATUS_UPDATE_PENDING, PARTIALLY_REFUNDED,
BLOCKED_ACCOUNT, SKIPPED, SETTLED_IN_RERUN, ACCOUNT_VALIDATION_ERROR
```

### 11.2 ACHProcessType
```
SCHEDULED, RERUN, RERUN_NSF, REQUEST, REFUND
```

### 11.3 Fluxo Assincrono
1. `createOrUpdateACHPayment` armazena registro
2. `SendACHPaymentsSweep` envia arquivo ao Profituity (vendor)
3. `getSendACHPaymentsStatusSweep` poll ACK
4. `getStatusDatePaymentsListSweep` poll resultados finais
5. `addPaymentAfterAch()` cria SvPayment apenas para `ACHType.ACHDebit` (nao ACHCredit)

### 11.4 NSF ACH — Condicoes para Criacao de Fee
Todas devem ser verdadeiras:
1. Config `create.nsf.fee.receivable.on.rerun == true`
2. `achProcessType == SCHEDULED`
3. `originalACHPk == null` (primeira ocorrencia)
4. `numberOfTries == 1`

### 11.5 Rerun ACH (apos NSF)
1. Cria NSF fee receivable
2. Cria novo ACH com `ACHProcessType.RERUN` e `originalACHPk` apontando para original
3. Se config `create.ach.payment.for.nsf.fee.on.rerun == true`: cria segundo ACH `RERUN_NSF` para cobrar o fee

### 11.6 R08 Stop Payment
`updateAfterAchPaymentReturnCodeR08()`: cria alerta "R08: Customer placed a stop on payment".

---

## 12. SMS — Regras de Opt-In/Opt-Out

Fonte: `SmsService.java`

### 12.1 Opt-In Automatico
Na primeira SMS enviada para lead ou account (verificado via `SmsOptInConfirmationResponse` SQL):
- Prepende mensagem de opt-in automatica (1 segundo antes)
- KORNERSTONE: "Welcome to Kornerstone. Msg&data rates may apply..."

### 12.2 Opt-Out Automatico por Erro
Se delivery retorna: `"invalid 'to' phone number"`, `"empty to number"`, `"the message from/to pair violates a blacklist rule"`, `"attempt to send to unsubscribed recipient"` → marca `doNotText = true` em todos registros de telefone com aquele numero.

### 12.3 Vendors
- **TextGrid** (default) e **Twilio** — split configuravel
- Config: `split.texts.between.twilio.and.textgrid`, `percent.texts.sent.via.textgrid`
- Numeros TextGrid: `+16465829473, +16263856892, +14695051760, +12153157135`

### 12.4 KORNERSTONE Template Routing
Se `company = KORNERSTONE`: nome do template prefixado com `KORNERSTONE_` antes do lookup.

### 12.5 Janela de SMS para Delinquencia
Configuravel, default: **12:00-19:00**. SMS de delinquencia nao sao enviados fora dessa janela.

---

## 13. Customer Portal

Fonte: `CustomerPortalController.java`

### 13.1 Capabilities
| Endpoint | Funcao |
|----------|--------|
| `POST /authenticateCustomer` | Autenticacao do cliente |
| `POST /sendVerificationCode/{phoneOrEmail}` | Envia codigo de verificacao |
| `POST /verifyCode/{phoneOrEmail}/{code}` | Verifica codigo → `CustomerLoginResult` |
| `GET /getAllCustomerPayments/{accountPk}` | Lista pagamentos da conta |
| `POST /createOrUpdateCustomerPayment` | Cria/atualiza pagamento |
| `POST /createOrUpdateCorrespondenceTracking` | Rastreia interacoes |
| `POST /submitSupportTicket` | Integra com Zendesk |
| `GET /getZendeskEmailCategories` | Categorias de suporte |

### 13.2 Rating P no Portal
Pagamentos ACH/CC via customer portal com data futura: account rating automaticamente setado para `P` (Promise-to-Pay).
Config: `ach.customer.portal.add.rating.letter` / `cc.customer.portal.add.rating.letter` (default: `true`).

---

## 14. Merchant Config — Flags Completas

Fonte: `MerchantInfo.java`

### 14.1 Flags de Verificacao
| Flag | Default | Efeito |
|------|---------|--------|
| `isIntellicheckRequired` | `false` | Exige scan de ID na assinatura |
| `isSeonIdCheckRequired` | `false` | Exige SEON ID check na assinatura |
| `checkUwForVerification` | `false` | Consulta UW response para decidir ID requirement |
| `useNeuroIdCheck` | `false` | Biometria comportamental NeuroID no sendApp + submitApp |
| `isFraudCheckRequired` | `false` | SEON email/phone/IP verification |
| `useSentilink` | `false` | Sentilink nos extra data do UW |
| `useNeustar` | `false` | Neustar nos extra data do UW |
| `useLexisNexis` | `false` | LexisNexis nos extra data do UW |

### 14.2 Flags de Pagamento
| Flag | Default | Efeito |
|------|---------|--------|
| `isCcRequired` | `true` | CC obrigatorio na assinatura |
| `isAchRequired` | `true` | Conta bancaria obrigatoria |
| `isFpdRequired` | `false` | Primeira data de pagamento explicita requerida |
| `isBankVerificationRequired` | `false` | Verificacao bancaria (Plaid-style) |
| `isPlaidVerificationRequired` | `false` | Verificacao de renda Plaid |

### 14.3 Flags de Aplicacao
| Flag | Default | Efeito |
|------|---------|--------|
| `autoDenyApplication` | `false` | Auto-nega todas aplicacoes |
| `isItemSplit` | `false` | Split carrinho CC purchase-now + lease |
| `offerInsurance` | `false` | Oferece plano de protecao |
| `acceptNewApps` | — | Para de receber novas aplicacoes |
| `verifyPhoneBeforeSigning` | `false` | OTP de telefone antes da assinatura |
| `recordSigningFlow` | `false` | Sentry session replay para assinatura |

### 14.4 Flags de E-Sign e UI
| Flag | Default | Efeito |
|------|---------|--------|
| `esignMode` | `EMBEDDED` | `EMBEDDED` (iFrame) ou `EMAIL` |
| `esignClient` | `SIGNWELL` | E-sign vendor |
| `removeParentOrTopOnIframe` | `false` | Previne iframe breakout |
| `allowCloseOnIframe` | `false` | Mostra botao fechar no SignWell embed |

### 14.5 Configuracoes Financeiras
| Campo | Default | Efeito |
|-------|---------|--------|
| `merchantType` | `ONLINE` | ONLINE usa estado do cliente; INSTORE usa estado do merchant |
| `numDaysApprovalExp` | `0` | Dias ate aprovacao expirar |
| `allowedFrequencies` | `WEEKLY, BI_WEEKLY` | Frequencias de pagamento oferecidas |
| `defaultLoanAmount` | `$1,400` | Valor enviado ao UW se nao especificado |
| `minimumLeaseAmount` | `$250` | Valor minimo do lease |
| `maxApprovalAmount` | null | Teto de aprovacao |
| `ccProcessingFeePercent` | — | Desconto no funding |

### 14.6 Program Fields (ProgramInfo)
| Campo | Default | Efeito |
|-------|---------|--------|
| `moneyFactor` | — | Multiplicador de custo |
| `termMonths` | 13 | Duracao do lease |
| `epoDays` | 90 | Janela EPO |
| `epoFeePercent` | — | Fee percentual sobre EPO |
| `dealerDiscount` / `dealerRebate` | — | Ajustes no funding |
| `processingFeeOverride` | — | Override do processing fee |
| `amountChargedAtSigning` | — | Valor cobrado na assinatura |
| `programType` | — | ex: `SAME_AS_CASH` |
| `states` | — | Estados onde programa disponivel |
| `maxCartAmount` / `minCartAmount` | — | Limites de invoice |

---

## 15. Application Pipeline — 18 Steps Detalhados

Fonte: `ApplicationProcessor.java` linha 94-95

Ordem padrao:
```
stateCheck, merchantAutoDenyCheck, sourceCheck, blacklistCheck, dataMismatchCheck,
previousLeadsCheck, previousUwDeniedCheck, futureFpdCheck, duplicateCheck,
eligibleForReapprovalCheck, neuroIdCheck, underwritingCheck, termsStep,
invoicePlaceHolderStep, calculateMaxApprovalAmount, compareCostCheck,
itemSplitCheck, calculatorCheck
```

### Steps Criticos com Regras Novas

**Step 3 — sourceCheck:** Apenas para `BUY_ON_TRUST`. Deny rates por categoria: `111706798993` = 80%, `105561120370` = 70%.

**Step 6 — previousLeadsCheck:** Cancela leads anteriores. Calcula `consumedApprovalAmount` de todos leads signed/funded anteriores.

**Step 7 — previousUwDeniedCheck:** Re-usa UW denied anterior EXCETO se `isEligibleForExtraInfo=true` E novo request tem dados bancarios → re-executa UW fresco.

**Step 8 — futureFpdCheck:** Nega se ja existe lead SIGNED com `firstPaymentDueDate > today` e sem accountPk.

**Step 9 — duplicateCheck:** Limites hard (default 3): `emailCount >= 3` → `EMAIL_COUNT_FAILED`; `phoneCount >= 3` → `PHONE_COUNT_FAILED`.

**Step 15 — calculateMaxApprovalAmount:** Fatora `approvalAmount` + open-to-buy. Se `maxApprovalAmount <= 0` → `NO_REMAINING_AMOUNT`.

**Step 16 — compareCostCheck:** Se cost > maxApproval E nao elegivel item split → retorna `DECLINED` com status `UW_APPROVED` (UW aprovado mas carrinho muito grande).

### Second Opportunity (isEligibleForExtraInfo)

NAO e um pipeline separado. UW retorna `isEligibleForExtraInfo=true` no denied. Na re-aplicacao com dados bancarios, UW e re-executado fresh com banking data nos extra fields.

### Missing Required Fields (Campos Faltantes)

Endpoint: `GET /uown/los/missing-fields/{shortCode}?planId=X`

**Critico:** `resolveAndSetMerchantProgramFromPlanId` — se `planId` fornecido e `lead.merchantProgramPk == null`, resolve o programa. **Sem isso:** "Merchant program is required to determine fee".

**Link expiry:** 36 horas (configuravel). Links mais antigos sao rejeitados.

### Add Lease

Endpoint: `POST /uown/los/addLease`

- Lead deve estar em `FUNDED` (config: `valid.statuses.for.add.lease`)
- Executa o **pipeline completo de 18 steps** como nova aplicacao
- Novo lead recebe `refLeadPk` do lead original
- Lead original recebe `addedSecondLease=true`

---

## 16. Blacklist — Detalhamento

Fonte: `BlackListService.java`

### 16.1 Campos Verificados na Blacklist
| Campo | Como verificado |
|-------|----------------|
| firstName + lastName | Match combinado |
| SSN | Match exato |
| phoneNumber | areaCode + number |
| emailAddress | Match exato |
| bankAccountNumber | Match exato |
| bankRoutingNumber | Match exato |
| streetAddress1 + zipCode | Match combinado |
| CC BIN | 6 digitos exatos |

### 16.2 O Que Dispara Blacklisting
- `LeadService.blackListLead()`: cria entradas separadas para CADA campo PII
- Lead status → `BLACKLISTED`

### 16.3 O Que a Blacklist Bloqueia
- **Pipeline step 4** (`blacklistCheck`): bloqueia nova aplicacao → `BLACKLIST_DENIED`
- **Submit application** (`SubmitApplicationService` linha 186): verifica bank account e routing antes de prosseguir → `BLACKLIST_APPROVED`

### 16.4 Export
Relatorio mensal automatico: `cron = "0 0 0 1 * ?"` — `generateExportBlacklistReport`.

---

## 17. State Configurations — Campos Financeiros

Fonte: `StateConfigurationsInfo.java`

| Campo | Funcao |
|-------|--------|
| `processingFee` | Processing fee padrao por estado |
| `nsf` | NSF fee override por estado |
| `securityDeposit` | Valor do deposito de seguranca |
| `discountOnPaid` | Desconto EPO aplicado sobre total pago (Prioridade 2 no SQL) |
| `epoDiscount` | Taxa de desconto EPO para formula default (Prioridade 4/Default no SQL) |
| `recycleFee` | Fee de reciclagem por item (atualmente `ZERO` no codigo) |
| `maxProcessingAndDeliveryFee` | Teto de processing + delivery fee |
| `maxCostPriceFactor` | Fator maximo de custo permitido |

---

## 18. Tax Calculation

Fonte: `TaxService.java` linhas 31-54

### 18.1 Fluxo
1. Normaliza campos de endereco (trim, collapse whitespace)
2. Verifica se merchant e tax-exempt para o estado (`merchant.taxExemptedStates`, lista separada por virgula). Se exempt: retorna `0`
3. Se `taxConfig.useTaxCloudApi() == true`: chama `TaxCloudService.getTaxForZip()`
4. Senao: chama `TaxJarService.getTaxForZip()`

### 18.2 Determinacao de Endereco
- INSTORE: endereco do merchant
- ONLINE: endereco do cliente

### 18.3 O Que e Taxado
- Contract amount (por parcela, por cronograma)
- EPO amount (`baseCost * taxRate` ou anytime buyout tax)
- Kornerstone EPO (`epoAmountWithTax`)

### 18.4 O Que NAO e Taxado
- Processing fee
- Signing fee
(Fee adicionada ao contract amount APOS calculo de imposto sobre o contrato base)

---

## 19. Frequencia de Pagamento — Detalhamento

### 19.1 Valores Validos
| Frequencia | Abreviacao (planId) | Backend Enum |
|------------|--------------------|-|
| Weekly | WK | `WEEKLY` |
| Bi-Weekly | BW (nao BWK) | `BI_WEEKLY` |
| Semi-Monthly | SM | `SEMI_MONTHLY` |
| Monthly | MN | `MONTHLY` |

### 19.2 Mudanca de Frequencia
- Se nova frequencia = atual: no-op
- Recalcula cronograma completo via `CalculatorService.calculateForAccount()`
- Incrementa `frequencyChanges` (inicia em 1 se null)
- Registra em `FrequencyMods` (old freq, new freq, old amount, new amount)
- Log `LogType.FREQUENCY_CHANGE`

### 19.3 Due Date Move
- **WEEKLY**: max offset **3 dias**
- **Outros**: max offset **7 dias** (BUG: `validateOffsetByFrequency` sempre usa branch WEEKLY)
- Dois tipos: `SCHEDULE_SHIFT` (todas futuras) e `NEXT_DUE_DATE` (apenas proxima)
- Incrementa `dueDateMoves`

---

## 20. Enums de Referencia Completos

### PaymentType
```
ACH, CC, PW, DEBIT, VISA, AMEX, DISCOVER, MASTERCARD, OTHER, CASH, CHECK, MONEY_ORDER, DEPOSIT
```

### PaymentStatus
```
PAID, REVERSED, CANCELLED, RETURNED, ERROR, MANUAL_REVERSE, PENDING_REFUND, REFUNDED
```

### CustomerPaymentStatus (portal)
```
PAID, REVERSED, CANCELLED, RETURNED, ERROR, DENIED, PENDING, PENDING_REFUND,
REFUNDED, SENT_TO_BANK, UNKNOWN
```

### AutoPayType
```
NONE, ACH, CC, PAY_WALLET
```

### LogType (Activity Log)
```
IMPORT, REVIEW, DATA_CHANGE, DUE_DATE_MOVES, CORRESPONDENCE, STATUS_CHANGE,
CREDIT_CARD, BANK_ACCOUNT, ACH, PAYMENT, REWIND_REPLAY, DEFAULT, UNDERWRITING,
INTERNAL, INFORMATION, MERCHANT_DATA_CHANGE, FRAUD, ERROR, PROGRAM_DATA_CHANGE,
STATE_CONFIG_CHANGE, PAYWALLET, UWENGINE, ALLOCATION, SKIT_CALL_LOG,
CUSTOMER_ASSISTANCE, ESCALATION, OUTREACH_MERCHANT, OUTREACH_PLATFORM,
OUTREACH_ISR, OTHER, PEO_SUPPORT, POP_SHIPMENT, EMAIL, INBOUND_CALL,
MERCHANT_REVIEW, SOCIAL_MEDIA, NEW_MERCHANT, FREQUENCY_CHANGE
```

### FundingQueueStatus
```
FUNDING, FUNDED, REQUEST_REFUND, REFUNDED
```

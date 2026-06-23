---
title: Cálculos e Fórmulas Financeiras
domain: business-rules
status: stable
volatility: stable
last_verified: 2026-06-23
sources:
  - code: src/helpers/svc-payoff.helpers.ts#parseEpoBreakdown
  - code: src/data/sixteenMonthEpoForCa531.testData.ts#ISSUE531_DATA
  - svc-source: pojo/rest/CalculatorResults.java
  - svc-source: service/AccountAmountsService.java
covers: [payment-calculator, epo, payoff, money-factor, payment-frequency, state-rules]
---

# Calculos e Formulas Financeiras
## UOwn Leasing - SVC Platform

Calculadora de pagamentos, EPO (Early Pay Off), calculo de payoff e regras EPO por estado.

---

## 7. Calculadora de Pagamentos

### O Que Faz

Calcula o cronograma completo de pagamentos do lease: valor de cada parcela, numero de parcelas, EPO, taxas, impostos, e URL de redirecionamento.

### Formulas Principais

```
baseCost = totalInvoiceAmount - taxAmount - depositAmount
contractAmountBeforeTax = baseCost * moneyFactor * termMonths
contractAmountAfterTax = contractAmountBeforeTax + contractTax + processingFee - companyDiscount
regularPayment = contractAmountBeforeTax / numberOfPayments
```

### Pagamento Devido Hoje e Primeira Parcela com Taxas (R1.53.0 — svc#558)

Corrigido em R1.53.0 para merchants que cobram a signing fee no e-sign (caso Good Feet), evitando duplo-faturamento da taxa/deposito na primeira parcela:

- `paymentDueToday` agora vem **direto de `SchedSummaryInfo.getSigningFee()`** (a signing fee ja resolvida), e nao mais re-derivado de flags do merchant (`chargeProcessingFeeBeforeEsign` / `holdDeposit` / UW).
- `processingFee` + `securityDeposit` so sao somados a `firstPaymentWithFeesAndTax` **quando NAO ha signing fee sendo cobrada agora** (`signingFee == null || <= 0`). Se a taxa ja foi coletada na assinatura, a primeira parcela nao a recobra.
- **Fontes:** `pojo/rest/CalculatorResults.java:41-58`.

### Saldo do Contrato no Recibo (Contract Balance) — R1.53.0 (#533)

O saldo do contrato usado no recibo de pagamento passou a ser calculado em Java, nao mais inline no SQL do recibo (que subtraia todos os pagamentos PAID e podia ficar **negativo** com fees):

- `ContractBalance.balance = totalContractAmount − totalPaidAmount` via `AccountAmountsService.getContractBalance(account)`, escalado 2 casas (HALF_EVEN); injetado no placeholder `:contractBalance`.
- A linha "If you pay off now you save" (`savedAmount = balance − payoff`) so e renderizada quando `savedAmount != null && savedAmount > 0` — o cliente nunca ve "you save" negativo/zero.
- **Fontes:** `service/PaymentReceiptService.java:104-126`, `pojo/CommonDataPojo.java:179-207`, `service/AccountAmountsService.java:80-103`, templates `correspondence/templates/payment-receipt-email.html`.

### Numero de Parcelas por Frequencia

| Frequencia | Abreviacao (planId) | Como e determinado |
|------------|--------------------|--------------------|
| WEEKLY | WK | Config `numOfPayments.{term}.WEEKLY` |
| BI_WEEKLY | BWK | Config `numOfPayments.{term}.BI_WEEKLY` |
| SEMI_MONTHLY | SM | Config `numOfPayments.{term}.SEMI_MONTHLY` |
| MONTHLY | MN | `termMonths` (se nenhum config) |

### planId no Calculo (Task #439)

A calculadora agora gera um `planId` para cada combinacao de frequencia + termo via `buildScheduleForFrequency`. O `planId` e incluido no `SchedSummaryInfo` retornado e segue o formato `{abreviacao}{termo}` (ex: `WK13`, `BWK16`).

O `planId` permite que o `SubmitApplicationService` localize o `PaymentOption` exato, substituindo a busca apenas por `selectedPaymentFrequency`. Ambos os parametros continuam funcionando para compatibilidade.

### Calculo do EPO

```
epoStartDate = firstPaymentDate ou hoje
epoExpiry = startDate + meses configurados ou epoDays do programa
epoAmount = costWithFeesNoTax + epoFeeAmount + buyoutFee
```

**Termo especial de 16 meses (configuravel via `changeEpoForTermMonths`):**
```
totalMoneyFactor = moneyFactor * termMonths   (ex: 0.15 * 16 = 2.40)
leaseAmount = (baseCost * totalMoneyFactor) - baseCost
leaseDays = dias totais do lease (calculado a partir de firstPaymentDate, numOfPayments e frequency)
dailyLeaseAmount = leaseAmount / leaseDays
epoAmount = baseCost + (dailyLeaseAmount * epoDays) + processingFee + epoFeeAmount + buyoutFee
```

**Nota:** O `moneyFactor` usado nesta formula e o fator **total** do contrato (`moneyFactor * termMonths`), NAO o fator mensal.

### Pagamento Minimo Final (Especifico por Estado)

Certos estados (ex: NC) exigem que o ultimo pagamento nao seja inferior a um percentual do custo base (default: 11%).

---

## 15. EPO - Early Pay Off (Quitacao Antecipada em 90 Dias)

### O Que e

EPO e a opcao que permite ao cliente **quitar o lease antecipadamente pagando o valor original do produto** (ou proximo disso) dentro de uma janela de tempo limitada -- tipicamente 90 dias. E o diferencial do modelo "Same as Cash".

### Para Que Serve (Beneficio ao Cliente)

O custo total do lease (com money factor) e significativamente maior que o preco original. Exemplo: um produto de $1.000 pode custar $1.800 no lease de 12 meses. Se o cliente pagar ~$1.000 + taxas dentro de 90 dias, ele economiza ~$800.

### Elegibilidade para EPO de 90 Dias

| Condicao (TODAS devem ser verdadeiras) | |
|---|---|
| Recebivel EPO ativo deve existir |
| `earlyPayoffDateExpiry` nao expirou |
| Override nao definida (ou override = true) |
| Estado em bypass list (CA): pula verificacao de atraso |
| Delinquency-as-of date nao anterior a hoje |
| Sem transacoes de pagamento em atraso |

### Calculo do EPO (Cascata por Estado)

| Prioridade | Regra |
|------------|-------|
| 1 | Desconto estadual sobre valor pago |
| 2 | Desconto estadual sobre saldo restante |
| 3 | Percentual estadual sobre saldo restante |
| 4 | Formula estados (CA, HI, NY, WV): `EPO = cost * (remainingPayments / totalPayments)` |
| 5 | Desconto do programa ou percentual global |

**NC:** EPO nao pode ser menor que a ultima parcela.

### EPO Kornerstone (Formula Especial)

```
kwBuyout = EpoNoTax - ((TotalPaid - PPFees - OtherFees) / MoneyFactor) + PastDueRegular
```

### O Que Acontece Quando EPO e Quitado

1. Todos os pagamentos sao **rewound** (desfeitos)
2. Pagamentos realocados ao recebivel EPO
3. EPO marcado como `PAID_IN_FULL`
4. Status da conta -> `PAID_OUT_EARLY_EPO`
5. Data de quitacao registrada
6. Se houve overpayment: alerta criado

---

## 56. Calculo de Payoff (Payoff Amount)

### O Que e

Calcula o valor total necessario para quitar completamente um lease. Suporta logica diferenciada para contas Kornerstone vs contas padrao UOwn.

### Para Que Serve

Quando um cliente deseja quitar o lease fora da janela de 90 dias do EPO, ou quando um agente precisa informar o valor de quitacao total.

### Formula Kornerstone (KW Buyout)

Aplicavel apenas para programas Kleverwise, Prime10 ou KWChoice:

```
KwBuyoutAmount = EpoAmountWithTax
    - ((TotalPayments - ProtectionPlanFees - OtherFees) / MoneyFactor)
    + PastDueRegularPayments
```

| Componente | Descricao |
|------------|-----------|
| `TotalPayments` | Todos os pagamentos realizados ate a data |
| `ProtectionPlanFees` | Taxas do plano de protecao ate a data atual (NAO futuras) |
| `OtherFees` | NSF e outras taxas (passadas E futuras) |
| `MoneyFactor` | Do schedule summary (se zero, divisao retorna zero) |
| `PastDueRegularPayments` | Apenas parcelas regulares em atraso (exclui processing fees) |

**Arredondamento:** `CEILING` para o centavo mais proximo.

### Calculo Padrao (UOwn)

Usa query SQL configuravel armazenada em `SvSqlConfig` com nome `getEpoBalance`. A query retorna dados de breakdown separados por virgula.

### Validacao contra Saldo do Contrato

**Config:** `com.uownleasing.svc.service.PayOffAmountService.check.contract.balance.for.epo`

Se habilitado e o EPO calculado exceder o saldo do contrato, o saldo do contrato e usado como valor de payoff.

### Como Consultar

- **Via TMS:** `POST /uown/tms/getPayoffAmount/{accountPk}`
- **Via Admin:** Interface de detalhes da conta

---

## 70. Regras Detalhadas de Calculo EPO por Estado

### O Que e

O calculo do EPO segue uma cascata de regras estaduais que determinam descontos e formulas especificas.

### Cascata de Prioridade (verificada no codigo)

| Prioridade | Regra | Config | Exemplo |
|------------|-------|--------|---------|
| 1 | Desconto fixo sobre valor pago | `epo.discount.for.state.{STATE}` | Ex: TX = $50 desconto |
| 2 | Desconto sobre saldo restante | `epo.remaining.amount.discount.for.state.{STATE}` | Ex: FL = $30 |
| 3 | Percentual sobre saldo restante | `epo.discount.on.remaining.for.state.{STATE}` | Ex: GA = 5% |
| 4 | Formula especial (CA, HI, NY, WV) | Hardcoded | `EPO = cost * (remainingPayments / totalPayments)` |
| 5 | Desconto do programa | `merchantProgram.payoffDiscount` | Fallback |

### Regras Especiais por Estado

| Estado | Regra Especial |
|--------|---------------|
| **NC** | EPO nao pode ser menor que o valor da ultima parcela (`lastPaymentNoTaxWithFees`) |
| **CA, HI, NY, WV** | Formula proporcional: `cost * (remainingPayments / totalPayments)` |

### Formula EPO declarada no contrato (16 meses)

O **texto** do contrato 16-meses declara o preco EPO (intencao verbatim):

> **EPO price = custo dos bens arrendados + impostos + fees aplicaveis + daily lease fees acumuladas da inception ate (data de exercicio | data corrente — depende do estado) − pagamentos de aluguel feitos on-time (excluindo impostos e fees).**

- Janela de **promotional payoff** = `epoDays`; **qualquer parcela atrasada anula a opcao** ("any late payment voids the option").
- A cascata de **calculo** (descontos por estado) ja esta em §70 acima; os **variantes de texto de contrato** por estado:
  - **OH:** "Cash Price less **50%** of payments made".
  - **NY:** proporcional — `Cash Price × (remaining / total payments)` (New baseline; NAO daily-accrual).
  - **PA / AL / LA / NC / TN / GA:** desconto `{{payOffDiscountPercent}}%` sobre o remaining.
  - **NC:** EPO nunca abaixo de `{{lastPaymentDueAmountWithTax}}` (floor balloon).

Registro de templates + tokens + matriz → [`appendix-h-epo-template-registry.md`](appendix-h-epo-template-registry.md). Fonte primaria: wiki `gow-sign/EPO-SECTIONS` `[external-doc:gitlab/EPO-SECTIONS,2026-06-23]`.

### Desativacao de Recebiveis

Ao criar novos recebiveis (ex: mudanca de frequencia), o sistema desativa os anteriores:
- **Para leads:** Desativa TODOS os recebiveis nao pagos
- **Para contas:** Desativa apenas tipos especificos: `PROCESSING_FEE`, `PROTECTION_PLAN_FEE`, `EARLY_PAY_OFF`, `REGULAR_PAYMENT`

---


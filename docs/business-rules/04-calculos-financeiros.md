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

### Desativacao de Recebiveis

Ao criar novos recebiveis (ex: mudanca de frequencia), o sistema desativa os anteriores:
- **Para leads:** Desativa TODOS os recebiveis nao pagos
- **Para contas:** Desativa apenas tipos especificos: `PROCESSING_FEE`, `PROTECTION_PLAN_FEE`, `EARLY_PAY_OFF`, `REGULAR_PAYMENT`

---


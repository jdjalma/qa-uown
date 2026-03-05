# Gestao do Ciclo de Vida da Conta
## UOwn Leasing - SVC Platform

Recebiveis, auto-pay, rating letters, inadimplencia, status de conta/lead, cancelamento, gestao de autopay e elegibilidade para paid-out.

---

## 16. Recebiveis e Cronograma de Pagamentos

### Tipos de Recebiveis

| Tipo | Descricao | Quando criado |
|------|-----------|---------------|
| `REGULAR_PAYMENT` | Parcela regular do lease | Sempre (cronograma) |
| `PROCESSING_FEE` | Taxa de processamento | Se fee > 0 |
| `EARLY_PAY_OFF` | Valor do EPO | Se EPO calculado |
| `PROTECTION_PLAN_FEE` | Taxa do plano de protecao | Contas Kornerstone migradas |
| `NSF_FEE` | Taxa de fundos insuficientes | Evento de NSF (ACH/CC) |

### Calculo de Imposto nos Recebiveis

```
taxAmount = baseAmount * taxRate
totalAmount = baseAmount + taxAmount
```

### Next Due Amount (Proximo Vencimento)

Soma todas as taxas anteriores ao primeiro recebivel regular + valor da primeira parcela regular + recebiveis no mesmo due date.

### Past Due Amount (Valor em Atraso)

```
pastDue = SUM(totalAmount - partialPaymentAmount) para recebiveis com dueDate <= hoje
```

---

## 18. Auto-Pay (Pagamento Automatico)

### Tipos Suportados

`ACH` (debito bancario), `CC` (cartao de credito), `NONE`

### Validacoes

| Auto-Pay | Requer |
|----------|--------|
| ACH | Conta bancaria ativa com auto-pay habilitado |
| CC | Cartao de credito ativo com auto-pay habilitado |

### Remocao Automatica por Rating

Ratings que desligam auto-pay (default: C, P, M):
- Se rating corresponde e ACH ativo -> Remove ACH, cria log e alerta
- Se rating corresponde e CC ativo -> Remove CC, cria log e alerta

---

## 19. Rating Letters (Classificacao de Risco da Conta)

### O Que e

O rating letter e uma classificacao de uma unica letra que indica o **status de risco/comportamento** da conta. Funciona como um "estado de cobranca" da conta.

### Significado de Cada Rating

| Rating | Significado | Impacto no Sistema |
|--------|-----------|-------------------|
| **S** | Standard/Satisfactory (normal) | Auto-pay funciona normalmente. Processamento padrao |
| **P** | Promise to Pay (acordo de pagamento) | **Desliga auto-pay ACH e CC**. Atribuido quando cliente faz payment arrangement via portal ou agente. Excluido de sweeps de pagamento |
| **C** | Collections (cobranca) | **Desliga auto-pay ACH e CC**. Conta em status de cobranca ativa. Excluido de sweeps |
| **M** | Military (SCRA/protecao militar) | **Desliga auto-pay ACH e CC**. Protecao sob Servicemembers Civil Relief Act |
| **D** | Delinquent/Do Not Process | Retentativas diarias de CC negado sao puladas |
| **B** | Bloqueado | Excluido de lembretes de primeiro pagamento e criacao de pagamentos recorrentes |
| **E, F, U** | Diversos | Excluidos de email "Settled in Full" |
| **S** | Sold (vendido) | Aplicado quando conta e vendida a comprador de divida |

### Como o Rating Muda

| Evento | Novo Rating |
|--------|------------|
| Payment arrangement criado | P (previous_rating salvo no arranjo) |
| Payment arrangement falhou (Task #446) | null (rating resetado, current_rating no arranjo = null) |
| Pagamento ACH via customer portal com data futura | P |
| Conta vendida para debt buyer | S (Sold) |
| Agente muda manualmente | Qualquer |

---

## 20. Inadimplencia e Cobranca

### Como a Inadimplencia e Rastreada

O campo `delinquencyAsOfDate` no schedule summary representa a data do recebivel mais antigo nao pago. `daysPastDue = dias entre delinquencyAsOfDate e hoje`.

### Faixas de Inadimplencia e Acoes

| Dias em Atraso | Acao Automatica |
|---------------|----------------|
| 31-60 | Email Delinquency30DayOffer |
| 61-90 | Email + SMS Delinquency60DayOffer |
| 91-150 | Email + SMS Delinquency90DayOffer |
| 150+ | Email + SMS Delinquency150DayOffer |
| 100 | CC rerun especial `_100_DAY_DELINQUENCY_RUN` |
| Diario | CC rerun `DAILY_DELINQUENCY_RUN` em contas inadimplentes |

### Lembretes Adicionais

- `delinquencyReminderEmailSweep`: lembretes genericos "Past Due"
- `latePaymentNoticeEmailSweep`: avisos mensais com dias exatos em atraso

---

## 21. Status de Conta (Account Status)

### ACTIVE

**O que significa:** Lease ativo, cliente devendo dinheiro e fazendo pagamentos.
**Quando acontece:** Conta criada/importada do LOS. Tambem quando conta quitada e revertida.
**Impacto:** Processamento normal de pagamentos, monitoramento de inadimplencia, auto-pay ativo.

### PAID_OUT

**O que significa:** Cliente completou todos os pagamentos ate o fim do contrato. Lease concluido normalmente.
**Quando acontece:** Automaticamente quando saldo restante e menor ou igual a uma parcela E data atual >= ultima data de pagamento.
**Impacto:** Nenhum pagamento futuro coletado. Email "Paid in Full" enviado. Conta encerrada.

### PAID_OUT_EARLY

**O que significa:** Cliente quitou antecipadamente pagando o saldo total (mas FORA da janela de 90 dias do EPO).
**Quando acontece:** Pagamento causa alocacao que cobre o valor total de payoff.
**Impacto:** Conta encerrada. Data de payoff registrada.

### PAID_OUT_EARLY_EPO

**O que significa:** Cliente exerceu a opcao de compra antecipada em 90 dias (EPO). Pagou o preco "a vista" do produto.
**Quando acontece:** Total de pagamentos (menos taxas) >= valor do EPO, dentro da janela de elegibilidade.
**Impacto:** Todos os pagamentos sao rewindados e realocados ao EPO. Conta encerrada com status especial.

**Reabertura automatica por retorno de pagamento ACH:**

Quando um pagamento ACH que quitou a conta via EPO e retornado pelo banco, a conta deve reabrir automaticamente:

| Etapa | Sweep | Acao |
|-------|-------|------|
| 1 | `sendACHPaymentsSweep` | Envia pagamento ao Profituity, marca como SENT |
| 2 | `getSendACHPaymentsStatusSweep` | Apos ~5 min, verifica status, posta na conta → PAID_OUT_EARLY_EPO |
| 3 | `getStatusDatePaymentsListSweep` | Apos 2-3 dias, verifica se retornou → marca como RETURNED |
| 4 | `reverseAchPaymentsSweep` | Reverte pagamento e **reabre a conta automaticamente** |

**Transicao de status:**
```
ACTIVE → (pagamento ACH enviado) → PAID_OUT_EARLY_EPO → (pagamento retornado) → ACTIVE
```

**Impacto em queries SQL de producao:** O status PAID_OUT_EARLY_EPO e considerado nos seguintes SQLs:
- `isEligibleForReapproval` - inclui contas EPO para reaprovacao
- `openToBuyCustomers` / `openToBuyByClientType` - lista contas disponiveis
- `rerun_ach` - inclui para retentativa ACH
- `getFundingReport` / `getFundingTransactionsForDateRange` - relatorios
- `paidInFullAccountEmailSweep` - envio de email de quitacao
- `sendDailyBorrowingBaseReport` - relatorio diario

### CANCELLED

**O que significa:** Lease cancelado. Contrato anulado.
**Quando acontece:** Fraude, pedido do merchant, periodo de cooling-off, acao administrativa.
**Impacto:** `cancelledDateTime` registrado. Opcionalmente todos pagamentos reembolsados. Nenhum pagamento futuro.

### SETTLED_IN_FULL

**O que significa:** A UOwn aceitou um pagamento negociado (tipicamente menor que o total devido) para encerrar a conta. Comum para contas muito inadimplentes onde um agente de IA ou humano liga para o cliente e oferece um acordo de quitacao.
**Quando acontece:**
- **Via CC direto:** Transacao CC do tipo SALE, same-day, marcada como `isSettlementPayment = true`, e aprovada.
- **Via Payment Arrangement (Task #446):** Arranjo do tipo `SETTLEMENT` com todas as transacoes concluidas com sucesso (status = `SUCCESS`). O sistema automaticamente transiciona a conta para SETTLED_IN_FULL quando o arranjo de settlement e completado.
**Impacto:** Email "Settled in Full" enviado. `settledInFullDateTime` registrado. Se pagamento revertido, conta volta para ACTIVE.

### CHARGED_OFF

**O que significa:** Conta lançada como perda contabil. A UOwn determinou que a divida e incobravel (tipicamente 180+ dias em atraso).
**Quando acontece:** Processo administrativo/batch de charge-off.
**Impacto:** Excluida de processamento normal de pagamentos. Pode ser vendida (-> SOLD).

### SOLD

**O que significa:** A divida da conta foi vendida a um comprador de divida (debt buyer) externo.
**Quando acontece:** Processo de venda de portfolio via `DocumentService.setDataForSoldAccount()`.
**Impacto:** Documentos da conta enviados ao comprador via SharePoint. Rating -> S (Sold). `soldDateTime` registrado.

### CLOSED

**O que significa:** Conta encerrada por motivos administrativos genericos.
**Impacto:** Sem processamento de pagamentos.

---

## 22. Status de Lead (Lead Status)

### Fase de Aplicacao/Underwriting

| Status | Significado |
|--------|-----------|
| `NEW` | Aplicacao recebida, nenhum processamento iniciado |
| `PENDING_UW` | Checks iniciais passaram, underwriting em andamento |
| `UW_APPROVED` | Aprovado pelo underwriting. Elegivel para contrato |
| `UW_DENIED` | Negado pelo underwriting (risco de credito) |
| `UW_REVIEW` | Requer revisao manual ou verificacao adicional (Plaid) |
| `UW_ERROR` | Erro no processo de underwriting |
| `DENIED` | Negado em step pre-underwriting (fraude, estado, duplicidade) |
| `ERROR` | Erro de sistema durante processamento |

### Fase de Contrato/Assinatura

| Status | Significado |
|--------|-----------|
| `CONTRACT_CREATED` | Contrato gerado e enviado para assinatura |
| `SIGNED` | Cliente assinou o contrato eletronicamente |
| `EXPIRED_CONTRACT` | Contrato expirou sem assinatura |
| `CANCELLED_CONTRACT` | Contrato cancelado antes do funding |
| `ORDER_CANCELLED` | Pedido/invoice do merchant cancelado |

### Fase de Funding

| Status | Significado |
|--------|-----------|
| `READY_TO_FUND` | Pronto para fila de funding |
| `FUNDING` | Processo de funding iniciado, dinheiro em transito |
| `FUNDED` | Merchant recebeu pagamento. Conta criada no SVC |

### Status Terminais

| Status | Significado |
|--------|-----------|
| `EXPIRED` | Aprovacao expirou sem acao |
| `INCOMPLETE` | Aplicacao abandonada antes do UW |
| `CANCELLED_DUP_SSN` | Cancelado por lead mais novo com mesmo SSN |
| `CANCELLED_DUP_DENIAL` | Cancelado por duplicidade de SSN negado |
| `BLACKLISTED` | Todos os dados do cliente adicionados a lista negra |

### Status Internos de Fraude (internalStatus)

| Prefixo | Servico |
|---------|---------|
| `SENTILINK_DENIED/ERROR/SSN_TYPO` | Sentilink |
| `NEUSTAR_DENIED/ERROR` | Neustar |
| `FRAUD_DENIED/ERROR` | SEON |
| `LEXISNEXIS_DENIED/ERROR` | LexisNexis |
| `NEURO_ID_DENIED/APPROVED/ERROR` | NeuroID |
| `INTELLICHECK_FAILED/ERRORED` | Intellicheck |
| `SEON_ID_FAILED/APPROVED` | SEON ID |
| `BLACKLIST_DENIED/APPROVED` | Blacklist |
| `PLAID_PENDING/SUCCESS/FAILED/ABANDONED` | Plaid |

---

## 52. Cancelamento de Conta (Account Cancellation)

### O Que e

Processo de encerramento de uma conta de lease, anulando o contrato. Pode incluir reembolso total de todos os pagamentos realizados.

### Para Que Serve

Usado quando ha fraude confirmada, pedido do merchant, periodo de cooling-off legal, ou acao administrativa que exija anulacao do contrato.

### Como Funciona

1. **Status da conta** muda para `CANCELLED`
2. **Timestamp** de cancelamento registrado (`cancelledDateTime = now()`)
3. **Comentario obrigatorio** explicando a razao do cancelamento
4. **Activity log** criado com o evento de mudanca de status
5. **Reembolso opcional:** Se `refundAllPayments = true`, todos os pagamentos aplicados sao reembolsados via `RefundPaymentService`

### Cancelamento de Conta via Lead

Quando o cancelamento e iniciado a partir de um lead (sistema LOS):

| Passo | Acao |
|-------|------|
| 1 | Valida existencia do lead e vinculo com conta |
| 2 | Opcionalmente reembolsa transacoes CC do LOS (config-driven) |
| 3 | Apenas transacoes com `action = SALE` e `status = APPROVED` sao reembolsadas |
| 4 | Transacoes reembolsadas recebem status `REFUNDED` |
| 5 | Executa cancelamento padrao da conta |

**Configuracao:** `com.uownleasing.svc.service.CancelAccountService.refund.los.payments` (default: `false`)

### Como Disparar

```
POST /uown/svc/cancelAccount/{accountPk}
Body: CancelAccountRequest { comment, refundAllPayments }
```

---

## 58. Gestao de AutoPay e Instrumentos Financeiros

### O Que e

Servico que sincroniza automaticamente os metodos de pagamento automatico (AutoPay) da conta com base nos instrumentos financeiros disponiveis (contas bancarias e cartoes de credito).

### Para Que Serve

Garante que o AutoPay reflita corretamente os metodos de pagamento disponiveis. Quando um cartao e adicionado ou removido, o AutoPay se ajusta automaticamente.

### Regras de Sincronizacao

| Evento | Acao no AutoPay |
|--------|----------------|
| Conta bancaria adicionada | ACH habilitado automaticamente (se nao presente) |
| Ultima conta bancaria removida | ACH removido do AutoPay |
| Cartao de credito adicionado | CC habilitado automaticamente (se nao presente) |
| Ultimo cartao de credito ativo removido | CC removido do AutoPay |
| Conta bancaria removida mas CC existe | CC permanece ativo |
| CC removido mas conta bancaria existe | ACH permanece ativo |

### Impacto do Rating Letter

O rating letter tem **precedencia** sobre flags explicitas de AutoPay:

| Evento | Acao |
|--------|------|
| Rating alterado para C, P ou M | **Desliga AutoPay** (ACH e CC) |
| Rating removido (setado para null) | AutoPay recalculado com base nos instrumentos disponiveis |
| Rating alterado para outro valor | AutoPay mantido, horario do rating registrado |

### Auditoria

Toda mudanca de rating ou AutoPay gera activity log com valores anteriores e novos. Mudancas so sao logadas se o valor realmente mudar.

---

## 69. Elegibilidade para Auto Paid-Out

### O Que e

Servico que determina automaticamente se uma conta e elegivel para status `PAID_OUT` (quitada), baseado no saldo restante e datas de vencimento.

### Para Que Serve

Automatiza o encerramento de contas que ja pagaram o suficiente, sem necessidade de acao manual.

### Criterios de Elegibilidade

| Criterio | Descricao |
|----------|-----------|
| **Data minima** | Data atual deve ser >= ultima data de vencimento regular (conta nao pode ser encerrada antes do vencimento programado) |
| **Saldo restante** | `Saldo = Total do Contrato - Total de Pagamentos Realizados` |
| **Threshold de pagamento** | Saldo restante <= valor de uma parcela regular programada |
| **OU Threshold de taxa** | Saldo restante <= total de taxas elegiveis (MANUAL_FEE, MISC_FEE, NSF_FEE) |

### Tipos de Taxa Elegiveis

Configuravel via `eligibility.fee.types` (default: `MANUAL_FEE, MISC_FEE, NSF_FEE`). Apenas esses tipos de taxa sao considerados no threshold de taxa para elegibilidade.

### Resultado

Se elegivel: conta muda para `PAID_OUT`, email "Paid in Full" enviado, data de quitacao registrada.

---


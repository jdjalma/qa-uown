# Processamento de Pagamentos
## UOwn Leasing - SVC Platform

Pagamentos CC, CC Peek, ACH, pos-pagamento, PayWallet, CC Idempotent, reembolsos, arranjos de pagamento e taxa NSF.

---

## 11. Pagamentos com Cartao de Credito

### Fluxo de Autorizacao

1. **Pre-autorizacao Kount** (verificacao de fraude)
2. Se Kount DECLINED -> transacao negada, sem chamada ao gateway
3. **Token do gateway** obtido se necessario
4. **Chamada ao gateway** para autorizar/cobrar
5. **Processamento da resposta** (token, auth code, decision)

### Deteccao de NSF (Fundos Insuficientes)

Uma transacao e marcada como NSF se:
- Mensagem contem "Insufficient funds"
- Codigo de erro em "50051, 57852"
- Ultimos 2 digitos do codigo = "51"

### Rerun de CC (Retentativa)

| Situacao | Acao |
|----------|------|
| Primeiro rerun | Cria receivable de NSF fee + transacao separada RERUN_NSF |
| Reruns seguintes | Incrementa numberOfTries |
| Past due rerun | Se aprovado, tenta cobrar recebiveis vencidos ate limite de $10,000 |

### Daily Denied Rerun (Retentativa Automatica Diaria)

Executa diariamente, retentando CCs negados/erro do dia. Exclui permanentemente: cartoes expirados, numeros invalidos, contas fechadas, cartoes roubados.

---

## 12. CC Peek (Captura Parcial de Cartao)

### O Que e

CC Peek e um mecanismo que permite cobrar o cartao do cliente por **menos que o valor total** quando o cartao nao tem saldo suficiente, em vez de falhar a transacao inteira.

### Para Que Serve

Sem CC Peek, uma cobranca de $200 em um cartao com $150 disponiveis falha completamente (coleta $0). Com CC Peek, o gateway "espia" o saldo disponivel, captura $150, e o sistema depois retenta os $50 restantes. Isso reduz inadimplencia e melhora o fluxo de caixa.

### Como o Consentimento e Capturado

1. **Na assinatura do contrato:** Documento e-sign contem checkboxes `preauthyes` e `preauthno`
2. **Default:** Consentimento = `true` (se o cliente nao marcar `preauthno`)
3. O `EsignService` salva o consentimento no lead e depois na conta

### Quando CC Peek e Ativado

| Condicao (TODAS devem ser verdadeiras) | |
|---|---|
| Config `sendCCPeek` = true |
| Conta tem `ccPeekConsent = true` |
| Config `ccPeekOn` = true |
| Nao e transacao same-day request (tem toggle proprio) |

### Impacto na Retentativa

Se uma transacao CC Peek foi aprovada mas capturou valor parcial, o rerun e feito pelo valor restante: `rerunAmount = originalAmount - capturedAmount`.

### Como Modificar o Consentimento

Agentes internos podem alterar o CC Peek consent via `ServicingInformationService`. Toda mudanca e registrada em activity log.

### Gestao de Consentimento CC Peek por Portal

O consentimento de CC Peek tem comportamento diferente dependendo do portal:

| Portal | Comportamento | Editavel |
|--------|--------------|----------|
| **Origination** | Exibe "CC Peek Consent" abaixo da secao de Credit Card. Mostra o consentimento original da assinatura do contrato | **Nao** (read-only) |
| **Servicing** | Exibe toggle "CC Peek Consent" na secao Servicing Information. Permite ativacao/desativacao por agentes | **Sim** (editavel) |

**Logica de data de consentimento:**
- **Na assinatura do contrato:** Se cliente consentiu → data = data da assinatura
- **Ativacao em Servicing:** Toggle ativado → data = data atual da ativacao
- **Desativacao em Servicing:** Toggle desativado → data removida/oculta

**Persistencia (`ConsentService.updateCcPeekConsent`):**
- Comparacao null-safe usando `Objects.equals()` para detectar mudanca real
- Activity log criado **apenas** se o valor realmente mudar (idempotente)
- Mensagem: `"CC Peek Consent changed from [anterior] to [novo]"`
- Tipo de log: `DATA_CHANGE`
- Username do operador registrado via `ThreadAttributes`

**Importante:** Edicoes feitas em Servicing NAO alteram a exibicao em Origination (Origination sempre mostra a escolha original do contrato).

---

## 13a. Pagamentos por Cheque (Check Payment)

### O Que e

Cheques fisicos recebidos de clientes, processados manualmente por agentes via portal Servicing.

### Campos Obrigatorios

| Campo | Regra |
|-------|-------|
| `paymentDate` | Data do cheque (obrigatorio) |
| `paymentAmount` | Valor > $0 (obrigatorio) |
| `status` | Inicial: POSTED; evolui para CLEARED ou RETURNED |
| `allocationStrategy` | DEFAULT, REGULAR_RECEIVABLES ou EPO_ONLY (obrigatorio) |

### Status do Cheque

| Status | Descricao |
|--------|-----------|
| `POSTED` | Cheque recebido e lancado no sistema |
| `CLEARED` | Compensacao bancaria confirmada |
| `RETURNED` | Cheque devolvido (sem fundos ou invalido) |

### Estrategia de Alocacao

Mesmas regras dos pagamentos CC/ACH:
- **DEFAULT** — aloca em recebiveis vencidos + proximo vencimento
- **REGULAR_RECEIVABLES** — aloca apenas em parcelas regulares (sem EPO)
- **EPO_ONLY** — aloca somente no saldo de EPO

### Restricao de Estorno/Reembolso

| Tipo de Pagamento | Reverse | Refund |
|-------------------|---------|--------|
| `Check` | **Permitido** (com permissao `reverse_payment`) | **NÃO disponivel** |
| `ACH_Payment` | Permitido | Permitido (parcial ou total) |
| `CC_Payment` | Permitido | Permitido (parcial ou total) |

**Regra:** Pagamentos por cheque (`Check`) so podem ser REVERTIDOS — a opcao de reembolso e ocultada no portal Servicing para esse tipo.

**Reembolso parcial:** A opcao de reembolsar taxa (`refundFee`) so esta disponivel em reembolso total — em reembolso parcial, `refundFee` e forcado para `false`.

---

## 13. Pagamentos ACH (Debito Bancario)

### O Que e

ACH (Automated Clearing House) e o sistema americano de transferencia bancaria. A UOwn debita valores diretamente da conta bancaria do cliente via Profituity (processador ACH).

### Criacao de Pagamento ACH

| Validacao | Detalhe |
|-----------|---------|
| Bank data obrigatorio | Erro se null |
| Auto-pay default | `false` se null |
| Nome do cliente | Preenchido automaticamente se vazio |
| Tipo de conta default | CHECKING |

### Rating Letter via Customer Portal

Se o pagamento e do tipo REQUEST, com data futura, feito pelo "customer portal": rating atualizada para `P` (Promise to pay).

### NSF Fee no ACH

| Condicao (TODAS devem ser verdadeiras) | |
|---|---|
| Config `create.nsf.fee.receivable.on.rerun` = true |
| Tipo: SCHEDULED |
| Nao e rerun (originalACHPk = null) |
| Primeira tentativa (numberOfTries = 1) |

**Valor:** Especifico por estado (StateConfigurations), fallback $15.00. INSTORE = estado merchant, ONLINE = estado cliente.

### Reembolso ACH

Cria novo pagamento com `achType = ACHCredit`. Se parcial, cria novo PAID com restante.

---

## 14. Pos-Pagamento e Alocacao de Recebiveis

### Estrategias de Alocacao

| Estrategia | Comportamento |
|------------|--------------|
| DEFAULT | Aloca para recebiveis vencidos e proximo a vencer |
| EPO_ONLY | Aloca apenas ao recebivel EPO |
| Catch-all | Aloca para TODOS os recebiveis nao pagos |

### Pagamento Sem Recebivel

Se nao ha recebivel para alocar: cria alerta "Payment received but is not allocated to any receivable or epo".

---

## 37. PayWallet (Pagamentos via Folha de Pagamento)

### O Que e

PayWallet e um servico de **desconto em folha de pagamento** onde o empregador do cliente deduz o valor do lease diretamente do salario.

### Para Que Serve

Alternativa ao cartao de credito e ACH. Pagamentos via folha tem taxa de inadimplencia muito menor pois sao deduzidos antes do cliente receber o salario.

### Como Funciona

1. **PayWallet gera arquivo Excel** (.xlsx) com pagamentos coletados
2. **Arquivo depositado via SFTP** na pasta `/paywallet`
3. **Sweep diario** (`processPayWalletPaymentsSweep`) le o arquivo
4. **Processamento paralelo:** ParseIA cada linha com ExecutorService
5. **Dados extraidos:** Data, nome do cliente, conta de coleta, conta de disbursement, referencia do lease, valor, trace number
6. **Deduplicacao:** Verifica pagamentos existentes por data + trace number
7. **Registro:** Converte para `PaymentInfo` e posta na conta
8. **Arquivamento:** Move arquivo processado para `/pw/`, deleta original

### Como Ativar

- O sweep roda automaticamente a meia-noite
- Para processar manualmente: `POST /uown/svc/triggerScheduledTask/processPayWalletPaymentsSweep`
- O servico depende de conexao SFTP configurada

### O Que Verificar

- Novos pagamentos com source "PayWallet" na conta
- Arquivo movido de `/paywallet` para `/pw/`
- Logs de processamento para erros de parsing

---

## 47. CC Idempotent (Retentativa de CC Timeout)

### O Que e

Servico que **retenta transacoes CC que deram timeout** (sem resposta do gateway) garantindo **idempotencia** -- nao cobra duas vezes.

### Para Que Serve

Gateways de pagamento podem nao responder (timeout de rede, indisponibilidade). O sistema precisa saber se a cobranca foi efetivada ou nao antes de retentar.

### Como Funciona

1. Sweep identifica transacoes com status TIMEOUT
2. Para cada, consulta gateway sobre status real
3. Se cobrada: atualiza para APPROVED
4. Se nao cobrada: retenta com mesma referencia (idempotent key)
5. Se inconclusivo: marca para revisao manual

### Como Ativar

Sweep `IdempotentCCSweep` roda automaticamente. Para disparar: `POST /uown/svc/triggerScheduledTask/IdempotentCCSweep`

---

## 53. Reembolso de Pagamentos (Refund Payment)

### O Que e

Servico que processa reembolsos de pagamentos ja realizados, suportando tanto pagamentos ACH quanto CC, com capacidade de reembolso parcial ou total.

### Para Que Serve

Necessario quando um pagamento deve ser revertido -- por erro, cancelamento de conta, fraude, ou acordo com o cliente.

### Tipos de Reembolso

| Tipo | Metodo de Pagamento | Acao |
|------|---------------------|------|
| **Reembolso Total** | ACH ou CC | Reverte o valor integral do pagamento |
| **Reembolso Parcial** | ACH ou CC | Reverte parte do valor, criando novo registro para o restante |

### Logica de Reembolso CC

1. Recupera a transacao CC associada ao pagamento
2. Chama `CCRunRefundService` para executar o reembolso no gateway
3. **Somente prossegue** se a transacao de reembolso retornar status `APPROVED`
4. Detecta re-reembolso verificando se a transacao original ja tinha status `REFUNDED` ou `PARTIALLY_REFUNDED`

### Logica de Reembolso Parcial

Quando o valor de reembolso e menor que o valor original do pagamento:

1. Pagamento original marcado como `REVERSED` com data e timestamp de reversao
2. **Novo registro de pagamento** criado para o valor restante (`valorOriginal - valorReembolso`)
3. Novo pagamento herda: estrategia de alocacao, data de pagamento, status `PAID`

### Reembolso em Lote

O servico aceita lista de PKs de pagamento (separados por virgula) e processa cada um individualmente. Se um reembolso falhar, os demais continuam -- falhas sao coletadas e retornadas na resposta consolidada.

### Como Disparar

```
POST /uown/svc/refundPayment/{paymentPk}?amount={valor}&comment={motivo}
```

---

## 54. Arranjo de Pagamentos (Payment Arrangement)

### O Que e

Mecanismo para criar acordos de pagamento com clientes inadimplentes, processando multiplas transacoes CC ou ACH de uma vez e atualizando o status da conta. A partir da task #446, arranjos sao persistidos na entidade `uown_sv_payment_arrangement` com rastreamento de status, tipo e vinculo com transacoes individuais.

### Para Que Serve

Quando um cliente esta em atraso, um agente pode negociar um plano de pagamento. O arranjo permite agendar e processar multiplos pagamentos em uma unica operacao. Arranjos do tipo SETTLEMENT permitem quitar a conta por valor negociado (tipicamente menor que o total devido).

### Entidade: uown_sv_payment_arrangement (Task #446)

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| `pk` | BIGINT (PK) | Chave primaria |
| `account_pk` | BIGINT (FK) | Conta vinculada |
| `start_date` | DATE | Data de inicio do arranjo |
| `end_date` | DATE | Data de termino do arranjo |
| `frequency` | VARCHAR | Frequencia dos pagamentos (WEEKLY, BI_WEEKLY, etc.) |
| `amount` | DECIMAL | Valor de cada parcela do arranjo |
| `arrangement_type` | VARCHAR | Tipo: `NORMAL` ou `SETTLEMENT` |
| `payment_type` | VARCHAR | Metodo de pagamento (CC, ACH) |
| `username` | VARCHAR | Agente que criou o arranjo |
| `previous_rating` | CHAR(1) | Rating da conta antes do arranjo |
| `current_rating` | CHAR(1) | Rating atual da conta |
| `is_active` | BOOLEAN | Se o arranjo esta ativo |
| `payment_arrangement_status` | VARCHAR | Status: `NOT_STARTED`, `IN_PROGRESS`, `SUCCESS`, `FAILED` |
| `notes` | TEXT | Observacoes do agente |

### FK nas Tabelas de Transacao (Task #446)

As tabelas de transacao agora possuem FK para vincular cada transacao ao arranjo que a originou:

| Tabela | Nova Coluna |
|--------|-------------|
| `uown_sv_credit_card_transaction` | `payment_arrangement_pk` |
| `uown_los_credit_card_transaction` | `payment_arrangement_pk` |
| `uown_sv_achpayment` | `payment_arrangement_pk` |

### Tipos de Arranjo (ArrangementType)

| Tipo | Descricao | Impacto no Encerramento |
|------|-----------|------------------------|
| `NORMAL` | Acordo de pagamento padrao (promise to pay) | Ao concluir com sucesso, arranjo marcado como SUCCESS. Conta permanece ACTIVE |
| `SETTLEMENT` | Acordo de quitacao negociada (valor reduzido) | Ao concluir com sucesso, arranjo marcado como SUCCESS **e conta muda para SETTLED_IN_FULL** |

### Maquina de Estados do Arranjo (PaymentArrangementStatus)

| Status | Descricao |
|--------|-----------|
| `NOT_STARTED` | Arranjo criado, nenhuma transacao processada ainda |
| `IN_PROGRESS` | Pelo menos uma transacao processada, restam transacoes pendentes |
| `SUCCESS` | Todas as transacoes concluidas com sucesso |
| `FAILED` | Pelo menos uma transacao falhou |

### Logica de Transicao de Status (Task #446)

A avaliacao do status do arranjo segue a seguinte matriz de decisao, executada apos cada transacao ser processada:

```
1. Alguma transacao vinculada falhou?
   SIM → status = FAILED, is_active = false, current_rating = null
   NAO → continua...

2. Existem transacoes pendentes (PENDING)?
   SIM → status = IN_PROGRESS
   NAO → continua...

3. Todas as transacoes concluidas com sucesso:
   - Se arrangement_type = SETTLEMENT → status = SUCCESS, conta → SETTLED_IN_FULL
   - Se arrangement_type = NORMAL → status = SUCCESS
```

**Detalhamento das transicoes:**

| Condicao | Novo Status | is_active | current_rating | Status da Conta |
|----------|-------------|-----------|----------------|-----------------|
| Qualquer transacao falhou | `FAILED` | `false` | `null` | Sem mudanca (ACTIVE) |
| Sem falha + pendentes existem | `IN_PROGRESS` | `true` | Mantido | Sem mudanca |
| Sem falha + sem pendentes + SETTLEMENT | `SUCCESS` | `false` | Mantido | `SETTLED_IN_FULL` |
| Sem falha + sem pendentes + NORMAL | `SUCCESS` | `false` | Mantido | Sem mudanca |

### Processamento Sincrono (CC) vs Assincrono (ACH)

| Metodo | Processamento | Status inicial | Status final (sucesso) | Requer sweep? |
|--------|--------------|----------------|------------------------|--------------|
| **CC** | **Sincrono** — transacoes processadas dentro da mesma requisicao HTTP | `NOT_STARTED` (momentaneo) | `SUCCESS` | Nao (sweep e informacional) |
| **ACH** | **Assincrono** — pagamentos criados como PENDING; processados pela Profituity via sweeps | `NOT_STARTED` | `SUCCESS` | **Sim** (sendACHPaymentsSweep + getStatusDatePaymentsListSweep) |

**Implicacao para testes:**
- Arranjos CC: apos `makeCreditCardPayments`, o status ja e `SUCCESS` — nao aguardar sweep.
- Arranjos ACH: apos `createOrUpdateAchPayments`, o status e `NOT_STARTED` — aguardar sweep e polling para atingir `SUCCESS`.

### Como Funciona

#### Transacoes CC

1. **Primeira transacao:** Cartao e autorizado e tokenizado (`authorizeAndTokenizeCard`)
2. **Transacoes subsequentes:** Usam o mesmo token da primeira transacao
3. Cada transacao e processada **sincronamente** na mesma requisicao HTTP — o arranjo ja chega a `SUCCESS` antes do retorno do endpoint
4. Username do agente registrado em cada transacao para auditoria
5. Cada transacao CC recebe o `payment_arrangement_pk` do arranjo pai

#### Pagamentos ACH

1. Cada pagamento ACH recebe o username do agente atual
2. Pagamentos sao criados ou atualizados individualmente via `createOrUpdateAchPayment` com status `PENDING`
3. Cada pagamento ACH recebe o `payment_arrangement_pk` do arranjo pai
4. O campo `ach_process_type = 'REQUEST'` deve ser enviado para que o `sendACHPaymentsSweep` processe o pagamento independentemente de vencimento de recebivel (sem esse campo, o sweep so pega pagamentos com recebivel vencendo em D+1)

### Sweeps de Pagamento e Arranjos (Task #446)

Os sweeps de envio de pagamentos consideram o arranjo ao selecionar transacoes:

#### sendCreditCardPaymentsSql

Seleciona transacoes CC pendentes para envio ao gateway:
- `status = 'PENDING'`
- `posting_date <= CURRENT_DATE`
- Conta com `account_status = 'ACTIVE'`
- Rating **diferente** de `B` e `C` (contas bloqueadas/em cobranca sao excluidas)
- Resultado: transacao marcada como `PICKED_TO_SEND`

#### sendACHPaymentsSql

Seleciona pagamentos ACH pendentes para envio ao Profituity:
- `status = 'PENDING'`
- `posting_date <= CURRENT_DATE + 1` (ACH tem D+1 de antecedencia) **OU** `ach_process_type = 'REQUEST'` (pagamentos de arranjo — ignoram a janela de vencimento)
- Rating **diferente** de `B` e `C`
- Resultado: pagamento marcado como `PICKED_TO_SEND`

**Nota:** Pagamentos de arranjo ACH criados via API devem incluir `ach_process_type = 'REQUEST'`. Sem esse campo, o sweep so os processa se um recebivel esta vencendo em D+1 — em contas sem recebivel proximo, o pagamento ficaria preso em PENDING.

### Impacto no Rating

Se a flag `paymentArrangement = true`:
- **Rating letter da conta** atualizado para `P` (Promise to Pay)
- **previous_rating** salvo no arranjo para auditoria
- **Auto-pay existente** e preservado e mantido
- Se o arranjo falhar: `current_rating` volta para `null` (rating resetado)

**BUG CONHECIDO (Task #446):** `AccountFinancialInfoService.updateRatingLetterAndAutoPay` registra no activity log "Rating letter changed from null to P", porem NAO persiste a entidade no branch nao-nulo. A coluna `rating` em `uown_sv_account` permanece `null` mesmo apos a criacao do arranjo. O activity log confirma que o codigo executou — o problema e a ausencia do `save()` na entidade.

### Como Disparar

- **Via TMS:** `POST /uown/tms/makeCreditCardPayments` (CC)
- **Via TMS:** `POST /uown/tms/makeAchPayment` (ACH)
- **Via Admin:** Interface do agente de cobranca

---

## 71. Validacao de Saldo Devedor (Overpayment Prevention)

### O Que e

Regra de validacao que impede cobrar do cliente um valor maior que o saldo devedor restante da conta.

### Para Que Serve

Protege contra cobranças excessivas que resultariam em saldo negativo (credito) na conta, evitando necessidade de reembolso e complicacoes contabeis.

### Regra

```
SE valor_cobranca > saldo_devedor_restante:
  REJEITA a cobranca
```

**Saldo devedor restante** = Total do contrato - Total de pagamentos ja realizados (alocados).

### Impacto

- Agente nao consegue processar pagamento acima do saldo
- Se por algum motivo uma cobranca excessiva for processada, o agente UOwn deve reverter o excedente manualmente
- Aplica-se a todos os metodos de pagamento (CC, ACH, PayWallet)

---

## 57. Taxa NSF por Estado (NSF Fee)

### O Que e

Determina o valor da taxa de NSF (Non-Sufficient Funds / Fundos Insuficientes) para uma conta, com suporte a valores especificos por estado.

### Para Que Serve

Quando um pagamento ACH ou CC falha por insuficiencia de fundos, uma taxa e cobrada. O valor pode variar por estado conforme regulamentacao local.

### Logica de Determinacao

1. **Valor default:** Config `com.uownleasing.svc.service.AccountFeeService.nsfFee` (default: `$15.00`)
2. **Determinacao do estado:**
   - Merchant `INSTORE` -> usa estado do **merchant**
   - Merchant `ONLINE` -> usa estado do **endereco do cliente**
3. **Override estadual:** Se o `StateConfigurations` do estado tiver NSF fee configurado e > $0, usa o valor estadual
4. **Fallback:** Se nao houver override estadual, usa o valor default

---


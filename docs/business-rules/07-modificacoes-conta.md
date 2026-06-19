---
title: Modificações e Ajustes de Conta
domain: business-rules
status: stable
volatility: volatile
last_verified: 2026-06-18
sources:
  - code: src/helpers/settlement.helpers.ts#calculateSettlement
  - db: uown_frequency_mods
  - db: uown_lead_modifications
  - svc-source: ChangeLeadStatusService.java
  - svc-source: ThreadAttributes.java
  - env: qa2
derived_from:
  - knowledge-base/modification-report-agent-name-bug
covers: [rewind-replay, settlement, invoice-modification, frequency-change, due-date, fpd-adjustment, additional-lease, sweeps, modification-report-agent-attribution]
---

# Modificacoes e Ajustes de Conta
## UOwn Leasing - SVC Platform

Rewind/Replay, settlement, modificacao de invoice, mudanca de frequencia, movimentacao de due date, alteracao de aprovacao, lease adicional e ajuste de FPD.

---

## 17. Rewind/Replay (Motor de Correcao de Pagamentos)

### O Que e

Mecanismo para corrigir ou reestruturar alocacoes de pagamentos. Funciona como "desfazer todas as alocacoes, depois refazer do zero na ordem correta".

### Para Que Serve

Quando algo muda apos pagamentos terem sido alocados (reversao, mudanca de frequencia, regeneracao de schedule), as alocacoes podem nao estar mais corretas. Em vez de corrigir cirurgicamente, o sistema desfaz tudo e refaz.

### Como Funciona

| Fase | Acao |
|------|------|
| **Rewind** | Reverte alocacoes de todos os pagamentos PAID. Se conta estava quitada (PAID_OUT, etc), volta para ACTIVE |
| **Replay** | Reaplica todos os pagamentos em ordem cronologica, reavaliando EPO, alocacao, taxas |

### Quando e Usado

- Reversao de pagamento (cheque devolvido, NSF)
- Mudanca de frequencia
- Regeneracao de cronograma
- Quitacao EPO (realocacao para recebivel EPO)

---

## 35. Settlement (Acordo de Quitacao)

### O Que e

Settlement e o processo de **negociacao de divida** onde a UOwn aceita um valor menor que o total devido para encerrar a conta. Tipicamente usado para contas muito inadimplentes.

### Para Que Serve

Recupera parte do valor em contas que provavelmente seriam charged-off (perda total). Melhor receber parte do que nada.

### Como Funciona

1. **Agente ou bot (Skit.ai) liga para cliente** inadimplente
2. **Oferece acordo de quitacao** com valor reduzido (ex: deve $1.500, oferta de $800)
3. **Cliente aceita** e fornece dados de cartao de credito
4. **Transacao processada** como CC SALE com flag `isSettlementPayment = true`
5. **Se aprovada:** Conta muda para `SETTLED_IN_FULL`, email enviado
6. **Se pagamento revertido:** Conta volta para ACTIVE

### Como Ativar/Disparar

- **Via agente humano:** TMS endpoint `makeCreditCardPayment` com flag de settlement
- **Via bot Skit.ai:** Automatico atraves de arquivo de ofertas gerado pelo sweep `createSkitDelinquentOfferFileSweep`
- **Via API:** `POST /uown/los/settleApplication` com `ApplicationSettleRequest`

### Pre-Condicoes para Settlement via `settleApplication`

| Condicao | Regra |
|----------|-------|
| Todos os itens entregues | `numberOfItemsDelivered == numberOfItems` |
| Nenhum item cancelado | Items com status `CANCELLED` bloqueiam o settlement |
| Nenhum item ja pago | Items com status `PAID` indicam conta ja quitada |
| Settlement parcial | Flag `partialSettlement: boolean` permite settlement de parte dos itens |

### Controle de Concorrencia

O sistema usa Hazelcast Settlement Request Map para impedir ofertas duplicadas simultaneas para o mesmo lead.

### O Que Verificar

- Conta com status `SETTLED_IN_FULL` e `settledInFullDateTime` preenchido
- Email "Settled in Full" enviado
- Transacao CC com `isSettlementPayment = true`

---

## 36. Modificacao de Invoice

### O Que e

Servico que permite modificar os termos de um lease **apos a assinatura** criando uma nova referencia de lease.

### Para Que Serve

Quando um acordo de settlement e aceito ou os termos do lease precisam mudar, o sistema cria um novo lead com os termos modificados vinculado ao original.

### Como Funciona

1. Valida que lead esta SIGNED ou adiante
2. Cancela a conta associada (se existir)
3. Se FUNDED: Cria request de refund ao merchant
4. Cria nova aplicacao a partir dos dados originais
5. Copia metodos de pagamento (CC/ACH) para o novo lead
6. Vincula novo lead a oferta de settlement

### Como Disparar

```
POST /uown/los/modifyInvoiceForLead/{leadPk}
```
**Resposta:** `ModifyInvoiceResponse` com `newLeadPk`

### O Que Verificar

- Novo lead criado com status correto
- Conta anterior cancelada
- Metodos de pagamento copiados

---

## 41. Modificacao de Frequencia de Pagamento

### O Que e

Servico que permite **alterar a frequencia de pagamento** de um lease (ex: semanal para quinzenal) e registra trilha de auditoria.

### Para Que Serve

Clientes podem precisar mudar a frequencia para alinhar com seu ciclo de pagamento de salario.

### Dados Registrados

| Campo | Descricao |
|-------|-----------|
| `fromFrequency` | Frequencia anterior (WEEKLY, BI_WEEKLY, etc.) |
| `toFrequency` | Nova frequencia |
| `modDate` | Data da modificacao |
| `agentUsername` | Quem fez a alteracao |

### Como Disparar

Via interface administrativa ou endpoint de mudanca de frequencia. O `ChangeFrequencyService` chama automaticamente o registro de auditoria.

### Impacto

- Cronograma de recebiveis e **regenerado** (Rewind/Replay executado)
- Valores das parcelas mudam (mais parcelas menores ou menos parcelas maiores)
- Historico de mudanca registrado em `uown_frequency_mods`

---

## 42. Movimentacao de Data de Vencimento (Due Date Move)

### O Que e

Permite **adiar ou antecipar** datas de vencimento de recebiveis por N dias.

### Para Que Serve

- **Skip payment:** Pular uma parcela em caso de hardship
- **Payment arrangement:** Reorganizar datas para alinhar com salario
- **Alinhamento:** Ajustar todas as parcelas futuras

### Como Disparar

```
POST /uown/svc/moveDueDatesByDays/{accountPk}?moveNumberOfDays=7&fromDueDate=2026-02-28
```

Ou via TMS: `POST /uown/tms/moveDueDatesByDays`

### Dados Registrados

| Campo | Descricao |
|-------|-----------|
| `movedFromDueDate` | Data original |
| `movedByDays` | Quantidade de dias (positivo = adiar) |
| `adjustmentType` | Tipo (SCHEDULE_SHIFT, etc.) |
| `agentUsername` | Quem fez |

### Restricoes

- Apenas pode ajustar recebiveis com data passada
- Todas as parcelas futuras sao deslocadas pelo mesmo numero de dias

### O Que Verificar

- Recebiveis com datas atualizadas
- Relatorio de due date moves (sweep `generateDueDateMovesReport`)

---

## 59. Alteracao de Valor de Aprovacao (Approval Amount Override)

### O Que e

Permite que administradores alterem o valor de aprovacao de credito de um lead apos o underwriting.

### Para Que Serve

Quando o valor aprovado pelo UW nao e adequado (muito alto ou muito baixo), um admin pode fazer override manual com justificativa.

### Pre-requisitos

| Condicao | Obrigatorio |
|----------|-------------|
| Valor de aprovacao nao nulo | Sim |
| Valor <= limite maximo por client type | Sim (default: $5.000) |
| UW data existente no lead | Sim |
| Lead status `UW_APPROVED` ou `CONTRACT_CREATED` | Sim |

### Limite Maximo por Client Type

Configuravel via `max.approval.amount.{ClientType}` (ex: `max.approval.amount.RETAIL`). Default geral: $5.000.

### O Que Acontece na Alteracao

1. **UW Response atualizado:** `creditLimit` muda para novo valor, `decision = "ACCEPT"`, adverse reasons limpos
2. **Dados antigos preservados:** UW data anterior salvo nas notas do lead como "Old UW data [JSON]"
3. **maxApprovalAmount:** Atualizado apenas se novo valor > valor atual
4. **Alerta criado** com valores antigo/novo e comentario do admin
5. **LeadModification registrado** com tipo `APPROVAL_AMOUNT_CHANGE`

### Como Disparar

```
POST /uown/los/overrideApprovalAmount
Body: LeadApprovalAmountOverrideRequest { leadPk, approvalAmount, comment }
```

---

## 60. Lease Adicional (Add Lease)

### O Que e

Permite que um cliente adicione um novo lease usando o credito remanescente de um lease previamente financiado.

### Para Que Serve

Clientes com credito remanescente (open-to-buy) podem financiar produtos adicionais sem precisar de nova aplicacao completa.

### Pre-requisitos

| Condicao | Obrigatorio |
|----------|-------------|
| Lead original com status `FUNDED` (configuravel) | Sim |
| Credito remanescente disponivel (`openToBuy > 0`) | Sim |
| ApplicationRequest recuperavel do lead original | Sim |

**Config:** `com.uownleasing.svc.service.AddLeaseService.valid.statuses.for.add.lease` (default: `"FUNDED"`)

### Como Funciona

1. **Valida status** do lead original
2. **Recupera ApplicationRequest** cached do lead original
3. **Limpa dados** de invoice e itens anteriores do request
4. **Configura vendor skips** (para evitar checks redundantes):
   - `skip.sentilink`: false (default -- executa Sentilink novamente)
   - `skip.neustar`: true (default -- pula Neustar)
   - `skip.seon`: true (default -- pula SEON)
   - `skip.lexisnexis`: true (default -- pula LexisNexis)
5. **Cria nova aplicacao** via `SendApplicationService`
6. **Se aprovado:**
   - Novo lead recebe `refLeadPk` apontando para lead original
   - Lead original marcado com `addedSecondLease = TRUE`
   - Activity logs criados em ambos os leads

### Como Disparar

```
POST /uown/los/addLease
```

---

## 68. Ajuste de Data do Primeiro Pagamento (First Payment Due Date)

### O Que e

Logica que garante que a data do primeiro pagamento (FPD) esteja sempre a uma distancia minima no futuro, ajustando automaticamente quando necessario.

### Para Que Serve

Evita que recebiveis sejam criados com datas de vencimento ja passadas ou muito proximas, o que causaria inadimplencia imediata.

### Regra de Ajuste

1. A FPD deve ser pelo menos **N dias no futuro** (config: `difference.in.days.between.first.receivable.next.pay.date`, default: 3)
2. Se a FPD nao atender ao minimo, e empurrada para a **proxima data de pagamento** baseada na frequencia (do emprego ou da frequencia de pagamento)
3. O ajuste e **recursivo** -- repete ate encontrar uma data valida no futuro
4. Contas SVC possuem config separada para o intervalo minimo

### Impacto

- Afeta criacao de recebiveis tanto no LOS quanto no SVC
- Garante que o primeiro pagamento sempre caia em data futura valida

---

## 70. Realocacao de Pagamento (Payment Reallocation)

### O Que e

Funcionalidade do portal Servicing que permite mover o valor parcialmente pago de um recebivel para outro recebivel elegivel da mesma conta.

### Para Que Serve

Corrigir alocacoes incorretas sem precisar reverter e re-postar pagamentos. Util quando um pagamento foi alocado no recebivel errado.

### Regras de Validacao

| Regra | Detalhe |
|-------|---------|
| Valor maximo | `amount <= partialPaymentAmount` do recebivel de origem |
| Mesmo tipo | Recebivel destino deve ter o mesmo `receivableType` do recebivel de origem |
| Nao pode ser PAID_IN_FULL | Recebiveis com `allocationStatus = PAID_IN_FULL` nao podem ser destino |
| Nao pode ser o mesmo | Recebivel de origem nao pode ser o mesmo que o destino |
| Valor > 0 | O valor realocado deve ser maior que zero |
| Comentario obrigatorio | Requer explicacao (max 500 caracteres) |

### Permissao

Requer `reallocate_receivable` no modelo de permissoes do Servicing.

---

## 71. Reset Default Schedule (KORNERSTONE)

### O Que e

Funcionalidade exclusiva para contas Kornerstone (`company = 'KORNERSTONE'`) que permite reiniciar o cronograma de pagamentos para o padrao configurado.

### Para Que Serve

Restaura os parametros padrao do cronograma quando modificacoes anteriores (mudanca de frequencia, movimentacao de due dates) tornaram o cronograma irregular.

### Disponibilidade

Aparece no portal Servicing apenas quando `company === 'KORNERSTONE'` — completamente oculto para contas UOWN.

---

## 72. Atribuicao de Agente no Modification Report (`agent_username`)

### O Que e

Toda mudanca de status de lead (`LEAD_STATUS_CHANGE`) e registrada em `uown_lead_modifications`. A coluna `agent_username` (UI "Agent Name" em `/modificationReport`, endpoint `POST /uown/los/getModifiedLeads`) deve identificar o agente humano que disparou a acao — ou `SYSTEM` **exclusivamente** quando a acao foi disparada por automacao de backend sem ator humano.

### Regra

| Caso | `agent_username` esperado |
|------|---------------------------|
| Agente humano clica acao no portal (ex: "Set to Expired", "Change to Signed") | username real do agente (ex: `jmendes.gow`) |
| Callback de webhook GowSign/SignWell (`CONTRACT_CREATED → SIGNED`, `SIGNED → SIGNED` re-sign) | `SYSTEM` (correto — sem sessao de usuario no contexto HTTP) |
| Sweep/scheduler | `SYSTEM` (correto) |

- A identidade do agente vem de um **header HTTP `username`** (NAO de JWT), lido por `RequestFilter.java`. `ChangeLeadStatusService` e o **unico** criador de registros `LEAD_STATUS_CHANGE`.
- `ThreadAttributes.getUsername()` retorna `"SYSTEM"` quando o header esta em branco. Chamada de API direta a `changeLeadStatus` **sem** o header `username` grava `SYSTEM` — isto e gap de simulacao de teste, NAO bug de backend.

### Implicacao para testes

Acao de status humana DEVE ser exercida via browser (regra inviolavel #14): a SPA do portal envia o header `username`. Assercao: `agent_username === '<agente>'` E `!== 'SYSTEM'`, com guard negativo (nenhuma row SYSTEM para o lead fresh).

### Historico do bug (#1315, corrigido R1.53.0)

Pre-fix, um webhook outbound corrompia o `ThreadLocal` ANTES de `agent_username` ser lido → username em branco → `SYSTEM` gravado para acoes humanas reais. Fix (MR svc!1464 captura `agentName` no inicio do metodo; svc!1470 faz save/restore do `ThreadAttributes` ao redor do webhook). Confirmado em qa2 + codigo-fonte 2026-06-18.

---


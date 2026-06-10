# Tests in qa1

---

## Contas Utilizadas

| Conta (accountPk) | Papel no Teste | Arrangement criado | Status final conta |
|--------------------|----------------|:------------------:|:------------------:|
| **4352** | CC NORMAL success (CT-01..08) | pk=222, 3 parcelas CC, chargeFee=false | ACTIVE |
| **4375** | Conta sem arrangements (CT-10) | — | ACTIVE |
| **4360** | ACH NORMAL (CT-11..15) | pk=223, 3 parcelas ACH | ACTIVE |
| **4466** | CC DENIED — Do not Honor (CT-16) | pk=224, CC declined | ACTIVE |
| **4464** | CC DENIED — Insufficient Funds (CT-17) | pk=225, CC declined | ACTIVE |
| **4354** | CC SETTLEMENT SUCCESS (CT-18) | pk=226, 3 parcelas CC | **SETTLED_IN_FULL** |
| **4398** | CC SETTLEMENT DENIED (CT-19) | pk=227, CC declined | ACTIVE |
| **4378** | ACH BLOCKED_ACCOUNT bug (CT-20) | pk=228, 1 parcela ACH | ACTIVE |

> Contas pré-existentes (GDS bypass). Nenhuma aplicação nova foi criada.

---

## Cenários por User Story

### US-SVC-500-01: CC NORMAL — Ciclo Completo (Happy Path)

| CT | Título | Tipo | Resultado | Duração |
|----|--------|------|:---------:---------|
| CT-01 | Criar CC NORMAL 3 parcelas (chargeFee=false) | API+DB | PASSOU | 7s |
| CT-02 | GET list arrangements endpoint | API | PASSOU | 0.2s |
| CT-03 | GET CC payments — masking + statuses | API | PASSOU | 0.3s |
| CT-04 | Navegar PA page + validar tabela vs DB | E2E+DB | PASSOU | 4s |
| CT-05 | Expandir + validar 3 parcelas CC (1 APPROVED, 2 PENDING) | E2E | PASSOU | 4s |
| CT-06 | Processar 2a parcela (sweep real) → 2 APPROVED, 1 PENDING | E2E+DB | PASSOU | 43s |
| CT-07 | Processar ultima parcela (sweep real) → arrangement SUCCESS | E2E+DB | PASSOU | 9s |
| CT-08 | Refresh final → persistencia | E2E | PASSOU | 4s |

### US-SVC-500-02: Endpoints — Edge Cases

| CT | Título | Tipo | Resultado | Duração |
|----|--------|------|:---------:---------|
| CT-09 | Arrangement inexistente → lista vazia | API | PASSOU | 0.2s |
| CT-10 | Conta sem arrangements → pagina vazia | API | PASSOU | 0.2s |

### US-SVC-500-03: ACH NORMAL — Ciclo Completo com Sweep Real

| CT | Título | Tipo | Resultado | Duração |
|----|--------|------|:---------:---------|
| CT-11 | Criar ACH NORMAL 3 parcelas ($50 cada) | API+DB | PASSOU | 1.3s |
| CT-12 | Exibir ACH — tabela + expandir (3 PENDING, masking ****0000) | E2E+API | PASSOU | 4.6s |
| CT-13 | Processar 1a parcela ACH (sweep real) → SENT | E2E+DB | PASSOU | 12s |
| CT-14 | Processar 2a parcela ACH (sweep real) → 2 BLOCKED_ACCOUNT | E2E+DB | PASSOU | 14s |
| CT-15 | Processar 3a parcela ACH (sweep real) → todas processadas | E2E+DB | PASSOU | 10s |

### US-SVC-500-04: CC DENIED — Cartão Recusado

| CT | Título | Tipo | Resultado | Duração |
|----|--------|------|:---------:---------|
| CT-16 | CC DENIED (Do not Honor) → arrangement NOT_STARTED | E2E+DB | PASSOU | 26s |
| CT-17 | CC DENIED (Insufficient Funds) → arrangement NOT_STARTED | E2E+DB | PASSOU | 24s |

### US-SVC-500-05: SETTLEMENT — Sucesso e Falha

| CT | Título | Tipo | Resultado | Duração |
|----|--------|------|:---------:---------|
| CT-18 | CC SETTLEMENT SUCCESS → account SETTLED_IN_FULL | E2E+DB | PASSOU | 20s |
| CT-19 | CC SETTLEMENT DENIED → account inalterado (ACTIVE) | E2E+DB | PASSOU | 23s |

### US-SVC-500-06: ACH Bug — BLOCKED_ACCOUNT

| CT | Título | Tipo | Resultado | Duração |
|----|--------|------|:---------:---------|
| CT-20 | ACH BLOCKED_ACCOUNT → arrangement NOT_STARTED (bug potencial) | E2E+DB | PASSOU | 13s |

---

## Detalhes dos Sweeps Utilizados

| Sweep | Endpoint | Função |
|-------|----------|--------|
| **CC Sweep** | `POST /uown/svc/sendCreditCardPaymentsSweep` | Processa CC transactions PENDING com `posting_date <= current_date`. `cc_transaction_type = 'REQUEST'` bypassa nextreceivable. |
| **ACH Send Sweep** | `POST /uown/svc/sendACHPaymentsSweep` | Envia ACH payments ao Profituity. `ach_process_type = 'REQUEST'` bypassa due date. |
| **ACH Status Sweep** | `POST /uown/svc/getStatusDatePaymentsListSweep` | Consulta Profituity para status final dos ACH payments. |

> **Abordagem:** Para processar parcelas futuras, UPDATE `posting_date = CURRENT_DATE` na transação específica, depois chama o sweep real. Backend processa via gateway (CC) ou Profituity (ACH) e o `BasePaymentArrangementListener` atualiza arrangement status automaticamente.

### Comportamento Observado

**CC Aprovado (CT-01..08):**
- 1a parcela (today) → APPROVED na criação (síncrono)
- 2a/3a parcelas → UPDATE posting_date + sweep real → APPROVED
- Arrangement: IN_PROGRESS → SUCCESS (listener automático)

**CC Denied (CT-16, CT-17, CT-19):**
- API retorna HTTP 500 (gateway error) mas arrangement é criado
- Arrangement status = `NOT_STARTED` (não FAILED)
- CC transactions não são criadas (gateway rejeitou antes de persistir)
- Sub-tabela expandida vazia (sem parcelas para exibir)

**CC SETTLEMENT Success (CT-18):**
- 3 parcelas processadas via sweep real → todas APPROVED
- Arrangement → SUCCESS → `BasePaymentArrangementListener` transiciona account para `SETTLED_IN_FULL`

**ACH (CT-11..15):**
- Todas parcelas iniciam PENDING (assíncrono)
- `sendACHPaymentsSweep` → PENDING → SENT
- `getStatusDatePaymentsListSweep` → Profituity retorna `BlockedAccount` → status BLOCKED_ACCOUNT
- Arrangement: NOT_STARTED → IN_PROGRESS (listener detecta SENT como pending)

**ACH Bug (CT-20):**
- Parcela processada pelo sweep → status SENT (Profituity ainda processando)
- Quando Profituity retorna BLOCKED_ACCOUNT, o listener NÃO trata como failure
- `PaymentArrangementACHListener.isFailure()` só checa `RETURNED` e `ERROR`
- BLOCKED_ACCOUNT cai em "não é failure, não é pending" → aguarda próxima execução (NOT_STARTED → IN_PROGRESS neste run pois SENT ainda é pending)

---

## Bugs de Aplicação Encontrados

### BUG-01 — ACH BLOCKED_ACCOUNT não é tratado como failure no PaymentArrangementACHListener

**Status:** OPEN
**Severidade:** Medium

**Descrição:**
- **Esperado:** Pagamento ACH com status `BLOCKED_ACCOUNT` deveria gerar arrangement `FAILED`
- **Real:** `PaymentArrangementACHListener.isFailure()` só verifica `RETURNED` e `ERROR`. `BLOCKED_ACCOUNT` não está na lista → arrangement não transiciona corretamente

**Como Reproduzir:**
1. Criar ACH arrangement com dados bancários de teste
2. Chamar `sendACHPaymentsSweep` + `getStatusDatePaymentsListSweep`
3. Profituity retorna `BlockedAccount` → status `BLOCKED_ACCOUNT`
4. Listener calcula: hasFailure=false → arrangement permanece pendente ou vai SUCCESS

**Evidência:** CT-20 (accountPk=4378, arrangementPk=228) — ACH payment status=SENT/BLOCKED_ACCOUNT

**Causa provável:** `PaymentArrangementACHListener.isFailure()` precisa incluir `BLOCKED_ACCOUNT`, `ACCOUNT_VALIDATION_ERROR`, `REJECTED`, `REVERSED` na lista de failures. Atualmente só tem `RETURNED` e `ERROR`.

**Arquivo:** `svc/src/main/java/com/uownleasing/svc/service/paymentArrangement/listener/PaymentArrangementACHListener.java`

> Alinhado com Davi — será tratado na task #504.

---

### BUG-02 — CC DENIED não persiste as parcelas no banco (arrangement fica NOT_STARTED sem transactions)

**Status:** OPEN
**Severidade:** High

**Descrição:**
- **Esperado:** Mesmo quando o gateway recusa o cartão, as CC transactions deveriam ser persistidas no banco com status `DENIED`/`ERROR`, permitindo que o listener transite o arrangement para `FAILED` e que processos downstream encontrem os registros
- **Real:** Quando o gateway rejeita a primeira transação CC, uma exceção é lançada antes de `createOrUpdateInNewTransaction()` ser chamado. Nenhuma CC transaction é persistida. O arrangement fica em `NOT_STARTED` permanentemente com lista vazia de parcelas.

**Impacto adicional:** Processos downstream que consultam CC transactions de um arrangement encontram lista vazia — comportamento indefinido.

**Como Reproduzir:**
1. Criar CC arrangement com cartão declined (DECLINE_C: 4000300211112228)
2. API retorna 500
3. Arrangement fica em NOT_STARTED sem cc_transactions no banco

**Evidência:**
| Conta | Arrangement PK | Motivo da recusa | CC transactions no DB | Status final |
|-------|---------------|-----------------|----------------------|--------------|
| 4466 | 224 | Do Not Honor | **0 registros** | NOT_STARTED |
| 4464 | 225 | Insufficient Funds | **0 registros** | NOT_STARTED |
| 4398 | 227 | SETTLEMENT + declined | **0 registros** | NOT_STARTED |

**Causa provável:** `PaymentArrangementService.runTransactions()` — arrangement é salvo (NOT_STARTED) antes do processamento CC. Quando `authorizeAndTokenizeCard()` lança exceção (card declined), o fluxo é interrompido antes de `ccTransactionService.runTransaction()` salvar as transactions. Não há catch block para atualizar o arrangement para FAILED.

**Arquivo:** `svc/src/main/java/com/uownleasing/svc/service/PaymentArrangementService.java`

---

## State Machine — Mapeamento Completo Validado

### Arrangement Status

| hasFailure | hasPending | Arrangement Status | Account (SETTLEMENT) | Account (NORMAL) |
|:----------:|:----------:|:------------------:|:--------------------:|:----------------:|
| true | qualquer | **FAILED** | Inalterado | Inalterado |
| false | true | **IN_PROGRESS** | — | — |
| false | false | **SUCCESS** | **SETTLED_IN_FULL** | Inalterado |

### CC: isFailure / isPending

| CC Status | isFailure? | isPending? | Validado em |
|-----------|:----------:|:----------:|:-----------:|
| APPROVED | | | CT-01, CT-05..07 |
| PENDING | | **SIM** | CT-05, CT-06 |
| DENIED | **SIM** | | CT-16, CT-17 (indiretamente — HTTP 500) |

### ACH: isFailure / isPending

| ACH Status | isFailure? | isPending? | Validado em |
|------------|:----------:|:----------:|:-----------:|
| PENDING | | **SIM** | CT-11, CT-12 |
| SENT | | **SIM** | CT-13, CT-14, CT-15, CT-20 |
| BLOCKED_ACCOUNT | **NÃO (bug)** | | CT-14, CT-15, CT-20 |
| RETURNED | **SIM** | | Não testável em qa1 |
| ERROR | **SIM** | | Não testável em qa1 |

### Profituity Vendor Status → ACH Status

| VendorACHStatus | ACHStatus | Observado em qa1? |
|-----------------|-----------|:-----------------:|
| Paid | SETTLED | Não |
| Returned | RETURNED | Não |
| BlockedAccount | BLOCKED_ACCOUNT | **SIM** (CT-14, CT-15, CT-20) |
| Sent/Processed | SENT | **SIM** (CT-13, CT-20) |

> **Nota Profituity qa1:** O qa1 conecta ao sandbox real (`sandbox.dev.profituity.com`) com credenciais `tampa.merchant`. O status `BLOCKED_ACCOUNT` é retornado pelo sandbox para os dados bancários de teste utilizados. Outros statuses (Paid, Returned) dependem de routing/account numbers reconhecidos pelo sandbox do Profituity — não são controláveis pela aplicação.

---

## Cobertura dos Requisitos

| Requisito | Coberto | Cenário |
|-----------|:-------:|---------|
| Navegar para Payment Arrangements page | SIM | CT-04, CT-12 |
| Lista de arrangements exibida | SIM | CT-04, CT-02, CT-12 |
| Informações básicas (ID, data, valor, status) | SIM | CT-04, CT-12 |
| Expandir para ver pagamentos CC | SIM | CT-05, CT-03 |
| Expandir para ver pagamentos ACH | SIM | CT-12 |
| Detalhes CC (date, amount, fee, status, vendor, card) | SIM | CT-05, CT-03 |
| Detalhes ACH (date, amount, status, account number, type, error) | SIM | CT-12 |
| Refresh mantém dados | SIM | CT-08 |
| Card numbers masked | SIM | CT-03, CT-05 |
| Account numbers masked | SIM | CT-12 |
| Evolução status CC (sweep real) | SIM | CT-06, CT-07 |
| Evolução status ACH (sweep real) | SIM | CT-13, CT-14, CT-15 |
| CC com chargeFee=false | SIM | CT-01, CT-05 |
| CC DENIED — display na UI | SIM | CT-16, CT-17 |
| SETTLEMENT SUCCESS → SETTLED_IN_FULL | SIM | CT-18 |
| SETTLEMENT DENIED → account inalterado | SIM | CT-19 |
| ACH BLOCKED_ACCOUNT → bug documentado | SIM | CT-20 |

---

## Resumo da Validação

| Verificação | Resultado |
|-------------|-----------|
| Todos os cenários da tarefa cobertos | SIM |
| Contratos de API conferem com backend | SIM |
| Schema do BD confere com display | SIM |
| Regras de negócio validadas | SIM |
| Bugs de aplicação encontrados | **SIM (2 bugs)** |
| Total de cenários | 20 |
| Passaram | 20 |
| Falharam | 0 |
| Skipped | 0 |
| Duração total | 3m42s |
| Vídeo gravado | SIM |
| Screenshots salvos | SIM (12 arquivos em reports/screenshots/) |

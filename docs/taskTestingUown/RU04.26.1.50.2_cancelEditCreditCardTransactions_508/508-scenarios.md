# Cenários de Teste — #508 Cancel/Edit CC Transactions

> **Task:** New endpoint to cancel/update CC transactions  
> **Milestone:** RU04.26.1.50.2 (Hotfix)  
> **Ambiente:** stg  
> **Merchants:** KS3015 (5th Ave Furniture NY — Kornerstone) · OW90218-0001 (Tire Agent)  
> **API Keys:** `U0wn_Kornerstone_012c` (KS) · `U0wn_tireAgent_G4eDIH` (TA)

---

## Pré-requisitos (Setup)

Para cada merchant, criar **2 contas ACTIVE** via API (sendApplication → submitApplication) com CC payment PENDING:

| ID | Merchant | Conta | Finalidade |
|----|----------|-------|------------|
| SETUP-KS-01 | KS5936 | Conta A (Kornerstone) | Cenários de edição/cancelamento UI + API |
| SETUP-KS-02 | KS5936 | Conta B (Kornerstone) | Cenários de validação negativa |
| SETUP-PP-01 | PP00001-0001 | Conta C (Pay Possible) | Cenários de edição/cancelamento UI + API |
| SETUP-PP-02 | PP00001-0001 | Conta D (Pay Possible) | Cenários de validação negativa |

**Pagamento CC via UI (Servicing):**
- Fazer pagamento CC com `postingDate` futura (ex: +7 dias) para garantir status PENDING
- Usar TEST_CARDS.VISA_APPROVED (Mastercard 5146315000000055, CVV 998)
- Cada conta precisa de pelo menos **2 transações PENDING** e **1 transação APPROVED** (para cenários de status)

---

## Grupo 1 — Edição de CC Transaction via UI (Servicing)

### CT-UI-01: Editar posting date de transação PENDING via modal
**Tipo:** E2E (UI + DB)  
**Merchant:** KS5936 (Conta A)

**Steps:**
1. Login no Servicing → navegar para Credit Card History da conta A
2. Localizar transação PENDING na tabela
3. Clicar no ícone de edição (lápis) → modal "Edit Pending Credit Card Payment" abre
4. Verificar campos readonly: Reference # (= CC TX PK), Created Time
5. Alterar **Posting Date** para data futura válida (hoje + 14 dias)
6. Manter amount e comment inalterados
7. Clicar **SAVE**

**Validações:**
- Toast: "Credit Card Payment Updated Successfully"
- Modal fecha
- Tabela atualiza com novo posting date
- **DB:** `uown_sv_credit_card_transaction` → `posting_date` atualizado para nova data
- **DB Activity Log:** `uown_sv_activity_log` contém "Updated Credit Card Transaction: pk=X, postingDate=NOVA_DATA, amount=$Y, status=PENDING, comment=Z"

---

### CT-UI-02: Editar amount de transação PENDING via modal
**Tipo:** E2E (UI + DB)  
**Merchant:** PP00001-0001 (Conta C)

**Steps:**
1. Login no Servicing → navegar para Credit Card History da conta C
2. Localizar transação PENDING na tabela → anotar amount original
3. Clicar no ícone de edição (lápis)
4. Alterar **Amount** para valor diferente (ex: $50.00 → $75.50)
5. Preencher **Comment** com texto de teste ("QA: amount edit test")
6. Clicar **SAVE**

**Validações:**
- Toast: "Credit Card Payment Updated Successfully"
- Tabela exibe novo valor na coluna "Captured Amount"
- **DB:** `amount` atualizado para 75.50
- **DB:** `comment` atualizado para "QA: amount edit test"
- **DB Activity Log:** mensagem contém "amount=$75.5" e "comment=QA: amount edit test"

---

### CT-UI-03: Editar comment de transação PENDING via modal
**Tipo:** E2E (UI + DB)  
**Merchant:** KS5936 (Conta A)

**Steps:**
1. Navegar para Credit Card History da conta A
2. Abrir modal de edição para transação PENDING
3. Alterar apenas **Comment** para "QA comment update test — task #508"
4. Clicar **SAVE**

**Validações:**
- Toast success
- **DB:** `comment` atualizado
- **DB Activity Log:** mensagem contém novo comment
- Coluna "Comments" na tabela exibe novo valor

---

### CT-UI-04: Cancelar transação PENDING via terceiro botão do modal
**Tipo:** E2E (UI + DB)  
**Merchant:** KS5936 (Conta A)

**Steps:**
1. Navegar para Credit Card History da conta A
2. Anotar PK da transação PENDING a cancelar e seu amount
3. Abrir modal de edição
4. Preencher **Comment** com "QA: cancelled via UI"
5. Clicar no **terceiro botão** (Cancel/Remove)

**Validações:**
- Toast: "Credit Card Payment Updated Successfully"
- Modal fecha
- Na tabela, a transação aparece com:
  - Cor laranja (#ef8a00)
  - Texto riscado (strikethrough/line-through)
  - Status = "CANCELLED"
- Botão de edição (lápis) **não aparece** mais para esta transação
- **DB:** `status = 'CANCELLED'`
- **DB:** `comment = 'QA: cancelled via UI'`
- **DB Activity Log:** mensagem contém "status=CANCELLED"

---

### CT-UI-05: Cancelar transação PENDING via UI — merchant Pay Possible
**Tipo:** E2E (UI + DB)  
**Merchant:** PP00001-0001 (Conta C)

**Steps:**
1. Navegar para Credit Card History da conta C
2. Abrir modal de edição para transação PENDING
3. Preencher **Comment** com "QA: PP cancel test"
4. Clicar no terceiro botão (Cancel/Remove)

**Validações:**
- Toast success
- Transação aparece CANCELLED com estilo visual correto na tabela
- **DB:** status = CANCELLED
- **DB Activity Log:** log registrado com "status=CANCELLED"

---

### CT-UI-06: Verificar que botão de edição NÃO aparece para transações não-PENDING
**Tipo:** E2E (UI only)  
**Merchant:** KS5936 (Conta A)

**Steps:**
1. Navegar para Credit Card History da conta A
2. Verificar transações com status APPROVED, CANCELLED (criada no CT-UI-04)
3. Para cada uma: confirmar que ícone de edição (lápis) **não é exibido**

**Validações:**
- Coluna "Edit" vazia para transações APPROVED
- Coluna "Edit" vazia para transações CANCELLED
- Coluna "Pending Payment?" = "No" para APPROVED e CANCELLED
- Coluna "Pending Payment?" = "Yes" apenas para PENDING

---

### CT-UI-07: Validar campos readonly e valores iniciais do modal
**Tipo:** E2E (UI only)  
**Merchant:** PP00001-0001 (Conta C)

**Steps:**
1. Navegar para Credit Card History da conta C
2. Abrir modal de edição para transação PENDING
3. Verificar:
   - Título do modal: "Edit Pending Credit Card Payment"
   - Campo "Reference #" é readonly e contém o PK da transação
   - Campo "Created Time" é readonly e contém data de criação formatada
   - Campo "Posting Date" é editável (type=date), min=hoje
   - Campo "Amount" é editável (type=currency)
   - Campo "Comment" é editável (textarea)
4. Fechar modal sem salvar (botão X ou Close)

**Validações:**
- Todos os campos exibem valores corretos pré-populados
- Campos readonly não são editáveis
- Após fechar, nenhuma alteração foi persistida no DB

---

## Grupo 2 — Edição/Cancelamento via API

### CT-API-01: Editar transação PENDING — alterar amount, postingDate, comment
**Tipo:** API + DB  
**Merchant:** KS5936 (Conta B)

**Request:**
```
PUT /uown/svc/payments/credit-cards/{ccTransactionPk}
Content-Type: application/json

{
  "amount": 99.99,
  "postingDate": "2026-04-21",
  "comment": "QA API edit test",
  "status": "PENDING"
}
```

**Validações:**
- Response: HTTP 200 (void — sem body)
- **DB:** `amount = 99.99`, `posting_date = 2026-04-21`, `comment = 'QA API edit test'`, `status = 'PENDING'`
- **DB Activity Log:** "Updated Credit Card Transaction: pk=X, postingDate=2026-04-21, amount=$99.99, status=PENDING, comment=QA API edit test"

---

### CT-API-02: Cancelar transação PENDING via API — status CANCELLED
**Tipo:** API + DB  
**Merchant:** PP00001-0001 (Conta D)

**Request:**
```
PUT /uown/svc/payments/credit-cards/{ccTransactionPk}
{
  "amount": <amount_original>,
  "postingDate": "<posting_date_original>",
  "comment": "QA API cancel test",
  "status": "CANCELLED"
}
```

**Validações:**
- Response: HTTP 200
- **DB:** `status = 'CANCELLED'`, `comment = 'QA API cancel test'`
- **DB Activity Log:** mensagem contém "status=CANCELLED"
- **UI:** Ao navegar para Credit Card History, transação aparece laranja com strikethrough

---

### CT-API-03: Editar apenas comment (mantendo amount e postingDate originais)
**Tipo:** API + DB  
**Merchant:** KS5936 (Conta B)

**Request:**
```
PUT /uown/svc/payments/credit-cards/{ccTransactionPk}
{
  "amount": <amount_original>,
  "postingDate": "<posting_date_original>",
  "comment": "QA updated comment only",
  "status": "PENDING"
}
```

**Validações:**
- HTTP 200
- **DB:** apenas `comment` alterado, demais campos mantidos
- **DB Activity Log:** registrado

---

### CT-API-04: Enviar comment vazio (default "")
**Tipo:** API + DB  
**Merchant:** KS5936 (Conta B)

**Request:**
```
PUT /uown/svc/payments/credit-cards/{ccTransactionPk}
{
  "amount": <amount>,
  "postingDate": "<date>",
  "status": "PENDING"
}
```
(Sem campo `comment` no body — Java record faz default para "")

**Validações:**
- HTTP 200
- **DB:** `comment = ''` (string vazia)
- **DB Activity Log:** "comment=" (vazio)

---

### CT-API-05: Validar body completo da API — todos os campos
**Tipo:** API  
**Merchant:** PP00001-0001 (Conta D)

**Objetivo:** Confirmar que a API aceita EXATAMENTE os 4 campos do DTO e nenhum campo adicional afeta o resultado.

**Request com campos extras:**
```
PUT /uown/svc/payments/credit-cards/{ccTransactionPk}
{
  "amount": 50.00,
  "postingDate": "2026-04-21",
  "comment": "QA body test",
  "status": "PENDING",
  "accountPk": 9999,
  "extraField": "should be ignored"
}
```

**Validações:**
- HTTP 200 (campos extras são ignorados pelo Jackson)
- **DB:** apenas amount, postingDate, comment, status refletem o que foi enviado
- accountPk da transação **não muda** (não faz parte do DTO)

---

## Grupo 3 — Validações Negativas (API)

### CT-NEG-01: Tentar editar transação APPROVED → erro
**Tipo:** API  
**Merchant:** KS5936 (Conta B — usar transação APPROVED)

**Request:**
```
PUT /uown/svc/payments/credit-cards/{approvedTxPk}
{
  "amount": 10.00,
  "postingDate": "2026-04-21",
  "comment": "should fail",
  "status": "PENDING"
}
```

**Validações:**
- HTTP 400/500 com mensagem: "Transaction X cannot be updated because it's current status is APPROVED"
- **DB:** transação inalterada
- **DB Activity Log:** nenhum novo log criado

---

### CT-NEG-02: Tentar editar transação CANCELLED → erro
**Tipo:** API  
**Merchant:** PP00001-0001 (usar transação cancelada no CT-API-02)

**Request:**
```
PUT /uown/svc/payments/credit-cards/{cancelledTxPk}
{
  "amount": 10.00,
  "postingDate": "2026-04-21",
  "comment": "should fail",
  "status": "PENDING"
}
```

**Validações:**
- Erro com mensagem: "Transaction X cannot be updated because it's current status is CANCELLED"
- **DB:** transação inalterada

---

### CT-NEG-03: Enviar status inválido (ex: APPROVED, DENIED, SUCCESS)
**Tipo:** API  
**Merchant:** KS5936 (Conta B — transação PENDING)

**Request:**
```
PUT /uown/svc/payments/credit-cards/{pendingTxPk}
{
  "amount": 10.00,
  "postingDate": "2026-04-21",
  "comment": "invalid status",
  "status": "APPROVED"
}
```

**Validações:**
- Erro com mensagem: "Status must be PENDING or CANCELLED. Given: APPROVED"
- **DB:** transação inalterada
- Repetir para status "DENIED", "SUCCESS", "ERROR" (todos devem falhar)

---

### CT-NEG-04: Enviar amount zero ou negativo
**Tipo:** API  
**Merchant:** PP00001-0001 (Conta D — transação PENDING)

**Requests:**
1. `"amount": 0` → HTTP 400 (violação `@DecimalMin("0.0", inclusive=false)`)
2. `"amount": -5.00` → HTTP 400
3. `"amount": null` → HTTP 400 (violação `@NotNull`)

**Validações:**
- Todos retornam HTTP 400 (Bad Request) com mensagem de validação
- **DB:** transação inalterada

---

### CT-NEG-05: Enviar postingDate no passado
**Tipo:** API  
**Merchant:** KS5936 (Conta B — transação PENDING)

**Request:**
```
PUT /uown/svc/payments/credit-cards/{pendingTxPk}
{
  "amount": 10.00,
  "postingDate": "2025-01-01",
  "comment": "past date",
  "status": "PENDING"
}
```

**Validações:**
- HTTP 400 (violação `@FutureOrPresent`)
- **DB:** transação inalterada

---

### CT-NEG-06: Enviar postingDate null e status null
**Tipo:** API  
**Merchant:** PP00001-0001 (Conta D)

**Requests:**
1. `"postingDate": null` → HTTP 400 (`@NotNull`)
2. `"status": null` → HTTP 400 (`@NotNull`)
3. Body vazio `{}` → HTTP 400 (múltiplas violações)

**Validações:**
- Todos retornam HTTP 400

---

### CT-NEG-07: Enviar ccTransactionPk inexistente
**Tipo:** API  

**Request:**
```
PUT /uown/svc/payments/credit-cards/999999999
{
  "amount": 10.00,
  "postingDate": "2026-04-21",
  "comment": "non-existent",
  "status": "PENDING"
}
```

**Validações:**
- Erro com mensagem: "Credit card transaction 999999999 not found"

---

### CT-NEG-08: Enviar comment com mais de 500 caracteres
**Tipo:** API  
**Merchant:** KS5936 (Conta B — transação PENDING)

**Request:**
```
PUT /uown/svc/payments/credit-cards/{pendingTxPk}
{
  "amount": 10.00,
  "postingDate": "2026-04-21",
  "comment": "<string com 501+ chars>",
  "status": "PENDING"
}
```

**Validações:**
- HTTP 400 (violação `@Size(max=500)`)
- **DB:** transação inalterada

---

## Grupo 4 — Validações Negativas (UI)

### CT-UI-NEG-01: Tentar salvar com posting date no passado via modal
**Tipo:** E2E (UI)  
**Merchant:** KS5936 (Conta A — transação PENDING restante)

**Steps:**
1. Abrir modal de edição
2. Alterar Posting Date para data no passado
3. Preencher Comment (required pelo formik)
4. Clicar SAVE

**Validações:**
- Toast: "Please enter a valid date." (validação frontend com moment.js: `isAfter(yesterdaysDate)`)
- Modal permanece aberta
- **DB:** transação inalterada

---

### CT-UI-NEG-02: Tentar salvar sem preencher comment (required pelo frontend)
**Tipo:** E2E (UI)  
**Merchant:** PP00001-0001 (Conta C — transação PENDING restante)

**Steps:**
1. Abrir modal de edição
2. Limpar campo Comment (deixar vazio)
3. Clicar SAVE

**Validações:**
- Mensagem de validação do Formik: "Comment is required."
- Requisição NÃO é enviada ao backend
- **DB:** transação inalterada

---

## Grupo 5 — Edição seguida de cancelamento e reflexo na UI

### CT-FLOW-01: Editar transação → validar na UI → cancelar → validar remoção visual
**Tipo:** E2E (UI + API + DB)  
**Merchant:** PP00001-0001 (Conta C)

**Steps:**
1. Navegar para CC History da conta C
2. Localizar transação PENDING → anotar PK, amount, postingDate
3. **Editar via modal:** alterar amount para $33.33, comment para "QA flow test step 1"
4. Clicar SAVE → validar toast success
5. **Verificar na tabela:** Captured Amount = $33.33, Comments = "QA flow test step 1"
6. **Verificar no DB:** amount=33.33, comment="QA flow test step 1", status=PENDING
7. **Verificar Activity Log:** log de update registrado
8. **Abrir modal novamente** para mesma transação → verificar valores pré-populados atualizados
9. Preencher Comment com "QA flow test step 2 — cancelling"
10. Clicar no **terceiro botão** (Cancel)
11. **Verificar na tabela:** transação laranja + strikethrough, status CANCELLED
12. **Verificar que lápis não aparece** mais
13. **Verificar no DB:** status=CANCELLED, comment="QA flow test step 2 — cancelling"
14. **Verificar Activity Log:** segundo log com status=CANCELLED

**Validações:**
- 2 activity logs criados (1 edit + 1 cancel)
- Transição visual PENDING → CANCELLED correta na tabela

---

## Grupo 6 — Reflexo do cancelamento no rating da conta

### CT-RATING-01: Cancelar CC PENDING e verificar recálculo de rating
**Tipo:** API + DB  
**Merchant:** KS5936 (Conta B)

**Steps:**
1. Capturar rating atual da conta via `SELECT rating FROM uown_sv_account WHERE pk = $1`
2. Cancelar transação PENDING via API
3. Aguardar 2s → verificar se `updateRatingForAccount` foi chamado

**Validações:**
- **DB:** `uown_sv_account.rating` pode ter sido recalculado (depende do backend bug conhecido — ver MEMORY)
- Activity log registrado
- Transação com status CANCELLED no DB

> **Nota:** Bug conhecido no backend (`AccountFinancialInfoService.updateRatingLetterAndAutoPay`) pode impedir atualização do rating. Documentar resultado observado.

---

## Grupo 6 — Execução Automática (Posting Date = Today)

### CT-EXEC-01: Update posting_date para today → transação é auto-executada
**Tipo:** API + DB
**Merchant:** KS3015 (Conta A)

**Steps:**
1. Localizar transação PENDING via DB
2. Enviar `PUT /payments/credit-cards/{pk}` com `postingDate = today`, `status = PENDING`
3. Aguardar 5s para processamento
4. Verificar no DB que `status` mudou de PENDING para APPROVED/DENIED/ERROR

**Validações:**
- Backend chama `shouldRunToday()` → retorna `true` → invoca `runTransaction(info, false)`
- **DB:** `uown_sv_credit_card_transaction.status` ≠ 'PENDING' (APPROVED se CC auth ok)
- **DB Activity Log:** log de execução registrado

> **Nota:** Se a transação permanece PENDING, pode ser timezone mismatch (backend UTC vs local) ou CC gateway não disponível em stg.

---

### CT-EXEC-02: Update posting_date para today com arrangement → arrangement status atualiza
**Tipo:** API + DB
**Merchant:** KS3015

**Steps:**
1. Localizar transação PENDING que tenha `payment_arrangement_pk IS NOT NULL`
2. Capturar estado do arrangement antes (status, start_date, end_date, is_active)
3. Enviar `PUT /payments/credit-cards/{pk}` com `postingDate = today`
4. Aguardar 8s para processamento CC + refresh do arrangement
5. Verificar que `paymentArrangementService.refreshFromTransactions()` atualizou o arrangement

**Validações:**
- **DB:** `uown_sv_credit_card_transaction.status` atualizado (APPROVED/DENIED)
- **DB:** `uown_sv_payment_arrangement` status/is_active pode mudar (ex: NOT_STARTED → SUCCESS se single-payment)
- **DB Activity Log:** log registrado

> **Nota:** Este cenário depende de existir uma transação PENDING vinculada a um arrangement. Se nenhuma for encontrada, o teste é skipped.

---

## Resumo de Cobertura

| Grupo | Cenários | Tipo | Cobertura |
|-------|----------|------|-----------|
| 1 — UI Edit/Cancel | CT-UI-01 a CT-UI-07 | E2E | Edição posting date, amount, comment; cancelamento; visual; readonly fields |
| 2 — API Edit/Cancel | CT-API-01 a CT-API-05 | API+DB | Edição completa, cancelamento, comment vazio, body validation |
| 3 — Negativa API | CT-NEG-01 a CT-NEG-08 | API | Status errado, amount inválido, date passada, nulls, PK inexistente, comment overflow |
| 3B — Negativa API extra | CT-NEG-09 a CT-NEG-17 | API | Re-cancel, today boundary, decimals, formatos, PKs negativos, auth, special chars, HTTP methods |
| 3C — UI Reflects | CT-UI-REFLECT-01 | E2E+DB | Tabela reflete valores editados |
| 3D — Network | CT-NETWORK-01 a CT-NETWORK-02 | E2E | PUT enviado (não makeCreditCardPayment) |
| 3E — Rating | CT-RATING-01 a CT-RATING-02 | API+DB | Cancelamento recalcula (ou não) rating |
| 4 — Negativa UI | CT-UI-NEG-01 a CT-UI-NEG-02 | E2E | Date passada, comment required |
| 5 — Fluxo completo | CT-FLOW-01 | E2E+DB | Edit → verify → cancel → verify visual removal |
| 6 — Posting Date Execution | CT-EXEC-01 a CT-EXEC-02 | API+DB | Execução automática quando posting_date=today + arrangement update |

**Total: ~32 cenários** (7 UI + 5 API + 17 Negativa + 1 Reflect + 2 Network + 2 Rating + 2 Neg UI + 1 Fluxo + 2 Execução)

---

## Dados de Teste

### Cartão de Crédito
- **VISA_APPROVED:** 5146315000000055, CVV 998, Exp 12/2028 (Mastercard — ccType VISA)

### Merchants
| Merchant | Number | Username | Password | Tipo |
|----------|--------|----------|----------|------|
| 5th Ave Furniture NY | KS3015 | kornerstone | U0wn_Kornerstone_012c | Kornerstone |
| Tire Agent | OW90218-0001 | tireAgent | U0wn_tireAgent_G4eDIH | Online |

### Endpoint sob teste
```
PUT /uown/svc/payments/credit-cards/{ccTransactionPk}
Host: svc-stg.uownleasing.com
Header: x-api-key: <merchant_api_key>
Content-Type: application/json

Body (DTO): {
  "amount": BigDecimal (> 0, @NotNull),
  "comment": String (max 500, default ""),
  "postingDate": LocalDate ISO (YYYY-MM-DD, @FutureOrPresent, @NotNull),
  "status": CCTransactionStatus ("PENDING" | "CANCELLED", @NotNull)
}

Response: 200 OK (void — sem body)
```

### Endpoints auxiliares
- `GET /uown/svc/getCCTransactions/{accountPk}` — lista todas CC transactions
- `GET /uown/svc/getPendingCCTransactions/{accountPk}` — lista apenas PENDING

### DB Queries de validação
```sql
-- CC Transaction
SELECT * FROM uown_sv_credit_card_transaction WHERE pk = $1;

-- Activity Log (busca por CC TX PK na nota)
SELECT * FROM uown_sv_activity_log 
WHERE account_pk = $1 AND log_type = 'CREDIT_CARD'
AND notes LIKE '%pk=' || $2 || '%'
ORDER BY row_created_timestamp DESC LIMIT 1;

-- Account rating
SELECT rating, auto_pay FROM uown_sv_account WHERE pk = $1;
```

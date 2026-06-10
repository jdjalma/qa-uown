# Test Scenarios — Task #500
## UOWN | Servicing | Display Payment Arrangements In Servicing Portal
**Milestone:** RU03.26.1.50.0
**Data:** 2026-03-20
**Portal:** Servicing
**Referência:** Task #446 (payment-arrangement-state-machine) — código e padrões reutilizados
**Bug #446 corrigido:** `uown_sv_account.rating` agora é persistido corretamente após SETTLEMENT → SUCCESS

---

## Contexto da Feature

Exibição de Payment Arrangements no portal Servicing com tabela paginada e linhas expandíveis para visualizar pagamentos individuais (CC e ACH).

**Novos endpoints backend:**
- `GET /uown/svc/accounts/{accountPk}/payment-arrangements` — lista paginada de arrangements (Page<SvPaymentArrangement>)
- `GET /uown/svc/payment-arrangements/{paymentArrangementPk}/payments` — pagamentos do arrangement (PaymentArrangementPaymentsDto: `{ ach: [], cc: [] }`)

**Frontend:**
- Rota: `/payment-arrangement/{accountPk}`
- Menu: "Payment Arrangement" sob "Scheduled Payments" no Servicing dropdown
- Tabela principal: 8 colunas (Arrangement PK, Payment Type, Start Date, End Date, Total Amount, Status, Created At, Created By)
- Expandable rows: sub-tabelas separadas para CC (Payment PK, Date, Amount, Fee, Status, Vendor, Card) e ACH (Payment PK, Date, Amount, Status, Account Number, Type, Error)
- Permissão: `payment_arrangement` (access)
- Paginação server-side

**Comportamento CC (synchronous):**
- `postingDate = today` → processado imediatamente (APPROVED)
- `postingDate = futuro` → fica PENDING até sweep processar
- Em QA1, CC sweep está DISABLED → simular via DB (padrão #446)

**Masking:** `MaskUtils` aplica `****XXXX` para CC numbers e bank account numbers

---

## US-SVC-500-01: Exibição do Ciclo Completo de Payment Arrangement CC

**Como** agente do Servicing,
**Quero** visualizar um payment arrangement CC com 3 parcelas, acompanhando a evolução do status conforme cada parcela é paga,
**Para** monitorar o progresso dos arrangements e garantir que a exibição reflete o estado real do banco.

### Critérios de Aceite
- [ ] Criar arrangement CC com 3 parcelas via API (1 hoje + 2 futuras)
- [ ] Arrangement aparece na tabela com dados corretos (PK, tipo CC, valor total, status)
- [ ] Expandir mostra 3 parcelas CC com colunas corretas
- [ ] Primeira parcela (hoje) já está APPROVED — CC é síncrono
- [ ] Parcelas futuras estão PENDING
- [ ] Valores das colunas UI correspondem aos dados do DB
- [ ] Após processar 2ª parcela: UI reflete status atualizado (2 APPROVED, 1 PENDING)
- [ ] Após processar 3ª parcela: arrangement status = SUCCESS, 3/3 APPROVED
- [ ] Dados persistem após refresh da página

---

## US-SVC-500-02: Validação dos Endpoints de Display via API

**Como** QA,
**Quero** validar os novos endpoints GET de payment arrangements,
**Para** garantir que a API retorna dados corretos, paginados e com masking adequado.

### Critérios de Aceite
- [ ] GET arrangements retorna lista paginada com estrutura correta
- [ ] GET payments retorna CC e ACH separados
- [ ] CC numbers masked (****XXXX)
- [ ] Arrangement inexistente retorna listas vazias (não erro)
- [ ] Paginação respeita page/size

---

## Cenários de Teste

> **FLUXO SERIAL (test.describe.configure({ mode: 'serial' })):** CT-01 a CT-08 compartilham estado (arrangementPk, accountPk). Cada CT depende do anterior.
> **Conta de teste:** Usar conta ACTIVE sem arrangement ativo. Referência: padrão #446 com `existingAccountPks`.

---

### CT-01: [API + DB] Criar CC arrangement com 3 parcelas — validar persistência no banco

**Tipo:** API + DB
**Portal:** Servicing (API)
**Pré-condição:** Conta ACTIVE sem arrangement ativo

**Passos:**
1. Verificar que a conta está ACTIVE e sem arrangement ativo via DB
2. Criar CC arrangement via `POST /uown/svc/makeCreditCardPayments` com `buildCcArrangementBody`:
   - Parcela 1: `amount: 100, postingDate: today` (será processada imediatamente)
   - Parcela 2: `amount: 100, postingDate: today+7`
   - Parcela 3: `amount: 100, postingDate: today+14`
   - `arrangementType: 'NORMAL'`
3. Verificar response HTTP 200
4. Consultar DB: `uown_sv_payment_arrangement` — verificar registro criado
5. Consultar DB: `uown_sv_credit_card_transaction` — verificar 3 transações vinculadas ao arrangementPk

**Resultado esperado:**
- API retorna 200 com `paymentArrangement: true`
- DB: arrangement com `status = 'IN_PROGRESS'`, `is_active = true`, `arrangement_type = 'NORMAL'`, `payment_type = 'CC'`
- DB: 3 CC transactions com `payment_arrangement_pk = {arrangementPk}`
- 1ª transação: `status = 'APPROVED'` (posting_date = today → síncrono)
- 2ª e 3ª transações: `status = 'PENDING'` (posting_date futuro)

**Tags:** @regression @critical @qa1

---

### CT-02: [API] Listar arrangements via GET endpoint — validar estrutura da resposta

**Tipo:** API
**Pré-condição:** CT-01 executado (arrangement criado)

**Passos:**
1. Chamar `GET /uown/svc/accounts/{accountPk}/payment-arrangements?page=0&size=10`
2. Validar response HTTP 200
3. Validar estrutura: `{ content: [], totalElements, number, size }`
4. Encontrar o arrangement criado no CT-01 no `content[]`
5. Validar campos: pk, accountPk, arrangementType, paymentType, status, startDate, endDate, amount, username

**Resultado esperado:**
- HTTP 200
- `totalElements >= 1`
- Arrangement do CT-01 presente no `content[]` com dados corretos

**Tags:** @regression @critical @qa1

---

### CT-03: [API] Buscar pagamentos CC do arrangement via GET endpoint

**Tipo:** API
**Pré-condição:** CT-01 executado

**Passos:**
1. Chamar `GET /uown/svc/payment-arrangements/{arrangementPk}/payments`
2. Validar response HTTP 200
3. Validar que `cc[]` contém 3 transações e `ach[]` está vazio
4. Para cada CC payment validar campos: paymentPk, postingDate, amount, fee, status, vendor, card
5. Validar masking: campo `card` no formato `****XXXX` (últimos 4 dígitos)
6. Validar statuses: 1 APPROVED + 2 PENDING

**Resultado esperado:**
- `cc.length === 3`, `ach.length === 0`
- 1 CC payment com `status = 'APPROVED'`
- 2 CC payments com `status = 'PENDING'`
- Todos com `card` masked (****XXXX)
- `amount` e `fee` numéricos válidos

**Tags:** @regression @critical @qa1

---

### CT-04: [E2E + DB] Navegar para Payment Arrangement — validar tabela e dados vs DB

**Tipo:** E2E + DB
**Portal:** Servicing
**Pré-condição:** CT-01 executado

**Passos:**
1. Login no Servicing portal (storageState)
2. Navegar para conta → menu "Servicing" → "Scheduled Payments" → "Payment Arrangement"
3. Verificar que a página `/payment-arrangement/{accountPk}` carrega
4. Verificar que a tabela exibe o arrangement criado no CT-01
5. Validar colunas:
   - Arrangement PK = `{arrangementPk}` do CT-01
   - Payment Type = `CC`
   - Total Amount = `$300.00` (3 × $100)
   - Status = `IN_PROGRESS` (1 APPROVED + 2 PENDING)
6. Consultar DB e comparar: `amount`, `status`, `arrangement_type`, `payment_type`
7. Screenshot da tabela

**Resultado esperado:**
- Tabela carrega com arrangement visível
- Valores das colunas correspondem aos dados do DB
- Status correto: `IN_PROGRESS`

**Tags:** @regression @critical @qa1

---

### CT-05: [E2E] Expandir arrangement — validar 3 parcelas CC com status corretos

**Tipo:** E2E (UI)
**Portal:** Servicing
**Pré-condição:** CT-04 executado (página já carregada)

**Passos:**
1. Clicar no row do arrangement para expandir
2. Verificar que sub-tabela CC aparece com 3 rows
3. Verificar colunas visíveis: Payment PK, Date, Amount, Fee, Status, Vendor, Card
4. Verificar 1ª parcela (today): `status = 'APPROVED'`, `amount = $100.00`
5. Verificar 2ª parcela (today+7): `status = 'PENDING'`, `amount = $100.00`
6. Verificar 3ª parcela (today+14): `status = 'PENDING'`, `amount = $100.00`
7. Verificar que Card está masked: `****XXXX`
8. Screenshot das parcelas expandidas

**Resultado esperado:**
- Sub-tabela CC com 3 parcelas
- Status correto: 1 APPROVED, 2 PENDING
- Cards masked
- Amounts corretos ($100.00 cada)

**Tags:** @regression @critical @qa1

---

### CT-06: [E2E + DB] Processar 2ª parcela — validar atualização de status na UI

**Tipo:** E2E + DB
**Portal:** Servicing
**Pré-condição:** CT-05 executado, 2ª parcela em PENDING

**Passos:**
1. Simular processamento da 2ª parcela via DB (padrão #446):
   - `UPDATE uown_sv_credit_card_transaction SET posting_date = CURRENT_DATE WHERE pk = {txn2Pk}`
   - `simulateCcSweepForArrangement(arrangementPk)` → UPDATE status PENDING → APPROVED
   - `recalculateArrangementStatus(arrangementPk)` → arrangement permanece IN_PROGRESS
2. Verificar DB: 2 APPROVED, 1 PENDING
3. Refresh da página (`page.reload()`)
4. Verificar na tabela principal: arrangement status = `IN_PROGRESS`
5. Expandir row → verificar sub-tabela: 2 parcelas APPROVED, 1 PENDING
6. Screenshot

**Resultado esperado:**
- DB: 2/3 APPROVED, arrangement status = IN_PROGRESS
- UI após refresh: tabela mostra IN_PROGRESS
- Sub-tabela CC: 2 APPROVED + 1 PENDING

**Tags:** @regression @critical @qa1

---

### CT-07: [E2E + DB] Processar última parcela — validar arrangement SUCCESS e status final

**Tipo:** E2E + DB
**Portal:** Servicing
**Pré-condição:** CT-06 executado, 3ª parcela em PENDING

**Passos:**
1. Simular processamento da 3ª (última) parcela via DB:
   - `UPDATE uown_sv_credit_card_transaction SET posting_date = CURRENT_DATE WHERE pk = {txn3Pk}`
   - `simulateCcSweepForArrangement(arrangementPk)` → APPROVED
   - `recalculateArrangementStatus(arrangementPk)` → arrangement SUCCESS, is_active=false
2. Verificar DB: 3/3 APPROVED, arrangement `status = 'SUCCESS'`, `is_active = false`
3. Refresh da página
4. Verificar na tabela principal: arrangement status = `SUCCESS`
5. Expandir row → verificar sub-tabela: 3 parcelas APPROVED
6. Screenshot do estado final

**Resultado esperado:**
- DB: 3/3 APPROVED, arrangement SUCCESS, is_active=false
- UI: tabela mostra arrangement com `Status = SUCCESS`
- Sub-tabela CC: 3 × APPROVED
- Conta mantém status original (NORMAL arrangement não altera status da conta)

**Tags:** @regression @critical @qa1

---

### CT-08: [E2E] Refresh final — persistência dos dados após ciclo completo

**Tipo:** E2E (UI)
**Portal:** Servicing
**Pré-condição:** CT-07 executado

**Passos:**
1. Fazer refresh completo da página
2. Verificar que a tabela recarrega com o arrangement
3. Verificar status = SUCCESS na tabela
4. Expandir row → 3 parcelas APPROVED
5. Screenshot final

**Resultado esperado:**
- Dados 100% consistentes após refresh
- Arrangement SUCCESS, 3 parcelas APPROVED
- Nenhum erro de carregamento

**Tags:** @regression @qa1

---

### CT-09: [API] Arrangement inexistente retorna listas vazias

**Tipo:** API
**Pré-condição:** Nenhuma

**Passos:**
1. Chamar `GET /uown/svc/payment-arrangements/999999/payments` (PK inexistente)
2. Verificar response HTTP 200
3. Validar que `ach: []` e `cc: []`

**Resultado esperado:**
- HTTP 200 (não 404)
- `{ ach: [], cc: [] }`

**Tags:** @regression @qa1

---

### CT-10: [API] Conta sem arrangements retorna página vazia

**Tipo:** API
**Pré-condição:** Conta sem payment arrangements (usar qualquer conta ACTIVE sem histórico)

**Passos:**
1. Chamar `GET /uown/svc/accounts/{accountPkSemArrangement}/payment-arrangements?page=0&size=10`
2. Verificar response HTTP 200
3. Validar `content: []`, `totalElements: 0`

**Resultado esperado:**
- HTTP 200
- Página vazia sem erro

**Tags:** @regression @qa1

---

## Mapeamento de Cobertura

| CT | Cenário | Tipo | Cobertura |
|----|---------|------|-----------|
| CT-01 | Criar arrangement 3 parcelas + validar DB | API+DB | US-01: criação + persistência |
| CT-02 | GET list arrangements | API | US-02: endpoint list |
| CT-03 | GET CC payments detail | API | US-02: endpoint payments CC |
| CT-04 | Navegar + validar tabela vs DB | E2E+DB | US-01: exibição + dados corretos |
| CT-05 | Expandir → 3 parcelas + statuses | E2E | US-01: parcelas + status |
| CT-06 | Processar 2ª parcela → validar UI | E2E+DB | US-01: evolução de status |
| CT-07 | Processar última → arrangement SUCCESS | E2E+DB | US-01: status final |
| CT-08 | Refresh → persistência completa | E2E | US-01: persistência |
| CT-09 | Arrangement inexistente | API | Edge case |
| CT-10 | Conta sem arrangements | API | Edge case |

## Observações Técnicas

> **Padrão reutilizado da task #446:** `buildCcArrangementBody()`, `simulateCcSweepForArrangement()`, `recalculateArrangementStatus()`, `getCcTransactionsByArrangement()`.
>
> **CC sweep disabled em QA1:** `sendCreditCardPayments` task tem `is_active=false`. Simulação via DB UPDATE (mesmo padrão dos tests CT-SM-01/04 da task #446).
>
> **Novos endpoints GET:** Precisam ser adicionados ao `PaymentArrangementClient` (atualmente só tem POST). Adicionar:
> - `getPaymentArrangements(accountPk, page, size)` → GET list
> - `getPaymentArrangementPayments(arrangementPk)` → GET payments
>
> **Page Object necessário:** Criar `PaymentArrangementPage` em `src/pages/servicing/` para:
> - Navegação via menu
> - Leitura de dados da tabela principal
> - Expand/collapse de rows
> - Leitura de sub-tabelas CC/ACH
>
> **Selectors necessários:** Adicionar ao `SELECTORS` para a tabela FilterTable do payment arrangement page.
>
> **Conta de teste:** Precisa ser ACTIVE sem arrangement ativo. Padrão GDS bypass com `existingAccountPks` (mesma abordagem #446).
>
> **Bug #446 resolvido:** `uown_sv_account.rating` agora é persistido. Para testes de SETTLEMENT, o account status transiciona corretamente para SETTLED_IN_FULL.

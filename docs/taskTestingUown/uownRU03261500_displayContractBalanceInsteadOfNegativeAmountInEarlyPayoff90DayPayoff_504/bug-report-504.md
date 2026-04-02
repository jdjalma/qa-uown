# Bug Report — Task #504: Display contractBalance Instead of Negative EPO Amount

**GitLab:** https://gitlab.com/uown/frontend/servicing/-/work_items/504
**Milestone:** Uown | RU03.26.1.50.0
**Ambiente:** QA1
**Data:** 2026-03-17
**Pipeline do fix:** [#2384659913](https://gitlab.com/uown/backend/svc/-/pipelines/2384659913) (commit `03075d40`, branch R1.50.0)
**Status do fix:** NAO FUNCIONA — listas imutaveis causam `UnsupportedOperationException`

---

## Resumo

O fix foi deployado no QA1 mas **nao funciona**. O dev adicionou a logica correta (substituir EPO negativo por contractBalance), mas esqueceu de trocar `List.of()` e `.toList()` por listas mutaveis. O `.add()` em lista imutavel lanca `UnsupportedOperationException` → HTTP 500.

**Correcao necessaria pelo dev:** Alterar 2 linhas em `PayOffAmountService.java`:
```java
// Linha 167: List.of(...) → new ArrayList<>(List.of(...))
// Linha 200: .toList() → .collect(Collectors.toList())
```

---

## Passo a Passo para Reproduzir

### Pre-requisitos

- Postman ou curl
- Acesso ao banco QA1: `host=127.0.0.1, port=5445, db=svc, user=svc_user, pass=F1ntech`
- Servicing Portal: https://svc-website-qa1.uownleasing.com
- Base URL API: `https://svc-qa1.uownleasing.com`
- Todas as chamadas API precisam do header: `Authorization: knQ9MeLBQhxl3gKnOszKq7ZaRxaHY23G2iddtlH2`

---

### 1. Configurar merchant com programa de 16 meses

O merchant **KS5936** (Griffin's Furniture Outlet) ja esta configurado no QA1 com APENAS o programa de 16 meses (KW-16-2, pk=208). Porem o settlement nao funciona para ele.

Usar **KS3015** (5th Ave Furniture) que tem settlement funcionando, mas precisa de ajuste no banco depois (passo 10).

**Dados do merchant:**
| Campo | Valor |
|-------|-------|
| merchantNumber | `KS3015` |
| userName | `kornerstone` |
| setupPassword | `U0wn_kornerstone_4aZ9Xb` |
| Tipo | Kornerstone |
| Programa usado | 207 (KW-16-1, 16 meses, epo_days=90) |

---

### 2. Criar aplicacao

```
POST https://svc-qa1.uownleasing.com/uown/los/sendApplication
Content-Type: application/json
Authorization: knQ9MeLBQhxl3gKnOszKq7ZaRxaHY23G2iddtlH2
```

```json
{
  "userName": "kornerstone",
  "setupPassword": "U0wn_kornerstone_4aZ9Xb",
  "merchantNumber": "KS3015",
  "mainFirstName": "Test",
  "mainLastName": "Bug504",
  "mainSSN": "200300400",
  "mainDOB": "01011984",
  "mainAddress1": "123 Main St",
  "mainCity": "New York",
  "mainStateOrProvince": "NY",
  "mainPostalCode": "10001",
  "mainCellPhone": "2125559999",
  "emailAddress": "test504bug@example.com",
  "mainEmployerName": "Test Corp",
  "mainPastBankruptcy": false,
  "mainCurrentOrFutureBankruptcy": false,
  "languagePreference": "E",
  "iovationFingerprintText": "fingerPrintText",
  "ipaddress": "127.0.0.1",
  "desiredPaymentFrequency": "WEEKLY",
  "mainAnnualIncome": 56000,
  "mainPayFrequency": "WEEKLY",
  "mainNextPayDate": "03252026",
  "mainLastPayDate": "03112026",
  "mainEmploymentDuration": "_1_TO_2_YEARS",
  "shipToSameAsConsumer": true
}
```

> **Importante:** Usar um SSN diferente a cada execucao para evitar `CANCELLED_DUP_SSN`.

**Anotar da resposta:**
- `authorizationNumber` → **leadPk**
- `accountNumber` → **UUID**

---

### 3. Forcar aprovacao no banco

Aguardar 6 segundos apos o passo 2 (GDS precisa processar), depois:

```sql
UPDATE uown_los_lead
SET lead_status = 'UW_APPROVED', internal_status = 'UW_APPROVED', max_approval_amount = 2000
WHERE pk = {leadPk};

-- Verificar se uwdata existe:
SELECT COUNT(*) FROM uown_los_uwdata WHERE lead_pk = {leadPk};

-- Se retornar 0, inserir:
INSERT INTO uown_los_uwdata
  (lead_pk, uw_status, internal_decision, approval_amount, uw_approval_amount,
   campaign_id, charge_processing_fee, bank_verification_required,
   is_intellicheck_required, decided_by_agent, row_created_timestamp)
VALUES ({leadPk}, 'APPROVED', 'UW_APPROVED', 2000, 2000, 170, false, false, false, 'GDS', NOW());
```

> **Por que?** O GDS em QA1 retorna "No hit on subject with TU" para SSNs novos na campanha 170. O override direto no banco e a unica forma confiavel.

---

### 4. Criar invoice

```
POST https://svc-qa1.uownleasing.com/uown/los/sendInvoice
Content-Type: application/json
Authorization: knQ9MeLBQhxl3gKnOszKq7ZaRxaHY23G2iddtlH2
```

```json
{
  "userName": "kornerstone",
  "setupPassword": "U0wn_kornerstone_4aZ9Xb",
  "merchantNumber": "KS3015",
  "localeString": "en_US",
  "storeNumber": "1",
  "selectedPaymentFrequency": "WEEKLY",
  "accountNumber": "{UUID}",
  "invoiceNumber": "R50401",
  "orderType": "1",
  "merchandiseSubtotal": "1106.22",
  "discountAmount": "0.00",
  "deliveryCharge": "0.00",
  "installationCharge": "0.00",
  "salesTax": "93.78",
  "miscellaneousFees": "0.00",
  "depositAmount": "0.00",
  "orderTotal": "1200.00",
  "lineItem": [
    {
      "lineItemLineNumber": "1",
      "lineItemSerialNumber": "SN-TEST-001",
      "lineItemProductNumber": "PROD-001",
      "lineItemProductDescription": "Test Furniture Item",
      "lineItemProductCategory": "Appliances",
      "lineItemType": "D",
      "lineItemQuantityOrdered": "1",
      "lineItemTaxAmount": "93.78",
      "lineItemExtendedPrice": "1200.00"
    }
  ]
}
```

> **Importante:** O invoice DEVE ser enviado ANTES de setar `merchant_program_pk` no banco. Se setar antes, retorna HTTP 500 (ver BUG-03).

---

### 5. Setar programa de 16 meses no banco

```sql
UPDATE uown_los_lead SET merchant_program_pk = 207 WHERE pk = {leadPk};
-- 207 = KW-16-1 (16 meses, epo_days=90)
```

> **Por que?** O `ApplicationProcessor.java` tem o mapeamento `programName → merchantProgramPk` em um bloco TODO comentado — nunca preenche automaticamente (ver BUG-02).

---

### 6. Autorizar cartao de credito

```
POST https://svc-qa1.uownleasing.com/uown/los/authorizeCreditCard
Content-Type: application/json
Authorization: knQ9MeLBQhxl3gKnOszKq7ZaRxaHY23G2iddtlH2
```

```json
{
  "leadPk": {leadPk},
  "bankAccountNumber": "123456789",
  "bankRoutingNumber": "021000021",
  "bankAccountType": "CHECKING",
  "bankAccountCustomerFirstName": "Test",
  "bankAccountCustomerLastName": "Bug504",
  "achAutoPay": true,
  "ccInfo": {
    "leadPk": {leadPk},
    "ccFirstName": "Test",
    "ccLastName": "Bug504",
    "ccNumber": "5146315000000055",
    "cvc": "998",
    "ccType": "OTHER",
    "ccExp": "12/2028",
    "autoPay": true,
    "preAuthStatus": "SUCCESS"
  },
  "desiredPaymentFrequency": "WEEKLY"
}
```

---

### 7. Tornar lease SIGNED

```
POST https://svc-qa1.uownleasing.com/uown/los/changeLeadStatus
Content-Type: application/json
Authorization: knQ9MeLBQhxl3gKnOszKq7ZaRxaHY23G2iddtlH2
```

```json
{
  "userName": "kornerstone",
  "setupPassword": "U0wn_kornerstone_4aZ9Xb",
  "merchantNumber": "KS3015",
  "leadPk": {leadPk},
  "newStatus": "SIGNED",
  "comment": "Teste manual 504"
}
```

---

### 8. Settle a aplicacao

```
POST https://svc-qa1.uownleasing.com/uown/los/settleApplication
Content-Type: application/json
Authorization: knQ9MeLBQhxl3gKnOszKq7ZaRxaHY23G2iddtlH2
```

```json
{
  "userName": "kornerstone",
  "setupPassword": "U0wn_kornerstone_4aZ9Xb",
  "merchantNumber": "KS3015",
  "accountNumber": "{UUID}"
}
```

---

### 9. Tornar lease FUNDING e depois FUNDED

```
POST https://svc-qa1.uownleasing.com/uown/los/updateFundingStatus
Content-Type: application/json
Authorization: knQ9MeLBQhxl3gKnOszKq7ZaRxaHY23G2iddtlH2
```

**Primeiro FUNDING:**
```json
{ "leadPks": [{leadPk}], "fundingStatus": "FUNDING" }
```

Aguardar 3 segundos.

**Depois FUNDED:**
```json
{ "leadPks": [{leadPk}], "fundingStatus": "FUNDED" }
```

Aguardar 10 segundos para a conta SVC ser criada.

**Verificar no banco:**
```sql
SELECT pk FROM uown_sv_account WHERE lead_pk = {leadPk};
```

Anotar: **accountPk**

---

### 10. Forcar term_in_months = 16 no banco

```sql
UPDATE uown_sv_sched_summary SET term_in_months = 16 WHERE account_pk = {accountPk};
```

**Verificar:**
```sql
SELECT term_in_months FROM uown_sv_sched_summary WHERE account_pk = {accountPk};
-- Deve retornar: 16
```

> **Por que?** O `CalculatorService` busca programas na tabela `uown_merchant_to_program` (que para KS3015 so tem 13 meses) e ignora o `merchant_program_pk = 207` do lead (ver BUG-04).

---

### 11. Fazer pagamento CC no valor de $5000

> O valor do buyout para um pedido de $1200 e aproximadamente **$1244**. Qualquer pagamento acima desse valor faz o EPO ficar negativo. Usamos $5000 para garantir.

**Via banco** (metodo mais confiavel — ver BUG-05 sobre gateway):

```sql
INSERT INTO uown_sv_payment
  (account_pk, payment_amount, payment_date, payment_type, status,
   allocation_strategy, is_ach, is_credit_card, most_recent,
   non_taxable_payment, taxable_payment, agent_username, row_created_timestamp)
VALUES ({accountPk}, 5000.00, CURRENT_DATE, 'CC', 'PAID',
        'REGULAR_RECEIVABLES', false, true, false,
        4500.00, 500.00, 'MANUAL_TEST', NOW());
```

**Via Servicing Portal** (se o gateway funcionar para seu usuario):

1. Login em https://svc-website-qa1.uownleasing.com
2. Buscar a conta pelo accountPk
3. Clicar no icone "$" (Make Payment)
4. Payment Type: Credit Card Payment
5. Total Payment Amount: `5000.00`
6. Usar cartao on file (ja salvo no passo 6)
7. Clicar Submit

> **Nota:** O gateway CC pode nao processar para contas de automacao. Se o pagamento aparecer como "scheduled" mas nao criar registro PAID no banco, usar o metodo via banco acima.

---

### 12. Verificar EPO Balance e Payoff Amount via API

**getPayoffAmount:**
```
GET https://svc-qa1.uownleasing.com/uown/svc/getPayoffAmount/{accountPk}
Authorization: knQ9MeLBQhxl3gKnOszKq7ZaRxaHY23G2iddtlH2
```

**Resultado atual (BUG):**
```json
{
  "status": 500,
  "error": "Internal Server Error",
  "message": "Request processing failed; nested exception is java.lang.UnsupportedOperationException"
}
```

**Resultado esperado apos fix correto:**
```json
HTTP 200
epoBalance: 2701.15 (contractBalance, valor positivo)
```

**getAccountSummary:**
```
GET https://svc-qa1.uownleasing.com/uown/svc/getAccountSummary/{accountPk}
Authorization: knQ9MeLBQhxl3gKnOszKq7ZaRxaHY23G2iddtlH2
```

**Resultado atual (BUG):** HTTP 500 (mesmo erro)

**Resultado esperado apos fix:**
- `epoBalance` = valor positivo (igual ao contractBalance)
- `contractBalance` = ~$2701
- `epoBalance == contractBalance`

---

### 13. Verificar no Servicing Portal (UI)

1. Login em https://svc-website-qa1.uownleasing.com
2. Buscar a conta pelo accountPk
3. Verificar secao **"Early Payoff / 90 Day Pay Off"** no lado direito
4. Verificar secao **"Account & Contract Overview"** → campo Contract Balance

**Resultado atual (BUG):** A secao "Early Payoff" nao carrega (erro HTTP 500 no backend)

**Resultado esperado apos fix:**
- "EPO Balance" mostra valor positivo (contractBalance)
- "Contract Balance" mostra o mesmo valor
- Ambos iguais e positivos
- Nenhuma mensagem de erro na tela

---

### 14. Verificar no banco de dados

```sql
-- Verificar status da conta
SELECT account_status FROM uown_sv_account WHERE pk = {accountPk};
-- Esperado: ACTIVE

-- Verificar term_in_months (deve ser 16 para ativar a rota getAnytimeBuyout)
SELECT term_in_months FROM uown_sv_sched_summary WHERE account_pk = {accountPk};
-- Esperado: 16

-- Verificar pagamentos aplicados
SELECT pk, payment_amount, status, payment_type
FROM uown_sv_payment WHERE account_pk = {accountPk} AND status = 'PAID';
-- Esperado: registro com payment_amount = 5000.00, status = PAID

-- Verificar contract balance (valor que deveria ser retornado como EPO)
SELECT
  ss.total_contract_amount_with_tax_and_fees AS contract_total,
  COALESCE(SUM(p.payment_amount), 0) AS total_paid,
  ss.total_contract_amount_with_tax_and_fees - COALESCE(SUM(p.payment_amount), 0) AS contract_balance
FROM uown_sv_sched_summary ss
LEFT JOIN uown_sv_payment p ON p.account_pk = ss.account_pk AND p.status = 'PAID'
WHERE ss.account_pk = {accountPk}
GROUP BY ss.total_contract_amount_with_tax_and_fees;
-- Esperado: contract_balance positivo (~$2701 se nenhum outro pagamento)
```

---

## Cenarios adicionais validados

### CT-01: EPO positivo (sem pagamento grande) ✅

Mesmos passos 1-10 acima, **SEM o passo 11** (sem pagamento grande).

```
GET /uown/svc/getPayoffAmount/{accountPk}
```
- **Resultado:** HTTP 200, epoBalance = ~$1244 (positivo)
- A rota `getAnytimeBuyout()` funciona normalmente quando o resultado e positivo

### CT-08: Conta TerraceFinance (non-Kornerstone) ✅

Mesmos passos 1-9, mas com merchant **TerraceFinance**:
- `merchantNumber`: `OL90202-0001`
- `userName`: `terraceFinance`
- `setupPassword`: `U0wn_terraceFinance_xJ9z4p`
- `merchant_program_pk`: 88 (13 meses)
- **NAO fazer** passo 10 (term_in_months fica 13 naturalmente)

```
GET /uown/svc/getPayoffAmount/{accountPk}
```
- **Resultado:** HTTP 200 — usa rota `getEpoCalculation()`, nao afetada pelo bug

### CT-09: Kornerstone non-16-month ✅

Mesmos passos 1-9 com merchant **KS3015**, **NAO fazer** passos 10 e 11.

```sql
SELECT term_in_months FROM uown_sv_sched_summary WHERE account_pk = {accountPk};
-- Resultado: 13 (padrao do KS3015)
```

```
GET /uown/svc/getPayoffAmount/{accountPk}
```
- **Resultado:** HTTP 200 — usa rota `getKornerstoneEpo()`, nao afetada pelo bug

### CT-12: Conta cancelada ✅

Mesmos passos 1-10, depois cancelar:

```
POST https://svc-qa1.uownleasing.com/uown/svc/cancelAccount
Content-Type: application/json
Authorization: knQ9MeLBQhxl3gKnOszKq7ZaRxaHY23G2iddtlH2

{ "accountPk": {accountPk}, "comment": "Teste manual 504", "refundAllPayments": false }
```

> **Atencao:** `accountPk` vai no BODY, nao no path da URL.

```
GET /uown/svc/getPayoffAmount/{accountPk}
```
- **Resultado:** HTTP 200 (nao 500) — conta cancelada nao dispara o bug

---

## Bugs encontrados

| # | Bug | Severidade | Status |
|---|-----|:----------:|:------:|
| 1 | HTTP 500 em getPayoffAmount quando EPO negativo — fix usa `List.of().add()` (imutavel) | Critical | ABERTO |
| 2 | `merchant_program_pk` nunca preenchido via sendApplication (TODO comentado) | Medium | ABERTO |
| 3 | sendInvoice falha com rollback se `merchant_program_pk` ja esta setado | Medium | ABERTO |
| 4 | CalculatorService ignora `merchant_program_pk` do lead (usa tabela de join) | Low | ABERTO |
| 5 | CC gateway nao processa pagamentos de contas criadas por automacao | Medium | ABERTO |
| 6 | cancelAccount esperava accountPk no path em vez do body | Low | CORRIGIDO |

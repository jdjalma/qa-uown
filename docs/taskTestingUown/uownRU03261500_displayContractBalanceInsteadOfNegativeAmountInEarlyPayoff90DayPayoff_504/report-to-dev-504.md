## Tests in QA1

---

### Problem Summary

A credit card payment of **$5,000.00** (greater than the contract total of $3,172.64) was made on a **Kornerstone active account with a 16-month program** (accountPk=4318).

After the payment, **the account is no longer accessible in the Servicing Portal**. The "Early Payoff / 90-Day Payoff" section fails to load and the API returns HTTP 500.

The fix from commit `03075d40` was deployed to QA1 but **does not resolve the issue** — the error persists.

---

### Error Returned

```
GET /uown/svc/getPayoffAmount/4318

HTTP 500
{
  "timestamp": "2026-03-17T12:51:16.413+00:00",
  "status": 500,
  "error": "Internal Server Error",
  "message": "Request processing failed; nested exception is java.lang.UnsupportedOperationException",
  "path": "/uown/svc/getPayoffAmount/4318"
}
```

The same error occurs on `getAccountSummary`:
```
GET /uown/svc/getAccountSummary/4318 → HTTP 500 (same error)
```

---

### Affected Account Data

| Field | Value |
|-------|-------|
| Account PK | 4318 |
| Company | KORNERSTONE |
| Term in Months | 16 |
| Account Status | PAID_OUT_EARLY |
| Contract Total | $3,172.64 |
| Payment Made | $5,000.00 (CC, status PAID) |
| Payment Made By | jmendes.gow (via Servicing Portal) |
| Merchant | KS3015 (5th Ave Furniture) |

---

### Code Evidence — Root Cause

The problem is in the `getAnytimeBuyout()` method in `PayOffAmountService.java`.

The fix from commit `03075d40` added the correct logic to substitute the negative value with Contract Balance, but the lists `epoAttributes` and `epoValues` were created as **immutable** and the fix attempts to call `.add()` on them:

```java
// Line 167 — List created with List.of() (IMMUTABLE):
List<String> epoAttributes = List.of("ProgramType", "MoneyFactor", ..., "Balance");

// Line 200 — List created with Stream.toList() (IMMUTABLE in Java 16+):
List<String> epoValues = rawValues.stream().map(String::valueOf).toList();

// Line 203 — Buyout calculation:
BigDecimal kwBuyoutAmount = result.anytimeBuyoutAmountWithTax()
    .subtract(actualPaymentAmount)
    .setScale(2, RoundingMode.HALF_EVEN);

// Lines 204-208 — Fix added by commit 03075d40:
if (kwBuyoutAmount.compareTo(BigDecimal.ZERO) <= 0) {
    ContractBalance contractBalance = accountAmountsService.getContractBalance(account);
    epoAttributes.add("contractBalance");   // ← ERROR: UnsupportedOperationException
    epoValues.add(contractBalance.getBalance().toString());  // ← never reached
    kwBuyoutAmount = contractBalance.getBalance();
}
```

**Calling `.add()` on `List.of()` and `Stream.toList()` throws `UnsupportedOperationException`** because both return immutable lists in Java 16+.

#### Required Fix

Change lines 167 and 200 to create **mutable** lists:

```java
// Line 167 — BEFORE:
List<String> epoAttributes = List.of("ProgramType", "MoneyFactor", ..., "Balance");
// Line 167 — AFTER:
List<String> epoAttributes = new ArrayList<>(List.of("ProgramType", "MoneyFactor", ..., "Balance"));

// Line 200 — BEFORE:
List<String> epoValues = rawValues.stream().map(String::valueOf).toList();
// Line 200 — AFTER:
List<String> epoValues = rawValues.stream().map(String::valueOf).collect(Collectors.toList());
```

---

### Steps to Reproduce

#### Prerequisites
- Access to Servicing Portal QA1: https://svc-website-qa1.uownleasing.com
- An account that meets: **company = KORNERSTONE**, **account_status = ACTIVE**, **term_in_months = 16**

#### Step by step

1. **Open the Servicing Portal** and search for a Kornerstone active account with 16 months
   - Example used: accountPk **4318** (5th Ave Furniture / KS3015)

2. **Make a CC payment greater than the contract value**
   - Click the "$" icon (Make Payment)
   - Select "Credit Card Payment"
   - Enter amount: **$5,000.00** (or any value that exceeds the account's Early Payoff/buyout)
   - Use card on file and click Submit
   - The payment is processed successfully (status PAID)

3. **Try to access the account again**
   - The "Early Payoff / 90-Day Payoff" section **fails to load**
   - The Servicing Portal shows an error or blank fields in the EPO area

4. **Verify via API**
   ```
   GET https://svc-qa1.uownleasing.com/uown/svc/getPayoffAmount/4318
   Header: Authorization: knQ9MeLBQhxl3gKnOszKq7ZaRxaHY23G2iddtlH2
   ```
   **Result:** HTTP 500 — `UnsupportedOperationException`

5. **Verify via database**
   ```sql
   -- Confirm payment was applied
   SELECT payment_amount, status FROM uown_sv_payment WHERE account_pk = 4318 AND status = 'PAID';
   -- Result: $5,000.00 PAID

   -- Confirm account and program
   SELECT a.company, a.account_status, ss.term_in_months
   FROM uown_sv_account a
   JOIN uown_sv_sched_summary ss ON ss.account_pk = a.pk
   WHERE a.pk = 4318;
   -- Result: KORNERSTONE, PAID_OUT_EARLY, 16
   ```

---

### Acceptance Criteria

After the fix, the following criteria must be met:

1. **Payment processed normally** — The system must accept payments of any amount, including above the contract total, without generating errors
2. **Fields never negative** — The `epoBalance` field in the API and UI must always return a positive value (Contract Balance when the buyout calculation results in zero or negative)
3. **Account remains functional** — After the payment, the account must remain accessible in the Servicing Portal without errors in the "Early Payoff / 90-Day Payoff" section
4. **API returns HTTP 200** — The `getPayoffAmount` and `getAccountSummary` endpoints must return HTTP 200 (not 500) in all scenarios
5. **EPO Balance = Contract Balance** — When the Anytime Buyout calculation results in a negative value, the displayed `epoBalance` must equal the `contractBalance` from the "Account & Contract Overview" section
6. **Breakdown includes contractBalance** — The `epoBreakdown` must contain the `"contractBalance"` entry with the corresponding value when the substitution occurs
7. **Non-16-month accounts unaffected** — Accounts with `term_in_months != 16` must continue working normally with no behavior change

---
---

# Task #504 — Relatorio de Bug para o Desenvolvedor (PT-BR)

## Testes em QA1

---

## Resumo do Problema

Realizei um pagamento via cartao de credito no valor de **$5,000.00** (valor maior que o contrato de $3,172.64) em uma conta **Kornerstone ativa com programa de 16 meses** (accountPk=4318).

Apos o pagamento, **nao e possivel acessar a conta no Servicing Portal**. A secao "Early Payoff / 90-Day Payoff" nao carrega e a API retorna erro HTTP 500.

O fix do commit `03075d40` foi deployado no QA1 mas **nao resolve o problema** — o erro persiste.

---

## Erro Retornado

```
GET /uown/svc/getPayoffAmount/4318

HTTP 500
{
  "timestamp": "2026-03-17T12:51:16.413+00:00",
  "status": 500,
  "error": "Internal Server Error",
  "message": "Request processing failed; nested exception is java.lang.UnsupportedOperationException",
  "path": "/uown/svc/getPayoffAmount/4318"
}
```

O mesmo erro ocorre no `getAccountSummary`:
```
GET /uown/svc/getAccountSummary/4318 → HTTP 500 (mesmo erro)
```

---

## Dados da Conta Afetada

| Campo | Valor |
|-------|-------|
| Account PK | 4318 |
| Company | KORNERSTONE |
| Term in Months | 16 |
| Account Status | PAID_OUT_EARLY |
| Contract Total | $3,172.64 |
| Pagamento Realizado | $5,000.00 (CC, status PAID) |
| Pagamento feito por | jmendes.gow (via Servicing Portal) |
| Merchant | KS3015 (5th Ave Furniture) |

---

## Evidencia do Codigo — Causa Raiz

O problema esta no metodo `getAnytimeBuyout()` em `PayOffAmountService.java`.

O fix do commit `03075d40` adicionou a logica correta para substituir o valor negativo pelo Contract Balance, porem as listas `epoAttributes` e `epoValues` foram criadas como **imutaveis** e o fix tenta chamar `.add()` nelas:

```java
// Linha 167 — Lista criada com List.of() (IMUTAVEL):
List<String> epoAttributes = List.of("ProgramType", "MoneyFactor", ..., "Balance");

// Linha 200 — Lista criada com Stream.toList() (IMUTAVEL no Java 16+):
List<String> epoValues = rawValues.stream().map(String::valueOf).toList();

// Linha 203 — Calculo do buyout:
BigDecimal kwBuyoutAmount = result.anytimeBuyoutAmountWithTax()
    .subtract(actualPaymentAmount)
    .setScale(2, RoundingMode.HALF_EVEN);

// Linhas 204-208 — Fix adicionado pelo commit 03075d40:
if (kwBuyoutAmount.compareTo(BigDecimal.ZERO) <= 0) {
    ContractBalance contractBalance = accountAmountsService.getContractBalance(account);
    epoAttributes.add("contractBalance");   // ← ERRO: UnsupportedOperationException
    epoValues.add(contractBalance.getBalance().toString());  // ← nunca alcancado
    kwBuyoutAmount = contractBalance.getBalance();
}
```

**O `.add()` em `List.of()` e `Stream.toList()` lanca `UnsupportedOperationException`** porque ambos retornam listas imutaveis no Java 16+.

### Correcao Necessaria

Alterar as linhas 167 e 200 para criar listas **mutaveis**:

```java
// Linha 167 — ANTES:
List<String> epoAttributes = List.of("ProgramType", "MoneyFactor", ..., "Balance");
// Linha 167 — DEPOIS:
List<String> epoAttributes = new ArrayList<>(List.of("ProgramType", "MoneyFactor", ..., "Balance"));

// Linha 200 — ANTES:
List<String> epoValues = rawValues.stream().map(String::valueOf).toList();
// Linha 200 — DEPOIS:
List<String> epoValues = rawValues.stream().map(String::valueOf).collect(Collectors.toList());
```

---

## Passos para Reproducao Manual

### Pre-requisitos
- Acesso ao Servicing Portal QA1: https://svc-website-qa1.uownleasing.com
- Uma conta que atenda: **company = KORNERSTONE**, **account_status = ACTIVE**, **term_in_months = 16**

### Passo a passo

1. **Acessar o Servicing Portal** e buscar uma conta Kornerstone ativa com 16 meses
   - Exemplo usado: accountPk **4318** (5th Ave Furniture / KS3015)

2. **Realizar um pagamento CC maior que o valor do contrato**
   - Clicar no icone "$" (Make Payment)
   - Selecionar "Credit Card Payment"
   - Informar valor: **$5,000.00** (ou qualquer valor que exceda o Early Payoff/buyout da conta)
   - Usar cartao on file e clicar Submit
   - O pagamento e processado com sucesso (status PAID)

3. **Tentar acessar a conta novamente**
   - A secao "Early Payoff / 90-Day Payoff" **nao carrega**
   - O Servicing Portal mostra erro ou campos em branco na area de EPO

4. **Verificar via API**
   ```
   GET https://svc-qa1.uownleasing.com/uown/svc/getPayoffAmount/4318
   Header: Authorization: knQ9MeLBQhxl3gKnOszKq7ZaRxaHY23G2iddtlH2
   ```
   **Resultado:** HTTP 500 — `UnsupportedOperationException`

5. **Verificar via banco**
   ```sql
   -- Confirmar pagamento aplicado
   SELECT payment_amount, status FROM uown_sv_payment WHERE account_pk = 4318 AND status = 'PAID';
   -- Resultado: $5,000.00 PAID

   -- Confirmar conta e programa
   SELECT a.company, a.account_status, ss.term_in_months
   FROM uown_sv_account a
   JOIN uown_sv_sched_summary ss ON ss.account_pk = a.pk
   WHERE a.pk = 4318;
   -- Resultado: KORNERSTONE, PAID_OUT_EARLY, 16
   ```

---

## Criterios de Aceite

Apos a correcao, os seguintes criterios devem ser atendidos:

1. **Pagamento processado normalmente** — O sistema deve aceitar pagamentos de qualquer valor, inclusive acima do contrato, sem gerar erro
2. **Campos nunca negativos** — O campo `epoBalance` na API e na UI deve sempre retornar um valor positivo (Contract Balance quando o calculo do buyout resulta em zero ou negativo)
3. **Conta continua funcional** — Apos o pagamento, a conta deve continuar acessivel no Servicing Portal sem erros na secao "Early Payoff / 90-Day Payoff"
4. **API retorna HTTP 200** — Os endpoints `getPayoffAmount` e `getAccountSummary` devem retornar HTTP 200 (nao 500) em todos os cenarios
5. **EPO Balance = Contract Balance** — Quando o calculo do Anytime Buyout resulta em valor negativo, o `epoBalance` exibido deve ser igual ao `contractBalance` da secao "Account & Contract Overview"
6. **Breakdown inclui contractBalance** — O `epoBreakdown` deve conter a linha `"contractBalance"` com o valor correspondente quando a substituicao ocorre
7. **Contas non-16-month nao afetadas** — Contas com `term_in_months != 16` devem continuar funcionando normalmente sem alteracao de comportamento

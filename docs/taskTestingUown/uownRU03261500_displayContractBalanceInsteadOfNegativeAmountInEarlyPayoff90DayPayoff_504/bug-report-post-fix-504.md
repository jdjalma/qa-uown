# Bug Report — Post-Fix 9885ca0e (#504)

**Task:** https://gitlab.com/uown/backend/svc/-/work_items/504
**Fix commit:** `9885ca0e` — "uown/frontend/servicing#504 new list"
**Environment:** QA1
**Tested on:** 2026-03-19
**Tested by:** QA Automation

---

## BUG-01: Valores negativos em getPayoffAmount, epoBalance e contractBalance (Critical)

O commit `9885ca0e` corrigiu o HTTP 500 (`UnsupportedOperationException` por listas imutaveis), mas quando o pagamento total excede o valor do contrato, **todos os valores financeiros ficam negativos**:

| Campo | Valor atual | Valor esperado |
|-------|:-----------:|:--------------:|
| `getPayoffAmount` | **-2298.85** | >= $0.00 |
| `epoBalance` | **-2298.85** | >= $0.00 |
| `contractBalance` | **-2298.85** | >= $0.00 |
| `contractBalanceBreakdown.Balance` | **"-2298.85"** | >= "0.00" |

### Causa raiz

O calculo de `contractBalance` faz `Total - TotalPaid` sem clampar para zero:

```
Total Contract Amount:  2701.15
Total Paid Amount:      5000.00   ← pagamento MAIOR que contrato
Balance:               -2298.85   ← 2701.15 - 5000.00 = NEGATIVO
```

O fix do commit `9885ca0e` substitui `kwBuyoutAmount` por `contractBalance.getBalance()` quando EPO <= 0, mas como o proprio `contractBalance` ja e negativo, a substituicao nao resolve:

```java
if(kwBuyoutAmount.compareTo(BigDecimal.ZERO) <= 0 || daysUsed <= 0){
    ContractBalance contractBalance = accountAmountsService.getContractBalance(account);
    // contractBalance.getBalance() = -2298.85 ← JA NEGATIVO
    kwBuyoutAmount = contractBalance.getBalance().setScale(2, RoundingMode.HALF_EVEN);
}
```

### Sugestao de fix

Clampar o valor para zero em pelo menos um dos dois pontos:

**Opcao A — no `getAnytimeBuyout()` (PayOffAmountService.java):**
```java
if(kwBuyoutAmount.compareTo(BigDecimal.ZERO) <= 0 || daysUsed <= 0){
    ContractBalance contractBalance = accountAmountsService.getContractBalance(account);
    BigDecimal balance = contractBalance.getBalance().max(BigDecimal.ZERO); // clamp >= 0
    epoAttributes.add("contractBalance");
    epoValues.add(String.valueOf(balance));
    kwBuyoutAmount = balance.setScale(2, RoundingMode.HALF_EVEN);
}
```

**Opcao B — no `getContractBalance()` (AccountAmountsService.java):**
Garantir que `getContractBalance()` nunca retorne negativo — `Balance = max(0, Total - TotalPaid)`.

### Passo a passo para reproduzir

#### Pre-requisitos
- API key SVC: `knQ9MeLBQhxl3gKnOszKq7ZaRxaHY23G2iddtlH2`
- Conta Kornerstone com `term_in_months = 16`, status ACTIVE, e pagamento > valor do contrato

#### Usar conta existente (conta 4471)

**1. Confirmar getPayoffAmount negativo**

```bash
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -X GET "https://svc-qa1.uownleasing.com/uown/svc/getPayoffAmount/4471" \
  -H "Authorization: knQ9MeLBQhxl3gKnOszKq7ZaRxaHY23G2iddtlH2"
```

Resultado: `-2298.85` (HTTP 200)

**2. Confirmar contractBalance e epoBalance negativos**

```bash
curl -s -X GET "https://svc-qa1.uownleasing.com/uown/svc/getAccountSummary/4471" \
  -H "Authorization: knQ9MeLBQhxl3gKnOszKq7ZaRxaHY23G2iddtlH2" \
  -H "Content-Type: application/json" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f'epoBalance:       {data[\"epoBalance\"]}')
print(f'contractBalance:  {data[\"contractBalance\"]}')
breakdown = data.get('contractBalanceBreakdown', [[],[]])
if len(breakdown) >= 2:
    for h, v in zip(breakdown[0], breakdown[1]):
        print(f'  {h}: {v}')
"
```

Resultado:
```
epoBalance:       -2298.85
contractBalance:  -2298.85
  Total Contract Amount With Tax and Fees: 2701.15
  Total Paid Amount: 5000.00
  Balance: -2298.85
```

**3. Confirmar dados da conta no banco**

```sql
SELECT a.company, a.account_status, ss.term_in_months
FROM uown_sv_account a
JOIN uown_sv_sched_summary ss ON ss.account_pk = a.pk
WHERE a.pk = 4471;
-- Resultado: KORNERSTONE, ACTIVE, 16

SELECT payment_amount, status, payment_type
FROM uown_sv_payment
WHERE account_pk = 4471 AND status = 'PAID'
ORDER BY pk DESC LIMIT 5;
-- Resultado: $5000.00 PAID CC
```

#### Criar cenario do zero

**1. Encontrar conta elegivel**

```sql
SELECT a.pk AS account_pk, a.company, a.account_status, ss.term_in_months
FROM uown_sv_account a
JOIN uown_sv_sched_summary ss ON ss.account_pk = a.pk
WHERE a.company = 'KORNERSTONE'
  AND a.account_status = 'ACTIVE'
  AND ss.term_in_months = 16
ORDER BY a.pk DESC
LIMIT 10;
```

**2. Verificar getPayoffAmount ANTES do pagamento**

```bash
curl -s -X GET "https://svc-qa1.uownleasing.com/uown/svc/getPayoffAmount/{ACCOUNT_PK}" \
  -H "Authorization: knQ9MeLBQhxl3gKnOszKq7ZaRxaHY23G2iddtlH2"
```

Anotar o valor positivo (ex: 2701.15).

**3. Fazer pagamento CC maior que o contrato via Servicing Portal**

1. Abrir https://svc-website-qa1.uownleasing.com
2. Buscar a conta pelo Account PK
3. Clicar no icone "$" (Make Payment)
4. Selecionar "Credit Card Payment"
5. Inserir valor: **$5,000.00** (ou qualquer valor > EPO do passo 2)
6. Usar cartao ja cadastrado na conta
7. Clicar Submit
8. Confirmar que o pagamento foi processado (status PAID)

**4. Verificar getPayoffAmount DEPOIS do pagamento**

```bash
curl -s -X GET "https://svc-qa1.uownleasing.com/uown/svc/getPayoffAmount/{ACCOUNT_PK}" \
  -H "Authorization: knQ9MeLBQhxl3gKnOszKq7ZaRxaHY23G2iddtlH2"
```

Resultado atual (BUG): valor **negativo**

---

## ~~BUG-02~~ (DESCARTADO): epoBreakdown nao existe em getAccountSummary

**Nao e bug.** O campo `epoBreakdown` nao existe na resposta de `getAccountSummary`. O campo correto e `contractBalanceBreakdown`, que retorna normalmente. Era erro no teste (CT-07) que buscava o campo errado.

---

## Criterios de aceite para validacao pos-fix

| # | Criterio | Como validar |
|---|----------|--------------|
| 1 | `getPayoffAmount` retorna HTTP 200 (nao 500) | `curl GET /getPayoffAmount/{pk}` → status 200 |
| 2 | Valor retornado e **>= $0.00** | `curl GET /getPayoffAmount/{pk}` → body >= 0 |
| 3 | `epoBalance` >= $0.00 | `curl GET /getAccountSummary/{pk}` → epoBalance >= 0 |
| 4 | `contractBalance` >= $0.00 | `curl GET /getAccountSummary/{pk}` → contractBalance >= 0 |
| 5 | Conta acessivel no Servicing Portal | Abrir conta → secao "Early Payoff" visivel |
| 6 | Contas non-16-month nao afetadas | Testar conta TerraceFinance (13 meses) |
| 7 | Contas canceladas nao afetadas | Testar conta cancelada → sem HTTP 500 |

### Contas de teste disponiveis em QA1

| Account PK | Tipo | Status | Pagamento $5000 | Uso |
|:----------:|------|--------|:---------------:|-----|
| 4471 | Kornerstone 16-month | ACTIVE | Sim | BUG-01 reproduzido |
| 4468 | Kornerstone 16-month | ACTIVE | Nao | EPO positivo (controle) |
| 4469 | TerraceFinance 13-month | ACTIVE | Nao | Non-Kornerstone (controle) |
| 4470 | Kornerstone 13-month | ACTIVE | Nao | Non-16-month (controle) |
| 4472 | Kornerstone 16-month | CANCELLED | Nao | Conta cancelada (controle) |

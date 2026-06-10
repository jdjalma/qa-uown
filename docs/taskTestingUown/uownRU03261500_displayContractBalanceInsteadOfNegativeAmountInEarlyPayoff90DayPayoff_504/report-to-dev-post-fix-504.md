## Testes em QA1 — Pós-Correção `9885ca0e`

---

### Resumo do Problema

A correção do commit `9885ca0e` resolveu com sucesso o **HTTP 500 / UnsupportedOperationException** (listas imutáveis agora são mutáveis). No entanto, um novo problema permanece: quando um pagamento com CC excede o total do contrato, a API retorna **valores negativos** para `getPayoffAmount`, `epoBalance` e `contractBalance`.

A substituição de `contractBalance` no branch `if(kwBuyoutAmount <= 0)` substitui por `contractBalance.getBalance()`, mas **`contractBalance` em si já é negativo** porque `getContractBalance()` calcula `Total - TotalPago` sem limitar a zero.

---

#### Conta 4472 (teste manual — pagamento feito via Servicing Portal)

| Campo | Antes do Pagamento | Depois do Pagamento |
|-------|:--------------:|:-------------:|
| Account PK | 4472 | 4472 |
| Company | KORNERSTONE | KORNERSTONE |
| Term in Months | 16 | 16 |
| Account Status | ACTIVE | PAID_OUT_EARLY_EPO |
| Contract Total | $2,701.15 | $2,701.15 |
| Payment Made | — | $5,000.00 (CC, via Servicing Portal) |
| `getPayoffAmount` | $2,701.15 (positivo) | **-$2,298.85** (negativo) |
| `epoBalance` | $2,701.15 | **-$2,298.85** |
| `contractBalance` | $2,701.15 | **-$2,298.85** |

```
GET /uown/svc/getPayoffAmount/4472 → HTTP 200, body: -2298.85

GET /uown/svc/getAccountSummary/4472 →
  accountStatus:    PAID_OUT_EARLY_EPO
  epoBalance:       -2298.85
  contractBalance:  -2298.85
  contractBalanceBreakdown:
    Total Contract Amount:  2701.15
    Total Paid Amount:      5000.00
    Balance:               -2298.85
```

#### Conta 4318

| Campo | Valor |
|-------|-------|
| Account PK | 4318 |
| Company | KORNERSTONE |
| Term in Months | 16 |
| Account Status | PAID_OUT_EARLY |
| Contract Total | $3,172.64 |
| Payment Made | $5,000.00 (CC, via Servicing Portal por jmendes.gow) |
| `getPayoffAmount` (antes da correção) | HTTP 500 — `UnsupportedOperationException` |
| `getPayoffAmount` (após a correção) | HTTP 200, body: **-$1,827.36** |

```
GET /uown/svc/getPayoffAmount/4318 → HTTP 200, body: -1827.36
  (anteriormente HTTP 500 antes da correção 9885ca0e)
```

---

### Evidência do Código — Causa Raiz

A correção em `PayOffAmountService.java` substitui corretamente `kwBuyoutAmount` por `contractBalance.getBalance()`, mas `getContractBalance()` retorna um **valor negativo** quando `totalPaid > contractTotal`:

```java
// PayOffAmountService.java — commit 9885ca0e, linhas 205-211:
if(kwBuyoutAmount.compareTo(BigDecimal.ZERO) <= 0 || daysUsed <= 0){
    ContractBalance contractBalance = accountAmountsService.getContractBalance(account);
    epoAttributes.add("contractBalance");
    epoValues.add(String.valueOf(contractBalance.getBalance()));
    kwBuyoutAmount = contractBalance.getBalance().setScale(2, RoundingMode.HALF_EVEN);
    //                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    //                contractBalance.getBalance() = -2298.85 (JÁ NEGATIVO)
    //                porque getContractBalance() = Total - TotalPago
    //                                             = 2701.15 - 5000.00
    //                                             = -2298.85
}
```

O cálculo dentro de `getContractBalance()` (ou `AccountAmountsService`) calcula:
```

---

### Passos para Reproduzir

#### Pré-requisitos
- Acesso ao Servicing Portal QA1: https://svc-website-qa1.uownleasing.com
- Uma conta que atenda: **company = KORNERSTONE**, **account_status = ACTIVE**, **term_in_months = 16**

#### Passo a passo

1. **Abrir o Servicing Portal** e buscar uma conta ativa da Kornerstone com 16 meses
   - Contas disponíveis para verificação: **4472**, **4471**, **4318**

2. **Verificar que a conta está acessível ANTES do pagamento** (pular se usar as contas acima)
   ```
   GET https://svc-qa1.uownleasing.com/uown/svc/getPayoffAmount/{accountPk}
   Header: Authorization: knQ9MeLBQhxl3gKnOszKq7ZaRxaHY23G2iddtlH2
   ```
   **Esperado:** HTTP 200 com valor positivo (ex: 2701.15)

3. **Fazer um pagamento com CC maior que o valor do contrato**
   - Clicar no ícone "$" (Make Payment)
   - Selecionar "Credit Card Payment"
   - Inserir valor: **$5,000.00** (ou qualquer valor que exceda o total do contrato)
   - Usar cartão cadastrado e clicar em Submit
   - O pagamento é processado com sucesso (status PAID)

4. **Verificar via API — getPayoffAmount retorna valor negativo**
   ```
   GET https://svc-qa1.uownleasing.com/uown/svc/getPayoffAmount/{accountPk}
   Header: Authorization: knQ9MeLBQhxl3gKnOszKq7ZaRxaHY23G2iddtlH2
   ```
   **Esperado:** HTTP 200, valor >= $0.00
   **Atual:** HTTP 200, valor **negativo** (ex: -2298.85)

5. **Verificar via API — getAccountSummary mostra saldos negativos**
   ```
   GET https://svc-qa1.uownleasing.com/uown/svc/getAccountSummary/{accountPk}
   Header: Authorization: knQ9MeLBQhxl3gKnOszKq7ZaRxaHY23G2iddtlH2
   ```
   **Verificar campos:** `epoBalance`, `contractBalance`, `contractBalanceBreakdown[1][last]`
   **Esperado:** Todos >= $0.00
   **Atual:** Todos **negativos**

6. **Verificar via banco de dados**
   ```sql
   -- Confirmar pagamento
   SELECT payment_amount, status FROM uown_sv_payment
   WHERE account_pk = {accountPk} AND status = 'PAID';

   -- Confirmar conta
   SELECT a.company, a.account_status, ss.term_in_months
   FROM uown_sv_account a
   JOIN uown_sv_sched_summary ss ON ss.account_pk = a.pk
   WHERE a.pk = {accountPk};
   ```

---

### Critérios de Aceitação

Após a correção, os seguintes critérios devem ser atendidos:

1. **API retorna HTTP 200** — Os endpoints `getPayoffAmount` e `getAccountSummary` devem retornar HTTP 200 (não 500) em todos os cenários (**CONCLUÍDO** — corrigido por `9885ca0e`)
2. **Campos nunca negativos** — `getPayoffAmount`, `epoBalance`, `contractBalance` e `contractBalanceBreakdown.Balance` devem sempre retornar valores >= $0.00 quando `totalPaid > contractTotal` (**NÃO ATENDIDO**)
3. **Conta permanece funcional** — Após o pagamento, a conta deve permanecer acessível no Servicing Portal sem erros (**CONCLUÍDO** — corrigido por `9885ca0e`)
4. **Contas não-16-meses não afetadas** — Contas com `term_in_months != 16` devem continuar funcionando normalmente (**CONCLUÍDO** — verificado com contas TerraceFinance e KS3015 de 13 meses)
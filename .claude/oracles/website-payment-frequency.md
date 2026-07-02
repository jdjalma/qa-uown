---
last-reviewed: 2026-07-01
last-reviewed-sha: cd2d2c8bfd07cf5275f605c259a88838168e6a09
covers:
  - src/pages/website/website-base.page.ts
  - src/pages/website/payment-frequency.page.ts
  - docs/knowledge-base/website-payment-frequency.md
  - docs/business-rules/07-modificacoes-conta.md
---

# website-payment-frequency — Mudar Frequência de Pagamento (Portal Website)

> Fluxo self-service do cliente no portal Website (`/payment-frequency`) para alterar a
> frequência de pagamento do lease (Weekly / Bi-Weekly / Semi-Monthly). Entrada:
> sidebar **Payments → Payment Flexibility** (`/payment-flexibility`) → card
> "Change your payment schedule" → **VIEW MY OPTIONS** → `/payment-frequency`.
>
> **Pré-condição obrigatória:** conta ACTIVE (`uown_sv_account.account_status='ACTIVE'`),
> cliente autenticado via OTP (ver oracle `login.md`).
>
> **Live-proven em sandbox** (2026-07-01): lead 98257 / account 17330, Bi-Weekly → Semi-Monthly
> (First=1, Second=15). Ver `docs/knowledge-base/website-payment-frequency.md` para o discovery completo.
>
> **Fontes primárias:**
> `docs/business-rules/07-modificacoes-conta.md §41 (Payment Frequency Modification), §34 (Rewind/Replay)` ·
> `docs/business-rules/04-calculos-financeiros.md §7 (Payment Calculator, installments by frequency)` ·
> `docs/knowledge-base/website-payment-frequency.md`

## Critérios de Aceitação

| ID | Critério | Oracle | Fonte |
|---|---|---|---|
| AC-01 | O dropdown "Payment Frequency" exclui a frequência atual e NUNCA lista Monthly | CT-01 | live sandbox ✓ |
| AC-02 | Selecionar Semi-Monthly revela First/Second Payment Day; First Payment Day tem exatamente as opções 1..17 | CT-02 | live sandbox ✓ |
| AC-03 | Second Payment Day só lista valores com gap 14–20 em relação ao First Payment Day selecionado | CT-03 | live sandbox ✓ |
| AC-04 | Salvar com par de dias válido → toast de sucesso + "Current Frequency" atualizado imediatamente (sem reload) | CT-04 | live sandbox ✓ |
| AC-05 | POST `/uown/svc/changePaymentFrequency` é disparado com payload correto (`accountPK`, `newFrequency`, `firstDueDay`, `secondDueDay`) | CT-05 | network capture ✓ |
| AC-06 | `uown_frequency_mods` registra a mudança com `agent='customer portal'`, `old_frequency`/`new_frequency` corretos (Regra #13) | CT-06 | DB live ✓ |
| AC-07 | `uown_sv_activity_log` registra `log_type='FREQUENCY_CHANGE'` com nota exata (Regra #13) | CT-07 | DB live ✓ |
| AC-08 | Rewind/Replay regenera o schedule: schedule anterior fica INACTIVE, novo schedule ACTIVE com contagem = `numOfPayments.{term}.{FREQ}`, sem duplicidade | CT-08 | DB live ✓ |
| AC-09 | Após a mudança, a próxima data de vencimento cai dentro de um intervalo de frequência (anti-drift — não meses/anos à frente) | CT-09 | live sandbox ✓ |
| AC-10 | "Current Frequency" persiste após reload/nova navegação | CT-10 | live sandbox ✓ |
| AC-11 | [CONFIRMED — defeito de UI] Para First Payment Day ∈ {14,15,16,17}, o conjunto de opções de Second Payment Day é truncado no dia calendário 31 em vez do range completo `first+14..first+20`, e o botão SAVE FREQUENCY permanece habilitado com o dia 31 selecionado (dia inexistente em abril/junho/setembro/novembro e a maioria dos fevereiros) | CT-11 | live sandbox — matriz completa ✓ |
| AC-12 | Selecionar Bi-Weekly como destino revela o campo "When is your next payday?" com um date-picker restrito a amanhã .. hoje+15 dias | CT-12 | live sandbox ✓ |
| AC-13 | Salvar Semi-Monthly→Bi-Weekly dispara `changePaymentFrequency` com payload `{accountPK, newFrequency:"BI_WEEKLY", nextPayDate}` (SEM firstDueDay/secondDueDay) e produz os mesmos efeitos colaterais (frequency_mods, activity log, regen, anti-drift) | CT-13 | live sandbox ✓ |
| AC-14 | Após 2 mudanças sucessivas na mesma conta (Bi-Weekly→Semi-Monthly→Bi-Weekly), a próxima data de vencimento continua próxima (sem drift progressivo) e `frequencyChanges` incrementa sem gate/bloqueio | CT-14 | live sandbox ✓ (sinal S3, não é o teste completo de ≥3 ciclos) |

## Cenários

```gherkin
Feature: website-payment-frequency — Change Payment Schedule (Website customer portal)

  Background:
    Given the customer is authenticated on the Website portal with an ACTIVE account
    And the customer navigates to Payment Flexibility and opens Change your payment schedule

  # ─── Dropdown option set (S4 / AC-01) ─────────────────────────────────────

  Scenario: [positive] CT-01 — Payment Frequency dropdown excludes the current frequency and never offers Monthly
    Given the account's current frequency is Bi-Weekly
    When the customer opens the Payment Frequency dropdown
    Then the dropdown lists exactly "Weekly" and "Semi-Monthly"
    And "Bi-Weekly" is not listed
    And "Monthly" is never listed

  # ─── Semi-Monthly day pickers (B1 / AC-02, AC-03) ─────────────────────────

  Scenario: [positive] CT-02 — First Payment Day offers exactly the 1-17 range
    Given the customer selected Semi-Monthly as the new frequency
    When the customer opens the First Payment Day dropdown
    Then the dropdown lists exactly the days 1 through 17
    And no day below 1 or above 17 is offered

  Scenario: [positive] CT-03 — Second Payment Day only offers a gap of 14 to 20 days from the First Payment Day
    Given the customer selected Semi-Monthly as the new frequency
    And the customer selected First Payment Day = 1
    When the customer opens the Second Payment Day dropdown
    Then the dropdown lists exactly the days 15 through 21
    And no day representing a gap smaller than 14 or larger than 20 is offered

  Scenario: [negative] CT-11 — Second Payment Day option set is truncated at a non-existent calendar day for high First Payment Day values
    Given the customer selected Semi-Monthly as the new frequency
    And the customer selected a First Payment Day of 14, 15, 16, or 17
    When the customer opens the Second Payment Day dropdown
    Then the option set is truncated at day 31 instead of offering the full 14-to-20-day gap range
    And the SAVE FREQUENCY button remains enabled even when day 31 is selected

  # ─── Bi-Weekly as target frequency (S2) ───────────────────────────────────

  Scenario: [positive] CT-12 — Selecting Bi-Weekly as the new frequency reveals the next payday field
    Given the customer's current frequency is Semi-Monthly
    When the customer selects Bi-Weekly as the new frequency
    Then a "When is your next payday?" date field is shown
    And only dates from tomorrow through 15 days from today are selectable

  Scenario: [positive] CT-13 — Saving a Semi-Monthly to Bi-Weekly change sends a next-payday-based request
    Given the customer selected Bi-Weekly as the new frequency and a valid next payday within the allowed range
    When the customer saves the new payment schedule
    Then a request is sent with the account identifier, the new frequency "BI_WEEKLY", and the selected next payday
    And no first or second payment day fields are included in the request

  Scenario: [positive] CT-14 — A second consecutive frequency change does not drift the schedule
    Given the customer already changed frequency once on this account
    When the customer performs a second frequency change
    Then the next payment due date after the second change is still within one frequency interval of today
    And the frequency-change counter increments without any save being blocked

  # ─── Save happy path + side effects (S1/S3 / AC-04 through AC-09) ─────────

  Scenario: [positive] CT-04 — Saving a valid Bi-Weekly to Semi-Monthly change updates the UI immediately
    Given the customer selected Semi-Monthly, First Payment Day = 1, and Second Payment Day = 15
    When the customer saves the new payment schedule
    Then a success toast reading "Payment frequency updated successfully" is shown
    And the Current Frequency label updates to "Semi-Monthly" without a page reload

  Scenario: [positive] CT-05 — Saving the new schedule sends the correct request to the backend
    Given the customer selected Semi-Monthly, First Payment Day = 1, and Second Payment Day = 15
    When the customer saves the new payment schedule
    Then a request is sent with the account identifier, the new frequency "SEMI_MONTHLY", first due day 1, and second due day 15

  Scenario: [positive] CT-06 — The frequency change is recorded in the audit trail
    Given the customer saved a change from Bi-Weekly to Semi-Monthly
    When the frequency modification audit trail is inspected
    Then a new record shows the previous frequency Bi-Weekly, the new frequency Semi-Monthly, and the actor "customer portal"

  Scenario: [positive] CT-07 — The frequency change is recorded in the account activity log
    Given the customer saved a change from Bi-Weekly to Semi-Monthly
    When the account activity log is inspected
    Then an entry of type "FREQUENCY_CHANGE" reads "Payment frequency changed from BI_WEEKLY to SEMI_MONTHLY"

  Scenario: [positive] CT-08 — The payment schedule is regenerated without duplication
    Given the customer saved a change from Bi-Weekly to Semi-Monthly
    When the account's payment schedule is inspected
    Then the previous schedule's installments are deactivated
    And exactly one active installment set exists matching the Semi-Monthly plan for the account's term
    And the active installment count matches the configured number of Semi-Monthly payments for that term

  Scenario: [positive] CT-09 — The next due date does not drift far into the future after a single change
    Given the customer saved a change from Bi-Weekly to Semi-Monthly with Second Payment Day = 15
    When the updated schedule is inspected
    Then the next payment due date falls on the selected Second Payment Day of the current or next applicable cycle
    And the next payment due date is not months or years in the future

  # ─── Persistence (S5 / AC-10) ─────────────────────────────────────────────

  Scenario: [positive] CT-10 — The selected frequency persists after navigating away and back
    Given the customer saved a change from Bi-Weekly to Semi-Monthly
    When the customer reloads or re-enters the Change your payment schedule page
    Then the Current Frequency label still reads "Semi-Monthly"
```

---

## Oracle

**Verificação de desatualização (executar antes de qualquer Oracle):**
```bash
git log cd2d2c8bfd07cf5275f605c259a88838168e6a09..HEAD -- src/pages/website/website-base.page.ts src/pages/website/payment-frequency.page.ts docs/knowledge-base/website-payment-frequency.md docs/business-rules/07-modificacoes-conta.md
```
Saída não vazia → prefixar o relatório com `[BDD MAY BE STALE]`.

### Oracle CT-01 — Dropdown de frequência (exclusão da atual + Monthly nunca listado)

**Checkpoints:**
1. Navegar para `/payment-frequency` com a conta em Bi-Weekly
2. Abrir o combobox "Payment Frequency"
3. As opções são exatamente `Weekly` e `Semi-Monthly`
4. `Bi-Weekly` (atual) NÃO aparece na lista
5. `Monthly` NUNCA aparece na lista

### Oracle CT-02 — First Payment Day = 1..17

**Checkpoints:**
1. Selecionar "Semi-Monthly" no dropdown de frequência
2. Abrir o combobox "First Payment Day"
3. As opções são exatamente os inteiros 1 a 17 (17 opções)

### Oracle CT-03 — Second Payment Day gap 14–20

**Checkpoints:**
1. Com First Payment Day = 1, abrir o combobox "Second Payment Day"
2. As opções são exatamente 15, 16, 17, 18, 19, 20, 21 (7 opções)

### Oracle CT-04 — Toast + label imediatos

**Checkpoints:**
1. Selecionar Semi-Monthly, First=1, Second=15
2. Clicar "SAVE FREQUENCY"
3. Toast de sucesso com texto exato `"Payment frequency updated successfully"` fica visível
4. O label "Current Frequency" no card "Current Plan" muda para `"Semi-Monthly"` sem reload de página

### Oracle CT-05 — Payload do POST changePaymentFrequency

**Checkpoints (network capture via MCP `browser_network_requests` / `browser_network_request`):**
1. Requisição `POST /uown/svc/changePaymentFrequency` é disparada ao clicar SAVE FREQUENCY
2. Corpo da requisição: `{"accountPK": <accountPk>, "newFrequency": "SEMI_MONTHLY", "firstDueDay": 1, "secondDueDay": 15}`
3. Resposta HTTP 200 com `schedSummaryInfo.paymentFrequency = "SEMI_MONTHLY"`

```sql
-- Evidência live sandbox (account 17330, lead 98257, 2026-07-01):
-- request:  {"accountPK":17330,"newFrequency":"SEMI_MONTHLY","firstDueDay":1,"secondDueDay":15}
-- response: schedSummaryInfo.paymentFrequency = "SEMI_MONTHLY", nextPaymentDueDate = "2026-07-15"
```

### Oracle CT-06 — DB: uown_frequency_mods (Regra #13)

**Query de verificação:**
```sql
SELECT agent, old_frequency, new_frequency, first_due_date, second_due_date, row_created_timestamp
FROM uown_frequency_mods
WHERE account_pk = <accountPk>
ORDER BY pk DESC LIMIT 1;
-- Esperado: agent = 'customer portal', old_frequency = 'BI_WEEKLY', new_frequency = 'SEMI_MONTHLY'
-- Evidência live sandbox: pk=74, account_pk=17330, agent='customer portal',
--   old_frequency='BI_WEEKLY', new_frequency='SEMI_MONTHLY',
--   first_due_date=2026-07-01, second_due_date=2026-07-15
```

**Checkpoints:**
1. Ao menos 1 linha nova após o Save
2. `agent = 'customer portal'` (NÃO 'SYSTEM', NÃO o nome do cliente)
3. `old_frequency` / `new_frequency` corretos

### Oracle CT-07 — DB: uown_sv_activity_log (Regra #13)

**Query de verificação:**
```sql
SELECT log_type, created_by, creation_source, notes, row_created_timestamp
FROM uown_sv_activity_log
WHERE account_pk = <accountPk>
  AND log_type = 'FREQUENCY_CHANGE'
ORDER BY pk DESC LIMIT 1;
-- Esperado: created_by='customer portal', creation_source='USER_ACTION',
--   notes='Payment frequency changed from BI_WEEKLY to SEMI_MONTHLY'
-- Evidência live sandbox: pk=11011262, account_pk=17330
```

**Checkpoints:**
1. Ao menos 1 linha `log_type='FREQUENCY_CHANGE'`
2. `notes` casa exatamente com `'Payment frequency changed from BI_WEEKLY to SEMI_MONTHLY'` (adaptar para o par de frequências do cenário)
3. `created_by = 'customer portal'`

### Oracle CT-08 — DB: uown_sv_receivable (Rewind/Replay, §34)

**Query de verificação:**
```sql
SELECT status, receivable_type, COUNT(*)
FROM uown_sv_receivable
WHERE account_pk = <accountPk>
GROUP BY status, receivable_type
ORDER BY 1,2;
-- Esperado: exatamente 1 linha ACTIVE/EARLY_PAY_OFF e N linhas ACTIVE/REGULAR_PAYMENT
--   (N = numOfPayments.{term}.SEMI_MONTHLY), restante INACTIVE
-- Evidência live sandbox: ACTIVE/EARLY_PAY_OFF=1, ACTIVE/REGULAR_PAYMENT=26 (termo 13m),
--   INACTIVE/EARLY_PAY_OFF=2, INACTIVE/REGULAR_PAYMENT=56 (schedule anterior desativado)
```

**Checkpoints:**
1. Exatamente 1 linha `ACTIVE`/`EARLY_PAY_OFF`
2. Contagem de `ACTIVE`/`REGULAR_PAYMENT` == configuração `numOfPayments.{term}.{FREQ}`
3. Nenhuma duplicidade de conjuntos ACTIVE (schedule anterior corretamente marcado INACTIVE)

### Oracle CT-09 — Anti-drift (AC1 refinado)

**Checkpoints:**
1. Consultar `nextPaymentDueDate` na resposta do `changePaymentFrequency` (ou `getSchedSummaryForAccount`)
2. A data cai no próximo Second Payment Day (Semi-Monthly) ou dentro de ~15 dias (Bi-Weekly) a partir de hoje
3. A data NÃO está a meses/anos de distância (o sintoma do bug original ACCT 545697: 12/30/2027)

### Oracle CT-10 — Persistência

**Checkpoints:**
1. Após o Save, navegar para outra página e retornar a `/payment-frequency` (ou dar reload)
2. O label "Current Frequency" ainda reflete o novo valor salvo

### Oracle CT-11 — [CANDIDATE BUG] Second Payment Day colapsa com First=17

**Checkpoints:**
1. Selecionar Semi-Monthly, First Payment Day = 17
2. Abrir o combobox "Second Payment Day"
3. **Observado:** única opção "31" (dia inexistente em abril/junho/setembro/novembro/fevereiro)
4. Classificação: `[HYPOTHESIS]` — não confirmado como causa raiz do bug histórico de drift, mas mesma classe de defeito (aritmética de dia ignorando limites do mês); reportar ao PO/dev para triagem, não bloquear o gate de descoberta.

---

## Pendências (para o `qa-implementer`)

1. **Bi-Weekly como destino (S2)** — este pass de discovery só exercitou Bi-Weekly como frequência de PARTIDA. Repetir a navegação selecionando Bi-Weekly como NOVO valor (a partir de Semi-Monthly) para confirmar se existe (ou não) um campo "next payday" — a SPEC assumiu esse campo, mas não foi observado neste pass.
2. **CT-11 (dia 31)** — mapear sistematicamente quais valores de First Payment Day (1..17) produzem opções anômalas de Second Payment Day, e se o Save é sequer alcançável com o dia 31 selecionado.
3. **`planId` obsoleto pós-mudança** (RN-11 no KB) — verificar se alguma tela do cliente ou do agente renderiza esse campo após a mudança de frequência.

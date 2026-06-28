---
last-reviewed: 2026-06-28
last-reviewed-sha: ff4f0fc
covers:
  - src/pages/origination/funding.page.ts
  - src/pages/origination/customer.page.ts
  - docs/business-rules/08-funding-merchants.md
  - docs/knowledge-base/origination-funding-queue-page.md
  - src/selectors/common.selectors.ts
---

# Funded — Transição FUNDING → FUNDED na Fila de Financiamento

> Operação realizada pelo time de ops/financiamento no portal Origination (`/funding`).
> Um lead em status `FUNDING` (pós-assinatura + `settleApplication`) é selecionado na fila
> e promovido para `FUNDED`, indicando que o merchant recebeu o pagamento e pode liberar
> o produto ao cliente.
>
> **Pré-condição obrigatória:** lead em `FUNDING` (vem de `SIGNED → settleApplication`).
> O portal não exibe o lead na fila se ele ainda não atingiu `FUNDING`.
>
> **Fluxo de 4 passos (confirmado via código `funding.page.ts:165-201`):**
> 1. Selecionar o checkbox da linha do lead
> 2. Clicar no dropdown **"Send to FUNDED"**
> 3. Selecionar a opção **"FUNDED"** no menu dropdown (`#FUNDED`)
> 4. Clicar no botão primário **"SEND"** de confirmação
>
> **Consequências do FUNDED (regra de negócio `08-funding-merchants.md §9-10`):**
> - `uown_los_lead.lead_status` → `FUNDED`
> - `uown_los_lead.fund_date_time` preenchido
> - `uown_funding_transaction.funding_queue_status` → `FUNDED`
> - `uown_funding_transaction.fund_date_time` preenchido
> - `uown_funding_modification` registra a transição (FUNDING → FUNDED)
> - `uown_funding_transaction.user_notes` atualizado com mensagem de sistema
> - `uown_los_lead_notes` recebe nota de atividade (Regra #13)
> - Importação LOS → SVC: `uown_sv_account` (`account_status='ACTIVE'`) **já existe** — é criado na
>   transição para **FUNDING** (via `settleApplication`), NÃO no FUNDED. Live-proven em `funding.md` CT-04
>   (lead 7218271: ao virar FUNDING já havia `uown_sv_account` pk 622660 ACTIVE). No FUNDED a account já está pronta.
> - Welcome email enviado ao cliente
> - Webhook `FUNDED` disparado ao merchant (se `useWebhook=true`)
>
> **Fontes primárias:**
> `src/pages/origination/funding.page.ts` ·
> `docs/business-rules/08-funding-merchants.md §9 (Funding Queue) e §10 (LOS-SVC Import)` ·
> `docs/knowledge-base/origination-funding-queue-page.md`

## Critérios de Aceitação

| ID | Critério | Oracle | Fonte |
|---|---|---|---|
| AC-01 | Lead em FUNDING aparece na Funding Queue (`/funding`) com Status=FUNDING e Funding Queue Status=FUNDING | CT-01 | knowledge-base + code ✓ |
| AC-02 | Status* filter carrega com "Funding" pré-selecionado por padrão ao abrir a página | CT-01 | knowledge-base live stg 2026-06-25 ✓ |
| AC-03 | Fluxo bulk: checkbox → "Send to FUNDED" → opção FUNDED (`#FUNDED`) → botão SEND primário | CT-02 | code funding.page.ts:165-201 ✓ |
| AC-04 | Toast de sucesso (`.Toastify__toast-body`) fica visível após o SEND; nenhum toast de erro | CT-03 | code funding.page.ts:199-200 ✓ |
| AC-05 | Lead desaparece da fila ao re-buscar com filtro FUNDING após ser promovido para FUNDED | CT-04 | business-rule §9 + lógica de filtro ✓ |
| AC-06 | `uown_los_lead.lead_status = 'FUNDED'` e `fund_date_time IS NOT NULL` após a transição | CT-05 | DB schema + business-rule §9 ✓ |
| AC-07 | `uown_funding_transaction.funding_queue_status = 'FUNDED'` e `fund_date_time IS NOT NULL` | CT-06 | DB schema funding_transaction ✓ |
| AC-08 | `uown_funding_modification` contém linha com `old_funding_queue_status='FUNDING'`, `new_funding_queue_status='FUNDED'`, `old_lead_status='FUNDING'`, `new_lead_status='FUNDED'` | CT-07 | DB schema funding_modification ✓ |
| AC-09 | `uown_funding_transaction.user_notes` contém padrão `{username} changed status from FUNDING to FUNDED` (username = agente que executou a ação, e.g. "manager") | CT-08 | DB live stg lead 7218242 ✓ |
| AC-10 | `uown_los_lead_notes` contém nota de atividade para a transição FUNDED (Regra #13) | CT-09 | CLAUDE.md rule #13 ✓ |
| AC-11 | `getApplicationStatus` retorna `fundedDateTime` preenchido e `amountToBeFunded > 0` | CT-10 | API response type fundedDateTime ✓ |
| AC-12 | `uown_sv_account` (com `lead_pk`) **já existe** no FUNDED — criado na transição para FUNDING (ver `funding.md` CT-04), persiste no FUNDED | CT-11 | live stg `funding.md` ✓ |
| AC-13 | `uown_sv_account.import_date_time IS NOT NULL` e `account_status = 'ACTIVE'` | CT-11 | DB schema uown_sv_account ✓ |

## Cenários

```gherkin
Feature: Funded — Transição FUNDING → FUNDED na Fila de Financiamento

  Background:
    Given um lead foi criado via sendApplication e aprovado (UW_APPROVED)
    And o cliente preencheu CC/ACH e assinou o contrato (lead em SIGNED)
    And settleApplication foi chamado com sucesso e o lead está em FUNDING
    And o agente de financiamento está autenticado no portal Origination

  # ─── Visualização na Fila ─────────────────────────────────────────────────────

  Scenario: [positive] CT-01 — Lead FUNDING aparece na fila com filtro padrão
    Given o agente navega para /funding
    When a página carrega
    Then o filtro Status* exibe "Funding" pré-selecionado
    And clicar Search retorna ao menos uma linha com o lead em Status=FUNDING
    And a coluna "Funding Queue Status" da linha exibe "FUNDING"
    And a coluna "User Notes" exibe o padrão "MM/DD/YYYY : SYSTEM changed status from SIGNED to FUNDING"

  # ─── Fluxo de Transição ───────────────────────────────────────────────────────

  Scenario: [positive] CT-02 — Fluxo completo de bulk action FUNDING → FUNDED + log de atividade (Regra #13)
    Given a tabela da fila exibe ao menos uma linha em FUNDING
    When o agente marca o checkbox da linha do lead
    And clica no botão dropdown "Send to FUNDED"
    And seleciona a opção "FUNDED" no menu (#FUNDED)
    And clica no botão primário "SEND" de confirmação
    Then o spinner desaparece
    And nenhum .Toastify__toast--error é exibido
    # ── Consequências obrigatórias (Regra #13: toda ação de negócio exige log) ──
    And uown_los_lead_notes contém nota com padrão "[updateFundingStatus] OldLeadStatus : FUNDING New LeadStatus : FUNDED"
    And uown_funding_transaction.user_notes contém "{username} changed status from FUNDING to FUNDED"
    And uown_funding_modification tem linha com old_funding_queue_status='FUNDING' e new_funding_queue_status='FUNDED'

  Scenario: [positive] CT-03 — Toast de sucesso após confirmação SEND
    Given o agente concluiu o fluxo CT-02 (checkbox → Send to FUNDED → FUNDED → SEND)
    When o backend processa a transição
    Then o elemento .Toastify__toast-body fica visível na tela
    And nenhum .Toastify__toast--error ou .Toastify__toast--warning é exibido

  Scenario: [positive] CT-03b — Nota de FUNDED visível no card "Notes" da página do cliente (UI — Regra #13 + #14)
    # Ponto de verificação UI obrigatório: o agente de ops deve ver a nota no portal, não apenas no DB.
    # ⚠️ O card chama-se "Notes" (NÃO "Activity") — colunas Date | Type | User ID | Notes.
    #    Live-proven em funding.md CT-05b: SELECTORS.activityLogEntry (ancorado em "Activity") NÃO casa esta página.
    Given o lead foi promovido para FUNDED (CT-02 concluído)
    When o agente navega para {originationUrl}/customers/{leadPk}
    And o card "Notes" carrega
    Then existe uma linha Type=STATUS_CHANGE / User ID=SYSTEM referente à transição para FUNDED ("Funding Status is updated from FUNDING to FUNDED")
    And a entrada mais recente referencia a transição FUNDING → FUNDED

  Scenario: [positive] CT-04 — Lead desaparece do filtro FUNDING após ser fundado
    Given o agente está na Funding Queue com filtro Status*=FUNDING
    And o lead foi promovido para FUNDED (CT-02 concluído)
    When o agente clica Search novamente
    Then o lead NÃO aparece mais na tabela com Status=FUNDING
    And a tabela mostra "There are no records to display" se não houver outros leads em FUNDING

  # ─── Validações de Banco — LOS ───────────────────────────────────────────────

  Scenario: [positive] CT-05 — uown_los_lead atualizado para FUNDED
    Given o lead foi promovido para FUNDED via Funding Queue
    When consultamos o banco de dados
    Then uown_los_lead.lead_status = 'FUNDED' para o lead_pk
    And uown_los_lead.fund_date_time IS NOT NULL

  Scenario: [positive] CT-06 — uown_funding_transaction atualizado
    Given o lead foi promovido para FUNDED via Funding Queue
    When consultamos uown_funding_transaction WHERE lead_pk = <lead_pk>
    Then funding_queue_status = 'FUNDED'
    And fund_date_time IS NOT NULL
    And amount_to_be_funded > 0

  Scenario: [positive] CT-07 — uown_funding_modification registra a transição
    Given o lead foi promovido para FUNDED via Funding Queue
    When consultamos uown_funding_modification WHERE lead_pk = <lead_pk> ORDER BY pk DESC LIMIT 1
    Then old_funding_queue_status = 'FUNDING'
    And new_funding_queue_status = 'FUNDED'
    And old_lead_status = 'FUNDING'
    And new_lead_status = 'FUNDED'

  Scenario: [positive] CT-08 — User Notes atualizado na funding transaction
    Given o lead foi promovido para FUNDED via Funding Queue
    When consultamos uown_funding_transaction.user_notes WHERE lead_pk = <lead_pk>
    Then o campo user_notes contém o padrão "{username} changed status from FUNDING to FUNDED"
    # Nota: "SYSTEM" é usado para transições automáticas (e.g. READY_TO_FUND→FUNDING)
    # A transição manual FUNDING→FUNDED usa o nome do agente logado (e.g. "manager")
    And o texto inclui o timestamp no formato "MM/DD/YYYY : {username} changed status from FUNDING to FUNDED"

  Scenario: [positive] CT-09 — uown_los_lead_notes registra o evento (Regra #13)
    Given o lead foi promovido para FUNDED via Funding Queue
    When consultamos uown_los_lead_notes WHERE lead_pk = <lead_pk> ORDER BY pk DESC
    Then ao menos uma nota contém "FUNDED" ou "FUNDING" ou "funded" referindo a transição
    And o registro confirma que a ação de funding foi auditada no sistema

  # ─── API ─────────────────────────────────────────────────────────────────────

  Scenario: [positive] CT-10 — getApplicationStatus reflete o estado FUNDED
    Given o lead foi promovido para FUNDED via Funding Queue
    When chamamos POST /uown/los/getApplicationStatus com merchantNumber e leadUuid
    Then response.currentStatus = 'FUNDED'
    And response.fundedDateTime IS NOT NULL (campo preenchido)
    And response.amountToBeFunded > 0

  # ─── Importação LOS → SVC ────────────────────────────────────────────────────

  Scenario: [positive] CT-11 — uown_sv_account criado após FUNDED
    Given o lead foi promovido para FUNDED via Funding Queue
    When consultamos uown_sv_account WHERE lead_pk = <lead_pk>
    Then ao menos 1 linha existe (conta SVC criada pela importação LOS→SVC)
    And import_date_time IS NOT NULL
    And account_status = 'ACTIVE'
```

---

## Oracle

### Oracle CT-01 — Lead FUNDING na Fila

**Staleness check:**
```bash
git log ff4f0fc..HEAD -- src/pages/origination/funding.page.ts src/pages/origination/customer.page.ts docs/business-rules/08-funding-merchants.md docs/knowledge-base/origination-funding-queue-page.md src/selectors/common.selectors.ts
```

**Checkpoints:**
1. Navegar para `{originationUrl}/funding`
2. Status* filter mostra "Funding" pré-selecionado (sem necessidade de alteração manual)
3. Clicar Search → linha do lead aparece com Status=`FUNDING` e Funding Queue Status=`FUNDING`
4. Coluna "User Notes" exibe padrão com `SYSTEM changed status from SIGNED to FUNDING`

---

### Oracle CT-02 — Fluxo de Transição Bulk + Log de Atividade (Regra #13)

**Checkpoints (UI):**
1. Checkbox da primeira linha marcado (`.rdt_TableCell input[type=checkbox]` ou seletor de linha)
2. Botão `button:has-text('Send to FUNDED')` visível e clicável
3. Menu dropdown abre com opção `FUNDED` (seletor `#FUNDED`)
4. Botão `button.btn-primary:has-text('SEND')` aparece e é clicável após selecionar FUNDED
5. Spinner aparece durante o processamento e desaparece ao concluir
6. Ausência de `.Toastify__toast--error` após SEND

**Checkpoints obrigatórios de log (Regra #13 — imediatamente após o SEND):**
```sql
-- 7. Log de atividade no LOS (uown_los_lead_notes)
SELECT pk, notes FROM uown_los_lead_notes
WHERE lead_pk = <lead_pk>
  AND notes ILIKE '%updateFundingStatus%FUNDING%FUNDED%'
ORDER BY pk DESC LIMIT 1;
-- Esperado: 1 linha com "[updateFundingStatus] OldLeadStatus : FUNDING New LeadStatus : FUNDED"
-- Evidência: lead 7218242 stg, pk=84564171

-- 8. User notes na funding transaction
SELECT user_notes FROM uown_funding_transaction
WHERE lead_pk = <lead_pk> ORDER BY pk DESC LIMIT 1;
-- Esperado: contém "{username} changed status from FUNDING to FUNDED"
-- Evidência: lead 7218242 stg: "06/27/2026 : manager changed status from FUNDING to FUNDED"

-- 9. Registro de modificação de funding
SELECT old_funding_queue_status, new_funding_queue_status FROM uown_funding_modification
WHERE lead_pk = <lead_pk>
  AND old_funding_queue_status = 'FUNDING'
  AND new_funding_queue_status = 'FUNDED'
ORDER BY pk DESC LIMIT 1;
-- Esperado: 1 linha confirmando a transição
```

---

### Oracle CT-03 — Toast de Sucesso

**Checkpoints (UI):**
1. `.Toastify__toast-body` fica visível (`state: 'visible'`, timeout 20s)
2. Ausência de `.Toastify__toast--error` na tela após o SEND

---

### Oracle CT-03b — Card "Notes" na página do cliente (UI)

> **✅ Selector endurecido (live em `funding.md` CT-05b, stg 2026-06-28):** na página `/customers/{leadPk}` o card é
> **"Notes"** (NÃO "Activity"): react-data-table **Date | Type | User ID | Notes** + Filters + paginação. O
> `SELECTORS.activityLogEntry` foi reescrito para ancorar no título "Notes" e pegar as `rdt_TableRow` do corpo, e
> `getActivityLogEntries()` agora faz scroll+wait. Para o FUNDED, mire a linha `STATUS_CHANGE` / `SYSTEM`
> ("Funding Status is updated from FUNDING to FUNDED").

**URL:** `{originationUrl}/customers/{leadPk}` · **Card:** header `text='Notes'`

**Checkpoints (UI):**
1. Navegar para a página do cliente após CT-02
2. Aguardar o card "Notes" carregar (header `text='Notes'` + tabela Date/Type/User ID/Notes)
3. Existe linha `STATUS_CHANGE` / `SYSTEM` casando a transição FUNDING → FUNDED ("Funding Status is updated from FUNDING to FUNDED")
4. A entrada mais recente referencia a transição FUNDING → FUNDED

```typescript
// Exemplo de assert em teste:
const entries = await customerPage.getActivityLogEntries();
const fundedEntry = entries.find(e =>
  e.includes('FUNDED') || e.toLowerCase().includes('funded')
);
expect(fundedEntry, 'Activity card deve exibir nota de transição FUNDED').toBeTruthy();
```

---

### Oracle CT-04 — Lead some da fila FUNDING

**Checkpoints (UI + DB):**
1. Após CT-02, clicar Search com filtro Status*=FUNDING
2. O lead não aparece mais entre os resultados
3. DB: `uown_los_lead.lead_status = 'FUNDED'` confirma que não é bug de filtro

---

### Oracle CT-05 — DB: uown_los_lead

**Query de verificação:**
```sql
SELECT lead_status, fund_date_time
FROM uown_los_lead
WHERE pk = <lead_pk>;
-- Esperado: lead_status = 'FUNDED', fund_date_time IS NOT NULL
```

**Checkpoints:**
1. `lead_status = 'FUNDED'`
2. `fund_date_time IS NOT NULL`

---

### Oracle CT-06 — DB: uown_funding_transaction

**Query de verificação:**
```sql
SELECT funding_queue_status, fund_date_time, amount_to_be_funded
FROM uown_funding_transaction
WHERE lead_pk = <lead_pk>
ORDER BY pk DESC
LIMIT 1;
-- Esperado: funding_queue_status = 'FUNDED', fund_date_time IS NOT NULL, amount_to_be_funded > 0
```

**Checkpoints:**
1. `funding_queue_status = 'FUNDED'`
2. `fund_date_time IS NOT NULL`
3. `amount_to_be_funded > 0`

---

### Oracle CT-07 — DB: uown_funding_modification

**Query de verificação:**
```sql
SELECT old_funding_queue_status, new_funding_queue_status,
       old_lead_status, new_lead_status, username, row_created_timestamp
FROM uown_funding_modification
WHERE lead_pk = <lead_pk>
ORDER BY pk DESC
LIMIT 1;
-- Esperado: FUNDING → FUNDED em ambos funding_queue_status e lead_status
```

**Checkpoints:**
1. `old_funding_queue_status = 'FUNDING'`
2. `new_funding_queue_status = 'FUNDED'`
3. `old_lead_status = 'FUNDING'`
4. `new_lead_status = 'FUNDED'`
5. `username` não nulo (identifica o agente que realizou a ação)

---

### Oracle CT-08 — DB: user_notes na funding_transaction

**Query de verificação:**
```sql
SELECT user_notes
FROM uown_funding_transaction
WHERE lead_pk = <lead_pk>
ORDER BY pk DESC
LIMIT 1;
-- Esperado: 'MM/DD/YYYY : {username} changed status from FUNDING to FUNDED'
-- Evidência live stg lead 7218242: "06/27/2026 : manager changed status from FUNDING to FUNDED"
-- NOTA: transições MANUAIS usam o nome do agente (não "SYSTEM").
-- "SYSTEM" aparece apenas em transições automáticas (ex: READY_TO_FUND → FUNDING).
```

**Checkpoints:**
1. `user_notes` não é nulo
2. `user_notes ILIKE '%changed status from FUNDING to FUNDED%'`

---

### Oracle CT-09 — DB: uown_los_lead_notes (Regra #13)

**Query de verificação:**
```sql
SELECT pk, notes, row_created_timestamp
FROM uown_los_lead_notes
WHERE lead_pk = <lead_pk>
  AND notes ILIKE '%updateFundingStatus%FUNDING%FUNDED%'
ORDER BY pk DESC
LIMIT 3;
-- Evidência live stg lead 7218242 (pk 84564171):
-- "[updateFundingStatus] OldLeadStatus : FUNDING New LeadStatus : FUNDED"
```

**Checkpoints:**
1. Ao menos 1 linha retornada
2. `notes ILIKE '%[updateFundingStatus]%FUNDING%FUNDED%'`

---

### Oracle CT-10 — API: getApplicationStatus

**Endpoint:** `POST /uown/los/getApplicationStatus`

**Body:**
```json
{ "merchantNumber": "<merchantNumber>", "leadUuid": "<leadUuid>" }
```

**Checkpoints:**
1. `response.status = 200`
2. `response.body.currentStatus = 'FUNDED'`
3. `response.body.fundedDateTime IS NOT NULL` (campo não nulo)
4. `response.body.amountToBeFunded > 0`

---

### Oracle CT-11 — DB: uown_sv_account (Importação LOS→SVC)

**Query de verificação:**
```sql
SELECT pk, account_status, import_date_time, activation_date
FROM uown_sv_account
WHERE lead_pk = <lead_pk>;
-- Esperado: 1 linha criada, account_status = 'ACTIVE', import_date_time IS NOT NULL
```

**Checkpoints:**
1. Exatamente 1 linha retornada (conta SVC criada)
2. `account_status = 'ACTIVE'`
3. `import_date_time IS NOT NULL`

> **Nota de timing:** a importação LOS→SVC é **síncrona** — ocorre dentro da mesma transação
> do funding. Evidência live stg: leads 7218240/7218241 com `import_date_time` antes de
> `fund_date_time` confirmam que o SVC account é criado antes do `fund_date_time` ser
> gravado em `uown_los_lead`. Se a query retornar 0 linhas, o lead não chegou a FUNDED.

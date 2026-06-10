---

https://gitlab.com/uown/backend/svc/-/work_items/455

**Projeto:** uown/backend/svc
**Milestone:** Uown | RU03.26.1.50.0
**Labels:** dev::backend · priority::medium · workflow::ready-for-qa

---

# UOWN | SVC | Analyze and Optimize High CPU Usage Queries (query-5)

## Synopsis

Database queries have been identified as causing **high CPU usage and excessive database resource consumption**, resulting in **system slowness** and direct impact on the end-user experience. This ticket aims to analyze and optimize `SmsOptInConfirmationResponse.sql`.

## Business Objective

Reducing excessive database resource consumption is critical to ensure platform stability, improve response times, and prevent negative impact on end users. Optimizing these queries directly supports system performance, scalability, and reliability.

## Feature Request | Business Requirements

- Analyze the attached query causing high CPU and database resource usage.
- Identify performance bottlenecks within the query.
- Propose and implement optimizations to:
  - Reduce CPU usage
  - Improve index and database resource utilization
  - Enhance response times
- Ensure that optimizations **do not change the functional behavior** of the affected features.
- Validate that no functional regression or negative user impact occurs after optimization.

## Query Analisada (query-5)

**Arquivo:** `src/main/resources/sqls/SmsOptInConfirmationResponse.sql`

```sql
SELECT
  GREATEST( COUNT(sms.pk),
    CASE
      WHEN $1 IS NOT NULL AND EXISTS ( SELECT $2 FROM uown_sv_account a WHERE a.pk = $3 AND a.company = $4 ) THEN $5
      ELSE $6
  END
    ) AS "smsCount"
FROM
  uown_sms_queue sms
WHERE
  ($7 IS NOT NULL
    AND sms.lead_pk = $8)
  OR ($9 IS NOT NULL
    AND sms.account_pk = $10)
```

**Query otimizada atual (`SmsOptInConfirmationResponse.sql`):**

```sql
WITH account_check AS (
    SELECT CASE
        WHEN :accountPk IS NOT NULL
             AND EXISTS (SELECT 1 FROM uown_sv_account a WHERE a.pk = :accountPk AND a.company = 'KORNERSTONE')
        THEN 1
        ELSE 0
    END AS is_kornerstone_account
),
sms_count AS (
    SELECT COUNT(*) AS cnt
    FROM (
        SELECT pk FROM uown_sms_queue WHERE :leadPk IS NOT NULL AND lead_pk = :leadPk
        UNION ALL
        SELECT pk FROM uown_sms_queue WHERE :accountPk IS NOT NULL AND account_pk = :accountPk
    ) combined
)
SELECT GREATEST(
    (SELECT cnt FROM sms_count),
    (SELECT is_kornerstone_account FROM account_check)
) AS "smsCount";
```

## Otimização Implementada

**Flyway Migration:** `V20260220050615__sms_opt_in_confirmation_response_indexes.sql`

```sql
CREATE INDEX IF NOT EXISTS idx_uown_sms_queue_lead_pk
  ON public.uown_sms_queue USING btree (lead_pk) WHERE lead_pk IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_uown_sms_queue_account_pk
  ON public.uown_sms_queue USING btree (account_pk) WHERE account_pk IS NOT NULL;

DROP INDEX IF EXISTS idx_uown_sms_queue_lead_account_pk;
```

**Mudanças:**
- Criados dois índices parciais separados (WHERE col IS NOT NULL) em vez de um índice composto
- Índice antigo `idx_uown_sms_queue_lead_account_pk` removido
- Query refatorada para CTE (WITH) para melhor legibilidade e plano de execução

## Contexto Técnico

- **Tabela:** `uown_sms_queue`
- **Serviço Java:** `SmsService.checkFirstSms(leadPk, accountPk)` → retorna `count.equals(0)`
- **Uso:** Verificação de opt-in de SMS durante o fluxo de aplicação (lead) e conta (servicing)
- **Contas Kornerstone:** `is_kornerstone_account = 1` → GREATEST força smsCount ≥ 1 → checkFirstSms = false

---

## User Stories (US)

### US01 — Índices parciais criados e índice antigo removido

> **Como** DBA ou engenheiro de infraestrutura,
> **Quero** verificar que os novos índices parciais `idx_uown_sms_queue_lead_pk` e `idx_uown_sms_queue_account_pk` foram criados no banco de dados
> **E que** o índice antigo `idx_uown_sms_queue_lead_account_pk` foi removido,
> **Para que** a query `SmsOptInConfirmationResponse.sql` utilize os índices corretos e execute com menor CPU.

**Critérios de Aceite:**
- Índice `idx_uown_sms_queue_lead_pk` existe em `uown_sms_queue` com condição `WHERE lead_pk IS NOT NULL`
- Índice `idx_uown_sms_queue_account_pk` existe em `uown_sms_queue` com condição `WHERE account_pk IS NOT NULL`
- Índice `idx_uown_sms_queue_lead_account_pk` NÃO existe
- Migration Flyway `V20260220050615` registrada em `flyway_schema_history`

---

### US02 — Comportamento funcional do checkFirstSms para leads comuns

> **Como** sistema de originação,
> **Quero** que `SmsService.checkFirstSms` retorne `true` (sem SMS anterior) para um lead novo sem histórico de SMS,
> **Para que** o opt-in de SMS seja exibido corretamente ao cliente durante a aplicação.

**Critérios de Aceite:**
- Lead sem registro em `uown_sms_queue` → `smsCount = 0` → `checkFirstSms = true`
- Após envio de 1 SMS → `smsCount = 1` → `checkFirstSms = false`
- Resultado consistente com a query anterior (sem regressão funcional)

---

### US03 — Comportamento funcional do checkFirstSms para contas Kornerstone

> **Como** sistema de servicing,
> **Quero** que `SmsService.checkFirstSms` retorne sempre `false` para contas Kornerstone (`company = 'KORNERSTONE'`),
> **Para que** o opt-in de SMS seja sempre exibido a clientes Kornerstone, independentemente do histórico.

**Critérios de Aceite:**
- Conta com `company = 'KORNERSTONE'` em `uown_sv_account` → `smsCount ≥ 1` → `checkFirstSms = false`
- Isso ocorre mesmo quando `uown_sms_queue` não possui registros para o `account_pk`
- Contas não-Kornerstone seguem comportamento normal da US02

---

### US04 — Consulta por account_pk também utiliza índice

> **Como** sistema de servicing,
> **Quero** que a busca por `account_pk` em `uown_sms_queue` use o índice `idx_uown_sms_queue_account_pk`,
> **Para que** a verificação de SMS para contas (accounts) seja igualmente eficiente.

**Critérios de Aceite:**
- `EXPLAIN ANALYZE` da query com `account_pk` utiliza `idx_uown_sms_queue_account_pk` (Index Scan)
- Sem Seq Scan na tabela `uown_sms_queue` quando `account_pk IS NOT NULL`

---

### US05 — Migration registrada e flyway consistente

> **Como** engenheiro de QA,
> **Quero** que a migration `V20260220050615__sms_opt_in_confirmation_response_indexes.sql` esteja registrada como `success` no Flyway,
> **Para que** o ambiente de QA esteja sincronizado com o código da branch.

**Critérios de Aceite:**
- `flyway_schema_history` contém registro com `version = '20260220050615'` e `success = true`

---

## Cenários de Teste

### Cenário 1 — [US01] Índices criados corretamente no banco de dados

```gherkin
Scenario: Verificar existência dos índices parciais pós-migration
  Given o ambiente QA está com a migration V20260220050615 aplicada
  When verifico os índices na tabela "uown_sms_queue" via pg_indexes
  Then o índice "idx_uown_sms_queue_lead_pk" existe com condição "WHERE lead_pk IS NOT NULL"
  And o índice "idx_uown_sms_queue_account_pk" existe com condição "WHERE account_pk IS NOT NULL"
  And o índice "idx_uown_sms_queue_lead_account_pk" NÃO existe
```

**Validação DB:**
```sql
SELECT indexname, indexdef FROM pg_indexes
WHERE tablename = 'uown_sms_queue'
  AND indexname IN ('idx_uown_sms_queue_lead_pk', 'idx_uown_sms_queue_account_pk', 'idx_uown_sms_queue_lead_account_pk');
-- Esperado: 2 linhas (lead_pk e account_pk), sem idx_uown_sms_queue_lead_account_pk
```

---

### Cenário 2 — [US02] checkFirstSms = true para lead novo (sem SMS)

```gherkin
Scenario: Lead novo sem histórico de SMS retorna checkFirstSms = true
  Given um lead recém-criado sem registros em uown_sms_queue
  When a query SmsOptInConfirmationResponse é executada com leadPk do lead
  Then smsCount = 0
  And checkFirstSms = true (opt-in de SMS deve ser exibido)
```

**Validação DB:**
```sql
SELECT COUNT(*) FROM uown_sms_queue WHERE lead_pk = :leadPk;
-- Esperado: 0
```

---

### Cenário 3 — [US02] checkFirstSms = false para lead com SMS enviado

```gherkin
Scenario: Lead com histórico de SMS retorna checkFirstSms = false
  Given um lead que já recebeu ao menos 1 SMS em uown_sms_queue
  When a query SmsOptInConfirmationResponse é executada com leadPk
  Then smsCount >= 1
  And checkFirstSms = false (opt-in de SMS NÃO deve ser exibido)
```

---

### Cenário 4 — [US03] Conta Kornerstone sempre retorna checkFirstSms = false

```gherkin
Scenario: Conta Kornerstone sem histórico de SMS retorna checkFirstSms = false
  Given uma conta com company = 'KORNERSTONE' em uown_sv_account
  And não há registros em uown_sms_queue para este account_pk
  When a query SmsOptInConfirmationResponse é executada com accountPk
  Then is_kornerstone_account = 1
  And smsCount = GREATEST(0, 1) = 1
  And checkFirstSms = false
```

**Validação DB:**
```sql
SELECT company FROM uown_sv_account WHERE pk = :accountPk;
-- Esperado: 'KORNERSTONE'
SELECT COUNT(*) FROM uown_sms_queue WHERE account_pk = :accountPk;
-- Esperado: 0
```

---

### Cenário 5 — [US04] EXPLAIN confirma uso de índice por account_pk

```gherkin
Scenario: Query utiliza índice idx_uown_sms_queue_account_pk
  Given o índice idx_uown_sms_queue_account_pk existe
  When executo EXPLAIN ANALYZE da subquery "SELECT pk FROM uown_sms_queue WHERE account_pk = :accountPk"
  Then o plano contém "Index Scan" em uown_sms_queue usando idx_uown_sms_queue_account_pk
  And não contém "Seq Scan" em uown_sms_queue
```

---

### Cenário 6 — [US05] Migration Flyway aplicada com sucesso

```gherkin
Scenario: Migration V20260220050615 registrada como success no flyway_schema_history
  Given o banco de dados do ambiente QA
  When consulto flyway_schema_history
  Then existe registro com version = '20260220050615' e success = true
```

**Validação DB:**
```sql
SELECT version, description, success
FROM flyway_schema_history
WHERE version = '20260220050615';
-- Esperado: 1 linha com success = true
```

---

### Cenário 7 — [US02/US03] Regressão funcional — contas não-Kornerstone não afetadas

```gherkin
Scenario: Conta não-Kornerstone segue comportamento normal de contagem de SMS
  Given uma conta com company != 'KORNERSTONE'
  And essa conta possui 2 registros em uown_sms_queue
  When a query SmsOptInConfirmationResponse é executada com accountPk
  Then smsCount = 2
  And checkFirstSms = false
```

---

| # | Cenário | US | Ambiente | Status |
|---|---------|-----|----------|--------|
| 1 | Índices criados e índice antigo removido | US01 | QA2 | PENDING |
| 2 | Lead novo → checkFirstSms = true | US02 | QA2 | PENDING |
| 3 | Lead com SMS → checkFirstSms = false | US02 | QA2 | PENDING |
| 4 | Conta Kornerstone → checkFirstSms = false | US03 | QA2 | PENDING |
| 5 | EXPLAIN usa índice por account_pk | US04 | QA2 | PENDING |
| 6 | Migration Flyway aplicada | US05 | QA2 | PENDING |
| 7 | Conta não-Kornerstone: regressão | US02/US03 | QA2 | PENDING |

---

## Testes de Regressão E2E

> **Objetivo:** Validar que a otimização do `SmsOptInConfirmationResponse.sql` (índices parciais em `uown_sms_queue`) não causou regressão funcional no fluxo de criação de aplicação. O SMS opt-in é verificado internamente durante o `sendApplication` — se o índice estiver errado ou a query quebrada, o fluxo de criação de conta falharia.

### Testes Referenciados

| Spec | Caminho | Relevância para este ticket |
|------|---------|----------------------------|
| `unified-flow.spec.ts` | `tests/e2e/unified-flow.spec.ts` | `sendApplication` (Phase 1) dispara internamente a query SMS opt-in para determinar exibição de consentimento. Se a query falhar, o `authorizationNumber` não é retornado. |
| `new-application.spec.ts` | `tests/e2e/origination/new-application.spec.ts` | Criação de aplicação via UI (Phase 1) + `sendApplication` via API (Phase 3) — mesmo ponto de entrada da query SMS. |

---

### US-E2E01 — unified-flow.spec.ts executa sem regressão (sandbox/TireAgent)

> **Como** engenheiro de QA,
> **Quero** que o `unified-flow.spec.ts` execute com sucesso após a otimização da query SMS,
> **Para que** eu confirme que `sendApplication` e o fluxo completo de criação de conta não foram afetados.

**Critérios de Aceite:**

- [ ] `Phase 1 — Create new application via API`: `sendApplication` retorna HTTP 200 com `authorizationNumber` (leadPk) preenchido
- [ ] `Phase 1`: `paymentDetailsList[].redirectUrl` (contractUrl) está presente e válido
- [ ] `Phase 3 — Contract`: preenchimento de CC + bank info e submissão completam sem erro toast
- [ ] `Phase 3 — E-sign`: e-sign via iframe completado com sucesso
- [ ] `Phase 4 — Settle + Fund`: lead avança para status `FUNDING` ou `FUNDED`
- [ ] `Phase 5 — validateCustomerInfo`: firstName e lastName do aplicante visíveis na página
- [ ] `Phase 5 — Quick Search`: busca por leadPk, accountPk, email, firstName, lastName retorna o lead correto
- [ ] `Phase 6 — Servicing payments`: pagamentos ACH e CC registrados sem erro
- [ ] `Phase 7 — Website login + OTP`: login com email + código de verificação funcional
- [ ] **Resultado geral: PASS** — nenhuma falha atribuível à query SMS

```bash
# Comando de execução
npx playwright test tests/e2e/unified-flow.spec.ts --project=origination-ui
```

**Resultado esperado:**
```
✓ Unified Flow - sandbox NY/TireAgent › Creating Uown account in "sandbox"  [PASS]
```

---

### US-E2E02 — new-application.spec.ts executa sem regressão (stg/TireAgent)

> **Como** engenheiro de QA,
> **Quero** que o `new-application.spec.ts` execute com sucesso,
> **Para que** eu confirme que o fluxo de criação via UI + sendApplication não regrediu após a otimização SMS.

**Critérios de Aceite:**

- [ ] `Phase 1 — Create new application via UI`: formulário preenchido (email, phone, merchant) e toast de confirmação exibido
- [ ] `Phase 3 — sendApplication via API`: `authorizationNumber` e `contractUrl` retornados corretamente
- [ ] `Phase 4 — Origination status`: lead encontrado no portal com status válido (não em erro)
- [ ] `Phase 5 — Contract CC + bank`: dados preenchidos e submetidos sem toast de erro
- [ ] `Phase 5 — E-sign`: concluído com sucesso
- [ ] `Phase 6 — Settle + Fund`: conta avança para `FUNDED` ou `FUNDING`
- [ ] `Phase 12 — validateCustomerInfo`: nome do aplicante visível e status contém `fund`
- [ ] `Phase 12 — Quick Search`: searchPage.testQuickSearchMethods retorna o lead criado
- [ ] `Phase 13 — Servicing ACH + CC`: pagamentos adicionados sem erro
- [ ] `Phase 14 — Website OTP + payments`: login e pagamentos no website portal funcionam
- [ ] **Resultado geral: PASS** — nenhuma falha atribuível à query SMS

```bash
# Comando de execução
npx playwright test tests/e2e/origination/new-application.spec.ts --project=origination-ui
```

**Resultado esperado:**
```
✓ New Application - stg NY/TireAgent › Creating Uown account via UI in "stg"  [PASS]
```

---

### Tabela de Status — Regressão E2E

| # | Spec | Step crítico | Ambiente | Status |
|---|------|-------------|----------|--------|
| E1 | `unified-flow.spec.ts` | sendApplication retorna leadPk + contractUrl | sandbox | PENDING |
| E2 | `unified-flow.spec.ts` | Fluxo completo PASS (contract → fund → servicing → website) | sandbox | PENDING |
| E3 | `new-application.spec.ts` | sendApplication via API retorna leadPk + contractUrl | stg | PENDING |
| E4 | `new-application.spec.ts` | Fluxo completo PASS (UI form → contract → fund → servicing → website) | stg | PENDING |

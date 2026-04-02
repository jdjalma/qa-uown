---

https://gitlab.com/uown/backend/svc/-/work_items/457

**Projeto:** uown/backend/svc
**Milestone:** Uown | RU03.26.1.50.0
**Labels:** dev::backend · priority::medium · workflow::ready-for-qa

---

# UOWN | SVC | Analyze and Optimize High CPU Usage Queries (query-6)

## Synopsis

Database queries have been identified as causing **high CPU usage and excessive database resource consumption**, resulting in **system slowness** and direct impact on the end-user experience. This ticket targets the optimization of the **activity log query** (`uown_los_activity_log`), used na aba **Log** do portal de Originação.

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

## Query Analisada (query-6)

**Tabela:** `uown_los_activity_log`
**Endpoint:** `GET /api/los/lead/{leadPk}/activityLogs`
**Serviço Java:** `LosActivityLogsService.getAllActivityLogForLead()`

```sql
SELECT
  losactivit0_.pk,
  losactivit0_.agent,
  losactivit0_.row_created_timestamp,
  losactivit0_.row_updated_timestamp,
  ...
  losactivit0_.lead_pk,
  losactivit0_.log_type,
  losactivit0_.notes,
  ...
FROM
  public.uown_los_activity_log losactivit0_
WHERE
  losactivit0_.lead_pk = $1
  AND (losactivit0_.log_type IN ($2, $3, ..., $65))
  AND ($66 = $71 OR LOWER(losactivit0_.notes) LIKE LOWER(($72 || $67 || $73)) ESCAPE $74)
  AND ($68 = $75 OR LOWER(losactivit0_.created_by) LIKE LOWER(($76 || $69 || $77)) ESCAPE $78)
ORDER BY
  losactivit0_.row_created_timestamp DESC
LIMIT $70
```

## Otimização Implementada

**Flyway Migration:** `V20260225120421__add_idx_los_activity_logs.sql`

```sql
CREATE INDEX IF NOT EXISTS idx_los_activity_lead_type_created_ts
ON public.uown_los_activity_log (lead_pk, log_type, row_created_timestamp DESC);
```

**Estratégia:**
- Índice composto cobre os três predicados mais frequentes: `lead_pk` (WHERE), `log_type` (IN), `row_created_timestamp` (ORDER BY DESC)
- Permite Index Scan em vez de Seq Scan + Sort, eliminando o custo de ordenação em memória
- Filtragem de notas e created_by ocorre como filtro residual após lookup eficiente por lead e tipo

## Contexto Técnico

- **Tabela:** `uown_los_activity_log`
- **Controller:** `LosLeadController` — `GET /los/lead/{leadPk}/activityLogs`
- **Serviço Java:** `LosActivityLogsService.getAllActivityLogForLead(leadPk, filters, pageable)`
- **Frontend:** Aba **Log** no portal de Originação — exibe log de atividades do lead com filtros por tipo, notas e agente criador
- **Colunas do log:** `log_type`, `notes`, `created_by`, `agent`, `row_created_timestamp`, `priority`, `expiry_date`

---

## User Stories (US)

### US01 — Índice de activity log criado com colunas corretas

> **Como** DBA ou engenheiro de infraestrutura,
> **Quero** verificar que o índice `idx_los_activity_lead_type_created_ts` foi criado na tabela `uown_los_activity_log`,
> **Para que** a query de activity log por lead utilize Index Scan eficiente.

**Critérios de Aceite:**
- Índice `idx_los_activity_lead_type_created_ts` existe em `uown_los_activity_log`
- Colunas do índice: `lead_pk`, `log_type`, `row_created_timestamp` DESC
- Migration Flyway `V20260225120421` registrada em `flyway_schema_history` com `success = true`

---

### US02 — Aba Log carrega atividades do lead corretamente

> **Como** agente no portal de Originação,
> **Quero** acessar a aba **Log** de um lead e ver todas as atividades registradas,
> **Para que** eu possa acompanhar o histórico do processo de originação sem degradação de performance.

**Critérios de Aceite:**
- Aba Log exibe atividades do lead em ordem cronológica decrescente (`row_created_timestamp DESC`)
- Registros são filtrados pelo `lead_pk` correto
- Tipos de log (`log_type`) são filtrados conforme seleção do usuário (REVIEW, NOTE, STATUS_CHANGE, etc.)
- Resultado funcional idêntico ao comportamento antes da otimização (sem regressão)

---

### US03 — Filtro por tipo de log funciona corretamente

> **Como** agente no portal de Originação,
> **Quero** filtrar as atividades da aba Log por tipo (ex: REVIEW, NOTE, STATUS_CHANGE),
> **Para que** eu possa visualizar apenas os eventos relevantes para minha análise.

**Critérios de Aceite:**
- Filtragem por `log_type IN (...)` retorna somente os tipos selecionados
- Com todos os tipos selecionados: exibe todos os registros do lead
- Com tipo específico (ex: STATUS_CHANGE): exibe apenas logs desse tipo
- Contagem de resultados é consistente com o banco de dados

---

### US04 — Filtro por notas (notes LIKE) funciona sem perda de dados

> **Como** agente no portal de Originação,
> **Quero** pesquisar atividades por texto nas notas,
> **Para que** eu possa encontrar registros específicos no histórico do lead.

**Critérios de Aceite:**
- Busca por texto parcial nas notas retorna todos os logs onde `LOWER(notes) LIKE LOWER('%texto%')`
- Busca é case-insensitive
- Registros não correspondentes são corretamente excluídos

---

### US05 — Filtro por created_by funciona sem perda de dados

> **Como** supervisor no portal de Originação,
> **Quero** filtrar o log de atividades pelo nome do agente que criou o registro,
> **Para que** eu possa auditar ações de agentes específicos.

**Critérios de Aceite:**
- Filtragem por `LOWER(created_by) LIKE LOWER('%nome%')` retorna registros corretos
- Registros de outros agentes são excluídos da busca
- Funciona em combinação com filtro por tipo de log

---

### US06 — Migration Flyway aplicada com sucesso

> **Como** engenheiro de QA,
> **Quero** verificar que a migration `V20260225120421` foi aplicada com sucesso no banco de dados do ambiente,
> **Para que** o índice exista e a otimização seja efetiva.

**Critérios de Aceite:**
- `flyway_schema_history` contém `version = '20260225120421'` com `success = true`

---

## Cenários de Teste

### Cenário 1 — [US01] Índice idx_los_activity_lead_type_created_ts criado

```gherkin
Scenario: Verificar criação do índice composto em uown_los_activity_log
  Given o ambiente QA está com a migration V20260225120421 aplicada
  When consulto pg_indexes para a tabela "uown_los_activity_log"
  Then o índice "idx_los_activity_lead_type_created_ts" existe
  And o índice cobre as colunas (lead_pk, log_type, row_created_timestamp DESC)
```

**Validação DB:**
```sql
SELECT indexname, indexdef FROM pg_indexes
WHERE tablename = 'uown_los_activity_log'
  AND indexname = 'idx_los_activity_lead_type_created_ts';
-- Esperado: 1 linha com indexdef contendo (lead_pk, log_type, row_created_timestamp DESC)
```

---

### Cenário 2 — [US02] Aba Log exibe atividades do lead em ordem correta

```gherkin
Scenario: Aba Log exibe histórico de atividades do lead com dados corretos
  Given um lead com ao menos 5 atividades em uown_los_activity_log
  When o agente acessa a aba "Log" do lead no portal de Originação
  Then os registros aparecem em ordem decrescente de row_created_timestamp
  And todos os lead_pk retornados correspondem ao lead acessado
  And os dados de log_type, notes e created_by são exibidos corretamente
```

**Validação DB:**
```sql
SELECT log_type, notes, created_by, row_created_timestamp
FROM uown_los_activity_log
WHERE lead_pk = :leadPk
ORDER BY row_created_timestamp DESC
LIMIT 20;
```

---

### Cenário 3 — [US03] Filtro por tipo de log retorna apenas o tipo selecionado

```gherkin
Scenario: Filtrar log por tipo STATUS_CHANGE retorna apenas esses registros
  Given um lead com atividades de diferentes tipos (REVIEW, NOTE, STATUS_CHANGE)
  When o agente filtra por log_type = 'STATUS_CHANGE'
  Then apenas logs do tipo STATUS_CHANGE são exibidos
  And logs de tipos REVIEW e NOTE não aparecem no resultado
```

---

### Cenário 4 — [US04] Busca por texto nas notas é case-insensitive

```gherkin
Scenario: Busca por nota com texto em lowercase retorna resultado equivalente a uppercase
  Given um lead com atividade cuja nota contém "Approved by Manager"
  When o agente busca por "approved"
  Then o log com nota "Approved by Manager" é retornado
  And a busca por "APPROVED" também retorna o mesmo resultado
```

---

### Cenário 5 — [US05] Filtro por created_by retorna logs do agente correto

```gherkin
Scenario: Filtrar log por created_by retorna apenas registros do agente
  Given um lead com atividades criadas por diferentes agentes
  When o supervisor filtra created_by = 'john.doe'
  Then apenas atividades criadas por "john.doe" são exibidas
  And atividades de outros agentes não aparecem no resultado
```

---

### Cenário 6 — [US06] Migration Flyway registrada como success

```gherkin
Scenario: Migration V20260225120421 registrada com sucesso em flyway_schema_history
  Given o banco de dados do ambiente QA
  When consulto flyway_schema_history WHERE version = '20260225120421'
  Then existe 1 registro com success = true
```

**Validação DB:**
```sql
SELECT version, description, success
FROM flyway_schema_history
WHERE version = '20260225120421';
-- Esperado: 1 linha com success = true
```

---

### Cenário 7 — [US02/US03] Regressão — combinação de filtros tipo + notas

```gherkin
Scenario: Combinação de filtros tipo + nota retorna intersecção correta
  Given um lead com atividades de tipo REVIEW e NOTE, algumas com nota contendo "urgent"
  When o agente filtra por log_type = 'REVIEW' E notes LIKE '%urgent%'
  Then apenas logs do tipo REVIEW com nota contendo "urgent" são exibidos
  And a contagem no frontend corresponde ao resultado do banco de dados
```

---

| # | Cenário | US | Ambiente | Status |
|---|---------|-----|----------|--------|
| 1 | Índice composto criado em uown_los_activity_log | US01 | QA2 | PENDING |
| 2 | Aba Log exibe atividades em ordem correta | US02 | QA2 | PENDING |
| 3 | Filtro por log_type correto | US03 | QA2 | PENDING |
| 4 | Busca por notes é case-insensitive | US04 | QA2 | PENDING |
| 5 | Filtro por created_by correto | US05 | QA2 | PENDING |
| 6 | Migration Flyway V20260225120421 aplicada | US06 | QA2 | PENDING |
| 7 | Combinação de filtros sem regressão | US02/US03 | QA2 | PENDING |

---

## Testes de Regressão E2E

> **Objetivo:** Validar que a criação do índice `idx_los_activity_lead_type_created_ts` não causou regressão funcional. Durante o fluxo de criação de conta, o backend escreve entradas em `uown_los_activity_log` a cada mudança de status (STATUS_CHANGE, NOTE, REVIEW). Se o índice interferisse na tabela (lock, corrupção, etc.), os status transitions falhariam ou a aba Log estaria vazia.

### Testes Referenciados

| Spec | Caminho | Relevância para este ticket |
|------|---------|----------------------------|
| `unified-flow.spec.ts` | `tests/e2e/unified-flow.spec.ts` | Status transitions (UW_APPROVED → CC_AUTH_PASSED → CONTRACT_CREATED → SIGNED → SETTLED → FUNDING → FUNDED) criam entries em `uown_los_activity_log`. Se o índice quebrasse writes, as transições falhariam. |
| `new-application.spec.ts` | `tests/e2e/origination/new-application.spec.ts` | Mesmo mecanismo — status transitions no fluxo UI + `getDocumentStatus` (que também cria log entries). Após funding, a aba Log deve ter ao menos 5+ entries do fluxo completo. |

---

### US-E2E01 — unified-flow.spec.ts executa sem regressão (sandbox/TireAgent)

> **Como** engenheiro de QA,
> **Quero** que o `unified-flow.spec.ts` passe após a criação do índice de activity log,
> **Para que** eu confirme que writes em `uown_los_activity_log` durante status transitions não foram afetados.

**Critérios de Aceite:**

- [ ] `Phase 1 — sendApplication`: retorna leadPk — backend criou entry de log `APPLICATION_SUBMITTED`
- [ ] `Phase 3 — E-sign`: contrato assinado com sucesso — log `CONTRACT_SIGNED` criado em `uown_los_activity_log`
- [ ] `Phase 3 — Wait for Signed status`: `pollForLeadStatus` converge para `SIGNED` — status transition com log `STATUS_CHANGE`
- [ ] `Phase 4 — Settle + Fund`: lead avança para `FUNDING` / `FUNDED` — log entries de settle e fund criados
- [ ] **Pós-execução (validação DB)**: `uown_los_activity_log` contém ao menos 3 entries para o `leadPk` criado
- [ ] **Pós-execução**: entries ordenadas por `row_created_timestamp DESC` coerentemente (sem regressão de ordenação)
- [ ] **Resultado geral: PASS**

```bash
npx playwright test tests/e2e/unified-flow.spec.ts --project=origination-ui
```

**Validação DB pós-execução:**
```sql
SELECT log_type, created_by, row_created_timestamp
FROM uown_los_activity_log
WHERE lead_pk = :leadPkCriado
ORDER BY row_created_timestamp DESC;
-- Esperado: >= 3 linhas com log_type variados (STATUS_CHANGE, APPLICATION, etc.)
```

**Resultado esperado:**
```
✓ Unified Flow - sandbox NY/TireAgent › Creating Uown account in "sandbox"  [PASS]
```

---

### US-E2E02 — new-application.spec.ts executa sem regressão (stg/TireAgent)

> **Como** engenheiro de QA,
> **Quero** que o `new-application.spec.ts` passe após a criação do índice de activity log,
> **Para que** eu confirme que o fluxo UI (que cria mais log entries que o fluxo API puro) funciona corretamente.

**Critérios de Aceite:**

- [ ] `Phase 1 — UI form`: formulário submetido com toast de confirmação — log entry criada para `NEW_APPLICATION`
- [ ] `Phase 3 — sendApplication API`: retorna leadPk + contractUrl sem erro
- [ ] `Phase 4 — Login origination`: lead encontrado e status visível na página do cliente
- [ ] `Phase 5 — E-sign`: e-sign completo — log `CONTRACT_SIGNED` criado
- [ ] `Phase 5 — Get Document Status`: clique no botão "Get Document Status" disparou atualização de status sem erro (backend consulta log para determinar estado)
- [ ] `Phase 6 — Settle + Fund`: conta avança para `FUNDED` / `FUNDING`
- [ ] **Pós-execução (validação DB)**: entries em `uown_los_activity_log` para o lead existem e estão corretamente ordenadas por `row_created_timestamp DESC`
- [ ] **Resultado geral: PASS**

```bash
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
| E1 | `unified-flow.spec.ts` | Status transitions (SIGNED → FUNDED) sem erro | sandbox | PENDING |
| E2 | `unified-flow.spec.ts` | DB: >= 3 entries em uown_los_activity_log para o lead | sandbox | PENDING |
| E3 | `new-application.spec.ts` | Get Document Status dispara sem erro | stg | PENDING |
| E4 | `new-application.spec.ts` | DB: entries em activity_log ordenadas corretamente | stg | PENDING |

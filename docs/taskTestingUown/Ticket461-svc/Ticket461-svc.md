---

https://gitlab.com/uown/backend/svc/-/work_items/461

**Projeto:** uown/backend/svc
**Milestone:** Uown | RU03.26.1.50.0
**Labels:** dev::backend · priority::low · workflow::ready-for-qa

---

# UOWN | SVC | Analyze and Optimize High CPU Usage Queries (query-11)

## Synopsis

Database queries have been identified as causing **high CPU usage and excessive database resource consumption**, resulting in **system slowness** and direct impact on the end-user experience. This ticket targets the optimization of `getLeadSummaryResults.sql`, a query complexa usada na **tabela de leads do portal de Originação**.

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

## Query Analisada (query-11)

**Arquivo:** `src/main/resources/sqls/getLeadSummaryResults.sql`
**Serviço Java:** `ApplicationService`

```sql
WITH results as (
    SELECT l.pk as leadPk,
           l.uuid as uuid,
           l.customer_state as customerState,
           m.merchant_name as merchantName,
           m.location_name as locationName,
           m.ref_merchant_code as merchantReferenceCode,
           l.lead_status as leadStatus,
           l.internal_status as internalStatus,
           c.first_name as firstName,
           c.last_name as lastName,
           CONCAT(phone.area_code, '' ,phone.phone_number) as phoneNumber,
           email.email_address as email,
           uw.approval_amount as approvalAmount,
           l.max_approval_amount as maxApprovalAmount,
           date(l.row_created_timestamp) as applicationDate,
           l.expiration_date as expirationDate,
           invoice.merchant_invoice_number as invoiceNumber,
           contract.contract_status = 'SIGNED' as signedLease,
           contract.contract_number as contractNumber,
           summary.total_contract_amount_with_tax_and_fees as leaseAmount,
           funding.amount_to_be_funded as fundedAmount,
           invoice.sales_person as salesPerson,
           uw.lambda_segment as lambdaScore,
           l.created_from as createdFrom,
           item.item_delivery_date as deliveryDate
    FROM uown_los_lead l
        JOIN uown_merchant m on m.pk = l.merchant_pk
        JOIN uown_los_customer c on c.lead_pk = l.pk
        LEFT JOIN uown_los_phone phone on phone.lead_pk = l.pk and phone.phone_type = 'MOBILE'
        LEFT JOIN uown_los_email email on email.lead_pk = l.pk
        LEFT JOIN uown_los_uwdata uw on uw.lead_pk = l.pk
        LEFT JOIN uown_los_invoice invoice on invoice.lead_pk = l.pk
        LEFT JOIN LATERAL (...) item ON TRUE
        LEFT JOIN uown_los_sched_summary summary on summary.lead_pk = l.pk
        LEFT JOIN uown_los_contract contract on contract.lead_pk = l.pk and contract.contract_type = 'LEASE'
        LEFT JOIN uown_funding_transaction funding on funding.lead_pk = l.pk and funding.funding_queue_status = 'FUNDED' and funding.status = 'ACTIVE'
        LEFT OUTER JOIN uown_funding_transaction activeFunding on ... funding.pk < activeFunding.pk
    WHERE activeFunding.pk IS NULL
        AND (:merchantRefCodes IS NULL or :merchantRefCodes = '*' or :merchantRefCodes like CONCAT('%', m.ref_merchant_code, '%'))
        AND (:returnAll = true or (date(l.row_created_timestamp) >= :fromTime and date(l.row_created_timestamp) <= :toTime))
        AND (:status is null or l.lead_status = :status ...)
        ...
)
```

## Otimizações Implementadas

**Flyway Migration:** `V20260220064821__add_index_phone_full_number.sql`

```sql
-- Índice para busca por número completo de telefone (CONCAT area_code || phone_number)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_phone_full_number_active
    ON uown_los_phone ((area_code || phone_number));

-- Índice para filtragem de UW data por status e data de expiração
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_uwdata_status_expiration
    ON uown_los_uwdata (uw_status, approval_expiration_date);

-- Índice para filtragem de leads por data e status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lead_timestamp_status
    ON uown_los_lead (row_created_timestamp DESC, lead_status);

-- Índices para filtro de endereço por zip_code e state
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_address_zip_code
    ON uown_los_address (zip_code);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_address_state
    ON uown_los_address (state);
```

**Estratégia:**
- `idx_phone_full_number_active`: elimina cálculo em runtime de `area_code || phone_number` na busca por telefone
- `idx_lead_timestamp_status`: suporta filtros por data e status sem Seq Scan da tabela `uown_los_lead`
- `idx_uwdata_status_expiration`: acelera joins de UW data quando filtrado por status e validade
- Índices de endereço: suportam buscas de estado e CEP em telas de filtro

## Contexto Técnico

- **Endpoint:** `GET /api/application/leads/summary` ou similar
- **Serviço Java:** `ApplicationService`
- **Frontend (Origination):** Tabela de leads — listagem principal com filtros por período, status, merchant, lead
- **Filtros disponíveis:** fromDate, toDate, lead_status, merchantRefCodes, merchantNames, location, merchantSupport, search text, returnAll
- **Colunas retornadas:** leadPk, uuid, merchantName, leadStatus, firstName, lastName, phoneNumber, email, approvalAmount, contractNumber, leaseAmount, fundedAmount, etc.

---

## User Stories (US)

### US01 — Índices de performance criados com colunas corretas

> **Como** DBA ou engenheiro de infraestrutura,
> **Quero** verificar que os índices para otimização de `getLeadSummaryResults.sql` foram criados,
> **Para que** a tabela de leads do portal de Originação carregue com menor latência e CPU.

**Critérios de Aceite:**
- `idx_phone_full_number_active` existe em `uown_los_phone` com expressão `(area_code || phone_number)`
- `idx_uwdata_status_expiration` existe em `uown_los_uwdata` com colunas `(uw_status, approval_expiration_date)`
- `idx_lead_timestamp_status` existe em `uown_los_lead` com colunas `(row_created_timestamp DESC, lead_status)`
- `idx_address_zip_code` existe em `uown_los_address` com coluna `(zip_code)`
- `idx_address_state` existe em `uown_los_address` com coluna `(state)`
- Migration `V20260220064821` registrada em `flyway_schema_history` com `success = true`

---

### US02 — Tabela de leads exibe dados corretos filtrados por período

> **Como** agente no portal de Originação,
> **Quero** filtrar a tabela de leads por período (fromDate / toDate),
> **Para que** eu possa visualizar apenas os leads criados no intervalo de datas desejado.

**Critérios de Aceite:**
- Tabela retorna apenas leads com `date(row_created_timestamp) BETWEEN :fromDate AND :toDate`
- Todos os campos da tabela (leadPk, nome, merchant, status, valor, contrato) são exibidos corretamente
- Resultado é paginado corretamente (total count coerente)
- Leads fora do período não aparecem

---

### US03 — Tabela de leads filtrada por status de lead funciona corretamente

> **Como** agente no portal de Originação,
> **Quero** filtrar a tabela de leads por status (UW_APPROVED, SIGNED, FUNDED, etc.),
> **Para que** eu possa trabalhar apenas com leads em estágio específico do pipeline.

**Critérios de Aceite:**
- Filtragem por `lead_status = 'FUNDED'` retorna apenas leads com status FUNDED
- Filtragem por `lead_status IN ('DENIED', 'UW_DENIED')` retorna ambos os tipos
- Sem filtro de status (returnAll = true): todos os leads do período são retornados
- Contagem e dados consistentes com o banco

---

### US04 — Tabela de leads filtrada por merchant funciona corretamente

> **Como** gerente de merchant,
> **Quero** ver apenas os leads do meu merchant na tabela de Originação,
> **Para que** eu possa acompanhar apenas as aplicações da minha operação.

**Critérios de Aceite:**
- Filtro por `merchantRefCodes` retorna apenas leads do merchant especificado
- Filtro `merchantRefCodes = '*'` retorna todos os merchants (admin)
- Dados de `merchantName`, `locationName` e `merchantReferenceCode` corretos para cada lead

---

### US05 — Dados de funding aparecem corretamente na tabela

> **Como** analista financeiro,
> **Quero** que a tabela de leads exiba o `fundedAmount` e `signedLease` corretos,
> **Para que** eu possa monitorar o volume de leases financiados.

**Critérios de Aceite:**
- Leads com status FUNDED exibem `fundedAmount` com valor correto de `uown_funding_transaction`
- Leads com contrato assinado exibem `signedLease = true`
- Leads sem funding exibem `fundedAmount = null`
- Apenas a última transação de funding ativa é retornada (sem duplicatas por lead)

---

### US06 — Busca por texto (search) funciona em múltiplos campos

> **Como** agente no portal de Originação,
> **Quero** buscar leads por texto livre (nome, merchant, estado, ID do lead),
> **Para que** eu possa encontrar rapidamente um lead específico.

**Critérios de Aceite:**
- Busca por `leadPk` retorna o lead correto
- Busca por `merchantName` retorna todos os leads do merchant que contém o texto
- Busca por `firstName` ou `lastName` retorna leads correspondentes (case-insensitive)
- Busca por `customerState` filtra por estado do cliente

---

### US07 — Migration Flyway aplicada com sucesso

> **Como** engenheiro de QA,
> **Quero** verificar que a migration `V20260220064821` foi aplicada com sucesso,
> **Para que** todos os índices desta otimização existam no banco do ambiente.

---

## Cenários de Teste

### Cenário 1 — [US01] Todos os índices criados pela migration

```gherkin
Scenario: Verificar existência de todos os índices de getLeadSummaryResults
  Given o ambiente QA com migration V20260220064821 aplicada
  When consulto pg_indexes para as tabelas envolvidas
  Then os seguintes índices existem:
    | Tabela              | Índice                        |
    | uown_los_phone      | idx_phone_full_number_active  |
    | uown_los_uwdata     | idx_uwdata_status_expiration  |
    | uown_los_lead       | idx_lead_timestamp_status     |
    | uown_los_address    | idx_address_zip_code          |
    | uown_los_address    | idx_address_state             |
```

**Validação DB:**
```sql
SELECT tablename, indexname FROM pg_indexes
WHERE indexname IN (
  'idx_phone_full_number_active',
  'idx_uwdata_status_expiration',
  'idx_lead_timestamp_status',
  'idx_address_zip_code',
  'idx_address_state'
);
-- Esperado: 5 linhas
```

---

### Cenário 2 — [US02] Filtro por período retorna leads corretos

```gherkin
Scenario: Tabela de leads filtrada por fromDate e toDate retorna resultados corretos
  Given existem leads criados em datas variadas no banco de dados
  When o agente filtra leads de fromDate = '2026-01-01' até toDate = '2026-01-31'
  Then todos os leads retornados têm applicationDate ENTRE 2026-01-01 E 2026-01-31
  And leads criados fora deste período não aparecem
  And a contagem total é consistente com o banco de dados
```

**Validação DB:**
```sql
SELECT COUNT(*) FROM uown_los_lead
WHERE date(row_created_timestamp) BETWEEN '2026-01-01' AND '2026-01-31';
```

---

### Cenário 3 — [US03] Filtro por status retorna apenas leads do status selecionado

```gherkin
Scenario: Filtrar tabela de leads por status FUNDED
  Given existem leads com diferentes lead_status no banco de dados
  When o agente filtra por status = 'FUNDED'
  Then todos os leads retornados têm lead_status = 'FUNDED'
  And leads com outros status não aparecem no resultado
```

---

### Cenário 4 — [US03] Filtro por status DENIED retorna também UW_DENIED

```gherkin
Scenario: Filtro por DENIED inclui UW_DENIED
  Given existem leads com lead_status = 'DENIED' e lead_status = 'UW_DENIED'
  When o agente filtra por status = 'DENIED'
  Then leads com lead_status = 'DENIED' são retornados
  And leads com lead_status = 'UW_DENIED' também são retornados
```

---

### Cenário 5 — [US04] Tabela filtrada por merchant exibe apenas leads do merchant

```gherkin
Scenario: Filtrar leads por merchantRefCode retorna apenas leads do merchant
  Given dois merchants diferentes com leads cadastrados
  When o agente filtra por merchantRefCode = 'MERCHANT_A_CODE'
  Then apenas leads cujo merchant tem ref_merchant_code = 'MERCHANT_A_CODE' são exibidos
  And leads de outros merchants não aparecem
```

---

### Cenário 6 — [US05] Funded amount e signed lease exibidos corretamente

```gherkin
Scenario: Lead fundado exibe fundedAmount e signedLease = true
  Given um lead com status FUNDED e contrato assinado
  When o agente acessa a tabela de leads
  Then o lead exibe fundedAmount com o valor correto da transação de funding
  And o campo signedLease é true
  And não há duplicatas do mesmo lead na tabela
```

**Validação DB:**
```sql
SELECT amount_to_be_funded, funding_queue_status, status
FROM uown_funding_transaction
WHERE lead_pk = :leadPk AND funding_queue_status = 'FUNDED' AND status = 'ACTIVE';
```

---

### Cenário 7 — [US06] Busca por texto no leadPk retorna lead correto

```gherkin
Scenario: Busca por ID do lead retorna apenas esse lead
  Given um lead com pk conhecido
  When o agente busca pelo pk no campo de busca livre
  Then apenas o lead com esse pk aparece no resultado
```

---

### Cenário 8 — [US07] Migration Flyway V20260220064821 aplicada com sucesso

```gherkin
Scenario: Migration V20260220064821 registrada com sucesso
  Given o banco de dados do ambiente QA
  When consulto flyway_schema_history WHERE version = '20260220064821'
  Then existe 1 registro com success = true
```

**Validação DB:**
```sql
SELECT version, description, success
FROM flyway_schema_history
WHERE version = '20260220064821';
```

---

| # | Cenário | US | Ambiente | Status |
|---|---------|-----|----------|--------|
| 1 | Todos os 5 índices criados | US01 | QA2 | PENDING |
| 2 | Filtro por período correto | US02 | QA2 | PENDING |
| 3 | Filtro por status FUNDED | US03 | QA2 | PENDING |
| 4 | Filtro por DENIED inclui UW_DENIED | US03 | QA2 | PENDING |
| 5 | Filtro por merchant correto | US04 | QA2 | PENDING |
| 6 | fundedAmount e signedLease corretos | US05 | QA2 | PENDING |
| 7 | Busca por leadPk | US06 | QA2 | PENDING |
| 8 | Migration Flyway aplicada | US07 | QA2 | PENDING |

---

## Testes de Regressão E2E

> **Objetivo:** Validar que os 5 índices adicionados pela migration `V20260220064821` (phone, uwdata, lead, address) não causaram regressão na leitura de dados do lead no portal de Originação. O `getLeadSummaryResults.sql` alimenta a visualização de detalhes do lead — qualquer regressão se manifesta como dados incorretos ou ausentes na página do cliente após funding.

### Testes Referenciados

| Spec | Caminho | Relevância para este ticket |
|------|---------|----------------------------|
| `unified-flow.spec.ts` | `tests/e2e/unified-flow.spec.ts` | **Phase 5 — validateCustomerInfo**: verifica que `firstName`, `lastName` e `state` do aplicante aparecem na página do cliente após funding. Esses dados vêm de `getLeadSummaryResults.sql`. |
| `new-application.spec.ts` | `tests/e2e/origination/new-application.spec.ts` | **Phase 12 — validateCustomerInfo** + **getAccountNumberFromSummary**: lê dados do lead financiado diretamente da página origination. Também verifica `fundedAmount` via status `fund`. |

---

### US-E2E01 — unified-flow.spec.ts executa sem regressão (sandbox/TireAgent)

> **Como** engenheiro de QA,
> **Quero** que o `unified-flow.spec.ts` passe após adição dos índices de lead summary,
> **Para que** eu confirme que dados do lead (nome, estado, merchant, valor) continuam sendo lidos corretamente pela query otimizada.

**Critérios de Aceite:**

- [ ] `Phase 1 — sendApplication`: retorna leadPk — lead criado com `uown_los_phone`, `uown_los_customer` e `uown_los_uwdata` corretamente populados
- [ ] `Phase 4 — Navigate back to customer`: `getAccountNumberFromSummary()` retorna o accountPk correto (lido de `getLeadSummaryResults` ou equivalente)
- [ ] `Phase 5 — validateCustomerInfo`: `firstName` e `lastName` visíveis na página de detalhes — confirmando que os JOINs com `uown_los_customer` e `uown_los_phone` retornam dados corretos
- [ ] `Phase 5 — Quick Search por leadPk`: lead encontrado no portal — confirmando que a query de busca (que usa os mesmos índices) retorna o lead recém-criado
- [ ] **Pós-execução (validação DB)**: lead criado aparece em `getLeadSummaryResults` com `phoneNumber`, `approvalAmount`, `leaseAmount` e `fundedAmount` preenchidos
- [ ] **Resultado geral: PASS**

```bash
npx playwright test tests/e2e/unified-flow.spec.ts --project=origination-ui
```

**Validação DB pós-execução:**
```sql
-- Verificar que os índices cobrem o lead criado pelo teste
SELECT l.lead_status, c.first_name, c.last_name,
       CONCAT(p.area_code, p.phone_number) AS phone,
       uw.approval_amount, f.amount_to_be_funded
FROM uown_los_lead l
JOIN uown_los_customer c ON c.lead_pk = l.pk
LEFT JOIN uown_los_phone p ON p.lead_pk = l.pk AND p.phone_type = 'MOBILE'
LEFT JOIN uown_los_uwdata uw ON uw.lead_pk = l.pk
LEFT JOIN uown_funding_transaction f ON f.lead_pk = l.pk AND f.funding_queue_status = 'FUNDED' AND f.status = 'ACTIVE'
WHERE l.pk = :leadPkCriado;
-- Esperado: 1 linha com lead_status IN ('FUNDED','FUNDING'), first_name e last_name preenchidos
```

**Resultado esperado:**
```
✓ Unified Flow - sandbox NY/TireAgent › Creating Uown account in "sandbox"  [PASS]
```

---

### US-E2E02 — new-application.spec.ts executa sem regressão (stg/TireAgent)

> **Como** engenheiro de QA,
> **Quero** que o `new-application.spec.ts` passe após adição dos índices de lead summary,
> **Para que** eu confirme que a leitura de dados do lead via portal funciona após funding no ambiente STG.

**Critérios de Aceite:**

- [ ] `Phase 12 — getAccountNumberFromSummary`: accountPk extraído corretamente da página (dados de summary lidos sem erro)
- [ ] `Phase 12 — validateCustomerInfo`: status contém `fund` + nome do aplicante visível — confirma que `getLeadSummaryResults` retorna dados corretos para o lead recém-fundado
- [ ] `Phase 12 — Quick Search (testQuickSearchMethods)`: busca por leadPk, email, firstName, lastName retorna o lead — confirma que os índices de phone e customer name funcionam corretamente
- [ ] `Phase 13 — Servicing customer navigation`: lead encontrado no servicing com accountPk correto — confirma que o mapping lead → account não foi afetado
- [ ] **Pós-execução (validação DB)**: `uown_los_lead.lead_status` está em `FUNDED` ou `FUNDING` para o lead criado; índice `idx_lead_timestamp_status` utilizável via EXPLAIN
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
| E1 | `unified-flow.spec.ts` | validateCustomerInfo: firstName + lastName visíveis | sandbox | PENDING |
| E2 | `unified-flow.spec.ts` | Quick Search por leadPk retorna lead criado | sandbox | PENDING |
| E3 | `unified-flow.spec.ts` | DB: phone, approvalAmount e fundedAmount preenchidos | sandbox | PENDING |
| E4 | `new-application.spec.ts` | getAccountNumberFromSummary retorna accountPk | stg | PENDING |
| E5 | `new-application.spec.ts` | validateCustomerInfo: status fund + nome visível | stg | PENDING |
| E6 | `new-application.spec.ts` | Quick Search por email + firstName retorna lead | stg | PENDING |

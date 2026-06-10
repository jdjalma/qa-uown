---

https://gitlab.com/uown/backend/svc/-/work_items/463

**Projeto:** uown/backend/svc
**Milestone:** Uown | RU03.26.1.50.0
**Labels:** dev::backend · priority::low · workflow::ready-for-qa

---

# UOWN | SVC | Analyze and Optimize High CPU Usage Queries (query-13)

## Synopsis

Database queries have been identified as causing **high CPU usage and excessive database resource consumption**, resulting in **system slowness** and direct impact on the end-user experience. This ticket targets the optimization of `getLosSimpleSearchResults.sql`, a query usada na **busca simples** do portal de Originação para localizar leads por diferentes critérios.

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

## Query Analisada (query-13)

**Arquivo:** `src/main/resources/sqls/getLosSimpleSearchResults.sql`
**Serviço Java:** `SearchService`

```sql
WITH searchResults AS (
    SELECT DISTINCT ON (lead.pk)
        lead.pk AS leadPk,
        lead.account_pk AS accountPk,
        lead.row_created_timestamp AS rowCreatedTime,
        lead.uuid AS uuid,
        lead.lead_status AS leadStatus,
        customer.first_name AS firstName,
        customer.last_name AS lastName,
        customer.ssn AS ssn,
        email.email_address AS email,
        phone.area_code AS areaCode,
        phone.phone_number AS phone,
        invoice.merchant_invoice_number AS invoiceNumber,
        cc.cc_last_four_digit AS last4CC,
        ROW_NUMBER() OVER (
            PARTITION BY lead.pk,
            CASE WHEN :searchType = 'last4CC' THEN cc.cc_last_four_digit ELSE NULL END
            ORDER BY cc.cc_last_four_digit DESC NULLS LAST
        ) AS row_num
    FROM uown_los_lead lead
    JOIN uown_merchant merchant ON lead.merchant_pk = merchant.pk
    JOIN uown_los_customer customer ON customer.lead_pk = lead.pk
    LEFT JOIN uown_los_email email ON email.lead_pk = lead.pk AND email.email_type = 'PRIMARY'
    LEFT JOIN uown_los_phone phone ON phone.lead_pk = lead.pk AND phone.phone_type = 'MOBILE'
    LEFT JOIN uown_los_invoice invoice ON invoice.lead_pk = lead.pk
    LEFT JOIN uown_los_credit_card cc ON cc.lead_pk = lead.pk
    WHERE (:allMerchants OR merchant.ref_merchant_code IN (:merchantRefCodes))
      AND CASE
              WHEN :searchNumber > 0 and :searchType IN ('LeadPk', 'AccountPk')
                  THEN :searchNumber = (CASE WHEN :searchType = 'LeadPk' THEN lead.pk WHEN :searchType = 'AccountPk' THEN lead.account_pk END)
              WHEN :searchType is not null and :searchType <> 'Name'
                  THEN UPPER(:searchString) = (CASE
                      WHEN :searchType = 'Phone' THEN phone.area_code||phone.phone_number
                      WHEN :searchType = 'Email' THEN UPPER(email.email_address)
                      WHEN :searchType = 'SSN' THEN customer.ssn
                      WHEN :searchType = 'InvoiceNum' THEN UPPER(invoice.merchant_invoice_number)
                      WHEN :searchType = 'UUID' THEN UPPER(lead.uuid)
                      WHEN :searchType = 'last4CC' THEN cc.cc_last_four_digit
                  END)
              WHEN :searchType = 'Name' ...
              ...
          END
)
SELECT * FROM searchResults
WHERE row_num = 1
ORDER BY rowCreatedTime DESC;
```

## Otimizações Implementadas

**Flyway Migration:** `V20260227113249__add_index_customer_upper_first_last_name.sql`

```sql
CREATE INDEX IF NOT EXISTS idx_customer_first_name_upper
ON uown_los_customer(UPPER(first_name));

CREATE INDEX IF NOT EXISTS idx_customer_last_name_upper
ON uown_los_customer(UPPER(last_name));
```

**Migrations relacionadas (mesma sprint):**

- `V20260220064821` — `idx_phone_full_number_active` em `uown_los_phone((area_code || phone_number))`
- `V20260220064821` — `idx_lead_timestamp_status` em `uown_los_lead(row_created_timestamp DESC, lead_status)`

**Estratégia:**
- `idx_customer_first_name_upper` e `idx_customer_last_name_upper`: eliminam cálculo `UPPER()` em runtime durante busca por nome, habilitando Index Scan funcional
- `idx_phone_full_number_active`: suporta busca por telefone (`area_code || phone_number`) sem expressão em runtime
- Busca por nome agora usa os índices em vez de Seq Scan + UPPER() por linha

## Contexto Técnico

- **Endpoint:** `POST /api/search/los/simple` ou `GET /api/search/los`
- **Serviço Java:** `SearchService`
- **Frontend (Origination):** Barra de busca superior — permite buscar leads por: LeadPk, AccountPk, Phone, Email, SSN, InvoiceNum, UUID, last4CC, Name (first/last)
- **Tipos de busca:** `LeadPk`, `AccountPk`, `Phone`, `Email`, `SSN`, `InvoiceNum`, `UUID`, `last4CC`, `Name`
- **Controle de acesso por merchant:** `:allMerchants` (admin) ou `:merchantRefCodes` (merchant específico)

---

## User Stories (US)

### US01 — Índices de nome (UPPER) criados corretamente

> **Como** DBA ou engenheiro de infraestrutura,
> **Quero** verificar que os índices `idx_customer_first_name_upper` e `idx_customer_last_name_upper` foram criados,
> **Para que** buscas por nome no portal de Originação utilizem Index Scan em vez de Seq Scan.

**Critérios de Aceite:**
- `idx_customer_first_name_upper` existe em `uown_los_customer` com expressão `UPPER(first_name)`
- `idx_customer_last_name_upper` existe em `uown_los_customer` com expressão `UPPER(last_name)`
- Migration `V20260227113249` registrada com `success = true` em `flyway_schema_history`

---

### US02 — Busca por nome (first name) retorna leads corretos

> **Como** agente no portal de Originação,
> **Quero** buscar leads pelo primeiro nome do cliente,
> **Para que** eu possa localizar rapidamente um lead pelo nome do solicitante.

**Critérios de Aceite:**
- Busca por `searchType = 'Name'` com `firstName = 'John'` retorna todos os leads onde `UPPER(customer.first_name) = 'JOHN'`
- Busca é case-insensitive: 'john', 'JOHN', 'John' retornam o mesmo resultado
- Retorna `leadPk`, `leadStatus`, `firstName`, `lastName`, `email`, `phone`, `accountPk`
- Leads de outros clientes não são retornados

---

### US03 — Busca por nome completo (first + last) retorna lead exato

> **Como** agente no portal de Originação,
> **Quero** buscar leads pelo nome completo do cliente,
> **Para que** eu possa localizar com precisão um lead específico quando há múltiplos com o mesmo primeiro nome.

**Critérios de Aceite:**
- Busca por `firstName = 'John'` + `lastName = 'Doe'` retorna apenas leads onde `UPPER(first_name) = 'JOHN' AND UPPER(last_name) = 'DOE'`
- Leads com nome parcial diferente não aparecem
- Busca case-insensitive: 'john doe', 'JOHN DOE', 'John Doe' são equivalentes

---

### US04 — Busca por telefone retorna leads corretos

> **Como** agente no portal de Originação,
> **Quero** buscar um lead pelo número de telefone,
> **Para que** eu possa localizar clientes quando o agente de campo fornece o número de telefone.

**Critérios de Aceite:**
- Busca por `searchType = 'Phone'` com número completo `areaCode + phoneNumber` retorna o lead correto
- O índice `idx_phone_full_number_active` é utilizado (Index Scan confirmável via EXPLAIN)
- Leads sem telefone ou com telefone diferente não aparecem

---

### US05 — Busca por email retorna leads corretos

> **Como** agente no portal de Originação,
> **Quero** buscar leads pelo email do cliente,
> **Para que** eu possa localizar um cliente quando tenho apenas o endereço de email.

**Critérios de Aceite:**
- Busca por `searchType = 'Email'` com endereço de email retorna o lead correspondente
- Busca é case-insensitive (`UPPER(email) = UPPER(:searchString)`)
- Apenas leads com aquele email são retornados (sem duplicatas por `DISTINCT ON`)

---

### US06 — Busca por SSN retorna lead correto

> **Como** agente no portal de Originação,
> **Quero** buscar um lead pelo SSN do cliente,
> **Para que** eu possa identificar com precisão o cliente no sistema.

**Critérios de Aceite:**
- Busca por `searchType = 'SSN'` com SSN válido retorna o lead vinculado ao SSN
- Apenas 1 resultado (ou os leads vinculados ao mesmo SSN)
- SSN incorreto não retorna nenhum lead

---

### US07 — Busca por LeadPk retorna o lead exato

> **Como** agente no portal de Originação,
> **Quero** buscar um lead pelo seu ID numérico (leadPk),
> **Para que** eu possa acessar diretamente um lead quando tenho o número exato.

**Critérios de Aceite:**
- Busca por `searchType = 'LeadPk'` e `searchNumber = :pk` retorna apenas o lead com esse `pk`
- Busca por `searchType = 'AccountPk'` retorna o lead vinculado ao `account_pk` informado
- Resultado único e preciso

---

### US08 — Busca por invoice number retorna lead correto

> **Como** agente no portal de Originação,
> **Quero** buscar um lead pelo número da fatura do merchant,
> **Para que** eu possa correlacionar pedidos do merchant com aplicações no sistema.

**Critérios de Aceite:**
- Busca por `searchType = 'InvoiceNum'` com número de fatura retorna o lead com aquela `merchant_invoice_number`
- Busca é case-insensitive

---

### US09 — Controle de acesso por merchant funciona na busca

> **Como** representante de merchant (não-admin),
> **Quero** que a busca retorne apenas leads do meu merchant,
> **Para que** não haja vazamento de dados de outros merchants.

**Critérios de Aceite:**
- Usuário com `allMerchants = false` vê apenas leads do seu `merchantRefCode`
- Leads de outros merchants não aparecem no resultado
- Usuário admin com `allMerchants = true` vê todos os leads correspondentes

---

### US10 — Migration Flyway V20260227113249 aplicada com sucesso

> **Como** engenheiro de QA,
> **Quero** verificar que a migration `V20260227113249` foi aplicada com sucesso,
> **Para que** os índices de nome existam e a otimização seja efetiva.

---

## Cenários de Teste

### Cenário 1 — [US01] Índices UPPER(first_name) e UPPER(last_name) criados

```gherkin
Scenario: Verificar existência dos índices funcionais de nome em uown_los_customer
  Given o ambiente QA com migration V20260227113249 aplicada
  When consulto pg_indexes para a tabela "uown_los_customer"
  Then o índice "idx_customer_first_name_upper" existe com expressão "UPPER(first_name)"
  And o índice "idx_customer_last_name_upper" existe com expressão "UPPER(last_name)"
```

**Validação DB:**
```sql
SELECT indexname, indexdef FROM pg_indexes
WHERE tablename = 'uown_los_customer'
  AND indexname IN ('idx_customer_first_name_upper', 'idx_customer_last_name_upper');
-- Esperado: 2 linhas
```

---

### Cenário 2 — [US02] Busca por primeiro nome é case-insensitive

```gherkin
Scenario: Busca por firstName 'john' retorna mesmo resultado que 'JOHN'
  Given um lead com customer.first_name = 'John'
  When o agente busca por firstName = 'john' (lowercase)
  Then o lead é retornado corretamente
  When o agente busca por firstName = 'JOHN' (uppercase)
  Then o mesmo lead é retornado
  And a contagem de resultados é idêntica em ambas as buscas
```

---

### Cenário 3 — [US03] Busca por nome completo retorna lead exato

```gherkin
Scenario: Busca por first_name = 'John' e last_name = 'Doe' retorna apenas lead específico
  Given leads com firstName = 'John Smith' e firstName = 'John Doe' no banco
  When o agente busca por firstName = 'John' e lastName = 'Doe'
  Then apenas o lead com lastName = 'Doe' é retornado
  And o lead com lastName = 'Smith' não aparece no resultado
```

---

### Cenário 4 — [US04] Busca por telefone retorna lead correto

```gherkin
Scenario: Busca por telefone completo retorna o lead correspondente
  Given um lead com phone.area_code = '305' e phone.phone_number = '5551234'
  When o agente busca por searchType = 'Phone' e searchString = '3055551234'
  Then o lead é retornado corretamente
  And leads com outros telefones não aparecem
```

---

### Cenário 5 — [US05] Busca por email é case-insensitive

```gherkin
Scenario: Busca por email em lowercase retorna o mesmo resultado que uppercase
  Given um lead com email = 'Test@Example.com'
  When o agente busca por 'test@example.com'
  Then o lead é retornado
  When o agente busca por 'TEST@EXAMPLE.COM'
  Then o mesmo lead é retornado
```

---

### Cenário 6 — [US06] Busca por SSN retorna lead correto e único

```gherkin
Scenario: Busca por SSN retorna somente o lead vinculado ao SSN
  Given um lead com SSN = '123-45-6789'
  When o agente busca por searchType = 'SSN' e searchString = '123-45-6789'
  Then apenas o lead com esse SSN é retornado
  And leads com SSNs diferentes não aparecem
```

---

### Cenário 7 — [US07] Busca por LeadPk retorna lead exato

```gherkin
Scenario: Busca por leadPk numérico retorna apenas esse lead
  Given um lead com pk = 12345
  When o agente busca por searchType = 'LeadPk' e searchNumber = 12345
  Then apenas o lead com pk = 12345 é retornado
  And outros leads não aparecem no resultado
```

---

### Cenário 8 — [US07] Busca por AccountPk retorna lead vinculado

```gherkin
Scenario: Busca por accountPk retorna o lead com aquele account_pk
  Given um lead com account_pk = 9876
  When o agente busca por searchType = 'AccountPk' e searchNumber = 9876
  Then o lead com account_pk = 9876 é retornado
```

---

### Cenário 9 — [US09] Merchant com allMerchants = false não vê leads de outros merchants

```gherkin
Scenario: Merchant restrito vê apenas seus próprios leads na busca
  Given dois merchants: MerchantA e MerchantB com leads distintos
  And o agente autenticado pertence ao MerchantA
  When o agente busca por firstName = 'John'
  Then apenas leads do MerchantA são retornados
  And leads do MerchantB não aparecem no resultado
```

---

### Cenário 10 — [US10] Migration Flyway V20260227113249 aplicada com sucesso

```gherkin
Scenario: Migration V20260227113249 registrada como success em flyway_schema_history
  Given o banco de dados do ambiente QA
  When consulto flyway_schema_history WHERE version = '20260227113249'
  Then existe 1 registro com success = true
```

**Validação DB:**
```sql
SELECT version, description, success
FROM flyway_schema_history
WHERE version = '20260227113249';
-- Esperado: 1 linha com success = true
```

---

### Cenário 11 — [US08] Busca por invoice number retorna lead correto

```gherkin
Scenario: Busca por número de fatura retorna o lead correspondente
  Given um lead com merchant_invoice_number = 'INV-2026-001'
  When o agente busca por searchType = 'InvoiceNum' e searchString = 'INV-2026-001'
  Then o lead com aquela fatura é retornado
  When o agente busca por 'inv-2026-001' (lowercase)
  Then o mesmo lead é retornado (busca case-insensitive)
```

---

| # | Cenário | US | Ambiente | Status |
|---|---------|-----|----------|--------|
| 1 | Índices UPPER criados em uown_los_customer | US01 | QA2 | PENDING |
| 2 | Busca por firstName case-insensitive | US02 | QA2 | PENDING |
| 3 | Busca por nome completo retorna lead exato | US03 | QA2 | PENDING |
| 4 | Busca por telefone correto | US04 | QA2 | PENDING |
| 5 | Busca por email case-insensitive | US05 | QA2 | PENDING |
| 6 | Busca por SSN retorna lead único | US06 | QA2 | PENDING |
| 7 | Busca por LeadPk retorna lead exato | US07 | QA2 | PENDING |
| 8 | Busca por AccountPk retorna lead vinculado | US07 | QA2 | PENDING |
| 9 | Merchant restrito não vê outros merchants | US09 | QA2 | PENDING |
| 10 | Migration Flyway V20260227113249 aplicada | US10 | QA2 | PENDING |
| 11 | Busca por invoice number case-insensitive | US08 | QA2 | PENDING |

---

## Testes de Regressão E2E

> **Objetivo:** Validar que os índices `idx_customer_first_name_upper` e `idx_customer_last_name_upper` não causaram regressão na **busca do portal de Originação**. O `getLosSimpleSearchResults.sql` é chamado diretamente pelo passo `testQuickSearchMethods` em ambos os testes E2E — tornando-os a validação de regressão mais direta e precisa para este ticket.

### Testes Referenciados

| Spec | Caminho | Relevância para este ticket |
|------|---------|----------------------------|
| `unified-flow.spec.ts` | `tests/e2e/unified-flow.spec.ts` | **Phase 5 — `searchPage.testQuickSearchMethods()`**: executa busca por `leadPk`, `accountPk`, `email`, `firstName` e `lastName`. Os últimos três exercitam **diretamente** `getLosSimpleSearchResults.sql` com os índices `UPPER(first_name)` e `UPPER(last_name)`. |
| `new-application.spec.ts` | `tests/e2e/origination/new-application.spec.ts` | **Phase 12 — `searchPage.testQuickSearchMethods()`**: mesmo passo, mesmo código, executado após criar conta via UI. Valida que a busca por nome funciona para leads criados via UI do portal. |

---

### US-E2E01 — unified-flow.spec.ts executa sem regressão + quick search por nome funciona

> **Como** engenheiro de QA,
> **Quero** que o `unified-flow.spec.ts` passe e que o passo `testQuickSearchMethods` valide busca por nome,
> **Para que** eu confirme que os índices `UPPER(first_name)` / `UPPER(last_name)` não quebraram a busca de leads.

**Critérios de Aceite:**

- [ ] `Phase 1 — sendApplication`: leadPk retornado — lead criado com `uown_los_customer.first_name` e `last_name` populados
- [ ] `Phase 5 — testQuickSearchMethods — busca por leadPk`: lead encontrado via ID numérico
- [ ] `Phase 5 — testQuickSearchMethods — busca por email`: lead encontrado via `searchType = 'Email'`
- [ ] `Phase 5 — testQuickSearchMethods — busca por firstName`: lead encontrado — **exercita diretamente `idx_customer_first_name_upper`**
- [ ] `Phase 5 — testQuickSearchMethods — busca por lastName`: lead encontrado — **exercita diretamente `idx_customer_last_name_upper`**
- [ ] `Phase 5 — testQuickSearchMethods — busca por accountPk`: lead encontrado via `searchType = 'AccountPk'` após funding
- [ ] Nenhum resultado incorreto ou vazio retornado em qualquer busca
- [ ] **Resultado geral: PASS**

```bash
npx playwright test tests/e2e/unified-flow.spec.ts --project=origination-ui
```

**Validação DB pós-execução (confirmar índices usados pelo plano de execução):**
```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT DISTINCT ON (lead.pk) lead.pk
FROM uown_los_lead lead
JOIN uown_los_customer customer ON customer.lead_pk = lead.pk
WHERE UPPER(customer.first_name) = UPPER('TestFirstName')
LIMIT 10;
-- Esperado: "Index Scan using idx_customer_first_name_upper on uown_los_customer"
-- NÃO esperado: "Seq Scan" em uown_los_customer
```

**Resultado esperado:**
```
✓ Unified Flow - sandbox NY/TireAgent › Creating Uown account in "sandbox"  [PASS]
  Step "Test merchant portal quick search methods" ─ PASS
    ✓ Quick search by leadPk
    ✓ Quick search by email
    ✓ Quick search by firstName    ← exercita idx_customer_first_name_upper
    ✓ Quick search by lastName     ← exercita idx_customer_last_name_upper
    ✓ Quick search by accountPk
```

---

### US-E2E02 — new-application.spec.ts executa sem regressão + quick search por nome funciona

> **Como** engenheiro de QA,
> **Quero** que o `new-application.spec.ts` passe com o passo de quick search funcional após criação via UI,
> **Para que** eu confirme que leads criados pelo portal de Originação também são encontrados corretamente pela busca otimizada.

**Critérios de Aceite:**

- [ ] `Phase 1 — UI form + Phase 3 — sendApplication API`: lead criado com nome do aplicante em `uown_los_customer`
- [ ] `Phase 12 — testQuickSearchMethods — busca por firstName`: lead encontrado pelo nome gerado pelo teste — confirma que o índice `UPPER(first_name)` indexou corretamente o registro criado via UI
- [ ] `Phase 12 — testQuickSearchMethods — busca por lastName`: lead encontrado pelo sobrenome — confirma `idx_customer_last_name_upper`
- [ ] `Phase 12 — testQuickSearchMethods — busca por email`: lead encontrado pelo email gerado (`applicant.email`)
- [ ] `Phase 12 — testQuickSearchMethods — busca por leadPk`: lead encontrado pelo ID numérico
- [ ] Busca por firstName com capitalização diferente retorna o mesmo lead (case-insensitive via UPPER index)
- [ ] **Resultado geral: PASS**

```bash
npx playwright test tests/e2e/origination/new-application.spec.ts --project=origination-ui
```

**Resultado esperado:**
```
✓ New Application - stg NY/TireAgent › Creating Uown account via UI in "stg"  [PASS]
  Step "Test merchant portal quick search methods" ─ PASS
    ✓ Quick search by leadPk
    ✓ Quick search by email
    ✓ Quick search by firstName    ← exercita idx_customer_first_name_upper
    ✓ Quick search by lastName     ← exercita idx_customer_last_name_upper
    ✓ Quick search by accountPk
```

---

### Tabela de Status — Regressão E2E

| # | Spec | Step crítico | Índice exercitado | Ambiente | Status |
|---|------|-------------|-------------------|----------|--------|
| E1 | `unified-flow.spec.ts` | Quick Search por firstName → lead encontrado | `idx_customer_first_name_upper` | sandbox | PENDING |
| E2 | `unified-flow.spec.ts` | Quick Search por lastName → lead encontrado | `idx_customer_last_name_upper` | sandbox | PENDING |
| E3 | `unified-flow.spec.ts` | Quick Search por email → lead encontrado | `idx_phone_full_number_active` | sandbox | PENDING |
| E4 | `unified-flow.spec.ts` | Quick Search por leadPk → lead encontrado | `idx_lead_timestamp_status` | sandbox | PENDING |
| E5 | `new-application.spec.ts` | Quick Search por firstName → lead UI encontrado | `idx_customer_first_name_upper` | stg | PENDING |
| E6 | `new-application.spec.ts` | Quick Search por lastName → lead UI encontrado | `idx_customer_last_name_upper` | stg | PENDING |
| E7 | `new-application.spec.ts` | EXPLAIN: Index Scan em UPPER(first_name) | `idx_customer_first_name_upper` | stg | PENDING |

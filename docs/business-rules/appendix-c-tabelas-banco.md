# Apendice C: Tabelas de Banco Importantes
## UOwn Leasing - SVC Platform

Tabelas PostgreSQL mais importantes para verificacao e troubleshooting.

---

## Apendice C: Tabelas de Banco Importantes para Verificacao

| Tabela | Uso | Quando Consultar |
|--------|-----|-----------------|
| `uown_sv_account` | Contas de servicing | Verificar status, saldo, rating |
| `uown_los_lead` | Leads de aplicacao | Verificar status do lead, UW result |
| `uown_los_lead_short_code` | Short codes de lead (migrado de uown_los_lead) | Verificar short_code apos migracao V20260226100000 |
| `uown_lead_approval_terms` | Termos aprovados por lead (Task #1239) | Verificar termos UW/merchant/aprovados apos `termsStep` ou `CalculatorStep` |
| `uown_sv_cctransaction` | Transacoes CC | Apos sweeps de CC |
| `uown_sv_achpayment` | Pagamentos ACH | Apos sweeps de ACH |
| `uown_sv_receivable` | Recebiveis | Verificar parcelas, EPO, due dates |
| `uown_sweep_logs` | Logs de sweep | Verificar execucao de qualquer sweep |
| `uown_scheduled_task` | Definicao de sweeps | Verificar cron, SQL, is_active |
| `uown_email_queue` | Fila de emails | Verificar correspondencia enviada |
| `uown_sms_queue` | Fila de SMS (opt-in e notificacoes) | Verificar envio de SMS por lead/conta; indexes otimizados (Task #455) |
| `uown_sv_protection_plan` | Plano de protecao | Verificar inscricoes/cancelamentos |
| `uown_sv_contract` | Contratos | Verificar status de e-sign |
| `uown_blacklist_*` | Listas negras | Verificar entradas de fraude |
| `uown_frequency_mods` | Mudancas de frequencia | Auditoria de mudancas |
| `uown_due_date_moves` | Movimentacoes de due date | Auditoria de ajustes |
| `uown_sv_payment_arrangement` | Arranjos de pagamento (Task #446) | Verificar status (NOT_STARTED/IN_PROGRESS/SUCCESS/FAILED), tipo (NORMAL/SETTLEMENT), FK com transacoes CC/ACH |
| `qrtz_*` | Quartz scheduler | Estado dos jobs agendados |

---

## Indexes de Performance — SmsOptInConfirmationResponse (Task #455)

Indexes parciais criados pela migracao Flyway V20260220050615 para otimizar a query `SmsOptInConfirmationResponse`. Substituem o index combinado antigo (`idx_uown_sms_queue_lead_account_pk`) por dois indexes parciais independentes, reduzindo CPU em consultas de opt-in SMS.

| Index | Tabela | Coluna | Tipo |
|-------|--------|--------|------|
| `idx_uown_sms_queue_lead_pk` | `uown_sms_queue` | `lead_pk` | Partial (WHERE lead_pk IS NOT NULL) |
| `idx_uown_sms_queue_account_pk` | `uown_sms_queue` | `account_pk` | Partial (WHERE account_pk IS NOT NULL) |
| ~~`idx_uown_sms_queue_lead_account_pk`~~ | `uown_sms_queue` | — | **Removido** pela migracao |

---

## Indexes de Performance — getDataMismatchForLead (Task #449)

Indexes compostos criados para otimizar a query `getDataMismatchForLead` (Step 5 do pipeline de originacao). Reduzem CPU e I/O em verificacoes de fraude por impersonacao.

| Index | Tabela | Colunas | Finalidade |
|-------|--------|---------|-----------|
| `idx_uwdata_status_expiration` | `uown_los_uwdata` | `uw_status, approval_expiration_date` | Filtrar leads com UW aprovado dentro da validade |
| `idx_lead_timestamp_status` | `uown_los_lead` | `row_created_timestamp, lead_status` | Filtrar leads ativos por periodo de criacao |
| `idx_address_zip_code` | `uown_los_address` | `zip_code` | Joins de verificacao de endereco |
| `idx_address_state` | `uown_los_address` | `state` | Joins de verificacao de endereco por estado |

---

## Indexes de Performance — getLosActivityLog (Task #457)

Index composto criado pela migracao Flyway V20260225120421 para otimizar a query de activity log (alta CPU). Permite buscas por `lead_pk + log_type` com ordenacao por `row_created_timestamp DESC` sem seq-scan.

| Index | Tabela | Colunas | Tipo |
|-------|--------|---------|------|
| `idx_los_activity_lead_type_created_ts` | `uown_los_activity_log` | `lead_pk, log_type, row_created_timestamp DESC` | Composto |

---

## Indexes de Performance — getLeadSummaryResults (Task #461)

Indexes criados pela migracao Flyway V20260220064821 para otimizar a query `getLeadSummaryResults`. Inclui um index funcional de concatenacao de telefone e quatro indexes compartilhados com `getDataMismatchForLead` (Task #449).

| Index | Tabela | Colunas / Expressao | Tipo |
|-------|--------|---------------------|------|
| `idx_phone_full_number_active` | `uown_los_phone` | `(area_code \|\| phone_number)` | Funcional (expressao) |
| `idx_uwdata_status_expiration` | `uown_los_uwdata` | `uw_status, approval_expiration_date` | Composto (compartilhado com #449) |
| `idx_lead_timestamp_status` | `uown_los_lead` | `row_created_timestamp, lead_status` | Composto (compartilhado com #449) |
| `idx_address_zip_code` | `uown_los_address` | `zip_code` | Simples (compartilhado com #449) |
| `idx_address_state` | `uown_los_address` | `state` | Simples (compartilhado com #449) |

**Nota:** Indexes funcionais (expressao) devem ser verificados via `pg_indexes.indexdef` — o helper `getIndexColumns()` usa `pg_attribute` e nao retorna colunas de indexes baseados em expressao.

---

## Indexes de Performance — getLosSimpleSearchResults (Task #463)

Indexes funcionais criados pela migracao Flyway V20260227113249 para otimizar busca case-insensitive por nome de cliente na query `getLosSimpleSearchResults`. PostgreSQL armazena a expressao como `upper((col)::text)`.

| Index | Tabela | Expressao | Tipo |
|-------|--------|-----------|------|
| `idx_customer_first_name_upper` | `uown_los_customer` | `UPPER(first_name)` | Funcional (UPPER) |
| `idx_customer_last_name_upper` | `uown_los_customer` | `UPPER(last_name)` | Funcional (UPPER) |

**Regra de verificacao:** A query de busca DEVE usar `UPPER(first_name) = UPPER($1)` (e nao `ILIKE` ou comparacao direta) para que o planner utilize o index funcional.

---

## Indexes de Performance — Login e Account Status

Indexes criados pelas migracoes V20260306062454 e V20260311070247 para otimizar consultas de seguranca e rastreamento de status de conta.

| Index | Tabela | Colunas | Migracao | Finalidade |
|-------|--------|---------|----------|-----------|
| `idx_uown_login_attempt` | `uown_login_attempt` | `(username, created_date)` | V20260306062454 | Otimiza verificacao de rate limiting e auditoria de tentativas de login |
| `idx_account_status_leadpk` | `uown_sv_account` | `(account_status, lead_pk)` | V20260311070247 | Otimiza queries de busca de conta por status + lead (ex: sweeps de cobranca, relatorios) |

**Contexto:** O index de login foi adicionado em conjunto com o sistema de tracking de tentativas de autenticacao (auditoria de seguranca). O index de account_status + lead_pk acelera sweeps que filtram contas por status e depois fazem join com o lead de origem.

---

## Indexes de Performance — getLeadSummaryResults (V20260309065837)

Indexes adicionais criados para otimizar a query `getLeadSummaryResults` (tela de pesquisa de leads no Origination portal).

| Index | Tabela | Colunas | Finalidade |
|-------|--------|---------|-----------|
| Indexes de lead summary | `uown_los_lead`, `uown_los_customer`, `uown_los_address` | Varies | Busca rapida por nome, status, data e merchant na listagem de leads |

**Nota:** Os detalhes exatos das colunas indexadas podem ser verificados via:
```sql
SELECT indexname, indexdef FROM pg_indexes
WHERE tablename IN ('uown_los_lead', 'uown_los_customer', 'uown_los_address')
  AND indexname LIKE '%summary%'
ORDER BY indexname;
```

---

## uown_los_sched_summary — Term Month Display (Task #1242)

Tabela de schedule summary que contem informacoes do plano selecionado pelo cliente. O campo `term_in_months` e a fonte de dados para a coluna "Term Month" nas tabelas Overview e Leads do Origination portal.

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| `pk` | BIGSERIAL PK | Identificador unico |
| `lead_pk` | BIGINT FK | Referencia ao lead (`uown_los_lead.pk`) |
| `account_pk` | BIGINT FK | Referencia a conta (null ate funding) |
| `term_in_months` | INTEGER | Termo selecionado pelo cliente (13 ou 16 meses) |
| `plan_id` | VARCHAR | Identificador do plano (ex: `WK13`, `BWK16`) |
| `payment_frequency` | VARCHAR | Frequencia de pagamento selecionada |

**Ciclo de vida:**
- Registro criado durante `submitApplication` (NAO durante `sendApplication`)
- `term_in_months` populado a partir do `planId` selecionado pelo cliente
- Leads sem `submitApplication` completado nao tem registro — coluna "Term Month" exibe vazio no frontend
- JOIN: `LEFT JOIN uown_los_sched_summary ON lead_pk` (permite null)

**Query de verificacao:**

```sql
SELECT term_in_months, plan_id, payment_frequency
FROM uown_los_sched_summary
WHERE lead_pk = :leadPk
ORDER BY pk DESC
LIMIT 1;
```

---

## uown_lead_approval_terms (Task #1239)

Registra os termos aprovados para cada lead apos o `termsStep` (leads sem invoice) ou `CalculatorStep` (leads com invoice).

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| `pk` | BIGSERIAL PK | Identificador unico do registro |
| `lead_pk` | BIGINT FK | Referencia ao lead (`uown_los_lead.pk`) |
| `uw_terms` | VARCHAR | Termos retornados pelo underwriting (ex: `"13,16"`) |
| `merchant_terms` | VARCHAR | Termos configurados para o merchant (ex: `"13,16"`) |
| `approved_terms` | VARCHAR | Intersecao de UW e merchant — termos efetivos aprovados (ex: `"13,16"`) |
| `row_created_timestamp` | TIMESTAMP | Data/hora de criacao do registro |

**Regras:**
- Cada execucao do `termsStep` ou `CalculatorStep` **insere** um novo registro — nunca faz UPDATE/UPSERT
- Historico completo preservado por lead
- Valores exibidos no frontend via `approvedTermMonthsDisplay` do endpoint `GET /uown/los/getMerchantInfo/{leadPk}` (ex: `"13 months, 16 months"`)

**Query de verificacao:**

```sql
SELECT pk, lead_pk, uw_terms, merchant_terms, approved_terms, row_created_timestamp
FROM uown_lead_approval_terms
WHERE lead_pk = :leadPk
ORDER BY row_created_timestamp DESC;
```

---


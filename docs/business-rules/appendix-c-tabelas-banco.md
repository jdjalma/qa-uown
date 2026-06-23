---
title: "Apendice C: Tabelas de Banco Importantes"
domain: business-rules
status: stable
volatility: volatile
last_verified: 2026-06-23
sources:
  - db: uown_los_lead
  - db: uown_sv_account
  - db: uown_scheduled_task
  - db: uown_right_foot_balance_check
  - db: uown_customer_journey
  - env: qa2
covers: [tabelas, schema, postgres, indexes, troubleshooting, merchant-snapshot, rightfoot, customer-journey]
---

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
| `uown_right_foot_balance_check` | Resultado de saldo bancario RightFoot (R1.53.0) | Decide se o rerun ACH e criado (`status=SUCCESS` + saldo); ver secao RightFoot abaixo |
| `uown_right_foot_batch` | Auditoria de batch/webhook RightFoot (R1.53.0) | Verificar `status`, `webhook_payload`, `batch_complete_event_fired` |
| `uown_right_foot_outbound_api_log` | Log de chamadas externas RightFoot (R1.53.0) | Troubleshooting de integracao |
| `uown_customer_journey` / `uown_customer_session` / `uown_customer_event` | Telemetria do funil de originacao (R1.53.0, origination#1308) | Analise de drop-off/friccao; ver secao Customer Journey abaixo |
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

## Merchant Settings Snapshot (R1.53.0 — Flyway 20260609155406)

Tabelas criadas pela release 1.53.0 (deploy qa2 2026-06-15) para preservar a configuracao de underwriting do merchant no momento da aprovacao. Garante que mudancas posteriores no merchant nao afetam leads/contas ja aprovados.

| Tabela | Propósito | Chave unica |
|--------|-----------|-------------|
| `uown_los_lead_merchant_settings_snapshot` | Snapshot gravado na aprovacao UW do lead (LOS) | `lead_pk` UNIQUE |
| `uown_sv_account_merchant_settings_snapshot` | Snapshot herdado do lead, gravado na criacao da conta (SVC) | `account_pk` UNIQUE |

**Colunas de negocio (ambas, confirmadas no DDL):** `merchant_pk`, `program_pk` (nullable), `epo5` BOOLEAN (EPO 5%), `epo10` BOOLEAN (EPO 10%), `uw_pipeline` VARCHAR(10) (valores `GDS` / `ABBR` / `TAKTILE`), `fraud_threshold` INTEGER. A tabela de account adiciona `lead_pk`. (+ audit: `tenant_id`, `web_user_id`, `agent`, `row_created/updated_timestamp`.)

**Ciclo de vida (confirmado em codigo R1.53.0):**
- **Snapshot LOS (lead):** escrito por `MerchantSettingsSnapshotListener` em **nova transacao, AFTER_COMMIT**, ao receber `ApplicationApprovedEvent` — publicado por `ApplicationProcessor` apenas quando `isUwApproved` (status `UW_APPROVED`) **E** `maxApprovalAmount > 0`. Falha do snapshot **nao** falha a aplicacao (excecao engolida).
- **Snapshot SVC (account):** escrito inline no import LOS→SVC (`LosToSvcImportService`) **copiando os dados do snapshot do lead** — NAO reconsulta o merchant live. Se nao existir snapshot do lead, o snapshot da conta e **pulado**.
- Ambas as escritas sao **idempotentes** (skip se ja existe linha para o `lead_pk`/`account_pk`).
- `merchant_pk`/`program_pk` resolvidos via `findByLeadPk`; `epo5`/`epo10`/`uw_pipeline`/`fraud_threshold` vem de `MerchantInfo` (colunas GDS-config, Flyway `V20260312100000`).
- Leads/contas anteriores a R1.53.0 (pre-2026-06-15) NAO possuem snapshot (Path A para testes de ausencia).

**Fontes:** `service/MerchantSettingsSnapshotService.java`, `service/application/sendApp/listener/MerchantSettingsSnapshotListener.java`, `service/application/sendApp/ApplicationProcessor.java`, `service/LosToSvcImportService.java`, `pojo/MerchantInfo.java`. Entidades em JARs de dependencia (`los-common`/`svc-common`) — mapeamento `@Table` inferido por convencao JPA, **[HIPOTESE]**.

---

## Scores de Underwriting: npm_segment & tam_score (R1.53.0 — Flyway 20260603054943)

Colunas `npm_segment INTEGER` e `tam_score INTEGER` adicionadas a **`uown_los_uwdata`** (lead) E **`uown_sv_uwdata`** (account), ambas nullable.

- Origem: parseadas da resposta GDS (`out.npm_segment` / `out.tam_score`) -> `UWInfo` -> `uown_los_uwdata`; copiadas para `uown_sv_uwdata` no import LOS->SVC (mesmo objeto `UWInfo`).
- Significado: **[HIPOTESE]** — `tam_score` (modelo TireAgent, live 475 em stg per memoria), `npm_segment` (segmento de risco); pass-through de chaves JSON do GDS, svc nao filtra por client-type.
- Detalhe: [02-originacao-pipeline.md §40](02-originacao-pipeline.md).

---

## RightFoot — Verificacao de Saldo ACH (R1.53.0 — Flyway 20260612102430 / 20260616122043 / 20260619131000)

| Tabela | Propósito | Colunas-chave |
|--------|-----------|---------------|
| `uown_right_foot_balance_check` | 1 linha por request de balance check | `authorizer_unique_id` UNIQUE (`RFBC-{accountPk}-{snowflake}`), `account_pk`, `batch_id`, `routing_number`, `account_number`, `requested_amount`, `balance`, `status`, `failure_reason`, `process_type` |
| `uown_right_foot_batch` | Audit do webhook/batch | `batch_id`, `status`, `webhook_payload`, `errors`, `process_type`, `batch_complete_event_fired` |
| `uown_right_foot_outbound_api_log` | Log de chamadas de saida | `json_api_endpoint`, `request_url`, `http_method`, `request/response_body`, `http_status`, `stack_trace` |

- `uown_sv_achpayment.right_foot_balance_check_pk` (BIGINT) — FK do ACH criado para o balance check aprovado.
- `status` confirmado: `SUCCESS` (gate). Demais valores na lib `com.uownleasing:rightfoot` — **[HIPOTESE]**.
- Cleanup: `CleanupService.deleteOldEntries` purga linhas antigas. Regra completa: [09-integracoes-externas.md §48](09-integracoes-externas.md).

---

## Customer Journey / Session / Event — Analytics de Funil (R1.53.0 — Flyway 20260611054944/45/46)

Rastreamento do funil de aplicacao do cliente (abandono, refreshes, timing por pagina). Alimentado pelo **frontend** (Website/origination, iframe-embeddable) via `POST /api/journeys/...`. `journey_id` = `leadPk`.

| Tabela | Propósito | Colunas-chave |
|--------|-----------|---------------|
| `uown_customer_journey` | 1 por jornada | `journey_id` UNIQUE, `status`, `current_step`, `total_sessions`, `total_refreshes`, `total_submit_attempts`, `started_at`, `completed_at`, `last_activity_at`, `source`, `application_id`, `merchant_id`, `shortcode` |
| `uown_customer_session` | N por jornada | `session_id` UNIQUE, `journey_id`, `status`, `browser`, `device_type`, `operating_system`, `iframe_ind`, `embedder_origin`, `refresh_count` |
| `uown_customer_event` | N por sessao | `event_id` UNIQUE, `session_id`, `journey_id`, `event_type`, `page_name`, `api_duration_ms`, `render_duration_ms`, `page_duration_ms`, `error_code`, `error_message` |

- **JourneyStatus:** `IN_PROGRESS` -> `COMPLETED` (evento `REDIRECT_COMPLETED`); `ABANDONED` declarado mas **nunca setado** em codigo ([OBSERVACAO]).
- **event_type** com branch: `PAGE_REFRESHED` (incrementa refreshes), `REDIRECT_COMPLETED` (completa); demais = texto livre. **Session status** (texto livre): `ACTIVE`/`ENDED`.
- **[OBSERVACAO]** `total_submit_attempts`, `application_id`, `merchant_id`, `shortcode`, `source` declarados mas nunca populados em codigo svc R1.53.0; possivel no-op de persistencia em `CustomerJourneyService.complete()`. Confirmar com produto.
- Fontes: pacote `svc/analytics/`. Detalhe: [02-originacao-pipeline.md](02-originacao-pipeline.md) · [appendix-d D.37](appendix-d-constantes-enums.md).

---


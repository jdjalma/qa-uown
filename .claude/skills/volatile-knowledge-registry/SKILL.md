---
name: volatile-knowledge-registry
description: Carregue ao consultar categoria drift-prone — merchant config, sweep SQL em uown_scheduled_task, email templates, selectors em pages com refactor recente, rating letters enum, env-specific provisioning, vendor outages, sql_config admin operations, activity log schema. Categorias listadas aqui exigem verificação contra fonte primária antes de afirmar — NUNCA responder de memória sem cross-check.
disable-model-invocation: true
---

# Volatile Knowledge Registry — UOWN Leasing

> **Propósito:** catalogar categorias de conhecimento que mudam frequentemente no UOWN. Conhecimento listado aqui DEVE ser verificado contra fonte primária antes de cada uso. Responder de memória sobre essas categorias = bug do agente.
>
> **Origem:** padrão derivado de `anthropics/wage-hour-qa` (always-verify items). Adaptado ao fintech UOWN baseado em incidentes documentados em memórias.

---

## Como usar este skill

1. Antes de afirmar algo sobre uma categoria listada abaixo, **consulte a fonte primária** indicada
2. Cite a fonte com tag de proveniência (ver [[test-report-standard]] seção 9)
3. Se a memória conflita com a fonte primária atual, **atualize a memória** (não confie em memória stale)
4. Se a fonte primária é inacessível, classificar finding como `[HIPÓTESE]` no máximo (nunca `[CONFIRMADO]`)

---

## Registry — categorias volatile

### 1. Merchant config (checkboxes + programs)

**Por que volatile:** config muda via UI admin; provisioning entre envs é inconsistente; bugs antigos deixaram drift.

**Fonte primária:**
- Contrato esperado: [`src/data/merchant-config-contract.ts`](src/data/merchant-config-contract.ts)
- Estado atual: query `uown_merchant` + `uown_merchant_program` no env alvo
- Helper: `ensureMerchantReady` em [[merchant-preflight]]

**Tag a usar:** `[db-observation:uown_merchant WHERE name=...]` + `[doc:src/data/merchant-config-contract.ts]`

**Memórias relacionadas:** `reference_merchant_table_name`, `feedback_16m_eligibility_merchant_config`, `reference_kornerstone_ks3015_qa2_only`

### 2. Sweep SQL (uown_scheduled_task)

**Por que volatile:** SQL é editável via endpoint admin; drift entre sandbox/qa1/qa2/stg é frequente; lib `sticky.io` e MRs no svc divergem.

**Fonte primária:**
- SQL atual: query `SELECT scheduled_task_name, sql_to_pick_accounts, cron_trigger FROM uown_scheduled_task WHERE scheduled_task_name='{X}'`
- Spec esperada: ler código fonte em `svc` (`@ScheduledTask` annotations)
- Updates via: `POST /uown/createOrUpdateSqlConfig` (ver memória `reference_sqlconfig_admin_endpoint`)

**Schema real (confirmado qa1 2026-06-10, S2):**
- `uown_scheduled_task`: coluna do nome = **`scheduled_task_name`** (NÃO `name`); cron = **`cron_trigger`** (NÃO `cron`); **`last_trigger_time` reflete só trigger MANUAL, NÃO execuções Quartz** — oracle de execução real = `qrtz_triggers.prev_fire_time` + `uown_sweep_logs`.
- `uown_sweep_logs`: colunas reais = **`sweep_name`**, **`number_of_records_processed`**, **`error`**, **`source`**, **`start_time`** / **`end_time`** (NÃO `task_name`/`processed`/`created_timestamp`). `number_of_records_processed` escrito DEPOIS do processamento (leitura imediata = 0; app-lifecycle pitfall #87).
- Ver app-lifecycle pitfalls #94 (`uown_scheduled_task`) e #95 (`uown_sweep_logs`).

**Tag a usar:** `[db-observation:uown_scheduled_task WHERE scheduled_task_name=...]` + `[svc-source:{TaskClass}.java]`

**Memórias relacionadas:** `project_sticky_io_485_drift`, `project_svc_485_sticky_recover`, `reference_get_scheduled_task_by_name`, `reference_sql_config_uppercase`

### 3. Email templates + GCS bucket

**Por que volatile:** templates são editáveis via GCS bucket; schema de `uown_los_lead_notes` divergiu da doc no passado; nem todo email gera log.

**Fonte primária:**
- Catálogo de templates: skill [[email-templates-catalog]]
- Schema atual: query `\d uown_los_lead_notes` no env
- Bucket: `storage.googleapis.com/uown/`

**Tag a usar:** `[skill:email-templates-catalog]` + `[db-observation:...]`

**Memórias relacionadas:** `reference_email_templates_catalog`, `feedback_email_imap_click_link`, `reference_imap_fintechgroup777`

### 4. Selectors em pages com refactor recente

**Por que volatile:** portals (Origination/Servicing/Website/AMS) sofrem refactors UI; selectors em page objects podem estar desatualizados; `<button>` vs `<a>` é troca comum.

**Fonte primária:**
- DOM real: [[dom-investigation]] via MCP Playwright (regra #15)
- Página fonte: repos em `.claude/context/app-repos.md` quando aplicável

**Tag a usar:** `[dom-snapshot:date,viewport]`

**Casos conhecidos:**
- `unified-flow` 2026-05-11: `<a>` vs `<button>` em "Items Purchased"
- Refund/Reverse Servicing 2026-06-01 (dev3): tela correta e `/payment-history/{pk}` (NAO `/payment-transaction`); icone de reverse e `svg[data-icon="arrow-rotate-left"]` (NAO `.fa-undo`); `reverseReason` e React Select (`<div>`, NAO `<select>` - `selectOption` falha). Sempre confirmar `tagName` via `browser_evaluate`. Ver application-lifecycle pitfalls #77/#78 e [[payment-flows]].

**Memórias relacionadas:** protocolo em [[dom-investigation]]; case study `unified-flow` 2026-05-11; `project_refund_servicing_flow` (2026-06-01)

### 5. Rating letters enum

**Por que volatile:** doc `business-rules` pode estar incorreta; enum canônico está em código svc; significado de letras já passou despercebido no passado (S=Sold não Standard; M=MR Money Owed não Military).

**Fonte primária:**
- `RatingLetter.java` no repo `svc-common` (consultar via `.claude/context/app-repos.md`)

**Tag a usar:** `[svc-source:RatingLetter.java:linha]`

**Memórias relacionadas:** `reference_rating_letters_enum`

### 6. Env-specific provisioning

**Por que volatile:** features/merchants não estão uniformemente provisionados entre sandbox/qa1/qa2/stg/dev*; informação fica stale rápido (KS3015 era "só qa2" até 2026-05-18 quando foi corrigido para "todos envs").

**Fonte primária:**
- Verificação direta no env via query DB ou tentativa de uso
- Tag de data é mandatória — provisioning muda

**Tag a usar:** `[db-observation:{env}, query]` + `[user-provided:date]`

**Casos conhecidos (pending deploy — re-verificar antes de afirmar):**
- **GDS data fields on Merchant Config Columns** — os 3 campos GDS (`UW Pipeline`, `Fraud Threshold`, `Max Approval Amount`) NÃO estavam deployados em **qa1 em 2026-06-15** (confirmado via MCP Playwright). Quando a feature for deployada, esse status muda — re-verificar via Config Columns em `/merchant` (presença das 3 colunas no painel) ANTES de afirmar disponibilidade. Selectors prontos em `MerchantSettingSelectors` (`msUwPipelineInput`, `msFraudThresholdInput`, `msMaxApprovalAmountInput`, `msGdsDataToggle`). Fonte: `docs/knowledge-base/merchants-config-columns-export.md` + [[page-object-pattern]] MerchantListPage. Tag: `[db-observation:qa1, /merchant Config Columns]` + `[user-provided:2026-06-15]`.

**Memórias relacionadas:** `reference_kornerstone_ks3015_qa2_only`, `project_dv360_uat_qa1_outage_2026_05_18`

### 7. Vendor outages e env health

**Por que volatile:** dependências externas (DV360, GoSign, Kount, SEON, sticky.io) caem; problemas em qa1 são frequentes; outage de ontem pode estar resolvido hoje.

**Fonte primária:**
- Tentativa real: `sendApplication` + observar status; verificar via `canContinue`
- Logs `uown_sweep_logs` para sweep status

**Tag a usar:** `[test-execution:run-id]` + `[api-response:endpoint,status]`

**Memórias relacionadas:** `project_dv360_uat_qa1_outage_2026_05_18`

### 8. SQL config admin operations

**Por que volatile:** endpoint correto não é o intuitivo; `sql_name` lookup é UPPERCASE (BE faz `.toUpperCase`); queries lowercase retornam 0 rows; procedimento de fix é específico.

**Fonte primária:**
- Endpoint: `POST /uown/createOrUpdateSqlConfig` (NÃO `/uown/svc/...`)
- Lookup case: sempre UPPERCASE

**Tag a usar:** procedimento é estável (vive no skill), mas o ESTADO de cada `sql_config` é volatile: `[db-observation:uown_sv_sql_config WHERE sql_name='X']`

**Memórias relacionadas:** `reference_sqlconfig_admin_endpoint`, `reference_sql_config_uppercase`

### 9. Activity log schema (uown_los_lead_notes)

**Por que volatile:** schema doc estava errada em algum momento; coluna `note_type` foi removida; nem toda ação de negócio gera log (gap real — regra #13).

**Fonte primária:**
- `\d uown_los_lead_notes` no env
- Skill [[activity-log-validation]] para patterns conhecidos
- Lista de gaps conhecidos (ex: Welcome email não gera lead_note)

**Tag a usar:** `[db-observation:\d uown_los_lead_notes]` + `[skill:activity-log-validation]`

**Memórias relacionadas:** `reference_email_templates_catalog` (menciona schema discovery)

### 11. Sentry Session Replay — semantics per-tab (not per-application)

**Por que volatile:** o `replayId` retornado por `Sentry.getReplay?.getReplayId` é per-browser-session/tab, não per-application. Testes que assertam unicidade de UUID entre duas apps na mesma aba estão incorretos. Behavior confirmado em qa1 2026-05-22 — dois leads distintos na mesma aba compartilharam o mesmo `uuid` em `uown_lead_recording`. Fácil de assumir errado ao especificar ("recording de cada app deve ser distinto").

**Fonte primária:**
- Sentry public docs sobre Session Replay (replay scope = browser session)
- DB `uown_lead_recording`: coluna `uuid` = Sentry replay ID; presença de row = recording vinculado; unicidade de `uuid` entre rows de tabs distintas (NÃO da mesma aba)
- Tabela: `SELECT pk, lead_pk, uuid FROM uown_lead_recording WHERE lead_pk IN (...)` — mesma aba → mesmo uuid; tabs separadas → uuid distinto (fixture Playwright cria context novo por test)

**Regra de assertion:**
- AC "recording link presente" = row EXISTS em `uown_lead_recording` para o `leadPk` → `expect(uuid).toBeTruthy`
- NÃO assertar `uuid1 !== uuid2` quando ambas as leads foram criadas na mesma aba Playwright
- Para tests same-tab (CT-01/CT-02 de #1291): igualdade de UUID é ESPERADA e confirma que o Sentry SDK está rodando normalmente

**Tag a usar:** `[db-observation:uown_lead_recording WHERE lead_pk=...]` + `[sentry-docs:session-replay-scope]`

**Memórias relacionadas:** `reference_sentry_replay_per_tab` (2026-05-22)

### 10. Portal naming (customer vs agent)

**Por que volatile:** nomes em inglês confundem; "Website" é portal do **cliente** (OTP, signing), "Servicing" é portal do **agent** UOWN. Confusão induz teste no portal errado.

**Fonte primária:**
- Memória `feedback_portal_naming` (relativamente estável)
- Verificação: URL contém `/customer-portal` ou subdomain `customer.*` → portal do cliente

**Tag a usar:** `[memory:feedback_portal_naming]` para asserções; verificar URL ao receber requisição

**Memórias relacionadas:** `feedback_portal_naming`, `feedback_payment_ui_first_servicing`

### 12. Phone table name — `uown_los_phone` (NÃO `uown_los_lead_personal_info`)

**Por que volatile:** nome intuitivo (`uown_los_lead_personal_info`) NÃO existe; erro silencioso — query retorna `relation does not exist` e helpers travam. Qualquer agent novo que precisar de phone pode tentar o nome "intuitivo".

**Fonte primária:**
- `src/helpers/database.helpers.ts:1354` — query canônica existente no repo
- `SELECT (area_code || phone_number) AS phone FROM uown_los_phone WHERE lead_pk=$1 AND phone_type='MOBILE' LIMIT 1`

**Tag a usar:** `[src:database.helpers.ts:1354]`

**Memórias relacionadas:** pitfall #55 (application-lifecycle), F-09 (2026-05-24)

### 13. Fixture PKs em qa1 — drift por reseed

**Por que volatile:** leads em qa1 são reseedados; `account_pk` pode mudar de NOT NULL para NULL após reseed; PKs hard-coded num CT ficam stale silenciosamente.

**Fonte primária:**
- Resolver dinamicamente: `SELECT pk FROM uown_los_lead WHERE lead_status='FUNDED' AND account_pk IS NOT NULL ORDER BY pk DESC LIMIT 1`
- Para SVC search (exige `account_pk IS NOT NULL`): adicionar filtro `account_pk IS NOT NULL` SEMPRE

**Tag a usar:** `[db-observation:qa1, dynamic-lookup]` — NUNCA `[CONFIRMADO]` com PK fixo

**Memórias relacionadas:** pitfall #57 (application-lifecycle), Exec 2 (2026-05-24)

### 14. `getLosSearch_*` SQL aliases — drift pós-MR

**Por que volatile:** MRs que corrigem aliases em SQLs especializados podem deixar arquivos irmãos desatualizados (BUG-1 : MR !1370 corrigiu 9/10 SQLs, `getLosSearch_FreeText.sql` ficou com `rowCreatedTime` em vez de `createdTimestamp`). Após qualquer MR no svc que toque SQLs de search, auditar aliases de TODOS.

**Fonte primária:**
- Script de auditoria: `src/scripts/audit-search-sqls.ts` — compara aliases entre todas as variantes
- DB: `SELECT sql_name, sql_query FROM uown_sv_sql_config WHERE UPPER(sql_name) LIKE 'GETLOSSEARCH%'`

**Tag a usar:** `[db-observation:uown_sv_sql_config, LIKE 'GETLOSSEARCH%']` + `[svc-source:getLosSearch_*.sql]`

**Memórias relacionadas:** pitfall #58 (application-lifecycle), BUG-1 (2026-05-24)

### 15. Mapeamento label UI → `searchType` backend (Origination vs Servicing)

**Por que volatile:** label exibido no dropdown da UI NÃO corresponde diretamente ao valor de `searchType` enviado na query string. Exemplos de discordância conhecida: Origination usa `InvoiceNum`, Servicing usa `InvoiceNumber`; outros tipos podem divergir entre portais. Assumir mapeamento 1:1 quebra silenciosamente.

**Fonte primária:**
- DOM-first: inspecionar `browser_network_requests` no Origination e Servicing para cada tipo via MCP
- Código Java: `SearchService.resolveLosSearchSqlName(searchType)` e equivalente SVC
- `src/pages/search.page.ts` — `SearchType` union e mapeamento de labels

**Tag a usar:** `[dom-snapshot:date,portal]` + `[svc-source:SearchService.java]`

**Memórias relacionadas:** pitfall #54 (application-lifecycle), spec §13 (2026-05-24)

### 16. Move Due Date — WEEKLY cap varia por env/versão

**Por que volatile:** o teto de dias permitidos para Move Due Date em frequência WEEKLY mudou entre versões do svc. Hard-coding o valor num teste quebra silenciosamente ao rodar em env de versão diferente.

**Valores observados:**
- dev3 / (era 2026-05-22): cap WEEKLY = **3 dias** (`WEEKLY→3d`, demais→7d; fonte `MoveDueDatesService.java:117-126`)
- qa1 (2026-06-10, S4): cap WEEKLY = **6 dias** (mensagem literal: `"Due date offset cannot exceed 6 days for WEEKLY frequency"`)

**Fonte primária:**
- `MoveDueDatesService.java` (validação do cap por frequência) — verificar a versão deployada no env alvo ANTES de afirmar o valor
- Mensagem de erro literal retornada pelo backend ao exceder o cap (confirma o valor vigente no env)
- Oracle de qual versão roda o env: `/actuator/info` + reference `dev3_spring_boot_3_upgrade`

**Tag a usar:** `[svc-source:MoveDueDatesService.java:linha]` + `[test-execution:{env},run-id]` — NUNCA `[CONFIRMADO]` com valor fixo sem tag de env+data

**Memórias relacionadas:** `reference_move_due_date_validation` (dev3/ = 3d — datado, cross-check antes de usar), `project_move_due_date_trailing_slash_bug`, `feedback_drive_lead_to_funding_default_weekly`

---

## Anti-patterns

- ❌ Responder de memória sobre qualquer categoria acima sem verificar fonte primária
- ❌ Citar memory como `[CONFIRMADO]` — memory é registro datado, pode estar stale
- ❌ Assumir que "se memória diz X, então X" — verificar contra fonte atual
- ❌ Não atualizar memória quando descobre drift — perpetua o problema
- ❌ Estender registry sem incluir fonte primária — categoria sem fonte é "always-verify" sem ação concreta
- ❌ Inferir estado de categoria volatile a partir de report em `docs/taskTestingUown/` (regra #16: reports = history)

---

## Como adicionar categoria nova

Critério para entrar no registry:
1. **Mudou pelo menos 2× no histórico documentado** (memórias, ADRs, postmortems)
2. **Tem fonte primária identificável** (não é "perguntar o Yuri")
3. **Causou bug ou findings errados quando assumido como estável**

Formato de entrada:
- Nome da categoria
- "Por que volatile" (uma frase com causa)
- "Fonte primária" (caminho/query/endpoint específico)
- "Tag a usar" (do source-tagging em [[test-report-standard]] seção 9)
- "Memórias relacionadas" (links)

---

## Cross-links

- Regra #10 (conservadora): categorias volatile exigem tag de fonte → fundamenta `[CONFIRMADO]`
- Regra #16 (reports = history): memórias e reports são history — fonte primária é skill/código/DB
- Skill [[test-report-standard]] seção 9: taxonomia de tags
- Memória `feedback_consult_svc_when_unsure`: princípio geral aplicado aqui

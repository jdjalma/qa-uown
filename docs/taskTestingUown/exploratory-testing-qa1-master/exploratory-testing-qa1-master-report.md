# Relatório-Mestre de Teste Exploratório — QA1

> **Este arquivo é registro de execução, NÃO fonte de padrão.** (regra #16)
> Réplica em qa1 da bateria exploratória dev3 (`../exploratory-testing-dev3-master/`). Multi-sessão, iniciada 2026-06-10.
> Autorização Exception 3 (DB mutation) concedida pelo user em 2026-06-10: permitida em contas novas (criadas pela bateria) ou contas já existentes - registro obrigatório de cada mutação neste report.

## Índice de sessões
- **S0 (2026-06-10)** - Preflight: conectividade, query helper env-driven, gap-probe vs dev3. CONCLUÍDA.
- **S1 (2026-06-10)** - Exploração ampla UI dos 3 portais (réplica dev3 Sessão 1). CONCLUÍDA. **BLOQUEADOR: Origination portal inutilizável (QA1-BUG-001)**; Servicing OK com 1 bug de UI novo (QA1-BUG-002 Due Amounts stale); Customer Portal validado.
- **S2 (2026-06-10)** - Sweeps: inventário + análise dos 14 ativos via Quartz como oracle natural. CONCLUÍDA. Nenhum disparo manual (regra #3: todos os de pagamento tinham contas reais/órfãs ou já rodam sozinhos); **SW-BUG-001 de dev3 NÃO existe em qa1** (CreateScheduledCC processa OK); 2 achados novos (SW-OBS-QA1-001 token TrustPilot plaintext nos logs; SW-OBS-QA1-002 eSign EMBEDDED fora do escopo do sweep). Zero mutações no DB. Sweeps NÃO têm UI no Servicing (gestão via admin API).
- **S3 (2026-06-10)** - Payment Arrangement lifecycle. CONCLUÍDA. View page OK (8 colunas, 3 arrangements 4452, expand-row CC sub-table); **sem Edit/Cancel confirmado [CONFIRMADO]** (O-NEW-001 replica - inventário DOM da região da tabela só tem 3 botões "Expand Row"); audit chain regra #13 COMPLETA em qa1 (incl. "Arrangement finalized as SUCCESS" organic - dev3 NÃO conseguia gerar sem stand-in sintético); PA-OBS-QA1-001 arrangement pk271 órfão NOT_STARTED com único CC payment CANCELLED. Zero dados criados (observação em arrangements existentes).
- **S4 (2026-06-10)** - Move Due Date. CONCLUÍDA. MDD-001 confirmado regressão exclusiva SB3: qa1 (SB 2.x) aceita trailing slash e retorna 200; validação WEEKLY cap=6d (vs 3d catalogado em dev3); history Due Date Changes OK; state restaurado.
- **S5 (2026-06-10)** - Frequency Change + Scheduled Payment + Make Payment. CONCLUÍDA. Frequency Change funciona (4 freqs, API 200, grava `uown_sv_sched_summary` + `uown_frequency_mods` + log `FREQUENCY_CHANGE`, restaurado a WEEKLY); **QA1-BUG-003 [CONFIRMADO] Frequency Changes history renderiza vazio apesar da API retornar 200 COM dados** (refina/eleva o SW-OBS-009 de dev3: causa é shape aninhado `frequencyModInfo`, bug de frontend, NÃO endpoint vazio); **NÃO existe tela dedicada "Scheduled Payment"** (futuro = Make Payment com data futura, replica dev3 S6); Make Payment modal mapeado (ACH/CC/Check, Allocation Payment/Payment-EPO/EPO-Only, existing/one-time bank) sem submit (CC processor real); FREQ-OBS-QA1-001 LOS-side `uown_los_sched_summary` não sincroniza com mudança servicing-side.
- **S6 (2026-06-10)** - SVC-04 Settlement / SVC-06 Banking / SVC-07 Contact-OptOut. CONCLUÍDA. Settlement panel+modal funcionam (4452=$2500.16, 3992=$0.00); **SETTLE-OBS-QA1-001 [HIPÓTESE] label "Offer Percent" do modal é semanticamente invertido** (DB offer_percent=0.70 exibido como "30%"; matemática correta, rótulo confunde agente); **BANK-OBS-QA1-001 [CONFIRMADO] Routing E Account number 100% UNMASKED no card Bank Account** (eleva S1 H-010: routing também exposto); BANK-OBS-QA1-002 dois botões "View All" (fragilidade de page object, test-side); Contact opt-out = optOutAi/doNotCall/doNotText (UI confirma DB: 3992 doNotText=ON); **CC Peek consent sem UI no Servicing** (read-only, setado em application-time); Podium button gated atrás de envelope. Zero settle/zero mutação bancária/zero toggle - só logs REVIEW benignos.
- **S8 (2026-06-10)** - CONCLUÍDA. Criação de Aplicação: sendApplication (API) + new-application (UI). **QA1-BUG-001 root cause REFINADO [CONFIRMADO]**: o BFF/proxy do portal Origination em qa1 roteia `/uown/*` para upstream LOS quebrado/errado — provado por A/B browser (qa1 0-OK/11-FAIL vs qa2 11-OK/0-FAIL, MESMA flow, tokens de tamanho ~igual 7488 vs 7271 → NÃO é header-size) E pelo smoking-gun: os MESMOS endpoints (`getAllClientTypes`, `getLeadFilterOptions`) com os MESMOS headers `username`/`usertoken` retornam **200 via svc-qa1** (LOS direto) e **400 vazio via origination-qa1** (BFF). Wizard `/newApplication` (rota real) renderiza Step-1 (Email/Phone/Merchant/Location/SEND) mas merchant dropdown não popula (`getBasicMerchantInfoByRefCode` 400). **sendApplication via svc API 100% FUNCIONAL**: 13m (lead 12272, non-916 SSN → `EligibleTerms 13`) e 16m (lead 12274, suffix 916 → `EligibleTerms 16`) ambos APPROVED $4190, audit chain completa (regra #13). **Recipe 916→16m CONFIRMADO via fresh repro.** SEND-OBS-QA1-001 token JWT TTL=15min com `data.permissions` de 5.5KB.
- **S7 (2026-06-10)** - Checklist: signing, documents, responses, protection plan, sticky. CONCLUÍDA. Signing data REAL em qa1 (981 UW_APPROVED, SignWell 261 COMPLETED + GowSign 255 SENT_TO_CUSTOMER + PandaDoc; vs dev3 0 approved); Sticky Recover com 3 rows reais (4945/4946, cc DENIED, `number_of_attempts=0` — coluna real, NÃO `retry_attempt`); colunas Sticky Recovery Status/Txn ID renderizam no CC history; Reverse Payment affordance OK (payment-history, colunas Reverse/Update); Customer Portal **/documents derruba sessão (réplica BUG-S10-001 dev3, agora 3 ambientes)** e **/responses 404 [CONFIRMADO] (réplica dev3)**; Protection Plan section renderiza (3992 COMPLETED) mas **0 ACTIVE no ambiente todo** (cancel sem dado natural, igual dev3); PP-OBS-QA1-001 inconsistência log "No protection plan" vs row COMPLETED; History dropdown (Email/PayNearMe/Phone/CC) funcional via menu JS-driven (href vazio, replica a11y O-015). Zero mutação / zero signing disparado.
- **S9 (2026-06-10)** - Config DANIELS_JEWELERS (required fields sem `mainNextPayDate`) + sendApplication. CONCLUÍDA. Config aplicada via `POST /ConfigurationManagement/createOrUpdateConfig` (key validator `required.fields.for.DANIELS_JEWELERS`, pk 137, 200, persistida no DB) + `forceReloadConfig` 200; merchant `OL90205-0088` (Daniel's Jewelers Sugar Land, TX — `merchantNumber` resolve por `ref_merchant_code`, confirmado no svc). **sendApplication sem `mainNextPayDate` AINDA retorna 400 `mainNextPayDate is required` (fresh repro 2x).** Root cause CONFIRMADO no código svc: **o endpoint `createOrUpdateConfig` grava na tabela DB `uown_configuration_management` (lida pelo `common.ConfigurationManagementService`), mas o validator lê via `svc.config.configuration.ConfigurationManagement` → `ConfigurationUtility.getString` → Hazelcast `configurationMap`, que é re-hidratado a CADA leitura SÓ a partir de `SystemConfigurationProperties` (`system.config.*` do `application.yaml`).** São dois sistemas de config desconexos — a chave DANIELS nunca chega ao map, então o validator cai no default do código (`...,mainNextPayDate`). **A config SÓ tem efeito via o `application.yaml` (commit `62e2fc20`) + reload de pod, NÃO via a API DB.** Nenhum lead persistido (validação rejeita pré-persistência; regra #13 N/A). **Memória `reference_config_management_endpoint.md` corrigida** (a generalização "createOrUpdateConfig aplica config" é falsa para chaves servidas pelo `system.config` YAML). Pitfall novo catalogado (regra #11).

---

## S0 — Preflight (2026-06-10)

**Método:** read-only (SELECT via `src/scripts/env-query.mjs`, novo helper env-driven que substitui o `dev3-query.mjs` hardcoded) + curl na API svc + HEAD nos portais.

### Conectividade

| Alvo | Resultado |
|---|---|
| DB qa1 (`UOWN_DB_URL_QA1`) | OK - db `svc`, TZ `America/New_York` (atenção pitfall #66 TZ drift) |
| API svc (`svc-qa1.uownleasing.com`) | OK - `getAllScheduledTasks` 200, 77 tasks |
| Portais (origination / svc-website / website / ams-website -qa1) | Todos HTTP 200 |
| Quartz | VIVO - 2 instâncias, checkin atual; 14 triggers WAITING disparando em dia, 67 PAUSED |

### Versão do backend (oracle MDD-001)

GET com trailing slash (`/getAnyScheduledTaskByName/emailSweep/`) → **HTTP 200** → qa1 roda **Spring Boot 2.x** (em SB3/dev3 retorna 404 "No static resource"). Expectativa para S4: **Move Due Date FUNCIONA em qa1** - confirmar via UI fecha o escopo do MDD-001 como regressão exclusiva SB3.

### Gap-probe: o que mudou vs dev3

| Item (bloqueador em dev3) | dev3 | qa1 | Implicação |
|---|---|---|---|
| CC processor (ChannelPayments) | ausente (404 connector) | **PRESENTE** - 366 cct APPROVED nos últimos 30d | Sweeps de CC/retry/sticky validáveis com outcome REAL (Nível A) |
| Tabela `uown_accounts_to_be_sold` | ausente (criada por deploy 06-03) | **EXISTE** | delinquencyOffer/Reminder sweeps rodam |
| Coluna `tax_per_scheduled_payment` | criada por deploy 06-03 | **NÃO EXISTE** | `generateVerventOnBoardingFileSweep` deve falhar em qa1 (validar em S2 - mesmo SW-BUG-003 de dev3) |
| Protection plans ACTIVE | 0 | **0** | Cancel de protection plan segue sem dado natural; criar via fluxo ou mutação autorizada |
| `uown_sticky` | 1 row sintética | 3 rows | Sticky Recover com dado real; `uown_sticky_retry_attempt`=0 |
| Leads APPROVED (signing flow) | 0 (bloqueava 7 itens) | 981 UW_APPROVED | Signing flow testável; ainda assim criar lead FRESH (test-data-hierarchy) |
| Volume | baixo | 1.473 accounts ACTIVE, 2.002 FUNDED | Exploração com dados realistas |

### Sweeps em qa1 (inventário)

- 77 tasks no DB (dev3: 57 ativos). **Apenas 14 ativos** em qa1: emailSweep, eSignDocumentStatus, getCompletedESign, SendACH, getSendACHStatus, getStatusDatePaymentsList, SendCC, CreateScheduledCC, StickyRecover, StickyRecoverCancel, ProgramActivationDeactivation, refreshKount/Gds/TrustPilot.
- 63 PAUSED → S2 precisará de resume → trigger → **re-pause (restaurar estado original)** - qa1 é compartilhado.
- `[OBSERVAÇÃO]` `uown_scheduled_task.last_trigger_time` NÃO é atualizado pelas execuções Quartz (emailSweep ativo rodando a cada 5min com last_trigger_time=2026-05-20); semântica = só trigger manual. Não confiar nessa coluna como oracle de "rodou"; usar `qrtz_triggers.prev_fire_time` + `uown_sweep_logs`.

### Artefatos S0

- `src/scripts/env-query.mjs` (novo) - helper read-only env-driven: `node src/scripts/env-query.mjs "SELECT ..."` usa `ENV` do `.env` (qa1 atual); override com `QUERY_ENV=`.
- `.env` já estava com `ENV=qa1`; credenciais QA1 (DB + QA1_ADMIN) presentes.

### Riscos/notas para as próximas sessões

1. **Sweep specs NÃO portáveis as-is**: pks dev3 hardcoded (219/220/221/67/222) + UPDATEs no setup. Adaptar para discovery dinâmico de contas qa1 antes de rodar (S2).
2. qa1 compartilhado (UAT DV360, tasks svc): mutações restritas a contas novas/teste, com registro e restauração; sweeps re-pausados após teste.
3. CC processor real em qa1 → triggers de sweeps de pagamento podem gerar **cobranças reais em contas de teste** - revisar elegíveis ANTES de cada trigger (SELECT do `sql_to_pick_accounts`).

---

## S1 — Exploração ampla UI (2026-06-10)

**Método:** UI-first via MCP Playwright (regra #18), viewport 1440x900, usuário `manager` (e `test.tester` para isolamento de causa). Oracle secundário: network tab + curl + comparação qa2.

### 🔴 QA1-BUG-001 [CONFIRMADO] — Portal Origination INUTILIZÁVEL: todas as chamadas autenticadas retornam HTTP 400 vazio

**Sintoma:** após login OK (manager ou test.tester), TODA chamada `/uown/*` do portal retorna **HTTP 400 com corpo vazio** (`content-length: 0`, `x-powered-by: Express`). UI mostra toast "Unexpected Server Error", métricas zeradas, tabelas vazias. 14 endpoints distintos testados (overview: getApplicationCountDetails, getApprovalRateDetails, getLeadsInDateRange, getLeadFilterOptions, getAllClientTypes...; programs: getAllMerchantPrograms, getMerchantProgramsGroupName). Persiste após reload e re-login.

**Isolamento de causa (matriz):**
| Probe | Resultado |
|---|---|
| qa1, browser, manager | 400 vazio em tudo |
| qa1, browser, test.tester | 400 vazio em tudo (não é usuário/permissão) |
| qa2, browser, manager, MESMO fluxo | **200 em tudo** (não é bug do frontend release) |
| qa1, API partner `POST /uown/los/getApplicationStatus` c/ API key | 400 ESTRUTURADO de validação ("userName is required...") — backend LOS vivo |
| qa1, API partner `POST /uown/los/sendApplication` c/ API key (body vazio) | 400 JSON Spring estruturado — endpoint vivo |
| qa1, Servicing portal proxy `POST /uown/los/getBasicMerchantInfoByRefCode` | **200** — LOS responde via BFF do Servicing |

**Conclusão:** problema na camada de sessão/proxy (BFF Express) do deploy do portal Origination em qa1 — NÃO é o backend LOS, NÃO é o usuário, NÃO é o código do frontend (qa2 idêntico funciona). Memórias confirmam Origination qa1 funcional em 2026-05-24 (task #1304, svc#531) → regressão de deploy/infra nas últimas ~2 semanas.

**Impacto na bateria:** bloqueia TODA a frente Origination via UI (réplica dos itens dev3 S1: overview, error log, new application, merchants, programs, groups, rebate, blacklist, open-to-buy, merchant setting, leads). Criação de lead fresh via API partner (`sendApplication`) segue possível.

**Repro mínima:** login no portal → abrir DevTools → qualquer página. Ou: `POST https://origination-qa1.uownleasing.com/uown/getApplicationCountDetails?...` com headers `username`/`usertoken` de uma sessão → 400 vazio.

- `[OBSERVAÇÃO]` console no load da página de login: 3 erros `[mobx] [serializr] Failed to find default schema` — presente TAMBÉM em qa2 (replica do H-001 de dev3; cosmético, não relacionado ao 400).

### 🔴 QA1-BUG-002 [HIPÓTESE forte] — Servicing: tabela Due Amounts renderiza dados da conta ANTERIOR (stale store)

**Sintoma observado (2026-06-10):**
1. Cold load `/scheduled-payments/4452` → API `getScheduledPayments/4452` retorna **200 com 56 receivables** → tabela renderiza **"There are no records to display"**.
2. Em seguida, load `/scheduled-payments/3992` → API retorna 200 com 29 receivables de $111.30 (conta 3992) → tabela renderiza **as linhas da conta 4452** ($47.52, partial $18.44, datas 03/2026).
3. Reload cold de `/scheduled-payments/3992` → renderiza correto ($111.30).

**Mecanismo provável:** store MobX populado após o mount sem re-render — 13 erros `[mobx] uncaught error in 'Reaction': [serializr] this value is not primitive` no console do Servicing durante navegação (Reaction quebrada para de propagar updates). Intermitente/timing-dependent; risco real: agente lê schedule de OUTRA conta (dado financeiro errado na tela).

**Próximo passo:** repro determinística + verificação se afeta dev3/stg (família do BUG-NEW-001/002 de dev3, cold navigation store). Não presente no relato dev3 para esta página.

- `[OBSERVAÇÃO]` Servicing também loga erros serializr em Reaction (dev3 S1 dizia "isolado ao Origination" — em qa1 NÃO é isolado).

### Servicing — itens validados (réplica dev3 S1)

| Feature | Status | Notas |
|---|---|---|
| Login | OK | Sem erros de console no load do login |
| Search page (filtros) | OK | Campos: From*/To, SSN, Ref Account ID, Email, Account PK, Phone, Customer Name, Last4 CC, Company, Merchant, Location. From é obrigatório ("Start date is required") mesmo buscando por nome. Sem filtro Status (replica O-009). Account Sale button presente |
| Resultados de busca | OK c/ achado | CC mascarado; **SSN COMPLETO em plaintext na grade** (replica O-018/H-009; permission full-SSN ativa p/ manager) |
| Customer Information (4452, 3992) | OK | VerifyCustomerInfoModal em toda entrada (replica memória); financials internamente consistentes (4452: $2.701,15 − $201,00 = $2.500,15 ✓); alerta concatenado "...changed to PSee all alerts" (replica C-002) |
| Bank Account section | Achado | **Account number SEM máscara na Customer Information** (3992: `160781900000`; replica H-010); mascarado no modal Make Payment (inconsistência de máscara, replica C-003 invertida) |
| History dropdown | OK | Mesmos 9 itens de dev3: ACH, CC Transactions, Email, Items Purchased, Payments, PayNearMe, Phone, Due Date Changes, Frequency Changes |
| CC Transactions history (4452) | OK | Cartão mascarado; transações reais CHANNEL_PAYMENTS_CC APPROVED (CC processor VIVO em qa1, confirma gap-probe S0); coluna Sticky Recovery Status presente |
| Items Purchased (4452) | OK | Replica inconsistência de dados de teste dev3: qty delivered 0 com status DELIVERED |
| Documents (4452) | Vazio | Sem documentos na conta testada (flow de assinatura incompleto, mesmo padrão dev3 acc 138); validar com conta com contrato assinado |
| Scheduled Payments / Due Amounts | **BUG** | QA1-BUG-002 acima. Botões Move Due Date + ADD FEE presentes. `getReceivableType/` com trailing slash → **200** (SB 2.x; em dev3/SB3 era 404 N-002 — oracle MDD-001 reconfirmado) |
| Payment Arrangement view (4452) | OK | 3 arrangements (pk 271 NOT_STARTED, 34/31 SUCCESS); colunas + Expand Row; **sem Edit/Cancel** (replica O-NEW-001) |
| Make Payment modal (3992, warm) | OK | Borrower correto, checkbox Payment Arrangement, Payment Type ACH/CC/Check, Allocation Type, radio existing/one-time bank. Estrutura = dev3 S3 |

**Contas-referência qa1 mapeadas nesta sessão:**
| Account | Lead | Status | Perfil | Uso sugerido |
|---|---|---|---|---|
| 4452 | L10907 | ACTIVE, DPD 58, Past Due $409.24 | terraceFinance/NY, 13m, rating P, 3 arrangements, email fintechgroup777+1077600_159410@gmail.com (IMAP nosso) | WEB-01/02/03 (OTP via IMAP), S3 view |
| 3992 | L9399 | ACTIVE, DPD 90, Past Due $725.87 | Progress Mobility/IL, 13m, CC ****4242 válido + bank account, CC Peek consent Yes, protection plan COMPLETED | S6 settlement/banking/contact |
| 3991 | L9395 | ACTIVE | NY, $111.30 | reserva |

### Customer Portal (website-qa1) — itens validados

| Feature | Status | Notas |
|---|---|---|
| Login page load | OK c/ achado | Replica EXATA do H-003 dev3: script `src="undefined"` → 404 + MIME refusal (env var de fraud script não setada em qa1); login não afetado |
| Input validation | OK (melhor que dev3) | **C-001 NÃO reproduz**: mensagem distingue tipo de input ("...with email notanemail123..." vs "...with phone number 5555550199..."). Minor: alerts antigos não são dispensados (empilham) |
| OTP flow E2E | **PASS** | Conta 4452 (fintechgroup777+1077600_159410@gmail.com): código `Verification Code Email` chegou em ~8s via IMAP; 6 campos com auto-submit; login → /overview. Freshness ✓ |
| "Didn't get a code?" | Achado | Não é botão real (generic clicável) — replica O-015 a11y |
| Dashboard /overview | OK | Consistência cross-portal EXATA com Servicing: Past Due $409.24 ✓, Contract Balance $2.500,15 ✓, EPO $1.386,79 ✓; payment history PAID; menu: Account Summary, Payments, Documents, Contact Us, Account Settings |
| Documents | **BUG (réplica)** | `GET /uown/svc/getFilesForAccount?accountPk=4452` → **403** e o app DERRUBA a sessão para o login. **Réplica em qa1 do BUG-S10-001 de dev3** — agora confirmado em 2 ambientes ⇒ bug de código/permissão do endpoint (não provisioning). Cliente autenticado não consegue ver documentos |
| Responsive 375×667 | OK | Layout login íntegro; "Contact Us" footer quebra de linha (minor, igual dev3) |

**Resumo S1:** Origination 100% bloqueado (QA1-BUG-001, escalar a dev/infra); Servicing funcional com 1 bug novo de UI (QA1-BUG-002) + achados de masking (réplicas); Customer Portal funcional com OTP E2E PASS e 1 réplica de bug confirmada cross-env (Documents 403). Erros mobx/serializr presentes nos 3 portais (não isolados ao Origination como em dev3).

---

## S4 — Move Due Date (2026-06-10) — CONCLUÍDA ✅

**Método:** UI-first via MCP Playwright, conta 4452 (WEEKLY). Mutação via produto (não DB), restaurada ao final.

**Resultado-chave (fecha o escopo do MDD-001):** o modal Move Due Dates FUNCIONA em qa1. O frontend monta a URL COM barra extra (`/moveDueDatesByDays/4452/?fromDueDate=...`) — idêntico a dev3 — e o backend SB 2.x de qa1 **aceita e retorna 200**. Confirmação definitiva de que MDD-001 é regressão EXCLUSIVA do Spring Boot 3 (dev3/stg), não bug funcional da feature.

| Passo | Resultado | Oracle |
|---|---|---|
| Move +1 dia (06/15→06/16, parcela pk 259371) | HTTP **200**, data movida na UI | `uown_sv_receivable.due_date` = 2026-06-16 ✓ |
| Registro do move | OK | `uown_due_date_moves` pk=363: moved_by_days=1, adjustment_type=SCHEDULE_SHIFT, agent_username=manager ✓ |
| Activity log (regra #13) | OK | `uown_sv_activity_log` pk=1741668, log_type=DUE_DATE_MOVES, "Due Date changed from dueDate 2026-06-15 by 1 days" ✓ |
| Negativo: mover -26 dias | HTTP **400** + toast **"Due date offset cannot exceed 6 days for WEEKLY frequency"** — erro REAL visível ao agente (em SB3 viraria 404 "No static resource" mascarando a validação) ✓ |
| Restore: move -1 dia (06/16→06/15) | HTTP 200; receivable de volta a 2026-06-15 ✓ | `uown_due_date_moves` pk=364 (moved_by_days=-1) |
| History → Due Date Changes UI | OK | 2 rows renderizadas (+1 e -1, agent manager, SCHEDULE_SHIFT) — diferente do gap de Frequency History (SW-OBS-009 dev3) |

- 🟡 `[OBSERVAÇÃO — drift de conhecimento]` validação WEEKLY em qa1 = **cap 6 dias** (mensagem literal do backend). A regra catalogada da era svc#536 (dev3, MoveDueDatesService.java) era cap **3 dias**. Constante mudou entre versões OU difere por env — categoria volátil, verificar fonte primária por env antes de afirmar em testes futuros.
- Modal qa1 = "Move Due Dates" com dropdown de Scheduled Due Date (react-select, 58 datas) + date picker New Due Date; difere do modal dev3 que tinha campo `numOfDaysToBeMoved` (O-022 não se aplica aqui).
- Estado restaurado: schedule da 4452 idêntico ao inicial; 2 rows de auditoria em `uown_due_date_moves` (registro de mutação via produto).

**Bônus regra #13 (WEB-01):** logs de OTP confirmados em `uown_sv_activity_log` da 4452: "Sent VerificationCode... To: fintechgroup777+...", "Created VerificationCode to be sent as EMAIL", "Login Success using code 146008; Attempt 1" (created_by: customer portal) — cadeia completa de auditoria do login do cliente ✓.

---

## S2 — Sweeps (2026-06-10) — CONCLUÍDA ✅

**Método:** read-only first. SELECT via `src/scripts/env-query.mjs` (ENV=qa1) + análise dos `sql_to_pick_accounts` + `uown_sweep_logs` como oracle. UI-first (regra #18): confirmado que **sweeps NÃO têm affordance de UI no Servicing portal** (nenhum page object de scheduled-task; `getAllScheduledTasks`/`triggerScheduledTask`/`pauseScheduledTask` são admin API com API key, sem tela exposta) — gestão é API-only por design, ausência de UI documentada explicitamente.

**Decisão central (regra #3 — CC processor real em qa1):** os 14 sweeps ativos **já rodam continuamente via Quartz** (source=SVC, 1199 execuções só hoje). Isso fornece o oracle natural sem necessidade de trigger manual. Para todos os de pagamento, a inspeção do `sql_to_pick_accounts` (transformado em SELECT-only — os originais são `UPDATE...RETURNING`, executá-los literalmente mutaria) mostrou contas reais ou órfãs, **NÃO contas de teste (4452/3992)**. Conclusão: **nenhum sweep disparado manualmente.** Zero INSERT/UPDATE/DELETE — só SELECT. Nenhum sweep PAUSED foi resumido → nenhum restore necessário.

### Schema real (correção vs briefing)

- `uown_scheduled_task`: coluna do nome é `scheduled_task_name` (não `name`); cron em `cron_trigger`. `last_trigger_time` NÃO reflete runs Quartz (confirma OBS de S0 — só trigger manual atualiza; usar `uown_sweep_logs`).
- `uown_sweep_logs`: colunas `sweep_name`, `number_of_records_processed`, `error`, `source`, `start_time`/`end_time` (não `task_name`/`processed`/`created_timestamp`).

### Tabela dos 14 sweeps ativos

| Sweep | pk | is_active | Elegíveis (qa1, 2026-06-10) | processed (Quartz) | Resultado | Obs |
|---|---|---|---|---|---|---|
| emailSweep | 1 | true | 0 PENDING na fila | 1 às 15:45 (auto) | OK | Quartz a cada 5min esvazia a fila; nada a disparar. Réplica funcional do dev3 (lá 9 PENDING→SENT) |
| CreateScheduledCreditCardPaymentsSweep | 5 | true | 49 contas (1ª camada, contas reais) | 7/5/7/26... diário, **error=''** | OK | **SW-BUG-001 de dev3 (alias mismatch) NÃO reproduz em qa1** — processa normalmente. NÃO disparado (49 contas reais) |
| SendACHPaymentsSweep | 6 | true | 60 PENDING, **todas em contas terminais** (CANCELLED/PAID_OUT) | 0 (auto, a cada 5min) | OK | CASE marca terminais como CANCELLED (não envia) → processed=0 correto. NÃO disparado |
| SendCreditCardPaymentsSweep | 7 | true | 1 tx PENDING órfã (pk 43582, conta 3597, sem nextreceivable ACTIVE) | 0 (auto, a cada 7min) | OK | Query real exige JOIN nextreceivable UNPAID/PARTIAL → a tx órfã é ignorada corretamente. NÃO disparado (conta 3597 não é de teste) |
| getSendACHPaymentsStatusSweep | 8 | true | 0 (`uown_send_sv_ach_payment` SENT+ReadyToProcess) | 0 (auto, a cada 6min) | OK | Saudável |
| getStatusDatePaymentsListSweep | 9 | true | **18.982 achpayment SENT** (UPDATE amplo!) | 41/91/14 diário (SUCCESS poucos, resto FAIL Profituity) | OK | **Blast radius enorme** — `UPDATE...WHERE status='SENT'` pega 18.982 rows. ABSOLUTAMENTE NÃO disparar manual. Quartz processa em lotes diários; FAIL = Profituity lower (esperado) |
| eSignDocumentStatusSweep | 11 | true | 2 contratos SENT, mas ambos EMBEDDED/LEASE | 0 (auto, a cada 3min) | OK | Filtro final `esign_mode='EMAIL' OR contract_type='LEASE_MOD'` exclui os 2 (EMBEDDED) → processed=0 by design. Ver SW-OBS-QA1-002 |
| getCompletedESignDocumentStatusSweep | 13 | true | 0 (esign SIGNED/COMPLETED criados hoje) | 0 (auto, a cada 2min) | OK | Saudável |
| refreshTrustPilotAccessKeySweep | 56 | true | n/a (chamada de terceiro) | 0 diário (04:00) | OK c/ achado | Token rotaciona diariamente (refresh funciona); **mas o access token é gravado em PLAINTEXT no campo `error` do log** — ver SW-OBS-QA1-001 |
| ProgramActivationDeactivationSweep | 82 | true | n/a (sql_to_pick_accounts=null) | sem rows em sweep_logs | n/d | Não emite log em uown_sweep_logs; cron diário 00:01; last_trigger_time=null. Não tocado (efeito = ativar/desativar programas de merchant; mutação fora de escopo) |
| refreshKountAccessTokenSweep | 83 | true | n/a (terceiro) | sem log dedicado | n/d | Refresh de token Kount; não afeta contas. Não disparado |
| refreshGdsAccessTokenSweep | 84 | true | n/a (terceiro) | sem log dedicado | n/d | Refresh de token GDS; não afeta contas. Não disparado |
| StickyRecoverSweep | 85 | true | 0 (nenhuma tx DENIED com posting_date = hoje-7) | 0 ("No transactions found.") | OK | SELECT puro (seguro). 3 rows em `uown_sticky` são de contas 4945/4946 (sintéticas), não disparam janela 7d. NÃO disparado |
| StickyRecoverCancelSweep | 86 | true | 0 (PENDING são de contas ainda ACTIVE) | 0 ("No recoveries found.") | OK | SELECT puro. Saudável |

### Comparação com dev3 (S2)

| Item | dev3 | qa1 | Conclusão |
|---|---|---|---|
| CreateScheduledCC (SW-BUG-001 alias mismatch) | falhava com erro Java, 0 processados | processa OK (7/5/26... `error=''`) | **Bug NÃO reproduz em qa1** — ambiente/versão corrigida. Bug confinado ao deploy dev3 |
| SendACH | processed=2 (Profituity falhou no resto, esperado) | processed=0 (todos elegíveis em contas terminais → CANCELLED) | Ambos saudáveis; diferença é só população de dados |
| emailSweep | 9 PENDING→SENT | fila vazia (Quartz já drenou) | Ambos funcionais |
| generateVerventOnBoardingFileSweep (SW-BUG-003) | falha por `tax_per_scheduled_payment` ausente | coluna **também ausente** em qa1 (pk 61, PAUSED) | Risco latente confirmado por estrutura; NÃO resumido/disparado (PAUSED, efeito colateral) |
| getStatusDatePaymentsList | n/d no relato dev3 | 18.982 SENT alvo de UPDATE amplo | Risco de blast radius identificado em qa1 |

### Achados

**🟡 SW-OBS-QA1-001 [OBSERVAÇÃO — segurança]** — `refreshTrustPilotAccessKeySweep` grava o access token Bearer em **plaintext** no campo `error` de `uown_sweep_logs` (ex.: `Bearer tpa-b42d4f24259dca3bb9989a2e7eda`, um por dia, ~15 dias de histórico). O campo `error` deveria conter mensagem de erro, não credencial. Exposição: qualquer um com SELECT em `uown_sweep_logs` lê tokens TrustPilot válidos. Token rotaciona diariamente (mitiga janela), mas é uso indevido do campo + credencial em log. Sugerido: mascarar/remover token do log. Não reproduzido em fresh data (é comportamento determinístico do sweep, observável em todo run diário).

**🟡 SW-OBS-QA1-002 [OBSERVAÇÃO — by design, documentar]** — `eSignDocumentStatusSweep` ignora contratos `esign_mode='EMBEDDED'`: o filtro final `(c.esign_mode='EMAIL' OR contract_type='LEASE_MOD')` exclui contratos EMBEDDED/LEASE. Os 2 contratos SENT elegíveis hoje (Tire Agent lead 12270, MSA Powersports lead 12271) são EMBEDDED → nunca re-poll por este sweep. Comportamento aparentemente intencional (EMBEDDED tem callback síncrono do vendor, não precisa de polling), mas vale confirmar com svc que o status EMBEDDED é atualizado por outro caminho. NÃO é bug confirmado — pitfall de interpretação ("0 processados" não significa sweep quebrado).

**Sem bugs [CONFIRMADO] novos em S2.** SW-BUG-001 de dev3 explicitamente NÃO reproduz em qa1 (positivo).

### Sweeps PAUSED não testados nesta sessão (63 total; mais interessantes)

Nenhum resumido (qa1 compartilhado; resumir+disparar exigiria justificativa de escopo + restore, sem ganho claro nesta sessão de recon):

| Sweep | pk | Por que interessa | Razão de não testar |
|---|---|---|---|
| generateVerventOnBoardingFileSweep | 61 | SW-BUG-003 dev3 (coluna ausente) | coluna `tax_per_scheduled_payment` confirmada ausente; disparar geraria arquivo de onboarding (efeito colateral) |
| removeRatingLetterSweep | 55 | dev3 ativou manualmente em S2 | muta `rating` de contas reais; precisa conta de teste dedicada |
| delinquencyRerunCCPaymentsSweep | 72 | dev3 tinha feature flag blocking | sweep de **re-cobrança CC** — risco de cobrança real; só com conta de teste isolada |
| dailyDelinquencyRerunCCSweep | 73 | re-cobrança CC diária | mesmo risco de cobrança real |
| delinquencyOfferEmailSweep / delinquencyReminderEmailSweep / latePaymentNoticeEmailSweep | 20/21/22 | emails de delinquency (DOW windows) | dispararia emails a clientes reais se sql não filtrar fintechgroup777; validar SQL antes de S3/futuro |
| FirstPaymentReminderSweep / RecurringPaymentReminderSweep | 2/3 | reminders de pagamento | idem — risco de email a cliente real |
| customerPortalReminderSweep | 31 | reminder portal | idem |
| createSkitDelinquentFileSweep / createSkitDelinquentOfferFileSweep | 59/37 | geração de arquivo delinquency | efeito colateral de arquivo |
| dailyTaxCloudRefundsSync | 80 | sync refunds TaxCloud | integração terceiro |
| generateDelinquencyReport / redistributeDelinquentEpoPoolSweep / dailyRefund(ed)ReportSweep | 60/57/43/44 | relatórios/redistribuição | efeito colateral; 43/44 com cron 2099 (efetivamente desabilitados) |

> **Recomendação para sessão futura de sweeps de delinquency/email:** criar conta de teste dedicada (email `fintechgroup777+*`) com perfil delinquente, então resumir → disparar → re-pausar individualmente, validando que o `sql_to_pick_accounts` filtra apenas a conta de teste antes de cada trigger.

### Notas / regra #16

Esta seção é registro de execução, não fonte de padrão. Asserções técnicas com fonte primária (DB qa1 via env-query + sweep_logs runtime). Categoria volátil: contagem de elegíveis e estado de PAUSED mudam com o tempo e com runs do Quartz — re-verificar antes de afirmar em testes futuros.

---

## S3 — Payment Arrangement lifecycle (2026-06-10) — CONCLUÍDA ✅

**Método:** UI-first via Playwright headless (regra #18; MCP browser indisponível nesta sessão → fallback discovery-spec autorizado por memória + regra #15), viewport servicing-ui padrão, storageState `manager`, conta 4452 (3 arrangements pré-existentes). Oracle secundário: DB qa1 via `env-query.mjs` (read-only) + `uown_sv_activity_log`. **Zero dados criados / zero mutação no DB** — todos os estados pedidos (NOT_STARTED, SUCCESS) já existiam em 4452, então observação direta (test-data-hierarchy: reuso justificado, sem necessidade de fresh data para cobrir os estados-alvo). Artefato: `tests/e2e/servicing/_discovery-s3-payment-arrangement.spec.ts`.

### Schema real (correção vs briefing)

- A tabela do arrangement é `uown_sv_payment_arrangement`. Colunas reais: `pk, account_pk, start_date, end_date, amount, arrangement_type, payment_type, username, previous_rating, current_rating, is_active, status, notes, tenant_id, web_user_id, agent, row_created/updated_timestamp`. **NÃO existem** `down_payment`, `num_of_payments`, `frequency`, `total_amount` (briefing presumia outro schema).
- **NÃO existe tabela filha de "arrangement receivables"** (busca `information_schema` por `%arrangement%` → só `uown_sv_payment_arrangement`). As "parcelas individuais" que o expand-row mostra vêm de `uown_sv_credit_card_transaction` (CC) / `uown_sv_achpayment` (ACH) com FK `payment_arrangement_pk`, NÃO de uma tabela de schedule dedicada.
- Activity log: tabela `uown_sv_activity_log`, coluna de texto é `notes` (não `activity`); regra account_pk→sv_activity_log.

### Estado dos 3 arrangements de 4452 (DB, primary source)

| pk | status | type | payment_type | amount | is_active | created_by | UI sub-row (CC) |
|---|---|---|---|---|---|---|---|
| 271 | NOT_STARTED | NORMAL | CC | $1.00 | true | davi.artur.gow@uownleasing.com | 1 row, **Status=CANCELLED**, card ****0055 |
| 34 | SUCCESS | SETTLEMENT | CC | $100.00 | false | SYSTEM | 1 row APPROVED, CHANNEL_PAYMENTS_CC, fee $1.00 |
| 31 | SUCCESS | NORMAL | CC | $100.00 | false | SYSTEM | (não expandido; análogo a 34) |

### Achados

| ID | Achado | Classificação | Severity |
|---|---|---|---|
| S3-VIEW | View page `/payment-arrangement/4452` renderiza 8 colunas (Arrangement Pk, Payment Type, Start Date, End Date, Total Amount, Status, Created At, Created By); 3 rows corretas; expand-row mostra sub-tabela "CC Payments" com Payment PK/Date/Amount/Fee/Status/Vendor/Card | [CONFIRMADO] funcional | — |
| O-NEW-001 (replica) | **Sem Edit/Cancel no arrangement.** Inventário DOM completo da região da tabela retornou APENAS 3 botões `aria-label="Expand Row"` (`data-testid="expander-button-undefined"`) — nenhum botão/link com texto/aria/title contendo "edit" ou "cancel" (`hasEdit=false hasCancel=false`). | [CONFIRMADO] — replica qa1 do O-NEW-001 dev3 | S3 (design/UX, não funcional) |
| PA-OBS-QA1-001 | Arrangement pk271 **órfão**: status NOT_STARTED + is_active=true, mas seu único CC SALE (cct pk57733, $1.00) está CANCELLED. Pagamento morto, arrangement nunca avançou a estado terminal nem foi limpo. Provável artefato de dado de teste (criado por davi.artur.gow em 2026-04-07 c/ `Account status changed from SETTLED_IN_FULL to ACTIVE; test`). | [OBSERVAÇÃO] | S3 (data artifact provável; reproduzir em fresh antes de classificar bug — regra #10) |
| S3-MODAL | Modal Make Payment (trigger `#makePayment`, NÃO role=button) com checkbox `#paymentArrangement` expõe form completo: Start Date / End Date (`type=search`, MM/DD/YYYY), Payment Frequency (react-select), Payment Arrangement Type (react-select NORMAL/SETTLEMENT), tabela de parcelas `paymentInfo[0].paymentDate`+`paymentAmount` auto-populada com paginação, Total Payment Amount editável, Payment Type, Allocation Type, banco existente/one-time, Save as default, CANCEL/Submit. Estrutura = dev3 S3 + modal qa1 idêntico. | [CONFIRMADO] funcional | — |
| S3-VAL | Modal **NÃO exibe past due nem cap de down payment** como hint visível — único texto monetário é o label "Total Payment Amount". Validações de negócio (down > past due / datas inválidas) NÃO foram exercidas via submit (recon read-only, sem criar dado). Gap de cobertura: deixar para sessão de criação dedicada com fresh account. | [OBSERVAÇÃO] (cobertura parcial) | — |

### Activity log (regra #13) — audit chain COMPLETA em qa1

A cadeia de auditoria do arrangement é completa em qa1 (primary source `uown_sv_activity_log` account_pk=4452):

**Criação (todos os 3, padrão idêntico):**
- `Payment Arrangement created. arrangementPk=X, type={NORMAL|SETTLEMENT}, paymentType=CC` (INTERNAL)
- `Account rating updated to P due to new Payment Arrangement. arrangementPk=X` (INTERNAL)
- `Credit Card Payment Arrangement created. arrangementPk=X` (INTERNAL)
- `PaymentArrangementService - runTransactions executed. paymentArrangement=true` (INTERNAL)

**Finalização SUCCESS (pk31, pk34):**
- `Arrangement finalized as SUCCESS. paymentArrangementPk=X` (INTERNAL)
- pk34 (SETTLEMENT): `Account status changed from ACTIVE to SETTLED_IN_FULL; Settlement arrangement detected.` (STATUS_CHANGE)

**View page NÃO gera log** (read-only, correto). A abertura do modal Make Payment **sem submit** também não gerou log de arrangement — únicos logs novos na sessão foram 2× `REVIEW "Lead has been reviewed"` (side-effect benigno de `manager` abrir customer-information), confirmando recon limpo.

### Comparação com dev3

| Item | dev3 (S1/S3) | qa1 (S3) | Conclusão |
|---|---|---|---|
| View page (colunas + expand-row) | 3 arrangements, expand mostra receivables/valores | idêntico (8 colunas, expand → CC Payments sub-table) | **Comportamento idêntico** |
| Edit/Cancel no arrangement | ausente (O-NEW-001) | ausente (confirmado via inventário DOM) | **Réplica confirmada** — UI incompleta ou design intencional cross-env |
| Modal Make Payment c/ checkbox Payment Arrangement | presente, NORMAL/SETTLEMENT, ACH/CC | idêntico | **Comportamento idêntico** |
| `Arrangement finalized as SUCCESS` (organic log do listener) | NÃO observável organicamente — dev3 sem processor real, spec usava stand-in sintético (`@blocked-by-missing-log` em S2/S4/S6) | **PRESENTE organicamente** (pk31, pk34, created_by=SYSTEM) — CC processor real de qa1 (gap-probe S0) dispara o listener | **Diferenciador qa1**: o log que dev3 só conseguia simular é gerado de verdade em qa1. Em sessão de criação fresh, a assertion `@blocked-by-missing-log` da spec `payment-arrangement-servicing.spec.ts` pode virar HARD assertion em qa1 (resolve Q-S2/Q-S4/Q-S6 para o caminho CC síncrono) |

### Estados do ciclo observados

- **NOT_STARTED** (pk271): arrangement ativo aguardando processamento; sub-pagamento pode estar CANCELLED sem promover o arrangement (PA-OBS-QA1-001).
- **SUCCESS** (pk31 NORMAL, pk34 SETTLEMENT): is_active=false; SETTLEMENT adicionalmente transiciona a conta para SETTLED_IN_FULL.
- **IN_PROGRESS / FAILED / CANCELLED** do arrangement: não havia exemplar natural em 4452 nesta sessão; o spec `payment-arrangement-servicing.spec.ts` (S4/S5) cobre NOT_STARTED→SUCCESS/FAILED via fresh data + processor (qa1 candidato para exercer organicamente).

### Lacunas / handoff para sessão futura

1. **Criação fresh + validações de negócio** (down payment > past due, datas inválidas, campos obrigatórios): exige fresh account ACTIVE delinquente + submit real. Não coberto nesta sessão de recon (evitar poluir 4452 / criar dado desnecessário). Recomendado rodar `payment-arrangement-servicing.spec.ts` adaptado para qa1 (CC processor real) — validaria também se a finalize-log vira HARD assertion.
2. **Cancelamento de arrangement**: sem affordance de UI (O-NEW-001). Verificar se existe endpoint admin/API de cancel (fora do escopo UI-first; documentar ausência de UI se confirmado).
3. **PA-OBS-QA1-001**: reproduzir o cenário "único pagamento CANCELLED em arrangement NOT_STARTED" em fresh data antes de classificar como bug (regra #10) — provável artefato de dado de teste do davi.artur.gow.

### Notas / regra #16

Esta seção é registro de execução, não fonte de padrão. Asserções técnicas com fonte primária: DB qa1 via `env-query.mjs` (schema + arrangement rows + activity log) e DOM real via Playwright headless (colunas, inventário de botões, form do modal). Categoria volátil: estado dos arrangements de 4452 e contagem de activity logs mudam com o tempo — re-verificar antes de afirmar em testes futuros. A spec de discovery `_discovery-s3-payment-arrangement.spec.ts` é read-mostly e segura para re-execução (não cria/muta dado).

---

## S6 — Settlement / Banking / Contact-OptOut (2026-06-10) — CONCLUÍDA ✅

**Método:** UI-first via Playwright headless (regra #18; MCP browser não exposto nesta sessão → fallback discovery-spec read-only autorizado por memória + regra #15), viewport `servicing-ui` padrão, storageState `manager`, contas 4452 e 3992 (fixtures existentes). Oracle secundário: DB qa1 via `env-query.mjs` (read-only) + `uown_sv_sql_config.GETSETTLEMENTAMOUNT` como fonte primária da fórmula. **Zero settle, zero mutação bancária, zero toggle de opt-out** — só leitura de painel/modal/DOM. Artefato: `tests/e2e/servicing/_discovery-s6-settlement-banking-contact.spec.ts` (read-only, seguro para re-execução). Watermark de `uown_sv_activity_log` antes/depois provou que os únicos logs gerados foram `REVIEW "Lead has been reviewed"` benignos (created_by=manager, mesmo side-effect de S3 ao abrir customer-information).

### Schema real (correção vs briefing)

- **NÃO existe tabela `uown_sv_settlement`.** Settlement é **computado on-demand** via `uown_sv_sql_config` row `sql_name='GETSETTLEMENTAMOUNT'` (UPPERCASE, confirma memória svc#512). Sem persistência — recalculado a cada abertura do painel.
- **NÃO existe tabela `uown_sv_contact_preferences`.** Opt-out é distribuído: `uown_sv_account.do_not_contact` + `uown_sv_email.do_not_email` + `uown_sv_phone.do_not_call/do_not_text/opt_out_ai`. CC Peek = `uown_sv_account.cc_peek_consent` + `consent_date`.
- `uown_sv_account` usa `pk` como id da conta (NÃO tem coluna `account_pk`). `uown_sv_bank_account` tem `account_pk`.

### A) SVC-04 Settlement — recon (UI panel + breakdown modal vs DB)

Fórmula real (fonte primária `GETSETTLEMENTAMOUNT`): tiers de desconto por delinquência —
`offer_percent` = `BETWEEN 61 AND 90 → 0.70` · `91 AND 150 → 0.50` · `>150 → 0.35` · `ELSE 1.00`. Elegível só `account_status='ACTIVE' AND rating NOT IN ('B','C')`. Cálculo: `(TCA − total_payments) * offer_percent + total_fees + protection_plan_fee`.

| Conta | DPD | offer_percent (DB) | Settlement (UI=DB) | EPO Balance (painel) | Modal abre? | Observação |
|---|---|---|---|---|---|---|
| 4452 | 58 | 1.00 (ELSE bucket) | **$2.500,16** | $1.386,79 | SIM, 7 rows | Settlement = saldo cheio (sem desconto, DPD<61). Settlement ($2500,16) ≠ EPO ($1386,79) ✓ (settlement = balance restante; EPO = payoff descontado de 90-day). eligible90=false |
| 3992 | 90 | 0.70 (bucket 61-90) | **$0,00** | $0,00 | SIM, 7 rows | total_payments ($3116,43) == TCA ($3116,43) → settlement $0,00. Modal abre COM conteúdo (NÃO reproduz BUG-1 "empty modal" do svc#512 — aqui o $0 tem breakdown completo) |

**🟡 SETTLE-OBS-QA1-001 [HIPÓTESE — UX/labeling]** — o modal "Settlement Breakdown" exibe a linha **"Offer Percent"** como o **complemento** de `offer_percent` (`ROUND((1-offer_percent)*100)%`), produzindo um rótulo semanticamente invertido:
- 4452: DB `offer_percent=1.00` → modal mostra **"Offer Percent = 0%"**
- 3992: DB `offer_percent=0.70` → modal mostra **"Offer Percent = 30%"**

A **matemática está correta** (o `settlement_amount` computado usa `offer_percent` direto; a linha "Formula" exibida `((TCA − Payments) * (1-Offer Percent)) + Fees + PP` é internamente consistente com o valor exibido porque "Offer Percent exibido" = `1 − offer_percent`, logo `(1 − exibido) = offer_percent`). O problema é **semântico**: uma conta com 90 dias de atraso (tier de MAIOR desconto, `offer_percent=0.70`) exibe "Offer Percent 30%". Um agente lendo "Offer Percent 30%" tende a interpretar como "cliente paga 30%", quando na verdade o cliente paga **70% do saldo restante** (desconto de 30%). O rótulo "Offer Percent" mede de fato o **percentual de desconto**, não a oferta. Fonte primária: `GETSETTLEMENTAMOUNT` SQL config (linha `CONCAT(ROUND((1-offer_percent) * 100, 0), '%')`). Classificação `[HIPÓTESE]` (não `[CONFIRMADO]`) por ser interpretação de intenção de produto — confirmar com svc/produto se "Offer Percent" deveria significar oferta (o que cliente paga) ou desconto. **Severity S3** (não há erro de cálculo; impacto é confusão do agente). NÃO reproduzível como erro de valor (os $ batem); só visível como inconsistência de rótulo.

- `[OBSERVAÇÃO]` `SettlementBreakdownModal` page object (svc#512) funciona em qa1 sem ajuste: `isLabelVisible`, `openModal`, `getBreakdownRows`, `close` OK. `getPanelValueText()` retorna `""` (a label "Settlement Amount" e o valor não compartilham o parent esperado pelo xpath `..`); o valor de painel foi lido com sucesso via `readEpoPanel().settlementAmount`. Gap menor de page object, não bug de produto.

### B) SVC-06 Banking — recon (modais Add + View All, SEM Save/Delete)

| Item | Resultado | Fonte |
|---|---|---|
| Bank Account card (3992) | Type CHECKING · **Routing Number `123456780`** · **Account Number `160781900000`** · Set as default payment? Yes | DOM real (card textContent) |
| Add a Bank Account modal | Abre OK. Campos: `#routingNumber`, `#accountNumber`, `#bankAccountType` (react-select). Labels: Type, Routing Number, Account Number, Set as default payment? | DOM inventory (NÃO submetido — CANCEL) |
| All Bank Accounts ("View All") modal | **NÃO abriu** — `viewAllBankAccountsButton.click()` timeout 15s | runtime |
| Activity log durante recon | só `REVIEW` benigno; abrir modal Add NÃO gera log (esperado, é leitura) | watermark `uown_sv_activity_log` |

**🔴 BANK-OBS-QA1-001 [CONFIRMADO — segurança/PII] (eleva S1 H-010)** — no card "Bank Account" da Customer Information, **TANTO o Routing Number (`123456780`) QUANTO o Account Number (`160781900000`) são renderizados 100% em plaintext, sem máscara**. S1 já havia flagado o account number sem máscara (H-010); esta sessão **confirma adicionalmente que o routing number também está exposto** e que o valor da UI = valor do DB verbatim (`uown_sv_bank_account` pk=3695). Inconsistência de masking confirmada: o modal Make Payment (S1) mascara o bank account, mas o card de Customer Information expõe tudo. Fonte primária: DOM real (`card.textContent`) + DB. **Severity S2** (exposição de PII bancário completo a qualquer agente com acesso à conta — routing+account juntos permitem débito ACH). Reprodução determinística (não é artefato de dado — é o comportamento do componente do card).

**🟡 BANK-OBS-QA1-002 [OBSERVAÇÃO — test-side, fragilidade de page object]** — existem **DOIS** `<button>View All</button>` visíveis na página Customer Information (um no card Bank Account, outro em outra seção). O selector `viewAllBankAccountsButton` (`button:has-text("View All")` + `.first()`) resolve para o botão errado ou não-clicável → timeout. NÃO é bug de produto (o botão do card existe e está visível); é fragilidade do page object `BankAccountPage`. **Recomendação:** escopar o selector ao card (`SELECTORS.bankAccountCard` `button:has-text("View All")`) ao invés de `.first()` global. Documentado para handoff ao `qa-implementer` (refactor de selector, fora do escopo deste recon). A confirmação dos dados bancários veio via Add modal + DB, sem necessidade do View All.

### C) SVC-07 Contact Opt-Out — recon (Primary Contact, SEM toggle)

Controles de opt-out presentes no Primary Contact (Mobile Phone section), confirmados por DOM inventory + cruzamento com DB:

| Controle | 4452 (UI / DB) | 3992 (UI / DB) | Tabela DB |
|---|---|---|---|
| Opt Out AI (`#optOutAiMobile`) | unchecked / `opt_out_ai=false` ✓ | unchecked / `opt_out_ai=false` ✓ | `uown_sv_phone` |
| Do Not Call (`#doNotCallMobile`) | unchecked / `do_not_call=false` ✓ | unchecked / `do_not_call=false` ✓ | `uown_sv_phone` |
| Do Not Text (`#doNotTextMobile`) | unchecked / `do_not_text=false` ✓ | **checked / `do_not_text=true`** ✓ | `uown_sv_phone` |
| Labels presentes | "do not email", "do not call", "do not text", "opt out AI" | idem | — |

- UI ↔ DB **100% consistentes** (notavelmente 3992 Do Not Text = ON em ambos). Não há controle de SMS/Mail opt-out separado além de email/call/text/AI (`#doNotEmail`/`#optOutSms`/`#optOutMail` ausentes no DOM — só o label "do not email" aparece, controle vive em outra seção/edit-mode).
- **Estado de notificação da conta 4452 (nossa, fintechgroup777):** TODOS os opt-outs OFF → conta recebe notificações normalmente (consistente com WEB-01 de S1/S4: OTP por email chegou). Não alterado.

**🟡 CONTACT-OBS-QA1-001 [OBSERVAÇÃO] — CC Peek consent sem UI no Servicing.** Ambas as contas têm `uown_sv_account.cc_peek_consent=true` com `consent_date` setada (4452: 2026-03-16; 3992: 2025-07-16). NÃO há nenhum controle de UI no Servicing para visualizar/revogar o CC Peek consent — busca em page objects + selectors (`cc.?peek`) retornou 0 ocorrências, e o DOM inventory do Primary Contact não expôs toggle de peek. CC Peek consent é setado em **application-time** (LOS `uown_los_lead.cc_peek_consent`) e propagado read-only ao SV account; sem affordance de gestão no portal do agente. Classificado `[OBSERVAÇÃO]` (pode ser by-design — consent dado pelo cliente não deve ser editável pelo agente). Documentar ausência de UI (regra #18 exceção: feature sem UI conhecida).

- `[OBSERVAÇÃO]` Send Podium Link button **não diretamente visível** no Account Summary (`isPodiumLinkButtonVisible()=false`) — está gated atrás do clique no envelope (InviteModal), conforme page object `sendPodiumLink()`. Não exercido (evita disparar envio real). H2 do recon dev3 (Podium endpoint 404) NÃO testado em qa1 nesta sessão (exigiria abrir InviteModal + clicar Send → dispararia request/possível envio).

### Comparação com dev3 (S6 / Sessão 7)

| Item | dev3 (Sessão 7) | qa1 (S6) | Conclusão |
|---|---|---|---|
| Settlement modal $0.00 | BUG-1 svc#512: modal abre VAZIO em conta ineligible/$0 | 3992 ($0,00) abre **COM** 7 rows de breakdown | **BUG-1 NÃO reproduz no caso de 3992** — o $0 vem de payments==TCA (conta elegível, cálculo válido), não de ineligibilidade. O empty-modal de svc#512 era para conta que falha o WHERE (rating B/C ou não-ACTIVE) → recon futuro deve testar conta rating B/C para reproduzir |
| "Offer Percent" label | não documentado em dev3 | invertido (1−offer_percent) — SETTLE-OBS-QA1-001 | Achado novo de qa1 (fonte: SQL config, vale para todos os envs que compartilham o config) |
| Bank number masking | dev3 C-003 (account sem máscara) | routing **E** account sem máscara (BANK-OBS-QA1-001) | qa1 eleva: routing também exposto |
| Banking ADD activity log | dev3 recon: `createActivityLog` para ADD comentado (audit gap candidate) | NÃO exercido (read-only, sem ADD real em conta de teste qa1) | Handoff: validar com conta fresh em sessão de criação |
| Opt Out AI activity log (H1 compliance) | dev3 H1: toggle NÃO grava `uown_sv_activity_log` (só Envers `*_history`) — compliance gap candidate | NÃO exercido em qa1 (read-only, sem toggle) | Handoff: requer toggle real (mutação) com autorização — validar se qa1 grava log de compliance |
| Podium endpoint | dev3 H2: `/podium-link` 404 (sem controller svc) | NÃO testado (button gated, evita envio) | Handoff |

### Activity log (regra #13)

- **Settlement (abrir painel/modal):** read-only, NÃO gera log — correto (consulta, não ação de negócio).
- **Banking (abrir Add modal, sem Save):** NÃO gera log — correto. ADD/DELETE reais (não exercidos) é que gerariam `BANK_ACCOUNT`/`DATA_CHANGE` — validar em sessão de mutação autorizada.
- **Contact (ler opt-out, sem toggle):** NÃO gera log — correto. Toggle real (não exercido) testaria a hipótese de compliance gap (dev3 H1: opt-out sem activity log).
- Único log gerado na sessão inteira: `REVIEW "Lead has been reviewed"` (manager abrindo customer-information) — benigno, idêntico ao observado em S3.

### Lacunas / handoff para sessão futura

1. **Settlement empty-modal (BUG-1 svc#512):** reproduzir com conta rating **B ou C** (ou não-ACTIVE), que falha o `WHERE` do `GETSETTLEMENTAMOUNT` → painel deve mostrar settlement vazio/$0 SEM breakdown. 3992 ($0 com breakdown) NÃO é o caso do bug.
2. **SETTLE-OBS-QA1-001:** confirmar com svc/produto a semântica pretendida de "Offer Percent" (oferta vs desconto). Se for desconto, renomear label; se for oferta, o cálculo `(1-x)` no display + `*x` no compute precisa alinhar.
3. **Banking ADD/DELETE + activity log (regra #13):** exige conta de teste fresh + ADD/soft-delete reais (mutação) → validar se qa1 gera `BANK_ACCOUNT` log no delete (e se routing vai em plaintext no log, como o recon dev3 flagou) e se ADD gera log (audit gap dev3).
4. **Opt-out toggle + compliance log:** exige toggle real (mutação autorizada) → testar hipótese dev3 H1 (opt-out não gera `uown_sv_activity_log`, só Envers history = compliance gap regra #14).
5. **BANK-OBS-QA1-002 (test-side):** refactor do selector `viewAllBankAccountsButton` escopado ao card — handoff `qa-implementer`.
6. **Podium 404 (dev3 H2):** abrir InviteModal + capturar network do `/podium-link` (cuidado: pode disparar envio real).

### Notas / regra #16

Esta seção é registro de execução, não fonte de padrão. Asserções técnicas com fonte primária: `uown_sv_sql_config.GETSETTLEMENTAMOUNT` (fórmula + label "Offer Percent"), DB qa1 via `env-query.mjs` (bank account, opt-out flags, cc_peek_consent), e DOM real via Playwright headless (panel/modal/card/Primary Contact). Categoria volátil ([[volatile-knowledge-registry]]): valores de settlement/EPO/opt-out das contas 4452/3992 mudam com pagamentos e edições — re-verificar antes de afirmar em testes futuros; o `GETSETTLEMENTAMOUNT` SQL config é drift-prone (categoria sweep SQL). Spec `_discovery-s6-settlement-banking-contact.spec.ts` é read-only e segura para re-execução (zero settle / zero mutação bancária / zero toggle).

---

## S7 — Checklist: signing, documents, responses, protection plan, sticky (2026-06-10) — CONCLUÍDA ✅

**Método:** UI-first via Playwright headless (regra #15/#18; MCP browser indisponível nesta sessão → fallback discovery-spec read-only, autorizado por memória `reference_dev3_discovery_workflow` + regra #15), viewport Servicing `1440×900` e Customer Portal `375×667` (mobile-first, regra #15 portal-aware). Oracle secundário: DB qa1 via `env-query.mjs` (read-only) + fixture `db` injetada nas specs. **Zero signing disparado, zero mutação no DB, zero ação de negócio** — pura observação de affordances renderizadas + estado real do DB. Artefatos (read-only, seguros para re-execução): `tests/e2e/servicing/_discovery-s7-checklist-qa1.spec.ts`, `_discovery-s7-emailhist-qa1.spec.ts`, `_discovery-s7-history-qa1.spec.ts`, `_discovery-s7-history2-qa1.spec.ts`, `_discovery-s7-menuhrefs-qa1.spec.ts`, `tests/e2e/website/_discovery-s7-customer-portal-qa1.spec.ts`. Watermark de `uown_sv_activity_log` antes/depois: únicos logs gerados foram `REVIEW "Lead has been reviewed"` benignos (manager abrindo customer-information, mesmo side-effect de S3/S6).

### Schema real (correção vs briefing)

- **`uown_sticky`**: a coluna de tentativas é **`number_of_attempts`** (integer), NÃO `retry_attempt`/`uown_sticky_retry_attempt` (nome do briefing não existe — query com ele retorna erro `column does not exist`). Demais colunas: `cc_transaction_pk`, `status`, `recovery_status`, `sticky_transaction_id`, `last_retry_attempt_time`, `dunning_profile_id`, `external_id`. Fonte primária: `information_schema.columns`.
- **Protection Plan**: 2 tabelas — `uown_los_protection_plan` (LOS, statuses ERROR/CANCELLED/COMPLETED/PENDING) e `uown_sv_protection_plan` (SV, statuses COMPLETED/PENDING/ERROR/BUDDY_SUCCESS). **Nenhuma tem status `ACTIVE`** no enum observado em qa1 — o lifecycle não usa "ACTIVE" como rótulo (provável: COMPLETED = plano vigente). Cancel via UI segue sem dado natural (igual gap dev3).
- **E-sign/signing**: tabela `uown_esign_document`; status reais são `STORED / SENT_TO_CUSTOMER / COMPLETED / ERROR / CANCELLED / REQUEST_RECEIVED` (NÃO existe valor literal `SENT` — query `status='SENT'` retorna 0 rows). Colunas `client` (SIGNWELL/GOWSIGN/PANDADOC) + `esign_mode` (EMBEDDED/EMAIL); NÃO tem `contract_type` (essa coluna vive em `uown_esign_event_trigger_log`/sweep, ver S2).

### Tabela de itens

| Item | Status qa1 | Status dev3 | Notas |
|---|---|---|---|
| Signing flow (UW_APPROVED leads) | **DESBLOQUEADO** (981 UW_APPROVED + 2 APPROVED) | BLOQUEADO (0 approved) | qa1 tem inventário de signing REAL: `uown_esign_document` SIGNWELL 4154 STORED / 261 COMPLETED / 1325 SENT_TO_CUSTOMER, GOWSIGN 255 SENT_TO_CUSTOMER, PANDADOC presente. Documents tab da 4452 vazio ("no records to display") — conta sem contrato anexado; usar conta COMPLETED para validar render do PDF (handoff) |
| Sticky Recover | **OK c/ dado real** (3 rows: pk2 CANCELED, pk3/pk4 SUBMITTED/PENDING; cc DENIED $110.57/$167.26; `number_of_attempts`=0) | BLOQUEADO (briefing dizia retry_attempt=0; coluna nem existe) | Contas 4945/4946 ACTIVE. Sweep StickyRecover (S2) não dispara (janela 7d não casa). Colunas **Sticky Recovery Status + Sticky Txn ID renderizam** no CC history grid de ambas as contas (`bodyHasSticky=true`) |
| Customer Portal /documents | **BUG (réplica)** — derruba sessão para login | BLOQUEADO (403) | Após OTP login OK (`loggedIn=true`, url=/overview), navegar `/documents` retorna ao login gate (`loginGate:true`, url=/). Réplica do BUG-S10-001 dev3 (`getFilesForAccount` 403 derruba sessão, já confirmado em S1) — agora reconfirmado em S7. Ver QA1-BUG-004 |
| Customer Portal /responses | **404 [CONFIRMADO]** | BLOQUEADO (404) | `GET /responses` → hard 404 "This page could not be found." (Next.js). Réplica do CP-S8-02 dev3. Rota não existe no portal do cliente |
| Protection Plan (ACTIVE) | **0 ACTIVE no ambiente** (3992 = COMPLETED) | BLOQUEADO (0 active) | Section "Protection Plan" renderiza na Customer Information (3992, status COMPLETED). Nenhuma conta com PP "ACTIVE" (status não existe no enum). Cancel de PP sem dado natural (igual dev3). Ver PP-OBS-QA1-001 |
| Reverse payment button | **OK** | OK (payment-history) | `/payment-history/4452`: colunas **"Reverse Payment" + "Update Payment"** presentes, `reverseIcon=true` (svg arrow-rotate-left). Affordance renderiza; NÃO exercida (evita reverter pagamento real) |
| PayNearMe history | **OK via dropdown** | OK | Acessível pelo menu History → PayNearMe (menuitem JS-driven, `href=""`); grid renderiza (Date/Type/User ID/Notes, 10 rows). Rota direta `/pay-near-me/4452` → 404; só `/paynearme-history/4452` resolve sem 404 — navegação é via dropdown, não URL direta |
| Email history | **OK via dropdown** | OK | Menu History → Email renderiza grid; `/email-history/4452` direto mostra shell sem rows (acesso é via dropdown). Logs de email reais existem (OTP em `uown_sv_activity_log`: "Sent VerificationCode... Subject: Verification Code Email") |
| Account Sale button | **OK** | n/d | Botão "Account Sale" presente na `/search` (`accountSale=true`) — affordance de venda de conta renderiza |

### Achados

**🔴 QA1-BUG-004 [CONFIRMADO] — Customer Portal /documents derruba a sessão do cliente (réplica cross-env do BUG-S10-001 dev3, agora em 3 ambientes).** Após login OTP bem-sucedido (`loggedIn=true`, redirect para `/overview`), navegar para `/documents` faz o app **voltar ao login gate** ("CUSTOMER LOGIN... Sign in to your account"). S1 já havia capturado a causa raiz no nível de rede (`GET /uown/svc/getFilesForAccount?accountPk=4452` → **403** e o app derruba a sessão). S7 reconfirma o sintoma do ponto de vista do usuário (cliente autenticado clica em Documents → é deslogado). Já confirmado em qa1 (S1 + S7) E dev3 (BUG-S10-001) ⇒ bug de código/permissão do endpoint `getFilesForAccount`, NÃO provisioning de dado. **Severity S2** (workflow secundário do cliente quebrado, sem workaround — cliente não consegue ver documentos e ainda perde a sessão). Reprodução determinística (2 runs chromium idênticos). Fonte primária: DOM real pós-login + network 403 de S1.

**🟡 QA1-OBS-S7-001 [CONFIRMADO] — Customer Portal /responses retorna 404 hard.** `GET /responses` (cliente logado) → página 404 do Next.js ("This page could not be found.", `is404=true`). Réplica do CP-S8-02 dev3. A rota não existe no portal do cliente em qa1. Classificação `[OBSERVAÇÃO]` quanto a ser bug: pode ser rota legada/removida ou feature nunca exposta ao cliente — não há link de menu apontando para ela (menu do cliente: Account Summary, Payments, Documents, Contact Us, Account Settings). **Severity S3** (rota órfã; impacto = só quem digita a URL). Confirma replica de dev3.

**🟡 PP-OBS-QA1-001 [HIPÓTESE — inconsistência de estado] — `uown_sv_protection_plan` da 3992 = COMPLETED, mas activity log diz "No protection plan on this account: Offering protection plan".** A conta 3992 tem 1 row em `uown_sv_protection_plan` (pk214, status COMPLETED, `enrollment_date=null`), e a section "Protection Plan" renderiza na Customer Information. Porém o `uown_sv_activity_log` da mesma conta repete `INTERNAL "No protection plan on this account: Offering protection plan"` (5+ ocorrências, log_type INTERNAL). Possível dessincronização entre a tabela SV de PP e a engine de oferta (a engine não enxerga o PP COMPLETED e reoferece), OU semântica de "No protection plan" = "sem PP ATIVO vigente" (COMPLETED ≠ ativo). **Severity S3.** Classificação `[HIPÓTESE]` (regra #10) — exige reproduzir em fresh account com PP recém-criado para distinguir bug de sync vs semântica esperada de COMPLETED. `enrollment_date=null` num PP COMPLETED é o segundo sinal de estado parcial. Não classificar como bug sem fresh repro.

**🟡 QA1-OBS-S7-002 [OBSERVAÇÃO — navegação] — History sub-views (Email/PayNearMe/Phone/CC) só são acessíveis via dropdown JS-driven, não por URL direta.** Os menuitems do dropdown History têm `href=""` (vazio) e disparam via JS (replica do padrão a11y O-015/H-009: não são links reais). Navegar direto às rotas (`/email-history/4452`, `/phone-history/4452`) renderiza só o shell da conta com "no records"; `/pay-near-me/4452` e variantes → 404 (só `/paynearme-history/4452` não-404). Os grids funcionam corretamente quando acessados pelo dropdown (10 rows, headers Date/Type/User ID/Notes). Implicação para testes: page objects de history devem clicar no dropdown, não navegar por URL. Não é bug de produto; é fragilidade de teste se assumir rota direta.

- `[OBSERVAÇÃO]` o link "L10907" no header da Customer Information aponta para `https://origination-qa1.uownleasing.com/customers/10907` — portal Origination que está **100% quebrado em qa1** (QA1-BUG-001, HTTP 400 vazio). Qualquer agente que clicar cairá na tela inutilizável. Confirma blast radius do QA1-BUG-001 alcançando navegação cross-portal a partir do Servicing.

### Activity log (regra #13)

- **Signing/Documents (leitura):** abrir Documents tab é read-only → NÃO gera log (correto). Signing real (não disparado nesta sessão) geraria `[ContractService][...signed...]` + transições de status — handoff para sessão de criação fresh com lead UW_APPROVED → signing UI.
- **Sticky Recover (observação):** ler CC history é read-only → sem log. Um retry real do sweep StickyRecover geraria log de recovery (regra #13) — não exercido (sweep não dispara na janela 7d, ver S2).
- **Protection Plan (observação):** a section é read-only. PP-OBS-QA1-001 revela que o log de PP da 3992 é de **oferta** ("Offering protection plan"), não de criação/cancel — a cadeia de log de um cancel de PP (regra #13) não pôde ser validada (sem PP cancelável + UI de cancel ausente, igual dev3).
- **Customer Portal login (regra #13, positivo):** a cadeia de OTP do cliente está completa em `uown_sv_activity_log` da 4452 (capturada na spec): `CORRESPONDENCE "Sent VerificationCode. Subject: Verification Code Email. To: fintechgroup777+1077600_159..."`, `CORRESPONDENCE "Created VerificationCode to be sent as EMAIL"`, `INTERNAL "Login Success using code 757240 at 2026-06-10T13:43:21; Attempt 1"` — audit chain do login do cliente íntegra ✓ (reconfirma WEB-01 de S1/S4).
- Único log gerado pela sessão inteira: `REVIEW "Lead has been reviewed"` (manager abrindo customer-information) — benigno, idêntico a S3/S6.

### Comparação vs dev3

| Item | dev3 | qa1 (S7) | Conclusão |
|---|---|---|---|
| Signing flow | BLOQUEADO (0 approved leads) | **DESBLOQUEADO** (981 UW_APPROVED; esign docs SIGNWELL/GOWSIGN/PANDADOC com COMPLETED reais) | qa1 é o ambiente para validar signing E2E (criar lead fresh → assinar via UI → validar PDF render, regra #14). dev3 nunca conseguia chegar lá |
| Sticky Recover | BLOQUEADO (briefing: retry_attempt=0) | **dado real** (3 rows, `number_of_attempts`=0, cc DENIED) | Coluna do briefing (`retry_attempt`) está errada — real é `number_of_attempts`. qa1 tem sticky observável; sweep não dispara (janela 7d, S2) |
| CP /documents | 403 (BUG-S10-001) | **403 + derruba sessão** (QA1-BUG-004) | Réplica confirmada em 3 ambientes (dev3 + qa1 S1 + qa1 S7) → bug de código do endpoint, não env |
| CP /responses | 404 | **404** | Réplica confirmada (rota inexistente cross-env) |
| Protection Plan ACTIVE | 0 active | **0 active** (enum nem tem ACTIVE; 3992=COMPLETED) | Mesmo gap: cancel de PP sem dado natural em ambos. qa1 adiciona PP-OBS-QA1-001 (inconsistência log vs row) |
| Reverse payment | OK (payment-history) | **OK** (colunas Reverse/Update + ícone) | Idêntico |
| PayNearMe / Email history | OK | **OK via dropdown** | Idêntico; qa1 documenta que acesso é JS-driven, não URL direta (QA1-OBS-S7-002) |

### Lacunas / handoff para sessão futura

1. **Signing E2E fresh (regra #14, UI-first):** qa1 DESBLOQUEIA o que dev3 não permitia. Criar lead fresh UW_APPROVED → exercer signing via UI (iframe SignWell/GowSign) → validar render do PDF (placeholders preenchidos, não `{{token}}` vazio — caçar o BUG-01 de Daniel's Jewelers que API-only mascara). Documents tab da 4452 está vazio; usar conta com esign COMPLETED para validar o render do documento anexado.
2. **Sticky Recover retry real:** disparar StickyRecoverSweep exige conta com cc DENIED + `posting_date = hoje-7` (janela 7d). As 3 rows atuais não casam a janela. Criar/ajustar conta de teste (autorização Exception 3) + validar log de recovery (regra #13) e incremento de `number_of_attempts`.
3. **QA1-BUG-004 (CP /documents):** escalar junto com BUG-S10-001 — bug de código do `getFilesForAccount` (403 + drop de sessão), confirmado cross-env. Reportar a dev.
4. **PP-OBS-QA1-001:** reproduzir em fresh account com PP criado para distinguir bug de sync (engine não vê PP COMPLETED) de semântica esperada (COMPLETED ≠ ativo). Não classificar como bug sem fresh repro (regra #10).
5. **Cancel de Protection Plan:** sem dado ACTIVE + sem UI de cancel óbvia (igual dev3). Verificar se há endpoint admin/API de cancel ou se a UI expõe cancel só quando há PP vigente.

### Notas / regra #16

Esta seção é registro de execução, não fonte de padrão. Asserções técnicas com fonte primária: DB qa1 via `env-query.mjs` (schema `uown_sticky`/`uown_sv_protection_plan`/`uown_esign_document`, counts de signing/PP/sticky, activity log) e DOM real via Playwright headless (Documents/payment-history/search/CC-history grids, Customer Portal /documents+/responses pós-OTP, History dropdown). Categoria volátil ([[volatile-knowledge-registry]]): contagem de leads UW_APPROVED, esign docs por status, rows de sticky e estado de PP mudam com runs e o tempo — re-verificar antes de afirmar em testes futuros. Specs `_discovery-s7-*` são read-only e seguras para re-execução (zero signing / zero mutação / zero ação de negócio). As falhas firefox/webkit dos runs são ausência de binário no ambiente local (não-produto); evidência veio dos runs chromium.

---

## S8 — Criação de Aplicação: sendApplication + new-application UI (2026-06-10) — CONCLUÍDA ✅

**Método:** hierarquia UI → API → DB (regra #18). UI via Playwright headless chromium (regra #15; MCP browser não exposto nesta sessão → fallback headless autorizado por memória `reference_dev3_discovery_workflow` + regra #15), viewport `1440×900`, usuário `manager`. Captura de rede via listener `page.on('response')` + `request.headers()`. Oracle secundário: `curl` direto (svc vs origination host), decode de JWT, e DB qa1 via `env-query.mjs` (read-only). **Parte B criou 3 leads fresh** (test-data-hierarchy: PADRÃO criar fresh; nota de orçamento abaixo). Scripts de diagnose/send foram temporários e removidos ao final (zero artefato deixado no repo).

> **Nota de orçamento (transparência):** o briefing pedia no máximo 2 leads (1×13m, 1×16m). Foram criados **3** — duas execuções 13m (12272, 12273; a segunda foi um re-run não intencional para capturar o output completo do `getApplicationStatus`) + uma 16m (12274). Excesso de 1 lead 13m; todos UW_APPROVED, `account_pk=null` (não progridem para Servicing sem signing/funding), sem efeito colateral em contas existentes.

### PARTE A — UI: diagnose do QA1-BUG-001 + wizard new-application

#### A1. Root cause do QA1-BUG-001 — REFINADO de `[CONFIRMADO]` (S1) para causa raiz localizada

S1 já isolou o 400 à "camada de sessão/proxy (BFF Express)". S8 **localiza a falha com precisão** e descarta hipóteses.

**Repro autenticado (DOM real + network):** após login `manager` OK (URL → `/overview`), TODAS as ~11 chamadas `/uown/*` retornam **HTTP 400, `content-length: 0`, `x-powered-by: Express`, `server: istio-envoy`, `etag: W/"0-..."`** (etag de corpo zero-length). Header `usertoken` presente (JWT 7488 chars), `username: manager@fakeemail.com`, `Content-Type: application/json`. Endpoints afetados: `getLeadFilterOptions`, `getLeadsInDateRange`, `getAllClientTypes`, `getApplicationCountDetails`, `getApprovalRateDetails`, `getAvgApprovalDetails` etc.

**Matriz de isolamento (S8, fresh):**
| Probe | Resultado | Conclusão |
|---|---|---|
| qa1 browser `manager` → `/overview` (11 chamadas `/uown/*`) | **0 OK / 11 FAIL (400 vazio)** | repro determinístico |
| qa2 browser `manager` → `/overview` (MESMA flow, MESMO release FE) | **11 OK / 0 FAIL (200, payloads grandes)** | não é frontend, não é o usuário |
| Token size qa1 vs qa2 | 7488 vs **7271** chars (quase igual) | **header-size DESCARTADO** — qa2 funciona com token equivalente |
| `getAllClientTypes` + MESMO `username`/`usertoken` via **svc-qa1.uownleasing.com** (LOS direto) | **HTTP 200** (489 bytes, lista de client types) | LOS vivo, token válido |
| `getLeadFilterOptions` (POST) via **svc-qa1** | **HTTP 200** (572.988 bytes) | LOS vivo |
| MESMOS endpoints via **origination-qa1** BFF (browser) | **HTTP 400 vazio** | **a falha é exclusiva do path BFF→LOS do portal Origination** |
| `curl` direto a `origination-qa1/uown/...` sem cookie de sessão | 404 (Express) | a rota `/uown/*` do BFF só "existe" com sessão `merchant.sid` ativa (proxy server-side) |

**🔴 QA1-BUG-001 [CONFIRMADO] — causa raiz: o BFF/proxy do portal Origination em qa1 roteia `/uown/*` para um upstream LOS quebrado ou mal-configurado.** O mesmo backend LOS responde 200 quando acessado pelo host `svc-qa1` com os mesmos headers de auth; responde 400-vazio quando o portal Origination o intermedeia. A diferença NÃO é: backend LOS (vivo), token (válido, mesmo tamanho em qa2), frontend release (qa2 idêntico funciona), header-size (qa2 ok com token equivalente), usuário (S1 já testou test.tester). **Resta como causa: configuração de upstream/rewrite do deploy do BFF Origination em qa1** (env var de target host LOS apontando para destino quebrado, ou rewrite que LOS rejeita). **Severity S1** (portal interno agent-facing 100% inutilizável; sem workaround na UI). **Ação:** escalar a dev/infra com a evidência "200 via svc / 400 via origination, mesmos headers". Regressão de deploy nas últimas ~2 semanas (memória confirma Origination qa1 funcional em 2026-05-24).

- 🟡 **SEND-OBS-QA1-001 [OBSERVAÇÃO]** — o `usertoken` (JWT HS256) tem **7488 chars** porque o payload (5555 bytes) carrega `data.permissions.access` (5512 bytes — mapa aninhado de permissões por feature). TTL do token = **900 segundos (15 min)** (`exp − iat`). Curiosidade de schema: `data.iat` está em **milissegundos** (1781114774394) enquanto `iat`/`exp` top-level estão em **segundos** — inconsistência de unidade dentro do mesmo JWT (cosmético, não causa o bug; mas dificulta validação de expiry manual). NÃO é a causa do 400 (qa2 funciona com token de tamanho equivalente).

#### A2. Wizard new-application (UI, antes do 400)

A rota real é **`/newApplication`** (NÃO `/new-application`, que dá 404 "Oops, this page is not on our radar"). O item "New Application" no sidebar é JS-driven (sem `href` real — replica do padrão a11y O-015/H-009 visto em S7), navega para `/newApplication` ao clicar.

**Step 1 do wizard (renderiza client-side, ANTES da falha de dados):**
| Campo | Tipo | Notas |
|---|---|---|
| Email | `input#custEmailAddress` type=email | renderiza |
| Phone | `input#phone` type=text | renderiza |
| Merchant | react-select "Select a merchant" | **NÃO popula** — depende de `getBasicMerchantInfoByRefCode` (400) |
| Location | react-select "Select a location" | depende do merchant selecionado |
| SEND | `<button>` | presente |

O fluxo Origination de "New Application" é o agente **enviar um link** (Email/Phone) para o cliente completar a aplicação no portal Website — NÃO um wizard multi-página de dados do solicitante no próprio Origination. **Bloqueio:** ao carregar `/newApplication`, falham `getBasicMerchantInfoByRefCode → 400` e `getSendApplicationRequestsByCriteria → 400`. Consequência: o dropdown de Merchant fica vazio → o agente não consegue selecionar merchant → SEND inutilizável. O formulário renderiza (Step-1 estrutura observável) mas é **funcionalmente bloqueado pelo QA1-BUG-001**. Validações client-side de formato (email/phone) não puderam ser exercidas a fundo porque o submit depende do merchant.

### PARTE B — API: sendApplication completo (svc-qa1, partner API)

**Host correto:** `sendApplication` roteia via **`svc-qa1.uownleasing.com`** (host `svc` do `BaseClient`, NÃO origination) — totalmente independente do BFF Origination quebrado. Auth = headers `Authorization` (`UOWN_API_AUTHORIZATION`) + `x-api-key`/`X-API-KEY`/`api-key`/`Api-Key` (`UOWN_API_KEY`, 40 chars) + credenciais de merchant no body (`userName`/`setupPassword`/`merchantNumber`). Builder canônico: `buildSendApplicationBody` (`src/api/bodies/application.body.ts`); cliente `ApplicationClient` (`src/api/clients/application.client.ts`).

**Merchant usado:** TerraceFinance `OL90202-0001` (pk 3792) — UOWN, NY, com programas 13m E 16m ativos em qa1 (mesmo merchant da conta de referência 4452). `mainNextPayDate = hoje+7` (06/17), `mainPayFrequency=WEEKLY` (default seguro, memória `sendapplication_nextpaydate_within_10_days`).

#### B2/B3 — 13m (non-916 SSN) — APPROVED

| Item | Valor | Fonte |
|---|---|---|
| SSN | `419270123` (9 dígitos, suffix non-916, non-9 último dígito) | request body |
| HTTP / status | **200** / `appApprovalStatus: APPROVED`, `transactionStatus: E0` | response |
| leadPk (`authorizationNumber`) | **12272** | response + DB |
| accountNumber (uuid) | `08b2c32c-f536-426e-a1c2-d33f1ccb31e1` | response + `uown_los_lead.uuid` |
| creditLimit / max_approval_amount | **$4190** | response + `uown_los_lead.max_approval_amount=4190.00` |
| `paymentDetailsList` terms | **13, 13** (WK13 + BW13 only) | response |
| redirectUrl (contrato) | `https://secure-qa1.uownleasing.com/S9BUbNXA/complete?planId=WK13` | response |
| DB lead_status / internal_status | **UW_APPROVED** / UW_APPROVED, merchant_pk 3792 | `uown_los_lead` pk 12272 |

**Activity log (regra #13) — cadeia COMPLETA, `uown_los_lead_notes` lead_pk=12272 (18 notes):**
`[ApplicationRequest][toLeadInfo]` → `Lead received from merchant terraceFinance` → `[LeadService][setItemsForLead] TotalItems : 1` → `Change lead status from NEW to PENDING_UW` → `Device Type: Playwright/...` → `[UnderwritingService][runUnderwriting] Start` → `UW is run. Lead Status UW_APPROVED` → `Approval is 4190.00` → **`[LeadProgramService][getLTOProgramsForLead] lead 12272 ... EligibleTerms 13`** → `After defaulting to 13,16 terms are : 13` → `[CalculatorService][buildScheduleForFrequency] term 13 ...`. Audit chain íntegra: criação → UW → aprovação → cálculo de schedule. ✓

#### B4 — 16m (suffix 916) — APPROVED com 16m

| Item | Valor | Fonte |
|---|---|---|
| SSN | `705490916` (suffix **916**) | request body |
| HTTP / status | **200** / APPROVED | response |
| leadPk | **12274** | response + DB |
| accountNumber (uuid) | `a754e3cf-0ac4-48e4-9be7-9757e0c0a5fd` | response |
| `paymentDetailsList` terms | **16, 16, 13, 13** (WK16 + BW16 + WK13 + BW13) | response |
| programName enviado | `GOW 16 month program` (override) | request body |
| DB lead_status | **UW_APPROVED**, max_approval_amount $4190, merchant_pk 3792 | `uown_los_lead` pk 12274 |

**Activity log (regra #13) — oracle do recipe 16m, lead_pk=12274:**
`Lead received from merchant terraceFinance` → `UW is run. Lead Status UW_APPROVED` → **`[LeadProgramService][getLTOProgramsForLead] lead 12274 ... EligibleTerms 16`** → `After defaulting to 13,16 terms are : 13,16`. ✓

#### Achado — recipe 16m CONFIRMADO via fresh repro

**🟢 SEND-CONF-QA1-001 [CONFIRMADO] — o sufixo de SSN `916` desbloqueia EligibleTerms 16 em qa1; sufixos comuns dão EligibleTerms 13.** Comparação controlada A/B em fresh data (mesmo merchant, mesmo state NY, mesmo orderTotal, mesma annual income na 13m): SSN `419270123` (non-916) → underwriter loga `EligibleTerms 13` e `paymentDetailsList` retorna SÓ 13m; SSN `705490916` (916) → underwriter loga `EligibleTerms 16` e retorna 16m+13m. Fonte primária: `uown_los_lead_notes` (`getLTOProgramsForLead`) + `paymentDetailsList` da response. Confirma e refina a memória `reference_qa1_16m_eligibility_blocked` — o gatilho é o **sufixo `916`** processado pelo mock BlackBox de qa1 (não um SSN fixo). NÃO é bug; é o comportamento de mock de underwriting de qa1, útil como recipe de teste 16m.

#### B3 step 3 — visualização no Servicing

Os 3 leads são `UW_APPROVED` com **`account_pk = null`** (`uown_los_lead`) e **0 rows** em `uown_sv_account` — corretamente NÃO aparecem na busca do Servicing (que é account-based; o lead só vira conta serviçável após signing → funding). Comportamento esperado, NÃO bug. Visualização no Servicing exigiria progredir o lead (submitApplication → sign → settle → fund), fora do escopo desta sessão de criação.

### Comparação com dev3 (referência cruzada)

| Item | dev3 | qa1 (S8) | Conclusão |
|---|---|---|---|
| sendApplication | funcional (com pitfall SB3 `DuplicateCheckStep` Map.of NPE quando bank/phone/email ausentes) | **funcional** (SB 2.x; não reproduz o NPE SB3 — body com employer/email/phone preenchidos) | qa1 é SB 2.x → não tem a regressão SB3 de `Map.of`; sendApplication limpo |
| Origination UI | (não comparado nesta bateria) | **100% bloqueado** (QA1-BUG-001) | bug específico de deploy qa1 |
| Recipe 16m | n/d | **916 → EligibleTerms 16 CONFIRMADO** | recipe portável documentada |

### Lacunas / handoff para sessão futura

1. **QA1-BUG-001 → escalar a dev/infra** com evidência "200 via svc-qa1 / 400 vazio via origination-qa1, mesmos `username`/`usertoken`". Pedido concreto: verificar a env var de target host LOS / regra de rewrite do BFF Origination no deploy qa1 (provável apontando para upstream quebrado). Comparar com o deploy qa2 (que funciona).
2. **Signing E2E fresh (regra #14):** os leads 12272/12274 estão UW_APPROVED prontos para exercer o fluxo de signing via UI (Website/secure-qa1 `redirectUrl`). Handoff conecta com a lacuna #1 de S7 (validar render de PDF GowSign/SignWell). NÃO progredidos nesta sessão.
3. **Wizard new-application — validação de formato client-side:** não exercida a fundo (submit bloqueado pelo merchant dropdown vazio). Re-testar quando QA1-BUG-001 for corrigido.
4. **Limpeza de leads de teste:** 12272/12273/12274 são UW_APPROVED órfãos (sem account). Não requerem cleanup ativo (não impactam contas reais), mas ficam como ruído no LOS de qa1.

### Notas / regra #16

Esta seção é registro de execução, não fonte de padrão. Asserções técnicas com fonte primária: network real (Playwright headless, `page.on('response')` + `request.headers()`), `curl` direto (svc vs origination host, decode de JWT), e DB qa1 via `env-query.mjs` (`uown_los_lead` leads 12272/12273/12274, `uown_los_lead_notes` audit chain, `uown_merchant`/`uown_merchant_to_program`/`uown_merchant_program` para elegibilidade de programa). Categoria volátil ([[volatile-knowledge-registry]]): o estado do QA1-BUG-001 (regressão de deploy) e a contagem/estado dos leads de teste mudam com o tempo — re-verificar antes de afirmar; o recipe `916→16m` depende do mock BlackBox de qa1 (categoria env-provisioning, re-confirmar por env). Tokens JWT têm TTL 15min. Scripts temporários de diagnose/send removidos (zero artefato no repo); os erros `tsc` remanescentes (`dev3-trigger-sweeps.ts`, `svc-460-perf-report.ts`) são pré-existentes (mtime Jun 2), não relacionados a S8.

---

## S9 — Config DANIELS_JEWELERS + sendApplication sem mainNextPayDate (2026-06-10) — CONCLUÍDA ✅

> Disclaimer (regra #16): este arquivo é registro de execução, NÃO fonte de padrão.

### Objetivo

Aplicar via API o config que torna `mainNextPayDate` opcional para o client_type `DANIELS_JEWELERS` (espelhando o commit `62e2fc20` do repo `devops/configuration`, que adiciona a chave ao `application.yaml`), depois enviar uma application sem `mainNextPayDate` e validar que ela é aceita.

### Config aplicada (API)

| Item | Valor |
|---|---|
| Chave (fonte: `LosRequestMessageConstraintValidatorConfig.java:20-25`) | `com.uownleasing.svc.validator.LosRequestMessageConstraintValidator.required.fields.for.DANIELS_JEWELERS` |
| Valor enviado | `mainFirstName,mainLastName,mainDOB,mainSSN,mainCellPhone,emailAddress,mainPostalCode` (sem `mainNextPayDate`) |
| Endpoint | `POST https://svc-qa1.uownleasing.com/ConfigurationManagement/createOrUpdateConfig` |
| Resultado | **200 OK**, row pk **137** criada (`rowCreatedTimestamp 2026-06-10T14:24:19`) |
| Reload | `GET /ConfigurationManagement/forceReloadConfig` → **200 OK** |
| Confirmação DB | `uown_configuration_management` tem a row com o valor exato (verificado antes=0 rows, depois=1 row) |
| Default do código (quando a chave não está no map) | `mainFirstName,...,mainPostalCode,mainNextPayDate` (`LosRequestMessageConstraintValidatorConfig.java:23`) |

### Merchant usado

| Item | Valor | Fonte |
|---|---|---|
| `merchantNumber` enviado | `OL90205-0088` | `uown_merchant` pk 6196 |
| location_name | Daniel's Jewelers (315) Sugar Land | `uown_merchant` |
| state / client_type | **TX** / `DANIELS_JEWELERS` (active, not deleted) | `uown_merchant` |

Decisão de merchant: o payload da imagem usava `merchantNumber: "TST GOW Marcos"` (um `location_name` de dev2, inexistente em qa1). O svc resolve `merchantNumber` por **`ref_merchant_code`** (não por location_name) — confirmado no código: `CustomExceptionHandler.java:109` e `ApplicationService.java:355` chamam `getActiveMerchantByMerchantCode(merchantNumber)`, que faz `findByMerchantInfo_RefMerchantCodeAndMerchantInfo_IsActiveTrueAndMerchantInfo_IsDeletedFalse` (`MerchantService.java:272-274`). Como o applicant é TX (Spring 77382), escolhi um Daniel's TX ativo: `OL90205-0088`.

### Resultado do sendApplication

| Item | Valor |
|---|---|
| Endpoint | `POST https://svc-qa1.uownleasing.com/uown/los/sendApplication` |
| Auth | `Authorization` (API key) + `userName`/`setupPassword` (`danielsJewelers` / `U0wn_danielsJewelers_CnRKhJ`, batem com o enum `ClientType.DANIELS_JEWELERS`) |
| `mainNextPayDate` no body | **OMITIDO** (objetivo do teste) |
| HTTP / status | **400 Bad Request** |
| Erro | `{"faults":true,"fieldInError1":"mainNextPayDate","sorErrorDescription":"mainNextPayDate is required","transactionStatus":"E3","appApprovalStatus":"DECLINED"}` |
| Fresh repro | **2x** com emails únicos por run — mesmo 400 nas duas |
| Lead criado | **Nenhum** (`uown_los_lead` 0 rows para `send_application_to_email LIKE 's9.daniels.%'`) |

### Activity log (regra #13)

**N/A nesta sessão** — a validação (`LosRequestMessageConstraintValidator.checkRequiredFields`, linha 229) lança `InvalidFieldsException` **antes** de qualquer persistência de lead. A ação de negócio (criação de lead) nunca começou, portanto não há `uown_los_lead_notes` esperado. Confirmado: zero leads e zero notes para os emails de teste. (Quando a app é aceita, a cadeia `[ApplicationRequest][toLeadInfo]` → UW → ... aparece — ver S8 leads 12272/12274.)

### Root cause — por que a config via API não surtiu efeito [CONFIRMADO]

Investigação no código svc/common (fonte primária):

1. O validator lê os required fields via `config.getRequiredFieldsForClientType(clientType)` (`LosRequestMessageConstraintValidator.java:221`), que chama `svc.config.configuration.ConfigurationManagement.getString(key, default)` (`LosRequestMessageConstraintValidatorConfig.java:3,14,20-25`).
2. Esse `ConfigurationManagement` (svc, Hazelcast) delega para `ConfigurationUtility.getString` (`ConfigurationManagement.java:17-22`), que lê de um **`IMap<String,String> configurationMap`** (`ConfigurationUtility.java:63-68`).
3. O `configurationMap` é hidratado **exclusivamente** de `SystemConfigurationProperties.getConfig()` — o map `system.config.*` do `application.yaml` (`@ConfigurationProperties(prefix = "system")`) — e essa hidratação é **re-aplicada a cada leitura** via `getConfigurationUtility()` → `configurationMap.setAll(systemConfigurationProperties.getConfig())` (`ConfigurationAnnotationProcessor.java:40-43`).
4. O endpoint `POST /createOrUpdateConfig` grava em **outra** fonte: a tabela DB `uown_configuration_management`, via `common.service.ConfigurationManagementService.createOrUpdate` → `configRepo.save` (`common/.../ConfigurationManagementService.java:24-35`). Essa classe (DB) **não** é a que o validator usa, e **nada carrega a tabela DB para dentro do `configurationMap` da svc**.
5. `forceReloadConfig` faz `evictAllConfiguration()` + `configureFieldInjectionForAll()` (`ConfigurationManagementController.java:30-36`), mas a próxima leitura re-aplica `setAll(systemConfigurationProperties)` — re-overlaying o YAML, sem nunca consultar o DB.

**Conclusão:** existem dois sistemas de config desacoplados. A chave DANIELS gravada no DB nunca chega ao `configurationMap`, então `configurationMap.get(key)` retorna `null` e o validator cai no **default do código** (`...,mainNextPayDate`). O config SÓ tem efeito pela via que o commit `62e2fc20` usa: o `system.config` do `application.yaml` (externalizado no repo `configuration` / configmap), aplicado em **boot/reload de pod** — não pela API DB `createOrUpdateConfig`.

### Classificação

- **SEND-CFG-QA1-001 [CONFIRMADO] — `createOrUpdateConfig` NÃO aplica chaves servidas pelo `system.config` do YAML (ex.: `required.fields.for.<ClientType>`).** Fresh repro 2x + mecanismo confirmado no código (svc + common). Não é bug de produto; é a arquitetura de config (DB vs Hazelcast/YAML são fontes distintas). Tipo: **environment/config (caminho de aplicação de config incorreto para esta classe de chave)**. Severity **S3** (não bloqueia produto; bloqueia apenas a técnica de override por API para esta categoria de chave). O behavior alvo (`mainNextPayDate` opcional) é exercitável quando o `application.yaml` do commit `62e2fc20` for deployado em qa1.

### Como aplicar o config de fato (próximos passos — NÃO executados)

1. Deployar o `application.yaml` do commit `62e2fc20` (repo `configuration`) em qa1 — adiciona `system.config."...required.fields.for.DANIELS_JEWELERS"` ao YAML. Requer pipeline devops/restart de pod (acesso infra; fora do alcance QA).
2. Após o deploy, re-rodar `s9-daniels-send.mjs` (sem `mainNextPayDate`) e esperar **200/aprovação** com lead persistido + audit chain (regra #13).
3. Alternativa de override por chaves YAML em runtime: confirmar com o time svc se há mecanismo (Spring Cloud Config refresh / configmap reload) que repopule `system.config` sem rebuild — `forceReloadConfig` sozinho NÃO basta (comprovado).

### Notas / regra #16

Registro de execução, não fonte de padrão. Fonte primária das asserções: código svc (`LosRequestMessageConstraintValidator.java`, `LosRequestMessageConstraintValidatorConfig.java`, `ConfigurationManagement.java`, `ConfigurationUtility.java`, `ConfigurationAnnotationProcessor.java`, `ConfigurationManagementController.java`, `MerchantService.java`, `ClientType.java`), código common (`ConfigurationManagementService.java`), respostas HTTP reais de qa1 (`createOrUpdateConfig` 200, `sendApplication` 400) e DB qa1 via `env-query.mjs` (`uown_configuration_management` pk 137, `uown_merchant` pk 6196, ausência de lead). **Correção de memória:** `reference_config_management_endpoint.md` afirma que `createOrUpdateConfig` aplica config genericamente — isso é **falso** para chaves servidas pelo `system.config` do YAML (categoria volátil: provisioning/config). A nota foi corrigida nesta sessão. Scripts temporários `s9-daniels-config.mjs` e `s9-daniels-send.mjs` foram removidos do repo (ver limpeza).

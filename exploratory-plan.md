# Plano de Testes Exploratórios — UOWN Leasing

> **Metodologia:** Session-Based Test Management (SBTM) · charters de 60–90 min.
> **Escopo:** Origination · Servicing · Customer (Website) · AMS · Sweeps · Journeys cross-portal.
> **Premissa:** cobertura funcional completa, priorizando hotspots (CLAUDE.md Rules 13–16 + pitfalls #1–#19).
> **Versão:** 0.3 · **Última atualização:** 2026-05-12

---

## Índice

- [Quick Start](#quick-start)
- [Glossário de Heurísticas](#glossário-de-heurísticas)
- [Charter Index](#charter-index)
- [Como Usar Este Plano](#como-usar-este-plano)
- [Mapa de Risco](#mapa-de-risco-cross-portal)
- [§1. Portal Origination](#1-portal-origination-agent)
- [§2. Portal Servicing](#2-portal-servicing-agent)
- [§3. Portal Customer (Website)](#3-portal-customer-website)
- [§4. Portal AMS](#4-portal-ams-admin)
- [§5. Sweeps (Scheduled Jobs)](#5-sweeps-scheduled-jobs)
- [§6. Journeys (Cross-Portal)](#6-journeys-cross-portal)
- [Open Items (em discussão)](#open-items-em-discussão)
- [Matriz de Cobertura](#matriz-de-cobertura)
- [Bug Reporting Template](#bug-reporting-template)
- [Manutenção & Changelog](#manutenção--changelog)

---

## Quick Start

**Se você abriu este plano para rodar uma sessão hoje:**

1. **Escolha um charter** pela [Charter Index](#charter-index) (filtre por prioridade + duração disponível).
2. **Confira pré-requisitos globais** ([Como Usar §3](#3-pré-requisitos-globais)) — `.env`, viewport ≥ 1440×900, MCP Playwright, IMAP.
3. **Crie a nota da sessão** a partir do template: `docs/test-plans/sessions/_template.md` → `sessions/{YYYY-MM-DD}-{CHARTER-ID}-{seu-user}.md`.
4. **Execute** seguindo `Áreas` (checklist) → `Heurísticas` → checando `Oracles` em paralelo.
5. **Saia** quando os `Exit criteria` baterem. Reporte bugs via [template](#bug-reporting-template).

**Cadência sugerida:**
- **Release regression:** todos os P0 (~22h · 2 testers × 1 semana)
- **Quinzenal:** P0 + metade dos P1
- **Mensal:** plano completo

---

## Glossário de Heurísticas

Cards rápidos — referenciados nos charters como `[SFDIPOT]`, `[Tour Money]`, etc.

| Tag | Heurística | Resumo |
|-----|-----------|--------|
| `[SFDIPOT]` | Structure / Function / Data / Interface / Platform / Operations / Time | Cubo de variação — varie 1-2 dimensões por sessão |
| `[CRUSSPIC]` | Quality attributes | Capability · Reliability · Usability · Security · Scalability · Performance · Installability · Compatibility |
| `[STMPL]` | Suporte cross-cutting | Supportability · Testability · Maintainability · Portability · Localizability |
| `[Tour Money]` | Money tour (Whittaker) | Caminhos onde o dinheiro flui — vetores de erro financeiro |
| `[Tour Landmark]` | Landmark tour | Pontos âncora da feature — visitar todos antes de explorar caminhos |
| `[Tour Antisocial]` | Antisocial tour | Faça o oposto do esperado — recusas, cancels, abandonos |
| `[Tour OCD]` | Obsessive-compulsive | Repita a mesma ação 5-10× — detecta non-determinism + memory leaks |
| `[Tour BackAlley]` | Back-alley tour | Features pouco usadas + edge cases esquecidos |
| `[Tour AllNighter]` | All-nighter | Deixe a feature rodando — timeouts, expirações, sweeps disparando |
| `[Tour Saboteur]` | Saboteur | Quebre dependências de propósito (banking deletada, token expirado) |
| `[Galumphing]` | Variação maliciosa | Input intencionalmente errado mas plausível (Jr/Sr, accents, leading zero) |
| `[Hawthorne]` | Repetir pra detectar não-determinismo | Rode o mesmo path 2× e compare resultado |
| `[Boundary/EC]` | Boundary Value + Equivalence Class | 0 / 1 / max-1 / max / max+1; classes válidas vs. inválidas |

---

## Charter Index

> Owner = TBD significa pendente de atribuição. `Code` linka page object / spec / API client existente quando aplicável.

### Origination (Agent)

| ID | Missão | P | Min | Owner | Code |
|----|--------|---|-----|-------|------|
| [ORI-01](#ori-01--pipeline-de-fraude-e-scoring-17-steps) | Pipeline de fraude (17 steps) | P0 | 90 | TBD | `tests/api/origination/`, `src/api-clients/origination/` |
| [ORI-02](#ori-02--submissão-e-missing-fields) | Submissão + missing fields + CC auth | P0 | 60 | TBD | `src/api-clients/.../sendApplication.ts` |
| [ORI-03](#ori-03--three-program-modalities-13m--1316m--second-look) | Três modalidades (13m / 13+16m / Second Look) | P0 | 90 | TBD | `.claude/context/shared/ssn-test-catalog.md` |
| [ORI-04](#ori-04--cc-authorization-e-signing-fees) | CC auth + signing fees + Buddy.insure | P0 | 60 | TBD | TBD |
| [ORI-05](#ori-05--merchant-management-preflight-e-activity-log-no-ui) | Merchant CRUD + preflight + UI activity log | P1 | 90 | TBD | `src/data/merchant-config-contract.ts` |
| [ORI-06](#ori-06--contract-generation-e-e-sign-routing) | Contract gen + SignWell/GowSign routing | P0 | 90 | TBD | `docs/external/gowsign/` |
| [ORI-07](#ori-07--leads-list-search-e-modification-history) | Leads list + filtros merchant/location | P1 | 75 | TBD | TBD |
| [ORI-08](#ori-08--program-groups--statefrequency-configuration) | Program groups + state/frequency config | P1 | 90 | TBD | TBD |
| [ORI-09](#ori-09--funding-process) | Funding (SETTLEMENT → FUNDED → account) | P0 | 90 | TBD | TBD |
| [ORI-10](#ori-10--item-split-cart--approval) | Item Split (carrinho > aprovação) | P0 | 60 | TBD | TBD |
| [ORI-11](#ori-11--second-opportunity-whitelist-re-engagement) | Second Opportunity (whitelist re-engagement) | P1 | 60 | TBD | TBD |

### Servicing (Agent)

| ID | Missão | P | Min | Owner | Code |
|----|--------|---|-----|-------|------|
| [SVC-01](#svc-01--customer-search-e-account-overview) | Customer search v1/v2 + account view | P1 | 60 | TBD | TBD |
| [SVC-02](#svc-02--payment-arrangements-cc--ach--check) | Payment arrangements CC/ACH/Check | P0 | 90 | TBD | `tests/e2e/.../makeCcPaymentArrangement` |
| [SVC-03](#svc-03--due-date-adjustments) | Due date manual + TMS IVR | P1 | 60 | TBD | TBD |
| [SVC-04](#svc-04--settlement-payment-flow) | Settlement → SETTLED_IN_FULL | P0 | 90 | TBD | TBD |
| [SVC-05](#svc-05--frequency-change-com-rewindreplay) | Frequency change rewind/replay | P1 | 90 | TBD | TBD |
| [SVC-06](#svc-06--banking--bank-account-crud) | Bank account CRUD + soft delete | P1 | 60 | TBD | TBD |
| [SVC-07](#svc-07--contact-info-opt-out-ai-dncdnt) | Contact info, Opt Out AI, DNC/DNT | P1 | 60 | TBD | TBD |
| [SVC-08](#svc-08--auto-pay-e-rating-letter) | Auto-pay + rating letter regen | P1 | 60 | TBD | TBD |
| [SVC-09](#svc-09--refund--payment-reversal) | Refund / payment reversal | P0 | 90 | TBD | TBD |
| [SVC-10](#svc-10--payment-arrangement-lifecycle-edit--cancel--allocation) | Arrangement edit/cancel/allocation | P1 | 60 | TBD | TBD |

### Customer (Website)

| ID | Missão | P | Min | Owner | Code |
|----|--------|---|-----|-------|------|
| [WEB-01](#web-01--login--otp-flow) | Login + OTP freshness | P0 | 60 | TBD | `src/helpers/imap.helpers.ts` |
| [WEB-02](#web-02--account-dashboard-e-document-access) | Dashboard + doc download | P1 | 60 | TBD | TBD |
| [WEB-03](#web-03--make-payment-via-customer-portal) | Make payment via portal | P0 | 60 | TBD | TBD |
| [WEB-04](#web-04--contact-info-update) | Contact info update | P1 | 45 | TBD | TBD |
| [WEB-05](#web-05--settlement-offer-acceptance) | Settlement offer acceptance | P0 | 60 | TBD | TBD |
| [WEB-06](#web-06--notifications--email-templates-render-check) | Email templates render | P1 | 60 | TBD | TBD |

### AMS (Admin)

| ID | Missão | P | Min | Owner | Code |
|----|--------|---|-----|-------|------|
| [AMS-01](#ams-01--user-management-e-merchant-assignment) | User CRUD + merchant assignment | P1 | 60 | TBD | TBD |
| [AMS-02](#ams-02--merchant-programs-activation-dates-e-log-no-ui) | Programs activation dates + UI log | P0 | 90 | TBD | TBD |
| [AMS-03](#ams-03--email-template-administration) | Email template admin + preview | P1 | 60 | TBD | TBD |
| [AMS-04](#ams-04--fraud-blacklist-e-system-logs) | Fraud blacklist + system logs | P1 | 60 | TBD | TBD |
| [AMS-05](#ams-05--reporting--analytics) | Reporting & analytics | P2 | 60 | TBD | TBD |
| [AMS-06](#ams-06--blacklist-cc-bin-validation) | Blacklist com CC BIN 6 dígitos | P1 | 60 | TBD | TBD |
| [AMS-07](#ams-07--permissões-granulares) | Permissões granulares (matriz) | P0 | 90 | TBD | TBD |
| [AMS-08](#ams-08--bulk-associate-users-to-merchants) | Bulk associate users to merchants (Task #74) | P1 | 60 | TBD | TBD |
| [AMS-09](#ams-09--cleanup-endpoints) | Cleanup endpoints (proteção 3 meses) | P2 | 45 | TBD | TBD |

### Sweeps

> **Fonte oficial:** `business-rules §34` — 74 sweeps em 13 categorias.

| ID | Missão | P | Min | Owner | Code |
|----|--------|---|-----|-------|------|
| [SWP-01](#swp-01--sweep-admin--operations-tooling) | Sweep admin (pause/resume/trigger/logs) | P1 | 60 | TBD | TBD |
| [SWP-02](#swp-02--cc-payment-sweeps-matrix) | CC Payment Sweeps Matrix (§34.1–34.7) | P0 | 90 | TBD | TBD |
| [SWP-03](#swp-03--ach-payment-sweeps-matrix) | ACH Payment Sweeps Matrix (§34.8–34.14) | P0 | 90 | TBD | TBD |
| [SWP-04](#swp-04--fee-sweeps) | Fee Sweeps (§34.15–34.16) | P1 | 45 | TBD | TBD |
| [SWP-05](#swp-05--account-status-sweeps) | Account Status Sweeps (§34.17–34.20) | P0 | 60 | TBD | TBD |
| [SWP-06](#swp-06--email--sms-sweeps-matrix) | Email / SMS Sweeps Matrix (§34.21–34.30) | P0 | 90 | TBD | TBD |
| [SWP-07](#swp-07--document--e-sign-sweeps) | Document / E-Sign Sweeps (§34.31–34.35) | P0 | 60 | TBD | TBD |
| [SWP-08](#swp-08--tax-sweeps) | Tax Sweeps — TaxCloud (§34.36–34.39) | P1 | 60 | TBD | TBD |
| [SWP-09](#swp-09--protection-plan-sweep) | Protection Plan Sweep (§34.40) | P1 | 45 | TBD | TBD |
| [SWP-10](#swp-10--delinquency--collections-sweeps) | Delinquency / Collections (§34.41–34.45) | P0 | 75 | TBD | TBD |
| [SWP-11](#swp-11--financial-reports-sweeps) | Financial Reports (§34.46–34.59) | P1 | 90 | TBD | TBD |
| [SWP-12](#swp-12--partner-reports-sweeps) | Partner Reports (§34.60–34.62) | P1 | 45 | TBD | TBD |
| [SWP-13](#swp-13--external-integrations-sweeps) | External Integrations (§34.63–34.65) | P1 | 60 | TBD | TBD |
| [SWP-14](#swp-14--monitoring-sweeps) | Monitoring Sweeps (§34.66–34.69) | P1 | 45 | TBD | TBD |

### Journeys (Cross-Portal)

| ID | Missão | P | Min | Owner |
|----|--------|---|-----|-------|
| [JNY-01](#jny-01--lease-lifecycle-happy-path-e2e) | Happy path lease lifecycle | P0 | 90 | TBD |
| [JNY-02](#jny-02--recovery-path-delinquency--settlement) | Delinquency → settlement | P0 | 90 | TBD |
| [JNY-03](#jny-03--risk-path-denials--second-look-retry) | Denials + Second Look retry | P1 | 60 | TBD |
| [JNY-04](#jny-04--cross-portal-data-consistency-audit) | Cross-portal consistency | P1 | 60 | TBD |

---

## Como Usar Este Plano

### 1. Template de Charter

Cada charter tem:

- **Missão** — objetivo em 1 frase
- **Duração / Prioridade**
- **Setup** — ambiente, dados, contas
- **Áreas** — checklist (`[ ]`) de features cobertas
- **Heurísticas** — referência ao [Glossário](#glossário-de-heurísticas)
- **Oracles** — como decidir se algo é bug
- **Riscos focais** — pitfalls a perseguir
- **Bug bar** — o que reportar vs. observar
- **Cross-portal** — touchpoints (quando aplicável)
- **Exit criteria** — quando a sessão acabou

### 2. Reporting

- **Notas da sessão:** copiar `docs/test-plans/sessions/_template.md` → `sessions/{YYYY-MM-DD}-{charter-id}-{tester}.md`
- **Bugs:** seguir [`bug-classification-rules.md`](../../.claude/context/shared/bug-classification-rules.md) — `[OBSERVAÇÃO]` → `[HIPÓTESE]` → `[CONFIRMADO]`. Reprodução em dados fresh obrigatória
- **Activity Log:** ausência = bug (Rule #14)
- **DOM-first** em falha de seletor (Rule #16) — MCP Playwright antes de mexer no seletor
- **UI-first** (Rule #15) — features com UI exploradas via browser

### 3. Pré-requisitos Globais

- `.env` configurado para ambiente alvo (sandbox / qa1 / qa2 / stg)
- Acesso aos 4 portais com usuários ativos (agent + admin + customer demo)
- `AUTO_HEAL_MERCHANT=true` para charters de Origination que criam aplicação
- Viewport mínima **1440×900** (Bootstrap `d-lg-block` esconde elementos abaixo)
- MCP Playwright disponível para investigação de seletores
- IMAP Gmail configurado para OTP polling (charters de Website)
- Acesso DB read-only (queries de validação)
- Acesso ao GitLab issues do projeto (para checar regressões antes de classificar como bug)

### 4. Integração com a Automação Existente

| Quando | Use |
|--------|-----|
| Sessão revelou novo cenário a automatizar | Pipeline `/qa-flow` ou `new-flow` (CLAUDE.md §Pipeline Types) |
| Sessão encontrou flaky test | Pipeline `debug` → `subagent-debug-flaky` |
| Sessão precisa de novo page object | Pipeline `new-page-object` |
| Catálogos de código existente | [`page-objects-catalog.md`](../../.claude/context/shared/page-objects-catalog.md) · [`api-clients-catalog.md`](../../.claude/context/shared/api-clients-catalog.md) · [`helpers-catalog.md`](../../.claude/context/shared/helpers-catalog.md) |

### 5. Priorização

| Prioridade | Critério | Cadência |
|------------|----------|----------|
| **P0** | Bloqueia revenue ou viola compliance (signing, payment, settlement, funding) | A cada release |
| **P1** | Degrada experiência principal (dashboards, contracts, merchant setup) | Quinzenal |
| **P2** | Caminho secundário (admin tooling, reports, edge cases) | Mensal |
| **P3** | Cosmético / nice-to-have | Trimestral |

---

## Mapa de Risco Cross-Portal

| Hotspot | Portais Afetados | Charter(s) |
|---------|------------------|------------|
| Pitfall #1 (email reuse → DataMismatch) | Origination | ORI-01, ORI-02 |
| Pitfall #3 (VISA BIN 5146 → rollback) | Origination | ORI-04 |
| Pitfall #10 (merchant drift mid-test) | Origination + AMS | ORI-05, AMS-02 |
| Pitfall #11 (FK rollback CC settlement plural) | Servicing | SVC-04, SVC-09 |
| Pitfall #15 (`is_active` vs. dates) | Origination + AMS | AMS-02, ORI-05 |
| qa2 SSN 401 (token refresh) | Origination | ORI-01 |
| Activity Log silencioso (Rule #14) | TODOS | TODOS |
| Brand mismatch UOWN ↔ Kornerstone | Origination + Servicing + Website | ORI-03, SVC-08, WEB-06 |
| GowSign vs. SignWell rollout | Origination + Customer | ORI-06, WEB-02 |
| Rating letter regen async | Servicing + Website | SVC-08, WEB-03 |
| Refund idempotência / double-refund | Servicing | SVC-09 |
| Arrangement × auto-pay double charge | Servicing | SVC-10 |
| Activity log em DB sem aparecer no UI | Origination + AMS | ORI-05, ORI-08, AMS-02 |
| State/frequency config sem propagar à eligibility | Origination | ORI-08 |
| Group delete deixando programas órfãos | Origination | ORI-08 |
| Double funding / FUNDED sem account em Servicing | Origination + Servicing | ORI-09 |
| Cross-merchant data leak via filtro de leads | Origination | ORI-07 |
| Sweep pausada sem alerta em prod | Sweeps | SWP-01 |
| Sweep não-idempotente (double processing após resume) | Sweeps | SWP-02..SWP-14 |
| CC double charge em IdempotentCCSweep (TIMEOUT) | Sweeps | SWP-02 |
| PayWallet XLSX processado 2× | Sweeps | SWP-03 |
| Cross-merchant leak em partner reports | Sweeps | SWP-12 |
| Skit.ai recebe customer não-delinquente | Sweeps | SWP-10 |
| TaxCloud double submission | Sweeps | SWP-08 |
| Kornerstone import duplicado | Sweeps | SWP-13 |
| Item Split double charge PURCHASE_NOW | Origination | ORI-10 |
| Whitelist sem creditLimit aprovando default | Origination | ORI-11 |
| User com permission errada acessa SSN/DOB | AMS | AMS-07 |
| Bulk addMerchantsToUsers lossy (não-aditivo) | AMS | AMS-08 |
| Cleanup deletando dado recente (< 3 meses) | AMS | AMS-09 |
| BIN duplicate ou tamanho errado aceito | AMS | AMS-06 |

---

## §1. Portal Origination (Agent)

### ORI-01 — Pipeline de Fraude e Scoring (17 steps)
- **Missão:** explorar o pipeline de 17 etapas para descobrir denials silenciosos ou aprovações indevidas
- **Duração:** 90 min · **Prioridade:** P0
- **Setup:** merchant ativo (programas 13m + 16m); SSNs do `ssn-test-catalog.md` (APPROVED, DENIED, FPD, BLACKLIST, DUPLICATE); 5 emails únicos por run
- **Áreas:**
  - [ ] State Check · Merchant Auto-Deny · Blacklist · DataMismatch · Previous Leads
  - [ ] UW Denied · FPD Check · Duplicate · Reapproval · NeuroID
  - [ ] Underwriting · Invoice Placeholder · Max Approval · Cost Comparison
  - [ ] Item Split · Calculator
  - [ ] Error log entry para cada step (`uown_los_lead_notes`)
- **Heurísticas:** `[SFDIPOT]` em State (CA/CO/NY/TX) × Function (apply/resubmit) × Data (idade, income) × Time (token refresh boundary) · `[Galumphing]` SSN duplicado em 30s · `[Hawthorne]` mesmo SSN 2× pra checar non-determinism
- **Oracles:** `uown_los_lead_notes` com entry para cada step; lead status final coerente com SSN do catálogo; error log com CC mascarado
- **Riscos focais:** Pitfall #1 (email reuse), Pitfall #2 (missing `getMissingFields`), qa2 SSN 401, NeuroID timeout silencioso
- **Bug bar:** denial sem entry em `uown_los_lead_notes` = P0; approval sem step `UnderwritingStep` = P0 crítico
- **Exit criteria:** todos os SSNs do catálogo testados; matriz `SSN × state × esperado vs. real` preenchida; bugs reportados ou ausência de bugs documentada

### ORI-02 — Submissão e Missing Fields
- **Missão:** descobrir validações ausentes no fluxo `sendApplication → getMissingFields → submitApplication`
- **Duração:** 60 min · **Prioridade:** P0
- **Setup:** aplicação fresh por iteração; CCs do `constants.ts` (MASTERCARD_APPROVED apenas; **evitar BIN 5146 VISA**)
- **Áreas:**
  - [ ] Form de missing data · `planId` selection · `merchantProgramPk`
  - [ ] CC authorization · cardholder name match
  - [ ] HTTP 400/500 com mensagem clara (sem stack trace)
  - [ ] Skip do `getMissingFields` → erro esperado
- **Heurísticas:** `[Galumphing]` (planId de outro merchant, merchantProgramPk inexistente, CC com nome diferente) · `[Boundary/EC]` (0 / 1 / max char)
- **Oracles:** specs em `application-lifecycle-protocol.md`
- **Riscos focais:** Pitfall #2, Pitfall #3 (VISA rollback), Pitfall #5 (Kornerstone sem banking)
- **Bug bar:** stack trace exposto ao agent = P1 security/UX; campo silenciosamente ignorado = P0
- **Exit criteria:** Pitfall #2/#3/#5 confirmados ou refutados; mensagens de erro auditadas

### ORI-03 — Three Program Modalities (13m / 13+16m / Second Look)
- **Missão:** validar os três caminhos de programa e brand UOWN vs. Kornerstone
- **Duração:** 90 min · **Prioridade:** P0
- **Setup:** SSN 100000053 (Second Look) + merchant TireAgent CA; merchant Kornerstone ativo; merchant UOWN puro 13m
- **Áreas:**
  - [ ] Plan selection 13m only (UOWN)
  - [ ] Plan selection 13+16m (Kornerstone)
  - [ ] Second Look retry (denial 13m → preview 16m → resubmit com banking → approval 16m)
  - [ ] Brand: footer, logo, email sender, contract PDF coerente com `company`
  - [ ] Term display (13/16), processing fee, amount at signing
- **Heurísticas:** `[Tour Landmark]` brand (footer/logo/email/PDF) · `[Tour Money]` cada modalidade
- **Oracles:** `uown_sv_account.company`, template do contrato, copy do email
- **Riscos focais:** brand mismatch (UOWN footer em Kornerstone), Pitfall #5
- **Bug bar:** brand cruzado = P1 visual; Second Look denial em SSN 100000053 stg = P0
- **Exit criteria:** 3 modalidades testadas E2E; brand auditado nos 4 artefatos (footer, email, PDF, header)

### ORI-04 — CC Authorization e Signing Fees
- **Missão:** explorar charging de signing fees e validação de cardholder
- **Duração:** 60 min · **Prioridade:** P0
- **Setup:** merchant com Protection Plan (TireAgent/BW13); CCs APPROVED / DECLINED / 3DS / EXPIRED
- **Áreas:**
  - [ ] `/authorizeCreditCard` happy path
  - [ ] Idempotência de charge (2× mesmo auth → 1 charge)
  - [ ] Cardholder name match (acentos, hífen, Jr/Sr)
  - [ ] Buddy.insure widget rendering
  - [ ] CC masking nos error logs
- **Heurísticas:** `[Tour Money]` · `[Galumphing]` replay attack · `[Tour Saboteur]` BIN 5146
- **Oracles:** charge único em gateway log; signing fee aplicado uma vez no ledger
- **Riscos focais:** Pitfall #3, double-charge em retry, CC log sem mascaramento
- **Bug bar:** **PAN/CVV em log = P0 crítico security (escalation imediato)**
- **Exit criteria:** signing fees auditadas; nenhum dado sensível em log

### ORI-05 — Merchant Management, Preflight e Activity Log no UI
- **Missão:** descobrir drifts em config de merchant E validar que cada mudança aparece na seção "Activity Log" do UI
- **Duração:** 90 min · **Prioridade:** P1
- **Setup:** merchant dedicado; `merchant-config-contract.ts` como spec
- **Áreas:**
  - [ ] CRUD merchant (add, clone, edit, ref code, inventory category, location)
  - [ ] Money Factor display, pagination após clone
  - [ ] Program assignment (add 0/1/N, remove, reorder, idempotência)
  - [ ] Adicionar programa sem `addProgramsToMerchant` (Pitfall #14)
  - [ ] **UI Activity Log:** entry para cada edit (`MERCHANT_EDITED`, `PROGRAM_ADDED`, `PROGRAM_REMOVED`, `PROGRAM_DATA_CHANGE`) com diff old→new
  - [ ] Filtros do log no UI (tipo, data, agent)
  - [ ] Cross-check 1:1 SQL ↔ UI
- **Heurísticas:** `[Hawthorne]` preflight antes/depois de drift · `[Tour Saboteur]` `AUTO_HEAL_MERCHANT=false` → fail-fast
- **Oracles:** `uown_merchant_activity_log` com `log_type='PROGRAM_DATA_CHANGE'`; UI Activity Log section
- **Riscos focais:** Pitfall #10, #14, #15; entry em DB sem aparecer no UI
- **Bug bar:** drift sem activity log = P0 (Rule #14); DB sem UI = P0 (Rule #15); remoção sem entry = P0 compliance
- **Exit criteria:** todos os tipos de edit testados; log auditado UI+DB em cada um

### ORI-06 — Contract Generation e E-Sign Routing
- **Missão:** validar geração de contrato e roteamento SignWell ↔ GowSign ↔ PandaDoc
- **Duração:** 90 min · **Prioridade:** P0
- **Setup:** merchants com cada signer; estados CA/CO/NY (GowSign rollout parcial)
- **Áreas:**
  - [ ] SENT → SIGNED transition
  - [ ] SENT → ERROR/EXPIRED/CANCELLED transitions
  - [ ] Merchant redirect URL pós-signature
  - [ ] postMessage em iframe merchants
  - [ ] CC Peek consent extraction
  - [ ] Placeholders no PDF renderizado (BUG-01 Daniel's Jewelers)
- **Heurísticas:** `[SFDIPOT]` signer × state × merchant brand · `[Tour Antisocial]` cancel mid-signing
- **Oracles:** `gowsign-templates`, `uown_template.template_content`, redirect URL final
- **Riscos focais:** GowSign rollout (memory `project_gosign_rollout`), placeholder vazio no PDF
- **Bug bar:** placeholder vazio renderizado = P0 (Rule #15, UI-first)
- **Exit criteria:** matriz signer × state coberta; PDFs abertos e validados visualmente

### ORI-07 — Leads List, Search e Modification History
- **Missão:** explorar filtros (incluindo merchant + location), pagination e history
- **Duração:** 75 min · **Prioridade:** P1
- **Setup:** conta com >100 leads em 5+ merchants e 10+ locations
- **Áreas:**
  - [ ] Filtros básicos: status, SSN last 4, email, invoice, DOB, phone
  - [ ] Filtro merchant (single + multi-select)
  - [ ] Filtro location (dependente do merchant)
  - [ ] Combinação merchant + location
  - [ ] Colunas merchant/location visíveis e ordenáveis
  - [ ] Pagination + sort stability
  - [ ] Modification history + Open-to-Buy tracking
- **Heurísticas:** `[Boundary/EC]` 0/1/N resultados · `[Tour BackAlley]` location sem merchant; homônimas
- **Oracles:** `WHERE merchant_pk=X AND location_pk=Y` bate com UI
- **Riscos focais:** cross-merchant data leak; sort quebrando paginação; location de A em leads de B
- **Bug bar:** filtro escondendo registro = P0; cross-merchant leak = P0 security
- **Exit criteria:** todas as combinações de filtro testadas; consistência SQL ↔ UI auditada

### ORI-08 — Program Groups & State/Frequency Configuration
- **Missão:** explorar grupos (folders), config de visibilidade por state e frequency support
- **Duração:** 90 min · **Prioridade:** P1
- **Setup:** merchant com ≥3 programas; pool de states (CA, CO, NY, TX, WI)
- **Áreas:**
  - [ ] Program Groups: criar, renomear, deletar (vazio + com programas)
  - [ ] Mover programa entre grupos · clone group · paginação dentro do grupo
  - [ ] State whitelist/blacklist por programa
  - [ ] State restrictions (CA money factor cap, NY frequency BI_WEEKLY-only, WI banking)
  - [ ] Programa com 0 states → eligibility bloqueada?
  - [ ] Frequency support por state (WEEKLY/BI_WEEKLY/SEMI_MONTHLY/MONTHLY)
  - [ ] UI Activity Log do programa (não só merchant)
- **Heurísticas:** `[Galumphing]` desabilitar todos os states; deletar grupo com programas · `[Tour Saboteur]` mudar state e tentar aplicar de state recém-removido
- **Oracles:** `uown_merchant_program` columns; activity log DB+UI; eligibility query em Origination
- **Riscos focais:** cache stale; group delete deixando órfãos; frequency change não propagando
- **Bug bar:** state removido mas application aprovada = P0 compliance; órfãos = P0 data integrity
- **Exit criteria:** grupos CRUD testado; state × frequency matriz coberta; activity log UI auditado

### ORI-09 — Funding Process
- **Missão:** explorar SETTLEMENT → FUNDING → FUNDED, garantindo fluxo correto de dinheiro, fees, retries e activity log
- **Duração:** 90 min · **Prioridade:** P0
- **Setup:** lead SETTLEMENT (contrato assinado, signing fee paga, settlement payment confirmado); merchant com banking válida; acesso ao funding batch
- **Áreas:**
  - [ ] Status transitions SETTLEMENT → FUNDING → FUNDED → ACTIVE
  - [ ] Funding batch (manual vs. sweep)
  - [ ] Cálculo: approved − processing fee − protection plan − holdback
  - [ ] Banking destino validado; merchant sem banking → bloqueio claro
  - [ ] Retries em ACH bounce / routing inválido / merchant suspended
  - [ ] Account creation pós-FUNDED (Servicing) + welcome email
  - [ ] UI Activity Log para cada transição (com valor, batch_id, timestamp)
  - [ ] Funding report em AMS bate com transações
- **Heurísticas:** `[Tour Money]` cada step · `[Hawthorne]` rodar 2× pro mesmo lead (idempotência) · `[Tour Saboteur]` pausar `FundingSweep` → criar SETTLEMENT → retomar (catch-up)
- **Oracles:** `uown_los_lead` transitions; `uown_sv_account` criado; `uown_funding_batch` entry; ACH log; email
- **Riscos focais:** double funding; FUNDED sem account; activity log ausente em FAILED; Pitfall #5
- **Bug bar:** double funding = P0 financeiro; FUNDED sem Servicing account = P0 data integrity; merchant suspended fundado = P0 compliance
- **Exit criteria:** happy path + falha + idempotência testados; account criado e visível em Servicing/Website

### ORI-10 — Item Split (cart > approval)
- **Missão:** validar divisão de carrinho quando custo excede aprovação (itens financiados + PURCHASE_NOW)
- **Duração:** 60 min · **Prioridade:** P0
- **Fonte:** [`business-rules §31`](../business-rules/11-administracao.md)
- **Setup:** merchant com `isItemSplit=true`; CC válido pra purchase-now charge; threshold default $300
- **Áreas:**
  - [ ] Cart com excesso dentro do threshold → split sugerido
  - [ ] Cart com excesso acima do threshold → split NÃO oferecido
  - [ ] Merchant com `isItemSplit=false` → sem split
  - [ ] Cálculo: `purchaseTotal = soma dos PURCHASE_NOW items`
  - [ ] Redução de `merchandiseAmount` e `totalInvoiceAmount`
  - [ ] Transação CC SALE separada para PURCHASE_NOW
  - [ ] Activity log `ITEM_SPLIT_APPLIED`
- **Heurísticas:** `[Boundary/EC]` no threshold ($299 vs $300 vs $301) · `[Tour Money]` cada path
- **Oracles:** `uown_los_invoice.purchaseTotal`; gateway log; activity log
- **Riscos focais:** double-charge nos PURCHASE_NOW; cálculo errado de purchaseTotal
- **Bug bar:** double charge = P0 financeiro; split acima do threshold = P0 compliance
- **Exit criteria:** boundary do threshold testado; happy + negativo cobertos

### ORI-11 — Second Opportunity (whitelist re-engagement)
- **Missão:** validar fluxo de re-engajar cliente blacklistado via whitelist seletivo
- **Duração:** 60 min · **Prioridade:** P1
- **Fonte:** [`business-rules §32`](../business-rules/11-administracao.md)
- **Diferente de Second Look** (Second Look = denial 13m → approval 16m; Second Opportunity = whitelist após charge-off/blacklist)
- **Setup:** cliente com lead anterior charged-off OU blacklistado; histórico em `uown_los_blacklist`
- **Áreas:**
  - [ ] Visualizar histórico (razão blacklist, data, CLV)
  - [ ] Setar `isWhitelisted=true` + `creditLimit` reduzido
  - [ ] Aplicação não cai em BlacklistStep
  - [ ] Approval respeita `creditLimit` reduzido
  - [ ] Tentar aplicar valor > creditLimit → bloqueio
  - [ ] `rtoAccountNumber` track cliente recorrente
  - [ ] Reverter whitelist → BlacklistStep volta
- **Heurísticas:** `[Tour Money]` · `[Galumphing]` aplicar 1¢ acima do limit
- **Oracles:** `uown_los_blacklist`; histórico preservado; activity log
- **Bug bar:** whitelist sem `creditLimit` aprovando default = P0 risco; histórico apagado = P0 compliance
- **Exit criteria:** lifecycle whitelist + reverter testado

---

## §2. Portal Servicing (Agent)

### SVC-01 — Customer Search e Account Overview
- **Missão:** validar TMS v1/v2 com dados consistentes e linkagem 100% de transações
- **Duração:** 60 min · **Prioridade:** P1
- **Setup:** conta ACTIVE com histórico (payments, due date moves, frequency change)
- **Áreas:**
  - [ ] Search by phone / SSN last 4 / DOB
  - [ ] v1 vs. v2 consistência
  - [ ] Customer info view + accounts linked
- **Heurísticas:** `[Boundary/EC]` SSN com 4 vs. mais dígitos; espaços; leading zeros
- **Oracles:** `customer_pk` consistente; account count = DB count
- **Riscos focais:** `/v2/customers/search` 500 qa2 (leadStatus SQL grammar)
- **Bug bar:** 500 em search = P0 se afeta workflow
- **Exit criteria:** v1 e v2 cobertos com mesmo dataset; diff documentado

### SVC-02 — Payment Arrangements (CC / ACH / Check)
- **Missão:** criar arrangement (NORMAL e SETTLEMENT) em cada método e detectar regressões em listener
- **Duração:** 90 min · **Prioridade:** P0
- **Setup:** conta ACTIVE com balance; CCs APPROVED + DECLINED; ACH válido + inválido; Check
- **Áreas:**
  - [ ] Make Payment modal
  - [ ] One-time card entry
  - [ ] NORMAL vs. SETTLEMENT arrangement
  - [ ] `db.waitForPaymentArrangementStatus(SUCCESS)` listener
  - [ ] NSF fee + daily rerun
  - [ ] End date no passado / muito futuro → erro UX
- **Heurísticas:** `[SFDIPOT]` Method × Type × Frequency · `[Tour Money]`
- **Oracles:** `uown_sv_payment(PAID)`; activity log `PAYMENT_CREATED`; rating letter regenerado
- **Riscos focais:** Pitfall #7 (timeout qa2), Pitfall #11 (FK rollback plural), Pitfall #9 (silent missing PAID)
- **Bug bar:** payment sucesso sem `uown_sv_payment(PAID)` = P0
- **Exit criteria:** matriz Method × Type coberta; listener confirmado; activity log auditado

### SVC-03 — Due Date Adjustments
- **Missão:** validar manual move (`moveDueDatesByDays`) e TMS IVR (`adjustNextDueDate`) sem desalinhar schedule
- **Duração:** 60 min · **Prioridade:** P1
- **Setup:** conta com 6+ pagamentos futuros
- **Áreas:**
  - [ ] Manual move by N days
  - [ ] TMS IVR adjust (offset ou date)
  - [ ] History table (sort + pagination)
  - [ ] Activity log
- **Heurísticas:** `[Boundary/EC]` mover -30/+60/+365; passar end-of-lease
- **Oracles:** schedule futuro coerente; history paginada
- **Bug bar:** schedule passado modificado = P0; double entry no history = P1
- **Exit criteria:** ambos os métodos testados; history validado

### SVC-04 — Settlement Payment Flow
- **Missão:** quitar via settlement → SETTLED_IN_FULL com TODOS os artefatos
- **Duração:** 90 min · **Prioridade:** P0
- **Setup:** conta delinquente com settlement offer aprovado
- **Áreas:**
  - [ ] Settlement modal
  - [ ] CC charging (Pitfall #11 path)
  - [ ] Email confirmação
  - [ ] Rating letter final
  - [ ] Auto-pay desligado
- **Heurísticas:** `[Tour Money]` plural vs. singular endpoint
- **Oracles:** `uown_sv_payment(PAID)` presente; `SETTLED_IN_FULL`; email enviado. **NÃO forçar via UPDATE (memory `feedback_no_db_mutation_to_force_pass`).**
- **Riscos focais:** Pitfall #9, Pitfall #11
- **Bug bar:** SETTLED_IN_FULL sem PAID row = P0 (regressão Pitfall #9)
- **Exit criteria:** quitação E2E real; todos os artefatos verificados

### SVC-05 — Frequency Change com Rewind/Replay
- **Missão:** validar que mudança de frequência refaz schedule sem perder PAID
- **Duração:** 90 min · **Prioridade:** P1
- **Setup:** conta com 3+ PAID + 6+ futuros
- **Áreas:**
  - [ ] Frequency change modal
  - [ ] Reversal de futuros + replay
  - [ ] History paginada
  - [ ] Rating letter durante rewind
  - [ ] Auto-pay status pós-mudança
- **Heurísticas:** `[Hawthorne]` mesma mudança 2× · `[Tour Antisocial]` WEEKLY → MONTHLY (encolhe)
- **Oracles:** sum(paid) inalterado; novo schedule respeita end-of-lease
- **Bug bar:** payment PAID sumindo após rewind = P0 (data loss)
- **Exit criteria:** transições WEEKLY ↔ MONTHLY ↔ BI_WEEKLY testadas; data integrity confirmada

### SVC-06 — Banking & Bank Account CRUD
- **Missão:** add/delete/default em bank account com soft delete
- **Duração:** 60 min · **Prioridade:** P1
- **Setup:** conta sem bank account; CC default existente
- **Áreas:**
  - [ ] Add bank modal (routing + account validation)
  - [ ] Default toggle CC ↔ ACH
  - [ ] Soft delete
  - [ ] Activity log
- **Heurísticas:** `[Boundary/EC]` routing 9/10 dígitos; leading zeros · `[Galumphing]` trocar default 3× rapidamente
- **Oracles:** bank com `is_deleted=true` ausente do UI mas presente no DB
- **Bug bar:** PAN/account em log = P0 security
- **Exit criteria:** CRUD coberto; soft delete confirmado em DB+UI

### SVC-07 — Contact Info, Opt Out AI, DNC/DNT
- **Missão:** validar update de phone/email + flags de opt-out (Task #505)
- **Duração:** 60 min · **Prioridade:** P1
- **Setup:** conta com phone + email + opt-in default
- **Áreas:**
  - [ ] Edit primary contact (area code + phone)
  - [ ] Opt Out AI modal com reason
  - [ ] Send Podium Link + confirmation modal
  - [ ] Customer Portal Reminder
  - [ ] DNC + DNT flags com reason
- **Heurísticas:** `[Boundary/EC]` phone 9/10/11 dígitos · `[Galumphing]` reason vazio
- **Oracles:** activity log presente para CADA flag/edit
- **Bug bar:** opt-out sem activity log = P0 compliance
- **Exit criteria:** todos os campos editáveis testados; logs auditados

### SVC-08 — Auto-pay e Rating Letter
- **Missão:** explorar auto-pay toggle, regra de remoção por rating (C/P/M) e regen async
- **Duração:** 60 min · **Prioridade:** P1
- **Setup:** conta com auto-pay ON e rating S
- **Áreas:**
  - [ ] Auto-pay toggle (CC vs. ACH)
  - [ ] Rating letter regen pós-payment
  - [ ] CC Peek consent toggle
  - [ ] Rating degradado → auto-pay removida silenciosamente?
- **Heurísticas:** `[Tour AllNighter]` forçar rating C via NSF sequence
- **Oracles:** rating letter PDF rendered (UI-first); activity log `AUTO_PAY_REMOVED`
- **Bug bar:** auto-pay removida sem log = P0; rating letter stale = P1
- **Exit criteria:** transição S → A → B → C exercitada; auto-pay state auditado

### SVC-09 — Refund / Payment Reversal
- **Missão:** explorar reembolso total/parcial CC + ACH + signing fees + settlements, validando idempotência, ledger, rating e activity log
- **Duração:** 90 min · **Prioridade:** P0
- **Setup:** conta ACTIVE com mix: CC NORMAL, ACH NORMAL, CC SETTLEMENT, signing fee Origination, Check POSTED/CLEARED
- **Áreas:**
  - [ ] Refund total CC + parcial CC (split)
  - [ ] Refund total ACH + timing window (antes/depois CLEARED)
  - [ ] Refund signing fee (Processing/Security/Protection Plan)
  - [ ] Refund settlement → SETTLED_IN_FULL volta pra ACTIVE?
  - [ ] Check: confirmar NÃO existe refund button (só reversal)
  - [ ] Idempotência (2× rápido)
  - [ ] Activity log `PAYMENT_REFUNDED/REVERSED` (agent, motivo, valor)
  - [ ] Email customer + Website reflete
- **Heurísticas:** `[Tour Money]` cada path de refund · `[Galumphing]` refund > original; refund 0 · `[Saboteur]` refund seguido de auto-pay no mesmo dia
- **Oracles:** `uown_sv_payment` status REFUNDED; ledger = sum(paid) − sum(refunded); gateway com refund_id
- **Riscos focais:** double refund; refund settlement sem reverter status; activity log ausente; Pitfall #11 análogo
- **Bug bar:** **double refund = P0 financeiro (escalation)**; sem log = P0 compliance; PAN em log = P0 security
- **Exit criteria:** todos os métodos × signing/settlement testados; idempotência confirmada

### SVC-10 — Payment Arrangement Lifecycle (Edit / Cancel / Allocation)
- **Missão:** explorar edit, cancel, allocation strategy, recurring longos, conflitos com auto-pay e ratings degradados
- **Duração:** 60 min · **Prioridade:** P1
- **Setup:** conta ACTIVE com auto-pay ON; arrangement criado (NORMAL, WEEKLY, 12 occorrências); conta secundária rating C
- **Áreas:**
  - [ ] Edit: frequency / end date / source / allocation strategy
  - [ ] Cancel: 0 / 3 / all PAID — refund de PAID?
  - [ ] Allocation: Principal-first vs. Fee-first vs. Default
  - [ ] Recurring long (26+ ocorrências) — schedule completo
  - [ ] Conflito auto-pay × arrangement no mesmo dia
  - [ ] Arrangement em conta C/P/M
  - [ ] Activity log com diff old→new
- **Heurísticas:** `[Galumphing]` editar com 1 futuro restante · `[Tour Antisocial]` NSF + edit antes da rerun
- **Oracles:** ledger coerente; schedule = PAID + pendentes; auto-pay status correto
- **Bug bar:** double charge auto-pay + arrangement = P0 financeiro; allocation strategy não aplicada = P0
- **Exit criteria:** edit/cancel/allocation cobertos; conflito auto-pay validado

---

## §3. Portal Customer (Website)

### WEB-01 — Login + OTP Flow
- **Missão:** validar OTP E2E com freshness < 10min e IMAP polling
- **Duração:** 60 min · **Prioridade:** P0
- **Setup:** customer demo com Gmail IMAP; `IS_PRODUCTION` + `ENVIRONMENT_NAME` configurados
- **Áreas:**
  - [ ] Email/password login
  - [ ] OTP send + validation
  - [ ] Freshness < 10min
  - [ ] Resend OTP (cancela anterior?)
  - [ ] Expired OTP retry
  - [ ] Race: dois logins simultâneos
- **Heurísticas:** `[Boundary/EC]` OTP 5/6/7 dígitos · `[Tour AllNighter]` esperar 11min e tentar
- **Oracles:** OTP timestamp < 10min; only latest válido
- **Riscos focais:** stale OTP (commit `4f30c0d` hardened freshness)
- **Bug bar:** OTP antigo aceito = P0 security
- **Exit criteria:** freshness window auditado; resend behavior confirmado

### WEB-02 — Account Dashboard e Document Access
- **Missão:** dashboard pós-login e download de docs (contratos, recibos, rate quotes)
- **Duração:** 60 min · **Prioridade:** P1
- **Setup:** customer com conta ACTIVE; contrato assinado (GowSign + SignWell); payments PAID
- **Áreas:**
  - [ ] Active accounts list
  - [ ] Summary card (account number, schedule, rating)
  - [ ] Document PDF download
  - [ ] Brand UOWN vs. Kornerstone em footer/header
  - [ ] Placeholders preenchidos no PDF
- **Heurísticas:** `[Tour BackAlley]` documento em outra aba (cache)
- **Oracles:** dados batem com Servicing agent view
- **Riscos focais:** placeholder vazio (BUG-01 Daniel's Jewelers), brand mismatch
- **Bug bar:** PDF com placeholder vazio = P0 visual (Rule #15)
- **Exit criteria:** docs abertos visualmente; brand auditado

### WEB-03 — Make Payment via Customer Portal
- **Missão:** payment CC/ACH iniciado pelo cliente com confirmação por email
- **Duração:** 60 min · **Prioridade:** P0
- **Setup:** conta com balance; customer com CC/ACH on file
- **Áreas:**
  - [ ] Make Payment form
  - [ ] CC + ACH selection
  - [ ] Amount validation (zero, > balance)
  - [ ] Receipt email
  - [ ] Reflete em Servicing
  - [ ] Mobile viewport (375×667)
- **Heurísticas:** `[Galumphing]` double submit · `[Boundary/EC]` valor zero, > balance
- **Oracles:** `uown_sv_payment(PAID)`; email recibo; saldo atualizado
- **Bug bar:** **double charge = P0 financeiro**
- **Exit criteria:** desktop + mobile cobertos; reflete em Servicing em < 2min

### WEB-04 — Contact Info Update
- **Missão:** customer atualiza phone/email refletindo em Servicing + confirmação
- **Duração:** 45 min · **Prioridade:** P1
- **Setup:** customer logado em conta ACTIVE
- **Áreas:**
  - [ ] Phone area code + number
  - [ ] Email update
  - [ ] Validação formato
  - [ ] Confirmation email
  - [ ] Activity log em Servicing
- **Heurísticas:** `[Boundary/EC]` phone curto/longo · `[Galumphing]` email sem `@`; double-click save
- **Oracles:** novo phone/email em `uown_sv_customer`; activity log presente; agent vê update
- **Bug bar:** update silencioso = P1
- **Exit criteria:** changes propagados em < 2min; agent confirma

### WEB-05 — Settlement Offer Acceptance
- **Missão:** customer aceita/recusa offer criada pelo backend
- **Duração:** 60 min · **Prioridade:** P0
- **Setup:** conta delinquente com settlement offer ativo
- **Áreas:**
  - [ ] Offer banner
  - [ ] Accept modal
  - [ ] Decline
  - [ ] CC para settlement
  - [ ] Receipt
  - [ ] Offer expirado
- **Heurísticas:** `[Tour Antisocial]` aceitar e cancelar antes de pagar
- **Oracles:** `uown_sv_payment(PAID, SETTLEMENT)`; `SETTLED_IN_FULL`; email
- **Riscos focais:** Pitfall #11
- **Bug bar:** offer aceito sem charge = P0
- **Exit criteria:** accept + decline + expired testados

### WEB-06 — Notifications & Email Templates (Render check)
- **Missão:** auditar visual + conteúdo de emails (rating, payment, delinquency, settlement)
- **Duração:** 60 min · **Prioridade:** P1
- **Setup:** trigger cada tipo de email; abrir no Gmail
- **Áreas:**
  - [ ] Template content + placeholders resolvidos
  - [ ] Brand UOWN vs. Kornerstone
  - [ ] `merchantLocationName` resolvido
  - [ ] Contact info footer
  - [ ] Mobile rendering
- **Heurísticas:** `[Tour Landmark]` comparar DB template com email renderizado (Pitfall #18, #19)
- **Oracles:** placeholders todos resolvidos; brand correto
- **Bug bar:** `{{placeholder}}` literal no email = P0 visual
- **Exit criteria:** N templates conhecidos × 2 brands auditados

---

## §4. Portal AMS (Admin)

### AMS-01 — User Management e Merchant Assignment
- **Missão:** validar CRUD de usuário, RBAC e "manage merchants"
- **Duração:** 60 min · **Prioridade:** P1
- **Setup:** admin com permissão; pool de usuários e merchants
- **Áreas:**
  - [ ] User list + create/edit/disable
  - [ ] Role assignment
  - [ ] Merchant search/select/delete
  - [ ] Password reset
  - [ ] Modal confirm/cancel (animations desabilitadas)
- **Heurísticas:** `[Boundary/EC]` 0/1/N merchants · `[Tour Saboteur]` remover último merchant
- **Oracles:** após edit, agent vê apenas merchants atribuídos
- **Bug bar:** agent vendo merchant não atribuído = P0 security
- **Exit criteria:** RBAC validado; user lifecycle completo testado

### AMS-02 — Merchant Programs, Activation Dates e Log no UI
- **Missão:** ativação/desativação por datas (source of truth) e validar Activity Log no UI
- **Duração:** 90 min · **Prioridade:** P0
- **Setup:** merchant com 2+ programas; pausar `ProgramActivationDeactivationSweep` (linkar SWP-01)
- **Áreas:**
  - [ ] activation_date · deactivation_date · is_active (derived)
  - [ ] Pause/resume sweep
  - [ ] Post-resume reconciliation
  - [ ] UI Activity Log (`PROGRAM_DATA_CHANGE`) com diff old→new
  - [ ] Filtros do log (tipo, data, agent)
  - [ ] Cross-check 1:1 SQL ↔ UI
- **Heurísticas:** `[Galumphing]` `is_active=true` com `activation_date` futuro (Pitfall #15) · `[Hawthorne]` 5 edits rápidos → 5 entries
- **Oracles:** `ProgramActivationUtils.isActiveOnDate` lógica; activity log presente
- **Riscos focais:** Pitfall #12, #13, #14, #15; entry sem UI
- **Bug bar:** programa ativo fora do range = P0; DB sem UI = P0 (Rules #14, #15)
- **Exit criteria:** todos os tipos de edit auditados em DB + UI

### AMS-03 — Email Template Administration
- **Missão:** preview + test send + edit + detectar divergência DB vs. repo
- **Duração:** 60 min · **Prioridade:** P1
- **Setup:** lista de templates conhecidos
- **Áreas:**
  - [ ] Template viewer + placeholder list
  - [ ] Test send para inbox
  - [ ] Edit + save
  - [ ] Diff com repo
  - [ ] Test send com Kornerstone vs. UOWN
- **Heurísticas:** `[Tour Landmark]` comparar `uown_template.template_content` com versão no repo (Pitfall #18, #19)
- **Oracles:** template renderizado em inbox bate com preview
- **Bug bar:** placeholder não resolvido em test send = P0
- **Exit criteria:** N templates auditados; mobile rendering confirmado

### AMS-04 — Fraud Blacklist e System Logs
- **Missão:** validar blacklist (name/SSN/email/phone/address) e auditoria de logs
- **Duração:** 60 min · **Prioridade:** P1
- **Setup:** pool de identidades fictícias
- **Áreas:**
  - [ ] Add/remove blacklist entry
  - [ ] Search blacklist
  - [ ] Effect na Origination (BlacklistStep)
  - [ ] System logs (auth, API, payment, email)
- **Heurísticas:** `[Tour Money]` add entry → submit app → ver denial
- **Oracles:** lead com step `BlacklistStep` failed; activity log de add/remove
- **Bug bar:** blacklist inativo ou não removível = P0 compliance
- **Exit criteria:** blacklist lifecycle completo; downstream effect confirmado

### AMS-05 — Reporting & Analytics
- **Missão:** validar consistência de relatórios (volume, approval rate, payment performance, revenue)
- **Duração:** 60 min · **Prioridade:** P2
- **Setup:** ambiente com volume (qa1/stg)
- **Áreas:**
  - [ ] Application volume
  - [ ] Approval/denial rates
  - [ ] On-time vs. delinquent
  - [ ] Fees collected + revenue
  - [ ] Export CSV
- **Heurísticas:** `[Tour Landmark]` cross-check com queries diretas
- **Oracles:** soma dos relatórios = soma das queries; CSV bate com UI
- **Bug bar:** discrepância > 1% = P1 (revenue)
- **Exit criteria:** todos os reports principais auditados

### AMS-06 — Blacklist CC BIN Validation
- **Missão:** validar adicionar/remover entries de blacklist por CC BIN (6 dígitos), incluindo duplicate detection
- **Duração:** 60 min · **Prioridade:** P1
- **Fonte:** [`business-rules §30`](../business-rules/11-administracao.md)
- **Setup:** AMS com permissão blacklist; pool de BINs válidos/inválidos
- **Áreas:**
  - [ ] BIN 6 dígitos válido (add/remove)
  - [ ] BIN 5/7/8 dígitos → bloqueado com mensagem
  - [ ] Duplicate BIN → bloqueado
  - [ ] Effect downstream: aplicação com CC iniciando pelo BIN → BlacklistStep failed
  - [ ] Search blacklist por BIN
  - [ ] Activity log de add/remove
- **Heurísticas:** `[Boundary/EC]` 5/6/7 dígitos · `[Galumphing]` BIN com letras
- **Oracles:** `uown_los_blacklist`; lead com `BlacklistStep=FAILED`
- **Bug bar:** BIN tamanho errado aceito = P1; duplicate aceito = P1; downstream sem efeito = P0
- **Exit criteria:** validação 6 dígitos + duplicate + downstream auditados

### AMS-07 — Permissões Granulares
- **Missão:** validar matriz de permissões (Servicing + Origination) por role/user — incluindo `restricted.view.*`, `lead_status_*`, `payment.*`
- **Duração:** 90 min · **Prioridade:** P0
- **Fonte:** [`business-rules §49`](../business-rules/11-administracao.md)
- **Setup:** ≥4 usuários com sets distintos de permissions; pool de contas + leads
- **Áreas:**
  - [ ] `restricted.view.full.ssn` / `restricted.view.full.dob` (mascaramento)
  - [ ] `restricted.view.partial.account_number` (account masking)
  - [ ] `restricted.view.servicing_redirect` (cross-portal)
  - [ ] `payment.create_or_update_ach_payment` / `payment.make_credit_card_payment` (ações de pagamento)
  - [ ] `payment_transaction.reverse_payment` / `refund_payments` (refund/reverse)
  - [ ] `documents.edit_document` / `resend_stored_doc` / `delete_file`
  - [ ] `customer_information.*` (edit primary contact/info/banking/CC)
  - [ ] Origination: `move_to_servicing` / `change_lead_status` / `override_approval_amount` / `run_underwriting`
  - [ ] Special: `lead_status_to_expired` · `lead_status_denied_to_approved` · `lead_status_approved_to_signed`
  - [ ] `customers.view.internal_status` / `documents.view.internal_notes`
  - [ ] Tracking: `uown_login_attempt` registra tentativas
- **Heurísticas:** `[Tour Saboteur]` user sem permission tenta direct URL · `[Galumphing]` direct API call sem permission
- **Oracles:** UI bloqueia botão; API retorna 403; activity log de denial
- **Bug bar:** **user sem permission consegue ação = P0 security**; SSN/DOB exposto = P0 compliance
- **Exit criteria:** matriz completa permission × user exercitada

### AMS-08 — Bulk Associate Users to Merchants (Task #74)
- **Missão:** validar fluxo `/associate-users-to-merchants` (aditivo) vs. card "Edit User Merchants" (overwrite) e comportamento de Log Activity
- **Duração:** 60 min · **Prioridade:** P1
- **Fonte:** [`business-rules §51`](../business-rules/11-administracao.md) (Task #74)
- **Setup:** users com merchants pré-existentes; pool de merchants
- **Áreas:**
  - [ ] `POST /user/addMerchantsToUsers` (bulk) — operação ADITIVA
  - [ ] UI `/associate-users-to-merchants` (tabelas paginadas, modal Bootstrap)
  - [ ] Card "Edit User Merchants" em `/users/[username]` — operação OVERWRITE
  - [ ] Acionar modo edit: `span#EditUserMerchants-edit` removido do DOM ao entrar
  - [ ] React Select `#merchants` em portal (ArrowDown+Enter)
  - [ ] **Comportamento Log Activity:** bulk e edit NÃO geram entry; apenas `PUT /user/{username}` gera "UPDATED user info"
  - [ ] Tabela Log Activity: 4 colunas (date, type, userId, notes) com `react-data-table-component`
  - [ ] Paginação `.rdt_Pagination` é sibling do `.rdt_Table` (nth scoping)
  - [ ] Tabela merchants carrega async após tabela users
- **Heurísticas:** `[Hawthorne]` bulk 2× sem novos merchants · `[Tour Saboteur]` edit pra remover último merchant
- **Oracles:** lista de merchants do user via `GET /user/{username}`; activity log table no UI
- **Riscos focais:** bulk substituindo (lossy) em vez de aditivo; edit gerando log indevido
- **Bug bar:** bulk lossy = P0 data integrity; PUT sem log = P1
- **Exit criteria:** ambos os fluxos auditados com comportamento de log correto

### AMS-09 — Cleanup Endpoints
- **Missão:** validar cleanup de dados antigos com proteção de 3 meses
- **Duração:** 45 min · **Prioridade:** P2
- **Fonte:** [`business-rules §38`](../business-rules/11-administracao.md)
- **Setup:** ambiente non-prod; acesso admin
- **Áreas:**
  - [ ] `DELETE /uown/cleanupLogEntries?to={date}` — remove API logs, correspondence logs, sweep logs, esign events
  - [ ] `DELETE /uown/cleanupFunctionalEntities?to={date}` — dados operacionais
  - [ ] Proteção: data `to` < hoje−3meses obrigatória
  - [ ] Permission check (apenas admin)
  - [ ] Log da operação (count deletado por tabela)
  - [ ] Performance: queries mais rápidas pós-cleanup
- **Heurísticas:** `[Boundary/EC]` data = hoje, hoje−1d, hoje−3m, hoje−3m−1d, hoje−1y
- **Oracles:** tabelas afetadas com `count(*) WHERE created_date > {date}` = 0; logs com count
- **Bug bar:** **data recente deletada = P0 data loss**; sem permission check = P0 security
- **Exit criteria:** boundary 3 meses validado; todas as tabelas alvo confirmadas

---

## §5. Sweeps (Scheduled Jobs)

> Sweeps são jobs agendados que rodam fora do contexto de qualquer portal. Falha é silenciosa e afeta múltiplos portais.
> **Fonte oficial:** [`business-rules §34`](../business-rules/11-administracao.md) — 74 sweeps em 13 categorias.

### Endpoints

```
POST /uown/svc/triggerScheduledTask/{taskName}    — trigger manual genérico
POST /uown/svc/pauseScheduledTask/{taskName}      — pausar
POST /uown/svc/resumeScheduledTask/{taskName}     — retomar
```

Alguns sweeps têm endpoint específico (atalho). Catálogo completo em [`manual-test-cases.md §5`](manual-test-cases.md#5-sweeps).

### Infraestrutura

| Config | Default |
|--------|---------|
| Thread count | 5 |
| Thread size | 50 |
| Fetch size | 500 |
| Quartz Thread Pool | 25 |
| Persistência | Quartz JDBC (`qrtz_*`) |

### Validação universal pós-trigger

1. `SELECT * FROM uown_sweep_logs WHERE sweep_name='{name}' ORDER BY created_date DESC LIMIT 5;`
2. `SELECT * FROM uown_alert WHERE sweep_name='{name}' AND created_date > now() - interval '1 hour';`
3. Tabela específica da categoria (ver charters abaixo)
4. **Activity log na entidade afetada** (Rule #14) — não basta log da sweep

### Inventário de Sweeps (Canônico)

> **Fonte de verdade:** `../svc/src/main/java/com/uownleasing/svc/service/BootstrapService.java` (chamadas `createScheduledTask(...)`) + constantes `SWEEP_NAME` em `service/cc/*.java`. **NÃO inventar nomes nesta tabela.** Extração programática:
> ```bash
> grep -oP 'createScheduledTask\(\s*"\K[^"]+' ../svc/src/main/java/com/uownleasing/svc/service/BootstrapService.java | sort -u
> grep -rnE 'SWEEP_NAME\s*=' ../svc/src/main/java/com/uownleasing/svc/service/cc/
> ```
> Total atual: **~74 sweeps** (71 em Bootstrap + `CCDailyScheduledDeniedRerun`, `IdempotentCCSweep`, `CCVintageRun`).
>
> **Importante:** uma vez que `BootstrapService` use `load.only.new.scheduled.tasks=true` (default), sweeps adicionados ao código após a primeira inicialização do ambiente podem **não** existir em runtime — ver BUG-2026-05-12-008 (ex: `refreshKountAccessTokenSweep` ausente em dev3 apesar de estar no Bootstrap).

#### Sweeps essenciais por categoria

| Categoria | Sweeps | Charter de cobertura |
|-----------|--------|----------------------|
| **Token refresh** | `refreshKountAccessTokenSweep`, `refreshGdsAccessTokenSweep`, `refreshTrustPilotAccessKeySweep` | ORI-01 (token 401 workaround) |
| **Lifecycle programa** | `ProgramActivationDeactivationSweep` | AMS-02 |
| **Lifecycle lease** | `checkLeadExpirationSweep`, `updateContractStatusSweep`, `eSignDocumentStatusSweep`, `getCompletedESignDocumentStatusSweep`, `chargeSigningFeeSweep` | ORI-06, JNY-01 |
| **CC payments (§34.1–34.7)** | `SendCreditCardPaymentsSweep`, `rerunCCPaymentsSweep`, `CCDailyScheduledDeniedRerun`, `delinquencyRerunCCPaymentsSweep`, `dailyDelinquencyRerunCCSweep`, `IdempotentCCSweep`, `CCVintageRun` | SWP-02 |
| **ACH payments (§34.8–34.14)** | `CreateScheduledACHPaymentsSweep`, `SendACHPaymentsSweep`, `getSendACHPaymentsStatusSweep`, `getStatusDatePaymentsListSweep`, `rerunACHPaymentsSweep`, `reverseAchPaymentsSweep`, `processPayWalletPaymentsSweep` | SWP-03 |
| **Fees** | `chargeSigningFeeSweep`, `CreateScheduledCreditCardPaymentsSweep` | SWP-04 |
| **Account status** | `paidOutAccountsSweep`, `paidInFullAccountEmailSweep`, `settledInFullAccountEmailSweep`, `paymentGatewayFixSweep` | SWP-05 |
| **Email/SMS** | `emailSweep`, `FirstPaymentReminderSweep`, `RecurringPaymentReminderSweep`, `customerPortalReminderSweep`, `delinquencyOfferEmailSweep`, `delinquencyReminderEmailSweep`, `latePaymentNoticeEmailSweep` | (a definir SWP-Email) |
| **Stored doc** | `storedDocServiceSweep`, `storedDocSmsServiceSweep` | (a definir) |
| **Bank verification** | `bankVerificationSweep` | (a definir) |
| **Rating** | `removeRatingLetterSweep`, `redistributeDelinquentEpoPoolSweep` | SVC-08 |
| **Tax** | `dailyTaxCloudPaymentsSync`, `dailyTaxCloudRefundsSync`, `updateTaxRatesSweep`, `monthlyTaxReportSweep` | (a definir) |
| **Misc operações** | `monitorSweep`, `checkSignedAndFundingLeaseCountSweep`, `UnutilizedApprovalSweep`, `progetDeviceLockingSweep`, `cancelProtectionPlanSweep`, `kornerstoneDailyImportSweep` | (a definir) |
| **Relatórios externos** ⚠️ NÃO ativar em dev | `generateVerventOnBoardingFileSweep`, `sendLeaseDocsToBankSweep`, `sendDailyPaymentsSharepointSweep`, `sendDailyReportsToBBWheelsSweep`, `dailyFundingReportSharepointSweep`, `danielJewelersLeadReportSweep`, `weeklyFundingReportSweep`, `monthlyFundingReportSweep`, `dailyFundingReportSweep`, `dailyFundedReportSweep`, `dailyRefundReportSweep`, `dailyRefundedReportSweep`, `dailyAgentTransactionReportSweep`, `monthlyConsolidatedFundingReportSweep`, `pastDueEpoPoolAmountReportSweep`, `sendDailyBorrowingBaseReport`, `activeLeaseDailyReport`, `saleFileGenerationSweep`, `generateMerchantLeaseReport`, `generateExportBlacklistReport`, `generateDueDateMovesReport`, `generateDelinquencyReport`, `createSkitDelinquentFileSweep`, `createSkitDelinquentOfferFileSweep`, `rerunACHWeeklyReport` | (read-only catalog — emitem arquivos/relatórios pra vendors externos: Vervent, SharePoint, BB Wheels, etc.) |

> **Estrutura:** 1 charter de admin tooling (SWP-01) + 13 charters por categoria de business-rules §34 (SWP-02 a SWP-14). Cada charter inclui matriz padrão: trigger manual + schedule natural + pré-condição pos/neg + idempotência + activity log + catch-up + failure mode.

### SWP-01 — Sweep Admin & Operations Tooling (API-only)
- **Missão:** validar tooling administrativa via REST API (`SvcSweepsController`). **Não há UI admin de sweeps nos portais** (Origination/Servicing/AMS) — toda operação é via HTTP em `svc-{env}.uownleasing.com/uown/svc/*`. Confirmado em 2026-05-12 (jose, charter SWP-01 dev3).
- **Duração:** 60 min · **Prioridade:** P1
- **Setup:** API key svc (`Authorization` + `x-api-key` do `.env`); DB read-only para oracle queries; sem necessidade de login em portal.
- **Endpoints (svc `SvcSweepsController.java`):**
  ```
  GET  /uown/svc/getAllScheduledTasks                  inventário completo
  GET  /uown/svc/getScheduledTaskByName/{name}         ⚠ filtra is_active=true silenciosamente (ver BUG-004)
  GET  /uown/svc/getAnyScheduledTaskByName/{name}      sem filtro is_active
  POST /uown/svc/triggerScheduledTask/{taskName}       trigger manual
  POST /uown/svc/pauseScheduledTask/{taskName}         pause
  POST /uown/svc/resumeScheduledTask/{taskName}        resume
  POST /uown/svc/rescheduleScheduledTask/{taskName}?cronTrigger=...
  POST /uown/svc/deleteScheduledTask/{taskName}        delete
  POST /uown/svc/createOrUpdateScheduledTask           body=ScheduledTask JSON
  ```
- **Áreas:**
  - [ ] `getAllScheduledTasks` retorna ~74 sweeps (cruzar com `BootstrapService.java`)
  - [ ] `getScheduledTaskByName/{active-name}` → 200 com body completo
  - [ ] `getScheduledTaskByName/{paused-name}` → 200 com body **vazio** (ambíguo — ver BUG-004)
  - [ ] `getScheduledTaskByName/{inexistente}` → 200 com body vazio (mesmo da paused!)
  - [ ] `getAnyScheduledTaskByName/{paused-name}` → 200 com body completo (bypassa filtro)
  - [ ] `pauseScheduledTask` → `is_active=false` no DB + Quartz `pauseJob` (`qrtz_triggers.trigger_state='PAUSED'`)
  - [ ] `resumeScheduledTask` → `is_active=true` + Quartz `resumeJob`. **Retorna body `false` se task não existe** no DB (ver BUG-008)
  - [ ] `triggerScheduledTask` executa imediato; `last_trigger_time` atualizado; `uown_scheduled_task_run` ganha entry
  - [ ] **Idempotência:** trigger 2× consecutivos → DUAS execuções (verificar se há overlap de processamento via `uown_sweep_logs`). Bug-bar dependendo da sweep.
- **Heurísticas:**
  - `[Tour Saboteur]` pausar sweep crítico → **NÃO HÁ UI de alerta**; checar se há notificação (Slack, email ops, dashboard externo). Ausência = gap ops.
  - `[Hawthorne]` trigger 2× rápido — comparar `_run` table entries
  - `[Galumphing]` chamar com nome inexistente vs paused — mesma resposta (200 empty) = ambiguidade da API
  - `[Cross-source]` comparar `getAllScheduledTasks` (runtime) vs `BootstrapService.createScheduledTask(...)` (código) — sweeps no código mas ausentes em runtime
- **Oracles (todos DB-side, sem UI):**
  - `SELECT scheduled_task_name, is_active, last_trigger_time, row_updated_timestamp FROM uown_scheduled_task WHERE scheduled_task_name=:name`
  - `SELECT trigger_state, next_fire_time FROM qrtz_triggers WHERE trigger_name=:name`
  - `SELECT sched_name, instance_name, last_checkin_time FROM qrtz_scheduler_state` (Quartz vivo?)
  - `SELECT * FROM uown_scheduled_task_run WHERE scheduled_task_pk=… ORDER BY ts DESC LIMIT 5`
  - `SELECT * FROM uown_sweep_logs WHERE sweep_name=:name ORDER BY created_date DESC LIMIT 10`
- **Riscos focais:**
  - **Sem alerta visual de sweep paused** — risco principal em prod
  - Sweeps em código mas ausentes no DB runtime (BUG-008)
  - `getScheduledTaskByName` 200/empty ambíguo entre 3 cenários (active+null, paused, inexistente) — BUG-004
  - Trigger 2× concorrente para sweeps de payment = risco financeiro
- **Bug bar:**
  - Sweep no código mas ausente em runtime = P1 ops
  - `getScheduledTaskByName` 200 empty conflando 3 cenários = P0 API UX
  - Trigger 2× gera 2 execuções concorrentes de SQL crítico = P0 financial risk (CC/ACH sweeps)
- **Cross-charter:** achados ligam aos charters por categoria (SWP-02 a SWP-14).
- **Exit criteria:** 3 verbos (pause/resume/trigger) testados em ≥3 sweeps diferentes; inventário runtime cruzado com Bootstrap; ambiguidades 200/empty documentadas com curl reproducível.

### SWP-02 — CC Payment Sweeps Matrix (§34.1–34.7)
- **Missão:** validar 7 sweeps de pagamento CC (SendCreditCardPaymentsSweep, rerunCCPaymentsSweep, CCDailyScheduledDeniedRerun, delinquencyRerunCCPaymentsSweep, dailyDelinquencyRerunCCSweep, IdempotentCCSweep, CCVintageRun)
- **Duração:** 90 min · **Prioridade:** P0
- **Setup:** pool de contas: CC auto-pay due hoje + DENIED recente + TIMEOUT + delinquente
- **Áreas:**
  - [ ] `sendCCPaymentsSweep` processa receivables hoje
  - [ ] `rerunCCPaymentsSweep` retry com `numberOfTries>1`
  - [ ] `CCDailyScheduledDeniedRerun` rerun DENIED (excluindo erros permanentes)
  - [ ] `delinquencyRerunCCPaymentsSweep` tenta cobrar past due
  - [ ] `IdempotentCCSweep` resolve TIMEOUT sem double-charge
  - [ ] `CCVintageRun` on-demand (start/end date)
  - [ ] NSF fee criado em falhas
  - [ ] Activity log por conta afetada
  - [ ] Idempotência: 2× sem nova pré-condição → 0 transações duplicadas
- **Heurísticas:** `[Tour Money]` cada path · `[Hawthorne]` 2× · `[Galumphing]` TIMEOUT manual via mock
- **Oracles:** `uown_sv_cctransaction` com status correto; gateway log com `charge_id` único
- **Bug bar:** double charge = P0 financeiro; PAN em log = P0 security
- **Exit criteria:** 7 sweeps disparados; idempotência confirmada

### SWP-03 — ACH Payment Sweeps Matrix (§34.8–34.14)
- **Missão:** validar 7 sweeps ACH (CreateScheduledACH, SendACH, getSendACHPaymentsStatus, getStatusDatePaymentsList, rerunACH, reverseAch, processPayWalletPayments)
- **Duração:** 90 min · **Prioridade:** P0
- **Setup:** contas com ACH auto-pay + 1 com NSF; arquivo XLSX PayWallet no SFTP `/pw/`
- **Áreas:**
  - [ ] `createScheduledACHPaymentsSweep` cria `uown_sv_achpayment` SCHEDULED
  - [ ] `sendACHPaymentsSweep` envia pra Profituity (status SENT)
  - [ ] `getSendACHPaymentsStatusSweep` consulta APPROVED/DENIED/NSF
  - [ ] `rerunACHPaymentsSweep` rerun em falhas
  - [ ] `reverseAchPaymentsSweep` reverte com alocações desfeitas
  - [ ] `processPayWalletPaymentsSweep` lê XLSX → move arquivo
  - [ ] Activity log + idempotência
- **Heurísticas:** `[Tour Money]` · `[Tour Saboteur]` arquivo PayWallet duplicado no SFTP
- **Oracles:** `uown_sv_achpayment`; SFTP files movidos
- **Bug bar:** ACH duplicado = P0; PayWallet processado 2× = P0
- **Exit criteria:** ciclo ACH completo + reverse + PayWallet

### SWP-04 — Fee Sweeps (§34.15–34.16)
- **Missão:** validar `chargeSigningFeeSweep` + `createScheduledCreditCardPaymentsSweep`
- **Duração:** 45 min · **Prioridade:** P1
- **Setup:** leads com signing fee pendente; contas CC auto-pay due hoje
- **Áreas:**
  - [ ] Signing fees processadas
  - [ ] CC payments agendados criados
  - [ ] Idempotência (cron a cada 2min — risco de overlap)
  - [ ] Activity log
- **Bug bar:** double charge signing fee = P0 financeiro
- **Exit criteria:** ambos disparados + idempotência

### SWP-05 — Account Status Sweeps (§34.17–34.20)
- **Missão:** validar 4 sweeps de status (paidOutAccounts, checkLeadExpiration, updateContractStatus, removeRatingLetter)
- **Duração:** 60 min · **Prioridade:** P0
- **Setup:** conta zerada elegível PAID_OUT; lead UW_APPROVED expirado; lead SIGNED não funded; conta antiga rating
- **Áreas:**
  - [ ] `paidOutAccountsSweep` → status PAID_OUT
  - [ ] `checkLeadExpirationSweep` → lead EXPIRED
  - [ ] `updateContractStatusSweep` reflete mudanças de account
  - [ ] `removeRatingLetterSweep` arquiva rating antiga
  - [ ] Activity log em cada transição
  - [ ] Idempotência
- **Bug bar:** PAID_OUT com balance ≠ 0 = P0; EXPIRED em lead válido = P0
- **Exit criteria:** 4 transições auditadas

### SWP-06 — Email / SMS Sweeps Matrix (§34.21–34.30)
- **Missão:** validar 10 sweeps de email/SMS (emailSweep, FirstPaymentReminder, RecurringPaymentReminder, delinquencyOffer, delinquencyReminder, latePaymentNotice, UnutilizedApproval, customerPortalReminder, paidInFull, settledInFull)
- **Duração:** 90 min · **Prioridade:** P0
- **Setup:** customer inboxes via IMAP; pool de contas variadas
- **Áreas:**
  - [ ] Cada um dos 10 sweeps dispara email correto
  - [ ] Placeholders resolvidos + brand correto (UOWN vs Kornerstone)
  - [ ] Idempotência (sem email duplicado)
  - [ ] Activity log de envio
  - [ ] Cross-link com TC-WEB-008
- **Heurísticas:** `[Tour Landmark]` brand check · `[Hawthorne]` rodar 2×
- **Bug bar:** placeholder literal = P0; email duplicado = P1; sem activity log = P0 Rule #14
- **Exit criteria:** 10 emails entregues + brand auditado

### SWP-07 — Document / E-Sign Sweeps (§34.31–34.35)
- **Missão:** validar 5 sweeps (storedDocService, storedDocSmsService, eSignDocumentStatus, getCompletedESignDocumentStatus, sendLeaseDocsToBank)
- **Duração:** 60 min · **Prioridade:** P0
- **Setup:** docs em queue; contrato SignWell SENT; lease SIGNED pronto pra banco
- **Áreas:**
  - [ ] `storedDocServiceSweep` armazena docs (status STORED)
  - [ ] `storedDocSmsServiceSweep` envia SMS com link
  - [ ] `eSignDocumentStatusSweep` sync com SignWell/PandaDoc
  - [ ] `getCompletedESignDocumentStatusSweep` reconhece completed
  - [ ] `sendLeaseDocsToBankSweep` envia via SFTP/email (parâmetros `sendToBank` e `sendToVervent`)
  - [ ] Status `uown_sv_contract` coerente
- **Bug bar:** lease SIGNED externo mas DB SENT após sweep = P0 desync
- **Exit criteria:** sync bilateral SignWell ↔ DB confirmado

### SWP-08 — Tax Sweeps — TaxCloud (§34.36–34.39)
- **Missão:** validar 4 sweeps de impostos (dailyTaxCloudPaymentsSync, dailyTaxCloudRefundsSync, updateTaxRates, monthlyTaxReport)
- **Duração:** 60 min · **Prioridade:** P1
- **Setup:** pagamentos do dia em contas com tax; refunds recentes; TaxCloud reachable (ou mock)
- **Áreas:**
  - [ ] Payments sync (10 threads)
  - [ ] Refunds sync (5 threads)
  - [ ] Update rates (último dia do mês)
  - [ ] Monthly report (dia 1)
  - [ ] Idempotência (sem double submission)
- **Bug bar:** double submission TaxCloud = P1 compliance; rates não atualizadas = P0
- **Exit criteria:** ciclo completo + idempotência

### SWP-09 — Protection Plan Sweep (§34.40)
- **Missão:** validar `cancelProtectionPlanSweep` lendo CSV da Buddy Insurance
- **Duração:** 45 min · **Prioridade:** P1
- **Setup:** CSV no SFTP `buddy/cancellations/`
- **Áreas:**
  - [ ] Trigger genérico OU com nome de arquivo específico
  - [ ] `uown_sv_protection_plan` + `uown_los_protection_plan` → CANCELLED
  - [ ] Email/notification ao customer
  - [ ] Activity log
- **Bug bar:** plan cancelado sem log = P0 compliance; cobrança contínua após cancel = P0 financeiro
- **Exit criteria:** cancelamentos refletem em ambas as tabelas

### SWP-10 — Delinquency / Collections Sweeps (§34.41–34.45)
- **Missão:** validar 5 sweeps (createSkitDelinquentFile, createSkitDelinquentOfferFile, redistributeDelinquentEpoPool, pastDueEpoPoolAmountReport, progetDeviceLocking)
- **Duração:** 75 min · **Prioridade:** P0
- **Setup:** contas delinquentes variadas; SFTP Skit.ai; Proget (IoT/GPS)
- **Áreas:**
  - [ ] Skit.ai files gerados com contas corretas
  - [ ] EPO pool rebalanceado
  - [ ] Devices bloqueados em Proget
  - [ ] Sem leak de não-delinquentes nos arquivos
  - [ ] Activity log
- **Bug bar:** customer não-delinquente em arquivo Skit = **P0 leak**; device de conta paga ainda bloqueado = P0
- **Exit criteria:** arquivos auditados; lock/unlock testado

### SWP-11 — Financial Reports Sweeps (§34.46–34.59)
- **Missão:** smoke test de 14 sweeps de reports financeiros (funding daily/weekly/monthly, refund, agent transaction, borrowing base, active lease, ACH rerun, delinquency, due date moves, blacklist export, merchant lease)
- **Duração:** 90 min · **Prioridade:** P1
- **Setup:** ambiente com volume (qa1/stg); SharePoint; inbox para reports
- **Áreas:**
  - [ ] Cada um dos 14 sweeps completa sem erro
  - [ ] Report entregue (email/SharePoint)
  - [ ] Cross-check com query direta (funding report vs `uown_funding_batch`)
  - [ ] Idempotência (daily não duplica)
  - [ ] Blacklist export contém entries atuais
- **Bug bar:** diff > 1% em revenue report = P1; report duplicado em prod = P2 ops
- **Exit criteria:** todos os reports gerados; consistência cross-check

### SWP-12 — Partner Reports Sweeps (§34.60–34.62)
- **Missão:** validar 3 sweeps (sendDailyReportsToBBWheels, danielJewelersLeadReport, saleFileGeneration)
- **Duração:** 45 min · **Prioridade:** P1
- **Setup:** dados de transação por merchant; destinatários configurados
- **Áreas:**
  - [ ] Cada report entregue ao partner correto
  - [ ] Sem cross-merchant leak (Daniel Jewelers ≠ BB Wheels data)
  - [ ] Sale files gerados corretamente
- **Bug bar:** cross-merchant leak = **P0 security**
- **Exit criteria:** escopo por partner auditado

### SWP-13 — External Integrations Sweeps (§34.63–34.65)
- **Missão:** validar 3 sweeps (generateVerventOnBoardingFile, kornerstoneDailyImport, refreshTrustPilotAccessKey)
- **Duração:** 60 min · **Prioridade:** P1
- **Setup:** dados pra onboarding Vervent; sistema legado Kornerstone com dados pra import; TrustPilot API
- **Áreas:**
  - [ ] Vervent onboarding file gerado
  - [ ] Kornerstone import cria accounts (`company=KORNERSTONE`)
  - [ ] TrustPilot token renovado
  - [ ] Idempotência (sem import duplicado)
  - [ ] Activity log nas contas Kornerstone importadas
- **Bug bar:** import duplicado = P0 data integrity; token não renovado = P1 (TrustPilot broken)
- **Exit criteria:** 3 integrações exercitadas

### SWP-14 — Monitoring Sweeps (§34.66–34.69)
- **Missão:** validar 4 sweeps (monitorSweep, paymentGatewayFix, checkSignedAndFundingLeaseCount, bankVerification)
- **Duração:** 45 min · **Prioridade:** P1
- **Setup:** sistema rodando; gateway com desync simulado
- **Áreas:**
  - [ ] Health check + métricas
  - [ ] Gateway desync corrigido
  - [ ] Compliance count (signed + funding)
  - [ ] Bank accounts inválidos flagged
  - [ ] Alertas operacionais em problemas
- **Bug bar:** problemas não alertados em prod = P0 ops
- **Exit criteria:** 4 sweeps de monitoring exercitados

---

## §6. Journeys (Cross-Portal)

### JNY-01 — Lease Lifecycle Happy Path (E2E)
- **Missão:** percorrer ciclo completo aprovação → contrato → conta → pagamentos → paid out
- **Duração:** 90 min · **Prioridade:** P0
- **Setup:** merchant ativo + SSN APPROVED + email único + CC válido
- **Áreas:**
  - [ ] Origination (apply/sign)
  - [ ] Customer (OTP/sign)
  - [ ] Servicing (account → payments)
  - [ ] Customer (receipts)
  - [ ] Settled
- **Oracles:** activity log contínuo entre portais; `company` coerente; emails consistentes
- **Bug bar:** dado divergente entre portais = P0
- **Exit criteria:** lifecycle completo executado; cross-portal consistency auditada

### JNY-02 — Recovery Path (Delinquency → Settlement)
- **Missão:** conta vira delinquente, recebe offers, aceita settlement, fecha
- **Duração:** 90 min · **Prioridade:** P0
- **Setup:** conta provisionada delinquente (fast-forward de datas em non-prod)
- **Áreas:**
  - [ ] NSF reruns
  - [ ] Delinquency offers
  - [ ] Settlement creation
  - [ ] Customer acceptance via Website
  - [ ] Close
- **Oracles:** rating evolution S→A→B→C…; emails enviados; settlement em activity log
- **Bug bar:** offer não enviado / não visível = P0
- **Exit criteria:** recovery E2E executado; cada etapa logada

### JNY-03 — Risk Path (Denials + Second Look Retry)
- **Missão:** denial 13m → preview 16m → resubmit com banking → approval 16m
- **Duração:** 60 min · **Prioridade:** P1
- **Setup:** SSN 100000053 + merchant TireAgent CA (apenas stg validado)
- **Áreas:**
  - [ ] First submit (deny 13m + preview 16m)
  - [ ] Second submit (banking)
  - [ ] Approval 16m
  - [ ] Contract Kornerstone-style
- **Oracles:** denial reason claro; preview correto; approval logado
- **Bug bar:** Second Look path quebrado = P0
- **Exit criteria:** Second Look retry executado; brand Kornerstone auditado

### JNY-04 — Cross-Portal Data Consistency Audit
- **Missão:** mudar dados em um portal, verificar refletir nos outros
- **Duração:** 60 min · **Prioridade:** P1
- **Setup:** conta ACTIVE + customer Website + agent Servicing + admin AMS
- **Áreas:**
  - [ ] Phone update Website → Servicing
  - [ ] Merchant edit AMS → Origination
  - [ ] Program toggle AMS → applicant eligibility
- **Oracles:** mudança propagada em < 2min; activity log em cada portal afetado
- **Bug bar:** dado divergente após 5min = P0 data integrity
- **Exit criteria:** 3 propagações testadas; tempo de eventual consistency medido

---

## Open Items (em discussão)

> Itens **propostos mas não confirmados** pelo time. Não estão na contagem total da matriz até receberem `[CONFIRMADO]`.

| # | Item | Origem | Status |
|---|------|--------|--------|
| OPEN-01 | **SVC-11 — Account Status Lifecycle & Transitions** (P0, 90 min): matriz completa de status (ACTIVE/DELINQUENT/PAUSED/SETTLED_IN_FULL/PAID_OUT/CHARGED_OFF/REPO/CLOSED/RE_AGED), transições manuais vs. automáticas, status irreversíveis | Pergunta do user 2026-05-12 sobre "alteração de todos os status" | Aguardando confirmação |
| OPEN-02 | **Expansão SVC-02** para incluir pagamento ad-hoc / one-time CC e ACH (fora de arrangement) | Mesma pergunta | Aguardando confirmação |
| OPEN-03 | **Expansão SVC-06** com Add CC permanente (fonte persistida), múltiplos CCs, default source toggle | Mesma pergunta | Aguardando confirmação |
| OPEN-04 | **Expansão SVC-07** com primary applicant edit (vs. contact), Trustpilot invite, PayNearMe link | Mesma pergunta | Aguardando confirmação |
| OPEN-05 | **Expansão SVC-08** com rating letter manual regen/override em Servicing Information | Mesma pergunta | Aguardando confirmação |
| OPEN-06 | **Regra global:** TODO charter de Servicing/Origination/AMS exige validação explícita do Activity Log no UI (não só DB) — adicionar como pré-requisito global | Mesma pergunta | Aguardando confirmação |
| OPEN-07 | **SWP-02 split:** ✅ RESOLVIDO em v0.4 — matriz dividida em SWP-02..SWP-14 (13 charters por categoria de §34) | Resolvido | Fechado |
| OPEN-08 | **Sweeps órfãs:** ✅ RESOLVIDO em v0.4 — todos os 74 sweeps oficiais do §34 cobertos em SWP-02..SWP-14 | Resolvido | Fechado |

---

## Matriz de Cobertura

| Portal | Charters | P0 | P1 | P2 | Duração total |
|--------|----------|----|----|----|---------------|
| Origination | 11 | 7 | 4 | 0 | 855 min (14.25h) |
| Servicing | 10 | 4 | 6 | 0 | 690 min (11.5h) |
| Customer (Website) | 6 | 3 | 3 | 0 | 345 min (5.75h) |
| AMS | 9 | 3 | 4 | 2 | 600 min (10h) |
| Sweeps | 14 | 5 | 9 | 0 | 855 min (14.25h) |
| Journeys (cross-portal) | 4 | 3 | 1 | 0 | 300 min (5h) |
| **TOTAL (confirmado)** | **54** | **25** | **27** | **2** | **~61h** |
| Open Items pendentes | ~5 | ~2 | ~3 | 0 | ~5h (estimado) |

**Sugestão de cadência:**
- **Release regression:** todos os P0 (25 charters · ~30h) — 2 testers × 1 semana
- **Quinzenal:** P0 + metade dos P1
- **Mensal:** plano completo

---

## Bug Reporting Template

```
ID:                    BUG-{YYYY-MM-DD}-{seq}
Charter:               {ID do charter onde apareceu}
Classificação:         [OBSERVAÇÃO] | [HIPÓTESE] | [CONFIRMADO]
Reprodução em fresh:   SIM/NÃO  (se NÃO → ainda HIPÓTESE)
Severidade:            P0 | P1 | P2 | P3
Portal:                Origination | Servicing | Website | AMS | Sweeps | Cross
Ambiente:              sandbox | qa1 | qa2 | stg | dev*
Steps:                 1. ...
Resultado esperado:
Resultado real:
Activity log esperado: (presente? conteúdo bate?)
Evidência:             screenshots, DOM snapshot (MCP), trace, query SQL
```

Ver [`.claude/context/shared/bug-classification-rules.md`](../../.claude/context/shared/bug-classification-rules.md) para guidance completo.

---

## Manutenção & Changelog

**Owner do plano:** QA lead (revisão mensal)
**Versionamento:** este arquivo no git; sessões em `docs/test-plans/sessions/`
**Sincronia com automação:** charters com cobertura E2E automatizada devem linkar o `tests/e2e/...spec.ts` correspondente

### Quando atualizar
- Novo pitfall descoberto
- Feature shippada
- Charter ficou redundante
- Ambiente novo adicionado
- Open Item promovido a charter

### Changelog

| Versão | Data | Mudança |
|--------|------|---------|
| 0.1 | 2026-05-12 | Versão inicial com 31 charters (4 portais + journeys) |
| 0.2 | 2026-05-12 | + SVC-09 (Refund) + SVC-10 (Arrangement Lifecycle) · matriz: 33 charters |
| 0.2.1 | 2026-05-12 | + ORI-08 (Program Groups + State Config) + ORI-09 (Funding) · expansões ORI-05, ORI-07, AMS-02 com UI activity log · matriz: 35 charters |
| 0.3 | 2026-05-12 | **Refactor de UX:** TOC, Quick Start, Glossário de heurísticas, Charter Index, checklists `[ ]`, Exit criteria, Open Items, changelog. **Sweeps movidos para seção própria** (§5) com SWP-01/SWP-02 (substituindo AMS-04 antigo). AMS renumerado. Matriz: 36 charters. |
| **0.4** | **2026-05-12** | **Cobertura completa baseada em [`business-rules/11-administracao.md`](../business-rules/11-administracao.md) (§30, §31, §32, §34, §38, §46, §49, §50, §51).** Sweeps reestruturados: SWP-02 matriz genérica → **13 charters por categoria** (SWP-02..SWP-14) cobrindo os **74 sweeps oficiais** do §34. Novos charters: **ORI-10** (Item Split §31), **ORI-11** (Second Opportunity §32), **AMS-06** (Blacklist CC BIN §30), **AMS-07** (Permissões granulares §49), **AMS-08** (Bulk merchants Task #74 §51), **AMS-09** (Cleanup endpoints §38). Mapa de risco expandido com 13 hotspots novos (cross-merchant leak, double processing por sweep category, etc.). Matriz: **54 charters** (era 36) · 25 P0 · ~61h. |
| **0.4.1** | **2026-05-12** | **Correções pós-execução exploratória dev3:** (a) §5 inventário de sweeps reescrito com lista canônica do `BootstrapService.java` (eram 14 nomes fictícios; agora 74 reais categorizados); (b) SWP-01 explicitamente marcado como **API-only** — não existe UI admin de sweeps em nenhum portal (confirmado em dev3 sessão SWP-01-jose); charter agora documenta endpoints REST do `SvcSweepsController.java` e oracles 100% DB-side. Sem mudança de matriz. |

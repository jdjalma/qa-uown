# SPEC — Send Vendor Webhook Callback After Scheduled Future Payment Is Processed (WI-514)

## Status (2026-05-20 — revisão de Djalma aplicada)

- **Revisão 2026-05-20 — correções de Djalma aplicadas** (3 overrides do usuário):
  1. Env primário = **qa1** (não qa2). Outage DV360 de 2026-05-18 afetou Origination/`sendApplication`, esta feature é Servicing payment — provavelmente não impactada. Mitigation se setup-via-API for necessário: lead pré-existente ou aguardar resolução.
  2. Synopsis é **LITERAL** — webhook dispara quando scheduled payment é **PROCESSADO** na data agendada, não na criação. Dev "Testing Steps" (immediate `PAID`) são smoke do dev, não o cenário real. Q-B1 RESOLVIDO. CT-12 promovido a P0 (renomeado CT-01); cenários de criação imediata viram negativos / regressão (confirmar que webhook NÃO dispara na criação).
  3. **NÃO** é API-only. Feature é **UI-first via Servicing portal** — agent humano agenda payment via UI; API só como setup acelerado / regressão. Reescrita Test Strategy.
- Phase A (scope + universe): drafted from issue body + dev "Testing Steps" — re-scoped after correction 2
- Phase B (AC reconstructed implicitly): no explicit AC in the work item — see Section "AC Coverage" (re-mapped)
- Phase C (scenarios): re-prioritized; CT-01 (scheduled-future-processed) é P0 principal
- Phase D (open questions): novo blocker Q-B1-NEW (mecanismo de processamento de scheduled payments); Q-B6 (FAILED event); Q-B1 antigo resolvido
- Env: **qa1** (primary), stg (DoD)
- Ready for: qa-implementer (after blockers Q-B1-NEW, Q-B2..Q-B5, Q-B6 are resolved)

---

## Source

- GitLab: <https://gitlab.com/uown/backend/svc/-/work_items/514>
- Title: `UOWN | SVC | Send Vendor Webhook Callback After Scheduled Future Payment Is Processed`
- Author: Yuri Araujo (`yuriaraujo.gow`)
- Dev assignee: Marcus Braga
- Labels: `dev::backend`, `priority::high`, `type::development`, `workflow::ready-for-qa`
- Milestone: `Uown | RU05.26.1.52.0` (due 2026-05-26)
- Today: 2026-05-20

### One-line problem statement

After a payment is CREATED or REVERSED by a configured AI agent (e.g. `atlog-ai`, `level-ai`), `svc` must POST a JSON callback to a per-agent webhook URL, persist the outbound call in `uown_sv_outbound_api_log` (via `SvOutboundCall`), and trigger the dispatch **asynchronously after DB commit**. Agents not in the allow-list must NOT generate any callback.

### One-line scope statement

Servicing-portal-driven feature with vendor webhook side-effect. The **agent humano** schedules a future-dated payment via the **Servicing portal UI** against a funded account; when the SVC scheduled-payment processing job picks it up on its `paymentDate`, the SVC posts a JSON callback to a per-agent webhook URL, persists the outbound call in `uown_sv_outbound_api_log` (via `SvOutboundCall`), and dispatches **asynchronously after DB commit**. The vendor consumer is a third-party AI agent webhook (e.g. `atlog-ai`, `level-ai`). **UI-first applies (regra #15)** — the canonical user flow is via Servicing portal; API endpoints (`POST /uown/svc/makePayment`, `POST /uown/svc/reversePayment`) are used only for (a) setup acceleration / regression mass, (b) negative cross-checks (e.g. confirming webhook does NOT fire on immediate-PAID creation). Memory: [[feedback_payment_ui_first_servicing]] — pagamento (criar/agendar/processar/reverter) tem UI no Servicing.

---

## Source-derived clarifications

### Finding #1 — [RESOLVIDO 2026-05-20 por Djalma] Synopsis é LITERAL

**Resolução (2026-05-20 — Djalma):** O synopsis é **LITERAL**. O webhook dispara quando um scheduled payment com `paymentDate` futura é **processado** pelo SVC na data agendada — NÃO no momento da criação. Yuri/Djalma confirmaram.

**Reclassificação dos 3 "Testing Steps" do Marcus.** Os 3 cenários do dev usam `paymentDate = today` (immediate `PAID`) e capturam o webhook firing imediatamente. **Isso é smoke do dev / atalho de implementação**, não o cenário real da feature. Eles são úteis como **regressão negativa** (confirmar que webhook NÃO dispara na criação de um payment immediate via API) e como **setup acelerado** para massa, mas não substituem o cenário principal.

**Implicação para testing.**

- **Cenário principal (CT-01, novo P0)**: agendar payment via Servicing UI com `paymentDate = today + N`, aguardar / provocar o processamento, validar que webhook dispara **APENAS** após processamento (não na criação). Triplo oráculo: (a) DB row em `uown_sv_outbound_api_log`, (b) request em `webhook.site` inbox, (c) activity log em `uown_los_lead_notes`.
- **Cenário negativo (CT-NEG-CREATE)**: criar payment immediate (`paymentDate = today`, processado synchronously) via API — observar se webhook dispara (esperado: sim, na mesma transação de processamento, mas NÃO em "creation event" separado) ou não. Documenta o comportamento real para baseline.
- **Novo blocker Q-B1-NEW**: precisamos identificar o **mecanismo de processamento** de scheduled payments (job/sweep/cron) e se há endpoint admin para forçar o processo em qa1 sem aguardar a data real. Sem esse mecanismo, CT-01 fica preso a aguardar tempo de relógio real → impeditivo para CI.

### Finding #2 — Async dispatch after DB commit

Source: dev description states *"Webhook is async (after DB commit)"*. This implies:

- `makePayment` HTTP response returns BEFORE the webhook is dispatched (the agent caller does not wait for vendor latency).
- A polling assertion is required to validate `uown_sv_outbound_api_log` (back-off + timeout — see [[db-polling-pattern]]).
- A failed vendor (timeout, 5xx, DNS error) must not block the payment creation. **Graceful degradation behavior is undocumented** → Q-B3.

### Finding #3 — `SvOutboundCall` is the audit primitive

Source: dev description names `SvOutboundCall` writing to `uown_sv_outbound_api_log`. This is the **canonical audit row** for any outbound HTTP from `svc`. Every webhook attempt — success OR failure — must produce a row. Absence of a row = bug (regra inviolável #14, [[activity-log-validation]]). Content to assert:

- `payment_pk` (must match the payment created/reversed in the same test)
- `event_type` ∈ {`CREATED`, `REVERSED`}
- Outbound URL (`target_url` or equivalent column — to be confirmed via schema, Q-I1)
- Response status / latency / retry count if columns exist

### Finding #4 — Activity log on `uown_los_lead_notes` is INDIRECT here

Payment is a `svc` action against `uown_sv_account.pk`, not against `uown_los_lead.pk` directly. The activity log canonical for payments lives on:

- `uown_los_lead_notes` (LOS side, friendly note) — only if the dev added a note insert in this code path
- `uown_sv_outbound_api_log` (SVC side, audit primitive) — **this is the contract for this feature**

For payments triggered by AI agents (not human agents), there may be NO `uown_los_lead_notes` row by design. Q-I2: does the dev want a `uown_los_lead_notes` entry like `[VendorWebhook][atlog-ai] CREATED dispatched` for cross-channel audit? Defaulting to NO unless Yuri confirms.

**Reclassificação após correção 2026-05-20.** Como o cenário principal agora é UI-first via Servicing portal (human agent agendando), o activity log em `uown_los_lead_notes` é ESPERADO (account-level note de payment scheduled + payment processed). Regra #14 ([[activity-log-validation]]): cada step de business action no portal precisa de log correspondente. Validação dupla obrigatória: (a) `uown_sv_outbound_api_log` (audit primitive SVC, dispatch do webhook), (b) `uown_los_lead_notes` (account note de payment scheduled e payment processed).

---

## Scope Analysis

### IN scope (will test)

| # | Item | Why |
|---|------|-----|
| 1 | **[P0 principal]** Schedule payment via Servicing UI → wait for processing → webhook dispatched | Cenário literal do synopsis. UI-first (rule #15). Gatilho real da feature. |
| 2 | UI affordance discovery — locate "Schedule Payment" / "Add Future Payment" no Servicing portal | Pre-requisite for #1; DOM investigation [[dom-investigation]] required |
| 3 | Activity log `uown_los_lead_notes` on payment-scheduled + payment-processed (account-level note) | Regra #14 — UI action requires log |
| 4 | Per-vendor URL isolation: scheduled payment by `level-ai` lands in level-ai inbox, NOT in atlog-ai's | Multi-vendor routing must be proven |
| 5 | Negative: agent NOT in allow-list (`manual-qa-user`) schedules + processes → no webhook | Silent no-op proof |
| 6 | Negative: immediate payment (`paymentDate = today`) via API creates payment → does webhook fire on creation? | Confirms synopsis is literal — webhook fires only on processing event |
| 7 | Reverse of processed payment → REVERSED webhook | Second event type |
| 8 | Payload schema completeness | All fields present, types correct, `name` format, `amount` decimal |
| 9 | Audit row in `uown_sv_outbound_api_log` per event | Regra #14 |
| 10 | Negative: `agentUsername` null / missing on scheduling | Edge case (Q-B5) |
| 11 | Reverse of payment NOT created by configured agent | Q-B2 |
| 12 | Graceful degradation: webhook URL down at processing time | Q-B3 |
| 13 | Idempotency / retry behavior on failed dispatch | Q-B4 |
| 14 | FAILED processing (insufficient funds / declined) — does webhook fire? Q-B6 | New |

### OUT of scope (registered, not tested now)

| # | Item | Why |
|---|------|-----|
| OUT-1 | Origination / Website / AMS portals | Feature is Servicing-only (post-FUNDED account) — Origination/Website/AMS don't surface payment scheduling |
| OUT-2 | Vendor consumer-side behavior (atlog-ai inbox processing) | We control only `svc` outbound; vendor inbox is third-party black box. We assert delivery via `webhook.site` (controlled test inbox) |
| OUT-3 | Performance / throughput (1000 payments / minute) | Not in the work item synopsis; feature is correctness-driven |
| OUT-4 | Auth header / TLS on outbound call | Not specified by dev; payload-only validation in this SPEC. If `Authorization: Bearer ...` is required by vendor it would be in a separate config — Q-I3 |
| OUT-5 | Webhook called from non-AI agent username (human agent, e.g. `qauown`) | Covered by CT-NEG-NOTIN-LIST |
| OUT-6 | Dual-brand (UOWN vs Kornerstone) variations | Payment is a `svc` operation; brand is irrelevant for the webhook (no brand-specific URL config visible). Confirmed OK to omit unless Yuri says otherwise — Q-I4 |

---

## Hunting list (non-obvious requirements check)

| Dimension | Status | Notes |
|---|---|---|
| Brands / portals | OUT (Q-I4) | No brand-specific config visible. To be confirmed |
| Merchant config | N/A | Feature is post-FUNDED (account exists) — merchant preflight not relevant for the webhook itself, but IS required to create the lease/account that hosts the payment. `skipMerchantPreflight: true` on the underlying lease setup if reusing existing account |
| Lease state preconditions | `ACTIVE` (post-FUNDED) | Payment can only be made against an active servicing account. Setup must drive lead to FUNDED |
| Locale / state matrix | N/A | Webhook payload is JSON, locale-agnostic |
| Vendor integrations touched | Outbound: vendor webhook (atlog-ai, level-ai) | Stub via `webhook.site` for assertions |
| Activity log expected | `uown_sv_outbound_api_log` (mandatory) + `uown_los_lead_notes` (TBD Q-I2) | Regra #14 |
| Money handling | Yes — `amount` field | Use `toBeCloseTo` per [[payment-flows]] §7; do not use strict equality |
| Feature flags / SQL config | YES — 3 configs in `uown_sv_sql_config` | `payment.agent.webhook.notify.usernames`, `payment.agent.webhook.url.atlog-ai`, `payment.agent.webhook.url.level-ai`. Drift check is mandatory before run |
| Async timing | YES — webhook after DB commit | Use `waitForRecord` with back-off (10–30s timeout) |
| Idempotency | TBD Q-B4 | If retry policy exists, asserting "exactly 1" might fail under transient vendor 5xx |
| Auth on outbound HTTP | TBD Q-I3 | Header inspection on `webhook.site` inbox |

---

## AC Coverage (reconstructed — no explicit AC in the issue)

The work item has empty `Business Objective` and `Feature Request` sections. Per memory `project_qa_task_structure` ("sem AC explícito não testa"), this SPEC reconstructs **implicit ACs** from the synopsis + dev Testing Steps + DB tables. Any AC marked `[IMPLICIT]` must be confirmed by Yuri before validator declares DoD met.

| AC ID | Statement (implicit) | Scenarios | Source |
|---|---|---|---|
| **AC-1 [PRINCIPAL]** | When a scheduled-future payment is PROCESSED by the SVC job on its `paymentDate` AND `agentUsername` ∈ allow-list, exactly ONE POST is dispatched with `eventType: "CREATED"` (or equivalent — Q-B6) and the full payload | CT-01, CT-03, CT-06 | Synopsis (literal — confirmed by Djalma 2026-05-20) |
| AC-2 | When the processed payment is reversed via `reversePayment` (status `MANUAL_REVERSE`), exactly ONE POST is dispatched with `eventType: "REVERSED"`, same `paymentPk` | CT-07 | Dev Test 2 + synopsis (REVERSED is event-symmetric) |
| AC-3 | When `agentUsername` is NOT in the allow-list, no webhook is dispatched regardless of processing | CT-05 | Dev Test 3 |
| AC-4 | Each outbound dispatch produces a row in `uown_sv_outbound_api_log` (via `SvOutboundCall`) with `payment_pk` and event type | CT-01, CT-03, CT-07, CT-09 | Dev description ("Call is registered via `SvOutboundCall`") |
| AC-5 | Different agents in the allow-list dispatch to different URLs (per-agent config) | CT-03 | Dev description (separate config keys per agent) |
| AC-6 | The webhook is sent ASYNCHRONOUSLY after DB commit | embedded in CT-01 | Dev description ("after DB commit") |
| AC-7 [IMPLICIT] | If the configured webhook URL fails at processing time (5xx, timeout, DNS), processing still completes; the outbound row reflects the failure | CT-12 | Inferred |
| AC-8 [IMPLICIT] | Payload structure matches the contract: `{paymentPk:number, customerAccountPk:number, name:string, amount:number, paymentDate:"YYYY-MM-DD", eventType:"CREATED"|"REVERSED"}` | CT-08 | Dev description |
| AC-9 [IMPLICIT — INVERTIDA] | Immediate payment (`paymentDate = today`) created via API does NOT fire a "creation event" webhook; webhook fires only at processing | CT-NEG-IMMEDIATE | Synopsis literal — see Finding #1 |
| AC-10 [IMPLICIT] | `agentUsername = null / empty` does NOT dispatch a webhook | CT-10 | Q-B5 |
| AC-11 [IMPLICIT — NEW] | UI Servicing action of scheduling a future payment produces an account-level activity log in `uown_los_lead_notes` (or equivalent) | CT-01, CT-03 | Regra #14 + UI-first |
| AC-12 [IMPLICIT — NEW] | Webhook may fire on FAILED processing (insufficient funds, declined) with an event type such as `FAILED` — TBD | CT-14 | Q-B6 |

---

## Risk Analysis

Risk = Probability × Impact, per [[risk-based-prioritization]]. Dimensions: N (novelty), I (integration), B (boundary), H (history), C (customer), F (business function), A (audit).

| ID | Scenario | N | I | B | H | C | F | A | Score | Bucket |
|---|---|---|---|---|---|---|---|---|---|---|
| **CT-01** | **[PRINCIPAL] Schedule payment via Servicing UI → processed on date → CREATED webhook (atlog-ai)** | 3 | 3 | 2 | 0 | 2 | 3 | 3 | 90 | **P0** |
| CT-02 | UI discovery + locator hardening for "Schedule Payment" affordance no Servicing portal | 3 | 1 | 0 | 0 | 1 | 1 | 1 | 6 | P0-pre (gating CT-01) |
| CT-03 | Per-vendor URL isolation: scheduled payment by `level-ai` lands only in level-ai inbox | 3 | 3 | 2 | 0 | 1 | 2 | 3 | 66 | P0 |
| CT-04 | Activity log `uown_los_lead_notes` on schedule + on process (UI action) | 3 | 1 | 0 | 0 | 1 | 2 | 3 | 18 | P0 |
| CT-05 | Negative: non-configured agent (`manual-qa-user`) schedules + processes → NO webhook | 3 | 2 | 1 | 0 | 0 | 2 | 3 | 30 | P1 |
| CT-06 | Audit row in `uown_sv_outbound_api_log` at processing time | 3 | 2 | 0 | 0 | 0 | 2 | 3 | 25 | P1 |
| CT-07 | REVERSED webhook after processing | 3 | 3 | 1 | 0 | 1 | 2 | 3 | 48 | P0 |
| CT-08 | Payload schema completeness (full 6 fields, types) | 3 | 3 | 2 | 0 | 1 | 2 | 3 | 66 | P0 |
| **CT-NEG-IMMEDIATE** | **[NEGATIVO]** Immediate payment via API (`paymentDate = today`) → confirms webhook does NOT fire on creation (only on processing) | 3 | 2 | 2 | 0 | 0 | 2 | 3 | 40 | P1 |
| CT-09 | Per-event count: exactly 1 outbound row per processing event (no duplicates) | 3 | 2 | 1 | 0 | 0 | 2 | 3 | 28 | P1 |
| CT-10 | `agentUsername = null` / empty on UI scheduling (if UI allows) and API | 3 | 2 | 3 | 0 | 0 | 2 | 2 | 32 | P1 |
| CT-11 | Reverse of payment created by non-allow-listed agent (post-process) | 3 | 3 | 2 | 0 | 1 | 1 | 3 | 40 | P1 |
| CT-12 | Graceful degradation: webhook URL down at processing time | 3 | 3 | 2 | 0 | 0 | 2 | 3 | 40 | P1 |
| CT-13 | Idempotency / retry behavior on failed dispatch | 3 | 3 | 2 | 0 | 0 | 1 | 3 | 32 | P1 |
| CT-14 | FAILED processing (insufficient funds / declined) — webhook event? (Q-B6) | 3 | 3 | 2 | 0 | 1 | 2 | 3 | 66 | P0-conditional |

### Floor rules applied

- **Regra #14 (activity log)** — every CT must validate `uown_sv_outbound_api_log` presence + content AND `uown_los_lead_notes` for UI-driven actions. CT-04 / CT-06 explicit; others embed as steps.
- **Regra #15 (UI-first)** — primary path is Servicing UI for scheduling. API used only for (a) setup acceleration, (b) negative cross-check (CT-NEG-IMMEDIATE), (c) regression mass.
- **Regra #11 (conservative bug classification)** — CT-12, CT-13, CT-11, CT-14 produce `[OBSERVAÇÃO]` outputs if behavior is undocumented.
- **Money tolerance** (`feedback_float_repr_not_bug`) — CT-08 uses `toBeCloseTo` on `amount`.
- **Memory `project_dv360_uat_qa1_outage_2026_05_18`** — outage afetou Origination/`sendApplication`. Esta feature é Servicing payment — provavelmente não impactada. **Primário qa1** por override de Djalma 2026-05-20; se setup via `sendApplication` for necessário e outage persistir, fallback: usar lead pré-existente (manual setup once) ou aguardar resolução. Não voltar para qa2 sem autorização.
- **Regra #18 (DOM-first)** — implementer deve investigar Servicing UI no qa1 via MCP Playwright ANTES de criar page object para "Schedule Payment". CT-02 é gating.

### Coverage chosen

Implement: all P0 + all P1 = 13 scenarios (CT-01..CT-13 + CT-NEG-IMMEDIATE). CT-14 (FAILED event) stays gated on Q-B6 — promoted to P0 if answer = "fires also on FAILED".

---

## Test Strategy

### Level decision per scenario

| Scenario | Level | Justification |
|---|---|---|
| **CT-01 (principal)** | **E2E Servicing UI** + DB + `webhook.site` inbox + activity log | Regra #15 UI-first. Human agent action of scheduling payment must be exercised via portal. Visual validation (badge "Scheduled", form rendering, success toast) cannot be substituted by API+DB log reading. |
| CT-02 (UI discovery) | DOM investigation only (no automated assertion) | Pre-requisite — implementer needs to locate the affordance before page object can be built |
| CT-03 (per-vendor isolation) | E2E Servicing UI (with `level-ai` configured agent identity — via UI agent picker if exists, else API) | UI-first applies; may degrade to API if UI doesn't expose agent identity selection — `[OBSERVAÇÃO]` |
| CT-04 (activity log) | DB assertion ride-along on CT-01 | Already covered as step in CT-01 |
| CT-05 (negative manual-qa-user) | E2E Servicing UI (same flow, identity differs) | UI-first |
| CT-06, CT-07 (audit row, REVERSED) | E2E Servicing UI for reverse action + DB | Reverse payment is ALSO a Servicing UI action (per [[feedback_payment_ui_first_servicing]]) |
| CT-08 (payload schema) | Ride-along on CT-01 — capture `webhook.site` payload | No additional UI needed |
| **CT-NEG-IMMEDIATE** | **API-only** (justified exception) | Goal is to confirm immediate-PAID via API does NOT trigger creation-time webhook. Negative scenario at the API layer is the correct level — UI repeating it would not change the assertion. |
| CT-09..CT-14 | Mixed | CT-09 (count duplicates): DB; CT-10 (null username): API negative; CT-11 (reverse cross-agent): UI if reachable, else API; CT-12 (URL down): API setup + UI scheduling + observation; CT-13 (retry): observation only; CT-14 (FAILED): UI if test card supports forcing decline, else API |

**Justification consolidada (regra #15).** Feature has clear UI affordance (agent scheduling payment in Servicing). API-only is acceptable ONLY for negative cross-checks (CT-NEG-IMMEDIATE), bulk regression mass, and infrastructure scenarios (URL down setup). Rendering, badge transitions, and account-page state changes must be validated visually for the principal path.

### Setup vs Exercise vs Assertion

| Phase | Tooling |
|---|---|
| **Setup (lead → FUNDED account)** | API `driveLeadToFunding` ([[payment-flows]] §2) — creates lead, drives to `ACTIVE` servicing account. Fresh account per parallel test ([[test-data-hierarchy]]). If qa1 `sendApplication` outage persists 2026-05-20+, fallback to a pre-existing FUNDED account (manual setup once, document the leadPk/accountPk in fixtures) |
| **SVC API key** | `POST /uown/auth/authorize` once per test file; cached in client. Header: `Authorization: <key>` (no "Bearer") |
| **Exercise (principal)** | Agent login → navigate to account → locate "Schedule Payment" affordance → fill form (date, amount, agent identity if exposed) → submit → assert UI confirmation (badge "Scheduled" / toast) |
| **Exercise (processing trigger)** | Q-B1-NEW: depends on SVC sweep mechanism. Options: (a) endpoint admin to force-trigger sweep at qa1 — preferred; (b) DB time-shift on payment row (REQUIRES Exception 3 authorization — fail-fast otherwise); (c) wait real time (impractical for CI) |
| **Assertion (quadruple oracle)** | (a) UI: account page badge + payment row status transition Scheduled → Processed; (b) DB `uown_sv_payment` row transitions to processed status; (c) DB `uown_sv_outbound_api_log` row with `payment_pk` + `event_type` (back-off 10–30s); (d) `webhook.site` inbox POST received with exact payload; (e) `uown_los_lead_notes` activity log entry for scheduled + processed |

### Environment

- **Primary: qa1** (override de Djalma 2026-05-20). Esta feature é Servicing payment (não Origination); outage DV360 de 2026-05-18 afetava `sendApplication` na criação de lead. Se setup-via-API for necessário e o outage persistir: usar **lead pré-existente** (manual one-time setup, document `accountPk` in test fixtures) ou aguardar resolução. Não voltar para qa2 sem nova autorização.
- **DoD: stg** — final validation before release closure (memory `project_qa_task_structure`).
- **NOT sandbox** — sandbox would need `payment.agent.webhook.notify.usernames` and per-agent URL configs that may not be provisioned.

### Parallelization

- **CT-01 → CT-07 (REVERSED)**: serial chain (REVERSED uses processed paymentPk from CT-01).
- **CT-03, CT-05, CT-08, CT-09..CT-13**: parallelizable in the same `test.describe.parallel` — each uses an independent fresh account.
- **CT-NEG-IMMEDIATE**: parallel-safe (API-only, separate account).
- **`webhook.site` inboxes**: each scenario gets a unique inbox URL (or a unique token suffix) to avoid cross-talk. See Implementer Notes.

### Smoke vs Full

- **Smoke (≤10min, merge blocker)**: CT-01 (principal), CT-05 (negative manual-qa-user), CT-NEG-IMMEDIATE (regression — webhook does NOT fire on immediate creation).
- **Full (scheduled / pre-release)**: all 13 (+ CT-14 if Q-B6 promotes it).

---

## Pre-conditions and Test Data

### Per-execution provisioning (mandatory)

1. **Config drift check on `uown_sv_sql_config`** before any CT runs. Read-only `SELECT key, value FROM uown_sv_sql_config WHERE key IN (...)`:

   ```text
   com.uownleasing.svc.service.UownPaymentService.payment.agent.webhook.notify.usernames
   com.uownleasing.svc.service.atlog.AtlogWebhookService.payment.agent.webhook.url.atlog-ai
   com.uownleasing.svc.service.atlog.AtlogWebhookService.payment.agent.webhook.url.level-ai
   ```

   Expected:
   - `notify.usernames` value contains both `atlog-ai` and `level-ai` (comma-separated; trimmed)
   - URL for `atlog-ai` is a real `webhook.site` URL controlled by the test framework
   - URL for `level-ai` is a real `webhook.site` URL controlled by the test framework, DIFFERENT from atlog-ai's

   **If drift detected:** test fails with `[OBSERVAÇÃO] config drift` and exits. Auto-heal via `POST /uown/createOrUpdateSqlConfig` is allowed but **only with explicit user authorization** (Exception 3, CLAUDE.md) — the SPEC does NOT pre-authorize. Default: fail-fast with a clear message.

2. **`webhook.site` inbox provisioning.** Two strategies:

   - **Static (preferred)**: two long-lived inboxes (one per agent) pre-provisioned by ops; their URLs live in `.env` as `WEBHOOK_SITE_ATLOG_URL` and `WEBHOOK_SITE_LEVEL_URL`. The test framework queries the `webhook.site` API for "requests received by inbox X since timestamp Y" to assert delivery.
   - **Dynamic (fallback)**: create a fresh inbox per test via `webhook.site` API, update `uown_sv_sql_config` accordingly. Requires Exception 3 (DB write).

   This SPEC defaults to static. Q-I5: does ops already have these inboxes provisioned in qa1 / stg?

3. **SVC API key.** Obtain once via `POST /uown/auth/authorize` (existing `AuthClient`). Cache for the test file.

4. **Funded servicing account** with at least one open receivable. Use `driveLeadToFunding` with fresh data ([[test-data-hierarchy]] §1). One account per parallel test for CT-03, CT-05..CT-11. CT-01 → CT-02 share one account.

### Test data

| Field | Value | Notes |
|---|---|---|
| Merchant | UOWN_DEMO or TireAgent | UOWN-side; no brand specificity for webhook |
| Applicant SSN | `generateTestSSN()` | Fresh per execution; [[test-data-hierarchy]] |
| Order total | `$1500.00` | Default; sufficient receivable headroom |
| Payment amount (CT-01..CT-04) | `$1.00` | Matches dev test 1 exactly (`amount: 1.00`) |
| Payment amount (CT-05) | `$1.00` | Match dev test for cross-comparability |
| Payment date CT-01..CT-04 | `today` (`YYYY-MM-DD`) | Per dev tests |
| Payment date CT-05 | `today + 7 days` | Probes Q-B1 |
| `paymentType` | `CC` | Confirm via Q-I6 — dev tests don't specify; likely `CC` from receivable |
| `agentUsername` | `atlog-ai` / `level-ai` / `manual-qa-user` / null / empty | Per scenario |

---

## Scenarios (prioritized)

> **NB (2026-05-20):** renumbering after Djalma corrections. **CT-01 is now the scheduled-future-processed principal scenario** (was CT-12). Old CT-01..CT-04 (immediate-PAID via API) are demoted / refactored: old CT-04 negative becomes CT-05; old CT-01 immediate happy-path becomes CT-NEG-IMMEDIATE (now a NEGATIVE assertion — webhook should NOT fire on creation). Old CT-02 REVERSED is preserved as CT-07 (event-symmetric, post-processing). Old CT-05 (future-dated creation-time trigger) is REMOVED — synopsis-literal kills its premise.

### CT-01 — [PRINCIPAL] Schedule payment via Servicing UI → processed on date → CREATED webhook (atlog-ai)

- **Priority:** P0 (Score 90) · **Type:** E2E Servicing UI + DB + `webhook.site` + activity log
- **AC:** AC-1 PRINCIPAL, AC-4, AC-6, AC-8, AC-11
- **Technique:** State transition (Scheduled → Processed) + Equivalence partitioning (valid agent identity)
- **Persona:** Human agent (operations) in the Servicing portal, scheduling a future payment on behalf of `atlog-ai` configured identity (or with the UI agent identity field set to `atlog-ai` if the form exposes it — Q-I9-NEW)

**Pre-condition.**

- Config drift check passes (3 SQL configs present, atlog-ai/level-ai URLs distinct).
- Fresh FUNDED servicing account `accountPk1` exists (via `driveLeadToFunding` API setup OR pre-existing fixture account if qa1 `sendApplication` outage persists).
- Agent test user has Servicing portal access and permission to schedule payments.
- **Processing trigger mechanism IDENTIFIED** (Q-B1-NEW resolved). One of: (a) admin endpoint to force-fire scheduled-payment sweep; (b) authorization to time-shift `paymentDate` in DB at processing moment (Exception 3); (c) date set to `today + 1` and CI scheduled to run next-day batch.

**Steps.**

1. **UI Setup.** Login as agent (Servicing portal, qa1). Navigate to account `accountPk1`.
2. **UI Snapshot.** Capture current state: open payments list, badge count, last `uown_los_lead_notes` entry timestamp for this account.
3. **Outbound snapshots.** `webhook.site` `atlog-ai` inbox latest timestamp = `T0`; `uown_sv_outbound_api_log` max pk for this `payment_pk` filter (will be 0 — payment not yet exists).
4. **UI Action — Schedule Payment.** Locate affordance (DOM-first investigation, see CT-02 / Implementer Notes). Open scheduling form. Fill: amount `$1.00`, date `today + N` (N depends on Q-B1-NEW answer; minimum to ensure pre-processing window), agent identity = `atlog-ai` (if exposed; else default per Q-I9-NEW), paymentType = CC (or per UI default).
5. **Submit.** Assert UI confirmation: success toast / new row in payments list with badge "Scheduled" / status "Pending Future Date". Capture `paymentPk` (from DOM, URL, or DB query).
6. **Validate scheduling state (DB + activity log).**
   - DB: 1 row in `uown_sv_payment` with `pk = paymentPk`, status = `SCHEDULED` (or equivalent), `paymentDate = today + N`, `agentUsername` reflects atlog-ai.
   - Activity log: 1 new row in `uown_los_lead_notes` for the account with content indicating "payment scheduled" (regra #14).
   - Outbound log: ZERO new rows in `uown_sv_outbound_api_log` for this `payment_pk` — webhook MUST NOT fire on scheduling (only on processing).
   - `webhook.site` atlog-ai inbox: ZERO new requests since `T0`.
7. **Trigger processing** (per Q-B1-NEW resolution). Wait or force.
8. **Validate processing state.**
   - UI: refresh account page. Badge transitions Scheduled → Processed (or equivalent). Verify visually.
   - DB `uown_sv_payment`: status transitions to `PAID` / `PROCESSED` (TBD).
   - Activity log: new `uown_los_lead_notes` entry for "payment processed" with timestamp matching processing.
9. **Validate webhook (triple oracle).**
   - DB `uown_sv_outbound_api_log`: with `waitForRecord` (10–30s back-off post-processing), exactly 1 NEW row with `payment_pk = paymentPk` AND `event_type = 'CREATED'` (or equivalent — Q-I1).
   - `webhook.site` atlog-ai inbox: with back-off, exactly 1 NEW POST received since `T0`. Body matches:

   ```json
   {
     "paymentPk": <paymentPk>,
     "customerAccountPk": <accountPk1>,
     "name": "<applicant.firstName> <applicant.lastName>",
     "amount": 1.00,
     "paymentDate": "<today + N>",
     "eventType": "CREATED"
   }
   ```

   Use `toBeCloseTo(amount, 1.00, 2)` per `feedback_float_repr_not_bug`.

**Validations / oracles (consolidated quintuple).**

- UI: badge transitions Scheduled → Processed, visible to operator.
- DB `uown_sv_payment`: status row reflects processing.
- DB `uown_sv_outbound_api_log`: exactly 1 row, correct `event_type`.
- Outbound inbox: exactly 1 POST, exact payload schema.
- Activity log `uown_los_lead_notes`: 2 entries (scheduled + processed) for the account.

**Pitfalls considered.**

- Float comparison on `amount` (`feedback_float_repr_not_bug`).
- DB polling MUST use back-off ([[db-polling-pattern]]) post-processing; single SELECT will race.
- `paymentPk` must be unique — never reuse a stale `paymentPk` across runs.
- Servicing portal viewport ≥ 1440×900 (Bootstrap `d-lg-block`) — see [[dom-investigation]].
- Activity log MUST be validated (regra #14 — log absent = nothing happened).
- DO NOT do DB mutation to force pass (`feedback_no_db_mutation_to_force_pass`) — if processing trigger is unavailable in qa1, skip/timeout is the correct outcome, not UPDATE.

**Edge cases covered.** None — principal happy path. Edges in CT-05 (wrong agent), CT-08 (payload), CT-12 (vendor outage at processing), CT-14 (FAILED processing).

**Hand-off.** Captures `paymentPk` of processed payment for CT-07 (REVERSED).

---

### CT-02 — [PRE-REQUISITE] UI affordance discovery for "Schedule Payment" no Servicing portal

- **Priority:** P0-gating (Score 6 — low risk but blocking) · **Type:** DOM investigation only (no automated assertions)
- **AC:** N/A (enabling activity)
- **Persona:** Implementer doing DOM-first investigation per regra #18

**Goal.** Before CT-01 can be automated, the implementer MUST locate the actual UI affordance for scheduling a future payment in the Servicing portal at qa1.

**Steps (manual, executed by implementer once).**

1. Login Servicing portal at qa1 as agent.
2. Navigate to a known FUNDED account.
3. Inspect via `mcp__playwright__browser_*`: viewport ≥ 1440×900, `browser_snapshot`, `browser_evaluate`. Look for: "Schedule Payment", "Add Future Payment", "New Payment" with date picker, or similar.
4. Map the exact DOM: `tagName`, `role`, accessible name, ancestor chain, and any modal/drawer that opens.
5. Build "DOM Real vs Selector Proposed" table.
6. Document in `src/pages/servicing/{...}-schedule-payment.page.ts` per [[page-object-pattern]].

**Output.** A confirmed page object skeleton + selectors that CT-01 will consume. If the affordance does NOT exist in qa1, **escalate to Yuri** — feature may not be deployed in qa1 yet (try qa2 / stg only after confirming with user; do NOT switch env unilaterally given Djalma's override).

**Pitfalls considered.**

- Affordance may live behind a permission flag (agent role); verify with the right test user.
- Modal may render with `display: none` until trigger — DOM snapshot before and after click.
- Date picker may be a third-party widget (react-day-picker, flatpickr) — test inputting via keyboard typing vs click selection.

---

### CT-07 — REVERSED webhook after processing (chained from CT-01)

- **Priority:** P0 · **Type:** E2E Servicing UI (reverse action) + DB + Outbound inbox · **Score:** 48
- **AC:** AC-2, AC-4, AC-6
- **Technique:** State transition (`Processed → Reversed`)
- **Persona:** Human agent reversing the processed payment via Servicing UI

**Pre-condition.** CT-01 ran successfully; `paymentPk` captured AFTER processing (status PROCESSED, not SCHEDULED).

**Steps.**

1. Snapshot inbox state `T0` (atlog-ai).
2. **UI Action — Reverse Payment.** Servicing portal at qa1, navigate to account, locate the processed payment row, click "Reverse" / "Refund" affordance (DOM investigation similar to CT-02). Fill: reason "QA — CT-07 reverse path", status MANUAL_REVERSE (if exposed).
3. Submit. Assert UI: payment row badge transitions Processed → Reversed. Confirmation toast / dialog success.
4. Wait + assert DB `uown_sv_payment`: row status reflects reverse.
5. Wait + assert DB `uown_sv_outbound_api_log` (10–30s back-off): 1 new row with `payment_pk = paymentPk` AND `event_type = 'REVERSED'`.
6. Wait + assert webhook.site atlog-ai inbox: 1 new POST with `eventType: "REVERSED"`, same `paymentPk`, same `customerAccountPk`, same `name`.
7. Activity log: new `uown_los_lead_notes` entry for "payment reversed" (regra #14).

**Fallback (API).** If the Servicing UI Reverse affordance is not discoverable in CT-02 investigation (or is behind a permission not granted in qa1), the implementer MAY use `POST /uown/svc/reversePayment` as fallback — documented `[OBSERVAÇÃO]` in test report. This is justified because: (a) the webhook contract under test is server-side, (b) CT-01 already proved UI-first for the scheduling/processing path.

**Validations / oracles.**

- UI: badge transitions Processed → Reversed.
- DB: payment status row updated; outbound row with `event_type = REVERSED`, same `payment_pk`.
- Outbound inbox: payload `eventType = REVERSED`.
- Activity log: entry for reverse action.
- Crucially: only ONE new outbound row per event-type — no duplicate CREATED, no duplicate REVERSED. Use a tight query window.

**Pitfalls considered.**

- Reverse may be REJECTED by `svc` if payment already settled (depends on processing window). The CT-01 → CT-07 chain must time the reverse before settlement. Q-I6.
- `reverseDate` format: `YYYY-MM-DD` (if API fallback used).

---

### CT-03 — Per-vendor URL isolation: scheduled payment by `level-ai` (UI Servicing)

- **Priority:** P0 · **Type:** E2E Servicing UI + DB + Outbound inbox · **Score:** 66
- **AC:** AC-1 PRINCIPAL, AC-5, AC-11
- **Technique:** Equivalence partitioning (valid class — second agent identity)

**Pre-condition.** Fresh FUNDED account `accountPk2`. `webhook.site` inbox for `level-ai` is distinct from `atlog-ai`. UI exposes agent identity selection (Q-I9-NEW).

**Steps.**

1. Snapshot inbox state for BOTH inboxes (atlog `T0a`, level `T0l`).
2. UI: agent login, navigate to `accountPk2`, open Schedule Payment form (same as CT-01).
3. Fill: amount `$1.00`, date `today + N`, **agentUsername = `level-ai`** (via UI agent picker), paymentType CC.
4. Submit. Validate UI scheduling state (badge Scheduled). Validate DB `uown_sv_payment` row + activity log "scheduled".
5. **Pre-processing check**: ZERO outbound rows / inbox hits for this `paymentPk`.
6. Trigger processing (per Q-B1-NEW).
7. Wait + assert DB `uown_sv_outbound_api_log`: 1 new row for this `paymentPk` (vendor = level-ai per Q-I1).
8. Wait + assert inbox `level-ai`: 1 new request, payload matches level-ai routing.
9. **Cross-check (CRITICAL)**: inbox `atlog-ai` received ZERO new requests since `T0a`.
10. Activity log: `uown_los_lead_notes` entries for scheduled + processed.

**Validations / oracles.**

- Webhook isolation: `level-ai` payment does NOT leak to `atlog-ai` inbox.
- DB row reflects correct vendor (whatever column `uown_sv_outbound_api_log` uses to disambiguate — Q-I1).

**Fallback.** If UI doesn't expose agent identity selection, CT-03 may use API for setup (`POST /uown/svc/makePayment` with `agentUsername: "level-ai"`, future date) but processing step still must be observed via UI badge transition. Document `[OBSERVAÇÃO]`.

**Why this matters.** If both URLs were misconfigured to the same inbox, CT-01 would still pass. CT-03 is the only scenario that *proves* per-agent routing works.

---

### CT-05 — Negative: non-configured agent (`manual-qa-user`) — UI scheduled + processed → NO webhook

- **Priority:** P1 · **Type:** E2E Servicing UI + DB + Outbound inbox (null assertion) · **Score:** 30
- **AC:** AC-3
- **Technique:** Equivalence partitioning (invalid class — agent NOT in allow-list)

**Pre-condition.** Fresh FUNDED account `accountPk3`. `manual-qa-user` (or whichever human agent username `qauown` is using) is NOT in `payment.agent.webhook.notify.usernames`.

**Steps.**

1. Snapshot inboxes (`atlog-ai` `T0a`, `level-ai` `T0l`).
2. UI: login as `qauown` (human agent not in allow-list), navigate to `accountPk3`, schedule a future payment via Schedule Payment form.
3. Submit. Validate UI scheduled state.
4. Trigger processing (Q-B1-NEW).
5. Validate UI: badge Processed; DB `uown_sv_payment` shows PROCESSED.
6. Wait 15s post-processing (give async dispatch chance to misfire).
7. Assert: ZERO new rows in `uown_sv_outbound_api_log` for this `payment_pk`.
8. Assert: ZERO new requests in atlog-ai inbox since `T0a`.
9. Assert: ZERO new requests in level-ai inbox since `T0l`.
10. Activity log: `uown_los_lead_notes` entries for scheduled + processed MUST still exist (UI action ≠ webhook).

**Validations / oracles.**

- Payment processes normally (not gated on webhook).
- Strong negative assertion: no outbound row, no inbox hit.
- Activity log present (regra #14 — the operational log fires regardless of webhook routing).

**Pitfalls considered.**

- Negative assertions are flaky if not given enough time. 15s wait post-processing is heuristic; can extend.
- Avoid asserting on a *future* timestamp window — bound to `BETWEEN paymentProcessedTs AND now()`.
- If the UI agent identity is auto-filled from the logged-in user, this CT verifies the natural "human agent" path produces no webhook — which is the most important negative case for production safety.

---

### CT-NEG-IMMEDIATE — [NEGATIVO] Immediate payment via API confirms webhook does NOT fire on creation

- **Priority:** P1 (Score 40) · **Type:** API-only + DB + Outbound inbox (negative assertion) · **JUSTIFIED API-ONLY**
- **AC:** AC-9 INVERTIDA (synopsis-literal: webhook fires ONLY at processing, never at creation)
- **Technique:** Negative probe — explicitly verifies the inverse of the dev's "Testing Steps" interpretation
- **Persona:** API consumer / integration test simulating the dev's smoke path
- **API-only justification.** Goal of this CT is to probe the API behavior in isolation: when an immediate-`PAID` payment is created via `POST /uown/svc/makePayment` with `paymentDate = today`, does the webhook fire? Synopsis-literal says NO (webhook fires only when SVC's scheduled-payment processor runs). Repeating this via UI would not change the assertion — the API-layer behavior is what's under question. Documented exception, not a default.

**Pre-condition.** Fresh FUNDED account `accountPkNegIm`. atlog-ai in allow-list.

**Steps.**

1. Snapshot atlog inbox `T0` and `uown_sv_outbound_api_log` max pk.
2. POST `/uown/svc/makePayment` with `agentUsername: "atlog-ai"`, `paymentDate: "<today>"`, `paymentAmount: 1.00`, `paymentType: "CC"`.
3. Assert HTTP 200. Capture `paymentPk`.
4. Wait 30s post-creation (give async dispatch full chance to fire).
5. Observe behavior:
   - **Hypothesis A (synopsis literal):** ZERO outbound rows for this `paymentPk`, ZERO inbox hits. Webhook DID NOT fire on creation.
   - **Hypothesis B (creation-time also triggers):** 1 outbound row + 1 inbox hit immediately. Indicates SVC processes immediate-date payments synchronously at creation AND fires webhook there.
6. Document observed behavior with `[OBSERVAÇÃO]` language.

**Validations / oracles.**

- Per Djalma's correction 2026-05-20, expected outcome is Hypothesis A.
- If Hypothesis B is observed, it does NOT necessarily mean a bug — could mean SVC's scheduled-payment processor runs immediately when `paymentDate <= today` (i.e. immediate processing = scheduled processing with delay 0). Document and escalate to Yuri for interpretation.

**Why this matters.** Confirms the synopsis literal interpretation against the dev's "Testing Steps" smoke path. Closes the loop on Finding #1.

---

### CT-08 — Payload schema completeness

- **Priority:** P0 · **Type:** Ride-along on CT-01 captured payload (no new run needed) · **Score:** 66
- **AC:** AC-8
- **Technique:** Decision table (each field × valid/invalid)

**Pre-condition.** CT-01 already captured a webhook payload at processing time. CT-08 reuses that capture (preferred — no duplicate run); fallback is to run a fresh CT-01-equivalent.

**Steps.**

1. From a fresh CT-01-style run, capture the webhook payload `P`.
2. Assert exhaustively:
   - `P.paymentPk` is `number` and equals `paymentInfo.pk` from `makePayment` response.
   - `P.customerAccountPk` is `number` and equals the test's `accountPk`.
   - `P.name` is `string`, matches `<firstName> <lastName>` exactly (single space, no extra whitespace, no email prefix).
   - `P.amount` is `number` (decimal, not integer cents) and `toBeCloseTo(1.00, 2)`.
   - `P.paymentDate` is `string` matching `/^\d{4}-\d{2}-\d{2}$/`.
   - `P.eventType` is `"CREATED"` exactly (string literal).
   - **No extra keys**: `Object.keys(P).sort()` equals `["amount","customerAccountPk","eventType","name","paymentDate","paymentPk"]`.

**Validations / oracles.** Strict schema match. If extra fields appear, it is a backward-compat concern — `[OBSERVAÇÃO]`, not bug.

**Pitfalls considered.**

- `name` may include middle name / suffix — confirm `applicant.firstName + " " + applicant.lastName` or full legal name (Q-I8).
- `amount` could be sent as integer cents (`100`) instead of decimal dollars (`1.00`); strict type check catches this.

---

### CT-09 — Audit-trail row in `uown_sv_outbound_api_log` (ride-along)

- **Priority:** P1 · **Type:** DB-only assertion (rides on CT-01/CT-03/CT-07 outputs) · **Score:** 28
- **AC:** AC-4

This is a standalone validation pass over the rows produced by CT-01, CT-03, CT-07. Implementer may choose to merge into each of those scenarios as a "Step N — assert audit row" instead of a separate test. Either is acceptable per [[activity-log-validation]].

**Assertions.** For each of (CT-01, CT-03, CT-07):

- Exactly 1 row exists in `uown_sv_outbound_api_log` with the expected `payment_pk` and `event_type` (no duplicates).
- Row has non-null `created_at` within the test window.
- Row references the correct outbound URL (column TBD — Q-I1).
- Row reflects HTTP response from vendor (status code stored — Q-I1).

---

### CT-12 — Graceful degradation: webhook URL unreachable at processing time

- **Priority:** P1 · **Type:** UI scheduling + API config override + DB · **Score:** 40
- **AC:** AC-7 [IMPLICIT — requires Q-B3 confirmation]
- **Technique:** Equivalence partitioning (invalid class — vendor outage during processing)

**Pre-condition.** Override one webhook URL config to point to a NON-RESPONSIVE endpoint (e.g. `https://httpstat.us/500` or a non-routable port like `http://127.0.0.1:1`). **This requires user authorization** (Exception 3, CLAUDE.md) — SPEC does NOT pre-authorize the config mutation. The implementer MUST request authorization and revert at teardown.

Alternative non-mutating approach: use `webhook.site` with a "delay" or "auto-respond-with-500" feature (some inboxes support this) — confirm Q-I5.

**Steps.**

1. Config override (with auth): `payment.agent.webhook.url.atlog-ai = "https://httpstat.us/500"`. Verify drift detection accepts this for the run (or skip drift check for this scenario).
2. POST `/uown/svc/makePayment` with `atlog-ai`.
3. Assert HTTP 200 (payment creation does not block on vendor failure).
4. Wait + assert DB: 1 new row in `uown_sv_outbound_api_log` with status reflecting the failure (`5xx`, `FAILED`, or whatever column captures vendor response — Q-I1).
5. **Teardown**: restore original config.

**Validations / oracles.**

- Payment succeeds regardless of webhook outcome (`makePayment` is not gated).
- Outbound row exists AND reflects failure status.
- No unhandled exception bubbles up to `makePayment` response.

**Output language.** If behavior is unexpected (e.g. `makePayment` returns 500 due to webhook failure), classify `[OBSERVAÇÃO]` and escalate — do NOT call it a confirmed bug without Yuri's input ([[bug-classification]]).

---

### CT-10 — `agentUsername` null / empty

- **Priority:** P1 · **Type:** API + DB (UI rarely permits null username) · **Score:** 32
- **AC:** AC-10 [IMPLICIT]
- **Technique:** BVA (boundary — null, empty string, whitespace)

**Pre-condition.** Fresh funded account.

**Steps.**

1. POST `/uown/svc/makePayment` with `agentUsername: null`. Capture response.
2. POST `/uown/svc/makePayment` with `agentUsername: ""`. Capture response.
3. POST `/uown/svc/makePayment` with `agentUsername: "   "` (whitespace). Capture response.

**Validations / oracles per case.**

- HTTP status: either 200 (payment created, no webhook) OR 400 (rejected). Document actual behavior; do NOT assert one specific outcome until Yuri confirms (Q-B5). For each of the 3 sub-cases, capture:
  - HTTP status + body
  - Payment created (DB row in `uown_sv_payment`)? Y/N
  - Outbound row? Y/N

**Output language.** `[OBSERVAÇÃO]` — documents actual behavior; classification awaits Q-B5 answer.

---

### CT-11 — Reverse of payment NOT created/processed by a configured agent

- **Priority:** P1 · **Type:** UI Servicing + DB + Outbound inbox · **Score:** 40
- **AC:** Implicit — explores whether REVERSED webhook fires based on REVERSER's agentUsername or the ORIGINAL CREATOR's agentUsername (Q-B2)

**Pre-condition.** Fresh funded account `accountPk10`.

**Steps.**

1. POST `/uown/svc/makePayment` with `agentUsername: "manual-qa-user"`. Capture `paymentPk10`.
2. Verify (per CT-04): no CREATED webhook dispatched.
3. POST `/uown/svc/reversePayment` with `paymentPk: paymentPk10`, `agentUsername: "atlog-ai"`, `status: MANUAL_REVERSE`.
4. Assert HTTP 200.
5. Wait + observe DB and inbox: does REVERSED fire?

**Validations / oracles.**

- Document actual behavior. Two interpretations possible:
  - (a) REVERSED fires because the reverser (`atlog-ai`) is in the allow-list, regardless of who created.
  - (b) REVERSED does NOT fire because the original payment was not made by a configured agent (no symmetric CREATED).
- Output: `[OBSERVAÇÃO]` documenting which interpretation holds; raise Q-B2.

---

### CT-13 — Idempotency / retry behavior

- **Priority:** P1 · **Type:** UI scheduling + API config override + DB · **Score:** 32
- **AC:** Implicit — explores retry policy (Q-B4)
- **Technique:** State transition (fail → retry → success?)

**Pre-condition.** Fresh funded account. Webhook URL temporarily points to a slow-respond / 500 endpoint (same setup as CT-08).

**Steps.**

1. With URL pointing to 500 endpoint, POST `/uown/svc/makePayment` (`atlog-ai`).
2. Wait 60s.
3. Count rows in `uown_sv_outbound_api_log` for this `payment_pk`: is it 1 (single shot) or N>1 (retries)?
4. Restore URL to a working inbox.
5. Wait another 60s.
6. Re-count rows; observe if backend retries on success.

**Validations / oracles.**

- Document `[OBSERVAÇÃO]`: actual retry count, retry interval (if any).
- If retries exist: idempotency assertion — does the vendor receive the same payload (same `paymentPk` + `eventType`)? Important so the vendor can dedupe.

**Output language.** Pure observation. Bug classification awaits Q-B4.

---

### CT-14 — FAILED processing (insufficient funds / declined) — webhook event? (PENDING-Q-B6)

- **Priority:** P0-conditional (promoted if Q-B6 answer = "fires on FAILED with eventType FAILED") · **Type:** UI scheduling + forced decline + DB + inbox
- **AC:** AC-12 [IMPLICIT NEW]

**Status.** Drafted; NOT included in initial implementation. Promote to active CT after Q-B6 is answered.

**Pre-condition.** Fresh FUNDED account. A test card / payment method known to be declined at processing time (CC test number from `src/config/constants.ts`).

**Steps (sketch).**

1. UI: schedule payment via Servicing UI with a payment method known to decline at processing (e.g. test CC `4000000000000002` if SVC card sandbox supports it; else Q-I10).
2. Trigger processing.
3. Observe: payment status transitions to DECLINED/FAILED, NOT PAID.
4. Validate UI: badge reflects failure (e.g. "Declined", "Failed").
5. Wait + observe DB `uown_sv_outbound_api_log`: does a row exist? With what `event_type`? `FAILED`? `CREATED`-followed-by-`REVERSED`?
6. Wait + observe atlog-ai inbox: any POST? Payload `eventType`?
7. Validate activity log entry for the failure.

**Open issues for CT-14.**

- Is there a `FAILED` eventType in the contract, or only CREATED/REVERSED? (Q-B6)
- Does SVC treat a declined processing as no-op-no-webhook, or as a logged failure with notification?
- Document with `[OBSERVAÇÃO]` until Yuri/Marcus confirms.

---

## Pitfalls / domain reflexes (cross-cutting)

Apply per scenario:

1. **[reflex] Activity log validation** ([[activity-log-validation]], regra #14) — every UI action validates `uown_los_lead_notes` entry AND every processing event validates `uown_sv_outbound_api_log`. Negative CTs (CT-05, CT-10, CT-NEG-IMMEDIATE) validate ABSENCE of outbound row.
2. **[reflex] UI-first per regra #15** ([[ui-first-principle]]) — principal path is Servicing UI. API-only is documented exception (CT-NEG-IMMEDIATE), not default. Memory: [[feedback_payment_ui_first_servicing]].
3. **[reflex] DOM-first** ([[dom-investigation]], regra #18) — CT-02 (UI discovery) is mandatory before CT-01 implementation. Implementer MUST inspect Servicing portal via MCP Playwright before building page object.
4. **[reflex] Float tolerance on `amount`** (`feedback_float_repr_not_bug`, [[payment-flows]] §7) — use `toBeCloseTo(expected, 2)`.
5. **[reflex] DB polling with back-off** ([[db-polling-pattern]]) — webhook is async; single SELECT post-processing will race.
6. **[reflex] Fresh data via automation** (regra #10, [[test-data-hierarchy]]) — every CT gets a fresh funded account except CT-01→CT-07 (justified chain).
7. **[reflex] No DB mutation to force pass** (`feedback_no_db_mutation_to_force_pass`) — if config drift detected, fail-fast. Do NOT UPDATE `uown_sv_sql_config` without auth. Do NOT time-shift `paymentDate` in DB to force processing without authorization (Exception 3).
8. **[reflex] Conservative bug classification** (regra #11, [[bug-classification]]) — CT-NEG-IMMEDIATE, CT-10, CT-11, CT-12, CT-13, CT-14 emit `[OBSERVAÇÃO]` until Yuri confirms expected behavior.
9. **[reflex] Merchant preflight** — N/A for the webhook tests directly, but the underlying `driveLeadToFunding` setup invokes `ensureMerchantReady`. Apply `skipMerchantPreflight: true` if reusing an existing account.
10. **[reflex] `accountPk` vs `leadPk`** ([[payment-flows]] §9 / Pitfall #9) — extract `accountPk` AFTER `FUNDED`; do not confuse with `leadPk`.
11. **[reflex] qa1 outage of 2026-05-18 (`project_dv360_uat_qa1_outage_2026_05_18`)** — outage afetou `sendApplication`/Origination, NÃO Servicing payment. Esta feature roda em qa1 (override Djalma 2026-05-20); apenas o setup via `sendApplication` precisa de mitigation (lead pré-existente ou aguardar resolução).
12. **[reflex] Viewport ≥ 1440×900** (Bootstrap `d-lg-block`, [[dom-investigation]]) — Servicing portal UI flows need wide viewport.
13. **[reflex] Email IMAP `fintechgroup777@gmail.com`** — if any payment scheduling flow triggers a customer email (e.g. payment confirmation), use IMAP helper to clicar no link real (não bypassar via API). Memory: [[feedback_email_imap_click_link]].

---

## Open Questions (for Yuri / Marcus)

### Blockers (cannot finalize SPEC without these)

- **Q-B1 [RESOLVIDO 2026-05-20 por Djalma]** — synopsis é literal. Webhook dispara quando scheduled payment é processado na data agendada, não na criação. Dev "Testing Steps" foram smoke do dev, não cenário real. Resolução documentada em Finding #1.

- **Q-B1-NEW** — Qual é o mecanismo de processamento de scheduled payments?
  - (a) Job/sweep periódico no SVC? Qual a frequência? Qual o nome?
  - (b) Endpoint admin para disparar manualmente em qa1 (test-trigger)?
  - (c) Há forma de avançar tempo / forçar o processo em qa1 sem aguardar a data real?
  - **Por que blocker:** sem mecanismo de processing, CT-01 (principal) fica preso a aguardar tempo de relógio real → impeditivo para CI. Implementer precisa saber: (i) consultar svc source ([[feedback_consult_svc_when_unsure]]); (ii) verificar com Marcus se há endpoint test-only; (iii) se nada existir, qual a estratégia (DB time-shift requer Exception 3).

- **Q-B2** — Em CT-11 (reverse de payment NÃO criado por allow-listed agent), o webhook REVERSED dispara baseado no `agentUsername` do reverser (atlog-ai) ou do criador original (qauown)?
  - **Por que blocker:** afeta se CT-11 espera webhook ou não.

- **Q-B3** — Comportamento esperado de graceful degradation quando webhook URL está unreachable / 5xx / DNS-fail no momento do processamento?
  - (a) Processamento sucede, outbound row armazena failure → CT-12 expected.
  - (b) Processamento aborta → acoplamento inaceitável.
  - (c) Retry policy → ver Q-B4.
  - **Por que blocker:** CT-12 sem oracle.

- **Q-B4** — Retry policy para failed webhook dispatch:
  - One-shot only? Bounded retry (N attempts, exponential back-off)? Unbounded retry via separate sweep?
  - **Por que blocker:** CT-13 sem oracle; afeta CT-12 também.

- **Q-B5** — Comportamento esperado em `agentUsername = null / "" / whitespace`?
  - (a) HTTP 400 reject (API); UI rejeita no client?
  - (b) HTTP 200, no webhook, payment criado
  - **Por que blocker:** CT-10 sem oracle.

- **Q-B6 [NEW]** — Webhook dispara também em scheduled payment que **FALHA** no processamento (insufficient funds, declined, expired card)?
  - (a) Há `eventType` para FAILED? (`FAILED`, `DECLINED`, `PROCESSING_FAILED`?)
  - (b) Ou só CREATED/REVERSED, e payment falhado é silent no-op no webhook contract?
  - (c) Há um eventType "PROCESSED" genérico com substatus, ou eventos separados por outcome?
  - **Por que blocker:** CT-14 sem oracle; também impacta o vendor consumer side (atlog-ai espera notificação de failure?).

### Informative (proceed with assumptions, document the answer when received)

- **Q-I1** — Schema of `uown_sv_outbound_api_log`: what columns are present? Specifically: how does a row tie back to `payment_pk`, `event_type`, vendor identity (which agent), HTTP response status, retry count? (To be confirmed via `\d uown_sv_outbound_api_log` SELECT in qa1.)
- **Q-I2** — Should there also be a `uown_los_lead_notes` entry (e.g. `[VendorWebhook][atlog-ai] CREATED dispatched`) for cross-channel audit? Default: ESPERADO sim para UI-driven scheduling (regra #14); confirm with Yuri.
- **Q-I3** — Auth header on the outbound webhook POST? Bearer? Vendor-specific signature? Or unsigned JSON?
- **Q-I4** — Does brand (UOWN vs Kornerstone) affect the webhook (different config, different URL)? Default: NO — only agent username matters.
- **Q-I5** — Are `webhook.site` inboxes already provisioned in **qa1** and stg for atlog-ai and level-ai? Or does ops need to provision them? (Note: env changed from qa2 to qa1 per Djalma 2026-05-20.)
- **Q-I6** — Required body fields for `makePayment` beyond what dev showed (and the equivalent UI form fields).
- **Q-I7** — Is there a documented async dispatch SLA (e.g. webhook fires within 5 seconds of processing commit)?
- **Q-I8** — `payload.name` format: `firstName + " " + lastName`? Or full legal name? Or includes middle name / suffix?
- **Q-I9** — Are there any OTHER agents already provisioned in `payment.agent.webhook.notify.usernames` beyond `atlog-ai` and `level-ai`? (Important for negative CT-05 — must pick a username guaranteed not in the list.)
- **Q-I9-NEW** — Does the Servicing portal Schedule Payment UI expose an agent identity selector (so a human agent can submit a scheduling "on behalf of atlog-ai/level-ai")? Or is `agentUsername` always derived from the logged-in user?
  - If always derived from logged-in user → CT-01 / CT-03 need test users provisioned with usernames `atlog-ai` and `level-ai` (operator-style accounts).
  - If exposed in UI → straightforward picker.
- **Q-I10** — Test card / payment method known to be declined at processing in qa1 (for CT-14).

---

## Implementer Notes (hand-off to qa-implementer)

> Hand-off requires Q-B1-NEW, Q-B2..Q-B5, Q-B6 answers OR explicit user authorization to proceed under documented `[ASSUNÇÃO]`.

### Pre-implementation step (MANDATORY — CT-02 gating CT-01)

Before any artifact is created, the implementer MUST:

1. **DOM-first investigation** ([[dom-investigation]], regra #18) — login Servicing portal at **qa1** (override Djalma 2026-05-20) and locate the "Schedule Payment" / "Add Future Payment" affordance for a FUNDED account. Viewport ≥ 1440×900.
2. **Check `src/pages/servicing/**`** for existing payment-related page objects ([[page-objects-catalog]]); reuse before creating new.
3. **Check `src/api/svc/**`** for existing payment clients; the project may already have a partial `SvcPaymentClient` — extend rather than duplicate.
4. **Consult svc source** ([[feedback_consult_svc_when_unsure]]) to identify the scheduled-payment processing mechanism (Q-B1-NEW): search `com.uownleasing.svc.service.UownPaymentService` and any `@Scheduled` or sweep classes.

### Suggested new artifacts

1. **`SchedulePaymentPage` page object** (per [[page-object-pattern]]) — Servicing portal account page payment scheduling form. Methods:
   - `goto(accountPk)`
   - `openScheduleForm()`
   - `fillScheduledPayment({ amount, date, agentUsername?, paymentType })`
   - `submit()`
   - `getBadgeForPayment(paymentPk): "Scheduled" | "Processed" | "Reversed" | "Failed"`
   - `clickReverse(paymentPk)`

2. **`SvcAgentPaymentClient`** — API client for setup acceleration / negative cross-checks (per [[api-client-pattern]]):
   - `POST /uown/svc/makePayment` → `makeAgentPayment(body)`
   - `POST /uown/svc/reversePayment` → `reverseAgentPayment(body)`
   - Reuses existing auth from `SvcAuthClient`. Header: `Authorization: <key>` (no "Bearer").
   - Used ONLY for: CT-NEG-IMMEDIATE, CT-10 (null username probe), CT-07 fallback if UI reverse not reachable, setup of CT-11 first-half (creating a payment with non-allow-listed agent).

3. **`SvcScheduledPaymentTriggerClient`** (gated on Q-B1-NEW) — if a test-trigger endpoint exists, this client forces the processing sweep in qa1 to avoid waiting clock time. If no endpoint exists, this artifact is replaced by a documented `[ASSUNÇÃO]` of wait-real-time (impractical for CI).

4. **`WebhookSiteClient`** — utility client for `webhook.site` API:
   - `getRequestsSince(inboxToken, sinceTimestamp): Promise<WebhookRequest[]>`
   - `getLatestRequest(inboxToken): Promise<WebhookRequest>`
   - Two known inbox URLs from `.env` (`WEBHOOK_SITE_ATLOG_URL`, `WEBHOOK_SITE_LEVEL_URL`).

5. **DB query helpers** in `src/helpers/outbound-api-log.helpers.ts`:
   - `waitForOutboundApiLog({ paymentPk, eventType, sinceTimestamp, timeoutMs })`
   - `countOutboundApiLogRows({ paymentPk, eventType })`
   - `waitForPaymentStatusTransition({ paymentPk, fromStatus, toStatus, timeoutMs })`

6. **Activity log helpers** in `src/helpers/activity-log.helpers.ts` (likely existing — check catalog):
   - `waitForAccountNote({ accountPk, contentPattern, sinceTimestamp })`

7. **Config drift checker** — extend the existing SQL config catalog (memory `reference_sqlconfig_admin_endpoint`):
   - Read-only verification of the 3 keys before any test.
   - Fail-fast with explicit drift listing.

### Test file location

Per [[test-plan-template]] naming:

- Folder: `docs/taskTestingUown/svc-vendor-payment-webhook-514/` (this folder)
- Spec file (here): `svc-vendor-payment-webhook-514-spec.md`
- Test code: `docs/taskTestingUown/svc-vendor-payment-webhook-514/svc-vendor-payment-webhook-514.spec.ts`
- Report (after run): `docs/taskTestingUown/svc-vendor-payment-webhook-514/svc-vendor-payment-webhook-514-report.md`

### Tags

`@webhook @svc @vendor @atlog-ai @level-ai @servicing-ui @regression`

Smoke-set adds `@smoke` to CT-01 (principal), CT-05 (negative manual), CT-NEG-IMMEDIATE only.

### Environment matrix

| Run | Env | Purpose |
|---|---|---|
| Dev iteration | **qa1** | Day-to-day (override Djalma 2026-05-20) |
| Pre-merge CI smoke | **qa1** | Blocker (CT-01, CT-05, CT-NEG-IMMEDIATE) |
| Pre-release full | **qa1** + stg | DoD validation (all P0 + P1) |
| Post-release | stg | Confidence run |

**qa1 outage mitigation.** If qa1 `sendApplication` outage (2026-05-18 / `project_dv360_uat_qa1_outage_2026_05_18`) persists, this feature can still run because the principal path is **Servicing portal** action against an existing FUNDED account — `sendApplication` is only needed for setup. Mitigation: maintain a pre-seeded FUNDED account fixture (documented `accountPk` in `.env` as `WEBHOOK514_FIXTURE_ACCOUNT_PK`); skip the `driveLeadToFunding` step when fixture is present.

---

## Hand-off

**Ready for:** `qa-implementer` — **CONDITIONAL** on:

1. **CT-02 (UI discovery) executed first** — implementer logs into Servicing portal qa1, locates Schedule Payment affordance, documents DOM. Without this, CT-01 cannot be built.
2. Yuri/Marcus answer Q-B1-NEW, Q-B2..Q-B5, Q-B6 (or explicit user direction to proceed with documented `[ASSUNÇÃO]`).
3. Q-B1-NEW resolution determines mechanism to trigger processing in qa1 (admin endpoint? scheduled sweep? wait clock?).
4. Q-I5 (webhook.site inbox provisioning) clarified — implementer cannot start without inbox URLs in qa1.
5. Q-I1 (`uown_sv_outbound_api_log` schema) verified via direct DB read on qa1.
6. Q-I9-NEW (UI agent identity selector) clarified — affects whether CT-01 / CT-03 need special test users.

After implementation runs: pipe to `qa-validator` → `qa-doc-keeper` (catalog the new `SchedulePaymentPage`, `SvcAgentPaymentClient`, `WebhookSiteClient`, outbound log helpers; add pitfalls discovered during DOM-first investigation).

---

## Cross-links

- Inviolable rules: #10 (test data hierarchy), #11 (conservative bug classification), #13 (merchant preflight — N/A direct), #14 (activity log = no log = nothing happened), #15 (UI-first — **this SPEC now follows UI-first**; API-only is documented exception only for CT-NEG-IMMEDIATE), #18 (DOM-first — CT-02 gating).
- Skills consulted: [[scope-analysis]], [[acceptance-criteria-review]], [[risk-based-prioritization]], [[test-strategy-decision]], [[test-design-techniques]], [[ui-first-principle]], [[qa-domain-reflexes]], [[activity-log-validation]], [[test-data-hierarchy]], [[payment-flows]], [[test-plan-template]], [[dom-investigation]], [[page-objects-catalog]].
- Memories applied: `project_dv360_uat_qa1_outage_2026_05_18` (Servicing payment likely unaffected — mitigation via fixture account), `feedback_float_repr_not_bug`, `feedback_no_db_mutation_to_force_pass`, `reference_sqlconfig_admin_endpoint`, `project_qa_task_structure`, `feedback_consult_svc_when_unsure` (Q-B1-NEW + Q-I1 svc source lookup), `feedback_payment_ui_first_servicing` (NEW — payment scheduling UI in Servicing), `project_svc_514_scheduled_payment_webhook` (NEW — feature context + Djalma corrections 2026-05-20), `feedback_email_imap_click_link` (if scheduling triggers customer email).

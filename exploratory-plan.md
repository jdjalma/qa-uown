# Exploratory Test Plan — UOWN Leasing

> **Methodology:** Session-Based Test Management (SBTM) · 60–90 min charters.
> **Scope:** Origination · Servicing · Customer (Website) · AMS · Sweeps · Cross-portal Journeys.
> **Premise:** complete functional coverage, prioritizing hotspots (CLAUDE.md Rules 13–16 + pitfalls #1–#19).
> **Version:** 0.3 · **Last updated:** 2026-05-12

---

## Index

- [Quick Start](#quick-start)
- [Heuristics Glossary](#heuristics-glossary)
- [Charter Index](#charter-index)
- [How to Use This Plan](#how-to-use-this-plan)
- [Risk Map](#cross-portal-risk-map)
- [§1. Origination Portal](#1-origination-portal-agent)
- [§2. Servicing Portal](#2-servicing-portal-agent)
- [§3. Customer Portal (Website)](#3-customer-portal-website)
- [§4. AMS Portal](#4-ams-portal-admin)
- [§5. Sweeps (Scheduled Jobs)](#5-sweeps-scheduled-jobs)
- [§6. Journeys (Cross-Portal)](#6-journeys-cross-portal)
- [Open Items (under discussion)](#open-items-under-discussion)
- [Coverage Matrix](#coverage-matrix)
- [Bug Reporting Template](#bug-reporting-template)
- [Maintenance & Changelog](#maintenance--changelog)

---

## Quick Start

**If you opened this plan to run a session today:**

1. **Pick a charter** from the [Charter Index](#charter-index) (filter by priority + available duration).
2. **Check global prerequisites** ([How to Use §3](#3-global-prerequisites)) — `.env`, viewport ≥ 1440×900, MCP Playwright, IMAP.
3. **Create the session note** from the template: `docs/test-plans/sessions/_template.md` → `sessions/{YYYY-MM-DD}-{CHARTER-ID}-{your-user}.md`.
4. **Execute** following `Areas` (checklist) → `Heuristics` → checking `Oracles` in parallel.
5. **Exit** when the `Exit criteria` are met. Report bugs via the [template](#bug-reporting-template).

**Suggested cadence:**
- **Release regression:** all P0 (~22h · 2 testers × 1 week)
- **Biweekly:** P0 + half of P1
- **Monthly:** complete plan

---

## Heuristics Glossary

Quick cards — referenced in the charters as `[SFDIPOT]`, `[Tour Money]`, etc.

| Tag | Heuristic | Summary |
|-----|-----------|--------|
| `[SFDIPOT]` | Structure / Function / Data / Interface / Platform / Operations / Time | Variation cube — vary 1-2 dimensions per session |
| `[CRUSSPIC]` | Quality attributes | Capability · Reliability · Usability · Security · Scalability · Performance · Installability · Compatibility |
| `[STMPL]` | Cross-cutting support | Supportability · Testability · Maintainability · Portability · Localizability |
| `[Tour Money]` | Money tour (Whittaker) | Paths where the money flows — financial error vectors |
| `[Tour Landmark]` | Landmark tour | Feature anchor points — visit them all before exploring paths |
| `[Tour Antisocial]` | Antisocial tour | Do the opposite of what's expected — refusals, cancels, abandonments |
| `[Tour OCD]` | Obsessive-compulsive | Repeat the same action 5-10× — detects non-determinism + memory leaks |
| `[Tour BackAlley]` | Back-alley tour | Rarely used features + forgotten edge cases |
| `[Tour AllNighter]` | All-nighter | Leave the feature running — timeouts, expirations, sweeps firing |
| `[Tour Saboteur]` | Saboteur | Break dependencies on purpose (deleted banking, expired token) |
| `[Galumphing]` | Malicious variation | Intentionally wrong but plausible input (Jr/Sr, accents, leading zero) |
| `[Hawthorne]` | Repeat to detect non-determinism | Run the same path 2× and compare the result |
| `[Boundary/EC]` | Boundary Value + Equivalence Class | 0 / 1 / max-1 / max / max+1; valid vs. invalid classes |

---

## Charter Index

> Owner = TBD means assignment pending. `Code` links to the existing page object / spec / API client when applicable.

### Origination (Agent)

| ID | Mission | P | Min | Owner | Code |
|----|--------|---|-----|-------|------|
| [ORI-01](#ori-01--fraud-and-scoring-pipeline-17-steps) | Fraud pipeline (17 steps) | P0 | 90 | TBD | `tests/api/origination/`, `src/api-clients/origination/` |
| [ORI-02](#ori-02--submission-and-missing-fields) | Submission + missing fields + CC auth | P0 | 60 | TBD | `src/api-clients/.../sendApplication.ts` |
| [ORI-03](#ori-03--three-program-modalities-13m--1316m--second-look) | Three modalities (13m / 13+16m / Second Look) | P0 | 90 | TBD | `.claude/context/shared/ssn-test-catalog.md` |
| [ORI-04](#ori-04--cc-authorization-and-signing-fees) | CC auth + signing fees + Buddy.insure | P0 | 60 | TBD | TBD |
| [ORI-05](#ori-05--merchant-management-preflight-and-ui-activity-log) | Merchant CRUD + preflight + UI activity log | P1 | 90 | TBD | `src/data/merchant-config-contract.ts` |
| [ORI-06](#ori-06--contract-generation-and-e-sign-routing) | Contract gen + SignWell/GowSign routing | P0 | 90 | TBD | `docs/external/gowsign/` |
| [ORI-07](#ori-07--leads-list-search-and-modification-history) | Leads list + merchant/location filters | P1 | 75 | TBD | TBD |
| [ORI-08](#ori-08--program-groups--statefrequency-configuration) | Program groups + state/frequency config | P1 | 90 | TBD | TBD |
| [ORI-09](#ori-09--funding-process) | Funding (SETTLEMENT → FUNDED → account) | P0 | 90 | TBD | TBD |
| [ORI-10](#ori-10--item-split-cart--approval) | Item Split (cart > approval) | P0 | 60 | TBD | TBD |
| [ORI-11](#ori-11--second-opportunity-whitelist-re-engagement) | Second Opportunity (whitelist re-engagement) | P1 | 60 | TBD | TBD |

### Servicing (Agent)

| ID | Mission | P | Min | Owner | Code |
|----|--------|---|-----|-------|------|
| [SVC-01](#svc-01--customer-search-and-account-overview) | Customer search v1/v2 + account view | P1 | 60 | TBD | TBD |
| [SVC-02](#svc-02--payment-arrangements-cc--ach--check) | Payment arrangements CC/ACH/Check | P0 | 90 | TBD | `tests/e2e/.../makeCcPaymentArrangement` |
| [SVC-03](#svc-03--due-date-adjustments) | Due date manual + TMS IVR | P1 | 60 | TBD | TBD |
| [SVC-04](#svc-04--settlement-payment-flow) | Settlement → SETTLED_IN_FULL | P0 | 90 | TBD | TBD |
| [SVC-05](#svc-05--frequency-change-with-rewindreplay) | Frequency change rewind/replay | P1 | 90 | TBD | TBD |
| [SVC-06](#svc-06--banking--bank-account-crud) | Bank account CRUD + soft delete | P1 | 60 | TBD | TBD |
| [SVC-07](#svc-07--contact-info-opt-out-ai-dncdnt) | Contact info, Opt Out AI, DNC/DNT | P1 | 60 | TBD | TBD |
| [SVC-08](#svc-08--auto-pay-and-rating-letter) | Auto-pay + rating letter regen | P1 | 60 | TBD | TBD |
| [SVC-09](#svc-09--refund--payment-reversal) | Refund / payment reversal | P0 | 90 | TBD | TBD |
| [SVC-10](#svc-10--payment-arrangement-lifecycle-edit--cancel--allocation) | Arrangement edit/cancel/allocation | P1 | 60 | TBD | TBD |

### Customer (Website)

| ID | Mission | P | Min | Owner | Code |
|----|--------|---|-----|-------|------|
| [WEB-01](#web-01--login--otp-flow) | Login + OTP freshness | P0 | 60 | TBD | `src/helpers/imap.helpers.ts` |
| [WEB-02](#web-02--account-dashboard-and-document-access) | Dashboard + doc download | P1 | 60 | TBD | TBD |
| [WEB-03](#web-03--make-payment-via-customer-portal) | Make payment via portal | P0 | 60 | TBD | TBD |
| [WEB-04](#web-04--contact-info-update) | Contact info update | P1 | 45 | TBD | TBD |
| [WEB-05](#web-05--settlement-offer-acceptance) | Settlement offer acceptance | P0 | 60 | TBD | TBD |
| [WEB-06](#web-06--notifications--email-templates-render-check) | Email templates render | P1 | 60 | TBD | TBD |

### AMS (Admin)

| ID | Mission | P | Min | Owner | Code |
|----|--------|---|-----|-------|------|
| [AMS-01](#ams-01--user-management-and-merchant-assignment) | User CRUD + merchant assignment | P1 | 60 | TBD | TBD |
| [AMS-02](#ams-02--merchant-programs-activation-dates-and-ui-log) | Programs activation dates + UI log | P0 | 90 | TBD | TBD |
| [AMS-03](#ams-03--email-template-administration) | Email template admin + preview | P1 | 60 | TBD | TBD |
| [AMS-04](#ams-04--fraud-blacklist-and-system-logs) | Fraud blacklist + system logs | P1 | 60 | TBD | TBD |
| [AMS-05](#ams-05--reporting--analytics) | Reporting & analytics | P2 | 60 | TBD | TBD |
| [AMS-06](#ams-06--blacklist-cc-bin-validation) | Blacklist with 6-digit CC BIN | P1 | 60 | TBD | TBD |
| [AMS-07](#ams-07--granular-permissions) | Granular permissions (matrix) | P0 | 90 | TBD | TBD |
| [AMS-08](#ams-08--bulk-associate-users-to-merchants) | Bulk associate users to merchants (Task #74) | P1 | 60 | TBD | TBD |
| [AMS-09](#ams-09--cleanup-endpoints) | Cleanup endpoints (3-month protection) | P2 | 45 | TBD | TBD |

### Sweeps

> **Official source:** `business-rules §34` — 74 sweeps across 13 categories.

| ID | Mission | P | Min | Owner | Code |
|----|--------|---|-----|-------|------|
| [SWP-01](#swp-01--sweep-admin--operations-tooling-api-only) | Sweep admin (pause/resume/trigger/logs) | P1 | 60 | TBD | TBD |
| [SWP-02](#swp-02--cc-payment-sweeps-matrix-3413417) | CC Payment Sweeps Matrix (§34.1–34.7) | P0 | 90 | TBD | TBD |
| [SWP-03](#swp-03--ach-payment-sweeps-matrix-3483414) | ACH Payment Sweeps Matrix (§34.8–34.14) | P0 | 90 | TBD | TBD |
| [SWP-04](#swp-04--fee-sweeps-34153416) | Fee Sweeps (§34.15–34.16) | P1 | 45 | TBD | TBD |
| [SWP-05](#swp-05--account-status-sweeps-34173420) | Account Status Sweeps (§34.17–34.20) | P0 | 60 | TBD | TBD |
| [SWP-06](#swp-06--email--sms-sweeps-matrix-34213430) | Email / SMS Sweeps Matrix (§34.21–34.30) | P0 | 90 | TBD | TBD |
| [SWP-07](#swp-07--document--e-sign-sweeps-34313435) | Document / E-Sign Sweeps (§34.31–34.35) | P0 | 60 | TBD | TBD |
| [SWP-08](#swp-08--tax-sweeps--taxcloud-34363439) | Tax Sweeps — TaxCloud (§34.36–34.39) | P1 | 60 | TBD | TBD |
| [SWP-09](#swp-09--protection-plan-sweep-3440) | Protection Plan Sweep (§34.40) | P1 | 45 | TBD | TBD |
| [SWP-10](#swp-10--delinquency--collections-sweeps-34413445) | Delinquency / Collections (§34.41–34.45) | P0 | 75 | TBD | TBD |
| [SWP-11](#swp-11--financial-reports-sweeps-34463459) | Financial Reports (§34.46–34.59) | P1 | 90 | TBD | TBD |
| [SWP-12](#swp-12--partner-reports-sweeps-34603462) | Partner Reports (§34.60–34.62) | P1 | 45 | TBD | TBD |
| [SWP-13](#swp-13--external-integrations-sweeps-34633465) | External Integrations (§34.63–34.65) | P1 | 60 | TBD | TBD |
| [SWP-14](#swp-14--monitoring-sweeps-34663469) | Monitoring Sweeps (§34.66–34.69) | P1 | 45 | TBD | TBD |

### Journeys (Cross-Portal)

| ID | Mission | P | Min | Owner |
|----|--------|---|-----|-------|
| [JNY-01](#jny-01--lease-lifecycle-happy-path-e2e) | Happy path lease lifecycle | P0 | 90 | TBD |
| [JNY-02](#jny-02--recovery-path-delinquency--settlement) | Delinquency → settlement | P0 | 90 | TBD |
| [JNY-03](#jny-03--risk-path-denials--second-look-retry) | Denials + Second Look retry | P1 | 60 | TBD |
| [JNY-04](#jny-04--cross-portal-data-consistency-audit) | Cross-portal consistency | P1 | 60 | TBD |

---

## How to Use This Plan

### 1. Charter Template

Each charter has:

- **Mission** — objective in 1 sentence
- **Duration / Priority**
- **Setup** — environment, data, accounts
- **Areas** — checklist (`[ ]`) of covered features
- **Heuristics** — reference to the [Glossary](#heuristics-glossary)
- **Oracles** — how to decide whether something is a bug
- **Focal risks** — pitfalls to chase
- **Bug bar** — what to report vs. observe
- **Cross-portal** — touchpoints (when applicable)
- **Exit criteria** — when the session is over

### 2. Reporting

- **Session notes:** copy `docs/test-plans/sessions/_template.md` → `sessions/{YYYY-MM-DD}-{charter-id}-{tester}.md`
- **Bugs:** follow [`bug-classification-rules.md`](../../.claude/context/shared/bug-classification-rules.md) — `[OBSERVATION]` → `[HYPOTHESIS]` → `[CONFIRMED]`. Reproduction in fresh data is mandatory
- **Activity Log:** absence = bug (Rule #14)
- **DOM-first** on selector failure (Rule #16) — MCP Playwright before touching the selector
- **UI-first** (Rule #15) — features with UI explored via browser

### 3. Global Prerequisites

- `.env` configured for the target environment (sandbox / qa1 / qa2 / stg)
- Access to the 4 portals with active users (agent + admin + customer demo)
- `AUTO_HEAL_MERCHANT=true` for Origination charters that create an application
- Minimum viewport **1440×900** (Bootstrap `d-lg-block` hides elements below it)
- MCP Playwright available for selector investigation
- IMAP Gmail configured for OTP polling (Website charters)
- Read-only DB access (validation queries)
- Access to the project's GitLab issues (to check regressions before classifying as a bug)

### 4. Integration with Existing Automation

| When | Use |
|--------|-----|
| Session revealed a new scenario to automate | Pipeline `/qa-flow` or `new-flow` (CLAUDE.md §Pipeline Types) |
| Session found a flaky test | Pipeline `debug` → `subagent-debug-flaky` |
| Session needs a new page object | Pipeline `new-page-object` |
| Catalogs of existing code | [`page-objects-catalog.md`](../../.claude/context/shared/page-objects-catalog.md) · [`api-clients-catalog.md`](../../.claude/context/shared/api-clients-catalog.md) · [`helpers-catalog.md`](../../.claude/context/shared/helpers-catalog.md) |

### 5. Prioritization

| Priority | Criterion | Cadence |
|------------|----------|----------|
| **P0** | Blocks revenue or violates compliance (signing, payment, settlement, funding) | Every release |
| **P1** | Degrades the main experience (dashboards, contracts, merchant setup) | Biweekly |
| **P2** | Secondary path (admin tooling, reports, edge cases) | Monthly |
| **P3** | Cosmetic / nice-to-have | Quarterly |

---

## Cross-Portal Risk Map

| Hotspot | Affected Portals | Charter(s) |
|---------|------------------|------------|
| Pitfall #1 (email reuse → DataMismatch) | Origination | ORI-01, ORI-02 |
| Pitfall #3 (VISA BIN 5146 → rollback) | Origination | ORI-04 |
| Pitfall #10 (merchant drift mid-test) | Origination + AMS | ORI-05, AMS-02 |
| Pitfall #11 (FK rollback CC settlement plural) | Servicing | SVC-04, SVC-09 |
| Pitfall #15 (`is_active` vs. dates) | Origination + AMS | AMS-02, ORI-05 |
| qa2 SSN 401 (token refresh) | Origination | ORI-01 |
| Silent Activity Log (Rule #14) | ALL | ALL |
| Brand mismatch UOWN ↔ Kornerstone | Origination + Servicing + Website | ORI-03, SVC-08, WEB-06 |
| GowSign vs. SignWell rollout | Origination + Customer | ORI-06, WEB-02 |
| Async rating letter regen | Servicing + Website | SVC-08, WEB-03 |
| Refund idempotency / double-refund | Servicing | SVC-09 |
| Arrangement × auto-pay double charge | Servicing | SVC-10 |
| Activity log in DB without appearing in the UI | Origination + AMS | ORI-05, ORI-08, AMS-02 |
| State/frequency config not propagating to eligibility | Origination | ORI-08 |
| Group delete leaving orphaned programs | Origination | ORI-08 |
| Double funding / FUNDED without account in Servicing | Origination + Servicing | ORI-09 |
| Cross-merchant data leak via leads filter | Origination | ORI-07 |
| Sweep paused without alert in prod | Sweeps | SWP-01 |
| Non-idempotent sweep (double processing after resume) | Sweeps | SWP-02..SWP-14 |
| CC double charge in IdempotentCCSweep (TIMEOUT) | Sweeps | SWP-02 |
| PayWallet XLSX processed 2× | Sweeps | SWP-03 |
| Cross-merchant leak in partner reports | Sweeps | SWP-12 |
| Skit.ai receives non-delinquent customer | Sweeps | SWP-10 |
| TaxCloud double submission | Sweeps | SWP-08 |
| Duplicated Kornerstone import | Sweeps | SWP-13 |
| Item Split double charge PURCHASE_NOW | Origination | ORI-10 |
| Whitelist without creditLimit approving by default | Origination | ORI-11 |
| User with wrong permission accesses SSN/DOB | AMS | AMS-07 |
| Bulk addMerchantsToUsers lossy (non-additive) | AMS | AMS-08 |
| Cleanup deleting recent data (< 3 months) | AMS | AMS-09 |
| BIN duplicate or wrong size accepted | AMS | AMS-06 |

---

## §1. Origination Portal (Agent)

### ORI-01 — Fraud and Scoring Pipeline (17 steps)
- **Mission:** explore the 17-step pipeline to discover silent denials or undue approvals
- **Duration:** 90 min · **Priority:** P0
- **Setup:** active merchant (13m + 16m programs); SSNs from `ssn-test-catalog.md` (APPROVED, DENIED, FPD, BLACKLIST, DUPLICATE); 5 unique emails per run
- **Areas:**
  - [ ] State Check · Merchant Auto-Deny · Blacklist · DataMismatch · Previous Leads
  - [ ] UW Denied · FPD Check · Duplicate · Reapproval · NeuroID
  - [ ] Underwriting · Invoice Placeholder · Max Approval · Cost Comparison
  - [ ] Item Split · Calculator
  - [ ] Error log entry for each step (`uown_los_lead_notes`)
- **Heuristics:** `[SFDIPOT]` on State (CA/CO/NY/TX) × Function (apply/resubmit) × Data (age, income) × Time (token refresh boundary) · `[Galumphing]` duplicate SSN within 30s · `[Hawthorne]` same SSN 2× to check non-determinism
- **Oracles:** `uown_los_lead_notes` with an entry for each step; final lead status consistent with the catalog SSN; error log with masked CC
- **Focal risks:** Pitfall #1 (email reuse), Pitfall #2 (missing `getMissingFields`), qa2 SSN 401, silent NeuroID timeout
- **Bug bar:** denial without an entry in `uown_los_lead_notes` = P0; approval without an `UnderwritingStep` step = P0 critical
- **Exit criteria:** all catalog SSNs tested; `SSN × state × expected vs. actual` matrix filled in; bugs reported or absence of bugs documented

### ORI-02 — Submission and Missing Fields
- **Mission:** discover missing validations in the `sendApplication → getMissingFields → submitApplication` flow
- **Duration:** 60 min · **Priority:** P0
- **Setup:** fresh application per iteration; CCs from `constants.ts` (MASTERCARD_APPROVED only; **avoid BIN 5146 VISA**)
- **Areas:**
  - [ ] Missing data form · `planId` selection · `merchantProgramPk`
  - [ ] CC authorization · cardholder name match
  - [ ] HTTP 400/500 with a clear message (no stack trace)
  - [ ] Skipping `getMissingFields` → expected error
- **Heuristics:** `[Galumphing]` (planId from another merchant, nonexistent merchantProgramPk, CC with a different name) · `[Boundary/EC]` (0 / 1 / max char)
- **Oracles:** specs in `application-lifecycle-protocol.md`
- **Focal risks:** Pitfall #2, Pitfall #3 (VISA rollback), Pitfall #5 (Kornerstone without banking)
- **Bug bar:** stack trace exposed to the agent = P1 security/UX; field silently ignored = P0
- **Exit criteria:** Pitfall #2/#3/#5 confirmed or refuted; error messages audited

### ORI-03 — Three Program Modalities (13m / 13+16m / Second Look)
- **Mission:** validate the three program paths and the UOWN vs. Kornerstone brand
- **Duration:** 90 min · **Priority:** P0
- **Setup:** SSN 100000053 (Second Look) + TireAgent CA merchant; active Kornerstone merchant; pure UOWN 13m merchant
- **Areas:**
  - [ ] Plan selection 13m only (UOWN)
  - [ ] Plan selection 13+16m (Kornerstone)
  - [ ] Second Look retry (denial 13m → preview 16m → resubmit with banking → approval 16m)
  - [ ] Brand: footer, logo, email sender, contract PDF consistent with `company`
  - [ ] Term display (13/16), processing fee, amount at signing
- **Heuristics:** `[Tour Landmark]` brand (footer/logo/email/PDF) · `[Tour Money]` each modality
- **Oracles:** `uown_sv_account.company`, contract template, email copy
- **Focal risks:** brand mismatch (UOWN footer on Kornerstone), Pitfall #5
- **Bug bar:** crossed brand = P1 visual; Second Look denial on SSN 100000053 stg = P0
- **Exit criteria:** 3 modalities tested E2E; brand audited across the 4 artifacts (footer, email, PDF, header)

### ORI-04 — CC Authorization and Signing Fees
- **Mission:** explore signing fee charging and cardholder validation
- **Duration:** 60 min · **Priority:** P0
- **Setup:** merchant with a Protection Plan (TireAgent/BW13); CCs APPROVED / DECLINED / 3DS / EXPIRED
- **Areas:**
  - [ ] `/authorizeCreditCard` happy path
  - [ ] Charge idempotency (2× same auth → 1 charge)
  - [ ] Cardholder name match (accents, hyphen, Jr/Sr)
  - [ ] Buddy.insure widget rendering
  - [ ] CC masking in the error logs
- **Heuristics:** `[Tour Money]` · `[Galumphing]` replay attack · `[Tour Saboteur]` BIN 5146
- **Oracles:** single charge in the gateway log; signing fee applied once in the ledger
- **Focal risks:** Pitfall #3, double-charge on retry, CC log without masking
- **Bug bar:** **PAN/CVV in log = P0 critical security (immediate escalation)**
- **Exit criteria:** signing fees audited; no sensitive data in logs

### ORI-05 — Merchant Management, Preflight and UI Activity Log
- **Mission:** discover merchant config drifts AND validate that each change appears in the UI "Activity Log" section
- **Duration:** 90 min · **Priority:** P1
- **Setup:** dedicated merchant; `merchant-config-contract.ts` as the spec
- **Areas:**
  - [ ] Merchant CRUD (add, clone, edit, ref code, inventory category, location)
  - [ ] Money Factor display, pagination after clone
  - [ ] Program assignment (add 0/1/N, remove, reorder, idempotency)
  - [ ] Add a program without `addProgramsToMerchant` (Pitfall #14)
  - [ ] **UI Activity Log:** entry for each edit (`MERCHANT_EDITED`, `PROGRAM_ADDED`, `PROGRAM_REMOVED`, `PROGRAM_DATA_CHANGE`) with old→new diff
  - [ ] Log filters in the UI (type, date, agent)
  - [ ] 1:1 cross-check SQL ↔ UI
- **Heuristics:** `[Hawthorne]` preflight before/after drift · `[Tour Saboteur]` `AUTO_HEAL_MERCHANT=false` → fail-fast
- **Oracles:** `uown_merchant_activity_log` with `log_type='PROGRAM_DATA_CHANGE'`; UI Activity Log section
- **Focal risks:** Pitfall #10, #14, #15; entry in DB without appearing in the UI
- **Bug bar:** drift without activity log = P0 (Rule #14); DB without UI = P0 (Rule #15); removal without an entry = P0 compliance
- **Exit criteria:** all edit types tested; log audited UI+DB on each one

### ORI-06 — Contract Generation and E-Sign Routing
- **Mission:** validate contract generation and SignWell ↔ GowSign ↔ PandaDoc routing
- **Duration:** 90 min · **Priority:** P0
- **Setup:** merchants with each signer; states CA/CO/NY (partial GowSign rollout)
- **Areas:**
  - [ ] SENT → SIGNED transition
  - [ ] SENT → ERROR/EXPIRED/CANCELLED transitions
  - [ ] Merchant redirect URL post-signature
  - [ ] postMessage in merchant iframes
  - [ ] CC Peek consent extraction
  - [ ] Placeholders in the rendered PDF (BUG-01 Daniel's Jewelers)
- **Heuristics:** `[SFDIPOT]` signer × state × merchant brand · `[Tour Antisocial]` cancel mid-signing
- **Oracles:** `gowsign-templates`, `uown_template.template_content`, final redirect URL
- **Focal risks:** GowSign rollout (memory `project_gosign_rollout`), empty placeholder in the PDF
- **Bug bar:** empty placeholder rendered = P0 (Rule #15, UI-first)
- **Exit criteria:** signer × state matrix covered; PDFs opened and visually validated

### ORI-07 — Leads List, Search and Modification History
- **Mission:** explore filters (including merchant + location), pagination and history
- **Duration:** 75 min · **Priority:** P1
- **Setup:** account with >100 leads across 5+ merchants and 10+ locations
- **Areas:**
  - [ ] Basic filters: status, SSN last 4, email, invoice, DOB, phone
  - [ ] Merchant filter (single + multi-select)
  - [ ] Location filter (dependent on the merchant)
  - [ ] Merchant + location combination
  - [ ] Merchant/location columns visible and sortable
  - [ ] Pagination + sort stability
  - [ ] Modification history + Open-to-Buy tracking
- **Heuristics:** `[Boundary/EC]` 0/1/N results · `[Tour BackAlley]` location without merchant; homonyms
- **Oracles:** `WHERE merchant_pk=X AND location_pk=Y` matches the UI
- **Focal risks:** cross-merchant data leak; sort breaking pagination; location from A in leads of B
- **Bug bar:** filter hiding a record = P0; cross-merchant leak = P0 security
- **Exit criteria:** all filter combinations tested; SQL ↔ UI consistency audited

### ORI-08 — Program Groups & State/Frequency Configuration
- **Mission:** explore groups (folders), per-state visibility config and frequency support
- **Duration:** 90 min · **Priority:** P1
- **Setup:** merchant with ≥3 programs; pool of states (CA, CO, NY, TX, WI)
- **Areas:**
  - [ ] Program Groups: create, rename, delete (empty + with programs)
  - [ ] Move a program between groups · clone group · pagination within the group
  - [ ] State whitelist/blacklist per program
  - [ ] State restrictions (CA money factor cap, NY frequency BI_WEEKLY-only, WI banking)
  - [ ] Program with 0 states → eligibility blocked?
  - [ ] Frequency support per state (WEEKLY/BI_WEEKLY/SEMI_MONTHLY/MONTHLY)
  - [ ] UI Activity Log of the program (not just the merchant)
- **Heuristics:** `[Galumphing]` disable all states; delete a group with programs · `[Tour Saboteur]` change state and try to apply from a just-removed state
- **Oracles:** `uown_merchant_program` columns; activity log DB+UI; eligibility query in Origination
- **Focal risks:** stale cache; group delete leaving orphans; frequency change not propagating
- **Bug bar:** state removed but application approved = P0 compliance; orphans = P0 data integrity
- **Exit criteria:** group CRUD tested; state × frequency matrix covered; UI activity log audited

### ORI-09 — Funding Process
- **Mission:** explore SETTLEMENT → FUNDING → FUNDED, ensuring correct money flow, fees, retries and activity log
- **Duration:** 90 min · **Priority:** P0
- **Setup:** SETTLEMENT lead (signed contract, signing fee paid, settlement payment confirmed); merchant with valid banking; access to the funding batch
- **Areas:**
  - [ ] Status transitions SETTLEMENT → FUNDING → FUNDED → ACTIVE
  - [ ] Funding batch (manual vs. sweep)
  - [ ] Calculation: approved − processing fee − protection plan − holdback
  - [ ] Destination banking validated; merchant without banking → clear block
  - [ ] Retries on ACH bounce / invalid routing / suspended merchant
  - [ ] Account creation after FUNDED (Servicing) + welcome email
  - [ ] UI Activity Log for each transition (with value, batch_id, timestamp)
  - [ ] Funding report in AMS matches transactions
- **Heuristics:** `[Tour Money]` each step · `[Hawthorne]` run 2× for the same lead (idempotency) · `[Tour Saboteur]` pause `FundingSweep` → create SETTLEMENT → resume (catch-up)
- **Oracles:** `uown_los_lead` transitions; `uown_sv_account` created; `uown_funding_batch` entry; ACH log; email
- **Focal risks:** double funding; FUNDED without account; activity log missing on FAILED; Pitfall #5
- **Bug bar:** double funding = P0 financial; FUNDED without a Servicing account = P0 data integrity; suspended merchant funded = P0 compliance
- **Exit criteria:** happy path + failure + idempotency tested; account created and visible in Servicing/Website

### ORI-10 — Item Split (cart > approval)
- **Mission:** validate cart splitting when the cost exceeds the approval (financed items + PURCHASE_NOW)
- **Duration:** 60 min · **Priority:** P0
- **Source:** [`business-rules §31`](../business-rules/11-administracao.md)
- **Setup:** merchant with `isItemSplit=true`; valid CC for the purchase-now charge; default threshold $300
- **Areas:**
  - [ ] Cart with excess within the threshold → split suggested
  - [ ] Cart with excess above the threshold → split NOT offered
  - [ ] Merchant with `isItemSplit=false` → no split
  - [ ] Calculation: `purchaseTotal = sum of PURCHASE_NOW items`
  - [ ] Reduction of `merchandiseAmount` and `totalInvoiceAmount`
  - [ ] Separate CC SALE transaction for PURCHASE_NOW
  - [ ] Activity log `ITEM_SPLIT_APPLIED`
- **Heuristics:** `[Boundary/EC]` at the threshold ($299 vs $300 vs $301) · `[Tour Money]` each path
- **Oracles:** `uown_los_invoice.purchaseTotal`; gateway log; activity log
- **Focal risks:** double-charge on PURCHASE_NOW; wrong purchaseTotal calculation
- **Bug bar:** double charge = P0 financial; split above the threshold = P0 compliance
- **Exit criteria:** threshold boundary tested; happy + negative covered

### ORI-11 — Second Opportunity (whitelist re-engagement)
- **Mission:** validate the flow of re-engaging a blacklisted customer via selective whitelist
- **Duration:** 60 min · **Priority:** P1
- **Source:** [`business-rules §32`](../business-rules/11-administracao.md)
- **Different from Second Look** (Second Look = denial 13m → approval 16m; Second Opportunity = whitelist after charge-off/blacklist)
- **Setup:** customer with a previously charged-off OR blacklisted lead; history in `uown_los_blacklist`
- **Areas:**
  - [ ] View the history (blacklist reason, date, CLV)
  - [ ] Set `isWhitelisted=true` + reduced `creditLimit`
  - [ ] Application does not fall into BlacklistStep
  - [ ] Approval respects the reduced `creditLimit`
  - [ ] Try to apply an amount > creditLimit → block
  - [ ] `rtoAccountNumber` tracks the recurring customer
  - [ ] Revert whitelist → BlacklistStep returns
- **Heuristics:** `[Tour Money]` · `[Galumphing]` apply 1¢ over the limit
- **Oracles:** `uown_los_blacklist`; history preserved; activity log
- **Bug bar:** whitelist without `creditLimit` approving by default = P0 risk; erased history = P0 compliance
- **Exit criteria:** whitelist lifecycle + revert tested

---

## §2. Servicing Portal (Agent)

### SVC-01 — Customer Search and Account Overview
- **Mission:** validate TMS v1/v2 with consistent data and 100% transaction linkage
- **Duration:** 60 min · **Priority:** P1
- **Setup:** ACTIVE account with history (payments, due date moves, frequency change)
- **Areas:**
  - [ ] Search by phone / SSN last 4 / DOB
  - [ ] v1 vs. v2 consistency
  - [ ] Customer info view + accounts linked
- **Heuristics:** `[Boundary/EC]` SSN with 4 vs. more digits; spaces; leading zeros
- **Oracles:** consistent `customer_pk`; account count = DB count
- **Focal risks:** `/v2/customers/search` 500 qa2 (leadStatus SQL grammar)
- **Bug bar:** 500 on search = P0 if it affects the workflow
- **Exit criteria:** v1 and v2 covered with the same dataset; diff documented

### SVC-02 — Payment Arrangements (CC / ACH / Check)
- **Mission:** create an arrangement (NORMAL and SETTLEMENT) in each method and detect listener regressions
- **Duration:** 90 min · **Priority:** P0
- **Setup:** ACTIVE account with balance; CCs APPROVED + DECLINED; valid + invalid ACH; Check
- **Areas:**
  - [ ] Make Payment modal
  - [ ] One-time card entry
  - [ ] NORMAL vs. SETTLEMENT arrangement
  - [ ] `db.waitForPaymentArrangementStatus(SUCCESS)` listener
  - [ ] NSF fee + daily rerun
  - [ ] End date in the past / too far in the future → UX error
- **Heuristics:** `[SFDIPOT]` Method × Type × Frequency · `[Tour Money]`
- **Oracles:** `uown_sv_payment(PAID)`; activity log `PAYMENT_CREATED`; rating letter regenerated
- **Focal risks:** Pitfall #7 (timeout qa2), Pitfall #11 (FK rollback plural), Pitfall #9 (silent missing PAID)
- **Bug bar:** payment success without `uown_sv_payment(PAID)` = P0
- **Exit criteria:** Method × Type matrix covered; listener confirmed; activity log audited

### SVC-03 — Due Date Adjustments
- **Mission:** validate manual move (`moveDueDatesByDays`) and TMS IVR (`adjustNextDueDate`) without misaligning the schedule
- **Duration:** 60 min · **Priority:** P1
- **Setup:** account with 6+ future payments
- **Areas:**
  - [ ] Manual move by N days
  - [ ] TMS IVR adjust (offset or date)
  - [ ] History table (sort + pagination)
  - [ ] Activity log
- **Heuristics:** `[Boundary/EC]` move -30/+60/+365; go past end-of-lease
- **Oracles:** consistent future schedule; paginated history
- **Bug bar:** past schedule modified = P0; double entry in the history = P1
- **Exit criteria:** both methods tested; history validated

### SVC-04 — Settlement Payment Flow
- **Mission:** pay off via settlement → SETTLED_IN_FULL with ALL artifacts
- **Duration:** 90 min · **Priority:** P0
- **Setup:** delinquent account with an approved settlement offer
- **Areas:**
  - [ ] Settlement modal
  - [ ] CC charging (Pitfall #11 path)
  - [ ] Confirmation email
  - [ ] Final rating letter
  - [ ] Auto-pay turned off
- **Heuristics:** `[Tour Money]` plural vs. singular endpoint
- **Oracles:** `uown_sv_payment(PAID)` present; `SETTLED_IN_FULL`; email sent. **Do NOT force via UPDATE (memory `feedback_no_db_mutation_to_force_pass`).**
- **Focal risks:** Pitfall #9, Pitfall #11
- **Bug bar:** SETTLED_IN_FULL without a PAID row = P0 (Pitfall #9 regression)
- **Exit criteria:** real E2E payoff; all artifacts verified

### SVC-05 — Frequency Change with Rewind/Replay
- **Mission:** validate that a frequency change rebuilds the schedule without losing PAID
- **Duration:** 90 min · **Priority:** P1
- **Setup:** account with 3+ PAID + 6+ future
- **Areas:**
  - [ ] Frequency change modal
  - [ ] Reversal of future payments + replay
  - [ ] Paginated history
  - [ ] Rating letter during rewind
  - [ ] Auto-pay status after the change
- **Heuristics:** `[Hawthorne]` same change 2× · `[Tour Antisocial]` WEEKLY → MONTHLY (shrinks)
- **Oracles:** sum(paid) unchanged; new schedule respects end-of-lease
- **Bug bar:** PAID payment disappearing after rewind = P0 (data loss)
- **Exit criteria:** WEEKLY ↔ MONTHLY ↔ BI_WEEKLY transitions tested; data integrity confirmed

### SVC-06 — Banking & Bank Account CRUD
- **Mission:** add/delete/default on a bank account with soft delete
- **Duration:** 60 min · **Priority:** P1
- **Setup:** account without a bank account; existing default CC
- **Areas:**
  - [ ] Add bank modal (routing + account validation)
  - [ ] Default toggle CC ↔ ACH
  - [ ] Soft delete
  - [ ] Activity log
- **Heuristics:** `[Boundary/EC]` routing 9/10 digits; leading zeros · `[Galumphing]` switch default 3× quickly
- **Oracles:** bank with `is_deleted=true` absent from the UI but present in the DB
- **Bug bar:** PAN/account in log = P0 security
- **Exit criteria:** CRUD covered; soft delete confirmed in DB+UI

### SVC-07 — Contact Info, Opt Out AI, DNC/DNT
- **Mission:** validate phone/email update + opt-out flags (Task #505)
- **Duration:** 60 min · **Priority:** P1
- **Setup:** account with phone + email + opt-in by default
- **Areas:**
  - [ ] Edit primary contact (area code + phone)
  - [ ] Opt Out AI modal with reason
  - [ ] Send Podium Link + confirmation modal
  - [ ] Customer Portal Reminder
  - [ ] DNC + DNT flags with reason
- **Heuristics:** `[Boundary/EC]` phone 9/10/11 digits · `[Galumphing]` empty reason
- **Oracles:** activity log present for EACH flag/edit
- **Bug bar:** opt-out without activity log = P0 compliance
- **Exit criteria:** all editable fields tested; logs audited

### SVC-08 — Auto-pay and Rating Letter
- **Mission:** explore the auto-pay toggle, the removal-by-rating rule (C/P/M) and async regen
- **Duration:** 60 min · **Priority:** P1
- **Setup:** account with auto-pay ON and rating S
- **Areas:**
  - [ ] Auto-pay toggle (CC vs. ACH)
  - [ ] Rating letter regen after payment
  - [ ] CC Peek consent toggle
  - [ ] Degraded rating → auto-pay removed silently?
- **Heuristics:** `[Tour AllNighter]` force rating C via NSF sequence
- **Oracles:** rating letter PDF rendered (UI-first); activity log `AUTO_PAY_REMOVED`
- **Bug bar:** auto-pay removed without a log = P0; stale rating letter = P1
- **Exit criteria:** S → A → B → C transition exercised; auto-pay state audited

### SVC-09 — Refund / Payment Reversal
- **Mission:** explore total/partial refund CC + ACH + signing fees + settlements, validating idempotency, ledger, rating and activity log
- **Duration:** 90 min · **Priority:** P0
- **Setup:** ACTIVE account with a mix: CC NORMAL, ACH NORMAL, CC SETTLEMENT, Origination signing fee, Check POSTED/CLEARED
- **Areas:**
  - [ ] Total refund CC + partial CC (split)
  - [ ] Total refund ACH + timing window (before/after CLEARED)
  - [ ] Refund signing fee (Processing/Security/Protection Plan)
  - [ ] Refund settlement → does SETTLED_IN_FULL go back to ACTIVE?
  - [ ] Check: confirm there is NO refund button (reversal only)
  - [ ] Idempotency (2× quickly)
  - [ ] Activity log `PAYMENT_REFUNDED/REVERSED` (agent, reason, amount)
  - [ ] Customer email + Website reflects
- **Heuristics:** `[Tour Money]` each refund path · `[Galumphing]` refund > original; refund 0 · `[Saboteur]` refund followed by auto-pay on the same day
- **Oracles:** `uown_sv_payment` status REFUNDED; ledger = sum(paid) − sum(refunded); gateway with refund_id
- **Focal risks:** double refund; refund settlement without reverting status; missing activity log; Pitfall #11 analog
- **Bug bar:** **double refund = P0 financial (escalation)**; without a log = P0 compliance; PAN in log = P0 security
- **Exit criteria:** all methods × signing/settlement tested; idempotency confirmed

### SVC-10 — Payment Arrangement Lifecycle (Edit / Cancel / Allocation)
- **Mission:** explore edit, cancel, allocation strategy, long recurring, conflicts with auto-pay and degraded ratings
- **Duration:** 60 min · **Priority:** P1
- **Setup:** ACTIVE account with auto-pay ON; arrangement created (NORMAL, WEEKLY, 12 occurrences); secondary account rating C
- **Areas:**
  - [ ] Edit: frequency / end date / source / allocation strategy
  - [ ] Cancel: 0 / 3 / all PAID — refund of PAID?
  - [ ] Allocation: Principal-first vs. Fee-first vs. Default
  - [ ] Long recurring (26+ occurrences) — complete schedule
  - [ ] Auto-pay × arrangement conflict on the same day
  - [ ] Arrangement on a C/P/M account
  - [ ] Activity log with old→new diff
- **Heuristics:** `[Galumphing]` edit with 1 future remaining · `[Tour Antisocial]` NSF + edit before the rerun
- **Oracles:** consistent ledger; schedule = PAID + pending; correct auto-pay status
- **Bug bar:** double charge auto-pay + arrangement = P0 financial; allocation strategy not applied = P0
- **Exit criteria:** edit/cancel/allocation covered; auto-pay conflict validated

---

## §3. Customer Portal (Website)

### WEB-01 — Login + OTP Flow
- **Mission:** validate OTP E2E with freshness < 10min and IMAP polling
- **Duration:** 60 min · **Priority:** P0
- **Setup:** customer demo with Gmail IMAP; `IS_PRODUCTION` + `ENVIRONMENT_NAME` configured
- **Areas:**
  - [ ] Email/password login
  - [ ] OTP send + validation
  - [ ] Freshness < 10min
  - [ ] Resend OTP (cancels the previous one?)
  - [ ] Expired OTP retry
  - [ ] Race: two simultaneous logins
- **Heuristics:** `[Boundary/EC]` OTP 5/6/7 digits · `[Tour AllNighter]` wait 11min and try
- **Oracles:** OTP timestamp < 10min; only the latest is valid
- **Focal risks:** stale OTP (commit `4f30c0d` hardened freshness)
- **Bug bar:** old OTP accepted = P0 security
- **Exit criteria:** freshness window audited; resend behavior confirmed

### WEB-02 — Account Dashboard and Document Access
- **Mission:** post-login dashboard and doc download (contracts, receipts, rate quotes)
- **Duration:** 60 min · **Priority:** P1
- **Setup:** customer with an ACTIVE account; signed contract (GowSign + SignWell); PAID payments
- **Areas:**
  - [ ] Active accounts list
  - [ ] Summary card (account number, schedule, rating)
  - [ ] Document PDF download
  - [ ] Brand UOWN vs. Kornerstone in footer/header
  - [ ] Placeholders filled in the PDF
- **Heuristics:** `[Tour BackAlley]` document in another tab (cache)
- **Oracles:** data matches the Servicing agent view
- **Focal risks:** empty placeholder (BUG-01 Daniel's Jewelers), brand mismatch
- **Bug bar:** PDF with an empty placeholder = P0 visual (Rule #15)
- **Exit criteria:** docs opened visually; brand audited

### WEB-03 — Make Payment via Customer Portal
- **Mission:** CC/ACH payment initiated by the customer with email confirmation
- **Duration:** 60 min · **Priority:** P0
- **Setup:** account with balance; customer with CC/ACH on file
- **Areas:**
  - [ ] Make Payment form
  - [ ] CC + ACH selection
  - [ ] Amount validation (zero, > balance)
  - [ ] Receipt email
  - [ ] Reflects in Servicing
  - [ ] Mobile viewport (375×667)
- **Heuristics:** `[Galumphing]` double submit · `[Boundary/EC]` zero amount, > balance
- **Oracles:** `uown_sv_payment(PAID)`; receipt email; updated balance
- **Bug bar:** **double charge = P0 financial**
- **Exit criteria:** desktop + mobile covered; reflects in Servicing within < 2min

### WEB-04 — Contact Info Update
- **Mission:** customer updates phone/email reflecting in Servicing + confirmation
- **Duration:** 45 min · **Priority:** P1
- **Setup:** customer logged into an ACTIVE account
- **Areas:**
  - [ ] Phone area code + number
  - [ ] Email update
  - [ ] Format validation
  - [ ] Confirmation email
  - [ ] Activity log in Servicing
- **Heuristics:** `[Boundary/EC]` short/long phone · `[Galumphing]` email without `@`; double-click save
- **Oracles:** new phone/email in `uown_sv_customer`; activity log present; agent sees the update
- **Bug bar:** silent update = P1
- **Exit criteria:** changes propagated within < 2min; agent confirms

### WEB-05 — Settlement Offer Acceptance
- **Mission:** customer accepts/declines an offer created by the backend
- **Duration:** 60 min · **Priority:** P0
- **Setup:** delinquent account with an active settlement offer
- **Areas:**
  - [ ] Offer banner
  - [ ] Accept modal
  - [ ] Decline
  - [ ] CC for settlement
  - [ ] Receipt
  - [ ] Expired offer
- **Heuristics:** `[Tour Antisocial]` accept and cancel before paying
- **Oracles:** `uown_sv_payment(PAID, SETTLEMENT)`; `SETTLED_IN_FULL`; email
- **Focal risks:** Pitfall #11
- **Bug bar:** offer accepted without a charge = P0
- **Exit criteria:** accept + decline + expired tested

### WEB-06 — Notifications & Email Templates (Render check)
- **Mission:** audit the visual + content of emails (rating, payment, delinquency, settlement)
- **Duration:** 60 min · **Priority:** P1
- **Setup:** trigger each email type; open in Gmail
- **Areas:**
  - [ ] Template content + resolved placeholders
  - [ ] Brand UOWN vs. Kornerstone
  - [ ] `merchantLocationName` resolved
  - [ ] Contact info footer
  - [ ] Mobile rendering
- **Heuristics:** `[Tour Landmark]` compare the DB template with the rendered email (Pitfall #18, #19)
- **Oracles:** all placeholders resolved; correct brand
- **Bug bar:** literal `{{placeholder}}` in the email = P0 visual
- **Exit criteria:** N known templates × 2 brands audited

---

## §4. AMS Portal (Admin)

### AMS-01 — User Management and Merchant Assignment
- **Mission:** validate user CRUD, RBAC and "manage merchants"
- **Duration:** 60 min · **Priority:** P1
- **Setup:** admin with permission; pool of users and merchants
- **Areas:**
  - [ ] User list + create/edit/disable
  - [ ] Role assignment
  - [ ] Merchant search/select/delete
  - [ ] Password reset
  - [ ] Modal confirm/cancel (animations disabled)
- **Heuristics:** `[Boundary/EC]` 0/1/N merchants · `[Tour Saboteur]` remove the last merchant
- **Oracles:** after edit, the agent sees only the assigned merchants
- **Bug bar:** agent seeing an unassigned merchant = P0 security
- **Exit criteria:** RBAC validated; full user lifecycle tested

### AMS-02 — Merchant Programs, Activation Dates and UI Log
- **Mission:** activation/deactivation by dates (source of truth) and validate the Activity Log in the UI
- **Duration:** 90 min · **Priority:** P0
- **Setup:** merchant with 2+ programs; pause `ProgramActivationDeactivationSweep` (link SWP-01)
- **Areas:**
  - [ ] activation_date · deactivation_date · is_active (derived)
  - [ ] Pause/resume sweep
  - [ ] Post-resume reconciliation
  - [ ] UI Activity Log (`PROGRAM_DATA_CHANGE`) with old→new diff
  - [ ] Log filters (type, date, agent)
  - [ ] 1:1 cross-check SQL ↔ UI
- **Heuristics:** `[Galumphing]` `is_active=true` with a future `activation_date` (Pitfall #15) · `[Hawthorne]` 5 quick edits → 5 entries
- **Oracles:** `ProgramActivationUtils.isActiveOnDate` logic; activity log present
- **Focal risks:** Pitfall #12, #13, #14, #15; entry without UI
- **Bug bar:** program active outside the range = P0; DB without UI = P0 (Rules #14, #15)
- **Exit criteria:** all edit types audited in DB + UI

### AMS-03 — Email Template Administration
- **Mission:** preview + test send + edit + detect DB vs. repo divergence
- **Duration:** 60 min · **Priority:** P1
- **Setup:** list of known templates
- **Areas:**
  - [ ] Template viewer + placeholder list
  - [ ] Test send to inbox
  - [ ] Edit + save
  - [ ] Diff with the repo
  - [ ] Test send with Kornerstone vs. UOWN
- **Heuristics:** `[Tour Landmark]` compare `uown_template.template_content` with the repo version (Pitfall #18, #19)
- **Oracles:** template rendered in the inbox matches the preview
- **Bug bar:** unresolved placeholder on a test send = P0
- **Exit criteria:** N templates audited; mobile rendering confirmed

### AMS-04 — Fraud Blacklist and System Logs
- **Mission:** validate the blacklist (name/SSN/email/phone/address) and log auditing
- **Duration:** 60 min · **Priority:** P1
- **Setup:** pool of fictitious identities
- **Areas:**
  - [ ] Add/remove blacklist entry
  - [ ] Search blacklist
  - [ ] Effect on Origination (BlacklistStep)
  - [ ] System logs (auth, API, payment, email)
- **Heuristics:** `[Tour Money]` add entry → submit app → see denial
- **Oracles:** lead with a failed `BlacklistStep` step; activity log of add/remove
- **Bug bar:** inactive or non-removable blacklist = P0 compliance
- **Exit criteria:** full blacklist lifecycle; downstream effect confirmed

### AMS-05 — Reporting & Analytics
- **Mission:** validate report consistency (volume, approval rate, payment performance, revenue)
- **Duration:** 60 min · **Priority:** P2
- **Setup:** environment with volume (qa1/stg)
- **Areas:**
  - [ ] Application volume
  - [ ] Approval/denial rates
  - [ ] On-time vs. delinquent
  - [ ] Fees collected + revenue
  - [ ] Export CSV
- **Heuristics:** `[Tour Landmark]` cross-check with direct queries
- **Oracles:** sum of the reports = sum of the queries; CSV matches the UI
- **Bug bar:** discrepancy > 1% = P1 (revenue)
- **Exit criteria:** all main reports audited

### AMS-06 — Blacklist CC BIN Validation
- **Mission:** validate adding/removing blacklist entries by CC BIN (6 digits), including duplicate detection
- **Duration:** 60 min · **Priority:** P1
- **Source:** [`business-rules §30`](../business-rules/11-administracao.md)
- **Setup:** AMS with blacklist permission; pool of valid/invalid BINs
- **Areas:**
  - [ ] Valid 6-digit BIN (add/remove)
  - [ ] BIN 5/7/8 digits → blocked with a message
  - [ ] Duplicate BIN → blocked
  - [ ] Downstream effect: application with a CC starting with the BIN → BlacklistStep failed
  - [ ] Search blacklist by BIN
  - [ ] Activity log of add/remove
- **Heuristics:** `[Boundary/EC]` 5/6/7 digits · `[Galumphing]` BIN with letters
- **Oracles:** `uown_los_blacklist`; lead with `BlacklistStep=FAILED`
- **Bug bar:** wrong-size BIN accepted = P1; duplicate accepted = P1; downstream without effect = P0
- **Exit criteria:** 6-digit validation + duplicate + downstream audited

### AMS-07 — Granular Permissions
- **Mission:** validate the permission matrix (Servicing + Origination) per role/user — including `restricted.view.*`, `lead_status_*`, `payment.*`
- **Duration:** 90 min · **Priority:** P0
- **Source:** [`business-rules §49`](../business-rules/11-administracao.md)
- **Setup:** ≥4 users with distinct permission sets; pool of accounts + leads
- **Areas:**
  - [ ] `restricted.view.full.ssn` / `restricted.view.full.dob` (masking)
  - [ ] `restricted.view.partial.account_number` (account masking)
  - [ ] `restricted.view.servicing_redirect` (cross-portal)
  - [ ] `payment.create_or_update_ach_payment` / `payment.make_credit_card_payment` (payment actions)
  - [ ] `payment_transaction.reverse_payment` / `refund_payments` (refund/reverse)
  - [ ] `documents.edit_document` / `resend_stored_doc` / `delete_file`
  - [ ] `customer_information.*` (edit primary contact/info/banking/CC)
  - [ ] Origination: `move_to_servicing` / `change_lead_status` / `override_approval_amount` / `run_underwriting`
  - [ ] Special: `lead_status_to_expired` · `lead_status_denied_to_approved` · `lead_status_approved_to_signed`
  - [ ] `customers.view.internal_status` / `documents.view.internal_notes`
  - [ ] Tracking: `uown_login_attempt` records attempts
- **Heuristics:** `[Tour Saboteur]` user without permission tries a direct URL · `[Galumphing]` direct API call without permission
- **Oracles:** UI blocks the button; API returns 403; activity log of the denial
- **Bug bar:** **user without permission can perform the action = P0 security**; SSN/DOB exposed = P0 compliance
- **Exit criteria:** full permission × user matrix exercised

### AMS-08 — Bulk Associate Users to Merchants (Task #74)
- **Mission:** validate the `/associate-users-to-merchants` flow (additive) vs. the "Edit User Merchants" card (overwrite) and the Log Activity behavior
- **Duration:** 60 min · **Priority:** P1
- **Source:** [`business-rules §51`](../business-rules/11-administracao.md) (Task #74)
- **Setup:** users with pre-existing merchants; pool of merchants
- **Areas:**
  - [ ] `POST /user/addMerchantsToUsers` (bulk) — ADDITIVE operation
  - [ ] UI `/associate-users-to-merchants` (paginated tables, Bootstrap modal)
  - [ ] "Edit User Merchants" card on `/users/[username]` — OVERWRITE operation
  - [ ] Trigger edit mode: `span#EditUserMerchants-edit` removed from the DOM on entering
  - [ ] React Select `#merchants` in a portal (ArrowDown+Enter)
  - [ ] **Log Activity behavior:** bulk and edit do NOT generate an entry; only `PUT /user/{username}` generates "UPDATED user info"
  - [ ] Log Activity table: 4 columns (date, type, userId, notes) with `react-data-table-component`
  - [ ] Pagination `.rdt_Pagination` is a sibling of `.rdt_Table` (nth scoping)
  - [ ] Merchants table loads async after the users table
- **Heuristics:** `[Hawthorne]` bulk 2× without new merchants · `[Tour Saboteur]` edit to remove the last merchant
- **Oracles:** the user's merchant list via `GET /user/{username}`; activity log table in the UI
- **Focal risks:** bulk replacing (lossy) instead of additive; edit generating an undue log
- **Bug bar:** lossy bulk = P0 data integrity; PUT without a log = P1
- **Exit criteria:** both flows audited with correct log behavior

### AMS-09 — Cleanup Endpoints
- **Mission:** validate cleanup of old data with a 3-month protection
- **Duration:** 45 min · **Priority:** P2
- **Source:** [`business-rules §38`](../business-rules/11-administracao.md)
- **Setup:** non-prod environment; admin access
- **Areas:**
  - [ ] `DELETE /uown/cleanupLogEntries?to={date}` — removes API logs, correspondence logs, sweep logs, esign events
  - [ ] `DELETE /uown/cleanupFunctionalEntities?to={date}` — operational data
  - [ ] Protection: `to` date < today−3months is mandatory
  - [ ] Permission check (admin only)
  - [ ] Log of the operation (count deleted per table)
  - [ ] Performance: faster queries after cleanup
- **Heuristics:** `[Boundary/EC]` date = today, today−1d, today−3m, today−3m−1d, today−1y
- **Oracles:** affected tables with `count(*) WHERE created_date > {date}` = 0; logs with the count
- **Bug bar:** **recent data deleted = P0 data loss**; without a permission check = P0 security
- **Exit criteria:** 3-month boundary validated; all target tables confirmed

---

## §5. Sweeps (Scheduled Jobs)

> Sweeps are scheduled jobs that run outside the context of any portal. Failure is silent and affects multiple portals.
> **Official source:** [`business-rules §34`](../business-rules/11-administracao.md) — 74 sweeps across 13 categories.

### Endpoints

```
POST /uown/svc/triggerScheduledTask/{taskName}    — generic manual trigger
POST /uown/svc/pauseScheduledTask/{taskName}      — pause
POST /uown/svc/resumeScheduledTask/{taskName}     — resume
```

Some sweeps have a specific endpoint (shortcut). Complete catalog in [`manual-test-cases.md §5`](manual-test-cases.md#5-sweeps).

### Infrastructure

| Config | Default |
|--------|---------|
| Thread count | 5 |
| Thread size | 50 |
| Fetch size | 500 |
| Quartz Thread Pool | 25 |
| Persistence | Quartz JDBC (`qrtz_*`) |

### Universal post-trigger validation

1. `SELECT * FROM uown_sweep_logs WHERE sweep_name='{name}' ORDER BY created_date DESC LIMIT 5;`
2. `SELECT * FROM uown_alert WHERE sweep_name='{name}' AND created_date > now() - interval '1 hour';`
3. Category-specific table (see charters below)
4. **Activity log on the affected entity** (Rule #14) — the sweep log alone is not enough

### Sweeps Inventory (Canonical)

> **Source of truth:** `../svc/src/main/java/com/uownleasing/svc/service/BootstrapService.java` (`createScheduledTask(...)` calls) + `SWEEP_NAME` constants in `service/cc/*.java`. **Do NOT invent names in this table.** Programmatic extraction:
> ```bash
> grep -oP 'createScheduledTask\(\s*"\K[^"]+' ../svc/src/main/java/com/uownleasing/svc/service/BootstrapService.java | sort -u
> grep -rnE 'SWEEP_NAME\s*=' ../svc/src/main/java/com/uownleasing/svc/service/cc/
> ```
> Current total: **~74 sweeps** (71 in Bootstrap + `CCDailyScheduledDeniedRerun`, `IdempotentCCSweep`, `CCVintageRun`).
>
> **Important:** since `BootstrapService` uses `load.only.new.scheduled.tasks=true` (default), sweeps added to the code after the environment's first initialization may **not** exist at runtime — see BUG-2026-05-12-008 (e.g.: `refreshKountAccessTokenSweep` absent in dev3 despite being in Bootstrap).

#### Essential sweeps by category

| Category | Sweeps | Covering charter |
|-----------|--------|----------------------|
| **Token refresh** | `refreshKountAccessTokenSweep`, `refreshGdsAccessTokenSweep`, `refreshTrustPilotAccessKeySweep` | ORI-01 (token 401 workaround) |
| **Program lifecycle** | `ProgramActivationDeactivationSweep` | AMS-02 |
| **Lease lifecycle** | `checkLeadExpirationSweep`, `updateContractStatusSweep`, `eSignDocumentStatusSweep`, `getCompletedESignDocumentStatusSweep`, `chargeSigningFeeSweep` | ORI-06, JNY-01 |
| **CC payments (§34.1–34.7)** | `SendCreditCardPaymentsSweep`, `rerunCCPaymentsSweep`, `CCDailyScheduledDeniedRerun`, `delinquencyRerunCCPaymentsSweep`, `dailyDelinquencyRerunCCSweep`, `IdempotentCCSweep`, `CCVintageRun` | SWP-02 |
| **ACH payments (§34.8–34.14)** | `CreateScheduledACHPaymentsSweep`, `SendACHPaymentsSweep`, `getSendACHPaymentsStatusSweep`, `getStatusDatePaymentsListSweep`, `rerunACHPaymentsSweep`, `reverseAchPaymentsSweep`, `processPayWalletPaymentsSweep` | SWP-03 |
| **Fees** | `chargeSigningFeeSweep`, `CreateScheduledCreditCardPaymentsSweep` | SWP-04 |
| **Account status** | `paidOutAccountsSweep`, `paidInFullAccountEmailSweep`, `settledInFullAccountEmailSweep`, `paymentGatewayFixSweep` | SWP-05 |
| **Email/SMS** | `emailSweep`, `FirstPaymentReminderSweep`, `RecurringPaymentReminderSweep`, `customerPortalReminderSweep`, `delinquencyOfferEmailSweep`, `delinquencyReminderEmailSweep`, `latePaymentNoticeEmailSweep` | (to be defined SWP-Email) |
| **Stored doc** | `storedDocServiceSweep`, `storedDocSmsServiceSweep` | (to be defined) |
| **Bank verification** | `bankVerificationSweep` | (to be defined) |
| **Rating** | `removeRatingLetterSweep`, `redistributeDelinquentEpoPoolSweep` | SVC-08 |
| **Tax** | `dailyTaxCloudPaymentsSync`, `dailyTaxCloudRefundsSync`, `updateTaxRatesSweep`, `monthlyTaxReportSweep` | (to be defined) |
| **Misc operations** | `monitorSweep`, `checkSignedAndFundingLeaseCountSweep`, `UnutilizedApprovalSweep`, `progetDeviceLockingSweep`, `cancelProtectionPlanSweep`, `kornerstoneDailyImportSweep` | (to be defined) |
| **External reports** ⚠️ Do NOT enable in dev | `generateVerventOnBoardingFileSweep`, `sendLeaseDocsToBankSweep`, `sendDailyPaymentsSharepointSweep`, `sendDailyReportsToBBWheelsSweep`, `dailyFundingReportSharepointSweep`, `danielJewelersLeadReportSweep`, `weeklyFundingReportSweep`, `monthlyFundingReportSweep`, `dailyFundingReportSweep`, `dailyFundedReportSweep`, `dailyRefundReportSweep`, `dailyRefundedReportSweep`, `dailyAgentTransactionReportSweep`, `monthlyConsolidatedFundingReportSweep`, `pastDueEpoPoolAmountReportSweep`, `sendDailyBorrowingBaseReport`, `activeLeaseDailyReport`, `saleFileGenerationSweep`, `generateMerchantLeaseReport`, `generateExportBlacklistReport`, `generateDueDateMovesReport`, `generateDelinquencyReport`, `createSkitDelinquentFileSweep`, `createSkitDelinquentOfferFileSweep`, `rerunACHWeeklyReport` | (read-only catalog — they emit files/reports to external vendors: Vervent, SharePoint, BB Wheels, etc.) |

> **Structure:** 1 admin tooling charter (SWP-01) + 13 charters per business-rules §34 category (SWP-02 to SWP-14). Each charter includes the standard matrix: manual trigger + natural schedule + pos/neg precondition + idempotency + activity log + catch-up + failure mode.

### SWP-01 — Sweep Admin & Operations Tooling (API-only)
- **Mission:** validate admin tooling via REST API (`SvcSweepsController`). **There is no sweep admin UI in the portals** (Origination/Servicing/AMS) — every operation is via HTTP at `svc-{env}.uownleasing.com/uown/svc/*`. Confirmed on 2026-05-12 (jose, charter SWP-01 dev3).
- **Duration:** 60 min · **Priority:** P1
- **Setup:** svc API key (`Authorization` + `x-api-key` from `.env`); read-only DB for oracle queries; no need to log into a portal.
- **Endpoints (svc `SvcSweepsController.java`):**
  ```
  GET  /uown/svc/getAllScheduledTasks                  complete inventory
  GET  /uown/svc/getScheduledTaskByName/{name}         ⚠ silently filters is_active=true (see BUG-004)
  GET  /uown/svc/getAnyScheduledTaskByName/{name}      no is_active filter
  POST /uown/svc/triggerScheduledTask/{taskName}       manual trigger
  POST /uown/svc/pauseScheduledTask/{taskName}         pause
  POST /uown/svc/resumeScheduledTask/{taskName}        resume
  POST /uown/svc/rescheduleScheduledTask/{taskName}?cronTrigger=...
  POST /uown/svc/deleteScheduledTask/{taskName}        delete
  POST /uown/svc/createOrUpdateScheduledTask           body=ScheduledTask JSON
  ```
- **Areas:**
  - [ ] `getAllScheduledTasks` returns ~74 sweeps (cross-check with `BootstrapService.java`)
  - [ ] `getScheduledTaskByName/{active-name}` → 200 with a complete body
  - [ ] `getScheduledTaskByName/{paused-name}` → 200 with an **empty** body (ambiguous — see BUG-004)
  - [ ] `getScheduledTaskByName/{nonexistent}` → 200 with an empty body (same as paused!)
  - [ ] `getAnyScheduledTaskByName/{paused-name}` → 200 with a complete body (bypasses the filter)
  - [ ] `pauseScheduledTask` → `is_active=false` in the DB + Quartz `pauseJob` (`qrtz_triggers.trigger_state='PAUSED'`)
  - [ ] `resumeScheduledTask` → `is_active=true` + Quartz `resumeJob`. **Returns body `false` if the task does not exist** in the DB (see BUG-008)
  - [ ] `triggerScheduledTask` executes immediately; `last_trigger_time` updated; `uown_scheduled_task_run` gets an entry
  - [ ] **Idempotency:** 2 consecutive triggers → TWO executions (check for processing overlap via `uown_sweep_logs`). Bug-bar depends on the sweep.
- **Heuristics:**
  - `[Tour Saboteur]` pause a critical sweep → **THERE IS NO alert UI**; check whether there is a notification (Slack, ops email, external dashboard). Absence = ops gap.
  - `[Hawthorne]` trigger 2× quickly — compare `_run` table entries
  - `[Galumphing]` call with a nonexistent name vs paused — same response (200 empty) = API ambiguity
  - `[Cross-source]` compare `getAllScheduledTasks` (runtime) vs `BootstrapService.createScheduledTask(...)` (code) — sweeps in code but absent at runtime
- **Oracles (all DB-side, no UI):**
  - `SELECT scheduled_task_name, is_active, last_trigger_time, row_updated_timestamp FROM uown_scheduled_task WHERE scheduled_task_name=:name`
  - `SELECT trigger_state, next_fire_time FROM qrtz_triggers WHERE trigger_name=:name`
  - `SELECT sched_name, instance_name, last_checkin_time FROM qrtz_scheduler_state` (is Quartz alive?)
  - `SELECT * FROM uown_scheduled_task_run WHERE scheduled_task_pk=… ORDER BY ts DESC LIMIT 5`
  - `SELECT * FROM uown_sweep_logs WHERE sweep_name=:name ORDER BY created_date DESC LIMIT 10`
- **Focal risks:**
  - **No visual alert for a paused sweep** — main risk in prod
  - Sweeps in code but absent in the DB runtime (BUG-008)
  - `getScheduledTaskByName` 200/empty ambiguous across 3 scenarios (active+null, paused, nonexistent) — BUG-004
  - 2× concurrent trigger for payment sweeps = financial risk
- **Bug bar:**
  - Sweep in code but absent at runtime = P1 ops
  - `getScheduledTaskByName` 200 empty conflating 3 scenarios = P0 API UX
  - 2× trigger generating 2 concurrent executions of critical SQL = P0 financial risk (CC/ACH sweeps)
- **Cross-charter:** findings link to the per-category charters (SWP-02 to SWP-14).
- **Exit criteria:** 3 verbs (pause/resume/trigger) tested on ≥3 different sweeps; runtime inventory cross-checked with Bootstrap; 200/empty ambiguities documented with a reproducible curl.

### SWP-02 — CC Payment Sweeps Matrix (§34.1–34.7)
- **Mission:** validate 7 CC payment sweeps (SendCreditCardPaymentsSweep, rerunCCPaymentsSweep, CCDailyScheduledDeniedRerun, delinquencyRerunCCPaymentsSweep, dailyDelinquencyRerunCCSweep, IdempotentCCSweep, CCVintageRun)
- **Duration:** 90 min · **Priority:** P0
- **Setup:** pool of accounts: CC auto-pay due today + recently DENIED + TIMEOUT + delinquent
- **Areas:**
  - [ ] `sendCCPaymentsSweep` processes today's receivables
  - [ ] `rerunCCPaymentsSweep` retry with `numberOfTries>1`
  - [ ] `CCDailyScheduledDeniedRerun` rerun DENIED (excluding permanent errors)
  - [ ] `delinquencyRerunCCPaymentsSweep` attempts to charge past due
  - [ ] `IdempotentCCSweep` resolves TIMEOUT without double-charge
  - [ ] `CCVintageRun` on-demand (start/end date)
  - [ ] NSF fee created on failures
  - [ ] Activity log per affected account
  - [ ] Idempotency: 2× without a new precondition → 0 duplicated transactions
- **Heuristics:** `[Tour Money]` each path · `[Hawthorne]` 2× · `[Galumphing]` manual TIMEOUT via mock
- **Oracles:** `uown_sv_cctransaction` with the correct status; gateway log with a unique `charge_id`
- **Bug bar:** double charge = P0 financial; PAN in log = P0 security
- **Exit criteria:** 7 sweeps fired; idempotency confirmed

### SWP-03 — ACH Payment Sweeps Matrix (§34.8–34.14)
- **Mission:** validate 7 ACH sweeps (CreateScheduledACH, SendACH, getSendACHPaymentsStatus, getStatusDatePaymentsList, rerunACH, reverseAch, processPayWalletPayments)
- **Duration:** 90 min · **Priority:** P0
- **Setup:** accounts with ACH auto-pay + 1 with NSF; PayWallet XLSX file on SFTP `/pw/`
- **Areas:**
  - [ ] `createScheduledACHPaymentsSweep` creates `uown_sv_achpayment` SCHEDULED
  - [ ] `sendACHPaymentsSweep` sends to Profituity (status SENT)
  - [ ] `getSendACHPaymentsStatusSweep` queries APPROVED/DENIED/NSF
  - [ ] `rerunACHPaymentsSweep` rerun on failures
  - [ ] `reverseAchPaymentsSweep` reverses with allocations undone
  - [ ] `processPayWalletPaymentsSweep` reads XLSX → moves the file
  - [ ] Activity log + idempotency
- **Heuristics:** `[Tour Money]` · `[Tour Saboteur]` duplicated PayWallet file on SFTP
- **Oracles:** `uown_sv_achpayment`; SFTP files moved
- **Bug bar:** duplicated ACH = P0; PayWallet processed 2× = P0
- **Exit criteria:** complete ACH cycle + reverse + PayWallet

### SWP-04 — Fee Sweeps (§34.15–34.16)
- **Mission:** validate `chargeSigningFeeSweep` + `createScheduledCreditCardPaymentsSweep`
- **Duration:** 45 min · **Priority:** P1
- **Setup:** leads with a pending signing fee; CC auto-pay accounts due today
- **Areas:**
  - [ ] Signing fees processed
  - [ ] Scheduled CC payments created
  - [ ] Idempotency (cron every 2min — overlap risk)
  - [ ] Activity log
- **Bug bar:** double charge of the signing fee = P0 financial
- **Exit criteria:** both fired + idempotency

### SWP-05 — Account Status Sweeps (§34.17–34.20)
- **Mission:** validate 4 status sweeps (paidOutAccounts, checkLeadExpiration, updateContractStatus, removeRatingLetter)
- **Duration:** 60 min · **Priority:** P0
- **Setup:** zeroed-out account eligible for PAID_OUT; expired UW_APPROVED lead; SIGNED lead not funded; old account with a rating
- **Areas:**
  - [ ] `paidOutAccountsSweep` → status PAID_OUT
  - [ ] `checkLeadExpirationSweep` → lead EXPIRED
  - [ ] `updateContractStatusSweep` reflects account changes
  - [ ] `removeRatingLetterSweep` archives the old rating
  - [ ] Activity log on each transition
  - [ ] Idempotency
- **Bug bar:** PAID_OUT with balance ≠ 0 = P0; EXPIRED on a valid lead = P0
- **Exit criteria:** 4 transitions audited

### SWP-06 — Email / SMS Sweeps Matrix (§34.21–34.30)
- **Mission:** validate 10 email/SMS sweeps (emailSweep, FirstPaymentReminder, RecurringPaymentReminder, delinquencyOffer, delinquencyReminder, latePaymentNotice, UnutilizedApproval, customerPortalReminder, paidInFull, settledInFull)
- **Duration:** 90 min · **Priority:** P0
- **Setup:** customer inboxes via IMAP; pool of varied accounts
- **Areas:**
  - [ ] Each of the 10 sweeps fires the correct email
  - [ ] Resolved placeholders + correct brand (UOWN vs Kornerstone)
  - [ ] Idempotency (no duplicate email)
  - [ ] Activity log of the send
  - [ ] Cross-link with TC-WEB-008
- **Heuristics:** `[Tour Landmark]` brand check · `[Hawthorne]` run 2×
- **Bug bar:** literal placeholder = P0; duplicate email = P1; no activity log = P0 Rule #14
- **Exit criteria:** 10 emails delivered + brand audited

### SWP-07 — Document / E-Sign Sweeps (§34.31–34.35)
- **Mission:** validate 5 sweeps (storedDocService, storedDocSmsService, eSignDocumentStatus, getCompletedESignDocumentStatus, sendLeaseDocsToBank)
- **Duration:** 60 min · **Priority:** P0
- **Setup:** docs in queue; SignWell contract SENT; SIGNED lease ready for the bank
- **Areas:**
  - [ ] `storedDocServiceSweep` stores docs (status STORED)
  - [ ] `storedDocSmsServiceSweep` sends SMS with a link
  - [ ] `eSignDocumentStatusSweep` sync with SignWell/PandaDoc
  - [ ] `getCompletedESignDocumentStatusSweep` recognizes completed
  - [ ] `sendLeaseDocsToBankSweep` sends via SFTP/email (parameters `sendToBank` and `sendToVervent`)
  - [ ] Consistent `uown_sv_contract` status
- **Bug bar:** lease SIGNED externally but DB SENT after the sweep = P0 desync
- **Exit criteria:** bilateral sync SignWell ↔ DB confirmed

### SWP-08 — Tax Sweeps — TaxCloud (§34.36–34.39)
- **Mission:** validate 4 tax sweeps (dailyTaxCloudPaymentsSync, dailyTaxCloudRefundsSync, updateTaxRates, monthlyTaxReport)
- **Duration:** 60 min · **Priority:** P1
- **Setup:** today's payments on accounts with tax; recent refunds; TaxCloud reachable (or mock)
- **Areas:**
  - [ ] Payments sync (10 threads)
  - [ ] Refunds sync (5 threads)
  - [ ] Update rates (last day of the month)
  - [ ] Monthly report (day 1)
  - [ ] Idempotency (no double submission)
- **Bug bar:** TaxCloud double submission = P1 compliance; rates not updated = P0
- **Exit criteria:** complete cycle + idempotency

### SWP-09 — Protection Plan Sweep (§34.40)
- **Mission:** validate `cancelProtectionPlanSweep` reading the Buddy Insurance CSV
- **Duration:** 45 min · **Priority:** P1
- **Setup:** CSV on SFTP `buddy/cancellations/`
- **Areas:**
  - [ ] Generic trigger OR with a specific file name
  - [ ] `uown_sv_protection_plan` + `uown_los_protection_plan` → CANCELLED
  - [ ] Email/notification to the customer
  - [ ] Activity log
- **Bug bar:** plan cancelled without a log = P0 compliance; continued charging after cancel = P0 financial
- **Exit criteria:** cancellations reflect in both tables

### SWP-10 — Delinquency / Collections Sweeps (§34.41–34.45)
- **Mission:** validate 5 sweeps (createSkitDelinquentFile, createSkitDelinquentOfferFile, redistributeDelinquentEpoPool, pastDueEpoPoolAmountReport, progetDeviceLocking)
- **Duration:** 75 min · **Priority:** P0
- **Setup:** varied delinquent accounts; SFTP Skit.ai; Proget (IoT/GPS)
- **Areas:**
  - [ ] Skit.ai files generated with the correct accounts
  - [ ] EPO pool rebalanced
  - [ ] Devices locked in Proget
  - [ ] No leak of non-delinquents in the files
  - [ ] Activity log
- **Bug bar:** non-delinquent customer in a Skit file = **P0 leak**; device of a paid account still locked = P0
- **Exit criteria:** files audited; lock/unlock tested

### SWP-11 — Financial Reports Sweeps (§34.46–34.59)
- **Mission:** smoke test of 14 financial report sweeps (funding daily/weekly/monthly, refund, agent transaction, borrowing base, active lease, ACH rerun, delinquency, due date moves, blacklist export, merchant lease)
- **Duration:** 90 min · **Priority:** P1
- **Setup:** environment with volume (qa1/stg); SharePoint; inbox for reports
- **Areas:**
  - [ ] Each of the 14 sweeps completes without error
  - [ ] Report delivered (email/SharePoint)
  - [ ] Cross-check with a direct query (funding report vs `uown_funding_batch`)
  - [ ] Idempotency (daily does not duplicate)
  - [ ] Blacklist export contains the current entries
- **Bug bar:** diff > 1% in a revenue report = P1; duplicated report in prod = P2 ops
- **Exit criteria:** all reports generated; cross-check consistency

### SWP-12 — Partner Reports Sweeps (§34.60–34.62)
- **Mission:** validate 3 sweeps (sendDailyReportsToBBWheels, danielJewelersLeadReport, saleFileGeneration)
- **Duration:** 45 min · **Priority:** P1
- **Setup:** transaction data per merchant; configured recipients
- **Areas:**
  - [ ] Each report delivered to the correct partner
  - [ ] No cross-merchant leak (Daniel Jewelers ≠ BB Wheels data)
  - [ ] Sale files generated correctly
- **Bug bar:** cross-merchant leak = **P0 security**
- **Exit criteria:** per-partner scope audited

### SWP-13 — External Integrations Sweeps (§34.63–34.65)
- **Mission:** validate 3 sweeps (generateVerventOnBoardingFile, kornerstoneDailyImport, refreshTrustPilotAccessKey)
- **Duration:** 60 min · **Priority:** P1
- **Setup:** data for Vervent onboarding; legacy Kornerstone system with data to import; TrustPilot API
- **Areas:**
  - [ ] Vervent onboarding file generated
  - [ ] Kornerstone import creates accounts (`company=KORNERSTONE`)
  - [ ] TrustPilot token renewed
  - [ ] Idempotency (no duplicated import)
  - [ ] Activity log on the imported Kornerstone accounts
- **Bug bar:** duplicated import = P0 data integrity; token not renewed = P1 (TrustPilot broken)
- **Exit criteria:** 3 integrations exercised

### SWP-14 — Monitoring Sweeps (§34.66–34.69)
- **Mission:** validate 4 sweeps (monitorSweep, paymentGatewayFix, checkSignedAndFundingLeaseCount, bankVerification)
- **Duration:** 45 min · **Priority:** P1
- **Setup:** system running; gateway with a simulated desync
- **Areas:**
  - [ ] Health check + metrics
  - [ ] Gateway desync corrected
  - [ ] Compliance count (signed + funding)
  - [ ] Invalid bank accounts flagged
  - [ ] Operational alerts on problems
- **Bug bar:** problems not alerted in prod = P0 ops
- **Exit criteria:** 4 monitoring sweeps exercised

---

## §6. Journeys (Cross-Portal)

### JNY-01 — Lease Lifecycle Happy Path (E2E)
- **Mission:** walk through the complete cycle approval → contract → account → payments → paid out
- **Duration:** 90 min · **Priority:** P0
- **Setup:** active merchant + APPROVED SSN + unique email + valid CC
- **Areas:**
  - [ ] Origination (apply/sign)
  - [ ] Customer (OTP/sign)
  - [ ] Servicing (account → payments)
  - [ ] Customer (receipts)
  - [ ] Settled
- **Oracles:** continuous activity log across portals; consistent `company`; consistent emails
- **Bug bar:** divergent data between portals = P0
- **Exit criteria:** complete lifecycle executed; cross-portal consistency audited

### JNY-02 — Recovery Path (Delinquency → Settlement)
- **Mission:** account becomes delinquent, receives offers, accepts settlement, closes
- **Duration:** 90 min · **Priority:** P0
- **Setup:** account provisioned as delinquent (fast-forward of dates in non-prod)
- **Areas:**
  - [ ] NSF reruns
  - [ ] Delinquency offers
  - [ ] Settlement creation
  - [ ] Customer acceptance via Website
  - [ ] Close
- **Oracles:** rating evolution S→A→B→C…; emails sent; settlement in the activity log
- **Bug bar:** offer not sent / not visible = P0
- **Exit criteria:** recovery E2E executed; each step logged

### JNY-03 — Risk Path (Denials + Second Look Retry)
- **Mission:** denial 13m → preview 16m → resubmit with banking → approval 16m
- **Duration:** 60 min · **Priority:** P1
- **Setup:** SSN 100000053 + TireAgent CA merchant (only stg validated)
- **Areas:**
  - [ ] First submit (deny 13m + preview 16m)
  - [ ] Second submit (banking)
  - [ ] Approval 16m
  - [ ] Kornerstone-style contract
- **Oracles:** clear denial reason; correct preview; approval logged
- **Bug bar:** Second Look path broken = P0
- **Exit criteria:** Second Look retry executed; Kornerstone brand audited

### JNY-04 — Cross-Portal Data Consistency Audit
- **Mission:** change data in one portal, verify it is reflected in the others
- **Duration:** 60 min · **Priority:** P1
- **Setup:** ACTIVE account + customer Website + agent Servicing + admin AMS
- **Areas:**
  - [ ] Phone update Website → Servicing
  - [ ] Merchant edit AMS → Origination
  - [ ] Program toggle AMS → applicant eligibility
- **Oracles:** change propagated within < 2min; activity log in each affected portal
- **Bug bar:** divergent data after 5min = P0 data integrity
- **Exit criteria:** 3 propagations tested; eventual consistency time measured

---

## Open Items (under discussion)

> Items **proposed but not confirmed** by the team. They are not in the matrix total until they receive `[CONFIRMED]`.

| # | Item | Origin | Status |
|---|------|--------|--------|
| OPEN-01 | **SVC-11 — Account Status Lifecycle & Transitions** (P0, 90 min): complete status matrix (ACTIVE/DELINQUENT/PAUSED/SETTLED_IN_FULL/PAID_OUT/CHARGED_OFF/REPO/CLOSED/RE_AGED), manual vs. automatic transitions, irreversible statuses | User question 2026-05-12 about "changing all statuses" | Awaiting confirmation |
| OPEN-02 | **Expansion of SVC-02** to include ad-hoc / one-time CC and ACH payment (outside an arrangement) | Same question | Awaiting confirmation |
| OPEN-03 | **Expansion of SVC-06** with permanent Add CC (persisted source), multiple CCs, default source toggle | Same question | Awaiting confirmation |
| OPEN-04 | **Expansion of SVC-07** with primary applicant edit (vs. contact), Trustpilot invite, PayNearMe link | Same question | Awaiting confirmation |
| OPEN-05 | **Expansion of SVC-08** with manual rating letter regen/override in Servicing Information | Same question | Awaiting confirmation |
| OPEN-06 | **Global rule:** EVERY Servicing/Origination/AMS charter requires explicit validation of the Activity Log in the UI (not just the DB) — add as a global prerequisite | Same question | Awaiting confirmation |
| OPEN-07 | **SWP-02 split:** ✅ RESOLVED in v0.4 — matrix split into SWP-02..SWP-14 (13 charters per §34 category) | Resolved | Closed |
| OPEN-08 | **Orphaned sweeps:** ✅ RESOLVED in v0.4 — all 74 official §34 sweeps covered in SWP-02..SWP-14 | Resolved | Closed |

---

## Coverage Matrix

| Portal | Charters | P0 | P1 | P2 | Total duration |
|--------|----------|----|----|----|---------------|
| Origination | 11 | 7 | 4 | 0 | 855 min (14.25h) |
| Servicing | 10 | 4 | 6 | 0 | 690 min (11.5h) |
| Customer (Website) | 6 | 3 | 3 | 0 | 345 min (5.75h) |
| AMS | 9 | 3 | 4 | 2 | 600 min (10h) |
| Sweeps | 14 | 5 | 9 | 0 | 855 min (14.25h) |
| Journeys (cross-portal) | 4 | 3 | 1 | 0 | 300 min (5h) |
| **TOTAL (confirmed)** | **54** | **25** | **27** | **2** | **~61h** |
| Pending Open Items | ~5 | ~2 | ~3 | 0 | ~5h (estimated) |

**Suggested cadence:**
- **Release regression:** all P0 (25 charters · ~30h) — 2 testers × 1 week
- **Biweekly:** P0 + half of P1
- **Monthly:** complete plan

---

## Bug Reporting Template

```
ID:                    BUG-{YYYY-MM-DD}-{seq}
Charter:               {ID of the charter where it appeared}
Classification:        [OBSERVATION] | [HYPOTHESIS] | [CONFIRMED]
Reproduction in fresh: YES/NO  (if NO → still HYPOTHESIS)
Severity:              P0 | P1 | P2 | P3
Portal:                Origination | Servicing | Website | AMS | Sweeps | Cross
Environment:           sandbox | qa1 | qa2 | stg | dev*
Steps:                 1. ...
Expected result:
Actual result:
Expected activity log: (present? does the content match?)
Evidence:              screenshots, DOM snapshot (MCP), trace, SQL query
```

See [`.claude/context/shared/bug-classification-rules.md`](../../.claude/context/shared/bug-classification-rules.md) for complete guidance.

---

## Maintenance & Changelog

**Plan owner:** QA lead (monthly review)
**Versioning:** this file in git; sessions in `docs/test-plans/sessions/`
**Sync with automation:** charters with automated E2E coverage must link the corresponding `tests/e2e/...spec.ts`

### When to update
- New pitfall discovered
- Feature shipped
- Charter became redundant
- New environment added
- Open Item promoted to a charter

### Changelog

| Version | Date | Change |
|--------|------|---------|
| 0.1 | 2026-05-12 | Initial version with 31 charters (4 portals + journeys) |
| 0.2 | 2026-05-12 | + SVC-09 (Refund) + SVC-10 (Arrangement Lifecycle) · matrix: 33 charters |
| 0.2.1 | 2026-05-12 | + ORI-08 (Program Groups + State Config) + ORI-09 (Funding) · expansions of ORI-05, ORI-07, AMS-02 with UI activity log · matrix: 35 charters |
| 0.3 | 2026-05-12 | **UX refactor:** TOC, Quick Start, Heuristics Glossary, Charter Index, `[ ]` checklists, Exit criteria, Open Items, changelog. **Sweeps moved to their own section** (§5) with SWP-01/SWP-02 (replacing the old AMS-04). AMS renumbered. Matrix: 36 charters. |
| **0.4** | **2026-05-12** | **Complete coverage based on [`business-rules/11-administracao.md`](../business-rules/11-administracao.md) (§30, §31, §32, §34, §38, §46, §49, §50, §51).** Sweeps restructured: SWP-02 generic matrix → **13 charters per category** (SWP-02..SWP-14) covering the **74 official sweeps** of §34. New charters: **ORI-10** (Item Split §31), **ORI-11** (Second Opportunity §32), **AMS-06** (Blacklist CC BIN §30), **AMS-07** (Granular permissions §49), **AMS-08** (Bulk merchants Task #74 §51), **AMS-09** (Cleanup endpoints §38). Risk map expanded with 13 new hotspots (cross-merchant leak, double processing per sweep category, etc.). Matrix: **54 charters** (was 36) · 25 P0 · ~61h. |
| **0.4.1** | **2026-05-12** | **Post-exploratory-execution fixes dev3:** (a) §5 sweeps inventory rewritten with the canonical list from `BootstrapService.java` (there were 14 fictitious names; now 74 real ones categorized); (b) SWP-01 explicitly marked as **API-only** — there is no sweep admin UI in any portal (confirmed in dev3 session SWP-01-jose); the charter now documents the REST endpoints of `SvcSweepsController.java` and 100% DB-side oracles. No matrix change. |

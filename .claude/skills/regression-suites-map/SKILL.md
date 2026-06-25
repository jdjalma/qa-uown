---
name: regression-suites-map
description: Use to decide WHICH regression suites a given PR / task / fix must trigger before merge. Map of existing suites (signing-regression, gowsign, ci/unified-flow, smoke, dual-brand) -> activation criteria (what code change activates which suite). Triggers when planning test scope for a fix, when the user asks "which tests should I run?", "which regression?", "do I need dual-brand coverage?", "do I just run smoke?", on PRs touching `src/api/clients/application.client.ts`, `MissingDataPanel`, Complete page, signing handler, GoSign templates, contract page, sendApplication payload.
disable-model-invocation: true
---

# Regression Suites Map

> **Authority boundary** (`docs/_docs-conventions.md` §7): this skill covers **WHICH SUITE TO RUN** — activation criteria, decision matrix. For canonical product rules that underpin the regression scope (signing routing, payment states, merchant config), run `node scripts/docs-tooling.mjs resolve gowsign-routing` (or `payments`, `merchant-config`) depending on the area of change. **Do not duplicate product criteria here** — they drift.

> Activation criteria by type of change. For a detailed inventory of suites, costs, and spec file listings, see [references/suites.md](references/suites.md).

## When to apply

Before marking a task as ready to merge. Apply when:
- The fix touches the submit handler (`submitApplication`, `MissingDataPanel`, Complete page)
- The fix touches a signing template (placeholders, layout, items purchased table)
- The fix touches the route/payload between svc and a vendor (GoSign, SignWell, DV360)
- qa-flow is being executed
- The user asks for the regression scope

Do NOT apply for: local bug fixes with no reach (a typo in a log, an isolated fixture refactor).

## Activation criteria (decision matrix)

### 1. Changed sendApplication / submit handler / Complete page / MissingDataPanel

**DUAL-BRAND + LEASE-EDIT MANDATORY:**
- Unified Flow E2E (UOWN TireAgent + Kornerstone KS3015) — EVERY scenario, not smoke
- `new-application.spec.ts` + `new-application-api.spec.ts`
- Lease-edit/re-issue CT: modify the invoice to be LARGER, re-submit, assert a single submit (useRef reset)
- UI-only — using the direct API for the Submit is forbidden
- Activity log + DV360 probe in qa1

### 2. Changed signing template / GoSign / Items Purchased

**DUAL-PROVIDER + MULTI-STATE:**
- Multi-state Signing Regression (47 states + 4 blocked)
- Visual diff SignWell vs GoSign (page 1 table, headers, placeholders, branding)
- COMPLETE GowSign suite (18 specs)
- SignWell regression — MANDATORY (coexistence, a refactor may regress)

### 3. Changed e-sign routing / provider detection

- Multi-state Signing Regression
- Check `uown_esign_document.client` per state (CA qa2=GOWSIGN, CA stg=SIGNWELL override, others=SIGNWELL fallback, NJ/VT/MN/ME=BLOCKED)
- INSTORE merchants use `merchant.state`, not the customer state — use ONLINE (TireAgent) for multi-state

### 4. Changed contract page (CC + bank + T&C + iframe)

- Unified Flow E2E
- `credit-card-decline-check.spec.ts` (14 decline cards)
- `seon-e2e-flow.spec.ts` if the SEON overlay is affected

### 5. Changed correspondence / email template

- `finalize-email-518-validation.spec.ts` — BOTH brands (UOWN + Kornerstone)
- Check brand -> template_name: UOWN=`FinalizePurchaseEmail`, KS=`KORNERSTONE_FinalizePurchaseEmail`
- Activity log + `uown_email_queue.template_name`

### 6. Changed modify-lease / cancel-lease / refund

- `paytomorrow-refund-flow.spec.ts` + `modify-lease.spec.ts` + `lease-cancellation.spec.ts` + API variants

### 7. Changed Protection Plan

- `protection-plan-cancellation.spec.ts`
- CA: PP not offered (regulatory restriction)
- Buddy widget loop in qa2 (3 clicks)

### 8. Changed sweep / scheduled task

- Manual trigger via API + DB validation `ORDER BY pk DESC LIMIT 1`
- Settled-In-Full: DOW-dependent window (Mon-Tue: -4d, Wed: -4/-3/-2, Thu-Fri: -2d)
- Email sweeps: `email-sweeps-servicing.spec.ts` (S1 settledInFull / S2 RecurringPaymentReminder / S3 FirstPaymentReminder)
- **Primary evidence = `uown_email_queue` (monotonic PK), NOT `uown_sweep_logs.number_of_records_processed`** (written AFTER processing; an immediate read returns 0). See [[payment-flows]] section "Email Sweep validation" + [[application-lifecycle]] pitfalls #87-#90
- `FirstPaymentReminderSweep` requires `sched_summary.first_payment_due_date` AND `receivable.due_date` aligned; `settledInFull` deduplicates same-day (Java)
- **Servicing sweep family (on disk, besides email):** `business-sweeps-`, `cc-rerun-sweeps-`, `document-dispatch-sweeps-`, `external-sync-sweeps-`, `payment-scheduling-sweeps-`, `report-sweeps-`, `funding-refund-report-content-sweeps-servicing.spec.ts`
- **RightFoot ACH balance-check (R1.53.0):** sweeps `DailyAchBalanceCheckSweep` / `RerunAchBalanceCheckSweep` (ACH creation via `DailyRerunAchCreationService`, event-driven). Trigger via `scheduledTask.dailyAchBalanceCheckSweep()` / `.rerunAchBalanceCheckSweep()`; evidence in `uown_right_foot_balance_check` (`status=SUCCESS`) + `uown_sv_achpayment.right_foot_balance_check_pk`. See [[payment-flows]] section RightFoot

### 9. Changed Servicing payments / allocation

- Unified Flow E2E Phase 6
- Allocation strategy via the Payment History "Update Payment" modal (NOT the CC Transactions pencil)

### 10. Changed SEON ID verification

- `seon-id-verification-bypass.spec.ts` (API) + `seon-e2e-flow.spec.ts` (Hybrid)

### 11. Changed website portal (OTP, payment, sidebar)

- `login-otp.spec.ts` + Unified Flow Phase 7

### 12. Changed merchant config / preflight

- Smoke per brand (UOWN + Kornerstone) + validate `ensureMerchantReady`

### 13. Changed snapshot / NeuroID-retry / sticky / receipt / RightFoot (R1.53.0)

| Signal | Suite / spec | Evidence |
|-------|--------------|-----------|
| Merchant-settings snapshot | `RU05.26.1.53.0_merchantSettingsSnapshotTracking` | `uown_los_lead_merchant_settings_snapshot` / `uown_sv_account_merchant_settings_snapshot` — preflight BEFORE approval ([[merchant-preflight]]); helpers `getLeadMerchantSettingsSnapshot`/`getAccountMerchantSettingsSnapshot` |
| npm_segment / tam_score | UW scores task | `uown_los_uwdata`/`uown_sv_uwdata` (helpers `getUwScoresByLeadPk`/`getSvUwScoresByAccountPk`) |
| NeuroID retry/simulate | `RU06.26.1.53.0_preventRepeatedNeuroIdCallsSigningRetry.spec.ts` | ⚠️ the repeated-call guard was **NOT merged** in R1.53.0 — do not assume skip |
| Sticky cancel/refund | sticky specs (sandbox-only) | `uown_sticky.recovery_status` + INTERNAL/SYSTEM log ([[activity-log-validation]]) |
| Receipt fees / You Save | receipt task | receipt: balance includes fees, "You Save" > 0 |
| RightFoot ACH rerun (#540) | see section 8 | `uown_right_foot_balance_check` |

## Pitfalls

| # | Pitfall | Rule |
|---|---------|------|
| 1 | Reducing Kornerstone to smoke when the fix affects submitApplication | Run EVERY scenario in BOTH brands |
| 2 | Forgetting lease-edit / re-issue | Always include a CT to modify the invoice + re-submit |
| 3 | Running only GoSign and ignoring SignWell | Coexistence: always include SignWell regression |
| 4 | Daniel's Jewelers CA bug missed for lack of a visual diff | Visual diff SignWell vs GoSign mandatory |
| 5 | INSTORE merchants break per-state parameterization | Use ONLINE merchants for multi-state coverage |
| 6 | Trusting STATE_MATRIX without env-aware helpers | Use `getGowsignStatesForEnv(env)`, not the constant directly |
| 7 | DV360 outage in qa1 masquerading as a code bug | Probe DV360 before qa-flow in qa1 |
| 8 | qa2 RBAC issue in getMerchantsByRefCode | Defensive try/catch + proceed pattern |
| 9 | Buddy widget loop in qa2 for Protection Plan | 3 clicks before it unblocks |
| 10 | multi-state-signing requires UI-first | submitPaymentInfoViaApi DROPPED |
| 11 | Skipping GoSign signing because "the iframe is flaky" | Use `installPostMessageRecorder` + `signGowSignInFrame` |

## Scope checklist (pre-merge)

- [ ] Changed sendApplication/submit/Complete/MissingDataPanel? -> DUAL-BRAND + LEASE-EDIT + UI-only
- [ ] Changed signing template? -> Multi-state + GowSign + SignWell + visual PDF diff
- [ ] Changed e-sign routing? -> Multi-state + INSTORE/ONLINE coverage
- [ ] Changed contract page? -> Unified + cc-decline + seon-e2e
- [ ] Changed correspondence/email? -> finalize-email + brand templates
- [ ] Changed refund/modify-lease? -> PT refund + cancellation suites
- [ ] Changed Protection Plan? -> PP cancellation + state-aware
- [ ] Changed sweep? -> Trigger + DB latest-row
- [ ] Changed Servicing payments? -> Unified Phase 6
- [ ] Changed SEON? -> API bypass + hybrid UI
- [ ] Changed website portal? -> website-otp + Unified Phase 7
- [ ] Changed merchant config? -> smoke per brand
- [ ] In qa1 with sendApplication? -> probe DV360
- [ ] Activity log validated? (CLAUDE.md rule 13)
- [ ] UI-first respected? (CLAUDE.md rule 14)
- [ ] Fresh data? (CLAUDE.md rule 9)

> Detailed inventory of suites, costs, spec files, and STATE_MATRIX: [references/suites.md](references/suites.md)

## Cross-links

- [[gowsign-knowledge]] — signing provider details
- [[fraud-vendors-knowledge]] — DV360 probe
- [[merchant-preflight]] — merchant config validation
- [[payment-flows]] — payment endpoint details
- [[e2e-examples]] — test structure patterns

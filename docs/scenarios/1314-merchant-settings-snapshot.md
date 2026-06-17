# Test Scenarios — #1314 Merchant Settings Snapshot Tracking

> Origin: https://gitlab.com/uown/frontend/origination/-/work_items/1314
> Milestone: UOWN | Origination | Merchant Settings Snapshot Tracking
> Scope (per ticket Business Objective, `[user-provided:gitlab-1314]`): **audit / reporting / analytics only** — preserve exact merchant/program config at lead/account creation for future reporting, auditing, underwriting analysis, merchant-performance tracking. *"No additional reporting metadata is required beyond the snapshot values and entity relationship identifiers."* There is **NO functional runtime consumer in scope** — any "payoff/EPO uses the snapshot instead of live config" idea is explicitly a separate future feature, OUT of #1314.

## Demand summary

When a lead is approved by underwriting, the system must record an immutable snapshot of the merchant's underwriting configuration (EPO 5%, EPO 10%, UW Pipeline, Fraud Threshold) linked to that lead. When the resulting SVC account is created during funding, those same values must be copied into a second immutable snapshot linked to the account. Future changes to merchant settings must never alter historical snapshot records.

## Impact analysis

| Rule | Source |
|------|--------|
| Lead reaches `UW_APPROVED` after underwriting evaluates fraud score, credit, and campaign routing — this is the trigger point for the lead snapshot | `docs/business-rules/02-originacao-pipeline.md` — `uw_status` field on `uown_los_uw_info` |
| Denied leads produce no `UW_APPROVED` transition — status becomes a deny variant instead | `docs/business-rules/02-originacao-pipeline.md` — `internal_decision` vs `uw_status` |
| Lead lifecycle post-approval: `UW_APPROVED` → `CONTRACT_CREATED` → `SIGNED` → `FUNDING` → `FUNDED` | `docs/business-rules/08-funding-merchants.md` — FUNDING state machine |
| SVC account is created when `LosToSvcImportService.importFromLosToSvc` runs on a lead entering `FUNDING`; this is the trigger for the account snapshot | `docs/business-rules/08-funding-merchants.md` — "Lead importado para SVC, conta criada" |
| `epo5` and `epo10` are boolean fields on the merchant (Early Payoff at 5% and 10%); `uw_pipeline` routes the lead to a specific UW engine; `fraud_threshold` gates the NeuroID fraud score | `src/api/responses/merchant.response.ts`, `src/data/merchant-config-contract.ts` |
| Merchant UW settings (UW Pipeline, Fraud Threshold) are editable via the Merchant Settings bulk-update page in the Origination portal | `docs/scenarios/1309-add-gds-data-fields-config-columns-merchants.md` |
| Account snapshot must copy values from the **lead snapshot**, not from the current merchant config — ensures that a merchant change between approval and funding cannot alter the historical record | ticket TC-05 |
| If no lead snapshot exists (lead bypassed normal UW approval), the account snapshot creation is silently skipped and account creation still succeeds | ticket TC-06 |

| Snapshot fires only for **approved** applications; lead snapshot via `ApplicationApprovedEvent` listener (end of `ApplicationProcessor`); account snapshot via `LosToSvcImportService.importFromLosToSvc`. Account snapshot is populated from the **LEAD snapshot, never re-reading current Merchant Settings** at account creation | `[user-provided:gitlab-1314, dev-test-plan]` (Davi Artur execution plan) |
| Audit trail is **application INFO/WARN logs, NOT `uown_los_lead_notes`** — the snapshot table itself (its `row_created_timestamp`/`agent`) is the persisted trail. Documented log patterns: INFO `Snapshot created for leadPk=` / INFO `Snapshot created for accountPk=` / WARN `Snapshot already exists for leadPk=` / WARN `Snapshot already exists for accountPk=` / WARN `No merchant found for leadPk=` / WARN `No lead snapshot found for leadPk=<leadPk>, skipping account snapshot` | `[user-provided:gitlab-1314, dev-test-plan]` |
| Deployed/authoritative tables are `uown_los_lead_merchant_settings_snapshot` / `uown_sv_account_merchant_settings_snapshot` with columns `epo5`/`epo10`/`uw_pipeline`/`fraud_threshold` (the dev's early index draft `uown_lead_merchant_settings_snapshot` / `epo_5_percent` was superseded) | `[user-provided:gitlab-1314]` + `[db-observation:qa2]` |

**Gaps flagged (see Pending items):**
- G1: No documented path in the Origination portal UI to produce a lead that reaches FUNDING without a prior UW snapshot (TC-06 requires this). A discovery session or dev workaround may be needed.
- G2: Reliable mechanism to produce a denied lead in sandbox/qa1 (TC-02) — depends on which fraud or credit thresholds trigger denial in the test environment.

## Scenarios

```gherkin
Feature: Merchant Settings Snapshot Tracking
  As an underwriting compliance officer
  I want the system to preserve merchant underwriting configuration at the moment of lead approval and account creation
  So that historical underwriting decisions remain accurate and auditable even when merchant settings change over time

  Background:
    Given I am logged in to the Origination portal as an admin
    And merchant "terraceFinance" has known values configured for EPO 5%, EPO 10%, UW Pipeline, and Fraud Threshold

  # ── AC-01 / AC-04 — Snapshot creation on UW approval ─────────────────────

  Scenario: [negative] No configuration snapshot is recorded when a lead is denied by underwriting
    Given a lead for merchant "terraceFinance" has been submitted and does not meet underwriting criteria
    When the underwriting engine evaluates the lead and issues a denial decision
    Then no underwriting configuration snapshot is recorded for that lead

  Scenario: [positive] A configuration snapshot is recorded with all four underwriting values when a lead is approved
    Given a lead for merchant "terraceFinance" has been submitted with no prior underwriting snapshot
    When the underwriting engine approves the lead
    Then the system records exactly one configuration snapshot linked to that lead and to merchant "terraceFinance"
    And the snapshot captures the EPO 5%, EPO 10%, UW Pipeline, and Fraud Threshold values that were active on the merchant at the moment of approval
    And the snapshot includes a creation timestamp

  # ── AC-02 / AC-03 — Immutability of lead snapshot ────────────────────────

  Scenario Outline: [negative] Updating a merchant underwriting setting after lead approval does not alter the existing lead snapshot
    Given a lead for merchant "terraceFinance" has been approved by underwriting and its configuration snapshot has been recorded
    And the snapshot contains the "<setting>" value that was active at the time of approval
    When an admin updates the "<setting>" for merchant "terraceFinance" to a different value via Merchant Settings
    Then the lead's existing configuration snapshot still shows the original "<setting>" value from the time of approval
    And no other field in the lead snapshot reflects the updated merchant configuration

    Examples:
      | setting         |
      | Fraud Threshold |
      | UW Pipeline     |
      | EPO 5%          |
      | EPO 10%         |

  # ── AC-01 — Snapshot creation on account funding ─────────────────────────

  Scenario: [negative] No account configuration snapshot is created when a lead reaches funding without a prior underwriting snapshot
    Given a lead for merchant "terraceFinance" has reached the funding stage without completing the standard underwriting approval flow
    And no underwriting configuration snapshot exists for that lead
    When the SVC account is created for that lead
    Then no account-level configuration snapshot is recorded for the new account
    And the account is created successfully without errors

  Scenario: [positive] An account configuration snapshot is recorded when the SVC account is created during funding
    Given a lead for merchant "terraceFinance" has been approved by underwriting and its configuration snapshot has been recorded
    When the lead enters the funding stage and the SVC account is created
    Then the system records exactly one account-level configuration snapshot linked to the new account, the originating lead, and merchant "terraceFinance"
    And the account snapshot contains EPO 5%, EPO 10%, UW Pipeline, and Fraud Threshold values

  # ── AC-02 / AC-03 / AC-04 — Account snapshot integrity ───────────────────

  Scenario: [negative] Account snapshot reflects the underwriting-time configuration when merchant settings changed between approval and funding
    Given a lead for merchant "terraceFinance" has been approved by underwriting with a known Fraud Threshold value captured in its snapshot
    And an admin has since updated the Fraud Threshold for merchant "terraceFinance" to a different value via Merchant Settings
    When the lead enters the funding stage and the SVC account is created
    Then the account-level configuration snapshot shows the same Fraud Threshold as the lead snapshot
    And neither the lead snapshot nor the account snapshot reflects the updated merchant configuration
```

## Coverage matrix

| Acceptance Criterion | Scenario(s) | Status |
|---|---|---|
| AC-01 — Snapshot records are created during lead underwriting/creation and account funding/creation | [positive] Configuration snapshot recorded with all four underwriting values when a lead is approved | ✅ |
| AC-01 — Snapshot records are created during lead underwriting/creation and account funding/creation | [positive] Account configuration snapshot recorded when SVC account is created during funding | ✅ |
| AC-01 — Snapshot records are created during lead underwriting/creation and account funding/creation | [negative] No snapshot recorded when a lead is denied | ✅ |
| AC-01 — Snapshot records are created during lead underwriting/creation and account funding/creation | [negative] No account snapshot when no lead snapshot exists (TC-06 path) | ✅ |
| AC-02 — Historical snapshot data remains independent from active merchant/program tables | [negative] Updating each UW setting does not alter existing lead snapshot (Scenario Outline × 4) | ✅ |
| AC-02 — Historical snapshot data remains independent from active merchant/program tables | [negative] Account snapshot reflects underwriting-time config when merchant changed between approval and funding | ✅ |
| AC-03 — Future merchant/program updates do not modify existing snapshot records | [negative] Scenario Outline — same 4 scenarios above | ✅ |
| AC-04 — Snapshot records preserve EPO 5%, EPO 10%, UW Pipeline, Fraud Threshold | [positive] All four fields captured in lead snapshot at approval time | ✅ |
| AC-04 — Snapshot records preserve EPO 5%, EPO 10%, UW Pipeline, Fraud Threshold | [positive] Account snapshot contains all four values | ✅ |
| AC-04 — Snapshot records preserve EPO 5%, EPO 10%, UW Pipeline, Fraud Threshold | [negative] Scenario Outline verifies each field's immutability individually | ✅ |

## Pending items

> Discovery resolved these gaps. Detail: [`docs/knowledge-base/underwriting-and-funding-test-data-paths.md`](../knowledge-base/underwriting-and-funding-test-data-paths.md) (G1/G2 + qa2 caveats) and the execution report `docs/taskTestingUown/RU05.26.1.53.0_merchantSettingsSnapshotTracking_1314/…-report.md`.

### G1 — RESOLVED: snapshot tables deployed in qa2; account snapshot PROVEN
The #1314 snapshot tables (`uown_los_lead_merchant_settings_snapshot`, `uown_sv_account_merchant_settings_snapshot`) are deployed in qa2 (Flyway `…1.53.0`, 2026-06-15). The positive account-snapshot-on-funding path is PROVEN (cycle 3, TC-06-baseline / TC-05). The negative TC-06 ("no account snapshot when no lead snapshot exists") requires a DB `DELETE` of the lead-snapshot row before funding — snapshots fire on essentially every approval, so this is the only route. **TC-07 (no-lead-snapshot path) is `test.skip` pending explicit DB-DELETE authorization (Exception 2 / Rule #9).**

### G2 — RESOLVED (qa2 contradiction): ending-in-9 NOT honoured in qa2
`[CONFIRMADO]` — an ending-in-9 SSN for terraceFinance is **approved** in qa2 (lead 16556, UW_APPROVED, 0 vendor calls), because qa2 routes TERRACE_FINANCE through the BlackBox/ABB engine, not the mock that short-circuits ending-in-9 (sandbox/qa1-only). **TC-02 needs a confirmed deterministic `UW_DENIED` trigger from PO/dev for qa2, OR the negative scenario must be run on sandbox/qa1** where the mock is honoured. Until then TC-02 is `test.skip`. See [[application-lifecycle]] #109 and [[ssn-test-modalities]] §6. **Caveat (cross-check, dated memory `ssn9-denial-gate-off-sandbox-qa1`, 2026-06-17):** the gate is live-proven OFF in sandbox/qa1 too as of 2026-06-17 (`isProduction()` resolves true in deployed non-prod) — so sandbox/qa1 may no longer be a reliable denial path either; confirm live before relying on it.

### Scope / audit-trail reconciliation (`[user-provided:gitlab-1314]`)
- **Feature scope is audit / reporting / analytics only.** No functional runtime consumer is in #1314. The "early-payoff/EPO uses the snapshot instead of live config" idea is explicitly OUT of scope — a separate future feature. Tests should NOT expect any runtime behavior to change based on snapshot values within #1314.
- **Audit trail = application INFO/WARN logs, NOT `uown_los_lead_notes`.** The TC-08/OBS-LOG "no `lead_notes` entry on snapshot creation" is therefore **expected/by-design**, not an observability gap. Rule #13 does not apply (the snapshot table + the 6 app-log lines are the trail). The 6 documented log patterns are listed in the Impact-analysis table above.
- **Dev test-plan ↔ our-suite correspondence:** dev TC-01=our TC-01; dev TC-02(denial)=our TC-02 (SKIP, env); dev TC-03(immutable — dev covers fraud only via DB UPDATE)=our TC-03a, and we **exceed** the dev plan by adding TC-03b/c/d to cover all 4 fields via UI; dev TC-04=our TC-06-baseline; dev TC-05=our TC-05; dev TC-06(no account snap without lead snap + WARN log)=our TC-07. PO (Priyanka) QA Validations Scenarios 1/2/3 are a subset, all covered.
- **Coverage gap (relative to dev test plan, NOT to the 4 ACs):** the 6 INFO/WARN app-log lines were NOT captured this run (they are app-server logs, not DB/runner-visible). Recommend capturing at least the TC-07 WARN (`No lead snapshot found...skipping account snapshot`) plus an INFO `Snapshot created` on a future run.
- **OQ-KS-1 is OUT of #1314 scope:** the ticket has zero brand/Kornerstone requirements; the `company=KORNERSTONE` cross-check is our added parity check ([[ssn-test-modalities]] §5) and must NOT block the #1314 snapshot ACs. The 4 ACs are MET on both brands (snapshot carries `merchant_pk=315`/`fraud_threshold=5` correctly for KS).

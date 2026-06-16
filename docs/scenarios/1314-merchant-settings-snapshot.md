# Test Scenarios — #1314 Merchant Settings Snapshot Tracking

> Origin: https://gitlab.com/uown/frontend/origination/-/work_items/1314
> Milestone: UOWN | Origination | Merchant Settings Snapshot Tracking

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

### G1 — TC-06: Path to produce a lead at FUNDING with no lead snapshot
The ticket describes a scenario where a lead "bypassed normal approval flow via admin override." There is no documented UI path in the Origination portal that allows a lead to enter FUNDING without first reaching `UW_APPROVED`. This must be clarified with the dev team before the corresponding test is implemented — possible workarounds: direct DB manipulation (requires explicit authorization per Exception 3) or a dedicated dev/admin endpoint. Handoff: `/discovery` or dev confirmation.

### G2 — TC-02: Reliable denial trigger in sandbox/qa1
TC-02 requires a lead that will be denied by underwriting. The specific fraud score or credit condition that triggers denial in sandbox/qa1 is not documented. Before implementation, the QA implementer must confirm with the team whether there is a test SSN, a merchant config, or a score override that reliably produces `UW_DENIED` in the target environment.

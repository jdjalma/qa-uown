# Test Scenarios — Lead Detail: E-Sign / Sign (Modify Lease)

> Origin: user request 2026-06-26 — "crie cenários para Lead Detail: E-Sign / Sign que é o esign quando fazemos modify lease"

## Demand summary

After a lease modification that increases the invoice value, the lead transitions to CONTRACT\_CREATED and the E-Sign / Sign section becomes active in the Lead Detail. The agent must be able to trigger the new contract signing from this section. The scenarios validate the **E-Sign / Sign section exclusively** — the modify lease flow that creates the precondition is out of scope.

## Impact analysis

| Rule | Source |
|---|---|
| After a lease invoice increase, the lead internal status changes to CONTRACT\_CREATED and a new LEASE\_MOD contract is created and dispatched to the customer | `modify-lease.spec.ts:280-311` \| `docs/business-rules/12-produto-lease-deep-dive.md §7.2` |
| The E-Sign button (exact label matching `/^E[-\s]?Sign$/i`) lives in the customer summary action bar and is the trigger to initiate or re-trigger the signing flow | `customer.page.ts:47-54` |
| `chargeProcessingFeeBeforeEsign` is a merchant-level flag (default `false`). When `true`, the Lead Detail exposes a checkbox `input[name='chargeProcessingFeeBeforeEsign']` that the agent can check before clicking E-Sign — controlling whether the processing fee is charged as part of this signing trigger | `customer.page.ts:61` \| `docs/business-rules/12-produto-lease-deep-dive.md §3.2` \| Ticket1122 diff `chargeProcessingFeeBeforeEsign: default false` |
| The signing fee hierarchy (MAX of: amountChargedAtSigning, processingFee, securityDeposit, protectionPlanFee) applies before the e-sign; checking the checkbox sends `chargeProcessingFeeBeforeEsign=true` to the backend | `docs/business-rules/12-produto-lease-deep-dive.md §3.2` \| `docs/business-rules/03-contratos-esign.md §55` |
| After the customer signs the LEASE\_MOD contract via the e-sign provider, the lead transitions to SIGNED and the esign\_document.status → SIGNED | `gowsign-modify-lease-qa2.spec.ts §MOD-01.1` \| `docs/knowledge-base/alabama-gowsign-template.md §post-SIGNED LEASE\_MOD cascade` |
| Every signing event MUST generate an activity log entry (rule #13); expected log patterns: `[EsignRedirectService][updateSignStatus]`, `[ContractService][isLeaseOrLeaseModSigned]` | `docs/business-rules/03-contratos-esign.md §63` \| CLAUDE.md Inviolable Rule #13 |
| After the e-sign is triggered, the Documents → Lease panel shows the LEASE\_MOD contract with status SENT; after signing, SIGNED | `customer.page.ts:LeasePanelContract interface` \| `docs/knowledge-base/origination-customer-lead-detail-page.md §9` |
| The E-Sign button is ABSENT when the lead is in SIGNED status — confirmed via live DOM inspection 2026-06-26 (sandbox, leads 98094/98095): the action bar for SIGNED leads shows Move to Servicing, Request Funding, Modify Lease, etc., but no E-Sign button | `customer.page.ts:47-54` \| live MCP inspection 2026-06-26 sandbox lead 98095 |
| The E-Sign button label varies by context: `E-Sign` (first send for a new contract after Modify Lease increase) vs `Resend E-sign` (re-trigger when e-sign was already auto-sent, e.g. embedded flow). Both map to the same page-object action | live MCP inspection 2026-06-26 \| `customer.page.ts:54` |

## Scenarios

```gherkin
Feature: Lead Detail — E-Sign / Sign section after Modify Lease
  As an Origination agent
  I want to trigger the signing of a modified lease contract from the Lead Detail
  So that the customer receives the new LEASE_MOD contract and the lifecycle advances to SIGNED

  Background:
    Given the agent is authenticated in the Origination portal
    And the agent is on the Lead Detail page of a lease that had its invoice value increased via Modify Lease
    And the lead internal status is "CONTRACT_CREATED"

  # ── Negative / boundary ────────────────────────────────────────────────────

  Scenario: [negative] E-Sign button is not visible when the lead is already SIGNED
    Given the lead internal status is "SIGNED"
    When the agent views the Lead Detail action bar
    Then the "E-Sign" button is not visible in the action bar

  # ── Positive — button and form ─────────────────────────────────────────────

  Scenario: [positive] E-Sign button is visible in the action bar when the lead is in CONTRACT_CREATED
    Given the lead internal status is "CONTRACT_CREATED"
    When the agent views the Lead Detail action bar
    Then the "E-Sign" button is visible in the action bar

  Scenario: [positive] Clicking E-Sign dispatches the LEASE_MOD contract to the customer
    Given the lead is in CONTRACT_CREATED status
    When the agent clicks the "E-Sign" button
    Then the LEASE_MOD contract is sent to the customer for signature
    And the Documents panel shows the LEASE_MOD contract with status "SENT"

  Scenario: [positive] Clicking E-Sign generates an activity log entry for the contract dispatch
    Given the lead is in CONTRACT_CREATED status
    When the agent clicks the "E-Sign" button
    Then the activity log contains an entry confirming the modified contract was sent to the customer

  # ── Positive — Charge Processing Fee checkbox ──────────────────────────────

  Scenario: [positive] Checking the processing fee checkbox before E-Sign charges the processing fee
    Given the lead is in CONTRACT_CREATED status
    And the "Charge Processing Fee Before E-Sign" checkbox is visible in the E-Sign section
    When the agent checks the "Charge Processing Fee Before E-Sign" checkbox
    And the agent clicks the "E-Sign" button
    Then the processing fee is charged as part of the signing flow
    And the LEASE_MOD contract is sent to the customer for signature

  Scenario: [positive] Leaving the processing fee checkbox unchecked proceeds without charging the fee
    Given the lead is in CONTRACT_CREATED status
    And the "Charge Processing Fee Before E-Sign" checkbox is visible in the E-Sign section
    When the agent leaves the checkbox unchecked
    And the agent clicks the "E-Sign" button
    Then no processing fee is charged before the contract is sent
    And the LEASE_MOD contract is sent to the customer for signature

  # ── Positive — post-signature ──────────────────────────────────────────────

  Scenario: [positive] After the customer signs the LEASE_MOD contract, the lead transitions to SIGNED
    Given the LEASE_MOD contract has been sent to the customer for signature
    When the customer signs the contract via the e-sign provider
    Then the lead status transitions to "Signed"
    And the LEASE_MOD contract in the Documents panel shows status "SIGNED"

  Scenario: [positive] Signing the LEASE_MOD contract generates activity log entries for the signing event
    Given the LEASE_MOD contract has been sent to the customer for signature
    When the customer signs the contract via the e-sign provider
    Then the activity log contains an entry recording the transition to SIGNED for the modified contract
```

## Coverage matrix

| Acceptance Criterion | Scenario(s) | Status |
|---|---|---|
| AC-01 — E-Sign button not visible in SIGNED status | [negative] E-Sign button is not visible when the lead is already SIGNED | ✅ confirmed (live DOM 2026-06-26) |
| AC-02 — E-Sign button visible in CONTRACT\_CREATED | [positive] E-Sign button is visible in the action bar when the lead is in CONTRACT\_CREATED | ✅ |
| AC-03 — Clicking E-Sign dispatches the LEASE\_MOD contract and updates the Documents panel | [positive] Clicking E-Sign dispatches the LEASE\_MOD contract to the customer | ✅ |
| AC-04 — Clicking E-Sign generates activity log for the dispatch | [positive] Clicking E-Sign generates an activity log entry for the contract dispatch | ✅ |
| AC-05 — Processing fee charged when checkbox is checked | [positive] Checking the processing fee checkbox before E-Sign charges the processing fee | ✅ |
| AC-06 — No processing fee when checkbox is unchecked | [positive] Leaving the processing fee checkbox unchecked proceeds without charging the fee | ✅ |
| AC-07 — After signing: lead → SIGNED, LEASE\_MOD contract → SIGNED in Documents panel | [positive] After the customer signs the LEASE\_MOD contract, the lead transitions to SIGNED | ✅ |
| AC-08 — After signing: activity log records the signing event | [positive] Signing the LEASE\_MOD contract generates activity log entries | ✅ |

## Pending items

1. **"Charge Processing Fee Before E-Sign" checkbox — visibility conditions in modify lease context** (AC-05, AC-06)
   - The checkbox is declared in `customer.page.ts:61` (`input[name='chargeProcessingFeeBeforeEsign']`) and is a merchant-level flag (default `false`).
   - **Live DOM inspection (2026-06-26, sandbox leads 98093/98094):** checkbox was NOT found in the DOM for CONTRACT\_CREATED leads created via the embedded (WE\_GET\_FINANCING API) flow. The processing fee was charged automatically inside the iframe without any agent-visible checkbox.
   - **Hypothesis:** the checkbox only appears for non-embedded agent-initiated E-Sign flows — i.e., when an agent manually triggers E-Sign from the action bar after a Modify Lease increase on a non-embedded merchant.
   - AC-05 and AC-06 remain **`@pending`** until a follow-up investigation completes a Modify Lease save on a non-embedded merchant (the Modify Lease save could not be completed in this session because the Invoice # field was empty — required field).
   - → **Trigger `/discovery`** when ready: use a non-embedded merchant, complete the full Modify Lease increase (including Invoice # field), navigate to the resulting CONTRACT\_CREATED lead, and inspect the E-Sign section via MCP Playwright for the checkbox.

# Test Scenarios — Prevent Repeated NeuroID Calls During Signing Retries

> Origin: GitLab task in uown/backend/svc · Milestone: Uown | RU06.26.1.53.0

## Demand summary

When a customer returned to the signing portal to retry a previous attempt, the backend called NeuroID again even though no new behavioral interaction data was being generated. This caused `NOT_ENOUGH_INTERACTION_DATA` responses, which incorrectly denied legitimate customers. The fix stops NeuroID from being called on retries where CC/bank data already exists or the customer is returning only to sign, and treats `NOT_ENOUGH_INTERACTION_DATA` as non-blocking.

## Impact analysis

**Rule 1 — NeuroID triggers during `submitApplication` (site-id `depth355`).**
NeuroID behavioral biometrics are captured silently by the frontend SDK while the customer types CC/bank data. The backend call to verify occurs at `submitApplication`. On a retry, the customer is not typing new data — they are returning to sign — so no new interaction exists for NeuroID to analyze.
_Source: [`docs/taskTestingUown/R1.51.0_neuroIdBypassOnProfileNotFound_496/R1.51.0_neuroIdBypassOnProfileNotFound_496-scenarios.md`](../taskTestingUown/R1.51.0_neuroIdBypassOnProfileNotFound_496/R1.51.0_neuroIdBypassOnProfileNotFound_496-scenarios.md) — SUBMIT_APP site-id `depth355`_

**Rule 2 — NeuroID is merchant-controlled via `useNeuroIdCheck` flag.**
Only merchants with `useNeuroIdCheck = true` run NeuroID checks. Base UOWN merchants have this flag OFF; it must be explicitly ON in the test merchant configuration for these scenarios to be exercised.
_Source: [`.claude/skills/fraud-vendors-knowledge/SKILL.md`](../../.claude/skills/fraud-vendors-knowledge/SKILL.md) — Vendor catalog § `useNeuroIdCheck`_

**Rule 3 — Skip conditions introduced by fix (svc MR !1478).**
NeuroID validation must be skipped when:
- CC or bank account data already exists on the lead/account, OR
- The customer is returning only to sign (signing flow reopened/retried without new interaction activity)
_Source: GitLab task in uown/backend/svc — BUG/FIX description_

**Rule 4 — `NOT_ENOUGH_INTERACTION_DATA` must not deny the customer.**
When NeuroID returns this response (e.g., insufficient behavioral biometrics were collected), the system must treat it as non-blocking and allow the signing flow to continue.
_Source: GitLab task in uown/backend/svc — Additionally section_

**Rule 5 — First-time submissions must still trigger NeuroID normally.**
The fix must not suppress NeuroID for genuinely new interactions where no prior session data exists.
_Source: AC-04 — GitLab task in uown/backend/svc_

**Rule 6 — Activity log must reflect NeuroID outcome.**
Every NeuroID call result must produce a corresponding entry in `uown_los_lead_notes` or the equivalent audit log. Absence of a log entry means the check did not occur, which is itself observable evidence of the skip behavior.
_Source: [CLAUDE.md Rule 13](../../CLAUDE.md) — Activity log validation_

**Rule 7 — NeuroID calls are logged in `uown_sv_outbound_api_log`.**
Each backend call to NeuroID is recorded there; filtering by `lead_pk` allows verifying call count across attempts.
_Source: GitLab task comment in uown/backend/svc — Davi Artur: `select * from uown_sv_outbound_api_log where pk = 1696050`_

---

## Scenarios

```gherkin
Feature: Prevent Redundant NeuroID Validation During Signing Flow Retries
  As a customer who was approved for a lease
  I want to be able to complete the signing process even when returning from a previous attempt
  So that I am not unfairly denied due to repeated NeuroID checks on the same session

  Background:
    Given a customer has been approved for a lease with a merchant that has NeuroID validation enabled
    And the customer has access to the signing portal for that lease application

  Scenario Outline: [negative] NeuroID is not called again when returning to sign after payment data was already submitted
    Given the customer has submitted <payment data type> during the signing flow
    And the signing documents were not completed in that session
    When the customer reopens the signing portal and proceeds to the document signing step
    Then no new NeuroID validation call is recorded for that lead in the audit log
    And the customer is not denied or blocked due to a repeated NeuroID check

    Examples:
      | payment data type                      |
      | credit card payment details            |
      | bank account payment details           |

  # ⚠️ NOT REPRODUCIBLE IN qa2 — NeuroID test site (depth355) always returns HTTP 200 with
  # status=SUCCESS regardless of interaction volume. NOT_ENOUGH_INTERACTION_DATA only occurs
  # in production when the SDK collects insufficient behavioral data on repeated calls.
  # The response is HTTP 200 with {"status":"NOT_ENOUGH_INTERACTION_DATA"} in the body —
  # NOT an HTTP error. Validated in production: RefCode REF 7064180, 2026-06-09.
  # Test coverage: structural only (CT-02 N/A branch) — confirmed by dev (Davi Artur, 2026-06-16).
  Scenario: [negative] Customer is not denied when NeuroID returns "Not Enough Interaction Data"
    Given a customer initiates the signing flow
    And NeuroID is called and responds with a "Not Enough Interaction Data" status in the response body
    When the system processes that response
    Then the customer is not blocked or denied from continuing the signing flow
    And the lead does not transition to a denied state based solely on that response
    And the signing documents remain accessible to the customer

  Scenario: [negative] Returning to the signing portal after an incomplete session does not add a new NeuroID call to the audit log
    Given a customer has submitted payment information during the signing flow without completing the document signing
    And the NeuroID audit log records exactly one call for that lead from the payment submission step
    When the customer reopens the signing portal and proceeds to sign the documents
    Then the number of NeuroID calls in the audit log for that lead remains unchanged
    And the customer is not shown a NeuroID-related denial message during the retry

  Scenario: [positive] Initial signing attempt correctly triggers NeuroID validation
    Given a new customer has not previously been through the signing flow for this lead
    And no prior NeuroID behavioral data exists for this session
    When the customer provides payment information and submits the signing form for the first time
    Then NeuroID validation is triggered once to capture the customer's behavioral interaction data
    And the result is recorded in the audit log for that lead
    And the signing flow proceeds based on the NeuroID validation outcome

  Scenario: [positive] Customer whose payment data already exists on the lead completes signing without re-validation
    Given a customer has previously submitted payment information during the signing flow
    And the signing documents were not completed in that prior session
    When the customer returns to the signing portal and signs the lease documents
    Then no new NeuroID validation call is made for that lead
    And the customer completes the signing flow without interruption

  Scenario: [positive] Signing flow reaches post-signing status after the logic adjustment
    Given a customer goes through the signing flow without being blocked by repeated NeuroID calls
    When the customer signs all required lease documents
    Then the lease application transitions to the expected completed status
    And the customer receives confirmation that the signing is complete
    And no NeuroID-related denial or error is shown to the customer at any point during the flow

  Scenario: [positive] No regression in NeuroID validation for genuinely new customer interactions
    Given a new customer with no prior signing attempts and no existing payment data on the lead
    When the customer goes through the full signing flow with fresh natural interaction for the first time
    Then NeuroID is called to validate the customer's behavioral data as expected
    And the signing flow completes normally based on the NeuroID validation result
    And the audit log records exactly one NeuroID call for that lead
```

---

## Coverage matrix

| Acceptance Criterion | Scenario(s) that cover it | Status |
|---|---|---|
| AC-01 — Repeated signing attempts no longer trigger unnecessary repeated NeuroID calls when interaction data is already available | [negative] Scenario Outline (all 3 rows) · [negative] Repeated attempts do not accumulate NeuroID calls | ✅ |
| AC-02 — The system properly handles scenarios where NeuroID previously collected sufficient interaction data | [positive] Customer with prior NeuroID data completes signing without re-validation | ✅ |
| AC-03 — Customers are no longer unnecessarily denied due to repeated "Not Enough Interaction Data" responses | [negative] Customer is not denied when NeuroID returns "Not Enough Interaction Data" | ⚠️ design only — NOT_ENOUGH_INTERACTION_DATA is HTTP 200 with status in body; qa2 always returns SUCCESS; not reproducible in test env (confirmed prod: RefCode REF 7064180, dev Davi Artur 2026-06-16) |
| AC-04 — Existing NeuroID validation functionality continues working normally for valid new interactions | [positive] Initial signing attempt correctly triggers NeuroID validation · [positive] No regression for new interactions | ✅ |
| AC-05 — The signing flow remains functional and stable after the adjustment | [positive] Signing flow reaches post-signing status after the logic adjustment | ✅ |

---

## Reproduction flow (confirmed by dev — Davi Artur, 2026-06-16)

> A configuration to simulate the error was proposed and rejected in the MR.
> The dev confirmed the following steps reliably exercise the bug / validate the fix:

1. Open the secure page link for a NeuroID-enabled merchant and start the signing flow.
2. On the CC/ACH data entry page, fill in the payment details and advance to the next step — **do not sign the documents**.
3. Reload the signing page (F5 / hard refresh).
4. Click the sign/submit button.
5. Check `uown_sv_outbound_api_log` filtered by `lead_pk`:
   - **Bug present (before fix):** a new NeuroID row appears for the second attempt.
   - **Fix working (after fix):** no new NeuroID row is added; the existing entry from step 2 remains the only one.

This flow maps to the Scenario Outline row **"credit card or bank account information already saved on the account"** and to the scenario **"Repeated signing attempts do not accumulate NeuroID calls on the same lead"**.

---

## Pending items

**Gap — NeuroID `useNeuroIdCheck` merchant selection.**
The scenarios require a merchant with `useNeuroIdCheck = true`. This flag is OFF for base UOWN merchants per `merchant-config-contract.ts`. A merchant must be identified or configured in the target environment (`qa2`) with this flag explicitly ON. The existing NeuroID merchants from task #496 (`IL90206-0003` Saslow's Jewelers and `ks1011` Bodega Furniture, tested in `qa2`) are candidates if still active.
→ Verify before implementation: run `SELECT ref_code, use_neuro_id_check FROM uown_merchant WHERE use_neuro_id_check = true LIMIT 10` in qa2.

**Gap — Observability of "no NeuroID call" behavior (resolved).**
Scenarios asserting that NeuroID is NOT called on a retry are validated via DB assertion: compare the row count in `uown_sv_outbound_api_log` for that `lead_pk` between attempt 1 and attempt 2. If count does not increase, the fix is working. Confirmed by Davi Artur (task comment: `select * from uown_sv_outbound_api_log where pk = 1696050`).
→ Implementation must snapshot the count after step 2 and assert it is unchanged after step 4 of the reproduction flow.

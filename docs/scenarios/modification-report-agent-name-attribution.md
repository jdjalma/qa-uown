# Test Scenarios — Fix "SYSTEM" in Modification Report Agent Name

> Origin: https://gitlab.com/uown/frontend/origination/-/work_items/1315 (HTTP 403 — private, not fetchable here)
> Milestone: R1.53.0 · Fix: `svc!1464` + `svc!1470` · Target env: qa2
> AC wording derived from local sources, **not** the raw ticket: task report `docs/taskTestingUown/R1.53.0_fixSystemAgentUsernameInModificationReport_1315/` + knowledge-base `docs/knowledge-base/modification-report-agent-name-bug.md` (`[knowledge-base:modification-report-agent-name-bug, last_verified 2026-06-18]`). Reconcile against the GitLab ticket if access is restored — see Pending items.

## Demand summary

The **Modification Report** (`/modificationReport`) is a read-only audit log of every lead change, with an "Agent Name" column that must identify who performed it. A backend bug recorded `agent_username = "SYSTEM"` for changes actually triggered by a **human agent** in the Origination portal (reported by Priyanka Namburu on 2026-05-28, specifically on `Approved → Expired`). The fix captures the agent identity before an outbound webhook corrupted the request's `ThreadLocal`. After the fix, human-triggered changes must show the real agent, while genuinely system-triggered changes (signing-provider webhooks) must keep showing "SYSTEM".

## Impact analysis

| Rule | Source |
|------|--------|
| BR-01 — "Agent Name" must reflect the portal user who triggered the action; "SYSTEM" for a human action is the bug | `[knowledge-base:modification-report-agent-name-bug §Business Rules BR-01]` |
| BR-02 — "SYSTEM" is correct **only** for backend-triggered changes with no user session (signing-provider webhook / scheduler sweep) — the fix must not suppress legitimate SYSTEM (no over-correction) | `[knowledge-base:modification-report-agent-name-bug §Business Rules BR-02]` |
| BR-04 — `UW_APPROVED → EXPIRED` ("Set to Expired") is the original bug trigger; new records must show the real agent | `[knowledge-base:modification-report-agent-name-bug §Business Rules BR-04]` |
| BR-06 — for a lead with a signing flow already started, "Change to Signed" opens the "Move Contract to Signed" modal directly and records the real agent | `[knowledge-base:modification-report-agent-name-bug §Business Rules BR-06]` |
| The portal SPA sends the agent identity via an HTTP `username` header; a change driven through the browser carries it, so the action **must** be exercised via the UI (an API call without the header reproduces the SYSTEM artifact and is a false signal) | `[knowledge-base:modification-report-agent-name-bug §Backend Root Cause]`; project rule #14 (UI-first) |
| Legitimately system-triggered transitions: `CONTRACT_CREATED → SIGNED` (customer self-signs via GowSign/SignWell webhook) and `SIGNED → SIGNED` (provider re-sign event) — no human actor in the request context | `[knowledge-base:modification-report-agent-name-bug §Legitimately SYSTEM]` |
| Distinct human-triggered transitions confirmed in qa2: `UW_APPROVED → EXPIRED`, `UW_APPROVED → SIGNED`, `SIGNED → EXPIRED` | `[knowledge-base:modification-report-agent-name-bug §All Distinct LEAD_STATUS_CHANGE Transitions]` |
| The report is a **read-only** audit log (no add/edit/delete); it supports filtering by Agent Name, Merchant, Location, Modification Type, and date range | `[knowledge-base:modification-report-agent-name-bug §Available Operations]` |

**Oracle note (project rule #14):** the observable result is the **rendered "Agent Name" cell** of the Modification Report — the value the auditor actually reads. A display bug is only caught here, not by reading the underlying record. Every `Then` below lands on that rendered cell.

**Negatives framing:** this feature is a read-only audit log, so there are no input-validation negatives. The meaningful negatives are **defect guards** — the human action must *not* show "SYSTEM" (original bug), and a system action must *not* be misattributed to a human agent (over-correction guard). These lead; the report-usability happy path closes.

## Scenarios

```gherkin
Feature: Modification Report — accurate agent attribution for lead status changes
  As an auditor of the Origination portal
  I want each lead status change to be attributed to whoever actually performed it
  So that the Modification Report is a trustworthy record of agent vs system actions

  Background:
    Given I am signed in to the Origination portal as agent "jmendes.gow"
    And I can view the Modification Report

  # ── AC-01 / AC-04 — the original bug: a human action must never be logged as SYSTEM ──

  Scenario: [negative] Expiring an approved application is attributed to the acting agent, not SYSTEM
    Given an approved application for merchant "TireAgent" assigned to me
    When I set the application to expired
    Then the Modification Report shows the resulting "Expired" status change with Agent Name "jmendes.gow"
    And that change's Agent Name is not "SYSTEM"

  # ── AC-01 — every other human-triggered transition is attributed to the agent ──

  Scenario Outline: [negative] A human-triggered status change is attributed to the agent, never SYSTEM
    Given an application for merchant "TireAgent" in the "<starting state>" state assigned to me
    When I <action> the application
    Then the Modification Report shows the resulting "<new status>" status change with Agent Name "jmendes.gow"
    And that change's Agent Name is not "SYSTEM"

    Examples:
      | starting state                | action                | new status |
      | approved with payment on file | change to signed      | Signed     |
      | signed                        | set to expired        | Expired    |

  # ── AC-02 — over-correction guard: a system action must keep showing SYSTEM ──

  Scenario Outline: [negative] A system-triggered status change keeps SYSTEM attribution and is never tied to a human agent
    Given an application whose "<transition>" change was produced by the signing provider with no agent involved
    When I review that change in the Modification Report
    Then the change's Agent Name is "SYSTEM"
    And no human agent username is shown for that change

    Examples:
      | transition                                          |
      | Contract Created to Signed after the customer signs |
      | Signed to Signed from a provider re-sign event      |

  # ── AC-03 — regression: the report stays usable and shows complete, correct details ──

  Scenario: [positive] The Modification Report lists a human status change with complete, correct details
    Given I have just set an approved application for merchant "TireAgent" to expired today
    When I review the Modification Report filtered to today's changes by agent "jmendes.gow"
    Then the report lists that application's change with Agent Name "jmendes.gow", Modification Type "Lead Status Change", and New Status "Expired"
```

## Coverage matrix

| Acceptance Criterion | Scenario(s) that cover it | Status |
|---|---|---|
| AC-01 (BR-01) — human-triggered change shows the real agent, never SYSTEM | [negative] Expiring an approved application is attributed to the acting agent; [negative] A human-triggered status change is attributed to the agent (outline: change to signed, expire a signed lease) | ✅ |
| AC-02 (BR-02) — system-triggered change keeps SYSTEM; fix does not over-correct | [negative] A system-triggered status change keeps SYSTEM attribution (outline: Contract Created→Signed, Signed→Signed) | ✅ |
| AC-03 — Modification Report remains functional and displays correct attribution + columns | [positive] The Modification Report lists a human status change with complete, correct details | ✅ |
| AC-04 (BR-04) — `UW_APPROVED → EXPIRED` (original bug trigger) shows the real agent | [negative] Expiring an approved application is attributed to the acting agent | ✅ |

Backward trace (no orphans): every scenario maps to ≥1 AC — the two human-action scenarios → AC-01/AC-04; the system-action outline → AC-02; the report-detail scenario → AC-03.

Traceability to the implemented suite (`tests/e2e/origination/R1.53.0_fixSystemAgentUsernameInModificationReport.spec.ts`): scenario 1 ↔ CT-01; outline "change to signed" ↔ CT-02; report-detail ↔ CT-03; system-action outline (Contract Created→Signed row) ↔ CT-04. The "expire a signed lease" (`SIGNED → EXPIRED`) row and the "Signed→Signed re-sign" row are **scenario-only coverage** documented in the knowledge-base but not yet automated (see Pending items).

## Pending items

- **AC wording reconciliation** — the ticket itself returned HTTP 403. ACs above were reverse-engineered from the task report + knowledge-base (`last_verified 2026-06-18`). Confirm the exact AC text / Scenario 1–2–3 wording against GitLab #1315 (or an authenticated MCP/`gh`-equivalent) and adjust IDs if the ticket numbers them differently.
- **Coverage gap vs. automation** — two scenario rows have no automated CT: `SIGNED → EXPIRED` (human, "Set to Expired" on a signed lease) and `SIGNED → SIGNED` (system re-sign). Both are confirmed in the qa2 knowledge-base but only the `CONTRACT_CREATED → SIGNED` system case is automated (CT-04). Flag for `qa-planner`/`qa-implementer` if full transition coverage is required.
- **Known test-automation artifact (not a product bug)** — direct API calls without the `username` header still record SYSTEM (`[knowledge-base §BR-05]`). This is why all human-action scenarios are specified **via UI**; do not derive an API-only variant from them.

---
last-reviewed: <YYYY-MM-DD>
covers:
  - <src/pages/example.page.ts>
  - <src/helpers/example.helpers.ts>
---

# Test Scenarios — <demand name>

> Origin: <ticket / user story / file>

## Demand summary
<1-3 lines: actor, goal, business value>

## Impact analysis

<For each business rule that affects the scenarios: cite the source file, section, or ticket.>
<Format: rule description | source>
<If a rule is assumed/inferred: mark [assumed] and flag as a pending gap.>

## Acceptance Criteria

| ID | Criterion | Testable? |
|---|---|---|
| AC-01 | <description — written as an observable outcome, not a feature description> | Yes / Pending |
| AC-02 | <description> | Yes / Pending |

## Scenarios

```gherkin
Feature: <business capability>
  As <actor>
  In order to <benefit>
  <The actor> must <capability>

  Background:
    Given <common precondition shared by all scenarios: authenticated user, relevant account/record, starting screen>

  Scenario: [negative] <behavior when the rule is violated>
    Given <initial state that sets up the violation>
    When <the actor performs the triggering action>
    Then <the exact error/block the user sees — include message text, field highlight, or blocked state>
    And <any unchanged value that confirms the action had no unintended effect>

  Scenario: [positive] <behavior when the rule is satisfied>
    Given <initial state>
    When <the actor performs the action>
    Then <the exact value or state the user reads to confirm it worked — not just "it appears", but what value>
    And <side effect verified: log entry, updated counter/balance, notification, or explicit absence if read-only>
```

<!--
Then quality gate — run per Then before saving:
1. Value: does it state WHAT value/text/state should appear, not just that something appeared?
2. Decision point: does it land where the user makes a real business decision?
3. Failure detection: would it catch the most likely failure mode for this scenario?
If any answer is No → rewrite.
-->

## Oracle: CT-01 — <scenario name>

> Staleness check (run first): `git log --after="<last-reviewed date>" -- <covers files>`
> Non-empty output = BDD may be stale. Prepend `[BDD MAY BE STALE]` to this oracle report.

| What the user checks | Expected value / state | Where / How to verify |
|---|---|---|
| <what the user looks at to confirm the outcome> | <exact text, value, status, or explicit absence> | <DOM selector, page section, or DB query> |
| <side effect or secondary consequence> | <expected state — e.g. "no new row", "balance reduced by $X", "toast message 'X'"> | <how to verify — DOM, network, DB> |

<!-- Repeat one ## Oracle block per scenario CT-ID.
     Every oracle must have at least one checkpoint for the primary consequence
     AND one for each relevant side effect (log, balance, notification).
     "The field is visible" is not a checkpoint — "the field shows $X.XX" is. -->

## Coverage matrix

| Acceptance Criterion | Scenario(s) that cover(s) it | Status |
|---|---|---|
| AC-01 — <description> | CT-01: [positive] <title> | Covered |
| AC-02 — <description> | CT-02: [negative] <title> | Covered |
| AC-03 — <description> | — | Pending (discovery required) |

## Pending items

<For each pending AC or unknown rule:>
1. **<Rule or behavior that is unknown>:** <what is unknown and why it matters>. Trigger `/discovery` to investigate. Scenario only after the rule is confirmed.

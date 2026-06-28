---
name: test-scenarios
description: Transforms a demand, user story, or requirement into Gherkin test scenarios (Given/When/Then) via UI, focused on behavior, in English, with full acceptance criteria coverage, and saves to a Markdown (.md) file. Use when you need to write BDD scenarios, acceptance tests, or when the user mentions Gherkin, Cucumber, BDD or "test scenarios" from a demand.
when_to_use: Triggers — "create scenarios for this demand", "write the BDD tests", "generate the test scenarios", "acceptance criteria in Gherkin", received a user story/ticket and need the test scenarios.
argument-hint: [demand, user story, or path to requirement file]
allowed-tools: Read Grep Glob Write
---

# Test Scenarios (Gherkin)

Converts a demand (user story, ticket, requirement) into test scenarios **via UI**, in **Gherkin**, focused on **behavior**, and saves them to a **Markdown (`.md`)** file. The focus is analysis: understanding the demand's impact on the product and producing real scenarios that cover all acceptance criteria.

## Process

1. **Understand the demand.** If a file path is provided, read it. Identify actor, objective, and value.
2. **Impact analysis.** Compare the demand against business rules / product knowledge base (search docs with Glob/Grep). **Cite the source of each rule** (file from `docs/knowledge-base/`, ticket, user story). Scenarios must be real and consistent with the product.
3. **Extract acceptance criteria** with IDs (`AC-01`, ...). **Micro-gate per AC:** can you write an observable `Then` with unambiguous pass/fail? If **not**, it is a gap candidate → step 4 (never guess).
4. **Detect gaps** and apply the [missing information protocol](#missing-information-protocol).
5. **Draft the AC→scenario(s) matrix** (titles only) as a **coverage plan**; validate that every AC has at least one scenario and that there are no orphan scenarios. Only then write.
6. **Write the scenarios** (negatives → happy path) following the [rules](#rules) and the [coverage checklist](#coverage-checklist). While writing each `Then`: apply the **consequence oracle** — ask "where does the user look to confirm this?" and "is the expected value stated explicitly?" Refer to the [[check-points]] catalog for the full list of after-action checkpoints (persistence, side effects, derived values, cross-screen consistency).
7. **Self-validate** each scenario against the rules and the [quality checklist](references/checklist-qualidade-cenario.md). For every `Then`, run the three-question gate from rule #10. Found a violation? Fix and re-validate. **Only proceed when it passes.**
8. **Finalize the matrix** and **save the `.md`** (copy [assets/modelo-cenarios.md](assets/modelo-cenarios.md)); report the path.

```
[ ] Demand understood (actor/objective/value)
[ ] Impact analysis vs knowledge base (sources cited)
[ ] ACs extracted with ID + testability micro-gate
[ ] Gaps/ambiguity addressed (handoff /discovery)
[ ] Matrix drafted and coverage validated
[ ] Scenarios written (negatives → happy path)
[ ] Self-validation per scenario (rules + quality)
[ ] Final matrix + .md saved and path reported
[ ] Frontmatter added (last-reviewed + covers list)
[ ] Row added to .claude/oracles/_index.md (operation, keywords, filename, last-reviewed)
```

## Rules

1. **Via UI, but behavioral.** Describe the **state**, not the navigation: `Given I am on the cart screen with items`, not a tour of screens. **Forbidden:** clicks/buttons/selectors/IDs/URLs **and** mechanical verbs (`wait for`, `scroll to`, `wait to load`) and backend terms (HTTP, SQL). Self-check per step: *would this need to change if the implementation changed?* If yes, it is imperative — rewrite at the behavior level.
2. **One behavior, one `When`.** No **conjunctive step** (`When I enter the coupon and finalize the purchase` = two actions). `And`/`But` only continue the **same type** of step (multiple `Given`, or multiple `Then`) — never a 2nd action. If you would write two `When`s, the first is a precondition (becomes `Given`) or they are two separate scenarios.
3. **Independent scenarios** and **focused on one rule**. By default, single rule; end-to-end journey only when the user asks.
4. **Negatives first, happy path last.**
5. **Full coverage.** Every acceptance criterion becomes at least one scenario (prove it in the [matrix](#coverage-matrix)).
6. **Limits/boundaries are mandatory to consider** (zero, empty, minimum, maximum, expired session, no permission).
7. **`Then` = observable consequence at the business decision point.** Ask: *"Where does the user look to confirm this worked? What exact value or state do they read to make a decision?"* That is the check point — the `Then` must land there.
   - When the feature **produces a number**: assert it is the *correct* number, not just that a number appeared.
   - When the feature **changes a status**: assert the correct status, everywhere it is visible.
   - When the action has a **side effect** (log, balance, counter, notification): assert the side effect explicitly.
   - When a value **appears in more than one place**: assert consistency across places.
   - **Never internal state.** Each scenario illustrates **one** rule; the result derives from the rule in the impact analysis, not from assumption.
8. **Never invent behavior** — without a basis, go to the [missing information protocol](#missing-information-protocol).
9. **Domain language** and **concrete, realistic data** (avoid "foo"/"bar").
10. **Apply the consequence oracle for every `Then`.** Before accepting a `Then`, run the three-question gate:
    - *Value:* does it state **what** value/text/state should appear, not just that something appeared?
    - *Decision point:* does it land where the user makes a real business decision (not an intermediate step)?
    - *Failure detection:* would this `Then` catch the most likely failure mode for this scenario?
    If any answer is No → rewrite the `Then`. A `Then` that passes the gate is a real test; one that fails is documentation noise.

## `Then` Anti-Patterns (forbidden)

These are weak `Then`s that look correct but are not tests — they would pass even if the feature is broken:

| Anti-pattern | Why it's weak | Corrected form |
|---|---|---|
| `Then the amount is displayed` | Doesn't say *what* amount or if it's *correct* | `Then the Prorated Amount field shows $X,XXX.XX matching the payoff for that date` |
| `Then the operation is successful` | No observable evidence | `Then a success message "…" is shown and the record appears in the list` |
| `Then a message is shown` | Which message? What text? | `Then the message "Coupon expired" is shown and the cart total remains unchanged` |
| `Then the form is submitted` | Not a user-observable consequence | `Then the payment appears in the account history with the correct amount and date` |
| `Then no error is shown` | Absence alone is not evidence | Pair with a positive consequence: `Then no error is shown and the value X is saved` |
| `Then the page refreshes` | Implementation detail | Assert what changed *because of* the refresh, not the refresh itself |
| `Then the value is recalculated` | Doesn't say what changed or whether it's right | `Then the result field shows a different amount than before, matching the payoff for the new date` |

## Missing Information Protocol

Do not guess. There are **two types** of gap:

- **Missing scope (actor / objective / value / precondition)** → **ask the user** (actor, capability, value, known rules, preconditions).
- **Unknown or ambiguous product rule** in the knowledge base → record as **Pending** and **trigger the `/discovery` skill** (navigates the product with the Playwright MCP and documents in `docs/knowledge-base/`). Scenario only after the rule is known.

## Gherkin Structure

```gherkin
Feature: <business capability>
  As <actor>
  In order to <benefit>
  <The actor> must <capability>

  Background:
    Given <common precondition: logged-in user, profile, initial screen, test data>

  Scenario: [negative] <error behavior>
    Given <initial state>
    When <the actor> <performs an action>
    Then <observable result on screen>

  Scenario: [positive] <success behavior>
    Given <initial state>
    When <the actor> <performs an action>
    Then <observable result on screen>
```

> **Actor naming:** use the role name explicitly — `the agent`, `the customer`, `the manager`, `the merchant`. When the subject is the system reacting, use passive voice — `the dashboard is displayed`, `an error message is displayed`. Never `I`, `my`, or `you` in steps.

- **Keywords:** `Feature`, `Background`, `Scenario`, `Scenario Outline` + `Examples`, `Given`, `When`, `Then`, `And`, `But`.
- **Order `Given → When → Then`** without repeating phases. **There is no "Or"** — alternatives are separate scenarios.
- **Title:** prefix with `[negative]` or `[positive]`; describe the behavior, not the mechanics.
- **Background:** use **only** for preconditions shared by **multiple** scenarios and keep it short (one per Feature). Setup for a single scenario goes in a local `Given`; never build complex state in the Background.
- **Scenario Outline + Examples:** when the same behavior varies only by **data**. Each row in `Examples` is a distinct **equivalence class** (e.g.: min−1 / min / max / max+1) — do not enumerate dozens of equivalent data values.
- **Data table** inside a `Given` for structured test data in a single scenario (`Given the following items:` + table `| product | qty | price |`) — different from `Scenario Outline`, which varies behavior per row.
- **Person and tense:** NEVER use first person (`I`, `my`) in Given/When/Then steps — this is a hard rule with no exceptions. Use the actor's name explicitly (`the agent submits`, `the customer enters`, `the manager approves`) or behavioral passive (`valid credentials are submitted`). First person is only acceptable in the Feature narrative block (`As a customer, In order to...`). Keep consistent present tense throughout. Do not alternate person within the same file.

## Coverage Checklist

Consider (and include when applicable), in this order:

- [ ] **Negatives / validations** — invalid inputs, violated rules, error messages with exact text.
- [ ] **Limits / boundaries** — zero, empty, minimum, maximum, expired session, no permission.
- [ ] **Alternative flows** — other valid ways to achieve the objective.
- [ ] **Data variations** — `Scenario Outline` when the flow changes only by data.
- [ ] **Happy path** — the main success flow, with value correctness verified.
- [ ] **Side effects** — for every action that mutates state: log/audit entry, notification, balance change, counter, derived value update. Use the [[check-points]] catalog. A scenario that exercises a business action without verifying its side effects is incomplete.
- [ ] **Cross-screen consistency** — if the result appears in more than one place (list + detail, header + form, summary + report), assert it in all relevant places.
- [ ] **Persistence** — for any save/submit: verify the value survives a reload or navigation away and back.

## Coverage Matrix

Links acceptance criterion → scenarios (by title). Traceability is **bidirectional**: *forward* (every AC has at least one scenario) **and** *backward* (every scenario traces back to at least one AC). An **orphan scenario** (without an AC) is either superfluous, or it revealed an implicit rule that should become a new AC / go to `/discovery`. The relationship is **many-to-many**: one AC generates 1..N scenarios ([positive] + negatives + boundaries); do not force 1:1.

| Acceptance Criterion | Scenario(s) that cover(s) it | Status |
|---|---|---|
| AC-01 — <description> | [positive] <title> | ✅ |
| AC-02 — <description> | [negative] <title> | ✅ |
| AC-03 — <description> | — | ⚠️ pending (discovery required) |

## Output

**Copy [assets/modelo-cenarios.md](assets/modelo-cenarios.md) and fill it in.** Save to `.claude/oracles/<demand-name>.md` (kebab-case), or follow the project convention if there is one — check with Glob using `docs/**/*.md` first. After saving, report the path. If the user only wants to see it in chat, present it without saving.

Every generated BDD file MUST start with this frontmatter block:

```markdown
---
last-reviewed: <today's date YYYY-MM-DD>
covers:
  - <path to page object>
  - <path to helper or API client>
---
```

`covers` lists every implementation file whose behavior this BDD contracts. After saving, add a row to [`.claude/oracles/_index.md`](../../.claude/oracles/_index.md) mapping the operation name, trigger keywords, file name, and `last-reviewed` date. Without this row, rule #19 in CLAUDE.md cannot find the oracle.

### Oracle file scope rule: one file = one feature

Each oracle file must cover **one feature** (one product capability, one page, one API operation). The primary smell for mixing is the `covers:` list: if the same feature-specific page-object appears in two different oracle files, those files are mixing features and one file should be split or the page-object removed from the wrong one.

**Acceptable exception — UI-vs-API split of the SAME feature:** when one oracle covers the UI flow (e.g., filling in the application form via browser) and a sibling oracle covers the API seed path that produces the same lead (e.g., `POST /uown/los/sendApplication`), they will share common artifacts (`common.selectors.ts`, a shared API client) in their `covers:` lists. This is not mixing — it is a deliberate UI-vs-API split of the same feature. Document the split explicitly in both files so future reviewers can see it was intentional.

The **form** is rigid (Gherkin, `[negative]`/`[positive]` prefix, one `When`, `.md` structure, frontmatter + `_index.md` entry); the **judgment** (which scenarios, impact analysis) is free.

## Example

See complete examples (demand → generated file), including `Scenario Outline` and the Pending → `/discovery` flow, in [references/exemplo.md](references/exemplo.md).

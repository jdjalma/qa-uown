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
6. **Write the scenarios** (negatives → happy path) following the [rules](#rules) and the [coverage checklist](#coverage-checklist).
7. **Self-validate** each scenario against the rules and the [quality checklist](references/checklist-qualidade-cenario.md). Found a violation? Fix and re-validate. **Only proceed when it passes.**
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
```

## Rules

1. **Via UI, but behavioral.** Describe the **state**, not the navigation: `Given I am on the cart screen with items`, not a tour of screens. **Forbidden:** clicks/buttons/selectors/IDs/URLs **and** mechanical verbs (`wait for`, `scroll to`, `wait to load`) and backend terms (HTTP, SQL). Self-check per step: *would this need to change if the implementation changed?* If yes, it is imperative — rewrite at the behavior level.
2. **One behavior, one `When`.** No **conjunctive step** (`When I enter the coupon and finalize the purchase` = two actions). `And`/`But` only continue the **same type** of step (multiple `Given`, or multiple `Then`) — never a 2nd action. If you would write two `When`s, the first is a precondition (becomes `Given`) or they are two separate scenarios.
3. **Independent scenarios** and **focused on one rule**. By default, single rule; end-to-end journey only when the user asks.
4. **Negatives first, happy path last.**
5. **Full coverage.** Every acceptance criterion becomes at least one scenario (prove it in the [matrix](#coverage-matrix)).
6. **Limits/boundaries are mandatory to consider** (zero, empty, minimum, maximum, expired session, no permission).
7. **`Then` = observable result on screen**, never internal state. Each scenario illustrates **one** rule; the result derives from the rule identified in the impact analysis, not from assumption.
8. **Never invent behavior** — without a basis, go to the [missing information protocol](#missing-information-protocol).
9. **Domain language** and **concrete, realistic data** (avoid "foo"/"bar").

## Missing Information Protocol

Do not guess. There are **two types** of gap:

- **Missing scope (actor / objective / value / precondition)** → **ask the user** (actor, capability, value, known rules, preconditions).
- **Unknown or ambiguous product rule** in the knowledge base → record as **Pending** and **trigger the `/discovery` skill** (navigates the product with the Playwright MCP and documents in `docs/knowledge-base/`). Scenario only after the rule is known.

## Gherkin Structure

```gherkin
Feature: <business capability>
  As <actor>
  I want <action>
  So that <benefit>

  Background:
    Given <common precondition: logged-in user, profile, initial screen, test data>

  Scenario: [negative] <error behavior>
    Given <initial state>
    When <a user action in the UI>
    Then <observable result on screen>

  Scenario: [positive] <success behavior>
    Given <initial state>
    When <a user action in the UI>
    Then <observable result on screen>
```

- **Keywords:** `Feature`, `Background`, `Scenario`, `Scenario Outline` + `Examples`, `Given`, `When`, `Then`, `And`, `But`.
- **Order `Given → When → Then`** without repeating phases. **There is no "Or"** — alternatives are separate scenarios.
- **Title:** prefix with `[negative]` or `[positive]`; describe the behavior, not the mechanics.
- **Background:** use **only** for preconditions shared by **multiple** scenarios and keep it short (one per Feature). Setup for a single scenario goes in a local `Given`; never build complex state in the Background.
- **Scenario Outline + Examples:** when the same behavior varies only by **data**. Each row in `Examples` is a distinct **equivalence class** (e.g.: min−1 / min / max / max+1) — do not enumerate dozens of equivalent data values.
- **Data table** inside a `Given` for structured test data in a single scenario (`Given the following items:` + table `| product | qty | price |`) — different from `Scenario Outline`, which varies behavior per row.
- **Person and tense:** consistent throughout the file, in the present tense; keep the **actor explicit** when more than one profile is involved in the flow (`the manager approves`, `the customer requests`). Do not alternate person within the same file.

## Coverage Checklist

Consider (and include when applicable), in this order:

- [ ] **Negatives / validations** — invalid inputs, violated rules, error messages.
- [ ] **Limits / boundaries** — zero, empty, minimum, maximum, expired session, no permission.
- [ ] **Alternative flows** — other valid ways to achieve the objective.
- [ ] **Data variations** — `Scenario Outline` when the flow changes only by data.
- [ ] **Happy path** — the main success flow.

## Coverage Matrix

Links acceptance criterion → scenarios (by title). Traceability is **bidirectional**: *forward* (every AC has at least one scenario) **and** *backward* (every scenario traces back to at least one AC). An **orphan scenario** (without an AC) is either superfluous, or it revealed an implicit rule that should become a new AC / go to `/discovery`. The relationship is **many-to-many**: one AC generates 1..N scenarios ([positive] + negatives + boundaries); do not force 1:1.

| Acceptance Criterion | Scenario(s) that cover(s) it | Status |
|---|---|---|
| AC-01 — <description> | [positive] <title> | ✅ |
| AC-02 — <description> | [negative] <title> | ✅ |
| AC-03 — <description> | — | ⚠️ pending (discovery required) |

## Output

**Copy [assets/modelo-cenarios.md](assets/modelo-cenarios.md) and fill it in.** Save to `docs/scenarios/<demand-name>.md` (kebab-case), or follow the project convention if there is one — check with Glob using `docs/**/*.md` first. After saving, report the path. If the user only wants to see it in chat, present it without saving.

The **form** is rigid (Gherkin, `[negative]`/`[positive]` prefix, one `When`, `.md` structure); the **judgment** (which scenarios, impact analysis) is free.

## Example

See complete examples (demand → generated file), including `Scenario Outline` and the Pending → `/discovery` flow, in [references/exemplo.md](references/exemplo.md).

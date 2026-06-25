# Agents & Skills — fintech-playwright

> **Summary:** The project uses 5 lean agents in `.claude/agents/` and ~30 skills in `.claude/skills/`. Agents load skills on demand based on semantic signals from the task — there are no slash commands. CLAUDE.md is the orchestrator.

## Architecture

```
CLAUDE.md (orchestrator)
   ↓ (task signal)
.claude/agents/qa-{planner|implementer|debugger|validator|doc-keeper}.md
   ↓ (load on-demand by description match)
.claude/skills/{slug}/SKILL.md  (disable-model-invocation: true)
```

## Agents (5)

All opus except `qa-doc-keeper` (opus).

| Agent | Role | Writes code? |
|-------|-------|------------------|
| [`qa-planner`](../.claude/agents/qa-planner.md) | QA Strategist — scope, AC review, risk-based design, strategy, SPEC | No |
| [`qa-implementer`](../.claude/agents/qa-implementer.md) | QA Engineer — tests, page objects, API clients, helpers, DB | Yes |
| [`qa-debugger`](../.claude/agents/qa-debugger.md) | QA Investigator — DOM-first, root-cause, conservative classification | Yes |
| [`qa-validator`](../.claude/agents/qa-validator.md) | QA Reviewer — runs, validates vs risk, generates task report | No (report) |
| [`qa-doc-keeper`](../.claude/agents/qa-doc-keeper.md) | Knowledge Curator — catalogs + pitfalls (ALWAYS last) | Yes (docs) |

## Skills (~30) by layer

### Layer A — Strategic (cognitive QA skills)
**QA judgment** skills — analysis, design, triage.

- `scope-analysis` · `acceptance-criteria-review` · `risk-based-prioritization`
- `test-strategy-decision` · `test-design-techniques` · `exploratory-heuristics`
- `defect-triage` · `user-journey-perspective`

### Layer B — Domain (UOWN fintech knowledge)
Product-specific knowledge.

- `qa-domain-reflexes` · `application-lifecycle` · `bug-classification`
- `dom-investigation` · `merchant-preflight` · `activity-log-validation`
- `ui-first-principle` · `test-data-hierarchy` · `ssn-test-modalities`
- `gowsign-knowledge` · `payment-flows` · `fraud-vendors-knowledge`
- `regression-suites-map`

### Layer C — Patterns (code conventions)
How to write code that follows the project's standard.

- `page-object-pattern` · `api-client-pattern` · `db-polling-pattern`
- `selector-hardening` · `helpers-catalog` · `e2e-examples`
- `common-operations`

### Layer D — Standards (output formats)
Canonical artifact format.

- `test-plan-template` · `test-report-standard` · `e2e-checklist`

### Layer E — Workflows
One-off procedures.

- `fetch-gitlab-task`

## How each agent loads skills

Each SKILL.md has frontmatter:

```yaml
---
name: scope-analysis
description: Semantic trigger — when to load. E.g.: "Load it in the initial analysis of a new task, before the spec..."
disable-model-invocation: true
---
```

`disable-model-invocation: true` means: **it is not a slash command**. The agent decides to load it based on a match between the `description` and the task context.

### Concrete example

Task: *"Create a Finalize Purchase Email test for Kornerstone"*

`qa-planner` automatically loads:
- [[scope-analysis]] (any new task)
- [[acceptance-criteria-review]] (there is AC in the input)
- [[risk-based-prioritization]] (assesses where to concentrate)
- [[test-strategy-decision]] (UI-first vs API)
- [[application-lifecycle]] (involves lead creation)
- [[merchant-preflight]] (involves Kornerstone)
- [[ui-first-principle]] (template render is UI-driven)
- [[activity-log-validation]] (email dispatch = business action)

Produces a justified SPEC with the top-N scenarios prioritized by risk.

## Dispatch flow (orchestrator → agents)

| Task signal | Sequence |
|----------------|-----------|
| New feature / GitLab URL / AC list | `qa-planner` → `qa-implementer` → `qa-validator` → `qa-doc-keeper` |
| Failing / flaky test / trace | `qa-debugger` → (`qa-validator` if a report exists) → `qa-doc-keeper` |
| Refactor / cleanup | `qa-implementer` (refactor mode) → `qa-doc-keeper` |
| Update docs / catalog | `qa-doc-keeper` |
| Audit selectors / dead code | `qa-debugger` with the `selector-hardening` skill in audit mode → `qa-doc-keeper` |
| Ambiguous | `qa-planner` — it will scope it |

## Key rules (extracted from CLAUDE.md)

1. `qa-doc-keeper` ALWAYS runs last (inviolable rule #4).
2. A spec is mandatory for any non-trivial test work (rule #1).
3. `tsc --noEmit` clean before handoff (rule #3).
4. Real parallelization when work is independent (rule #6).
5. Atomic scope — each agent does one thing (rule #5).

Full details: [`CLAUDE.md`](../CLAUDE.md).

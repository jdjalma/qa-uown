# Orchestration Protocol — fintech-playwright

> Full orchestration reference for the orchestrator (CLAUDE.md). Contains: dependency graph, context loading per agent, phases 0–6, and checkpoint rules.

## Context Loading per Agent

> **Rule:** NEVER load ALL context files. Load only what the agent declares as required + optional when applicable.

| Agent | Required | Optional |
|-------|----------|----------|
| fetch-task | — | business-rules |
| spec-test | business-rules, test-patterns, architecture | environments, glossary, app-repos |
| impl-e2e | coding-standards, test-patterns, architecture | business-rules, environments, app-repos |
| impl-api | coding-standards, architecture | business-rules, environments, app-repos |
| impl-api-client | coding-standards, architecture | environments |
| impl-page-object | coding-standards, architecture | test-patterns |
| impl-db-validation | architecture, environments | coding-standards, business-rules, app-repos |
| refactor-page-object | coding-standards, architecture | test-patterns |
| debug-flaky | coding-standards, test-patterns, environments | architecture, business-rules |
| audit-selectors | coding-standards, architecture | test-patterns |
| audit-estrutura | INDEX, coding-standards | all (as needed) |
| data-merchant | coding-standards | business-rules |
| data-template | coding-standards, architecture | business-rules |
| data-test-accounts | coding-standards | environments |
| validate-results | test file path, environment, task requirements | business-rules, architecture, Postman collection, app-repos |
| docs-update (pre-analysis) | INDEX, business-rules, task description | environments, glossary, architecture, app-repos |
| docs-update (post-pipeline) | INDEX, business-rules, architecture, test-patterns | environments, glossary |

## Dependency Graph

```
sync-repos (ALWAYS — git pull --ff-only on 14 repos)
     │
     ▼
fetch-task (conditional — if GitLab URL)
     │
     ▼
docs-update [PRE-ANALYSIS] ───── updates context files if task
     │                            introduces new business rules,
     │                            terms, or requirements
     ▼
spec-test ─────────────────────────────────────┐
     │                                          │
     ▼                                          │
┌────────────────── PARALLEL ──────────────┐    │
│ impl-page-object   impl-api-client       │    │
│ data-template      impl-db-validation    │    │
└──────────┬───────────────┬───────────────┘    │
           │               │                    │
           ▼               ▼                    │
┌────────────────── PARALLEL ──────────────┐    │
│ impl-e2e              impl-api           │    │
└──────────┬───────────────┬───────────────┘    │
           │               │                    │
           ▼               ▼                    │
      tsc --noEmit (validation)                 │
           │                                    │
           ▼                                    │
      validate-results ─────────────────────────┤
      (validates test meets task requirements)  │
           │                                    │
           ▼                                    │
      docs-update [POST-PIPELINE] ◄────────────┘
      (ALWAYS LAST)

Maintenance (no pre-analysis — works on existing code):
  debug-flaky → (audit-selectors) → tsc → docs-update
  refactor-page-object → tsc → docs-update
  audit-selectors / audit-estrutura → docs-update

Data:
  docs-update [PRE-ANALYSIS] → data-merchant / data-template / data-test-accounts → docs-update [POST]
```

## Phase 0 — Sync & Source Detection

### Step 0a — Sync repos (ALWAYS)

Before any task analysis, sync all 14 application repos:

```bash
for repo in svc origination servicing website ams ams-website payment-gateway uwengine ccverification common los-common svc-common configuration fintech-qaautomation; do
  git -C "../$repo" pull --ff-only 2>&1 || echo "WARN: $repo sync failed (using stale)"
done
```

- Uses `--ff-only` to avoid merge conflicts. Failures are logged but do NOT block the pipeline.
- **Conditional DB schema refresh**: when the task involves DB changes (keywords: migration, table, column, entity, flyway), regenerate `docs/database-schema-qa2.md`.
- See `.claude/context/app-repos.md` for the full repo catalog and search patterns.

### Step 0b — Fetch task (conditional)

If input contains a GitLab URL (`https://gitlab.com/.../issues/...`):
1. Invoke `subagent-fetch-task`
2. Use output as input for Phase 1

## Phase 1 — Pre-analysis Docs (conditional)

When the task comes from an explicit source (GitLab issue, user story, or detailed requirement):
1. Read and understand the task fully
2. Invoke `docs-update` in **pre-analysis mode** — checks if the task introduces new concepts requiring documentation updates BEFORE implementation:
   - New business rules not yet documented in `docs/business-rules/`
   - New terms/glossary entries for `.claude/context/glossary.md`
   - New environment or configuration references for `context/environments.md`
   - New merchant or provider not yet in data catalog
   - Corrections to existing docs that conflict with the task description
3. If updates needed → apply now (so subsequent agents work with accurate context)
4. If no updates needed → proceed (agent reports "no pre-analysis changes needed")

> **Why first?** Agents like `spec-test`, `impl-e2e`, and `impl-api` load context files to make decisions. If docs are outdated, those agents produce incorrect output.

## Phase 2 — Classify Pipeline

See pipeline types table in `CLAUDE.md`.

> `(pre-docs)` = Phase 1 pre-analysis. Runs when task comes from an explicit source. Omitted for `debug`, `refactor`, and `audit`.
> `qa-flow` = Comprehensive 10-phase flow via `.claude/commands/qa-flow.md`.

## Phase 3 — Build Execution Plan

- **Dependencies**: execute prerequisites BEFORE
- **Parallelism**: execute in PARALLEL using Agent tool with multiple simultaneous agents
- **Propagation**: each step's result feeds the next

## Phase 4 — Execute

For each step:
1. Read the agent's context files
2. Build prompt with: agent instructions + previous steps output + user input
   - **If pre-analysis ran:** explicitly include which context files were updated and a summary of what changed — signals `spec-test` which areas are freshly updated
3. Execute: sequential inline or parallel via Agent tool
4. Capture output: files created/changed, errors, warnings

## Phase 5 — Validation

1. `tsc --noEmit` — if it fails, fix and re-validate.
2. `validate-results` — execute the test, validate results against task requirements (consults business rules, Postman collection, app source code), produce formatted scenario report, **and generate the task report artifact** (`.md` file in `tests/taskTestingUown/`).

### Task Report Artifact

The `.md` report lives alongside the test in `tests/taskTestingUown/` and **MUST be updated after every test execution**.

| Field | Value |
|-------|-------|
| **Location** | `tests/taskTestingUown/{testName}.md` |
| **Content** | Task description (from GitLab) + scenario results (PASS/FAIL with real data) + validation summary |
| **Gitignored** | Yes (`tests/taskTestingUown/*.md` in `.gitignore`) |

| Trigger | Who updates |
|---------|-------------|
| Pipeline Phase 5 (`validate-results`) | The agent writes/updates the `.md` with real execution data |
| Manual execution | The **orchestrator** (CLAUDE.md) updates the `.md` after parsing test output |
| Re-execution on different environment | Update `.md` with latest execution data (overwrites previous) |

Update rules:
1. **Parse the test output** — extract leadPk, contractUrl, ENVIRONMENT_NAME, IS_PRODUCTION, pass/fail, duration
2. **Update Test Execution section** — environment, project, date, duration, result
3. **Update Scenarios** — replace PENDING/old values with real values from execution
4. **Update Validation Summary** — passed/failed counts
5. **Never leave PENDING values** after a successful execution

The orchestrator must pass task metadata (from `fetch-task` output) to `validate-results` so the artifact includes the full task description.

## Phase 6 — Summary

Report to the user:
```
✅ Pipeline [type] completed
   Repos synced: N/M (failures logged)
   DB schema: refreshed/skipped
   App source consulted: [repo list]
   Agents executed: N
   Files created: N | changed: N
   tsc: OK/FAIL
   Docs pre-analysis: updated N files | no changes needed
   Task report: tests/taskTestingUown/{testName}.md
   Next steps: [suggested actions]
```

## Checkpoint between Phases

After each agent, verify before proceeding:

| Check | When | If it fails |
|-------|------|-------------|
| Repos synced? | After Phase 0a | Log failures, continue |
| Pre-analysis context updates consistent with existing docs? | After Phase 1 | Review and reconcile before proceeding |
| Agent produced all expected artifacts? | After each agent | Re-execute or adjust |
| Output conflicts with previous phases? | After each agent | Reconcile |
| `tsc --noEmit` passes? | After implementation | Fix errors |
| Next agent has sufficient context? | Before next agent | Supplement with pre-analysis output if available |
| New selectors added to SELECTORS? | After page object/test | Centralize |

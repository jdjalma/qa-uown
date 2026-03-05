# CLAUDE.md — fintech-playwright

> **Resumo (PT-BR):** Framework de automação de testes com Playwright + TypeScript para a plataforma fintech UOWN Leasing. Cobre 4 portais (Origination, Servicing, Website, AMS) com testes API, E2E e híbridos. Claude é totalmente autônomo — proceder sem pedir confirmação. Exceções: NÃO deletar arquivos fora do projeto, NÃO executar git commit/push.

Test automation framework with **Playwright + TypeScript** for the UOWN Leasing fintech platform. Covers 4 portals (Origination, Servicing, Website, AMS) with API, E2E, and hybrid tests.

## Stack

* **Playwright** `^1.50.0`, **TypeScript** `^5.6.0` strict, **Node.js** ESModules.
* **Database**: PostgreSQL via `pg`. **Email**: IMAP via `imapflow` (Gmail).
* **Environments**: `sandbox` (default), `qa1`, `qa2`, `stg`, `dev1`, `dev2`, `dev3`.

## Absolute Rules

### Page Object Hierarchy

```
BasePage                         # Never instantiate directly
├── LoginPage                    # Shared login (Origination/Servicing)
├── SearchPage                   # Quick search (cross-portal)
├── MerchantPage                 # Merchant operations
├── ContractPage                 # CC/bank forms, e-sign (consumer-facing)
├── PayTomorrowPortalPage        # External PayTomorrow merchant portal
├── PayPairPortalPage            # External PayPair merchant portal (TireAgent)
├── OriginationBasePage          # + origination sidebar
│   ├── OriginationCustomerPage, OverviewPage, FundingPage
│   ├── LeaseAgreementPage, MetricsCalculatorPage
├── ServicingBasePage            # + servicing sidebar
│   ├── ServicingCustomerPage, PaymentTransactionPage
│   ├── AchHistoryPage, ScheduledPaymentPage, LogPage
├── WebsiteBasePage              # + email OTP login
└── AmsBasePage → AmsPage
```

### NEVER / ALWAYS

```
❌ Page object without extending BasePage (or portal base)
❌ Hardcoded selectors in tests — use SELECTORS
❌ API client without extending BaseClient
❌ Generic setTimeout — use polling with backoff or sleep()
❌ Commit credentials or API keys
❌ Import from internal files — use barrel exports (index.ts)

✅ Page objects in src/pages/{portal}/
✅ Selectors centralized in src/selectors/common.selectors.ts
✅ API clients in src/api/clients/, bodies in bodies/, responses in responses/
✅ Test data in src/data/
✅ E2E tests in tests/e2e/{portal}/, API tests in tests/api/
✅ Task tests (from GitLab issues) in tests/taskTestingUown/
✅ test.step() to group logical actions
✅ ctx to share state between steps (same test, never across tests)
```

## Test Naming Convention

Tests from tracked tasks (GitLab issues) MUST use:

```
Pattern:   {milestone}_{camelCaseTitle}_{taskNumber}
Example:   R1.49.1_separateShortCodeInANewEntity_469
```

| Component | Rule |
|-----------|------|
| `milestone` | Exact from GitLab (e.g., `R1.49.1`) |
| `camelCaseTitle` | Task title: 1st word lowercase, subsequent capitalized, no spaces |
| `taskNumber` | GitLab issue iid (numeric) |

**In code:** `test.describe('R1.49.1_separateShortCodeInANewEntity_469 - ${data.env}/${data.merchant}', ...)`
**File:** `R1.49.1_separateShortCodeInANewEntity_469.spec.ts`
**Location:** `tests/taskTestingUown/` (all task tests — Playwright project `task-testing`)

Flow: `fetch-task` generates → `spec-test` uses in SPEC → `impl-*` uses in describe + filename.

> Non-task tests (utilities, exploratory) remain in `tests/e2e/{portal}/` and `tests/api/`.

## Mandatory Principles

1. **DRY**: Reusable logic in helpers/page objects/builders — never duplicate.
2. **Independence**: Each test is self-contained — no dependency on other tests' state.
3. **Own setup**: Tests create their own data via API/fixture.
4. **Implicit cleanup**: Fresh data (unique email, SSN, runId) — no manual cleanup.
5. **Mandatory tags**: `@smoke`/`@sanity`/`@regression` + `@critical` if applicable. Use `TestTag` enum.

## State Machine

```
UW_APPROVED → CC_AUTH_PASSED → CONTRACT_CREATED → SIGNED → SETTLED → FUNDING → FUNDED
```

* SSN not ending in 9 → `UW_APPROVED`; ending in 9 → `UW_DENIED`.
* Contract URL: `sendApplication` response → `paymentDetailsList[idx].redirectUrl`.
* E-sign: auto-detects PandaDocs vs Signwell (iframe polling).
* Refund: `FUNDED → REQUEST_REFUND → REFUNDED` (refund only via PayTomorrow portal UI).
* PayPair: Widget iframe (`#llapp-iframe`) → nested `#pt-iframe` for payment. OTP via network intercept (`/api/v1/users/send_code`).

## Definition of Done

**Tests**: `tsc --noEmit` OK, runs successfully, `test.step()`, `testData` with tags, `SELECTORS`, `ctx`.
**Page Objects**: extends base, waiters, selectors in `SELECTORS`, barrel export.
**API Clients**: extends `BaseClient`, typed response, typed body, barrel exports.
**Every PR**: no credentials, imports via path aliases, docs updated.

## Security

* Credentials in `.env` (gitignored). `.env.example` as template.
* API keys via headers in BaseClient — never in logs.
* Forbidden to write to: `**/.env`, `**/*.pem`, `node_modules/**`.

## Autonomy

* Claude is **fully autonomous** — proceed without asking for confirmation.
* **EXCEPTION 1:** Do NOT delete files outside the project directory.
* **EXCEPTION 2:** Do NOT run `git commit` or `git push`.

## Subagents

Subagents live in `.claude/agents/`. Each has a clear role and declared dependencies. CLAUDE.md (you) is the **orchestrator** — analyzes the task, builds the plan, invokes subagents in the correct order, and validates the result.

### Catalog

| Agent | Color | Role | Writes code? |
|-------|-------|------|--------------|
| `subagent-fetch-task` | blue | Fetches GitLab issue via API | No |
| `subagent-spec-test` | green | Generates test SPEC (steps, data, validations) | No |
| `subagent-impl-e2e` | orange | Implements E2E test | Yes |
| `subagent-impl-api` | orange | Implements API-only test | Yes |
| `subagent-impl-api-client` | orange | Creates typed API client | Yes |
| `subagent-impl-page-object` | orange | Creates page object | Yes |
| `subagent-impl-db-validation` | orange | Creates DB queries + polling | Yes |
| `subagent-refactor-page-object` | red | Refactors existing page object | Yes |
| `subagent-debug-flaky` | red | Diagnoses and fixes flaky test | Yes |
| `subagent-audit-selectors` | purple | Audits selectors (does not fix) | No |
| `subagent-audit-estrutura` | purple | Meta-analysis of .claude/ structure | No |
| `subagent-data-merchant` | yellow | Adds merchant to catalog | Yes |
| `subagent-data-template` | yellow | Creates JSON template | Yes |
| `subagent-data-test-accounts` | yellow | Manages test accounts | Yes |
| `subagent-validate-results` | green | Validates test results against task requirements and generates task report artifact (`.md`) | No (writes report) |
| `subagent-docs-update` | cyan | Updates documentation (ALWAYS last) | Yes (docs) |

### Context Loading per Agent

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

> **Rule:** NEVER load ALL context files. Load only what the agent declares as required + optional when applicable.

### Dependency Graph

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

## Orchestration

When receiving a task, follow this flow:

### Phase 0 — Sync & source detection

#### Step 0a — Sync repos (ALWAYS)

Before any task analysis, sync all 14 application repos:

```bash
for repo in svc origination servicing website ams ams-website payment-gateway uwengine ccverification common los-common svc-common configuration fintech-qaautomation; do
  git -C "../$repo" pull --ff-only 2>&1 || echo "WARN: $repo sync failed (using stale)"
done
```

- Uses `--ff-only` to avoid merge conflicts. Failures are logged but do NOT block the pipeline.
- **Conditional DB schema refresh**: when the task involves DB changes (keywords: migration, table, column, entity, flyway), regenerate `docs/database-schema-qa2.md`.
- See `.claude/context/app-repos.md` for the full repo catalog and search patterns.

#### Step 0b — Fetch task (conditional)

If input contains a GitLab URL (`https://gitlab.com/.../issues/...`):
1. Invoke `subagent-fetch-task`
2. Use output as input for Phase 1

### Phase 1 — Pre-analysis docs (conditional)

When the task comes from an explicit source (GitLab issue, user story, or detailed requirement):
1. Read and understand the task fully
2. Invoke `docs-update` in **pre-analysis mode** — the agent checks if the task introduces new concepts that require documentation updates BEFORE implementation:
   - New business rules not yet documented in `docs/business-rules/`
   - New terms/glossary entries for `.claude/context/glossary.md`
   - New environment or configuration references for `context/environments.md`
   - New merchant or provider not yet in data catalog
   - Corrections to existing docs that conflict with the task description
3. If updates are needed → apply them now (so subsequent agents work with accurate context)
4. If no updates needed → proceed (the agent reports "no pre-analysis changes needed")

> **Why first?** Agents like `spec-test`, `impl-e2e`, and `impl-api` load context files to make decisions. If docs are outdated or missing the business rules described in the task, those agents produce incorrect output.

### Phase 2 — Classify pipeline

| Type | When | Pipeline |
|------|------|----------|
| `new-flow` | New complete E2E flow | (pre-docs) → spec → artifacts → test → validate → docs |
| `new-api` | New API test | (pre-docs) → spec → client → test → validate → docs |
| `new-page-object` | Standalone page object | (pre-docs) → impl-page-object → docs |
| `new-api-client` | Standalone API client | (pre-docs) → impl-api-client → docs |
| `debug` | Flaky or broken test | debug-flaky → (audit-selectors) → docs |
| `refactor` | Improve existing code | refactor-page-object → docs |
| `data` | Test data | (pre-docs) → data-merchant / data-template / data-test-accounts → docs |
| `docs` | Documentation | docs-update |
| `audit` | Audit | audit-selectors / audit-estrutura → docs |
| `custom` | Manual combination | (pre-docs) → custom pipeline → docs |

> `(pre-docs)` = Phase 1 pre-analysis. Runs when task comes from an explicit source. Omitted for `debug`, `refactor`, and `audit` (these work on existing code, not new requirements).

### Phase 3 — Build execution plan

Respect:
- **Dependencies**: execute prerequisites BEFORE
- **Parallelism**: execute in PARALLEL using Agent tool with multiple simultaneous agents
- **Propagation**: each step's result feeds the next

### Phase 4 — Execute

For each step:
1. Read the agent's context files
2. Build prompt with: agent instructions + previous steps output + user input
   - **If pre-analysis ran:** explicitly include which context files were updated and a summary of what changed. This signals to the agent (especially `spec-test`) which areas of the documentation are freshly updated and should be prioritized.
3. Execute: sequential inline or parallel via Agent tool
4. Capture output: files created/changed, errors, warnings

### Phase 5 — Validation

1. `tsc --noEmit` — if it fails, fix and re-validate.
2. `validate-results` — execute the test, validate results against task requirements (consults business rules, Postman collection, app source code), produce formatted scenario report, **and generate the task report artifact** (`.md` file in `tests/taskTestingUown/`).

### Task Report Artifact

The `.md` report lives alongside the test in `tests/taskTestingUown/` and **MUST be updated after every test execution** — whether via pipeline (Phase 5) or manual execution.

| Field | Value |
|-------|-------|
| **Location** | `tests/taskTestingUown/{testName}.md` |
| **Content** | Task description (from GitLab) + scenario results (PASS/FAIL with real data) + validation summary |
| **Gitignored** | Yes (`tests/taskTestingUown/*.md` in `.gitignore`) |

#### When to update the `.md`

| Trigger | Who updates |
|---------|-------------|
| Pipeline Phase 5 (`validate-results`) | The agent writes/updates the `.md` with real execution data |
| Manual execution (user asks "execute o teste...") | The **orchestrator** (CLAUDE.md) updates the `.md` after parsing test output |
| Re-execution on different environment | Update `.md` with the latest execution data (overwrites previous) |

#### Update rules

1. **Parse the test output** — extract leadPk, contractUrl, ENVIRONMENT_NAME, IS_PRODUCTION, pass/fail, duration
2. **Update Test Execution section** — environment, project, date, duration, result
3. **Update Scenarios** — replace PENDING/old values with real values from execution
4. **Update Validation Summary** — passed/failed counts
5. **Never leave PENDING values** after a successful execution

The orchestrator must pass task metadata (from `fetch-task` output) to `validate-results` so the artifact includes the full task description.

### Phase 6 — Summary

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

### Checkpoint between phases

After each agent, verify before proceeding:

| Check | When | If it fails |
|-------|------|-------------|
| Repos synced? | After Phase 0a | Log failures, continue |
| Pre-analysis context updates are consistent with existing docs? | After Phase 1 | Review and reconcile contradictions before proceeding |
| Agent produced all expected artifacts? | After each agent | Re-execute or adjust |
| Output conflicts with previous phases? | After each agent | Reconcile |
| `tsc --noEmit` passes? | After implementation | Fix errors |
| Next agent has sufficient context? | Before next agent | Supplement with pre-analysis output if available |
| New selectors added to SELECTORS? | After page object/test | Centralize |

### Inviolable Rules

1. **Never skip spec-test** for `new-flow` and `new-api`
2. **Existing artifacts** are not recreated — check first
3. **Fail-fast**: fix `tsc` before proceeding
4. **docs-update runs TWICE** when task comes from explicit source: **pre-analysis** (Phase 1, before implementation) + **post-pipeline** (always last)
5. **docs-update post-pipeline is MANDATORY** in EVERY pipeline (no exceptions — every pipeline ends with `→ docs`)
6. **Real parallelization**: Agent tool with multiple agents, not sequential
7. **Atomic scope**: each agent does ONE thing
8. **Task report `.md` MUST be updated after every test execution** — whether via pipeline or manual. Never leave PENDING values after a successful run

## Detailed References

| Topic | File |
|-------|------|
| Structure, API clients, path aliases | [`docs/claude/architecture.md`](docs/claude/architecture.md) |
| Test patterns, fixtures, tags, best practices | [`docs/claude/patterns.md`](docs/claude/patterns.md) |
| Environments, URLs, env vars, timeouts, PW projects | [`docs/claude/environments.md`](docs/claude/environments.md) |
| Base prompts for agents | [`docs/claude/prompts.md`](docs/claude/prompts.md) |
| Agents and sub-agents | [`docs/AGENTS.md`](docs/AGENTS.md) |
| Complete business rules | [`docs/business-rules/`](docs/business-rules/) |
| Testing guide and conventions | [`docs/TESTING.md`](docs/TESTING.md) |
| ADRs (Architecture Decision Records) | [`docs/adrs/`](docs/adrs/) |
| Project context | [`.claude/context/INDEX.md`](.claude/context/INDEX.md) |
| Java ↔ TypeScript glossary | [`.claude/context/glossary.md`](.claude/context/glossary.md) |
| Application source repos | [`.claude/context/app-repos.md`](.claude/context/app-repos.md) |
| Database schema (QA2) | [`docs/database-schema-qa2.md`](docs/database-schema-qa2.md) |

## Origin

Migrated from `fintech-qaautomation` (Java/Cucumber). References to Java code appear in comments.

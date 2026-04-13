# CLAUDE.md — fintech-playwright

> **Resumo (PT-BR):** Framework de automação de testes com Playwright + TypeScript para a plataforma fintech UOWN Leasing. Cobre 4 portais (Origination, Servicing, Website, AMS) com testes API, E2E e híbridos. Claude é totalmente autônomo — proceder sem pedir confirmação. Exceções: NÃO deletar arquivos fora do projeto, NÃO executar git commit/push.

Test automation framework with **Playwright + TypeScript** for the UOWN Leasing fintech platform. Covers 4 portals (Origination, Servicing, Website, AMS) with API, E2E, and hybrid tests.

## Stack

* **Playwright** `^1.50.0`, **TypeScript** `^5.6.0` strict, **Node.js** ESModules.
* **Database**: PostgreSQL via `pg`. **Email**: IMAP via `imapflow` (Gmail).
* **Environments**: `sandbox` (default), `qa1`, `qa2`, `stg`, `dev1`, `dev2`, `dev3`.

> **Domain-specific rules** load automatically from `.claude/rules/` when Claude edits matching files:
> `page-objects.md` · `api-clients.md` · `selectors.md` · `testing.md` · `helpers.md` · `security.md`

## Autonomy

* Claude is **fully autonomous** — proceed without asking for confirmation.
* **EXCEPTION 1:** Do NOT delete files outside the project directory.
* **EXCEPTION 2:** Do NOT run `git commit` or `git push`.
* **EXCEPTION 3:** Do NOT execute INSERT, UPDATE, or DELETE directly on the database without explicit user authorization. SELECT (read-only) is always allowed.

## Subagents

Subagents live in `.claude/agents/`. CLAUDE.md is the **orchestrator** — analyze the task, build the plan, invoke subagents in order, validate result.

> **Full orchestration protocol** (phases, dependency graph, context loading, checkpoints): [`.claude/context/orchestration.md`](.claude/context/orchestration.md)

### Catalog

| Agent | Model | Role | Writes code? |
|-------|-------|------|--------------|
| `subagent-fetch-task` | sonnet | Fetches GitLab issue via API | No |
| `subagent-spec-test` | opus | Generates test SPEC (steps, data, validations) | No |
| `subagent-impl-e2e` | opus | Implements E2E test | Yes |
| `subagent-impl-api` | opus | Implements API-only test | Yes |
| `subagent-impl-api-client` | opus | Creates typed API client | Yes |
| `subagent-impl-page-object` | opus | Creates page object | Yes |
| `subagent-impl-db-validation` | opus | Creates DB queries + polling | Yes |
| `subagent-refactor-page-object` | opus | Refactors existing page object | Yes |
| `subagent-debug-flaky` | opus | Diagnoses and fixes flaky test | Yes |
| `subagent-audit` | sonnet | Audits selectors + .claude/ structure (does not fix) | No |
| `subagent-data` | sonnet | Manages data — merchants, templates, test accounts | Yes |
| `subagent-validate-results` | opus | Validates test results + generates task report artifact (`.md`) | No (writes report) |
| `subagent-docs-update` | sonnet | Updates documentation (ALWAYS last) | Yes (docs) |

### Pipeline Types

| Type | When | Pipeline |
|------|------|----------|
| `new-flow` | New complete E2E flow | (pre-docs) → spec → artifacts → test → validate → docs |
| `new-api` | New API test | (pre-docs) → spec → client → test → validate → docs |
| `new-page-object` | Standalone page object | (pre-docs) → impl-page-object → docs |
| `new-api-client` | Standalone API client | (pre-docs) → impl-api-client → docs |
| `debug` | Flaky or broken test | debug-flaky → (audit) → (validate-results se taskTestingUown) → docs |
| `refactor` | Improve existing code | refactor-page-object → docs |
| `review` | Review existing code | (refactor-page-object se necessário) → docs |
| `data` | Test data | (pre-docs) → data → docs |
| `docs` | Documentation | docs-update |
| `audit` | Audit | audit → docs |
| `qa-flow` | Full QA flow (10 phases) | `/qa-flow` command |
| `custom` | Manual combination | (pre-docs) → custom → docs |

> `(pre-docs)` = pre-analysis docs-update. Omitted for `debug`, `refactor`, and `audit`.

### Inviolable Rules

1. **Never skip spec-test** for `new-flow` and `new-api`
2. **Existing artifacts** are not recreated — check first
3. **Fail-fast**: fix `tsc` before proceeding
4. **docs-update runs TWICE** when task comes from explicit source: **pre-analysis** + **post-pipeline**
5. **docs-update post-pipeline is MANDATORY** in every pipeline (every pipeline ends with `→ docs`)
6. **Real parallelization**: Agent tool with multiple agents, not sequential
7. **Atomic scope**: each agent does ONE thing
8. **Task report `docs/taskTestingUown/{testName}/{testName}-report.md` MUST be updated after every test execution** — never leave PENDING values after a successful run

## Detailed References

| Topic | File |
|-------|------|
| Domain-specific rules (path-scoped) | [`.claude/rules/`](.claude/rules/) |
| Structure, API clients, path aliases | [`docs/claude/architecture.md`](docs/claude/architecture.md) |
| Test patterns, fixtures, tags, best practices | [`docs/claude/patterns.md`](docs/claude/patterns.md) |
| Environments, URLs, env vars, timeouts, PW projects | [`docs/claude/environments.md`](docs/claude/environments.md) |
| Base prompts for agents | [`docs/claude/prompts.md`](docs/claude/prompts.md) |
| Agents and sub-agents | [`docs/AGENTS.md`](docs/AGENTS.md) |
| Complete business rules | [`docs/business-rules/`](docs/business-rules/) |
| User Stories + Lease Risks (jornada completa) | [`docs/user-stories/jornada-completa-lease.md`](docs/user-stories/jornada-completa-lease.md) |
| Testing guide and conventions | [`docs/TESTING.md`](docs/TESTING.md) |
| ADRs (Architecture Decision Records) | [`docs/adrs/`](docs/adrs/) |
| Orchestration protocol (phases, graph, context loading) | [`.claude/context/orchestration.md`](.claude/context/orchestration.md) |
| Project context | [`.claude/context/INDEX.md`](.claude/context/INDEX.md) |
| Java ↔ TypeScript glossary | [`.claude/context/glossary.md`](.claude/context/glossary.md) |
| Application source repos | [`.claude/context/app-repos.md`](.claude/context/app-repos.md) |
| Database schema | [`docs/database-schema.md`](docs/database-schema.md) |
| Agent coordination (locks) | [`.claude/context/shared/agent-coordination.md`](.claude/context/shared/agent-coordination.md) |
| E2E agent responsibilities | [`.claude/context/shared/e2e-agent-responsibilities.md`](.claude/context/shared/e2e-agent-responsibilities.md) |
| E2E test examples | [`.claude/context/shared/e2e-test-examples.md`](.claude/context/shared/e2e-test-examples.md) |
| Common operations cookbook | [`.claude/context/shared/common-operations.md`](.claude/context/shared/common-operations.md) |
| E2E test plan template | [`.claude/context/shared/e2e-test-plan-template.md`](.claude/context/shared/e2e-test-plan-template.md) |
| E2E checklist | [`.claude/context/shared/e2e-checklist.md`](.claude/context/shared/e2e-checklist.md) |
| Test report standard | [`.claude/context/shared/e2e-test-report-standard.md`](.claude/context/shared/e2e-test-report-standard.md) |
| QA Flow command | [`.claude/commands/qa-flow.md`](.claude/commands/qa-flow.md) |
| Personal settings overrides | [`.claude/settings.local.json`](.claude/settings.local.json) (gitignored — create locally) |


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
| `subagent-page-object` | opus | Creates OR refactors page object (mode: `create` \| `refactor`) | Yes |
| `subagent-impl-db-validation` | opus | Creates DB queries + polling | Yes |
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
9. **QA domain reflexes are MANDATORY for every test creation or modification** — orchestrator MUST ensure `.claude/context/shared/qa-domain-reflexes.md` is consulted, regardless of pipeline type or whether the user invoked a formal pipeline. Applies to direct requests ("crie um teste X"), `/qa-flow`, `/new-payment-flow`, and all `new-*` pipelines. Every action step must cross-check the catalog; matching reflexes become mandatory validations.
10. **Test Data Hierarchy é regra de TODOS os níveis** — spec design, implementação, orquestração, análise direta. Criar dados fresh via automação é PADRÃO; reuso de registro existente é EXCEÇÃO com justificativa escrita + reprodução em fresh antes de classificar bugs. UPDATE direto no DB é proibido sem autorização explícita (Exception 3). Ver [`.claude/rules/testing.md § Test Data Hierarchy`](.claude/rules/testing.md).
11. **Classificação conservadora de bug** — observação isolada em dado pré-existente NÃO é bug. Bug só depois de: (a) reprodução em dados fresh, (b) checagem de task/issue existente (perguntar ao usuário), (c) descarte dos indicadores de artefato. Linguagem de relatório prefere `[OBSERVAÇÃO]` / `[HIPÓTESE]` a `[CONFIRMADO]`. Ver [`.claude/context/shared/bug-classification-rules.md`](.claude/context/shared/bug-classification-rules.md).
12. **Requisitos implícitos descobertos durante debug DEVEM virar regra antes de finalizar o pipeline.** Se um teste falhou por requisito não documentado (validação backend não óbvia, field obrigatório escondido, ordem de chamadas específica, timeout inesperado, config de ambiente), a correção só é considerada completa após: (a) fix no código E (b) adição do pitfall em [`.claude/context/shared/application-lifecycle-protocol.md § Pitfalls`](.claude/context/shared/application-lifecycle-protocol.md) (ou protocol correspondente). Alimentação do catálogo é obrigação do agent/orquestrador que descobriu, não opcional.
13. **Merchant preflight antes de toda nova aplicação.** Toda criação de aplicação via API deve garantir que a config do merchant (checkboxes + programas 13m/16m) bate com [`src/data/merchant-config-contract.ts`](src/data/merchant-config-contract.ts). `createPreQualifiedApplication` já chama `ensureMerchantReady` automaticamente; testes que usam outro caminho devem invocar o helper antes do `sendApplication`. Default: auto-heal via `createOrUpdateMerchant` (flag `AUTO_HEAL_MERCHANT=true` no `.env`; setar `false` desliga o heal e falha rápido com drift list). Testes que operam em lease/account JÁ criado NÃO devem rodar preflight — mutar config de merchant alheio ao escopo é side-effect (passar `skipMerchantPreflight: true` ou não chamar o helper). Ver pitfall #10.
14. **SEMPRE validar Activity Log — sem log = nada está acontecendo.** Toda ação relevante de negócio (signing event, payment attempt, refund, recovery, status transition, vendor callback) DEVE ter activity log/note correspondente em `uown_los_lead_notes` ou tabela equivalente. Ausência de log é falha de implementação, não comportamento aceitável. Aplica-se a TODOS os agents que criam, validam ou debugam testes (`subagent-spec-test`, `subagent-impl-e2e`, `subagent-impl-api`, `subagent-impl-db-validation`, `subagent-debug-flaky`, `subagent-validate-results`): cada step de teste que dispara ação de negócio DEVE incluir validação do log gerado (presença + conteúdo esperado). Spec/relatório que não cobre log é incompleto. Origem: daily UOWN 2026-04-28 (Priyanka Namburu): *"If there is no activity log, that means nothing is happening."* Ver [`.claude/rules/testing.md § Activity Log Validation`](.claude/rules/testing.md).
15. **UI-first como padrão. API only when feature has no UI affordance.** Se a feature tem fluxo de usuário no portal (Origination/Servicing/Website/AMS), o teste DEVE exercer esse fluxo via browser. API-only é EXCEÇÃO restrita a: (a) endpoints admin/ops sem UI exposta (ex: `PATCH /uown/svc/gowsign-templates/{id}`, sweeps de scheduled tasks, internal CRUD); (b) precondições/setup que aceleram o teste (criar lead via `sendApplication` antes de exercitar o fluxo de signing UI); (c) validações DB cross-cutting (queries de assertion). Validação visual (placeholders renderizados, badges, content do iframe GowSign, PDFs) NÃO pode ser substituída por leitura de log de backend — bug de rendering só vira detectável quando o cliente vê. Origem: 2026-05-06 — BUG-01 (placeholders vazios no PDF de Daniel's Jewelers/CA) descoberto manualmente pelo Fernando porque os testes API-only só liam logs sem renderizar PDF. Ver [`.claude/rules/testing.md § UI-First Principle`](.claude/rules/testing.md).
16. **DOM-first em falhas de seletor — inspecionar via MCP Playwright ANTES de propor fix.** Quando um teste falha com `TimeoutError`/`not visible`/`not found`/`strict mode violation` em locator UI, a PRIMEIRA AÇÃO é navegar o portal real via `mcp__playwright__browser_*`, autenticar, fixar viewport ≥ 1440×900 (Bootstrap `d-lg-block`), e usar `browser_snapshot` + `browser_evaluate` para extrair `tagName`, `role`, `accessible name`, `visible`, e ancestor chain do elemento. Construir tabela "DOM Real vs Selector Atual" e SÓ depois propor fix. Aumentar timeout, adicionar retry, `force: true` ou `waitForTimeout` como primeira reação é PROIBIDO — mascara a causa raiz. Aplicável a `subagent-debug-flaky`, `subagent-page-object`, `subagent-impl-e2e`, e análises diretas. Fallback (CI sem rede): trace + screenshot do `reports/test-results/` + HTML colado pelo user. Origem: 2026-05-11 — `unified-flow.spec.ts` "Items Purchased" timeout era selector errado (`<a>` vs `<button>`), não timing; investigação MCP resolveu em 10 minutos. Ver [`.claude/context/shared/dom-investigation-protocol.md`](.claude/context/shared/dom-investigation-protocol.md).

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
| Database schema | [`docs/taskTestingUown/database-schema.md`](docs/taskTestingUown/database-schema.md) |
| GowSign wiki mirror (overview, routing, templates, lifecycle, regression checklist) | [`docs/external/gowsign/README.md`](docs/external/gowsign/README.md) |
| Agent coordination (locks) | [`.claude/context/shared/agent-coordination.md`](.claude/context/shared/agent-coordination.md) |
| E2E agent responsibilities | [`.claude/context/shared/helpers-catalog.md / shared/api-clients-catalog.md / shared/page-objects-catalog.md`](.claude/context/shared/helpers-catalog.md / shared/api-clients-catalog.md / shared/page-objects-catalog.md) |
| E2E test examples | [`.claude/context/shared/e2e-test-examples.md`](.claude/context/shared/e2e-test-examples.md) |
| Common operations cookbook | [`.claude/context/shared/common-operations.md`](.claude/context/shared/common-operations.md) |
| E2E test plan template | [`.claude/context/shared/e2e-test-plan-template.md`](.claude/context/shared/e2e-test-plan-template.md) |
| E2E checklist | [`.claude/context/shared/e2e-checklist.md`](.claude/context/shared/e2e-checklist.md) |
| Test report standard | [`.claude/context/shared/e2e-test-report-standard.md`](.claude/context/shared/e2e-test-report-standard.md) |
| QA domain reflexes (post-action validations by action type) | [`.claude/context/shared/qa-domain-reflexes.md`](.claude/context/shared/qa-domain-reflexes.md) |
| SSN test catalog + 3 program modalities (13m / 13m+16m / 16m Second Look) | [`.claude/context/shared/ssn-test-catalog.md`](.claude/context/shared/ssn-test-catalog.md) |
| Application lifecycle protocol (13+ steps + 9 pitfalls) | [`.claude/context/shared/application-lifecycle-protocol.md`](.claude/context/shared/application-lifecycle-protocol.md) |
| Bug classification rules (require fresh reproduction before reporting) | [`.claude/context/shared/bug-classification-rules.md`](.claude/context/shared/bug-classification-rules.md) |
| DOM investigation protocol (MCP Playwright before selector fix) | [`.claude/context/shared/dom-investigation-protocol.md`](.claude/context/shared/dom-investigation-protocol.md) |
| QA Flow protocol (detailed) | [`.claude/context/shared/qa-flow-protocol.md`](.claude/context/shared/qa-flow-protocol.md) |
| QA Flow skill (compact trigger) | [`.claude/skills/qa-flow.md`](.claude/skills/qa-flow.md) |
| New Page Object skill | [`.claude/skills/new-page-object.md`](.claude/skills/new-page-object.md) |
| New API Client skill | [`.claude/skills/new-api-client.md`](.claude/skills/new-api-client.md) |
| New Payment Flow skill | [`.claude/skills/new-payment-flow.md`](.claude/skills/new-payment-flow.md) |
| Personal settings overrides | [`.claude/settings.local.json`](.claude/settings.local.json) (gitignored — create locally) |


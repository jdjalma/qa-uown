# CLAUDE.md — fintech-playwright

> **Resumo (PT-BR):** Framework de automação de testes com Playwright + TypeScript para a plataforma fintech UOWN Leasing. Cobre 4 portais (Origination, Servicing, Website, AMS) com testes API, E2E e híbridos. Claude é totalmente autônomo — proceder sem pedir confirmação. Exceções: NÃO deletar arquivos fora do projeto, NÃO executar INSERT/UPDATE/DELETE no DB sem autorização.

Test automation framework with **Playwright + TypeScript** for the UOWN Leasing fintech platform. Covers 4 portals (Origination, Servicing, Website, AMS) with API, E2E, and hybrid tests.

## Stack

* **Playwright** `^1.50.0`, **TypeScript** `^5.6.0` strict, **Node.js** ESModules.
* **Database**: PostgreSQL via `pg`. **Email**: IMAP via `imapflow` (Gmail).
* **Environments**: `sandbox` (default), `qa1`, `qa2`, `stg`, `dev1`, `dev2`, `dev3`.

> **Domain-specific rules** (path-scoped, load automatically when editing matching files):
> [`.claude/rules/`](.claude/rules/) — `page-objects.md` · `api-clients.md` · `selectors.md` · `testing.md` · `helpers.md` · `security.md`

## Autonomy

* Claude is **fully autonomous** — proceed without asking for confirmation.
* **EXCEPTION 1:** Do NOT delete files outside the project directory.
* **EXCEPTION 2:** Do NOT execute INSERT, UPDATE, or DELETE directly on the database without explicit user authorization. SELECT (read-only) is always allowed.

## Architecture: 5 agents + ~35 QA skills

Agents are **QA professionals**, not pipelines. Each agent loads relevant skills autonomously based on context signals. All skills are available for automatic agent use; they can also be invoked directly by the user.

### Agents

| Agent | Role | Model | Writes code? |
|-------|------|-------|--------------|
| [`qa-planner`](.claude/agents/qa-planner.md) | QA Strategist — scope, AC review, risk-based design, strategy decision, SPEC | opus | No |
| [`qa-implementer`](.claude/agents/qa-implementer.md) | QA Engineer — implements tests, page objects, API clients, helpers, DB validation | opus | Yes |
| [`qa-debugger`](.claude/agents/qa-debugger.md) | QA Investigator — DOM-first, root-cause, conservative classification, catalog feed | opus | Yes |
| [`qa-validator`](.claude/agents/qa-validator.md) | QA Reviewer — runs tests, validates vs AC/risk, produces task report | opus | No (report) |
| [`qa-doc-keeper`](.claude/agents/qa-doc-keeper.md) | Knowledge Curator — catalogs, pitfalls, ADRs (ALWAYS last) | opus | Yes (docs) |

### Skills

Skills live in `.claude/skills/{slug}/SKILL.md` with `disable-model-invocation: true` — agents load them autonomously when their `description` matches the task context. Organized in 5 layers:

| Layer | Purpose | Examples |
|-------|---------|----------|
| **A — Strategic** | QA cognitive skills (analysis, design, triage) | `scope-analysis`, `acceptance-criteria-review`, `risk-based-prioritization`, `test-strategy-decision`, `test-design-techniques`, `exploratory-heuristics`, `defect-triage`, `user-journey-perspective` |
| **B — Domain** | UOWN fintech knowledge | `qa-domain-reflexes`, `application-lifecycle`, `bug-classification`, `dom-investigation`, `merchant-preflight`, `activity-log-validation`, `ui-first-principle`, `test-data-hierarchy`, `ssn-test-modalities`, `gowsign-knowledge`, `payment-flows`, `fraud-vendors-knowledge`, `regression-suites-map`, `email-templates-catalog`, `volatile-knowledge-registry` |
| **C — Patterns** | Code conventions | `page-object-pattern`, `api-client-pattern`, `db-polling-pattern`, `selector-hardening`, `helpers-catalog`, `e2e-examples`, `common-operations` |
| **D — Standards** | Output formats | `test-plan-template`, `test-report-standard`, `e2e-checklist`, `task-evidence-report` |
| **E — Workflows** | Procedures | `fetch-gitlab-task` |
| **F — Planning & Docs** | Scenario writing, investigation, reporting, UI quality | `test-scenarios` (Gherkin → `docs/scenarios/`), `discovery` (UI investigation via Playwright → `docs/knowledge-base/`), `test-report` (executive report → `docs/reports/`), `qa-lens` (UI quality from user perspective), `check-points` (consequence oracle for Then steps) |

Full skill list: [`.claude/skills/`](.claude/skills/)

## Orchestration (this file = orchestrator)

When you receive a task, classify the **signal** and dispatch to agents. No slash commands — read the request and decide:

| Signal | Dispatch chain |
|--------|---------------|
| New feature / new test request, GitLab URL, AC list | `qa-planner` → `qa-implementer` → `qa-validator` → `qa-doc-keeper` |
| "Test X is failing / flaky", trace/screenshot, timeout error | `qa-debugger` → (`qa-validator` if test is in `docs/taskTestingUown/`) → `qa-doc-keeper` |
| "Refactor page object Y" / "this is duplicated" | `qa-implementer` (refactor mode) → `qa-doc-keeper` |
| "Update docs" / "catalog this helper" / "add ADR" | `qa-doc-keeper` |
| "Audit selectors" / "find dead code" | `qa-debugger` with `selector-hardening` skill in audit mode → `qa-doc-keeper` |
| Setup data / new merchant / new test account | `qa-implementer` (data subset) → `qa-doc-keeper` |
| Ambiguous request | Default to `qa-planner` — it will scope and propose |

**Real parallelization**: when scope allows, invoke multiple `qa-implementer` instances in parallel for independent artifacts (page object + API client + test file). The orchestrator decides parallelization, not the agents.

### Signal → docs canônicos (injetar no prompt da Task)

Além das skills (`[[slug]]`), o orquestrador resolve os **docs canônicos** do sinal e injeta no prompt da Task — o agente começa na fonte certa em vez de redescobrir relevância. Use `node scripts/docs-tooling.mjs resolve <tópico>` para obter arquivo + seção + frescor (protocolo em [`docs/_docs-conventions.md`](docs/_docs-conventions.md) §5–§7).

| Sinal da task | `resolve <tópico>` sugeridos |
|---------------|------------------------------|
| Signing / contrato / GowSign / SignWell | `gowsign-routing` · `esign` · `template-rendering` |
| Funding / merchant / webhook | `funding-queue` · `merchant-config` · `webhooks` · `merchant-snapshot` |
| Pagamento / CC / ACH / sweep | `cc-payments` · `ach-payments` · `nsf-fee` · `sweeps` |
| Underwriting / fraude / SSN | `underwriting` · `fraud-vendors` · `ssn` |
| EPO / payoff / cálculo | `epo` · `payoff` · `payment-calculator` |
| Modificação de conta | `settlement` · `due-date-move` · `additional-lease` |
| Rating / auto-pay / inadimplência | `rating-letters` · `auto-pay` · `delinquency` |

Regra: pergunta de **comportamento** → `resolve` (business-rules canônico); "**como dirijo o teste**" → skill; "**gotcha recente**" → knowledge-base.

### Parallel execution limits

- **Max 3 agents simultaneos.** Alem disso, context switching e conflito de arquivo superam o ganho.
- **Agents paralelos NAO podem editar o mesmo arquivo.** Se dois implementers precisam do mesmo page object, serializar (um cria, outro consome).
- **Lock protocol:** antes de editar arquivo compartilhado (`src/pages/`, `src/helpers/`, `src/selectors/common.selectors.ts`), o agent verifica se outro agent esta editando via PID lock em `.claude/locks/`. Protocolo completo em `.claude/context/shared/agent-coordination.md`.
- **Conflito detectado em runtime:** se dois agents editaram o mesmo arquivo, o orchestrador faz merge manual ou pede ao user para resolver.

### Skill loading enforcement

- **Subagents não têm a tool `Skill`** — para eles, carregar skill = `Read` em `.claude/skills/{slug}/SKILL.md` (protocolo de carga definido em cada `.claude/agents/*.md`).
- **Ao despachar um agent, incluir no prompt da Task as skills (`[[<slug>]]`) que o sinal da task já indica** (ex.: signing → `[[gowsign-knowledge]]`; falha de locator → `[[dom-investigation]]`). O agent ainda decide cargas adicionais pelo protocolo dele.
- **Todo output de agent DEVE terminar com a linha `**Skills loaded:**`** listando os SKILL.md efetivamente lidos. Output sem essa linha → devolver ao agent UMA vez exigindo a declaração antes de aceitar o resultado.
- Afirmação técnica justificada por skill ausente da declaração degrada para `[HIPÓTESE]` (regra #16).
- **Camada mecânica:** hook `SubagentStop` (`.claude/scripts/verify-skills-loaded.mjs`, registrado em `.claude/settings.json`) bloqueia agent `qa-*` de encerrar se (a) nenhum `.claude/skills/*/SKILL.md` foi lido via `Read` no transcript OU (b) o output final não contém `Skills loaded:`. Bloqueia no máximo 1× por ciclo (guard `stop_hook_active`); agents não-QA passam direto. Decisões logadas em `.claude/logs/skills-hook.log`.

### Pipeline loop cap

- **Max 3 ciclos validator-debugger por pipeline.** Cada devolucao do validator ao debugger conta como 1 ciclo.
- No 3o ciclo sem resolucao: validator produz report parcial e escala ao user.
- Independente do 3-strike do debugger (que e por hipotese, nao por ciclo).

## Inviolable Rules

1. **Never skip planning** — any non-trivial test work starts with `qa-planner`. `qa-implementer` does not write tests without a SPEC.
2. **Existing artifacts are not recreated** — always check catalogs (`helpers-catalog`, `page-object-pattern`, `api-client-pattern`) before creating new.
3. **Fail-fast**: fix `tsc --noEmit` before handing off.
4. **`qa-doc-keeper` runs last in every pipeline** — no exceptions. Catalogs and pitfalls must stay in sync.
5. **Atomic scope**: each agent does ONE thing. Don't mix planning + implementation in one invocation.
6. **Real parallelization**: spawn agents in parallel when work is independent.
7. **Task report `docs/taskTestingUown/{testName}/{testName}-report.md` MUST be updated after every test execution** — never leave PENDING values after a successful run. Owned by `qa-validator`.
8. **QA domain reflexes are MANDATORY for every test creation or modification** — agents must consult [[qa-domain-reflexes]] skill regardless of task signal. Every business action step gets a corresponding validation.
9. **Test Data Hierarchy applies at every level** — spec design, implementation, orchestration, direct analysis. Fresh data via automation is DEFAULT; reusing existing record is EXCEPTION with written justification + fresh reproduction before classifying as bug. Direct UPDATE on DB is forbidden without explicit user authorization (Exception 3). See [[test-data-hierarchy]].
10. **Conservative bug classification** — isolated observation in pre-existing data is NOT a bug. Bug requires: (a) reproduction in fresh data, (b) check of existing task/issue (ask the user), (c) ruling out artifact indicators. Report language prefers `[OBSERVAÇÃO]` / `[HIPÓTESE]` over `[CONFIRMADO]`. See [[bug-classification]].
11. **Implicit requirements discovered during debug MUST become rules before pipeline closes.** If a test failed because of an undocumented requirement (non-obvious backend validation, hidden mandatory field, specific call order, unexpected timeout, environment config), the fix is only complete after: (a) code fix AND (b) pitfall added to [[application-lifecycle]] (or corresponding domain skill). Feeding the catalog is mandatory for the agent/orchestrator that discovered it, not optional.
12. **Merchant preflight before every new application.** Every application creation via API or UI must ensure merchant config (checkboxes + 13m/16m programs) matches [`src/data/merchant-config-contract.ts`](src/data/merchant-config-contract.ts). `createPreQualifiedApplication` calls `ensureMerchantReady` automatically; tests using other paths must invoke the helper before `sendApplication`. Default: auto-heal via `createOrUpdateMerchant` (flag `AUTO_HEAL_MERCHANT=true` in `.env`; set `false` to disable heal and fail-fast with drift list). Tests operating on existing lease/account should NOT run preflight — mutating out-of-scope merchant config is a side effect (pass `skipMerchantPreflight: true` or skip the helper). See [[merchant-preflight]].
13. **ALWAYS validate Activity Log — no log = nothing is happening.** Every relevant business action (signing event, payment attempt, refund, recovery, status transition, vendor callback) MUST have a corresponding activity log/note in `uown_los_lead_notes` or equivalent table. Absent log is an implementation failure, not acceptable behavior. Applies to ALL agents. Every test step that triggers a business action MUST include validation of the generated log (presence + expected content). Spec/report without log coverage is incomplete. Origin: daily UOWN 2026-04-28 (Priyanka Namburu): *"If there is no activity log, that means nothing is happening."* See [[activity-log-validation]].
14. **UI-first as default. API only when feature has no UI affordance.** If the feature has a user flow in the portal (Origination/Servicing/Website/AMS), the test MUST exercise that flow via browser. API-only is restricted EXCEPTION to: (a) admin/ops endpoints with no UI exposed (e.g. `PATCH /uown/svc/gowsign-templates/{id}`, scheduled task sweeps, internal CRUD); (b) preconditions/setup that accelerate the test (creating a lead via `sendApplication` before exercising the UI signing flow); (c) cross-cutting DB validations (assertion queries). Visual validation (rendered placeholders, badges, GowSign iframe content, PDFs) CANNOT be replaced by backend log reading — rendering bugs only become detectable when the customer sees them. Origin: 2026-05-06 — BUG-01 (empty placeholders in PDF of Daniel's Jewelers/CA) discovered manually by Fernando because API-only tests only read logs without rendering PDF. See [[ui-first-principle]].
15. **DOM-first on selector failures — inspect via MCP Playwright BEFORE proposing fix.** When a test fails with `TimeoutError`/`not visible`/`not found`/`strict mode violation` in a UI locator, the FIRST ACTION is to navigate the real portal via `mcp__playwright__browser_*`, authenticate, and use `browser_snapshot` + `browser_evaluate` to extract `tagName`, `role`, `accessible name`, `visible`, and ancestor chain of the element. **Viewport is portal-aware:** Origination/Servicing/AMS (portais internos, agent-facing) = `1440×900` único (Bootstrap `d-lg-block` ≥992px); Website (portal do cliente, customer-facing) = inspecionar em `375×667` + `768×1024` + `1440×900` em sequência — fluxo mobile-heavy (OTP, signing, application form em celular); bug mobile-only é regressão silenciosa se nunca inspecionado. Build "DOM Real vs Selector Atual" table and ONLY THEN propose fix. Increasing timeout, adding retry, `force: true`, or `waitForTimeout` as first reaction is FORBIDDEN — masks root cause. Applies to `qa-debugger`, `qa-implementer`, and direct analysis. Fallback (CI without network): trace + screenshot from `reports/test-results/` + HTML pasted by user. Origin: 2026-05-11 — `unified-flow.spec.ts` "Items Purchased" timeout was wrong selector (`<a>` vs `<button>`), not timing; MCP investigation resolved in 10 minutes. Portal-aware viewport adicionado 2026-05-22 (Website mobile gap). See [[dom-investigation]].
16. **Reports em `docs/taskTestingUown/` são histórico, não fonte de padrão.** Agentes NÃO devem ler reports antigos como fonte de patterns (selectors, helpers, classification, page objects). Fonte de pattern são skills (`.claude/skills/`) e código (`src/`, `tests/`). Re-leitura de report permitida APENAS para: (a) `qa-validator` atualizando após nova execução, (b) reprodução manual via leadPk/accountPk, (c) auditoria solicitada pelo user. **Inferir pattern a partir de report = bug do agente.** Todo report gerado carrega disclaimer "Este arquivo é registro de execução, NÃO fonte de padrão" no topo (template em [[test-report-standard]] seção 1). Source-tagging obrigatório em toda asserção técnica — sem tag de fonte primária acompanhante, classificação degrada de `[CONFIRMADO]` para `[HIPÓTESE]` (taxonomia em [[test-report-standard]] seção 9). Categorias drift-prone (sweep SQL, merchant config, rating letters, env provisioning, vendor health, activity log schema, portal naming) listadas em [[volatile-knowledge-registry]] — sempre verificar fonte primária antes de afirmar. Memórias (`.claude/projects/.../memory/`) são registros datados — podem estar stale, exigem cross-check. Origem: 2026-05-22 — risco identificado pelo user de agentes inferirem pattern a partir de report antigo com classificação pré-regra-#10 ou helpers/selectors deprecated.

17. **Ao FECHAR pipeline de teste, gerar `{testName}-evidence.md` (stakeholder-facing) além do `-report.md` (history técnica).** O evidence é o artefato que vai colado no comentário do GitLab/Jira como prova de validação QA: product-focused, TL;DR + TOC + badges + `<details>` em achados + agrupamento por status (Observações / Bloqueadores). Distinto do `-report.md` (técnico, para QA interno). Gerar APENAS uma vez por ciclo de task, quando: (a) último PASS validado, (b) sem bugs bloqueantes pendentes de re-execução, (c) usuário sinalizou "pipeline fechado", "pronto pra colar no ticket", "final report" ou equivalente. NÃO gerar em execução intermediária. Owner: `qa-validator` Phase 6.5. Template + checklist + regras de estilo (NÃO usar em-dash `—`; cenários DESCRITOS em prose, não em tabela apertada) em [[task-evidence-report]]. Origem: 2026-05-24 — usuário formalizou estilo após 3 iterações manuais com diferentes formatos de evidence.

18. **Discovery e investigação seguem hierarquia UI → API → DB — sem exceção.** Qualquer agente (orquestrador ou subagente) que precise descobrir como uma feature funciona, mapear estados, entender fluxo de dados ou investigar um comportamento DEVE percorrer as etapas nesta ordem: **(1) UI via MCP Playwright** — navegar o portal, clicar nas funcionalidades, percorrer TODAS as telas e opções relevantes, capturar snapshots; **(2) API** — inspecionar endpoints, payloads, respostas e headers; **(3) Banco de dados** — consultar tabelas e registros para confirmar persistência. Pular a camada UI e ir direto à API ou ao DB é PROIBIDO quando o portal expõe a feature — o comportamento visto pelo usuário real é a fonte primária de verdade. A hierarquia garante que bugs visuais, fluxos quebrados e inconsistências de renderização não sejam mascarados por leitura direta do estado interno. Exceções permitidas: (a) feature sem UI conhecida (endpoint interno/admin sem affordance visual), neste caso iniciar pela API documentando explicitamente a ausência de UI; (b) CI sem rede (fallback trace/screenshot). Aplica-se a `qa-planner`, `qa-debugger`, `qa-implementer`, `qa-validator` e ao orquestrador. Origem: 2026-06-01 — instrução do user para garantir que discovery começa sempre pelo comportamento real do portal.

## Detailed References

| Topic | File |
|-------|------|
| Domain-specific rules (path-scoped) | [`.claude/rules/`](.claude/rules/) |
| Skills (all 30+) | [`.claude/skills/`](.claude/skills/) |
| Agents | [`.claude/agents/`](.claude/agents/) |
| Structure, API clients, path aliases | [`.claude/context/project.md`](.claude/context/project.md) |
| Environments, URLs, env vars, timeouts, PW projects | [`docs/claude/environments.md`](docs/claude/environments.md) |
| Test patterns, fixtures, tags, best practices | Skills [[e2e-examples]] · [[common-operations]] · [[page-object-pattern]] · [[api-client-pattern]] |
| Agents and sub-agents | [`docs/AGENTS.md`](docs/AGENTS.md) |
| Complete business rules | [`docs/business-rules/`](docs/business-rules/) |
| BDD scenarios per demand (Gherkin, from `/test-scenarios`) | [`docs/scenarios/`](docs/scenarios/) |
| Stakeholder test reports (from `/test-report`) | [`docs/reports/`](docs/reports/) |
| Per-feature investigation knowledge (from `/discovery`) | [`docs/knowledge-base/`](docs/knowledge-base/) |
| User Stories + Lease Risks (full journey) | [`docs/user-stories/jornada-completa-lease.md`](docs/user-stories/jornada-completa-lease.md) |
| Testing guide and conventions | [`docs/TESTING.md`](docs/TESTING.md) |
| ADRs (Architecture Decision Records) | [`docs/adrs/`](docs/adrs/) |
| Project context | [`.claude/context/project.md`](.claude/context/project.md) |
| Java ↔ TypeScript glossary | [`.claude/context/glossary.md`](.claude/context/glossary.md) |
| Application source repos | [`.claude/context/app-repos.md`](.claude/context/app-repos.md) |
| Database schema | [`docs/taskTestingUown/database-schema.md`](docs/taskTestingUown/database-schema.md) |
| Agent coordination (locks) | [`.claude/context/shared/agent-coordination.md`](.claude/context/shared/agent-coordination.md) |
| Personal settings overrides | [`.claude/settings.local.json`](.claude/settings.local.json) (gitignored — create locally) |

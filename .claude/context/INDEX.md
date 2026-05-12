<!-- PT-BR: Índice de contexto do projeto. Consulte os arquivos abaixo conforme o tipo de trabalho. -->

# Context Index — fintech-playwright

Context directory for the project, organized by topic for focused reference.

---

## Available Files

| File | Description | When to consult |
|------|-------------|-----------------|
| **[project.md](./project.md)** | Overview, structure, architecture (3 seções consolidadas) — stack, portals, diretório, hierarquia de page objects, API clients, ADRs | Starting any work, structural decisions, creating/organizing files |
| **[coding-standards.md](./coding-standards.md)** | Global guidelines, absolute rules, conventions | During development |
| **[test-patterns-core.md](./test-patterns-core.md)** | Naming, fixtures, testData, risk tier, helpers, env limitations, timeouts | Creating any test (E2E ou API) |
| **[test-patterns-ui.md](./test-patterns-ui.md)** | Hybrid API+UI, triple validation, react-data-table, MobX, tabs, downloads, sort indicators, UI stability | Tests com interação de browser |
| **[test-patterns-arrangements.md](./test-patterns-arrangements.md)** | CC/ACH arrangements, schema/FK validation, GDS bypass (existingAccountPks), expression indexes | Payment arrangement ou DB index tests |
| **[business-rules.md](./business-rules.md)** | Summarized business rules, state machine, SSN. Appendix G = risk scenarios (low/medium/high) | Before creating validations or parametrizing test data |
| **[environments.md](./environments.md)** | Environments, URLs, DB config, timeouts | Configuration and debugging |
| **[glossary.md](./glossary.md)** | Java/Cucumber → TypeScript/Playwright mapping | Migration, onboarding, legacy code references |
| **[app-repos.md](./app-repos.md)** | Application source repo catalog (14 repos) | Task analysis, SPEC generation, result validation |
| **[orchestration.md](./orchestration.md)** | Full orchestration protocol (phases 0–6, dependency graph, context loading, checkpoints) | Pipeline execution, agent coordination |

---

## Consultation Flow

### For new tests
1. `business-rules.md` → understand flow rules
2. `test-patterns-core.md` / `test-patterns-ui.md` / `test-patterns-arrangements.md` → patterns and fixtures
3. `coding-standards.md` → mandatory conventions

### For new page objects / API clients
1. `project.md` → where to place files
2. `project.md` → hierarchies and patterns
3. `coding-standards.md` → absolute rules

### For payment tests (CC/ACH arrangements, lead setup)
1. `shared/common-operations.md` → exact signatures, complete working code
2. `test-patterns-core.md` / `test-patterns-ui.md` / `test-patterns-arrangements.md` → patterns for the surrounding test structure
3. `business-rules.md` → arrangement states and business logic

### For debugging
1. `environments.md` → timeouts, URLs, DB
2. `test-patterns-core.md` / `test-patterns-ui.md` / `test-patterns-arrangements.md` → hooks, waiters
3. `shared/dom-investigation-protocol.md` → MANDATORY (CLAUDE.md #16) para falhas de seletor — inspecionar DOM via MCP Playwright ANTES de propor fix

### For task analysis (with app source)
1. `business-rules.md` → understand flow rules
2. `app-repos.md` → locate source code (controllers, migrations, components)
3. Cross-reference with Postman collection and DB schema doc

### For legacy Java code references
1. `glossary.md` → term, method, and pattern mapping

## Shared Context Files (`.claude/context/shared/`)

| File | Description | When to consult |
|------|-------------|-----------------|
| **[agent-coordination.md](./shared/agent-coordination.md)** | Lock file protocol for multi-terminal coordination | Before editing shared files in parallel |
| **[helpers-catalog.md](./shared/helpers-catalog.md)** | Catálogo de helpers em `src/helpers/` + funções-chave do `database.helpers.ts` | Looking up helper signatures |
| **[api-clients-catalog.md](./shared/api-clients-catalog.md)** | Catálogo de API clients (`AccountClient`, `MerchantClient`, `ApplicationClient`, `BankAccountClient`, `ScheduledTaskClient`, `SvcPhoneClient`, `SvcContactClient`, `SvcEmailClient`) com métodos por task | Writing API tests or extending clients |
| **[page-objects-catalog.md](./shared/page-objects-catalog.md)** | Catálogo detalhado de page objects (ErrorLogPage, ProgramsPage, LeadsPage, ContractPage, ServicingCustomerPage, MerchantEditPage, AmsUserDetailsPage, etc.) + métodos por task | Writing E2E tests or extending page objects |
| **[e2e-test-examples.md](./shared/e2e-test-examples.md)** | Real code examples from the project | When writing new tests |
| **[e2e-test-plan-template.md](./shared/e2e-test-plan-template.md)** | User Story + CT-XX scenario templates | When planning test coverage |
| **[e2e-checklist.md](./shared/e2e-checklist.md)** | Checklist per feature type (wizard, permissions, etc.) | Before implementing to ensure coverage |
| **[e2e-test-report-standard.md](./shared/e2e-test-report-standard.md)** | Report format, artifact template, parsing rules | When generating test reports |
| **[common-operations.md](./shared/common-operations.md)** | Cookbook: imports, CC/ACH arrangements, driveToFunded, correct signatures | **MANDATORY** for payment tests, funding flows, or any multi-step API setup |

## Complementary Structure

| Directory | Purpose |
|-----------|---------|
| `.claude/agents/` | 13 specialized subagents — invoked by CLAUDE.md (orchestrator) |
| `.claude/skills/` | Skills (`/qa-flow`, `/new-*`, `/audit`, `/debug-flaky`, etc.) — triggers + compact reference; protocolo detalhado em `context/shared/qa-flow-protocol.md` |
| `.claude/locks/` | PID-based lock files for multi-terminal coordination (gitignored) |

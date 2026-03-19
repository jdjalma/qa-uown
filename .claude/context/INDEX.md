<!-- PT-BR: Índice de contexto do projeto. Consulte os arquivos abaixo conforme o tipo de trabalho. -->

# Context Index — fintech-playwright

Context directory for the project, organized by topic for focused reference.

---

## Available Files

| File | Description | When to consult |
|------|-------------|-----------------|
| **[project-overview.md](./project-overview.md)** | Stack, portals, environments, project summary | Starting any work |
| **[project-structure.md](./project-structure.md)** | Full directory tree and file placement conventions | Creating/organizing files |
| **[coding-standards.md](./coding-standards.md)** | Global guidelines, absolute rules, conventions | During development |
| **[architecture.md](./architecture.md)** | Page Objects, API Clients, hierarchies, ADR table | Structural decisions |
| **[test-patterns.md](./test-patterns.md)** | E2E and API test patterns, fixtures, hooks | Creating tests |
| **[business-rules.md](./business-rules.md)** | Summarized business rules, state machine, SSN. Appendix G = risk scenarios (low/medium/high) | Before creating validations or parametrizing test data |
| **[environments.md](./environments.md)** | Environments, URLs, DB config, timeouts | Configuration and debugging |
| **[glossary.md](./glossary.md)** | Java/Cucumber → TypeScript/Playwright mapping | Migration, onboarding, legacy code references |
| **[app-repos.md](./app-repos.md)** | Application source repo catalog (14 repos) | Task analysis, SPEC generation, result validation |

---

## Consultation Flow

### For new tests
1. `business-rules.md` → understand flow rules
2. `test-patterns.md` → patterns and fixtures
3. `coding-standards.md` → mandatory conventions

### For new page objects / API clients
1. `project-structure.md` → where to place files
2. `architecture.md` → hierarchies and patterns
3. `coding-standards.md` → absolute rules

### For payment tests (CC/ACH arrangements, lead setup)
1. `shared/common-operations.md` → exact signatures, complete working code
2. `test-patterns.md` → patterns for the surrounding test structure
3. `business-rules.md` → arrangement states and business logic

### For debugging
1. `environments.md` → timeouts, URLs, DB
2. `test-patterns.md` → hooks, waiters

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
| **[e2e-agent-responsibilities.md](./shared/e2e-agent-responsibilities.md)** | Helpers, page objects, structure, patterns | When implementing tests or page objects |
| **[e2e-test-examples.md](./shared/e2e-test-examples.md)** | Real code examples from the project | When writing new tests |
| **[e2e-test-plan-template.md](./shared/e2e-test-plan-template.md)** | User Story + CT-XX scenario templates | When planning test coverage |
| **[e2e-checklist.md](./shared/e2e-checklist.md)** | Checklist per feature type (wizard, permissions, etc.) | Before implementing to ensure coverage |
| **[e2e-test-report-standard.md](./shared/e2e-test-report-standard.md)** | Report format, artifact template, parsing rules | When generating test reports |
| **[common-operations.md](./shared/common-operations.md)** | Cookbook: imports, CC/ACH arrangements, driveToFunded, correct signatures | **MANDATORY** for payment tests, funding flows, or any multi-step API setup |

## Complementary Structure

| Directory | Purpose |
|-----------|---------|
| `.claude/agents/` | 16 specialized subagents — invoked by CLAUDE.md (orchestrator) |
| `.claude/commands/` | Slash commands (`/qa-flow` — full 10-phase QA flow) |
| `.claude/locks/` | PID-based lock files for multi-terminal coordination (gitignored) |
| `.claude/prompt/` | Journal of successful historical prompts (reference) |

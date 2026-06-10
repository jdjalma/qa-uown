# Agents & Skills — fintech-playwright

> **Resumo (PT-BR):** O projeto usa 5 agents enxutos em `.claude/agents/` e ~30 skills em `.claude/skills/`. Agents carregam skills sob demanda baseado em sinais semânticos da task — não há slash commands. CLAUDE.md é o orquestrador.

## Arquitetura

```
CLAUDE.md (orchestrator)
   ↓ (task signal)
.claude/agents/qa-{planner|implementer|debugger|validator|doc-keeper}.md
   ↓ (load on-demand by description match)
.claude/skills/{slug}/SKILL.md  (disable-model-invocation: true)
```

## Agents (5)

Todos opus exceto `qa-doc-keeper` (opus).

| Agent | Papel | Escreve código? |
|-------|-------|------------------|
| [`qa-planner`](../.claude/agents/qa-planner.md) | QA Strategist — scope, AC review, risk-based design, strategy, SPEC | Não |
| [`qa-implementer`](../.claude/agents/qa-implementer.md) | QA Engineer — testes, page objects, API clients, helpers, DB | Sim |
| [`qa-debugger`](../.claude/agents/qa-debugger.md) | QA Investigator — DOM-first, root-cause, classificação conservadora | Sim |
| [`qa-validator`](../.claude/agents/qa-validator.md) | QA Reviewer — runs, valida vs risco, gera task report | Não (report) |
| [`qa-doc-keeper`](../.claude/agents/qa-doc-keeper.md) | Knowledge Curator — catálogos + pitfalls (ALWAYS last) | Sim (docs) |

## Skills (~30) por camada

### Camada A — Strategic (cognitive QA skills)
Habilidades de **julgamento de QA** — análise, design, triagem.

- `scope-analysis` · `acceptance-criteria-review` · `risk-based-prioritization`
- `test-strategy-decision` · `test-design-techniques` · `exploratory-heuristics`
- `defect-triage` · `user-journey-perspective`

### Camada B — Domain (UOWN fintech knowledge)
Conhecimento específico do produto.

- `qa-domain-reflexes` · `application-lifecycle` · `bug-classification`
- `dom-investigation` · `merchant-preflight` · `activity-log-validation`
- `ui-first-principle` · `test-data-hierarchy` · `ssn-test-modalities`
- `gowsign-knowledge` · `payment-flows` · `fraud-vendors-knowledge`
- `regression-suites-map`

### Camada C — Patterns (code conventions)
Como escrever código que segue o padrão do projeto.

- `page-object-pattern` · `api-client-pattern` · `db-polling-pattern`
- `selector-hardening` · `helpers-catalog` · `e2e-examples`
- `common-operations`

### Camada D — Standards (output formats)
Formato canônico de artefatos.

- `test-plan-template` · `test-report-standard` · `e2e-checklist`

### Camada E — Workflows
Procedimentos pontuais.

- `fetch-gitlab-task`

## Como cada agent carrega skills

Cada SKILL.md tem frontmatter:

```yaml
---
name: scope-analysis
description: Gatilho semântico — quando carregar. Ex: "Carregue na análise inicial de task nova, antes de spec..."
disable-model-invocation: true
---
```

`disable-model-invocation: true` significa: **não é slash command**. O agent decide carregar baseado em match entre o `description` e o contexto da task.

### Exemplo concreto

Task: *"Criar teste de Finalize Purchase Email para Kornerstone"*

`qa-planner` automaticamente carrega:
- [[scope-analysis]] (qualquer task nova)
- [[acceptance-criteria-review]] (há AC no input)
- [[risk-based-prioritization]] (avalia onde concentrar)
- [[test-strategy-decision]] (UI-first vs API)
- [[application-lifecycle]] (envolve criação de lead)
- [[merchant-preflight]] (envolve Kornerstone)
- [[ui-first-principle]] (template render é UI-driven)
- [[activity-log-validation]] (dispatch email = business action)

Produz SPEC justificado com top-N cenários prioritizados por risco.

## Fluxo de dispatch (orchestrator → agents)

| Sinal da task | Sequência |
|----------------|-----------|
| Nova feature / GitLab URL / AC list | `qa-planner` → `qa-implementer` → `qa-validator` → `qa-doc-keeper` |
| Teste falhando / flaky / trace | `qa-debugger` → (`qa-validator` se report existe) → `qa-doc-keeper` |
| Refactor / cleanup | `qa-implementer` (refactor mode) → `qa-doc-keeper` |
| Atualizar docs / catálogo | `qa-doc-keeper` |
| Auditar selectors / dead code | `qa-debugger` com skill `selector-hardening` em modo audit → `qa-doc-keeper` |
| Ambíguo | `qa-planner` — vai delimitar |

## Regras-chave (extraídas de CLAUDE.md)

1. `qa-doc-keeper` SEMPRE roda por último (regra inviolável #4).
2. Spec obrigatória para qualquer test work não-trivial (regra #1).
3. `tsc --noEmit` clean antes de handoff (regra #3).
4. Real parallelization quando work é independente (regra #6).
5. Atomic scope — cada agent faz uma coisa (regra #5).

Detalhes completos: [`CLAUDE.md`](../CLAUDE.md).

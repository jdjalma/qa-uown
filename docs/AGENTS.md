# Agent Architecture

## Overview

Estrutura baseada em subagentes em `.claude/`:

```
.claude/
├── agents/            # 13 subagentes especializados
├── context/           # 9 arquivos de referência (o que é)
├── prompt/            # Journal de prompts históricos
└── settings.json
```

- **CLAUDE.md** → Orquestrador — analisa tasks, monta planos, invoca subagentes, valida resultados
- **agents/** → Subagentes especializados — cada um com papel, contexto e dependências declarados
- **context/** → Informação passiva (lida quando necessário)

---

## Context (referência)

| Arquivo | Quando consultar |
|---------|------------------|
| `INDEX.md` | Início de qualquer trabalho |
| `project.md` | Stack, portais, ambientes |
| `project.md` | Árvore de diretórios, convenções de localização |
| `coding-standards.md` | Regras globais obrigatórias |
| `project.md` | Page Objects, API Clients, hierarquias, ADRs |
| `test-patterns-core.md` / `test-patterns-ui.md` / `test-patterns-arrangements.md` | Padrões E2E/API, fixtures, hooks |
| `business-rules.md` | State machine, SSN, allocation |
| `environments.md` | URLs, DB config, timeouts, scripts |
| `glossary.md` | Mapeamento Java/Cucumber → TypeScript/Playwright |

---

## Orquestrador (CLAUDE.md)

O `CLAUDE.md` é o ponto de entrada para todas as tasks:

```
Usuário ──"criar teste E2E para fluxo de pagamento"──→ CLAUDE.md (orquestrador)
                                                            │
                                            ┌───────────────┤
                                            ▼               │
                                     Fase 1: Análise        │
                                     (classifica tipo)      │
                                            │               │
                                            ▼               │
                                     Fase 2: Plano          │
                                     (monta pipeline)       │
                                            │               │
                              ┌─────────────┼─────────┐    │
                              ▼             ▼         ▼    │
                         spec-test → artefatos → impl-e2e  │
                                    (paralelo)             │
                                            │               │
                                            ▼               │
                                     Fase 4: Validação      │
                                     (tsc --noEmit)         │
                                            │               │
                                            ▼               │
                                     Fase 5: Resumo ────────┘
```

### Tipos de pipeline

| Tipo | Quando | Pipeline |
|------|--------|----------|
| `new-flow` | Novo fluxo E2E completo | (pre-docs) → spec → artefatos (paralelo) → teste → validate → docs |
| `new-api` | Novo teste API | (pre-docs) → spec → client → teste → validate → docs |
| `new-page-object` | Page object isolado | (pre-docs) → impl-page-object → docs |
| `new-api-client` | API client isolado | (pre-docs) → impl-api-client → docs |
| `debug` | Teste flaky ou quebrado | debug-flaky → (audit) → (validate-results) → docs |
| `refactor` | Melhorar código existente | refactor-page-object → docs |
| `review` | Revisar código existente | (refactor-page-object se necessário) → docs |
| `data` | Dados de teste | (pre-docs) → data → docs |
| `audit` | Auditoria | audit → docs |
| `docs` | Documentação | docs-update |
| `qa-flow` | Fluxo QA completo (10 fases) | `/qa-flow` command |
| `custom` | Combinação manual | (pre-docs) → custom → docs |
| `gitlab` | URL de issue GitLab | fetch-task → classificar → pipeline |

---

## Subagentes (13)

Cada subagente vive em `.claude/agents/subagent-{nome}.md` com frontmatter:
- `name` — identificador
- `description` — escopo e limitações
- `model: inherit` — herda modelo do settings.json
- `color` — cor para identificação visual

### Catálogo

| Agent | Cor | Papel | Escreve código? |
|-------|-----|-------|-----------------|
| `subagent-fetch-task` | blue | Busca issue GitLab via API | Não |
| `subagent-spec-test` | green | Gera SPEC de teste (steps, dados, validações) | Não |
| `subagent-impl-e2e` | orange | Implementa teste E2E | Sim |
| `subagent-impl-api` | orange | Implementa teste API-only | Sim |
| `subagent-impl-api-client` | orange | Cria API client tipado | Sim |
| `subagent-page-object` (mode: `create`) | orange | Cria page object | Sim |
| `subagent-impl-db-validation` | orange | Cria queries DB + polling | Sim |
| `subagent-page-object` (mode: `refactor`) | red | Refatora page object existente | Sim |
| `subagent-debug-flaky` | red | Diagnostica e corrige teste flaky | Sim |
| `subagent-audit` | purple | Audita seletores + estrutura `.claude/` (dois modos — não corrige) | Não |
| `subagent-data` | yellow | Gerencia dados — merchants, templates, contas de teste (três modos) | Sim |
| `subagent-validate-results` | green | Valida resultados de teste contra requisitos da task (docs, Postman, app source) e formata para report | Não |
| `subagent-docs-update` | cyan | Atualiza documentação (SEMPRE último) | Sim (docs) |

### Por categoria

**Planning (NAO escrevem código):**
- `subagent-spec-test` — gera SPEC com steps, dados, validações, dependências
- `subagent-fetch-task` — busca issue GitLab, classifica pipeline

**Implementation (escrevem código):**
- `subagent-impl-e2e` — teste E2E em `tests/e2e/{portal}/`
- `subagent-impl-api` — teste API em `tests/api/`
- `subagent-impl-api-client` — client em `src/api/clients/` + types
- `subagent-page-object` (mode: `create`) — page object em `src/pages/{portal}/`
- `subagent-impl-db-validation` — queries + polling em helpers ou inline

**Maintenance:**
- `subagent-page-object` (mode: `refactor`) — refatora page object existente
- `subagent-debug-flaky` — diagnostica e corrige teste flaky

**Validation (NAO escreve código — análise):**
- `subagent-validate-results` — executa teste, valida resultados contra requisitos da task, consulta Postman/app source, formata cenários para report

**Audit (NAO corrigem — apenas reportam):**
- `subagent-audit` — dois modos: `selectors` (robustez, hardcoded, dead) e `structure` (meta-análise da estrutura `.claude/`)

**Data:**
- `subagent-data` — três modos: `merchant` (catálogo), `template` (JSON templates), `accounts` (contas de teste)

**Documentation (SEMPRE último):**
- `subagent-docs-update` — atualiza docs após implementação

---

## Grafo de Dependências

```
fetch-task (condicional — se URL GitLab)
     │
     ▼
spec-test ─────────────────────────────────────┐
     │                                          │
     ▼                                          │
┌────────────────── PARALELO ──────────────┐    │
│ impl-page-object   impl-api-client       │    │
│ data (template)    impl-db-validation    │    │
└──────────┬───────────────┬───────────────┘    │
           │               │                    │
           ▼               ▼                    │
┌────────────────── PARALELO ──────────────┐    │
│ impl-e2e              impl-api           │    │
└──────────┬───────────────┬───────────────┘    │
           │               │                    │
           ▼               ▼                    │
      tsc --noEmit (validação)                  │
           │                                    │
           ▼                                    │
      validate-results ────────────────────────┤
      (valida resultados contra requisitos)    │
           │                                    │
           ▼                                    │
      docs-update (SEMPRE ÚLTIMO) ◄─────────────┘

Maintenance (independentes):
  debug-flaky → (audit selectors mode) → tsc → docs-update
  refactor-page-object → tsc → docs-update
  audit (selectors | structure) → docs-update

Data (independentes):
  data (merchant | template | accounts) → docs-update
```

---

## Paralelização

| Padrão | Agents em paralelo |
|--------|-------------------|
| Novo fluxo completo | `impl-page-object` + `impl-api-client` (após SPEC) |
| Implementação E2E + API | `impl-e2e` + `impl-api` |
| Artefatos + DB | `impl-db-validation` + `impl-e2e` |
| Research | Múltiplos Explore agents nativos do Claude Code |

---

## Workflows

### Novo fluxo (pipeline completo)

```
1. spec-test → SPEC
2. impl-page-object + impl-api-client (paralelo) → artefatos
3. impl-e2e → teste E2E (consome artefatos)
4. tsc --noEmit → validação
5. validate-results → validar resultados contra requisitos
6. docs-update → atualizar docs
```

### Debug

```
1. debug-flaky → diagnóstico + fix
2. audit (selectors mode) → se problema é seletor
3. tsc --noEmit → validação
4. docs-update → atualizar docs
```

### Nova API

```
1. spec-test → SPEC
2. impl-api-client + data (template mode) (paralelo) → client + template
3. impl-api → teste API
4. tsc --noEmit → validação
5. validate-results → validar resultados contra requisitos
6. docs-update → atualizar docs
```

### Auditoria

```
1. audit (selectors | structure) → relatório
2. (opcional) refactor-page-object → correções
3. tsc --noEmit → validação
```

---

## Comunicação entre agents

In-memory via prompt relay — sem arquivos intermediários:

```
CLAUDE.md ──prompt──→ Agent A ──result──→ CLAUDE.md ──prompt+result──→ Agent B
```

### Protocolo de comunicação

**Ao iniciar pipeline:**
```
Pipeline: [tipo] | Task: [resumo] | Plano: FASE 1 → FASE 2 → ...
```

**Após cada fase:**
```
FASE N concluída: [agent(s)] | Arquivos: [criados/alterados] | Próximo: FASE N+1
```

**Ao finalizar:**
```
Pipeline [tipo] concluído | Agents: N | Arquivos: N criados, N alterados | tsc: OK/FAIL
```

### Checkpoint entre fases

| Check | Se falhar |
|-------|-----------|
| Agent produziu artefatos esperados? | Re-executar ou ajustar |
| Output conflita com fases anteriores? | Reconciliar |
| `tsc --noEmit` passa? | Corrigir erros |
| Próximo agent tem contexto suficiente? | Complementar |
| Novos seletores centralizados? | Mover para SELECTORS |

Consistência via convenções compartilhadas em `context/coding-standards.md`.

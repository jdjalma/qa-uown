# Agent Architecture

## Overview

Estrutura baseada em subagentes em `.claude/`:

```
.claude/
├── agents/            # 16 subagentes especializados
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
| `project-overview.md` | Stack, portais, ambientes |
| `project-structure.md` | Árvore de diretórios, convenções de localização |
| `coding-standards.md` | Regras globais obrigatórias |
| `architecture.md` | Page Objects, API Clients, hierarquias, ADRs |
| `test-patterns.md` | Padrões E2E/API, fixtures, hooks |
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
| `new-flow` | Novo fluxo E2E | spec → artefatos (paralelo) → teste → docs |
| `new-api` | Novo teste API | spec → client (paralelo) → teste → docs |
| `new-page-object` | Page object isolado | impl-page-object |
| `new-api-client` | API client isolado | impl-api-client |
| `debug` | Teste flaky | debug-flaky → (audit-selectors) |
| `refactor` | Melhorar código | refactor-page-object |
| `data` | Dados de teste | data-merchant / data-template / data-test-accounts |
| `audit` | Auditoria | audit-selectors / audit-estrutura |
| `docs` | Documentação | docs-update |
| `custom` | Combinação | pipeline sob medida |
| `gitlab` | URL de issue GitLab | fetch-task → classificar → pipeline |

---

## Subagentes (16)

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
| `subagent-impl-page-object` | orange | Cria page object | Sim |
| `subagent-impl-db-validation` | orange | Cria queries DB + polling | Sim |
| `subagent-refactor-page-object` | red | Refatora page object existente | Sim |
| `subagent-debug-flaky` | red | Diagnostica e corrige teste flaky | Sim |
| `subagent-audit-selectors` | purple | Audita seletores (não corrige) | Não |
| `subagent-audit-estrutura` | purple | Meta-análise da estrutura .claude/ | Não |
| `subagent-data-merchant` | yellow | Adiciona merchant ao catálogo | Sim |
| `subagent-data-template` | yellow | Cria JSON template | Sim |
| `subagent-data-test-accounts` | yellow | Gerencia contas de teste | Sim |
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
- `subagent-impl-page-object` — page object em `src/pages/{portal}/`
- `subagent-impl-db-validation` — queries + polling em helpers ou inline

**Maintenance:**
- `subagent-refactor-page-object` — refatora page object existente
- `subagent-debug-flaky` — diagnostica e corrige teste flaky

**Validation (NAO escreve código — análise):**
- `subagent-validate-results` — executa teste, valida resultados contra requisitos da task, consulta Postman/app source, formata cenários para report

**Audit (NAO corrigem — apenas reportam):**
- `subagent-audit-selectors` — audita seletores (robustez, hardcoded, dead)
- `subagent-audit-estrutura` — meta-análise da estrutura `.claude/`

**Data:**
- `subagent-data-merchant` — adiciona merchant ao catálogo
- `subagent-data-template` — cria JSON template para request body
- `subagent-data-test-accounts` — gerencia contas de teste

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
│ data-template      impl-db-validation    │    │
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
  debug-flaky → (audit-selectors) → tsc → docs-update
  refactor-page-object → tsc → docs-update
  audit-selectors / audit-estrutura → docs-update

Data (independentes):
  data-merchant, data-template, data-test-accounts → docs-update
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
2. audit-selectors → se problema é seletor
3. tsc --noEmit → validação
4. docs-update → atualizar docs
```

### Nova API

```
1. spec-test → SPEC
2. impl-api-client + data-template (paralelo) → client + template
3. impl-api → teste API
4. tsc --noEmit → validação
5. validate-results → validar resultados contra requisitos
6. docs-update → atualizar docs
```

### Auditoria

```
1. audit-selectors ou audit-estrutura → relatório
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

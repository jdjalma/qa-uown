# QA Flow — Fluxo Completo de Teste de Feature

Executa o fluxo completo de QA: análise → cenários → implementação → execução → relatórios.

## Argumentos recebidos:
$ARGUMENTS

---

## REGRA ABSOLUTA: TODO List obrigatória

> **CRÍTICO:** Antes de iniciar qualquer trabalho, crie a TODO list completa com `TaskCreate` para rastrear o progresso de cada fase. Atualize com `TaskUpdate` (in_progress/completed) conforme avança. **Nunca pule esta etapa.**

---

## Fases do QA Flow

### Fase 0 — Setup e Planejamento

1. **Extrair informações do argumento** fornecido pelo usuário:
   - URL da task no GitLab (se fornecida)
   - Descrição/contexto da feature
   - Informações adicionais

2. **Sync repos** (OBRIGATÓRIO):
```bash
for repo in svc origination servicing website ams ams-website payment-gateway uwengine ccverification common los-common svc-common configuration; do
  git -C "../$repo" pull --ff-only 2>&1 || echo "WARN: $repo sync failed (using stale)"
done
```

3. **Criar TODO list** com `TaskCreate` para TODAS as fases:

```
□ Fase 1 — Análise de contexto (backend + frontend + regras de negócio)
□ Fase 2 — Criar cenários de teste (User Stories + CT-XX)
□ Fase 3 — Gerar SPEC via subagent-spec-test
□ Fase 4 — Verificar cobertura existente dos cenários
□ Fase 5 — Implementar testes faltantes (agents paralelos)
□ Fase 6 — Refatorar código de testes (DRY + padrões)
□ Fase 7 — Executar testes e corrigir falhas
□ Fase 8 — Confirmar relatório de execução (gerado pelo validate-results na Fase 7)
□ Fase 9 — Atualizar documentação dos agents
```

4. **Se URL GitLab foi fornecida**, invocar `subagent-fetch-task`:
   ```
   Agent(subagent_type="subagent-fetch-task", prompt="<GitLab URL>")
   ```

---

### Fase 1 — Análise de Contexto

> **Objetivo:** Entender a feature completa analisando backend, frontend, regras de negócio e contextos do projeto.

**Marcar task como `in_progress`.**

#### 1.1 Carregar contextos do projeto (OBRIGATÓRIO)

Ler os arquivos de contexto relevantes ANTES de qualquer análise:

| Contexto | Arquivo | Quando usar |
|----------|---------|-------------|
| **Regras de negócio** | `docs/business-rules/` (19 arquivos) | SEMPRE — fonte de verdade |
| **Sumário regras** | `.claude/context/business-rules.md` | SEMPRE — visão resumida |
| **Checklist E2E** | `.claude/context/shared/e2e-checklist.md` | SEMPRE — padrões de teste |
| **Padrão de relatório** | `.claude/context/shared/e2e-test-report-standard.md` | SEMPRE — para Fases 8 e 9 |
| **Arquitetura** | `.claude/context/architecture.md` | Se cria page objects/clients |
| **Test patterns** | `.claude/context/test-patterns.md` | Se cria testes |
| **App repos** | `.claude/context/app-repos.md` | Se analisa código fonte |
| **Environments** | `.claude/context/environments.md` | Se configura ambientes |

#### 1.2 Analisar regras de negócio

- Ler `docs/business-rules/` — identificar a seção relevante
- Extrair: entidades, transições de estado, permissões, validações
- State machine: `UW_APPROVED → CC_AUTH_PASSED → CONTRACT_CREATED → SIGNED → SETTLED → FUNDING → FUNDED`

#### 1.3 Analisar backend — repos da aplicação

Usar `.claude/context/app-repos.md` para localizar:
- Controllers/Services nos repos relevantes (svc, origination, servicing, etc.)
- DTOs/Models: payloads de request/response
- Validators: regras de validação
- Migrations: mudanças de schema (Flyway)
- **Focar em:** endpoints, status codes, mensagens de erro, transições

#### 1.4 Analisar frontend (quando aplicável)

- Website/Origination/Servicing frontend components
- Fluxo do usuário, formulários, ações, feedback visual

#### 1.5 Gerar resumo da análise

- Endpoints envolvidos (método + rota + status codes)
- Transições de estado permitidas
- Permissões por role
- Validações (campos obrigatórios, formatos, limites)

**Marcar task como `completed`.**

---

### Fase 2 — Criar Cenários de Teste

> **Objetivo:** Documentar User Stories e cenários concretos de teste.

**Marcar task como `in_progress`.**

**Formato User Story:**

```markdown
## US-[PREFIX]-[NN]: [Título descritivo]

**Como** [role],
**Quero** [ação],
**Para** [benefício].

### Critérios de Aceite
- [ ] Critério 1
- [ ] Critério 2
```

**Formato Cenário (CT-XX):**

```markdown
### CT-[ID]: [Título do cenário]

**Tipo:** API / E2E / Hybrid / DB
**Portal:** Origination / Servicing / Website / AMS
**Pré-condição:** [Estado inicial]

**Passos:**
1. [Ação 1]
2. [Ação 2]
3. [Verificação]

**Resultado esperado:**
- API retorna [status code] com [payload]
- DB reflete [mudança de estado]

**Tags:** @regression @critical
```

**Categorias obrigatórias** (consultar `.claude/context/shared/e2e-checklist.md`):
- Caminho feliz (happy path)
- Validações e erros
- Permissões (403/401)
- Transições de estado
- Edge cases
- Cross-domain (efeitos colaterais)

**Salvar em:** `docs/taskTestingUown/{testName}/{testName}-scenarios.md`

**Apresentar ao usuário para revisão antes de prosseguir.**

**Marcar task como `completed`.**

---

### Fases 3 e 4 — PARALELO: SPEC + Cobertura Existente

> **Objetivo:** Gerar SPEC formal e verificar cobertura existente **ao mesmo tempo** — são independentes.

**Marcar ambas como `in_progress`.**

**Lançar em um único bloco paralelo:**

```
# PARALELO — uma única mensagem com dois agents:
Agent(subagent-spec-test, "cenários da Fase 2 + regras de negócio")
Agent(Explore, "buscar testes existentes para a feature")
```

#### Fase 3 — Gerar SPEC via subagent-spec-test

Invocar `subagent-spec-test` com:
- Cenários da Fase 2
- Regras de negócio relevantes
- Contextos carregados na Fase 1

O SPEC gerado serve como input para a Fase 5 (implementação).

#### Fase 4 — Verificar Cobertura Existente

Buscar testes existentes relacionados à feature:
```
Glob: tests/e2e/**/*<feature>*.spec.ts
Glob: docs/taskTestingUown/**/*<feature>*.spec.ts
Glob: tests/api/**/*<feature>*.spec.ts
Grep: "descrição do cenário" em tests/
```

Mapear cobertura:

| CT | Cenário | Coberto? | Arquivo | Notas |
|----|---------|:--------:|---------|-------|
| CT-01 | Descrição | Y/N | `path/to/spec.ts:L42` | — |

Identificar gaps — cenários sem cobertura → implementar na Fase 5

**Marcar ambas como `completed`.**

---

### Fase 5 — Implementar Testes Faltantes

> **Objetivo:** Implementar testes para cenários não cobertos usando agents paralelos.

**Marcar task como `in_progress`.**

#### 5.1 Adquirir locks antes de editar (OBRIGATÓRIO)

Seguir protocolo em `.claude/context/shared/agent-coordination.md`:
```bash
# Verificar → criar lock → editar → remover lock
```

#### 5.2 Classificar e delegar para agents

| Necessidade | Agent | Paralelo? |
|-------------|-------|:---------:|
| Novo page object | `subagent-impl-page-object` | Sim |
| Novo API client | `subagent-impl-api-client` | Sim |
| JSON template | `subagent-data (template mode)` | Sim |
| DB validation | `subagent-impl-db-validation` | Sim |
| Teste E2E | `subagent-impl-e2e` | Após dependências |
| Teste API | `subagent-impl-api` | Após dependências |

**Execução paralela — OBRIGATÓRIO usar um único bloco de mensagem por grupo:**

```
# ROUND 1: Artefatos independentes — TODOS em uma única mensagem:
Agent(subagent-impl-page-object, "...")
Agent(subagent-impl-api-client, "...")
Agent(subagent-data (template mode), "...")
Agent(subagent-impl-db-validation, "...")

# Aguardar ROUND 1 completar antes de ROUND 2

# ROUND 2: Testes (dependem dos artefatos do ROUND 1) — em uma única mensagem:
Agent(subagent-impl-e2e, "... SPEC: [...] Artefatos disponíveis: [...]")
Agent(subagent-impl-api, "... SPEC: [...] Artefatos disponíveis: [...]")
```

> **CRÍTICO:** Enviar múltiplos `Agent(...)` em UMA mensagem = paralelo real.
> Enviar um por mensagem = sequencial. Use sempre a forma paralela.

#### 5.3 Padrões obrigatórios

- Consultar `.claude/context/shared/e2e-agent-responsibilities.md` para helpers disponíveis
- Consultar `.claude/context/shared/e2e-test-examples.md` para exemplos de código
- Worker-scoped IDs via `worker-id.helper.ts` para dados únicos
- `test.step()`, `ctx`, `testData`, `SELECTORS`, tags via `TestTag`

#### 5.4 Naming convention (task tests)

```
Pattern:   {milestone}_{camelCaseTitle}_{taskNumber}
Location:  docs/taskTestingUown/{testName}/{testName}.spec.ts
Project:   task-testing
```

**Marcar task como `completed`.**

---

### Fase 6 — Refatorar Código de Testes (DRY + Padrões)

> **Objetivo:** Revisar e refatorar código seguindo DRY e padrões do projeto.

**Marcar task como `in_progress`.**

**Checklist de refatoração:**

1. **Duplicação** — código repetido entre testes:
   - Login repetido? → Usar `storageState` ou auth helpers
   - Fixture repetida? → Extrair para `beforeEach` ou helper
   - Seletores repetidos? → Centralizar em `SELECTORS`

2. **Helpers** — ação repetida 3+ vezes? → Extrair para `src/helpers/`

3. **Padrões do projeto** — conformidade com:
   - Page objects em `src/pages/{portal}/`
   - API clients em `src/api/clients/`
   - Imports via path aliases (`@helpers/`, `@pages/`, etc.)
   - Barrel exports (`index.ts`)

4. **Organização** — `describe` agrupados, happy path antes de error paths

**Marcar task como `completed`.**

---

### Fase 7 — Executar Testes e Corrigir Falhas

> **Objetivo:** Executar todos os testes até 100% de sucesso.

**Marcar task como `in_progress`.**

**Ciclo de execução:**

```
Executar → Analisar falhas → Corrigir → Re-executar
     ↑                                      │
     └──────── até 100% verde ─────────────┘
```

**Comando de execução:**
```bash
# Task tests
npx playwright test docs/taskTestingUown/<testName>/ --project=task-testing --reporter=list

# Portal E2E tests
npx playwright test tests/e2e/<portal>/<feature>.spec.ts --project=<portal>-ui --reporter=list

# API tests
npx playwright test tests/api/<feature>-api.spec.ts --project=api-only --reporter=list
```

**Para cada falha:**
1. Ler output (erro + stack trace)
2. Classificar:
   - **Bug do teste** → corrigir o teste
   - **Bug da aplicação** → documentar na Fase 8 (NÃO corrigir)
   - **Infra/Timing** → ajustar timeout ou retry
3. Re-executar apenas os testes que falharam

**Invocar `subagent-validate-results`** para validar contra requisitos da task e gerar `.md`:
```
Agent(subagent_type="subagent-validate-results", prompt="...")
```

**Marcar task como `completed` quando todos os testes passarem.**

---

### Fase 8 — Confirmar Relatório de Execução

> **Objetivo:** O relatório completo já foi gerado pelo `subagent-validate-results` na Fase 7. Esta fase confirma o artefato e o apresenta ao usuário.

**Marcar como `in_progress`.**

O `subagent-validate-results` (Fase 7) já escreveu `docs/taskTestingUown/{testName}/{testName}-report.md` com:
- Metadados da task e execução
- Evidências (leadPk, accountPk, arrangementPk, etc.)
- Todos os cenários (PASSOU/FALHOU) com `O que é feito / O que acontece / O que é verificado`
- Screenshots referenciados
- `## Bugs de Aplicação Encontrados` (se houver)
- `## Resumo da Validação`

**Verificar o relatório gerado:**
```bash
cat docs/taskTestingUown/{testName}/{testName}-report.md
```

Se o relatório estiver incompleto ou com valores PENDING → reinvocar `subagent-validate-results`.

> **Não há arquivo separado de bugs** — bugs ficam na seção `## Bugs de Aplicação Encontrados` do relatório principal.
> **Formato obrigatório:** `.claude/context/shared/e2e-test-report-standard.md`

**Marcar como `completed`.**

---

### Fase 9 — Atualizar Documentação dos Agents

> **Objetivo:** Garantir que a documentação reflita o estado real do projeto após o qa-flow.

**Marcar task como `in_progress`.**

#### 10.1 Detectar mudanças

```bash
git diff --name-only HEAD -- src/ tests/
git status --short -- src/ tests/
```

| Tipo de mudança | Ação |
|----------------|------|
| Novo helper em `src/helpers/` | Adicionar à tabela em `shared/e2e-agent-responsibilities.md` |
| Helper deletado | Remover da tabela |
| Novo spec em `tests/` | Atualizar estrutura de arquivos |
| Novo page object em `src/pages/` | Atualizar hierarquia em `shared/e2e-agent-responsibilities.md` |
| Novo padrão descoberto | Adicionar à seção de patterns |

#### 10.2 Se não houver mudanças

Marcar como `completed` e encerrar — documentação não precisa de atualização.

#### 10.3 Invocar subagent-docs-update

```
Agent(subagent_type="subagent-docs-update", prompt="Post-pipeline update: [lista de mudanças]")
```

#### 10.4 Verificar consistência

```bash
# Verificar se helpers referenciados nos docs existem
grep -h "helper.ts" .claude/context/shared/e2e-agent-responsibilities.md | \
  grep -oP "[\w-]+\.helper\.ts" | sort -u
```

**Marcar task como `completed`.**

---

## Resumo Final

Ao concluir TODAS as fases, apresentar ao usuário:

```markdown
## QA Flow — Resumo Final

### Feature: [Nome]
### Task: #NNN

| Fase | Status | Artefato |
|------|:------:|----------|
| 1. Análise | Y/N | (contexto interno) |
| 2. Cenários | Y/N | `docs/taskTestingUown/[ID]-test-scenarios.md` |
| 3. SPEC | Y/N | (output do spec-test) |
| 4. Cobertura | Y/N | (mapeamento interno) |
| 5. Implementação | Y/N | `tests/{type}/{feature}.spec.ts` |
| 6. Refatoração | Y/N | (DRY + padrões aplicados) |
| 7. Execução | Y/N | N/N testes passando |
| 8. Relatório | Y/N | `docs/taskTestingUown/{testName}/{testName}-report.md` |
| 9. Docs | Y/N | `.claude/context/shared/e2e-agent-responsibilities.md` |

### Métricas
- **Cenários planejados:** NN
- **Testes implementados:** NN
- **Taxa de sucesso:** 100%
- **Bugs de aplicação encontrados:** N
```

---

## Notas

- **Task tracker:** GitLab (usar `subagent-fetch-task` para issues)
- **Regras de negócio:** `docs/business-rules/` (19 arquivos, fonte de verdade)
- **Repos da aplicação:** 14 repos — ver `.claude/context/app-repos.md`
- **Lock protocol:** `.claude/context/shared/agent-coordination.md`
- **Worker IDs:** `src/helpers/worker-id.helper.ts` — sempre usar para dados únicos em paralelo
- **Apresentar cenários ao usuário** antes de implementar (Fase 2 é checkpoint)

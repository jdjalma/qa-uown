# Melhorias na Arquitetura de Agents — fintech-playwright

> Documento de referência para replicar a arquitetura de agents em outros projetos.
> Descreve as melhorias aplicadas ao longo de março/2026, com justificativas e exemplos.

---

## Índice

- [Melhorias na Arquitetura de Agents — fintech-playwright](#melhorias-na-arquitetura-de-agents--fintech-playwright)
  - [Índice](#índice)
  - [1. Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
  - [2. Modelo de Orquestração](#2-modelo-de-orquestração)
  - [3. Frontmatter dos Agents](#3-frontmatter-dos-agents)
  - [4. Catálogo de Agents e Atribuição de Modelos](#4-catálogo-de-agents-e-atribuição-de-modelos)
  - [5. Pipeline Types e Dependency Graph](#5-pipeline-types-e-dependency-graph)
    - [Pipeline Types](#pipeline-types)
    - [Dependency Graph](#dependency-graph)
  - [6. Context Loading Strategy](#6-context-loading-strategy)
  - [7. docs-update: Dois Modos (Pré-análise + Pós-pipeline)](#7-docs-update-dois-modos-pré-análise--pós-pipeline)
    - [Modo PRE-ANALYSIS (antes da implementação)](#modo-pre-analysis-antes-da-implementação)
    - [Modo POST-PIPELINE (após implementação)](#modo-post-pipeline-após-implementação)
  - [8. Bug Triage Protocol (4 Passos)](#8-bug-triage-protocol-4-passos)
    - [Passo 1 — Verificar se é realmente um erro](#passo-1--verificar-se-é-realmente-um-erro)
    - [Passo 2 — Verificar se está no escopo](#passo-2--verificar-se-está-no-escopo)
    - [Passo 3 — Regression check](#passo-3--regression-check)
    - [Passo 4 — Classificar](#passo-4--classificar)
  - [9. Scope Discipline](#9-scope-discipline)
  - [10. User Story Mapping e Risk Tiers](#10-user-story-mapping-e-risk-tiers)
    - [User Story Mapping](#user-story-mapping)
    - [Risk Tier System](#risk-tier-system)
  - [11. Triple Validation](#11-triple-validation)
  - [12. Formato de Relatório Padronizado](#12-formato-de-relatório-padronizado)
    - [Blocos obrigatórios (em ordem)](#blocos-obrigatórios-em-ordem)
    - [Formato de Cenário (3 blocos obrigatórios)](#formato-de-cenário-3-blocos-obrigatórios)
  - [13. Common Operations Cookbook](#13-common-operations-cookbook)
  - [14. Shared Context Files](#14-shared-context-files)
  - [15. Regras Path-Scoped (Auto-loading)](#15-regras-path-scoped-auto-loading)
  - [16. Lifecycle Hooks e Coordenação](#16-lifecycle-hooks-e-coordenação)
  - [17. Permissões e Segurança](#17-permissões-e-segurança)
  - [18. Agents Consolidados (Multi-mode)](#18-agents-consolidados-multi-mode)
    - [subagent-audit (2 modos)](#subagent-audit-2-modos)
    - [subagent-data (3 modos)](#subagent-data-3-modos)
  - [19. Regras Invioláveis](#19-regras-invioláveis)
  - [20. QA Flow — Pipeline de 10 Fases](#20-qa-flow--pipeline-de-10-fases)
  - [21. Checklist para Aplicar em Outro Projeto](#21-checklist-para-aplicar-em-outro-projeto)
    - [Estrutura de diretórios](#estrutura-de-diretórios)
    - [Passos para replicar](#passos-para-replicar)
    - [Princípios a manter](#princípios-a-manter)

---

## 1. Visão Geral da Arquitetura

A arquitetura segue um modelo hierárquico:

```
CLAUDE.md (Orquestrador)
    │
    ├── .claude/agents/          (13 subagents especializados)
    ├── .claude/context/         (contexto passivo — carregado sob demanda)
    │   ├── orchestration.md     (protocolo de orquestração)
    │   ├── shared/              (7 arquivos compartilhados entre agents)
    │   └── *.md                 (contexto do projeto: arquitetura, glossário, etc.)
    ├── .claude/rules/           (regras auto-carregadas por path)
    ├── .claude/commands/        (slash commands — /qa-flow, /new-api-client, etc.)
    ├── .claude/scripts/         (hooks de lifecycle)
    └── .claude/settings.json    (permissões, hooks, MCP servers)
```

**Princípios fundamentais:**

- **CLAUDE.md é o orquestrador**, não um executor — analisa a tarefa, monta o plano, invoca agents na ordem, valida resultado
- **Cada agent faz UMA coisa** (atomic scope)
- **Context files são passivos** — nunca carregados automaticamente; cada agent declara o que precisa
- **Rules são path-scoped** — auto-carregam quando Claude edita arquivos no path declarado
- **Paralelização real** — agents independentes rodam em paralelo via Agent tool com múltiplas chamadas

---

## 2. Modelo de Orquestração

O protocolo de orquestração (`.claude/context/orchestration.md`) define 7 fases:

| Fase | Nome | Descrição |
|------|------|-----------|
| 0 | Sync & Source | Sincroniza repos da aplicação + detecta origem da tarefa |
| 1 | Pré-análise | `docs-update` em modo PRE-ANALYSIS — atualiza context ANTES dos agents de impl |
| 2 | Classificação | Identifica o pipeline type (new-flow, debug, refactor, etc.) |
| 3 | Plano de Execução | Define dependências, paralelismo, propagação de resultados |
| 4 | Execução | Invoca agents com contexto mínimo + output dos passos anteriores |
| 5 | Validação | `tsc --noEmit` + `validate-results` (executa teste, gera relatório) |
| 6 | Sumário | Reporta resultado ao usuário |

**Checkpoints entre fases:**

Após cada agent, verifica: artefatos produzidos? conflitos com fases anteriores? `tsc` passa? próximo agent tem contexto suficiente?

---

## 3. Frontmatter dos Agents

Cada agent declara metadados no frontmatter YAML:

```yaml
---
name: subagent-spec-test
description: Generates a test SPEC (steps, data, validations). Does NOT write code.
model: opus           # opus (planning/impl) ou sonnet (lightweight)
color: green            # cor no terminal para identificação visual
maxTurns: 20            # limite de iterações
effort: high            # nível de esforço (high/low)
memory: project         # tipo de memória persistente
tools:                  # tools permitidas (whitelist)
  - Read
  - Glob
  - Grep
  - Task
disallowedTools:        # tools explicitamente proibidas
  - NotebookEdit
permissionMode: plan    # (audit agent) — só pode planejar/reportar
---
```

**Melhorias aplicadas:**

- `permissionMode: plan` no audit agent — garante que nunca modifique código
- `disallowedTools: [Bash]` no docs-update — impede execução de comandos shell
- `disallowedTools: [NotebookEdit]` em todos os agents que escrevem código
- `memory: project` — permite que agents persistam aprendizados entre sessões
- `effort: low` para agents sonnet (fetch, audit, data, docs) — otimiza custo
- `effort: high` para agents opus (spec, impl, validate, debug) — máxima qualidade

---

## 4. Catálogo de Agents e Atribuição de Modelos

| Agent | Modelo | Escreve Código? | Responsabilidade |
|-------|--------|:---------------:|-----------------|
| `fetch-task` | **sonnet** | Não | Busca issue do GitLab via API, classifica pipeline, gera test name |
| `spec-test` | **opus** | Não | Gera SPEC completa (steps, dados, validações, dependências de artefatos) |
| `impl-e2e` | **opus** | Sim | Implementa teste E2E com browser |
| `impl-api` | **opus** | Sim | Implementa teste API-only (sem browser) |
| `impl-api-client` | **opus** | Sim | Cria API client tipado extendendo BaseClient |
| `impl-page-object` | **opus** | Sim | Cria page object seguindo hierarquia do portal |
| `impl-db-validation` | **opus** | Sim | Cria queries PostgreSQL + polling com backoff |
| `refactor-page-object` | **opus** | Sim | Refatora page object existente (8 categorias de prioridade) |
| `debug-flaky` | **opus** | Sim | Diagnostica e corrige teste flaky (8 categorias de classificação) |
| `audit` | **sonnet** | Não (reporta) | Dois modos: selectors (robustez) e structure (consistência .claude/) |
| `data` | **sonnet** | Sim (dados) | Três modos: merchant (catálogo), template (JSON), accounts (salvar/carregar) |
| `validate-results` | **opus** | Não (relatório) | Executa teste, aplica bug triage, gera relatório .md |
| `docs-update` | **sonnet** | Sim (docs) | Dois modos: PRE-ANALYSIS + POST-PIPELINE |

**Critério de atribuição de modelo:**

- **sonnet** → tarefas leves (fetch, audit, data, docs) — menor custo, suficiente para o escopo
- **opus** → planejamento e implementação — requer raciocínio mais complexo

---

## 5. Pipeline Types e Dependency Graph

### Pipeline Types

| Tipo | Quando | Sequência |
|------|--------|-----------|
| `new-flow` | Novo fluxo E2E completo | (pré-docs) → spec → artefatos → test → validate → docs |
| `new-api` | Novo teste API | (pré-docs) → spec → client → test → validate → docs |
| `new-page-object` | Page object standalone | (pré-docs) → impl-page-object → docs |
| `new-api-client` | API client standalone | (pré-docs) → impl-api-client → docs |
| `debug` | Teste flaky ou quebrado | debug-flaky → (audit) → (validate se taskTesting) → docs |
| `refactor` | Melhorar código existente | refactor-page-object → docs |
| `data` | Dados de teste | (pré-docs) → data → docs |
| `audit` | Auditoria | audit → docs |
| `qa-flow` | QA completo (10 fases) | `/qa-flow` command |

### Dependency Graph

```
Phase 0:  sync-repos (14 repos, git pull --ff-only)
          └─ fetch-task (se URL GitLab fornecida)

Phase 1:  docs-update [PRE-ANALYSIS] — condicional, atualiza context antes de impl

Phase 2:  spec-test (SEMPRE antes de impl — nunca em paralelo)

Phase 3:  ROUND 1 — PARALELO (artefatos independentes):
            impl-page-object   impl-api-client
            data (template)    impl-db-validation

Phase 4:  ROUND 2 — PARALELO (dependem do round 1):
            impl-e2e           impl-api

Phase 5:  tsc --noEmit  →  validate-results

Phase 6:  docs-update [POST-PIPELINE] (SEMPRE último)
```

**Melhoria chave:** Paralelização em dois rounds — Round 1 cria artefatos que o Round 2 consome. Agents do Round 1 rodam todos ao mesmo tempo via múltiplas chamadas ao Agent tool.

---

## 6. Context Loading Strategy

**Regra:** NUNCA carregar TODOS os context files. Cada agent declara exatamente o que precisa.

| Agent | Context Obrigatório | Context Opcional |
|-------|--------------------|--------------------|
| spec-test | business-rules, test-patterns, architecture, **jornada-completa-lease.md** | environments, glossary, app-repos |
| impl-e2e | coding-standards, test-patterns, architecture, **business-rules** + capítulo relevante | environments, **common-operations.md** (obrigatório para pagamentos) |
| impl-api | coding-standards, architecture, **business-rules** + capítulo relevante | environments, **common-operations.md** (obrigatório para pagamentos) |
| validate-results | test file, environment, task requirements, **business-rules** + capítulo | architecture, Postman collection, app-repos |
| docs-update (pré) | INDEX, business-rules, task description | environments, glossary, architecture |
| docs-update (pós) | INDEX, business-rules, architecture, test-patterns | environments, glossary |
| debug-flaky | coding-standards, test-patterns, environments, **business-rules** + capítulo | architecture |
| audit (selectors) | coding-standards, architecture | test-patterns |

**Padrão Domain → Chapter Guide:** Agents leem `context/business-rules.md` primeiro (índice), identificam qual domínio se aplica (origination/payments/servicing/etc.) e leem apenas o capítulo relevante de `docs/business-rules/` — nunca todos os 19 arquivos.

**Por que isso importa:** Carregar context desnecessário desperdiça tokens e pode confundir o agent. Context mínimo = decisões mais precisas.

---

## 7. docs-update: Dois Modos (Pré-análise + Pós-pipeline)

### Modo PRE-ANALYSIS (antes da implementação)

**Quando:** Task vem de fonte explícita (GitLab issue, user story, requisito detalhado).

**O que faz:**
- Verifica se a tarefa introduz novos conceitos não documentados
- Atualiza business rules, glossário, environments, merchant catalog
- Corrige docs existentes que contradizem a descrição da tarefa

**Por que roda primeiro:** Agents como `spec-test` e `impl-e2e` carregam context files para tomar decisões. Se os docs estão desatualizados, esses agents produzem output incorreto.

### Modo POST-PIPELINE (após implementação)

**Quando:** SEMPRE — último step obrigatório de todo pipeline.

**Mapeamento Change → Document:**

| Mudança | Documento a atualizar |
|---------|----------------------|
| Novo fluxo de negócio | `docs/business-rules/{chapter}.md` |
| Novo teste E2E ou API | `docs/TESTING.md` |
| Novo page object | `CLAUDE.md` hierarquia + `context/architecture.md` |
| Novo API client | `context/architecture.md` |
| Novo helper | `context/architecture.md` + `shared/e2e-agent-responsibilities.md` |
| Decisão técnica | `docs/adrs/ADR-NNN-{title}.md` |
| Mudança em agent | `docs/AGENTS.md` + `context/INDEX.md` |

**Melhoria:** Antes, docs-update rodava apenas no final. Com o modo duplo, o contexto fica atualizado ANTES dos agents de implementação consumirem, eliminando erros em cascata.

---

## 8. Bug Triage Protocol (4 Passos)

**Origem:** Incidente #476 — `getApplicationStatus.paymentDetailsList` não estava no escopo da tarefa, mas foi reportado como BUG-02, causando investigação desnecessária.

Antes de reportar QUALQUER comportamento inesperado como bug, o agent `validate-results` deve executar:

### Passo 1 — Verificar se é realmente um erro

Consultar pelo menos 2 fontes:

| Fonte | O que verificar |
|-------|----------------|
| Código-fonte da aplicação | É o comportamento intencional? Há comentário/condição? |
| Contrato da API (Postman) | O contrato define essa forma de resposta? Array vazia é documentada? |
| Estado do BD | O BD reflete o esperado, ou o dado simplesmente não existe upstream? |
| `docs/business-rules/` | O comportamento está documentado como esperado? |

### Passo 2 — Verificar se está no escopo

Ler a descrição da tarefa e critérios de aceite. Se o endpoint/campo/comportamento NÃO é mencionado explicitamente → FORA DO ESCOPO.

### Passo 3 — Regression check

Confirmar se o comportamento foi introduzido por esta tarefa, não pré-existente.

### Passo 4 — Classificar

| Resultado | Ação |
|-----------|------|
| No escopo + confirmado errado | `## Bugs de Aplicação Encontrados` (BUG-NN) |
| Fora do escopo + confirmado errado | Footnote no cenário: `> Observação (fora do escopo): ...` |
| Esperado/documentado | Sem menção ou nota breve em Decisões Técnicas |
| Limitação de ambiente | `> Limitação de ambiente: ...` no step do cenário |

---

## 9. Scope Discipline

Adicionado ao `subagent-spec-test` após o incidente #476.

**Regra:** Antes de adicionar qualquer CT (caso de teste) à SPEC, verificar:

1. Este endpoint/feature/campo é **explicitamente mencionado** na descrição da tarefa ou Testing Steps?
2. Esta é uma **validação direta** dos critérios de aceite da tarefa?

Se NÃO para ambos → **não incluir o CT**.

**Exceções permitidas:**
- CTs que suportam diretamente o happy path
- Cobertura de regressão explicitamente solicitada pelo orquestrador
- CT negativo que é contraparte direta de um CT positivo obrigatório

**Proibido:** CTs de "verificação de consistência" para endpoints fora do escopo da tarefa.

---

## 10. User Story Mapping e Risk Tiers

### User Story Mapping

O `spec-test` agora obrigatoriamente lê `docs/user-stories/jornada-completa-lease.md` para:

1. Identificar quais US (User Stories) a tarefa cobre (18 US em 5 fases)
2. Extrair o fluxo do usuário (ações step-by-step)
3. Mapear riscos do lease (fraude, crédito, compliance, financeiro, operacional, receita)
4. Cada CT deve validar um step do fluxo real E cobrir pelo menos um risco mapeado

**Output obrigatório na SPEC:**

```markdown
## User Story Mapping

| US | Fase | Persona | Fluxo | Riscos | CTs |
|----|------|---------|-------|--------|-----|
| US-ORIG-01 | Originação | Consumidor | Submete aplicação | Fraude, Crédito | CT-01, CT-02 |
```

### Risk Tier System

Quando um teste cria uma aplicação de lease, a SPEC DEVE declarar o tier de risco:

| Tier | SSN | Estado | Merchant | Valor | Resultado Esperado |
|------|-----|--------|----------|-------|-------------------|
| low | não termina em 9 | CA, CO, FL | TerraceFinance | $800–$1,500 | FUNDED |
| medium | não termina em 9 | TX, OH, GA | TerraceFinance/BuyOnTrust | $400–$800 | FUNDED |
| high (denied) | termina em 9 | qualquer | qualquer | qualquer | UW_DENIED |
| kornerstone-low | não termina em 9 | CA, TX | FifthAveFurnitureNY | $800–$1,500 | FUNDED |

---

## 11. Triple Validation

Formalizada como obrigatória para todos os CTs:

| Camada | O que validar |
|--------|--------------|
| **Payload / Response** | HTTP status + todos os campos do response body (estrutura, tipos, valores) |
| **DB Persistence** | Query na tabela-alvo → confirmar registro criado/atualizado |
| **UI Rendering** | Navegar à página → verificar valores exibidos batem com referência API/DB |

Para páginas de histórico e exibição de dados: 4ª camada → API GET de referência antes da asserção UI.

Testes API-only: Payload/Response + DB (UI = N/A).

---

## 12. Formato de Relatório Padronizado

Definido em `.claude/context/shared/e2e-test-report-standard.md`. Todos os relatórios em **PT-BR**.

### Blocos obrigatórios (em ordem)

1. `## Informações da Tarefa` — título, URL GitLab, milestone, labels, pipeline
2. `## Descrição` — descrição completa da tarefa
3. `## Execução do Teste` — ambiente, projeto, data, duração, resultado, vídeo, trace
4. `## Evidências (Dados Utilizados/Criados)` — TODOS os leadPk, accountPk, arrangementPk
5. `## Capturas de Tela` — tabela CT → arquivo → descrição
6. `## Cenários` — no formato de 3 blocos (ver abaixo)
7. `## Cobertura dos Requisitos` — condicional (quando tarefa tem critérios explícitos)
8. `## Bugs de Aplicação Encontrados` — condicional (omitir se nenhum bug)
9. `## Resumo da Validação` — tabela com contagens e verificações

### Formato de Cenário (3 blocos obrigatórios)

```markdown
### Cenário: Cenário {N} — {CT-XX}

**O que é feito:** {ação concreta — endpoint, dados, navegação}

**O que acontece:** {comportamento do sistema — status HTTP, transição de estado}

**O que é verificado:** {asserções com valores reais — campo=valor, HTTP 200}

#### Como verificar manualmente

1. {passo numerado com URL/rota específica}
2. {valor esperado e onde encontrar}

**PASSOU**
```

**Melhorias aplicadas:**
- Seção `## Evidências` agora obrigatória (antes, PKs eram perdidos)
- Formato de 3 blocos elimina descrições vagas
- `#### Como verificar manualmente` obrigatório em todo cenário
- Linhas de Vídeo e Trace sempre presentes (API-only = "N/A")

---

## 13. Common Operations Cookbook

Criado em `.claude/context/shared/common-operations.md` após detectar que agents repetidamente erravam assinaturas de funções de pagamento.

**Conteúdo:**
- Imports canônicos (qual import usar, qual NÃO usar)
- Estrutura de `testData` para task tests
- Pattern completo de `driveToFunded` (do lead ao account FUNDED)
- CC Payment Arrangement — assinatura correta + armadilhas comuns
- ACH Payment Arrangement — diferenças do CC, limitações de ambiente
- Tabela de assinaturas de referência rápida (assinatura real vs. erro comum)
- TMS Due Date Adjustment
- Scheduled Tasks
- Estado compartilhado entre steps (`ctx`)

**Regra:** Obrigatório para qualquer teste envolvendo pagamentos, CC/ACH, ou `driveToFunded`.

---

## 14. Shared Context Files

Arquivos em `.claude/context/shared/` usados por múltiplos agents:

| Arquivo | Propósito |
|---------|-----------|
| `agent-coordination.md` | Protocolo de lock baseado em PID para edições paralelas |
| `e2e-agent-responsibilities.md` | Hierarquia de page objects, catálogo de helpers/API clients, patterns obrigatórios |
| `e2e-test-examples.md` | Exemplos de código verificados e atualizados |
| `e2e-test-plan-template.md` | Template US + CT-XX para cenários |
| `e2e-checklist.md` | Checklist por tipo de feature (10 categorias) |
| `e2e-test-report-standard.md` | Template completo de relatório (§1–§8) |
| `common-operations.md` | Cookbook com assinaturas verificadas |

**Melhoria:** Exemplos em `e2e-test-examples.md` foram corrigidos (imports quebrados apontavam para `@playwright/test` ao invés de `@fixtures/test-context.fixture.js`). Agents que consumiam exemplos errados geravam código que não compilava.

---

## 15. Regras Path-Scoped (Auto-loading)

Arquivos em `.claude/rules/` carregam automaticamente quando Claude edita arquivos no path declarado:

| Rule File | Paths | Principais Proibições |
|-----------|-------|-----------------------|
| `page-objects.md` | `src/pages/**/*.ts` | Sem `BasePage` direto; sem selectors inline; sem `expect()` em page objects; sem `waitForTimeout` |
| `api-clients.md` | `src/api/**/*.ts` | Só extender `BaseClient`; sem URLs hardcoded; sem fetch/axios raw; sem responses não-tipadas |
| `testing.md` | `tests/**/*.ts` | Sem `waitForTimeout`; sem `expect` em page objects; sem `@playwright/test` import; sem imports relativos |
| `selectors.md` | `src/selectors/**/*.ts`, `src/pages/**/*.ts` | Sem selectors inline; sem XPath; sem CSS posicional |
| `helpers.md` | `src/helpers/**/*.ts` | IDs worker-scoped; lock files para multi-terminal; assinaturas corretas de payment |
| `security.md` | **todos** (sem `paths:`) | Sem credenciais em código; DB SELECT-only sem autorização |

**Vantagem:** As regras são contextuais — só aparecem quando o agent está editando o tipo certo de arquivo. Não poluem o contexto para tarefas não-relacionadas.

---

## 16. Lifecycle Hooks e Coordenação

Hooks configurados em `.claude/settings.json`:

| Evento | Hook | Propósito |
|--------|------|-----------|
| `SessionStart` | `session-start.sh` | Inicialização da sessão |
| `PreToolUse` (Write\|Edit) | `pre-write-validate.sh` | Validação antes de escrever |
| `PreToolUse` (Write\|Edit) | `lock-selectors.sh` | Lock automático do arquivo de selectors |
| `PostToolUse` (Write\|Edit) | `auto-review.sh` | Review automático após escrita |
| `PostToolUse` (Write\|Edit) | `unlock-selectors.sh` | Unlock do arquivo de selectors |
| `SubagentStart` | `subagent-log.sh` | Log de início de subagent |
| `SubagentStop` | `subagent-log.sh` | Log de término de subagent |
| `Stop` | `session-review.sh` | Review final da sessão |

**Coordenação entre agents:**

O protocolo de lock em `shared/agent-coordination.md` usa PID-based locks (não TTL):

```json
// .claude/locks/src_selectors_common.selectors.ts.lock
{"pid": 12345, "since": "2026-03-25T10:00:00Z", "file": "src/selectors/common.selectors.ts"}
```

- Verifica PID com `kill -0 <PID>` — se processo morto, deleta lock
- Obrigatório ao editar qualquer arquivo compartilhado existente
- Não necessário ao criar arquivo novo
- Os hooks `lock-selectors.sh` / `unlock-selectors.sh` automatizam isso para o arquivo de selectors

---

## 17. Permissões e Segurança

Configuradas em `.claude/settings.json`:

**Allow:** `*` (tudo permitido por padrão)

**Deny list (explícita):**
- `git commit`, `git push` — execução manual pelo usuário
- `git reset --hard/soft`, `git clean`, `git checkout --`, `git rebase`, `git branch -D/-d` — operações destrutivas
- `rm -rf /*`, `rm -rf ~*` — destruição do sistema
- `Write/Edit` em `.env` e `.pem` — proteção de credenciais

**Regras de segurança (security.md):**
- `SELECT` sempre permitido no BD
- `INSERT/UPDATE/DELETE` requer autorização explícita do usuário
- Credenciais em `.env` (gitignored), nunca em código
- API keys via `BaseClient` headers, nunca em logs

---

## 18. Agents Consolidados (Multi-mode)

Melhoria de organização: agents que antes eram arquivos separados foram consolidados em agents multi-modo.

### subagent-audit (2 modos)

Antes: `subagent-audit-selectors.md` + `subagent-audit-estrutura.md` (2 arquivos)
Depois: `subagent-audit.md` com modos `selectors` e `structure`

**Modo SELECTORS:**
- Audita CSS/XPath selectors para robustez, centralização, dead code
- Classifica: dead selector, hardcoded, XPath, positional CSS, class-based

**Modo STRUCTURE:**
- Audita consistência da estrutura `.claude/`
- Verifica: contradições, lacunas, duplicações, referências quebradas

**`permissionMode: plan`** — garante que o agent nunca modifique código, apenas reporte.

### subagent-data (3 modos)

Antes: `subagent-data-merchant.md` + `subagent-data-template.md` + `subagent-data-test-accounts.md` (3 arquivos)
Depois: `subagent-data.md` com modos `merchant`, `template`, `accounts`

**Modo MERCHANT:** Adiciona merchant ao catálogo `src/data/merchants.ts`
**Modo TEMPLATE:** Cria JSON template em `src/fixtures/api-templates/`
**Modo ACCOUNTS:** Salva/carrega/lista/limpa contas de teste em `test-results/test-accounts.json`

**Benefício:** Reduz proliferação de arquivos, mantém coerência entre modos, facilita manutenção.

---

## 19. Regras Invioláveis

1. **Nunca pular spec-test** para pipelines `new-flow` e `new-api`
2. **Artefatos existentes não são recriados** — verificar primeiro
3. **Fail-fast**: corrigir `tsc --noEmit` antes de prosseguir
4. **docs-update roda DUAS VEZES** quando tarefa vem de fonte explícita: pré-análise + pós-pipeline
5. **docs-update pós-pipeline é OBRIGATÓRIO** em todo pipeline (todo pipeline termina com `→ docs`)
6. **Paralelização real**: Agent tool com múltiplos agents simultâneos, não sequencial
7. **Escopo atômico**: cada agent faz UMA coisa
8. **Relatório de tarefa DEVE ser atualizado após toda execução de teste** — nunca deixar valores PENDING

---

## 20. QA Flow — Pipeline de 10 Fases

O pipeline mais completo, invocado via `/qa-flow`:

| Fase | Nome | Ação |
|------|------|------|
| 0 | Setup | Sync repos, criar TODO list (obrigatório), optional fetch-task |
| 1 | Análise de Contexto | Carregar context files, analisar backend (controllers/migrations), frontend |
| 2 | Criar Cenários | US + CT-XX salvos em `docs/test-reports/{testName}-scenarios.md` — **checkpoint**: usuário revisa antes de prosseguir |
| 3+4 | PARALELO: SPEC + Cobertura | spec-test roda em paralelo com exploração de cobertura existente |
| 5 | Implementar Testes | Round 1 paralelo (page-object, api-client, templates, db-validation) → Round 2 paralelo (impl-e2e, impl-api) |
| 6 | Refatorar | DRY, compliance com patterns, barrel exports |
| 7 | Executar + Corrigir | Rodar até 100% green; invocar validate-results |
| 8 | Confirmar Relatório | Verificar relatório completo; re-invocar validate-results se valores PENDING |
| 9 | Atualizar Docs | git diff, invocar docs-update se mudanças detectadas |

**Checkpoint na Fase 2:** Cenários são apresentados ao usuário para revisão antes da implementação começar. Evita retrabalho.

---

## 21. Checklist para Aplicar em Outro Projeto

### Estrutura de diretórios

```
.claude/
├── agents/              # 1 arquivo .md por agent (ou multi-mode)
├── commands/            # Slash commands (/qa-flow, etc.)
├── context/             # Context files passivos
│   ├── orchestration.md # Protocolo de orquestração
│   ├── shared/          # Compartilhados entre agents
│   └── INDEX.md         # Índice de todos os context files
├── rules/               # Regras path-scoped (auto-carregadas)
├── scripts/             # Hooks de lifecycle
├── settings.json        # Permissões, hooks, MCP servers
└── settings.local.json  # Overrides locais (gitignored)
```

### Passos para replicar

1. **CLAUDE.md** — Criar como orquestrador: resumo, stack, autonomia, catálogo de agents, pipeline types, regras invioláveis, referências
2. **Agents** — Um `.md` por responsabilidade com frontmatter (name, model, tools, effort). Consolidar agents relacionados em multi-mode
3. **Orchestration** — `context/orchestration.md` com dependency graph, context loading per agent, fases, checkpoints
4. **Rules** — `rules/*.md` com `paths:` para auto-loading por tipo de arquivo
5. **Shared context** — `context/shared/` para templates, exemplos, cookbook, relatório standard
6. **Settings** — `settings.json` com deny list de permissões, hooks, MCP servers
7. **Commands** — `commands/*.md` para slash commands de pipelines complexos
8. **Hooks** — Scripts em `scripts/` para lock/unlock, validação pré-escrita, logging de subagents

### Princípios a manter

- [ ] Cada agent faz UMA coisa (atomic scope)
- [ ] Context loading é explícito e mínimo por agent
- [ ] Rules são path-scoped, não globais
- [ ] docs-update tem modo duplo (pré + pós)
- [ ] Bug triage protocol com 4 passos antes de reportar
- [ ] Scope discipline — CTs mapeiam a requisitos da tarefa
- [ ] Triple validation (payload + DB + UI) em todo CT
- [ ] Relatórios em formato padronizado com evidências obrigatórias
- [ ] Cookbook de operações comuns para evitar erros recorrentes
- [ ] Agents de auditoria são read-only (permissionMode: plan)
- [ ] Paralelização real entre agents independentes
- [ ] Checkpoints entre fases para validação

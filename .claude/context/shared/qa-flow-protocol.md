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
| **QA Domain Reflexes** | `.claude/context/shared/qa-domain-reflexes.md` | **SEMPRE** — validações que QA experiente aplica no automático após cada ação (audit log, rating letter, saldo). Carregar antes da Fase 2 |
| **Test Data Hierarchy** | `.claude/rules/testing.md § Test Data Hierarchy` | **SEMPRE** — regra inviolável: criar dados fresh é PADRÃO, reuso de existente é EXCEÇÃO. Carregar antes das Fases 2 e 5 |
| **SSN Test Catalog** | `.claude/context/shared/ssn-test-catalog.md` | **SEMPRE que feature envolve `sendApplication`** — catálogo canônico de SSNs de teste + receitas para as 3 modalidades de programa (13m / 13m+16m / 16m Second Look). Cenários DEVEM cobrir as 3 ou justificar omissão. Carregar antes da Fase 2 |
| **Bug Classification Rules** | `.claude/context/shared/bug-classification-rules.md` | **SEMPRE** — exigir reprodução em fresh + checagem de task existente antes de reportar bug. Carregar antes das Fases 7 e 8 |
| **Padrão de relatório** | `.claude/context/shared/e2e-test-report-standard.md` | SEMPRE — para Fases 8 e 9 |
| **Arquitetura** | `.claude/context/project.md` | Se cria page objects/clients |
| **Test patterns** | `.claude/context/test-patterns-core.md + context/test-patterns-ui.md + context/test-patterns-arrangements.md` | Se cria testes |
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

**Estratégia de dados de teste (INVIOLÁVEL — consultar `.claude/rules/testing.md § Test Data Hierarchy`):**

Brand coverage obrigatório quando feature envolve criação de aplicação — ver seção "Cobertura de brand" abaixo.


- ✅ **PADRÃO:** cada cenário cria conta/lead NOVO via automação (`buildTestData`, `sendApplication`, `driveLeadToFunding`)
- ⚠️ **Aceitável:** criar via automação + mutação via API oficial (ex: `createOrUpdateEmail` para trocar primary email)
- 🚨 **Exceção:** reuso de conta existente APENAS com justificativa explícita no cenário (GDS bypass, > 10min para recriar, fixture impossível de criar via automação). Exige comentário escrito.
- ❌ **Proibido sem autorização explícita do usuário:** UPDATE direto no DB (Exception 3 do CLAUDE.md)

Cenários que dependem de reuso DEVEM documentar o motivo + plano de reprodução em fresh antes de investigar bugs.

**Cobertura de modalidades de programa (INVIOLÁVEL quando feature envolve `sendApplication` — consultar `.claude/context/shared/ssn-test-catalog.md`):**

Quando o cenário envolve criação de aplicação, cenários DEVEM cobrir as 3 modalidades de programa OU justificar omissão explícita:

| Modalidade | SSN | Pré-requisito | Resultado |
|------------|-----|---------------|-----------|
| **A — 13m apenas (UOWN)** | `generateTestSSN(true)` | merchant UOWN não-Kornerstone, sem bank data OU BIN não-elegível | `planId=*13` apenas |
| **B — 13m+16m (Kornerstone)** | `generateTestSSN(true)` | merchant Kornerstone + bank data + BIN elegível | `paymentDetailsList` com 13m E 16m |
| **C — 16m via Second Look** | `100000053` | TireAgent + Brian/Columbus/92821/CA + stg + GDS habilitado | 1ª denied 13m + preview 16m, 2ª approved 16m |
| **D — Denied** | `generateTestSSN(false)` | — | `UW_DENIED` |

Omitir uma modalidade exige justificativa no scenarios.md (feature é modalidade-específica, ambiente não suporta, etc.). Silent skip = violação.

**Cobertura de brand (INVIOLÁVEL quando feature envolve criação de conta — consultar `.claude/context/shared/ssn-test-catalog.md § 7`):**

Toda feature que cria aplicação DEVE ter cenários para **UOWN** E **Kornerstone** (brand é dimensão independente de modalidade).

Cenários Kornerstone DEVEM incluir:
1. **Pré-condição DB:** `SELECT company FROM uown_sv_account WHERE pk=$accountPk` → expected `KORNERSTONE` quando merchant tem `ref_merchant_code` começando com `KS`
2. **Protocolo de divergência:** se `company != 'KORNERSTONE'` → STOP + logar `BRAND_MISMATCH` + pedir autorização ao user para `UPDATE uown_sv_account/uown_los_lead SET company='KORNERSTONE'`. Sem autorização → ENV-GAP, não bug.
3. **Validação de estilo (quando CT renderiza UI/email):**
   - Email: `From: CS@kornerstoneliving.com`, template name prefixo `KORNERSTONE_`, logo Kornerstone, footer legal Kornerstone, imagens GCS Kornerstone
   - Portal: logo Kornerstone, cores Kornerstone, favicon, title, copy de marketing
   - **Cross-contamination check:** body NÃO contém marcadores da outra brand

Cenários UOWN DEVEM incluir os mesmos checks com valores UOWN (`CustomerService@uownleasing.com`, sem prefixo no template name, etc.).

Matriz obrigatória no scenarios.md:

```
                 | UOWN | Kornerstone |
Modalidade A     | CT-XX| CT-YY       |
Modalidade B     | N/A  | CT-ZZ       |
Modalidade C     | N/A  | CT-WW       |
Modalidade D     | CT-AA| CT-BB       |
```

**Reflexos de domínio obrigatórios (consultar `.claude/context/shared/qa-domain-reflexes.md`):**

Para cada ação nos cenários, cruzar com o catálogo. Se a ação estiver listada (pagamento, acordo, payoff, refund, mutation, etc.), incluir TODAS as validações do bloco correspondente como passos do cenário, marcados com tag `[reflex]`. Exemplos:
- Pagamento → conferir valores decompostos, saldo antes/depois, rating letter, log de auditoria
- Payment agreement → rating letter antes E depois, novo schedule, documento do acordo
- Qualquer mutation → log de auditoria, `updated_at`, `updated_by`

Se nenhum bloco específico bater → aplicar o bloco "Qualquer Mutation" como fallback.

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
| Novo page object | `subagent-page-object` (mode: `create`) | Sim |
| Novo API client | `subagent-impl-api-client` | Sim |
| JSON template | `subagent-data (template mode)` | Sim |
| DB validation | `subagent-impl-db-validation` | Sim |
| Teste E2E | `subagent-impl-e2e` | Após dependências |
| Teste API | `subagent-impl-api` | Após dependências |

**Execução paralela — OBRIGATÓRIO usar um único bloco de mensagem por grupo:**

```
# ROUND 1: Artefatos independentes — TODOS em uma única mensagem:
Agent(subagent-page-object, "...")
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

- Consultar `.claude/context/shared/helpers-catalog.md / shared/api-clients-catalog.md / shared/page-objects-catalog.md` para helpers disponíveis
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
2. Classificar seguindo `.claude/context/shared/bug-classification-rules.md`:
   - **Bug do teste** → corrigir o teste
   - **[OBSERVAÇÃO] comportamento inesperado** (não reproduzido em fresh OU fixture antiga suspeita) → footnote no cenário, NÃO reportar como bug
   - **[HIPÓTESE] possível defeito** (1 ocorrência + causa plausível) → footnote + perguntar ao user sobre task existente antes de escalar
   - **[CONFIRMADO] Bug da aplicação** (reproduzido em fresh + sem task aberta + indicadores de artefato descartados) → documentar na Fase 8
   - **Infra/Timing** → ajustar timeout ou retry
3. Se classificar como bug de aplicação: ANTES de prosseguir, reproduzir em conta/lead criado do zero pelo próprio teste. Se não reproduzir em fresh → rebaixar para `[OBSERVAÇÃO]`.
4. Re-executar apenas os testes que falharam

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
| Novo helper em `src/helpers/` | Adicionar à tabela em `shared/helpers-catalog.md / shared/api-clients-catalog.md / shared/page-objects-catalog.md` |
| Helper deletado | Remover da tabela |
| Novo spec em `tests/` | Atualizar estrutura de arquivos |
| Novo page object em `src/pages/` | Atualizar hierarquia em `shared/helpers-catalog.md / shared/api-clients-catalog.md / shared/page-objects-catalog.md` |
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
grep -h "helper.ts" .claude/context/shared/helpers-catalog.md / shared/api-clients-catalog.md / shared/page-objects-catalog.md | \
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
| 9. Docs | Y/N | `.claude/context/shared/helpers-catalog.md / shared/api-clients-catalog.md / shared/page-objects-catalog.md` |

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

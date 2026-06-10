# Test Report Standard - Full Template & Examples

> Reference extracted from SKILL.md. For rules and structure overview, see [../SKILL.md](../SKILL.md).

## Full Report Template (validate-results)

**File path:** `docs/taskTestingUown/{testName}/{testName}-report.md`

```markdown
# Relatório de Teste: {testName}

> ⚠️ **Este arquivo é registro de execução, NÃO fonte de padrão.**
> Pattern source = skills (`.claude/skills/`) + código (`src/`, `tests/`).
> Categorias volatile (drift-prone) → [[volatile-knowledge-registry]].
> Re-leitura permitida apenas para: (a) auditoria histórica, (b) reproduzir teste via leadPk/accountPk.
> NUNCA inferir pattern a partir deste arquivo.

## Informações da Tarefa

| Campo | Valor |
|-------|-------|
| **Título** | {taskTitle} |
| **URL GitLab** | {taskUrl} |
| **Milestone** | {taskMilestone} |
| **Labels** | {taskLabels} |
| **Pipeline** | {pipelineType} |

## Descrição

{taskDescription — descrição completa em markdown}

## Execução do Teste

| Campo | Valor |
|-------|-------|
| **Arquivo de Teste** | `{testFilePath}` |
| **Ambiente** | {environment} |
| **Projeto Playwright** | {project} |
| **Data de Execução** | {YYYY-MM-DD HH:mm} |
| **Duração** | {duration} |
| **Resultado** | {N passou / N falhou / N skipped} |
| **Vídeo** | Gravado (`VIDEO=on`) |
| **Trace** | Habilitado (`TRACE=on-first-retry`) |

> Para testes API-only (sem browser): substituir as linhas Vídeo e Trace por `N/A (API-only)`.

## Evidências (Dados Utilizados/Criados)

> **MANDATORY** — toda execução DEVE listar os PKs de evidência (leads e/ou contas) usados ou criados durante o teste. Estes valores permitem rastrear e reproduzir o teste manualmente.

| Tipo | PK | Papel no Teste | Criado/Existente |
|------|----|----------------|:----------------:|
| Lead | leadPk={N} | {descrição — ex: aplicação aprovada, risco baixo CA} | Criado / Existente |
| Account | accountPk={N} | {descrição — ex: conta ACTIVE para CC payment} | Criado / Existente |
| Arrangement | arrangementPk={N} | {descrição — ex: SETTLEMENT 3 parcelas CC} | Criado |

> **Regras:**
> - Incluir TODOS os leadPk e accountPk extraídos dos logs de execução
> - Se o teste usa contas pré-existentes (GDS bypass), marcar como "Existente"
> - Se o teste cria novos leads/contas, marcar como "Criado"
> - Incluir também PKs auxiliares relevantes: arrangementPk, ccTransactionPk, achPk, fundingTransactionPk
> - Se nenhum lead/account é usado (ex: teste de config), usar: `> Nenhuma evidência de lead/account — teste de configuração.`

## Capturas de Tela

| CT | Arquivo | Descrição |
|----|---------|-----------|
| CT-XX | `docs/taskTestingUown/{testName}/{testName}-NN-desc.png` | {estado capturado — prova do critério de aceite} |

> Para testes API-only (sem browser): substituir o bloco por `> Sem capturas de tela — teste API-only.`

## Cenários

{cenários no formato padrão — ver seção 2}

## Cobertura dos Requisitos

> Incluir esta seção quando a tarefa tem critérios de aceite ou requisitos explícitos no GitLab.

| Requisito | Coberto | Cenário |
|-----------|:-------:|---------|
| {requisito da tarefa} | SIM | CT-XX |

## Bugs de Aplicação Encontrados

> Incluir esta seção apenas quando bugs forem identificados durante a execução. Omitir completamente se não há bugs.

{bugs no formato padrão — ver seção 7}

## Resumo da Validação

{tabela de validação — ver seção 4}
```

## Scenario Output Format

Each scenario follows this exact pattern:

```markdown
### CT-XX

**Objetivo:** {uma frase — o que o cenário valida}

**O que é verificado:** {comportamento do sistema em linguagem de negócio — o que o sistema faz, não o que o teste faz; menciona a origem do dado quando relevante}

Exemplos:
| Coluna1  | Coluna2  |
|----------|----------|
| {valor1} | {valor2} |

#### Como verificar manualmente

1. {passo numerado — URL específica, rota, ação de navegação}
2. {passo numerado — valor esperado e onde encontrá-lo}
3. {para API: instrução curl/Postman; para DB: query SQL; para UI: navegação clique a clique}

**PASSOU**

---
```

### Golden Rule Examples

**Objetivo** diz o que valida. **O que é verificado** descreve o comportamento do sistema. **Como verificar manualmente** tem os valores técnicos exatos.

Bad - Objetivo vago (not accepted):
```
Verifica o comportamento do endpoint.
```

Bad - O que é verificado técnico (not accepted):
```
`rows.length > 0` — ao menos uma linha retornada após o filtro
`row["Invoice Number"] === "R45701"` — todas as linhas exibem o invoice
```

Good:
```
**Objetivo:** Verificar que filtrar por invoice number retorna apenas os leads que possuem aquele invoice.

**O que é verificado:** Ao buscar por um invoice number existente, a tabela retorna somente leads cujo `merchant_invoice_number` corresponde ao valor filtrado — confirmando que o filtro é funcional e preciso.
```

## Parsing Rules (extracting values from test output)

| Log Pattern | Extract |
|-------------|---------|
| `[CT-XX] runId={id}, email={e}` | runId, email |
| `[CT-XX] leadPk={N}` | leadPk |
| `[CT-XX] accountPk={N}` | accountPk |
| `[CT-XX] leadUuid={UUID}` | leadUuid |
| `[CT-XX] short_code="{code}"` | shortCode |
| `[CT-XX] redirectUrl="{url}"` | redirectUrl |
| `[CT-XX] status={S}` | status |
| `[CT-XX] response: {json}` | response body fields |
| `[CT-XX] Flyway migration: version={V}, script={S}, success={B}` | version, script, success |
| `✓ {test title} ({duration}ms)` | pass, duration |
| `✘ {test title} ({duration}ms)` | fail, duration |
| `- {test title}` (list reporter) | skipped |

## Validation Summary Template

```markdown
## Resumo da Validação

| Verificação | Resultado |
| ----------- | --------- |
| Todos os cenários da tarefa cobertos | SIM / NÃO |
| Contratos de API conferem com Postman | SIM / NÃO / N/A |
| Schema do BD confere com migration | SIM / NÃO / N/A |
| Regras de negócio validadas | SIM / NÃO / N/A |
| Bugs de aplicação encontrados | SIM ({N} bugs) / NÃO |
| Total de cenários | {N} |
| Passaram | {N} |
| Falharam | {N} |
| Skipped | {N} |
| Vídeo gravado | SIM / N/A (API-only) |
| Screenshots salvos | SIM ({N} arquivos em reports/screenshots/) / N/A (API-only) |
```

## Screenshots Rules

**Path:** `docs/taskTestingUown/{testName}/{testName}-{NN}-{desc}.png`

Screenshots MUST be saved inside the task folder alongside the report and spec files. This keeps all artifacts co-located and prevents cleanup by Playwright between runs.

- Saved via `page.screenshot({ path: 'docs/taskTestingUown/{testName}/{testName}-{NN}-{desc}.png', fullPage: false })`
- Naming: sequential two-digit number + short description, e.g. `1233-ct01-01-payment-screen.png`
- At least 1 per CT — taken immediately after the key assertion (proves the acceptance criterion)
- Focus: screenshot must show the state that proves the CT passed (not generic page captures)
- API-only tests: no screenshot needed (no browser)
- Reference in `.md` Capturas de Tela table: `docs/taskTestingUown/{testName}/{file}.png`
- **NEVER use `reports/screenshots/` or `reports/test-results/`** — those are cleaned by Playwright between runs

## Bug Report Format (Application Bugs Only)

**Section name:** always `## Bugs de Aplicação Encontrados` — no variations allowed.

Each bug within the section:

```markdown
### BUG-{N} — {título descritivo do bug}

**Status:** OPEN / RESOLVED / PARCIALMENTE RESOLVIDO
**Severidade:** Critical / High / Medium / Low

**Descrição:** {o que era esperado vs. o que aconteceu}
**Como Reproduzir:**
1. {passo numerado}
2. {passo numerado}
**Evidência:** {API response, screenshot path, DB query result}
**Cenário que detectou:** CT-XX
**Causa provável:** {análise técnica breve}
```

Rules:
- Bugs numbered sequentially within the report: BUG-01, BUG-02...
- Include only bugs found during THIS execution (not pre-existing known bugs unless still open)
- If a bug from a previous execution is still open, preserve it and update status if changed
- Omit the entire section if no bugs found

## Cobertura dos Requisitos (optional section)

Include when the task has explicit acceptance criteria or a requirements list in the GitLab issue.

```markdown
## Cobertura dos Requisitos

| Requisito | Coberto | Cenário |
|-----------|:-------:|---------|
| {requisito 1 — texto exato ou parafrasado da tarefa} | SIM | CT-01 |
| {requisito 2} | SIM | CT-02, CT-03 |
| {requisito 3 — não implementado ou fora do escopo} | NÃO | — |
```

Rules:
- One row per acceptance criterion from the GitLab issue
- "Coberto" = SIM only if there is a CT that directly validates the requirement
- Multiple CTs per requirement allowed (comma-separated)
- If not covered: NÃO + note why (out of scope, environment limitation, etc.)

## Source-Tagging Examples

Bad - no tag (not accepted as `[CONFIRMADO]`):
```
**Causa provável:** O sweep não considera scheduled SALE.
```

Good - with tags (accepted as `[CONFIRMADO]`):
```
**Causa provável:** O sweep filtra apenas COMPLETED, ignorando SCHEDULED SALE.
[svc-source:StickyRecoverScheduledTask.java:78]
[db-observation:uown_scheduled_task WHERE pk=80, coluna sql_to_pick_accounts]
[user-provided:Priyanka 2026-05-15]
```

# QA Flow — Fluxo Completo de Teste de Feature

Executa o fluxo completo de QA: analise -> cenarios -> implementacao -> execucao -> relatorios.

## Trigger

Use this skill when the user asks for a complete QA flow, mentions "qa flow", "full test flow", "test a feature end-to-end", provides a GitLab task URL for testing, or wants to run the complete testing pipeline (analysis + scenarios + implementation + execution + reports).

## Argumentos esperados

- URL da task no GitLab (se fornecida)
- Descricao/contexto da feature
- Informacoes adicionais

## Protocolo completo

Este skill é o **resumo** do protocolo. Para execução completa com todas as regras obrigatórias (TODO list, sync repos, contextos obrigatórios por fase, regras de test data hierarchy, modality coverage, brand coverage, bug classification), consultar:

**👉 [`.claude/context/shared/qa-flow-protocol.md`](../context/shared/qa-flow-protocol.md)**

Esse arquivo contém 9 fases detalhadas + tabelas de contexto obrigatório + matriz de cobertura + enforcement rules.

## Resumo das Fases do QA Flow

### Fase 0 — Setup e Planejamento

1. **Extrair informacoes** do argumento fornecido pelo usuario
2. **Sync repos** (OBRIGATORIO):
```bash
for repo in svc origination servicing website ams ams-website payment-gateway uwengine ccverification common los-common svc-common configuration; do
  git -C "../$repo" pull --ff-only 2>&1 || echo "WARN: $repo sync failed (using stale)"
done
```
3. **Criar TODO list** com `TaskCreate` para TODAS as fases (1-9)
4. **Se URL GitLab** -> invocar `subagent-fetch-task`

### Fase 1 — Analise de Contexto

Carregar contextos obrigatorios:
- `docs/business-rules/` — fonte de verdade
- `.claude/context/business-rules.md` — visao resumida
- `.claude/context/shared/e2e-checklist.md` — padroes de teste
- `.claude/context/shared/e2e-test-report-standard.md` — para relatorios

Analisar: backend (repos), frontend (components), regras de negocio, endpoints, transicoes de estado, permissoes.

### Fase 2 — Criar Cenarios de Teste

Documentar User Stories (US-PREFIX-NN) e cenarios (CT-XX) com categorias obrigatorias:
- Happy path, validacoes/erros, permissoes (403/401), transicoes de estado, edge cases, cross-domain

Salvar em: `docs/taskTestingUown/{testName}/{testName}-scenarios.md`
**Apresentar ao usuario para revisao antes de prosseguir.**

### Fases 3 e 4 — PARALELO: SPEC + Cobertura Existente

Lancar em paralelo:
```
Agent(subagent-spec-test, "cenarios da Fase 2 + regras de negocio")
Agent(Explore, "buscar testes existentes para a feature")
```

### Fase 5 — Implementar Testes Faltantes

Classificar e delegar para agents em paralelo:
- ROUND 1 (independentes): page-object, api-client, data, db-validation
- ROUND 2 (apos ROUND 1): e2e, api tests

Naming: `{milestone}_{camelCaseTitle}_{taskNumber}`
Location: `docs/taskTestingUown/{testName}/{testName}.spec.ts`

### Fase 6 — Refatorar Codigo (DRY + Padroes)

Checklist: duplicacao, helpers, padroes do projeto, organizacao.

### Fase 7 — Executar Testes e Corrigir Falhas

Ciclo: Executar -> Analisar falhas -> Corrigir -> Re-executar ate 100%.
Invocar `subagent-validate-results` para gerar relatorio.

### Fase 8 — Confirmar Relatorio

Verificar `docs/taskTestingUown/{testName}/{testName}-report.md` gerado pelo validate-results.
Se incompleto -> reinvocar validate-results.

### Fase 9 — Atualizar Documentacao

Invocar `subagent-docs-update` com lista de mudancas.

## Resumo Final

Ao concluir, apresentar tabela com status de cada fase, metricas (cenarios, testes, taxa de sucesso, bugs).

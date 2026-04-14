# New Payment Flow — Implementar Teste de Fluxo de Pagamento

Cria teste completo de fluxo de pagamento: API client + page object + E2E test.

## Trigger

Use this skill when the user asks to create a payment test, mentions "payment flow", "CC payment", "ACH payment", "arrangement", "payoff", or wants to test a financial transaction flow.

## Argumentos esperados

- **Tipo de pagamento**: CC (credit card) | ACH | arrangement | payoff
- **Portal**: origination | servicing
- **Task GitLab**: ID da task (se houver)
- **Merchant**: nome do merchant de teste
- **Cenarios**: happy path + error cases

## Protocolo de Execucao

### Fase 0 — TODO List obrigatoria

Antes de qualquer trabalho, crie a TODO list com `TaskCreate` para cada fase. Atualize com `TaskUpdate` ao avancar.

### Fase 1 — Carregar contexto de regras de negocio

Ler antes de qualquer analise:
- `docs/business-rules/05-pagamentos.md` — regras de pagamento
- `docs/business-rules/06-conta-ciclo-vida.md` — ciclo de vida da conta
- `.claude/context/shared/common-operations.md` — cookbook de operacoes
- `.claude/rules/helpers.md` — assinaturas corretas de funcoes de pagamento

**CRITICO — assinaturas corretas:**
| Funcao | Correto |
|--------|---------|
| `buildCcArrangementBody` | `(options: object)` |
| `makeCreditCardPayments` | `(body)` |
| `waitForCcTransactionsProcessed` | `(arrangementPk)` |
| `calculateDateISO(0)` | retorna `YYYY-MM-DD` |

### Fase 2 — Gerar SPEC

```
Agent(subagent_type="subagent-spec-test", prompt="""
Tipo: payment flow — {paymentType}
Portal: {portal}
Regras de negocio: [contexto carregado na Fase 1]
Cenarios obrigatorios: happy path, validacoes, edge cases
""")
```

### Fase 3 — Criar artefatos em paralelo

```
# Todos em paralelo (independentes):
Agent(subagent-impl-api-client, ...)    # se client nao existe
Agent(subagent-impl-page-object, ...)   # se page object nao existe
Agent(subagent-data, ...)               # JSON templates de request (template mode)
Agent(subagent-impl-db-validation, ...) # queries de validacao DB
```

### Fase 4 — Implementar teste

Apos todos os artefatos estarem prontos:

```
Agent(subagent_type="subagent-impl-e2e", prompt="""
SPEC: [output da Fase 2]
Tipo: {paymentType}
Artefatos criados: [lista da Fase 3]
Merchant: {merchant}
""")
```

### Fase 5 — Executar e validar

```bash
npx tsc --noEmit 2>&1 | head -30
npx playwright test docs/taskTestingUown/{testName}/ --project=task-testing --reporter=list
```

Invocar `subagent-validate-results` apos execucao.

### Fase 6 — Atualizar documentacao (OBRIGATORIO)

```
Agent(subagent_type="subagent-docs-update", prompt="Post-pipeline: payment flow {type} implementado")
```

## Resultado esperado

- Artefatos em `src/` (client, page object, templates)
- Teste em `docs/taskTestingUown/{name}/{name}.spec.ts`
- `tsc --noEmit` sem erros
- Todos os cenarios passando (100%)
- Relatorio em `docs/taskTestingUown/{testName}/{testName}-report.md`

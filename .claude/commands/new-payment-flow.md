# New Payment Flow — Implementar Teste de Fluxo de Pagamento

Cria teste completo de fluxo de pagamento: API client + page object + E2E test.

## Argumentos recebidos:
$ARGUMENTS

---

## REGRA ABSOLUTA: TODO List obrigatória

Antes de qualquer trabalho, crie a TODO list com `TaskCreate` para cada fase. Atualize com `TaskUpdate` ao avançar.

---

## Protocolo de Execução

### Fase 0 — Analisar argumentos

Extrair dos argumentos:
- **Tipo de pagamento**: CC (credit card) | ACH | arrangement | payoff
- **Portal**: origination | servicing
- **Task GitLab**: ID da task (se houver)
- **Merchant**: nome do merchant de teste
- **Cenários**: happy path + error cases

### Fase 1 — Carregar contexto de regras de negócio

Ler antes de qualquer análise:
- `docs/business-rules/05-pagamentos.md` — regras de pagamento
- `docs/business-rules/06-conta-ciclo-vida.md` — ciclo de vida da conta
- `.claude/context/shared/common-operations.md` — cookbook de operações
- `.claude/rules/helpers.md` — assinaturas corretas de funções de pagamento

**CRÍTICO — assinaturas corretas:**
| Função | Correto |
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
Regras de negócio: [contexto carregado na Fase 1]
Cenários obrigatórios: happy path, validações, edge cases
$ARGUMENTS
""")
```

### Fase 3 — Criar artefatos em paralelo

```
# Todos em paralelo (independentes):
Agent(subagent-impl-api-client, ...)    # se client não existe
Agent(subagent-impl-page-object, ...)   # se page object não existe
Agent(subagent-data, ...)               # JSON templates de request (template mode)
Agent(subagent-impl-db-validation, ...) # queries de validação DB
```

### Fase 4 — Implementar teste

Após todos os artefatos estarem prontos:

```
Agent(subagent_type="subagent-impl-e2e", prompt="""
SPEC: [output da Fase 2]
Tipo: {paymentType}
Artefatos criados: [lista da Fase 3]
Merchant: {merchant}
$ARGUMENTS
""")
```

### Fase 5 — Executar e validar

```bash
npx tsc --noEmit 2>&1 | head -30
npx playwright test docs/taskTestingUown/{testName}/ --project=task-testing --reporter=list
```

Invocar `subagent-validate-results` após execução:
```
Agent(subagent_type="subagent-validate-results", prompt="...")
```

### Fase 6 — Atualizar documentação (OBRIGATÓRIO)

```
Agent(subagent_type="subagent-docs-update", prompt="Post-pipeline: payment flow {type} implementado")
```

---

## Resultado esperado

- Artefatos em `src/` (client, page object, templates)
- Teste em `docs/taskTestingUown/{name}/{name}.spec.ts`
- `tsc --noEmit` sem erros
- Todos os cenários passando (100%)
- Relatório em `docs/taskTestingUown/{testName}/{testName}-report.md`

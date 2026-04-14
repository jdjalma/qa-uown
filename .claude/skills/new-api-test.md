# New API Test — Implementar Teste API-Only

Implementa um teste API-only (sem browser) em `tests/api/` ou `docs/taskTestingUown/`.

## Trigger

Use this skill when the user asks to create an API test, mentions "teste API", "testar endpoint", "API-only test", "test without browser", or wants to validate backend endpoints without E2E browser interaction.

## Argumentos esperados

- **Endpoint(s)**: metodo + rota (ex. `POST /uown/svc/v1/accounts/{pk}/move-due-dates`)
- **Task GitLab**: ID da task (se houver)
- **Cenarios**: happy path + error cases
- **Portal/dominio**: origination | servicing | payments | etc.

## Protocolo de Execucao

### Fase 0 — TODO List obrigatoria

Criar TODO list com `TaskCreate` para cada fase.

### Fase 1 — Carregar contexto

Ler regras de negocio relevantes:
- `.claude/context/business-rules.md` — identificar dominio
- `docs/business-rules/{capitulo}.md` — capitulo especifico
- `.claude/context/shared/common-operations.md` — se envolve pagamentos ou fluxo multi-step
- `docs/business-rules/appendix-g-cenarios-risco.md` — se envolve sendApplication

### Fase 2 — Gerar SPEC (OBRIGATORIO para new-api)

```
Agent(subagent_type="subagent-spec-test", prompt="""
Tipo: API test
Endpoints: {endpoints}
Dominio: {domain}
Regras de negocio: [contexto da Fase 1]
Cenarios: happy path + error cases (400, 404, 422)
""")
```

### Fase 3 — Verificar/criar API client

Verificar se client existe:
```
Glob: src/api/clients/*{domain}*.client.ts
```

Se nao existe, invocar em paralelo:
```
Agent(subagent-impl-api-client, "...")
Agent(subagent-data, "...")  # se precisar de JSON templates
```

### Fase 4 — Implementar teste

```
Agent(subagent_type="subagent-impl-api", prompt="""
SPEC: [output da Fase 2]
Endpoints: {endpoints}
Client: {clientName}
Cenarios: {scenarios}

Convencoes:
- Import de @fixtures/test-context.fixture
- Usar api.domainClient (nunca request direto)
- Happy path + pelo menos 1 error case
- DB persistence validation quando endpoint modifica estado
- test.step() em todos os cenarios
""")
```

### Fase 5 — Verificar e executar

```bash
npx tsc --noEmit 2>&1 | head -30
npx playwright test {testPath} --project=task-testing --reporter=list
```

Invocar `subagent-validate-results` apos execucao.

### Fase 6 — Atualizar documentacao (OBRIGATORIO)

```
Agent(subagent_type="subagent-docs-update", prompt="Novo API test: {testName} — endpoints: {list}")
```

## Resultado esperado

- Teste em `docs/taskTestingUown/{name}/{name}.spec.ts` ou `tests/api/`
- Import de `@fixtures/test-context.fixture`
- Usa `api.domainClient` (nunca `request` direto)
- Happy path + error cases
- DB persistence validada (quando aplicavel)
- `tsc --noEmit` sem erros
- Relatorio gerado (se taskTestingUown)

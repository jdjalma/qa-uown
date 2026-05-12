# New API Client — Criar API Client

Cria um API client tipado que estende `BaseClient`.

## Trigger

Use this skill when the user asks to create an API client, mentions "client", "API client", or needs to interact with a backend endpoint programmatically.

## Argumentos esperados

- **Nome do client**: ex. `AccountClient`, `SvcPayoffClient`
- **Base path**: ex. `/uown/svc/v1/accounts`
- **Endpoints**: lista de operacoes (GET, POST, PUT, etc.)

Se algum campo estiver faltando, inferir do contexto.

## Protocolo de Execucao

### Fase 0 — TODO List obrigatoria

Antes de qualquer trabalho, crie a TODO list com `TaskCreate` para cada fase. Atualize com `TaskUpdate` ao avancar.

### Fase 1 — Verificar se ja existe

```
Glob: src/api/clients/{name}.client.ts
```

Se ja existe -> analisar e estender em vez de criar novo.

### Fase 2 — Carregar contexto

Ler antes de implementar:
- `.claude/rules/api-clients.md` — BaseClient rules, template
- `.claude/context/project.md` — estrutura API

### Fase 3 — Criar artefatos em paralelo

Invocar em paralelo quando necessario:

```
# Paralelo (independentes)
Agent(subagent-impl-api-client, ...)
Agent(subagent-data, ...)            # se precisar de JSON templates (template mode)
```

Prompt para `subagent-impl-api-client`:

```
Agent(subagent_type="subagent-impl-api-client", prompt="""
Nome: {clientName}
Base path: {basePath}
Endpoints:
  - {METHOD} {path} -> {description}

Response types: {responseFile}
Body types: {bodyFile}
""")
```

### Fase 4 — Verificar compilacao

```bash
npx tsc --noEmit 2>&1 | head -30
```

Se houver erros -> corrigir antes de prosseguir.

### Fase 5 — Atualizar documentacao (OBRIGATORIO)

```
Agent(subagent_type="subagent-docs-update", prompt="""
Novo API client criado: {clientName} em src/api/clients/{name}.client.ts
Endpoints: {list}
Atualizar docs se necessario.
""")
```

## Resultado esperado

- `src/api/clients/{name}.client.ts` — client implementado
- `src/api/clients/index.ts` — barrel export atualizado
- `src/api/responses/{name}.response.ts` — tipos de response (se novo)
- `src/api/bodies/{name}.body.ts` — tipos de body (se novo)
- `tsc --noEmit` sem erros

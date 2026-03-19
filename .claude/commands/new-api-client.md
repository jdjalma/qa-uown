# New API Client — Criar API Client

Cria um API client tipado que estende `BaseClient`.

## Argumentos recebidos:
$ARGUMENTS

---

## REGRA ABSOLUTA: TODO List obrigatória

Antes de qualquer trabalho, crie a TODO list com `TaskCreate` para cada fase. Atualize com `TaskUpdate` ao avançar.

---

## Protocolo de Execução

### Fase 0 — Analisar argumentos

Extrair dos argumentos:
- **Nome do client**: ex. `AccountClient`, `SvcPayoffClient`
- **Base path**: ex. `/uown/svc/v1/accounts`
- **Endpoints**: lista de operações (GET, POST, PUT, etc.)
- **Arquivo de respostas**: ex. `src/api/responses/account.response.ts`
- **Arquivo de bodies**: ex. `src/api/bodies/account.body.ts`

### Fase 1 — Verificar se já existe

```
Glob: src/api/clients/{name}.client.ts
```

Se já existe → analisar e estender em vez de criar novo.

### Fase 2 — Carregar contexto

Ler antes de implementar:
- `.claude/rules/api-clients.md` — BaseClient rules, template
- `.claude/context/architecture.md` — estrutura API

### Fase 3 — Criar artefatos em paralelo

Invocar em paralelo quando necessário:

```
# Paralelo (independentes)
Agent(subagent-impl-api-client, ...)
Agent(subagent-data-template, ...)   # se precisar de JSON templates
```

Prompt para `subagent-impl-api-client`:

```
Agent(subagent_type="subagent-impl-api-client", prompt="""
Nome: {clientName}
Base path: {basePath}
Endpoints:
  - {METHOD} {path} → {description}

Response types: {responseFile}
Body types: {bodyFile}

Contexto adicional:
$ARGUMENTS
""")
```

### Fase 4 — Verificar compilação

```bash
npx tsc --noEmit 2>&1 | head -30
```

Se houver erros → corrigir antes de prosseguir.

### Fase 5 — Atualizar documentação (OBRIGATÓRIO)

```
Agent(subagent_type="subagent-docs-update", prompt="""
Novo API client criado: {clientName} em src/api/clients/{name}.client.ts
Endpoints: {list}
Atualizar docs se necessário.
""")
```

---

## Resultado esperado

- `src/api/clients/{name}.client.ts` — client implementado
- `src/api/clients/index.ts` — barrel export atualizado
- `src/api/responses/{name}.response.ts` — tipos de response (se novo)
- `src/api/bodies/{name}.body.ts` — tipos de body (se novo)
- `tsc --noEmit` sem erros

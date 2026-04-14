# New Page Object — Criar Page Object

Cria um page object seguindo a hierarquia `BasePage > PortalBase > Page`.

## Trigger

Use this skill when the user asks to create a page object, mentions "page object", "PO", or wants to map a portal page for E2E testing.

## Argumentos esperados

- **Portal**: origination | servicing | website | ams
- **Nome da classe**: ex. `MerchantSettingPage`
- **Funcionalidade**: o que a pagina faz

Se algum campo estiver faltando, inferir do contexto.

## Protocolo de Execucao

### Fase 0 — TODO List obrigatoria

Antes de qualquer trabalho, crie a TODO list com `TaskCreate` para cada fase. Atualize com `TaskUpdate` ao avancar.

### Fase 1 — Verificar se ja existe

```
Glob: src/pages/{portal}/{name}.page.ts
```

Se ja existe -> invocar `subagent-refactor-page-object` em vez de criar novo.

### Fase 2 — Carregar contexto

Ler antes de implementar:
- `.claude/rules/page-objects.md` — hierarquia, NEVER/ALWAYS
- `.claude/context/architecture.md` — estrutura do projeto
- `.claude/context/test-patterns.md` — padroes de test

### Fase 3 — Implementar

Invocar `subagent-impl-page-object`:

```
Agent(subagent_type="subagent-impl-page-object", prompt="""
Portal: {portal}
Classe: {className}
Caminho: {filePath}
Funcionalidade: {description}
""")
```

### Fase 4 — Verificar compilacao

```bash
npx tsc --noEmit 2>&1 | head -30
```

Se houver erros -> corrigir antes de prosseguir.

### Fase 5 — Atualizar documentacao (OBRIGATORIO)

Invocar `subagent-docs-update`:

```
Agent(subagent_type="subagent-docs-update", prompt="""
Novo page object criado: {className} em {filePath}
Portal: {portal}
Atualizar shared/e2e-agent-responsibilities.md se necessario.
""")
```

## Resultado esperado

- `src/pages/{portal}/{name}.page.ts` — page object implementado
- `src/pages/{portal}/index.ts` — barrel export atualizado
- `tsc --noEmit` sem erros
- Docs atualizados

# New Page Object — Criar Page Object

Cria um page object seguindo a hierarquia `BasePage > PortalBase > Page`.

## Argumentos recebidos:
$ARGUMENTS

---

## REGRA ABSOLUTA: TODO List obrigatória

Antes de qualquer trabalho, crie a TODO list com `TaskCreate` para cada fase. Atualize com `TaskUpdate` ao avançar.

---

## Protocolo de Execução

### Fase 0 — Analisar argumentos

Extrair dos argumentos:
- **Portal**: origination | servicing | website | ams
- **Nome da classe**: ex. `MerchantSettingPage`
- **Caminho**: ex. `src/pages/origination/merchant-setting.page.ts`
- **Funcionalidade**: o que a página faz

Se algum campo estiver faltando, inferi-lo do contexto.

### Fase 1 — Verificar se já existe

```
Glob: src/pages/{portal}/{name}.page.ts
```

Se já existe → invocar `subagent-refactor-page-object` em vez de criar novo.

### Fase 2 — Carregar contexto

Ler antes de implementar:
- `.claude/rules/page-objects.md` — hierarquia, NEVER/ALWAYS
- `.claude/context/architecture.md` — estrutura do projeto
- `.claude/context/test-patterns.md` — padrões de test

### Fase 3 — Implementar

Invocar `subagent-impl-page-object`:

```
Agent(subagent_type="subagent-impl-page-object", prompt="""
Portal: {portal}
Classe: {className}
Caminho: {filePath}
Funcionalidade: {description}

Contexto adicional dos argumentos:
$ARGUMENTS
""")
```

### Fase 4 — Verificar compilação

```bash
npx tsc --noEmit 2>&1 | head -30
```

Se houver erros → corrigir antes de prosseguir.

### Fase 5 — Atualizar documentação (OBRIGATÓRIO)

Invocar `subagent-docs-update`:

```
Agent(subagent_type="subagent-docs-update", prompt="""
Novo page object criado: {className} em {filePath}
Portal: {portal}
Atualizar shared/e2e-agent-responsibilities.md se necessário.
""")
```

---

## Resultado esperado

- `src/pages/{portal}/{name}.page.ts` — page object implementado
- `src/pages/{portal}/index.ts` — barrel export atualizado
- `tsc --noEmit` sem erros
- Docs atualizados

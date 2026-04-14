# Data Management — Gerenciar Dados de Teste

Gerencia dados de teste: merchants, JSON templates e test accounts.

## Trigger

Use this skill when the user asks to add a merchant, create a JSON template, manage test accounts, mentions "merchant", "template JSON", "request body template", "test account", "save account", "cleanup accounts", or needs to manage test data artifacts.

## Argumentos esperados

Depende do modo:

### Modo merchant
- **Nome**: nome do merchant
- **Numero**: numero do merchant (XXXXX-NNNN)
- **Username/password**: credenciais
- **Tipo**: standard | paytomorrow | paypair

### Modo template
- **Acao**: nome da acao (ex. `sendApplication`, `makePayment`)
- **Campos**: lista de campos do body com placeholders

### Modo accounts
- **Operacao**: save | load | list | cleanup
- **Filtros**: env, status, merchant (para load/list)

## Protocolo de Execucao

### Fase 0 — TODO List obrigatoria

Criar TODO list com `TaskCreate`.

### Fase 1 — Executar

Invocar `subagent-data` com o modo detectado:

```
Agent(subagent_type="subagent-data", prompt="""
Modo: {merchant | template | accounts}

[Merchant]
Nome: {name}, Numero: {number}, Username: {username}
Tipo: {standard | paytomorrow | paypair}

[Template]
Acao: {actionName}
Campos: {fieldList}
Baseado em: {existingTemplate or endpoint spec}

[Accounts]
Operacao: {save | load | list | cleanup}
Filtros: {filters}
""")
```

### Fase 2 — Verificar compilacao

```bash
npx tsc --noEmit 2>&1 | head -30
```

### Fase 3 — Atualizar documentacao (OBRIGATORIO)

```
Agent(subagent_type="subagent-docs-update", prompt="Data: {mode} — {summary}")
```

## Anti-patterns (NUNCA FAZER)

- Merchant duplicado — verificar key E campo `number`
- Hardcode credentials — sempre usar `envOr()`
- snake_case em placeholders de template — sempre `${camelCase}`
- Salvar contas de teste fora de `test-results/` (gitignored)
- Salvar credenciais reais ou PII

## Resultado esperado

### Merchant
- `src/data/merchants.ts` atualizado
- Password em `envOr()`

### Template
- `src/fixtures/api-templates/{actionName}.json` criado
- Placeholders `${camelCase}` consistentes

### Accounts
- Operacao executada em `test-results/test-accounts.json`

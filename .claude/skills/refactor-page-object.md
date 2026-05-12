# Refactor Page Object — Refatorar Page Object Existente

Refatora um page object existente aplicando melhorias de selectors, waiters, dead code e tipagem.

## Trigger

Use this skill when the user asks to refactor a page object, mentions "melhorar PO", "refatorar page object", "cleanup page", "dead code in page", "hardcoded selectors", or wants to improve an existing page object's quality.

## Argumentos esperados

- **Arquivo**: caminho do page object (ex. `src/pages/origination/merchant-setting.page.ts`)
- **Foco**: area especifica de melhoria (se fornecido)

## Protocolo de Execucao

### Fase 0 — TODO List obrigatoria

Criar TODO list com `TaskCreate` para cada fase.

### Fase 1 — Refatorar

Invocar `subagent-page-object` (mode: `refactor`):

```
Agent(subagent_type="subagent-page-object", prompt="""
Arquivo: {filePath}
Foco: {focus}

Prioridades de refatoracao:
1. Hardcoded selectors -> SELECTORS const
2. any -> tipos explicitos
3. Metodos nao usados -> remover
4. Click direto -> waitForSpinner() + click
5. Codigo repetido -> metodo compartilhado
6. Metodo longo -> metodos menores
7. .btn-class -> [data-testid] ou getByRole
""")
```

### Fase 2 — Verificar compilacao

```bash
npx tsc --noEmit 2>&1 | head -30
```

### Fase 3 — Atualizar documentacao (OBRIGATORIO)

```
Agent(subagent_type="subagent-docs-update", prompt="Refactor: {className} — mudancas aplicadas: {summary}")
```

## Resultado esperado

- Selectors centralizados em `SELECTORS`
- Waiters em todos os metodos de interacao
- Dead code removido (confirmado via Grep)
- Tipos explicitos em retornos e parametros
- Testes existentes nao quebrados
- `tsc --noEmit` sem erros

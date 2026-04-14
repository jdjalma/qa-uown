# Audit — Auditar Selectors ou Estrutura

Audita selectors para robustez ou a estrutura `.claude/` para consistencia. Apenas reporta — nao corrige.

## Trigger

Use this skill when the user asks to audit, review, or check: selectors, page objects quality, `.claude/` structure, agent consistency, dead selectors, hardcoded selectors, or mentions "auditar", "revisar selectors", "checar estrutura", "audit".

## Argumentos esperados

- **Modo**: `selectors` | `structure` | `all`
- **Escopo** (opcional): portal, page object, ou dimensao especifica

## Protocolo de Execucao

### Fase 0 — TODO List obrigatoria

Criar TODO list com `TaskCreate` para cada fase.

### Fase 1 — Auditar

Invocar `subagent-audit`:

```
Agent(subagent_type="subagent-audit", prompt="""
Modo: {mode}
Escopo: {scope}

Se selectors:
- Mapear todas as keys de SELECTORS
- Identificar dead selectors (zero referencias)
- Encontrar selectors hardcoded em pages e testes
- Classificar: Critical / Improve / OK / Dead

Se structure:
- Analisar 7 dimensoes: contradicoes, gaps, duplicacoes, ambiguidades, dependencias erradas, escopo mal definido, conteudo stale
- Verificar existencia de arquivos referenciados
""")
```

### Fase 2 — Atualizar documentacao (OBRIGATORIO)

```
Agent(subagent_type="subagent-docs-update", prompt="Audit {mode}: {summary of findings}")
```

## Resultado esperado

### Modo selectors
- Todas as keys SELECTORS mapeadas
- Dead selectors identificados
- Hardcoded selectors em testes e page objects identificados
- Top 3 quick wins listados

### Modo structure
- 7 dimensoes analisadas com achados concretos
- Referencias a arquivos verificadas
- Top 5 fixes priorizados por impacto

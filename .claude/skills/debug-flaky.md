# Debug Flaky — Diagnosticar e Corrigir Teste Flaky

Diagnostica a causa raiz de um teste flaky e implementa a correcao.

## Trigger

Use this skill when the user mentions "flaky", "intermittent", "test failing randomly", "passes on retry", "TimeoutError", "element not found", "strict mode violation", "element intercepted", "DOM detached", or wants to debug a test that fails inconsistently.

## Argumentos esperados

- **Teste**: caminho do arquivo `.spec.ts` ou nome do teste
- **Erro**: mensagem de erro ou stack trace (se disponivel)
- **Contexto**: frequencia da falha, ambiente, se passa no retry

## Protocolo de Execucao

### Fase 0 — TODO List obrigatoria

Criar TODO list com `TaskCreate` para cada fase. Atualizar com `TaskUpdate` ao avancar.

### Fase 1 — Diagnosticar

Invocar `subagent-debug-flaky`:

```
Agent(subagent_type="subagent-debug-flaky", prompt="""
Teste: {testPath}
Erro: {errorMessage}
Contexto: {context}

Analisar:
1. O teste em si
2. Page objects usados
3. Selectors referenciados
4. Artefatos de falha (test-results/, reports/)
5. Classificar causa raiz (race condition, timeout, selector, stale data, spinner, DOM detached, paralelismo, network)
6. Implementar fix
""")
```

### Fase 2 — Verificar compilacao

```bash
npx tsc --noEmit 2>&1 | head -30
```

### Fase 3 — Audit (se causa raiz envolve selectors)

Invocar `subagent-audit` em modo selectors se necessario:

```
Agent(subagent_type="subagent-audit", prompt="selectors audit for {pageObject}")
```

### Fase 4 — Validar (se teste em taskTestingUown)

Se o teste tem relatorio em `docs/taskTestingUown/`:

```
Agent(subagent_type="subagent-validate-results", prompt="Re-executar e atualizar relatorio apos fix")
```

### Fase 5 — Atualizar documentacao (OBRIGATORIO)

```
Agent(subagent_type="subagent-docs-update", prompt="Debug: {testName} — causa raiz: {category}, fix aplicado")
```

## Anti-patterns (NUNCA FAZER)

- `page.waitForTimeout(5000)` como fix — mascara a causa raiz
- Aumentar timeout sem entender por que esta lento
- `test.skip()` sem diagnostico — perde cobertura
- Ignorar screenshots em `test-results/`

## Resultado esperado

- Causa raiz identificada com evidencia
- Categoria classificada
- Fix aplicado (nao workaround)
- `tsc --noEmit` sem erros
- Relatorio atualizado (se taskTestingUown)

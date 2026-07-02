---
last-reviewed: 2026-06-28
last-reviewed-sha: 7805e73
covers:
  - .gitignore
---

# Git Commit

> Claude realiza o staging dos arquivos e executa `git commit`. Antes do staging, Claude prepara o diff: remove referências específicas de tarefas (IDs de tickets, números de issues, comentários inline "adicionado para tarefa X") que ficam obsoletos com o tempo, enquanto preserva cada regra, aprendizado ou pitfall extraído durante o trabalho em sua localização canônica (skill, knowledge-base, docs de pitfalls). O oracle verifica a qualidade da preparação, a correção do commit, a conformidade da mensagem, a ausência de conteúdo sensível e a não-omissão de hooks.

## Critérios de Aceitação

| ID | Critério | Oracle |
|---|---|---|
| AC-01 | Um novo SHA de commit aparece no `git log` após `git commit` concluir | CT-01 |
| AC-02 | A mensagem de commit segue o padrão `type(scope): description` | CT-02 |
| AC-03 | Todos os arquivos pretendidos aparecem em `git show --stat HEAD` e nenhum arquivo não pretendido está incluído | CT-03 |
| AC-04 | Nenhum arquivo sensível (`.env`, `*.pem`, credenciais) está presente no commit | CT-04 |
| AC-05 | `--no-verify` NÃO foi usado — os pre-commit hooks foram executados sem bypass | CT-05 |
| AC-06 | Antes do staging, o diff foi revisado e referências específicas de tarefas (IDs de tickets, números de issues, comentários inline "adicionado para tarefa X") foram removidas do código e docs | CT-06 |
| AC-07 | Qualquer regra, aprendizado ou pitfall extraído durante a tarefa foi persistido em sua localização canônica (pitfall de skill, doc de knowledge-base, ou SKILL.md) antes do commit | CT-07 |

## Cenários

```gherkin
Feature: Git Commit
  As the QA automation system
  In order to persistir mudanças de código com rastreabilidade e sem expor segredos
  Claude must realizar commit apenas dos arquivos pretendidos com uma mensagem conforme e sem bypass de hooks

  Background:
    Given Claude realizou o staging de um conjunto de arquivos usando `git add`

  Scenario: [negativo] CT-06 — O diff contém referências específicas de tarefas que não foram removidas
    Given o diff inclui comentários inline como "// adicionado para tarefa #123", "// fix para issue #456", ou "// TODO: remover após fechar ticket X"
    When `git diff HEAD` é inspecionado antes do push
    Then essas referências aparecem no código ou docs comitados
    And a codebase agora contém comentários que ficarão obsoletos quando a tarefa for encerrada e o contexto for perdido

  Scenario: [negativo] CT-07 — Aprendizado extraído durante a tarefa não foi persistido antes do commit
    Given uma regra ou pitfall não óbvio foi descoberto durante o trabalho (ex: uma validação oculta, um timeout inesperado, um padrão de seletor quebrado)
    When o diff do commit é inspecionado
    Then nenhuma entrada correspondente existe em `.claude/skills/application-lifecycle/references/pitfalls/`, `docs/knowledge-base/`, ou no SKILL.md relevante
    And o aprendizado existe apenas no contexto da conversa e será perdido após o encerramento da sessão

  Scenario: [negativo] CT-04a — O commit inclui um arquivo sensível
    Given um arquivo chamado `.env` ou com extensão `.pem` foi incluído no staging
    When `git show --name-only HEAD` é inspecionado após o commit
    Then o arquivo sensível aparece no diff do commit
    And o commit deve ser revertido antes do push da branch

  Scenario: [negativo] CT-05 — O pre-commit hook foi burlado
    Given o commit foi executado com a flag `--no-verify`
    When o comando Bash usado é inspecionado
    Then `--no-verify` está presente no comando sem autorização explícita do usuário

  Scenario: [negativo] CT-02a — A mensagem de commit não segue a convenção do projeto
    Given um commit foi criado com uma mensagem livre como "fix stuff" ou "updates"
    When `git log -1 --pretty=%s` é inspecionado
    Then a linha de assunto não casa o padrão `type(scope): description`

  Scenario: [positivo] CT-01 — Commit criado com sucesso com um novo SHA
    Given Claude realizou o staging dos arquivos pretendidos
    When `git commit` conclui sem erro
    Then `git log -1 --pretty=%H` exibe um SHA que não existia antes do commit
    And `git status` reporta "nothing to commit, working tree clean"

  Scenario: [positivo] CT-02b — A mensagem de commit segue a convenção do projeto
    Given Claude executou `git commit` com uma mensagem estruturada
    When `git log -1 --pretty=%s` é inspecionado
    Then a linha de assunto casa `type(scope): description` onde o tipo é um de feat, fix, wip, chore, docs, refactor, ou test
    And `git log -1 --pretty=%B` contém o trailer `Co-Authored-By: Claude`

  Scenario: [positivo] CT-03 — O commit contém exatamente os arquivos pretendidos
    Given Claude realizou o staging de um conjunto específico de arquivos antes do commit
    When `git show --stat HEAD` é inspecionado
    Then cada arquivo em staging aparece no output do diff
    And nenhum arquivo fora do conjunto em staging aparece no output do diff

  Scenario: [positivo] CT-04b — O commit não contém arquivos sensíveis
    Given Claude revisou os arquivos em staging antes do commit
    When `git show --name-only HEAD` é inspecionado
    Then nenhum arquivo casando `.env`, `*.pem`, `*credentials*`, ou `*secret*` aparece no output

  Scenario: [positivo] CT-06b — Diff revisado e referências de tarefas removidas antes do staging
    Given o diff continha comentários inline referenciando um ID de tarefa ou número de issue
    When Claude revisa e limpa o diff antes de executar `git add`
    Then `git diff HEAD` não contém padrões como `// .*#\d+`, `// added for task`, `// fix for issue`, ou `// TODO:.*ticket`
    And a intenção do código é expressa por nomenclatura e estrutura, não por anotações específicas de tarefas

  Scenario: [positivo] CT-07b — Conhecimento extraído durante a tarefa está presente no commit
    Given uma regra ou pitfall não óbvio foi descoberto durante o trabalho
    When o diff do commit é inspecionado
    Then uma entrada correspondente aparece em `.claude/skills/application-lifecycle/references/pitfalls/`, `docs/knowledge-base/`, ou no SKILL.md relevante
    And a regra é expressa como uma afirmação reutilizável e sem contexto que agentes futuros podem aplicar sem o contexto original da tarefa
```

## Oracles

> **Verificação de desatualização (executar antes de qualquer Oracle):**
> `git log 7805e73..HEAD -- .gitignore`
> Saída não vazia → prefixar o relatório com `[BDD MAY BE STALE]`.

### Oracle: CT-01 — Commit criado com novo SHA

| Checkpoint | Valor esperado | Como verificar |
|---|---|---|
| Novo SHA no log | Um SHA que não existia antes do commit | `git log -1 --pretty=%H` |
| Working tree limpa | "nothing to commit, working tree clean" | `git status` |
| Contagem de commits aumentou | Contagem anterior + 1 | `git rev-list HEAD --count` |

### Oracle: CT-02a / CT-02b — Mensagem de commit

| Checkpoint | Valor esperado | Como verificar |
|---|---|---|
| Formato da linha de assunto | Casa `^(feat\|fix\|wip\|chore\|docs\|refactor\|test)(\([a-z0-9-]+\))?: .+` | `git log -1 --pretty=%s` |
| Sem ponto final | A linha de assunto não termina com `.` | `git log -1 --pretty=%s` |
| Trailer de co-autor presente | Body contém `Co-Authored-By: Claude` | `git log -1 --pretty=%B` |

### Oracle: CT-03 — O commit contém exatamente os arquivos pretendidos

| Checkpoint | Valor esperado | Como verificar |
|---|---|---|
| Todos os arquivos em staging presentes | Cada arquivo na lista original do `git add` aparece no commit | `git show --stat HEAD` |
| Nenhum arquivo não pretendido | Nenhum arquivo extra fora do conjunto em staging | `git show --name-only HEAD` |

### Oracle: CT-04a / CT-04b — Nenhum arquivo sensível no commit

| Checkpoint | Valor esperado | Como verificar |
|---|---|---|
| Nenhum arquivo `.env` | `.env` ausente do commit | `git show --name-only HEAD \| grep -E '(^\.env$\|\.env\.)' → vazio` |
| Nenhum arquivo PEM / key / credential | Nenhum `*.pem`, `*.key`, `*.cert`, `*credentials*`, `*secret*` | `git show --name-only HEAD \| grep -iE '\.(pem\|key\|cert)$\|credentials\|secret' → vazio` |

### Oracle: CT-05 — Nenhum bypass de hook

| Checkpoint | Valor esperado | Como verificar |
|---|---|---|
| `--no-verify` ausente no comando de commit | Chamada Bash para `git commit` não contém `--no-verify` | Inspecionar chamada Bash no transcript |
| Output do hook presente | Output do terminal de `git commit` exibe execução do hook (sem mensagem "hooks skipped") | Output do terminal de `git commit` |

### Oracle: CT-06 / CT-06b — Referências de tarefas removidas do diff

| Checkpoint | Valor esperado | Como verificar |
|---|---|---|
| Nenhum ID de ticket/issue em comentários | Diff não contém `// .*#\d+`, `// added for task`, `// fix for issue`, `// handles the case from` | `git diff HEAD \| grep -iE '//.*#[0-9]+\|added for task\|fix for issue\|handles the case from'` → vazio |
| Nenhum TODO referenciando um ticket | Nenhum `// TODO:.*ticket`, `// TODO:.*issue`, `// TODO:.*task` no diff | `git diff HEAD \| grep -iE 'TODO.*ticket\|TODO.*issue\|TODO.*task'` → vazio |
| Intenção do código expressa sem contexto de tarefa | Nomenclatura, estrutura e doc canônico (pitfall/KB) carregam o significado — não refs de tarefas inline | Revisão manual do diff |

### Oracle: CT-07 / CT-07b — Conhecimento persistido antes do commit

| Checkpoint | Valor esperado | Como verificar |
|---|---|---|
| Entrada de pitfall presente (se aplicável) | Se uma restrição não óbvia foi encontrada, uma nova entrada numerada existe em `.claude/skills/application-lifecycle/references/pitfalls/` | `git show --name-only HEAD \| grep pitfalls` → não vazio quando pitfall foi adicionado |
| Doc de knowledge-base presente (se aplicável) | Se um comportamento de feature foi descoberto, um doc existe em `docs/knowledge-base/` | `git show --name-only HEAD \| grep knowledge-base` → não vazio quando KB foi atualizado |
| Regra sem contexto específico | A entrada adicionada faz sentido sem ler a tarefa original — sem referência a um ticket específico ou account PK | Ler a entrada de pitfall/KB adicionada |
| Sem fraseado "descoberto durante tarefa X" | A entrada não contém "encontrado na tarefa #", "issue #", ou "durante o trabalho no ticket" | `git diff HEAD \| grep -iE 'found in task|during.*task|issue #|ticket #'` → vazio |

## Matriz de cobertura

| Critério de Aceitação | Cenário(s) | Status |
|---|---|---|
| AC-01 — Novo SHA de commit no log | CT-01: [positivo] Commit criado com novo SHA | Coberto |
| AC-02 — Mensagem segue convenção `type(scope)` | CT-02b: [positivo] Mensagem conforme; CT-02a: [negativo] Mensagem não conforme | Coberto |
| AC-03 — Exatamente os arquivos pretendidos no commit | CT-03: [positivo] Commit contém exatamente os arquivos pretendidos | Coberto |
| AC-04 — Nenhum arquivo sensível | CT-04b: [positivo] Nenhum arquivo sensível; CT-04a: [negativo] Arquivo sensível detectado | Coberto |
| AC-05 — Nenhum bypass de hook | CT-05: [negativo] Hook burlado sem autorização | Coberto |
| AC-06 — Referências de tarefas removidas do diff | CT-06b: [positivo] Referências de tarefas removidas; CT-06: [negativo] Refs de tarefas mantidas no código | Coberto |
| AC-07 — Conhecimento persistido em localização canônica | CT-07b: [positivo] Conhecimento no commit; CT-07: [negativo] Aprendizado não persistido | Coberto |

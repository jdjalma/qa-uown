# BDD Oracles — fonte de verdade da validação (rule #19)

Este diretório é o **contrato de aceite** de cada operação nomeada do projeto. Um *oráculo* é
um arquivo BDD (Gherkin + checkpoints) que define, em linguagem de negócio, o que precisa ser
verdade **depois** de uma operação. Ele é a fonte de verdade da *validação* — não o relatório,
não a memória, não o "rodou sem erro".

> Regida pela **rule #19** do [`CLAUDE.md`](../../CLAUDE.md). Este README é a porta de entrada;
> o registro operacional e os protocolos executáveis vivem em [`_index.md`](_index.md).

## A regra em uma frase

Depois de qualquer ação que muda estado num portal (navegar para uma rota nova, submeter form,
clicar botão que dispara backend, **ou rodar `npx playwright test` num spec que exercita uma
operação registrada**), consulte o [`_index.md`](_index.md) — independente de como o pedido foi
escrito. O resultado cai em um de três caminhos:

| Situação | O que fazer |
|---|---|
| **(a) Operação listada** | Ler o BDD → staleness check → validar **cada** checkpoint → reportar `Oracle: CT-XX — PASS/FAIL` antes de declarar concluído. |
| **(b) Operação NÃO listada** (ad-hoc OU pipeline QA — sem distinção) | **PARA.** Cria o oráculo primeiro (skill `test-scenarios`), registra no `_index.md`, e só então executa e valida. **Nada chega a estado validado sem oráculo.** |
| **(c) Checkpoint FALHA** | Inspeciona o DOM real (rule #15) → checa se os arquivos em `covers` mudaram de propósito → se sim, BDD está stale (atualiza); se não, reporta `[BUG]` (rule #10). Nunca confirma bug sem descartar staleness. |

> O antigo escape "executa e marca `[UNVALIDATED]`" foi **aposentado em 2026-06-27**. Operação não
> listada não é licença para prosseguir sem validação — é o gatilho para criar o oráculo que falta.

## Estrutura do diretório

```
.claude/oracles/
├── README.md            ← este arquivo (orientação humana)
├── _index.md            ← REGISTRO: tabela operação→arquivo + protocolos executáveis
├── login.md             ← um oráculo por operação
├── new-application.md
├── send-application.md
├── prorated-amount.md
├── commit.md
└── push.md
```

- **`_index.md`** é lido pela máquina (e pelo hook). Contém a tabela de operações, as trigger
  keywords, e os três protocolos (não-listada / staleness / checkpoint falha). É a fonte para
  decidir *se* uma operação tem oráculo.
- **`<operação>.md`** é um oráculo individual. É a fonte para decidir *se a operação passou*.

## Anatomia de um oráculo

```markdown
---
last-reviewed: 2026-06-28              # data da última revisão (dispara staleness)
covers:                                # arquivos cuja mudança pode invalidar este BDD
  - src/api/clients/application.client.ts
  - src/pages/origination/customer.page.ts
---

# <Nome da operação>

> Cabeçalho: o que é, justificativa de camada (UI/API/DB, rules #14/#18), pré-condições.

## Critérios de Aceitação        # AC-01..N, cada um apontando para um Oracle (CT-XX)

## Cenários                       # Gherkin Given/When/Then, um Scenario por CT

## Oracles                        # checkpoints verificáveis por CT
  > staleness check embutido (git log --after=<last-reviewed> -- <covers>)
  ### Oracle: CT-01 — ...
  | Checkpoint | Como verificar |

## Notas de fonte primária       # onde cada asserção foi confirmada (código/DB/live)
```

Cada **`### Oracle: CT-XX`** vira uma tabela de checkpoints concretos. Cada **AC** referencia o
CT que o prova. Cada **Scenario** Gherkin termina num checkpoint real (princípio do consequence
oracle — skill `check-points`).

## Padrão de qualidade (não negociável)

O que separa um oráculo útil de um que "passa" sem provar nada:

1. **Específico, não genérico.** Nunca assertar "existe ≥1 entrada do tipo X" — isso casa um
   registro de outro lead, stale ou de erro. Casar a tripla **(tipo + assinatura de conteúdo +
   valor cruzado)**. Contagem por tipo NÃO é checkpoint.
2. **Reconciliar valores conhecidos.** Quando *nós* criamos o dado, temos o esperado: a entrada
   (o que submetemos) e a saída (resposta da API). O oráculo confere o que a UI/DB mostra contra
   esses valores — nome, valor aprovado, **status** — não apenas "carregou".
3. **Aterrar em fonte primária** (rule #16). Toda asserção técnica cita de onde veio: código
   (`src/`), schema (`docs/database-schema.md`), ou observação live datada. Sem fonte → degrada de
   `[CONFIRMED]` para `[HYPOTHESIS]`.
4. **Hierarquia UI → API → DB** (rule #18). Bug visual/render só aparece quando o usuário vê — não
   substituir validação de UI por leitura de log no backend (rule #14).
5. **Classificação conservadora** (rule #10). Falha de checkpoint → DOM-first + descartar staleness
   antes de chamar de `[BUG]`. Falha de infra (token stale, WAF/IP) não é bug de produto.

## Como adicionar um novo oráculo

1. **Crie** `.claude/oracles/<operação>.md` via skill `test-scenarios` (Gherkin a partir da demanda),
   com frontmatter `last-reviewed` + `covers`.
2. **Aterre** os checkpoints na fonte primária (código/schema/live), seguindo o padrão de qualidade
   acima. Rode uma passada de `discovery` (UI→API→DB) se o comportamento for desconhecido.
3. **Registre** no [`_index.md`](_index.md): adicione uma linha com as trigger keywords (inclua os
   nomes de método/endpoint, ex.: `sendApplication`, `POST /uown/los/...`).
4. A operação passa a ser coberta pela rule #19 para todos os agentes.

## Aplicação mecânica (hook)

O hook [`.claude/scripts/verify-bdd-oracle.mjs`](../scripts/verify-bdd-oracle.mjs) (registrado em
`.claude/settings.json`) é o backstop. Em todo `Stop`/`SubagentStop`, se houve interação com portal
(MCP Playwright ou `playwright test` via Bash) ele exige que o `_index.md` tenha sido lido; e se um
arquivo de oráculo foi lido, a saída precisa conter `Oracle:` (PASS/FAIL). Decisões logadas em
`.claude/logs/bdd-oracle-hook.log`. O hook é o piso mecânico; o texto da rule #19 + este padrão são
o teto.

## Operações registradas hoje

`login` · `new-application` · `send-application` · `prorated-amount` · `commit` · `push`
(fonte: [`_index.md`](_index.md) — sempre a referência atual).

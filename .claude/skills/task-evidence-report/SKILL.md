---
name: task-evidence-report
description: Carregue ao FECHAR pipeline de teste (último PASS validado, sem bugs bloqueantes pendentes de re-execução) para gerar `docs/taskTestingUown/{testName}/{testName}-evidence.md` - relatório product-focused que será colado no comentário da tarefa (GitLab/Jira) como evidência de validação QA. NÃO gerar a cada execução intermediária; este artefato é o "carimbo final" do ciclo de validação. Distinto de `{testName}-report.md` (history técnica) - evidence é stakeholder-facing.
disable-model-invocation: true
---

# Task Evidence Report

> Relatório de evidência que vai colado no ticket (GitLab/Jira) ao final do ciclo de validação. Stakeholder-facing - leitor primário é PO/Tech Lead/Dev, não QA.

## ⚠️ Quando gerar

Gerar **uma única vez por ciclo de task**, no momento em que o pipeline fecha:

- Último `qa-validator` PASS já registrado em `{testName}-report.md`.
- Sem bugs bloqueantes pendentes de re-execução (bugs catalogados como OBS/follow-up são aceitos).
- Usuário (ou orquestrador) sinalizou "pipeline fechado", "pronto pra colar no ticket", "final report", ou equivalente.

**NÃO** gerar:
- Após cada execução intermediária - esse é o papel de `{testName}-report.md`.
- Quando ainda há CTs com status PENDING/SKIP por débito de teste não-decidido.
- Como duplicação do report técnico - se o conteúdo é history de execução, vai no `-report.md`, não aqui.

Se já existe `{testName}-evidence.md` na pasta da task, **sobrescrever** com a versão atualizada (não acumular versões).

## ⚠️ Reports = history, não pattern source (regra #16)

Mesmo disclaimer dos demais reports: este arquivo é **registro do ciclo de validação**, não fonte de patterns. Source-tagging permanece obrigatório em toda asserção técnica (taxonomia em [[test-report-standard]] §9).

## Princípios de escrita

1. **Product-focused, não test-mechanic.** Leitor é PO/Dev/TL - quer saber "o ticket está atendido? Sim/não" e "que melhorias foram descobertas?". NÃO listar mecânica de teste no corpo: page object, fixtures, selectors, `page.evaluate`, `page.on('response')`, "snapshot in-vivo", "annotation Playwright", "captura via curl", nomes de funções de helper (`calculateDate`, `buildTestData`, etc), ou qualquer jargão de automação. Em vez de "captura via `page.on('response')` no browser real", escrever "as 4 requisições ao proxy responderam 200". Em vez de "snapshot in-vivo via Playwright annotation", escrever "o loader expôs os campos esperados". Linguagem do produto, não do framework.
2. **Hierarquia visual escalonada.** Leitor que escaneia em 30s deve ver: header + TL;DR + tabela de Cobertura (requisitos × cenários) e já saber a resposta. Leitor que quer aprofundar lê em ordem (Resumo → Cenários → Recomendação) e expande `<details>` em achados longos. NUNCA enfiar conteúdo importante dentro de `<details>` colapsado por default (resumo, classificação, recomendação ficam sempre visíveis).
3. **Tamanho scannable, não linhas absolutas.** Conteúdo visível ao primeiro scroll deve permitir veredito em 30s. Detalhes técnicos vão em `<details>` colapsados, não inflam fadiga. Reports com 5+ achados ou cross-brand longos podem passar de 300 linhas totais sem prejuízo se a estrutura visual mantiver escaneabilidade.
4. **PT-BR.** Apenas valores técnicos (URLs, enums, classes, queries) em forma original.
5. **Source-tagging.** Toda asserção técnica não-trivial referencia evidência primária (leadPk, accountPk, arquivo:linha, query SQL). Sem tag de fonte → degradar para `[HIPÓTESE]` ou `[OBSERVAÇÃO]` (taxonomia em [[test-report-standard]] §9 + regra #10).
6. **Conservative classification (regra #10).** `[CONFIRMADO]` exige fresh repro. Isolated observation em dados pré-existentes = `[OBSERVAÇÃO]` ou `[HIPÓTESE]`.
7. **Veredito em UMA linha** no header. Sem "depende"/"talvez". Se há bloqueador, é Bloquear; se há ressalva mas não bloqueia, é Aprovar com follow-up.
8. **NÃO usar em-dash (`—`).** Em substituição: hífen (`-`), dois-pontos (`:`), parênteses, ou ponto. Aplica também aos cabeçalhos de tabela, índices e bullets. Vale para TODOS os reports gerados (este artefato, `-report.md`, `-spec.md` e qualquer comentário em ticket).
9. **Não repetir o ambiente no corpo.** Env já fica no header (`**Ambiente:** qa1`). NÃO escrever "A validação em qa1...", "O fix funciona em qa1...", "rodou em qa1" no Resumo, Cenários ou Recomendação. Quando precisar referenciar URLs específicas do env nos cenários (ex: `apply-qa1.uownleasing.com`), use a URL técnica direta sem prefixo narrativo "em qa1".
10. **Não usar referências comparativas a MR/PR anterior** (ex: "o bug anterior ao MR !1464", "antes do !XYZ", "a versão antiga"). Descrever o comportamento atual de forma positiva: o que o sistema faz agora, não o que estava quebrado. O MR já está no header; o corpo é sobre o estado validado, não sobre histórico de bugs. Exceção: seção "Resumo" pode mencionar o problema corrigido em termos de produto ("o script de fingerprint não executava"), sem citar número do MR.

## Template

**File path:** `docs/taskTestingUown/{testName}/{testName}-evidence.md`

```markdown
# Validação QA - #{taskId} {taskTitle}

**Ambiente:** {env} (build {YYYY-MM-DD ou MR/commit ref})
**Resultado:** {✅ Aprovado / ⚠️ Aprovado com follow-up / ❌ Bloqueado} **- {1 linha de veredito}**

---

> ### TL;DR
> {1 linha: quantos requisitos confirmados, em quais brands/frequências}.
> {1 linha: observações ou bloqueadores encontrados, ou "Nenhum achado fora do escopo"}.
> **Ação:** {1 frase: aprovar deploy / aguardar fix / discutir com PO}.

---

## Resumo

{1–2 parágrafos curtos em linguagem de negócio:
 - O que o fix/feature faz e qual era o problema original.
 - Funcionou? Em quais brands/frequências/cenários?
 NÃO descrever mecânica de teste aqui. NÃO repetir TL;DR.}

---

## Cobertura: requisitos x cenários

> Tabela de cruzamento entre cada requisito da tarefa + critério de aceite (linha) e o(s) cenário(s) descrito(s) abaixo que validaram esse item (coluna "Cenário(s)"). NÃO usar apenas códigos abreviados (ex: "AC-02", "CT-03") na coluna de cenário, sempre incluir o título completo do cenário para que a tabela seja legível sem precisar voltar ao restante do documento. Source-tag obrigatório onde aplicável (leadPk, accountPk, query SQL, doc:linha).

| # | Requisito + critério de aceite | Cenário(s) que validaram | Status |
|---|--------------------------------|--------------------------|--------|
| R1 | {requisito da tarefa em prose curta, com valor esperado concreto - ex: "IGLOO loader inicializa com shape canônico `version=general5`, `subkey=IOVATION_KEY`"} | "{título completo do cenário que valida}" + source-tag (leadPk=X, accountPk=Y, doc:linha) | ✅ CONFIRMADO / ⚠️ PARCIAL / ❌ FALHOU |
| R2 | {próximo requisito} | "{cenário}" | ✅ |
| ... | ... | ... | ... |

**Quando há OBS/BUG fora do escopo dos requisitos** (melhorias UX, observações cross-cutting, bugs adjacentes descobertos durante validação), listar em seção separada **Observações** mais abaixo (ver template) - NÃO misturar com a tabela de cobertura, que é só sobre requisitos do ticket.

---

## Cenários validados

> Cenários são DESCRITOS em prose (uma sub-seção por requisito). Cada bloco tem heading numerado, badge de status em quote block, descrição prose, e linha de Evidência.

### Requisitos da tarefa

#### 1. {Título descritivo do requisito - 1 linha}

> ✅ **PASSOU** · {onde testado: brand / merchant / URL / frequência}

{1-3 frases descrevendo o que foi testado e o que foi observado. Linguagem de negócio, não mecânica de teste.}

**Evidência:** leadPk={N} / accountPk={N} / merchantCode `OW90218-0001` / log entry / query

#### 2. {Próximo requisito}

> ✅ **PASSOU** · {onde testado}

{idem}

**Evidência:** ...

### Cenários adicionais explorados

> Cobertura além do AC (escopo expandido, edge cases, segurança, regressão dual-brand, mobile-only). Omitir se não houve. Mesma estrutura prose, mais conciso.

#### 7. {Título do cenário extra}

> ⚠️ **Melhoria identificada** · ver [OBS-1](#obs-1)
> (ou `> ✅ **PASSOU**` se não levanta nenhuma observação)

{1-2 frases.}

---

## Observações (não bloqueiam release)

> Omitir esta seção inteira quando não há OBS.

### OBS-1: {Título curto do achado}

> {1 linha de resumo da observação, em prose normal}

<details>
<summary><b>Causa raiz, reprodução e fix proposto</b></summary>

**Causa raiz:** {explicação técnica em 1–3 frases, com referência a arquivo:linha quando aplicável}

**Quando dispara:** {condição mínima de reprodução: frequência, brand, sequência de calls}

**Impacto:** {efeito visível para cliente/agent/integração; severidade real}

**Evidência:** leadPk={N} / accountPk={N} / query / log entry

**Reprodução:**
\`\`\`{sql|ts|js|http}
{snippet mínimo que reproduz - copy-pasteable}
\`\`\`

**Fix proposto:** {opcional, incluir se o achado tem fix óbvio em ≤5 linhas; caso contrário deixar pra dev}

</details>

**Classificação:** {[CONFIRMADO] / [HIPÓTESE] / [OBSERVAÇÃO]}. {Melhoria UX | Performance | Segurança | Observability}

---

## Bloqueadores

> Sempre incluir esta seção, mesmo quando vazia (sinaliza explicitamente "validação não encontrou bloqueador"). Quando há BUG, aplicar a mesma estrutura de OBS, mas com badge `> ❌ **BLOQUEADOR**` no topo.

_Nenhum nesta validação._

---

## Recomendação

> ✅ **{Aprovar deploy QA → Staging / Aprovar com follow-up / Bloquear release}**

- {bullet 1: ponto de cobertura confirmado}
- {bullet 2: regressão coberta}
- {bullet 3: escopo dual-brand / dual-frequência se aplicável}

**Pendências não-bloqueantes:**

- {item 1: link para tarefa-filha se já criada}
- {item 2: recomendação de validação manual ou follow-up}

---
```

### Notas de renderização

- **`<details>`** funciona nativamente no GitLab e no Jira Cloud (markdown comments). Conteúdo dentro segue sendo markdown válido. O `<summary>` é o que fica visível colapsado.
- **Quote blocks** (`>`) com badge no topo de cada requisito dão escaneabilidade visual sem precisar abrir tabela. Funciona em qualquer renderer.
- **TL;DR** dentro de blockquote (`> ### TL;DR`) cria caixa visual destacada; leitor vê veredito antes de qualquer prose.

## Mapeamento dos campos

| Placeholder | Origem |
| --------------------- | --------------------------------------------------------------- |
| `{taskId}` | número GitLab/Jira (ex: 530, 1293) |
| `{taskTitle}` | título curto da issue |
| `{testName}` | mesmo slug usado em `-spec.md`/`-report.md` |
| `{env}` | qa1 / qa2 / stg |

## Checklist antes de fechar o arquivo

- Veredito em UMA linha no header - sem ambiguidade.
- Toda asserção `[CONFIRMADO]` tem leadPk/accountPk/query como fonte primária.
- Cobertura dual-brand (UOWN + Kornerstone) explicitada quando aplicável (regra #4 do QA-flow).
- Activity log validation citada se o fluxo gera log (regra inviolável #13).
- Sem prose per-CT longa - mecânica de teste fica no `-report.md`.
- ≤250 linhas. Acima disso, mover detalhe técnico pro `-report.md`.
- Sem inferência de pattern a partir do `-report.md` - esse arquivo é history, não fonte (regra #16).
- Disclaimer/source-tagging seguindo [[test-report-standard]] §1 + §9.
- Pendências não-bloqueantes com sugestão de follow-up (tarefa-filha / discussão com PO).

## Sinais de "pipeline fechado"

O orquestrador (CLAUDE.md) ou o usuário sinaliza explicitamente um destes:
- "pipeline fechado" / "pronto pra colar no ticket" / "final report" / "evidence final"
- "vou colar no GitLab/Jira agora"
- `qa-validator` reporta último ciclo PASS sem follow-up de re-execução pendente

Sem sinal explícito → NÃO gerar. Em dúvida, perguntar ao usuário.

## Referências cruzadas

- [[test-report-standard]] - formato do `-report.md` (history técnica complementar).
- [[bug-classification]] - taxonomia `[CONFIRMADO] / [HIPÓTESE] / [OBSERVAÇÃO]`.
- [[volatile-knowledge-registry]] - categorias drift-prone exigem source-tag de código fonte.
- Exemplos atuais (consultar como referência de estilo, não de pattern):
 - `docs/taskTestingUown/RU05.26.1.52.0_redirectInvalidOrInactiveApplicationLinks_1293/gitlab-comment.md` (simples, ~70 linhas)
 - `docs/taskTestingUown/RU05.26.1.52.0_settleApplicationFailsWhenNextPayDateMissing_530/gitlab-comment.md` (cross-brand, ~150 linhas)
 - `docs/taskTestingUown/RU05.26.1.52.0_optimizeHighCpuQueriesQuery4_454/gitlab-comment.md` (3 achados técnicos, ~250 linhas)

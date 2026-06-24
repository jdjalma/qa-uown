---
name: acceptance-criteria-review
description: Carregar quando avaliar AC de ticket UOWN (GitLab issue, draft DoR, conversa com PO) — testa cada AC contra Given/When/Then, detecta ACs implícitos faltantes, valida DoR/DoD do time e bloqueia ticket sem AC.
disable-model-invocation: true
---

# Acceptance Criteria Review — destravar (ou travar) o pipeline

> O time de QA UOWN (Yuri/Washington/Lucas/José) acordou: **sem AC explícito, ticket não entra em teste** (`project_qa_task_structure`). Esta skill é a guarda nesse portão.

## Quando aplicar

- skill [[fetch-gitlab-task]] retornou issue do GitLab.
- Usuário pediu "cria a tarefa X" / "abre ticket pra Y" — você está PRODUZINDO o ticket no formato DoR.
- Você está revisando AC que o PO escreveu antes de gerar SPEC.
- AC parecem completos mas você desconfia ("isso aqui é testável?", "como eu sei que passou?").
- Bug ticket sem reprodução fresh: virar bug em AC ("ao reproduzir X em condições Y, sistema deve responder Z").

## Princípios

1. **AC não-testável = AC ausente.** "Sistema deve ser rápido" não é AC.
2. **AC implícito é a maior fonte de retrabalho** (regra inviolável #11 — descobrir requisito durante debug obriga atualização de protocolo).
3. **Given/When/Then não é dogma — é diagnóstico.** Se não consegue formatar um AC em GWT, ele provavelmente está mal definido.
4. **DoR/DoD são contratos, não sugestões** (`project_qa_task_structure`).

## Procedimento

### Passo 1 — Inventário dos AC declarados

Lista cada AC do ticket. Se o ticket não tem seção "AC" explícita, tenta extrair da descrição. Se não houver:

> **HALT.** Devolve para o user com mensagem: "Ticket {id} sem AC explícito. DoR exige AC. Posso (a) bloquear até o PO escrever, ou (b) propor draft de AC com base na descrição para sua revisão. Qual prefere?"

Não inventa AC silenciosamente.

### Passo 2 — Score de testabilidade por AC

Para cada AC, aplica esta rubrica (cada pergunta vale ✓):

| Critério | Pergunta |
|---|---|
| **Observável** | Posso verificar com browser / API / DB / log? Ou é subjetivo ("rápido", "intuitivo")? |
| **Específico** | Há valor concreto? ("processa em <2s", não "rápido") |
| **Estado inicial claro** | O AC diz de que estado parte? (lead pre-qualified? account ativo? agent logado?) |
| **Ação clara** | A ação está descrita em verbo concreto, com inputs? |
| **Resultado mensurável** | O resultado é assert-able? (UI render exato, DB row, response code) |
| **Reversibilidade** | Caso falhe, qual o estado esperado? (mantém AC ou tem AC de error path?) |

Score 6/6 = pronto. Score ≤4 = devolver / refinar. Score 5 com gap claro = propor refinamento e marcar `[REFINADO POR QA]`.

### Passo 3 — Reformat para Given/When/Then

Re-escreve cada AC em GWT:

```
Given <estado inicial concreto, incluindo brand/portal/role/lead state>
And <pré-condições adicionais — merchant config, sql config, feature flag>
When <ação única, com inputs concretos>
Then <resultado observável principal>
And <side-effects esperados — activity log, email, DB row>
```

Se você não consegue preencher um campo sem inventar, o AC tem buraco. Marca o buraco como Open Question.

### Passo 4 — Detectar AC implícitos

AC implícitos mais comuns em UOWN:

| Implícito | Pergunta-gatilho |
|---|---|
| **Activity log** (regra #13) | Que linha em `uown_los_lead_notes` deve aparecer? Conteúdo? |
| **Idempotência** | Se a ação roda 2x, comportamento? (caso `submitApplication` single-flight) |
| **Cross-portal visibility** | A mudança aparece no portal Servicing? Customer Website? Origination? |
| **Email / SMS** | Dispara comunicação? Template? Quando? |
| **Locale/state matrix** | Comportamento muda por state (CA, FL, GA)? |
| **Brand parity** | Funciona em KS3015 igual a UOWN? (`feedback_qa_flow_scope_dual_brand_lease_edit`) |
| **Permissions** | Agent com role X consegue? Customer consegue? |
| **Error path** | Vendor (Kount/SEON/Plaid) retorna erro — comportamento? |
| **Rollback** | Como desfazer? Tem undo? |
| **Audit trail** | Quem fez a ação fica registrado? |
| **Money invariants** | Float repr (`feedback_float_repr_not_bug`) — tolerância especificada? |
| **Feature flag fallback** | Comportamento se SQL config = off? |

Cada implícito ausente vira **AC adicional proposto** (não imposto — devolve ao PO para confirmar).

### Passo 5 — Validar contra DoR

Checklist DoR (do `project_qa_task_structure`):

- [ ] Descrição clara do problema + solução
- [ ] AC explícitos (depois do passo 3)
- [ ] Edge cases mapeados (depois do passo 4)
- [ ] Build deployada (qual env? qa1/qa2/stg?)
- [ ] Dependências externas documentadas (Kount, GowSign etc.)
- [ ] Dev fez teste básico (perguntar se ausente)
- [ ] Mudanças de escopo documentadas
- [ ] T-shirt size (S/M/L) estimado pelo QA — você estima

DoR incompleto → ticket volta. Não testa.

### Passo 6 — Validar contra DoD (para já avisar o que regressão exige)

- [ ] AC vão ser testados em **QA E em Staging**, não só QA
- [ ] Edge cases vão ser cobertos
- [ ] **Regressão nos fluxos impactados** — listar quais fluxos vai regredir
- [ ] Evidências planejadas (print/vídeo/texto conforme tipo)
- [ ] Item vai para Stage Verified

### Passo 7 — Output

Entrega:

```markdown
## AC Review — {task-id}

### AC Inventory
1. AC original: "<texto>"
 - Score testabilidade: X/6
 - Buracos: {lista}
 - Reformat GWT: ...
2. ...

### AC Implícitos Propostos
- [IMPLÍCITO] activity log esperado: ...
- [IMPLÍCITO] dual-brand: ...

### Open Questions para PO
- Q1: ...

### DoR Status
- ✅ Descrição
- ❌ AC explícitos (precisa de refino — ver acima)
- ...

### DoD Antecipado
- Regressão obrigatória: {lista de fluxos}
- Evidências planejadas: {tipo por AC}
- T-shirt size: S | M | L

### Decisão
PROSSEGUIR | BLOQUEAR | PROSSEGUIR COM ASSUNÇÕES MARCADAS
```

## Heurísticas

- **Teste do GWT silencioso**: se você consegue escrever o teste sem ler o AC duas vezes, o AC está bom. Se precisa "interpretar", está ruim.
- **Teste do absurdo**: leia o AC com má-fé. "Sistema deve mostrar mensagem de sucesso" — mostrar QUE mensagem? em QUE lugar? por QUANTO tempo? O que o cliente vê?
- **Cada AC tem 1 verbo principal**. Se tem "e... e... e...", são múltiplos AC mascarados — separa.
- **AC sem assert sobre side-effect é AC parcial.** Se a feature dispara email, AC sem mencionar email é incompleto.
- **Yuri tem palavra final em bug vs melhoria** (`project_qa_task_structure`). Se o AC parece descrever uma melhoria além do bug original, sinaliza — não absorve silenciosamente.

## Output esperado

Documento markdown de 40–120 linhas anexado ao SPEC (ou retornado ao orquestrador como sinal de bloqueio). Sempre termina com `### Decisão` explícita.

## Anti-patterns

- "Vou só assumir que o AC implícito existe" — não, escreve e devolve ao PO.
- Aceitar AC com "deve ser fluido" / "boa UX" / "rápido" — não testável.
- Não estimar t-shirt size porque "é pequeno" — DoR exige.
- Misturar AC com design técnico ("usa endpoint X com payload Y") — o AC é sobre comportamento observável, não implementação.
- Pular o passo 4 (implícitos) — esse é o passo onde a maioria dos bugs futuros nasce.
- Aprovar AC porque "o PO escreveu, deve estar certo" — review é review.

## Referências

- `.claude/rules/testing.md`
- `skill [[qa-domain-reflexes]]`
- `skill [[application-lifecycle]]`
- memory: `project_qa_task_structure`, `feedback_float_repr_not_bug`, `feedback_email_imap_click_link`

---
name: scope-analysis
description: Carregar ANTES de gerar SPEC ou implementar teste de feature/bug nova — quebra a feature em testable units, separa IN/OUT, levanta requisitos implícitos (locales, perms, estados prévios, integrações vendor) e gera perguntas pro PO/dev antes de tocar código.
disable-model-invocation: true
---

# Scope Analysis — pensar como QA Lead antes de testar

> Esta skill troca o reflexo "li o ticket, vou escrever teste" pelo reflexo "li o ticket, sei o que NÃO está dito e onde vai quebrar".

## Quando aplicar

Sinais explícitos de que esta skill é relevante:

- Tarefa nova chegou (skill [[fetch-gitlab-task]] retornou issue do GitLab) e ainda não há SPEC.
- Usuário pediu "cria teste pra X", "testa esse fix", "valida essa feature" — qualquer entrada de pipeline `new-flow`, `new-api`, `qa-flow`.
- Bug report sem reprodução fresh (regra inviolável #10 — antes de classificar bug, mapear escopo).
- Hotfix landed e precisa de regressão (caso GoSign / Daniel's Jewelers CA — escopo real era multi-state, não só o state mudado).
- Refactor que toca handler crítico (`submitApplication`, `MissingDataPanel`, OTP gen) — escopo real é dual-brand + lease-edit, não smoke.

NÃO aplicar quando: já existe SPEC validada e o trabalho é só implementação 1:1 do SPEC.

## Princípios

1. **Escopo declarado ≠ escopo real.** O ticket descreve o feliz; o teste cobre o feliz + os caminhos não-óbvios.
2. **Perguntar antes de testar é mais barato que retestar.** Cada pergunta enviada ao PO/dev no momento da análise economiza um ciclo de "falhou, era requisito implícito".
3. **Cobertura é negociação, não exaustão.** Output desta skill é uma matriz IN/OUT defensável, não uma lista de todos os cenários possíveis.
4. **Toda descoberta de requisito implícito deve virar regra** (CLAUDE.md #12).

## Procedimento

### Passo 1 — Ler o input como skeptic, não como executor

Lê o ticket / pedido e marca:
- O que está **declarado explicitamente** (AC, descrição, screenshots)?
- O que está **assumido tacitamente** (locale = EN-US? portal = Origination? merchant = UOWN? device = desktop?)
- O que está **ausente** (rollback path, error path, perms de role, comportamento se feature flag off)?

Se faltar AC explícito: **bloqueia o pipeline** e devolve ao user pedindo AC (memory `project_qa_task_structure` — sem AC = não testa).

### Passo 2 — Quebrar em testable units

Toda feature decompõe em:

| Camada | Pergunta-guia |
|---|---|
| **Entry points** | Como o usuário/sistema dispara isso? (UI button, API endpoint, scheduled job, webhook vendor) |
| **Inputs** | Quais campos, payloads, estados prévios? Range válido? Range inválido? Vazio? Null? Unicode? |
| **Processamento** | Que código roda? Quais services/DB tables são tocados? Qual o caminho síncrono vs async? |
| **Outputs** | UI render, response shape, DB row, email, activity log (regra #13), webhook outbound, side-effects |
| **Reversão** | Existe undo / cancel / rollback? O que acontece se falhar no meio? |

Para cada unit, anota: já tem cobertura existente? Onde? (Consulta `skill [[page-object-pattern]]`, `helpers-catalog.md`, `api-clients-catalog.md`.)

### Passo 3 — Matriz IN / OUT

Produz duas colunas explícitas:

**IN scope (vou testar):**
- Caminho feliz da AC
- Edge cases mapeados no ticket
- Regressão dos fluxos impactados (DoD — `project_qa_task_structure`)
- Pontos de integração tocados pelo diff

**OUT of scope (não vou testar agora, mas registro):**
- Features adjacentes que dividem código mas não foram alteradas (a menos que regressão exigida — ex: SignWell quando feature é GoSign — `project_gosign_rollout`)
- Locales / brands / portais fora do diff (a menos que dual-brand seja obrigatório — `feedback_qa_flow_scope_dual_brand_lease_edit`)
- Performance / load (a menos que feature seja sobre throughput)

Cada item OUT deve ter justificativa de 1 linha. Se justificativa for "achei que não precisa", devolve pra IN.

### Passo 4 — Hunting list (não-óbvios)

Pergunta-checklist obrigatória, varrendo dimensões que costumam esconder bug no domínio UOWN:

1. **Brands / portais**: feature roda em UOWN e Kornerstone? Customer portal (Website) E Servicing? Origination? AMS?
2. **Merchant config**: depende de checkbox / programa 13m vs 16m vs ambos? Precisa de `merchant-config-contract.ts` preflight? (regra #12)
3. **Estados prévios da lead**: pre-qualified, qualified, leased, signed, funded, charged-off — quais a feature aceita? Recusa? Silenciosamente ignora?
4. **Locales / states**: comportamento muda por state (CA, FL, GA, TX...)? Template de contrato muda? (GoSign vs SignWell por state)
5. **Roles / perms**: customer vs agent vs admin? Agent com role "Approval" vs "Support" vs "Read-Only"?
6. **Device / viewport**: ≥1440px (regra #15 — Bootstrap `d-lg-block`)? Mobile real do customer?
7. **Integrações vendor**: Kount, SEON, Plaid, MX, GowSign, SignWell, Tilled, Repay, EasyPay, DocuSign, Twilio — qual é tocada? Mocked? Tem sandbox?
8. **Timing / async**: scheduled task? Polling? Webhook? Qual o SLA de propagação DB?
9. **Activity log** (regra #13): que linha em `uown_los_lead_notes` deve aparecer? Conteúdo esperado?
10. **Email / SMS**: dispara comunicação? IMAP polling necessário? Template name?
11. **Money / float**: valores monetários no path? Float repr (`18.46` vs `18.459999...` — `feedback_float_repr_not_bug`) precisa de tolerância?
12. **Feature flags / SQL config**: comportamento depende de `uown_sv_sql_config`? Qual key? (`reference_sqlconfig_admin_endpoint`)
13. **Submit idempotência**: path inclui `submitApplication` ou re-submit (lease-edit)? `single-flight ref` precisa resetar entre invoices — double-submit guard obrigatório (`feedback_qa_flow_scope_dual_brand_lease_edit`).

Cada "sim" vira testable unit candidata; cada "não sei" vira pergunta pro PO.

### Passo 5 — Perguntas para PO/dev (antes do SPEC)

Formata como lista enumerada, agrupada por urgência:

**Bloqueadoras** (sem resposta, não escrevo o SPEC):
- AC explícitos faltando
- Contrato de API/payload não documentado
- Comportamento esperado em error path não definido

**Fortes** (vou assumir um default e marcar `[ASSUNÇÃO]`):
- Locale / brand default
- Perm matrix

**Informativas** (sigo, registro a resposta no SPEC):
- Edge cases que descobri além do ticket

### Passo 6 — Output formal

Entrega para o orquestrador / `qa-planner` o seguinte bloco:

```markdown
## Scope Analysis — {task-id}

### Testable Units
1. {unit} — entry: {how}, IN/OUT: IN, justificativa: {why}
2. ...

### IN Scope
- [unit 1] {one-line summary}
- [unit 2] ...

### OUT of Scope
- [adjacent feature] {why not now}

### Non-obvious Requirements (hunting list)
- Brands: {UOWN | KS | both}
- Merchant config: {requires preflight | not applicable}
- Lead state preconditions: {list}
- Locale/state matrix: {list}
- Vendor integrations touched: {list}
- Activity log expected: {table.column = value}
- Money handling: {tolerance needed Y/N}

### Open Questions
**Blockers:**
- Q1: ...
**Strong assumptions:**
- A1: ... (marcando [ASSUNÇÃO])
**Informative:**
- ...

### Recommended Pipeline
new-flow | new-api | new-page-object | debug | qa-flow | ...
```

## Heurísticas

- **"O ticket diz X. O que mais quebra X sem dizer?"** — sempre executa essa pergunta antes de assinar o IN/OUT.
- **Regra dos 3 portais**: se a feature toca lead/lease, pergunta-se "Origination vê? Servicing vê? Website (customer) vê?" — se a resposta é "sim em 2+" mas o ticket só fala 1, é red flag.
- **Regra do hotfix multi-estado**: bug em CA → testa CA + 1 estado representativo de SignWell (regressão) + 1 estado de GoSign (cobertura) — nunca só o estado do bug.
- **Regra do submit handler**: qualquer mudança que toca `submitApplication` exige dual-brand + lease-edit (`feedback_qa_flow_scope_dual_brand_lease_edit`).
- **Regra do "config implícita"**: se a feature depende de SQL config / merchant flag / feature toggle, listar a config como precondition no IN scope. Não confiar em "está ligada hoje".

## Output esperado

Markdown estruturado (template acima) que o orquestrador anexa ao SPEC. Tamanho típico: 30–80 linhas. Se a feature for de 1 linha real (typo fix), o output pode ser proporcionalmente curto — mas as 6 perguntas-checklist devem aparecer mesmo que vazias.

## Anti-patterns (NÃO fazer)

- Escrever teste antes de ter o IN/OUT documentado.
- Aceitar ticket sem AC e "inventar" os AC do nada (memory `project_qa_task_structure`).
- Assumir locale/brand/state default sem registrar como `[ASSUNÇÃO]`.
- Tratar features adjacentes como OUT sem checar se compartilham código com a feature em escopo (caso clássico: submitApplication handler).
- Pular hunting list "porque a feature é pequena" — features pequenas são onde requisitos implícitos mais escondem.
- Misturar análise de escopo com design de cenário (cenário é trabalho do `test-design-techniques` + `risk-based-prioritization`).

## Referências cruzadas

- `.claude/rules/testing.md` § Test Data Hierarchy
- `skill [[qa-domain-reflexes]]`
- `skill [[application-lifecycle]]`
- `docs/user-stories/jornada-completa-lease.md`
- `src/data/merchant-config-contract.ts`
- memory: `project_qa_task_structure`, `feedback_qa_flow_scope_dual_brand_lease_edit`, `project_gosign_rollout`

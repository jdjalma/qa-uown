---
name: risk-based-prioritization
description: Carregar quando há mais cenários candidatos do que tempo para implementá-los — produz top-N priorizado por risco (novelty, integration, boundary, regressão histórica) com justificativa rastreável.
disable-model-invocation: true
---

# Risk-Based Prioritization — testa o que mais pode quebrar primeiro

> Cobertura total é mito. Esta skill devolve uma fila ordenada onde os top-N concentram o risco real.

## Quando aplicar

- Saída do `scope-analysis` tem >5 testable units candidatas e t-shirt size é S/M.
- Pipeline `qa-flow` precisa decidir o que vai pra smoke vs full vs regressão.
- Regressão pós-refactor: o diff toca muita coisa, precisa decidir onde focar.
- Janela de release apertada: o que sai agora vs o que segue pra próxima sprint.
- Bug em prod: priorizar qual reprodução tentar primeiro (caso Daniel's Jewelers CA — `project_gosign_rollout`).

## Princípios

1. **Risco = Probabilidade × Impacto.** Cobertura segue o risco, não o tamanho do diff.
2. **Histórico bate teoria.** Se o módulo já regrediu 3x, ele regride de novo. Memória do projeto vale ouro.
3. **Cliente externo > regressão interna > nice-to-have.** Bug visível ao cliente final pesa mais que bug visível só pra agent.
4. **Justificativa explícita** — cada prioridade tem 1 linha de "porque P0 / porque P3", auditável.

## Dimensões de risco (rubrica)

Para cada cenário candidato, pontuar 0–3 em cada dimensão:

### Probabilidade (de quebrar)
- **N — Novelty (código novo / acabou de mudar)**
  - 0: código intocado há >6 meses
  - 1: refactor cosmético recente
  - 2: lógica alterada na release atual
  - 3: feature nova greenfield
- **I — Integration points**
  - 0: in-process puro
  - 1: 1 DB query
  - 2: 1 vendor externo (Kount, SEON, GowSign, Plaid, Twilio, Tilled, Repay, EasyPay, MX)
  - 3: 2+ vendors ou orquestração assíncrona (webhook + scheduled task)
- **B — Boundary / edge density**
  - 0: input fechado (enum de 2 valores)
  - 1: input com 1 range
  - 2: input com múltiplos ranges (term 13m/16m, money, dates)
  - 3: input livre / unicode / locales / float
- **H — Histórico de bug**
  - 0: módulo limpo
  - 1: 1 bug fechado >6m atrás
  - 2: bug recente (<3 meses)
  - 3: regressão recorrente / hotfix recente (caso GoSign CA — `project_gosign_rollout`)

### Impacto (se quebrar)
- **C — Cliente final atinge?**
  - 0: só agent vê (Origination/Servicing/AMS internos)
  - 1: customer-facing mas reversível
  - 2: customer-facing com efeito financeiro (signing, payment, schedule)
  - 3: customer-facing irreversível ou regulado (lease assinado errado, NACHA, NSF)
- **F — Função crítica de negócio?**
  - 0: cosmético
  - 1: feature secundária
  - 2: feature core (origination, signing, payment)
  - 3: bloqueia revenue (não consegue submit, não consegue assinar, não consegue pagar)
- **A — Audit / compliance?**
  - 0: nada
  - 1: log interno
  - 2: trilha de auditoria de agent
  - 3: legal/regulatório (lease document, NACHA, sanctions, ECOA)

**Score total = (N + I + B + H) × (C + F + A)**

Range: 0 a 108. Bucket sugerido:
- **P0 (crítico):** ≥60 — sempre testa, blocker se falhar
- **P1 (alta):** 30–59 — testa nesta release
- **P2 (média):** 10–29 — testa se houver tempo; caso contrário, próxima
- **P3 (baixa):** <10 — backlog

## Procedimento

### Passo 1 — Receber candidatos

Pega a saída do `scope-analysis` (IN scope + edge cases). Lista cada cenário candidato em 1 linha (ID + descrição curta).

### Passo 2 — Pontuar

Tabela:

| ID | Cenário | N | I | B | H | C | F | A | Score | Bucket |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | submit happy UOWN | 2 | 2 | 1 | 1 | 2 | 3 | 1 | 36 | P1 |
| 2 | submit happy KS | 2 | 2 | 1 | 2 | 2 | 3 | 1 | 42 | P1 |
| 3 | submit lease-edit UOWN | 3 | 2 | 2 | 3 | 2 | 3 | 1 | 60 | P0 |

Justificativa por linha: 1 frase explicando o N e o C dominantes ("3-novelty: handler novo refatorado; 3-customer: dupla submissão gera contrato errado").

### Passo 3 — Validar com histórico de projeto

Antes de fechar, varre:
- `.claude/agent-memory/` — algum agent recente reportou bug nesse módulo?
- `docs/taskTestingUown/*/report.md` — alguma task recente teve fail aqui?
- User memories (`feedback_*`, `project_*`) — algum aprendizado direto do user?

Promove score em +5 se há hit recente. Documenta o hit como justificativa.

### Passo 4 — Aplicar regras de chão

Algumas situações forçam P0 independente do score:

- Toca `submitApplication`, `MissingDataPanel`, Complete page → P0 dual-brand + lease-edit (`feedback_qa_flow_scope_dual_brand_lease_edit`)
- Toca template GoSign de state X → P0 inclui regressão SignWell + diff visual (`project_gosign_rollout`)
- Toca activity log (regra #13) → P0 incluir validação de log
- Toca money flow → P0 incluir tolerância float
- Toca OTP / email → P0 inclui IMAP click-link real (`feedback_email_imap_click_link`)

### Passo 5 — Output

```markdown
## Risk-Based Prioritization — {task-id}

### Top-N (priorizado)
**P0 (must-have):**
1. [score=60] submit lease-edit UOWN — novelty: handler refatorado, customer-facing irreversible
2. [score=60] submit lease-edit KS — paridade brand obrigatória (regra dual-brand)
3. ...

**P1 (should-have):**
4. [score=42] submit happy KS — feature core, sem mudança direta mas merchant config diferente
...

**P2 (nice-to-have, se sobrar):**
...

**P3 (defer):**
...

### Forças aplicadas
- Regra dual-brand (feedback_qa_flow_scope_dual_brand_lease_edit) — promoveu IDs 2 e 4
- Histórico CA template (project_gosign_rollout) — promoveu ID X

### Cobertura escolhida
Vou implementar: P0 + P1 = N cenários. P2/P3 ficam para próxima sprint.
```

## Heurísticas

- **Regra dos 80/20**: top 20% dos cenários por score normalmente capturam 80% do risco. Se você precisa cortar, corta de baixo pra cima.
- **Regra do "se quebrar agora, quem grita?"**: cenário onde o cliente externo nota = sobe; cenário só de agent = mantém; cenário interno de dev = desce.
- **Regra do hotfix**: pós-hotfix em prod, +1 em H para todo o módulo afetado por 30 dias.
- **Regra do "primeira vez"**: se o vendor / integração nunca foi testada nesse path antes, +1 em I.
- **Regra do "feliz mas tem 3 estados prévios"**: caminho feliz com pré-condições obrigatórias é mais frágil que parece — vale checar B.

## Output esperado

Tabela + lista priorizada (template acima). 40–100 linhas. Sempre termina com **Cobertura escolhida** explícita — quais P-buckets entram nesta entrega.

## Anti-patterns

- Priorizar por "ordem do ticket" — ordem do ticket não reflete risco.
- Priorizar por "esse é mais fácil de implementar" — fácil não é risco. Implementar fácil quando ele é P3 e deixar P0 fora.
- Cobertura "total" — se prometeu 100%, está prometendo errado.
- Score sem justificativa de 1 linha — score só vale se é auditável.
- Ignorar memórias de projeto — `feedback_*` e `project_*` são input obrigatório.
- Não promover lease-edit / dual-brand quando aplica — viola regra inviolável.

## Exemplos curtos (domínio UOWN)

### Exemplo 1 — Release com 12 cenários candidatos

Cenários: 4× submit happy (UOWN/KS × 13m/16m), 2× submit error, 2× lease-edit, 2× OTP flows, 2× signing.

Top-5 por score:
1. P0 — submit lease-edit UOWN (H+novelty+customer-facing)
2. P0 — submit lease-edit KS (paridade obrigatória)
3. P0 — signing GoSign CA + SignWell CA diff (hotfix recente CA, `project_gosign_rollout`)
4. P1 — submit happy UOWN 16m (B + F core)
5. P1 — submit happy KS 13m (paridade brand)

Defer pra próxima sprint: OTP reenvio, signing TX (sem mudança direta).

### Exemplo 2 — Bug "Items Purchased coluna sumiu no PDF"

Cenários: validar template afetado + regressão de todos templates ativos.

Aplicação: regra de chão "GoSign template" → P0 para TODOS os templates ativos com diff visual SignWell vs GoSign (Daniel's Jewelers CA mostrou que regressão silenciosa em outro template é alto-impacto). Não testa só CA porque o bug foi em CA — testa CA + CO + estados representativos.

### Exemplo 3 — Refactor de helper de OTP

Cenários: customer recebe OTP em todos os fluxos onde OTP é usado.

Aplicação: 
- N=3 (helper novo)
- I=2 (Twilio + IMAP)
- B=2 (rate-limit boundary + expiração)
- C=2 (customer-facing, financeiro indireto)
- F=2 (bloqueia signing se OTP falhar)

Score alto em todos os fluxos → P0 em pelo menos signing OTP + payment OTP; P1 em login OTP.

## Referências

- `skill [[qa-domain-reflexes]]`
- `skill [[application-lifecycle]]`
- `docs/taskTestingUown/`
- memory: `feedback_qa_flow_scope_dual_brand_lease_edit`, `project_gosign_rollout`

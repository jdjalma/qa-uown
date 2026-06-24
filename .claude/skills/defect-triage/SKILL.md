---
name: defect-triage
description: Carregar ao classificar uma observação durante teste/execução — decide bug vs melhoria vs débito, severity S1-S4 × priority P0-P3, exige fresh repro antes de [CONFIRMADO] (regra inviolável #10). Yuri tem palavra final em disputa.
disable-model-invocation: true
---

# Defect Triage — classificar com rigor antes de reportar

> **Authority boundary** (fronteira de autoridade — `docs/_docs-conventions.md` §7): esta skill cobre **HOW TO TRIAGE** — severity×priority matrix, classification protocol. Para estados e enums de domínio que embasam severity (account states, payment states, funding states), rode `node scripts/docs-tooling.mjs resolve enums` (ou `account-status`, `payments`) ou leia `docs/business-rules/appendix-d-constantes-enums.md` + `appendix-g-cenarios-risco.md`. **Não duplique regras de domínio aqui** — elas driftam.

> Regra inviolável #10: observação isolada em dado pré-existente NÃO é bug. Bug só depois de fresh repro + checagem de issue existente + descarte de artefato.

## Quando aplicar

- Teste falhou ou retornou comportamento inesperado.
- Sessão exploratória produziu `[OBSERVAÇÃO]` / `[HIPÓTESE]` (de `exploratory-heuristics`).
- Customer/agent reportou comportamento estranho.
- Antes de abrir ticket no GitLab ou anotar em report.
- Discordância entre QAs sobre se algo é bug — disputa vai para Yuri (`project_qa_task_structure`).

## Princípios

1. **Linguagem conservadora.** Prefere `[OBSERVAÇÃO]` / `[HIPÓTESE]` a `[CONFIRMADO]` (regra #10).
2. **Reproduz primeiro, classifica depois.** Sem fresh repro, sem `[CONFIRMADO]`.
3. **Sintoma ≠ causa raiz.** Triagem inclui hipótese mínima de causa; não exige debug completo, mas pede mais que "está errado".
4. **Severity × Priority são ortogonais.** Severity = impacto técnico/funcional; Priority = urgência de negócio.
5. **Yuri decide disputa** entre bug / melhoria / débito (`project_qa_task_structure`).
6. **Sem DB mutation pra forçar pass** (`feedback_no_db_mutation_to_force_pass`). Se precondition não existe, skip/timeout é resultado válido — não classifica como bug.

## Procedimento

### Passo 1 — Capturar observação

Formato mínimo:
```
Sintoma: o que vi vs o que esperava
Ambiente: env + browser + viewport + data context
Repro steps: passos exatos
Frequência: 1/1, 1/3, ...?
Evidência: screenshot/log/DB dump
```

### Passo 2 — Aplicar gates da regra #10

Antes de promover para `[CONFIRMADO]`:

- [ ] **Fresh repro:** reproduzido em dados criados agora (não em registro pré-existente cuja história é desconhecida)?
- [ ] **Issue existente:** já há ticket aberto pra isso? (perguntar ao user / buscar GitLab)
- [ ] **Artefato descartado:**
 - Não é flake do framework Playwright (timing local).
 - Não é estado de dado pré-existente (lead em estado X criado em 2025, etc.).
 - Não é env-específico (qa1 outage atual — `project_dv360_uat_qa1_outage_2026_05_18`).
 - Não é config drift de merchant (regra #12).
- [ ] **UI matches expected oracle:** o que o cliente vê é REALMENTE problema? (Float repr `18.4599...` é UX, não bug funcional — `feedback_float_repr_not_bug`).

Se algum item falhou: classificação fica em `[HIPÓTESE]` ou `[OBSERVAÇÃO]`.

### Passo 3 — Classificar tipo

| Tipo | Critério |
|---|---|
| **Bug** | Sistema desvia de AC / spec / oráculo claro. Regressão. |
| **Melhoria** | Sistema cumpre AC, mas UX/perf/clareza poderia ser melhor. |
| **Débito técnico** | Issue conhecido, decidido conscientemente, registrado. |
| **Observação sem ação** | Não é nenhum dos acima — descarta ou registra para sessão futura. |

Disputa: Yuri decide (`project_qa_task_structure`).

### Passo 4 — Severity (técnica/funcional)

| Severity | Critério | Exemplo UOWN |
|---|---|---|
| **S1 — Crítico/Bloqueador** | Bloqueia revenue ou viola compliance/legal | `submitApplication` retorna 500 prod-wide; lease document errado legalmente; NACHA bug |
| **S2 — Alto** | Feature core quebrada com workaround difícil | Signing GoSign CA omite colunas; OTP não chega em 100% dos casos |
| **S3 — Médio** | Bug funcional com workaround viável | Refresh resolve; estados específicos afetados; UI desalinhada |
| **S4 — Cosmético** | Visual, não-funcional, baixo impacto | Float repr feio na tela; spacing; tipografia |

### Passo 5 — Priority (negócio/urgência)

| Priority | Critério | Exemplo |
|---|---|---|
| **P0 — Urgente** | Hotfix agora, paralisa release | Bloqueia revenue ou compliance |
| **P1 — Alta** | Próxima release, blocker do sprint | Feature core afetada, customer-facing |
| **P2 — Média** | Backlog priorizado, próximas releases | Edge case, customer-facing reversível |
| **P3 — Baixa** | Quando der | Cosmético; agent-only menor |

S × P são independentes. S1/P3 não existe na prática; S4/P0 existe (ex: typo legal no PDF que regulador notaria).

### Passo 6 — Sintoma vs causa raiz (hipótese mínima)

Não exige debug completo, mas pelo menos:
- **Sintoma:** o que aparece pro usuário.
- **Hipótese de causa:** "Provavelmente porque {módulo X} não trata {edge Y}." Marca como `[HIPÓTESE]`.
- **Local provável:** arquivo/função/tabela suspeita.

Isto acelera o dev e evita "QA reportou, dev devolveu pedindo mais info".

### Passo 7 — Output formal

```markdown
## Defect Triage — {short-title}

### Classificação
- Tipo: BUG | MELHORIA | DÉBITO TÉCNICO | OBSERVAÇÃO
- Status: [OBSERVAÇÃO] | [HIPÓTESE] | [CONFIRMADO]
- Severity: S1 | S2 | S3 | S4
- Priority: P0 | P1 | P2 | P3

### Sintoma
{1-2 frases — o que se vê vs o que se esperava}

### Repro
- Ambiente: {env, browser, viewport, data}
- Passos: {numerados, do zero}
- Frequência observada: {1/1, 2/3...}
- Fresh data? {sim/não — se não, classifica como HIPÓTESE}

### Oráculo violado (HICCUPPS)
{qual letra justifica chamar de bug}

### Gates de regra #10
- [x] Fresh repro
- [x] Issue existente checado (nenhum encontrado)
- [x] Artefato descartado: flake/env/config/data

### Hipótese de causa
{módulo/arquivo/tabela suspeita}

### Evidência
{paths para screenshots, logs, dumps}

### Recomendação
- Abrir ticket: GitLab issue draft (título + body sugeridos)
- OU: anotar como observação no report sem abrir ticket
- OU: escalar pra Yuri por classificação disputável
```

## Heurísticas

- **"Posso reproduzir do zero em 5min?"** Se não, primeira tarefa é melhorar o repro antes de classificar.
- **"O comportamento atual viola AC explícito?"** Se sim → bug; se não → possivelmente melhoria.
- **"Yuri concordaria que é bug?"** Se há dúvida, escala. Não absorve disputa.
- **"Float feio na UI"** → S4 / P3. Não invente que é bug funcional (`feedback_float_repr_not_bug`).
- **"Activity log ausente"** (regra #13) → bug de implementação, não comportamento aceitável. Mínimo S3.
- **"Customer-facing irreversível"** (lease assinado errado, payment cobrado errado) → S1 ou S2 dependendo do escopo.
- **"Env-específico em qa1 hoje"** → cheque outage (`project_dv360_uat_qa1_outage_2026_05_18`) antes de classificar.

## Quando NÃO abrir ticket

- Falha por env outage conhecido (qa1 sendApplication 500 hoje) — registra observação, não abre ticket.
- Float repr cosmético sem impacto funcional — registra como sugestão de UX.
- Observação que não conseguiu repro fresh — fica como `[HIPÓTESE]` no report, abre ticket SÓ se repro aparecer.
- Comportamento decidido conscientemente como débito técnico — não abre bug, registra no doc de débito.

## Output esperado

Bloco markdown (template acima). 30–80 linhas. Sempre termina com `### Recomendação` explícita.

## Anti-patterns

- Reportar `[CONFIRMADO]` sem fresh repro → viola regra #10.
- Misturar severity com priority como se fossem o mesmo eixo.
- Pular "issue existente" → cria duplicata.
- Inventar causa raiz como se fosse certeza → escreve `[HIPÓTESE]`, dev vai investigar.
- Pedir DB mutation pra "fazer o teste passar" e classificar precondition faltante como bug do sistema (`feedback_no_db_mutation_to_force_pass`).
- Classificar UX feia como S1 — inflate de severity destrói credibilidade.
- Decidir bug vs melhoria sozinho em caso disputável — Yuri decide.

## Exemplos curtos (domínio UOWN)

### Exemplo 1 — "PDF GoSign omite coluna em CA"

- Sintoma: schedule de pagamentos no PDF GoSign CA mostra 3 colunas; SignWell CA mostra 5.
- Fresh repro: sim (lead criada agora, mesma merchant, mesma state).
- Oráculo: History (vs SignWell) + Product (self-consistency).
- Classificação: BUG / `[CONFIRMADO]` / S2 / P0 (customer-facing, financial document, paralisa rollout GoSign).
- Hipótese: template GoSign CA em `gosign-templates` não tem todas as colunas configuradas.
- Recomendação: abrir ticket hotfix; cross-link com `project_gosign_rollout`.

### Exemplo 2 — "Total $18.46 vs schedule sum $18.4599..."

- Sintoma: na UI, total exibido é `$18.46`; soma das parcelas exibida em outro lugar é `$18.459999...`.
- Fresh repro: sim.
- Oráculo: Image (UX feia), não Product (matemática está correta dentro de tolerância float).
- Classificação: MELHORIA / `[CONFIRMADO]` / S4 / P3.
- Hipótese: formatter de currency não aplicado nesse render.
- Recomendação: abrir ticket de melhoria de UX; não bloqueia release.

### Exemplo 3 — "Lead em qa1 não submeteu — 500 Apache HTML"

- Sintoma: `sendApplication` retorna 500 com HTML do Apache.
- Fresh repro: sim, qualquer merchant.
- Gate `[Artefato descartado]`: env outage qa1 conhecido (`project_dv360_uat_qa1_outage_2026_05_18`).
- Classificação: OBSERVAÇÃO (env outage) — não é bug do produto.
- Recomendação: workaround qa2; não abrir ticket; aguardar restauração.

### Exemplo 4 — "Activity log ausente após signing"

- Sintoma: signing completou (UI confirmation, DB lead.status=SIGNED), mas `uown_los_lead_notes` não tem row do tipo SIGNATURE_COMPLETED.
- Fresh repro: sim.
- Oráculo: Claims (regra #13 do projeto — sem log = nada aconteceu).
- Classificação: BUG / `[CONFIRMADO]` / S3 / P1.
- Hipótese: handler de signing completed não está chamando `addLeadNote`.
- Recomendação: abrir ticket; impactos: audit, customer support, regression.

### Exemplo 5 — "KS3015 não aceita 16m"

Antes de classificar bug, lembrar `feedback_16m_eligibility_merchant_config` — 16m depende de merchant config, não de brand. Checar `uown_merchant_program(merchant_id, term_in_months=16, is_active=true)`. Se ausente, é config drift (regra #12) ou esperado — não bug.

### Exemplo 6 — "Submit double-fire em lease-edit"

- Sintoma: customer reabre Complete page após invoice edit; submit dispara 2x `submitApplication`.
- Fresh repro: sim (`feedback_qa_flow_scope_dual_brand_lease_edit` — single-flight ref persistiu).
- Oráculo: Product (idempotência esperada) + Image (cria 2 contratos).
- Classificação: BUG / `[CONFIRMADO]` / S2 / P0.
- Hipótese: `useRef` no MissingDataPanel não resetando entre invoices.
- Recomendação: hotfix; regressão dual-brand obrigatória.

## Referências

- `skill [[bug-classification]]`
- `skill [[qa-domain-reflexes]]`
- memory: `project_qa_task_structure`, `feedback_float_repr_not_bug`, `feedback_no_db_mutation_to_force_pass`, `project_dv360_uat_qa1_outage_2026_05_18`, `project_gosign_rollout`, `feedback_qa_flow_scope_dual_brand_lease_edit`, `feedback_16m_eligibility_merchant_config`

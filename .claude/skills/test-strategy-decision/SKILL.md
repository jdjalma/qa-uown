---
name: test-strategy-decision
description: Carregar antes de escolher como implementar cada cenário — decide E2E vs API vs híbrido vs DB-only, smoke vs full, paralelização e ambiente (sandbox/qa1/qa2/stg). Aplica a regra inviolável #14 (UI-first).
disable-model-invocation: true
---

# Test Strategy Decision — escolher o nível certo de teste

> **Authority boundary** (fronteira de autoridade — `docs/_docs-conventions.md` §7): esta skill cobre **HOW TO CHOOSE** — E2E vs API vs híbrido, smoke vs full, ambiente, paralelização. Para **nomes canônicos de portais** (Website/Servicing/Origination/AMS) rode `node scripts/docs-tooling.mjs resolve customer-portal` ou leia `docs/business-rules/01-fundamentos.md` (portal naming está em [[volatile-knowledge-registry]] — cross-check obrigatório). Para **env URLs, variáveis e timeouts**, leia `docs/claude/environments.md`. **Não duplique configuração de env aqui** — ela drifta.

> Regra inviolável #14 do projeto: feature com UI affordance OBRIGA browser test. API-only é exceção, não default.

## Quando aplicar

- Pós `scope-analysis` + `risk-based-prioritization`, antes do SPEC.
- Você está tentado a escrever API-only "porque é mais rápido" — pare aqui.
- Vai escolher ambiente: sandbox? qa1? qa2? stg? (cada um tem trade-offs)
- Vai decidir paralelização (`test.describe.parallel`, `workers`, sharding).
- Pipeline `qa-flow` precisa definir smoke vs full antes do CI.

## Princípios

1. **UI-first como default** (regra #14). API-only só com justificativa escrita.
2. **Nível de teste = onde o risco mora.** Risco visual → UI. Risco contratual → API. Risco de invariante → DB.
3. **Híbrido é regra, não exceção.** Setup via API + assertion via UI é o padrão UOWN (cria lead via `sendApplication`, exerce signing via browser).
4. **Ambiente importa.** Sandbox = isolado; qa1 = compartilhado; qa2 = compartilhado mais estável; stg = pré-prod, fonte da verdade para DoD.

## Procedimento

### Passo 1 — Decidir o nível (UI / API / DB / híbrido)

Pergunta-checklist por cenário:

| Pergunta | Se SIM → |
|---|---|
| A feature tem botão / página / fluxo no portal (Origination/Servicing/Website/AMS)? | UI obrigatório (regra #14) |
| O bug histórico foi sobre rendering visual (placeholders, PDF, badges, layout)? | UI obrigatório (caso Daniel's Jewelers) |
| Existe assertion que só faz sentido via UI (PDF preview, GowSign iframe, toast text)? | UI obrigatório |
| A operação é admin/ops sem UI exposta (PATCH gowsign-templates, sweep scheduled task, internal CRUD)? | API-only OK |
| Setup é caro via UI (criar lead, propagar a um estado)? | API para setup + UI para assertion (híbrido) |
| Assertion cross-cutting (validar invariante em N rows, agregação de schedule)? | DB para assertion |
| Activity log esperado (regra #13)? | DB assertion obrigatória (`uown_los_lead_notes`) |

Regra de bolso (decision tree):

```
[Feature tem UI?]
├── SIM
│ ├── [Setup caro?]
│ │ ├── SIM → híbrido (API setup + UI exercise + DB assert)
│ │ └── NÃO → UI puro (UI exercise + DB assert)
│ └── (UI obrigatório no caminho do cliente)
└── NÃO
 ├── [Endpoint admin/sweep?]
 │ ├── SIM → API-only (justifica em 1 linha)
 │ └── NÃO → reconsiderar — talvez exista UI escondida
 └── (API-only com DB assert)
```

### Passo 2 — Setup vs Exercise vs Assertion (separar)

Para cada cenário, declara 3 fases:

- **Setup** (precondition): mais rápido possível. API `sendApplication`, helpers como `createPreQualifiedApplication`, factories. Não exerce o que está sob teste.
- **Exercise** (the thing under test): respeita regra #14 — se tem UI, exerce UI.
- **Assertion** (oracle): UI render + DB row + log + email/SMS quando aplicável. Activity log assertion não é opcional (regra #13).

Exemplo:
```
Setup: API sendApplication (UOWN happy path) → lead em PRE_QUALIFIED
Exercise: UI Origination → completar Personal Info → submit
Assertion: UI mostra confirmação + uown_los_lead.status = QUALIFIED + uown_los_lead_notes(note_type=PERSONAL_INFO_SUBMITTED)
```

### Passo 3 — Decidir smoke vs full

Smoke (≤10min, blocker no merge):
- 1 cenário P0 happy path por brand
- 1 cenário de erro principal
- Sem regressão profunda

Full (rodando em scheduled / pre-release):
- Todos P0 + P1
- Regressão dos fluxos impactados (DoD)
- Diff visual quando aplicável (GoSign vs SignWell)

Decide explicitamente: **este cenário entra em smoke ou só em full?**

### Passo 4 — Escolher ambiente

| Ambiente | Quando usar | Quando NÃO usar |
|---|---|---|
| **sandbox** (default) | Dev local, debug rápido, dados sintéticos próprios | Quando precisa de config compartilhada (vendor real, IMAP) |
| **qa1** | Testes contra primeiro env compartilhado | Quando outage conhecido (`project_dv360_uat_qa1_outage_2026_05_18` — sendApplication 500 em qa1) |
| **qa2** | Testes mais estáveis, env preferido para validação | OK como default quando qa1 instável |
| **stg** | Validação final, DoD exige (`project_qa_task_structure` — DoD = QA + Staging) | Não rodar testes destrutivos de exploração |
| **dev1/2/3** | Quando dev específico está iterando | Estado imprevisível, não confiar para report |

Regra de chão: **DoD exige stg**. Quem fecha task só com qa não atende DoD.

### Passo 5 — Paralelização

| Cenário | Paralelizar? |
|---|---|
| Cenários compartilham mesma lead/account | NÃO — serialize |
| Cenários compartilham merchant com config drift potencial | NÃO — ou usa `skipMerchantPreflight` (regra #12) |
| Cenários usam IMAP inbox compartilhado (`fintechgroup777@gmail.com`) | SIM com plus-addressing por `runId` (`reference_imap_fintechgroup777`) |
| Cenários independentes com dados fresh | SIM |
| CI com workers limitados | Configurar `workers: N` baseado em projeto (PW projects em `docs/claude/environments.md`) |

Default Playwright: `fullyParallel: true` quando dados são fresh. Marca `test.describe.serial` se houver shared state.

### Passo 6 — Output

```markdown
## Test Strategy — {task-id}

### Cenário 1: {nome}
- Nível: UI puro | API-only | híbrido | DB-only
- Justificativa nível: ...
- Setup: ... (caminho rápido, sem exercer o que está sob teste)
- Exercise: ... (respeita UI-first)
- Assertion: UI: ... | DB: ... | Activity log: ... | Email: ...
- Smoke ou full: smoke | full
- Ambiente recomendado: qa2 (e stg para DoD)
- Paralelização: sim/não — justificativa

### Cenário 2: ...

### Decisões globais
- Smoke set: cenários {ids}
- Full set: todos
- Workers/sharding: ...
- Ambientes da run: qa2 (primary) + stg (validação DoD)
```

## Heurísticas

- **"Se o cliente vê, o teste exerce o que ele vê."** Validar via UI render, não só via log.
- **"PDF / iframe / placeholder → UI obrigatório."** Caso Daniel's Jewelers CA fechou essa porta: API-only que lia log perdeu coluna sumida no PDF.
- **"Setup é UI quando setup É a feature."** Se o que está sob teste é o new-application, não cria lead via API — cria via UI (`feedback_setup_via_ui_new_application`).
- **"Email = IMAP + click no link."** Não pega URL do payload da API (`feedback_email_imap_click_link`).
- **"Stg ou nada"** — sem rodar em stg, DoD não fechou.
- **"qa1 hoje pode estar fora"** — verificar `project_dv360_uat_qa1_outage_2026_05_18`; se outage ativo, fallback qa2.
- **"Helpers existentes primeiro"** — antes de criar novo helper, consultar `skill [[helpers-catalog]]`.

## Output esperado

Bloco markdown estruturado por cenário (template acima). Tamanho proporcional ao número de cenários. Sempre termina com **Decisões globais**.

## Anti-patterns

- API-only "porque é mais rápido" quando a feature tem UI — viola regra #14.
- Setup via UI quando setup não é a feature (e o caminho UI é caro / flake-prone).
- Skip do stg "porque qa passou" — DoD violado.
- Paralelizar cenários que compartilham merchant sem cuidado de preflight — drift de config gera flake.
- Rodar testes em dev1/2/3 e reportar como evidência DoD — dev é instável.
- Misturar Setup/Exercise/Assertion em uma única chamada borrando o que está sob teste.
- Implementar smoke pesado (≥30min) — smoke é blocker rápido; pesado vira full.

## Referências

- `.claude/rules/testing.md` § UI-First Principle
- `docs/claude/environments.md`
- `skill [[helpers-catalog]]`
- `skill [[api-client-pattern]]`
- memory: `feedback_setup_via_ui_new_application`, `feedback_email_imap_click_link`, `project_dv360_uat_qa1_outage_2026_05_18`, `reference_imap_fintechgroup777`

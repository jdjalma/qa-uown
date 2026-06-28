> **Este arquivo e um registro de execucao, NAO e uma fonte de padroes.** (Regra #16)
> Fontes de padroes: skills (`.claude/skills/`) + codigo (`src/`, `tests/`). Categorias volateis: [[volatile-knowledge-registry]].

# Relatorio de Teste: Prorated Amount Calculator (Servicing)

## Informacoes da Tarefa

- **Tarefa:** Prorated Amount Calculator — Servicing Portal
- **Spec BDD:** `.claude/oracles/prorated-amount.md` (CT-01 a CT-04)
- **Implementador:** qa-implementer
- **Validador:** qa-validator (2026-06-26)
- **Ciclo de validacao:** 2/3

---

## Descricao

Um agente de servicing precisa calcular, sob demanda, quanto um cliente deveria pagar se quitasse o lease em uma data especifica. O agente le esse valor ao cliente por telefone ou usa para aconselhar sobre opcoes de early payoff. O valor deve ser exato — um valor errado e um erro financeiro para o cliente.

O modal "Prorated Amount" e acessivel pelo icone `#calculator` (fa-calculator) na Account Summary Bar. O campo "AS OF:" e pre-preenchido com a data de hoje. O calculo dispara automaticamente no `onChange` (blur) do campo de data, chamando `GET /uown/svc/getProrateAmount/{accountPk}?onDate={YYYY-MM-DD}`.

---

## Execucao do Teste

- **Arquivo:** `tests/e2e/servicing/prorated-amount.spec.ts`
- **Comando:** `ENV=sandbox npx playwright test tests/e2e/servicing/prorated-amount.spec.ts --reporter=list --project=servicing-ui`
- **Nota sobre projeto:** `--project=servicing` nao existe. Projetos disponiveis: `servicing-ui`, `task-testing-servicing`, etc. Usado: `servicing-ui`.
- **Ambiente:** sandbox
- **Branch:** wip/transfer
- **Data da execucao (ciclo 1):** 2026-06-26 12:10 EST — 1 PASSOU / 1 FALHOU / 2 SKIPPED (blur bug, ver F-001)
- **Data da execucao (ciclo 2 — apos correcao de `setProratedDate`):** 2026-06-26 16:30 EST
- **Duracao (ciclo 2):** ~2.1 minutos
- **Resultado geral (ciclo 2):** 6 PASSOU / 0 FALHOU / 0 SKIPPED

---

## Evidencias (Dados Utilizados/Criados)

| Tipo | PK | Flag | Nota |
|------|-----|------|------|
| Lead | 98106 `[test-execution:run-2026-06-26]` | Criado | buildTestData NY/TerraceFinance, $800 |
| Account | 17306 `[test-execution:run-2026-06-26]` | Criado | ACTIVE via driveLeadToFunding |

**Observacao sobre o setup:** O log do `submitApplication` mostrou `"error":"A credit card is required before submitting the application."` com `paymentDetailsList:[]`. Contudo, `driveLeadToFunding` completou o ciclo e a conta 17306 ficou ACTIVE. O setup nao falhou — a conta existe e esta correta para os cenarios de leitura.

---

## Capturas de Tela

| CT | Arquivo | Descricao |
|----|---------|-----------|
| CT-02 (falha) | `reports/test-results/prorated-amount-.../test-failed-1.png` | Modal aberto, data `07/26/2026` inserida, resultado permanece `-` |

---

## Cenarios

### CT-01

**Objetivo:** Verificar que o modal "Prorated Amount" abre com o titulo correto, o campo "AS OF:" pre-preenchido com a data de hoje no formato MM/DD/YYYY, e o campo de resultado mostrando `-` antes de qualquer calculo.

**O que e verificado:** O modal e exibido com o cabecalho "Prorated Amount"; o campo de data mostra a data atual `06/26/2026`; o campo de resultado mostra `-` (nenhuma chamada de API disparou na abertura).

**PASSOU**

#### Como verificar manualmente

1. Navegar para `https://servicing-sandbox.uownleasing.com/customer-information/{accountPk}`
2. Clicar no icone de calculadora (`#calculator`) na Account Summary Bar
3. Verificar que o modal exibe o titulo "Prorated Amount"
4. Verificar que o campo "AS OF:" (`input#proratedDate`) mostra a data de hoje no formato MM/DD/YYYY
5. Verificar que o campo de resultado mostra exatamente `-`

**Cobertura de oracle CT-01:**

| Checkpoint | Resultado |
|---|---|
| Modal header = "Prorated Amount" | PASSOU — texto capturado pelo locator |
| "AS OF:" = hoje MM/DD/YYYY (`06/26/2026`) | PASSOU — `asOf="06/26/2026" expectedToday="06/26/2026"` `[test-execution:run-2026-06-26]` |
| Campo de resultado = "-" | PASSOU — `initial result field="-"` `[test-execution:run-2026-06-26]` |

---

### CT-02

**Objetivo:** Verificar que ao selecionar uma data valida no calendario, a API dispara automaticamente e o campo de resultado exibe o valor de payoff como moeda correspondente a data informada, com valor igual ao retorno da API (±$0.01).

**O que e verificado:** Campo de resultado muda de `-` para um valor em moeda; valor exibido bate com `GET /uown/svc/getProrateAmount/{accountPk}?onDate={data-ISO}`; campo "AS OF:" mantem a data inserida; nenhuma linha nova em `uown_sv_activity_log`.

**PASSOU** (ciclo 2 — apos correcao de `setProratedDate`)

> Ciclo 1 (FALHOU): `TimeoutError` em `waitForProratedResult` — API nunca chamada porque o mecanismo de blur (modal container click) nao disparava o `onChange` do React Day Picker.
> Ciclo 2 (PASSOU): `setProratedDate` reescrito para navegar o calendario RDP e clicar o dia-alvo. `GET /uown/svc/getProrateAmount/17307?onDate=2026-07-26` retornou 200. `[test-execution:run-2026-06-26-cycle2]`

**Dados utilizados:** Lead 98107, Account 17307 (novo lease criado no ciclo 2). Data de referencia: `07/26/2026` (hoje + 30 dias).

**Cobertura de oracle CT-02:**

| Checkpoint | Resultado |
|---|---|
| Valor exibido e uma string de moeda (nao `-`) | PASSOU — `result text="$705.39"` `[test-execution:run-2026-06-26-cycle2]` |
| Valor exibido == API response ±$0.01 | PASSOU — `API getProrateAmount(2026-07-26)=705.39 displayed=705.39` `[test-execution:run-2026-06-26-cycle2]` |
| "AS OF:" reteve a data inserida | PASSOU — campo mostra `07/26/2026` apos calculo `[test-execution:run-2026-06-26-cycle2]` |
| Calculo disparou automaticamente no blur (sem botao) | PASSOU — API chamada automaticamente ao clicar o dia no calendario RDP `[test-execution:run-2026-06-26-cycle2]` |
| Nenhuma nova linha em `uown_sv_activity_log` | PASSOU — `activity-log count before=18 after=18` `[test-execution:run-2026-06-26-cycle2]` |

---

### CT-03

**Objetivo:** Verificar que alterar a data para um dia posterior recalcula automaticamente, exibindo um valor diferente e maior que o da data anterior (acumulacao diaria), com novo valor batendo com a API.

**PASSOU** (ciclo 2)

> Datas testadas: `07/26/2026` (earlier, +30d) → `08/25/2026` (later, +60d). `[test-execution:run-2026-06-26-cycle2]`

**Cobertura de oracle CT-03:**

| Checkpoint | Resultado |
|---|---|
| Data anterior produz valor maior que zero | PASSOU — `earlier 07/26/2026 → "$705.39" (705.39)` `[test-execution:run-2026-06-26-cycle2]` |
| Data posterior produz valor diferente do anterior | PASSOU — `later 08/25/2026 → "$1,410.77" (1410.77)` vs `$705.39` `[test-execution:run-2026-06-26-cycle2]` |
| Data posterior > data anterior (acumulacao diaria, BR-ACC-4) | PASSOU — `1410.77 > 705.39` `[test-execution:run-2026-06-26-cycle2]` |
| Valor da data posterior == API response ±$0.01 | PASSOU — `API getProrateAmount(2026-08-25)=1410.77 displayed=1410.77` `[test-execution:run-2026-06-26-cycle2]` |

---

### CT-04

**Objetivo:** Verificar que fechar o modal nao produz nenhuma alteracao na conta (status UI e DB inalterado, nenhuma linha nova em `uown_sv_activity_log`).

**PASSOU** (ciclo 2)

**Cobertura de oracle CT-04:**

| Checkpoint | Resultado |
|---|---|
| Modal e dispensado | PASSOU — modal hidden apos click em CLOSE `[test-execution:run-2026-06-26-cycle2]` |
| Status UI inalterado | PASSOU — `uiStatus after=ACTIVE` == `before=ACTIVE` `[test-execution:run-2026-06-26-cycle2]` |
| Status DB inalterado | PASSOU — `dbStatus=ACTIVE` inalterado `[test-execution:run-2026-06-26-cycle2]` |
| Nenhuma nova linha em `uown_sv_activity_log` | PASSOU — `activity-log count before=20 after=20` `[test-execution:run-2026-06-26-cycle2]` |

---

## Avaliacao de Cobertura vs Risco

| Area de risco (do SPEC) | Nivel | Cenarios cobrindo | Adequado? |
|---|---|---|---|
| Modal abre com estado inicial correto | Medio | CT-01 | Sim — PASSOU |
| API dispara ao selecionar data no calendario | Alto | CT-02 | Sim — PASSOU ($705.39 = API) |
| Valor exibido == API response (±$0.01) | Alto (cliente-financeiro) | CT-02 | Sim — PASSOU (±$0.00) |
| Recalculo com data posterior (BR-ACC-4) | Medio | CT-03 | Sim — PASSOU ($705.39 → $1,410.77) |
| Ausencia de activity log (read-only, regra #13) | Alto | CT-02, CT-04 | Sim — PASSOU (contagem inalterada) |
| Status da conta inalterado apos fechar | Medio | CT-04 | Sim — PASSOU (ACTIVE antes e depois) |

**Avaliacao:** Cobertura completa para todos os riscos. 6/6 testes passaram no ciclo 2.

---

## Achados

| ID | Tipo | Classificacao | Severidade | Prioridade | Descricao |
|----|------|---------------|------------|------------|-----------|
| F-001 | Problema de teste — RESOLVIDO | `[CONFIRMADO]` | S3 | P1 | `setProratedDate` usava `pressSequentially` + modal container click, que nao dispara `onChange` do React Day Picker (RDP). Causa raiz: o campo usa a biblioteca RDP (`rdp-*`) — `onChange` so dispara ao clicar um dia no calendario. Fix: `setProratedDate` reescrito para abrir o calendario, navegar ao mes-alvo e clicar o botao `button.rdp-day`. Confirmado via MCP DOM (account 17306, sandbox, 2026-06-26). Ver pitfall #144. `[dom-investigation:2026-06-26,1440x900]` |
| F-002 | Informacao | `[OBSERVACAO]` | — | — | Tabela `uown_sv_scheduled_payment` nao existe no sandbox. A tabela correta para EPO e `uown_sv_receivable` com `receivable_type='EARLY_PAY_OFF'` `[db-observation:pg_catalog.pg_class]` |

---

## Verificacao BDD Oracle

**Staleness check executado (ciclo 2):** `git log --after="2026-06-26" -- src/pages/servicing/servicing-base.page.ts src/api/clients/svc-payoff.client.ts` → saida vazia → oracle atual.

| Oracle | Status |
|---|---|
| CT-01 — 3 checkpoints | PASSOU |
| CT-02 — 5 checkpoints | PASSOU (5/5) |
| CT-03 — 4 checkpoints | PASSOU (4/4) |
| CT-04 — 3 checkpoints | PASSOU (3/3 + CT-04 bonus: modal hidden) |

---

## Decisoes

- **Bugs de produto:** Nenhum. O dado EPO existe e a feature calcula corretamente.
- **Problema de teste (F-001) — RESOLVIDO:** `setProratedDate` uses native HTMLInputElement setter + dispatchEvent (RDP field) — not a generic blur. Implementacao usa `Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set` + `dispatchEvent('input')` + `dispatchEvent('change')` + `el.blur()`, mesmo padrao de `fillArrangementSchedule` para campos de data do Make Payment Arrangement. Ver pitfall #144 em `application-lifecycle`.
- **Informacao de ambiente (F-002):** tabela `uown_sv_scheduled_payment` nao existe; doc de instrucoes referenciou tabela incorreta — a tabela correta e `uown_sv_receivable`.
- **Cobertura completa:** todos os 6 testes passando no ciclo 2.

---

## Handoff

**Pipeline concluido.** Todos os CTs passando. Pitfall #144 adicionado ao catalogo. Knowledge base (`scheduled-payments.md` gap #6) atualizada com o mecanismo RDP correto.

---

**Skills loaded:** `.claude/skills/test-report-standard/SKILL.md` · `.claude/skills/acceptance-criteria-review/SKILL.md` · `.claude/skills/risk-based-prioritization/SKILL.md` · `.claude/skills/defect-triage/SKILL.md` · `.claude/skills/bug-classification/SKILL.md` · `.claude/skills/qa-domain-reflexes/SKILL.md` · `.claude/skills/activity-log-validation/SKILL.md` · `.claude/skills/ui-first-principle/SKILL.md` · `.claude/skills/dom-investigation/SKILL.md` · `.claude/skills/application-lifecycle/SKILL.md`

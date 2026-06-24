# Execution Plan — DRY / Reuse / Best-Practices no código gerado pelos agents

> **Status:** Tier 0 + Tier 1.1/1.2 + Cross-cutting **CONCLUÍDOS** (2026-06-23); Tiers 1.3/2/3 pendentes · **Owner inicial:** orquestrador (CLAUDE.md)
> **Objetivo:** fazer o código que os agents geram ser DRY e seguir best-practices — atacando as **causas de raiz**, não só os sintomas.
> Este arquivo é o plano vivo. Atualizar status por item conforme avança.

## ✅ Progresso 2026-06-23 (verificado)

**Tier 0 (enforcement) — DONE.** ESLint flat config + `eslint-plugin-playwright` + regras targeted (todas warn/ratchet); `noUnusedLocals`+`noUnusedParameters` (error, 0 violações); `database.helpers` adicionado ao barrel; `.jscpd.json`; **job `quality` no CI** (preserva `ci-tests`). Verificado: `tsc` 0 erros fora de `src/scripts`; `eslint` **0 errors / 1759 warnings**; jscpd. Ratchet eslint = **1780** (baseline 1759 + buffer 21 p/ não bloquear MR incidental; baixar p/ 1759 = strict). jscpd threshold = **10** (baseline real medido **9.09%**, NÃO 8.84% — corrigido).

**Tier 1.1 fixtures — DONE.** `approvedApplication` + `fundedAccount` (lazy, compõem `createPreQualifiedApplication`+`driveLeadToFunding`, preflight via helper, NÃO reinline) em `base-test.ts`. Review adversarial: compõe, não reimplementa.

**Tier 1.2 oracle — DONE.** `src/helpers/activity-log.helpers.ts` cobre `uown_los_activity_log` (reusa `pollUntil`+`db`, colunas verificadas) + re-exporta os helpers de lead-notes (não copia). No barrel + catalog.

**X.1/X.2 routing — DONE.** `e2e-examples` (§0 prefer-fixtures), `common-operations` (oracle), `qa-implementer` (reuse-first gate). Defeito de routing pego no review (`uniqueName`/`getWorkerRunId()` fictícios) **corrigido** em `e2e-examples` §6 + `.claude/rules/helpers.md`.

**Métrica de duplicação:** 597 → **494 clones** (efeito dos itens 5/6 anteriores). Próximo alvo: Tier 1.3 (runUnifiedFlow, ~595 linhas) e Tier 2.3 (CTs intra-spec).

## ✅ Progresso 2026-06-23 — parte 2 (type-health + selector type + 2.1/3.3/3.4)

**DESCOBERTA GRANDE:** ao excluir `src/scripts` do `tsc` (item 3.4) o cache incremental parou de mascarar — **o repo NUNCA type-checava limpo**: 125 erros latentes (o CI nunca rodava `tsc`, só `ci-tests`; localmente o `.tsbuildinfo` escondia). Todos PRÉ-EXISTENTES (nenhum referencia minhas mudanças). Resolvidos:

- **`AppSelectors` derivado do objeto** (`type AppSelectors = typeof SELECTORS`) — era uma interface paralela de 992 linhas mantida à mão que driftou e gerava **41 erros TS2339 fantasma**. Fonte única agora; o tipo nunca mais desincroniza. **(DRY win — Tier 2.4-adjacent.)**
- **53 dead-code** (TS6133/6196 — imports/locals/métodos/params não usados) removidos por 2 agents paralelos. `noUnusedLocals`/`noUnusedParameters` agora são erro real com 0 violações.
- **15 erros residuais** corrigidos: `goToNextPage` overrides (Promise<void>→<boolean>), `ApiClients` import path errado, `buildTestData.orderTotal` → opcional c/ default, `SELECTORS` import faltando, casts unknown, `testData.env` inexistente. (+9 de `seon-negative-scenarios` resolvidos em cascata pelo derive.)

**Resultado:** `tsc --noEmit` **EXIT 0 genuíno** (cache limpo, sem filtro) — 125 → **0**. Gate Tier 0 agora é verdadeiro. Ratchet eslint re-tunado p/ **1775** (baseline 1754 pós-cleanup). jscpd 597 → **491 clones**.

**Tier 3.4 DONE** (src/scripts + scratch `_*.spec.ts` excluídos do tsconfig — não são framework). **Tier 3.3 DONE** (scratch já gitignored, deixados no lugar). **Tier 2.1 DONE** (política de selectors reconciliada em `selectors.md` + `selector-hardening` + `page-objects.md`: co-locação no page object é OK; `common.selectors.ts` só cross-cutting; spec nunca inline).

## ✅ Progresso 2026-06-23 — parte 3 (3.1 + adoção do oracle, behavior-preserving)

**Tier 3.1 DONE** — `makeTestContext(overrides?)` em `base-test.ts`; os 2 `ctx as any`/double-cast (specs 531, storeUW) trocados por ctx tipado; a própria `ctx` fixture agora usa o factory (fonte única). `seon-widget` param-property unused corrigido.

**Tier 1.2 oracle — ADOÇÃO** (a maior dívida do 2º audit: 20+ SELECTs crus de activity-log). **13 queries inline → oracle** (`findLeadNoteContaining`/`findActivityLogContaining`): #1315 (4), gowsign/servicing (8), Pii/PP (1). Behavior-preserving (oracle roda a query idêntica; `ILIKE '%'||$2||'%'` preserva wildcards embutidos). **14 deixadas inline DE PROPÓSITO** — não casavam a semântica do oracle (múltiplos ILIKE OR, `LIKE` case-sensitive, `LIMIT 5`, multi-tabela). Disciplina via 2 agents com regra "só-se-casar-exato" + spot-check.

`tsc` **0** · `eslint` **0 errors / 1758 warnings** (ceiling 1775) · jscpd **494 clones** (~flat — o ganho do oracle foi reuso/manutenção, não line-count, já que a maioria das queries não casava e ficou inline).

> Nuance documentada: o oracle de activity-log filtra `deleted IS NOT TRUE` — para assert de existência é *mais* correto (log soft-deleted não é consequência observável); difere do inline só no caso raro de uma row matching soft-deletada.

### Ainda pendente (precisam rodar a suíte / DOM / refactor grande)
Tier 1.3 (runUnifiedFlow, suíte 12min), 1.4 (payment builders), 2.2 (god-objects — split de page object de 1.5k linhas usado pelo CI, risco sem run), 2.3 (CTs intra-spec — só onde forem data-variations reais; #1315 NÃO era), 2.4 (~38 XPath estruturais em page objects → sibling selectors precisam DOM/MCP). As LEFT activity-log queries com `LIKE` case-sensitive em `modify-lease` podem virar follow-up (variante case-insensitive do oracle).

## Diagnóstico de raiz

Os agents geram código não-DRY por **duas causas que se reforçam**:

1. **Sem enforcement mecânico.** Toda regra de DRY é advisory (skills + CLAUDE.md). Sem ESLint, sem `tsc`/sonar/jscpd no CI (que só roda `--project=ci-tests`), nada *impede* a duplicação. Regra sem gate = drift.
2. **Helpers existem mas as skills não roteiam para eles.** `setupApplicationViaApi`, `findLeadNoteContaining`, `buildCcArrangementBody` existem e são bons — e quase ninguém usa (1 / 2 / 2 specs). O agent só usa o que a skill manda E o lint obriga.

> **Os dois levers:** skill que **roteia** para reuso + lint que **bloqueia** o não-reuso. Todo item abaixo se ancora num desses dois.

## Baseline medido (2026-06-23)

| Métrica | Valor | Fonte |
|---|---|---|
| Linhas duplicadas (jscpd, tests+src) | **8.84%** (597 clones) | `npx jscpd tests src --min-lines 5 --min-tokens 50` |
| Locators inline em `src/pages/` | **1.110** | grep |
| `common.selectors.ts` | 1.049 linhas / 565 chaves | wc |
| Locator inline em specs | 104 (15 arquivos) | grep |
| XPath em specs | 2 | grep |
| Import `@helpers/*` individual em specs | 115 (98 excl. `database`) | grep |
| `await sleep()` em specs | 120 (~30 em loop) | grep |
| `as any`/`as unknown` em tests | 16 | grep |
| ESLint | **inexistente** | — |
| CI gates | só `playwright --project=ci-tests` | `.gitlab-ci.yml` |
| `noUnusedLocals`/`noUnusedParameters` se ligados | **0 erros novos** | `tsc` |

Meta de duplicação: **derrubar de 8.84% para < 5%** após Tiers 1–2; gatear no CI para não subir.

---

## TIER 0 — Enforcement mecânico (o multiplicador)

> Converte as regras já escritas em gates reais. Sem isto, todo o resto regride.

| # | Item | Arquivos | Calibração | Status |
|---|---|---|---|---|
| 0.1 | ESLint flat config + `typescript-eslint` + `eslint-plugin-playwright` | `eslint.config.mjs`, `package.json` (devDeps + script `lint:es`) | base | ☐ |
| 0.2 | Regra: sem XPath em specs | eslint `no-restricted-syntax` | **error** (2 violações → corrigir) | ☐ |
| 0.3 | Regra: import de helper de runtime só via barrel | eslint `no-restricted-imports` (`@helpers/*.helpers.js`, `*.helper.js`; exceto `database.helpers.js` OU adicioná-lo ao barrel) | **warn** (ratchet) | ☐ |
| 0.4 | Regra custom: `sleep()` dentro de `for/while` | `eslint-rules/no-sleep-in-loop.mjs` | **warn** (~30) | ☐ |
| 0.5 | Regra: locator inline em specs (`page.locator/getBy*` em `tests/**`) | eslint `no-restricted-syntax` | **warn** (104) | ☐ |
| 0.6 | Regra: `as any`/`as unknown`/`@ts-ignore` em tests | eslint | **warn** (16) | ☐ |
| 0.7 | `noUnusedLocals` + `noUnusedParameters` no tsconfig | `tsconfig.json` | **error** (0 violações) | ☐ |
| 0.8 | `.jscpd.json` + threshold no baseline (9%) | `.jscpd.json`, `package.json` script `dup` | gate ratchet | ☐ |
| 0.9 | Job `quality` no CI: `tsc --noEmit` + `eslint` (falha só em ERROR) + `jscpd --threshold` | `.gitlab-ci.yml` | bloqueia regressão | ☐ |
| 0.10 | Hook pre-push rodando lint nos arquivos mudados | framework de hooks existente | feedback local | ☐ |

**Aceite Tier 0:** `npx eslint .` roda sem ERROR; CI tem job `quality`; `tsc` verde (após corrigir os 2 `src/scripts` quebrados — item 3.4); jscpd gateado em 9%.

---

## TIER 1 — Building blocks reutilizáveis (maior corte de linhas)

| # | Item | Arquivos | Impacto | Status |
|---|---|---|---|---|
| 1.1 | Fixtures de estado pronto: `approvedApplication` + `fundedAccount` (compõem `setupApplicationViaApi` + `driveLeadToFunding` — NÃO reimplementar inline) | `src/support/base-test.ts` (+ tipos) | ~19 specs, milhares de linhas | ☐ |
| 1.2 | Oracle de activity-log: `assertLeadNote(db, leadPk, pattern)` / `waitForActivityLog(...)` envolvendo `esign-db.helpers` + queries genéricas em `uown_los_activity_log` (hoje sem helper) | `src/helpers/activity-log.helpers.ts` (novo) + barrel + catalog | 20+ SQLs crus em 10 specs; regra #13 garante crescimento | ☐ |
| 1.3 | `runUnifiedFlow` shared runner (parametriza `ci/` e `e2e/` unified-flow) | `tests/_shared/unified-flow.runner.ts` | clone de 595 linhas (top jscpd) | ☐ (exige rodar suíte de 12min) |
| 1.4 | Adoção dos builders de payment + helper `waitForCcTransactionStatus` | `src/api/bodies/`, `src/helpers/database.helpers.ts` | builder em 2 specs; polling repetido | ☐ |

**Aceite Tier 1:** fixtures usadas por ≥1 spec novo; oracle no barrel + catalog; jscpd cai vs baseline.

---

## TIER 2 — Dívida estrutural que alimenta duplicação

| # | Item | Evidência | Status |
|---|---|---|---|
| 2.1 | **Reconciliar política de selectors**: redefinir a regra "tudo em common.selectors.ts". Decisão: selector dono-de-página **co-locado** no page object (getter semântico OK); `common.selectors.ts` só p/ cross-cutting; splitar `common` por portal. Atualizar `.claude/rules/selectors.md` + `selector-hardening` | 1.110 inline vs regra; god-file 1.049 linhas | ☐ |
| 2.2 | Quebrar god-objects por composição (`paytomorrow` 1.540, `customer` 1.525, `contract` 966) | wc | ☐ |
| 2.3 | Parametrizar CTs intra-spec (`for...of testData` em vez de copy-paste de bloco) | self-clones jscpd: svc-509 (348), #1315 (237), 531 (118), 525 (103) | ☐ |
| 2.4 | Corrigir os ~38 XPath restantes em page objects → semântico | grep | ☐ |

## TIER 3 — Type-safety & higiene

| # | Item | Evidência | Status |
|---|---|---|---|
| 3.1 | Factory `makeTestContext()` p/ specs pararem de montar ctx parcial + castar | 2 `ctx as any`/double-cast (531, storeUnderwritingScores) | ☐ |
| 3.2 | Auditar `as any` restantes (16 em tests) | grep | ☐ |
| 3.3 | Remover specs scratch/probe (`__scratch_la_signing_url`, `_sticky_multi_fresh` — esse com `UPDATE` cru) | grep | ☐ |
| 3.4 | Corrigir 2 `src/scripts` quebrados (markdown com `.ts`) que deixam `tsc` vermelho | tsc | ☐ |

## CROSS-CUTTING — fechar o loop no sistema de agents

| # | Item | Status |
|---|---|---|
| X.1 | Toda fixture/helper/oracle nova entra nas skills (`helpers-catalog`, `e2e-examples`, `common-operations`) p/ o agent ALCANÇAR | ☐ |
| X.2 | Gate "reuse-first" no `qa-implementer`: antes de escrever setup/asserção, usar fixture/oracle existente | ☐ |
| X.3 | Skill nova `prefer-fixtures` (ou seção em `test-data-hierarchy`): fixture de estado pronto > setup inline | ☐ |

---

## Sequência de execução

1. **Tier 0** (enforcement) — multiplicador, primeiro.
2. **Tier 1.1 + 1.2** (fixtures + oracle) + **X.1/X.2** (roteamento nas skills) — maior corte + fecha o loop.
3. **Tier 2.1** (política de selectors) — destrava a contradição que o agent enfrenta.
4. **Tier 1.3, 2.2–2.4, 3.x** — restante (alguns exigem rodar a suíte).

## Como medir progresso

```bash
npx jscpd tests src --min-lines 5 --min-tokens 50   # % duplicação (baseline 8.84%)
npx eslint .                                          # ERRORs = 0; warnings ratchet
npx tsc --noEmit                                      # verde (após 3.4)
```

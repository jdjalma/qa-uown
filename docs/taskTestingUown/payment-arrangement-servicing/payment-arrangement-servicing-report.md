> **Este arquivo é registro de execução, NÃO fonte de padrão.** (CLAUDE.md regra #16)
> Patterns (selectors, helpers, page objects, classificação) vivem em `.claude/skills/` e no
> código (`src/`, `tests/`). Não infira padrão a partir deste report. leadPk/accountPk/arrangementPk
> abaixo são state volátil capturado em uma execução — podem ter sumido do DB (ver
> [[volatile-knowledge-registry]]). Toda classificação carrega source-tag da execução desta data.

# Task Report — payment-arrangement-servicing

## Metadata
- **Task ID:** payment-arrangement-servicing (servicing portal feature test — no GitLab IID supplied)
- **Source:** N/A (spec implementada sem ticket; cobertura de feature de arranjo de pagamento)
- **Implementer:** qa-implementer
- **Validator run date:** cycle 1 (S1–S3) 2026-06-01 18:01 · cycle 2 (S4–S7) 2026-06-01 18:50 · cycle 3 (suite S1–S7) 2026-06-01 19:14 · POST-FIX run (F-007 date-picker fix) 2026-06-01 ~21:30 · **FINAL run (suite completa, todos os fixes aplicados) 2026-06-02 ~16:00**
- **Environment:** dev3
- **Branch:** dev
- **Ciclo de validação:** FINAL — **pipeline fechado**. Todos os findings resolvidos. 7/7 cenários PASS.
- **Status global:** ✅ **PIPELINE FECHADO — 7/7 PASS.** Suite completa S1–S7 passou sem falhas. F-007 (date-picker helper) e F-008 (asserção CC multi-parcela) ambos resolvidos. Nenhum bug de produto `[CONFIRMADO]`. Dívidas técnicas (F-006) documentadas como débito de ambiente (dev3 sem processor Profituity).

## Test Suite
- **Spec file:** `tests/e2e/servicing/payment-arrangement-servicing.spec.ts`
- **Page objects:** `src/pages/servicing/servicing-base.page.ts` (`makeAchPaymentArrangement`, `makeCcPaymentArrangement`), `src/pages/servicing/payment-arrangement.page.ts` (display page)
- **DB helpers:** `src/helpers/database.helpers.ts` (`getPaymentArrangement`, `getAchPaymentsByArrangement`, `getCcTransactionsByArrangement`, `waitForPaymentArrangementStatus`, `getActivityLogsByAccount`, `getPaymentArrangementByPk`, `recalculateAchArrangementStatus`, `recalculateArrangementStatus`, `simulateCcSweepForArrangement`, `approveAllPendingCcSalesForArrangement`, `executeUpdate`, `getAccountRating`, `waitForAchPaymentsProcessed`, `getAccountStatus`, `waitForAccountStatus`)
- **Total scenarios:** 7 (S1–S7) + 2 auth.setup steps = 9 total
- **Passed:** 9/9 (100%)
- **Failed:** 0
- **Skipped:** 0
- **Duration (FINAL run, serial):** ~10.6 min
- **Type-check:** `tsc --noEmit` limpo para todos os arquivos do escopo. (Erros pré-existentes em `src/scripts/svc-460-perf-report.ts` e `src/scripts/dev3-trigger-sweeps.ts` — fora do escopo.)

## FINAL Run (2026-06-02 ~16:00, dev3) — pipeline closure

**Comando:** `ENV=dev3 node node_modules/@playwright/test/cli.js test tests/e2e/servicing/payment-arrangement-servicing.spec.ts --reporter=list --timeout=420000`

**Resultado:** 9 passed (2 auth.setup + 7 cenários). Exit code 0. Duração 10.6 min.

### S1 — FINAL: ✅ PASS (1.0m)
- Fresh data: leadPk=1378, accountPk=205, **arrangementPk=119**
- 5 ACH payments PENDING, soma=110.55 ≈ total=110.55 ✅
- Toast: `"Payment Arrangement scheduled successfully."` · status=NOT_STARTED · payment_type=ACH
- Activity log: `Payment Arrangement created. arrangementPk=119, type=NORMAL, paymentType=ACH` + `ACH Arrangement created. arrangementPk=119`

### S2 — FINAL: ✅ PASS (1.9m) — F-008 resolvido
- Fresh data: leadPk=1379, accountPk=206, **arrangementPk=120**
- 5 parcelas CC: 1 APPROVED síncrona hoje + 4 PENDING futuras → IN_PROGRESS inicial → fallback `approveAllPendingCcSalesForArrangement` (4 aprovadas, stand-in autorizado) → `recalculateArrangementStatus` → SUCCESS
- 5 CC SALE tx all APPROVED (pks=3364,3365,3366,3367,3368) ✅
- Activity log: `Payment Arrangement created. paymentType=CC` + `Credit Card Payment Arrangement created. arrangementPk=120` ✅
- Finalized log: `@blocked-by-missing-log` (synthetic path, dev3 sem processor — ver F-006)

### S3 — FINAL: ✅ PASS (56.3s)
- Fresh data: leadPk=1380, accountPk=207, **arrangementPk=121**
- Display columns: `["Arrangement Pk","Payment Type","Start Date","End Date","Total Amount","Status","Created At","Created By"]` ✅
- Row pk=121: `{Payment Type:"ACH", Start Date:"2026-06-02", End Date:"2026-06-30", Total Amount:"$188.80", Status:"NOT_STARTED"}` ✅
- Expanded: `["ACH Payments"]` · sub-table: 5 rows UI = 5 rows DB ✅

### S4 — FINAL: ✅ PASS (3.2m)
- Fresh data: leadPk=1381, accountPk=208, **arrangementPk=122**
- 5 ACH payments REQUEST · tier-1 send: PICKED_TO_SEND ✅ · listener no-op: arrangement=NOT_STARTED enquanto inFlight ✅ · tier-2 status sweep: 5/5 exausta (dev3 sem processor) → SETTLED stand-in 5 rows → `recalculateAchArrangementStatus` → SUCCESS
- Final: status=SUCCESS, is_active=false ✅
- Activity log: `ACH Arrangement created. arrangementPk=122` (hard) ✅ · finalized = `@blocked-by-missing-log` (ver F-006)

### S5 — FINAL: ✅ PASS (1.0m)
- Fresh data: leadPk=1382, accountPk=209, **arrangementPk=123**, 1 ACH payment
- RETURNED stand-in (1 row) → `recalculateAchArrangementStatus` → FAILED
- Final: status=FAILED, is_active=false ✅
- `[OBSERVAÇÃO]` account rating=P após FAILED (non-gating)
- Failure log: `@blocked-by-missing-log` (ver F-006)

### S6 — FINAL: ✅ PASS (1.4m)
- Fresh data: leadPk=1383, accountPk=210, **arrangementPk=124**
- CC SETTLEMENT, tipo=SETTLEMENT ✅ → 5 SALEs geradas → fallback `approveAllPendingCcSalesForArrangement` (4) → SUCCESS
- account status=SETTLED_IN_FULL ✅
- Activity log: `Credit Card Payment Arrangement created. arrangementPk=124` ✅ · finalized = `@blocked-by-missing-log` (ver F-006)

### S7 — FINAL: ✅ PASS (54.0s) — F-007 definitivamente resolvido
- Fresh data: leadPk=1384, accountPk=211, ACH Weekly today→today+28
- **5 ACH payments** geradas: `amounts=[33.45,33.45,33.45,33.45,33.45]` — distribuição perfeitamente uniforme ✅
- sum=167.25 ≈ total=167.25 ✅
- UI sub-rows=5 = DB rows=5 ✅ (regra #14 UI-first confirmada)

---

## Scenarios

> **Nota:** todos os PKs abaixo são da **execução FINAL (2026-06-02)**. State volátil (regra #16 / [[volatile-knowledge-registry]]).

### Scenario 1 — ACH arrangement, weekly installments (happy path)
- **Status:** ✅ PASS
- **Fresh data (FINAL):** leadPk=1378, accountPk=205, **arrangementPk=119**
- **Evidence:** Toast OK · status=NOT_STARTED · payment_type=ACH · 5 ACH PENDING, soma=110.55 · activity log criação ✅

### Scenario 2 — CC arrangement, installments (happy path)
- **Status:** ✅ PASS
- **Fresh data (FINAL):** leadPk=1379, accountPk=206, **arrangementPk=120**
- **Evidence:** Toast OK · 5 CC SALE (1 APPROVED síncrona hoje + 4 futuras via stand-in) → SUCCESS · activity log criação ✅ · finalized `@blocked-by-missing-log`

### Scenario 3 — Display page renders arrangement + expandable sub-table
- **Status:** ✅ PASS
- **Fresh data (FINAL):** leadPk=1380, accountPk=207, **arrangementPk=121**
- **Evidence:** 8 colunas OK · row ACH encontrada · ACH sub-table 5 rows UI = 5 rows DB ✅

### Scenario 4 — ACH sweep chain: NOT_STARTED → SUCCESS
- **Status:** ✅ PASS
- **Fresh data (FINAL):** leadPk=1381, accountPk=208, **arrangementPk=122**
- **Evidence:** ach_process_type=REQUEST×5 ✅ · tier-1 send OK · listener no-op (NOT_STARTED enquanto PICKED_TO_SEND) ✅ · SETTLED stand-in → SUCCESS, is_active=false ✅

### Scenario 5 — ACH arrangement → FAILED
- **Status:** ✅ PASS
- **Fresh data (FINAL):** leadPk=1382, accountPk=209, **arrangementPk=123**
- **Evidence:** RETURNED stand-in → FAILED, is_active=false ✅ · `[OBSERVAÇÃO]` rating=P

### Scenario 6 — CC SETTLEMENT → SETTLED_IN_FULL
- **Status:** ✅ PASS
- **Fresh data (FINAL):** leadPk=1383, accountPk=210, **arrangementPk=124**
- **Evidence:** arrangement_type=SETTLEMENT ✅ · account=SETTLED_IN_FULL ✅ · 5 CC SALE APPROVED ✅

### Scenario 7 — Multi-installment real (ACH, weekly, today → today+28)
- **Status:** ✅ PASS
- **Fresh data (FINAL):** leadPk=1384, accountPk=211
- **Evidence:** 5 ACH payments, amounts=[33.45×5], distribuição uniforme ✅ · UI sub-rows=5 = DB rows=5 ✅

---

## Findings (estado final)

| ID | Type | Status final | Descrição |
|----|------|--------------|-----------|
| F-001 | [OBSERVAÇÃO] (cobertura) | **RESOLVIDO** | Múltiplas parcelas semanais não era exercitado — causa raiz: F-007 (date-picker). Resolvido pelo fix de `fillArrangementSchedule`. S7 PASS com 5 parcelas. |
| F-002 | [OBSERVAÇÃO] | **REGISTRADO** | Display page header `'Arrangement Pk'` (k minúsculo); `EXPECTED_COLUMNS` declara `'Arrangement PK'`. Comparação case-insensitive no spec — não causa falha. Cosmético. |
| F-003 | [OBSERVAÇÃO] | **REGISTRADO** | `MERCHANT_PREFLIGHT_SKIP=true` no `.env` bypassa preflight em todos os setups. Escape hatch de ambiente, não defeito de teste. |
| F-004 | [OBSERVAÇÃO] | **REGISTRADO** | `src/scripts/svc-460-perf-report.ts` falha `tsc`. Fora do escopo desta spec. |
| F-005 | [TEST ISSUE] | **RESOLVIDO** (cycle 3) | S4 fallback insuficiente — corrigido: SETTLED stand-in + recalc antes do `recalculateAchArrangementStatus`. |
| F-006 | [HIPÓTESE] | **DÍVIDA TÉCNICA** | Logs `Arrangement finalized as SUCCESS/FAILED` ausentes em paths sintéticos (S2, S4, S5, S6). Causa: `approveAllPendingCcSalesForArrangement`/`recalculateAchArrangementStatus`/SETTLED stand-in não disparam o `PaymentArrangementACHListener`. Artefato de dev3 sem processor. Asserts marcados `@blocked-by-missing-log`. Hard assertions pendentes para env com Profituity real (Q-S2/Q-S4/Q-S5/Q-S6). |
| F-007 | [OBSERVAÇÃO] (scenario-design) | **RESOLVIDO** | `fillArrangementSchedule` usava `pressSequentially` em inputs `type=search` — ignorados pelo React. Fix: native value setter + dispatch. POST-FIX S1=5 parcelas; FINAL S7=5 parcelas uniformes. |
| F-008 | [TEST ISSUE] | **RESOLVIDO** | S2 falhava após fix F-007: CC multi-parcela → IN_PROGRESS (não SUCCESS). Corrigido: fallback `approveAllPendingCcSalesForArrangement` + `recalculateArrangementStatus` (padrão S6). FINAL S2=PASS. |

> Nenhum finding `[CONFIRMADO]` como bug de produto em todo o pipeline.

## Coverage assessment vs Risk

| Risk area | Risk level | Scenario | Status |
|-----------|------------|----------|--------|
| ACH arrangement criado + NOT_STARTED + parcelas linkadas | High | S1 | ✅ PASS — 5 parcelas PENDING, soma=total |
| CC arrangement multi-parcela + SUCCESS + SALEs APPROVED | High | S2 | ✅ PASS — fallback stand-in, 5 SALEs APPROVED |
| Activity log por ação de negócio (rule #13) | High | S1, S2 (created + ACH/CC) | ✅ PASS — logs orgânicos presentes |
| Display page render real (UI-first, rule #14) + expandRow + sub-tabela vs DB | Medium | S3 | ✅ PASS — UI 5 rows = DB 5 rows |
| Múltiplas parcelas semanais (schedule split) N>1 | Medium | S7 | ✅ PASS — 5 parcelas, distribuição uniforme [33.45×5] |
| Arrangement Type SETTLEMENT (CC) → account SETTLED_IN_FULL | High | S6 | ✅ PASS — SETTLEMENT + SETTLED_IN_FULL confirmados |
| ACH sweep chain NOT_STARTED → in-flight no-op → SUCCESS | High | S4 | ✅ PASS — listener no-op + terminal SUCCESS |
| ACH arrangement → FAILED + is_active=false | High | S5 | ✅ PASS — FAILED + is_active=false confirmados |

## Decisions
- **Bugs raised:** nenhum bug de produto `[CONFIRMADO]` em nenhum ciclo.
- **Pipeline:** fechado com 7/7 PASS. Nenhuma regressão, nenhum timeout.
- **Dívida técnica (F-006):** logs de finalização via `PaymentArrangementACHListener` não exercitados em dev3 (sem processor Profituity). Asserts `@blocked-by-missing-log` preservados como documentação viva. Quando env com processor disponível: Q-S2/Q-S4/Q-S5/Q-S6 viram hard assertions.
- **F-002:** alinhar `PaymentArrangementPage.EXPECTED_COLUMNS` para `'Arrangement Pk'` (k minúsculo) ou documentar comparação case-insensitive explicitamente — cosmético, não afeta resultado.

## Notas para `qa-doc-keeper`
1. **Pitfall (rule #11):** em env sem processor Profituity (dev3), `getStatusDatePaymentsListSweep` nunca move ACH payments além de `PICKED_TO_SEND`; `recalculateAchArrangementStatus` sobre PICKED_TO_SEND deriva apenas IN_PROGRESS. Para SUCCESS/FAILED use SETTLED/RETURNED stand-in (Exception 3) + recalc. Esse path NÃO dispara `PaymentArrangementACHListener` → log de finalização ausente.
2. **Pitfall:** CC multi-parcela Weekly em dev3 gera N SALEs — apenas a de hoje processa síncrona (APPROVED); futuras ficam PENDING → arrangement=IN_PROGRESS. Para SUCCESS: `approveAllPendingCcSalesForArrangement` + `recalculateArrangementStatus`. `simulateCcSweepForArrangement` é date-gated e NÃO move futuras.
3. **Pattern confirmado:** `fillArrangementSchedule` em `servicing-base.page.ts:269-295` usa native value setter (não `pressSequentially`) nos date pickers `type=search`. Mesmo padrão de `application-wizard.page.ts`. Alimentar [[page-object-pattern]] / [[common-operations]].
4. **F-002 (doc-keeper):** alinhar `EXPECTED_COLUMNS` para `'Arrangement Pk'` ou documentar case-insensitive.
5. **F-004 (doc-keeper):** limpar/regenerar `src/scripts/svc-460-perf-report.ts` (corrompido, falha tsc).

## Pipeline closure
**FECHADO.** 7/7 PASS, exit code 0, duração 10.6 min (dev3, 2026-06-02). Nenhum bug de produto. Dívida técnica F-006 documentada.
- `{testName}-evidence.md` (stakeholder-facing, rule #17): não gerado — task sem ticket GitLab/Jira; usuário não sinalizou "pronto pra colar no ticket". Gerar sob demanda quando usuário fornecer sinal de fechamento stakeholder-facing.

# uownRU03261500 · Display contractBalance Instead of Negative EPO Amount (#504)

**GitLab:** https://gitlab.com/uown/backend/svc/-/work_items/504
**Milestone:** Uown | RU03.26.1.50.0
**Pipeline:** new-api + hybrid UI (API setup + Servicing Portal verification)

## What the test validates

Bug in `PayOffAmountService.getAnytimeBuyout()`: when `kwBuyoutAmount <= 0` (EPO negative), the method calls `.add()` on an immutable `List.of()` / `Stream.toList()` (Java 16+), throwing `UnsupportedOperationException` → HTTP 500.

**Routing in `getPayOffAmount(accountPk)`:**
- `termInMonths == 16` → `getAnytimeBuyout()` ← THE BUG
- `ELSE IF KORNERSTONE` → `getKornerstoneEpo()`
- `ELSE` → `getEpoCalculation()`

---

## Test Execution History

### QA1 — 2026-03-19 (post-fix 9885ca0e)

| Field | Value |
|-------|-------|
| **Environment** | qa1 |
| **Project** | task-testing |
| **Date** | 2026-03-19 |
| **Duration** | ~3.8 min |
| **Fix commit** | `9885ca0e` — mutable lists + null safety + daysUsed <= 0 |
| **Result** | **8 PASSED / 2 FAILED / 2 SKIPPED** |

#### Fix status

| What | Status | Detail |
|------|:------:|--------|
| HTTP 500 (UnsupportedOperationException) | **FIXED** | Lists are now mutable (`new ArrayList<>`, `Collectors.toCollection`) |
| contractBalance substitution when EPO <= 0 | **NOT FIXED** | `getPayoffAmount` returns **-2298.85** instead of contractBalance (2701.15) |
| epoBreakdown with contractBalance key | **NOT WORKING** | `epoBreakdown` is always `[]` (empty even for positive accounts) |

---

### QA1 — 2026-03-17 (pre-fix, original run)

| Field | Value |
|-------|-------|
| **Environment** | qa1 |
| **Project** | task-testing |
| **Date** | 2026-03-17 |
| **Duration** | ~2.7 min |
| **Result** | **5 PASSED / 0 FAILED / 7 SKIPPED** |

---

## Scenarios

### CT-01 — EPO positivo — getPayoffAmount retorna valor positivo sem erro

16-month KS3015 account (term_in_months forced to 16 via DB). Verifies `getPayoffAmount` returns HTTP 200 with positive EPO. **Includes UI verification**: login to Servicing Portal → navigate to account → verify ACTIVE status and "Early Payoff" section visible.

| Run | Env | Account PK | Result | EPO | Note |
|-----|-----|:----------:|:------:|:---:|------|
| 2026-03-19 | qa1 | 4468 | ✅ PASSED | 2701.15 | term=16, UI ACTIVE, Early Payoff visible |
| 2026-03-17 | qa1 | 4445 | ✅ PASSED | 1244.15 | term=16, UI ACTIVE, Early Payoff visible |

---

### CT-08 — Conta padrao UOwn (TerraceFinance) nao retorna erro

Standard non-Kornerstone account (13-month). Takes `getEpoCalculation()` path — unaffected by bug.

| Run | Env | Account PK | Result | EPO | Note |
|-----|-----|:----------:|:------:|:---:|------|
| 2026-03-19 | qa1 | 4469 | ✅ PASSED | epoBalance >= 0 | programType=13 months |
| 2026-03-17 | qa1 | 4446 | ✅ PASSED | 1244.15 | programType=13 months |

---

### CT-09 — Kornerstone KW (non-16-month) nao dispara getAnytimeBuyout()

KS3015 account with natural 13-month term. Takes `getKornerstoneEpo()` path — unaffected by bug.

| Run | Env | Account PK | Result | EPO | Note |
|-----|-----|:----------:|:------:|:---:|------|
| 2026-03-19 | qa1 | 4470 | ✅ PASSED | > 0 | term=13, Kornerstone EPO path |
| 2026-03-17 | qa1 | 4447 | ✅ PASSED | 1244.15 | term=13, Kornerstone EPO path |

---

### CT-11 — getPayoffAmount quando EPO <= 0 (fix verification)

Forces `kwBuyoutAmount <= 0` via DB payment insert ($5000 PAID), then verifies `getPayoffAmount` behavior.

| Run | Env | Account PK | Result | HTTP | Value | Note |
|-----|-----|:----------:|:------:|:----:|:-----:|------|
| 2026-03-19 | qa1 | 4471 | **FAILED** | 200 | **-2298.85** | HTTP 500 fixed, but value is NEGATIVE — contractBalance substitution not working |
| 2026-03-17 | qa1 | 4448 | ✅ PASSED | 500 | N/A | BUG confirmed — UnsupportedOperationException |

**Root cause analysis (2026-03-19):**
The fix in commit `9885ca0e` correctly makes the lists mutable (HTTP 500 resolved), but the `if(kwBuyoutAmount <= 0)` branch is **not substituting the value**. `getPayoffAmount` returns `-2298.85` instead of the expected `contractBalance` (2701.15). Possible causes:
1. The `getPayoffAmount` endpoint returns the value **before** the if-check applies the substitution
2. The `kwBuyoutAmount` variable assignment inside the if-block does not propagate to the return value
3. The deployed version is an intermediate build that does not include the full fix

---

### CT-02 — EPO negativo → getPayoffAmount retorna contractBalance (HTTP 200)

| Run | Env | Account PK | Result | Note |
|-----|-----|:----------:|:------:|------|
| 2026-03-19 | qa1 | 4471 | ✅ PASSED | **FALSE POSITIVE** — ran before CT-11 inserted $5000 payment (no serial mode). Tested positive case, not negative. |
| 2026-03-17 | qa1 | — | ⏭ SKIP | Awaiting fix deployment |

---

### CT-03 — epoBalance equals contractBalance quando EPO negativo

| Run | Env | Account PK | Result | Note |
|-----|-----|:----------:|:------:|------|
| 2026-03-19 | qa1 | 4471 | ✅ PASSED | **FALSE POSITIVE** — same issue as CT-02 (no serial mode) |
| 2026-03-17 | qa1 | — | ⏭ SKIP | Awaiting fix deployment |

---

### CT-04 — getPayoffAmount retorna valor igual ao contractBalance

| Run | Env | Account PK | Result | Note |
|-----|-----|:----------:|:------:|------|
| 2026-03-19 | qa1 | 4471 | ✅ PASSED | **FALSE POSITIVE** — same issue as CT-02 (no serial mode) |
| 2026-03-17 | qa1 | — | ⏭ SKIP | Awaiting fix deployment |

---

### CT-05 — getAccountSummary.epoBalance positivo e igual ao contractBalance

| Run | Env | Account PK | Result | Note |
|-----|-----|:----------:|:------:|------|
| 2026-03-19 | qa1 | 4471 | ✅ PASSED | **FALSE POSITIVE** — same issue as CT-02 (no serial mode) |
| 2026-03-17 | qa1 | — | ⏭ SKIP | Awaiting fix deployment |

---

### CT-07 — Breakdown contem contractBalance apenas quando EPO negativo

| Run | Env | Account PK | Result | Note |
|-----|-----|:----------:|:------:|------|
| 2026-03-19 | qa1 | 4471 | **FAILED** | **ERRO NO TESTE** — buscava campo `epoBreakdown` que nao existe. O campo correto e `contractBalanceBreakdown`. Nao e bug da aplicacao. |
| 2026-03-17 | qa1 | — | ⏭ SKIP | Awaiting fix deployment |

---

### CT-12 — Conta encerrada nao retorna HTTP 500

| Run | Env | Account PK | Result | Note |
|-----|-----|:----------:|:------:|------|
| 2026-03-19 | qa1 | 4472 | ✅ PASSED | cancelAccount=200, getPayoffAmount != 500 |
| 2026-03-17 | qa1 | 4449 | ✅ PASSED | cancelAccount=200, getPayoffAmount=200 |

---

### CT-10, CT-13 — Skipped (manual/browser-only)

| Test | Reason | Status |
|------|--------|:------:|
| CT-10 | Visual verification in Servicing Portal (done in CT-01 UI step) | ⏭ SKIP |
| CT-13 | Requires manual config toggle change | ⏭ SKIP |

---

## Validation Summary

### 2026-03-19 (post-fix 9885ca0e)

| Scenario | Result | Note |
|----------|:------:|------|
| CT-01 · EPO positivo (API + UI) | ✅ | |
| CT-08 · Standard UOwn unaffected | ✅ | |
| CT-09 · Kornerstone non-16-month unaffected | ✅ | |
| CT-11 · Fix verification (EPO <= 0) | **FAILED** | HTTP 200 (fix parcial), mas valor = -2298.85 (negativo) |
| CT-02 · EPO negativo → contractBalance | ✅ | FALSE POSITIVE (sem serial mode) |
| CT-03 · epoBalance == contractBalance | ✅ | FALSE POSITIVE (sem serial mode) |
| CT-04 · getPayoffAmount == contractBalance | ✅ | FALSE POSITIVE (sem serial mode) |
| CT-05 · epoBalance positivo | ✅ | FALSE POSITIVE (sem serial mode) |
| CT-07 · Breakdown com contractBalance | **FAILED** | epoBreakdown vazio (mesmo para conta positiva) |
| CT-12 · Cancelled account safe | ✅ | |
| CT-10,13 · Manual | ⏭ SKIP | |
| **Total: 8 PASSED / 2 FAILED / 2 SKIPPED** | | |

### 2026-03-17 (pre-fix)

| Scenario | Result |
|----------|:------:|
| CT-01 · EPO positivo (API + UI) | ✅ |
| CT-08 · Standard UOwn unaffected | ✅ |
| CT-09 · Kornerstone non-16-month unaffected | ✅ |
| CT-11 · BUG confirmed (HTTP 500) | ✅ |
| CT-12 · Cancelled account safe | ✅ |
| CT-02-07 · Post-fix behavior | ⏭ SKIP |
| CT-10,13 · Manual | ⏭ SKIP |
| **Total: 5 PASSED / 0 FAILED / 7 SKIPPED** | |

---

## Bugs de Aplicacao Encontrados

### BUG-01: getPayoffAmount retorna valor negativo (contractBalance substitution not working)

| Field | Value |
|-------|-------|
| **Severity** | Critical |
| **Status** | OPEN (parcialmente corrigido por 9885ca0e) |
| **Endpoint** | `GET /uown/svc/getPayoffAmount/{accountPk}` |
| **Account** | 4471 (qa1) |
| **Expected** | contractBalance (2701.15) quando kwBuyoutAmount <= 0 |
| **Actual** | -2298.85 (valor negativo retornado) |
| **Root cause** | O branch `if(kwBuyoutAmount <= 0)` em `getAnytimeBuyout()` nao esta propagando o valor substituto para o retorno do endpoint. O HTTP 500 foi corrigido (listas mutaveis), mas o valor negativo ainda e retornado. |
| **Fix commit** | `9885ca0e` — corrigiu crash, mas nao o valor |

### ~~BUG-02~~ (DESCARTADO): epoBreakdown nao existe em getAccountSummary

**Nao e bug.** O campo `epoBreakdown` nao existe na resposta de `getAccountSummary`. O campo correto e `contractBalanceBreakdown`, que retorna normalmente com headers e valores. Era erro no teste (CT-07) que buscava o campo errado.

---

## Test Issues Corrigidos

### ISSUE-01: CT-02 a CT-05 eram FALSE POSITIVES (sem serial mode) — CORRIGIDO

Os testes CT-02 a CT-05 compartilham `accountPkNeg` com CT-11 mas nao garantiam ordem de execucao. Playwright executou CT-02-05 ANTES de CT-11 inserir o pagamento de $5000, fazendo eles testarem o cenario positivo (sem pagamento) ao inves do negativo.

**Fix aplicado:** `test.describe.configure({ mode: 'serial' })` adicionado no describe "EPO negativo".

### ISSUE-02: CT-07 buscava campo errado (epoBreakdown vs contractBalanceBreakdown) — A CORRIGIR

O teste buscava `epoBreakdown` na resposta de `getAccountSummary`, mas o campo correto e `contractBalanceBreakdown`. Precisa ser corrigido para validar o campo correto.

---

## Setup Strategy

### Account creation (API + DB override)
1. `sendApplication` WITHOUT order (pre-qualification)
2. Force `UW_APPROVED` via DB (GDS campaign 170 unreliable)
3. `sendInvoice` with $1200 order
4. Set `merchant_program_pk` before `authorizeCreditCard`
5. `settleApplication` → `updateFundingStatus(FUNDING)` → `updateFundingStatus(FUNDED)`
6. Override `uown_sv_sched_summary.term_in_months = 16`

### EPO negative (DB payment insert)
CC gateway in QA1 does not process payments for automation-created accounts. Direct DB insert of PAID payment ($5000) is the only reliable method.

### Merchants
- **KS3015** (FifthAveFurnitureNY): Kornerstone, 13-month default. Term forced to 16 via DB for bug path.
- **TerraceFinance**: Non-Kornerstone, 13-month. Standard EPO path.
- **KS5936** (GriffinsFurniture): Kornerstone with ONLY 16-month program. Settlement not yet configured.

---

## Next Steps

1. **Report BUG-01** to dev team — `getPayoffAmount` returns -2298.85 (negativo). Nota: `contractBalance` tambem esta negativo (-2298.85), entao a substituicao sozinha nao resolve — precisa clampar para >= 0
2. ~~**Fix test ordering**~~ — DONE: `test.describe.configure({ mode: 'serial' })` adicionado
3. **Fix CT-07** — trocar `epoBreakdown` por `contractBalanceBreakdown` no teste
4. **Re-run after BUG-01 fix** — validate que valor retornado e positivo ou $0.00

> **Este arquivo é registro de execução, NÃO fonte de padrão.** Reports em `docs/taskTestingUown/` são histórico (CLAUDE.md regra #16). NÃO inferir selectors, helpers, page objects ou classificações a partir deste documento — fonte de pattern são skills (`.claude/skills/`) e código (`src/`, `tests/`). leadPk/accountPk listados em "Evidências" são voláteis: podem ter sumido do DB (ver [[volatile-knowledge-registry]]). Toda asserção técnica carrega source-tag desta execução.

# Task Report — refund-payment-servicing

## Metadata
- **Test:** refund-payment-servicing (Reverse / Refund flow — Servicing Payment History)
- **Spec:** `tests/e2e/servicing/refund-payment-servicing.spec.ts`
- **Implementer:** qa-implementer
- **Validator run date:** 2026-06-01 16:05 (local)
- **Environment:** dev3 (ENV=dev3 from `.env`)
- **Branch:** dev
- **Ciclo de validação:** 1/3
- **Merchant:** ProgressMobility (`OL90294-0001`, preflight bypassed via `MERCHANT_PREFLIGHT_SKIP=true`)
- **State:** CA

## Test Suite
- **Total scenarios:** 2 (+ 2 auth setup)
- **Passed:** 4 / **Failed:** 0 / **Skipped:** 0
- **Duration:** 1.9 min (S1 49.3s, S2 48.4s)
- **Run cmd:** `ENV=dev3 npx playwright test tests/e2e/servicing/refund-payment-servicing.spec.ts --reporter=list --timeout=300000`
- **tsc --noEmit:** clean for spec + dependencies (the only errors reported are in unrelated `src/scripts/svc-460-perf-report.ts`, a pre-existing encoding-corrupt file outside this task's scope)

## Pre-run hypotheses resolved (from implementer)

| Hypothesis | Resolution | Source |
|------------|-----------|--------|
| Does `db.getActivityLogsByAccount` exist? | **YES** — `src/helpers/database.helpers.ts:619`. Queries `uown_sv_activity_log WHERE account_pk = $1 AND LOWER(notes) LIKE LOWER($2) ORDER BY row_created_timestamp DESC`. Used as-is in the spec (no substitution needed). | code read 2026-06-01 |
| Partial refund DB status: `PARTIALLY_REFUNDED` or `REVERSED`? | **`PARTIALLY_REFUNDED`** — confirmed at runtime. Original SALE row (tx=3306) moved to `PARTIALLY_REFUNDED` after a $40 refund over $100. The spec's tolerant assert `['PARTIALLY_REFUNDED','REVERSED']` matched on `PARTIALLY_REFUNDED`. | fresh repro account 145, run 2026-06-01 |
| `data-column-id` 9=Status, 13=CC Action, 3=Amount confirmed? | **N/A — those attrs do NOT exist.** The implementer's spec comment already corrected this: the CC grid renders cells as `role="cell"` in column order with NO `data-column-id`. Assertions are driven through the `CreditCardHistoryPage` page object (`getRowStatus`, `getRowAmount`, `getRowCellText(txPk, 12)` for CC Action). All page-object methods exist (`src/pages/servicing/credit-card-history.page.ts`). | code read + run 2026-06-01 |

## Scenarios

### Scenario 1 — Fully Refund of $100 payment
- **Status:** PASS (49.3s)
- **Persona:** agent (`manager` role, Servicing portal)
- **Setup evidence:** leadPk=**1317**, accountPk=**144**, APPROVED SALE CC payment txPk=**3303** ($100). E-sign routed SIGNWELL (CA + ProgressMobility — no GowSign template hit; consistent with routing rule).
- **Steps:**
  1. Login + open Reverse modal for the $100 payment row (UI, payment-history grid) — PASS
  2. Select "Fully Refund", comment, submit — PASS. Toast: `"Successfully refunded payment."` (no "error" substring)
  3. DB validation — PASS. Original tx=3303 → `status=REFUNDED`. CREDIT row tx=**3304** created, `cc_action=CREDIT`, `amount=101.00` (principal $100 + original charge_fee $1.00, fee read from DB not hardcoded)
  4. CC Transactions grid (UI render) — PASS. Original tx=3303 grid status contains `REFUNDED`; CREDIT row tx=3304 renders `$101.00` / action `CREDIT`
  5. Activity log — PASS. Captured: `"Refund CC Payment complete. Status REFUNDED, Amount 100, refundFee true, Remaining amount 0.00"`
- **AC mapping:** Full refund happy path — DB status transition + CREDIT transaction + UI grid render + activity log
- **Coverage assessment:** Adequate. UI-first respected (reverse driven via browser grid + modal, render re-read in CC grid), domain reflex satisfied (activity log asserted with content), fresh data per test.

### Scenario 2 — Partial Refund of $40 over $100 payment
- **Status:** PASS (48.4s)
- **Persona:** agent (`manager` role, Servicing portal)
- **Setup evidence:** leadPk=**1318**, accountPk=**145**, APPROVED SALE CC payment txPk=**3306** ($100). E-sign SIGNWELL.
- **Steps:**
  1. Login + open Reverse modal for the $100 payment row — PASS
  2. Select "Partially Refund", set $40, comment, submit — PASS. Toast: `"Successfully refunded payment."` (option text "Partially Refund" matches real DOM, not the enum "Partial Refund")
  3. DB validation — PASS. Original tx=3306 → `status=PARTIALLY_REFUNDED`. CREDIT row tx=**3307**, `cc_action=CREDIT`, `amount=40` (no fee added on partial — `refundFee false`)
  4. CC Transactions grid (UI render) — PASS. Original tx=3306 grid status `PARTIALLY_REFUNDED`; CREDIT row tx=3307 renders `$40.00` / action `CREDIT` (grid amount matches DB)
  5. Activity log — PASS. Captured: `"Refund CC Payment complete. Status PARTIALLY_REFUNDED, Amount 40.00, refundFee false, Remaining amount 60.00"`
- **AC mapping:** Partial refund — DB status transition + partial CREDIT + UI grid render + activity log + remaining-balance accounting
- **Coverage assessment:** Adequate. Same UI-first + activity-log coverage as S1. Note the product difference vs S1 captured below (F-001).

## Findings

| ID | Type | Severity | Priority | Description |
|----|------|----------|----------|-------------|
| F-001 | [OBSERVAÇÃO] | S4 | P3 | Fee handling differs by refund type: Fully Refund credits principal **+ $1 charge fee** (`refundFee true`, CREDIT=$101.00); Partial Refund credits **only the requested amount** (`refundFee false`, CREDIT=$40.00). Not a bug — consistent product behavior across both fresh accounts (144, 145) this run; matches the implementer's documented expectation. No action. |

No bugs. No coverage gaps. No test issues.

## Coverage assessment vs Risk

| Risk area | Risk level | Scenarios covering | Adequate? |
|-----------|-----------|--------------------|-----------|
| Full refund — status transition + CREDIT + ledger | High | S1 | Yes |
| Partial refund — status + partial CREDIT + remaining balance | High | S2 | Yes |
| UI render of refund result in CC grid (rule #15) | Medium | S1, S2 (re-read grid via page object) | Yes |
| Activity log presence for refund (rule #14) | High | S1, S2 (content asserted) | Yes |
| Fee accounting correctness | Medium | S1 (DB-read fee), S2 (no fee) | Yes |

No high-risk area uncovered.

## Decisions
- **Bugs raised:** none.
- **Observations logged:** F-001 (refund fee differs full vs partial) — no action, documented product behavior.
- **Gaps:** none.

## Handoff
Ready for: qa-doc-keeper.

(Pipeline NOT closed: no explicit user signal to generate `-evidence.md`. This is a successful intermediate validation run. Evidence file deferred per CLAUDE.md rule #17 / Phase 6.5 — generate only on explicit closure signal.)

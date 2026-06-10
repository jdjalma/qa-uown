> **Este arquivo é registro de execução, NÃO fonte de padrão.** Reports em `docs/taskTestingUown/`
> são histórico (CLAUDE.md regra #16). NÃO inferir selectors, helpers, page objects ou
> classificações a partir deste arquivo — fonte de pattern são skills (`.claude/skills/`) e
> código (`src/`, `tests/`). leadPk/accountPk listados abaixo são voláteis (podem ter sumido do
> DB) — reproduzir via automação antes de classificar qualquer comportamento como bug.

# Task Report — lease-cancellation-api

## Metadata
- **Task ID:** lease-cancellation-api (API-only cancellation suite)
- **Source:** N/A (re-enable of 3 previously `test.skip` scenarios)
- **Implementer:** qa-implementer
- **Validator run date:** 2026-06-01 20:24 (UTC; activity-log timestamps in UTC)
- **Environment:** dev3 (ENV from `.env`)
- **Branch:** dev
- **Ciclo de validação:** 2/3 (1 devolução interna por test-implementation fix aplicado neste run)

## Test Suite
- **Spec file(s):** `tests/api/lease-cancellation-api.spec.ts`
- **Playwright project:** `api-only`
- **Total scenarios:** 3
- **Passed:** 3 / **Failed:** 0 / **Skipped:** 0
- **Duration:** 1.6m (cycle 2)
- **Status final:** ✅ PASS

## Setup fix applied this run (test-implementation bug — F-001)

Cycle 1 (all 3 scenarios) failed in setup `createAndDriveToFunding` with `settleApplication: 500`.
Root cause: `submitApplication` was called WITHOUT a preceding `getMissingFields`, and its
failure was silently swallowed (logged `submitApplication FAIL`, no `expect`). On a brand-new
lead with no resolved `merchantProgramPk`, `submitApplication` fails ("Merchant program is
required"), so the lead never reached CONTRACT_CREATED — `settleApplication` then returned 500
downstream. This is the documented application-lifecycle pitfall (see
`src/helpers/api-setup.helpers.ts` lines 331–360 and CLAUDE.md application-lifecycle protocol).

Fix (within `createAndDriveToFunding`): extract `shortCode` + `planId` from the invoice
`paymentDetailsList[0].redirectUrl`, call `api.application.getMissingFields(shortCode, {planId})`
before `submitApplication`, and assert `submitResp.ok` (fail-fast instead of swallowing).
`tsc --noEmit` clean for the spec file. The cancellation logic under test was NOT modified.

## Scenarios

### Scenario 1 — cancelAccount without refund
- **Status:** ✅ PASS (31.7s)
- **Persona:** ops/agent (SVC `cancelAccount` endpoint, `refundAllPayments=false`)
- **Evidence:**
  - leadPk: **1335**  |  leadUuid: `32904524-1c6b-4678-a2ad-6a36b2fa0b38`
  - accountPk: **162**
  - approvedAmount: 4730  |  esignClient: SIGNWELL (CA → no GowSign template fallback, expected)
  - DB final `account_status`: **`CANCELLED`** (exact value, double-L — confirmed via direct SELECT post-run)
  - Activity log (`uown_sv_activity_log`, real text): `"Account status changed from ACTIVE to CANCELLED due to API test cancel no refund"` (ts 2026-06-01T20:22:42Z)
  - No "Refunding payments" line present → consistent with `refundAllPayments=false`
- **AC mapping:** cancel without refund → CANCELLED + log
- **Coverage assessment:** Adequate — status transition asserted in DB + activity log asserted (CLAUDE.md #13)

### Scenario 2 — cancelAccount with refund
- **Status:** ✅ PASS (30.2s)
- **Persona:** ops/agent (SVC `cancelAccount` endpoint, `refundAllPayments=true`)
- **Evidence:**
  - leadPk: **1336**  |  leadUuid: `a1d730aa-acb7-4a17-9966-f2d311a5e1a8`
  - accountPk: **163**
  - approvedAmount: 4730  |  esignClient: SIGNWELL
  - DB final `account_status`: **`CANCELLED`** (exact value — confirmed via direct SELECT post-run)
  - Activity log (real text): `"Refunding payments on account \nAccount status changed from ACTIVE to CANCELLED due to API test cancel with refund"` (ts 2026-06-01T20:23:12Z)
  - "Refunding payments on account" line PRESENT → distinguishes refund path from Scenario 1
- **AC mapping:** cancel with refund → CANCELLED + refund log
- **Coverage assessment:** Adequate for status + log. See F-002 (observation): test asserts the
  refund log line exists but does NOT assert refund transactions/amounts in
  `uown_sv_credit_card_transaction` / `uown_sv_achpayment`. The lease had no captured payments
  (cancelled shortly after funding), so there was nothing to refund — refund-effect coverage is
  log-presence only, not money-movement.

### Scenario 3 — Protection plan sweep after cancellation
- **Status:** ✅ PASS (34.3s)
- **Persona:** ops/agent (cancel + `triggerScheduledTask('cancelProtectionPlanSweep')`)
- **Evidence:**
  - leadPk: **1337**  |  leadUuid: `812acf0a-7e23-48c7-a876-773a6769d104`
  - accountPk: **164**
  - approvedAmount: 4730  |  esignClient: SIGNWELL
  - DB final `account_status`: **`CANCELLED`** (exact value — confirmed via direct SELECT post-run)
  - Activity log (real text): `"Refunding payments on account \nAccount status changed from ACTIVE to CANCELLED due to API test PP sweep"` (ts 2026-06-01T20:23:41Z)
  - **Sweep HTTP result: OK** — `triggerScheduledTask('cancelProtectionPlanSweep')` returned `resp.ok=true` (assertion passed)
- **AC mapping:** cancel + protection-plan sweep trigger accepted
- **Coverage assessment:** Partial-by-design (documented in spec). The sweep is a GLOBAL
  scheduled task — the test asserts only that the ops endpoint accepts the trigger (HTTP OK).
  Per-account PP effect is NOT asserted because state=CA does not offer a protection plan
  ("Protection plan was not offered" — CA regulatory restriction, not a bug; see
  `.claude/rules/testing.md` § E-sign Provider Routing). The spec defers end-to-end PP-sweep
  effect to `tests/e2e/origination/protection-plan-cancellation.spec.ts`. See gap G-001.

## Findings

| ID | Type | Severity | Priority | Description |
|----|------|----------|----------|-------------|
| F-001 | Test issue (FIXED this run) | S2 | P1 | Setup `submitApplication` lacked preceding `getMissingFields` + swallowed failure → `settleApplication: 500`. Fixed in-spec (getMissingFields + fail-fast assert). Cycle-1 failure; cycle-2 green. |
| F-002 | [OBSERVAÇÃO] | S3 | P3 | "with refund" scenario asserts refund log line presence only, not actual refund txn/amount in `uown_sv_credit_card_transaction`/`uown_sv_achpayment`. Lease had no captured payments → no money movement to assert. Not a product bug. |
| F-003 | [OBSERVAÇÃO] | S4 | P3 | Implementer's hypothesised spelling variant (`CANCELED`) did NOT occur — dev3 backend writes `CANCELLED` (double-L) in `uown_sv_account.account_status`. No string adjustment needed. Volatile — re-verify per env. |
| F-004 | [OBSERVAÇÃO] (out of scope) | S3 | P3 | `src/scripts/svc-460-perf-report.ts` has encoding/corruption causing `tsc --noEmit` errors (TS1127 invalid character). Pre-existing, unrelated to this spec; the spec file itself is tsc-clean. Flag to qa-doc-keeper/qa-debugger. |

## Coverage assessment vs Risk

| Risk area | Risk level | Scenarios covering | Adequate? |
|-----------|------------|--------------------|-----------|
| Account reaches CANCELLED after cancel | High | 1, 2, 3 | ✅ DB status asserted + verified post-run |
| Cancellation activity log present (CLAUDE.md #13) | High | 1, 2, 3 | ✅ real log text captured per scenario |
| Refund path distinct from no-refund | Medium | 1 vs 2 | ⚠️ Log-line distinction only; money-movement not asserted (F-002) |
| Protection-plan sweep behaviour | Medium | 3 | ⚠️ HTTP-OK only; per-account effect deferred to e2e (G-001) |

## Gaps (follow-up — NOT blocking PASS)

- **G-001:** Per-account protection-plan sweep effect not asserted (CA does not offer PP). To
  assert plan swept to cancelled/refunded state, need a fresh non-CA account with a real
  protection plan. Covered e2e in `protection-plan-cancellation.spec.ts` per spec note.
- **G-002:** Refund money-movement (txn rows/amounts) not asserted in the refund scenario
  (F-002). Consider a scenario where the lease has at least one captured payment before cancel.

## Decisions
- **Bugs raised:** None confirmed as product bug. F-001 is a test-implementation fix applied
  this run; F-002/F-003/F-004 are observations.
- **Observations logged:** F-002, F-003, F-004 — no ticket. F-004 flagged for follow-up cleanup.
- **No DB mutations** performed beyond the test's own `cancelAccount` endpoint calls (read-only
  SELECTs used for verification; CLAUDE.md Exception 3 respected).

## Handoff
Ready for: **qa-doc-keeper**
- Feed application-lifecycle pitfall catalog: custom funding helpers MUST call `getMissingFields`
  before `submitApplication` and assert the submit (CLAUDE.md rule #11 — implicit requirement
  re-surfaced in this spec's bespoke `createAndDriveToFunding`).
- Note F-004 (`svc-460-perf-report.ts` tsc corruption) for cleanup.
- Coverage gaps G-001/G-002 are documented follow-ups, not blockers — pipeline closes green.

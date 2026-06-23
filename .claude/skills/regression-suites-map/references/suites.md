# Regression Suites — detailed per-suite descriptions and coverage

> Extracted from SKILL.md. For the decision matrix and activation criteria, see [../SKILL.md](../SKILL.md).

## Suite inventory

| Suite | Location | Coverage | Time | Tags |
|-------|----------|----------|------|------|
| **CI Unified Flow** | `tests/ci/unified-flow.spec.ts` + `tests/e2e/unified-flow.spec.ts` | 1 end-to-end journey (origination -> settle -> fund -> servicing payments -> website OTP) | ~10-12 min (timeout 720s) | `@critical @regression @cicd` |
| **Smoke** | `tests/smoke/` (`new-application-funding.spec.ts`, `portal-flow.spec.ts`) | Health check post-deploy, 1-2 scenarios per portal | < 5 min | `@smoke` |
| **GowSign suite** | `tests/e2e/gowsign/` (18 specs) | Granular GowSign coverage: smoke, contract content, signature fields, iframe events, post-signing, recovery, modify-lease, lease-status, cross-role consistency, accessibility, servicing portal, provider lifecycle | 30-60 min | `@regression @smoke @priority-high @e2e @hybrid` |
| **Signing Regression (multi-state)** | `tests/e2e/signing-regression/multi-state-signing.spec.ts` | 47 allowed states + 4 blocked. GoSign + SignWell coexistence. Per-state happy-path: CC_AUTH_PASSED -> DB esign_document.client -> UI sign (GowSign frame OR SignWell flow) -> DB esign_document.status='COMPLETED' (coluna `status`, NAO `document_status`; valor `COMPLETED`, NAO `SIGNED`) -> activity log | 60-90 min in qa2 | `@${SUITE_ENV}` + per-block tags |
| **PayTomorrow Refund** | `tests/e2e/paytomorrow-refund-flow.spec.ts` | PT portal multi-tab -> fund -> refund -> UOWN status revert | ~15 min | `@critical @regression` |
| **TireAgent Unified Flow** | `tests/e2e/tire-agent-unified-flow.spec.ts` | Unified-flow variant specific to TireAgent | ~10 min | `@regression` |
| **Origination focused** | `tests/e2e/origination/` (7 specs) | `new-application`, `modify-lease`, `lease-cancellation`, `modify-approval-amount`, `protection-plan-cancellation`, `credit-card-decline-check`, `seon-e2e-flow` | ~5-10 min each | varies |
| **API regression** | `tests/api/` (4 specs) | `new-application-api`, `lease-cancellation-api`, `seon-id-verification-bypass`, `finalize-email-518-validation` | ~3-5 min each | varies |
| **Website OTP** | `tests/e2e/website/login-otp.spec.ts` | OTP via IMAP, account dropdown, sidebar navigation | ~5 min | `@regression` |
| **Email Sweeps (Servicing)** | `tests/e2e/servicing/email-sweeps-servicing.spec.ts` | 3 cenarios (S1 settledInFull, S2 RecurringPaymentReminder, S3 FirstPaymentReminder); trigger manual + DB assert via `uown_email_queue` (PK monotonico). 5/5 PASS dev3 2026-06-02 | ~5 min | `@regression` |
| **Servicing Sweeps (R1.53.0)** | `tests/e2e/servicing/{business,cc-rerun,document-dispatch,external-sync,payment-scheduling,report,funding-refund-report-content}-sweeps-servicing.spec.ts` | Familia de sweeps de servicing (business / CC-rerun / document-dispatch / external-sync / payment-scheduling / report / funding-refund-report-content); trigger manual + DB assert (`ORDER BY pk DESC`) | ~5-10 min | `@regression` |

## Suite cost (qa2 baseline)

| Suite | Average time | Parallelizable? | Typical frequency |
|-------|-------------|-----------------|-------------------|
| Smoke | 5 min | Yes | Per PR + post-deploy |
| Unified Flow (single) | 10-12 min | Per env | Per PR on critical flow, CICD nightly |
| Unified Flow dual-brand | 20-25 min | Yes (parallel projects) | Change in submit/Complete page |
| GowSign suite (18 specs) | 30-60 min | Yes (`@priority-high` subset = 10-15 min) | Change in template/iframe |
| Multi-state signing (47 states) | 60-90 min | Yes per GOWSIGN/SIGNWELL block | Change in routing/template/folder |
| PT Refund | 15 min | No (multi-tab) | Change in refund/funding |
| API regression | 3-5 min each | Yes | Whenever API client is touched |

## STATE_MATRIX and env-aware helpers

`/home/jose/projects/uown/automation/src/data/state-merchant-matrix.ts`

- `STATE_MATRIX` — 51 rows (47 allowed + 4 blocked)
- `ALLOWED_STATES` — 47
- `BLOCKED_STATES` — NJ, VT, MN, ME
- `GOWSIGN_STATES` / `SIGNWELL_STATES` — qa2 baseline (use env-aware helpers for other envs)
- `getGowsignStatesForEnv(env)` / `getSignwellStatesForEnv(env)` — respects `PROVIDER_ENV_OVERRIDES` (e.g. CA in stg -> SIGNWELL)
- `SMOKE_SUBSET` — 4 rows: CA, CO, AK, NJ (`@signing-smoke` tag)

Use **env-aware helpers**, not `GOWSIGN_STATES` directly (deprecated for cross-env).

## Detailed spec file listings

### A. Canonical CICD test — Unified Flow

`/home/jose/projects/uown/automation/tests/e2e/unified-flow.spec.ts`

Tag `@critical @regression @cicd`. Covers 7 phases: API account creation -> origination login -> contract -> settle + fund -> customer info -> servicing payments -> website OTP. **Always run on critical flow changes.**

### B. Signing Regression multi-state

`/home/jose/projects/uown/automation/tests/e2e/signing-regression/multi-state-signing.spec.ts`

- Lines 1-57: docstring with qa2 baseline routing + stg override + per-state happy-path flow
- Line 78-79: helpers `signGowSignInFrame` (GoSign) + `completeSignwellFlow` (SignWell)
- Lines 60-68: imports `STATE_MATRIX`, env-aware helpers
- Lines 94-99: `SUITE_ENV` resolved from `process.env.ENV` -> per-env tags

### C. STATE_MATRIX env-aware

`/home/jose/projects/uown/automation/src/data/state-merchant-matrix.ts`

- Lines 486-492: `PROVIDER_ENV_OVERRIDES` — CA stg -> SIGNWELL
- Lines 498-505: `getExpectedProviderForEnv(row, env)` — null for blocked
- Lines 508-515: `getGowsignStatesForEnv` / `getSignwellStatesForEnv`
- Lines 517-524: `SMOKE_SUBSET` (CA, CO, AK, NJ)

### D. GowSign suite (18 specs)

`/home/jose/projects/uown/automation/tests/e2e/gowsign/`:

- `gowsign-smoke-flow.spec.ts` — CT-01 smoke (CA + FifthAveFurnitureNY + $800)
- `gowsign-contract-content.spec.ts` + `*-qa2.spec.ts` — placeholders + content validation
- `gowsign-signature-fields.spec.ts` — fields rendering
- `gowsign-iframe-events.spec.ts` + `*-qa2.spec.ts` — postMessage events
- `gowsign-post-signing.spec.ts` — post-sign flows
- `gowsign-modify-lease-qa2.spec.ts` + `gowsign-modify-and-recovery.spec.ts` — modify + recovery
- `gowsign-recovery-qa2.spec.ts` — recovery isolated
- `gowsign-lease-status.spec.ts` — status transitions
- `gowsign-cross-role-consistency-qa2.spec.ts` — agent vs customer roles
- `gowsign-edge-and-accessibility-qa2.spec.ts` — accessibility + edge
- `gowsign-servicing-portal-qa2.spec.ts` — Servicing portal view
- `gowsign-provider-lifecycle-qa2.spec.ts` — vendor lifecycle
- `gowsign-create-contract.spec.ts` + `gowsign-signing-completion.spec.ts` + `gowsign-operations-and-fields.spec.ts`

Run `@priority-high` for quick subset (~15 min).

### E. PT Refund (external portal multi-tab)

`/home/jose/projects/uown/automation/tests/e2e/paytomorrow-refund-flow.spec.ts`

- Lines 1-25: business rule (PT polls UOWN, no webhook; 401 in staging)
- Lines 70-72: 3 tabs (PT portal, consumer finalize, UOWN origination)
- 15 min timeout, AK state, MSAPowersports merchant

### F. Dual-brand pattern (Memory mandate)

When implementing dual-brand for a submitApplication change, parametrize `testData` array and iterate:

```typescript
const testData = [
 { brand: 'UOWN', merchant: 'TireAgent', refCode: 'OW90218-0001', state: 'CA' },
 { brand: 'KORNERSTONE', merchant: 'FifthAveFurnitureNY', refCode: 'KS3015', state: 'NY' },
];
for (const data of testData) {
 test.describe(`${data.brand} - submit + lease-edit regression`,  => {
 test('CT-01 happy path submit', async ({ ... }) => { /* ... */ });
 test('CT-02 lease-edit re-issue (raise invoice + re-submit)', async ({ ... }) => {
 // OriginationCustomerPage.createNewInvoice at customer.page.ts:556
 // Re-fetch new redirectUrl from response
 // Open new Complete page -> submit -> assert single submit (useRef reset)
 });
 });
}
```

## [TODO: validate with user]

- **Tags `@signing-smoke` / `@signing-regression`:** the `SMOKE_SUBSET` (CA, CO, AK, NJ) is marked with `@signing-smoke` in the comment of `state-merchant-matrix.ts:521`, but the spec `multi-state-signing.spec.ts` reads tags dynamically from `SUITE_ENV_TAG`. Confirm if there is a canonical grep tag for "run only the signing-smoke subset".
- **CI Unified Flow:** `tests/ci/unified-flow.spec.ts` vs `tests/e2e/unified-flow.spec.ts` appear to be parallel variants. Commit 7ebdf33 "CI test" suggests the `tests/ci/` version is used by the internal CICD pipeline. Confirm with user which is the source of truth when both diverge (e.g. auth setup + internal cluster URL).
- **Test runner config:** confirm which `--project` to run for each suite (origination-ui, servicing-ui, api, etc) — `playwright.config.ts` should list.

# SPEC — svc#509 Refactor Request Objects for TMS Payment Endpoints

**Version:** v2 — 2026-05-22
**Supersedes:** v1 (2026-05-21) — **OBSOLETE**. v1 assumed UI-first via Servicing portal would exercise these endpoints. Cross-repo investigation (svc + svc-common + common + servicing + ams + origination + uwengine + los-common + configuration) on 2026-05-21 disproved that assumption. v1 is retained in git history only; do **not** consume.

## Status (2026-05-22)

- Phase A (scope + diff mapping): retained from v1 — diff against MR !1426 (`40c75c1c1`, merged) + MR !1449 (`3b4737630`, qa-in-process) is unchanged.
- Phase B (AC scope) **revised**: AC dev-focused (Bean Validation, field renames, mapper defaults) confirmed by user as dev contract, NOT QA AC — Q-B4 removed. QA validates externally observable behavior (HTTP status, response shape, DB state, activity log, `uown_sv_inbound_api_log`, regression of legacy `/uown/svc/...` flows that share the same internal service layer).
- Phase C (strategy) **inverted**: from UI-first to **API-first with UI preconditions**. Cross-repo grep found **zero internal callers** of `/uown/tms/v1/.../payments/credit-card`, `.../payments/ach`, `.../paymentArrangements`. `OpenApiConfig.java:80` (`pathsToMatch("/uown/tms/v1/**")`) confirms TMS is the **external partner surface** (Five9, IVR, readme.io). Servicing portal uses legacy `/uown/svc/makeCreditCardPayment(s)` and `/uown/svc/createOrUpdateACHPayment(s)`. Cai sob a exceção da regra inviolável #15 ("admin/ops endpoints with no UI exposed" — neste caso, partner-facing endpoints without an internal UI consumer).
- Phase D (open questions) **collapsed**: 4 blockers Q-B1..Q-B4 → **2 OBSERVATIONS pending Marcus** (paymentArrangements silent no-op + partial `@JsonAlias` on CC). Q-B2 (ACH refund) closed: confirmed REQUEST is the only mode that ever lived on the TMS public surface. Q-B3 (ArrangementType null) closed: default `NORMAL`, benign — kept as low-priority CT or droppable. Q-B4 closed per user.
- Env: **sandbox primary**, **qa1 fallback** (DV360 outage 2026-05-18 affects `sendApplication` in Origination — fluxo de setup; once a lease is funded, the TMS payment path is unaffected); **stg** for DoD smoke.
- T-shirt size: **S** (~2–3 days planning→report). Scope dropped: no UI Servicing extensive harness, no caller-migration CTs, no ACH refund/rerun (out of refactor scope). Net ~10–12 CTs, mostly direct API plus 1–2 hybrid setup paths.
- Ready for: **qa-implementer** (no blockers remain; 2 OBSERVATIONS are tracked but do not gate implementation).

---

## Source

- **GitLab issue:** <https://gitlab.com/uown/backend/svc/-/work_items/509>
- **Title:** Refactor Request Objects for TMS Payment Endpoints
- **MRs:**
  - !1426 — **merged** — `40c75c1c1` "Refactor payment arrangement DTOs and request mappings… Ensure backward compatibility with legacy payment structures."
  - !1449 — **qa-in-process** — `3b4737630` "[svc/-/work_items/509] refactor request objects tms" (CC + ACH single-payment refactor + new mappers + unit tests)
  - Follow-up commits cited below: `58e480e72` (partial `@JsonAlias("card")` on CC top-level), `56b878299` (PA revert — "removing TMS-style request objects and simplifying… directly use PaymentArrangementDto"), `126e1901a` (`VALIDATION_ERROR` → `BAD_REQUEST` on missing card)
- **Notion (Marcus, Old vs New JSON):** <https://www.notion.so/Refactor-Requests-of-TMS-Payments-Old-vs-New-JSON-3569b086f67a808885c8d3ab944615fe>
- **TMS readme.io:**
  - <https://uown-tms.readme.io/reference/processcreditcardpayment>
  - <https://uown-tms.readme.io/reference/processachpayment>
  - <https://uown-tms.readme.io/reference/processpaymentarrangement>
- **Endpoints in scope (all 3 on `TmsPaymentController`):**
  - `POST /uown/tms/v1/accounts/{accountId}/payments/credit-card` (`processCreditCardPayment`)
  - `POST /uown/tms/v1/accounts/{accountId}/payments/ach` (`processACHPayment`)
  - `POST /uown/tms/v1/accounts/{accountId}/paymentArrangements` (`processPaymentArrangement`)

### One-line problem statement

Three TMS payment endpoints accepted the **internal** domain POJOs `CCTransactionInfo`, `ACHPayment`, and the old `PaymentArrangement` as their HTTP request bodies — exposing 30+ internal/audit fields (`uuid`, `vendorACHStatus`, `settlementId`, `returnCode`, `originalCCPk`, `creditCardTransactionPk`, `paymentPK`, …) that are server-owned and must not be set by the API consumer. Marcus refactored them into purpose-built request DTOs (`CreditCardPaymentRequest`, `AchPaymentRequest`, `PaymentArrangementRequest` + nested `CardDetails`, `BankAccountDetails`, `BillingAddress`) with standardized naming, only consumer-relevant fields, explicit required/optional, cross-field validation (`@AssertTrue isExclusiveCardMode` / `isExclusiveBankInstrument`), and mappers that convert request DTO → internal POJO inside `TmsPaymentController`.

### One-line QA scope statement

Refactor (not new feature) of **request shape only** on a **partner-external surface** (no internal callers in svc/servicing/ams/origination/uwengine/los-common/configuration). Internal service logic, persistence, allocation engine, vendor integrations (Tilled, ACH/Repay), sweeps (rerunCC, sticky-recover) and webhooks (sticky/USAEPay/OmniFund) are untouched. QA's job is to prove **wire-contract correctness** via direct REST calls (API-first), with UI used only as a setup accelerator (`driveLeadToFunding` → funded account → fire TMS request). Multi-layer validation per CT: HTTP status + response shape + DB rows (`uown_sv_*`) + activity log (`uown_los_lead_notes`, regra #14) + inbound API log (`uown_sv_inbound_api_log`).

---

## Diff Mapping — what actually changed (from real `git show` of MR !1426 + !1449 + post-merge commits)

### A. New request DTO files (under `com.uownleasing.svc.dto.tms.request`)

| File | Purpose | Required fields | Optional fields | Cross-field validation |
|------|---------|-----------------|-----------------|------------------------|
| `CreditCardPaymentRequest.java` | Body of `POST /payments/credit-card` and inside `creditLines[]` of arrangement | `amount` (BigDecimal), `postingDate` (LocalDate) | `allocationStrategy`, `chargeFee` (**default `true`** via `@Builder.Default`), `comment`, `card` (`CardDetails`) — top-level field is `@JsonProperty("ccInfo") @JsonAlias("card")` per commit `58e480e72` | Controller throws **400** if `card == null` on standalone CC endpoint; arrangement allows null on follow-on lines (first line must include card per Javadoc) |
| `AchPaymentRequest.java` | Body of `POST /payments/ach` and inside `achLines[]` of arrangement | `amount`, `postingDate`, `bankAccount` (`BankAccountDetails`, `@Valid @NotNull`) | `allocationStrategy`, `comments` | — |
| `PaymentArrangementRequest.java` | Body of `POST /paymentArrangements` | At least one of `creditLines[]` or `achLines[]` | `paymentArrangement` (default `true`), `arrangementType` (enum `ArrangementType` — values `NORMAL` / `SETTLEMENT` per svc-common) | `@AssertTrue hasAnyPaymentLines()` |
| `CardDetails.java` | Nested in `CreditCardPaymentRequest.card` | Either `creditCardId` **OR** `ccNumber` | `ccFirstName`/`ccLastName`, `ccExp` (≤5 MM/YY), `cvc`, `autoPay`, `billingAddress` | `@AssertTrue isExclusiveCardMode` |
| `BankAccountDetails.java` | Nested in `AchPaymentRequest.bankAccount` | Either `bankAccountId` **OR** (`routingNumber` + `accountNumber`) | `bankName`, `accountHolderFirstName`/`LastName`, `designateAutoPay` (default `false`) | `@AssertTrue isExclusiveBankInstrument` |
| `BillingAddress.java` | Nested in `CardDetails.billingAddress` | none | `streetAddress1/2`, `city`, `state`, `zipCode` | — |

### B. New mapper files (`com.uownleasing.svc.mapper.tms`)

| File | Maps to | Notes |
|------|---------|-------|
| `TmsCCTransactionInfoRequestMapper` | `CreditCardPaymentRequest + accountId → CCTransactionInfo` (internal) | Branches on `creditCardId>0` (on-file) vs keyed. |
| `TmsAchPaymentRequestMapper` | `AchPaymentRequest + accountId → ACHPayment` (internal) | **Hardcodes `achProcessType=REQUEST`, `achType=ACHDebit`** — confirmed not a regression (see Section "Out of scope clarifications"). |
| `TmsPaymentArrangementRequestMapper` | (legacy mapper from `PaymentArrangementDto` — NOT refactored; see Section C) | Per commit `56b878299`, PA endpoint reverted to legacy DTO. |

Dev added `@Test` unit tests; QA does not duplicate.

### C. Controller changes (`TmsPaymentController`) — **REVISED for v2**

| Endpoint | Before | After (post-revert) | Status code on missing required |
|----------|--------|---------------------|---------------------------------|
| `POST /payments/credit-card` | `@RequestBody CCTransactionInfo` | `@RequestBody CreditCardPaymentRequest` — top-level `card` has `@JsonAlias("card")` AND `@JsonProperty("ccInfo")`; **internal fields of `CardDetails`/`BankAccountDetails` have NO aliases** | 400 (`BAD_REQUEST`) |
| `POST /payments/ach` | `@RequestBody ACHPayment` | `@RequestBody AchPaymentRequest` — **NO `@JsonAlias` at any level** | 400 |
| `POST /paymentArrangements` | `@RequestBody TmsPaymentArrangement` (legacy) | **REVERTED in commit `56b878299` back to `PaymentArrangementDto`** (legacy shape with `creditCardTransactions[]`/`achPayments[]`); `runTransactions` reads legacy fields only | 400 / silent no-op (see OBSERVATION-2) |

### D. Wire-contract classification — **breaking but partner-cushioned + PA quietly inconsistent**

- **CC top-level alias works**: client may send either `{"card": {...}}` or `{"ccInfo": {...}}` — both deserialize.
- **CC internal fields renamed without alias**: `creditCardPk` → `creditCardId`, `bankAccountPk` → `bankAccountId`, `isAutoPay` → `designateAutoPay`, `bankData` envelope → `bankAccount`. Clients holding the legacy internal names → behavior **unknown** (silent ignore vs 400) — covered by CT-08a/b.
- **ACH no aliases**: full break for any partner on `bankData.*`. Covered by CT-09.
- **PA silent no-op**: post-revert (`56b878299`), endpoint accepts legacy `PaymentArrangementDto` shape (`creditCardTransactions[]`/`achPayments[]`). Clients sending "new" shape (`creditLines[]`/`achLines[]`) → fields silently ignored → HTTP 200 with 0 transactions processed. Covered by CT-10.
- **Default behavior changes:**
  - `chargeFee` defaults `true` via field initializer + `@Builder.Default`.
  - `AllocationStrategy` defaults to `Payment/EPO` (`DEFAULT`) when omitted.
  - `paymentArrangement` defaults to `true`.

---

## Scope Analysis

### IN scope (will test)

| # | Item | Why |
|---|------|-----|
| 1 | CC payment **today**, **card-on-file**, via direct TMS POST on a funded UOWN account | Happy path; new DTO + mapper card-on-file branch |
| 2 | CC payment **today**, **keyed card** (MasterCard 5500), via direct TMS POST | Mapper keyed branch + `BillingAddress` nesting |
| 3 | CC payment **scheduled future** (`postingDate = today+N`) | Different code path; cross-link to svc#514 webhook |
| 4 | ACH payment **today**, **keyed bank**, via direct TMS POST | Happy path ACH + `BankAccountDetails` keyed branch |
| 5 | ACH payment **today**, **bank-on-file** (`bankAccountId>0`), via direct TMS POST | Mapper on-file branch |
| 6 | Payment Arrangement via **legacy `PaymentArrangementDto` shape** (`creditCardTransactions[]` + `achPayments[]`) — happy path | Confirms post-revert endpoint still works for the documented shape |
| 7 | Bean Validation 400s (consolidated table-driven) — missing `card`, missing `bankAccount`, `isExclusiveCardMode` (both/neither), `isExclusiveBankInstrument` (both/neither), missing `amount`/`postingDate`, PA empty-lines under new shape | Single CT covers all `@AssertTrue` + `@NotNull` paths via API-only contract test |
| 8a | **OBSERVATION-1 verification (CC top-level alias works)** — POST CC with `{"ccInfo": {...}}` instead of `{"card": {...}}` → HTTP 200 | Validates `@JsonAlias("card")` at top level (commit `58e480e72`) |
| 8b | **OBSERVATION-1 verification (CC internal legacy names)** — POST CC with `card.creditCardPk=123` instead of `card.creditCardId=123` → document behavior (silent ignore + 400 because `creditCardId=0` fails `isExclusiveCardMode`? or some other path?) | Validates whether partial alias leaves legacy clients broken |
| 9 | **OBSERVATION-1 verification (ACH legacy field names)** — POST ACH with `bankData.routingNumber/accountNumber` instead of `bankAccount.routingNumber/accountNumber` → document HTTP status and DB outcome | Confirms no alias on ACH means partners must migrate |
| 10 | **OBSERVATION-2 verification (PA silent no-op)** — POST `/paymentArrangements` with NEW shape (`creditLines[]`/`achLines[]`) → expect HTTP 200 + zero rows persisted | Confirms Marcus's revert behavior; documents the silent contract drift |
| 11 | Allocation strategy preservation across the 2 single-payment endpoints (CC + ACH) — 3 enum values each (`Payment/EPO`, `Payment`, `EPO Only`) | Mapper passes through unchanged but worth a sweep |
| 12 | `chargeFee` default `true` (omitted in payload) → PROCESSING_FEE receivable created | Default-change verification (field initializer must hold under Jackson deserialization) |
| 13 | Dual-brand parity — CT-1 also runs against Kornerstone (`KS3015 / 5th Ave Furniture NY`) | Regra dual-brand floor; refactor exposed cross-brand |
| 14 | Activity log presence + content (shadow across CT-1, CT-4, CT-6) — `uown_los_lead_notes` patterns `[PaymentArrangement]`, `ACH%scheduled`, `CC payment%scheduled` | Regra inviolável #14 |
| 15 | Inbound API log regression — `uown_sv_inbound_api_log` row per request with FQCN `com.uownleasing.svc.rest.tms.TmsPaymentController.*` | Cross-link to svc#525; refactor must not break aspect |
| 16 | DB equivalence — `uown_sv_credit_card_transaction`, `uown_sv_ach_payment`, `uown_sv_payment_arrangement`, `uown_sv_receivable` rows match expectation | Functional equivalence of refactored wire path |

### OUT of scope (explicitly NOT testing) — clarified in v2

| # | Item | Why excluded |
|---|------|--------------|
| O1 | Servicing portal payment UI | **NO internal caller of these TMS endpoints**. Servicing uses `/uown/svc/makeCreditCardPayment(s)` and `/uown/svc/createOrUpdateACHPayment(s)`. Driving the UI would test the legacy controller, not the refactor. |
| O2 | ACH **REFUND** / **RERUN** / **RERUN_NSF** / **SCHEDULED** flows via TMS | These were **never** accessible via the TMS public surface — they live in `/uown/svc/refundPayment(s)` (`ACHPaymentService.java:373`), `ACHPaymentService.java:317/337`, Quartz sweep `CreateScheduledACHPaymentsSweep` (`ScheduledTaskService.java:711`). The `TmsAchPaymentRequestMapper` hardcoding `REQUEST` is **not a regression** — REQUEST is the only mode that ever lived on TMS public. Old Q-B2 from v1 is **closed**. |
| O3 | Caller migration of `servicing` / `ams` / `origination` / `uwengine` / `los-common` / `configuration` | Cross-repo grep found **zero callers**. Nothing to migrate. |
| O4 | NSF rerun sweep producing a new CC tx | `RerunCCPaymentsSweepService` does not go through `TmsPaymentController` — it calls service-layer directly. Out of refactor surface. |
| O5 | Mapper unit-test duplication | Dev added `TmsCCTransactionInfoRequestMapperTest`, `TmsAchPaymentRequestMapperTest`. |
| O6 | Tilled / USAEPay / OmniFund / Repay vendor sandbox behavior | Vendor logic is downstream of the mapper; refactor is shape-only. |
| O7 | Sticky.io recover sweep (svc#485) | Different endpoint, different sweep. |
| O8 | Vendor webhook callback dispatch (svc#514) | Webhook dispatch is `SvOutboundCall` — untouched by refactor. Cross-link only. |
| O9 | EPO / Payoff (`getPayoffAmount`) endpoints | Different controller. |
| O10 | CASH paymentType | Memory `feedback_cash_payment_not_used`. |
| O11 | Performance / load benchmarks | Shape-only refactor. |
| O12 | 13m/16m parity beyond a defensive single check (optional) | Refactor is wire-shape, not business logic. Merchant-config program differences exercise downstream services unchanged by the refactor. **Drop the 16m shadow unless residual risk emerges.** |

### AMBIGUOUS — OBSERVATIONS pending Marcus (NON-BLOCKING in v2)

CTs run against current `qa-in-process` behavior; OBSERVATIONS document findings and feed into report's improvements section. These do **not** block `qa-implementer`.

| ID | Observation | Why surface | Owner |
|----|-------------|-------------|-------|
| **OBSERVATION-1** | **Partial `@JsonAlias` on CC + zero alias on ACH.** Commit `58e480e72` added `@JsonProperty("ccInfo") @JsonAlias("card")` ONLY on top-level `card` of `CreditCardPaymentRequest`. Internal fields (`creditCardId`/`creditCardPk`, `bankAccountId`/`bankAccountPk`, `designateAutoPay`/`isAutoPay`, envelope `bankAccount`/`bankData`) are renamed without alias. ACH has no alias at any level. → External partners holding the legacy field names (`creditCardPk`, `bankData.*`, `isAutoPay`) likely fail silently or with 400. Marcus's commit message on MR !1426 ("Ensure backward compatibility with legacy payment structures") suggests intent that may not be fully realized. CT-08a/b + CT-09 document actual wire behavior. | Marcus |
| **OBSERVATION-2** | **`/paymentArrangements` reverted to legacy `PaymentArrangementDto`.** Commit `56b878299` ("removing TMS-style request objects and simplifying… directly use `PaymentArrangementDto`") reverts PA to the legacy shape (`creditCardTransactions[]`/`achPayments[]`), while CC and ACH single-payment endpoints adopt the new DTOs (`CreditCardPaymentRequest`/`AchPaymentRequest`). `runTransactions` reads legacy fields only. Net: clients sending "new" shape (`creditLines[]`/`achLines[]`) hit 200 + 0 transactions (silent no-op). No commit comment explains the revert. CT-10 documents behavior; report flags it as an improvement candidate. | Marcus |
| OBSERVATION-3 (low) | Naming asymmetry survives: `comments` (ACH, plural) vs `comment` (CC, singular). Refactor objective stated "improve naming / standardize" — likely an oversight but matches DB column names. | Marcus |
| OBSERVATION-4 (low) | `ArrangementType` has no `@NotNull`. Default `NORMAL`, null silently behaves as `NORMAL` but activity log prints `"null"`. CT optional (P2) or drop. | Marcus |
| OBSERVATION-5 (low) | readme.io update status post-refactor — partner doc parity. | Marcus / DevRel |

---

## AC Coverage (externally observable, dev-internal contract excluded per user)

| AC# | Acceptance Criterion (externally observable) | Covered by CTs |
|-----|----------------------------------------------|----------------|
| AC-1 | `POST /payments/credit-card` accepts `CreditCardPaymentRequest` with `amount`, `postingDate`, `card`; persists CC tx functionally equivalent to legacy | CT-1, CT-2, CT-3 |
| AC-2 | `POST /payments/credit-card` returns **400 BAD_REQUEST** with `"card is required"` when `card == null` | CT-7 |
| AC-3 | `POST /payments/ach` accepts `AchPaymentRequest`; persists ACH equivalent to legacy | CT-4, CT-5 |
| AC-4 | `POST /payments/ach` returns **400** when `bankAccount == null` | CT-7 |
| AC-5 | `POST /paymentArrangements` accepts **legacy `PaymentArrangementDto`** shape (post-revert) with at least one CC or ACH child | CT-6 |
| AC-6 | Bean Validation (`@AssertTrue` + `@NotNull`) returns 400 with field-level error messages | CT-7 |
| AC-7 | `@JsonAlias("card")` allows top-level CC payload as either `"card"` or `"ccInfo"` | CT-8a |
| AC-8 | `chargeFee` defaults to `true` when omitted → PROCESSING_FEE receivable created | CT-12 |
| AC-9 | `AllocationStrategy` enum preserved end-to-end on CC and ACH endpoints | CT-11 |
| AC-10 | Inbound API log row in `uown_sv_inbound_api_log` created for each refactored endpoint | CT-15 |
| AC-11 | Activity log row in `uown_los_lead_notes` per business action (regra #14) | CT-14 |
| AC-12 | Dual brand parity (UOWN + Kornerstone KS3015) | CT-13 |
| AC-13 | DB equivalence (`uown_sv_credit_card_transaction`, `uown_sv_ach_payment`, `uown_sv_payment_arrangement`, `uown_sv_receivable`) | CT-1..CT-6, CT-16 |

---

## Risk Analysis

Scoring N+I+B+H × C+F+A. Bucket: P0 ≥60, P1 30–59, P2 10–29, P3 <10. Project-rule floors applied (regra #14 activity log, dual-brand, money-flow → float).

| Area | Risk | Why | Score | Bucket | Coverage |
|------|------|-----|-------|--------|----------|
| CC functional equivalence today, on-file | Silent regression in mapping (`card.creditCardId → CCInfo.creditCardPk`) breaking FK (Pitfall #1 in `payment-flows`) | N=3, I=2, B=1, H=2 → ×(C=2, F=3, A=1) = **48** | P0 floor (money) | **CT-1** |
| CC keyed + BillingAddress | Different mapper branch; cv c ≤5 char constraint | N=3, I=1, B=1, H=1 → ×(C=2, F=2, A=1) = **30** | P1 | **CT-2** |
| ACH equivalence (keyed + on-file) | Hardcoded `REQUEST/ACHDebit` could regress one-time ACH | N=3, I=2, B=1, H=1 → ×(C=2, F=3, A=1) = **42** | P0 floor | **CT-4, CT-5** |
| PA legacy shape happy path | Post-revert behavior; if revert was incomplete, full break | N=2, I=2, B=2, H=2 → ×(C=2, F=3, A=2) = **56** | P0 | **CT-6** |
| PA silent no-op under new shape | Partner sending new shape → 200 + 0 transactions = money silently not processed | N=2, I=2, B=2, H=2 → ×(C=2, F=3, A=2) = **56** | P0 | **CT-10** |
| Bean Validation surface | New `@AssertTrue` + `@NotNull`; if Validation not on classpath, 500 instead of 400 | N=3, I=1, B=2, H=0 → ×(C=1, F=2, A=2) = **30** | P1 | **CT-7** |
| `@JsonAlias` partial coverage (CC top-level works) | Partner-facing wire compat; if alias broken, all CC fails | N=3, I=1, B=1, H=1 → ×(C=2, F=2, A=2) = **36** | P1 | **CT-8a** |
| `@JsonAlias` absent on internal CC fields | Partner sending `creditCardPk` → silent ignore + 400 from `isExclusiveCardMode` (`creditCardId=0` + ccNumber=null both fail) | N=3, I=1, B=2, H=1 → ×(C=2, F=2, A=2) = **42** | P1 | **CT-8b** |
| `@JsonAlias` absent on ACH | Full break on partners using `bankData.*` | N=3, I=1, B=2, H=1 → ×(C=2, F=2, A=2) = **42** | P1 | **CT-9** |
| `chargeFee` default `true` | Java field initializer + `@Builder.Default` under Jackson deserialization — needs explicit verification | N=3, I=1, B=2, H=2 → ×(C=2, F=3, A=1) = **48** | P0 floor (money) | **CT-12** |
| Allocation strategy preservation | Mapper passes through unchanged; null leak risk | N=2, I=1, B=2, H=2 → ×(C=2, F=3, A=1) = **42** | P1 | **CT-11** |
| Activity log presence | Regra #14 floor | n/a | **P0 floor** | **CT-14** |
| Inbound API log (svc#525) regression | Refactor must not break aspect | N=1, I=1, B=1, H=2 → ×(C=0, F=1, A=2) = **9** | P2 | **CT-15** |
| Dual brand (UOWN + KS) | Regra dual-brand floor | n/a | **P0 floor** | **CT-13** |
| Scheduled future CC | Date path divergence; cross-link svc#514 | N=2, I=2, B=1, H=1 → ×(C=2, F=3, A=1) = **36** | P1 | **CT-3** |

**Coverage chosen:** P0 + P1 = CT-1 through CT-15. P2 (inbound log) included as cheap regression. OBSERVATION-3/4/5 not actioned as CTs; surfaced in report.

---

## Test Strategy

### Approach: **API-first with UI preconditions**

The TMS payment endpoints have **no internal UI consumer** (cross-repo grep confirmed 2026-05-21). Servicing portal uses legacy `/uown/svc/...` endpoints. AMS/Origination/UWEngine/Configuration have no matches. The TMS surface is **external**, consumed by Five9, IVR, and readme.io-documented partners. Per regra inviolável #15: this is the explicit exception path ("admin/ops endpoints with no UI exposed"). API-first is **not** a UI-first violation here — it's the correct strategy for a partner-external endpoint.

**Direct API call pattern:**
- Reuse existing `BaseClient` (`src/clients/base.client.ts`) extended for TMS surface (or a thin new `TmsPaymentClient` if none exists; check helpers-catalog skill).
- Authentication per TMS public surface (Bearer / API-key per environment `.env`).
- All payloads sent as raw JSON, hand-crafted per CT (NOT abstracted via UI builders) — this is the point.

**UI used ONLY for setup:**
- `driveLeadToFunding` (memory `payment-flows` §2) → funded account → `accountPk` captured.
- `CreditCardClient.createOrUpdateCreditCard` → pre-tokenize CC for on-file CTs (Pitfall #1 — tokenize before posting payment).
- Pre-save bank-on-file via prior ACH or direct DB read (no mutation, only capture existing `bank_account_pk`).
- **Merchant preflight** (regra inviolável #12): `ensureMerchantReady` runs inside `createPreQualifiedApplication` automatically. Default `AUTO_HEAL_MERCHANT=true`.

**Test Data Hierarchy** (memory `test-data-hierarchy`, regra #9): fresh lead per CT via `createPreQualifiedApplication` + `driveLeadToFunding`. **No** reuse of existing funded accounts (state contamination risk). Read-only DB throughout (regra security; no `UPDATE`/`INSERT`/`DELETE`).

**Environment:**
- **Primary: `sandbox`** — clean, no shared-environment risk.
- **Fallback: `qa1`** — DV360 outage 2026-05-18 affects Origination `sendApplication`; if `driveLeadToFunding` fails on qa1, retry sandbox. Once an account is funded, the TMS payment path itself is unaffected by the outage.
- **DoD: `stg`** — smoke before release.

**Suite layout:**
- `tests/api/svc-509-refactor-tms-payment-requests/` — all CTs live here (API-first).
- No `tests/e2e/svc-509-...` directory needed.
- `tags: ['@regression', '@svc-509', '@tms', '@payment']`

**Validation layers (every CT — regra #13 + #14):**
1. **HTTP** — status code (200/400), response body shape, error message text exact-match.
2. **DB** — `uown_sv_credit_card_transaction` / `uown_sv_ach_payment` / `uown_sv_payment_arrangement` (PK linkage) / `uown_sv_receivable` (allocation_status / receivable_type for PROCESSING_FEE). Use `db.waitForRecord` / `db.getSingleRow` polling.
3. **Activity log** — `uown_los_lead_notes` matching `notes ILIKE '%[PaymentArrangement]%'` / `'%ACH%scheduled%'` / `'%CC payment%scheduled%'` per memory `payment-flows` §9. Skill `activity-log-validation`. Real schema (no `note_type` column, per memory `reference_email_templates_catalog`).
4. **Inbound API log** — row in `uown_sv_inbound_api_log` with FQCN `^com\.uownleasing\.svc\.rest\.tms\.TmsPaymentController\.`. Pattern from existing `RU05.26.1.52.0_tmsLosControllersNotWrittenToInboundApiLog_525.spec.ts`.
5. **Float assertions** — `expect(Number(displayedAmount)).toBeCloseTo(Number(expectedAmount), 2)` (memory `feedback_float_repr_not_bug`).

---

## Scenarios (prioritized)

### CT-1 — [P0] CC payment today, **on-file card**, direct TMS POST (UOWN)
- **Type:** API-first (Hybrid setup via UI/API)
- **Technique:** Equivalence partitioning (valid — on-file branch)
- **Persona:** Partner integrator (Five9 / IVR backend) posting a CC payment for a funded customer.
- **Setup:**
  - `createPreQualifiedApplication` + `driveLeadToFunding` (UOWN merchant, NY, orderTotal $1500) → `accountPk`
  - `CreditCardClient.createOrUpdateCreditCard` → `creditCardPk` (Pitfall #1)
- **Steps:**
  1. POST `/uown/tms/v1/accounts/{accountPk}/payments/credit-card` with body:
     ```json
     {
       "amount": 50.00,
       "postingDate": "2026-05-22",
       "card": { "creditCardId": {creditCardPk} }
     }
     ```
  2. Capture response.
- **Validations:**
  - HTTP 200; `CCTransactionResult` shape.
  - DB: `uown_sv_credit_card_transaction` row with `account_pk={accountPk}`, `amount≈50.00`, `cc_transaction_type=REGULAR`, `status` ∈ {`PENDING`,`SUCCESSFUL`} (poll), `credit_card_pk={creditCardPk}`.
  - DB: `uown_sv_receivable` with `receivable_type=PROCESSING_FEE` row created (`chargeFee` defaults `true`).
  - **Activity log** (regra #14): `uown_los_lead_notes` matching `'%CC payment%scheduled%'` or `'%[PaymentArrangement]%'`.
  - Inbound API log: `uown_sv_inbound_api_log` row with method `processCreditCardPayment`.
- **Edge cases:** on-file mapper branch (`creditCardId>0`).
- **Pitfalls:** #1 tokenize first, #3 MasterCard 5500 for SVC, #7 float assertions.

### CT-2 — [P1] CC payment today, **keyed card** + BillingAddress, direct TMS POST
- **Type:** API-first
- **Technique:** Equivalence partitioning (valid — keyed branch); composition (nested `BillingAddress`)
- **Setup:** funded account; no pre-tokenization.
- **Body:**
  ```json
  {
    "amount": 75.00,
    "postingDate": "2026-05-22",
    "card": {
      "ccNumber": "5500000000000004",
      "ccFirstName": "Test", "ccLastName": "Person",
      "ccExp": "12/27", "cvc": "123",
      "billingAddress": { "streetAddress1": "1 Main St", "city": "NYC", "state": "NY", "zipCode": "10001" }
    }
  }
  ```
- **Validations:** HTTP 200; DB row with `keyed_card=true` (or equivalent flag), billing address persisted (verify table TBD by mapper inspection); Activity log + inbound API log identical to CT-1.
- **Pitfalls:** Pitfall #3 (MasterCard 5500), `ccExp ≤5` constraint.

### CT-3 — [P1] CC payment **scheduled future** (`postingDate = today+3`)
- **Type:** API-first
- **Technique:** Boundary (date)
- **Setup:** funded account + on-file CC
- **Validations:** CC tx row with `posting_date = today+3`, `status = PENDING` (no immediate processing). Cross-link svc#514 — refactor must not change webhook firing on processing day.
- **Activity log:** `'%CC payment%scheduled%future%'` (confirm exact prefix on first run per memory `payment-flows` §9).

### CT-4 — [P0] ACH payment today, **keyed bank**, direct TMS POST (UOWN)
- **Type:** API-first
- **Body:**
  ```json
  {
    "amount": 100.00,
    "postingDate": "2026-05-22",
    "bankAccount": {
      "routingNumber": "021000021",
      "accountNumber": "12345678",
      "bankName": "Chase",
      "accountHolderFirstName": "Test", "accountHolderLastName": "Person"
    }
  }
  ```
- **Validations:**
  - HTTP 200; `AchPaymentResponse` shape.
  - DB: `uown_sv_ach_payment` row with `ach_process_type=REQUEST`, `ach_type=ACHDebit` (mapper hardcodes — verify), `customer_first_name`/`last_name` populated from `accountHolder*`.
  - **Activity log**: `'%ACH%scheduled%'`.

### CT-5 — [P1] ACH payment today, **bank-on-file** (`bankAccountId`), direct TMS POST
- **Type:** API-first
- **Setup:** funded account + pre-saved bank (capture `bank_account_pk` via read-only SQL on `uown_sv_bank_account` for the account, after a prior ACH).
- **Body:**
  ```json
  { "amount": 100.00, "postingDate": "2026-05-22", "bankAccount": { "bankAccountId": {bankAccountPk} } }
  ```
- **Validations:** HTTP 200; on-file branch in mapper used; DB equivalence vs CT-4.

### CT-6 — [P0] PaymentArrangement happy path via **legacy `PaymentArrangementDto`** shape (post-revert)
- **Type:** API-first
- **Technique:** Equivalence (valid) + composition
- **Setup:** funded account with past-due balance; pre-tokenize CC + pre-save bank
- **Body** (uses the legacy `PaymentArrangementDto` shape per commit `56b878299` revert):
  ```json
  {
    "creditCardTransactions": [
      { "amount": 25.00, "postingDate": "2026-05-22", "creditCardPk": {ccPk}, "chargeFee": true }
    ],
    "achPayments": [
      { "amount": 25.00, "postingDate": "2026-05-29", "bankAccountPk": {bankPk} }
    ],
    "arrangementType": "NORMAL"
  }
  ```
- **Validations:**
  - HTTP 200; `PaymentArrangementResponse` includes CC + ACH children.
  - DB: `uown_sv_payment_arrangement` row + linked `uown_sv_credit_card_transaction` (×1) + `uown_sv_ach_payment` (×1).
  - **Activity log** (regra #14): `'%[PaymentArrangement]%'`.

### CT-7 — [P1] Bean Validation 400 surface (table-driven)
- **Type:** API-first (table-driven Playwright fixture)
- **Sub-cases (one per row, all expect HTTP 400):**
  | Endpoint | Payload mutation | Expected error |
  |----------|------------------|----------------|
  | `/payments/credit-card` | `card: null` | `"card is required"` |
  | `/payments/credit-card` | `card: {}` (neither id nor ccNumber) | `"Provide exactly one of creditCardId or keyed card"` |
  | `/payments/credit-card` | `card: { creditCardId: 1, ccNumber: "4111..." }` | same `isExclusiveCardMode` msg |
  | `/payments/credit-card` | omit `amount` | `@NotNull` on `amount` |
  | `/payments/credit-card` | omit `postingDate` | `@NotNull` on `postingDate` |
  | `/payments/ach` | `bankAccount: null` | `@NotNull bankAccount` |
  | `/payments/ach` | `bankAccount: {}` | `isExclusiveBankInstrument` |
  | `/payments/ach` | both `bankAccountId` and keyed | `isExclusiveBankInstrument` |
  | `/payments/ach` | omit `amount` / `postingDate` | `@NotNull` |
  | `/paymentArrangements` | empty `creditCardTransactions` AND empty `achPayments` (legacy shape) | TBD — confirm whether `PaymentArrangementDto` has an analogous AssertTrue post-revert |
- **Validations:** HTTP 400 + error body text-contains assertion. No DB persistence; verify zero rows in `uown_sv_credit_card_transaction` / `uown_sv_ach_payment` for that test run.

### CT-8a — [P1] OBSERVATION-1: CC top-level `@JsonAlias("card")` works
- **Type:** API-first
- **Body** (uses legacy top-level key `ccInfo`):
  ```json
  {
    "amount": 50.00,
    "postingDate": "2026-05-22",
    "ccInfo": { "creditCardId": {ccPk} }
  }
  ```
- **Expected:** HTTP 200; persistence identical to CT-1. Confirms `@JsonAlias("card")` decorator on `CreditCardPaymentRequest.card`.
- **If FAIL (HTTP 400):** OBSERVATION-1 is bug-grade; promote to issue and flag in report.

### CT-8b — [P1] OBSERVATION-1: CC **internal** legacy field names (no alias)
- **Type:** API-first
- **Body** (uses legacy internal name `creditCardPk` inside `card`):
  ```json
  {
    "amount": 50.00,
    "postingDate": "2026-05-22",
    "card": { "creditCardPk": {ccPk} }
  }
  ```
- **Expected (working hypothesis):** Jackson silently ignores unknown field `creditCardPk`, so `creditCardId` resolves to 0 and `ccNumber` is null → `isExclusiveCardMode` triggers → HTTP 400 `"Provide exactly one of creditCardId or keyed card"`.
- **Validation:** Document actual HTTP status + error message + zero DB rows.
- **If silent 200 + 0 transactions:** that's a worse-grade silent failure; escalate to OBSERVATION-1 bug-promotion path.

### CT-9 — [P1] OBSERVATION-1: ACH legacy field names (no alias)
- **Type:** API-first
- **Body** (legacy `bankData.*`):
  ```json
  {
    "amount": 100.00,
    "postingDate": "2026-05-22",
    "bankData": { "routingNumber": "021000021", "accountNumber": "12345678", "bankName": "Chase" }
  }
  ```
- **Expected (working hypothesis):** `bankAccount` is null (legacy `bankData` ignored by Jackson) → `@NotNull bankAccount` → HTTP 400.
- **Validation:** Document actual behavior.

### CT-10 — [P0] OBSERVATION-2: `/paymentArrangements` silent no-op under "new" shape
- **Type:** API-first
- **Body** (sends the post-MR-!1426 "new" shape that the post-revert endpoint no longer reads):
  ```json
  {
    "creditLines": [{ "amount": 25.00, "postingDate": "2026-05-22", "card": { "creditCardId": {ccPk} } }],
    "achLines":   [{ "amount": 25.00, "postingDate": "2026-05-29", "bankAccount": { "bankAccountId": {bankPk} } }],
    "arrangementType": "NORMAL"
  }
  ```
- **Expected (working hypothesis):** HTTP 200 + zero CC tx and zero ACH tx persisted because `runTransactions` reads only `creditCardTransactions`/`achPayments` from `PaymentArrangementDto`.
- **Validation:**
  - HTTP status (200 or 400) — document.
  - DB: `uown_sv_payment_arrangement` row count delta (likely +1 row, empty children) AND `uown_sv_credit_card_transaction` / `uown_sv_ach_payment` row count delta = 0.
  - Activity log: presence (likely none if 0 transactions processed — confirm).
- **Report classification:** If 200 + 0 transactions, this is the worst-grade silent failure for a partner. Flag in report under "improvements" with high-priority recommendation: add `@AssertTrue` on `PaymentArrangementDto` to reject empty-children, or restore the new-shape handling. Per memory `bug-classification`, classify as `[OBSERVAÇÃO]` pending Marcus confirmation of intent.

### CT-11 — [P1] AllocationStrategy enum preservation (CC + ACH, 3 values each)
- **Type:** API-first (parametric)
- **Sub-cases:**
  - 11a: CC + `allocationStrategy = "Payment/EPO"` (DEFAULT) → both EPO and regular allocated.
  - 11b: CC + `allocationStrategy = "Payment"` (REGULAR_RECEIVABLES) → only regular.
  - 11c: CC + `allocationStrategy = "EPO Only"` → only EPO.
  - 11d-11f: same triplet for ACH.
- **Setup:** funded account + open EPO + regular receivables (`driveLeadToFunding` produces both).
- **Validations:** `uown_sv_receivable.allocation_status` reflects expected partition; `uown_sv_payment_arrangement.allocation_strategy` matches input.

### CT-12 — [P0] `chargeFee` default `true` (omitted in JSON)
- **Type:** API-first
- **Steps:** POST CC payment **without** `chargeFee` key.
- **Validations:** `uown_sv_receivable` row with `receivable_type=PROCESSING_FEE` created. Confirms Java field initializer (`boolean chargeFee = true;`) runs under Jackson deserialization (Jackson does NOT trigger `@Builder.Default`, but field initializers run on no-args construction).
- **Companion sub-case (P1):** Same POST with explicit `chargeFee: false` → no PROCESSING_FEE row.

### CT-13 — [P0 — dual-brand floor] Kornerstone parity of CT-1
- **Type:** API-first
- **Setup:** funded Kornerstone account via merchant `KS3015 / 5th Ave Furniture NY` (memory `reference_kornerstone_ks3015_qa2_only` — available sandbox/qa1/qa2/stg/dev as of 2026-05-18).
- **Steps:** Identical to CT-1.
- **Validations:** Identical to CT-1 plus `uown_sv_account.company='KORNERSTONE'`.

### CT-14 — [P0 — regra #14 floor] Activity log presence + content (consolidated)
- **Type:** Shadow across CT-1, CT-4, CT-6 (no separate CT body — assertions baked into those tests).
- **Pattern** (skill `activity-log-validation`):
  ```sql
  SELECT pk, notes, row_created_timestamp
    FROM uown_los_lead_notes
   WHERE lead_pk = $1
     AND row_created_timestamp >= $2
     AND notes ILIKE $3
   ORDER BY row_created_timestamp DESC LIMIT 1
  ```
  Patterns: `'%[PaymentArrangement]%'`, `'%ACH%scheduled%'`, `'%CC payment%scheduled%'`. Confirm exact prefix `[ServiceName][methodName]` on first run; schema has no `note_type` column (memory `reference_email_templates_catalog`).

### CT-15 — [P2] Inbound API log regression (svc#525)
- **Type:** API-first
- **Steps:** Trigger each of the 3 endpoints once; assert `uown_sv_inbound_api_log` row with FQCN `com.uownleasing.svc.rest.tms.TmsPaymentController.{processCreditCardPayment|processAchPayment|processPaymentArrangement}`.
- **Pattern reused:** `tests/api/inbound-api-log/RU05.26.1.52.0_tmsLosControllersNotWrittenToInboundApiLog_525.spec.ts`.

---

## Out-of-scope decisions (rationale)

| Decision | Justification |
|----------|---------------|
| No UI tests via Servicing portal | Zero internal callers of TMS endpoints; Servicing uses `/uown/svc/...`. Driving the UI tests the wrong controller. |
| No CTs for ACH refund / rerun / scheduled | These paths never lived on TMS public; live in `/uown/svc/refundPayment(s)` and Quartz sweeps. Out of refactor scope. |
| No NSF rerun via TMS | `RerunCCPaymentsSweepService` does not call `TmsPaymentController`. Out of surface. |
| No 16m program shadow | Refactor is wire-shape, not business logic; merchant-config differences exercise downstream services unchanged. **Drop** unless residual risk emerges. |
| No mapper unit-test duplication | Dev added. |
| No vendor sandbox (Tilled / Repay) tests | Vendor logic downstream of mapper. |
| No EPO / Payoff coverage | Different controller. |
| No CASH | Memory `feedback_cash_payment_not_used`. |
| No load / perf | Shape-only refactor. |
| No OpenAPI / Swagger CT | Stated objective is partner-facing; verification is cheap via manual readme.io diff with Marcus (OBSERVATION-5), not a Playwright test. |
| No idempotency CT | Behavior undocumented; refactor doesn't change service-layer dedup logic; risk too speculative for the surface. |

---

## Open questions (NON-BLOCKING — feed report as improvements)

| ID | Question | Owner | Action |
|----|----------|-------|--------|
| OBSERVATION-1 | Partial `@JsonAlias` on CC + zero alias on ACH — intentional partial backward-compat or oversight? | Marcus | CT-8a/b + CT-9 document actual behavior; report flags. |
| OBSERVATION-2 | `/paymentArrangements` revert to legacy `PaymentArrangementDto` — why? Document intent so QA can categorize correctly (silent no-op = bug vs intentional contract-narrowing). | Marcus | CT-10 documents; report flags. |
| OBSERVATION-3 | `comments` (ACH) vs `comment` (CC) — naming asymmetry intentional (matches DB columns) or oversight? | Marcus | Report only. |
| OBSERVATION-4 | `ArrangementType` lacks `@NotNull` — accept null = `NORMAL` or require explicit? | Marcus | Report only. |
| OBSERVATION-5 | readme.io update status post-refactor — partner doc parity? | Marcus / DevRel | Report only. |

**Resolved/closed from v1:**
- ~~Q-B1 backward compat~~ → split into OBSERVATION-1 (CC) + CT-9 (ACH) above.
- ~~Q-B2 ACH refund~~ → **closed**: REQUEST is the only mode ever on TMS public; refund/rerun/scheduled live in `/uown/svc/...` and Quartz, untouched.
- ~~Q-B3 ArrangementType null~~ → **closed**: default `NORMAL`, benign; demoted to OBSERVATION-4.
- ~~Q-B4 formal AC with Yuri~~ → **closed**: user confirmed AC dev-focused (Bean Validation, renames, mapper defaults) is dev contract, not QA AC; QA validates externally observable behavior.

---

## Cross-links

- Memory: `feedback_payment_ui_first_servicing` (overridden in this SPEC — see "Approach" section for why API-first applies here), `feedback_qa_flow_scope_dual_brand_lease_edit`, `reference_kornerstone_ks3015_qa2_only`, `feedback_cash_payment_not_used`, `feedback_float_repr_not_bug`, `project_dv360_uat_qa1_outage_2026_05_18`, `reference_get_scheduled_task_by_name`, `feedback_setup_via_ui_new_application` (applies to setup phase only)
- Skills: `payment-flows`, `activity-log-validation`, `risk-based-prioritization`, `scope-analysis`, `ui-first-principle` (explicit exception applied), `merchant-preflight`, `test-data-hierarchy`, `db-polling-pattern`, `bug-classification`, `api-client-pattern`
- Regras inviolaveis aplicadas: #12 (merchant preflight), #13 (data hierarchy), #14 (activity log), #15 (UI-first — explicit exception "admin/ops endpoints with no UI exposed", documented in Approach section)
- Adjacent: svc#514 (vendor webhook) — refactor must not break webhook firing; svc#525 (inbound API log) — refactor must not break aspect; svc#485 (sticky recover) — out of scope but adjacent

---

**Ready for: `qa-implementer`** — no blockers. OBSERVATIONS feed report improvements section.

---
last-reviewed: 2026-07-01
last-reviewed-sha: cd2d2c8bfd07cf5275f605c259a88838168e6a09
status: pending-implementation
covers:
  - docs/business-rules/01-fundamentos.md
  - docs/business-rules/02-originacao-pipeline.md
  - docs/business-rules/08-funding-merchants.md
target-implementation-files:
  # feature not built yet — add these to `covers:` (and drop the business-rules docs)
  # once the code exists, then bump last-reviewed + last-reviewed-sha:
  - svc/src/main/java/com/uownleasing/svc/service/application/ApplicationProcessor.java
  - svc/src/main/java/com/uownleasing/svc/service/application/GetSendApplicationService.java
  - svc/src/main/java/com/uownleasing/svc/pojo/ApplicationRequest.java
  - "<new> customer_identity table + Flyway migration (ssn_normalized UNIQUE, customer_uuid)"
  - "<new> HubSpot outbound integration (customer_uuid as external id)"
  - "<origination FE> customer detail surface for customer_uuid (UI location TBD)"
---

# Oracle: Unique Customer Identifier — `customer_uuid` (Origination `#1340`)

> **STATUS: PENDING IMPLEMENTATION.** This feature is **not yet built** (card `origination#1340`,
> milestone `RU07.26.1.54.0`, `workflow::ready-for-development`). Every checkpoint below is a
> **TARGET acceptance contract** grounded in the canonical business rules — **not** a live-validated
> observation. Do NOT report any CT as PASS until the feature ships AND the checkpoint is verified on a
> real env. When the code lands: swap `covers:` to the real implementation files, run a `discovery`
> pass (rule #18) to confirm the UI surface, and bump `last-reviewed` + `last-reviewed-sha`.

> Operation: on application save, the system assigns a persistent, externally-shareable customer
> identifier (`customer_uuid`, UUID v7) keyed by SSN — reused for returning customers — that propagates
> to servicing and to HubSpot. Validated from the Origination agent's view of `/customers/{leadPk}`,
> the servicing customer record, reporting, and the outbound HubSpot payload.

## Demand summary

- **Actor:** Origination agent (observes) · customer/applicant (triggers via new application) · business/marketing (consumes via reporting + HubSpot).
- **Goal:** give every customer a single persistent identifier that survives across applications and leases, **without relying on SSN**, so the same person is recognizable over time.
- **Value:** HubSpot integration + customer-lifecycle reporting on a PII-safe key (SSN never leaves the system).

## Scope decision (user, 2026-07-01)

- **NO legacy backfill.** Historical rows are NOT retroactively grouped. Consequence accepted: a
  returning real customer whose prior leases predate the feature gets a **fresh** `customer_uuid` on
  their next application; old leases stay unlinked. Reporting has a transition discontinuity.
- **Match key = SSN** (normalized, digits-only — same representation as `mainSSN`). **Delivered
  identifier = UUID v7 surrogate** — never the SSN itself.

## Impact analysis

| Rule / fact | Impact on this feature | Source |
|---|---|---|
| SSN is already the person key at submit — Hazelcast **`Application Request: SSN → UUID`** map prevents *simultaneous* duplicate applications | The persistent-UUID assignment MUST reuse/extend this lock (or a DB `UNIQUE(ssn)`) so concurrent same-SSN submits resolve to **one** UUID. This is the race guard. | `01-fundamentos.md:316` `[confirmed]` |
| **`previousLeadsCheck`** (Step 6) already scans all previous leads of the same SSN and cancels them / sums `consumedApprovalAmount` | The "find same-customer leads" logic already exists; the feature persists its key, it does not invent matching. | `12-produto-lease-deep-dive.md:657` `[confirmed]` |
| **`CANCELLED_DUP_SSN`** = "Cancelled by a newer lead with the same SSN" | Semantic tension: today duplicate SSN → cancel; feature wants duplicate SSN → **reuse UUID**. Both must hold: newer lead cancels older AND both share the same `customer_uuid`. | `06-conta-ciclo-vida.md:276` · `08-funding-merchants.md:806` `[confirmed]` |
| **Step 9 Duplicate Check** = email/phone/bank velocity (limit 3) — **NOT** by SSN | Must NOT be used as the customer key; must NOT be altered by the new assignment (regression, AC-08). | `02-originacao-pipeline.md:148-160` `[confirmed]` |
| LOS→SVC import already **deduplicates customers** | `customer_uuid` must survive import and land on the existing `uown_sv_customer` (no new customer row for a returning person); LOS value must equal SVC value. | `08-funding-merchants.md:72` `[confirmed]` |
| Additional-lease = same customer, another lease | An additional lease must inherit the same `customer_uuid`. | `07-modificacoes-conta.md` (additional-lease) `[confirmed]` |
| svc generates all UUIDs with `UUID.randomUUID()` (**v4**); no v7 lib present | UUID v7 needs a new dependency (e.g. `uuid-creator`) or PG18 `uuidv7()` — **confirm PG/JDK version**. v7 leaks creation timestamp externally (HubSpot) — accept or fall back to v4. | `svc/.../ApplicationRequest.java:418`, `GetSendApplicationService.java:129` `[confirmed 2026-07-01]` |
| Activity Log mandatory — "no log = nothing happened" (rule #13) | Recognizing a returning customer / assigning an identifier is a business action → expect a note. `[assumed]` — confirm the exact log on execution. | CLAUDE.md rule #13 |
| PII: SSN must never be shared externally | Delivered identifier is a UUID surrogate; a deterministic hash-of-SSN (UUID v5) is **forbidden** — a 9-digit SSN is brute-forceable, so a hash leaks the SSN. | Card business objective + `.claude/rules/security.md` |

## Acceptance Criteria

| ID | Criterion (observable outcome) | Testable? |
|---|---|---|
| AC-01 | A new customer (SSN never seen) gets a newly generated, valid `customer_uuid`. | Yes |
| AC-02 | An existing customer (same SSN) reuses the **same** `customer_uuid` on a new application/lease. | Yes |
| AC-03 | Two different customers (different SSN) get **different** `customer_uuid` values. | Yes |
| AC-04 | All applications/leases of one customer are correlatable by their shared `customer_uuid`. | Yes |
| AC-05 | `customer_uuid` propagates unchanged from LOS to `uown_sv_customer` on import (LOS value == SVC value). | Yes |
| AC-06 | Reporting can group/distinguish customers by `customer_uuid`. | Yes |
| AC-07 | `customer_uuid` (not SSN) is sent to HubSpot as the external customer id; SSN is never in the payload. | Yes |
| AC-08 | Existing flows unaffected: `CANCELLED_DUP_SSN`, `previousLeadsCheck`, Step 9 velocity gates, underwriting all behave as before. | Yes |
| AC-09 | Concurrent same-SSN submissions resolve to a **single** `customer_uuid` (no split). | Yes |
| AC-10 | Customer without SSN (ITIN) — defined, deterministic behavior. | **Pending** (discovery) |
| AC-11 | SSN corrected on an existing lead — defined re-mapping behavior. | **Pending** (discovery) |

## Scenarios

```gherkin
Feature: Unique persistent customer identifier across applications and leases
  As the UOWN business
  In order to recognize the same customer over time and share that identity safely with HubSpot
  The system must assign one persistent identifier per customer, keyed by SSN, reused across applications and leases

  Background:
    Given a merchant configured for new applications
    And the customer identifier feature is enabled

  Scenario: [negative] Duplicate-SSN cancellation still fires and the cancelled and new leads share one identifier
    Given a customer with SSN 100000053 already has a lead with a customer identifier
    When the same customer submits a newer application with the same SSN
    Then the older lead moves to status CANCELLED_DUP_SSN
    And the newer lead carries the exact same customer identifier as the cancelled lead

  Scenario: [negative] Two simultaneous applications for the same SSN resolve to a single identifier
    Given no customer identifier exists yet for SSN 100000061
    When two applications for SSN 100000061 are submitted at the same time
    Then both leads end up with one and the same customer identifier
    And no second customer identifier is created for that SSN

  Scenario: [negative] A customer without an SSN is handled by the defined no-SSN rule
    Given an applicant with no SSN on file (ITIN customer)
    When the applicant submits an application
    Then the customer identifier behaves per the defined no-SSN rule
    And the outcome is deterministic across repeated submissions by the same applicant

  Scenario: [negative] Correcting the SSN on an existing lead re-maps the identifier per the defined rule
    Given a lead was created under SSN 100000053 with a customer identifier
    When the agent corrects the SSN on that lead to 100000079
    Then the lead's customer identifier follows the defined SSN-correction rule
    And the identifier is consistent with any other lead that already carries SSN 100000079

  Scenario: [negative] SSN is never shared with the external integration
    Given a customer has a customer identifier
    When the customer record is synchronized to HubSpot
    Then the outbound payload contains the customer identifier as the external id
    And the outbound payload contains no SSN in any field

  Scenario: [positive] A brand-new customer receives a newly generated identifier
    Given no customer identifier exists yet for SSN 100000053
    When the customer submits their first application
    Then the lead shows a valid customer identifier
    And that identifier is registered against SSN 100000053

  Scenario: [positive] A returning customer reuses the same identifier on a second application
    Given a customer with SSN 100000053 already has a customer identifier
    When the same customer submits a second, separate application
    Then the second lead shows the exact same customer identifier as the first
    And a returning-customer recognition note is written to the activity log

  Scenario: [positive] Two different customers receive different identifiers
    Given customer A with SSN 100000053 and customer B with SSN 100000061 each submit an application
    Then customer A and customer B have different customer identifiers

  Scenario: [positive] All leases of one customer are correlated by the shared identifier
    Given a customer with SSN 100000053 has three leads over time
    When the leads are grouped by customer identifier
    Then all three leads return under the single identifier for that customer

  Scenario: [positive] The identifier propagates unchanged to servicing on import
    Given a lead with a customer identifier is moved to servicing
    When the servicing customer record is created for that lead
    Then the servicing customer record shows the exact same customer identifier as the origination lead

  Scenario: [positive] Reporting distinguishes customers by the identifier
    Given several customers each have leases under their own customer identifier
    When a report is grouped by customer identifier
    Then each customer's leases roll up under exactly one identifier
    And no two distinct customers share an identifier in the report

  Scenario: [positive] Assigning the identifier does not disturb the existing pipeline
    Given a customer submits an application that would pass underwriting normally
    When the application is processed
    Then the customer identifier is assigned
    And the previous-leads check, duplicate velocity limits, and underwriting result are unchanged from before the feature
```

## Checkpoints

### Oracle

> Every row is a **TARGET** (feature pending). `customer_uuid` = the delivered UUID v7; `customer_identity`
> = the proposed `(ssn_normalized UNIQUE, customer_uuid)` mapping table. UI surface for the value is a
> confirmed gap (see Pending). Prefer asserting on the value/consistency, not mere presence.

| CT | AC | Description | Expected (target) | Where / how to verify |
|---|---|---|---|---|
| CT-01 | AC-01 | New customer gets a valid identifier | `customer_uuid` non-null, well-formed UUID **v7** (version nibble = 7), unique | Lead's customer record (UI location TBD) + `customer_identity` row for `ssn_normalized='100000053'` |
| CT-02 | AC-02 / AC-04 | Returning customer reuses the identifier | 2nd lead's `customer_uuid` **byte-for-byte equal** to the 1st lead's | Compare the value on both leads' customer records; single `customer_identity` row for that SSN |
| CT-03 | AC-03 | Different customers differ | `customer_uuid(A) != customer_uuid(B)` for distinct SSNs | Two customer records; two distinct `customer_identity` rows |
| CT-04 | AC-04 | All leases correlate | Grouping N leads of one SSN by `customer_uuid` returns all N under one value | Reporting / query grouped by `customer_uuid` |
| CT-05 | AC-05 | LOS→SVC consistency | `uown_sv_customer.customer_uuid` == origination lead's `customer_uuid` (same value, not a new one) | Origination customer record value vs servicing customer record value for the same person |
| CT-06 | AC-06 | Reporting distinguishes customers | Each customer's leases roll up under exactly one identifier; no shared identifier across distinct customers | Report grouped by `customer_uuid` |
| CT-07 | AC-07 | HubSpot gets UUID, never SSN | Outbound HubSpot payload external-id field == `customer_uuid`; **no** SSN present in any field | Outbound integration request (network/log capture) |
| CT-08 | AC-08 | DUP_SSN coexists with reuse | Older lead → `CANCELLED_DUP_SSN`; newer lead carries the **same** `customer_uuid` as the cancelled one | Older lead status + both leads' `customer_uuid` equal |
| CT-09 | AC-09 | Concurrency → single identifier | Two simultaneous same-SSN submits → exactly **one** `customer_identity` row; both leads share it | `SELECT count(*) FROM customer_identity WHERE ssn_normalized=…` returns 1; both leads' values equal |
| CT-10 | AC-08 | Existing pipeline unaffected | `previousLeadsCheck`, Step 9 velocity limits (`EMAIL_COUNT_FAILED`/`PHONE_COUNT_FAILED`), underwriting outcome identical to pre-feature baseline | Run a known baseline lead; compare statuses/decisions |
| CT-11 | AC-08 / rule #13 | Returning-customer recognition logged | Activity-log note written when an existing identifier is reused `[assumed — confirm exact text/surface on execution]` | `uown_los_activity_log` / lead notes + the UI log surface |
| CT-12 | AC-10 | No-SSN (ITIN) behavior | Matches the defined no-SSN rule; deterministic across repeats | **Pending** — define with PO, then verify |
| CT-13 | AC-11 | SSN correction re-mapping | Matches the defined SSN-correction rule; consistent with existing leads of the corrected SSN | **Pending** — define with PO, then verify |

### Staleness check command

```bash
# Feature pending — covers currently points to the canonical business-rules that ground this contract.
git log cd2d2c8bfd07cf5275f605c259a88838168e6a09..HEAD -- \
  docs/business-rules/01-fundamentos.md \
  docs/business-rules/02-originacao-pipeline.md \
  docs/business-rules/08-funding-merchants.md
```

> Run from the qa-uown repo root. No output = grounding rules unchanged. Output = a covered rule moved →
> prepend `[BDD MAY BE STALE]`. **After implementation**, replace `covers:` with the real code files and
> re-point this command at the origination/svc repos.

## Coverage matrix

| Acceptance Criterion | Scenario(s) / CT | Status |
|---|---|---|
| AC-01 — new customer gets identifier | CT-01 · [positive] brand-new customer | Covered (target) |
| AC-02 — returning customer reuses identifier | CT-02 · [positive] returning customer reuses | Covered (target) |
| AC-03 — different customers differ | CT-03 · [positive] two different customers | Covered (target) |
| AC-04 — leases correlate by identifier | CT-02, CT-04 · [positive] all leases correlate | Covered (target) |
| AC-05 — LOS→SVC consistency | CT-05 · [positive] propagates to servicing | Covered (target) |
| AC-06 — reporting distinguishes customers | CT-06 · [positive] reporting distinguishes | Covered (target) |
| AC-07 — HubSpot external id, no SSN | CT-07 · [negative] SSN never shared | Covered (target) |
| AC-08 — existing flows unaffected | CT-08, CT-10, CT-11 · [negative] DUP_SSN + [positive] pipeline undisturbed | Covered (target) |
| AC-09 — concurrency → single identifier | CT-09 · [negative] simultaneous same-SSN | Covered (target) |
| AC-10 — no-SSN (ITIN) behavior | CT-12 · [negative] no-SSN rule | Pending (discovery) |
| AC-11 — SSN correction re-mapping | CT-13 · [negative] SSN correction | Pending (discovery) |

## Pending items

1. **UI surface for `customer_uuid` (frontend gap):** the card is Origination-frontend but does not specify **where** the identifier is shown (customer detail header? a new field? not shown at all, query-only?). Run `/discovery` on `/customers/{leadPk}` once the FE lands to anchor CT-01/CT-02 checkpoints to a real DOM location.
2. **No-SSN / ITIN customers (AC-10):** does such a customer exist in this product? If yes, define the key (no reuse? fallback composite key?). PO decision → then scenario.
3. **SSN correction post-creation (AC-11):** the portal allows primary-applicant edits including SSN. Define whether correcting SSN re-maps the identifier, merges, or is blocked. PO decision → then scenario.
4. **Co-applicant / joint applicant:** the match key is the primary `mainSSN`; a co-applicant has no own identifier. Confirm this is acceptable or add a rule.
5. **Returning-customer activity log (CT-11):** confirm whether recognition writes a note and its exact text/surface (rule #13 expects one; currently `[assumed]`).
6. **UUID version + generation (design):** v7 needs a new dependency (svc is v4-only today) or PG18; v7 leaks creation timestamp to HubSpot. Confirm PG/JDK version and security sign-off, else fall back to v4.

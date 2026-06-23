# Test Scenarios — Add New York GowSign Template

> Origin: GitLab uown/backend/svc — "UOWN | SVC | Add New York GowSign Template" (Fernando Martins) · Milestone RU06.26.1.53.0 (release 2026-06-23, envs dev2/qa2)
> Knowledge base: skill [[gowsign-knowledge]] · discovery `docs/knowledge-base/new-york-gowsign-template.md` · sibling scenarios `docs/scenarios/ohio-gowsign-template.md`, `docs/scenarios/542-georgia-gowsign-template.md`
> Portal: Origination + Partner portals (PayTomorrow, TireAgent) · Interface: **UI-first** (rule #14 — rendering bugs only surface when the customer sees the PDF)
> Scope confirmed: **13-month SAC only** (template `NY_2025_SAC`, pk=16, is the only NY row deployed; NY has **no 16m template**) · Signwell NY baseline (`NY_SAC_LEASE_AGREEMENT` v110) is the **reference** contract for the comparison

## Demand summary

UOWN is migrating lease contract signing from **Signwell** (legacy) to **GowSign** (new provider) for the state of **New York (NY)**. The GowSign NY template `NY_2025_SAC` must render the New York **consumer rental-purchase agreement** — for the **13-month** plan — with the same descriptions, dynamic values, variables and calculations as the existing Signwell contract, signing successfully via the correct NY state flow across the Origination/consumer signing flow and the PayTomorrow/TireAgent partner portals.

> ⚠️ NY uses **"Rental-Purchase"** terminology (NY consumer-lease law), **not** "Lease-Purchase" — and this matches the Signwell NY baseline (BR-05). Do not treat "Rental-Purchase" as a defect.

## Impact analysis — product areas & business rules touched

| Area touched | Impact | Risk | Source |
|---|---|---|---|
| **E-sign provider routing for NY** | An NY lease must route to **GowSign** now that the `NY_2025_SAC` template row exists (qa2); without a template it falls back to the merchant's `esign_client` (Signwell) | **High** — wrong routing = wrong contract provider/text | [[gowsign-knowledge]] routing rule; KB BR / `.claude/rules/testing.md` § E-sign Provider Routing |
| **NY template availability (live)** | `uown_esign_document` rows for `NY_2025_SAC` are `client=GOWSIGN` in **qa2** (template created 2026-05-28) — qa2 NY routes to GowSign now; qa1/stg still fall back to Signwell | — | Live qa2 DB SELECT 2026-06-21 (primary; supersedes the stale `state-merchant-matrix.ts` NY row `→ SIGNWELL`, rule #16) |
| **State scoping (Scenario 4 / BR-01)** | The contract must identify itself as **New York** ("…-NY"), lessee "New York, NY", and must not leak another state's title/clauses; **Florida is allowed** solely as the Lessor's corporate domicile/forum (Tampa, FL) | **High** — wrong-state legal text | KB BR-01; Scenario 4 |
| **NY agreement wording (BR-05)** | Title "CONSUMER RENTAL-PURCHASE AGREEMENT-NY"; body uses "rental payment"/"Rental-Purchase" — matches Signwell baseline | **High** — legal correctness; do not "fix" to Lease-Purchase | KB BR-05 (Signwell DOCX L942 vs GowSign heading) |
| **Dynamic values / calculations (AC-03/AC-04)** | Every backend-computed variable must render as a concrete value in the document body | **High** — data integrity + legal correctness | KB "dynamic values" table; AC-03/AC-04 |
| **Rendered PDF (placeholders)** | No raw `{{token}}` may reach the customer-visible contract | **High** — repeat of Daniel's Jewelers CA empty-placeholder bug (2026-05-06) | [[gowsign-knowledge]] pitfall #1; rule #14 |
| **EPO / Promotional-Payoff day count (`epoDays`)** | The EPO sentences must state the concrete day count ("within **90** days"). **Was a confirmed migration regression** (blank in GowSign vs "90 days" in Signwell, BR-06) — **fixed in qa2 for R1.53.0** (`epoDays=90` now in the variables map; missing-token log gone) | **High** (was) → **resolved** — must stay green going forward | KB BR-06; live qa2 DB 2026-06-21 (lead 16812 `epoDays="90"`, no missing-token log) vs 2026-06-18 lead 16684 (blank) |
| **Pre-auth CC last-name match (BR-02)** | The consumer pre-auth ($40 hold) rejects ("Credit Card is invalid.") when the cardholder last name ≠ applicant last name — undocumented backend validation | Medium — blocks the whole signing flow if missed | KB BR-02 (`[UownClient][checkCCLastNameMatch]`) |
| **API-only signing blocked (BR-04)** | Signing cannot be driven API-only; `submitApplication` is rejected by **NeuroID** ("Failed to verify identification"). The contract is reachable only by driving the consumer flow in a real browser | — (defines test approach) | KB BR-04 |
| **Activity log (rule #13)** | Each signing event (sent → signed) must produce a visible activity-log entry + SIGNED status transition on the lead | Medium | rule #13 ("no log = nothing is happening") |
| **Signwell regression / baseline** | An NY lease with no eligible GowSign template (qa1/stg) must still sign via Signwell unchanged — and is the content-parity baseline | **High** — mandatory regression | [[gowsign-knowledge]] ("Regressão SignWell é OBRIGATÓRIA") |

**Dynamic variables to resolve (source: `uown_esign_document.request` variables map):** `contractAmount`, `costPrice`, `costPriceWithFeeNoTax`, `costOfLease`, `salesTax`, `processingFee`, `nextPaymentDueAmountWithTax`, `firstPaymentDueAmount`, `payOffAmountBeforeEPOExpiry`, `totalNumberOfPayments`, `numOfMonths`, `companyInfoBrandPhone`, and `epoDays` (now populated `=90`) — each must render as a concrete value, never as the raw token.

**Routing recipe (execution):** TireAgent `OW90218-0001` (ONLINE) + customer state **NY** + 13m → GowSign template `NY_2025_SAC` (qa2). Signing ceremony via `signGowSignInFrame` (`src/helpers/gowsign-signing.helper.ts`): Start → adopt → Sign All → confirmation-dialog **Finish**. Pre-auth: `VISA_APPROVED`/`4111…` on the UOWN gateway, cardholder last name = applicant last name (BR-02). `createPreQualifiedApplication` runs merchant preflight (rule #12).

## Scenarios

```gherkin
Feature: New York GowSign rental-purchase contract signing
  As a New York leasing customer
  I want to sign my 13-month rental-purchase agreement through GowSign
  So that I receive a correct New York contract identical in substance to the legacy Signwell version

  Background:
    Given a New York lead is created on an ONLINE merchant whose state routes to GowSign
    And a 13-month rental-purchase lease exists with cart, payment plan, processing fee and tax
    And the customer completes the credit-card pre-authorization and accepts the Terms of Agreement

  # ---------- State validation (Scenario 4 / BR-01) ----------

  Scenario: [positive] the contract identifies itself as the New York rental-purchase agreement
    Given the customer opens the New York GowSign contract to sign
    When the customer reads the agreement title and the lessee block
    Then the title identifies the agreement as a New York consumer rental-purchase agreement
    And the lessee is located in New York, NY

  Scenario: [negative] the New York contract does not leak another state's legal text
    Given the customer opens the New York GowSign contract to sign
    When the customer reviews the agreement clauses, fees and notices
    Then no other US state's title, reinstatement period, fee value or notice is shown
    And Florida appears only as the Lessor's corporate domicile, never as the governing state

  # ---------- Dynamic values & placeholders (AC-03 / AC-04) — the Daniel's Jewelers risk ----------

  Scenario: [negative] the New York contract never shows raw placeholders or broken tokens
    Given the GowSign contract is generated for the New York 13-month lease
    When the customer reviews the full agreement and its appendices
    Then no raw placeholder or broken field token is shown anywhere in the document

  Scenario: [positive] every calculated value renders as a concrete value on the contract
    Given the GowSign contract is generated for the New York 13-month lease
    When the customer reviews the price-tag box, payoff and Early Purchase Option sections
    Then the contract amount, cash price, cost of lease, sales tax, processing fee, weekly payment, first payment and promotional payoff amount each appear as the concrete value the backend computed for this lease
    And the number of months, number of payments and the Lessor brand phone all appear as concrete values rather than field names

  # ---------- EPO / Promotional-Payoff day count (BR-06 — regression now fixed) ----------

  Scenario: [positive] the Promotional-Payoff / Early Purchase Option states a concrete number of days
    Given the GowSign contract is generated for the New York 13-month lease
    When the customer reads the Promotional Payoff Option and the EARLY PURCHASE OPTIONS section
    Then the option states a concrete number of days (for example "within 90 days"), matching the Signwell baseline
    And the day count is never left blank

  # ---------- Content parity vs Signwell baseline (Scenario 3 / AC-02) ----------

  Scenario: [positive] the GowSign New York contract carries the full Signwell content baseline
    Given the legacy Signwell New York contract defines the expected clause structure and wording
    When the customer reviews the GowSign New York contract
    Then it contains every Signwell baseline clause (price-tag box, total of payments, cost of lease, cash price, property description, promotional payoff option, early purchase options, returned payment, late fee, reinstatement, ACH payment authorization, income interruption rights, electronic signatures, and the Mollie LLC Lessor identity)
    And it uses the New York "Rental-Purchase" title wording exactly as Signwell does

  # ---------- Signing completion across channels (Scenario 1 + 2 / AC-01) ----------

  Scenario: [positive] a New York customer completes the GowSign signing ceremony
    Given the customer is in the GowSign signing modal for the New York contract
    When the customer clicks Start, adopts a signature, clicks Sign All and confirms Finish
    Then the document reaches the completed state
    And the lead transitions to SIGNED
    And the e-sign document is recorded as GOWSIGN / NY_2025_SAC with a signed timestamp
    And an activity-log entry recording the completed signing appears on the lead

  Scenario Outline: [positive] a New York customer completes signing through each channel
    Given a New York 13-month lease ready to sign through <channel>
    When the customer completes the signing ceremony
    Then the contract is recorded as signed for the customer
    And an activity-log entry recording the completed signing appears on the lead

    Examples:
      | channel                        |
      | the consumer signing flow      |
      | the TireAgent partner portal   |
      | the PayTomorrow partner portal |

  # ---------- Pre-authorization rule (BR-02) ----------

  Scenario: [negative] the pre-authorization is rejected when the cardholder name does not match the applicant
    Given the customer is on the credit-card pre-authorization page of the New York contract
    When the customer submits a card whose cardholder last name differs from the applicant last name
    Then the pre-authorization is rejected as an invalid credit card
    And the contract is not created

  # ---------- Signwell regression (mandatory) ----------

  Scenario: [positive] a New York lease in an environment without the GowSign template still signs through Signwell
    Given a New York customer's environment has no GowSign NY template available
    When the customer completes the signing ceremony
    Then the contract is presented and signed through the existing Signwell experience
    And the contract is recorded as signed for the customer
```

## Coverage matrix

| # | Acceptance Criterion (ticket) | Scenario(s) | Priority |
|---|---|---|---|
| AC-01 | Verify/compare template behavior while signing using the correct NY state flow | "completes the GowSign signing ceremony", "completes signing through each channel", "identifies itself as the New York rental-purchase agreement", "does not leak another state's legal text" | P0 |
| AC-02 | Compare all contract descriptions/content vs the existing Signwell contract | "carries the full Signwell content baseline", "states a concrete number of days … matching the Signwell baseline" | P0 |
| AC-03 | Ensure calculated values, variables and template logic work | "every calculated value renders as a concrete value", "never shows raw placeholders or broken tokens", "Promotional-Payoff … concrete number of days" | P0 |
| AC-04 | Validate dynamic contract data populated correctly in GowSign | "every calculated value renders as a concrete value", "never shows raw placeholders or broken tokens" | P0 |
| QA-S1 | Scenario 1 — Origination / consumer signing flow + rendering | "completes the GowSign signing ceremony", "completes signing through each channel" (consumer row) | P0 |
| QA-S2 | Scenario 2 — Partner portals (PayTomorrow, TireAgent) | "completes signing through each channel" (TireAgent + PayTomorrow rows) | P0 |
| QA-S3 | Scenario 3 — Contract validation GowSign vs Signwell | "carries the full Signwell content baseline", "concrete number of days … matching the Signwell baseline" | P0 |
| QA-S4 | Scenario 4 — State validation (NY flow) | "identifies itself as the New York rental-purchase agreement", "does not leak another state's legal text" | P0 |
| BR-02 | Pre-auth CC last-name match guard | "pre-authorization is rejected when the cardholder name does not match the applicant" | P1 |
| REG | Signwell regression intact for non-eligible leads | "lease … without the GowSign template still signs through Signwell" | P0 |

Forward coverage: every AC and every ticket QA-scenario has ≥1 scenario. Backward coverage: every scenario traces to ≥1 AC/QA-scenario, no orphans.

## Execution status (2026-06-21, qa2)

Automated by `tests/e2e/gowsign/ny-gowsign-template.spec.ts` (`--project=cross-portal`, `ENV=qa2`). Mapping:

- **Test 1** — state scoping + no-leak (Scenario 4 / BR-01) + concrete values & no-raw-tokens (AC-04) + full GowSign signing ceremony → SIGNED + esign GOWSIGN/NY_2025_SAC + activity log (AC-01 / Scenario 1).
- **Test 2** — Signwell content baseline parity (AC-02 / Scenario 3) + value-for-value rendering of every backend variable (AC-03/AC-04).
- **Test 3** — EPO Promotional-Payoff day count renders (`epoDays`). **Flipped from an expected-failure guard to a positive assertion** now that BR-06 is fixed in qa2.

## Pending items / notes

- **P1 — PayTomorrow partner leg is BLOCKED by env wiring, not a product gap.** All PayTomorrow merchants authenticate against `merchant-staging.paytomorrow.com`, whose embedded UOWN contract iframe is `secure-sandbox.uownleasing.com` — leads land in **sandbox**, where `NY_2025_SAC` does not exist (qa2-only since 2026-05-28). So a NY lead via PayTomorrow renders the Signwell/PandaDocs contract, never GowSign. Also forces 16m via SSN-916, and NY has no 16m template. Unblock = deploy `NY_2025_SAC` to sandbox **or** wire a PayTomorrow account to qa2 (dev/infra dependency). The TireAgent partner leg **is** covered (ONLINE, customer-state-driven). `[inferred-high]` — KB "Gaps".
- **P2 — Signwell baseline is a committed clause/wording baseline**, taken from the stored Signwell DOCX (`NY_SAC_LEASE_AGREEMENT` v110, lead 16400), not a live two-provider PDF diff for the same cart (stg DB unreachable). A true same-lease side-by-side remains a sub-gap. `[CONFIRMED for clause/title parity]`.
- **P3 — Title wording sign-off (BR-05).** "CONSUMER RENTAL-PURCHASE AGREEMENT-NY" matches the Signwell baseline; confirm with product/legal before freezing as a permanent literal.
- **Decisive check for AC-02/03/04 is to open the rendered contract and read it**, never the e-sign DB status alone — placeholder/rendering bugs are invisible to API-only reads (rule #14; [[gowsign-knowledge]] pitfall #1).
- Float money is IEEE-754 — compare with tolerance, not equality ([[gowsign-knowledge]] pitfall #3).
- For a completed GowSign signing, `uown_esign_document.status = 'SIGNED'` (with `doc_signed_time_stamp` set), not `'COMPLETED'` — drift-prone, cross-checked live (lead 16661/16819). [[volatile-knowledge-registry]].

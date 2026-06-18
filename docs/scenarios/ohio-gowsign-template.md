# Test Scenarios — Add Ohio GowSign Template

> Origin: GitLab uown/backend — "UOWN | SVC | Add Ohio GowSign Template"
> Knowledge base: skill [[gowsign-knowledge]] · sibling scenarios `docs/scenarios/542-georgia-gowsign-template.md`
> Portal: Origination + Partner portals (PayTomorrow, TireAgent) · Interface: **UI-first** (rule #14 — rendering bugs only surface when the customer sees the PDF)
> Scope confirmed: **16-month SAC only** (template `OH_2025_SAC_16_MONTHS` is the only OH row deployed) · Signwell baseline is the **reference** contract for the comparison

## Demand summary

UOWN is migrating lease contract signing from **Signwell** (legacy) to **GowSign** (new provider) for the state of **Ohio (OH)**. The GowSign OH template must render the Ohio consumer lease-purchase agreement — for the **16-month SAC** plan — with the same descriptions, dynamic values, variables and calculations as the existing Signwell contract, across the Origination portal and the PayTomorrow/TireAgent partner portals.

## Impact analysis

| Area touched | Impact | Risk | Source |
|---|---|---|---|
| E-sign provider routing for OH | An OH lease must route to GowSign when an OH template row exists; otherwise it falls back to Signwell | **High** — wrong routing = wrong contract | [[gowsign-knowledge]] pitfall #8 (state with a GowSign template routes to GowSign) |
| OH template availability (live) | `uown_gow_sign_template` pk=21 `OH_2025_SAC_16_MONTHS` is **active in qa2** (created 2026-06-09) — so qa2 OH routes to **GowSign now** | — | Live DB SELECT on qa2, 2026-06-17 (primary source; supersedes the stale `state-merchant-matrix.ts` row `OH → SIGNWELL` dated 2026-04-28, rule #16) |
| OH contract content | All descriptions / Item 4 / Item 4a / EPO appendix / dynamic values / calculations must match the Signwell baseline | **High** — data integrity + legal correctness | Task AC list + Fernando's comment (2026-06-09) |
| Rendered PDF (placeholders) | No raw `{{token}}` may reach the customer-visible PDF | **High** — repeat of Daniel's Jewelers CA bug (2026-05-06) | [[gowsign-knowledge]] pitfall #1; rule #14 |
| OH item numbering 4 / 4a | OH **uses** Item 4 (Promotional-Payoff Option) and Item 4a (Lease-Purchase Ownership) — this is correct for OH (contrast with GA, where 4/4a was a state-leak negative) | **High** — wrong copy under the wrong item = legal error | Fernando's comment (explicit "Item 4" / "Item 4a") |
| State leakage | The OH contract must identify itself as Ohio and must not show another state's title, reinstatement period, or notices | **High** — wrong-state legal text | Scenario 4 (state validation) |
| Signwell regression / baseline | An OH lease with no eligible GowSign template (e.g. stg) must still sign via Signwell unchanged — and serves as the comparison baseline | **High** — mandatory regression | [[gowsign-knowledge]] rule #1 ("Regressão SignWell é OBRIGATÓRIA") |
| Activity log | Each signing event (sent / signed) must produce a visible activity-log entry on the lead | Medium | Rule #13 ("no log = nothing is happening") |

**Dynamic variables to resolve (Fernando's comment, 2026-06-09):** `{{costPriceWithFeeNoTax}}`, `{{totalNumberOfPayments}}`, `{{nextPaymentDueAmount}}`, `{{salesTax}}`, `{{contractAmount}}`, `{{companyInfoBrandPhone}}` — each must render as a concrete value, never as the raw token.

**Tooling available (execution phase):** PDF capture/compare via `src/helpers/contract-pdf.helper.ts` (money tolerance $0.01); GowSign page objects in `src/pages/gowsign/` + provider-agnostic `src/pages/signing/`; GowSign signing ceremony via `signGowSignInFrame` (`src/helpers/gowsign-signing.helper.ts`); Signwell via `completeSignwellFlow` (`src/helpers/signwell.helpers.ts`); partner-portal flow `src/pages/origination/paypair-portal.page.ts`; multi-state regression `tests/e2e/signing-regression/multi-state-signing.spec.ts` (auto-covers OH once the matrix row flips). Merchant: `TerraceFinance` (`OL90202-0001`, ONLINE, programs 13m + 16m).

## Scenarios

```gherkin
Feature: Ohio GowSign lease contract signing
  As an Ohio leasing customer
  I want to sign my 16-month lease-purchase agreement through GowSign
  So that I receive a correct Ohio contract identical in substance to the legacy Signwell version

  Background:
    Given an Ohio merchant is configured for leasing through GowSign
    And an Ohio 16-month SAC lease exists with cart, payment plan, processing fee and tax

  # ---------- State validation (Scenario 4) — negatives first ----------

  Scenario: [negative] the Ohio contract never shows another state's agreement title
    Given the customer opens the Ohio GowSign contract to sign
    When the customer reads the agreement title
    Then the title identifies the agreement as an Ohio consumer lease-purchase agreement
    And no other state's agreement title is shown

  Scenario: [negative] the Ohio contract does not leak another state's legal text
    Given the customer opens the Ohio GowSign contract to sign
    When the customer reviews the agreement clauses, fees and notices
    Then no reinstatement period, fee value, or notice belonging to another state is shown

  # ---------- Dynamic values & placeholders (AC-03, AC-04) — the Daniel's Jewelers risk ----------

  Scenario: [negative] the Ohio contract never shows raw placeholders or broken tokens
    Given the GowSign contract is generated for the Ohio 16-month lease
    When the customer reviews the full agreement and its appendices
    Then no raw placeholder or broken field token is shown anywhere in the document

  Scenario: [positive] every dynamic variable resolves to a concrete value on the Ohio 16-month contract
    Given the GowSign contract is generated for the Ohio 16-month lease
    When the customer reviews the payoff, ownership and Early Purchase Option sections
    Then the cost price, number of payments, payment amount, sales tax, total cost and brand phone all appear as concrete values rather than field names

  # ---------- EPO content per Fernando's comment (Item 4 / 4a / footnote / appendix) ----------

  Scenario: [positive] Item 4 shows the Promotional-Payoff Option with concrete amounts
    Given the GowSign contract is generated for the Ohio 16-month lease
    When the customer reads Item 4, Promotional-Payoff Option
    Then the payoff text states a concrete purchase price plus tax, less on-time rental payments, plus daily lease fees from lease inception through the current date
    And it states that any late payment voids the option

  Scenario: [positive] Item 4a states Lease-Purchase Ownership and the Early Purchase Option election
    Given the GowSign contract is generated for the Ohio 16-month lease
    When the customer reads Item 4a, Lease-Purchase Ownership
    Then the text states the customer may elect the Early Purchase Option at any time while current
    And it states that a concrete number of on-time payments of a concrete amount plus a concrete sales tax totals a concrete Total Cost at which the customer owns the property

  Scenario: [positive] the lease purchase plan shows the Promotional Payoff footnote and the unpaid-balance EPO note
    Given the GowSign contract is generated for the Ohio 16-month lease
    When the customer reviews the lease purchase plan
    Then a footnote marks the plan as having a Promotional Payoff option
    And the plan states the Early Purchase Option is available off the unpaid balance

  Scenario: [positive] the EARLY PURCHASE OPTION appendix states the 16-month payoff formula and contact phone
    Given the GowSign contract is generated for the Ohio 16-month lease
    When the customer reviews the EARLY PURCHASE OPTION appendix
    Then the appendix states a 16-month term for ownership
    And the payoff price is the cost of the leased goods plus taxes plus applicable fees plus accrued daily lease fees from inception, less payments made excluding taxes and fees
    And a concrete brand phone number is shown to exercise the option

  # ---------- Content parity vs Signwell baseline (Scenario 3, AC-02) ----------

  Scenario: [positive] the GowSign Ohio contract matches the captured Signwell baseline for the same lead
    Given a Signwell baseline contract was captured for the Ohio lead before migration
    And a GowSign contract is generated for that same lead
    When the customer compares the two contracts side by side
    Then every dollar amount on the GowSign contract equals the Signwell baseline for that lead
    And the parties and header fields match the Signwell baseline

  Scenario: [positive] the Early Purchase Option payoff matches the Signwell baseline
    Given a GowSign contract and its Signwell baseline exist for the same Ohio lead
    When the customer compares the Early Purchase Option payoff on both contracts
    Then the payoff amount on the GowSign contract equals the Signwell baseline payoff for that lead

  # ---------- Signing completion across channels (Scenario 1 + 2, AC-01) ----------

  Scenario Outline: [positive] an Ohio customer completes signing through each channel
    Given an Ohio customer has a 16-month lease ready to sign through <channel>
    When the customer completes the signing ceremony
    Then the contract is recorded as signed for the customer
    And an activity-log entry recording the completed signing appears on the lead

    Examples:
      | channel                        |
      | the Origination portal         |
      | the PayTomorrow partner portal |
      | the TireAgent partner portal   |

  Scenario: [positive] the pre-authorization choice and signature capture complete the contract
    Given the customer is on the authorization page of the Ohio GowSign contract
    When the customer chooses a pre-authorization option and provides initials, signature and date
    Then the contract is recorded as signed for the customer

  # ---------- Signwell regression (mandatory) ----------

  Scenario: [positive] an Ohio lease in an environment without the GowSign template still signs through Signwell
    Given an Ohio customer's environment has no GowSign template available
    When the customer completes the signing ceremony
    Then the contract is presented and signed through the existing Signwell experience
    And the contract is recorded as signed for the customer
```

## Coverage matrix

| # | Acceptance Criterion (ticket) | Scenario(s) | Priority |
|---|---|---|---|
| AC-01 | Verify/compare template behavior while signing using the correct OH state flow | "completes signing through each channel", "pre-authorization choice and signature capture complete", "never shows another state's title", "does not leak another state's legal text" | P0 |
| AC-02 | Compare all contract descriptions/content vs the existing Signwell contract | "matches the captured Signwell baseline", "Early Purchase Option payoff matches the Signwell baseline", "Item 4 Promotional-Payoff Option", "Item 4a Lease-Purchase Ownership", "footnote and unpaid-balance EPO note", "EARLY PURCHASE OPTION appendix" | P0 |
| AC-03 | Ensure calculated values, variables and template logic work | "never shows raw placeholders or broken tokens", "EARLY PURCHASE OPTION appendix payoff formula", "Early Purchase Option payoff matches baseline" | P0 |
| AC-04 | Validate dynamic contract data populated correctly in GowSign | "every dynamic variable resolves to a concrete value", "Item 4a totals a concrete Total Cost" | P0 |
| QA-S1 | Scenario 1 — Origination portal signing flow + rendering | "completes signing through each channel" (Origination row) | P0 |
| QA-S2 | Scenario 2 — Partner portals (PayTomorrow, TireAgent) | "completes signing through each channel" (PayTomorrow + TireAgent rows) | P0 |
| QA-S3 | Scenario 3 — Contract validation GowSign vs Signwell | "matches the captured Signwell baseline", "Early Purchase Option payoff matches the Signwell baseline" | P0 |
| QA-S4 | Scenario 4 — State validation (OH flow) | "never shows another state's title", "does not leak another state's legal text", "Item 4 / Item 4a" (OH-specific copy) | P0 |
| REG | Signwell regression intact for non-eligible leads (rule #1) | "lease with no GowSign template still signs through Signwell" | P0 |

Forward coverage: every AC and every ticket QA-scenario has ≥1 scenario. Backward coverage: every scenario traces to ≥1 AC/QA-scenario, no orphans.

## Pending items (handoff to /discovery + preconditions)

- **P1 — 16-month only for OH.** The only OH row deployed is `OH_2025_SAC_16_MONTHS` (qa2, pk=21). Unlike GA (13m + 16m), there is **no 13-month OH template** today — 13m is out of scope until/unless a `OH_2025_SAC_13_MONTHS` row appears. Confirm with `getGowSignTemplatesForState(db, 'OH')` (`src/helpers/gowsign-template-db.helpers.ts:148`).
- **P2 — Exact OH agreement title string.** Fernando's comment says "Ohio Consumer Lease-Purchase Agreement"; the rendered title casing/suffix (e.g. `…-OH`) is inferred from the GA pattern and must be read off the live PDF before freezing a literal assertion → **/discovery** (do not invent — rule "never invent behavior").
- **P3 — Target env routing.** qa2 routes OH → **GowSign** (template active, confirmed live 2026-06-17). stg routes OH → **Signwell** (OH template assumed not deployed; stg DB was unreachable for direct confirmation — verify by the provider that renders when opening the stg signing URL). The Signwell regression/baseline scenarios run in stg; the GowSign scenarios run in qa2.
- **P4 — Capture the Signwell OH baseline (time-sensitive).** Content-parity scenarios (QA-S3) need a real Signwell OH PDF for the same lead profile (cart + plan + processing fee + tax) before OH flips to GowSign everywhere. Capture from stg now while OH still renders Signwell there.
- **P5 — Partner-portal reach for OH.** Confirm PayTomorrow + TireAgent partner flows can reach an OH-licensed merchant with an active 16-month program, and that the GowSign ceremony completes there (not only Origination) → **/discovery** + merchant preflight (rule #12).

**Notes**
- The decisive check for AC-02/03/04 is **open the rendered PDF and read it**, never read the e-sign DB status alone — placeholder/rendering bugs are invisible to API-only reads (rule #14; [[gowsign-knowledge]] pitfall #1).
- Float money representation (`18.46` vs `18.4599…`) is IEEE-754; compare with tolerance, not equality ([[gowsign-knowledge]] pitfall #3).
- E-sign document status lives in `uown_esign_document.status` with values `SENT_TO_CUSTOMER` (sent) and `COMPLETED` (signed) — not `SENT`/`SIGNED` ([[gowsign-knowledge]]).

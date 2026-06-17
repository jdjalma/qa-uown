# Test Scenarios — #542 Add Georgia GowSign Template

> Origin: GitLab uown/backend/svc#542 · "UOWN | SVC | Add Georgia GowSign Template" · Milestone `Uown | RU06.26.1.53.0` · Type: **development → ready-for-qa**
> Knowledge base: skill [[gowsign-knowledge]] · `docs/gowsign/provider-routing-and-template-selection.md` · `docs/gowsign/testing-and-regression-checklist.md`
> Portal: Origination + Partner portals (PayTomorrow, TireAgent) · Interface: **UI-first** (rule #14 — rendering bugs only surface when the customer sees the PDF)
> Scope confirmed: **13-month AND 16-month SAC** · partner-portal signing exercised **end-to-end** · Signwell baseline **captured live before migration**

## Demand summary

UOWN is migrating lease contract signing from **SignWell** (legacy) to **GowSign** (new provider) for the state of **Georgia (GA)**. The GowSign GA template must render the GA consumer lease-purchase agreement with the same descriptions, dynamic values, variables and calculations as the existing SignWell contract, across the Origination portal and the PayTomorrow/TireAgent partner portals, for both the 13-month and 16-month SAC plans.

## Impact analysis

| Area touched | Impact | Risk | Source |
|---|---|---|---|
| E-sign provider routing for GA | A GA lease must route to GowSign when a GA template row exists; otherwise it falls back to SignWell | **High** — wrong routing = wrong contract | `docs/gowsign/provider-routing-and-template-selection.md` (GowSign when `documentGroup==LEASE` **and** a template matches `state+clientType`) |
| GA template content | All descriptions / Items 1–21 / dynamic values / variables / calculations must match the SignWell baseline | **High** — data integrity + legal correctness | Task #542 Testing Steps (Fernando) + AC list |
| Rendered PDF (placeholders) | No raw `{{token}}` may reach the customer-visible PDF | **High** — repeat of Daniel's Jewelers CA bug (2026-05-06) | [[gowsign-knowledge]] pitfall #1; rule #14 |
| Merchandise price label | GowSign shows **Item Price**; SignWell showed **Cash Price** — expected difference, NOT a bug | Medium — risk of false-positive defect | Task #542 Testing Steps note |
| State leakage | GA contract must not show FL/TX/PA titles, FL item numbering (4/4a, return Item 9), FL 60-day reinstatement, TX delivery-schedule bullet | **High** — wrong-state legal text | Task #542 "Must not see" lists |
| SignWell regression | Leads not eligible for a GowSign template must still sign via SignWell unchanged | **High** — mandatory regression | [[gowsign-knowledge]] rule #1 ("Regressão SignWell é OBRIGATÓRIA") |
| Activity log | Each signing event (sent / signed) must produce a visible activity-log entry on the lead | Medium | Rule #13 ("no log = nothing is happening") |
| GA routing today | `state-merchant-matrix.ts` still has GA → `expectedProvider: 'SIGNWELL'` — this row flips to `GOWSIGN` as part of #542 | — | `src/data/state-merchant-matrix.ts` |

**Tooling available (execution phase):** PDF capture/compare via `src/helpers/contract-pdf.helper.ts` (`captureContractPdf` → `extractContractValues` → `crossValidateContract`, money tolerance $0.01); GowSign page objects in `src/pages/gowsign/` + provider-agnostic `src/pages/signing/`; partner-portal flow in `src/pages/origination/paypair-portal.page.ts`; multi-state regression `tests/e2e/signing-regression/multi-state-signing.spec.ts` (auto-covers GA once the matrix row flips).

## Scenarios

```gherkin
Feature: Georgia GowSign lease contract signing
  As a Georgia leasing customer
  I want to sign my lease-purchase agreement through GowSign
  So that I receive a correct Georgia contract identical in substance to the legacy SignWell version

  Background:
    Given a Georgia merchant is configured for leasing through GowSign
    And a Georgia lease exists with cart, payment plan, processing fee and tax

  # ---------- State validation (Scenario 4) — negatives first ----------

  Scenario: [negative] the Georgia contract never shows another state's agreement title
    Given the customer opens the Georgia GowSign contract to sign
    When the customer reads the agreement title
    Then the title reads "CONSUMER LEASE-PURCHASE AGREEMENT-GA"
    And no Florida, Texas, or Pennsylvania agreement title is shown

  Scenario: [negative] the Georgia contract does not use Florida item numbering
    Given the customer opens the Georgia GowSign contract to sign
    When the customer reviews the numbered items of the agreement
    Then the agreement does not use the Florida numbering 4/4a or "return Item 9"
    And Electronic Signatures appear as their own Item 21, not under Item 20

  Scenario: [negative] the Georgia contract does not use the Florida reinstatement period
    Given the customer opens the Georgia GowSign contract to sign
    When the customer reviews the reinstatement terms
    Then reinstatement is stated as 3 months / 50 days
    And the Florida 60-day reinstatement is not shown

  Scenario: [negative] the Georgia EPO page does not show the Texas delivery-schedule bullet
    Given the customer opens the Georgia GowSign contract to sign
    When the customer reviews the EARLY PURCHASE OPTION appendix
    Then no Texas delivery-schedule bullet is shown on the page

  Scenario: [negative] the agreement body does not show the Property Price Tag or an EPO payment chart
    Given the customer opens the Georgia GowSign contract to sign
    When the customer reviews the agreement body
    Then no Property Price Tag is shown before the agreement
    And no EPO payment chart is shown in the agreement body

  # ---------- Dynamic values & placeholders (AC-05, AC-06) — the Daniel's Jewelers risk ----------

  Scenario: [negative] the Georgia contract never shows raw placeholders or broken tokens
    Given the GowSign contract is generated for the Georgia lease
    When the customer reviews the full agreement and its appendices
    Then no raw placeholder or broken field token is shown anywhere in the document

  Scenario: [positive] dynamic variables are resolved to concrete values on the 16-month contract
    Given the GowSign contract is generated for a Georgia 16-month SAC lease
    When the customer reads the Promotional-Payoff Option in Item 8 and the EARLY PURCHASE OPTION appendix
    Then the payoff text shows a concrete dollar amount in place of the cost-price variable
    And the appendix shows a concrete brand phone number in place of the phone variable

  # ---------- Formatting & notice (Test 3, AC-07) ----------

  Scenario: [negative] item paragraphs are not rendered entirely in bold
    Given the GowSign contract is generated for the Georgia lease
    When the customer reviews Items 2 through 9
    Then only each item number and its heading bar are bold
    And the body paragraphs of those items are not bold

  Scenario: [negative] the lessee notice is shown in uppercase, not title case
    Given the GowSign contract is generated for the Georgia lease
    When the customer reads the signature notice
    Then the notice reads "NOTICE TO THE LESSEE:" in uppercase

  Scenario: [positive] the rental payment dates heading appears above the ACH initials table
    Given the GowSign contract is generated for the Georgia lease
    When the customer reviews the ACH page
    Then the "Rental Payment Dates" heading appears centered, bold and underlined above the initials table

  # ---------- ACH & appendices (Test 4, AC-08) ----------

  Scenario: [negative] the contract does not duplicate the ACH page or the plan grid
    Given the GowSign contract is generated for the Georgia lease
    When the customer reviews the ACH authorization and the lease purchase plan
    Then exactly one ACH Payment Authorization page is shown
    And exactly one lease purchase plan grid is shown

  Scenario: [positive] the ACH Payment Authorization page is complete
    Given the GowSign contract is generated for the Georgia lease
    When the customer reviews the ACH Payment Authorization page
    Then the bank fields are populated
    And two ACH initial rows are shown, one for the first payment and one for the recurring payment on the payment frequency
    And the returned-payment fee references Item 6

  # ---------- Content parity vs SignWell baseline (Scenario 3, AC-04) ----------

  Scenario: [positive] the GowSign contract matches the captured SignWell baseline for the same lead
    Given a SignWell baseline contract was captured for the Georgia lead before migration
    And a GowSign contract is generated for that same lead
    When the customer compares the two contracts side by side
    Then every dollar amount on the GowSign contract equals the SignWell baseline for that lead
    And the parties and header fields match the SignWell baseline

  Scenario: [positive] the merchandise table renders with the Georgia five-column structure
    Given the GowSign contract is generated for the Georgia lease
    When the customer reviews the merchandise table
    Then the table shows five columns with a blank fifth header
    And the price column is labeled "Item Price"

  Scenario: [positive] the Other Charges section shows the Georgia fee amounts
    Given the GowSign contract is generated for the Georgia lease
    When the customer reviews Item 4, Other Charges
    Then sub-items (a) through (e) are listed
    And the NSF fee is $15.00 and the late fee is $5.00 per frequency

  Scenario: [positive] the early purchase option uses the 90-day promo and matches the baseline payoff
    Given a GowSign contract and its SignWell baseline exist for the same Georgia lead
    When the customer reviews the EARLY PURCHASE OPTIONS appendix
    Then the promotional period is 90 days
    And the payoff amount equals the SignWell baseline payoff for that lead

  # ---------- Signing completion across channels (Scenario 1 + 2, AC-02, AC-03) ----------

  Scenario Outline: [positive] a Georgia customer completes signing through each channel
    Given a Georgia customer has a lease ready to sign through <channel>
    When the customer completes the signing ceremony
    Then the contract is recorded as signed for the customer
    And an activity-log entry recording the completed signing appears on the lead

    Examples:
      | channel                     |
      | the Origination portal      |
      | the PayTomorrow partner portal |
      | the TireAgent partner portal   |

  Scenario: [positive] the pre-authorization choice and signature capture complete the contract
    Given the customer is on the ACH page of the Georgia GowSign contract
    When the customer chooses a pre-authorization option and provides initials, signature and date
    Then the contract is recorded as signed for the customer

  # ---------- SignWell regression (mandatory, AC-10) ----------

  Scenario: [positive] a lease with no eligible GowSign template still signs through SignWell
    Given a customer whose state has no GowSign template available has a lease ready to sign
    When the customer completes the signing ceremony
    Then the contract is presented and signed through the existing SignWell experience
    And the contract is recorded as signed for the customer
```

## Coverage matrix

| # | Acceptance Criterion | Scenario(s) | Priority |
|---|---|---|---|
| AC-01 | Correct GA state flow — template renders the GA agreement, never another state | "never shows another state's title", "does not use Florida item numbering", "does not use Florida reinstatement", "no Texas delivery-schedule bullet" | P0 |
| AC-02 | Origination signing flow completes and renders | "completes signing through each channel" (Origination row) | P0 |
| AC-03 | Partner-portal signing completes (PayTomorrow + TireAgent) | "completes signing through each channel" (PayTomorrow + TireAgent rows) | P0 |
| AC-04 | Descriptions / content / Items 1–21 / amounts match SignWell baseline | "matches the captured SignWell baseline", "merchandise table five-column structure", "Other Charges Georgia fee amounts", "EPO uses 90-day promo and matches baseline payoff" | P0 |
| AC-05 | Calculated values, variables and template logic correct (no raw tokens) | "never shows raw placeholders", "EPO uses 90-day promo and matches baseline payoff" | P0 |
| AC-06 | Dynamic contract data populated (variables resolved) | "dynamic variables resolved to concrete values on the 16-month contract" | P0 |
| AC-07 | Formatting — bold scope, NOTICE uppercase, Rental Payment Dates present | "item paragraphs not entirely bold", "notice in uppercase", "rental payment dates heading above ACH initials" | P1 |
| AC-08 | ACH & appendices correct (single page/grid, two ACH rows, fee → Item 6) | "does not duplicate ACH page or plan grid", "ACH page is complete" | P1 |
| AC-09 | Both 13m and 16m terms render correct EPO/promo copy | "dynamic variables resolved on 16-month contract" (16m); **13m copy → pending P4** | P1 |
| AC-10 | SignWell regression intact for non-eligible leads | "lease with no eligible GowSign template still signs through SignWell" | P0 |

Forward coverage: every AC has ≥1 scenario (AC-09 partially — 13m copy is pending). Backward coverage: every scenario traces to ≥1 AC, no orphans.

## Pending items (handoff to /discovery + preconditions)

- **P1 — GA template not yet deployed (blocks execution, not authoring).** #542 is "To do"; the GA GowSign template row does not exist in any environment yet. These scenarios are authored against the target behavior and become executable once the template is deployed and `src/data/state-merchant-matrix.ts` flips GA from `SIGNWELL` to `GOWSIGN`. **Confirm target env (qa2 vs stg).**
- **P2 — Exact GA template name / clientType rows.** Pattern `GA_2025_SAC` is inferred from CA/NY (`CA_2025_SAC`, `NY_2025_SAC`). Confirm via `getGowSignTemplatesForState(db, 'GA')` (`src/helpers/gowsign-template-db.helpers.ts:148`) once deployed → **/discovery**.
- **P3 — GA merchant signing capability for partner flows.** Confirm the GA-licensed merchant (matrix shows `TerraceFinance`) supports GowSign and has **both** active 13m and 16m programs, and that PayTomorrow + TireAgent partner flows can reach a GA-licensed merchant with both terms → **/discovery** + merchant preflight (rule #12).
- **P4 — Exact 13-month EPO/promotional copy not provided.** Fernando's comment gives the literal 16-month SAC texts only (Item 8/8a, footnote, EPO appendix). The exact 13-month wording must be confirmed against the 13-month SignWell baseline before finalizing 13m content assertions — do **not** invent it (rule: never invent behavior).
- **P5 — Capture the SignWell GA baseline now (time-sensitive).** GA still routes to SignWell today; the live SignWell baseline window closes when #542 flips GA to GowSign. Capture a SignWell GA PDF for one lead (cart + plan + processing fee + tax) per term **before** the migration so Scenario 3 has a real comparison baseline.

**Notes**
- The decisive check for AC-04/05/06 is **open the rendered PDF and read it**, never read the e-sign DB status alone — placeholder/rendering bugs are invisible to API-only reads (rule #14; [[gowsign-knowledge]] pitfall #1).
- "Item Price" (GowSign) vs "Cash Price" (SignWell) on the merchandise table is an **expected** difference, not a defect (Fernando's Testing Steps).
- Float money representation (`18.46` vs `18.4599…`) is IEEE-754, compare with tolerance, not equality ([[gowsign-knowledge]] pitfall #3).

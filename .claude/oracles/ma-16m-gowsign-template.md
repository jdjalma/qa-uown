---
last-reviewed: 2026-07-02
last-reviewed-sha: e4713f2
covers:
  - src/helpers/gowsign-template-db.helpers.ts
  - src/data/state-merchant-matrix.ts
  - src/helpers/gowsign-signing.helper.ts
  - src/helpers/esign-db.helpers.ts
---

# MA 16-Month GowSign Template — Content & Routing Oracle (work item #583)

> Operation: validate the content and routing of the **`MA_2025_SAC_16_MONTHS`** template
> (Massachusetts, 16 months, SAC) rendered in the GowSign iframe/PDF, plus the 13m negative
> control (`MA_2025_SAC`). This operation is NEW (not covered by the precondition oracles). The
> preconditions (`send-application`, `new-application`, `cc-ach`, `terms-of-agreement`,
> `gowsign-signing`) already have their own oracle — REUSE, do not recreate.
>
> **MA is a SignWell→GowSign migration state.** `src/data/state-merchant-matrix.ts` row MA =
> `expectedProvider: 'SIGNWELL'` (TerraceFinance/Mollie) — that is the pre-#583 baseline. #583 adds
> the MA GowSign templates, so MA now routes GOWSIGN when a template exists for the effective state.
> **Action (qa-doc-keeper after render capture): update the matrix MA row to GOWSIGN.**
>
> **Routing rule (provider):** `effectiveState = INSTORE ? merchant.state : customerState`; if a row
> exists in `uown_gow_sign_template` for `(MA, client_type)` → GOWSIGN, else merchant `esign_client`
> (SIGNWELL fallback). The term (13 vs 16) comes from the merchant program / ABB EligibleTerms,
> NOT from the SSN suffix. `uown_esign_document.client`/`document_name` (created at CONTRACT_CREATED,
> after CC pre-auth) are the source of truth for selection.
>
> **⚠️ MA is NOT in the Appendix H 16-month EPO registry** (only CA/TX/FL/LA/NC/AL/TN/PA/OH/GA/NY
> are). The MUST/MUST-NOT content below is derived from the #583 acceptance criteria + the closest
> Appendix H baselines (R1 `exercise_date_promo`, R2 exercise-date EPO with the TX-style
> application-fee/tax-disclaimer tail, R3 `shared_16month_appendix`, R4 `shared_footnote`). Because
> no canonical MA text is frozen, CT-02..CT-07 are `[EXPECTED]` until frozen from a real rendered
> `MA_2025_SAC_16_MONTHS` (MCP-manual render, per the automation blocker below).
>
> **⚠️ Automation blocker (inherited from IL/AL siblings — confirm for MA):** the 16m term route is
> a Kornerstone ONLINE merchant whose `/complete` page carries the **NeuroID** anti-bot gate. Both
> API `submitApplication` and browser auto-advance are NeuroID-blocked; the only proven 16m render
> path is MCP-manual (fill CC → reload → "Sign Contract"). Therefore CT-02..CT-06/CT-08 for 16m are
> today validatable only by MCP-manual render unless a UOWN-gateway (non-NeuroID) route to a MA 16m
> lease is discovered. **Confirm the MA route before treating this as fully automatable.**
>
> **Primary sources:** #583 ticket capture
> (`docs/taskTestingUown/RU07.26.1.54.0_addMaGowSignTemplate_583/…_583.md`) ·
> `docs/business-rules/appendix-h-epo-template-registry.md` ·
> `docs/business-rules/03-contratos-esign.md` ·
> `docs/knowledge-base/illinois-gowsign-template.md` (sibling pattern) ·
> `docs/knowledge-base/16m-lease-and-gowsign-signwell-routing-qa2.md` (routing + NeuroID).

## Acceptance Criteria

| ID | Criterion | CT | Source |
|---|---|---|---|
| AC-01 | Lease MA 16m → template `MA_2025_SAC_16_MONTHS`; lease MA 13m → `MA_2025_SAC`; both client=GOWSIGN | CT-01 | #583 + routing rule / DB inventory pending |
| AC-02 | Item 4 — heading "Promotional-Payoff Option:" + exercise-date daily-accrual narrative; no day-count/expiry/Cash-Price wording; no unpopulated `{{epoDays}}`/`{{epoExpiryDate}}` | CT-02 | #583 AC1 `[expected]` |
| AC-03 | Item 4a — Lease-Purchase Ownership, exercise-date EPO, tail with (plus tax) + application fee + tax-rate-change disclaimer; no `payOffDiscountPercent`% discount (standard MA SAC formula); `nextPaymentDueAmount` non-empty | CT-03 | #583 AC2 `[expected]` |
| AC-04 | Token render smoke — non-empty in all occurrences + zero `{{ }}` + logo + cross-check vs `uown_esign_document.request` variables; no "variables map missing" dispatch note | CT-04 | #583 + AL/OH regression watch `[expected]` |
| AC-05 | Lease-purchase-plan footnote — Promotional Payoff footnote + payment grid + tax/Total-Cost footnotes; no EPO chart, no Options 1/2 | CT-05 | #583 AC3 `[expected]` |
| AC-06 | EARLY PURCHASE OPTION appendix (singular) + 5 bullets + ends "call `[phone]`"; no plural OPTIONS/Option 1&2/sub-bullets/initials; Item 14 ACH follows immediately, page not duplicated | CT-06 | #583 AC4 `[expected]` |
| AC-07 | Sanity §1–§14 vs standard MA SAC (non-EPO clauses unchanged: §3 "is", §6 fees, §7 7d/6mo reinstatement, §8, §9(c), §13, ACH WithTax/$15, §14 due-date); divergence = finding | CT-07 | #583 AC5 `[expected]` |
| AC-08 | Full GowSign signature → SIGNED + activity logs (rule #13) | CT-08 | gowsign-signing.md + sibling `[expected]` |
| AC-09 | Non-MA-template state still falls back to SIGNWELL (migration did not break the fallback); MA SignWell→GowSign clause parity (visual diff) | CT-09 | gowsign-knowledge mandatory SignWell regression `[expected]` |

## Scenarios

```gherkin
Feature: MA 16-Month GowSign Lease-Purchase Template (#583)

  Background:
    Given a merchant that reaches a 16-month term for a Massachusetts customer (Kornerstone ONLINE
      whose valid_states include MA, or a UOWN-gateway merchant with a 16m program serving MA)
    And a fresh customer, state MA, fresh SSN, bankData on sendApplication when Kornerstone requires it
    And the lead was driven to CONTRACT_CREATED (CC pre-auth) so the esign document exists
    And the GowSign iframe rendered the contract (host gowsign-app-dev-uown.azurewebsites.net)

  Scenario: [positive] CT-01 — Routing 16m vs 13m
    When a MA lease is created with a 16-month plan
    Then uown_esign_document.client='GOWSIGN' and document_name='MA_2025_SAC_16_MONTHS'
    When a MA lease is created with a 13-month plan (negative control)
    Then uown_esign_document.client='GOWSIGN' and document_name='MA_2025_SAC'

  Scenario: [positive] CT-02 — Item 4 Promotional-Payoff Option
    Then the heading is exactly "Promotional-Payoff Option:" (NOT "[X] Day Promotional Payoff Option")
    And the text allows exercise "at any time" paying $ [costPriceWithFeeNoTax] plus tax, less
      on-time payments, plus daily lease fees accrued from inception through the exercise date
    And a late payment voids the option
    And it does NOT show "During the first … days", "This option expires on [date]", the standard
      Cash-Price wording ("Cash Price, [epoFeeText]"), "You have other purchase options described below"
    And it does NOT show {{epoDays}}/{{epoExpiryDate}} populated OR blank

  Scenario: [positive] CT-03 — Item 4a Lease-Purchase Ownership
    Then it requires being current for the EPO; EPO = daily lease charges accrued through the
      exercise date + fees/taxes − on-time payments
    And the tail states: [totalNumberOfPayments] payments of $ [nextPaymentDueAmount] (plus tax);
      Total $ [contractAmount] (including tax)(including the application fee); "Taxes are subject to
      changes in the applicable tax rate."
    And it contains "Total Cost," and "you will own the Property"
    And nextPaymentDueAmount renders NON-empty (regression seen in AL)
    And it does NOT show a % discount ([payOffDiscountPercent]% — the standard MA SAC formula)

  Scenario: [positive] CT-04 — Token render smoke
    Then costPriceWithFeeNoTax, nextPaymentDueAmount, contractAmount, companyInfoBrandPhone render non-empty
    And there is no "{{…}}" in the visible text
    And the logo appears at the top
    And each monetary value matches (float tolerance) uown_esign_document.request.document.variables
    And there is no "[DocumentDispatchService][GowSign] … variables map missing … token(s)" note for this lead

  Scenario: [positive] CT-05 — Lease-purchase-plan footnote
    Then it shows "Traditional [N] Month Lease Purchase Plan*", "*with a Promotional Payoff option",
      "Early Purchase Option Available Off Unpaid Balance"
    And the [leasePurchasePlan] grid is populated
    And the footnotes "* These amounts include sales tax…" and "** Total Cost includes sales tax,
      application fee and delivery fee." appear
    And it does NOT show the EPO payoff chart [table|earlyPurchaseOption] nor the numbered Options 1 & 2

  Scenario: [positive] CT-06 — EPO appendix + page order
    Then a singular "EARLY PURCHASE OPTION" section exists (not "OPTIONS")
    And it contains "This Agreement has a 16-month term for ownership."
    And it contains "However, you may purchase the Property at any time before the end of the lease term."
    And it contains "For a 16-month lease, the EPO price is calculated as:" (watch the "16-\nmonth" line break)
    And it lists 5 bullets: cost of leased goods; plus taxes; plus applicable fees; plus accrued
      daily lease fees through the exercise date; minus payments made excluding taxes/fees
    And it contains "To exercise this option, you must call us at [phone]."
    And it does NOT show plural "OPTIONS", Option 1/2 structure, "Purchase the Property by
      [epoExpiryDate]", sub-bullets a–e, nor a customer-initials line on this page
    And Item 14 (ACH Payments) follows immediately after the appendix and the page is NOT duplicated

  Scenario: [diff] CT-07 — Sanity §1–§14 vs standard MA SAC
    Then §1 shows "(*) Total delivery fee"
    And §3 reads "Regular lease rate is $ …" (MA keeps "is" before the rate)
    And §6(a–c,g) shows $15 declined / $5 late per frequency / $10 in-home / $5 ACH changes
    And §7 reinstatement is 7 days after renewal / 6 months after return (MA-specific, NOT SC's 60 days)
    And §8 shows third-party-warranty language, "You are leasing…"
    And §9(c) end-of-term liability = None
    And §13 shows "Damage to Other Property"
    And the pre-auth section shows the vendor-name data-gathering disclosure
    And ACH uses nextPaymentDueAmountWithTax and returns = $15.00
    And §14 CANCELLATION references the "last payment due date"
    And it does NOT show (16m-exclusive) the standard §4 promo, the standard §4a %-discount, nor the
      Options 1/2 appendix with initials

  Scenario: [positive] CT-08 — Full signature + log
    When the GowSign ceremony completes (Start → adopt signature/initials → Sign All → Finish → redirect appComplete)
    Then uown_los_lead.lead_status='SIGNED'
    And uown_esign_document status progresses SENT_TO_CUSTOMER→SIGNED with doc_signed_time_stamp populated
    And uown_los_lead_notes contains "[ContractService][isLeaseOrLeaseModSigned]…SIGNED",
      "[EsignRedirectService][updateSignStatus]…to SIGNED" and "[ESIGNSERVICE][parseCCPeekConsent]"

  Scenario: [diff] CT-09 — SignWell fallback intact + MA migration parity
    Given a state with NO GowSign template for its effective state
    When a lease is created and reaches CONTRACT_CREATED
    Then uown_esign_document.client='SIGNWELL' (the migration did not break the fallback)
    And the MA GowSign contract preserves the non-EPO clause content of the prior MA SignWell contract
      (clause-parity visual diff — divergence = finding)
```

## Oracles

> **Staleness check (run before any Oracle):**
> ```bash
> git log e4713f2..HEAD -- src/helpers/gowsign-template-db.helpers.ts src/data/state-merchant-matrix.ts src/helpers/gowsign-signing.helper.ts src/helpers/esign-db.helpers.ts
> ```
> Non-empty output → prefix the report with `[BDD MAY BE STALE]`.

### Oracle: CT-01 — Routing 16m vs 13m  `[EXPECTED — DB template inventory + CONTRACT_CREATED selection pending; run getGowSignTemplatesForState(db,'MA') to confirm both templates exist in the target env]`

| Checkpoint | How to verify |
|---|---|
| 16m template exists | `getGowSignTemplatesForState(db,'MA')` contains name=`MA_2025_SAC_16_MONTHS` |
| 13m template exists | same query contains name=`MA_2025_SAC` |
| 16m offer | `sendInvoice` → `paymentDetailsList` has an entry `termInMonths=16`, `planId=WK16` |
| 13m offer | same list has an entry `termInMonths=13`, `planId=WK13` |
| 16m selection | after CONTRACT_CREATED: `assertSelectedTemplateForLead(db, leadPk, 'MA_2025_SAC_16_MONTHS')` (client=GOWSIGN) |
| 13m selection (control) | 13m lead: `assertSelectedTemplateForLead(db, leadPk, 'MA_2025_SAC')` |

### Oracle: CT-02..CT-07 — Content of `MA_2025_SAC_16_MONTHS`  `[EXPECTED — pending canonical capture via MCP-manual render; MA absent from Appendix H, so freeze the exact text before promoting to CONFIRMED]`

| Checkpoint | How to verify |
|---|---|
| Body render | `frame.locator('body').innerText()` of the GowSign iframe (`AlternativeContractModalPage.getGowSignFrame()`); normalize whitespace. PDF flatten for the signed doc |
| CT-02 Item 4 MUST | body contains exact heading "Promotional-Payoff Option:" + exercise-date daily-accrual phrase ($ costPriceWithFeeNoTax + tax − on-time payments + accrued daily lease fees through exercise date) |
| CT-02 Item 4 MUST NOT | body does NOT match /During the first .* days/, /This option expires on/, /Cash Price, .*epoFeeText/, "You have other purchase options described below", `{{epoDays}}`, `{{epoExpiryDate}}` |
| CT-03 Item 4a MUST | tail regex `/[\d,]+ payments of \$\s?[\d.,]+ .*plus tax/` + "Total Cost," + "you will own the Property" + tax-rate-change disclaimer; `nextPaymentDueAmount` non-empty |
| CT-03 Item 4a MUST NOT | does NOT match `/\d+%\s*discount/` (payOffDiscountPercent — standard MA SAC formula) |
| CT-04 tokens | for each monetary token, the value from `uown_esign_document.request.document.variables` appears in the body (comma-stripped, `toBeCloseTo` cent tolerance); `expect(body).not.toMatch(/\{\{|\}\}/)`; logo `<img>` at top; absence of the "variables map missing" note |
| CT-05 footer MUST | "Traditional", "Month Lease Purchase Plan*", "*with a Promotional Payoff option", "Early Purchase Option Available Off Unpaid Balance", footnotes "* These amounts include sales tax", "** Total Cost includes sales tax, application fee and delivery fee." |
| CT-05 footer MUST NOT | does NOT contain an `earlyPurchaseOption` chart nor "Option 1"/"Option 2" |
| CT-06 EPO appendix | contains "EARLY PURCHASE OPTION" (singular), "This Agreement has a 16-month term for ownership.", "you may purchase the Property at any time", "For a 16-\n?month lease, the EPO price is calculated as:", the 5 bullets, "To exercise this option, you must call us at"; does NOT contain "OPTIONS"/"Option 1"/"Option 2"/"[epoExpiryDate]"/an initials line; Item 14 follows immediately (one occurrence) |
| CT-07 sanity | compare §1–§14 per the scenario MUST/MUST NOT list; divergence = `[finding]` (does not pass silently) |

### Oracle: CT-08 — Signature + log (rule #13)  `[EXPECTED — reuses gowsign-signing.md; if MA 16m is NeuroID-gated, only MCP-manual reaches SIGNED]`

| Checkpoint | How to verify |
|---|---|
| Ceremony | `signGowSignInFrame(page, frame, { preauthChoice:'yes', waitForCompleted:true })` → `capturedCompleted=true` |
| lead SIGNED | `waitForLeadStatus(db, leadPk, 'SIGNED')` |
| esign SIGNED | `uown_esign_document.status='SIGNED'`, `doc_signed_time_stamp` non-null (query by lead+client; `request` may become the string `getDocumentStatus` post-signature) |
| Logs (rule #13) | `uown_los_lead_notes` contains "[ContractService][isLeaseOrLeaseModSigned]…SIGNED", "[EsignRedirectService][updateSignStatus]…to SIGNED", "[ESIGNSERVICE][parseCCPeekConsent]" |

### Oracle: CT-09 — SignWell fallback + MA parity  `[EXPECTED — mandatory SignWell regression per gowsign-knowledge]`

| Checkpoint | How to verify |
|---|---|
| Fallback intact | a lead in a no-template state reaches CONTRACT_CREATED with `uown_esign_document.client='SIGNWELL'` |
| MA parity | non-EPO clause content (§1–§14) of the MA GowSign contract matches the prior MA SignWell contract; divergence = `[finding]` |

> Execution pitfalls (Kornerstone host): the Buddy widget can swallow the "Proceed" click (re-click / raw
> DOM `.click()`); NeuroID requires the reload→"Sign Contract" trick (only proven via MCP-manual). Detect
> the GowSign iframe by class `alternative-contract-vendor_iframe__nSb3A` or substring `gowsign` (host
> varies by env), never by `gowsign.com`.

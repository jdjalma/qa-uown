---
last-reviewed: 2026-07-02
last-reviewed-sha: e4713f2
covers:
  - docs/business-rules/appendix-h-epo-template-registry.md
  - src/helpers/gowsign-template-db.helpers.ts
  - src/data/state-merchant-matrix.ts
  - src/helpers/gowsign-signing.helper.ts
  - src/helpers/esign-db.helpers.ts
---

# TN 16-Month GowSign Template — Content & Routing Oracle (work item #557)

> Operation: validate the content and routing of the **`TN_2025_SAC_16_MONTHS`** template
> (Tennessee, 16 months, SAC) rendered in the GowSign iframe/PDF, plus the 13m negative
> control (`TN_2025_SAC`). This operation is NEW (not covered by precondition oracles). The
> preconditions (`send-application`, `new-application`, `cc-ach`, `terms-of-agreement`,
> `gowsign-signing`) already have their own oracles — reuse, do not recreate.
>
> **Sibling pattern:** modelled on `il-16m-gowsign-template.md` (work item #576, same milestone
> RU07.26.1.54.0, same feature family). Content grounded in the CANONICAL product source
> `docs/business-rules/appendix-h-epo-template-registry.md` §H.2/§H.3/§H.4 (`[external-doc:gitlab/EPO-SECTIONS,2026-06-23]`, marked `[CONFIRMED]` in that registry).
>
> **Routing (provider rule):** `effectiveState = INSTORE ? merchant.state : customerState`; a row
> exists in `uown_gow_sign_template` for `(TN, client_type=null)` in both terms → GOWSIGN. The
> term (13 vs 16) comes from the merchant program (Kornerstone ABB → EligibleTerms 16), NOT from
> the SSN suffix. `uown_esign_document.client`/`document_name` (created at CONTRACT_CREATED) is
> the source of truth for the selection.
>
> **⚠️ Content checkpoints are `[EXPECTED — pending canonical render freeze]`.** TN template
> availability in stg/qa2 and the exact rendered wording have NOT been captured from a live
> `TN_2025_SAC_16_MONTHS` render yet (no TN KB entry exists). The MUST/MUST NOT lists below are
> derived from Appendix H (canonical) + the ticket AC + the IL/AL/FL 16m siblings. Promote each
> content checkpoint from `[expected]` to `[confirmed]` only after freezing the exact text from a
> real render (MCP-manual, per the automation blocker below).
>
> **⚠️ Likely automation blocker (inherited from IL/AL, see il-16m-gowsign-template.md § Automation
> blocker):** the 16m template is reachable only via a Kornerstone ONLINE merchant whose
> `valid_states` includes TN — whose `/complete` page carries the **NeuroID** behavioral gate.
> IL proved BOTH the API `submitApplication` path AND the browser auto-advance are NeuroID-blocked
> for the Kornerstone 16m route (no `uown_esign_document`, lead stuck `UW_APPROVED`). Therefore
> CT-02..CT-07 (16m content) and CT-08 (16m signing) are today validatable only by MCP-manual
> render. `TN_2025_SAC` (13m, negative control) via TerraceFinance (UOWN gateway, no NeuroID) IS
> automatable and covers CT-01's negative control + CT-07's sanity reference. Confirm the TN
> merchant route in a discovery pass before implementation.
>
> **Primary sources:** `docs/business-rules/appendix-h-epo-template-registry.md` §H.2/H.3/H.4/H.5 ·
> `docs/business-rules/03-contratos-esign.md` §8 ·
> `docs/business-rules/appendix-g-cenarios-risco.md#4-program-routing-13-vs-16-months` ·
> sibling oracle `il-16m-gowsign-template.md` · sibling KB `illinois-gowsign-template.md`,
> `alabama-gowsign-template.md`.

## Acceptance Criteria

| ID | Criterion | CT | Source |
|---|---|---|---|
| AC-01 | Lease TN 16m → template `TN_2025_SAC_16_MONTHS`; lease TN 13m → `TN_2025_SAC`; both client=GOWSIGN (matrix row still says SIGNWELL — stale) | CT-01 | Appendix H.4 + IL sibling routing rule + matrix drift |
| AC-02 | Item 4 — heading "Promotional-Payoff Option:" + **exercise-date** daily-accrual narrative; no fixed-day promo window / `{{epoDays}}` / expiry | CT-02 | #557 AC1 + Appendix H R1 `exercise_date_promo` `[expected]` |
| AC-03 | Item 4a — TN tail `[totalNumberOfPayments]` payments of `$ [nextPaymentDueAmount]` **plus `$ [salesTax]` in sales tax** + "and you pay the processing fee" + "Total Cost" `$ [contractAmount]` + "and you will own the Property"; NO `(plus tax)`, NO %-discount, NO standard-SAC discount math | CT-03 | #557 AC2 + Appendix H R2 `exercise_date_epo_fl` `[expected]` |
| AC-04 | Token render smoke — every token non-empty in every occurrence + zero `{{ }}` + logo + cross-check vs `uown_esign_document.request`; watch `nextPaymentDueAmount`/`salesTax` blank regression (AL/OH) | CT-04 | #557 AC + Appendix H.5 + AL/OH regression `[expected]` |
| AC-05 | Plan footnote — "Traditional [N] Month Lease Purchase Plan" + "with a Promotional Payoff option" + "Early Purchase Option Available Off Unpaid Balance" + populated schedule; NO EPO chart / numbered-Options appendix language | CT-05 | #557 AC3 + Appendix H R4 `shared_footnote` (no `ca_chart` for TN) `[expected]` |
| AC-06 | Appendix EARLY PURCHASE OPTION (singular) + hard-coded 16-month + 5 bullets + page order (Notice to Lessee/signature follows, no numbered choices, no customer-initials block) | CT-06 | #557 AC4 + Appendix H R3 `shared_16month_appendix` `[expected]` |
| AC-07 | Sanity — only Items 4, 4a, footnote, appendix differ from the standard TN SAC; unchanged: Item 3 (paycheck-based lease start), Item 7 reinstatement (90/180 days, 80% threshold), all other non-EPO items | CT-07 | #557 AC5 + Appendix H.3 TN `[expected]` |
| AC-08 | Full GowSign signature → SIGNED + activity logs (rule #13) | CT-08 | gowsign-signing.md + gowsign-knowledge esign progression `[expected]` |

## Scenarios

```gherkin
Feature: TN 16-Month GowSign Lease-Purchase Template (#557)
  As a Tennessee customer signing a 16-month lease-purchase agreement
  In order to sign a legally correct contract
  The rendered GowSign contract must show the TN 16-month EPO copy with all values resolved

  Background:
    Given a merchant that offers a 16-month program and whose valid states include Tennessee
    And a fresh customer with a Tennessee address and a fresh SSN
    And the lead has been driven to CONTRACT_CREATED
    And the GowSign iframe has rendered the contract

  Scenario: [positive] CT-01 — Routing 16m vs 13m for Tennessee
    When a Tennessee lease is created on the 16-month plan
    Then the selected e-sign document is client "GOWSIGN" with document name "TN_2025_SAC_16_MONTHS"
    When a Tennessee lease is created on the 13-month plan (negative control)
    Then the selected e-sign document is client "GOWSIGN" with document name "TN_2025_SAC"
    And neither lease routes to SIGNWELL despite the stale state-merchant matrix row

  Scenario: [positive] CT-02 — Item 4 Promotional-Payoff Option (exercise-date accrual)
    Then Item 4 heading reads "Promotional-Payoff Option:"
    And the text allows purchase "at any time" for $ [costPriceWithFeeNoTax] plus tax, less on-time rental payments (not including taxes or fees), plus daily lease fees from lease inception through the date the customer exercises the Early Purchase Option
    And the text states that any late payments void the option
    And the text does NOT show a fixed-day promo window ("During the first [X] days"), a populated-or-blank {{epoDays}}, a promo expiry date, "Cash Price of the item(s)" promo language, or "You have other purchase options described below"
    And the accrual reads "through the date you exercise" (exercise-date), NOT "through the current date"

  Scenario: [positive] CT-03 — Item 4a Lease-Purchase Ownership (TN sales-tax + processing-fee tail)
    Then Item 4a states the customer must be current to elect the EPO, and the EPO price equals daily lease charges accrued from inception through the exercise date, plus fees and taxes, less on-time rental payments (excluding taxes and fees)
    And the text states late fees are not included in the purchase price and there is no ownership until paid in full
    And the ownership tail reads exactly "[totalNumberOfPayments] payments of $ [nextPaymentDueAmount] plus $ [salesTax] in sales tax", followed by "and you pay the processing fee", a total labeled "Total Cost" of $ [contractAmount], ending "and you will own the Property"
    And nextPaymentDueAmount and salesTax render NON-empty (AL/OH blank regression watch)
    And the text does NOT show the VA/IL-style "(plus tax)" pattern instead of the separate sales-tax line
    And the text does NOT show a "[payOffDiscountPercent]% discount", "Remaining lease payments for ownership" discount math, or a "[epoDays]-Day-Promotional-Payoff Option (Item 4)" reference (standard SAC)

  Scenario: [positive] CT-04 — Token render smoke
    Then costPriceWithFeeNoTax, nextPaymentDueAmount, salesTax, totalNumberOfPayments, contractAmount and companyInfoBrandPhone render non-empty in every occurrence
    And there is no "{{...}}" token left in the visible text
    And the brand logo appears at the top
    And each monetary value matches (float tolerance) the corresponding value in uown_esign_document.request.document.variables
    And there is NO dispatch note "[DocumentDispatchService][GowSign] … variables map missing … token(s)" for this lead

  Scenario: [positive] CT-05 — Lease-purchase plan footnote
    Then the plan title reads "Traditional [N] Month Lease Purchase Plan"
    And the footnote "with a Promotional Payoff option" appears
    And "Early Purchase Option Available Off Unpaid Balance" appears
    And the payment schedule table is populated
    And the footnote area does NOT show an EPO payoff chart/schedule table nor standard-SAC numbered-options appendix language

  Scenario: [positive] CT-06 — EPO appendix (singular) + page order
    Then the appendix heading reads "EARLY PURCHASE OPTION" (singular, not "OPTIONS")
    And the opening line reads "This Agreement has a 16-month term for ownership." (hard-coded 16, allowing the "16-\nmonth" line break)
    And there is a single EPO explanation (not a numbered list)
    And the 5-bullet formula lists: the cost of the leased goods; plus taxes; plus applicable fees; plus accrued daily lease fees through the exercise date; minus payments made excluding taxes and fees
    And the closing line reads "To exercise this option, you must call us at [phone]."
    And the appendix does NOT show plural "EARLY PURCHASE OPTIONS", "Option 1"/"Option 2", a promo expiry / "Beginning [date]…" language, a customer-initials block, or "Only available on the Traditional Lease Purchase Plan" sub-bullets
    And after this appendix the contract continues to the Notice to the Lessee and the signature block, NOT back into numbered EPO choices

  Scenario: [diff] CT-07 — Sanity vs the standard TN SAC (non-EPO clauses)
    Then only Item 4, Item 4a, the plan footnote and the EPO appendix page differ from the standard TN SAC
    And Item 3 still describes the paycheck-based lease start unchanged
    And Item 7 reinstatement still shows the TN tiers (90/180 days, 80% threshold) unchanged
    And all other non-EPO items (5, 6, 8, 9, …) are unchanged
    And the 16m template does NOT introduce the standard-SAC promo §4, the %-discount §4a, or a numbered Options 1/2 appendix with initials

  Scenario: [positive] CT-08 — Full signature + activity log (rule #13)
    When the GowSign signing ceremony is completed (Start → adopt signature/initials → Sign All → Finish → redirect appComplete)
    Then uown_los_lead.lead_status is "SIGNED"
    And uown_esign_document progresses SENT_TO_CUSTOMER → SIGNED → STORED with doc_signed_time_stamp populated
    And uown_los_lead_notes contains "[ContractService][isLeaseOrLeaseModSigned]…SIGNED", "[EsignRedirectService][updateSignStatus]…to SIGNED" and "[ESIGNSERVICE][parseCCPeekConsent]"
```

## Oracles

> **Staleness check (run before any oracle):**
> ```bash
> git log e4713f2..HEAD -- docs/business-rules/appendix-h-epo-template-registry.md src/helpers/gowsign-template-db.helpers.ts src/data/state-merchant-matrix.ts src/helpers/gowsign-signing.helper.ts src/helpers/esign-db.helpers.ts
> ```
> Non-empty output → prepend the report with `[BDD MAY BE STALE]`.

### Oracle: CT-01 — Routing 16m vs 13m  `[EXPECTED — pending live TN template inventory + esign-doc selection at CONTRACT_CREATED]`

| Checkpoint | How to verify |
|---|---|
| 16m template exists | `getGowSignTemplatesForState(db,'TN')` contains name=`TN_2025_SAC_16_MONTHS` (16m) |
| 13m template exists | same query contains name=`TN_2025_SAC` (13m) |
| both client_type=null | no merchant restriction on either row |
| 16m offer | `sendInvoice` → `paymentDetailsList` contains an entry `termInMonths=16` (Kornerstone WK16-style plan) |
| 13m offer | same list contains an entry `termInMonths=13` |
| 16m selection | after CONTRACT_CREATED: `assertSelectedTemplateForLead(db, leadPk, 'TN_2025_SAC_16_MONTHS')` (client=GOWSIGN) |
| 13m selection (control) | 13m lead: `assertSelectedTemplateForLead(db, leadPk, 'TN_2025_SAC')` |
| matrix drift flagged | `state-merchant-matrix.ts` TN row says `SIGNWELL` (stale); live DB availability is authoritative → GOWSIGN. Report as a doc-keeper action, not a bug |

### Oracle: CT-02..CT-07 — Content of `TN_2025_SAC_16_MONTHS`  `[EXPECTED — pending canonical render freeze via MCP-manual; see il-16m-gowsign-template.md § Automation blocker]`

| Checkpoint | How to verify |
|---|---|
| Body render | `frame.locator('body').innerText()` of the GowSign iframe (`AlternativeContractModalPage.getGowSignFrame()`); normalize whitespace. Detect the iframe by the class `iframe.alternative-contract-vendor_iframe__nSb3A` or the substring `gowsign` — NEVER `gowsign.com` (host varies by env) |
| CT-02 Item 4 MUST | body contains heading "Promotional-Payoff Option:" + exercise-date accrual phrase ($ costPriceWithFeeNoTax + tax − on-time payments + accrued daily lease fees **through the date you exercise**) |
| CT-02 Item 4 MUST NOT | body does NOT match `/During the first .* days/`, `/This option expires on/`, `/through the current date/`, "Cash Price of the item(s)", "You have other purchase options described below", `{{epoDays}}` |
| CT-03 Item 4a MUST | regex of the tail: `/[\d,]+ payments of \$\s?[\d.,]+ plus \$\s?[\d.,]+ in sales tax/` + "and you pay the processing fee" + "Total Cost" + "and you will own the Property"; `nextPaymentDueAmount` and `salesTax` non-empty |
| CT-03 Item 4a MUST NOT | does NOT match `/of \$\s?[\d.,]+ \(plus tax\)/` (VA/IL pattern), NOT `/\d+%\s*discount/` (payOffDiscountPercent), NOT "remaining lease payments for ownership", NOT `/\d+-Day-Promotional-Payoff Option \(Item 4\)/` |
| CT-04 tokens | for each monetary token, the value from `uown_esign_document.request.document.variables` appears in the body (comma-stripped, `toBeCloseTo` cent tolerance); `expect(body).not.toMatch(/\{\{|\}\}/)`; logo `<img>` at the top; absence of the "variables map missing" dispatch note |
| CT-05 footer MUST | "Traditional", "Month Lease Purchase Plan", "with a Promotional Payoff option", "Early Purchase Option Available Off Unpaid Balance"; schedule grid populated |
| CT-05 footer MUST NOT | no `earlyPurchaseOption` chart table nor "Option 1"/"Option 2" |
| CT-06 EPO appendix | contains "EARLY PURCHASE OPTION" (singular), "This Agreement has a 16-month term for ownership.", "you may purchase the Property at any time", "For a 16-\n?month lease, the EPO price is calculated as:", the 5 bullets, "To exercise this option, you must call us at"; does NOT contain "OPTIONS"/"Option 1"/"Option 2"/promo expiry/initials line; the Notice to the Lessee + signature block follows (single occurrence) |
| CT-07 sanity | compare Item 3 (paycheck-based start), Item 7 (reinstatement 90/180 days, 80%), and non-EPO items against the standard TN SAC per the scenario MUST/MUST NOT lists; a divergence outside {4, 4a, footnote, appendix} = `[finding]` (does not pass silently) |

### Oracle: CT-08 — Signature + log (rule #13)  `[EXPECTED — reuses gowsign-signing.md; blocked by NeuroID on the Kornerstone host for 16m]`

| Checkpoint | How to verify |
|---|---|
| Ceremony | `signGowSignInFrame(page, frame, { preauthChoice:'yes', waitForCompleted:true })` → `capturedCompleted=true` |
| lead SIGNED | `waitForLeadStatus(db, leadPk, 'SIGNED')` |
| esign progression | `uown_esign_document.status` progresses `SENT_TO_CUSTOMER → SIGNED → STORED`, `doc_signed_time_stamp` non-null. Query post-signature by lead+client directly (`request` is overwritten to the string `getDocumentStatus`) |
| Logs (rule #13) | `uown_los_lead_notes` contains "[ContractService][isLeaseOrLeaseModSigned]…SIGNED", "[EsignRedirectService][updateSignStatus]…to SIGNED", "[ESIGNSERVICE][parseCCPeekConsent]" |

> Execution pitfalls (Kornerstone host): the Buddy widget can swallow the click on "Proceed" (re-click /
> raw DOM `.click()`); NeuroID requires the reload → "Sign Contract" trick (only proven via MCP-manual).

## Open discrepancies to resolve at render-freeze time

1. **Item 4 heading hyphenation.** Ticket AC1 says "Promotional-**Payoff** Option:" (hyphen); Appendix H `exercise_date_promo` shows "Promotional Payoff Option:" (no hyphen). Freeze the exact form from a real `TN_2025_SAC_16_MONTHS` render and update CT-02 accordingly.
2. **TN template availability per env.** stg/qa2 inventory of `TN_2025_SAC` / `TN_2025_SAC_16_MONTHS` is UNVERIFIED (no TN KB yet). Re-list with `getGowSignTemplatesForState` before asserting in any env.
3. **`salesTax` token render.** Appendix H.5 lists `{{salesTax}}` for the TN tail; assert non-empty (AL/OH `nextPaymentDueAmount` blank regression is the nearest precedent).

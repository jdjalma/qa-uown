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

# IN 16-Month GowSign Template — Content & Routing Oracle (work item #579)

> Operation: validate the content and routing of the **`IN_2025_SAC_16_MONTHS`** template
> (Indiana, 16 months, SAC) rendered inside the GowSign iframe/PDF, plus the 13m negative
> control. This operation is NEW (not covered by the precondition oracles). The preconditions
> (`send-application`, `new-application`, `cc-ach`, `terms-of-agreement`, `gowsign-signing`)
> already have their own oracle — reuse, do not recreate.
>
> **Sibling pattern:** this oracle is the Indiana equivalent of
> [`il-16m-gowsign-template.md`](il-16m-gowsign-template.md) (#576). It inherits the IL
> routing rule, the NeuroID automation blocker analysis, and the render-inspection technique.
> The **content checkpoints differ** — Indiana is a partial new-baseline (see CT-03) and adds
> state-specific body checks (header `AGREEMENT-IN`, §6(a) `{{nsfFee}}`, §7 120-day
> reinstatement, §14 red ACH labels) — so DO NOT blind-copy the IL body assertions.
>
> **Routing rule (provider):** `effectiveState = INSTORE ? merchant.state : customerState`;
> provider = GOWSIGN when a `uown_gow_sign_template` row exists for `(effectiveState, client_type)`,
> else the merchant `esign_client` (SIGNWELL fallback). `uown_esign_document.client`/`document_name`
> (created at CONTRACT_CREATED, after CC pre-auth — NOT at UW_APPROVED) are the source of truth
> for the selection.
>
> **⚠️ Stale-matrix contradiction (= discovery, rule #16):** `src/data/state-merchant-matrix.ts`
> row IN still says `expectedProvider: 'SIGNWELL'` (line ~181). The #579 AC and the added
> `IN_2025_SAC_16_MONTHS` template make IN route to **GOWSIGN**. This is the same dated-matrix
> drift that hit OH/AL/NY/IL. **Action (qa-doc-keeper): update the IN matrix row to GOWSIGN**
> once the live template inventory is confirmed. Live DB availability
> (`getGowSignTemplatesForState(db,'IN')`) is authoritative — re-list before asserting per env.
>
> **⚠️ Template inventory NOT yet DB-confirmed for IN this cycle.** The IL sibling required a
> discovery pass (rule #18, UI→API→DB) to confirm both 13m+16m templates existed and to find
> the merchant route. The IN inventory/route must be confirmed the same way at implementation
> time (see illinois-gowsign-template.md as the template) — do this BEFORE freezing CT-01/CT-02..
> CT-06 from `[expected]` to `[confirmed]`.
>
> **🔴 Carry-over automation blocker (from IL #576):** the only route to a 16-month lease in
> IL was a Kornerstone ONLINE merchant whose `/complete` page is NeuroID-gated (blocks both API
> `submitApplication` and headless browser auto-advance; workaround = reload → "Sign Contract",
> proven only via MCP-manual). The IN `validMerchant` in the matrix is TerraceFinance, which (per
> the IL analysis) reaches only the 13m template on the UOWN gateway. **If IN 16m is likewise
> reachable only via a Kornerstone host, CT-02..CT-06/CT-08 are NOT CI-automatable with current
> tooling and must be validated MCP-manual.** Confirm the IN 16m route during discovery; if the
> NeuroID gate applies, escalate (same S1/architecture blocker IL escalated).
>
> **Primary sources:** `docs/taskTestingUown/RU07.26.1.54.0_addInGowSignTemplate_579/RU07.26.1.54.0_addInGowSignTemplate_579.md`
> (verbatim #579 AC) · `docs/business-rules/appendix-h-epo-template-registry.md` (R1–R5 baselines +
> token glossary + non-empty render rule H.6) · `docs/business-rules/03-contratos-esign.md` (e-sign
> flow) · `docs/knowledge-base/illinois-gowsign-template.md` (sibling recipe + blocker).

## Acceptance Criteria

| ID | Criterion | CT | Source |
|---|---|---|---|
| AC-01 | Lease IN 16m → template `IN_2025_SAC_16_MONTHS`, client=GOWSIGN; 13m control → IN 13m template (if present), client=GOWSIGN | CT-01 | #579 capture + IL routing rule `[expected]` |
| AC-02 | Item 4 — exact "Promotional-Payoff Option:" heading + daily-accrual-through-exercise-date narrative; no `{{epoDays}}`-day promo / expiry / lesser-of-Cash-Price wording | CT-02 | #579 AC1 + appendix-H R1 `exercise_date` `[expected]` |
| AC-03 | Item 4a — Lease-Purchase Ownership; tail uses `$ {{nextPaymentDueAmount}}` (plus tax) + "(including the application fee)"; NO separate `{{salesTax}}` line, NO `{{firstPaymentDueAmount}}`, NO `{{payOffDiscountPercent}}%` discount, accrual through exercise date | CT-03 | #579 AC2 (partial new-baseline) `[expected]` |
| AC-04 | Token render smoke — every occurrence non-empty, zero literal `{{ }}`, logo present, monetary values cross-check `uown_esign_document.request` variables | CT-04 | #579 AC + appendix-H H.6 `[expected]` |
| AC-05 | Appendix "EARLY PURCHASE OPTION" (singular) + 5-bullet formula + call `{{companyInfoBrandPhone}}`; plan footnote "*with a Promotional Payoff option"; NO plural "OPTIONS"/Options 1&2/customer-initials block | CT-05 | #579 AC3+AC4 + appendix-H R3/R4 `[expected]` |
| AC-06 | Indiana body checks (non-EPO): header `CONSUMER LEASE-PURCHASE AGREEMENT-IN`; "Lessee should read…"; §1 footnote "(*) Total delivery fee"; §6(a) declined-charge = dynamic `{{nsfFee}}` value (not hardcoded $15.00); §7 120-day reinstatement (not 60); pre-auth forgo-debit + consent `[…]` brackets visible; §14 ACH labels CHANGE OF INFORMATION/RETURNS/CANCELLATION in red | CT-06 | #579 AC5 `[expected]` |
| AC-07 | Negative assertions (must NOT see) across Item 4 / Item 4a / appendix / body — consolidated | CT-07 | #579 AC6 `[expected]` |
| AC-08 | Full GowSign signing → lead SIGNED + activity logs (rule #13) | CT-08 | gowsign-signing.md + [[activity-log-validation]] `[expected]` |

## Scenarios

```gherkin
Feature: IN 16-Month GowSign Lease-Purchase Template (#579)
  As the QA team
  In order to release the Indiana GowSign contract safely
  The rendered IN_2025_SAC_16_MONTHS contract must show the Indiana-specific
  lease-purchase copy with all dynamic values resolved

  Background:
    Given a merchant whose effective state resolves to IN and whose program offers a 16-month term
    And a fresh customer with Indiana address and a fresh SSN
    And the lead has been driven to CONTRACT_CREATED (CC pre-auth completed)
    And the GowSign contract has rendered in the iframe/PDF

  Scenario: [positive] CT-01 — Routing selects the Indiana 16-month GowSign template
    When a lease is created for an Indiana customer on a 16-month program
    Then the esign document for the lead has client "GOWSIGN" and document_name "IN_2025_SAC_16_MONTHS"
    And when a lease is created for an Indiana customer on a 13-month program as the negative control
    Then the esign document has client "GOWSIGN" and the Indiana 13-month document_name (never a wrong-state or SIGNWELL selection)

  Scenario: [negative] CT-02 — Item 4 does NOT carry day-count promotional wording
    Given the rendered IN 16-month contract body
    Then Item 4 does not contain "During the first {{epoDays}} days", "This option expires on", a lesser-of-Cash-Price clause, "You have other purchase options described below", or the literal tokens {{epoDays}}/{{epoExpiryDate}}

  Scenario: [positive] CT-02 — Item 4 shows the Promotional-Payoff Option daily-accrual narrative
    Given the rendered IN 16-month contract body
    Then Item 4 heading reads exactly "Promotional-Payoff Option:" (hyphenated, no day count)
    And the clause allows buying "at any time" for "$ {{costPriceWithFeeNoTax}} plus tax", less on-time rental payments, plus daily lease fees from inception through the date the Early Purchase Option is exercised
    And the clause states any late payments void the option

  Scenario: [negative] CT-03 — Item 4a does NOT use the discount / firstPaymentDueAmount / separate salesTax variants
    Given the rendered IN 16-month contract body
    Then Item 4a does not contain a "{{payOffDiscountPercent}}% discount" clause, the token {{firstPaymentDueAmount}}, a separate "plus $ {{salesTax}} in sales tax" line, or a current-date accrual phrase

  Scenario: [positive] CT-03 — Item 4a shows the Indiana Lease-Purchase Ownership tail
    Given the rendered IN 16-month contract body
    Then Item 4a states EPO requires being current and accrues daily lease charges through the exercise date, plus fees and taxes, less on-time payments
    And the ownership tail reads "{{totalNumberOfPayments}} payments of $ {{nextPaymentDueAmount}} (plus tax)" reaching a Total Cost of "$ {{contractAmount}}" "(including the application fee)"
    And the rendered {{nextPaymentDueAmount}} value is non-empty (AL/OH migration regression watch)

  Scenario: [positive] CT-04 — All dynamic tokens resolve in the render
    Given the rendered IN 16-month contract body
    Then costPriceWithFeeNoTax, nextPaymentDueAmount, contractAmount and companyInfoBrandPhone render non-empty
    And no literal "{{" or "}}" appears anywhere in the visible text
    And the brand logo appears at the top
    And each monetary value matches (cent tolerance) the corresponding entry in uown_esign_document.request document variables
    And there is no dispatch note "[DocumentDispatchService][GowSign] … variables map missing … token(s)" for this lead

  Scenario: [negative] CT-05 — The appendix is NOT the plural dual-option page
    Given the rendered IN 16-month contract body
    Then the appendix does not contain the plural heading "EARLY PURCHASE OPTIONS", numbered "Option 1"/"Option 2", the tokens {{payOffAmountBeforeEPOExpiry}}/{{payOffStartDateAfterEpoExpiry}}, or a customer-initials line on that page

  Scenario: [positive] CT-05 — Singular EARLY PURCHASE OPTION appendix and plan footnote render
    Given the rendered IN 16-month contract body
    Then the appendix shows the singular heading "EARLY PURCHASE OPTION"
    And it states the 16-month term for ownership and that the Property may be purchased at any time before the end of the term
    And it lists the 5-bullet EPO formula: cost of leased goods; plus taxes; plus applicable fees; plus accrued daily lease fees through the exercise date; minus payments made excluding taxes and fees
    And it closes with "To exercise this option, you must call us at {{companyInfoBrandPhone}}."
    And the lease plan footnote reads "*with a Promotional Payoff option"

  Scenario: [negative] CT-06 — Indiana body does NOT carry the wrong-state or stale-value markers
    Given the rendered IN 16-month contract body
    Then the header is not another state's title and not an EPO payoff schedule table
    And §6(a) does not show a hardcoded "$15.00" declined-charge value
    And §7 does not state a 60-day reinstatement window
    And the §1 delivery-fee footnote is not in the "*(*)" form

  Scenario: [positive] CT-06 — Indiana state-specific body checks render correctly
    Given the rendered IN 16-month contract body
    Then the header reads "CONSUMER LEASE-PURCHASE AGREEMENT-IN"
    And the line below the title reads "Lessee should read the contract in its entirety…"
    And the §1 footnote reads "(*) Total delivery fee"
    And §6(a) shows the dynamic {{nsfFee}} value (the configured NSF fee, non-empty, not the literal token)
    And §7 states 120 days from the date of return to reinstate
    And the pre-auth forgo-debit shows the "[late/delinquency/reinstatement]" and "[late/delinquency/fees may accrue…]" brackets
    And the pre-auth/consent links show "[Click Here]" brackets outside the hyperlink text
    And the §14 ACH labels CHANGE OF INFORMATION, RETURNS and CANCELLATION render in red

  Scenario: [positive] CT-08 — Signing completes and writes the activity log
    Given the rendered IN 16-month GowSign contract
    When the signing ceremony is completed through the finish/redirect
    Then the lead status becomes SIGNED
    And the esign document progresses SENT_TO_CUSTOMER → SIGNED with doc_signed_time_stamp populated
    And uown_los_lead_notes contains "[ContractService][isLeaseOrLeaseModSigned]…SIGNED", "[EsignRedirectService][updateSignStatus]…to SIGNED" and "[ESIGNSERVICE][parseCCPeekConsent]"
```

## Oracles

> **Staleness check (run before any oracle):**
> ```bash
> git log e4713f2..HEAD -- docs/business-rules/appendix-h-epo-template-registry.md src/helpers/gowsign-template-db.helpers.ts src/data/state-merchant-matrix.ts src/helpers/gowsign-signing.helper.ts src/helpers/esign-db.helpers.ts
> ```
> Non-empty output → prepend the report with `[BDD MAY BE STALE]`.

### Oracle: CT-01 — Routing 16m vs 13m  `[EXPECTED — pending IN template inventory + esign-doc selection; confirm via getGowSignTemplatesForState + discovery per rule #18]`

| Checkpoint | How to verify |
|---|---|
| 16m template exists | `getGowSignTemplatesForState(db,'IN')` contains name=`IN_2025_SAC_16_MONTHS` |
| 13m template (if present) | same query — record whether an IN 13m template exists (IL had both; IN inventory unconfirmed) |
| 16m selection | after CONTRACT_CREATED: `assertSelectedTemplateForLead(db, leadPk, 'IN_2025_SAC_16_MONTHS')` (client=GOWSIGN) |
| 13m selection (control) | 13m lead: `assertSelectedTemplateForLead` returns the IN 13m document_name, client=GOWSIGN |
| Not SIGNWELL / not wrong state | `uown_esign_document.client` ≠ 'SIGNWELL'; document_name has no other-state prefix |

### Oracle: CT-02..CT-07 — Content of `IN_2025_SAC_16_MONTHS`  `[EXPECTED — freeze from a real rendered IN 16m contract (MCP-manual if NeuroID-gated) before promoting to CONFIRMED]`

| Checkpoint | How to verify |
|---|---|
| Body render | `frame.locator('body').innerText()` of the GowSign iframe (`AlternativeContractModalPage.getGowSignFrame()`); normalize whitespace. Detect iframe by class `alternative-contract-vendor_iframe__nSb3A` or substring `gowsign` — NOT `gowsign.com` (host varies by env) |
| CT-02 Item 4 MUST | body contains exact heading "Promotional-Payoff Option:" + daily-accrual phrase ($ costPriceWithFeeNoTax + tax − on-time payments + daily lease fees through exercise date) + "void this option" |
| CT-02 Item 4 MUST NOT | body does not match /During the first .* days/, /This option expires on/, a lesser-of-Cash-Price clause, "You have other purchase options described below", `{{epoDays}}`, `{{epoExpiryDate}}` |
| CT-03 Item 4a MUST | tail regex `/[\d,]+ payments of \$\s?[\d.,]+\s*\(plus tax\)/` + "(including the application fee)" + "Total Cost" + "and you will own the Property"; `nextPaymentDueAmount` non-empty |
| CT-03 Item 4a MUST NOT | does not match `/\d+%\s*discount/` (payOffDiscountPercent), `firstPaymentDueAmount`, a separate "plus $ … in sales tax" line, or current-date accrual wording |
| CT-04 tokens | for each monetary token, the `uown_esign_document.request` variable value appears in the body (comma-stripped, `toBeCloseTo` cent tolerance); `expect(body).not.toMatch(/\{\{|\}\}/)`; logo `<img>` at top; no "variables map missing" dispatch note |
| CT-05 appendix MUST | singular "EARLY PURCHASE OPTION", "16-month term for ownership", "purchase the Property at any time", "For a 16-\n?month lease, the EPO price is calculated as:", the 5 bullets, "To exercise this option, you must call us at"; plan footnote "*with a Promotional Payoff option" |
| CT-05 appendix MUST NOT | no "EARLY PURCHASE OPTIONS"/"Option 1"/"Option 2"/`{{payOffAmountBeforeEPOExpiry}}`/`{{payOffStartDateAfterEpoExpiry}}`/customer-initials line |
| CT-06 body MUST | header "CONSUMER LEASE-PURCHASE AGREEMENT-IN" (anchor on `AGREEMENT-IN`, not the word "Indiana" — OH-flatten lesson); "Lessee should read the contract in its entirety"; §1 "(*) Total delivery fee"; §6(a) `{{nsfFee}}` renders a non-empty numeric value; §7 "120 days"; pre-auth `[…]` brackets present; consent "[Click Here]" brackets; §14 ACH labels in red (assert color via computed style / class, not text alone) |
| CT-06 body MUST NOT | no hardcoded "$15.00" declined charge; no "60 days" reinstatement; no "*(*)" delivery footnote; no EPO payoff schedule table; no wrong-state header |

### Oracle: CT-08 — Signing + log (rule #13)  `[EXPECTED — reuses gowsign-signing.md; blocked in CI if IN 16m route is NeuroID-gated (Kornerstone host)]`

| Checkpoint | How to verify |
|---|---|
| Ceremony | `signGowSignInFrame(page, frame, { preauthChoice:'yes', waitForCompleted:true })` → `capturedCompleted=true` |
| lead SIGNED | `waitForLeadStatus(db, leadPk, 'SIGNED')` |
| esign progression | `uown_esign_document.status` reaches `SIGNED` (then `STORED`), `doc_signed_time_stamp` non-null. Post-signature: query by lead+client directly (the `request` field is overwritten to the string `getDocumentStatus`) |
| Logs (rule #13) | `uown_los_lead_notes` contains "[ContractService][isLeaseOrLeaseModSigned]…SIGNED", "[EsignRedirectService][updateSignStatus]…to SIGNED", "[ESIGNSERVICE][parseCCPeekConsent]" |

> Execution pitfalls (inherited from IL/AL Kornerstone host): NeuroID requires the reload → "Sign Contract" trick (proven only MCP-manual); the Buddy widget can swallow the "Proceed" click (re-click / raw DOM `.click()`). Float monetary comparisons use `toBeCloseTo`, never `toEqual`.

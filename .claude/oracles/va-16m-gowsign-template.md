---
last-reviewed: 2026-07-02
last-reviewed-sha: e4713f2
covers:
  - docs/business-rules/appendix-h-epo-template-registry.md
  - docs/knowledge-base/16m-lease-and-gowsign-signwell-routing-qa2.md
  - src/data/state-merchant-matrix.ts
  - src/helpers/gowsign-template-db.helpers.ts
  - src/helpers/gowsign-signing.helper.ts
  - src/helpers/esign-db.helpers.ts
---

# VA 16-Month GowSign Template — Content & Routing Oracle (work item #568)

> Operation: validate the content and routing of the template **`VA_2025_SAC_16_MONTHS`**
> (Virginia, 16 months, SAC) rendered in the GowSign iframe/PDF, plus the 13m negative control
> (`VA_2025_SAC`) when a VA 13m template exists. This operation is NEW (a new state added to the
> GowSign rollout in milestone RU07.26.1.54.0). Preconditions
> (`send-application`, `new-application`, `cc-ach`, `terms-of-agreement`, `gowsign-signing`) already
> have their own oracles — reuse, do NOT recreate.
>
> **Routing (provider rule):** `effectiveState = INSTORE ? merchant.state : customerState`;
> if a row exists in `uown_gow_sign_template` for `(VA, client_type=null)` in the relevant term →
> GOWSIGN, else merchant `esign_client` (SIGNWELL fallback). The term (13 vs 16) comes from the
> merchant program / ABB EligibleTerms (Kornerstone ONLINE → 16), NOT the SSN suffix.
> `uown_esign_document.client`/`request.document.templateId` (created at CONTRACT_CREATED) is the
> source of truth for the selection — assert via `assertSelectedTemplateForLead`.
>
> **Inventory (UNVERIFIED — discovery pending):** VA is NOT yet in the qa2 template map dated
> 2026-06-17 (`16m-lease-and-gowsign-signwell-routing-qa2.md`) nor in the appendix-H H.4 matrix.
> `src/data/state-merchant-matrix.ts` VA row still reads `expectedProvider: 'SIGNWELL'` — this is
> the STALE dated matrix (same drift that hit AL/IL/OH before verification; rule #16). Because #568
> adds the VA template, VA now routes GOWSIGN for the state where the template exists. Whether VA
> has BOTH terms (like AL/IL/FL) or is 16m-only (like OH) is UNVERIFIED — the ticket's AC5 references
> a "standard VA SAC" 13m baseline, implying a `VA_2025_SAC` 13m template exists, but this MUST be
> confirmed via `getGowSignTemplatesForState(db, 'VA')` before asserting. Re-list before every run.
>
> **⚠️ Automation blocker (inherited from AL/IL siblings):** the only route to a VA 16m lease is a
> Kornerstone ONLINE merchant whose `valid_states` includes VA (ABB returns EligibleTerms 16), whose
> `/complete` CC pre-auth page lives on `secure-<env>.kornerstoneliving.com` behind the **NeuroID**
> behavioral anti-bot gate. `submitApplication` via API is NeuroID-blocked (no `uown_esign_document`
> created, lead stuck UW_APPROVED — proven on IL lead 7218278/AL lead 16653). The browser bypass
> (fill CC → "Failed to verify identification" → reload → "Sign Contract") was proven only manually
> via MCP (no page object). Therefore the 16m content checkpoints (CT-02..CT-07) are today
> validatable ONLY by MCP-manual render; the exact canonical text must freeze those checkpoints from
> `[EXPECTED]` to `[CONFIRMED]`. Non-Kornerstone ONLINE (TerraceFinance, VA `validMerchant`) caps at
> 13m → covers CT-01 negative control + CT-07 sanity reference only, NOT the 16m-specific content.
>
> **Primary sources:** ticket capture `docs/taskTestingUown/RU07.26.1.54.0_addVaGowSignTemplate_568/RU07.26.1.54.0_addVaGowSignTemplate_568.md`
> (Gustavo Martins' Testing Steps = de-facto AC) · `docs/business-rules/appendix-h-epo-template-registry.md`
> (R1/R2/R3 baselines + token glossary) · `docs/business-rules/03-contratos-esign.md` §8 ·
> `docs/knowledge-base/16m-lease-and-gowsign-signwell-routing-qa2.md` (routing) ·
> `docs/knowledge-base/alabama-gowsign-template.md` (sibling pattern + NeuroID blocker BR-07) ·
> `docs/knowledge-base/illinois-gowsign-template.md` (sibling oracle pattern).

## VA-specific deltas vs the sibling states (do NOT copy IL/IN/TN wording blindly)

| Clause | VA rule (this ticket) | Do NOT confuse with |
|---|---|---|
| Item 4 accrual | daily lease fees **through the exercise date** | (matches FL/TN `exercise_date_promo`) |
| Item 4a tail | `[totalNumberOfPayments]` payments of `$ [nextPaymentDueAmount] (plus tax)`; total `$ [contractAmount] (including tax) (including the application fee)`, "Total Cost," | TX tail uses `firstPaymentDueAmount`; TN/FL tail uses "plus $ [salesTax] in sales tax" + "processing fee" — VA uses **neither** |
| Item 7 reinstatement | **5 / 21 / 45 days at 2/3 Total Cost** | IL = 16/60-day; IN = 120-day; TN = 90/180-day |
| Item 3 term start | on the **delivery date** (not paycheck) | — |
| Return language | "no further obligation, except for any past due payments due" | — |

## Acceptance Criteria (derived from #568 Testing Steps — Gustavo Martins 2026-06-24)

| ID | Criterion | CT | Source |
|---|---|---|---|
| AC-01 | VA 16m → template `VA_2025_SAC_16_MONTHS`; VA 13m → `VA_2025_SAC` (if it exists); both client=GOWSIGN | CT-01 | DB inventory (pending) / esign-doc at CONTRACT_CREATED |
| AC-02 | Item 4 — heading exactly "Promotional-Payoff Option:" + at-any-time daily-accrual-through-exercise-date narrative; no day-window / expiry / Cash-Price-promo / "other purchase options" wording | CT-02 | #568 AC1 + appendix-H R1 |
| AC-03 | Item 4a — Lease-Purchase Ownership + VA tail `[totalNumberOfPayments]` × `$ [nextPaymentDueAmount] (plus tax)`, total `$ [contractAmount] (including tax)(including the application fee)`, "Total Cost," + "and you will own the Property"; no % discount, no TN "plus $ salesTax in sales tax"/"processing fee" | CT-03 | #568 AC2 |
| AC-04 | Token render smoke — every occurrence non-empty + zero `{{ }}` + logo + cross-check vs `uown_esign_document.request.document.variables`; no "variables map missing" dispatch note | CT-04 | #568 AC + AL regression watch (`nextPaymentDueAmount` blank) |
| AC-05 | Lease-purchase-plan footnote — "Traditional [N] Month Lease Purchase Plan", "with a Promotional Payoff option", "Early Purchase Option Available Off Unpaid Balance", populated `[leasePurchasePlan]` grid; no EPO payoff chart / numbered options | CT-05 | #568 AC3 |
| AC-06 | Singular "EARLY PURCHASE OPTION" appendix — "This Agreement has a 16-month term for ownership.", single intro "For a 16-month lease, the EPO price is calculated as:", same 5 bullets as TN, "call us at [phone]"; no plural OPTIONS / Option 1&2 / promo deadline / sub-points a–e / customer initials; page order: next section is Item 14 (ACH), not duplicated | CT-06 | #568 AC4 + appendix-H R3 |
| AC-07 | Sanity §1–§14 vs standard VA SAC — Item 3 term starts on delivery date; Item 7 reinstatement **5/21/45 days at 2/3 Total Cost**; return "no further obligation, except for any past due payments due" | CT-07 | #568 AC5 |
| AC-08 | Full GowSign signing → lead SIGNED + activity logs (rule #13) | CT-08 | gowsign-signing.md + AL sibling |

## Scenarios

```gherkin
Feature: VA 16-Month GowSign Lease-Purchase Template (#568)

  Background:
    Given a merchant whose effective VA routing yields a VA GowSign template
    And a fresh customer, state VA, fresh SSN (bankData on sendApplication for Kornerstone)
    And the lead was driven to CONTRACT_CREATED (CC pre-auth on the /complete page)
    And the GowSign iframe rendered the contract (host gowsign-app-dev-uown.azurewebsites.net)

  Scenario: [positive] CT-01 — Routing 16m vs 13m
    When a VA lease is created with a 16m plan (WK16)
    Then uown_esign_document.client is "GOWSIGN" and the selected template is "VA_2025_SAC_16_MONTHS"
    When a VA lease is created with a 13m plan (WK13) as the negative control
    Then uown_esign_document.client is "GOWSIGN" and the selected template is "VA_2025_SAC"

  Scenario: [positive] CT-02 — Item 4 Promotional-Payoff Option
    Then the heading reads exactly "Promotional-Payoff Option:" (not "[X] Day Promotional Payoff Option")
    And the text allows exercising the option "at any time" for $ [costPriceWithFeeNoTax] plus tax, minus on-time payments, plus daily lease fees accrued through the exercise date
    And a late payment voids the option
    And the text does NOT contain "During the first … days of this Agreement", "This option expires on [date]", the "Cash Price of the item(s)" promo wording, nor "You have other purchase options described below"
    And no populated OR blank {{epoDays}} / {{epoExpiryDate}} token appears

  Scenario: [positive] CT-03 — Item 4a Lease-Purchase Ownership
    Then the customer must be current to elect the EPO, and EPO = daily lease charges through the exercise date + fees/taxes − on-time payments
    And the tail reads exactly: [totalNumberOfPayments] payments of $ [nextPaymentDueAmount] (plus tax); total $ [contractAmount] (including tax) (including the application fee), the "Total Cost," and you will own the Property
    And [nextPaymentDueAmount] renders NON-empty (AL migration regression watch)
    And the text does NOT contain an X% discount on remaining lease payments, the TN-style "plus $ [salesTax] in sales tax" + separate "processing fee" wording

  Scenario: [positive] CT-04 — Token render smoke
    Then costPriceWithFeeNoTax, nextPaymentDueAmount, contractAmount, totalNumberOfPayments, companyInfoBrandPhone all render NON-empty
    And there is no "{{…}}" in the visible text
    And the brand logo appears at the top
    And each monetary value matches (float tolerance) uown_esign_document.request.document.variables
    And there is no "[DocumentDispatchService][GowSign] … variables map missing … token(s)" note for this lead

  Scenario: [positive] CT-05 — Lease-purchase-plan footnote
    Then the text contains "Traditional [N] Month Lease Purchase Plan", "with a Promotional Payoff option", "Early Purchase Option Available Off Unpaid Balance"
    And the [leasePurchasePlan] grid is populated
    And the text does NOT contain an EPO payoff chart / [earlyPurchaseOption] table nor a numbered promotional/EPO option list

  Scenario: [positive] CT-06 — EPO appendix (singular) + page order
    Then there is a singular section "EARLY PURCHASE OPTION" (not "OPTIONS")
    And it contains "This Agreement has a 16-month term for ownership."
    And it contains the single formula intro "For a 16-month lease, the EPO price is calculated as:" (mind the "16-\nmonth" line break)
    And it lists the same 5 bullets as TN: cost of leased goods; plus taxes; plus applicable fees; plus accrued daily lease fees through the exercise date; minus payments made excluding taxes/fees
    And it contains "call us at [phone]"
    And it does NOT contain the plural "EARLY PURCHASE OPTIONS", an Option 1/2 structure, a promo deadline ("Purchase the Property by [epoExpiryDate]"), sub-points a.–e., nor a customer-initials line on this page
    And the next section after the appendix is Item 14 (ACH Payments), and the EPO page is not duplicated

  Scenario: [diff] CT-07 — Sanity §1–§14 vs standard VA SAC (non-EPO regression)
    Then §3 the term starts on the delivery date (not the paycheck date)
    And §7 the agreement expires on a missed payment, with reinstatement at 5 / 21 / 45 days at 2/3 of Total Cost
    And the return language reads "no further obligation, except for any past due payments due"
    And no 16m-exclusive clause (standard-VA promo §4, %-discount §4a, plural Options appendix with initials) appears

  Scenario: [positive] CT-08 — Full signing + activity log
    When the GowSign ceremony completes (Start → adopt signature/initials → Sign All → Finish dialog → redirect appComplete)
    Then uown_los_lead.lead_status is "SIGNED"
    And uown_esign_document progresses SENT_TO_CUSTOMER → SIGNED with doc_signed_time_stamp populated
    And uown_los_lead_notes contains "[ContractService][isLeaseOrLeaseModSigned]…SIGNED", "[EsignRedirectService][updateSignStatus]…to SIGNED" and "[ESIGNSERVICE][parseCCPeekConsent]"
```

## Oracles

> **Staleness check (run before any Oracle):**
> ```bash
> git log e4713f2..HEAD -- docs/business-rules/appendix-h-epo-template-registry.md docs/knowledge-base/16m-lease-and-gowsign-signwell-routing-qa2.md src/data/state-merchant-matrix.ts src/helpers/gowsign-template-db.helpers.ts src/helpers/gowsign-signing.helper.ts src/helpers/esign-db.helpers.ts
> ```
> Non-empty output → prepend `[BDD MAY BE STALE]` to the report.

### Oracle: CT-01 — Routing 16m vs 13m  `[EXPECTED — pending DB inventory getGowSignTemplatesForState(db,'VA') + esign-doc at CONTRACT_CREATED]`

| Checkpoint | How to verify |
|---|---|
| VA 16m template exists | `getGowSignTemplatesForState(db,'VA')` contains name=`VA_2025_SAC_16_MONTHS` |
| VA 13m template exists (control) | same query contains name=`VA_2025_SAC` (if absent → VA is 16m-only like OH; skip the 13m control, document it) |
| 16m offer | `sendInvoice` → `paymentDetailsList` contains `termInMonths=16`, `planId=WK16` |
| 13m offer | same list contains `termInMonths=13`, `planId=WK13` (Kornerstone ABB both; TerraceFinance caps at 13m) |
| Selection 16m | after CONTRACT_CREATED: `assertSelectedTemplateForLead(db, leadPk, 'VA_2025_SAC_16_MONTHS')` (client=GOWSIGN) |
| Selection 13m (control) | 13m lead: `assertSelectedTemplateForLead(db, leadPk, 'VA_2025_SAC')` |

### Oracle: CT-02..CT-07 — Content of `VA_2025_SAC_16_MONTHS`  `[EXPECTED — pending canonical capture via MCP-manual render; see Automation blocker]`

| Checkpoint | How to verify |
|---|---|
| Body render | `frame.locator('body').innerText()` of the GowSign iframe (`AlternativeContractModalPage.getGowSignFrame()`); normalize whitespace. Iframe class `alternative-contract-vendor_iframe__nSb3A` (host varies by env — do not match `gowsign.com`) |
| CT-02 Item 4 MUST | body contains exact heading "Promotional-Payoff Option:" + at-any-time daily-accrual-through-exercise-date phrase ($ costPriceWithFeeNoTax + tax − on-time payments + accrued daily lease fees through exercise date) |
| CT-02 Item 4 MUST NOT | body does NOT match /During the first .* days/, /This option expires on/, /Cash Price of the item\(s\)/, "You have other purchase options described below", `{{epoDays}}`, `{{epoExpiryDate}}` |
| CT-03 Item 4a MUST | tail regex `/[\d,]+ payments of \$\s?[\d.,]+ \(plus tax\)/` + `/\$\s?[\d.,]+ \(including tax\) ?\(including the application fee\)/` + "Total Cost," + "and you will own the Property"; `nextPaymentDueAmount` non-empty |
| CT-03 Item 4a MUST NOT | does NOT match `/\d+%\s*discount/` (payOffDiscountPercent), NOR `/plus \$\s?[\d.,]+ in sales tax/` + separate "processing fee" (TN-style) |
| CT-04 tokens | for each monetary token, the value from `uown_esign_document.request.document.variables` appears in the body (commas stripped, cent tolerance via `toBeCloseTo`); `expect(body).not.toMatch(/\{\{|\}\}/)`; logo `<img>` at top; absence of the "variables map missing" note |
| CT-05 footer MUST | "Traditional", "Month Lease Purchase Plan", "with a Promotional Payoff option", "Early Purchase Option Available Off Unpaid Balance", populated `[leasePurchasePlan]` grid |
| CT-05 footer MUST NOT | does NOT contain an `earlyPurchaseOption` chart/table nor "Option 1"/"Option 2" |
| CT-06 EPO appendix | contains singular "EARLY PURCHASE OPTION", "This Agreement has a 16-month term for ownership.", "For a 16-\n?month lease, the EPO price is calculated as:", the 5 bullets, "call us at"; does NOT contain "OPTIONS"/"Option 1"/"Option 2"/"[epoExpiryDate]"/an initials line; Item 14 (ACH) follows immediately (single occurrence, no duplicate page) |
| CT-07 sanity | §3 delivery-date term start; §7 reinstatement **5/21/45 days at 2/3 Total Cost** (NOT IL 16/60, IN 120, TN 90/180); return "no further obligation, except for any past due payments due"; divergence = `[finding]` |

### Oracle: CT-08 — Signing + log (rule #13)  `[EXPECTED — reuses gowsign-signing.md; blocked by NeuroID on the Kornerstone host for 16m]`

| Checkpoint | How to verify |
|---|---|
| Ceremony | `signGowSignInFrame(page, frame, { preauthChoice:'yes', waitForCompleted:true })` → `capturedCompleted=true` |
| lead SIGNED | `waitForLeadStatus(db, leadPk, 'SIGNED')` |
| esign SIGNED | `uown_esign_document.status='SIGNED'`, `doc_signed_time_stamp` non-null (query by lead+client; `request` may become the string `getDocumentStatus` post-signature) |
| Logs (rule #13) | `uown_los_lead_notes` contains "[ContractService][isLeaseOrLeaseModSigned]…SIGNED", "[EsignRedirectService][updateSignStatus]…to SIGNED", "[ESIGNSERVICE][parseCCPeekConsent]" |

> Execution pitfalls (Kornerstone host): the Buddy widget can swallow the "Proceed" click (re-click / raw DOM `.click()`); NeuroID requires the reload→"Sign Contract" trick (proven only via MCP-manual). `signGowSignInFrame` may not click the final "Finish to finalize" dialog — click `frame.getByRole('button',{name:/^Finish$/i}).last()` until the confirmation text disappears (AL BR / framework gap).

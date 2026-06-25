---
title: "Appendix H: 16-Month EPO Template Registry"
domain: business-rules
status: stable
volatility: volatile
last_verified: 2026-06-23
sources:
  - external-doc: https://gitlab.com/groups/uown/-/wikis/gow-sign/EPO-SECTIONS
covers: [epo, template-rendering, gowsign-routing, 16m-lease, state-rules]
---

# Appendix H: 16-Month EPO Template Registry
## UOwn Leasing - SVC Platform

Canonical registry of the content of the **16-month** (SAC) GowSign contract templates — EPO (Early Purchase Option) clauses by state, renderable tokens, and validation matrix. This is the **contract content** registry that complements the EPO **calculation** in [`04-calculos-financeiros.md`](04-calculos-financeiros.md) §7/§15/§56/§70 (the calculation cascade is NOT repeated here) and the e-sign **flow** in [`03-contratos-esign.md`](03-contratos-esign.md) §8.

> **Primary (authoritative) source:** GitLab wiki `gow-sign/EPO-SECTIONS` — `https://gitlab.com/groups/uown/-/wikis/gow-sign/EPO-SECTIONS` (captured 2026-06-23). `[external-doc:gitlab/EPO-SECTIONS,2026-06-23]`. Because it is the official product source, the clauses and tokens below are `[CONFIRMED]`. Correlations with known regressions are `[HYPOTHESIS]` except where dated memory confirms.
>
> **Why `volatility: volatile`:** template state-routing/content drifts (cat. #17 in [[volatile-knowledge-registry]] — this was the NY/OH case). Always reconfirm against the real template (`uown_gow_sign_template`) and the PDF flatten before asserting a state's current state.

---

## H.1 Diagnostic status legend

| Status | Meaning |
|--------|-------------|
| **Reuse** | The surface aligns with an already-validated 16-month cluster; the donor's text can be reused. |
| **Reuse — adjustments** | Mostly reusable; specific deltas listed. |
| **New baseline** | Does not align with existing donors — the business must validate it as a new type. |

The 16-month HTML templates of **CA, TX, and FL** are business-validated. FL is a *reuse adjustment* of the TX donor (exercise-date variant). `[external-doc:gitlab/EPO-SECTIONS,2026-06-23]`

---

## H.2 Validated 16-month baselines (R1–R5)

Each baseline is a **section type** with canonical text and applicable states. The main axis of variation is **daily accrual to the current date (`current_date_*`)** vs **to the exercise date (`exercise_date_*`)**.

### R1 — `current_date_promo` (Item 4 — daily fees to the current date)
**States:** CA, TX

> **Promotional-Payoff Option:** You can buy the Property at any time by paying $ {{costPriceWithFeeNoTax}} plus tax, less all rental payments you have made on time (not including any taxes or fees), plus daily lease fees from the inception of the lease through the date you exercise the Early Purchase Option. Any late payments will void this option.

### R1 — `exercise_date_promo` (Item 4 — daily fees to the exercise date)
**States:** AL, FL, LA, NC, TN

> **Promotional Payoff Option:** You can buy the Property at any time by paying $ {{costPriceWithFeeNoTax}} plus tax, less all rental payments you have made on time (not including any taxes or fees), plus daily lease fees from the inception of the lease through the date you exercise the Early Purchase Option. Any late payments will void this option.

### R2 — `exercise_date_epo_fl` (Item 4a — exercise date + nextPaymentDueAmount / salesTax)
**States:** AL, FL, NC, TN

> **Lease-Purchase Ownership:** You do not own the property. However, if you choose, you may purchase the property at any time. If you are current, you may elect your Early Purchase Option (EPO) at any time. Your EPO price is calculated by adding the daily lease charges accrued based on the number of days from lease inception through the date you exercise the Early Purchase Option, together with all applicable fees and taxes, less all rental payments you have made on time (not including taxes and fees). The purchase price does not include other charges such as late fees, which are explained below. You do not obtain any ownership rights until you have paid for the Property in full. If you make {{totalNumberOfPayments}} payments of $ {{nextPaymentDueAmount}} plus $ {{salesTax}} in sales tax in a row, and you pay the processing fee, you will have paid a total of $ {{contractAmount}} (the "Total Cost"), and you will own the Property.

### R2 — `current_date_epo_tx` (Item 4a — current date + Total Cost / application fee)
**States:** TX

> **Lease-Purchase Ownership:** You do not own the property. However, if you choose, you may purchase the property at any time. If you are current, you may elect your Early Purchase Option (EPO) at any time. Your EPO price is calculated by adding the daily lease charges accrued based on the number of days from lease inception through the current date, together with all applicable fees and taxes, less all rental payments you have made on time (not including taxes and fees). The purchase price does not include other charges such as late fees, which are explained below. You do not obtain any ownership rights until you have paid for the Property in full. If you make {{totalNumberOfPayments}} payments of $ {{firstPaymentDueAmount}} (plus tax) in a row, you will have paid a total of $ {{contractAmount}} (including tax) (including the application fee), the "Total Cost," and you will own the Property. Taxes are subject to changes in the applicable tax rate.

### R2 — `current_date_epo_ca` (Item 4a — current date + Total of Payments / Processing Fee)
**States:** CA

> **Lease-Purchase Ownership:** You do not own the property. However, if you choose, you may purchase the property at any time. If you are current, you may elect your Early Purchase Option (EPO) at any time. Your EPO price is calculated by adding the daily lease charges accrued based on the number of days from lease inception through the current date, together with all applicable fees and taxes, less all rental payments you have made on time (not including taxes and fees). The purchase price does not include other charges such as late fees, which are explained below. You do not obtain any ownership rights until you have paid for the Property in full. If you make {{totalNumberOfPayments}} payments of ${{firstPaymentDueAmount}} (plus tax) in a row, and you pay the Processing Fee, you will have paid a total of ${{contractAmount}}, the "Total of Payments," and you will own the Property.

### R3 — `shared_16month_appendix` (Appendix — shared 16-month formula page)
**States:** AL, CA, FL, LA, NC, TN, TX

> EARLY PURCHASE OPTION
>
> This Agreement has a 16-month term for ownership. However, you may purchase the Property at any time before the end of the lease term.
>
> Early Purchase Option ("EPO"): You may buy the Property at any time by paying the EPO price. For a 16-month lease, the EPO price is calculated as:
>
> The cost of the leased goods · Plus taxes · Plus applicable fees · Plus accrued daily lease fees from the lease inception date through the date you exercise the Early Purchase Option. · Minus any payments made, excluding taxes and fees
>
> To exercise this option, you must call us at {{companyInfoBrandPhone}}.

### R4 — `shared_footnote` (Lease plan footnote — Promotional Payoff option)
**States:** AL, CA, FL, LA, NC, TN, TX

> with a Promotional Payoff option

### R5 — `ca_chart` (EPO payoff chart)
**States:** CA

> **Early Purchase Option – Amount Following Each Rental Payment**
>
> The following chart shows your Early Purchase Option ("EPO") price after each lease payment, assuming you make each payment on time. Please note that any amounts that are past due must be paid before you may exercise your Early Purchase Option.
>
> `[table|earlyPurchaseOption]`

---

## H.3 Diagnostic of the SAC templates by state

Reuse vs new-baseline diagnostic for each `*_2025_SAC.html`. The clause variants (R1–R5) that **differ** from the validated baselines are in `<details>` (verbatim legal text). The implemented 16-month template is `*_16_MONTHS.html`.

### AL — `AL_2025_SAC.html` — **Reuse TX**
Reuses the TX exercise-date daily-accrual clusters (Item 4a, FL style).
<details>
<summary>R1 — Item 4 — Promotional payoff (closest: <code>exercise_date_promo</code>)</summary>

> **{{epoDays}} Day Promotional Payoff Option:** During the first {{epoDays}} days from the date of your Initial Payment (Item 2), you can buy the Property by paying the Cash Price, {{epoFeeText}} a total of $ {{payOffAmountBeforeEPOExpiry}}, less all rental payments you have made on time (not including any taxes or fees), plus tax. Any late payments will void this option. You have other purchase options described below.
</details>
<details>
<summary>R2 — Item 4a — Lease-Purchase Ownership / EPO (closest: <code>exercise_date_epo_fl</code>)</summary>

> **Lease-Purchase Ownership:** ...After your {{epoDays}}-Day-Promotional-Payoff Option (Item 4) you may acquire ownership of the Property at any time by tendering to us all past due lease payments and fees and an amount equal to the total amount of remaining lease payments for ownership (not including any taxes or fees) less a {{payOffDiscountPercent}}% discount, plus tax... If you make {{totalNumberOfPayments}} payments of $ {{nextPaymentDueAmount}} plus $ {{salesTax}} in sales tax in a row, and you pay the processing fee, you will have paid a total of $ {{contractAmount}} (the "Total Cost"), and you will own the Property.
</details>
<details>
<summary>R3 — Consumer appendix (EARLY PURCHASE OPTIONS page) (closest: <code>shared_16month_appendix</code>)</summary>

> **EARLY PURCHASE OPTIONS** — This Agreement has a {{numOfMonths}}-month term for ownership. (1) Promotional Payoff Option: Purchase within {{epoDays}} days from when your Initial Payment becomes due and pay only $ {{payOffAmountBeforeEPOExpiry}}, including tax. Call {{companyInfoBrandPhone}}. Price = Cash Price, {{epoFeeText}} less all rental payments made (not including any taxes or fees), plus tax. Only available on the {{companyInfoBrandName}} Traditional Lease Purchase Plan. (2) Early Purchase Option: Beginning {{payOffStartDateAfterEpoExpiry}}, buy at any time by paying the EPO price. Call {{companyInfoBrandPhone}}.
</details>

### GA — `GA_2025_SAC.html` — **Reuse TX**
Business review before the 16-month build. R1 closest `current_date_promo`, R2 closest `exercise_date_epo_fl` (uses `{{epoExpiryDate}}` + `{{payOffDiscountPercent}}%`).
<details>
<summary>R2 — Item 4a — Early Purchase Option (GA)</summary>

> **Early Purchase Option:** ...After {{epoExpiryDate}}, your EPO price is the total amount of remaining lease payments for ownership (not including any taxes or fees) less a {{payOffDiscountPercent}}% discount, plus tax...
</details>

### LA — `LA_2025_SAC.html` — **Reuse TX — adjustments**
Reuses the TX exercise-date daily-accrual with the LA tail of Item 4a ownership.
<details>
<summary>R2 — Item 4a — Lease-Purchase Ownership / EPO (LA)</summary>

> **Lease-Purchase Ownership:** ...After your {{epoDays}}-Day-Promotional-Payoff Option, your EPO price is the total amount of remaining lease payments for ownership (not including any taxes or fees) less a {{payOffDiscountPercent}}% discount, plus tax... If you make {{totalNumberOfPayments}} payments of $ {{nextPaymentDueAmount}} plus $ {{salesTax}} in sales tax in a row, and you pay the Processing Fee, you will have paid a total of $ {{contractAmount}}, the "Total Cost"...
</details>

### NC — `NC_2025_SAC.html` — **Reuse TX**
NC particularity: **EPO never below `{{lastPaymentDueAmountWithTax}}`** (floor balloon) + final balloon `{{lastPaymentDueAmount}}`.
<details>
<summary>R2 — Item 4a — Lease-Purchase Ownership / EPO (NC, with balloon floor)</summary>

> **Lease-Purchase Ownership:** ...Your EPO price is the total amount of remaining lease payments for ownership (not including any taxes or fees) less a {{payOffDiscountPercent}}% discount, plus tax. However, your EPO price will never be less than $ {{lastPaymentDueAmountWithTax}}... If you make {{totalNumberOfPaymentsBeforeFinal}} payments of $ {{nextPaymentDueAmount}} (plus tax) in a row Plus a final balloon payment of $ {{lastPaymentDueAmount}} (plus tax), you will have paid a total of $ {{contractAmount}}...
</details>

### NY — `NY_2025_SAC.html` — **New baseline ⚠**
**Proportional Cash Price formula** in Item 4a, NOT daily-accrual. Does not align with the validated 16-month donors — distinct validation risk (see H.5).
<details>
<summary>R2 — Item 4a — Rental-Purchase Ownership / EPO (NY proportional)</summary>

> **Rental-Purchase Ownership:** ...After the Promotional-Payoff Option expires, you may acquire ownership of the Property at any time by tendering to us all past due rental payments and fees and an amount equal to the Cash Price, $ {{costPriceWithFeeNoTax}}, multiplied by the number of rental payments remaining for ownership divided by the total number of rental payments for ownership (not including any taxes or fees), plus tax (EPO Price). The attached chart shows the amount required to exercise your early purchase option after each renewal payment... If you make {{totalNumberOfPayments}} payments of $ {{firstPaymentDueAmount}} plus $ {{salesTax}} in sales tax) in a row, and you pay the Processing Fee, you will have paid a total of $ {{contractAmount}}, the "Total Cost"...
</details>

NY also reuses **R5 `ca_chart`** (`[table|earlyPurchaseOption]`).

### OH — `OH_2025_SAC.html` — **Reuse TX**
OH particularity: **EPO = Cash Price less 50% of payments made**.
<details>
<summary>R2 — Item 4a — Lease-Purchase Ownership / EPO (OH, less 50%)</summary>

> **Lease-Purchase Ownership:** ...After your {{epoDays}}-Day-Promotional Payoff Option expires, your EPO price is the Cash Price, above, {{epoFeeText}} less 50% of all lease payments made (not including any taxes or fees), plus tax... If you make {{totalNumberOfPayments}} payments of $ {{nextPaymentDueAmount}} plus $ {{salesTax}} in sales tax in a row, and you have paid the Processing Fee, you will have paid a total of $ {{contractAmount}}, the "Total Cost"...
</details>

### PA — `PA_2025_SAC.html` — **Reuse TX**
R2 uses a `{{payOffDiscountPercent}}%` discount on the Cash Price; also reuses R5 `ca_chart`.
<details>
<summary>R2 — Item 4a — Early Purchase Option (PA)</summary>

> **Early Purchase Option:** ...After your {{epoDays}}-Day-Promotional-Payoff Option expires, your EPO price will be the Cash Price, $ {{costPriceWithFeeNoTax}}, less a {{payOffDiscountPercent}}% discount of lease payments made (not including any taxes or fees), plus tax...
</details>

### TN — `TN_2025_SAC.html` — **Reuse TX**
Reuses the TX exercise-date daily-accrual (Item 4a, FL style). Item 7 reinstatement tiers differ (90/180 days).
<details>
<summary>R2 — Item 4a — Lease-Purchase Ownership / EPO (TN)</summary>

> **Lease-Purchase Ownership:** ...After your {{epoDays}}-Day-Promotional-Payoff Option (Item 4) you may acquire ownership of the Property at any time by tendering... an amount equal to the total amount of remaining lease payments for ownership (not including any taxes or fees) less a {{payOffDiscountPercent}}% discount, plus tax... If you make {{totalNumberOfPayments}} payments of $ {{nextPaymentDueAmount}} plus $ {{salesTax}} in sales tax in a row, and you pay the processing fee, you will have paid a total of $ {{contractAmount}} (the "Total Cost")...
</details>

---

## H.4 Validation matrix (16-month)

| Block | CA | TX | FL | LA | NC | AL | TN | PA | OH | GA |
|-------|----|----|----|----|----|----|----|----|----|----|
| R1 — Item 4 — Promotional payoff | `current_date_promo` | `current_date_promo` | `exercise_date_promo` | `exercise_date_promo` | `exercise_date_promo` | `exercise_date_promo` | `exercise_date_promo` | `exercise_date_promo` | `current_date_promo` | `exercise_date_promo` |
| R2 — Item 4a — Lease-Purchase Ownership / EPO | `current_date_epo_ca` | `current_date_epo_tx` | `exercise_date_epo_fl` | Differs | `exercise_date_epo_fl` | `exercise_date_epo_fl` | `exercise_date_epo_fl` | — | `current_date_epo_tx` | — |
| R3 — Consumer appendix (EARLY PURCHASE OPTION page) | `shared_16month_appendix` | `shared_16month_appendix` | `shared_16month_appendix` | `shared_16month_appendix` | `shared_16month_appendix` | `shared_16month_appendix` | `shared_16month_appendix` | `shared_16month_appendix` | `shared_16month_appendix` | `shared_16month_appendix` |
| R4 — Lease plan table footnote | `shared_footnote` | `shared_footnote` | `shared_footnote` | `shared_footnote` | `shared_footnote` | `shared_footnote` | `shared_footnote` | `shared_footnote` | `shared_footnote` | `shared_footnote` |
| R5 — EPO payoff chart (CA only) | `ca_chart` | — | — | — | — | — | — | `ca_chart` | — | — |

`[external-doc:gitlab/EPO-SECTIONS,2026-06-23]`

---

## H.5 Token glossary

Every `{{token}}` that appears in the 16-month EPO templates. **These tokens MUST render NON-empty in the signed PDF** for the respective state.

| Token | Content |
|-------|----------|
| `{{costPriceWithFeeNoTax}}` | Cash Price (with fee, no tax) — EPO base |
| `{{nextPaymentDueAmount}}` | Next installment amount (no tax) |
| `{{salesTax}}` | Tax on the installment |
| `{{totalNumberOfPayments}}` | Total number of installments |
| `{{totalNumberOfPaymentsBeforeFinal}}` | Installments before the final balloon (NC) |
| `{{contractAmount}}` | Contract "Total Cost" |
| `{{firstPaymentDueAmount}}` | First installment amount |
| `{{epoDays}}` | Promotional Payoff window (days) |
| `{{epoFeeText}}` | Descriptive text of the EPO fee |
| `{{payOffAmountBeforeEPOExpiry}}` | Payoff amount within the promotional window |
| `{{payOffDiscountPercent}}` | EPO discount percentage (states PA/AL/LA/NC/TN/GA) |
| `{{epoExpiryDate}}` | Expiration date of the promotional EPO |
| `{{payOffStartDateAfterEpoExpiry}}` | Start of the regular EPO after the promotional one expires |
| `{{numOfMonths}}` | Term in months (16) |
| `{{companyInfoBrandPhone}}` | Brand phone (OH = (877)357-5474) |
| `{{companyInfoBrandName}}` | Brand name |
| `{{lastPaymentDueAmount}}` | Final balloon installment amount (NC) |
| `{{lastPaymentDueAmountWithTax}}` | EPO floor in NC (balloon with tax) |
| `[table|earlyPurchaseOption]` | EPO payoff chart (CA, NY, PA) — renders a dynamic table |

---

## H.6 QA testing note — NON-empty render per state

> **Test rule:** visually validate (PDF flatten / iframe — inviolable rule #14) that the EPO tokens render NON-empty for each state. Reading the backend log does NOT replace the render (Daniel's Jewelers CA bug, 2026-05-06).

Correlated known regressions (`[HYPOTHESIS]` except dated memory):
- **OH `{{nextPaymentDueAmount}}` blank** — BUG-01. **FIXED/validated in qa2 2026-06-22** (renders 95.16/22.07/43.50; zero "variables map missing" notes). `[memory:ohio-gowsign-template-fixed]` `[CONFIRMED via dated memory — reconfirm]`. Copy-check of the OH contract: anchor on `AGREEMENT-OH` (the word "Ohio" does NOT appear in the flatten); the EPO appendix line-breaks at `16-\nmonth` — see [[gowsign-knowledge]] OH render facts.
- **NY New baseline (proportional Cash Price formula, NOT daily-accrual)** — **distinct** validation risk: the NY calculation logic (`cost * remaining/total`) diverges from the daily-accrual donors. The NY template (`NY_2025_SAC`, 13m, route GowSign) is covered. The "epoDays within 90 days" regression was FIXED in qa2 2026-06-21. `[memory:ny-gowsign-epodays-fixed]` `[HYPOTHESIS — reconfirm against the current template/lead]`.

Validate the template selected per lead via `assertSelectedTemplateForLead` — routing by **customer state** (INSTORE also uses customer state; see cat. #17 [[volatile-knowledge-registry]]).

---

## Cross-links

- EPO calculation (per-state cascade, Kornerstone, NC floor) → [`04-calculos-financeiros.md`](04-calculos-financeiros.md) §7/§15/§56/§70
- E-sign flow + EPO sections pointer → [`03-contratos-esign.md`](03-contratos-esign.md) §8
- How to test signing (suites, regression, helpers) → [[gowsign-knowledge]]
- GowSign vendor API → [`appendix-a-integracoes.md`](appendix-a-integracoes.md) §GowSign Vendor API
- Volatile category #17 (template state-routing) → [[volatile-knowledge-registry]]

---

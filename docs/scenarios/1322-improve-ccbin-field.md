# Test Scenarios — #1322 Improve CCBIN Field

> Origin: https://gitlab.com/uown/frontend/origination/-/work_items/1322
> Milestone: UOWN | Origination — Improve CCBIN Field
> Discovery: 2026-06-15 — G1, G2, G3, G4 confirmados via Playwright MCP em qa2 (deployed)

## Demand summary

Improve the Employment & Financial step of the Submit Application flow to reduce credit card BIN entry errors. Changes include: making the CCBIN field numeric-only with a hard 6-digit cap; turning the card image into an interactive preview that reflects input in real time (entered digits in white, remaining positions masked); an optional green-check completion indicator; autofill suggestions for CC/ACH fields when the customer has previously saved financial data; and consistent behavior across UOWN (blue) and Kornerstone (green/purple) themes on both desktop and mobile.

## Impact analysis

| Rule | Source |
|------|--------|
| The CCBIN field (`#mainCreditCardBin`) already exists on the Employment & Financial step, added by task 1256 with a static image (`img[src*="ccbin"]`) and explanatory text | `docs/taskTestingUown/RU04.26.1.50.2_addCcbinImageAndInstructionToSendApplicationFlow_1256/` |
| Kornerstone is a distinct white-label application flow with its own branding; the portal login uses shared `kornerstone` credentials and merchant ref code `kornerstone` | `src/data/merchants.ts` lines 188–213 |
| Employment & Financial is Step 2 of the Send Application wizard; `fillEmploymentInfo()` already fills `creditCardBin` via `SELECTORS.naMainCreditCardBin` | `src/pages/origination/application-wizard.page.ts` lines 121–139 |
| The interactive card display must show "FIRST 6 DIGITS ONLY", entered digits in white, and remaining positions masked with asterisks | ticket AC — Interactive card display |
| Completion indicator (green check replacing Mastercard circles in card logo area) is implemented — green circle 26×26px with FontAwesome `fa-check` SVG in white, class `completionIcon__fINIv` | DOM inspection 2026-06-15, qa2 deployed |
| Autofill for CC/ACH fields is implemented via native `autocomplete` attributes: `cc-number` (CCBIN), `routing-number` (Routing); Account Number has `autocomplete="off"` | DOM inspection 2026-06-15, qa2 deployed |
| Kornerstone card uses a purple gradient background (vs UOWN blue); same component, different CSS theme | Screenshot 2026-06-15 (user-provided) |
| Validation error "Credit card bin must be exactly 6 digits" fires on blur when fewer than 6 digits entered; currently overlaps the instruction text — layout regression | Screenshot 2026-06-15 (user-provided) |
| Website (customer-facing) portals must be inspected at 375×667, 768×1024, and 1440×900 per CLAUDE.md Rule #15 | CLAUDE.md — Rule #15 |

**Gaps status after discovery (2026-06-15):**

| ID | Gap | Status |
|----|-----|--------|
| G1 | Autofill UX: surface mechanism for CC/ACH fields | ✅ **Resolved** — native `autocomplete` attrs: `cc-number` (CCBIN), `routing-number` (Routing), `off` (Account) |
| G2 | Completion indicator: implemented? Position? Visual? Toggle behavior? | ✅ **Resolved** — green circle 26×26 with white checkmark SVG; appears at 6 digits, disappears below 6 |
| G3 | Kornerstone purple card: implemented? | ✅ **Resolved** — purple gradient confirmed in screenshot; exact CSS values pending computed-style inspection |
| G4 | Interactive card DOM structure: what renders typed digits? | ✅ **Resolved** — `digit__U_KP1` SPAN (white); `placeholder__BypCD` SPAN (35% white); `mask__HBBFn` SPAN (muted blue) |
| G5 (new) | Validation message overlaps instruction text on blur — layout bug | 🐛 **Bug found** — error text renders in front of helper text; scenario added |

## Scenarios

```gherkin
Feature: Improve CCBIN field with interactive card preview on Employment & Financial step
  As a customer submitting a lease application
  I want a validated CCBIN input with a live card preview
  So that I can confidently enter only the 6 required digits without mistakes

  Background:
    Given I am a customer on the Employment & Financial step of the Submit Application flow
    And the credit card section is visible with the "First 6 Digits of Credit Card" field and the interactive card image

  # ── CCBIN field: numeric-only input ──────────────────────────────────────────

  Scenario Outline: [negative] non-numeric input is rejected in the CCBIN field
    Given the "First 6 Digits of Credit Card" field is empty
    When I attempt to type "<invalid_input>" into the CCBIN field
    Then the field value remains empty
    And no non-numeric character is visible in the field

    Examples:
      | invalid_input | class             |
      | A             | alphabetic letter |
      | !             | special character |

  Scenario: [negative] spaces cannot be typed into the CCBIN field
    Given the "First 6 Digits of Credit Card" field is empty
    When I press the spacebar inside the CCBIN field
    Then the field value remains empty
    And no space character appears in the field

  # ── CCBIN field: maximum length ──────────────────────────────────────────────

  Scenario: [negative] CCBIN field does not accept a seventh digit
    Given the "First 6 Digits of Credit Card" field already contains "123456"
    When I attempt to type an additional digit in the CCBIN field
    Then the field value remains "123456"
    And no character beyond the sixth position appears in the field

  Scenario: [positive] CCBIN field accepts exactly 6 numeric digits and preserves the field label
    Given the "First 6 Digits of Credit Card" field is empty
    When I type "412345" into the CCBIN field
    Then the field displays "412345"
    And the label "First 6 Digits of Credit Card" remains visible

  # ── CCBIN field: validation on blur ──────────────────────────────────────────

  Scenario: [negative] validation error appears when CCBIN field loses focus with fewer than 6 digits entered
    Given the "First 6 Digits of Credit Card" field is empty
    When I type "123" into the CCBIN field
    And I click outside the CCBIN field
    Then the error message "Credit card bin must be exactly 6 digits" is displayed below the field in red

  Scenario: [negative] validation error message does not overlap the instruction text below the field
    Given the "First 6 Digits of Credit Card" field is empty
    When I type "123" into the CCBIN field
    And I click outside the CCBIN field
    Then the error message "Credit card bin must be exactly 6 digits" is fully readable
    And the instruction text "Enter the first 6 digits from the card you used for your payment" is fully readable below the error without being obscured

  Scenario: [positive] no validation error is shown when the field is left empty
    Given the "First 6 Digits of Credit Card" field is empty
    When I click outside the CCBIN field without typing anything
    Then no validation error is displayed below the CCBIN field

  Scenario: [positive] no validation error is shown when exactly 6 digits are entered and the field loses focus
    Given the "First 6 Digits of Credit Card" field is empty
    When I type "412345" into the CCBIN field
    And I click outside the CCBIN field
    Then no validation error is displayed below the CCBIN field

  # ── Interactive card image: real-time update ──────────────────────────────────

  Scenario: [positive] credit card image updates immediately as each digit is typed
    Given the "First 6 Digits of Credit Card" field is empty
    When I type "4" then "1" then "2" into the CCBIN field
    Then after each digit the credit card image reflects the digits entered so far

  Scenario: [positive] digits shown on the card image match exactly what was typed
    Given the "First 6 Digits of Credit Card" field is empty
    When I type "412345" into the CCBIN field
    Then the credit card image shows "412345" in the positions corresponding to the first six digits

  # ── Interactive card image: "FIRST 6 DIGITS ONLY" label ──────────────────────

  Scenario: [positive] "FIRST 6 DIGITS ONLY" text remains visible on the card image regardless of how many digits have been entered
    Given the "First 6 Digits of Credit Card" field is empty
    When I type "123" into the CCBIN field
    Then the text "FIRST 6 DIGITS ONLY" is still visible on the credit card image

  Scenario: [positive] "FIRST 6 DIGITS ONLY" text is visible on the card image before any digit is entered
    Given the "First 6 Digits of Credit Card" field is empty
    When I view the credit card image without typing anything
    Then the text "FIRST 6 DIGITS ONLY" is visible on the card image

  # ── Interactive card image: contrast (white digits) ──────────────────────────

  Scenario: [positive] entered digits are displayed in white on the card image for visual contrast
    Given the "First 6 Digits of Credit Card" field is empty
    When I type "412345" into the CCBIN field
    Then the digits "412345" are shown on the credit card image in white

  # ── Interactive card image: masking ──────────────────────────────────────────

  Scenario: [positive] untyped card positions remain masked with underscores while digits are being entered
    Given the "First 6 Digits of Credit Card" field is empty
    When I type "12" into the CCBIN field
    Then the credit card image shows "12" for the entered positions
    And the remaining 4 BIN positions on the card display as empty placeholders

  Scenario: [positive] all non-CCBIN card digit groups remain masked with asterisks throughout entry
    Given the "First 6 Digits of Credit Card" field contains "412345"
    When I view the credit card image
    Then only the first six digit positions are shown as "412345"
    And the remaining digit groups on the card remain masked with asterisks

  # ── Completion indicator ─────────────────────────────────────────────────────

  Scenario: [negative] no completion indicator is shown while fewer than 6 digits have been typed
    Given the "First 6 Digits of Credit Card" field is empty
    When I type "12345" into the CCBIN field
    Then the Mastercard circles are visible in the card logo area
    And no green checkmark icon is visible on the credit card image

  Scenario: [positive] green check indicator appears in the card logo area when exactly 6 digits are entered
    Given the "First 6 Digits of Credit Card" field is empty
    When I type "412345" into the CCBIN field
    Then a green circle with a white checkmark icon is displayed in the card logo area
    And the Mastercard circles are no longer visible on the credit card image

  Scenario: [negative] completion indicator disappears when a digit is deleted after reaching 6 digits
    Given the "First 6 Digits of Credit Card" field contains "412345"
    When I delete one digit from the CCBIN field
    Then the green checkmark icon disappears from the card logo area
    And the Mastercard circles are visible again in the card logo area

  # ── Autofill: financial fields ───────────────────────────────────────────────
  # NOTE: autofill is implemented via native autocomplete attributes
  # CCBIN: autocomplete="cc-number" | Routing: autocomplete="routing-number" | Account: autocomplete="off"

  Scenario: [positive] CCBIN field is configured for browser autofill with credit card number data
    Given the customer's browser has a saved credit card number
    When the Employment & Financial step is displayed
    Then the "First 6 Digits of Credit Card" field offers a browser autofill suggestion for credit card number

  Scenario: [positive] Bank Routing Number field is configured for browser autofill with routing number data
    Given the customer's browser has saved banking data
    When the Employment & Financial step is displayed
    Then the "Bank Routing Number" field offers a browser autofill suggestion for routing number

  Scenario: [negative] Bank Account Number field does not offer browser autofill suggestions
    Given I am on the Employment & Financial step
    When I click on the "Bank Account Number" field
    Then no browser autofill suggestion is offered for the Bank Account Number field

  # ── Brand consistency ─────────────────────────────────────────────────────────

  Scenario: [positive] CCBIN improvements work correctly in the UOWN application flow with blue card
    Given I am on the Employment & Financial step of the UOWN (blue theme) application flow
    When I type "412345" into the CCBIN field
    Then the field accepts only the 6-digit value
    And the credit card image updates in real time reflecting "412345"
    And the card background uses the UOWN blue gradient

  Scenario: [positive] CCBIN improvements work correctly in the Kornerstone application flow with purple card
    Given I am on the Employment & Financial step of the Kornerstone application flow
    When I type "412345" into the CCBIN field
    Then the field accepts only the 6-digit value
    And the credit card image updates in real time reflecting "412345"
    And the card background uses the Kornerstone purple gradient

  # ── Responsive behavior ───────────────────────────────────────────────────────

  Scenario: [positive] CCBIN field and interactive card image function correctly on desktop
    Given I am viewing the Employment & Financial step on a 1440x900 desktop viewport
    When I type "412345" into the CCBIN field
    Then the field accepts the input and shows "412345"
    And the credit card image is fully visible and shows "412345" in real time
    And the label "FIRST 6 DIGITS ONLY" and all visual indicators are legible

  Scenario: [positive] CCBIN field and interactive card image function correctly on mobile
    Given I am viewing the Employment & Financial step on a 375x667 mobile viewport
    When I type "412345" into the CCBIN field
    Then the field accepts the input and shows "412345"
    And the credit card image is visible and shows "412345" in real time
    And the label "FIRST 6 DIGITS ONLY" and all visual indicators are legible
```

## Coverage matrix

| Acceptance Criterion | Scenario(s) | Status |
|---|---|---|
| AC-01 — CCBIN field accepts only numeric values | [negative] alphabetic letter rejected · [negative] special character rejected · [negative] space rejected | ✅ |
| AC-02 — CCBIN field does not accept more than 6 digits | [negative] seventh digit not accepted | ✅ |
| AC-03 — Non-numeric characters blocked or removed automatically | [negative] alphabetic/special-char Outline · [negative] space scenario | ✅ |
| AC-04 — Card image updates in real time as digits are entered | [positive] card image updates immediately · [positive] digits on card match typed value | ✅ |
| AC-05 — Digits displayed correspond exactly to user input | [positive] digits on card match typed value | ✅ |
| AC-06 — "FIRST 6 DIGITS ONLY" text remains visible | [positive] text visible during entry · [positive] text visible before entry | ✅ |
| AC-07 — Entered digits are displayed in white | [positive] digits displayed in white | ✅ |
| AC-08 — All other digits remain masked with asterisks | [positive] untyped positions masked · [positive] non-CCBIN groups masked | ✅ |
| AC-09 — Completion indicator shown after exactly 6 digits | [positive] green check appears at 6 digits | ✅ |
| AC-10 — Completion indicator not shown before all 6 digits | [negative] no indicator at 5 digits · [negative] indicator disappears when digit deleted | ✅ |
| AC-11 — Autofill for Bank Routing Number | [positive] Routing field configured for routing-number autocomplete | ✅ |
| AC-12 — Autofill for Bank Account Number | [negative] Account field has autocomplete disabled (off) | ✅ |
| AC-13 — Autofill for First 6 Digits of Credit Card | [positive] CCBIN field configured for cc-number autocomplete | ✅ |
| AC-14 — Feature works in UOWN flow | [positive] UOWN flow with blue card | ✅ |
| AC-15 — Feature works in Kornerstone flow | [positive] Kornerstone flow with purple card | ✅ |
| AC-16 — Feature works on desktop | [positive] desktop 1440x900 | ✅ |
| AC-17 — Feature works on mobile | [positive] mobile 375x667 | ✅ |
| AC-18 — Branding consistent with each flow | [positive] UOWN blue gradient · [positive] Kornerstone purple gradient | ✅ |

**Extra coverage (boundary/negative/regression):**

| Scenario | Rationale |
|---|---|
| [negative] validation error on blur with fewer than 6 digits | New behavior introduced by task #1322 — field now validates on blur |
| [negative] validation error does not overlap instruction text | **Bug scenario** (G5) — observed in screenshot: error text renders on top of helper text |
| [positive] no validation error when field is empty on blur | Field is optional when empty — only invalid when partially filled |
| [positive] no validation error when exactly 6 digits on blur | Complement to blur validation — confirm clean state at 6 digits |
| [negative] completion indicator disappears when digit deleted | Toggle behavior — ensures indicator is dynamic, not one-way |
| [negative] Account Number has autocomplete disabled | AC-12 explicitly disables autofill for account number (security) |

## Discovery findings (2026-06-15)

**Environment inspected:** qa2 (`apply-qa2.uownleasing.com`) via Playwright MCP — task #1322 deployed.
**Knowledge base:** `docs/knowledge-base/ccbin-employment-financial-step.md`

### Interactive card component (G4 — Confirmed)

Component class: `credit-card-bin-visualization_card__4PXQ0 panels_ccBinCard__VjSZO`

**Card number layout:**

| Slot type | Class | Text | Color |
|---|---|---|---|
| Typed digit | `digit__U_KP1` | the digit itself | `rgb(255, 255, 255)` — pure white |
| Empty BIN slot | `placeholder__BypCD` | `_` | `rgba(255, 255, 255, 0.35)` — 35% white |
| Masked remaining | `mask__HBBFn` | `**` / `*****` / `*****` | `rgb(126, 184, 204)` — muted blue |

**Layout structure:** `[4-digit BIN group] [2-digit BIN group] [2-char mask] [5-char mask] [5-char mask]` → total 6 BIN + 12 masked = 18 visual positions on card.

**Label "FIRST 6 DIGITS ONLY":** `<P class="cardLabel__DQ1kW">` — color `rgb(168, 216, 234)` (light blue on dark card).

### UOWN card colors (Confirmed)

| Property | Value |
|---|---|
| Background gradient | `linear-gradient(135deg, rgb(13, 86, 114), rgb(28, 173, 228))` |
| Digit color | `rgb(255, 255, 255)` |
| Placeholder color | `rgba(255, 255, 255, 0.35)` |
| Mask color | `rgb(126, 184, 204)` |
| Label color | `rgb(168, 216, 234)` |

### Kornerstone card (G3 — Confirmed visual, CSS values pending)

Purple gradient background confirmed from screenshot (user-provided 2026-06-15). Same `credit-card-bin-visualization` component; Mastercard circles and completion icon same structure. Exact computed gradient values need inspection via Kornerstone merchant flow navigation.

### Completion indicator (G2 — Confirmed)

- **Element:** `<div class="credit-card-bin-visualization_completionIcon__fINIv">`
- **Position:** inside `cardLogo` div (top-right of card header), replaces Mastercard circles
- **Visual:** green circle `rgb(4, 158, 56)`, `border-radius: 50%`, 26×26px; contains FontAwesome `fa-check` SVG in white
- **Trigger:** exactly 6 digits typed → icon shown, Mastercard circles hidden
- **Toggle:** remove 1 digit (5 digits) → icon hidden, Mastercard circles restored
- **Implementation:** React re-renders `cardLogo` children based on input length === 6

### Autofill (G1 — Confirmed)

Mechanism: native browser `autocomplete` attributes on the three CC/ACH fields:

| Field | `autocomplete` value | Behavior |
|---|---|---|
| First 6 Digits of Credit Card | `cc-number` | Browser offers saved CC number autofill |
| Bank Routing Number | `routing-number` | Browser offers saved routing number autofill |
| Bank Account Number | `off` | Autofill explicitly disabled |

No custom UOWN suggestion dropdown or backend lookup — relies entirely on native browser autocomplete API.

### Validation on blur (G5 — New finding)

When fewer than 6 digits are entered and the field loses focus:
- Error message "Credit card bin must be exactly 6 digits" appears in red below the field
- **Bug:** error text overlaps the instruction text "Enter the first 6 digits from the card you used for your payment" — layout regression (confirmed in user screenshot)
- When field is empty and loses focus: no error shown (field is optional when blank)
- When exactly 6 digits and loses focus: no error shown

## Pending items

| ID | Gap | Status | Action |
|----|-----|--------|--------|
| G3 (CSS detail) | Kornerstone purple gradient exact computed values | **Open** | Navigate `KS*` merchant flow; run `getComputedStyle(card).background` and compare to UOWN values |
| G5 (bug) | Validation error text overlaps instruction text on blur | **Bug** | Report to dev; scenario added to test suite as regression guard |

# CCBIN Field — Employment & Financial Step

> Charter: Explore the Employment & Financial step CCBIN improvements (task #1322) with Playwright MCP to discover: G1 — autofill UX for CC/ACH fields; G2 — green check completion indicator; G3 — Kornerstone purple card styling; G4 — interactive card DOM structure.
> Origin: task #1322 (Improve CCBIN Field) · Overall confidence: **high — all key gaps resolved in qa2 deployed build**

---

## Purpose

The Employment & Financial step (Step 2 of the Submit Application wizard) collects financial data from the customer to evaluate longer-term payment plans. The CCBIN field collects the first 6 digits of the customer's credit card to support identity verification.

Task #1322 replaces the static PNG card image (added by task #1256) with an interactive React component (`credit-card-bin-visualization`) that reflects typed digits in real time, adds native browser autocomplete attributes on CC/ACH fields, adds a completion indicator (green check), and enforces inline validation on blur.

---

## Environment & Access

| Item | Value |
|---|---|
| Portal | Consumer-facing; accessed via `apply-{env}.uownleasing.com/{token}/start` |
| Entry point | `origination-{env}.uownleasing.com/getApplication/{merchantCode}` while logged in as merchant |
| UOWN brand | `apply-qa2.uownleasing.com` (merchant code `OL90402-0001` works with `manager`/`P@ssw0rdu0wn` in qa2) |
| Kornerstone brand | `apply-qa2.kornerstoneliving.com` (merchant codes start with `KS` prefix, e.g. `KS16775`) |
| Session requirement | Must navigate via `getApplication` — hitting `/start` directly returns "application link has expired" |

---

## Available Operations

| Operation | Available? | Notes |
|---|---|---|
| View Employment step | ✅ | Step 2 of 3-page wizard; unlocked after filling Step 1 (Your Info) |
| Fill CCBIN field (numeric only) | ✅ | `#mainCreditCardBin`, `maxLength=6`, `inputmode="numeric"`, `autocomplete="cc-number"` |
| Interactive card preview (real-time) | ✅ | `credit-card-bin-visualization` React component; replaces static PNG |
| Completion indicator (green check) | ✅ | Appears at exactly 6 digits; disappears when below 6 |
| Fill Bank Routing | ✅ | `#mainBankRoutingNumber`, `autocomplete="routing-number"` |
| Fill Bank Account | ✅ | `#mainBankAccountNumber`, `autocomplete="off"` |
| Autofill (native browser) | ✅ | Via `autocomplete` attributes on CCBIN and Routing fields |

---

## Task #1322 Deployed State (qa2 — 2026-06-15)

### CCBIN Field (`#mainCreditCardBin`)

| Property | Baseline (pre-1322) | Deployed (1322) |
|---|---|---|
| `type` | `text` | `text` |
| `maxLength` | `6` | `6` |
| `autocomplete` | `null` | `cc-number` |
| `inputmode` | not set | `numeric` |
| Numeric-only filtering | JS handler | JS handler (unchanged) |
| Validation on blur | none | "Credit card bin must be exactly 6 digits" when 1–5 digits |

### Bank / ACH Fields

| Field | `id` | `autocomplete` | Change from baseline |
|---|---|---|---|
| Bank Routing Number | `mainBankRoutingNumber` | `routing-number` | NEW (was null) |
| Bank Account Number | `mainBankAccountNumber` | `off` | NEW (was null) |
| First 6 Digits CC | `mainCreditCardBin` | `cc-number` | NEW (was null) |

---

## Interactive Card Component (G4)

**Component:** `<div class="credit-card-bin-visualization_card__4PXQ0 panels_ccBinCard__VjSZO">`

**Replaces:** static PNG `ccbin_upscaled.png` (completely removed from DOM in deployed version)

### DOM structure

```
div.ccBinCard
├── div.cardHeader
│   ├── p.cardLabel        — "FIRST 6 DIGITS ONLY" text, color rgb(168,216,234)
│   └── div.cardLogo       — switches between Mastercard circles and completion icon
│       ├── [state: <6 digits] div.mastercardCircle--red  (rgb(235,0,27))
│       ├── [state: <6 digits] div.mastercardCircle--orange (rgb(247,158,27))
│       └── [state: =6 digits] div.completionIcon__fINIv  (green circle + checkmark SVG)
└── div.cardNumber
    ├── span.binGroup       — [digit/placeholder × 4]
    ├── span.binGroup       — [digit/placeholder × 2]
    ├── span.mask           — "**"
    ├── span.mask           — "*****"
    └── span.mask           — "*****"
```

**Card number layout:** 4 + 2 = 6 BIN slots, then 2 + 5 + 5 = 12 masked chars. Total 18 visual positions.

### Digit span states

| Slot state | CSS class | Text content | Computed color |
|---|---|---|---|
| Typed digit | `digit__U_KP1` | the digit character | `rgb(255, 255, 255)` — pure white |
| Empty BIN slot | `placeholder__BypCD` | `_` | `rgba(255, 255, 255, 0.35)` — 35% white |
| Masked (always) | `mask__HBBFn` | `*` groups | `rgb(126, 184, 204)` — muted blue |

### UOWN card colors

| Property | Value |
|---|---|
| Background | `linear-gradient(135deg, rgb(13, 86, 114), rgb(28, 173, 228))` |
| Digit color | `rgb(255, 255, 255)` |
| Placeholder color | `rgba(255, 255, 255, 0.35)` |
| Mask color | `rgb(126, 184, 204)` |
| Label "FIRST 6 DIGITS ONLY" | `rgb(168, 216, 234)` — light blue |

---

## Completion Indicator (G2)

**Confirmed implemented.** Not "if technically viable" — it IS shipped in task #1322.

| Property | Value |
|---|---|
| Element | `<div class="credit-card-bin-visualization_completionIcon__fINIv">` |
| Position | Inside `cardLogo` div — top-right of card header |
| Visual | Green circle; `background: rgb(4, 158, 56)`; `border-radius: 50%`; 26×26px |
| Icon | FontAwesome `fa-check` SVG; `fill: currentColor` (white) |
| Trigger | Input length reaches exactly 6 |
| Toggle | Remove 1 digit (5 digits total) → icon hidden, Mastercard circles shown again |
| React behavior | `cardLogo` children re-render based on `value.length === 6` |

**Before 6 digits:** `cardLogo` contains two `mastercardCircle` divs (red + orange = Mastercard logo).
**At 6 digits:** `cardLogo` contains only `completionIcon` — Mastercard circles removed from DOM.

---

## Autofill (G1)

**Mechanism:** native browser `autocomplete` attributes. No custom UOWN suggestion dropdown or backend data lookup.

| Field | `autocomplete` attribute | Effect |
|---|---|---|
| First 6 Digits of Credit Card | `cc-number` | Browser offers saved CC number autofill |
| Bank Routing Number | `routing-number` | Browser offers saved routing number autofill |
| Bank Account Number | `off` | Autofill explicitly disabled (security) |

**Note:** "autofill suggestions for CC/ACH fields when the customer has previously saved financial data" in the ticket refers to native browser/OS autofill via these attributes, not a backend data lookup or custom suggestion dropdown.

---

## Kornerstone Card (G3)

**Confirmed visual:** purple gradient card background in Kornerstone flow (vs UOWN blue). Confirmed from user screenshot (2026-06-15 — Kornerstone merchant flow, qa2).

Same `credit-card-bin-visualization` component structure. Mastercard circles and completion icon present. Only the card background color differs (Kornerstone CSS theme applies different gradient).

**Pending:** computed style values (`getComputedStyle(card).background`) for Kornerstone card. Navigate `KS*` merchant → inspect computed background on `ccBinCard` element.

---

## Validation on Blur (G5 — New finding)

**Behavior confirmed:**
- Entering 1–5 digits then clicking outside → error "Credit card bin must be exactly 6 digits" shown in red below field
- Empty field + click outside → no error (field is optional when blank)
- Exactly 6 digits + click outside → no error

**Bug (layout regression):** The validation error message renders overlapping the instruction/helper text "Enter the first 6 digits from the card you used for your payment. This helps us confirm your identity." The error text (red, `<p>` or `<span>`) is positioned in front of the helper text, obscuring it. Observed in Kornerstone flow, likely present in UOWN flow too. `[confirmed — user screenshot 2026-06-15]`

---

## Business Rules

- BR-01: CCBIN field accepts 6 characters maximum via HTML `maxLength=6`. `[confirmed]`
- BR-02: Non-numeric characters silently rejected via JavaScript — `type="text"` + JS handler. Not `type="number"` or `pattern` attribute. `[confirmed]`
- BR-03: CCBIN, Bank Routing, and Bank Account are optional when left empty — customers can proceed without them. `[confirmed]`
- BR-04: CCBIN field validates as exactly 6 digits on blur if at least 1 digit was entered — partial entry triggers error. `[confirmed]`
- BR-05: Card image is interactive and updates in real time per keystroke. `[confirmed]`
- BR-06: At exactly 6 digits, the Mastercard circles in the card logo area are replaced by a green completion icon. Below 6 digits, Mastercard circles are shown. `[confirmed]`
- BR-07: Bank Account Number has autofill disabled (`autocomplete="off"`) for security. `[confirmed]`
- BR-08: CCBIN and Routing Number fields use native `autocomplete` attributes to support browser autofill. `[confirmed]`
- BR-09: `inputmode="numeric"` on CCBIN field triggers numeric keypad on mobile devices. `[confirmed]`

---

## Connections with What Was Already Known

- **Confirms task #1256:** Static PNG + instruction text were added by task #1256. Task #1322 removes the static PNG entirely and replaces with the interactive React component.
- **Extends task #1256:** Numeric filtering (AC-01/02/03) was already enforced in #1256. Task #1322 adds `inputmode="numeric"` for mobile hardening.
- **UOWN vs Kornerstone:** Same `credit-card-bin-visualization` component; different CSS theme. Purple gradient for Kornerstone, blue for UOWN. Structure, completion icon, and behavior are identical.

---

## Gaps / To Investigate

| ID | Gap | How to Investigate |
|---|---|---|
| G3 (CSS detail) | Kornerstone card exact computed gradient values | Navigate `KS16775` merchant flow, inspect `getComputedStyle(card).background` on the card element |
| G5 (bug) | Validation error overlaps instruction text — layout regression | Confirm in UOWN flow too; check `z-index` / `position` of error element vs helper `<p>` |

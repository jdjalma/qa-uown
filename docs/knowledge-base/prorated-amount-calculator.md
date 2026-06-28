---
title: Prorated Amount Calculator (Calculadora de Valor Proporcional)
domain: knowledge-base
status: snapshot
volatility: stable
last_verified: 2026-06-28
sources:
  - env: sandbox
  - account: "17298 (ACTIVE, NY, activated 2026-06-24, EPO Balance $805.64)"
  - code: src/api/clients/svc-payoff.client.ts
covers: [prorated-amount, epo, payoff-calculator]
promoted_to: []
---

# Prorated Amount Calculator (Calculadora de Valor Proporcional)

> Charter: Explore the Prorated Amount modal in the Servicing portal via Playwright MCP to discover (1) how invalid/partial dates behave, (2) what account state produces real values, and (3) the exact DOM structure for selectors.
> Origin: pending items in `.claude/oracles/prorated-amount.md` · Overall confidence: high

## Purpose

Allows servicing agents to calculate the exact lease payoff amount for any given date. Read-only operation — no mutation on the account or activity log.

## Available Operations

| Operation | Available? | Notes |
|---|---|---|
| View | ✅ | Open via `#calculator` icon in account summary bar |
| Calculate | ✅ | Select date from calendar picker → triggers API |
| Edit | ❌ | Result field is read-only |
| Delete | ❌ | Not applicable |

## Flow and States

**Happy path:**
1. Agent opens account → summary bar shows `#calculator` icon (div#calculator).
2. Agent clicks `#calculator` → modal opens with title "Prorated Amount".
3. Modal pre-fills "AS OF:" with today's date (`MM/DD/YYYY`). Result shows `"-"` (no calculation yet).
4. Agent clicks "AS OF:" input → calendar picker opens on current month.
5. Agent clicks a date in the calendar → API fires, result updates to `$X.XX` or `"-"`.
6. Agent clicks CLOSE → modal closes, account data unchanged.

**API trigger mechanism (confirmed):**
- `onChange` fires **only when a calendar date is clicked** — NOT when text is typed in the input.
- The input has `onKeyPress`, `onChange`, `onBlur`, `onClick` React handlers.
- `onKeyPress` validates/filters characters during typing.
- Typing directly in the text box and pressing Enter/Tab does NOT trigger the API.

## DOM Selectors

| Element | Selector |
|---|---|
| Calculator icon | `div#calculator` (in account summary bar) |
| Modal container | `.modal.show .prorated-amount_proratedContainer__lm_Ez` |
| Date input | `input#proratedDate` (type=search, maxLength=10, placeholder=MM/DD/YYYY) |
| Result field (read-only) | `div.index-module_inputField__readOnly__BsDDX.index-module_boldFont__R-JxG` |
| Error message | `div.index-module_inputField__textError__5fU9J` (text: "Invalid date") |
| CLOSE button | `button.text-uppercase` with text "CLOSE" |

## Business Rules

- **BR-01: API fires on calendar click only.** The `getProrateAmount` endpoint is called exclusively when the user clicks a date in the calendar widget. Typing in the text field does NOT trigger the call. *(evidence: network requests filtered for `getProrateAmount` — no request after text entry, request appears after calendar click)* `[confirmed]`

- **BR-02: Date picker behavior — partial date (e.g., "12/31").**
  - Characters are accepted while typing ("12/31" appears in field).
  - On blur (click outside): field **resets to today's date** (or last valid date).
  - "Invalid date" error message appears in `div.index-module_inputField__textError__5fU9J`.
  - API does **NOT** fire.
  - Previous result is **retained** while error shows.
  - Error clears when a valid date is selected from calendar.
  *(evidence: typed "12/31", observed field reset + error element + no getProrateAmount request)* `[confirmed]`

- **BR-03: Date picker behavior — invalid date characters (e.g., "13/45/2026").**
  - The `onKeyPress` handler filters input. After typing "13/45/2026", the field displayed the previous valid value ("06/28/2026").
  - The "Invalid date" error element appeared when the calendar was subsequently opened.
  - API does **NOT** fire.
  *(evidence: pressSequentially "13/45/2026" → field showed previous date; error visible on calendar re-open)* `[confirmed]`

- **BR-04: Past dates (before account activation).**
  - Calendar allows navigating to past months (no min-date restriction observed).
  - API fires for past dates (HTTP 200).
  - Result shows `"-"` for dates before account activation date.
  - Account 17298 (activated 2026-06-24): 2026-06-01 → API 200, result `"-"`.
  *(evidence: request #53 GET ...?onDate=2026-06-01 → 200, resultText: "-")* `[confirmed]`

- **BR-05: Valid future date → real value.**
  - Account 17298 (ACTIVE, EPO Balance $805.64): 2026-07-27 → API 200, result `$131.18`.
  *(evidence: request #49 GET ...?onDate=2026-07-27 → 200, resultText: "$131.18")* `[confirmed]`

- **BR-06: Account state requirement for real values.**
  - ACTIVE status + post-activation date → produces real values.
  - CLOSED status or pre-activation date → result `"-"`.
  - The previous oracle note "account 17298 retornou '-' para todos os cálculos" was because the account was CLOSED during the prior discovery run (activity log shows CLOSED→ACTIVE on 2026-06-25).
  *(evidence: activity log, status ACTIVE confirmed in current search result)* `[confirmed]`

- **BR-07: API response format.**
  - Endpoint returns **plain decimal text** (not JSON object), e.g.: `"0.00"` or `"131.18"`.
  - No `$` prefix — formatting is done by the component.
  - Component renders `"-"` when the response body is `"0.00"`.
  - Component renders `"$X.XX"` for any other non-zero decimal.
  *(evidence: browser_network_request captures — req #49 onDate=2026-07-27 → body `131.18`; req #53 onDate=2026-06-01 → body `0.00`)* `[confirmed]`

- **BR-08: `#calculator` icon has NO permission gate.**
  - The `div#calculator` is rendered **unconditionally** inside `AccountSummary` — no `{hasXxxPermission && (...)}` wrapper.
  - Compare: `makePayment` is gated by `hasPaymentPermission`; `invitation` is gated by `hasViewSendInvitePermission`. Calculator has no equivalent gate.
  - All agents who can access the Customer Information page (`customer_information` page-level permission) see the calculator icon.
  *(evidence: `/home/jose/projects/uown/servicing/components/account-summary/index.tsx` lines 321-331 — unconditional render; lines 332-358 — conditional render for other icons)* `[confirmed via source code]`

## Logic and Exceptions

- The modal is **read-only** — no mutations on account or activity log (`uown_sv_activity_log`).
- Result `"-"` can mean: (a) no date selected yet, (b) invalid/partial date typed, (c) date before activation, (d) account in non-ACTIVE state, or (e) API returned `"0.00"`.
- Calendar navigation: no observed restriction on navigating to past months.
- API endpoint format: `GET /uown/svc/getProrateAmount/{accountPk}?onDate={YYYY-MM-DD}` (ISO-8601 date).
- API response: plain decimal text, no JSON envelope.

## Connections with What Was Already Known

- **Confirms:** Modal container selector `.prorated-amount_proratedContainer__lm_Ez` (from oracle).
- **Confirms:** `input#proratedDate` pre-fills with today's date on modal open.
- **Confirms:** `GET /uown/svc/getProrateAmount/{accountPk}?onDate={date-ISO}` fires on date selection.
- **Resolves gap:** "Account 17298 returned '-' for all calculations" was a CLOSED-state artifact.
- **New finding (BR-07):** API returns plain decimal `"0.00"` for pre-activation dates; component maps `"0.00"` → `"-"`.
- **New finding (BR-08):** `#calculator` rendered unconditionally — no permission check beyond page access.
- **New finding:** API fires ONLY on calendar click, not on text input. Direct text typing does not call the API.
- **New finding:** "Invalid date" inline error shown in `div.index-module_inputField__textError__5fU9J` for partial/invalid dates.
- **New finding:** Error clears when a valid calendar date is selected.
- **New finding:** Past dates are selectable in calendar (no min-date block) but return "-" for pre-activation dates.

## Gaps / To Investigate

- **"02/29" in non-leap year:** Not tested. Would the field accept it (only to error on blur) or would `onKeyPress` block "29" for February?
- **Min/max date constraints in calendar:** Not observed — can navigate back to any month. Whether there's a cap on how far in the future is not tested.

---
title: Scheduled Payments (Due Amounts)
domain: knowledge-base
status: snapshot
volatility: stable
last_verified: 2026-06-25
sources:
  - env: sandbox
  - account: "17298 (Sanjay James, Tire Agent, 13-month ACTIVE lease)"
  - account: "100 (sandbox PAID_OUT account — Fully Paid rows)"
  - code: servicing/components/account-summary/index.tsx
  - code: servicing/components/add-comment-modal/index.tsx
  - code: servicing/components/modals/prorated-amount/index.tsx
  - code: servicing/domain/stores/customer.tsx
  - code: servicing/layouts/auth/index.tsx
covers: [scheduled-payments, due-amounts, move-due-date, add-fee, payment-reallocation, edit-scheduled-payment, waive-payment, new-status-transition, change-account-status, reallocate-receivable, prorated-amount, make-payment, send-invite, sidebar-shortcuts]
promoted_to: []
---

# Scheduled Payments (Due Amounts)

> Charter: Explore `scheduled-payments/17298` with Playwright MCP to discover all functionalities, business rules, states, and flows of the Scheduled Payments page.
> Origin: Direct investigation request · Overall confidence: high (gap #1 role-based visibility remains open; all others resolved)

## Purpose

The Scheduled Payments page (URL path: `/scheduled-payments/{accountPk}`) is the Servicing portal's primary screen for managing a lease's payment schedule. It is titled **"Due Amounts"** in the UI (`h1.page-header`), despite the URL segment `scheduled-payments`. Agent-facing (internal) portal — not visible to the customer.

**Actors:** Servicing agents, supervisors, admins.

---

## Portal / URL

| Property | Value |
|---|---|
| Portal | Servicing (`svc-website-{env}.uownleasing.com`) |
| Route | `/scheduled-payments/{accountPk}` (Next.js dynamic segment `[account]`) |
| Auth | Required — redirects to `/` login page if unauthenticated |
| Login form | `input#loginEmail` + `input#loginPassword`, "Remember me" checkbox, "LOG IN" button |

---

## Page Structure

**Top navbar:**
- Logo (Uown)
- "Servicing" dropdown → Payment Transaction, **Due Amounts**, Payment Arrangement, ACH, CC Transactions, Email, Items Purchased, Payments, PayNearMe, Phone
- "History" dropdown → Due Date Changes, Frequency Changes
- Account search input (`Servicing Account #`)

**Left sidebar** (`div.index-module_applicationSideBar__Tr5MT`):
- Collapse/expand toggle at top: `div.index-module_applicationSideBar__toggle__1OYOa` (chevron-left SVG, `cursor-pointer`)
- 4 shortcut items: `div.index-module_menuItem__UjcJP`, each with an SVG icon + label
- Each item is permission-gated (see §Left Sidebar below)

**Page body (top to bottom):**
1. Account Summary Bar (labeled info cards + 3 action icons)
2. Action buttons: "Move Due Date" | "+ ADD FEE"
3. "Due Amounts" data table (`react-data-table-component`)
4. Color legend below the table

---

## Account Summary Bar

Fields displayed as horizontal labeled cards:

| Field | Notes |
|---|---|
| Account # | Numeric account PK |
| Ref Account | `L{leadPk}` — links to `origination-{env}.uownleasing.com/customers/{leadPk}` |
| Borrower | Customer full name |
| Status | Current account status (read-only display label) |
| New Status | `<select name="New Status">` — writeable dropdown for status transition |
| Next Payment | Dollar amount of next scheduled payment |
| Next Due Date | `MM/DD/YYYY` date |
| Merchant | Merchant name |
| Location | Location name |
| Items Purchased | Count, e.g. "1 Items" |
| Program Type | Lease term, e.g. "13 months" |

**"New Status" dropdown options (confirmed):**
`ACTIVE`, `PAID_OUT`, `PAID_OUT_EARLY`, `PAID_OUT_EARLY_EPO`, `CHARGED_OFF`, `CLOSED`, `CANCELLED`, `SOLD`, `SETTLED_IN_FULL`

**"New Status" transition flows (code-confirmed):** Three distinct paths based on the FROM/TO combination:

**Path A — Any status → CANCELLED:**
- Opens "Add a comment:" modal WITH an extra "Refund Payments" checkbox (`id="refundPayments"`, unchecked by default)
- If checkbox is checked → `refundAllPayments: true` in payload
- If checkbox is unchecked (default) → `refundAllPayments: false`
- Comment still required; same `"Comment is required."` validation

**Path B — CANCELLED → ACTIVE:**
- Opens a **warning modal** first, titled **"Please note that:"**
  - Text: "Refunded payments will **NOT** be cancelled. Pending ACH refunds will be marked cancelled and Payments will be re-posted."
  - Buttons: CANCEL (reverts dropdown) · CONTINUE (proceeds to comment modal)
- After CONTINUE: opens standard "Add a comment:" modal WITHOUT "Refund Payments" checkbox
- `refundAllPayments: false` always for this path

**Path C — All other transitions:**
- Opens "Add a comment:" modal directly (NO "Refund Payments" checkbox)
- `refundAllPayments: false` always
- Modal:
  - Form id: `addCommentForm`
  - Single field: `<input name="comment" id="comment" placeholder="Enter Comment" type="text">`
  - Buttons: CANCEL · SAVE
  - Validation: clicking SAVE with empty comment → `"Comment is required."` inside the modal
  - Clicking CANCEL: dismisses modal and **reverts the dropdown** to its previous value

**API (confirmed):** `POST /uown/svc/changeAccountStatus`

**Request payload:**
```json
{
  "accountPk": 17298,
  "newStatus": "CLOSED",
  "comment": "...",
  "refundAllPayments": false
}
```

For CANCELLED with "Refund Payments" checked:
```json
{
  "accountPk": 17298,
  "newStatus": "CANCELLED",
  "comment": "...",
  "refundAllPayments": true
}
```

**Response:** HTTP 200 `{"success": true, "message": "Account status updated successfully."}`
**Toast:** `"The account status has been successfully changed."`
**UI after save:** `Status` display label and `New Status` select both update to the new value. Scheduled payments table refreshes (no row changes).

---

## Account Summary Bar — Action Icons

Three clickable SVG icons appear to the right of the summary cards (after "Program Type"). All are `<div id="{id}">` containers with `cursor-pointer` SVGs and Bootstrap `UncontrolledTooltip` labels. Each is permission-gated.

| DOM id | FA icon | Tooltip | Opens | Permission |
|---|---|---|---|---|
| `#calculator` | `fa-calculator` (light) | "Prorated Amount" | Prorated Amount modal | `customer_information` [inferred] |
| `#makePayment` | `fa-circle-dollar` (light) | "Make Payment" | Make Payment modal (or PaidOutEarly confirm for inactive accounts) | `make_payment` [inferred] |
| `#invitation` | `fa-envelope` (light) | "Send Invite" | Send Invite modal | `view_send_invite` (confirmed via source) |

---

### 5. Prorated Amount Modal (`#calculator`)

**Modal title:** "Prorated Amount"
**CSS class:** `prorated-amount_proratedContainer__lm_Ez`

**Fields:**

| Field | Type | Notes |
|---|---|---|
| AS OF: | Date input (`id="proratedDate"`, `type="search"`, `maxlength="10"`) | Pre-filled with today's date in `MM/DD/YYYY` format |
| Prorated Amount | Read-only `<div>` (class: `inputField__readOnly boldFont`) | Shows `-` until calculated; displays as currency after API response |

**API (confirmed via network + code):** `GET /uown/svc/getProrateAmount/{accountPk}?onDate={YYYY-MM-DD}`
- Date parameter format: `YYYY-MM-DD` (ISO format, converted from `MM/DD/YYYY` input via `formatDate({f: 'api', d: value})`)
- Trigger: Formik `onChange` on the date field fires when a complete, valid date is entered and the field loses focus
- No CALCULATE button — calculation is triggered automatically on blur

**Button:** CLOSE (`type="submit" form="paymentModal"`) — closes the modal.

**Use case:** Shows how much the customer would owe if they paid off the lease as of a given date (prorated payoff amount).

---

### 6. Make Payment Modal (`#makePayment`)

**Guard behavior (code-confirmed):** The icon's `onClick` checks `isInactive` (account status in PAID_OUT* group):
- **ACTIVE account** → opens Make Payment modal (title: `"Make Payment for Account #{accountPk}"`)
- **Inactive account** → opens "ConfirmForPaidOutEarly" modal instead (content not yet investigated)

**Make Payment modal fields (confirmed via DOM inspection, account 17298):**

| Field | Type | Default value |
|---|---|---|
| Borrower | Read-only display | Customer full name |
| Payment Arrangement | Checkbox (`id="paymentArrangement"`) | unchecked |
| Start Date | Date input (`id="startDate"`) | Today |
| End Date | Date input (`id="endDate"`) | Today |
| Payment Frequency | React-Select | "Weekly" |
| Payment Arrangement Type | React-Select | "NORMAL" |
| Payment Type | React-Select | "ACH Payment" |
| Allocation Type | React-Select | "Payment" |
| Payment Date (`paymentDate`) | Date input | Today |
| Total Payment Amount (`totalPaymentAmount`) | Text input | Next payment amount (e.g. `$131.18`) |
| paymentInfo[0].paymentDate | Date input | Today |
| paymentInfo[0].paymentAmount | Text input | Next payment amount |
| Bank info radio | Radio | "Use existing bank information" (default) |
| Bank account select (`id="pk"`) | `<select>` | Existing bank on file (e.g. `123456780 - 8190`) |
| One-time bank info | Radio option | "Use one-time bank information" |

> Payment Arrangement section (Start/End Date, Frequency, Type) is conditionally visible — shown when `paymentArrangement` checkbox is checked.

**Buttons:** CANCEL · Submit

**Form id:** `paymentModal` (same id shared by Payment Reallocation and Prorated Amount modals — see BR-16 note)

---

### 7. Send Invite Modal (`#invitation`)

**Modal title:** "Send Invite"
**Permission:** `hasViewSendInvitePermission` (mapped to `view_send_invite` permission key)

**Buttons (each permission-controlled):**

| Button label | Permission | Opens | API endpoint | Success toast |
|---|---|---|---|---|
| TrustPilot Invite | `hasSendTrustpilotInvitationPermission` | Confirmation modal | `POST /uown/svc/sendTrustpilotInvitation/{accountPk}` | "The invitation has been successfully sent." |
| Customer Portal Link | `hasSendCustomerPortalLinkPermission` | Confirmation modal | `POST /uown/svc/sendCustomerPortalLink/{accountPk}` | From response `.message` |
| Podium Link | `hasSendPodiumLinkPermission` | Confirmation modal | `POST /uown/svc/accounts/{accountPk}/podium-link` | From response `.message` or "The invitation has been successfully sent." |
| PayNearMe Link | [unknown] | [not found in source] | [not yet determined] | [unknown] |

**Flow:**
1. User clicks one of the 4 buttons in Send Invite modal
2. Modal closes, **Confirmation modal** opens (generic confirm/cancel)
3. On confirm → API call fired → success/error toast → confirmation modal closes

---

## Left Sidebar

The left sidebar (`div.index-module_applicationSideBar__Tr5MT`) is a **persistent navigation panel** visible on all account pages. It contains 4 shortcut items + a collapse/expand toggle.

**Toggle:** `div.index-module_applicationSideBar__toggle__1OYOa` (chevron-left SVG). Collapses/expands the sidebar.

**Shortcuts (code-confirmed routes):**

| DOM id | Label | Icon (FA) | Navigates to | Permission |
|---|---|---|---|---|
| `#customer-information` | Servicing | `fa-user-cog` | `/customer-information/{accountPk}` | `customer_information` |
| `#payment-transaction` | Transaction | `fa-usd-circle` | `/payment-transaction/{accountPk}` | `payment_transaction` |
| `#documents` | Documents | `fa-folder-open` | `/documents/{accountPk}` | `documents` |
| `#print` | Print | `fa-print` | `window.print()` — prints the page | `customer_information` |

> A 5th item `#viewing` (fa-eye, "Viewing") appears **only** on `/customer-information/` pages when other users are currently viewing the same account. Not visible on `/scheduled-payments/`.

**Sidebar behavior:**
- Items without permission are hidden (not disabled)
- `onClick` shows a loading spinner during navigation (`setIsLoading(true)` → `router.push(path)`)
- Clicking the active section does not navigate (guarded by `!p` flag in compiled code)

---

## Data Table — "Due Amounts"

**Component:** `react-data-table-component` (`rdt_Table`)

**Columns (11 total):**

| # | Column Header | Sortable? | Notes |
|---|---|---|---|
| 1 | Scheduled Due Date | Yes | Date in `MM/DD/YYYY` |
| 2 | Scheduled Total | Yes | Principal + tax |
| 3 | Payment Amount | Yes | Amount already collected |
| 4 | Remaining Due Amount | Yes | Total − Payment Amount |
| 5 | Type | No | Payment type enum (no sort) |
| 6 | Status | No | "Paid" / "Partially Paid" / blank (no sort) |
| 7 | Scheduled Amount | Yes | Principal only |
| 8 | Scheduled Tax | Yes | Tax component |
| 9 | Comment | Yes | Free-text note |
| 10 | (action) | — | Pencil icon OR empty |
| 11 | (action) | — | ⇄ icon OR empty |

**Column sorting behavior (confirmed):**
- 1st click on sortable column → rows sort **descending** (latest/highest first)
- 2nd click → rows sort **ascending** (oldest/lowest first)
- The `▲` symbol in the header text **never visually flips to `▼`** — sort direction change is reflected only via a CSS class change on the `<span>` (Styled Components). Not WCAG-compliant (`aria-sort` always `null`).

**Pagination:** Rows per page: 10 (default) / 15 / 20 / 25 / 30. Navigation: first / prev / next / last. Shows `{start}-{end} of {total}`.

**Payment types observed (confirmed):**
- `REGULAR_PAYMENT` — standard bi-weekly payment
- `PROCESSING_FEE` — one-time processing fee
- `MANUAL_FEE` — manually added fee (via Add Fee or via payment split)
- `EARLY_PAY_OFF` — EPO row (early payoff amount)

**Status column values (confirmed):**
- `"Paid"` — fully paid row; status text color green `rgb(7, 165, 7)` (CSS class `status__paid__`)
- `"Partially Paid"` — partial payment collected; status text color orange `rgb(239, 139, 0)` (CSS class `status__partially_paid__`)
- *(blank)* — unpaid/scheduled

**Row color coding — IMPORTANT CORRECTION (confirmed):**
The legend below the table reads "Legend: Fully Paid Amount | Partially Paid Amount" — this refers to **STATUS COLUMN TEXT COLOR**, not row background color. Row backgrounds use only zebra striping:
- Odd rows: `rgb(250, 250, 250)`
- Even rows: `rgb(255, 255, 255)`
- No distinct background color for Paid or Partially Paid rows.

---

## Row-Level Actions (Columns 10 & 11)

Each row has **at most one** action icon — columns 10 and 11 are mutually exclusive:

| Icon | FA class | Appears when | Opens |
|---|---|---|---|
| Pencil | `fa-pencil` | Row has no payment recorded (unpaid/scheduled) | "Edit Scheduled Payments" modal |
| ⇄ | `fa-arrow-right-arrow-left` | Row has any payment recorded (Partially Paid **or** Paid) | "Payment Reallocation" modal |

> **Key rule:** `"Paid"` rows show ⇄ (not pencil) — fully paid rows are not editable. Confirmed on account 100.

> **Implementation note:** Icons are `<div>` containers with `cursor-pointer` and React click handlers — NOT `<button>` or `<a>` elements.

---

## Available Operations

### 1. Move Due Date (page-level button)

**Button label:** "Move Due Date"
**Modal title:** "Move Due Dates"

**Fields:**

| Field | Input type | Name attribute | Notes |
|---|---|---|---|
| Scheduled Due Date | React-Select (`#moveFromDueDate`) | — | Lists all scheduled dates from the payment schedule |
| New Due Date | Date input | `name="numOfDaysToBeMoved"` | Placeholder: `MM/DD/YYYY` |

**Buttons:** CANCEL · SAVE

**Validations (confirmed):**
- **Empty "New Due Date"** → inline error inside modal: `"New date is required."`
- **Past date (e.g. 01/01/2020)** → red Toastify toast: `"Due date offset cannot exceed 6 days for BI_WEEKLY frequency"` (modal stays open; validation is backend-driven, not client-side)

**API:** `POST /uown/svc/moveDueDatesByDays/{accountPk}`
**Success toast:** `"Successfully moved the due dates"` [confirmed via existing page object]

---

### 2. Add Fee (page-level button)

**Button label:** "+ ADD FEE"
**Modal title:** "Add Fee"

**Fields:**

| Field | Input type | Name attribute | Default |
|---|---|---|---|
| Fee Type | React-Select (`#feeType`) | — | "Manual Fee" |
| Transaction Effective Date | Date input | `name="transactionEffectiveDate"` | Today's date (auto-filled) |
| Fee Amount | Text input | `name="feeAmount"` | "$0.00" |
| Comment | Textarea | `name="comment"` | (empty) |

**Fee Type options (confirmed):**
1. Protection Plan Fee
2. NSF Fee
3. Reinstatement Fee
4. Manual Fee *(default)*
5. Misc Fee

**Validations (confirmed):**
- Comment is required → `"Comment is required."` (modal stays open)

**Buttons:** CANCEL · SAVE

**API (confirmed):** `POST /uown/svc/createOrUpdateReceivable`

**Request payload structure:**
```json
{
  "accountPk": 17298,
  "receivableType": "MANUAL_FEE",
  "dueDate": "2026-06-25",
  "totalAmount": 1,
  "baseAmount": 1,
  "comment": "discovery test gap-06"
}
```

**Response:** HTTP 200
**Success toast:** `"Fee added successfully."` (Toastify success)
**Modal behavior:** closes immediately after successful save.

**New fee row position:** Appears at the top of the table when sorted by due date descending. Initial Status column: blank (no payment yet). Action icon: pencil (editable).

---

### 3. Edit Scheduled Payment (pencil icon per row)

**Modal title:** "Edit Scheduled Payments"
**Appears on:** Rows with no payment recorded (blank Status column)

**Fields (pre-filled from row's current values):**

| Field | Input type | Name attribute | Editable? |
|---|---|---|---|
| Scheduled Due Date | Date input | `name="scheduledDueDate"` | Yes |
| Scheduled Amount | Text input | `name="scheduledAmount"` | Yes |
| Scheduled Tax | Text input | `name="scheduledTax"` | Yes |
| Scheduled Total | Text input | `name="scheduledTotal"` | **No (disabled)** |
| Skip Payment | Checkbox | `name="skippedPayment"` | Yes |
| Comment | Textarea | `name="comment"` | Yes |

> `Scheduled Total` is disabled/computed — cannot be edited directly.

**Buttons:** WAIVE · CANCEL · SAVE

**SAVE behavior:** saves edits without changing receivable status. Comment required.

**WAIVE behavior (confirmed):**
- Requires comment — same `"Comment is required."` validation fires if empty
- No confirmation dialog — submits immediately on click
- API: `POST /uown/svc/createOrUpdateReceivable` with `"status":"INACTIVE"` in payload
- Amounts (`baseAmount`, `taxAmount`, `totalAmount`) are NOT zeroed — only `status` changes to `INACTIVE`
- Success toast: `"Successfully waived payment."`
- Page auto-reloads schedule data (`GET /uown/svc/getScheduledPayments/{accountPk}`)

**Skip Payment checkbox:**
- Pre-checked when the row's comment already contains "skip"
- When checked: marks the payment as intentionally skipped (distinct from WAIVE which sets status=INACTIVE)

**PROCESSING_FEE vs REGULAR_PAYMENT modal (confirmed):**
- Modal structure and fields are **identical**
- WAIVE button present on both
- PROCESSING_FEE: `scheduledTax = $0.00`, comment pre-filled as empty
- REGULAR_PAYMENT: `scheduledTax = $3.60` (for 13-month lease)

---

### 4. Payment Reallocation (⇄ icon per row)

**Modal title:** "Payment Reallocation"
**Appears on:** Rows with `Partially Paid` **or** `Paid` status

**Fields:**

| Field | Type | Notes |
|---|---|---|
| Reallocate from | Display text (read-only) | Format: `{MM/DD/YYYY} - {Fee Type label}` (e.g. "06/25/2026 - Manual fee") |
| Reallocate to | React-Select dropdown | All OTHER scheduled payments, excluding current row |
| Amount | Text input (`name="amount"`) | Pre-filled with the paid/partially-paid amount |

**"Reallocate to" options format:** `{date} - {human-readable type}` — enum values are mapped to labels via `/uown/svc/getReceivableType/`:
- `REGULAR_PAYMENT` → "Regular payment"
- `PROCESSING_FEE` → "Processing fee"
- `EARLY_PAY_OFF` → "Early pay off"
- `MANUAL_FEE` → "Manual fee"

**"Reallocate to" options scope (confirmed):** ALL scheduled receivables of the account except the source row. Includes past and future dates. Count = total receivables − 1.

**Buttons:** CANCEL (`type="button"`) · SAVE (`type="submit" form="paymentModal"`)

> **Form ID mismatch (confirmed):** The SAVE button hardcodes `form="paymentModal"` in the shared modal footer component, but the modal form element has `id="moveDueDatesForm"`. The submit still works because the button is `type="submit"` inside the same modal DOM tree.

**API (confirmed):** `POST /uown/svc/reallocateFromReceivable`

**Request payload:**
```json
{
  "fromReceivablePk": 2496513,
  "toReceivablePk": 2496186,
  "amount": 5
}
```

**Response:** HTTP 200, **empty body** (no JSON returned). Assertions must rely on the toast and table refresh.
**Toast:** `"Payment is successfully reallocated."`
**Modal:** closes automatically on success.

**UI changes after SAVE (confirmed):**
- **Source row** (Partially Paid): Payment Amount → `$0.00`; Remaining Due → full scheduled total; Status → blank; icon → pencil
- **Destination row**: Payment Amount increases by the reallocated amount; Remaining Due decreases accordingly; remains `Partially Paid` if not fully paid

---

## API Endpoints

| Method | Endpoint | Purpose | Confirmed |
|---|---|---|---|
| GET | `/uown/svc/getAccountSummary/{accountPk}` | Account header fields | Yes (page load) |
| GET | `/uown/svc/getAccountInfo/{accountPk}` | Borrower, merchant, location | Yes (page load) |
| GET | `/uown/svc/getScheduledPayments/{accountPk}` | Payment schedule table data | Yes (page load + after mutations) |
| GET | `/uown/svc/getReceivableType/` | Payment type enum ↔ label mapping | Yes (page load) |
| GET | `/uown/users-on-page` | Concurrent user tracking | Yes (page load) |
| GET | `/uown/svc/getProrateAmount/{accountPk}?onDate={YYYY-MM-DD}` | Prorated payoff amount for a given date | Yes (network + code) |
| POST | `/uown/svc/moveDueDatesByDays/{accountPk}` | Move Due Date | Yes (page object) |
| POST | `/uown/svc/createOrUpdateReceivable` | Add Fee, Edit, WAIVE | Yes (confirmed via network) |
| POST | `/uown/svc/reallocateFromReceivable` | Payment Reallocation SAVE | Yes (confirmed) |
| POST | `/uown/svc/changeAccountStatus` | New Status change | Yes (confirmed) |
| POST | `/uown/svc/sendTrustpilotInvitation/{accountPk}` | Send TrustPilot review invite | Yes (code) |
| POST | `/uown/svc/sendCustomerPortalLink/{accountPk}` | Send customer portal login link | Yes (code) |
| POST | `/uown/svc/accounts/{accountPk}/podium-link` | Send Podium review link | Yes (code) |

---

## Business Rules

- **BR-01** [confirmed]: The UI title is "Due Amounts" (`h1.page-header`); the URL path is `/scheduled-payments/{accountPk}` — the two names refer to the same page.
- **BR-02** [confirmed]: `Remaining Due Amount = Scheduled Total − Payment Amount`.
- **BR-03** [confirmed]: `Scheduled Total = Scheduled Amount + Scheduled Tax`. The field is disabled/computed in the Edit modal.
- **BR-04** [confirmed]: Status column text: `"Paid"` (green, `rgb(7,165,7)`) / `"Partially Paid"` (orange, `rgb(239,139,0)`) / blank. Row backgrounds do NOT change — color distinction is text-only.
- **BR-05** [confirmed]: Row action icons are mutually exclusive: pencil = no payment; ⇄ = payment recorded (partial or full). Paid rows are NOT editable.
- **BR-06** [confirmed]: The "Reallocate to" dropdown excludes the current row — only other scheduled payments are valid targets.
- **BR-07** [confirmed]: Comment is required in Add Fee, Edit Scheduled Payment, WAIVE, and New Status change. Error: `"Comment is required."`.
- **BR-08** [confirmed]: The "Fee Type" default in Add Fee is "Manual Fee" (`MANUAL_FEE`).
- **BR-09** [confirmed]: The "New Status" dropdown change opens a `"Add a comment:"` modal — not auto-save. Cancel reverts the dropdown.
- **BR-10** [confirmed]: WAIVE sets the receivable `status = INACTIVE` via `POST /uown/svc/createOrUpdateReceivable`. It does NOT zero out amounts. Success toast: `"Successfully waived payment."`.
- **BR-11** [confirmed]: WAIVE and SAVE use the same API endpoint (`createOrUpdateReceivable`); WAIVE adds `"status":"INACTIVE"` to the payload.
- **BR-12** [confirmed]: Move Due Date validation: empty date → inline `"New date is required."`; past/out-of-range date → Toastify toast `"Due date offset cannot exceed 6 days for BI_WEEKLY frequency"`.
- **BR-13** [confirmed]: Column sorting: 1st click = descending, 2nd = ascending. `▲` symbol never flips visually. `aria-sort` always null (not WCAG-compliant). Type and Status columns are not sortable.
- **BR-14** [inferred]: No column-level filters on the table — no date/type/status filter controls present.
- **BR-15** [confirmed]: Payment Reallocation moves the partial payment credit from the source receivable to the destination. Source row loses its partial payment (reverts to full Remaining Due, blank status, pencil icon). Destination row absorbs the amount (Remaining Due decreases, remains Partially Paid).
- **BR-16** [confirmed]: `POST /uown/svc/reallocateFromReceivable` returns HTTP 200 with **empty body**. No JSON in response — success must be verified by toast or table refresh.
- **BR-17** [confirmed — UPDATED]: `refundAllPayments` in `changeAccountStatus` payload is:
  - `true` — only when transitioning TO `CANCELLED` AND the "Refund Payments" checkbox is checked in the comment modal
  - `false` — default for all transitions (including CANCELLED when checkbox is unchecked)
  - The "Refund Payments" checkbox (`id="refundPayments"`) is ONLY rendered in the "Add a comment:" modal when `newStatus === CANCELLED`. Not visible for any other target status.
- **BR-18** [confirmed]: Account status change toast: `"The account status has been successfully changed."` Same toast for all status transitions.
- **BR-19** [confirmed via code]: CANCELLED → ACTIVE transition shows an intermediate **warning modal** ("Please note that:") before the comment modal. Text: "Refunded payments will **NOT** be cancelled. Pending ACH refunds will be marked cancelled and Payments will be re-posted." User must click CONTINUE to proceed, or CANCEL to revert the dropdown.
- **BR-20** [confirmed via code]: The `#makePayment` icon behavior depends on account status: ACTIVE account → Make Payment modal; inactive account (PAID_OUT, PAID_OUT_EARLY, etc.) → "ConfirmForPaidOutEarly" modal.
- **BR-21** [confirmed via code]: The `#invitation` icon is hidden unless the user has `view_send_invite` permission. Each button inside (TrustPilot, Portal, Podium) is independently permission-gated.
- **BR-22** [confirmed via code]: Send Invite buttons do NOT send immediately — they first open a **Confirmation modal**. The actual API call fires only after the user confirms.
- **BR-23** [confirmed via network + code]: Prorated Amount is calculated via `GET /uown/svc/getProrateAmount/{accountPk}?onDate={YYYY-MM-DD}`. The calculation fires on the date field's `onChange` (on blur when date is complete). The modal has no explicit "Calculate" button.
- **BR-24** [confirmed via code]: Left sidebar shortcuts are all permission-gated. Absent permission = item hidden (not disabled). The Print shortcut calls `window.print()` (not a navigation).
- **BR-25** [confirmed via code]: The `#viewing` sidebar item only appears on `/customer-information/` pages when other users are concurrently viewing the same account. It is never shown on `/scheduled-payments/`.

---

## DOM Selectors Catalog

| Element | Selector |
|---|---|
| Table rows | `.rdt_TableRow` |
| Row by index | `#row-{N}` |
| Pencil icon (editable row) | `#row-{N} svg[data-icon="pencil"]` — click with `force: true` |
| Reallocation icon (⇄) | `#row-{N} svg[data-icon="arrow-right-arrow-left"]` — click with `force: true` |
| Row status cell (Partially Paid) | `.rdt_TableRow [class*="status__partially_paid"]` |
| Row status cell (Paid) | `.rdt_TableRow [class*="status__paid"]` |
| Reallocation modal | `.modal.show` |
| "Reallocate from" (read-only) | `.modal.show [class*="inputField__readOnly"]` |
| "Reallocate to" React-Select control | `.modal.show #moveToDueDate .filter__control` |
| React-Select option by index | `#react-select-2-option-{N}` (click via `page.evaluate()`) |
| React-Select selected value | `.modal.show .filter__single-value` |
| Amount input (Reallocation) | `#amount` |
| SAVE button (Reallocation modal) | `button[type="submit"][form="paymentModal"]` |
| New Status select | `select[name="New Status"]` |
| Comment input (status modal) | `.modal.show input[name="comment"]` |
| SAVE button (status/comment modal) | `.modal.show button[type="submit"]` |
| Toast | `.Toastify__toast` |
| Toast (success) | `.Toastify__toast--success` |
| Toast (error) | `.Toastify__toast--error` |
| Calculator icon (Prorated Amount) | `#calculator svg[data-icon="calculator"]` — click via `page.evaluate()` or `#calculator` |
| Make Payment icon | `#makePayment svg[data-icon="circle-dollar"]` — click via `#makePayment` |
| Send Invite icon | `#invitation svg[data-icon="envelope"]` — click via `#invitation` |
| Prorated Amount modal | `.modal.show .prorated-amount_proratedContainer__lm_Ez` |
| Prorated Amount "AS OF:" field | `input#proratedDate` |
| Prorated Amount result field | `.modal.show .index-module_inputField__readOnly__BsDDX.index-module_boldFont__R-JxG` |
| "Refund Payments" checkbox (CANCELLED only) | `input#refundPayments` (inside `.modal.show`) |
| Left sidebar toggle | `.index-module_applicationSideBar__toggle__1OYOa` |
| Sidebar Servicing link | `#customer-information` |
| Sidebar Transaction link | `#payment-transaction` |
| Sidebar Documents link | `#documents` |
| Sidebar Print link | `#print` |

> **React-Select interaction note:** `.filter__control` options must be clicked via `page.evaluate(() => el.click())` — direct Playwright `.click()` fails because the menu portal intercepts pointer events. The same applies to the reallocation and pencil icons (bare `<svg>`, no `<button>` wrapper).
>
> **Action icons note:** `#calculator`, `#makePayment`, `#invitation` are `<div>` containers with SVG children. Click via the container `id` selector — no need for `force: true` as the div itself is the hit target.

---

## Existing Page Object Coverage

File: `src/pages/servicing/scheduled-payment.page.ts`

**Already covered:**
- `navigateToScheduledPayments()` — navigates via "Servicing > Due Amounts" menu
- `getFirstScheduledDueDate()` — reads first row date
- `moveDueDate()` / `moveDueDateFirstOption()` — Move Due Date modal
- `verifyMoveDueDateSuccess()` — success toast assertion

**Not covered (gaps in PO):**
- "+ ADD FEE" modal (5 fee types, validation, submission)
- "Edit Scheduled Payments" modal — edit amount, skip, waive
- "Payment Reallocation" modal (⇄ icon)
- "New Status" dropdown + "Add a comment:" modal (including CANCELLED path with "Refund Payments" checkbox)
- Pagination
- Reading table columns (type, status, remaining due amount, comment)
- Row-level action icon detection (pencil vs ⇄)
- `#calculator` → Prorated Amount modal
- `#makePayment` → Make Payment modal
- `#invitation` → Send Invite modal
- Left sidebar shortcuts navigation

---

## Gaps / Remaining Unknowns

1. **Role-based visibility:** `readonly` and `AutotestAgent` credentials do not work in sandbox. Testing which buttons/icons appear per role requires valid sandbox credentials for non-admin roles. `DEFAULT_READONLY_USERNAME` / `DEFAULT_AGENT_USERNAME` from `.env` authenticate only in QA1/QA2/STG — retest there. Specifically: which sidebar items and which summary bar icons are hidden per role.
2. **`refundAllPayments: true`** — RESOLVED. Only sent when transitioning TO `CANCELLED` with the "Refund Payments" checkbox checked (BR-17 updated).
3. **PayNearMe Link button:** visible in Send Invite modal UI but handler/source not found in `servicing/components/account-summary/index.tsx` or `customer.tsx`. Likely comes from the compiled `InviteModal` in `@uownleasing/common-ui` package (source not available). API endpoint and success toast unknown.
4. **"ConfirmForPaidOutEarly" modal:** triggered when `#makePayment` is clicked on a non-ACTIVE account. Content, buttons, and behavior not yet investigated.
5. **Make Payment API endpoint:** the modal's Submit button action and payload structure were not captured via network (modal not submitted during this investigation to avoid side effects on sandbox data).
6. **Prorated Amount triggering via Playwright — RESOLVED (2026-06-26):** The `input#proratedDate` field is rendered by **React DatePicker (RDP)**. The `onChange` fires when the user selects a day in the calendar popup — not on a generic blur event. To trigger it in Playwright, use the **native HTMLInputElement value setter + dispatchEvent** pattern (same as `fillArrangementSchedule` for the arrangement date fields):

   ```typescript
   await this.page.evaluate((val) => {
     const el = document.querySelector('input#proratedDate') as HTMLInputElement;
     const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
     if (nativeSetter) nativeSetter.call(el, val);
     el.dispatchEvent(new Event('input', { bubbles: true }));
     el.dispatchEvent(new Event('change', { bubbles: true }));
     el.blur();
   }, mmddyyyy);
   ```

   This triggers the RDP `onChange` and fires `GET /uown/svc/getProrateAmount/{accountPk}?onDate={YYYY-MM-DD}` automatically. Verified: diff $0.00 between displayed value and API response (CT-02 `$705.39`, CT-03 `$1,410.77`, account 17307, sandbox, 2026-06-26). See `application-lifecycle` pitfall #144 + `src/pages/servicing/servicing-base.page.ts` → `setProratedDate`.

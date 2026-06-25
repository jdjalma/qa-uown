---
title: Servicing — Customer Information Page (Account Detail)
domain: knowledge-base
status: snapshot
volatility: volatile
last_verified: 2026-06-25
sources:
  - env: sandbox
  - account: "17298 (Sanjay James, Tire Agent, 13-month ACTIVE lease, NY)"
  - url: https://svc-website-sandbox.uownleasing.com/customer-information/17298
  - code: servicing/pages/customer-information/[account].tsx
  - code: servicing/components/account-summary/index.tsx
  - code: servicing/domain/stores/customer.tsx
  - code: servicing/layouts/auth/index.tsx
covers:
  - servicing-customer-information
  - account-detail
  - identity-verification-gate
  - account-status-change
  - servicing-information-panel
  - activity-log
  - make-payment
  - send-invite
  - prorated-amount
  - bank-account-credit-card-management
  - epo-90day
promoted_to: []
---

# Servicing — Customer Information Page (Account Detail)

> Charter: Explore `/customer-information/{accountPk}` with Playwright MCP + source to map the central account-detail screen of the Servicing portal — all panels, actions, modals, endpoints, and business rules.
> Origin: gap analysis — the most-used Servicing screen was undocumented (2026-06-25) · Overall confidence: high

---

## Purpose

The **central account-detail screen** of the Servicing portal. Landing page after clicking an Account # from `/search` or the Quick Search autocomplete. URL segment is `customer-information` but the UI calls the left-sidebar tab **"Servicing"**.

A single screen that aggregates **everything an agent needs** to service one lease: customer identity, contacts, employment, third-party references, bank/card payment instruments, full contract & financial breakdown, delinquency, EPO/90-day payoff, protection plan, a payment-summary panel, and the full activity log. It is also the launch point for the high-impact actions: **change account status, make a payment, send an invite, calculate prorated amount, edit any customer/servicing field, add a note.**

**Actors:** Servicing agents, supervisors, admins (internal, agent-facing portal).

---

## Portal / URL

| Property | Value |
|---|---|
| Portal | Servicing (`svc-website-{env}.uownleasing.com`) |
| Route | `/customer-information/{accountPk}` (Next.js dynamic segment `[account]`, numeric) |
| Source page | `servicing/pages/customer-information/[account].tsx` |
| Auth | Required — redirects to `/` login if unauthenticated |
| Viewport | Internal portal → inspect at `1440×900` (Bootstrap `d-lg-block` ≥992px) |

---

## ⚠️ BR-00 — Identity-Verification Gate (mandatory, blocks the whole page)

On **every** open of an account, a modal **"Customer Information Confirmation"** renders on top of the (already-loaded) page. It shows the borrower's **First Name, Last Name, Date of Birth, Last 4 SSN** and two buttons: **CANCEL** / **Confirm**.

- **CANCEL → the agent is redirected to `/search`** — you CANNOT view or act on the account without confirming identity. `[confirmed]` (sandbox 2026-06-25: clicked CANCEL → URL became `/search`)
- **Confirm →** dismisses the modal and unlocks the page.
- Component: `VerifyCustomerInformationModal`, gated by permission `verify_customer_information`. There is also an `AgentIdVerificationPopup` reachable via URL param `&popup=true`. `[inferred]` via source
- **Automation pitfall:** any test that opens `/customer-information/{pk}` must handle/confirm this modal first, otherwise the page behind it is inert and a CANCEL silently bounces to `/search`. The page DOM loads behind the modal (snapshot is fully populated), but interaction is blocked until Confirm.

---

## ⚠️ BR-01 — Opening the account auto-writes a REVIEW activity log

Loading the page fires `POST /uown/svc/createOrUpdateLog` automatically, producing a **`REVIEW`** note **"Lead has been reviewed"** authored by the current agent. `[confirmed]` (network request #40 on load + top rows of the Notes table). Implication: simply opening an account leaves an audit trail — relevant for activity-log assertions ([[activity-log-validation]]) and for not mistaking review noise for real events.

---

## Page Layout

```
┌─ Navbar: logo | Servicing▼ | History▼ | Quick search | user menu ──────────┐
├─ Sidebar (left rail): Servicing · Transaction · Documents · Print · Viewing │
├─ Account Summary Bar (full width) ─────────────────────────────────────────┤
│   Account# | Ref Account→ | Borrower | Status | New Status▼ | Next Payment   │
│   | Next Due Date | Merchant | Location | Items Purchased→ | Program Type     │
│   [calc-prorated] [make-payment] [send-invite]  (3 action icons)             │
├─ 3-column body ────────────────────────────────────────────────────────────┤
│ LEFT (xl=3)        │ MIDDLE (xl=3)         │ RIGHT (xl=6)                     │
│ Primary Applicant  │ Bank Account          │ Servicing Information            │
│ Primary Contact    │ Credit Card           │  (Acct&Contract / Pay Status /   │
│ Employment         │ CC Peek Consent       │   Delinquency / EPO-90d / PP)    │
│ Third Party Info   │                       │ Payment Transactions (summary)   │
├─ Notes / Activity Log (full width, paginated table) ───────────────────────┤
└─────────────────────────────────────────────────────────────────────────────┘
```

### Left sidebar rail (per-account navigation)
| Icon | Label | Action |
|---|---|---|
| building | **Servicing** | this page `/customer-information/{pk}` (view perm `customer_information`) |
| exchange | **Transaction** | `/payment-transaction/{pk}` (perm `payment_transaction`) — see [[servicing-make-payment]] |
| file | **Documents** | `/documents/{pk}` — see [[servicing-documents-page]] |
| printer | **Print** | `window.print()` of the page |
| (avatars) | **Viewing** | concurrency indicator — `GET /uown/users-on-page` shows who else has the account open `[confirmed]` (network) |

> The top navbar also exposes the full **Servicing▼** (Payment Transaction, Due Amounts, Payment Arrangement) and **History▼** (ACH, CC Transactions, Email, Items Purchased, Payments, Phone, Due Date Changes, Frequency Changes) dropdowns — each entry routes to `/{page}/{accountPk}`.

---

## Account Summary Bar (header)

| Field | Example (acct 17298) | Notes |
|---|---|---|
| Account # | 17298 | Servicing PK |
| Ref Account | **L98024** | link → Origination `/customers/{leadPk}` (new tab). `L`=real lead, `R`=RTO |
| Borrower | Sanjay James | |
| Status | ACTIVE | current `account.status` |
| **New Status** | combobox | **status-change control** — see BR-02 |
| Next Payment | $131.18 | next due amount |
| Next Due Date | 07/27/2026 | |
| Merchant | Tire Agent | |
| Location | Tire Agent | |
| Items Purchased | "1 Items" (link) | → `/items-history/{pk}` |
| Program Type | 13 months | 13m / 16m |

**3 action icons (right of summary):**
1. **Calculate Prorated Amount** → `ProratedModal` → `GET /uown/svc/getProrateAmount/{pk}?onDate={date}` (prorated payoff as of a date). See [[servicing-documents-page]] (same modal exposed there).
2. **Make Payment** → `PaymentModal` (ACH / CC / Check). Perms `create_or_update_ach_payment` OR `make_credit_card_payment`. Warning modal if account is in a paid-out/inactive state.
3. **Send Invite** → `InviteModal` → `ConfirmationModal`. Options: Trustpilot (`sendTrustpilotInvitation`), Customer Portal link (`sendCustomerPortalLink`), Podium (`accounts/{pk}/podium-link`). Gated by `view_send_invite` + per-channel perms.

### BR-02 — Change Account Status (New Status combobox)
Selecting a new value opens **`AddCommentModal`** (a comment is required) → `POST /uown/svc/changeAccountStatus`. `[confirmed]` (combobox values observed; flow via source).

**Status enum (9 values):** `ACTIVE`, `PAID_OUT`, `PAID_OUT_EARLY`, `PAID_OUT_EARLY_EPO`, `CHARGED_OFF`, `CLOSED`, `CANCELLED`, `SOLD`, `SETTLED_IN_FULL`.

- `CANCELLED → ACTIVE` shows a **warning modal first** and needs the stronger perm `status_cancelled_to_active` (vs generic `account_status`). `[inferred]` via source
- The status change writes a `STATUS_CHANGE` activity log: *"Account status changed from X to Y; {comment}"* `[confirmed]` (observed rows in Notes table).

---

## Panels (read + edit) and their endpoints

Each panel has an **edit pencil** gated by a specific permission. All edits `POST` back and re-read. **The per-panel modal/inline field sets, validations, and the DNC cross-account warning are documented in [[servicing-account-edit-modals]].**

### Left column
| Panel | Displays | Edit endpoint | Edit perm |
|---|---|---|---|
| **Primary Applicant** | First/Last name, DOB, SSN (shown unmasked `872-61-5636`), License #/State/Exp | `createOrUpdatePrimaryCustomerInfo` | `create_or_update_primary_customer_info` (+ `dob`, `ssn` sub-perms) |
| **Primary Contact** | Address 1/2, City/State/ZIP, Primary Email (+ "do not email"), Mobile Phone (+ "do not call"/"do not text"/"opt out AI"), Preferred communication channel, Preferred language | `createOrUpdatePrimaryCustomerContactInfo`; flags via `updateDnc` / `updateDnt` / `updateOptOutAi` | `create_or_update_primary_customer_contact_info` |
| **Employment** | Employer info (collapsed by default) | `createOrUpdateEmployment` | `create_or_update_employment` |
| **Third Party Information** | Third-party contact (collapsed) | `createOrUpdateThirdPartyContact` | `create_or_update_third_party_contact` |

### Middle column
| Panel | Displays | Actions / endpoints | Perms |
|---|---|---|---|
| **Bank Account** | Primary account: Type (CHECKING), Routing #, Account #, "Set as default payment?" | **Add Account** (`createOrUpdateBankAccount`) · **View All** (`ViewAllBAModal`, remove via `removeBankAccounts`) | `add_bank_accounts`, `view_all_bank_accounts`, `remove_bank_accounts` |
| **Credit Card** | Cardholder name, Card # (masked `************6909`), CVC, Expiration, default flag, **Is Valid Card?** | **Add Card** (`createOrUpdateCreditCard`) · **View All** (`ViewAllCCModal`, remove/edit) | `add_credit_cards`, `view_all_credit_cards`, `edit_credit_cards`, `remove_credit_cards` |
| **CC Peek Consent** | CC Peek Consent (Yes/No switch), Consent Date | toggle saved via `createOrUpdateServicingInfo` | `create_or_update_servicing_information` |

### Right column — Servicing Information panel (`getServicingInfo` + edit `createOrUpdateServicingInfo`)
Four sub-sections (all in one editable panel):

1. **Account & Contract Overview** — Activation Date, **Total Contract Amount** (ⓘ breakdown), **Contract Balance** (ⓘ), **Settlement Amount** (ⓘ), Lending Category Type (LTO), Frequency, Payment, Cost/Cash Price, Tax Rate %, Processing Fee, Buyout Fee, Rating Letter (dropdown from `getRatingLetters`).
2. **Payment Status & History** — Last Pay Date/Amount, Payment Count Up to Date, Payments Remaining, Payment Dollars Up to Date, Total Payment without Fees, Overpayment Amount, **Remaining Approval Amount** + **"Check Eligibility"** (→ `getRemainingApprovalAmount/{pk}` for reapproval).
3. **Delinquency & Servicing Actions** — Amount Past Due, # of Due Date Moved, **Autopay** (ACH/CC multi-select), Date of Next Call, **Is Eligible for Reapproval** ("Check Eligibility").
4. **Early Payoff / 90-Day Pay Off** — **EPO Balance** (ⓘ), EPO Fee %, Eligible for 90-day Pay Off (Yes/No), 90-day override, **90-day Total** (ⓘ), 90-day Expiration Date.
5. **Protection Plan** — Protection Plan Fees To Date, Protection Plan Fees Paid (also surfaced via `getProtectionPlanForAccount`). See [[buddy-protection-plan-qa2]].

> Changing **Frequency** here triggers `changePaymentFrequency` (requires new due date[s]) and is audited on the Frequency Changes history page.

#### Financial breakdown modals (click the ⓘ labels) `[confirmed]`
Clicking **Total Contract Amount**, **EPO Balance**, or **90-day Total** opens a read-only breakdown table — useful oracles for amount-calculation tests:

- **Total Contract Amount Breakdown:** `ContractAmount (Invoice × MoneyFactor)` + `Processing Fee` + `Total Tax` = `Total Contract Amount With Tax and Fees`; then `+ Protection Plan AddOn To Date + Other Fees (NSF, Reinstatement, Misc)` = **Total**. (17298: 1136.31 + 40.00 + 100.84 = 1277.15; +0 +57.00 = **$1,334.15**.)
- **EPO Breakdown** — **explicit formula `EPO Balance = 90 Day Payoff Amount − Total Paid Amount + Fees`** (+ rows: Account 90-Day Payoff Eligible, State). (17298: 758.64 − 10.00 + 57.00 = **$805.64**.)
- **90 Day Breakdown:** `Invoice Amount + Processing Fee + Buy Out Fee + Protection Plan Fee To Date + Tax Amount` = **Total**. (17298: 568.21 + 40.00 + 100.00 + 0 + 50.43 = **$758.64**.)

#### Check Eligibility (reapproval) `[confirmed]`
"Is Eligible for Reapproval → **Check Eligibility**" fires `GET getRemainingApprovalAmount/{pk}` and resolves **inline** to `Yes` + populates **Remaining Approval Amount** (17298: `$1599`). Non-mutating (read-only GET).

### Payment Transactions panel (read-only summary)
- Returned Payments count · # Payments Scheduled · **Last 3 Payments** (Date / Total Amount / Type) · **Pending ACH Payment** table · **Pending Credit Card Payment** table.
- Sources: `getLastThreePayments/{pk}`, `getACHPayments?accountPk={pk}`, `getCCTransactions/{pk}`, `getSchedSummaryForAccount/{pk}`.
- Deep links to `/payment-transaction/{pk}`, `/ach-history/{pk}`, `/credit-card-history/{pk}`.

---

## Notes / Activity Log (full-width table)

| Column | Notes |
|---|---|
| (priority flag) | toggle via `updateActivityLogPriority?pk={logPk}` (perm `toggle_log_priority`) |
| Date | `MM/DD/YYYY h:mm:ss a.m./p.m. EST` |
| Type | REVIEW · STATUS_CHANGE · DATA_CHANGE · CORRESPONDENCE · … |
| User ID | agent username or `SYSTEM` |
| Notes | free text / structured payload |

- Source: `GET /uown/svc/getLogs/{pk}?page=0&size=10&logTypes=&notes=&createdBy=&orderByPriority=true`
- **Filters** button → panel with **Notes** (free text, `name=notes`), **User id** (`name=userId`), **Log Activity** (multi-select checkboxes + Select All), and **Search**. Maps to `getLogs` params `notes`/`createdBy`/`logTypes`. Columns sortable. Rows per page: **10 / 25 / 50 / 100**.
  - **Log Activity filter — 8 system categories:** `CORRESPONDENCE`, `DUE_DATE_MOVES`, `INFORMATION`, `DATA_CHANGE`, `STATUS_CHANGE`, `CREDIT_CARD`, `REVIEW`, `INTERNAL`. `[confirmed]` (distinct from the 13 *manual* Add-Log types in [[servicing-account-edit-modals]] §8).
- **Add note** (pencil/＋ in header) → `createOrUpdateLog`.
- **Observed log types & shapes** (acct 17298, `[confirmed]`):
  - `REVIEW` — "Lead has been reviewed" (auto on open, BR-01)
  - `STATUS_CHANGE` — "Account status changed from CLOSED to ACTIVE; {comment}"
  - `DATA_CHANGE` — "Receivable added/updated, type: …, dueDate: …, amount: …, status: …, comment: …, skipped: …" (fees, waives, skips from the Due Amounts page → see [[scheduled-payments]])
  - `CORRESPONDENCE` — "Sent PaymentReceiptEmail. Subject … To …" / "Created PaymentReceiptSms to be sent as SMS" (author `SYSTEM`)

---

## API endpoints — page load (17 concurrent `GET`s)

`getAccountSummary/{pk}` · `getRatingLetters` · `getPrimaryCustomerInfo/{pk}` · `getPrimaryCustomerContactInfo/{pk}` · `getEmployment/{pk}` · `getThirdPartyContact/{pk}` · `getSchedSummaryForAccount/{pk}` · `getServicingInfo/{pk}` · `getFinancialInfo/{pk}` · `getCreditCards/{pk}` · `getBankAccounts/{pk}` · `getLastThreePayments/{pk}` · `getACHPayments?accountPk={pk}` · `getCCTransactions/{pk}` · `getAlertsForAccount/{pk}` · `getAccountInfo/{pk}` · `getLogs/{pk}` · `getProtectionPlanForAccount/{pk}`
(all under `/uown/svc/`). Plus `POST createOrUpdateLog` (the auto-REVIEW, BR-01) and `GET /uown/users-on-page` (concurrency). `[confirmed]` via network capture.

**Pitfall:** `getLogs/null?...` fires once with `null` (HTTP 400) before the route param resolves, then re-fires with the real pk (200) — the 400 is benign and not an account error.

## API endpoints — actions
| Action | Endpoint (method) |
|---|---|
| Change status | `changeAccountStatus` (POST) |
| Edit customer / contact / employment / third-party | `createOrUpdate{PrimaryCustomerInfo,PrimaryCustomerContactInfo,Employment,ThirdPartyContact}` (POST) |
| DNC / DNT / opt-out AI | `updateDnc` / `updateDnt` / `updateOptOutAi` (POST) |
| Edit servicing info / CC-peek / frequency | `createOrUpdateServicingInfo`, `changePaymentFrequency` (POST) |
| Bank / card CRUD | `createOrUpdateBankAccount`, `createOrUpdateCreditCard`, `removeBankAccounts`, `removeCreditCards` (POST) |
| Prorated / reapproval | `getProrateAmount/{pk}?onDate=`, `getRemainingApprovalAmount/{pk}` (GET) |
| Invites | `sendTrustpilotInvitation/{pk}`, `sendCustomerPortalLink/{pk}`, `accounts/{pk}/podium-link` (POST) |
| Notes | `createOrUpdateLog`, `updateActivityLogPriority?pk={logPk}` (POST) |

---

## Business Rules

- **BR-00:** Identity-verification gate blocks the page; CANCEL bounces to `/search`. `[confirmed]`
- **BR-01:** Opening the account auto-writes a `REVIEW` log. `[confirmed]`
- **BR-02:** Status change requires a comment (`AddCommentModal`) and writes a `STATUS_CHANGE` log; `CANCELLED→ACTIVE` is extra-gated. `[confirmed]`/`[inferred]`
- **BR-03:** SSN is shown **unmasked** in the Primary Applicant panel and in the identity modal (Last 4). Card number is masked. `[confirmed]` (consistent with the unmasked-SSN observation on the Search table → [[servicing-search-quick-search]])
- **BR-04:** Every edit is permission-gated by a granular role permission (see Permissions). A user without a perm has the pencil hidden (not just disabled). `[inferred]` via source
- **BR-05:** "Items Purchased" count links to `/items-history/{pk}`; Ref Account links cross-portal to Origination (new tab). `[confirmed]`
- **BR-06:** Frequency change from the Servicing panel needs the new due date(s) and is audited on the Frequency Changes page. `[inferred]` via source

---

## Permissions (view + modify)

**View:** `customer_information` (page), plus per-section view perms. **Modify:** `create_or_update_primary_customer_info` (+`dob`,`ssn`), `…_contact_info`, `…_employment`, `…_third_party_contact`, `create_or_update_servicing_information`, `verify_customer_information`, `account_status` (+`status_cancelled_to_active`), `add/edit/remove/view_all_{bank_accounts,credit_cards}`, `create_or_update_ach_payment`, `make_credit_card_payment`, `toggle_log_priority`, `view_send_invite` (+`send_{trustpilot_invitation,customer_portal_link,podium_link}`).

---

## Connections with What Was Already Known

- **Confirms:** SSN exposed unmasked (also seen on Search table — [[servicing-search-quick-search]]).
- **Confirms:** Ref Account `L`/`R` prefix semantics; cross-portal Origination link.
- **New:** the identity-verification gate (BR-00) — a hard precondition for any test that drives this page; not previously documented.
- **New:** opening an account auto-creates a REVIEW log (BR-01) — relevant to activity-log assertions.
- **New:** full endpoint map (17 load GETs + action POSTs) and the four servicing sub-sections (EPO/90-day, delinquency, reapproval).
- **Relates to:** [[scheduled-payments]] (Due Amounts — fee/waive/skip DATA_CHANGE logs originate there), [[servicing-documents-page]] (shared Prorated/Make-Payment/Send-Invite modals), [[buddy-protection-plan-qa2]] (Protection Plan panel).

---

## Gaps / To Investigate

1. **Make Payment modal (`PaymentModal`)** — full field set, CC vs ACH vs Check branches, charge-fee toggle, receipt — documented separately in [[servicing-make-payment]] (payment-transaction page). The summary-bar modal vs the dedicated page may share logic — confirm. `[gap]`
2. **`getAlertsForAccount` / `getAccountInfo`** — what alerts render (bankruptcy flags, fraud holds)? Not visibly surfaced in the 17298 snapshot. `[gap]`
3. **Role-based visibility** — pencils/buttons hidden vs disabled per missing perm not verified via a low-priv login (only `jmendes.gow` admin observed). `[gap]`
4. **`AgentIdVerificationPopup` (`&popup=true`)** vs `VerifyCustomerInformationModal` — when does each fire? `[gap]`

> ✅ Closed: the ⓘ breakdown modals (Total Contract / EPO / 90-day, with formulas), Check Eligibility behaviour, and the Notes Filters panel + Log Activity categories are now documented above. Per-panel edit field sets are in [[servicing-account-edit-modals]].

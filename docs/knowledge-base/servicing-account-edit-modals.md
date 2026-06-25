---
title: Servicing — Account Edit Modals & Inline CRUD (Customer Information)
domain: knowledge-base
status: snapshot
volatility: volatile
last_verified: 2026-06-25
sources:
  - env: sandbox
  - account: "17298 (Sanjay James, Tire Agent, 13m ACTIVE, NY)"
  - url: https://svc-website-sandbox.uownleasing.com/customer-information/17298
  - code: servicing/pages/customer-information/[account].tsx
  - code: servicing/domain/stores/customer.tsx
covers:
  - servicing-account-edit
  - inline-edit
  - primary-applicant-edit
  - primary-contact-edit
  - dnc-dnt-reason
  - add-bank-account
  - add-credit-card
  - servicing-info-edit
  - add-log
  - autopay-edit
  - rating-letter-edit
promoted_to: []
---

# Servicing — Account Edit Modals & Inline CRUD (Customer Information)

> Charter: Explore every edit/CRUD affordance on `/customer-information/{pk}` with Playwright MCP — capture each modal/inline-edit field set, validations, and side-effect warnings, without submitting.
> Origin: 2nd-pass gap analysis — the page-level doc ([[servicing-customer-information-page]]) listed the endpoints but not the modal/inline field sets. (2026-06-25) · Overall confidence: high (all opened live; none submitted)

---

## Purpose

Documents the **write layer** of the account-detail page: how an agent edits customer/servicing data. Two interaction patterns coexist:

- **Inline edit** — the pencil turns a panel's read fields into editable inputs **in place**, with `CANCEL` / `SAVE` at the panel bottom. Used by: Primary Applicant, Primary Contact, Employment, Third Party, Servicing Information.
- **Modal** — a separate dialog. Used by: Add Bank Account, Add Credit Card, Add New Log, View All (bank/cards), and the **DNC/DNT/email reason** sub-modal.

> ⚠️ Editing is gated behind the [[servicing-customer-information-page]] **identity-verification gate** (BR-00) — you must Confirm identity before any pencil is reachable.

---

## BR-00 — Hidden fields appear only in edit mode

Two fields exist that the **read view does not show** but edit mode reveals:
- **Middle Name** — Primary Applicant (read view shows only First/Last). `[confirmed]`
- **Next Payment Date** — Servicing Information → Payment Status & History. `[confirmed]`

Tests asserting a "complete" read of a panel will miss these unless they enter edit mode.

---

## 1. Primary Applicant — inline edit  `[confirmed]`

Pencil → panel becomes editable. Fields:
| Field | Control | Value (17298) |
|---|---|---|
| First Name | text | Sanjay |
| **Middle Name** | text | *(empty — hidden in read view)* |
| Last Name | text | James |
| Date of Birth | date searchbox | 08/19/1977 |
| SSN | text | 872-61-5636 (**unmasked**) |
| License # | text | — |
| License State | dropdown ("Select one") | — |
| License Exp. | date searchbox | — |

Buttons: CANCEL / SAVE → `POST createOrUpdatePrimaryCustomerInfo`. DOB/SSN edits sub-gated (`dob`, `ssn` perms).

---

## 2. Primary Contact — inline edit + DNC reason modal  `[confirmed]`

Editable fields: Address Line 1, Address Line 2, City, **State** (dropdown), ZIP, Primary Email, Mobile Phone, **Preferred communication channel** (dropdown, default `-- Select --`), **Preferred language** (dropdown, default `ENGLISH`).

**Contact-preference checkboxes** — **disabled in read view, enabled in edit mode** (DOM `name`): `do not email` (`doNotEmailPrimary`), `do not call` (`doNotCallMobile`), `do not text` (`doNotTextMobile`), `opt out AI` (`optOutAiMobile`).

### ⚠️ BR-01 — DNC/DNT/email reason modal is phone-number-scoped (cross-account side effect)
Checking **do not call** (or text/email) pops a modal **"Reason for Do Not Call Mobile"**:
- **Reason** (text, required, placeholder "The reason for Do Not Call Mobile")
- Warning: **"\* This will affect all accounts with this number"**
- CANCEL / Save

So a DNC/DNT flag is **not account-scoped — it propagates to every account sharing that phone number.** `[confirmed live]` High-impact: a test toggling DNC on one account mutates contact policy for all accounts on that number. Endpoints: `updateDnc` / `updateDnt` / `updateOptOutAi`.

Panel CANCEL/SAVE → `POST createOrUpdatePrimaryCustomerContactInfo`.

---

## 3a. Employment — inline edit  `[confirmed]`

Pencil expands the (collapsed) panel into an inline form with two sub-sections:

**Pay Info:** Last (pay date), Next (pay date), Gross Annual Income (currency, e.g. `$56,000.00`), Pay Frequency (dropdown).
**Employer:** Employer (text, e.g. `Uown TEST`), Position, Employer Address, City, State, Zip Code, Employer Contact (phone), Date of Employment (date).

CANCEL / SAVE → `POST createOrUpdateEmployment`.

## 3b. Third Party Information — inline edit  `[confirmed]`

Pencil expands into an inline form. Fields (DOM `name`/placeholder):
| Field | `name` | Placeholder |
|---|---|---|
| Name | `name` | Name |
| Relationship | `relationship` | **Spouse/Child/Parent** |
| Phone | `phoneNumber` | Phone No |
| (consent checkbox) | — | — |

CANCEL / SAVE → `POST createOrUpdateThirdPartyContact`.

---

## 4. Add a Bank Account — modal  `[confirmed]`

| Field | Control | Default |
|---|---|---|
| Type | dropdown | CHECKING |
| Routing Number | text | — |
| Account Number | text | — |
| Set as default payment? | dropdown | No |

CANCEL / SAVE → `POST createOrUpdateBankAccount`. **View All** opens **"All Bank Accounts"** modal — a selectable table (`select-all` checkbox · Type · Routing Number · Account Number · Default Payment, sortable) with a **Delete** button **disabled until ≥1 row is selected** (multi-select remove → `removeBankAccounts`, perm `remove_bank_accounts`). `[confirmed]`

---

## 5. Add a Credit Card — modal  `[confirmed]`

| Field | Control |
|---|---|
| Cardholder's First Name | text |
| Cardholder's Last Name | text |
| Card Number | text |
| CVC | text |
| Expiration Month | dropdown |
| Expiration Year | dropdown |
| Set as default payment? | dropdown |

CANCEL / SAVE → `POST createOrUpdateCreditCard`. **View All** opens `ViewAllCCModal` (list + remove/edit). `[source]`

---

## 6. Servicing Information — inline edit (selective)  `[confirmed]`

⚠️ **BR-02 — only 6 fields become editable**; the rest of the panel stays **read-only even in edit mode**:

| Editable field | Control |
|---|---|
| Frequency | dropdown (Bi-Weekly…) — change triggers `changePaymentFrequency` |
| Rating Letter | dropdown ("Select…", 13 `RatingLetter` values — see [[servicing-search-quick-search]]) |
| **Autopay** | **multi-select chips** — ACH + CC chips each with a "Remove" ✕, plus a combobox to add |
| Date of Next Call | date (MM/DD/YYYY) |
| Eligible for 90-day Pay Off Override | dropdown ("Select…") |
| 90-day Expiration Date | date (MM/DD/YYYY) |

**Read-only even in edit:** Activation Date, Total Contract Amount, Contract Balance, Settlement Amount, Lending Category, Payment, Cost/Cash Price, Tax Rate, Processing Fee, Buyout Fee, all Payment-Status metrics, EPO Balance/Fee, 90-day Total, Protection Plan fees.

CANCEL / SAVE → `POST createOrUpdateServicingInfo` (Frequency change → `changePaymentFrequency`).

---

## 7. CC Peek Consent — inline edit  `[source/pattern]`

Pencil → toggle the CC Peek Consent switch + consent date; saved via `createOrUpdateServicingInfo`. Not individually captured. `[gap]`

---

## 8. Add New Log (Notes) — modal  `[confirmed]`

| Field | Control |
|---|---|
| Ref Account | read-only display (`98024`) |
| **Log Type** | dropdown — **13 manual types** |
| Log Note | textarea |

CANCEL / Save → `POST createOrUpdateLog`.

**Manual Log Type options (13):** `Internal`, `Email`, `Inbound Call`, `PEO Support`, `Merchant Review`, `POP Shipment`, `Outreach - Merchant`, `Outreach - Platform`, `Outreach - ISR`, `Escalation`, `Social Media`, `Customer Assistance`, `Other`. `[confirmed live]`

> These are **agent-authored** note types — distinct from the **system-generated** activity types seen in the log table (`REVIEW`, `STATUS_CHANGE`, `DATA_CHANGE`, `CORRESPONDENCE`). The activity-log **Filters** button filters by these. See [[activity-log-validation]].

---

## Business Rules

- **BR-00:** Middle Name (Applicant) and Next Payment Date (Servicing Info) are edit-mode-only fields. `[confirmed]`
- **BR-01:** DNC/DNT/email-opt-out flags are **phone-number-scoped** ("affects all accounts with this number") and require a reason. `[confirmed live]`
- **BR-02:** Servicing Information edit exposes only 6 mutable fields (Frequency, Rating Letter, Autopay, Date of Next Call, 90-day Override, 90-day Expiration); financials/balances are immutable from the UI. `[confirmed]`
- **BR-03:** Customer panels use **inline** edit; instrument-add (bank/card), log-add, and DNC-reason use **modals**. `[confirmed]`
- **BR-04:** Autopay is a multi-select (ACH and/or CC), edited via add-combobox + remove-chip. `[confirmed]`
- **BR-05:** Every successful edit should leave an activity-log entry (`DATA_CHANGE`/`CONTACT_UPDATE`); assert it ([[activity-log-validation]]). `[expected]`

---

## Connections with What Was Already Known

- **Extends:** [[servicing-customer-information-page]] (which mapped the endpoints; this maps the field sets + validations behind each).
- **New:** the DNC phone-number-scoped cross-account warning (BR-01) — a real side-effect trap for tests.
- **New:** the 13 manual Log Types; the edit-mode-only hidden fields; the selective Servicing-Info editability.
- **Relates to:** [[scheduled-payments]] (Frequency/Autopay changes audited on the Frequency Changes & Due-Date pages — [[servicing-history-pages]]).

---

## Gaps / To Investigate

1. **CC Peek Consent** inline edit (switch + consent date) field set — minor; not individually captured. `[gap]`
2. **View All Credit Cards** modal — analogous to All Bank Accounts (selectable table + Delete), plus an **Edit** affordance (`edit_credit_cards`); layout not individually captured. `[gap]`
3. Validations on save (routing-number checksum, card Luhn, SSN format, email format) not exercised — would require submitting. `[gap]`
4. Whether DNC reason Save mutates all accounts (warning text asserts it) — not executed. `[gap]`
5. Frequency-change inline → does it open a follow-up "new due date" modal on SAVE? (source implies new due date[s] required). `[gap]`

> ✅ Closed this pass: Employment & Third Party inline field sets (§3a/§3b), All Bank Accounts modal (§4), contact-checkbox `name` attributes (§2).

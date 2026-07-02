---
title: Origination Customer / Lead Detail Page
domain: knowledge-base
status: snapshot
volatility: volatile
last_verified: 2026-06-30
sources:
  - env: stg
  - lead: 7218178
  - lead: 7218266
  - code: src/pages/origination/customer.page.ts
covers: [origination-customer-page, lead-detail, lead-status, internal-status, agent-actions, modify-lease, cancel-lease, send-to-signed, blacklist-lead, documents-lease-panel, activity-log, pii-display, session-replay, primary-applicant-edit, primary-contact-edit]
promoted_to: []
---

# Origination Customer / Lead Detail Page

> Charter: Explore `/customers/{leadPk}` with Playwright MCP to discover the agent-facing lead detail screen — header, status-dependent actions, data sections, and side effects.
> Origin: user request — "verifique o que temos documentado do portal origination e discovery no que nao temos documentado e documente" · Overall confidence: high
> NOTE: this file is per-feature discovery knowledge, NOT an execution record. Source-tagging per finding.

## Purpose

The single-lead working screen for an internal Origination agent. From the leads/overview tables, clicking a `Reference #` opens `/customers/{leadPk}`. It consolidates the applicant's PII, contact, employment, banking, credit-card, fraud-consent, transaction, merchant, document, session-replay, and activity-log data, and exposes the **status-dependent agent actions** that move the lead through the pipeline (modify, sign, cancel, blacklist, move to servicing). It is the Origination counterpart of the Servicing account page.

Who uses it: Origination agents, supervisors, managers, admins (role gates the visible actions and PII — see Business rules).

## How to reach it

- Side menu has no direct "Customers" link by default; the entry appears as **Customers** in the nav once a lead is open (observed: nav gained a `Customers` item on the detail page). `[confirmed]`
- Header **Quick search by `Lead #`** box → jumps to a lead. `[confirmed]`
- Click a `Reference #` link in Overview / Leads / Funding tables → `/customers/{leadPk}`. `[confirmed]`
- A small **Viewing N** counter in the nav indicates concurrent viewers on the lead. `[confirmed]` (observed value `0`)

## Header summary (top band)

| Field | Example (lead 7218178) | Notes |
|---|---|---|
| Reference Number | `7218178` | = leadPk |
| Account Number | `622636` (link) | Present only once the lead is converted to a servicing account; links to `https://svc-website-{env}.uownleasing.com/customer-information/{accountPk}` `[confirmed]` |
| Borrower | `John Brown` | |
| Approval Amount | `$1,050.00` | Final approval amount |
| Internal Status | `FUNDING` | Raw internal status (e.g. `FUNDING`, `NO_BUSINESS_IN_STATE`, `UW_APPROVED`) |
| Status | `Funding` | Public/display lead status |
| Eligible For Extra Info | `No` | `is_eligible_for_extra_info` flag (post-UW extra data step) — see business-rules §6 |

## Available operations (status-dependent action bar)

The action bar (top-right of the header) is **gated by the lead's current status**. Observed on a `Funding` lead:

| Action | Available (Funding) | What it does | Confidence |
|---|---|---|---|
| Modify Lease | ✅ | Opens the lease modification flow (`modify-lease.spec.ts`) | `[confirmed]` |
| Send to Signed | ✅ | Forces the lead to `SIGNED` | `[confirmed]` |
| Send Trustpilot Invitation | ✅ | Fires a Trustpilot review invitation (side effect: email/SMS) | `[confirmed]` |
| Blacklist Lead | ✅ | Adds all of the lead's data to the fraud Blacklist at once | `[confirmed]` |
| Cancel Lease | ✅ | Cancels the lease/lead (`lease-cancellation.spec.ts`) | `[confirmed]` |

> Note (code audit): `customer.page.ts:43` only defines `changeToSignedButton` ("Change to Signed"); the "Send to Signed" label seen live may be the same control relabeled by status. Treat them as possibly one control, not two code paths, until confirmed.

Additional actions exist for **other statuses** (present in `customer.page.ts`, not all visible on a Funding lead) — confirm per status before testing:

| Action | Source | Confidence |
|---|---|---|
| Move to Servicing | `moveToServicingButton` | `[inferred from code]` |
| Change to Signed | `changeToSignedButton` | `[inferred from code]` |
| Set to Expired | `setToExpiredButton` | `[inferred from code]` |
| Settle Lease (via **Documents → Lease card row**, `settleLeaseViaDocuments()`; confirm checkbox `#isConfirmedForSettlement`) | `customer.page.ts` | `[inferred from code]` — note: the `#settleLeaseForm` locator is declared but unused; the real path is the Documents-card row, not an action-bar button |
| Modify Approval Amount | `modify-approval-amount.spec.ts` | `[inferred from code]` |
| Protection-Plan cancellation | `protection-plan-cancellation.spec.ts` | `[inferred from code]` |

> GAP: the full state → action-availability matrix is not yet captured. Each status (NEW, APPROVED, SIGNED, FUNDING, FUNDED, DENIED, EXPIRED, CANCELLED) should be observed to confirm which buttons render.

## Data sections (cards)

Each card has an **edit pencil** icon (inline edit). Observed cards, in DOM order:

1. **Primary Applicant** — First Name, Last Name, Date of Birth, SSN, License #, License State, License Exp. `[confirmed]`
2. **Primary Contact** — Address Line 1/2, City, State, ZIP; Primary Email + `do not email`; Mobile Phone + `do not call` / `do not text`; Preferred communication channel (select, default `-- Select --`); Preferred language (default `ENGLISH`). `[confirmed]`
3. **Employment** — collapsible; edit pencil. Fields not expanded in this pass. `[confirmed]` (presence) / GAP (fields)
4. **Bank Account** — Type (`CHECKING`), Routing Number, Account Number (masked `*********0000`), Set as default payment? `[confirmed]`
5. **Credit Card** — Cardholder First/Last, Card Number (masked `************6909`), CVC, Expiration Date, Set as default payment?, **Is Valid Card?** (`Yes`/`No`). `[confirmed]`
6. **Credit Card Peek Consent** — CC Peek Consent (switch, `Yes`/`No`), Consent Date. `[confirmed]`
7. **Transactions → Last 3 Payments** — table: Date, CC Number, Status, Pre-Auth Status, Captured Amount, Original Requested Amount, Type, ccPeek. `See All` opens full history. (Observed row: `APPROVED` / Pre-Auth `ERROR` / `$49.00` / `AUTHENTICATION` / `false`.) `[confirmed]`
8. **Merchant Info** — Merchant, Location, contact Name/Phone/Primary Email, Merchant Support, **Reference Merchant Code** (link `/merchant/{code}`), Client Type, **Approved term months** (e.g. `13 months, 16 months`). `[confirmed]`
9. **Documents** — `Upload New` button + file list (`No Documents to Display` when empty) and a **Lease** panel listing contracts: contract number (e.g. `UOWN_85416_7218178`), contract type (`LEASE`/`LEASE_MOD`), status (`SIGNED`/`SENT`/…), term months, timestamp. Clicking the contract opens the document. `[confirmed]`
10. **Record** — **session-replay recordings** (Sentry replays, links to `gguown.sentry.io/replays/{id}`) with timestamps. Used for fraud/behavior review. `[confirmed]`
11. **Notes** — the **Activity Log** (Filters + table). Per Inviolable Rule #13, every business action must produce a note here. `[confirmed]` (presence)

## Alerts

A red **alert banner** renders above the sections when the lead has active alerts (observed: `Credit card not Valid for this Transaction` with `See all alerts` + `Hide Alert`). The same alerts appear in the global **Alerts** page (`/alerts`) keyed by Lead Pk. `[confirmed]`

## Business rules / observations

- RN-01: Action availability is **status-scoped** — a Funding lead exposes Modify/Send-to-Signed/Trustpilot/Blacklist/Cancel; other actions (Move to Servicing, Set to Expired, Settle) belong to other statuses. *(evidence: action bar on lead 7218178, Funding)* `[confirmed]` / matrix `[inferred]`
- RN-02: **Account Number link appears only after conversion** to a servicing account; it deep-links to the Servicing portal. *(evidence: lead 7218178 had account 622636)* `[confirmed]`
- RN-03: **PII is shown in clear to the admin role** — full SSN (`854-78-4953`) and DOB (`04/07/1979`) rendered; bank account and card numbers are masked. This intersects the `RU06.26.1.53.0_completeApplicationSecurityPiiDataAccessReduced` work — but the **reduction's scope (which role, which fields, which surface) is NOT yet confirmed** (see [origination-role-based-access-and-pii.md](origination-role-based-access-and-pii.md) GAP). *(evidence: Primary Applicant card as `jmndes.gow` admin)* `[OBSERVATION]`
  - GAP: confirm what each non-admin role (agent, manager, supervisor, readonly, merchant) sees in these fields — that is the actual AC of the PII-reduction task.
- RN-04: `do not email` / `do not call` / `do not text` are **read-only checkboxes** on the card (disabled); editing is via the edit pencil. *(evidence: disabled checkboxes)* `[confirmed]`
- RN-05: **CC Peek Consent** governs the `ccPeek` flag seen on transactions; consent is a toggle with a Consent Date. *(evidence: CC Peek Consent card + Transactions `ccPeek` column)* `[inferred]`

## Connections with what we already knew

- The header shows both `Internal Status` (raw lifecycle status, e.g. `FUNDING`) and `Status` (its public display form, e.g. `Funding`). **Correction (code audit 2026-06-25):** this is the raw-vs-display *lifecycle* status, **not** the UW-engine `internal_decision` vs `uw_status` split of business-rules §6 — do not assume the `Internal Status` field binds to `uw_info.internal_decision` unless verified. 
- Confirms **`is_eligible_for_extra_info`** surfaces in the UI ("Eligible For Extra Info"). 
- The **Documents → Lease panel** is the read model behind `customer.page.ts#getLeasePanelContracts` (contractNumber/type/status/termMonths/timestamp).
- The **Notes** card is the Activity Log mandated by Rule #13 — every action test must assert a note here.

## Primary Applicant Inline Edit `[confirmed stg 2026-06-29]`

Discovered on leads **7218266** (UW_APPROVED) and **7218271** (FUNDING).

### BR-PA-01 — Pencil only available on pre-signing leads

The edit pencil (`<span id="PrimaryApplicant-edit">`, `data-icon="pen"` SVG) is **only rendered for pre-signing leads** (e.g. UW_APPROVED, NEW, APPROVED). For post-signing leads (FUNDING, FUNDED, SIGNED), the card header shows only the chevron-down toggle — all fields are `inputField__readOnly` and there is no edit affordance. `[confirmed]`

### BR-PA-02 — Edit mode fields (8 total)

| Input ID | Label | Type | Notes |
|---|---|---|---|
| `applicantFirstName` | First Name | text | |
| `applicantMiddleName` | Middle Name | text | **hidden in read view** — only appears in edit mode |
| `applicantLastName` | Last Name | text | |
| `applicantDOB` | Date of Birth | date search | format MM/DD/YYYY |
| `applicantSSN` | SSN | text | shown unmasked (raw digits, no dashes in value) |
| `applicantDLNumber` | License # | text | |
| `react-select-N-input` | License State | dropdown | React Select |
| `applicantDLExp` | License Exp. | date search | format MM/DD/YYYY |

CANCEL / SAVE buttons appear at panel bottom in edit mode.

### BR-PA-03 — CANCEL has no side effects

Clicking CANCEL: panel reverts to read mode (7 readOnly divs, 0 inputs), no POST to `createOrUpdatePrimaryCustomerInfo` is fired. `[confirmed]`

### BR-PA-04 — SAVE endpoint and refresh

SAVE fires `POST /uown/los/createOrUpdatePrimaryCustomerInfo` (200). After success, `GET /uown/los/getPrimaryCustomerInfo/{leadPk}` re-fetches the panel data. Panel returns to read mode showing updated values. `[confirmed]`

### BR-PA-05 — Success toast

Toast: **"Information successfully updated."** (Toastify success variant, bottom-right). `[confirmed]`

### BR-PA-06 — No activity log entry (differs from Servicing)

Editing Primary Applicant in the Origination portal does **NOT** create a `DATA_CHANGE` entry in `uown_los_activity_log`. The only log during the flow is the automatic `REVIEW` ("Lead has been reviewed") on page open. This is a confirmed behavioral difference from the Servicing portal (where every panel edit writes `DATA_CHANGE`). `[confirmed — DB verified stg lead 7218266]`

### BR-PA-07 — Pencil trigger mechanics

Native `element.click()` and Playwright `locator.click()` time out due to element stability. Use `element.dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true, view: window}))` via `page.evaluate` to reliably trigger edit mode. `[confirmed automation pitfall]`

## Primary Contact Inline Edit `[confirmed stg 2026-06-30]`

Discovered on lead **7218266** (UW_APPROVED). Oracle: [origination-edit-primary-contact.md](../../.claude/oracles/origination-edit-primary-contact.md).

### BR-PC-01 — Distinct card/endpoint from Primary Applicant

The Address (Line 1/2, City, State, ZIP), Primary Email, Mobile Phone, do-not-contact flags, and communication-preference fields all live in the **Primary Contact** card (`<span id="PrimaryContact-edit">`), a separate card with its own pencil and save endpoint — not part of Primary Applicant. `[confirmed]`

### BR-PC-02 — Edit mode fields

Address Line 1, Address Line 2, City, ZIP → text inputs. State, Preferred communication channel, Preferred language → comboboxes. Primary Email, Mobile Phone → text inputs. `do not email` / `do not call` / `do not text` checkboxes become editable (enabled, vs. disabled in read mode). CANCEL / SAVE buttons appear at panel bottom. `[confirmed]`

### BR-PC-03 — CANCEL has no side effects

Clicking CANCEL reverts to read mode, no POST fired. `[confirmed]`

### BR-PC-04 — SAVE endpoint and refresh

SAVE fires `POST /uown/los/createOrUpdatePrimaryCustomerContactInfo` (200), payload nests `leadAddresses[].addressInfo` / `leadEmails[].emailInfo` / `leadPhones[].phoneInfo` keyed by `leadPk`. After success, `GET /uown/los/getPrimaryCustomerContactInfo/{leadPk}` re-fetches the panel; it returns to read mode with updated values. `[confirmed]`

### BR-PC-05 — Activity log entry IS created (differs from Primary Applicant)

Unlike Primary Applicant (BR-PA-06), saving Primary Contact **DOES** write a `DATA_CHANGE` entry to `uown_los_activity_log`. Resolves the gap noted below — Primary Contact does NOT follow the same no-DATA_CHANGE pattern as Primary Applicant; the two cards on the same page behave differently. `[confirmed — DB verified stg lead 7218266: "UPDATED : Address[ zipCode9 changed from null to 93721 ]"]`

### BR-PC-06 — `[OBSERVATION]` Log message names the wrong field

The DATA_CHANGE note text references `zipCode9` (null → 93721), not `streetAddress1` — the field actually edited and persisted (`uown_los_address.street_address1`: "3579 Cherry Ave" → "482 Magnolia Court"). The note never mentions the street address change. Single observation, not isolated against a one-field-only edit — not classified as a bug; re-check before relying on this log's text for assertions.

### BR-PC-07 — UI Notes grid does not auto-refresh

The on-page Notes/activity table still showed the prior top-10 rows immediately after SAVE; the new DATA_CHANGE row was visible via DB query but required a manual page reload to appear in the rendered grid. `[confirmed]`

### BR-PC-08 — Pencil click mechanics differ from Primary Applicant

Plain Playwright `locator.click()` on `#PrimaryContact-edit` worked reliably to enter edit mode — unlike Primary Applicant (BR-PA-07), which needs `dispatchEvent`. Caution: the *sibling* chevron-collapse icon at the card-header level is easy to mis-target instead of the pencil (collapses the card instead of opening edit mode). `[confirmed]`

---

## Gaps / to investigate

- Full **state → action-bar** matrix (per lead status).
- **Employment** card field set (not expanded).
- **Per-role PII visibility** (the actual AC of `completeApplicationSecurityPiiDataAccessReduced`).
- `Send Trustpilot Invitation` side effects (email/SMS template, throttling).
- `Modify Approval Amount` / `Settle Lease` forms (fields + validation) — referenced by tests but not snapshotted here.
- Whether Primary Contact pencil is gated to pre-signing leads only, same as Primary Applicant (BR-PA-01) — not verified this pass.
- Whether Employment inline edit follows the Primary Applicant or Primary Contact DATA_CHANGE pattern.
- Whether CT-08b (log naming wrong field) reproduces on an isolated single-field edit, and whether it reproduces for email/phone changes too.

**Skills loaded:** `.claude/skills/discovery/SKILL.md`

---
title: Origination Customer / Lead Detail Page
domain: knowledge-base
status: snapshot
volatility: volatile
last_verified: 2026-06-25
sources:
  - env: stg
  - lead: 7218178
  - code: src/pages/origination/customer.page.ts
covers: [origination-customer-page, lead-detail, lead-status, internal-status, agent-actions, modify-lease, cancel-lease, send-to-signed, blacklist-lead, documents-lease-panel, activity-log, pii-display, session-replay]
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

## Gaps / to investigate

- Full **state → action-bar** matrix (per lead status).
- **Employment** card field set (not expanded).
- **Per-role PII visibility** (the actual AC of `completeApplicationSecurityPiiDataAccessReduced`).
- Behavior of each edit pencil (which fields are editable post-signing vs locked) and the resulting Notes entries.
- `Send Trustpilot Invitation` side effects (email/SMS template, throttling).
- `Modify Approval Amount` / `Settle Lease` forms (fields + validation) — referenced by tests but not snapshotted here.

**Skills loaded:** `.claude/skills/discovery/SKILL.md`

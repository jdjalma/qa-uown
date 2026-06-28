---
title: Funding — SIGNED to FUNDING transition (live discovery)
domain: knowledge-base
status: snapshot
volatility: volatile
last_verified: 2026-06-28
sources:
  - env: stg
  - lead: 7218271
  - db: uown_los_lead, uown_funding_transaction, uown_funding_modification, uown_sv_account, uown_los_lead_notes
  - api: POST /uown/los/settleApplication, POST /uown/los/getApplicationStatus
  - code: src/api/clients/settlement.client.ts
  - code: src/helpers/api-setup.helpers.ts
  - code: src/pages/origination/funding.page.ts
covers: [funding-queue, settlement, los-svc-import, svc]
promoted_to: [.claude/oracles/funding.md]
---

# Funding — SIGNED to FUNDING transition (live discovery)

> Charter: discover how a signed lease (`SIGNED`) moves into `FUNDING`, to ground the BDD oracle
> `.claude/oracles/funding.md`. UI→API→DB (rule #18). Origin: user request — "faça o oráculo bdd para
> funding, tornar a aplicação de signed para funding" (2026-06-28). Overall confidence: high (DB+API live).
> NOTE: per-feature discovery knowledge, NOT an execution record.

## What FUNDING is

Funding is the moment UOwn pays the merchant for the product the customer leased — UOwn assumes the
financial risk. A `SIGNED` lease enters the **Funding Queue** (`/funding`, Origination) with
`Funding Queue Status = FUNDING`, awaiting an ops agent to advance it to `FUNDED` (that next step is a
separate oracle, `funded.md`).

## Three triggers move SIGNED → FUNDING

| # | Trigger | Path | Note text (funding_transaction.user_notes) | Evidence |
|---|---|---|---|---|
| 1 | `POST /uown/los/settleApplication` (partner API, canonical) | **SIGNED → READY_TO_FUND → FUNDING** | `SYSTEM changed status from READY_TO_FUND to FUNDING` | live stg lead 7218271 |
| 2 | Auto-move `merchant.is_signed_to_funding = true` (at signing) | **SIGNED → FUNDING** (direct) | `SYSTEM changed status from SIGNED to FUNDING` | KB lead 7218178 (2026-06-25) |
| 3 | `POST /uown/los/updateFundingStatus {leadPks, status:'FUNDING'}` (internal/ops) | status flip | — | `driveLeadToFunding` helper |

**Eligibility:** the lead MUST be `SIGNED` (or `READY_TO_FUND`). `settleApplication` on `UW_APPROVED`
returns `A0` + `transactionMessage: "LeadStatus UW_APPROVED is not eligible for settlement"`. Lease ≥ $250.

## Live walkthrough (stg 2026-06-28, lead 7218271, settle path)

**Pre-state:** lead `SIGNED`, `uuid=5ffdc1f7-d847-44ab-9646-b1518550c96d`, `account_pk=null`, 0 rows in
`uown_funding_transaction`. Merchant pk 566 = `OW90218-0001` (Tire Agent, ONLINE, esign SIGNWELL), with
`is_signed_to_funding=false`, `use_webhook=false`, `five_day_funding_exception=true`,
`funding_report_frequency=DAILY`.

**Trigger:** `POST /uown/los/settleApplication` → HTTP 200, body is **XML** (`<ApplicationSettleResponse>`)
with `<faults>false</faults>`, `<accountNumber>5ffdc1f7…</accountNumber>`, `<authorizationNumber>7218271</authorizationNumber>`.

**Activity log trail (`uown_los_lead_notes`, chronological):**
1. `[LosRequestMessageConstraintValidator][validateApplicationSettleRequest]`
2. `Merchant requested settlement through API`
3. `[ContractService][isLeaseOrLeaseModSigned] Lead starting status SIGNED`
4. `[UOwnClient][settleApplication] Lead set to READY_TO_FUND`
5. `[UOwnClient][settleApplication] End. LeadStatus : READY_TO_FUND`
6. `[LeadFundingService][updateFundingStatus] Update Lead Status to FUNDING`
7. `[updateFundingStatus] OldLeadStatus : READY_TO_FUND New LeadStatus : FUNDING`

**Post-state:**
- `uown_los_lead`: `lead_status=FUNDING`, `account_pk=622660`.
- `uown_funding_transaction` (new pk 756264): `funding_queue_status=FUNDING`, `funding_status=FULL_FUNDING`,
  `status=ACTIVE`, `amount_to_be_funded=2201.22`, `invoice_amount=2341.50`, `total_contract_amount=5623.89`,
  `funding_request_date_time` set, `fund_date_time=NULL`,
  `user_notes="06/28/2026 : SYSTEM changed status from READY_TO_FUND to FUNDING"`, `created_from=NULL`.
- `uown_sv_account` pk 622660: `account_status=ACTIVE`, `lead_pk=7218271` (SVC account created at FUNDING).
- `uown_funding_modification`: **0 rows** (initial entry not audited).
- `getApplicationStatus` (XML): `currentStatus=FUNDING`, `hasSignedLease=true`, `applicationFound=true`,
  `approvedAmount=2341.50`, `openToBuy=0.00`, `fundRequestDateTime=2026-06-28T05:01:10.779771`,
  `fundedDateTime=(empty)`, `amountToBeFunded=2201.22`, `paymentDueDate=2026-07-05`, `transactionStatus=I0`.

## Findings / business rules

- **RN-01: `READY_TO_FUND` is a real intermediate status** (`src/types/enums.ts:14`). The explicit `settleApplication`
  path persists it (`SIGNED → READY_TO_FUND → FUNDING`); the auto-move path goes direct (`SIGNED → FUNDING`).
  The `user_notes` text differs accordingly — useful to tell the two paths apart. `[confirmed live]`
- **RN-02: the SVC servicing account (`uown_sv_account`) is created at FUNDING, not FUNDED.** At the moment the
  lead became FUNDING, `uown_sv_account` pk 622660 already existed with `account_status=ACTIVE`. This corrects the
  `funded.md` attribution of SVC-account creation to the FUNDED step. `[confirmed live]`
- **RN-03: `uown_funding_modification` does NOT record the initial SIGNED→FUNDING entry** (0 rows). Per §67 the
  audit covers only subsequent funding-queue transitions (FUNDING→FUNDED, FUNDED→FUNDING, REQUEST_REFUND→REFUNDED).
  The trail for the initial entry lives in `uown_los_lead_notes` + `funding_transaction.user_notes`. `[confirmed live]`
- **RN-04: `funding_status=FULL_FUNDING`** marks a full settlement (vs partial). `amount_to_be_funded` (2201.22) <
  `invoice_amount` (2341.50) by dealer discount + platform fee + CC fee (§9 formula). `[confirmed live]`
- **RN-05: webhook is config-gated.** FUNDING is in the default webhook-trigger status list (§28), but a webhook
  fires only when `merchant.use_webhook=true`. Merchant 566 has `use_webhook=false` → no FUNDING webhook (confirmed:
  no webhook note appeared). `[confirmed live]`
- **RN-06: partner API responds in XML**, not JSON (`<ApplicationSettleResponse>` / `<ApplicationStatusResponse>`),
  even though the typed clients (`SettleApplicationResponseBody`) model JSON. `<faults>false</faults>` = success.
  When validating via raw `curl`/`fetch`, parse XML. `[confirmed live]`
- **RN-07: auto-move requires `is_signed_to_funding=true`.** Merchant 566 has it false → lead did NOT auto-fund;
  an explicit `settleApplication` was required. The flag is editable via `merchant-configurator` profile
  `signedToFunding` (`src/support/merchant-configurator.ts`). `[confirmed live]`

## UI surfaces (live, stg 2026-06-28, lead 7218271)

Re-drive via Playwright + manager login (`jmndes.gow`, **no OTP** — the Origination portal login is
username/password only; `LoginPage.login()` confirms). `.auth/origination.json` refreshed.

- **Funding Queue (`/funding`)** — the lead shows as a single row (`1-1 of 1`): Reference # `7218271`,
  **Status `FUNDING`**, **Funding Queue Status `FUNDING`**, Customer `Mark Griffin`, Two Day Funding Exception
  `False`. Bulk "Send to FUNDED" dropdown present (next transition). `[confirmed live]`
- **Customer page (`/customers/{leadPk}`)** — top banner: Reference `7218271`, **Account Number `622660`**
  (the SVC account, clickable), **Internal Status `FUNDING`**, **Status `Funding`**, Approval `$2,341.50`,
  Merchant `Tire Agent`. Cards: Primary Applicant, Primary Contact, Employment, Bank Account, Credit Card,
  CC Peek Consent, Protection Plan, Transactions, Merchant Info, Documents, **Notes**. `[confirmed live]`
- **RN-08: the activity log on the Origination customer page is the "Notes" card** (header text **"Notes"**,
  NOT "Activity") — a table with columns **Date | Type | User ID | Notes** + a Filters control + pagination
  ("1-10 of 36"). Note `Type` values: `STATUS_CHANGE`, `CORRESPONDENCE`, `DATA_CHANGE`, `INTERNAL`, `REVIEW`.
  The SIGNED→FUNDING transition renders as:
  - `STATUS_CHANGE / SYSTEM / "Merchant requested settlement : SIGNED -> FUNDING"` (UI collapses the path to
    `SIGNED -> FUNDING`, hiding the internal `READY_TO_FUND`).
  - `STATUS_CHANGE / SYSTEM / "Funding Status is updated from READY_TO_FUND [to FUNDING]"`.
  - `CORRESPONDENCE / SYSTEM / "Created Welcome to be sent as EMAIL"` + `"Created ActivationNotice to be sent
    as EMAIL"` → **confirms the welcome email** (§10 LOS→SVC import). `[confirmed live]`
- **RN-09: `SELECTORS.activityLogEntry` HARDENED to the "Notes" card (2026-06-28).** The legacy selector was
  anchored on a card containing text "Activity", but the card is "Notes" (a react-data-table:
  `.rdt_Table[role=table]`, rows `.rdt_TableRow`), so `customerPage.getActivityLogEntries()` returned `[]`.
  Rewritten to anchor on the card **title** "Notes" (excluding the in-table "Notes" column header via
  `not(ancestor rdt_Table)` to avoid double-counting) and take the `.rdt_TableBody .rdt_TableRow` body rows.
  `getActivityLogEntries()` now scrolls the Notes heading into view + waits for the first row (lazy render).
  DOM-first verified live: 10 body rows, no dups, captures `STATUS_CHANGE / SYSTEM / "Funding Status is updated
  from READY_TO_FUND to FUNDING"`. `tsc` clean. `[confirmed live + code-fixed]`
- **RN-10: the Notes card paginates 10/page, Date DESC, and opening `/customers/{pk}` writes a `REVIEW "Lead has
  been reviewed"` note** → repeated visits push older notes (e.g. the funding transition) to page 2. A test must
  read the transition note right after the action (before REVIEWs accumulate) or filter by `Type=STATUS_CHANGE`.
- **Side effect:** opening `/customers/{leadPk}` writes `REVIEW / "Lead has been reviewed"` notes (visible in the
  Notes card, authored by the logged-in user) — same review-on-open behavior seen on the Servicing customer page.

## Connections with what we already knew

- The Funding Queue **UI surface** (columns, bulk "Send to FUNDED", filters, the `SYSTEM changed status … to
  FUNDING` User Notes) is documented in `origination-funding-queue-page.md` (lead 7218178, 2026-06-25) — that
  lead shows the **auto-move** variant ("from SIGNED to FUNDING", `created_from=TIRE_AGENT_API`).
- The next transition (FUNDING → FUNDED) is `funded.md`; the refund path (FUNDED → REQUEST_REFUND → REFUNDED)
  is separate.
- Helpers: `driveLeadToFunding` (`api-setup.helpers.ts`) chains `changeLeadStatus(SIGNED) → settleApplication →
  updateFundingStatus(FUNDING)`; `waitForLeadStatus` / `findLeadNoteContaining` (`esign-db.helpers.ts`).

## Gaps / to investigate

- Whether the auto-move path (`is_signed_to_funding=true`) ALSO traverses `READY_TO_FUND` internally or jumps
  straight to FUNDING (the `user_notes` text suggests direct, but not byte-confirmed against a fresh auto lead).
- The exact `amount_to_be_funded` formula breakdown (dealer discount vs platform fee vs CC fee) for this lead.
- The FUNDING webhook payload shape (needs a merchant with `use_webhook=true`).
- Whether `settleApplication` with a `lineItem` array different from the original invoice triggers a partial
  settlement (this run omitted `lineItem`, getting FULL_FUNDING).

**Skills loaded:** `.claude/skills/discovery/SKILL.md`, `.claude/skills/test-scenarios/SKILL.md`, `.claude/skills/check-points/SKILL.md`

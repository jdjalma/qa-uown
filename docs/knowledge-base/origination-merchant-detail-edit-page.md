---
title: Origination Merchant Detail / Edit Page
domain: knowledge-base
status: snapshot
volatility: volatile
last_verified: 2026-06-28
sources:
  - env: stg
  - env: sandbox
  - merchant: OW90218-0001
  - merchant: OW90337-0001
  - code: src/pages/origination/merchant-edit.page.ts
  - code: src/pages/origination/merchant-setting.page.ts
  - code: src/data/merchant-config-contract.ts
covers: [merchant-config, merchant-management, merchant-programs, fraud-vendors, esign, webhooks, correspondence, merchant-snapshot]
promoted_to: []
---

# Origination Merchant Detail / Edit Page

> Charter: Explore `/merchant/{refMerchantCode}` with Playwright MCP to map the full merchant configuration form (previously only the funding-emails and config-columns slices were documented).
> Origin: user request — origination documentation gap sweep (continuation) · Overall confidence: high
> NOTE: per-feature discovery knowledge, NOT an execution record.

## Purpose

The canonical **per-merchant configuration** screen. Every behavior that varies by merchant — fraud-vendor toggles, eSign routing, fees, approval-expiry windows, funding rules, report delivery, valid states, assigned programs — is set here. It is the UI source of truth behind `src/data/merchant-config-contract.ts` and the merchant-preflight in **Inviolable Rule #12**. Reached from the lead detail page (Reference Merchant Code link), the Merchant list, or `/merchant/{code}`.

## Layout

Sections (cards): **Merchant Information** · **Settings** · **Contact** · **Programs** (Add / Delete All) · **Notes** (activity log: Date, Type, User ID, Notes + Log Activity). Top actions: `CANCEL`, `SAVE`. **Correction (code audit 2026-06-25):** `GDS Data` is an **inline collapsible section inside Settings** (its setters call `expandGdsDataSection()` first in `merchant-setting.page.ts`), **not a modal and not a separate top-level button** — the GDS Data button/section lives inside the Settings card, not in the header bar. `[confirmed sandbox 2026-06-28]`

## Merchant Information

Merchant Code\*, Merchant Name\*, Location Name\*, Legal Name\*, Peak Campaign Id\*, Off Peak Campaign Id\*, Dealer Discount\*, Dealer Rebate Override\*, Dealer Rebate Type\*, Approval Amount Increase\*, Allowed Frequency\*, Address\*, City\*, State\*, Zip\*, Merchant URL, Category, Username, api key, Client Type\*, Integration Type\*, Inventory Category\*, UOwn Sales Rep Code, Referral Partner, Num Days Approval Exp, Num Days Lease Exp. `[confirmed]`

## Settings — toggles (checkboxes)

**UPDATE 2026-06-28 (sandbox, OW90337-0001):** Checkboxes are now grouped into **7 collapsible sub-sections** (chevron ∨ to expand/collapse). Previously documented as a flat list — that was the old layout. `[confirmed sandbox 2026-06-28]`

| Sub-seção | Checkboxes |
|---|---|
| **Status** | Active · Accepting New Application · Deleted · Remove Merchant from User Profile |
| **Requirements** | Require Intellicheck Id Verification · Require SEON Id Verification · **Require Credit Card Before Signing** · **Require Bank Info Before Signing** · Require Bank Validation · Verify Phone Before Signing |
| **Fee** | Hold Deposit · Charge Processing Fee · Charge Processing Fee at Sign |
| **Status Change** | **Allow Change to Expired** · **Move from Signed to Funding** |
| **Others** | Check UW for Verification · Post Message · **Record Signing Flow** · **Return Lambda Score** · **Use LexisNexis** · **Use Neuro ID** · **Two Day Funding Exception** · **Five Day Funding Exception** · **Use Webhook** · Allow Purchase Option · **Offer Protection Plan** · **Auto Deny Application** · **Require Plaid Verification** · Funding on Hold |
| **EPO** | Epo 10% · Epo 5% |
| **Fraud** | **Is Fraud Check Required** · Verify Phone · Verify Email · Verify IP · **Use Neustar** · **Use Sentilink** |

> Note: `[bold]` = item appears in `merchant-config-contract.ts` preflight. Sub-section grouping is UI-only (no change to underlying fields).

## Settings — values

Webhook URL\* · CC Processing Fee · Merchant Type · Lending Category · **eSign Mode\*** · Referral Fee · Platform Fee\* · Platform Fee Type\* · Buyout Fee\* · Minimum Lease Amount\* · Default Months At Employer · Default Loan Amount\* · Merged Report Frequency · Merged Report Emails · Funding Report Frequency\* · Funding Report Emails\* · **Valid States\*** · Tax Exempted States · Termination Reason. `[confirmed]`

### GDS Data (sub-seção dentro de Settings)

**Correction (code audit 2026-06-25, confirmed sandbox 2026-06-28):** **UW Pipeline**, **Fraud Threshold**, and **Max Approval Amount** live **inside the GDS Data sub-section within Settings**, which has its own SAVE. Also confirmed: these 3 columns now appear as **default checked** in the Merchants list page (`/merchant`) table in sandbox (previously documented as "not yet deployed in QA1 as of 2026-06-15" in `merchants-config-columns-export.md`). `[confirmed sandbox 2026-06-28]`

## Contact

Bank: Routing Number, Account Number. Primary contact: Name\*, Email\*, Phone Number\*, Mobile Number. Secondary contact: Name, Email, Phone Number. Plus Merchant Support, General Notes. `[confirmed]`

## Programs section

Read/assign the merchant's lease programs: **Add** (assign a program/group) and **Delete All**. Program economics themselves are edited on Program Settings — see `origination-programs-program-settings-groups.md`. `[confirmed]`

## Business rules / observations

- RN-01: **Fraud-vendor toggles exist per merchant** — Use Sentilink / Use Neustar / Use LexisNexis / Use Neuro ID / Require Intellicheck / Require SEON / Require Plaid / Is Fraud Check Required correspond to the vendors in business-rules §5. Checkbox **presence** is `[confirmed]`; that vendor execution is **gated** by each toggle is `[inferred]` (presence ≠ proof of gating; §5 only says config is per-merchant). Note the mapping is **not literally 1:1** — Kount (§5.8) has **no** toggle here (it runs at payment time). *(evidence: Settings checkboxes; §5)*
- RN-02: **`eSign Mode`** is a document **rendering-format enum** (`DOCX | HTML | STRAPI | EMAIL`, per `esign-db.helpers.ts:47` / `VALID_ESIGN_MODES`), **NOT** a GowSign-vs-Signwell provider selector (corrected by code audit 2026-06-25). **Provider routing** is driven by customer state / `uown_esign_document.client`, not this field. *(evidence: code enum)* `[confirmed via code]`
- RN-03: **`Auto Deny Application`** is the merchant flag behind pipeline Step 2 (`MERCHANT_AUTO_DENIED`) — confirms the memory note that deterministic pre-UW denial = `auto_deny_application=TRUE`. *(evidence: toggle)* `[confirmed]`
- RN-04: **Funding behavior** is merchant-driven. Of these, only `Two/Five Day Funding Exception`, `Funding on Hold`, and `Funding Report Frequency` **surface as Funding-Queue columns/filters**; `Move from Signed to Funding` is a **behavioral toggle that does NOT appear as a Funding-Queue column** (corrected 2026-06-25). *(evidence: fields ↔ funding columns)* `[confirmed]`
- RN-05: **`Num Days Approval Exp` / `Num Days Lease Exp`** drive `approvalExpirationDate` (business-rules §6) and lease expiry. *(evidence: fields)* `[connection]`
- RN-06: **`Valid States` / `Tax Exempted States`** scope where the merchant can operate / tax treatment — feeds Step 1 State Check + tax calc. *(evidence: fields)* `[connection]`
- RN-07: All edits are auditable via the **Notes** activity-log (Date/Type/User ID/Notes) and the global **Merchant Modification History** (`/merchantModificationHistory`). *(evidence: Notes section)* `[confirmed]`

## Connections with what we already knew

- This is the full form behind `merchant-funding-report-emails.md` (Funding/Merged Report Emails) and `merchants-config-columns-export.md` (config columns).
- Confirms the merchant-config contract (Rule #12) field set — useful when extending `merchant-config-contract.ts` or `ensureMerchantReady`.
- `GDS Data` button = the per-merchant GDS/underwriting config referenced by the npm_segment/tam_score snapshot docs.

## Gaps / to investigate

- **`GDS Data`** collapsible-section full field set (beyond UW Pipeline / Fraud Threshold / Max Approval Amount — not fully expanded in this pass).
- Enum values for `eSign Mode`, `Integration Type`, `Client Type`, `Platform Fee Type`, `Dealer Rebate Type`, `UW Pipeline`, `Lending Category`.
- Required-field validation on SAVE and which fields are immutable post-creation.
- Behavior of `Delete All` programs and `Remove Merchant from User Profile`.
- Per-role edit permissions.

**Skills loaded:** `.claude/skills/discovery/SKILL.md`

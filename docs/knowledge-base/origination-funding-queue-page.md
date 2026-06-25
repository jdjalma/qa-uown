---
title: Origination Funding Queue Page
domain: knowledge-base
status: snapshot
volatility: volatile
last_verified: 2026-06-25
sources:
  - env: stg
  - lead: 7218178
  - code: src/pages/origination/funding.page.ts
covers: [funding-queue, csv-export, multi-select-filters, lead-status]
promoted_to: []
---

# Origination Funding Queue Page

> Charter: Explore `/funding` with Playwright MCP to discover the funding-queue body — columns, bulk actions, and filters (only the filters were previously documented).
> Origin: user request — origination documentation gap sweep (continuation) · Overall confidence: high
> NOTE: per-feature discovery knowledge, NOT an execution record.

## Purpose

The **Funding Queue** is the ops screen where the funding team reviews signed leases awaiting disbursement and moves them through the funding lifecycle. After a lease is `SIGNED` and (per merchant config) `Move from Signed to Funding` applies, the lead lands here with a **Funding Queue Status**; an agent bulk-advances rows to `FUNDED`. Audit of each transition lives in **Funding Modification History** (`/fundingModificationHistory`).

## Available operations

| Operation | Available? | Notes |
|---|---|---|
| View / search / filter | ✅ | Rich filter panel (below) |
| Bulk status change | ✅ | Per `funding.page.ts:165-201`: (1) tick the row checkbox(es), (2) click the **dropdown opener labelled "Send to FUNDED"**, (3) pick the **`FUNDED`** option, (4) click the primary **`SEND`** confirm. (Earlier wording conflated the dropdown-opener label with the final SEND step.) `[confirmed via code]` |
| Export | ✅ | `Email CSV` (large sets) / `Download CSV` |
| Per-row edit | (via lead) | Reference # links to the lead detail page `[inferred]` |

## Filters

`Start Date`, `End Date`, **`Search by Status Date`** (which date the range applies to), **`Status*`** (required, multi-select — defaults to 1 item), `Invoice Type`, `Client Type`, `Sales Rep Code`, **`Funding On Hold`**, `Merchant`, `Location`, **`2 Day Funding Exception`**, **`5 Day Funding Exception`**. `[confirmed]`

## Columns (35)

Reference # · Status · **Funding Queue Status** · Customer Name · Two Day Funding Exception · Five Day Funding Exception · Contact Number · Email Id · Sales Rep Code · Merchant · Location · Merchant Code · **Partial Settlement** · Invoice # · Invoice Amt. · Merchandise Total · Invoice Type · Order Number · **$ to be funded** · Inventory Cost · Total Contract Amt. · Total Items · Delivered Items · Funded Date Time · Refunded Date Time · Refund Request Date Time · Funding Request Date Time · Funding Report Frequency · Platform Fee · Discount · CC Processing Fee · Fees · Bank Routing Number · **User Notes** · Created from. `[observation, live stg 2026-06-25]` — only a few headers + their relative order are code-corroborated (`funding.page.ts readHeaderOrder`, reorder spec CT-03); the full 35-column set is a single live snapshot.

Observed row (lead 7218178): Status `FUNDING`, Funding Queue Status `FUNDING`, 2-Day Exception `False`, 5-Day Exception `True`, Invoice/Merchandise `$558.00`, Total Contract `$1,379.66`, Funding Report Frequency `Daily`, User Notes `06/25/2026 : SYSTEM changed status from SIGNED to FUNDING`, Created from `TIRE_AGENT_API`.

## Business rules / observations

- RN-01: **`Status` (lead) and `Funding Queue Status` are distinct columns** and can differ; the bulk action drives the Funding Queue Status. *(evidence: both columns present)* `[confirmed]`
- RN-02: **2-Day / 5-Day Funding Exception** flags mark leads outside the standard funding SLA window; they are both filterable and per-row booleans, and are merchant-configurable (`Two/Five Day Funding Exception` toggles on the Merchant edit page). *(evidence: columns + filters + merchant toggles)* `[confirmed]`
- RN-03: **Funding Report Frequency** per row (e.g. `Daily`) comes from merchant config (`Funding Report Frequency` field). *(evidence: column value + merchant field)* `[confirmed]`
- RN-04: The **User Notes** column is the inline funding activity trail (`SYSTEM changed status from SIGNED to FUNDING`) — satisfies Rule #13 for funding transitions. *(evidence: row note)* `[confirmed]`
- RN-05: **Partial Settlement** is a tracked dimension (column + per-lead concept), tied to settling part of an invoice. *(evidence: column)* `[OBSERVATION]`

## Connections with what we already knew

- The **filters** are the multi-select set documented in `multi-select-filters-mmh-modreport-funding.md`; this doc adds the columns + bulk action + body.
- Transitions here are audited by **Funding Modification History** (Old/New Funding Queue Status + Old/New Lead Status) — see `origination-portal-map.md`.
- `Move from Signed to Funding`, `2/5 Day Funding Exception`, `Funding Report Frequency/Emails` are all set on the **Merchant edit** page (`origination-merchant-detail-edit-page.md`).

## Gaps / to investigate

- The full **Funding Queue Status** enum (values selectable in the bulk dropdown beyond `FUNDED`) and the legal transitions.
- Whether **Send to FUNDED** validates per-row preconditions (e.g. delivered items, exceptions) before allowing the transition.
- **Partial Settlement** flow end-to-end.
- Role gating of the bulk action.

**Skills loaded:** `.claude/skills/discovery/SKILL.md`

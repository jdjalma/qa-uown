---
title: Multi-Select Filters — MMH, Modification Report, Funding Queue
domain: knowledge-base
status: stable
volatility: volatile
last_verified: 2026-06-18
sources:
  - env: qa2
  - gitlab: task-1319
covers: [filters, multi-select, mmh, modification-report, funding-queue, csv-export]
promoted_to: []
---

# Multi-Select Filters — MMH, Modification Report, Funding Queue

> Charter: Explore MMH (/merchantModificationHistory), Modification Report (/modificationReport), and Funding Queue (/funding) via Playwright MCP (qa2, 1440×900) to resolve Open Questions from SPEC 1319.
> Origin: Task #1319 — Add Multi-Select on Merchant/Location filters in MMH, Modification Report and Funding pages · Overall confidence: high

## Purpose

Task #1319 extends the multi-select Merchant/Location filter component (shipped in #1292 to 7 pages) to three remaining pages: Merchant Modification History (MMH), Modification Report, and Funding Queue. This investigation confirms deployment status in qa2, documents filter structure, component details, and CSV export behavior.

## OQ Resolutions (all confirmed via live DOM inspection, qa2 2026-06-18)

| OQ | Question | Answer |
|---|---|---|
| OQ-01 | Multi-select deployed in qa2? | **✅ Yes — all 3 pages** have `filter__value-container--is-multi` in the DOM |
| OQ-02 | Same shared component? | **✅ Yes** — same CSS class prefix `filter__`, `index-module_customOptionStyles__CSG9m`, `filter__menu-portal` across the 3 pages |
| OQ-03 | On-demand report button on the Funding Queue? | **❌ Does not exist** — no "generate report" button in the UI. Only Email CSV + Download CSV |
| OQ-05 | Does Funding use FilteredCsvDownload? | **✅ Yes** — Email CSV + Download CSV, same parent `div.d-flex`, classes `csvButton__18V59` |
| OQ-06 | Does Status use independent FundingQueueStatus? | **✅ Yes** — 4 separate options: Funding, Funded, Request Refund, Refunded |

## Filter Map by Page

### MMH (/merchantModificationHistory)

| Filter | Type | isMulti | Notes |
|---|---|---|---|
| Log Type | combobox | ❌ | Single-select |
| Start Date / End Date | searchbox | — | Date inputs |
| Merchant Ref Code | searchbox | — | Text input |
| Merchant | combobox | ✅ | Multi-select, checkboxes, 1405 options |
| Location | combobox | ✅ | Multi-select, **disabled until a Merchant is selected** |
| User Name | searchbox | — | Text input |

### Modification Report (/modificationReport)

| Filter | Type | isMulti | Notes |
|---|---|---|---|
| Merchant | combobox | ✅ | Multi-select, checkboxes |
| Location | combobox | ✅ | Multi-select, **disabled until a Merchant is selected** |
| Modification Type | combobox | ❌ | Single-select — not part of #1319 |
| Agent Name | searchbox | — | Text input |
| Start Date / End Date | searchbox | — | Date inputs |

### Funding Queue (/funding)

| Filter | Type | isMulti | Notes |
|---|---|---|---|
| Search by Status Date | combobox | ✅ | Multi-select (date range type) |
| Status* | combobox | ✅ | Multi-select, **Funding pre-selected by default** |
| Invoice Type | combobox | ❌ | Single-select |
| Client Type | combobox | ✅ | Multi-select |
| Funding On Hold | combobox | ❌ | Single-select |
| Merchant | combobox | ✅ | Multi-select, checkboxes, 1405 options |
| Location | combobox | ✅ | Multi-select, **NOT disabled** (independent of the Merchant, different from MMH/ModReport) |
| 2 Day Funding Exception | combobox | ❌ | Single-select |
| 5 Day Funding Exception | combobox | ❌ | Single-select |

## Status Filter — Confirmed Options (OQ-06)

```
Status* (multi-select, Funding pre-selected by default):
  ☑ Select All
  ☑ Funding      ← pre-selected when the page loads
  ☐ Funded
  ☐ Request Refund
  ☐ Refunded
```

Each option is **independently selectable via checkbox** — Request Refund and Refunded are distinct even though both map to `LeadStatus.OTHER`. `[confirmed]`

## Shared Component — DOM Structure

### CSS Classes (consistent across the 3 pages)

```
filter__control
filter__value-container filter__value-container--is-multi   ← presence of --is-multi = multi-select
filter__menu-portal
filter__menu-list filter__menu-list--is-multi
index-module_customOptionStyles__CSG9m                      ← container of each option (checkbox)
```

### Structure of each option

```html
<div class="index-module_customOptionStyles__CSG9m">
  <div class="d-flex align-items-center">
    <input type="checkbox">
    <span class="ml-2">Merchant Name</span>
  </div>
</div>
```

### "Select All" — behavior diverges per filter

| Filter | Has "Select All"? |
|---|---|
| Status (Funding Queue) | ✅ Yes |
| Merchant (MMH, ModReport, Funding) | ❌ No |
| Location | Not verified (dependent/empty during inspection) |

> **Pitfall:** do not assume Select All is universal — Status has it, Merchant does not. Verify per filter DOM-first before implementing a `selectAll()` helper.

## CSV Export (Funding Queue — OQ-05)

`FilteredCsvDownloadControls` component confirmed. Two buttons in the same `div.d-flex`:

| Button | CSS Class | DOM Order |
|---|---|---|
| Email CSV | `ml-2 index-module_csvButton__18V59 index-module_csvButton__disabledButton__UNKH3` | **1st** (first child) |
| Download CSV | `index-module_csvButton__18V59 index-module_csvButton__disabledButton__UNKH3 ml-2` | **2nd** |

> **Pitfall #118 confirmed:** Email CSV comes **before** Download CSV in the DOM. Use `:has-text('Download CSV')` to disambiguate — never `.csvButton` on its own.

Both buttons appear visually disabled (`csvButton__disabledButton__UNKH3`) before filters are applied.

## On-Demand Report (OQ-03)

**There is no on-demand report button in the Funding Queue UI.** The only export controls are Email CSV and Download CSV. The SPEC's S3.7 scenario must be **removed or re-scoped** to the sweeps via API (`triggerScheduledTask`).

> Impact on the SPEC: S3.7 ("on-demand report") has no visual affordance. Cover the sweeps via S3.8 only (dailyFundingReportSweep, dailyFundedReportSweep, dailyRefundReportSweep, dailyRefundedReportSweep).

## Differences between pages (for implementation)

| Behavior | MMH | ModReport | Funding |
|---|---|---|---|
| Location disabled until a Merchant is selected | ✅ | ✅ | ❌ (Location independent) |
| Select All on Merchant | ❌ | ❌ | ❌ |
| Select All on Status | — | — | ✅ |
| CSV export | Download CSV only | Not verified | Email CSV + Download CSV |
| Other non-multi-select filters | Log Type, Dates, Ref Code, User Name | Modification Type, Agent Name, Dates | Invoice Type, Funding On Hold, 2/5 Day Exception |

## Business Rules (domain rules)

- BR-01: MMH and ModReport: Location depends on the Merchant — it stays disabled until at least 1 merchant is selected. `[confirmed]`
- BR-02: Funding Queue: Location is independent — it does not require selecting a Merchant. `[confirmed]`
- BR-03: Default Status filter: "Funding" pre-selected when the Funding Queue loads. `[confirmed]`
- BR-04: The Status filter has 4 distinct values: Funding, Funded, Request Refund, Refunded — each with its own checkbox, independently selectable. `[confirmed]`
- BR-05: Merchant filter (all pages): 1405 options available in qa2, no "Select All". `[confirmed]`
- BR-06: The multi-select component uses `index-module_customOptionStyles__CSG9m` with an `<input type="checkbox">` inside each option. `[confirmed]`

## Logic and Exceptions

- Location disabled logic (MMH/ModReport): when opened with no merchant selected, the control gets `filter__control--is-disabled`. After selecting a merchant, it re-enables. Scenarios that test Location must select a Merchant first.
- Status "Funding" pre-selected: when testing multi-select with multiple statuses, clear the default selection before applying the test set.
- CSV buttons disabled visually by default: `csvButton__disabledButton__UNKH3` present before filters are applied — this is not an error; it is the expected initial state.

## Connections with What Was Already Known

- Confirms: `MerchantLocationFilterPO` (existing) can be reused — the component is the same across the 3 new pages.
- Confirms: pitfall #118 (Email CSV before Download CSV in the DOM).
- **New:** the Status filter has Select All; Merchant does not — intra-component divergence.
- **New:** Funding Location does not depend on the Merchant (different behavior from MMH/ModReport).
- **New:** there is no on-demand report button — the SPEC's S3.7 must be removed.
- **New:** the Funding Queue has more filters than the SPEC anticipated: Client Type (multi-select), Invoice Type, Funding On Hold, 2/5 Day Funding Exception.

## Resolved hypotheses — confirmed via discovery 2026-06-18

| Item | Status | Evidence |
|------|--------|-----------|
| Funding Queue Search endpoint | **[CONFIRMED]** `POST /uown/los/getLeadsForFundingQueue` | `browser_network_requests` on the Funding Queue (qa2) when loading the page + clicking Search — request captured: `POST https://origination-qa2.uownleasing.com/uown/los/getLeadsForFundingQueue [200]`. The regex in `MerchantLocationFilterPO.applySearch` already has `getLeadsForFundingQueue` — correct. Note: the full path includes `/los/` (`/uown/los/getLeadsForFundingQueue`); the regex is a substring match, so it covers it correctly. |
| Sweep `dailyRefundReportSweep` | **[CONFIRMED]** | `SELECT scheduled_task_name FROM uown_scheduled_task WHERE scheduled_task_name ILIKE '%refund%'` on dev3 (port 5445) returned `dailyRefundReportSweep` — exact name correct. |
| Sweep `dailyRefundedReportSweep` | **[CONFIRMED]** | The same query above returned `dailyRefundedReportSweep` — exact name correct. |

## Gaps / To Investigate

- **G1:** Location filter with a Merchant selected — which options appear and whether it has Select All? (Only verified in the disabled state.)
- **G2:** Pagination behavior with filters applied — not tested in this session.
- **G3:** Search request payload — array vs scalar (the SPEC's S-PAYLOAD) — not captured via network; reserved for the qa-implementer with `browser_network_requests`.
- **G4:** CSV download with multi-select filters applied — content and sign of REFUNDED/REQUEST_REFUND not verified here (requires leads in the corresponding states).
- **G5:** "Send to FUNDED" dropdown — sub-options not inspected (not in scope for this filters task).

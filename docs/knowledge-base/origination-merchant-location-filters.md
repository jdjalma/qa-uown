---
title: Origination Merchant/Location Filter Widgets
domain: knowledge-base
status: stable
volatility: volatile
last_verified: 2026-06-25
sources:
  - code: src/pages/origination/merchant-location-filter.po.ts
  - code: src/helpers/merchant-location-report.helper.ts
  - code: src/pages/origination/funding.page.ts
  - test: tests/e2e/origination/multi-select-filters.spec.ts
covers: [multi-select-filters, merchant-management, csv-export]
promoted_to: []
---

# Origination Merchant/Location Filter Widgets

> Charter: map the Merchant/Location filter mechanisms across the Origination portal, which page uses which, and the behavioral contract proven by the multi-select spec — from CODE evidence only (no browser this session).
> Origin: origination doc coverage audit (ultracode).
> Overall confidence: HIGH for the three-mechanism mapping and page-to-mechanism wiring (proven by page-object/helper/funding code + the CT-00..CT-15 spec); MEDIUM for exact rendered labels and the R1.53 stay-open visual (DOM-proven in code comments but not re-verified live this session).
> NOTE: per-feature discovery knowledge, NOT an execution record.

## What it is for

Origination list/report pages let an agent narrow the data grid by Merchant and Location (and, on the Funding Queue, by Status). Historically each page shipped its own filter; tasks #1205/#1292 (R1.52.0) standardized most pages onto one shared multi-select React component, #1319 wrapped the report pages in a shared TS helper, and the Funding Queue kept a bespoke filter. The result is **three distinct driving mechanisms** at the code level, backing **two distinct React components** (the shared `MerchantLocationFilters` and the Funding Queue's own form).

## The three mechanisms

| Mechanism | Source file | Pages that use it | Select All? | Apply model |
|-----------|-------------|-------------------|-------------|-------------|
| **#1292 shared widget PO** — `MerchantLocationFilterPO`, drives the `MerchantLocationFilters` React component (`filter__` CSS prefix) | `src/pages/origination/merchant-location-filter.po.ts` | Open To Buy, Rebate, Merchant list, Leads, Overview (bottom), Merchant Setting, New Application | Yes on OTB/Rebate/Merchant list/Leads/Overview-bottom/Merchant Setting; **NO on New Application** (intentional) | Blue **Search** button on most pages; **reactive** (apply-on-dropdown-close, no Search) on Open To Buy |
| **#1319 report controls helper** — `MerchantLocationReportControls`; *composes* the #1292 PO internally and adds rdt pagination + column reads + deprecated single-select | `src/helpers/merchant-location-report.helper.ts` | Merchant Modification History, Modification Report | Yes (inherited from the #1292 widget) | **Search** button (delegates to the #1292 PO `applySearch`) |
| **#3 Funding Queue custom filter** — bespoke methods inside `FundingPage`, scoped by stable react-select IDs (`#statuses`, `#merchantName`, `#merchantLocation`) | `src/pages/origination/funding.page.ts` | Funding Queue only | Yes on **Status**; Merchant/Location are multi-select | **Search** button (`applyFiltersMulti`); Status pre-selected to "Funding" on load |

Key code anchors: the #1292 widget self-describes its consumer pages at `merchant-location-filter.po.ts:8-10` and `:501`; the #1319 helper instantiates the #1292 PO at `merchant-location-report.helper.ts:3,23,26-27`; the Funding Queue declares itself a CUSTOM component (NOT the shared widget) at `funding.page.ts:9-19`. Grep confirms only `merchant-mod-history.page.ts` and `modification-report.page.ts` consume the #1319 helper; the #1292 pages reference the widget only in doc-comments and compose `MerchantLocationFilterPO` at the caller/spec level (`index.ts:33` is the only barrel export).

## Behavioral contract

Each bullet cites the proving line(s) and a confidence tag.

- **"N items selected" text, not chips/pills** — the count lives in `filter__value-container--is-multi` and is parsed by regex `(\d+)\s+items?\s+selected`. `merchant-location-filter.po.ts:32-34` (component note), `:209-212` (`valueContainerByLabel`), `:368-378` (`getSelectedCount`). [confirmed via code]
- **Select All present on most pages, ABSENT on New Application** — `hasSelectAll`/`selectAll` at `merchant-location-filter.po.ts:324-351`; spec asserts present on OTB (`multi-select-filters.spec.ts:485-488`, CT-10) and asserts absent on New Application (`:653-657`, CT-15). [confirmed via code]
- **Clear-all "x" indicator** — `clearAll` at `merchant-location-filter.po.ts:353-359` (via `clearIndicatorByLabel:215-217`); spec CT-11 clears then asserts count 0 (`multi-select-filters.spec.ts:527-531`). [confirmed via code]
- **Close-on-pick + reopen-before-next-pick (#1292 default UX)** — clicking an option closes the dropdown; `selectOption` reopens before each pick. `merchant-location-filter.po.ts:28-30` (component note), `:226-235` (`openDropdown`), `:259-298` (`selectOption` reopen + count poll). [confirmed via code]
- **Empty selection + Search => table shows all rows (no filter applied)** — documented at `merchant-location-filter.po.ts:37` and `:470-472`; spec CT-11 applies an empty selection and asserts no server error (`multi-select-filters.spec.ts:533-539`, OQ-04). [confirmed via code] for the contract; the literal "all rows" count assertion is not made by the spec → "needs live UI" to confirm the exact row set.
- **Open To Buy reactive-apply (NO Search button)** — OTB filters apply on dropdown close; `hasSearchButton` returns false and `applySearch` takes the reactive no-op branch. `merchant-location-filter.po.ts:121-129` and `:507-518`; OTB page self-describes the shared component at `open-to-buy.page.ts:14`. [confirmed via code]
- **Search-button pages race the backend listing response** — `applySearch` waits on a permissive endpoint regex covering all consumer pages (`getLeadsByCriteria|getMerchantList|getMerchantsByCriteria|getMerchantSetting|getSendApplicationRequests|openToBuy|rebate|getMerchantDataChangeResults|getModifiedLeads|getLeadsForFundingQueue|funding`). `merchant-location-filter.po.ts:541-544`. [confirmed via code]
- **Backend payload sends an ARRAY of merchant IDs** — spec CT-13 captures the POST and asserts the merchant-array length equals the number of picks. `multi-select-filters.spec.ts:580-639`. [confirmed via code] (the exact field name — `merchantIds`/`merchantPks`/`merchantCodes`/`merchants` — is probed, not pinned → "needs live UI" for the canonical key).
- **Filtered rows are a subset of the selected set** — spec CT-03 (Leads merchant column subset, `:260-269`), CT-04 (Merchant list returns <= N rows for N distinct merchants, `:288-292`), CT-08 (combined Merchant AND Location subset, `:349-364`). [confirmed via code]
- **Selections persist on dropdown reopen (AC3)** — spec CT-00 ticks 2 merchants, reopens, and asserts both remain checked. `multi-select-filters.spec.ts:140-149`. [confirmed via code]
- **CSV export honors the active filter** — Leads/Overview/Funding share `FilteredCsvDownloadControls` (Download CSV + Email CSV); spec CT-09 validates the export reflects the filtered rows (or records an Email-CSV observation). `multi-select-filters.spec.ts:378-472`; `funding.page.ts:6,27,564-604`; `leads.page.ts:23`, `overview.page.ts:13`. [confirmed via code]
- **R1.53 STAY-OPEN multi-select with selected-on-top ordering + type-to-narrow** — additive methods invert the #1292 close-on-pick UX: the menu stays open between picks (`isDropdownOpen:593-597`), picks accumulate without reopen (`selectOptionsKeepingOpen:739-804`), order is read via `getRenderedOptionOrder:817-825`, and the ~6885-merchant roster is narrowed by typing into the combobox (`narrowTo:629-661`). `merchant-location-filter.po.ts:569-879`. [confirmed via code] for the methods/oracles; the literal visual of selected options floating to the top and the rendered "stay open" appearance = "needs live UI".
- **Location gated on Merchant in the #1319 report pages** — Location is disabled until at least one Merchant is selected; `filterByLocations` must follow `filterByMerchants`. `merchant-location-report.helper.ts:98-104,131-137`. [confirmed via code]
- **Location is INDEPENDENT of Merchant on the Funding Queue** — explicitly not gated, unlike the report pages. `funding.page.ts:18,370-375`. [confirmed via code]
- **Funding Queue Status multi-select pre-selects "Funding" on load** — `filterByStatuses` clears the default before applying the requested set; Select All available on Status. `funding.page.ts:16-18,107-117,351-360,470-493`. [confirmed via code]
- **Funding Queue uses stable IDs + aria-expanded, NOT label-XPath** — labels are `<div>` (collide with sidebar nav text), so the form is scoped by `#statuses`/`#merchantName`/`#merchantLocation` and open/close is detected via `aria-expanded="true"`. `funding.page.ts:15-19,223-264,283-308`. [confirmed via code]
- **Overview has TWO filter blocks** — the TOP (KPIs) is a legacy single-select (`overview_filterButton__`, OUT OF SCOPE); the BOTTOM (leads-style) is the #1292 multi-select widget. `merchant-location-filter.po.ts:21-25`. [confirmed via code]
- **No cross-page filter persistence (per-page store)** — spec CT-12 navigates OTB -> Rebate and soft-asserts the inherited count is 0. `multi-select-filters.spec.ts:545-575`. [inferred] (exploratory CT with a soft assertion + escalation note → "needs live UI" to confirm definitively).

## Per-page mapping

| Page | Filter mechanism | Notes |
|------|------------------|-------|
| Open To Buy (`/openToBuy`) | #1292 widget | Reactive apply, NO Search button; Select All present (CT-10). `open-to-buy.page.ts:14` |
| Rebate (`/rebate`) | #1292 widget | Search button; PO is navigation + table reads only. `rebate.page.ts:6-9` |
| Merchant list (`/merchant`) | #1292 widget | Self-referential filter: N distinct merchants => <= N rows. `merchant-list.page.ts:11-14` |
| Leads (`/leads`, Search Result) | #1292 widget | Page-object header still lists Merchant/Location as single-select (`leads.page.ts:13-15`) — likely stale vs #1292; spec drives it as multi-select. CSV via `FilteredCsvDownloadControls` |
| Overview (bottom, leads-style) | #1292 widget | TOP KPIs filter is legacy single-select, OUT OF SCOPE. `merchant-location-filter.po.ts:21-25` |
| Merchant Setting (`/merchantSetting`) | #1292 widget | Search button; bulk-edit page also has its own `dealerRebateType` react-select (separate). `merchant-setting.page.ts:7-17` |
| New Application (`/newApplication`) | #1292 widget | **No Select All** (intentional, CT-15). CONFLICT: `new-application-filters.page.ts:7-8` doc-comment says single-select — stale vs the #1292 rollout; reconcile via live UI |
| Merchant Modification History (`/merchantModificationHistory`) | #1319 helper | Composes the #1292 widget + rdt pagination/column reads; Location gated on Merchant. `merchant-mod-history.page.ts:13-17` |
| Modification Report (`/modificationReport`) | #1319 helper | Same helper; adds Agent/Date/ModType filters (#1315). `modification-report.page.ts:16-23` |
| Funding Queue (`/funding`) | #3 custom | Bespoke filter: Status (pre-selected "Funding") + Merchant + Location (independent); stable IDs. `funding.page.ts:9-19` |

## Connections with what we already knew

This doc is the detailed authority behind the correction already captured in `docs/knowledge-base/origination-portal-map.md:109`. An earlier version of the portal map implied a **single shared filter widget** across Origination; that is **wrong**. The reality, proven by code:

- `MerchantLocationFilterPO` (#1292, `filter__` prefix, Select All) drives Open To Buy, Rebate, Merchant list, Leads/Overview-bottom, Merchant Setting, New Application.
- `MerchantLocationReportControls` (#1319) is a *separate* TS helper used only by Merchant Modification History + Modification Report (it composes the #1292 PO under the hood but adds report-grid behavior and gates Location on Merchant).
- The Funding Queue uses its **own custom filter** component (`funding.page.ts`).

Related existing docs: `multi-select-filters-mmh-modreport-funding.md` (the #1319 + Funding cluster), `origination-funding-queue-page.md`, `overview-leads-csv-export-size-limit.md`, and `merchants-config-columns-export.md`.

## Gaps / to investigate (live-UI-only items)

- **Exact rendered labels** — "Select All", "N items selected", placeholder text, the `Location*` required-marker variant on OTB (`merchant-location-filter.po.ts:108-117`) — all from code; re-confirm strings live.
- **R1.53 stay-open visual** — selected-on-top ordering and the menu visibly staying open between picks (methods exist, DOM-proven in comments at `:578-587`, but not re-verified live this session).
- **Empty + Search "all rows"** — the spec asserts no error, not the literal full row set; confirm the unfiltered grid live.
- **Backend merchant-array field name** — CT-13 probes `merchantIds`/`merchantPks`/`merchantCodes`/`merchants`; pin the canonical key from a live request/response.
- **New Application single vs multi-select** — `new-application-filters.page.ts:7-8` says single-select while the #1292 spec treats it as multi-select-without-Select-All; reconcile live which is current.
- **Leads page-object header drift** — `leads.page.ts:13-15` still documents single-select Merchant/Location; verify the live Leads filter is the #1292 multi-select widget.
- **Cross-page persistence** — CT-12 is exploratory/soft; confirm live whether selections truly reset per page (OQ-06).

**Skills loaded:** `.claude/skills/discovery/SKILL.md`

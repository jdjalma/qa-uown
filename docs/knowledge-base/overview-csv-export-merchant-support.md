# Overview Page — CSV Export & Merchant Support Filter

> Charter: Explore Origination Overview CSV Export with Playwright MCP to discover how the Merchant Support filter behaves in on-screen results vs the exported CSV
> Origin: Overview CSV Export Does Not Respect Merchant Support Filter Results · Overall confidence: **high** (root cause confirmed at request level)
> Env: QA1 (`origination-qa1.uownleasing.com`), user `test.tester` (admin), 2026-06-17

## Purpose

The Overview page (`/overview`) in the Origination portal is the agent-facing landing pipeline. It shows KPI cards (Applications, Approval Rate, Avg Approval Amt, etc.) and a paginated leads table, with a filter panel and CSV export (Download CSV / Email CSV). Internal users use it to monitor and export the application pipeline.

## Page Architecture — TWO independent filter mechanisms `[confirmed]`

The Overview has **two separate filter forms** rendered in the DOM (this is critical):

| # | Filter form | Drives | Endpoints fired on its "Search" |
|---|---|---|---|
| 1 | **Top bar** (near KPI cards): From/To, Merchant, Location, Client Type | The **KPI metric cards** | `getApplicationCountDetails`, `getApprovalRateDetails`, `getAvgApprovalDetails`, `getOpenApprovalAmt`, `getFundedAmtDetails`, `getSignedLeaseApprovals`, `getExpiringAppDetails`, `getConversionRate` (all as query params `?from&to&merchant&location&clientType`) |
| 2 | **Inline table panel** (above the table): From/To, **Status**, Merchant, **Merchant Support**, Location, Client Type, Search | The **leads table** + **CSV export** | `POST /uown/getLeadsInDateRange` |

> Both forms have their own "Filters" toggle button and their own "Search" button. The bug lives entirely in mechanism #2.

## The Merchant Support filter `[confirmed]`

- DOM: `<input type="text" name="merchantSupport" id="merchantSupport" placeholder="Merchant Support">` — a **free-text input**, NOT a react-select dropdown (Status, Merchant, Location, Client Type are react-selects).
- It IS a **server-side** filter on the table listing: typing a value and clicking the table Search sends `"merchantSupport": "<value>"` inside the `getLeadsInDateRange` POST body, and the server returns only matching leads.
- "Merchant Support" = the internal support owner assigned to a merchant (also column #21 in Merchants Config Columns — see [[merchants-config-columns-export]]). It is a merchant-level attribute, so all leads of one merchant share the same Merchant Support value.

## CSV Export Flow `[confirmed]`

- **Same endpoint** as the table listing: `POST /uown/getLeadsInDateRange` (there is NO dedicated export endpoint; no `forCSV` flag).
- Download CSV builds the criteria payload, sets `maxResults = totalRows = <current filtered count>` (read from the last listing response) to fetch all matching rows in one page, then generates the file **client-side**.
- Downloaded file name: **`all-filtered-leads.csv`**.
- CSV columns = the 27 visible Overview table columns: `Reference #, Merchant, Location, Merchant Code, First Name, Last Name, Status, Internal Status, Sales Person, Sales Rep Code, Merchant Support, State, Term Month, Phone Number, Email Address, Approval Amt, Final Approval Amount, Application Date, Expiration Date, Delivery Date, Invoice #, Signed Lease, Funded Amount, Lease Amount, Lambda Score, UUID, Created from`.
- "Email CSV" not tested — likely the same payload builder. `[assumed]`

## Root Cause `[confirmed]`

Captured request bodies (QA1, same filter state across listing vs export):

**Listing (table Search), Status=Approved + Merchant Support=TESTMS123 — req #52:**
```json
{"from":"2026-06-17","to":"2026-06-17","pageNumber":0,"rowsPerPage":10,"totalRows":0,
 "maxResults":10,"status":"UW_APPROVED","merchants":[],"locations":[],"search":"",
 "clientTypes":[],"internalStatus":null,"merchantSupport":"TESTMS123"}
```
**Export (Download CSV), same filters — req #53:**
```json
{"from":"2026-06-17","to":"2026-06-17","pageNumber":0,"maxResults":0,"rowsPerPage":10,
 "totalRows":0,"status":"UW_APPROVED","merchants":[],"locations":[],"search":"",
 "clientTypes":[],"internalStatus":null}
```

**The export payload OMITS the `merchantSupport` field.** Every other filter (`status`, `merchants`, `locations`, `search`, `clientTypes`, `internalStatus`, `from`, `to`) IS present in the export payload — only `merchantSupport` is dropped.

This is exactly **hypothesis (2) in the ticket**: the export applies only the result count while retrieving from a source not filtered by Merchant Support.

### Why "count matches but content differs"

The export combines two behaviors:
1. **Drops `merchantSupport`** from the criteria (proven above).
2. **Caps results at the filtered count**: `maxResults = totalRows = <count from the last MS-filtered listing>` (confirmed: req #54 listing returned 4 → req #55 export sent `maxResults:4, totalRows:4`).

So in the bug scenario:
1. Filter Merchant Support = "Jessica" → listing returns N rows (server filters by MS). `totalCount = N`.
2. Download CSV → export sends `maxResults = N` but **no** `merchantSupport`.
3. Server returns the first N rows of the dataset filtered by everything EXCEPT Merchant Support → N rows of mixed Merchant Supports.
4. CSV: **N rows (count matches the portal)** but **content includes multiple Merchant Supports** (✗).

## Control / Regression observations `[confirmed]`

- **Status filter IS respected in export**: baseline export with Status=Approved (no MS) → CSV had exactly 4 rows, all `UW_APPROVED` (refs 12296–12299). Confirms the export honors every filter except Merchant Support, and that export works normally otherwise (relevant to AC-06 regression).
- Export endpoint, columns, and file name behave normally; the defect is isolated to the missing `merchantSupport` criterion.

## Business Rules

- **BR-01**: Overview leads table listing (`getLeadsInDateRange`) filters by `merchantSupport` **server-side** when the field is non-empty. `[confirmed]`
- **BR-02**: CSV export reuses `getLeadsInDateRange` and must send the SAME criteria as the on-screen listing; currently it omits `merchantSupport`. `[confirmed — defect]`
- **BR-03**: Export fetches all rows via `maxResults = totalRows = filtered count` (single page), generated client-side. `[confirmed]`
- **BR-04**: The KPI cards (top filter bar) are a separate concern from the table/export and do NOT use a Merchant Support filter. `[confirmed]`

## Connections with What Was Already Known

- **Confirms** the Merchants-page export pattern ([[merchants-config-columns-export]]): export reuses the listing endpoint and pulls all rows in one page; CSV is built client-side. Difference: Overview uses `maxResults=totalRows` instead of `forCSV:true`.
- **New finding**: Overview has two separate filter forms (KPI vs table) — only the table form has Merchant Support, Status, and Search-table.
- **New finding**: `getLeadsInDateRange` is the Overview listing+export endpoint (the page object `overview.page.ts` currently has no Merchant Support filter method nor a CSV method).

## Gaps / To Investigate

- **G1 (blocker — test data)**: Could NOT visually reproduce "multiple Merchant Supports in one CSV" in QA1 with `test.tester`: that account sees only **Daniel's Jewelers** leads (single merchant) and their **Merchant Support column is empty**. Need an account/env with leads across merchants that have DIFFERENT assigned Merchant Support owners. Root cause was instead proven at the request-payload level (stronger than the visual repro).
- **G2 (open)**: "Email CSV" not tested — verify it shares the same (buggy) payload builder. `[assumed yes]`
- **G3 (open)**: Other multi-select filters (Merchant, Location, Client Type) with non-empty values not exercised in export beyond Status; payload structurally carries them (arrays present), but a combined-filter export should be verified for AC-05.
- **G4 (resolved)**: Merchant Support is server-side (not client-side display filtering) — confirmed via req #50 returning `totalCount:0` for a non-matching value.

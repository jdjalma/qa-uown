---
title: Merchants Page — Config Columns & Export
domain: knowledge-base
status: snapshot
volatility: volatile
last_verified: 2026-06-15
sources:
  - env: qa1
  - gitlab: task-1309
  - db: uown_merchant
covers: [merchants, config-columns, csv-export, gds-fields]
promoted_to: []
---

# Merchants Page — Config Columns & Export

> Charter: Explore Merchants page (`/merchant`) with Playwright MCP to discover Config Columns structure, export flow, and Active filter behavior
> Origin: Task #1309 — Add GDS Data Fields on Config Columns on Merchant Page · Overall confidence: **high**

## Purpose

The Merchants page (`/merchant`) in the Origination portal lists all merchants (1 128 in QA1 as of 2026-06-15). Merchant Support and Operations admins use it to:
- Browse, search, and filter merchants (by name, location, category, active status, support owner, sales rep code)
- Customize which columns are visible/exportable via Config Columns
- Export the merchant list to CSV ("Download CSV" or "Email CSV")

## Available Operations

| Operation | Available? | Notes |
|---|---|---|
| View | ✅ | Table with pagination (10–100 rows/page) |
| Search | ✅ | Filters panel (Merchant, Location, Category, Support, Active, text search, Sales Rep Code) + Search button |
| Add | ✅ | "ADD NEW COMPANY" button (not investigated) |
| Delete | ✅ | Delete icon per row (trash icon) |
| Edit | ✅ | Click Merchant Code link → goes to edit page |
| Export (Download) | ✅ | "Download CSV" button |
| Export (Email) | ✅ | "Email CSV" button |
| Configure columns | ✅ | "Config Columns" dropdown |

## Config Columns Panel — DOM Structure

### Trigger
- Element: `<a>` (role=`link`) with text `Config Columns` and `href="#"`
- Playwright selector: `a:has-text('Config Columns')` or `getByRole('link', { name: 'Config Columns' })`
- When open: link has `[aria-expanded="true"]` and the parent container gains class `show`

### Panel Container
- Bootstrap dropdown div: `<div class="d-block h-100 dropdown show">`
- Contains heading `"Configure the view"` inside an `<h6>` element
- **NO Apply/Save button** — checking/unchecking is **immediate** (table updates instantly)
- Has a Search textbox to filter column names within the panel
- Has a "Select All" checkbox (id/name = `selectAll`)

### Checkbox Structure (critical for selectors)
Each column is a native `<input type="checkbox">` with:
- `id` = column name (e.g., `"UW Pipeline"`)
- `name` = column name (same)
- `value="true"` when checked, `value=""` when unchecked

**Confirmed selector pattern**: `input[name="Column Name"]` or `input[id="Column Name"]`

The existing `configColumnsCheckbox(name)` selector in `common.selectors.ts` uses:
```
`label:has-text(${JSON.stringify(name)}) input[type='checkbox'], input[type='checkbox'][name=${JSON.stringify(name)}]`
```
The second alternative `input[type='checkbox'][name=...]` **works correctly** for the Merchants page. `[confirmed]`

### Default Checked Columns (21)
| # | Column |
|---|---|
| 1 | Delete |
| 2 | Merchant Code |
| 3 | Sales Rep Code |
| 4 | Active |
| 5 | Merchant Name |
| 6 | Location Name |
| 7 | Legal Name |
| 8 | City |
| 9 | State |
| 10 | Zip Code |
| 11 | Contact Name |
| 12 | Email |
| 13 | Peak Campaign ID |
| 14 | Off Peak Campaign ID |
| 15 | Dealer Discount Override |
| 16 | Dealer Rebate Override |
| 17 | Allowed Frequency |
| 18 | Merchant Type |
| 19 | Bank Account Number |
| 20 | Bank Routing Number |
| 21 | Merchant Support |

### Additional Available Columns (unchecked by default) — partial list
Merchant PK, Cloned From, Cloned From Name, Ref Company ID, Ref Location ID, Location Address1, Location Address2, Merchant URL, Post Message, Category, Independent Rep Code, Username, API Key, Client Type, Inventory Category, Primary Contact Phone, Alt Contact Name, Alt Contact Phone, Alt Contact Email, Ownership Type, Owner Name, Number of Days Approval Exp, Number of Days Lease Doc Exp, Tax Zone, Tax Rate, Delivery Receipt ID, Priority, Approval Amount Increase, CC Processing Fee Percent, Latitude, Longitude, Scoring Company Group, Fed Tax ID, DTE Dealer App Rcvd, DTE Dealer Kit Ship, DTE Setup In CRM, DTE Corp Training, Buy Group, Buy Group Name, Buy Group Member, Store Timings, Allow Auto Decision, Do Not Allow New Apps, Use Customer State For Lease And Sales Tax, Allow Location Change For Merchant Site User, Show Report Menu Item On Merchant Site, Show Payroll And Prepaid Card On Application, Allow Remote Sign, Exclude From Reports, Show Weekly Status Report, Hidden, Esign Mode, **Platform Fee**, Buyout Fee, **Platform Fee Type**, Dealer Rebate Type, Valid States, Default Loan Amount, Minimum Lease Amount, Default Months At Employer, Is Redirect URL Branded, Charge Processing Fee Before E-Sign, Charge Processing Fee, Hold Deposit, Is Intellicheck Required, Is Seon Id Required, Remove Parent Or Top On Iframe, Allow Close On Iframe, Comment, Allow Change To Expired, Check UW For Verification, Esign Client, Is CC Required, Is ACH Required, Is FPD Required, Is Signed To Funding, Run Address Verification, Is Fraud Check Required, Verify Email, Verify Phone, Verify IP, Use Webhook, Send Finalize Notice, Verify Phone Before Signing, Is Bank Verification Required, Accept New Apps, Tax Exempted States, Lending Category List, Send Automated Funding Report, Funding Report Frequency, Funding Report Emails, Webhook URL, Is Item Split, Use Sentilink, Use Neustar, Record Signing Flow, Return Lambda Score, Is Deleted, Remove Merchant From Users

**Total columns available**: ~121 (1 "Select All" + ~120 data columns) `[confirmed]`

> Note: **Platform Fee** and **Platform Fee Type** are already in the list (task #1316, added in 1.53.0).
> **UW Pipeline, Fraud Threshold, Max Approval Amount are NOT yet present** — task #1309 not deployed in QA1 as of 2026-06-15. `[confirmed]`

## Active Filter

- **Type**: react-select (single-select), container id = `isActive`
- **Selector**: `#isActive .filter__control`
- **Options**: `"Active"` and `"Inactive"` (only 2 options, no "All" / blank state)
- **Default**: `"Active"` — page loads with Active merchants pre-selected `[confirmed]`
- **Clear**: The X icon on the current selection removes the filter (shows all merchants regardless of active state)

## Export Flow

### Download CSV
- Button text: "Download CSV"
- API call: `POST /uown/getMerchantsByCriteria` with body:
  ```json
  {
    "page_number": null,
    "max_results": null,
    "totalRows": <current total>,
    "search": "",
    "forCSV": true,
    "inventory_categories": [],
    "isActive": true,
    "salesRepCode": "",
    "locationNames": [],
    "merchantNames": []
  }
  ```
- `isActive` reflects the current filter: `true` (Active), `false` (Inactive), or `null` (no filter)
- `forCSV: true` tells the backend to return ALL matching rows (no pagination)
- CSV is generated **client-side** from the API response using the currently checked Config Columns
- File name: `merchant-report.csv`
- CSV columns = **exactly the checked Config Columns** at download time `[confirmed]`

### Email CSV
- Button text: "Email CSV"  
- Sends the CSV to the authenticated user's email (not tested in detail)
- Likely same API call parameters with an email flag `[inferred]`

### CSV Column Ordering
CSV column order matches the order of columns in Config Columns (top-to-bottom). Default CSV header:
```
"Merchant Code","Sales Rep Code","Active","Merchant Name","Location Name","Legal Name","City","State","Zip Code","Contact Name","Email","Peak Campaign ID","Off Peak Campaign ID","Dealer Discount Override","Dealer Rebate Override","Allowed Frequency","Merchant Type","Bank Account Number","Bank Routing Number","Merchant Support"
```
(Note: "Delete" column is checked but not included in CSV — it's a UI-only action column.) `[confirmed]`

## Business Rules

- **BR-01**: Config Columns selection is immediate (no Apply/Save) and persists in the current session `[confirmed]`
- **BR-02**: CSV generation is client-side, columns = checked Config Columns at click time `[confirmed]`
- **BR-03**: Active filter defaults to "Active" — `isActive: true` sent on page load and on CSV export `[confirmed]`
- **BR-04**: The `isActive` parameter in the export API matches the current filter state `[confirmed]`
- **BR-05** (Task #1309 — **confirmed deployed in sandbox 2026-06-28**): UW Pipeline, Fraud Threshold, Max Approval Amount are now **default checked columns** in the sandbox Merchants list table. Behavior for export (auto-checked for Active merchants) is `[inferred]` — not re-tested this pass. `[confirmed via sandbox observation 2026-06-28]`
- **BR-06**: Filters panel has a "Search" button — filter is not applied on change, must click Search `[confirmed]`

## Connections with What Was Already Known

- **Confirms**: Config Columns pattern from Overview page (`overview.page.ts`) uses same selector approach — `input[name="Column Name"]` works
- **Confirms**: `MerchantListPage` at `/merchant` (from codebase) is the correct page for this feature
- **New finding**: Config Columns panel is a Bootstrap dropdown (`div.dropdown.show`), not a dialog/modal/aside — the existing `configColumnsPanel` selector (`[role='dialog']:has-text('Configure the view')`) won't match; use `div.dropdown.show:has-text('Configure the view')` or wait for checkbox visibility
- **New finding**: Active filter has exactly 2 options (Active / Inactive) — no "All" state via react-select; clear the selection (X button) to show all
- **New finding**: "Delete" column is checked in Config Columns but NOT exported to CSV — it's a UI action column only

## Gaps / To Investigate

- **G1 (resolved)**: "Active merchants export flow" = Active filter pre-selected (default) + click "Download CSV" or "Email CSV" — no dedicated Export Active button exists
- **G2 (open)**: What does null/empty GDS Data render as in the table cell and CSV cell — empty string, dash, zero? Cannot test until #1309 is deployed
- **G3 (resolved)**: Auto-default for AC-03 is triggered by `isActive: true` being the active filter state — the three GDS fields should be auto-checked/included when that filter is on
- **G4 (resolved)**: No column duplication possible — Config Columns checkboxes are unique; if already manually selected, auto-default is a no-op
- **G5 (resolved)**: Default columns list is now fully documented above (21 checked, ~100 unchecked)
- **G-new**: Does "Email CSV" share the same column selection logic as "Download CSV"? `[assumed yes, not tested]`
- **G-new**: Config Columns state — is it persisted across page refreshes (localStorage / cookie) or reset on reload? `[not tested]`

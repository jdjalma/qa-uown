---
title: Overview & Leads — CSV Export Size-Limit Guard (#1321)
domain: knowledge-base
status: snapshot
volatility: stable
last_verified: 2026-06-18
sources:
  - env: qa2
covers: [csv-export-size-limit, filtered-csv-download, email-csv, overview-leads-export, err-string-too-long]
promoted_to: []
---

# Overview & Leads — CSV Export Size-Limit Guard (#1321)

> Charter: Explore Origination Overview (`/overview`) and Leads (`/leads`) CSV export with Playwright MCP to discover the #1321 size-limit guard — exact threshold/unit, the disabled-button + Email CSV messages, whether the guard is size- or row-count-based, and the Leads export file/columns.
> Origin: Bug #1321 — pods restart on large Overview CSV export (`ERR_STRING_TOO_LONG`); mitigation MR !1481 merged into R1.53.0. · Overall confidence: **high** (threshold + messages decoded from the deployed bundle; live component props read from React fiber)
> Env: QA2 (`origination-qa2.uownleasing.com`), user `test.tester` (admin), buildId `2026-06-17T13:32:43` (post-fix), 2026-06-18.
> Related: [[overview-csv-export-merchant-support]] (same `getLeadsInDateRange` export flow, 27 Overview columns, `all-filtered-leads.csv`) · [[merchants-config-columns-export]]

## Purpose

Prevents the Origination pod crash (#1321): the Download CSV path fetches **all** filtered rows in a single page (`maxResults = totalRows`) and the BFF proxy overflows `Buffer.toString()` (V8 ~512 MiB string cap) on very large payloads. The fix adds a **client-side size guard**: before allowing a direct download it **estimates the CSV byte size** and, above a limit, **disables Download CSV** and routes the user to **Email CSV** (async). Shared by both the Overview and Leads screens via one reusable component (`FilteredCsvDownload`) and one util (`csv-response-size`).

## Available Operations

| Operation | Available? | Notes |
|---|---|---|
| Download CSV (direct) | ✅ when within size limit | Rendered only with `hasDownloadPermission && headers.length > 0`. Disabled when table empty **or** estimated size > limit. Builds file client-side. |
| Email CSV (async) | ✅ always rendered | Disabled **only** when the table is empty. NOT gated by download permission or by the size limit — it is the escape hatch for large datasets. Opens an email-address modal. |

## Threshold — value, unit, and algorithm `[confirmed — decoded from deployed bundle]`

*Evidence: `overview-aa907e431cab8468.js` and `leads-1747f5f66fc4bb6e.js` (QA2, buildId 2026-06-17). Constants `r=50331648, o=48, i="This export is too large…"`.*

- **Limit = `50331648` bytes = 48 × 1024 × 1024 = 48 MiB.** Displayed to the user as **"48 MB"** (`o=48`).
- **Estimated size (bytes):**
  - `totalRows <= 0` → `0`.
  - No sample rows loaded → fallback **`2048 × totalRows`** (assume 2 KB/row).
  - Otherwise → **`ceil( avgBytesPerSampleRow × totalRows )`**, where `avgBytesPerSampleRow = TextEncoder.encode(JSON.stringify(wrap(sampleRows, totalRows))).length / sampleRows.length`. The **sample = the currently loaded table page** (default 10 rows). `wrap` = Overview `{leads, totalCount}` / Leads `{searchResults, count}`.
- **Comparison: `estimatedBytes <= 50331648` → within limit → Download CSV ENABLED.** `>` → DISABLED. The boundary is **inclusive** of 48 MiB (exactly 48 MiB ⇒ still enabled).
- **MB shown** = `(estimatedBytes / 1048576).toFixed(1)` (1 decimal).

### Empirical scale `[confirmed]`

*Evidence: replicated the estimator on the live Overview sample (10 rows, 27 cols) via React-fiber `tableData`.*

- Overview rows ≈ **762 bytes/row** → it takes **≈ 66,000 leads** in one filtered set to exceed 48 MiB. At today's 44 leads the estimate is ~0.03 MB.
- ⇒ The **disabled state is not reproducible with QA2's current data volume** (44 leads today). Confirmed at source level instead, which is the primary truth for this frontend behaviour. Leads rows (17 cols) are narrower, so their row-count threshold differs.

## Messages (exact copy) `[confirmed]`

- **Disabled Download CSV tooltip** (`downloadDisabledTooltip`, rendered only in the size-exceeded case): 
  `"This export is too large to download directly. Please use Email CSV instead. Estimated size: {X.X} MB (limit: 48 MB)."`
- **Runtime guard:** if a download is somehow triggered while blocked, `onDownload` re-checks and shows the **same text as an error toast**, returning `false` (no file). *Evidence: `showToast("error", …)` path in the page's download handler.*
- **Email CSV modal** (`[confirmed]` — opened live): title **"Which email should we send this CSV file to?"**, an **Email** textbox (placeholder `Enter your email...`), **CANCEL** and **Send** buttons; **Send is disabled until an email is entered**.
- **Email CSV success toast:** **"You should receive an email shortly."** `[confirmed — sandbox 2026-06-28, MCP Playwright, /leads page]`

## Size-based vs row-count `[confirmed]`

The guard is **size-based, not pure row count.** It samples the actually-loaded rows, computes **average UTF-8 bytes per row**, and multiplies by `totalRows`. Therefore:
- Column count **and** field content width both affect the estimate. Two filtered sets with the **same `totalRows`** but wider rows (longer emails/names/UUIDs) produce **different estimates** and can differ on whether Download CSV is blocked.
- Overview (27 columns) and Leads (17 columns) have different per-row sizes ⇒ different row-count thresholds for the same 48 MiB cap.
- The estimate depends on the **current page sample**; if no rows are loaded it falls back to 2 KB/row.

## Overview vs Leads — export differences `[confirmed]`

*Evidence: React-fiber props of `FilteredCsvDownload` on each page; shared util confirmed present in both bundles.*

| | Overview (`/overview`) | Leads (`/leads`) |
|---|---|---|
| Download filename | `all-filtered-leads.csv` | `leads-results.csv` |
| Columns | 27 (see [[overview-csv-export-merchant-support]]) | **17**: Lead Number, Account Number, Lead Status, Internal Status, State, Term Month, Customer Name, Invoice Number, SSN, Phone Number, Email, Merchant, Location, Ref Merchant Code, Client Type, Created at, Created from. **NOTE — OBS-01:** the 17th column "Created from" (`createdFrom`) exports with a **BLANK header label** in `leads-results.csv` (its react-csv header entry has no `label`). Pre-existing, product-side `[OBSERVATION]` — flagged for a separate ticket. See [[application-lifecycle]] OBS-01-1321. |
| `tooltipIdPrefix` | `overview-csv-download` | `leads-csv-download` |
| Estimator wrap variant | `{leads, totalCount}` | `{searchResults, count}` |
| Size limit / message | 48 MiB / same text | **48 MiB / same text** (shared `csv-response-size` util, confirmed in `leads-…js`) |

## Component behaviour `[confirmed — live React props]`

`FilteredCsvDownload` (from MR !1481), props read live on Overview (`isCsvDownloadDisabled=false`, within limit):
- **Email CSV** button: `isDisabled = isTableEmpty`. Always rendered; **not** gated by `hasDownloadPermission` or by the size limit.
- **Download CSV** button: rendered only when `hasDownloadPermission && headers.length > 0`; `isDisabled = (isTableEmpty || isCsvDownloadDisabled)`.
- The directing **tooltip renders only when `isCsvDownloadDisabled` is true** (size case). When the table is empty (but within size), the button is disabled with **no** directing tooltip (`downloadDisabledTooltip` undefined).
- Disabled style: `.filtered-csv-download_disabledButton__…{ background:#5a6268 !important; cursor:not-allowed !important }`.
- Confirmed live values: `hasDownloadPermission:true`, `headers:27`, `filename:"all-filtered-leads.csv"`, `csvData: Array(0)` (lazy — built only on download click), `tableData: Array(10)` (the sample).

## Automation traps `[confirmed — MCP + CT-01..CT-07 runtime, QA2 2026-06-18]`

Discovered + root-caused during #1321 test implementation; recorded as [[application-lifecycle]] pitfalls #115–#118 and in [[selector-hardening]].

- **Two filter forms on Overview (pitfall #115).** Overview renders TWO independent forms, both with MM/DD/YYYY date inputs: the **top-bar KPI form** (`#from`/`#to`, toggle class `overview_filterButton__`, drives the metric cards) and the **table panel** (`#fromDate`/`#toDate`, toggle class `index-module_filterButton__`, drives the table + CSV). A positional `nth()` selector hits the KPI form. Target the table-panel inputs **by id**.
- **`#fromDate` resets to today (pitfall #116).** The table-panel `#fromDate` re-initialises to today (Formik default), so a **future-only date window is NOT a reliable empty-set lever**. Use the table-panel "Search table" free-text (`overviewTableSearch`) with a non-matching value to drive the table empty.
- **Table-filter panel re-collapses after toggle (pitfall #117).** `verifyDashboardLoaded` resolves (Promise.race) when the Filters button appears, BEFORE the table finishes loading on QA2; a late re-render re-collapses the width-collapse-animated panel. Expanding it needs a **retry loop** (`expandTableFilters`), not a single click.
- **Email CSV vs Download CSV share a class (pitfall #118).** Both buttons share `filtered-csv-download_csvButton` and **Email CSV is first in the DOM**; a bare class selector + `.first()` resolves to Email CSV → a "download" click opens the email modal. Disambiguate the Download button by `:has-text('Download CSV')`.

### Sandbox high-volume repro + three more traps `[confirmed — CT-08 PASS, sandbox 2026-06-18/19, 79,605 rows]`

Discovered + root-caused during CT-08 (the visual disabled-state repro that QA2/G1 could not reach). Recorded as [[application-lifecycle]] pitfall #123.

- **Visual disabled-state IS reproducible on sandbox** with account `jmendes.gow` and the **table-panel** date range **01/01/2022 → 12/31/2026**, which returns **79,605 Overview leads** in one filtered set. Estimate **55.4 MB > 48 MB limit** → **Download CSV DISABLED**, **Email CSV enabled**, tooltip shows the exact `"This export is too large to download directly. Please use Email CSV instead. Estimated size: 55.4 MB (limit: 48 MB)."`. This closes gap **G1** (now confirmed in the live UI, not only at source level). NOTE: the earlier KB note that "sandbox 01/01/2022→12/31/2026 returns only 36 rows" was on a different/sparse account; `jmendes.gow` carries the high-volume dataset.
- **`fill()` does NOT update the table-panel date inputs — use `setFormikDate()`.** `#fromDate`/`#toDate` are `type="search"` inputs controlled by Formik. `fill()` writes the DOM value but does NOT fire Formik's `onChange`, so the submitted query keeps the previous range. Fix (in `overview.page.ts`): private `setFormikDate(selector, value)` reaches `element.__reactProps.onChange` via `page.evaluate` and invokes the React-fiber handler directly, with a `setTimeout(150ms)` BETWEEN fromDate and toDate (the fromDate re-render recreates the toDate node, invalidating the reference). Same root cause as the Servicing DatePicker (`application-wizard.page.ts`) trap.
- **Large datasets fool `submitFilters()`'s row-visible wait.** With 79k rows the spinner `<tr>` counts as a visible row before data arrives. The CT-08 spec waits with `page.waitForFunction` for real pagination (`parseInt(match[3]) > 1000`, 120s timeout) before asserting button state.
- **The disabled tooltip is a Bootstrap portal, not span-internal text.** It is NOT text inside `<span id="overview-csv-download-...">`; it renders OUTSIDE the span wrapper as `<div role="tooltip" class="tooltip show bs-tooltip-auto">`. The `FilteredCsvDownloadControls.getDownloadDisabledTooltip` method + selector `csvDownloadTooltipPortal: "div[role='tooltip'].tooltip.show, div.tooltip.show"` read the portal. DOM confirmed sandbox 2026-06-18.

## Business Rules

- **BR-01**: Direct Download CSV is allowed only when the **estimated CSV size ≤ 48 MiB**; above it the button is disabled. `[confirmed]`
- **BR-02**: The size estimate = **avg bytes of the loaded sample row × totalRows** (fallback 2 KB/row) — size-based, sensitive to column/content width. `[confirmed]`
- **BR-03**: When Download CSV is blocked by size, the user is directed to **Email CSV** via tooltip and (on attempted click) an error toast. `[confirmed]`
- **BR-04**: Email CSV is independent of the size guard and of download permission; disabled only on an empty table. `[confirmed]`
- **BR-05**: Both Overview and Leads use the **same 48 MiB limit and message**; they differ only in filename, columns, and the estimator wrap variant. `[confirmed]`

## Connections with What Was Already Known

- **Confirms** [[overview-csv-export-merchant-support]]: Overview export = `all-filtered-leads.csv`, 27 columns, single-page `maxResults=totalRows`. Adds the new pre-download size guard on top of that flow.
- **New**: the Leads page (`/leads`) export = `leads-results.csv`, 17 columns (incl. SSN), `searchResults/count` shape.

## Download-CSV permission gate — AMS role mapping `[confirmed — dom-snapshot:sandbox 2026-06-18]`

*Resolves CT-09 / former gap "which permission controls Download CSV". Evidence: AMS `ams-website-sandbox` → Roles ("Manage Roles & Permissions", left-nav "Roles") → tab **Origination**; clicking a role row populates the right-hand "Edit Role Permissions" panel with that role's GRANTED permissions as tag chips (`index-module_tagContainer__`). The panel lists ONLY granted permissions, not a full checklist — so "permission absent from the chips ⇒ role lacks it".*

- The `FilteredCsvDownload` `hasDownloadPermission` prop (Download CSV renders only when `hasDownloadPermission && headers>0`) is driven by these AMS permissions, **Origination** tab:
  - **Overview Download CSV** ← permission **`overview download csv`**
  - **Leads Download CSV** ← permission **`leads download csv`**
- ⚠️ A DIFFERENT permission **`overview csv [modify]`** exists and is **NOT** the download gate — it governs the filter/column config, not the Download CSV button. Do not confuse the two.
- **Role → has download perm (Origination tab):**

  | Role | `overview download csv` | `leads download csv` | Notes |
  |---|---|---|---|
  | admin | ✅ | ✅ | all 22 CSV perms granted |
  | manager | ✅ | ✅ | all 22 CSV perms granted |
  | agent | ❌ | ❌ | only `overview csv [modify]`, `funding csv [modify]` |
  | isr | ❌ | ❌ | only `overview csv [modify]` |
  | auditor | ❌ | ❌ | only `overview csv [modify]`, `funding csv [modify]` |

- ⇒ A user whose **only** Origination role is `agent` / `isr` / `auditor` will NOT see the Download CSV button (Email CSV still renders — it is not permission-gated). On sandbox, `evedovatto.gow_clone` (Manage Users, single role `agent`) is such an account, but its password is unknown.
- **CT-09 execution recipe (fresh-data, rule #9):** AMS → Users → **Add User** (set a known password) → Users → `<user>` → **Change User Role** → tab Origination → assign ONLY `agent` (or `isr`) → log into Origination as that user → assert Download CSV absent, Email CSV present. Provisioning is an AMS write/side-effect and needs an AMS user/role page-object that does not yet exist.

### Sandbox login note `[confirmed — test-execution:sandbox 2026-06-18]`

On **sandbox**, the framework's `admin` role resolves to `DEFAULT_ADMIN_USERNAME=manager` / `DEFAULT_ADMIN_PASSWORD=admin`, but **password `admin` returns HTTP 401**. The working sandbox login is `manager` / **`P@ssw0rdu0wn`** (the `DEFAULT_MANAGER`/`SANDBOX_MERCHANT` password). Both Origination and AMS accept it. (There is no `SANDBOX_ADMIN_*` override in `.env`.)

## Gaps / To Investigate

- ~~**G1**: Disabled-state could **not be visually reproduced** on QA2 or sandbox.~~ **RESOLVED (CT-08 PASS, sandbox 2026-06-18/19).** Reproduced visually with account `jmendes.gow` + table-panel range 01/01/2022→12/31/2026 (**79,605 rows**, est. 55.4 MB > 48 MB): Download CSV disabled, exact tooltip rendered, Email CSV enabled. See "Sandbox high-volume repro" section above.
- ~~**G2**: **Email CSV success toast** text not captured (separate chunk; observing it sends a real email — side effect avoided).~~ **RESOLVED (2026-06-28, sandbox):** Toast text = **"You should receive an email shortly."** Confirmed live via MCP Playwright after clicking Send with `fintechgroup777@gmail.com` on `/leads` (3 results in table). Modal closed and toast appeared immediately.
- **G3**: Not verified which estimator variant the Leads page invokes at runtime (`searchResults/count` inferred from its listing shape); both variants are bundled. Threshold/message are identical regardless.
- **G4 (CT-09)**: No ready-to-use no-download-permission account with a **known password** exists on QA2/sandbox. The permission name + role mapping are now confirmed (above); execution still needs a provisioned account (recipe above) and an AMS user/role page-object.

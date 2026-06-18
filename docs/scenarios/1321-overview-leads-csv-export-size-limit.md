# Test Scenarios — #1321 Pod restart on large Overview CSV export (ERR_STRING_TOO_LONG)

> Origin: Bug #1321 (Origination · Overview/Leads · CSV Export) · Type: **BUG fix verification** (mitigation) · MR !1481 merged into R1.53.0
> Knowledge base: [[overview-leads-csv-export-size-limit]] (parameters confirmed on QA2) · [[overview-csv-export-merchant-support]] · [[merchants-config-columns-export]] · Env to validate: QA2 (`origination-qa2.uownleasing.com`)
> Portal: Origination → Overview (`/overview`) and Leads (`/leads`) · Interface: **UI-first** (button state + tooltip + open the downloaded file)
>
> **Confirmed parameters (QA2 discovery 2026-06-18, deployed source):** limit = **48 MiB** (`50331648` bytes; shown as "48 MB"); boundary **inclusive** (`estimate ≤ limit` ⇒ enabled). Estimate = `avg bytes of the loaded sample row × totalRows` (size-based, not pure row count; fallback 2 KB/row). Disabled tooltip = **"This export is too large to download directly. Please use Email CSV instead. Estimated size: X.X MB (limit: 48 MB)."** (also shown as an error toast if clicked while blocked). Email CSV modal = **"Which email should we send this CSV file to?"** (Email field; Send disabled until filled). Filenames/columns: **Overview** `all-filtered-leads.csv` / 27 cols; **Leads** `leads-results.csv` / 17 cols.

## Demand summary

Downloading CSV from the Overview screen with a large filtered result set crashed the Origination pod (`ERR_STRING_TOO_LONG`): the BFF proxy buffers the full `POST /uown/getLeadsInDateRange` response and calls `Buffer.concat(...).toString()`, which exceeds the V8 max string length (~512 MiB) because Download CSV fetches all rows in a single page (`maxResults = totalRows`). The mitigation **disables the Download CSV button when the estimated export size of the filtered result set exceeds a defined limit**, leaving **Email CSV** (async) as the export path for large datasets, with a message directing the user there. The same reusable component now drives **both Overview and Leads**.

## Impact analysis (business rules)

**Root cause (from ticket + KB):** Download CSV reuses the listing endpoint `POST /uown/getLeadsInDateRange` with `maxResults = totalRows = <filtered count>` to pull every row in one page, then builds the file client-side (`all-filtered-leads.csv`, 27 Overview columns) — source [[overview-csv-export-merchant-support]] §"CSV Export Flow". A very large single-page payload overflows the proxy's `toString()`. The fix is a **client-side guard**: estimate the CSV response size and disable Download CSV above a threshold, so the heavy request is never issued.

| Area touched | Behaviour after fix | Risk |
|---|---|---|
| Download CSV button (Overview + Leads) | Disabled when estimated export size exceeds the limit; the large request is never sent (no crash) | **High** — availability/stability: the bug took down the pod for everyone on it |
| Threshold computation (`utils/csv-response-size.ts`) | Decision based on **estimated CSV response size**, not raw row count | Medium — wrong estimate either still crashes (too high) or blocks valid small exports (too low) |
| Email CSV | Stays available (async, small client response) as the escape hatch for large datasets; only disabled when the table is empty | Medium — it is the only export path left for large sets; must work |
| Disabled-state messaging (tooltip) | Tells the user to use Email CSV for large exports | Medium — discoverability; otherwise users think export is broken |
| Permission / headers gate | Download CSV only renders with `hasDownloadPermission` and `headers.length > 0`; Email CSV renders regardless of download permission | Medium — must not regress existing permission behaviour |
| Existing small exports | Download CSV still works exactly as before below the limit (file name, 27 columns, all rows) | Medium — regression surface (AC-01) |

**Component behaviour confirmed from the MR source (`components/filtered-csv-download/index.tsx`):**
- Email CSV button: `isDisabled = isTableEmpty` (disabled only when the table is empty; **not** gated by the size limit or by download permission).
- Download CSV button: rendered only when `hasDownloadPermission && headers.length > 0`; `isDisabled = isDownloadBlocked` where `isDownloadBlocked` is true when the table is empty **or** the size limit is exceeded (`isCsvDownloadDisabled`).
- Tooltip: rendered only when `isCsvDownloadDisabled && downloadDisabledTooltip` (i.e. the directing message appears only in the size-limit case, not for the empty-table case).
- `handleDownload` returns early when `isDownloadBlocked` is true — a blocked Download CSV produces no file.

**Critical test-data precondition:** reaching the limit safely. Use a **wide date range with minimal filters** on a data-rich env so the filtered count is high enough to cross the estimated-size limit (per ticket repro steps), and a **narrow filter** to stay below it. The original crash itself is **not** to be reproduced — the fix's observable is the **disabled button + directing message**, not the pod crash (rule #14: validate at the UI affordance).

## Scenarios

```gherkin
Feature: Safe CSV export on large filtered result sets (Overview & Leads)
  As an internal Origination user
  I want the portal to stop me from triggering an oversized direct CSV download
  So that exporting a large dataset does not crash the pod and I am routed to Email CSV instead

  Background:
    Given I am logged in to the Origination portal as an internal user

  Scenario: [negative] Download CSV is blocked when the filtered result set exceeds the export-size limit
    Given I have CSV download permission and I am on the Overview screen
    And the active filters produce a non-empty result set whose estimated export size exceeds the allowed Download CSV limit
    When I view the export controls above the leads table
    Then the Download CSV button is disabled and cannot be triggered

  Scenario: [negative] A blocked Download CSV directs the user to Email CSV
    Given I am on the Overview screen with download permission
    And the result set is large enough that Download CSV is disabled
    When I hover over the disabled Download CSV control
    Then a message reads "This export is too large to download directly. Please use Email CSV instead." and states the estimated size and the 48 MB limit

  Scenario: [negative] An empty result set disables both export options
    Given I am on the Leads screen with download permission
    And the active filters return no records, leaving the table empty
    When I view the export controls
    Then both Download CSV and Email CSV are disabled

  Scenario: [negative] An empty result set shows no large-export message
    Given I am on the Overview screen with download permission and an empty result set
    When I hover over the disabled Download CSV control
    Then no message directing me to Email CSV is shown

  Scenario: [negative] A user without download permission is not offered Download CSV
    Given I am on the Overview screen with a non-empty result set
    And my role does not have CSV download permission
    When I view the export controls
    Then Download CSV is not available
    And Email CSV is still available

  Scenario Outline: [boundary] Download CSV availability follows the export-size limit on each screen
    Given I have download permission and I am on the <screen> screen
    And the filtered result set's estimated export size is <size> the allowed limit
    When I view the export controls
    Then the Download CSV button is <state>

    Examples:
      | screen   | size              | state    |
      | Overview | well below 48 MB  | enabled  |
      | Overview | exactly at 48 MB  | enabled  |
      | Overview | just above 48 MB  | disabled |
      | Leads    | well below 48 MB  | enabled  |
      | Leads    | just above 48 MB  | disabled |

  Scenario: [positive] Email CSV remains available for a large result set
    Given I am on the Overview screen with download permission
    And the result set is large enough that Download CSV is disabled
    When I trigger Email CSV
    Then I am asked which email to send the CSV file to and the request is accepted once I confirm an address

  Scenario: [positive] Narrowing the filters re-enables Download CSV
    Given I am on the Leads screen with download permission and Download CSV is disabled because the result set is too large
    When I tighten the filters so the result set falls within the allowed export-size limit
    Then the Download CSV button becomes enabled

  Scenario: [positive] Download CSV works for an Overview result set within the export-size limit
    Given I am on the Overview screen with download permission
    And the filtered result set's estimated export size is within the allowed limit
    When I trigger Download CSV
    Then the file "all-filtered-leads.csv" is downloaded containing every filtered lead with the 27 Overview columns

  Scenario: [positive] Download CSV works for a Leads result set within the export-size limit
    Given I am on the Leads screen with download permission
    And the filtered result set's estimated export size is within the allowed limit
    When I trigger Download CSV
    Then the file "leads-results.csv" is downloaded containing every filtered lead with the 17 Leads columns
```

## Coverage matrix

| # | Acceptance Criterion (derived from the FIX section) | Scenario(s) | Priority |
|---|---|---|---|
| AC-01 | Below the limit, Download CSV stays enabled and exports as before (file name, all rows, 27 columns) | "[positive] Download CSV works within the limit"; Outline rows `well below`/`just below` → enabled | P0 |
| AC-02 | Above the limit, Download CSV is disabled and cannot trigger the oversized request | "[negative] Download CSV blocked when exceeds limit"; Outline rows `just above` → disabled | P0 |
| AC-03 | A disabled Download CSV shows a message directing the user to Email CSV | "[negative] blocked Download CSV directs to Email CSV"; "[negative] empty set shows no message" (negative control) | P0 |
| AC-04 | Email CSV remains available as the export path for large datasets | "[positive] Email CSV remains available for a large result set" | P0 |
| AC-05 | Same behaviour on both Overview and Leads screens | Outline (`Overview` + `Leads` rows); "[negative] empty set" (Leads); "[positive] narrowing re-enables" (Leads) | P1 |
| AC-06 | Empty result set disables both Download CSV and Email CSV | "[negative] empty result set disables both export options" | P1 |
| AC-07 | Download CSV only offered with download permission and headers; Email CSV independent of download permission | "[negative] without download permission is not offered Download CSV" | P1 |
| AC-08 | Availability is re-evaluated when the filters change | "[positive] narrowing the filters re-enables Download CSV" | P1 |

All ACs have ≥1 scenario (forward); every scenario traces to an AC (backward). No orphans.

## Resolved parameters (QA2 discovery 2026-06-18 — see [[overview-leads-csv-export-size-limit]])

The four items previously pending are now confirmed from the deployed bundle + live React props on QA2:

1. **Threshold value/unit** — **48 MiB** (`50331648` bytes; shown as "48 MB"). Estimate = `ceil(avgBytesPerLoadedSampleRow × totalRows)`, fallback `2048 × totalRows`. Comparison **inclusive**: `estimate ≤ 48 MiB` ⇒ enabled, `>` ⇒ disabled (hence the Outline's `exactly at 48 MB` ⇒ enabled).
2. **Messages** — disabled tooltip: *"This export is too large to download directly. Please use Email CSV instead. Estimated size: X.X MB (limit: 48 MB)."* (also shown as an error toast if clicked while blocked). Email CSV modal title: *"Which email should we send this CSV file to?"* (Send disabled until an address is entered). The Email **success toast** wording remains uncaptured (sending a real email is a side effect — out of scope of discovery).
3. **Size vs row count** — **confirmed size-based**: the estimate samples loaded rows for average bytes/row, so column count/content width matter. Same `totalRows` with wider rows can flip availability.
4. **Leads file/columns** — `leads-results.csv`, **17 columns** (Lead Number, Account Number, Lead Status, Internal Status, State, Term Month, Customer Name, Invoice Number, SSN, Phone Number, Email, Merchant, Location, Ref Merchant Code, Client Type, Created at, Created from). Same 48 MiB limit + message as Overview.

## Test-data constraint (execution blocker for the disabled path)

Triggering the **disabled** state needs a single filtered set large enough to exceed 48 MiB: at the observed Overview row width (~762 bytes/row, 27 cols) that is **≈ 66,000 leads**; Leads rows (17 cols) are narrower, needing proportionally more. QA2 currently holds ~44 leads/day, so the disabled-state scenarios (`[negative]` block + tooltip, Outline `just above` rows, `Email CSV remains available for a large set`) **cannot be reproduced on QA2 as-is** — they are confirmed at source level. To exercise them in the UI, use a high-volume environment or a seeded wide date range reaching the row count above. The **enabled** path and the **empty-table** and **permission** scenarios are fully reproducible on QA2 today.

> Decisive checks remain UI-first: assert the **button disabled state**, the **directing message**, that **Email CSV still works**, and — for the happy path — **open the downloaded file** and compare rows/columns to the portal ([[check-points]], rule #14). The pod crash itself is not reproduced; the fix is validated at its UI affordance.

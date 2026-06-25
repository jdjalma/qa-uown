---
title: Origination Portal — Map & Documentation Coverage
domain: knowledge-base
status: snapshot
volatility: volatile
last_verified: 2026-06-25
sources:
  - env: stg
  - code: src/pages/origination/
covers: [origination-portal, portal-map, navigation-menu, coverage-map, overview, leads, funding, error-log, state-configs, blacklist, alerts, funding-modification-history, merchant-setting, open-to-buy, rebate]
promoted_to: []
---

# Origination Portal — Map & Documentation Coverage

> Charter: Explore the Origination portal side menu with Playwright MCP to map every screen and record what is / is not documented.
> Origin: user request — "verifique o que temos documentado do portal origination e discovery no que nao temos documentado e documente" · Overall confidence: high
> NOTE: per-feature discovery knowledge, NOT an execution record. This is the index/entry point for Origination UI knowledge.

The portal is a Next.js static-export SPA at `https://origination-{env}.uownleasing.com` (login = "Merchant Login"; internal agents/admins use the same form). Internal portal → inspect at `1440×900` (Bootstrap `d-lg-block` ≥992px). Side menu order below is the authoritative surface (admin role, stg, build `2026-06-24`).

## Navigation menu (18 items) + sub-pages

| # | Menu item | Route | One-line purpose | Coverage |
|---|---|---|---|---|
| 1 | Overview | `/overview` | KPI dashboard + leads table (date-range) | **Partial** (CSV only) → see below |
| 2 | Leads / Customers | `/leads`, `/customers/{leadPk}` | Lead list + single-lead detail screen | **Documented** (list below + [detail-page doc](origination-customer-lead-detail-page.md)) |
| 3 | Funding | `/funding` | Funding queue (leads awaiting/under funding) | **Documented** → [origination-funding-queue-page.md](origination-funding-queue-page.md) |
| 4 | Funding Modification History | `/fundingModificationHistory` | Audit of funding-queue status transitions | **NEW (here)** |
| 5 | Modification Report | `/modificationReport` | Audit of lead status changes (agent attribution) | Documented |
| 6 | Merchant Modification History | `/merchantModificationHistory` | Audit of merchant-config changes | **Partial** (filters only) |
| 7 | Alerts | `/alerts` | Cross-lead alert feed | **NEW (here)** |
| 8 | Error Log | `/errorLog` | Send/Submit Application API failures | **NEW (here)** |
| 9 | New Application | `/newApplication` | **Send an application invite** (email/phone → Send), NOT the wizard | **Documented** (section below) |
| 10 | State Configs | `/stateConfigs` | Per-state fee / regulatory config | **NEW (here)** |
| 11 | Merchant | `/merchants`, `/merchant/{code}` | Merchant list + merchant detail/edit | **Documented** → [origination-merchant-detail-edit-page.md](origination-merchant-detail-edit-page.md) |
| 12 | Merchant Setting | `/merchantSetting` | Bulk merchant-config editor | **NEW (here)** |
| 13 | Programs | `/programs` | Lease-program catalog (+ ADD NEW) | **NEW** → [origination-programs-program-settings-groups.md](origination-programs-program-settings-groups.md) |
| 14 | Program Settings | `/programSettings` | Editable program-settings form | **NEW** → same doc |
| 15 | Program Groups | `/programGroups` | Program groups + counts | **NEW** → same doc |
| 16 | Rebate | `/rebate` | Dealer rebate report (CSV) | **NEW (here)** |
| 17 | Blacklist | `/blacklist` | Fraud blacklist CRUD | **NEW (here)** |
| 18 | Open To Buy | `/openToBuy` | Open-approval ($ available) report (CSV) | **NEW (here)** |

Sub-pages reachable from the above: **Customer/Lead detail** `/customers/{leadPk}` (deep doc), **Merchant detail** `/merchant/{code}` (Programs section), **Error Log** tabs.

Header (all pages): **Quick search by `Lead #`**, logged-in user menu, contact band.

## Documentation coverage — what we already had

These are the pre-existing Origination-relevant docs (do NOT re-discover):

**Business rules (backend / behavior):** `docs/business-rules/02-originacao-pipeline.md` — the 17-step pipeline, fraud vendors (Sentilink, Neustar, LexisNexis, SEON, NeuroID, Intellicheck, SEON ID, Kount, Plaid), underwriting (GDS/Taktile/ABB), 13-vs-16 routing & `planId`, pre-signing validation, approved amounts by segment, continuation/finalization, Melissa address verification, geolocation, customer-journey funnel. Also `08-funding-merchants.md`, `03-contratos-esign.md`.

**Knowledge-base (UI discovery), Origination-relevant:**
- `ccbin-employment-financial-step.md` — New Application wizard (CCBIN field, employment/financial step)
- `merchant-funding-report-emails.md`, `merchants-config-columns-export.md` — Merchant edit/list (funding emails, config columns, CSV)
- `modification-report-agent-name-bug.md` — Modification Report (agent attribution)
- `multi-select-filters-mmh-modreport-funding.md` — multi-select filters across MMH, Mod Report, Funding queue
- `overview-csv-export-merchant-support.md`, `overview-leads-csv-export-size-limit.md` — Overview/Leads CSV export
- `underwriting-and-funding-test-data-paths.md`, `npm-segment-tam-score-snapshot-routing.md` — UW/funding test-data + GDS snapshot
- `alabama-gowsign-template.md`, `new-york-gowsign-template.md`, `16m-lease-and-gowsign-signwell-routing-qa2.md`, `seon-idv-widget-user-behavior.md` — signing/contract + SEON IDV (cross into Website portal)

**Gap that motivated this doc:** there was **no portal map** and **no discovery doc** for the core lead-detail screen or for 8 admin/report screens. This file + the two companion docs close them.

---

## Newly documented screens (this file)

> All absolute row counts and field values below are **live stg snapshots taken 2026-06-25** — volatile `[observation]`, not durable `[confirmed]` facts (Rule #16). Column/field/filter **names** are stable; the **counts/values** drift by env and time.

### Overview (`/overview`) — full structure
KPI cards: Applications, Approval Rate, Avg. Approval Amt., $ Amt. of Open Apvl., $ Amt. of Funded TXN, $ Amt. of Approvals With Signed Leases, $'s Approaching Expiry, Conversion Rate. Below: leads table with `Filters`, `Email CSV`, `Download CSV`, `Config Columns`. Table columns: Reference #, Merchant, Location, Merchant Code, First/Last Name, Status, Internal Status, Sales Person, Sales Rep Code, Merchant Support, State, **Term Month**, Phone, Email, Approval Amt, Final Approval Amount, Application Date, Expiration Date, Delivery Date, Invoice #, Signed Lease, Funded Amount, Lease Amount, **Lambda Score**, UUID, **Created from** (e.g. `TIRE_AGENT_API`, `PORTAL`). `[confirmed]`

### Leads (`/leads`) — **NEW**
A **searchable lead lookup** (distinct from Overview's KPI dashboard). Filters: From/To date, **SSN**, Email, **Lead PK**, **Account PK**, Phone Number, Customer Name, State, Lead Status, Invoice Number, Internal Status, Merchant, Location. Columns: Lead # · Account # · Lead Status · Internal Status · State · Term Month · Customer Name · Invoice Number · **SSN** · Phone Number · Email Address · Merchant · Location · Ref Merchant Code · Client Type · Created at · Created from. `Email CSV` / `Download CSV`. `[confirmed]`

### New Application (`/newApplication`) — **NEW (corrected)**
NOT the multi-step application wizard. It is an internal **send-application-invite** form: `Email`, `Phone`, `Merchant` (Select a merchant), `Location` (Select a location) → **Send**. Below it, a history table (From/To/Merchant/Location filters) of previously sent invites. The full customer application **wizard** (personal info → employment → ID upload → payment → contract) is customer-facing on the Website/merchant portals (`application-wizard.page.ts`; CCBIN step documented in `ccbin-employment-financial-step.md`). `[confirmed]`

### Error Log (`/errorLog`) — **NEW**
Two tabs: **Send Application** / **Submit Application**. Filters: `From` / `To` date + `Search`. Exports: `Email CSV`, `Download CSV`. Columns: Lead Pk, First Name, Last Name, Last 4 SSN, Merchant Pk, Merchant Code, Merchant Name, Location Name, **Message**. Captures API failures during application send/submit — e.g. `NextPayDate should be in the future. Received 2026-02-09`, `Invalid merchantId`. Ops/debug tool for stuck applications. `[confirmed]` (page object: `error-log.page.ts`)

### State Configs (`/stateConfigs`) — **NEW**
"State Configurations" — 53 rows (states + territories). Columns: State, State abbreviation, Max Cost Price Factor, Max Processing And Delivery Fee, Nsf, Recycle Fee, Processing Fee, Discount On Paid, Epo Discount. Filter by state; a **Notes** (activity-log) section sits below. Read-display of the per-state regulatory/fee parameters that feed Step 1 State Check and fee calculations. Examples: CA `Max Cost Price Factor 2.25`, CT `2 / processing fee 10 / discount 0.5`. `[confirmed]`

### Blacklist (`/blacklist`) — **NEW**
Fraud blacklist management — **257,131** entries in stg. Columns: First Name, Last Name, Email, Phone, Address, Zip Code, SSN, Bank Account Number, Routing Number, **CC BIN**. Actions: **ADD**, **REMOVE**, `Email CSV`, `Download CSV`, `Search table`. An entry may carry any subset of fields (partial-match blacklisting). This is the data behind pipeline **Step 4 Blacklist Check** (business-rules §4). The lead-detail `Blacklist Lead` button bulk-adds a lead's data here. `[confirmed]`

### Alerts (`/alerts`) — **NEW**
Cross-lead alert feed. Columns: Lead Pk, Date, **Message**. Filter `From`/`To` + CSV export. The same alerts surface as a red banner on the lead-detail page (e.g. `Credit card not Valid for this Transaction`). `[confirmed]`

### Funding Modification History (`/fundingModificationHistory`) — **NEW**
Audit of funding-queue transitions. Filters: Start Date, End Date, Lead PK, **Old Funding Queue Status**, **New Funding Queue Status**, **Old Lead Status**, **New Lead Status**. CSV export. (Distinct from Merchant Modification History and Modification Report.) Empty for the default range in stg. `[confirmed]`

### Merchant Setting (`/merchantSetting`) — **NEW**
**Bulk merchant-config editor** — list of **10,356** merchant/location rows (Merchant Code, Active, Merchant Name, Location Name) + multi-select `Merchant`/`Location`/`Merchant Category`/`Client Type`/`Active` filters and a settings form (`CANCEL`/`SAVE`, plus `GDS Data`). Editable fields: Merchant Support, Sales Rep Code, UOwn Sales Rep Code, Referral Partner, Integration Type, Num Days Approval Exp, Num Days Lease Exp, Peak Campaign Id, Off Peak Campaign Id, Dealer Discount, Dealer Rebate Override, Dealer Rebate Type, **Webhook URL\***, CC Processing Fee, Referral Fee, Platform Fee, Platform Fee Type, **UW Pipeline**, **Fraud Threshold**, **Max Approval Amount**, Funding Report Frequency, Funding Report Emails, Merged Report Frequency, Merged Report Emails, General Notes, Log Type, **Remove All Programs from Merchant(s)?**, Program Group Name. Lets ops apply settings across many merchants/locations at once. Distinct from the per-merchant **Merchant** edit page. Ties to `src/data/merchant-config-contract.ts` (Rule #12 preflight). `[confirmed]` (page object: `merchant-setting.page.ts`)

### Open To Buy (`/openToBuy`) — **NEW**
Report of available approval credit. Filters: Merchant (multi-select), **Location\*** (required, multi-select), **Start Date\*** / **End Date\*** (default today). In the live default state I observed **only an Email CSV action and no inline table** `[observation, stg 2026-06-25]`. **Conflict to reconcile:** `open-to-buy.page.ts:17,105-120` targets an Export/Export-CSV button plus `getSelectedMerchants`/`getLocationOptions` read helpers, implying a reactive results grid — so a table may render after applying filters/Search. Treat the export-only description as the default-state observation, not a guarantee. (page object: `open-to-buy.page.ts`, Task #1205)

### Rebate (`/rebate`) — **NEW**
Dealer-rebate report. Filters: Start Date, End Date, Merchant, Locations + `Email CSV` / `Download CSV`. Empty for default range in stg. Relates to `Dealer Rebate Override`/`Dealer Rebate Type` on Merchant Setting. `[confirmed]` (page object: `rebate.page.ts`, Task #1292 shared filters)

---

## Cross-cutting patterns

- **Merchant/Location filters are NOT a single shared widget** (corrected 2026-06-25 by code audit): `merchant-location-filter.po.ts` (#1292, `filter__` prefix, "Select All") drives **Open To Buy, Rebate, Merchant list, Leads/Overview, Merchant Setting, New Application**; **Merchant Modification History + Modification Report** use a *different* shared helper `MerchantLocationReportControls` (`src/helpers/merchant-location-report.helper.ts`, #1319); **Funding Queue** uses its **own custom filter** component (`funding.page.ts`). `[confirmed via code]`
- **Email CSV vs Download CSV**: large exports route through Email CSV to avoid the size-limit guard (`overview-leads-csv-export-size-limit.md`, #1321).
- **`Status` vs `Internal Status`** appear together everywhere (public status vs raw `internal_decision`).
- Most list pages use a **DataTable** with `Rows per page` (10–100) + pager.

## Gaps / still not documented (prioritized — refreshed by the 2026-06-25 code/doc coverage audit)

**P1 — core flows, still undocumented (need live UI):**
1. **Customer Application Wizard (`/complete`) end-to-end** — Page 1 Your Info + Radar address autocomplete (HTTP-402 manual-entry fallback #914) + NEXT validation gating; Page 2 employment/pay/income + bank-field Yup errors; Page 3 disclaimer/bankruptcy + consent checkboxes + Submit; approval screen. Only the CCBIN step is documented (`ccbin-employment-financial-step.md`). The Origination `/newApplication` screen only *sends the invite*.
2. **RightFoot ACH-consent checkbox (#1310)** on the application form — **zero doc AND zero test coverage** despite a rich `application-wizard.page.ts` API (conditional render, checked-by-default, unchecking disables NEXT). Security/consent control.
3. **Lead-detail full per-status action-availability matrix** — only a Funding lead was snapshotted.

**P2 — secondary flows / admin (need live UI):**
4. **Merchant Setting bulk editor** deep doc — bulk row selection, EPO 5%/10% triple-checkbox collapse control, GDS Data collapsible (save-when-dirty + confirm), bulk-update confirmation modal, Dealer Rebate Type enum.
5. **Merchant Modification History** result table (columns/row content + pagination) — only filters documented.
6. **Add Merchant / Clone merchant** UI flow (`/merchant/new`) — create form + clone dropdown.
7. **Program Details edit form**: Allowed Frequency Override + Lending Category enum values, Money-Factor format (#1251) + Activation<Deactivation date-ordering validation, Notes/Activity-Log content (PROGRAM_DATA_CHANGE), Clone Group modal mechanics, group create/edit.
8. **Funding Queue**: full Funding-Queue-Status enum + Send-to-FUNDED preconditions, Email-CSV modal flow, pagination/empty-state.
9. **MissingDataForm (`/complete`)** CC/ACH UI + processing-fee sentence + the "optional" ACH gate that keeps Submit disabled (possible UX/validation bug).
10. **Contract / Terms-of-Agreement signing UI consequences** — CC-decline toast blocking PROCEED TO SIGNATURE, already-enrolled Buddy variant, completeESign "Not Legally Binding"/"Document complete!" modals, missing-employment mini-steps, Terms summary panel (7 fields) + lease-items table.
11. **PayTomorrow partner-portal flow** — **no doc exists** (Keycloak login, customer-not-present app, cart, identity verification incl. sandbox OTP `12345`, offers, embedded UOWN contract iframe + SEON workaround, e-sign auto-detection, refund modal). **PayPair** deep doc (only generic business-rules §46 mention).

**P3 — edges / confirmations (need live UI):**
12. **Metrics Calculator** (`metrics-calculator.page.ts`) + **LeaseAgreementPage** — likely **dead/placeholder page objects** (generic selectors, zero test refs, no nav entry). Confirm the screens even exist.
13. **State Configs** Notes/edit affordance; **Blacklist** ADD/REMOVE modal layout + validation.
14. **Per-role visibility** — admin/manager vs supervisor documented ([role doc](origination-role-based-access-and-pii.md)); still open: `agent`/`readonly`/`merchant` (creds invalid in stg+sandbox — provision needed), the exact PII-reduction AC, and whether direct-URL reachability for menu-restricted roles is a route-guard gap.
15. **Grid generics**: rows-per-page + pagination footer as a user feature, Email-CSV modal flow, Overview Config-Columns panel (some code-evident via `error-log.page.ts`/`filtered-csv-download.controls.ts`).

**Now closed by this audit cycle:** shared Merchant/Location filter widgets and the lead-detail action modals + invoice creation — see the two companion docs below.

## Companion discovery docs

- [origination-customer-lead-detail-page.md](origination-customer-lead-detail-page.md) — the `/customers/{leadPk}` working screen.
- [origination-programs-program-settings-groups.md](origination-programs-program-settings-groups.md) — Programs / Program Settings / Program Groups.
- [origination-funding-queue-page.md](origination-funding-queue-page.md) — the `/funding` queue (columns, bulk Send to FUNDED, exceptions).
- [origination-merchant-detail-edit-page.md](origination-merchant-detail-edit-page.md) — the `/merchant/{code}` full config form (~90 fields).
- [origination-role-based-access-and-pii.md](origination-role-based-access-and-pii.md) — menu/action gating + PII visibility by role (admin/manager vs supervisor).
- [origination-merchant-location-filters.md](origination-merchant-location-filters.md) — the 3 Merchant/Location filter mechanisms (#1292 widget vs #1319 report controls vs Funding's custom filter) + behavioral contract.
- [origination-lead-detail-actions-and-invoice.md](origination-lead-detail-actions-and-invoice.md) — lead-detail action modals (Change-to-Signed / Set-to-Expired / Cancel / Modify-Approval / Modify-Lease / Settle) + invoice/lease creation + Sales Rep edit, from code+specs.

**Skills loaded:** `.claude/skills/discovery/SKILL.md`

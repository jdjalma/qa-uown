---
name: application-lifecycle
description: Load when the test creates/manipulates a UOWN application (lead -> pre-qualified -> qualified -> leased -> signed). Defines the 13+ steps of the cycle, mandatory call order, known pitfalls (merchant config, OTP timing, fraud callbacks).
disable-model-invocation: true
---

# Application Lifecycle Protocol - UOWN Leasing

> **Purpose:** canonical sequence of calls to create an application end-to-end via API + catalog of known pitfalls. MANDATORY for any test/feature that involves `sendApplication` or lease state transitions.
>
> **Why it exists:** every new task that creates an application tends to bleed 20-60 min rediscovering the same implicit requirements. This file is the institutional memory that avoids that.
>
> **Who consults it:** `qa-planner`, `qa-implementer`, `qa-debugger`, `/qa-flow`, and direct analyses.

> **BDD Oracle (rule #19):** creating/advancing an application is a registered operation (`.claude/oracles/new-application.md`). Validate every checkpoint before considering the sequence complete — it is not exempt as "just setup" when it IS the operation under test.

> **Authority boundary** (`docs/_docs-conventions.md` §7): this skill covers **HOW TO TEST** — canonical sequence, pitfalls catalog, helpers list. The **canonical product behavior** (lease state machine, `LeadStatus` enums, UW rules) does NOT live here — it is single-sourced in `docs/business-rules/02-originacao-pipeline.md` + `06-conta-ciclo-vida.md` and `src/helpers/api-setup.helpers.ts`. To resolve a topic, run `node scripts/docs-tooling.mjs resolve pipeline` (or `account-lifecycle`, `underwriting`). Recent investigations: `docs/knowledge-base/underwriting-and-funding-test-data-paths.md`. **Do not duplicate product rules here** — they drift.

> Full step details: [references/canonical-sequence-detail.md](references/canonical-sequence-detail.md)
>
> Complete pitfalls catalog (#1 to #148, index + slices): [references/pitfalls.md](references/pitfalls.md)

---

## 1. Canonical sequence (overview)

| # | Call | Result |
|---|---------|-----------|
| 1 | `buildTestData({ env, state, merchant, orderTotal })` | unique email, approved SSN |
| 2 | `api.application.sendApplication(merchant, applicant, order)` | `leadPk`, `leadUuid` |
| 3 | `sleep(5000)` + `getApplicationStatus(merchant, leadUuid)` | status approved |
| 4 | `api.invoice.sendInvoice(merchant, leadUuid, { orderTotal })` | `redirectUrl` |
| 5 | Extract `shortCode` + `planId` from `redirectUrl` | - |
| 6 | `api.application.getMissingFields(shortCode, { planId })` | sets `merchantProgramPk` |
| 7 | `submitApplication(leadPk, ..., { ccNumber: MASTERCARD_APPROVED })` | CC_AUTH_PASSED |
| 8 | `changeLeadStatus(merchant, leadPk, 'SIGNED')` | SIGNED |
| 9 | `settleApplication(merchant, leadUuid)` | SETTLED |
| 10 | `updateFundingStatus([leadPk], 'FUNDING')` | FUNDING |
| 11 | `updateFundingStatus([leadPk], 'FUNDED')` | FUNDED, creates account |
| 12 | `db.waitForAccountByLeadPk(leadPk)` | accountPk |
| 13 | `db.waitForAccountStatus(accountPk, 'ACTIVE')` | ACTIVE |

**SETTLED_IN_FULL:** steps 14-16 via `makeCreditCardPayments(SETTLEMENT)`.
**Email swap:** steps 17-18 via `createOrUpdateEmail`.

---

## 2. Principles

- **Order is inviolable:** skipping steps causes a silent 400/500
- **MASTERCARD_APPROVED (BIN 5500) only:** VISA causes `UnexpectedRollbackException` (pitfall #3)
- **`getMissingFields` mandatory:** without it, `submitApplication` returns 500 (pitfall #2)
- **Unique email per run:** reuse causes `ADDRESS_MISMATCH` denial (pitfall #1)
- **Kornerstone requires bank data:** `mainBankRoutingNumber` + `mainBankAccountNumber` (pitfall #5)
- **SETTLED_IN_FULL via real payment:** a direct UPDATE does not populate `uown_sv_payment` (pitfall #9)
- **Automatic merchant preflight:** `createPreQualifiedApplication` calls `ensureMerchantReady` (pitfall #10)
- **`mainNextPayDate` mandatory:** afterward, field validated in the body (pitfall #63)

---

## 3. Helpers that implement the sequence

| Helper | Complete up to | Notes |
|--------|--------------|-------|
| `setupApplicationViaApi` | Step 7 | Includes `getMissingFields` |
| `createPreQualifiedApplication` | Step 7 | Includes `getMissingFields` + merchant preflight |
| `driveLeadToSigned` | Step 8 | `changeLeadStatus('SIGNED')` |
| `driveLeadToFunding` | Step 10 | SIGNED - settle - FUNDING |

---

## 4. Quick checklist before implementing

- [ ] `buildTestData` without `emailOverride` (pitfall #1)
- [ ] Kornerstone? bankData in `createPreQualifiedApplication` (pitfall #5)
- [ ] `getMissingFields` called before `submitApplication` (pitfall #2)
- [ ] CC = `MASTERCARD_APPROVED`, NEVER `VISA_APPROVED` (pitfall #3)
- [ ] Merchant provisioned in the target environment's LOS (pitfall #4)
- [ ] Order `SIGNED - settle - FUNDING - FUNDED` (pitfall #6)
- [ ] Email template? `makeCreditCardPayments(SETTLEMENT)` (pitfall #9)
- [ ] Merchant preflight if not using `createPreQualifiedApplication` (pitfall #10)
- [ ] Default payment frequency is WEEKLY (pitfall #53); override if necessary

---

## 5. Most critical pitfalls (quick reference)

| # | Symptom | Quick fix |
|---|---------|------------|
| 1 | DENIED with no reason | Unique email (no `emailOverride`) |
| 2 | 500 "Merchant program required" | `getMissingFields` first |
| 3 | `UnexpectedRollbackException` | MASTERCARD (BIN 5500) |
| 5 | 400 Kornerstone | Add bank data |
| 9 | Sweep fails silently | `makeCreditCardPayments(SETTLEMENT)` |
| 10 | Random 400/500 | Merchant preflight / config drift |
| 39 | 500 rollback all merchants | **[env-blocker]** svc bug (mitigated qa1) |
| 48 | Backdrop intercepts clicks | `dismissCustomerInfoConfirmation` |
| 66 | 0 rows on timestamp filter | TZ drift: use monotonic PK or AT TIME ZONE |
| 69 | Auth fails after CT-10 | ensureAuthenticated v8 (JWT exp check) |
| 87 | `sweep_logs.processed=0` on immediate read | Assert `uown_email_queue` (monotonic PK), not sweep_logs |
| 88 | Sweep does not process "eligible" account | Use the EXACT sweep query (CASE-WHEN DOW) |
| 89 | FirstPaymentReminder skips account | Align sched_summary + receivable.due_date |
| 90 | Re-trigger returns processed=0 | Same-day dedup in Java; assert today's row |
| 91 | Website OTP picks up code from another run | `snapshotInboxUid` before + `getVerificationCode({ sinceUid })` |
| 92 | Website sidebar click intercepted post-payment | `goToSidebarLink` calls `waitForSpinner` first |
| 98 | Quick search does not navigate from /funding (3x retry) | `searchAndSelectFirst` does `input.click` (focus) before fill — dropdown only renders with the input focused |
| 99 | Website sidebar "passes" but update-contact times out/spins infinitely | `page.goto` fallback loses auth + `waitForSpinner` swallows timeout → silent pass. Real cause: force-logout on /documents (OBS-WS-DOCS-LOGOUT) |
| 102 | NeuroID never fires / `count>=1` guard fails (false negative) | `useNeuroIdCheck=true` in `mustBeFalse` → auto-heal resets it. `skipMerchantPreflight:true` + read-only pre-assert of the flag |
| 103 | NeuroID count via `uown_sv_outbound_api_log WHERE lead_pk` returns 0 | No `lead_pk` correlation pre-funding (NULLs). Use `countNeuroIdCalls` (`uown_neuro_id_verification`) |
| 104 | `configColumnsPanel` returns 0 elements on `/merchant` | Bootstrap dropdown, not dialog. Use `configColumnsPanelMerchants` |
| 105 | `label:has-text(...) input[type=checkbox]` does not find the column on `/merchant` | Native checkboxes without `<label>`; `input[type=checkbox][name="<label>"]` |
| 106 | Wait for Apply/Save after column toggle on `/merchant` never resolves | Immediate selection (BR-01); there is no Apply |
| 107 | Active filter `/merchant` has no "All"; change does not re-filter | react-select `#isActive` (Active/Inactive); apply via Search (BR-06) |
| 108 | `/merchantSetting` row timeout — merchant not in the default ~20 rows | Type the code into the "Search table" box (`msMerchantSearchTableInput`) + apply BEFORE selecting the row; the table does not load all by default |
| 109 | ending-in-9 SSN is APPROVED in qa2 (expected UW_DENIED) | The ending-in-9 short-circuit belongs to the MOCKED UW engine; TERRACE_FINANCE in qa2 may route to the real engine → mock does not fire. No deterministic UW_DENIED trigger confirmed in qa2 (≠ qa1) |
| 110 | `#epo5-false`/`#epo10-false` "not visible" on `/merchantSetting` (check timeout) | EPO triple is a `.collapse` dropdown: True/False live in a `display:none` panel. Checking `-main` does NOT reveal it; clicking the **caret-down** (`#toggler:has(#epoN-main) svg.fa-caret-down`) opens it. Then check WITHOUT `force:true` |
| 111 | Last sub-test of `describe.serial` fails with `"context"/"page"/"testEnv" fixtures are not supported in afterAll` + teardown does not run (drift leaks) | `afterAll` only accepts **worker-scoped** fixtures. `db` is worker (OK); `page`/`context`/`testEnv` are test-scoped (FORBIDDEN). Use `{ browser, db }` and create your own `browser.newContext()`; derive env via `new ConfigEnvironment(process.env.ENV)` |
| 112 | Merchant-settings snapshot not in `lead_notes` / account snapshot does not reflect live merchant | Lead snapshot in `ApplicationApprovedEvent` (APPROVED only); account snapshot **copies** the lead (does not re-read merchant), gated on the existence of the lead snapshot (absent → account created, snapshot silently skipped). Audit = app INFO/WARN logs, **NOT `uown_los_lead_notes`**. Tables `uown_los_lead_merchant_settings_snapshot`/`uown_sv_account_merchant_settings_snapshot` (`epo5,epo10,uw_pipeline,fraud_threshold`). Scope: audit/reporting only |
| 113 | qa2 fail-fast on the 1st DB read (`assertMerchantContract`) | qa2 tunnel `127.0.0.1:5445` drops mid-run / `svc_user` rejects transiently. **Infra, not contract drift nor feature** — re-probe DB and re-run (≈ #18) |
| 115 | Overview: `nth()` on a date input hits the WRONG form (KPI vs table) | Overview has 2 forms: top-bar KPI (`#from`/`#to`, toggle `overview_filterButton__`, drives cards) vs TABLE panel (`#fromDate`/`#toDate`, toggle `index-module_filterButton__`, drives table+CSV). Target the table panel by **id**, never positionally. See [[selector-hardening]] |
| 116 | Overview: a future-only date window does NOT empty the table | `#fromDate` (table panel) **resets to today** (Formik default) → not a reliable empty-set lever. Use `searchTable(value)` with a non-existent value (free-text "Search table" `overviewTableSearch`) |
| 117 | Overview: the table-filter panel re-collapses right after the toggle | `verifyDashboardLoaded` resolves the Promise.race when the Filters button appears, BEFORE the table loads in QA2; the panel is a width-collapse animation → re-render re-collapses it. `expandTableFilters` needs a **retry loop**, not 1 click |
| 118 | "Download CSV" opens the EMAIL modal (clicks the wrong button) | Email CSV and Download CSV share `filtered-csv-download_csvButton`; Email is 1st in the DOM → bare class + `.first()` resolves to Email. Disambiguate Download by `:has-text('Download CSV')`. See [[selector-hardening]] / [[page-object-pattern]] |
| 119 | Leads CSV 17th column "Created from" exports a BLANK header | **[OBSERVATION]** `createdFrom` — react-csv entry without `label`. Pre-existing, product-side; flag for a separate ticket. NOT a test bug (OBS-01 #1321) |
| 120 | Origination "Download CSV" absent for certain users — which permission controls it? | Gate = AMS → **Roles → Origination tab** → click role → "Edit Role Permissions" (chips = GRANTED perms; absent ⇒ role lacks it). Perms: `overview download csv` → `/overview`; `leads download csv` → `/leads`. **HAVE perm:** `admin`, `manager`. **DO NOT have:** `agent`, `isr`, `auditor`. Do NOT confuse with `overview csv [modify]` (governs filter/column config, not the button). `email csv` is independent — Email CSV renders whenever the table is not empty. Candidate account without perm: `evedovatto.gow_clone` (role `agent`, sandbox, password unknown). Recipe CT-09: AMS → Add User with role `agent`/`isr` → login to Origination → confirm Download CSV absent. (sandbox 2026-06-18, #1321 / MR !1481) |
| 121 | Location filter "not visible"/disabled on `/merchantModificationHistory` and `/modificationReport` even with the page loaded | **Intra-component divergence** — in MMH and ModReport, Location gets `filter__control--is-disabled` until ≥1 Merchant is selected (BR-01). In the **Funding Queue** (`/funding`) Location is INDEPENDENT (not disabled, BR-02). Location tests in MMH/ModReport MUST select a Merchant first; do not copy the Funding assumption. (qa2 2026-06-18, #1319 — `[CONFIRMED]` via MCP DOM) |
| 122 | Funding Queue returns only FUNDING leads when filtering by Funded/Refunded | The Status filter has **"Funding" PRE-SELECTED** when `/funding` loads (BR-03). Whoever uses `selectOptions('Status', ...)` directly adds to the default and the result is contaminated. `FundingPage.filterByStatuses()` calls `clearStatusFilter` first — use the method, not raw `selectOptions`. (qa2 2026-06-18, #1319 — `[CONFIRMED]` via MCP DOM) |
| 123 | Overview TABLE-panel `#fromDate`/`#toDate` ignore `fill()` — Formik does not update | Inputs are `type="search"`. `fill()` sets the DOM but does NOT fire Formik's `onChange` → the submitted query uses the previous value. Fix: access `element.__reactProps.onChange` via `page.evaluate`, with `setTimeout(150ms)` between fromDate and toDate (re-render of fromDate recreates the toDate node). Additionally: `submitFilters()` detects the spinner `<tr>` as "row visible" in large datasets (79k rows) — use `page.waitForFunction` waiting for pagination `>1000` before checking button states. The guard tooltip is a Bootstrap portal (`div[role='tooltip'].tooltip.show`), not internal text of the span wrapper. (sandbox 2026-06-18, #1321) |
| 124 | Origination "Set to Expired" confirm clicks nothing — modal opens but `changeLeadStatus` never fires (lead does not expire) | The action opens the **"Add a Comment"** modal inside `.modal.fade.show` (`role="dialog"`). The confirm button is **"Save"** (`button[type='submit']`) — NOT "CONFIRM"/"Yes" and WITHOUT class `.submit-button`. The comment field (`input[name='comment']`, placeholder "Type here...") is **OPTIONAL** (Save stays enabled when empty), but the typed text GOES to the activity log (`uown_los_activity_log.notes` = "ChangeLeadStatus requested from X to EXPIRED. Reason : {comment}"). The old selector (`CONFIRM`/`Yes`/`.submit-button`) matched 0 elements; the visibility wait had `.catch(()=>false)` → silent failure, the method returned without clicking. Fix: `setToExpiredConfirm` anchors on `button[type='submit']`+`Save`; the method fills the optional comment and removes the swallow. **Do NOT confuse** with the "Move Contract to Signed" modal (CT-02), which has a MANDATORY comment and a CONFIRM button. (qa2 lead 16728, 2026-06-18, #1315 — `[CONFIRMED]` via live DOM + XHR 200 + status UW_APPROVED→EXPIRED + `uown_lead_modifications.mod_type=LEAD_STATUS_CHANGE`. See [[selector-hardening]]) |
| 125 | Modification Report (`/modificationReport`) filters and the table comes back with the whole set (filter ignored), OR the row of the just-created lead "does not appear" | Two implicit requirements of the filter panel: **(a)** the fields `input#agentName`, `input#from`, `input#to` are **React/Formik-controlled** — `page.fill()` is a **silent no-op** (no `TimeoutError`); `onChange` never fires and the search runs with an empty field. Set via native-setter (`forceReactInputValue`): prototype value setter + `input`/`change`/`blur`. Dates in `MM/DD/YYYY`. **(b)** the table is **rdt paginated at 10 rows/page** — `getRowByLeadPk` MUST walk the pages (`goToNextPage` until Next is disabled); a single-page `getAllRows().find(...)` silently loses the lead on page 2+. `filterByAgentName`/`filterByDateRange`/`getRowByLeadPk` already encapsulate both. (qa2 `jmendes.gow`, 2026-06-18, #1315 — `[CONFIRMED]` via live DOM, CT-03/CT-04 PASS. See [[selector-hardening]] "React-controlled date/text input" + [[page-object-pattern]] catalog `ModificationReportPage`) |
| 146 | ACH Fully Refund assert times out (CC refund passes instantly) | CC refund is synchronous; ACH refund is asynchronous (new `ACHPayment` PENDING/REFUND, `reverse_date` waits for sweep settlement) — servicing#519 regression, sandbox 2026-06-30 |

> Complete catalog (148 pitfalls, #1–#148) + cross-cutting observations: [references/pitfalls.md](references/pitfalls.md) — navigable index; content sliced into [references/pitfalls/](references/pitfalls/) (each slice fits in one `Read`).

---

## 6. Contribution Template

Per CLAUDE.md rule #12, when an agent discovers an undocumented implicit requirement, it is **mandatory** to add it to the catalog (via [references/pitfalls.md](references/pitfalls.md)) before closing the pipeline.

### Step-by-step

1. Identify the exact symptom (copy-paste of the error message)
2. Add the row to the **last slice** in [references/pitfalls/](references/pitfalls/) using the **next global number** (current max + 1); if the slice is already > ~50 KB, create the next one `NN-pitfalls-LLL-HHH.md`
3. Add the corresponding index line in [references/pitfalls.md](references/pitfalls.md) (number + symptom + slice)
4. If the fix requires a change to the sequence: annotate inline with `**[pitfall #N]**`
5. If it requires a new helper: update the Helpers section 3 above
6. Include a discovery reference (task/pipeline/data)

### Do not document here

- Real application bugs (go to the report with the `[CONFIRMED]` tag)
- Test bugs (fix the test, do not document as a pitfall)
- Transiently inaccessible environment (timeout, VPN) - that's flaky, not a pitfall

---

## 7. Cross-references

- 13m / 13m+16m / 16m Second Look modalities: [[ssn-test-modalities]]
- Risk tiers + state-specific rules: `docs/business-rules/appendix-g-cenarios-risco.md`
- Test bank constants: `src/config/constants.ts` - `TEST_BANK.DEFAULT_ROUTING` / `DEFAULT_ACCOUNT`
- **Sweep validation checklist (mandatory 5 points):** [[common-operations]] cookbook §Scheduled Tasks → "Sweep Validation Checklist"
- Test cards: `src/data/test-cards.ts` - use `MASTERCARD_APPROVED` (BIN 5500)
- Payment arrangement patterns: `test-patterns-arrangements.md`
- Test Data Hierarchy: `../../rules/testing.md`
- Brand coverage (UOWN + Kornerstone): [[ssn-test-modalities]] section 7

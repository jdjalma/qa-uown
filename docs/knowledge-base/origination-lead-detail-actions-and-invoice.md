---
title: Origination Lead-Detail Actions & Invoice/Lease Creation
domain: knowledge-base
status: stable
volatility: volatile
last_verified: 2026-06-25
sources:
  - code: src/pages/origination/customer.page.ts
  - test: tests/e2e/origination/modify-approval-amount.spec.ts
  - test: tests/e2e/origination/modify-lease.spec.ts
  - test: tests/e2e/origination/lease-cancellation.spec.ts
covers: [lead-management, cancellation, approval-change, invoice-modification, settlement, lead-status]
promoted_to: []
---

# Origination Lead-Detail Actions & Invoice/Lease Creation

> **Charter:** map every agent-action modal and the invoice/lease creation flow on the Origination lead-detail (customer) page, from CODE evidence only — page-object methods, co-located/global selectors, and the specs that exercise them. No live browser was used for this pass.
> **Origin:** "origination doc coverage audit (ultracode)".
> **Overall confidence:** HIGH for triggers, field locators, required/optional status, confirm/cancel controls, and spec coverage (all citable to `file:line`). LOW / "needs live UI" for rendered toast strings not asserted in a spec and for the full per-status action-availability matrix (the action buttons live in a collapsible, role/status-gated summary bar that code cannot fully enumerate).
> **NOTE:** per-feature discovery knowledge, NOT an execution record. Companion to [`origination-customer-lead-detail-page.md`](origination-customer-lead-detail-page.md) (which covers the read view / panels).

## Scope

In scope: the agent-action modals reachable from the lead-detail summary action bar and the Documents card, plus the invoice/lease creation form. All driven by `OriginationCustomerPage` in [`src/pages/origination/customer.page.ts`](../../src/pages/origination/customer.page.ts). Global selector strings resolve from [`src/selectors/common.selectors.ts`](../../src/selectors/common.selectors.ts) via the `SELECTORS` import (`customer.page.ts:3` [confirmed via code]).

Out of scope: the read view, PII masking, e-sign / GowSign routing, funding queue, merchant config — see the companion docs.

### Shared action-bar mechanics (apply to every `clickActionButton(...)` modal)

- The action buttons (Change to Signed, Set to Expired, Modify Lease, Modify Approval Amount, …) live in a **collapsible** summary bar. `expandActionsMenu()` clicks the `.fa-caret-left` icon to reveal them (`customer.page.ts:67-74` [confirmed via code]).
- The bar is a horizontally `overflow-auto` container; buttons past the visible width render **off-screen-right** while still reporting `visible:true`. The only reliable trigger is a **JS-dispatched click after `scrollIntoView`** (`customer.page.ts:94-114`, docstring `customer.page.ts:80-93` [confirmed via code]). A plain `.click()` / `click({force:true})` fails or no-ops here — this is why the page object never uses a raw click for these.
- Most actions close with `captureAndDismissToast(...)` then `waitForSpinner()`.

---

## Action modals

### Change to Signed

| Attribute | Value | Evidence |
|---|---|---|
| Method | `changeToSigned(comment = 'Automated - Change to Signed (#1315)')` | `customer.page.ts:241-265` [confirmed via code] |
| Trigger | `clickActionButton('Change to Signed')`; standalone getter `changeToSignedButton = button:has-text('Change to Signed')` | `customer.page.ts:242`, `:43` [confirmed via code] |
| Modal | "Move Contract to Signed" — `SELECTORS.moveContractToSignedModal` = `[role='dialog']:has-text('Move Contract to Signed'), .modal.show:has-text('Move Contract to Signed')` | `customer.page.ts:215,245`; `common.selectors.ts:100` [confirmed via code] |
| Field — comment | **REQUIRED**. `SELECTORS.moveContractToSignedComment` = `input[placeholder='Add a comment (required)']`. Filled unconditionally. | `customer.page.ts:216,249-250`; `common.selectors.ts:101` [confirmed via code] |
| Confirm | `SELECTORS.moveContractToSignedConfirm` (`.last()`) = `button.submit-button` OR `button:has-text('CONFIRM')` | `customer.page.ts:217,251-252`; `common.selectors.ts:102` [confirmed via code] |
| Fallback path | If the modal does not appear, a plain confirm dialog button `name=/confirm\|yes\|ok/i` is clicked (older path) | `customer.page.ts:254-258` [confirmed via code] |
| Cancel | not modeled in code | needs live UI |
| Success toast | captured + dismissed but **text not asserted** | `customer.page.ts:263` [inferred]; string → needs live UI |
| Status gating | Docstring: for a lead with a prior signing flow (internal status `INVOICE_CREATED` / `CC_AUTH_PASSED`, BR-06 of #1315 KB) this button opens the modal directly. CT-02 exercises `UW_APPROVED → SIGNED` (INVOICE_CREATED path). | `customer.page.ts:225-231`; spec header `R1.53.0_fixSystemAgentUsernameInModificationReport.spec.ts:26` [confirmed via code]; exact per-status visibility → needs live UI |
| Spec coverage | **YES** — `R1.53.0_fixSystemAgentUsernameInModificationReport.spec.ts:262` (`changeToSigned('Automated - Change to Signed')`); conditional callers `new-application.spec.ts:397`, `smoke/portal-flow.spec.ts:274` | [confirmed via code] |
| Confidence | HIGH (locators/flow); MEDIUM on toast string |

### Set to Expired

| Attribute | Value | Evidence |
|---|---|---|
| Method | `setToExpired(comment = 'Automated - Set to Expired (#1315)')` | `customer.page.ts:294-315` [confirmed via code] |
| Trigger | `clickActionButton('Set to Expired')`; standalone getter `setToExpiredButton = button:has-text('Set to Expired')` | `customer.page.ts:295`, `:44` [confirmed via code] |
| Modal | "Add a Comment" rendered in `.modal.fade.show`. `SELECTORS.setToExpiredModal` = `[role='dialog']:has(input[name='comment'])` | `customer.page.ts:218,298`; `common.selectors.ts:112` [confirmed via code] |
| Field — comment | **OPTIONAL**. `SELECTORS.setToExpiredComment` = `input[name='comment']` (placeholder "Type here..."). Save stays enabled when empty; filled only if visible. | `customer.page.ts:219,302-304`; docstring `:278-282`; `common.selectors.ts:113` [confirmed via code] |
| Confirm | Label is **"Save"** (NOT "CONFIRM"/"Yes", no `.submit-button` class). `SELECTORS.setToExpiredConfirm` (`.last()`) = `button[type='submit']` OR `button:has-text('Save')` | `customer.page.ts:220,308-309`; docstring `:278-282`; `common.selectors.ts:116` [confirmed via code] |
| Cancel | not modeled in code | needs live UI |
| Success toast | captured + dismissed but **text not asserted** | `customer.page.ts:313` [inferred]; string → needs live UI |
| Status gating | CT-01 exercises `UW_APPROVED → EXPIRED`. DOM contract verified LIVE qa2 lead 16728, 2026-06-18 (per docstring). | `customer.page.ts:275-276`; spec `R1.53.0...spec.ts:25` [confirmed via code]; per-status visibility → needs live UI |
| Spec coverage | **YES** — `R1.53.0_fixSystemAgentUsernameInModificationReport.spec.ts:184, 340, 529` | [confirmed via code] |
| Confidence | HIGH (locators/flow); MEDIUM on toast string |

### Cancel Lease

| Attribute | Value | Evidence |
|---|---|---|
| Method | `cancelLease(comment, refundAllPayments = false): Promise<string>` (returns toast text) | `customer.page.ts:768-898` [confirmed via code] |
| Pre-step | `dismissAlertBar()` first — the alert bar can overlap the button (`text=Hide Alert`) | `customer.page.ts:751-758,770` [confirmed via code] |
| Trigger | `expandActionsMenu()` + `button:has-text('Cancel Lease')`, clicked `{force:true}`, **up to 5 retry attempts** | `customer.page.ts:784-799` [confirmed via code] |
| Modal | detected by a comment input: `.modal.show textarea, .modal.show input[name="comment"], .modal.show #comment` | `customer.page.ts:802-803` [confirmed via code] |
| Field — comment | **REQUIRED** (filled unconditionally; failure to fill aborts the attempt) | `customer.page.ts:826-835` [confirmed via code] |
| Field — refund | **OPTIONAL checkbox**, checked only when `refundAllPayments=true`: `.modal.show input[name="refundAllPayments"]` (falls back to any `input[type=checkbox]`) | `customer.page.ts:838-846` [confirmed via code] |
| Confirm | `.modal.show button:has-text("Cancel Lease")` clicked `{force:true}`; fallback = last button in `.modal-footer` | `customer.page.ts:852-882` [confirmed via code] |
| Cancel | not modeled in code (Escape used only on retry/abort) | needs live UI |
| Success toast | returned; asserted in specs as containing **"cancel"** (case-insensitive) | `customer.page.ts:893`; `lease-cancellation.spec.ts:244,322,407` [confirmed via code]; full string → needs live UI |
| Status gating | Spec note: **"Cancel Lease button is only available from SIGNED onwards"**. Post-cancel internal status → `UW_APPROVED`. | `lease-cancellation.spec.ts:10,254,333,414` [confirmed via code] |
| Spec coverage | **YES** — `lease-cancellation.spec.ts`: SIGNED no-refund `:239`, FUNDING no-refund `:317`, FUNDING with-refund `:403` (`true`); `protection-plan-cancellation.spec.ts:142` (`true`) | [confirmed via code] |
| Confidence | HIGH |

### Modify Approval Amount

| Attribute | Value | Evidence |
|---|---|---|
| Method | `modifyApprovalAmount(newAmount, comment): Promise<string>` (returns toast text) | `customer.page.ts:710-737` [confirmed via code] |
| Trigger | `clickActionButton('Modify Approval Amount')`; visibility probe `isModifyApprovalAmountVisible()` | `customer.page.ts:711,742-746` [confirmed via code] |
| Field — amount | **REQUIRED**. `SELECTORS.approvalAmountInput` = `#approvalAmount` (cleared then filled) | `customer.page.ts:714-717`; `common.selectors.ts:206` [confirmed via code] |
| Field — comment | filled (`SELECTORS.commentInput` = `#comment`), cleared then filled | `customer.page.ts:721-723`; `common.selectors.ts:204` [confirmed via code] |
| Confirm | last `.btn-primary` (`SELECTORS.buttonPrimary`) | `customer.page.ts:728-729`; `common.selectors.ts:120` [confirmed via code] |
| Cancel | not modeled in code | needs live UI |
| Toast — rejection | contains **"Given Approval amount is greater"** when amount > merchant max | `modify-approval-amount.spec.ts:116-117` [confirmed via code] |
| Toast — success | contains **"Successfully changed approval amount"** | `modify-approval-amount.spec.ts:164-167` [confirmed via code] |
| Status gating | Lead must be status "approved" with signed-lease "false" (Phase 2). **Merchant role must NOT see the button** (Phase 5 hard-fail on non-sandbox; sandbox grants elevated merchant perms). | `modify-approval-amount.spec.ts:80-87,~196+` [confirmed via code] |
| Spec coverage | **YES** — `modify-approval-amount.spec.ts:113` (reject) and `:158` (success) | [confirmed via code] |
| Confidence | HIGH (both toast strings asserted in spec) |

### Modify Lease

| Attribute | Value | Evidence |
|---|---|---|
| Method | `modifyLease(callback): Promise<string>` (callback manipulates invoice items; returns toast text) | `customer.page.ts:1076-1142` [confirmed via code] |
| Trigger | `clickActionButton('Modify Lease')` | `customer.page.ts:1077` [confirmed via code] |
| Modal 1 — confirm | **ALWAYS appears first**: a centered dialog "Please confirm you want to modify the lease:" with a chargeback caution + CANCEL / **Continue** buttons. Label is exactly "Continue" (cap C). `SELECTORS.modifyLeaseWarningContinue` = `.modal.show button:has-text('Continue'), [role='dialog'] button:has-text('Continue')`, clicked via JS-dispatch (React swaps the dialog for the form mid-click). | `customer.page.ts:1079-1094`; `common.selectors.ts:411-412` [confirmed via code] |
| Modal 2 — form | The "Lease #..." invoice form mounts only after Continue; readiness signal = `SELECTORS.naNumberOfItems` (`#numberOfItems`) visible. Add-item form renders persistently, NOT gated by deleting existing items. | `customer.page.ts:1097-1106`; `common.selectors.ts:523` [confirmed via code] |
| Field manipulation | done inside the caller `callback(page)` — typically `deleteAllInvoiceItems()` then add line items via the invoice fields (see next section) | `customer.page.ts:1109`; `modify-lease.spec.ts:94-98` [confirmed via code] |
| Save | `SELECTORS.modifyLeaseSaveButton` = `.modal.show button:has-text('SAVE'\|'Save')`; fallbacks `SELECTORS.saveButton` then any `Save`/`SAVE`/`type=submit` | `customer.page.ts:1120-1133`; `common.selectors.ts:413,122` [confirmed via code] |
| Toast handling | ADD toast ("Item added successfully") dismissed before Save to avoid a strict-mode collision with the lease-modified toast | `customer.page.ts:1111-1118` [confirmed via code] |
| Toast — assertions | below-minimum → `/minimum\|min\|below\|less than\|invoice saved/i`; at FUNDING → `/FUNDING\|SETTLED\|SIGNED/` | `modify-lease.spec.ts:486-488,587` [confirmed via code]; exact success string → needs live UI |
| Status gating | exercised at SIGNED (`:133`), CONTRACT_CREATED (`:276`), FUNDING (`:547+`). Successful reduce keeps `uown_los_invoice.invoice_status = ADDED_TO_CART` (not CANCELLED). | `modify-lease.spec.ts:133,276,141-142,547` [confirmed via code] |
| Spec coverage | **YES** — `modify-lease.spec.ts:94, 237, 455, 547` | [confirmed via code] |
| Confidence | HIGH (flow/locators); MEDIUM on success toast string |

### Settle Lease

Not an action-bar modal — reached via the **Documents → Lease card**, not via `clickActionButton`.

| Attribute | Value | Evidence |
|---|---|---|
| Method | `settleLeaseViaDocuments()` (also a simpler `submitSettlement()`) | `customer.page.ts:558-627`, `:629-636` [confirmed via code] |
| Trigger | Documents card → Lease panel header (`SELECTORS.leasePanelHeader` = `[class*="customer-info-panels_documentsItemHeader__"]`, header text literally "Lease") → next sibling `.mb-5` → contract title button (`SELECTORS.leasePanelContractTitleButton` = `[class*="...contractItem__titleButton__"]`) | `customer.page.ts:577-594`; `common.selectors.ts:653,658` [confirmed via code] |
| Modal | `#customer-lease-modal, #customer-overview-modal` | `customer.page.ts:598` [confirmed via code] |
| Field — confirm checkbox | **REQUIRED**. `SELECTORS.isConfirmedForSettlement` = `#isConfirmedForSettlement`, checked before submit | `customer.page.ts:607-609`; `common.selectors.ts:202` [confirmed via code] |
| Confirm | last `.btn-primary` in the modal | `customer.page.ts:612-617` [confirmed via code] |
| Cancel | not modeled in code | needs live UI |
| Success toast | captured but **non-fatal** — code explicitly tolerates no toast | `customer.page.ts:619-625` [confirmed via code]; string → needs live UI |
| Status gating | Prerequisite: lead must be in **SIGNED** status (e-sign complete); docstring routes CI/no-esign tests to the settlement API instead | `customer.page.ts:324-325` [confirmed via code] |
| Spec coverage | **Indirect only** (no dedicated settle spec) — called inside `unified-flow.spec.ts:247`, `new-application.spec.ts:408`, `credit-card-decline-check.spec.ts:217`, `paytomorrow-refund-flow.spec.ts:230`, `smoke/portal-flow.spec.ts:281`, `tests/ci/unified-flow.spec.ts:247` | [confirmed via code] |
| Confidence | HIGH (locators); toast string unknown |

---

## Invoice / lease creation flow

Driver: `createInvoiceWithItems(items[], options)` (`customer.page.ts:952-1034` [confirmed via code]).

**Trigger — "Add New":** `createLeaseButton = xpath=//div[text()='Lease']/../div[text()='Add New']` (the "Add New" control next to the "Lease" header) (`customer.page.ts:46,969-970` [confirmed via code]).

**Per-line-item fields** (each loop iteration; all `#`-id inputs from `common.selectors.ts`):

| Field | Param | Locator | Required? | Evidence |
|---|---|---|---|---|
| Number of items | `numberOfItems` | `#numberOfItems` (`naNumberOfItems`) | required (filled always) | `customer.page.ts:978`; `common.selectors.ts:523` |
| Item code | `itemCode` | `#itemCode` (`naItemCode`) | required | `customer.page.ts:979`; `common.selectors.ts:524` |
| Description | `description` | `#itemDescription` (`naItemDescription`) | required | `customer.page.ts:980`; `common.selectors.ts:525` |
| Price | `price` | `#basePricePerItem` (`naBasePricePerItem`) | required | `customer.page.ts:981`; `common.selectors.ts:526` |
| Delivery fee | `deliveryFee?` | `#deliveryFee` (`naDeliveryFee`) | optional (defaults `0.00`) | `customer.page.ts:984-987`; `common.selectors.ts:527` |
| Installation fee | `installationFee?` | `#installationFee` (`naInstallationFee`) | optional (defaults `0.00`) | `customer.page.ts:988-991`; `common.selectors.ts:528` |
| Misc fee | `miscFee?` | `#miscFee` (`naMiscFee`) | optional (defaults `0.00`) | `customer.page.ts:992-995`; `common.selectors.ts:529` |
| (add item) | — | `naSubmitItemLease` = `button[type='submit']:has-text('Submit'), ... :has-text('Add Item'), :has-text('ADD')` | per-item submit | `customer.page.ts:998-999`; `common.selectors.ts:530` |

**Invoice-level fields** (after all items):

| Field | Param | Locator | Required? | Evidence |
|---|---|---|---|---|
| Sales person | `salesPerson` | `#salesPerson` (`naSalesPerson`) | filled if visible | `customer.page.ts:1007-1010`; `common.selectors.ts:531` |
| Invoice number | `invoiceNumber` | `#invoiceNumber` (`naInvoiceNumber`) | filled if visible | `customer.page.ts:1011-1014`; `common.selectors.ts:532` |
| Settlement confirm | — | `#isConfirmedForSettlement` | checked if visible | `customer.page.ts:1017-1020`; `common.selectors.ts:202` |
| Submit invoice | — | last `.btn-primary` | required | `customer.page.ts:1023` |

**Program-selection modal** (`selectProgram(programName)`, private; default `programName = 'Bi-Weekly'`): appears after invoice submit. Modal `SELECTORS.modalContent` = `.modal-content`; the program is chosen by `button:has-text("<programName>")`, then confirmed via the first `.btn-primary` inside the modal (`customer.page.ts:1032-1066`; `common.selectors.ts:87` [confirmed via code]). If the modal does not appear it is skipped (`:1042-1045`).

**Delete-all line items** (`deleteAllInvoiceItems(): Promise<number>`): clicks every `svg[data-icon="trash-can"]` via `dispatchEvent(MouseEvent)` (the React handler is on the SVG, not the `#deleteActionIcon` wrapper; SVG has no `.click()`), waiting for the row count to drop each pass, safety cap 20 (`customer.page.ts:904-941` [confirmed via code]).

**Spec coverage:**
- `createInvoiceWithItems` — **NOT used by any spec** (grep over `tests/` returns no callers) [confirmed via code]. Untested through the page object.
- `deleteAllInvoiceItems` — **used** in `modify-lease.spec.ts:97,239,457` and `lease-cancellation.spec.ts:147` [confirmed via code].
- `selectProgram` — private; exercised only transitively via `createInvoiceWithItems`, i.e. effectively uncovered [inferred].

Confidence: HIGH for field/locator inventory; the end-to-end creation path is unproven (no spec drives it).

---

## Sales Rep panel inline edit

Inline (no separate modal) editor on the lead-detail page, `customer.page.ts:1292-1442`.

| Attribute | Value | Evidence |
|---|---|---|
| Edit trigger | `SELECTORS.salesRepEditButton` = `#MerchantInfo-edit` (note: method names say "SalesRep" but the real id is `#MerchantInfo-edit`; docstring's `#SalesRep-edit` is illustrative only) | `customer.page.ts:1339-1341`; `common.selectors.ts:646` [confirmed via code] |
| Controls | Two comboboxes in fixed order — **Merchant (index 0)**, **Location (index 1)** — via `SELECTORS.filterControlResilient` = `.filter__control, [role="combobox"]`. Positional indexing, intentionally not label-based (stg renders titles as `<div>`, qa2 as `<label>`). | `customer.page.ts:1307-1319`; `common.selectors.ts:41` [confirmed via code] |
| Set Merchant | clear (`filterClearIndicator` `.filter__clear-indicator`) → click → type → pick `SELECTORS.filterOption` by text → wait `filterMenuPortal` to close | `customer.page.ts:1354-1384`; `common.selectors.ts:37,61,64` [confirmed via code] |
| Set Location | same pattern (`setSalesRepLocation`) | `customer.page.ts:1389-1417` [confirmed via code] |
| Save | `saveSalesRepPanel()` clicks `SELECTORS.salesRepSaveButton` = `.collapsableEdit__button__primary[...]`; waits for it to disappear (panel collapses) | `customer.page.ts:1424-1432`; `common.selectors.ts:647` [confirmed via code] |
| Read-back | `getSalesRepMerchantValue()` reads `filterSingleValue` then label-adjacent text | `customer.page.ts:1449-1459`; `common.selectors.ts:63` [confirmed via code] |
| Success toast | returned by `saveSalesRepPanel()` but **no spec asserts it** | `customer.page.ts:1437` [inferred]; string → needs live UI |
| Status gating | Docstring: **edit only works when lead status is `UW_APPROVED` or `CONTRACT_CREATED`** | `customer.page.ts:1336` [confirmed via code]; enforcement-in-UI → needs live UI |
| Spec coverage | **NONE** — `openSalesRepEdit` / `setSalesRepMerchant` / `setSalesRepLocation` / `saveSalesRepPanel` / `getSalesRepMerchantValue` have zero callers in `tests/` | [confirmed via code] |
| Confidence | MEDIUM-HIGH (locators in code, but completely untested) |

---

## Activity Log entries (Rule #13)

| Attribute | Value | Evidence |
|---|---|---|
| Method | `getActivityLogEntries(): Promise<string[]>` reads `SELECTORS.activityLogEntry` rows | `customer.page.ts:1148-1157`; `common.selectors.ts:414` [confirmed via code] |
| Selector | xpath matching the Activity card's `div[role='row']` or `tr` rows | `common.selectors.ts:414` [confirmed via code] |
| Spec coverage | **NONE** — `getActivityLogEntries` has no callers in `tests/` | [confirmed via code] |
| Known caveat | The modify-lease spec documents that the **Origination activity-log card DOM does NOT match this UI selector** (no `div[role='row']` / `tr`), so activity-log validation is done via DB instead: `SELECT COUNT(*) FROM uown_los_lead_notes WHERE lead_pk = $1 AND notes LIKE '%SendInvoiceService%'` | `modify-lease.spec.ts:146-156` [confirmed via code] |

**Rule #13 implication:** per CLAUDE.md ("no log = nothing is happening"), every action above should produce an activity log / note. Because the UI selector is known-unreliable on this page, the proven validation path is the DB table `uown_los_lead_notes` (and `uown_lead_modifications` for status changes — see the R1.53.0 spec, which asserts `agent_username` + the lead-note for Change-to-Signed / Set-to-Expired). The UI `getActivityLogEntries` getter should be treated as suspect until re-validated live.

---

## Connections with what we already knew

- **Read view companion:** [`origination-customer-lead-detail-page.md`](origination-customer-lead-detail-page.md) covers the static panels/labels of the same page; this doc is the write/action counterpart. Use them together when scoping a lead-detail test.
- **Portal map:** [`origination-portal-map.md`](origination-portal-map.md) for where the lead-detail page sits in the Origination IA.
- **Status-change agent identity:** the Change-to-Signed and Set-to-Expired modals are the UI under test in `R1.53.0_fixSystemAgentUsernameInModificationReport.spec.ts` (the `uown_lead_modifications.agent_username` "SYSTEM" fix). The portal `username` HTTP header carried by these modals' XHRs is the load-bearing detail — see `customer.page.ts:229-231,281-282`.
- **Off-screen action button** is a known pitfall (referenced as `[[application-lifecycle]]` in `customer.page.ts:91`); the JS-dispatch trigger in `clickActionButton` is the project-standard mitigation.

## Gaps / to investigate (live-UI-only)

1. **Rendered toast strings** for Change to Signed, Set to Expired, Settle Lease, Sales Rep save, and Modify Lease success — captured in code but never asserted. Only Modify Approval Amount and Cancel Lease have asserted substrings.
2. **Full per-status action matrix** — which of {Change to Signed, Set to Expired, Cancel Lease, Modify Approval Amount, Modify Lease, Settle, Move to Servicing, E-Sign, Fund, Get Document Status} render for each lead/internal status, and per role. Code only proves isolated points (Cancel = SIGNED+; Modify Approval = approved/non-merchant; Sales Rep edit = UW_APPROVED/CONTRACT_CREATED).
3. **Cancel buttons / dismiss affordances** of each modal — not modeled in code.
4. **Invoice creation end-to-end** (`createInvoiceWithItems` + program modal) is **untested** by any spec; the program-modal button labels (e.g. exact "Bi-Weekly" vs "Bi-Weekly Payment Program") need live confirmation.
5. **Sales Rep inline edit** is fully untested; confirm `#MerchantInfo-edit` is the live id and that the panel is the "Sales Rep" panel (naming mismatch between method names and the id).
6. **Activity-log UI selector** (`activityLogEntry`) is documented as not matching this page's DOM — re-derive a working selector live or formalize DB-only validation.

**Skills loaded:** `.claude/skills/discovery/SKILL.md`

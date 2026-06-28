---
title: New York (NY) GowSign Lease/Rental-Purchase Template
domain: knowledge-base
status: snapshot
volatility: volatile
last_verified: 2026-06-18
sources:
  - env: qa2
  - lead: 16651
  - code: src/data/state-merchant-matrix.ts#expectedProvider
  - db: uown_esign_document
covers: [gowsign, esign, new-york, epo, template-rendering]
promoted_to: []
---

# New York (NY) GowSign Lease/Rental-Purchase Template

> Charter: Explore the New York GowSign contract signing in qa2 with Playwright MCP to discover provider routing, the rendered contract title (NY vs other-state leak), dynamic-variable resolution, and the EPO clauses — for the 13-month term (NY has no 16m template).
> Origin: GitLab uown/backend — "UOWN | SVC | Add New York GowSign Template" (Fernando Martins) — Signwell → GowSign migration.
> Overall confidence: **high** for routing, title/state-scoping, dynamic values, and the `epoDays` render defect (DB `request` + rendered iframe + backend log, fresh data 2026-06-18, lead 16651). **gap** for partner-portal reach (PayTomorrow) and the Signwell baseline diff.
> Env: **qa2**. Lead driven this run: **16651** (TireAgent `OW90218-0001`, customer state NY, 13m). Siblings: [[16m-lease-and-gowsign-signwell-routing-qa2]], [[alabama-gowsign-template]], scenarios `.claude/oracles/ohio-gowsign-template.md`. Skill base: [[gowsign-knowledge]].

## Purpose

UOWN is migrating contract signing from **Signwell** (legacy) to **GowSign** per US state. The New York template `NY_2025_SAC` was added in this task. QA must verify the GowSign NY contract renders the NY consumer rental-purchase agreement with the correct state-scoped copy, the EPO/Promotional-Payoff sections, and all dynamic values, vs the Signwell baseline — across the Origination/partner signing flows. Customer-facing: the lessee signs this in the consumer signing flow.

## Available Operations

| Operation | Available? | Notes |
|---|---|---|
| Route NY lead → GowSign | ✅ | ONLINE merchant + customer state NY + 13m → `NY_2025_SAC`. `[confirmed]` lead 16651 |
| Render NY GowSign contract | ✅ | 16-page HTML inside `gowsign-app-dev-uown.azurewebsites.net` iframe, class `alternative-contract-vendor_iframe__nSb3A` |
| Complete signing ceremony | ✅ | Lead **16661** signed end-to-end → `lead_status=SIGNED`, `uown_esign_document.status=SIGNED`, `doc_signed_time_stamp` set (2026-06-18). See "Signing completion" below |
| 16-month NY template | ❌ | **No NY 16m row exists.** Only `NY_2025_SAC` (pk16, `term_months=null` = base/13m) |

## Provider routing for NY — GowSign 13m (refutes the stale matrix)

- **NY routes to GOWSIGN** in qa2 for a 13-month lease. `[confirmed]` (DB + UI): lead **16651** → `uown_esign_document` **pk13851** `client='GOWSIGN'`, `document_name='NY_2025_SAC'`, `status='SENT_TO_CUSTOMER'`; signing iframe `https://gowsign-app-dev-uown.azurewebsites.net/document/b013f527-...?embedMode=true`.
- **This is the FIRST NY lead to exercise the GowSign template.** All prior NY `uown_esign_document` rows are **SIGNWELL** with the legacy template `NY_SAC_LEASE_AGREEMENT` v110 (latest 2026-05-26). They are NOT a contradiction: `NY_2025_SAC` (pk16) was **created 2026-05-28**, after every historical NY lead. `[confirmed]` (DB `row_created_timestamp`).
- **Contradiction (= discovery):** `src/data/state-merchant-matrix.ts` NY row still says `expectedProvider: 'SIGNWELL'`, `validMerchant: 'TerraceFinance'`. That is the **stale dated matrix** (same drift that hit OH and AL; rule #16). Live DB template availability is authoritative → **NY is now GowSign (13m)**. **Action: update the matrix NY row to GOWSIGN.**
- Routing rule (unchanged, [[16m-lease-and-gowsign-signwell-routing-qa2]]): `effectiveState = INSTORE ? merchant.state : customerState`; GowSign template exists for `(effectiveState, client_type)` → GOWSIGN, else merchant `esign_client` (SIGNWELL). TireAgent is ONLINE → customer state NY drives the lookup; its own `esign_client` does **not** force the provider.
- **Term:** TireAgent (non-Kornerstone ONLINE) caps at 13m in qa2 — log `EligibleTerms 13`, `paymentDetailsList` returned only `[13]` (`planId=WK13`). NY has **no 16m template**, so the 13m path is exactly the GowSign scope. A 16m NY lease (if ever offered) would fall back to Signwell. `[confirmed]`.

## Flow and States (step by step in the UI)

Renderable recipe (UOWN gateway, completable with the standard card — TireAgent does NOT hit the Kornerstone OMNIFUND wall):

1. `sendApplication` (state NY, merchant TireAgent `OW90218-0001`, non-9 SSN) → `getApplicationStatus` APPROVED.
2. `sendInvoice` → `paymentDetailsList` single **13m** entry (`planId=WK13`, redirectUrl `secure-qa2.uownleasing.com/{shortCode}/complete?planId=WK13`).
3. Open the redirectUrl in the browser → **CC pre-authorization page** ($40 hold). Fill cardholder (last name = applicant last name, see BR-02) + `VISA_APPROVED` card → Submit.
4. → **Terms of Agreement** page (first payment, EPO summary, 13-month plan, items, two consent checkboxes) → check both → **Proceed to signature**.
5. → lead reaches `CONTRACT_CREATED`, `uown_esign_document` row created (`client=GOWSIGN`), and the **GowSign signing modal** opens (`role=dialog` → cross-origin iframe, contract renders as 16-page accessible HTML, status `SENT_TO_CUSTOMER`).

| From → To | Triggering event | Allowed? |
|---|---|---|
| UW_APPROVED → CONTRACT_CREATED | CC pre-auth Submit (valid card + matching last name) + accept Terms + Proceed to signature | ✅ `[confirmed]` |
| (CC pre-auth) → rejected | cardholder last name ≠ applicant last name | ❌ blocked — BR-02 ("Credit Card is invalid.") |
| (submitApplication via API) → blocked | API-only path, no browser | ❌ `Neuro Id verification Failed` — BR-04 |
| CONTRACT_CREATED → SIGNED | GowSign Start → adopt → **Sign All** → confirmation dialog **Finish** | ✅ `[confirmed]` lead 16661 |

## Business Rules

- **BR-01 — Title is state-scoped to NY; no wrong-state leak.** Rendered primary heading **`"CONSUMER RENTAL-PURCHASE AGREEMENT-NY"`**; body `"In this Consumer Rental-Purchase Agreement-NY, … refer to Mollie, LLC, dba Uown, as Lessor."`; LESSEE `"New York, NY 10001"`. **State-leakage check: PASS** — the only non-NY state in 1,347 snapshot lines is **Florida**, and exclusively as the Lessor's corporate domicile/forum boilerplate (`Tampa, FL 33612`); governing law defers to "the state where you are domiciled" (NY), not a hardcoded state. No TX/OH/CA/AL. `[confirmed]` (UI snapshot + screenshot `ny-gowsign-contract-16651-top.png`).
- **BR-02 — Pre-auth rejects when cardholder last name ≠ applicant last name.** UNDOCUMENTED backend validation (`[UownClient][checkCCLastNameMatch]`), surfaced as `"Credit Card is invalid."`. Fix: set cardholder last name = `uown_los_customer.last_name`. `[confirmed]` this run (failed with "Doe", passed with "TestLNkf"). Same as [[alabama-gowsign-template]] BR-02 → candidate pitfall for [[application-lifecycle]].
- **BR-03 — Pre-auth completes with `VISA_APPROVED` (5146…) on the UOWN gateway.** TireAgent's `/complete` page hosts a `tst.kaptcha.com` fraud-signal iframe but does NOT block the standard card — the earlier rejection was BR-02 (last-name), not kaptcha. The Kornerstone OMNIFUND/kaptcha wall ([[16m-lease-and-gowsign-signwell-routing-qa2]] § blocker) is **Kornerstone-specific**, not a property of every `/complete` page. `[confirmed]`.
- **BR-04 — API-only signing is blocked by NeuroID.** `setupApplicationViaApi({ submitPaymentInfoViaApi: true })` → `submitApplication` returns `error: "Failed to verify identification"`; log `[UownClient][submitApplication] Neuro Id verification Failed`. The contract can only be rendered by driving the consumer flow in a **real browser** (Playwright MCP), which generates the behavioural signals NeuroID requires. `[confirmed]`.
- **BR-05 — NY uses "Rental-Purchase" terminology, not "Lease-Purchase" — and this MATCHES Signwell.** The whole NY template reads "Consumer Rental-Purchase Agreement", "rental payment", etc. The description of this feature (and the OH/AL siblings) describes it as "lease-purchase", but the **Signwell NY baseline (`NY_SAC_LEASE_AGREEMENT` v110) renders the same title: "Consumer Rental-Purchase Agreement-NY"**. So GowSign did NOT deviate — "Rental-Purchase" is the approved NY wording (NY consumer-lease law). `[CONFIRMED — not a defect]` (Signwell DOCX line 942 vs GowSign heading). The legacy template's internal *name* says "LEASE_AGREEMENT" but its rendered title is "Rental-Purchase".

## ✅ BR-06 / Defect (RESOLVED 2026-06-21) — `epoDays` token blank in the NY contract (customer-visible)

> **✅ FIXED in qa2 for R1.53.0 (backend confirmed via DB 2026-06-21).** A fresh NY GowSign lead created today (**16812**, `uown_esign_document` pk13972, SENT_TO_CUSTOMER) carries **`epoDays="90"`** in the `document.variables` map, and **no `[DocumentDispatchService][GowSign] … missing … [epoDays]` log** is emitted on any of today's NY leads (16812–16819) — contrast lead 16684 (2026-06-18), which had `epoDays` ABSENT + the missing-token log. So the backend now supplies the token. `[CONFIRMED — backend/DB]` (primary source: live qa2 `uown_esign_document.request` + `uown_los_lead_notes`). UI-render re-confirmation ("within 90 days" in the iframe) is pending the next green run of `ny-gowsign-template.spec.ts` — the spec's CT-03 was flipped from a `test.fail` guard to a positive assertion to lock the fix in. The historical defect analysis below is retained as a dated record (rule #16).

---

The NY template references `{{epoDays}}` but **(pre-fix, ≤2026-06-18)** the backend did not populate it.

- **Backend log (lead 16651):** `[DocumentDispatchService][GowSign] leadPk=16651 variables map missing 1 simple template token(s): [epoDays]`.
- **Source confirmation (`uown_esign_document.request`, pk13851):** the `variables` map sent to GowSign includes `epoExpiryDate=09/15/2026`, `payOffStartDateAfterEpoExpiry=09/16/2026`, `epoFeeText=" plus a BuyOut Fee of $60.00, "` — but **no `epoDays` key**.
- **Rendered effect (iframe, 2 places):**
  - **Item 4 Promotional Payoff Option:** "During the first **___** days from the date of your Initial Payment (Item 2), you can buy the Property by paying the Cash Price, $ 2290.69, less all rental payments…" — number absent.
  - **EARLY PURCHASE OPTIONS § item 1:** "Purchase the Property within **___** days from the date that your Initial Payment becomes due and pay only $ 2550.44, including tax." — number absent.
- The system knows the value is **90** (Servicing UI "90 Day Early Purchase Option"; EPO start `09/16/2026` ≈ 90 days after the 06/24 initial payment) but does not inject it into the contract sentences.
- **🔴 Confirmed REGRESSION vs Signwell baseline:** the Signwell NY contract (`NY_SAC_LEASE_AGREEMENT` v110, DOCX line 11190) renders **"Purchase the Property within 90 days from the date that your Initial Payment becomes due and pay only $…"** — the **"90" is present**. GowSign leaves the same sentence blank. So Signwell populates this value and GowSign does not → this is a **migration regression**, not merely an isolated GowSign quirk. `[CONFIRMED]` (Signwell DOCX vs GowSign render — answers AC-2 / Testing Steps directly).
- Impact: a legally material EPO window renders blank in the signed PDF → **High** (data integrity + legal correctness). Same class as the Daniel's Jewelers CA empty-placeholder bug ([[gowsign-knowledge]] pitfall #1, rule #14) and [[alabama-gowsign-template]] BR-06 (AL was missing `payOffDiscountPercent, epoDays, nextPaymentDueAmount`). `[CONFIRMED]` (backend log + source `request` + rendered iframe + Signwell baseline diff).

## Logic and Exceptions — dynamic values (source of truth = `uown_esign_document.request` pk13851)

Template `templateId=jj8kz4tn88l655hrjrqmqkux` (= `NY_2025_SAC`). All values resolved (except `epoDays`):

| Variable | Value | Rendered label / location |
|---|---|---|
| contractAmount | `5295.87` | TOTAL OF PAYMENTS / Total Cost |
| costOfLease | `3045.18` | COST OF LEASE |
| costPrice | `2250.69` | CASH PRICE (Price-Tag box) |
| costPriceWithFeeNoTax | `2290.69` | "Cash Price" in Item 4/4a — **$40 (= processingFee) higher than costPrice** |
| nextPaymentDueAmountWithTax | `93.85` | weekly payment w/ tax (Terms UI + ACH) |
| firstPaymentDueAmount / …WithTaxAndFees | `86.20` / `133.85` | Initial Rental Payment / Total Initial Payment |
| salesTax | `7.65` | Tax line |
| processingFee | `40.00` | Processing Fee |
| nsfFee | `20.00` | Returned Payment Charge |
| numOfMonths / totalNumberOfPayments | `13` / `56` | term / # of payments |
| paymentFrequencyDesc | `WEEKLY` | RENTAL PERIOD |
| payOffAmountBeforeEPOExpiry | `2550.44` | Promotional Payoff amount / 90-Day EPO |
| epoExpiryDate / payOffStartDateAfterEpoExpiry | `09/15/2026` / `09/16/2026` | EPO window |
| epoFeeText | `" plus a BuyOut Fee of $60.00, "` | BuyOut Fee $60.00 |
| companyInfoBrandPhone | `(877)357-5474` | Lessor phone |
| vendorName | `Mollie LLC` | footer Lessor |
| contractNumber | `UOWN_68404_16651` | Agreement Number |
| leaseItems | Ottoman `$500.00` / Recliner `$300.00` | Description of the Property |
| earlyPurchaseOption | 56-row EPO chart (pay1 `126.20`/EPO `2350.69` … pay56 `86.20`/`40.91`) | EPO-Amount table |
| **epoDays** | **(missing)** | **blank — BR-06 defect** |

- **[OBSERVATION] "Cash Price" shown two ways:** Price-Tag box uses `costPrice` `$2250.69`; Item 4/4a use `costPriceWithFeeNoTax` `$2290.69` ($40 = processing fee). Two distinct source variables both labelled "Cash Price" — likely intentional, confirm with product whether the dual figure is expected.
- Parties: LESSOR "Mollie, LLC, dba Uown" / "Uown", `10500 University Center Dr. Suite 150, Tampa, FL 33612`; LESSEE "Testfnkf Testlnkf", `792 Broadway Unit 7-0kf, New York, NY 10001`. Lessor pre-signed "D.Klein, Leasing Representative"; Lessee has a `Sign` button + 16 per-page Customer Initials boxes; PreAuth consent `YES` checked.

## Signwell vs GowSign — Content Parity (AC-02 / Scenario 3 / Testing Steps)

Baseline = the legacy Signwell NY template **`NY_SAC_LEASE_AGREEMENT` v110** ("Lease Agreement.docx"), extracted from `uown_esign_document.base64document_string` (a **DOCX** with Signwell text-tags, NOT a PDF) for lead **16400** (pk13772), text parsed offline. Compared against the GowSign NY render (lead 16651). **Caveat:** the two are different leads/carts, so the diff is at the level of **clause structure, titles, wording and which fields get populated** — not value-for-value equality (which is governed by [[gowsign-knowledge]] pitfall #3 money-tolerance when same-lease capture is available). This is exactly Fernando's Testing Step: *"gowsign follows the same patterns and text used in signwell, and the data was populated properly."*

**Live cross-env confirmation (qa1, 2026-06-18):** the SAME flow (TireAgent `OW90218-0001`, customer state NY, 13m) driven through the consumer signing UI in **qa1** routes to **SIGNWELL** — the rendered modal is the real SignWell iframe `https://www.signwell.com/docs/38cb29c258/?signwell_embedded_iframe=1`, document "Lease Agreement.docx" (13 pages), provider `signwellMatch=true`/`gowsignMatch=false` (lead 12309, screenshot `qa1-signwell-ny-12309.png`). qa1 has no NY GowSign template → NY falls back to Signwell there, while qa2 (template `NY_2025_SAC` since 2026-05-28) routes the identical flow to GowSign. So **NY's pre-migration provider = Signwell** is confirmed live, not just from stored history. (SignWell renders as an image-based viewer — contract text is not in the DOM; the authoritative Signwell text remains the parsed DOCX above. qa1 DB was unreachable: `svc_user` auth failure — provider confirmed via the rendered iframe, not DB.)

| Contract element | Signwell NY (DOCX v110) | GowSign NY (`NY_2025_SAC`) | Verdict |
|---|---|---|---|
| Agreement title | "Consumer Rental-Purchase Agreement-NY" (L942) | "CONSUMER RENTAL-PURCHASE AGREEMENT-NY" | ✅ parity |
| PROPERTY PRICE TAG box | TOTAL OF PAYMENTS / COST OF LEASE / CASH PRICE / AMOUNT OF EACH PAYMENT / NUMBER OF PAYMENTS / RENTAL PERIOD | same 6 labels | ✅ parity |
| Description of Property table | Model# / Serial# / Condition / Item Price | Model# / Description / Serial# / Condition / Item Price | ✅ parity |
| Parties | "Mollie … as Lessor", LESSOR Tampa FL 33612, LESSEE block | identical | ✅ parity |
| Initial Payment / fees | Processing Fee, Returned Payment charge, Late Fee | Processing Fee $40, Returned Payment $20, Late Fee | ✅ parity |
| Item 4 / 4a — Promotional Payoff / Ownership | "Promotional Payoff Option" + ownership-formula clause | "4. Promotional Payoff Option" / "4a. Rental-Purchase Ownership" | ✅ parity |
| EARLY PURCHASE OPTIONS section | "EARLY PURCHASE OPTIONS", Promotional Payoff + Early Purchase Option, "Beginning {date}" | same structure | ✅ parity |
| EPO amortization chart | "Payment Number / Payment(plus tax) / EPO(plus tax)" (L13023) | same 3 headers + 56 rows | ✅ parity |
| State scoping | NY + Florida (Lessor domicile) only | NY + Florida (Lessor) only | ✅ parity |
| Signature / initials | `{{signature:1:y:customerSign}}`, `{{initial}}`, `{{check preauthyes/no}}` text-tags | Sign button + 16 per-page initials + PreAuth YES/No | ✅ parity (provider-native) |
| **EPO days ("within N days")** | **"within 90 days … pay only $…"** (L11190) — **populated** | **"within ___ days"** — **BLANK** | 🔴 **REGRESSION** |

**Net:** GowSign follows the same patterns and text as Signwell across the whole document. The one historical divergence — the `epoDays` value (BR-06: Signwell "90 days" vs GowSign blank) — was a confirmed migration regression on 2026-06-18 and **has since been FIXED in qa2 for R1.53.0** (lead 16812, `epoDays="90"` now in the variables map; see the BR-06 RESOLVED banner above). With that fix, GowSign NY reaches **full content + value parity** with the Signwell baseline. UI-render re-confirmation pending the next green spec run.

## Signing completion (AC-01 / Scenario 1-2 "signing completion") — CONFIRMED

A fresh NY 13m lead (**16661**, qa2, TireAgent) was driven through the GowSign signing ceremony end-to-end in the browser (2026-06-18):

- **DB result:** `lead_status=SIGNED`, `uown_esign_document` `client=GOWSIGN` / `document_name=NY_2025_SAC` / **`status=SIGNED`** / `doc_signed_time_stamp=2026-06-18T02:51:01`.
- **Activity log (rule #13):** `[EsignRedirectService][updateSignStatus] Update lead 16661 status instantly from CONTRACT_CREATED to SIGNED`; `[ContractService][isLeaseOrLeaseModSigned] … Sending webhook update`; `[ESIGNSERVICE][parseCCPeekConsent] CC Peek Consent set to true`. Screenshot `ny-gowsign-signed-complete-16661.png` (redirect `/appComplete?...&document_status=completed`).

**The exact GowSign ceremony sequence (live DOM, NY 16-page contract):**
1. `button "Start"` (#startSignatureButton) → reveals all `Customer Initials` field placeholders.
2. Click the **first** Initials field → opens the unified adoption wizard (tabs "1 Signature" / "2 Initials", **Type**/Draw mode, font buttons, Cancel/**Next**) → Next → **Save**.
3. After adoption the toolbar swaps to **`button "Sign All"`** + `Next Step` → click **Sign All** → auto-fills every remaining signature/initial field.
4. Toolbar swaps to **`button "Finish"`**, AND a **confirmation `dialog`** appears: *"All fields are complete. Click Finish to finalize your document."* with `Review Document` / **`Finish`**.
5. Click the **dialog's** `Finish` (f…1576) — NOT the toolbar `#finishSignatureButton`, which is intercepted by the dialog's `bg-black/25` overlay → redirect `/appComplete?...document_status=completed` → backend transitions lead to SIGNED.

**✅ Helper FIXED (`src/helpers/gowsign-signing.helper.ts`, 2026-06-18):** the original `signGowSignInFrame` clicked the toolbar `#finishSignatureButton`, which is **intercepted by the confirmation-dialog overlay** (`bg-black/25`) → click swallowed → lead stuck at CONTRACT_CREATED (lead 16657: `capturedCompleted:false`). Fix: the submit step now prioritises **`frame.getByRole('dialog').getByRole('button', { name: /^Finish$/i })`** (the dialog's Finish), with `#finishSignatureButton` kept as fallback for contracts without the dialog (e.g. CA), plus a post-loop safety net that clicks the dialog Finish if it appears after the state-machine loop. Validated: leads 16671 + the AC spec now reach `capturedCompleted:true` / SIGNED. `Sign All` itself was never the problem — it placed all fields; only the finalize step was wrong.

**🟢 Drift-prone resolution:** for a **completed GowSign** signing, `uown_esign_document.status = 'SIGNED'` (with `doc_signed_time_stamp` set), NOT `'COMPLETED'`. `[confirmed]` lead 16661. (`SENT_TO_CUSTOMER` is the sent state; `COMPLETED` was the [[gowsign-knowledge]] claim — for the lease esign-doc the signed value observed live is `SIGNED`. Cross-check before asserting — drift-prone, [[volatile-knowledge-registry]].)

## Connections with What Was Already Known

- **Confirms** [[16m-lease-and-gowsign-signwell-routing-qa2]] routing rule (provider = template availability, not `esign_client`) and its template map NY row (pk16, 13m-only).
- **Confirms** [[gowsign-knowledge]] pitfall #1 (empty-placeholder render class), pitfall #7 (iframe host `gowsign-app-dev-uown.azurewebsites.net`, class `alternative-contract-vendor_iframe__nSb3A`), and the `SENT_TO_CUSTOMER` status enum.
- **Confirms** [[alabama-gowsign-template]] BR-02 (CC last-name match), BR-03 (UOWN gateway completable with standard card), and the missing-EPO-token defect family (AL+NY both drop `epoDays`).
- **Contradicts** `state-merchant-matrix.ts` NY = SIGNWELL → stale; live = GOWSIGN 13m (update needed).
- **New:** BR-04 (API-only blocked by NeuroID for this flow); BR-05 (NY uses "Rental-Purchase" wording); BR-06 (`epoDays` blank in NY).

## Gaps / To Investigate

- **Partner-portal reach (Scenario 2).** **TireAgent** leg ✅ — the ONLINE merchant `OW90218-0001` (customer-state-driven) was driven to a completed GowSign NY signing (leads 16651/16661). **PayTomorrow leg 🔴 BLOCKED by env wiring** (cannot exercise NY GowSign):
  - All PayTomorrow merchants (ProgressMobility / PayTomorrow / MSAPowersports) authenticate against **`merchant-staging.paytomorrow.com`**, whose embedded UOWN contract iframe is **`secure-sandbox.uownleasing.com/{token}/complete`** (`src/pages/origination/paytomorrow-portal.page.ts:579`). So the PayTomorrow staging portal creates leads in **UOWN sandbox**, not qa2. `[confirmed]` (merchant config + page object).
  - The NY GowSign template `NY_2025_SAC` exists **only in qa2** (created 2026-05-28); **sandbox routes through Signwell/PandaDocs** ([[gowsign-knowledge]] rollout note). Sandbox DB could not be queried to confirm the template's absence (only the qa2 tunnel, port 5445, is open), but the two confirmed facts — PT→sandbox and NY-GowSign=qa2-only — are sufficient: **a NY lead via PayTomorrow renders the Signwell/PandaDocs NY contract, never the GowSign `NY_2025_SAC`.** `[inferred-high]`.
  - The reference flow `tests/e2e/origination/paytomorrow-refund-flow.spec.ts` also forces **16m via SSN-916** (a sandbox/qa1 BlackBox mock) — and NY has **no 16m GowSign template** — so even the term is wrong for NY GowSign.
  - **To unblock PayTomorrow GowSign-NY coverage:** deploy `NY_2025_SAC` to **sandbox**, OR have a PayTomorrow account wired to **qa2** — neither exists today (dev/infra dependency, not a test gap). `handleContractPage` already imports `signGowSignInFrame`, so the portal-side signing would work once a lead routes to GowSign.
- ~~**Signwell baseline diff (AC-02 / Scenario 3).**~~ **DONE** — see "Signwell vs GowSign — Content Parity" above. Baseline taken from the stored Signwell DOCX (`NY_SAC_LEASE_AGREEMENT` v110, lead 16400) since qa2 NY now routes to GowSign and **stg DB is unreachable from this machine** (the `env-query.mjs` `ENV=stg` silently falls back to qa2 — it reads `ENV` from the `.env` file, not the shell). Confirmed: Signwell renders "within **90** days", GowSign blank → **regression**. **Remaining sub-gap:** a true *same-lease, same-cart* side-by-side (Fernando's literal step) for value-for-value equality — would need a fresh Signwell NY render (stg with DB access, or a 16m NY lead that falls back to Signwell via a Kornerstone merchant, blocked by the OMNIFUND card wall).
- **`epoDays` scope.** Confirm whether the missing `epoDays` is NY-only or shared across the 2025_SAC templates (AL already showed it). Likely a shared `DocumentDispatchService` token-binding gap → one fix covers multiple states. Verify on FL/GA/PA.
- ~~**Signing ceremony not completed**~~ **DONE** — lead 16661 signed end-to-end → SIGNED + signed-contract activity log captured (see "Signing completion" above). Surfaced a helper gap (confirmation-dialog Finish) to fix in impl.
- **Title wording sign-off (BR-05).** Get product/legal confirmation that "CONSUMER RENTAL-PURCHASE AGREEMENT-NY" is the approved NY title before freezing the assertion.

## Evidence / Artifacts

- Lead **16651** (qa2): `uown_esign_document` **pk13851** = GOWSIGN / `NY_2025_SAC` / SENT_TO_CUSTOMER; `uown_los_lead_notes` has the `[GowSign] … missing … [epoDays]` log; `request` JSON = the full resolved variables map.
- Throwaway driver: `tests/api/__scratch_ny_signing_url.spec.ts` (`ENV=qa2`) — mints the NY 13m lead + prints the consumer signing URL. Delete after the task closes.
- Screenshot: `ny-gowsign-contract-16651-top.png` (rendered title + parties); `ny-gowsign-signed-complete-16661.png` (post-signing completion).
- Signing completion: lead **16661** (qa2) — `lead_status=SIGNED`, esign `SIGNED` + `doc_signed_time_stamp`, activity log `[EsignRedirectService][updateSignStatus]` + `[ContractService]…SIGNED` + `parseCCPeekConsent…true`.
- **Automated AC suite (green — `3 passed`):** `tests/e2e/gowsign/ny-gowsign-template.spec.ts`. Run: `ENV=qa2 npx playwright test tests/e2e/gowsign/ny-gowsign-template.spec.ts --project=cross-portal`.
  - **Test 1 (PASS):** state-scoping/no-leak (Scenario 4) + values & no-raw-tokens (AC-04) + signing completion → SIGNED + activity log (AC-01 / Scenario 1, UOWN direct origination flow).
  - **Test 2 (PASS):** AC-02 / Scenario 3 — GowSign render contains the full Signwell NY content baseline (`SIGNWELL_NY_BASELINE` clauses + title parity); AND AC-03 deep — every key money variable from `uown_esign_document.request` (contractAmount, costPrice, costPriceWithFeeNoTax, costOfLease, salesTax, processingFee, nextPaymentDueAmountWithTax, firstPaymentDueAmount, payOffAmountBeforeEPOExpiry, term counts, brand phone) is asserted **value-for-value** against the rendered contract.
  - **Test 3 (`test.fail` guard):** asserts the EPO Promotional-Payoff day-count renders — **expected-failure until `epoDays` is fixed; flips to red (remove `test.fail`) when the dev populates the token.**
  - Caveat: AC-02 compares against a committed Signwell-derived baseline (clauses confirmed in the actual Signwell DOCX during discovery), not a live two-provider PDF diff. Test data uses `realistic:false, uniqueAddress:true` (realistic mode randomly emits a backend-invalid `# unit` address ~50% of runs).
- Throwaway drivers (delete on task close): `tests/api/__scratch_ny_signing_url.spec.ts`, `tests/e2e/gowsign/__scratch_ny_signing_completion.spec.ts` (superseded by the AC spec), `src/scripts/_scratch_extract_signwell_pdf.mjs`.
- Full rendered-contract snapshot: 16-page accessibility tree (1,347 lines) captured via Playwright MCP.
- **Signwell baseline:** lead 16400 `uown_esign_document` pk13772 = SIGNWELL / `NY_SAC_LEASE_AGREEMENT` v110, `base64document_string` = "Lease Agreement.docx" (Signwell text-tag template). Extractor: `src/scripts/_scratch_extract_signwell_pdf.mjs <esignDocPk> <outName>` (read-only; decodes base64 → DOCX → text). Delete after the task closes.

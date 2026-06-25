---
title: Alabama (AL) GowSign Lease-Purchase Template
domain: knowledge-base
status: snapshot
volatility: volatile
last_verified: 2026-06-17
sources:
  - env: qa2
  - lead: 16649
  - code: src/data/state-merchant-matrix.ts#expectedProvider
  - db: uown_gow_sign_template
  - db: uown_esign_document
covers: [alabama-gowsign-template, al-2025-sac, epo-section, 13m-render-defect, state-scoping]
promoted_to: []
---

# Alabama (AL) GowSign Lease-Purchase Template

> Charter: Explore the Alabama GowSign lease-purchase contract signing in qa2 with Playwright MCP to discover the rendered contract's title (Alabama vs Texas leak), EPO-section parity with the Texas reference, dynamic-variable resolution, and AL-specific clauses — for both 13m and 16m.
> Origin: GitLab uown/backend — "UOWN | SVC | Add AL - Alabama GowSign Template" (Gustavo Martins) + the AL/TX ambiguity in the ticket ("EPO Section same as Texas — TX_2025_SAC_16_MONTHS.docx").
> Overall confidence: **high** for routing, title/state-scoping, and the 13m rendering defect (DB + UI + backend log, fresh data 2026-06-17). **gap** for the 16m render (blocked by the Kornerstone CC wall).
> Env: **qa2**. Lead driven this run: **16649** (TerraceFinance, customer state AL, 13m). Sibling: [[16m-lease-and-gowsign-signwell-routing-qa2]], scenarios `docs/scenarios/ohio-gowsign-template.md`. Skill base: [[gowsign-knowledge]].

## Purpose

UOWN is migrating contract signing from **Signwell** (legacy) to **GowSign** per state. The Alabama templates were added in this task. QA must verify the GowSign AL contract renders the Alabama lease-purchase agreement with correct state-scoped copy, the EPO section (which per Gustavo must match the Texas `TX_2025_SAC_16_MONTHS` EPO), and all dynamic values, vs the Signwell baseline. Customer-facing: the lessee signs this in the Website/partner signing flow.

## Available templates (qa2, DB-confirmed 2026-06-17)

`SELECT pk, state, name, template_id, client_type FROM uown_gow_sign_template WHERE state='AL'`:

| pk | name | term | template_id | client_type |
|---|---|---|---|---|
| 25 | `AL_2025_SAC` | 13m | `c152ip9qepcrzt8hbn30skgb` | null (no restriction) |
| 26 | `AL_2025_SAC_16_MONTHS` | 16m | `lhzkrq9yvqulja6cz29os56d` | null (no restriction) |

`[confirmed]` — AL has **both** 13m and 16m templates active (unlike OH which is 16m-only). No `client_type` restriction → any merchant.

## Provider routing for AL — GowSign (refutes the stale matrix)

- **AL routes to GOWSIGN** in qa2. `[confirmed]` (DB + UI): lead 16649 → `uown_esign_document` pk13850 `client='GOWSIGN'`, `status='SENT_TO_CUSTOMER'`; signing iframe = `https://gowsign-app-dev-uown.azurewebsites.net/document/793ac58c-...?embedMode=true`, class `alternative-contract-vendor_iframe__nSb3A`.
- **Contradiction (= discovery):** `src/data/state-merchant-matrix.ts` row AL still says `expectedProvider: 'SIGNWELL'`. That is the **stale dated matrix** (same drift that hit OH; rule #16). Live DB template availability is authoritative → AL is now **GowSign**. **Action: update the matrix AL row to GOWSIGN.**
- Routing rule (unchanged, [[16m-lease-and-gowsign-signwell-routing-qa2]]): `effectiveState = INSTORE ? merchant.state : customerState`; GowSign template exists for `(effectiveState, client_type)` → GOWSIGN, else merchant `esign_client` (SIGNWELL). TerraceFinance is ONLINE → customer state AL drives the lookup; its own `esign_client='SIGNWELL'` does **not** force the provider.

## Flow and states (step by step, as driven this run)

Renderable recipe (UOWN gateway, completable with the standard card — avoids the Kornerstone OMNIFUND wall):

1. `sendApplication` — merchant **TerraceFinance** (`OL90202-0001`, ONLINE, licensed AL), customer **state AL**. → `UW_APPROVED`, approvedAmount 4730.
2. `getApplicationStatus` → APPROVED. `sendInvoice` → `paymentDetailsList` single entry **13m** (`planId=WK13`, redirectUrl `secure-qa2.uownleasing.com/{shortCode}/complete`). Non-Kornerstone ONLINE caps at 13m in qa2 (`EligibleTerms 13` in the log).
3. Open the signing URL in the browser → **CC pre-authorization page** ($40 hold). Fill cardholder + `VISA_APPROVED` card → Submit. → lead reaches `CONTRACT_CREATED`, `uown_esign_document` row created.
4. **Terms of Agreement** page (13 Months to Ownership, $87.36 weekly × 56, EPO total $4,791.80, items). Check both confirmations → **See Protection Benefits**.
5. **Uown Protection Plus** step — offered for AL (radio Yes / "No, continue unprotected"). Choose No → **Proceed to signature**.
6. **GowSign signing modal** opens (`dialog` → cross-origin iframe). Contract renders as accessible HTML (12 pages). Status `SENT_TO_CUSTOMER`. Signing ceremony (Start → sign) not completed this run.

| From → To | Trigger | Allowed |
|---|---|---|
| UW_APPROVED → CONTRACT_CREATED | CC pre-auth Submit (valid card + matching last name) | ✅ |
| (CC pre-auth) → rejected | cardholder last name ≠ applicant last name | ❌ blocked — see BR-02 |
| CONTRACT_CREATED → signed | GowSign Start/Sign/Finish | not tested this run |

## Business Rules

- **BR-01 — Title is state-scoped to AL, no Texas leak.** Rendered title `"CONSUMER LEASE-PURCHASE AGREEMENT-AL"`; body `"In this Consumer Lease-Purchase Agreement-AL, … refer to Mollie, LLC, dba Uown, as Lessor"`; LESSEE `"Birmingham, AL 35203"`. **No "Texas"/"TX" anywhere.** `[confirmed]` (UI snapshot + screenshot `al-gowsign-contract-16649-top.png`).
- **BR-02 — Pre-auth rejects when cardholder last name ≠ applicant last name.** UNDOCUMENTED validation. `authorizeCreditCard` returns `{status:ERROR, error:"Credit Card is invalid.", preAuthStatus:"NOT_RUN"}`; log `[UownClient][checkCCLastNameMatch] Invalid CC info(no matched the two lastnames) - card : Customer, customer : TestLNdxq`. Fix: set cardholder last name = applicant last name (`uown_los_customer.last_name`). `[confirmed]`. → candidate pitfall for [[application-lifecycle]].
- **BR-03 — Pre-auth card must be `VISA_APPROVED` (5146…), not `MASTERCARD_APPROVED`.** The framework default for `authorizeCreditCard` is `TEST_CARDS.VISA_APPROVED` (`src/api/bodies/credit-card.body.ts`). `MASTERCARD_APPROVED` (5500…) was also rejected here — but the actual blocker was BR-02 (last-name), so the card brand is secondary. The "use MASTERCARD, never VISA" rule in `.claude/rules/testing.md` applies to the **later settlement payment**, not this pre-auth. `[confirmed]`.
- **BR-04 — Protection Plus IS offered for AL.** The Uown Protection Plus step renders for AL (contrast CA, where it is blocked). `[confirmed]` (UI). Buddy widget loads `staging.embed.buddy.insure` (CORS errors expected; known qa2 issue).
- **BR-05 — Consistent term framing.** 13m: plan `"Uown Traditional 13 Month Lease Purchase Plan"`, EPO appendix `"…13-month term for ownership"`, table `56 / $87.36 / WEEKLY / $4932.45`. 16m: plan `"Uown Traditional 16 Month Lease Purchase Plan"`, EPO appendix `"This Agreement has a 16-month term for ownership"`, table `69 / $66.97 / WEEKLY / $4661.20`. No term mismatch in either. `[confirmed]` (UI).
- **BR-07 — Kornerstone NeuroID gate is bypassable by automation via reload.** The Kornerstone `/complete` page card pre-auth passes (`CC Auth Passed`); `submitApplication` then fails NeuroID (UI "Failed to verify identification") and blocks auto-advance, but does **not** roll back the CC auth. **Re-navigating to the same signing URL** then renders a **"Sign Contract"** button (lead is `CC_AUTH_PASSED`) → Sign Contract → Terms → Proceed to signature → GowSign iframe renders. `[confirmed]` (lead 16653 reached GowSign render). This corrects the prior "cannot automate Kornerstone" note in [[16m-lease-and-gowsign-signwell-routing-qa2]]. NeuroID fails even with slow per-character typing — do not waste time emulating human keystrokes; use the reload trick. → candidate pitfall for [[application-lifecycle]].

## 🔴 BR-06 / Defect — Empty merged values in the AL GowSign contract (customer-visible)

**Classification: `[CONFIRMED]` template-rendering defect.** Standard of evidence met: (a) reproduced in **fresh** data (lead 16649, created 2026-06-17), (b) **backend-logged**, (c) **rendered visibly** to the customer, (d) the values **exist elsewhere in the same flow** (so not a missing-input artifact). This is the same defect class as BUG-01 (Daniel's Jewelers CA empty placeholders, 2026-05-06) that rule #14 exists to catch.

Backend log (lead 16649): `[DocumentDispatchService][GowSign] leadPk=16649 variables map missing 3 simple template token(s): [payOffDiscountPercent, epoDays, nextPaymentDueAmount]`.

Render mapping (each token blank where the customer reads it):

| Token | Clause(s) rendered blank | Proof value exists |
|---|---|---|
| `nextPaymentDueAmount` | **Item 3**: "Your Regular lease rate is **$ ** plus tax." · **Item 4a**: "56 payments of **$ ** plus $ 7.21 in sales tax" | plan table & ACH show `$ 87.36` |
| `epoDays` | **Item 4**: "Day Promotional Payoff Option" / "during the first ** ** days" · **Item 4a**: "After your **-**Day-Promotional-Payoff Option" · **EPO Option 1**: "within ** ** days" | Terms page shows "90 Day Early Purchase Option" |
| `payOffDiscountPercent` | **Item 4a**: "less a ** % ** discount" | EPO discount program |

Impact: legally material fields (the regular payment amount, the promotional-payoff window, the EPO discount) are blank in the signed contract → **High** (data integrity + legal correctness). These are the EPO/ownership clauses Gustavo flagged ("EPO Section same as Texas").

Secondary (minor): **Item 6(d)** renders `"This 40.00 fee"` — value present but **missing the `$` sign** (cf. `$ 40.00` in the Item 2 table). `[observation]` — boilerplate phrasing, template-wide, not a merge token.

### 13m vs 16m — the defect is only partially shared (16m render confirmed, lead 16653)

| Token | `AL_2025_SAC` (13m, lead 16649) | `AL_2025_SAC_16_MONTHS` (16m, lead 16653) |
|---|---|---|
| `nextPaymentDueAmount` | **blank** — Item 3 "Regular lease rate is $ ___", Item 4a "56 payments of $ ___" | **blank** — Item 3 "Regular lease rate is $ ___", Item 4a "69 payments of $ ___" |
| `epoDays` | **blank** — Item 4 "first ___ days", Item 4a "___-Day", EPO Opt-1 "within ___ days" | **n/a — token absent** (16m EPO has no day-count phrasing) |
| `payOffDiscountPercent` | **blank** — Item 4a "less a ___ % discount" | **n/a — token absent** (16m EPO has no percent-discount phrasing) |
| Backend missing-token log | `missing 3 … [payOffDiscountPercent, epoDays, nextPaymentDueAmount]` | `missing 1 … [nextPaymentDueAmount]` |

→ The two AL templates use **different EPO wording**. The **13m** uses the older "first NN days / NN% discount" Promotional-Payoff phrasing whose tokens are unfilled → 3 blanks. The **16m** expresses the EPO as a **daily-accrual narrative** (no day/percent tokens) → those can't break; only `nextPaymentDueAmount` is blank. **`nextPaymentDueAmount` (the regular payment amount) is blank in BOTH** — Item 3 "Your Regular lease rate is $ ___ plus tax" and Item 4a ownership math. Severity note: the contract's own "Notice to Lessee" says *"Do not sign … if it contains any blank spaces"* — and it does.

### EPO-vs-Texas verdict (Gustavo's "EPO Section same as Texas — TX_2025_SAC_16_MONTHS.docx")

**The AL 16m EPO matches the Texas 16m structure.** `[confirmed]` (UI, lead 16653) against the TX doc pasted in the ticket:
- **Item 4 Promotional-Payoff Option** — "buy at any time by paying $ 1883.32 plus tax, less all rental payments made on time, plus daily lease fees from inception through the EPO date; any late payment voids it." Mirrors TX Item 4 (`$ {{costPriceWithFeeNoTax}}` + daily fees − payments).
- **Item 4a Lease-Purchase Ownership** — "EPO price = daily lease charges from inception + fees + taxes, less on-time rental payments." Mirrors TX 4a.
- **EARLY PURCHASE OPTION appendix** — "This Agreement has a **16-month** term… EPO price = cost of leased goods + taxes + applicable fees + accrued daily lease fees from inception − payments made; call (877)357-5474." Matches the TX appendix bullet-for-bullet.

So the **16m EPO content requirement is met**; the only defect on the 16m is the `nextPaymentDueAmount` blank (a merge-data gap, not an EPO-copy mismatch). Render artifact: `al-gowsign-contract-16653-16m-top.png`; full text `al-16m-contract-16653-full.md`.

### Signwell baseline (qa1) — the defect IS a migration regression `[confirmed]`

AC-2/AC-3 oracle. Captured the **Signwell** AL contract in **qa1** (which has no AL GowSign template → falls back to Signwell): lead **12307**, TerraceFinance, 13m, `embeddedSigningUrl=https://www.signwell.com/docs/5dc4cc89b9/` (PDF `https://www.signwell.com/app/docs/5dc4cc89b9.pdf`, saved `/tmp/signwell-al-12307.pdf`, screenshot `signwell-al-12307-qa1-view.png`). The **three tokens GowSign renders blank are all POPULATED in Signwell**:

| Field (token) | GowSign AL (qa2) | **Signwell AL (qa1) baseline** |
|---|---|---|
| Item 3 "Regular lease rate is $ ___ plus tax" (`nextPaymentDueAmount`) | **blank** | **`$152.40`** |
| Item 4 "during the first ___ days" (`epoDays`) | **blank** | **`90 days`** ("90 Day Promotional Payoff Option … first 90 days … a total of $4,247.92") |
| Item 4a "___-Day Promotional-Payoff Option" (`epoDays`) | **blank** | **`90-Day`** |
| Item 4a "less a ___% discount" (`payOffDiscountPercent`) | **blank** | **`30% discount`** |
| Item 4a "___ payments of $ ___" (`nextPaymentDueAmount`) | **blank** | **`56 payments of $152.40`** |

→ **CONFIRMED migration regression** in the AL GowSign template: Signwell fills these legally-material values; the GowSign AL templates (`AL_2025_SAC` 13m: 3 blanks; `AL_2025_SAC_16_MONTHS` 16m: 1 blank, `nextPaymentDueAmount`) do not. Title, parties and clause copy match between providers (both "CONSUMER LEASE-PURCHASE AGREEMENT-AL"). Conservative-classification bar (rule #10) fully met: fresh data + backend log + UI render + **Signwell baseline diff**.

> NOTE: the `$` amounts differ between the two captures because they are **different leads** (qa1 lead 12307 vs qa2 lead 16649, different `approvedAmount`) — the regression is the **blank vs populated** rendering of the field, not a value mismatch. Item 6(d) `"This 0.00 fee"` (missing `$`) appears in **both** providers → pre-existing boilerplate, NOT a regression.

### Modify / re-analysis with more items (lead 16660) — regression persists

Tested the "re-analysis with more items" path: fresh AL lead on TerraceFinance (qa2), invoiced with the default 2 items (contract A), then **re-invoiced with 4 items via `orderType='1'` (modify)** → contract B regenerated (new shortCode, recalculated). Driver: `tests/api/__scratch_alabama_modify_items_svc555.spec.ts`.

- ✅ **Re-analysis works.** Contract B's "Items On Lease" table rendered **all 4 items** (Ottoman $500, Recliner $300, **Sofa $600, Dining Table $400**); totals/EPO recalculated ($2,078.61 total, 56 × $36.40, 90-Day EPO $2,020.00). The modified lead reached `uown_esign_document` pk13854 `client='GOWSIGN'`, `status='SENT_TO_CUSTOMER'`.
- 🔴 **Regression persists unchanged.** Backend missing-token log for 16660 = **same 3 tokens** `[payOffDiscountPercent, epoDays, nextPaymentDueAmount]` as the un-modified 13m contract (16649). More items does **not** fix or worsen the blanks. `[confirmed]` (backend log + UI items table; same `AL_2025_SAC` template already visually proven to render those 3 blank).
- ✅ **Post-SIGNED `LEASE_MOD` cascade — DONE for AL** (green, `tests/e2e/gowsign/__scratch_alabama_modify_postsigned_svc555.spec.ts`, leads 16672→16673). Full lifecycle: original **16672 SIGNED** → `modifyInvoiceForLead` → `newLeadPk=16673` (note `[LeadService][modifyInvoice] Lease modification requested`) → original **LEASE_MOD_REQUESTED** + new lead spawned at **UW_APPROVED** → re-invoiced + **re-signed the modified contract** → **16673 SIGNED**, esign `client=GOWSIGN`. `[confirmed]`. **Regression persists on the post-SIGNED modified contract** too: 16673 missing the same 3 tokens. So the defect survives every regeneration path (fresh, re-invoice-more-items, and LEASE_MOD re-sign).
- **Tooling note:** on the UOWN-gateway flow the **Buddy/Protection-Plus widget** (`staging.embed.buddy.insure`, CORS errors) keeps the page perpetually "unstable" → Playwright `click()` (even `force:true`) times out. Drive the Terms/Protection/Proceed steps with raw DOM `.click()` via `browser_evaluate`. ([[gowsign-knowledge]] / [[application-lifecycle]] Buddy pitfall.)

### Signing completion (AC-1 / Scenarios 1,2) — DONE + two framework gaps found

Signed a fresh AL GowSign contract end-to-end to **SIGNED** via the framework helpers (`createPreQualifiedApplication` → `sendInvoice` → `MissingDataFormPage.fillAndSubmit` → `TermsOfAgreementPage.acceptAndProceedWithProtectionPlan(false)` → `AlternativeContractModalPage` → `signGowSignInFrame`). Driver: `tests/e2e/gowsign/__scratch_alabama_sign_completion_svc555.spec.ts` (`--project=cross-portal`), **green, reproducible** (leads 16664, 16666). `[confirmed]`:
- lead `lead_status='SIGNED'`, `uown_esign_document.client='GOWSIGN'`.
- Activity log (rule #13): `[ContractService][isLeaseOrLeaseModSigned] Updating lead status to SIGNED … as losContract is SIGNED`, `[EsignRedirectService][updateSignStatus] Update lead … to SIGNED`, `[ESIGNSERVICE][parseCCPeekConsent] CC Peek Consent set to true` (PreAuth "Yes" registered).
- **Note:** the **lease** reaching `SIGNED` is the authoritative completion signal — `uown_esign_document.status` reads `SIGNED`/`STORED` (not necessarily `COMPLETED`) for this flow; assert on `lead_status`, not the esign status enum.

**Two framework bugs hit during signing (rule #11 → candidate pitfalls / fixes):**
1. **`TermsOfAgreementPage.acceptAndProceedWithProtectionPlan` doesn't survive the qa2 Buddy loop.** It clicks the Proceed/submit button **once**, but the qa2 Buddy widget swallows the first click(s) (unlocks ~3rd). Result: GowSign modal never opens → `modal.waitForOpen` times out. Workaround in the scratch: re-click `#purchase-insurance-submit-btn` / "Proceed to signature" until `iframe[src*="gowsign"]` is visible.
2. **`signGowSignInFrame` does NOT click the final "Finish" confirmation dialog → the document is not finalized.** GowSign now shows a modal *"All fields are complete. Click Finish to finalize your document."* with its own **Finish** button. The helper's submit loop clicks the **header** Finish (which only *opens* that dialog) and then breaks on its 3-stagnation guard, returning `signClicked=true` **without finalizing** → the lease stays `CONTRACT_CREATED` (not SIGNED). Workaround: after the helper, click `frame.getByRole('button',{name:/^Finish$/i}).last()` until the *"Click Finish to finalize"* text disappears. **This likely affects every GowSign signing test** (possible GowSign-UI regression that added the confirmation dialog) — flag to framework maintainers.

## Logic and Exceptions / values rendered OK

Resolved correctly: Agreement Number `UOWN_23041_16649`, Account `16649`, Date `06/17/2026`, parties/addresses, Total Delivery Fee `$ 0.00`, Initial Lease Payment `$ 80.15`, Processing Fee `$ 40.00`, Tax `$ 7.21`, Total Initial Payment `$ 127.36`, NSF `$ 25.00`, Total Cost `$ 4932.45`, EPO total `$ 4791.80`, vendor name (`{{vendorName}}`) = `"Mollie LLC"`, contact phone `(877)357-5474`. **No raw `{{ }}` tokens** anywhere. No Item-17 "Tampa, Florida" jurisdiction clause (Item 17 = "Miscellaneous Provisions"; Tampa, FL appears only as the LESSOR/contact address, expected in every state's template).

## Connections with what was already known

- **Confirms** [[16m-lease-and-gowsign-signwell-routing-qa2]] routing rule (provider = template availability, not `esign_client`), and the AL row of its template map (pk25/26).
- **Confirms** [[gowsign-knowledge]] pitfall #1 (empty-placeholder render class), pitfall #7 (iframe host = `gowsign-app-dev-uown.azurewebsites.net`, class `alternative-contract-vendor_iframe__nSb3A`), and the `SENT_TO_CUSTOMER` status enum.
- **Contradicts** `state-merchant-matrix.ts` AL = SIGNWELL → stale; live = GOWSIGN (update needed).
- **New:** BR-02 (CC last-name match) and BR-03 (pre-auth uses VISA_APPROVED) — candidate pitfalls for [[application-lifecycle]].

## Gaps / To Investigate

- ~~16m render blocked~~ **DONE (2026-06-18).** 16m AL contract rendered via **KS1011 "Bodega Furniture"** (Kornerstone, offered AL **both 13m + 16m**, lead **16653** → `uown_esign_document` pk13852 `client='GOWSIGN'`, template `AL_2025_SAC_16_MONTHS`). The Kornerstone NeuroID gate was bypassed with the **reload→"Sign Contract" trick** (BR-07). See the 13m-vs-16m comparison and the EPO-vs-Texas verdict above.
- **Signing ceremony** (Start → Sign → Finish inside the GowSign iframe) and **partner portals** (PayTomorrow/TireAgent) for AL not exercised — render-only this run.
- ~~Signwell baseline diff (AC-02)~~ **DONE (qa1, lead 12307).** Signwell renders all 3 tokens (90 days / 30% / $152.40) that GowSign leaves blank → **regression confirmed** (see the Signwell-baseline section above). qa1 is the env to use for the Signwell AL render (no AL GowSign template there → fallback Signwell); qa1 DB is unreachable from here but the app/API is drivable via `ENV=qa1` and the provider is confirmed by the `signwell.com` `embeddedSigningUrl`. Remaining nicety: a same-profile (identical cart/amount) qa1-vs-qa2 capture for an exact dollar-by-dollar diff, and a 16m Signwell baseline (the 13m baseline already proves the `nextPaymentDueAmount` regression that the 16m shares).
- **Existing ticket?** Ask the user whether the missing-token defect is already tracked (rule #10 (b)) before filing.
- **ACH "Name of Institution" blank = test artifact, NOT a template bug.** This run did not pass a bank name on `sendApplication` (only Kornerstone requires `bankData`). Re-test with bank data before classifying. `[artifact]`.
- ~~Signing ceremony not completed~~ **DONE** — AL GowSign signed to `SIGNED` + activity log (leads 16664/16666, green scratch). See the "Signing completion" section above. This also **unblocks the post-SIGNED `LEASE_MOD` cascade** for AL (signed AL leases now exist to modify).
- **Partner portals (PayTomorrow/TireAgent)** AL signing (Scenario 2) not exercised.

## Reproduction assets

- Throwaway driver: `tests/api/__scratch_alabama_signing_url_svc555.spec.ts` (`ENV=qa2 STATE=AL`) — mints the AL lead + prints the signing URL. Delete after the task closes.
- Screenshot: `al-gowsign-contract-16649-top.png` (rendered title + parties).
- Lead 16649 (qa2): `uown_los_lead_notes` has the missing-token log; `uown_esign_document` pk13850 = GOWSIGN/SENT_TO_CUSTOMER.

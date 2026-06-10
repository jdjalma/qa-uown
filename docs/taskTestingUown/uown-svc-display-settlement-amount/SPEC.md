---
ticket: uown/frontend/servicing#512
title: UOWN | Servicing | Display Settlement Amount in Servicing Information Section
backend_release: R1.52.0 (svc — direct commits by @skaligineedi)
frontend_mr: uown/frontend/servicing!689 (merged)
environment: qa1 (primary), qa2 (smoke parity)
portal: Servicing (agent-facing)
owner_qa: jose.mendesdev
owner_po: Yuri
status: READY-FOR-IMPLEMENTATION
strategy: UI-first (Rule 14) — agent in Servicing portal
agent_handoff: qa-implementer
date: 2026-05-22
---

# SPEC — Settlement Amount Display (Servicing Information)

## 1. Source

- GitLab issue: `uown/frontend/servicing#512`
- Backend: new `SettlementAmountService` + `getSettlementAmount.sql` registered in `uown_sv_sql_config` as `GETSETTLEMENTAMOUNT` (uppercase). Endpoint `GET /uown/svc/getServicingInfo/{accountPk}` returns additive fields `settlementAmount: number` and `settlementAmountBreakdown: string[][]`.
- Frontend: `breakdown.tsx` refactored to accept legacy + new format; new clickable label "Settlement Amount" in "Account & Contract Overview" sub-panel of "Servicing Information"; clicking opens "Settlement Breakdown" modal.
- Email parity: `delinquencyOfferEmailSweep` (Fridays 13:00 prod) — same formula, separate SQL `correspondence/templates/fieldsSQL/delinquency-offer.sql` (duplication accepted by @yuri / @davi).

## 2. Scope

### IN
- **Visual rendering** of "Settlement Amount" label + value in panel — why: feature is customer-facing visible affordance (Rule 14 UI-first).
- **Click → modal open** behavior — why: AC explicit; whole label area must be clickable.
- **Breakdown modal content** — line items: Total Contract Amount, Total Payments, Days Delinquent, Offer Percent (display %), Total Fees, Protection Plan Fee (when applicable), Settlement Amount total — why: AC explicit.
- **Mathematical validation** of `Settlement = ((TCA − TP) × offer_percent) + Total Fees + Protection Plan Fee` — why: defines correctness oracle.
- **Off-by-one transitions** at delinquency boundaries (60/61, 90/91, 150/151) — why: AC implicit, BVA risk.
- **Eligibility filters**: account_status='ACTIVE', rating NOT IN ('B','C') OR NULL — why: explicit business rule; financial exposure if wrong.
- **Parity with Settlement Email** for delinquency-150 accounts (AC #2) — why: explicit AC; cross-source consistency.
- **Permission**: any user with `customer_information [access]` sees the field (validated with `test.tester` in qa1).
- **Brand coverage**: UOWN + Kornerstone (KS3015) — same formula, must render in both — why: KS is UOWN brand (memory `reference_kornerstone_is_uown_brand`).

### OUT
- **Settlement Email content/template QA** — why: out of #512; covered by separate sweep test.
- **Sweep `delinquencyOfferEmailSweep` scheduling & throttling** — why: backend job not part of frontend story.
- **Other panels of Servicing Information** (Lease Info, Customer Info) — why: not touched by !689.
- **Mobile viewport** — why: agent portal, desktop-only (Bootstrap `d-lg-block`).
- **Activity log entry on display** — Rule 13: display is read-only, NO log expected. Documented in §9 as expected absence.
- **API-only test of `getServicingInfo`** — why: Rule 14, UI-first; API used ONLY as oracle, not as primary path.
- **Performance test of N+1 (BUG-7)** — why: code-review finding, not user-visible scenario; logged in §10 for follow-up.

### AMBIGUOUS — Questions for @yuri (block decisions surfaced as scenarios)
- **Q-D2**: Should rating `P` (Payment Arrangement) suppress Settlement display? Today (qa1): renders full value (acc 4492). PO decision needed.
- **Q-D3**: When Settlement = $0.00 (ineligible), should the label be NON-clickable OR open a modal with explicit "Not eligible" message? Today: opens empty modal with only title+X (BUG-1).
- **Q-D8**: When `days_delinquent ≤ 60` (offer 100% → displayed as "0%"), is showing the label at all the desired UX? Or should it appear only when eligible discount exists (`days_delinquent > 60`)?

## 3. AC Coverage Mapping

| AC | Description | Scenarios |
|----|-------------|-----------|
| AC-1 | Settlement Amount visible in "Account & Contract Overview" column, below "Contract Balance" | A1, A2, A3, A4, E4, F1 |
| AC-2 | Value matches Settlement Email (delinquency-offer sweep) for same account/date | C5 |
| AC-3 | Click label → opens "Settlement Breakdown" modal | A2, A3, A4, B1, B4 |
| AC-4 | Modal shows breakdown lines (TCA, TP, days delinquent, %, fees, PP fee, total) | C1, C2, C3 |
| AC-5 | Ineligible accounts (rating B/C, non-ACTIVE) show $0.00 / no offer | B1, B2, B4 |
| AC-6 | Delinquency bands map to correct offer % (30/50/65) | A2, A3, A4, A5 |
| AC-7 (implicit) | Currency formatting consistent | D4, D5 |
| AC-8 (implicit) | Cross-brand (UOWN + Kornerstone) | E4 |

## 4. Risk Analysis (Rule 9 — Risk-Based Prioritization)

| Area | Risk | Why | Coverage |
|------|------|-----|----------|
| Off-by-one at delinquency boundaries | **High** | Financial offer changes 20pp at each boundary; backend uses `delinquency_as_of_date` vs `CURRENT_DATE`; aging seed accounts validate transitions | A5 (critical), A2/A3/A4 (band centers) |
| Eligibility filter (rating B/C) | **High** | Mis-filter = offering discount to ineligible high-risk accounts (loss) | B1, B2 |
| Email vs display parity | **High** | AC-2; two separate SQLs (duplication) — risk of drift | C5 |
| Modal opens empty when $0 | Medium | UX bug (BUG-1); user confusion | B-group scenarios click-and-verify |
| TCA mismatch panel vs breakdown | Medium | BUG-2; data integrity perception | A2 (acc 4322) explicit assertion |
| Rating P (Payment Arrangement) | Medium | Pending PO decision (Q-D2); behavior captured for regression | D2 |
| Currency formatting | Low | Cosmetic; pre-existing in EPO | D4, D5 logged |
| Days Past Due vs Days Delinquent | Low | Pre-existing data-source split; aging exposes it | D-group |
| Brand parity (Kornerstone) | Low | Same SQL — but explicit verification cheap | E4 |
| Permission visibility | Low | No dedicated permission; confirmed in catalog | F1 |
| Performance (2× SQL exec) | Out of scope | BUG-7; backend follow-up | — |

## 5. Test Strategy

- **Approach**: E2E via Servicing portal (browser). API `GET /uown/svc/getServicingInfo/{accountPk}` used as **oracle only** (DB/API cross-check). DB SELECT against `uown_sv_sched_summary`, `uown_los_lease`, `uown_sv_receivable`, `uown_email_queue` for assertion data.
- **Justification**: Rule 14 — feature has rendered UI affordance + clickable label + modal. API-only would miss BUG-1/BUG-4/BUG-5 (rendering-only defects).
- **Environments**:
  - **Primary**: `qa1` (all seed accounts mapped here).
  - **Smoke parity**: `qa2` for AC-1 only (label present + clickable) — guard against env-specific FE deploys.
- **Test data hierarchy** (Rule 9):
  - **Default (fresh via automation)**: aging via `UPDATE uown_sv_sched_summary SET delinquency_as_of_date = CURRENT_DATE − X` on dedicated seed accounts (4353/4355/4358/4359). User-authorized for this task (memory `feedback_no_db_mutation_to_force_pass` — aging is SETUP, not result-forcing).
  - **Exception (reuse existing seed)**: accounts 200, 4322, 3755, 4492 — pre-existing live data, justified by need to validate real email parity (acc 200 has actual `uown_email_queue` rows) and pre-existing fees/PP linkage.
- **Merchant preflight**: `skipMerchantPreflight: true` for ALL scenarios (Rule 12) — tests operate on existing leases.
- **Activity log validation** (Rule 13): Settlement display does NOT trigger a business action → NO log expected. Each scenario asserts ABSENCE of new `uown_los_lead_notes` row for the account during the test window (negative assertion documenting expected silence).
- **Cleanup** (mandatory): after every aged-account test, restore `delinquency_as_of_date` to original 60d seed value. Implementer must wrap aging in try/finally.
- **Suites to activate**: none new; add to existing `servicing-information` smoke if present; otherwise new tag `@settlement-amount`.

## 6. Scenarios

Scenarios grouped: **A** (band-by-band positive), **B** (ineligibility), **C** (breakdown content + parity), **D** (edge / pending decisions), **E** (brand), **F** (permission). Priority: P0 = blocker, P1 = high, P2 = nice-to-have.

---

### Group A — Delinquency bands (positive paths)

#### A1 — Band 0–60d (offer 100% → displayed "0%")
- **Priority**: P1
- **Technique**: Equivalence partitioning (band 0)
- **Persona**: Collections agent viewing recent delinquent account
- **Seed accounts**: 4091 (35d), 4093 (48d), 4319 (57d), 3756 (60d)
- **Setup**: none (use as-is); `skipMerchantPreflight: true`
- **UI steps**:
  1. Login as `test.tester` in Servicing qa1
  2. Navigate to account 4091 detail page
  3. Locate "Servicing Information" panel → "Account & Contract Overview" column
- **Assertions**:
  - "Settlement Amount" label visible directly below "Contract Balance"
  - Value renders (numeric, currency formatted)
  - Click label → modal "Settlement Breakdown" opens
  - Modal shows `Offer: 0%` (or product-decided per Q-D8)
  - Mathematical: displayed value === `(TCA − TP) × 1.00 + Total Fees + PP Fee` (oracle: API response)
- **Oracle**: `GET /uown/svc/getServicingInfo/4091`.settlementAmount; cross-check with raw SQL `GETSETTLEMENTAMOUNT` via DB read.
- **Pitfalls considered**: BUG-1 might trigger here if math = $0; explicit check that modal HAS content when in band 0.
- **Log assertion**: NO new row in `uown_los_lead_notes` for account_pk=4091 during test window.

#### A2 — Band 61–90d (offer 30%)
- **Priority**: P0 (most common collection band)
- **Technique**: Equivalence partitioning (band 1) + BUG-2 cross-check
- **Seed accounts**: 4322 (89d, has $15 late fee — exercises BUG-2), 3992 (71d), 3947 (90d boundary), 4183 (72d)
- **Setup**: none; `skipMerchantPreflight: true`
- **UI steps**: same nav pattern as A1 on account 4322
- **Assertions**:
  - Label + value present
  - Click → modal opens with: TCA, Total Payments, `Days Delinquent: 89`, `Offer: 30%`, Total Fees, Settlement total
  - Math: `Settlement = (TCA − TP) × 0.70 + Total Fees + PP Fee`
  - **BUG-2 explicit assertion**: TCA in panel === TCA in modal? Document discrepancy (panel adds fees; modal shows raw TCA). Captured as observation.
- **Oracle**: API getServicingInfo response.
- **Pitfalls**: late fee aggregation differs between panel `Contract Balance` and modal `TCA`.

#### A3 — Band 91–150d (offer 50%)
- **Priority**: P0
- **Seed accounts**: 4006 (122d), 3937 (94d), 4000 (97d), 4007 (108d)
- **Setup**: none
- **Assertions**: modal shows `Offer: 50%`; `Settlement = (TCA−TP) × 0.50 + fees`
- **Oracle**: API + DB `getSettlementAmount.sql` cross-check.

#### A4 — Band >150d (offer 65%)
- **Priority**: P0
- **Seed accounts**: 200 (1423d — also reused in C5 for email parity), 4359 if aged
- **Setup**: none
- **Assertions**: `Offer: 65%`; `Settlement = (TCA−TP) × 0.35 + fees`
- **Oracle**: API + email parity (deferred to C5 for full check).

#### A5 — Off-by-one boundary transitions (BVA)
- **Priority**: P0 (highest financial risk)
- **Technique**: Boundary value analysis at 60/61, 90/91, 150/151
- **Seed accounts (safe for aging)**: 4353, 4355, 4358, 4359 — all start ACTIVE, rating null, tca $2701.15, no PP fee
- **Setup** (per sub-case, wrap in try/finally restore to 60d):
  - A5.1 — age to 60d → expect offer 0% (band A1)
  - A5.2 — age to 61d → expect offer 30% (band A2)
  - A5.3 — age to 90d → expect offer 30%
  - A5.4 — age to 91d → expect offer 50% (band A3)
  - A5.5 — age to 150d → expect offer 50%
  - A5.6 — age to 151d → expect offer 65% (band A4)
- **DB setup**: `UPDATE uown_sv_sched_summary SET delinquency_as_of_date = CURRENT_DATE − N WHERE account_pk = 4353;` — user-authorized per task scope.
- **Cleanup mandatory**: restore to 60d original.
- **Assertions**: each sub-case → reload account page → modal `Offer%` value matches expected band.
- **Pitfalls**: BUG-6 — `Days Past Due` in panel may not refresh in same SQL refresh cycle as `Days Delinquent` in breakdown; assert against breakdown value (source of truth for offer).

---

### Group B — Ineligibility (negative paths)

#### B1 — Rating B
- **Priority**: P0
- **Seed accounts**: 2553 (rating B, 1250d)
- **Setup**: none
- **Assertions**:
  - Label visible (or hidden — Q-D3 pending); current behavior: visible with $0.00
  - Click label → modal opens (today: EMPTY — BUG-1) → ASSERT EXPECTED CORRECT behavior: modal SHOULD render "Not eligible for settlement" message OR label SHOULD NOT be clickable. **Test will FAIL today; passes when bug fixed.**
  - Value = $0.00
- **Oracle**: API `settlementAmount === 0`, `settlementAmountBreakdown === [] or null`

#### B2 — Rating C
- **Priority**: P1
- **Seed accounts**: 1185 (C, 1389d), 2552 (C), 3384 (C, 470d)
- **Setup**: none
- **Assertions**: same as B1; rating C filtered out.

#### B4 — Non-ACTIVE statuses
- **Priority**: P1
- **Seed accounts**: 107 (PAID_OUT), 1832 (CANCELLED)
- **Assertions**: $0.00; BUG-1 reproduction (empty modal on click).

---

### Group C — Breakdown content + Email parity

#### C1 — Breakdown line items (full set)
- **Priority**: P0
- **Seed account**: 4006 (122d, band A3) — has fees, no PP
- **Assertions**: modal lines present in order: `Total Contract Amount`, `Total Payments`, `Days Delinquent`, `Offer %`, `Total Fees`, `Settlement Amount`. No `Protection Plan Fee` line (none active).

#### C2 — Currency formatting in breakdown
- **Priority**: P2
- **Assertions**:
  - **BUG-4**: Total Fees=`0` (no `$`) vs Total Payments=`$269.64` → assert consistent `$X.XX` for both (FAILS today)
  - **BUG-5**: thousand separator inside modal (`$3127.57` vs panel `$3,127.57`) → assert consistent (FAILS today; pre-existing EPO behavior — logged not test-blocking)
- Test created at `expected correct` level; failing now, passing on fix.

#### C3 — Protection Plan Fee line
- **Priority**: P0
- **Seed accounts**: 3755 (PP $110, 372d), 3361 (PP $110, 330d), 3334 (PP $110, 358d)
- **Setup**: none
- **Assertions**:
  - Modal shows extra line `Protection Plan Fee: $110.00`
  - Settlement total includes PP fee additive
  - Math: `Settlement = (TCA−TP) × offer_percent + Total Fees + 110`
- **Oracle**: SQL filter `receivable_type=PROTECTION_PLAN_FEE AND status=ACTIVE AND due_date<=CURRENT_DATE`.

#### C5 — Email vs Display parity (AC-2)
- **Priority**: P0 (explicit AC)
- **Seed account**: 200 (1423d, band A4) — has historical `Delinquency150DayOfferEmail` rows in `uown_email_queue` (pks 222925, 223868, 224829)
- **Setup**: none — uses existing email queue rows; no resend needed (memory `feedback_email_imap_click_link` — don't bypass via API, but here we COMPARE values, not validate delivery).
- **Oracle**:
  1. Read latest sent email body for acc 200 from `uown_email_queue` (template `Delinquency150DayOfferEmail`)
  2. Extract offered settlement amount from email body
  3. Compare to UI display value (today's calc — note: email captures SETTLEMENT AT TIME OF SEND; display is live; assert delta ≤ tolerance OR rerun SQL `delinquency-offer.sql` for today and compare to UI today)
- **Assertion preferred**: rerun `delinquency-offer.sql` (email SQL) at test time → equals UI display (both are "now"). This isolates SQL parity from temporal drift.

---

### Group D — Edge cases / pending PO decisions (captures current behavior)

#### D2 — Rating P (Payment Arrangement)
- **Priority**: P1 — BLOCKED on Q-D2
- **Seed accounts**: 4492 (P, 45d, tca $9366), 4420, 4485, 4487, 4523
- **Setup**: none
- **Assertions (today's behavior)**:
  - Label visible, value = full computed settlement (no suppression)
- **Test stance**: write test as "captures current behavior pending Q-D2". When Yuri decides:
  - If P should be suppressed → flip assertion (label hidden / $0.00)
  - If P stays as-is → test stays
- **Decision question**: see §8 Q-D2.

#### D4 — Currency thousand separator
- **Priority**: P2
- Logged in C2 (BUG-5) — pre-existing.

#### D5 — Currency `$` symbol on zero
- **Priority**: P2
- Logged in C2 (BUG-4).

#### D6 — Days Past Due vs Days Delinquent split
- **Priority**: P2
- **Seed accounts**: aged 4353/4355/4358/4359
- **Assertion**: assert against `Days Delinquent` (modal) for band/offer computation; document panel `Days Past Due` may differ (BUG-6).

#### D8 — Display when `days_delinquent ≤ 60` (offer 0%)
- **Priority**: P1 — BLOCKED on Q-D8
- **Test stance**: capture current behavior (label visible with "0%"); flip if Yuri decides to hide.

---

### Group E — Brand parity

#### E4 — Kornerstone (KS3015 — 5th Ave Furniture NY)
- **Priority**: P1
- **Seed account**: 3944 (304d, KS3015, merchant_pk=7099)
- **Setup**: none; `skipMerchantPreflight: true`
- **Assertions**:
  - Label visible in Servicing for Kornerstone account
  - Modal opens, breakdown rendered
  - Math: same formula as UOWN (band >150 → offer 65%)
  - Brand-specific copy: none expected (same component); assert no Kornerstone-specific suppression.
- **Note**: Kornerstone is UOWN brand (memory `reference_kornerstone_is_uown_brand`) — same calc expected.

---

### Group F — Permission

#### F1 — Visibility under `customer_information [access]`
- **Priority**: P1
- **Setup**: login as `test.tester` (already validated has only `customer_information [access]`)
- **Assertions**:
  - Settlement Amount label is visible on account 4006
  - Click → modal opens (no permission denial)
- **F-collapse**: all F-scenarios merged into F1 — no dedicated Settlement permission exists in `environment/Uown.java` catalog (confirmed).

## 7. DOM Selectors (validated via MCP Playwright)

| Element | Selector strategy | Notes |
|---------|-------------------|-------|
| "Settlement Amount" label | `div` whose `textContent === 'Settlement Amount'` AND computed `cursor: pointer` | Implementer: prefer page object with `getByText('Settlement Amount', { exact: true })` filtered by clickable ancestor |
| Settlement value (panel) | sibling of label within same `Account & Contract Overview` column | Use `getByText` + relative locator |
| Modal "Settlement Breakdown" | `.modal-content` containing innerText match `Settlement Breakdown` | Wait for `state: 'visible'` |
| Modal close (X) | `.modal-content [aria-label="Close"]` | Standard Bootstrap modal |
| Breakdown rows | `.modal-content table tr` (or list — implementer to confirm via snapshot before implementing) | Implementer MUST verify structure via `mcp__playwright__browser_snapshot` before locator |

**Rule 15 reminder**: implementer must `browser_snapshot` the real DOM in qa1 (viewport ≥ 1440×900) before finalizing selectors. NO speculative selectors.

## 8. Open Questions (BLOCK final test fixation; SPEC captures current behavior)

| ID | Question | Owner | Impact |
|----|----------|-------|--------|
| Q-D2 | Should rating P (Payment Arrangement) suppress Settlement display? | @yuri | Flips D2 assertions; today: rendered full. |
| Q-D3 | When Settlement = $0.00 (ineligible), should label be non-clickable OR modal show "Not eligible" message? | @yuri | Fixes BUG-1; defines correct B-group assertion. |
| Q-D8 | Should label be hidden when `days_delinquent ≤ 60` (offer 0%) since no discount applies? | @yuri | Flips A1, D8 assertion (visible vs hidden). |

## 9. Activity Log (Rule 13)

**Settlement Amount display is read-only** — no business action triggered → NO entry expected in `uown_los_lead_notes`.

Each scenario MUST assert ABSENCE of new lead notes during test window (negative assertion):

```sql
SELECT COUNT(*) FROM uown_los_lead_notes
 WHERE account_pk = :pk
   AND created_at >= :test_start_ts;
-- Expected: 0
```

Documented as expected-silence, not a bug.

## 10. Bugs Section (separated)

| # | Severity | Classification | Bug | Scenario that exposes | Recommendation |
|---|----------|----------------|-----|------------------------|----------------|
| BUG-1 | UX (Medium) | **OBSERVAÇÃO** (pending Q-D3) | Empty modal on $0.00 settlement (label clickable, modal opens with only title+X) | B1, B2, B4 | File defect after Q-D3 answered; test written for correct behavior, failing now. |
| BUG-2 | Data integrity (Medium) | **OBSERVAÇÃO** | TCA panel ($3260.98 incl. fees) ≠ TCA modal ($3245.98 raw) on acc 4322 | A2 | Document; PO decision: align both? Test asserts breakdown value as source of truth. |
| BUG-3 | Business rule (Medium) | **OBSERVAÇÃO** (pending Q-D2) | Rating P shows Settlement | D2 | Test captures current; flips on decision. |
| BUG-4 | UX (Low) | **OBSERVAÇÃO** | `Total Fees: 0` (no `$`) vs `Total Payments: $269.64` — inconsistent currency | C2 | Frontend regex fix; test asserts `$X.XX` format universally. |
| BUG-5 | UX (Low) | **OBSERVAÇÃO** (pre-existing) | Currency without thousand separator inside breakdown ($3127.57) vs panel ($3,127.57) | C2 | NOT regression — same in EPO. Logged; not test-blocking. |
| BUG-6 | Display (Low) | **OBSERVAÇÃO** | `Days Past Due` panel ≠ `Days Delinquent` breakdown when account aged | A5, D6 | Different source fields; aging only updates one. Test asserts against breakdown value. |
| BUG-7 | Performance (Medium) | **CONFIRMADO** (code review) | `getServicingInfoForAccount` calls `getSettlementAmount()` 2× (value + breakdown) | code only — no UI scenario | Backend fix: single fetch returns both. Out of scope for this SPEC; file follow-up. |

## 11. Cleanup / Restoration (mandatory)

For each aged account (A5, D6), wrap in try/finally:

```ts
const SEED_DELINQUENCY_DAYS = 60;
try {
  await db.execute(`UPDATE uown_sv_sched_summary SET delinquency_as_of_date = CURRENT_DATE - $1 WHERE account_pk = $2`, [days, pk]);
  // ... test ...
} finally {
  await db.execute(`UPDATE uown_sv_sched_summary SET delinquency_as_of_date = CURRENT_DATE - $1 WHERE account_pk = $2`, [SEED_DELINQUENCY_DAYS, pk]);
}
```

**User authorization for these UPDATEs is granted for this task scope (Rule 9 exception, documented).**

## 12. Out-of-scope decisions

- We are NOT QA'ing the sweep `delinquencyOfferEmailSweep` itself (timing, throttling, recipient targeting). Only the SQL-output parity.
- We are NOT validating BUG-7 (performance) via UI — it's a backend follow-up.
- We are NOT testing mobile viewport — agent portal is desktop-only.
- We are NOT testing the `breakdown.tsx` legacy format (used by EPO) — only the new Settlement format. EPO regression is a separate suite.

## 13. Handoff

**Ready for: `qa-implementer`**

Implementer notes:
- Selectors must be confirmed via `mcp__playwright__browser_snapshot` in qa1 BEFORE coding (Rule 15).
- Aging UPDATEs require try/finally restore — non-negotiable.
- Use existing helpers for DB SELECT (oracle) and email queue read.
- Page object: extend existing `ServicingInformationPage` (or create if absent — check catalog first per Rule 2).
- API client: `getServicingInfo` likely exists in `ServicingClient`; reuse — check catalog first.
- Tag tests `@settlement-amount` + `@servicing-information`.
- Skip merchant preflight on every scenario (`skipMerchantPreflight: true`).

---
title: Website — Payment Frequency Change (`/payment-frequency`)
status: snapshot
volatility: volatile
last_verified: 2026-07-01
sources:
  - live: sandbox lead 98257 / account 17330
  - live: sandbox website#153 pipeline, accounts 17330-17376 (discovery + 3 validation cycles)
  - db: uown_frequency_mods
  - db: uown_sv_activity_log
  - db: uown_sv_receivable
  - api: POST /uown/svc/changePaymentFrequency
covers: [website-payment-frequency, payment-flexibility, semi-monthly, bi-weekly, first-payment-day, second-payment-day, frequency-mods, rewind-replay]
promoted_to: docs/business-rules/07-modificacoes-conta.md
---

# Website — Payment Frequency Change (`/payment-frequency`)

> Charter: Explore the Website customer portal "Payment Flexibility → Change your payment schedule" flow via Playwright MCP to discover the frequency-change dropdown, Semi-Monthly day validation, the Save endpoint/payload, and the DB/audit side effects — for GitLab website#153 (RU07.26.1.54.0).
> Origin: website#153 discovery gate (oracle-authoring pipeline, rule #19b) · Overall confidence: high (live sandbox, fresh account)

## What it is for

Lets a logged-in Website customer self-service change their lease payment frequency (Weekly / Bi-Weekly / Semi-Monthly) to align with their paycheck cycle. Entry point: sidebar **Payments → Payment Flexibility** → landing page `/payment-flexibility` (two cards: "Move a payment date" and "Change your payment schedule") → **VIEW MY OPTIONS** on the second card → `/payment-frequency`.

## Available operations

| Operation | Available? | Notes |
|---|---|---|
| View current frequency | ✅ | "Current Plan" card, label **"Current Frequency"**, value e.g. "Bi-Weekly" |
| Change frequency (Weekly/Bi-Weekly/Semi-Monthly) | ✅ | React-Select "Payment Frequency" dropdown |
| Set Semi-Monthly day pair | ✅ | Two extra React-Selects appear only when Semi-Monthly is chosen: "First Payment Day", "Second Payment Day" |
| Set Bi-Weekly "next payday" | ✅ CONFIRMED (resolved 2026-07-01) | The field DOES appear when Bi-Weekly is selected as the DESTINATION frequency (it was simply not exercised in the original discovery pass, which only started FROM Bi-Weekly). Confirmed live across the S2/S3/S6 validation cycles (website#153 pipeline): `<input id="nextPayDate" name="nextPayDate" placeholder="MM/DD/YYYY" type="search">`, Formik-controlled, window tomorrow..+15 days. See RN-13 below (was a gap, now resolved). |
| Delete / reset | ❌ | Not applicable — always shows current state, only "SAVE FREQUENCY" |

## Flow and states (step by step in the UI)

1. Customer logs in (OTP) → `/overview`.
2. Sidebar → Payments → **Payment Flexibility** → `/payment-flexibility`.
3. Card "Change your payment schedule" → **VIEW MY OPTIONS** → `/payment-frequency`.
4. Page shows:
   - "Current Plan" card: label **Current Frequency**, value = current frequency (e.g. "Bi-Weekly").
   - "Payment Frequency" React-Select, defaulting to **empty** (placeholder "Payment Frequency"), NOT pre-selecting the current frequency.
5. Opening the dropdown lists **only the frequencies the customer does NOT currently have**, and **Monthly is never listed** `[confirmed]`. Observed live: current = Bi-Weekly → dropdown offered exactly `["Weekly", "Semi-Monthly"]` (2 options, no Monthly, no Bi-Weekly).
6. Selecting **Semi-Monthly** reveals two more React-Selects: **First Payment Day** and **Second Payment Day**, pre-populated with a default valid pair (observed default: First=8, Second=22 — gap=14, the MIN_DAY_GAP).
7. Clicking **SAVE FREQUENCY** fires `POST /uown/svc/changePaymentFrequency` synchronously; on success:
   - Toastify success toast: exact text **"Payment frequency updated successfully"** `[confirmed]`.
   - "Current Frequency" label updates immediately (SPA re-render, no page reload) to the new value.
   - Persists across full page navigation/reload (verified) `[confirmed]`.
8. `‹ Back to payment flexibility` returns to `/payment-flexibility`.

| From → To | Triggering event | Allowed? |
|---|---|---|
| Bi-Weekly → Semi-Monthly | Select Semi-Monthly + valid day pair → Save | ✅ |
| Semi-Monthly → Bi-Weekly | Select Bi-Weekly → reveals "next payday" field (window tomorrow..+15d) → Save | ✅ CONFIRMED live (website#153 pipeline, S2/S3/S6 cycles) — payload `{accountPK, newFrequency:"BI_WEEKLY", nextPayDate}`, no day-of-month fields |
| Any → Monthly | N/A | ❌ Monthly is never offered in the dropdown (regardless of current frequency) |
| Any → same frequency | N/A | ❌ current frequency is excluded from the option list — cannot "re-select" the same value |

## Business rules

- **RN-01 (Q3 — resolved):** exact success toast copy is **"Payment frequency updated successfully"**. `[confirmed]`
- **RN-02 (Q3 — resolved):** "Current Frequency" is the exact label text in the "Current Plan" card. `[confirmed]`
- **RN-03 (S4 — dropdown exclusion, resolved):** the Payment Frequency dropdown excludes the current frequency and NEVER lists Monthly — confirmed with current=Bi-Weekly showing only `Weekly, Semi-Monthly`. `[confirmed]`
- **RN-04 (Q5 — resolved):** First Payment Day options = **exactly `1..17`** (17 options) regardless of Second Payment Day state. `[confirmed]`
- **RN-05 (Q5 — resolved, MIN/MAX gap):** with First Payment Day = 1, Second Payment Day options = **`15..21`** (7 options) → gap range is **14 to 20 inclusive**, confirming **MIN_DAY_GAP=14 / MAX_DAY_GAP=20** exactly as the SPEC hypothesized from the MR description. `[confirmed]`
- **RN-06 (Q6 — wrap behavior, resolved — CANDIDATE BUG, BUG-01):** with First Payment Day = **17** (the max), Second Payment Day options collapse to a **single option: "31"** (17+14), NOT the full `31..37` range implied by the 14–20 gap rule. Day "31" does not exist in April, June, September, November, or February of any year. `[CONFIRMED]` for First=17 specifically — reproduced **7 independent times** across the discovery pass + all 3 validator cycles of the website#153 pipeline (fresh accounts each time, most recently 17371/17374, 2026-07-01), always the same anomaly. `[HYPOTHESIS]` still applies only to whether First=14/15/16 exhibit the same truncation — NOT re-verified as of this snapshot (see Gaps). Not confirmed as the literal root cause of the historical drift bug (ACCT 545697), but it is the same class of defect (day arithmetic ignoring month boundaries) and directly touches the fix's "update options for first payment day selection" changelog line. Non-blocking by design of the SPEC/oracle; flagged to PO/dev for triage.
- **RN-07 (Q2 — resolved):** `uown_frequency_mods.agent` for a customer self-service Save = the literal string **`"customer portal"`** — NOT `SYSTEM`, NOT the customer's name, NOT a UI username. `[confirmed]` (live row pk=74, account_pk=17330: `agent='customer portal'`).
- **RN-08 (rule #13 — resolved):** the log surface for this action is **`uown_sv_activity_log`**, NOT `uown_los_lead_notes` (consistent with the "account-centric action" mnemonic in [[activity-log-validation]]). Two rows written synchronously on Save:
  1. `log_type='FREQUENCY_CHANGE'`, `created_by='customer portal'`, `creation_source='USER_ACTION'`, `notes='Payment frequency changed from BI_WEEKLY to SEMI_MONTHLY'`.
  2. `log_type='INFORMATION'`, `notes='[UownReceivableService][createReceivablesForAccount] Buyout fee of 100.00 added to EPO receivable total'` (Rewind/Replay side effect — the EPO receivable is regenerated too). `[confirmed]`
- **RN-09 (schedule regen, resolved):** `uown_sv_receivable` reflects Rewind/Replay: prior BI_WEEKLY schedule (26 REGULAR_PAYMENT rows) went `INACTIVE`; a fresh 26-row SEMI_MONTHLY `ACTIVE` schedule was created (13m term × 2/month = 26 installments, matches `numOfPayments.13.SEMI_MONTHLY`), plus exactly 1 `ACTIVE` `EARLY_PAY_OFF` receivable. No duplicate/overlapping ACTIVE sets observed. `[confirmed]`
- **RN-10 (anti-drift baseline, resolved for AC1):** immediately after the Bi-Weekly→Semi-Monthly Save (today = 2026-07-01), `nextPaymentDueDate` in the `changePaymentFrequency` response = **2026-07-15** (14 days out — the customer's own selected Second Payment Day), well within "one frequency interval," NOT months/years out. This is a clean (non-drifted) baseline consistent with the fix having landed. `[confirmed]`
- **RN-11 (planId staleness — CANDIDATE OBSERVATION):** the `changePaymentFrequency` response's `schedSummaryInfo.planId` remained **`"BW13"`** (Bi-Weekly, 13-month) even though `paymentFrequency` in the SAME response is now `"SEMI_MONTHLY"`. `planId` looks like a derived/cached field that is not refreshed on a frequency change. `[OBSERVATION]` — not asserted as a functional bug (no downstream UI effect was observed to depend on it in this pass), but flag for the implementer to check whether any screen/report renders `planId` to the customer or agent.
- **RN-12 (`frequencyChanges` counter, resolved for Q4 context):** the response's `schedSummaryInfo.frequencyChanges` field was `1` after a single change on a fresh account — the backend DOES track a change counter, but (per MR !286 scope, Q4) there was NO client-side or server-side gate observed rejecting the Save because of this counter. Consistent with "fix recalculation, no hard limit" — the counter exists (perhaps for reporting/investigation, AC5) but nothing in this discovery pass enforced a maximum.
- **RN-13 (Bi-Weekly "next payday" field, RESOLVED 2026-07-01):** the SPEC assumed a "When is your next payday?" field for Bi-Weekly selection (S2) — this was NOT observed in the original discovery pass (only exercised Bi-Weekly as the *starting* frequency). Confirmed live during the website#153 implementation/validation pipeline: selecting Bi-Weekly as the *destination* DOES reveal `<input id="nextPayDate" name="nextPayDate" placeholder="MM/DD/YYYY" type="search" ... class="w-100 index-module_formikInput__0-IuM form-control">`, a Formik-controlled input with NO date-mask library — the `placeholder` IS the accepted format contract. `[confirmed]` payload on Save: `{accountPK, newFrequency:"BI_WEEKLY", nextPayDate:"<ISO>"}` (the frontend converts the displayed `MM/DD/YYYY` back to ISO before sending). **UI-injection gotcha (now a catalogued pitfall):** the field silently corrupts/rejects an ISO-format (`YYYY-MM-DD`) value injected via native-setter — must use `MM/DD/YYYY` to match its own placeholder. See [[application-lifecycle]] pitfall #147.
- **RN-14 (post-Save UI stability window, NEW 2026-07-01):** after SAVE FREQUENCY's success toast fires, the "Current Plan" card does NOT settle immediately — a Bootstrap spinner (`.spinner-border`) renders for ~900ms while the card unmounts/remounts with the new frequency value (schedule-summary refetch). This is a UI timing characteristic of the page, not a business rule, but relevant to anyone building automation against this screen: a read of the "Current Frequency" label immediately after the toast (without waiting for this spinner to clear) can observe a stale or transiently-absent value. Only visible in flows that chain multiple Saves in the same session (e.g. a repeated-toggle regression). See [[application-lifecycle]] pitfall #148 and [[page-object-pattern]] `PaymentFrequencyPage.waitForFrequencyRevalidation()`.

## Logic and exceptions

- The endpoint is `POST /uown/svc/changePaymentFrequency`. Payload observed:
  ```json
  {"accountPK":17330,"newFrequency":"SEMI_MONTHLY","firstDueDay":1,"secondDueDay":15}
  ```
  Response is the full updated `SchedSummaryInfo` wrapped in a row with `pk`/`rowCreatedTimestamp` (i.e. the response IS the `uown_sv_sched_summary` row, confirming this is the SAME entity the Payment Calculator (`04-calculos-financeiros.md §7`) uses).
- The dropdown's option set is computed server- or client-side from the CURRENT frequency (excludes current, never Monthly) — this was NOT tested against an invalid/blocked value because the UI never exposes Monthly or the current value as selectable, so **Scenario 4 (S4) becomes a pure option-set assertion**, not a rejection-on-save test (there's nothing invalid to submit through the UI for the frequency field itself).
- Day-picker validation (First/Second Payment Day) is **entirely client-side via option-set truncation** — the dropdown for Second Payment Day only ever lists valid gap-compliant values relative to the CURRENTLY selected First Payment Day. **This changes scenarios B1/B2 from negative-input rejection tests into option-set assertions**, exactly as the SPEC anticipated: there is no way to select day "0" or day "18" for First Payment Day (they are simply absent from the list, not present-and-rejected), and there is no way to select a gap of 13 or 21 for Second Payment Day (values outside 14–20 relative to First are absent from the list). The one edge case that DOES surface an anomaly is RN-06 above (First=17 → Second options collapse to a single non-existent calendar day "31").

## Connections with what we already knew

- **Confirms** `docs/business-rules/07-modificacoes-conta.md §41` (Payment Frequency Modification): `fromFrequency`/`toFrequency`/`modDate`/`agentUsername` fields map 1:1 to the real `uown_frequency_mods` columns `old_frequency`/`new_frequency`/`row_created_timestamp`/`agent`. Schedule regeneration via Rewind/Replay (§34) also confirmed (INACTIVE + fresh ACTIVE set, no duplicates).
- **Confirms** `docs/business-rules/04-calculos-financeiros.md §7` "Number of Installments by Frequency" table: SEMI_MONTHLY installment count (26 for a 13m term) matches `numOfPayments.13.SEMI_MONTHLY` exactly.
- **Contradicts / extends** the SPEC's assumption of a Bi-Weekly "next payday" input field — not observed in this pass (see RN-13 gap).
- **Promoted 2026-07-01:** the customer self-service `agent` value in `uown_frequency_mods` (the literal string `"customer portal"`) and the full self-service UI rule set (dropdown exclusion, day-picker gap, day-31 known defect, Bi-Weekly next-payday field, no self-service change-count limit) have been distilled into `docs/business-rules/07-modificacoes-conta.md §41` (see `derived_from`/`promoted_to` frontmatter links).

## Gaps / to investigate

> **Status update 2026-07-01:** the two gaps below that blocked the original discovery pass (Bi-Weekly destination flow, AC5 hard-limit) were closed during the website#153 implementation/validation pipeline (3 validator↔debugger cycles, 14 CTs, 11/11 PASS desktop + mobile-android). See RN-13/RN-14 above and `docs/business-rules/07-modificacoes-conta.md §41` for the promoted, distilled findings. Remaining gaps below are genuinely still open.

- ~~**Bi-Weekly destination flow (S2)** not yet exercised live~~ — **RESOLVED**, see RN-13.
- **RN-06 day-31 wrap anomaly** — First=17 is `[CONFIRMED]` (7 independent reproductions across discovery + all 3 validation cycles). Still open: a dedicated repro sweep across First Payment Day 14/15/16 to map exactly which values produce the same truncated Second Payment Day option set (remains `[HYPOTHESIS]` for those three values). Non-blocking; flagged to PO/dev as BUG-01, not yet fixed.
- **RN-11 `planId` staleness** — check whether any customer-facing or agent-facing screen renders this stale `planId` value post-frequency-change. Not exercised during the website#153 pipeline (out of its P0/P1 scope).
- **Weekly destination** not exercised in this pass (P2 per SPEC, deferred).
- **Kornerstone parity (Q7)** — not investigated (OUT of scope per SPEC).
- ~~**AC5 "hard limit" (Q4)**~~ — **RESOLVED**: S3 (3 full Bi-Weekly↔Semi-Monthly cycles, 6 consecutive Saves) and S6 (4 mixed changes) both completed live in the website#153 pipeline without any change being blocked/rate-limited. No self-service change-count limit exists as of 2026-07-01; ticket title vs. implementation (recalculation fix, not a count limit) flagged as a note for the PO in the task report/evidence.

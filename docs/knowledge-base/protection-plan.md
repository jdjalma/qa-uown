---
title: Protection Plan (Buddy "Uown Protection Plus") — offer gate, panels, cross-coverage
domain: knowledge-base
status: stable
volatility: volatile
last_verified: 2026-06-28
sources:
  - env: qa2
  - lead: 16801
  - lead: 16805
  - account: 11204
  - db: uown_los_protection_plan
  - db: uown_sv_protection_plan
  - db: uown_los_activity_log
  - code: src/data/merchant-config-contract.ts#offerInsurance
covers: [protection-plan, buddy-insurance, offer-protection-plan]
promoted_to: []
---

# Protection Plan (Buddy "Uown Protection Plus")

> Charter: Explore the Protection Plan panels in qa2 Origination + Servicing with Playwright MCP (and qa2 DB) to discover the panel fields, the offer/state gate, the cross-coverage mechanics, and the real price label.
> Origin: resolving the INFERRED checkpoints (CT-03/CT-06/CT-07/CT-09/CT-11) and the `$12.99/wk` vs `/month` discrepancy in [`.claude/oracles/protection-plan.md`](../../.claude/oracles/protection-plan.md). · Overall confidence: high (UI + DB cross-verified, env confirmed qa2 MAX(lead.pk)=16937)

## Purpose
The Protection Plan is the **optional Buddy Insurance** product (`AON_PURCHASEPROTECTION`) the customer accepts/declines during contract signing. This doc maps how an **adhered** plan surfaces in the agent portals (Origination + Servicing), what gates the **offer**, and the cross-coverage data flow. Canonical rule: **BR §23** ([`docs/business-rules/09-integracoes-externas.md`](../business-rules/09-integracoes-externas.md)).

## Offer Gate (when is the plan offered?)
Two conditions, both required:

| Gate | Where | Evidence |
|---|---|---|
| Merchant config **"Offer Protection Plan"** = `offerInsurance=true` | Origination → Merchant page | `[confirmed]` merchant `OL90202-0001` mod-history shows `UPDATED: MERCHANT[ offerInsurance: from: false to: true ]` (label "Offer Protection Plan" maps to `offerInsurance`) |
| Customer state ∈ `offer.insurance.in.states` | backend system config | `[confirmed]` non-allowed state logs the note; **NY = offered** (lead 16801), **CA = NOT offered** |

- **State gate is observable** via `uown_los_activity_log` note **`"Protection plan not offered in state CA"`** — present on leads 16912, 16727, 16459 (CA). `[confirmed]`
- The allowed-states list is **NOT** in `uown_state_configurations` (that table only has `state`/`state_abbreviation`) — it is the backend `offer.insurance.in.states` config. `[confirmed]`

## Price
**$12.99 / month.** `[confirmed]` The Buddy offer payload stored in `uown_los_protection_plan.offer_element_response` is `"premiumTotal":155.88,"paymentOption":"MONTHLY"` for **184/184** rows. $155.88 ÷ 12 = **$12.99/month** (and $38.97 = one quarter, BR §23). The memory `buddy-protection-plan-qa2`'s "$12.99/wk" was a **misread** — corrected.

## The two portal panels (the "important plan info")

### Origination — `/customers/{leadPk}` → "Protection Plan" card
Reads `uown_los_protection_plan`. Fields (exact, `[confirmed]`):

| Field | Type | opt-in (lead 16801) | opt-out (lead 16805) |
|---|---|---|---|
| Opted In | toggle (disabled) | **true** | false |
| Already Covered | toggle (disabled) | false | false |
| Status | text | COMPLETED | COMPLETED |
| Enrollment Date | date | **2026-06-21** | `-` |
| Cancellation Date | date | `-` | `-` |
| Cancellation Reason | text | `-` | `-` |
| Refund Amount | money | `-` | `-` |

- The panel does **NOT** show `policy_id`, `customer_id`, product name, or price (those exist in DB — e.g. 16801 `policy_id="UOWN 000000068901"`, `customer_id="buddy-19g6jmqo5arqp"` — but are not rendered).

### Servicing — `/customer-information/{accountPk}`
Reads `uown_sv_protection_plan`. **Two** PP surfaces (`[confirmed]` on account 11204, opt-in, Kornerstone/FL):
1. **"Protection Plan" card** — identical fields to Origination: Opted In (**true**), Already Covered (false), Status (COMPLETED), Enrollment Date (**2026-02-16**), Cancellation Date/Reason/Refund (`-`). Consistent with the DB row (`policy_id="UOWN 000000064801"`).
2. **Servicing Information → "Protection Plan"** sub-section — financial view: **Protection Plan Fees To Date** ($0.00) + **Protection Plan Fees Paid** ($0.00). Matches BR §23 "Plan fees added as Protection Plan AddOn To Date".

> **Side effect (confirmed):** opening `/customer-information/{pk}` auto-writes a `REVIEW` note **"Lead has been reviewed"** (User ID = the logged agent). See [`servicing-customer-information-page.md`].

## Key nuance — Status ≠ enrolled
`Status=COMPLETED` for **both** opt-in and opt-out (it means "the PP processing finished", not "enrolled"). The real **enrolled** signal is **`Opted In = true` + a populated `Enrollment Date`**. `[confirmed]` A test asserting only `Status=COMPLETED` would pass for a declined plan.

## Activity log (opt-in)
`[confirmed]` lead 16801, in `uown_los_activity_log` (surfaced in the Origination "Notes" panel):
1. `"Customer signed and opted in for protection plan. Initiating next steps... connector token and enroll with Buddy."`
2. `"Successfully initiated protection plan with Buddy. Status: COMPLETED"`

## Cross-coverage (`already_covered`) — refined
`[confirmed]` via DB. Cross-coverage is computed **servicing-side, at funding** — not at origination:

| Table | `already_covered=true` | `covered_by_*` | Meaning |
|---|---|---|---|
| `uown_los_protection_plan` (origination) | **0** of 192 | 0 | NEVER set origination-side |
| `uown_sv_protection_plan` (servicing) | **8** | `covered_by_account_pk` set + `policy_id` **copied** from the covering account | cross-coverage detected at funding, per BR §23 |

- Example: SV pk143/pk142/pk131 (cross-covered) all carry `covered_by_account_pk=11192` and that account's policy `"UOWN 000000063201"` — **no new policy minted** (anti-double-charge). `[confirmed]`
- For the same cross-covered leads (14614, 15308), the **LOS** rows show `already_covered=false`, `covered_by=null` while their **SV** rows show `already_covered=true`. `[confirmed]`
- **Implication / candidate UI gap:** the **Origination** "Already Covered" toggle reads `uown_los_protection_plan.already_covered`, which the pipeline never populates → it is **effectively always `false` in Origination**, even for a genuinely cross-covered customer. The accurate flag only appears in **Servicing**. (Not data loss — cross-coverage simply isn't known until funding.)

## Candidate product bug — opt-out logged as "Error initiating"
`[confirmed]` lead 16805 (opt-out): the activity-log/Notes entry is **`"Error initiating protection plan"`** (INTERNAL/SYSTEM) — a deliberate decline recorded as an *error*. The structured row is correct (`opt_in=false`, `status=COMPLETED`, `policy_id=null`). Wording bug, not data. Decision on a ticket is the user's (rule #10).

## SV table population (how data gets to Servicing)
`[confirmed]` `uown_sv_protection_plan` opt_in/already_covered breakdown: `false/false`=105, `true/false`=34, `false/true`=8. The opt-in rows (34) all carry a real `lead_pk` (synced from origination at funding); the only `lead_pk=0` rows are the 8 cross-coverage copies. **No genuine portal-originated (Channel 2) opt-in exists in qa2.**

## Available Operations
| Operation | Available? | Notes |
|---|---|---|
| View PP (Origination) | ✅ | read-only card on the lead page |
| View PP (Servicing) | ✅ | read-only card + fees sub-section on the account page |
| Opt-in / opt-out | ✅ | only during signing (Channel 1, customer-facing Buddy widget) |
| Enroll post-funding (Channel 2) | ✅ confirmed to checkout | customer Website portal → "Protection Plan" button → Buddy embed → "Yes, Protect my lease" → Checkout. See [Channel 2](#channel-2--customer-website-portal-enroll-confirmed-live). Terminal payment is **live Stripe** (not completable with a test card) |

## Channel 2 — Customer Website portal enroll (confirmed live)
`[confirmed]` live in qa2 2026-06-28 on **account 11433** (5th Ave Furniture NY, opted-out at signing → eligible). Driven via Playwright; OTP read from DB (no inbox needed).

1. **OTP login** — `website-qa2.uownleasing.com` → submit the **servicing** email (`uown_sv_email`, NOT the origination email — the origination `fintechgroup777+…` address returns "could not find an active account") → OTP lands in `uown_login_attempt.code` (read via tunnel) → 6-digit modal → logged in. Activity logs: `Created/Sent KORNERSTONE_VerificationCode` (CORRESPONDENCE/SYSTEM) + `Login Success using code N; Attempt 1` (INTERNAL/customer portal).
2. **Affordance** — `/overview` has a **"Protection Plan"** button (`#protectionPlanBanner`) → modal with a Buddy embed `iframe` (`staging.embed.buddy.insure/?partner=p-19g61kzm0yy7d&ion=AON_PURCHASEPROTECTION`). First load once failed `NS_ERROR_NET_TIMEOUT` (transient — reload rendered it; the support JS `js.buddy.insure`/`embed.buddy.insure` always 200).
3. **Widget** — "Uown Protection Plus" + full membership agreement; accept button "Yes, Protect my lease" (`#next-button`) gated on scrolling the agreement. **Price confirmed in the customer-facing copy: "agree to pay $12.99 per month"**; checkout step: "Today's Payment $12.99 + 11 additional payments of $12.99" (= 12 × $12.99 = $155.88/yr).
4. **Checkout = LIVE Stripe** — `#checkout-button` → 3 Stripe Elements iframes ("Secure card number/expiration/CVC input frame") with **`keyMode=live`, `apiKey=pk_live_51QHbK2…`**. Buddy charges the card directly via live Stripe.
5. **Stopped here** — completing enrollment requires a **real card** (live Stripe declines test cards). No charge made; `uown_sv_protection_plan` for 11433 stayed `opt_in=false, policy_id=null`.

> **`[OBSERVATION]` candidate finding:** the qa2 *test* portal routes Channel-2 payment through **live Stripe** (`pk_live`), so QA cannot complete a portal enrollment without a real charge. Worth flagging — a test env should use Stripe test mode.

## Connections with What Was Already Known
- **Confirms** BR §23 (offer gate, cross-coverage copies the existing policy, contract-balance fee line) and the memory's opt-in/opt-out + "Error initiating" finding.
- **Corrects** the memory `buddy-protection-plan-qa2`: (a) price is **$12.99/month**, not `/wk`; (b) `already_covered` IS persisted — in **`uown_sv_protection_plan`** (8 rows), just never in `uown_los_protection_plan`.
- **Adds** the exact panel field lists, the Servicing fees sub-section, the `Status≠enrolled` nuance, and the `REVIEW`-note side effect.

## Gaps / To Investigate
- **Channel 2 terminal payment:** exercised live through **checkout**; the final Buddy policy creation (`uown_sv_protection_plan` COMPLETED + `policy_id`) is gated by a **live-Stripe** charge that needs a real card — not completable in automation without a real transaction.
- **qa2 uses Stripe `pk_live` for Channel-2 (observation):** the test portal should arguably use Stripe test mode — report to the team.
- **Already-Covered UI in Origination:** confirm with product whether the always-`false` Origination toggle is intended (cross-coverage known only at funding) or a defect.

---
title: Illinois (IL) GowSign Lease-Purchase Template
domain: knowledge-base
status: snapshot
volatility: volatile
last_verified: 2026-06-30
sources:
  - env: stg
  - lead: 7218276
  - lead: 7218278
  - code: src/data/state-merchant-matrix.ts#expectedProvider
  - db: uown_gow_sign_template
  - db: uown_esign_document
covers: [illinois-gowsign-template, il-2025-sac, il-2025-sac-16-months, epo-section, neuroid-gate, state-routing]
promoted_to: []
---

# Illinois (IL) GowSign Lease-Purchase Template

> Charter: discover (rule #18, UI→API→DB) how to create an IL 16-month lease that routes
> to the new GowSign `IL_2025_SAC_16_MONTHS` template, and whether the flow is automatable
> for the test of GitLab work item **#576 "UOWN | SVC | Add IL - Illinois GowSign Template"**
> (milestone RU07.26.1.54.0).
> Origin: qa-planner SPEC for #576.
> Overall confidence: **high** for the routing/template inventory and the 16m-term recipe
> (live DB + API drive, stg, 2026-06-30); **BLOCKER confirmed** for automated CI signing of the
> 16m contract (NeuroID gate on the Kornerstone host — see § Automation blocker).
> Env: **stg** throughout (the local 5445 tunnel and sandbox 5446 were DOWN; stg-direct DB
> `35.224.143.155:5432` + svc-stg API both reachable from this box). Leads driven this run:
> **7218276** (KS3015, IL, invoice probe), **7218278** (KS3015, IL 16m, submitApplication probe).

## Purpose

UOWN is migrating contract signing Signwell → GowSign per state. The IL templates were added
in #576. QA must verify the GowSign IL 16m contract renders the Illinois lease-purchase
agreement with the correct state-scoped copy, the **Promotional-Payoff Option (Item 4)**,
**Lease-Purchase Ownership (Item 4a)**, the lease-purchase-plan footer, and the singular
**EARLY PURCHASE OPTION** appendix, with all dynamic values resolved (no `{{ }}` / no blanks).
The 16m EPO content requirement mirrors the AL/OH 16m siblings (daily-accrual narrative, no
day-count / percent-discount tokens).

## Available templates (stg, DB-confirmed 2026-06-30)

`getGowSignTemplatesForState(db, 'IL')` / `SELECT pk, state, name, template_id, client_type
FROM uown_gow_sign_template WHERE UPPER(TRIM(state))='IL'`:

| pk | name | term | template_id | client_type |
|---|---|---|---|---|
| 38 | `IL_2025_SAC` | 13m | `cv6dyyewqw2azzcsvlkg2xaj` | null (no restriction) |
| 39 | `IL_2025_SAC_16_MONTHS` | 16m | `r2t4ada62hdsmojymwipdfyv` | null (no restriction) |

`[confirmed]` — IL has **both** 13m and 16m templates active in **stg** (like AL/FL/GA/LA/PA;
unlike OH which is 16m-only and NY which is 13m-only). No `client_type` restriction → any
merchant. The 5445 tunnel/sandbox were unreachable this run, so qa2 IL availability is
UNVERIFIED here — re-list with `getGowSignTemplatesForState` before asserting in another env.
The repo had **zero** `IL_2025_SAC` references before this task (grep) → IL was a genuine new gap.

## Provider routing for IL — GowSign (matrix is stale)

- **IL routes to GOWSIGN** when a GowSign template exists for the effective state — which it now
  does for both terms. Routing rule (unchanged, [[16m-lease-and-gowsign-signwell-routing-qa2]]):
  `effectiveState = INSTORE ? merchant.state : customerState`; template exists for
  `(effectiveState, client_type)` → GOWSIGN, else merchant `esign_client` (SIGNWELL fallback).
- **Contradiction (= discovery):** `src/data/state-merchant-matrix.ts` row IL still says
  `expectedProvider: 'SIGNWELL'`. That is the **stale dated matrix** (same drift that hit OH/AL/NY;
  rule #16). Live DB template availability is authoritative → IL is now **GowSign** for both
  terms. **Action (qa-doc-keeper): update the matrix IL row to GOWSIGN** (note: the row's
  `validMerchant` is TerraceFinance, which only reaches the 13m template — see below).
- The esign document row (`uown_esign_document`, the `client` source of truth) is created **only
  at `CONTRACT_CREATED`** (after CC pre-auth), NOT at `UW_APPROVED`. Before that there is nothing
  to read — so a routing assertion (`assertSelectedTemplateForLead`) requires the lead to first
  reach CONTRACT_CREATED.

## Getting the 16-month TERM for IL — the merchant decides (live-proven, stg)

The term comes from the merchant program / ABB eligibility, NOT the SSN suffix (the `…916` mock
is ignored by the real ABB; [[ssn-test-modalities]] / [[16m-lease-and-gowsign-signwell-routing-qa2]]).

### Route A — Kornerstone ONLINE merchant (ABB returns EligibleTerms 16) — IL CONFIRMED

- **Merchant `KS3015` "5th Ave Furniture (NY)"** — `MERCHANTS.FifthAveFurnitureNY`, ONLINE,
  `client_type=KORNERSTONE`, `valid_states` includes **IL**, programs `['13 month','16 month']`.
  (Many other Kornerstone ONLINE merchants in stg also list IL — KS5936, KS1816, KS5576, KS6621,
  KS12550, … pk range 10137–10161.)
- **ONLINE → routes by the customer state.** Sending `state='IL'` + `bankData` (`TEST_BANK`:
  routing `123456780`, account `160781900000` — Kornerstone requires it, else 400) →
  ABB **EligibleTerms [16,13]**. `[confirmed]` live stg 2026-06-30.
  - **Evidence (lead 7218276):** `sendApplication` 200 → approved; `sendInvoice` 200 →
    `paymentDetailsList` = **`16m planId=WK16`** + **`13m planId=WK13`**. So the SAME merchant
    gives you the 16m template (pick WK16) or the 13m template (pick WK13) purely by the plan —
    both route GowSign for IL (IL has both templates). This makes the cleanest CT-01 decision
    table: state IL × term {13,16} → {`IL_2025_SAC`, `IL_2025_SAC_16_MONTHS`}, both GOWSIGN.
- **Entry signing URL (CC pre-auth `/complete` page) is the Kornerstone host:**
  `https://secure-stg.kornerstoneliving.com/{shortCode}/complete?planId=WK16`
  `[confirmed]` (lead 7218276 redirectUrl). **This host carries the NeuroID gate** — see below.

### Route A caveat vs AL/NY automated specs

The AL automated **signing** spec used **TerraceFinance 13m on the UOWN gateway** (no NeuroID).
The AL **16m** render was only ever achieved **manually via MCP** (the NeuroID reload trick,
alabama-gowsign-template.md BR-07) — there is no automated AL 16m signing spec. The same gateway
split applies to IL: TerraceFinance (ONLINE, UOWN gateway) + IL reaches only the **13m** template
(non-Kornerstone ONLINE caps at 13m); the **16m** template is reachable only via the
Kornerstone host, which is NeuroID-gated.

## 🔴 Automation blocker — NeuroID on the Kornerstone host blocks the IL 16m flow in CI

**The only route to an IL 16-month lease is a Kornerstone ONLINE merchant, whose `/complete`
page lives on `secure-stg.kornerstoneliving.com` behind the NeuroID behavioral anti-bot gate.**
Both automated entry paths are blocked:

1. **API `submitApplication` is NeuroID-blocked.** `[confirmed]` live stg 2026-06-30, lead
   **7218278** (KS3015, IL, `termMonths:16`, WK16, bankData): `getMissingFields` ok →
   `submitApplication` returned `{ ..., embeddedSigningUrl:null, esignClient:null,
   error:"Failed to verify identification." }`. **No `uown_esign_document` row was created** and
   the lead **stayed `UW_APPROVED`** (the failed submit rolled back the CC auth — it never reached
   `CC_AUTH_PASSED`). So the API cannot drive an IL 16m lead to CONTRACT_CREATED → CT-01 routing,
   and CT-02..CT-06 / CT-08 content+signing (all of which need the rendered 16m contract) are
   blocked via API.
2. **Browser auto-advance is NeuroID-blocked too.** Per the AL sibling (BR-07), the
   kornerstoneliving `/complete` CC pre-auth *passes* but the post-submit step shows "Failed to
   verify identification" and does not auto-advance. The documented workaround
   (reload → "Sign Contract" button, which appears because the lead is `CC_AUTH_PASSED`) was
   proven **only manually via Playwright MCP**, never in an automated headless spec, and there is
   **no page object** for the Kornerstone reload → "Sign Contract" surface.

**Consequence for #576:** the SPEC's core CTs (CT-02..CT-06 content of `IL_2025_SAC_16_MONTHS`,
CT-08 signing) cannot be implemented as automated CI tests with the current tooling. This is an
S1/architecture blocker that was escalated to the user (delegation gate: uncovered page-object
area + vendor/env constraint).

### What IS automatable for IL (no NeuroID)

- **IL 13m via TerraceFinance** (`OL90202-0001`, ONLINE, UOWN gateway `secure-stg.uownleasing.com`,
  MASTERCARD/VISA pre-auth, no NeuroID) → GowSign **`IL_2025_SAC`** → full render + sign with the
  existing helpers (`createPreQualifiedApplication` → `sendInvoice` → `MissingDataFormPage` /
  `ContractCompletePage` → `TermsOfAgreementPage` → `AlternativeContractModalPage` →
  `signGowSignInFrame`). This covers CT-01's **negative control** (13m → `IL_2025_SAC`) and CT-07's
  **sanity reference** against the 16m template, but NOT the 16m-specific content (Item 4/4a/EPO
  appendix), which is the SPEC's focus.
- **MCP-manual 16m render**: the IL 16m contract content (CT-02..CT-06) can be captured/validated
  the same way AL did its 16m verdict — drive a Kornerstone IL 16m lead in Playwright MCP, fill the
  kornerstoneliving `/complete` CC form, reload → "Sign Contract" → Terms → Proceed → read the
  GowSign iframe. Manual, not CI.

## Content checkpoints for the IL 16m template (oracle)

The MUST / MUST NOT content lists for Item 4, Item 4a, the lease-purchase-plan footer, the
singular EARLY PURCHASE OPTION appendix, and the §1–§14 state-law sanity are captured in the BDD
oracle `.claude/oracles/il-16m-gowsign-template.md` (CT-01..CT-08). They are derived from the
#576 acceptance criteria + the AL/OH 16m sibling templates (daily-accrual EPO narrative; no
`{{epoDays}}`/`{{epoExpiryDate}}`; tail `[totalNumberOfPayments]` payments of
`$ [nextPaymentDueAmount]`; Total `$ [contractAmount]`). The **exact canonical wording** must be
frozen from a real rendered `IL_2025_SAC_16_MONTHS` contract (MCP-manual render, per the blocker
above) before the checkpoints are promoted from `[expected]` to `[confirmed]`.

> ⚠️ Regression to watch (from AL): `nextPaymentDueAmount` rendered **blank** in the AL 16m
> contract (Item 3 / Item 4a) — a confirmed migration regression. Assert `nextPaymentDueAmount`
> is non-empty in the IL 16m render (CT-03/CT-04) and check the backend dispatch note for
> `[DocumentDispatchService][GowSign] … variables map missing … token(s)`.

## Connections with what was already known

- **Confirms** [[16m-lease-and-gowsign-signwell-routing-qa2]] routing rule (provider = template
  availability, not `esign_client`) and the Kornerstone-ABB-16m route, now extended to **IL** in
  **stg** (previously proven for LA/OH/AL).
- **Confirms** [[gowsign-knowledge]] (esign-doc created at CONTRACT_CREATED; `client` column).
- **Confirms** the AL sibling's NeuroID gate (alabama-gowsign-template.md BR-07) — and adds the
  live-proven fact that the **API `submitApplication` path is NeuroID-blocked too** (no esign doc,
  lead stuck `UW_APPROVED`), not just the browser auto-advance.
- **Contradicts** `state-merchant-matrix.ts` IL = SIGNWELL → stale; live = GOWSIGN (update needed).

## Gaps / To Investigate

- **16m render content (CT-02..CT-06)** — capture the exact `IL_2025_SAC_16_MONTHS` body via
  MCP-manual (Kornerstone IL 16m + reload trick) and freeze the canonical Item 4 / Item 4a /
  footer / EPO-appendix wording. Blocked from CI by NeuroID.
- **`appendix-h-epo-template-registry.md` has no IL entry** — add one once the 16m EPO wording is
  frozen (qa-doc-keeper).
- **qa2 IL template availability** — UNVERIFIED this run (tunnel down). Re-list when reachable.
- **Existing ticket for the NeuroID-CI gap?** Ask the user whether a test-merchant NeuroID bypass
  in stg is feasible (would unblock automated 16m signing).

## Reproduction assets

- Throwaway drivers (delete after the task closes): `tests/api/__scratch_il_16m.spec.ts`
  (`ENV=stg`, mints an IL Kornerstone lead + prints WK16/WK13 + redirectUrl host) and
  `tests/api/__scratch_il_16m_submit.spec.ts` (proves the NeuroID block on `submitApplication`).
- Discovery probe: `src/scripts/_probe_il_template.mjs` (lists IL templates + IL-serving
  Kornerstone merchants across reachable DBs).

---
title: Creating a 16-Month Lease & Controlling GowSign vs Signwell Routing (qa2)
domain: knowledge-base
status: snapshot
volatility: volatile
last_verified: 2026-06-17
sources:
  - env: qa2
  - code: src/data/state-merchant-matrix.ts#expectedProvider
  - db: uown_gow_sign_template
  - db: uown_esign_document
covers: [16m-lease, gowsign-routing, signwell-routing, abb-eligibility, esign-provider]
promoted_to: []
---

# Creating a 16-Month Lease & Controlling GowSign vs Signwell Routing (qa2)

> Charter: Explore application creation + e-sign routing with Playwright MCP + read-only DB to discover **how to deterministically create a 16-month lease** and **which provider (GowSign / Signwell) it routes to**, with a reproducible recipe (merchant, state, program, income, term).
> Origin: Ohio GowSign template task + user request 2026-06-17 ("não sei como criar a aplicação 16m com GowSign nem com Signwell — descobrir e documentar").
> Overall confidence: **high** for the routing logic, the qa2 template map and the two creation routes (DB-confirmed); **medium** for the per-state esign-doc proof of OH/CO (signing ceremony blocked by the Kornerstone card gateway — see Gaps).
> Env: **qa2** throughout. All DB facts are read-only SELECTs dated 2026-06-17.

## Purpose

Two orthogonal questions, often conflated:

1. **How do I get a 16-month term?** → controlled by the **merchant's available programs / ABB eligibility**, NOT by SSN suffix mocks.
2. **Which e-sign provider signs it (GowSign or Signwell)?** → controlled by **GowSign-template availability for the lead's effective state + client_type**, NOT by the merchant's `esign_client`.

You set the term with the *merchant/program*; you set the provider with the *state*. They are independent.

---

## The one rule that decides the provider

E-sign provider is resolved per lead as:

```
effectiveState = (merchant.merchant_type == INSTORE) ? merchant.state : customerState
IF a GowSign template exists in uown_gow_sign_template for (effectiveState, client_type)
    → client = GOWSIGN  (that template)
ELSE
    → client = merchant.esign_client   (fallback, almost always SIGNWELL)
```

- `[confirmed]` dev statement 2026-04-28 + `.claude/rules/testing.md` "E-sign Provider Routing"; INSTORE override in `EsignService.loadLeadEsignContext()` (svc R1.51.1, lines 194-197).
- **The merchant's `esign_client` does NOT force the provider.** KS16775 and the Daniel's clones all have `esign_client='SIGNWELL'` yet route to **GOWSIGN** when a template matches. `[confirmed]` (DB) — lead 16620 (CA, KS16775) → `uown_esign_document.client='GOWSIGN'`.
- **INSTORE merchants ignore the customer state.** They always route by the *store's* state (`merchant.state`). `[confirmed]` rule.
- The esign document row (`uown_esign_document`) is created **only at `CONTRACT_CREATED`** (after CC pre-auth), NOT at `UW_APPROVED`. Before that there is nothing to read. `[confirmed]` — fresh leads 16640/16641 had no esign row until signing.

---

## qa2 GowSign template map (DB-confirmed 2026-06-17)

`SELECT pk, state, name, template_id, client_type FROM uown_gow_sign_template` → **only these states have a GowSign template; every other state falls back to SIGNWELL.**

| State | Has 13m template? | Has 16m template? | Template name(s) (pk) | client_type restriction |
|---|---|---|---|---|
| **AL** | ✅ | ✅ | `AL_2025_SAC` (25), `AL_2025_SAC_16_MONTHS` (26) | none |
| **CA** | ✅ | ✅ (jewelry only) | `California Lease Agreement` (1), `CA_2025_SAC_JEWELRY` (2), `CA_2025_SAC_JEWELRY_16_MONTHS` (15) | pk 2 & 15 = `DANIELS_JEWELERS,JEWELRY` |
| **FL** | ✅ | ✅ | `FL_2025_SAC` (12), `FL_2025_SAC_16_MONTHS` (17) | none |
| **GA** | ✅ | ✅ | `GA_2025_SAC` (14), `GA_2025_SAC_16_MONTHS` (22) | none |
| **LA** | ✅ | ✅ | `LA_2025_SAC` (23), `LA_2025_SAC_16_MONTHS` (24) | none |
| **NC** | ✅ | ✅ | `NC_2025_SAC` (18), `NC_2025_SAC_16_MONTHS` (19) | none |
| **NY** | ✅ | ❌ | `NY_2025_SAC` (16) | none — **13m only** |
| **OH** | ❌ | ✅ | `OH_2025_SAC_16_MONTHS` (21) | none — **16m only** |
| **PA** | ✅ | ✅ | `PA_2025_SAC` (13), `PA_2025_SAC_16_MONTHS` (20) | none |
| any other (CO, TX, AZ, …) | ❌ | ❌ | — | → **SIGNWELL** |

> Re-list anytime with `getGowSignTemplatesForState(db, state)` (`src/helpers/gowsign-template-db.helpers.ts:148`) or `node src/scripts/env-query.mjs "SELECT pk,state,name,client_type FROM uown_gow_sign_template ORDER BY state,pk"`. This is a **drift-prone** catalog ([[volatile-knowledge-registry]]) — verify before asserting.

Consequence for OH: **OH only routes to GowSign for a 16-month lease** (no OH 13m template — a 13m OH lead would fall back to Signwell).

---

## Getting the 16-month TERM (qa2) — the merchant decides, not the SSN

> ⚠️ **SSN suffix mocks do NOT work in qa2.** `…916 → EligibleTerms 16` and `…9 → UW_DENIED` are honoured only in **qa1/sandbox** (mocked ABB). qa2 runs the real BlackBox/ABB engine which ignores them. See [[qa2-16m-eligibility-kornerstone-route]], [[ssn9-denial-gate-off-sandbox-qa1]], [[application-lifecycle]] pitfalls #109. Don't waste time forcing 16m via SSN/income on a merchant that caps at 13.

There are **two reliable routes** to a 16m lease in qa2:

### Route A — Kornerstone merchant (ABB returns EligibleTerms 16)

- **Merchant `KS16775`** "#1 Brooklyn Furniture INC" — pk **657**, ONLINE, `client_type=KORNERSTONE`, `esign_client=SIGNWELL`. Active 16m programs `KW-16-2.25` / `KW-16-2.3` (SAME_AS_CASH); `valid_states` covers OH, CO, CA and most states.
- The Kornerstone ABB route returns **EligibleTerms 16 directly** for fresh profiles. Non-Kornerstone ONLINE merchants (TireAgent `OW90218-0001`, TerraceFinance `OL90202-0001`) **cap at 13** in qa2. `[confirmed]` ([[qa2-16m-eligibility-kornerstone-route]]).
- **ONLINE → routes by customer state.** So the *same merchant* gives you GowSign or Signwell purely by the customer state you send:
  - `state='OH'` → GOWSIGN / `OH_2025_SAC_16_MONTHS`  `[confirmed]` (lead **16646**, DB `client=GOWSIGN`, status `SENT_TO_CUSTOMER`)
  - `state='CA'` → GOWSIGN / `California Lease Agreement`  `[confirmed]` (lead 16620, DB `client=GOWSIGN`)
  - `state='CO'` (or any no-template state) → SIGNWELL  `[inferred-high]` (rule + OH/CA GOWSIGN now confirmed; CO esign-doc pending a completed signing)
- **Required on `sendApplication`:** Kornerstone needs `bankData` — `mainBankRoutingNumber='123456780'` + `mainBankAccountNumber='160781900000'` (`TEST_BANK` defaults), else 400 ([[application-lifecycle]] pitfall #5). High income helps the ABB.
- **Signing URL shape:** `https://secure-qa2.kornerstoneliving.com/{shortCode}/complete?planId=WK16` (Kornerstone host, NOT `uownleasing.com`). `planId=WK16` = the 16-month weekly plan.

**Fresh proof (today, 2026-06-17), via `tests/api/__scratch_ohio_signing_url_svc546.spec.ts` (`ENV=qa2 STATE=<S>`):**

| Lead | State | paymentDetailsList | term | Signing URL |
|---|---|---|---|---|
| **16640** | OH | single entry, `planId=WK16` | **16** | `…/LqOtFhvQ/complete?planId=WK16` |
| **16641** | CO | single entry, `planId=WK16` | **16** | `…/gNqCDmXY/complete?planId=WK16` |

→ confirms the **term comes from the Kornerstone program, not the state** (OH and CO both produced 16m).

### Route B — Merchant configured with ONLY a 16-month program (forces 16m)

Configure a merchant so its **only active program is 16m**; then every approved application there is 16m, regardless of ABB or SSN. Deterministic and merchant-agnostic.

- **Validated on the Daniel's Jewelers clone `OL90205-0079_clone`** — pk **47**, **INSTORE**, `state=CA`, `client_type=DANIELS_JEWELERS`, `esign_client=SIGNWELL`. `[confirmed]` DB 2026-06-17 (user `danielsJewelers` / `U0wn_danielsJewelers_CnRKhJ`, SSN `082390916`).
- `uown_merchant_to_program` for pk 47 now links **only 16m programs**: `KW-16-2.3` (program pk 4715) + `KW-16-2.25` (pk 4714), both 16-month SAME_AS_CASH, active. The previously-used 13-month program `2021 CA Program SAC` (program pk **85**) is **no longer active-linked** → that is why a fresh app there now comes out 16m. `[confirmed]` (DB; historical leads 16336/16370/16372 on pk 47 carried program pk 85 / 13m, the newer 16638/16639 carry 16m).
- **SSN `082390916`:** the `…916` suffix is the qa1/sandbox 16m second-look mock and is **ignored in qa2** — it is NOT what produced the 16m. The 16m came from the **program restriction**. The SSN only needs a **non-`9` ending** to be approvable (it ends in 6). `[confirmed]` reasoning.

> 🔻 **INSTORE routing trap (important):** because pk 47 is **INSTORE**, the provider is resolved by **the store's state CA**, NOT by the customer state. The user's leads 16638/16639 were sent with `customer_state=OH`, but an INSTORE Daniel's clone will **ignore OH** and route by CA → `CA_2025_SAC_JEWELRY_16_MONTHS` (pk 15, GOWSIGN). **You cannot exercise the OH template with an INSTORE merchant.** For the OH template use an **ONLINE** merchant (Route A, KS16775, `state=OH`).

### The offer is `UW EligibleTerms ∩ merchant programs` — UW can cap it to 16m alone

The terms offered to the customer are the **intersection** of what underwriting allows and what the merchant's programs provide:

```
offeredTerms = UW EligibleTerms  ∩  merchant program terms
uown_lead_approval_terms(lead) = { uw_terms, merchant_terms, approved_terms }   (approved = the intersection)
```

So **a 16m-only offer can come from EITHER side**: the merchant has only a 16m program (Route B), **OR** underwriting returns `EligibleTerms 16` even when the merchant offers 13+16.

**Observed on the Daniel's clone (lead 16643, 2026-06-17) — UW caps to 16 regardless of the 13m program** `[confirmed]` (activity log + `uown_lead_approval_terms`):

- The merchant had **both** terms active at the time (the user had re-activated the 13m program). The log proves it:
  - `[LeadProgramService][getLTOProgramsForLead] lead 16643, IsEligibleForExtraInfo false, EligibleTerms 16`
  - `[LeadProgramService][getLTOProgramsForLead] After defaulting to 13,16 terms are : 13,16`
  - `[LeadProgramService][getLTOProgramsForLead] Found program(s) eligible for term 13,16`
- Yet `uown_lead_approval_terms(16643)` = **`uw_terms=16, merchant_terms=16, approved_terms=16`**, and `paymentDetailsList` returned only `WK16 / BW16 / MN16` (no 13m).
- → **the 13m program presence is irrelevant**; UW `EligibleTerms 16` is the cap. This is what the user means by *"tendo ou não programa 13m, é oferecido 16m"*.
- **Origin of the `EligibleTerms 16`:** the log shows `[UnderwritingService][copyUnderwriting] canUsePreviousUw ? yes. Same merchant. Copy UW data` — this SSN (`082390916`) already had a **previous 16-term UW** on this merchant and the new lead **copied** it. So it is a **sticky/inherited UW for that SSN+merchant**, NOT (necessarily) the `…916` suffix being honoured fresh in qa2 (on TireAgent a fresh `…916` returned `EligibleTerms 13`). `[hypothesis]` on the exact original trigger; `[confirmed]` that it is a copied previous UW.

> **Practical takeaway:** `danielsJewelers` clone + SSN `082390916` reliably yields **16m only**, because that SSN carries a 16-term UW that every new lead copies. The merchant's 13m program does not change it. To get a 13m offer there you would need a **fresh SSN with no prior 16-term UW** (and the 13m program active) — untested; see Gaps.

> **Daniel's signs via the UOWN portal, not Kornerstone.** Lead 16643's `redirectUrl` host is **`secure-qa2.uownleasing.com`** (not `secure-qa2.kornerstoneliving.com`). So the Daniel's `/complete` CC page uses the **standard UOWN gateway and accepts `MASTERCARD_APPROVED`** — it does NOT hit the OMNIFUND/kaptcha wall that blocks the Kornerstone route. `[confirmed]`. The Daniel's route is therefore the one you can fully drive to a signed contract in the browser with the standard test card.

---

## Putting it together — the recipe table

| Goal | Merchant | merchant_type | State to send | Term lever | Expected provider / template |
|---|---|---|---|---|---|
| **16m + GowSign (OH)** | KS16775 (pk657) | ONLINE | `OH` | Kornerstone ABB → 16 | GOWSIGN / `OH_2025_SAC_16_MONTHS` `[confirmed]` (lead 16646) |
| **16m + Signwell** | KS16775 (pk657) | ONLINE | `CO` (any no-template state) | Kornerstone ABB → 16 | SIGNWELL `[inferred-high]` |
| **16m + GowSign (CA jewelry)** | KS16775 | ONLINE | `CA` | Kornerstone ABB → 16 | GOWSIGN / `California Lease Agreement` `[confirmed]` (lead 16620) |
| **16m forced by program** | Daniel's clone (pk47) | INSTORE | (any — ignored) | only-16m program set | GOWSIGN / `CA_2025_SAC_JEWELRY_16_MONTHS` (routes by CA) `[inferred]` |

API drive sequence is the canonical one ([[application-lifecycle]]): `buildTestData` → `sendApplication` (+ Kornerstone `bankData`) → `getApplicationStatus` (APPROVED) → `sendInvoice` (pick the 16m `paymentDetailsList` entry, `planId=WK16`) → `getMissingFields(shortCode,{planId})` → `submitApplication`. The reusable scratch is `tests/api/__scratch_ohio_signing_url_svc546.spec.ts` (now parameterized by `STATE`).

---

## Completing the signing ceremony in the browser (Route A) — current blocker

The Kornerstone API path stops at the `…/complete?planId=WK16` URL; `submitApplication` does **not** return an `embeddedSigningUrl` for Kornerstone. To reach `CONTRACT_CREATED` (and thus create the `uown_esign_document` row + render the GowSign/Signwell iframe) the customer must complete the `/complete` page in the browser:

- The `/complete` page is a **credit-card pre-authorization** form ($40 processing-fee hold): Cardholder name, Card Number, CVC, Expiration → Submit. `[confirmed]` (Playwright MCP, lead 16640).
- 🔴 **Real blocker = NeuroID, NOT the card (correction, 2026-06-18).** Previous note claimed the OMNIFUND gateway rejects `MASTERCARD_APPROVED` with "Credit Card is invalid." **That was a misdiagnosis.** Live re-test on the Kornerstone host (KS1011, AL 16m, lead 16653):
  - The card pre-auth **PASSES** — `authorizeCreditCard` → `{status:"APPROVED", preAuthStatus:"SUCCESS"}`, log `[submitApplication] CC Auth Passed`. Card used: `VISA_APPROVED` (`5146315000000055`) with cardholder last name = applicant last name.
  - `submitApplication` then **fails on NeuroID**: log `[UownClient][submitApplication] Neuro Id verification Failed`; UI shows **"Failed to verify identification."** The `tst.kaptcha.com` SDK is **NeuroID** (behavioral biometrics/anti-bot), not an "OMNIFUND card gateway." It flags the automated form-fill as non-human — **fails even with slow per-character typing.** `[confirmed]` 2026-06-18.
  - The old `"Credit Card is invalid."` symptom is a **different, earlier gate**: cardholder last name ≠ applicant last name (`[UownClient][checkCCLastNameMatch]`, `preAuthStatus:"NOT_RUN"`). Use the applicant's real last name (`uown_los_customer.last_name`) to pass it.
- **NeuroID is bypassable by automation via a reload (correction, 2026-06-18).** The NeuroID failure only blocks the page's *auto-advance* after submit — it does **not** roll back the card pre-auth, which already succeeded. **Working Playwright recipe (proven, KS1011 AL 16m, lead 16653 → `uown_esign_document.client='GOWSIGN'`, GowSign 16m contract rendered):**
  1. Fill the `/complete` CC form (cardholder last name = applicant last name; `VISA_APPROVED`) and Submit. Card auth passes (`CC Auth Passed`); UI shows "Failed to verify identification" (NeuroID) — **ignore it**.
  2. **Re-navigate to the same signing URL.** Because the lead is now `CC_AUTH_PASSED`, the page renders a **"Sign Contract"** button instead of the CC form (skips the NeuroID-gated step).
  3. Click **Sign Contract** → creates the GowSign document → **Terms** page → check both confirmations → **Proceed to signature** → the GowSign iframe renders the contract. (Kornerstone Terms goes straight to "Proceed to signature"; the Protection Plus step seen on the UOWN-gateway flow does not gate it here.)
- Completing the *signature* ceremony (Start → Sign → Finish) inside the GowSign iframe was not needed to **read** the contract — the document renders at `SENT_TO_CUSTOMER`. A non-Kornerstone UOWN-gateway merchant (TerraceFinance AL 13m, lead 16649) is still the simplest fully-automatable path but caps at 13m; the reload trick above is what unlocks the **16m** render on Kornerstone.

---

## Related: dual 13m + 16m offering (what the user is testing next)

Re-activating a 13m program alongside the 16m makes the merchant offer **both** terms. Prior knowledge in task **`RU05.26.1.52.0_offerBoth13And16Programs_537`**: with both active, `uown_lead_approval_terms` shows `approved_terms="13,16"` / `uw_terms="16"`, the log reads `After defaulting to 13,16 terms are : 13,16`, and the MissingPaymentProgram UI renders two tabs ("13 Months" = Weekly/Bi-Weekly; "16 Months" = Weekly/Bi-Weekly/Monthly). On the Daniel's INSTORE clone, the provider stays CA-routed regardless of term — so a 13m offer there would pick `CA_2025_SAC_JEWELRY` (pk 2) and a 16m offer `CA_2025_SAC_JEWELRY_16_MONTHS` (pk 15), both GOWSIGN.

---

## Connections with what was already known

- **Confirms** [[qa2-16m-eligibility-kornerstone-route]] (Kornerstone → 16m; SSN-916 ignored in qa2) and extends it with the full template map + a second (program-restriction) route.
- **Confirms** the routing rule in `.claude/rules/testing.md` and the INSTORE override; adds the DB-level template inventory.
- **Confirms** [[gowsign-knowledge]] (provider = template availability, not `esign_client`; esign-doc columns).
- **New:** the Kornerstone `/complete` CC page uses OMNIFUND+kaptcha and rejects the standard test card — a concrete blocker for browser-completing the Kornerstone signing.

## Gaps / to investigate

- ~~esign-doc proof of `OH → GOWSIGN`~~ **DONE** — lead 16646 (KS16775, OH) reached `uown_esign_document.client='GOWSIGN'`, `status='SENT_TO_CUSTOMER'` (user completed signing). The Kornerstone CC page CAN be completed **by a human** (the card pre-auth passes; the gate is **NeuroID** behavioral verification, which a real user passes but Playwright automation fails — see the corrected blocker section above).
- **esign-doc proof** of `CO → SIGNWELL` for Route A: still pending a completed CO signing (rule is solid; the symmetric OH GOWSIGN is now confirmed). Drive lead 16647 (or a fresh `STATE=CO` lead) through signing to capture `client='SIGNWELL'`.
- **esign-doc proof** that the Daniel's INSTORE clone 16m → `GOWSIGN/CA_2025_SAC_JEWELRY_16_MONTHS` (signing not completed; merchant config in flux during the user's 13m experiment).
- **Term-specific template matching:** does the backend pick a `*_16_MONTHS` template only for 16m leads, or any lead in that state? Untestable on OH (16m-only) / NY (13m-only); test on AL/FL/GA (both terms) if needed.

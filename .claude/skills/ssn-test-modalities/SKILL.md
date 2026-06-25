---
name: ssn-test-modalities
description: Load when planning an application test by program: 13m, 13m+16m, or 16m Second Look. Defines test SSNs, eligibility rules by merchant config, expected approval path.
disable-model-invocation: true
---

# SSN Test Modalities - UOWN Leasing

> **Purpose:** decision table for test SSNs and recipes for creating applications in the 3 program modalities (13m only / 13m+16m / 16m only).
>
> **Mandatory for:** `qa-planner`, `qa-implementer`, `qa-debugger`, and `/qa-flow`.

> **Authority boundary** (`docs/_docs-conventions.md` §7): this skill covers **HOW TO TEST** — SSN catalog, modality recipes, brand coverage matrix. The **canonical product behavior** (eligibility rules, UW enums, template routing by state) does NOT live here — the single source is `docs/business-rules/02-originacao-pipeline.md` + `appendix-e-campanhas-uw.md` and `src/config/constants.ts` (`generateTestSSN`). To resolve a topic, run `node scripts/docs-tooling.mjs resolve underwriting` (or `ssn`, `gowsign-routing`). Recent investigations: `docs/knowledge-base/underwriting-and-funding-test-data-paths.md`. **Do not duplicate product rules here** — they drift.

> Full catalog of SSN values, environments, and brand coverage: [references/ssn-values.md](references/ssn-values.md)

---

## 1. Decision table - which SSN to use

| Scenario | SSN | Merchant | Notes |
|---------|-----|----------|-------|
| Generic approval (any modality) | `generateTestSSN(true)` | any | Default for most tests |
| Generic denial | `generateTestSSN(false)` (ends in 9) | any | Immediate UW_DENIED **only in sandbox/qa1** (mock). In qa2 TERRACE_FINANCE approves via BlackBox/ABB - see qa2 caveat §6 |
| 16m direct (single submission) | `888880916` (or any `916` suffix) | any with 16m active | NOT tied to a profile |
| Second Look (denied 13m -> approved 16m) | `100000053` | TireAgent + CA + Brian profile | Tied to a specific profile |
| 13m + 16m (customer chooses) | `generateTestSSN(true)` | Kornerstone with 16m + bank data | planId selects the modality |
| BUGGY - avoid | `888888888` | - | NullPointerException in svc |

---

## 2. 16m eligibility rule - INVIOLABLE

> **Axiom:** the possibility of creating a 16-month application depends **exclusively on the merchant's configuration**, NOT on the brand (UOWN vs Kornerstone).

### Necessary and sufficient condition

A merchant supports 16m if it has a `uown_merchant_program` with `term_in_months=16` + `is_active=true` + a valid date window.

### Implications

- **Any merchant** (UOWN or Kornerstone) with 16m configured supports it
- There is NO "brand X does not offer 16m by design"
- `ensureMerchantReady` validates the contract automatically
- Canonical contract: `src/data/merchant-config-contract.ts`

---

## 3. Program modalities - recipes

### Modality A - 13m only

| Field | Value |
|-------|-------|
| SSN | `generateTestSSN(true)` |
| Merchant | any without 16m active |
| Bank data | do NOT send |

**Expected:** `paymentDetailsList` contains only the default `planId` `*13`.

### Modality B - 13m + 16m (customer chooses)

| Field | Value |
|-------|-------|
| SSN | `generateTestSSN(true)` |
| Merchant | Kornerstone (e.g., `KS3015`) with both 13m AND 16m active |
| Bank data | `TEST_BANK.DEFAULT_ROUTING` + `TEST_BANK.DEFAULT_ACCOUNT` |

**Flow:** `sendApplication` returns both -> `getMissingFields(shortCode, planId)` -> `submitApplication` with the chosen planId.

### Modality C.1 - 16m direct (preferred)

| Field | Value |
|-------|-------|
| SSN | `888880916` (the `916` suffix forces EligibleTerms 16) |
| Merchant | any with 16m active |
| Profile | any valid |

> **Route B — merchant 16m-only by program (Daniel's clone `OL90205-0079_clone`, qa2, 2026-06-22):** in this clone EligibleTerms 16 comes from the merchant being **16m-only by program** (not from the SSN suffix). Therefore **ANY approving SSN** yields 16m — a fresh `generateTestSSN(true)` with a `916` suffix works; it is **NOT tied** to the sticky `082390916`. Prefer a fresh SSN here (see the signing routing caveat below and [[application-lifecycle]] #132). `[test-execution:qa2, leads 16865/16866/16867]`.

### Modality C.2 - 16m Second Look

| Field | Value |
|-------|-------|
| SSN | `100000053` |
| Merchant | TireAgent |
| Profile | Brian/hayden/Columbus/92821/CA (INVIOLABLE) |

**Flow:** 1st submission without bank data -> UW_DENIED + 16m preview -> 2nd submission with bank data -> UW_APPROVED 16m.

> **`tam_score` trigger (GDS snapshot):** the Second Look family `100000053` (TireAgent) is the path that produces `tam_score` in `uown_los_uwdata`/`uown_sv_uwdata` — but ONLY when the 2nd submission approves 16m. In **qa2 this modality DENIES and short-circuits** (Second Look validated only in **stg**), so `tam_score` is **unreachable in qa2** (`count=0` over 6046+2037 rows, discovery 2026-06-19). The target env for `tam_score` (stg vs dev2) is **PENDING confirmation from Marcos** — do not state it as a fact. The other field, `npm_segment`, comes from **any GDS 16m decision** (Kornerstone/UOWN/PayTomorrow) and is NOT tied to a SSN. Detail: `docs/knowledge-base/npm-segment-tam-score-snapshot-routing.md`.

### Modality D - Denied

| Field | Value |
|-------|-------|
| SSN | `generateTestSSN(false)` |

**Expected:** immediate UW_DENIED.

---

## 4. Mandatory checklist (spec-test)

When planning CTs for a feature that involves `sendApplication`:

- [ ] CT for **Modality A (13m only)** planned?
- [ ] CT for **Modality B (13m+16m)** planned?
- [ ] CT for **Modality C (16m)** planned?
- [ ] CT for **Modality D (denied)** planned?
- [ ] Does each modality have a CT for UOWN AND Kornerstone?

### When to omit a modality

- Feature 100% servicing/portal-only (no sendApplication) - all N/A
- Feature specific to one modality - justify in the SPEC
- Limited fixture in the target environment - document as a conditional `test.skip`

Every omission MUST be explicit. Silent skips are not accepted.

---

## 5. Brand coverage - UOWN + Kornerstone (INVIOLABLE)

> Every feature that creates an application MUST have CTs for **both brands**.

### Brand × modality matrix

| Modality | UOWN | Kornerstone |
|------------|------|-------------|
| A - 13m | UOWN merchant without 16m | KS merchant without banking/BIN |
| B - 13m+16m | UOWN with both + banking | `KS3015` + banking + BIN |
| C.1 - 16m direct | UOWN with 16m + SSN 916 | KS1337 + SSN 916 |
| C.2 - Second Look | TireAgent + 100000053 | N/A documented |
| D - Denied | `generateTestSSN(false)` | `generateTestSSN(false)` |

### Brand coverage checklist

- [ ] Does each modality have a CT for UOWN?
- [ ] Does each modality have a CT for Kornerstone?
- [ ] Does each Kornerstone CT validate `uown_sv_account.company='KORNERSTONE'`?
- [ ] Do CTs with UI/email have per-brand styling assertions?
- [ ] Cross-contamination check (brand A has no brand B markers)?

A silent brand skip = a violation.

### 5.1. Kornerstone brand-parity findings — open, NOT confirmed

> Discovered while validating the per-brand snapshot. Both `[HYPOTHESIS]`/`[OBSERVATION]` — do NOT treat as a confirmed bug; candidates to confirm with dev/PO.

- **OQ-KS-1 `[HYPOTHESIS]`:** `uown_los_lead.company='UOWN'` (propagating to `uown_sv_account.company`) in funded leads of **KS1011 / merchant_pk=315**, despite `client_type=KORNERSTONE`. Hypothesis: the **brand is stamped at lead CREATION**, NOT at funding/snapshot copy — the snapshot itself correctly carries `merchant_pk=315` + `fraud_threshold=5`. Reproduced **3x** in qa2. Candidate app issue — confirm with dev/PO before classifying as a bug. It impacts the brand coverage checklist (§5): the assertion `uown_sv_account.company='KORNERSTONE'` may legitimately fail for this reason — investigate the source before marking the test red. Tag: `[db-observation:qa2,2026-06-17]` + `[test-execution:qa2, KS1011/merchant_pk=315]`.
- **OQ-KS-2 `[OBSERVATION]`:** KS `submitApplication` returns `"Failed to verify identification"` despite `is_seon_id_check_required=FALSE`. Co-signal of OQ-KS-1 (both in the Kornerstone qa2 flow). Tag: `[api-response:submitApplication]` + `[test-execution:qa2]`.

---

## 6. Principles

- `generateTestSSN(true|false)` is the canonical generator - NEVER fix an SSN for generic tests
- The last digit `9` forces denial in the mocked UW engine (sandbox/qa1 convention — qa2 caveat §6: no-op in qa2; and the dated memory `ssn9-denial-gate-off-sandbox-qa1` indicates the gate is OFF in sandbox/qa1 as well since 2026-06-17 → cross-check before assuming denial). For deterministic denial in qa2 use `auto_deny_application` (§6.1)
- The `916` suffix forces EligibleTerms 16 in the BlackBox mock (qa1 confirmed 2026-05-24)

### Caveat qa2 - UW denial determinism is environment-specific (INVIOLABLE)

> The "ending-in-9 -> UW_DENIED" is a **test-server** gate controlled by a boolean config, NOT a property of the credit engine. It only fires in **non-prod** and when the flag `deny.ssn.ending.with.9` is `true`. In **sandbox/qa1** the flag is effectively `true` (denies); in **qa2** it is effectively `false` (approves).

- **Controlling config:** `com.uownleasing.svc.service.SendApplicationService.deny.ssn.ending.with.9` (boolean, code default `true`). Code: `svc/.../application/SendApplicationService.java:361-365` — denies when `!isProduction()` **AND** flag is `true` **AND** `mainSSN.endsWith("9")`. Store: table `uown_configuration_management(key,value)` (key absent in qa2 → default `true` should apply; the `false` override comes from deploy-level properties above the table, `[HYPOTHESIS]`). **TESTED 2026-06-16: setting the key `=true` (via `POST /ConfigurationManagement/createOrUpdateConfig` + `forceReloadConfig`) was NOT enough in qa2** — ending-in-9 still approved (lead 16583). Denial also requires `!isProduction()`; qa2 is treated as prod for this gate (or a stale build is deployed). Config alone does NOT enable denial in qa2 → use sandbox/qa1 or escalate to dev/DevOps. (Config was reverted.)
- `[CONFIRMED]` (2026-06-16, qa2): a terraceFinance lead with an SSN ending-in-9 returned **UW_APPROVED** with **0 vendor calls** in `uown_los_outbound_api_log` (gate did not fire → BlackBox decided) - `[db-observation:uown_los_lead_notes]`. Reproduce with `src/scripts/probe-uw-denial-engine.ts <env> <leadPk>`.
- **Before using ending-in-9 as a denial trigger outside sandbox/qa1:** confirm the decision engine via `uown_los_outbound_api_log` / `uown_los_lead_notes`. If the real engine decides, the mock does not fire.
- **PARTIALLY SUPERSEDED:** the ending-in-9 mock is a no-op in qa2, but **a deterministic denial trigger NOW EXISTS in qa2** — `uown_merchant.auto_deny_application=TRUE` (see §6.1 below). This replaces the previous gap that said "no deterministic UW_DENIED trigger in qa2". Nuance: auto-deny is PRE-UW, does NOT exercise a literal decline from the UW engine (see §6.1).
- For tests that need a **DENIED lead** in qa2: use `auto_deny_application` (§6.1). To test the **literal decline from the underwriting engine** in qa2/prod-like: run the negative scenario in sandbox/qa1 (mock honored) OR obtain a `UW_DENIED` trigger from the engine confirmed by the PO/dev — auto-deny is pre-UW and does not substitute for that specific AC. Pre-UW deny (Blacklist button -> BLACKLIST_DENIED, no-business-in-state) is NOT "denied by underwriting" and does not substitute the engine decline AC.
- Cross-link: [[application-lifecycle]] Pitfall #109; `docs/knowledge-base/underwriting-and-funding-test-data-paths.md`; [[fraud-vendors-knowledge]] §5; dated memory `ssn9-denial-gate-off-sandbox-qa1` (gate OFF also in sandbox/qa1 since 2026-06-17 — cross-check, do not copy blindly).

---

### 6.1. DETERMINISTIC denial recipe in qa2 — `auto_deny_application` (INVIOLABLE)

> **`uown_merchant.auto_deny_application = TRUE` is the deterministic, vendor-independent denial trigger for qa2.** Independent of the UW engine (real or mock), independent of SSN.

- **Where it fires:** origination pipeline **Step 2 `merchantAutoDenyCheck`** — **PRE-UW**, BEFORE the underwriting engine.
- **Result:** `uown_los_lead.lead_status='DENIED'` (internal reason `MERCHANT_AUTO_DENIED`) — **distinct from `UW_DENIED`** (the UW engine decline). Both values exist as separate states in qa2.
- **Activity log:** `Executed: merchantAutoDenyCheck → Application denied as merchant is set to be auto denied`.
- **When to use:** when the test needs a **DENIED lead** in qa2 (the ending-in-9 mock is a no-op in qa2 — see §6 and memory `ssn9-denial-gate-off-sandbox-qa1`).
- **Critical nuance:** auto-deny is a **PRE-UW** denial — it does **NOT exercise a literal decline from the underwriting engine**. For an AC that specifically requires "denied BY underwriting", this does NOT substitute (use sandbox/qa1 or a confirmed engine trigger).
- **Merchant mutation:** toggling `auto_deny_application` on/off is a DB UPDATE (CLAUDE.md Exception 2/3) — requires explicit user authorization; prefer setup via merchant config UI when available. Do NOT leave the flag enabled after the test if other suites use the same merchant.
- **Tag:** `[db-observation:qa2,2026-06-17]` + `[test-execution:qa2, leads 16597/16598]`.
- SSN `100000053` is tied to an exact profile - reusing it with different data causes ADDRESS_MISMATCH
- Kornerstone (KS*) always gets 16m via a separate route (independent of SSN suffix)
- Brand is orthogonal to modality - depends on merchant config, not on the name

### Template routing by CUSTOMER state — Daniel's clone `OL90205-0079_clone` (qa2, 2026-06-22)

> **CORRECTION of the old note "INSTORE → store-state CA template" (resolves Open Question Q1 in SPEC `docs/scenarios/ohio-scenario3-contract-validation-spec.md`):** the clone routes the GowSign template by **CUSTOMER state**, NOT by the store state CA. Customer OH → `OH_2025_SAC_16_MONTHS`. `[CONFIRMED]` in qa2 (leads 16865/16866/16867) — contradicts the documented rule "INSTORE routes by merchant state". Before trusting the INSTORE→merchant-state rule for this clone, **assert the selected template** (`assertSelectedTemplateForLead`). Cross-link: [[gowsign-knowledge]] OH render facts, [[volatile-knowledge-registry]] §17 (GowSign state-routing).

---

## 7. Cross-references

- Business rule: `docs/business-rules/02-originacao-pipeline.md`
- Brand/company enum: `Company.java` (`UOWN`, `KORNERSTONE`)
- Merchant data: `src/data/merchants.ts`
- Test cards (BINs): `src/data/test-cards.ts`
- Test bank: `src/config/constants.ts`
- SSN generator: `src/config/constants.ts` - `generateTestSSN(approved: boolean)`
- Application lifecycle: [[application-lifecycle]]

> SSN values, confirmed environments, validation queries, and brand styling checks in detail: [references/ssn-values.md](references/ssn-values.md)

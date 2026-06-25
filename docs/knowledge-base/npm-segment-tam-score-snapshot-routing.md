---
title: "1313 — npm_segment / tam_score snapshot: env & engine routing"
domain: knowledge-base
status: stable
volatility: volatile
last_verified: 2026-06-21
sources:
  - env: qa2
  - db: uown_los_uwdata
  - db: uown_sv_uwdata
  - mr: "svc!1469 (migration V20260603054943_1.53.0)"
covers: [npm-segment, tam-score, gds-snapshot, uwdata]
promoted_to: [02-originacao-pipeline, appendix-c-tabelas-banco, appendix-e-campanhas-uw]
---

# 1313 — `npm_segment` / `tam_score` snapshot: env & engine routing

> **Category:** volatile (engine routing, env reachability, GDS mock). Verify the primary source before reusing. This is a dated discovery record, NOT a source of pattern.
> **Discovery:** 2026-06-19 · method: read-only DB probes (UI→API→DB; UI/portal not exercised — the question was "which env populates the field", answerable from persisted state). kubectl tunnel `127.0.0.1:5445` = **qa2** (anchored on report 1314 + lead PK continuity; `.env` maps QA2/DEV1/DEV2 all to 5445 → env = cluster of the active tunnel).
> **Reusable probes:** `src/scripts/_probe_uwdata.ts <env>` · `src/scripts/_probe_tireagent.ts <env>`.
> **Update 2026-06-21:** DECISIVE experiment via API in qa2 (fresh apps, post-migration, with bank data) — closes the hypothesis "unlock `tam_score` by configuring the merchant via API". See the dedicated section below (§ "Experiment via API 2026-06-21"). Throwaway probes: `src/scripts/_probe_experiment.ts`, `_probe_916.ts`, `_probe_bankdata.ts`, `_probe_lead15945.ts`, `_probe_programs.ts`.

## Question
The feature writes `npm_segment` and `tam_score` (GDS response) into `uown_los_uwdata`/`uown_sv_uwdata` during underwriting. Marcos: "send bank data, SSN ending 953, 16-month program; `tam_score` only on TireAgent." **Which env does this path actually run on?**

## Findings (qa2, 2026-06-19) — `[CONFIRMED]` by data

### 1. The columns exist in qa2
`uown_los_uwdata.{npm_segment,tam_score}` and `uown_sv_uwdata.{npm_segment,tam_score}` — all `integer`, present (migration `V20260603054943_1.53.0` applied). `uown_los_uwdata` has 32 columns (npm_segment/tam_score = #31/#32).

### 2. `npm_segment` POPULATES in qa2 — via GDS, 16m, **non-TireAgent**
- 46/6046 leads in `uown_los_uwdata` have a non-null `npm_segment`; 6 in `uown_sv_uwdata`. **All `decided_by_agent='GDS'`, `uw_status='APPROVED'`, `eligible_terms='16'`.**
- Merchants that produce it: **KORNERSTONE** (KS16008, KS16775, KS1011, KS14299, KS3015 — `scoring_company_group='4'`), **V1_UOWN** (QA_LUCAS_UOWN), **PAY_TOMORROW** (MSA Powersports, Progress Mobility).
- SSN of the npm_segment leads: **spread out** (237, 234, 663, 916, ...) — `npm_segment` is **NOT** tied to the 953 suffix; it comes on any **GDS 16m** decision.
- → **CT-01/CT-03 (npm_segment) are fully runnable in qa2.** Recipe: Kornerstone 16m merchant (e.g. **KS16775**) + bank data → GDS APPROVED eligible_terms=16 → `npm_segment` populated, `tam_score` NULL.

### 3. `tam_score` NEVER populates in qa2 — `[CONFIRMED]` 0/6046
- `count(tam_score)=0` in `uown_los_uwdata` (6046 rows) AND `uown_sv_uwdata` (2037 rows).
- **Why (mechanism, proven by data):**
  - **TireAgent (OW90218-0001) in qa2 IS decided by GDS and APPROVED, but caps at `eligible_terms='13'`** (15 recent leads, all 13m, `npm_segment`/`tam_score` NULL). The GDS branch that returns these fields is the **16m** one — TireAgent never reaches 16m in qa2.
  - **Second Look (SSN `100000053`, ending `0053`/"953") on TireAgent → `UW_DENIED`** (9+ leads, `eligible_terms=null`, tam_score null). Second Look **short-circuits in qa2** (validated only in stg, discovery 2026-04-22) → the 2nd submission with bank data that would approve 16m **never completes**.
  - Therefore the combination **TireAgent + 16m + GDS** (the only one that generates `tam_score`) is **unreachable in qa2**.

### 4. Engine distribution (qa2, all of `uown_los_uwdata`)
`TAKTILE` 2292 · `BLACKBOX` 2229 · `GDS` 1499 · `INTERNAL` 26. `npm_segment` only on the 46 GDS-16m; `tam_score` zero across all.

## Resolution of the SPEC open questions
- **Q1 (SSN "953"):** `[CONFIRMED]` = the **Second Look `100000053`** family (ending `0053`). Present in qa2 on TireAgent leads, all DENIED (1st step). For `tam_score`, Second Look must **complete the 16m APPROVED with bank data** — which does not happen in qa2.
- **Q2 (env that routes TireAgent 16m through GDS returning tam_score):** `[CONFIRMED]` **NOT qa2.** Candidate = **stg** (Second Look validated there) — **unreachable from this host** (`UOWN_DB_URL_STG=34.121.232.252:5432`, no route/VPN; connection timeout). **dev2** unknown (needs its own kubectl tunnel; `.env` reuses port 5445).

## Implication for SPEC 1313
- **CT-01 / CT-03 (`npm_segment`, non-TireAgent):** runnable in **qa2** today. Recipe Kornerstone 16m + bank data.
- **CT-02 / CT-04 (`tam_score`, TireAgent):** **blocked in qa2**. They need an env where Second Look TireAgent approves 16m via GDS (**stg**, or **dev2** to confirm). **Escalate to Marcos/dev:** (a) the exact literal SSN; (b) confirmed target env for the `tam_score` path; (c) open a dev2/stg tunnel for QA to validate.
- The SPEC's pre-assert guard (`decided_by_agent='GDS'` + `eligible_terms ~ '16'`) is **essential** — without it, a TireAgent 13m (qa2) would read `tam_score=NULL` and falsely flag a bug.

## Experiment via API 2026-06-21 — `[CONFIRMED by data]` (qa2, tunnel `127.0.0.1:5445`)

> **Difference vs discovery 2026-06-19:** the previous discovery only OBSERVED old leads in the DB (read-only). This experiment CREATED fresh applications via API with bank data (post-migration `V20260603054943`) actively trying to unlock `tam_score` (TireAgent + 16m + GDS) through every available API lever. Conclusion: the path is **genuinely env-blocked in qa2** and the "configure via API" hypothesis **does NOT hold**.

### (a) Merchant-config is NOT the lever for the 13m cap — `[CONFIRMED by data]`
TireAgent `OW90218-0001` (merchant pk **34**) **already has 2 active, in-window 16m programs**: `KWC-2.3` (program pk **4718**) + `KWC-1.75` (program pk **4741**), type LTO/SAME_AS_CASH, covering CA/OH/NY — link confirmed in `uown_merchant_to_program` (merchant_pk=34). In other words, **the merchant is enabled for 16m** and the GDS still returns `eligible_terms='13'`. The cap is the **GDS term decision for the `TIRE_AGENT` segment**, not merchant config. No field of the `updateMerchants`/`MerchantDesiredState` surface (`dealerDiscountOverride`, `uwPipeline`, `fraudThreshold`, `maxApprovalAmount`, `isGdsEnabled`, `offerInsurance`) controls the term granted by the GDS.

### (b) SSN suffix `916` is mock-only (BlackBox, qa1/sandbox) — `[CONFIRMED by data]`
`916` forces EligibleTerms 16 **only in the BlackBox mock** (qa1/sandbox). TireAgent in qa2 routes to **GDS**, which **ignores the mock** and decides the term by real credit logic → returns 13m (or denies). Fresh proof (apps created with bank data):
- Lead **16794** (TireAgent + CA + `…916` + bankData) = GDS **APPROVED** `eligible_terms='13'` `tam_score=NULL`.
- Lead **16795** (TireAgent + OH + `…916` + bankData) = **DENIED**.

### (c) Lead 15945 — the only historical TireAgent `eligible_terms=16`, pre-migration — `[CONFIRMED by data]`
The only TireAgent with `eligible_terms=16` in qa2 = lead **15945** (1 of 474, SSN `…9916`, 2026-04-28) and **even so `tam_score=NULL`** because it is **prior to migration `V20260603054943`** (2026-06-03). This confirms that even the single historical 16m case would not help — the field only started being written post-migration.

### (d) Second Look `0053` is still DENIED in qa2 — `[CONFIRMED by data]`
SSN `100000053` (Marcos's "ending 953" / suffix `0053`) on TireAgent qa2 → **DENIED + short-circuit** (approves 16m only in **stg**). Reconfirmed in this experiment.

### (e) Table — attempted × resulting `eligible_terms` (TireAgent qa2, fresh apps 2026-06-21)

| Attempt | SSN suffix | State | Bank data | Result | `eligible_terms` | `tam_score` |
|-----------|-----------|--------|-----------|-----------|------------------|-------------|
| Lead 16794 | `916` | CA | yes | GDS APPROVED | `13` | NULL |
| Lead 16795 | `916` | OH | yes | DENIED | — | NULL |
| Second Look | `0053` | CA | yes (2nd) | DENIED / short-circuit | — | NULL |
| Lead 15945 (historical) | `9916` | — | — | APPROVED 16 (pre-migration) | `16` | NULL |
| Merchant config levers (updateMerchants) | n/a | — | — | none affects the GDS term | unchanged | NULL |

### Closed conclusion
**TireAgent + 16m + GDS (the only combination that generates `tam_score`) is unreachable in qa2 by ANY API lever.** Path to `tam_score`: env **stg**/**dev2**, GDS mock, or a backend change — **outside the QA surface**. CT-02/CT-04 remain `.skip` with the pre-assert guard `decided_by_agent='GDS'` AND `eligible_terms ~ '16'` (Rule #10 — never a red assert on an env-blocked path). Do not re-investigate via API.

## Corrects/updates
- `[[ssn-test-modalities]]`: `100000053` (Second Look) is the trigger for `tam_score`; it only completes where Second Look does not short-circuit (stg). qa2 stays DENIED.
- Memory `qa2-16m-eligibility-kornerstone-route`: reinforced — TireAgent in qa2 = GDS+13m (not 16m); 16m via Kornerstone (non-TireAgent) → yields `npm_segment` but never `tam_score`.

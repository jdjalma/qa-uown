---
name: merchant-preflight
description: Load before creating any UOWN application via API/UI. Validates that the merchant config (checkboxes + 13m/16m programs) matches src/data/merchant-config-contract.ts. Auto-heal via AUTO_HEAL_MERCHANT=true, otherwise fail-fast with a drift list.
disable-model-invocation: true
---

# Merchant Preflight Contract

> **Authority boundary** (`docs/_docs-conventions.md` §7): this skill covers **HOW TO SET UP** — preflight procedure, contract validation, pitfalls. The **canonical product behavior** (merchant config flags, funding state machine, enums) does NOT live here — it is the single source in `docs/business-rules/08-funding-merchants.md` + `appendix-c-tabelas-banco.md` and `src/data/merchant-config-contract.ts`. To resolve a topic, run `node scripts/docs-tooling.mjs resolve merchant-config`. **Do not duplicate merchant rules here** — they drift.

## When to apply

Load this skill **whenever the test creates a new application** — whether via UI (`new-application`) or via API (`sendApplication`, `createPreQualifiedApplication`).

**Do NOT load** when the test operates on an **existing** lease/account — mutating an out-of-scope merchant's config is a forbidden side effect. In those cases pass `skipMerchantPreflight: true` or simply do not invoke the helper.

## Why it exists (inviolable rule #12)

Without preflight, tests flake because of silent merchant drift: a checkbox that was manually disabled, a 16m program that disappeared from the config, an inactive term. The bug surfaces as "approval expected but denied" — a generic symptom, costly to diagnose.

## Procedure

### Default (auto-heal enabled)

```ts
import { createPreQualifiedApplication } from "@/helpers/...";

// ensureMerchantReady is called automatically inside createPreQualifiedApplication
const lead = await createPreQualifiedApplication({ merchant: "UOWN_DEMO" });
```

`createPreQualifiedApplication` invokes `ensureMerchantReady(merchant)` under the hood, which:

1. Reads the expected config from `src/data/merchant-config-contract.ts`
2. Compares it against the current config in the DB (via admin API or direct query)
3. If `AUTO_HEAL_MERCHANT=true` (default in `.env`): calls `createOrUpdateMerchant` to align it
4. If `AUTO_HEAL_MERCHANT=false`: fails fast with a **drift list** (divergent fields + expected vs actual values)

### When using a path OTHER than `createPreQualifiedApplication`

If the test creates an application via the UI `/new-application` or the API with a direct client:

```ts
import { ensureMerchantReady } from "@/helpers/...";

await ensureMerchantReady(merchantSlug); // call BEFORE submitApplication
await api.sendApplication({ ... });
```

### When to skip (intentionally)

```ts
await createPreQualifiedApplication({
 merchant: "UOWN_DEMO",
 skipMerchantPreflight: true, // test operates on a pre-existing lead
});
```

## Expected contract

See `src/data/merchant-config-contract.ts` for the source-of-truth. Summary:

- **Checkboxes** that must be `true`: e.g. `kountEnabled`, `seonEnabled`, `creditPullEnabled`
- **Programs**: `term_in_months IN (13, 16)` + `is_active=true` in the `uown_merchant_program` table
- **Brand**: aligned with `uown_los_lead.brand_id` (UOWN vs Kornerstone)

## Known pitfalls

1. **KS3015 available in all envs** (qa1, qa2, stg, dev) — do not assume Kornerstone is qa2-only (memory `reference_kornerstone_ks3015_qa2_only` was corrected on 2026-05-18).
2. **16m eligibility is merchant-config, not brand** — any merchant (UOWN or KS) with an active 16m program supports it. Never say "UOWN does not offer 16m" (memory `feedback_16m_eligibility_merchant_config`).
3. **DV360 UAT qa1 outage 2026-05-18** — `sendApplication` returned 500 Apache HTML in qa1; svc healthy; workaround: wait/qa2/pre-existing leads (memory `project_dv360_uat_qa1_outage_2026_05_18`).
4. **Auto-heal is not free** — it touches merchant config in the DB. In parallel tests it can cause a race. Consider `skipMerchantPreflight: true` if another test already guaranteed the setup.
5. **Snapshot immutability (R1.53.0)** — the merchant's UW config is **frozen at approval** in `uown_los_lead_merchant_settings_snapshot` (at the lead's `UW_APPROVED`) and in `uown_sv_account_merchant_settings_snapshot` (at account creation, copying the lead's snapshot). For tests that depend on the snapshot, the preflight/auto-heal must run **BEFORE UW approval** — mutating the merchant's config AFTER approval does **NOT** update the already-written snapshot (it creates a live-vs-snapshot drift that does not propagate). See app-lifecycle pitfall #112 and `appendix-c` (Merchant Settings Snapshot).

## Anti-patterns

- ❌ Creating an application without preflight "because it already ran yesterday"
- ❌ Direct UPDATE on the DB to force the config — violates inviolable rule #9 (test data hierarchy)
- ❌ Assuming `AUTO_HEAL_MERCHANT=true` is universal — in CI it may be `false`
- ❌ Ignoring the drift list and trying a workaround in the test code

## Cross-links

- Inviolable rule #12 in `CLAUDE.md`
- Skill [[test-data-hierarchy]] — preflight respects the hierarchy (no direct UPDATE)
- Skill [[application-lifecycle]] — step 0 of the lifecycle is merchant ready
- Source: `src/data/merchant-config-contract.ts`, `src/helpers/merchant.helpers.ts` (or equivalent name)

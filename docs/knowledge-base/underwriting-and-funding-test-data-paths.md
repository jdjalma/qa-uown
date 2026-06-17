# Underwriting Decision & Funding — Test-Data Setup Paths

> Scope: how the Origination underwriting + funding flow behaves, and how to produce two hard-to-reach test-data states — (1) a lead **denied by underwriting** (`UW_DENIED`), and (2) a lead that reaches **FUNDING without ever having a UW-config snapshot**. Covers the **Merchant Settings Snapshot** feature (immutable snapshots of merchant UW config at lead approval + account funding).
> Sources: `docs/business-rules/02-originacao-pipeline.md` + `08-funding-merchants.md`, the skills below, live Origination portal (qa2, 1440×900 — internal portal, Rule #15) and read-only DB probes.
> Overall confidence: **high** for the setup mechanisms and the snapshot schema (deployed + DB-verified).

## Purpose

Two test-data states are needed to exercise the snapshot feature's negative scenarios:

- **A lead DENIED by underwriting** (`UW_DENIED`) — so "no snapshot recorded when a lead is denied" can be checked.
- **A lead that reaches FUNDING without a UW snapshot** — so "account snapshot creation is silently skipped, account still created" can be checked.

Both are pre-conditions (setup), not the feature behaviour itself.

## Available Operations (admin affordances in the Origination portal)

| Operation | Where | Available? | Notes |
|---|---|---|---|
| Manual status → SIGNED | Lead detail (`/customers/{leadPk}`) → **"Change to Signed"** button | ✅ `[confirmed]` | The UI face of `changeLeadStatus(SIGNED)`. |
| Set to Expired | Lead detail → "Set to Expired" | ✅ `[confirmed]` | |
| Modify Approval Amount | Lead detail → "Modify Approval Amount" | ✅ `[confirmed]` | |
| Resend E-sign | Lead detail → "Resend E-sign" | ✅ `[confirmed]` | |
| Blacklist Lead | Lead detail → "Blacklist Lead" | ✅ `[confirmed]` | Produces `BLACKLIST_DENIED` (a `DENIED` variant, not `UW_DENIED`). |
| Funding queue → FUNDED | **Funding** nav → "Funding Queue" → **"Send to FUNDED"** | ✅ `[confirmed]` | Bulk action; manages `FUNDING → FUNDED`. |
| Funding audit trail | **Funding Modification History** nav | ✅ `[confirmed]` | Records old/new funding + lead status per change (business-rules §67). |
| New Application | **New Application** nav | ✅ `[confirmed]` | UI path to create a lead (alternative to API `sendApplication`). |

The lead detail shows **two status fields side by side — "Status" (public) and "Internal Status"** — confirming the `uw_status` vs `internal_decision` split (business-rules 02 §"Campo internal_decision"). `[confirmed]`

## Flow and States

Normal lifecycle (observed via a lead's Activity Log, oldest→newest):

```
REVIEW ("Lead has been reviewed")
  → Invoice ADDED_TO_CART
  → FinalizePurchaseEmail
  → "[Signing Flow] Started. Lead status UW_APPROVED"   ← snapshot is written here
  → CC Auth Passed / TOKENIZATION
  → Contract ADDED (contractStatus = NEW, esignMode = EMBEDDED)
  → "[Signing Flow] Contract created. Lead status CONTRACT_CREATED"
```

Canonical state machine (business-rules 02 + 08):

```
NEW/PENDING_UW → UW_APPROVED → CONTRACT_CREATED → SIGNED → FUNDING → FUNDED
                      │
                      └─(denial branch)→ UW_DENIED      (no UW_APPROVED, no snapshot)
                      └─(pre-UW deny)→ DENIED           (state/blacklist/merchant-autoDeny; never reaches UW)
```

| From → To | Trigger | Allowed? | Source |
|---|---|---|---|
| UW_APPROVED → SIGNED | "Change to Signed" / `changeLeadStatus(SIGNED)` | ✅ | business-rules 08 §49; UI observed |
| CONTRACT_CREATED → SIGNED | "Change to Signed" | ✅ | UI observed |
| SIGNED → FUNDING | `settleApplication` (then funding queue) | ✅ | business-rules 08 §9, §51.4 |
| FUNDING → FUNDED | "Send to FUNDED" / `updateFundingStatus` | ✅ | UI observed; business-rules 08 §67 |
| → UW_DENIED (denied) → FUNDING | direct manual transition | ❌ not supported | `changeLeadStatus` allows only UW_APPROVED/EXPIRED/SIGNED (08 §49) |
| settle a non-SIGNED lead | `settleApplication` | ❌ | "LeadStatus UW_APPROVED is not eligible for settlement" (08 §51.4) — must be SIGNED first |

## Business Rules / Findings

### Producing a `UW_DENIED` lead — environment-specific

> ⚠️ **The "SSN ending-in-9 → UW_DENIED" rule is sandbox/qa1-only.** In **qa2** an ending-in-9 SSN for **terraceFinance** returns **UW_APPROVED** — `[CONFIRMADO]` (2026-06-16): the lead's activity log shows the **BlackBox/ABB** engine approving with **0 vendor calls** in `uown_los_outbound_api_log`, i.e. qa2 routes TERRACE_FINANCE through the real BlackBox/ABB engine, which does NOT honour the mock short-circuit. Reproduce with `src/scripts/probe-uw-denial-engine.ts <env> <leadPk>`. **Do NOT rely on ending-in-9 for a qa2 denial.** See [[application-lifecycle]] Pitfall #109, [[ssn-test-modalities]] §6.

- **An SSN ending in `9` (`generateTestSSN(false)`, `src/config/constants.ts`) is rejected deterministically by the MOCKED UW engine — on sandbox/qa1 only.** `[confirmed]` on sandbox/qa1, corroborated by four sources:
  - `ssn-test-modalities` SKILL: *"Denial generico | `generateTestSSN(false)` (termina em 9) | UW_DENIED imediato"*.
  - `ssn-values.md`: *"último dígito `9` força denial no motor de UW mockado"*.
  - business-rules 08 §"Regras do Sandbox": *"SSN terminando em 9 → Aplicação será negada"*; API example `fieldInError1: "SSN : ending with 9 is rejected on test server"`, `appApprovalStatus: "DECLINED"`.
  - `fraud-vendors-knowledge` SKILL: `= 9 → UW_DENIED`.
- **The mock path is vendor-independent**, so on sandbox/qa1 it stays reliable even when DV360/Kount/GDS token sweeps are degraded (SSNs *outside* the catalog can return spurious `UW_DENIED` when a sweep token expires). `[confirmed]` (fraud-vendors-knowledge §5).
- **Distinction:** `UW_DENIED` (the engine declines at the underwriting step) is "denied by underwriting". Pre-UW denials — State Check (NJ/VT/MN/ME), Blacklist ("Blacklist Lead" button), Merchant Auto-Deny — produce a `DENIED` variant *without reaching underwriting*; they also create no snapshot but are **not** "denied by underwriting". `[confirmed]` (business-rules 02 §4 steps 1–12).

**Recipe (sandbox/qa1):** `sendApplication` (or New Application UI) with `mainSSN = generateTestSSN(false)` → poll `getApplicationStatus` → expect `UW_DENIED` / `appApprovalStatus=DECLINED`. No merchant fraud-flag changes needed. **On qa2:** confirm the deciding engine first (`probe-uw-denial-engine.ts`); if BlackBox/ABB decides, the mock won't fire — use sandbox/qa1 or enable the config below.

#### The config that gates the ending-in-9 denial

The ending-in-9 → `UW_DENIED` behaviour is a **backend test-server convenience**, controlled by a single boolean config key. `[CONFIRMADO]` via backend code:

- **Config key:** `com.uownleasing.svc.service.SendApplicationService.deny.ssn.ending.with.9` (boolean, code default **`true`**).
- **Code:** `svc/src/main/java/com/uownleasing/svc/service/application/SendApplicationService.java:361-365`. The denial returns only when **ALL three** are true:
  1. `!SystemConfigurationManagement.isProduction()` — non-prod only (qa2 qualifies); it is intentionally never active in production.
  2. `configurationManagement.getBoolean(...deny.ssn.ending.with.9, true)` — the flag.
  3. `applicationRequest.getMainSSN().endsWith("9")`.
  → `getDeniedResponse(lead, "SSN : ending with 9 is rejected on test server", LeadStatus.UW_DENIED, ...)`.
  (Base logic since 2024-04; flag-wrapped in commit `d6c943f411`.)
- **Config store:** live key/value table **`uown_configuration_management(key, value)`** (the dynamic config source; 92 rows, incl. 43 `com.uownleasing.svc.*` keys). The `deny.ssn.ending.with.9` key is **absent** in qa2 → by code the default `true` should apply, **yet qa2 approves ending-in-9**. So the effective value is being forced to `false` at a layer above this table (deploy-level application properties / the `SystemConfigurationManagement` source) — `[HIPÓTESE]` on the exact layer; confirm with DevOps which config source qa2's svc reads.

**To make ending-in-9 a denial in qa2:** ensure the key resolves to `true` for qa2's svc. Options, in order of cleanliness:
1. **DevOps** — set `com.uownleasing.svc.service.SendApplicationService.deny.ssn.ending.with.9=true` in qa2's effective svc config (authoritative; covers all merchants/client types).
2. **DB config row** — upsert `uown_configuration_management (key, value)` via the admin API `POST /ConfigurationManagement/createOrUpdateConfig {key, value:"true"}` then `GET /ConfigurationManagement/forceReloadConfig` (no raw DB write needed; this is how the value is stored + cached).

> ⚠️ **TESTED 2026-06-16 — the flag alone is NOT sufficient in qa2.** I set the key to `true` via the API (`createOrUpdateConfig` returned 200, DB row confirmed `value='true'`, `forceReloadConfig` 200), refreshed Kount/GDS sweeps, then submitted a **fresh ending-in-9 application** to terraceFinance → it **still returned `UW_APPROVED`** (lead 16583), NOT denied. `[CONFIRMADO]`. → The denial is gated by **`!isProduction()` AND the flag** (code line 361); with the flag now `true` and still approving, **qa2's svc is effectively treated as production for this gate** (or the deployed build predates the flag-wrapping commit `d6c943f411`). **Conclusion: ending-in-9 denial CANNOT be enabled in qa2 by config alone** — it needs dev/DevOps to confirm `SystemConfigurationManagement.isProduction()` for qa2 (and the deployed svc build). The config change was **reverted** (row deleted, cache reloaded). For denial tests, **use sandbox/qa1** (mock honoured) or a PO/dev-confirmed trigger.

This is environment/config knowledge — it does NOT change the test code; the existing `generateTestSSN(false)` denial test runs unchanged **once a denial is actually reachable in the target env** (sandbox/qa1 today, not qa2).

### Producing a lead at FUNDING with no UW snapshot

The snapshot is written when the lead becomes **UW_APPROVED via the underwriting engine**. A lead snapshot is written on **essentially every approval** — even a PAY_TOMORROW merchant with all-null config produced snapshots (with null values). So **a never-approved/skip-UW lead does NOT naturally produce a "no snapshot" state.** Candidate paths:

- **Path A (recommended, deterministic) — approve normally, then remove the snapshot, then fund.**
  1. Create an approved lead the normal way (`createPreQualifiedApplication`, ending-in-non-9 SSN) → snapshot row is written.
  2. **DELETE the lead-snapshot row** for that `leadPk` — *requires explicit user authorization (CLAUDE.md Exception 2 / Rule #9; DB DELETE is forbidden without it).* Scope the DELETE to the test's own fresh `lead_pk` only.
  3. Drive to funding with **`driveLeadToFunding(api, merchant, ctx)`** → `changeLeadStatus(SIGNED)` → `settleApplication` → `updateFundingStatus(FUNDING)` (`src/helpers/api-setup.helpers.ts`).
  4. Assert the **account** snapshot was skipped and the account was still created. `[confirmed]` — this path works end-to-end (account created `ACTIVE`, no account snapshot).
- **Path B — skip-UW merchant (no DB write).** Some client types can skip underwriting (`decision=ACCEPT`) (business-rules 02 §6 "Skip UW"). **Effectively dead:** snapshots fire even for skip-UW-eligible client types (PAY_TOMORROW), so this does not yield a no-snapshot lead. `[confirmed]`
- **Path C — pre-existing lead created before the feature shipped.** Has no snapshot, but cannot be reproduced fresh and violates the Test-Data Hierarchy (Rule #9). Read-only confirmation only, with user authorization. `[inferred]`

**Note on "admin override":** the **"Change to Signed"** button + **Funding Queue / Send to FUNDED** force the lifecycle forward, but on their own operate on a lead that *already* passed UW_APPROVED (it needs a contract to sign), so they are **not** a snapshot bypass — they must be combined with Path A's snapshot removal.

## Logic and Exceptions

- `driveLeadToFunding` is the supported helper (referenced in `.claude/rules/helpers.md`); signature `(api, merchant, ctx)`. There is **no** `driveToFundedAndGetAccountPk`.
- `settleApplication` requires the lead to be **SIGNED** and all invoice items **DELIVERED** (appendix-d D.28); a non-SIGNED lead returns `A0 "not eligible for settlement"`.
- Merchant preflight: snapshot setups read merchant UW settings (EPO5/EPO10/UW Pipeline/Fraud Threshold). Fraud flags in `mustBeFalse` are auto-healed; don't rely on toggling them via the portal for a lead that runs preflight (Pitfall #6/#9).

### qa2 caveats (from `docs/claude/environments.md` "qa2 Known Issues")

These hit the denial / funding setup paths directly:

- **`sendApplication` slowness/hangs on qa2** for several merchants (Daniel's `OL90205-0079`, Saslow's `OW90337-0001`, others) — times out at 300s; the **denied path can take >180s**. Use generous timeouts; pick a merchant not on the slow list (validate `terraceFinance` first). `[confirmed 2026-05-06]`
- **`MerchantConfigurator.configureByName` fails silently in qa2** (lowercase `refCode` vs stored casing) → preflight skipped silently. Use `skipMerchantPreflight: true` or pass `merchant.number` directly. `[confirmed]`
- **Stale Kount/GDS sweep tokens → spurious `UW_DENIED`/500/401 for SSNs OUTSIDE the catalog.** For an *approved* lead, run `refreshKountAccessTokenSweep` + `refreshGdsAccessTokenSweep` first. `[confirmed]` (fraud-vendors-knowledge §3/§5).
- **`makeCreditCardPayments` HTTP 500 (FK violation) on qa2 new accounts** — avoid CC-payment steps in qa2 setup. `[confirmed]`
- Second Look (`100000053`) **short-circuits in qa2** (validated only on `stg`). `[confirmed 2026-04-22]`

## Merchant Settings Snapshot — confirmed schema (deployed)

Flyway `20260609155406.1.53.0` "add merchant settings snapshot tables" — installed **2026-06-15**, success=true (qa2).

**Read-only re-verification probes.** Run with `npx tsx src/scripts/<name>.ts qa2`:

| Probe | Purpose |
|---|---|
| `src/scripts/probe-merchant-settings-snapshot-schema.ts` | Discover whether the snapshot feature is deployed in an env (candidate tables, matching columns, Flyway evidence). Run first when confirming deploy in a new env. |
| `src/scripts/probe-merchant-settings-snapshot-rows.ts` | Full schema + row counts + sample rows of both snapshot tables. Use to confirm the account snapshot is firing. |
| `src/scripts/probe-merchant-uw-config.ts` | Merchant UW config (`epo5/epo10/uw_pipeline/fraud_threshold`) + lead-snapshots grouped by merchant with live config. Use to confirm merchant values before a run. |
| `src/scripts/probe-uw-denial-engine.ts` | Dumps a lead's activity log + outbound API calls (`…ts <env> <leadPk>`) to show **which UW engine decided** the lead (BlackBox/ABB vs mock). |

**`uown_los_lead_merchant_settings_snapshot`** (lead snapshot) — `[confirmed]`:
`pk, row_created_timestamp, row_updated_timestamp, tenant_id, web_user_id, agent, lead_pk (NOT NULL), merchant_pk (NOT NULL), program_pk, epo5 (bool), epo10 (bool), uw_pipeline (varchar), fraud_threshold (int)`.

**`uown_sv_account_merchant_settings_snapshot`** (account snapshot) — `[confirmed]`, **fires on funding**: a row appears after `driveLeadToFunding` completes and the SVC account is created (DB-verified, `[db-observation:uown_sv_account_merchant_settings_snapshot]`). Same columns **plus `account_pk (NOT NULL)`**. The account snapshot **copies the values from the lead snapshot**, not the live merchant config (verified: with the merchant edited between approval and funding, the account snapshot keeps the approval-time value).

Validation queries:
```sql
SELECT epo5, epo10, uw_pipeline, fraud_threshold, merchant_pk, program_pk, row_created_timestamp
  FROM uown_los_lead_merchant_settings_snapshot WHERE lead_pk = $1 ORDER BY pk DESC;     -- lead
SELECT epo5, epo10, uw_pipeline, fraud_threshold, lead_pk, merchant_pk, row_created_timestamp
  FROM uown_sv_account_merchant_settings_snapshot WHERE account_pk = $1 ORDER BY pk DESC; -- account
```

**Merchant config (qa2):** `terraceFinance` = **pk 26 / `OL90202-0001`** with all four values set: **`epo5=true, epo10=true, uw_pipeline='Test', fraud_threshold=1`** (pk 3/54/82 are all-null clones — do not use). `Tire Agent` pk 34 = `epo5/epo10=true, fraud_threshold=3, uw_pipeline=NULL`; its snapshots mirror that config exactly → **the snapshot captures live merchant config correctly** `[confirmed]`. Re-confirm the four values at runtime before asserting (a preflight auto-heal or another run could change them).

**Key facts for snapshot tests:**
- A lead snapshot is written on essentially every approval, so the only deterministic "no lead snapshot" state is Path A (DELETE the row, authorized).
- The merchant's `uw_pipeline`/`fraud_threshold` may be NULL by default — establish/assert known non-null values before creating the lead so "captures all four values" and per-field immutability checks are meaningful.
- The account snapshot fires on funding and copies the lead-snapshot values — verified end-to-end (positive create, immutability under merchant edit, and derive-from-lead all hold; account still created when the lead snapshot is absent).

## Connections with What Was Already Known

- **Confirms** business-rules 02 (pipeline, `internal_decision` vs `uw_status`) and 08 (funding state machine, settlement eligibility) against the live portal.
- **Corrects** `ssn-test-modalities` / `fraud-vendors-knowledge`: ending-in-9 → `UW_DENIED` is **sandbox/qa1-only**, NOT universal (qa2 BlackBox approves).
- **Confirms** `driveLeadToFunding` is the canonical drive-to-FUNDING helper.
- **New:** the Origination portal exposes manual overrides ("Change to Signed") and a Funding Queue ("Send to FUNDED").

## Open items

- **Producing `UW_DENIED` in qa2:** no deterministic, vendor-independent trigger is known (ending-in-9 approves via BlackBox/ABB). Run denial scenarios on sandbox/qa1, or obtain a PO/dev-confirmed qa2 trigger. Never re-point a denial test at an unverified trigger.
- **No-snapshot funding state:** only Path A (authorized scoped DB DELETE of the lead-snapshot row) reliably produces it, since snapshots fire on every approval.

## Cross-references

- Pitfalls: [[application-lifecycle]] #108 (merchant Search-table filter), #109 (ending-in-9 / BlackBox engine), #110 (EPO triple `.collapse`), #111 (`afterAll` worker-scoped fixtures).
- Skills: [[ssn-test-modalities]] §6 (env-specific denial caveat), [[fraud-vendors-knowledge]] §5, [[volatile-knowledge-registry]].

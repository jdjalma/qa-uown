---
name: fraud-vendors-knowledge
description: Use when a test or task touches a fraud/identity-verification vendor integrated to UOWN — SEON (ID document + selfie), Kount (login-attempt scoring + token refresh sweep), DV360 / DataView360 (UW underwriting). Triggers on file paths `src/api/clients/seon.client.ts`, `src/api/bodies/seon.body.ts`, `tests/**/*seon*`, `tests/**/*kount*`, `tests/**/*fraud*`, or mentions of "ID verification", "SEON bypass", "isSeonIdCheckRequired", "Kount token", "refreshKountAccessTokenSweep", "GDS token", "DataView360", "DV360 UAT outage", "dataview360", "outbound_api_log", "login attempt schema", "selfie liveness", "document scan QR overlay", "NeuroID simulate toggle", "neuroid repeated-call guard".
disable-model-invocation: true
---

# Fraud / Identity Vendors — UOWN domain knowledge

> SEON, Kount, DV360 — when each one activates in the flow, how to simulate responses in tests, DB tables touched, bypass schemas, and the current DV360 UAT outage.

> **Authority boundary** (`docs/_docs-conventions.md` §7): this skill covers **HOW TO TEST** — bypass patterns, pitfalls, DB tables. The **canonical product behavior** (when each vendor activates, status enums, decision rules) does NOT live here — it has a single source in `docs/business-rules/09-integracoes-externas.md` + `appendix-a-integracoes.md` and `src/data/merchant-config-contract.ts`. To resolve a topic, run `node scripts/docs-tooling.mjs resolve fraud-vendors`. Recent investigations: `docs/knowledge-base/*neuroid*` · `docs/knowledge-base/*seon*`. **Do not duplicate vendor rules here** — they drift.

## When to apply

- Application test involving a merchant with `isSeonIdCheckRequired=true` (Kornerstone family, e.g. KS3015).
- `sendApplication` failing with a 500 Apache HTML → suspected DV360 UAT outage.
- Token expiry sweep tests — Kount / GDS.
- Login-attempt scoring (Kount) — `uown_login_attempt` joins.
- UW activity log showing `[Sentilink]`/`[Lexis]`/`[Kount]`/`[GDS]`/`[Neustar]` in `uown_los_lead_notes`.

Do NOT apply for signing (use `gowsign-knowledge`), payment processing (use `payment-flows`), or the Buddy widget (covered in `.claude/rules/testing.md § Buddy Insurance Widget`).

## Essential knowledge

### 1. Vendor catalog — where each one weighs in

| Vendor | Function | When it activates | Bypass / simulation |
|--------|--------|--------------|---------------------|
| **SEON** | ID document scan + selfie liveness | Pre-`submitApplication`, only if `merchant.isSeonIdCheckRequired = true` | API `POST /uown/los/seon/createOrUpdate` with `idVerifySuccess: true` (full skip) |
| **Kount** | Login attempt scoring + device fingerprint | Origination login / risk decision | Token sweep `refreshKountAccessTokenSweep` — SSN catalog covers bypass paths |
| **DV360 (DataView360)** | UW backbone (mediator: Sentilink, LexisNexis, GDS, Neustar) | `sendApplication` → svc → DV360 UAT → UW decision | No bypass; depends on the external environment |
| **NeuroID** | Behavioral/interaction fraud signal during signing | Signing flow, gated by `merchant.useNeuroIdCheck = true` | No bypass; observe via DB. **Source of truth for counts = `uown_neuro_id_verification WHERE lead_pk=$1`** (helper `countNeuroIdCalls`), NOT `uown_sv_outbound_api_log` |

> **NeuroID — do not use `uown_sv_outbound_api_log` for correlation by `lead_pk`.** The table has rows for NeuroID calls (`url ILIKE '%neuro-id.com%'`), but for **pre-funding leads** `account_pk`, `source_uuid` and `return_uuid` are all **NULL** — there is no correlation key with `lead_pk`. Assertions of "NeuroID was/was not called N times" must use `uown_neuro_id_verification WHERE lead_pk = $1` (`countNeuroIdCalls`, helpers-catalog). Confirmed by discovery probe `src/scripts/probe-neuroid.ts`. `neuro_id_status` values observed in qa2: only `SUCCESS` and `PROFILE_NOT_FOUND` — the enum `NeuroIdStatus.NOT_ENOUGH_INTERACTION_DATA` is `@unconfirmed` in `src/types/enums.ts`. **`useNeuroIdCheck=true` is in `mustBeFalse` in the merchant preflight contract** — see Pitfall #9 below and [[application-lifecycle]] Pitfall #102. **R1.53.0:** there is a config simulate-toggle `...NeuroIdVerificationService.simulate.not.enough.interaction.data` (default false) that forces `NOT_ENOUGH_INTERACTION_DATA` (non-blocking pass-through, `success=true`); and the "prevent repeated NeuroID calls" guard (skip-on-prior-approval) was **NOT merged in R1.53.0** (branch reverted) — do not write tests assuming the skip. See [[application-lifecycle]] Pitfall #140.

Check `src/data/merchant-config-contract.ts:54-74` — which fraud-related flags the merchant may have ON/OFF:

```typescript
BASE_MUST_BE_FALSE = [
 'isIntellicheckRequired',
 'isSeonIdCheckRequired', // SEON OFF for UOWN base
 'isBankVerificationRequired',
 // ...
 'useLexisNexis',
 'useNeuroIdCheck',
 // ...
 'isFraudCheckRequired',
 'useNeustar',
 'useSentilink',
];
```

The rule: UOWN base merchants have fraud flags OFF. Kornerstone legitimately has `useWebhook=true` + `holdDeposit=true` ON. **Setting a fraud flag to true in qa breaks the preflight contract** (`ensureMerchantReady`) — auto-heal will reset it.

### 2. SEON — ID Verification

#### Where it activates

- Merchant has `isSeonIdCheckRequired = true` → pre-`submitApplication`.
- Backend calls `IdVerificationService.verifySeon`, which **short-circuits on `idVerifySuccess == true`** (svc line 173) — skips all name/DOB/expiration checks.
- The SEON SDK requires a camera (document scan + selfie/liveness) → impossible in headless. API bypass is the standard for automation.

#### Bypass endpoint

```
POST /uown/los/seon/createOrUpdate
```

Client: `src/api/clients/seon.client.ts` → `api.seon.approveVerification({ leadPk, fullName, birthDate })`.

Full body (`src/api/bodies/seon.body.ts:46-62`):

```typescript
{
 leadPk,
 referenceId: crypto.randomUUID,
 fullName,
 status: 'APPROVED',
 success: true,
 idVerifySuccess: true, // ← this is the key flag for the short-circuit
 documentType: 'DRIVERS_LICENSE',
 nameMatchCheckResult: 'PASS',
 stateCheckResult: 'PASS',
 postalCodeResult: 'PASS',
 dateOfBirthResult: 'PASS',
 birthDate, // ISO YYYY-MM-DD (Java LocalDate)
 documentExpirationDate: '2030-01-01',
}
```

#### DOB conversion (common pitfall)

`applicant.dob` comes in `MM/DD/YYYY` (test data). Java LocalDate requires `YYYY-MM-DD`:

```typescript
const [month, day, year] = applicant.dob.split('/');
const birthDateISO = `${year}-${month}-${day}`;
```

See `tests/api/seon-id-verification-bypass.spec.ts:124-127` and `tests/e2e/origination/seon-e2e-flow.spec.ts:120-122`.

#### DB validation

```sql
SELECT status, success, id_verify_success, full_name, birth_date, document_expiration_date
FROM uown_seon
WHERE lead_pk = $1
ORDER BY pk DESC LIMIT 1;
```

Expected after bypass: `status='APPROVED' AND success=true AND id_verify_success=true`. See `tests/api/seon-id-verification-bypass.spec.ts:141-160`.

#### `SEON_ID_FAILED` — internal_status, NOT lead_status (confirmed 2026-06-23)

`SEON_ID_FAILED` is a value of **`internal_status`** (column `internal_status` in `uown_los_lead`), never of `lead_status`. `IdVerificationService.java:254` calls `updateLeadStatus(lead, null /*leadStatus*/, SEON_ID_FAILED /*internalStatus*/, ...)` — with `leadStatus=null`, `LeadInfo.setLeadStatus` writes **only** `internal_status`; `lead_status` stays `UW_APPROVED`. Live proof: leads 97950/97951 (sandbox 2026-06-23) — name-mismatch SEON record + `submitApplication` → `internal_status=SEON_ID_FAILED`, `lead_status=UW_APPROVED`. Correct assertion:

```sql
SELECT internal_status FROM uown_los_lead WHERE pk = $1;
-- expected: 'SEON_ID_FAILED'
-- NEVER check lead_status for this state
```

Reachable via API (no camera): inject `idVerifySuccess=false` + `nameMatchCheckResult=FAIL` + `status=REJECTED` via `createOrUpdate` → `submitApplication` → `internal_status=SEON_ID_FAILED`. Covered in `tests/api/seon-negative-scenarios.spec.ts` CT-02/CT-03 (8/8 green). **Exception:** if there is no SEON record at all (`SeonIdVerificationStep` returns STOP "No SEON record found"), `internal_status` stays `UW_APPROVED` (e.g. lead 97955).

#### UI flow with SEON active

`tests/e2e/origination/seon-e2e-flow.spec.ts` shows the full hybrid pattern:

1. `sendApplication` → extract `contractUrl` + `leadPk`
2. `getApplicationStatus` → confirm `APPROVED`
3. `api.seon.approveVerification(...)` → bypass via API
4. `page.goto(contractUrl)` → UI
5. `contract.dismissSeonOverlay` — the SEON QR code modal may appear even after bypass; the page object must close it
6. Fill CC + bank → submit → T&C → e-sign
7. Origination portal → poll status until `CONTRACT_CREATED+`

Step 5 is the recent bug-fix: the SEON SDK injects an overlay with a QR code even when the backend already considers it APPROVED. Explicit dismiss is required.

#### Response interface (`src/api/responses/seon.response.ts`)

```typescript
interface SeonInfoResponseBody {
 seonIdPk, leadPk, referenceId, fullName, status, success, idVerifySuccess,
 documentType, nameMatchCheckResult, stateCheckResult, postalCodeResult,
 dateOfBirthResult, birthDate, documentExpirationDate, error
}
```

### 3. Kount — Login Attempt Scoring + Token Refresh

#### Where it appears in the project

- Token storage: `uown_kount_token` (`pk`, `access_token`, `expiration_time` — `timestamp WITHOUT time zone`).
- Sweep service: `RefreshKountAccessTokenSweepService` — Quartz job, runs every ~10 min.
- Manual API trigger: `POST /uown/svc/refreshKountAccessTokenSweep` (`ScheduledTaskClient.refreshKountAccessTokenSweep`).
- Login attempts join: `uown_login_attempt` joined with `uown_user` (probe-login-attempt-schema.ts no longer exists, but the table remains).

#### Known patterns

`src/scripts/check-cc-sweep-eligibility.ts` and `.claude/skills/common-operations/SKILL.md:423-449` cover queries.

**Central pitfall** (`.claude/skills/common-operations/SKILL.md:488`):

> `RefreshKountAccessTokenSweepService` and `RefreshGdsAccessTokenSweepService` (commit `213b96b54`) call `loadOrCreateToken.setPk(...)` followed by `repo.save(...)`. Because the entity uses `@GeneratedValue`, the explicit `setPk` is **IGNORED** on INSERT — the DB assigns a new PK. Consequence: **after delete pk=1 + sweep recreate, the new row is NOT at pk=1**. Tests with `WHERE pk = 1` break.

**Fix:**

```typescript
// ❌
const row = await db.getSingleRow<KountTokenRow>(
 'SELECT expiration_time FROM uown_kount_token WHERE pk = 1'
);

// ✅
const row = await db.getSingleRow<KountTokenRow>(
 'SELECT expiration_time FROM uown_kount_token ORDER BY pk DESC LIMIT 1'
);
```

#### Timestamp comparison pitfall

`uown_kount_token.expiration_time` is `timestamp without time zone`. `pg-node` returns a JS `Date` whose value depends on the system locale. Solution: compare PG-side, not JS-side:

```typescript
const result = await db.getSingleRow<{ ok: boolean }>(
 `SELECT (expiration_time > now + interval '30 seconds') AS ok
 FROM uown_kount_token WHERE pk = $1`,
 [pk],
);
```

Details in `.claude/skills/common-operations/SKILL.md § Timestamp Comparisons` and `.claude/skills/helpers-catalog/SKILL.md:42-45`.

#### SSN catalog and fraud bypass

`skill [[ssn-test-modalities]]` documents specific SSNs that go through bypass / cache to avoid dependency on the downstream UW (Sentilink/Lexis/GDS/Kount). Reported pitfall:

> If the cron `getKountAccessTokenSweep`/`getGdsAccessTokenSweep` (Quartz, every ~10min) fails to renew in time, SSNs OUTSIDE the catalog can return a spurious UW_DENIED.

**Workaround:** manual trigger before the suite:

```typescript
await api.scheduledTask.refreshKountAccessTokenSweep;
await api.scheduledTask.refreshGdsAccessTokenSweep;
```

### 4. DV360 / DataView360 — UW Backbone

#### What it is

DV360 (alias DataView360) is the external UW mediator: it orchestrates Sentilink, LexisNexis, GDS, Neustar. UOWN svc calls the UAT environment (`alb.uown.uat.me.dataview360.com`) for all UW decisions in non-prod environments.

#### Where it appears

- `uown_los_outbound_api_log.url LIKE '%dataview360%'` — every svc→DV360 call recorded.
- Query helper: `database.helpers.ts:1115-1139`:

```typescript
async getDv360OutboundLog(leadPk: number) {
 return this.queryOne(
 `SELECT pk, lead_pk, request, url, response, row_created_timestamp
 FROM uown_los_outbound_api_log
 WHERE lead_pk = $1 AND url LIKE '%dataview360%'
 ORDER BY pk DESC LIMIT 1`,
 [leadPk],
);
}
```

#### 2026-05-18 OUTAGE — qa1 UAT (Memory: `project_dv360_uat_qa1_outage_2026_05_18`)

**Symptom:**

`POST /uown/los/sendApplication` in **qa1** returns a 500 from the DV360 UAT Apache **regardless of the merchant** tested.

```
500 Internal Server Error: <html>...Apache/2.4.58 (Ubuntu) Server at alb.uown.uat.me.dataview360.com Port 80
```

Call path:

```
Browser → apply-qa1.uownleasing.com (svc qa1)
 → svc calls DV360 UAT (alb.uown.uat.me.dataview360.com)
 → Apache 500 (generic HTML, not structured JSON)
 → svc wraps it as 500 and returns it
```

**Evidence of healthy svc:** `uown_los_inbound_api_log` shows `canContinueApplication` returning 200 with a full payload. The difference: `canContinueApplication` does NOT call DV360 — it only queries the local lead.

**Workarounds (in order of preference):**

1. **Wait** — external UATs usually come back in minutes to hours.
2. **Switch env to qa2 or stg** — DV360 UAT may be unstable only in qa1 routing, or it may be a separate instance.
3. **Use pre-existing approved leads** when the test is about post-UW state (email template, signing, payment). Requires explicit user authorization for the exception to Rule 10 (Test Data Hierarchy).

**Correct classification:** `[ENV-GAP] DV360 UAT instability`, **NOT** `[CONFIRMADO] bug`. Do not try to "fix" it by changing the sendApplication payload (employer null etc) — the root cause is external.

#### Quick health probe

```typescript
// Run BEFORE qa-flow / E2E pipeline in qa1 that involves sendApplication
const probe = await api.application.sendApplication(merchant, applicant, order);
if (probe.status === 500 && /Apache.*dataview360/i.test(JSON.stringify(probe.body))) {
 test.skip(true, '[ENV-GAP] DV360 UAT instability — qa1 outage detected');
}
```

#### DB tables involved

| Table | Content |
|--------|----------|
| `uown_los_outbound_api_log` | EVERY svc→external call. `url LIKE '%dataview360%'` filters DV360. Has raw `request` and `response`. |
| `uown_los_inbound_api_log` | Calls received by svc (browser → svc, and webhooks). Does not go through DV360. |
| `uown_los_lead_notes` | Lead activity log — includes patterns `[UWService]`, `[Sentilink]`, `[Lexis]`, `[Neustar]`, `[GDS]`. |
| `uown_kount_token` | Kount token, see § Kount above. |
| `uown_gds_token` | GDS token — same sweep pattern. |

### 5. Bypass shortcuts for the SSN catalog

`skill [[ssn-test-modalities]]` — SSNs that avoid dependency on DV360/Kount/GDS:

| SSN ending | UW result | Use |
|------------|--------------|-----|
| `≠ 9` | `UW_APPROVED` | Happy path |
| `= 9` | `UW_DENIED` | Denied test |
| `888880916` | force 16m program | Modality A (catalog §5) |
| `100000053` | Second Look (GDS bypass) | Modality C (TireAgent only) |

Use `generateTestSSN(true)` or the fixed ones above — do NOT invent a random SSN, because it falls into the full UW path (which depends on DV360).

## Known pitfalls

### Pitfall #1 — DV360 UAT outage classified as a bug

**Symptom:** sendApplication 500 with Apache HTML. **Do not confuse it with a UOWN bug.** Check the outbound log:

```sql
SELECT pk, url, response FROM uown_los_outbound_api_log
WHERE lead_pk = $1 AND url LIKE '%dataview360%'
ORDER BY pk DESC LIMIT 1;
```

If the response contains `Apache/2.4.58 (Ubuntu)` or similar → ENV-GAP, not a bug.

### Pitfall #2 — SEON DOB format

`applicant.dob = "01/15/1990"` (MM/DD/YYYY) → SEON needs `"1990-01-15"`. Use `[month, day, year] = applicant.dob.split('/')` and reassemble.

### Pitfall #3 — SEON overlay UI even after bypass

`ContractPage.dismissSeonOverlay` is mandatory in the UI flow even when `idVerifySuccess=true` in the DB. The SEON SDK injects a QR modal regardless of the backend state.

### Pitfall #4 — Kount/GDS sweep pk=1 assumption

`@GeneratedValue` ignores `setPk(1)`. Use `ORDER BY pk DESC LIMIT 1` or `waitForValueChange` pointing to the latest row.

### Pitfall #5 — `uown_kount_token.expiration_time` timezone

`timestamp without time zone` + pg-node `Date` parsing is locale-dependent. Compare PG-side with `(expiration_time > now + interval '30 seconds')`, not JS-side.

### Pitfall #6 — Changing a fraud flag on a merchant breaks preflight

`isSeonIdCheckRequired`, `useLexisNexis`, `useSentilink` etc are in `mustBeFalse` for UOWN base (`merchant-config-contract.ts:51-75`). Setting one manually via the portal → `ensureMerchantReady` on the next test will reset it (auto-heal default). To test with the flag ON: set `AUTO_HEAL_MERCHANT=false` in .env OR use a merchant that already legitimately has the flag ON (e.g. FifthAveFurnitureNY has `isSeonIdCheckRequired=true` by product design).

### Pitfall #11 — SEON cancel UX does not work in sandbox (OBSERVACAO S3/P2)

**Symptom:** `SeonWidgetComponent.closeSeonWidget()` (click on the real X via frameLocator) runs without error, but the widget stays visible. Reproduced 2× (standalone probe + CT-03 of `seon-widget-user-behavior.spec.ts`). No cancel note appears in `uown_los_lead_notes` (possible Rule #13 gap for the SEON cancel event).

**Root cause (hypothesis):** the SEON SDK in sandbox-mode does not implement the close handler, OR the click does not propagate via cross-origin postMessage to the host page. Not a confirmed bug — vendor widget behavior in a cross-origin iframe may be intentional in a sandbox environment.

**Classification:** `[OBSERVACAO]` S3/P2 — confirm with dev/PO before opening a ticket.

**What NOT to do:** do not increase the timeout, do not use `force: true`, do not try `page.evaluate` (blocked cross-origin). The behavior is the SDK's, not the test's.

**Impact on tests:** scenarios CT-03 (Cancel via X) and CT-05 (Restart after cancel) remain `[PENDENTE-MANUAL]` until the expected behavior in sandbox is confirmed. CT-01, CT-02, CT-04, CT-07 (backend gate, consent gate, gate-blocks-form, internal_status) pass normally (7/7 PASS confirmed).

**Detection:** try `seonWidget.closeSeonWidget(); await expect(page.locator(SeonWidgetComponent.OUTER_IFRAME)).not.toBeVisible()` — fails (widget still visible). Confirms the absence of dismiss.

**Reference:** `tests/e2e/origination/seon-widget-user-behavior.spec.ts` CT-03; `docs/knowledge-base/seon-idv-widget-user-behavior.md` SEON-UB-03.

### Pitfall #7 — Confusing SEON status with lead status

The SEON `response.body.status` is `"APPROVED"|"REJECTED"|...` for the identity verification. It is **NOT** the lead's `uwStatus`. Lead status comes from `api.application.getApplicationStatus`.

### Pitfall #8 — Kornerstone merchant requires bankData in sendApplication

Tangential but relevant: KS3015 (FifthAveFurnitureNY) has `isSeonIdCheckRequired=true` AND requires `bankData` in the sendApplication body (`.claude/rules/testing.md § Application Lifecycle`). Forgetting either one means the lead never even reaches the SEON step.

### Pitfall #9 — `useNeuroIdCheck` reset by the merchant preflight (NeuroID false-negative)

`useNeuroIdCheck=true` is in the `mustBeFalse` set of the merchant preflight contract (`merchant-config-contract.ts`). Auto-heal via `createOrUpdateMerchant` **resets the flag to `false`**, silently disabling NeuroID: NeuroID never fires, all `count >= 1` guards fail, and the test reports a **false-negative**. **Fix:** `skipMerchantPreflight: true` on EVERY `createPreQualifiedApplication` call when `useNeuroIdCheck=true` is the flag under test; compensate with an inline read-only pre-assert (`SELECT use_neuro_id_check FROM uown_merchant WHERE ref_merchant_code='OW90337-0001'` + `test.skip` if `false`). Full detail in [[application-lifecycle]] Pitfall #102. Analogous to Pitfall #6 (any fraud flag in `mustBeFalse` is reset by auto-heal).

### Pitfall #10 — `uown_sv_outbound_api_log` with no `lead_pk` correlation for pre-funding leads

The table has rows for NeuroID calls (`url ILIKE '%neuro-id.com%'`) but, for pre-funding leads, `account_pk`/`source_uuid`/`return_uuid` are NULL — no correlation key with `lead_pk`. Using this table for NeuroID count assertions is impossible in this context. **Fix:** use `uown_neuro_id_verification WHERE lead_pk = $1` (`countNeuroIdCalls`) as the source of truth. Confirmed via discovery probe: `src/scripts/probe-neuroid.ts`.

## Project examples

### A. API-only SEON bypass (full lifecycle)

`/home/jose/projects/uown/automation/tests/api/seon-id-verification-bypass.spec.ts`

- Lines 56-62: ctx structure with `leadPk`, `approvedAmount`, `shortCode`, `planId`
- Lines 64-72: `sendApplication` pre-qualification (NO order)
- Lines 74-100: `getApplicationStatus` → confirms APPROVED + extracts leadPk + approvedAmount
- Lines 102-122: `sendInvoice` → extracts `shortCode` + `planId` from redirectUrl
- Lines 124-139: SEON bypass via `api.seon.approveVerification`
- Lines 141-160: DB validation of `uown_seon`
- Lines 162-167: `getMissingFields(shortCode, { planId })` ← required before submit (see payment-flows pitfall #10)
- Lines 170-182: `submitApplication` passes the SEON gate
- Lines 184-203: verify lead status `CONTRACT_CREATED+`

### B. Hybrid E2E (API bypass + UI contract)

`/home/jose/projects/uown/automation/tests/e2e/origination/seon-e2e-flow.spec.ts`

- Lines 35-46: testData (NY + FifthAveFurnitureNY + orderTotal 1500)
- Lines 48-55: merchantConfig with a defensive try/catch (qa2 RBAC issue in `getMerchantsByRefCode`)
- Lines 119-136: SEON bypass via API
- Line 169: `await contract.dismissSeonOverlay` ← mandatory in the UI
- Lines 215-250: lead status poll with the `Get Document Status` button to force a backend sync

### C. SEON client + body builder

- `/home/jose/projects/uown/automation/src/api/clients/seon.client.ts` — two functions: `createOrUpdate(body)` and `approveVerification(options)` (convenience)
- `/home/jose/projects/uown/automation/src/api/bodies/seon.body.ts` — `buildSeonApprovedBody(options)` returns a full body with sensible defaults
- `/home/jose/projects/uown/automation/src/api/responses/seon.response.ts` — `SeonInfoResponseBody` mirror of `com.uownleasing.svc.pojo.SeonInfo`

### D. DV360 outbound log helper

`/home/jose/projects/uown/automation/src/helpers/database.helpers.ts:1115-1139` — `getDv360OutboundLog(leadPk)`. Use in debugging UW failures to inspect the raw request/response sent to DataView360.

### E. Kount token query patterns

`/home/jose/projects/uown/automation/.claude/skills/common-operations/SKILL.md:423-490`

- Query latest token (not pk=1)
- PG-side timestamp comparison
- Manual sweep trigger via `api.scheduledTask.refreshKountAccessTokenSweep`

## Checklist before marking a fraud-vendor test as done

- [ ] Before qa-flow in qa1 with `sendApplication`: ran a DV360 probe — no 500 Apache HTML
- [ ] If the merchant has `isSeonIdCheckRequired=true`: bypass via `api.seon.approveVerification` before `submitApplication`
- [ ] DOB converted to `YYYY-MM-DD` (Java LocalDate)
- [ ] DB validation in `uown_seon` confirms `status='APPROVED', success=true, id_verify_success=true`
- [ ] UI test includes `contract.dismissSeonOverlay` even after bypass
- [ ] Queries on `uown_kount_token` / `uown_gds_token` use `ORDER BY pk DESC LIMIT 1`, not `WHERE pk = 1`
- [ ] `expiration_time` comparisons done PG-side, not JS-side
- [ ] A 500 failure with Apache HTML classified as `[ENV-GAP] DV360 UAT instability`, not `[CONFIRMADO] bug`
- [ ] Chosen SSN respects the catalog (no random one invented, outside the patterns `≠9`/`=9`/`888880916`/`100000053`)
- [ ] Activity log validated in `uown_los_lead_notes` (CLAUDE.md rule 13)
- [ ] `SEON_ID_FAILED` asserted in `internal_status` (NOT `lead_status`) — see Pitfall #11 and the `internal_status` section above
- [ ] Cancel via X (`closeSeonWidget`) in sandbox: current behavior = widget stays visible (Pitfall #11, OBSERVACAO S3/P2 — not a test failure)

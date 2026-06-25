# SSN Test Values - Detailed Catalog

> For the decision table, principles, and guidance on which SSN to use, see [SKILL.md](../SKILL.md).

---

## 1. Programmatic generators

```ts
import { generateTestSSN } from '@config/constants.js';

generateTestSSN(true) // random SSN NOT ending in 9 -> UW_APPROVED
generateTestSSN(false) // random SSN ending in 9 -> UW_DENIED
```

**Sandbox/qa convention:** last digit `9` forces denial in the mocked UW engine. Any other digit goes through the normal flow (approved by default in qa). Production uses real Sentilink/Lexis.

---

## 2. SSN 100000053 - Second Look (13m denied -> 16m preview -> 16m approved)

**Source:** `docs/taskTestingUown/RU03.26.1.50.0_newTireAgentFlowReturn16MonthAndSecondLook_477/`

### Behavior in GDS

| Submission | Bank data? | Result |
|-----------|:----------:|-----------|
| 1st | No | `UW_DENIED` on 13m + `isEligibleForExtraInfo=true` + `paymentDetailsList` populated with 16m preview |
| 2nd (same SSN) | Yes | `UW_APPROVED` on **16m** |

### Preconditions (inviolable)

| Field | Required value |
|-------|-------------------|
| Merchant | `TireAgent` (configured with 16m program) |
| State | `CA` |
| First name | `Brian` |
| Last name | `hayden` |
| DOB | `02241987` |
| Address | `135 Buckeye Blvd` |
| City | `Columbus` |
| ZIP | `92821` (do NOT use `90001` - high-risk, denies without second-look) |
| Employer | `Costco Wholesale` |
| Phone | `7653072625` |
| Environment | `stg` (confirmed); other environments need validation |
| DevOps config | `use.taktile.for.decision=false` + `use.gds.for.decision=true` |

### Override via env var

```bash
TIRE_AGENT_SECOND_LOOK_SSN=100000053 # default; allows swapping without editing code
```

### SSN reuse rules

- Reusing the same SSN with a **different** combination (ZIP/state/address) triggers `DataMismatchStep` with `ADDRESS_MISMATCH`.
- **Mandatory cleanup:** before submitting the first request, expire/cancel any PRIOR leads with this SSN in APPROVED status.

---

## 3. SSN 888880916 - Direct approval in 16 months only (single submission)

**Source:** `docs/taskTestingUown/RU02.26.1.49.2_displayTermMonthsInMerchantSectionCustomersPage_1239.md`

### Actual rule discovered 2026-05-24

Mock BlackBox in qa1 uses the last 3 digits of the SSN: `XXXXXX916` -> EligibleTerms 16 for ANY UOWN merchant. Other suffixes -> 13. Random prefix avoids the profile-lock of the fixed `888880916`. Kornerstone (KS*) always gets 16m via a separate route.

### Behavior in GDS

| Submission | Bank data? | Result |
|-----------|:----------:|-----------|
| 1st (only) | any | `UW_APPROVED` on **16m only** |

### Data stored in DB and API

| Field | Value |
|-------|-------|
| `uown_lead_approval_terms.uw_terms` | `"16"` |
| `uown_lead_approval_terms.merchant_terms` | `"16"` |
| `uown_lead_approval_terms.approved_terms` | `"16"` |
| `getMerchantInfo.approvedTermMonthsDisplay` | `"16 months"` |
| UI (Customer page - Merchant Info) | `"16 months"` |

> Compare with SSN `888888888` from the same family - approves on **both** (`approved_terms="13,16"`). But `888888888` has a NullPointerException bug in `sendApplication` (see section 5).

### Preconditions

| Field | Value |
|-------|-------|
| Merchant | any merchant with an **active 16m program** |
| Profile (name/DOB/address) | **not tied** - unlike `100000053` |
| SSN format | without hyphens: `888880916`, NOT `888-88-0916` |

### Confirmed environments

| Env | Merchant | Status | Reference |
|-----|----------|:------:|------------|
| qa2 | `TerraceFinance` (OL90202-0001) | Confirmed | Scenario B of task 1239 |
| qa2 | `Kornerstone KS1337` | Confirmed | Scenario D |
| stg | `Kornerstone KS1337-001` | Confirmed | Scenario F (leadPk=6558872) |
| qa1 | PayPossible | Confirmed | CT-A5, lead 12016, approval $4,430, planId WK16 |

---

## 4. SSN for "denied on 16m even with bank data" - BLOCKED

Registered as pending: need to request a test SSN from Becky. When Becky provides it, add it here with the complete recipe.

---

## 5. SSN `888888888` - BUGGY (avoid in tests)

Causes `HTTP 500 NullPointerException` in the backend when calling `sendApplication`. Use **only** to validate the specific bug. For any other test use `generateTestSSN(true)`.

---

## 6. qa2 sendApplication returned 500/401 with random SSN (2026-05-06)

**Observed window:** ~5 hours (~13:06-18:30 UTC on 2026-05-06).

**Deterministic reproduction:**
- Random SSN (6/6 tested) -> 500/401
- Specific SSNs `660015551` and `100000053` -> 200 OK

**Hypothetical cause:** auth token from svc to downstream UW service (Sentilink/Lexis/GDS/Kount) expired.

**Correct mitigation (do NOT change test code):**
1. Manual refresh trigger: `POST /uown/svc/refreshKountAccessTokenSweep` + `POST /uown/svc/refreshGdsAccessTokenSweep`
2. Ops triage: investigate why the Quartz cron is not preventing expiration

**Never change `applicant.ssn` to a fixed value** - violates the fresh data principle.

---

## 7. 16m eligibility - runtime confirmation query

```sql
SELECT
 mp.pk,
 mp.term_in_months,
 mp.is_active,
 mp.activation_date,
 mp.deactivation_date
FROM uown_merchant m
JOIN uown_merchant_program mp ON mp.merchant_pk = m.pk
WHERE m.merchant_number = $1 -- e.g. 'OL90205-0079'
 AND mp.term_in_months = 16
 AND mp.is_active = true
 AND (mp.activation_date IS NULL OR mp.activation_date <= NOW)
 AND (mp.deactivation_date IS NULL OR mp.deactivation_date >= NOW);
```

Result >= 1: supports 16m. Result 0: does not support right now (fixable via Origination admin - Programs).

---

## 8. Brand coverage - mandatory validation per brand

### `uown_sv_account.company` validation (DB cross-check)

Precondition for every account creation via a Kornerstone merchant:

```sql
SELECT company FROM uown_sv_account WHERE pk = $accountPk;
-- expected: 'KORNERSTONE' when merchant.ref_merchant_code starts with 'KS'
-- expected: 'UOWN' otherwise
```

**Divergence protocol:**
1. If `company` does NOT match: STOP the test
2. Log: `[CT-XX] BRAND_MISMATCH expected=KORNERSTONE actual=UOWN merchantCode=KS3015`
3. Ask the user for authorization to UPDATE
4. Only proceed after authorization + UPDATE executed
5. Record as **ENV-GAP**

### Per-brand style validation (UI + email)

**Email (Gmail IMAP / HTML body):**

| Axis | UOWN | Kornerstone |
|------|------|-------------|
| `From:` header | `CustomerService@uownleasing.com` | `CS@kornerstoneliving.com` |
| Sender name | `UOWN Leasing` | `Kornerstone Living` |
| Template name (DB) | `<TemplateName>` without prefix | `KORNERSTONE_<TemplateName>` |
| Logo (alt text / src) | contains `uown` | contains `kornerstone` |
| Legal footer | mentions "UOWN Leasing" | mentions "Kornerstone" |
| Images | `storage.googleapis.com/...uown...` | `storage.googleapis.com/...kornerstone...` |
| **Cross-contamination** | body does NOT contain Kornerstone | body does NOT contain UOWN |

**Portal (Origination / Servicing / Website):**

| Axis | UOWN | Kornerstone |
|------|------|-------------|
| Header logo | UOWN logo | Kornerstone logo |
| Primary color (CSS) | see visual spec | see visual spec |
| Favicon | UOWN | Kornerstone |
| Tab title | contains `UOWN` | contains `Kornerstone` |

---

## 9. Environment observations by SSN/merchant

| Date | Environment | Merchant | SSN | Observation |
|------|----------|----------|-----|------------|
| 2026-04-22 | qa2 | TireAgent (OW90218-0001) | 100000053 | Second Look appears to short-circuit in qa2. Validated only in `stg`. |

---

## 10. Cross-references

- Full business rule: `docs/business-rules/02-originacao-pipeline.md`
- Brand/company enum: `Company.java` (`UOWN`, `KORNERSTONE`)
- Merchant data: `src/data/merchants.ts`
- Kornerstone email templates: `docs/business-rules/10-portal-comunicacoes.md`
- Test cards (BINs): `src/data/test-cards.ts`
- Test bank: `src/config/constants.ts` - `TEST_BANK.DEFAULT_ROUTING` / `DEFAULT_ACCOUNT`
- SSN generator: `src/config/constants.ts` - `generateTestSSN(approved: boolean)`
- Risk tiers: `docs/business-rules/appendix-g-cenarios-risco.md`

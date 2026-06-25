# Filled-in example - task-evidence-report

> Base: real task #1293 (`redirectInvalidOrInactiveApplicationLinks`), rewritten following the `task-evidence-report` template with the 4 presentation techniques combined (TL;DR, TOC, collapsibles, grouping by status, badges in quote block).
> Real path where this content would be saved:
> `docs/taskTestingUown/RU05.26.1.52.0_redirectInvalidOrInactiveApplicationLinks_1293/RU05.26.1.52.0_redirectInvalidOrInactiveApplicationLinks_1293-evidence.md`

---

# QA Validation - #1293 Redirect Invalid or Inactive Application Links

**Environment:** qa1 (build 2026-05-19)
**Result:** ✅ **Approved - feature working as expected across both brands (UOWN and Kornerstone)**

---

> ### TL;DR
> 6 requirements confirmed across UOWN + Kornerstone, plus 5 additional scenarios covering security, regression, and mobile.
> 2 out-of-scope improvements identified (OBS-1: case-sensitive lookup; OBS-2: 500 vs 404). No blockers.
> **Action:** approve QA deploy to Staging. Open 2 child tasks for the observations.

---

## Navigation

- [Summary](#summary)
- [Findings Index](#findings-index)
- [Task requirements](#task-requirements)
- [Additional scenarios explored](#additional-scenarios-explored)
- [Observations (do not block release)](#observations-do-not-block-release)
- [Blockers](#blockers)
- [Recommendation](#recommendation)

---

## Summary

The MR that adds automatic redirect to `find-a-merchant` for invalid or inactive application links is deployed on qa1 and covers all scenarios from the issue: an active merchant opens the form normally; an inactive, terminated, invalid code, or generic `/getApplication` route redirects the customer to the search screen.

Validation ran empirically on UOWN and Kornerstone, including active-customer regression, HTTPS fallback, and security against phishing via querystring.

---

## Findings Index

| ID | Type |
| ---------- | ----------------------------------------------------------------------------------- |
| **AC-01** | Active merchant opens the form. CONFIRMED |
| **AC-02** | Inactive / terminated merchant redirects. CONFIRMED |
| **AC-03** | Invalid code / generic route redirects. CONFIRMED |
| **OBS-1** | Case-sensitive lookup (`ks3015` vs `KS3015`). UX Improvement |
| **OBS-2** | Backend returns 500 instead of 404 for non-existent code. Observability |

---

## Validated scenarios

### Task requirements

#### 1. Active merchant opens the form normally

> ✅ **PASSED** · UOWN `OW90218-0001` (TireAgent) + Kornerstone `KS5936` (Griffins Furniture)

On both portals the application form rendered normally, with the merchant code pre-filled, without visual or behavioral regression.

**Evidence:** merchantCodes `OW90218-0001` and `KS5936` on qa1; URLs `/getApplication/OW90218-0001` and `/getApplication/KS5936`.

#### 2. Inactive merchant redirects to Find a Merchant

> ✅ **PASSED** · UOWN `0000-001_clone` + Kornerstone `KS5936` (temporarily disabled)

In both cases the customer was redirected to `/customer/find-a-merchant/` instead of seeing a technical error or a broken form. Kornerstone `KS5936` was temporarily disabled on qa1 (authorized by Yuri) and re-enabled afterwards.

**Evidence:** merchantCodes `0000-001_clone` (UOWN) and `KS5936` (KS); final URL after redirect: `https://uownleasing.com/customer/find-a-merchant/`.

#### 3. Terminated merchant redirects to Find a Merchant

> ✅ **PASSED** · behavior confirmed by dev in MR review

The same logic as inactive applies to merchants with status `TERMINATED`. No specific test data was needed because the backend handles both statuses (`INACTIVE` and `TERMINATED`) with the same eligibility predicate.

**Evidence:** confirmed by dev; tested indirectly via scenario 2.

#### 4. Invalid or non-existent merchant code redirects

> ✅ **PASSED** · 5 synthetic codes tested on qa1

Tested on UOWN with 3 codes (`ks1111`, `ZZZZZ0000-9999`, `XYZ123`) and on Kornerstone with 2 (`KS9999`, `KSZZZ99`). In all 5 cases the customer was redirected to Find a Merchant without seeing a technical error message.

**Evidence:** 5 non-existent codes on qa1, all returned redirect to `/customer/find-a-merchant/`.

#### 5. Generic route `/getApplication` (without code) redirects

> ✅ **PASSED** · UOWN + Kornerstone

Direct access to `/getApplication` without a path param takes the customer to Find a Merchant. Identical behavior across both brands.

**Evidence:** URLs `uownleasing.com/getApplication` and `kornerstoneleasing.com/getApplication` on qa1.

#### 6. URL with trailing slash `/getApplication/` redirects

> ✅ **PASSED** · UOWN + Kornerstone

Variant of scenario 5 with trailing slash. Same behavior, without 404 or route matching error in the Next.js router.

**Evidence:** URLs `/getApplication/` tested across both brands.

### Additional scenarios explored

#### 7. Code with lowercase letters (`ks3015` instead of `KS3015`)

> ⚠️ **Improvement identified** · see [OBS-1](#obs-1-merchant-lookup-is-case-sensitive)

A customer who types or pastes the merchant code in the wrong case lands on Find a Merchant instead of the pre-filled form. The merchant exists on qa1 as `KS3015` but the backend lookup is case-sensitive. Not a regression from the MR (pre-existing behavior), but worth improving.

#### 8. Attempt to redirect to external site (`?redirect=evil.com`)

> ✅ **PASSED** · security OK

The `redirect` parameter is ignored by the frontend; the customer lands on the default Find a Merchant and does not go to the external domain. It is not possible to use the public URL as a phishing vector.

#### 9. Kornerstone customer with invalid link lands on `uownleasing.com`

> ✅ **PASSED** · expected behavior by design

Aligned with the brand rule (Kornerstone is a UOWN brand). The customer ends up on `uownleasing.com/customer/find-a-merchant/` and the search accepts `KS*` codes normally.

#### 10. Access via `http://` (without HTTPS)

> ✅ **PASSED** · automatic upgrade

Automatic upgrade to HTTPS before the redirect. No mixed-content warning and no loss of the original path.

#### 11. Active merchant continues working (regression)

> ✅ **PASSED** · no regression

Smoke after the MR to ensure the new redirect did not accidentally catch a valid merchant path. Form rendered normally on UOWN and Kornerstone.

---

## Observations (do not block release)

### OBS-1: Merchant lookup is case-sensitive

> The backend compares the code exactly as received in the URL, without normalization. A customer who types the code in lowercase lands on Find a Merchant instead of the pre-filled form. Not a regression from the MR.

<details>
<summary><b>Root cause, reproduction, and proposed fix</b></summary>

**Root cause:** the backend compares `ref_merchant_code = :input` without normalization. A customer who types or pastes the code in a different case than what is registered will not match any record.

**When it triggers:** any URL with a merchant code in a different case than registered (registration is always UPPER). Reproduced with `ks3015`, `ow90218-0001`, `ks5936`.

**Impact:** a customer who receives a campaign link or copies the code in the wrong case has a "broken link" experience. They go to Find a Merchant instead of the pre-filled form. Adds friction to the application funnel.

**Evidence:** confirmed with dev in MR review; tested manually on qa1 with `ks3015` (exists as `KS3015`).

**Proposed fix:**
```sql
-- Current:
WHERE ref_merchant_code = :input
-- Suggested:
WHERE LOWER(ref_merchant_code) = LOWER(:input)
```

</details>

**Classification:** [OBSERVATION]. UX Improvement. Open a separate task.

---

### OBS-2: Backend returns HTTP 500 for invalid code

> `POST /uown/sendApplicationToCustomer` returns 500 instead of 404 when it receives a non-existent code. The frontend handles it and redirects correctly, but the backend pollutes monitoring with false positives.

<details>
<summary><b>Root cause, reproduction, and proposed fix</b></summary>

**Root cause:** the call `POST /uown/sendApplicationToCustomer` returns **HTTP 500** when it receives a non-existent merchant code. The correct status would be **HTTP 404** (resource not found).

**When it triggers:** any request with a `merchantCode` that does not exist in the `uown_merchant` table. Reproduced with `KS9999`, `XYZ123`.

**Impact:** the redirect works normally from the customer's perspective (frontend handles 500 and redirects). However, the backend logs it as a server error and pollutes monitoring / Sentry with false positives.

**Evidence:** verified on qa1 with Postman and reading `uown_los_inbound_api_log` (entries with `status_code=500` for non-existent codes).

**Proposed fix:** modify the `MerchantNotFoundException` handler to return `ResponseEntity.notFound` instead of propagating as 500. Backend job, does not block the visual feature.

</details>

**Classification:** [OBSERVATION]. Observability. Open a separate backend task.

---

## Blockers

_None in this validation._

---

## Recommendation

> ✅ **Approve QA deploy to Staging.**

- All 6 task requirements (Scenarios 1 to 6 from the issue) validated on qa1
- Both brands (UOWN and Kornerstone) covered empirically
- Active customer regression passed (Scenario 11)
- Security scenario (`?redirect=evil.com`) correctly ignored (Scenario 8)
- No functional failure in the feature

**Non-blocking pending items** (can be resolved in parallel or in the next iteration):

- Separate task to make merchant code lookup case-insensitive (OBS-1, confirmed with dev)
- Separate issue for backend to adjust 500 to 404 on `sendApplicationToCustomer` (OBS-2)

---

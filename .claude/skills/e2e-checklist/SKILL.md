---
name: e2e-checklist
description: Carregue antes de declarar teste E2E pronto. Checklist: golden path + edge cases, activity log assertion, merchant preflight, UI-first respeitado, DB validation, cleanup, tags corretos.
disable-model-invocation: true
---

# E2E Test Checklist — UOWN Leasing

> Checklist per feature type. Consult before implementing tests to ensure coverage.

## 0. Interaction Strategy & Evidence (ALL tests)

- [ ] **UI first**: all user actions performed via browser (page objects, clicks, form fills)
- [ ] API used only for: precondition setup OR features with no UI interface
- [ ] **Triple validation per CT**: payload/response asserted + DB persistence confirmed + UI rendering verified
- [ ] **Video**: `VIDEO=on` (default) — never override to `off` in test configuration
- [ ] **Screenshots**: at least 1 per CT, taken after the key assertion (proves acceptance criterion)
  - Saved to `tests/{folder}/screenshots/{testName}-{NN}-{desc}.png`
  - Attached to report via `test.info().attach()`
  - Focused on the state that proves the criterion (not generic page captures)

## 1. Application Flow (Origination)

- [ ] Submit application via API (`sendApplication`)
- [ ] Verify `UW_APPROVED` status in DB (SSN not ending in 9)
- [ ] Verify `UW_DENIED` status in DB (SSN ending in 9)
- [ ] Complete credit card authorization (CC_AUTH_PASSED)
- [ ] Complete bank account form
- [ ] Complete e-sign (auto-detect PandaDocs vs Signwell)
- [ ] Verify contract status transitions: `CONTRACT_CREATED → SIGNED → SETTLED`
- [ ] Verify contract URL from `paymentDetailsList[idx].redirectUrl`
- [ ] Handle multiple payment options (indexes 0, 1, ...)

## 2. Cross-Domain / Side Effects

- [ ] **3-phase pattern**: before → action → verify effect
- [ ] Use `test.describe.configure({ mode: 'serial' })` when order matters
- [ ] Suffix file: `.side-effects.spec.ts`
- [ ] Verify effects across portals (e.g., origination action → servicing visible)

## 3. Listings / Tables / Search

- [ ] Initial render with data
- [ ] Empty state when no results
- [ ] Pagination (next/previous, disabled buttons at boundaries)
- [ ] Search/filter functionality
- [ ] Inline actions (edit, view, cancel)
- [ ] Sort by columns (if applicable)

## 4. Forms / Input Validation

- [ ] Required fields — submit empty → error messages
- [ ] Invalid format — wrong data type → validation error
- [ ] Valid submission — correct data → success feedback
- [ ] Field masks (phone, SSN, zip, currency)
- [ ] Maximum length constraints
- [ ] Form persistence (navigate away and back)

## 5. File Upload

- [ ] Correct file type accepted
- [ ] Wrong file type rejected with error
- [ ] Maximum file size enforced
- [ ] Preview displayed after upload
- [ ] Remove/replace uploaded file

## 6. Toasts / Feedback

- [ ] Success toast appears after successful action
- [ ] Error toast appears after failed action
- [ ] Toast auto-dismisses or can be manually dismissed
- [ ] Toast content matches the action performed

## 7. Permissions / Roles

- [ ] Admin can perform action
- [ ] Unauthorized role gets 403 (API) or hidden UI element
- [ ] Use `storageState` per role for auth
- [ ] Fill routes x roles matrix:

| Route/Action | Admin | Manager | Readonly | Merchant |
|-------------|:-----:|:-------:|:--------:|:--------:|
| View list   |  Y    |   Y     |    Y     |    N     |
| Create      |  Y    |   Y     |    N     |    N     |
| Edit        |  Y    |   N     |    N     |    N     |
| Delete      |  Y    |   N     |    N     |    N     |

## 8. Database Validations

- [ ] Index exists on expected table (`indexExistsOnTable`)
- [ ] Flyway migration applied (`flywayMigrationApplied`)
- [ ] Record created/updated with expected values (`waitForRecord`)
- [ ] Expression indexes verified via `pg_indexes.indexdef`
- [ ] Use `::bigint` cast for nullable CTE parameters

## 9. API Validations

- [ ] Success response (200/201) with expected body structure
- [ ] Error response (400/422) with meaningful error message
- [ ] Authentication required (401 without token)
- [ ] Authorization required (403 for wrong role)
- [ ] Idempotency (duplicate request handling)

## 10. Partner Portals

- [ ] PayTomorrow: iframe-based flow, refund via portal UI
- [ ] PayPair/TireAgent: widget iframe (`#llapp-iframe`) → nested `#pt-iframe`
- [ ] OTP via network intercept (`/api/v1/users/send_code`)

# API Client Coverage Report
**Date:** 2026-04-13
**Scope:** All 18 API clients vs test coverage (API tests, E2E tests, task tests)

---

## Summary

- **Total API Clients**: 18 (excluding BaseClient)
- **With API-level test coverage**: 7 (39%)
- **With ZERO API-level tests**: 11 (61%)
- **Most-used in task tests**: Application (81), Payment Arrangement (60), Account (27)

---

## Coverage Matrix

| Client | Methods | API Tests | E2E Tests | Task Tests | Priority |
|--------|---------|-----------|-----------|------------|----------|
| **Application** | 13 | ✅ Full | ✅ Heavy | ✅ 81 | MAINTAIN |
| **Payment Arrangement** | 7 | ❌ | ❌ | ✅ 60 | **CRITICAL** |
| **Account** | 10 | ⚠️ Skipped | ✅ | ✅ 27 | HIGH |
| **Merchant** | 6 | ❌ | ✅ Light | ✅ 26 | HIGH |
| **SVC Payoff** | 3 | ❌ | ❌ | ✅ 24 | HIGH |
| **Scheduled Task** | 4 | ⚠️ Skipped | ✅ Light | ✅ 22 | HIGH |
| **AMS** | 4 | ❌ | ❌ | ✅ 17 | HIGH |
| **LOS Partner Application** | 5 | ❌ | ❌ | ✅ 16 | MEDIUM |
| **SVC Contact** | 3 | ❌ | ❌ | ✅ 11 | MEDIUM |
| **Lead** | 4 | ✅ 2/4 | ✅ | ✅ 9 | MEDIUM |
| **SVC Email** | 2 | ❌ | ❌ | ✅ 9 | MEDIUM |
| **SVC Phone** | 3 | ❌ | ❌ | ✅ 7 | LOW |
| **Invoice** | 3 | ✅ 1/3 | ✅ | ✅ 4 | LOW |
| **Credit Card** | 5 | ❌ | ❌ | ✅ 2 | LOW |
| **Settlement** | 3 | ✅ 1/3 | ✅ | ✅ 1 | LOW |
| **SEON** | 2 | ✅ 1/2 | ❌ | ❌ | LOW |
| **LOS Partner Auth** | 2 | ❌ | ❌ | ✅ 2 | LOW |

---

## Critical Gaps

### 1. Payment Arrangement (CRITICAL)
- **7 methods**, 60 task test usages, ZERO API-level tests
- Core business logic: CC/ACH arrangements, state machine transitions
- **Recommendation**: Create `tests/api/payment-arrangement-api.spec.ts` covering:
  - Create CC/ACH arrangement
  - Get arrangement status
  - Cancel arrangement
  - State transitions (pending → active → completed)

### 2. Account (HIGH)
- **10 methods**, 27 task test usages, API test exists but is SKIPPED
- **Recommendation**: Un-skip `lease-cancellation-api.spec.ts` or create dedicated test

### 3. Merchant (HIGH)
- **6 methods**, 26 task test usages, no API tests
- Complex queries: search by criteria, ref code, error logs
- **Recommendation**: Create `tests/api/merchant-api.spec.ts`

### 4. SVC Payoff (HIGH)
- **3 methods**, 24 task test usages, no API tests
- Critical for EPO/payoff calculations
- **Recommendation**: Create `tests/api/svc-payoff-api.spec.ts`

### 5. AMS (HIGH)
- **4 methods**, 17 task test usages, no API tests
- User/merchant management
- **Recommendation**: Create `tests/api/ams-api.spec.ts`

---

## Recommended Implementation Order

1. `payment-arrangement-api.spec.ts` — highest business risk
2. `merchant-api.spec.ts` — complex query logic
3. `svc-payoff-api.spec.ts` — financial calculations
4. `ams-api.spec.ts` — access control
5. Un-skip `lease-cancellation-api.spec.ts` — already written

---

## Quick Wins

- **Lead**: add tests for 2 untested methods (changeLeadStatus already tested)
- **Invoice**: add tests for 2 untested methods (sendInvoice already tested)
- **Settlement**: add tests for 2 untested methods

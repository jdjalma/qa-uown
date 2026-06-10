---
name: helpers-catalog
description: Carregue ao precisar de helper (auth, navigation, OTP, IMAP, DB query, network intercept). Catálogo do que já existe em src/helpers/ — não duplicar. Antes de criar helper novo, conferir se equivalente existe.
disable-model-invocation: true
---

# Helpers Catalog

> Catalogo de helpers em `src/helpers/` com localizacao, proposito e signatures-chave.
> Detailed method signatures, parameters, return types: [references/methods.md](references/methods.md)

## Principles

1. **Never duplicate** -- always check this catalog before creating a new helper
2. **Import via barrel** -- `import { helperFn } from '@helpers/index.js';`
3. **DB helpers are SELECT-only** unless explicitly authorized (CLAUDE.md Exception 3)
4. **Re-export** -- new helpers must be re-exported via the barrel in `src/helpers/index.ts`

## Helper Index

| Helper | Location | Purpose |
|--------|----------|---------|
| `api-setup.helpers.ts` | `src/helpers/` | API client setup for tests |
| `auth.helpers.ts` | `src/helpers/` | Authentication helpers |
| `common.helpers.ts` | `src/helpers/` | Shared utilities (sleep, retry, etc.) |
| `database.helpers.ts` | `src/helpers/` | DB queries, polling, waitForRecord |
| `date.helpers.ts` | `src/helpers/` | Date formatting/parsing |
| `downloads.helpers.ts` | `src/helpers/` | File download verification |
| `email.helpers.ts` | `src/helpers/` | IMAP email reading (Gmail) — OTP/link extraction with UID-watermark freshness filter (`snapshotInboxUid` + `getVerificationCode(..., { sinceUid })`) |
| `navigation.helpers.ts` | `src/helpers/` | Page navigation patterns |
| `signwell.helpers.ts` | `src/helpers/` | Signwell e-sign helpers |
| `table.helpers.ts` | `src/helpers/` | Table interaction patterns |
| `template-engine.ts` | `src/helpers/` | JSON template interpolation |
| `test-artifact.helpers.ts` | `src/helpers/` | Test artifact management |
| `test-data.helpers.ts` | `src/helpers/` | `buildTestData()` -- unified data builder |
| `worker-id.helper.ts` | `src/helpers/` | Worker-scoped unique IDs (PID + worker index) |
| `network-intercept.helper.ts` | `src/helpers/` | HTTP traffic capture (NeuroID, endpoint call counter) |
| `program-test-data.helper.ts` | `src/helpers/` | Test data lifecycle for merchant programs |
| `correspondence.helpers.ts` | `src/helpers/` | DB queries for approval email template routing (Task #489) |
| `gowsign-template-db.helpers.ts` | `src/helpers/` | DB queries for GowSign template routing (Task #505) |
| `redirect.helpers.ts` | `src/helpers/` | URL-redirect assertions for `/getApplication/{code}` (Task #1293) |
| `settled-in-full.helpers.ts` | `src/helpers/` | DB queries for Settled In Full email sweep (Task #491) |
| `settlement.helpers.ts` | `src/helpers/` | Settlement Amount calculation oracle (svc#512) |
| `account-aging.helpers.ts` | `src/helpers/` | Artificial delinquency aging for boundary-value CTs (svc#512) |
| `recording.helpers.ts` | `src/helpers/` | DB + browser assertions for Sentry Session Replay (Task #1291) |
| `servicing-dialogs.helpers.ts` | `src/helpers/` | Dismissal helpers for Servicing portal auto-rendering dialogs |
| `sticky.helpers.ts` | `src/helpers/` | DB poll + introspection for StickyRecoverSweep (svc#485) |
| `datetime.helpers.ts` | `src/helpers/` | TZ-tolerant assertion for Java LocalDateTime vs DB timestamptz |
| `search-sql-explain.helpers.ts` | `src/helpers/` | EXPLAIN ANALYZE runner for SQLs in `uown_sv_sql_config` (svc#454) |

## Key database.helpers.ts Functions (quick reference)

| Function | Purpose |
|----------|---------|
| `recalculateArrangementStatus(arrangementPk)` | CC arrangement status from payments |
| `recalculateAchArrangementStatus(arrangementPk)` | ACH arrangement status (MR !1368) |
| `simulateCcSweepForArrangement(arrangementPk)` | Approve PENDING CC tx with `posting_date <= today` (date-gated sweep stand-in) |
| `approveAllPendingCcSalesForArrangement(arrangementPk)` | Approve ALL PENDING CC SALEs (no date gate) — multi-installment stand-in for env w/o processor (Exception 3) |
| `getNeuroIdVerification(leadPk)` | Latest NeuroID verification row |
| `waitForNeuroIdRecord(leadPk, timeout?)` | Poll for NeuroID row |
| `getMerchantByRefCode(refCode)` | Merchant by ref_merchant_code |
| `countMerchantByRefCode(refCode)` | Count for absence assertions |
| `getAccountAutoPayTypes(accountPk)` | Auto-pay type records |
| `get/waitFor BankAccount*(...)` | Bank account CRUD queries |
| `getMerchantPrograms(merchantPk)` | All programs via junction table |
| `updateMerchantProgramDates(pk, dates, authorizedBy)` | Authorized date mutation |
| `waitForProgramActiveState(pk, expected, timeout?)` | Poll is_active flag |
| `waitForValueChange(sql, params, oldValue, timeout?)` | Poll until value changes |

> Full signatures and detailed usage: [references/methods.md](references/methods.md)

## Token Row Types (Task #502)

| Type | Table | Pitfall |
|------|-------|---------|
| `KountTokenRow` | `uown_kount_token` | `timestamp WITHOUT time zone` -- pg-node TZ-dependent |
| `GdsTokenRow` | `uown_gds_token` | `timestamp WITH time zone` -- safe for JS comparison |

## Test Data Sources

| Source | Location |
|--------|----------|
| Merchants | `src/data/merchants.ts` |
| Test programs | `src/data/test-programs.ts` |
| Test cards | `src/data/test-cards.ts` |
| Addresses | `src/data/addresses.ts` |
| Constants | `src/config/constants.ts` |

## When to Create a New Helper

1. Check this catalog -- does an equivalent already exist?
2. Check `src/helpers/index.ts` barrel for unlisted exports
3. If truly new: create in `src/helpers/`, re-export via barrel, update this catalog
4. DB helpers: SELECT-only by default; mutations require `authorizedBy` parameter

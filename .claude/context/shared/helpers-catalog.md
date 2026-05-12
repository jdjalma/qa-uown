<!-- PT-BR: Catálogo de helpers disponíveis em src/helpers/ + funções-chave do database.helpers. Consolidado de e2e-agent-responsibilities.md §4. -->

# Helpers Catalog

> Catálogo de helpers em `src/helpers/` com localização, propósito e signatures-chave.

## Available Helpers

| Helper | Location | Purpose |
|--------|----------|---------|
| `api-setup.helpers.ts` | `src/helpers/` | API client setup for tests |
| `auth.helpers.ts` | `src/helpers/` | Authentication helpers |
| `common.helpers.ts` | `src/helpers/` | Shared utilities (sleep, retry, etc.) |
| `database.helpers.ts` | `src/helpers/` | DB queries, polling, waitForRecord |
| `date.helpers.ts` | `src/helpers/` | Date formatting/parsing |
| `downloads.helpers.ts` | `src/helpers/` | File download verification |
| `email.helpers.ts` | `src/helpers/` | IMAP email reading (Gmail) |
| `navigation.helpers.ts` | `src/helpers/` | Page navigation patterns |
| `signwell.helpers.ts` | `src/helpers/` | Signwell e-sign helpers |
| `table.helpers.ts` | `src/helpers/` | Table interaction patterns |
| `template-engine.ts` | `src/helpers/` | JSON template interpolation |
| `test-artifact.helpers.ts` | `src/helpers/` | Test artifact management |
| `test-data.helpers.ts` | `src/helpers/` | `buildTestData()` — unified data builder |
| `worker-id.helper.ts` | `src/helpers/` | Worker-scoped unique IDs (PID + worker index) |
| `network-intercept.helper.ts` | `src/helpers/` | Captures third-party SDK HTTP traffic (frontend + backend) on a Playwright `page`. Exports: `attachNeuroIdListeners(page)`, `dumpCaptured(capture)`, `classifyNeuroIdOutcome(capture)`. Scrubs PII fields (ssn, dob, cardNumber, cvc, accountNumber, routingNumber, password) and truncates bodies at 50KB. Re-exported via barrel. Reusable for any feature that requires SDK network inspection, not just NeuroID. (Task #496) |
| `program-test-data.helper.ts` | `src/helpers/` | Test data lifecycle for merchant programs: `createTestProgram(api, merchantPk, overrides?)`, `cleanupTestProgram(db, programPk)` (soft-delete via deactivation date in past), `withProgramSnapshot(db, pk, fn)` — snapshot/restore wrapper. (Task scheduleProgramActivationDeactivationDates) |
| `correspondence.helpers.ts` | `src/helpers/` | DB query helpers for approval email template routing (Task #489). Exports: `getEmailTemplateName(db, leadPk): Promise<string \| null>` — polls `uown_email_queue` 15s for rows where `template_name LIKE '%ApprovalEmail%'`, returns most recent or null on timeout/DB error; `getCorrespondenceLogs(db, leadPk): Promise<CorrespondenceAuditLogRow[]>` — queries `uown_los_activity_log` (column `notes`, `row_created_timestamp`) where `log_type = 'CORRESPONDENCE'`; `getMerchantChargeProcessingFee(db, refMerchantCode): Promise<boolean>` — reads `uown_merchant.charge_processing_fee_before_esign` via `ref_merchant_code`, throws if merchant not found. All DB calls should be wrapped in try/catch — emit `[ENV-GAP]` annotation if DB unreachable (Cloud SQL proxy required). Re-exported via barrel. |
| `gowsign-template-db.helpers.ts` | `src/helpers/` | DB query helpers for GowSign template routing validation (Task #505 / hotfix R1.51.1). Exports: `getGowSignTemplate(db, templateId)` — returns template row from DB; `getGowSignTemplatesForState(db, state)` — all templates for a given state; `templateClientTypeContains(template, expected): boolean` — checks comma-separated `client_type` field; `assertTemplateClientTypeContains(template, expected)` — throws if not present; `getEsignDocumentByLeadAndClient(db, leadPk, client)` — returns latest esign document request row for lead; `extractTemplateIdFromEsignDocumentRequest(request): string` — parses `request.document.templateId` (JSON path verified: `CreateRequestBuilder.java:90-92` + `DocumentDispatchService.java:67-77`); `assertSelectedTemplateForLead(db, leadPk, expectedTemplateId)` — polls + asserts the templateId used for the lead's esign document. Re-exported via barrel. |
| `settled-in-full.helpers.ts` | `src/helpers/` | DB query helpers for the Settled In Full email sweep (Task #491). Exported types: `EligibleAccount`, `EmailQueueRow`, `CorrespondenceLogRow`. Exported functions: `findEligibleSettledInFullAccount(db, company, opts?)`, `findIneligibleSettledInFullAccount(db, rating)`, `getEmailQueueRecord(db, toEmail, accountPk, templateHint?)`, `waitForEmailQueueRecord(db, toEmail, accountPk, templateHint, timeoutMs)`, `waitForEmailQueueDispatched(db, queuePk, timeoutMs)` — polls `sent_time IS NOT NULL`, `countEmailQueueRows(db, accountPk, sinceTimestamp?)`, `getCorrespondenceLog(db, accountPk, templateName?)`, `waitForCorrespondenceLog(db, accountPk, templateName, timeoutMs)`, `countCorrespondenceLogs(db, accountPk, templatePattern?, sinceTimestamp?)`. SELECT-only (read-only). Canonical eligibility SQL matches production `settledInFullAccountEmailSweep.sql_to_pick_accounts` exactly (DOW-based exact-date predicate). Re-exported via barrel. |

## database.helpers.ts — Token Row Types (Task #502)

| Type | Fields | Table |
|------|--------|-------|
| `TokenRow` | base type | — |
| `KountTokenRow` | `pk`, `access_token`, `expiration_time` (`timestamp without time zone`) | `uown_kount_token` |
| `GdsTokenRow` | `pk`, `access_token`, `expiration_time` (`timestamp with time zone`) | `uown_gds_token` |

> **Pitfall:** `uown_kount_token.expiration_time` is `timestamp without time zone`. pg-node returns a JS `Date` whose value depends on system locale — see common-operations.md § Timestamp Comparisons.

## database.helpers.ts — Key Functions

| Function | Signature | Description |
|----------|-----------|-------------|
| `recalculateArrangementStatus` | `recalculateArrangementStatus(arrangementPk: string): Promise<string>` | Mirrors Java `PaymentArrangementCCListener` logic — recalculates CC arrangement status from its payments (PENDING/SUCCESS EnumSets). Returns resolved status string. |
| `recalculateAchArrangementStatus` | `recalculateAchArrangementStatus(arrangementPk: string): Promise<string>` | Mirrors Java `PaymentArrangementACHListener` MR !1368 logic — recalculates ACH arrangement status. Returns resolved status string. (Task #494) |
| `getNeuroIdVerification` | `db.getNeuroIdVerification(leadPk)` | Returns the most recent row from `uown_neuro_id_verification` for the given lead PK, or null if not found. (Task #496) |
| `waitForNeuroIdRecord` | `db.waitForNeuroIdRecord(leadPk, timeoutMs?)` | Polls until a `uown_neuro_id_verification` row appears for the lead. Exported interface: `NeuroIdVerificationRow`. (Task #496) |
| `getMerchantByRefCode` | `db.getMerchantByRefCode(refMerchantCode)` | Returns key fields for a merchant by `ref_merchant_code`. Note: timestamp columns are `row_created_timestamp`/`row_updated_timestamp` (NOT `created_at`/`updated_at`); acting user is `agent`. (Task #1262) |
| `countMerchantByRefCode` | `db.countMerchantByRefCode(refMerchantCode)` | Returns count of merchants — use for absence assertions (count=0 on blocked-save CTs). (Task #1262) |
| `getAccountAutoPayTypes` | `db.getAccountAutoPayTypes(accountPk)` | Returns auto-pay type records for the account. (Task #497) |
| `getBankAccountsByAccountPk` | `db.getBankAccountsByAccountPk(accountPk)` | Returns all bank account records for an account. (Task #497) |
| `getActiveBankAccountsByAccountPk` | `db.getActiveBankAccountsByAccountPk(accountPk)` | Returns only active (non-deleted) bank accounts. (Task #497) |
| `getBankAccountByPk` | `db.getBankAccountByPk(pk)` | Returns a single bank account record by its PK. (Task #497) |
| `waitForBankAccountDeleted` | `db.waitForBankAccountDeleted(pk, timeoutMs?)` | Polls until the bank account record is marked as deleted. (Task #497) |
| `waitForBankAccountExists` | `db.waitForBankAccountExists(accountPk, accountNumber, timeoutMs?)` | Polls until a bank account with the given number exists. (Task #497) |
| `getBankAccountActivityLogs` | `db.getBankAccountActivityLogs(accountPk)` | Returns activity log entries related to bank account changes. (Task #497) |
| `getRatingChangeLogs` | `db.getRatingChangeLogs(accountPk)` | Returns rating change log entries for the account. (Task #497) |
| `getMerchantPrograms` | `db.getMerchantPrograms(merchantPk)` | Returns all programs associated to a merchant via `uown_merchant_to_program` junction. (Task scheduleProgramActivationDeactivationDates) |
| `getMerchantProgramByPk` | `db.getMerchantProgramByPk(pk)` | Returns a single `uown_merchant_program` row by PK. (Task scheduleProgramActivationDeactivationDates) |
| `getActiveMerchantPrograms` | `db.getActiveMerchantPrograms(merchantPk)` | Returns programs where `activation_date <= today AND (deactivation_date IS NULL OR deactivation_date > today)` — live date predicate, independent of sweep. (Task scheduleProgramActivationDeactivationDates) |
| `getMerchantProgramsByTerm` | `db.getMerchantProgramsByTerm(merchantPk, termMonths)` | Returns programs for a merchant filtered by `term_months`. (Task scheduleProgramActivationDeactivationDates) |
| `snapshotMerchantProgram` | `db.snapshotMerchantProgram(pk)` | Reads and returns current state of a `uown_merchant_program` row for later restore. (Task scheduleProgramActivationDeactivationDates) |
| `restoreMerchantProgram` | `db.restoreMerchantProgram(pk, snapshot, authorizedBy)` | Restores a program row from snapshot (authorized DB mutation). (Task scheduleProgramActivationDeactivationDates) |
| `updateMerchantProgramDates` | `db.updateMerchantProgramDates(pk, {activationDate?, deactivationDate?, isActive?}, authorizedBy)` | Authorized DB mutation to set date fields on a program. Requires explicit `authorizedBy` string (CLAUDE.md Exception 3). (Task scheduleProgramActivationDeactivationDates) |
| `waitForProgramActiveState` | `db.waitForProgramActiveState(pk, expected, timeoutMs?)` | Polls `uown_merchant_program` until `is_active` matches `expected`. Default timeout 30s. (Task scheduleProgramActivationDeactivationDates) |
| `getProgramActivityLogs` | `db.getProgramActivityLogs(programPk, {logTypes?, sinceTimestamp?})` | Queries `uown_merchant_activity_log` for entries with matching `program_pk`. Filter by `log_type` array and/or `row_created_timestamp >= sinceTimestamp`. (Task scheduleProgramActivationDeactivationDates) |
| `waitForValueChange` | `waitForValueChange(sql, params, oldValue, timeoutMs?, intervalMs?): Promise<string>` | Polls a single-column SQL query until the returned value differs from `oldValue`. Defaults: timeout=30_000ms, interval=500ms. Returns the new value. Used to detect token refresh without timezone-tainted JS Date comparison. (Task #502) |

**Import via barrel:** `import { helperFn } from '@helpers/index.js';`

## Test Data Sources

- **Merchants:** `src/data/merchants.ts` — includes `EZPawn` (`number: 'TF10078-0001'`, `refCode: 'terraceFinance'`, `programs: ['13 month']`; shares TerraceFinance credentials; added Task #489); `SaslowsJewelersCA` (`number: 'OW90337-0001'`, qa2 pk=6; NOTE: qa2 DB shows `state='NC'` despite the name — flagged in code comment; added Task #505); `DickinsonJewelers` (`number: 'KS4123'`, qa2 pk=832, `clientType=KORNERSTONE`; added Task #505)
- **Test programs:** `src/data/test-programs.ts` — `generateTestProgramName(ctId, runId)`, `PROGRAM_DATE_VARIANTS` factory for date-based test scenarios (Task scheduleProgramActivationDeactivationDates)
- **Test cards:** `src/data/test-cards.ts`
- **Addresses:** `src/data/addresses.ts`
- **Constants:** `src/config/constants.ts`

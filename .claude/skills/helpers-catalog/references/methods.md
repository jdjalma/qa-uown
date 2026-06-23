# Helpers Catalog - Detailed Method Signatures & Usage

> Reference extracted from SKILL.md. For index table and principles, see [../SKILL.md](../SKILL.md).

## network-intercept.helper.ts - Extended Details

### `attachNeuroIdListeners(page)`, `dumpCaptured(capture)`, `classifyNeuroIdOutcome(capture)`

Captures third-party SDK HTTP traffic (frontend + backend) on a Playwright `page`. Scrubs PII fields (ssn, dob, cardNumber, cvc, accountNumber, routingNumber, password) and truncates bodies at 50KB. Re-exported via barrel. Reusable for any feature that requires SDK network inspection, not just NeuroID.
### `attachEndpointCallCounter`
Generic HTTP call counter for any endpoint observed via Playwright `page.on('request')`.

```typescript
function attachEndpointCallCounter(
 page: Page,
 urlSubstring: string,
 method?: string // default: 'POST'
): EndpointCallCounter
```

**`EndpointCallCounter` interface:**

| Member | Type | Description |
|--------|------|-------------|
| `count` | ` => number` | Returns number of matching requests seen so far |
| `reset` | ` => void` | Resets counter to 0 (use between CTs in serial blocks) |
| `urls` | ` => string[]` | Returns list of full URLs matched (useful for debugging duplicate-call assertions) |
| `detach` | ` => void` | Removes the `page.on('request')` listener — call in `afterEach`/`test.afterAll` to avoid leaks |

**Intended usage:** assert that a backend endpoint is called exactly N times during a UI flow (no more, no fewer). Primary use case: `/uown/los/submitApplication` must be called exactly once per customer Submit action — duplicate calls indicate a double-submit bug.

```typescript
const counter = attachEndpointCallCounter(page, '/uown/los/submitApplication');
await completePage.clickSubmit;
expect(counter.count).toBe(1);
```

**Example test:** `docs/taskTestingUown/RU05.26.1.52.0_fixDuplicateSubmitApplicationCallsInCompleteFlow_1285/RU05.26.1.52.0_fixDuplicateSubmitApplicationCallsInCompleteFlow_1285.spec.ts`

**Import via barrel:** `import { attachEndpointCallCounter } from '@helpers/index.js';`

---

## program-test-data.helper.ts

Test data lifecycle for merchant programs: `createTestProgram(api, merchantPk, overrides?)`, `cleanupTestProgram(db, programPk)` (soft-delete via deactivation date in past), `withProgramSnapshot(db, pk, fn)` — snapshot/restore wrapper. (Task scheduleProgramActivationDeactivationDates)

---

## correspondence.helpers.ts
- `getEmailTemplateName(db, leadPk): Promise<string | null>` — polls `uown_email_queue` 15s for rows where `template_name LIKE '%ApprovalEmail%'`, returns most recent or null on timeout/DB error
- `getCorrespondenceLogs(db, leadPk): Promise<CorrespondenceAuditLogRow[]>` — queries `uown_los_activity_log` (column `notes`, `row_created_timestamp`) where `log_type = 'CORRESPONDENCE'`
- `getMerchantChargeProcessingFee(db, refMerchantCode): Promise<boolean>` — reads `uown_merchant.charge_processing_fee_before_esign` via `ref_merchant_code`, throws if merchant not found

All DB calls should be wrapped in try/catch — emit `[ENV-GAP]` annotation if DB unreachable (Cloud SQL proxy required). Re-exported via barrel.

---

## gowsign-template-db.helpers.ts (/ hotfix R1.51.1)

- `getGowSignTemplate(db, templateId)` — returns template row from DB
- `getGowSignTemplatesForState(db, state)` — all templates for a given state
- `templateClientTypeContains(template, expected): boolean` — checks comma-separated `client_type` field
- `assertTemplateClientTypeContains(template, expected)` — throws if not present
- `getEsignDocumentByLeadAndClient(db, leadPk, client)` — returns latest esign document request row for lead
- `extractTemplateIdFromEsignDocumentRequest(request): string` — parses `request.document.templateId` (JSON path verified: `CreateRequestBuilder.java:90-92` + `DocumentDispatchService.java:67-77`)
- `assertSelectedTemplateForLead(db, leadPk, expectedTemplateId)` — polls + asserts the templateId used for the lead's esign document

Re-exported via barrel.

---

## redirect.helpers.ts
- `assertRedirectedToFindMerchant(page, timeoutMs?)` — waits for `uownleasing.com/customer/find-a-merchant` final URL (handles client-side `replaceState` from Next.js, do NOT assert HTTP 301/302)
- `assertRendersApplicationForm(page, { brand?, timeoutMs? })` — waits for `apply-{env}.(uownleasing|kornerstoneliving).com` host + form root visible (anti-assertion: not find-a-merchant)
- Constants: `FIND_A_MERCHANT_RE`, `FIND_A_MERCHANT_URL`

Re-exported via barrel.

---

## settled-in-full.helpers.ts
**Exported types:** `EligibleAccount`, `EmailQueueRow`, `CorrespondenceLogRow`

**Exported functions:**
- `findEligibleSettledInFullAccount(db, company, opts?)`
- `findIneligibleSettledInFullAccount(db, rating)`
- `getEmailQueueRecord(db, toEmail, accountPk, templateHint?)`
- `waitForEmailQueueRecord(db, toEmail, accountPk, templateHint, timeoutMs)`
- `waitForEmailQueueDispatched(db, queuePk, timeoutMs)` — polls `sent_time IS NOT NULL`
- `countEmailQueueRows(db, accountPk, sinceTimestamp?)`
- `getCorrespondenceLog(db, accountPk, templateName?)`
- `waitForCorrespondenceLog(db, accountPk, templateName, timeoutMs)`
- `countCorrespondenceLogs(db, accountPk, templatePattern?, sinceTimestamp?)`

SELECT-only (read-only). Canonical eligibility SQL matches production `settledInFullAccountEmailSweep.sql_to_pick_accounts` exactly (DOW-based exact-date predicate). Re-exported via barrel.

---

## settlement.helpers.ts
- `calculateSettlement({tca, totalPayments, daysDelinquent, totalFees, ppFee?})` — rounded USD number
- `offerPercentForDays(days)` — `0 | 30 | 50 | 65` (discount band map: <=60->0%, 61-90->30%, 91-150->50%, >=151->65%)

Use `toBeCloseTo(expected, 2)` when comparing to API response (IEEE 754 noise). Re-exported via barrel.

---

## account-aging.helpers.ts
- `ageAccount(db, accountPk, days)` — UPDATEs `uown_sv_sched_summary.delinquency_as_of_date = CURRENT_DATE - days`
- `restoreAccount(db, accountPk, originalDays?)` — restores to baseline (default 60)
- `withAgedAccount(db, accountPk, days, action, originalDays?)` — try/finally wrapper
- Constant `SEED_DELINQUENCY_DAYS = 60`

AUTHORIZED MUTATION: SPEC S5 authorizes UPDATEs on seed accounts 4353/4355/4358/4359 in qa1 only — do NOT age arbitrary accounts. try/finally restore is MANDATORY (SPEC S11). Re-exported via barrel.

---

## recording.helpers.ts
- `assertRecordingLinkInDb(db, leadPk, opts?)` — polls `uown_lead_recording` until a row with non-empty `uuid` appears for `leadPk`, returns the uuid string
- `assertSessionStorageState(page, expected, label?)` — reads `sentUuid`/`shortCode`/`leadPk` keys from customer page sessionStorage and asserts against expectation map (supports `'present'`/`'absent'`/string/null)
- `assertSentryReplayInitialized(page, envLabel?)` — pre-flight that Sentry SDK is loaded (probes `window.__SENTRY__?.hub` + `window.Sentry?.getReplay`)
- `extractShortCodeFromContractUrl(contractUrl)` — parses `/{shortCode}/complete?planId=...` or `/{shortCode}` URL shape, returns first path segment
- `buildCustomerCompleteUrl(originationUrl, shortCode)` — assembles `https://origination-{env}.uownleasing.com/{shortCode}/complete`

NOT for: UI assertions — `uown_lead_recording` has no UI rendering on the Origination agent page (DOM-confirmed MCP 2026-05-22). Re-exported via barrel.

---

## servicing-dialogs.helpers.ts
`dismissCustomerInfoConfirmation(page, timeoutMs?)` — waits up to `timeoutMs` (default 10s) for the "Customer Information Confirmation" modal and dismisses it via the Confirm button. Client-state only (zustand `utilityStore.isVerified`), no backend call. Must be called at the start of ANY page-object method that interacts with `/customer-information/{pk}` panel controls.

---

## sticky.helpers.ts
READ-ONLY — does not mutate `uown_sticky*` audit tables.

**Exported functions:**
- `waitForStickySession(db, cctPk, timeoutMs?)`
- `waitForStickyTransactionId(db, cctPk, timeoutMs?)`
- `waitForStickyOutboundLog(db, accountPk, opts?)`
- `waitForStickyInboundEvent(db, accountPk, eventType, opts?)`
- `waitForStickyRetryAttempt(db, stickyPk, minAttempts?, timeoutMs?)`
- `assertStickyDedupeUnique(db)`
- `getStickySweepSqlSnapshot(db)`
- `waitForStickyRecoverSweepRun(db, opts?)`
- `getStickyCancelSweepSqlSnapshot(db)` — current `sql_to_pick_accounts` of `StickyRecoverCancelSweep` (drift check; throws if the task row is absent).
- `waitForStickyCancelSweepRun(db, { sincePk?, timeoutMs? })` — polls `uown_sweep_logs WHERE sweep_name='StickyRecoverCancelSweep'` for a completed run newer than `sincePk`.
- `getLatestStickyRecoverSweepLogPk(db)`
- `findEligibleStickyCct(db, rating)`
- `createStickyEligibleFromExistingAccount(db, opts?)`
- `createStickyEligibleNatural(opts: { api, db, ctx })`

**Row interfaces:** `StickySessionRow`, `StickyOutboundLogRow`, `StickyInboundLogRow`, `StickyRetryAttemptRow`, `StickyDedupeAssertion`, `StickySweepLogRow`, `StickyEligibleResult`, `StickyEligibleNaturalResult`

### `createStickyEligibleNatural` - setup natural flow
- **Purpose:** Executes the full natural application flow (13 steps from `sticky-recover-rating-setup.spec.ts`) as a callable helper, producing a fresh account + denied CCT with REAL `gateway_transaction_id` populated by the gateway. Use when CT-01..CT-09 of need a cct with guaranteed `uown_sticky` materialization — the fast-path helper (`createStickyEligibleFromExistingAccount`) has an empirical asymmetry where synthetic `gateway_transaction_id` format causes `uown_sticky` row not to persist.
- **Signature:** `createStickyEligibleNatural(opts: { api: ApiClients; db: DatabaseHelpers; ctx: TestContext }): Promise<StickyEligibleNaturalResult>`
- **Returns:** `{ leadPk, leadUuid, accountPk, cctPk, gatewayTransactionId }`
- **Duration:** ~5-7 min (sendApplication + UW approval + funding + scheduled cct creation + gateway denial)
- **Authorized UPDATEs:** `uown_sv_account.auto_pay_types`, `uown_sv_receivable.due_date`, `uown_sv_sched_summary.{first_payment_due_date, delinquency_as_of_date}`, `uown_sv_credit_card_transaction.posting_date`
- **NOT for:** CTs that only need UI rendering checks (use fast-path `createStickyEligibleFromExistingAccount` which runs in ~30s for those)
- **Blocked by:** pitfall #39 (`submitApplication` 500 regression 2026-05-21) — CT-01..CT-09 are `fixme`'d until backend fix

### `createStickyEligibleFromExistingAccount` - fast-path setup
- **Purpose:** Discovers a healthy sandbox account + UPDATEs one of its future cct rows to denied SCHEDULED SALE state matching `StickyRecoverSweep` filter. ~30s. Includes DAOD alignment fix (pitfall #38).
- **Signature:** `createStickyEligibleFromExistingAccount(db: DatabaseHelpers, opts?: { accountPk?: number; paymentFrequency?: 'WEEKLY' | 'BI_WEEKLY' | 'MONTHLY' }): Promise<StickyEligibleResult>`
- **Returns:** `{ accountPk, leadPk, cctPk, gatewayTransactionId }`
- **NOT for:** CTs that depend on `uown_sticky` row materializing after sweep (backend persistence has asymmetry with synthetic `gateway_transaction_id`). Use `createStickyEligibleNatural` for those.

---

## datetime.helpers.ts
`expectWithinTzWindow(apiLocalDateTime, dbTimestampUtc, opts?)` — asserts absolute delta <= `maxOffsetHours*3600s + toleranceMs` (defaults: 5h, 2s). Throws descriptive message on parse failure. NOT for: comparing two DB timestamps (same TZ, use direct equality). Re-exported via barrel.

---

## search-sql-explain.helpers.ts
- `getSqlByName(db, sqlName): Promise<string>` — reads raw SQL from DB (case-insensitive lookup; pitfall: BE uppercases, use UPPER)
- `explainAnalyzeSql(db, sqlName, params: ExplainParams): Promise<ExplainAnalyzeResult>` — substitutes named `:param` placeholders and runs `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)`

`ExplainAnalyzeResult`: `{ plan: string[], executedSql: string, executionTimeMs: number, usesIndex(indexName): boolean, hasSeqScan(table): boolean }`

SELECT-only — no mutations. Use `usesIndex('idx_los_invoice_merchant_invoice_number_upper')` / `hasSeqScan('uown_los_invoice')` in CT-BUG-2/CT-BUG-3 pattern assertions. NOT for: monitoring performance in CI (execution time varies by env load); use only in targeted EXPLAIN tests. Re-exported via barrel.

---

## database.helpers.ts - Token Row Types
| Type | Fields | Table |
|------|--------|-------|
| `TokenRow` | base type | — |
| `KountTokenRow` | `pk`, `access_token`, `expiration_time` (`timestamp without time zone`) | `uown_kount_token` |
| `GdsTokenRow` | `pk`, `access_token`, `expiration_time` (`timestamp with time zone`) | `uown_gds_token` |

> **Pitfall:** `uown_kount_token.expiration_time` is `timestamp without time zone`. pg-node returns a JS `Date` whose value depends on system locale — see common-operations cookbook Timestamp Comparisons.

## database.helpers.ts - Key Functions

| Function | Signature | Description |
|----------|-----------|-------------|
| `recalculateArrangementStatus` | `(arrangementPk: string): Promise<string>` | Mirrors Java `PaymentArrangementCCListener` logic — recalculates CC arrangement status from its payments. |
| `recalculateAchArrangementStatus` | `(arrangementPk: string): Promise<string>` | Mirrors Java `PaymentArrangementACHListener` MR !1368 logic — recalculates ACH arrangement status. |
| `simulateCcSweepForArrangement` | `(arrangementPk: string): Promise<number>` | Approves PENDING CC transactions with `posting_date <= CURRENT_DATE` for the arrangement (date-gated). Bypasses the real sweep's `JOIN nextreceivable`. Returns count processed. |
| `approveAllPendingCcSalesForArrangement` | `(arrangementPk: string): Promise<number>` | Approves ALL PENDING CC SALEs for the arrangement regardless of `posting_date` (no date gate). Stand-in for the processor callbacks dev3 cannot emit on multi-installment arrangements (future-dated installments stay PENDING → arrangement stuck IN_PROGRESS). Authorized Exception-3 DB mutation, same scope as S4/S5 ACH SETTLED stand-ins. Caller then runs `recalculateArrangementStatus`. DB-confirmed dev3 2026-06-01: arrangement pk100, 5 SALEs. (payment-arrangement-servicing pipeline) |
| `getNeuroIdVerification` | `db.getNeuroIdVerification(leadPk)` | Returns the most recent row from `uown_neuro_id_verification` for the given lead PK, or null. |
| `waitForNeuroIdRecord` | `db.waitForNeuroIdRecord(leadPk, timeoutMs?)` | Polls until a `uown_neuro_id_verification` row appears for the lead. |
| `getMerchantByRefCode` | `db.getMerchantByRefCode(refMerchantCode)` | Returns key fields for a merchant by `ref_merchant_code`. Note: timestamp columns are `row_created_timestamp`/`row_updated_timestamp` (NOT `created_at`/`updated_at`); acting user is `agent`. |
| `countMerchantByRefCode` | `db.countMerchantByRefCode(refMerchantCode)` | Returns count of merchants — use for absence assertions (count=0 on blocked-save CTs). |
| `getAccountAutoPayTypes` | `db.getAccountAutoPayTypes(accountPk)` | Returns auto-pay type records for the account. |
| `getBankAccountsByAccountPk` | `db.getBankAccountsByAccountPk(accountPk)` | Returns all bank account records for an account. |
| `getActiveBankAccountsByAccountPk` | `db.getActiveBankAccountsByAccountPk(accountPk)` | Returns only active (non-deleted) bank accounts. |
| `getBankAccountByPk` | `db.getBankAccountByPk(pk)` | Returns a single bank account record by its PK. |
| `waitForBankAccountDeleted` | `db.waitForBankAccountDeleted(pk, timeoutMs?)` | Polls until the bank account record is marked as deleted. |
| `waitForBankAccountExists` | `db.waitForBankAccountExists(accountPk, accountNumber, timeoutMs?)` | Polls until a bank account with the given number exists. |
| `getBankAccountActivityLogs` | `db.getBankAccountActivityLogs(accountPk)` | Returns activity log entries related to bank account changes. |
| `getRatingChangeLogs` | `db.getRatingChangeLogs(accountPk)` | Returns rating change log entries for the account. |
| `getMerchantPrograms` | `db.getMerchantPrograms(merchantPk)` | Returns all programs associated to a merchant via `uown_merchant_to_program` junction. |
| `getMerchantProgramByPk` | `db.getMerchantProgramByPk(pk)` | Returns a single `uown_merchant_program` row by PK. |
| `getActiveMerchantPrograms` | `db.getActiveMerchantPrograms(merchantPk)` | Returns programs where `activation_date <= today AND (deactivation_date IS NULL OR deactivation_date > today)`. |
| `getMerchantProgramsByTerm` | `db.getMerchantProgramsByTerm(merchantPk, termMonths)` | Returns programs for a merchant filtered by `term_months`. |
| `snapshotMerchantProgram` | `db.snapshotMerchantProgram(pk)` | Reads current state of a `uown_merchant_program` row for later restore. |
| `restoreMerchantProgram` | `db.restoreMerchantProgram(pk, snapshot, authorizedBy)` | Restores a program row from snapshot (authorized DB mutation). |
| `updateMerchantProgramDates` | `db.updateMerchantProgramDates(pk, {activationDate?, deactivationDate?, isActive?}, authorizedBy)` | Authorized DB mutation to set date fields on a program. Requires explicit `authorizedBy` string (CLAUDE.md Exception 3). |
| `waitForProgramActiveState` | `db.waitForProgramActiveState(pk, expected, timeoutMs?)` | Polls `uown_merchant_program` until `is_active` matches `expected`. Default timeout 30s. |
| `getProgramActivityLogs` | `db.getProgramActivityLogs(programPk, {logTypes?, sinceTimestamp?})` | Queries `uown_merchant_activity_log` for entries with matching `program_pk`. |
| `waitForValueChange` | `waitForValueChange(sql, params, oldValue, timeoutMs?, intervalMs?): Promise<string>` | Polls a single-column SQL query until the returned value differs from `oldValue`. Defaults: timeout=30_000ms, interval=500ms. Returns the new value. |

---

## Test Data Sources

- **Merchants:** `src/data/merchants.ts` — includes `EZPawn` (`number: 'TF10078-0001'`, `refCode: 'terraceFinance'`, `programs: ['13 month']`; shares TerraceFinance credentials;); `SaslowsJewelersCA` (`number: 'OW90337-0001'`, qa2 pk=6; NOTE: qa2 DB shows `state='NC'` despite the name;); `DickinsonJewelers` (`number: 'KS4123'`, qa2 pk=832, `clientType=KORNERSTONE`;)
- **Test programs:** `src/data/test-programs.ts` — `generateTestProgramName(ctId, runId)`, `PROGRAM_DATE_VARIANTS` factory for date-based test scenarios
- **Test cards:** `src/data/test-cards.ts`
- **Addresses:** `src/data/addresses.ts`
- **Constants:** `src/config/constants.ts`

## email.helpers.ts — EmailHelpers (OTP / IMAP)

IMAP (Gmail) reader for OTP codes and email links. Uses plus-addressing (`fintechgroup777+{runId}@gmail.com`) so every run has a unique recipient alias under one root inbox.

### `snapshotInboxUid: Promise<number>` (added 2026-06-02)

Returns the highest UID currently in INBOX. **Call BEFORE triggering the OTP send** so a later `getVerificationCode({ sinceUid })` rejects any pre-existing email. UIDs are monotonic and server-assigned at insert time — a stricter freshness watermark than `envelope.date` (sender-supplied `Date:` header, can drift).

### `getVerificationCode(recipientEmail, timeoutMs?, opts?): Promise<string | null>` (freshness opts added 2026-06-02)

Polls INBOX for the 6-digit OTP sent to `recipientEmail`. New optional `opts: FreshnessOpts`:

| Field | Type | Behavior |
|-------|------|----------|
| `sinceUid` | `number` | **Preferred.** Reject `msg.uid <= sinceUid`. Snapshot via `snapshotInboxUid` before the OTP trigger. |
| `since` | `Date` | Fallback when no UID watermark. Reject `envelope.date < since`. |

**Three-filter matching** (avoids cross-test OTP bleed): (1) strict recipient match on `envelope.to` — Gmail `to:` search ignores the `+alias` suffix and returns emails for ALL aliases under the same root inbox; (2) UID watermark; (3) wall-clock floor (only when no `sinceUid`). Re-exported via barrel.

# Common Operations - Full Code Recipes

> Reference extracted from SKILL.md. For imports, index, and principles, see [../SKILL.md](../SKILL.md).

## Drive to FUNDED (most common pattern)

```typescript
import type { TestContext } from '@support/base-test.js';
import type { ApiClients } from '@support/base-test.js';
import type { DatabaseHelpers } from '@helpers/database.helpers.js';
import type { ConfigEnvironment } from '@config/environment.js';
import { buildTestData } from '@helpers/test-data.helpers.js';
import { createPreQualifiedApplication, driveLeadToFunding } from '@helpers/api-setup.helpers.js';
import { sleep } from '@helpers/common.helpers.js';

async function driveToFunded(
 api: ApiClients,
 db: DatabaseHelpers,
 testEnv: ConfigEnvironment,
 data: { env: string; state: string; merchant: string; orderTotal: string },
 existingAccountPk?: string,
): Promise<{ leadPk: string; accountPk: string }> {
 // GDS bypass: use an existing account when GDS is unavailable
 if (existingAccountPk) {
 console.log(`[Setup] Using existing accountPk=${existingAccountPk} (GDS bypass)`);
 return { leadPk: '0', accountPk: existingAccountPk };
 }

 const td = buildTestData({ env: data.env, state: data.state, merchant: data.merchant, orderTotal: data.orderTotal });

 const ctx: TestContext = {
 leadPk: '', leadUuid: '', accountPk: '', accountNumber: '',
 contractStatus: '', contractUrl: '', websiteAccountPk: '', achAdded: 0, ccAdded: 0,
 reportKeys: new Map<string, string>,
 };

 // Pre-qual pattern: sendApplication WITHOUT order -> 5s -> getApplicationStatus -> sendInvoice -> submitApplication
 await createPreQualifiedApplication(api, td.merchant, td.applicant, ctx, {
 submitPaymentInfoViaApi: true,
 });

 // SIGNED -> SETTLED -> FUNDING
 await driveLeadToFunding(api, td.merchant, ctx);

 // FUNDING -> FUNDED
 await sleep(2_000);
 const fundedResp = await api.lead.updateFundingStatus([Number(ctx.leadPk)], 'FUNDED');
 if (!fundedResp.ok) throw new Error(`updateFundingStatus FUNDED failed: ${fundedResp.status}`);

 // Wait for SVC account creation (asynchronous after FUNDED)
 const accountPk = await db.waitForAccountByLeadPk(ctx.leadPk, 30_000);
 if (!accountPk) throw new Error(`SVC account not created for leadPk=${ctx.leadPk}`);

 return { leadPk: ctx.leadPk, accountPk };
}
```

---

## submitApplication — mandatory prerequisite (`getMissingFields`)

> **Rule:** any helper or custom function that calls `submitApplication` MUST first resolve
> `merchantProgramPk` via `getMissingFields`. Skipping this step makes `submitApplication` fail with
> "Merchant program is required"; if the failure is not asserted, the lead gets stuck in `CC_AUTH_PASSED`
> (never reaching `CONTRACT_CREATED`) and the downstream `settleApplication` blows up with HTTP 500 — a
> misleading diagnosis. Prefer `createPreQualifiedApplication`, which already chains the canonical sequence.

```typescript
// Mandatory sequence BEFORE submitApplication (when not using createPreQualifiedApplication):
// 1. extract shortCode + planId from the redirectUrl returned by sendInvoice
const redirectUrl = invoiceResp.body.paymentDetailsList[0].redirectUrl;
const { shortCode, planId } = parseRedirectUrl(redirectUrl); // shortCode + planId from query/path

// 2. resolve merchantProgramPk
const missing = await api.lead.getMissingFields(shortCode, { planId });

// 3. submit AND assert explicitly (NEVER swallow silently)
const submitResp = await api.lead.submitApplication(buildSubmitApplicationBody(missing, ...));
if (!submitResp.ok) throw new Error(`submitApplication failed: ${submitResp.status} ${submitResp.bodyText}`);
```

> **Diagnostic symptom:** `settleApplication` 500 + lead in `CC_AUTH_PASSED` → almost always
> `submitApplication` without `getMissingFields`. See [[application-lifecycle]] pitfalls #2 and #81.

---

## CC Payment Arrangement (API)

> **IMPORTANT:** CC is **synchronous** — `makeCreditCardPayments` processes the charge in the same
> request. The arrangement is already SUCCESS immediately after the call. No sweep is
> needed.

```typescript
// Required imports
import { buildCcArrangementBody } from '@api/bodies/payment-arrangement.body.js';
import { calculateDateISO } from '@helpers/date.helpers.js';
import { VALID_TEST_CARDS } from '@data/test-cards.js';

// ctx.accountPk must be populated beforehand

// 1. Build body — options OBJECT (NOT array + boolean)
const body = buildCcArrangementBody({
 accountPk: Number(ctx.accountPk), // required, number type
 arrangementType: 'SETTLEMENT', // 'SETTLEMENT' | 'NORMAL'
 ccNumber: VALID_TEST_CARDS[0].cardNumber,
 ccExp: VALID_TEST_CARDS[0].expirationDate,
 cvc: VALID_TEST_CARDS[0].cvv,
 installments: [
 { amount: '100', date: calculateDateISO(0) }, // amount=string, date=YYYY-MM-DD
 ],
});

// 2. Create arrangement — the body already has accountPk, NO extra parameter
const res = await api.paymentArrangement.makeCreditCardPayments(body);
expect(res.ok, `makeCreditCardPayments: ${res.status} — ${JSON.stringify(res.body)}`).toBeTruthy;

// 3. CC is synchronous — arrangement is already SUCCESS here
const arrangement = await db.getPaymentArrangement(ctx.accountPk);
ctx.arrangementPk = String(arrangement?.pk ?? '');
expect(arrangement!.status).toBe('SUCCESS');
expect(arrangement!.arrangement_type).toBe('SETTLEMENT');

// 4. Poll CC transactions — uses the ARRANGEMENT pk, not the account pk
await db.waitForCcTransactionsProcessed(ctx.arrangementPk, 60_000);

// 5. Poll arrangement status — uses the ACCOUNT pk
await db.waitForPaymentArrangementStatus(ctx.accountPk, 'SUCCESS', 60_000);

// 6. Check the account status (only SETTLEMENT transitions to SETTLED_IN_FULL)
const accountStatus = await db.getAccountStatus(ctx.accountPk);
expect(accountStatus).toBe('SETTLED_IN_FULL');
```

---

## CC Payment Arrangement - One-Time Card (UI)

> When filling the one-time card form in the Make Payment modal, the **Expires On** field is
> `input[type="month"]` and requires `YYYY-MM` format. Other formats cause `Error: Malformed value`.

```typescript
// Convert MM/YY or full year before filling
const fullYear = expYear.length === 2 ? `20${expYear}` : expYear;
await page.locator("input[placeholder='Expires On']").fill(`${fullYear}-${expMonth}`);
// Example: expMonth='12', expYear='28' -> fills '2028-12'
```

When a Servicing account already has a card on file, `makeCcPaymentArrangement` defaults to
"Use existing card information". Pass `ccDetails` to switch to the one-time card form:

```typescript
await servicingBasePage.makeCcPaymentArrangement({
 startDate: calculateDate(0),
 endDate: calculateDate(30),
 frequency: 'Monthly',
 ccDetails: {
 firstName: 'John',
 lastName: 'Doe',
 cardNumber: VALID_TEST_CARDS[0].cardNumber,
 cvc: VALID_TEST_CARDS[0].cvv,
 expMonth: '12',
 expYear: '28', // 2-digit or 4-digit — method normalizes internally
 },
});
```

Selectors added in (`CreditCardSelectors`):

| Selector key | Selector | Notes |
|---|---|---|
| `otCardFirstName` | `input[placeholder='First Name']` | One-time card form |
| `otCardLastName` | `input[placeholder='Last Name']` | One-time card form |
| `otCardExpiresOn` | `input[placeholder='Expires On']` | `type="month"` — use `YYYY-MM` |
| `otCardSecurityCode` | `input[placeholder='Card Security Code']` | CVV/CVC |

---

## ACH Payment Arrangement

> **IMPORTANT:** ACH is **asynchronous** — `createOrUpdateAchPayments` creates NOT_STARTED entries.
> The sweep (via Profituity) processes them later. **NOT testable in qa1** — Profituity is inactive there.
> The body must have `achProcessType: 'REQUEST'` for the sweep to pick it up without checking the due date.
> The builder already includes `achProcessType: 'REQUEST'` by default.

```typescript
import { buildAchArrangementBody } from '@api/bodies/payment-arrangement.body.js';
import { calculateDateISO } from '@helpers/date.helpers.js';

// Build body — options OBJECT
const body = buildAchArrangementBody({
 accountPk: Number(ctx.accountPk), // required
 arrangementType: 'SETTLEMENT', // 'SETTLEMENT' | 'NORMAL', default='SETTLEMENT'
 installments: [
 { amount: '100', date: calculateDateISO(3) }, // amount=string, date=YYYY-MM-DD
 ],
 // Optional: routingNumber, accountNumber, bankAccountType (defaults from TEST_BANK)
});

// Create arrangement — the body already has accountPk, NO extra parameter
const res = await api.paymentArrangement.createOrUpdateAchPayments(body);
expect(res.ok).toBeTruthy;

// Check the FK and the created ACH payments
const hasFk = await db.achPaymentHasArrangementFk;
expect(hasFk).toBe(true);

const arrangement = await db.getPaymentArrangement(ctx.accountPk);
ctx.arrangementPk = String(arrangement!.pk);
const payments = await db.getAchPaymentsByArrangement(ctx.arrangementPk);
expect(payments.length).toBeGreaterThan(0);
expect(payments[0].status).toBe('PENDING');

// ACH sweep — only in environments with Profituity active (not qa1)
// If you need to test without Profituity, use DB simulation (see database.helpers.ts):
// await db.simulateCcSweepForArrangement(ctx.arrangementPk);
// await db.recalculateArrangementStatus(ctx.arrangementPk);
```

---

## TMS Due Date Adjustment

```typescript
// The TMS endpoint uses a separate API KEY (FIVE9_TMS_API_KEY, not the SVC key)
// testEnv.tmsApiKey <- the correct key
const res = await api.account.moveDueDatesByDays(ctx.accountPk, 7);
// or via TMS:
// POST /uown/tms/v1/accounts/{pk}/next-due-date/adjustments
// Header: Authorization: testEnv.tmsApiKey
```

---

## Scheduled Tasks

```typescript
// CC Sweep
await api.scheduledTask.sendCreditCardPaymentsSweep;

// Or via the generic trigger (task name)
await api.scheduledTask.triggerScheduledTask('sendCreditCardPaymentsSweep');
```

### Sweep Validation Checklist (mandatory for every sweep test)

Every test that triggers a sweep MUST validate these 5 points in order. Missing any one = incomplete test.

#### 1. Sweep is active

Before triggering, assert the sweep exists and `is_active = true` in `uown_scheduled_task`:

```sql
SELECT pk, template_name, is_active, cron_trigger, fixed_rate, last_trigger_time
FROM uown_scheduled_task
WHERE template_name = '<SweepName>';
-- Assert: is_active = true
```

If `is_active = false`, the trigger call returns 200 but does nothing. This is a silent no-op — the most common cause of "sweep had no effect" confusion.

#### 2. No errors in sweep_logs (`uown_sweep_logs.error IS NULL`)

After the sweep runs, fetch the newest log row and assert `error IS NULL`:

```typescript
// Wait for the sweep run to land (polling — pitfall #87: do NOT read immediately after trigger)
const sweepLog = await db.waitForRecord(
  `SELECT pk, sweep_name, number_of_records_processed, error, start_time, end_time
   FROM uown_sweep_logs
   WHERE sweep_name = $1
   ORDER BY pk DESC LIMIT 1`,
  [sweepName],
  { timeoutMs: 30_000 }
);
expect(sweepLog.error).toBeNull();  // null = no error; non-null = sweep failure message
```

> **Pitfall:** `uown_sweep_logs` uses `sweep_name` (NOT `task_name`) and `number_of_records_processed` (NOT `processed`). Wrong column names = "column does not exist" error (pitfall #95).

#### 3. No errors in Grafana (manual / monitoring check)

Grafana logs are not DB-queryable from tests. For manual validation and post-run monitoring:

- **URL pattern:** `https://grafana.<env>.uownleasing.com` → Explore → search `level=error sweep_name=<SweepName>` in the relevant time window.
- **What to look for:** `ERROR` or `WARN` lines from `SweepService` in the sweep's time window (`start_time` to `end_time` from sweep_logs).
- **Automated tests:** assert `sweepLog.error IS NULL` (step 2 above) as the DB-observable proxy. Grafana check is a manual complement for production monitoring.

#### 4. Number of affected records (`number_of_records_processed >= 1`)

Assert the sweep actually processed at least one record. A run with `processed = 0` means the sweep ran but had no eligible data:

```typescript
expect(sweepLog.number_of_records_processed).toBeGreaterThanOrEqual(1);
```

> **Why this matters:** `processed = 0` is not an error — the sweep "succeeded" but touched nothing. Without this assertion, a test can pass even when the sweep had zero effect (e.g., test data was not eligible, SQL scope was too narrow, or the account was already in a terminal state).

> **No-op runs:** some sweeps write `error = "No recoveries found."` (or similar) when `processed = 0`. These are valid no-op runs — `error` is non-null but it is informational, not a failure. Know your sweep's no-op message before asserting `error IS NULL`.

#### 5. Downstream result created correctly in DB

Verify the business outcome the sweep was supposed to produce. This is sweep-specific — examples:

```typescript
// CC payment sweep → assert uown_sv_credit_card_transaction row created
const ccTx = await db.getSingleRow(
  `SELECT pk, amount, status, account_pk FROM uown_sv_credit_card_transaction
   WHERE account_pk = $1 ORDER BY pk DESC LIMIT 1`,
  [accountPk]
);
expect(ccTx.status).toBe('APPROVED');

// ACH payment sweep → assert uown_sv_achpayment row created
const achTx = await db.getSingleRow(
  `SELECT pk, amount, status, ach_process_type FROM uown_sv_achpayment
   WHERE account_pk = $1 ORDER BY pk DESC LIMIT 1`,
  [accountPk]
);
expect(achTx.status).not.toBe('FAILED');

// Status-transition sweep → assert account/lead status changed
const account = await db.getSingleRow(
  `SELECT account_status FROM uown_sv_account WHERE pk = $1`, [accountPk]
);
expect(account.account_status).toBe('EXPECTED_STATUS');

// Activity-log sweep (Rule #13) → assert INTERNAL note written
const note = await db.waitForRecord(
  `SELECT notes FROM uown_sv_activity_log
   WHERE account_pk = $1 AND notes ILIKE $2 ORDER BY pk DESC LIMIT 1`,
  [accountPk, '%expected text%'],
  { timeoutMs: 15_000 }
);
expect(note).toBeTruthy();
```

> **Rule #13 applies to sweeps:** every sweep that represents a business action (payment attempt, status change, recovery cancel) MUST write an `INTERNAL` / `SYSTEM_GENERATED` activity-log entry. If your test does not assert the note, the test is incomplete regardless of the DB state.

### Quick validation query (copy-paste for manual investigation)

```sql
-- Last 5 runs for a sweep (replace sweep name)
SELECT pk, sweep_name, number_of_records_processed, error,
       start_time::text, end_time::text,
       EXTRACT(EPOCH FROM (end_time - start_time))::int AS duration_s
FROM uown_sweep_logs
WHERE sweep_name = 'StickyRecoverCancelSweep'
ORDER BY pk DESC LIMIT 5;

-- Check sweep is active
SELECT pk, template_name, is_active, cron_trigger, last_trigger_time
FROM uown_scheduled_task
WHERE template_name = 'StickyRecoverCancelSweep';
```

---

## Merchant Create/Edit Flow (Origination)

> . Uses `MerchantEditPage` (`src/pages/origination/merchant-edit.page.ts`).

```typescript
import { MerchantEditPage } from '@pages/origination/merchant-edit.page.js';

// Create a new merchant with Inventory Category
await test.step('Navigate to Add Merchant form', async  => {
 merchantPage = new MerchantEditPage(page);
 await merchantPage.navigateToAddMerchant(env.originationUrl);
});

await test.step('Fill form and save', async  => {
 await merchantPage.fillMerchantForm({
 refCode: 'OW90999-0001',
 name: 'Test Merchant',
 legalName: 'Test Merchant LLC',
 locationName: 'Main Location',
 inventoryCategory: 'ELECTRONICS',
 });
 // selectInventoryCategory is called internally by fillMerchantForm when inventoryCategory is provided
});

// Verify DB — note uown_merchant column names
await test.step('Verify DB record', async  => {
 const row = await db.getMerchantByRefCode('OW90999-0001');
 expect(row.inventory_category).toBe('ELECTRONICS');
 // Timestamp columns: row_created_timestamp / row_updated_timestamp (NOT created_at/updated_at)
 // Acting user column: agent (NOT created_by/updated_by)
 expect(row.agent).toBeDefined;
});

// Verify absence (blocked save — e.g., missing Inventory Category)
const count = await db.countMerchantByRefCode('OW90999-BLOCKED');
expect(count).toBe(0);
```

### React-select option picker - union selector for Origination forms

Origination forms mix `filter__*` (themed, classNamePrefix="filter") and `css-*` (default) prefixes within the same page. Use the following union selector to target dropdown options regardless of which prefix is applied:

```typescript
const REACT_SELECT_OPTION_UNION =
 '.filter__option, [class*="css-"][class*="option-"], ' +
 '[class*="-option"]:not([class*="options"]):not([class*="placeholder"]):not([class*="single-value"])';
```

### Clone dropdown (Add Merchant form)

The clone trigger is `<a class="dropdownContainer__ddButton">` (not `<button>`). Menu items are `.dropdown-item` inside `.dropdown.show`. The first item is a header containing the search input — always exclude it:

```typescript
// openCloneDropdown clicks the <a> trigger
await merchantPage.openCloneDropdown;
// selectMerchantToClone types in search input and clicks first non-header item
await merchantPage.selectMerchantToClone('OW90218');
```

---

## Email Dispatch - Two-Stage Pipeline

> **CRITICAL:** Any test that validates an email triggered by a sweep task MUST run BOTH sweeps in sequence, or the IMAP assertion will time out.

The email dispatch pipeline is two-stage:

1. **`*EmailSweep` task** (e.g., `settledInFullAccountEmailSweep`) — enqueues rows in `uown_email_queue` with status `PENDING`; writes a row to `uown_correspondence_logs`.
2. **`emailSweep` task** — picks up PENDING rows and dispatches via SendGrid. Terminal status on successful dispatch is `STORED` (not `SENT`) in qa2; confirmed by `sent_time IS NOT NULL`.

```typescript
// Always run both sweeps in sequence
await api.scheduledTask.triggerScheduledTask('settledInFullAccountEmailSweep');
await helpers.waitForEmailQueueRecord(db, toEmail, accountPk, 'settled-in-full', 30_000);
await api.scheduledTask.triggerScheduledTask('emailSweep');
await helpers.waitForEmailQueueDispatched(db, queuePk, 60_000);
```

### Debugging when no row lands in uown_email_queue

If the sweep triggers but no `uown_email_queue` row is created, check `uown_correspondence_logs.error` — it captures service-side failures like `"No data associated with correspondence request"` that silently prevent enqueue.

```sql
SELECT error, template_name, row_created_timestamp
FROM uown_correspondence_logs
WHERE account_pk = <accountPk>
ORDER BY row_created_timestamp DESC;
```

### Schema notes

- `uown_sv_account` does **NOT** have `customer_pk`. The relationship is: `uown_sv_customer.account_pk -> uown_sv_account.pk`.
- `uown_correspondence_logs` native columns: `pk`, `agent`, `row_created_timestamp`, `row_updated_timestamp`, `tenant_id`, `web_user_id`, `data_map`, `error`, `source`, `template_name`, `correspondence_type`, `account_pk`, `lead_pk`. There is NO `recipient`, `status`, or `updated_by` — derive those via JOIN on `uown_email_queue`.

### settled-in-full helpers

```typescript
import {
 findEligibleSettledInFullAccount,
 waitForEmailQueueRecord,
 waitForEmailQueueDispatched,
 getCorrespondenceLog,
} from '@helpers/index.js';
```

---

## Timestamp Comparisons - pg-node and `timestamp without time zone`

> **PITFALL:** When pg-node reads a `timestamp without time zone` column, the returned JS `Date` is timezone-interpreted by the Node.js process locale. Comparing `row.expiration_time.getTime` against `Date.now` is unreliable across environments.

**Wrong pattern (do NOT use):**
```typescript
// WRONG — timezone-sensitive
const row = await db.getSingleRow<KountTokenRow>('SELECT expiration_time FROM uown_kount_token WHERE pk = 1');
expect(row.expiration_time.getTime).toBeGreaterThan(Date.now); // unreliable
```

**Correct pattern - push comparison to PG:**
```typescript
// CORRECT — comparison happens in Postgres, JS receives boolean
const { ok } = await db.getSingleRow<{ ok: boolean }>(
 `SELECT (expiration_time > now + interval '30 seconds') AS ok FROM uown_kount_token WHERE pk = $1`,
 [1],
);
expect(ok).toBe(true);
```

Alternatively, use `waitForValueChange` to detect that the token string itself changed:
```typescript
const newToken = await db.waitForValueChange(
 'SELECT access_token FROM uown_kount_token WHERE pk = $1',
 [1],
 oldToken,
 30_000,
);
expect(newToken).not.toBe(oldToken);
```

**Affected tables:**
- `uown_kount_token.expiration_time` — `timestamp WITHOUT time zone` — apply the PG-side pattern
- `uown_gds_token.expiration_time` — `timestamp WITH time zone` — pg-node handles correctly; direct JS comparison is safe

---

## MerchantConfigurator - qa2 known quirk

`MerchantConfigurator.configureByName(merchantName, ...)` calls `/uown/los/getMerchantsByRefCode` using the lowercase `refCode` key from `src/data/merchants.ts` (e.g., `'danielsjewelers'`). In qa2, this endpoint matches by the actual `ref_merchant_code` column value (e.g., `'OL90205-0079'`). The mismatch causes the configurator to return 0 results and fail silently.

**Workaround - tests that do NOT need to mutate merchant config:**

Pass `skipMerchantPreflight: true`:

```typescript
await createPreQualifiedApplication(api, merchant, applicant, ctx, {
 submitPaymentInfoViaApi: true,
 skipMerchantPreflight: true,
});
```

**Workaround - tests that DO need to mutate merchant config:**

Use the merchant number directly:

```typescript
await mSetup.configure(MERCHANTS.DanielsJewelers.number, { isCcRequired: true, ... });
```

---

## Token Tables - known app constraint

`RefreshKountAccessTokenSweepService` and `RefreshGdsAccessTokenSweepService` (commit `213b96b54`) call `loadOrCreateToken.setPk(...)` followed by `repo.save(...)`. Because the entity uses `@GeneratedValue`, the explicit `setPk` is ignored on INSERT — the DB assigns a new PK. Consequence: **after deleting pk=1, the sweep recreates the row at a new auto-incremented PK, not pk=1**. Use `ORDER BY pk DESC LIMIT 1` or `waitForValueChange` targeting the latest row instead.

---

## Estado compartilhado entre steps (ctx)

> Shared state between steps (ctx)

```typescript
// Declare BEFORE test.step
const ctx: {
 leadPk: string;
 leadUuid: string;
 accountPk: string;
 arrangementPk: string;
} = { leadPk: '', leadUuid: '', accountPk: '', arrangementPk: '' };

// Populate inside steps
await test.step('Setup', async  => {
 ctx.accountPk = '4438';
});

await test.step('Assert', async  => {
 // ctx.accountPk available here
 const status = await db.getAccountStatus(ctx.accountPk);
});
```

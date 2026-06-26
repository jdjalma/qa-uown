---
name: common-operations
description: Load when you need a recurring operation: create a lead via UI or API, authenticate in a portal, capture an OTP, read IMAP email, query the DB with polling. The project cookbook.
disable-model-invocation: true
---

# Common Operations — Cookbook

> **For agents:** Read this file BEFORE implementing any test that involves payments,
> lead creation, or state navigation.
> Full code recipes: [references/cookbook.md](references/cookbook.md)

> **Authority boundary** (`docs/_docs-conventions.md` §7): this skill covers **WHAT OPERATIONS EXIST** — recipes, canonical imports, operation sequences. For the **current names and signatures of helpers** (which change every release), consult [[helpers-catalog]] or read `src/helpers/` directly before implementing — this skill may be out of date relative to the code. **Do not rely on a helper signature here as the canonical source** — confirm it in the file.

---

## Canonical Imports

> **IMPORT RULE (DRY):** every RUNTIME helper comes in via the barrel `@helpers/index.js` —
> NEVER the individual module path (`@helpers/api-setup.helpers.js`, `@helpers/date.helpers.js`, …).
> The barrel re-exports everything from `src/helpers/`; importing directly fragments the reuse point and
> hides helpers that already exist. Only exception: `import type` may point to the specific module
> when it is a type the barrel does not re-export. The same principle applies to `@data/index.js`.

```typescript
// Fixture (ALWAYS use — not @playwright/test nor @support/base-test)
import { test, expect } from '@fixtures/test-context.fixture.js';

// Tags (ALWAYS use buildTags/splitTags — not hardcoded strings)
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';

// ALL runtime helpers via the barrel — lead setup, dates, test-data, etc.
// calculateDateISO returns YYYY-MM-DD (Java LocalDate); calculateDate returns MM/DD/YYYY (UI)
import {
  createPreQualifiedApplication, driveLeadToFunding, setupApplicationViaApi,
  calculateDateISO, calculateDate,
  buildTestData,
} from '@helpers/index.js';

// Payment arrangement bodies (they live in @api/bodies — they are not helpers)
import { buildCcArrangementBody, buildAchArrangementBody } from '@api/bodies/payment-arrangement.body.js';

// Test cards (via the @data barrel)
import { VALID_TEST_CARDS } from '@data/index.js';

// Shared state between steps (declare before test.step)
import type { TestContext } from '@support/base-test.js';
```

---

## testData Structure (task tests)

```typescript
const testData = [
 {
 env: 'qa1',
 state: 'CA',
 merchant: 'TerraceFinance',
 orderTotal: '1000',
 tag: buildTags(TestTag.REGRESSION, TestTag.CRITICAL, TestTag.QA1),
 existingAccountPks: undefined as string[] | undefined,
 },
];

for (const data of testData) {
 test.describe(`${TEST_NAME} - ${data.env}/${data.merchant}`, { tag: splitTags(data.tag) },  => {
 test.use({ envName: data.env });
 test('CT-01: ...', async ({ api, db, testEnv }) => {
 test.setTimeout(300_000);
 });
 });
}
```

---

## Authentication

> **BDD spec (acceptance contract):** [`docs/scenarios/login.md`](../../docs/scenarios/login.md)
> The BDD defines the observable behavior a correct login must satisfy. The page objects and helpers are the implementation; the BDD is the spec. Any change to the login flow must be reflected in the BDD first.

### Agent portals (Origination, Servicing, AMS) — username/password

```typescript
import { loginToPortal, loginToPortalWithOptions } from '@helpers/index.js';

// Standard — 'manager' role by default
await loginToPortal(page, env.originationUrl, env);

// Explicit role or waitUntil
await loginToPortalWithOptions(page, env.originationUrl, env, 'merchant', 'networkidle');

// LoginPage directly (only when testing login behavior itself — CT-02, CT-03)
const loginPage = new LoginPage(page);
await loginPage.login(credentials.email, credentials.password);
```

### Website portal — OTP login

```typescript
// Step 1: submit email or phone → triggers OTP dispatch
await websitePage.loginWithEmailOrPhone(customerEmail);

// Step 2: retrieve OTP from email (IMAP) and enter it
const otp = await emailHelper.getLatestOtp();
await websitePage.enterVerificationCode(otp);
```

> Relevant BDD scenarios: CT-04 (email OTP) · CT-05 (phone OTP) · CT-06 (resend) · CT-07 (invalid code)

---

## Operation Index

> **Convention:** every entry in this table MUST have a corresponding BDD file in `docs/scenarios/` registered in `docs/scenarios/_index.md`. When adding a new canonical operation here, create the BDD file first (via `test-scenarios` skill) and add the `_index.md` row before adding the table entry. No entry without a BDD = oracle gap.

| Operation | Key Points | Recipe |
|-----------|-----------|--------|
| **Login — agent portals** | `loginToPortal(page, url, env, role)` · roles: `manager` (default) / `merchant` | BDD: [login.md](../../docs/scenarios/login.md) |
| **Login — Website (OTP)** | `loginWithEmailOrPhone()` → `enterVerificationCode()` · OTP via IMAP | BDD: [login.md](../../docs/scenarios/login.md) |
| Drive to FUNDED | pre-qual -> signed -> funding -> funded -> wait SVC account | [cookbook](references/cookbook.md#drive-to-funded-most-common-pattern) |
| CC Payment (API) | Synchronous — SUCCESS immediately, no sweep needed | [cookbook](references/cookbook.md#cc-payment-arrangement-api) |
| CC Payment (UI) | One-time card: `input[type="month"]` requires `YYYY-MM` | [cookbook](references/cookbook.md#cc-payment-arrangement---one-time-card-ui) |
| ACH Payment | Async — creates NOT_STARTED, needs Profituity sweep | [cookbook](references/cookbook.md#ach-payment-arrangement) |
| TMS Due Date | Uses separate API key (`tmsApiKey`, not SVC key) | [cookbook](references/cookbook.md#tms-due-date-adjustment) |
| Scheduled Tasks | `triggerScheduledTask(name)` for generic trigger | [cookbook](references/cookbook.md#scheduled-tasks) |
| Merchant Create/Edit | `MerchantEditPage`, react-select union selector | [cookbook](references/cookbook.md#merchant-createedit-flow-origination) |
| Email Dispatch | Two-stage: *EmailSweep -> emailSweep; BOTH required | [cookbook](references/cookbook.md#email-dispatch---two-stage-pipeline-task-491) |
| Timestamp Comparison | Push comparison to PG for `WITHOUT time zone` columns | [cookbook](references/cookbook.md#timestamp-comparisons---pg-node-and-timestamp-without-time-zone-task-502) |
| MerchantConfigurator qa2 | Use merchant number directly, not `configureByName` | [cookbook](references/cookbook.md#merchantconfigurator---qa2-known-quirk-task-505--hotfix-r1511) |
| Token Tables | After delete+sweep, row gets new PK (not pk=1) | [cookbook](references/cookbook.md#token-tables---known-app-constraint-task-502) |
| Shared ctx | Declare before test.step, populate inside steps | [cookbook](references/cookbook.md#estado-compartilhado-entre-steps-ctx) |
| Activity-log assert | Use the **oracle** helpers, NOT raw SELECT | [§ Activity-log assertions](#activity-log-assertions-oracle--regra-13) |

---

## Activity-log assertions (oracle — rule #13)

> **STOP writing `SELECT ... FROM uown_los_lead_notes` / `uown_los_activity_log ...` inline.** Every log assertion (rule #13 — "no log = nothing is happening") goes through the **oracle** in `src/helpers/activity-log.helpers.ts`, exported by the barrel `@helpers/index.js`. It used to be a SELECT duplicated across 10+ specs; now it is a single, discoverable surface. The helpers **RETURN the row (or null) — they do not call `expect()`**; the assertion lives in the test.

Choose the table by the event's origin — the oracle covers both from the same import:
- `uown_los_lead_notes` (free-text timeline): `findLeadNoteContaining` · `countLeadNotesContaining` · `waitForLeadNoteSubstring` (alias `waitForLeadNote`) · `getLeadNotesByLeadPk`.
- `uown_los_activity_log` (structured LOS — Buddy/Protection Plan, correspondence, data-change live HERE, not in lead_notes): `findActivityLogContaining` · `countActivityLogContaining` · `waitForActivityLogSubstring`.

```typescript
import { waitForActivityLogSubstring } from '@helpers/index.js';

// The LOS event is written ASYNC after the action → use the waiter (poll), not single-shot.
// Returns the row; throws with a descriptive message on timeout. The assertion stays in the test.
const log = await waitForActivityLogSubstring(db, fundedAccount.leadPk, 'Protection Plan');
expect(log.logType).toBe('DATA_CHANGE');
expect(log.notes).toContain('enrolled');
```

**Notes:**
- `findActivityLogContaining(db, keyPk, substring, keyColumn?)` filters by `lead_pk` (default) or `account_pk` — pass `'account_pk'` for servicing-side logs.
- `countActivityLogContaining` / `countLeadNotesContaining` for **idempotency** (re-running the action must NOT duplicate the log).
- Soft-deleted (`deleted = true`) is excluded from every read — a hidden log is not an observable consequence.
- SELECT-only. Writing a raw activity-log SELECT in a spec when the oracle already covers it = rework and schema drift; the oracle exists to kill that anti-pattern.

---

## Quick Reference Signatures

| Function | Real Signature | Common Mistake |
|----------|---------------|----------------|
| `buildCcArrangementBody` | `(options: BuildCcArrangementOptions)` | ~~`([...], boolean)`~~ |
| `buildAchArrangementBody` | `(options: BuildAchArrangementOptions)` | ~~`([...])`~~ |
| `makeCreditCardPayments` | `(body)` — no accountPk | ~~`(accountPk, body)`~~ |
| `createOrUpdateAchPayments` | `(body)` — no accountPk | ~~`(accountPk, body)`~~ |
| `waitForCcTransactionsProcessed` | `(arrangementPk, timeoutMs?)` | ~~`(accountPk)`~~ |
| `waitForPaymentArrangementStatus` | `(accountPk, status, timeoutMs?)` | ~~`(arrangementPk, ...)`~~ |
| `calculateDateISO` | returns `YYYY-MM-DD` | ~~`isoDate`~~ (does not exist) |
| `calculateDate` | returns `MM/DD/YYYY` | ~~use for Java APIs~~ |
| `driveLeadToFunding` | `(api, merchant, ctx)` | ~~`driveToFundedAndGetAccountPk`~~ (does not exist) |
| `findActivityLogContaining` | `(db, keyPk, substring, keyColumn?)` → row\|null | ~~raw `SELECT ... uown_los_activity_log`~~ |
| `waitForActivityLogSubstring` | `(db, keyPk, substring, options?)` → row (throws on timeout) | ~~single-shot query racing async log~~ |
| `waitForLeadNoteSubstring` | `(db, leadPk, substring, ...)` → row | ~~raw `SELECT ... uown_los_lead_notes`~~ |

---

## Key Pitfalls (summary)

1. **CC is sync, ACH is async** — CC needs no sweep; ACH needs Profituity (not available in qa1)
2. **Two-stage email** — always trigger BOTH *EmailSweep AND emailSweep
3. **Timestamp WITHOUT tz** — push comparison to PG, never compare in JS
4. **Token pk=1** — after delete, sweep creates at new PK; use `ORDER BY pk DESC LIMIT 1`
5. **MerchantConfigurator qa2** — `configureByName` fails silently; use merchant number
6. **Expires On field** — `input[type="month"]` requires `YYYY-MM`, not `MM/YY`
7. **Activity-log via oracle** — never raw `SELECT` on `uown_los_lead_notes`/`uown_los_activity_log`; use `waitForActivityLogSubstring`/`waitForLeadNoteSubstring` (regra #13) — see § Activity-log assertions

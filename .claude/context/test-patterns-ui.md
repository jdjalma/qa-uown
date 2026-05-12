<!-- PT-BR: Padrões de teste específicos de UI — hybrid API+UI, triple validation, react-data-table, MobX, tab panels, downloads, sort indicators, stability específica de browser. -->

# Test Patterns — UI

Padrões específicos para testes E2E com browser. Para padrões fundamentais (fixtures, testData, risk tier), ver [`test-patterns-core.md`](./test-patterns-core.md). Para payment arrangements, ver [`test-patterns-arrangements.md`](./test-patterns-arrangements.md).

## Hybrid Test Pattern — API Creates, UI Verifies

When a feature is only accessible via API (e.g., `arrangementType: 'SETTLEMENT'` cannot be set through the UI modal), use a hybrid test pattern: API creates the state, then UI verifies the result is correctly rendered.

```typescript
// 1. Create state via API (what the UI cannot do)
const body = buildCcArrangementBody({
  accountPk: Number(accountPk),
  arrangementType: 'SETTLEMENT',
  installments: [{ amount: '100', date: calculateDateISO(0) }],
});
const res = await api.paymentArrangement.makeCreditCardPayments(body);
expect(res.ok).toBeTruthy();

// 2. Verify DB state (API result)
const arrangement = await db.getPaymentArrangement(accountPk);
expect(arrangement!.arrangement_type).toBe('SETTLEMENT');
expect(arrangement!.status).toBe('SUCCESS');

// 3. Reload UI and verify rendering
await page.reload();
await servicingPage.waitForSpinner();
const accountStatus = await db.getAccountStatus(accountPk);
expect(accountStatus).toBe('SETTLED_IN_FULL');
```

**When to apply:** any feature where the UI only supports a subset of the API capabilities.

## Triple Validation Pattern — E2E + API + DB

When a test validates a page that displays data from a backend table (history pages, list views), always include triple validation:

1. **Via API (action):** execute the action (POST/PUT) that creates/modifies the data
2. **Via API (GET):** capture the created record as the reference source of truth
3. **Via DB:** cross-validate that the DB persisted the data correctly
4. **Via UI (E2E):** navigate to the page and compare each displayed column against the API response values

Guarantees:
- Backend persists correctly (API response vs DB)
- Frontend renders correctly (UI vs API response)
- Display formats are correct (e.g., `isFpdChange: true` → `Yes`, ISO dates → `MM/DD/YYYY`)

```typescript
// 1. Execute action via API
const moveRes = await api.account.moveDueDatesByDays(ctx.accountPk, 7);
expect(moveRes.ok).toBeTruthy();

// 2. Capture API GET response as reference
const apiRecords = await api.account.getDueDateMoves(ctx.accountPk, 0, 10);
const latest = apiRecords.body.content[0];

// 3. Cross-validate DB persistence
const dbRecord = await db.getSingleRow('SELECT * FROM uown_sv_due_date_move WHERE pk = $1', [latest.pk]);
expect(dbRecord.move_number_of_days).toBe(latest.moveNumberOfDays);

// 4. UI renders API values correctly
await dueDateMovesPage.navigateToDueDateMoves(ctx.accountPk);
const firstRow = await dueDateMovesPage.getFirstRow();
expect(firstRow.movedDays).toBe(String(latest.moveNumberOfDays));
expect(firstRow.isFpdChange).toBe(latest.isFpdChange ? 'Yes' : 'No');
```

**When to apply:** any CT that validates data displayed in a table/history page (e.g., DueDateMovesHistoryPage, FrequencyChangesHistoryPage, ErrorLogPage Submit/Send Application tabs).
**When NOT to apply:** schema-only CTs, flow CTs that don't assert displayed table data.

**Error log variant (Task #1240):** confirmed working for BOTH error log tabs on `ErrorLogPage`:
- **Submit Application tab** — errors from `submitApplication` + `authorizeCreditCard`, via `api.merchant.getSubmitApplicationErrorLogs(from, to)`, mapped to `uown_submit_application_error_log`
- **Send Application tab** — errors from `sendApplication` (default UI tab), via `api.merchant.getMerchantApiErrorLogs(from, to)`, mapped to `uown_merchant_api_error_log`
- **State machine clarification (Task #1240):** `CC_AUTH_PASSED` and `CONTRACT_CREATED` are valid states for `submitApplication`. Only `SIGNED`, `FUNDED`, `SETTLED_IN_FULL`, and `FUNDING` are invalid. Invalid planId errors are logged.
- **getMissingFields caveat:** even when `getMissingFields` returns 500, leads that previously had `merchantProgramPk` set can still proceed with `authorizeCreditCard`.

## react-data-table-component v7 Pattern

`react-data-table-component` v7 renders a `<div role="table">`, NOT a native `<table>`. Use ARIA role selectors:

```typescript
// CORRECT — matches <div role="table">
await expect(page.getByRole('table').first()).toBeVisible({ timeout: 10_000 });

// WRONG — matches only native <table> elements
await expect(page.locator('table').first()).toBeVisible();
```

Applies to: FrequencyChangesHistoryPage, DueDateMovesHistoryPage. Selectors `SELECTORS.table`, `SELECTORS.tableHeader`, `SELECTORS.tableRow`, `SELECTORS.tableCell` must target the `rdt_*` CSS classes.

## MobX pre-fetch race condition

When a Servicing History page uses MobX to pre-fetch data on History dropdown open, the API response may be cached before the target component mounts. Pattern: **set up `page.waitForResponse()` BEFORE opening the History dropdown**:

```typescript
// CORRECT — listener set up BEFORE any menu click
const freqApiResponse = page.waitForResponse(
  r => r.url().includes('/frequency-changes'),
  { timeout: 30_000 },
).catch(() => null);

await fcPage.navigateToFrequencyChanges();

const apiRes = await freqApiResponse;
```

Do NOT call `isFrequencyChangesMenuVisible()` before the `waitForResponse` setup — opening the dropdown triggers a pre-fetch that races against component mount.

**Note:** Even with this pattern, BUG-01 in `CustomerStore` (`frequencyChangesHistory` missing `@observable`) causes the table to remain empty. Workaround: validate data via API (`api.account.getFrequencyChanges(accountPk)`) in addition to verifying that the table container element is present.

## Tab Panel Scoping — `.tab-pane.active`

When a page uses a tabbed layout where multiple tab panels share the same underlying selectors, all filter panel interactions MUST be scoped to the currently active panel.

**Root cause:** `SELECTORS.elFilterSearch = "input[name='search']"` matches the Origination portal nav bar search field AND the filter panel input. Without scoping, `.fill()` targets the wrong one.

**Pattern:**

```typescript
private getActiveTabPanel(): Locator {
  return this.page.locator('.tab-pane.active');
}

async expandFilters(): Promise<void> {
  const panel = this.getActiveTabPanel();
  const toggleBtn = panel.locator('[data-toggle="collapse"]').first();
  const collapseTarget = panel.locator('.collapse').first();
  const isExpanded = await collapseTarget.evaluate(el => el.classList.contains('show'));
  if (!isExpanded) {
    await toggleBtn.click();
    await collapseTarget.waitFor({ state: 'visible' });
  }
}

private async fillVisibleInput(selector: string, value: string): Promise<void> {
  await this.expandFilters();
  const panel = this.getActiveTabPanel();
  await panel.locator(selector).fill(value);
}

async submitFilters(): Promise<void> {
  const panel = this.getActiveTabPanel();
  await panel.getByRole('button', { name: 'Search' }).click();
  await this.waitForSpinner();
}
```

**`.tab-pane.active` count guarantee:** only ONE tab panel has the `.active` class — `count()` always returns 1. Safe to use without `.first()`.

**Tab activation check:** Prefer `getByRole('tab', { name: '...' })` + `aria-selected` over CSS class inspection:

```typescript
async isSendApplicationTabActive(): Promise<boolean> {
  const tab = this.page.getByRole('tab', { name: 'Send Application' });
  const selected = await tab.getAttribute('aria-selected');
  return selected === 'true';
}
```

## File Download Pattern — `waitForEvent('download')`

Playwright's `waitForEvent('download')` must be set up BEFORE clicking the trigger:

```typescript
// CORRECT — listener registered BEFORE the click
const [download] = await Promise.all([
  page.waitForEvent('download'),
  errorLogPage.clickDownloadCsv(),
]);

const suggestedFilename = download.suggestedFilename();
expect(suggestedFilename).toBe('submit-application-error-log-reports.csv');

// Optional: verify file has content
const stream = await download.createReadStream();
const chunks: Buffer[] = [];
for await (const chunk of stream) {
  chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
}
const content = Buffer.concat(chunks).toString('utf-8');
expect(content.length).toBeGreaterThan(0);
```

**Known filenames (Task #1240):**
- Download CSV on Submit Application tab → `submit-application-error-log-reports.csv`
- Download CSV on Send Application tab → `error-log-reports.csv`

**Rules:**
- Always use `Promise.all([page.waitForEvent('download'), triggerClick()])` — never click first and await after
- For CI, only assert `suggestedFilename` and content length > 0 — avoid asserting specific byte content
- The download event is scoped to the `page` object, not to a locator or frame

**Email CSV modal:** when "Email CSV" opens a modal, assert visibility:

```typescript
await errorLogPage.clickEmailCsv();
expect(await errorLogPage.isEmailCsvModalVisible()).toBe(true);
```

Modal detected via `.modal.show, [role="dialog"]` containing text `email`.

## Sort Indicators in Table Headers

The Origination Leads table includes Unicode sort indicators (`▲`, `▼`, `△`, `▽`, `↑`, `↓`) appended to column headers (e.g., `"Lead # ▲"`).

**Pattern: strip sort indicators before matching:**

```typescript
const headers = await getTableHeaders(page);
const cleanHeaders = headers.map(h => h.replace(/[▲▼△▽↑↓]/g, '').trim());
const colIndex = cleanHeaders.findIndex(h => h === 'Lead #');
```

**Note:** `findFirstMatchingRow()` and `buildRowData()` in `src/helpers/table.helpers.ts` do NOT strip automatically. Perform strip in calling code.

## UI Stability (browser-specific)

- `waitForSpinner()` after navigation
- Polling for e-sign iframe (PandaDocs vs Signwell, 3s × 12)
- Capture toast text before dismiss
- CSS animations disabled via auto-hook
- PayPair OTP: network intercept on `/api/v1/users/send_code` (not IMAP)
- Textareas with `oninput`: use `evaluate()` instead of `fill()`
- PayPair iframe nesting: `#llapp-iframe` → `#pt-iframe`
- **FilterTable backdrop overlay (`filter__menu-portal`):** when a `filter__`-prefixed react-select opens, a transparent portal backdrop renders at body level intercepting all pointer events. Always click options inside it with `{ force: true }`. After reading options, press `Escape` before interacting with other elements. Before clicking Search, press `Escape` + `waitForSpinner()` first.
- **T&C checkbox wait:** `completeTermsAndConditions()` waits up to **90s** for the first checkbox (plans like TireAgent BW13 load insurance iframe before T&C page).
- **Insurance flow auto-detection:** `completeTermsAndConditions()` checks for "See Protection Benefits" button after checking T&C boxes. If found, delegates to `completeProtectionPlan(false)` (opt-out). If not found, proceeds to "PROCEED TO SIGNATURE".
- **Buddy insurance widget retry:** `completeProtectionPlan()` retries up to **5×** with **3s** sleep per attempt (15s total) before clicking a radio button inside Buddy `buddy.insure` iframe. Do NOT remove the retry loop.
- `WebsiteBasePage.changeEmailToGeneric()` skips gracefully when email field is disabled (read-only "paid in full" accounts).
- `PaymentTransactionPage.editAllocationStrategy()` is non-fatal: if no edit icon found, logs and returns.
- **CSS Module BEM class disambiguation:** when `paymentCard__price` partially matches `paymentCard__priceContainer`/`paymentCard__priceLabel`, use `:not()` and `:has()` (e.g., `[class*='paymentCard__price']:not([class*='Container']):not([class*='Label'])`). Task #1233.
- **`stripPlanId(redirectUrl)` pattern:** to force MissingPaymentProgram screen on `/{shortCode}/complete`, remove `planId` query param via `new URL(rawUrl)` + `url.searchParams.delete('planId')`.
- **SEON overlay in sandbox:** `secure-sandbox.uownleasing.com` shows `[data-testid="seon-idv-iframe"]` that intercepts pointer events. Use `ContractPage.dismissSeonOverlay()` which hides via JS. For NEXT buttons blocked by SEON, use `page.evaluate()` JS click as bypass.
- **Settlement toast in `OriginationCustomerPage.settleLease()`** is non-fatal: some envs complete settlement without emitting a toast. Method logs and continues.

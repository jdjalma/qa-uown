<!-- Glossary mapping terms from the legacy Java/Cucumber project to the current TypeScript/Playwright project. -->

# Glossary — Java/Cucumber → TypeScript/Playwright

Mapping of terms from the legacy Java/Cucumber project to the current project (`fintech-playwright`, TypeScript/Playwright).

---

## Structure and Patterns

| Java/Cucumber | TypeScript/Playwright | Notes |
|---------------|----------------------|-------|
| Step Definition | `test.step()` | Logical grouping inside the test |
| Feature file (`.feature`) | Test file (`.spec.ts`) | Gherkin → direct code |
| Scenario | `test()` | One scenario = one test |
| Scenario Outline + Examples | `testData` array + `for...of` | Parameterization via array |
| `@Tag` | `{ tag: '@smoke' }` | Tags in `testData` or `test()` |
| Page Object (Java class) | Page Object (TS class extends BasePage) | Same philosophy, different hierarchy |
| `@FindBy(css = "...")` | `SELECTORS` const + `this.page.locator()` | Centralized selectors, not annotations |
| `WebElement` | `Locator` | Playwright Locator is lazy (no lookup until interaction) |
| `WebDriverWait` | `locator.waitFor()` / `expect(locator).toBeVisible()` | Native Playwright auto-wait |
| `driver.findElement()` | `page.locator()` | Playwright doesn't throw if not found (lazy) |
| `driver.findElements()` | `page.locator().all()` | Returns array of Locators |
| `Thread.sleep(ms)` | `sleep()` from `common.helpers.ts` or polling | Never use `setTimeout` directly |
| `WebDriverFactory` | `browser-factory.ts` | 8 browser profiles |
| `BaseTest` (JUnit) | `base-test.ts` (extended `test`) | Unified fixtures |
| `@Before` / `@After` | `test.beforeEach()` / `test.afterEach()` / auto-hooks | Hooks in `hooks.ts` |
| `Cucumber DataTable` | TypeScript object / interface | Explicit typing |
| RestAssured | `BaseClient` + domain clients | Typed API clients |
| `given().when().then()` (RestAssured) | `client.method()` → `ApiResponse<T>` | Fluent API → response wrapper |

## Test Data

| Java (Constants) | TypeScript | File |
|------------------|-----------|------|
| `CC_SUBSCRIPTION_CARD_NUMBER` | `TEST_CARDS.VALID.DISCOVER` | `src/data/test-cards.ts` |
| `CC_SUBSCRIPTION_CVV` | `TEST_CARDS.VALID.DISCOVER.cvc` | `src/data/test-cards.ts` |
| `CC_SUBSCRIPTION_EXPIRATION_DATE` | `TEST_CARDS.VALID.DISCOVER.expiry` | `src/data/test-cards.ts` |
| `BANK_ROUTING_NUMBER` | `BANK_DATA.routingNumber` | `src/config/constants.ts` |
| `BANK_ACCOUNT_NUMBER` | `BANK_DATA.accountNumber` | `src/config/constants.ts` |
| `generateSSN()` | `generateSSN()` | `src/config/constants.ts` |
| `generatePhone()` | `generatePhone()` | `src/config/constants.ts` |
| `generateEmail()` | `generateUniqueEmail()` | `src/config/constants.ts` |

## Underwriting Routing

| Java Concept | TypeScript / Test Concept | Notes |
|--------------|--------------------------|-------|
| `planId` (String) | `planId: string` | Format: frequency abbreviation + term months (e.g., `WK13`, `BWK16`) |
| `SchedSummaryInfo.planId` | Response field `planId` | Added to schedule summary; used to identify payment option |
| `PaymentFrequency.abbreviation()` | Frequency enum abbreviation | WK (WEEKLY), BWK (BI_WEEKLY), SM (SEMI_MONTHLY), MN (MONTHLY) |
| `buildScheduleForFrequency()` | Calculator service method | Now generates `planId` = abbreviation + termMonths |
| `setMerchantProgramForLead()` | Removed/commented out | Programs are pre-selected, not assigned during UW |
| BIN eligibility check | Credit card BIN (first 6 digits) | Determines Kornerstone vs UOWN routing |
| Kornerstone flow (UW routing) | Routing path when banking + BIN eligible | Evaluates 16-month program first, fallback to 13-month |
| UOWN flow (UW routing) | Routing path otherwise | 13-month program only |

## Statuses and Flows

| Java (enum/string) | TypeScript | Notes |
|--------------------|-----------|-------|
| `UW_APPROVED` | `'UW_APPROVED'` | String literal (not enum) |
| `CONTRACT_CREATED` | `'CONTRACT_CREATED'` | Same |
| `SIGNED` | `'SIGNED'` | Via e-sign (PandaDocs or Signwell) |
| `FUNDED` | `'FUNDED'` | Final state of the main flow |
| `submitApplication()` | `sendApplication()` | Name changed during migration |
| `getDocumentStatus()` | `getDocumentStatus()` | Kept |
| `LosLeadShortCode` (entity) | `uown_los_lead_short_code` (table) | New entity — short_code migrated from uown_los_lead (V20260226100000) |
| `LeadShortCodeRepo` | DB query on `uown_los_lead_short_code` | FK: lead_pk → uown_los_lead.pk |

## Environments

| Java (properties) | TypeScript (env) | File |
|-------------------|-----------------|------|
| `application-sandbox.properties` | `.env.sandbox` | Project root |
| `base.url.origination` | `ORIGINATION_URL` | `.env.*` |
| `db.host` / `db.port` | `DB_HOST` / `DB_PORT` | `.env.*` |
| `ConfigFactory.load()` | `TestConfig.getInstance()` | `src/support/config.ts` |

## Assertions

| Java (Hamcrest/JUnit) | TypeScript (Playwright) | Notes |
|-----------------------|------------------------|-------|
| `assertThat(x, is(y))` | `expect(x).toBe(y)` | Playwright expect |
| `assertThat(x, containsString(y))` | `expect(x).toContain(y)` | Same |
| `assertTrue(element.isDisplayed())` | `await expect(locator).toBeVisible()` | Native auto-retry |
| `assertEquals(expected, actual)` | `expect(actual).toBe(expected)` | Argument order reversed |
| `assertThat(list, hasSize(n))` | `expect(list).toHaveLength(n)` | Same |
| `waitUntil(() -> condition)` | `pollUntil(() => condition)` | `database.helpers.ts` |

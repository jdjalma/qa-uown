---
name: selector-hardening
description: Load when creating/refactoring a page object, debugging a TimeoutError in a locator, or auditing selectors. Applies the hierarchy role > label > testId > id > attr > sibling > class; centralizes in src/selectors/common.selectors.ts; forbids XPath and nth-child.
disable-model-invocation: true
---

# Selector Hardening

## Principles

1. **Page object FIRST** — before writing ANY inline `page.locator(...)` / `page.getByRole(...)` / `page.getByText(...)` in a spec, look in the portal's page object (`src/pages/{portal}/`) for a method that already covers that element/action. A locator in a spec that duplicates an existing page object method is a **violation**, not a style choice. See the dedicated rule below.
2. **Co-locate or centralize (not inline in the spec)** — a page-owned selector lives CO-LOCATED in the page object (semantic `readonly` getter) or in `SELECTORS`; a cross-cutting selector (≥2 pages) goes to `src/selectors/common.selectors.ts` (the `AppSelectors` type is derived from the object and updates itself). The action (click + wait + retry) lives in the page object; the spec only orchestrates — **never** defines a locator inline.
3. **Semantic first** — `getByRole`, `getByLabel`, `getByTestId` before CSS.
4. **DOM-first** (inviolable rule #15) — inspect the real DOM via MCP Playwright **before** proposing a new selector or changing a broken one.
5. **No XPath**, no positional `nth-child`.

## Rule — check the page object BEFORE writing an inline locator in the spec (anti-duplication)

The most common DRY mistake in the project's specs: re-deriving in the `.spec.ts` a locator (and the surrounding click/retry logic) that **already exists** as a page object method. This spreads the same selector across N specs — when the DOM changes, N files break instead of 1.

**Mandatory protocol before typing `page.locator(...)`/`page.getByRole(...)`/`page.getByText(...)` in a spec:**

1. Identify the element's portal (Origination / Servicing / Website / AMS).
2. `Grep` the corresponding page object (`src/pages/{portal}/`) for the element's text/role/accessible name.
3. **If a method already exists** → call the method. Do NOT re-derive the locator.
4. **If it does NOT exist but the element belongs to an area covered by a page object** → add the method to that page object (selector in `common.selectors.ts`), and the spec calls the method.
5. **Only create an inline locator in the spec** if it is genuinely ephemeral and specific to that single test (extremely rare — and even then, prefer `common.selectors.ts`).

```ts
// ❌ Locator + retry loop inline in the spec — duplicated across 6 specs (Get Document Status)
const btn = page.locator("xpath=//*[text()='Get Document Status']");
for (let i = 0; i < 3; i++) { await btn.click(); await page.waitForTimeout(2000); /* ... */ }

// ✅ Action encapsulated in the page object; the spec just orchestrates
await contractPage.clickGetDocumentStatus();
```

**How to detect (audit):** `grep -rn "page.locator\|page.getBy" tests/` → for each hit, does the same text/role appear in a method of `src/pages/`? If so, it's duplication to refactor. Origin: DRY audit 2026-06-23 — "Get Document Status" and `sideBarContainer__item` duplicated inline across up to 6 specs even though they already exist (or belong) in page objects.

## Priority hierarchy

| # | Locator | When to use |
|---|---------|-------------|
| 1 | `page.getByRole('button', { name: 'Submit' })` | Default — semantic, resistant to DOM refactor |
| 2 | `page.getByLabel('Email')` | Form fields with `<label for>` |
| 3 | `page.getByTestId('submit-btn')` | If the dev collaborated and added `data-testid` |
| 4 | `page.locator('#specific-id')` | Stable ID (rare in modern SPAs) |
| 5 | `page.locator('[data-field="status"]')` | Custom data attribute |
| 6 | `page.locator('label:has-text("Merchant") ~ div')` | CSS sibling — last semantic resort |
| 7 | Class selectors | When nothing above works — tech-debt flag |

## DOM-first protocol (mandatory BEFORE touching a selector)

When a test fails with `TimeoutError`, `not visible`, `0 elements`, `strict mode violation`:

1. **Do NOT increase the timeout, do NOT add a retry, do NOT use `force: true`.**
2. Open the real portal via `mcp__playwright__browser_navigate`.
3. Authenticate in the appropriate flow.
4. **Fix the viewport ≥ 1440×900** (Bootstrap uses `d-lg-block`, which hides elements in a smaller viewport).
5. `mcp__playwright__browser_snapshot` for the accessible tree.
6. `mcp__playwright__browser_evaluate` to extract:
 - `tagName`
 - the real `role` (computed)
 - `accessible name`
 - `visible` (offsetParent !== null + display !== none)
 - ancestor chain (up to `<body>` or the relevant container)
7. Build a **Real DOM vs Current Selector** table:

 | Aspect | Current selector | Real DOM | Match? |
 |---------|----------------|----------|--------|
 | tagName | `button` | `a` | ❌ |
 | role | `button` | `link` | ❌ |
 | name | "Items Purchased" | "Items Purchased " (trailing space) | ⚠️ |

8. **Only now** propose a precise fix.

Full detail: skill [[dom-investigation]].

## Rule — buttons whose text is a substring of another: use an anchored regex

When two or more buttons on the same page have labels where one is a substring of the other (e.g., `"E-Sign"` and `"Change to Signed"`), `getByRole('button', { name: 'Sign' })` or `locator('button:has-text("Sign")')` matches both and Playwright throws a `strict mode violation`.

**Mandatory fix:** use an anchored regex with `^...$`:

```ts
// ❌ Strict mode violation — "Sign" is a substring of "Change to Signed"
page.locator('button:has-text("Sign")')
page.getByRole('button', { name: 'Sign' })

// ✅ Anchored regex — matches only the exact button
page.getByRole('button', { name: /^E[-\s]?Sign$/i })
```

**How to detect:** the error `strict mode violation: locator resolved to N elements` where N > 1. Investigate via `mcp__playwright__browser_snapshot` to list all the buttons on the page.

**Origin:** F-005-leftover (2026-05-24) — `signContractButton` in `OriginationCustomerPage` collided with the status button `"Change to Signed"`. See [[application-lifecycle]] pitfall #67.

## Rule — buttons that SHARE the same class: disambiguate by unique text, never `.first()`

When two buttons on the same page are rendered by the SAME component and share the CSS class (e.g., `filtered-csv-download_csvButton` for Email CSV AND Download CSV), a bare class selector + `.first()` matches the FIRST in the DOM — which may NOT be the one you want.

**Canonical case (2026-06-18, MCP in QA2):** Email CSV and Download CSV share `filtered-csv-download_csvButton`; **Email CSV is first in the DOM**. A selector `button[class*='filtered-csv-download_csvButton']` + `.first()` resolves to Email CSV → a "download" click opens the email modal (silent symptom: the download test passes through the wrong path).

```ts
// ❌ Resolves to Email CSV (first in the DOM) — clicks the wrong button
page.locator("button[class*='filtered-csv-download_csvButton']").first()

// ✅ Disambiguate by the unique text of the target button
csvDownloadButton: "button[class*='filtered-csv-download_csvButton']:has-text('Download CSV')",
```

**How to detect:** `browser_evaluate` listing all elements with the shared class → if N > 1, disambiguate with `:has-text(...)`, `getByRole({ name })`, or a unique attribute. See [[application-lifecycle]] pitfall #117 and [[page-object-pattern]] FilteredCsvDownloadControls.

## Rule — button disabled via CSS (`pointer-events:none` + class), NOT via the `disabled` attribute: `isEnabled()` lies

Playwright's `locator.isEnabled()` checks only the HTML `disabled`/`aria-disabled` attribute. A button disabled **only** by CSS (class `disabledButton` + `pointer-events: none`, with the `disabled` attribute ABSENT) is reported as ENABLED by `isEnabled()` → the test tries to click, the click is intercepted by the parent `<div>` (pointer-events) and throws `TimeoutError` "element intercepts pointer events" / "not clickable".

**Mandatory fix:** do not trust `isEnabled()` for these buttons. Check the presence of the disabled-class via a dedicated selector and return `false` if it is visible.

```ts
// ❌ Email CSV is disabled by CSS (disabledButton + pointer-events:none), WITHOUT the disabled attribute
//    isEnabled() returns ALWAYS true → click intercept → timeout
const enabled = await btn.isEnabled();

// ✅ check the disabled-class directly
csvEmailButtonDisabled: "button[class*='disabledButton']:has-text('Email CSV')",
async isEmailCsvEnabled() {
  const cssDisabled = await page.locator(SELECTORS.csvEmailButtonDisabled).first()
    .isVisible().catch(() => false);
  return !cssDisabled;
}
```

**Canonical case (2026-06-18, qa2 — Funding Queue Email CSV):** the Email CSV button on `/funding` is disabled on an empty table via the class `disabledButton` + `pointer-events:none`, WITHOUT the `disabled` attribute. `isEnabled()` returned `true`, the test tried to click, and the click was intercepted by the parent div → timeout. Fix in `src/pages/origination/filtered-csv-download.controls.ts` (`isEmailCsvEnabled`) using `SELECTORS.csvEmailButtonDisabled`.

**How to detect:** `TimeoutError` "intercepts pointer events" when clicking a button that `isEnabled()` swore was enabled. Confirm via `browser_evaluate` that the element does NOT have `disabled` in the DOM but has `getComputedStyle(el).pointerEvents === 'none'` (or the class `disabledButton`). See [[page-object-pattern]] `FilteredCsvDownloadControls`.

## Rule — multiple forms with identical inputs on the same page: target by id, never by position

When a screen has TWO forms with fields of the same type/placeholder (e.g., Overview has a KPI form at the top and a table form below, BOTH with MM/DD/YYYY date inputs), a positional selector (`nth()`) is fragile and tends to match the wrong form.

**Canonical case (2026-06-18):** the Overview top-bar KPI form uses ids `#from`/`#to` (toggle `overview_filterButton__`, drives metric cards) vs. the table panel `#fromDate`/`#toDate` (toggle `index-module_filterButton__`, drives table + CSV). A positional `nth()` hits the KPI form. Target the table panel inputs by id and expand via the panel's own toggle. See [[application-lifecycle]] pitfall #114.

## Rule — two "similar" confirmation modals on the SAME page: don't reuse one's confirm selector for the other

When a screen has TWO actions that open visually similar confirmation modals (e.g., "Set to Expired" and "Change to Signed" in the customer page's summary bar), it's tempting to reuse a single confirm-button selector for both. The modals diverge in the DOM: the button label, the class, and the comment field's requiredness can differ. A selector that matches one modal returns **0 elements** in the other — and if the visibility wait has `.catch(() => false)`, the failure disappears and the method returns WITHOUT clicking (the action never fires, a silent symptom).

**Canonical case (#1315, 2026-06-18, live DOM qa2 lead 16728):**

| Aspect | `Set to Expired` | `Change to Signed` |
|---------|------------------|--------------------|
| Modal | "Add a Comment" (`.modal.fade.show`) | "Move Contract to Signed" |
| Comment | OPTIONAL (`input[name='comment']`, "Type here...") | REQUIRED ("Add a comment (required)") |
| Confirm button | **"Save"** (`button[type='submit']`, WITHOUT `.submit-button`) | **"CONFIRM"** (`button.submit-button`) |

```ts
// ❌ Reusing the CONFIRM/.submit-button selector on "Set to Expired" → 0 elements → silent no-op
setToExpiredConfirm: "button.submit-button, button:has-text('CONFIRM')",

// ✅ Anchor each modal on its own real button
setToExpiredConfirm: "[role='dialog'] button[type='submit'], .modal.show button[type='submit'], [role='dialog'] button:has-text('Save'), .modal.show button:has-text('Save')",
```

**How to detect:** the method "passes" but the state doesn't transition (status doesn't change, the `changeLeadStatus` XHR never fires). Removing the `.catch` swallow from the confirm's visibility wait makes the real failure appear. Inspect BOTH modals via `browser_snapshot` — don't assume they are the same. See [[application-lifecycle]] pitfall #124 and [[page-object-pattern]] OriginationCustomerPage status-action modals.

## Rule — `controlByLabel` with identical-prefix labels: anchor on the label's PARENT, NEVER `starts-with` + ancestor walk

When a page object resolves a control by an XPath anchored on the adjacent `<label>`, using `starts-with(normalize-space(.), 'X')` + an *ancestor walk* (`ancestor-or-self::*[.//*[contains(@class,'filter__control')]][1]`), it breaks silently on a page with **>2 react-select filters AND labels that share a prefix** (e.g., `"Merchant"` and `"Merchant Ref Code"`). `starts-with(...,'Merchant')` matches BOTH labels. For the "wrong" label (e.g., "Merchant Ref Code", which is a text input and does NOT have `filter__control`), the ancestor walk climbs up to the root container of the filter row — which contains ALL the `filter__control` elements — and returns the FIRST control in the DOM (not the target). Silent symptom: `getMerchantSelectedCount()` always returns 0; `filterByMerchants()` opens the wrong dropdown (the first filter in the row).

**Canonical case (2026-06-19, MCP in qa2 — MMH):** the Merchant Modification History has 7 filters in the same container row (Log Type, Start/End Date, Merchant Ref Code, Merchant, Location, User Name). "Merchant Ref Code" appears BEFORE "Merchant" in the DOM. The ancestor walk starting from "Merchant Ref Code" returned Log Type (the first `filter__control` of the root container).

```ts
// ❌ starts-with + ancestor walk — matches "Merchant" AND "Merchant Ref Code";
//    for the wrong label the walk climbs to the root container → returns Log Type
`.//label[starts-with(normalize-space(.),'${label}')]` +
`/ancestor-or-self::*[.//*[contains(@class,'filter__control')]][1]//*[contains(@class,'filter__control')]`

// ✅ direct parent of the label — each label lives in a <div class="w-100"> that
//    contains EXACTLY that filter's control; unambiguous scope even
//    with a shared prefix
`.//label[starts-with(normalize-space(.),'${label}')]/..//*[contains(@class,'filter__control')]`
```

**How to detect:** the filter "passes" but the selected count is always 0, OR the dropdown that opens belongs to another filter. List all the filter row's labels via `browser_evaluate` → if two share a prefix (`startsWith`), the `starts-with`-based `controlByLabel` is compromised. Fix: swap the ancestor walk for `..` (direct parent of the label). See [[application-lifecycle]] and [[page-object-pattern]] `MerchantLocationFilterPO`.

## Rule — React-controlled input (Formik): `fill()` is a silent no-op, use the native-setter

Inputs whose `value` is controlled by React/Formik (the component rewrites the value on each render) do **not** accept `page.fill()` — the call seems to pass but React overwrites the value on the next render, and the app's `onChange` never fires with the typed value. Symptom: the filter/field appears filled for an instant but the search runs with the field empty (or with the old value), without an error.

**Mandatory fix:** set via the prototype's **native value setter** + dispatch the synthetic events that React listens for:

```ts
await page.evaluate(([sel, val]) => {
  const input = document.querySelector(sel) as HTMLInputElement | null;
  if (!input) return;
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype, 'value',
  )?.set;
  setter?.call(input, val);
  input.dispatchEvent(new Event('input',  { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  input.dispatchEvent(new Event('blur',   { bubbles: true }));
}, [selector, value] as const);
```

**Confirmed canonical cases (DOM-first):**
- `SearchPage` quick-search `#search-input` (`forceReactInputValue` / `searchByType`).
- **`ModificationReportPage` (#1315, LIVE qa2 2026-06-18):** the filters panel exposes `input#agentName` (free text) and TWO dates `input#from` / `input#to` (`MM/DD/YYYY`), **all React-controlled**. `fill()` on any of them is a no-op; the search runs without a filter. `filterByAgentName` / `filterByDateRange` use the native-setter via the page object's private `forceReactInputValue`. React calendar dates (`input#from`/`input#to`) are the most treacherous case — visually the value "appears", but the range is never applied.

**How to detect:** the test filters and the table comes back with the full set (filter ignored) or empty (old value) — without `TimeoutError`. Confirm via `browser_evaluate` that the input has a React fiber (`__reactProps$`/`__reactFiber$`) and that `value` reverts after `fill`. See [[page-object-pattern]] anti-pattern `page.fill on React-controlled inputs` + the catalog `ModificationReportPage` / `SearchPage`.

## Historical case (2026-05-11)

`unified-flow.spec.ts` "Items Purchased" — `TimeoutError`. The initial investigation assumed timing; the proposed fix was to increase the timeout. **Real cause**: the element was an `<a>` (link), not a `<button>`. `getByRole('button', { name: 'Items Purchased' })` would never match.

Time spent investigating timing: ~hours.
Time spent via MCP DOM inspection: 10 minutes.
**Lesson**: timing is a late hypothesis, not the first one.

## Adding a new selector

1. Validate via MCP (step above)
2. Add it to the `SELECTORS` object in `src/selectors/common.selectors.ts`
3. Use it as `SELECTORS.myNewSelector` in the page object
4. Never inline the string in the test

## Common types

```ts
// src/selectors/common.selectors.ts
export const SELECTORS = {
 submitButton: (page) => page.getByRole('button', { name: 'Submit' }),
 merchantBadge: (page) => page.getByLabel('Merchant').locator('~ div'),
 signingIframe: (page) => page.frameLocator('iframe[name="gowsign"]'),
};
```

## Audit (replaces the old subagent-audit)

When loaded in "audit" mode: it sweeps `src/selectors/`, `src/pages/`, `tests/` and classifies:

- **Critical**: XPath, `nth-child`, inline in tests
- **Improve**: class-based where role/label would be possible
- **OK**: semantic, centralized
- **Dead**: keys in SELECTORS with no reference

Output of the agent that loads this skill in audit mode: top-N quick wins + list of dead keys.

## Anti-patterns

- ❌ `try/catch` with a selector fallback — masks the bug
- ❌ Increasing the timeout before investigating the DOM
- ❌ `force: true` to click — disguises that the element is not truly clickable (a11y broken)
- ❌ XPath, even "just this once"
- ❌ Inline selector in a test — breaks centralization

## Cross-links

- Inviolable rule #15 in `CLAUDE.md`
- Skill [[dom-investigation]] — full MCP protocol
- Skill [[page-object-pattern]] — where the selectors are consumed
- Source: `src/selectors/common.selectors.ts`

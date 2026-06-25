---
name: dom-investigation
description: Load at the first sign of a TimeoutError, locator not visible/found, or strict mode violation. FORBIDDEN to increase the timeout, add a retry, or use force:true before inspecting the real DOM via mcp__playwright__browser_* — viewport >=1440x900, snapshot, evaluate.
disable-model-invocation: true
---

# DOM Investigation Protocol — UOWN Leasing

> **Authority boundary** (`docs/_docs-conventions.md` §7): this skill covers **HOW TO INSPECT** — DOM protocol, viewport selection, snapshot commands, root-cause table. The **per-portal viewport rules** and the **canonical portal list** originate from CLAUDE.md Rule #15 + `docs/business-rules/01-fundamentos.md` (portal naming, volatile — in [[volatile-knowledge-registry]]). **Do not duplicate viewport rules here** — they drift.

> **Purpose:** when a selector fails (`TimeoutError`, `not visible`, `not found`, `strict mode violation`), inspect the portal's real DOM via **MCP Playwright** BEFORE proposing a fix. Heuristics (increasing the timeout, adding a retry, `force: true`, `waitForTimeout`) are FORBIDDEN as a first resort — they mask the real cause and perpetuate tech-debt in the page object.
>
> **Applies to:** `qa-debugger`, `qa-implementer`, `qa-implementer`, and Claude's direct analyses. **Not optional.**
>
> **Why this file exists:** on 2026-05-11, a test failed with `getByRole('menuitem', { name: 'Items Purchased' })` timeout. The initial hypothesis was timing/retry. Inspection via MCP revealed that the parent "History" dropdown was `<a role="link">`, not `<button>`, and the page object was looking for `getByRole('button', { name: /History/i })`. Wrong selector, not timing. Increasing the timeout would have masked the bug for more releases. Investigating the real DOM in 5 minutes resolved it definitively.

---

## Triggers (when to apply)

Apply this protocol IF the error matches ANY of these patterns:

- `TimeoutError: locator.waitFor` or `locator.click` on a UI element
- `Element is not visible` / `not attached` / `not enabled`
- `strict mode violation: locator resolved to N elements`
- `getByRole(...)` / `getByLabel(...)` / `getByText(...)` returning 0 results
- Page object with a fallback that drops to a CSS selector (a sign the primary one broke)
- Intermittent failure where the element "appears in some runs" (suspect: responsive breakpoint, hidden ancestor)

Do NOT apply for:
- API errors (`response.status`, network)
- DB errors (query, schema mismatch)
- TypeScript errors (`tsc --noEmit`)

---

## Required inputs (gather BEFORE opening MCP)

1. **Exact portal URL** (with env: origination-sandbox, svc-website-qa1, etc.)
2. **Reproducible identifier** — `leadPk`, `accountPk`, or `shortCode` that reproduces the bug screen
3. **Credentials** — read from `.env`. For Servicing: `DEFAULT_MANAGER_USERNAME`/`DEFAULT_MANAGER_PASSWORD` (the old `superadmin` NO LONGER exists in sandbox)
4. **Selector that failed** — literal quote of the page object/test line (e.g. `src/pages/servicing/servicing-base.page.ts:75`)
5. **HTML expected by the selector** — if the user pasted the element's real HTML in the conversation, use that as truth

---

## Protocol (mandatory steps, in order)

### Step 0 — Load MCP tools

The Playwright MCP tools are **deferred**. Before calling, load them with `ToolSearch`:

```
select:mcp__playwright__browser_navigate,mcp__playwright__browser_snapshot,mcp__playwright__browser_click,mcp__playwright__browser_evaluate,mcp__playwright__browser_wait_for,mcp__playwright__browser_close,mcp__playwright__browser_fill_form,mcp__playwright__browser_resize,mcp__playwright__browser_console_messages
```

### Step 1 — Navigate and authenticate

```
browser_navigate → target URL
(if it redirected to /login)
 browser_snapshot → identify login fields
 browser_fill_form → fill username/password from .env
 browser_click → LOG IN
 → CAPTURE the status of the XHR POST /login (browser_network_requests)
```

> **Auth heuristic (BEFORE blaming the selector):** if the page landed on a login screen (e.g. "Merchant Login", title `Uown | Merchant`) and the input you are looking for "does not exist", the probable cause is **rejected authentication, not the DOM**. Capture the status of `POST origination-{env}/login`: **423 = agent account LOCKED** (env issue) — it is NOT a selector mismatch, and increasing the timeout/retry will not resolve it. Cross-check by logging in with a 2nd agent account (`supervisor` → 200 on the same host confirms the portal is healthy and only the account is locked). Unblock = unlock the account in the agent auth service + verify the `.env` password (a stale one re-locks it). The lock is NOT in the svc DB. Origin: F-001 stg 2026-06-22. Cross-link: [[application-lifecycle]] #137, [[volatile-knowledge-registry]] §6.

### Step 2 — Set the viewport per portal

Viewport depends on the portal under test. Investigating in the wrong viewport produces a wrong diagnosis.

| Portal | Viewports to inspect | Why |
|--------|------------------------|---------|
| Origination / Servicing / AMS (internal portals — agents) | `1440×900` (single) | Accessed by agents on desktop; Bootstrap `d-lg-block` (≥992px) covers all |
| Website (customer portal — end customer) | `375×667` → `768×1024` → `1440×900` (in sequence) | The customer flow is mobile-heavy (OTP, signing, application form on a phone); a bug that only appears at 375px is a silent regression if we never inspect there |

```
browser_resize({ width: 1440, height: 900 }) // always first

// For Website, after the snapshot at 1440, repeat at:
browser_resize({ width: 768, height: 1024 }) // tablet
browser_resize({ width: 375, height: 667 }) // mobile
```

> **Why 1440×900 for internal portals:** Bootstrap uses `d-lg-block` (breakpoint ≥992px). At smaller viewports, top navbar elements collapse into a hamburger menu (`display: none`). 1440x900 is the size used by the real suite in local headed mode.
>
> **Why 3 viewports for Website:** OTP login, signing flow, customer portal navigation are accessed mostly on mobile/tablet. A mobile-only bug in a customer flow is a silent regression when we only inspect 1440. Multi-viewport investigation does not duplicate effort — it investigates once with the viewport the real user uses.
>
> **When unsure which portal:** if the URL contains `/customer-portal`, `/website-portal`, or a subdomain `customer.*`/`website.*` → treat it as Website. When in doubt, inspect at 375 as well (low cost, avoids a false "no bug").

### Step 3 — Initial snapshot

```
browser_snapshot → identify the refs (e123, e456) of the target element
```

The YAML snapshot is better than a screenshot — it shows `role`, `name`, `[active]`, `[expanded]`, `[disabled]`, hierarchy. It captures the accessible tree, not pixels.

### Step 4 — Forensic inspection of the element

Use `browser_evaluate` to extract everything the selector sees:

```js
 => {
 // Replace the pattern according to the element being searched for
 const candidates = Array.from(document.querySelectorAll('button, a, [role="button"], [role="link"], [role="menuitem"]'))
 .filter(el => /TEXTO_DO_ELEMENTO/i.test(el.textContent || ''));
 return candidates.map(el => ({
 tag: el.tagName, // <— BUTTON vs A
 role: el.getAttribute('role'), // <— null vs "button" vs "link"
 text: (el.textContent || '').trim.slice(0, 60),
 classes: el.className.toString.slice(0, 80),
 visible: el.offsetParent !== null,
 ariaExpanded: el.getAttribute('aria-expanded'),
 ariaHidden: el.getAttribute('aria-hidden'),
 rect: el.getBoundingClientRect,
 }));
}
```

If `visible: false`, do a second evaluate to walk up the ancestor chain and find who is hiding it:

```js
 => {
 const el = /* same selector */;
 let parent = el.parentElement;
 const chain = [];
 while (parent && chain.length < 6) {
 const cs = getComputedStyle(parent);
 chain.push({
 tag: parent.tagName,
 classes: parent.className.toString.slice(0, 60),
 display: cs.display, // <— "none" = culprit
 visibility: cs.visibility,
 width: parent.offsetWidth,
 });
 parent = parent.parentElement;
 }
 return chain;
}
```

### Step 5 — "Real DOM vs Current Selector" table

Before proposing any fix, **write this table** in the report/conversation:

| Attribute | What the selector expects | What the DOM has | Match? |
|----------|------------------------|------------------|--------|
| `tagName` | (e.g. BUTTON) | (e.g. A) | ❌ |
| `role` | (e.g. button) | (e.g. link / null) | ❌ |
| `accessible name` | "History" | "History" | ✅ |
| `visible` | true | false (ancestor `display:none`) | ❌ |
| `aria-expanded` | (n/a) | "false" | ⚠️ dropdown closed |

If ≥ 1 row has a ❌, the selector is wrong. Cite the page object line and propose a precise fix.

### Step 6 — Validate the fix via MCP before editing

Before touching the page object, **prove via MCP** that the new selector works:

```
browser_click(target: <snapshot ref>) → the action happens
browser_snapshot → confirms the post-click state (dropdown open, navigation, etc.)
```

### Step 7 — Apply the fix in the code

Only now edit `src/pages/{portal}/{file}.page.ts` or `src/selectors/common.selectors.ts`. Include the result of steps 5 and 6 as justification in the commit/PR description.

### Step 8 — Close the browser

```
browser_close
```

---

## Fallback chain (when MCP is not available)

If the portal is not accessible (CI without network, environment down, credentials unavailable):

1. **Trace + screenshot** in `reports/test-results/{test}/` — read `error-context.md`, open `test-failed-1.png`, examine `trace.zip` via `npx playwright show-trace`
2. **HTML pasted by the user** — if the user copied the element's outerHTML, use it as absolute truth (steps 1–4 may be skipped, but do step 5)
3. **Git blame on the portal repo** — if applicable and available in `.claude/context/app-repos.md`, read the React/Angular component to discover the real tag/role
4. **NEVER** adjust the timeout or add a retry without having done at least one of these 3

If no fallback is viable → mark it as `INVESTIGAR` in the report and stop. **Do NOT invent a fix.**

---

## Anti-patterns (FORBIDDEN)

- ❌ Increasing the timeout without investigating the DOM (`timeout: 30_000` "to be safe")
- ❌ Adding a retry loop / `for (let attempt = 1; attempt <= 3; ...)` in the page object
- ❌ Using `force: true` to work around `not clickable`
- ❌ Adding `page.waitForTimeout(N)` anywhere
- ❌ Swapping `getByRole` for XPath to "make it work" without understanding why
- ❌ Marking a test as `test.skip` or `@flaky` without having run the protocol
- ❌ Proposing a fix without the step 5 table

---

## Case study — 2026-05-11 (`unified-flow.spec.ts` "Items Purchased")

**Symptom:** `TimeoutError: locator.waitFor` on `getByRole('menuitem', { name: 'Items Purchased' })` (5s).

**Initial hypothesis (wrong):** timing/race condition in opening/closing the dropdown between iterations.

**Step 1–2 (MCP):** login at `svc-website-sandbox.uownleasing.com` with `manager`/`P@ssw0rdu0wn`. Viewport 1440x900 (at 906px the `d-lg-block` hid the navbar).

**Step 4 (evaluate):**

```json
[
 { "tag": "A", "text": "History", "role": null, "classes": "dropdown-toggle nav-link", "visible": true },
 { "tag": "BUTTON", "text": "Items Purchased", "role": "menuitem", "visible": false }
]
```

**Step 5 (table):**

| Attribute | Selector expects | DOM has | Match? |
|----------|-----------------|---------|--------|
| trigger `tag` | BUTTON | A | ❌ |
| trigger `role` | button | null (anchor) | ❌ |
| does `getByRole('button', /History/i)` match? | yes | no | ❌ |

**Root cause:** `servicing-base.page.ts:75` used `getByRole('button', { name: /History/i })` but the portal renders `<a class="dropdown-toggle nav-link">`. `isVisible` returned false → the fallback `historyDropdown.click` clicked the parent `<li>`, which did not trigger the React handler of the child `<a>` → the dropdown never opened → the menuitem never rendered.

**Step 6 (validate):** `getByRole('link', { name: /^History$/i }).click` → `aria-expanded="true"`, 9 visible menuitems. `getByRole('menuitem', { name: 'Items Purchased' }).click` → navigated to `/items-history/17127`. ✓

**Fix applied:**
```ts
// servicing-base.page.ts
readonly servicingDropdown = this.page.getByRole('link', { name: /^Servicing$/i }).first;
readonly historyDropdown = this.page.getByRole('link', { name: /^History$/i }).first;
// topMenuNavigateTo: removed the try/fallback that masked the bug
```

Total time: ~10 minutes. No retry, no heuristic, no `force: true`.

---

## Pitfall — MCP-live validation does NOT guarantee a runtime pass

**Symptom:** a selector works when tested via `mcp__playwright__browser_evaluate` (returns elements, click flips state), but fails with 0 matches at runtime of the Playwright test executed minutes or hours later, in the same environment.

**Canonical case (6th pass, 2026-05-22):** `[class*="customOptionStyles"]` returned 2 elements at 13:13 UTC via MCP. The test runtime at 14:18 UTC in the same qa1: `row.waitFor({ state: 'visible', timeout: 5_000 })` → timeout, 0 matches. The a11y snapshot confirms the combobox was open and the options visible — but the DOM classes diverged.

**Possible causes (in order of probability):**
1. **FE build drift:** CSS-Module hashes and even prefixes change when webpack reprocesses the bundle (redeploy, hot-reload in dev, bundle cache invalidation). The `customOptionStyles` prefix may become `customOption`, `filterOption`, or any output depending on the webpack module ID.
2. **React-select portal visibility:** options mounted in a portal (`menuPortalTarget={document.body}`) may exist in the a11y tree but be considered off-screen by Playwright (`state: 'visible'` requires that no ancestor has `visibility:hidden` / `display:none` / `opacity:0`). MCP `browser_snapshot` reports the a11y tree, not computed visibility — it may show an option as "present" when Playwright considers it "not visible".
3. **Event-sequence timing:** MCP executes clicks with different timing from the test runner. The menu may close between the "open" step and the "click option" step when driven via MCP vs. when driven via `page.click` in the test context.

**Fix / practical rule:**
- MCP-live validation = a mandatory step (rule #15) but NOT sufficient on its own.
- After validating via MCP, run the full test ≥ 2x before declaring the selector stable.
- For selectors that depend on CSS-Module classes or portals: prefer a keyboard contract or framework-generated IDs that are immune to build drift and portal visibility. See [[application-lifecycle]] pitfall #47 and #50.

**Detection:** if `browser_evaluate` returns N > 0 but the test fails with 0 matches: immediately suspect build drift (run `document.querySelectorAll('[class*="prefixOriginal"]').length` live in the test runtime via `page.evaluate`) or portal visibility (check whether the element has `el.offsetParent !== null`). <!-- discovered in the 6th pass, 2026-05-22 -->

---

## Pitfall — Headless reports a redirect; the user reports a form (session/cache/cookie divergence)

**Symptom:** headless investigation via MCP or `npx playwright test` reports behavior X (e.g. redirect to find-a-merchant), but the user confirms behavior Y (e.g. the form renders normally) when opening it in a real browser's incognito tab.

**Root cause:** a headless browser does not load cookies/session/service-worker/cache from the user's personal browser. Behaviors that depend on session state (e.g. implicit authentication, tenant cookie, service-worker cache, CDN edge cache by IP/region) diverge between a clean headless and a real authenticated browser — especially on customer routes that do a conditional redirect.

**Fix / mandatory verification:** whenever the behavior depends on session state, cookies, or browser cache:
1. Confirm in an incognito tab (clean, no extensions, no cookies) before classifying it as expected behavior or a bug.
2. If incognito + headless agree but differ from the user's normal browser → the cause is the user's session/cookie/cache, not an application bug.
3. If incognito + headless diverge → investigate state-dependent factors (service-worker, CDN, edge environment).

**Applies to:** conditional redirect tests, routes with implicit authentication, SPAs with a service-worker. <!-- discovered on 2026-05-20 -->

---

## Mandatory output in the report

Every invocation that applied this protocol MUST include:

```markdown
## DOM Investigation (MCP Playwright)
- Inspected URL: <url>
- Reproducible identifier: <leadPk/accountPk/shortCode>
- Viewport: <width>x<height>
- Snapshot ref of the element: <e123>

### Real DOM vs Selector
| Attribute | Selector expects | DOM has | Match? |
|----------|-----------------|---------|--------|
| ... | ... | ... | ❌/✅ |

### Fix validation via MCP
- New selector: `<code>`
- Result of the click: <description>

### Fix applied
- File:line — description
```

Without this section, the report is incomplete and the reviewer must reject it.

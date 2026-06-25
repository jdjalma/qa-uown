---
name: ui-first-principle
description: Load when deciding test strategy (E2E vs API). If the feature has a user flow in a portal (Origination/Servicing/Website/AMS), the test MUST exercise the browser. API-only is an EXCEPTION restricted to admin/ops without UI, setup/preconditions, or cross-cutting DB validations.
disable-model-invocation: true
---

# UI-First Principle — Inviolable Rule #14

## The principle

**UI-first as the default.** API-only only when the feature **has no** UI affordance.

> Visual validation (rendered placeholders, badges, GowSign iframe content, PDFs) **CANNOT be replaced** by reading a backend log. A rendering bug only becomes detectable when the customer sees it.

## Origin (2026-05-06)

BUG-01: empty placeholders in the PDF of Daniel's Jewelers (CA) discovered **manually** by Fernando because the API-only tests only read logs without rendering the PDF. That is where the rule came from.

## When to apply

Whenever deciding between:
- E2E (Playwright + browser)
- API-only (Playwright without a browser, HTTP only)
- DB-only

## Decision tree

```
Does the feature have a flow in the Origination/Servicing/Website/AMS portal?
├─ YES → E2E mandatory
│ API/DB may complement (setup, cross-cutting validation)
└─ NO → API-only OK
 (e.g., admin endpoint, sweep, internal CRUD)
```

## Cases where API-only is acceptable

1. **Admin/ops endpoints with no exposed UI**
 E.g.: `PATCH /uown/svc/gowsign-templates/{id}`, scheduled-task sweeps, internal CRUD configs.

2. **Setup/preconditions that accelerate the test**
 Creating a lead via `sendApplication` before exercising the UI signing flow. **The precondition is API; the feature is UI.**

3. **Cross-cutting DB validations**
 Assertion queries (activity log present, FK not broken, correct count). A complement, not a substitute.

## Cases where API-only is NOT enough

| Feature | Why it needs UI |
|---------|----------------------|
| Email template rendering | A placeholder bug only appears in the generated PDF/HTML |
| GowSign iframe content | Content inside the iframe is not in a log |
| Activity log display | Friendly name vs technical id — visualization matters (memory `example.md` AC1) |
| Status badge transitions | CSS, timing, re-render race condition |
| Form validation messages | Messages to the user, locale, layout |
| Responsive / mobile | Only the browser detects it |
| Audit / report screens (Modification Report, Activity Log display) | The rendered cell is what the auditor sees — the DB→UI mapping (status display, friendly name vs id, agent attribution) is only validatable by reading the table on screen, not the DB row |

## Procedure

### Before deciding strategy

1. Identify **where the feature is consumed**: customer (Website), agent (Servicing/Origination), admin (AMS).
2. Ask: "does the end user see this?" → YES = UI mandatory.
3. If hybrid: separate **setup** (fast API) from **execution** (realistic UI) from **validation** (UI + DB).

### Correct example (hybrid)

```ts
// SETUP — API (fast, deterministic)
await ensureMerchantReady(merchant);
const lead = await api.sendApplication({ ssn: "...", merchant });

// EXECUTION — UI (real customer flow)
await page.goto("/customer-portal/login");
await page.fill('[name="otp"]', otp);
await page.click("text=Confirm Signature");

// VALIDATION — UI + DB
await expect(page.locator(".badge")).toHaveText("Signed");
const log = await waitForRecord({ table: "uown_los_lead_notes", filter: { lead_id: lead.id, note_type: "SIGNING_COMPLETED" } });
expect(log).toBeDefined;
```

## Pitfalls

1. **Temptation to skip the browser to make the suite faster** — it works until you discover BUG-01 of rendering in production.
2. **API masks the real email flow** — clicking the email link (memory `feedback_email_imap_click_link`) is different from calling the URL from the API payload. An API bypass hides a template bug.
3. **Setup via API when the feature is Origination** — memory `feedback_setup_via_ui_new_application`: create a lead via the UI new-application instead of `createPreQualifiedApplication` when the feature **is** the Origination flow. It masks bugs of the real path.
4. **Asserting only the DB row in an audit display bug** (#1315, 2026-06-18) — the fix for "SYSTEM in the Modification Report" changes what the **auditor sees** in the "Agent Name" column. CT-03 drives the transition through the portal (header `username`) AND **reads the rendered cell** in `/modificationReport` (`getAgentNameByLeadPk` / `getRowByLeadPk`), with the DB row only as a cross-cutting guard. Validating only `uown_lead_modifications.agent_username` in the DB would not cover a DB→UI mapping bug (e.g., the column rendering the wrong id). Report/audit screens are UI-first.

## Anti-patterns

- ❌ "There's already a log in the DB, the test passed" → it did not cover the render
- ❌ "I'll just test the endpoint, the UI uses the same one" → CSS/JS/timing can break
- ❌ "It's an admin endpoint" without confirming the admin **really** has no screen
- ❌ Setup via API in an Origination feature when the point **is** the Origination flow

## Cross-links

- Inviolable rule #15 in `CLAUDE.md`
- Skill [[test-strategy-decision]] — the larger decision (E2E vs API vs hybrid)
- Skill [[test-data-hierarchy]] — set up fresh data via UI when the feature is UI
- Memory: `feedback_email_imap_click_link`, `feedback_setup_via_ui_new_application`

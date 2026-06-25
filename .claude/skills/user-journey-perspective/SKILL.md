---
name: user-journey-perspective
description: Load to force the perspective of a real customer/agent (not a dev) — asks "does the customer see this? does the agent see this? what would they do next?". Consults jornada-completa-lease.md and distinguishes the Website (customer) vs Servicing (agent) portals.
disable-model-invocation: true
---

# User Journey Perspective — get out of the dev's head, into the user's

> **Authority boundary** (`docs/_docs-conventions.md` §7): this skill covers **HOW TO FRAME THE TEST** — persona perspective, narrative journey, portal distinction. For canonical portal and flow names, run `node scripts/docs-tooling.mjs resolve customer-portal` or read `docs/business-rules/01-fundamentos.md` (portal naming is in [[volatile-knowledge-registry]] — cross-check mandatory). **Do not duplicate portal names here** — they drift.

> "Website" in UOWN is the CUSTOMER portal; "Servicing" is the AGENT portal (`feedback_portal_naming`). Getting this distinction wrong in test planning produces tests that don't cover what the customer actually does.

## When to apply

- After scope/AC/strategy, before the final SPEC, for a perspective sanity-check.
- The `new-flow` pipeline with a customer-facing flow — always.
- The scenario involves >1 portal — clarify who does what.
- A bug ticket described from the dev/log point of view — translate it to the customer/agent point of view.
- SPEC review where the steps look more like "API calls" than "person actions".

## Principles

1. **Customer ≠ Agent ≠ Admin.** Three personas; three journeys; three levels of visible information.
2. **The customer is on real mobile.** The customer is not on a MacBook in an office with 1440px — they are on a phone, with a bad connection.
3. **Master question:** "does the customer see this? does the agent see this? what would they do next?"
4. **A journey is a narrative, not a flowchart.** People have context (already a customer? first time? abandoned yesterday?).
5. **Trust `docs/user-stories/jornada-completa-lease.md`** as the journey spec when applicable.

## Personas (UOWN)

### Customer (end customer)

- **Portal:** Website (`feedback_portal_naming`).
- **Device:** real mobile (smartphone), variable connection, short attention.
- **Knowledge:** zero about lease internals. Expects a guided flow.
- **Sub-personas:**
 - *New customer:* first time at UOWN; needs to create an account, KYC, signing.
 - *Returning customer:* already has an account; arrives via a new merchant, a new lease, or via the Account Portal.
- **Recurring pain points:**
 - OTP in the email — TTL, spam, delays.
 - Plaid / MX link — breaks mid-flow, leaves the app.
 - GowSign iframe — small screen, difficult scroll.
 - GoSign mobile read mode (font zoom — `project_gosign_rollout`).
 - PDF rendering — small or missing column (CA case).
- **Guiding question:** "The customer is in a hurry, on a phone, at the store checkout — is this step clear?"

### Agent (UOWN or merchant ops)

- **Portal:** Origination (create/complete the lease) + Servicing (manage the lease post-signature) + AMS (advanced administration).
- **Device:** desktop 1440px+ (rule #15 — Bootstrap `d-lg-block`).
- **Knowledge:** trained on the product, knows the terms (OEP, EPO, NSF, dunning, NACHA).
- **Sub-personas:**
 - *Merchant agent:* merchant employee; sees only their own leads.
 - *UOWN support agent:* sees all; more permissions.
 - *Approval agent vs Read-only:* the role matrix affects what each one does.
- **Recurring pain points:**
 - Lead in the wrong state / can't move forward.
 - Customer didn't receive the OTP — the agent needs to resend it.
 - Edit invoice — contract re-issue (`feedback_qa_flow_scope_dual_brand_lease_edit`).
 - Refund / void of a lease.
- **Guiding question:** "The agent is in the office, multi-tab — is this error/log actionable?"

### Admin / Ops

- **Portal:** AMS (administration); sometimes direct access to admin endpoints (e.g., `POST /uown/createOrUpdateSqlConfig` — `reference_sqlconfig_admin_endpoint`).
- **Device:** desktop.
- **Knowledge:** access to internal config, SQL config, merchant programs, templates.
- **Sub-personas:** dev/ops vs Yuri (decision), vs business.
- **Guiding question:** "Who fixes config drift? How do they audit it?"

## Procedure

### Step 1 — Identify all the personas in the flow

For each scenario, list:
- Who starts it?
- Who reacts?
- Who needs to see the result?

Example: "Customer signs a lease" has:
- Customer (Website, mobile)
- Agent (Servicing) — sees the lead advance
- Merchant (maybe via an automatic email)
- Possibly admin (audit log)

### Step 2 — Map the journey per persona

For each persona, narrate the sequence of screens/actions FROM THEIR POINT OF VIEW:

```
Customer:
 1. Clicks the link in the merchant's email ("Complete your application")
 2. Lands on the Website /{shortCode}/complete
 3. Sees the lease summary (cash price, schedule)
 4. Fills in missing data if any
 5. Submit → sees a confirmation
 6. Receives an email with the signing link
 7. Clicks the link, lands on the signing flow
 8. Reads the contract (GowSign iframe), signs
 9. Sees the signing confirmation
 10. Receives a welcome email for the Account Portal
```

Each step is a potential test target. Each step has an oracle: "what does the customer expect to see now?"

### Step 3 — Cross-portal check

When an action in one portal affects another, mark it explicitly:

| Customer does on the Website | Appears in Servicing? | In AMS? | Activity log? |
|---|---|---|---|
| Submit lease | Yes — lead changes status | Yes — DB | Yes (rule #13) |
| Signs the contract | Yes — status SIGNED | Yes | Yes |
| Requests a refund | Yes — task opened for the agent | Yes | Yes |

Each YES is a candidate assertion.

### Step 4 — Points where the journey breaks (real-world)

For each step, ask:
- What if the customer closes the browser?
- What if the OTP expires before the click?
- What if the connection drops during signing?
- What if the customer tries to go back (back button)?
- What if they already had an account?
- What if they have another active lease?

Each "what if" scenario is a test candidate.

### Step 5 — Consult jornada-completa-lease

`docs/user-stories/jornada-completa-lease.md` is the source of truth for multi-portal journeys. If the scenario touches a complete lease, align with this doc before inventing steps.

### Step 6 — Output

```markdown
## User Journey Perspective — {scenario}

### Personas involved
- Customer (Website, mobile) — starts/reacts in: steps X, Y
- Agent (Servicing) — reacts in: step Z
- Admin (AMS) — visibility in: step W

### Customer Journey
1. {action} — where they are, what they see, what they expect
2. ...

### Agent Journey
1. ...

### Cross-portal assertions
- Customer action X → Agent sees Y → Admin sees Z

### Break points (real-world)
- Customer abandons at step N → expected behavior?
- OTP expires → is the re-issue flow visible?
- ...

### Mandatory visual assertions (from the user's point of view)
- Customer on the Website at step 5: sees the text "..." (does not see a technical error)
- Agent in Servicing after X: sees the "SIGNED" badge + an activity log line

### Reference
- docs/user-stories/jornada-completa-lease.md § {section}
```

## Heuristics

- **"Getting the portal name wrong = getting the persona wrong."** "Website" is the customer; "Servicing" is the agent. Always name it explicitly (`feedback_portal_naming`).
- **"Mobile-first for the customer."** If the customer test runs only on desktop 1440px, it does NOT capture the real experience. Mobile viewport is optional for critical customer flows.
- **"The customer doesn't read logs."** Validate what they see — text, badge, redirect. The log is a parallel assertion (rule #13), not a substitute.
- **"What if they do X out of order?"** Customers/agents do unexpected things. Back button, refresh, open in a new tab.
- **"Email = a journey step."** It's not a technical detail. Clicking the real email link (`feedback_email_imap_click_link`) is the real flow.
- **"Returning vs new."** Always check: does the journey cover the returning customer? (Login? Account already exists? Side-effects?)
- **"Agent with role X."** Don't assume an omnipotent agent. The role matrix affects what they see and can do.

## Expected output

A journey document per persona (template above). 50–150 lines depending on complexity. Always names the portal explicitly. Always lists cross-portal assertions when applicable.

## Anti-patterns

- Calling the portal by its English name without distinguishing customer vs agent — confusing (`feedback_portal_naming`).
- Describing the journey from the dev's point of view ("calls endpoint X, saves to DB Y") — that's not a journey.
- Ignoring mobile for customer flows — assumes desktop universally.
- A purely technical assertion (DB row, response code) without a visual assertion when the persona is customer-facing.
- Forgetting email/SMS as journey steps — they are real touchpoints.
- Not consulting `jornada-completa-lease.md` when applicable — reinvents steps with errors.
- Mixing agent and customer into the same "user" without distinguishing them.

## References

- `docs/user-stories/jornada-completa-lease.md`
- `skill [[qa-domain-reflexes]]`
- `skill [[application-lifecycle]]`
- memory: `feedback_portal_naming`, `feedback_email_imap_click_link`, `feedback_qa_flow_scope_dual_brand_lease_edit`, `project_gosign_rollout`

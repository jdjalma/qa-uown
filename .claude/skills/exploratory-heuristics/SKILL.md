---
name: exploratory-heuristics
description: Load in an exploration session / sanity check / "I need to find a bug nobody saw" — applies Bach/Bolton's SFDIPOT, HICCUPPS, FEW-HICCUPPS, anchored in UOWN domain hotspots (float repr, locale, timing, concurrent state, OTP/IMAP).
disable-model-invocation: true
---

# Exploratory Heuristics — where the bugs hide

> **Authority boundary** (`docs/_docs-conventions.md` §7): this skill covers **HOW TO EXPLORE** — heuristics, charters, domain hotspots. For canonical rules that define "expected behavior" in each hotspot (signing routing, multi-merchant state, OTP flow), run `node scripts/docs-tooling.mjs resolve gowsign-routing` (or `merchant-config`, `esign`) or read `docs/business-rules/03-contratos-esign.md` + `01-fundamentos.md`. **Do not duplicate routing/state facts here** — they drift.

> Scripted tests cover what you know. Exploration with heuristics covers what you don't know that you don't know. Bach & Bolton provide the maps; the UOWN domain provides the hotspots.

## When to apply

- Explicit exploratory session (charter: "find problems in X in N minutes").
- Post-deploy of a hotfix, before the final report.
- "Strange" bug reported by the customer that does not reproduce in scripted tests.
- Before closing a complex feature — ask "where else could it break?".
- Complementary skill to `test-design-techniques` when the designed cases don't catch the subtle ones.

## Principles

1. **Heuristic ≠ checklist.** Heuristics are lenses; applying 1–2 in depth > running all of them superficially.
2. **Exploration has a charter.** Without defined focus and time, it becomes aimless browsing. "In 45min, validate GoSign CA signing in multi-merchant" is a charter.
3. **Real-time notes.** A hidden bug shows up in a note, not in memory.
4. **Reproduce before classifying** (inviolable rule #10). An isolated observation is not a bug.

## Heuristic 1 — SFDIPOT (sweep of test areas)

A map of areas to sweep a product. Bach & Bolton.

| Dimension | Question | UOWN Hotspot |
|---|---|---|
| **S — Structure** | Which parts exist? UI, API, DB, jobs, vendors? | Origination + Servicing + Website + AMS; svc + balancer + ms; scheduled tasks |
| **F — Function** | What does the product do? Does each function work in isolation? | submit, sign, pay, refund, OTP, KYC, fraud check |
| **D — Data** | What data does it consume/produce? Type variations? | Money (float!), dates, SSN, addresses, phones, emails (IMAP), unicode in names |
| **I — Interfaces** | Which external/internal interfaces? | Vendor APIs (Kount, SEON, Plaid, GowSign, SignWell, Twilio, Tilled, Repay, EasyPay, MX), webhooks, scheduled tasks |
| **P — Platform** | What environment does it run in? Browsers, OS, mobile, viewport? | Customer = real mobile; Servicing/Origination = desktop 1440+ (rule #15); iframes (GowSign), PDFs |
| **O — Operations** | Who uses it, how, with what perms? | Customer (Website), Agent (Servicing/Origination), Admin (AMS), Ops (CLI/admin endpoints) |
| **T — Time** | When does it happen? At what speed? Concurrency? | Scheduled jobs, OTP TTL, OEP window 60d, NSF retry, IMAP polling delay, single-flight refs |

Procedure: sweep 1–2 dimensions per session; for each, list 3–5 concrete questions; pursue each question with proof.

## Heuristic 2 — HICCUPPS (consistency oracles)

How do you know something is a bug if there's no explicit AC? Oracles:

| Oracle | Meaning | UOWN Application |
|---|---|---|
| **H — History** | It used to work this way. | Before release X, CA signing generated 5 columns in the PDF. Now 3. Bug. |
| **I — Image** | Company / brand image. | KS template must show Kornerstone branding, not UOWN. |
| **C — Comparable products** | How competitors do it. | SignWell in CA vs GoSign in CA — we expect parity (`project_gosign_rollout`). |
| **C — Claims** | What the product promises (docs, marketing, contract). | "Customer receives OTP in <60s" — a promise. |
| **U — User expectations** | What a reasonable user expects. | A "Pay" button should charge; it shouldn't just save a draft. |
| **P — Product (self-consistency)** | The product consistent with itself. | The schedule total must match the cash price (float tolerance). |
| **P — Purpose** | It fulfills its purpose. | The lease document must be legally valid. |
| **S — Statutes** | Law / regulation. | NACHA, ECOA, state-specific lease laws. |

Procedure: when you observe strange behavior, walk the ladder — which oracle is being violated? If more than one, weight it higher.

## Heuristic 3 — FEW-HICCUPPS

Extended version with:
- **F — Familiar problems** — a bug already seen in a similar system. UOWN case: race condition in payment vendor retry.
- **E — Explainability** — behavior I can't explain is suspect.
- **W — World** — facts of the world (dates, geography, currency). UOWN case: validate that `state=CA` really pulls the CA template, not a fallback.

## UOWN Hotspots — where to focus exploration

Curated list of areas where bugs appear disproportionately:

### 1. Money & float repr
- `feedback_float_repr_not_bug` — `18.46` vs `18.459999...` is rounding, not a functional bug. BUT incorrect display in the PDF/UI is a visual bug.
- Compare with `toBeCloseTo(precision)` in the assertion.
- Hotspot: schedule, processing fee, total, refund.

### 2. Locale / state
- Everything assumed EN-US. Empty strings, template fallback, currency formatting.
- Hotspot: active states in GoSign vs SignWell (`project_gosign_rollout`); KS vs UOWN branding.

### 3. Timing / async
- OTP TTL: link clicked too late.
- IMAP polling: email is delayed; test fails due to a race.
- Scheduled task vs UI action.
- Vendor webhook arriving earlier than expected.
- Single-flight ref (`feedback_qa_flow_scope_dual_brand_lease_edit`).

### 4. Concurrent state
- 2 active invoices, customer opens the old one.
- Lead in transition while agent edits.
- Multiple customer tabs.

### 5. OTP / Email IMAP
- Always click the real email link (`feedback_email_imap_click_link`); don't use the API URL.
- Plus-addressing by runId (`reference_imap_fintechgroup777`).
- Email lands in spam — out of scope, but record it.

### 6. Vendor failure modes
- Kount/SEON: no response → behavior?
- Plaid/MX: link expires mid-flow.
- GowSign/SignWell: iframe breaks; PDF rendering fails.
- Twilio: SMS doesn't arrive; OTP fallback?

### 7. Activity log (rule #13)
- Every relevant action must generate a row in `uown_los_lead_notes` or equivalent.
- "I didn't see a log" = "nothing happened" = implementation bug.

### 8. Merchant config drift (rule #12)
- Checkboxes vs programs (13m/16m) — `merchant-config-contract.ts` is the truth.
- Drift across envs.

### 9. Dual-brand parity
- UOWN works; KS not tested → assume parity, violates reality (`feedback_qa_flow_scope_dual_brand_lease_edit`).

### 10. PDF / iframe rendering
- Daniel's Jewelers CA: column missing in the PDF — the log said everything was fine. Classic case of "log is not UI".
- Validate the visual diff SignWell vs GoSign.

## Procedure

### Step 1 — Charter

**BDD Oracle check (rule #19b):** before starting the session, check `.claude/oracles/_index.md` for the target operation — exploratory probes are operations too. If listed, validate its checkpoints as part of the session; if not, author the oracle first ("just exploring" does not exempt it).

Write in 1 sentence:
> "In {time}, explore {area} focusing on {risk}; bug-criteria: {oracles}."

Example: "In 45min, explore GoSign Pennsylvania signing focusing on PDF rendering; bug-criteria = History (vs old SignWell PA), Product (placeholders resolved), Claims (template approved by legal)."

### Step 2 — Apply a guiding heuristic

Choose 1 heuristic as the main lens (SFDIPOT for a broad sweep, HICCUPPS to check specific behavior).

### Step 3 — Note-taking during exploration

Suggested format:
```
[hh:mm] area: {SFDIPOT label}
action: ...
observation: ...
oracle violated: {HICCUPPS letter}
classification: [OBSERVATION] | [HYPOTHESIS] | [CONFIRMED]
next step: ...
```

### Step 4 — Reproduce before classifying (rule #10)

Every `[OBSERVATION]` that looks like a bug:
1. Repeat it in fresh data.
2. Check for an existing task/issue.
3. Rule out a pre-existing-data artifact.
4. Only then promote it to `[CONFIRMED]`.

### Step 5 — Session output

```markdown
## Exploratory Session — {charter}

### Charter
{text}

### Heuristic applied
SFDIPOT focusing on {dimensions}

### Notes
[hh:mm] ... (timeline)

### Findings
- [CONFIRMED] {bug} — repro: steps | oracle: H/I/C/C/U/P/P/S
- [HYPOTHESIS] {observation} — fresh repro missing
- [OBSERVATION] {observation} — possibly an artifact

### Coverage of this session
Areas explored: ...
Areas NOT explored (next session): ...

### Suggested scripted follow-up
Cases worth turning into a test.spec.ts: ...
```

## Heuristics (meta-tips)

- **"Look where the light is NOT."** Resist the tendency to explore where it's easy. Go to the vendor edge, locale-edge, error path.
- **"Ask yourself: what did I assume?"** Each assumption is a candidate test.
- **"Change 1 variable."** Same action, customer on mobile vs desktop. Same action, KS vs UOWN. Same action, agent vs customer.
- **"Break the order."** Click steps out of order. Refresh midway. Go back a page.
- **"Pursue the inconsistency."** If 2 screens show different data, which is right? Why?
- **"Don't trust the log until you validate what the customer sees."** Daniel's Jewelers case — the log said OK, the PDF didn't.

## Expected output

Session document (template above). Size proportional to time: 45min → 80–150 lines. Bug claims always with an explicit `[CLASSIFICATION]`.

## Anti-patterns

- "Free exploration" without a charter — living on impressions; a poor report.
- Reporting `[CONFIRMED]` without fresh reproduction — violates rule #10.
- Applying SFDIPOT as a superficial checklist instead of going deep on 1–2 dimensions.
- Trusting the log/DB without validating the UI when the oracle is visual.
- Forgetting the activity log (rule #13) as an independent oracle.
- Not recording the timeline — losing the repro later.

## Short examples (UOWN domain)

### Example 1 — Charter: "GoSign Pennsylvania signing, 30min"

Heuristic: HICCUPPS.
- History: compared to old PA signing via SignWell. Result: GoSign PA doesn't have the "Total" column in the final schedule that SignWell had — `[CONFIRMED]` (H + P).
- Product: placeholders resolved? Yes.
- Statutes: does the lease document mention the "Pennsylvania Consumer Lease Act"? `[OBSERVATION]` — needs checking with legal, not testable right now.

### Example 2 — Charter: "Refund flow in Servicing, 1h"

Heuristic: SFDIPOT on D (Data) + T (Time).
- D: refund amount in float — `19.999...` in the UI? `[CONFIRMED]` ugly display (not a functional bug, but UX).
- D: refund > original payment — blocked? `[CONFIRMED]` validation OK.
- T: refund triggered, vendor scheduled job responds late — what does the UI show in the meantime? `[HYPOTHESIS]` "Pending" spinner may get stuck; needs fresh repro.
- T: 2 refunds in 1s — race? `[OBSERVATION]` 2nd click blocked by the button, but the API accepts 2 calls — possible bug if bypassed.

### Example 3 — Charter: "Customer OTP on the Website, 45min"

Heuristic: FEW-HICCUPPS + OTP hotspot.
- Email IMAP — link clicked after 5min: valid? `[OBSERVATION]` TTL not documented.
- 2 OTPs requested in 10s: both valid? Only the last one? `[HYPOTHESIS]` needs repro.
- OTP in locale es-ES (assuming a Spanish customer) — does the email text fall back to EN? `[CONFIRMED]` Locale assumed EN; no localized version.

## References

- Bach & Bolton — "Heuristic Test Strategy Model" (public)
- `skill [[qa-domain-reflexes]]`
- `skill [[bug-classification]]`
- memory: `feedback_float_repr_not_bug`, `feedback_email_imap_click_link`, `project_gosign_rollout`, `feedback_qa_flow_scope_dual_brand_lease_edit`, `reference_imap_fintechgroup777`

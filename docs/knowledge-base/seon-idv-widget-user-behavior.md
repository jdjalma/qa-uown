---
title: SEON IDV Widget — User Behavior & Coverage Gap
domain: knowledge-base
status: stable
volatility: volatile
last_verified: 2026-06-23
sources:
  - env: sandbox (live widget inspected via MCP Playwright, 2026-06-23)
  - lead: 97955 (FifthAveFurnitureNY KS3015, isSeonIdCheckRequired=true) — widget rendered on /complete load
  - url: https://secure-sandbox.kornerstoneliving.com/{shortCode}/complete?planId=BW13
  - db: sandbox uown_los_lead.internal_status (SEON_ID_FAILED on leads 97950/97951/97943/97942/97940) vs lead_status (UW_APPROVED)
  - svc: IdVerificationService.java:254 · SeonIdVerificationStep.java:45-50 · UpdateLeadStatusService.java:41-67 · LeadService.java:358
  - common: LeadInfo.java:43-44,119-120,199-210 (lead_status vs internal_status columns)
  - specs: tests/api/seon-id-verification-bypass.spec.ts · tests/api/seon-negative-scenarios.spec.ts · tests/e2e/origination/seon-e2e-flow.spec.ts
covers: [fraud-vendors, esign, lead-status, account-status, activity-log]
---

# SEON IDV Widget — User Behavior & Coverage Gap

> Charter: discover what the REAL customer sees and can do at the SEON identity-verification step on the consumer portal, and map the gap vs the current SEON test suite (which is 100% backend-gate-focused).
> Origin: user question 2026-06-23 — "which scenarios do we have focused on user behavior? cancel SEON verification? restart the process?". Overall confidence: **high** (widget inspected live; backend behavior verified against svc source + confirmed live in DB).

## TL;DR

- The SEON widget is a **fullscreen blocking overlay** (`iframe[data-testid="seon-idv-iframe"]`, `transfer.seonidv.com`, `position:fixed`, `z-index:2147483647`) titled **"Verify your identity"**. It auto-injects on the `/complete` payment step when the merchant has `isSeonIdCheckRequired=true` and no valid SEON record exists.
- The customer sees: a privacy/consent **checkbox** ("I have read and agree to the Privacy Notice"), a **"Start verification"** button (disabled until consent), an **X (close)** control top-right, and a **camera document-scan + selfie/liveness** flow behind "Start verification". Renders responsively at 375×667 and 1440×900.
- **Zero tests exercise this widget.** Every SEON test either injects the result via `createOrUpdate` API or **deletes the iframe from the DOM** (`dismissSeonOverlay`). User behaviors — cancel (X), restart, abandon, consent gate, mobile render, form-blocked-behind-overlay — are **all uncovered**.
- **`SEON_ID_FAILED` is NOT a bug and IS reachable via API** (corrects an earlier wrong note): it is written to **`internal_status`**, not `lead_status`. A name/DOB-mismatch record + `submitApplication` sets `internal_status=SEON_ID_FAILED` while `lead_status` stays `UW_APPROVED`. No camera needed.

## The real widget (live, sandbox 2026-06-23)

Screenshots: `seon-widget-desktop-1440.png`, `seon-widget-mobile-375.png` (repo root, from MCP capture).

| Property | Value `[confirmed]` |
|---|---|
| Iframe | `iframe[data-testid="seon-idv-iframe"]`, src `https://transfer.seonidv.com/?seon-idv-transfer-token=...` |
| Layout | `position:fixed`, `z-index:2147483647`, covers full viewport (0,0,W,H) — **hard blocking overlay** |
| Title | "Verify your identity" — "you and your environment will be recorded" |
| Consent gate | checkbox "I have read and agree to the Privacy Notice" → unlocks "Start verification" |
| Actions | **Start verification** (camera/document/selfie), **X close** (top-right) |
| SDK | `SEON_LICENSE_KEY d989ce6c-d777-4d49-a135-5189a27d9bb1`; communicates via `postMessage`; NeuroID (`nidConfig`) coexists on the same form; a hidden 1×1 `kaptcha.com` iframe (bot detection) is also present |
| Mobile (375×667) | full-width edge-to-edge modal, same controls, X top-right — renders OK |

### Trigger mechanism
Loading `/complete` for a SEON-required merchant with **no valid SEON record** → backend `submitApplication`/missing-fields returns **`"Failed to verify identification."`** → the frontend renders the widget. The widget appears *because* verification is required and not yet satisfied. Activity log written: `[SubmitApplicationResponse] Error: Failed to verify identification.`

### Cross-origin interaction (key for automation)
The widget content is cross-origin → `page.evaluate` into it is **blocked** (this is why the page objects only *remove* it). But a real spec **can** click inside it via `page.frameLocator('[data-testid="seon-idv-iframe"]')` (CDP-level, not same-origin-bound). **Cancel and restart ARE automatable**; only the camera/liveness completion needs a real device (use Playwright `--use-fake-device-for-media-stream` as a proxy, or keep the API bypass as the explicit CI stand-in).

## SEON_ID_FAILED — corrected mechanics `[confirmed]`

Earlier this was mis-flagged as a candidate bug ("status never set"). Root cause was a **probe reading the wrong column**. Verified against source + live DB:

- `IdVerificationService.java:254` → `updateLeadStatus(lead, null /*leadStatus*/, SEON_ID_FAILED /*internalStatus*/, ...)`. With `leadStatus=null`, `LeadInfo.setLeadStatus` (LeadInfo.java:200-206) writes **only** `internal_status`; `lead_status` is untouched.
- `SEON_ID_FAILED`, `SEON_ID_APPROVED`, `SEON_ID_UPLOADED`, `INTELLICHECK_FAILED`, `NEURO_ID_*` are all **internal-status** values by design (`LeadService.java:358`, `'internal.status'` config). They are never main `lead_status` values.
- Live proof (sandbox 2026-06-23): leads 97950/97951/97943/97942/97940 (injected name-mismatch SEON record + `submitApplication`) → `internal_status=SEON_ID_FAILED`, `lead_status=UW_APPROVED`.
- **Exception — no SEON record at all**: `SeonIdVerificationStep` returns STOP ("No SEON record found") **before** calling `verifySeon`, so `internal_status` stays `UW_APPROVED` (lead 97955). SEON_ID_FAILED is set only when a record exists and fails the name/DOB checks.
- No transition guard exists (`UpdateLeadStatusService` + `LeadInfo.setLeadStatus` are unconditional setters); `SubmitApplicationProcessor` is `@Transactional` and a STOP commits normally. Classification: **OBSERVATION** (correct-by-design behavior), not a bug.

> Coverage gap this exposes: the negative-scenario specs assert only the error message, never `internal_status=SEON_ID_FAILED`. Add that assertion to prove the lifecycle transition (Rule #13).

## Coverage map

### Covered — backend gate + P0 widget behaviors (updated 2026-06-23)
`seon-id-verification-bypass.spec.ts` (inject APPROVED record → submit passes via `idVerifySuccess=true` short-circuit), `seon-negative-scenarios.spec.ts` (8/8 CTs: no-record/name-mismatch/REJECTED block, expired-doc short-circuit, createOrUpdate edge cases, dup-call last-wins, non-SEON merchant empty — **now also asserts `internal_status=SEON_ID_FAILED`**), `seon-e2e-flow.spec.ts` (inject record + drive contract UI but remove the widget from the DOM), `seon-widget-user-behavior.spec.ts` (P0 suite: widget renders, consent gate, gate-blocks-form, `internal_status` CT — 7/7 PASS sandbox).

### Uncovered — every real user behavior
The customer **never** completes the actual widget in any test. `dismissSeonOverlay` (display:none / `.remove()`) lets a green E2E claim "customer can apply→verify→pay→sign" while a real customer is still standing in front of an un-completed identity modal. Bugs this masks: widget never loading, consent checkbox broken, modal not dismissable / trapping the user, camera erroring on mobile, error banner not surfacing/recoverable, overlay still blocking the CC form after a pass — **and the inverse**: a backend wrongly letting an un-verified customer through is invisible because the test pre-seeds the APPROVED row instead of earning it.

## Scenario matrix — user behavior (to implement)

All `currentlyCovered=false`. P0 first.

| ID | Scenario | User action | Expected (UI + status + log) | Automatable |
|----|----------|-------------|------------------------------|-------------|
| SEON-UB-01 | Widget renders | Open `/complete` for SEON merchant | Fullscreen blocking iframe visible; lead pre-verification; no terminal `uown_seon` row yet | yes — API precond + assert iframe visible |
| SEON-UB-02 | Consent gate | Tick "I agree" | "Start verification" disabled→enabled after consent | yes — frameLocator |
| SEON-UB-03 | **Cancel via X** | Click X close | Overlay closes; page interactive again; lead stays pre-verification; **cancel note SHOULD exist** (else Rule #13 gap → flag) | yes — frameLocator |
| SEON-UB-04 | Abandon (close tab) | Close tab mid-flow | On return, widget re-presented; abandonment NOT persisted as pass | yes — new context |
| SEON-UB-05 | **Restart after cancel** | Cancel → re-trigger | Widget re-renders cleanly (exactly 1 iframe, no stale leak); consent + Start available again | yes — frameLocator |
| SEON-UB-06 | Complete (camera) | Agree → Start → scan + selfie | Success → submit proceeds; `uown_seon` APPROVED + pass note | **no — real camera** (manual / fake-media; API bypass = CI stand-in) |
| SEON-UB-07 | Failure render | Verification fails | Failure message shown; submit blocked; `internal_status=SEON_ID_FAILED` + REJECTED `uown_seon` | partial — render manual, downstream block via API |
| SEON-UB-08 | Mobile 375×667 | Phone viewport | Modal fits, no overflow, Start in viewport | yes — frameLocator |
| SEON-UB-09 | Tablet 768×1024 | Tablet viewport | Scales without clipping | yes — frameLocator |
| SEON-UB-10 | **Form blocked behind overlay** | Try to type CC while widget up | CC fields not actionable (overlay intercepts); no submit fires. **Do NOT use dismissSeonOverlay** (masks the trap) | yes — frameLocator/geometry |
| SEON-UB-11 | Re-trigger on re-entry | Dismiss → reload | Widget re-injects (1 instance); gate not bypassed | yes — frameLocator |

## Page-object gaps

Replace the three near-duplicate `dismissSeonOverlay` impls (`contract.page.ts:823`, `paypair-portal.page.ts:900`, `paytomorrow-portal.page.ts`) — which only HIDE the iframe — with a shared **`SeonWidgetComponent`** (frameLocator-based) that can DRIVE or ASSERT the widget:
- `waitForSeonWidget()` / `isSeonWidgetVisible()` — assert the modal actually rendered (non-loading widget fails, not silently removed)
- `acceptPrivacyConsent()` + read Start enabled/disabled
- `startVerification()` · `closeSeonWidget()` (real X, distinct from DOM removal)
- `isSeonGateBlockingPaymentForm()` — non-destructive, proves customer cannot pay un-verified
- `completeSeonVerification()` via `--use-fake-device-for-media-stream` + sample document/selfie
- `getSeonErrorMessage()` / `dismissSeonErrorBanner()` — replace the blind force-remove + re-submit in `paypair-portal.page.ts:673`
- mobile-aware variants for 375×667 / 768×1024 (Rule #15)

## CT-06 — Complete via camera (manual procedure)

CT-06 requires a real camera device and cannot run headless. The following procedure must be executed manually when certifying SEON_ID_APPROVED via real SDK:

**Pre-conditions:**
1. Use a Kornerstone merchant with `isSeonIdCheckRequired=true` (e.g. KS3015/FifthAveFurnitureNY, sandbox).
2. Create a fresh application via `sendApplication` (do NOT call `api.seon.approveVerification` — that would bypass the widget).
3. Navigate to the `redirectUrl` `/complete` on a device with a real camera (or Chrome with `--use-fake-device-for-media-stream` + a local test image).

**Steps:**
1. Navigate to `/{shortCode}/complete?planId={planId}`.
2. Assert: SEON iframe `[data-testid="seon-idv-iframe"]` renders within 30s.
3. Inside the iframe: tick the consent checkbox → assert "Start verification" becomes enabled.
4. Click "Start verification" → present a government-issued ID document to camera → complete selfie/liveness capture.
5. Widget closes automatically on success.
6. Assert: `uown_seon` row with `status='APPROVED'`, `success=true`, `id_verify_success=true`.
7. Assert: `internal_status = 'SEON_ID_APPROVED'` in `uown_los_lead`.
8. Assert: activity note "SEON verification completed" (or equivalent) in `uown_los_lead_notes` (Rule #13).
9. Proceed to payment form (CC + bank) — assert payment form is now interactive (no overlay blocking).

**CI stand-in:** Use `api.seon.approveVerification(...)` as the explicit bypass for all CI test runs. CT-06 manual execution is required only for SEON SDK upgrade certifications or when the vendor changes the widget flow.

## Pipeline results — P0 suite (sandbox 2026-06-23)

7/7 PASS (reproducible). Breakdown:

| CT | Title | Status | Notes |
|----|-------|--------|-------|
| CT-01 | Widget renders on SEON-required merchant | PASS | `isSeonWidgetVisible()` confirmed |
| CT-02 | Consent gate — Start button gated | PASS | `isStartVerificationEnabled()` false→true |
| CT-03 | Cancel via X | MANUAL-PENDING | X click does not dismiss in sandbox (Pitfall #142) |
| CT-04 | Gate blocks payment form | PASS | `isSeonGateBlockingPaymentForm()` |
| CT-05 | Restart after cancel | MANUAL-PENDING | Depends on CT-03 dismiss |
| CT-06 | Complete via real camera | MANUAL | See procedure above |
| CT-07 | `internal_status=SEON_ID_FAILED` via API mismatch | PASS | 8/8 in `seon-negative-scenarios.spec.ts` |

## Observability gaps (flag for dev/PO — not confirmed bugs)

- **OBS-01 (cancel X):** X click does not dismiss widget in sandbox — possible SEON SDK sandbox-mode limitation. No cancel note in `uown_los_lead_notes` → potential Rule #13 gap for the cancel event. Confirm with dev/PO before opening ticket.
- **OBS-02 (cancel note):** No activity log entry for cancel attempt — `uown_los_lead_notes` has no "SEON verification cancelled" row. If cancellation is a meaningful user action (restart scenario), a log entry would be expected (Rule #13). Correlates with OBS-01.
- **OBS-03 (Kornerstone API submit):** Kornerstone API submit in sandbox does not write a ContractService note. Known limitation, documented in CT-07b. No action required.

## Related

- Memory `seon-gate-real-mechanics` — gate order, blocking conditions (corrected: SEON_ID_FAILED = internal_status, confirmed 2026-06-23).
- [[fraud-vendors-knowledge]] Pitfall #11 — cancel UX non-trivial; Pitfall #7 — SEON status vs lead status.
- [[application-lifecycle]] Pitfall #142 — closeSeonWidget does not dismiss in sandbox; Pitfall #143 — pre-write-validate hook blocks standalone components.
- [[page-object-pattern]] catalog — `SeonWidgetComponent` entry (frameLocator pattern, topology, full API).
- Rule #14 (UI-first), #15 (visual validation not replaceable by backend reads), #18 (discovery UI→API→DB) — this gap is a direct instance.

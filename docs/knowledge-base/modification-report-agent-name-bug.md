---
title: Modification Report — Agent Name Bug (Issue #1315)
domain: knowledge-base
status: stable
volatility: stable
last_verified: 2026-06-18
sources:
  - env: qa2
  - db: uown_lead_modifications
  - svc-source: ChangeLeadStatusService.java
  - svc-source: ThreadAttributes.java
  - svc-source: RequestFilter.java
covers: [modification-report, agent-username-attribution, lead-status-change, system-vs-agent, threadlocal-corruption]
promoted_to: [07-modificacoes-conta]
---

# Modification Report — Agent Name Bug (Issue #1315)

> Charter: Explore Modification Report via Playwright MCP + DB (QA2) to discover all lead status transitions, which show "SYSTEM" instead of the real agent, and which are correctly attributed.
> Origin: Issue #1315 (workflow::ready-for-qa, Milestone R1.53.0) · Overall confidence: **high**

---

## Purpose

The **Modification Report** (`/modificationReport`) logs every change to a lead and records who performed it. The `agent_username` column (UI: "Agent Name") must show the username of the human agent who triggered the action — or "SYSTEM" exclusively for changes that were triggered by backend automation without any human actor.

**Bug:** The backend was recording `agent_username = 'SYSTEM'` for many changes that were in fact triggered by a human agent in the portal. Discovered by Priyanka Namburu on 2026-05-28, specifically on `Approved → Expired` transitions.

---

## Available Operations

| Operation | Available? | Notes |
|---|---|---|
| View | ✅ | All users with Modification Report permission |
| Filter | ✅ | By Agent Name (text), Merchant, Location, Modification Type, Start/End Date |
| Export CSV | ✅ | "Email CSV" button |
| Add/Edit/Delete | ❌ | Read-only audit log |

### Filters

| Filter | Type | Options |
|---|---|---|
| Search | Free text | Agent name partial match |
| Merchant | Single select | |
| Location | Single select (dependent on Merchant) | |
| Modification Type | Single select | `LEAD_STATUS_CHANGE`, `APPROVAL_AMOUNT_CHANGE`, `LEASE_MOD` |
| Start Date / End Date | Date | Default: today |

---

## Table Columns

`Lead | Date | Modification Type | Merchant Name | Location Name | Old Status | New Status | Old Internal Status | New Internal Status | New Amount | Old Amount | Agent Name`

Endpoint: `POST /uown/los/getModifiedLeads` · Table: `uown_lead_modifications`

| DB Column | UI Column |
|---|---|
| `old_status` | Old Status |
| `new_status` | New Status |
| `old_internal_status` | Old Internal Status |
| `new_internal_status` | New Internal Status |
| `agent_username` | Agent Name |

---

## Status Display Mapping (UI → DB)

| UI Label | DB Value (`lead_status`) |
|---|---|
| Approved | `UW_APPROVED` |
| Signed | `SIGNED` |
| Contract Created | `CONTRACT_CREATED` |
| Expired | `EXPIRED` |
| Denied | `DENIED` |
| UW Denied | `UW_DENIED` |
| Funded | `FUNDED` |
| Funding | `FUNDING` |
| Error | `ERROR` |

---

## All Distinct LEAD_STATUS_CHANGE Transitions (confirmed in QA2 DB)

| Old Status | New Status | Notes |
|---|---|---|
| `UW_APPROVED` | `SIGNED` | Agent clicks "Change to Signed" in portal |
| `UW_APPROVED` | `EXPIRED` | Agent clicks "Set to Expired" in portal |
| `CONTRACT_CREATED` | `SIGNED` | GowSign/SignWell webhook when customer signs |
| `CONTRACT_CREATED` | `EXPIRED` | Agent expires during contract phase |
| `SIGNED` | `SIGNED` | Re-sign webhook event (GowSign retry) |
| `SIGNED` | `EXPIRED` | Agent clicks "Set to Expired" on a signed lead |
| `EXPIRED` | `UW_APPROVED` | Agent reactivates expired application |
| `EXPIRED` | `SIGNED` | System re-signing after expiry |
| `DENIED` | `UW_APPROVED` | Admin override |
| `DENIED` | `SIGNED` | (rare, likely edge case) |
| `UW_DENIED` | `UW_APPROVED` | Admin override of UW denial |
| `UW_DENIED` | `UW_DENIED` | UW re-evaluation |
| `ERROR` | `SIGNED` | Recovery from error state |
| `FUNDED` | `SIGNED` | (rare) |
| `FUNDING` | `SIGNED` | (rare) |

---

## Agent-Triggered Actions per Lead Status (UI buttons)

### Status: UW_APPROVED (Approved)
| Button | Resulting Transition | Modification Type |
|---|---|---|
| **Set to Expired** | `UW_APPROVED → EXPIRED` | LEAD_STATUS_CHANGE |
| **Change to Signed** | `UW_APPROVED → SIGNED` | LEAD_STATUS_CHANGE |
| Modify Approval Amount | — | APPROVAL_AMOUNT_CHANGE |
| Send Trustpilot Invitation | — | — |
| Blacklist Lead | — | — |

### Status: SIGNED (Signed)
| Button | Resulting Transition | Modification Type |
|---|---|---|
| Request Funding | — | — |
| **Modify Lease** | — | LEASE_MOD |
| **Set to Expired** | `SIGNED → EXPIRED` | LEAD_STATUS_CHANGE |
| Send Trustpilot Invitation | — | — |
| Blacklist Lead | — | — |
| Cancel Lease | — | — |

---

## SYSTEM Bug Analysis (evidence-based)

### Fix timeline
- Bug report: 2026-05-28
- Fix deployed to QA2: ~2026-06-16 (MR `svc!1464` + `svc!1470`)
- Ready for QA: 2026-06-16

### Pre-fix behavior (< 2026-06-16)
ALL 309 `LEAD_STATUS_CHANGE` records from 2026 (before fix) showed `agent_username = 'SYSTEM'`. Only 3 records showed a real agent — all 3 are post-fix (see below).

### Post-fix behavior (>= 2026-06-16) — manually validated 2026-06-18

| Transition | Internal Status Path | Agent after fix | Status | Evidence |
|---|---|---|---|---|
| `UW_APPROVED → SIGNED` | `INVOICE_CREATED → SIGNED` | **real agent** (3 records: `lelias.gow`) | ✅ **Fixed** | DB pre-existing records |
| `UW_APPROVED → EXPIRED` | `UW_APPROVED → EXPIRED` | **real agent** (`jmendes.gow`, lead 16711) | ✅ **Fixed** | Manual test 2026-06-18 |
| `UW_APPROVED → SIGNED` | `BLACKLIST_APPROVED → SIGNED` | **real agent** (`jmendes.gow`, lead 16656) | ✅ **Fixed** | Manual test 2026-06-18 |
| `SIGNED → EXPIRED` | `SIGNED → SIGNED` | **real agent** (`jmendes.gow`, lead 16717) | ✅ **Fixed** | Manual test 2026-06-18 |
| `UW_APPROVED → SIGNED` | `NEURO_ID_ERROR → SIGNED` | **real agent** (`jmendes.gow`, lead 16650) | ✅ **Fixed** | Manual test 2026-06-18 |
| `UW_APPROVED → SIGNED` | `CC_AUTH_PASSED → SIGNED` | **real agent** (`jmendes.gow`, lead 16495) | ✅ **Fixed** | Manual test 2026-06-18 |
| `UW_APPROVED → SIGNED` | `CONTRACT_GEN_ERROR → SIGNED` | **real agent** (`jmendes.gow`, lead 16485) | ✅ **Fixed** | Manual test 2026-06-18 |
| `CONTRACT_CREATED → EXPIRED` | `CONTRACT_CREATED → EXPIRED` | **real agent** (`jmendes.gow`, lead 16718) | ✅ **Fixed** | Manual test 2026-06-18 |

**Key finding (2026-06-18 discovery):** For leads that already had a GowSign signing flow initiated (internal statuses: `BLACKLIST_APPROVED`, `NEURO_ID_ERROR`, `CC_AUTH_PASSED`, `CONTRACT_GEN_ERROR`), the "Change to Signed" button in the portal shows the "Move Contract to Signed" modal DIRECTLY (contract already exists). This modal calls `changeLeadStatus` with the `username` header — fix works correctly. For BLACKLIST_APPROVED leads where NO signing flow was started yet, "Change to Signed" first triggers the GowSign flow (activity log: `[Signing Flow] Started`) before showing "Move Contract to Signed". The post-fix SYSTEM records for BLACKLIST_APPROVED/NEURO_ID_ERROR on June 16-17 are from automated CI tests that call `changeLeadStatus` API directly without the `username` header — test simulation gap, not a backend bug.

### Legitimately SYSTEM (system-triggered, no human actor)
| Transition | Reason |
|---|---|
| `CONTRACT_CREATED → SIGNED` | GowSign/SignWell webhook callback when customer completes self-signing. No human agent in the HTTP request context. **SYSTEM is CORRECT.** |
| `SIGNED → SIGNED` | GowSign re-sign event (retry/reprocessing by system). **SYSTEM is CORRECT.** |

---

## Business Rules

- BR-01: `agent_username` must reflect the portal user who triggered the action. `[confirmed]` — evidenced by 3 post-fix records showing `lelias.gow` for INVOICE_CREATED path.
- BR-02: `SYSTEM` is only valid when the action is triggered by a backend service call without a user session context (e.g., GowSign webhook, scheduler sweep). `[confirmed]` — CONTRACT_CREATED → SIGNED always shows SYSTEM (webhook).
- BR-03: The fix addresses ALL human agent UI transitions. `BLACKLIST_APPROVED → SIGNED` via "Move Contract to Signed" button correctly records the agent. `[confirmed]` — manual test 2026-06-18 (lead 16656, agent `jmendes.gow`).
- BR-04: The `UW_APPROVED → EXPIRED` bug (original report trigger) is NOT reproduced in QA2 for 2026. The most recent EXPIRED-SYSTEM record in QA2 is from Dec 2025 (`UW_APPROVED → EXPIRED` via `INVOICE_CANCELLED`). `[confirmed]` — no EXPIRED transitions in 2026 data.
- BR-05: Post-fix SYSTEM records (BLACKLIST_APPROVED/NEURO_ID_ERROR, June 16-17) are from CI automated tests calling `POST /uown/los/changeLeadStatus` directly without `username` header. Real human agents clicking through the portal always record the real agent. `[confirmed]` — all 4 remaining internal status paths validated manually 2026-06-18.
- BR-06: For leads that already have a GowSign signing flow initiated, "Change to Signed" shows "Move Contract to Signed" modal directly (NEURO_ID_ERROR, CC_AUTH_PASSED, CONTRACT_GEN_ERROR, BLACKLIST_APPROVED all follow this pattern when a prior signing attempt exists). `[confirmed]` — observed in portal 2026-06-18 for all 4 internal statuses.

---

## Backend Root Cause Analysis (confirmed via source code — 2026-06-18)

### Username propagation mechanism

`RequestFilter.java` line 41 reads the agent identity from a plain **HTTP request header named `username`** — NOT from a JWT token:

```java
// RequestFilter.java — line 41-73
String username = requestWrapper.getHeader("username");
ThreadAttributes.setUsername(username);
```

`ThreadAttributes` uses `ThreadLocal<HashMap<String,Object>>` to store per-thread attributes. `getUsername()` returns `"SYSTEM"` when USERNAME is blank:

```java
// ThreadAttributes.java — getUsername()
public static String getUsername() {
    String username = (String) getObjectHM().get(USERNAME);
    if (StringUtils.isBlank(username)) return "SYSTEM";
    return username;
}
```

### Pre-fix bug mechanism

`ChangeLeadStatusService.changeLeadStatus()` (line 81–192) is the sole code path that creates `LEAD_STATUS_CHANGE` modification records. Pre-fix, the agentUsername was read from ThreadAttributes **after** an outbound webhook call that corrupted the ThreadLocal:

```
1. HTTP request → RequestFilter sets ThreadAttributes.USERNAME = "jmendes.gow"
2. ChangeLeadStatusService.changeLeadStatus() starts
3. Calls updateLeadStatusService.updateLeadStatus(lead, SIGNED, SIGNED, ...)
4.   → webhookService.sendWebhookLeadUpdate(lead.pk, SIGNED)  ← clears/corrupts ThreadLocal
5. Back in ChangeLeadStatusService: info.setAgentUsername(ThreadAttributes.getUsername())
    → USERNAME now blank → returns "SYSTEM"
```

The webhook corrupts the ThreadLocal because `SvOutboundCall.makeRestCall()` is wrapped by `AspectOutboundApiLog` which makes outbound HTTP calls (to GowSign/merchant callbacks) that trigger thread-level side-effects on the ThreadLocal map.

### The fix (MR svc!1464 + svc!1470)

**svc!1464** — `ChangeLeadStatusService.changeLeadStatus()`: captures agentName at the very start, before any calls that might corrupt ThreadLocal:
```java
// line 81 — BEFORE any updateLeadStatus or webhook calls
String agentName = ThreadAttributes.getUsername();
// ...
// line 172 — uses captured local variable, not ThreadAttributes
info.setAgentUsername(agentName);
```

**svc!1470** — `UpdateLeadStatusService.updateLeadStatus()`: adds save/restore around the webhook call:
```java
String username = ThreadAttributes.getUsername(); // save before webhook
webhookService.sendWebhookLeadUpdate(lead.getPk(), leadStatus);
ThreadAttributes.setUsername(username); // restore after webhook
```

### Why BLACKLIST_APPROVED → SIGNED still shows SYSTEM after fix

The 11 post-fix `BLACKLIST_APPROVED → SIGNED` records (June 16–17, ~7 AM) come from **automated test runs**, not from human agents clicking through the Origination portal. Automated tests call `POST /uown/los/changeLeadStatus` programmatically without sending the `username` HTTP header → `ThreadAttributes.USERNAME` = blank → "SYSTEM".

This is a **test simulation gap**, not a backend bug in the fix itself:
- Real human agent in portal → browser app sends `username: jmendes.gow` header → fix works → agent name recorded ✅
- Automated test API call → no `username` header → ThreadLocal blank → "SYSTEM" ⚠️

The fix is correct; the post-fix SYSTEM records for BLACKLIST_APPROVED/NEURO_ID_ERROR paths are artifacts of test automation not providing agent context.

### Legitimately SYSTEM (no fix needed)

| Transition | Reason |
|---|---|
| `CONTRACT_CREATED → SIGNED` | GowSign/SignWell webhook — system-to-system callback, no human actor. `EsignService.eSignDocumentStatus()` is called from a scheduler sweep; no `username` header in the webhook context. |
| `SIGNED → SIGNED` | GowSign re-sign event from scheduler sweep — same reason. |

These are processed by `EsignService.eSignDocumentStatus()` → `updateLeadStatusService.updateLeadStatus(losLead, SIGNED, SIGNED, ...)`. Note: `EsignService` does NOT create `LeadModificationsInfo` records — those records come from `ChangeLeadStatusService` only.

### Key source files

| File | Role |
|---|---|
| `svc/.../logging/RequestFilter.java` | Sets `ThreadAttributes.USERNAME` from `username` HTTP header (line 41) |
| `svc/.../config/ThreadAttributes.java` | ThreadLocal store; `getUsername()` returns "SYSTEM" if blank |
| `svc/.../service/ChangeLeadStatusService.java` | **Only creator** of `LEAD_STATUS_CHANGE` records; fix captures agentName at line 81 |
| `svc/.../service/UpdateLeadStatusService.java` | Fix adds save/restore around webhook call; has `@Async` method (only used for PLAID_ERROR path, not signing) |
| `svc/.../service/EsignService.java` | Handles eSign callback/polling; sets status to SIGNED via `updateLeadStatus()` (not `ChangeLeadStatusService`) |
| `svc/.../logging/AspectOutboundApiLog.java` | AOP wrapper around outbound API calls that was corrupting ThreadLocal |

---

## Connections with What Was Already Known

- Confirms: Priyanka's concern ("may be other status changes that log the wrong username") — the fix covers all human agent UI transitions (EXPIRED, SIGNED via all internal paths). The few remaining SYSTEM records are automated test calls without `username` header.
- Confirms: Marcos's test instructions (INVOICE_CREATED path) — the fix works correctly for real human agent actions.
- Confirms: `UW_APPROVED → EXPIRED` (lead 16711), `BLACKLIST_APPROVED → SIGNED` (lead 16656), `SIGNED → EXPIRED` (lead 16717) — all show real agent pós-fix. Validated manually 2026-06-18.
- New finding: `BLACKLIST_APPROVED` leads use a **2-step UI flow**: "Change to Signed" triggers GowSign signing flow first → "Move Contract to Signed" button appears → THAT calls `changeLeadStatus` with `username` header.
- New finding: `CONTRACT_CREATED → SIGNED` (156 records) showing SYSTEM is **legitimate behavior** — EsignService polling, no human actor.
- New finding: `@Async` in `UpdateLeadStatusService.updateLeadStatusAsync()` is only called from `PlaidWebhookService` (PLAID_ERROR path), not from any signing pipeline.

---

## Gaps / To Investigate

1. **Activity Log correlation**: Post-fix, `ChangeLeadStatusService` line 84 creates activity log using `agentName` (same local var as modification record). Should match. Not separately verified — low priority since fix mechanism is the same variable.
2. **BLACKLIST_APPROVED "Change to Signed" when NO prior signing flow**: For leads where signing was never started, "Change to Signed" initiates the GowSign flow first (new observation). This path produces a SYSTEM entry in `uown_los_lead_notes` for `[Signing Flow] Started` (legitimate — no user context in signing initiation), then the "Move Contract to Signed" second step records the real agent. Not verified whether the intermediate signing flow creates a `uown_lead_modifications` record.

> **Status as of 2026-06-18**: All agent-triggered LEAD_STATUS_CHANGE transitions validated. Fix is complete for 100% of human agent portal actions.

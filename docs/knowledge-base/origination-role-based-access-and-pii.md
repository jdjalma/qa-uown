---
title: Origination Portal — Role-Based Access & PII Visibility
domain: knowledge-base
status: snapshot
volatility: volatile
last_verified: 2026-06-25
sources:
  - env: stg
  - env: sandbox
  - lead: 7218178
  - lead: 98086
  - account: jmndes.gow (admin/manager)
  - account: supervisor (supervisor)
covers: [origination-portal, admin-panel, lead-management, pii-display]
promoted_to: []
---

# Origination Portal — Role-Based Access & PII Visibility

> Charter: Explore the Origination portal as two different accounts with Playwright MCP to discover how the side-menu, lead actions, and PII visibility change by role/permission.
> Origin: user request — origination documentation gap sweep (per-role visibility was an open gap) · Overall confidence: medium-high (two accounts observed in stg)
> NOTE: per-feature discovery knowledge, NOT an execution record. Conservative classification (Rule #16): findings are for the two observed accounts; menu visibility is permission-driven (managed in AMS) and may not map 1:1 to a fixed role name.

## What was compared

| Account (stg) | Resolves from | Effective level |
|---|---|---|
| `jmndes.gow` | `STG_ADMIN_*` **and** `STG_MANAGER_*` (same username) | High (admin/manager) |
| `supervisor` | `STG_SUPERVISOR_*` | Supervisor |

> In stg, `STG_ADMIN_USERNAME` and `STG_MANAGER_USERNAME` are the **same account** (`jmndes.gow`), so "admin" and "manager" could not be separated here. The contrast below is **admin/manager vs supervisor**. Lower roles (`agent`, `readonly`, `merchant`) resolve to `DEFAULT_*` creds and were **not** confirmed to exist in stg — GAP.

## Side-menu visibility by account

| Menu item | admin/manager (`jmndes.gow`) | supervisor |
|---|:--:|:--:|
| Overview | ✅ | ✅ |
| Leads | ✅ | ❌ |
| Funding | ✅ | ✅ |
| Funding Modification History | ✅ | ❌ |
| Modification Report | ✅ | ❌ |
| Merchant Modification History | ✅ | ❌ |
| Alerts | ✅ | ✅ |
| Error Log | ✅ | ❌ |
| New Application | ✅ | ✅ |
| State Configs | ✅ | ❌ |
| Merchant | ✅ | ✅ |
| Merchant Setting | ✅ | ❌ |
| Programs | ✅ | ✅ |
| Program Settings | ✅ | ❌ |
| Program Groups | ✅ | ❌ |
| Rebate | ✅ | ❌ |
| Blacklist | ✅ | ❌ |
| Open To Buy | ✅ | ❌ |
| **Total** | **18** | **6** |

Supervisor sees **6** items: Overview, Funding, Alerts, New Application, Merchant, Programs. `[confirmed]`

## Lead detail — action bar by account (lead 7218178, status Funding)

| Action | admin/manager | supervisor |
|---|:--:|:--:|
| Modify Lease | ✅ | ✅ |
| Cancel Lease | ✅ | ✅ |
| Send to Signed | ✅ | ❌ |
| Send Trustpilot Invitation | ✅ | ❌ |
| Blacklist Lead | ✅ | ❌ |

Supervisor sees only **Modify Lease + Cancel Lease**. `[confirmed]`

## PII visibility

| Field (lead 7218178) | admin/manager | supervisor |
|---|---|---|
| SSN (Primary Applicant) | `854-78-4953` (full) `[observation]` | `854-78-4953` (**full**) `[observation]` |
| SSN in the **Leads list column** | full 9-digit (sandbox lead 98086 `500289261`) `[observation]` — `leads.page.ts:16` confirms only that an `SSN` column exists, not that it renders unmasked | n/a (no Leads menu) |
| Date of Birth | `04/07/1979` (full) `[observation]` | full (PII not reduced) `[inferred]` |
| Bank Account # | masked `*********0000` `[observation]` | masked `[inferred]` |
| Card Number | masked `************6909` `[observation]` | masked `[observation]` |

> All cells above are single-session live UI observations (no code/test renders these values) — tagged `[observation]` per Rule #16; the menu/action/PII rows are role-gated UI rendering, confirmable only via live portal.

## Business rules / observations

- RN-01: **The side-menu is permission-gated** — supervisor loses 12 of 18 items, notably the audit/report screens (Modification Report, MMH, FMH, Error Log), config screens (State Configs, Merchant Setting, Program Settings/Groups, Rebate), Blacklist, and Open To Buy. *(evidence: menu extraction per account)* `[confirmed]`
- RN-02: **Lead actions are independently gated** — supervisor cannot Send to Signed, Send Trustpilot, or Blacklist Lead. Blacklist is consistent (no Blacklist menu either). *(evidence: action-bar buttons per account)* `[confirmed]`
- RN-03: **The lead detail page is reachable by direct URL** (`/customers/{leadPk}`) for supervisor even though Leads/Customers is not in their menu — menu hiding is **not** a route guard for this page. *(evidence: page loaded, no access-denied, as supervisor)* `[confirmed]` → **potential access-control observation** worth a security test.
- RN-04: **Full SSN is shown to the supervisor role** on the internal lead page — PII is **not** reduced for supervisor here. The `RU06.26.1.53.0_completeApplicationSecurityPiiDataAccessReduced` reduction either targets lower roles, specific fields, or a different (customer-facing) surface, or is not active in stg. *(evidence: SSN `854-78-4953` visible as supervisor)* `[OBSERVATION]` — do NOT assume the PII task is broken; confirm its exact AC + target role.

## Connections with what we already knew

- Aligns with the AMS memory note that menus/actions are driven by a **permissions JWT** (managed in AMS), not a hardcoded role — an empty-permissions JWT force-logs-out / 403s writes.
- Extends `origination-customer-lead-detail-page.md` RN-03 (PII display) with the supervisor data point.
- Relevant to the PII-reduction task `RU06.26.1.53.0_completeApplicationSecurityPiiDataAccessReduced` — see [origination-customer-lead-detail-page.md](origination-customer-lead-detail-page.md).

## Gaps / to investigate

- **Process blocker [confirmed]:** the `agent` / `readonly` accounts resolve to `DEFAULT_*` creds (`AutotestAgent`, `readonly`, both pw `P@ssw0rdu0wn`) which return **"Invalid credentials"** on the login of **both stg AND sandbox** (2026-06-25). These creds appear stale or the accounts are provisioned only in qa1/qa2 — the framework's `auth.setup.ts` only ever logs in with the `manager` role (which = the admin account in stg). **Lower-role menu + PII visibility therefore could NOT be captured** with the available credentials. To close the PII-reduction AC, first obtain a valid agent/readonly account (AMS-provision one, or use confirmed qa1/qa2 creds).
- **PII surface note [confirmed]:** full SSN is exposed not only on the lead detail page but **directly in the Leads list `SSN` column** (admin, sandbox). Any PII-reduction work must cover the list views (Leads, and the SSN/`Last 4 SSN` columns on Error Log), not just the detail page.
- The exact **AC of the PII-reduction task** (which role + which fields should be masked/hidden).
- Whether the **direct-URL reachability** of `/customers/{leadPk}`, `/merchant/{code}` etc. for a menu-restricted role is intended (route-guard vs menu-hide) — security test candidate.
- Whether `manager` (if separated from `admin` in another env) differs from admin.

**Skills loaded:** `.claude/skills/discovery/SKILL.md`

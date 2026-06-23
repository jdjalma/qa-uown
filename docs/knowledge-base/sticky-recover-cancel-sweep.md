---
title: Sticky Recover Cancel Sweep
domain: knowledge-base
status: stable
volatility: volatile
last_verified: 2026-06-21
sources:
  - env: sandbox (DB tunnel 127.0.0.1:5445 → cluster sandbox, SELECT-only)
  - db: uown_scheduled_task pk=81 StickyRecoverCancelSweep (sql_to_pick_accounts confirmed live)
  - db: account 5084 / sticky pk 36 — recovery_status=CANCELED via the fix, 2026-06-17 20:00:02Z (canonical confirmed run)
  - db: uown_sv_activity_log pk=10961637 (log_type=INTERNAL, created_by=SYSTEM, creation_source=SYSTEM_GENERATED)
  - db: uown_sticky_outbound_log pk=32 source=STICKY_RECOVER (cancel request, response=null)
  - gitlab: uown/backend/svc!1483 "Handle non-cancelable transactions" (StickyRecoverCancelService + StickyRecoverCancelSweepService)
  - gitlab: uown/backend/sticky.io!9 "Add markRecoveryCanceled method"
  - task: gitlab task in uown/backend/svc (description + Gustavo Martins QA comment, milestone RU06.26.1.53.0)
covers: [sticky-recovery, sticky-recover-cancel-sweep, scheduled-task-sweep, account-status-transition, activity-log]
promoted_to: [05-pagamentos, 06-conta-ciclo-vida]
---

# Sticky Recover Cancel Sweep

> Charter: Explore the `StickyRecoverCancelSweep` flow via API/DB + UI periphery to discover the cancel-recovery rules, states, and the `"cannot cancel"` → CANCELED-local branch, and which business rules it touches.
> Origin: GitLab task in uown/backend/svc — milestone RU06.26.1.53.0. MRs **merged**: svc!1483 + sticky.io!9. · Overall confidence: **high** (the fix already executed live in sandbox — see Confirmed Run).

## Confirmed Run — the fix already fired live (sandbox, 2026-06-17 20:00:02Z)

Account **5084** (lead 84496, MSA dunning profile 224) · sticky pk **36** · `sticky_transaction_id=4081a46bce84264957978604a258dd13753005913ff2289069` · cc_transaction_pk **83562**:

- Account `account_status = **PAID_OUT**` (non-ACTIVE ⇒ qualifies for the cancel sweep). `[confirmed]`
- `uown_sticky` pk36 → `recovery_status=**CANCELED**`, `status=**CANCELED**`, `number_of_attempts=3`, `row_updated_timestamp=2026-06-17T20:00:02.486Z`. `[confirmed]`
- `uown_sticky_outbound_log` pk32 `source=**STICKY_RECOVER**` — the cancel call: request `{"stickyTransactionId":"4081…","status":"CANCELED"}`, **`response=null`** (the Sticky 400 body is NOT captured in the outbound response column; it lives only in the activity-log note). `row_created_timestamp=2026-06-17T20:00:00.479Z` (≈2s before the note). `[confirmed]`
- `uown_sv_activity_log` pk10961637 → `log_type=**INTERNAL**`, `created_by=**SYSTEM**`, `creation_source=**SYSTEM_GENERATED**`, `is_hidden=false`, `deleted=false`, `lead_pk=null` (account-level). `notes` = **the exact cancel note** (see below). This was the **first** "marked CANCELED locally" note in sandbox (the fix fired organically here; a second, deliberately-manufactured occurrence followed — see Confirmed Run #2). `[confirmed]`

```
Sticky recovery marked CANCELED locally — Sticky rejected cancel: HTTP 400: {"apierror":{"status":"BAD_REQUEST","stickyErrorCode":400,"timeStamp":"06-17-2026 09:00:02","title":"Cannot cancel transaction"}}
```

> **Cross-rule (links to the Sticky refund flow):** a later **refund** attempt on account 5084 (2026-06-21, by `manager`) failed — `uown_sv_activity_log` pk10994753: *"Sticky refund failed … error=Sticky recovery is not in RECOVERED status"*. ⇒ **a CANCELED recovery cannot be refunded** (refund gate = `RECOVERED`). `[confirmed]`

## Confirmed Run #2 — fresh end-to-end reproduction (sandbox, 2026-06-21 22:35:43Z)

Manufactured live by the cancel-sweep test (CT-M1-LIVE, orchestrator-monitored) — upgrades **AC-01/02/07 from "frozen record" to "fresh-reproduced"**. Account **17213** · sticky pk **35** · `sticky_transaction_id=3204b07c0db0755933066480d2d413471325548301974956e6`:

- Flipped the account **ACTIVE → CANCELLED** via `cancelAccount` (business action; `cancelled_date_time=22:35:40Z`). `[confirmed]`
- Direct Sticky cancel **404'd** (txn already non-cancelable) → the sweep's own cancel then hit `400 "Cannot cancel transaction"` → the fix marked it **CANCELED locally**. `[confirmed]`
- `uown_sticky` pk35 → `recovery_status=CANCELED`, `status=CANCELED` (was `RECOVERY_STARTED`); `number_of_attempts=1`. `[confirmed]`
- `uown_sticky_outbound_log` pk**39** `source=STICKY_RECOVER`, request `{stickyTransactionId, status:"CANCELED"}`, `response=null` — same contract as pk32. `[confirmed]`
- Fresh INTERNAL note `uown_sv_activity_log` pk**10994774** (`INTERNAL`/`SYSTEM`/`SYSTEM_GENERATED`), today's timestamp, same prefix + the full Sticky 400 JSON (`"title":"Cannot cancel transaction"`). `[confirmed]`
- **Teardown verified:** sweep `sql_to_pick_accounts` restored to the snapshot — **no drift** (external snapshot-compare). Account 17213 left **CANCELLED** (no safe automated CANCELLED→ACTIVE reverse) and sticky pk35 permanently **CANCELED** — a **burned candidate** (5 of the 6 manufacture sources remain). `[confirmed]`

## Purpose

`StickyRecoverCancelSweep` is the **counterpart** of `StickyRecoverSweep` in the Sticky.io dunning/recovery model (svc#485; refund = the Sticky refund flow). When the SVC account tied to an in-flight Sticky recovery **leaves `ACTIVE`** (cancelled, charged-off, paid-out, sold…), the recovery should stop — there is no point chasing money for a closed account. The sweep calls Sticky's cancel API to terminate the recovery on the vendor side and sync our state.

**The bug it fixes:** when Sticky **rejects** the cancel (`HTTP 400 "Cannot cancel transaction"` — the txn is already terminal on their side), the old code threw `IllegalStateException`, **left `recovery_status` non-terminal**, and the sweep re-picked the same row **every run** → repeated failures + `[UOWN] Errors in StickyRecoverCancelSweep` emails. The fix: detect that specific rejection and **mark the recovery `CANCELED` locally**, treating the row as successfully processed (no throw, no sweep failure). Actor: scheduled task (Quartz), `created_by=SYSTEM`. **No UI affordance** (Rule #18 exception a — internal sweep).

## Available Operations

| Operation | Available? | Notes |
|---|---|---|
| Trigger the sweep | ✅ API/cron only | `POST /uown/svc/triggerScheduledTask/StickyRecoverCancelSweep`; cron `0 0 17 * * ?` (daily 17:00 UTC), `fixed_rate=30000`, `is_active=true`, native query |
| Cancel a recovery (per row) | ✅ inside sweep | `StickyRecoverCancelService.cancelRecovery()` → Sticky `recovery/cancel` |
| Force-local-cancel | ✅ (new) | ONLY when Sticky error title/message matches `"cannot cancel"` (case-insensitive) |
| UI trigger / button | ❌ | sweep has no portal affordance; outcome is viewable as an INTERNAL activity-log note (agent-facing) |
| Customer notification | ❌ | no Sticky email/SMS template (consistent with #485 BUG-15) `[inferred]` |

## Flow and States (step by step)

1. Cron (or manual trigger) fires `StickyRecoverCancelSweepService.run()`.
2. Selection SQL (**confirmed live**, `uown_scheduled_task` pk81):
   ```sql
   SELECT st.*
   FROM uown_sticky st
   JOIN uown_sv_account a ON a.pk = st.account_pk
   WHERE st.sticky_transaction_id IS NOT NULL
     AND a.account_status <> 'ACTIVE'
     AND st.recovery_status NOT IN ('RECOVERED', 'FAILED', 'CANCELED')
   ```
3. For each picked row → `StickyRecoverCancelService.cancelRecovery()` → Sticky cancel API (request logged to `uown_sticky_outbound_log`, `source=STICKY_RECOVER`).
4. Branch on Sticky response:
   - **success** → recovery canceled normally (no local-cancel-note path observed).
   - **error AND title/message contains `"cannot cancel"` (case-insensitive)** → **mark `CANCELED` locally**, WARN log (sticky pk, txn id, account pk, full Sticky error), INTERNAL activity-log note, return normally (row counts as processed, **not** a sweep failure).
   - **any other error** → throw / ERROR log / sweep failure / included in error correspondence → re-tried next run (unchanged).

**`recovery_status` state machine** (observed values in sandbox: `RECOVERY_STARTED, PENDING, RECOVERED, CANCELED, REFUND_SUBMITTED, REFUND_FAILED, REFUNDED`):

| From → To | Trigger | Allowed? |
|---|---|---|
| RECOVERY_STARTED / PENDING → CANCELED | cancel sweep, Sticky accepts cancel | ✅ |
| RECOVERY_STARTED / PENDING → CANCELED | cancel sweep, **Sticky says "cannot cancel"** | ✅ **local sync** |
| any → CANCELED | cancel sweep, Sticky returns a **different** error | ❌ stays open, retried |
| RECOVERED / FAILED / CANCELED → (anything by cancel sweep) | — | ❌ excluded by selection SQL (terminal for the sweep) |
| CANCELED → REFUNDED | agent tries to refund | ❌ "Sticky recovery is not in RECOVERED status" |

## Business Rules

- **BR-01 — Cancel trigger = account left ACTIVE.** The sweep only acts on recoveries whose account is `account_status <> 'ACTIVE'` (e.g. PAID_OUT, CANCELLED, CHARGED_OFF, SOLD). *(evidence: sweep SQL pk81 live; confirmed run account 5084 = PAID_OUT)* `[confirmed]`
- **BR-02 — Sweep skips terminal recoveries.** `recovery_status NOT IN ('RECOVERED','FAILED','CANCELED')` + `sticky_transaction_id IS NOT NULL`. A recovery with no Sticky txn id, or already terminal, is never picked. *(evidence: sweep SQL pk81)* `[confirmed]` ⚠️ Note: `REFUNDED`/`REFUND_SUBMITTED` are **not** in the exclusion list — a non-active account with a REFUNDED recovery would still be picked (out of scope; see Gaps).
- **BR-03 — Force-local-cancel match is NARROW.** Local CANCELED only when (a) the cancel response is an error AND (b) the error **title or message** contains `"cannot cancel"` (case-insensitive). Any other 400 / generic API failure keeps the old behavior (throw + sweep failure + retry). *(evidence: task description + Gustavo AC; confirmed-run note carries `"title":"Cannot cancel transaction"`)* `[confirmed]`
- **BR-04 — Local-cancel side effects.** On match: `uown_sticky.recovery_status='CANCELED'` (observed `status` also `CANCELED`); **WARN** app log with sticky pk + `sticky_transaction_id` + account pk + full Sticky error; **INTERNAL** activity-log note; **return normally** (row = processed, sweep `Failed` not incremented, no error email). *(evidence: confirmed run — sticky pk36 both fields CANCELED, activity note pk10961637)* `[confirmed]` (status=CANCELED both-fields `[confirmed]`; **`Failed:0` IS DB-observable** via `uown_sweep_logs` `error=NULL`+`number_of_records_processed=1` `[confirmed]`; WARN log-level + no-error-email = app-log only `[inferred]`, see Logic)
- **BR-05 — Activity-log note is SYSTEM/INTERNAL (CLAUDE.md #13).** `log_type=INTERNAL`, `created_by=SYSTEM`, `creation_source=SYSTEM_GENERATED`, account-level (`lead_pk=null`). Note text: `Sticky recovery marked CANCELED locally — Sticky rejected cancel: <full Sticky error>`. *(evidence: pk10961637)* `[confirmed]`
- **BR-06 — Cancel request reuses the STICKY_RECOVER outbound source.** The cancel API call is logged in `uown_sticky_outbound_log` with `source=STICKY_RECOVER` (NOT a new "cancel" source), request `{stickyTransactionId, status:"CANCELED"}`; the error body is **not** persisted in the `response` column (null on the matched-error path). *(evidence: outbound pk32)* `[confirmed]`
- **BR-07 — A CANCELED recovery cannot be refunded.** Refund requires `recovery_status=RECOVERED`; attempting to refund a CANCELED recovery fails with "Sticky recovery is not in RECOVERED status". *(evidence: account 5084 activity pk10994753)* `[confirmed]`

## Logic and Exceptions (DB contract)

- `uown_sticky` (15 cols): the cancel touches `recovery_status` + `status` (→ `CANCELED`) + `row_updated_timestamp`. Keys: `account_pk`, `cc_transaction_pk`, `sticky_transaction_id`, `dunning_profile_id`, `number_of_attempts`.
- `uown_sticky_outbound_log` (13 cols, `source ∈ {STICKY_RECOVER, STICKY_REFUND}`): cancel = `STICKY_RECOVER`.
- `uown_sv_activity_log`: `log_type='INTERNAL'`, `notes` column (note: column is `notes`, plural).
- **Sweep run accounting IS in `uown_sweep_logs`** (NOT `uown_scheduled_task_run`, which is empty for this sweep). Each run writes a row with `sweep_name`, `number_of_records_processed`, `error`, `start_time`/`end_time`. A run that local-cancels a row carries `error=NULL` + `number_of_records_processed=1` (run pk6400914 fresh + pk6393654 organic) = "Total:1, **Failed:0**" → AC-03's "0 failures" is **DB-observable** (CT-A3). The no-op daily crons carry `error="No recoveries found."` + `processed=0`. The helper `waitForStickyCancelSweepRun` reads this table.
- **Only app-log / inbox (not DB):** the literal **WARN** log line (AC-04 log-level) and the **absence of the error email** (the email fires only on `error`, so `error=NULL` strongly implies no email; direct inbox check is manual). The DB-observable proof of the fix = `recovery_status→CANCELED` + the INTERNAL note + the `uown_sweep_logs` row with `error=NULL`.

## Connections with What Was Already Known

- **Confirms** the dunning/recovery model (svc#485, `src/helpers/sticky.helpers.ts`) and the refund knowledge ([[sticky-payment-refund]]): cancel is the "account closed → stop chasing" counterpart of refund.
- **Confirms** `06-conta-ciclo-vida.md` — recovery sweeps key off `account_status` and rating exclusions; here the trigger is simply non-`ACTIVE`.
- **Adds** a new **entry path into the terminal `CANCELED` state**: local sync when Sticky rejects the cancel (previously CANCELED was only reachable on Sticky-accepted cancel).
- **Adds** BR-07 (CANCELED ⇏ refundable) — a cross-feature constraint the refund doc had not yet recorded.
- **Sandbox-only** ([[sticky-refund-tests-sandbox-only]]): qa2/dev2 have the schema but `uown_sticky` is empty + webhooks don't decrypt.

## How to test next time (the PROCESS)

> No candidate exists by default: live probe found **0** non-ACTIVE accounts with an open recovery. All 15 open recoveries sit on **ACTIVE** accounts → a candidate must be **manufactured**.

1. **Sandbox DB tunnel** — `127.0.0.1:5445` (manual kubectl port-forward; ask the user to bring it up; port is reused across envs so verify it points to sandbox via `to_regclass('uown_sticky')` + a known sandbox row). Connect via **config object** (raw password) — building a URL by hand with the raw password breaks auth (special chars). `npx tsx src/scripts/_probe_discovery.ts sandbox 5445` dumps sweep SQL + states + candidates.
2. **Pick a manufacture source** — an ACTIVE account with `recovery_status='RECOVERY_STARTED'` (genuinely in-flight, not refunded). Live examples: sticky pk 35/account 17213, pk 10/17178, pk 9/17174, pk 7/17176, pk 6/17177, pk 2/16623. (Avoid the REFUNDED rows.)
3. **Make it a candidate** — set the account non-ACTIVE via the **business action** `POST /uown/svc/changeAccountStatus` (`{accountPk, newStatus:"CANCELLED", comment, refundAllPayments:false}`) — NOT a raw DB UPDATE. (Flipping account status is a heavy side effect → scope to a throwaway sandbox account and restore after.)
4. **Create the mismatch** — cancel the txn **directly on Sticky sandbox** (`POST processing-hub/v2/api/recovery/cancel` with the `stickyTransactionId`, API-Key from `StickyRecoverConfig`) so the next sweep cancel returns `400 "Cannot cancel transaction"`. Do NOT touch `recovery_status` manually.
5. **Scope + trigger the sweep** — copy `StickyRecoverCancelSweep` via `getScheduledTaskByName`, narrow `sql_to_pick_accounts` to your `st.pk`, `createOrUpdateScheduledTask`, then `POST triggerScheduledTask/StickyRecoverCancelSweep`. **Restore the original SQL after.**
6. **Verify** — `uown_sticky.recovery_status='CANCELED'`; INTERNAL note `Sticky recovery marked CANCELED locally — …`; **`uown_sweep_logs`** newest `StickyRecoverCancelSweep` row has `error=NULL` + `number_of_records_processed>=1` (`Failed:0`); (app log) WARN line + (inbox) no error email. Then **restore** the account status.

## Gaps / To Investigate

- 🟢 **`Failed:0` — RESOLVED**: DB-observable via `uown_sweep_logs` (`error=NULL`+`processed=1`), CT-A3. The **no-error-email** half stays a manual inbox check (inferred from `error=NULL`). `[confirmed / partial]`
- 🟡 **UI rendering of the INTERNAL note** — the `log_type=INTERNAL` note should appear in the Servicing account **Activity Log** tab (agent-facing). Not yet visually confirmed via Playwright MCP (deferred; no credential exposure for a read-only note). Confirm at validation. `[gap — Rule #14/#18 periphery]`
- 🟡 **REFUNDED/REFUND_SUBMITTED not excluded** by the sweep SQL — a non-active account with a REFUNDED recovery would be picked and a cancel attempted. Out of scope, but a candidate product question (does cancel of a refunded recovery error, and does it then hit the "cannot cancel" path?). `[observation]`
- 🟢 **Negative branch (other 400) — NOT a QA gap, covered at unit level.** A non-"cannot cancel" error must keep failing/retrying (must NOT become CANCELED). This is deterministic string-match logic = unit concern; the dev covers it exactly: `cancelRecovery_otherHttp400_throwsIllegalStateException` (`StickyRecoverCancelServiceTest`) + the `throw new IllegalStateException` branch (`StickyRecoverCancelService:58`). A QA E2E mirror would need Sticky fault-injection (not available, and redundant). `[svc-source / dev-unit-test]`
- 🟢 **Match case-insensitive / title-or-message (AC-06)** — exact-case title exercised E2E (CT-M1-LIVE) + unit; casing/message variants live in the sticky.io lib matcher (`StickyCancelApiError.isNonCancelableTransaction`, unit-level, not located in this repo). Unit concern, not QA. `[svc-source / dev-unit-test]`
- 🟢 **Idempotency** — re-running the sweep after a successful local-cancel must be a no-op (row now CANCELED ⇒ excluded by SQL). `[inferred from SQL]`

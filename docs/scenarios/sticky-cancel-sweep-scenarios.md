# Sticky Recover Cancel Sweep — Scenario Analysis

> Demand: uown/backend/svc — *mark recovery CANCELED locally when Sticky returns "Cannot cancel transaction" (400)*. Milestone RU06.26.1.53.0. MRs **merged**: svc!1483 + sticky.io!9.
> Source of rules: live discovery `docs/knowledge-base/sticky-recover-cancel-sweep.md` (sandbox, DB-confirmed) + issue description + Gustavo Martins QA comment.
> **This file is analysis/planning history, NOT a source of pattern.**
>
> **Feature shape:** backend **scheduled sweep**, **no UI affordance** (Rule #18 exception a). The observable outcomes for an agent are (1) the recovery stops reappearing/failing, and (2) an **INTERNAL** activity-log note on the account. Sticky only works in **sandbox** ([[sticky-refund-tests-sandbox-only]]).
>
> Tag legend: `@confirmed` proven live in sandbox · `@code` from merged code/AC only · `@needs-setup` precondition must be manufactured · `@gap` not DB-observable / open question.
> Status: ✅ confirmed live · 🟢 testable in sandbox now · 🟡 needs manufacture · 🔴 needs dev/Sticky support. Severity: 🔴 high · 🟡 medium · 🟢 low.

---

## Acceptance Criteria (extracted)

The issue states the match criteria + proposed behavior; ACs below are derived from them (no explicit AC list in the ticket — the criteria ARE the AC).

| ID | Acceptance Criterion | Source |
|----|----------------------|--------|
| **AC-01** | When the cancel sweep's Sticky cancel call returns an error whose **title OR message contains `"cannot cancel"` (case-insensitive)**, the recovery is marked `recovery_status='CANCELED'` locally. | description "Proposed behavior" + "Match criteria" |
| **AC-02** | On that match, an **INTERNAL** activity-log note is written on the account: `"Sticky recovery marked CANCELED locally — Sticky rejected cancel: <full Sticky error>"`. | description "Suggested implementation" §3 + Gustavo comment §2 |
| **AC-03** | On that match the row is treated as **successfully processed** — the sweep completes with **0 failures** and sends **no** `[UOWN] Errors in StickyRecoverCancelSweep` email. | description "treat the row as successfully processed" + Gustavo comment §3 |
| **AC-04** | On that match a **WARN** log is emitted with sticky pk, `sticky_transaction_id`, account pk, and the full Sticky error. | description "Suggested implementation" §3 |
| **AC-05** | For **any other** cancel error (a different 400, or a generic API failure) the **current behavior is kept** — the row is NOT marked CANCELED; it fails the sweep and is retried next run. | description "Do not force-local-cancel for other 400s" |
| **AC-06** | The match is **case-insensitive** and checks **title or message** (either one). | description "Match criteria" |
| **AC-07** | After a local-cancel the row is **excluded from future runs** (now CANCELED ⇒ out of the selection SQL) — the infinite retry loop stops. | description "Rationale" (stop the retry loop) + sweep SQL |

---

## Coverage Matrix (AC → scenarios)

| Acceptance Criterion | Scenario(s) | Status |
|---|---|---|
| AC-01 — local CANCELED on "cannot cancel" | M-1 (positive, confirmed) | ✅ |
| AC-02 — INTERNAL activity-log note | M-1, L-1 | ✅ |
| AC-03 — Failed:0 / no error email | CT-A3 (`uown_sweep_logs`) | ✅ Failed:0 confirmed (`error=NULL`+processed=1); no-email = manual inbox |
| AC-04 — WARN log with ids + full error | M-1 (app-log) | 🟡 |
| AC-05 — other errors keep failing/retrying | N-1, N-2 (unit-level: covered by dev `cancelRecovery_otherHttp400_throwsIllegalStateException`) | ✅ unit (dev) — E2E mirror needs fault-injection (optional) |
| AC-06 — case-insensitive, title or message | M-2, M-3 (exact case via CT-M1-LIVE; variants = sticky.io lib unit) | ✅/🟡 real case covered; variants unit-level |
| AC-07 — no re-processing after local-cancel | R-1, S-3 | 🟢 |
| (guard) selection: account non-ACTIVE | S-1 | ✅/🟢 |
| (guard) selection: skip terminal / no txn id | S-2, S-3 | ✅/🟢 |
| (cross) CANCELED recovery not refundable | X-1 | ✅ |

No orphan scenarios. Every scenario traces to ≥1 AC or a confirmed guard/cross-rule.

---

## 0. Confirmed live (the fix already fired in sandbox)

| # | Scenario | Result | Sev |
|---|----------|--------|-----|
| M-1 | Sweep cancels a recovery on a non-ACTIVE account; Sticky replies `400 "Cannot cancel transaction"` → **mark CANCELED locally** | ✅ account **5084** (PAID_OUT) / sticky pk **36**: `recovery_status & status = CANCELED`; outbound `STICKY_RECOVER` request `{stickyTransactionId, status:"CANCELED"}` (response null); INTERNAL note (`SYSTEM`/`SYSTEM_GENERATED`) with full Sticky 400 JSON; fired exactly once (2026-06-17 20:00Z) | 🟡 |
| X-1 | A CANCELED recovery is **not refundable** | ✅ later refund on 5084 failed: "Sticky recovery is not in RECOVERED status" (links the refund flow) | 🟡 |

---

## A. Match logic — the core of the fix (`StickyRecoverCancelService.cancelRecovery`)

| # | Scenario | Expected | Trigger | Status | Sev |
|---|----------|----------|---------|--------|-----|
| M-1 | Sticky error title contains "Cannot cancel transaction" | recovery → CANCELED local; INTERNAL note; row processed; Failed not incremented | confirmed-run shape | ✅ live | 🟡 |
| M-2 | Case-insensitive title (`"CANNOT CANCEL ..."`, `"Cannot Cancel ..."`) | still matches → CANCELED local (AC-06) | force Sticky error with varied casing | 🟡 needs-setup | 🟡 |
| M-3 | Match on **message** when title is blank | still matches if the message contains "cannot cancel" (AC-06 — title OR message) | Sticky error with empty title + message text | 🔴 needs Sticky support | 🟡 |
| N-1 | Sticky returns a **different** 400 (e.g. "Invalid transaction id") | **no** local-cancel; row stays open; sweep **fails** the row; retried next run (AC-05) | force a non-matching 400 | 🟡 needs-setup | 🔴 |
| N-2 | Sticky returns a **generic/5xx** API failure or timeout | **no** local-cancel; behaves as N-1 (AC-05) | network/5xx fault injection | 🔴 needs support | 🟡 |
| N-3 | Sticky **accepts** the cancel (2xx) | recovery canceled the normal way; **no** "marked CANCELED locally" note (control path) | candidate whose Sticky txn is still cancelable | 🟡 needs-setup | 🟢 |

## B. Selection guards — which rows the sweep touches (`sql_to_pick_accounts`, confirmed live)

| # | Scenario | Expected | Trigger | Status | Sev |
|---|----------|----------|---------|--------|-----|
| S-1 | Account still **ACTIVE** with an open recovery | **not** picked (sweep ignores) — confirmed: 15 open recoveries on ACTIVE accounts, 0 candidates | leave account ACTIVE | ✅ live | 🟢 |
| S-2 | Recovery already **RECOVERED / FAILED / CANCELED** | **not** picked (terminal for the sweep) | inspect terminal rows | ✅ live | 🟢 |
| S-3 | Recovery with **`sticky_transaction_id` IS NULL** | **not** picked (no Sticky txn to cancel) | row without txn id | 🟢 testable | 🟢 |
| S-4 | Account non-ACTIVE in **various** statuses (PAID_OUT / CANCELLED / CHARGED_OFF / SOLD) | all qualify (`account_status <> 'ACTIVE'`) — confirmed for PAID_OUT (5084) | flip account to each status | ✅ PAID_OUT / 🟡 others | 🟢 |
| S-5 | ⚠️ Non-ACTIVE account with a **REFUNDED / REFUND_SUBMITTED** recovery | **IS** picked (those states are NOT in the exclusion list) → a cancel is attempted on a refunded recovery — out of scope, candidate product question | non-active acct w/ REFUNDED recovery | 🟡 observation | 🟡 |

## C. Idempotency & sweep accounting

| # | Scenario | Expected | Trigger | Status | Sev |
|---|----------|----------|---------|--------|-----|
| R-1 | Re-run the sweep right after a local-cancel | the row is now CANCELED → **excluded** by the SQL → **no** re-processing, **no** repeated error email (AC-07 — the bug this fixes) | trigger sweep twice | 🟢 testable | 🔴 |
| R-2 | Mixed batch: one "cannot cancel" row + one genuinely-cancelable row + one non-matching-error row | matched → CANCELED (Failed 0 contribution); cancelable → CANCELED; non-matching → counts as Failed (1) and emails | manufacture 3 rows | 🟡 needs-setup | 🟡 |
| R-3 | `number_of_attempts` after local-cancel | confirmed attempts=3 persisted on 5084; local-cancel does not reset it | inspect | ✅ live | 🟢 |

## D. Activity log & observability (CLAUDE.md #13)

| # | Scenario | Expected | Status | Sev |
|---|----------|----------|--------|------|
| L-1 | INTERNAL note content & metadata | `log_type=INTERNAL`, `created_by=SYSTEM`, `creation_source=SYSTEM_GENERATED`, account-level; text carries the **full** Sticky error JSON (AC-02) | ✅ live | 🟡 |
| L-2 | Agent sees the note in the Servicing **Activity Log** tab | the INTERNAL note renders for an agent viewing the account (UI periphery — not yet visually confirmed) | 🟡 gap (Rule #14) | 🟢 |
| L-3 | `Failed:0` (AC-03) | ✅ **DB-observable in `uown_sweep_logs`** (`error=NULL`+`number_of_records_processed>=1`), CT-A3. NOT `uown_scheduled_task_run` (empty). The WARN log-level (AC-04) + no-error-email remain app-log/inbox (manual). | ✅/🟡 | 🟡 |

## E. Cross-feature (links to the refund flow)

| # | Scenario | Expected | Status | Sev |
|---|----------|----------|--------|------|
| X-1 | Refund a recovery that the sweep marked CANCELED | blocked — "Sticky recovery is not in RECOVERED status" (refund gate = RECOVERED) | ✅ live (5084) | 🟡 |

---

## Gherkin scenarios

```gherkin
Feature: Sticky Recover Cancel Sweep marks non-cancelable recoveries CANCELED locally

  Background:
    Given a Sticky recovery exists with a sticky_transaction_id
    And the recovery's account is no longer ACTIVE (e.g. PAID_OUT, CANCELLED, CHARGED_OFF, SOLD)
    And the recovery_status is open (not RECOVERED, FAILED or CANCELED)
    # so it is selected by StickyRecoverCancelSweep

  # ──────────────── Negatives first (AC-05) ────────────────

  @code @needs-setup @critical
  Scenario: A non-"cannot cancel" error keeps the old behavior
    Given Sticky will reject the cancel with an error that does NOT mention "cannot cancel"
    When the cancel sweep runs over the recovery
    Then the recovery_status stays open (not CANCELED)
    And no "marked CANCELED locally" note is written
    And the sweep counts the row as a failure and sends its error correspondence
    And the recovery is picked again on the next run

  @code @needs-setup
  Scenario: A generic Sticky API failure keeps the old behavior
    Given Sticky responds to the cancel with a generic API failure or timeout
    When the cancel sweep runs over the recovery
    Then the recovery_status stays open (not CANCELED)
    And the sweep counts the row as a failure
    And the recovery is retried on the next run

  # ──────────────── Match logic (AC-01, AC-02, AC-06) ────────────────

  @confirmed @critical
  Scenario: Sticky says the transaction cannot be canceled
    Given Sticky rejects the cancel with "400 Cannot cancel transaction"
    When the cancel sweep runs over the recovery
    Then the recovery_status becomes CANCELED locally
    And an INTERNAL activity-log note is written on the account reading "Sticky recovery marked CANCELED locally — Sticky rejected cancel:" followed by the full Sticky error
    And the row is treated as successfully processed

  @code @needs-setup
  Scenario Outline: The "cannot cancel" match ignores casing and matches title or message
    Given Sticky rejects the cancel with an error whose <field> is "<text>"
    When the cancel sweep runs over the recovery
    Then the recovery_status becomes CANCELED locally
    And an INTERNAL "marked CANCELED locally" note is written on the account

    Examples:
      | field   | text                       |
      | title   | Cannot cancel transaction  |
      | title   | CANNOT CANCEL TRANSACTION  |
      | title   | cannot cancel              |
      | message | Transaction cannot cancel  |

  # ──────────────── Selection guards (BR-01, BR-02) ────────────────

  @confirmed
  Scenario: An ACTIVE account's open recovery is left alone
    Given the recovery's account is still ACTIVE
    When the cancel sweep runs
    Then the recovery is not selected and its status is unchanged

  @confirmed
  Scenario: An already-terminal recovery is left alone
    Given the recovery_status is already RECOVERED, FAILED or CANCELED
    When the cancel sweep runs
    Then the recovery is not selected

  @code
  Scenario: A recovery without a Sticky transaction id is left alone
    Given the recovery has no sticky_transaction_id
    When the cancel sweep runs
    Then the recovery is not selected

  # ──────────────── Idempotency (AC-07) ────────────────

  @code @needs-setup @critical
  Scenario: The retry loop stops after a local-cancel
    Given the sweep has just marked the recovery CANCELED locally
    When the cancel sweep runs again
    Then the recovery is not selected again
    And no further error correspondence is sent for it

  # ──────────────── Cross-feature (BR-07) ────────────────

  @confirmed
  Scenario: A locally-canceled recovery cannot be refunded
    Given the recovery was marked CANCELED locally by the sweep
    When an agent attempts to refund the related payment
    Then the refund is rejected because the recovery is not in RECOVERED status
```

---

## Notes for execution / implementation

- **No candidate exists by default** — live probe found **0** non-ACTIVE accounts with an open recovery (all 15 open recoveries are on ACTIVE accounts). A test must **manufacture** one: pick an ACTIVE account with `recovery_status='RECOVERY_STARTED'` (e.g. sticky pk 35/acct 17213, pk 10/17178, pk 9/17174, pk 7/17176, pk 6/17177, pk 2/16623), set the account non-ACTIVE via **`POST /uown/svc/changeAccountStatus`** (business action, not a raw UPDATE), then cancel the txn **directly on Sticky sandbox** so the sweep's cancel returns "Cannot cancel transaction". Scope the sweep SQL to the test row, trigger it, then **restore** account status + sweep SQL.
- **Reusing an in-flight recovery is a justified test-data exception** (Rule #9): a RECOVERY_STARTED session is not creatable via automation (#485 never produced one organically).
- **`Failed:0` IS DB-observable in `uown_sweep_logs`** (`error=NULL`+`number_of_records_processed>=1`), CT-A3 — NOT in `uown_scheduled_task_run` (empty for this sweep). Only the WARN log-level and the absence of the error email are app-log/inbox (manual).
- **DB-observable proof of the fix** = `uown_sticky.recovery_status → CANCELED` + the INTERNAL activity-log note.
- **Account 5084 / sticky pk 36** is the canonical already-CANCELED record (read-only regression reference); do NOT re-cancel it.

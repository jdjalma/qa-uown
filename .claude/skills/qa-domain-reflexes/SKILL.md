---
name: qa-domain-reflexes
description: Load when the agent is going to create, validate, or debug a test that touches signing, payment, status transition, vendor callback, refund, recovery, or any business action — provides a mandatory checklist of post-action validations (audit log, activity log, rating letter, DB notes). No log = nothing happened.
disable-model-invocation: true
---

# QA Domain Reflexes — UOWN Leasing

> **Purpose:** a catalog of validations that an experienced UOWN QA performs **automatically** after each system action. These are not generic UX heuristics — they are domain reflexes: "action X always implies checking Y, because the real user does it."
>
> **How to use (agents):** `qa-planner` MUST load this file before closing the spec. For each scenario step, consult the catalog — if the action has a listed reflex, include the validations in the spec as mandatory steps.
>
> **How to feed it (humans):** every time a bug escapes because an obvious validation was missing, add it here. Without feeding, this file dies.
>
> **Authority boundary** (`docs/_docs-conventions.md` §7): this skill covers **HOW TO VALIDATE** — a checklist of reflexes per action type. For product rules (when each action generates a log, which tables, which enums), run `node scripts/docs-tooling.mjs resolve <topic>` (e.g., `cc-payments`, `pipeline`, `gowsign-routing`) before adding a reflex that depends on canonical behavior.

---

## Convention

Each entry follows the format:

```
### Action
- [ ] Validation 1
- [ ] Validation 2
**Why (user perspective):** the reason the real user checks this
```

---

## 1. Payment / Charge

- [ ] Amount charged == amount agreed (principal + interest + fees + taxes broken down)
- [ ] Account balance before vs. after (diff == amount paid)
- [ ] Rating letter updated (value and date)
- [ ] Installment/invoice status transitioned (pending → paid)
- [ ] Transaction record created in the DB with the correct payment_method
- [ ] Audit log generated (user, timestamp, action)
- [ ] Confirmation email/notification sent
- [ ] Next due date recalculated if applicable

**Why:** the user checks their statement, wants proof of payment, and checks future charges.

---

## 2. Payment Agreement

- [ ] Rating letter **before** creating the agreement
- [ ] Rating letter **after** creating the agreement
- [ ] New payment schedule generated (N installments with correct values)
- [ ] Sum of the new installments == agreed balance
- [ ] Account status updated (e.g., "On Payment Plan")
- [ ] Agreement document available for download
- [ ] Audit log
- [ ] Email with the agreement terms

**Why:** the user keeps the agreement on paper, checks the values installment by installment, and uses the rating letter for disputes.

---

## 3. Payoff / Settlement

- [ ] Rating letter **before** the payoff
- [ ] Rating letter **after** the payoff (zeroed balance)
- [ ] Account balance == 0
- [ ] Final status = "Paid Off" / "Closed"
- [ ] Settlement document (payoff letter) generated and accessible
- [ ] Audit log
- [ ] Payoff confirmation email
- [ ] Future installments canceled/removed from the schedule

**Why:** the user needs proof of payoff for the credit bureau, refinancing, or a future dispute.

---

## 4. Credit Application / Origination

- [ ] Decision (approved/denied/pending) persisted
- [ ] Score/tier calculated and saved
- [ ] Audit log of the decision (rule applied, timestamp, user/system)
- [ ] Correct status transition (submitted → underwriting → approved/denied)
- [ ] Email to the customer with the result
- [ ] If approved: contract/lease document generated
- [ ] If denied: reason codes persisted (regulatory — ECOA/FCRA)

**Why:** regulatory auditing requires a complete trail; the user tracks the status and needs the reason for the denial.

### sendApplication — required fields by client type

| Client Type | mainNextPayDate required? | Optional fields |
|---|---|---|
| PAY_POSSIBLE | **NO** — YAML config excludes `mainNextPayDate` | mainPayFrequency, mainLastPayDate, mainEmploymentDuration |
| SYNCHRONY | **NO** — YAML config excludes `mainNextPayDate` | mainPayFrequency, mainLastPayDate, mainEmploymentDuration |
| DANIELS_JEWELERS | **YES** by default (requires cherry-pick `62e2fc20` in `uown-qa1` + pod restart to remove) | — |
| Any other without explicit config | **YES** — default of `LosRequestMessageConstraintValidatorConfig` | — |

**Reflex:** when creating a sendApplication CT for PAY_POSSIBLE or SYNCHRONY, include a scenario that omits `mainNextPayDate`, `mainPayFrequency`, `mainLastPayDate` and `mainEmploymentDuration` — it validates that the YAML config is correct and that the backend does not require unnecessary fields. If it returns 400 `mainNextPayDate is required`, the cause is the YAML config in the `uown-<env>` branch (not the DB, not the `ConfigurationManagement` API).

---

## 5. Refund / Chargeback / Reversal

- [ ] Reversed amount == original amount (or partial as requested)
- [ ] Rating letter updated
- [ ] Account balance adjusted correctly
- [ ] Original transaction status = "refunded" / "reversed"
- [ ] New reversal transaction record created
- [ ] Audit log (who authorized, reason)
- [ ] Notification to the customer

**Why:** the user checks whether the refund landed in their bank account and whether the rating letter reflects it.

---

## 6. Late Fee / Penalty

- [ ] Amount applied follows the contract rule (percentage or flat)
- [ ] Applied to the correct installment (not the wrong one)
- [ ] Rating letter updated
- [ ] Audit log (rule applied, grace period respected)
- [ ] Not applied twice for the same delinquency

**Why:** fees generate frequent disputes; QA always checks whether it was applied correctly and only once.

---

## 7. Cancellation / Void

- [ ] Status = canceled/voided
- [ ] Rollback of balances (if there was a charge)
- [ ] Rating letter updated
- [ ] Future installments removed from the schedule
- [ ] Audit log (who canceled, reason)
- [ ] Notification to the customer
- [ ] Related documents (contracts) marked as void

**Why:** the user checks that they will not be charged after canceling.

---

## 8. Merchant Creation / Edit

- [ ] Correct initial status (active/pending approval)
- [ ] Permissions and limits applied
- [ ] Audit log
- [ ] Welcome/activation email
- [ ] Tax data (EIN, W9) persisted
- [ ] Correct visibility in the portals (Origination, AMS)

**Why:** a misconfigured merchant = cascading problems in credit applications.

---

## 9. Internal User Creation / Edit

- [ ] Permissions/role applied
- [ ] Access to the correct portals
- [ ] Audit log (who created it, role assigned)
- [ ] Welcome email with password reset
- [ ] MFA configurable

**Why:** access control is a focus of SOC/PCI auditing.

---

## 10. Login / Authentication

- [ ] Session created with correct expiration
- [ ] Access log (IP, user agent, timestamp)
- [ ] Login failures recorded (brute force detection)
- [ ] MFA required when configured
- [ ] Redirect to the correct URL post-login

**Why:** compliance + security; audits require an access trail.

---

## 11. Any Mutation (generic — CRUD)

Apply ALWAYS when there is no more specific reflex:

- [ ] Audit log generated (who, when, what changed, old → new)
- [ ] `updated_at` updated
- [ ] `updated_by` filled in
- [ ] Required fields do not accept null/empty

**Why:** regulatory traceability is non-negotiable in fintech.

---

## 12. Document Generation (contract, agreement, payoff letter)

- [ ] Document generated and persisted (S3/storage)
- [ ] Download link works
- [ ] PDF contains correct data (name, values, dates, signatures)
- [ ] Generation log
- [ ] Versioning if the document is regenerated

**Why:** the user downloads and keeps it; a wrong document becomes a legal dispute.

---

## 13. Email / Notification Sending

- [ ] Email dispatched to the correct address
- [ ] Correct template (confirmation vs. reminder vs. collection)
- [ ] Dynamic data filled in (name, value, date)
- [ ] Send log (sent, delivered, bounced)
- [ ] Email links point to the correct environment

**Why:** the user acts based on the email; a wrong email = a wrong action.

---

## 14. Merchant Program Activation / Deactivation (Origination)

- [ ] `is_active` derived from the dates: `activation_date <= today AND (deactivation_date IS NULL OR deactivation_date > today)` — do NOT trust the `is_active` boolean field directly
- [ ] `uown_merchant_activity_log` contains an entry with `log_type = 'PROGRAM_DATA_CHANGE'` and the correct `program_pk`
- [ ] `uown_merchant_to_program.is_active` reflects the calculated state after a sweep or API call
- [ ] Propagation to the merchant portal: the Programs section displays the correct status badge (active/inactive)
- [ ] Propagation to existing applications: `uown_los_lead.merchant_program_pk` still points to the program; an inactive program does NOT prevent viewing historical applications
- [ ] The `ProgramActivationDeactivationSweep` sweep processes the dates at the correct turnover (activation = day of the `activation_date`; deactivation = day of the `deactivation_date`)
- [ ] Backend validation: activating with `activation_date > deactivation_date` returns an error (expected 400 — BUG-01 in qa2 returns 500)
- [ ] Dates prevail over the flag: the Source of Truth is `activation_date`/`deactivation_date`, not the `is_active` boolean

**Why:** the program config defines which financing programs are available to a merchant. An inactive program should block new applications but not invalidate history.

---

## Guiding checklist for `qa-planner`

When assembling each scenario, for each action step ask:

1. Is this action in the catalog above?
2. If yes → copy the validations from the corresponding block as scenario steps.
3. If it doesn't fit any specific block → apply block **11. Any Mutation**.
4. If the action combines multiple blocks (e.g., payment within an agreement) → apply both.

Mark in the spec which validations came from this catalog with the tag `[reflex]` to make human review easier.

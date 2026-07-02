---
operation: payment-decline-email
last-reviewed: 2026-07-02
last-reviewed-sha: e4713f2
covers:
  - tests/e2e/servicing/RU07.26.1.54.0_updatePaymentDeclineEmailTemplate_565.spec.ts
  - src/helpers/email.helpers.ts
  - src/helpers/settled-in-full.helpers.ts
  - src/helpers/database.helpers.ts
  - src/api/bodies/payment-arrangement.body.ts
  - src/data/test-cards.ts
  - docs/business-rules/10-portal-comunicacoes.md
---

# Oracle BDD — Payment Decline Email (content & rendering)

> **Trigger:** any operation whose outcome is a Payment Decline email being generated/rendered for a customer — i.e. a **failed servicing payment** (declined CC SALE or RETURNED ACH) on a FUNDED account, and the subsequent **verification of the rendered email content** in `uown_email_queue.email_body` and/or the delivered message via IMAP. Covers both brands (`PaymentDeclineEmail` for UOwn, `KORNERSTONE_PaymentDeclineEmail` for Kornerstone) and both copy variants (settlement vs non-settlement). **Viewing/verifying the rendered email is itself an operation (rule #19 — no read-only exemption).** Running the task spec IS performing the operations it exercises.
>
> **Staleness check:**
> ```bash
> git log e4713f2..HEAD -- \
>   tests/e2e/servicing/RU07.26.1.54.0_updatePaymentDeclineEmailTemplate_565.spec.ts \
>   src/helpers/email.helpers.ts \
>   src/helpers/settled-in-full.helpers.ts \
>   src/helpers/database.helpers.ts \
>   src/api/bodies/payment-arrangement.body.ts \
>   src/data/test-cards.ts \
>   docs/business-rules/10-portal-comunicacoes.md
> ```
> No output = oracle current. With output, prepend `[BDD MAY BE STALE]` to every PASS and re-review.
>
> **Source grounding:** the exact strings below come from the ticket capture `RU07.26.1.54.0_updatePaymentDeclineEmailTemplate_565.md` (Email Details table + Scope + AC9 comment). The correspondence mechanism (`CorrespondenceService` brand routing, `PaymentReceiptService` trigger, `TemplateManagementService` DB reload, `KORNERSTONE_` prefix, from-address per brand) is grounded in `docs/business-rules/10-portal-comunicacoes.md §29`. The `uown_email_queue` schema and the `storage.googleapis.com/uown/` image allow-list come from [[email-templates-catalog]] §1-§3.
>
> **[HYPOTHESIS] to confirm in discovery/implementation:** `template_name` literals are stated by the ticket (`PaymentDeclineEmail`, `KORNERSTONE_PaymentDeclineEmail`) but not yet DB-confirmed via probe on this feature. The exact trigger path (which servicing decline synchronously enqueues the email vs which requires a sweep/listener, and whether the decline email is even queued for a synchronous CC SALE decline vs only for ACH RETURNED) is NOT confirmed — resolve via a `discovery` pass (rule #18: UI → API → DB) before hard-asserting the trigger. The **content checkpoints below stand regardless of trigger path** — once an email row exists, its rendered body is deterministic from the template.

---

## CT-01 — [positive] UOwn non-settlement payment decline renders the new HubSpot design

```gherkin
Feature: Payment Decline email content
  As a UOwn leasing customer
  In order to know a payment failed and act on it
  The customer must receive the redesigned Payment Decline email with correct branding and copy

Scenario: [positive] UOwn decline email renders the new design with populated fields
  Given a FUNDED UOwn account whose customer has a known first name and email
  And no active SETTLEMENT payment arrangement on the account
  When a servicing payment on the account is declined
  Then the customer receives a Payment Decline email whose subject is exactly "Action Needed: Issue Processing Your Recent Payment"
  And the greeting reads "<FirstName>, we had trouble processing your payment." with the customer's real first name
  And the body shows the non-settlement copy "Unfortunately, we were unable to process your most recent payment."
  And the body shows the non-settlement copy "To keep your account in good standing, please make a payment as soon as possible."
  And the "Make a payment" call to action links to https://portal.uownleasing.com followed by the customer portal parameters
  And the UOwn support phone (877) 357-5474 is shown
  And the closing reads "Thank you for choosing Uown."
```

### Oracle

| Checkpoint | Expected | Source |
|---|---|---|
| Email row exists | row in `uown_email_queue` WHERE `account_pk=:acct AND template_name='PaymentDeclineEmail' AND row_created_timestamp >= :triggerTs`, `status IN ('SENT','STORED')`, `email_body_type='HTML'` | email-templates-catalog §1-§2; ticket Scope |
| Subject exact | `subject == "Action Needed: Issue Processing Your Recent Payment"` | ticket Email Details (AC4) |
| Greeting + firstName | `email_body` contains `"<customerFirstName>, we had trouble processing your payment."` with the real first name interpolated (Thymeleaf `${CommonDataPojo.customerFirstName}`) | ticket Scope §1 (AC3) |
| Non-settlement copy A | `email_body` contains `"Unfortunately, we were unable to process your most recent payment."` and does NOT contain `"settlement payment"` | AC9 regression corollary |
| Non-settlement copy B | `email_body` contains `"To keep your account in good standing, please make a payment as soon as possible."` and does NOT contain `"settlement offer"` | AC9 regression corollary |
| Portal CTA link | `email_body` `href` starts with `https://portal.uownleasing.com` + the `customerPortalParameters` tracking suffix | ticket Scope §1 (AC3) |
| Support phone | `email_body` contains `(877) 357-5474` | ticket Email Details |
| Closing | `email_body` contains `"Thank you for choosing Uown."` | ticket Email Details |
| Image allow-list | every `<img src>` and CSS `background(-image)` URL matches `^https://storage\.googleapis\.com/uown/` (negative regex must find zero off-allow-list URLs) | email-templates-catalog §3 |
| To address | `to_email_addresses` == the customer's email | email-templates-catalog §1 |

---

## CT-02 — [positive] Kornerstone non-settlement decline renders KS branding

```gherkin
Scenario: [positive] Kornerstone decline email renders KS branding and KS contact details
  Given a FUNDED Kornerstone account (merchant ref_merchant_code starts with "KS") whose customer has a known first name and email
  And no active SETTLEMENT payment arrangement on the account
  When a servicing payment on the account is declined
  Then the customer receives a Payment Decline email rendered with the Kornerstone logo and KS footer
  And the subject is exactly "Action Needed: Issue Processing Your Recent Payment"
  And the Kornerstone support phone (888) 521-5111 is shown
  And the "Make a payment" call to action links to the Kornerstone customer portal URL followed by the customer portal parameters
  And the closing thanks the customer for choosing Kornerstone
```

### Oracle

| Checkpoint | Expected | Source |
|---|---|---|
| Email row exists (KS template) | row in `uown_email_queue` WHERE `template_name='KORNERSTONE_PaymentDeclineEmail'` (case-sensitive), `status IN ('SENT','STORED')`, `email_body_type='HTML'` | 10-portal-comunicacoes §29 (`KORNERSTONE_` prefix); ticket Scope §2 |
| Subject exact | `"Action Needed: Issue Processing Your Recent Payment"` | ticket Email Details (AC4) |
| KS support phone | `email_body` contains `(888) 521-5111` (NOT the UOwn number) | ticket Scope §2 (AC2) |
| Portal CTA (KS) | `href` uses `${CommonDataPojo.customerPortalUrl}` + `${CommonDataPojo.customerPortalParameters}` — resolves to the Kornerstone portal host, NOT `portal.uownleasing.com` | ticket Scope §2 |
| Closing | `email_body` contains the Kornerstone closing (e.g. `"Thank you for choosing Kornerstone"`) | ticket Scope §2 |
| KS branding assets | logo/social/contact images present and on the approved GCS allow-list; no UOwn-specific logo leaks into the KS body | ticket Scope §2; email-templates-catalog §3 |
| From address (brand) | `from_email_address` is the KS sender (`CS@kornerstoneliving.com` in prod) — brand-correct, not the UOwn sender | 10-portal-comunicacoes §29 |

---

## CT-03 — [positive] First-name fallback renders "Customer" when the name is empty

```gherkin
Scenario: [positive] decline email falls back to "Customer" when first name is empty
  Given a FUNDED account whose customer first name is empty
  When a servicing payment on the account is declined
  Then the greeting reads "Customer, we had trouble processing your payment."
  And no empty placeholder or raw "${...}" token appears in the rendered body
```

### Oracle

| Checkpoint | Expected | Source |
|---|---|---|
| Fallback greeting | `email_body` contains `"Customer, we had trouble processing your payment."` | ticket Scope §1 (fallback `"Customer"`, same as `decline-email.html`) |
| No raw token / empty placeholder | `email_body` does NOT contain `${` nor `[FIRST NAME]` nor an empty greeting `", we had trouble"` (BUG-01 empty-placeholder class, rule #14) | ui-first-principle (Daniel's Jewelers CA case) |

---

## CT-04 — [positive] Settlement-arrangement decline swaps to settlement copy (AC9)

```gherkin
Scenario: [positive] a decline on a SETTLEMENT arrangement payment uses settlement wording
  Given a FUNDED account with an active payment arrangement of type SETTLEMENT
  When the payment tied to that SETTLEMENT arrangement is declined
  Then the body shows "Unfortunately, we were unable to process your settlement payment."
  And the body shows "To keep your settlement offer in good standing, please make a payment as soon as possible."
  And no other messaging in the email changes (subject, greeting, CTA, phone, closing unchanged from CT-01/CT-02)
```

### Oracle

| Checkpoint | Expected | Source |
|---|---|---|
| Settlement copy A | `email_body` contains `"Unfortunately, we were unable to process your settlement payment."` | AC9 comment (Sowjanya, 2026-06-19) |
| Settlement copy B | `email_body` contains `"To keep your settlement offer in good standing, please make a payment as soon as possible."` | AC9 comment |
| Original copy absent | `email_body` does NOT contain `"your most recent payment."` nor `"your account in good standing"` (mutually exclusive with CT-01) | AC9 comment |
| Everything else identical | subject, greeting, CTA host, support phone, closing match the brand's CT-01/CT-02 expectations (only the two copy lines differ) | AC9 ("All other messaging unchanged") |
| Arrangement precondition | `uown_sv_payment_arrangement` row for the account has `arrangement_type='SETTLEMENT'` and is linked (`payment_arrangement_pk`) to the declined `uown_sv_credit_card_transaction`/`uown_sv_achpayment` | payment-arrangement oracle; appendix-d §D.20 (`ArrangementType`) |

---

## CT-05 — [negative] NORMAL-arrangement decline keeps the original copy (regression guard on the exact AC9 condition)

```gherkin
Scenario: [negative] a decline on a NON-settlement arrangement keeps the original wording
  Given a FUNDED account with an active payment arrangement of type NORMAL
  When the payment tied to that NORMAL arrangement is declined
  Then the body shows "Unfortunately, we were unable to process your most recent payment."
  And the body shows "To keep your account in good standing, please make a payment as soon as possible."
  And the body does NOT contain "settlement payment" or "settlement offer"
```

### Oracle

| Checkpoint | Expected | Source |
|---|---|---|
| Arrangement precondition | linked `uown_sv_payment_arrangement.arrangement_type='NORMAL'` (an arrangement EXISTS but is not SETTLEMENT — this is the exact boundary of the AC9 `getArrangementType() == SETTLEMENT` check) | AC9 condition wording |
| Original copy present | both non-settlement lines present (as CT-01) | AC9 regression corollary |
| Settlement copy absent | `email_body` contains neither `"settlement payment"` nor `"settlement offer"` | AC9 regression corollary |

> **Why CT-05 exists distinct from CT-01:** CT-01 declines with *no arrangement at all*; CT-05 declines with a *NORMAL* arrangement present. AC9 keys off `arrangement.getArrangementType() == SETTLEMENT`, so the failure mode "any arrangement flips to settlement copy" is only caught by exercising a NORMAL arrangement explicitly.

---

## CT-06 — [positive] Preview text + subject line render in supported clients

```gherkin
Scenario: [positive] subject and preview text display correctly
  Given a rendered Payment Decline email (either brand)
  When the customer views the message list in a supported client (Gmail, Outlook)
  Then the subject line reads "Action Needed: Issue Processing Your Recent Payment"
  And the preview/preheader text reads "Ensure your account stays active by resolving payment issues."
```

### Oracle

| Checkpoint | Expected | Source |
|---|---|---|
| Subject | exact match `"Action Needed: Issue Processing Your Recent Payment"` | AC4 |
| Preview/preheader | `email_body` contains the hidden preheader `"Ensure your account stays active by resolving payment issues."` | ticket Email Details (AC5) |
| Rendered layout (visual) | opened via IMAP-fetched HTML rendered in a browser at desktop (1440) and mobile (375) — logo, CTA button, footer visible and not broken/overlapping (AC6); rendering CANNOT be inferred from the DB body alone (rule #14) | ui-first-principle; AC6 |

---

## CT-07 — [positive] Decline trigger still fires the email (AC7) + activity log (rule #13)

```gherkin
Scenario: [positive] the payment-failure flow still enqueues PaymentDeclineEmail
  Given a FUNDED account
  When a servicing payment on the account is declined
  Then a PaymentDeclineEmail (or KORNERSTONE_ variant) row is enqueued and dispatched
  And an activity log records the payment-decline event
```

### Oracle

| Checkpoint | Expected | Source |
|---|---|---|
| Trigger unchanged (AC7) | exactly one new decline-email row per decline event; `template_name` is the brand-correct literal; no code-change regressions in send behavior | AC7 |
| Activity log (rule #13) | the payment-decline business action writes a note — LOS decline pre-funding → `uown_los_lead_notes` (`lead_pk`); **post-funding servicing payment → `uown_sv_activity_log` (`account_pk`)** (the account-centric mnemonic). Assert presence + content of the decline/attempt entry | activity-log-validation (lead_pk vs account_pk mapping); rule #13 |
| DB reload (AC8) | template row present for BOTH companies after `TemplateManagementService` reload — the new HTML is what renders, not the legacy layout | AC8; ticket Scope §3 |

> **[HYPOTHESIS]** the precise activity-log table/prefix for a servicing CC/ACH decline is not confirmed on this feature — resolve during the `discovery`/implementation pass. Do not hard-assert the exact `notes` prefix until DB-confirmed; assert presence first, then tighten.

---

## Copy decision table (the core of AC9 + the redesign)

| Condition | Arrangement present? | `arrangement_type` | Line A rendered | Line B rendered |
|---|---|---|---|---|
| CT-01 (UOwn) / CT-02 (KS) | No | — | "...your most recent payment." | "...your account in good standing..." |
| CT-05 | Yes | `NORMAL` | "...your most recent payment." | "...your account in good standing..." |
| CT-04 | Yes | `SETTLEMENT` | "...your settlement payment." | "...your settlement offer in good standing..." |

Only the `SETTLEMENT` column swaps copy; every other field (subject, greeting, CTA, phone, closing, branding) is invariant across all three columns.

## Open questions (for dev / discovery)
- **Q1 (trigger path):** does a synchronous servicing CC SALE decline enqueue `PaymentDeclineEmail`, or is the decline email only queued on ACH RETURNED / via a sweep? Confirms which setup path CT-01/04/05 must use. Resolve with a discovery pass (UI → API → DB).
- **Q2 (template_name literals):** DB-confirm `PaymentDeclineEmail` / `KORNERSTONE_PaymentDeclineEmail` via probe (case-sensitive) before hard-asserting.
- **Q3 (SETTLEMENT + declined card):** can a SETTLEMENT arrangement be created with a card that then declines (so the linked payment fails) purely via the existing Make Payment modal / API, or does forcing the linked-payment decline require an authorized `UPDATE ... RETURNED` (Exception 3)? This gates whether AC9 can be tested with zero DB mutation.
- **Q4 (activity-log table/prefix):** exact `uown_sv_activity_log` vs `uown_los_lead_notes` target and the `notes` prefix for a servicing decline event.

# Payment Flows — detailed endpoints, DB tables, enums, and allocation strategy

> Extracted from SKILL.md. For overview, lease state machine, and principles, see [../SKILL.md](../SKILL.md).

## Endpoints (complete map)

| Action | Endpoint | Client | Notes |
|--------|----------|--------|-------|
| Authorize CC on contract | `POST /uown/los/authorizeCreditCard` | `CreditCardClient.authorizeCreditCard` | Pre-CC_AUTH_PASSED. Origination. |
| Tokenize/store CC | `POST /uown/svc/createOrUpdateCreditCard` | `CreditCardClient.createOrUpdateCreditCard` | Returns `creditCardInfo.creditCardPk` + `ccToken` -- feed back into makeCreditCardPayments via `useCardOnFile: true` to avoid FK violation. |
| CC payment arrangement | `POST /uown/svc/makeCreditCardPayments` | `PaymentArrangementClient.makeCreditCardPayments` | `chargeFee=true` mandatory per transaction (Ticket363). |
| ACH payment arrangement | `POST /uown/svc/createOrUpdateACHPayments` | `PaymentArrangementClient.createOrUpdateAchPayments` | |
| List arrangements | `GET /uown/svc/accounts/{accountPk}/payment-arrangements` | `getPaymentArrangements(accountPk, page, size)` | Page<SvPaymentArrangement> sort pk DESC. |
| Get payments per arrangement | `GET /uown/svc/payment-arrangements/{pk}/payments` | `getPaymentArrangementPayments(pk)` | `{ ach[], cc[] }`. |
| All CC transactions | `GET /uown/svc/getCCTransactions/{accountPk}` | `getCcTransactions` | |
| Pending only | `GET /uown/svc/getPendingCCTransactions/{accountPk}` | `getPendingCcTransactions` | |
| Update / cancel CC tx | `PUT /uown/svc/payments/credit-cards/{pk}` | `updateCcTransaction(pk, body)` | 200 + void on success. |
| Payoff amount | `GET /uown/svc/getPayoffAmount/{accountPk}` | `SvcPayoffClient.getPayoffAmount` | Integer/decimal cents. |
| Account summary | `GET /uown/svc/getAccountSummary/{accountPk}` | `SvcPayoffClient.getAccountSummary` | |
| Servicing info | `GET /uown/svc/getServicingInfo/{accountPk}` | `SvcPayoffClient.getServicingInfo` | |
| Finalize purchase email | `POST /uown/sendFinalizeEmailToCustomer` | `CorrespondenceClient` | Creates new entry in `uown_email_queue`. |

## AllocationStrategy enum (CRITICAL)

`src/types/enums.ts:101-105`:

```typescript
export enum AllocationStrategy {
  DEFAULT = 'Payment/EPO',          // UI default -- pays regular + EPO together
  REGULAR_RECEIVABLES = 'Payment',   // regular receivables only
  EPO_ONLY = 'EPO Only',             // EPO (Early Pay Off) only
}
```

**Where it appears in the UI (2026-05):**
- **Allocation Strategy is NOT in the CC Transactions edit modal anymore.** It moved to **Payment History -> "Update Payment" modal** (pen-to-square icon). See `tests/e2e/unified-flow.spec.ts:487-513` (validate CC allocation strategies). The pencil icon in CC Transactions now opens "Edit Pending Credit Card Payment" -- date/amount/comment only, no strategy.
- Set via `PaymentTransactionPage.editAllocationStrategy(rowIndex, strategy)` (`src/pages/servicing/payment-transaction.page.ts:150`).

## 13m vs 16m program eligibility

**Inviolable rule:** eligibility is **merchant-config driven, not brand-driven**.

- Any merchant (UOWN or Kornerstone) with `uown_merchant_program.term_in_months=16 AND is_active=true` supports 16m applications.
- Brand (UOWN vs Kornerstone) only affects template/styling/routing, NOT financial eligibility.
- Canonical contract (`src/data/merchant-config-contract.ts:80-81, 103-104`): `minActivePrograms: { months13: 1, months16: 1 }` -- every valid merchant has at least 1 active of each.

**How to select 16m in the flow:**
1. SSN `888880916` -> forces 16m directly (Modality A).
2. `generateTestSSN(true)` + bank data + eligible BIN -> when merchant has both 13m+16m active (Modality B). Backend chooses.
3. Second Look (Modality C): SSN `100000053` + merchant TireAgent + fixed Brian profile. Specific GDS flow.

**Anti-pattern:** asserting "merchant X doesn't support 16m" without running query `SELECT term_in_months, is_active FROM uown_merchant_program WHERE merchant_pk = $1`. Catalog in `skill [[ssn-test-modalities]]`.

## DB tables touched by payment (from `database-schema.md` + `check-cc-sweep-eligibility.ts`)

| Table | Usage |
|-------|-------|
| `uown_sv_account` | Servicing account. `pk` = accountPk. Fields: `account_status` (`ACTIVE`/`SETTLED_IN_FULL`/etc), `rating` (A-F/U), `settled_in_full_date_time`, `company` (`UOWN`/`KORNERSTONE`). |
| `uown_sv_credit_card_transaction` | Each CC tx. Linked to `payment_arrangement_pk`. `cc_transaction_type` (`SETTLEMENT`/`REGULAR`/etc), `status` (`PENDING`/`SUCCESSFUL`/`FAILED`). |
| `uown_sv_credit_card` | Persisted CCs (token-on-file). |
| `uown_sv_ach_payment` | Each ACH tx. |
| `uown_sv_payment_arrangement` | Bucket grouping cc+ach. PK referenced by TX. |
| `uown_sv_receivable` | Each receivable item. `receivable_type` (`REGULAR_PAYMENT`/`PROCESSING_FEE`), `allocation_status` (`PARTIALLY_PAID`/`UNPAID`/`PAID`), `status` (`ACTIVE`/`CANCELLED`), `due_date`. |
| `uown_los_credit_card_transaction` | LOS-side, from contract page (CC_AUTH_PASSED). |
| `uown_los_lead_notes` | Activity log -- every relevant payment action MUST leave a note (CLAUDE.md rule 13). |
| `uown_correspondence_logs` + `uown_email_queue` | Emails generated by payment (finalize, settled-in-full). Recipient/status derived via JOIN, not native to `uown_correspondence_logs`. |

## Activity log expected per action (CLAUDE.md rule 13)

Every relevant payment action MUST produce a note in `uown_los_lead_notes` (or equivalent table). No log = backend bug, NOT acceptable behavior.

| Action | Expected pattern in `uown_los_lead_notes.notes` |
|--------|------------------------------------------------|
| `sendApplication` | `%application%submitted%` |
| `authorizeCreditCard` | `%[CC%authoriz%` / `%CC AUTH%` |
| `makeCreditCardPayments` (arrangement) | `%[PaymentArrangement%` / `%CC payment%scheduled%` |
| `createOrUpdateACHPayments` | `%ACH%scheduled%` |
| `updateCcTransaction` (cancel) | `%cancelled%` |
| Refund issued | `%REFUND%issued%` / `%REQUEST_REFUND%` |
| Sweep success | `%[SweepService]%settled%` |

Validation template:

```typescript
await test.step('activity log: payment arrangement created', async () => {
  const note = await db.waitForRecord(
    `SELECT pk, notes FROM uown_los_lead_notes
     WHERE lead_pk = $1 AND notes ILIKE '%PaymentArrangement%'
     ORDER BY pk DESC LIMIT 1`,
    [ctx.leadPk],
  );
  expect(note, 'PA creation log must be present').toBeTruthy();
});
```

## SETTLED_IN_FULL -- sweep timing (settled-in-full.helpers.ts)

Sweep eligibility has a DOW-dependent window (`src/helpers/settled-in-full.helpers.ts:301-305`):

```sql
CASE
  WHEN extract(DOW FROM CURRENT_DATE) IN (1, 2) -- Mon, Tue
    THEN a.settled_in_full_date_time::date = CURRENT_DATE - 4
  WHEN extract(DOW FROM CURRENT_DATE) = 3       -- Wed
    THEN a.settled_in_full_date_time::date IN (CURRENT_DATE - 4, -3, -2)
  ELSE                                          -- Thu/Fri (Sat/Sun no sweep)
    a.settled_in_full_date_time::date = CURRENT_DATE - 2
END
```

**Implication:** test that validates Settled In Full email cannot be triggered manually -- must wait for sweep cron or use a pre-existing account whose `settled_in_full_date_time` falls within the current window. Ratings `E/F/U` are INELIGIBLE -- use `findSettledInFullAccountWithIneligibleRating` for negative test.

## PayTomorrow Refund flow details (`tests/e2e/paytomorrow-refund-flow.spec.ts`)

Multi-tab E2E involving external PT portal. Critical points:

- PT portal does **NOT** depend on webhook (UOWN->PT webhook returns 401 in staging). PT polls UOWN on load.
- After refund: PT cancels invoice via API -> UOWN creates `REQUEST_REFUND` in `uown_funding_transaction` -> status reverts to `UW_APPROVED`.
- Funding queue -> "Send to FUNDED" before refund. Without it PT doesn't see the lease as active.
- Tabs: Tab0 = PT portal (persists); Tab1 = finalization consumer (disposable); Tab2 = UOWN origination.

## Finalize Purchase Email details (`tests/api/finalize-email-518-validation.spec.ts`)

Brand check by merchant `ref_merchant_code`:

| Brand | refMerchantCode | Expected template_name |
|-------|------------------|------------------------|
| UOWN | `OL90205-0001` (Daniel's Jewelers qa1) | `FinalizePurchaseEmail` |
| KORNERSTONE | `KS3015` (5th Ave Furniture NY) | `KORNERSTONE_FinalizePurchaseEmail` |

Validation via `getEmailTemplateNameByPattern` + `getCorrespondenceLogs` (`src/helpers/correspondence.helpers.ts`). Manual trigger via `POST /uown/sendFinalizeEmailToCustomer`. Activity log expected in `uown_los_lead_notes` matching `notePattern: /(?<!KORNERSTONE_)FinalizePurchaseEmail/` for UOWN.

## Move Due Date -- business rules (svc#536, 2026-05-22)

**Endpoint:** `POST /uown/svc/moveDueDatesByDays/{accountPk}` (body: `{ moveNumberOfDays: number }`)

**Cap by frequency (source: `MoveDueDatesService.java:117-126`):**

| Payment Frequency | Max offset (days) |
|-------------------|--------------------|
| `WEEKLY` | **3** |
| `BI_WEEKLY`, `MONTHLY`, others | 7 |

**Implication for tests:** helper `driveLeadToFunding` / `createPreQualifiedApplication` creates leads with `WEEKLY` by default. Any spec using offset > 3 without checking frequency will get HTTP 400 (modal won't close, log won't be written). **Safe universal strategy: use offset=3** -- smaller than both caps.

**Log generated:** `uown_sv_activity_log` with `log_type='DUE_DATE_MOVES'`, `account_pk` populated, `lead_pk` NULL, `creation_source='USER_ACTION'`. See [[activity-log-validation]] for full assertion template.

**Success response:** `DueDateMoveRecord` -- fields: `pk`, `accountPk`, `moveNumberOfDays`, `isFpdChange`, `agent`, `rowCreatedTimestamp`, `nextReceivable`.

**Audit table:** `uown_due_date_moves`. Real columns (confirmed via `information_schema.columns`, qa1 2026-05-22):
`pk, agent, row_created_timestamp, row_updated_timestamp, tenant_id, web_user_id, account_pk, agent_username, moved_by_days, moved_from_due_date, is_fpd_change, adjustment_type`.
**DO NOT exist:** columns `scheduled_due_date`, `new_due_date`, `created_at`, `updated_at`.

**LevelAI fields in `TmsAccountSummaryResponse`:**
- `numberOfDueDateMoves` -- sources from `uown_sv_sched_summary.due_date_moves`
- `lastScheduleMovedDate` -- `row_created_timestamp` of the latest `uown_due_date_moves` row; serializes as Java `LocalDateTime` (no offset); compare against DB with `expectWithinTzWindow` from `datetime.helpers.ts`

## CC payment "today" vs allocation strategy (commit 40c69cd)

`tests/e2e/unified-flow.spec.ts:432-448` -- two separate steps:

```typescript
await test.step('Make CC payment', async () => {
  // pay TODAY without specifying allocation strategy
  await servicingCustomer.makeCcPayment(testData.ccPaymentDate /* "0" = today */, amount, buildCcPaymentDetails(card, billing));
});

await test.step('Make CC payment with allocation strategy Payment', async () => {
  await servicingCustomer.makeCcPayment('0', amount, buildCcPaymentDetails(card, billing, AllocationStrategy.REGULAR_RECEIVABLES));
});
```

`buildCcPaymentDetails(card, billing, allocationStrategy?)` (`src/helpers/common.helpers.ts:82-110`) is the canonical builder. Do not inline the object.

## Float representation -- NOT a bug

Two representations of the same number are not a bug:
- `"18.46"` (`(value*100).toFixed(4)` + trim)
- `"18.459999999999997"` (`value*100` direct, exposing IEEE 754)

Same binary value. Round-trip through DB (`numeric(9,6)`) preserves it.

**Assertion patterns:**

```typescript
// bad
expect(displayedValue).toBe(expectedValue);

// good
expect(Number(displayedValue)).toBeCloseTo(Number(expectedValue), 4);
// or
expect(Math.abs(Number(a) - Number(b))).toBeLessThan(0.001);
```

Classification: purely numeric formatting divergence -> `[OBSERVACAO]` / UX artifact, not BUG. See `skill [[bug-classification]]`.

## Account_pk vs lead_pk vs leadUuid

| Field | Source | Usage |
|-------|--------|-------|
| `leadPk` | `sendApplication.body.authorizationNumber` or `getApplicationStatus.body.leadPk` | Origination, joins on `uown_los_*` |
| `leadUuid` | `sendApplication.body.accountNumber` | Quick search in portal, `getApplicationStatus(merchant, leadUuid)` |
| `accountPk` | URL `/customer-information/{ID}` after FUNDED, or `getAccountNumberFromSummary` | Servicing, joins on `uown_sv_*` |

`unified-flow.spec.ts:307-317` shows: "On origination portal, 'Account Number' often shows the leadPk -- discard if identical". Do not use accountPk before FUNDED -- it doesn't exist yet.

## EPO/Payoff endpoints

`/home/jose/projects/uown/automation/src/api/clients/svc-payoff.client.ts:6-16` -- three endpoints: `getPayoffAmount`, `getAccountSummary`, `getServicingInfo`. All GET via accountPk.

## Settled-In-Full eligibility helpers

`/home/jose/projects/uown/automation/src/helpers/settled-in-full.helpers.ts:273-345`

- `findEligibleSettledInFullAccount()` -- for positive test
- `findSettledInFullAccountWithIneligibleRating(rating)` -- for negative test (E/F/U)
- Sweep window aware (DOW-based 4-day window)

## Finalize email API validation

`/home/jose/projects/uown/automation/tests/api/finalize-email-518-validation.spec.ts:46-66` -- pattern CT-A (UOWN) vs CT-B (KORNERSTONE) with `notePattern` regex differentiating `KORNERSTONE_FinalizePurchaseEmail` from bare `FinalizePurchaseEmail`.

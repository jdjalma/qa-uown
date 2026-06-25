# Application Lifecycle - Canonical Sequence Detail

> For an overview and rules, see [SKILL.md](../SKILL.md).

---

## Complete sequence (happy path end-to-end)

To create an account from scratch up to `ACTIVE` (or `SETTLED_IN_FULL` via SETTLEMENT):

| # | Call | Result | Requires |
|---|---------|-----------|-------|
| 1 | `buildTestData({ env, state, merchant, orderTotal })` | unique `applicant.email`, approved SSN | Do NOT pass `emailOverride` (pitfall #1) |
| 2 | `api.application.sendApplication(merchant, applicant, order)` | returns `leadPk`, `leadUuid`, `paymentDetailsList` | For Kornerstone: `body.mainBankRoutingNumber` + `body.mainBankAccountNumber` mandatory (pitfall #5) |
| 3 | `sleep(5000)` + `api.application.getApplicationStatus(merchant, leadUuid)` | status contains `"approved"` + `approvedAmount > 0` | SSN not-ending-in-9 + merchant not blocked in the state |
| 4 | `api.invoice.sendInvoice(merchant, leadUuid, { orderTotal })` | returns `paymentDetailsList[0].redirectUrl` with `shortCode` + `planId` | sendApplication approved first |
| 5 | Extract `shortCode` + `planId` from `invoiceResp.body.paymentDetailsList[0].redirectUrl` | `shortCode = url.pathname.split('/')[1]`, `planId = url.searchParams.get('planId')` | - |
| 6 | `api.application.getMissingFields(shortCode, { planId })` | sets `merchantProgramPk` on the lead | Step 5 ok |
| 7 | `api.application.submitApplication(leadPk, firstName, lastName, { planId, ccNumber, ccType, ccExp, cvc })` | lead transitions to CC_AUTH_PASSED/CONTRACT_CREATED | **ccNumber = `TEST_CARDS.MASTERCARD_APPROVED.number` (BIN 5500)** (pitfall #3) |
| 8 | `api.lead.changeLeadStatus(merchant, leadPk, 'SIGNED', 'Automated')` | lead - SIGNED | submitApplication ok |
| 9 | `api.settlement.settleApplication(merchant, leadUuid)` | lead - SETTLED | Lead in SIGNED |
| 10 | `sleep(3000)` + `api.lead.updateFundingStatus([leadPk], 'FUNDING')` | lead - FUNDING | Lead in SETTLED |
| 11 | `api.lead.updateFundingStatus([leadPk], 'FUNDED')` | lead - FUNDED, creates `uown_sv_account` | Lead in FUNDING |
| 12 | `db.waitForAccountByLeadPk(leadPk, 60_000)` | returns `accountPk` | Step 11 ok |
| 13 | `db.waitForAccountStatus(accountPk, 'ACTIVE', 180_000)` | account ACTIVE | Account created |

## To reach `SETTLED_IN_FULL` (the Settled in Full email depends on this)

| # | Call | Result |
|---|---------|-----------|
| 14 | `api.paymentArrangement.makeCreditCardPayments(buildCcArrangementBody({ accountPk, arrangementType: 'SETTLEMENT', ccNumber, ccExp, cvc, installments }))` | payment processes synchronously (CC), listener transitions the account |
| 15 | `db.waitForPaymentArrangementStatus(accountPk, 'SUCCESS', 60_000)` | arrangement SUCCESS |
| 16 | `db.waitForAccountStatus(accountPk, 'SETTLED_IN_FULL', 60_000)` | account SETTLED_IN_FULL + `uown_sv_payment(PAID)` populated |

## To change the primary email (email template tests)

| # | Call | When |
|---|---------|--------|
| 17 | `api.svcEmail.getContactInfo(accountPk)` - extract `emailPK` + `customerPK` from the PRIMARY entry | After ACTIVE (or SETTLED_IN_FULL) |
| 18 | `api.svcEmail.createOrUpdateEmail({ emailPK, customerPK, emailAddress: INBOX, emailType: 'PRIMARY', doNotEmail: false })` | - |

---

## Helpers that already implement the complete sequence

| Helper | Complete up to | Notes |
|--------|--------------|-------|
| `setupApplicationViaApi` (`src/helpers/api-setup.helpers.ts`) | Step 7 (submitApplication via `submitPaymentInfoViaApi: true`) | Includes `getMissingFields` - can chain `driveLeadToFunding` afterward |
| `createPreQualifiedApplication` (same file) | Step 7 | Now includes `getMissingFields`. Accepts `bankData` for Kornerstone |
| `driveLeadToSigned(api, merchant, ctx)` | Step 8 | Calls `changeLeadStatus('SIGNED')` |
| `driveLeadToFunding(api, merchant, ctx)` | Step 10 | Includes SIGNED - settle - FUNDING |

## To go from FUNDING - FUNDED - ACTIVE - SETTLED_IN_FULL

Chain manually in the spec:
```typescript
await driveLeadToFunding(api, merchant, ctx); // passos 8-10
const fundedResp = await api.lead.updateFundingStatus([leadPk], 'FUNDED'); // passo 11
const accountPk = await db.waitForAccountByLeadPk(leadPk, 60_000); // passo 12
await db.waitForAccountStatus(accountPk, 'ACTIVE', 180_000); // passo 13
// Para SETTLED_IN_FULL:
const ccBody = buildCcArrangementBody({ accountPk, arrangementType: 'SETTLEMENT', ... });
await api.paymentArrangement.makeCreditCardPayments(ccBody); // passo 14
await db.waitForPaymentArrangementStatus(accountPk, 'SUCCESS', 60_000); // passo 15
await db.waitForAccountStatus(accountPk, 'SETTLED_IN_FULL', 60_000); // passo 16
```

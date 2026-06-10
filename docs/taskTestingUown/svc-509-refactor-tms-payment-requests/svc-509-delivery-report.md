# Tests in qa1

---

## 1. Credit card payment

Endpoint: `POST /uown/tms/v1/accounts/{accountId}/payments/credit-card`

### CT-01 — Payment with a card already on file

**What is tested:** Payment using a credit card already saved on the account, identified only by the card ID.

**Payload sent** (captured in `uown_sv_inbound_api_log.pk=226`):

```json
{
  "amount": 10,
  "postingDate": "2026-05-22",
  "card": { "creditCardId": 5323 }
}
```

**Result:** ✅ PASS — HTTP 200, transaction APPROVED, record persisted in `uown_sv_credit_card_transaction`.

---

### CT-02 — Payment with a keyed card and billing address

**What is tested:** Payment providing the full card details at call time, with no saved card.

**Payload sent:**

```json
{
  "amount": 50,
  "postingDate": "2026-05-22",
  "card": {
    "ccNumber": "5454545454545454",
    "ccExp": "12/30",
    "cvc": "123",
    "ccFirstName": "Test",
    "ccLastName": "Person",
    "billingAddress": {
      "streetAddress1": "123 Main St",
      "city": "Los Angeles",
      "state": "CA",
      "zipCode": "90028"
    }
  }
}
```

**Result:** ✅ PASS — HTTP 200. The new card details and billing address objects were accepted correctly.

---

### CT-03 — Card payment scheduled for a future date

**What is tested:** Card payment with a posting date 3 days in the future.

**Result:** ✅ PASS — HTTP 200, `postingDate` accepted as 2026-05-25.

---

### CT-08a — Accept the card via both the `card` field and the `ccInfo` alias

**What is tested:** Confirmation that the card instrument can be provided either through the new `card` field or the compatibility alias `ccInfo`.

**Payload sent** (captured in `uown_sv_inbound_api_log.pk=222`):

```json
{
  "amount": 50,
  "postingDate": "2026-05-22",
  "ccInfo": { "creditCardId": 5311 }
}
```

**Result:** ✅ PASS — HTTP 200. The `ccInfo` alias works equivalently to the `card` field.

---

### CT-08b — Reject the internal card identifier without the correct envelope

**What is tested:** Attempt to provide the card using the internal `creditCardPk` field on its own, outside the `card`/`ccInfo` envelope.

**Result:** ✅ PASS — HTTP 400, message `Provide exactly one of creditCardId or keyed card`. The system enforces the correct contract.

---

## 2. ACH payment (bank account debit)

Endpoint: `POST /uown/tms/v1/accounts/{accountId}/payments/ach`

### CT-04 — ACH payment with keyed bank details

**What is tested:** Bank account debit payment providing the full bank details in the call.

**Payload sent** (captured in `uown_sv_inbound_api_log.pk=223`):

```json
{
  "amount": 25,
  "postingDate": "2026-05-22",
  "bankAccount": {
    "routingNumber": "021000021",
    "accountNumber": "12345678",
    "bankName": "Chase",
    "accountHolderFirstName": "New",
    "accountHolderLastName": "Shape"
  }
}
```

**Result:** ✅ PASS — HTTP 200. The new bank account details object was accepted correctly.

---

### CT-05 — ACH payment with a bank account already on file

**What is tested:** Debit payment using a bank account already saved, identified only by its ID.

**Payload sent:**

```json
{
  "amount": 25,
  "postingDate": "2026-05-22",
  "bankAccount": { "bankAccountId": 4294 }
}
```

**Result:** ✅ PASS — HTTP 200, bank account `bankAccountPk=4294` used.

---

### CT-09 — Reject the old `bankData` envelope without the correct field

**What is tested:** Attempt to provide bank details using the old `bankData` envelope instead of the new `bankAccount`.

**Result:** ✅ PASS — HTTP 400, message `bankAccount is required`. The old contract is no longer accepted on this endpoint.

---

## 3. Payment Arrangement

Endpoint: `POST /uown/tms/v1/accounts/{accountId}/paymentArrangements`

### CT-06 — Payment arrangement with the legacy contract (card + ACH)

**What is tested:** Creation of a payment arrangement using the legacy contract, with one card transaction and one ACH transaction.

**Payload sent** (captured in `uown_sv_inbound_api_log.pk=228`):

```json
{
  "creditCardTransactions": [
    {
      "amount": 25,
      "postingDate": "2026-05-22",
      "creditCardPk": 5298,
      "chargeFee": true,
      "ccAction": "SALE",
      "ccTransactionType": "REQUEST"
    }
  ],
  "achPayments": [
    {
      "accountPk": 4731,
      "amount": 25,
      "postingDate": "2026-05-29",
      "bankData": { "bankAccountPk": 4287 },
      "paymentArrangement": true,
      "achProcessType": "REQUEST"
    }
  ],
  "arrangementType": "NORMAL",
  "paymentArrangement": true
}
```

**Result:** ✅ PASS — HTTP 200, arrangement `pk=279` with status SUCCESS, card APPROVED, and ACH PENDING.

---

### CT-10 — Payment arrangement with the new contract returns success but processes nothing

**What is tested:** Known-behavior scenario. The payment arrangement endpoint does **not** yet support the new contract (`creditLines`/`achLines`) — after the revert of MR !1426, this shape is silently ignored.

**Payload sent** (captured in `uown_sv_inbound_api_log.pk=224`):

```json
{
  "creditLines": [
    { "amount": 25, "postingDate": "2026-05-22", "card": { "creditCardId": 5316 } }
  ],
  "achLines": [
    { "amount": 25, "postingDate": "2026-05-29", "bankAccount": { "bankAccountId": 4302 } }
  ],
  "arrangementType": "NORMAL"
}
```

**Result:** ✅ PASS — HTTP 200, but the response contains zero processed transactions (`creditCardTransactions=[]`, `achPayments=[]`). Expected behavior after the revert. **See OBS-1.**

---

## 4. Input validation

### CT-07 — Bean Validation rejects invalid input (10 negative cases)

**What is tested:** A batch of 10 calls with invalid input — missing required fields (`amount`, `postingDate`, payment instrument), ambiguous payment instrument (ID and keyed details at the same time), and others.

**Result:** ✅ PASS — all 10 cases returned HTTP 400 with the correct validation message. Input validation, which did not exist in the old contract, now blocks malformed calls before any processing.

---

## 5. Field behavior and regression

### CT-11 — Allocation strategy preserved (card and ACH)

**What is tested:** Confirmation that the optional allocation strategy field is still accepted and persisted.

**Result:** ✅ PASS — all three values (`DEFAULT`, `REGULAR_RECEIVABLES`, `EPO_ONLY`) were accepted and persisted correctly on both card and ACH payments.

---

### CT-12 — Fee charge defaults to `true` when omitted

**What is tested:** Confirmation that when the fee-charge field is not provided, the system defaults it to `true`.

**Result:** ✅ PASS — HTTP 200, transaction persisted with `charge_fee=true`.

---

### CT-13 — Identical behavior on the Kornerstone brand

**What is tested:** Mirror of CT-01 (on-file card payment) for the Kornerstone partner brand.

**Result:** ✅ PASS — lead created on merchant KS3015 (`merchant_pk=7099`), HTTP 200. The refactored contract works identically across both brands.

---

### CT-15 — Inbound call audit logging (svc#525 regression)

**What is tested:** Confirmation that calls to the refactored TMS endpoints are recorded in the inbound API log table, per the svc#525 fix.

**Result:** ✅ PASS — the full controller name (`com.uownleasing.svc.rest.tms.TmsPaymentController.`*) was logged correctly in `uown_sv_inbound_api_log` (verified in the database).

---

## Consolidated result


| #      | Scenario                                                    | Result             |
| ------ | ----------------------------------------------------------- | ------------------ |
| CT-01  | Credit card — card on file                                  | ✅ PASS             |
| CT-02  | Credit card — keyed + billing address                       | ✅ PASS             |
| CT-03  | Credit card — future date                                   | ✅ PASS             |
| CT-04  | ACH — keyed                                                 | ✅ PASS             |
| CT-05  | ACH — bank on file                                          | ✅ PASS             |
| CT-06  | Payment arrangement — legacy contract (CC + ACH)            | ✅ PASS             |
| CT-07  | Bean Validation — 10 negative cases → 400                   | ✅ PASS             |
| CT-08a | Card — `card` ↔ `ccInfo` alias                              | ✅ PASS             |
| CT-08b | Card — internal `creditCardPk` without envelope → 400       | ✅ PASS             |
| CT-09  | ACH — old `bankData` envelope → 400                         | ✅ PASS             |
| CT-10  | Payment arrangement — new contract → 200 with no processing | ✅ PASS (see OBS-1) |
| CT-11  | Allocation strategy preserved                               | ✅ PASS             |
| CT-12  | Fee charge defaults to `true`                               | ✅ PASS             |
| CT-13  | Kornerstone brand (mirror of CT-01)                         | ✅ PASS             |
| CT-15  | Inbound audit logging (svc#525)                             | ✅ PASS             |


## Observation

### OBS-1 — Payment arrangement endpoint accepts the new contract but processes nothing (silent HTTP 200)

When the payment arrangement endpoint receives the new contract (`creditLines`/`achLines`), it responds with **HTTP 200** but **processes no transactions** — the response comes back with zero card transactions and zero ACH transactions.

This is the expected behavior after the revert of MR !1426 (the payment arrangement endpoint was left out of the refactor and only accepts the legacy contract). However, a `200 OK` that silently does nothing is a risk: if an external integrator sends the new contract assuming it is supported, the payment arrangement simply is not created and no error is returned.

**Suggestion:** evaluate with the team whether the payment arrangement endpoint should return **HTTP 400** for the unsupported contract, instead of `200` with an empty response making the failure visible to the caller. Does not block this delivery.
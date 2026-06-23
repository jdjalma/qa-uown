# UOWN TMS Service API — Reference (local mirror)

Local snapshot of the official **UOWN Leasing TMS Service API** documentation.

- **Source:** <https://uown-tms.readme.io/reference/getting-started>
- **Index (live):** <https://uown-tms.readme.io/llms.txt>
- **Snapshot date:** 2026-06-23
- **API version:** `v1` (OpenAPI `3.0.1`)
- **Servers:** `https://svc-sandbox.uownleasing.com` (sandbox) · `https://svc-prod.uownleasing.com` (production)
- **Auth:** API key in the `Authorization` header — obtain a key via `POST /uown/auth/authorize` (see [`authentication.md`](authentication.md)).

> ⚠️ **This is a point-in-time mirror, not the source of truth.** The live docs may change. Re-sync with the
> commands at the bottom of this file. Each `*.md` page is verbatim from ReadMe.io (including the
> "Documentation Index" blockquote ReadMe injects at the top of every page).

## Consolidated spec

[`openapi.json`](openapi.json) — the 13 endpoint pages merged into a single OpenAPI 3.0.1 document
(13 paths, 28 schemas). Importable into Postman/Insomnia or usable for contract testing.

## Guides

| Page | Description |
|------|-------------|
| [getting-started.md](getting-started.md) | Introduction to the UOWN Leasing TMS Service API and interactive "Try It" usage. |
| [authentication.md](authentication.md) | How to obtain an API key (`POST /uown/auth/authorize`) and authenticate requests. |

## Endpoints

### Account lookup

| Page | Endpoint | Description |
|------|----------|-------------|
| [searchaccount.md](searchaccount.md) | `POST /uown/tms/v1/accounts/search` | Locate primary accounts by phone, SSN, or birth date. |
| [getaccountsummary.md](getaccountsummary.md) | `GET /uown/tms/v1/accounts/{accountId}/summary` | Comprehensive account details including balance and status. |

### Payment methods

| Page | Endpoint | Description |
|------|----------|-------------|
| [getbankaccounts.md](getbankaccounts.md) | `GET …/payment-methods/bank-accounts` | Active bank accounts on the account. |
| [getcreditcards.md](getcreditcards.md) | `GET …/payment-methods/credit-cards` | Tokenized credit cards on file. |
| [getautopaycreditcard.md](getautopaycreditcard.md) | `GET …/payment-methods/credit-cards/autopay` | Credit card configured for autopay, if any. |

### Payments

| Page | Endpoint | Description |
|------|----------|-------------|
| [processachpayment.md](processachpayment.md) | `POST …/payments/ach` | Initiate an ACH bank payment. |
| [processcreditcardpayment.md](processcreditcardpayment.md) | `POST …/payments/credit-card` | Execute a single credit card payment. |
| [processpaymentarrangement.md](processpaymentarrangement.md) | `POST …/paymentArrangements` | Execute ACH and/or credit card payments for a payment arrangement. |
| [sendpaynearmepaymentlink.md](sendpaynearmepaymentlink.md) | `POST …/paynearme/send` | Create a PayNearMe link and deliver it via SMS/email. |

### Payoff & due dates

| Page | Endpoint | Description |
|------|----------|-------------|
| [getpayoffamount.md](getpayoffamount.md) | `GET …/payoff` | Total amount required to pay off the account. |
| [adjustnextduedate.md](adjustnextduedate.md) | `POST …/next-due-date/adjustments` | Move the next payment due date forward by N days. |
| [moveduedates.md](moveduedates.md) | `POST …/due-dates/move` | Shift receivable due dates forward or backward by N days. |

### Contact

| Page | Endpoint | Description |
|------|----------|-------------|
| [updatecontactpreferences.md](updatecontactpreferences.md) | `POST …/contactPreferences` | Update TCPA and AI opt-out preferences for a phone number. |

## Re-syncing this mirror

From the repo root:

```bash
DEST=docs/api-reference
slugs="authentication getting-started adjustnextduedate getaccountsummary \
getautopaycreditcard getbankaccounts getcreditcards getpayoffamount moveduedates \
processachpayment processcreditcardpayment processpaymentarrangement searchaccount \
sendpaynearmepaymentlink updatecontactpreferences"
for s in $slugs; do
  curl -sSL -o "$DEST/$s.md" "https://uown-tms.readme.io/reference/$s.md"
done
curl -sSL -o "$DEST/llms.txt" "https://uown-tms.readme.io/llms.txt"
```

Then rebuild `openapi.json` by merging the `paths` + `components` from each page's embedded
`# OpenAPI definition` block (see git history for the merge script).

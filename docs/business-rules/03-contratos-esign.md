---
title: Contracts and Electronic Signature
domain: business-rules
status: stable
volatility: volatile
last_verified: 2026-06-18
sources:
  - code: src/data/state-merchant-matrix.ts#STATE_MATRIX
  - code: src/data/state-merchant-matrix.ts#SigningProvider
  - code: src/helpers/esign-db.helpers.ts#EsignDocument
  - env: qa2
covers: [esign, signwell, gowsign, pandadoc, contracts, signing-fee, state-routing]
---

# Contracts and Electronic Signature
## UOwn Leasing - SVC Platform

Contract generation, electronic signature (SignWell/PandaDoc), signing fee and post-signature redirect.

---

## 8. Contracts and Electronic Signature (E-sign)

### Contract Flow

1. **Contract generated** with number `UOWN_<random>_<leadPk>`
2. **Template selected** by state (INSTORE = merchant state, ONLINE = customer state)
3. **Sent for e-sign** via SignWell (default) or PandaDoc
4. **Customer signs** electronically
5. **CC Peek consent** is extracted from the signed document
6. **Lead updated** to SIGNED
7. **Previous contracts** with status SENT are cancelled

### E-sign Status -> Contract Status Mapping

| E-sign | Contract |
|--------|----------|
| SENT_TO_CUSTOMER, IN_PROGRESS, VIEWED | `SENT` |
| COMPLETED, SIGNED | `SIGNED` |
| CANCELLED | `CANCELLED` |
| ERROR | `ERROR` |
| EXPIRED | `EXPIRED` |

### Auto-Move to Funding

If the merchant has `isSignedToFunding = true`, after signing the lead automatically moves to `FUNDING`.

### EPO Sections (16-month template registry)

The SAC 16-month templates have 4 EPO clause blocks in the signed contract:

- **Item 4 — Promotional Payoff** — promotional window `{{epoDays}}`; "any late payment voids this option". Daily-accrual variant **up to the current date** (`current_date_promo`: CA, TX, OH) vs **up to the exercise date** (`exercise_date_promo`: AL, FL, LA, NC, TN, GA, PA).
- **Item 4a — Lease-Purchase Ownership (= EPO)** — EPO price and ownership clause; same current-date vs exercise-date daily-accrual split (exception NY = proportional Cash Price formula, New baseline).
- **R3 — Consumer appendix (page "EARLY PURCHASE OPTIONS")** — EPO formula page intended for the consumer.
- **R5 — CA-only EPO chart** — `[table|earlyPurchaseOption]` (CA; reused in NY/PA).

Full registry (verbatim text by state, tokens, validation matrix) → [`appendix-h-epo-template-registry.md`](appendix-h-epo-template-registry.md). Primary source: wiki `gow-sign/EPO-SECTIONS` `[external-doc:gitlab/EPO-SECTIONS,2026-06-23]`.

---

## 55. Signing Fee

### What It Is

Service that manages the calculation and charging of fees at the moment of contract signing -- includes processing fee, security deposit and protection plan fee.

### What It's For

Ensures the customer pays the mandatory fee before finalizing the contract. It works as a commitment barrier and initial risk coverage.

### Amount Calculation

The amount charged is the **MAXIMUM** among:

| Component | Source |
|------------|-------|
| Amount Charged at Signing | Merchant program |
| Processing Fee | State or program |
| Security Deposit | State |
| Protection Plan Fee | Protection plan |
| Zero | Minimum value (floor) |

If there is no schedule summary, it delegates to `CalculatorService`.

### Prerequisites for Charging

| Condition | Required |
|----------|-------------|
| Fee > $0 | Yes |
| Fee not already charged (idempotency) | Yes |
| Active CC on file via auto-pay | Yes |
| Existing approved AUTHENTICATION transaction | Yes |

### Charging Flow

1. **Idempotency check:** Searches for existing `CAPTURE` or `SALE` transactions with the fee amount, type `FEE` and status `APPROVED`
2. **If already charged:** Returns `true` without processing again
3. **If CC does not exist:** Lead status changes to `SIGNING_FEE_DENIED`, returns `false`
4. **Transaction capture:** Creates a `CAPTURE` transaction linked to the authorization, amount rounded with `HALF_EVEN`
5. **If capture fails:** Lead receives status `SIGNING_FEE_DENIED`, note added with the error
6. **If capture approved:** Sends a payment receipt to the customer

### Payment Receipt

- **Template:** `InitialPaymentReceipt`
- **Receipt number:** `UOWNCC{PaymentPk}`
- **Sending:** Configurable (synchronous or asynchronous with configurable delay, default 1000ms)

### Configurations

| Config | Default | Description |
|--------|---------|-----------|
| `check.if.cc.is.charged` | true | Checks whether the fee was already charged |
| `checkTimedOutCaptures` | false | Reuses timed-out captures |
| `send.payment.receipt` | true | Sends receipt to the customer |
| `send.payment.receipt.in.async` | true | Asynchronous sending |

---

## 63. E-sign Redirect and Post-Signature

### What It Is

Manages the redirect flow after electronic signature, mapping e-sign provider events to actions in the system.

### What It's For

After the customer signs (or cancels) the contract, the system needs to: redirect the customer back to the merchant, update the lead status, and start post-signature flows.

### Event Mapping

| Provider | Signed Event | Cancelled Event |
|----------|----------------|-----------------|
| **SignWell** | `completed` (config: `sw.esign.event.signed`) | `declined, closed, error` (config: `sw.esign.event.canceled`) |
| **PandaDoc** | `completed` (config: `pd.esign.event.signed`) | `exception` (config: `pd.esign.event.canceled`) |

### Building the Redirect URL

**Base URL priority:**
1. Environment variable `SVC_URL` (e.g.: `svc-dev1` -> `origination-dev1.uownleasing.com`)
2. Config `redirect.base.url` (fallback)
3. `merchantRedirectUrl` from the merchant (if configured)

**URL format for the merchant:**
```
{merchantRedirectUrl}?event={completed|canceled}&ata={uuid}
```

**Post-Message:** If the merchant has `postMessage = true`, it adds `&postMessage=true` for iframe flows.

### Post-Signature Flow

1. **Signature check:** Calls `isLeaseOrLeaseModSigned()`
2. **Status update:** If signed, updates the lead status
3. **Synchronous/asynchronous execution:** Specific merchants run synchronously (by ref code or client type), the rest use `CompletableFuture`
4. **Protection plan:** Started asynchronously after the status update

### Protection Plan Flow (TireAgent / BW13)

Merchants with the BW13 plan (e.g.: TireAgent) enable the protection flow on the contract form. The behavior differs from the standard flow:

**Standard flow (no insurance):**
1. Customer accepts the T&C checkboxes
2. "PROCEED TO SIGNATURE" button → goes straight to e-sign

**Insurance flow (BW13 — TireAgent):**
1. Customer accepts the T&C checkboxes
2. "See Protection Benefits" button replaces "PROCEED TO SIGNATURE"
3. Clicking opens the `PurchaseInsurance` modal with the Buddy widget (`buddy.insure` iframe)
4. Customer chooses opt-in or opt-out in the widget
5. "PROCEED TO SIGNATURE" button appears in the protection modal → goes to e-sign

**Buddy widget behavior:**
- The `buddy.insure` iframe loads asynchronously — the opt-in/opt-out radio buttons are not available immediately after the page renders
- Typical load time: 5–12s
- Automation must wait with a retry loop (5× with 3s interval = 15s total) before attempting to click the radio button
- Do not remove the retry loop — without it the click fails silently and the test hangs on the disabled "PROCEED TO SIGNATURE" button

**Automatic detection in `completeTermsAndConditions()`:**
- After checking all checkboxes, it verifies whether "See Protection Benefits" is visible
- If yes: clicks the button and calls `completeProtectionPlan(false)` (automatic opt-out)
- If no: proceeds to "PROCEED TO SIGNATURE" (standard flow)

---

### Post-Signature Completion Screen (Confetti)

After a successful electronic signature, the customer is redirected to the `/{shortCode}/complete` route, which displays the completion screen.

**Current design (R1.50.0 — Confetti component):**

| Element | Description |
|----------|-----------|
| Background | Confetti animation with teal background (`#31c3e7`) |
| Card | Centered white card with a check icon |
| Title | "Thank You!" (heading) |
| Main message | "Your contract has been successfully signed." |
| Acknowledgment | "Thank you for using our services." + "We hope you enjoy your product(s)!" |
| Contact | "If you have any questions, please contact us:" + phone `(877) 353-8696` |
| Footer | "A copy has been sent to your email" |

**Changes from the previous design:**
- Removed: "View Document" link (no longer displayed)
- Added: confetti animation, check icon, contact information
- Animation: clip-path reveal with a duration of 0.75s

---

### Payment Program Selection Screen (MissingPaymentProgram)

When the customer accesses the `/{shortCode}/complete` route **without the `planId` parameter** in the query string, the system displays the payment program selection screen (`MissingPaymentProgram` component) instead of going straight to the CC/bank form.

**When it appears:**
- URL without `planId`: `/{shortCode}/complete` → selection screen
- URL with `planId`: `/{shortCode}/complete?planId=WK13` → skips straight to CC/bank (backend auto-resolves the program)

**Redesigned design (R1.50.0 — Task #1233, MR !1408):**

| Element | Description |
|----------|-----------|
| Container | `paymentProgramModal__paymentProgramContainer` (CSS Module) |
| Logo | UOWN image (`#payment-program-image`) |
| Title | "Choose the payment program that works best for you" |
| Subtitle | "Select the option that fits your budget" |
| Payment cards | One card per available frequency (Weekly, Bi-Weekly, Twice a Month, Monthly) |
| Each card | Frequency title + description + price + detail lines (Term, First Payment, Last Payment, etc.) + "Choose Payment Program" button |
| Term tabs | "X Months Terms" tabs (e.g.: "13 Months Terms", "16 Months Terms") — visible only when the merchant has both terms available |
| Footer | "Questions? We're here to help" + phone "(877) 353-8696" |

**Descriptive labels by frequency:**

| Frequency | Card Title | Description |
|------------|---------------|-----------|
| Weekly | Weekly Payment Program | Pay more often, smaller amounts |
| Bi-Weekly | Bi-Weekly Payment Program | Most popular |
| Twice a Month | Twice a Month Payment Program | Lower frequency, larger payments |
| Monthly | Monthly Payment Program | Lower frequency, larger payments |

**Term tab behavior:**
- If the merchant has only one term (e.g.: 13 months), the tabs are not rendered
- If the merchant has multiple terms (e.g.: 13 and 16 months), the tabs appear and the user can switch
- Switching tabs updates the displayed cards (each term may have different prices/details)
- The active tab receives the class `termSelection__tabSelected`

**Flow after selection:**
1. Customer clicks "Choose Payment Program" on a card
2. The selection screen disappears
3. The CC/bank form appears (same flow as `completeApplication` with `planId`)
4. Proceeds to T&C → e-sign → completion screen (Confetti)

**Known bug (BUG-01):** SSN `888888888` causes a NullPointerException in the backend (HTTP 500). Use an auto-generated SSN with `generateTestSSN(true)`.

---


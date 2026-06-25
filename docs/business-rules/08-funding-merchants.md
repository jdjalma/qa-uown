---
title: Funding and Merchant Management
domain: business-rules
status: stable
volatility: volatile
last_verified: 2026-06-18
sources:
  - code: src/data/merchant-config-contract.ts
  - code: src/config/constants.ts#generateTestSSN
  - db: uown_scheduled_task
  - env: qa2
covers: [funding, merchants, webhooks, ssn, los-svc-import, integration-api]
derived_from: [underwriting-and-funding-test-data-paths]
---

# Funding and Merchant Management
## UOwn Leasing - SVC Platform

Funding queue, LOS-SVC import, webhooks, merchant/lead management, integration API, and funding audit.

---

## 9. Funding Queue

### What Funding Is

Funding is the process by which **UOwn pays the merchant** for the product the customer took. It is the moment when UOwn assumes the financial risk.

### How the Merchant Is Paid

```
Net amount to merchant = Invoice Amount
  - Dealer Discount (% withheld)
  - Platform Fee (UOwn's %, default 2%)
  - CC Processing Fee (processing %)
  + Dealer Rebate (% returned as incentive)
```

### Status Transitions

```
FUNDING ──────> FUNDED ──────> REQUEST_REFUND ──────> REFUNDED
    ^               |
    └───────────────┘
    (Reversal: FUNDED -> FUNDING)
```

| Transition | What happens |
|-----------|---------------|
| -> FUNDING | Lead imported into SVC, account created, `fundRequestDateTime` recorded |
| FUNDING -> FUNDED | Merchant received payment, FUNDED transaction created, lead -> FUNDED |
| FUNDED -> FUNDING | Reversal (error), status reverted |
| REQUEST_REFUND -> REFUNDED | Money clawed back from the merchant |

### Invoice Change After Funding

| If lead is in | Action |
|-----------|------|
| FUNDING | Existing transactions cancelled, new ones created |
| FUNDED | REQUEST_REFUND transaction created |

---

## 10. LOS to SVC Import

### What Happens

When a lead is funded, its data is imported from the origination system (LOS) into the servicing system (SVC), creating an active account.

### Imported Data

Account, customers, addresses, emails, phones, employment, bank accounts (deduplicated), CC transactions (APPROVED only), receivables, protection plan.

### Special Rules

| Rule | Detail |
|-------|---------|
| 16-month term | EPO disabled (`earlyPayoffDateExpiry = today`) |
| Security deposit > 0 | Payment of type `DEPOSIT` |
| Welcome email | Sent after import |
| Account cancelled after update | Triggers cancellation with refund |

---

## 28. Webhooks (Notifications to Merchants)

### What It Is

A system of HTTP callbacks that sends real-time notifications to partner merchant systems when lead statuses change.

### What It's For

Merchants need to know when things happen: customer signed, deal funded, application expired. Instead of merchants polling UOwn constantly, UOwn pushes updates proactively.

### Statuses That Trigger a Webhook

Default: `CONTRACT_CREATED, EXPIRED, CANCELLED_DUP_SSN, FUNDING, FUNDED, SIGNED`

### How It Works

1. Lead status changes
2. System checks whether the merchant has `useWebhook = true`
3. If the merchant requires authentication: obtains an OAuth token first
4. JSON payload built from a configurable SQL query (customizable per merchant with no code change)
5. POST sent to the merchant's URL with authorization headers

### Impact on the Merchant

When a FUNDED webhook fires, the merchant knows it can release the merchandise to the customer. When EXPIRED fires, the merchant stops holding inventory.

---

## 48. Merchant Management

### Creation

| Field | Required | Description |
|-------|-----------|-----------|
| clientType | Yes | Integration type |
| refMerchantCode | Yes | Reference code |
| username, apiKey, merchantUrl | Default from clientType | Credentials |

### Activation/Deactivation

| Action | How to Trigger | Impact |
|------|-------------|---------|
| Deactivation | Admin Panel -> Merchant -> Deactivate | Locks users via AMS. New applications continue but may be auto-denied |
| Activation | Admin Panel -> Merchant -> Activate | Unlocks users |
| Remove from users | Admin Panel (only if inactive) | Removes merchant from all profiles |
| Auto-Deny | Set `autoDenyApplication = TRUE` on the merchant | Automatically denies all applications |

### Clone

Creates a copy of the merchant: `pk = 0`, `clonedFrom = originalPk`, code += `_clone`. Programs copied.

### How to Trigger

- **Create:** `POST /uown/createMerchant`
- **Update:** `POST /uown/updateMerchant`
- **Clone:** `POST /uown/cloneMerchant/{merchantPk}`
- **Deactivate:** `POST /uown/deactivateMerchant/{merchantPk}`

---

## 49. Lead Management

### Allowed Transitions via ChangeLeadStatus

Only for: `UW_APPROVED`, `EXPIRED`, `SIGNED`

### Special Rules

| Transition | Rule |
|-----------|-------|
| EXPIRED -> UW_APPROVED | Requires a new expiration date |
| UW_DENIED -> UW_APPROVED | Changes the approval amount |
| -> SIGNED (with existing account) | Cancels account if configured, refunds if configured |
| Non-eligible status -> UW_APPROVED | Re-runs remaining UW steps with a reset of fraud services |

### How to Trigger

- **Change status:** `POST /uown/los/changeLeadStatus`
- **Blacklist lead:** `POST /uown/los/blacklistLead/{leadPk}`
- **Re-approve:** Via Admin Panel or the change-status endpoint

---

## 51. Merchant Integration API (Full API)

### What It Is

The UOwn Leasing API enables full integration with the UOwn financing platform, allowing merchants to automate application submission, invoice processing, contract management, and status tracking -- all via API without the need for manual interaction with the Merchant Portal.

### What It's For

Merchants that have their own systems (e-commerce, POS, ERP) can integrate directly with UOwn to offer financing to their customers without leaving the merchant's platform.

### Authentication

Every request must include authentication credentials in the body:

| Field | Description | Required |
|-------|-----------|-------------|
| `userName` | Username assigned to the merchant | Yes |
| `setupPassword` | Authentication password | Yes |
| `merchantNumber` | Unique merchant identifier (e.g., `OL90202-0001`) | Yes |

**How to obtain credentials:**
1. Contact the UOwn team
2. Provide merchant details and use case
3. Receive `userName`, `setupPassword`, and `merchantNumber`

**Network requirements:** Egress IPs must be whitelisted. Provide UOwn with: merchant name, environment (Sandbox/Production), access type, and static IPs. Using a NAT Gateway for consistent IPs is recommended.

### Integration Flows

#### Flow 1: Full Application (With Invoice/Cart)

```
1. Merchant sends sendApplication WITH cart items
2. UOwn processes application + underwriting
3. If approved: returns a link to finalize the lease
4. Customer completes payment data and signs the contract via the link
5. Merchant calls settleApplication to initiate funding
```

**When to use:** When the customer has already chosen the items before applying. Faster to finalize.

#### Flow 2: Pre-Approval (No Invoice)

```
1. Merchant sends sendApplication WITHOUT items (pre-approval)
2. UOwn returns the approved amount (creditLimit)
3. Customer chooses items based on the approved credit
4. Merchant sends sendInvoice with the selected items
5. UOwn returns a link to finalize the lease
6. Customer completes payment data and signs the contract
7. Merchant calls settleApplication to initiate funding
```

**When to use:** When the merchant wants to give the customer a credit limit before the purchase. More flexibility.

### Lease Finalization (Signing)

After approval, the customer must complete:
1. Enter payment data (CC or ACH)
2. Review the lease terms
3. Decide on the protection plan (opt-in/opt-out)
4. Sign the digital contract

**Two ways to finalize:**

| Method | Description |
|--------|-----------|
| **UOwn Portal** | Customer accesses the link returned by the API (`redirectUrl`) and completes it on the UOwn site |
| **Embedded Page (Iframe)** | Merchant embeds the finalization pages inside its own platform via iframe |

### Finalization Notifications

After the customer signs or declines the contract, UOwn notifies the merchant in 3 ways:

#### 1. URL Redirect

The customer is redirected to the `returnUrl` provided by the merchant with parameters:
- `event=completed` (signed) or `event=cancelled` (declined)
- `ata={UUID}` (unique application identifier)

**Example:** `{returnUrl}?event=completed&ata=892828a0-f766-4183-add7-781cbbc1ac83`

#### 2. Iframe PostMessage

If signing occurs in an embedded iframe, UOwn sends a `postMessage` on completion. The merchant listens for the event and updates its system.

#### 3. Webhook

UOwn sends a POST to the configured webhook URL with the lease's updated status. Message and URL are configurable per merchant.

---

### API Endpoints

#### 51.1 POST /uown/los/sendApplication

**What it does:** Submits a customer application for credit evaluation. May or may not include cart items.

**Required request fields:**

| Field | JSON Tag | Required | Format/Notes |
|-------|----------|-------------|---------------|
| Username | `userName` | Yes | |
| Password | `setupPassword` | Yes | |
| Merchant Number | `merchantNumber` | Yes | |
| First name | `mainFirstName` | Yes | |
| Last name | `mainLastName` | Yes | |
| Date of birth | `mainDOB` | Yes | MMDDYYYY |
| SSN | `mainSSN` | Yes | Digits only, no hyphens |
| Address | `mainAddress1` | Yes | |
| City | `mainCity` | Yes | |
| ZIP code | `mainPostalCode` | Yes | Digits only |
| Cell phone | `mainCellPhone` | Yes | Digits only, 10 digits |
| Employer | `mainEmployerName` | Yes | |
| Income (monthly or annual) | `mainMonthlyIncome` or `mainAnnualIncome` | Yes | One of the two required |
| Email | `emailAddress` | Yes | |
| IP | `ipaddress` | Yes | |
| SEON Fingerprint | `seonFingerprintText` | Yes | Fraud protection |

**Important optional fields:**

| Field | JSON Tag | Notes |
|-------|----------|-------|
| Return URL | `returnUrl` | Redirect after signing |
| External ID | `externalReferenceId` | Merchant identifier per application |
| UUID | `uuid` | Unique identifier generated by the merchant |
| Customer code | `customerCode` | Customer ID in the merchant's system |
| Desired frequency | `desiredPaymentFrequency` | WEEKLY, BI_WEEKLY, SEMI_MONTHLY, MONTHLY |
| Next pay date | `mainNextPayDate` | MMDDYYYY (configurable per merchant) |
| Pay frequency | `mainPayFrequency` | WEEKLY, BI_WEEKLY, SEMI_MONTHLY, MONTHLY |
| Last pay date | `mainLastPayDate` | MMDDYYYY |
| Language | `languagePreference` | E = English, S = Spanish |
| Individual/joint indicator | `individualJointIndicator` | I = Individual, J = Joint |
| Locale | `localeString` | Default: en_US |
| Deposit | `depositAmount` | Decimal, up to 10 digits |
| Order total | `orderTotal` | Decimal (required if cart included) |
| Merchandise subtotal | `merchandiseSubtotal` | Sum before tax |
| Sales Tax | `salesTax` | Decimal |
| Discount | `discountAmount` | Up to 10 digits |
| Shipping | `deliveryCharge` | Decimal |
| Installation | `installationCharge` | Decimal |
| Miscellaneous fees | `miscellaneousFees` | Decimal |
| Requested amount | `requestedLoanAmount` | Decimal |
| Past bankruptcy | `mainPastBankruptcy` | boolean |
| Current/future bankruptcy | `mainCurrentOrFutureBankruptcy` | boolean |
| Ship to same as customer | `shipToSameAsConsumer` | boolean |

**Optional address and residence fields:**

| Field | JSON Tag | Notes |
|-------|----------|-------|
| State | `mainStateOrProvince` | State abbreviation |
| Address line 2 | `mainAddress2` | |
| Living there since | `mainAtAddressFrom` | MMYY format |
| Home phone | `mainHomePhone` | Digits only |
| Housing status | `mainHousingStatus` | O=Owner, R=Renter, PR=Parents/Relatives, OT=Other |
| Monthly housing payment | `mainMonthlyHousingPayment` | Decimal |
| Mortgage balance | `mainMortgageBalance` | Integer |
| Home value | `mainHomeValue` | Integer |
| Previous address 1 | `mainPrevAddress1` | |
| Previous address 2 | `mainPrevAddress2` | |
| Previous city | `mainPrevCity` | |
| Previous state | `mainPrevStateOrProvince` | |
| Previous ZIP code | `mainPrevPostalCode` | Digits only |
| Living at previous address since | `mainAtPrevAddressFrom` | MMYY format |

**Optional banking fields:**

| Field | JSON Tag | Notes |
|-------|----------|-------|
| Checking account | `mainCheckingAccount` | Y or N |
| Savings account | `mainSavingsAccount` | Y or N |
| Account duration | `mainBankAccountDuration` | Enum |
| Account number | `mainBankAccountNumber` | Digits only |
| Routing number | `mainBankRoutingNumber` | Digits only |
| Account opened date | `mainBankAccountOpenedDate` | MMDDYYYY |
| Account type | `mainBankAccountType` | CHECKING or SAVINGS |

**Optional employment fields:**

| Field | JSON Tag | Notes |
|-------|----------|-------|
| Employment status | `mainEmplStatus` | D=Disabled, E=Employed, etc. |
| Employed since | `mainAtEmployerFrom` | MMYY format |
| Occupation | `mainOccupation` | |
| Employer phone | `mainEmployerPhone` | Digits only |
| Monthly net income | `mainMonthlyNetIncome` | Integer |
| Marital status | `mainMaritalStatus` | M=Married, U=Unmarried |
| Mother's maiden name | `mainMotherMaidenName` | |

**Cart item fields (if included):**

| Field | JSON Tag | Required | Notes |
|-------|----------|-------------|-------|
| Line number | `lineItemLineNumber` | Yes | |
| Product number | `lineItemProductNumber` | Yes | SKU |
| Description | `lineItemProductDescription` | Yes | |
| Category | `lineItemProductCategory` | Yes | |
| Type | `lineItemType` | Yes | D = Debit/Sale, C = Credit/Return |
| Quantity | `lineItemQuantityOrdered` | Yes | |
| Unit price | `lineItemUnitPrice` | Yes | Up to 10 digits, 2 decimals |
| Total price | `lineItemExtendedPrice` | Yes | Price x quantity |
| Serial number | `lineItemSerialNumber` | No | Product serial number |
| Base price | `lineItemBasePrice` | No | Decimal |
| Item tax | `lineItemTaxAmount` | No | Decimal |

**SEON Fingerprint (Fraud Protection):**
UOwn uses the SEON platform for fraud protection via device fingerprinting. Merchants must implement the SEON SDK on their sites/apps:
- **Websites:** Include the SEON JavaScript Agent, call `seon.config()` and `seon.getBase64Session()`
- **iOS:** Integrate via CocoaPods
- **Android:** Integrate via Gradle
The generated value must be passed as `seonFingerprintText`.

**Request example (with cart):**

```json
{
    "userName": "merchant_user",
    "setupPassword": "merchant_pass",
    "merchantNumber": "OL90202-0001",
    "mainFirstName": "Joe",
    "mainLastName": "Sample",
    "mainDOB": "01011998",
    "mainSSN": "881469868",
    "emailAddress": "joesample@outlook.com",
    "mainAddress1": "666 Test Street",
    "mainCity": "Test City",
    "mainPostalCode": "77494",
    "mainCellPhone": "5038784427",
    "languagePreference": "E",
    "mainEmployerName": "BestBuy",
    "mainNextPayDate": "05252025",
    "mainPayFrequency": "MONTHLY",
    "seonFingerprintText": "fingerPrintText",
    "ipaddress": "192.168.0.2",
    "desiredPaymentFrequency": "WEEKLY",
    "mainAnnualIncome": 510000,
    "merchandiseSubtotal": 1200.00,
    "salesTax": 0.00,
    "orderTotal": 1200.00,
    "lineItem": [
        {
            "lineItemLineNumber": "101",
            "lineItemProductNumber": "SKU98765",
            "lineItemProductDescription": "Smart TV 55-inch 4K",
            "lineItemProductCategory": "Electronics",
            "lineItemType": "D",
            "lineItemQuantityOrdered": 1,
            "lineItemUnitPrice": 1200.00,
            "lineItemExtendedPrice": 1200.00
        }
    ]
}
```

**Response example (approved):**

```json
{
    "faults": false,
    "accountNumber": "c60b6434-29ef-43ac-bd0e-594a72741b53",
    "authorizationNumber": "8280",
    "merchantName": "Progress Mobility Acquisition LLC",
    "customerFirstName": "Joe",
    "customerLastName": "Sample",
    "orderTotal": 1200,
    "transactionStatus": "E0",
    "appApprovalStatus": "APPROVED",
    "creditLimit": 5136,
    "programType": "LTO",
    "paymentDetailsList": [
        {
            "redirectUrl": "https://origination.uownleasing.com/completeApplication?uuid=...",
            "totalContractAmountWithTax": 2857.73,
            "regularPaymentWithTax": 50.32,
            "numberOfPayments": 56,
            "frequency": "WEEKLY",
            "firstPaymentDate": "2025-03-25",
            "paymentDueToday": 40
        },
        {
            "redirectUrl": "https://origination.uownleasing.com/completeApplication?uuid=...",
            "totalContractAmountWithTax": 2857.73,
            "regularPaymentWithTax": 100.63,
            "numberOfPayments": 28,
            "frequency": "BI_WEEKLY",
            "firstPaymentDate": "2025-03-25",
            "paymentDueToday": 40
        }
    ]
}
```

**Response example (declined - SSN ending in 9):**

```json
{
    "faults": false,
    "fieldInError1": "SSN : ending with 9 is rejected on test server",
    "accountNumber": "b5444312-2c6e-4238-8bf7-37088d9d527b",
    "authorizationNumber": "8279",
    "transactionStatus": "E4",
    "appApprovalStatus": "DECLINED",
    "creditLimit": 0,
    "programType": "LTO"
}
```

**Response example (validation error - 400):**

```json
{
    "faults": true,
    "fieldInError1": "mainNextPayDate",
    "sorErrorDescription": "NextPayDate should be in the future. Received 2025-03-05",
    "transactionStatus": "E3",
    "appApprovalStatus": "DECLINED"
}
```

**Important response fields:**

| Field | Description |
|-------|-----------|
| `accountNumber` | Application UUID (use in future calls) |
| `appApprovalStatus` | APPROVED or DECLINED |
| `creditLimit` | Maximum approved amount |
| `transactionStatus` | E0 = not approved for transaction, E1 = approved, E3 = validation error, E4 = declined |
| `paymentDetailsList` | Payment options with `redirectUrl` for finalization |
| `redirectUrl` | Link for the customer to complete signing |
| `totalContractAmountWithTax` | Total contract amount with tax |
| `totalContractAmountNoTax` | Total contract amount without tax |
| `regularPaymentWithTax` | Regular installment amount |
| `numberOfPayments` | Total installments |
| `firstPaymentWithFeesAndTax` | First payment including fees and tax |
| `firstPaymentWithFeesNoTax` | First payment including fees without tax |
| `firstPaymentDate` | First payment date |
| `paymentDueToday` | Amount to pay today (security deposit) |
| `purchaseNowTotal` | Total for immediate purchase |
| `faults` | true = error, false = success |
| `fieldInError1` | Field with error (in case of failure) |
| `sorErrorDescription` | Detailed error description |

---

#### 51.2 POST /uown/los/sendInvoice

**What it does:** Sends an invoice separately when it was not included in sendApplication. Also used to cancel, return, or modify invoices.

**Operations supported via `orderType`:**

| orderType | Operation | Description |
|-----------|----------|-----------|
| `1` | **Submit Invoice** | Sends items to complete the lease |
| `5` | **Cancel Invoice** | Removes the invoice but keeps the approval active |
| `1` (with type C items) | **Return Items** | Partial or total return |
| `1` (modified items) | **Modify Invoice** | Updates existing items/values |

**Request fields:**

| Field | JSON Tag | Required | Description |
|-------|----------|-------------|-----------|
| Username | `userName` | Yes | |
| Password | `setupPassword` | Yes | |
| Merchant Number | `merchantNumber` | Yes | |
| Account Number | `accountNumber` | Yes | UUID returned from sendApplication |
| Order Type | `orderType` | Yes | 1 = sale, 5 = cancellation |
| Invoice Number | `invoiceNumber` | Recommended | Merchant reference number |
| Order Total | `orderTotal` | Yes | Order total |
| Frequency | `selectedPaymentFrequency` | Optional | WEEKLY, BI_WEEKLY, etc. |
| Line Items | `lineItem` | Yes (for sales) | Array of items |

**Example - Submit Invoice:**

```json
{
    "userName": "merchant_user",
    "setupPassword": "merchant_pass",
    "merchantNumber": "OL90202-0001",
    "accountNumber": "c60b6434-29ef-43ac-bd0e-594a72741b53",
    "orderType": "1",
    "invoiceNumber": "INV123456",
    "orderTotal": 1200.00,
    "selectedPaymentFrequency": "WEEKLY",
    "lineItem": [
        {
            "lineItemLineNumber": "101",
            "lineItemProductNumber": "SKU98765",
            "lineItemProductDescription": "Smart TV 55-inch 4K",
            "lineItemProductCategory": "Electronics",
            "lineItemType": "D",
            "lineItemQuantityOrdered": 1,
            "lineItemUnitPrice": 1200.00,
            "lineItemExtendedPrice": 1200.00
        }
    ]
}
```

**Example - Cancel Invoice:**

```json
{
    "userName": "merchant_user",
    "setupPassword": "merchant_pass",
    "merchantNumber": "OL90202-0001",
    "orderType": "5",
    "accountNumber": "c60b6434-29ef-43ac-bd0e-594a72741b53",
    "orderTotal": "0.00"
}
```

**Example - Return Items (Partial):**

For a partial return, include returned items with `lineItemType: "C"` and kept items with `lineItemType: "D"`:

```json
{
    "userName": "merchant_user",
    "setupPassword": "merchant_pass",
    "merchantNumber": "OL90202-0001",
    "orderType": "1",
    "accountNumber": "c60b6434-29ef-43ac-bd0e-594a72741b53",
    "invoiceNumber": "INV123456",
    "orderTotal": 300.00,
    "lineItem": [
        {
            "lineItemLineNumber": "001",
            "lineItemProductNumber": "SKU67890",
            "lineItemProductDescription": "Wireless Headphones",
            "lineItemProductCategory": "Electronics",
            "lineItemType": "C",
            "lineItemQuantityOrdered": 1,
            "lineItemUnitPrice": 300.00,
            "lineItemExtendedPrice": 300.00
        },
        {
            "lineItemLineNumber": "002",
            "lineItemProductNumber": "SKU67891",
            "lineItemProductDescription": "Mouse",
            "lineItemProductCategory": "Electronics",
            "lineItemType": "D",
            "lineItemQuantityOrdered": 1,
            "lineItemUnitPrice": 300.00,
            "lineItemExtendedPrice": 300.00
        }
    ]
}
```

**For a total return:** Leave the item list empty and `orderTotal = 0.00`.

**Example - Modify Invoice:**

Send `orderType: "1"` with the existing `invoiceNumber`, an updated `orderTotal`, and an updated item list. Do not include cancelled/returned items. Ensure the calculated totals match the item list.

**Success response - submit invoice (`transactionStatus: "A1"`):**

```json
{
    "faults": false,
    "accountNumber": "235c48df-7ae0-4fa5-a93a-e7f65e8cffd9",
    "authorizationNumber": "8365",
    "orderTotal": 1200,
    "transactionStatus": "A1",
    "authApprovalStatus": "APPROVED",
    "invoiceItems": [
        {
            "lineItemId": 15993,
            "lineItemLineNumber": 101,
            "lineItemProductNumber": "SKU98765",
            "lineItemSerialNumber": "SN12345678",
            "lineItemProductCategory": "Electronics",
            "lineItemType": "DEBIT_SALE",
            "lineItemQuantityOrdered": 1,
            "lineItemUnitPrice": 1200,
            "lineItemExtendedPrice": 1200,
            "lineItemStatus": "ADDED_TO_CART",
            "lineitemProductDescription": "Smart TV 55-inch 4K"
        }
    ],
    "paymentDetailsList": [
        {
            "redirectUrl": "https://origination.uownleasing.com/completeApplication?uuid=...",
            "totalContractAmountWithTax": 2817.73,
            "totalContractAmountNoTax": 2651.97,
            "regularPaymentWithTax": 50.32,
            "numberOfPayments": 56,
            "frequency": "WEEKLY",
            "firstPaymentWithFeesAndTax": 50.32,
            "firstPaymentDate": "2025-04-15",
            "paymentDueToday": 0
        }
    ]
}
```

**Success response - modify invoice:**

```json
{
    "faults": false,
    "accountNumber": "235c48df-7ae0-4fa5-a93a-e7f65e8cffd9",
    "authorizationNumber": "8365",
    "orderTotal": 1800,
    "transactionStatus": "A1",
    "authApprovalStatus": "APPROVED",
    "invoiceItems": [
        {
            "lineItemId": 15996,
            "lineItemLineNumber": 1,
            "lineItemProductNumber": "SKU12345",
            "lineItemProductCategory": "Electronics",
            "lineItemType": "DEBIT_SALE",
            "lineItemQuantityOrdered": 1,
            "lineItemUnitPrice": 1500,
            "lineItemExtendedPrice": 1500,
            "lineItemStatus": "ADDED_TO_CART",
            "lineitemProductDescription": "Laptop"
        },
        {
            "lineItemId": 15997,
            "lineItemLineNumber": 2,
            "lineItemProductNumber": "SKU67890",
            "lineItemProductCategory": "Accessories",
            "lineItemType": "DEBIT_SALE",
            "lineItemQuantityOrdered": 1,
            "lineItemUnitPrice": 300,
            "lineItemExtendedPrice": 300,
            "lineItemStatus": "ADDED_TO_CART",
            "lineitemProductDescription": "Wireless Mouse"
        }
    ]
}
```

**Success response - return item:**

```json
{
    "faults": false,
    "accountNumber": "235c48df-7ae0-4fa5-a93a-e7f65e8cffd9",
    "authorizationNumber": "8365",
    "orderTotal": 1500,
    "transactionStatus": "A1",
    "authApprovalStatus": "APPROVED",
    "invoiceItems": [
        {
            "lineItemId": 15998,
            "lineItemLineNumber": 1,
            "lineItemProductNumber": "SKU12345",
            "lineItemProductCategory": "Electronics",
            "lineItemType": "DEBIT_SALE",
            "lineItemQuantityOrdered": 1,
            "lineItemUnitPrice": 1500,
            "lineItemExtendedPrice": 1500,
            "lineItemStatus": "ADDED_TO_CART",
            "lineitemProductDescription": "Laptop"
        },
        {
            "lineItemId": 15999,
            "lineItemLineNumber": 2,
            "lineItemProductNumber": "SKU67890",
            "lineItemProductCategory": "Accessories",
            "lineItemType": "CREDIT_RETURN",
            "lineItemQuantityOrdered": 1,
            "lineItemUnitPrice": 300,
            "lineItemExtendedPrice": 300,
            "lineItemStatus": "RETURNED",
            "lineitemProductDescription": "Wireless Mouse"
        }
    ]
}
```

**Error response (account not found - 400):**

```json
{
    "faults": true,
    "fieldInError1": "CustomerCode Or AccountNumber",
    "sorErrorDescription": "Lead could not be found with the given parameters",
    "transactionStatus": "A0",
    "authApprovalStatus": "DECLINED"
}
```

---

#### 51.3 POST /uown/los/getApplicationStatus

**What it does:** Queries the current status of a lease application. Allows tracking progress, confirming state transitions, and verifying lead data.

**Request:**

```json
{
    "userName": "merchant_user",
    "setupPassword": "merchant_pass",
    "merchantNumber": "OL90202-0001",
    "localeString": "en_US",
    "accountNumber": "235c48df-7ae0-4fa5-a93a-e7f65e8cffd9"
}
```

**Important response fields:**

| Field | JSON Tag | Description |
|-------|----------|-----------|
| Application found | `applicationFound` | true/false |
| Current status | `currentStatus` | UW_APPROVED, UW_DENIED, DENIED, CONTRACT_CREATED, SIGNED, FUNDING, FUNDED, etc. |
| Status description | `statusDescription` | Additional details |
| Lease signed | `hasSignedLease` | true/false |
| Can continue | `canContinue` | Whether the application can proceed to the next step |
| Approved amount | `approvedAmount` | Approved credit limit |
| Open to Buy | `openToBuy` | Remaining available credit |
| Account balance | `accountBalance` | Current lease balance |
| Last payment | `lastPayment` / `lastPaymentDate` | Amount and date |
| Next due date | `paymentDueDate` | Next payment date |
| Amount to be funded | `amountToBeFunded` | Total that will be paid to the merchant |
| Fund request date | `fundRequestDateTime` | When funding was requested |
| Funded date | `fundedDateTime` | When the merchant received payment |
| Merchant discount | `merchantDiscountPercent` / `merchantDiscountAmount` | Discount % or amount |
| Merchant rebate | `merchantRebatePercent` / `merchantRebateAmount` | Rebate % or amount |
| External ID | `externalReferenceId` | Merchant identifier |
| Items | `lineItem` | List of lease items |

**Possible values of `currentStatus`:**

| Status | Description |
|--------|-----------|
| `UW_APPROVED` | Approved by underwriting |
| `UW_DENIED` | Denied by underwriting |
| `DENIED` | Denied |
| `CONTRACT_CREATED` | Contract created |
| `SIGNED` | Contract signed |
| `FUNDING` | In the funding process |
| `FUNDED` | Successfully funded |
| `CANCELLED_DUP_SSN` | Cancelled due to duplicate SSN |

**Response example (UW_APPROVED):**

```json
{
    "faults": false,
    "accountNumber": "235c48df-7ae0-4fa5-a93a-e7f65e8cffd9",
    "authorizationNumber": "8365",
    "applicationFound": true,
    "applicationSubmitted": true,
    "applicationCreatedTimestamp": "2025-04-08T19:40:20.777815",
    "appUuid": "235c48df-7ae0-4fa5-a93a-e7f65e8cffd9",
    "leadPk": 8365,
    "currentStatus": "UW_APPROVED",
    "canContinue": true,
    "approvedAmount": 5136,
    "openToBuy": 3936,
    "customerFirstName": "Joe",
    "customerLastName": "Sample",
    "merchantName": "Progress Mobility Acquisition LLC",
    "refMerchantCode": "OL90294-0001",
    "totalInvoiceAmount": 1200,
    "merchantInvoiceNumber": "R123456",
    "transactionStatus": "I0",
    "merchantDiscountPercent": 0.5,
    "merchantRebatePercent": 0,
    "merchantRebateType": "DAILY"
}
```

**Response example (FUNDING - after signing and settlement):**

```json
{
    "faults": false,
    "accountNumber": "235c48df-7ae0-4fa5-a93a-e7f65e8cffd9",
    "authorizationNumber": "8365",
    "applicationFound": true,
    "applicationSubmitted": true,
    "currentStatus": "FUNDING",
    "hasSignedLease": true,
    "canContinue": true,
    "approvedAmount": 5136,
    "openToBuy": 3936,
    "paymentDueDate": "2025-04-15",
    "fundRequestDateTime": "2025-04-08T20:29:53.727201",
    "fundedDateTime": null,
    "amountToBeFunded": 600,
    "merchantDiscountPercent": 0.5,
    "merchantDiscountAmount": 600,
    "merchantRebatePercent": 0,
    "merchantRebateAmount": 0,
    "merchantRebateType": "DAILY"
}
```

---

#### 51.4 POST /uown/los/settleApplication

**What it does:** Finalizes a lease application after the customer has signed the contract and the products have been delivered. Triggers the **funding** process (payment to the merchant).

**When to use:** Only after:
1. The customer has signed the lease digitally
2. The merchant has delivered the merchandise

**Request:**

```json
{
    "userName": "merchant_user",
    "setupPassword": "merchant_pass",
    "merchantNumber": "OL90202-0001",
    "accountNumber": "235c48df-7ae0-4fa5-a93a-e7f65e8cffd9"
}
```

**Response fields:**

| Field | JSON Tag | Description |
|-------|----------|-----------|
| Transaction Status | `transactionStatus` | A0 = not settled, A1 = settled |
| Amount | `amount` | Amount involved in the transaction |
| Transaction Message | `transactionMessage` | Descriptive message (in case of A0) |
| Payment Details | `paymentDetailsList` | Payment details |
| Account Number | `accountNumber` | Same as the request |
| Authorization Number | `authorizationNumber` | If successful (A1) |

**Response example (not eligible - A0):**

```json
{
    "faults": false,
    "accountNumber": "235c48df-7ae0-4fa5-a93a-e7f65e8cffd9",
    "authorizationNumber": "8365",
    "transactionMessage": "LeadStatus UW_APPROVED is not eligible for settlement",
    "transactionStatus": "A0",
    "amount": 0,
    "paymentDetailsList": []
}
```

**Response example (settled successfully - A1):**

```json
{
    "faults": false,
    "accountNumber": "235c48df-7ae0-4fa5-a93a-e7f65e8cffd9",
    "authorizationNumber": "8365",
    "transactionStatus": "A1",
    "amount": 1200,
    "paymentDetailsList": []
}
```

---

#### 51.5 POST /uown/los/addLease

**What it does:** Creates an **additional lease** using the remaining credit from a previously funded lease of the same customer.

**Pre-conditions:**
1. The original lease must be **FUNDED**
2. The customer must have made the **first payment** on time
3. There must be **remaining credit** available (`openToBuy > 0`)

**Request:** Identical structure to sendInvoice, but using a different endpoint.

```json
{
    "userName": "merchant_user",
    "setupPassword": "merchant_pass",
    "merchantNumber": "OL90202-0001",
    "accountNumber": "c60b6434-29ef-43ac-bd0e-594a72741b53",
    "customerCode": "ABC123",
    "orderType": "1",
    "invoiceNumber": "R91931",
    "orderTotal": "250.00",
    "selectedPaymentFrequency": "WEEKLY",
    "lineItem": [
        {
            "lineItemLineNumber": "1",
            "lineItemProductNumber": "A123SKU5987",
            "lineItemProductDescription": "Product test description",
            "lineItemProductCategory": "Cat1",
            "lineItemType": "D",
            "lineItemQuantityOrdered": "1",
            "lineItemUnitPrice": "250",
            "lineItemExtendedPrice": "250.00"
        }
    ]
}
```

**Error response (lease not finalized):**

```json
{
    "faults": false,
    "sorErrorDescription": "Cannot add a lease before the lease contract is finalized.",
    "transactionStatus": "A0",
    "authApprovalStatus": "DECLINED"
}
```

**Success response (add lease approved):**

```json
{
    "faults": false,
    "accountNumber": "049819e0-c4fe-47a1-a2d7-613bed206c08",
    "authorizationNumber": "8367",
    "merchantName": "Progress Mobility Acquisition LLC",
    "customerFirstName": "Joe",
    "customerLastName": "Sample",
    "orderTotal": 250,
    "purchaseNowTotal": 0,
    "transactionStatus": "A1",
    "authApprovalStatus": "APPROVED",
    "paymentDetailsList": [
        {
            "redirectUrl": "https://origination.uownleasing.com/completeApplication?uuid=...",
            "totalContractAmountWithTax": 587.03,
            "totalContractAmountNoTax": 552.48,
            "regularPaymentWithTax": 10.49,
            "numberOfPayments": 56,
            "frequency": "WEEKLY",
            "firstPaymentWithFeesAndTax": 10.49,
            "firstPaymentDate": "2025-04-15",
            "paymentDueToday": 0
        },
        {
            "redirectUrl": "https://origination.uownleasing.com/completeApplication?uuid=...",
            "totalContractAmountWithTax": 587.03,
            "totalContractAmountNoTax": 552.50,
            "regularPaymentWithTax": 20.96,
            "numberOfPayments": 28,
            "frequency": "BI_WEEKLY",
            "firstPaymentWithFeesAndTax": 20.96,
            "firstPaymentDate": "2025-04-15",
            "paymentDueToday": 0
        }
    ]
}
```

---

#### 51.6 POST /uown/los/merchant/changeMerchant

**What it does:** Changes the merchant associated with an application. Used when an application needs to be transferred to another merchant.

**NOTE:** This endpoint uses different authentication fields from the others (`username`/`password` instead of `userName`/`setupPassword`).

**Request:**

```json
{
    "username": "admin_user",
    "password": "admin_pass",
    "refMerchantCode": "OL90294-0002",
    "accountNumber": "235c48df-7ae0-4fa5-a93a-e7f65e8cffd9"
}
```

| Field | JSON Tag | Required | Description |
|-------|----------|-------------|-----------|
| Username | `username` | Yes | Different from the other endpoints (lowercase) |
| Password | `password` | Yes | Different from the other endpoints |
| Merchant Code | `refMerchantCode` | Yes | Code of the new merchant |
| Account Number | `accountNumber` | Yes | Application UUID |

---

### IP Whitelisting Requirement

The merchant system's egress IPs must be registered and allowed by UOwn before they can access the API. For cloud providers, using a **NAT Gateway** is recommended to ensure consistent egress IPs.

---

### Sandbox and QA1 Rules for Testing

> **Important:** The SSN rules below apply only to **sandbox and qa1**, where the underwriting engine is mocked. In **qa2**, the BlackBox/ABB engine is real and ignores the SSN suffix — the result depends on the live evaluation of the lead.

| Rule | Environments | Description |
|-------|-----------|-----------|
| **SSN ending in 9** | sandbox, qa1 | Application will be **denied** (simulates failure via the UW mock) |
| **SSN ending in 0-8** | sandbox, qa1 | Application will be **approved** (simulates success via the UW mock) |
| **SSN any suffix** | qa2 | Result determined by the real engine (there is no reliable trigger for denial without DevOps/PO authorization) |
| **Minimum lease amount** | all envs | **$250** - applications below this amount will not be approved |

### Endpoint Summary

| Endpoint | Method | Description |
|----------|--------|-----------|
| `/uown/los/sendApplication` | POST | Submits an application (with or without a cart) |
| `/uown/los/sendInvoice` | POST | Sends/cancels/returns/modifies an invoice |
| `/uown/los/getApplicationStatus` | POST | Queries the application status |
| `/uown/los/settleApplication` | POST | Finalizes the lease and triggers funding |
| `/uown/los/addLease` | POST | Creates an additional lease with remaining credit |
| `/uown/los/merchant/changeMerchant` | POST | Transfers the application to another merchant |

### Response Status Codes

| Code | Field | Meaning |
|--------|-------|-------------|
| `E0` | `transactionStatus` | Application received, not approved for transaction |
| `E1` | `transactionStatus` | Application approved for transaction |
| `E3` | `transactionStatus` | Validation error (invalid field in the request) |
| `E4` | `transactionStatus` | Application declined |
| `A0` | `transactionStatus` | Settlement not performed / invoice not processed |
| `A1` | `transactionStatus` | Settlement performed / invoice processed successfully |
| `I0` | `transactionStatus` | Informational status (query) |
| `APPROVED` | `appApprovalStatus` / `authApprovalStatus` | Approved |
| `DECLINED` | `appApprovalStatus` / `authApprovalStatus` | Declined |


## 67. Funding Modification Audit

### What It Is

Records and tracks all status modifications in the funding process, maintaining a complete audit trail.

### What It's For

Compliance and troubleshooting. Allows reconstructing the complete history of funding status changes for any lead.

### Recorded Data

| Field | Description |
|-------|-----------|
| `leadPk` | Lead identifier |
| `oldFundingQueueStatus` | Previous status (FUNDING, FUNDED, etc.) |
| `newFundingQueueStatus` | New status |
| `oldLeadStatus` | Previous lead status |
| `newLeadStatus` | New lead status |
| `username` | User who made the change |
| `timestamp` | Date/time of the modification |

### Valid Funding Transitions

| Transition | Description |
|-----------|-----------|
| `FUNDING -> FUNDED` | Merchant received payment (normal flow) |
| `FUNDED -> FUNDING` | Reversal (error or correction) |
| `REQUEST_REFUND -> REFUNDED` | Refund completed |
| Other | Invalid/default transition |

### How to Query

```
POST /uown/svc/getFundingModifications
Body: FundingModificationsRequest { leadPk, oldStatus, newStatus, username, startDate, endDate }
```

Supports pagination and optional filters (all fields are nullable).

---


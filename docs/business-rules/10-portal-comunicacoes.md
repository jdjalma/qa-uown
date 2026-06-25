---
title: Portal, Communications and Support
domain: business-rules
status: stable
volatility: stable
last_verified: 2026-06-18
sources:
  - db: uown_email_queue
  - db: uown_sms_queue
  - env: qa2
covers: [tms, portal-cliente, correspondencia, email, sms, consentimento, contato]
---

# Portal, Communications and Support
## UOwn Leasing - SVC Platform

TMS (phone agents), customer portal, correspondence (email/SMS), consent management, contact preferences and portal invitation.

---

## 26. TMS (Telephony Management System)

### What It Is

TMS (Telephony Management System) is the dedicated API for call center agents and collection bots (such as Skit.ai). It provides endpoints optimized for operations during phone calls.

### What It Is For

It gives agents everything they need during a call: viewing the account summary, processing payments, calculating payoff, moving due dates, and logging notes -- all without leaving the phone interface.

### What an Agent Can Do via TMS

| Endpoint | Function | Description |
|----------|--------|-----------|
| `getAccountSummary` | View summary | Name, status, next due date, balance, days past due, EPO, merchant |
| `getPayoffAmount` | Calculate payoff | Amount to pay off the account (EPO) |
| `makeCreditCardPayment` | Charge CC | Process a card payment |
| `makeCreditCardPayments` | CC arrangement | Multiple transactions (payment arrangement) |
| `makeAchPayment` | Charge ACH | Initiate a bank debit |
| `moveDueDatesByDays` | Move due dates | Defer installments by N days |
| `getBankAccounts` | View banks | Bank accounts on file |
| `getCreditCards` | View cards | Tokenized cards on file |
| `addLogNote` | Log note | Call note (Skit.ai uses type `SKIT_CALL_LOG`) |

### How the Customer Is Affected

The customer never sees TMS directly. They interact with the agent or bot over the phone, and TMS is the backend that makes everything possible in real time.

---

## 27. Customer Portal

### What It Is

A self-service web interface where customers manage their lease accounts.

### What It Is For

It reduces call center volume by enabling 24/7 self-service.

### Authentication

| Method | Description |
|--------|-----------|
| Personal data | First name, last name, last 4 of SSN, date of birth |
| Code verification | Sends a 6-digit code by SMS or email. Expires in 5 minutes |

### What the Customer Can Do

| Function | Description |
|--------|-----------|
| **View payments** | Full payment history for the account |
| **Make payments** | Create or modify payments |
| **Support** | Submit a support ticket (integrated with Zendesk) |
| **Protection plan** | View eligibility and enroll (if eligible) |
| **Correspondence** | Tracking of emails/SMS sent |

### Branding by Company

| Company | Portal |
|---------|--------|
| UOwn | Default UOwn URL |
| Kornerstone | `portal.kornerstoneliving.com` (prod) / `website-{env}.kornerstoneliving.com` |

### Support Ticket (Contact Routing via Zendesk)

The customer portal allows submitting support tickets with automatic routing by category. Implemented in `SupportTicketService`.

**Available categories (configurable via `ConfigurationManagement`):**

| Category | Displayed label | Destination email |
|-----------|--------------|---------------|
| `billing` | Billing / Payment Inquiry | `accountmanagement@uownleasing.com` |
| `payment_arrangement` | Payment Arrangement Request | `accountmanagement@uownleasing.com` |
| `merchant` | Merchandise / Merchant Concern | `merchantsupport@uownleasing.com` |
| `other` | Other | `accountmanagement@uownleasing.com` |

**Email subject format:**
```
[COMPANY] - Support Ticket - [Account Number] - [Customer Name]
```

**Required form fields:** Name, email, phone, category, description.

**Processing flow:**
1. Customer selects a category and fills out the form in the portal
2. System determines the company (UOwn or Kornerstone) from the account
3. HTML template rendered with Thymeleaf
4. Email sent to the address mapped by the category
5. Zendesk receives the email and routes it to the correct queue/department
6. Activity log created on the account with type `CORRESPONDENCE`

**Configuration:** Categories are configurable via the key `com.uownleasing.svc.service.SupportTicketService.email.categories` in pipe-delimited format: `value|label|email,value|label|email`.

---

## 29. Correspondence (Email/SMS)

### Templates by Company

| Company | Prefix | From Email (prod) |
|---------|---------|-------------------|
| UOwn | (none) | `CustomerService@uownleasing.com` |
| Kornerstone | `KORNERSTONE_` | `CS@kornerstoneliving.com` |

### Observed Correspondence Types

| Type | When |
|------|--------|
| Welcome Email | After import into SVC |
| Approval Email/SMS | After UW approval |
| Decline Email | After UW denial |
| First Payment Reminder | Before the first payment |
| Past Due Reminder | Account past due |
| Delinquency Offer (30/60/90/150 days) | Delinquency tiers |
| Paid in Full | Account paid off |
| Settled in Full | Account settled by agreement |
| Bank Verification Declined | Bank verification denied |
| Finalize Purchase | After verification, link to finalize |
| Portal Invitation | Customer portal invitation |

### Sending

| Mode | Description |
|------|-----------|
| Immediate | Sent right away |
| Queued | Added to the send queue |
| Async | Configurable delay before sending (default 3s) |
| SMS | Via Twilio, if the phone number is valid |

---

## 61. Consent Management

### What It Is

Manages the customer's consent preferences, specifically consent for CC Peek (partial card capture).

### What It Is For

CC Peek consent controls whether UOwn may capture a partial amount from the card when the balance is not sufficient for the full amount. The customer may allow or deny this practice.

### How It Works

- **Null-safe comparison** using `Objects.equals()` to detect a change
- **Activity log** created only if the value actually changes (idempotent)
- **Log message:** `"CC Peek Consent changed from [previous] to [new]"`
- **Log type:** `DATA_CHANGE`
- **Username** of the operator recorded via `ThreadAttributes`

### How to Change

Via the administrative interface or `ServicingInformationService`. Every change is recorded in an activity log.

---

## 72. Contact Preferences (Do Not Call / Do Not Email / Do Not Text)

### What It Is

A system for managing the customer's contact preferences that controls which communication channels may be used (phone, email, SMS). It honors opt-out regulations and requires a justification for changes.

### What It Is For

It ensures regulatory compliance (TCPA, CAN-SPAM) and respects the customer's wish not to be contacted through specific channels. It integrates with Five9 (call center) for automatic updates via IVR.

### Preference Fields

| Field | Available in | Editable in | Description |
|-------|--------------|-------------|-----------|
| **Do Not Email** | Servicing + Origination | Servicing | Blocks sending emails |
| **Do Not Call** | Servicing + Origination | Servicing | Blocks phone calls |
| **Do Not Text** | Servicing + Origination | Servicing | Blocks sending SMS |
| **Do Not Contact** | **Servicing only** | Servicing | Master switch - blocks ALL channels |

### Behavior Rules

**Edit mode:**
- Fields are **visually disabled** outside of edit mode
- The agent must click the section's edit button to enable changes
- Clicking Cancel **reverts all changes** without saving anything (visual or database)

**Required reason:**
- A reason/justification field is **required** before saving any change
- If the reason is empty when saving → error: "Reason is required"
- Each change generates a record in the activity log with the reason

**Do Not Contact (master rule):**
- When checked → it automatically checks Do Not Email, Do Not Call and Do Not Text
- All individual checkboxes become **disabled** while Do Not Contact is active
- It is not possible to uncheck channels individually while Do Not Contact is active
- Persistent across page navigation

**Origination vs Servicing:**
- Origination: Do Not Contact **is not visible** (only Do Not Call, Email, Text)
- Origination: fields are displayed but with limited editing
- Servicing: all 4 fields available and editable

### Integration with Five9 (IVR)

Five9 can update the `doNotText` preference automatically via API (`Five9Service.updateContactPreferences`):

1. Receives `phoneNumber` and `doNotText` (both required)
2. Validates US phone format (10 digits, removes the "1" prefix from 11 digits)
3. Looks up all phone records with that number
4. Updates `doNotText` on all records found
5. Creates an activity log on each associated account

### System Impact

Contact preferences directly affect:
- **Email/SMS sweeps:** Accounts with `doNotEmail`/`doNotText` are excluded
- **Portal invitation:** Honors `doNotEmail` and `doNotText` (Section 66)
- **Automatic correspondence:** Welcome, reminders, delinquency offers
- **Five9/Skit.ai:** Dialing lists exclude `doNotCall`

---

## 66. Customer Portal Invitation

### What It Is

A service that sends invitations by email and SMS for customers to access the self-service portal.

### What It Is For

It increases portal adoption, reducing the volume of calls to the call center.

### Sending Logic

| Channel | Enablement Config | Template | Send Condition |
|-------|----------------------|----------|-------------------|
| **Email** | `send.customer.portal.link.email` (default: true) | `CustomerPortalReminderEmail` | Email exists AND `doNotEmail = false` |
| **SMS** | `send.customer.portal.link.sms` (default: true) | `CustomerPortalReminderSms` | Phone exists AND `doNotText = false` |

### Opt-Out Compliance

The system honors two layers of opt-out:
1. **Global configuration:** Admin can disable sending per channel
2. **Customer preference:** `doNotEmail` and `doNotText` on the customer record

### Response Messages

| Scenario | Message |
|---------|----------|
| Both sent | "Customer portal reminder email and SMS sent successfully." |
| Email only | "Email sent successfully. SMS not sent due to [opt-out/disabled]." |
| SMS only | "SMS sent successfully. Email not sent due to [opt-out/disabled]." |
| None sent | "Email not sent due to [reason], SMS not sent due to [reason]." |

---


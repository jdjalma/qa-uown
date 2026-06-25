---
title: Administration and Operations
domain: business-rules
status: stable
volatility: volatile
last_verified: 2026-06-18
sources:
  - code: src/api/clients/scheduled-task.client.ts#triggerScheduledTask
  - db: uown_scheduled_task
  - env: qa2
covers: [blacklist, item-split, second-opportunity, sweeps, data-cleanup, api-auth, admin-panel]
---

# Administration and Operations
## UOwn Leasing - SVC Platform

Blacklist, item split, second opportunity, sweeps (batch processing), data cleanup, API authentication, and administrative panel.

---

## 30. Blacklist

### What It Is

Database of fraudulent customer identifiers. Any new application with matching data is automatically denied.

### Fields Checked

Name, SSN, email, phone, bank account, routing number, address, CC BIN (6 digits)

### How to Use (Internal User)

Via Admin Panel:
- Add/remove individual entries
- Blacklist an entire lead (all data at once -> lead status `BLACKLISTED`)

### Validations

- CC BIN must be exactly 6 digits
- Duplicate BINs are not allowed

---

## 31. Item Split (Cart Splitting)

### What It Is

When the cart cost exceeds the approval amount, the system can split the items into: **items to lease** (financed) and **items for immediate purchase** (charged to the card on the spot).

### What It Is For

Allows the customer to take all of their items even if the total amount exceeds the approval. The "leftover" items are paid immediately by card.

### Eligibility

| Condition (ALL must be true) | |
|---|---|
| Merchant has `isItemSplit = true` |
| Difference `(cost - approval) <= threshold` (default: $300) |

### How It Works

1. Service determines which items are financed vs. immediate purchase
2. Invoice updated: `purchaseTotal = sum of PURCHASED items`
3. `merchandiseAmount` and `totalInvoiceAmount` reduced by purchaseTotal
4. On submission, PURCHASE_NOW items generate a separate CC SALE transaction

---

## 32. Second Opportunity

### What It Is

System to track and potentially re-approve customers who were **previously blacklisted** or who had charged-off accounts.

### What It Is For

Some customers default but later improve their financial situation. The system allows re-engaging these customers under controlled conditions.

### How It Works

- Stores customer history: blacklist reason, date, CLV (Customer Lifetime Value)
- Allows setting a reduced `maxPrice` or `creditLimit`
- Allows selective whitelisting: `isBlacklisted = false, isWhitelisted = true`
- Tracks by `rtoAccountNumber` to identify recurring customers

---

## 34. Batch Processing (Sweeps) - Complete Guide

### What It Is

Sweeps are **scheduled jobs** that perform bulk operations on the system: process payments, retry declined charges, send emails, generate reports, sync taxes, etc. They are the operational engine of servicing.

### What It Is For

Automates operations that would be impossible to do manually: charge thousands of cards per day, send delinquency emails, sync taxes with TaxCloud, generate daily reports for partners.

### Technical Infrastructure

| Config | Default | Description |
|--------|---------|-----------|
| Thread count | 5 | Parallel threads per sweep |
| Thread size | 50 | Items per thread batch |
| Fetch size | 500 | Fetch limit per execution |
| Interrupt | false | Flag to stop a running sweep |
| Quartz Thread Pool | 25 | Total scheduler threads |
| Quartz Clustering | Enabled | Distributes sweeps across pods |

**Registration:** All 74 sweeps are registered in `BootstrapService.createScheduledTasks()` during startup.
**Dispatch:** `QuartzTask.java` routes each sweep to the correct service via switch/case.
**Persistence:** Quartz uses JDBC with PostgreSQL (`qrtz_*` tables).

### How to Trigger Any Sweep Manually

```
POST /uown/svc/triggerScheduledTask/{sweepName}
```

Or use the specific endpoints listed below for each sweep.

### How to Pause/Resume Any Sweep

```
POST /uown/svc/pauseScheduledTask/{sweepName}
POST /uown/svc/resumeScheduledTask/{sweepName}
```

### What to Check After Triggering

1. **Sweep logs:** `SELECT * FROM uown_sweep_logs WHERE sweep_name = '{name}' ORDER BY created_date DESC LIMIT 5;`
2. **Alerts created:** Check the alerts table for errors
3. **Records processed:** Check the tables affected by the sweep

---

### CATEGORY: CC PAYMENTS (Credit Card)

#### 34.1 SendCreditCardPaymentsSweep

**What it does:** Processes credit card payments scheduled for today. This is the main CC charging sweep.
**Cron:** `0 0 14 ? * MON-FRI` (2:00 PM Mon-Fri)
**Manual endpoint:** `POST /uown/svc/sendCCPaymentsSweep`
**What to check:** Table `uown_sv_cctransaction` for APPROVED/DENIED transactions of the day. Failure alerts.
**SQL:** Fetches accounts with receivables due today that have CC with active auto-pay.

#### 34.2 rerunCCPaymentsSweep

**What it does:** Retries CC charges that failed. First retry after a failure.
**Cron:** `0 0 17 ? * MON-FRI` (5:00 PM Mon-Fri)
**Manual endpoint:** `POST /uown/svc/rerunCCPaymentsSweep`
**What to check:** Transactions with numberOfTries > 1 and status APPROVED. NSF fee receivables created.

#### 34.3 CCDailyScheduledDeniedRerun

**What it does:** Retries CCs that were declined during the day, excluding permanent errors (expired card, stolen, closed account).
**Cron:** Daily
**Manual endpoint:** `POST /uown/svc/triggerScheduledTask/CCDailyScheduledDeniedRerun`
**What to check:** Transactions that changed from DENIED to APPROVED.

#### 34.4 delinquencyRerunCCPaymentsSweep

**What it does:** Retries CC specifically on **delinquent** accounts. Attempts to charge the past due amount.
**Cron:** Configurable
**Manual endpoint:** `POST /uown/svc/triggerScheduledTask/delinquencyRerunCCPaymentsSweep`
**What to check:** Delinquent accounts that had a payment approved. Reduction in daysPastDue.

#### 34.5 dailyDelinquencyRerunCCSweep

**What it does:** Daily rerun on delinquent accounts. Complements the previous sweep with daily frequency.
**Cron:** Daily
**Manual endpoint:** `POST /uown/svc/triggerScheduledTask/dailyDelinquencyRerunCCSweep`

#### 34.6 IdempotentCCSweep

**What it does:** Retries CC transactions that **timed out** (no response from the gateway). Guarantees idempotency -- does not charge twice.
**Cron:** Configurable
**Manual endpoint:** `POST /uown/svc/triggerScheduledTask/IdempotentCCSweep`
**What to check:** Transactions with status TIMEOUT that were resolved.

#### 34.7 CCVintageRun and SecondVintageRun (On-Demand)

**What it does:** Vintage analysis of CC transactions by cohort. NOT scheduled -- triggered manually.
**Endpoints:**
- `POST /uown/svc/executeCCVintageRun/{startDate}/{endDate}`
- `POST /uown/svc/executeSecondvintageRunAndReport/{startDate}/{endDate}`
- `POST /uown/svc/sendVintageRunReport/{sendToEmails}`
**What to check:** Vintage report generated by email.

---

### CATEGORY: ACH PAYMENTS (Bank Debit)

#### 34.8 CreateScheduledACHPaymentsSweep

**What it does:** Creates scheduled ACH payment records for accounts with active ACH auto-pay.
**Cron:** `0 0 8 ? * MON-FRI` (8:00 AM Mon-Fri)
**Manual endpoint:** `POST /uown/svc/createScheduledACHPaymentsSweep`
**What to check:** New records in `uown_sv_achpayment` with status SCHEDULED.

#### 34.9 SendACHPaymentsSweep

**What it does:** Sends created ACH payments to the Profituity processor.
**Cron:** `0 0 12 ? * MON-FRI` (12:00 PM Mon-Fri)
**Manual endpoint:** `POST /uown/svc/sendACHPaymentsSweep`
**What to check:** ACH with status SENT. Send errors in the alerts.

#### 34.10 getSendACHPaymentsStatusSweep

**What it does:** Queries the status of sent ACH payments (approved, denied, NSF).
**Cron:** `0 0 16 ? * MON-FRI` (4:00 PM Mon-Fri)
**Manual endpoint:** `POST /uown/svc/triggerScheduledTask/getSendACHPaymentsStatusSweep`
**What to check:** ACH with status APPROVED or DENIED. NSF fees created.

#### 34.11 getStatusDatePaymentsListSweep

**What it does:** Fetches the payments list by status date from the ACH processor.
**Cron:** Configurable
**Manual endpoint:** `POST /uown/svc/triggerScheduledTask/getStatusDatePaymentsListSweep`

#### 34.12 rerunACHPaymentsSweep

**What it does:** Retries ACH payments that failed. Runs on Thursdays.
**Cron:** `0 0 11 ? * THU` (11:00 AM Thursday)
**Manual endpoint:** `POST /uown/svc/rerunACHSweep`
**What to check:** ACH reruns with status APPROVED.

#### 34.13 reverseAchPaymentsSweep

**What it does:** Reverses ACH payments that failed or need to be returned.
**Cron:** `0 30 21 * * ?` (9:30 PM daily)
**Manual endpoint:** `POST /uown/svc/reverseAchPaymentsSweep`
**What to check:** ACH with status REVERSED. Allocations undone.

#### 34.14 processPayWalletPaymentsSweep

**What it does:** Processes payments received via PayWallet (payroll deduction). Reads an XLSX file from SFTP.
**Cron:** `0 0 0 * * ?` (Midnight daily)
**Manual endpoint:** `POST /uown/svc/triggerScheduledTask/processPayWalletPaymentsSweep`
**What to check:** New payments created from the file. File moved to the `/pw/` folder.

---

### CATEGORY: PAYMENTS - FEE CHARGING

#### 34.15 chargeSigningFeeSweep

**What it does:** Charges pending signing/documentation fees on accounts.
**Cron:** `0 0/2 * * * ?` (Every 2 minutes)
**Manual endpoint:** `POST /uown/svc/triggerScheduledTask/chargeSigningFeeSweep`
**What to check:** Signing fee transactions created and charged.

#### 34.16 CreateScheduledCreditCardPaymentsSweep

**What it does:** Creates scheduled CC payment records for accounts with active CC auto-pay.
**Cron:** `0 0 10 ? * MON-FRI` (10:00 AM Mon-Fri)
**Manual endpoint:** `POST /uown/svc/createScheduledCCPaymentsSweep`
**What to check:** New scheduled CC transaction records.

---

### CATEGORY: ACCOUNT STATUS

#### 34.17 paidOutAccountsSweep

**What it does:** Checks accounts eligible for PAID_OUT status (all installments paid). Updates automatically.
**Cron:** `0 0/1 * * ?` (Every hour)
**Manual endpoint:** `POST /uown/svc/triggerScheduledTask/paidOutAccountsSweep`
**What to check:** Accounts that changed to PAID_OUT. `SELECT * FROM uown_sv_account WHERE status = 'PAID_OUT' ORDER BY modified_date DESC;`


#### 34.18 checkLeadExpirationSweep

**What it does:** Expires leads that were not funded in time. Leads in NEW/UW_APPROVED with an expired date and SIGNED/CONTRACT_CREATED leads not funded within the deadline.
**Cron:** `0 0 22 * * ?` (10:00 PM daily)
**Manual endpoint:** `POST /uown/svc/checkLeadExpirationSweep`
**What to check:** Leads with status EXPIRED. `SELECT * FROM uown_los_lead WHERE status = 'EXPIRED' ORDER BY modified_date DESC;`

#### 34.19 updateContractStatusSweep

**What it does:** Updates contract statuses based on changes in account status.
**Cron:** Every 15 minutes (configurable via `BootstrapService.update.contract.status.sweep`)
**Manual endpoint:** `POST /uown/svc/triggerScheduledTask/updateContractStatusSweep`
**What to check:** Table `uown_sv_contract` for recent updates.

#### 34.20 removeRatingLetterSweep

**What it does:** Removes/archives rating letters after the statutory period.
**Cron:** `0 0 0 ? * FRI` (Midnight Friday)
**Manual endpoint:** `POST /uown/svc/triggerScheduledTask/removeRatingLetterSweep`
**What to check:** Accounts with rating removed/reset.

---

### CATEGORY: CORRESPONDENCE (Email/SMS)

#### 34.21 emailSweep

**What it does:** Processes the pending email queue and sends via SendGrid.
**Cron:** Frequent (minutes)
**Manual endpoint:** `POST /uown/svc/triggerScheduledTask/emailSweep`
**What to check:** Emails in `uown_email_queue` with status SENT.

#### 34.22 FirstPaymentReminderSweep

**What it does:** Sends first payment reminders for new accounts.
**Cron:** Daily
**Manual endpoint:** `POST /uown/svc/triggerScheduledTask/FirstPaymentReminderSweep`
**What to check:** "First Payment Reminder" emails in the queue.

#### 34.23 RecurringPaymentReminderSweep

**What it does:** Sends recurring payment reminders for active accounts.
**Cron:** Daily
**Manual endpoint:** `POST /uown/svc/triggerScheduledTask/RecurringPaymentReminderSweep`
**What to check:** Reminder emails in the queue.

#### 34.24 delinquencyOfferEmailSweep

**What it does:** Sends negotiation offers by email/SMS based on the delinquency bracket (30, 60, 90, 150+ days).
**Cron:** `0 0 12 ? * MON-FRI` (12:00 PM Mon-Fri)
**Manual endpoint:** `POST /uown/svc/triggerScheduledTask/delinquencyOfferEmailSweep`
**What to check:** Delinquency30/60/90/150DayOffer emails sent.

#### 34.25 delinquencyReminderEmailSweep

**What it does:** Sends generic "Past Due" reminders to delinquent accounts.
**Cron:** `0 0 13 ? * WED` (1:00 PM Wednesday)
**Manual endpoint:** `POST /uown/svc/triggerScheduledTask/delinquencyReminderEmailSweep`

#### 34.26 latePaymentNoticeEmailSweep

**What it does:** Sends monthly notices with the exact number of days past due.
**Cron:** `0 0 13 ? * 2L` (1:00 PM last Monday of the month)
**Manual endpoint:** `POST /uown/svc/triggerScheduledTask/latePaymentNoticeEmailSweep`

#### 34.27 UnutilizedApprovalSweep

**What it does:** Sends a notification to customers with unused approvals about to expire.
**Cron:** `0 0 21 * * ?` (9:00 PM daily)
**Manual endpoint:** `POST /uown/svc/sendUnutilizedApprovalsSweep`
**What to check:** "Unutilized Approval" emails sent.

#### 34.28 customerPortalReminderSweep

**What it does:** Sends invitations/reminders for customers to use the self-service portal.
**Cron:** `0 0 0 * * ?` (Midnight daily)
**Manual endpoint:** `POST /uown/svc/triggerScheduledTask/customerPortalReminderSweep`

#### 34.29 paidInFullAccountEmailSweep

**What it does:** Sends a "Paid in Full" email when an account is paid off.
**Cron:** `0 0 1 ? * MON-FRI` (1:00 AM Mon-Fri)
**Manual endpoint:** `POST /uown/svc/triggerScheduledTask/paidInFullAccountEmailSweep`
**What to check:** "Paid in Full" emails sent to recently paid-off accounts.

#### 34.30 settledInFullAccountEmailSweep

**What it does:** Sends a "Settled in Full" email when an account is settled by agreement.
**Cron:** `0 0 2 ? * MON-FRI` (2:00 AM Mon-Fri)
**Manual endpoint:** `POST /uown/svc/triggerScheduledTask/settledInFullAccountEmailSweep`
**What to check:** "Settled in Full" emails sent.

---

### CATEGORY: DOCUMENTS AND E-SIGN

#### 34.31 storedDocServiceSweep

**What it does:** Processes pending documents and stores them in the document management system (DMS).
**Cron:** `0 0/2 * * * ?` (Every 2 minutes)
**Manual endpoint:** `POST /uown/svc/storedDocServiceSweep`
**What to check:** Documents in `uown_email_queue` with status STORED.

#### 34.32 storedDocSmsServiceSweep

**What it does:** Sends SMS with document links to customers.
**Cron:** `0 0/2 * * * ?` (Every 2 minutes)
**Manual endpoint:** `POST /uown/svc/storedDocSmsServiceSweep`

#### 34.33 eSignDocumentStatusSweep

**What it does:** Checks the status of documents sent for electronic signature (SignWell/PandaDoc).
**Cron:** `0 0/3 * * * ?` (Every 3 minutes)
**Manual endpoint:** `POST /uown/svc/eSignDocumentStatusSweep`
**What to check:** Contracts with updated status (SENT, SIGNED, EXPIRED).

#### 34.34 getCompletedESignDocumentStatusSweep

**What it does:** Fetches completed/signed e-sign documents and updates the system.
**Cron:** `0 0/2 * * * ?` (Every 2 minutes)
**Manual endpoint:** `POST /uown/svc/getCompletedESignDocumentStatusSweep`
**What to check:** Leads with recent SIGNED status.

#### 34.35 sendLeaseDocsToBankSweep

**What it does:** Sends signed lease documents to the funding bank and/or Vervent.
**Cron:** `0 0 2 ? * MON-FRI` (2:00 AM Mon-Fri)
**Manual endpoint:** `POST /uown/svc/sendLeaseDocsToBankSweep?sendToBank={bool}&sendToVervent={bool}`
**What to check:** SFTP/email send logs for the bank.

---

### CATEGORY: TAXES

#### 34.36 dailyTaxCloudPaymentsSync

**What it does:** Sends the day's payment allocations to TaxCloud for tax compliance. Runs in 10 threads.
**Cron:** `0 15 22 ? * *` (10:15 PM daily)
**Manual endpoint:** `POST /uown/svc/triggerScheduledTask/dailyTaxCloudPaymentsSync`
**What to check:** TaxCloud logs for order submissions. Sync errors.

#### 34.37 dailyTaxCloudRefundsSync

**What it does:** Sends the day's refunds to TaxCloud for tax adjustment. Runs in 5 threads.
**Cron:** `0 0 23 ? * *` (11:00 PM daily)
**Manual endpoint:** `POST /uown/svc/triggerScheduledTask/dailyTaxCloudRefundsSync`
**What to check:** TaxCloud refund order submissions.

#### 34.38 updateTaxRatesSweep

**What it does:** Updates tax rates (monthly on the last day of the month).
**Cron:** `0 0 0 L * ? *` (Midnight on the last day of the month)
**Manual endpoint:** `POST /uown/svc/triggerScheduledTask/updateTaxRatesSweep`

#### 34.39 monthlyTaxReportSweep

**What it does:** Generates a monthly tax report for reconciliation.
**Cron:** `0 0 0 1 * ?` (Midnight on the 1st of each month)
**Manual endpoint:** `POST /uown/svc/triggerScheduledTask/monthlyTaxReportSweep`

---

### CATEGORY: PROTECTION PLAN

#### 34.40 cancelProtectionPlanSweep

**What it does:** Processes protection plan cancellations. Reads CSVs sent by Buddy Insurance via SFTP in the `buddy/cancellations` folder.
**Cron:** `0 0 8 ? * FRI` (8:00 AM Friday)
**Manual endpoint:** `POST /uown/svc/cancelProtectionPlanSweep` or `POST /uown/svc/cancelProtectionPlanSweep/{fileName}`
**What to check:** `uown_sv_protection_plan` and `uown_los_protection_plan` with status CANCELLED.

---

### CATEGORY: DELINQUENCY AND COLLECTIONS

#### 34.41 createSkitDelinquentFileSweep

**What it does:** Generates a file for Skit.ai (collections bot) with delinquent account data. Sent via SFTP.
**Cron:** `0 0 0 * * ?` (Midnight daily)
**Manual endpoint:** `POST /uown/svc/triggerScheduledTask/createSkitDelinquentFileSweep`
**What to check:** File generated on SFTP. Send logs.

#### 34.42 createSkitDelinquentOfferFileSweep

**What it does:** Generates a Skit.ai file with delinquent accounts eligible for settlement offers.
**Cron:** `0 0 0 * * ?` (Midnight daily)
**Manual endpoint:** `POST /uown/svc/triggerScheduledTask/createSkitDelinquentOfferFileSweep`

#### 34.43 redistributeDelinquentEpoPoolSweep

**What it does:** Redistributes the EPO pool reserve for delinquent accounts. Rebalances allocations.
**Cron:** `0 0 3 ? * SUN` (3:00 AM Sunday)
**Manual endpoint:** `POST /uown/svc/triggerScheduledTask/redistributeDelinquentEpoPoolSweep`

#### 34.44 pastDueEpoPoolAmountReportSweep

**What it does:** Generates a report of EPO pool amounts for past due accounts.
**Cron:** `0 0 2 ? * SUN` (2:00 AM Sunday)
**Manual endpoint:** `POST /uown/svc/triggerScheduledTask/pastDueEpoPoolAmountReportSweep`

#### 34.45 progetDeviceLockingSweep

**What it does:** Locks devices (IoT/GPS) of delinquent accounts via the Proget system.
**Cron:** `0 0 0 ? * * *` (Midnight daily)
**Manual endpoint:** `POST /uown/svc/triggerScheduledTask/progetDeviceLockingSweep`
**What to check:** Lock status in Proget.

---

### CATEGORY: FINANCIAL REPORTS

#### 34.46 dailyFundingReportSweep / dailyFundingReportSharepointSweep

**What it does:** Generates a daily funding report and optionally sends it to SharePoint.
**Cron:** `0 0 1 * * ?` (1:00 AM) / `0 0 3 * * ?` (3:00 AM for SharePoint)
**Manual endpoint:** `POST /uown/svc/triggerScheduledTask/dailyFundingReportSweep` (or `dailyFundingReportSharepointSweep` for the SharePoint variant)
**What to check:** Report in email/SharePoint.

#### 34.47 dailyFundedReportSweep

**What it does:** Report of accounts funded during the day.
**Cron:** `0 0 3 * * ?` (3:00 AM)
**Manual endpoint:** `POST /uown/svc/triggerScheduledTask/dailyFundedReportSweep`

#### 34.48 dailyRefundReportSweep / dailyRefundedReportSweep

**What it does:** Report of refunds processed during the day.
**Cron:** `0 0 3 * * ?` (3:00 AM)
**Manual endpoint:** `POST /uown/svc/triggerScheduledTask/dailyRefundReportSweep` (or `dailyRefundedReportSweep` for the variant)

#### 34.49 dailyAgentTransactionReportSweep

**What it does:** Report of transactions made by agents during the day.
**Cron:** `0 30 3 * * ?` (3:30 AM)
**Manual endpoint:** `POST /uown/svc/sendDailyAgentTransactionReportSweep`

#### 34.50 weeklyFundingReportSweep

**What it does:** Weekly consolidated funding report.
**Cron:** `0 0 1 ? * SUN` (1:00 AM Sunday)
**Manual endpoint:** `POST /uown/svc/triggerScheduledTask/weeklyFundingReportSweep`

#### 34.51 monthlyFundingReportSweep / monthlyConsolidatedFundingReportSweep

**What it does:** Monthly funding report and multi-entity consolidated version.
**Cron:** `0 0 1 1 * ?` (1:00 AM on the 1st) / `0 0 4 1 * ?` (4:00 AM on the 1st)
**Manual endpoint:** `POST /uown/svc/triggerScheduledTask/monthlyFundingReportSweep` (or `monthlyConsolidatedFundingReportSweep` for the consolidated version)

#### 34.52 sendDailyPaymentsSharepointSweep

**What it does:** Sends a daily payments summary to SharePoint.
**Cron:** `0 16 7 ? * * *` (7:16 AM)
**Manual endpoint:** `POST /uown/svc/triggerScheduledTask/sendDailyPaymentsSharepointSweep`

#### 34.53 sendDailyBorrowingBaseReport

**What it does:** Sends a daily borrowing base report to financial partners.
**Cron:** `0 37 7 ? * * *` (7:37 AM)
**Manual endpoint:** `POST /uown/svc/sendDailyBorrowingBaseReport`

#### 34.54 activeLeaseDailyReport

**What it does:** Daily report of active leases for portfolio tracking.
**Cron:** `0 2 7 ? * * *` (7:02 AM)
**Manual endpoint:** `POST /uown/svc/triggerScheduledTask/activeLeaseDailyReport`

#### 34.55 rerunACHWeeklyReport

**What it does:** Weekly report of failed ACH retries.
**Cron:** `0 15 7 ? * MON` (7:15 AM Monday)
**Manual endpoint:** `POST /uown/svc/triggerScheduledTask/rerunACHWeeklyReport`

#### 34.56 generateDelinquencyReport

**What it does:** Generates a complete delinquency report.
**Cron:** `0 0 8 * * ?` (8:00 AM daily)
**Manual endpoint:** `POST /uown/svc/triggerScheduledTask/generateDelinquencyReport`

#### 34.57 generateDueDateMovesReport

**What it does:** Audit report of due date moves.
**Cron:** `0 0 3 * * ?` (3:00 AM)
**Manual endpoint:** `POST /uown/svc/triggerScheduledTask/generateDueDateMovesReport`

#### 34.58 generateExportBlacklistReport

**What it does:** Exports blacklist entries for compliance.
**Cron:** `0 0 0 1 * ?` (Midnight on the 1st of the month)
**Manual endpoint:** `POST /uown/svc/triggerScheduledTask/generateExportBlacklistReport`

#### 34.59 generateMerchantLeaseReport

**What it does:** Report of leases by merchant for reconciliation.
**Cron:** `0 0 8 * * ?` (8:00 AM daily)
**Manual endpoint:** `POST /uown/svc/triggerScheduledTask/generateMerchantLeaseReport`

---

### CATEGORY: REPORTS FOR SPECIFIC PARTNERS

#### 34.60 sendDailyReportsToBBWheelsSweep

**What it does:** Sends daily reports to BB Wheels (specific partner).
**Cron:** `0 0 4 * * ?` (4:00 AM)
**Manual endpoint:** `POST /uown/svc/sendDailyReportsToBBWheelsSweep`

#### 34.61 danielJewelersLeadReportSweep

**What it does:** Generates a leads report for Daniel Jewelers (specific merchant).
**Cron:** `0 30 0 * * ?` (12:30 AM)
**Manual endpoint:** `POST /uown/svc/triggerScheduledTask/danielJewelersLeadReportSweep`

#### 34.62 saleFileGenerationSweep

**What it does:** Generates sales/transaction files for vendors/partners.
**Cron:** `0 0 4 * * ?` (4:00 AM)
**Manual endpoint:** `POST /uown/svc/triggerScheduledTask/saleFileGenerationSweep`

---

### CATEGORY: EXTERNAL INTEGRATIONS

#### 34.63 generateVerventOnBoardingFileSweep

**What it does:** Generates an onboarding file for Vervent (lease documents partner).
**Cron:** `0 0 2 ? * *` (2:00 AM)
**Manual endpoint:** `POST /uown/svc/triggerScheduledTask/generateVerventOnBoardingFileSweep`

#### 34.64 kornerstoneDailyImportSweep

**What it does:** Imports daily data from the legacy Kornerstone system (migration). Calls `MigrationService.importBasicDataForContracts()`.
**Cron:** `0 0 22 ? * *` (10:00 PM)
**Manual endpoint:** `POST /uown/svc/triggerScheduledTask/kornerstoneDailyImportSweep`
**What to check:** New accounts imported into `uown_sv_account`.

#### 34.65 refreshTrustPilotAccessKeySweep

**What it does:** Renews TrustPilot API credentials.
**Cron:** `0 0 0 * * ?` (Midnight)
**Manual endpoint:** `POST /uown/svc/triggerScheduledTask/refreshTrustPilotAccessKeySweep`

---

### CATEGORY: MONITORING AND MAINTENANCE

#### 34.66 monitorSweep

**What it does:** System health check. Records monitoring metrics.
**Cron:** `0 0 23 * * ?` (11:00 PM)
**Manual endpoint:** `POST /uown/svc/triggerScheduledTask/monitorSweep`

#### 34.67 paymentGatewayFixSweep

**What it does:** Fixes synchronization issues with payment gateways.
**Cron:** `0 0 21 * * ?` (9:00 PM)
**Manual endpoint:** `POST /uown/svc/triggerScheduledTask/paymentGatewayFixSweep`

#### 34.68 checkSignedAndFundingLeaseCountSweep

**What it does:** Monitors the count of signed and in-funding leases (compliance/audit).
**Cron:** `0 0/15 9-21 ? * * *` (Every 15 min from 9 AM to 9 PM)
**Manual endpoint:** `POST /uown/svc/checkSignedAndFundingLeaseCountSweep`

#### 34.69 bankVerificationSweep

**What it does:** Verifies the validity and accuracy of bank accounts.
**Cron:** `0 0/5 * * * ?` (Every 5 minutes)
**Manual endpoint:** `POST /uown/svc/triggerScheduledTask/bankVerificationSweep`

---

## 38. Data Cleanup

### What It Is

Automated **data retention and purge** service for regulatory compliance and system performance.

### What It Is For

Old data (API logs, processed emails, signed documents) accumulates and degrades performance. Cleanup ensures a minimum retention of 3 months and removes older data.

### Data Removed

| Target | Description | Minimum Retention |
|------|-----------|-----------------|
| API Logs (LOS/SVC/3rd party) | Inbound/outbound API calls | 3 months |
| Correspondence Logs | Email/SMS history | 3 months |
| Sweep Logs | ACH/CC processing logs | 3 months |
| Merchant Error Logs | Integration errors | 3 months |
| Login Attempts | Authentication audit | 3 months |
| Esign Events | Contract signing events | 3 months |
| Esign Documents | Signed contracts | 3 months |
| Email Queue | Processed emails | 3 months |
| Import Records | Import records | 3 months |

### How to Trigger

```
DELETE /uown/cleanupLogEntries?to=2025-11-19        (API logs)
DELETE /uown/cleanupFunctionalEntities?to=2025-11-19 (Operational data)
```

**PROTECTION:** The `to` date must be at least 3 months in the past. The system rejects attempts to delete recent data.

### What to Check

- Console logs confirming the number of records deleted
- Improved query performance after cleanup

---

## 46. API Authentication

### What It Is

API key system for authenticating external services.

### How It Works

1. **Generation:** Creates a 128-character hex key + expiration (24 hours)
2. **Storage:** Bound to an ApiUser account
3. **Validation:** `isValid(key)` checks existence, expiration, and user status
4. **Usage:** Passed in the request header

### Authentication by Service

| Service | Auth Method |
|---------|---------------|
| Five9 | Header `Username: Five9` |
| Webhooks | Bearer token or OAuth endpoint |
| Config Management | Standard Spring Security |
| TMS | API key or agent credentials |

---

## 49. Permissions Model (Servicing Portal)

### What It Is

The Servicing portal implements a granular permissions model that controls which actions each agent can perform. Permissions are checked by feature + action.

### Restricted View Permissions

| Permission | What It Controls |
|-----------|----------------|
| `restricted.view.full.dob` | Display of the full date of birth |
| `restricted.view.full.ssn` | Display of the full SSN |
| `restricted.view.partial.account_number` | Masked display of the bank account number |
| `restricted.view.servicing_redirect` | Redirect to the Servicing portal from Origination |

### Modification Permissions by Feature

| Feature | Modification Permissions |
|---------|--------------------------|
| **account_sale** | `get_documents_for_sold_accounts_with_file` |
| **ach_history** | `disable_ach_payment` |
| **documents** | `edit_document`, `resend_stored_doc`, `upload_file_for_account`, `delete_file` |
| **payment** | `create_or_update_ach_payment`, `make_credit_card_payment` |
| **payment_transaction** | `reverse_payment`, `refund_payments`, `email_csv`, `download_csv` |
| **scheduled_payments** | `create_or_update_receivable` |
| **customer_information** | `create_or_update_primary_customer_info`, `create_or_update_employment`, `create_or_update_primary_customer_contact_info`, `create_or_update_servicing_information`, `create_or_update_bank_account`, `create_or_update_credit_card` |

### Origination Portal Permissions

| Feature | Permissions |
|---------|------------|
| **customers** | `move_to_servicing`, `resend_lease`, `modify_lease`, `settle_application`, `change_lead_status`, `override_approval_amount`, `run_underwriting` |
| **documents** | `upload_file_for_lead`, `delete_file`, `get_document_status` |
| **funding** | `update_funding_status` |
| **newApplication** | `send_application_to_customer` |
| **calculator** | `get_calculator_results` |
| **alerts** | (general modify) |
| **admin** | (administrative operations) |

### Special Permissions (Restricted Modify)

Additional permissions required for critical actions:

| Permission | Action Controlled |
|-----------|-----------------|
| `lead_status_to_expired` | Change the lead status to EXPIRED |
| `lead_status_denied_to_approved` | Revert status DENIED to UW_APPROVED |
| `lead_status_approved_to_signed` | Move a lead from approved to SIGNED without e-sign |

### Special View Permissions

| Permission | What It Displays |
|-----------|-------------|
| `customers.view.internal_status` | The lead's `internalStatus` field |
| `documents.view.internal_notes` | Internal notes on documents |

### Login Tracking (Security)

The `uown_login_attempt` table records all authentication attempts with:
- `username` — user who attempted login
- `success` — whether the login succeeded
- `created_date` — timestamp of the attempt
- `ip_address` — origin IP

The index `idx_uown_login_attempt` (V20260306062454) optimizes rate-limiting queries and security auditing.

---

## 50. Administrative Panel

### Main Capabilities

| Area | What the Admin Can Do | How to Access |
|------|-------------------------|-------------|
| **Merchants** | Create, update, clone, bulk update, manage bank accounts | `/uown/createMerchant`, `/uown/updateMerchant` |
| **Programs** | Create, update, clone, import Excel, associate with merchants | `/uown/createProgram`, `/uown/updateProgram` |
| **State Config** | Configure rules by state (taxes, regulatory limits) | `/uown/updateStateConfig` |
| **Templates** | Manage correspondence templates (email, contract) | `/uown/loadTemplates` |
| **Blacklist** | Add, remove, search entries | `/uown/addToBlacklist`, `/uown/removeFromBlacklist` |
| **SQL Config** | Manage SQL queries used by sweeps and reports | `/uown/svc/updateScheduleTaskSqlByName/{name}` |
| **Taxes** | Look up tax rate by ZIP code | `/uown/getTaxForZip/{zipCode}` |
| **System** | Clear logs, clear cache, manage maps | `/uown/cleanupLogEntries`, `/ConfigurationManagement/forceReloadConfig` |
| **Leads** | Check eligibility for re-approval | `/uown/los/checkReapprovalEligibility` |
| **Configurations** | Change configs in real time | `/ConfigurationManagement/createOrUpdateConfig` |
| **Sweeps** | Trigger, pause, resume, reschedule sweeps | `/uown/svc/triggerScheduledTask/{name}` |
| **Approved Amounts** | Load approval limits by segment | `/uown/loadApprovedAmountsFromExcel` |

---

## 51. AMS Portal — Associating Merchants to Users (Task #74, R1.51.0)

### What It Is

The AMS portal (Account Management System) has a dedicated page to associate merchants with internal users in bulk: `/associate-users-to-merchants`. This functionality allows administrators to assign which merchants an AMS user can access.

### Endpoints Involved

| Endpoint | Method | Description |
|----------|--------|-----------|
| `POST /user/addMerchantsToUsers` | POST | Associates merchants with users in bulk (bulk assign) |
| `PUT /user/{username}` | PUT | Updates user data (triggers Log Activity) |
| `GET /user/{username}` | GET | Queries user details |

### Business Rule: Log Activity

- `POST /user/addMerchantsToUsers` does **NOT** generate an entry in the user's Log Activity.
- The "Edit User Merchants" UI (accordion card in `/users/[username]`) **also does NOT** generate an entry in the Log Activity.
- Only `PUT /user/{username}` (updateUser) generates an entry with type `"UPDATED user info: {...}"` in the Log Activity.
- The Log Activity is displayed on the `/users/[username]` page as a `react-data-table-component` table with 4 columns: `date`, `type`, `userId`, `notes`.

### Business Rule: Edit User Merchants (UI)

The "Edit User Merchants" card on the `/users/[username]` page allows editing a user's merchant list directly:

- The operation is an **OVERWRITE** — it replaces the user's entire merchant list. It is not additive.
- Flow: expand the card (chevron in the header) → click the pencil icon (`span#EditUserMerchants-edit`) → select merchants in the React Select `#merchants` → click SAVE.
- When entering edit mode, `span#EditUserMerchants-edit` is removed from the DOM; the SAVE button must be located via `.card:has(#merchants)`.
- The React Select options are rendered in a portal — navigate via ArrowDown+Enter.
- This action does **NOT** generate an entry in the Log Activity (confirmed via CT-E2E-07, task #74).

### Bulk Association Flow (UI — `/associate-users-to-merchants`)

1. User navigates to `/associate-users-to-merchants`
2. Selects users in the left-hand table (paginated)
3. Selects merchants in the right-hand table (paginated)
4. Clicks "Submit" — opens a Bootstrap confirmation modal
5. Clicks "Confirm" in the modal
6. Success toast displayed (`.Toastify__toast--success`)

The operation via `POST /user/addMerchantsToUsers` is **additive** — it never removes existing associations.

### Technical Notes

- Both tables on `/associate-users-to-merchants` use `react-data-table-component` (`.rdt_Table`). The pagination container (`.rdt_Pagination`) is a sibling of `.rdt_Table`, not a child — scoping by `nth(0)` / `nth(1)` is mandatory to avoid mixing tables.
- The merchants table loads asynchronously after the users table — wait for the first row of both tables before interacting.

---

---
title: "Appendix F: Operational SQL Queries Reference"
domain: business-rules
status: stable
volatility: volatile
last_verified: 2026-06-18
sources:
  - db: uown_los_lead
  - db: uown_sv_account
  - db: uown_scheduled_task
  - env: qa2
covers: [sql, queries, troubleshooting, los, svc, sweeps, fraude, ams]
---

# Appendix F: Operational SQL Queries Reference
## UOwn Leasing - SVC Platform

Frequent SQL queries for investigation, troubleshooting, and system operation. Organized by business domain.

---

## Index

1. [LOS - Leads and Applications](#1-los---leads-and-applications)
2. [LOS - Customer Data](#2-los---customer-data)
3. [LOS - Contracts and Invoices](#3-los---contracts-and-invoices)
4. [LOS - Underwriting and Fraud](#4-los---underwriting-and-fraud)
5. [SVC - Servicing Accounts](#5-svc---servicing-accounts)
6. [SVC - Customer Data](#6-svc---customer-data)
7. [SVC - Receivables and Schedule](#7-svc---receivables-and-schedule)
7b. [SVC - Payment Arrangements](#7b-svc---payment-arrangements-task-446)
8. [SVC - CC Payments](#8-svc---cc-payments)
9. [SVC - ACH Payments](#9-svc---ach-payments)
10. [SVC - General Payments](#10-svc---general-payments)
11. [Merchants and Programs](#11-merchants-and-programs)
12. [Correspondence (Email/SMS)](#12-correspondence-emailsms)
13. [Sweeps and Scheduled Tasks](#13-sweeps-and-scheduled-tasks)
14. [Sweep SQL (Selection Criteria)](#14-sweep-sql-selection-criteria)
15. [Delinquency and Collections](#15-delinquency-and-collections)
16. [Logs and Auditing](#16-logs-and-auditing)
17. [Fraud Checks](#17-fraud-checks)
18. [Configurations and Templates](#18-configurations-and-templates)
19. [AMS - Users and Permissions](#19-ams---users-and-permissions)

---

## 1. LOS - Leads and Applications

### Look up lead by PK
```sql
SELECT
    ull.lead_status,
    ull.internal_status,
    ull.pk AS LeadPK,
    ull.account_pk,
    ull.company,
    ull.expiration_date,
    ull.uuid,
    ull.*
FROM uown_los_lead ull
WHERE ull.pk IN (:leadPk)
ORDER BY ull.pk DESC;
```

### Look up lead by short code (new table: uown_los_lead_short_code)
```sql
-- After migration V20260226100000: short_code migrated from uown_los_lead to uown_los_lead_short_code
SELECT ulsc.short_code, ulsc.lead_pk, ulsc.pk
FROM uown_los_lead_short_code ulsc
WHERE ulsc.lead_pk IN (:leadPk)
ORDER BY ulsc.pk DESC;
```

### Look up lead by short code (reverse lookup)
```sql
SELECT ull.*, ulsc.short_code
FROM uown_los_lead ull
JOIN uown_los_lead_short_code ulsc ON ulsc.lead_pk = ull.pk
WHERE ulsc.short_code IN (:shortCode)
ORDER BY ull.pk DESC;
```

### Look up lead by period
```sql
SELECT
    ull.lead_status,
    ull.internal_status,
    ull.pk AS LeadPK,
    ull.account_pk,
    ull.*
FROM uown_los_lead ull
WHERE ull.row_created_timestamp BETWEEN :startDate AND :endDate
ORDER BY ull.pk DESC;
```

### Look up the lead's payment options
```sql
SELECT
    ull.lead_pk,
    ull.short_code,
    ull.processing_fee,
    ull.*
FROM uown_los_payment_options ull
WHERE ull.lead_pk IN (:leadPk)
ORDER BY ull.pk DESC;
```

### Look up the lead's notes
```sql
SELECT * FROM uown_los_lead_notes ulln WHERE ulln.lead_pk IN (:leadPk);
```

---

## 2. LOS - Customer Data

### Complete customer data query (all data of a lead)
```sql
-- Customer
SELECT * FROM uown_los_customer WHERE lead_pk IN (:leadPk) ORDER BY pk DESC;

-- Addresses
SELECT * FROM uown_los_address WHERE lead_pk IN (:leadPk) ORDER BY pk DESC;

-- Emails
SELECT * FROM uown_los_email WHERE lead_pk IN (:leadPk);

-- Phones
SELECT lead_pk, pk, do_not_call, reason_for_dnc, do_not_text, reason_for_dnt, *
FROM uown_los_phone WHERE lead_pk IN (:leadPk);

-- Employment
SELECT * FROM uown_los_employment WHERE lead_pk IN (:leadPk) ORDER BY pk DESC;

-- Bank accounts
SELECT * FROM uown_los_bank_account WHERE lead_pk IN (:leadPk) ORDER BY pk DESC;

-- Credit cards
SELECT * FROM uown_los_credit_card WHERE lead_pk IN (:leadPk) ORDER BY pk DESC;
```

### Duplicate emails (top 5 most used)
```sql
SELECT ule.email_address, COUNT(*) AS total_records
FROM uown_los_email ule
GROUP BY ule.email_address
ORDER BY total_records DESC
LIMIT 5;
```

---

## 3. LOS - Contracts and Invoices

### Look up a lead's contracts
```sql
SELECT
    ulc.lead_pk,
    ulc.contract_number,
    ulc.contract_status,
    ulc.contract_type,
    ulc.esign_document_pk,
    ulc.url,
    ulc.expiry_date,
    ulc.*
FROM uown_los_contract ulc
WHERE ulc.lead_pk IN (:leadPk);
```

### Contract history
```sql
SELECT
    ulch.lead_pk,
    ulch.contract_number,
    ulch.contract_status,
    ulch.signed_time,
    ulch.rev,
    ulch.*
FROM uown_los_contract_history ulch
WHERE ulch.lead_pk IN (:leadPk);
```

### Invoice and items of a lead
```sql
SELECT * FROM uown_los_invoice WHERE lead_pk IN (:leadPk);

SELECT
    uli.lead_pk AS LeadPk,
    uli.invoice_pk,
    uli.item_code,
    uli.item_description,
    uli.status,
    uli.invoice_type,
    uli.*
FROM uown_los_item uli
WHERE uli.lead_pk IN (:leadPk);
```

### Invoice history
```sql
SELECT ulih.lead_pk, ulih.* FROM uown_los_invoice_history ulih WHERE ulih.lead_pk IN (:leadPk);
```

### Lead schedule summary
```sql
SELECT * FROM uown_los_sched_summary WHERE lead_pk IN (:leadPk) ORDER BY pk DESC;
```

### Lead receivables (LOS)
```sql
SELECT * FROM uown_los_receivable WHERE lead_pk IN (:leadPk) ORDER BY pk DESC;
```

---

## 4. LOS - Underwriting and Fraud

### Underwriting data
```sql
SELECT
    uld.approval_amount,
    uld.decided_by_agent,
    uld.uw_status,
    uld.decision_made_at,
    uld.charge_processing_fee,
    uld.internal_decision,
    uld.eligible_terms,
    uld.lambda_segment,
    uld.*
FROM uown_los_uwdata uld
WHERE uld.lead_pk IN (:leadPk)
ORDER BY pk DESC;
```

> **Note:** The `lambda_segment` column is populated by the GDS underwriting process. For leads approved via GDS, this field contains the assigned lambda segment. It may be NULL for leads processed by other engines (Taktile, ABB).

### UW filtered by engine (GDS, Taktile, ABB)
```sql
SELECT *
FROM uown_los_uwdata
WHERE decided_by_agent = 'GDS'  -- or 'TAKTILE', 'ABB'
ORDER BY pk DESC;
```

### Lead alerts
```sql
SELECT
    ula.lead_pk,
    ula.account_pk,
    ula.is_active,
    ula.alert_message,
    ula.*
FROM uown_los_alert ula
WHERE ula.lead_pk IN (:leadPk);
```

---

## 5. SVC - Servicing Accounts

### Look up account by PK
```sql
SELECT
    usa.account_status,
    usa.pk AS Account_PK,
    usa.lead_pk,
    usa.company,
    usa.merchant_pk,
    usa.rating,
    usa.settled_in_full_date_time,
    usa.pay_off_date_time,
    usa.*
FROM uown_sv_account usa
WHERE usa.pk IN (:accountPk)
ORDER BY usa.pk DESC;
```

### Find the account by the merchant associated with the lead
```sql
SELECT m.*
FROM uown_merchant m
JOIN uown_los_lead l ON l.merchant_pk = m.pk
WHERE l.pk = :leadPk;
```

### Account notes
```sql
SELECT usan.account_pk, usan.*
FROM uown_sv_account_notes usan
WHERE usan.account_pk IN (:accountPk);
```

### Account alerts
```sql
SELECT
    usa.lead_pk,
    usa.account_pk,
    usa.is_active,
    usa.alert_message,
    usa.*
FROM uown_sv_alert usa
WHERE usa.account_pk IN (:accountPk);
```

---

## 6. SVC - Customer Data

### Complete customer data on the account
```sql
-- Customer
SELECT account_pk, first_name, middle_name, last_name, *
FROM uown_sv_customer WHERE account_pk IN (:accountPk);

-- Addresses
SELECT * FROM uown_sv_address WHERE account_pk IN (:accountPk);

-- Emails
SELECT account_pk, pk, do_not_email, reason_for_dnc, *
FROM uown_sv_email WHERE account_pk IN (:accountPk);

-- Phones
SELECT account_pk, phone_number, pk, do_not_call, do_not_text, *
FROM uown_sv_phone WHERE account_pk IN (:accountPk);

-- Bank accounts
SELECT * FROM uown_sv_bank_account WHERE account_pk IN (:accountPk);
```

### Account credit cards
```sql
SELECT
    uscc.lead_pk,
    uscc.account_pk,
    uscc.pre_auth_status,
    uscc.cc_token,
    uscc.cc_vendor,
    uscc.is_valid_card,
    uscc.auto_pay,
    uscc.is_deleted,
    uscc.*
FROM uown_sv_credit_card uscc
WHERE uscc.account_pk IN (:accountPk)
ORDER BY uscc.pk DESC;
```

---

## 7. SVC - Receivables and Schedule

### Receivables of an account (complete schedule)
```sql
SELECT
    usr.account_pk,
    usr.due_date,
    usr.receivable_type,
    usr.status,
    usr.allocation_status,
    usr.total_amount,
    usr.*
FROM uown_sv_receivable usr
WHERE usr.account_pk IN (:accountPk)
ORDER BY usr.due_date ASC;
```

### Receivables with outstanding balance
```sql
SELECT
    r.account_pk,
    r.pk AS receivable_pk,
    r.receivable_type,
    r.due_date,
    r.status,
    r.allocation_status,
    r.base_amount,
    r.tax_amount,
    r.total_amount,
    COALESCE(r.partial_payment_amount, 0) AS amount_paid_so_far,
    (r.total_amount - COALESCE(r.partial_payment_amount, 0)) AS outstanding
FROM uown_sv_receivable r
WHERE r.account_pk = :accountPk
ORDER BY r.due_date, r.pk;
```

### Receivables by type (e.g., NSF_FEE)
```sql
SELECT *
FROM uown_sv_receivable usr
WHERE usr.receivable_type = 'NSF_FEE'  -- or 'REGULAR_PAYMENT', 'EARLY_PAY_OFF', 'PROCESSING_FEE'
ORDER BY usr.pk DESC;
```

### Account schedule summary
```sql
SELECT
    uss.account_pk,
    uss.delinquency_as_of_date,
    uss.first_payment_due_date,
    uss.total_contract_amount_with_tax_and_fees,
    uss.total_number_of_payments,
    uss.*
FROM uown_sv_sched_summary uss
WHERE uss.account_pk IN (:accountPk);
```

---

## 7b. SVC - Payment Arrangements (Task #446)

### Look up payment arrangement by account
```sql
SELECT
    uspa.pk,
    uspa.account_pk,
    uspa.start_date,
    uspa.end_date,
    uspa.frequency,
    uspa.amount,
    uspa.arrangement_type,
    uspa.payment_type,
    uspa.username,
    uspa.previous_rating,
    uspa.current_rating,
    uspa.is_active,
    uspa.payment_arrangement_status,
    uspa.notes,
    uspa.*
FROM uown_sv_payment_arrangement uspa
WHERE uspa.account_pk IN (:accountPk)
ORDER BY uspa.pk DESC;
```

### Look up CC transactions linked to an arrangement
```sql
SELECT
    uscct.pk,
    uscct.account_pk,
    uscct.original_amount,
    uscct.posting_date,
    uscct.status,
    uscct.payment_arrangement_pk,
    uscct.*
FROM uown_sv_credit_card_transaction uscct
WHERE uscct.payment_arrangement_pk = :paymentArrangementPk
ORDER BY uscct.posting_date ASC;
```

### Look up ACH payments linked to an arrangement
```sql
SELECT
    usp.pk,
    usp.account_pk,
    usp.amount,
    usp.status,
    usp.payment_arrangement_pk,
    usp.*
FROM uown_sv_achpayment usp
WHERE usp.payment_arrangement_pk = :paymentArrangementPk
ORDER BY usp.pk ASC;
```

### Check the arrangement status with a transaction summary
```sql
SELECT
    uspa.pk AS arrangement_pk,
    uspa.arrangement_type,
    uspa.payment_arrangement_status,
    uspa.is_active,
    uspa.payment_type,
    CASE uspa.payment_type
        WHEN 'CC' THEN (SELECT COUNT(*) FROM uown_sv_credit_card_transaction t WHERE t.payment_arrangement_pk = uspa.pk)
        WHEN 'ACH' THEN (SELECT COUNT(*) FROM uown_sv_achpayment a WHERE a.payment_arrangement_pk = uspa.pk)
    END AS total_transactions,
    CASE uspa.payment_type
        WHEN 'CC' THEN (SELECT COUNT(*) FROM uown_sv_credit_card_transaction t WHERE t.payment_arrangement_pk = uspa.pk AND t.status = 'PENDING')
        WHEN 'ACH' THEN (SELECT COUNT(*) FROM uown_sv_achpayment a WHERE a.payment_arrangement_pk = uspa.pk AND a.status = 'PENDING')
    END AS pending_transactions
FROM uown_sv_payment_arrangement uspa
WHERE uspa.account_pk IN (:accountPk)
ORDER BY uspa.pk DESC;
```

---

## 8. SVC - CC Payments

### CC transactions of an account
```sql
SELECT
    uscct.pk,
    uscct.lead_pk,
    uscct.account_pk,
    uscct.original_amount,
    uscct.posting_date,
    uscct.status,
    uscct.cc_transaction_type,
    uscct.charge_fee,
    uscct.charged_fee_amount,
    uscct.gateway_response,
    uscct.payment_arrangement_pk,
    uscct.*
FROM uown_sv_credit_card_transaction uscct
WHERE uscct.account_pk IN (:accountPk)
ORDER BY uscct.pk DESC;
```

### Denied CC transactions (for rerun troubleshooting)
```sql
SELECT *
FROM uown_sv_credit_card_transaction uscct
WHERE uscct.status = 'DENIED'
ORDER BY uscct.pk DESC;
```

---

## 9. SVC - ACH Payments

### ACH payments of an account
```sql
SELECT
    usp.account_pk,
    usp.ach_process_type,
    usp.amount,
    usp.status,
    usp.payment_pk,
    usp.vendor_achstatus,
    usp.return_code_description,
    usp.payment_arrangement_pk,
    usp.*
FROM uown_sv_achpayment usp
WHERE usp.account_pk IN (:accountPk)
ORDER BY usp.pk DESC;
```

---

## 10. SVC - General Payments

### Payments of an account
```sql
SELECT *
FROM uown_sv_payment usp
WHERE usp.account_pk IN (:accountPk)
ORDER BY usp.pk DESC;
```

---

## 11. Merchants and Programs

### Look up merchant by code or name
```sql
SELECT
    um.ref_merchant_code,
    um.legal_name,
    um.merchant_name,
    um.client_type,
    um.is_active,
    um.is_deleted,
    um.*
FROM uown_merchant um
WHERE um.ref_merchant_code IN (:refMerchantCode)
-- WHERE um.legal_name LIKE '%Kornerstone%'
-- WHERE um.client_type LIKE '%TIRE_AGENT%'
ORDER BY um.location_name DESC;
```

### Merchant boolean flags (quick check)
```sql
SELECT
    m.ref_merchant_code,
    m.is_item_split,
    m.check_uw_for_verification,
    m.charge_processing_fee,
    m.charge_processing_fee_before_esign,
    m.hold_deposit,
    m.is_cc_required,
    m.is_ach_required,
    m.is_fpd_required,
    m.is_signed_to_funding,
    m.is_fraud_check_required,
    m.use_webhook,
    m.is_bank_verification_required,
    m.is_plaid_verification_required,
    m.auto_deny_application,
    m.use_sentilink,
    m.use_neustar,
    m.use_neuro_id_check,
    m.use_lexis_nexis,
    m.offer_insurance,
    m.esign_client,
    m.verify_phone,
    m.verify_email,
    m.verify_ip
FROM uown_merchant m
WHERE m.ref_merchant_code = :refMerchantCode;
```

### Count of null flags on the merchant (data audit)
```sql
SELECT
    COUNT(CASE WHEN m.is_item_split IS NULL THEN 1 END) AS is_item_split_null,
    COUNT(CASE WHEN m.charge_processing_fee IS NULL THEN 1 END) AS charge_processing_fee_null,
    COUNT(CASE WHEN m.hold_deposit IS NULL THEN 1 END) AS hold_deposit_null,
    COUNT(CASE WHEN m.auto_deny_application IS NULL THEN 1 END) AS auto_deny_null,
    COUNT(CASE WHEN m.use_sentilink IS NULL THEN 1 END) AS use_sentilink_null,
    COUNT(CASE WHEN m.offer_insurance IS NULL THEN 1 END) AS offer_insurance_null
FROM uown_merchant m;
```

### List distinct client types
```sql
SELECT DISTINCT um.client_type
FROM uown_merchant um
ORDER BY um.client_type;
```

### Programs of a merchant
```sql
SELECT umtp.*, m.ref_merchant_code, m.*
FROM uown_merchant m
LEFT JOIN uown_merchant_to_program umtp ON umtp.merchant_pk = m.pk
WHERE m.ref_merchant_code IN (:refMerchantCode);
```

### Look up program by PK or term
```sql
SELECT
    ump.pk,
    ump.program_name,
    ump.states,
    ump.group_name,
    ump.processing_fee_override,
    ump.money_factor,
    ump.term_months,
    ump.allowed_frequency_override,
    ump.*
FROM uown_merchant_program ump
WHERE ump.term_months = :termMonths
-- WHERE ump.pk = :programPk
ORDER BY ump.pk DESC;
```

### Merchant change history
```sql
SELECT *
FROM uown_merchant_history umh
WHERE umh.row_created_timestamp BETWEEN :startDate AND :endDate
ORDER BY umh.pk DESC;
```

### Merchant activity log (program changes)
```sql
SELECT
    umal.merchant_pk,
    umal.merchant_name,
    umal.merchant_ref_code,
    umal.program_pk,
    umal.log_type,
    umal.notes,
    umal.created_by,
    umal.*
FROM uown_merchant_activity_log umal
WHERE umal.notes LIKE '%UPDATED: PROGRAM[payoffDiscount cha%'
-- WHERE umal.notes ILIKE '%moneyFactor chaged from%'
-- WHERE umal.merchant_ref_code IN (:refCode)
ORDER BY umal.pk DESC;
```

### Merchant Settings Snapshot by lead (R1.53.0)
```sql
-- Merchant config snapshot written at UW_APPROVED
-- Absence of a row = lead prior to R1.53.0 (Path A: no snapshot)
SELECT *
FROM uown_los_lead_merchant_settings_snapshot
WHERE lead_pk = :leadPk;
```

### Merchant Settings Snapshot by SVC account (R1.53.0)
```sql
-- Snapshot inherited from the lead, written at SVC account creation
SELECT *
FROM uown_sv_account_merchant_settings_snapshot
WHERE account_pk = :accountPk;
```

### Check snapshot existence (Path A vs Path B)
```sql
-- Path A (no snapshot): COUNT = 0 — lead/account pre-R1.53.0 or without UW_APPROVED
-- Path B (with snapshot): COUNT > 0 — config frozen at the moment of UW_APPROVED
SELECT COUNT(*) AS has_snapshot
FROM uown_los_lead_merchant_settings_snapshot
WHERE lead_pk = :leadPk;
```

---

## 12. Correspondence (Email/SMS)

### Email queue (recent or by account)
```sql
SELECT
    ueq.account_pk,
    ueq.lead_pk,
    ueq.row_created_timestamp,
    ueq.status,
    ueq.template_name,
    ueq.to_email_addresses,
    ueq.created_by,
    ueq.queue_type,
    ueq.email_body,
    ueq.sent_from_server,
    ueq.*
FROM uown_email_queue ueq
WHERE ueq.account_pk IN (:accountPk)
-- WHERE ueq.lead_pk IN (:leadPk)
-- WHERE ueq.row_created_timestamp BETWEEN :startDate AND :endDate
ORDER BY ueq.pk DESC;
```

### SMS queue
```sql
SELECT
    usq.lead_pk,
    usq.account_pk,
    usq.row_created_timestamp,
    usq.created_by,
    usq.status,
    usq.template_name,
    usq.from_phone_number,
    usq.sms_body,
    usq.response
FROM uown_sms_queue usq
WHERE usq.account_pk IN (:accountPk)
ORDER BY usq.pk DESC;
```

---

## 13. Sweeps and Scheduled Tasks

### List all sweeps
```sql
SELECT * FROM uown_scheduled_task ORDER BY scheduled_task_name ASC;
```

### Find sweep by name
```sql
SELECT *
FROM uown_scheduled_task
WHERE scheduled_task_name LIKE '%Payment%';
```

### Check active/inactive status of sweeps
```sql
SELECT scheduled_task_name, is_active
FROM uown_scheduled_task
ORDER BY scheduled_task_name;
```

### Sweep execution logs
```sql
SELECT *
FROM uown_sweep_logs usl
WHERE usl.row_created_timestamp BETWEEN :startDate AND :endDate
ORDER BY usl.pk DESC;
```

---

## 14. Sweep SQL (Selection Criteria)

The queries below are the SQL criteria that the sweeps use to select records to process. Useful for understanding the business logic and for troubleshooting.

### rerunCCPaymentsSweep - Retry of denied CC
```sql
SELECT DISTINCT ON(t.account_pk) t.*
FROM uown_sv_credit_card_transaction t
JOIN uown_sv_account a ON a.pk = t.account_pk
JOIN uown_sv_sched_summary s ON a.pk = s.account_pk
WHERE t.status = 'DENIED'
  AND t.is_nsf
  AND t.cc_action = 'SALE'
  AND t.cc_transaction_type = 'SCHEDULED'
  AND (t.number_of_tries IS NULL OR t.number_of_tries < 4)
  AND a.account_status = 'ACTIVE'
  AND (a.rating IS NULL OR a.rating NOT IN ('P', 'C', 'D'))
  AND (a.auto_pay_types LIKE '%CC%' AND a.auto_pay_types NOT LIKE '%ACH%')
  AND t.posting_date >= '2022-06-10'
  AND t.posting_date < CURRENT_DATE
  AND (t.rerun_status IS NULL OR t.rerun_status IN ('DENIED', 'SKIPPED'))
  AND (s.delinquency_as_of_date IS NULL OR s.delinquency_as_of_date < CURRENT_DATE)
  AND (t.posting_date = CURRENT_DATE - 1 OR EXTRACT(DOW FROM CURRENT_DATE) IN (4, 5, 6))
ORDER BY t.account_pk, t.pk DESC;
```

### delinquencyRerunCCPaymentsSweep - CC rerun on accounts delinquent 100+ days
```sql
SELECT DISTINCT(s.account_pk)
FROM uown_sv_account a
JOIN uown_sv_sched_summary s ON a.pk = s.account_pk
JOIN uown_sv_credit_card cc ON cc.account_pk = s.account_pk
JOIN uown_sv_payment pmt ON pmt.account_pk = s.account_pk
WHERE (s.delinquency_as_of_date IS NULL OR s.delinquency_as_of_date < CURRENT_DATE)
  AND CURRENT_DATE - s.delinquency_as_of_date > 100
  AND a.account_status = 'ACTIVE'
  AND cc.is_deleted IS NOT TRUE
  AND cc.auto_pay IS TRUE
  AND cc.is_valid_card IS NOT FALSE
  AND pmt.status = 'PAID'
  AND pmt.cc_pk IS NOT NULL
  AND (a.rating IS NULL OR a.rating NOT IN ('B','C','P','S','D','E','F','G','L','U'))
ORDER BY s.account_pk DESC;
```

### updateTaxRatesSweep - Accounts that need to update tax rate
```sql
SELECT a.pk AS accountPk, a.*
FROM uown_sv_account a
JOIN uown_sv_sched_summary summary ON summary.account_pk = a.pk
WHERE a.account_status = 'ACTIVE'
  AND (summary.last_tax_updated_time IS NULL
       OR summary.last_tax_updated_time + INTERVAL '1 MONTH' <= CURRENT_TIMESTAMP);
```

### FirstPaymentReminderSweep - First payment reminders
```sql
SELECT DISTINCT account.pk
FROM uown_sv_account account
JOIN uown_sv_sched_summary schedSummary ON account.pk = schedSummary.account_pk
JOIN uown_sv_email email ON email.account_pk = account.pk
JOIN uown_sv_receivable receivable ON receivable.account_pk = account.pk
WHERE account.account_status IN ('FUNDED', 'ACTIVE')
  AND schedSummary.first_payment_due_date IS NOT NULL
  AND schedSummary.first_payment_due_date <= CURRENT_DATE + 3
  AND COALESCE(email.do_not_email, FALSE) = FALSE
  AND receivable.due_date = schedSummary.first_payment_due_date
  AND receivable.receivable_type IN ('REGULAR_PAYMENT')
  AND receivable.allocation_status IN ('UNPAID')
  AND receivable.status IN ('ACTIVE')
  AND (SELECT COUNT(*)
       FROM uown_email_queue emailQueue
       WHERE template_name = 'FirstPaymentReminder'
         AND status IN ('STORED', 'SENT', 'PICKED_TO_STORE')
         AND account.pk = emailQueue.account_pk) = 0
  AND (account.rating IS NULL OR account.rating NOT IN ('B', 'C'));
```

### customerPortalReminderSweep - Customer portal invitations
```sql
SELECT DISTINCT a.pk
FROM uown_sv_account a
JOIN uown_sv_customer c ON c.account_pk = a.pk AND c.customer_type = 'PRIMARY'
LEFT JOIN uown_email_queue e ON e.account_pk = a.pk AND e.template_name = 'CustomerPortalReminderEmail'
WHERE (a.rating IS NULL OR a.rating NOT IN ('B','C','D','F','G','S','U'))
  AND c.last_successful_login IS NULL
  AND a.account_status = 'ACTIVE'
GROUP BY a.pk, a.activation_date
HAVING
  (a.activation_date = CURRENT_DATE - 1 AND COUNT(e) = 0)
  OR (a.activation_date = CURRENT_DATE - 10 AND COUNT(e) = 1)
  OR (a.activation_date = CURRENT_DATE - 20 AND COUNT(e) = 2)
  OR (EXTRACT(DAY FROM CURRENT_DATE) = 2 AND COUNT(e) > 2);
```

### RecurringPaymentReminderSweep - Recurring payment reminder
```sql
WITH receivable AS (
    SELECT a.pk AS accountPk, r.total_amount, r.due_date AS nextDueDate
    FROM uown_sv_account a
    JOIN uown_sv_receivable r ON r.account_pk = a.pk
      AND r.status = 'ACTIVE'
      AND r.allocation_status = 'UNPAID'
      AND r.receivable_type = 'REGULAR_PAYMENT'
      AND r.due_date = CURRENT_DATE + 3
)
SELECT
    account.pk AS accountPK,
    account.lead_pk AS leadPK,
    customer.pk AS customerPK,
    SUM(rec.total_amount - rec.partial_payment_amount) AS nextPaymentDueAmount,
    receivable.nextDueDate AS nextPaymentDueDate,
    INITCAP(customer.first_name) AS customerFirstName,
    email.email_address,
    CONCAT(phone.area_code, phone.phone_number) AS customerPhone
FROM receivable
JOIN uown_sv_account account ON account.pk = receivable.accountPk
JOIN uown_sv_customer customer ON customer.account_pk = account.pk
JOIN uown_sv_receivable rec ON rec.account_pk = account.pk
  AND rec.status = 'ACTIVE'
  AND (rec.allocation_status = 'UNPAID'
       OR (rec.allocation_status = 'PARTIALLY_PAID' AND rec.receivable_type = 'PROCESSING_FEE'))
  AND rec.due_date = receivable.nextDueDate
JOIN uown_sv_sched_summary schedSummary ON schedSummary.account_pk = account.pk
LEFT JOIN uown_sv_email email ON email.customer_pk = customer.pk
  AND COALESCE(email.do_not_email, FALSE) = FALSE
LEFT JOIN uown_sv_phone phone ON phone.account_pk = account.pk
  AND COALESCE(phone.do_not_text, FALSE) = FALSE
  AND phone.phone_type = 'MOBILE'
WHERE account.account_status = 'ACTIVE'
  AND rec.due_date > schedSummary.first_payment_due_date
  AND (account.rating NOT IN ('B','C') OR account.rating IS NULL)
GROUP BY account.pk, account.lead_pk, customer.pk, receivable.nextDueDate,
         customer.first_name, customer.last_name, email.email_address,
         schedSummary.total_number_of_payments, CONCAT(phone.area_code, phone.phone_number);
```

### delinquencyOfferEmailSweep - Negotiation offers by delinquency band
```sql
WITH eq AS (
    SELECT account_pk, template_name
    FROM uown_email_queue
    WHERE template_name IN ('Delinquency30DayOfferEmail', 'Delinquency60DayOfferEmail',
                            'Delinquency90DayOfferEmail', 'Delinquency150DayOfferEmail')
      AND status IN ('STORED', 'SENT', 'PICKED_TO_STORE')
      AND DATE(row_created_timestamp) = CURRENT_DATE
),
contractBalance AS (
    SELECT s.account_pk,
           s.total_contract_amount_with_tax_and_fees - COALESCE(SUM(p.payment_amount), 0.0) AS balance
    FROM uown_sv_sched_summary s
    LEFT JOIN uown_sv_payment p ON p.account_pk = s.account_pk AND p.status = 'PAID'
    GROUP BY s.pk, s.account_pk
)
SELECT a.pk
FROM uown_sv_account a
JOIN uown_sv_sched_summary summary ON summary.account_pk = a.pk
JOIN contractBalance ON contractBalance.account_pk = a.pk
LEFT JOIN eq ON eq.account_pk = a.pk
  AND eq.template_name = (CASE
      WHEN CURRENT_DATE - summary.delinquency_as_of_date BETWEEN 31 AND 60 THEN 'Delinquency30DayOfferEmail'
      WHEN CURRENT_DATE - summary.delinquency_as_of_date BETWEEN 61 AND 90 THEN 'Delinquency60DayOfferEmail'
      WHEN CURRENT_DATE - summary.delinquency_as_of_date BETWEEN 91 AND 150 THEN 'Delinquency90DayOfferEmail'
      WHEN CURRENT_DATE - summary.delinquency_as_of_date > 150 THEN 'Delinquency150DayOfferEmail'
  END)
WHERE a.account_status = 'ACTIVE'
  AND summary.delinquency_as_of_date IS NOT NULL
  AND CURRENT_DATE - summary.delinquency_as_of_date > 30
  AND contractBalance.balance > 0.0
  AND eq IS NULL
  AND (a.rating IS NULL OR a.rating NOT IN ('P','B','C'));
```

### paidInFullAccountEmailSweep - Paid-off accounts (for confirmation email)
```sql
SELECT DISTINCT sa.pk
FROM uown_sv_account sa
WHERE sa.pay_off_date_time IS NOT NULL
  AND EXTRACT(DOW FROM CURRENT_DATE) BETWEEN 1 AND 5
  AND sa.account_status IN ('PAID_OUT', 'PAID_OUT_EARLY')
  AND (sa.rating NOT IN ('B','C') OR sa.rating IS NULL)
  AND (CASE
      WHEN EXTRACT(DOW FROM CURRENT_DATE) IN (1, 2)
          THEN DATE(sa.pay_off_date_time) = CURRENT_DATE - 4
      WHEN EXTRACT(DOW FROM CURRENT_DATE) = 3
          THEN DATE(sa.pay_off_date_time) IN (CURRENT_DATE - 4, CURRENT_DATE - 3, CURRENT_DATE - 2)
      ELSE DATE(sa.pay_off_date_time) = CURRENT_DATE - 2
  END);
```

### sendCreditCardPaymentsSql - Send pending CC transactions (includes arrangements, Task #446)
```sql
-- Selects CC transactions with status PENDING and posting_date <= today
-- Excludes accounts with rating B or C
SELECT t.*
FROM uown_sv_credit_card_transaction t
JOIN uown_sv_account a ON a.pk = t.account_pk
WHERE t.status = 'PENDING'
  AND t.posting_date <= CURRENT_DATE
  AND a.account_status = 'ACTIVE'
  AND (a.rating IS NULL OR a.rating NOT IN ('B', 'C'))
ORDER BY t.pk ASC;
-- Result: selected transactions are marked as PICKED_TO_SEND
```

### sendACHPaymentsSql - Send pending ACH payments (includes arrangements, Task #446)
```sql
-- Selects ACH payments with status PENDING and posting_date <= tomorrow (D+1)
-- Excludes accounts with rating B or C
SELECT ap.*
FROM uown_sv_achpayment ap
JOIN uown_sv_account a ON a.pk = ap.account_pk
WHERE ap.status = 'PENDING'
  AND ap.posting_date <= CURRENT_DATE + 1
  AND (a.rating IS NULL OR a.rating NOT IN ('B', 'C'))
ORDER BY ap.pk ASC;
-- Result: selected payments are marked as PICKED_TO_SEND
```

### settledInFullAccountEmailSweep - Accounts settled by agreement
```sql
SELECT DISTINCT sa.pk
FROM uown_sv_account sa
WHERE sa.account_status = 'SETTLED_IN_FULL'
  AND (sa.rating NOT IN ('E','F','U') OR sa.rating IS NULL)
  AND EXTRACT(DOW FROM CURRENT_DATE) BETWEEN 1 AND 5
  AND sa.settled_in_full_date_time IS NOT NULL
  AND (CASE
      WHEN EXTRACT(DOW FROM CURRENT_DATE) IN (1, 2)
          THEN DATE(sa.settled_in_full_date_time) = CURRENT_DATE - 4
      WHEN EXTRACT(DOW FROM CURRENT_DATE) = 3
          THEN DATE(sa.settled_in_full_date_time) IN (CURRENT_DATE - 4, CURRENT_DATE - 3, CURRENT_DATE - 2)
      ELSE DATE(sa.settled_in_full_date_time) = CURRENT_DATE - 2
  END);
```

---

## 15. Delinquency and Collections

### Accounts delinquent 150+ days (with rating J or P)
```sql
WITH withdayslate AS (
    SELECT
        r.account_pk,
        r.due_date,
        ROW_NUMBER() OVER (PARTITION BY r.account_pk ORDER BY r.due_date ASC) AS rank
    FROM uown_sv_receivable r
    JOIN uown_sv_account ra ON ra.pk = r.account_pk
    WHERE r.status = 'ACTIVE'
      AND r.allocation_status NOT LIKE 'PAID%'
      AND r.receivable_type NOT IN ('EARLY_PAY_OFF')
)
SELECT
    usa.pk AS account_pk,
    usa.ref_account_id,
    usa.company,
    usa.account_status,
    usa.rating,
    w.due_date AS oldest_unpaid_due_date,
    (CURRENT_DATE - w.due_date) AS days_past_due
FROM uown_sv_account usa
JOIN withdayslate w ON w.account_pk = usa.pk AND w.rank = 1
WHERE usa.account_status = 'ACTIVE'
  AND (CURRENT_DATE - w.due_date) >= 150
  AND (usa.rating IS NULL OR usa.rating IN ('J', 'P'))
ORDER BY usa.pk DESC;
```

### Calculation of past due and settlement amount
```sql
WITH regularPayments AS (
    SELECT r.account_pk, SUM(r.total_amount) AS amount
    FROM uown_sv_receivable r
    WHERE r.status = 'ACTIVE' AND r.allocation_status = 'UNPAID'
      AND r.receivable_type = 'REGULAR_PAYMENT' AND r.due_date <= CURRENT_DATE
      AND r.account_pk = :accountPk
    GROUP BY r.account_pk
),
nsfFees AS (
    SELECT r.account_pk, SUM(r.total_amount) AS amount
    FROM uown_sv_receivable r
    WHERE r.status = 'ACTIVE' AND r.allocation_status = 'UNPAID'
      AND r.receivable_type = 'NSF_FEE' AND r.due_date <= CURRENT_DATE
      AND r.account_pk = :accountPk
    GROUP BY r.account_pk
),
partialPayments AS (
    SELECT r.account_pk, SUM(r.total_amount - r.partial_payment_amount) AS amount
    FROM uown_sv_receivable r
    WHERE r.status = 'ACTIVE' AND r.allocation_status = 'PARTIALLY_PAID'
      AND r.receivable_type = 'REGULAR_PAYMENT' AND r.due_date <= CURRENT_DATE
      AND r.account_pk = :accountPk
    GROUP BY r.account_pk
)
SELECT
    COALESCE(rp.amount, 0) AS past_due_regular,
    COALESCE(nsf.amount, 0) AS past_due_nsf,
    COALESCE(pp.amount, 0) AS past_due_partial,
    COALESCE(rp.amount, 0) + COALESCE(nsf.amount, 0) + COALESCE(pp.amount, 0) AS total_past_due,
    ROUND((COALESCE(rp.amount, 0) + COALESCE(nsf.amount, 0) + COALESCE(pp.amount, 0)) * 0.75, 2) AS settlement_due_amount,
    ROUND(((COALESCE(rp.amount, 0) + COALESCE(nsf.amount, 0) + COALESCE(pp.amount, 0)) * 0.75) / 2, 2) AS settlement_minimum_amount
FROM (SELECT :accountPk AS account_pk) base
LEFT JOIN regularPayments rp ON rp.account_pk = base.account_pk
LEFT JOIN nsfFees nsf ON nsf.account_pk = base.account_pk
LEFT JOIN partialPayments pp ON pp.account_pk = base.account_pk;
```

### Discount offer by delinquency band (Delinquency 150 Day Offer)
```sql
SELECT
    c.account_pk,
    c.first_name,
    CURRENT_DATE - summary.delinquency_as_of_date AS days_delinquent,
    ROUND(
        (summary.total_contract_amount_with_tax_and_fees -
            (SELECT SUM(r.partial_payment_amount)
             FROM uown_sv_receivable r
             WHERE r.status = 'ACTIVE'
               AND r.account_pk = a.pk
               AND r.receivable_type IN ('REGULAR_PAYMENT', 'EARLY_PAY_OFF', 'PROCESSING_FEE'))
        ) * (CASE
            WHEN CURRENT_DATE - summary.delinquency_as_of_date BETWEEN 61 AND 90 THEN 0.7
            WHEN CURRENT_DATE - summary.delinquency_as_of_date BETWEEN 91 AND 150 THEN 0.5
            WHEN CURRENT_DATE - summary.delinquency_as_of_date > 150 THEN 0.25
            ELSE 1
        END), 2
    ) AS settlement_offer_amount,
    email.email_address
FROM uown_sv_account a
JOIN uown_sv_customer c ON c.account_pk = a.pk
JOIN uown_sv_email email ON email.account_pk = a.pk AND email.do_not_email = FALSE AND email_type = 'PRIMARY'
JOIN uown_sv_sched_summary summary ON summary.account_pk = a.pk
WHERE a.account_status = 'ACTIVE'
  AND (a.rating NOT IN ('B','C') OR a.rating IS NULL)
ORDER BY a.pk DESC;
```

**Discount percentages by band:**

| Days Past Due | Discount Offered |
|---|---|
| 31-60 | 0% (full amount) |
| 61-90 | 30% (pays 70%) |
| 91-150 | 50% (pays 50%) |
| 150+ | 75% (pays 25%) |

### EPO pool on delinquent accounts (days past due with pool)
```sql
WITH nextRec AS (
    SELECT account_pk AS accountPk, MIN(due_date) AS nextDueDate
    FROM uown_sv_receivable r
    WHERE r.receivable_type IN ('REGULAR_PAYMENT', 'PROCESSING_FEE')
      AND r.allocation_status IN ('PARTIALLY_PAID', 'UNPAID')
      AND status = 'ACTIVE'
    GROUP BY account_pk
),
pastDueRec AS (
    SELECT account_pk AS accountPk, SUM(total_amount) - SUM(partial_payment_amount) AS pastDue
    FROM uown_sv_receivable r
    WHERE r.due_date < CURRENT_DATE
      AND r.receivable_type NOT IN ('EARLY_PAY_OFF')
      AND r.allocation_status IN ('PARTIALLY_PAID', 'UNPAID')
      AND status = 'ACTIVE'
    GROUP BY account_pk
),
minRec AS (
    SELECT account_pk AS accountPk, MIN(total_amount) AS regularPaymentAmount
    FROM uown_sv_receivable r
    WHERE r.receivable_type = 'REGULAR_PAYMENT'
      AND r.allocation_status IN ('UNPAID')
      AND status = 'ACTIVE'
    GROUP BY account_pk
)
SELECT
    nextRec.accountPk AS accountPk,
    nextRec.nextDueDate AS pastDueDate,
    CURRENT_DATE - nextRec.nextDueDate AS daysPastDue,
    CEILING(pastDueRec.pastDue) AS pastDue,
    CEILING(epoRec.partial_payment_amount) AS epoPoolAmount,
    CEILING(minRec.regularPaymentAmount) AS regularPaymentAmount
FROM nextRec
JOIN pastDueRec ON pastDueRec.accountPk = nextRec.accountPk
JOIN minRec ON minRec.accountPk = nextRec.accountPk
JOIN uown_sv_account a ON nextRec.accountPk = a.pk
JOIN uown_sv_receivable epoRec ON epoRec.account_pk = nextRec.accountPk
WHERE a.account_status = 'ACTIVE'
  AND epoRec.status = 'ACTIVE'
  AND epoRec.receivable_type = 'EARLY_PAY_OFF'
  AND epoRec.partial_payment_amount > 0
  AND nextRec.nextDueDate < CURRENT_DATE;
```

---

## 16. Logs and Auditing

### LOS activity log
```sql
SELECT
    ulal.lead_pk AS LeadPk,
    ulal.account_pk AS AccountPk,
    ulal.notes,
    ulal.created_by,
    ulal.creation_source,
    ulal.log_type,
    ulal.*
FROM uown_los_activity_log ulal
WHERE ulal.lead_pk IN (:leadPk)
ORDER BY ulal.pk DESC;
```

### SVC activity log
```sql
SELECT
    usal.lead_pk AS LeadPk,
    usal.account_pk AS AccountPk,
    usal.notes,
    usal.created_by,
    usal.deleted,
    usal.is_hidden,
    usal.priority,
    usal.*
FROM uown_sv_activity_log usal
WHERE usal.account_pk IN (:accountPk)
ORDER BY usal.pk DESC;
```

### Leads with the most INTERNAL activity from SYSTEM
```sql
SELECT
    ulal.lead_pk AS LeadPk,
    COUNT(*) AS num_occurrences,
    MAX(ulal.pk) AS max_pk
FROM uown_los_activity_log ulal
WHERE ulal.log_type IN ('INTERNAL')
  AND ulal.created_by IN ('SYSTEM')
GROUP BY ulal.lead_pk
HAVING COUNT(*) > 1
ORDER BY num_occurrences DESC;
```

### Inbound API logs (received requests)
```sql
SELECT *
FROM uown_los_inbound_api_log ulial
WHERE ulial.row_created_timestamp BETWEEN :startDate AND :endDate
  AND ulial.return_uuid IN (:leadPk)
ORDER BY pk DESC;
```

### Outbound API logs (sent requests)
```sql
SELECT *
FROM uown_los_outbound_api_log ulial
WHERE ulial.row_created_timestamp BETWEEN :startDate AND :endDate
ORDER BY pk DESC;
```

### Stored documents
```sql
SELECT
    usd.lead_pk,
    usd.account_pk,
    usd.path,
    usd.description,
    usd.document_group,
    usd.is_active,
    usd.is_visible_to_borrower,
    usd.*
FROM uown_stored_doc usd
WHERE usd.account_pk IN (:accountPk)
ORDER BY usd.pk DESC;
```

### Lead recordings (signing flow)
```sql
SELECT * FROM uown_lead_recording WHERE lead_pk IN (:leadPk);
```

### E-sign documents
```sql
SELECT * FROM uown_esign_document WHERE lead_pk IN (:leadPk);
```

---

## 17. Fraud Checks

### SEON (digital fraud)
```sql
SELECT
    us.lead_pk,
    us.full_name,
    us.status,
    us.document_type,
    us.id_verify_success,
    us.name_match_check_result,
    us.postal_code_result,
    us.results,
    us.*
FROM uown_seon us
WHERE us.lead_pk IN (:leadPk)
ORDER BY us.pk DESC;
```

### Intellicheck (ID document verification)
```sql
SELECT
    ui.lead_pk,
    ui.id_verify_success,
    ui.is_intellicheck_completed,
    ui.sent_to_intellicheck,
    ui.success,
    ui.response,
    ui.results
FROM uown_intellicheck ui
WHERE ui.lead_pk IN (:leadPk)
ORDER BY ui.pk DESC;
```

### Kount (credit card fraud)
```sql
SELECT * FROM uown_kount WHERE account_pk IN (:accountPk);
```

### Kount token (validity)
```sql
SELECT
    CASE WHEN access_token IS NULL THEN 'N' ELSE 'Y' END AS token_valid
FROM uown_kount_token
WHERE COALESCE(row_updated_timestamp, row_created_timestamp) > NOW() - INTERVAL '20 minutes'
ORDER BY COALESCE(row_updated_timestamp, row_created_timestamp) DESC
LIMIT 1;
```

### Plaid (bank verification)
```sql
-- Plaid users
SELECT * FROM uown_plaid_user WHERE lead_pk IN (:leadPk) ORDER BY pk DESC;

-- Plaid reports
SELECT
    upr.lead_pk,
    upr.cash_score,
    upr.partner_insights,
    upr.*
FROM uown_plaid_report upr
WHERE upr.lead_pk IN (:leadPk)
ORDER BY upr.pk DESC;
```

### Fraud verification (general)
```sql
SELECT
    ufv.lead_pk,
    ufv.device_hash,
    ufv.full_name,
    ufv.fraud_score,
    ufv.email,
    ufv.error,
    ufv.*
FROM uown_fraud_verification ufv
WHERE ufv.lead_pk IN (:leadPk);
```

---

## 18. Configurations and Templates

### State configurations
```sql
SELECT * FROM uown_state_configurations ORDER BY pk DESC;
```

### State config change history
```sql
SELECT * FROM uown_state_configurations_log WHERE state_pk IN (:statePk) ORDER BY pk DESC;
```

### Email/contract templates
```sql
SELECT
    ut.template_name,
    ut.document_name,
    ut.template_type,
    ut.data_fields_sql,
    ut.*
FROM uown_template ut
WHERE ut.template_name LIKE '%Welcome%'
-- WHERE ut.template_type = 'EMAIL'
ORDER BY ut.pk DESC;
```

### GDS token (underwriting)
```sql
SELECT * FROM uown_gds_token;
```

### Third party contacts
```sql
SELECT * FROM uown_third_party_contact WHERE account_pk IN (:accountPk);
```

---

## 19. AMS - Users and Permissions

### Look up user
```sql
SELECT * FROM "user" WHERE user_pk IN (:userPk);
```

### User log
```sql
SELECT * FROM user_log ORDER BY pk DESC;
```

### Permissions
```sql
SELECT * FROM permission WHERE name LIKE '%charge%';
```

### Roles
```sql
SELECT * FROM user_roles;
```

---

## Usage Tips

### Common parameters
- `:leadPk` - Lead PK (e.g., `14399`)
- `:accountPk` - Account PK (e.g., `206871`)
- `:refMerchantCode` - Merchant code (e.g., `'OL90205-0079'`)
- `:startDate` / `:endDate` - Period (e.g., `'2026-02-10 00:00:00.000'` / `'2026-02-10 23:59:59.999'`)

### Complete investigation of a lead (step by step)

1. **Find the lead:** `SELECT * FROM uown_los_lead WHERE pk = :leadPk`
2. **View UW data:** `SELECT * FROM uown_los_uwdata WHERE lead_pk = :leadPk`
3. **View activity log:** `SELECT * FROM uown_los_activity_log WHERE lead_pk = :leadPk ORDER BY pk DESC`
4. **View contract:** `SELECT * FROM uown_los_contract WHERE lead_pk = :leadPk`
5. **View invoice/items:** `SELECT * FROM uown_los_invoice WHERE lead_pk = :leadPk`
6. **If funded, view the account:** `SELECT * FROM uown_sv_account WHERE lead_pk = :leadPk`

### Complete investigation of an account (step by step)

1. **Find the account:** `SELECT * FROM uown_sv_account WHERE pk = :accountPk`
2. **View schedule summary:** `SELECT * FROM uown_sv_sched_summary WHERE account_pk = :accountPk`
3. **View receivables:** `SELECT * FROM uown_sv_receivable WHERE account_pk = :accountPk ORDER BY due_date`
4. **View payments:** `SELECT * FROM uown_sv_payment WHERE account_pk = :accountPk ORDER BY pk DESC`
5. **View CC transactions:** `SELECT * FROM uown_sv_credit_card_transaction WHERE account_pk = :accountPk ORDER BY pk DESC`
6. **View activity log:** `SELECT * FROM uown_sv_activity_log WHERE account_pk = :accountPk ORDER BY pk DESC`
7. **View alerts:** `SELECT * FROM uown_sv_alert WHERE account_pk = :accountPk`

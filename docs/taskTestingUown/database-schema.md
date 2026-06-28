# Database Schema — STG (svc)

> **Source:** `postgresql://35.224.143.155:5432/svc` (STG environment)  
> **Extracted:** 2026-06-27 (full dump — replaces 2026-03-04 extraction + R1.53.0 appended additions)  
> **Tables:** 209  
>
> Full live extraction replacing prior partial doc. Source: STG (35.224.143.155:5432) — QA2 tunnel was unavailable; STG runs the same schema as QA2/sandbox on R1.53.0+.

## Table of Contents

- [bk_sale_accounts](#bk_sale_accounts) (12 columns)
- [chargebacks](#chargebacks) (14 columns)
- [flyway_schema_history](#flyway_schema_history) (10 columns)
- [qrtz_blob_triggers](#qrtz_blob_triggers) (4 columns)
- [qrtz_calendars](#qrtz_calendars) (3 columns)
- [qrtz_cron_triggers](#qrtz_cron_triggers) (5 columns)
- [qrtz_fired_triggers](#qrtz_fired_triggers) (13 columns)
- [qrtz_job_details](#qrtz_job_details) (10 columns)
- [qrtz_locks](#qrtz_locks) (2 columns)
- [qrtz_paused_trigger_grps](#qrtz_paused_trigger_grps) (2 columns)
- [qrtz_scheduler_state](#qrtz_scheduler_state) (4 columns)
- [qrtz_simple_triggers](#qrtz_simple_triggers) (6 columns)
- [qrtz_simprop_triggers](#qrtz_simprop_triggers) (14 columns)
- [qrtz_triggers](#qrtz_triggers) (16 columns)
- [tmp_account_tax_for_zip](#tmp_account_tax_for_zip) (3 columns)
- [uniqcustomer](#uniqcustomer) (2 columns)
- [uniqcustomer_2023](#uniqcustomer_2023) (2 columns)
- [uown_account_tax_record](#uown_account_tax_record) (15 columns)
- [uown_accounts_to_be_sold](#uown_accounts_to_be_sold) (3 columns)
- [uown_address_verification](#uown_address_verification) (21 columns)
- [uown_api_info_tracker](#uown_api_info_tracker) (10 columns)
- [uown_api_key](#uown_api_key) (9 columns)
- [uown_api_user](#uown_api_user) (10 columns)
- [uown_approved_amount_by_segment](#uown_approved_amount_by_segment) (9 columns)
- [uown_bank_verification](#uown_bank_verification) (17 columns)
- [uown_bank_verification_attributes](#uown_bank_verification_attributes) (3 columns)
- [uown_bank_verification_outbound](#uown_bank_verification_outbound) (16 columns)
- [uown_ccverification_outbound_log](#uown_ccverification_outbound_log) (16 columns)
- [uown_company](#uown_company) (19 columns)
- [uown_configuration_management](#uown_configuration_management) (8 columns)
- [uown_correspondence_logs](#uown_correspondence_logs) (13 columns)
- [uown_correspondence_tracking](#uown_correspondence_tracking) (11 columns)
- [uown_customer_event](#uown_customer_event) (16 columns)
- [uown_customer_journey](#uown_customer_journey) (17 columns)
- [uown_customer_session](#uown_customer_session) (18 columns)
- [uown_customer_verification_data](#uown_customer_verification_data) (18 columns)
- [uown_data_intelligence_outbound](#uown_data_intelligence_outbound) (15 columns)
- [uown_due_date_moves](#uown_due_date_moves) (12 columns)
- [uown_email_attachment](#uown_email_attachment) (13 columns)
- [uown_email_queue](#uown_email_queue) (31 columns)
- [uown_esign_document](#uown_esign_document) (51 columns)
- [uown_esign_event_trigger_log](#uown_esign_event_trigger_log) (17 columns)
- [uown_failed_achpayments_from_vendor](#uown_failed_achpayments_from_vendor) (8 columns)
- [uown_fraud_engine_outbound](#uown_fraud_engine_outbound) (16 columns)
- [uown_fraud_verification](#uown_fraud_verification) (35 columns)
- [uown_frequency_mods](#uown_frequency_mods) (13 columns)
- [uown_funding_bank_account](#uown_funding_bank_account) (10 columns)
- [uown_funding_modification](#uown_funding_modification) (10 columns)
- [uown_funding_transaction](#uown_funding_transaction) (50 columns)
- [uown_funding_transaction_items](#uown_funding_transaction_items) (2 columns)
- [uown_gds_token](#uown_gds_token) (6 columns)
- [uown_gow_sign_template](#uown_gow_sign_template) (12 columns)
- [uown_identity_verification_outbound_log](#uown_identity_verification_outbound_log) (16 columns)
- [uown_import_log](#uown_import_log) (18 columns)
- [uown_intellicheck](#uown_intellicheck) (23 columns)
- [uown_inventory_category](#uown_inventory_category) (7 columns)
- [uown_kount](#uown_kount) (19 columns)
- [uown_kount_token](#uown_kount_token) (6 columns)
- [uown_lead_approval_terms](#uown_lead_approval_terms) (8 columns)
- [uown_lead_modifications](#uown_lead_modifications) (17 columns)
- [uown_lead_recording](#uown_lead_recording) (6 columns)
- [uown_lexis_nexis](#uown_lexis_nexis) (29 columns)
- [uown_lexis_nexis_outbound](#uown_lexis_nexis_outbound) (16 columns)
- [uown_login_attempt](#uown_login_attempt) (14 columns)
- [uown_los_activity_log](#uown_los_activity_log) (18 columns)
- [uown_los_address](#uown_los_address) (21 columns)
- [uown_los_address_history](#uown_los_address_history) (23 columns)
- [uown_los_alert](#uown_los_alert) (10 columns)
- [uown_los_bank_account](#uown_los_bank_account) (19 columns)
- [uown_los_bank_account_history](#uown_los_bank_account_history) (21 columns)
- [uown_los_black_list](#uown_los_black_list) (18 columns)
- [uown_los_black_list_history](#uown_los_black_list_history) (20 columns)
- [uown_los_contract](#uown_los_contract) (24 columns)
- [uown_los_contract_history](#uown_los_contract_history) (26 columns)
- [uown_los_credit_card](#uown_los_credit_card) (39 columns)
- [uown_los_credit_card_history](#uown_los_credit_card_history) (41 columns)
- [uown_los_credit_card_transaction](#uown_los_credit_card_transaction) (79 columns)
- [uown_los_customer](#uown_los_customer) (28 columns)
- [uown_los_customer_history](#uown_los_customer_history) (30 columns)
- [uown_los_email](#uown_los_email) (12 columns)
- [uown_los_email_history](#uown_los_email_history) (14 columns)
- [uown_los_employment](#uown_los_employment) (27 columns)
- [uown_los_employment_history](#uown_los_employment_history) (29 columns)
- [uown_los_inbound_api_log](#uown_los_inbound_api_log) (18 columns)
- [uown_los_inbound_internal_log](#uown_los_inbound_internal_log) (18 columns)
- [uown_los_invoice](#uown_los_invoice) (29 columns)
- [uown_los_invoice_history](#uown_los_invoice_history) (31 columns)
- [uown_los_item](#uown_los_item) (30 columns)
- [uown_los_item_history](#uown_los_item_history) (32 columns)
- [uown_los_lead](#uown_los_lead) (79 columns)
- [uown_los_lead_merchant_settings_snapshot](#uown_los_lead_merchant_settings_snapshot) (13 columns)
- [uown_los_lead_notes](#uown_los_lead_notes) (8 columns)
- [uown_los_lead_short_code](#uown_los_lead_short_code) (8 columns)
- [uown_los_lead_short_code_history](#uown_los_lead_short_code_history) (10 columns)
- [uown_los_outbound_api_log](#uown_los_outbound_api_log) (19 columns)
- [uown_los_payment](#uown_los_payment) (25 columns)
- [uown_los_payment_options](#uown_los_payment_options) (62 columns)
- [uown_los_payment_options_history](#uown_los_payment_options_history) (64 columns)
- [uown_los_phone](#uown_los_phone) (19 columns)
- [uown_los_phone_history](#uown_los_phone_history) (21 columns)
- [uown_los_protection_plan](#uown_los_protection_plan) (25 columns)
- [uown_los_receivable](#uown_los_receivable) (23 columns)
- [uown_los_receivable_history](#uown_los_receivable_history) (4 columns)
- [uown_los_sched_summary](#uown_los_sched_summary) (62 columns)
- [uown_los_sched_summary_history](#uown_los_sched_summary_history) (64 columns)
- [uown_los_uwdata](#uown_los_uwdata) (32 columns)
- [uown_los_uwdata_history](#uown_los_uwdata_history) (9 columns)
- [uown_mail_queue](#uown_mail_queue) (22 columns)
- [uown_merchant](#uown_merchant) (154 columns)
- [uown_merchant_activity_log](#uown_merchant_activity_log) (23 columns)
- [uown_merchant_api_error_log](#uown_merchant_api_error_log) (15 columns)
- [uown_merchant_api_error_log_history](#uown_merchant_api_error_log_history) (17 columns)
- [uown_merchant_bank_account](#uown_merchant_bank_account) (12 columns)
- [uown_merchant_bank_account_history](#uown_merchant_bank_account_history) (14 columns)
- [uown_merchant_history](#uown_merchant_history) (155 columns)
- [uown_merchant_program](#uown_merchant_program) (30 columns)
- [uown_merchant_to_program](#uown_merchant_to_program) (9 columns)
- [uown_neuro_id_verification](#uown_neuro_id_verification) (13 columns)
- [uown_neuro_id_verification_attributes](#uown_neuro_id_verification_attributes) (4 columns)
- [uown_neustar](#uown_neustar) (48 columns)
- [uown_pay_near_me_attempt](#uown_pay_near_me_attempt) (13 columns)
- [uown_pay_near_me_inbound_api_log](#uown_pay_near_me_inbound_api_log) (16 columns)
- [uown_pay_near_me_order](#uown_pay_near_me_order) (11 columns)
- [uown_pay_near_me_order_change_callback](#uown_pay_near_me_order_change_callback) (41 columns)
- [uown_pay_near_me_outbound_api_log](#uown_pay_near_me_outbound_api_log) (14 columns)
- [uown_pay_near_me_payment_callback](#uown_pay_near_me_payment_callback) (26 columns)
- [uown_paywallet](#uown_paywallet) (25 columns)
- [uown_paywallet_history](#uown_paywallet_history) (24 columns)
- [uown_paywallet_outbound_api_log](#uown_paywallet_outbound_api_log) (15 columns)
- [uown_plaid_report](#uown_plaid_report) (12 columns)
- [uown_plaid_user](#uown_plaid_user) (8 columns)
- [uown_podium_token](#uown_podium_token) (7 columns)
- [uown_revinfo](#uown_revinfo) (2 columns)
- [uown_right_foot_balance_check](#uown_right_foot_balance_check) (19 columns)
- [uown_right_foot_batch](#uown_right_foot_batch) (13 columns)
- [uown_right_foot_outbound_api_log](#uown_right_foot_outbound_api_log) (9 columns)
- [uown_scheduled_task](#uown_scheduled_task) (16 columns)
- [uown_scheduled_task_history](#uown_scheduled_task_history) (18 columns)
- [uown_scheduled_task_run](#uown_scheduled_task_run) (11 columns)
- [uown_second_opportunity_accounts](#uown_second_opportunity_accounts) (27 columns)
- [uown_send_sv_ach_payment](#uown_send_sv_ach_payment) (24 columns)
- [uown_sentilink](#uown_sentilink) (32 columns)
- [uown_sentilink_reason_code](#uown_sentilink_reason_code) (11 columns)
- [uown_sentilink_score](#uown_sentilink_score) (10 columns)
- [uown_seon](#uown_seon) (20 columns)
- [uown_sms_attachment](#uown_sms_attachment) (13 columns)
- [uown_sms_queue](#uown_sms_queue) (34 columns)
- [uown_state_configurations](#uown_state_configurations) (17 columns)
- [uown_state_configurations_log](#uown_state_configurations_log) (8 columns)
- [uown_sticky](#uown_sticky) (15 columns)
- [uown_sticky_inbound_log](#uown_sticky_inbound_log) (17 columns)
- [uown_sticky_outbound_log](#uown_sticky_outbound_log) (13 columns)
- [uown_sticky_retry_attempt](#uown_sticky_retry_attempt) (16 columns)
- [uown_sticky_webhook_dedupe](#uown_sticky_webhook_dedupe) (7 columns)
- [uown_stored_doc](#uown_stored_doc) (30 columns)
- [uown_submit_application_error_log](#uown_submit_application_error_log) (17 columns)
- [uown_sv_account](#uown_sv_account) (45 columns)
- [uown_sv_account_merchant_settings_snapshot](#uown_sv_account_merchant_settings_snapshot) (14 columns)
- [uown_sv_account_notes](#uown_sv_account_notes) (8 columns)
- [uown_sv_achpayment](#uown_sv_achpayment) (48 columns)
- [uown_sv_achpayment_history](#uown_sv_achpayment_history) (4 columns)
- [uown_sv_activity_log](#uown_sv_activity_log) (18 columns)
- [uown_sv_address](#uown_sv_address) (21 columns)
- [uown_sv_alert](#uown_sv_alert) (10 columns)
- [uown_sv_allocation](#uown_sv_allocation) (16 columns)
- [uown_sv_allocation_history](#uown_sv_allocation_history) (18 columns)
- [uown_sv_auth_token](#uown_sv_auth_token) (9 columns)
- [uown_sv_bank_account](#uown_sv_bank_account) (19 columns)
- [uown_sv_bank_account_history](#uown_sv_bank_account_history) (21 columns)
- [uown_sv_contract](#uown_sv_contract) (24 columns)
- [uown_sv_credit_card](#uown_sv_credit_card) (39 columns)
- [uown_sv_credit_card_history](#uown_sv_credit_card_history) (41 columns)
- [uown_sv_credit_card_transaction](#uown_sv_credit_card_transaction) (79 columns)
- [uown_sv_customer](#uown_sv_customer) (28 columns)
- [uown_sv_email](#uown_sv_email) (12 columns)
- [uown_sv_email_history](#uown_sv_email_history) (14 columns)
- [uown_sv_employment](#uown_sv_employment) (27 columns)
- [uown_sv_employment_history](#uown_sv_employment_history) (29 columns)
- [uown_sv_inbound_api_log](#uown_sv_inbound_api_log) (18 columns)
- [uown_sv_inbound_internal_log](#uown_sv_inbound_internal_log) (17 columns)
- [uown_sv_invoice](#uown_sv_invoice) (29 columns)
- [uown_sv_invoice_history](#uown_sv_invoice_history) (3 columns)
- [uown_sv_item](#uown_sv_item) (30 columns)
- [uown_sv_item_history](#uown_sv_item_history) (4 columns)
- [uown_sv_outbound_api_log](#uown_sv_outbound_api_log) (19 columns)
- [uown_sv_payment](#uown_sv_payment) (25 columns)
- [uown_sv_payment_arrangement](#uown_sv_payment_arrangement) (18 columns)
- [uown_sv_phone](#uown_sv_phone) (19 columns)
- [uown_sv_phone_history](#uown_sv_phone_history) (21 columns)
- [uown_sv_protection_plan](#uown_sv_protection_plan) (25 columns)
- [uown_sv_pwpayment](#uown_sv_pwpayment) (18 columns)
- [uown_sv_receivable](#uown_sv_receivable) (23 columns)
- [uown_sv_receivable_history](#uown_sv_receivable_history) (25 columns)
- [uown_sv_sched_summary](#uown_sv_sched_summary) (62 columns)
- [uown_sv_sched_summary_history](#uown_sv_sched_summary_history) (64 columns)
- [uown_sv_sql_config](#uown_sv_sql_config) (8 columns)
- [uown_sv_sql_config_history](#uown_sv_sql_config_history) (10 columns)
- [uown_sv_transaction](#uown_sv_transaction) (30 columns)
- [uown_sv_transaction_history](#uown_sv_transaction_history) (4 columns)
- [uown_sv_uwdata](#uown_sv_uwdata) (32 columns)
- [uown_sweep_logs](#uown_sweep_logs) (15 columns)
- [uown_tax_cloud](#uown_tax_cloud) (16 columns)
- [uown_tax_cloud_outbound](#uown_tax_cloud_outbound) (19 columns)
- [uown_tax_for_zip](#uown_tax_for_zip) (17 columns)
- [uown_template](#uown_template) (34 columns)
- [uown_third_party_contact](#uown_third_party_contact) (8 columns)
- [uown_uw_engine_data](#uown_uw_engine_data) (17 columns)
- [uown_uwengine_outbound](#uown_uwengine_outbound) (15 columns)
- [uown_uwstep](#uown_uwstep) (7 columns)

---

## bk_sale_accounts

**Schema:** `public` | **Columns:** 12

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pm_accountkey` | bigint | YES |  |
| 2 | `pm_poolkey` | integer | YES |  |
| 3 | `accountnumber` | character varying(255) | YES |  |
| 4 | `accountnumber2` | character varying(255) | YES |  |
| 5 | `bkcasenumber` | integer | YES |  |
| 6 | `bkchapter` | integer | YES |  |
| 7 | `bkstatus` | character varying(255) | YES |  |
| 8 | `bkfileddate` | date | YES |  |
| 9 | `bkclaimdate` | date | YES |  |
| 10 | `unitprice` | double precision | YES |  |
| 11 | `category` | character varying(255) | YES |  |
| 12 | `saleeligible` | character varying(20) | YES |  |

## chargebacks

**Schema:** `public` | **Columns:** 14

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `response_due_date` | date | YES |  |
| 2 | `chargeback_date` | date | YES |  |
| 3 | `transaction_date` | date | YES |  |
| 4 | `original_amount` | numeric | YES |  |
| 5 | `case_type_desc` | character varying(100) | YES |  |
| 6 | `item_type_desc` | character varying(255) | YES |  |
| 7 | `amount` | numeric | YES |  |
| 8 | `cardholder` | character varying(50) | YES |  |
| 9 | `acquirer_reference` | character varying(50) | YES |  |
| 10 | `reason` | character varying(255) | YES |  |
| 11 | `case_number` | character varying(50) | YES |  |
| 12 | `family_id` | character varying(50) | YES |  |
| 13 | `authorization_code` | character varying(50) | YES |  |
| 14 | `id` | bigint | NO |  |

## flyway_schema_history

**Schema:** `public` | **Columns:** 10

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `installed_rank` | integer | NO |  |
| 2 | `version` | character varying(50) | YES |  |
| 3 | `description` | character varying(200) | NO |  |
| 4 | `type` | character varying(20) | NO |  |
| 5 | `script` | character varying(1000) | NO |  |
| 6 | `checksum` | integer | YES |  |
| 7 | `installed_by` | character varying(100) | NO |  |
| 8 | `installed_on` | timestamp without time zone | NO | now() |
| 9 | `execution_time` | integer | NO |  |
| 10 | `success` | boolean | NO |  |

## qrtz_blob_triggers

**Schema:** `public` | **Columns:** 4

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `sched_name` | character varying(120) | NO |  |
| 2 | `trigger_name` | character varying(200) | NO |  |
| 3 | `trigger_group` | character varying(200) | NO |  |
| 4 | `blob_data` | bytea | YES |  |

## qrtz_calendars

**Schema:** `public` | **Columns:** 3

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `sched_name` | character varying(120) | NO |  |
| 2 | `calendar_name` | character varying(200) | NO |  |
| 3 | `calendar` | bytea | NO |  |

## qrtz_cron_triggers

**Schema:** `public` | **Columns:** 5

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `sched_name` | character varying(120) | NO |  |
| 2 | `trigger_name` | character varying(200) | NO |  |
| 3 | `trigger_group` | character varying(200) | NO |  |
| 4 | `cron_expression` | character varying(120) | NO |  |
| 5 | `time_zone_id` | character varying(80) | YES |  |

## qrtz_fired_triggers

**Schema:** `public` | **Columns:** 13

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `sched_name` | character varying(120) | NO |  |
| 2 | `entry_id` | character varying(95) | NO |  |
| 3 | `trigger_name` | character varying(200) | NO |  |
| 4 | `trigger_group` | character varying(200) | NO |  |
| 5 | `instance_name` | character varying(200) | NO |  |
| 6 | `fired_time` | bigint | NO |  |
| 7 | `sched_time` | bigint | NO |  |
| 8 | `priority` | integer | NO |  |
| 9 | `state` | character varying(16) | NO |  |
| 10 | `job_name` | character varying(200) | YES |  |
| 11 | `job_group` | character varying(200) | YES |  |
| 12 | `is_nonconcurrent` | boolean | YES |  |
| 13 | `requests_recovery` | boolean | YES |  |

## qrtz_job_details

**Schema:** `public` | **Columns:** 10

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `sched_name` | character varying(120) | NO |  |
| 2 | `job_name` | character varying(200) | NO |  |
| 3 | `job_group` | character varying(200) | NO |  |
| 4 | `description` | character varying(250) | YES |  |
| 5 | `job_class_name` | character varying(250) | NO |  |
| 6 | `is_durable` | boolean | NO |  |
| 7 | `is_nonconcurrent` | boolean | NO |  |
| 8 | `is_update_data` | boolean | NO |  |
| 9 | `requests_recovery` | boolean | NO |  |
| 10 | `job_data` | bytea | YES |  |

## qrtz_locks

**Schema:** `public` | **Columns:** 2

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `sched_name` | character varying(120) | NO |  |
| 2 | `lock_name` | character varying(40) | NO |  |

## qrtz_paused_trigger_grps

**Schema:** `public` | **Columns:** 2

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `sched_name` | character varying(120) | NO |  |
| 2 | `trigger_group` | character varying(200) | NO |  |

## qrtz_scheduler_state

**Schema:** `public` | **Columns:** 4

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `sched_name` | character varying(120) | NO |  |
| 2 | `instance_name` | character varying(200) | NO |  |
| 3 | `last_checkin_time` | bigint | NO |  |
| 4 | `checkin_interval` | bigint | NO |  |

## qrtz_simple_triggers

**Schema:** `public` | **Columns:** 6

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `sched_name` | character varying(120) | NO |  |
| 2 | `trigger_name` | character varying(200) | NO |  |
| 3 | `trigger_group` | character varying(200) | NO |  |
| 4 | `repeat_count` | bigint | NO |  |
| 5 | `repeat_interval` | bigint | NO |  |
| 6 | `times_triggered` | bigint | NO |  |

## qrtz_simprop_triggers

**Schema:** `public` | **Columns:** 14

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `sched_name` | character varying(120) | NO |  |
| 2 | `trigger_name` | character varying(200) | NO |  |
| 3 | `trigger_group` | character varying(200) | NO |  |
| 4 | `str_prop_1` | character varying(512) | YES |  |
| 5 | `str_prop_2` | character varying(512) | YES |  |
| 6 | `str_prop_3` | character varying(512) | YES |  |
| 7 | `int_prop_1` | integer | YES |  |
| 8 | `int_prop_2` | integer | YES |  |
| 9 | `long_prop_1` | bigint | YES |  |
| 10 | `long_prop_2` | bigint | YES |  |
| 11 | `dec_prop_1` | numeric | YES |  |
| 12 | `dec_prop_2` | numeric | YES |  |
| 13 | `bool_prop_1` | boolean | YES |  |
| 14 | `bool_prop_2` | boolean | YES |  |

## qrtz_triggers

**Schema:** `public` | **Columns:** 16

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `sched_name` | character varying(120) | NO |  |
| 2 | `trigger_name` | character varying(200) | NO |  |
| 3 | `trigger_group` | character varying(200) | NO |  |
| 4 | `job_name` | character varying(200) | NO |  |
| 5 | `job_group` | character varying(200) | NO |  |
| 6 | `description` | character varying(250) | YES |  |
| 7 | `next_fire_time` | bigint | YES |  |
| 8 | `prev_fire_time` | bigint | YES |  |
| 9 | `priority` | integer | YES |  |
| 10 | `trigger_state` | character varying(16) | NO |  |
| 11 | `trigger_type` | character varying(8) | NO |  |
| 12 | `start_time` | bigint | NO |  |
| 13 | `end_time` | bigint | YES |  |
| 14 | `calendar_name` | character varying(200) | YES |  |
| 15 | `misfire_instr` | smallint | YES |  |
| 16 | `job_data` | bytea | YES |  |

## tmp_account_tax_for_zip

**Schema:** `public` | **Columns:** 3

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | YES |  |
| 2 | `merchant_pk` | bigint | YES |  |
| 3 | `tax_for_zip_pk` | bigint | YES |  |

## uniqcustomer

**Schema:** `public` | **Columns:** 2

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `ss_number` | character varying(255) | YES |  |
| 2 | `lead_pk` | bigint | YES |  |

## uniqcustomer_2023

**Schema:** `public` | **Columns:** 2

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `ss_number` | character varying(255) | YES |  |
| 2 | `lead_pk` | bigint | YES |  |

## uown_account_tax_record

**Schema:** `public` | **Columns:** 15

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `account_pk` | bigint | NO |  |
| 8 | `address` | character varying(255) | YES |  |
| 9 | `city` | character varying(255) | YES |  |
| 10 | `country` | character varying(255) | YES |  |
| 11 | `new_tax_rate` | numeric | YES |  |
| 12 | `old_tax_rate` | numeric | YES |  |
| 13 | `state` | character varying(255) | YES |  |
| 14 | `zipcode` | character varying(255) | YES |  |
| 15 | `tax_for_zip_pk` | bigint | YES |  |

## uown_accounts_to_be_sold

**Schema:** `public` | **Columns:** 3

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `account_pk` | bigint | YES |  |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `comment` | text | YES |  |

## uown_address_verification

**Schema:** `public` | **Columns:** 21

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `address_type` | character varying(255) | YES |  |
| 6 | `at_address_from` | character varying(255) | YES |  |
| 7 | `city` | character varying(255) | YES |  |
| 8 | `country` | character varying(255) | YES |  |
| 9 | `do_not_contact` | boolean | YES |  |
| 10 | `duration` | character varying(255) | YES |  |
| 11 | `housing_status` | character varying(255) | YES |  |
| 12 | `state` | character varying(255) | YES |  |
| 13 | `street_address1` | character varying(255) | YES |  |
| 14 | `street_address2` | character varying(255) | YES |  |
| 15 | `zip_code` | character varying(255) | YES |  |
| 16 | `estimated_value` | numeric | YES |  |
| 17 | `last_run` | date | YES |  |
| 18 | `melissa_data_pk` | bigint | NO |  |
| 19 | `mortgage_value` | numeric | YES |  |
| 20 | `zip_code9` | character varying(255) | YES |  |
| 21 | `is_autocomplete_verified` | boolean | YES |  |

## uown_api_info_tracker

**Schema:** `public` | **Columns:** 10

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `api` | character varying(255) | YES |  |
| 6 | `end_time` | timestamp without time zone | YES |  |
| 7 | `lead_pk` | bigint | YES |  |
| 8 | `method` | character varying(255) | YES |  |
| 9 | `start_time` | timestamp without time zone | YES |  |
| 10 | `total_time_taken_ms` | bigint | YES |  |

## uown_api_key

**Schema:** `public` | **Columns:** 9

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `api_user_pk` | bigint | NO |  |
| 8 | `expires` | timestamp without time zone | YES |  |
| 9 | `key` | character varying(500) | YES |  |

## uown_api_user

**Schema:** `public` | **Columns:** 10

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `company_name` | character varying(255) | YES |  |
| 8 | `password` | character varying(255) | YES |  |
| 9 | `username` | character varying(255) | YES |  |
| 10 | `api_user_type` | character varying(32) | YES |  |

## uown_approved_amount_by_segment

**Schema:** `public` | **Columns:** 9

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `lambda_segment` | integer | NO |  |
| 8 | `max_approved_amount_cr` | numeric | NO |  |
| 9 | `risk_type` | character varying(50) | NO |  |

## uown_bank_verification

**Schema:** `public` | **Columns:** 17

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `account_id` | character varying(255) | YES |  |
| 6 | `account_no` | character varying(255) | YES |  |
| 7 | `base_url` | character varying(255) | YES |  |
| 8 | `bv_status` | character varying(255) | YES |  |
| 9 | `current` | boolean | YES |  |
| 10 | `error_message` | text | YES |  |
| 11 | `is_verified` | boolean | YES |  |
| 12 | `lead_pk` | bigint | YES |  |
| 13 | `login_id` | character varying(255) | YES |  |
| 14 | `number_of_attempts` | integer | YES |  |
| 15 | `request_id` | character varying(255) | YES |  |
| 16 | `routing_no` | character varying(255) | YES |  |
| 17 | `success` | boolean | YES |  |

## uown_bank_verification_attributes

**Schema:** `public` | **Columns:** 3

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `attribute_name` | character varying(255) | YES |  |
| 3 | `attribute_value` | character varying(255) | YES |  |

## uown_bank_verification_outbound

**Schema:** `public` | **Columns:** 16

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `api` | character varying(255) | YES |  |
| 8 | `call_type` | character varying(255) | YES |  |
| 9 | `header` | text | YES |  |
| 10 | `request` | text | YES |  |
| 11 | `request_object` | text | YES |  |
| 12 | `response` | text | YES |  |
| 13 | `source` | character varying(255) | YES |  |
| 14 | `stack_trace` | text | YES |  |
| 15 | `url` | text | YES |  |
| 16 | `bank_verification_pk` | bigint | YES |  |

## uown_ccverification_outbound_log

**Schema:** `public` | **Columns:** 16

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `api` | character varying(255) | YES |  |
| 8 | `call_type` | character varying(255) | YES |  |
| 9 | `header` | text | YES |  |
| 10 | `lead_pk` | bigint | YES |  |
| 11 | `request` | text | YES |  |
| 12 | `request_object` | text | YES |  |
| 13 | `response` | text | YES |  |
| 14 | `source` | character varying(255) | YES |  |
| 15 | `stack_trace` | text | YES |  |
| 16 | `url` | text | YES |  |

## uown_company

**Schema:** `public` | **Columns:** 19

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_company_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `brand_address` | character varying(255) | YES |  |
| 8 | `brand_city` | character varying(255) | YES |  |
| 9 | `brand_email` | character varying(255) | YES |  |
| 10 | `brand_fax` | character varying(255) | YES |  |
| 11 | `brand_name` | character varying(255) | YES |  |
| 12 | `brand_phone` | character varying(255) | YES |  |
| 13 | `brand_state` | character varying(255) | YES |  |
| 14 | `brand_zip` | character varying(255) | YES |  |
| 15 | `name` | character varying(255) | YES |  |
| 16 | `pickup_email_address` | character varying(255) | YES |  |
| 17 | `hours_of_operation_weekdays` | character varying(255) | YES | '8:00 AM – 11:00 PM (EST)'::character varying |
| 18 | `hours_of_operation_saturday` | character varying(255) | YES | '9:00 AM – 11:00 PM (EST)'::character varying |
| 19 | `hours_of_operation_sunday` | character varying(255) | YES | '10:00 AM – 11:00 PM (EST)'::character varying |

## uown_configuration_management

**Schema:** `public` | **Columns:** 8

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_configuration_management_pk_seq'::regclass) |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `key` | text | YES |  |
| 6 | `value` | text | YES |  |
| 7 | `agent` | character varying(255) | YES |  |
| 8 | `web_user_id` | bigint | YES |  |

## uown_correspondence_logs

**Schema:** `public` | **Columns:** 13

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `correspondence_type` | character varying(255) | YES |  |
| 8 | `data_map` | text | YES |  |
| 9 | `error` | text | YES |  |
| 10 | `source` | integer | YES |  |
| 11 | `template_name` | character varying(255) | YES |  |
| 12 | `account_pk` | bigint | YES |  |
| 13 | `lead_pk` | bigint | YES |  |

## uown_correspondence_tracking

**Schema:** `public` | **Columns:** 11

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `account_pk` | bigint | YES |  |
| 6 | `correspondence_type` | character varying(255) | YES |  |
| 7 | `final_step` | character varying(255) | YES |  |
| 8 | `id` | character varying(255) | YES |  |
| 9 | `lead_pk` | bigint | YES |  |
| 10 | `path_taken` | text | YES |  |
| 11 | `payment_made` | boolean | YES |  |

## uown_customer_event

**Schema:** `public` | **Columns:** 16

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_customer_event_pk_seq'::regclass) |
| 2 | `event_id` | character varying(255) | NO |  |
| 3 | `session_id` | character varying(255) | NO |  |
| 4 | `journey_id` | character varying(255) | NO |  |
| 5 | `event_type` | character varying(255) | NO |  |
| 6 | `page_name` | character varying(255) | YES |  |
| 7 | `event_timestamp` | timestamp without time zone | YES |  |
| 8 | `api_method` | character varying(255) | YES |  |
| 9 | `api_duration_ms` | bigint | YES |  |
| 10 | `render_duration_ms` | bigint | YES |  |
| 11 | `page_duration_ms` | bigint | YES |  |
| 12 | `error_code` | character varying(255) | YES |  |
| 13 | `error_message` | character varying(255) | YES |  |
| 14 | `row_created_timestamp` | timestamp without time zone | YES | CURRENT_TIMESTAMP |
| 15 | `row_updated_timestamp` | timestamp without time zone | YES | CURRENT_TIMESTAMP |
| 16 | `tenant_id` | bigint | YES |  |

## uown_customer_journey

**Schema:** `public` | **Columns:** 17

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_customer_journey_pk_seq'::regclass) |
| 2 | `journey_id` | character varying(255) | NO |  |
| 3 | `application_id` | character varying(255) | YES |  |
| 4 | `merchant_id` | character varying(255) | YES |  |
| 5 | `shortcode` | character varying(32) | YES |  |
| 6 | `current_step` | character varying(255) | YES |  |
| 7 | `status` | character varying(32) | NO |  |
| 8 | `started_at` | timestamp without time zone | YES |  |
| 9 | `completed_at` | timestamp without time zone | YES |  |
| 10 | `last_activity_at` | timestamp without time zone | YES |  |
| 11 | `total_sessions` | integer | YES | 0 |
| 12 | `total_refreshes` | integer | YES | 0 |
| 13 | `total_submit_attempts` | integer | YES | 0 |
| 14 | `row_created_timestamp` | timestamp without time zone | YES | CURRENT_TIMESTAMP |
| 15 | `row_updated_timestamp` | timestamp without time zone | YES | CURRENT_TIMESTAMP |
| 16 | `tenant_id` | bigint | YES |  |
| 17 | `source` | character varying(255) | YES |  |

## uown_customer_session

**Schema:** `public` | **Columns:** 18

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_customer_session_pk_seq'::regclass) |
| 2 | `session_id` | character varying(255) | NO |  |
| 3 | `journey_id` | character varying(255) | NO |  |
| 4 | `status` | character varying(255) | NO |  |
| 5 | `browser` | character varying(255) | YES |  |
| 6 | `device_type` | character varying(255) | YES |  |
| 7 | `operating_system` | character varying(255) | YES |  |
| 8 | `iframe_ind` | boolean | YES | false |
| 9 | `embedder_origin` | character varying(255) | YES |  |
| 10 | `refresh_count` | integer | YES | 0 |
| 11 | `last_page_name` | character varying(255) | YES |  |
| 12 | `last_event_type` | character varying(255) | YES |  |
| 13 | `last_event_time` | timestamp without time zone | YES |  |
| 14 | `started_at` | timestamp without time zone | YES |  |
| 15 | `ended_at` | timestamp without time zone | YES |  |
| 16 | `row_created_timestamp` | timestamp without time zone | YES | CURRENT_TIMESTAMP |
| 17 | `row_updated_timestamp` | timestamp without time zone | YES | CURRENT_TIMESTAMP |
| 18 | `tenant_id` | bigint | YES |  |

## uown_customer_verification_data

**Schema:** `public` | **Columns:** 18

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `account_pk` | bigint | YES |  |
| 8 | `address1` | character varying(255) | YES |  |
| 9 | `address2` | character varying(255) | YES |  |
| 10 | `agent_username` | character varying(255) | YES |  |
| 11 | `city` | character varying(255) | YES |  |
| 12 | `date_of_birth` | date | YES |  |
| 13 | `first_name` | character varying(255) | YES |  |
| 14 | `last4ssn` | character varying(255) | YES |  |
| 15 | `last_name` | character varying(255) | YES |  |
| 16 | `state` | character varying(255) | YES |  |
| 17 | `validation_type` | character varying(255) | YES |  |
| 18 | `zip` | character varying(255) | YES |  |

## uown_data_intelligence_outbound

**Schema:** `public` | **Columns:** 15

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `api` | character varying(255) | YES |  |
| 8 | `call_type` | character varying(255) | YES |  |
| 9 | `header` | text | YES |  |
| 10 | `request` | text | YES |  |
| 11 | `request_object` | text | YES |  |
| 12 | `response` | text | YES |  |
| 13 | `source` | character varying(255) | YES |  |
| 14 | `stack_trace` | text | YES |  |
| 15 | `url` | text | YES |  |

## uown_due_date_moves

**Schema:** `public` | **Columns:** 12

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `account_pk` | bigint | YES |  |
| 8 | `agent_username` | character varying(255) | YES |  |
| 9 | `moved_by_days` | integer | YES |  |
| 10 | `moved_from_due_date` | date | YES |  |
| 11 | `is_fpd_change` | boolean | YES |  |
| 12 | `adjustment_type` | character varying(255) | YES |  |

## uown_email_attachment

**Schema:** `public` | **Columns:** 13

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_email_attachment_pk_seq'::regclass) |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `web_user_id` | bigint | YES |  |
| 6 | `attachment_type` | character varying(255) | YES |  |
| 7 | `content` | bytea | YES |  |
| 8 | `content_base64string` | text | YES |  |
| 9 | `content_id` | character varying(255) | YES |  |
| 10 | `disposition` | character varying(255) | YES |  |
| 11 | `name` | character varying(255) | YES |  |
| 12 | `template_name` | character varying(255) | YES |  |
| 13 | `email_queue_pk` | bigint | YES |  |

## uown_email_queue

**Schema:** `public` | **Columns:** 31

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_email_queue_pk_seq'::regclass) |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `web_user_id` | bigint | YES |  |
| 6 | `account_pk` | bigint | YES |  |
| 7 | `created_by` | character varying(255) | YES |  |
| 8 | `customer_pk` | bigint | YES |  |
| 9 | `data_map` | text | YES |  |
| 10 | `error_desc` | text | YES |  |
| 11 | `lead_pk` | bigint | YES |  |
| 12 | `location` | character varying(255) | YES |  |
| 13 | `merchant_pk` | bigint | YES |  |
| 14 | `picked_at_time` | timestamp without time zone | YES |  |
| 15 | `priority` | integer | YES |  |
| 16 | `queue_type` | character varying(255) | YES |  |
| 17 | `send_by_time` | timestamp without time zone | YES |  |
| 18 | `sent_time` | timestamp without time zone | YES |  |
| 19 | `status` | character varying(255) | YES |  |
| 20 | `template_name` | character varying(255) | YES |  |
| 21 | `template_version` | bigint | YES |  |
| 22 | `email_body` | text | NO |  |
| 23 | `email_body_type` | character varying(255) | YES |  |
| 24 | `from_email_address` | character varying(255) | YES |  |
| 25 | `has_attachments` | boolean | YES |  |
| 26 | `response` | text | YES |  |
| 27 | `sent_from_server` | character varying(255) | YES |  |
| 28 | `subject` | character varying(255) | NO |  |
| 29 | `to_email_addresses` | text | NO |  |
| 30 | `from_email_name` | character varying(255) | YES |  |
| 31 | `id` | character varying(255) | YES |  |

## uown_esign_document

**Schema:** `public` | **Columns:** 51

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_esign_document_pk_seq'::regclass) |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `web_user_id` | bigint | YES |  |
| 6 | `client_url` | text | YES |  |
| 7 | `api_key_for_esign` | text | YES |  |
| 8 | `account_pk` | bigint | YES |  |
| 9 | `base64document_string` | text | YES |  |
| 10 | `base64signed_document_string` | text | YES |  |
| 11 | `base_urlfor_esign_client` | text | YES |  |
| 12 | `client` | character varying(255) | YES |  |
| 13 | `contract_number` | character varying(255) | YES |  |
| 14 | `created_by` | character varying(255) | YES |  |
| 15 | `customer_pk` | bigint | YES |  |
| 16 | `data_fields` | text | YES |  |
| 17 | `doc_signed_time_stamp` | timestamp without time zone | YES |  |
| 18 | `document_group` | character varying(255) | YES |  |
| 19 | `document_key` | text | YES |  |
| 20 | `document_name` | text | YES |  |
| 21 | `embed_urlsent_for_signing` | text | YES |  |
| 22 | `error_desc` | text | YES |  |
| 23 | `esign_fields` | text | YES |  |
| 24 | `esign_mode` | character varying(255) | YES |  |
| 25 | `expires_in_days` | integer | YES |  |
| 26 | `lead_pk` | bigint | YES |  |
| 27 | `location` | character varying(255) | YES |  |
| 28 | `merchant_name` | text | YES |  |
| 29 | `merchant_pk` | bigint | YES |  |
| 30 | `receiver_email_address` | text | YES |  |
| 31 | `receiver_name` | character varying(255) | YES |  |
| 32 | `redirect_url_declined` | text | YES |  |
| 33 | `redirect_url_signed` | text | YES |  |
| 34 | `send_email` | boolean | YES |  |
| 35 | `sender_email_address` | character varying(255) | YES |  |
| 36 | `sender_name` | character varying(255) | YES |  |
| 37 | `status` | character varying(255) | YES |  |
| 38 | `status_timestamp` | timestamp without time zone | YES |  |
| 39 | `subject` | text | YES |  |
| 40 | `template_name` | character varying(255) | YES |  |
| 41 | `template_version` | bigint | YES |  |
| 42 | `headers` | text | YES |  |
| 43 | `request` | text | YES |  |
| 44 | `response` | text | YES |  |
| 45 | `test_mode` | boolean | YES |  |
| 46 | `mock_response_on_test` | boolean | YES |  |
| 47 | `http_status_code` | integer | YES |  |
| 48 | `http_status_code_desc` | text | YES |  |
| 49 | `ms_to_wait` | bigint | YES |  |
| 50 | `number_of_wait_tries` | integer | YES |  |
| 51 | `check_box_groups` | text | YES |  |

## uown_esign_event_trigger_log

**Schema:** `public` | **Columns:** 17

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `device_info` | text | YES |  |
| 6 | `embedded_url` | text | YES |  |
| 7 | `esign_doc_pk` | bigint | YES |  |
| 8 | `event_name` | text | YES |  |
| 9 | `lead_pk` | bigint | YES |  |
| 10 | `location_name` | character varying(255) | YES |  |
| 11 | `los_contract_pk` | bigint | YES |  |
| 12 | `merchant_name` | character varying(255) | YES |  |
| 13 | `merchant_pk` | bigint | YES |  |
| 14 | `redirect_url` | text | YES |  |
| 15 | `ref_merchant_code` | character varying(255) | YES |  |
| 16 | `charge_fee_success` | boolean | YES |  |
| 17 | `post_message_redirect_url` | text | YES |  |

## uown_failed_achpayments_from_vendor

**Schema:** `public` | **Columns:** 8

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `failed_reason` | text | YES |  |
| 6 | `identification_number` | bigint | YES |  |
| 7 | `is_success` | boolean | YES |  |
| 8 | `payment_json` | text | YES |  |

## uown_fraud_engine_outbound

**Schema:** `public` | **Columns:** 16

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `api` | character varying(255) | YES |  |
| 8 | `call_type` | character varying(255) | YES |  |
| 9 | `header` | text | YES |  |
| 10 | `request` | text | YES |  |
| 11 | `request_object` | text | YES |  |
| 12 | `response` | text | YES |  |
| 13 | `source` | character varying(255) | YES |  |
| 14 | `stack_trace` | text | YES |  |
| 15 | `url` | text | YES |  |
| 16 | `fraud_verification_pk` | bigint | YES |  |

## uown_fraud_verification

**Schema:** `public` | **Columns:** 35

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `applied_rules` | text | YES |  |
| 6 | `country_code` | character varying(255) | YES |  |
| 7 | `email` | character varying(255) | YES |  |
| 8 | `email_score` | numeric | YES |  |
| 9 | `error` | character varying(255) | YES |  |
| 10 | `fraud_score` | numeric | YES |  |
| 11 | `ip` | character varying(255) | YES |  |
| 12 | `ip_score` | numeric | YES |  |
| 13 | `lead_pk` | bigint | YES |  |
| 14 | `phone_number` | character varying(255) | YES |  |
| 15 | `phone_score` | numeric | YES |  |
| 16 | `status` | character varying(255) | YES |  |
| 17 | `success` | boolean | YES |  |
| 18 | `city` | character varying(255) | YES |  |
| 19 | `country` | character varying(255) | YES |  |
| 20 | `date_of_birth` | date | YES |  |
| 21 | `decline_reason` | character varying(255) | YES |  |
| 22 | `device_finger_printing` | boolean | YES |  |
| 23 | `full_name` | character varying(255) | YES |  |
| 24 | `seon_finger_print_text` | text | YES |  |
| 25 | `state` | character varying(255) | YES |  |
| 26 | `street` | character varying(255) | YES |  |
| 27 | `street2` | character varying(255) | YES |  |
| 28 | `zip` | character varying(255) | YES |  |
| 29 | `applied_rules_codes` | text | YES |  |
| 30 | `fraud_engine_status` | character varying(255) | YES |  |
| 31 | `agent` | character varying(255) | YES |  |
| 32 | `web_user_id` | bigint | YES |  |
| 33 | `brand_id` | character varying(255) | YES |  |
| 34 | `raw_response` | text | YES |  |
| 35 | `device_hash` | text | YES |  |

## uown_frequency_mods

**Schema:** `public` | **Columns:** 13

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_frequency_mods_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `account_pk` | bigint | NO |  |
| 8 | `first_due_date` | date | YES |  |
| 9 | `new_frequency` | character varying(255) | YES |  |
| 10 | `new_term_payment` | numeric | YES |  |
| 11 | `old_frequency` | character varying(255) | YES |  |
| 12 | `old_term_payment` | numeric | YES |  |
| 13 | `second_due_date` | date | YES |  |

## uown_funding_bank_account

**Schema:** `public` | **Columns:** 10

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `bank_account_holder_name` | character varying(255) | YES |  |
| 6 | `bank_account_number` | character varying(255) | YES |  |
| 7 | `bank_account_type` | character varying(255) | YES |  |
| 8 | `bank_name` | character varying(255) | YES |  |
| 9 | `bank_routing_number` | character varying(255) | YES |  |
| 10 | `lead_pk` | bigint | YES |  |

## uown_funding_modification

**Schema:** `public` | **Columns:** 10

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `lead_pk` | bigint | YES |  |
| 6 | `new_funding_queue_status` | character varying(255) | YES |  |
| 7 | `new_lead_status` | character varying(255) | YES |  |
| 8 | `old_funding_queue_status` | character varying(255) | YES |  |
| 9 | `old_lead_status` | character varying(255) | YES |  |
| 10 | `username` | character varying(255) | YES |  |

## uown_funding_transaction

**Schema:** `public` | **Columns:** 50

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_funding_transaction_pk_seq'::regclass) |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `amount_to_be_funded` | numeric | YES |  |
| 6 | `customer_name` | character varying(255) | YES |  |
| 7 | `dealer_discount` | numeric | YES |  |
| 8 | `dealer_rebate` | numeric | YES |  |
| 9 | `fees` | numeric | YES |  |
| 10 | `fund_date_time` | timestamp without time zone | YES |  |
| 11 | `funding_request_date_time` | timestamp without time zone | YES |  |
| 12 | `funding_status` | character varying(255) | YES |  |
| 13 | `invoice_amount` | numeric | YES |  |
| 14 | `lead_pk` | bigint | YES |  |
| 15 | `lead_status` | character varying(255) | YES |  |
| 16 | `merchant_name` | character varying(255) | YES |  |
| 17 | `merchant_pk` | bigint | YES |  |
| 18 | `partial_settlement` | boolean | YES |  |
| 19 | `plat_form_fee` | numeric | YES |  |
| 20 | `tax_amount` | numeric | YES |  |
| 21 | `total_contract_amount` | numeric | YES |  |
| 22 | `total_cost` | numeric | YES |  |
| 23 | `total_number_of_items` | integer | YES |  |
| 24 | `total_numberof_items_delivered` | integer | YES |  |
| 25 | `merchant_legal_name` | character varying(255) | YES |  |
| 26 | `merchant_location_name` | character varying(255) | YES |  |
| 27 | `merchant_ref_code` | character varying(255) | YES |  |
| 28 | `customer_email` | character varying(255) | YES |  |
| 29 | `customer_phone` | character varying(255) | YES |  |
| 30 | `agent` | character varying(255) | YES |  |
| 31 | `web_user_id` | bigint | YES |  |
| 32 | `funding_queue_status` | character varying(255) | YES |  |
| 33 | `status` | character varying(255) | YES |  |
| 34 | `total_count` | bigint | YES |  |
| 35 | `invoice_number` | character varying(255) | YES |  |
| 36 | `sales_person` | character varying(255) | YES |  |
| 37 | `account_number` | character varying(255) | YES |  |
| 38 | `routing_number` | character varying(255) | YES |  |
| 39 | `order_id` | character varying(255) | YES |  |
| 40 | `cc_processing_fee` | numeric | YES |  |
| 41 | `invoice_type` | character varying(255) | YES |  |
| 42 | `refund_request_date_time` | timestamp without time zone | YES |  |
| 43 | `funding_exception` | boolean | YES |  |
| 44 | `refunded_date_time` | timestamp without time zone | YES |  |
| 45 | `five_day_funding_exception` | boolean | YES |  |
| 46 | `two_day_funding_exception` | boolean | YES |  |
| 47 | `user_notes` | text | YES |  |
| 48 | `merchandise_amount` | numeric | YES |  |
| 49 | `sales_rep_code` | character varying(255) | YES |  |
| 50 | `created_from` | character varying(255) | YES |  |

## uown_funding_transaction_items

**Schema:** `public` | **Columns:** 2

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `funding_transaction_pk` | bigint | NO |  |
| 2 | `items` | text | YES |  |

## uown_gds_token

**Schema:** `public` | **Columns:** 6

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `access_token` | character varying(2048) | NO |  |
| 6 | `expiration_time` | timestamp with time zone | NO |  |

## uown_gow_sign_template

**Schema:** `public` | **Columns:** 12

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `name` | character varying(255) | NO |  |
| 6 | `template_id` | character varying(255) | NO |  |
| 7 | `variables` | text | NO |  |
| 8 | `sender` | character varying(255) | NO |  |
| 9 | `state` | character varying(255) | NO |  |
| 10 | `footer_template` | text | YES |  |
| 11 | `client_type` | text | YES |  |
| 12 | `term_months` | character varying(255) | YES |  |

## uown_identity_verification_outbound_log

**Schema:** `public` | **Columns:** 16

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `api` | character varying(255) | YES |  |
| 8 | `call_type` | character varying(255) | YES |  |
| 9 | `header` | text | YES |  |
| 10 | `lead_pk` | bigint | YES |  |
| 11 | `request` | text | YES |  |
| 12 | `request_object` | text | YES |  |
| 13 | `response` | text | YES |  |
| 14 | `source` | character varying(255) | YES |  |
| 15 | `stack_trace` | text | YES |  |
| 16 | `url` | text | YES |  |

## uown_import_log

**Schema:** `public` | **Columns:** 18

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_import_log_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `account_pk` | bigint | YES |  |
| 8 | `end_time` | timestamp without time zone | YES |  |
| 9 | `error_count` | integer | YES |  |
| 10 | `error_message` | text | YES |  |
| 11 | `import_pojo` | text | YES |  |
| 12 | `import_source` | character varying(255) | YES |  |
| 13 | `lead_pk` | bigint | YES |  |
| 14 | `ref_account_id` | bigint | YES |  |
| 15 | `ref_app_id` | character varying(255) | YES |  |
| 16 | `start_time` | timestamp without time zone | YES |  |
| 17 | `total_count` | integer | YES |  |
| 18 | `total_time_taken_in_millis` | bigint | YES |  |

## uown_intellicheck

**Schema:** `public` | **Columns:** 23

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `is_intellicheck_completed` | boolean | YES |  |
| 6 | `lead_pk` | bigint | NO |  |
| 7 | `lead_uuid` | character varying(255) | YES |  |
| 8 | `response` | text | YES |  |
| 9 | `response_time` | timestamp without time zone | YES |  |
| 10 | `sent_to_intellicheck` | boolean | YES |  |
| 11 | `token` | character varying(255) | YES |  |
| 12 | `back_image` | text | YES |  |
| 13 | `front_image` | text | YES |  |
| 14 | `id_verify_success` | boolean | YES |  |
| 15 | `ingest_token` | character varying(255) | YES |  |
| 16 | `location` | character varying(255) | YES |  |
| 17 | `result_location` | text | YES |  |
| 18 | `results` | text | YES |  |
| 19 | `success` | boolean | YES |  |
| 20 | `user_token` | character varying(255) | YES |  |
| 21 | `id_expired` | boolean | YES |  |
| 22 | `barcode_data` | text | YES |  |
| 23 | `number_of_tries` | integer | YES |  |

## uown_inventory_category

**Schema:** `public` | **Columns:** 7

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `name` | character varying(255) | YES |  |

## uown_kount

**Schema:** `public` | **Columns:** 19

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `account_pk` | bigint | YES |  |
| 6 | `cc_pk` | bigint | YES |  |
| 7 | `errors` | text | YES |  |
| 8 | `kount_result` | character varying(255) | YES |  |
| 9 | `lead_pk` | bigint | YES |  |
| 10 | `masked_credit_card` | character varying(255) | YES |  |
| 11 | `request_params` | text | YES |  |
| 12 | `response_params` | text | YES |  |
| 13 | `session_id` | character varying(255) | YES |  |
| 14 | `transaction_id` | character varying(255) | YES |  |
| 15 | `warnings` | text | YES |  |
| 16 | `cc_expiration_date` | character varying(255) | YES |  |
| 17 | `first_name` | character varying(255) | YES |  |
| 18 | `last_name` | character varying(255) | YES |  |
| 19 | `omni_score` | real | YES |  |

## uown_kount_token

**Schema:** `public` | **Columns:** 6

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_kount_token_pk_seq'::regclass) |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `access_token` | character varying(2048) | YES |  |
| 6 | `expiration_time` | timestamp without time zone | YES |  |

## uown_lead_approval_terms

**Schema:** `public` | **Columns:** 8

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `lead_pk` | bigint | NO |  |
| 6 | `uw_terms` | character varying(100) | YES |  |
| 7 | `merchant_terms` | character varying(100) | YES |  |
| 8 | `approved_terms` | character varying(100) | YES |  |

## uown_lead_modifications

**Schema:** `public` | **Columns:** 17

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `agent_username` | character varying(255) | YES |  |
| 8 | `lead_pk` | bigint | YES |  |
| 9 | `mod_type` | character varying(255) | YES |  |
| 10 | `new_amount` | numeric | YES |  |
| 11 | `new_status` | character varying(255) | YES |  |
| 12 | `old_amount` | numeric | YES |  |
| 13 | `old_status` | character varying(255) | YES |  |
| 14 | `new_internal_status` | character varying(255) | YES |  |
| 15 | `old_internal_status` | character varying(255) | YES |  |
| 16 | `merchant_location` | character varying(255) | YES |  |
| 17 | `merchant_name` | character varying(255) | YES |  |

## uown_lead_recording

**Schema:** `public` | **Columns:** 6

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `lead_pk` | bigint | YES |  |
| 6 | `uuid` | character varying(255) | YES |  |

## uown_lexis_nexis

**Schema:** `public` | **Columns:** 29

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `channel` | character varying(255) | YES |  |
| 8 | `city` | character varying(255) | YES |  |
| 9 | `codes_and_description` | text | YES |  |
| 10 | `date_of_birth` | date | YES |  |
| 11 | `email` | character varying(255) | YES |  |
| 12 | `error` | text | YES |  |
| 13 | `first_name` | character varying(255) | YES |  |
| 14 | `glb_purpose` | character varying(255) | YES |  |
| 15 | `ip_address` | character varying(255) | YES |  |
| 16 | `last_name` | character varying(255) | YES |  |
| 17 | `lead_pk` | bigint | YES |  |
| 18 | `model_name` | character varying(255) | YES |  |
| 19 | `password` | character varying(255) | YES |  |
| 20 | `phone_number` | character varying(255) | YES |  |
| 21 | `ssn` | character varying(255) | YES |  |
| 22 | `state` | character varying(255) | YES |  |
| 23 | `status` | character varying(255) | YES |  |
| 24 | `street` | character varying(255) | YES |  |
| 25 | `success` | boolean | YES |  |
| 26 | `url` | character varying(255) | YES |  |
| 27 | `username` | character varying(255) | YES |  |
| 28 | `value` | numeric | YES |  |
| 29 | `zip` | character varying(255) | YES |  |

## uown_lexis_nexis_outbound

**Schema:** `public` | **Columns:** 16

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `api` | character varying(255) | YES |  |
| 8 | `call_type` | character varying(255) | YES |  |
| 9 | `fraud_verification_pk` | bigint | YES |  |
| 10 | `header` | text | YES |  |
| 11 | `request` | text | YES |  |
| 12 | `request_object` | text | YES |  |
| 13 | `response` | text | YES |  |
| 14 | `source` | character varying(255) | YES |  |
| 15 | `stack_trace` | text | YES |  |
| 16 | `url` | text | YES |  |

## uown_login_attempt

**Schema:** `public` | **Columns:** 14

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_login_attempt_pk_seq'::regclass) |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `account_found` | boolean | YES |  |
| 6 | `account_pks` | character varying(255) | YES |  |
| 7 | `code` | character varying(255) | YES |  |
| 8 | `device_type` | text | YES |  |
| 9 | `email_phone_input` | character varying(255) | YES |  |
| 10 | `expiration_time` | timestamp without time zone | YES |  |
| 11 | `sent_time` | timestamp without time zone | YES |  |
| 12 | `sms_id` | character varying(255) | YES |  |
| 13 | `given_codes` | character varying(255) | YES |  |
| 14 | `number_of_attempts` | integer | YES |  |

## uown_los_activity_log

**Schema:** `public` | **Columns:** 18

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_los_activity_log_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `account_pk` | bigint | YES |  |
| 8 | `activity_log_pk` | bigint | NO |  |
| 9 | `created_by` | character varying(255) | YES |  |
| 10 | `deleted` | boolean | YES |  |
| 11 | `expiry_date` | date | YES |  |
| 12 | `is_hidden` | boolean | YES |  |
| 13 | `lead_pk` | bigint | YES |  |
| 14 | `log_type` | character varying(255) | YES |  |
| 15 | `notes` | text | YES |  |
| 16 | `priority` | boolean | YES |  |
| 17 | `ref_account_id` | character varying(255) | YES |  |
| 18 | `creation_source` | character varying(255) | YES |  |

## uown_los_address

**Schema:** `public` | **Columns:** 21

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_los_address_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `address_type` | character varying(255) | YES |  |
| 8 | `at_address_from` | character varying(255) | YES |  |
| 9 | `city` | character varying(255) | YES |  |
| 10 | `country` | character varying(255) | YES |  |
| 11 | `do_not_contact` | boolean | YES |  |
| 12 | `duration` | character varying(255) | YES |  |
| 13 | `housing_status` | character varying(255) | YES |  |
| 14 | `state` | character varying(255) | YES |  |
| 15 | `street_address1` | character varying(255) | YES |  |
| 16 | `street_address2` | character varying(255) | YES |  |
| 17 | `zip_code` | character varying(255) | YES |  |
| 18 | `customer_pk` | bigint | YES |  |
| 19 | `lead_pk` | bigint | YES |  |
| 20 | `zip_code9` | character varying(255) | YES |  |
| 21 | `is_autocomplete_verified` | boolean | YES |  |

## uown_los_address_history

**Schema:** `public` | **Columns:** 23

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `rev` | integer | NO |  |
| 3 | `revtype` | smallint | YES |  |
| 4 | `agent` | character varying(255) | YES |  |
| 5 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 6 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 7 | `tenant_id` | bigint | YES |  |
| 8 | `web_user_id` | bigint | YES |  |
| 9 | `address_type` | character varying(255) | YES |  |
| 10 | `at_address_from` | character varying(255) | YES |  |
| 11 | `city` | character varying(255) | YES |  |
| 12 | `country` | character varying(255) | YES |  |
| 13 | `do_not_contact` | boolean | YES |  |
| 14 | `duration` | character varying(255) | YES |  |
| 15 | `housing_status` | character varying(255) | YES |  |
| 16 | `state` | character varying(255) | YES |  |
| 17 | `street_address1` | character varying(255) | YES |  |
| 18 | `street_address2` | character varying(255) | YES |  |
| 19 | `zip_code` | character varying(255) | YES |  |
| 20 | `customer_pk` | bigint | YES |  |
| 21 | `lead_pk` | bigint | YES |  |
| 22 | `zip_code9` | character varying(255) | YES |  |
| 23 | `is_autocomplete_verified` | boolean | YES |  |

## uown_los_alert

**Schema:** `public` | **Columns:** 10

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_los_alert_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `account_pk` | bigint | YES |  |
| 8 | `alert_message` | text | YES |  |
| 9 | `is_active` | boolean | YES |  |
| 10 | `lead_pk` | bigint | YES |  |

## uown_los_bank_account

**Schema:** `public` | **Columns:** 19

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_los_bank_account_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `account_number` | character varying(255) | YES |  |
| 8 | `account_opened_date` | date | YES |  |
| 9 | `auto_pay` | boolean | YES |  |
| 10 | `bank_account_duration` | character varying(255) | YES |  |
| 11 | `bank_account_type` | character varying(255) | YES |  |
| 12 | `bank_name` | character varying(500) | YES |  |
| 13 | `name` | character varying(500) | YES |  |
| 14 | `routing_number` | character varying(255) | YES |  |
| 15 | `customer_pk` | bigint | YES |  |
| 16 | `lead_pk` | bigint | YES |  |
| 17 | `is_deleted` | boolean | YES |  |
| 18 | `comment` | text | YES |  |
| 19 | `source` | character varying(255) | YES |  |

## uown_los_bank_account_history

**Schema:** `public` | **Columns:** 21

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `rev` | integer | NO |  |
| 3 | `revtype` | smallint | YES |  |
| 4 | `agent` | character varying(255) | YES |  |
| 5 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 6 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 7 | `tenant_id` | bigint | YES |  |
| 8 | `web_user_id` | bigint | YES |  |
| 9 | `account_number` | character varying(255) | YES |  |
| 10 | `account_opened_date` | date | YES |  |
| 11 | `auto_pay` | boolean | YES |  |
| 12 | `bank_account_duration` | character varying(255) | YES |  |
| 13 | `bank_account_type` | character varying(255) | YES |  |
| 14 | `bank_name` | character varying(500) | YES |  |
| 15 | `name` | character varying(500) | YES |  |
| 16 | `routing_number` | character varying(255) | YES |  |
| 17 | `customer_pk` | bigint | YES |  |
| 18 | `lead_pk` | bigint | YES |  |
| 19 | `is_deleted` | boolean | YES |  |
| 20 | `comment` | text | YES |  |
| 21 | `source` | character varying(255) | YES |  |

## uown_los_black_list

**Schema:** `public` | **Columns:** 18

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `bank_account_number` | character varying(255) | YES |  |
| 8 | `bank_routing_number` | character varying(255) | YES |  |
| 9 | `email_address` | character varying(255) | YES |  |
| 10 | `expiration_date` | date | YES |  |
| 11 | `first_name` | character varying(255) | YES |  |
| 12 | `last_name` | character varying(255) | YES |  |
| 13 | `phone_number` | character varying(255) | YES |  |
| 14 | `ssn` | character varying(255) | YES |  |
| 15 | `street_address1` | character varying(255) | YES |  |
| 16 | `zip_code` | character varying(255) | YES |  |
| 17 | `lead_pk` | bigint | YES |  |
| 18 | `cc_bin` | character varying(255) | YES |  |

## uown_los_black_list_history

**Schema:** `public` | **Columns:** 20

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `rev` | integer | NO |  |
| 3 | `revtype` | smallint | YES |  |
| 4 | `agent` | character varying(255) | YES |  |
| 5 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 6 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 7 | `tenant_id` | bigint | YES |  |
| 8 | `web_user_id` | bigint | YES |  |
| 9 | `bank_account_number` | character varying(255) | YES |  |
| 10 | `bank_routing_number` | character varying(255) | YES |  |
| 11 | `email_address` | character varying(255) | YES |  |
| 12 | `expiration_date` | date | YES |  |
| 13 | `first_name` | character varying(255) | YES |  |
| 14 | `last_name` | character varying(255) | YES |  |
| 15 | `phone_number` | character varying(255) | YES |  |
| 16 | `ssn` | character varying(255) | YES |  |
| 17 | `street_address1` | character varying(255) | YES |  |
| 18 | `zip_code` | character varying(255) | YES |  |
| 19 | `lead_pk` | bigint | YES |  |
| 20 | `cc_bin` | character varying(255) | YES |  |

## uown_los_contract

**Schema:** `public` | **Columns:** 24

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_los_contract_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `contract_number` | character varying(255) | YES |  |
| 8 | `contract_status` | character varying(255) | YES |  |
| 9 | `contract_type` | character varying(255) | YES |  |
| 10 | `esign_document_pk` | bigint | YES |  |
| 11 | `esign_mode` | character varying(255) | YES |  |
| 12 | `expiry_date` | date | YES |  |
| 13 | `sent_time` | timestamp without time zone | YES |  |
| 14 | `sent_to_email_addresses` | character varying(255) | YES |  |
| 15 | `signed_time` | timestamp without time zone | YES |  |
| 16 | `url` | character varying(255) | YES |  |
| 17 | `lead_pk` | bigint | YES |  |
| 18 | `invoice_amount` | numeric | YES |  |
| 19 | `attempted_post_back` | boolean | YES |  |
| 20 | `post_back_error` | text | YES |  |
| 21 | `invoice_record` | text | YES |  |
| 22 | `items_record` | text | YES |  |
| 23 | `embedded_signing_origin` | character varying(255) | YES |  |
| 24 | `esign_client` | character varying(32) | YES |  |

## uown_los_contract_history

**Schema:** `public` | **Columns:** 26

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `rev` | integer | NO |  |
| 3 | `revtype` | smallint | YES |  |
| 4 | `agent` | character varying(255) | YES |  |
| 5 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 6 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 7 | `tenant_id` | bigint | YES |  |
| 8 | `web_user_id` | bigint | YES |  |
| 9 | `contract_number` | character varying(255) | YES |  |
| 10 | `contract_status` | character varying(255) | YES |  |
| 11 | `contract_type` | character varying(255) | YES |  |
| 12 | `esign_document_pk` | bigint | YES |  |
| 13 | `esign_mode` | character varying(255) | YES |  |
| 14 | `expiry_date` | date | YES |  |
| 15 | `sent_time` | timestamp without time zone | YES |  |
| 16 | `sent_to_email_addresses` | character varying(255) | YES |  |
| 17 | `signed_time` | timestamp without time zone | YES |  |
| 18 | `url` | character varying(255) | YES |  |
| 19 | `lead_pk` | bigint | YES |  |
| 20 | `invoice_amount` | numeric | YES |  |
| 21 | `attempted_post_back` | boolean | YES |  |
| 22 | `post_back_error` | text | YES |  |
| 23 | `invoice_record` | text | YES |  |
| 24 | `items_record` | text | YES |  |
| 25 | `embedded_signing_origin` | character varying(255) | YES |  |
| 26 | `esign_client` | character varying(32) | YES |  |

## uown_los_credit_card

**Schema:** `public` | **Columns:** 39

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_los_credit_card_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `account_pk` | bigint | YES |  |
| 8 | `auto_pay` | boolean | YES |  |
| 9 | `address_type` | character varying(255) | YES |  |
| 10 | `at_address_from` | character varying(255) | YES |  |
| 11 | `cc_city` | character varying(255) | YES |  |
| 12 | `country` | character varying(255) | YES |  |
| 13 | `do_not_contact` | boolean | YES |  |
| 14 | `duration` | character varying(255) | YES |  |
| 15 | `housing_status` | character varying(255) | YES |  |
| 16 | `cc_state` | character varying(255) | YES |  |
| 17 | `cc_address1` | character varying(255) | YES |  |
| 18 | `cc_address2` | character varying(255) | YES |  |
| 19 | `cc_zip` | character varying(255) | YES |  |
| 20 | `cc_exp` | character varying(255) | YES |  |
| 21 | `cc_first_name` | character varying(255) | YES |  |
| 22 | `cc_last_name` | character varying(255) | YES |  |
| 23 | `cc_number` | character varying(255) | YES |  |
| 24 | `cc_token` | character varying(255) | YES |  |
| 25 | `cc_type` | character varying(255) | YES |  |
| 26 | `lead_pk` | bigint | YES |  |
| 27 | `is_deleted` | boolean | YES |  |
| 28 | `error_msg` | character varying(255) | YES |  |
| 29 | `cc_vendor` | character varying(255) | YES |  |
| 30 | `kount_session_id` | character varying(255) | YES |  |
| 31 | `pre_auth_status` | character varying(255) | YES |  |
| 32 | `kount_pk` | bigint | YES |  |
| 33 | `cc_hash` | integer | YES |  |
| 34 | `cc_last_four_digit` | character(4) | YES |  |
| 35 | `cc_connector_token` | character varying(255) | YES |  |
| 36 | `invalid_card_reason` | character varying(255) | YES |  |
| 37 | `is_valid_card` | boolean | YES |  |
| 38 | `cc_zip9` | character varying(255) | YES |  |
| 39 | `is_autocomplete_verified` | boolean | YES |  |

## uown_los_credit_card_history

**Schema:** `public` | **Columns:** 41

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `rev` | integer | NO |  |
| 3 | `revtype` | smallint | YES |  |
| 4 | `agent` | character varying(255) | YES |  |
| 5 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 6 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 7 | `tenant_id` | bigint | YES |  |
| 8 | `web_user_id` | bigint | YES |  |
| 9 | `account_pk` | bigint | YES |  |
| 10 | `auto_pay` | boolean | YES |  |
| 11 | `address_type` | character varying(255) | YES |  |
| 12 | `at_address_from` | character varying(255) | YES |  |
| 13 | `cc_city` | character varying(255) | YES |  |
| 14 | `country` | character varying(255) | YES |  |
| 15 | `do_not_contact` | boolean | YES |  |
| 16 | `duration` | character varying(255) | YES |  |
| 17 | `housing_status` | character varying(255) | YES |  |
| 18 | `cc_state` | character varying(255) | YES |  |
| 19 | `cc_address1` | character varying(255) | YES |  |
| 20 | `cc_address2` | character varying(255) | YES |  |
| 21 | `cc_zip` | character varying(255) | YES |  |
| 22 | `cc_exp` | character varying(255) | YES |  |
| 23 | `cc_first_name` | character varying(255) | YES |  |
| 24 | `cc_last_name` | character varying(255) | YES |  |
| 25 | `cc_number` | character varying(255) | YES |  |
| 26 | `cc_token` | character varying(255) | YES |  |
| 27 | `cc_type` | character varying(255) | YES |  |
| 28 | `lead_pk` | bigint | YES |  |
| 29 | `is_deleted` | boolean | YES |  |
| 30 | `error_msg` | character varying(255) | YES |  |
| 31 | `cc_vendor` | character varying(255) | YES |  |
| 32 | `kount_session_id` | character varying(255) | YES |  |
| 33 | `pre_auth_status` | character varying(255) | YES |  |
| 34 | `kount_pk` | bigint | YES |  |
| 35 | `cc_hash` | integer | YES |  |
| 36 | `cc_connector_token` | character varying(255) | YES |  |
| 37 | `invalid_card_reason` | character varying(255) | YES |  |
| 38 | `is_valid_card` | boolean | YES |  |
| 39 | `zip_code9` | character varying(255) | YES |  |
| 40 | `cc_zip9` | character varying(255) | YES |  |
| 41 | `is_autocomplete_verified` | boolean | YES |  |

## uown_los_credit_card_transaction

**Schema:** `public` | **Columns:** 79

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_los_credit_card_transaction_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `amount` | numeric | YES |  |
| 8 | `auth_code` | character varying(255) | YES |  |
| 9 | `cc_action` | character varying(255) | YES |  |
| 10 | `account_pk` | bigint | YES |  |
| 11 | `auto_pay` | boolean | YES |  |
| 12 | `address_type` | character varying(255) | YES |  |
| 13 | `at_address_from` | character varying(255) | YES |  |
| 14 | `cc_city` | character varying(255) | YES |  |
| 15 | `country` | character varying(255) | YES |  |
| 16 | `do_not_contact` | boolean | YES |  |
| 17 | `duration` | character varying(255) | YES |  |
| 18 | `housing_status` | character varying(255) | YES |  |
| 19 | `cc_state` | character varying(255) | YES |  |
| 20 | `cc_address1` | character varying(255) | YES |  |
| 21 | `cc_address2` | character varying(255) | YES |  |
| 22 | `cc_zip` | character varying(255) | YES |  |
| 23 | `cc_exp` | character varying(255) | YES |  |
| 24 | `cc_first_name` | character varying(255) | YES |  |
| 25 | `cc_last_name` | character varying(255) | YES |  |
| 26 | `cc_number` | character varying(255) | YES |  |
| 27 | `cc_token` | character varying(255) | YES |  |
| 28 | `cc_type` | character varying(255) | YES |  |
| 29 | `lead_pk` | bigint | YES |  |
| 30 | `cc_transaction_type` | character varying(255) | YES |  |
| 31 | `comment` | text | YES |  |
| 32 | `completed_time` | timestamp without time zone | YES |  |
| 33 | `error` | text | YES |  |
| 34 | `error_code` | character varying(255) | YES |  |
| 35 | `gateway_request` | text | YES |  |
| 36 | `gateway_response` | text | YES |  |
| 37 | `gateway_transaction_id` | character varying(255) | YES |  |
| 38 | `ip_address` | character varying(255) | YES |  |
| 39 | `is_nsf` | boolean | YES |  |
| 40 | `payment_pk` | bigint | YES |  |
| 41 | `posting_date` | date | YES |  |
| 42 | `save_card_to_file` | boolean | YES |  |
| 43 | `save_on_success_only` | boolean | YES |  |
| 44 | `status` | character varying(255) | YES |  |
| 45 | `use_card_on_file` | boolean | YES |  |
| 46 | `vendor` | character varying(255) | YES |  |
| 47 | `agent_username` | character varying(255) | YES |  |
| 48 | `allocation_strategy` | character varying(255) | YES |  |
| 49 | `is_custom_refund` | boolean | YES |  |
| 50 | `is_deleted` | boolean | YES |  |
| 51 | `number_of_tries` | integer | YES |  |
| 52 | `original_ccpk` | bigint | YES |  |
| 53 | `rerun_nsf_status` | character varying(255) | YES |  |
| 54 | `rerun_status` | character varying(255) | YES |  |
| 55 | `error_msg` | character varying(255) | YES |  |
| 56 | `remaining_refundable_amount` | numeric | YES |  |
| 57 | `error_stacktrace` | text | YES |  |
| 58 | `id` | bigint | YES |  |
| 59 | `cc_vendor` | character varying(255) | YES |  |
| 60 | `kount_session_id` | character varying(255) | YES |  |
| 61 | `pre_auth_status` | character varying(255) | YES |  |
| 62 | `charged_fee_amount` | numeric | YES |  |
| 63 | `kount_pk` | bigint | YES |  |
| 64 | `charge_type` | character varying(255) | YES |  |
| 65 | `gateway_auth_token` | character varying(255) | YES |  |
| 66 | `cc_hash` | integer | YES |  |
| 67 | `cc_connector_token` | character varying(255) | YES |  |
| 68 | `invalid_card_reason` | character varying(255) | YES |  |
| 69 | `is_valid_card` | boolean | YES |  |
| 70 | `idempotency_key` | character varying(255) | YES |  |
| 71 | `charge_fee` | boolean | YES |  |
| 72 | `cc_peek` | boolean | YES |  |
| 73 | `original_amount` | numeric | YES |  |
| 74 | `same_day_transaction` | boolean | YES |  |
| 75 | `cc_zip9` | character varying(255) | YES |  |
| 76 | `is_autocomplete_verified` | boolean | YES |  |
| 77 | `is_settlement_payment` | boolean | YES |  |
| 78 | `payment_arrangement_pk` | bigint | YES |  |
| 79 | `cc_vendor_transaction_id` | character varying(128) | YES |  |

## uown_los_customer

**Schema:** `public` | **Columns:** 28

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_los_customer_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `company_name` | character varying(255) | YES |  |
| 8 | `customer_type` | character varying(255) | YES |  |
| 9 | `date_of_birth` | date | YES |  |
| 10 | `driver_license_number` | character varying(255) | YES |  |
| 11 | `driver_license_state` | character varying(255) | YES |  |
| 12 | `first_name` | character varying(255) | YES |  |
| 13 | `language` | character varying(255) | YES |  |
| 14 | `last_contacted_phone` | character varying(255) | YES |  |
| 15 | `last_name` | character varying(255) | YES |  |
| 16 | `last_phone_contact_timestamp` | timestamp without time zone | YES |  |
| 17 | `license_expiration_date` | date | YES |  |
| 18 | `marital_status` | character varying(255) | YES |  |
| 19 | `ref_customer_code` | character varying(255) | YES |  |
| 20 | `ssn` | character varying(255) | YES |  |
| 21 | `lead_pk` | bigint | YES |  |
| 22 | `suffix` | character varying(255) | YES |  |
| 23 | `last_successful_login` | timestamp without time zone | YES |  |
| 24 | `cell_phone_number` | character varying(255) | YES |  |
| 25 | `email_address` | character varying(255) | YES |  |
| 26 | `home_phone_number` | character varying(255) | YES |  |
| 27 | `middle_name` | character varying(255) | YES |  |
| 28 | `preferred_communication_channel` | character varying(255) | YES |  |

## uown_los_customer_history

**Schema:** `public` | **Columns:** 30

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `rev` | integer | NO |  |
| 3 | `revtype` | smallint | YES |  |
| 4 | `agent` | character varying(255) | YES |  |
| 5 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 6 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 7 | `tenant_id` | bigint | YES |  |
| 8 | `web_user_id` | bigint | YES |  |
| 9 | `company_name` | character varying(255) | YES |  |
| 10 | `customer_type` | character varying(255) | YES |  |
| 11 | `date_of_birth` | date | YES |  |
| 12 | `driver_license_number` | character varying(255) | YES |  |
| 13 | `driver_license_state` | character varying(255) | YES |  |
| 14 | `first_name` | character varying(255) | YES |  |
| 15 | `language` | character varying(255) | YES |  |
| 16 | `last_contacted_phone` | character varying(255) | YES |  |
| 17 | `last_name` | character varying(255) | YES |  |
| 18 | `last_phone_contact_timestamp` | timestamp without time zone | YES |  |
| 19 | `license_expiration_date` | date | YES |  |
| 20 | `marital_status` | character varying(255) | YES |  |
| 21 | `ref_customer_code` | character varying(255) | YES |  |
| 22 | `ssn` | character varying(255) | YES |  |
| 23 | `lead_pk` | bigint | YES |  |
| 24 | `suffix` | character varying(255) | YES |  |
| 25 | `last_successful_login` | timestamp without time zone | YES |  |
| 26 | `cell_phone_number` | character varying(255) | YES |  |
| 27 | `email_address` | character varying(255) | YES |  |
| 28 | `home_phone_number` | character varying(255) | YES |  |
| 29 | `middle_name` | character varying(255) | YES |  |
| 30 | `preferred_communication_channel` | character varying(255) | YES |  |

## uown_los_email

**Schema:** `public` | **Columns:** 12

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_los_email_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `do_not_email` | boolean | YES |  |
| 8 | `email_address` | character varying(255) | YES |  |
| 9 | `email_type` | character varying(255) | YES |  |
| 10 | `reason_for_dnc` | character varying(255) | YES |  |
| 11 | `customer_pk` | bigint | YES |  |
| 12 | `lead_pk` | bigint | YES |  |

## uown_los_email_history

**Schema:** `public` | **Columns:** 14

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `rev` | integer | NO |  |
| 3 | `revtype` | smallint | YES |  |
| 4 | `agent` | character varying(255) | YES |  |
| 5 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 6 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 7 | `tenant_id` | bigint | YES |  |
| 8 | `web_user_id` | bigint | YES |  |
| 9 | `do_not_email` | boolean | YES |  |
| 10 | `email_address` | character varying(255) | YES |  |
| 11 | `email_type` | character varying(255) | YES |  |
| 12 | `reason_for_dnc` | character varying(255) | YES |  |
| 13 | `customer_pk` | bigint | YES |  |
| 14 | `lead_pk` | bigint | YES |  |

## uown_los_employment

**Schema:** `public` | **Columns:** 27

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_los_employment_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `annual_income` | numeric | YES |  |
| 8 | `duration` | character varying(255) | YES |  |
| 9 | `employer` | character varying(255) | YES |  |
| 10 | `employment_status` | character varying(255) | YES |  |
| 11 | `employment_type` | character varying(255) | YES |  |
| 12 | `hire_date` | date | YES |  |
| 13 | `income_per_pay_period` | numeric | YES |  |
| 14 | `job_title` | character varying(255) | YES |  |
| 15 | `last_pay_date` | date | YES |  |
| 16 | `monthly_income` | numeric | YES |  |
| 17 | `next_pay_date` | date | YES |  |
| 18 | `pay_frequency` | character varying(255) | YES |  |
| 19 | `phone_number` | character varying(255) | YES |  |
| 20 | `customer_pk` | bigint | YES |  |
| 21 | `lead_pk` | bigint | YES |  |
| 22 | `months_at_employer` | integer | YES |  |
| 23 | `employer_city` | character varying(255) | YES |  |
| 24 | `employer_country` | character varying(255) | YES |  |
| 25 | `employer_postal_code` | character varying(255) | YES |  |
| 26 | `employer_state` | character varying(255) | YES |  |
| 27 | `employer_street_address` | character varying(255) | YES |  |

## uown_los_employment_history

**Schema:** `public` | **Columns:** 29

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `rev` | integer | NO |  |
| 3 | `revtype` | smallint | YES |  |
| 4 | `agent` | character varying(255) | YES |  |
| 5 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 6 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 7 | `tenant_id` | bigint | YES |  |
| 8 | `web_user_id` | bigint | YES |  |
| 9 | `annual_income` | numeric | YES |  |
| 10 | `duration` | character varying(255) | YES |  |
| 11 | `employer` | character varying(255) | YES |  |
| 12 | `employment_status` | character varying(255) | YES |  |
| 13 | `employment_type` | character varying(255) | YES |  |
| 14 | `hire_date` | date | YES |  |
| 15 | `income_per_pay_period` | numeric | YES |  |
| 16 | `job_title` | character varying(255) | YES |  |
| 17 | `last_pay_date` | date | YES |  |
| 18 | `monthly_income` | numeric | YES |  |
| 19 | `next_pay_date` | date | YES |  |
| 20 | `pay_frequency` | character varying(255) | YES |  |
| 21 | `phone_number` | character varying(255) | YES |  |
| 22 | `customer_pk` | bigint | YES |  |
| 23 | `lead_pk` | bigint | YES |  |
| 24 | `months_at_employer` | integer | YES |  |
| 25 | `employer_city` | character varying(255) | YES |  |
| 26 | `employer_country` | character varying(255) | YES |  |
| 27 | `employer_postal_code` | character varying(255) | YES |  |
| 28 | `employer_state` | character varying(255) | YES |  |
| 29 | `employer_street_address` | character varying(255) | YES |  |

## uown_los_inbound_api_log

**Schema:** `public` | **Columns:** 18

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_los_inbound_api_log_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `api` | character varying(255) | YES |  |
| 8 | `call_type` | character varying(255) | YES |  |
| 9 | `header` | text | YES |  |
| 10 | `request` | text | YES |  |
| 11 | `request_object` | text | YES |  |
| 12 | `response` | text | YES |  |
| 13 | `return_uuid` | character varying(255) | YES |  |
| 14 | `source` | character varying(255) | YES |  |
| 15 | `source_uuid` | character varying(255) | YES |  |
| 16 | `stack_trace` | text | YES |  |
| 17 | `url` | text | YES |  |
| 18 | `uuid` | character varying(255) | YES |  |

## uown_los_inbound_internal_log

**Schema:** `public` | **Columns:** 18

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `api` | character varying(255) | YES |  |
| 6 | `call_type` | character varying(255) | YES |  |
| 7 | `header` | text | YES |  |
| 8 | `request` | text | YES |  |
| 9 | `request_object` | text | YES |  |
| 10 | `response` | text | YES |  |
| 11 | `return_uuid` | character varying(255) | YES |  |
| 12 | `source` | character varying(255) | YES |  |
| 13 | `source_uuid` | character varying(255) | YES |  |
| 14 | `stack_trace` | text | YES |  |
| 15 | `url` | text | YES |  |
| 16 | `uuid` | character varying(255) | YES |  |
| 17 | `event_triggered` | character varying(255) | YES |  |
| 18 | `lead_pk` | bigint | YES |  |

## uown_los_invoice

**Schema:** `public` | **Columns:** 29

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_los_invoice_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `category` | character varying(255) | YES |  |
| 8 | `delivery_fee` | numeric | YES |  |
| 9 | `deposit_amount` | numeric | YES |  |
| 10 | `description` | text | YES |  |
| 11 | `discount_amount` | numeric | YES |  |
| 12 | `installation_fee` | numeric | YES |  |
| 13 | `invoice_status` | character varying(255) | YES |  |
| 14 | `last_delivery_date` | date | YES |  |
| 15 | `merchandise_amount` | numeric | YES |  |
| 16 | `merchant_invoice_number` | text | YES |  |
| 17 | `merchant_pk` | bigint | NO |  |
| 18 | `merchant_protection_plan` | numeric | YES |  |
| 19 | `miscellaneous_fee` | numeric | YES |  |
| 20 | `shipping_same_as_consumer` | boolean | YES |  |
| 21 | `tax_amount` | numeric | YES |  |
| 22 | `total_invoice_amount` | numeric | YES |  |
| 23 | `total_number_of_items` | integer | YES |  |
| 24 | `lead_pk` | bigint | YES |  |
| 25 | `invoice_number` | text | YES |  |
| 26 | `sales_person` | character varying(255) | YES |  |
| 27 | `order_id` | character varying(255) | YES |  |
| 28 | `purchase_total` | numeric | YES |  |
| 29 | `external_reference_id` | character varying(255) | YES |  |

## uown_los_invoice_history

**Schema:** `public` | **Columns:** 31

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `rev` | integer | NO |  |
| 3 | `revtype` | smallint | YES |  |
| 4 | `agent` | character varying(255) | YES |  |
| 5 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 6 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 7 | `tenant_id` | bigint | YES |  |
| 8 | `web_user_id` | bigint | YES |  |
| 9 | `category` | character varying(255) | YES |  |
| 10 | `delivery_fee` | numeric | YES |  |
| 11 | `deposit_amount` | numeric | YES |  |
| 12 | `description` | text | YES |  |
| 13 | `discount_amount` | numeric | YES |  |
| 14 | `installation_fee` | numeric | YES |  |
| 15 | `invoice_status` | character varying(255) | YES |  |
| 16 | `last_delivery_date` | date | YES |  |
| 17 | `merchandise_amount` | numeric | YES |  |
| 18 | `merchant_invoice_number` | text | YES |  |
| 19 | `merchant_pk` | bigint | YES |  |
| 20 | `merchant_protection_plan` | numeric | YES |  |
| 21 | `miscellaneous_fee` | numeric | YES |  |
| 22 | `shipping_same_as_consumer` | boolean | YES |  |
| 23 | `tax_amount` | numeric | YES |  |
| 24 | `total_invoice_amount` | numeric | YES |  |
| 25 | `total_number_of_items` | integer | YES |  |
| 26 | `lead_pk` | bigint | YES |  |
| 27 | `invoice_number` | text | YES |  |
| 28 | `sales_person` | character varying(255) | YES |  |
| 29 | `order_id` | character varying(255) | YES |  |
| 30 | `purchase_total` | numeric | YES |  |
| 31 | `external_reference_id` | character varying(255) | YES |  |

## uown_los_item

**Schema:** `public` | **Columns:** 30

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_los_item_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `account_pk` | bigint | NO |  |
| 8 | `base_price_per_item` | numeric | YES |  |
| 9 | `category` | character varying(255) | YES |  |
| 10 | `delivery_type` | character varying(255) | YES |  |
| 11 | `invoice_pk` | bigint | NO |  |
| 12 | `item_code` | character varying(255) | YES |  |
| 13 | `item_delivery_date` | date | YES |  |
| 14 | `item_delivery_fee` | numeric | YES |  |
| 15 | `item_description` | text | YES |  |
| 16 | `item_image_url` | character varying(255) | YES |  |
| 17 | `items_delivery_fee` | numeric | YES |  |
| 18 | `lead_pk` | bigint | NO |  |
| 19 | `line_number` | character varying(255) | YES |  |
| 20 | `merchant_pk` | bigint | NO |  |
| 21 | `number_of_items` | integer | YES |  |
| 22 | `number_of_items_delivered` | integer | YES |  |
| 23 | `serial_number` | character varying(255) | YES |  |
| 24 | `status` | character varying(255) | YES |  |
| 25 | `tax_per_item` | numeric | YES |  |
| 26 | `total_price_for_items` | numeric | YES |  |
| 27 | `total_price_per_item` | numeric | YES |  |
| 28 | `invoice_type` | character varying(255) | YES |  |
| 29 | `item_id` | character varying(255) | YES |  |
| 30 | `lock_status` | character varying(255) | YES |  |

## uown_los_item_history

**Schema:** `public` | **Columns:** 32

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `rev` | integer | NO |  |
| 3 | `revtype` | smallint | YES |  |
| 4 | `invoice_pk` | bigint | YES |  |
| 5 | `agent` | character varying(255) | YES |  |
| 6 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 7 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 8 | `tenant_id` | bigint | YES |  |
| 9 | `web_user_id` | bigint | YES |  |
| 10 | `account_pk` | bigint | YES |  |
| 11 | `base_price_per_item` | numeric | YES |  |
| 12 | `category` | character varying(255) | YES |  |
| 13 | `delivery_type` | character varying(255) | YES |  |
| 14 | `item_code` | character varying(255) | YES |  |
| 15 | `item_delivery_date` | date | YES |  |
| 16 | `item_delivery_fee` | numeric | YES |  |
| 17 | `item_description` | text | YES |  |
| 18 | `item_image_url` | character varying(255) | YES |  |
| 19 | `items_delivery_fee` | numeric | YES |  |
| 20 | `lead_pk` | bigint | YES |  |
| 21 | `line_number` | character varying(255) | YES |  |
| 22 | `merchant_pk` | bigint | YES |  |
| 23 | `number_of_items` | integer | YES |  |
| 24 | `number_of_items_delivered` | integer | YES |  |
| 25 | `serial_number` | character varying(255) | YES |  |
| 26 | `status` | character varying(255) | YES |  |
| 27 | `tax_per_item` | numeric | YES |  |
| 28 | `total_price_for_items` | numeric | YES |  |
| 29 | `total_price_per_item` | numeric | YES |  |
| 30 | `invoice_type` | character varying(255) | YES |  |
| 31 | `item_id` | character varying(255) | YES |  |
| 32 | `lock_status` | character varying(255) | YES |  |

## uown_los_lead

**Schema:** `public` | **Columns:** 79

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_los_lead_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `account_pk` | bigint | YES |  |
| 8 | `ach_auto_pay` | boolean | YES |  |
| 9 | `cc_auto_pay` | boolean | YES |  |
| 10 | `company` | character varying(255) | YES |  |
| 11 | `current_or_future_bankruptcy` | boolean | YES |  |
| 12 | `customer_state` | character varying(255) | YES |  |
| 13 | `expiration_date` | date | YES |  |
| 14 | `fund_date_time` | timestamp without time zone | YES |  |
| 15 | `fund_request_date_time` | timestamp without time zone | YES |  |
| 16 | `funding_status` | character varying(255) | YES |  |
| 17 | `id` | character varying(255) | YES |  |
| 18 | `import_date_time` | timestamp without time zone | YES |  |
| 19 | `ip_address` | character varying(255) | YES |  |
| 20 | `lead_status` | character varying(255) | YES |  |
| 21 | `merchant_pk` | bigint | YES |  |
| 22 | `merchant_program_pk` | bigint | YES |  |
| 23 | `merchant_redirect_url` | character varying(255) | YES |  |
| 24 | `notes` | text | YES |  |
| 25 | `ok_to_email_approval` | boolean | YES |  |
| 26 | `ok_to_text_approval` | boolean | YES |  |
| 27 | `past_bankruptcy` | boolean | YES |  |
| 28 | `prepaid_card_cvv` | character varying(255) | YES |  |
| 29 | `prepaid_card_expiry` | character varying(255) | YES |  |
| 30 | `prepaid_card_number` | character varying(255) | YES |  |
| 31 | `product_type` | character varying(255) | YES |  |
| 32 | `ref_app_id` | character varying(300) | YES |  |
| 33 | `ref_rto_account_number` | bigint | YES |  |
| 34 | `ref_rto_contract_id` | character varying(300) | YES |  |
| 35 | `requested_loan_amount` | numeric | YES |  |
| 36 | `rerun_underwriting` | boolean | YES |  |
| 37 | `sent_to_servicing` | boolean | YES |  |
| 38 | `ssn_already_exists` | boolean | YES |  |
| 39 | `uuid` | character varying(255) | YES |  |
| 40 | `welcome_call_timestamp` | timestamp without time zone | YES |  |
| 41 | `iovation_fingerprint_text` | text | YES |  |
| 42 | `storis_customer_code` | character varying(255) | YES |  |
| 43 | `finalize_application_sms_token` | character varying(255) | YES |  |
| 44 | `send_application_by_user` | character varying(255) | YES |  |
| 45 | `send_application_sms_token` | character varying(255) | YES |  |
| 46 | `send_application_to_email` | character varying(255) | YES |  |
| 47 | `send_application_to_phone` | character varying(255) | YES |  |
| 48 | `ref_lead_pk` | bigint | YES |  |
| 49 | `refund_amount` | numeric | YES |  |
| 50 | `finalize_application_sent_time` | timestamp without time zone | YES |  |
| 51 | `browser_type` | character varying(255) | YES |  |
| 52 | `device_type` | character varying(255) | YES |  |
| 53 | `operating_system` | character varying(255) | YES |  |
| 54 | `show_alerts` | boolean | YES |  |
| 55 | `tax_for_zip_pk` | bigint | YES |  |
| 56 | `fraud_verification_pk` | bigint | YES |  |
| 57 | `seon_fingerprint_text` | text | YES |  |
| 58 | `address_verification_pk` | bigint | YES |  |
| 59 | `max_approval_amount` | numeric | YES |  |
| 60 | `equal_or_above_threshold` | boolean | YES |  |
| 61 | `is_eligible_for_reapproval` | boolean | YES |  |
| 62 | `lending_category_type` | character varying(255) | YES |  |
| 63 | `auto_pay_types` | character varying(255) | YES |  |
| 64 | `internal_status` | character varying(255) | YES |  |
| 65 | `external_reference_id` | character varying(255) | YES |  |
| 66 | `is_score_available` | boolean | YES |  |
| 67 | `added_second_lease` | boolean | YES |  |
| 68 | `neustar_pk` | bigint | YES |  |
| 69 | `sentilink_pk` | bigint | YES |  |
| 70 | `source` | character varying(255) | YES |  |
| 71 | `traffic` | character varying(255) | YES |  |
| 72 | `category` | character varying(255) | YES |  |
| 73 | `lexis_nexis_pk` | bigint | YES |  |
| 74 | `created_from` | character varying(255) | YES |  |
| 75 | `cc_peek_consent` | boolean | YES |  |
| 76 | `consent_date` | date | YES |  |
| 77 | `short_code` | character varying(8) | YES |  |
| 78 | `credit_card_bin` | character varying(8) | YES |  |
| 79 | `neustar_fingerprint_text` | text | YES |  |

## uown_los_lead_merchant_settings_snapshot

**Schema:** `public` | **Columns:** 13

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `web_user_id` | bigint | YES |  |
| 6 | `agent` | character varying(255) | YES |  |
| 7 | `lead_pk` | bigint | NO |  |
| 8 | `merchant_pk` | bigint | NO |  |
| 9 | `program_pk` | bigint | YES |  |
| 10 | `epo5` | boolean | YES |  |
| 11 | `epo10` | boolean | YES |  |
| 12 | `uw_pipeline` | character varying(10) | YES |  |
| 13 | `fraud_threshold` | integer | YES |  |

## uown_los_lead_notes

**Schema:** `public` | **Columns:** 8

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `lead_pk` | bigint | NO |  |
| 8 | `notes` | text | YES |  |

## uown_los_lead_short_code

**Schema:** `public` | **Columns:** 8

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `lead_pk` | bigint | NO |  |
| 3 | `short_code` | character varying(8) | YES |  |
| 4 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 5 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 6 | `tenant_id` | bigint | YES |  |
| 7 | `web_user_id` | bigint | YES |  |
| 8 | `agent` | character varying(255) | YES |  |

## uown_los_lead_short_code_history

**Schema:** `public` | **Columns:** 10

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `lead_pk` | bigint | NO |  |
| 3 | `short_code` | character varying(8) | YES |  |
| 4 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 5 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 6 | `tenant_id` | bigint | YES |  |
| 7 | `web_user_id` | bigint | YES |  |
| 8 | `agent` | character varying(255) | YES |  |
| 9 | `rev` | integer | NO |  |
| 10 | `revtype` | smallint | YES |  |

## uown_los_outbound_api_log

**Schema:** `public` | **Columns:** 19

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_los_outbound_api_log_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `api` | character varying(255) | YES |  |
| 8 | `call_type` | character varying(255) | YES |  |
| 9 | `header` | text | YES |  |
| 10 | `request` | text | YES |  |
| 11 | `request_object` | text | YES |  |
| 12 | `response` | text | YES |  |
| 13 | `return_uuid` | character varying(255) | YES |  |
| 14 | `source` | character varying(255) | YES |  |
| 15 | `source_uuid` | character varying(255) | YES |  |
| 16 | `stack_trace` | text | YES |  |
| 17 | `url` | text | YES |  |
| 18 | `uuid` | character varying(255) | YES |  |
| 19 | `lead_pk` | bigint | YES |  |

## uown_los_payment

**Schema:** `public` | **Columns:** 25

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `ach_pk` | bigint | YES |  |
| 8 | `cc_pk` | bigint | YES |  |
| 9 | `is_ach` | boolean | YES |  |
| 10 | `is_credit_card` | boolean | YES |  |
| 11 | `most_recent` | boolean | YES |  |
| 12 | `payment_amount` | numeric | YES |  |
| 13 | `payment_date` | date | YES |  |
| 14 | `payment_type` | character varying(255) | YES |  |
| 15 | `reason` | character varying(255) | YES |  |
| 16 | `ref_receipt` | character varying(255) | YES |  |
| 17 | `reverse_date` | date | YES |  |
| 18 | `reverse_date_timestamp` | timestamp without time zone | YES |  |
| 19 | `status` | character varying(255) | YES |  |
| 20 | `lead_pk` | bigint | YES |  |
| 21 | `agent_username` | character varying(255) | YES |  |
| 22 | `allocation_strategy` | character varying(255) | YES |  |
| 23 | `comments` | text | YES |  |
| 24 | `non_taxable_payment` | numeric | YES |  |
| 25 | `taxable_payment` | numeric | YES |  |

## uown_los_payment_options

**Schema:** `public` | **Columns:** 62

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_los_payment_options_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `amount_past_due_without_tax` | numeric | YES |  |
| 8 | `balance_amount_without_tax` | numeric | YES |  |
| 9 | `cost_with_fees_no_tax` | numeric | YES |  |
| 10 | `cost_without_tax_and_fees` | numeric | YES |  |
| 11 | `days_past_due` | integer | YES |  |
| 12 | `due_date_moves` | integer | YES |  |
| 13 | `early_payoff_date_expiry` | date | YES |  |
| 14 | `epo_amount_without_tax` | numeric | YES |  |
| 15 | `first_payment_discount` | numeric | YES |  |
| 16 | `first_payment_due_date` | date | YES |  |
| 17 | `first_payment_with_tax_no_fees` | numeric | YES |  |
| 18 | `last_payment_date` | date | YES |  |
| 19 | `last_payment_with_tax` | numeric | YES |  |
| 20 | `merchant_discount_amount` | numeric | YES |  |
| 21 | `merchant_discount_rate` | numeric | YES |  |
| 22 | `merchant_rebate_amount` | numeric | YES |  |
| 23 | `merchant_rebate_rate` | numeric | YES |  |
| 24 | `money_factor` | numeric | YES |  |
| 25 | `next_payment_due_date` | date | YES |  |
| 26 | `next_payment_with_tax` | numeric | YES |  |
| 27 | `number_of_payments_made` | integer | YES |  |
| 28 | `payment_frequency` | character varying(255) | YES |  |
| 29 | `plat_form_fee_amount` | numeric | YES |  |
| 30 | `plat_form_fee_rate` | numeric | YES |  |
| 31 | `processing_fee` | numeric | YES |  |
| 32 | `protection_plan_fee` | numeric | YES |  |
| 33 | `remaining_number_of_payments` | integer | YES |  |
| 34 | `tax_amount` | numeric | YES |  |
| 35 | `tax_per_scheduled_payment` | numeric | YES |  |
| 36 | `tax_rate` | numeric | YES |  |
| 37 | `term_in_months` | integer | YES |  |
| 38 | `total_contract_amount_with_tax_and_fees` | numeric | YES |  |
| 39 | `total_number_of_payments` | integer | YES |  |
| 40 | `total_recycle_fee` | numeric | YES |  |
| 41 | `lead_pk` | bigint | YES |  |
| 42 | `delinquency_as_of_date` | date | YES |  |
| 43 | `security_deposit` | numeric | YES |  |
| 44 | `redirect_url` | character varying(255) | YES |  |
| 45 | `first_payment_no_tax_no_fees` | numeric | YES |  |
| 46 | `first_payment_no_tax_with_fees` | numeric | YES |  |
| 47 | `first_payment_tax` | numeric | YES |  |
| 48 | `frequency_changes` | integer | YES |  |
| 49 | `last_payment_no_tax_no_fees` | numeric | YES |  |
| 50 | `last_payment_no_tax_with_fees` | numeric | YES |  |
| 51 | `last_payment_tax` | numeric | YES |  |
| 52 | `last_tax_updated_time` | timestamp without time zone | YES |  |
| 53 | `next_payment_no_tax_no_fees` | numeric | YES |  |
| 54 | `regular_payment_tax` | numeric | YES |  |
| 55 | `buyout_fee` | numeric | YES |  |
| 56 | `amount_charged_at_signing` | numeric | YES |  |
| 57 | `signing_fee` | numeric | YES |  |
| 58 | `epo_amount_with_tax` | numeric | YES |  |
| 59 | `ks_label` | character varying(255) | YES |  |
| 60 | `program_name` | character varying(255) | YES |  |
| 61 | `short_code` | character varying(8) | YES |  |
| 62 | `plan_id` | character varying(255) | YES |  |

## uown_los_payment_options_history

**Schema:** `public` | **Columns:** 64

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `rev` | integer | NO |  |
| 3 | `revtype` | smallint | YES |  |
| 4 | `agent` | character varying(255) | YES |  |
| 5 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 6 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 7 | `tenant_id` | bigint | YES |  |
| 8 | `web_user_id` | bigint | YES |  |
| 9 | `amount_past_due_without_tax` | numeric | YES |  |
| 10 | `balance_amount_without_tax` | numeric | YES |  |
| 11 | `cost_with_fees_no_tax` | numeric | YES |  |
| 12 | `cost_without_tax_and_fees` | numeric | YES |  |
| 13 | `days_past_due` | integer | YES |  |
| 14 | `due_date_moves` | integer | YES |  |
| 15 | `early_payoff_date_expiry` | date | YES |  |
| 16 | `epo_amount_without_tax` | numeric | YES |  |
| 17 | `first_payment_discount` | numeric | YES |  |
| 18 | `first_payment_due_date` | date | YES |  |
| 19 | `first_payment_with_tax_no_fees` | numeric | YES |  |
| 20 | `last_payment_date` | date | YES |  |
| 21 | `last_payment_with_tax` | numeric | YES |  |
| 22 | `merchant_discount_amount` | numeric | YES |  |
| 23 | `merchant_discount_rate` | numeric | YES |  |
| 24 | `merchant_rebate_amount` | numeric | YES |  |
| 25 | `merchant_rebate_rate` | numeric | YES |  |
| 26 | `money_factor` | numeric | YES |  |
| 27 | `next_payment_due_date` | date | YES |  |
| 28 | `next_payment_with_tax` | numeric | YES |  |
| 29 | `number_of_payments_made` | integer | YES |  |
| 30 | `payment_frequency` | character varying(255) | YES |  |
| 31 | `plat_form_fee_amount` | numeric | YES |  |
| 32 | `plat_form_fee_rate` | numeric | YES |  |
| 33 | `processing_fee` | numeric | YES |  |
| 34 | `protection_plan_fee` | numeric | YES |  |
| 35 | `remaining_number_of_payments` | integer | YES |  |
| 36 | `tax_amount` | numeric | YES |  |
| 37 | `tax_per_scheduled_payment` | numeric | YES |  |
| 38 | `tax_rate` | numeric | YES |  |
| 39 | `term_in_months` | integer | YES |  |
| 40 | `total_contract_amount_with_tax_and_fees` | numeric | YES |  |
| 41 | `total_number_of_payments` | integer | YES |  |
| 42 | `total_recycle_fee` | numeric | YES |  |
| 43 | `lead_pk` | bigint | YES |  |
| 44 | `delinquency_as_of_date` | date | YES |  |
| 45 | `security_deposit` | numeric | YES |  |
| 46 | `redirect_url` | character varying(255) | YES |  |
| 47 | `first_payment_no_tax_no_fees` | numeric | YES |  |
| 48 | `first_payment_no_tax_with_fees` | numeric | YES |  |
| 49 | `first_payment_tax` | numeric | YES |  |
| 50 | `frequency_changes` | integer | YES |  |
| 51 | `last_payment_no_tax_no_fees` | numeric | YES |  |
| 52 | `last_payment_no_tax_with_fees` | numeric | YES |  |
| 53 | `last_payment_tax` | numeric | YES |  |
| 54 | `last_tax_updated_time` | timestamp without time zone | YES |  |
| 55 | `next_payment_no_tax_no_fees` | numeric | YES |  |
| 56 | `regular_payment_tax` | numeric | YES |  |
| 57 | `buyout_fee` | numeric | YES |  |
| 58 | `amount_charged_at_signing` | numeric | YES |  |
| 59 | `signing_fee` | numeric | YES |  |
| 60 | `epo_amount_with_tax` | numeric | YES |  |
| 61 | `ks_label` | character varying(255) | YES |  |
| 62 | `program_name` | character varying(255) | YES |  |
| 63 | `short_code` | character varying(8) | YES |  |
| 64 | `plan_id` | character varying(255) | YES |  |

## uown_los_phone

**Schema:** `public` | **Columns:** 19

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_los_phone_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `area_code` | character varying(255) | YES |  |
| 8 | `do_not_call` | boolean | YES |  |
| 9 | `do_not_text` | boolean | YES |  |
| 10 | `last_contact_timestamp` | timestamp without time zone | YES |  |
| 11 | `phone_extension` | character varying(255) | YES |  |
| 12 | `phone_number` | bigint | YES |  |
| 13 | `phone_type` | character varying(255) | YES |  |
| 14 | `reason_for_dnc` | character varying(255) | YES |  |
| 15 | `reason_for_dnt` | character varying(255) | YES |  |
| 16 | `customer_pk` | bigint | YES |  |
| 17 | `lead_pk` | bigint | YES |  |
| 18 | `opt_out_ai` | boolean | YES | false |
| 19 | `opt_out_ai_reason` | character varying(500) | YES |  |

## uown_los_phone_history

**Schema:** `public` | **Columns:** 21

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `rev` | integer | NO |  |
| 3 | `revtype` | smallint | YES |  |
| 4 | `agent` | character varying(255) | YES |  |
| 5 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 6 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 7 | `tenant_id` | bigint | YES |  |
| 8 | `web_user_id` | bigint | YES |  |
| 9 | `area_code` | character varying(255) | YES |  |
| 10 | `do_not_call` | boolean | YES |  |
| 11 | `do_not_text` | boolean | YES |  |
| 12 | `last_contact_timestamp` | timestamp without time zone | YES |  |
| 13 | `phone_extension` | character varying(255) | YES |  |
| 14 | `phone_number` | bigint | YES |  |
| 15 | `phone_type` | character varying(255) | YES |  |
| 16 | `reason_for_dnc` | character varying(255) | YES |  |
| 17 | `reason_for_dnt` | character varying(255) | YES |  |
| 18 | `customer_pk` | bigint | YES |  |
| 19 | `lead_pk` | bigint | YES |  |
| 20 | `opt_out_ai` | boolean | YES | false |
| 21 | `opt_out_ai_reason` | character varying(500) | YES |  |

## uown_los_protection_plan

**Schema:** `public` | **Columns:** 25

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_los_protection_plan_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `account_pk` | bigint | YES |  |
| 8 | `already_covered` | boolean | YES |  |
| 9 | `connector_token` | character varying(255) | YES |  |
| 10 | `error` | text | YES |  |
| 11 | `lead_pk` | bigint | YES |  |
| 12 | `offer_element_response` | text | YES |  |
| 13 | `opt_in` | boolean | YES |  |
| 14 | `request` | text | YES |  |
| 15 | `response` | text | YES |  |
| 16 | `status` | character varying(255) | YES |  |
| 17 | `customer_id` | character varying(255) | YES |  |
| 18 | `policy_id` | character varying(255) | YES |  |
| 19 | `covered_by_account_pk` | character varying(255) | YES |  |
| 20 | `covered_by_lead_pk` | character varying(255) | YES |  |
| 21 | `enrollment_date` | date | YES |  |
| 22 | `order_id` | character varying(255) | YES |  |
| 23 | `cancellation_date` | date | YES |  |
| 24 | `refund_amount` | numeric | YES |  |
| 25 | `cancellation_reason` | text | YES |  |

## uown_los_receivable

**Schema:** `public` | **Columns:** 23

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_los_receivable_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `allocation_status` | character varying(255) | YES |  |
| 8 | `base_amount` | numeric | YES |  |
| 9 | `base_epo_amount` | numeric | YES |  |
| 10 | `comment` | text | YES |  |
| 11 | `due_date` | date | YES |  |
| 12 | `partial_payment_amount` | numeric | YES |  |
| 13 | `receivable_type` | character varying(255) | YES |  |
| 14 | `status` | character varying(255) | YES |  |
| 15 | `tax_amount` | numeric | YES |  |
| 16 | `total_amount` | numeric | YES |  |
| 17 | `lead_pk` | bigint | YES |  |
| 18 | `notes` | text | YES |  |
| 19 | `tax_rate` | numeric | YES |  |
| 20 | `skipped` | boolean | YES |  |
| 21 | `tax_for_zip_pk` | bigint | YES |  |
| 22 | `tax_updated` | timestamp without time zone | YES |  |
| 23 | `base_epo90day_ineligible` | numeric | YES |  |

## uown_los_receivable_history

**Schema:** `public` | **Columns:** 4

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `rev` | integer | NO |  |
| 3 | `revtype` | smallint | YES |  |
| 4 | `lead_pk` | bigint | YES |  |

## uown_los_sched_summary

**Schema:** `public` | **Columns:** 62

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_los_sched_summary_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `amount_past_due_without_tax` | numeric | YES |  |
| 8 | `balance_amount_without_tax` | numeric | YES |  |
| 9 | `cost_with_fees_no_tax` | numeric | YES |  |
| 10 | `cost_without_tax_and_fees` | numeric | YES |  |
| 11 | `days_past_due` | integer | YES |  |
| 12 | `due_date_moves` | integer | YES |  |
| 13 | `early_payoff_date_expiry` | date | YES |  |
| 14 | `epo_amount_without_tax` | numeric | YES |  |
| 15 | `first_payment_discount` | numeric | YES |  |
| 16 | `first_payment_due_date` | date | YES |  |
| 17 | `first_payment_with_tax_no_fees` | numeric | YES |  |
| 18 | `last_payment_date` | date | YES |  |
| 19 | `last_payment_with_tax` | numeric | YES |  |
| 20 | `merchant_discount_amount` | numeric | YES |  |
| 21 | `merchant_discount_rate` | numeric | YES |  |
| 22 | `merchant_rebate_amount` | numeric | YES |  |
| 23 | `merchant_rebate_rate` | numeric | YES |  |
| 24 | `money_factor` | numeric | YES |  |
| 25 | `next_payment_due_date` | date | YES |  |
| 26 | `next_payment_with_tax` | numeric | YES |  |
| 27 | `number_of_payments_made` | integer | YES |  |
| 28 | `payment_frequency` | character varying(255) | YES |  |
| 29 | `plat_form_fee_amount` | numeric | YES |  |
| 30 | `plat_form_fee_rate` | numeric | YES |  |
| 31 | `processing_fee` | numeric | YES |  |
| 32 | `protection_plan_fee` | numeric | YES |  |
| 33 | `remaining_number_of_payments` | integer | YES |  |
| 34 | `tax_amount` | numeric | YES |  |
| 35 | `tax_per_scheduled_payment` | numeric | YES |  |
| 36 | `tax_rate` | numeric | YES |  |
| 37 | `term_in_months` | integer | YES |  |
| 38 | `total_contract_amount_with_tax_and_fees` | numeric | YES |  |
| 39 | `total_number_of_payments` | integer | YES |  |
| 40 | `total_recycle_fee` | numeric | YES |  |
| 41 | `lead_pk` | bigint | YES |  |
| 42 | `delinquency_as_of_date` | date | YES |  |
| 43 | `security_deposit` | numeric | YES |  |
| 44 | `redirect_url` | character varying(255) | YES |  |
| 45 | `first_payment_no_tax_no_fees` | numeric | YES |  |
| 46 | `first_payment_no_tax_with_fees` | numeric | YES |  |
| 47 | `first_payment_tax` | numeric | YES |  |
| 48 | `frequency_changes` | integer | YES |  |
| 49 | `last_payment_no_tax_no_fees` | numeric | YES |  |
| 50 | `last_payment_no_tax_with_fees` | numeric | YES |  |
| 51 | `last_payment_tax` | numeric | YES |  |
| 52 | `last_tax_updated_time` | timestamp without time zone | YES |  |
| 53 | `next_payment_no_tax_no_fees` | numeric | YES |  |
| 54 | `regular_payment_tax` | numeric | YES |  |
| 55 | `buyout_fee` | numeric | YES |  |
| 56 | `amount_charged_at_signing` | numeric | YES |  |
| 57 | `signing_fee` | numeric | YES |  |
| 58 | `epo_amount_with_tax` | numeric | YES |  |
| 59 | `ks_label` | character varying(255) | YES |  |
| 60 | `program_name` | character varying(255) | YES |  |
| 61 | `short_code` | character varying(8) | YES |  |
| 62 | `plan_id` | character varying(255) | YES |  |

## uown_los_sched_summary_history

**Schema:** `public` | **Columns:** 64

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `rev` | integer | NO |  |
| 3 | `revtype` | smallint | YES |  |
| 4 | `agent` | character varying(255) | YES |  |
| 5 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 6 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 7 | `tenant_id` | bigint | YES |  |
| 8 | `web_user_id` | bigint | YES |  |
| 9 | `amount_past_due_without_tax` | numeric | YES |  |
| 10 | `balance_amount_without_tax` | numeric | YES |  |
| 11 | `cost_with_fees_no_tax` | numeric | YES |  |
| 12 | `cost_without_tax_and_fees` | numeric | YES |  |
| 13 | `days_past_due` | integer | YES |  |
| 14 | `due_date_moves` | integer | YES |  |
| 15 | `early_payoff_date_expiry` | date | YES |  |
| 16 | `epo_amount_without_tax` | numeric | YES |  |
| 17 | `first_payment_discount` | numeric | YES |  |
| 18 | `first_payment_due_date` | date | YES |  |
| 19 | `first_payment_with_tax_no_fees` | numeric | YES |  |
| 20 | `last_payment_date` | date | YES |  |
| 21 | `last_payment_with_tax` | numeric | YES |  |
| 22 | `merchant_discount_amount` | numeric | YES |  |
| 23 | `merchant_discount_rate` | numeric | YES |  |
| 24 | `merchant_rebate_amount` | numeric | YES |  |
| 25 | `merchant_rebate_rate` | numeric | YES |  |
| 26 | `money_factor` | numeric | YES |  |
| 27 | `next_payment_due_date` | date | YES |  |
| 28 | `next_payment_with_tax` | numeric | YES |  |
| 29 | `number_of_payments_made` | integer | YES |  |
| 30 | `payment_frequency` | character varying(255) | YES |  |
| 31 | `plat_form_fee_amount` | numeric | YES |  |
| 32 | `plat_form_fee_rate` | numeric | YES |  |
| 33 | `processing_fee` | numeric | YES |  |
| 34 | `protection_plan_fee` | numeric | YES |  |
| 35 | `remaining_number_of_payments` | integer | YES |  |
| 36 | `tax_amount` | numeric | YES |  |
| 37 | `tax_per_scheduled_payment` | numeric | YES |  |
| 38 | `tax_rate` | numeric | YES |  |
| 39 | `term_in_months` | integer | YES |  |
| 40 | `total_contract_amount_with_tax_and_fees` | numeric | YES |  |
| 41 | `total_number_of_payments` | integer | YES |  |
| 42 | `total_recycle_fee` | numeric | YES |  |
| 43 | `lead_pk` | bigint | YES |  |
| 44 | `delinquency_as_of_date` | date | YES |  |
| 45 | `security_deposit` | numeric | YES |  |
| 46 | `redirect_url` | character varying(255) | YES |  |
| 47 | `first_payment_no_tax_no_fees` | numeric | YES |  |
| 48 | `first_payment_no_tax_with_fees` | numeric | YES |  |
| 49 | `first_payment_tax` | numeric | YES |  |
| 50 | `frequency_changes` | integer | YES |  |
| 51 | `last_payment_no_tax_no_fees` | numeric | YES |  |
| 52 | `last_payment_no_tax_with_fees` | numeric | YES |  |
| 53 | `last_payment_tax` | numeric | YES |  |
| 54 | `last_tax_updated_time` | timestamp without time zone | YES |  |
| 55 | `next_payment_no_tax_no_fees` | numeric | YES |  |
| 56 | `regular_payment_tax` | numeric | YES |  |
| 57 | `buyout_fee` | numeric | YES |  |
| 58 | `amount_charged_at_signing` | numeric | YES |  |
| 59 | `signing_fee` | numeric | YES |  |
| 60 | `epo_amount_with_tax` | numeric | YES |  |
| 61 | `ks_label` | character varying(255) | YES |  |
| 62 | `program_name` | character varying(255) | YES |  |
| 63 | `short_code` | character varying(8) | YES |  |
| 64 | `plan_id` | character varying(255) | YES |  |

## uown_los_uwdata

**Schema:** `public` | **Columns:** 32

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_los_uwdata_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `abb_uw_response` | text | YES |  |
| 8 | `approval_amount` | numeric | YES |  |
| 9 | `approval_expiration_date` | date | YES |  |
| 10 | `decided_by_agent` | character varying(255) | YES |  |
| 11 | `decision_code` | character varying(255) | YES |  |
| 12 | `decision_made_at` | timestamp without time zone | YES |  |
| 13 | `risk_score` | bigint | YES |  |
| 14 | `uw_status` | character varying(255) | YES |  |
| 15 | `lead_pk` | bigint | YES |  |
| 16 | `bank_verification_required` | boolean | YES |  |
| 17 | `charge_processing_fee` | boolean | YES |  |
| 18 | `is_intellicheck_required` | boolean | YES |  |
| 19 | `tier_x` | integer | YES |  |
| 20 | `tier_y` | integer | YES |  |
| 21 | `lambda_segment` | integer | YES |  |
| 22 | `previous_uw` | text | YES |  |
| 23 | `risk_type` | character varying(255) | YES |  |
| 24 | `uw_approval_amount` | numeric | YES |  |
| 25 | `cash_score_threshold` | integer | YES |  |
| 26 | `vantage_score` | integer | YES |  |
| 27 | `eligible_terms` | character varying(255) | YES |  |
| 28 | `campaign_id` | integer | YES |  |
| 29 | `internal_decision` | character varying(255) | YES |  |
| 30 | `is_eligible_for_extra_info` | boolean | YES |  |
| 31 | `npm_segment` | integer | YES |  |
| 32 | `tam_score` | integer | YES |  |

## uown_los_uwdata_history

**Schema:** `public` | **Columns:** 9

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `rev` | integer | NO |  |
| 3 | `revtype` | smallint | YES |  |
| 4 | `agent` | character varying(255) | YES |  |
| 5 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 6 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 7 | `tenant_id` | bigint | YES |  |
| 8 | `web_user_id` | bigint | YES |  |
| 9 | `lead_pk` | bigint | YES |  |

## uown_mail_queue

**Schema:** `public` | **Columns:** 22

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_mail_queue_pk_seq'::regclass) |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `web_user_id` | bigint | YES |  |
| 6 | `account_pk` | bigint | YES |  |
| 7 | `created_by` | character varying(255) | YES |  |
| 8 | `customer_pk` | bigint | YES |  |
| 9 | `data_map` | text | YES |  |
| 10 | `error_desc` | text | YES |  |
| 11 | `lead_pk` | bigint | YES |  |
| 12 | `location` | character varying(255) | YES |  |
| 13 | `merchant_pk` | bigint | YES |  |
| 14 | `picked_at_time` | timestamp without time zone | YES |  |
| 15 | `priority` | integer | YES |  |
| 16 | `queue_type` | character varying(255) | YES |  |
| 17 | `send_by_time` | timestamp without time zone | YES |  |
| 18 | `sent_time` | timestamp without time zone | YES |  |
| 19 | `status` | character varying(255) | YES |  |
| 20 | `template_name` | character varying(255) | YES |  |
| 21 | `template_version` | bigint | YES |  |
| 22 | `id` | character varying(255) | YES |  |

## uown_merchant

**Schema:** `public` | **Columns:** 154

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_merchant_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `allow_auto_decision` | boolean | YES |  |
| 8 | `allow_location_change_for_merchant_site_user` | boolean | YES |  |
| 9 | `allow_remote_sign` | boolean | YES |  |
| 10 | `alt_contact_email` | character varying(255) | YES |  |
| 11 | `alt_contact_fax` | character varying(15) | YES |  |
| 12 | `alt_contact_name` | character varying(255) | YES |  |
| 13 | `alt_contact_phone` | character varying(15) | YES |  |
| 14 | `api_key` | character varying(255) | YES |  |
| 15 | `buy_group` | character varying(255) | YES |  |
| 16 | `buy_group_member` | boolean | YES |  |
| 17 | `buy_group_name` | character varying(255) | YES |  |
| 18 | `category` | character varying(255) | YES |  |
| 19 | `city` | character varying(255) | YES |  |
| 20 | `client_type` | character varying(255) | YES |  |
| 21 | `country` | character varying(255) | YES |  |
| 22 | `county` | character varying(255) | YES |  |
| 23 | `dealer_discount_override` | numeric | YES |  |
| 24 | `dealer_rebate_override` | numeric | YES |  |
| 25 | `dealer_rebate_type` | character varying(255) | YES |  |
| 26 | `delivery_receipt_id` | character varying(255) | YES |  |
| 27 | `do_not_allow_new_apps` | boolean | YES |  |
| 28 | `dte_corp_training` | timestamp without time zone | YES |  |
| 29 | `dte_dealer_app_rcvd` | timestamp without time zone | YES |  |
| 30 | `dte_dealer_kit_ship` | timestamp without time zone | YES |  |
| 31 | `dte_setup_in_crm` | timestamp without time zone | YES |  |
| 32 | `esign_mode` | character varying(255) | YES |  |
| 33 | `exclude_from_reports` | boolean | YES |  |
| 34 | `fax` | character varying(15) | YES |  |
| 35 | `fed_tax_id` | character varying(9) | YES |  |
| 36 | `independent_rep_code` | character varying(255) | YES |  |
| 37 | `inventory_category` | character varying(255) | YES |  |
| 38 | `is_hidden` | boolean | YES |  |
| 39 | `latitude` | character varying(20) | YES |  |
| 40 | `legal_name` | character varying(255) | YES |  |
| 41 | `location_address1` | character varying(255) | YES |  |
| 42 | `location_address2` | character varying(255) | YES |  |
| 43 | `location_name` | character varying(255) | YES |  |
| 44 | `longitude` | character varying(20) | YES |  |
| 45 | `merchant_name` | character varying(255) | NO |  |
| 46 | `merchant_type` | character varying(255) | YES |  |
| 47 | `merchant_url` | character varying(500) | YES |  |
| 48 | `num_days_approval_exp` | integer | NO |  |
| 49 | `num_days_lease_doc_exp` | integer | NO |  |
| 50 | `off_peak_campaign_id` | integer | YES |  |
| 51 | `owner_name` | character varying(255) | YES |  |
| 52 | `ownership_type` | character varying(255) | YES |  |
| 53 | `peak_campaign_id` | integer | YES |  |
| 54 | `phone_number` | character varying(15) | YES |  |
| 55 | `plat_form_fee_type` | character varying(255) | YES |  |
| 56 | `platform_fee` | numeric | YES |  |
| 57 | `primary_contact_email` | character varying(255) | YES |  |
| 58 | `primary_contact_fax` | character varying(15) | YES |  |
| 59 | `primary_contact_name` | character varying(255) | YES |  |
| 60 | `primary_contact_phone` | character varying(15) | YES |  |
| 61 | `priority` | integer | NO |  |
| 62 | `ref_company_id` | character varying(255) | YES |  |
| 63 | `ref_location_id` | character varying(255) | YES |  |
| 64 | `ref_merchant_code` | character varying(255) | YES |  |
| 65 | `sales_rep_code` | character varying(255) | YES |  |
| 66 | `scoring_company_group` | character varying(2) | YES |  |
| 67 | `show_payroll_and_prepaid_card_on_application` | boolean | YES |  |
| 68 | `show_report_menu_item_on_merchant_site` | boolean | YES |  |
| 69 | `show_weekly_status_report` | boolean | YES |  |
| 70 | `state` | character varying(255) | YES |  |
| 71 | `store_timings` | character varying(3000) | YES |  |
| 72 | `tax_rate` | numeric | YES |  |
| 73 | `tax_zone` | character varying(10) | YES |  |
| 74 | `use_customer_state_for_lease_and_sales_tax` | boolean | YES |  |
| 75 | `username` | character varying(255) | YES |  |
| 76 | `zip_code` | character varying(255) | YES |  |
| 77 | `valid_states` | text | YES |  |
| 78 | `default_loan_amount` | numeric | YES |  |
| 79 | `default_months_at_employer` | integer | YES |  |
| 80 | `allowed_frequencies` | text | YES |  |
| 81 | `charge_processing_fee_before_esign` | boolean | YES |  |
| 82 | `is_intellicheck_required` | boolean | YES |  |
| 83 | `is_redirect_url_branded` | boolean | YES |  |
| 84 | `is_security_deposit_amortized` | boolean | YES |  |
| 85 | `hold_deposit` | boolean | YES |  |
| 86 | `post_message` | boolean | YES |  |
| 87 | `allow_close_on_iframe` | boolean | YES |  |
| 88 | `remove_parent_or_top_on_iframe` | boolean | YES |  |
| 89 | `check_uw_for_verification` | boolean | YES |  |
| 90 | `comment` | text | YES |  |
| 91 | `is_active` | boolean | YES |  |
| 92 | `allow_change_to_expired` | boolean | YES |  |
| 93 | `esign_client` | character varying(255) | YES |  |
| 94 | `is_fraud_check_required` | boolean | YES |  |
| 95 | `verify_email` | boolean | YES |  |
| 96 | `verify_ip` | boolean | YES |  |
| 97 | `verify_phone` | boolean | YES |  |
| 98 | `check_fraud_fingerprint` | boolean | YES |  |
| 99 | `cloned_from` | bigint | YES |  |
| 100 | `cloned_from_name` | character varying(255) | YES |  |
| 101 | `is_ach_required` | boolean | YES |  |
| 102 | `is_cc_required` | boolean | YES |  |
| 103 | `is_fpd_required` | boolean | YES |  |
| 104 | `is_signed_to_funding` | boolean | YES |  |
| 105 | `run_address_verification` | boolean | YES |  |
| 106 | `use_webhook` | boolean | YES |  |
| 107 | `approval_amount_increase` | numeric | YES |  |
| 108 | `verify_phone_before_signing` | boolean | YES |  |
| 109 | `charge_processing_fee` | boolean | YES |  |
| 110 | `accept_new_apps` | boolean | YES |  |
| 111 | `buyout_fee` | numeric | YES |  |
| 112 | `funding_report_emails` | text | YES |  |
| 113 | `funding_report_frequency` | text | YES |  |
| 114 | `is_bank_verification_required` | boolean | YES |  |
| 115 | `is_deleted` | boolean | YES |  |
| 116 | `lending_category_list` | text | YES |  |
| 117 | `send_automated_funding_report` | boolean | YES |  |
| 118 | `tax_exempted_states` | character varying(255) | YES |  |
| 119 | `webhook_url` | text | YES |  |
| 120 | `use_neustar` | boolean | YES |  |
| 121 | `use_sentilink` | boolean | YES |  |
| 122 | `send_finalize_notice` | boolean | YES |  |
| 123 | `record_signing_flow` | boolean | YES |  |
| 124 | `return_lambda_score` | boolean | YES |  |
| 125 | `cc_processing_fee_percent` | numeric | YES |  |
| 126 | `is_item_split` | boolean | YES |  |
| 127 | `merchant_support` | character varying(255) | YES |  |
| 128 | `remove_merchant_from_users` | boolean | YES |  |
| 129 | `use_lexis_nexis` | boolean | YES |  |
| 130 | `use_neuro_id_check` | boolean | YES |  |
| 131 | `funding_exception` | boolean | YES |  |
| 132 | `five_day_funding_exception` | boolean | YES |  |
| 133 | `two_day_funding_exception` | boolean | YES |  |
| 134 | `merged_funding_report_emails` | text | YES |  |
| 135 | `merged_funding_report_frequency` | text | YES |  |
| 136 | `send_merged_funding_report` | boolean | YES |  |
| 137 | `send_merchant_portal_url_as_provider` | boolean | YES |  |
| 138 | `offer_insurance` | boolean | YES |  |
| 139 | `auto_deny_application` | boolean | YES |  |
| 140 | `termination_reason` | character varying(255) | YES |  |
| 141 | `minimum_lease_amount` | numeric | YES |  |
| 142 | `is_seon_id_check_required` | boolean | YES |  |
| 143 | `is_plaid_verification_required` | boolean | YES |  |
| 144 | `epo10` | boolean | YES |  |
| 145 | `epo5` | boolean | YES |  |
| 146 | `referral_fee` | numeric | YES |  |
| 147 | `referral_partner` | character varying(255) | YES |  |
| 148 | `integration_type` | character varying(20) | YES |  |
| 149 | `uw_pipeline` | character varying(10) | YES |  |
| 150 | `fraud_threshold` | integer | YES |  |
| 151 | `max_approval_amount` | numeric | YES |  |
| 152 | `primary_contact_mobile` | character varying(15) | YES |  |
| 153 | `alt_contact_mobile` | character varying(15) | YES |  |
| 154 | `hold_funding` | boolean | YES | false |

## uown_merchant_activity_log

**Schema:** `public` | **Columns:** 23

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `account_pk` | bigint | YES |  |
| 8 | `activity_log_pk` | bigint | NO |  |
| 9 | `created_by` | character varying(255) | YES |  |
| 10 | `deleted` | boolean | YES |  |
| 11 | `expiry_date` | date | YES |  |
| 12 | `is_hidden` | boolean | YES |  |
| 13 | `lead_pk` | bigint | YES |  |
| 14 | `log_type` | character varying(255) | YES |  |
| 15 | `notes` | text | YES |  |
| 16 | `priority` | boolean | YES |  |
| 17 | `ref_account_id` | character varying(255) | YES |  |
| 18 | `merchant_pk` | bigint | YES |  |
| 19 | `program_pk` | bigint | YES |  |
| 20 | `location_name` | character varying(255) | YES |  |
| 21 | `merchant_name` | character varying(255) | YES |  |
| 22 | `merchant_ref_code` | character varying(255) | YES |  |
| 23 | `creation_source` | character varying(255) | YES |  |

## uown_merchant_api_error_log

**Schema:** `public` | **Columns:** 15

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `first_name` | character varying(255) | YES |  |
| 8 | `last4ssn` | character varying(255) | YES |  |
| 9 | `last_name` | character varying(255) | YES |  |
| 10 | `lead_pk` | bigint | YES |  |
| 11 | `location_name` | character varying(255) | YES |  |
| 12 | `merchant_name` | character varying(255) | YES |  |
| 13 | `merchant_pk` | bigint | YES |  |
| 14 | `message` | text | YES |  |
| 15 | `ref_merchant_code` | character varying(255) | YES |  |

## uown_merchant_api_error_log_history

**Schema:** `public` | **Columns:** 17

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `rev` | integer | NO |  |
| 3 | `revtype` | smallint | YES |  |
| 4 | `agent` | character varying(255) | YES |  |
| 5 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 6 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 7 | `tenant_id` | bigint | YES |  |
| 8 | `web_user_id` | bigint | YES |  |
| 9 | `first_name` | character varying(255) | YES |  |
| 10 | `last4ssn` | character varying(255) | YES |  |
| 11 | `last_name` | character varying(255) | YES |  |
| 12 | `lead_pk` | bigint | YES |  |
| 13 | `location_name` | character varying(255) | YES |  |
| 14 | `merchant_name` | character varying(255) | YES |  |
| 15 | `merchant_pk` | bigint | YES |  |
| 16 | `message` | text | YES |  |
| 17 | `ref_merchant_code` | character varying(255) | YES |  |

## uown_merchant_bank_account

**Schema:** `public` | **Columns:** 12

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `merchant_pk` | bigint | NO |  |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `account_number` | character varying(255) | YES |  |
| 8 | `bank_type_used` | character varying(255) | YES |  |
| 9 | `city` | character varying(255) | YES |  |
| 10 | `name` | character varying(255) | YES |  |
| 11 | `routing_number` | character varying(255) | YES |  |
| 12 | `state` | character varying(255) | YES |  |

## uown_merchant_bank_account_history

**Schema:** `public` | **Columns:** 14

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `merchant_pk` | bigint | NO |  |
| 2 | `rev` | integer | NO |  |
| 3 | `revtype` | smallint | YES |  |
| 4 | `agent` | character varying(255) | YES |  |
| 5 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 6 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 7 | `tenant_id` | bigint | YES |  |
| 8 | `web_user_id` | bigint | YES |  |
| 9 | `account_number` | character varying(255) | YES |  |
| 10 | `bank_type_used` | character varying(255) | YES |  |
| 11 | `city` | character varying(255) | YES |  |
| 12 | `name` | character varying(255) | YES |  |
| 13 | `routing_number` | character varying(255) | YES |  |
| 14 | `state` | character varying(255) | YES |  |

## uown_merchant_history

**Schema:** `public` | **Columns:** 155

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `rev` | integer | NO |  |
| 3 | `revtype` | smallint | YES |  |
| 4 | `agent` | character varying(255) | YES |  |
| 5 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 6 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 7 | `tenant_id` | bigint | YES |  |
| 8 | `web_user_id` | bigint | YES |  |
| 9 | `allow_auto_decision` | boolean | YES |  |
| 10 | `allow_close_on_iframe` | boolean | YES |  |
| 11 | `allow_location_change_for_merchant_site_user` | boolean | YES |  |
| 12 | `allow_remote_sign` | boolean | YES |  |
| 13 | `allowed_frequencies` | text | YES |  |
| 14 | `alt_contact_email` | character varying(255) | YES |  |
| 15 | `alt_contact_fax` | character varying(15) | YES |  |
| 16 | `alt_contact_name` | character varying(255) | YES |  |
| 17 | `alt_contact_phone` | character varying(15) | YES |  |
| 18 | `api_key` | character varying(255) | YES |  |
| 19 | `buy_group` | character varying(255) | YES |  |
| 20 | `buy_group_member` | boolean | YES |  |
| 21 | `buy_group_name` | character varying(255) | YES |  |
| 22 | `category` | character varying(255) | YES |  |
| 23 | `charge_processing_fee_before_esign` | boolean | YES |  |
| 24 | `city` | character varying(255) | YES |  |
| 25 | `client_type` | character varying(255) | YES |  |
| 26 | `country` | character varying(255) | YES |  |
| 27 | `county` | character varying(255) | YES |  |
| 28 | `dealer_discount_override` | numeric | YES |  |
| 29 | `dealer_rebate_override` | numeric | YES |  |
| 30 | `dealer_rebate_type` | character varying(255) | YES |  |
| 31 | `default_loan_amount` | numeric | YES |  |
| 32 | `default_months_at_employer` | integer | YES |  |
| 33 | `delivery_receipt_id` | character varying(255) | YES |  |
| 34 | `do_not_allow_new_apps` | boolean | YES |  |
| 35 | `dte_corp_training` | timestamp without time zone | YES |  |
| 36 | `dte_dealer_app_rcvd` | timestamp without time zone | YES |  |
| 37 | `dte_dealer_kit_ship` | timestamp without time zone | YES |  |
| 38 | `dte_setup_in_crm` | timestamp without time zone | YES |  |
| 39 | `esign_mode` | character varying(255) | YES |  |
| 40 | `exclude_from_reports` | boolean | YES |  |
| 41 | `fax` | character varying(15) | YES |  |
| 42 | `fed_tax_id` | character varying(9) | YES |  |
| 43 | `hold_deposit` | boolean | YES |  |
| 44 | `independent_rep_code` | character varying(255) | YES |  |
| 45 | `inventory_category` | character varying(255) | YES |  |
| 46 | `is_hidden` | boolean | YES |  |
| 47 | `is_intellicheck_required` | boolean | YES |  |
| 48 | `is_redirect_url_branded` | boolean | YES |  |
| 49 | `latitude` | character varying(20) | YES |  |
| 50 | `legal_name` | character varying(255) | YES |  |
| 51 | `location_address1` | character varying(255) | YES |  |
| 52 | `location_address2` | character varying(255) | YES |  |
| 53 | `location_name` | character varying(255) | YES |  |
| 54 | `longitude` | character varying(20) | YES |  |
| 55 | `merchant_name` | character varying(255) | YES |  |
| 56 | `merchant_type` | character varying(255) | YES |  |
| 57 | `merchant_url` | character varying(255) | YES |  |
| 58 | `num_days_approval_exp` | integer | YES |  |
| 59 | `num_days_lease_doc_exp` | integer | YES |  |
| 60 | `off_peak_campaign_id` | integer | YES |  |
| 61 | `owner_name` | character varying(255) | YES |  |
| 62 | `ownership_type` | character varying(255) | YES |  |
| 63 | `peak_campaign_id` | integer | YES |  |
| 64 | `phone_number` | character varying(15) | YES |  |
| 65 | `plat_form_fee_type` | character varying(255) | YES |  |
| 66 | `platform_fee` | numeric | YES |  |
| 67 | `post_message` | boolean | YES |  |
| 68 | `primary_contact_email` | character varying(255) | YES |  |
| 69 | `primary_contact_fax` | character varying(15) | YES |  |
| 70 | `primary_contact_name` | character varying(255) | YES |  |
| 71 | `primary_contact_phone` | character varying(15) | YES |  |
| 72 | `priority` | integer | YES |  |
| 73 | `ref_company_id` | character varying(255) | YES |  |
| 74 | `ref_location_id` | character varying(255) | YES |  |
| 75 | `ref_merchant_code` | character varying(255) | YES |  |
| 76 | `remove_parent_or_top_on_iframe` | boolean | YES |  |
| 77 | `sales_rep_code` | character varying(255) | YES |  |
| 78 | `scoring_company_group` | character varying(2) | YES |  |
| 79 | `show_payroll_and_prepaid_card_on_application` | boolean | YES |  |
| 80 | `show_report_menu_item_on_merchant_site` | boolean | YES |  |
| 81 | `show_weekly_status_report` | boolean | YES |  |
| 82 | `state` | character varying(255) | YES |  |
| 83 | `store_timings` | character varying(3000) | YES |  |
| 84 | `tax_rate` | numeric | YES |  |
| 85 | `tax_zone` | character varying(10) | YES |  |
| 86 | `use_customer_state_for_lease_and_sales_tax` | boolean | YES |  |
| 87 | `username` | character varying(255) | YES |  |
| 88 | `valid_states` | text | YES |  |
| 89 | `zip_code` | character varying(255) | YES |  |
| 90 | `check_uw_for_verification` | boolean | YES |  |
| 91 | `comment` | text | YES |  |
| 92 | `is_active` | boolean | YES |  |
| 93 | `allow_change_to_expired` | boolean | YES |  |
| 94 | `esign_client` | character varying(255) | YES |  |
| 95 | `is_fraud_check_required` | boolean | YES |  |
| 96 | `verify_email` | boolean | YES |  |
| 97 | `verify_ip` | boolean | YES |  |
| 98 | `verify_phone` | boolean | YES |  |
| 99 | `check_fraud_fingerprint` | boolean | YES |  |
| 100 | `cloned_from` | bigint | YES |  |
| 101 | `cloned_from_name` | character varying(255) | YES |  |
| 102 | `is_ach_required` | boolean | YES |  |
| 103 | `is_cc_required` | boolean | YES |  |
| 104 | `is_fpd_required` | boolean | YES |  |
| 105 | `is_signed_to_funding` | boolean | YES |  |
| 106 | `run_address_verification` | boolean | YES |  |
| 107 | `use_webhook` | boolean | YES |  |
| 108 | `approval_amount_increase` | numeric | YES |  |
| 109 | `verify_phone_before_signing` | boolean | YES |  |
| 110 | `charge_processing_fee` | boolean | YES |  |
| 111 | `accept_new_apps` | boolean | YES |  |
| 112 | `buyout_fee` | numeric | YES |  |
| 113 | `funding_report_emails` | text | YES |  |
| 114 | `funding_report_frequency` | text | YES |  |
| 115 | `is_bank_verification_required` | boolean | YES |  |
| 116 | `is_deleted` | boolean | YES |  |
| 117 | `lending_category_list` | text | YES |  |
| 118 | `send_automated_funding_report` | boolean | YES |  |
| 119 | `tax_exempted_states` | character varying(255) | YES |  |
| 120 | `webhook_url` | text | YES |  |
| 121 | `use_neustar` | boolean | YES |  |
| 122 | `use_sentilink` | boolean | YES |  |
| 123 | `send_finalize_notice` | boolean | YES |  |
| 124 | `record_signing_flow` | boolean | YES |  |
| 125 | `return_lambda_score` | boolean | YES |  |
| 126 | `cc_processing_fee_percent` | numeric | YES |  |
| 127 | `is_item_split` | boolean | YES |  |
| 128 | `merchant_support` | character varying(255) | YES |  |
| 129 | `remove_merchant_from_users` | boolean | YES |  |
| 130 | `use_lexis_nexis` | boolean | YES |  |
| 131 | `use_neuro_id_check` | boolean | YES |  |
| 132 | `funding_exception` | boolean | YES |  |
| 133 | `five_day_funding_exception` | boolean | YES |  |
| 134 | `two_day_funding_exception` | boolean | YES |  |
| 135 | `merged_funding_report_emails` | text | YES |  |
| 136 | `merged_funding_report_frequency` | text | YES |  |
| 137 | `send_merged_funding_report` | boolean | YES |  |
| 138 | `send_merchant_portal_url_as_provider` | boolean | YES |  |
| 139 | `offer_insurance` | boolean | YES |  |
| 140 | `auto_deny_application` | boolean | YES |  |
| 141 | `termination_reason` | character varying(255) | YES |  |
| 142 | `minimum_lease_amount` | numeric | YES |  |
| 143 | `is_seon_id_check_required` | boolean | YES |  |
| 144 | `is_plaid_verification_required` | boolean | YES |  |
| 145 | `epo10` | boolean | YES |  |
| 146 | `epo5` | boolean | YES |  |
| 147 | `referral_fee` | numeric | YES |  |
| 148 | `referral_partner` | character varying(255) | YES |  |
| 149 | `integration_type` | character varying(20) | YES |  |
| 150 | `uw_pipeline` | character varying(10) | YES |  |
| 151 | `fraud_threshold` | integer | YES |  |
| 152 | `max_approval_amount` | numeric | YES |  |
| 153 | `primary_contact_mobile` | character varying(15) | YES |  |
| 154 | `alt_contact_mobile` | character varying(15) | YES |  |
| 155 | `hold_funding` | boolean | YES | false |

## uown_merchant_program

**Schema:** `public` | **Columns:** 30

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_merchant_program_pk_seq'::regclass) |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `charge_app_fee_if_delivery_is_zero` | boolean | YES |  |
| 6 | `dealer_discount` | numeric | YES |  |
| 7 | `dealer_rebate` | numeric | YES |  |
| 8 | `epo_days` | integer | YES |  |
| 9 | `max_dollar_amount` | numeric | YES |  |
| 10 | `money_factor` | numeric | YES |  |
| 11 | `payoff_discount` | numeric | YES |  |
| 12 | `program_id` | character varying(255) | YES |  |
| 13 | `program_name` | character varying(255) | YES |  |
| 14 | `program_type` | character varying(255) | YES |  |
| 15 | `quick_pay_pct` | numeric | YES |  |
| 16 | `states` | text | YES |  |
| 17 | `term_months` | integer | YES |  |
| 18 | `epo_fee_percent` | numeric | YES |  |
| 19 | `lending_category_type` | character varying(255) | YES |  |
| 20 | `max_cart_amount` | numeric | YES |  |
| 21 | `min_cart_amount` | numeric | YES |  |
| 22 | `off_peak_campaign_id` | integer | YES |  |
| 23 | `peak_campaign_id` | integer | YES |  |
| 24 | `allowed_frequency_override` | character varying(255) | YES |  |
| 25 | `processing_fee_override` | numeric | YES |  |
| 26 | `amount_charged_at_signing` | numeric | YES |  |
| 27 | `group_name` | character varying(255) | YES |  |
| 28 | `activation_date` | date | YES |  |
| 29 | `deactivation_date` | date | YES |  |
| 30 | `is_active` | boolean | NO | true |

## uown_merchant_to_program

**Schema:** `public` | **Columns:** 9

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_merchant_to_program_pk_seq'::regclass) |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `is_active` | boolean | YES |  |
| 6 | `merchant_name` | character varying(255) | YES |  |
| 7 | `program_name` | character varying(255) | YES |  |
| 8 | `merchant_pk` | bigint | YES |  |
| 9 | `program_pk` | bigint | YES |  |

## uown_neuro_id_verification

**Schema:** `public` | **Columns:** 13

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `error_message` | text | YES |  |
| 6 | `identity` | character varying(255) | YES |  |
| 7 | `lead_pk` | bigint | YES |  |
| 8 | `neuro_id_status` | character varying(255) | YES |  |
| 9 | `notes` | text | YES |  |
| 10 | `status` | character varying(255) | YES |  |
| 11 | `success` | boolean | YES |  |
| 12 | `caller` | character varying(255) | YES |  |
| 13 | `site_id` | character varying(255) | YES |  |

## uown_neuro_id_verification_attributes

**Schema:** `public` | **Columns:** 4

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `label` | character varying(255) | YES |  |
| 3 | `model` | character varying(255) | YES |  |
| 4 | `score` | numeric | YES |  |

## uown_neustar

**Schema:** `public` | **Columns:** 48

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `address_to_phone` | integer | YES |  |
| 8 | `declined_reasons` | character varying(255) | YES |  |
| 9 | `email_first_active` | character varying(255) | YES |  |
| 10 | `email_found` | character varying(255) | YES |  |
| 11 | `email_last_active` | character varying(255) | YES |  |
| 12 | `email_to_address` | integer | YES |  |
| 13 | `email_to_name` | integer | YES |  |
| 14 | `email_to_phone` | integer | YES |  |
| 15 | `email_validation_code` | character varying(255) | YES |  |
| 16 | `error_message` | character varying(255) | YES |  |
| 17 | `ip_confidence_score` | integer | YES |  |
| 18 | `is_approved` | boolean | YES |  |
| 19 | `is_moved_to_seon` | boolean | YES |  |
| 20 | `lead_pk` | bigint | YES |  |
| 21 | `name_change` | integer | YES |  |
| 22 | `name_change_type` | integer | YES |  |
| 23 | `num_name_change` | integer | YES |  |
| 24 | `phone_to_first_name` | integer | YES |  |
| 25 | `phone_to_name` | integer | YES |  |
| 26 | `prison` | character varying(255) | YES |  |
| 27 | `rdpi` | character varying(255) | YES |  |
| 28 | `result_code` | character varying(255) | YES |  |
| 29 | `usps_type` | character varying(255) | YES |  |
| 30 | `vacancy` | character varying(255) | YES |  |
| 31 | `verified_components` | integer | YES |  |
| 32 | `address_to_name` | integer | YES |  |
| 33 | `city` | character varying(255) | YES |  |
| 34 | `data_requested` | character varying(255) | YES |  |
| 35 | `dpv_confirm` | character varying(255) | YES |  |
| 36 | `email` | character varying(255) | YES |  |
| 37 | `name` | character varying(255) | YES |  |
| 38 | `phone_valid` | character varying(255) | YES |  |
| 39 | `phones` | character varying(255) | YES |  |
| 40 | `postal` | character varying(255) | YES |  |
| 41 | `prepaid` | character varying(255) | YES |  |
| 42 | `rbdi` | character varying(255) | YES |  |
| 43 | `service_tenure` | integer | YES |  |
| 44 | `state` | character varying(255) | YES |  |
| 45 | `street_address` | character varying(255) | YES |  |
| 46 | `usage2mo` | integer | YES |  |
| 47 | `nsr` | character varying(255) | YES |  |
| 48 | `raw_response` | text | YES |  |

## uown_pay_near_me_attempt

**Schema:** `public` | **Columns:** 13

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_pay_near_me_attempt_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES | now() |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `endpoint_name` | character varying(128) | NO |  |
| 8 | `business_action` | character varying(256) | NO |  |
| 9 | `account_pk` | bigint | YES |  |
| 10 | `site_order_identifier` | character varying(128) | YES |  |
| 11 | `pnm_order_identifier` | character varying(64) | YES |  |
| 12 | `success` | boolean | YES |  |
| 13 | `error_summary` | character varying(1024) | YES |  |

## uown_pay_near_me_inbound_api_log

**Schema:** `public` | **Columns:** 16

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_pay_near_me_inbound_api_log_pk_seq'::regclass) |
| 2 | `tenant_id` | bigint | YES |  |
| 3 | `web_user_id` | bigint | YES |  |
| 4 | `agent` | character varying(255) | YES |  |
| 5 | `row_created_timestamp` | timestamp without time zone | YES | now() |
| 6 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 7 | `controller_class` | character varying(128) | YES |  |
| 8 | `request_path` | text | YES |  |
| 9 | `http_method` | character varying(16) | YES |  |
| 10 | `query_string` | text | YES |  |
| 11 | `request_headers` | text | YES |  |
| 12 | `request_body` | text | YES |  |
| 13 | `response_status` | integer | YES |  |
| 14 | `response_body` | text | YES |  |
| 15 | `stack_trace` | text | YES |  |
| 16 | `remote_ip` | character varying(64) | YES |  |

## uown_pay_near_me_order

**Schema:** `public` | **Columns:** 11

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_pay_near_me_order_pk_seq'::regclass) |
| 2 | `account_pk` | bigint | NO |  |
| 3 | `tenant_id` | bigint | YES |  |
| 4 | `web_user_id` | bigint | YES |  |
| 5 | `agent` | character varying(255) | YES |  |
| 6 | `site_order_identifier` | character varying(128) | NO |  |
| 7 | `site_customer_identifier` | character varying(128) | NO |  |
| 8 | `pnm_order_identifier` | character varying(64) | YES |  |
| 9 | `last_order_amount` | numeric | YES |  |
| 10 | `row_created_timestamp` | timestamp without time zone | YES | now() |
| 11 | `row_updated_timestamp` | timestamp without time zone | YES |  |

## uown_pay_near_me_order_change_callback

**Schema:** `public` | **Columns:** 41

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_pay_near_me_order_change_callback_pk_seq'::regclass) |
| 2 | `row_created_timestamp` | timestamp without time zone | YES | now() |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `web_user_id` | bigint | YES |  |
| 6 | `agent` | character varying(255) | YES |  |
| 7 | `account_pk` | bigint | YES |  |
| 8 | `site_identifier` | character varying(64) | YES |  |
| 9 | `site_customer_identifier` | character varying(128) | YES |  |
| 10 | `site_order_identifier` | character varying(128) | YES |  |
| 11 | `pnm_order_identifier` | character varying(64) | YES |  |
| 12 | `payee_identifier` | character varying(64) | YES |  |
| 13 | `origin` | character varying(128) | YES |  |
| 14 | `version` | character varying(16) | YES |  |
| 15 | `callback_timestamp` | timestamp without time zone | YES |  |
| 16 | `change_event_name` | character varying(128) | YES |  |
| 17 | `has_auto_pay_json` | boolean | YES |  |
| 18 | `has_ptp_pay_json` | boolean | YES |  |
| 19 | `auto_pay_identifier` | character varying(64) | YES |  |
| 20 | `auto_pay_status` | character varying(64) | YES |  |
| 21 | `auto_pay_payment_type` | character varying(64) | YES |  |
| 22 | `auto_pay_amount` | numeric | YES |  |
| 23 | `auto_pay_frequency` | character varying(32) | YES |  |
| 24 | `auto_pay_schedule` | character varying(128) | YES |  |
| 25 | `auto_pay_date` | timestamp without time zone | YES |  |
| 26 | `auto_pay_created` | timestamp without time zone | YES |  |
| 27 | `auto_pay_canceled` | timestamp without time zone | YES |  |
| 28 | `auto_pay_duration_type` | character varying(32) | YES |  |
| 29 | `auto_pay_end_date` | timestamp without time zone | YES |  |
| 30 | `auto_pay_means` | character varying(128) | YES |  |
| 31 | `auto_pay_number_of_payments_completed` | integer | YES |  |
| 32 | `auto_pay_number_of_payments_skipped` | integer | YES |  |
| 33 | `ptp_count` | integer | YES |  |
| 34 | `ptp_identifier` | character varying(64) | YES |  |
| 35 | `ptp_status` | character varying(64) | YES |  |
| 36 | `ptp_payment_type` | character varying(64) | YES |  |
| 37 | `ptp_amount` | numeric | YES |  |
| 38 | `ptp_date` | timestamp without time zone | YES |  |
| 39 | `ptp_created` | timestamp without time zone | YES |  |
| 40 | `ptp_canceled` | timestamp without time zone | YES |  |
| 41 | `ptp_means` | character varying(128) | YES |  |

## uown_pay_near_me_outbound_api_log

**Schema:** `public` | **Columns:** 14

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_pay_near_me_outbound_api_log_pk_seq'::regclass) |
| 2 | `tenant_id` | bigint | YES |  |
| 3 | `web_user_id` | bigint | YES |  |
| 4 | `agent` | character varying(255) | YES |  |
| 5 | `row_created_timestamp` | timestamp without time zone | YES | now() |
| 6 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 7 | `json_api_endpoint` | character varying(64) | YES |  |
| 8 | `request_url` | text | YES |  |
| 9 | `http_method` | character varying(16) | YES |  |
| 10 | `request_headers` | text | YES |  |
| 11 | `request_body` | text | YES |  |
| 12 | `http_status` | integer | YES |  |
| 13 | `response_body` | text | YES |  |
| 14 | `stack_trace` | text | YES |  |

## uown_pay_near_me_payment_callback

**Schema:** `public` | **Columns:** 26

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_pay_near_me_payment_callback_pk_seq'::regclass) |
| 2 | `row_created_timestamp` | timestamp without time zone | YES | now() |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `web_user_id` | bigint | YES |  |
| 6 | `agent` | character varying(255) | YES |  |
| 7 | `account_pk` | bigint | YES |  |
| 8 | `callback_type` | character varying(64) | NO |  |
| 9 | `pnm_payment_identifier` | character varying(128) | YES |  |
| 10 | `pnm_order_identifier` | character varying(64) | YES |  |
| 11 | `site_order_identifier` | character varying(128) | YES |  |
| 12 | `status` | character varying(64) | YES |  |
| 13 | `payment_type` | character varying(64) | YES |  |
| 14 | `payment_card_type` | character varying(64) | YES |  |
| 15 | `payment_card_last4` | character varying(128) | YES |  |
| 16 | `settlement_method` | character varying(64) | YES |  |
| 17 | `payment_timestamp` | timestamp without time zone | YES |  |
| 18 | `amount` | numeric | YES |  |
| 19 | `pnm_processing_fee` | numeric | YES |  |
| 20 | `chargeback_status` | character varying(64) | YES |  |
| 21 | `chargeback_code` | character varying(128) | YES |  |
| 22 | `reverse_type` | character varying(64) | YES |  |
| 23 | `reverse_amount` | numeric | YES |  |
| 24 | `reverse_code` | character varying(64) | YES |  |
| 25 | `reverse_reason` | character varying(256) | YES |  |
| 26 | `reverse_date` | timestamp without time zone | YES |  |

## uown_paywallet

**Schema:** `public` | **Columns:** 25

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `account_pk` | bigint | YES |  |
| 6 | `clear_request_id` | character varying(255) | YES |  |
| 7 | `error` | character varying(255) | YES |  |
| 8 | `lead_pk` | bigint | YES |  |
| 9 | `notes` | text | YES |  |
| 10 | `affordability_sent_timestamp` | timestamp without time zone | YES |  |
| 11 | `employer` | character varying(255) | YES |  |
| 12 | `first_name` | character varying(255) | YES |  |
| 13 | `funds_available_for_allocation` | numeric | YES |  |
| 14 | `last_name` | character varying(255) | YES |  |
| 15 | `last_salary_payment_date` | date | YES |  |
| 16 | `net_salary_last_paid` | numeric | YES |  |
| 17 | `salary_frequency` | character varying(255) | YES |  |
| 18 | `allocation_received_timestamp` | timestamp without time zone | YES |  |
| 19 | `allocation_sent_timestamp` | timestamp without time zone | YES |  |
| 20 | `client_contract_reference` | character varying(255) | YES |  |
| 21 | `contract_id` | character varying(255) | YES |  |
| 22 | `installment_amount` | numeric | YES |  |
| 23 | `payroll_frequency` | character varying(255) | YES |  |
| 24 | `status` | character varying(255) | YES |  |
| 25 | `request_id` | character varying(255) | YES |  |

## uown_paywallet_history

**Schema:** `public` | **Columns:** 24

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `rev` | integer | NO |  |
| 3 | `revtype` | smallint | YES |  |
| 4 | `account_pk` | bigint | YES |  |
| 5 | `clear_request_id` | character varying(255) | YES |  |
| 6 | `error` | character varying(255) | YES |  |
| 7 | `lead_pk` | bigint | YES |  |
| 8 | `notes` | text | YES |  |
| 9 | `affordability_sent_timestamp` | timestamp without time zone | YES |  |
| 10 | `employer` | character varying(255) | YES |  |
| 11 | `first_name` | character varying(255) | YES |  |
| 12 | `funds_available_for_allocation` | numeric | YES |  |
| 13 | `last_name` | character varying(255) | YES |  |
| 14 | `last_salary_payment_date` | date | YES |  |
| 15 | `net_salary_last_paid` | numeric | YES |  |
| 16 | `salary_frequency` | character varying(255) | YES |  |
| 17 | `allocation_received_timestamp` | timestamp without time zone | YES |  |
| 18 | `allocation_sent_timestamp` | timestamp without time zone | YES |  |
| 19 | `client_contract_reference` | character varying(255) | YES |  |
| 20 | `contract_id` | character varying(255) | YES |  |
| 21 | `installment_amount` | numeric | YES |  |
| 22 | `payroll_frequency` | character varying(255) | YES |  |
| 23 | `status` | character varying(255) | YES |  |
| 24 | `request_id` | character varying(255) | YES |  |

## uown_paywallet_outbound_api_log

**Schema:** `public` | **Columns:** 15

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `api` | character varying(255) | YES |  |
| 8 | `call_type` | character varying(255) | YES |  |
| 9 | `header` | text | YES |  |
| 10 | `request` | text | YES |  |
| 11 | `request_object` | text | YES |  |
| 12 | `response` | text | YES |  |
| 13 | `source` | character varying(255) | YES |  |
| 14 | `stack_trace` | text | YES |  |
| 15 | `url` | text | YES |  |

## uown_plaid_report

**Schema:** `public` | **Columns:** 12

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_plaid_report_pk_seq'::regclass) |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `code` | character varying(255) | YES |  |
| 6 | `data` | text | YES |  |
| 7 | `lead_pk` | bigint | NO |  |
| 8 | `product` | character varying(255) | YES |  |
| 9 | `base_report` | text | YES |  |
| 10 | `cash_score` | integer | YES |  |
| 11 | `partner_insights` | text | YES |  |
| 12 | `extend_score` | integer | YES |  |

## uown_plaid_user

**Schema:** `public` | **Columns:** 8

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_plaid_user_pk_seq'::regclass) |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `info` | text | YES |  |
| 6 | `lead_pk` | bigint | NO |  |
| 7 | `user_id` | character varying(255) | YES |  |
| 8 | `user_token` | character varying(255) | YES |  |

## uown_podium_token

**Schema:** `public` | **Columns:** 7

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `access_token` | character varying(3000) | YES |  |
| 6 | `refresh_token` | character varying(3000) | YES |  |
| 7 | `expiration_time` | timestamp with time zone | YES |  |

## uown_revinfo

**Schema:** `public` | **Columns:** 2

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `rev` | integer | NO |  |
| 2 | `revtstmp` | bigint | YES |  |

## uown_right_foot_balance_check

**Schema:** `public` | **Columns:** 19

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_right_foot_balance_check_pk_seq'::regclass) |
| 2 | `authorizer_unique_id` | character varying(255) | NO |  |
| 3 | `account_pk` | bigint | NO |  |
| 4 | `batch_id` | character varying(64) | YES |  |
| 5 | `account_number` | character varying(64) | YES |  |
| 6 | `routing_number` | character varying(16) | YES |  |
| 7 | `requested_amount` | numeric | YES |  |
| 8 | `balance` | numeric | YES |  |
| 9 | `status` | character varying(64) | YES |  |
| 10 | `failure_reason` | text | YES |  |
| 11 | `process_type` | character varying(255) | YES |  |
| 12 | `request_timestamp` | timestamp without time zone | YES |  |
| 13 | `response_timestamp` | timestamp without time zone | YES |  |
| 14 | `row_created_timestamp` | timestamp without time zone | YES | CURRENT_TIMESTAMP |
| 15 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 16 | `tenant_id` | bigint | YES |  |
| 17 | `agent` | character varying(255) | YES |  |
| 18 | `web_user_id` | bigint | YES |  |
| 19 | `batch_pk` | bigint | YES |  |

## uown_right_foot_batch

**Schema:** `public` | **Columns:** 13

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_right_foot_batch_pk_seq'::regclass) |
| 2 | `batch_id` | character varying(255) | YES |  |
| 3 | `status` | character varying(255) | NO |  |
| 4 | `webhook_payload` | text | YES |  |
| 5 | `errors` | text | YES |  |
| 6 | `row_created_timestamp` | timestamp without time zone | YES | CURRENT_TIMESTAMP |
| 7 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 8 | `tenant_id` | bigint | YES |  |
| 9 | `agent` | character varying(255) | YES |  |
| 10 | `web_user_id` | bigint | YES |  |
| 11 | `webhook_payload_received_at` | timestamp without time zone | YES |  |
| 12 | `process_type` | character varying(255) | YES |  |
| 13 | `batch_complete_event_fired` | boolean | NO | false |

## uown_right_foot_outbound_api_log

**Schema:** `public` | **Columns:** 9

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `id` | bigint | NO | nextval('uown_right_foot_outbound_api_log_id_seq'::regclass) |
| 2 | `json_api_endpoint` | character varying(255) | YES |  |
| 3 | `request_url` | text | YES |  |
| 4 | `http_method` | character varying(16) | YES |  |
| 5 | `request_headers` | text | YES |  |
| 6 | `request_body` | text | YES |  |
| 7 | `http_status` | integer | YES |  |
| 8 | `response_body` | text | YES |  |
| 9 | `stack_trace` | text | YES |  |

## uown_scheduled_task

**Schema:** `public` | **Columns:** 16

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_scheduled_task_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `cron_trigger` | character varying(255) | YES |  |
| 8 | `fixed_rate` | bigint | YES |  |
| 9 | `is_active` | boolean | YES |  |
| 10 | `is_native_query` | boolean | YES |  |
| 11 | `last_trigger_time` | timestamp without time zone | YES |  |
| 12 | `scheduled_task_name` | character varying(255) | YES |  |
| 13 | `sql_to_pick_accounts` | text | YES |  |
| 14 | `template_name` | character varying(255) | YES |  |
| 15 | `template_version` | bigint | YES |  |
| 16 | `group_name` | character varying(255) | YES |  |

## uown_scheduled_task_history

**Schema:** `public` | **Columns:** 18

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `rev` | integer | NO |  |
| 3 | `revtype` | smallint | YES |  |
| 4 | `agent` | character varying(255) | YES |  |
| 5 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 6 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 7 | `tenant_id` | bigint | YES |  |
| 8 | `web_user_id` | bigint | YES |  |
| 9 | `cron_trigger` | character varying(255) | YES |  |
| 10 | `fixed_rate` | bigint | YES |  |
| 11 | `is_active` | boolean | YES |  |
| 12 | `is_native_query` | boolean | YES |  |
| 13 | `last_trigger_time` | timestamp without time zone | YES |  |
| 14 | `scheduled_task_name` | character varying(255) | YES |  |
| 15 | `sql_to_pick_accounts` | text | YES |  |
| 16 | `template_name` | character varying(255) | YES |  |
| 17 | `template_version` | bigint | YES |  |
| 18 | `group_name` | character varying(255) | YES |  |

## uown_scheduled_task_run

**Schema:** `public` | **Columns:** 11

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_scheduled_task_run_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `end_time` | timestamp without time zone | YES |  |
| 8 | `host_name` | character varying(255) | YES |  |
| 9 | `number_of_items_picked` | integer | YES |  |
| 10 | `start_time` | timestamp without time zone | YES |  |
| 11 | `task_name` | character varying(255) | YES |  |

## uown_second_opportunity_accounts

**Schema:** `public` | **Columns:** 27

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_second_opportunity_accounts_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `aba_number` | character varying(255) | YES |  |
| 8 | `account_number` | character varying(255) | YES |  |
| 9 | `address` | character varying(255) | YES |  |
| 10 | `cell_phone` | character varying(255) | YES |  |
| 11 | `clv` | numeric | YES |  |
| 12 | `credit_limit` | numeric | YES |  |
| 13 | `dl_number` | character varying(255) | YES |  |
| 14 | `dl_state` | character varying(255) | YES |  |
| 15 | `dob` | date | YES |  |
| 16 | `email` | character varying(255) | YES |  |
| 17 | `first_name` | character varying(255) | YES |  |
| 18 | `is_blacklisted` | boolean | YES |  |
| 19 | `is_organic_blacklisted` | boolean | YES |  |
| 20 | `is_whitelisted` | boolean | YES |  |
| 21 | `last_event_date` | date | YES |  |
| 22 | `last_name` | character varying(255) | YES |  |
| 23 | `max_price` | numeric | YES |  |
| 24 | `reason_code` | character varying(255) | YES |  |
| 25 | `rto_account_number` | bigint | YES |  |
| 26 | `ssn` | character varying(255) | YES |  |
| 27 | `zip` | character varying(255) | YES |  |

## uown_send_sv_ach_payment

**Schema:** `public` | **Columns:** 24

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_send_sv_ach_payment_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `ach_payment_pks` | text | YES |  |
| 8 | `ach_process_type` | character varying(255) | YES |  |
| 9 | `ach_type` | character varying(255) | YES |  |
| 10 | `creator_user_id` | integer | YES |  |
| 11 | `file_name` | character varying(255) | YES |  |
| 12 | `host_name` | character varying(255) | YES |  |
| 13 | `last_modified_user_id` | integer | YES |  |
| 14 | `message` | text | YES |  |
| 15 | `number_of_achrecords` | integer | YES |  |
| 16 | `payment_file_id` | integer | YES |  |
| 17 | `posting_date` | date | YES |  |
| 18 | `process_date` | date | YES |  |
| 19 | `response` | character varying(255) | YES |  |
| 20 | `source` | character varying(255) | YES |  |
| 21 | `status` | character varying(255) | YES |  |
| 22 | `vendor` | character varying(255) | YES |  |
| 23 | `vendor_achstatus` | character varying(255) | YES |  |
| 24 | `error` | text | YES |  |

## uown_sentilink

**Schema:** `public` | **Columns:** 32

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `address_line1` | character varying(255) | YES |  |
| 8 | `address_line2` | character varying(255) | YES |  |
| 9 | `application_created` | timestamp without time zone | YES |  |
| 10 | `application_id` | character varying(255) | YES |  |
| 11 | `city` | character varying(255) | YES |  |
| 12 | `country_code` | character varying(255) | YES |  |
| 13 | `dob` | date | YES |  |
| 14 | `email` | character varying(255) | YES |  |
| 15 | `first_name` | character varying(255) | YES |  |
| 16 | `ip_address` | character varying(255) | YES |  |
| 17 | `last_name` | character varying(255) | YES |  |
| 18 | `loan_amount` | numeric | YES |  |
| 19 | `loan_currency` | character varying(255) | YES |  |
| 20 | `phone` | character varying(255) | YES |  |
| 21 | `ssn` | character varying(255) | YES |  |
| 22 | `state_code` | character varying(255) | YES |  |
| 23 | `user_id` | character varying(255) | YES |  |
| 24 | `zipcode` | character varying(255) | YES |  |
| 25 | `customer_id` | character varying(255) | YES |  |
| 26 | `environment` | character varying(255) | YES |  |
| 27 | `error` | text | YES |  |
| 28 | `extra_data` | text | YES |  |
| 29 | `lead_pk` | bigint | YES |  |
| 30 | `notes` | character varying(255) | YES |  |
| 31 | `approved` | boolean | YES |  |
| 32 | `raw_response` | text | YES |  |

## uown_sentilink_reason_code

**Schema:** `public` | **Columns:** 11

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `code` | character varying(255) | YES |  |
| 8 | `direction` | character varying(255) | YES |  |
| 9 | `explanation` | character varying(255) | YES |  |
| 10 | `rank` | integer | YES |  |
| 11 | `sentilink_score_pk` | bigint | YES |  |

## uown_sentilink_score

**Schema:** `public` | **Columns:** 10

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `score` | integer | YES |  |
| 8 | `score_name` | character varying(255) | YES |  |
| 9 | `version` | character varying(255) | YES |  |
| 10 | `sentilink_pk` | bigint | YES |  |

## uown_seon

**Schema:** `public` | **Columns:** 20

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_seon_pk_seq'::regclass) |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `birth_date` | date | YES |  |
| 6 | `date_of_birth_result` | character varying(255) | YES |  |
| 7 | `document_expiration_date` | date | YES |  |
| 8 | `document_type` | character varying(255) | YES |  |
| 9 | `error` | character varying(255) | YES |  |
| 10 | `full_name` | character varying(255) | YES |  |
| 11 | `id_verify_success` | boolean | YES |  |
| 12 | `lead_pk` | bigint | NO |  |
| 13 | `name_match_check_result` | character varying(255) | YES |  |
| 14 | `postal_code_result` | character varying(255) | YES |  |
| 15 | `reference_id` | character varying(255) | YES |  |
| 16 | `results` | text | YES |  |
| 17 | `stacktrace` | text | YES |  |
| 18 | `state_check_result` | character varying(255) | YES |  |
| 19 | `status` | character varying(255) | YES |  |
| 20 | `success` | boolean | YES |  |

## uown_sms_attachment

**Schema:** `public` | **Columns:** 13

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `web_user_id` | bigint | YES |  |
| 6 | `attachment_type` | character varying(255) | YES |  |
| 7 | `content` | bytea | YES |  |
| 8 | `content_base64string` | text | YES |  |
| 9 | `content_id` | character varying(255) | YES |  |
| 10 | `disposition` | character varying(255) | YES |  |
| 11 | `name` | character varying(255) | YES |  |
| 12 | `template_name` | character varying(255) | YES |  |
| 13 | `sms_queue_pk` | bigint | YES |  |

## uown_sms_queue

**Schema:** `public` | **Columns:** 34

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_sms_queue_pk_seq'::regclass) |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `web_user_id` | bigint | YES |  |
| 6 | `account_pk` | bigint | YES |  |
| 7 | `created_by` | character varying(255) | YES |  |
| 8 | `customer_pk` | bigint | YES |  |
| 9 | `data_map` | text | YES |  |
| 10 | `error_desc` | text | YES |  |
| 11 | `lead_pk` | bigint | YES |  |
| 12 | `location` | character varying(255) | YES |  |
| 13 | `merchant_pk` | bigint | YES |  |
| 14 | `picked_at_time` | timestamp without time zone | YES |  |
| 15 | `priority` | integer | YES |  |
| 16 | `queue_type` | character varying(255) | YES |  |
| 17 | `send_by_time` | timestamp without time zone | YES |  |
| 18 | `sent_time` | timestamp without time zone | YES |  |
| 19 | `status` | character varying(255) | YES |  |
| 20 | `template_name` | character varying(255) | YES |  |
| 21 | `template_version` | bigint | YES |  |
| 22 | `from_phone_number` | character varying(255) | YES |  |
| 23 | `has_attachments` | boolean | YES |  |
| 24 | `response` | text | YES |  |
| 25 | `sent_from_server` | character varying(255) | YES |  |
| 26 | `sms_body` | text | NO |  |
| 27 | `to_phone_number` | character varying(255) | NO |  |
| 28 | `message_id` | character varying(255) | YES |  |
| 29 | `sms_vendor` | integer | YES |  |
| 30 | `vendor_auth_token` | character varying(255) | YES |  |
| 31 | `vendor_username` | character varying(255) | YES |  |
| 32 | `id` | character varying(255) | YES |  |
| 33 | `sms_delivery_status` | character varying(64) | YES |  |
| 34 | `sms_delivery_error_code` | character varying(64) | YES |  |

## uown_state_configurations

**Schema:** `public` | **Columns:** 17

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_state_configurations_pk_seq'::regclass) |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `max_cost_price_based_on_amount` | boolean | YES |  |
| 6 | `max_cost_price_based_on_merchandise` | boolean | YES |  |
| 7 | `max_cost_price_factor` | numeric | YES |  |
| 8 | `max_processing_and_delivery_fee` | numeric | YES |  |
| 9 | `nsf` | numeric | YES |  |
| 10 | `processing_fee` | numeric | YES |  |
| 11 | `processing_fee_or_delivery_fee` | boolean | YES |  |
| 12 | `recycle_fee` | numeric | YES |  |
| 13 | `state` | character varying(255) | YES |  |
| 14 | `state_abbreviation` | character varying(255) | YES |  |
| 15 | `security_deposit` | numeric | YES |  |
| 16 | `discount_on_paid` | numeric | YES |  |
| 17 | `epo_discount` | numeric | YES |  |

## uown_state_configurations_log

**Schema:** `public` | **Columns:** 8

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_state_configurations_log_pk_seq'::regclass) |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `created_by` | character varying(255) | YES |  |
| 6 | `log_type` | character varying(255) | YES |  |
| 7 | `notes` | text | YES |  |
| 8 | `state_pk` | bigint | YES |  |

## uown_sticky

**Schema:** `public` | **Columns:** 15

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `web_user_id` | bigint | YES |  |
| 6 | `agent` | character varying(255) | YES |  |
| 7 | `account_pk` | bigint | YES |  |
| 8 | `cc_transaction_pk` | bigint | YES |  |
| 9 | `number_of_attempts` | integer | NO | 0 |
| 10 | `external_id` | character varying(128) | YES |  |
| 11 | `sticky_transaction_id` | character varying(128) | YES |  |
| 12 | `status` | character varying(64) | YES |  |
| 13 | `recovery_status` | character varying(32) | YES |  |
| 14 | `dunning_profile_id` | character varying(128) | YES |  |
| 15 | `last_retry_attempt_time` | timestamp without time zone | YES |  |

## uown_sticky_inbound_log

**Schema:** `public` | **Columns:** 17

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `web_user_id` | bigint | YES |  |
| 6 | `agent` | character varying(255) | YES |  |
| 7 | `event_type` | character varying(64) | YES |  |
| 8 | `event_time` | timestamp without time zone | YES |  |
| 9 | `dedupe_key` | character varying(256) | YES |  |
| 10 | `raw_body` | text | YES |  |
| 11 | `decrypted_json` | text | YES |  |
| 12 | `sticky_pk` | bigint | YES |  |
| 13 | `status` | character varying(32) | NO |  |
| 14 | `error_message` | text | YES |  |
| 15 | `response` | text | YES |  |
| 16 | `stack_trace` | text | YES |  |
| 17 | `source` | character varying(64) | YES |  |

## uown_sticky_outbound_log

**Schema:** `public` | **Columns:** 13

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `web_user_id` | bigint | YES |  |
| 6 | `agent` | character varying(255) | YES |  |
| 7 | `sticky_pk` | bigint | YES |  |
| 8 | `account_pk` | bigint | YES |  |
| 9 | `request` | text | YES |  |
| 10 | `response` | text | YES |  |
| 11 | `header` | text | YES |  |
| 12 | `stack_trace` | text | YES |  |
| 13 | `source` | character varying(255) | YES |  |

## uown_sticky_retry_attempt

**Schema:** `public` | **Columns:** 16

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `web_user_id` | bigint | YES |  |
| 6 | `agent` | character varying(255) | YES |  |
| 7 | `sticky_pk` | bigint | NO |  |
| 8 | `attempt_number` | integer | NO |  |
| 9 | `http_status` | integer | YES |  |
| 10 | `retry_status` | character varying(16) | YES |  |
| 11 | `failure_reason` | text | YES |  |
| 12 | `error_summary` | text | YES |  |
| 13 | `dunning_profile_id` | character varying(128) | YES |  |
| 14 | `gateway_transaction_id` | character varying(128) | YES |  |
| 15 | `amount` | character varying(64) | YES |  |
| 16 | `retry_attempt_time` | timestamp without time zone | YES |  |

## uown_sticky_webhook_dedupe

**Schema:** `public` | **Columns:** 7

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `web_user_id` | bigint | YES |  |
| 6 | `agent` | character varying(255) | YES |  |
| 7 | `dedupe_key` | character varying(256) | NO |  |

## uown_stored_doc

**Schema:** `public` | **Columns:** 30

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_stored_doc_pk_seq'::regclass) |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `web_user_id` | bigint | YES |  |
| 6 | `account_pk` | bigint | YES |  |
| 7 | `agent_name` | character varying(255) | YES |  |
| 8 | `attachment_path` | character varying(255) | YES |  |
| 9 | `attachment_type` | character varying(255) | YES |  |
| 10 | `correspondence_type` | character varying(255) | YES |  |
| 11 | `customer_pk` | bigint | YES |  |
| 12 | `description` | text | YES |  |
| 13 | `document_group` | character varying(255) | YES |  |
| 14 | `email_address` | text | YES |  |
| 15 | `email_queue_pk` | bigint | YES |  |
| 16 | `esign_document_pk` | bigint | YES |  |
| 17 | `file_temp_link` | text | YES |  |
| 18 | `is_active` | boolean | YES |  |
| 19 | `is_visible_to_borrower` | boolean | YES |  |
| 20 | `lead_pk` | bigint | YES |  |
| 21 | `mail_queue_pk` | bigint | YES |  |
| 22 | `merchant_pk` | bigint | YES |  |
| 23 | `path` | text | YES |  |
| 24 | `sent_count` | integer | YES |  |
| 25 | `sent_time` | timestamp without time zone | YES |  |
| 26 | `sms_queue_pk` | bigint | YES |  |
| 27 | `stored_document_status` | character varying(255) | YES |  |
| 28 | `subject` | text | YES |  |
| 29 | `template_name` | text | YES |  |
| 30 | `phone_number` | text | YES |  |

## uown_submit_application_error_log

**Schema:** `public` | **Columns:** 17

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_submit_application_error_log_pk_seq'::regclass) |
| 2 | `message` | text | YES |  |
| 3 | `lead_pk` | bigint | YES |  |
| 4 | `merchant_pk` | bigint | YES |  |
| 5 | `ref_merchant_code` | character varying(255) | YES |  |
| 6 | `merchant_name` | character varying(255) | YES |  |
| 7 | `location_name` | character varying(255) | YES |  |
| 8 | `first_name` | character varying(255) | YES |  |
| 9 | `last_name` | character varying(255) | YES |  |
| 10 | `last4ssn` | character varying(10) | YES |  |
| 11 | `first_5_cc` | character varying(5) | YES |  |
| 12 | `last_4_cc` | character varying(4) | YES |  |
| 13 | `row_created_timestamp` | timestamp without time zone | YES | now() |
| 14 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 15 | `tenant_id` | bigint | YES |  |
| 16 | `web_user_id` | bigint | YES |  |
| 17 | `agent` | character varying(255) | YES |  |

## uown_sv_account

**Schema:** `public` | **Columns:** 45

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_sv_account_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `account_status` | character varying(255) | YES |  |
| 8 | `ach_auto_pay` | boolean | YES |  |
| 9 | `activation_date` | date | YES |  |
| 10 | `cc_auto_pay` | boolean | YES |  |
| 11 | `company` | character varying(255) | YES |  |
| 12 | `import_date_time` | timestamp without time zone | YES |  |
| 13 | `is_ok_for_email` | boolean | YES |  |
| 14 | `is_ok_for_sms` | boolean | YES |  |
| 15 | `last_phone_contact_timestamp` | timestamp without time zone | YES |  |
| 16 | `lead_pk` | bigint | NO |  |
| 17 | `merchant_pk` | bigint | YES |  |
| 18 | `merchant_program_pk` | bigint | YES |  |
| 19 | `product_type` | character varying(255) | YES |  |
| 20 | `ref_account_id` | bigint | YES |  |
| 21 | `welcome_call_timestamp` | timestamp without time zone | YES |  |
| 22 | `notes` | text | YES |  |
| 23 | `pay_off_date` | date | YES |  |
| 24 | `current_or_future_bankruptcy` | boolean | YES |  |
| 25 | `past_bankruptcy` | boolean | YES |  |
| 26 | `rating` | character varying(255) | YES |  |
| 27 | `over_payment_amount` | numeric | YES |  |
| 28 | `show_alerts` | boolean | YES |  |
| 29 | `tax_for_zip_pk` | bigint | YES |  |
| 30 | `is90day_eligible` | boolean | YES |  |
| 31 | `is90day_eligible_override` | boolean | YES |  |
| 32 | `pay_off_date_time` | timestamp without time zone | YES |  |
| 33 | `ref_contract_number` | character varying(255) | YES |  |
| 34 | `cancelled_date_time` | timestamp without time zone | YES |  |
| 35 | `charged_off_date_time` | timestamp without time zone | YES |  |
| 36 | `closed_date_time` | timestamp without time zone | YES |  |
| 37 | `auto_pay_types` | character varying(255) | YES |  |
| 38 | `settled_in_full_date_time` | timestamp without time zone | YES |  |
| 39 | `sold_date_time` | timestamp without time zone | YES |  |
| 40 | `last_rating_time` | timestamp without time zone | YES |  |
| 41 | `debt_type` | character varying(255) | YES |  |
| 42 | `internal_account_score` | double precision | YES |  |
| 43 | `date_of_next_call` | date | YES |  |
| 44 | `cc_peek_consent` | boolean | YES |  |
| 45 | `consent_date` | date | YES |  |

## uown_sv_account_merchant_settings_snapshot

**Schema:** `public` | **Columns:** 14

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `web_user_id` | bigint | YES |  |
| 6 | `agent` | character varying(255) | YES |  |
| 7 | `account_pk` | bigint | NO |  |
| 8 | `lead_pk` | bigint | NO |  |
| 9 | `merchant_pk` | bigint | NO |  |
| 10 | `program_pk` | bigint | YES |  |
| 11 | `epo5` | boolean | YES |  |
| 12 | `epo10` | boolean | YES |  |
| 13 | `uw_pipeline` | character varying(10) | YES |  |
| 14 | `fraud_threshold` | integer | YES |  |

## uown_sv_account_notes

**Schema:** `public` | **Columns:** 8

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `account_pk` | bigint | NO |  |
| 8 | `notes` | text | YES |  |

## uown_sv_achpayment

**Schema:** `public` | **Columns:** 48

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_sv_achpayment_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `ach_process_type` | character varying(255) | YES |  |
| 8 | `ach_type` | character varying(255) | YES |  |
| 9 | `amount` | numeric | YES |  |
| 10 | `bank_account_type` | character varying(255) | YES |  |
| 11 | `account_number` | character varying(255) | YES |  |
| 12 | `bank_account_pk` | bigint | YES |  |
| 13 | `bank_name` | character varying(500) | YES |  |
| 14 | `routing_number` | character varying(255) | YES |  |
| 15 | `comments` | text | YES |  |
| 16 | `customer_first_name` | character varying(255) | YES |  |
| 17 | `customer_last_name` | character varying(255) | YES |  |
| 18 | `entry_class` | character varying(255) | YES |  |
| 19 | `error_desc` | text | YES |  |
| 20 | `number_of_tries` | integer | YES |  |
| 21 | `payment_file_id` | integer | YES |  |
| 22 | `payment_file_name` | character varying(255) | YES |  |
| 23 | `payment_pk` | bigint | YES |  |
| 24 | `posting_date` | date | YES |  |
| 25 | `return_code` | character varying(255) | YES |  |
| 26 | `return_code_description` | character varying(255) | YES |  |
| 27 | `return_date` | date | YES |  |
| 28 | `return_date_timestamp` | timestamp without time zone | YES |  |
| 29 | `return_or_settle_response` | text | YES |  |
| 30 | `row_number` | integer | YES |  |
| 31 | `send_payment_reminder` | boolean | YES |  |
| 32 | `sent_timestamp` | timestamp without time zone | YES |  |
| 33 | `sent_to_vendor` | character varying(255) | YES |  |
| 34 | `settlement_id` | character varying(255) | YES |  |
| 35 | `settlement_timestamp` | timestamp without time zone | YES |  |
| 36 | `status` | character varying(255) | YES |  |
| 37 | `use_bank_data_on_file` | boolean | YES |  |
| 38 | `username` | character varying(255) | YES |  |
| 39 | `uuid` | character varying(255) | YES |  |
| 40 | `vendor_achstatus` | text | YES |  |
| 41 | `account_pk` | bigint | YES |  |
| 42 | `allocation_strategy` | character varying(255) | YES |  |
| 43 | `date_of_representment` | date | YES |  |
| 44 | `vendor_settlement_timestamp` | character varying(255) | YES |  |
| 45 | `original_achpk` | bigint | YES |  |
| 46 | `original_ach_posting_date` | date | YES |  |
| 47 | `payment_arrangement_pk` | bigint | YES |  |
| 48 | `right_foot_balance_check_pk` | bigint | YES |  |

## uown_sv_achpayment_history

**Schema:** `public` | **Columns:** 4

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `rev` | integer | NO |  |
| 3 | `revtype` | smallint | YES |  |
| 4 | `account_pk` | bigint | YES |  |

## uown_sv_activity_log

**Schema:** `public` | **Columns:** 18

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_sv_activity_log_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `account_pk` | bigint | YES |  |
| 8 | `activity_log_pk` | bigint | NO |  |
| 9 | `created_by` | character varying(255) | YES |  |
| 10 | `deleted` | boolean | YES |  |
| 11 | `expiry_date` | date | YES |  |
| 12 | `is_hidden` | boolean | YES |  |
| 13 | `lead_pk` | bigint | YES |  |
| 14 | `log_type` | character varying(255) | YES |  |
| 15 | `notes` | text | YES |  |
| 16 | `priority` | boolean | YES |  |
| 17 | `ref_account_id` | character varying(255) | YES |  |
| 18 | `creation_source` | character varying(255) | YES |  |

## uown_sv_address

**Schema:** `public` | **Columns:** 21

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_sv_address_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `address_type` | character varying(255) | YES |  |
| 8 | `at_address_from` | character varying(255) | YES |  |
| 9 | `city` | character varying(255) | YES |  |
| 10 | `country` | character varying(255) | YES |  |
| 11 | `do_not_contact` | boolean | YES |  |
| 12 | `duration` | character varying(255) | YES |  |
| 13 | `housing_status` | character varying(255) | YES |  |
| 14 | `state` | character varying(255) | YES |  |
| 15 | `street_address1` | character varying(255) | YES |  |
| 16 | `street_address2` | character varying(255) | YES |  |
| 17 | `zip_code` | character varying(255) | YES |  |
| 18 | `account_pk` | bigint | YES |  |
| 19 | `customer_pk` | bigint | YES |  |
| 20 | `zip_code9` | character varying(255) | YES |  |
| 21 | `is_autocomplete_verified` | boolean | YES |  |

## uown_sv_alert

**Schema:** `public` | **Columns:** 10

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_sv_alert_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `account_pk` | bigint | YES |  |
| 8 | `alert_message` | text | YES |  |
| 9 | `is_active` | boolean | YES |  |
| 10 | `lead_pk` | bigint | YES |  |

## uown_sv_allocation

**Schema:** `public` | **Columns:** 16

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_sv_allocation_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `account_pk` | bigint | NO |  |
| 8 | `allocated_amount` | numeric | YES |  |
| 9 | `payment_pk` | bigint | YES |  |
| 10 | `receivable_pk` | bigint | YES |  |
| 11 | `non_taxable_amount` | numeric | YES |  |
| 12 | `receivable_type` | character varying(255) | YES |  |
| 13 | `tax_for_zip_pk` | bigint | YES |  |
| 14 | `tax_rate` | numeric | YES |  |
| 15 | `taxable_amount` | numeric | YES |  |
| 16 | `transaction_pk` | bigint | YES |  |

## uown_sv_allocation_history

**Schema:** `public` | **Columns:** 18

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `rev` | integer | NO |  |
| 3 | `revtype` | smallint | YES |  |
| 4 | `payment_pk` | bigint | YES |  |
| 5 | `receivable_pk` | bigint | YES |  |
| 6 | `agent` | character varying(255) | YES |  |
| 7 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 8 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 9 | `tenant_id` | bigint | YES |  |
| 10 | `web_user_id` | bigint | YES |  |
| 11 | `account_pk` | bigint | YES |  |
| 12 | `allocated_amount` | numeric | YES |  |
| 13 | `non_taxable_amount` | numeric | YES |  |
| 14 | `receivable_type` | character varying(255) | YES |  |
| 15 | `tax_for_zip_pk` | bigint | YES |  |
| 16 | `tax_rate` | numeric | YES |  |
| 17 | `taxable_amount` | numeric | YES |  |
| 18 | `transaction_pk` | bigint | YES |  |

## uown_sv_auth_token

**Schema:** `public` | **Columns:** 9

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_sv_auth_token_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `expire_date_time` | timestamp without time zone | YES |  |
| 8 | `token` | text | YES |  |
| 9 | `vendor` | character varying(255) | YES |  |

## uown_sv_bank_account

**Schema:** `public` | **Columns:** 19

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_sv_bank_account_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `account_number` | character varying(255) | YES |  |
| 8 | `account_opened_date` | date | YES |  |
| 9 | `auto_pay` | boolean | YES |  |
| 10 | `bank_account_duration` | character varying(255) | YES |  |
| 11 | `bank_account_type` | character varying(255) | YES |  |
| 12 | `bank_name` | character varying(500) | YES |  |
| 13 | `name` | character varying(500) | YES |  |
| 14 | `routing_number` | character varying(255) | YES |  |
| 15 | `account_pk` | bigint | YES |  |
| 16 | `customer_pk` | bigint | YES |  |
| 17 | `is_deleted` | boolean | YES |  |
| 18 | `comment` | text | YES |  |
| 19 | `source` | character varying(255) | YES |  |

## uown_sv_bank_account_history

**Schema:** `public` | **Columns:** 21

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `rev` | integer | NO |  |
| 3 | `revtype` | smallint | YES |  |
| 4 | `agent` | character varying(255) | YES |  |
| 5 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 6 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 7 | `tenant_id` | bigint | YES |  |
| 8 | `web_user_id` | bigint | YES |  |
| 9 | `account_number` | character varying(255) | YES |  |
| 10 | `account_opened_date` | date | YES |  |
| 11 | `auto_pay` | boolean | YES |  |
| 12 | `bank_account_duration` | character varying(255) | YES |  |
| 13 | `bank_account_type` | character varying(255) | YES |  |
| 14 | `bank_name` | character varying(500) | YES |  |
| 15 | `name` | character varying(500) | YES |  |
| 16 | `routing_number` | character varying(255) | YES |  |
| 17 | `account_pk` | bigint | YES |  |
| 18 | `customer_pk` | bigint | YES |  |
| 19 | `is_deleted` | boolean | YES |  |
| 20 | `comment` | text | YES |  |
| 21 | `source` | character varying(255) | YES |  |

## uown_sv_contract

**Schema:** `public` | **Columns:** 24

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_sv_contract_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `contract_number` | character varying(255) | YES |  |
| 8 | `contract_status` | character varying(255) | YES |  |
| 9 | `contract_type` | character varying(255) | YES |  |
| 10 | `esign_document_pk` | bigint | YES |  |
| 11 | `esign_mode` | character varying(255) | YES |  |
| 12 | `expiry_date` | date | YES |  |
| 13 | `sent_time` | timestamp without time zone | YES |  |
| 14 | `sent_to_email_addresses` | character varying(255) | YES |  |
| 15 | `signed_time` | timestamp without time zone | YES |  |
| 16 | `url` | character varying(255) | YES |  |
| 17 | `account_pk` | bigint | YES |  |
| 18 | `invoice_amount` | numeric | YES |  |
| 19 | `attempted_post_back` | boolean | YES |  |
| 20 | `post_back_error` | text | YES |  |
| 21 | `invoice_record` | text | YES |  |
| 22 | `items_record` | text | YES |  |
| 23 | `embedded_signing_origin` | character varying(255) | YES |  |
| 24 | `esign_client` | character varying(32) | YES |  |

## uown_sv_credit_card

**Schema:** `public` | **Columns:** 39

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_sv_credit_card_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `account_pk` | bigint | YES |  |
| 8 | `auto_pay` | boolean | YES |  |
| 9 | `address_type` | character varying(255) | YES |  |
| 10 | `at_address_from` | character varying(255) | YES |  |
| 11 | `cc_city` | character varying(255) | YES |  |
| 12 | `country` | character varying(255) | YES |  |
| 13 | `do_not_contact` | boolean | YES |  |
| 14 | `duration` | character varying(255) | YES |  |
| 15 | `housing_status` | character varying(255) | YES |  |
| 16 | `cc_state` | character varying(255) | YES |  |
| 17 | `cc_address1` | character varying(255) | YES |  |
| 18 | `cc_address2` | character varying(255) | YES |  |
| 19 | `cc_zip` | character varying(255) | YES |  |
| 20 | `cc_exp` | character varying(255) | YES |  |
| 21 | `cc_first_name` | character varying(255) | YES |  |
| 22 | `cc_last_name` | character varying(255) | YES |  |
| 23 | `cc_number` | character varying(255) | YES |  |
| 24 | `cc_token` | character varying(255) | YES |  |
| 25 | `cc_type` | character varying(255) | YES |  |
| 26 | `lead_pk` | bigint | YES |  |
| 27 | `is_deleted` | boolean | YES |  |
| 28 | `error_msg` | character varying(255) | YES |  |
| 29 | `cc_vendor` | character varying(255) | YES |  |
| 30 | `kount_session_id` | character varying(255) | YES |  |
| 31 | `pre_auth_status` | character varying(255) | YES |  |
| 32 | `kount_pk` | bigint | YES |  |
| 33 | `cc_hash` | integer | YES |  |
| 34 | `cc_last_four_digit` | character(4) | YES |  |
| 35 | `cc_connector_token` | character varying(255) | YES |  |
| 36 | `invalid_card_reason` | character varying(255) | YES |  |
| 37 | `is_valid_card` | boolean | YES |  |
| 38 | `cc_zip9` | character varying(255) | YES |  |
| 39 | `is_autocomplete_verified` | boolean | YES |  |

## uown_sv_credit_card_history

**Schema:** `public` | **Columns:** 41

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `rev` | integer | NO |  |
| 3 | `revtype` | smallint | YES |  |
| 4 | `agent` | character varying(255) | YES |  |
| 5 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 6 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 7 | `tenant_id` | bigint | YES |  |
| 8 | `web_user_id` | bigint | YES |  |
| 9 | `account_pk` | bigint | YES |  |
| 10 | `auto_pay` | boolean | YES |  |
| 11 | `address_type` | character varying(255) | YES |  |
| 12 | `at_address_from` | character varying(255) | YES |  |
| 13 | `cc_city` | character varying(255) | YES |  |
| 14 | `country` | character varying(255) | YES |  |
| 15 | `do_not_contact` | boolean | YES |  |
| 16 | `duration` | character varying(255) | YES |  |
| 17 | `housing_status` | character varying(255) | YES |  |
| 18 | `cc_state` | character varying(255) | YES |  |
| 19 | `cc_address1` | character varying(255) | YES |  |
| 20 | `cc_address2` | character varying(255) | YES |  |
| 21 | `cc_zip` | character varying(255) | YES |  |
| 22 | `cc_exp` | character varying(255) | YES |  |
| 23 | `cc_first_name` | character varying(255) | YES |  |
| 24 | `cc_last_name` | character varying(255) | YES |  |
| 25 | `cc_number` | character varying(255) | YES |  |
| 26 | `cc_token` | character varying(255) | YES |  |
| 27 | `cc_type` | character varying(255) | YES |  |
| 28 | `lead_pk` | bigint | YES |  |
| 29 | `is_deleted` | boolean | YES |  |
| 30 | `error_msg` | character varying(255) | YES |  |
| 31 | `cc_vendor` | character varying(255) | YES |  |
| 32 | `kount_session_id` | character varying(255) | YES |  |
| 33 | `pre_auth_status` | character varying(255) | YES |  |
| 34 | `kount_pk` | bigint | YES |  |
| 35 | `cc_hash` | integer | YES |  |
| 36 | `cc_connector_token` | character varying(255) | YES |  |
| 37 | `invalid_card_reason` | character varying(255) | YES |  |
| 38 | `is_valid_card` | boolean | YES |  |
| 39 | `zip_code9` | character varying(255) | YES |  |
| 40 | `cc_zip9` | character varying(255) | YES |  |
| 41 | `is_autocomplete_verified` | boolean | YES |  |

## uown_sv_credit_card_transaction

**Schema:** `public` | **Columns:** 79

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_sv_credit_card_transaction_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `amount` | numeric | YES |  |
| 8 | `auth_code` | character varying(255) | YES |  |
| 9 | `cc_action` | character varying(255) | YES |  |
| 10 | `account_pk` | bigint | YES |  |
| 11 | `auto_pay` | boolean | YES |  |
| 12 | `address_type` | character varying(255) | YES |  |
| 13 | `at_address_from` | character varying(255) | YES |  |
| 14 | `cc_city` | character varying(255) | YES |  |
| 15 | `country` | character varying(255) | YES |  |
| 16 | `do_not_contact` | boolean | YES |  |
| 17 | `duration` | character varying(255) | YES |  |
| 18 | `housing_status` | character varying(255) | YES |  |
| 19 | `cc_state` | character varying(255) | YES |  |
| 20 | `cc_address1` | character varying(255) | YES |  |
| 21 | `cc_address2` | character varying(255) | YES |  |
| 22 | `cc_zip` | character varying(255) | YES |  |
| 23 | `cc_exp` | character varying(255) | YES |  |
| 24 | `cc_first_name` | character varying(255) | YES |  |
| 25 | `cc_last_name` | character varying(255) | YES |  |
| 26 | `cc_number` | character varying(255) | YES |  |
| 27 | `cc_token` | character varying(255) | YES |  |
| 28 | `cc_type` | character varying(255) | YES |  |
| 29 | `lead_pk` | bigint | YES |  |
| 30 | `cc_transaction_type` | character varying(255) | YES |  |
| 31 | `comment` | text | YES |  |
| 32 | `completed_time` | timestamp without time zone | YES |  |
| 33 | `error` | text | YES |  |
| 34 | `error_code` | character varying(255) | YES |  |
| 35 | `gateway_request` | text | YES |  |
| 36 | `gateway_response` | text | YES |  |
| 37 | `gateway_transaction_id` | character varying(255) | YES |  |
| 38 | `ip_address` | character varying(255) | YES |  |
| 39 | `is_nsf` | boolean | YES |  |
| 40 | `payment_pk` | bigint | YES |  |
| 41 | `posting_date` | date | YES |  |
| 42 | `save_card_to_file` | boolean | YES |  |
| 43 | `save_on_success_only` | boolean | YES |  |
| 44 | `status` | character varying(255) | YES |  |
| 45 | `use_card_on_file` | boolean | YES |  |
| 46 | `vendor` | character varying(255) | YES |  |
| 47 | `agent_username` | character varying(255) | YES |  |
| 48 | `allocation_strategy` | character varying(255) | YES |  |
| 49 | `is_custom_refund` | boolean | YES |  |
| 50 | `is_deleted` | boolean | YES |  |
| 51 | `number_of_tries` | integer | YES |  |
| 52 | `original_ccpk` | bigint | YES |  |
| 53 | `rerun_nsf_status` | character varying(255) | YES |  |
| 54 | `rerun_status` | character varying(255) | YES |  |
| 55 | `error_msg` | character varying(255) | YES |  |
| 56 | `remaining_refundable_amount` | numeric | YES |  |
| 57 | `error_stacktrace` | text | YES |  |
| 58 | `id` | bigint | YES |  |
| 59 | `cc_vendor` | character varying(255) | YES |  |
| 60 | `kount_session_id` | character varying(255) | YES |  |
| 61 | `pre_auth_status` | character varying(255) | YES |  |
| 62 | `charged_fee_amount` | numeric | YES |  |
| 63 | `kount_pk` | bigint | YES |  |
| 64 | `charge_type` | character varying(255) | YES |  |
| 65 | `gateway_auth_token` | character varying(255) | YES |  |
| 66 | `cc_hash` | integer | YES |  |
| 67 | `cc_connector_token` | character varying(255) | YES |  |
| 68 | `invalid_card_reason` | character varying(255) | YES |  |
| 69 | `is_valid_card` | boolean | YES |  |
| 70 | `idempotency_key` | character varying(255) | YES |  |
| 71 | `charge_fee` | boolean | YES | false |
| 72 | `cc_peek` | boolean | YES |  |
| 73 | `original_amount` | numeric | YES |  |
| 74 | `same_day_transaction` | boolean | YES |  |
| 75 | `cc_zip9` | character varying(255) | YES |  |
| 76 | `is_autocomplete_verified` | boolean | YES |  |
| 77 | `is_settlement_payment` | boolean | YES |  |
| 78 | `payment_arrangement_pk` | bigint | YES |  |
| 79 | `cc_vendor_transaction_id` | character varying(128) | YES |  |

## uown_sv_customer

**Schema:** `public` | **Columns:** 28

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_sv_customer_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `company_name` | character varying(255) | YES |  |
| 8 | `customer_type` | character varying(255) | YES |  |
| 9 | `date_of_birth` | date | YES |  |
| 10 | `driver_license_number` | character varying(255) | YES |  |
| 11 | `driver_license_state` | character varying(255) | YES |  |
| 12 | `first_name` | character varying(255) | YES |  |
| 13 | `language` | character varying(255) | YES |  |
| 14 | `last_contacted_phone` | character varying(255) | YES |  |
| 15 | `last_name` | character varying(255) | YES |  |
| 16 | `last_phone_contact_timestamp` | timestamp without time zone | YES |  |
| 17 | `license_expiration_date` | date | YES |  |
| 18 | `marital_status` | character varying(255) | YES |  |
| 19 | `ref_customer_code` | character varying(255) | YES |  |
| 20 | `ssn` | character varying(255) | YES |  |
| 21 | `account_pk` | bigint | YES |  |
| 22 | `suffix` | character varying(255) | YES |  |
| 23 | `last_successful_login` | timestamp without time zone | YES |  |
| 24 | `cell_phone_number` | character varying(255) | YES |  |
| 25 | `email_address` | character varying(255) | YES |  |
| 26 | `home_phone_number` | character varying(255) | YES |  |
| 27 | `middle_name` | character varying(255) | YES |  |
| 28 | `preferred_communication_channel` | character varying(255) | YES |  |

## uown_sv_email

**Schema:** `public` | **Columns:** 12

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_sv_email_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `do_not_email` | boolean | YES |  |
| 8 | `email_address` | character varying(255) | YES |  |
| 9 | `email_type` | character varying(255) | YES |  |
| 10 | `reason_for_dnc` | character varying(255) | YES |  |
| 11 | `account_pk` | bigint | YES |  |
| 12 | `customer_pk` | bigint | YES |  |

## uown_sv_email_history

**Schema:** `public` | **Columns:** 14

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `rev` | integer | NO |  |
| 3 | `revtype` | smallint | YES |  |
| 4 | `agent` | character varying(255) | YES |  |
| 5 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 6 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 7 | `tenant_id` | bigint | YES |  |
| 8 | `web_user_id` | bigint | YES |  |
| 9 | `do_not_email` | boolean | YES |  |
| 10 | `email_address` | character varying(255) | YES |  |
| 11 | `email_type` | character varying(255) | YES |  |
| 12 | `reason_for_dnc` | character varying(255) | YES |  |
| 13 | `account_pk` | bigint | YES |  |
| 14 | `customer_pk` | bigint | YES |  |

## uown_sv_employment

**Schema:** `public` | **Columns:** 27

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_sv_employment_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `annual_income` | numeric | YES |  |
| 8 | `duration` | character varying(255) | YES |  |
| 9 | `employer` | character varying(255) | YES |  |
| 10 | `employment_status` | character varying(255) | YES |  |
| 11 | `employment_type` | character varying(255) | YES |  |
| 12 | `hire_date` | date | YES |  |
| 13 | `income_per_pay_period` | numeric | YES |  |
| 14 | `job_title` | character varying(255) | YES |  |
| 15 | `last_pay_date` | date | YES |  |
| 16 | `monthly_income` | numeric | YES |  |
| 17 | `next_pay_date` | date | YES |  |
| 18 | `pay_frequency` | character varying(255) | YES |  |
| 19 | `phone_number` | character varying(255) | YES |  |
| 20 | `account_pk` | bigint | YES |  |
| 21 | `customer_pk` | bigint | YES |  |
| 22 | `months_at_employer` | integer | YES |  |
| 23 | `employer_city` | character varying(255) | YES |  |
| 24 | `employer_country` | character varying(255) | YES |  |
| 25 | `employer_postal_code` | character varying(255) | YES |  |
| 26 | `employer_state` | character varying(255) | YES |  |
| 27 | `employer_street_address` | character varying(255) | YES |  |

## uown_sv_employment_history

**Schema:** `public` | **Columns:** 29

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `rev` | integer | NO |  |
| 3 | `revtype` | smallint | YES |  |
| 4 | `agent` | character varying(255) | YES |  |
| 5 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 6 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 7 | `tenant_id` | bigint | YES |  |
| 8 | `web_user_id` | bigint | YES |  |
| 9 | `annual_income` | numeric | YES |  |
| 10 | `duration` | character varying(255) | YES |  |
| 11 | `employer` | character varying(255) | YES |  |
| 12 | `employment_status` | character varying(255) | YES |  |
| 13 | `employment_type` | character varying(255) | YES |  |
| 14 | `hire_date` | date | YES |  |
| 15 | `income_per_pay_period` | numeric | YES |  |
| 16 | `job_title` | character varying(255) | YES |  |
| 17 | `last_pay_date` | date | YES |  |
| 18 | `monthly_income` | numeric | YES |  |
| 19 | `next_pay_date` | date | YES |  |
| 20 | `pay_frequency` | character varying(255) | YES |  |
| 21 | `phone_number` | character varying(255) | YES |  |
| 22 | `account_pk` | bigint | YES |  |
| 23 | `customer_pk` | bigint | YES |  |
| 24 | `months_at_employer` | integer | YES |  |
| 25 | `employer_city` | character varying(255) | YES |  |
| 26 | `employer_country` | character varying(255) | YES |  |
| 27 | `employer_postal_code` | character varying(255) | YES |  |
| 28 | `employer_state` | character varying(255) | YES |  |
| 29 | `employer_street_address` | character varying(255) | YES |  |

## uown_sv_inbound_api_log

**Schema:** `public` | **Columns:** 18

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_sv_inbound_api_log_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `api` | character varying(255) | YES |  |
| 8 | `call_type` | character varying(255) | YES |  |
| 9 | `header` | text | YES |  |
| 10 | `request` | text | YES |  |
| 11 | `request_object` | text | YES |  |
| 12 | `response` | text | YES |  |
| 13 | `return_uuid` | character varying(255) | YES |  |
| 14 | `source` | character varying(255) | YES |  |
| 15 | `source_uuid` | character varying(255) | YES |  |
| 16 | `stack_trace` | text | YES |  |
| 17 | `url` | text | YES |  |
| 18 | `uuid` | character varying(255) | YES |  |

## uown_sv_inbound_internal_log

**Schema:** `public` | **Columns:** 17

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `account_pk` | bigint | YES |  |
| 6 | `api` | character varying(255) | YES |  |
| 7 | `call_type` | character varying(255) | YES |  |
| 8 | `header` | text | YES |  |
| 9 | `request` | text | YES |  |
| 10 | `request_object` | text | YES |  |
| 11 | `response` | text | YES |  |
| 12 | `return_uuid` | character varying(255) | YES |  |
| 13 | `source` | character varying(255) | YES |  |
| 14 | `source_uuid` | character varying(255) | YES |  |
| 15 | `stack_trace` | text | YES |  |
| 16 | `url` | text | YES |  |
| 17 | `uuid` | character varying(255) | YES |  |

## uown_sv_invoice

**Schema:** `public` | **Columns:** 29

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_sv_invoice_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `category` | character varying(255) | YES |  |
| 8 | `delivery_fee` | numeric | YES |  |
| 9 | `deposit_amount` | numeric | YES |  |
| 10 | `description` | text | YES |  |
| 11 | `discount_amount` | numeric | YES |  |
| 12 | `installation_fee` | numeric | YES |  |
| 13 | `invoice_status` | character varying(255) | YES |  |
| 14 | `last_delivery_date` | date | YES |  |
| 15 | `merchandise_amount` | numeric | YES |  |
| 16 | `merchant_invoice_number` | text | YES |  |
| 17 | `merchant_pk` | bigint | NO |  |
| 18 | `merchant_protection_plan` | numeric | YES |  |
| 19 | `miscellaneous_fee` | numeric | YES |  |
| 20 | `shipping_same_as_consumer` | boolean | YES |  |
| 21 | `tax_amount` | numeric | YES |  |
| 22 | `total_invoice_amount` | numeric | YES |  |
| 23 | `total_number_of_items` | integer | YES |  |
| 24 | `account_pk` | bigint | YES |  |
| 25 | `invoice_number` | text | YES |  |
| 26 | `sales_person` | character varying(255) | YES |  |
| 27 | `order_id` | character varying(255) | YES |  |
| 28 | `purchase_total` | numeric | YES |  |
| 29 | `external_reference_id` | character varying(255) | YES |  |

## uown_sv_invoice_history

**Schema:** `public` | **Columns:** 3

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `rev` | integer | NO |  |
| 3 | `revtype` | smallint | YES |  |

## uown_sv_item

**Schema:** `public` | **Columns:** 30

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_sv_item_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `account_pk` | bigint | NO |  |
| 8 | `base_price_per_item` | numeric | YES |  |
| 9 | `category` | character varying(255) | YES |  |
| 10 | `delivery_type` | character varying(255) | YES |  |
| 11 | `invoice_pk` | bigint | NO |  |
| 12 | `item_code` | character varying(255) | YES |  |
| 13 | `item_delivery_date` | date | YES |  |
| 14 | `item_delivery_fee` | numeric | YES |  |
| 15 | `item_description` | text | YES |  |
| 16 | `item_image_url` | character varying(255) | YES |  |
| 17 | `items_delivery_fee` | numeric | YES |  |
| 18 | `lead_pk` | bigint | NO |  |
| 19 | `line_number` | character varying(255) | YES |  |
| 20 | `merchant_pk` | bigint | NO |  |
| 21 | `number_of_items` | integer | YES |  |
| 22 | `number_of_items_delivered` | integer | YES |  |
| 23 | `serial_number` | character varying(255) | YES |  |
| 24 | `status` | character varying(255) | YES |  |
| 25 | `tax_per_item` | numeric | YES |  |
| 26 | `total_price_for_items` | numeric | YES |  |
| 27 | `total_price_per_item` | numeric | YES |  |
| 28 | `invoice_type` | character varying(255) | YES |  |
| 29 | `item_id` | character varying(255) | YES |  |
| 30 | `lock_status` | character varying(255) | YES |  |

## uown_sv_item_history

**Schema:** `public` | **Columns:** 4

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `rev` | integer | NO |  |
| 3 | `revtype` | smallint | YES |  |
| 4 | `invoice_pk` | bigint | YES |  |

## uown_sv_outbound_api_log

**Schema:** `public` | **Columns:** 19

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_sv_outbound_api_log_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `api` | character varying(255) | YES |  |
| 8 | `call_type` | character varying(255) | YES |  |
| 9 | `header` | text | YES |  |
| 10 | `request` | text | YES |  |
| 11 | `request_object` | text | YES |  |
| 12 | `response` | text | YES |  |
| 13 | `return_uuid` | character varying(255) | YES |  |
| 14 | `source` | character varying(255) | YES |  |
| 15 | `source_uuid` | character varying(255) | YES |  |
| 16 | `stack_trace` | text | YES |  |
| 17 | `url` | text | YES |  |
| 18 | `uuid` | character varying(255) | YES |  |
| 19 | `account_pk` | bigint | YES |  |

## uown_sv_payment

**Schema:** `public` | **Columns:** 25

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_sv_payment_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `ach_pk` | bigint | YES |  |
| 8 | `cc_pk` | bigint | YES |  |
| 9 | `is_ach` | boolean | YES |  |
| 10 | `is_credit_card` | boolean | YES |  |
| 11 | `payment_amount` | numeric | YES |  |
| 12 | `payment_date` | date | YES |  |
| 13 | `payment_type` | character varying(255) | YES |  |
| 14 | `reason` | character varying(255) | YES |  |
| 15 | `ref_receipt` | character varying(255) | YES |  |
| 16 | `reverse_date` | date | YES |  |
| 17 | `reverse_date_timestamp` | timestamp without time zone | YES |  |
| 18 | `status` | character varying(255) | YES |  |
| 19 | `account_pk` | bigint | YES |  |
| 20 | `most_recent` | boolean | YES |  |
| 21 | `agent_username` | character varying(255) | YES |  |
| 22 | `allocation_strategy` | character varying(255) | YES |  |
| 23 | `comments` | text | YES |  |
| 24 | `non_taxable_payment` | numeric | YES |  |
| 25 | `taxable_payment` | numeric | YES |  |

## uown_sv_payment_arrangement

**Schema:** `public` | **Columns:** 18

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_sv_payment_arrangement_pk_seq'::regclass) |
| 2 | `account_pk` | bigint | NO |  |
| 3 | `start_date` | date | YES |  |
| 4 | `end_date` | date | YES |  |
| 5 | `amount` | numeric | YES |  |
| 6 | `arrangement_type` | character varying(50) | YES |  |
| 7 | `payment_type` | character varying(50) | YES |  |
| 8 | `username` | character varying(255) | YES |  |
| 9 | `previous_rating` | character varying(50) | YES |  |
| 10 | `current_rating` | character varying(50) | YES |  |
| 11 | `is_active` | boolean | NO | true |
| 12 | `status` | character varying(50) | YES |  |
| 13 | `notes` | text | YES |  |
| 14 | `tenant_id` | bigint | YES |  |
| 15 | `web_user_id` | bigint | YES |  |
| 16 | `agent` | character varying(255) | YES |  |
| 17 | `row_created_timestamp` | timestamp without time zone | YES | now() |
| 18 | `row_updated_timestamp` | timestamp without time zone | YES |  |

## uown_sv_phone

**Schema:** `public` | **Columns:** 19

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_sv_phone_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `area_code` | character varying(255) | YES |  |
| 8 | `do_not_call` | boolean | YES |  |
| 9 | `do_not_text` | boolean | YES |  |
| 10 | `last_contact_timestamp` | timestamp without time zone | YES |  |
| 11 | `phone_extension` | character varying(255) | YES |  |
| 12 | `phone_number` | bigint | YES |  |
| 13 | `phone_type` | character varying(255) | YES |  |
| 14 | `reason_for_dnc` | character varying(255) | YES |  |
| 15 | `reason_for_dnt` | character varying(255) | YES |  |
| 16 | `account_pk` | bigint | YES |  |
| 17 | `customer_pk` | bigint | YES |  |
| 18 | `opt_out_ai` | boolean | YES | false |
| 19 | `opt_out_ai_reason` | character varying(500) | YES |  |

## uown_sv_phone_history

**Schema:** `public` | **Columns:** 21

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `rev` | integer | NO |  |
| 3 | `revtype` | smallint | YES |  |
| 4 | `agent` | character varying(255) | YES |  |
| 5 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 6 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 7 | `tenant_id` | bigint | YES |  |
| 8 | `web_user_id` | bigint | YES |  |
| 9 | `area_code` | character varying(255) | YES |  |
| 10 | `do_not_call` | boolean | YES |  |
| 11 | `do_not_text` | boolean | YES |  |
| 12 | `last_contact_timestamp` | timestamp without time zone | YES |  |
| 13 | `phone_extension` | character varying(255) | YES |  |
| 14 | `phone_number` | bigint | YES |  |
| 15 | `phone_type` | character varying(255) | YES |  |
| 16 | `reason_for_dnc` | character varying(255) | YES |  |
| 17 | `reason_for_dnt` | character varying(255) | YES |  |
| 18 | `account_pk` | bigint | YES |  |
| 19 | `customer_pk` | bigint | YES |  |
| 20 | `opt_out_ai` | boolean | YES | false |
| 21 | `opt_out_ai_reason` | character varying(500) | YES |  |

## uown_sv_protection_plan

**Schema:** `public` | **Columns:** 25

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_sv_protection_plan_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `account_pk` | bigint | YES |  |
| 8 | `already_covered` | boolean | YES |  |
| 9 | `connector_token` | character varying(255) | YES |  |
| 10 | `error` | text | YES |  |
| 11 | `lead_pk` | bigint | YES |  |
| 12 | `offer_element_response` | text | YES |  |
| 13 | `opt_in` | boolean | YES |  |
| 14 | `request` | text | YES |  |
| 15 | `response` | text | YES |  |
| 16 | `status` | character varying(255) | YES |  |
| 17 | `customer_id` | character varying(255) | YES |  |
| 18 | `policy_id` | character varying(255) | YES |  |
| 19 | `covered_by_account_pk` | character varying(255) | YES |  |
| 20 | `covered_by_lead_pk` | character varying(255) | YES |  |
| 21 | `enrollment_date` | date | YES |  |
| 22 | `order_id` | character varying(255) | YES |  |
| 23 | `cancellation_date` | date | YES |  |
| 24 | `refund_amount` | numeric | YES |  |
| 25 | `cancellation_reason` | text | YES |  |

## uown_sv_pwpayment

**Schema:** `public` | **Columns:** 18

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `account_pk` | bigint | YES |  |
| 8 | `amount` | numeric | YES |  |
| 9 | `client` | character varying(255) | YES |  |
| 10 | `customer_name` | character varying(255) | YES |  |
| 11 | `file_name` | character varying(255) | YES |  |
| 12 | `lead_pk` | bigint | YES |  |
| 13 | `loan_disbursement_account` | character varying(255) | YES |  |
| 14 | `loan_ref_id` | character varying(255) | YES |  |
| 15 | `posting_date` | date | YES |  |
| 16 | `salary_collection_account` | character varying(255) | YES |  |
| 17 | `status` | integer | YES |  |
| 18 | `trace_number` | character varying(255) | YES |  |

## uown_sv_receivable

**Schema:** `public` | **Columns:** 23

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_sv_receivable_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `allocation_status` | character varying(255) | YES |  |
| 8 | `base_amount` | numeric | YES |  |
| 9 | `base_epo_amount` | numeric | YES |  |
| 10 | `comment` | text | YES |  |
| 11 | `due_date` | date | YES |  |
| 12 | `partial_payment_amount` | numeric | YES |  |
| 13 | `receivable_type` | character varying(255) | YES |  |
| 14 | `status` | character varying(255) | YES |  |
| 15 | `tax_amount` | numeric | YES |  |
| 16 | `total_amount` | numeric | YES |  |
| 17 | `account_pk` | bigint | YES |  |
| 18 | `notes` | text | YES |  |
| 19 | `tax_rate` | numeric | YES |  |
| 20 | `skipped` | boolean | YES |  |
| 21 | `tax_for_zip_pk` | bigint | YES |  |
| 22 | `tax_updated` | timestamp without time zone | YES |  |
| 23 | `base_epo90day_ineligible` | numeric | YES |  |

## uown_sv_receivable_history

**Schema:** `public` | **Columns:** 25

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `rev` | integer | NO |  |
| 3 | `revtype` | smallint | YES |  |
| 4 | `account_pk` | bigint | YES |  |
| 5 | `agent` | character varying(255) | YES |  |
| 6 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 7 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 8 | `tenant_id` | bigint | YES |  |
| 9 | `web_user_id` | bigint | YES |  |
| 10 | `allocation_status` | character varying(255) | YES |  |
| 11 | `base_amount` | numeric | YES |  |
| 12 | `base_epo_amount` | numeric | YES |  |
| 13 | `comment` | text | YES |  |
| 14 | `due_date` | date | YES |  |
| 15 | `notes` | text | YES |  |
| 16 | `partial_payment_amount` | numeric | YES |  |
| 17 | `receivable_type` | character varying(255) | YES |  |
| 18 | `status` | character varying(255) | YES |  |
| 19 | `tax_amount` | numeric | YES |  |
| 20 | `total_amount` | numeric | YES |  |
| 21 | `tax_rate` | numeric | YES |  |
| 22 | `skipped` | boolean | YES |  |
| 23 | `tax_for_zip_pk` | bigint | YES |  |
| 24 | `tax_updated` | timestamp without time zone | YES |  |
| 25 | `base_epo90day_ineligible` | numeric | YES |  |

## uown_sv_sched_summary

**Schema:** `public` | **Columns:** 62

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_sv_sched_summary_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `amount_past_due_without_tax` | numeric | YES |  |
| 8 | `balance_amount_without_tax` | numeric | YES |  |
| 9 | `cost_with_fees_no_tax` | numeric | YES |  |
| 10 | `cost_without_tax_and_fees` | numeric | YES |  |
| 11 | `days_past_due` | integer | YES |  |
| 12 | `due_date_moves` | integer | YES |  |
| 13 | `early_payoff_date_expiry` | date | YES |  |
| 14 | `epo_amount_without_tax` | numeric | YES |  |
| 15 | `first_payment_discount` | numeric | YES |  |
| 16 | `first_payment_due_date` | date | YES |  |
| 17 | `first_payment_with_tax_no_fees` | numeric | YES |  |
| 18 | `last_payment_date` | date | YES |  |
| 19 | `last_payment_with_tax` | numeric | YES |  |
| 20 | `merchant_discount_amount` | numeric | YES |  |
| 21 | `merchant_discount_rate` | numeric | YES |  |
| 22 | `merchant_rebate_amount` | numeric | YES |  |
| 23 | `merchant_rebate_rate` | numeric | YES |  |
| 24 | `money_factor` | numeric | YES |  |
| 25 | `next_payment_due_date` | date | YES |  |
| 26 | `next_payment_with_tax` | numeric | YES |  |
| 27 | `number_of_payments_made` | integer | YES |  |
| 28 | `payment_frequency` | character varying(255) | YES |  |
| 29 | `plat_form_fee_amount` | numeric | YES |  |
| 30 | `plat_form_fee_rate` | numeric | YES |  |
| 31 | `processing_fee` | numeric | YES |  |
| 32 | `protection_plan_fee` | numeric | YES |  |
| 33 | `remaining_number_of_payments` | integer | YES |  |
| 34 | `tax_amount` | numeric | YES |  |
| 35 | `tax_per_scheduled_payment` | numeric | YES |  |
| 36 | `tax_rate` | numeric | YES |  |
| 37 | `term_in_months` | integer | YES |  |
| 38 | `total_contract_amount_with_tax_and_fees` | numeric | YES |  |
| 39 | `total_number_of_payments` | integer | YES |  |
| 40 | `total_recycle_fee` | numeric | YES |  |
| 41 | `account_pk` | bigint | YES |  |
| 42 | `delinquency_as_of_date` | date | YES |  |
| 43 | `security_deposit` | numeric | YES |  |
| 44 | `redirect_url` | character varying(255) | YES |  |
| 45 | `first_payment_no_tax_no_fees` | numeric | YES |  |
| 46 | `first_payment_no_tax_with_fees` | numeric | YES |  |
| 47 | `first_payment_tax` | numeric | YES |  |
| 48 | `frequency_changes` | integer | YES |  |
| 49 | `last_payment_no_tax_no_fees` | numeric | YES |  |
| 50 | `last_payment_no_tax_with_fees` | numeric | YES |  |
| 51 | `last_payment_tax` | numeric | YES |  |
| 52 | `last_tax_updated_time` | timestamp without time zone | YES |  |
| 53 | `next_payment_no_tax_no_fees` | numeric | YES |  |
| 54 | `regular_payment_tax` | numeric | YES |  |
| 55 | `buyout_fee` | numeric | YES |  |
| 56 | `amount_charged_at_signing` | numeric | YES |  |
| 57 | `signing_fee` | numeric | YES |  |
| 58 | `epo_amount_with_tax` | numeric | YES |  |
| 59 | `ks_label` | character varying(255) | YES |  |
| 60 | `program_name` | character varying(255) | YES |  |
| 61 | `short_code` | character varying(8) | YES |  |
| 62 | `plan_id` | character varying(255) | YES |  |

## uown_sv_sched_summary_history

**Schema:** `public` | **Columns:** 64

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `rev` | integer | NO |  |
| 3 | `revtype` | smallint | YES |  |
| 4 | `agent` | character varying(255) | YES |  |
| 5 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 6 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 7 | `tenant_id` | bigint | YES |  |
| 8 | `web_user_id` | bigint | YES |  |
| 9 | `amount_past_due_without_tax` | numeric | YES |  |
| 10 | `balance_amount_without_tax` | numeric | YES |  |
| 11 | `cost_with_fees_no_tax` | numeric | YES |  |
| 12 | `cost_without_tax_and_fees` | numeric | YES |  |
| 13 | `days_past_due` | integer | YES |  |
| 14 | `due_date_moves` | integer | YES |  |
| 15 | `early_payoff_date_expiry` | date | YES |  |
| 16 | `epo_amount_without_tax` | numeric | YES |  |
| 17 | `first_payment_discount` | numeric | YES |  |
| 18 | `first_payment_due_date` | date | YES |  |
| 19 | `first_payment_with_tax_no_fees` | numeric | YES |  |
| 20 | `last_payment_date` | date | YES |  |
| 21 | `last_payment_with_tax` | numeric | YES |  |
| 22 | `merchant_discount_amount` | numeric | YES |  |
| 23 | `merchant_discount_rate` | numeric | YES |  |
| 24 | `merchant_rebate_amount` | numeric | YES |  |
| 25 | `merchant_rebate_rate` | numeric | YES |  |
| 26 | `money_factor` | numeric | YES |  |
| 27 | `next_payment_due_date` | date | YES |  |
| 28 | `next_payment_with_tax` | numeric | YES |  |
| 29 | `number_of_payments_made` | integer | YES |  |
| 30 | `payment_frequency` | character varying(255) | YES |  |
| 31 | `plat_form_fee_amount` | numeric | YES |  |
| 32 | `plat_form_fee_rate` | numeric | YES |  |
| 33 | `processing_fee` | numeric | YES |  |
| 34 | `protection_plan_fee` | numeric | YES |  |
| 35 | `remaining_number_of_payments` | integer | YES |  |
| 36 | `tax_amount` | numeric | YES |  |
| 37 | `tax_per_scheduled_payment` | numeric | YES |  |
| 38 | `tax_rate` | numeric | YES |  |
| 39 | `term_in_months` | integer | YES |  |
| 40 | `total_contract_amount_with_tax_and_fees` | numeric | YES |  |
| 41 | `total_number_of_payments` | integer | YES |  |
| 42 | `total_recycle_fee` | numeric | YES |  |
| 43 | `account_pk` | bigint | YES |  |
| 44 | `delinquency_as_of_date` | date | YES |  |
| 45 | `security_deposit` | numeric | YES |  |
| 46 | `redirect_url` | character varying(255) | YES |  |
| 47 | `first_payment_no_tax_no_fees` | numeric | YES |  |
| 48 | `first_payment_no_tax_with_fees` | numeric | YES |  |
| 49 | `first_payment_tax` | numeric | YES |  |
| 50 | `frequency_changes` | integer | YES |  |
| 51 | `last_payment_no_tax_no_fees` | numeric | YES |  |
| 52 | `last_payment_no_tax_with_fees` | numeric | YES |  |
| 53 | `last_payment_tax` | numeric | YES |  |
| 54 | `last_tax_updated_time` | timestamp without time zone | YES |  |
| 55 | `next_payment_no_tax_no_fees` | numeric | YES |  |
| 56 | `regular_payment_tax` | numeric | YES |  |
| 57 | `buyout_fee` | numeric | YES |  |
| 58 | `amount_charged_at_signing` | numeric | YES |  |
| 59 | `signing_fee` | numeric | YES |  |
| 60 | `epo_amount_with_tax` | numeric | YES |  |
| 61 | `ks_label` | character varying(255) | YES |  |
| 62 | `program_name` | character varying(255) | YES |  |
| 63 | `short_code` | character varying(8) | YES |  |
| 64 | `plan_id` | character varying(255) | YES |  |

## uown_sv_sql_config

**Schema:** `public` | **Columns:** 8

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_sv_sql_config_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `sql_name` | character varying(255) | YES |  |
| 8 | `sql_query` | text | YES |  |

## uown_sv_sql_config_history

**Schema:** `public` | **Columns:** 10

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `rev` | integer | NO |  |
| 3 | `revtype` | smallint | YES |  |
| 4 | `agent` | character varying(255) | YES |  |
| 5 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 6 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 7 | `tenant_id` | bigint | YES |  |
| 8 | `web_user_id` | bigint | YES |  |
| 9 | `sql_name` | character varying(255) | YES |  |
| 10 | `sql_query` | text | YES |  |

## uown_sv_transaction

**Schema:** `public` | **Columns:** 30

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_sv_transaction_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `cancelled_or_reversed` | boolean | YES |  |
| 8 | `comments` | text | YES |  |
| 9 | `due_amount` | numeric | YES |  |
| 10 | `due_date` | date | YES |  |
| 11 | `next_due_date` | date | YES |  |
| 12 | `payment_pk` | bigint | YES |  |
| 13 | `receivable_pk` | bigint | YES |  |
| 14 | `remaining_payment_amount` | numeric | YES |  |
| 15 | `tax_amount` | numeric | YES |  |
| 16 | `total_due_amount` | numeric | YES |  |
| 17 | `total_payment_amount` | numeric | YES |  |
| 18 | `transaction_date` | date | YES |  |
| 19 | `transaction_type` | character varying(255) | YES |  |
| 20 | `account_pk` | bigint | YES |  |
| 21 | `remaining_due_amount` | numeric | YES |  |
| 22 | `total_allocated_amount` | numeric | YES |  |
| 23 | `username` | character varying(255) | YES |  |
| 24 | `days_late` | integer | YES |  |
| 25 | `allocated_amount` | numeric | YES |  |
| 26 | `non_taxable_amount` | numeric | YES |  |
| 27 | `receivable_type` | character varying(255) | YES |  |
| 28 | `tax_rate` | numeric | YES |  |
| 29 | `taxable_amount` | numeric | YES |  |
| 30 | `past_due_balance` | numeric | YES |  |

## uown_sv_transaction_history

**Schema:** `public` | **Columns:** 4

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `rev` | integer | NO |  |
| 3 | `revtype` | smallint | YES |  |
| 4 | `account_pk` | bigint | YES |  |

## uown_sv_uwdata

**Schema:** `public` | **Columns:** 32

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_sv_uwdata_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `abb_uw_response` | text | YES |  |
| 8 | `approval_amount` | numeric | YES |  |
| 9 | `approval_expiration_date` | date | YES |  |
| 10 | `decided_by_agent` | character varying(255) | YES |  |
| 11 | `decision_code` | character varying(255) | YES |  |
| 12 | `decision_made_at` | timestamp without time zone | YES |  |
| 13 | `risk_score` | bigint | YES |  |
| 14 | `uw_status` | character varying(255) | YES |  |
| 15 | `account_pk` | bigint | YES |  |
| 16 | `bank_verification_required` | boolean | YES |  |
| 17 | `charge_processing_fee` | boolean | YES |  |
| 18 | `is_intellicheck_required` | boolean | YES |  |
| 19 | `tier_x` | integer | YES |  |
| 20 | `tier_y` | integer | YES |  |
| 21 | `lambda_segment` | integer | YES |  |
| 22 | `previous_uw` | text | YES |  |
| 23 | `risk_type` | character varying(255) | YES |  |
| 24 | `uw_approval_amount` | numeric | YES |  |
| 25 | `cash_score_threshold` | integer | YES |  |
| 26 | `vantage_score` | integer | YES |  |
| 27 | `eligible_terms` | character varying(255) | YES |  |
| 28 | `campaign_id` | integer | YES |  |
| 29 | `internal_decision` | character varying(255) | YES |  |
| 30 | `is_eligible_for_extra_info` | boolean | YES |  |
| 31 | `npm_segment` | integer | YES |  |
| 32 | `tam_score` | integer | YES |  |

## uown_sweep_logs

**Schema:** `public` | **Columns:** 15

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_sweep_logs_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `ach_pks` | text | YES |  |
| 8 | `end_time` | timestamp without time zone | YES |  |
| 9 | `error` | text | YES |  |
| 10 | `number_of_records_processed` | integer | YES |  |
| 11 | `source` | character varying(255) | YES |  |
| 12 | `start_time` | timestamp without time zone | YES |  |
| 13 | `sweep_name` | character varying(255) | YES |  |
| 14 | `num_threads_made` | integer | YES |  |
| 15 | `pod` | character varying(255) | YES |  |

## uown_tax_cloud

**Schema:** `public` | **Columns:** 16

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_tax_cloud_pk_seq'::regclass) |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `account_pk` | bigint | YES |  |
| 6 | `cart_id` | character varying(255) | YES |  |
| 7 | `lead_pk` | bigint | YES |  |
| 8 | `order_id` | character varying(255) | YES |  |
| 9 | `status` | character varying(255) | YES |  |
| 10 | `tax_amount` | double precision | YES |  |
| 11 | `tax_rate` | double precision | YES |  |
| 12 | `agent` | character varying(255) | YES |  |
| 13 | `web_user_id` | bigint | YES |  |
| 14 | `api` | character varying(255) | YES |  |
| 15 | `total_price_amount` | character varying(255) | YES |  |
| 16 | `total_tax_amount` | character varying(255) | YES |  |

## uown_tax_cloud_outbound

**Schema:** `public` | **Columns:** 19

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_tax_cloud_outbound_pk_seq'::regclass) |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `api` | character varying(255) | YES |  |
| 8 | `call_type` | character varying(255) | YES |  |
| 9 | `fraud_verification_pk` | bigint | YES |  |
| 10 | `header` | text | YES |  |
| 11 | `request` | text | YES |  |
| 12 | `request_object` | text | YES |  |
| 13 | `response` | text | YES |  |
| 14 | `source` | character varying(255) | YES |  |
| 15 | `stack_trace` | text | YES |  |
| 16 | `url` | text | YES |  |
| 17 | `return_uuid` | character varying(255) | YES |  |
| 18 | `source_uuid` | character varying(255) | YES |  |
| 19 | `uuid` | character varying(255) | YES |  |

## uown_tax_for_zip

**Schema:** `public` | **Columns:** 17

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `combined_tax_rate` | numeric | YES |  |
| 6 | `zip_code` | character varying(255) | YES |  |
| 7 | `city` | character varying(255) | YES |  |
| 8 | `country` | character varying(255) | YES |  |
| 9 | `county` | character varying(255) | YES |  |
| 10 | `state` | character varying(255) | YES |  |
| 11 | `street` | character varying(255) | YES |  |
| 12 | `tax_jar_api_url` | character varying(255) | YES |  |
| 13 | `tax_jar_params` | text | YES |  |
| 14 | `tax_jar_response` | text | YES |  |
| 15 | `tax_jar_token` | character varying(255) | YES |  |
| 16 | `expiration_date` | date | YES |  |
| 17 | `vendor` | character varying(255) | YES |  |

## uown_template

**Schema:** `public` | **Columns:** 34

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_template_pk_seq'::regclass) |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `web_user_id` | bigint | YES |  |
| 6 | `attachments` | text | YES |  |
| 7 | `created_by` | character varying(255) | YES |  |
| 8 | `current` | boolean | YES |  |
| 9 | `data_fields` | text | YES |  |
| 10 | `data_fields_sql` | text | YES |  |
| 11 | `day_limit` | integer | YES |  |
| 12 | `do_not_use` | boolean | YES |  |
| 13 | `document_name` | character varying(255) | YES |  |
| 14 | `esign_parameters` | text | YES |  |
| 15 | `language` | character varying(255) | YES |  |
| 16 | `location` | character varying(255) | YES |  |
| 17 | `month_limit` | integer | YES |  |
| 18 | `no_limit` | boolean | YES |  |
| 19 | `priority` | integer | YES |  |
| 20 | `program_id` | character varying(255) | YES |  |
| 21 | `rules` | text | YES |  |
| 22 | `state_code` | character varying(255) | YES |  |
| 23 | `state_name` | character varying(255) | YES |  |
| 24 | `subject` | text | YES |  |
| 25 | `template_content` | text | YES |  |
| 26 | `template_name` | character varying(255) | YES |  |
| 27 | `template_type` | character varying(255) | YES |  |
| 28 | `total_limit` | integer | YES |  |
| 29 | `trigger_type` | character varying(255) | YES |  |
| 30 | `version_number` | bigint | NO |  |
| 31 | `week_limit` | integer | YES |  |
| 32 | `year_limit` | integer | YES |  |
| 33 | `client_type` | text | YES |  |
| 34 | `is_native` | boolean | YES |  |

## uown_third_party_contact

**Schema:** `public` | **Columns:** 8

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | nextval('uown_third_party_contact_pk_seq'::regclass) |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `account_pk` | bigint | YES |  |
| 6 | `name` | character varying(255) | YES |  |
| 7 | `phone_number` | character varying(255) | YES |  |
| 8 | `relationship` | character varying(255) | YES |  |

## uown_uw_engine_data

**Schema:** `public` | **Columns:** 17

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `failure_reasons` | text | YES |  |
| 8 | `lead_pk` | bigint | YES |  |
| 9 | `status` | character varying(255) | YES |  |
| 10 | `neustar_pk` | bigint | YES |  |
| 11 | `sentilink_pk` | bigint | YES |  |
| 12 | `fraud_verification_pk` | bigint | YES |  |
| 13 | `lexis_nexis_pk` | bigint | YES |  |
| 14 | `lexis_nexis_time_taken_in_ms` | bigint | YES |  |
| 15 | `neustar_time_taken_in_ms` | bigint | YES |  |
| 16 | `sentilink_time_taken_in_ms` | bigint | YES |  |
| 17 | `seon_time_taken_in_ms` | bigint | YES |  |

## uown_uwengine_outbound

**Schema:** `public` | **Columns:** 15

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `api` | character varying(255) | YES |  |
| 8 | `call_type` | character varying(255) | YES |  |
| 9 | `header` | text | YES |  |
| 10 | `request` | text | YES |  |
| 11 | `request_object` | text | YES |  |
| 12 | `response` | text | YES |  |
| 13 | `source` | character varying(255) | YES |  |
| 14 | `stack_trace` | text | YES |  |
| 15 | `url` | text | YES |  |

## uown_uwstep

**Schema:** `public` | **Columns:** 7

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `override_from_statuses` | text | YES |  |
| 6 | `step_name` | character varying(255) | YES |  |
| 7 | `step_order` | integer | YES |  |

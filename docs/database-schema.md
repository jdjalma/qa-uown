# Database Schema — QA2 (svc)

> **Source:** `postgresql://127.0.0.1:5445/svc` (QA2 environment)  
> **Extracted:** 2026-03-04 (Sticky tables added 2026-05-20 from qa1 — see [[project-svc-485-sticky-recover]])  
> **Tables:** 194  

## Table of Contents

- [appdbsettings](#appdbsettings) (5 columns)
- [flyway_schema_history](#flyway_schema_history) (10 columns)
- [jv_commit](#jv_commit) (5 columns)
- [jv_commit_property](#jv_commit_property) (3 columns)
- [jv_global_id](#jv_global_id) (5 columns)
- [jv_snapshot](#jv_snapshot) (8 columns)
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
- [uown_account_tax_record](#uown_account_tax_record) (15 columns)
- [uown_accounts_to_be_sold](#uown_accounts_to_be_sold) (3 columns)
- [uown_address_verification](#uown_address_verification) (21 columns)
- [uown_api_info_tracker](#uown_api_info_tracker) (10 columns)
- [uown_api_key](#uown_api_key) (9 columns)
- [uown_api_user](#uown_api_user) (9 columns)
- [uown_approved_amount_by_segment](#uown_approved_amount_by_segment) (9 columns)
- [uown_bank_verification](#uown_bank_verification) (17 columns)
- [uown_bank_verification_attributes](#uown_bank_verification_attributes) (3 columns)
- [uown_bank_verification_outbound](#uown_bank_verification_outbound) (16 columns)
- [uown_ccverification_outbound_log](#uown_ccverification_outbound_log) (16 columns)
- [uown_company](#uown_company) (19 columns)
- [uown_configuration_management](#uown_configuration_management) (8 columns)
- [uown_correspondence_logs](#uown_correspondence_logs) (13 columns)
- [uown_correspondence_tracking](#uown_correspondence_tracking) (11 columns)
- [uown_customer_verification_data](#uown_customer_verification_data) (18 columns)
- [uown_data_intelligence_outbound](#uown_data_intelligence_outbound) (15 columns)
- [uown_due_date_moves](#uown_due_date_moves) (12 columns)
- [uown_email_attachment](#uown_email_attachment) (13 columns)
- [uown_email_queue](#uown_email_queue) (31 columns)
- [uown_esign_document](#uown_esign_document) (51 columns)
- [uown_esign_event_trigger_log](#uown_esign_event_trigger_log) (17 columns)
- [uown_failed_achpayments_from_vendor](#uown_failed_achpayments_from_vendor) (8 columns)
- [uown_fraud_engine_outbound](#uown_fraud_engine_outbound) (17 columns)
- [uown_fraud_verification](#uown_fraud_verification) (34 columns)
- [uown_frequency_mods](#uown_frequency_mods) (13 columns)
- [uown_funding_bank_account](#uown_funding_bank_account) (10 columns)
- [uown_funding_modification](#uown_funding_modification) (10 columns)
- [uown_funding_transaction](#uown_funding_transaction) (49 columns)
- [uown_funding_transaction_items](#uown_funding_transaction_items) (2 columns)
- [uown_gds_token](#uown_gds_token) (6 columns)
- [uown_identity_verification_outbound_log](#uown_identity_verification_outbound_log) (16 columns)
- [uown_import_log](#uown_import_log) (18 columns)
- [uown_intellicheck](#uown_intellicheck) (23 columns)
- [uown_inventory_category](#uown_inventory_category) (7 columns)
- [uown_kount](#uown_kount) (19 columns)
- [uown_kount_token](#uown_kount_token) (6 columns)
- [uown_lead_modifications](#uown_lead_modifications) (18 columns)
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
- [uown_los_black_list](#uown_los_black_list) (19 columns)
- [uown_los_black_list_history](#uown_los_black_list_history) (21 columns)
- [uown_los_contract](#uown_los_contract) (22 columns)
- [uown_los_contract_history](#uown_los_contract_history) (24 columns)
- [uown_los_credit_card](#uown_los_credit_card) (39 columns)
- [uown_los_credit_card_history](#uown_los_credit_card_history) (40 columns)
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
- [uown_los_lead](#uown_los_lead) (78 columns)
- [uown_los_lead_notes](#uown_los_lead_notes) (8 columns)
- [uown_los_lead_short_code](#uown_los_lead_short_code) (8 columns)
- [uown_los_lead_short_code_history](#uown_los_lead_short_code_history) (10 columns)
- [uown_los_outbound_api_log](#uown_los_outbound_api_log) (19 columns)
- [uown_los_payment](#uown_los_payment) (25 columns)
- [uown_los_payment_options](#uown_los_payment_options) (62 columns)
- [uown_los_payment_options_history](#uown_los_payment_options_history) (64 columns)
- [uown_los_phone](#uown_los_phone) (17 columns)
- [uown_los_phone_history](#uown_los_phone_history) (19 columns)
- [uown_los_protection_plan](#uown_los_protection_plan) (25 columns)
- [uown_los_receivable](#uown_los_receivable) (23 columns)
- [uown_los_receivable_history](#uown_los_receivable_history) (4 columns)
- [uown_los_sched_summary](#uown_los_sched_summary) (62 columns)
- [uown_los_sched_summary_history](#uown_los_sched_summary_history) (64 columns)
- [uown_los_uwdata](#uown_los_uwdata) (29 columns)
- [uown_los_uwdata_history](#uown_los_uwdata_history) (9 columns)
- [uown_mail_queue](#uown_mail_queue) (22 columns)
- [uown_merchant](#uown_merchant) (150 columns)
- [uown_merchant_activity_log](#uown_merchant_activity_log) (23 columns)
- [uown_merchant_api_error_log](#uown_merchant_api_error_log) (15 columns)
- [uown_merchant_api_error_log_history](#uown_merchant_api_error_log_history) (17 columns)
- [uown_merchant_bank_account](#uown_merchant_bank_account) (12 columns)
- [uown_merchant_bank_account_history](#uown_merchant_bank_account_history) (14 columns)
- [uown_merchant_history](#uown_merchant_history) (151 columns)
- [uown_merchant_program](#uown_merchant_program) (27 columns)
- [uown_merchant_to_program](#uown_merchant_to_program) (9 columns)
- [uown_neuro_id_verification](#uown_neuro_id_verification) (13 columns)
- [uown_neuro_id_verification_attributes](#uown_neuro_id_verification_attributes) (4 columns)
- [uown_neustar](#uown_neustar) (48 columns)
- [uown_paywallet](#uown_paywallet) (27 columns)
- [uown_paywallet_history](#uown_paywallet_history) (29 columns)
- [uown_paywallet_outbound_api_log](#uown_paywallet_outbound_api_log) (15 columns)
- [uown_plaid_report](#uown_plaid_report) (12 columns)
- [uown_plaid_user](#uown_plaid_user) (8 columns)
- [uown_pw_affordability](#uown_pw_affordability) (8 columns)
- [uown_pw_allocation](#uown_pw_allocation) (11 columns)
- [uown_pw_inbound_api_log](#uown_pw_inbound_api_log) (17 columns)
- [uown_revinfo](#uown_revinfo) (2 columns)
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
- [uown_sms_queue](#uown_sms_queue) (32 columns)
- [uown_state_configurations](#uown_state_configurations) (17 columns)
- [uown_state_configurations_log](#uown_state_configurations_log) (8 columns)
- [uown_sticky](#uown_sticky) (15 columns)
- [uown_sticky_inbound_log](#uown_sticky_inbound_log) (17 columns)
- [uown_sticky_outbound_log](#uown_sticky_outbound_log) (13 columns)
- [uown_sticky_retry_attempt](#uown_sticky_retry_attempt) (16 columns)
- [uown_sticky_webhook_dedupe](#uown_sticky_webhook_dedupe) (7 columns)
- [uown_stored_doc](#uown_stored_doc) (30 columns)
- [uown_sv_account](#uown_sv_account) (45 columns)
- [uown_sv_account_notes](#uown_sv_account_notes) (8 columns)
- [uown_sv_achpayment](#uown_sv_achpayment) (50 columns)
- [uown_sv_achpayment_history](#uown_sv_achpayment_history) (4 columns)
- [uown_sv_activity_log](#uown_sv_activity_log) (18 columns)
- [uown_sv_address](#uown_sv_address) (21 columns)
- [uown_sv_alert](#uown_sv_alert) (10 columns)
- [uown_sv_allocation](#uown_sv_allocation) (16 columns)
- [uown_sv_allocation_history](#uown_sv_allocation_history) (18 columns)
- [uown_sv_auth_token](#uown_sv_auth_token) (9 columns)
- [uown_sv_bank_account](#uown_sv_bank_account) (19 columns)
- [uown_sv_bank_account_history](#uown_sv_bank_account_history) (21 columns)
- [uown_sv_contract](#uown_sv_contract) (22 columns)
- [uown_sv_credit_card](#uown_sv_credit_card) (39 columns)
- [uown_sv_credit_card_history](#uown_sv_credit_card_history) (40 columns)
- [uown_sv_credit_card_transaction](#uown_sv_credit_card_transaction) (79 columns)
- [uown_sv_customer](#uown_sv_customer) (27 columns)
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
- [uown_sv_phone](#uown_sv_phone) (17 columns)
- [uown_sv_phone_history](#uown_sv_phone_history) (19 columns)
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
- [uown_sv_uwdata](#uown_sv_uwdata) (29 columns)
- [uown_sweep_logs](#uown_sweep_logs) (15 columns)
- [uown_tax_cloud](#uown_tax_cloud) (16 columns)
- [uown_tax_cloud_outbound](#uown_tax_cloud_outbound) (19 columns)
- [uown_tax_for_zip](#uown_tax_for_zip) (17 columns)
- [uown_template](#uown_template) (35 columns)
- [uown_third_party_contact](#uown_third_party_contact) (8 columns)
- [uown_uw_engine_data](#uown_uw_engine_data) (17 columns)
- [uown_uwengine_outbound](#uown_uwengine_outbound) (15 columns)
- [uown_uwstep](#uown_uwstep) (7 columns)

---

## appdbsettings

**Schema:** `public` | **Columns:** 5

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `env_name` | character varying(50) | NO |  |
| 2 | `db_url` | character varying(255) | YES |  |
| 3 | `db_username` | character varying(100) | YES |  |
| 4 | `db_password` | character varying(100) | YES |  |
| 5 | `db_driver` | character varying(100) | YES |  |

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
| 8 | `installed_on` | timestamp without time zone | NO | `now()` |
| 9 | `execution_time` | integer | NO |  |
| 10 | `success` | boolean | NO |  |

## jv_commit

**Schema:** `public` | **Columns:** 5

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `commit_pk` | bigint | NO |  |
| 2 | `author` | character varying(200) | YES |  |
| 3 | `commit_date` | timestamp without time zone | YES |  |
| 4 | `commit_date_instant` | character varying(30) | YES |  |
| 5 | `commit_id` | numeric(22,2) | YES |  |

## jv_commit_property

**Schema:** `public` | **Columns:** 3

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `property_name` | character varying(191) | NO |  |
| 2 | `property_value` | character varying(600) | YES |  |
| 3 | `commit_fk` | bigint | NO |  |

## jv_global_id

**Schema:** `public` | **Columns:** 5

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `global_id_pk` | bigint | NO |  |
| 2 | `local_id` | character varying(191) | YES |  |
| 3 | `fragment` | character varying(200) | YES |  |
| 4 | `type_name` | character varying(200) | YES |  |
| 5 | `owner_id_fk` | bigint | YES |  |

## jv_snapshot

**Schema:** `public` | **Columns:** 8

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `snapshot_pk` | bigint | NO |  |
| 2 | `type` | character varying(200) | YES |  |
| 3 | `version` | bigint | YES |  |
| 4 | `state` | text | YES |  |
| 5 | `changed_properties` | text | YES |  |
| 6 | `managed_type` | character varying(200) | YES |  |
| 7 | `global_id_fk` | bigint | YES |  |
| 8 | `commit_fk` | bigint | YES |  |

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
| 11 | `dec_prop_1` | numeric(13,4) | YES |  |
| 12 | `dec_prop_2` | numeric(13,4) | YES |  |
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

## uown_account_tax_record

**Schema:** `public` | **Columns:** 15

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_account_tax_record_pk_seq'::regclass)` |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `account_pk` | bigint | NO |  |
| 8 | `address` | character varying(255) | YES |  |
| 9 | `city` | character varying(255) | YES |  |
| 10 | `country` | character varying(255) | YES |  |
| 11 | `new_tax_rate` | numeric(9,5) | YES |  |
| 12 | `old_tax_rate` | numeric(9,5) | YES |  |
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
| 1 | `pk` | bigint | NO | `nextval('uown_address_verification_pk_seq'::regclass)` |
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
| 16 | `estimated_value` | numeric(19,2) | YES |  |
| 17 | `last_run` | date | YES |  |
| 18 | `melissa_data_pk` | bigint | NO |  |
| 19 | `mortgage_value` | numeric(19,2) | YES |  |
| 20 | `is_autocomplete_verified` | boolean | YES |  |
| 21 | `zip_code9` | character varying(255) | YES |  |

## uown_api_info_tracker

**Schema:** `public` | **Columns:** 10

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_api_info_tracker_pk_seq'::regclass)` |
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
| 1 | `pk` | bigint | NO | `nextval('uown_api_key_pk_seq'::regclass)` |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `api_user_pk` | bigint | NO |  |
| 8 | `expires` | timestamp without time zone | YES |  |
| 9 | `key` | character varying(500) | YES |  |

## uown_api_user

**Schema:** `public` | **Columns:** 9

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_api_user_pk_seq'::regclass)` |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `company_name` | character varying(255) | YES |  |
| 8 | `password` | character varying(255) | YES |  |
| 9 | `username` | character varying(255) | YES |  |

## uown_approved_amount_by_segment

**Schema:** `public` | **Columns:** 9

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_approved_amount_by_segment_pk_seq'::regclass)` |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `lambda_segment` | integer | NO |  |
| 8 | `max_approved_amount_cr` | numeric(10,2) | NO |  |
| 9 | `risk_type` | character varying(50) | NO |  |

## uown_bank_verification

**Schema:** `public` | **Columns:** 17

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_bank_verification_pk_seq'::regclass)` |
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
| 1 | `pk` | bigint | NO | `nextval('uown_bank_verification_outbound_pk_seq'::regclass)` |
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
| 1 | `pk` | bigint | NO | `nextval('uown_ccverification_outbound_log_pk_seq'::regclass)` |
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
| 1 | `pk` | bigint | NO | `nextval('uown_company_pk_seq'::regclass)` |
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
| 17 | `hours_of_operation_weekdays` | character varying(255) | YES | `'8:00 AM – 11:00 PM (EST)'::character varying` |
| 18 | `hours_of_operation_saturday` | character varying(255) | YES | `'9:00 AM – 11:00 PM (EST)'::character varying` |
| 19 | `hours_of_operation_sunday` | character varying(255) | YES | `'10:00 AM – 11:00 PM (EST)'::character varying` |

## uown_configuration_management

**Schema:** `public` | **Columns:** 8

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_configuration_management_pk_seq'::regclass)` |
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
| 1 | `pk` | bigint | NO | `nextval('uown_correspondence_logs_pk_seq'::regclass)` |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `data_map` | text | YES |  |
| 8 | `error` | text | YES |  |
| 9 | `source` | integer | YES |  |
| 10 | `template_name` | character varying(255) | YES |  |
| 11 | `correspondence_type` | character varying(255) | YES |  |
| 12 | `account_pk` | bigint | YES |  |
| 13 | `lead_pk` | bigint | YES |  |

## uown_correspondence_tracking

**Schema:** `public` | **Columns:** 11

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_correspondence_tracking_pk_seq'::regclass)` |
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

## uown_customer_verification_data

**Schema:** `public` | **Columns:** 18

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_customer_verification_data_pk_seq'::regclass)` |
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
| 1 | `pk` | bigint | NO | `nextval('uown_data_intelligence_outbound_pk_seq'::regclass)` |
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
| 1 | `pk` | bigint | NO | `nextval('uown_due_date_moves_pk_seq'::regclass)` |
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
| 1 | `pk` | bigint | NO | `nextval('uown_email_attachment_pk_seq'::regclass)` |
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
| 1 | `pk` | bigint | NO | `nextval('uown_email_queue_pk_seq'::regclass)` |
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
| 29 | `to_email_addresses` | character varying(255) | NO |  |
| 30 | `from_email_name` | character varying(255) | YES |  |
| 31 | `id` | character varying(255) | YES |  |

## uown_esign_document

**Schema:** `public` | **Columns:** 51

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_esign_document_pk_seq'::regclass)` |
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
| 1 | `pk` | bigint | NO | `nextval('uown_esign_event_trigger_log_pk_seq'::regclass)` |
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
| 1 | `pk` | bigint | NO | `nextval('uown_failed_achpayments_from_vendor_pk_seq'::regcla` |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `failed_reason` | text | YES |  |
| 6 | `identification_number` | bigint | YES |  |
| 7 | `is_success` | boolean | YES |  |
| 8 | `payment_json` | text | YES |  |

## uown_fraud_engine_outbound

**Schema:** `public` | **Columns:** 17

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_fraud_engine_outbound_pk_seq'::regclass)` |
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
| 16 | `fraud_engine_pk` | bigint | YES |  |
| 17 | `fraud_verification_pk` | bigint | YES |  |

## uown_fraud_verification

**Schema:** `public` | **Columns:** 34

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_fraud_verification_pk_seq'::regclass)` |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `applied_rules` | text | YES |  |
| 6 | `country_code` | character varying(255) | YES |  |
| 7 | `email` | character varying(255) | YES |  |
| 8 | `email_score` | numeric(19,2) | YES |  |
| 9 | `error` | character varying(255) | YES |  |
| 10 | `fraud_score` | numeric(19,2) | YES |  |
| 11 | `ip` | character varying(255) | YES |  |
| 12 | `ip_score` | numeric(19,2) | YES |  |
| 13 | `lead_pk` | bigint | YES |  |
| 14 | `phone_number` | character varying(255) | YES |  |
| 15 | `phone_score` | numeric(19,2) | YES |  |
| 16 | `status` | character varying(255) | YES |  |
| 17 | `success` | boolean | YES |  |
| 18 | `city` | character varying(255) | YES |  |
| 19 | `country` | character varying(255) | YES |  |
| 20 | `date_of_birth` | date | YES |  |
| 21 | `decline_reason` | character varying(255) | YES |  |
| 22 | `full_name` | character varying(255) | YES |  |
| 23 | `seon_finger_print_text` | text | YES |  |
| 24 | `state` | character varying(255) | YES |  |
| 25 | `street` | character varying(255) | YES |  |
| 26 | `street2` | character varying(255) | YES |  |
| 27 | `zip` | character varying(255) | YES |  |
| 28 | `applied_rules_codes` | text | YES |  |
| 29 | `fraud_engine_status` | character varying(255) | YES |  |
| 30 | `agent` | character varying(255) | YES |  |
| 31 | `web_user_id` | bigint | YES |  |
| 32 | `brand_id` | character varying(255) | YES |  |
| 33 | `raw_response` | text | YES |  |
| 34 | `device_hash` | text | YES |  |

## uown_frequency_mods

**Schema:** `public` | **Columns:** 13

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_frequency_mods_pk_seq'::regclass)` |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `account_pk` | bigint | NO |  |
| 8 | `first_due_date` | date | YES |  |
| 9 | `new_frequency` | character varying(255) | YES |  |
| 10 | `new_term_payment` | numeric(19,2) | YES |  |
| 11 | `old_frequency` | character varying(255) | YES |  |
| 12 | `old_term_payment` | numeric(19,2) | YES |  |
| 13 | `second_due_date` | date | YES |  |

## uown_funding_bank_account

**Schema:** `public` | **Columns:** 10

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_funding_bank_account_pk_seq'::regclass)` |
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
| 1 | `pk` | bigint | NO | `nextval('uown_funding_modification_pk_seq'::regclass)` |
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

**Schema:** `public` | **Columns:** 49

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_funding_transaction_pk_seq'::regclass)` |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `amount_to_be_funded` | numeric(19,2) | YES |  |
| 6 | `customer_name` | character varying(255) | YES |  |
| 7 | `dealer_discount` | numeric(19,2) | YES |  |
| 8 | `dealer_rebate` | numeric(19,2) | YES |  |
| 9 | `fees` | numeric(19,2) | YES |  |
| 10 | `fund_date_time` | timestamp without time zone | YES |  |
| 11 | `funding_request_date_time` | timestamp without time zone | YES |  |
| 12 | `funding_status` | character varying(255) | YES |  |
| 13 | `invoice_amount` | numeric(19,2) | YES |  |
| 14 | `lead_pk` | bigint | YES |  |
| 15 | `lead_status` | character varying(255) | YES |  |
| 16 | `merchant_name` | character varying(255) | YES |  |
| 17 | `merchant_pk` | bigint | YES |  |
| 18 | `partial_settlement` | boolean | YES |  |
| 19 | `plat_form_fee` | numeric(19,2) | YES |  |
| 20 | `tax_amount` | numeric(19,2) | YES |  |
| 21 | `total_contract_amount` | numeric(19,2) | YES |  |
| 22 | `total_cost` | numeric(19,2) | YES |  |
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
| 40 | `cc_processing_fee` | numeric(19,2) | YES |  |
| 41 | `five_day_funding_exception` | boolean | YES |  |
| 42 | `invoice_type` | character varying(255) | YES |  |
| 43 | `refund_request_date_time` | timestamp without time zone | YES |  |
| 44 | `refunded_date_time` | timestamp without time zone | YES |  |
| 45 | `two_day_funding_exception` | boolean | YES |  |
| 46 | `user_notes` | text | YES |  |
| 47 | `merchandise_amount` | numeric(19,2) | YES |  |
| 48 | `sales_rep_code` | character varying(255) | YES |  |
| 49 | `created_from` | character varying(255) | YES |  |

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

## uown_identity_verification_outbound_log

**Schema:** `public` | **Columns:** 16

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_identity_verification_outbound_log_pk_seq'::re` |
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
| 1 | `pk` | bigint | NO | `nextval('uown_import_log_pk_seq'::regclass)` |
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
| 1 | `pk` | bigint | NO | `nextval('uown_intellicheck_pk_seq'::regclass)` |
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
| 12 | `result_location` | text | YES |  |
| 13 | `results` | text | YES |  |
| 14 | `ingest_token` | character varying(255) | YES |  |
| 15 | `success` | boolean | YES |  |
| 16 | `user_token` | character varying(255) | YES |  |
| 17 | `back_image` | text | YES |  |
| 18 | `front_image` | text | YES |  |
| 19 | `location` | character varying(255) | YES |  |
| 20 | `id_verify_success` | boolean | YES |  |
| 21 | `id_expired` | boolean | YES |  |
| 22 | `barcode_data` | text | YES |  |
| 23 | `number_of_tries` | integer | YES |  |

## uown_inventory_category

**Schema:** `public` | **Columns:** 7

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_inventory_category_pk_seq'::regclass)` |
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
| 1 | `pk` | bigint | NO | `nextval('uown_kount_pk_seq'::regclass)` |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `account_pk` | bigint | YES |  |
| 6 | `cc_expiration_date` | character varying(255) | YES |  |
| 7 | `cc_pk` | bigint | YES |  |
| 8 | `errors` | text | YES |  |
| 9 | `first_name` | character varying(255) | YES |  |
| 10 | `kount_result` | character varying(255) | YES |  |
| 11 | `last_name` | character varying(255) | YES |  |
| 12 | `lead_pk` | bigint | YES |  |
| 13 | `masked_credit_card` | character varying(255) | YES |  |
| 14 | `request_params` | text | YES |  |
| 15 | `response_params` | text | YES |  |
| 16 | `session_id` | character varying(255) | YES |  |
| 17 | `transaction_id` | character varying(255) | YES |  |
| 18 | `warnings` | text | YES |  |
| 19 | `omni_score` | real | YES |  |

## uown_kount_token

**Schema:** `public` | **Columns:** 6

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_kount_token_pk_seq'::regclass)` |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `access_token` | character varying(2048) | YES |  |
| 6 | `expiration_time` | timestamp without time zone | YES |  |

## uown_lead_modifications

**Schema:** `public` | **Columns:** 18

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_lead_modifications_pk_seq'::regclass)` |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `agent_username` | character varying(255) | YES |  |
| 8 | `lead_pk` | bigint | YES |  |
| 9 | `mod_type` | character varying(255) | YES |  |
| 10 | `new_amount` | numeric(19,2) | YES |  |
| 11 | `new_status` | character varying(255) | YES |  |
| 12 | `old_amount` | numeric(19,2) | YES |  |
| 13 | `old_status` | character varying(255) | YES |  |
| 14 | `new_internal_status` | character varying(255) | YES |  |
| 15 | `old_internal_status` | character varying(255) | YES |  |
| 16 | `merchant_pk` | bigint | YES |  |
| 17 | `merchant_location` | character varying(255) | YES |  |
| 18 | `merchant_name` | character varying(255) | YES |  |

## uown_lead_recording

**Schema:** `public` | **Columns:** 6

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_lead_recording_pk_seq'::regclass)` |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `lead_pk` | bigint | YES |  |
| 6 | `uuid` | character varying(255) | YES |  |

## uown_lexis_nexis

**Schema:** `public` | **Columns:** 29

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_lexis_nexis_pk_seq'::regclass)` |
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
| 28 | `value` | numeric(19,2) | YES |  |
| 29 | `zip` | character varying(255) | YES |  |

## uown_lexis_nexis_outbound

**Schema:** `public` | **Columns:** 16

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_lexis_nexis_outbound_pk_seq'::regclass)` |
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
| 1 | `pk` | bigint | NO | `nextval('uown_login_attempt_pk_seq'::regclass)` |
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
| 1 | `pk` | bigint | NO | `nextval('uown_los_activity_log_pk_seq'::regclass)` |
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
| 1 | `pk` | bigint | NO | `nextval('uown_los_address_pk_seq'::regclass)` |
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
| 20 | `is_autocomplete_verified` | boolean | YES |  |
| 21 | `zip_code9` | character varying(255) | YES |  |

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
| 22 | `is_autocomplete_verified` | boolean | YES |  |
| 23 | `zip_code9` | character varying(255) | YES |  |

## uown_los_alert

**Schema:** `public` | **Columns:** 10

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_los_alert_pk_seq'::regclass)` |
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
| 1 | `pk` | bigint | NO | `nextval('uown_los_bank_account_pk_seq'::regclass)` |
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

**Schema:** `public` | **Columns:** 19

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_los_black_list_pk_seq'::regclass)` |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `email_address` | character varying(255) | YES |  |
| 8 | `ip_address` | character varying(255) | YES |  |
| 9 | `phone_number` | character varying(255) | YES |  |
| 10 | `lead_pk` | bigint | YES |  |
| 11 | `first_name` | character varying(255) | YES |  |
| 12 | `last_name` | character varying(255) | YES |  |
| 13 | `street_address1` | character varying(255) | YES |  |
| 14 | `bank_account_number` | character varying(255) | YES |  |
| 15 | `bank_routing_number` | character varying(255) | YES |  |
| 16 | `expiration_date` | date | YES |  |
| 17 | `ssn` | character varying(255) | YES |  |
| 18 | `zip_code` | character varying(255) | YES |  |
| 19 | `cc_bin` | character varying(255) | YES |  |

## uown_los_black_list_history

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
| 9 | `email_address` | character varying(255) | YES |  |
| 10 | `ip_address` | character varying(255) | YES |  |
| 11 | `phone_number` | character varying(255) | YES |  |
| 12 | `lead_pk` | bigint | YES |  |
| 13 | `first_name` | character varying(255) | YES |  |
| 14 | `last_name` | character varying(255) | YES |  |
| 15 | `street_address1` | character varying(255) | YES |  |
| 16 | `bank_account_number` | character varying(255) | YES |  |
| 17 | `bank_routing_number` | character varying(255) | YES |  |
| 18 | `expiration_date` | date | YES |  |
| 19 | `ssn` | character varying(255) | YES |  |
| 20 | `zip_code` | character varying(255) | YES |  |
| 21 | `cc_bin` | character varying(255) | YES |  |

## uown_los_contract

**Schema:** `public` | **Columns:** 22

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_los_contract_pk_seq'::regclass)` |
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
| 18 | `invoice_amount` | numeric(19,2) | YES |  |
| 19 | `attempted_post_back` | boolean | YES |  |
| 20 | `post_back_error` | text | YES |  |
| 21 | `invoice_record` | text | YES |  |
| 22 | `items_record` | text | YES |  |

## uown_los_contract_history

**Schema:** `public` | **Columns:** 24

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
| 20 | `invoice_amount` | numeric(19,2) | YES |  |
| 21 | `attempted_post_back` | boolean | YES |  |
| 22 | `post_back_error` | text | YES |  |
| 23 | `invoice_record` | text | YES |  |
| 24 | `items_record` | text | YES |  |

## uown_los_credit_card

**Schema:** `public` | **Columns:** 39

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_los_credit_card_pk_seq'::regclass)` |
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
| 29 | `cc_hash` | integer | YES |  |
| 30 | `cc_vendor` | character varying(255) | YES |  |
| 31 | `kount_pk` | bigint | YES |  |
| 32 | `kount_session_id` | character varying(255) | YES |  |
| 33 | `pre_auth_status` | character varying(255) | YES |  |
| 34 | `cc_last_four_digit` | character(4) | YES |  |
| 35 | `cc_connector_token` | character varying(255) | YES |  |
| 36 | `invalid_card_reason` | character varying(255) | YES |  |
| 37 | `is_valid_card` | boolean | YES |  |
| 38 | `is_autocomplete_verified` | boolean | YES |  |
| 39 | `cc_zip9` | character varying(255) | YES |  |

## uown_los_credit_card_history

**Schema:** `public` | **Columns:** 40

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
| 31 | `cc_hash` | integer | YES |  |
| 32 | `cc_vendor` | character varying(255) | YES |  |
| 33 | `kount_pk` | bigint | YES |  |
| 34 | `kount_session_id` | character varying(255) | YES |  |
| 35 | `pre_auth_status` | character varying(255) | YES |  |
| 36 | `cc_connector_token` | character varying(255) | YES |  |
| 37 | `invalid_card_reason` | character varying(255) | YES |  |
| 38 | `is_valid_card` | boolean | YES |  |
| 39 | `is_autocomplete_verified` | boolean | YES |  |
| 40 | `cc_zip9` | character varying(255) | YES |  |

## uown_los_credit_card_transaction

**Schema:** `public` | **Columns:** 79

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_los_credit_card_transaction_pk_seq'::regclass)` |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `amount` | numeric(19,2) | YES |  |
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
| 50 | `number_of_tries` | integer | YES |  |
| 51 | `original_ccpk` | bigint | YES |  |
| 52 | `is_deleted` | boolean | YES |  |
| 53 | `rerun_status` | character varying(255) | YES |  |
| 54 | `rerun_nsf_status` | character varying(255) | YES |  |
| 55 | `error_msg` | character varying(255) | YES |  |
| 56 | `remaining_refundable_balance` | numeric(19,2) | YES |  |
| 57 | `remaining_refundable_amount` | numeric(19,2) | YES |  |
| 58 | `error_stacktrace` | text | YES |  |
| 59 | `cc_hash` | integer | YES |  |
| 60 | `cc_vendor` | character varying(255) | YES |  |
| 61 | `kount_pk` | bigint | YES |  |
| 62 | `kount_session_id` | character varying(255) | YES |  |
| 63 | `pre_auth_status` | character varying(255) | YES |  |
| 64 | `charge_type` | character varying(255) | YES |  |
| 65 | `charged_fee_amount` | numeric(19,2) | YES |  |
| 66 | `gateway_auth_token` | character varying(255) | YES |  |
| 67 | `id` | bigint | YES |  |
| 68 | `cc_connector_token` | character varying(255) | YES |  |
| 69 | `invalid_card_reason` | character varying(255) | YES |  |
| 70 | `is_valid_card` | boolean | YES |  |
| 71 | `idempotency_key` | character varying(255) | YES |  |
| 72 | `charge_fee` | boolean | YES |  |
| 73 | `is_autocomplete_verified` | boolean | YES |  |
| 74 | `cc_zip9` | character varying(255) | YES |  |
| 75 | `cc_peek` | boolean | YES |  |
| 76 | `original_amount` | numeric(19,2) | YES |  |
| 77 | `same_day_transaction` | boolean | YES |  |
| 78 | `is_settlement_payment` | boolean | YES |  |
| 79 | `payment_arrangement_pk` | bigint | YES |  |

## uown_los_customer

**Schema:** `public` | **Columns:** 28

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_los_customer_pk_seq'::regclass)` |
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
| 27 | `test` | character varying(255) | YES |  |
| 28 | `middle_name` | character varying(255) | YES |  |

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
| 29 | `test` | character varying(255) | YES |  |
| 30 | `middle_name` | character varying(255) | YES |  |

## uown_los_email

**Schema:** `public` | **Columns:** 12

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_los_email_pk_seq'::regclass)` |
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
| 1 | `pk` | bigint | NO | `nextval('uown_los_employment_pk_seq'::regclass)` |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `annual_income` | numeric(19,2) | YES |  |
| 8 | `duration` | character varying(255) | YES |  |
| 9 | `employer` | character varying(255) | YES |  |
| 10 | `employment_status` | character varying(255) | YES |  |
| 11 | `employment_type` | character varying(255) | YES |  |
| 12 | `hire_date` | date | YES |  |
| 13 | `income_per_pay_period` | numeric(19,2) | YES |  |
| 14 | `job_title` | character varying(255) | YES |  |
| 15 | `last_pay_date` | date | YES |  |
| 16 | `monthly_income` | numeric(19,2) | YES |  |
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
| 9 | `annual_income` | numeric(19,2) | YES |  |
| 10 | `duration` | character varying(255) | YES |  |
| 11 | `employer` | character varying(255) | YES |  |
| 12 | `employment_status` | character varying(255) | YES |  |
| 13 | `employment_type` | character varying(255) | YES |  |
| 14 | `hire_date` | date | YES |  |
| 15 | `income_per_pay_period` | numeric(19,2) | YES |  |
| 16 | `job_title` | character varying(255) | YES |  |
| 17 | `last_pay_date` | date | YES |  |
| 18 | `monthly_income` | numeric(19,2) | YES |  |
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
| 1 | `pk` | bigint | NO | `nextval('uown_los_inbound_api_log_pk_seq'::regclass)` |
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
| 1 | `pk` | bigint | NO | `nextval('uown_los_inbound_internal_log_pk_seq'::regclass)` |
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
| 1 | `pk` | bigint | NO | `nextval('uown_los_invoice_pk_seq'::regclass)` |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `category` | character varying(255) | YES |  |
| 8 | `delivery_fee` | numeric(19,2) | YES |  |
| 9 | `deposit_amount` | numeric(19,2) | YES |  |
| 10 | `description` | text | YES |  |
| 11 | `discount_amount` | numeric(19,2) | YES |  |
| 12 | `installation_fee` | numeric(19,2) | YES |  |
| 13 | `invoice_status` | character varying(255) | YES |  |
| 14 | `last_delivery_date` | date | YES |  |
| 15 | `merchandise_amount` | numeric(19,2) | YES |  |
| 16 | `merchant_invoice_number` | character varying(255) | YES |  |
| 17 | `merchant_pk` | bigint | NO |  |
| 18 | `merchant_protection_plan` | numeric(19,2) | YES |  |
| 19 | `miscellaneous_fee` | numeric(19,2) | YES |  |
| 20 | `shipping_same_as_consumer` | boolean | YES |  |
| 21 | `tax_amount` | numeric(19,2) | YES |  |
| 22 | `total_invoice_amount` | numeric(19,2) | YES |  |
| 23 | `total_number_of_items` | integer | YES |  |
| 24 | `lead_pk` | bigint | YES |  |
| 25 | `invoice_number` | character varying(255) | YES |  |
| 26 | `sales_person` | character varying(255) | YES |  |
| 27 | `order_id` | character varying(255) | YES |  |
| 28 | `external_reference_id` | character varying(255) | YES |  |
| 29 | `purchase_total` | numeric(19,2) | YES |  |

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
| 10 | `delivery_fee` | numeric(19,2) | YES |  |
| 11 | `deposit_amount` | numeric(19,2) | YES |  |
| 12 | `description` | text | YES |  |
| 13 | `discount_amount` | numeric(19,2) | YES |  |
| 14 | `installation_fee` | numeric(19,2) | YES |  |
| 15 | `invoice_status` | character varying(255) | YES |  |
| 16 | `last_delivery_date` | date | YES |  |
| 17 | `merchandise_amount` | numeric(19,2) | YES |  |
| 18 | `merchant_invoice_number` | character varying(255) | YES |  |
| 19 | `merchant_pk` | bigint | YES |  |
| 20 | `merchant_protection_plan` | numeric(19,2) | YES |  |
| 21 | `miscellaneous_fee` | numeric(19,2) | YES |  |
| 22 | `shipping_same_as_consumer` | boolean | YES |  |
| 23 | `tax_amount` | numeric(19,2) | YES |  |
| 24 | `total_invoice_amount` | numeric(19,2) | YES |  |
| 25 | `total_number_of_items` | integer | YES |  |
| 26 | `lead_pk` | bigint | YES |  |
| 27 | `invoice_number` | character varying(255) | YES |  |
| 28 | `sales_person` | character varying(255) | YES |  |
| 29 | `order_id` | character varying(255) | YES |  |
| 30 | `external_reference_id` | character varying(255) | YES |  |
| 31 | `purchase_total` | numeric(19,2) | YES |  |

## uown_los_item

**Schema:** `public` | **Columns:** 30

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_los_item_pk_seq'::regclass)` |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `account_pk` | bigint | NO |  |
| 8 | `base_price_per_item` | numeric(19,2) | YES |  |
| 9 | `category` | character varying(255) | YES |  |
| 10 | `delivery_type` | character varying(255) | YES |  |
| 11 | `invoice_pk` | bigint | NO |  |
| 12 | `item_code` | character varying(255) | YES |  |
| 13 | `item_delivery_date` | date | YES |  |
| 14 | `item_delivery_fee` | numeric(19,2) | YES |  |
| 15 | `item_description` | text | YES |  |
| 16 | `item_image_url` | character varying(255) | YES |  |
| 17 | `items_delivery_fee` | numeric(19,2) | YES |  |
| 18 | `lead_pk` | bigint | NO |  |
| 19 | `line_number` | character varying(255) | YES |  |
| 20 | `merchant_pk` | bigint | NO |  |
| 21 | `number_of_items` | integer | YES |  |
| 22 | `number_of_items_delivered` | integer | YES |  |
| 23 | `serial_number` | character varying(255) | YES |  |
| 24 | `status` | character varying(255) | YES |  |
| 25 | `tax_per_item` | numeric(19,2) | YES |  |
| 26 | `total_price_for_items` | numeric(19,2) | YES |  |
| 27 | `total_price_per_item` | numeric(19,2) | YES |  |
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
| 11 | `base_price_per_item` | numeric(19,2) | YES |  |
| 12 | `category` | character varying(255) | YES |  |
| 13 | `delivery_type` | character varying(255) | YES |  |
| 14 | `item_code` | character varying(255) | YES |  |
| 15 | `item_delivery_date` | date | YES |  |
| 16 | `item_delivery_fee` | numeric(19,2) | YES |  |
| 17 | `item_description` | text | YES |  |
| 18 | `item_image_url` | character varying(255) | YES |  |
| 19 | `items_delivery_fee` | numeric(19,2) | YES |  |
| 20 | `lead_pk` | bigint | YES |  |
| 21 | `line_number` | character varying(255) | YES |  |
| 22 | `merchant_pk` | bigint | YES |  |
| 23 | `number_of_items` | integer | YES |  |
| 24 | `number_of_items_delivered` | integer | YES |  |
| 25 | `serial_number` | character varying(255) | YES |  |
| 26 | `status` | character varying(255) | YES |  |
| 27 | `tax_per_item` | numeric(19,2) | YES |  |
| 28 | `total_price_for_items` | numeric(19,2) | YES |  |
| 29 | `total_price_per_item` | numeric(19,2) | YES |  |
| 30 | `invoice_type` | character varying(255) | YES |  |
| 31 | `item_id` | character varying(255) | YES |  |
| 32 | `lock_status` | character varying(255) | YES |  |

## uown_los_lead

**Schema:** `public` | **Columns:** 78

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_los_lead_pk_seq'::regclass)` |
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
| 35 | `requested_loan_amount` | numeric(19,2) | YES |  |
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
| 49 | `refund_amount` | numeric(19,2) | YES |  |
| 50 | `browser_type` | character varying(255) | YES |  |
| 51 | `device_type` | character varying(255) | YES |  |
| 52 | `operating_system` | character varying(255) | YES |  |
| 53 | `finalize_application_sent_time` | timestamp without time zone | YES |  |
| 54 | `show_alerts` | boolean | YES |  |
| 55 | `tax_for_zip_pk` | bigint | YES |  |
| 56 | `address_verification_pk` | bigint | YES |  |
| 57 | `fraud_verification_pk` | bigint | YES |  |
| 58 | `seon_fingerprint_text` | text | YES |  |
| 59 | `max_approval_amount` | numeric(19,2) | YES |  |
| 60 | `equal_or_above_threshold` | boolean | YES |  |
| 61 | `lending_category_type` | character varying | YES |  |
| 62 | `is_eligible_for_reapproval` | boolean | YES |  |
| 63 | `auto_pay_types` | character varying(255) | YES |  |
| 64 | `internal_status` | character varying(255) | YES |  |
| 65 | `external_reference_id` | character varying(255) | YES |  |
| 66 | `is_score_available` | boolean | YES |  |
| 67 | `added_second_lease` | boolean | YES |  |
| 68 | `category` | character varying(255) | YES |  |
| 69 | `created_from` | character varying(255) | YES |  |
| 70 | `lexis_nexis_pk` | bigint | YES |  |
| 71 | `neustar_pk` | bigint | YES |  |
| 72 | `sentilink_pk` | bigint | YES |  |
| 73 | `source` | character varying(255) | YES |  |
| 74 | `traffic` | character varying(255) | YES |  |
| 75 | `cc_peek_consent` | boolean | YES |  |
| 76 | `consent_date` | date | YES |  |
| 77 | `credit_card_bin` | character varying(6) | YES |  |
| 78 | `short_code` | character varying(8) | YES |  |

## uown_los_lead_notes

**Schema:** `public` | **Columns:** 8

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_los_lead_notes_pk_seq'::regclass)` |
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
| 1 | `pk` | bigint | NO | `nextval('uown_los_outbound_api_log_pk_seq'::regclass)` |
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
| 1 | `pk` | bigint | NO | `nextval('uown_los_payment_pk_seq'::regclass)` |
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
| 12 | `payment_amount` | numeric(19,2) | YES |  |
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
| 24 | `non_taxable_payment` | numeric(19,2) | YES |  |
| 25 | `taxable_payment` | numeric(19,2) | YES |  |

## uown_los_payment_options

**Schema:** `public` | **Columns:** 62

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_los_payment_options_pk_seq'::regclass)` |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `amount_past_due_without_tax` | numeric(19,2) | YES |  |
| 8 | `balance_amount_without_tax` | numeric(19,2) | YES |  |
| 9 | `cost_with_fees_no_tax` | numeric(19,2) | YES |  |
| 10 | `cost_without_tax_and_fees` | numeric(19,2) | YES |  |
| 11 | `days_past_due` | integer | YES |  |
| 12 | `due_date_moves` | integer | YES |  |
| 13 | `early_payoff_date_expiry` | date | YES |  |
| 14 | `epo_amount_without_tax` | numeric(19,2) | YES |  |
| 15 | `first_payment_discount` | numeric(19,2) | YES |  |
| 16 | `first_payment_due_date` | date | YES |  |
| 17 | `first_payment_with_tax_no_fees` | numeric(19,2) | YES |  |
| 18 | `last_payment_date` | date | YES |  |
| 19 | `last_payment_with_tax` | numeric(19,2) | YES |  |
| 20 | `merchant_discount_amount` | numeric(19,2) | YES |  |
| 21 | `merchant_discount_rate` | numeric(9,5) | YES |  |
| 22 | `merchant_rebate_amount` | numeric(19,2) | YES |  |
| 23 | `merchant_rebate_rate` | numeric(9,5) | YES |  |
| 24 | `money_factor` | numeric(19,2) | YES |  |
| 25 | `next_payment_due_date` | date | YES |  |
| 26 | `next_payment_with_tax` | numeric(19,2) | YES |  |
| 27 | `number_of_payments_made` | integer | YES |  |
| 28 | `payment_frequency` | character varying(255) | YES |  |
| 29 | `plat_form_fee_amount` | numeric(19,2) | YES |  |
| 30 | `plat_form_fee_rate` | numeric(9,4) | YES |  |
| 31 | `processing_fee` | numeric(19,2) | YES |  |
| 32 | `protection_plan_fee` | numeric(19,2) | YES |  |
| 33 | `remaining_number_of_payments` | integer | YES |  |
| 34 | `tax_amount` | numeric(9,4) | YES |  |
| 35 | `tax_per_scheduled_payment` | numeric(9,4) | YES |  |
| 36 | `tax_rate` | numeric(9,5) | YES |  |
| 37 | `term_in_months` | integer | YES |  |
| 38 | `total_contract_amount_with_tax_and_fees` | numeric(19,2) | YES |  |
| 39 | `total_number_of_payments` | integer | YES |  |
| 40 | `total_recycle_fee` | numeric(19,2) | YES |  |
| 41 | `lead_pk` | bigint | YES |  |
| 42 | `delinquency_as_of_date` | date | YES |  |
| 43 | `redirect_url` | character varying(255) | YES |  |
| 44 | `security_deposit` | numeric(19,2) | YES |  |
| 45 | `last_tax_updated_time` | timestamp without time zone | YES |  |
| 46 | `first_payment_no_tax_no_fees` | numeric(19,2) | YES |  |
| 47 | `last_payment_no_tax_no_fees` | numeric(19,2) | YES |  |
| 48 | `next_payment_no_tax_no_fees` | numeric(19,2) | YES |  |
| 49 | `first_payment_no_tax_with_fees` | numeric(19,2) | YES |  |
| 50 | `first_payment_tax` | numeric(9,4) | YES |  |
| 51 | `frequency_changes` | integer | YES |  |
| 52 | `last_payment_no_tax_with_fees` | numeric(19,2) | YES |  |
| 53 | `last_payment_tax` | numeric(9,4) | YES |  |
| 54 | `regular_payment_tax` | numeric(9,4) | YES |  |
| 55 | `buyout_fee` | numeric(19,2) | YES |  |
| 56 | `amount_charged_at_signing` | numeric(19,2) | YES |  |
| 57 | `signing_fee` | numeric(19,2) | YES |  |
| 58 | `epo_amount_with_tax` | numeric(19,2) | YES |  |
| 59 | `program_name` | character varying(255) | YES |  |
| 60 | `ks_label` | character varying(255) | YES |  |
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
| 9 | `amount_past_due_without_tax` | numeric(19,2) | YES |  |
| 10 | `balance_amount_without_tax` | numeric(19,2) | YES |  |
| 11 | `cost_with_fees_no_tax` | numeric(19,2) | YES |  |
| 12 | `cost_without_tax_and_fees` | numeric(19,2) | YES |  |
| 13 | `days_past_due` | integer | YES |  |
| 14 | `due_date_moves` | integer | YES |  |
| 15 | `early_payoff_date_expiry` | date | YES |  |
| 16 | `epo_amount_without_tax` | numeric(19,2) | YES |  |
| 17 | `first_payment_discount` | numeric(19,2) | YES |  |
| 18 | `first_payment_due_date` | date | YES |  |
| 19 | `first_payment_with_tax_no_fees` | numeric(19,2) | YES |  |
| 20 | `last_payment_date` | date | YES |  |
| 21 | `last_payment_with_tax` | numeric(19,2) | YES |  |
| 22 | `merchant_discount_amount` | numeric(19,2) | YES |  |
| 23 | `merchant_discount_rate` | numeric(9,5) | YES |  |
| 24 | `merchant_rebate_amount` | numeric(19,2) | YES |  |
| 25 | `merchant_rebate_rate` | numeric(9,5) | YES |  |
| 26 | `money_factor` | numeric(19,2) | YES |  |
| 27 | `next_payment_due_date` | date | YES |  |
| 28 | `next_payment_with_tax` | numeric(19,2) | YES |  |
| 29 | `number_of_payments_made` | integer | YES |  |
| 30 | `payment_frequency` | character varying(255) | YES |  |
| 31 | `plat_form_fee_amount` | numeric(19,2) | YES |  |
| 32 | `plat_form_fee_rate` | numeric(9,4) | YES |  |
| 33 | `processing_fee` | numeric(19,2) | YES |  |
| 34 | `protection_plan_fee` | numeric(19,2) | YES |  |
| 35 | `remaining_number_of_payments` | integer | YES |  |
| 36 | `tax_amount` | numeric(9,4) | YES |  |
| 37 | `tax_per_scheduled_payment` | numeric(9,4) | YES |  |
| 38 | `tax_rate` | numeric(9,5) | YES |  |
| 39 | `term_in_months` | integer | YES |  |
| 40 | `total_contract_amount_with_tax_and_fees` | numeric(19,2) | YES |  |
| 41 | `total_number_of_payments` | integer | YES |  |
| 42 | `total_recycle_fee` | numeric(19,2) | YES |  |
| 43 | `lead_pk` | bigint | YES |  |
| 44 | `delinquency_as_of_date` | date | YES |  |
| 45 | `redirect_url` | character varying(255) | YES |  |
| 46 | `security_deposit` | numeric(19,2) | YES |  |
| 47 | `last_tax_updated_time` | timestamp without time zone | YES |  |
| 48 | `first_payment_no_tax_no_fees` | numeric(19,2) | YES |  |
| 49 | `last_payment_no_tax_no_fees` | numeric(19,2) | YES |  |
| 50 | `next_payment_no_tax_no_fees` | numeric(19,2) | YES |  |
| 51 | `first_payment_no_tax_with_fees` | numeric(19,2) | YES |  |
| 52 | `first_payment_tax` | numeric(9,4) | YES |  |
| 53 | `frequency_changes` | integer | YES |  |
| 54 | `last_payment_no_tax_with_fees` | numeric(19,2) | YES |  |
| 55 | `last_payment_tax` | numeric(9,4) | YES |  |
| 56 | `regular_payment_tax` | numeric(9,4) | YES |  |
| 57 | `buyout_fee` | numeric(19,2) | YES |  |
| 58 | `amount_charged_at_signing` | numeric(19,2) | YES |  |
| 59 | `signing_fee` | numeric(19,2) | YES |  |
| 60 | `epo_amount_with_tax` | numeric(19,2) | YES |  |
| 61 | `program_name` | character varying(255) | YES |  |
| 62 | `ks_label` | character varying(255) | YES |  |
| 63 | `short_code` | character varying(8) | YES |  |
| 64 | `plan_id` | character varying(255) | YES |  |

## uown_los_phone

**Schema:** `public` | **Columns:** 17

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_los_phone_pk_seq'::regclass)` |
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

## uown_los_phone_history

**Schema:** `public` | **Columns:** 19

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

## uown_los_protection_plan

**Schema:** `public` | **Columns:** 25

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_los_protection_plan_pk_seq'::regclass)` |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `account_pk` | bigint | YES |  |
| 8 | `already_covered` | boolean | YES |  |
| 9 | `connector_token` | character varying(255) | YES |  |
| 10 | `customer_id` | character varying(255) | YES |  |
| 11 | `error` | text | YES |  |
| 12 | `lead_pk` | bigint | YES |  |
| 13 | `offer_element_response` | text | YES |  |
| 14 | `opt_in` | boolean | YES |  |
| 15 | `policy_id` | character varying(255) | YES |  |
| 16 | `request` | text | YES |  |
| 17 | `response` | text | YES |  |
| 18 | `status` | character varying(255) | YES |  |
| 19 | `covered_by_account_pk` | character varying(255) | YES |  |
| 20 | `covered_by_lead_pk` | character varying(255) | YES |  |
| 21 | `enrollment_date` | date | YES |  |
| 22 | `order_id` | character varying(255) | YES |  |
| 23 | `cancellation_date` | date | YES |  |
| 24 | `cancellation_reason` | text | YES |  |
| 25 | `refund_amount` | numeric(19,2) | YES |  |

## uown_los_receivable

**Schema:** `public` | **Columns:** 23

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_los_receivable_pk_seq'::regclass)` |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `allocation_status` | character varying(255) | YES |  |
| 8 | `base_amount` | numeric(19,2) | YES |  |
| 9 | `base_epo_amount` | numeric(19,2) | YES |  |
| 10 | `comment` | text | YES |  |
| 11 | `due_date` | date | YES |  |
| 12 | `partial_payment_amount` | numeric(19,2) | YES |  |
| 13 | `receivable_type` | character varying(255) | YES |  |
| 14 | `status` | character varying(255) | YES |  |
| 15 | `tax_amount` | numeric(19,2) | YES |  |
| 16 | `total_amount` | numeric(19,2) | YES |  |
| 17 | `lead_pk` | bigint | YES |  |
| 18 | `notes` | text | YES |  |
| 19 | `tax_rate` | numeric(19,2) | YES |  |
| 20 | `skipped` | boolean | YES |  |
| 21 | `tax_updated` | timestamp without time zone | YES |  |
| 22 | `tax_for_zip_pk` | bigint | YES |  |
| 23 | `base_epo90day_ineligible` | numeric(19,2) | YES |  |

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
| 1 | `pk` | bigint | NO | `nextval('uown_los_sched_summary_pk_seq'::regclass)` |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `amount_past_due_without_tax` | numeric(19,2) | YES |  |
| 8 | `balance_amount_without_tax` | numeric(19,2) | YES |  |
| 9 | `cost_with_fees_no_tax` | numeric(19,2) | YES |  |
| 10 | `cost_without_tax_and_fees` | numeric(19,2) | YES |  |
| 11 | `days_past_due` | integer | YES |  |
| 12 | `due_date_moves` | integer | YES |  |
| 13 | `early_payoff_date_expiry` | date | YES |  |
| 14 | `epo_amount_without_tax` | numeric(19,2) | YES |  |
| 15 | `first_payment_discount` | numeric(19,2) | YES |  |
| 16 | `first_payment_due_date` | date | YES |  |
| 17 | `first_payment_with_tax_no_fees` | numeric(19,2) | YES |  |
| 18 | `last_payment_date` | date | YES |  |
| 19 | `last_payment_with_tax` | numeric(19,2) | YES |  |
| 20 | `merchant_discount_amount` | numeric(19,2) | YES |  |
| 21 | `merchant_discount_rate` | numeric(9,5) | YES |  |
| 22 | `merchant_rebate_amount` | numeric(19,2) | YES |  |
| 23 | `merchant_rebate_rate` | numeric(9,5) | YES |  |
| 24 | `money_factor` | numeric(19,2) | YES |  |
| 25 | `next_payment_due_date` | date | YES |  |
| 26 | `next_payment_with_tax` | numeric(19,2) | YES |  |
| 27 | `number_of_payments_made` | integer | YES |  |
| 28 | `payment_frequency` | character varying(255) | YES |  |
| 29 | `plat_form_fee_amount` | numeric(19,2) | YES |  |
| 30 | `plat_form_fee_rate` | numeric(9,4) | YES |  |
| 31 | `processing_fee` | numeric(19,2) | YES |  |
| 32 | `protection_plan_fee` | numeric(19,2) | YES |  |
| 33 | `remaining_number_of_payments` | integer | YES |  |
| 34 | `tax_amount` | numeric(9,4) | YES |  |
| 35 | `tax_per_scheduled_payment` | numeric(9,4) | YES |  |
| 36 | `tax_rate` | numeric(9,5) | YES |  |
| 37 | `term_in_months` | integer | YES |  |
| 38 | `total_contract_amount_with_tax_and_fees` | numeric(19,2) | YES |  |
| 39 | `total_number_of_payments` | integer | YES |  |
| 40 | `total_recycle_fee` | numeric(19,2) | YES |  |
| 41 | `lead_pk` | bigint | YES |  |
| 42 | `delinquency_as_of_date` | date | YES |  |
| 43 | `redirect_url` | character varying(255) | YES |  |
| 44 | `security_deposit` | numeric(19,2) | YES |  |
| 45 | `last_tax_updated_time` | timestamp without time zone | YES |  |
| 46 | `first_payment_no_tax_no_fees` | numeric(19,2) | YES |  |
| 47 | `last_payment_no_tax_no_fees` | numeric(19,2) | YES |  |
| 48 | `next_payment_no_tax_no_fees` | numeric(19,2) | YES |  |
| 49 | `first_payment_no_tax_with_fees` | numeric(19,2) | YES |  |
| 50 | `first_payment_tax` | numeric(9,4) | YES |  |
| 51 | `frequency_changes` | integer | YES |  |
| 52 | `last_payment_no_tax_with_fees` | numeric(19,2) | YES |  |
| 53 | `last_payment_tax` | numeric(9,4) | YES |  |
| 54 | `regular_payment_tax` | numeric(9,4) | YES |  |
| 55 | `buyout_fee` | numeric(19,2) | YES |  |
| 56 | `amount_charged_at_signing` | numeric(19,2) | YES |  |
| 57 | `signing_fee` | numeric(19,2) | YES |  |
| 58 | `epo_amount_with_tax` | numeric(19,2) | YES |  |
| 59 | `program_name` | character varying(255) | YES |  |
| 60 | `ks_label` | character varying(255) | YES |  |
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
| 9 | `amount_past_due_without_tax` | numeric(19,2) | YES |  |
| 10 | `balance_amount_without_tax` | numeric(19,2) | YES |  |
| 11 | `cost_with_fees_no_tax` | numeric(19,2) | YES |  |
| 12 | `cost_without_tax_and_fees` | numeric(19,2) | YES |  |
| 13 | `days_past_due` | integer | YES |  |
| 14 | `due_date_moves` | integer | YES |  |
| 15 | `early_payoff_date_expiry` | date | YES |  |
| 16 | `epo_amount_without_tax` | numeric(19,2) | YES |  |
| 17 | `first_payment_discount` | numeric(19,2) | YES |  |
| 18 | `first_payment_due_date` | date | YES |  |
| 19 | `first_payment_with_tax_no_fees` | numeric(19,2) | YES |  |
| 20 | `last_payment_date` | date | YES |  |
| 21 | `last_payment_with_tax` | numeric(19,2) | YES |  |
| 22 | `merchant_discount_amount` | numeric(19,2) | YES |  |
| 23 | `merchant_discount_rate` | numeric(9,5) | YES |  |
| 24 | `merchant_rebate_amount` | numeric(19,2) | YES |  |
| 25 | `merchant_rebate_rate` | numeric(9,5) | YES |  |
| 26 | `money_factor` | numeric(19,2) | YES |  |
| 27 | `next_payment_due_date` | date | YES |  |
| 28 | `next_payment_with_tax` | numeric(19,2) | YES |  |
| 29 | `number_of_payments_made` | integer | YES |  |
| 30 | `payment_frequency` | character varying(255) | YES |  |
| 31 | `plat_form_fee_amount` | numeric(19,2) | YES |  |
| 32 | `plat_form_fee_rate` | numeric(9,4) | YES |  |
| 33 | `processing_fee` | numeric(19,2) | YES |  |
| 34 | `protection_plan_fee` | numeric(19,2) | YES |  |
| 35 | `remaining_number_of_payments` | integer | YES |  |
| 36 | `tax_amount` | numeric(9,4) | YES |  |
| 37 | `tax_per_scheduled_payment` | numeric(9,4) | YES |  |
| 38 | `tax_rate` | numeric(9,5) | YES |  |
| 39 | `term_in_months` | integer | YES |  |
| 40 | `total_contract_amount_with_tax_and_fees` | numeric(19,2) | YES |  |
| 41 | `total_number_of_payments` | integer | YES |  |
| 42 | `total_recycle_fee` | numeric(19,2) | YES |  |
| 43 | `lead_pk` | bigint | YES |  |
| 44 | `delinquency_as_of_date` | date | YES |  |
| 45 | `redirect_url` | character varying(255) | YES |  |
| 46 | `security_deposit` | numeric(19,2) | YES |  |
| 47 | `last_tax_updated_time` | timestamp without time zone | YES |  |
| 48 | `first_payment_no_tax_no_fees` | numeric(19,2) | YES |  |
| 49 | `last_payment_no_tax_no_fees` | numeric(19,2) | YES |  |
| 50 | `next_payment_no_tax_no_fees` | numeric(19,2) | YES |  |
| 51 | `first_payment_no_tax_with_fees` | numeric(19,2) | YES |  |
| 52 | `first_payment_tax` | numeric(9,4) | YES |  |
| 53 | `frequency_changes` | integer | YES |  |
| 54 | `last_payment_no_tax_with_fees` | numeric(19,2) | YES |  |
| 55 | `last_payment_tax` | numeric(9,4) | YES |  |
| 56 | `regular_payment_tax` | numeric(9,4) | YES |  |
| 57 | `buyout_fee` | numeric(19,2) | YES |  |
| 58 | `amount_charged_at_signing` | numeric(19,2) | YES |  |
| 59 | `signing_fee` | numeric(19,2) | YES |  |
| 60 | `epo_amount_with_tax` | numeric(19,2) | YES |  |
| 61 | `program_name` | character varying(255) | YES |  |
| 62 | `ks_label` | character varying(255) | YES |  |
| 63 | `short_code` | character varying(8) | YES |  |
| 64 | `plan_id` | character varying(255) | YES |  |

## uown_los_uwdata

**Schema:** `public` | **Columns:** 29

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_los_uwdata_pk_seq'::regclass)` |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `abb_uw_response` | text | YES |  |
| 8 | `approval_amount` | numeric(19,2) | YES |  |
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
| 22 | `previous_uw` | character varying(255) | YES |  |
| 23 | `risk_type` | character varying(255) | YES |  |
| 24 | `uw_approval_amount` | numeric(19,2) | YES |  |
| 25 | `cash_score_threshold` | integer | YES |  |
| 26 | `vantage_score` | integer | YES |  |
| 27 | `eligible_terms` | text | YES |  |
| 28 | `campaign_id` | integer | YES |  |
| 29 | `internal_decision` | character varying(255) | YES |  |

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
| 1 | `pk` | bigint | NO | `nextval('uown_mail_queue_pk_seq'::regclass)` |
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

> **Column naming conventions (Task #1262):** Timestamp columns are `row_created_timestamp` / `row_updated_timestamp` — NOT `created_at` / `updated_at`. Acting user is `agent` — NOT `created_by` / `updated_by`. Key fields for merchant validation: `ref_merchant_code` (col 21 area), `merchant_name`, `inventory_category` (col 37), `is_active`, `cloned_from` (col 107, FK to `pk`), `cloned_from_name` (col 108). Use `db.getMerchantByRefCode()` to retrieve these fields.

**Schema:** `public` | **Columns:** 150

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_merchant_pk_seq'::regclass)` |
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
| 23 | `dealer_discount_override` | numeric(9,5) | YES |  |
| 24 | `dealer_rebate_override` | numeric(9,5) | YES |  |
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
| 56 | `platform_fee` | numeric(19,2) | YES |  |
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
| 72 | `tax_rate` | numeric(9,5) | YES |  |
| 73 | `tax_zone` | character varying(10) | YES |  |
| 74 | `use_customer_state_for_lease_and_sales_tax` | boolean | YES |  |
| 75 | `username` | character varying(255) | YES |  |
| 76 | `zip_code` | character varying(255) | YES |  |
| 77 | `default_loan_amount` | numeric(19,2) | YES |  |
| 78 | `default_months_at_employer` | integer | YES |  |
| 79 | `valid_states` | text | YES |  |
| 80 | `allowed_frequencies` | text | YES |  |
| 81 | `charge_processing_fee_before_esign` | boolean | YES |  |
| 82 | `is_intellicheck_required` | boolean | YES |  |
| 83 | `is_redirect_url_branded` | boolean | YES |  |
| 84 | `is_security_deposit_amortized` | boolean | YES |  |
| 85 | `add_security_deposit_to_epo_and_last_payment` | boolean | YES |  |
| 86 | `hold_deposit` | boolean | YES |  |
| 87 | `post_message` | boolean | YES |  |
| 88 | `agent_username` | character varying(255) | YES |  |
| 89 | `allow_close_on_iframe` | boolean | YES |  |
| 90 | `comment` | text | YES |  |
| 91 | `is_active` | boolean | YES |  |
| 92 | `remove_parent_or_top_on_iframe` | boolean | YES |  |
| 93 | `check_uw_for_verification` | boolean | YES |  |
| 94 | `esign_client` | character varying(255) | YES |  |
| 95 | `allow_change_to_expired` | boolean | YES |  |
| 96 | `comments` | character varying(255) | YES |  |
| 97 | `is_ach_required` | boolean | YES |  |
| 98 | `is_cc_required` | boolean | YES |  |
| 99 | `is_fpd_required` | boolean | YES |  |
| 100 | `is_signed_to_funding` | boolean | YES |  |
| 101 | `is_fraud_check_required` | boolean | YES |  |
| 102 | `run_address_verification` | boolean | YES |  |
| 103 | `use_webhook` | boolean | YES |  |
| 104 | `verify_email` | boolean | YES |  |
| 105 | `verify_ip` | boolean | YES |  |
| 106 | `verify_phone` | boolean | YES |  |
| 107 | `cloned_from` | bigint | YES |  |
| 108 | `cloned_from_name` | character varying(255) | YES |  |
| 109 | `verify_phone_before_signing` | boolean | YES |  |
| 110 | `approval_amount_increase` | numeric(19,2) | YES |  |
| 111 | `is_bank_verification_required` | boolean | YES |  |
| 112 | `charge_processing_fee` | boolean | YES |  |
| 113 | `accept_new_apps` | boolean | YES |  |
| 114 | `buyout_fee` | numeric(19,2) | YES |  |
| 115 | `tax_exempted_states` | character varying(255) | YES |  |
| 116 | `is_deleted` | boolean | YES |  |
| 117 | `lending_category_list` | text | YES |  |
| 118 | `funding_report_emails` | text | YES |  |
| 119 | `funding_report_frequency` | text | YES |  |
| 120 | `send_automated_funding_report` | boolean | YES |  |
| 121 | `webhook_url` | text | YES |  |
| 122 | `cc_processing_fee_percent` | numeric(9,5) | YES |  |
| 123 | `five_day_funding_exception` | boolean | YES |  |
| 124 | `is_item_split` | boolean | YES |  |
| 125 | `merchant_support` | character varying(255) | YES |  |
| 126 | `merged_funding_report_emails` | text | YES |  |
| 127 | `merged_funding_report_frequency` | text | YES |  |
| 128 | `record_signing_flow` | boolean | YES |  |
| 129 | `remove_merchant_from_users` | boolean | YES |  |
| 130 | `return_lambda_score` | boolean | YES |  |
| 131 | `send_finalize_notice` | boolean | YES |  |
| 132 | `send_merchant_portal_url_as_provider` | boolean | YES |  |
| 133 | `send_merged_funding_report` | boolean | YES |  |
| 134 | `two_day_funding_exception` | boolean | YES |  |
| 135 | `use_lexis_nexis` | boolean | YES |  |
| 136 | `use_neuro_id_check` | boolean | YES |  |
| 137 | `use_neustar` | boolean | YES |  |
| 138 | `use_sentilink` | boolean | YES |  |
| 139 | `auto_deny_application` | boolean | YES |  |
| 140 | `offer_insurance` | boolean | YES |  |
| 141 | `termination_reason` | character varying(255) | YES |  |
| 142 | `minimum_lease_amount` | numeric(19,2) | YES |  |
| 143 | `i_seon_id_check_required` | boolean | YES |  |
| 144 | `is_seon_id_check_required` | boolean | YES |  |
| 145 | `is_plaid_verification_required` | boolean | YES |  |
| 146 | `epo10` | boolean | YES |  |
| 147 | `epo5` | boolean | YES |  |
| 148 | `referral_fee` | numeric(19,2) | YES |  |
| 149 | `referral_partner` | character varying(255) | YES |  |
| 150 | `integration_type` | character varying(20) | YES |  |

## uown_merchant_activity_log

**Schema:** `public` | **Columns:** 23

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_merchant_activity_log_pk_seq'::regclass)` |
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
| 1 | `pk` | bigint | NO | `nextval('uown_merchant_api_error_log_pk_seq'::regclass)` |
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
| 14 | `message` | character varying(255) | YES |  |
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
| 16 | `message` | character varying(255) | YES |  |
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

**Schema:** `public` | **Columns:** 151

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `rev` | integer | NO |  |
| 3 | `revtype` | smallint | YES |  |
| 4 | `agent_username` | character varying(255) | YES |  |
| 5 | `allow_auto_decision` | boolean | YES |  |
| 6 | `allow_location_change_for_merchant_site_user` | boolean | YES |  |
| 7 | `allow_remote_sign` | boolean | YES |  |
| 8 | `allowed_frequencies` | text | YES |  |
| 9 | `alt_contact_email` | character varying(255) | YES |  |
| 10 | `alt_contact_fax` | character varying(15) | YES |  |
| 11 | `alt_contact_name` | character varying(255) | YES |  |
| 12 | `alt_contact_phone` | character varying(15) | YES |  |
| 13 | `api_key` | character varying(255) | YES |  |
| 14 | `buy_group` | character varying(255) | YES |  |
| 15 | `buy_group_member` | boolean | YES |  |
| 16 | `buy_group_name` | character varying(255) | YES |  |
| 17 | `category` | character varying(255) | YES |  |
| 18 | `charge_processing_fee_before_esign` | boolean | YES |  |
| 19 | `city` | character varying(255) | YES |  |
| 20 | `client_type` | character varying(255) | YES |  |
| 21 | `country` | character varying(255) | YES |  |
| 22 | `county` | character varying(255) | YES |  |
| 23 | `dealer_discount_override` | numeric(9,5) | YES |  |
| 24 | `dealer_rebate_override` | numeric(9,4) | YES |  |
| 25 | `dealer_rebate_type` | character varying(255) | YES |  |
| 26 | `default_loan_amount` | numeric(19,2) | YES |  |
| 27 | `default_months_at_employer` | integer | YES |  |
| 28 | `delivery_receipt_id` | character varying(255) | YES |  |
| 29 | `do_not_allow_new_apps` | boolean | YES |  |
| 30 | `dte_corp_training` | timestamp without time zone | YES |  |
| 31 | `dte_dealer_app_rcvd` | timestamp without time zone | YES |  |
| 32 | `dte_dealer_kit_ship` | timestamp without time zone | YES |  |
| 33 | `dte_setup_in_crm` | timestamp without time zone | YES |  |
| 34 | `esign_mode` | character varying(255) | YES |  |
| 35 | `exclude_from_reports` | boolean | YES |  |
| 36 | `fax` | character varying(15) | YES |  |
| 37 | `fed_tax_id` | character varying(9) | YES |  |
| 38 | `hold_deposit` | boolean | YES |  |
| 39 | `independent_rep_code` | character varying(255) | YES |  |
| 40 | `inventory_category` | character varying(255) | YES |  |
| 41 | `is_hidden` | boolean | YES |  |
| 42 | `is_intellicheck_required` | boolean | YES |  |
| 43 | `is_redirect_url_branded` | boolean | YES |  |
| 44 | `latitude` | character varying(20) | YES |  |
| 45 | `legal_name` | character varying(255) | YES |  |
| 46 | `location_address1` | character varying(255) | YES |  |
| 47 | `location_address2` | character varying(255) | YES |  |
| 48 | `location_name` | character varying(255) | YES |  |
| 49 | `longitude` | character varying(20) | YES |  |
| 50 | `merchant_name` | character varying(255) | YES |  |
| 51 | `merchant_type` | character varying(255) | YES |  |
| 52 | `merchant_url` | character varying(255) | YES |  |
| 53 | `num_days_approval_exp` | integer | YES |  |
| 54 | `num_days_lease_doc_exp` | integer | YES |  |
| 55 | `off_peak_campaign_id` | integer | YES |  |
| 56 | `owner_name` | character varying(255) | YES |  |
| 57 | `ownership_type` | character varying(255) | YES |  |
| 58 | `peak_campaign_id` | integer | YES |  |
| 59 | `phone_number` | character varying(15) | YES |  |
| 60 | `plat_form_fee_type` | character varying(255) | YES |  |
| 61 | `platform_fee` | numeric(19,2) | YES |  |
| 62 | `post_message` | boolean | YES |  |
| 63 | `primary_contact_email` | character varying(255) | YES |  |
| 64 | `primary_contact_fax` | character varying(15) | YES |  |
| 65 | `primary_contact_name` | character varying(255) | YES |  |
| 66 | `primary_contact_phone` | character varying(15) | YES |  |
| 67 | `priority` | integer | YES |  |
| 68 | `ref_company_id` | character varying(255) | YES |  |
| 69 | `ref_location_id` | character varying(255) | YES |  |
| 70 | `ref_merchant_code` | character varying(255) | YES |  |
| 71 | `sales_rep_code` | character varying(255) | YES |  |
| 72 | `scoring_company_group` | character varying(2) | YES |  |
| 73 | `show_payroll_and_prepaid_card_on_application` | boolean | YES |  |
| 74 | `show_report_menu_item_on_merchant_site` | boolean | YES |  |
| 75 | `show_weekly_status_report` | boolean | YES |  |
| 76 | `state` | character varying(255) | YES |  |
| 77 | `store_timings` | character varying(3000) | YES |  |
| 78 | `tax_rate` | numeric(9,5) | YES |  |
| 79 | `tax_zone` | character varying(10) | YES |  |
| 80 | `use_customer_state_for_lease_and_sales_tax` | boolean | YES |  |
| 81 | `username` | character varying(255) | YES |  |
| 82 | `valid_states` | text | YES |  |
| 83 | `zip_code` | character varying(255) | YES |  |
| 84 | `agent` | character varying(255) | YES |  |
| 85 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 86 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 87 | `tenant_id` | bigint | YES |  |
| 88 | `web_user_id` | bigint | YES |  |
| 89 | `allow_close_on_iframe` | boolean | YES |  |
| 90 | `comment` | text | YES |  |
| 91 | `is_active` | boolean | YES |  |
| 92 | `remove_parent_or_top_on_iframe` | boolean | YES |  |
| 93 | `check_uw_for_verification` | boolean | YES |  |
| 94 | `esign_client` | character varying(255) | YES |  |
| 95 | `allow_change_to_expired` | boolean | YES |  |
| 96 | `comments` | character varying(255) | YES |  |
| 97 | `is_ach_required` | boolean | YES |  |
| 98 | `is_cc_required` | boolean | YES |  |
| 99 | `is_fpd_required` | boolean | YES |  |
| 100 | `is_signed_to_funding` | boolean | YES |  |
| 101 | `is_fraud_check_required` | boolean | YES |  |
| 102 | `run_address_verification` | boolean | YES |  |
| 103 | `use_webhook` | boolean | YES |  |
| 104 | `verify_email` | boolean | YES |  |
| 105 | `verify_ip` | boolean | YES |  |
| 106 | `verify_phone` | boolean | YES |  |
| 107 | `cloned_from` | bigint | YES |  |
| 108 | `cloned_from_name` | character varying(255) | YES |  |
| 109 | `check_fraud_fingerprint` | boolean | YES |  |
| 110 | `verify_phone_before_signing` | boolean | YES |  |
| 111 | `approval_amount_increase` | numeric(19,2) | YES |  |
| 112 | `is_bank_verification_required` | boolean | YES |  |
| 113 | `charge_processing_fee` | boolean | YES |  |
| 114 | `accept_new_apps` | boolean | YES |  |
| 115 | `buyout_fee` | numeric(19,2) | YES |  |
| 116 | `tax_exempted_states` | character varying(255) | YES |  |
| 117 | `is_deleted` | boolean | YES |  |
| 118 | `lending_category_list` | text | YES |  |
| 119 | `funding_report_emails` | text | YES |  |
| 120 | `funding_report_frequency` | text | YES |  |
| 121 | `send_automated_funding_report` | boolean | YES |  |
| 122 | `webhook_url` | text | YES |  |
| 123 | `cc_processing_fee_percent` | numeric(9,5) | YES |  |
| 124 | `five_day_funding_exception` | boolean | YES |  |
| 125 | `is_item_split` | boolean | YES |  |
| 126 | `merchant_support` | character varying(255) | YES |  |
| 127 | `merged_funding_report_emails` | text | YES |  |
| 128 | `merged_funding_report_frequency` | text | YES |  |
| 129 | `record_signing_flow` | boolean | YES |  |
| 130 | `remove_merchant_from_users` | boolean | YES |  |
| 131 | `return_lambda_score` | boolean | YES |  |
| 132 | `send_finalize_notice` | boolean | YES |  |
| 133 | `send_merchant_portal_url_as_provider` | boolean | YES |  |
| 134 | `send_merged_funding_report` | boolean | YES |  |
| 135 | `two_day_funding_exception` | boolean | YES |  |
| 136 | `use_lexis_nexis` | boolean | YES |  |
| 137 | `use_neuro_id_check` | boolean | YES |  |
| 138 | `use_neustar` | boolean | YES |  |
| 139 | `use_sentilink` | boolean | YES |  |
| 140 | `auto_deny_application` | boolean | YES |  |
| 141 | `offer_insurance` | boolean | YES |  |
| 142 | `termination_reason` | character varying(255) | YES |  |
| 143 | `minimum_lease_amount` | numeric(19,2) | YES |  |
| 144 | `i_seon_id_check_required` | boolean | YES |  |
| 145 | `is_seon_id_check_required` | boolean | YES |  |
| 146 | `is_plaid_verification_required` | boolean | YES |  |
| 147 | `epo10` | boolean | YES |  |
| 148 | `epo5` | boolean | YES |  |
| 149 | `referral_fee` | numeric(19,2) | YES |  |
| 150 | `referral_partner` | character varying(255) | YES |  |
| 151 | `integration_type` | character varying(20) | YES |  |

## uown_merchant_program

**Schema:** `public` | **Columns:** 27

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_merchant_program_pk_seq'::regclass)` |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `charge_app_fee_if_delivery_is_zero` | boolean | YES |  |
| 6 | `dealer_discount` | numeric(9,5) | YES |  |
| 7 | `dealer_rebate` | numeric(9,5) | YES |  |
| 8 | `epo_days` | integer | YES |  |
| 9 | `max_dollar_amount` | numeric(19,2) | YES |  |
| 10 | `money_factor` | numeric(9,6) | YES |  |
| 11 | `payoff_discount` | numeric(9,5) | YES |  |
| 12 | `program_id` | character varying(255) | YES |  |
| 13 | `program_name` | character varying(255) | YES |  |
| 14 | `program_type` | character varying(255) | YES |  |
| 15 | `quick_pay_pct` | numeric(19,2) | YES |  |
| 16 | `states` | text | YES |  |
| 17 | `term_months` | integer | YES |  |
| 18 | `epo_fee_percent` | numeric(9,5) | YES |  |
| 19 | `lending_category_type` | character varying(255) | YES |  |
| 20 | `off_peak_campaign_id` | integer | YES |  |
| 21 | `peak_campaign_id` | integer | YES |  |
| 22 | `max_cart_amount` | numeric(19,2) | YES |  |
| 23 | `min_cart_amount` | numeric(19,2) | YES |  |
| 24 | `allowed_frequency_override` | character varying(255) | YES |  |
| 25 | `processing_fee_override` | numeric(19,2) | YES |  |
| 26 | `amount_charged_at_signing` | numeric(19,2) | YES |  |
| 27 | `group_name` | character varying(255) | YES |  |

## uown_merchant_to_program

**Schema:** `public` | **Columns:** 9

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_merchant_to_program_pk_seq'::regclass)` |
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
| 1 | `pk` | bigint | NO | `nextval('uown_neuro_id_verification_pk_seq'::regclass)` |
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
| 4 | `score` | numeric(19,2) | YES |  |

## uown_neustar

**Schema:** `public` | **Columns:** 48

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_neustar_pk_seq'::regclass)` |
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
| 38 | `nsr` | character varying(255) | YES |  |
| 39 | `phone_valid` | character varying(255) | YES |  |
| 40 | `phones` | character varying(255) | YES |  |
| 41 | `postal` | character varying(255) | YES |  |
| 42 | `prepaid` | character varying(255) | YES |  |
| 43 | `raw_response` | text | YES |  |
| 44 | `rbdi` | character varying(255) | YES |  |
| 45 | `service_tenure` | integer | YES |  |
| 46 | `state` | character varying(255) | YES |  |
| 47 | `street_address` | character varying(255) | YES |  |
| 48 | `usage2mo` | integer | YES |  |

## uown_paywallet

**Schema:** `public` | **Columns:** 27

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_paywallet_pk_seq'::regclass)` |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `request_id` | character varying(255) | YES |  |
| 8 | `account_pk` | bigint | YES |  |
| 9 | `clear_request_id` | character varying(255) | YES |  |
| 10 | `lead_pk` | bigint | YES |  |
| 11 | `affordability_sent_timestamp` | timestamp without time zone | YES |  |
| 12 | `employer` | character varying(255) | YES |  |
| 13 | `first_name` | character varying(255) | YES |  |
| 14 | `funds_available_for_allocation` | numeric(19,2) | YES |  |
| 15 | `last_name` | character varying(255) | YES |  |
| 16 | `last_salary_payment_date` | date | YES |  |
| 17 | `net_salary_last_paid` | numeric(19,2) | YES |  |
| 18 | `salary_frequency` | character varying(255) | YES |  |
| 19 | `allocation_received_timestamp` | timestamp without time zone | YES |  |
| 20 | `allocation_sent_timestamp` | timestamp without time zone | YES |  |
| 21 | `client_contract_reference` | character varying(255) | YES |  |
| 22 | `contract_id` | character varying(255) | YES |  |
| 23 | `installment_amount` | numeric(19,2) | YES |  |
| 24 | `payroll_frequency` | character varying(255) | YES |  |
| 25 | `status` | character varying(255) | YES |  |
| 26 | `error` | character varying(255) | YES |  |
| 27 | `notes` | text | YES |  |

## uown_paywallet_history

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
| 9 | `request_id` | character varying(255) | YES |  |
| 10 | `account_pk` | bigint | YES |  |
| 11 | `clear_request_id` | character varying(255) | YES |  |
| 12 | `error` | character varying(255) | YES |  |
| 13 | `lead_pk` | bigint | YES |  |
| 14 | `notes` | text | YES |  |
| 15 | `affordability_sent_timestamp` | timestamp without time zone | YES |  |
| 16 | `employer` | character varying(255) | YES |  |
| 17 | `first_name` | character varying(255) | YES |  |
| 18 | `funds_available_for_allocation` | numeric(19,2) | YES |  |
| 19 | `last_name` | character varying(255) | YES |  |
| 20 | `last_salary_payment_date` | date | YES |  |
| 21 | `net_salary_last_paid` | numeric(19,2) | YES |  |
| 22 | `salary_frequency` | character varying(255) | YES |  |
| 23 | `allocation_received_timestamp` | timestamp without time zone | YES |  |
| 24 | `allocation_sent_timestamp` | timestamp without time zone | YES |  |
| 25 | `client_contract_reference` | character varying(255) | YES |  |
| 26 | `contract_id` | character varying(255) | YES |  |
| 27 | `installment_amount` | numeric(19,2) | YES |  |
| 28 | `payroll_frequency` | character varying(255) | YES |  |
| 29 | `status` | character varying(255) | YES |  |

## uown_paywallet_outbound_api_log

**Schema:** `public` | **Columns:** 15

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_paywallet_outbound_api_log_pk_seq'::regclass)` |
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
| 1 | `pk` | bigint | NO | `nextval('uown_plaid_report_pk_seq'::regclass)` |
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
| 1 | `pk` | bigint | NO | `nextval('uown_plaid_user_pk_seq'::regclass)` |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `info` | text | YES |  |
| 6 | `lead_pk` | bigint | NO |  |
| 7 | `user_id` | character varying(255) | YES |  |
| 8 | `user_token` | character varying(255) | YES |  |

## uown_pw_affordability

**Schema:** `public` | **Columns:** 8

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_pw_affordability_pk_seq'::regclass)` |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `lead_pk` | bigint | YES |  |
| 6 | `funds_available_for_allocation` | real | YES |  |
| 7 | `request_id` | character varying(255) | YES |  |
| 8 | `salary_frequency` | character varying(255) | YES |  |

## uown_pw_allocation

**Schema:** `public` | **Columns:** 11

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_pw_allocation_pk_seq'::regclass)` |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `lead_pk` | bigint | YES |  |
| 6 | `client_contract_reference` | character varying(255) | YES |  |
| 7 | `contract_id` | character varying(255) | YES |  |
| 8 | `installment_amount` | real | YES |  |
| 9 | `payroll_frequency` | character varying(255) | YES |  |
| 10 | `request_id` | character varying(255) | YES |  |
| 11 | `status` | character varying(255) | YES |  |

## uown_pw_inbound_api_log

**Schema:** `public` | **Columns:** 17

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_pw_inbound_api_log_pk_seq'::regclass)` |
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

## uown_revinfo

**Schema:** `public` | **Columns:** 2

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `rev` | integer | NO |  |
| 2 | `revtstmp` | bigint | YES |  |

## uown_scheduled_task

**Schema:** `public` | **Columns:** 16

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_scheduled_task_pk_seq'::regclass)` |
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
| 1 | `pk` | bigint | NO | `nextval('uown_scheduled_task_run_pk_seq'::regclass)` |
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
| 1 | `pk` | bigint | NO | `nextval('uown_second_opportunity_accounts_pk_seq'::regclass)` |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `aba_number` | character varying(255) | YES |  |
| 8 | `account_number` | character varying(255) | YES |  |
| 9 | `address` | character varying(255) | YES |  |
| 10 | `cell_phone` | character varying(255) | YES |  |
| 11 | `clv` | numeric(19,2) | YES |  |
| 12 | `credit_limit` | numeric(19,2) | YES |  |
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
| 23 | `max_price` | numeric(19,2) | YES |  |
| 24 | `reason_code` | character varying(255) | YES |  |
| 25 | `rto_account_number` | bigint | YES |  |
| 26 | `ssn` | character varying(255) | YES |  |
| 27 | `zip` | character varying(255) | YES |  |

## uown_send_sv_ach_payment

**Schema:** `public` | **Columns:** 24

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_send_sv_ach_payment_pk_seq'::regclass)` |
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
| 1 | `pk` | bigint | NO | `nextval('uown_sentilink_pk_seq'::regclass)` |
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
| 18 | `loan_amount` | numeric(19,2) | YES |  |
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
| 1 | `pk` | bigint | NO | `nextval('uown_sentilink_reason_code_pk_seq'::regclass)` |
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
| 1 | `pk` | bigint | NO | `nextval('uown_sentilink_score_pk_seq'::regclass)` |
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
| 1 | `pk` | bigint | NO | `nextval('uown_seon_pk_seq'::regclass)` |
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
| 1 | `pk` | bigint | NO | `nextval('uown_sms_attachment_pk_seq'::regclass)` |
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

**Schema:** `public` | **Columns:** 32

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_sms_queue_pk_seq'::regclass)` |
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

## uown_state_configurations

**Schema:** `public` | **Columns:** 17

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_state_configurations_pk_seq'::regclass)` |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `max_cost_price_based_on_amount` | boolean | YES |  |
| 6 | `max_cost_price_based_on_merchandise` | boolean | YES |  |
| 7 | `max_cost_price_factor` | numeric(19,2) | YES |  |
| 8 | `max_processing_and_delivery_fee` | numeric(19,2) | YES |  |
| 9 | `nsf` | numeric(19,2) | YES |  |
| 10 | `processing_fee` | numeric(19,2) | YES |  |
| 11 | `processing_fee_or_delivery_fee` | boolean | YES |  |
| 12 | `recycle_fee` | numeric(19,2) | YES |  |
| 13 | `state` | character varying(255) | YES |  |
| 14 | `state_abbreviation` | character varying(255) | YES |  |
| 15 | `security_deposit` | numeric(19,2) | YES |  |
| 16 | `discount_on_paid` | numeric(19,2) | YES |  |
| 17 | `epo_discount` | numeric(19,2) | YES |  |

## uown_state_configurations_log

**Schema:** `public` | **Columns:** 8

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_state_configurations_log_pk_seq'::regclass)` |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `created_by` | character varying(255) | YES |  |
| 6 | `log_type` | character varying(255) | YES |  |
| 7 | `notes` | text | YES |  |
| 8 | `state_pk` | bigint | YES |  |

## uown_sticky

**Schema:** `public` | **Columns:** 15

> Main Sticky.io Recover session record. One row per `cc_transaction_pk` recovery session.
> Sweep `StickyRecoverSweep` checks `NOT EXISTS (... WHERE st.cc_transaction_pk = cct.pk AND st.sticky_transaction_id IS NOT NULL)` for dedupe.
> See [[project-svc-485-sticky-recover]].

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `web_user_id` | bigint | YES |  |
| 6 | `agent` | character varying | YES |  |
| 7 | `account_pk` | bigint | YES |  |
| 8 | `cc_transaction_pk` | bigint | YES |  |
| 9 | `number_of_attempts` | integer | NO | `0` |
| 10 | `external_id` | character varying | YES |  |
| 11 | `sticky_transaction_id` | character varying | YES |  |
| 12 | `status` | character varying | YES |  |
| 13 | `recovery_status` | character varying | YES |  |
| 14 | `dunning_profile_id` | character varying | YES |  |
| 15 | `last_retry_attempt_time` | timestamp without time zone | YES |  |

## uown_sticky_inbound_log

**Schema:** `public` | **Columns:** 17

> Webhooks received from Sticky.io. Stores raw encrypted body + decrypted JSON.
> Events: `recovery_started`, `recovery_attempt_failed`, `recovery_successful`, `recovery_unsuccessful`.
> Dedupe via `dedupe_key` (joined with [uown_sticky_webhook_dedupe](#uown_sticky_webhook_dedupe)).

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `web_user_id` | bigint | YES |  |
| 6 | `agent` | character varying | YES |  |
| 7 | `event_type` | character varying | YES |  |
| 8 | `event_time` | timestamp without time zone | YES |  |
| 9 | `dedupe_key` | character varying | YES |  |
| 10 | `raw_body` | text | YES |  |
| 11 | `decrypted_json` | text | YES |  |
| 12 | `sticky_pk` | bigint | YES |  |
| 13 | `status` | character varying | NO |  |
| 14 | `error_message` | text | YES |  |
| 15 | `response` | text | YES |  |
| 16 | `stack_trace` | text | YES |  |
| 17 | `source` | character varying | YES |  |

## uown_sticky_outbound_log

**Schema:** `public` | **Columns:** 13

> Outbound calls from SVC to Sticky.io Recover/Cancel endpoints. Request + response + headers + stack trace per attempt.

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `web_user_id` | bigint | YES |  |
| 6 | `agent` | character varying | YES |  |
| 7 | `sticky_pk` | bigint | YES |  |
| 8 | `account_pk` | bigint | YES |  |
| 9 | `request` | text | YES |  |
| 10 | `response` | text | YES |  |
| 11 | `header` | text | YES |  |
| 12 | `stack_trace` | text | YES |  |
| 13 | `source` | character varying | YES |  |

## uown_sticky_retry_attempt

**Schema:** `public` | **Columns:** 16

> One row per Sticky.io retry attempt (informed via inbound webhooks). Tracks gateway response, amount, dunning profile, attempt number.

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `web_user_id` | bigint | YES |  |
| 6 | `agent` | character varying | YES |  |
| 7 | `sticky_pk` | bigint | NO |  |
| 8 | `attempt_number` | integer | NO |  |
| 9 | `http_status` | integer | YES |  |
| 10 | `retry_status` | character varying | YES |  |
| 11 | `failure_reason` | text | YES |  |
| 12 | `error_summary` | text | YES |  |
| 13 | `dunning_profile_id` | character varying | YES |  |
| 14 | `gateway_transaction_id` | character varying | YES |  |
| 15 | `amount` | character varying | YES |  |
| 16 | `retry_attempt_time` | timestamp without time zone | YES |  |

## uown_sticky_webhook_dedupe

**Schema:** `public` | **Columns:** 7

> Idempotency table for inbound Sticky webhooks. `dedupe_key` unique; duplicate deliveries from Sticky are rejected here before [uown_sticky_inbound_log](#uown_sticky_inbound_log).

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `web_user_id` | bigint | YES |  |
| 6 | `agent` | character varying | YES |  |
| 7 | `dedupe_key` | character varying | NO |  |

## uown_stored_doc

**Schema:** `public` | **Columns:** 30

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_stored_doc_pk_seq'::regclass)` |
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

## uown_sv_account

**Schema:** `public` | **Columns:** 45

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_sv_account_pk_seq'::regclass)` |
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
| 23 | `current_or_future_bankruptcy` | boolean | YES |  |
| 24 | `past_bankruptcy` | boolean | YES |  |
| 25 | `pay_off_date` | date | YES |  |
| 26 | `rating` | character varying(255) | YES |  |
| 27 | `show_alerts` | boolean | YES |  |
| 28 | `over_payment_amount` | numeric(19,2) | YES |  |
| 29 | `tax_for_zip_pk` | bigint | YES |  |
| 30 | `is90day_eligible` | boolean | YES |  |
| 31 | `is90day_eligible_override` | boolean | YES |  |
| 32 | `pay_off_date_time` | timestamp without time zone | YES |  |
| 33 | `ref_contract_number` | character varying(255) | YES |  |
| 34 | `auto_pay_types` | character varying(255) | YES |  |
| 35 | `cancelled_date_time` | timestamp without time zone | YES |  |
| 36 | `charged_off_date_time` | timestamp without time zone | YES |  |
| 37 | `closed_date_time` | timestamp without time zone | YES |  |
| 38 | `settled_in_full_date_time` | timestamp without time zone | YES |  |
| 39 | `sold_date_time` | timestamp without time zone | YES |  |
| 40 | `date_of_next_call` | date | YES |  |
| 41 | `debt_type` | character varying(255) | YES |  |
| 42 | `internal_account_score` | double precision | YES |  |
| 43 | `last_rating_time` | timestamp without time zone | YES |  |
| 44 | `cc_peek_consent` | boolean | YES |  |
| 45 | `consent_date` | date | YES |  |

## uown_sv_account_notes

**Schema:** `public` | **Columns:** 8

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_sv_account_notes_pk_seq'::regclass)` |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `account_pk` | bigint | NO |  |
| 8 | `notes` | text | YES |  |

## uown_sv_achpayment

**Schema:** `public` | **Columns:** 50

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_sv_achpayment_pk_seq'::regclass)` |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `ach_process_type` | character varying(255) | YES |  |
| 8 | `ach_type` | character varying(255) | YES |  |
| 9 | `amount` | numeric(19,2) | YES |  |
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
| 45 | `is_nsf` | boolean | YES |  |
| 46 | `is_settled_in_re_run` | boolean | YES |  |
| 47 | `original_achpk` | bigint | YES |  |
| 48 | `remaining_refundable_amount` | numeric(19,2) | YES |  |
| 49 | `original_ach_posting_date` | date | YES |  |
| 51 | `payment_arrangement_pk` | bigint | YES |  |

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
| 1 | `pk` | bigint | NO | `nextval('uown_sv_activity_log_pk_seq'::regclass)` |
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
| 1 | `pk` | bigint | NO | `nextval('uown_sv_address_pk_seq'::regclass)` |
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
| 20 | `is_autocomplete_verified` | boolean | YES |  |
| 21 | `zip_code9` | character varying(255) | YES |  |

## uown_sv_alert

**Schema:** `public` | **Columns:** 10

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_sv_alert_pk_seq'::regclass)` |
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
| 1 | `pk` | bigint | NO | `nextval('uown_sv_allocation_pk_seq'::regclass)` |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `account_pk` | bigint | NO |  |
| 8 | `allocated_amount` | numeric(19,2) | YES |  |
| 9 | `payment_pk` | bigint | YES |  |
| 10 | `receivable_pk` | bigint | YES |  |
| 11 | `non_taxable_amount` | numeric(19,2) | YES |  |
| 12 | `taxable_amount` | numeric(19,2) | YES |  |
| 13 | `receivable_type` | character varying(255) | YES |  |
| 14 | `tax_for_zip_pk` | bigint | YES |  |
| 15 | `tax_rate` | numeric(9,5) | YES |  |
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
| 12 | `allocated_amount` | numeric(19,2) | YES |  |
| 13 | `non_taxable_amount` | numeric(19,2) | YES |  |
| 14 | `receivable_type` | character varying(255) | YES |  |
| 15 | `tax_for_zip_pk` | bigint | YES |  |
| 16 | `tax_rate` | numeric(19,2) | YES |  |
| 17 | `taxable_amount` | numeric(19,2) | YES |  |
| 18 | `transaction_pk` | bigint | YES |  |

## uown_sv_auth_token

**Schema:** `public` | **Columns:** 9

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_sv_auth_token_pk_seq'::regclass)` |
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
| 1 | `pk` | bigint | NO | `nextval('uown_sv_bank_account_pk_seq'::regclass)` |
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

**Schema:** `public` | **Columns:** 22

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_sv_contract_pk_seq'::regclass)` |
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
| 18 | `invoice_amount` | numeric(19,2) | YES |  |
| 19 | `attempted_post_back` | boolean | YES |  |
| 20 | `post_back_error` | text | YES |  |
| 21 | `invoice_record` | text | YES |  |
| 22 | `items_record` | text | YES |  |

## uown_sv_credit_card

**Schema:** `public` | **Columns:** 39

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_sv_credit_card_pk_seq'::regclass)` |
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
| 29 | `cc_hash` | integer | YES |  |
| 30 | `cc_vendor` | character varying(255) | YES |  |
| 31 | `kount_pk` | bigint | YES |  |
| 32 | `kount_session_id` | character varying(255) | YES |  |
| 33 | `pre_auth_status` | character varying(255) | YES |  |
| 34 | `cc_last_four_digit` | character(4) | YES |  |
| 35 | `cc_connector_token` | character varying(255) | YES |  |
| 36 | `invalid_card_reason` | character varying(255) | YES |  |
| 37 | `is_valid_card` | boolean | YES |  |
| 38 | `is_autocomplete_verified` | boolean | YES |  |
| 39 | `cc_zip9` | character varying(255) | YES |  |

## uown_sv_credit_card_history

**Schema:** `public` | **Columns:** 40

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
| 31 | `cc_hash` | integer | YES |  |
| 32 | `cc_vendor` | character varying(255) | YES |  |
| 33 | `kount_pk` | bigint | YES |  |
| 34 | `kount_session_id` | character varying(255) | YES |  |
| 35 | `pre_auth_status` | character varying(255) | YES |  |
| 36 | `cc_connector_token` | character varying(255) | YES |  |
| 37 | `invalid_card_reason` | character varying(255) | YES |  |
| 38 | `is_valid_card` | boolean | YES |  |
| 39 | `is_autocomplete_verified` | boolean | YES |  |
| 40 | `cc_zip9` | character varying(255) | YES |  |

## uown_sv_credit_card_transaction

**Schema:** `public` | **Columns:** 79

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_sv_credit_card_transaction_pk_seq'::regclass)` |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `amount` | numeric(19,2) | YES |  |
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
| 50 | `number_of_tries` | integer | YES |  |
| 51 | `original_ccpk` | bigint | YES |  |
| 52 | `is_deleted` | boolean | YES |  |
| 53 | `rerun_status` | character varying(255) | YES |  |
| 54 | `rerun_nsf_status` | character varying(255) | YES |  |
| 55 | `error_msg` | character varying(255) | YES |  |
| 56 | `remaining_refundable_balance` | numeric(19,2) | YES |  |
| 57 | `remaining_refundable_amount` | numeric(19,2) | YES |  |
| 58 | `error_stacktrace` | text | YES |  |
| 59 | `cc_hash` | integer | YES |  |
| 60 | `cc_vendor` | character varying(255) | YES |  |
| 61 | `kount_pk` | bigint | YES |  |
| 62 | `kount_session_id` | character varying(255) | YES |  |
| 63 | `pre_auth_status` | character varying(255) | YES |  |
| 64 | `charge_type` | character varying(255) | YES |  |
| 65 | `charged_fee_amount` | numeric(19,2) | YES |  |
| 66 | `gateway_auth_token` | character varying(255) | YES |  |
| 67 | `id` | bigint | YES |  |
| 68 | `cc_connector_token` | character varying(255) | YES |  |
| 69 | `invalid_card_reason` | character varying(255) | YES |  |
| 70 | `is_valid_card` | boolean | YES |  |
| 71 | `idempotency_key` | character varying(255) | YES |  |
| 72 | `charge_fee` | boolean | YES |  |
| 73 | `is_autocomplete_verified` | boolean | YES |  |
| 74 | `cc_zip9` | character varying(255) | YES |  |
| 75 | `cc_peek` | boolean | YES |  |
| 76 | `original_amount` | numeric(19,2) | YES |  |
| 77 | `same_day_transaction` | boolean | YES |  |
| 78 | `is_settlement_payment` | boolean | YES |  |
| 79 | `payment_arrangement_pk` | bigint | YES |  |

## uown_sv_customer

**Schema:** `public` | **Columns:** 27

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_sv_customer_pk_seq'::regclass)` |
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

## uown_sv_email

**Schema:** `public` | **Columns:** 12

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_sv_email_pk_seq'::regclass)` |
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
| 1 | `pk` | bigint | NO | `nextval('uown_sv_employment_pk_seq'::regclass)` |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `annual_income` | numeric(19,2) | YES |  |
| 8 | `duration` | character varying(255) | YES |  |
| 9 | `employer` | character varying(255) | YES |  |
| 10 | `employment_status` | character varying(255) | YES |  |
| 11 | `employment_type` | character varying(255) | YES |  |
| 12 | `hire_date` | date | YES |  |
| 13 | `income_per_pay_period` | numeric(19,2) | YES |  |
| 14 | `job_title` | character varying(255) | YES |  |
| 15 | `last_pay_date` | date | YES |  |
| 16 | `monthly_income` | numeric(19,2) | YES |  |
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
| 9 | `annual_income` | numeric(19,2) | YES |  |
| 10 | `duration` | character varying(255) | YES |  |
| 11 | `employer` | character varying(255) | YES |  |
| 12 | `employment_status` | character varying(255) | YES |  |
| 13 | `employment_type` | character varying(255) | YES |  |
| 14 | `hire_date` | date | YES |  |
| 15 | `income_per_pay_period` | numeric(19,2) | YES |  |
| 16 | `job_title` | character varying(255) | YES |  |
| 17 | `last_pay_date` | date | YES |  |
| 18 | `monthly_income` | numeric(19,2) | YES |  |
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
| 1 | `pk` | bigint | NO | `nextval('uown_sv_inbound_api_log_pk_seq'::regclass)` |
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
| 1 | `pk` | bigint | NO | `nextval('uown_sv_inbound_internal_log_pk_seq'::regclass)` |
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
| 1 | `pk` | bigint | NO | `nextval('uown_sv_invoice_pk_seq'::regclass)` |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `category` | character varying(255) | YES |  |
| 8 | `delivery_fee` | numeric(19,2) | YES |  |
| 9 | `deposit_amount` | numeric(19,2) | YES |  |
| 10 | `description` | text | YES |  |
| 11 | `discount_amount` | numeric(19,2) | YES |  |
| 12 | `installation_fee` | numeric(19,2) | YES |  |
| 13 | `invoice_status` | character varying(255) | YES |  |
| 14 | `last_delivery_date` | date | YES |  |
| 15 | `merchandise_amount` | numeric(19,2) | YES |  |
| 16 | `merchant_invoice_number` | character varying(255) | YES |  |
| 17 | `merchant_pk` | bigint | NO |  |
| 18 | `merchant_protection_plan` | numeric(19,2) | YES |  |
| 19 | `miscellaneous_fee` | numeric(19,2) | YES |  |
| 20 | `shipping_same_as_consumer` | boolean | YES |  |
| 21 | `tax_amount` | numeric(19,2) | YES |  |
| 22 | `total_invoice_amount` | numeric(19,2) | YES |  |
| 23 | `total_number_of_items` | integer | YES |  |
| 24 | `account_pk` | bigint | YES |  |
| 25 | `invoice_number` | character varying(255) | YES |  |
| 26 | `sales_person` | character varying(255) | YES |  |
| 27 | `order_id` | character varying(255) | YES |  |
| 28 | `external_reference_id` | character varying(255) | YES |  |
| 29 | `purchase_total` | numeric(19,2) | YES |  |

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
| 1 | `pk` | bigint | NO | `nextval('uown_sv_item_pk_seq'::regclass)` |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `account_pk` | bigint | NO |  |
| 8 | `base_price_per_item` | numeric(19,2) | YES |  |
| 9 | `category` | character varying(255) | YES |  |
| 10 | `delivery_type` | character varying(255) | YES |  |
| 11 | `invoice_pk` | bigint | NO |  |
| 12 | `item_code` | character varying(255) | YES |  |
| 13 | `item_delivery_date` | date | YES |  |
| 14 | `item_delivery_fee` | numeric(19,2) | YES |  |
| 15 | `item_description` | text | YES |  |
| 16 | `item_image_url` | character varying(255) | YES |  |
| 17 | `items_delivery_fee` | numeric(19,2) | YES |  |
| 18 | `lead_pk` | bigint | NO |  |
| 19 | `line_number` | character varying(255) | YES |  |
| 20 | `merchant_pk` | bigint | NO |  |
| 21 | `number_of_items` | integer | YES |  |
| 22 | `number_of_items_delivered` | integer | YES |  |
| 23 | `serial_number` | character varying(255) | YES |  |
| 24 | `status` | character varying(255) | YES |  |
| 25 | `tax_per_item` | numeric(19,2) | YES |  |
| 26 | `total_price_for_items` | numeric(19,2) | YES |  |
| 27 | `total_price_per_item` | numeric(19,2) | YES |  |
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
| 1 | `pk` | bigint | NO | `nextval('uown_sv_outbound_api_log_pk_seq'::regclass)` |
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
| 1 | `pk` | bigint | NO | `nextval('uown_sv_payment_pk_seq'::regclass)` |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `ach_pk` | bigint | YES |  |
| 8 | `cc_pk` | bigint | YES |  |
| 9 | `is_ach` | boolean | YES |  |
| 10 | `is_credit_card` | boolean | YES |  |
| 11 | `payment_amount` | numeric(19,2) | YES |  |
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
| 24 | `non_taxable_payment` | numeric(19,2) | YES |  |
| 25 | `taxable_payment` | numeric(19,2) | YES |  |

## uown_sv_payment_arrangement

**Schema:** `public` | **Columns:** 18

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_sv_payment_arrangement_pk_seq'::regclass)` |
| 2 | `account_pk` | bigint | NO |  |
| 3 | `start_date` | date | YES |  |
| 4 | `end_date` | date | YES |  |
| 5 | `amount` | numeric(19,2) | YES |  |
| 6 | `arrangement_type` | character varying(50) | YES |  |
| 7 | `payment_type` | character varying(50) | YES |  |
| 8 | `username` | character varying(255) | YES |  |
| 9 | `previous_rating` | character varying(50) | YES |  |
| 10 | `current_rating` | character varying(50) | YES |  |
| 11 | `is_active` | boolean | NO | `true` |
| 12 | `status` | character varying(50) | YES |  |
| 13 | `notes` | text | YES |  |
| 14 | `tenant_id` | bigint | YES |  |
| 15 | `web_user_id` | bigint | YES |  |
| 16 | `agent` | character varying(255) | YES |  |
| 17 | `row_created_timestamp` | timestamp without time zone | YES | `now()` |
| 18 | `row_updated_timestamp` | timestamp without time zone | YES |  |

## uown_sv_phone

**Schema:** `public` | **Columns:** 17

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_sv_phone_pk_seq'::regclass)` |
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

## uown_sv_phone_history

**Schema:** `public` | **Columns:** 19

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

## uown_sv_protection_plan

**Schema:** `public` | **Columns:** 25

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_sv_protection_plan_pk_seq'::regclass)` |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `account_pk` | bigint | YES |  |
| 8 | `already_covered` | boolean | YES |  |
| 9 | `connector_token` | character varying(255) | YES |  |
| 10 | `customer_id` | character varying(255) | YES |  |
| 11 | `error` | text | YES |  |
| 12 | `lead_pk` | bigint | YES |  |
| 13 | `offer_element_response` | text | YES |  |
| 14 | `opt_in` | boolean | YES |  |
| 15 | `policy_id` | character varying(255) | YES |  |
| 16 | `request` | text | YES |  |
| 17 | `response` | text | YES |  |
| 18 | `status` | character varying(255) | YES |  |
| 19 | `covered_by_account_pk` | character varying(255) | YES |  |
| 20 | `covered_by_lead_pk` | character varying(255) | YES |  |
| 21 | `enrollment_date` | date | YES |  |
| 22 | `order_id` | character varying(255) | YES |  |
| 23 | `cancellation_date` | date | YES |  |
| 24 | `cancellation_reason` | text | YES |  |
| 25 | `refund_amount` | numeric(19,2) | YES |  |

## uown_sv_pwpayment

**Schema:** `public` | **Columns:** 18

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_sv_pwpayment_pk_seq'::regclass)` |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `account_pk` | bigint | YES |  |
| 8 | `amount` | numeric(19,2) | YES |  |
| 9 | `client` | character varying(255) | YES |  |
| 10 | `customer_name` | character varying(255) | YES |  |
| 11 | `lead_pk` | bigint | YES |  |
| 12 | `loan_disbursement_account` | character varying(255) | YES |  |
| 13 | `loan_ref_id` | character varying(255) | YES |  |
| 14 | `posting_date` | date | YES |  |
| 15 | `salary_collection_account` | character varying(255) | YES |  |
| 16 | `status` | integer | YES |  |
| 17 | `trace_number` | character varying(255) | YES |  |
| 18 | `file_name` | character varying(255) | YES |  |

## uown_sv_receivable

**Schema:** `public` | **Columns:** 23

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_sv_receivable_pk_seq'::regclass)` |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `allocation_status` | character varying(255) | YES |  |
| 8 | `base_amount` | numeric(19,2) | YES |  |
| 9 | `base_epo_amount` | numeric(19,2) | YES |  |
| 10 | `comment` | text | YES |  |
| 11 | `due_date` | date | YES |  |
| 12 | `partial_payment_amount` | numeric(19,2) | YES |  |
| 13 | `receivable_type` | character varying(255) | YES |  |
| 14 | `status` | character varying(255) | YES |  |
| 15 | `tax_amount` | numeric(19,2) | YES |  |
| 16 | `total_amount` | numeric(19,2) | YES |  |
| 17 | `account_pk` | bigint | YES |  |
| 18 | `notes` | text | YES |  |
| 19 | `tax_rate` | numeric(9,5) | YES |  |
| 20 | `skipped` | boolean | YES |  |
| 21 | `tax_updated` | timestamp without time zone | YES |  |
| 22 | `tax_for_zip_pk` | bigint | YES |  |
| 23 | `base_epo90day_ineligible` | numeric(19,2) | YES |  |

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
| 11 | `base_amount` | numeric(19,2) | YES |  |
| 12 | `base_epo_amount` | numeric(19,2) | YES |  |
| 13 | `comment` | text | YES |  |
| 14 | `due_date` | date | YES |  |
| 15 | `notes` | text | YES |  |
| 16 | `partial_payment_amount` | numeric(19,2) | YES |  |
| 17 | `receivable_type` | character varying(255) | YES |  |
| 18 | `status` | character varying(255) | YES |  |
| 19 | `tax_amount` | numeric(19,2) | YES |  |
| 20 | `tax_rate` | numeric(19,2) | YES |  |
| 21 | `total_amount` | numeric(19,2) | YES |  |
| 22 | `skipped` | boolean | YES |  |
| 23 | `tax_updated` | timestamp without time zone | YES |  |
| 24 | `tax_for_zip_pk` | bigint | YES |  |
| 25 | `base_epo90day_ineligible` | numeric(19,2) | YES |  |

## uown_sv_sched_summary

**Schema:** `public` | **Columns:** 62

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_sv_sched_summary_pk_seq'::regclass)` |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `amount_past_due_without_tax` | numeric(19,2) | YES |  |
| 8 | `balance_amount_without_tax` | numeric(19,2) | YES |  |
| 9 | `cost_with_fees_no_tax` | numeric(19,2) | YES |  |
| 10 | `cost_without_tax_and_fees` | numeric(19,2) | YES |  |
| 11 | `days_past_due` | integer | YES |  |
| 12 | `due_date_moves` | integer | YES |  |
| 13 | `early_payoff_date_expiry` | date | YES |  |
| 14 | `epo_amount_without_tax` | numeric(19,2) | YES |  |
| 15 | `first_payment_discount` | numeric(19,2) | YES |  |
| 16 | `first_payment_due_date` | date | YES |  |
| 17 | `first_payment_with_tax_no_fees` | numeric(19,2) | YES |  |
| 18 | `last_payment_date` | date | YES |  |
| 19 | `last_payment_with_tax` | numeric(19,2) | YES |  |
| 20 | `merchant_discount_amount` | numeric(19,2) | YES |  |
| 21 | `merchant_discount_rate` | numeric(9,5) | YES |  |
| 22 | `merchant_rebate_amount` | numeric(19,2) | YES |  |
| 23 | `merchant_rebate_rate` | numeric(9,5) | YES |  |
| 24 | `money_factor` | numeric(19,2) | YES |  |
| 25 | `next_payment_due_date` | date | YES |  |
| 26 | `next_payment_with_tax` | numeric(19,2) | YES |  |
| 27 | `number_of_payments_made` | integer | YES |  |
| 28 | `payment_frequency` | character varying(255) | YES |  |
| 29 | `plat_form_fee_amount` | numeric(19,2) | YES |  |
| 30 | `plat_form_fee_rate` | numeric(9,4) | YES |  |
| 31 | `processing_fee` | numeric(19,2) | YES |  |
| 32 | `protection_plan_fee` | numeric(19,2) | YES |  |
| 33 | `remaining_number_of_payments` | integer | YES |  |
| 34 | `tax_amount` | numeric(9,4) | YES |  |
| 35 | `tax_per_scheduled_payment` | numeric(9,4) | YES |  |
| 36 | `tax_rate` | numeric(9,5) | YES |  |
| 37 | `term_in_months` | integer | YES |  |
| 38 | `total_contract_amount_with_tax_and_fees` | numeric(19,2) | YES |  |
| 39 | `total_number_of_payments` | integer | YES |  |
| 40 | `total_recycle_fee` | numeric(19,2) | YES |  |
| 41 | `account_pk` | bigint | YES |  |
| 42 | `delinquency_as_of_date` | date | YES |  |
| 43 | `redirect_url` | character varying(255) | YES |  |
| 44 | `security_deposit` | numeric(19,2) | YES |  |
| 45 | `last_tax_updated_time` | timestamp without time zone | YES |  |
| 46 | `first_payment_no_tax_no_fees` | numeric(19,2) | YES |  |
| 47 | `last_payment_no_tax_no_fees` | numeric(19,2) | YES |  |
| 48 | `next_payment_no_tax_no_fees` | numeric(19,2) | YES |  |
| 49 | `first_payment_no_tax_with_fees` | numeric(19,2) | YES |  |
| 50 | `first_payment_tax` | numeric(9,4) | YES |  |
| 51 | `frequency_changes` | integer | YES |  |
| 52 | `last_payment_no_tax_with_fees` | numeric(19,2) | YES |  |
| 53 | `last_payment_tax` | numeric(9,4) | YES |  |
| 54 | `regular_payment_tax` | numeric(9,4) | YES |  |
| 55 | `buyout_fee` | numeric(19,2) | YES |  |
| 56 | `amount_charged_at_signing` | numeric(19,2) | YES |  |
| 57 | `signing_fee` | numeric(19,2) | YES |  |
| 58 | `epo_amount_with_tax` | numeric(19,2) | YES |  |
| 59 | `program_name` | character varying(255) | YES |  |
| 60 | `ks_label` | character varying(255) | YES |  |
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
| 9 | `amount_past_due_without_tax` | numeric(19,2) | YES |  |
| 10 | `balance_amount_without_tax` | numeric(19,2) | YES |  |
| 11 | `cost_with_fees_no_tax` | numeric(19,2) | YES |  |
| 12 | `cost_without_tax_and_fees` | numeric(19,2) | YES |  |
| 13 | `days_past_due` | integer | YES |  |
| 14 | `due_date_moves` | integer | YES |  |
| 15 | `early_payoff_date_expiry` | date | YES |  |
| 16 | `epo_amount_without_tax` | numeric(19,2) | YES |  |
| 17 | `first_payment_discount` | numeric(19,2) | YES |  |
| 18 | `first_payment_due_date` | date | YES |  |
| 19 | `first_payment_with_tax_no_fees` | numeric(19,2) | YES |  |
| 20 | `last_payment_date` | date | YES |  |
| 21 | `last_payment_with_tax` | numeric(19,2) | YES |  |
| 22 | `merchant_discount_amount` | numeric(19,2) | YES |  |
| 23 | `merchant_discount_rate` | numeric(9,5) | YES |  |
| 24 | `merchant_rebate_amount` | numeric(19,2) | YES |  |
| 25 | `merchant_rebate_rate` | numeric(9,5) | YES |  |
| 26 | `money_factor` | numeric(19,2) | YES |  |
| 27 | `next_payment_due_date` | date | YES |  |
| 28 | `next_payment_with_tax` | numeric(19,2) | YES |  |
| 29 | `number_of_payments_made` | integer | YES |  |
| 30 | `payment_frequency` | character varying(255) | YES |  |
| 31 | `plat_form_fee_amount` | numeric(19,2) | YES |  |
| 32 | `plat_form_fee_rate` | numeric(9,4) | YES |  |
| 33 | `processing_fee` | numeric(19,2) | YES |  |
| 34 | `protection_plan_fee` | numeric(19,2) | YES |  |
| 35 | `remaining_number_of_payments` | integer | YES |  |
| 36 | `tax_amount` | numeric(9,4) | YES |  |
| 37 | `tax_per_scheduled_payment` | numeric(9,4) | YES |  |
| 38 | `tax_rate` | numeric(9,5) | YES |  |
| 39 | `term_in_months` | integer | YES |  |
| 40 | `total_contract_amount_with_tax_and_fees` | numeric(19,2) | YES |  |
| 41 | `total_number_of_payments` | integer | YES |  |
| 42 | `total_recycle_fee` | numeric(19,2) | YES |  |
| 43 | `account_pk` | bigint | YES |  |
| 44 | `delinquency_as_of_date` | date | YES |  |
| 45 | `redirect_url` | character varying(255) | YES |  |
| 46 | `security_deposit` | numeric(19,2) | YES |  |
| 47 | `last_tax_updated_time` | timestamp without time zone | YES |  |
| 48 | `first_payment_no_tax_no_fees` | numeric(19,2) | YES |  |
| 49 | `last_payment_no_tax_no_fees` | numeric(19,2) | YES |  |
| 50 | `next_payment_no_tax_no_fees` | numeric(19,2) | YES |  |
| 51 | `first_payment_no_tax_with_fees` | numeric(19,2) | YES |  |
| 52 | `first_payment_tax` | numeric(9,4) | YES |  |
| 53 | `frequency_changes` | integer | YES |  |
| 54 | `last_payment_no_tax_with_fees` | numeric(19,2) | YES |  |
| 55 | `last_payment_tax` | numeric(9,4) | YES |  |
| 56 | `regular_payment_tax` | numeric(9,4) | YES |  |
| 57 | `buyout_fee` | numeric(19,2) | YES |  |
| 58 | `amount_charged_at_signing` | numeric(19,2) | YES |  |
| 59 | `signing_fee` | numeric(19,2) | YES |  |
| 60 | `epo_amount_with_tax` | numeric(19,2) | YES |  |
| 61 | `program_name` | character varying(255) | YES |  |
| 62 | `ks_label` | character varying(255) | YES |  |
| 63 | `short_code` | character varying(8) | YES |  |
| 64 | `plan_id` | character varying(255) | YES |  |

## uown_sv_sql_config

**Schema:** `public` | **Columns:** 8

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_sv_sql_config_pk_seq'::regclass)` |
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
| 1 | `pk` | bigint | NO | `nextval('uown_sv_transaction_pk_seq'::regclass)` |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `cancelled_or_reversed` | boolean | YES |  |
| 8 | `comments` | text | YES |  |
| 9 | `due_amount` | numeric(19,2) | YES |  |
| 10 | `due_date` | date | YES |  |
| 11 | `next_due_date` | date | YES |  |
| 12 | `payment_pk` | bigint | YES |  |
| 13 | `receivable_pk` | bigint | YES |  |
| 14 | `remaining_payment_amount` | numeric(19,2) | YES |  |
| 15 | `tax_amount` | numeric(19,2) | YES |  |
| 16 | `total_due_amount` | numeric(19,2) | YES |  |
| 17 | `total_payment_amount` | numeric(19,2) | YES |  |
| 18 | `transaction_date` | date | YES |  |
| 19 | `transaction_type` | character varying(255) | YES |  |
| 20 | `account_pk` | bigint | YES |  |
| 21 | `remaining_due_amount` | numeric(19,2) | YES |  |
| 22 | `total_allocated_amount` | numeric(19,2) | YES |  |
| 23 | `username` | character varying(255) | YES |  |
| 24 | `days_late` | integer | YES |  |
| 25 | `allocated_amount` | numeric(19,2) | YES |  |
| 26 | `non_taxable_amount` | numeric(19,2) | YES |  |
| 27 | `receivable_type` | character varying(255) | YES |  |
| 28 | `tax_rate` | numeric(9,5) | YES |  |
| 29 | `taxable_amount` | numeric(19,2) | YES |  |
| 30 | `past_due_balance` | numeric(19,2) | YES |  |

## uown_sv_transaction_history

**Schema:** `public` | **Columns:** 4

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO |  |
| 2 | `rev` | integer | NO |  |
| 3 | `revtype` | smallint | YES |  |
| 4 | `account_pk` | bigint | YES |  |

## uown_sv_uwdata

**Schema:** `public` | **Columns:** 29

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_sv_uwdata_pk_seq'::regclass)` |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `abb_uw_response` | text | YES |  |
| 8 | `approval_amount` | numeric(19,2) | YES |  |
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
| 22 | `previous_uw` | character varying(255) | YES |  |
| 23 | `risk_type` | character varying(255) | YES |  |
| 24 | `uw_approval_amount` | numeric(19,2) | YES |  |
| 25 | `cash_score_threshold` | integer | YES |  |
| 26 | `vantage_score` | integer | YES |  |
| 27 | `eligible_terms` | text | YES |  |
| 28 | `campaign_id` | integer | YES |  |
| 29 | `internal_decision` | character varying(255) | YES |  |

## uown_sweep_logs

**Schema:** `public` | **Columns:** 15

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_sweep_logs_pk_seq'::regclass)` |
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
| 1 | `pk` | bigint | NO | `nextval('uown_tax_cloud_pk_seq'::regclass)` |
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
| 1 | `pk` | bigint | NO | `nextval('uown_tax_cloud_outbound_pk_seq'::regclass)` |
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
| 1 | `pk` | bigint | NO | `nextval('uown_tax_for_zip_pk_seq'::regclass)` |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `combined_tax_rate` | numeric(19,2) | YES |  |
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

**Schema:** `public` | **Columns:** 35

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_template_pk_seq'::regclass)` |
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
| 17 | `merchant_id` | character varying(255) | YES |  |
| 18 | `month_limit` | integer | YES |  |
| 19 | `no_limit` | boolean | YES |  |
| 20 | `priority` | integer | YES |  |
| 21 | `program_id` | character varying(255) | YES |  |
| 22 | `rules` | text | YES |  |
| 23 | `state_code` | character varying(255) | YES |  |
| 24 | `state_name` | character varying(255) | YES |  |
| 25 | `subject` | text | YES |  |
| 26 | `template_content` | text | YES |  |
| 27 | `template_name` | character varying(255) | YES |  |
| 28 | `template_type` | character varying(255) | YES |  |
| 29 | `total_limit` | integer | YES |  |
| 30 | `trigger_type` | character varying(255) | YES |  |
| 31 | `version_number` | bigint | NO |  |
| 32 | `week_limit` | integer | YES |  |
| 33 | `year_limit` | integer | YES |  |
| 34 | `client_type` | text | YES |  |
| 35 | `is_native` | boolean | YES |  |

## uown_third_party_contact

**Schema:** `public` | **Columns:** 8

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `pk` | bigint | NO | `nextval('uown_third_party_contact_pk_seq'::regclass)` |
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
| 1 | `pk` | bigint | NO | `nextval('uown_uw_engine_data_pk_seq'::regclass)` |
| 2 | `agent` | character varying(255) | YES |  |
| 3 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 4 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 5 | `tenant_id` | bigint | YES |  |
| 6 | `web_user_id` | bigint | YES |  |
| 7 | `failure_reasons` | character varying(255) | YES |  |
| 8 | `lead_pk` | bigint | YES |  |
| 9 | `status` | character varying(255) | YES |  |
| 10 | `sentilink_pk` | bigint | YES |  |
| 11 | `neustar_pk` | bigint | YES |  |
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
| 1 | `pk` | bigint | NO | `nextval('uown_uwengine_outbound_pk_seq'::regclass)` |
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
| 1 | `pk` | bigint | NO | `nextval('uown_uwstep_pk_seq'::regclass)` |
| 2 | `row_created_timestamp` | timestamp without time zone | YES |  |
| 3 | `row_updated_timestamp` | timestamp without time zone | YES |  |
| 4 | `tenant_id` | bigint | YES |  |
| 5 | `override_from_statuses` | character varying(255) | YES |  |
| 6 | `step_name` | character varying(255) | YES |  |
| 7 | `step_order` | integer | YES |  |


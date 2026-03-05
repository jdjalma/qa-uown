# Apendice F: Referencia de Consultas SQL Operacionais
## UOwn Leasing - SVC Platform

Consultas SQL frequentes para investigacao, troubleshooting e operacao do sistema. Organizadas por dominio de negocio.

---

## Indice

1. [LOS - Leads e Aplicacoes](#1-los---leads-e-aplicacoes)
2. [LOS - Dados do Cliente](#2-los---dados-do-cliente)
3. [LOS - Contratos e Invoices](#3-los---contratos-e-invoices)
4. [LOS - Underwriting e Fraude](#4-los---underwriting-e-fraude)
5. [SVC - Contas de Servicing](#5-svc---contas-de-servicing)
6. [SVC - Dados do Cliente](#6-svc---dados-do-cliente)
7. [SVC - Recebiveis e Cronograma](#7-svc---recebiveis-e-cronograma)
7b. [SVC - Arranjos de Pagamento](#7b-svc---arranjos-de-pagamento-task-446)
8. [SVC - Pagamentos CC](#8-svc---pagamentos-cc)
9. [SVC - Pagamentos ACH](#9-svc---pagamentos-ach)
10. [SVC - Pagamentos Gerais](#10-svc---pagamentos-gerais)
11. [Merchants e Programas](#11-merchants-e-programas)
12. [Correspondencia (Email/SMS)](#12-correspondencia-emailsms)
13. [Sweeps e Tarefas Agendadas](#13-sweeps-e-tarefas-agendadas)
14. [SQL dos Sweeps (Criterios de Selecao)](#14-sql-dos-sweeps-criterios-de-selecao)
15. [Inadimplencia e Cobranca](#15-inadimplencia-e-cobranca)
16. [Logs e Auditoria](#16-logs-e-auditoria)
17. [Verificacoes de Fraude](#17-verificacoes-de-fraude)
18. [Configuracoes e Templates](#18-configuracoes-e-templates)
19. [AMS - Usuarios e Permissoes](#19-ams---usuarios-e-permissoes)

---

## 1. LOS - Leads e Aplicacoes

### Consultar lead por PK
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

### Consultar lead por short code (tabela nova: uown_los_lead_short_code)
```sql
-- Apos migracao V20260226100000: short_code migrou de uown_los_lead para uown_los_lead_short_code
SELECT ulsc.short_code, ulsc.lead_pk, ulsc.pk
FROM uown_los_lead_short_code ulsc
WHERE ulsc.lead_pk IN (:leadPk)
ORDER BY ulsc.pk DESC;
```

### Consultar lead por short code (lookup reverso)
```sql
SELECT ull.*, ulsc.short_code
FROM uown_los_lead ull
JOIN uown_los_lead_short_code ulsc ON ulsc.lead_pk = ull.pk
WHERE ulsc.short_code IN (:shortCode)
ORDER BY ull.pk DESC;
```

### Consultar lead por periodo
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

### Consultar opcoes de pagamento do lead
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

### Consultar notas do lead
```sql
SELECT * FROM uown_los_lead_notes ulln WHERE ulln.lead_pk IN (:leadPk);
```

---

## 2. LOS - Dados do Cliente

### Consulta completa de dados do cliente (todos os dados de um lead)
```sql
-- Cliente
SELECT * FROM uown_los_customer WHERE lead_pk IN (:leadPk) ORDER BY pk DESC;

-- Enderecos
SELECT * FROM uown_los_address WHERE lead_pk IN (:leadPk) ORDER BY pk DESC;

-- Emails
SELECT * FROM uown_los_email WHERE lead_pk IN (:leadPk);

-- Telefones
SELECT lead_pk, pk, do_not_call, reason_for_dnc, do_not_text, reason_for_dnt, *
FROM uown_los_phone WHERE lead_pk IN (:leadPk);

-- Emprego
SELECT * FROM uown_los_employment WHERE lead_pk IN (:leadPk) ORDER BY pk DESC;

-- Contas bancarias
SELECT * FROM uown_los_bank_account WHERE lead_pk IN (:leadPk) ORDER BY pk DESC;

-- Cartoes de credito
SELECT * FROM uown_los_credit_card WHERE lead_pk IN (:leadPk) ORDER BY pk DESC;
```

### Emails duplicados (top 5 mais usados)
```sql
SELECT ule.email_address, COUNT(*) AS total_registros
FROM uown_los_email ule
GROUP BY ule.email_address
ORDER BY total_registros DESC
LIMIT 5;
```

---

## 3. LOS - Contratos e Invoices

### Consultar contratos de um lead
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

### Historico de contratos
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

### Invoice e itens de um lead
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

### Historico de invoice
```sql
SELECT ulih.lead_pk, ulih.* FROM uown_los_invoice_history ulih WHERE ulih.lead_pk IN (:leadPk);
```

### Schedule summary do lead
```sql
SELECT * FROM uown_los_sched_summary WHERE lead_pk IN (:leadPk) ORDER BY pk DESC;
```

### Recebiveis do lead (LOS)
```sql
SELECT * FROM uown_los_receivable WHERE lead_pk IN (:leadPk) ORDER BY pk DESC;
```

---

## 4. LOS - Underwriting e Fraude

### Dados de underwriting
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

> **Nota:** A coluna `lambda_segment` e populada pelo processo de underwriting GDS. Para leads aprovados via GDS, este campo contem o segmento lambda atribuido. Pode ser NULL para leads processados por outros engines (Taktile, ABB).

### UW filtrado por engine (GDS, Taktile, ABB)
```sql
SELECT *
FROM uown_los_uwdata
WHERE decided_by_agent = 'GDS'  -- ou 'TAKTILE', 'ABB'
ORDER BY pk DESC;
```

### Alertas do lead
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

## 5. SVC - Contas de Servicing

### Consultar conta por PK
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

### Buscar conta pelo merchant associado ao lead
```sql
SELECT m.*
FROM uown_merchant m
JOIN uown_los_lead l ON l.merchant_pk = m.pk
WHERE l.pk = :leadPk;
```

### Notas da conta
```sql
SELECT usan.account_pk, usan.*
FROM uown_sv_account_notes usan
WHERE usan.account_pk IN (:accountPk);
```

### Alertas da conta
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

## 6. SVC - Dados do Cliente

### Dados completos do cliente na conta
```sql
-- Cliente
SELECT account_pk, first_name, middle_name, last_name, *
FROM uown_sv_customer WHERE account_pk IN (:accountPk);

-- Enderecos
SELECT * FROM uown_sv_address WHERE account_pk IN (:accountPk);

-- Emails
SELECT account_pk, pk, do_not_email, reason_for_dnc, *
FROM uown_sv_email WHERE account_pk IN (:accountPk);

-- Telefones
SELECT account_pk, phone_number, pk, do_not_call, do_not_text, *
FROM uown_sv_phone WHERE account_pk IN (:accountPk);

-- Contas bancarias
SELECT * FROM uown_sv_bank_account WHERE account_pk IN (:accountPk);
```

### Cartoes de credito da conta
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

## 7. SVC - Recebiveis e Cronograma

### Recebiveis de uma conta (cronograma completo)
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

### Recebiveis com saldo pendente (outstanding)
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

### Recebiveis por tipo (ex: NSF_FEE)
```sql
SELECT *
FROM uown_sv_receivable usr
WHERE usr.receivable_type = 'NSF_FEE'  -- ou 'REGULAR_PAYMENT', 'EARLY_PAY_OFF', 'PROCESSING_FEE'
ORDER BY usr.pk DESC;
```

### Schedule summary da conta
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

## 7b. SVC - Arranjos de Pagamento (Task #446)

### Consultar arranjo de pagamento por conta
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

### Consultar transacoes CC vinculadas a um arranjo
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

### Consultar pagamentos ACH vinculados a um arranjo
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

### Verificar status do arranjo com resumo de transacoes
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

## 8. SVC - Pagamentos CC

### Transacoes CC de uma conta
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

### Transacoes CC negadas (para troubleshooting de reruns)
```sql
SELECT *
FROM uown_sv_credit_card_transaction uscct
WHERE uscct.status = 'DENIED'
ORDER BY uscct.pk DESC;
```

---

## 9. SVC - Pagamentos ACH

### Pagamentos ACH de uma conta
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

## 10. SVC - Pagamentos Gerais

### Pagamentos de uma conta
```sql
SELECT *
FROM uown_sv_payment usp
WHERE usp.account_pk IN (:accountPk)
ORDER BY usp.pk DESC;
```

---

## 11. Merchants e Programas

### Consultar merchant por codigo ou nome
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

### Flags booleanas do merchant (verificacao rapida)
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

### Contagem de flags nulas no merchant (auditoria de dados)
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

### Listar client types distintos
```sql
SELECT DISTINCT um.client_type
FROM uown_merchant um
ORDER BY um.client_type;
```

### Programas de um merchant
```sql
SELECT umtp.*, m.ref_merchant_code, m.*
FROM uown_merchant m
LEFT JOIN uown_merchant_to_program umtp ON umtp.merchant_pk = m.pk
WHERE m.ref_merchant_code IN (:refMerchantCode);
```

### Consultar programa por PK ou termo
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

### Historico de alteracoes do merchant
```sql
SELECT *
FROM uown_merchant_history umh
WHERE umh.row_created_timestamp BETWEEN :startDate AND :endDate
ORDER BY umh.pk DESC;
```

### Activity log do merchant (alteracoes de programa)
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

---

## 12. Correspondencia (Email/SMS)

### Fila de emails (recentes ou por conta)
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

### Fila de SMS
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

## 13. Sweeps e Tarefas Agendadas

### Listar todos os sweeps
```sql
SELECT * FROM uown_scheduled_task ORDER BY scheduled_task_name ASC;
```

### Buscar sweep por nome
```sql
SELECT *
FROM uown_scheduled_task
WHERE scheduled_task_name LIKE '%Payment%';
```

### Verificar status ativo/inativo dos sweeps
```sql
SELECT scheduled_task_name, is_active
FROM uown_scheduled_task
ORDER BY scheduled_task_name;
```

### Logs de execucao dos sweeps
```sql
SELECT *
FROM uown_sweep_logs usl
WHERE usl.row_created_timestamp BETWEEN :startDate AND :endDate
ORDER BY usl.pk DESC;
```

---

## 14. SQL dos Sweeps (Criterios de Selecao)

As queries abaixo sao os criterios SQL que os sweeps usam para selecionar registros a processar. Uteis para entender a logica de negocio e para troubleshooting.

### rerunCCPaymentsSweep - Retentativa de CC negados
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

### delinquencyRerunCCPaymentsSweep - Rerun CC em contas inadimplentes 100+ dias
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

### updateTaxRatesSweep - Contas que precisam atualizar taxa de imposto
```sql
SELECT a.pk AS accountPk, a.*
FROM uown_sv_account a
JOIN uown_sv_sched_summary summary ON summary.account_pk = a.pk
WHERE a.account_status = 'ACTIVE'
  AND (summary.last_tax_updated_time IS NULL
       OR summary.last_tax_updated_time + INTERVAL '1 MONTH' <= CURRENT_TIMESTAMP);
```

### FirstPaymentReminderSweep - Lembretes de primeiro pagamento
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

### customerPortalReminderSweep - Convites para portal do cliente
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

### RecurringPaymentReminderSweep - Lembrete de pagamento recorrente
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

### delinquencyOfferEmailSweep - Ofertas de negociacao por faixa de atraso
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

### paidInFullAccountEmailSweep - Contas quitadas (para email de confirmacao)
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

### sendCreditCardPaymentsSql - Envio de transacoes CC pendentes (inclui arranjos, Task #446)
```sql
-- Seleciona transacoes CC com status PENDING e posting_date <= hoje
-- Exclui contas com rating B ou C
SELECT t.*
FROM uown_sv_credit_card_transaction t
JOIN uown_sv_account a ON a.pk = t.account_pk
WHERE t.status = 'PENDING'
  AND t.posting_date <= CURRENT_DATE
  AND a.account_status = 'ACTIVE'
  AND (a.rating IS NULL OR a.rating NOT IN ('B', 'C'))
ORDER BY t.pk ASC;
-- Resultado: transacoes selecionadas sao marcadas como PICKED_TO_SEND
```

### sendACHPaymentsSql - Envio de pagamentos ACH pendentes (inclui arranjos, Task #446)
```sql
-- Seleciona pagamentos ACH com status PENDING e posting_date <= amanha (D+1)
-- Exclui contas com rating B ou C
SELECT ap.*
FROM uown_sv_achpayment ap
JOIN uown_sv_account a ON a.pk = ap.account_pk
WHERE ap.status = 'PENDING'
  AND ap.posting_date <= CURRENT_DATE + 1
  AND (a.rating IS NULL OR a.rating NOT IN ('B', 'C'))
ORDER BY ap.pk ASC;
-- Resultado: pagamentos selecionados sao marcados como PICKED_TO_SEND
```

### settledInFullAccountEmailSweep - Contas liquidadas por acordo
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

## 15. Inadimplencia e Cobranca

### Contas inadimplentes 150+ dias (com rating J ou P)
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

### Calculo de past due e valor de settlement
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

### Oferta de desconto por faixa de inadimplencia (Delinquency 150 Day Offer)
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

**Percentuais de desconto por faixa:**

| Dias em Atraso | Desconto Oferecido |
|---|---|
| 31-60 | 0% (valor cheio) |
| 61-90 | 30% (paga 70%) |
| 91-150 | 50% (paga 50%) |
| 150+ | 75% (paga 25%) |

### EPO pool em contas inadimplentes (days past due com pool)
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

## 16. Logs e Auditoria

### Activity log do LOS
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

### Activity log do SVC
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

### Leads com mais atividade INTERNAL do SYSTEM
```sql
SELECT
    ulal.lead_pk AS LeadPk,
    COUNT(*) AS num_ocorrencias,
    MAX(ulal.pk) AS max_pk
FROM uown_los_activity_log ulal
WHERE ulal.log_type IN ('INTERNAL')
  AND ulal.created_by IN ('SYSTEM')
GROUP BY ulal.lead_pk
HAVING COUNT(*) > 1
ORDER BY num_ocorrencias DESC;
```

### Inbound API logs (requisicoes recebidas)
```sql
SELECT *
FROM uown_los_inbound_api_log ulial
WHERE ulial.row_created_timestamp BETWEEN :startDate AND :endDate
  AND ulial.return_uuid IN (:leadPk)
ORDER BY pk DESC;
```

### Outbound API logs (requisicoes enviadas)
```sql
SELECT *
FROM uown_los_outbound_api_log ulial
WHERE ulial.row_created_timestamp BETWEEN :startDate AND :endDate
ORDER BY pk DESC;
```

### Documentos armazenados
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

### Gravacoes de lead (signing flow)
```sql
SELECT * FROM uown_lead_recording WHERE lead_pk IN (:leadPk);
```

### E-sign documents
```sql
SELECT * FROM uown_esign_document WHERE lead_pk IN (:leadPk);
```

---

## 17. Verificacoes de Fraude

### SEON (fraude digital)
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

### Intellicheck (verificacao de documento de ID)
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

### Kount (fraude de cartao de credito)
```sql
SELECT * FROM uown_kount WHERE account_pk IN (:accountPk);
```

### Kount token (validade)
```sql
SELECT
    CASE WHEN access_token IS NULL THEN 'N' ELSE 'Y' END AS token_valid
FROM uown_kount_token
WHERE COALESCE(row_updated_timestamp, row_created_timestamp) > NOW() - INTERVAL '20 minutes'
ORDER BY COALESCE(row_updated_timestamp, row_created_timestamp) DESC
LIMIT 1;
```

### Plaid (verificacao bancaria)
```sql
-- Usuarios Plaid
SELECT * FROM uown_plaid_user WHERE lead_pk IN (:leadPk) ORDER BY pk DESC;

-- Relatorios Plaid
SELECT
    upr.lead_pk,
    upr.cash_score,
    upr.partner_insights,
    upr.*
FROM uown_plaid_report upr
WHERE upr.lead_pk IN (:leadPk)
ORDER BY upr.pk DESC;
```

### Fraud verification (geral)
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

## 18. Configuracoes e Templates

### State configurations
```sql
SELECT * FROM uown_state_configurations ORDER BY pk DESC;
```

### Historico de alteracoes de state config
```sql
SELECT * FROM uown_state_configurations_log WHERE state_pk IN (:statePk) ORDER BY pk DESC;
```

### Templates de email/contrato
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

## 19. AMS - Usuarios e Permissoes

### Consultar usuario
```sql
SELECT * FROM "user" WHERE user_pk IN (:userPk);
```

### Log de usuarios
```sql
SELECT * FROM user_log ORDER BY pk DESC;
```

### Permissoes
```sql
SELECT * FROM permission WHERE name LIKE '%charge%';
```

### Roles
```sql
SELECT * FROM user_roles;
```

---

## Dicas de Uso

### Parametros comuns
- `:leadPk` - PK do lead (ex: `14399`)
- `:accountPk` - PK da conta (ex: `206871`)
- `:refMerchantCode` - Codigo do merchant (ex: `'OL90205-0079'`)
- `:startDate` / `:endDate` - Periodo (ex: `'2026-02-10 00:00:00.000'` / `'2026-02-10 23:59:59.999'`)

### Investigacao completa de um lead (passo a passo)

1. **Buscar o lead:** `SELECT * FROM uown_los_lead WHERE pk = :leadPk`
2. **Ver UW data:** `SELECT * FROM uown_los_uwdata WHERE lead_pk = :leadPk`
3. **Ver activity log:** `SELECT * FROM uown_los_activity_log WHERE lead_pk = :leadPk ORDER BY pk DESC`
4. **Ver contrato:** `SELECT * FROM uown_los_contract WHERE lead_pk = :leadPk`
5. **Ver invoice/itens:** `SELECT * FROM uown_los_invoice WHERE lead_pk = :leadPk`
6. **Se funded, ver conta:** `SELECT * FROM uown_sv_account WHERE lead_pk = :leadPk`

### Investigacao completa de uma conta (passo a passo)

1. **Buscar a conta:** `SELECT * FROM uown_sv_account WHERE pk = :accountPk`
2. **Ver schedule summary:** `SELECT * FROM uown_sv_sched_summary WHERE account_pk = :accountPk`
3. **Ver recebiveis:** `SELECT * FROM uown_sv_receivable WHERE account_pk = :accountPk ORDER BY due_date`
4. **Ver pagamentos:** `SELECT * FROM uown_sv_payment WHERE account_pk = :accountPk ORDER BY pk DESC`
5. **Ver transacoes CC:** `SELECT * FROM uown_sv_credit_card_transaction WHERE account_pk = :accountPk ORDER BY pk DESC`
6. **Ver activity log:** `SELECT * FROM uown_sv_activity_log WHERE account_pk = :accountPk ORDER BY pk DESC`
7. **Ver alertas:** `SELECT * FROM uown_sv_alert WHERE account_pk = :accountPk`

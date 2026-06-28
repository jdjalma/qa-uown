# Application Lifecycle — Pitfalls Catalog

> **Index** of the pitfalls catalog. The content was sliced into [`pitfalls/`](pitfalls/) because the single catalog exceeded 100 KB (a single `Read` blew past the token limit and the agent skipped lines). Pitfall numbers are **global and stable** — `pitfall #N` always resolves, regardless of the slice.

> Rules, canonical sequence and checklist: [SKILL.md](../SKILL.md).

## How to append a new pitfall (rule #11/#12)

1. Use the **next global number** (current max number + 1).
2. Add the row to the **last slice** in [`pitfalls/`](pitfalls/) if it is still < ~50 KB; otherwise create the next slice `NN-pitfalls-LLL-HHH.md`.
3. Add a line to this index (number + symptom + file).

## Pitfalls index

| # | Symptom | Slice |
|---|---------|-------|
| 1 | Expected APPROVED but got: DENIED with no clear reason | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 2 | submitApplication HTTP 500 "Merchant program is required to determine fee" | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 3 | UnexpectedRollbackException on submitApplication (HTTP 200 with error in the body) | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 4 | Invalid merchantId. Received XYZ HTTP 400 on sendApplication | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 5 | Kornerstone merchant rejects with HTTP 400 on sendApplication | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 6 | settleApplication HTTP 500 | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 7 | makeCreditCardPayments hangs 5 min and times out | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 8 | sendInvoice HTTP 500 UnexpectedRollbackException for eligible_terms='16' | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 9 | uown_sv_payment with nonexistent status=PAID - email sweep fails silently | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 10 | sendApplication random HTTP 400 / 500 OR flow fails at an improbable step (submit, sign, fund) after week… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 11 | makeCreditCardPayments HTTP 500 DataIntegrityViolationException: constraint [fk_uown_cc_transaction_arrange… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 12 | uown_merchant_activity_log query fails or returns 0 rows - program change log not found | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 13 | ProgramActivationDeactivationSweep not found via getScheduledTaskByName | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 14 | createOrUpdateProgram creates a program but the merchant does not see it in applications | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 15 | is_active on the program looks correct but the application uses an "inactive" program or vice versa | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 16 | SQL query on activation_date/deactivation_date returns a JS Date object instead of a string, causing the compari… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 17 | UI returns the activation_date/deactivation_date in ISO format (YYYY-MM-DD) in some contexts and MM/D… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 18 | getEmailTemplateName / getMerchantChargeProcessingFee / any db.* fails with password authentication fai… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 19 | Template identity assertion fails or gives a false positive - body marker correct in repo but result diver… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 20 | sorErrorDescription="SSN should have 9 digits. Received XXXXXXXXXX" on sendApplication - SSN with 10 digits | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 21 | getMissingFields fails with HTTP 500 "Invalid link. Please contact merchant" after setupApplicationViaApi(...… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 22 | POST /uown/los/authorizeCreditCard returns {"message": "Invalid card. Please try again", "status": 500} (2… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 23 | sendApplication returns HTTP 400 "Invalid merchantId. Received KS3015" OR getMerchantsByRefCode returns "Me… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 24 | OriginationCustomerPage.modifyLease throws TimeoutError: locator.waitFor: Timeout 5000ms exceeded - invoice… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 25 | MissingDataFormPage.fillBankAccount throws strict mode violation: getByText('CHECKING', { exact: true }) res… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 26 | CSS-module hash selector (e.g. .missing-data-panel_missingDataPanel__feeAmount__cn7Wg) returns null after reb… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 27 | When turning on the email queue / sweeps in a non-prod environment, mass sends of old emails are fired (~19k… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 28 | sendInvoice with orderType:'1' (modify invoice / LEASE_MOD path) returns HTTP 400 sorErrorDescription:"Cost… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 29 | sendInvoice with orderType:'1' returns 200 OK but **does not create a LEASE_MOD** - log shows "Invoice decrease. Set… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 30 | addActivityLog / addLogNote returns HTTP 400 InvalidFormatException: Cannot deserialize value of type 'LogT… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 31 | LosExternalMerchantController.searchApplicationStatus (POST /uown/los/merchant/applications/search) returns… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 32 | AspectInboundApiLog in uown_sv_inbound_api_log.header stores header names in **lowercase** (x-run-id=.… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 33 | AspectInboundApiLog.setApiLogInfo extracts source_uuid via StringUtils.substringBetween(body.toLowerCase, "uu… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 34 | Filters WHERE row_created_timestamp >= runStart.toISOString in uown_sv_inbound_api_log return 0 rows in q… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 35 | Error-path scenarios on endpoints covered by the AOP AspectInboundApiLog produce sometimes 1, sometimes 2 rows in uown… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 36 | Open-redirect test uses framenavigated + regex on a substring and gives a false positive | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 37 | await page.goto(url) throws net::ERR_HTTP_RESPONSE_CODE_FAILURE when the server returns 4xx/5xx | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 38 | StickyRecoverSweep fires without error but does NOT create a uown_sticky session for a cct morphed by the fast-path helper | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 39 | POST /uown/los/submitApplication returns HTTP 500 with body "UnexpectedRollbackException: Transaction silent… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 40 | CreditCardHistoryPage.getStickyRecoveryStatus(cctPk) returns - even with the uown_sticky row populated | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 41 | uown_sv_sql_config.sql_name is case-sensitive UPPERCASE - WHERE sql_name='getSettlementAmount' returns 0 rows | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 42 | Days Past Due (panel) != Days Delinquent (breakdown) | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 43 | Settlement/EPO Breakdown modal opens EMPTY when the value is $0.00 | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 44 | TCA in the panel vs TCA in the breakdown diverge when there are active fees (late fee, NSF) | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 45 | Artificial aging via UPDATE requires a mandatory try/finally restore | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 46 | Backend calls getSettlementAmount 2x in ServicingInformationService | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 47 | Any selector that depends on a CSS-Module class, accessible name via sibling text, or input[type="checkbox… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 48 | VerifyCustomerInformationModal backdrop intercepts clicks on /customer-information/{pk} | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 49 | Servicing modals use a custom wrapper, NOT Bootstrap .modal-body/.modal-header | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 50 | A selector validated live via MCP does not guarantee a runtime pass | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 51 | /{shortCode}/complete renders the "Choose Payment Program" screen BEFORE the CC form | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 52 | moveDueDatesByDays returns HTTP 400 for a WEEKLY lease when moveNumberOfDays > 3 | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 53 | driveLeadToFunding / createPreQualifiedApplication creates WEEKLY leads by default | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 54 | /uown/los/* endpoints require the BFF session cookie (merchant.sid set after login) | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 55 | uown_los_lead_personal_info does NOT exist in qa1 | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 56 | SVC search only returns leads with account_pk IS NOT NULL | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 57 | A hard-coded PK fixture is fragile in qa1 - drift from reseed | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 58 | An MR that fixes a field in specialized SQLs must audit ALL the sibling SQLs | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 59 | An expression index with UPPER(col) is only used if WHERE also applies UPPER to the column | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 60 | POST /uown/los/simpleSearch/{term} accepts a missing body with 200 OK | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 61 | task-testing project storageState/baseURL mismatch | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 62 | termnull smell in uown_los_lead_notes indicates a lead with main_next_pay_date = NULL | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 63 | sendApplication returns HTTP 400 "mainNextPayDate is required" when the field is omitted | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 64 | OriginationCustomerPage.settleLeaseViaDocuments throws "Unable to locate a lease document" | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 65 | **[SUPERSEDED by #66]** 60s activity-log polling insufficient in qa1 under load | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 66 | Silent DB timestamp drift - WHERE col >= $1::timestamp with ISO UTC coming from JS excludes just-written rows | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 67 | button:has-text('Sign') collides with "Change to Signed" - strict mode violation | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 68 | **[SUPERSEDED by #69]** Origination SPA ensureAuthenticated race | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 69 | Origination SPA full-suite auth-retry: auth.setup storageState contains a JWT with TTL ~15 min in qa1; tests… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 70 | The canonical consumer apply flow entry path is /getApplication/{code}, NOT apply-{env}/{code}/start directly | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 71 | **[RETRACTED 2026-05-24]** ~~Two distinct wizards served at the same path~~ | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 72 | Backend validates nextPayDate <= 10 days in the future; returns a structured HTTP 400 | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 73 | Kornerstone consumer wizard page 2 requires bank routing + account + CC BIN (required) | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 74 | Origination SPA: page.goto(originationBase) with a valid storageState still redirects to the login screen | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 75 | Auth tests in Origination: POST without merchant.sid returns HTTP 404, NOT 401 | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 76 | SPA localStorage caching: deleting the session cookie does NOT clear overviewStore; dashboard shows stale data | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 77 | Payment Refund/Reverse in Servicing is NOT on /payment-transaction | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 78 | reverseReason in the refund modal is a React Select (<div>), NOT a native <select> - selectOption fails | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 79 | ACH Make Payment assert (Servicing #makePayment modal) times out at 60s despite a success toast | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 80 | Overpayment test on the Make Payment modal fails to assert rejection | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 81 | Custom helper/function calls submitApplication without getMissingFields first -> submitApplication fails sil… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 82 | Code/JSDoc assumes the Make Payment modal's Arrangement Type is backend-derived from the amount (no UI field) | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 83 | ACH arrangement stuck in payment_arrangement_status='IN_PROGRESS' after SendACHPaymentsSweep in an env without proc… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 84 | ACH arrangement listener does not update the arrangement in intermediate states - arrangement remains NOT_ST… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 85 | #startDate / #endDate date pickers of the Make Payment Arrangement modal (Servicing) IGNORE pressSequentially… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 86 | CC multi-installment arrangement does not reach SUCCESS - arrangement stays IN_PROGRESS even after simulateCcSwe… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 87 | uown_sweep_logs.number_of_records_processed read right after the trigger returns 0 even when the sweep processes… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 88 | Eligibility query for settledInFullAccountEmailSweep finds accounts the sweep does NOT process (e.g. ac… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 89 | FirstPaymentReminderSweep skips the account even though uown_sv_sched_summary.first_payment_due_date is within… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 90 | Consecutive manual triggers of settledInFullAccountEmailSweep return processed=0 for an already-eligible account | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 91 | Website (customer portal) OTP flaky / picks up the wrong code: getVerificationCode returns the OTP from a previous run an… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 92 | Clicking a Website (customer portal) sidebar item gives TimeoutError / pointer event intercepted right aft… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 93 | Query on uown_sticky filtering/reading the retry_attempt column returns column "retry_attempt" does not exist | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 94 | Query on uown_scheduled_task filtering the name column returns 0 rows or column "name" does not exist; last_tri… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 95 | Query on uown_sweep_logs using the columns task_name / processed / created_timestamp returns column does not e… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 96 | E-sign spec/query asserting status='SENT' on uown_esign_document never matches | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 97 | POST /ConfigurationManagement/createOrUpdateConfig + forceReloadConfig does NOT change the behavior of keys… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 98 | SearchPage.searchAndSelectFirst (Origination navbar quick search) does NOT navigate when invoked from… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 99 | Sidebar navigation steps on the Website (customer portal) **pass silently** even when the SPA is… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 100 | **sendApplication returns BLACKLIST_DENIED even with approvable SSN/email when the fixture's static address ha… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 101 | **Customer summary action button (Origination) renders OFF-SCREEN to the right and click({force:true}) does NOT… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 102 | **useNeuroIdCheck=true (the flag under test) is SILENTLY reset to false by the merchant preflight → Neu… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 103 | **uown_sv_outbound_api_log does NOT correlate NeuroID calls by lead_pk for pre-funding leads** — account… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 104 | Config Columns panel on the /merchant (Origination) page is not found: the configColumnsPanel selector ([rol… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 105 | label:has-text('UW Pipeline') input[type='checkbox'] does not find the column checkbox in the Config Columns of… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 106 | Test code waits for an Apply/Save button after toggling a column in the Config Columns of /merchant — the wait… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 107 | Active filter on /merchant (Origination): there is no way to select "All" via the dropdown, and changing the option does not re… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 108 | **/merchantSetting (Origination): selectMerchantRowByText('OL90202-0001') gives TimeoutError ... .rdt_TableRow… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 109 | **SSN ending in 9 (generateTestSSN(false)) is APPROVED (UW_APPROVED) in qa2 for terraceFinance, when… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 110 | **EPO 5% / EPO 10% triple-checkbox on /merchantSetting (GDS Data): #epo5-false/#epo10-false resolve in the DOM… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 111 | **Last sub-test of test.describe.serial fails with "context" and "page" fixtures are not supported in "aft… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 112 | **Merchant Settings Snapshot: where the snapshot comes from and which table/column/audit-trail — assuming wrong ma… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 113 | **qa2 DB tunnel transient blocker: test fail-fast on the FIRST DB read (assertMerchantContract) without being dri… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 114 | **Reusing a redirectUrl (signing/contract link) captured from a previous sendInvoice opens "Invalid link. Pl… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 115 | **Overview has TWO filter forms with identical date inputs; a positional selector (nth()) hits the wrong fo… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 116 | **Overview: a "future-only" date window in the table panel does NOT empty the table** (empty-set lever not relia… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 117 | **Overview: the table-filter panel re-collapses right after the toggle click (1 click is not enough).** **Sympt… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 118 | **Clicking "Download CSV" opens the EMAIL modal (clicks the wrong button).** **Symptom:** the direct download te… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 123 | **Overview TABLE-panel #fromDate/#toDate ignore fill() — Formik does not update, and the 48 MiB guard has thre… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 124 | **GDS-snapshot fields npm_segment/tam_score (uown_los_uwdata/uown_sv_uwdata) read as NULL → false bug.**… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 126 | **Protection Plan / Buddy notes live in uown_los_activity_log, NOT in uown_los_lead_notes.** **Symptom:… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 127 | **Buddy enrollment only FINALIZES at e-signature; opt-in on the Terms creates only a PENDING row.** **Symptom:… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 128 | **Cross-coverage (already-covered customer) shows a DIFFERENT Buddy widget, WITHOUT radios.** **Symptom:** acceptAn… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 129 | **DB/API-only specs in docs/taskTestingUown/ have no browserless Playwright project.** **Symptom:** a spe… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 130 | **Sandbox DB tunnel: port 5445 is reused across envs (qa1/qa2/dev3/sandbox).** **Symptom:** queries hit… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 131 | **pg returns bigint/pk columns as a JS string.** **Symptom:** numeric matchers (toBeGreaterThan(0)) fail… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 132 | **[FutureFpdCheckStep] A customer (SSN) with an already-SIGNED lead + a future first-payment-date is DENIED on… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 133 | **CANCELLED_DUP_SSN: creating a new app with an SSN that already has an ACTIVE lease CANCELS the predecessor lease.** **… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 134 | **Address blacklist: uown_los_black_list matches by street_address1 + zip_code — a "proven-goo… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 135 | **pdf-parse breaks thousands: a rendered total "1,693.41" comes out as "169 3.41" (comma became an inte… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 136 | **MERCHANT_PREFLIGHT_SKIP=true global in .env (left by a parallel session) makes a fresh-application test… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 137 | **stg: an Origination UI test blows up on an agent-portal selector (e.g. input[placeholder='Search table']… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 138 | **RightFoot gates delinquent ACH creation: only creates with balance_check SUCCESS + routing/account match + exposure+amount+$100<=balance (R1.53.0).**… | [03-pitfalls-138-141.md](pitfalls/03-pitfalls-138-141.md) |
| 139 | **Sticky resolves the original transaction time as America/New_York despite the commit saying "UTC".**… | [03-pitfalls-138-141.md](pitfalls/03-pitfalls-138-141.md) |
| 140 | **Guard "prevent repeated NeuroID calls" NOT merged in R1.53.0 — do not assume the skip.**… | [03-pitfalls-138-141.md](pitfalls/03-pitfalls-138-141.md) |
| 141 | **Customer Journey: JourneyStatus.ABANDONED + several fields never set in code (R1.53.0) — asserting = false-fail.**… | [03-pitfalls-138-141.md](pitfalls/03-pitfalls-138-141.md) |
| 142 | **SeonWidgetComponent.closeSeonWidget() (real X via frameLocator) does NOT dismiss the widget in sandbox** — reproduced 2x; cancel UX non-trivial; no cancel note in lead_notes; OBSERVATION S3/P2 (confirm with dev/PO). | [03-pitfalls-138-141.md](pitfalls/03-pitfalls-138-141.md) |
| 143 | **pre-write-validate.sh Rule 1 blocks legitimate standalone components (*.component.ts / *.controls.ts) in src/pages/**  — the hook requires `extends` on every `export class`; workaround: `class X {}; export { X }` (no export keyword in the declaration).** | [03-pitfalls-138-141.md](pitfalls/03-pitfalls-138-141.md) |
| 144 | **`input#proratedDate` uses React Day Picker (RDP) — pressSequentially + any blur does NOT trigger onChange; result field stays `-`.** Fix: click the input, navigate the calendar with prev/next buttons, click `button.rdp-day span`. Confirmed via MCP 2026-06-26 (account 17306). | [03-pitfalls-138-141.md](pitfalls/03-pitfalls-138-141.md) |
| 145 | **`authorizeCreditCard` returns `{ "error": "Credit Card is invalid.", "preAuthStatus": "NOT_RUN" }` with a valid card — Kount is never called.** Root cause: `ccLastNameMatchService.checkCCLastNameMatch` blocks before Kount if `ccLastName` ≠ lead `last_name`. Most common test cause: `buildTestData({ realistic: true })` generates a random lastName per call; CC body built with a different lastName silently mismatches. Fix: `realistic: false` (deterministic "TestLNufl") or capture `applicant.lastName` from `sendApplication` and reuse it. | [03-pitfalls-138-141.md](pitfalls/03-pitfalls-138-141.md) |


---

## Cross-cutting observations - compliance candidates (require separate tickets)

| # | Observation | Source | Status |
|---|-----------|--------|--------|
| F-OOS-1 | **`POST /uown/sendApplicationToCustomer` returns HTTP 500 for an invalid `refMerchantCode` - should be 4xx.** Pollutes monitoring/Sentry with 500s that are semantically "not found" or "bad request". | 2026-05-20 | AWAITING TRIAGE (Yuri). |
| F-OOS-2 | **AMS Merchants page - Active filter: checkbox without `aria-label`.** WCAG 1.3.1 and 4.1.2. | 2026-05-22 | `[OBSERVATION]` - do NOT create a GitLab issue without authorization. |
| OBS-01 | **Audit log persists raw POST body (PII).** `AspectInboundApiLog.setApiLogInfo:177` writes the body without redaction. Bodies include SSN, DOB, banking. | `AspectInboundApiLog.java:177` | PRE-EXISTING. Separate compliance ticket. |
| OBS-02 | **Audit log persists Authorization header.** All headers are written including Bearer tokens. | `AspectInboundApiLog.java:186-193` | PRE-EXISTING. Separate compliance ticket. |
| SW-OBS-QA1-001 | **`refreshTrustPilotAccessKeySweep` writes the TrustPilot Bearer access token in plaintext to the `error` field of `uown_sweep_logs`** (~15 days of history retained). Token exposed to any SELECT on the table. PRODUCT SECURITY finding (not a test-framework pitfall) - escalate to the dev manually. | exploratory-testing-qa1-master SW-OBS-QA1-001, qa1, 2026-06-10 | `[OBSERVATION]` of product security - ESCALATE TO THE DEV. Do NOT create a GitLab issue without authorization. |
| OBS-01-1321 | **Leads CSV (`/leads`, `leads-results.csv`): the 17th column "Created from" (`createdFrom`) exports with a BLANK HEADER** (the react-csv entry for this column has no `label`). The 16 previous columns carry a header; only `createdFrom` comes out without a label in the file. | DOM/CSV-proven qa2 2026-06-18 (#1321). | `[OBSERVATION]` product-side, **PRE-EXISTING** (not introduced by #1321). Not a test bug — flag for a separate ticket. Do NOT create a GitLab issue without the user's authorization. |
| OBS-WS-DOCS-LOGOUT | **Website (customer portal): opening the Documents page FORCES the customer to log out.** The `/documents` route calls `GET /uown/svc/getFilesForAccount?accountPk=N` sending a VALID and FRESH `usertoken` JWT (iat seconds before, not expired); the backend responds **HTTP 403 `{"unauthorized":true}`** only on that endpoint (all the others — getAccountInfo, getAccountSummary, getCreditCards — return 200 with the same token). The front-end interprets the 403 as an invalid session, calls `GET /logout`, clears `accountStore.userToken`/`accountPk` and redirects to `/` (login screen). **Deterministic:** reproduced 4x across 2 independent sessions (via sidebar click AND via direct `page.goto('/documents')`); independent of the path to Documents. Suspicious header on the failing call: `username: null`. Customer-facing: any customer who opens Documents on that account is kicked out. | DOM-first + network live sandbox 2026-06-12, account 17249 (lead 97464, ACTIVE). Fresh token (49s, exp 3551s remaining) → instant 403, NOT expiry. | `[CONFIRMED]` PRODUCT BUG (backend authz of `getFilesForAccount` rejects a valid token + FE does force-logout on any 403). Severity S2 (broken customer-facing workflow + force-logout). Do NOT create a GitLab issue without the user's authorization — awaiting approval to open the ticket. Do NOT mask in the test with mid-flow re-login or with a timeout. Probable cause: authorization check of the `getFilesForAccount` endpoint (possible link to `username: null` in the header) + FE logout-on-403 without graceful degradation. |
| OBS-PP-OPTOUT | **Protection Plan opt-OUT logged as "Error initiating protection plan"** in `uown_los_activity_log` — consistent across EVERY opt-out lead env-wide (16033-16040, 16802). A deliberate decline recorded as an error (wording); the structured row is correct (`opt_in=false, status=COMPLETED`). | `[db-observation:uown_los_activity_log, qa2, 2026-06-21]` | `[OBSERVATION]` candidate product bug (wording). Do NOT create a GitLab issue without the user's authorization. |
| OBS-PP-ALREADYCOVERED | **`already_covered`/`covered_by_*` (`uown_los_protection_plan`) NEVER persisted** — 0 rows with `already_covered=true` env-wide, despite the UI detecting cross-coverage ("already enrolled"). The structured linkage to the seed (assumption BR §23) is unverified; the real anti-double-charge guarantee is that the target does not mint a new policy (`policy_id=null`). | `[db-observation:uown_los_protection_plan, env-wide, qa2, 2026-06-21]` | `[OBSERVATION]` candidate product gap. Do NOT create a GitLab issue without the user's authorization. |

> **Important**: observations OBS-01/OBS-02 are inherited, NOT introduced by WI-525. Treat as security tech-debt.

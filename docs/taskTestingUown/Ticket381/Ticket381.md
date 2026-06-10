------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/381



UOWN | Servicing | Update KOUNT API
Aberto
  Tíquete criado 3 semanas atrás por Yuri Araujo
A hotfix for August 7th
Get started by reviewing the Payments Fraud API Integration Guide, the API comparison article, and additional API documentation in the Kount Developer Portal.

Watch for the Kount 360 platform invitation email (from sender: noreply@mfa.kount.com) to access the sandbox environment for integration testing.

Discontinue making rule and list changes in the legacy Kount Command platform as of July 25, 2025

Watch for a second Kount 360 platform invitation email beginning July 28, 2025 (from sender: noreply@mfa.kount.com) and then activate your account in the production environment.

Review how your legacy rules mapped to Kount 360 (see Policy Management and check this article for how to adjust them).

Publish your policy changes in Kount 360.

Implement the new API integration to connect to the Kount 360 platform between July 28 - August 8, 2025.

Notes: Rule and list changes entered in Kount Command between July 25 - August 8, 2025 will need to be manually updated in Kount 360

Please see Kount Support for a library of user guides and videos.
Editado 3 semanas atrás por Yuri Araujo

Itens secundários
0

Nenhum item filho está atribuído no momento. Use itens filhos para dividir o trabalho em partes menores.
Itens vinculados
0
Vincule itens para mostrar que eles estão relacionados ou que um está bloqueando outros.
Desenvolvimento
8
[uown/backend/svc#381] Fix - Instantiate JsonUtils directly instead of injecting it
!1093
Mesclado
Fernando Martins
[uown/backend/svc#381] Customer Portal - Kount SDK installed, Script removed
website
!234
Mesclado
Fernando Martins
[uown/backend/svc#381] Servicing - Kount SDK installed, Script removed
servicing
!610
Mesclado
Fernando Martins
[uown/backend/svc#381] Origination - Kount SDK installed, Script removed
origination
!1233
Mesclado
Fernando Martins
[uown/backend/svc#381] Service adapted from RIS to Orders API
!1085
Mesclado
Fernando Martins
[uown/backend/svc#381] Kount Refactored - From key value to json
ccverification
!12
Mesclado
Fernando Martins
[uown/backend/svc#381] Fix Kount Token Primary Key Issue
!1094
Fernando Martins
Draft: [uown/backend/svc#381] Update kount api key config
configuration
!26
Fernando Martins
Atividade
Yuri Araujo set status to To do 3 semanas atrás
Yuri Araujo added uown#8 as parent epic 3 semanas atrás
Yuri Araujo changed milestone to %Uown | RU07.25.1.43.0 3 semanas atrás
Yuri Araujo added 
dev
backend
 
priority
high
 labels 3 semanas atrás
Yuri Araujo assigned to @davimarrauownleasing 3 semanas atrás
Yuri Araujo changed the description 3 semanas atrás · 
Yuri Araujo changed title from UOWN | Servicig | Update KOUNT API to UOWN | Servicing | Update KOUNT API 3 semanas atrás
Yuri Araujo assigned to @fernandogmartins and unassigned @davimarrauownleasing 3 semanas atrás
Fernando Martins added 
workflow
development-in-process
 label 2 semanas atrás
Yuri Araujo changed milestone to %Uown | RU07.25.1.42.1 2 semanas atrás
Fernando Martins mentioned in merge request ccverification!12 (merged) 2 semanas atrás
Fernando Martins mentioned in merge request !1085 (merged) 2 semanas atrás
Fernando Martins mentioned in merge request uown/frontend/origination!1233 (merged) 1 semana atrás
Fernando Martins
Fernando Martins
@fernandogmartins
6 dias atrás
Maintainer
Testing Steps
Possible flows
The complete application page in origination, when adding a new credit card;
Adding a new credit card in servicing;
Adding a new credit card in the customer portal.
In the console log verify you can see:

image

This means the kount SDK on frontend is initialized.

Conditions Necessary for Kount to Run
The configuration authenticate.creation in CCTransactionService must be set to true.
A valid access token must be obtained from the KountTokenManagerService. If the token request fails, the service throws an exception, and Kount will not be run.
Early Returns in preAuthorize: Cases Where Kount Is Not Run

1. Kount Skipped Due to Existing Decision
Preconditions:
A valid Kount decision already exists in the DB within the configured decision age window (previous.kount.decision.age, default: 7 days).
Decision is non-null.
Test Setup:
In the complete application page, add a credit card with the same first name, last name, expiration, and cc number as an existing Kount record in the DB.
Expected Grafana Log: [KountService][preAuthorize] Skipping runKount due to existing decision
Expected Activity Log: Kount not run due to existing decision: . Pre-Authorization status:

2. Kount Not Run: SESSION_UNAVAILABLE
Preconditions:
ccInfo.getPreAuthStatus() is equal to PreAuthStatus.SESSION_UNAVAILABLE
Expected Grafana Log: [KountService][preAuthorize] No session id available, not running Kount
Expected Activity Log: Kount not run, no session id available. Pre-Authorization status: SESSION_UNAVAILABLE

3. Kount Not Run: NO_IP_ADDRESS
Preconditions:
ThreadAttributes.getIpAddress() returns "NO_IP_ADDRESS"
Expected Grafana Log: [KountService][preAuthorize] No ip address available, not running Kount
Expected Activity Log: Kount not run, no ip address found. Pre-Authorization status: NOT_RUN

4. Kount Not Run: Token Acquisition Failure
Preconditions:
The token request in KountTokenManagerService fails due to an exception or bad response from the Kount token endpoint.
Relevant Logic:
The token is requested via HTTP POST to the configured token URL using client_credentials grant.
If the request fails or the response is invalid, a runtime exception is thrown, and preAuthorize will fail before calling runKount.
Expected Grafana Log: [KountTokenManagerService][requestToken] Token request failed
[KountService][preAuthorize] (not logged explicitly, but method will fail before calling runKount)

Results After Running Kount
Once all conditions are met, KountClient.runKount is invoked. This is the method that actually performs the outbound request to Kount and returns a KountResponse. It logs both the request and the response.
KountClient.runKount Logs
When request is sent:
[runKount] Sending Kount Request: { ... }
If the response is null:
[runKount] Kount response is null
On successful response:
[runKount] Received Kount response: { ... }
On failure (e.g., HTTP error or exception):
[runKount] Kount call failed before parsing. Exception message: <message>
[runKount] Error during Kount call
This ensures traceability of outbound calls and responses in Grafana.

Response Scenarios in KountService
After calling runKount, KountService processes the KountResponse in updateKountInfoFromResponse. These are the possible outcomes:

1. Error During Kount Call
Condition:
response.isSuccessful = false
Expected Grafana Log: [KountService][updateKountInfoFromResponse] Error running Kount
PreAuth Status: PreAuthStatus.ERROR

2. Null order Field in Response
Condition:
response.getOrder() is null
Expected Grafana Log: [KountService][updateKountInfoFromResponse] Order is null in Kount response
PreAuth Status: PreAuthStatus.ERROR

3. Null decision Field in Risk Inquiry
Condition:
response.getOrder().getRiskInquiry().getDecision() is null
Expected Grafana Log: [KountService][updateKountInfoFromResponse] Decision is null in Kount response
PreAuth Status: PreAuthStatus.ERROR

4. Decision = APPROVE
Expected Grafana Log: [KountService][updateKountInfoFromResponse] Kount approved transaction
PreAuth Status: PreAuthStatus.SUCCESS
Activity Log: Kount run. Pre-Authorization status: SUCCESS

5. Decision ≠ APPROVE (e.g., DECLINE, REVIEW)
Expected Grafana Log: [KountService][updateKountInfoFromResponse] Kount denied transaction
PreAuth Status: PreAuthStatus.DENIED
vity Log: Kount run. Pre-Authorization status: DENIED

Database Parsing Check
Check if the following columns in uown_kount were populated:
kount_result (decision)
request_params
response_params
session_id
transaction_id
omni_score
Check if the access token and expiration date is correctly set in the uown_kount_token table

If there is a record present in the table (and the created date is not null) it should update the existing row instead of creating a new one.

Editado 7 horas atrás por Fernando Martins
Fernando Martins mentioned in merge request uown/frontend/servicing!610 (merged) 5 dias atrás
Fernando Martins added 
dev
full-stack
 label and removed 
dev
backend
 label 5 dias atrás
Fernando Martins mentioned in merge request uown/frontend/website!234 (merged) 5 dias atrás
Fernando Martins added 
workflow
code-review-pending
 label and removed 
workflow
development-in-process
 label 5 dias atrás
Fernando Martins mentioned in merge request uown/devops/configuration!26 5 dias atrás
Priyanka Namburu mentioned in commit ccverification@20d8b771 5 dias atrás
Priyanka Namburu mentioned in commit uown/frontend/origination@452355be 4 dias atrás
Priyanka Namburu mentioned in commit uown/frontend/servicing@fdc94df5 4 dias atrás
Priyanka Namburu mentioned in commit uown/frontend/website@29f8ab74 4 dias atrás
Sowjanya Kaligineedi mentioned in commit 06b6bbd7 4 dias atrás
Fernando Martins added 
workflow
code-review-done
 label and removed 
workflow
code-review-pending
 label 4 dias atrás
Fernando Martins mentioned in merge request !1093 (merged) 4 dias atrás
Sowjanya Kaligineedi mentioned in commit a5ee2651 4 dias atrás
Fernando Martins added 
workflow
ready-for-qa
 label and removed 
workflow
code-review-done
 label 4 dias atrás
Fernando Martins added 
workflow
development-in-process
 label and removed 
workflow
ready-for-qa
 label 3 dias atrás
Fernando Martins mentioned in merge request !1094 3 dias atrás
Fernando Martins added 
workflow
code-review-pending
 label and removed 
workflow
development-in-process
 label 3 dias atrás
Fernando Martins added 
workflow
development-in-process
 label and removed 
workflow
code-review-pending
 label 7 horas atrás
Fernando Martins added 
workflow
code-review-pending
 label and removed 
workflow
development-in-process
 label 6 horas atrás

------------------------------------------------------------------------------------------------------------------------------------------------------------------

 R7.1.25.43.0_UpdateKountApi_Ticket381

------------------------------------------------------------------------------------------------------------------------------------------------------------------

R7.1.25.43.0_UpdateKountApi_PreAuthorizeWithTokenPersistenceAndExpirationValidation_Ticket381

> ## Tests in qa1
> ```gherkin
> 
> ### Scenario: PreAuthorize with token persistence and expiration validation
> When Add new valid CC
> Then I verify Kount SDK initialized within 30 seconds
> And I verify Kount device data collected within 30 seconds  
> And I capture Kount session id from last API response within 30 seconds
> And I wait for DB record in "uown_kount" where "session_id = ?" using Kount session id within 60 seconds
> And I assert Kount table "uown_kount" has non-null columns "kount_result,request_params,response_params,session_id,transaction_id,omni_score" for session id within 60 seconds
> And I assert Kount preAuthStatus equals "SUCCESS" for session id within 60 seconds
> And I assert Kount decision equals "APPROVE" for session id within 60 seconds
> Then I assert Kount token exists for env client and is not expired within 60 seconds
> Then I assert Kount token row updated for env client where "updated_at" newer than "created_at" within 60 seconds
> | PASS | LeadPk: 9710 | AccountPk: 4064 | Merchant: Progress Mobility | 
> ```
>
>
[R7.1.25.43.0_UpdateKountApi_Ticket381_QA1_2025_08_12_1017_03823.html](/uploads/643539f93503c5e913a4254a4660194e/R7.1.25.43.0_UpdateKountApi_Ticket381_QA1_2025_08_12_1017_03823.html)
>
>
![image](/uploads/188a7e588672e9690acbd7d457a21ffa/image.png)
>

-----

R7.1.25.43.0_UpdateKountApi_SkipPreAuthorizeWhenExistingDecisionPresent_Ticket381

> ## Tests in qa1
> ```gherkin
>
> ### Scenario: Skip preAuthorize when existing decision present
> When Add new valid CC
> Then I verify Kount SDK initialized within 30 seconds
> And I verify Kount device data collected within 30 seconds
> And I capture Kount session id from last API response within 30 seconds
> When Add new valid CC
> Then I assert Kount record count equals 1 for session id within 30 seconds
> And I assert Kount table "uown_kount" has non-null columns "kount_result,omni_score" for session id within 30 seconds
> And I insert mock Kount record for current session with decision "APPROVE" and omni score 70
> And I assert Kount decision equals "APPROVE" for session id within 30 seconds
> | PASS | LeadPk: 9716 | AccountPk: 4070 | Merchant: Progress Mobility | 
> ```
>
>
[R7.1.25.43.0_UpdateKountApi_SkipPreAuthorizeWhenExistingDecisionPresent_Ticket381_QA1_2025_08_12_1309_09390.html](/uploads/46f8d1cbd9d9aaa7d63f11a426180fde/R7.1.25.43.0_UpdateKountApi_SkipPreAuthorizeWhenExistingDecisionPresent_Ticket381_QA1_2025_08_12_1309_09390.html)
>
>
![image](/uploads/74ca6ca41ca5af6e91c93602741dc829/image.png)
>

-----

R7.1.25.43.0_UpdateKountApi_KountTokenLifecycleInsertUpdateValidationWithBaselineTracking_Ticket381

> ## Tests in qa1
> ```gherkin
>
> ### Scenario: Kount Token Lifecycle - Insert, Update, and Validation with Baseline Tracking
> When A mock Kount token valid for 90 minutes is inserted
> And Kount token exists for env client and is not expired within 30 seconds
> Then Baseline of latest Kount token timestamp and value is captured
> And Latest Kount token row is updated to refresh access token
> And Kount token row updated for env client where "updated_at" newer than "created_at" within 30 seconds
> And Latest Kount token is newer than baseline and access_token changed within 30 seconds
> | PASS | 
> ```
>
>

>
>

------------------------------------------------------------------------------------------------------------------------------------------------------------------

R7.1.25.43.0_UpdateKountApi_KountTokenLifecycleInsertUpdateValidationWithBaselineTracking_Ticket381

> ## Tests in stg
> ```gherkin
>
> ### Scenario: Kount Token Lifecycle - Insert, Update, and Validation with Baseline Tracking
> When A mock Kount token valid for 20 minutes is inserted
> And Kount token exists for env client and is not expired within 30 seconds
> Then Baseline of latest Kount token timestamp and value is captured
> And Latest Kount token row is updated to refresh access token
> And Kount token row updated for env client where "updated_at" newer than "created_at" within 30 seconds
> And Latest Kount token is newer than baseline and access_token changed within 30 seconds
> | PASS | 
> ```
>
>

>
>

-----

R7.1.25.43.0_UpdateKountApi_PreAuthorizeWithTokenPersistenceAndExpirationValidation_Ticket381

> ## Tests in stg
> ```gherkin
> 
> ### Scenario: PreAuthorize with token persistence and expiration validation
> When Add new valid CC
> Then I verify Kount SDK initialized within 30 seconds
> And I verify Kount device data collected within 30 seconds  
> And I capture Kount session id from last API response within 30 seconds
> And I wait for DB record in "uown_kount" where "session_id = ?" using Kount session id within 60 seconds
> And I assert Kount table "uown_kount" has non-null columns "kount_result,request_params,response_params,session_id,transaction_id,omni_score" for session id within 60 seconds
> And I assert Kount preAuthStatus equals "SUCCESS" for session id within 60 seconds
> And I assert Kount decision equals "APPROVE" for session id within 60 seconds
> Then I assert Kount token exists for env client and is not expired within 60 seconds
> Then I assert Kount token row updated for env client where "updated_at" newer than "created_at" within 60 seconds
> | PASS |
> ```
>
>

>
>




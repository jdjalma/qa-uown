----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/qa/fintech-playwright/-/issues/48

UOWN | Automation | Automated Test for TireAgent API Flow Integration
Aberto
  Tíquete criado 16 horas atrás por Yuri Araujo
Synopsis
This automated test aims to validate the complete integration flow with the TireAgent API, ensuring that all steps from user input through contract signature, execute successfully and data is correctly reflected in Origination (Leads page).

The test covers user interactions from personal data input to payment setup, contract signature, and confirmation, verifying the end-to-end stability and consistency of the TireAgent partner flow.

Objective
Validate that the TireAgent API flow functions correctly and that user actions throughout the journey trigger the expected backend processes and UI responses, ending with a successful record in Origination → Leads.

Gherkin Scenario: TireAgent API Flow
Feature: TireAgent API Partner Flow As an automated QA system I want to execute and validate the complete TireAgent application flow So that I can ensure the integration works correctly end-to-end

Background: Given the user has access to the TireAgent partner application

Scenario: Complete TireAgent Application Flow When the user opens the TireAgent page And fills out the Personal Info section with valid data And navigates to the Cart section and enters product details And clicks on "GET LEASE" Then a modal for mobile number input should appear

When the user enters a valid mobile number starting with "111" or "222"
And the OTP code is retrieved from the DevTools preview
And the user enters the OTP code
Then the Application Details page should be displayed

When the user provides valid details including:
  | Date of Birth | SSN | Monthly Income | Payment Frequency |
And confirms the data
Then the system should display the prequalification result

When the user is prequalified
And selects one of the available plans
And confirms to continue
Then the user is redirected to the CC/ACH payment page

When the user chooses the payment method (Credit Card or ACH)
And fills in all payment details
And confirms the payment options, values, and checkboxes
And proceeds to the contract signature page
Then the system should display the contract for signing

When the user signs the contract
Then a confirmation modal appears briefly thanking the user
And the process is completed successfully

When the user accesses Origination
And navigates to the Leads page
Then the lead corresponding to the submitted application should be present
Expected Results
All screens load correctly with expected UI elements.
OTP validation works using defined prefixes (111 / 222).
Payment and contract steps complete without interruptions or errors.
A corresponding Lead entry is created in Origination after successful completion.



----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

> ```gherkin
> Happy Path of the TireAgent flow automated and validated up to Lead creation in Origination.
> OTP and authentication via PayPair.
> application_requests → LeadUuid.
> Polling getApplicationStatus until applicationFound=true.
> sendInvoice.
> authorizeCreditCard.
> submitApplication → accountId/accountPk.
> changeLeadStatus and settleApplication.
> Success verification and presence of the Lead in Origination → Overview.
> ```
>
[R7.25.1.45.0_AutomatedTestForTireAgentAPIFlowIntegration_Ticket48_SANDBOX_2025_10_08_0802_56811.html](/uploads/1977a35308e8785b30457e30ef2c4c28/R7.25.1.45.0_AutomatedTestForTireAgentAPIFlowIntegration_Ticket48_SANDBOX_2025_10_08_0802_56811.html)
>

---

> ```gherkin
> [Next scenarios]
> Invalid OTP.
> SSN “denied” (ends with 9).
> Incorrect SSN.
> Incorrect Email.
> Incorrect Phone.
> ```



```



```Happy Path of the TireAgent flow automated and validated up to Lead creation in Origination.```
```OTP and authentication via PayPair.```
```application_requests → LeadUuid.```
```Polling getApplicationStatus until applicationFound=true.```
```sendInvoice.```
```authorizeCreditCard.```
```submitApplication → accountId/accountPk.```
```changeLeadStatus and settleApplication.```
```Success verification and presence of the Lead in Origination → Overview.```


[R7.25.1.45.0_AutomatedTestForTireAgentAPIFlowIntegration_Ticket48_SANDBOX_2025_10_08_0802_56811.html](/uploads/1977a35308e8785b30457e30ef2c4c28/R7.25.1.45.0_AutomatedTestForTireAgentAPIFlowIntegration_Ticket48_SANDBOX_2025_10_08_0802_56811.html)


---

```[Next scenarios]```
```Invalid OTP.```
```SSN “denied” (ends with 9).```
```Incorrect SSN.```
```Incorrect Email.```
```Incorrect Phone.```


----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

R7.25.1.45.0_AutomatedTestForTireAgentAPIFlowIntegration_Ticket48

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

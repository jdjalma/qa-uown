------------------------------------------------------------------------------------------------------------------------------------------------------------------

> ## Tests in sandbox
> ```gherkin
>
> ### Scenario: Lead status is set to PLAID_ABANDONED when the Plaid modal is closed
> Given a user is in the Plaid modal during the application process
> When the user closes the Plaid modal before completing the process
> Then the lead status should be updated to PLAID_ABANDONED
> | PASS | LeadPk 91247 | Merchant: Progress Mobility | 
> ```
>
>


> ## Tests in sandbox
> ```gherkin
>
> ### Scenario: Lead status is set to PLAID_SUBMITTED when the application is finalized
> Given a user is in the Plaid process during the application
> When the user completes the Plaid process and finalizes the application
> Then the lead status should be updated to PLAID_SUBMITTED
> And this status should change shortly after
> | PASS | LeadPk 91248 | Merchant: Progress Mobility | 
> ```
>
>


> ## Tests in -
> ```gherkin
> Given I am on the identity verification process for a merchant
>
> ### Scenario: Only SEON is configured and the record exists
> Given the merchant is configured to use SEON for identity verification  
> And there is a SEON record for the lead  
> And the merchant is no longer participating in the protection plan  
> When the customer performs identity verification  
> Then the SEON record should be used  
> And the system should log "Record found for SEON"  
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
> 
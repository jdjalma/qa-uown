-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1068

13665,13666,13667


Cenário: Submissão bem-sucedida de informações financeiras
Quando o usuário percorre a página completa de inscrição
E insere as informações de cartão de crédito válidas
E insere as informações de conta bancária válidas
E envia a aplicação
Então a submissão deve ser concluída com sucesso
E as informações financeiras devem ser processadas corretamente

Cenário: Submissão falha devido a cartão de crédito inválido
Quando o usuário percorre a página completa de inscrição
E insere as informações de cartão de crédito inválidas
E insere as informações de conta bancária válidas
E envia a aplicação
Então a submissão não deve ser concluída
E o sistema deve exibir uma mensagem de erro informando que o cartão de crédito é inválido
E as informações financeiras não devem ser processadas

----- 

> ## Tests in qa2
>
> ```gherkin
> Given I am on the identity verification process for a merchant
>
> Scenario: Successful submission of financial information
> When the user goes through the complete application page
> And enters valid credit card information
> And enters valid bank account information
> And submits the application
> Then the submission should be completed successfully
> And the financial information should be processed correctly
> | PASS | LeadPk: 13665 and 13666 | Merchant: Progress Mobility | 
> ```
>
>

>
> ```gherkin
> Given I am on the identity verification process for a merchant
>
> Scenario: Submission fails due to invalid credit card
> When the user goes through the complete application page
> And enters invalid credit card information
> And enters valid bank account information
> And submits the application
> Then the submission should not be completed
> And the system should display an error message indicating that the credit card is invalid
> And the financial information should not be processed
> | PASS | LeadPk: 13667 | Merchant: Progress Mobility | 
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
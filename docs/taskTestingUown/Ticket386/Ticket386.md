------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/386

UOWN | SVC | Fix NPE in MerchantLogService

Davi Artur
@davi.artur.gow
12 horas atrás
Autor
Maintainer
@jose.mendesdev

image

When updating a merchant, and the field value is null and we change to a non-null or empty value, it was throwing an exception.

A good scenario to test it, is enabling the seon id verification checkbox for the merchant that has the value as null.

Feel free to text me with you have any doubts

-----

UOWN | SVC | Corrigir NPE no MerchantLogService

Davi Artur
@davi.artur.gow
12 horas atrás
Autor
Mantenedor
@jose.mendesdev

imagem

Ao atualizar um comerciante, e o valor do campo é nulo e mudamos para um valor não nulo ou vazio, ele estava lançando uma exceção.

Um bom cenário para testá-lo é permitir o seon id verification caixa de seleção para o comerciante que tem o valor como nulo.

Sinta-se à vontade para me enviar uma mensagem se tiver alguma dúvida

------------------------------------------------------------------------------------------------------------------------------------------------------------------

> ## Tests in qa1
> ```gherkin
> Given Navigate to merchants page
>
> ### Scenario Outline: SEON null-to-true update persists with no errors in "<env>"
> When Search for merchant "<merchant>"
> Given Merchant "<merchant_code>" has SEON Id Verification as null
> And Open merchant "<merchant>" from results
> And Go to merchant Settings tab
> When I set merchant setting 'Require SEON Id Verification' to true
> And I save the merchant
> And No error toast is shown
> And Open merchant "<merchant>" from results
> Then Merchant setting 'Require SEON Id Verification' should be true
> And In database, merchant "<merchant_code>" has SEON Id Verification = true
> | PASS | Progress Mobility | 
> ```
>

[R7.1.25.43.0_FixNPEMerchantLogService_Ticket386_QA1_2025_08_12_0620_41769.html](/uploads/ab47dcb50431b9797ed9c3875f9bd477/R7.1.25.43.0_FixNPEMerchantLogService_Ticket386_QA1_2025_08_12_0620_41769.html)

-----

> ## Tests in sandbox
> ```gherkin
> Given Navigate to merchants page
>
> ### Scenario Outline: SEON null-to-true update persists with no errors in "<env>"
> When Search for merchant "<merchant>"
> Given Merchant "<merchant_code>" has SEON Id Verification as null
> And Open merchant "<merchant>" from results
> And Go to merchant Settings tab
> When I set merchant setting 'Require SEON Id Verification' to true
> And I save the merchant
> And No error toast is shown
> And Open merchant "<merchant>" from results
> Then Merchant setting 'Require SEON Id Verification' should be true
> And In database, merchant "<merchant_code>" has SEON Id Verification = true
> | PASS | Progress Mobility | 
> ```
>
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1071

UOWN | Origination | Make "Reference Merchant Code" Clickable in Merchant Info Section

Synopsis
In the Origination Portal, under the Merchant Info section, there is a field labeled Reference Merchant Code. Currently, 
this field is displayed as plain text. To improve usability, this field should be converted into a clickable 
hyperlink that redirects the user to the corresponding Merchant Details page.

Business Objective
Enhance user efficiency by enabling quick access to the merchant’s full profile directly from the customer view.
This reduces the number of steps agents need to take and improves workflow navigation within the portal.

Feature Request | Business Requirements
* In the Merchant Info section of the Origination Portal, update the Reference Merchant Code field to be a clickable hyperlink.
* Clicking the link should redirect the user to the Merchant Details page associated with the code.
* Ensure the redirection URL follows the correct routing and includes the merchant ID or code as required by the portal’s architecture.
* Apply consistent styling to indicate it is a clickable link.
* Confirm that the link opens in the same tab or a new tab, depending on current UX standards.
* Validate that the functionality works across different environments (Sandbox, QA, Staging).

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


> ## Tests in qa2
> ```gherkin
> 
> ### Scenario Outline: Código do Comerciante é exibido como hyperlink clicável
> Quando valido as informações exibidas na página do cliente
> Então o campo "Reference Merchant Code" é apresentado como um hyperlink
> E o elemento é clicável para indicar comportamento interativo
> E a estilização do link indica clicabilidade de forma consistente com o design system
> 
> ### Scenario Outline: Redireciona para Detalhes do Comerciante com roteamento por path
> Dado que o hyperlink do código do comerciante utiliza roteamento por path (ex.: "/merchant/{code}")
> Quando valido o redirecionamento do hyperlink do código do comerciante
> Então a URL de redirecionamento contém "/merchant"
> E a URL de redirecionamento inclui exatamente o código do comerciante extraído do hyperlink
> 
> ### Scenario Outline: Comportamento de abas segue o padrão de UX
> Quando valido o redirecionamento do hyperlink do código do comerciante
> Então a navegação é concluída para a página de Detalhes do Comerciante
> E o destino abre em nova aba
>
> | PASS | LeadPk:13139 and 13141 | AccountPk:10710 and 10711 | Merchant: Progress Mobility and Daniel's Jewelers | 
> ```
>
>

-----

> ## Tests in qa2
> ```gherkin
>
> ### Scenario Outline: Merchant Code is displayed as a clickable hyperlink
> When I validate the information displayed on the customer page
> Then the field "Reference Merchant Code" is presented as a hyperlink
> And the element is clickable to indicate interactive behavior
> And the link styling indicates clickability consistent with the design system
> 
> ### Scenario Outline: Redirects to Merchant Details with path routing
> Given that the merchant code hyperlink uses path routing (e.g.: "/merchant/{code}")
> When I validate the redirection of the merchant code hyperlink
> Then the redirect URL contains "/merchant"
> And the redirect URL includes exactly the merchant code extracted from the hyperlink
> 
> ### Scenario Outline: Tab behavior follows the UX standard
> When I validate the redirection of the merchant code hyperlink
> Then navigation is completed to the Merchant Details page
> And the destination opens in a new tab
> 
> | PASS | LeadPk:13139 and 13141 | AccountPk:10710 and 10711 | Merchant: Progress Mobility and Daniel's Jewelers | 
> ```
>
[R7.1.25.43.0_MakeReferenceMerchantCodeClickableInMerchantInfoSection_Ticket1071_ProgressMobility_QA2_2025_08_18_1705_16805.html](/uploads/ed64d88a1b9e440c1744de6d1f4e21a7/R7.1.25.43.0_MakeReferenceMerchantCodeClickableInMerchantInfoSection_Ticket1071_ProgressMobility_QA2_2025_08_18_1705_16805.html)
[R7.1.25.43.0_MakeReferenceMerchantCodeClickableInMerchantInfoSection_Ticket1071_DanielsJewelers_QA2_2025_08_18_1723_53021.html](/uploads/1c1fb3d2f43d0bf6e0ce90df1b1ebede/R7.1.25.43.0_MakeReferenceMerchantCodeClickableInMerchantInfoSection_Ticket1071_DanielsJewelers_QA2_2025_08_18_1723_53021.html)
> 
>
>

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa2

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
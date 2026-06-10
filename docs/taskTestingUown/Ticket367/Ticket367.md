--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/367

# UOWN | Servicing | Store Middle Name in CustomerInfo on Backend

**Status:** Open  
**Created by:** Yuri Araujo (1 month ago)

## Synopsis
Our application currently does not capture or store the user's middle name. To enhance customer data accuracy and completeness, we need to collect the middle name during customer input and save it in the `CustomerInfo` structure on the backend.

## Business Objective
Improve the completeness of customer records by ensuring that the middle name is properly collected and stored. This can support future personalization, compliance, or integration needs that require full legal names.

## Feature Request / Business Requirements

- Update the frontend to collect the customer's middle name during the registration or profile update process.
- Update the backend to include a field for `middleName` in the `CustomerInfo` structure.
- Test the end-to-end flow to ensure the middle name is captured, transmitted, and saved correctly.

## Testing Steps

- The middle name is now available as an optional field in the application form.
- **Backend Verification:** Verify that the middle name is correctly saved in the `uown_los_customer` table.
- **Origination Portal:** Confirm the middle name is shown in the Primary Applicant panel under the Borrower Name section.
    - Use the Edit button to update the name. Ensure the changes are saved correctly.
- **Servicing Portal:** Perform the same checks in the Servicing Portal to verify the presence and correct display of the middle name.
- **Customer Portal:** Verify that the full name, including the middle name (if provided), is shown in the Welcome message.

## Attachments
- Screenshots illustrating the old and new screens and backend verifications.

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# UOWN | Servicing | Armazenar o Middle Name em CustomerInfo no Backend

**Status:** Aberto  
**Criado por:** Yuri Araujo (há 1 mês)

## Sinopse
Nossa aplicação atualmente não captura nem armazena o nome do meio (middle name) do usuário. 
Para aumentar a precisão e completude dos dados dos clientes, precisamos coletar o middle name no cadastro/atualização e salvar na estrutura `CustomerInfo` no backend.

## Objetivo de Negócio
Melhorar a completude dos registros de clientes garantindo que o nome do meio seja devidamente coletado e armazenado.
Isso pode suportar futuras necessidades de personalização, compliance ou integrações que exijam o nome legal completo.

## Requisito de Funcionalidade / Negócio

- Atualizar o frontend para coletar o middle name durante o cadastro ou atualização de perfil do cliente.
- Atualizar o backend para incluir o campo `middleName` na estrutura `CustomerInfo`.
- Testar o fluxo ponta a ponta para garantir que o middle name é capturado, transmitido e salvo corretamente.

## Passos de Teste

- O middle name agora está disponível como campo opcional no formulário de cadastro.
- **Verificação Backend:** Verificar que o middle name é salvo corretamente na tabela `uown_los_customer`.
- **Portal Origination:** Confirmar que o middle name aparece no painel Primary Applicant, na seção Borrower Name.
    - Usar o botão Editar para atualizar o nome. Garantir que a alteração é salva corretamente.
- **Portal Servicing:** Realizar as mesmas verificações no Servicing Portal para garantir a presença e exibição correta do middle name.
- **Portal do Cliente:** Verificar que o nome completo, incluindo o middle name (caso informado), aparece na mensagem de boas-vindas.

## Anexos
- Prints ilustrando as telas antigas, novas e as validações backend.

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


**com middle name completo**
Origination:
Verificar que o middle name é salvo corretamente na tabela `uown_los_customer
Confirmar que o middle name aparece no painel Primary Applicant, na seção Borrower Name.
Editar middle Name
    interface
    log
    banco de dados


**com middle name primeira letra**
Origination:
Verificar que o middle name é salvo corretamente na tabela `uown_los_customer
Confirmar que o middle name aparece no painel Primary Applicant, na seção Borrower Name.
Confirmar que o nome completo aparece no portal do cliente
Editar middle Name
    interface
    log
    banco de dados


**sem middle name**
Servicing:
Verificar que o middle name é salvo corretamente na tabela `uown_los_customer
Confirmar que o middle name aparece no painel Primary Applicant, na seção Borrower Name.
Editar middle Name
    iterface
    log
    banco de dados
Confirmar que o nome completo do cliente é exibido no portal do cliente


editar middle name e verificar logs


Verificar se ao preencher nome completo em customer information, é exibido nome conforme preenchido  
Verificar se ao preencher middle name com primeira letra em customer information, é exibido nome conforme preenchido
Verificar se ao não preencher middle name em customer information, é exibido nome conforme preenchido
Verificar se ao editar o middle name é exibido log e armazenado corretamente
Verificar se é exibido novo nome no portal do cliente ao alterar no portal Servicing


-----

| LeadPk | Merchant | Caso de Teste | Dados de Teste | Status |
| ------ | -------- | ------------- | -------------- | ------ |
| X | X | Verificar se, ao preencher o nome completo em Customer Information, o nome é exibido exatamente como preenchido. | | PASS |
| X | X | Verificar se, ao preencher apenas a primeira letra do middle name em Customer Information, o nome é exibido conforme preenchido. | | PASS |
| X | X | Verificar se, ao deixar o middle name em branco em Customer Information, o nome é exibido sem o middle name. | | PASS |
| X | X | Verificar se, ao editar o middle name, a alteração é registrada em log e armazenada corretamente no backend. |  | PASS |
| X | X | Verificar se, ao alterar o nome no Portal Servicing, o nome atualizado é exibido no Portal do Cliente. |  | PASS |


Tests in qa1 

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | -------- | --------- | --------- | ------ |
| X | X | Verify that when the full name is entered in Customer Information, the name is displayed exactly as entered. | | PASS |
| X | X | Verify that when only the first letter of the middle name is entered in Customer Information, the name is displayed as entered. | | PASS |
| X | X | Verify that when the middle name is left blank in Customer Information, the name is displayed without the middle name. | | PASS |
| X | X | Verify that when editing the middle name, the change is logged and correctly stored in the backend. | | PASS |
| X | X | Verify that after changing the name in the Servicing Portal, the updated name is displayed in the Customer Portal. | | PASS |

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in stg


Verify that when the full name is entered in Customer Information, the name is displayed exactly as entered.
Verify that when only the first letter of the middle name is entered in Customer Information, the name is displayed as entered.
Verify that when the middle name is left bla
t when editing the middle name, the change is logged and correctly stored in the backend. | 
Verify that after changing the name in the Servicing Portal, the updated name is displayed in the Customer Portal.

Verifique se, quando o nome completo é inserido em Informações do Cliente, o nome é exibido exatamente como foi inserido.
Verifique se, quando apenas a primeira letra do nome do meio é inserida em Informações do Cliente, o nome é exibido conforme inserido.
Verifique se, quando o nome do meio é deixado em branco em Informações do Cliente, o nome é exibido sem o nome do meio.
Verifique se, ao editar o nome do meio, a alteração é registrada e armazenada corretamente no backend.
Verifique se, após alterar o nome no Portal de Atendimento, o nome atualizado é exibido no Portal do Cliente.

-----

Funcionalidade: Exibição e atualização do nome do cliente

Scenario Outline: Exibir nome conforme inserido em Informações do Cliente
  Dado que estou na tela de Informações do Cliente
  Quando insiro o nome "<nome_inserido>"
  E salvo as informações
  Então o nome deve ser exibido como "<nome_esperado>"

  Exemplos:
    | nome_inserido          | nome_esperado           |
    | Maria Fernanda Silva   | Maria Fernanda Silva    |
    | João A Souza           | João A Souza            |
    | Carlos Pereira         | Carlos Pereira          |

Cenário: Registrar e armazenar alteração ao editar o nome do meio
  Dado que existe um cliente cadastrado com nome do meio preenchido
  Quando edito o nome do meio em Informações do Cliente
  E salvo as alterações
  Então a alteração deve ser registrada e armazenada corretamente no backend e log

Cenário: Exibir nome atualizado no Portal do Cliente após alteração no Portal de Atendimento
  Dado que alterei o nome do cliente no Portal Servicing
  Quando acesso o Portal do Cliente
  Então o nome atualizado deve ser exibido no Portal do Cliente

-----

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

> ## Tests in stg
> ```gherkin
>
> Feature: Display and update of customer name
> 
> ### Scenario Outline: Display name as entered in Customer Information
> Given I am on the Customer Information screen
> When I enter the name "<entered_name>"
> And I save the information
> Then the name should be displayed as "<expected_name>"
> 
> Examples:
> | entered_name           | expected_name         |
> | John Michael Smith     | John Michael Smith   |
> | Emily R Johnson        | Emily R Johnson      |
> | David Miller           | David Miller         |
> | PASS | LeadPk: 24059, 24060 and 24061 | Merchant: Tire Agent | 
> ```
>
![367-stg-c1-1-_1_](/uploads/78af04ed5004927427adffb5a327c94a/367-stg-c1-1-_1_.jpg)![367-stg-c1-1-_1_](/uploads/06794238c2f2e5b7d4816edfdfc41c12/367-stg-c1-1-_1_.png){width=1435 height=738}![367-stg-c1-1-_2_](/uploads/06c5f9bb2ae19a9fc6f341fd1ddc117c/367-stg-c1-1-_2_.png){width=1435 height=738}![367-stg-c1-1-_3_](/uploads/5643bc2149a122575559b8f1cd737387/367-stg-c1-1-_3_.png){width=798 height=64}![367-stg-c1-2-_1_](/uploads/ed2e0c8cb3a66114e17c08ab53482953/367-stg-c1-2-_1_.png){width=589 height=293}![367-stg-c1-2-_2_](/uploads/f0089c854848f897ae863051dbdf7f2d/367-stg-c1-2-_2_.png){width=798 height=64}![367-stg-c1-3-_1_](/uploads/f117e6d1db72a845619f4e36e56229f8/367-stg-c1-3-_1_.png){width=1329 height=78}![367-stg-c1-3-_2_](/uploads/d5b0b681e6b9b37f9dfd71a2d1c52bc5/367-stg-c1-3-_2_.png){width=519 height=274}![367-stg-c1-3-_3_](/uploads/5da607bb456aae1cbce3a6602a8b02ce/367-stg-c1-3-_3_.png){width=1168 height=38}
> 
> ```gherkin
> ### Scenario: Log and store changes when editing the middle name
> Given there is a customer registered with a middle name filled in
> When I edit the middle name in Customer Information
> And I save the changes
> Then the change should be logged and correctly stored in the backend
> | PASS | LeadPk: 24060 | Merchant: Tire Agent | 
> | @fernandogmartins When the middle name is removed, the log currently shows that the middle name was changed to undefined. Can we improve this so that the log indicates the middle name was changed to an empty string (" ") instead? |
> ```
>
![367-stg-c2-_1_](/uploads/29d0fb1013936aed99da064d71bc3f29/367-stg-c2-_1_.png){width=485 height=279}![367-stg-c2-_2_](/uploads/bd66488f6787f35023aa3c6624327e19/367-stg-c2-_2_.png){width=485 height=279}![367-stg-c2-_3_](/uploads/134e485ec3dba9d29fa85b8787ffb897/367-stg-c2-_3_.png){width=485 height=279}![367-stg-c2-_4_](/uploads/5a192ac4aa41b90690a7cad050191619/367-stg-c2-_4_.png){width=897 height=44}![367-stg-c2-_5_](/uploads/9fa4c1622b4890f734c1228272094a8d/367-stg-c2-_5_.png){width=1191 height=46}![367-stg-c2-_6_](/uploads/afef7683b5bc214109998e9a4a21d37e/367-stg-c2-_6_.png){width=506 height=287}![367-stg-c2-_7_](/uploads/70f8061c16c55d516025300af884eda8/367-stg-c2-_7_.png){width=506 height=287}![367-stg-c2-_8_](/uploads/889f74bad6bf1068f054138a8a84f392/367-stg-c2-_8_.png){width=786 height=45}
>
> 
> ```gherkin
> ### Scenario: Display updated name in the Customer Portal after changing it in the Servicing Portal
> Given I changed the customer's name in the Servicing Portal
> When I access the Customer Portal
> Then the updated name should be displayed in the Customer Portal
> | PASS | AccountPk:206398 | Merchant: Progress Mobility | 
> ```
>
![379-stg-c3-_1_](/uploads/e12ccd5936acf584db3a6b399fa98fba/379-stg-c3-_1_.png){width=999 height=294}![379-stg-c3-_2_](/uploads/a756f197dd5da48484ef8958c55f241b/379-stg-c3-_2_.png){width=1425 height=262}![379-stg-c3-_3_](/uploads/77a336a74ea720b9adfc0da29d62cbde/379-stg-c3-_3_.png){width=1425 height=262}![379-stg-c3-_4_](/uploads/f48c83074d206c1893e336a0cdd388c4/379-stg-c3-_4_.png){width=425 height=222}


--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
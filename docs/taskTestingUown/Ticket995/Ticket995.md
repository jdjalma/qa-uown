--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/995

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Funcionalidade: Validação das colunas LeadPK e Status na página New Application

  Contexto:
    Dado que estou logado no sistema UOWN Origination
    E estou na página "New Application"

  Cenario: Verificar a exibição da coluna LeadPK
    Quando acesso a lista de aplicações
    Então a coluna "LeadPK" deve estar visível
    E cada valor da coluna "LeadPK" deve ser um link válido
    E ao clicar em um "LeadPK", devo ser redirecionado para a página de detalhes do lead correspondente

  Cenario: Verificar a exibição da coluna Status
    Quando acesso a lista de aplicações
    Então a coluna "Status" deve estar visível
    E deve exibir os valores corretos para cada aplicação

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa2

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 12054, 12057 | WeGetFinancing | Verify the visibility of the 'LeadPK' column, ensure that each value is a valid link, and redirect to the lead details page when clicked |  | PASS |
| -- | WeGetFinancing, Tire Agent and Pay TOmorrow | Verify the display of the 'Status' column, ensuring it is visible and shows the correct values according to the status of each application |  | PASS |

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verificar a visibilidade da coluna 'LeadPK', garantir que cada valor seja um link válido e redirecionar para a página de detalhes do lead ao clicar
Verify the visibility of the 'LeadPK' column, ensure that each value is a valid link, and redirect to the lead details page when clicked

Verificar a exibição da coluna 'Status', garantindo que esteja visível e exiba os valores corretos conforme o status de cada aplicação
Verify the display of the 'Status' column, ensuring it is visible and shows the correct values according to the status of each application

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa2

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in stg

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 20201 | Progress Mobility | Verify the visibility of the 'LeadPK' column, ensure that each value is a valid link, and redirect to the lead details page when clicked |  | PASS |
| -- | -- | Verify the display of the 'Status' column, ensuring it is visible and shows the correct values according to the status of each application |  | PASS |

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in stg

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/335

------------------------------------------------------------------------------------------------------------------------------------------------------------------

**Portal de Orientação **
Certifique-se de que os logs de atividades sejam devidamente carimbados com o usuário conectado ou com o portal ou a API, 
dependendo de onde as chamadas são originadas.

Priyanka Namburu @pnamburu
@jose.memesdev
Certifique-se de que o userID reflita adequadamente o usuário que faz as solicitações/alterações passando por todo o ciclo de lead via API e portal.
lead cycle --> criação de aplicações, fatura, assinatura, liquidação, financiamento

------------------------------------------------------------------------------------------------------------------------------------------------------------------

tests in qa1

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| X | X | Ensure that the userID accurately reflects the user responsible for all requests and changes made throughout the entire lead lifecycle via the API |  | PASS |
| X | X | Ensure that the userID accurately reflects the user responsible for all requests and changes made throughout the entire lead lifecycle via the portal |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Certifique-se de que o userID reflita corretamente o usuário responsável por todas as solicitações e alterações realizadas durante o ciclo completo do lead via API
Ensure that the userID accurately reflects the user responsible for all requests and changes made throughout the entire lead lifecycle via the API

Certifique-se de que o userID reflita corretamente o usuário responsável por todas as solicitações e alterações realizadas durante o ciclo completo do lead via portal
Ensure that the userID accurately reflects the user responsible for all requests and changes made throughout the entire lead lifecycle via the portal

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests ok in qa1

------------------------------------------------------------------------------------------------------------------------------------------------------------------

tests in staging

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| X | X | Ensure that the userID accurately reflects the user responsible for all requests and changes made throughout the entire lead lifecycle via the API |  | PASS |
| X | X | Ensure that the userID accurately reflects the user responsible for all requests and changes made throughout the entire lead lifecycle via the portal |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------
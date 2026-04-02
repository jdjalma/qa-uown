------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/servicing/-/issues/453

------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Manutenção | Remover Funcionalidade de Carteira de Pagamento do Portal de Manutenção

Sinopse
O Carteira de pagamento o recurso não é mais necessário no Portal de Serviços. A funcionalidade deve ser removida inteiramente do portal.

Davi Artur @davi.artur.gow
@jose.mendesdev 
Etapas de Teste

Caso de teste: Verifique se a funcionalidade "Pay Wallet" não está visível ao acessar "Informações do Cliente"

Pré-condições:
O usuário deve ser autenticado no sistema.
O ambiente de teste deve ser configurado corretamente.

Passos:
Faça login no sistema com um usuário válido.
Navegue até o menu "Informações do cliente".

Resultado Esperado:
A funcionalidade "Pay Wallet" não deveria estar visível na tela "Informações do cliente".

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Cenário: Verificar se a funcionalidade "Pay Wallet" não está visível em registros já existentes
  Dado que o usuário está autenticado no sistema
  E o ambiente de teste está configurado corretamente
  Quando o usuário acessa o menu "Informações do Cliente"
  E visualiza um registro já existente
  Então a funcionalidade "Pay Wallet" não deve estar visível na tela

Cenário: Verificar se a funcionalidade "Pay Wallet" não está visível em novos registros criados manualmente
  Dado que o usuário está autenticado no sistema
  E o ambiente de teste está configurado corretamente
  Quando o usuário acessa o menu "Informações do Cliente"
  E cria um novo registro de cliente manualmente
  Então a funcionalidade "Pay Wallet" não deve estar visível na tela

Cenário: Verificar se a funcionalidade "Pay Wallet" não está visível em novos registros criados pela API
  Dado que o usuário está autenticado no sistema
  E o ambiente de teste está configurado corretamente
  Quando um novo registro de cliente é criado via API
  E o usuário acessa o menu "Informações do Cliente"
  Então a funcionalidade "Pay Wallet" não deve estar visível na tela

------------------------------------------------------------------------------------------------------------------------------------------------------------------
Tests in qa1 

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 8070 | Progress Mobility Acquisition LLC | Verify that the "Pay Wallet" feature is not visible in existing leases |  | PASS |
| 8104 | Terrace Finance | Verify that the "Pay Wallet" feature is not visible in newly created manual leases |  | PASS |
| 8106 | Daniel's Jewelers | Verify that the "Pay Wallet" feature is not visible in newly created leases via API |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verificar se a funcionalidade "Pay Wallet" não está visível em leases já existentes
Verify that the "Pay Wallet" feature is not visible in existing leases.


Verificar se a funcionalidade "Pay Wallet" não está visível em novos leases criados manualmente
Verify that the "Pay Wallet" feature is not visible in newly created manual leases.


Verificar se a funcionalidade "Pay Wallet" não está visível em novos leases criados pela API
Verify that the "Pay Wallet" feature is not visible in newly created leases via API.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa1

------------------------------------------------------------------------------------------------------------------------------------------------------------------
Tests in staging

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 19938 | PayTomorrow | Verify that the "Pay Wallet" feature is not visible in existing leases |  | PASS |
| 19943 | Progress Mobility | Verify that the "Pay Wallet" feature is not visible in newly created manual leases |  | PASS |
| 19938 | PayTomorrow | Verify that the "Pay Wallet" feature is not visible in newly created leases via API |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Ok in staging

------------------------------------------------------------------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/323

------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | SVC | Utilizar o Endereço de Faturação do Cartão de Crédito para Verificação Pré-Auto de Kount

Sinopse
Atualmente, ao enviar detalhes de pagamento para a Kount (fornecedor pré-auth), 
o endereço do cliente está sendo passado em vez do endereço de cobrança do cartão de crédito. Isso pode afetar a precisão da detecção de fraudes. 
O objetivo desta atualização é priorizar o endereço de cobrança do cartão de crédito quando disponível. Se existir um endereço de cobrança, 
ele deverá ser passado para o Kount. Caso contrário, o endereço do cliente deve ser usado como um fallback.

davi marra @davimarrauownleasing

Etapas para reproduzir:
1️⃣ Acesse o Portal SVC

    -Abra o portal SVC no seu navegador.

2️⃣ Navegue até a seção "Fazer pagamento"

    -No menu superior direito, clique no cifrão.

3️⃣ Escolha o tipo de pagamento -> Pagamento com cartão de crédito

    - Selecione a opção "Usar informações de cartão únicas".

4️⃣ Então, se temos um endereço de cobrança em um cartão, basicamente, ele tem que enviar isso. Caso contrário, o endereço do cliente.

5️⃣ Verifique a tabela Kount (uown_kount)

    - Na tabela kount, nós realmente armazenamos a solicitação que realmente enviamos para Kount.

6️⃣ Validando o resultado

    -Então, nessa solicitação, você precisará verificar se o endereço do cartão está sendo enviado ou o endereço do cliente.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| X | X |  |  | PASS |
| X | X |  |  | PASS |
| X | X |  |  | PASS |
| X | X |  |  | PASS |
| X | X |  |  | PASS |
| X | X |  |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Cenário: Verificar se o endereço de cobrança do cartão é enviado quando disponível
  Dado que o usuário acessa o Portal SVC
  E navega até a seção "Fazer pagamento"
  E seleciona "Pagamento com novo cartão de crédito"
  E informa novo endereço 1
  E informa novo endereço 2
  Quando a solicitação de pagamento é enviada para a Kount
  Então a tabela "uown_kount" deve armazenar a solicitação com o endereço de cobrança do cartão

Cenário: Verificar se o endereço de cadastro do cliente é enviado quando não há endereço de cobrança
  Dado que o usuário acessa o Portal SVC
  E navega até a seção "Fazer pagamento"
  E seleciona "Pagamento com novo cartão de crédito"
  E seleciona o endereço do cadastro
  Quando a solicitação de pagamento é enviada para a Kount
  Então a tabela "uown_kount" deve armazenar a solicitação com o endereço do cliente

Cenário: Verificar uso do novo endereço cadastrado ao adicionar cartão no portal Servicing
  Dado que o usuário acessa o Portal Servicing
  E um insere novo em endereço em enredeço 1
  Quando uma transação de pagamento é enviada
  Então a tabela "uown_kount" deve armazenar a solicitação com o primeiro endereço cadastrado

Cenário: Verificar uso do novo endereço inserido ao adicionar cartão no portal Customer  --> Por que é apresentado um icone simbolizando preenchimento obrigatorio no endereco 2 mas permite salvar sem preencher o campo?
  Dado que o usuário acessa o Portal Customer
  E um insere novo em endereço em enredeço 1
  Quando uma transação de pagamento é enviada
  Então a tabela "uown_kount" deve armazenar a solicitação com o primeiro endereço cadastrado
-->Apresenta o endereço do cadastro porque nao preencheu endereco 2

Cenário: Verificar uso do novos endereços 1 e 2 inseridos ao adicionar cartão no portal Customer
  Dado que o usuário acessa o Portal Customer
  E adiciona um novo cartão
  Então a tabela "uown_kount" deve armazenar a solicitação com o edereço cadastrado

Cenário: Verificar uso do endereco do cadastro ao adicionar novo cartão no portal Servicing
  Dado que o usuário acessa o Portal Servicing
  E adiciona um novo cartão
  Então a tabela "uown_kount" deve armazenar a solicitação com o edereço cadastrado

Cenário: Verificar uso do novo endereco cadastrado ao adicionar novo cartão no portal origination
  Dado que o usuário acessa o Portal Origination
  E adiciona um novo cartão
  Então a tabela "uown_kount" deve armazenar a solicitação com o edereço cadastrado

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Português:

Certificar-se de que o endereço de cobrança do cartão é enviado quando disponível.
Garantir que o endereço de cadastro do cliente seja enviado quando não houver endereço de cobrança.
Verificar se o novo endereço cadastrado é utilizado ao adicionar um cartão no portal Servicing.
Verificar se o novo endereço cadastrado é utilizado ao adicionar um cartão no portal Customer.
Verificar se os novos endereços 1 e 2 inseridos são utilizados ao adicionar um cartão no portal Customer.
Confirmar o uso do endereço de cadastro ao adicionar um novo cartão no portal Servicing.
Confirmar o uso do novo endereço cadastrado ao adicionar um novo cartão no portal Origination.


Inglês:

Ensure that the card's billing address is sent when available
Ensure that the customer's registered address is sent when no billing address is available
Verify if the newly registered address is used when adding a card in the Servicing portal
Verify if the newly registered address is used when adding a card in the Customer portal
Verify if the newly inserted addresses 1 and 2 are used when adding a card in the Customer portal
Confirm the use of the registered address when adding a new card in the Servicing portal
Confirm the use of the newly registered address when adding a new card in the Origination portal
------------------------------------------------------------------------------------------------------------------------------------------------------------------

ccTransactionInfo.getCcAction() --> AUTHENTICATION
 
ccInfo.setPreAuthStatus --> PreAuthStatus.SUCCESS

if (ccInfo.getPreAuthStatus() == PreAuthStatus.SESSION_UNAVAILABLE)

------------------------------------------------------------------------------------------------------------------------------------------------------------------

| LeadPk/AccountPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 3621 | Daniel's Jewelers | Verify if the newly registered address is used when adding a card in the Servicing portal|  | PASS |
| 3621 | Daniel's Jewelers | Verify if the newly registered address is used when adding a card in the Customer portal |  | PASS |
| 3621 | Daniel's Jewelers | Verify if the newly inserted addresses 1 and 2 are used when adding a card in the Customer portal |  | PASS |
| 3621 | Daniel's Jewelers | Confirm the use of the registered address when adding a new card in the Servicing portal |  | PASS |
| 9131 | Daniel's Jewelers | Confirm the use of the newly registered address when adding a new card in the Origination portal |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa1

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in staging

| LeadPk/AccountPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 3621 | Daniel's Jewelers | Verify if the newly registered address is used when adding a card in the Servicing portal|  | PASS |
| 3621 | Daniel's Jewelers | Verify if the newly registered address is used when adding a card in the Customer portal |  | PASS |
| 3621 | Daniel's Jewelers | Verify if the newly inserted addresses 1 and 2 are used when adding a card in the Customer portal |  | PASS |
| 3621 | Daniel's Jewelers | Confirm the use of the registered address when adding a new card in the Servicing portal |  | PASS |
| 9131 | Daniel's Jewelers | Confirm the use of the newly registered address when adding a new card in the Origination portal |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verify if the newly registered address is used when adding a card in the Servicing portal
Verify if the newly registered address is used when adding a card in the Customer portal
Verify if the newly inserted addresses 1 and 2 are used when adding a card in the Customer portal
Confirm the use of the registered address when adding a new card in the Servicing portal
Confirm the use of the newly registered address when adding a new card in the Origination portal

Verifique se o endereço registrado é utilizado ao adicionar um cartão no portal de Servicing.
Verifique se o endereço recém-registrado é utilizado ao adicionar um cartão no portal do Cliente.
Verifique se os endereços 1 e 2 recém-inseridos são utilizados ao adicionar um cartão no portal do Cliente.
Confirme o uso do endereço recem-registrado ao adicionar um novo cartão no portal de Servicing.
Confirme o uso do endereço recém-registrado ao adicionar um novo cartão no portal de Origination.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in staging

------------------------------------------------------------------------------------------------------------------------------------------------------------------
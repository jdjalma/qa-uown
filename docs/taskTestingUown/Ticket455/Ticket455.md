------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/servicing/-/issues/455

------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | SVC | Adicionar Pré Status de Auth à Lista de Transações de Cartão de Crédito

Sinopse
Atualmente, o Pre Auth Status o campo está disponível no backend, 
mas não é exibido no Transações com Cartão de Crédito seção sobre FrontEnd. 
Este ticket tem como objetivo atualizar o FrontEnd para garantir que o Pre Auth Status a coluna é incluída e exibida corretamente na interface do usuário.

Davi Artur @davi.artur.gow

Caso de teste: Verifique a exibição da coluna "Estado Pré-Autoral" na tabela Histórico do Cartão de Crédito

Pré-condições:
O usuário deve ser autenticado no sistema.
O ambiente de teste deve ser configurado corretamente.

Passos:
Faça login no sistema com um usuário válido.
Acesse o URL: /credit-card-history/{accountPk}.
Verifique a tabela exibida na tela.
Verifique se a coluna "Pre Auth Status" está presente na tabela.

Resultado Esperado:
A tabela deve exibir uma nova coluna chamada Pre Auth Status.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Cenário: Verificar a exibição da coluna "Pre Auth Status" na tabela de Histórico do Cartão de Crédito
  Dado que o usuário está autenticado no sistema
  E o ambiente de teste está configurado corretamente
  Quando o usuário acessa a URL "/credit-card-history/{accountPk}"
  Então a tabela exibida na tela deve conter a coluna "Pre Auth Status"

Cenário: Verificar a exibição da coluna "Pre Auth Status" para pagamento agendado
  Dado que o usuário está autenticado no sistema
  E realiza um pagamento agendado via novo cartão de crédito
  Quando o usuário acessa a URL "/credit-card-history/{accountPk}"
  Então a coluna "Pre Auth Status" deve apresentar o status SUCCESS

Cenário: Verificar a exibição da coluna "Pre Auth Status" para pagamento no dia
  Dado que o usuário está autenticado no sistema
  E realiza um pagamento para o dia atual, inserindo um novo cartão de crédito
  Quando o usuário acessa a URL "/credit-card-history/{accountPk}"
  Então a coluna "Pre Auth Status" deve estar visível na tabela

Cenário: Verificar a exibição da coluna "Pre Auth Status" para pagamento feito pelo portal do cliente
  Dado que o usuário está autenticado no sistema
  E realiza um pagamento registrado pelo portal do cliente via cartão de crédito
  Quando o usuário acessa a URL "/credit-card-history/{accountPk}"
  Então a coluna "Pre Auth Status" deve apresentar o status SUCCESS

Cenário: Verificar a exibição da coluna "Pre Auth Status" para cartões rejeitados
  Dado que o usuário está autenticado no sistema
  E há um pagamento rejeitado no histórico do cartão de crédito
  Quando o usuário acessa a URL "/credit-card-history/{accountPk}"
  Então a coluna "Pre Auth Status" deve estar visível na tabela

Cenário: Verificar a exibição da coluna "Pre Auth Status" para cartões válidos de diferentes bandeiras
  Dado que o usuário está autenticado no sistema
  E há pagamentos registrados com cartões de diferentes bandeiras no histórico do cartão de crédito
  Quando o usuário acessa a URL "/credit-card-history/{accountPk}"
  Então a coluna "Pre Auth Status" deve estar visível na tabela

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verificar se a coluna "Pre Auth Status" está visível na tabela de Histórico do Cartão de Crédito.
Verify if the "Pre Auth Status" column is visible in the Credit Card History table

Verificar se a coluna "Pre Auth Status" exibe o status SUCCESS para pagamentos acordados
Verify if the "Pre Auth Status" column displays the status SUCCESS for scheduled payments

Verificar se a coluna "Pre Auth Status" exibe o status SUCCESS para pagamentos realizados no dia com um cartão de crédito novo
Verify if the "Pre Auth Status" column displays the status SUCCESS for same-day payments made with a new credit card

Verificar se a coluna "Pre Auth Status" exibe o status SUCCESS para pagamentos feitos pelo portal do cliente
Verify if the "Pre Auth Status" column displays the status SUCCESS for payments made through the customer portal

Verificar se a coluna "Pre Auth Status" exibe o status ERROR para pagamentos rejeitados
Verify if the "Pre Auth Status" column displays the status ERROR for rejected payments

Verificar a apresentação da mensagem DENIED na coluna "Pre Auth Status"
Verify the display of the DENIED message in the "Pre Auth Status" column

Verificar a apresentação da mensagem NOT_RUN na coluna "Pre Auth Status"
Verify the display of the NOT_RUN message in the "Pre Auth Status" column

Verificar se a coluna "Pre Auth Status" exibe o status SUCCESS para pagamentos com cartões válidos de diferentes bandeiras
Verify if the "Pre Auth Status" column displays the status SUCCESS for payments made with valid cards from different brands

------------------------------------------------------------------------------------------------------------------------------------------------------------------

| AccountPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 3614 | Daniel's Jewelers | Verify if the "Pre Auth Status" column is visible in the Credit Card History table |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa1

------------------------------------------------------------------------------------------------------------------------------------------------------------------


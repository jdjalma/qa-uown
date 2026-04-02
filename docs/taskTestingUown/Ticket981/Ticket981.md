------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/981

------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Origination | Minor Changes to “Financial Information” Section on Servicing & Origination

Synopsis
Remove the Financial Information Section in both Servicing and Origination, and create a separate section for bank account and credit card. 
Remove bankruptcy. Instead of allowing direct edits to the entire section, the update introduces a more structured approach for managing financial details.

Changes Implemented:
Create separate components for the bank account and credit card section.
Remove the edit (pencil) icon from each section the Financial Information section
Create a modal to add new bank accounts instead of editing existing ones
Add a button next to Bank Account and Credit Card sections to allow adding new records instead of editing existing ones
Create a view all modal on bank account that allows to delete existing bank accounts
Remove the bankruptcy section
Refactor the props and methods to stop using Financial Info, and use individual methods and prop


Testing Steps:

General:
The edit option should not be available
Validate if the new panels are being displayed, instead of the Financial Info Panel
Bankruptcy should no longer be displayed
On Bank Account, "since" column should no longer be displayed

Origination:
Should not have the buttons to add or view all on both panels

Servicing:
Should have the buttons to add and view all.
Test if the add account button is calling the method createOrUpdateBankAccount, and not createOrUpdateFinancialInfo. Check if it's working properly
Test if the view all button is fetching the bank accounts and if the delete method is working as it should
Test if the add card button is validating the expiration date, not allowing it to bein the past
Test if the method being called is createOrUpdateCreditCard, and not createOrUpdateFinancialInfo. Check if it's working properly
Test if the view all button is displaying all credit cards, and if they can be deleted

API:
Test the create and delete methods via api

-----

UOWN | Originação | Pequenas Alterações na Seção "Informações Financeiras" em Servicing & Origination

Sinopse:
Remover a Seção de Informações Financeiras em Servicing e Origination, e criar uma seção separada para conta bancária e cartão de crédito.
Remover falência. Em vez de permitir edições diretas em toda a seção, a atualização introduz uma abordagem mais estruturada para gerenciar detalhes financeiros.

Mudanças Implementadas:
Criar componentes separados para as seções de conta bancária e cartão de crédito.
Remover o ícone de edição (lápis) de cada seção na seção de Informações Financeiras.
Criar um modal para adicionar novas contas bancárias em vez de editar as existentes.
Adicionar um botão ao lado das seções de Conta Bancária e Cartão de Crédito para permitir a adição de novos registros em vez de editar os existentes.
Criar um modal "ver tudo" na conta bancária que permite excluir contas bancárias existentes
Remover a seção de falência.
Refatorar as props e métodos para parar de usar Financial Info, usando métodos e props individuais.


Passos de Teste:

Geral:
A opção de edição não deve estar disponível.
Validar se os novos painéis estão sendo exibidos, em vez do Painel de Informações Financeiras.
Falência não deve mais ser exibida.
Na Conta Bancária, a coluna "desde" não deve mais ser exibida.

Origination:
Não deve ter os botões para adicionar ou "ver tudo" em ambos os painéis.

Servicing:
Deve ter os botões para adicionar e "ver tudo".
Testar se o botão de adicionar conta está chamando o método createOrUpdateBankAccount, e não createOrUpdateFinancialInfo. Verificar se está funcionando corretamente.
Testar se o botão "ver tudo" está buscando as contas bancárias e se o método de exclusão está funcionando como deveria.
Testar se o botão de adicionar cartão está validando a data de expiração, não permitindo que esteja no passado.
Testar se o método chamado é createOrUpdateCreditCard, e não createOrUpdateFinancialInfo. Verificar se está funcionando corretamente.
Testar se o botão "ver tudo" está exibindo todos os cartões de crédito, e se eles podem ser excluídos.

API:
Testar os métodos de criação e exclusão via API.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Cenários de Teste

1. Scenario: Validate absence of edit option and display of new panels

Scenario: Validate that the edit option is not available and the new panels are displayed
  Given que o usuário acessa a página de Servicing e Origination
  When visualiza o painel financeiro exibido
  Then o ícone de edição (lápis) não deve ser exibido
  And os novos painéis de Conta Bancária e Cartão de Crédito devem ser exibidos

Explicação:
Este cenário valida que, ao acessar a página, o usuário não visualiza a opção de edição (ícone de lápis) e que os novos painéis foram implementados corretamente, substituindo o antigo Painel de Informações Financeiras.

Resultado Esperado:
O sistema não exibe nenhuma opção de edição e mostra os painéis separados para Conta Bancária e Cartão de Crédito.

-->OK
-----

2. Scenario: Validate removal of bankruptcy section and "since" column

Scenario: Validate that the bankruptcy section and the "since" column in Bank Account are not displayed
  Given que o usuário acessa a página de Servicing e Origination
  When visualizar o painel de Informações Financeiras
  Then a seção de Falência não deve ser exibida
  And na seção de Conta Bancária a coluna "desde" não deve ser exibida

Explicação:
Este cenário assegura que os elementos relacionados à falência foram removidos e que a coluna "desde" não aparece na seção de Conta Bancária, conforme o novo design.

Resultado Esperado:
Nenhuma referência à falência e à coluna "desde" estará visível na interface.

-->OK
-----

3. Scenario: Validate Origination panels without add/view all buttons

Scenario: Validate that Origination does not display add or view all buttons in both panels
  Given que o usuário está na página de Origination
  When visualizar os painéis de Conta Bancária e Cartão de Crédito
  Then os botões para "adicionar" e "ver tudo" não devem ser exibidos

Explicação:
Neste cenário, o foco é confirmar que na Origination os painéis não possuem botões para adicionar ou visualizar todos os registros, conforme especificado.

Resultado Esperado:
Na página de Origination, os botões de "adicionar" e "ver tudo" devem estar ausentes.

-->OK
-----

4. Scenario: Validate Servicing Bank Account panel functionality

Scenario: Validate that the Servicing Bank Account panel displays add and view all buttons and functions correctly
  Given que o usuário está na página de Servicing
  When acessar o painel de Conta Bancária
  Then o botão "adicionar" deve estar presente
  And o botão "ver tudo" deve estar presente
  And ao clicar no botão "salvar em adicionar conta", o método createOrUpdateBankAccount deve ser chamado
  And ao clicar no botão "ver tudo", o modal com as contas bancárias deve ser exibido
  And ao excluir uma conta bancária, o método de exclusão deve funcionar corretamente

Explicação:
Este cenário testa o painel de Conta Bancária na página de Servicing, verificando a presença dos botões e sua funcionalidade, incluindo a chamada dos métodos corretos e a operação de exclusão.

Resultado Esperado:
Os botões estão visíveis e, quando acionados, executam os métodos corretos, exibindo os modais esperados e permitindo a exclusão de contas bancárias.

-->OK
-----

5. Scenario: Validate Servicing Credit Card panel functionality

Scenario: Validate that the Servicing Credit Card panel displays add and view all buttons and functions correctly
  Given que o usuário está na página de Servicing
  When acessar o painel de Cartão de Crédito
  Then o botão "adicionar" deve estar presente
  And o botão "ver tudo" deve estar presente
  And ao clicar no botão "salvar adicionar CC", o método createOrUpdateCreditCard deve ser chamado
  And o botão "adicionar" deve validar a data de expiração, não permitindo datas passadas
  And ao clicar no botão "ver tudo", o modal com os cartões de crédito deve ser exibido e permitir exclusão


Explicação:
Este cenário foca na funcionalidade do painel de Cartão de Crédito, garantindo que os botões estejam presentes, que a ação de adicionar chame o método correto com validação de data, e que o modal "ver tudo" funcione corretamente para exibição e exclusão dos cartões.

Resultado Esperado:
Os botões funcionam conforme especificado, a data de expiração é validada adequadamente e o modal exibe os cartões de crédito com a possibilidade de exclusão.

-----

6. Scenario: Validate API create and delete methods for Bank Account and Credit Card

Scenario: Validate the API create and delete methods for bank account and credit card
  Given que a API está disponível para gerenciamento de Conta Bancária e Cartão de Crédito
  When enviar uma requisição para criar um registro de conta bancária ou cartão de crédito
  Then a criação deve ser processada com sucesso
  And quando enviar uma requisição para excluir um registro
  Then o registro deve ser removido corretamente via API

Explicação:
Este cenário testa, via API, os métodos de criação e exclusão para os registros de Conta Bancária e Cartão de Crédito, garantindo que os endpoints funcionem conforme o esperado.

Resultado Esperado:
As requisições de criação retornam sucesso e, ao enviar uma requisição de exclusão, o registro é removido corretamente.

-----

7. Verificar se ao cadastrar conta bancária e cartão de crédito no portal do cliente é apresentado em portal Servicing

------------------------------------------------------------------------------------------------------------------------------------------------------------------

uown/svc/removeBankAccounts
uown/svc/removeCreditCards
 
curl --location 'http://localhost:8080/uown/svc/removeBankAccounts' \

--header 'Content-Type: application/json' \

--header 'Authorization: knQ9MeLBQhxl3gKnOszKq7ZaRxaHY23G2iddtlH2' \

--data '[41]'
 
curl --location 'https://svc-website-dev2.uownleasing.com/uown/svc/removeCreditCards' \
--header 'Content-Type: application/json' \
--header 'Authorization: knQ9MeLBQhxl3gKnOszKq7ZaRxaHY23G2iddtlH2' \
--data '[97]'

------------------------------------------------------------------------------------------------------------------------------------------------------------------

1. Scenario: Validate absence of edit option and display of new panels
Português: "Validar que a opção de edição não está disponível e os novos painéis são exibidos em Origination e Servicing."
English: "Validate that the edit option is not available and the new panels are displayed in Origination and Servicing."

2. Scenario: Validate removal of bankruptcy section and 'since' column
Português: "Validar que a seção de falência e a coluna 'desde' não são exibidas."
English: "Validate that the bankruptcy section and the 'since' column are not displayed in Origination and Servicing"

3. Scenario: Validate Origination panels without add/view all buttons
Português: "Validar que os painéis de Origination não exibem botões de adicionar ou ver tudo."
English: "Validate that Origination panels do not display add or view all buttons."

4. Scenario: Validate Servicing Bank Account panel functionality
Português: "Validar que o painel de Conta Bancária em Servicing exibe botões de adicionar e ver tudo e funciona corretamente."
English: "Validate that the Servicing Bank Account panel displays add and view all buttons and functions correctly."

5. Scenario: Validate Servicing Credit Card panel functionality
Português: "Validar que o painel de Cartão de Crédito em Servicing exibe botões de adicionar e ver tudo e funciona corretamente."
English: "Validate that the Servicing Credit Card panel displays add and view all buttons and functions correctly."

6. Scenario: Validate API create and delete methods for Bank Account and Credit Card
Português: "Validar os métodos de criação e exclusão da API para Conta Bancária e Cartão de Crédito."
English: "Validate the API create and delete methods for Bank Account and Credit Card."

7. Check whether, when registering a bank account and credit card on the customer portal, it is displayed on the Servicing portal

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa2

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 12216 | Progress Mobility | Validate that the edit option is not available and the new panels are displayed in Origination and Servicing |  | PASS |
| 10381 | Progress Mobility | Validate that the bankruptcy section and the 'since' column are not displayed in Origination and Servicing |  | PASS |
| 10381 | Progress Mobility | Validate that Origination panels do not display add or view all buttons |  | PASS |
| 10381 | Progress Mobility | Validate that the Servicing Bank Account panel displays add and view all buttons and functions correctly |  | ERROR |
| 10381 | Progress Mobility | Validate that the Servicing Credit Card panel displays add and view all buttons and functions correctly |  | PASS |
| 10381 | Progress Mobility | Validate the API create and delete methods for Bank Account and Credit Card |  | PASS |
| 10381 | Progress Mobility | Check whether, when registering a bank account and credit card on the customer portal, it is displayed on the Servicing portal |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa2

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in stg

| LeadPk | Merchant | Test Case | Test Data | Status | Observation |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 12216 | Progress Mobility | Validate that the edit option is not available and the new panels are displayed in Origination and Servicing |  | PASS |
| 10381 | Progress Mobility | Validate that the bankruptcy section and the 'since' column are not displayed in Origination and Servicing |  | PASS |
| 10381 | Progress Mobility | Validate that Origination panels do not display add or view all buttons |  | PASS |
| 10381 | Progress Mobility | Validate that the Servicing Bank Account panel displays add and view all buttons and functions correctly |  | PASS |
| 10381 | Progress Mobility | Validate that the Servicing Credit Card panel displays add and view all buttons and functions correctly |  | PASS |
| 10381 | Progress Mobility | Validate the API create and delete methods for Bank Account and Credit Card |  | PASS |
| 10381 | Progress Mobility | Check whether, when registering a bank account and credit card on the customer portal, it is displayed on the Servicing portal |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

OK in stg

------------------------------------------------------------------------------------------------------------------------------------------------------------------
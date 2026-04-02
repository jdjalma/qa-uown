--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/999

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Originação | Adicionar Campo de Motivo de Término para Comerciantes Excluídos

Sinopse
Um novo campo deve ser adicionado à seção de Informações do Comerciante para armazenar o motivo do término do comerciante quando a opcao active for desmarcada.
Isso ajudará a rastrear a lógica por trás das desativações de comerciantes.


Objetivo de Negócio
Garantir a documentação adequada dos términos de comerciantes, permitindo que os usuários especifiquem um motivo de término predefinido ao desativar um comerciante.


Solicitação de Recurso | Requisitos de Negócio
Adicionar um campo suspenso “Motivo de Término” na seção de Status da página de Informações do Comerciante.
Esse campo deve ser visível apenas quando a opcao active for desmarcada.
O campo “Motivo de Término” deve ser obrigatório quando a opcao active for desmarcada. Os usuários não devem conseguir salvar as configuracoes do comerciante sem selecionar um motivo.


Lista de Motivos:
200 - Desempenho do Cliente
300 - Fraude do Cliente
400 - Fraude do Comerciante
500 - Registro UCC
600 - Sem Volume
700 - Baixo Volume
800 - Decisão do Comerciante
900 - Mudança de Plataforma
000 - Outro


PASSOS PARA REPRODUZIR

1 - Verificar a Exibição da Lista de Motivos de Término
Na página de Configuracoes do Comerciante, após desmarcar a opcao active, a lista "Motivo de Término" deve ser exibida.
Os itens da lista devem corresponder aos especificados no ticket.

2 - Testar a Obrigatoriedade do Campo
Quando a caixa de seleção "Active" estiver desmarcada, a seleção de um item na lista "Motivo de Término" deve ser obrigatória para salvar a página.

3 - Testar a Funcionalidade e Atualização do Banco de Dados
Selecione um motivo na lista "Motivo de Término".
Salve o registro.
Verifique os dados na tabela uown_merchant usando a seguinte consulta SQL:

SELECT um.pk, um.is_deleted, um.termination_reason, um.sales_rep_code, 
um.ref_merchant_code, um.merchant_name, um.primary_contact_email, 
um.primary_contact_name, * 
FROM uown_merchant um 
WHERE um.ref_merchant_code = '?';
(Substitua ? pelo código real do comerciante)

4 - Resultados Esperados
O registro deve ser recuperado com:
Coluna is_deleted definida como true.
Coluna termination_reason preenchida com o motivo selecionado.
Esse registro não deve mais aparecer nos resultados da Pesquisa de Comerciantes.

---------------------------------------------------------------------------

Análise dos Cenários de Teste em Relação ao Requisito

1. Verificar exibição da lista de "Motivos da rescisão"
Descrição no Requisito: 
"Verificar a Exibição da Lista de Motivos de Término" - Após desmarcar o checkbox "Active", a lista "Motivos da rescisão" deve ser exibida com os itens especificados.

Cenário Proposto: 
Verifica se, ao desmarcar "Active", a lista aparece e contém as razões listadas (200 - Customer Performance, 300 - Customer Fraud, etc.).

-----

2. Testar obrigatoriedade do campo "Motivos da rescisão"
Descrição no Requisito: 
"Testar a Obrigatoriedade do Campo" - Quando "Active" está desmarcado, selecionar um item da lista "Motivos da rescisão" deve ser obrigatório para salvar.

Cenário Proposto: Tenta salvar sem selecionar um motivo e espera uma mensagem de erro indicando que o campo é obrigatório.

Conclusão: O cenário reflete exatamente o que foi solicitado no passo 2 do requisito. Ele testa a obrigatoriedade do campo e a validação do sistema ao tentar salvar sem preenchê-lo.


3. Testar atualização do registro no banco de dados
Descrição no Requisito: 
"Testar a Funcionalidade e Atualização do Banco de Dados" - Selecionar um motivo, salvar e verificar no banco de dados se is_deleted = true e termination_reason contém o valor escolhido.

Cenário Proposto: 
Seleciona "300 - Customer Fraud", salva e verifica se o banco reflete is_deleted como verdadeiro e termination_reason com o valor correto. Inclui "Examples" para outros motivos.

Conclusão: O cenário está alinhado com o passo 3 do requisito. Ele cobre a funcionalidade de salvar o motivo e a atualização no banco de dados. A adição de "Examples" é opcional, 
mas útil para garantir que diferentes motivos sejam testados, embora o exemplo com "300 - Customer Fraud" já seja suficiente para validar o comportamento.


4. Verificar exclusão do Merchant na pesquisa
Descrição no Requisito: 
"Resultados Esperados" - O registro marcado como is_deleted = true não deve mais aparecer nos resultados da Pesquisa de Comerciantes.

Cenário Proposto: 
Após marcar um comerciante como "Deleted" e selecionar um motivo, verifica se ele não aparece na busca por comerciantes ativos.

Conclusão: 
Este cenário complementa o passo 4 do requisito e valida um resultado esperado importante. Ele está implícito no requisito original 
e é uma boa adição para garantir que a exclusão lógica funcione como esperado no sistema.


Considerações Gerais
Cobertura: 
Os quatro cenários cobrem todos os aspectos mencionados no requisito: exibição da lista, obrigatoriedade do campo, atualização no banco de dados e exclusão da pesquisa. 
Não há lacunas evidentes.

Clareza: 
Os cenários estão bem redigidos no formato Gherkin (Given/When/Then), o que facilita a execução manual ou até uma futura automação.


--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Feature: Add Termination Reason Field for Deleted Merchants
  As a user, I want to record the reason for merchant termination when a merchant is unmarked as Active, so that the rationale behind deactivations is properly documented.
  
  # 1 - Verificar que a lista "Termination Reason" não é exibida quando o Merchant não está desmarcado como "Active"
  Scenario: Verificar a não exibição da lista "Termination Reason" quando o status é "Active"
    Given que estou na página de configurações do Merchant
    When a opcao Active esta marcada
    Then a lista de "Termination Reason" não deve ser exibida
--> OK

  # 2. Verificar exibição da lista de Termination Reason
  Scenario Outline: Verificar exibição da lista "Termination Reason" quando o Merchant é desmarcado como "Active"
    Given que estou na página de configurações do Merchant
    When desmarco o checkbox "Active" no status do Merchant
    Then a lista de "Termination Reason" deve ser exibida
    And os itens da lista devem incluir as <"Razoes">
    
    Examples:
    | Razoes                     |
    | 200 - Customer Performance |
    | 300 - Customer Fraud       |
    | 400 - Merchant Fraud       |
    | 500 - UCC Filing          |
    | 600 - No Volume           |
    | 700 - Low Volume          |
    | 800 - Merchant Decision    |
    | 900 - Changed Platform     |
    | 000 - Other                |
--> OK

  # 3. Testar obrigatoriedade do campo Termination Reason
  Scenario: 3 - Verificar que o campo "Termination Reason" é obrigatório quando o status é "Desactived"
    Given que estou na página de configuracoes do Merchant
    When desmarco o checkbox "Active" sem selecionar um motivo na lista "Termination Reason"
    And tento salvar as informações do Merchant
    Then o sistema deve exibir uma mensagem de erro informando que o campo "Termination Reason" é obrigatório
--> OK

  # 4. Testar atualização do registro no banco de dados
  Scenario Outline: 4 - Verificar atualização do registro no banco de dados após selecionar um motivo de término
    Given que estou na página de Informações do Merchant com o status "Desactived"
    When seleciono o motivo <"Razao"> na lista "Termination Reason"
    And salvo as informações do Merchant
    Then o registro no banco de dados deve apresentar "is_deleted" como verdadeiro
    And o campo "termination_reason" deve conter o valor <"Razao">

    Examples:
    | Razao                      |
    | 200 - Customer Performance |
    | 300 - Customer Fraud       |
    | 400 - Merchant Fraud       |
    | 500 - UCC Filing          |
    | 600 - No Volume           |
    | 700 - Low Volume          |
    | 800 - Merchant Decision    |
    | 900 - Changed Platform     |
    | 000 - Other                |

  # 5. Verificar exclusão do Merchant na pesquisa
  Scenario: 5 - Verificar que o Merchant marcado como Desactived não é exibido na pesquisa
    Given que um Merchant foi marcado como "Desactived" e o motivo de término foi selecionado
    When realizo uma busca por Merchants ativos no portal
    Then o Merchant deletado não deve ser exibido nos resultados da pesquisa

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Português: "Verifique que a lista 'Termination Reason' não é exibida quando o checkbox 'Active' está marcado na página de configurações do Merchant."
Verify that the "Termination Reason" list is not displayed when the "Active" checkbox is checked on the Merchant settings page

Português: "Verifique que a lista 'Termination Reason' é exibida com todas as razões especificadas quando o checkbox 'Active' está desmarcado na página de configurações do Merchant."
Verify that the "Termination Reason" list is displayed with all specified reasons when the "Active" checkbox is unchecked on the Merchant settings page

Português: "Verifique que o sistema exibe uma mensagem de erro indicando que o campo 'Termination Reason' é obrigatório ao tentar salvar com 'Active' marcado mas sem motivo selecionado."
Verify that the system displays an error message indicating that the "Termination Reason" field is required when attempting to save with "Active" checked but no reason selected

Português: "Verifique que o registro no banco de dados é atualizado com 'is_deleted' como verdadeiro e 'termination_reason' correspondendo ao motivo selecionado após salvar as informações do Merchant."
Verify that the database record is updated with "is_deleted" as true and "termination_reason" matching the selected reason after saving the Merchant information

Português: "Verifique que um Merchant marcado como 'Desactived' com um motivo de término selecionado não aparece nos resultados da busca por Merchants ativos no portal."
Verify that a Merchant marked as "Deactivated" with a selected termination reason does not appear in the search results for active Merchants in the portal

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa2

| Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ |
| X | X | Verify that the "Termination Reason" list is not displayed when the "Active" checkbox is checked on the Merchant settings page |  | PASS |
| X | X | Verify that the "Termination Reason" list is displayed with all specified reasons when the "Active" checkbox is unchecked on the Merchant settings page |  | PASS |
| X | X | Verify that the system displays an error message indicating that the "Termination Reason" field is required when attempting to save with "Active" checked but no reason selected |  | PASS |
| X | X | Verify that the database record is updated with "is_deleted" as true and "termination_reason" matching the selected reason after saving the Merchant information |  | PASS |
| X | X | Verify that a Merchant marked as "Deactivated" with a selected termination reason does not appear in the search results for active Merchants in the portal |  | PASS |

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/999

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Originação | Adicionar Campo de Motivo de Término para Comerciantes Excluídos

Sinopse
Um novo campo deve ser adicionado à seção de Informações do Comerciante para armazenar o motivo do término do comerciante quando a opcao active for desmarcada.
Isso ajudará a rastrear a lógica por trás das desativações de comerciantes.


Objetivo de Negócio
Garantir a documentação adequada dos términos de comerciantes, permitindo que os usuários especifiquem um motivo de término predefinido ao desativar um comerciante.


Solicitação de Recurso | Requisitos de Negócio
Adicionar um campo suspenso “Motivo de Término” na seção de Status da página de Informações do Comerciante.
Esse campo deve ser visível apenas quando a opcao active for desmarcada.
O campo “Motivo de Término” deve ser obrigatório quando a opcao active for desmarcada. Os usuários não devem conseguir salvar as configuracoes do comerciante sem selecionar um motivo.


Lista de Motivos:
200 - Desempenho do Cliente
300 - Fraude do Cliente
400 - Fraude do Comerciante
500 - Registro UCC
600 - Sem Volume
700 - Baixo Volume
800 - Decisão do Comerciante
900 - Mudança de Plataforma
000 - Outro


PASSOS PARA REPRODUZIR

1 - Verificar a Exibição da Lista de Motivos de Término
Na página de Configuracoes do Comerciante, após desmarcar a opcao active, a lista "Motivo de Término" deve ser exibida.
Os itens da lista devem corresponder aos especificados no ticket.

2 - Testar a Obrigatoriedade do Campo
Quando a caixa de seleção "Active" estiver desmarcada, a seleção de um item na lista "Motivo de Término" deve ser obrigatória para salvar a página.

3 - Testar a Funcionalidade e Atualização do Banco de Dados
Selecione um motivo na lista "Motivo de Término".
Salve o registro.
Verifique os dados na tabela uown_merchant usando a seguinte consulta SQL:

SELECT um.pk, um.is_deleted, um.termination_reason, um.sales_rep_code, 
um.ref_merchant_code, um.merchant_name, um.primary_contact_email, 
um.primary_contact_name, * 
FROM uown_merchant um 
WHERE um.ref_merchant_code = '?';
(Substitua ? pelo código real do comerciante)

4 - Resultados Esperados
O registro deve ser recuperado com:
Coluna is_deleted definida como true.
Coluna termination_reason preenchida com o motivo selecionado.
Esse registro não deve mais aparecer nos resultados da Pesquisa de Comerciantes.

---------------------------------------------------------------------------

Análise dos Cenários de Teste em Relação ao Requisito

1. Verificar exibição da lista de "Motivos da rescisão"
Descrição no Requisito: 
"Verificar a Exibição da Lista de Motivos de Término" - Após desmarcar o checkbox "Active", a lista "Motivos da rescisão" deve ser exibida com os itens especificados.

Cenário Proposto: 
Verifica se, ao desmarcar "Active", a lista aparece e contém as razões listadas (200 - Customer Performance, 300 - Customer Fraud, etc.).

-----

2. Testar obrigatoriedade do campo "Motivos da rescisão"
Descrição no Requisito: 
"Testar a Obrigatoriedade do Campo" - Quando "Active" está desmarcado, selecionar um item da lista "Motivos da rescisão" deve ser obrigatório para salvar.

Cenário Proposto: Tenta salvar sem selecionar um motivo e espera uma mensagem de erro indicando que o campo é obrigatório.

Conclusão: O cenário reflete exatamente o que foi solicitado no passo 2 do requisito. Ele testa a obrigatoriedade do campo e a validação do sistema ao tentar salvar sem preenchê-lo.


3. Testar atualização do registro no banco de dados
Descrição no Requisito: 
"Testar a Funcionalidade e Atualização do Banco de Dados" - Selecionar um motivo, salvar e verificar no banco de dados se is_deleted = true e termination_reason contém o valor escolhido.

Cenário Proposto: 
Seleciona "300 - Customer Fraud", salva e verifica se o banco reflete is_deleted como verdadeiro e termination_reason com o valor correto. Inclui "Examples" para outros motivos.

Conclusão: O cenário está alinhado com o passo 3 do requisito. Ele cobre a funcionalidade de salvar o motivo e a atualização no banco de dados. A adição de "Examples" é opcional, 
mas útil para garantir que diferentes motivos sejam testados, embora o exemplo com "300 - Customer Fraud" já seja suficiente para validar o comportamento.


4. Verificar exclusão do Merchant na pesquisa
Descrição no Requisito: 
"Resultados Esperados" - O registro marcado como is_deleted = true não deve mais aparecer nos resultados da Pesquisa de Comerciantes.

Cenário Proposto: 
Após marcar um comerciante como "Deleted" e selecionar um motivo, verifica se ele não aparece na busca por comerciantes ativos.

Conclusão: 
Este cenário complementa o passo 4 do requisito e valida um resultado esperado importante. Ele está implícito no requisito original 
e é uma boa adição para garantir que a exclusão lógica funcione como esperado no sistema.


Considerações Gerais
Cobertura: 
Os quatro cenários cobrem todos os aspectos mencionados no requisito: exibição da lista, obrigatoriedade do campo, atualização no banco de dados e exclusão da pesquisa. 
Não há lacunas evidentes.

Clareza: 
Os cenários estão bem redigidos no formato Gherkin (Given/When/Then), o que facilita a execução manual ou até uma futura automação.


--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Feature: Add Termination Reason Field for Deleted Merchants
  As a user, I want to record the reason for merchant termination when a merchant is unmarked as Active, so that the rationale behind deactivations is properly documented.
  
  # 1 - Verificar que a lista "Termination Reason" não é exibida quando o Merchant não está desmarcado como "Active"
  Scenario: Verificar a não exibição da lista "Termination Reason" quando o status é "Active"
    Given que estou na página de configurações do Merchant
    When a opcao Active esta marcada
    Then a lista de "Termination Reason" não deve ser exibida
--> OK

  # 2. Verificar exibição da lista de Termination Reason
  Scenario Outline: Verificar exibição da lista "Termination Reason" quando o Merchant é desmarcado como "Active"
    Given que estou na página de configurações do Merchant
    When desmarco o checkbox "Active" no status do Merchant
    Then a lista de "Termination Reason" deve ser exibida
    And os itens da lista devem incluir as <"Razoes">
    
    Examples:
    | Razoes                     |
    | 200 - Customer Performance |
    | 300 - Customer Fraud       |
    | 400 - Merchant Fraud       |
    | 500 - UCC Filing          |
    | 600 - No Volume           |
    | 700 - Low Volume          |
    | 800 - Merchant Decision    |
    | 900 - Changed Platform     |
    | 000 - Other                |
--> OK

  # 3. Testar obrigatoriedade do campo Termination Reason
  Scenario: 3 - Verificar que o campo "Termination Reason" é obrigatório quando o status é "Desactived"
    Given que estou na página de configuracoes do Merchant
    When desmarco o checkbox "Active" sem selecionar um motivo na lista "Termination Reason"
    And tento salvar as informações do Merchant
    Then o sistema deve exibir uma mensagem de erro informando que o campo "Termination Reason" é obrigatório
--> OK

  # 4. Testar atualização do registro no banco de dados
  Scenario Outline: 4 - Verificar atualização do registro no banco de dados após selecionar um motivo de término
    Given que estou na página de Informações do Merchant com o status "Desactived"
    When seleciono o motivo <"Razao"> na lista "Termination Reason"
    And salvo as informações do Merchant
    Then o registro no banco de dados deve apresentar "is_deleted" como verdadeiro
    And o campo "termination_reason" deve conter o valor <"Razao">

    Examples:
    | Razao                      |
    | 200 - Customer Performance |
    | 300 - Customer Fraud       |
    | 400 - Merchant Fraud       |
    | 500 - UCC Filing          |
    | 600 - No Volume           |
    | 700 - Low Volume          |
    | 800 - Merchant Decision    |
    | 900 - Changed Platform     |
    | 000 - Other                |

  # 5. Verificar exclusão do Merchant na pesquisa
  Scenario: 5 - Verificar que o Merchant marcado como Desactived não é exibido na pesquisa
    Given que um Merchant foi marcado como "Desactived" e o motivo de término foi selecionado
    When realizo uma busca por Merchants ativos no portal
    Then o Merchant deletado não deve ser exibido nos resultados da pesquisa

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

1
Verifique que a lista 'Termination Reason' não é exibida quando o checkbox 'Active' está marcado na página de configurações do Merchant
Verify that the "Termination Reason" list is not displayed when the "Active" checkbox is checked on the Merchant settings page

2
Verifique que a lista 'Termination Reason' é exibida com todas as razões especificadas quando o checkbox 'Active' está desmarcado na página de configurações do Merchant
Verify that the "Termination Reason" list is displayed with all specified reasons when the "Active" checkbox is unchecked on the Merchant settings page

3
Verifique que o sistema exibe uma mensagem de erro indicando que o campo 'Termination Reason' é obrigatório ao tentar salvar com 'Active' marcado mas sem motivo selecionado
Verify that the system displays an error message indicating that the "Termination Reason" field is required when attempting to save with "Active" checked but no reason selected

4
Verifique que o registro no banco de dados é atualizado com 'is_active' como falso e 'termination_reason' correspondendo ao motivo selecionado após salvar as informações do Merchant
Verify that the database record is updated with "is_active" as false and "termination_reason" matching the selected reason after saving the Merchant information

5
Verifique que um Merchant marcado como 'Desactived' com um motivo de término selecionado não aparece nos resultados da busca por Merchants ativos no portal
Verify that a Merchant marked as "Deactivated" with a selected termination reason does not appear in the search results for active Merchants in the portal

6
Verifique se a reativação de um Comerciante atualiza o banco de dados e é registrada nos logs do Comerciante.
Verify that reactivating a Merchant updates the database and is recorded in the Merchant's logs




--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa2

| Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ |
| Progress Mobility | Verify that the "Termination Reason" list is not displayed when the "Active" checkbox is checked on the Merchant settings page |  | PASS |
| Progress Mobility | Verify that the "Termination Reason" list is displayed with all specified reasons when the "Active" checkbox is unchecked on the Merchant settings page |  | PASS |
| Progress Mobility | Verify that the system displays an error message indicating that the "Termination Reason" field is required when attempting to save with "Active" checked but no reason selected |  | PASS |
| Progress Mobility | Verify that the database record is updated with "is_deleted" as true and "termination_reason" matching the selected reason after saving the Merchant information |  | PASS |
| Progress Mobility | Verify that a Merchant marked as "Deactivated" with a selected termination reason does not appear in the search results for active Merchants in the portal |  | PASS |
| Progress Mobility | Verify that reactivating a Merchant updates the database and is recorded in the Merchant's logs. |  | PASS |

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa2

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in stg

| Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ |
| Progress Mobility | Verify that the "Termination Reason" list is not displayed when the "Active" checkbox is checked on the Merchant settings page |  | PASS |
| Progress Mobility | Verify that the "Termination Reason" list is displayed with all specified reasons when the "Active" checkbox is unchecked on the Merchant settings page |  | PASS |
| Progress Mobility | Verify that the system displays an error message indicating that the "Termination Reason" field is required when attempting to save with "Active" checked but no reason selected |  | PASS |
| Progress Mobility | Verify that the database record is updated with "is_deleted" as true and "termination_reason" matching the selected reason after saving the Merchant information |  | PASS |
| Progress Mobility | Verify that a Merchant marked as "Deactivated" with a selected termination reason does not appear in the search results for active Merchants in the portal |  | PASS |
| Progress Mobility | Verify that reactivating a Merchant updates the database and is recorded in the Merchant's logs. |  | PASS |

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in stg

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
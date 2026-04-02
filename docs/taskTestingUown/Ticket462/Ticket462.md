--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/servicing/-/issues/462

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Servicing | Display Protection Plan Infos on the Servicing and Origination portal

Synopsis
When making a new lease, the customer is offered the option to join the Protection Plan, so we need to display this in the Servicing and Origination Portals. 
These fields will not be editable, but should show the current status according to each customer's situation.

Business Objective
Provide the Agent and Merchant with access to the customer's decision regarding the Protection Plan.

Feature Request | Business Requirements
    Make a change in the front-end so that the Protection Plan section is displayed on both Origination and Servicing;
    The flag should not be editable in both portals
    Back-End should be able to update this flag, the whole fields. An activity log must
    Create a section below to Credit Card panel as shown in the mockup attached (video);
    The fields must accurately reflect the customer's current situation relative to the customer
    The error messages should be displayed below when the error status is enabled: {"ok":false,"errorCode":"Bad Request","error":"Failed Charge: Insufficient funds"}"

Here are the services :
servicing
GET /uown/svc/getProtectionPlanForAccount/{accountPk}
Sample response:
{
"protectionPlanPk": 57,
"leadPk": 8394,
"accountPk": 3696,
"optIn": true,
"alreadyCovered": false,
"error": null,
"status": "COMPLETED",
"enrollmentDate": "2025-04-12"
}
origination
Sample response:
GET uown/los/getProtectionPlanForLead/{leadPk}
{
"protectionPlanPk": 136,
"leadPk": 8394,
"accountPk": 3696,
"optIn": true,
"alreadyCovered": false,
"error": "Failed Charge: Insufficient funds",
"status": "ERROR",
"enrollmentDate": null
}    

davi marra @davimarrauownleasing

✅ Steps to Reproduce
On the Servicing Portal

Navigate to the Customer Information page.
    You should see the newly panel Protection Plan with the protection plan information.
    In this view, the data is read-only – no edit mode is available.

On the Origination Portal
    The protection plan information are now displayed inside a new panel called Protection Plan.
    In this view, the data is read-only – no edit mode is available.

-----

UOWN | Serviços | Exibição das Informações do Plano de Proteção nos portais de Serviços e Originação
Sinopse
Ao fazer um novo contrato de locação, o cliente recebe a opção de aderir ao Plano de Proteção, então precisamos exibir isso nos Portais de Serviços e Originação.
Esses campos não serão editáveis, mas devem mostrar o status atual de acordo com a situação de cada cliente.
Objetivo de Negócio
Fornecer ao Agente e ao Comerciante acesso à decisão do cliente referente ao Plano de Proteção.
Solicitação de Recurso | Requisitos de Negócio

Fazer uma alteração no front-end para que a seção do Plano de Proteção seja exibida tanto na Originação quanto nos Serviços;
A marcação não deve ser editável em ambos os portais
O Back-End deve ser capaz de atualizar esta marcação, todos os campos. Um registro de atividade deve ser criado
Criar uma seção abaixo do painel do Cartão de Crédito como mostrado no mockup anexado (vídeo);
Os campos devem refletir com precisão a situação atual do cliente em relação ao cliente
As mensagens de erro devem ser exibidas abaixo quando o status de erro estiver ativado: {"ok","errorCode":"Bad Request","error":"Failed Charge: Insufficient funds"}

Aqui estão os serviços:
Serviços
GET /uown/svc/getProtectionPlanForAccount/{accountPk}
Exemplo de resposta:
{
  "protectionPlanPk": 57,
  "leadPk": 8394,
  "accountPk": 3696,
  "optIn": true,
  "alreadyCovered": false,
  "error": null,
  "status": "COMPLETED",
  "enrollmentDate": "2025-04-12"
}

Origination
GET uown/los/getProtectionPlanForLead/{leadPk}
Exemplo de resposta:
{
  "protectionPlanPk": 136,
  "leadPk": 8394,
  "accountPk": 3696,
  "optIn": true,
  "alreadyCovered": false,
  "error": "Failed Charge: Insufficient funds",
  "status": "ERROR",
  "enrollmentDate": null
}

davi marra @davimarrauownleasing
✅ Passos para Reproduzir
No Portal de Serviços

Navegue até a página de Informações do Cliente.
Você deve ver o novo painel Plano de Proteção com as informações do plano de proteção.
Nesta visualização, os dados são somente leitura – nenhum modo de edição está disponível.

No Portal de Originação

As informações do plano de proteção agora são exibidas dentro de um novo painel chamado Plano de Proteção.
Nesta visualização, os dados são somente leitura – nenhum modo de edição está disponível.


Cenários possiveis
cliente adere ao plano de proteção selecionando sim na assinatura do contrato, deve exibir Opted In ativado nos portais Origination e Servicing
cliente NÃO adere ao plano de proteção selecionando não na assinatura do contrato, deve exibir Opted In desativado nos portais Origination e Servicing
Cliente assina dois contratos e o segundo o cliente já está protegido, opção aready covered exibe ativada
Cliente opta por aderir ao protection plan pelo portal website(customer)
fazer cenários para teste com status error e error description

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

📋 Requisito da Tarefa
Exibir as informações do plano de proteção no Portal de Origination e no Portal de Servicing. 
As informações devem ser somente leitura e refletir corretamente o status do cliente com relação ao plano de proteção, de acordo com a situação do cliente.


🧪 Cenários de Teste Gherkin


Scenario 1 – Verificar se as informações do plano de proteção são exibidas corretamente no Portal de Origination

Scenario: 1 - Verificar se as informações do plano de proteção são exibidas corretamente no Portal de Origination
  Given que o cliente tem um plano de proteção ativo
  When o agente acessa a página de informações do cliente no Portal de Origination
  Then o painel de "Plano de Proteção" deve ser exibido com as informações do plano de proteção
  And o campo "Opted In" deve estar exibido como "ativado" ou "desativado" conforme o status do cliente
  And o campo "Already Covered" deve refletir corretamente o status do plano de proteção

  🔍 Verifique se o painel Plano de Proteção é exibido corretamente no Portal de Origination, com o status Opted In, refletindo as informações corretas do cliente
  📝 Explicação: Este cenário valida que as informações do plano de proteção são exibidas corretamente no Portal de Origination, de acordo com o status do cliente.
  ✅ Resultado Esperado: O painel Plano de Proteção será exibido corretamente, com as informações de Opted In e Already Covered atualizadas.
  
-----
  
Scenario 2 – Verificar se as informações do plano de proteção são exibidas corretamente no Portal de Servicing

Scenario: 2 - Verificar se as informações do plano de proteção são exibidas corretamente no Portal de Servicing
  Given que o cliente tem um plano de proteção ativo
  When o agente acessa a página de informações do cliente no Portal de Servicing
  Then o painel de "Plano de Proteção" deve ser exibido com as informações do plano de proteção
  And o campo "Opted In" deve estar exibido como "ativado"

  	🔍 Verifique se o painel Plano de Proteção é exibido corretamente no Portal de Servicing, com o status Opted In, refletindo as informações corretas do cliente.
	📝 Explicação: Este cenário valida que as informações do plano de proteção são exibidas corretamente no Portal de Servicing, de acordo com o status do cliente.
	✅ Resultado Esperado: O painel Plano de Proteção será exibido corretamente, com as informações de Opted In e Already Covered atualizadas.

  -----

  Scenario 3 – Verificar o comportamento quando a conta do cliente não tem plano de proteção

  Scenario: 3 - Verificar o comportamento quando a conta do cliente não tem plano de proteção
  Given que o cliente não tem plano de proteção ativo
  When o comerciante acessa a página de informações do cliente no Portal de Origination
  Then o painel de "Plano de Proteção" deve ser exibido, mas o campo "Opted In" deve estar exibido como "desativado"
  And o campo "Already Covered" deve estar desativado
  And no Portal de Servicing, o painel de "Plano de Proteção" deve exibir os mesmos dados

  🔍 Verifique se o painel Plano de Proteção é exibido corretamente no Portal de Servicing e Origination, e se o campo Opted In está como desativado e o campo Already Covered também está desativado quando não há plano de proteção.
  📝 Explicação: Este cenário valida que, para contas sem plano de proteção, o painel será exibido com as informações desativadas nos dois portais.
  ✅ Resultado Esperado: O painel será exibido com Opted In desativado e Already Covered desativado.
  
-----

Scenario 4 – Verificar se a exibição do campo de erro quando há falha no pagamento do plano de proteção

Scenario: 4 - Verificar a exibição do campo de erro quando há falha no pagamento do plano de proteção
  Given que o cliente tentou se inscrever no plano de proteção e houve uma falha no pagamento
  When a requisição GET /uown/svc/getProtectionPlanForAccount/{accountPk} retorna o erro "Failed Charge: Insufficient funds"
  Then a mensagem de erro "Failed Charge: Insufficient funds" deve ser exibida abaixo do painel de "Plano de Proteção"

  🔍 Verifique se, houver problemas com o pagamento do plano de proteção falha e a mensagem de erro é retornada, ela é exibida corretamente no painel de Plano de Proteção nos dois portais
  📝 Explicação: Este cenário valida que a mensagem de erro é exibida corretamente quando o pagamento falha, impedindo a inscrição do plano de proteção.
  ✅ Resultado Esperado: A mensagem de erro "Failed Charge: Insufficient funds" deve ser exibida no painel de Plano de Proteção.

-----

Scenario 5 – Verificar se o erro de saldo insuficiente é exibido quando o cliente tenta aderir ao plano de proteção com saldo insuficiente

Scenario: 5 - Verificar se o erro de saldo insuficiente é exibido quando o cliente tenta aderir ao plano de proteção com saldo insuficiente
  Given que o cliente acessa o Portal do Cliente (Website)
  And o cliente tenta aderir ao plano de proteção com saldo insuficiente
  When o processo de adesão ao plano de proteção é iniciado
  Then o sistema deve retornar o erro "Failed Charge: Insufficient funds"
  And o painel do plano de proteção no Portal de Servicing deve exibir a mensagem de erro
  And o painel do plano de proteção no Portal de Origination deve exibir a mensagem de erro

🔍 Verifique se, ao tentar aderir ao plano de proteção sem saldo suficiente em website, o erro "Failed Charge: Insufficient funds" é exibido no Portal de Servicing e no Portal de Origination.
📝 Explicação: Esse cenário valida que, se o cliente não tiver saldo suficiente para o pagamento do plano de proteção, o erro é mostrado tanto no Portal de Servicing quanto no Portal de Origination.
✅ Resultado Esperado: O erro "Insufficient funds" será exibido no Portal de Servicing e Origination.
  
-----

Scenario 6 – Verificar se o plano de proteção é ativado quando o cliente tem saldo suficiente para a adesão

Scenario: 2 - Verificar se o plano de proteção é ativado quando o cliente tem saldo suficiente para a adesão
  Given que o cliente acessa o Portal do Cliente (Website)
  And o cliente tem saldo suficiente para aderir ao plano de proteção
  When o processo de adesão ao plano de proteção é concluído com sucesso
  Then o status do plano de proteção deve ser exibido como "Ativado"
  And o status deve ser atualizado para "Completed" no painel do plano de proteção no Portal de Servicing
  And o status deve ser atualizado para "Completed" no painel do plano de proteção no Portal de Origination

🔍 Verifique se, ao aderir ao plano de proteção com saldo suficiente em website, o status do plano de proteção será ativado e completado nos dois portais.
📝 Explicação: Este cenário valida que, quando o cliente tem saldo suficiente para o pagamento do plano, o status do plano de proteção será atualizado para "Ativado" e "Completed" tanto no Portal de Servicing quanto no Portal de Origination.
✅ Resultado Esperado: O plano de proteção será ativado e o status será completado nos dois portais.

-----

Scenario 7 – Verificar o comportamento no segundo lease, onde o cliente já está protegido, exibindo o status correto no painel de plano de proteção

Scenario: 7 - Verificar o comportamento no segundo lease, onde o cliente já está protegido, exibindo o status correto no painel de plano de proteção
  Given que o cliente assina o primeiro lease e opta por aderir ao plano de proteção
  And o cliente assina o segundo lease e o sistema identifica que o cliente já está protegido
  When o cliente acessa o Portal de Servicing
  Then o painel de "Plano de Proteção" deve exibir o campo "Opted In" como desativado
  And o painel de "Plano de Proteção" deve exibir o campo "Already Covered" como ativado
  And o painel de "Plano de Proteção" deve exibir a data de inscrição com a data da assinatura do segundo lease
  And o status do plano de proteção deve ser exibido como "Completed"
  And não deve haver descrição de erro no painel
  When o cliente acessa o Portal de Origination
  Then o painel de "Plano de Proteção" no Portal de Origination deve exibir as mesmas informações
  And o campo "Opted In" deve estar desativado
  And o campo "Already Covered" deve estar ativado
  And o campo "Enrollment Date" deve exibir a data da assinatura do segundo lease
  And o status do plano de proteção deve ser exibido como "Completed"
  And não deve haver descrição de erro no painel

🔍 Verifique se, ao assinar o primeiro lease com o plano de proteção e assinar o segundo lease já protegido, o status da proteção é corretamente atualizado e exibido como "Completed" tanto no Portal de Servicing quanto no Portal de Origination.
📝 Explicação: Esse cenário valida que o segundo lease do cliente, onde ele já está protegido, mostra os status corretos no painel de plano de proteção, com Opted In desativado, Already Covered ativado, e a data de inscrição sendo a data do segundo lease, sem erros.
✅ Resultado Esperado: No Portal de Servicing e Origination, o campo Opted In será desativado, o campo Already Covered será ativado, a data de inscrição será a do segundo lease, o status será "Completed", e não haverá erro.

Frase de Verificação para Evidenciar a Tarefa
Verifique se, ao assinar o primeiro lease com plano de proteção e assinar o segundo lease, o status do plano de proteção é exibido corretamente, com Opted In desativado, Already Covered ativado, data de inscrição igual à do segundo lease, status "Completed", e sem descrição de erro, tanto no Portal Origination quanto no Portal  Servicing

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
Verifique se o painel Plano de Proteção é exibido corretamente no Portal de Origination, com o status Opted In, refletindo as informações corretas do clienteVerifique se o painel Plano de Proteção é exibido corretamente no Portal de Servicing, com o status Opted In, refletindo as informações corretas do cliente
Verify if the Protection Plan panel is displayed correctly in the Origination Portal, with the Opted In status, reflecting the correct customer information

Verifique se o painel Plano de Proteção é exibido corretamente no Portal de Servicing, com o status Opted In, refletindo as informações corretas do cliente
Verify if the Protection Plan panel is displayed correctly in the Servicing Portal, with the Opted In status, reflecting the correct customer information

Verifique se o painel Plano de Proteção é exibido corretamente no Portal de Servicing e Origination, e se o campo Opted In está como desativado e o campo Already Covered também está desativado quando não há plano de proteção
Verify if the Protection Plan panel is displayed correctly in both Servicing and Origination Portals, and if the Opted In field is disabled and the Already Covered field is also disabled when there is no protection plan

Verifique se, houver problemas com o pagamento do plano de proteção falha e a mensagem de erro é retornada, ela é exibida corretamente no painel de Plano de Proteção nos dois portais
Verify if, when there are problems with the protection plan payment failure and an error message is returned, it is correctly displayed in the Protection Plan panel in both portals

Verifique se, ao tentar aderir ao plano de proteção sem saldo insuficiente em website, o erro "Failed Charge: Insufficient funds" é exibido no Portal de Servicing
Verify if, when attempting to join the protection plan without sufficient funds on the website, the error "Failed Charge: Insufficient funds" is displayed in the Servicing Portal

Verifique se, ao aderir ao plano de proteção com saldo suficiente em website, o status do plano de proteção será ativado no portal Servicing
Verify if, when joining the protection plan with sufficient funds on the website, the protection plan status will be activated and completed in both portalsRetryClaude can make mistakes. Please double-check responses

Verifique se, ao assinar o primeiro lease com plano de proteção e assinar o segundo lease, o status do plano de proteção é exibido corretamente, com Opted In desativado, Already Covered ativado, data de inscrição igual à do segundo lease, status "Completed", e sem descrição de erro, tanto no Portal Origination quanto no Portal  Servicing
Verify that, when signing the first lease with a protection plan and signing the second lease, the protection plan status is displayed correctly, with Opted In disabled, Already Covered enabled, enrollment date the same as the second lease, status "Completed", and no error description, both in the Origination Portal and in the Servicing Portal

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa1

| LeadPk/Accountpk | Merchant | Test Case | Test Data | Status | Observation |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 8780 | Tire Agent | Verify if the Protection Plan panel is displayed correctly in the Origination Portal, with the Opted In status, reflecting the correct customer information |  | PASS |  |
| 3847 | Tire Agent | Verify if the Protection Plan panel is displayed correctly in the Servicing Portal, with the Opted In status, reflecting the correct customer information |  | PASS |  |
| 8781-8783/3848-3849 | Tire Agent | Verify if the Protection Plan panel is displayed correctly in both Servicing and Origination Portals, and if the Opted In field is disabled and the Already Covered field is also disabled when there is no protection plan |  | PASS | -- |
| 8784/3850 | Tire Agent | Verify if, when there are problems with the protection plan payment failure and an error message is returned, it is correctly displayed in the Protection Plan panel in both portals |  | PASS | -- |
| X | X | Verify if, when attempting to join the protection plan without sufficient funds on the website, the error "Failed Charge: Insufficient funds" is displayed in the Servicing Portal and in the Origination Portal |  | WIP | Waiting for adjustment in another task to test the scenario |
| X | X | Verify if, when joining the protection plan with sufficient funds on the website, the protection plan status will be activated and completed in both portalsRetryClaude can make mistakes. Please double-check responses |  | WIP |  |
| 8775-8776/3862-3863 | Tire Agent | Verify that, when signing the first lease with a protection plan and signing the second lease, the protection plan status is displayed correctly, with Opted In disabled, Already Covered enabled, enrollment date the same as the second lease, status "Completed", and no error description, both in the Origination Portal and in the Servicing Portal |  | PASS | -- |


Tests in qa1

| LeadPk/Accountpk | Merchant | Test Case | Test Data | Status | Observation |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 8780 | Tire Agent | Verify if the Protection Plan panel is displayed correctly in the Origination Portal, with the Opted In status, reflecting the correct customer information | ![qa1-462-c1_1_](/uploads/89aeb16179bfdcfff20d6fc1513c9913/qa1-462-c1_1_.png){width=1009 height=738}![qa1-462-c1_2_](/uploads/4c8eb43bc2598d6afbdde0287225e418/qa1-462-c1_2_.png){width=1425 height=738} | PASS | -- |
| 3847 | Tire Agent | Verify if the Protection Plan panel is displayed correctly in the Servicing Portal, with the Opted In status, reflecting the correct customer information | ![qa1-462-c2_1_](/uploads/e638e438bb6f33d365946d23da4d386a/qa1-462-c2_1_.png){width=1425 height=738} | PASS | -- |
| 8781-8783/3848-3849 | Tire Agent | Verify if the Protection Plan panel is displayed correctly in both Servicing and Origination Portals, and if the Opted In field is disabled and the Already Covered field is also disabled when there is no protection plan | ![qa1-462-c3_1_](/uploads/5370e73840099883103197c61278a944/qa1-462-c3_1_.png){width=1011 height=738}![qa1-462-c3_2_](/uploads/ae4d20717ce2204f13a4443df3f20b72/qa1-462-c3_2_.png){width=1426 height=738}![qa1-462-c3_3_](/uploads/c2c7469b457e45df27052159905f3314/qa1-462-c3_3_.png){width=1426 height=738} | PASS | -- |
| 8784/3850 | Tire Agent | Verify if, when there are problems with the protection plan payment failure and an error message is returned, it is correctly displayed in the Protection Plan panel in both portals | ![qa1-462-c4_1_](/uploads/7c763404e242ffcc3939c6b3b2b12f7f/qa1-462-c4_1_.png){width=1434 height=741}![qa1-462-c4_2_](/uploads/0c819adaf5734144c6299b3c0e527aaa/qa1-462-c4_2_.png){width=1434 height=741}![qa1-462-c4_3_](/uploads/e8c03800ae366f92be83454b1c4eff2b/qa1-462-c4_3_.png){width=1434 height=741}![qa1-462-c4_4_](/uploads/22e3a5c65872e46c73c0e10911f9df54/qa1-462-c4_4_.png){width=1434 height=741}![qa1-462-c4_5_](/uploads/a6240b3274272ed21273a665b83f4f47/qa1-462-c4_5_.png){width=1434 height=741}![qa1-462-c4_6_](/uploads/ebefb70b3a3c31df86b2d34ef46f1457/qa1-462-c4_6_.png){width=1434 height=741}![qa1-462-c4_7_](/uploads/6d6aaae10ad3461cdc1dbb9a78d62dfc/qa1-462-c4_7_.png){width=1434 height=741}![qa1-462-c4_8_](/uploads/6d2046227bd8349aeb9a272a86d265c2/qa1-462-c4_8_.png){width=1434 height=741}![qa1-462-c4_9_](/uploads/e3ce6401f46136b1500761b489dfc54e/qa1-462-c4_9_.png){width=1434 height=741}![qa1-462-c4_10_](/uploads/8d36a083dbcd01223e2bac4be0ad480d/qa1-462-c4_10_.png){width=1434 height=741}![qa1-462-c4_11_](/uploads/338018e6b6380a3b628057b6e88ea184/qa1-462-c4_11_.png){width=1434 height=741}![qa1-462-c4_12_](/uploads/32f91c132a8aba29051bbd818a9aba06/qa1-462-c4_12_.png){width=1434 height=741}![qa1-462-c4_13_](/uploads/1637fc626c7ed695a1141b698820d2bb/qa1-462-c4_13_.png){width=1434 height=741}![qa1-462-c4_14_](/uploads/d0c0912771712eec5d5fa93e18d75a9f/qa1-462-c4_14_.png){width=1434 height=741}![qa1-462-c4_15_](/uploads/1be0f3f38b8613c343e01faab45b1811/qa1-462-c4_15_.png){width=1434 height=741}![qa1-462-c4_16_](/uploads/47f2b8f8ef36778fc7bb5ab684fc8012/qa1-462-c4_16_.png){width=1434 height=741}![qa1-462-c4_17_](/uploads/8a1faf36e1bb4b793943391b8991e8c6/qa1-462-c4_17_.png){width=1434 height=741}![qa1-462-c4_18_](/uploads/f574554675ec73a08f66b9313c3fffdb/qa1-462-c4_18_.png){width=1434 height=741}![qa1-462-c4_19_](/uploads/6dca0d7421f931a532001d3df671cf9b/qa1-462-c4_19_.png){width=1434 height=741}![qa1-462-c4_20_](/uploads/1bf577bc9999e458511aa4dfeda2378a/qa1-462-c4_20_.png){width=1434 height=741} | PASS | -- |
| X | X | Verify if, when attempting to join the protection plan without sufficient funds on the website, the error "Failed Charge: Insufficient funds" is displayed in the Servicing Portal and in the Origination Portal |  | WIP | Waiting for adjustment in another task to test the scenario |
| X | X | Verify if, when joining the protection plan with sufficient funds on the website, the protection plan status will be activated and completed in both portals |  | WIP | Waiting for adjustment in another task to test the scenario |
| 8775-8776/3862-3863 | Tire Agent | Verify that, when signing the first lease with a protection plan and signing the second lease, the protection plan status is displayed correctly, with Opted In disabled, Already Covered enabled, enrollment date the same as the second lease, status "Completed", and no error description, both in the Origination Portal and in the Servicing Portal |  | PASS | -- |

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Erro cenários 5 e 6

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

stg

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Scenarios:
1 Opted In (covered):

Opted In (true)
Already Cover (true)
Enrollment Date (date)
Status (Completed)
Error Description (null)

2 Opted In (not covered):

Opted In (true)
Not Covered (false)
Enrollment Date (date)
Status (Pending)
Error Description (null)

3 Opted Out (not covered):

Opted Out (true)
Not Covered (false)
Enrollment Date (null)
Status (null)
Error Description (null)

4 Opten Out ( not covered)

Opted Out (true)
Not covered (false)
Enrollment Date (date)
Status (Cancelled)
Error Description (null)

5 Opted In (Error):

Opted In (true)
Not covered (false)
Enrollment Date (date)
Status (Error)
Error Description (Description)
* The error messages should be displayed below when the error status is enabled: {"ok":false,"errorCode":"Bad Request","error":"Failed Charge: Insufficient funds"}"

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

1. Cliente assina aderindo ao plano de proteção:

Scenario: 1 - Cliente assina aderindo ao plano de proteção
  Given que o cliente assina o contrato aderindo ao plano de proteção
  When o agente acessa o Portal de Servicing
  Then o painel "Plano de Proteção" no Portal de Servicing deve exibir "Opted In" como ativado
  And o painel "Plano de Proteção" no Portal de Origination deve exibir "Opted In" como ativado
  And o campo "Already Covered" deve ser exibido como ativado
  And o campo "Enrollment Date" deve exibir a data da assinatura
  And o status deve ser exibido como "Completed"
  And não deve haver descrição de erro
  And verifique nos logs e no banco de dados que a alteração foi registrada corretamente

Verifique se o cliente que aderiu ao plano de proteção tem o status "Opted In" como ativado nos portais Servicing e Origination, com o campo "Already Covered" desativado e o status "Completed".
Erro -> o campo "Already Covered" exibido como desativado
-----

2. Cliente assina não aderindo ao plano de proteção:

Scenario: 2 - Cliente assina não aderindo ao plano de proteção
  Given que o cliente assina o contrato não aderindo ao plano de proteção
  When o agente acessa o Portal de Servicing
  Then o painel "Plano de Proteção" no Portal de Servicing deve exibir "Opted In" como desativado
  And o painel "Plano de Proteção" no Portal de Origination deve exibir "Opted In" como desativado
  And o campo "Already Covered" deve estar desativado
  And o campo "Enrollment Date" deve ser nulo
  And o status deve ser exibido como "Completed"
  And verifique nos logs e no banco de dados que a alteração foi registrada corretamente

Verifique se o cliente que não aderiu ao plano de proteção tem o status "Opted In" como desativado nos portais Servicing e Origination, com o campo "Already Covered" desativado.

-----

3. Cliente tenta aderir ao plano de proteção ao assinar o contrato, mas recebe erro devido a problemas no cartão:

Scenario: 3 - Cliente tenta aderir ao plano de proteção, mas recebe erro devido a problemas no cartão
  Given que o cliente tenta aderir ao plano de proteção ao assinar o contrato
  And o cliente tem problemas no pagamento (erro de cartão)
  When a requisição GET /uown/svc/getProtectionPlanForAccount/{accountPk} retorna erro
  Then o painel "Plano de Proteção" no Portal de Servicing deve exibir a mensagem de erro
  And o painel "Plano de Proteção" no Portal de Origination deve exibir a mesma mensagem de erro
  And verifique nos logs e no banco de dados que a falha foi registrada corretamente

Verifique se, ao tentar aderir ao plano de proteção e ocorrer um erro, a mensagem de erro é exibida corretamente nos portais Servicing e Origination, e que a falha é registrada no banco de dados e logs.

-----

4. Cliente adere ao plano de proteção pelo Portal Website:

Scenario: 4 - Cliente adere ao plano de proteção pelo Portal Website
  Given que o cliente acessa o Portal do Cliente (Website)
  And o cliente opta por aderir ao plano de proteção
  When o cliente preenche os dados de pagamento e a requisição POST /enrollAccountInProtectionPlan é enviada com sucesso
  Then o status "Opted In" deve ser exibido como ativado nos portal Servicing
  And o status deve ser exibido como "Completed"
  And o campo "Enrollment Date" deve exibir a data da adesão
  And o campo "Error Description" deve estar vazio
  And verifique nos logs e no banco de dados que a adesão foi registrada corretamente

Verifique se, ao aderir ao plano de proteção pelo Portal Website, o status "Opted In" é ativado corretamente no portal Servicing e que a data de adesão é registrada.

-----

5. Cliente tenta aderir ao plano de proteção em Website, mas recebe erro devido a problemas no cartão:

Scenario: 5 - Cliente tenta aderir ao plano de proteção no Portal Website, mas recebe erro devido a problemas no cartão
  Given que o cliente tenta aderir ao plano de proteção no Portal Website
  And o cliente tem problemas no pagamento (erro de cartão)
  When a requisição POST /enrollAccountInProtectionPlan retorna o erro "Failed Charge: Insufficient funds"
  Then o painel "Plano de Proteção" no Portal de Servicing deve exibir a mensagem de erro "Failed Charge: Insufficient funds"
  And o painel "Plano de Proteção" no Portal de Origination deve exibir a mesma mensagem de erro
  And verifique nos logs e no banco de dados que a falha foi registrada corretamente

Verifique se o erro "Saldo Insuficiente" é exibido corretamente no Portal Servicing e Origination quando o cliente tenta aderir ao plano de proteção no Portal Website e não tem saldo suficiente.

-----

6. Cliente assina primeiro contrato aderindo ao plano de proteção e vai assinar outro contrato:

Scenario: 6 - Verificar comportamento quando cliente já está protegido e assina novo contrato
  Given que o cliente assina o primeiro lease aderindo ao plano de proteção
  And o cliente assina o segundo lease e o sistema identifica que o cliente já está protegido
  When o agent acessa o Portal de Servicing
  Then o painel "Plano de Proteção" no Portal de Servicing deve exibir "Opted In" como desativado
  And o campo "Already Covered" deve ser ativado
  And verifique nos logs e no banco de dados que a alteração foi registrada corretamente
  When o agente acessa o Portal de Origination
  Then o painel "Plano de Proteção" no Portal de Origination deve exibir as mesmas informações
  And o campo "Opted In" deve estar desativado
  And o campo "Already Covered" deve estar ativado

Verifique se, ao assinar o primeiro contrato com o plano de proteção e o segundo contrato já com o cliente protegido, o status do plano de proteção é atualizado corretamente nos portais Servicing e Origination.

-----

Scenario Outline 7 -  Verificar o comportamento do status "Pending" e sua atualização após a finalização do processo de adesão

Scenario Outline: Verificar o comportamento do status "Pending" quando o cliente inicia a assinatura, mas não finaliza o contrato
  Given que o cliente inicia a assinatura do contrato e opta por aderir ao plano de proteção
  When o agente ou comerciante acessa o Portal Origination
  Then o painel "Plano de Proteção" no Portal Origination deve exibir "Opted In" como "<optedInStatus>"
  And o campo "Already Covered" deve ser desativado
  And o campo "Enrollment Date" deve ser igual à data do início da assinatura
  And o status deve ser "<status>"
  And verifique nos logs e no banco de dados que o status "<status>" foi registrado corretamente
  When o cliente finaliza a assinatura do contrato
  Then o status no painel de "Plano de Proteção" deve ser atualizado para "<finalStatus>"
  And verifique nos logs e no banco de dados que a alteração de status foi registrada corretamente

Examples:
  | optedInStatus | status   | finalStatus |
  | desativado    | Pending  | Completed   |

"Verifique se, ao iniciar a assinatura do contrato e não finalizá-la, o status do plano de proteção é exibido como 'Pending' nos portais Servicing e Origination, e que, ao finalizar a assinatura, o status é atualizado para 'Completed' ou 'Error', conforme o caso, com a data de adesão registrada corretamente, e se os logs e o banco de dados refletem corretamente as alterações de status."

-----

Scenario 8 – Verificar se o painel do plano de proteção não é exibido quando o merchant não oferece o plano de proteção

Scenario: 8 - Verificar se o painel do plano de proteção não é exibido quando o merchant não oferece o plano de proteção
  Given que o Merchant configurou o plano de proteção como "false" nas configurações
  When o usuário acessa o Portal de Servicing
  Then o painel "Plano de Proteção" não deve ser exibido no Portal de Servicing
  When o usuário acessa o Portal de Origination
  Then o painel "Plano de Proteção" não deve ser exibido no Portal de Origination
  And verifique nos logs que o painel não foi exibido no Servicing e Origination
  And verifique no banco de dados que as configurações do Merchant indicam "false" para o plano de proteção

🔍 Verifique se, quando o merchant não oferece o plano de proteção (configuração false), o painel de Plano de Proteção não é exibido em nenhum dos portais (Servicing e Origination).
📝 Explicação: Este cenário valida que, quando o Merchant desativa a oferta do plano de proteção, o painel de plano de proteção não deve ser mostrado para o usuário em nenhum portal.
✅ Resultado Esperado: O painel do plano de proteção não deve ser exibido em Servicing e Origination. Os logs e banco de dados devem confirmar que o painel não foi exibido.

-----

Scenario 9 – Verificar o comportamento após fechar o navegador no meio da assinatura e reabrir o link

Scenario: 9 - Verificar o comportamento após fechar o navegador no meio da assinatura e reabrir o link
  Given que o cliente iniciou a assinatura do contrato e optou por aderir ao plano de proteção
  And o cliente fechou o navegador antes de concluir a assinatura
  When o cliente reabre o link do contrato
  And o agente acessa o Portal de Servicing
  Then o painel "Plano de Proteção" no Portal de Servicing deve exibir "Opted In" com o status correspondente à escolha do cliente
  And o campo "Already Covered" deve refletir corretamente a situação de cobertura do cliente
  And o campo "Enrollment Date" deve ser exibido sem preenchimento
  And o status deve ser "Pending", pois o processo de adesão não foi concluído
  And verifique nos logs e no banco de dados que o status "Pending" foi registrado corretamente
  When o cliente acessa o Portal de Origination
  Then o painel "Plano de Proteção" no Portal de Origination deve exibir as mesmas informações
  And o campo "Opted In" deve exibir o status correspondente à escolha do cliente
  And o campo "Already Covered" deve refletir a situação de cobertura do cliente
  And o campo "Enrollment Date" deve ser exibido sem preenchimento
  And o status deve ser "Pending"
  And verifique nos logs e no banco de dados que o status "Pending" foi registrado corretamente

  When o cliente finaliza a assinatura do contrato
  Then o status no painel de "Plano de Proteção" deve ser atualizado para "Completed" ou "Error", dependendo do retorno da requisição
  And verifique nos logs e no banco de dados que a alteração de status foi registrada corretamente

Verifique se, ao fechar o navegador no meio da assinatura e reabrir o link do contrato, o status "Pending" é exibido corretamente nos portais Servicing e Origination, com "Opted In" e "Already Covered" refletindo a situação atual de acordo com a escolha do cliente, e a data de adesão corretamente refletida.

-----

Scenario Outline 10 – Verificar o comportamento do banner de proteção quando o cliente altera o email no Servicing e acessa o Portal Website

Scenario Outline 10 - Verificar o comportamento do banner de proteção quando o cliente altera o email no Servicing e acessa o Portal Website com o novo email
  Given que o cliente tem o status de proteção "<protectionStatus>"
  And o agente altera o email do cliente no Portal de Servicing
  When o cliente acessa o Portal Website com o novo email
  Then o cliente deve conseguir logar com o novo email
  And o painel "Plano de Proteção" no Portal Website deve "<bannerStatus>"
  And verifique nos logs e no banco de dados que a alteração de email foi registrada corretamente
  And verifique nos logs e no banco de dados que o status de proteção do cliente é "<protectionStatus>"

Examples:
  | protectionStatus | bannerStatus                   |
  | Protegido        | não ser exibido                |
  | Não Protegido    | ser exibido                    |

"Verifique se, ao alterar o email do cliente no Portal Servicing e acessar o Portal Website com o novo email, o banner de proteção será exibido ou não, dependendo do status de proteção do cliente, sendo não exibido quando o cliente estiver protegido e exibido quando o cliente não estiver protegido, e se a alteração de email for corretamente registrada nos logs e no banco de dados."

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verifique se o cliente que aderiu ao plano de proteção tem o status "Opted In" como ativado nos portais Servicing e Origination, com o campo "Already Covered" desativado e o status "Completed"
Verify if the customer who joined the protection plan has the "Opted In" status activated in both Servicing and Origination portals, with the "Already Covered" field deactivated and the status "Completed"

Verifique se o cliente que não aderiu ao plano de proteção tem o status "Opted In" como desativado nos portais Servicing e Origination, com o campo "Already Covered" desativado
Verify if the customer who did not join the protection plan has the "Opted In" status deactivated in both Servicing and Origination portals, with the "Already Covered" field deactivated

Verifique se, ao tentar aderir ao plano de proteção e ocorrer um erro, a mensagem de erro é exibida ao cliente
Verify if, when trying to join the protection plan and an error occurs, the error message is correctly displayed in both Servicing and Origination portals, and that the failure is recorded in the database and logs

Verifique se, ao aderir ao plano de proteção pelo Portal Website, o status "Opted In" é ativado corretamente no portal Servicing e que a data de adesão é registrada
Verify if, when joining the protection plan through the Website Portal, the "Opted In" status is correctly activated in the Servicing portal and that the enrollment date is recorded

Verifique se o erro "Saldo Insuficiente" é exibido corretamente no Portal Servicing e Origination quando o cliente tenta aderir ao plano de proteção no Portal Website e não tem saldo suficiente
Verify if the "Insufficient Funds" error is correctly displayed in the Servicing and Origination Portals when the customer tries to join the protection plan in the Website Portal and doesn't have sufficient funds

Verifique se, ao assinar o primeiro contrato com o plano de proteção e o segundo contrato já com o cliente protegido, o status do plano de proteção é atualizado corretamente nos portais Servicing e Origination
Verify if, when signing the first contract with the protection plan and the second contract with the customer already protected, the protection plan status is correctly updated in both Servicing and Origination portals

Verifique se, ao iniciar a assinatura do contrato e não finalizá-la, o status do plano de proteção é exibido como 'Pending' nos portais Servicing e Origination, e que, ao finalizar a assinatura, o status é atualizado para 'Completed' ou 'Error', conforme o caso, com a data de adesão registrada corretamente, e se os logs e o banco de dados refletem corretamente as alterações de status
Verify if, when starting the contract signing and not finishing it, the protection plan status is displayed as 'Pending' in both Servicing and Origination portals, and that, when finishing the signing, the status is updated to 'Completed' or 'Error', as applicable, with the enrollment date correctly recorded, and if the logs and database correctly reflect the status changes

Verifique se, quando o merchant não oferece o plano de proteção (configuração false), o painel de Plano de Proteção não é exibido em nenhum dos portais (Servicing e Origination)
Verify if, when the merchant does not offer the protection plan (configuration false), the Protection Plan panel is not displayed in either portal (Servicing and Origination)

Verifique se, ao fechar o navegador no meio da assinatura e reabrir o link do contrato, o status "Pending" é exibido corretamente nos portais Servicing e Origination, com "Opted In" e "Already Covered" refletindo a situação atual de acordo com a escolha do cliente, e a data de adesão corretamente refletida
Verify if, when closing the browser in the middle of signing and reopening the contract link, the "Pending" status is correctly displayed in both Servicing and Origination portals, with "Opted In" and "Already Covered" reflecting the current situation according to the customer's choice, and the enrollment date correctly reflected

Verifique se, ao alterar o email do cliente no Portal Servicing e acessar o Portal Website com o novo email, o banner de proteção será exibido ou não, dependendo do status de proteção do cliente, sendo não exibido quando o cliente estiver protegido e exibido quando o cliente não estiver protegido, e se a alteração de email for corretamente registrada nos logs e no banco de dados
Verify if, when changing the customer's email in the Servicing Portal and accessing the Website Portal with the new email, the protection banner will be displayed or not, depending on the customer's protection status, not being displayed when the customer is protected and displayed when the customer is not protected, and if the email change is correctly recorded in the logs and database

Verify that when the invoice is cancelled, the protection plan is also cancelled and the status is updated to "Canceled" in the Maintenance and Origination portals
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa1

| LeadPk/AccountPk | Merchant | Test Case | Test Data | Status |
| ------ | -------- | --------- | --------- | ------ |
| 3897 | Progress Mobility | Verify if the customer who joined the protection plan has the "Opted In" status activated in both Servicing and Origination portals, with the "Already Covered" field deactivated and the status "Completed" |  | PASS |
| 3899 | Progress Mobility | Verify if the customer who did not join the protection plan has the "Opted In" status deactivated in both Servicing and Origination portals, with the "Already Covered" field deactivated |  | PASS |
| 3900 | Progress Mobility | Verify if, when trying to join the protection plan and an error occurs, the error message is correctly displayed in both Servicing and Origination portals, and that the failure is recorded in the database and logs |  | PASS |
| 3888 | Progress Mobility | Verify if, when joining the protection plan through the Website Portal, the "Opted In" status is correctly activated in the Servicing portal and that the enrollment date is recorded |  | PASS |
| 3912 | Progress Mobility | Verify if the "Insufficient Funds" error is correctly displayed in the Servicing and Origination Portals when the customer tries to join the protection plan in the Website Portal and doesn't have sufficient funds |  | PASS |
| 8915/3905 | Progress Mobility | Verify if, when signing the first contract with the protection plan and the second contract with the customer already protected, the protection plan status is correctly updated in both Servicing and Origination portals |  | PASS |
| 8917 | Progress Mobility | Verify if, when starting the contract signing and not finishing it, the protection plan status is displayed as 'Pending' in both Servicing and Origination portals, and that, when finishing the signing, the status is updated to 'Completed' or 'Error', as applicable, with the enrollment date correctly recorded, and if the logs and database correctly reflect the status changes |  | PASS |
| 8919/3908 | Progress Mobility | Verify if, when the merchant does not offer the protection plan (configuration false), the Protection Plan panel is not displayed in either portal (Servicing and Origination) |  | PASS |
| 8925 | Progress Mobility | Verify if, when closing the browser in the middle of signing and reopening the contract link, the "Pending" status is correctly displayed in both Servicing and Origination portals, with "Opted In" and "Already Covered" reflecting the current situation according to the customer's choice, and the enrollment date correctly reflected |  | PASS |
| 8924 | Progress Mobility | Verify if, when changing the customer's email in the Servicing Portal and accessing the Website Portal with the new email, the protection banner will be displayed or not, depending on the customer's protection status, not being displayed when the customer is protected and displayed when the customer is not protected, and if the email change is correctly recorded in the logs and database |  | PASS |
| 8929 | Progress Mobility | Verify that when the invoice is cancelled, the protection plan is also cancelled and the status is updated to "Canceled" in the Maintenance and Origination portals |  | PASS |

Tests in qa1

Tests in qa1

| LeadPk/AccountPk | Merchant | Test Case | Test Data | Status |
| ------ | -------- | --------- | --------- | ------ |
| 3897 | Pogress Mobility | Verify if the customer who joined the protection plan has the "Opted In" status activated in both Servicing and Origination portals, with the "Already Covered" field deactivated and the status "Completed" | ![qa1-462-c1_1_](/uploads/56e633148c6e3efca8fa25c209930084/qa1-462-c1_1_.png){width=303 height=638}![qa1-462-c1_2_](/uploads/cf7c475d7239de1ef57a2649116db65f/qa1-462-c1_2_.png){width=1425 height=741}![qa1-462-c1_3_](/uploads/a1599171a757a5cfc0fe512382bc1a00/qa1-462-c1_3_.png){width=1425 height=741} | PASS |
| 3899 | Pogress Mobility | Verify if the customer who did not join the protection plan has the "Opted In" status deactivated in both Servicing and Origination portals, with the "Already Covered" field deactivated | ![qa1-462c2_1_](/uploads/371dcb1dffddfa639851a8e654163bf4/qa1-462c2_1_.png){width=1425 height=741}![qa1-462c2_2_](/uploads/b39b0f8f7d41252106d6f285ceff85ae/qa1-462c2_2_.png){width=1425 height=741}![qa1-462c2_3_](/uploads/0375dfc3e37f600797e5036462f5227f/qa1-462c2_3_.png){width=1014 height=43}![qa1-462c2_4_](/uploads/55a45e1ca405d259c187d1980303b453/qa1-462c2_4_.png){width=1425 height=741}![qa1-462c2_5_](/uploads/113235b9af97aba573f6f75d56e693ad/qa1-462c2_5_.png){width=1425 height=741}![qa1-462c2_6_](/uploads/de6a52f0ecbe746daefd0ed4a1583e7c/qa1-462c2_6_.png){width=1083 height=43} | PASS |
| 3900 | Pogress Mobility | Check whether, when trying to subscribe to the protection plan when signing the contract and an error occurs, the error message is displayed correctly in the Servicing and Origination portals, and whether the failure is recorded in the database and logs. | ![qa1-462-c3_CvvFailure_1__](/uploads/ed1da86f1858516f135fdeb89fdf8921/qa1-462-c3_CvvFailure_1__.png){width=1435 height=741}![qa1-462-c3_CvvFailure_2__](/uploads/e5a41e35425c910b30131aee2ee79354/qa1-462-c3_CvvFailure_2__.png){width=1435 height=741}![qa1-462-c3_CvvFailure_3__](/uploads/d7dc9317208dcdb70655b962a87bc511/qa1-462-c3_CvvFailure_3__.png){width=1434 height=741}![qa1-462-c3_CvvFailure_4__](/uploads/890aec0e0d172f8300582dbf412da576/qa1-462-c3_CvvFailure_4__.png){width=1435 height=741}![qa1-462-c3_CvvFailure_5__](/uploads/ef45fa4d4a0a07badfec8b0873feea7c/qa1-462-c3_CvvFailure_5__.png){width=1435 height=741}![qa1-462-c3_CvvFailure_6__](/uploads/b2c61a7ce13f4315a3b53f95a5ba12ac/qa1-462-c3_CvvFailure_6__.png){width=1435 height=741}![qa1-462-c3_CvvFailure_7__](/uploads/d8510d9429f0c7e8e06388e2e63842b3/qa1-462-c3_CvvFailure_7__.png){width=1434 height=741}![qa1-462-c3_CvvFailure_8__](/uploads/aea1274b9164db01b39ad3a78c9fa68e/qa1-462-c3_CvvFailure_8__.png){width=1156 height=60}![qa1-462-c3_CvvFailure_9__](/uploads/948681de5480e770c8f49ce373d0bc99/qa1-462-c3_CvvFailure_9__.png){width=1434 height=741}![qa1-462-c3_CvvFailure_10__](/uploads/7f2d5fd6b2cfd4f87e4be652174f254f/qa1-462-c3_CvvFailure_10__.png){width=1434 height=741}![qa1-462-c3_CvvFailure_11__](/uploads/f3fe0371924b2a966aa9b02c64d7cc16/qa1-462-c3_CvvFailure_11__.png){width=1156 height=60}![qa1-462-c3_CvvFailure_12__](/uploads/7bb12f633ced6f71d1bde01eeaef8029/qa1-462-c3_CvvFailure_12__.png){width=1108 height=220}![qa1-462-c3InsuficientFunds_1__](/uploads/e89a5266dfa2da4283e447b4665e6f22/qa1-462-c3InsuficientFunds_1__.png){width=663 height=741}![qa1-462-c3InsuficientFunds_2__](/uploads/790ec32d050601611d22522de86eb561/qa1-462-c3InsuficientFunds_2__.png){width=1435 height=741}![qa1-462-c3InsuficientFunds_4__](/uploads/265df08ad4da6060d00fab04f93ea4a9/qa1-462-c3InsuficientFunds_4__.png){width=1156 height=60}![qa1-462-c3InsuficientFunds_5__](/uploads/46482c3753215f18edb178fbfaac3214/qa1-462-c3InsuficientFunds_5__.png){width=1435 height=741}![qa1-462-c3InsuficientFunds_6__](/uploads/d37820d7fed4fd07739cdfc6a8467d40/qa1-462-c3InsuficientFunds_6__.png){width=1156 height=60}![qa1-462-c3InsuficientFunds_7__](/uploads/103ee51b921148e8512fc9942caed298/qa1-462-c3InsuficientFunds_7__.png){width=1431 height=740}![qa1-462-c3InsuficientFunds_8__](/uploads/debfc7a621fd05887dfc2ff4d83b8b31/qa1-462-c3InsuficientFunds_8__.png){width=1431 height=740}![qa1-462-c3InsuficientFunds_9__](/uploads/46b4ce7cac31a75fb1638fe15c98a177/qa1-462-c3InsuficientFunds_9__.png){width=1156 height=60} | PASS |
| 3888 | Pogress Mobility | Verify if, when joining the protection plan through the Website Portal, the "Opted In" status is correctly activated in the Servicing portal and that the enrollment date is recorded | ![qa1-462-c4-1_1_](/uploads/634aba7e17aed89633d50fed6a1c8710/qa1-462-c4-1_1_.png){width=1437 height=742}![qa1-462-c4-1_2_](/uploads/305e5e1ff921f073ea84d4ffd68ab5c4/qa1-462-c4-1_2_.png){width=1437 height=742}![qa1-462-c4-1_3_](/uploads/0424d6978021f9a869e2c9f48c0efe14/qa1-462-c4-1_3_.png){width=1437 height=742}![qa1-462-c4-1_4_](/uploads/279cda4aa421d3495b4baecd3798ba3d/qa1-462-c4-1_4_.png){width=1440 height=741}![qa1-462-c4-1_5_](/uploads/0e51bf6655bfd1bb7adeeabfcb5d4f0e/qa1-462-c4-1_5_.png){width=1440 height=741}![qa1-462-c4-1_6_](/uploads/3229e8636359fc621a9520e0980c2794/qa1-462-c4-1_6_.png){width=1437 height=741}![qa1-462-c4-1_7_](/uploads/b1ddf6dc76fb8377516338c98915214c/qa1-462-c4-1_7_.png){width=1437 height=741}![qa1-462-c4-1_8_](/uploads/22fef3512fa1bc0babba2a187863ad72/qa1-462-c4-1_8_.png){width=1437 height=741}![qa1-462-c4-1_9_](/uploads/18647e13faf14fccfd15cbf3160d0ef1/qa1-462-c4-1_9_.png){width=1437 height=741}![qa1-462-c4-1_10_](/uploads/da048b857af93469ac0e9031bc759735/qa1-462-c4-1_10_.png){width=1437 height=741}![qa1-462-c4-1_11_](/uploads/05a3dd3b60ffa0072ce89012b63acb20/qa1-462-c4-1_11_.png){width=1437 height=741}![qa1-462-c4-1_12_](/uploads/7970c3c036482ee9ce7d3465a56cf746/qa1-462-c4-1_12_.png){width=1437 height=741}![qa1-462-c4-1_13_](/uploads/1c6575ac5438e2152594e8d38e6d1b67/qa1-462-c4-1_13_.png){width=1437 height=741}![qa1-462-c4-1_14_](/uploads/78c66650e590185176598ddad14cbb5e/qa1-462-c4-1_14_.png){width=1437 height=741}![qa1-462-c4-1_15_](/uploads/57b1b17322e8a76827e2544b07ecca20/qa1-462-c4-1_15_.png){width=1437 height=741}![qa1-462-c4-1_16_](/uploads/225f339c57c1f515144b0702c607f9ed/qa1-462-c4-1_16_.png){width=1437 height=741}![qa1-462-c4-1_17_](/uploads/99eddae63b4006470660f83b9fb18159/qa1-462-c4-1_17_.png){width=1437 height=741}![qa1-462-c4-1_18_](/uploads/d34a6d5c481f0d39144b3439a2b29497/qa1-462-c4-1_18_.png){width=1437 height=741}![qa1-462-c4-1_19_](/uploads/57870fb8cb31ecaeb95e810e409e357d/qa1-462-c4-1_19_.png){width=1437 height=741}![qa1-462-c4-1_20_](/uploads/6b546aa36432338cc0a29147d2312634/qa1-462-c4-1_20_.png){width=1437 height=741}![qa1-462-c4-1_21_](/uploads/0649137dad9290f15e6862052f1043de/qa1-462-c4-1_21_.png){width=1440 height=810}![qa1-462-c4-1_22_](/uploads/658fb12338235adba722b8e350e9e0ee/qa1-462-c4-1_22_.png){width=1440 height=810}![qa1-462-c4-1_23_](/uploads/2289267945bfce7f7dd1e9878f316d45/qa1-462-c4-1_23_.png){width=1437 height=732}![qa1-462-c4-1_24_](/uploads/cc1eaa2671e3ec8993dab82d708fbd49/qa1-462-c4-1_24_.png){width=1437 height=732}![qa1-462-c4-1_25_](/uploads/c3129d30e76431cb10de96c02b269f22/qa1-462-c4-1_25_.png){width=1437 height=732}![qa1-462-c4-1_26_](/uploads/4e358f23e3157a3167b8a96459c8ca3a/qa1-462-c4-1_26_.png){width=1143 height=67} | PASS |
| 3912 | Pogress Mobility | Verify that an error message is displayed correctly to the customer when the customer tries to subscribe to the protection plan on the Website Portal and has problems with the data provided | ![qa1-462-c5_1_](/uploads/1243fbd66ef06f903bcb6d6ea8fca0e7/qa1-462-c5_1_.png){width=1437 height=738}![qa1-462-c5_2_](/uploads/77f238dd1df9572d8337416831df3665/qa1-462-c5_2_.png){width=1437 height=738}![qa1-462-c5_3_](/uploads/fac83f189303d19aa8acad2c721fc79a/qa1-462-c5_3_.png){width=1437 height=738}![qa1-462-c5_4_](/uploads/78004dfcc293aadf9e48097034044fee/qa1-462-c5_4_.png){width=1437 height=738}![qa1-462-c5_5_](/uploads/4cc6618f46d4cf3ad6ff3018b78c3662/qa1-462-c5_5_.png){width=1437 height=738}![qa1-462-c5_6_](/uploads/5603922aabeae260531532dc3d8ae41f/qa1-462-c5_6_.png){width=1437 height=738}![qa1-462-c5_7_](/uploads/c5cb640e01e024d2fbd3adc9b56024bb/qa1-462-c5_7_.png){width=1437 height=738}![qa1-462-c5_7_](/uploads/2e03bb77ad20a988f2fe8f327f49e931/qa1-462-c5_7_.png){width=1437 height=738}![qa1-462-c5_8_](/uploads/133723be9fe7be0336cd60f5bbbd685e/qa1-462-c5_8_.png){width=1437 height=738}![qa1-462-c5_9_](/uploads/2404467b47121567f3c254d01ee2090f/qa1-462-c5_9_.png){width=1437 height=738}![qa1-462-c5_10_](/uploads/e14affcadfc3f9e39a385d36fa35bb6d/qa1-462-c5_10_.png){width=1437 height=738}![qa1-462-c5_11_](/uploads/ab523c2482d799c9af1090a1f81398db/qa1-462-c5_11_.png){width=1437 height=738}![qa1-462-c5_12_](/uploads/c3f9f44e6b221c3738db9323921a3c35/qa1-462-c5_12_.png){width=1437 height=738}![qa1-462-c5_13_](/uploads/e70b58a2d6ef97b0e16429d7ef460483/qa1-462-c5_13_.png){width=1437 height=738}![qa1-462-c5_14_](/uploads/c1fa97e4284b368ec7bdfc5d501af99c/qa1-462-c5_14_.png){width=1437 height=738} | PASS |
| 8915/3905 | Pogress Mobility | Check if, when signing the first contract with the protection plan and the second contract with the client already protected, the "Already Covered" status is displayed filled in for the second lease | ![qa1-462-c6_1_](/uploads/550b579c632d8d83c2512726592f3600/qa1-462-c6_1_.png){width=304 height=660}![qa1-462-c6_2_](/uploads/cca7d31e0e8f6dea36324c014aa74b4c/qa1-462-c6_2_.png){width=1433 height=741}![qa1-462-c6_3_](/uploads/d66341f183cc1bf9ddca20f1f6aa3eb0/qa1-462-c6_3_.png){width=1433 height=741}![qa1-462-c6_4_](/uploads/0691af0adbaa9f76703ea320b4c64fbe/qa1-462-c6_4_.png){width=1433 height=741}![qa1-462-c6_5_](/uploads/8774877c219bcece9c230cc974c858b4/qa1-462-c6_5_.png){width=1433 height=741}![qa1-462-c6_6_](/uploads/df2833686c4480c6687350cb79d7bc9a/qa1-462-c6_6_.png){width=1433 height=741}![qa1-462-c6_7_](/uploads/e0e7e786663f372d8956c77890b0ba61/qa1-462-c6_7_.png){width=1433 height=741}![qa1-462-c6_8_](/uploads/9d6bb8f20dc803d3c0d902abfa91d6ec/qa1-462-c6_8_.png){width=1433 height=741}![qa1-462-c6_9_](/uploads/ab8af3095685caf7ee8d359c9cd43d9e/qa1-462-c6_9_.png){width=1433 height=741}![qa1-462-c6_10_](/uploads/edea672e13f6abda5fcf2566c67ebd7d/qa1-462-c6_10_.png){width=1433 height=741}![qa1-462-c6_11_](/uploads/ecebc03249c32a6ed50eac562838da5b/qa1-462-c6_11_.png){width=1433 height=741} | PASS |
| 8917 | Pogress Mobility | Verify if, when starting the contract signing and not finishing it, the protection plan status is displayed as 'Pending' in both Servicing and Origination portals, and that, when finishing the signing, the status is updated to 'Completed' or 'Error', as applicable, with the enrollment date correctly recorded, and if the logs and database correctly reflect the status changes | ![qa1-462-c7_1_](/uploads/0540d3726fccf98d413ac552ed24a8b8/qa1-462-c7_1_.png){width=1433 height=741}![qa1-462-c7_2_](/uploads/50a9a945779b81331228d8371e272d4d/qa1-462-c7_2_.png){width=1433 height=741}![qa1-462-c7_3_](/uploads/4d69be1e8d8ebfa72765b3a5e72313c3/qa1-462-c7_3_.png){width=1433 height=741}![qa1-462-c7_4_](/uploads/619b4a28d5176056a37f45a611ed169b/qa1-462-c7_4_.png){width=1433 height=741}![qa1-462-c7_5_](/uploads/741c1b02bd661cfcc87c9f86e68f3076/qa1-462-c7_5_.png){width=1433 height=741}![qa1-462-c7_6_](/uploads/cbb1b77cb39b01eda9b4d1cb6c8d0036/qa1-462-c7_6_.png){width=1433 height=741} | PASS |
| 8919/3908 | Pogress Mobility | Verify if, when the merchant does not offer the protection plan (configuration false), the Protection Plan panel is not displayed in either portal (Servicing and Origination) | ![qa1-462-c8_1_](/uploads/923c7e37ffdfbf0eef2cc0f1c9085912/qa1-462-c8_1_.png){width=1433 height=741}![qa1-462-c8_2_](/uploads/4739add81a0a0cd755e9f5ae9b3a9d2c/qa1-462-c8_2_.png){width=753 height=180}![qa1-462-c8_3_](/uploads/de4a48ae15edb2af354edc7bb86a7aed/qa1-462-c8_3_.png){width=306 height=660}![qa1-462-c8_4_](/uploads/3779426371f1926ad847101cdd8d87f0/qa1-462-c8_4_.png){width=1434 height=744}![qa1-462-c8_5_](/uploads/6844e3f9d340e26ea542c393a2976eda/qa1-462-c8_5_.png){width=1434 height=744}![qa1-462-c8_6_](/uploads/68d0331ce3aabf61d1c0e860f0884a04/qa1-462-c8_6_.png){width=1434 height=744} | PASS |
| 8925 | Pogress Mobility | Verify if, when closing the browser in the middle of signing and reopening the contract link, the "Pending" status is correctly displayed in both Servicing and Origination portals, with "Opted In" and "Already Covered" reflecting the current situation according to the customer's choice, and the enrollment date correctly reflected | ![qa1-462-c9_bestEvidence_E1_1___](/uploads/f167c8fb673db1a6fcd22128cd7c4a47/qa1-462-c9_bestEvidence_E1_1___.png){width=1439 height=744}![qa1-462-c9_bestEvidence_E1_2___](/uploads/239d0f92254409d14db90e002331630e/qa1-462-c9_bestEvidence_E1_2___.png){width=1439 height=744}![qa1-462-c9_bestEvidence_E1_3___](/uploads/7ee6cff8544d085ca634198e8cce23b7/qa1-462-c9_bestEvidence_E1_3___.png){width=1439 height=744}![qa1-462-c9_bestEvidence_E1_4___](/uploads/b2c07a736c72889f71f718f454190fb3/qa1-462-c9_bestEvidence_E1_4___.png){width=1136 height=51}![qa1-462-c9_bestEvidence_E1_4___](/uploads/618444d45b8f9b35ddc1bead1e04d2f8/qa1-462-c9_bestEvidence_E1_4___.png){width=1136 height=51}![qa1-462-c9_bestEvidence_E1_5___](/uploads/fc245a480f25dad5df779cf18a2e16b7/qa1-462-c9_bestEvidence_E1_5___.png){width=1429 height=746}![qa1-462-c9_bestEvidence_E1_6___](/uploads/d8b732086bbebee6d3f9b6658724af25/qa1-462-c9_bestEvidence_E1_6___.png){width=1429 height=746}![qa1-462-c9_bestEvidence_E1_7___](/uploads/11961bdeda9cd2eab7c2a636c45d5604/qa1-462-c9_bestEvidence_E1_7___.png){width=1429 height=746}![qa1-462-c9_bestEvidence_E1_8___](/uploads/8714dd640e192a690f85f905b457f904/qa1-462-c9_bestEvidence_E1_8___.png){width=1172 height=58}![qa1-462-c9_bestEvidence_E1_9___](/uploads/3de41c43b2338b2962c48bbd546a66f9/qa1-462-c9_bestEvidence_E1_9___.png){width=1419 height=747}![qa1-462-c9_bestEvidence_E1_10___](/uploads/fe1e3d6baef9920b8b06fb6ee2e7062e/qa1-462-c9_bestEvidence_E1_10___.png){width=1419 height=747}![qa1-462-c9_bestEvidence_E1_11___](/uploads/dcbe0a982a41ab970f1223cb3fac6459/qa1-462-c9_bestEvidence_E1_11___.png){width=1419 height=747}![qa1-462-c9_bestEvidence_E1_12___](/uploads/6cce35edb85f82db04a11cee7ff46d0e/qa1-462-c9_bestEvidence_E1_12___.png){width=1419 height=747}![qa1-462-c9_bestEvidence_E1_13___](/uploads/d3e78410ef9e877ac6d217d60f25e019/qa1-462-c9_bestEvidence_E1_13___.png){width=1419 height=747}![qa1-462-c9_bestEvidence_E1_14___](/uploads/76ce73ab44601bfde63bcdaea9a61bed/qa1-462-c9_bestEvidence_E1_14___.png){width=1173 height=67} | PASS |
| 8924 | Pogress Mobility | Verify if, when changing the customer's email in the Servicing Portal and accessing the Website Portal with the new email, the protection banner will be displayed or not, depending on the customer's protection status, not being displayed when the customer is protected and displayed when the customer is not protected, and if the email change is correctly recorded in the logs and database | ![qa1-462-c10_ClienteNaoProtegidoPeloPlanoAlteraEmail_1__](/uploads/ee7b5e7cc69eff4c2c5d4ce7d1b22d19/qa1-462-c10_ClienteNaoProtegidoPeloPlanoAlteraEmail_1__.png){width=1439 height=746}![qa1-462-c10_ClienteNaoProtegidoPeloPlanoAlteraEmail_2__](/uploads/d2577903f971e2b5771a32d0ef669b92/qa1-462-c10_ClienteNaoProtegidoPeloPlanoAlteraEmail_2__.png){width=1439 height=746}![qa1-462-c10_ClienteNaoProtegidoPeloPlanoAlteraEmail_3__](/uploads/7d56cd032322ba5b9f391fe29f818867/qa1-462-c10_ClienteNaoProtegidoPeloPlanoAlteraEmail_3__.png){width=1439 height=746}![qa1-462-c10_ClienteNaoProtegidoPeloPlanoAlteraEmail_4__](/uploads/102392e05490c262ff76e133c44c710b/qa1-462-c10_ClienteNaoProtegidoPeloPlanoAlteraEmail_4__.png){width=1439 height=746}![qa1-462-c10_ClienteNaoProtegidoPeloPlanoAlteraEmail_5__](/uploads/91115d7d93e191d1ebab5826413e05af/qa1-462-c10_ClienteNaoProtegidoPeloPlanoAlteraEmail_5__.png){width=1439 height=746}![qa1-462-c10_ClienteNaoProtegidoPeloPlanoAlteraEmail_6__](/uploads/65ba2749f01c233bbdc9ce44c549ff04/qa1-462-c10_ClienteNaoProtegidoPeloPlanoAlteraEmail_6__.png){width=1439 height=746}![qa1-462-c10_ClienteNaoProtegidoPeloPlanoAlteraEmail_7__](/uploads/76aa67f4492293e9663f5e34c6bdffcf/qa1-462-c10_ClienteNaoProtegidoPeloPlanoAlteraEmail_7__.png){width=1439 height=782}![qa1-462-c10_ClienteNaoProtegidoPeloPlanoAlteraEmail_8__](/uploads/1729c9e296f8cc70d47319ec564acb4a/qa1-462-c10_ClienteNaoProtegidoPeloPlanoAlteraEmail_8__.png){width=1439 height=744}![qa1-462-c10_ClienteNaoProtegidoPeloPlanoAlteraEmail_9__](/uploads/3fc0366a99a30768c6e3fea4f45a717c/qa1-462-c10_ClienteNaoProtegidoPeloPlanoAlteraEmail_9__.png){width=1439 height=744}![qa-462-c10__ClienteProtegidoPeloPlanoAlteraEmail_1___1_](/uploads/e1c0e533270c0ee66392c19eabacee7e/qa-462-c10__ClienteProtegidoPeloPlanoAlteraEmail_1___1_.png){width=1434 height=744}![qa-462-c10__ClienteProtegidoPeloPlanoAlteraEmail_1___2_](/uploads/334641c262eb8c054d62747d5919a65a/qa-462-c10__ClienteProtegidoPeloPlanoAlteraEmail_1___2_.png){width=1434 height=744}![qa-462-c10__ClienteProtegidoPeloPlanoAlteraEmail_1___3_](/uploads/7cd5c44aad08b0dce6a988720fd49246/qa-462-c10__ClienteProtegidoPeloPlanoAlteraEmail_1___3_.png){width=1434 height=744}![qa-462-c10__ClienteProtegidoPeloPlanoAlteraEmail_1___4_](/uploads/3ce7374308a9c3f1861012848abba137/qa-462-c10__ClienteProtegidoPeloPlanoAlteraEmail_1___4_.png){width=1434 height=744}![qa-462-c10__ClienteProtegidoPeloPlanoAlteraEmail_1___5_](/uploads/1167022d62fd9e5ccc5008846386ade6/qa-462-c10__ClienteProtegidoPeloPlanoAlteraEmail_1___5_.png){width=711 height=53}![qa-462-c10__ClienteProtegidoPeloPlanoAlteraEmail_1___6_](/uploads/a1d0b2cfa8bd981fe2686562d39ad76a/qa-462-c10__ClienteProtegidoPeloPlanoAlteraEmail_1___6_.png){width=1434 height=744}![qa-462-c10__ClienteProtegidoPeloPlanoAlteraEmail_1___7_](/uploads/97eee75741fa7f0dfab2587e0d528992/qa-462-c10__ClienteProtegidoPeloPlanoAlteraEmail_1___7_.png){width=1434 height=744}![qa-462-c10__ClienteProtegidoPeloPlanoAlteraEmail_1___8_](/uploads/0d6c829e9dbf1e633390f2a543994179/qa-462-c10__ClienteProtegidoPeloPlanoAlteraEmail_1___8_.png){width=1434 height=744}![qa-462-c10__ClienteProtegidoPeloPlanoAlteraEmail_1___9_](/uploads/5be8ec369dcdf96c0cab3fa2365868c4/qa-462-c10__ClienteProtegidoPeloPlanoAlteraEmail_1___9_.png){width=1434 height=744}![qa-462-c10__ClienteProtegidoPeloPlanoAlteraEmail_1___10_](/uploads/3e4a0386a042c5e08a2dda4e7fa008ed/qa-462-c10__ClienteProtegidoPeloPlanoAlteraEmail_1___10_.png){width=1439 height=746}![qa-462-c10__ClienteProtegidoPeloPlanoAlteraEmail_1___11_](/uploads/975a759ab429e6e7ff260369c74f8409/qa-462-c10__ClienteProtegidoPeloPlanoAlteraEmail_1___11_.png){width=1439 height=746} | PASS |
| 8929 | Progress Mobility | Verify that when the invoice is cancelled, the protection plan is also cancelled and the status is updated to "Canceled" in the Maintenance and Origination portals | ![qa1-c11_1_](/uploads/3dc8c21f9bfdf9e45135c8d9da37f2f5/qa1-c11_1_.png){width=1427 height=735}![qa1-c11_2_](/uploads/7b4458768217ff3b91fae1e58b32b395/qa1-c11_2_.png){width=1427 height=735}![qa1-c11_3_](/uploads/a229abca9f8632cb6d3d747dd91e20c0/qa1-c11_3_.png){width=1427 height=735} | PASS |

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa1

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
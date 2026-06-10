------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/servicing/-/issues/460

------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Servicing | Add a new Button (Customer Portal Link) in Servicing Page


Synopsis
Create a new button on the Servicing page, similar to Trustpilot, to send the customer an SMS/EMAIL with a link to the Self-Service Customer Portal.

Business Objective
The idea is for the button to automatically send the link to the customer, but additional functionalities may be added in the future.

Feature Request | Business Requirements    
      Add a button on the Servicing Page for automatic sending of the Customer Portal link.
      When clicking one of the buttons, this should be logged in the Activity Logs at the bottom.


Testing Steps
Permissions
Check if the icon exist, and needs the permission view_send_invite to appear.
Check if the new modal is being open, and need the permissions send_review (trust pilot) and send_customer_link for each button to appear

-----

UOWN | Serviços | Adicionar um novo Botão (Link do Portal do Cliente) na Página de Serviços
Sinopse
Criar um novo botão na página de Serviços, semelhante ao Trustpilot, para enviar ao cliente um SMS/EMAIL com um link para o Portal de Autoatendimento do Cliente.
Objetivo de Negócio
A ideia é que o botão envie automaticamente o link para o cliente, mas funcionalidades adicionais podem ser adicionadas no futuro.
Solicitação de Recurso | Requisitos de Negócio

Adicionar um botão na Página de Serviços para envio automático do link do Portal do Cliente.
Ao clicar em um dos botões, isso deve ser registrado nos Logs de Atividade na parte inferior.

Passos de Teste
Permissões

Verificar se o ícone existe e se precisa da permissão view_send_invite para aparecer.
Verificar se o novo modal está sendo aberto e se precisa das permissões send_review (Trustpilot) e send_customer_link para cada botão aparecer.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

📋 Requisito da Tarefa
Adicionar um novo botão na página de Serviços para enviar automaticamente um link do Portal de Autoatendimento do Cliente ao cliente, via SMS/Email. O sistema deve garantir que o botão esteja visível apenas para usuários com permissões específicas e registrar a ação nos logs de atividade.


🧪 Cenários de Teste Gherkin

Scenario 1 – Verificar a visibilidade do botão com a permissão correta

Scenario Outline: Verificar a visibilidade do botão com a permissão correta
  Given que o usuário tem a permissão "<permission>"
  When o usuário acessa a página de Serviços
  Then o botão "Enviar Link para o Portal do Cliente" deve ser "<visibility>"

  Examples:
    | permission          | visibility                 |
    | view_send_invite    | exibido                   |
    | sem view_send_invite | não exibido               |

🔍 Verifique se o botão "Enviar Link para o Portal do Cliente" é exibido corretamente dependendo da permissão do usuário.
📝 Explicação: Esse Scenario Outline valida se o botão "Enviar Link para o Portal do Cliente" é exibido somente para usuários que possuem a permissão "view_send_invite", e não exibido para aqueles sem a permissão.
✅ Resultado Esperado: O botão será exibido ou não com base na permissão "view_send_invite" do usuário.

-----

Scenario 2  Verificar se o modal de envio de link abre com as permissões adequadas (send_review e send_customer_link)

Scenario: 2 - Verificar se o modal de envio de link abre com as permissões adequadas
  Given que o usuário tem as permissões "send_review" e "send_customer_portal_link"
  When o usuário clica no botão "Enviar Link para o Portal do Cliente"
  Then o modal para enviar o link deve ser aberto

🔍 Verifique se, ao clicar no botão "Enviar Link para o Portal do Cliente", o modal é exibido apenas para usuários com as permissões "send_review" e "send_customer_portal_link".
📝 Explicação: Esse cenário garante que o modal de envio de link só seja aberto para usuários que têm ambas as permissões "send_review" e "send_customer_portal_link".
✅ Resultado Esperado: O modal será aberto apenas se o usuário tiver as permissões necessárias.

-----

Scenario 3 – Verificar se o log de atividade é gerado ao clicar no botão

Scenario: 3 - Verificar se o log de atividade é gerado ao clicar no botão
  Given que o usuário tem as permissões necessárias para enviar o link
  When o usuário clica no botão "Enviar Link para o Portal do Cliente"
  Then a ação de envio deve ser registrada no log de atividade

🔍 Verifique se a ação de envio do link ao cliente é registrada corretamente nos logs de atividade após o clique no botão "Enviar Link para o Portal do Cliente".
📝 Explicação: Esse cenário valida que, ao clicar no botão, a ação de envio é registrada nos logs de atividade, permitindo que a ação seja auditada posteriormente.
✅ Resultado Esperado: A ação de envio é registrada corretamente no log de atividade, com detalhes sobre o envio do link.

-----

Scenario 4 – Verificar a ação de envio do link sem as permissões necessárias

Scenario: 4 - Verificar a ação de envio do link sem as permissões necessárias
  Given que o usuário não tem as permissões "send_review" ou "send_customer_link"
  When o usuário clica no botão "Enviar Link para o Portal do Cliente"
  Then o sistema deve exibir uma mensagem de erro informando que o usuário não tem permissão

🔍 Verifique se, quando o usuário não tem as permissões necessárias, o sistema exibe uma mensagem de erro ao tentar clicar no botão para enviar o link.
📝 Explicação: Esse cenário valida que, se o usuário não tiver permissões suficientes, ele verá uma mensagem de erro informando que não pode realizar a ação.
✅ Resultado Esperado: O erro será exibido corretamente quando o usuário não tiver as permissões necessárias.

-----

Scenario Outline 5 -  Verificar o envio de SMS e Email baseado nas opções de "Do Not Call" e "Do Not Text"

Scenario Outline: 5 - Verificar o envio de SMS e Email baseado nas opções de "Do Not Call" e "Do Not Text"
  Given que o agente acessa o Portal de Servicing
  And o agente marca "<doNotCall>" a opção "Do Not Call" para o cliente
  And o agente marca "<doNotText>" a opção "Do Not Text" para o cliente
  When o agente clica no botão "Enviar Link para o Portal do Cliente"
  Then o cliente deve "<smsVisibility>" receber o SMS com o link para o Portal de Autoatendimento do Cliente
  And o cliente deve "<emailVisibility>" receber o Email com o link para o Portal de Autoatendimento do Cliente
  And o log de atividade deve registrar a ação de envio de SMS e Email conforme o comportamento esperado

  Examples:
    | doNotCall   | doNotText   | smsVisibility | emailVisibility |
    | true        | true        | não receber   | não receber     |
    | true        | false       | não receber   | receber         |
    | false       | true        | receber       | não receber     |
    | false       | false       | receber       | receber         |

🔍 Verifique se, ao marcar as opções "Do Not Call" ou "Do Not Text", o envio de SMS e Email é bloqueado, e se, ao desmarcar essas opções, o envio de SMS e Email é permitido, além de verificar se o log de atividade é registrado conforme o comportamento esperado.
📝 Explicação: Esse cenário usa Scenario Outline para testar várias combinações de marcar ou desmarcar as opções "Do Not Call" e "Do Not Text", verificando o comportamento de envio de SMS e Email em cada situação.
✅ Resultado Esperado: O SMS e o Email são enviados ou não, dependendo das opções selecionadas, e o log de atividade é atualizado corretamente.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verifique se o botão "Enviar Link para o Portal do Cliente" é exibido corretamente dependendo da permissão do usuário
Verify if the "Send Customer Portal Link" button is displayed correctly depending on the user's permission

Verifique se, ao clicar no botão "Enviar Link para o Portal do Cliente", o modal é exibido apenas para usuários com as permissões "send_review" e "send_customer_portal_link"
Verify if, when clicking the "Send Customer Portal Link" button, the modal is displayed only for users with "send_review" and "send_customer_portal_link" permissions

Verifique se a ação de envio do link ao cliente é registrada corretamente nos logs de atividade após o clique no botão "Enviar Link para o Portal do Cliente" e "Enviar convite do Trustpilot"
Verify if the action of sending the link to the customer is correctly recorded in the activity logs after clicking the "Send Customer Portal Link" button and "Send Trustpilot invite" button

Verifique se, quando o usuário não tem as permissões necessárias, o sistema exibe uma mensagem de erro ao tentar clicar no botão para enviar o link
Verify if, when the user doesn't have the necessary permissions, the system displays an error message when attempting to click the button to send the link

Verifique se, ao marcar as opções "Do Not Text" em Mobile Phone ou "Do not Email" em Primary email, o envio de SMS e Email é bloqueado, e se, ao desmarcar essas opções, o envio de SMS e Email é permitido, além de verificar se o log de atividade é registrado conforme o comportamento esperado
Verify if, when checking the "Do Not Text" options in Mobile Phone or "Do not Email" in Primary email, the sending of SMS and Email is blocked, and if, when unchecking these options, the sending of SMS and Email is allowed, and also verify if the activity log is recorded according to the expected behavior

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa1

| LeadPk | Merchant | Test Case | Test Data | Status | Observation |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 3869 | Tire Agent | Verify if the "Send Customer Portal Link" button is displayed correctly depending on the user's permission |  | PASS | -- |
| 3870 | Tire Agent | Verify if, when clicking the "Send Customer Portal Link" button, the modal is displayed only for users with "send_review" and "send_customer_portal_link" permissions |  | PASS | -- |
| 3870 | Tire Agent | Verify if the action of sending the link to the customer is correctly recorded in the activity logs after clicking the "Send Customer Portal Link" button and "Send Trustpilot invite" button |  | PASS | -- |
| 3870 | Tire Agent | Verify if, when the user doesn't have the necessary permissions, the system displays an error message when attempting to click the button to send the link |  | PASS | -- |
| 3887 and 3888 | Progress Mobility | Verify if, when checking the "Do Not Text" options in Mobile Phone or "Do not Email" in Primary email, the sending of SMS and Email is blocked, and if, when unchecking these options, the sending of SMS and Email is allowed, and also verify if the activity log is recorded according to the expected behavior |  | PASS | -- |


Tests in qa1

| LeadPk | Merchant | Test Case | Test Data | Status | Observation |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 3869 | Tire Agent | Verify if the "Send Customer Portal Link" button is displayed correctly depending on the user's permission | ![qa1-460-c1_1_](/uploads/796d153a55820ec78e9dd76b0bb8cd1c/qa1-460-c1_1_.png){width=202 height=44}![qa1-460-c1_2_](/uploads/bf9bf6b4b28619c777f5347b3b7e6209/qa1-460-c1_2_.png){width=620 height=45}![qa1-460-c1_3_](/uploads/5203e6e2bf6d951975712724a6658844/qa1-460-c1_3_.png){width=1428 height=737}![qa1-460-c1_4_](/uploads/15d09c01f2a77064594097951531606d/qa1-460-c1_4_.png){width=702 height=39}![qa1-460-c1_5_](/uploads/94445d579a379b0a123f78f5f505b2c5/qa1-460-c1_5_.png){width=1428 height=737}![qa1-460-c1_6_](/uploads/57dbfeb9ef59c23c160bdb645c1acb00/qa1-460-c1_6_.png){width=1428 height=737}![qa1-460-c1_7_](/uploads/df20eca35ccdcea883917015688da5e0/qa1-460-c1_7_.png){width=1433 height=738} | PASS | -- |
| 3870 | Tire Agent | Verify if, when clicking the "Send Customer Portal Link" button, the modal is displayed only for users with "send_review" and "send_customer_portal_link" permissions | ![qa1-460-c2_1_](/uploads/6d87c3f4f7c77110d0e56eef993c2629/qa1-460-c2_1_.png){width=1434 height=740}![qa1-460-c2_2_](/uploads/b727fdd40fc85d116fe7cc82a5d696e6/qa1-460-c2_2_.png){width=1434 height=740}![qa1-460-c2_3_](/uploads/92bc2a7c3b0c58d1ae715ebe445f6b37/qa1-460-c2_3_.png){width=1434 height=740}![qa1-460-c2_4_](/uploads/aadbcc9bf4e5049abb2b9d724f4505b1/qa1-460-c2_4_.png){width=1434 height=740}![qa1-460-c2_5_](/uploads/576d5c227e9e52deda2eaf948e9194bb/qa1-460-c2_5_.png){width=1434 height=740} | PASS | -- |
| 3870 | Tire Agent | Verify if the action of sending the link to the customer is correctly recorded in the activity logs after clicking the "Send Customer Portal Link" button and "Send Trustpilot invite" button | -- | PASS | -- |
| 3870 | Tire Agent | Verify if, when the user doesn't have the necessary permissions, the system displays an error message when attempting to click the button to send the link | ![qa1-460-c4_1_](/uploads/66eea7a33ae240b374a669adf45288ee/qa1-460-c4_1_.png){width=1434 height=735}![qa1-460-c4_2_](/uploads/ff5136a9d474b96f0be42eaa3cbc3067/qa1-460-c4_2_.png){width=1434 height=735}![qa1-460-c4_3_](/uploads/85cedb1fec622cd32e3287a158230758/qa1-460-c4_3_.png){width=1434 height=735} | PASS | -- |
| 3887 and 3888 | Progress Mobility | Verify if, when checking the "Do Not Text" options in Mobile Phone or "Do not Email" in Primary email, the sending of SMS and Email is blocked, and if, when unchecking these options, the sending of SMS and Email is allowed, and also verify if the activity log is recorded according to the expected behavior |  | PASS | -- |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

stg

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Scenario 1 - Verificar a visibilidade do botão "Enviar Link para o Portal do Cliente" dependendo da permissão do usuário

Scenario Outline: Verificar a visibilidade do botão "Enviar Link para o Portal do Cliente" dependendo da permissão do usuário
  Given que o usuário tem a permissão "<permission>"
  When o usuário acessa a página de Serviços
  Then o botão "Enviar Link para o Portal do Cliente" deve ser "<visibility>"

  Examples:
    | permission                      | visibility |
    | view_send_invite                | exibido    |
    | send_customer_portal_link       | exibido    |
    | send review                     | exibido    |
    | sem view_send_invite            | não exibido|
    | sem send_customer_portal_link   | não exibido|
    | sem send review                 | não exibido|

Verifique se o botão "Enviar Link para o Portal do Cliente" é exibido corretamente dependendo das permissões atribuídas ao usuário (todas as combinações de permissões e a ausência delas).

-----

Scenario 2: Verificar se o modal de envio de link abre com as permissões adequadas

Scenario: 2 - Verificar se o modal de envio de link abre com as permissões adequadas
  Given que o usuário tem as permissões "send_review" e "send_customer_link"
  When o usuário clica no botão "Enviar Link para o Portal do Cliente"
  Then o modal para enviar o link deve ser aberto

Verifique se, ao clicar no botão "Enviar Link para o Portal do Cliente", o modal é exibido apenas para usuários com as permissões "send review" e "send_customer_portal_link".

-----

Scenario 3: Verificar se a ação de envio do link ao cliente é registrada nos logs de atividade

Scenario: 3 - Verificar se a ação de envio do link ao cliente é registrada nos logs de atividade
  Given que o usuário tem as permissões necessárias para enviar o link
  When o usuário clica no botão "Enviar Link para o Portal do Cliente"
  Then a ação de envio deve ser registrada no log de atividade

Verifique se a ação de envio do link ao cliente é registrada corretamente nos logs de atividade após o clique no botão.

-----

Scenario 4: Verificar o aviso de permissão quando o usuário não tem permissões necessárias

Scenario: 4 - Verificar o aviso de permissão quando o usuário não tem permissões necessárias
  Given que o usuário não tem as permissões "send_review" ou "send_customer_link"
  When o usuário tenta clicar no botão "Enviar Link para o Portal do Cliente"
  Then o sistema deve exibir um aviso informando que o usuário não tem permissão para realizar essa ação

Verifique se, quando o usuário não tem as permissões necessárias, o sistema exibe um aviso sobre a falta de permissão ao tentar clicar no botão para enviar o link.

-----

Scenario 5: Verificar o comportamento de envio de SMS e Email baseado nas opções "Do Not Call" e "Do Not Text"

Scenario Outline: 5 - Verificar o envio de SMS e Email baseado nas opções "Do Not Call" e "Do Not Text"
  Given que o agente acessa o Portal de Servicing
  And o agente marca "<doNotCall>" a opção "Do Not Call" para o cliente
  And o agente marca "<doNotText>" a opção "Do Not Text" para o cliente
  When o agente clica no botão "Enviar Link para o Portal do Cliente"
  Then o cliente deve "<smsVisibility>" receber o SMS com o link para o Portal de Autoatendimento do Cliente
  And o cliente deve "<emailVisibility>" receber o Email com o link para o Portal de Autoatendimento do Cliente
  And o log de atividade deve registrar a ação de envio de SMS e Email conforme o comportamento esperado

Examples:
  | doNotCall   | doNotText   | smsVisibility | emailVisibility |
  | true        | true        | não receber   | não receber     |
  | true        | false       | não receber   | receber         |
  | false       | true        | receber       | não receber     |
  | false       | false       | receber       | receber         |

Verifique se, ao marcar as opções "Do Not Call" ou "Do Not Text", o envio de SMS e Email é bloqueado, e se, ao desmarcar essas opções, o envio de SMS e Email é permitido, além de verificar se o log de atividade é registrado conforme o comportamento esperado.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verifique se o botão "Enviar Link para o Portal do Cliente" é exibido corretamente dependendo da permissão do usuário
Verify if the "Send Customer Portal Link" button is displayed correctly depending on the user's permission

Verifique se, ao clicar no botão "Enviar Link para o Portal do Cliente", o modal é exibido apenas para usuários com as permissões "send_review" e "send_customer_portal_link"
Verify if, when clicking the "Send Customer Portal Link" button, the modal is displayed only for users with "send_review" and "send_customer_portal_link" permissions

Verifique se a ação de envio do link ao cliente é registrada corretamente nos logs de atividade após o clique no botão "Enviar Link para o Portal do Cliente" e "Enviar convite do Trustpilot"
Verify if the action of sending the link to the customer is correctly recorded in the activity logs after clicking the "Send Customer Portal Link" button and "Send Trustpilot invite" button

Verifique se, quando o usuário não tem as permissões necessárias, o sistema exibe uma aviso sobre permissão ao tentar clicar no botão para enviar o link
Verify if, when the user doesn't have the necessary permissions, the system displays a permission warning when attempting to click the button to send the linkRetryClaude can make mistakes. Please double-check responses.

Verifique se, ao marcar as opções "Do Not Text" em Mobile Phone ou "Do not Email" em Primary email, o envio de SMS e Email é bloqueado, e se, ao desmarcar essas opções, o envio de SMS e Email é permitido, além de verificar se o log de atividade é registrado conforme o comportamento esperado
Verify if, when checking the "Do Not Text" options in Mobile Phone or "Do not Email" in Primary email, the sending of SMS and Email is blocked, and if, when unchecking these options, the sending of SMS and Email is allowed, and also verify if the activity log is recorded according to the expected behavior

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in stg

| AccountPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 206267 | Progress Mobility | Verify if the "Send Customer Portal Link" button is displayed correctly depending on the user's permission |  | PASS |
| 206267 | Progress Mobility | Verify if, when clicking the "Send Customer Portal Link" button, the modal is displayed only for users with "send_review" and "send_customer_portal_link" permissions |  | PASS |
| 206267 | Progress Mobility | Verify if the action of sending the link to the customer is correctly recorded in the activity logs after clicking the "Send Customer Portal Link" button and "Send Trustpilot invite" button |  | PASS |
| 206267 | Progress Mobility | Verify if, when the user doesn't have the necessary permissions, the system displays an error message when attempting to click the button to send the link |  | PASS |
| 206267 | Progress Mobility | Verify if, when checking the "Do Not Text" options in Mobile Phone or "Do not Email" in Primary email, the sending of SMS and Email is blocked, and if, when unchecking these options, the sending of SMS and Email is allowed, and also verify if the activity log is recorded according to the expected behavior |  | PASS |
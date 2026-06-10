----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1034

UOWN | Origination | Change the INTERNAL STATUS "Expired" to "Incomplete" in New Application Page

Synopsis
Currently, when a new application is created, it receives the internal status "new". If the customer does not complete the submission process within 7 days (by providing the required information and signing the contract), the internal status is automatically updated to "expired".
So in the NEW applications this behavior will be changed: the internal status "new" to "incomplete".
obs.: Other applications that stay in UW_APPROVED status for 90 days or so will still be EXPIRED

Business Objective
By updating the internal status logic, we improve the clarity and accuracy of application states, 
which will help internal teams monitor pending actions and reduce potential confusion caused by the term "expired".


Feature Request | Business Requirements
If the customer does not complete the application (i.e., does not submit data and sign the contract) within 7 days, update the internal status to "incomplete".
Ensure all backend and frontend logic reflects this change.
Update any automated processes, alerts, or reports that currently rely on the "expired" status to use "incomplete" instead, in the case of new applications following the criteria described in the synopsis.
Test the flow to ensure that the status change happens correctly and that no regression occurs in related features.

Marcos Silvano @marcos.pacheco.silva
test instructions

Create a lead and leave it in the NEW status. In the los_lead table change it's expiration_date manually to force the expiration.
Than make a request to the endpoint /checkLeadExpirationSweep to trigger the sweep and assert the results.

-----

UOWN | Origination | Alterar o STATUS INTERNO de “Expired” para “Incomplete” na Página de Nova Aplicação

Sinopse
Atualmente, quando uma nova aplicação é criada, ela recebe o status interno “new”. 
Se o cliente não concluir o processo de submissão em até 7 dias (fornecendo as informações obrigatórias e assinando o contrato), 
o status interno é automaticamente atualizado para “expired”.
Na página de NOVAS aplicações, esse comportamento será alterado: o status interno deixará de ir para “expired” e passará a ser “incomplete”.
obs.: Outras aplicações que estiverem no status UW_APPROVED por cerca de 90 dias continuarão a ficar EXPIRED.

Objetivo de Negócio
Ao atualizar a lógica de status interno, melhoramos a clareza e a precisão dos estados das aplicações, ajudando as equipes internas a monitorar a
ções pendentes e reduzindo a confusão gerada pelo termo “expired”.

Requisitos de Negócio / Feature Request
* Se o cliente não concluir a aplicação (ou seja, não enviar dados e assinar o contrato) em até 7 dias, atualizar o status interno para “incomplete”.
* Garantir que toda a lógica de backend e frontend reflita essa mudança.
* Atualizar quaisquer processos automáticos, alertas ou relatórios que atualmente utilizem o status “expired” para passar a usar “incomplete” 
no caso de novas aplicações que atendem ao critério acima.
* Testar o fluxo para garantir que a mudança de status ocorra corretamente e que não haja regressão em funcionalidades relacionadas.

Instruções de Teste
Criar um lead e deixá-lo com status NEW.
No banco de dados, na tabela los_lead, alterar manualmente o campo expiration_date para forçar a expiração.
Enviar requisição ao endpoint /checkLeadExpirationSweep para acionar o sweep e validar o resultado.

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Validação de prazo
Se a aplicação permanecer em “new” por mais de 7 dias sem dados completos e contrato assinado, deve passar para “incomplete”.

Persistência de regra em backend
O serviço responsável por verificar expirações deve usar “incomplete” em vez de “expired” para novas aplicações.

Reflexão em frontend
Toda UI (listagens, detalhes, badges de status) deve exibir “Incomplete” quando aplicável.

Ajuste em processos automatizados
Jobs, alertas por e-mail e relatórios que hoje filtram ou contam “expired” devem ser ajustados para contar “incomplete” no contexto de novas aplicações.

Regras de exceção
Aplicações em UW_APPROVED por ~90 dias continuam recebendo “expired” normalmente.

-----

Feature: Atualização de status interno de novas aplicações
  Para aprimorar a clareza dos estados de aplicação
  Como time de Origination
  Preciso que aplicações novas não concluídas em até 7 dias mudem o status interno para “Incomplete”

  Background:
    Dado que existe uma aplicação nova com status interno "new"

  Scenario: Aplicação não finalizada em 7 dias é marcada como Incomplete
    Given a data de criação da aplicação foi alterada para 8 dias atrás
    When o sweep de expiração for acionado via "/checkLeadExpirationSweep"
    Then o status interno da aplicação deve ser atualizado para "incomplete"

  Scenario: Aplicações aprovadas há mais de 90 dias permanecem como Expired
    Given existe uma aplicação com status interno "approved"
    And a data de aprovação foi ajustada para 91 dias atrás
    When o sweep de expiração for executado
    Then o status interno da aplicação deve permanecer como "expired"
      https://svc-{{env}}.uownleasing.com/uown/svc/triggerScheduledTask/checkLeadExpirationSweep
      12738

  Scenario: Filtrar leases por status INCOMPLETE na tela Overview
    Given o usuário está na tela Overview
    When ele filtra leases pelo status interno "INCOMPLETE"
    Then o filtro exibe apenas leases com status "INCOMPLETE"
      https://svc-{{env}}.uownleasing.com/uown/svc/triggerScheduledTask/checkLeadExpirationSweep
      12741

  Scenario: Filtrar leases por status INCOMPLETE na tela Leads
    Given o usuário está na tela Leads
    When ele filtra leases pelo status interno "INCOMPLETE"
    Then o filtro exibe apenas leases com status "INCOMPLETE"

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Validar que aplicações não concluídas a mais de 7 dias sejam marcadas como “Incomplete”.
Validate that applications not completed within 7 days are marked as “Incomplete.”

Validar que aplicações aprovadas há mais de 90 dias permaneçam com status “Expired”.
Validate that applications approved more than 90 days ago remain with the status “Expired.”

Verificar se é possível filtrar leases pelo status “INCOMPLETE” na tela Overview.
Verify that it is possible to filter leases by the “INCOMPLETE” status on the Overview screen.

Verificar se é possível filtrar leases pelo status “INCOMPLETE” na tela Leads.
Verify that it is possible to filter leases by the “INCOMPLETE” status on the Leads screen.

-----

Tests in qa2

| LeadPk | Merchant | Test Case | Test Data | Status | Observation |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 12741 | Progress Mobility | Validate that applications not completed within 7 days are marked as “Incomplete.” |  | PASS |  |
| 12738 | Progress Mobility | Validate that applications approved more than 90 days ago remain with the status “Expired.” |  | PASS |  |
| -- | -- | Verify that it is possible to filter leases by the “INCOMPLETE” status on the Overview screen. |  | ERROR | On the Overview screen, it is not possible to filter leases by the “Incomplete” status. |
| -- | -- | Verify that it is possible to filter leases by the “INCOMPLETE” status on the Leads screen. |  | PASS |  |

-----

Tests in qa2

| LeadPk | Merchant | Test Case | Test Data | Status | Observation |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 12741 | Progress Mobility | Validate that applications not completed within 7 days are marked as “Incomplete.” | ![qa2-1034-c1-AplicacaoNaoConcluídaEm7DiasPassaParaIncomplete_1_](/uploads/31004f4a787982d94bb7c8bbed9af615/qa2-1034-c1-AplicacaoNaoConcluídaEm7DiasPassaParaIncomplete_1_.png){width=912 height=742}![qa2-1034-c1-AplicacaoNaoConcluídaEm7DiasPassaParaIncomplete_2_](/uploads/42509a7238a78411702abdbfd7f87f3b/qa2-1034-c1-AplicacaoNaoConcluídaEm7DiasPassaParaIncomplete_2_.png){width=1082 height=542}![qa2-1034-c1-AplicacaoNaoConcluídaEm7DiasPassaParaIncomplete_3_](/uploads/6e19317a330d53ad2ca4f9e2a52b0402/qa2-1034-c1-AplicacaoNaoConcluídaEm7DiasPassaParaIncomplete_3_.png){width=1439 height=742}![qa2-1034-c1-AplicacaoNaoConcluídaEm7DiasPassaParaIncomplete_4_](/uploads/1ceaeb20f331d44616a5ce2fa27f1b2b/qa2-1034-c1-AplicacaoNaoConcluídaEm7DiasPassaParaIncomplete_4_.png){width=1439 height=742}![qa2-1034-c1-AplicacaoNaoConcluídaEm7DiasPassaParaIncomplete_5_](/uploads/9f4e56c19d0791b11a631f76077391f5/qa2-1034-c1-AplicacaoNaoConcluídaEm7DiasPassaParaIncomplete_5_.png){width=1168 height=49} | PASS | -- |
| 12738 | Progress Mobility | Validate that applications approved more than 90 days ago remain with the status “Expired.” | ![qa2-1034-c2_1_](/uploads/65c938e65f5a7259d15460525484b6db/qa2-1034-c2_1_.png){width=914 height=742}![qa2-1034-c2_2_](/uploads/ac405f2da28fcc1611a18d1fc7bac664/qa2-1034-c2_2_.png){width=1099 height=542}![qa2-1034-c2_3_](/uploads/aa03876fc257e1a333250785050ab5fa/qa2-1034-c2_3_.png){width=1437 height=743}![qa2-1034-c2_4_](/uploads/8a7410bcdbaeb4ae60be25255ced3a6a/qa2-1034-c2_4_.png){width=1439 height=742}![qa2-1034-c2_5_](/uploads/eade872c10074d17003f097610b17744/qa2-1034-c2_5_.png){width=1168 height=49}![qa2-1034-c2_6_](/uploads/0a6ad181dc703648d2a37226d42dc67a/qa2-1034-c2_6_.png){width=1170 height=54}![qa2-1034-c2_7_](/uploads/ffacf0fa068ba50b687c7003a57bc1df/qa2-1034-c2_7_.png){width=914 height=739}![qa2-1034-c2_8_](/uploads/2bb3b103d26e0f5e182a6d4ffb35e02a/qa2-1034-c2_8_.png){width=914 height=739} | PASS | -- |
| -- | -- | Verify that it is possible to filter leases by the “INCOMPLETE” status on the Overview screen. | ![qa2-1034-c3-BuscarStatusIncompleteOverview_E1___1_](/uploads/51eed1acf06b9ba87a0e6c490d4caa9d/qa2-1034-c3-BuscarStatusIncompleteOverview_E1___1_.png){width=1438 height=739}![qa2-1034-c3-BuscarStatusIncompleteOverview_E1___2_](/uploads/77e5116ec045c45ca6ede1244ea2ff7f/qa2-1034-c3-BuscarStatusIncompleteOverview_E1___2_.png){width=1438 height=739} | ERROR | @marcos.pacheco.silva  On the Overview screen, it is not possible to filter leases by the “Incomplete” status. |
| -- | -- | Verify that it is possible to filter leases by the “INCOMPLETE” status on the Leads screen. | ![qa2-1034-c4-BuscarStatusIncompleteLeads_1_](/uploads/8397eaef30a539e67c96157a23d3a600/qa2-1034-c4-BuscarStatusIncompleteLeads_1_.png){width=1438 height=739}![qa2-1034-c4-BuscarStatusIncompleteLeads_2_](/uploads/8683bd7f204a38e9c6f6819878c7deba/qa2-1034-c4-BuscarStatusIncompleteLeads_2_.png){width=1438 height=739}![qa2-1034-c4-BuscarStatusIncompleteLeads_3_](/uploads/00fcfd12eb1417bc5dbe40bcc7aee828/qa2-1034-c4-BuscarStatusIncompleteLeads_3_.png){width=1438 height=739}![qa2-1034-c4-BuscarStatusIncompleteLeads_4_](/uploads/563cd81c77c1475db50d25cbbaa36af7/qa2-1034-c4-BuscarStatusIncompleteLeads_4_.png){width=1438 height=739}![qa2-1034-c4-BuscarStatusIncompleteLeads_5_](/uploads/2b1abc6a167f20e841598a1475a8f1a5/qa2-1034-c4-BuscarStatusIncompleteLeads_5_.png){width=1438 height=739} | PASS | -- |

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa2

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Validar que aplicações não concluídas a mais de 7 dias e menos de 90 dias sejam marcadas como “Incomplete”.
Validate that applications not completed for more than 7 days and less than 90 days are marked as “Incomplete”.

Validar que aplicações aprovadas há mais de 90 dias permaneçam com status “Expired”.
Validate that applications approved more than 90 days ago remain with the status “Expired.”

-----

Tests in stg

| LeadPk | Merchant | Test Case | Test Data | Status | Observation |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 12741 | Progress Mobility | Validate that applications not completed for more than 7 days and less than 90 days are marked as “Incomplete”.” |  | PASS |  |
| 12738 | Progress Mobility | Validate that applications approved more than 90 days ago remain with the status “Expired.” |  | PASS |  |

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in stg

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
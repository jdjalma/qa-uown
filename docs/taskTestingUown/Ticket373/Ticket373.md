------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Servicing | Track and Report Portal Link Reminders Sent by Agents
Open
  Ticket created 1 week ago by Yuri Araujo
Synopsis
Implement backend logging and a corresponding report to track which agents are sending portal link reminders to customers. This data can then be used for light monitoring purposes and should be made accessible via SQL or included in the portal.

Business Objective
Enable visibility into agent behavior by reporting how often each agent sends out portal links to customers. This is intended as a lightweight, non-intrusive tool to help ensure adherence to best practices.

Feature Request | Business Requirements
Logging Enhancement:
Fix the current bug that prevents agent information from being logged when reminders are sent.
Ensure the system logs the agent ID or name every time a portal link reminder is sent to a customer.
Report Generation (SUGGESTION):

Include fields such as:

Agent Name / ID
Date and Time of Reminder
Attachment(s)
Zendesk Ticket 5703

Marcos Silvano
@marcos.pacheco.silva
1 week ago
Maintainer
test instructions
The information about the agent that sent the link must be included in the user id column in the activity logs table


-----


UOWN | Servicing | Rastrear e Reportar Lembretes de Link do Portal Enviados por Agentes
Aberto
  Tíquete criado 1 semana atrás por Yuri Araujo
Sinopse
Implementar registro (logging) no backend e um relatório correspondente para rastrear quais agentes estão enviando lembretes de link do portal para clientes. 
Esses dados podem então ser usados para monitoramento leve e devem ser acessíveis via SQL ou incluídos no portal.

Objetivo de Negócio
Permitir visibilidade sobre o comportamento dos agentes, relatando com que frequência cada agente envia links do portal para os clientes. 
Isso é pensado como uma ferramenta leve e não intrusiva para ajudar a garantir a adesão às melhores práticas.

Solicitação de Feature | Requisitos de Negócio
Melhoria no Logging:
Corrigir o bug atual que impede que as informações do agente sejam registradas ao enviar lembretes.
Garantir que o sistema registre o ID ou nome do agente toda vez que um lembrete de link do portal for enviado a um cliente.
Geração de Relatório (SUGESTÃO):

Incluir campos como:

Nome/ID do Agente
Data e Hora do Lembrete
Anexo(s)
Zendesk Ticket 5703

Marcos Silvano
@marcos.pacheco.silva
1 semana atrás
Responsável
instruções de teste
A informação sobre o agente que enviou o link deve estar incluída na coluna de user id na tabela de activity logs

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------




### Scenario: User sends Customer Portal Link and is logged in email and SMS queues
Given I am on the servicing portal  
And I select a lease eligible to receive a portal link  
When I click the button "Send Customer Portal Link"  
Then the user who triggered this email should be logged in the email_queue table  
And the user who triggered this email should be logged in the sms_queue table  
| PASS | LeadPk 24023/AccountPk 206396 |
| In the log, the user responsible for sending is recorded as "SYSTEM". |
| In the SMS sending record, the stored user is "SYSTEM". |


> ## Tests in stg
>```gherkin
>
>### Scenario: User sends Customer Portal Link and is logged in email and SMS queues
>Given I am on the servicing portal  
>And I select a lease eligible to receive a portal link  
>When I click the button "Send Customer Portal Link"  
>Then the user who triggered this email should be logged in the email_queue table  
>And the user who triggered this email should be logged in the sms_queue table  
>| PASS | LeadPk 24023/AccountPk 206396 |
>| No log, o usuário responsável pelo envio é registrado como "SYSTEM". |
>| No registro de envio do SMS, o usuário armazenado é "SYSTEM". |
> ```
>

> ## Tests in stg
>```gherkin
>
>### Scenario: User sends Customer Portal Link and is logged in email and SMS queues
>Given I am on the servicing portal  
>And I select a lease eligible to receive a portal link  
>When I click the button "Send Customer Portal Link"  
>Then the user who triggered this email should be logged in the email_queue table  
>And the user who triggered this email should be logged in the sms_queue table  
>| PASS | LeadPk 24023/AccountPk 206396 |
>| In the log, the user responsible for sending is recorded as "SYSTEM". |
>| In the SMS sending record, the stored user is "SYSTEM". |
> ```
>
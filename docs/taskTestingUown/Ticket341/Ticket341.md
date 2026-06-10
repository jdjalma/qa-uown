--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/341

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Servicing | Implement Daily Scheduled Denied Rerun Sweep

Testing instructions:
1. Please check if there's a scheduled task named "c:\Users\pcGow\Documents\Lightshot\ccVintegaeRun(32).png" in uown_scheduled_task table and also check if there's a report query in sv_sql_config table named 'DAILYSCHEDULEDDENIEDRERUNREPORT'.
2. Pick some accounts on qa2 and run some CC transactions
3. go the DB and change these transactions cc_transaction_type to 'SCHEDULED' and status to 'DENIED' and set error as 'test' in sv_credit_card_transaction table.
4. Run the query from scheduled task and make sure these records are returned
5. Run the sweep svc/triggerScheduledTask/CCDailyScheduledDeniedRerun
6. You should see same number of transactions as step 3 in sv_credit_card_transaction table of cc_transaction_type DAILY_SCHEDULED_DENIED_RERUN
7. You should receive a report for these transactions too

-----

UOWN | Atendimento | Implementar Varredura Diária Programada de Reexecução Negada

Instruções de teste:
Por favor, verifique se existe uma tarefa agendada chamada "CCDailyScheduledDeniedRerun" na tabela uown_scheduled_task 
select 
ust.pk ,ust.row_created_timestamp ,ust.scheduled_task_name ,ust.template_name ,ust.is_active ,ust.is_native_query ,ust.last_trigger_time ,
ust.*
from
uown_scheduled_task ust 
where 
ust.scheduled_task_name like '%CCDailyScheduledDeniedRerun%'
;

e também verifique se existe uma consulta de relatório na tabela sv_sql_config chamada 'DAILYSCHEDULEDDENIEDRERUNREPORT'.
select 
ussc.pk,ussc.row_created_timestamp ,ussc.sql_name ,ussc.sql_query ,
ussc.*
from
uown_sv_sql_config ussc
where ussc.sql_name like '%DAILYSCHEDULEDDENIEDRERUNREPORT%'
;

Escolha algumas contas no qa2 e execute algumas transações CC.
qa2
12243 10386
12244 10387
stg
20199 206046
20198 206045
20192 206041
20200 206047


Vá ao banco de dados e altere o cc_transaction_type dessas transações para 'SCHEDULED' e o status para 'DENIED', definindo o erro como 'test' na tabela sv_credit_card_transaction.
select 
uscct.lead_pk ,uscct.account_pk ,uscct.row_created_timestamp ,uscct.cc_type ,uscct.cc_transaction_type ,uscct.completed_time ,uscct.error ,uscct.error_code,uscct.status,
uscct.*
from 
uown_sv_credit_card_transaction uscct 
where
uscct.row_created_timestamp between '2025-03-18 00:00:00.000' and '2025-03-18 23:59:59.999'
and uscct.account_pk in ('206046','206045','206041','206047')
;

Execute a consulta da tarefa agendada e certifique-se de que esses registros sejam retornados.
SELECT cct.account_pk as "accountPkk",cct.amount as "amountt", cct.posting_date as "postingDatee",s.delinquency_as_of_date
FROM
uown_sv_credit_card_transaction cct
JOIN uown_sv_account a ON a.pk = cct.account_pk
JOIN uown_sv_sched_summary s ON a.pk = s.account_pk
JOIN uown_sv_credit_card cc on cc.auto_pay = true and cc.account_pk = a.pk
where 
status IN ('DENIED', 'ERROR') 
AND posting_date = CURRENT_DATE
AND agent_username NOT IN ('SpecialProcess#5014')
AND cc_transaction_type = 'SCHEDULED'
AND cct.cc_action = 'SALE'
AND a.account_status = 'ACTIVE'
AND (a.rating IS NULL OR a.rating NOT IN ('P', 'C', 'D'))
AND error not in ('Card is expired',
'Card number error',
'Closed account',
 'Hold card (stolen)'
'Hold card (pick up card)',
'Hold card (lost)',
'Withdrawal limit exceeded',
'PIN tries exceeded')
AND s.delinquency_as_of_date <= current_date
AND (cct.comment is null or cct.comment not like 'Idempotent transaction was run. %')
;

Execute a varredura svc/triggerScheduledTask/CCDailyScheduledDeniedRerun

Você deve ver o mesmo número de transações do passo 3 na tabela sv_credit_card_transaction com o cc_transaction_type DAILY_SCHEDULED_DENIED_RERUN.
select 
uscct.lead_pk ,uscct.account_pk ,uscct.row_created_timestamp ,uscct.cc_type ,uscct.cc_transaction_type ,uscct.completed_time ,uscct.error ,uscct.error_code,uscct.status,uscct.posting_date, uscct.cc_action ,uscct."comment" ,
uscct.*
from 
uown_sv_credit_card_transaction uscct 
where
uscct.row_created_timestamp between '2025-03-18 00:00:00.000' and '2025-03-18 23:59:59.999'
and uscct.account_pk in ('10386','10387')
and uscct.cc_action in ('SALE')
and uscct.posting_date = '2025-03-18'
order by uscct.pk
;

Você também deve receber um relatório para essas transações.

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Requisito da tarefa:

Implementar Varredura Diária Programada de Reexecução Negada.
Este requisito exige a verificação da existência da tarefa agendada e da consulta de relatório, 
a modificação manual dos dados de transações para simular o cenário de "negado", 
a execução da consulta para recuperar os registros modificados, 
a varredura que atualiza o status das transações e a geração de um relatório correspondente.

Cenário 1: Verificar configuração da tarefa agendada e consulta de relatório

Scenario: Validate scheduled task and report query configuration
  Given que acesso o banco de dados para verificar as configurações
  When eu consultar a tabela "uown_scheduled_task" para confirmar a existência da tarefa "CCDailyScheduledDeniedRerun"
  And eu consultar a tabela "sv_sql_config" para confirmar a existência da consulta 'DAILYSCHEDULEDDENIEDRERUNREPORT'
  Then devo ver que a tarefa agendada e a consulta estão devidamente cadastradas

Explicação:
Este cenário tem como objetivo garantir que os pré-requisitos para a execução da varredura estão configurados corretamente no banco de dados. 
Ele verifica se a tarefa "CCDailyScheduledDeniedRerun" existe na tabela de tarefas agendadas e se a consulta de relatório 'DAILYSCHEDULEDDENIEDRERUNREPORT' está presente.

Resultado esperado: Ambas as verificações retornam os registros esperados, indicando que o ambiente está preparado para os passos seguintes.
Verifique se a tarefa agendada e a consulta de relatório estão cadastradas corretamente.  

-----

Cenário 2: Validar execução da varredura e processamento das transações

Scenario: Validate execution of task sweep and transaction processing
  Given que escolhi algumas contas no ambiente qa2 e executei transações CC
  And alterei os registros na tabela "sv_credit_card_transaction" definindo "cc_transaction_type" para "SCHEDULED", "status" para "DENIED" e "error" para "test"
  When eu executar a consulta da tarefa agendada para recuperar os registros modificados
  And executar o sweep via "svc/triggerScheduledTask/CCDailyScheduledDeniedRerun"
  Then devo ver que o número de transações na tabela "sv_credit_card_transaction" foi atualizado para "DAILY_SCHEDULED_DENIED_RERUN"
  And devo receber um relatório contendo as transações processadas

  Explicação:
  Este cenário cobre a execução prática da tarefa. Primeiro, simula-se o cenário de transações com alterações manuais (mudança de status e tipo). Em seguida, executa-se a consulta para confirmar que os registros alterados foram identificados e, depois, a varredura (sweep) que processa essas transações, atualizando seu tipo e gerando um relatório.
  
  Resultado esperado: Os registros alterados são identificados corretamente pela consulta, a varredura atualiza o status das transações conforme especificado e um relatório é gerado com a quantidade exata de transações processadas.
  Verifique se as transações processadas e o relatório foram corretamente gerados

  -----

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Cenário 1: Verificar configuração da tarefa agendada e consulta de relatório
Verifique se a tarefa agendada "CCDailyScheduledDeniedRerun" e a consulta de relatório "DAILYSCHEDULEDDENIEDRERUNREPORT" 
estão devidamente cadastradas nas tabelas "uown_scheduled_task" e "sv_sql_config"

Cenário 2: Validar execução da varredura e processamento das transações
Verifique se a execução da tarefa agendada de varredura "CCDailyScheduledDeniedRerun" processou corretamente as transações com status "DENIED" 
e "SCHEDULED" na tabela "sv_credit_card_transaction". Além disso, confirme que o número de transações foi atualizado para "DAILY_SCHEDULED_DENIED_RERUN" 
e que um relatório foi gerado contendo todas as transações processadas conforme o esperado.


Scenario 1: Verify the scheduled task configuration and report query
Verify that the scheduled task "CCDailyScheduledDeniedRerun" and the report query "DAILYSCHEDULEDDENIEDRERUNREPORT" 
are properly registered in the "uown_scheduled_task" and "sv_sql_config" tables.

Scenario 2: Validate execution of sweep and transaction processing
Verify that the execution of the scheduled sweep task "CCDailyScheduledDeniedRerun" correctly processed the transactions with status "DENIED" 
and "SCHEDULED" in the "sv_credit_card_transaction" table. Additionally, confirm that the number of transactions was updated to "DAILY_SCHEDULED_DENIED_RERUN" 
and that a report was generated containing all processed transactions as expected

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa2

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 10386 and 10387 | Progress Mobility | Verify that the scheduled task "CCDailyScheduledDeniedRerun" and the report query "DAILYSCHEDULEDDENIEDRERUNREPORT" are properly registered in the "uown_scheduled_task" and "sv_sql_config" tables |  | PASS |
| 10386 and 10387 | Progress Mobility | Verify that the execution of the scheduled sweep task "CCDailyScheduledDeniedRerun" correctly processed the transactions with status "DENIED" and "SCHEDULED" in the "sv_credit_card_transaction" table. Additionally, confirm that the number of transactions was updated to "DAILY_SCHEDULED_DENIED_RERUN" and that a report was generated containing all processed transactions as expected |  | PASS |

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa2

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in stg

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
|  |  | Verify that the scheduled task "CCDailyScheduledDeniedRerun" and the report query "DAILYSCHEDULEDDENIEDRERUNREPORT" are properly registered in the "uown_scheduled_task" and "sv_sql_config" tables |  | PASS |
|  |  | Verify that the execution of the scheduled sweep task "CCDailyScheduledDeniedRerun" correctly processed the transactions with status "DENIED" and "SCHEDULED" in the "sv_credit_card_transaction" table. Additionally, confirm that the number of transactions was updated to "DAILY_SCHEDULED_DENIED_RERUN" and that a report was generated containing all processed transactions as expected |  | PASS |

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

OK in stg

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
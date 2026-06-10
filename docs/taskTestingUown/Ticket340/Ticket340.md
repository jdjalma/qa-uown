--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/340

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

OWN | Servicing | Implement CC Vintage Run Sweep

Testing Instructions:
1. Please check sv_sql_config for two entries : CCVINTAGERUNREPORT, CCVINTAGERUN
--> select 
ussc.pk,ussc.row_created_timestamp ,ussc.sql_name ,ussc.sql_query ,
ussc.*
from
uown_sv_sql_config ussc
where ussc.sql_name like '%CCVINTAGERUN%'
;
-->select 
ussc.pk,ussc.row_created_timestamp ,ussc.sql_name ,ussc.sql_query ,
ussc.*
from
uown_sv_sql_config ussc
where ussc.sql_name like '%CCVINTAGERUNREPORT%'
;

-----

2. Run the query from CCVintageRun (replace :startDate with 2023-01-01 and :endDate with 2025-03-30). If you don't see any results, do this :
    a. Create some accounts (signing leads and request funding)
    b. go to servicing portal, and for each of these accounts, Move Due Date (DueAmounts page) to some date in the past, for example, '2025-02-01'
    c. Make sure they have auto pay credit card
    d. Rerun the query and make sure some records are returned
-->
WITH pastreceivable AS (
    SELECT * FROM (
                      SELECT
                          a.pk AS accountPk,
                          a.row_created_timestamp AS createdTime,
                          a.account_status AS accountStatus,
                          r.pk AS receivablePk,
                          r.receivable_type AS receivableType,
                          r.total_amount AS totalAmount,
                          r.due_date AS pastDueDate,
                          s.last_payment_date as lastPaymentDate,
                          a.auto_pay_types AS autoPayTypes,
                          a.rating AS rating,
                          s.delinquency_as_of_date as delinquencyDate,
                          RANK() OVER (PARTITION BY a.pk ORDER BY r.due_date) AS rnk
                      FROM uown_sv_account a
                               JOIN uown_sv_receivable r ON r.account_pk = a.pk and r.status = 'ACTIVE'
                          AND r.receivable_type = 'REGULAR_PAYMENT'
                          AND r.allocation_status IN ('UNPAID')
                          AND r.due_date < CURRENT_DATE
                          AND (r.skipped IS NULL OR r.skipped = FALSE)
                               JOIN uown_sv_sched_summary s on s.account_pk = a.pk
                               JOIN uown_sv_credit_card cc on cc.account_pk = a.pk and cc.auto_pay = TRUE
                      where
                              r.status = 'ACTIVE'
                        AND r.receivable_type = 'REGULAR_PAYMENT'
                        AND r.allocation_status IN ('UNPAID')
                        AND r.due_date < CURRENT_DATE
                        AND (r.skipped IS NULL OR r.skipped = FALSE)
                        AND a.account_status = 'ACTIVE'
                        AND (s.delinquency_as_of_date IS null or s.delinquency_as_of_date < current_date)
                        and (a.rating IS NULL OR a.rating NOT IN ('B','C','P', 'S','D','E','F','G','L','U'))
                        and (a.row_created_timestamp >= '2023-01-01' AND  a.row_created_timestamp <= '2025-03-30')
                  ) pastRec
    WHERE pastRec.rnk = 1
)
SELECT pastreceivable.accountPk as "accountPkk", pastreceivable.totalAmount as "amountt", CURRENT_DATE as "postingDatee"
FROM pastreceivable
;

-----

3. Trigger the service : svc/executeCCVintageRun/2023-01-01/2025-03-30
-->https://svc-{{env}}.uownleasing.com/uown/svc/executeCCVintageRun/2023-01-01/2025-03-30
https://svc-{{env}}.uownleasing.com/uown/svc/executeCCVintageRun/2023-01-01/2025-05-06

-----

4. Check sv_credit_card_transaction table for cc_transaction_type = VINTAGE_RUN and cc_transaction_type = VINTAGE_RUN_ON_APPROVED transactions.
You should see VINTAGE_RUN_ON_APPROVED transaction for every VINTAGE_RUN transaction with status = 'APPROVED'

5. You should also receive a report.

-----

UOWN | Atendimento | Implementar Varredura de Execução Vintage CC

Instruções de Teste:

1. Por favor, verifique na tabela sv_sql_config contem as duas entradas: CCVINTAGERUNREPORT, CCVINTAGERUN.
select 
* 
from 
uown_sv_sql_config ussc 
where 
ussc.sql_name like '%CCVINTAGERUN%'
--ussc.sql_name like '%CCVINTAGERUNREPORT%
--ussc.row_created_timestamp between '2025-03-18 00:00:00.000' and '2025-03-18 23:59:59.999'
;

2. Execute a consulta do CCVintageRun (substitua :startDate por 2023-01-01 e :endDate por 2025-03-30). Se você não vir nenhum resultado, faça o seguinte: 
    a. Crie algumas contas (cadastrando leads e solicitando financiamento). 
    b. Vá ao portal de atendimento e, para cada uma dessas contas, altere a Data de Vencimento (página DueAmounts) para uma data no passado, por exemplo, '2025-02-01'. 
    c. Certifique-se de que elas possuem pagamento automático com cartão de crédito. 
    d. Execute novamente a consulta e verifique se alguns registros são retornados.

3. Ative o serviço: svc/executeCCVintageRun/2023-01-01/2025-03-30.

4. Verifique na tabela sv_credit_card_transaction as transações com cc_transaction_type = VINTAGE_RUN e cc_transaction_type = VINTAGE_RUN_ON_APPROVED.
Você deve ver uma transação VINTAGE_RUN_ON_APPROVED para cada transação VINTAGE_RUN com status = 'APPROVED'.

5. Você também deve receber um relatório.

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Requisito da tarefa:
Implementar Varredura de Execução Vintage CC.
Este requisito envolve a verificação das entradas na tabela sv_sql_config, 
a execução de uma consulta para retornar registros específicos, a ativação do serviço para processar essas transações 
e a verificação dos resultados das transações na tabela sv_credit_card_transaction.

-----

Cenário 1: Verificar configuração da consulta CCVintageRun

Scenario: Verify the CCVintageRun query configuration
  Given que acesso a tabela "sv_sql_config" para verificar as entradas
  When eu consultar a tabela "sv_sql_config" para verificar as entradas "CCVINTAGERUNREPORT" e "CCVINTAGERUN"
  Then devo ver que as entradas "CCVINTAGERUNREPORT" e "CCVINTAGERUN" estão devidamente cadastradas

Explicação:
Este cenário verifica se as entradas "CCVINTAGERUNREPORT" e "CCVINTAGERUN" estão registradas corretamente na tabela sv_sql_config.
Isso é importante para garantir que a configuração do ambiente esteja completa para a execução da consulta e do serviço.

Resultado esperado: Ambas as entradas estão presentes na tabela.
Verifique se as entradas "CCVINTAGERUNREPORT" e "CCVINTAGERUN" estão cadastradas corretamente na tabela sv_sql_config.

select 
ussc.pk,ussc.row_created_timestamp ,ussc.sql_name ,ussc.sql_query ,
ussc.*
from
uown_sv_sql_config ussc
where ussc.sql_name like '%CCVINTAGERUN%'
;


select 
ussc.pk,ussc.row_created_timestamp ,ussc.sql_name ,ussc.sql_query ,
ussc.*
from
uown_sv_sql_config ussc
where ussc.sql_name like '%CCVINTAGERUNREPORT%'
;
-----

Cenário 2: Validar execução da consulta CCVintageRun e retorno de registros

Scenario: Validate the execution of CCVintageRun query and record retrieval
  Given que criei algumas contas e alterei a data de vencimento para o passado
  And essas contas possuem pagamento automático com cartão de crédito
  When eu executar a consulta do "CCVintageRun" com as datas "2023-01-01" e "2025-03-30"
  Then devo ver alguns registros sendo retornados pela consulta

Explicação:
Este cenário cobre a execução da consulta CCVintageRun para verificar se, ao alterar as contas e as datas de vencimento, a consulta retorna registros. 
O cenário também simula a criação de contas e a alteração de dados necessários para a consulta funcionar corretamente.

Resultado esperado: A consulta retorna registros quando os critérios são atendidos.
Verifique se a consulta CCVintageRun retorna registros para as contas criadas.

-----

Cenário 3: Validar execução do serviço e atualização das transações

Scenario: Validate execution of CCVintageRun service and transaction updates
  Given que executei o serviço "svc/executeCCVintageRun/2023-01-01/2025-03-30"
  When eu verificar a tabela "sv_credit_card_transaction" par6a transações com "cc_transaction_type" = "VINTAGE_RUN"
  Then devo ver transações "VINTAGE_RUN_ON_APPROVED" para cada transação "VINTAGE_RUN" com status = 'APPROVED'

Explicação:
Este cenário valida a execução do serviço CCVintageRun, que processa as transações conforme as datas especificadas. 
Ele verifica se a execução do serviço resulta na criação de transações com o tipo VINTAGE_RUN_ON_APPROVED para cada transação VINTAGE_RUN que foi aprovada.

Resultado esperado: As transações VINTAGE_RUN_ON_APPROVED são criadas para cada transação VINTAGE_RUN aprovada.
Verifique se as transações "VINTAGE_RUN_ON_APPROVED" foram geradas corretamente para as transações "VINTAGE_RUN" com status aprovado.

https://svc-{{env}}.uownleasing.com/uown/svc/executeCCVintageRun/2023-01-01/2025-03-30
-----

Cenário 4: Validar geração do relatório para transações processadas

Scenario: Validate the report generation for processed transactions
  Given que executei a varredura "CCVintageRun"
  When eu verificar se um relatório foi gerado
  Then devo receber um relatório com as transações processadas

Explicação:
Este cenário valida a geração do relatório que acompanha as transações processadas após a execução do serviço. Ele garante que, após a execução da varredura, um relatório adequado seja gerado contendo as transações que foram processadas.

Resultado esperado: Um relatório contendo as transações processadas é gerado com sucesso.
Verifique se um relatório foi gerado para as transações processadas.

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verifique se as entradas "CCVINTAGERUNREPORT" e "CCVINTAGERUN" estão cadastradas corretamente na tabela sv_sql_config
Verify that the "CCVINTAGERUNREPORT" and "CCVINTAGERUN" entries are correctly registered in the sv_sql_config table

Verifique se a consulta CCVintageRun retorna registros para as contas criadas
Verify that the CCVintageRun query returns records for the created accounts

Verifique se as transações "VINTAGE_RUN_ON_APPROVED" foram geradas corretamente para as transações "VINTAGE_RUN" com status aprovado
Verify that the "VINTAGE_RUN_ON_APPROVED" transactions were correctly generated for the "VINTAGE_RUN" transactions with approved status

Verifique se um relatório foi gerado para as transações processadas
Verify that a report was generated for the processed transactions


--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa2

| LeadPk | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ |
| -- | Verify that the "CCVINTAGERUNREPORT" and "CCVINTAGERUN" entries are correctly registered in the sv_sql_config table |  | PASS |
| 9805, 9810, 10020, 10021, 10345 | Verify that the CCVintageRun query returns records for the created accounts |  | PASS |
| 9805, 9810, 10020, 10021, 10345 | Verify that the "VINTAGE_RUN_ON_APPROVED" transactions were correctly generated for the "VINTAGE_RUN" transactions with approved status |  | PASS |
| 9805, 9810, 10020, 10021, 10345 | Verify that a report was generated for the processed transactions |  | PASS |

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa2

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in stg

| LeadPk | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ |
| -- | Verify that the "CCVINTAGERUNREPORT" and "CCVINTAGERUN" entries are correctly registered in the sv_sql_config table |  | PASS |
| -- | Verify that the CCVintageRun query returns records for the created accounts |  | PASS |
| -- | Verify that the "VINTAGE_RUN_ON_APPROVED" transactions were correctly generated for the "VINTAGE_RUN" transactions with approved status |  | PASS |
| -- | Verify that a report was generated for the processed transactions |  | PASS |

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in stg

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
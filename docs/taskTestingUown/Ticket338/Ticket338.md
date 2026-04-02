--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/338

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Servicing | Adjust Sweep Report to Retrieve data within a specific Date/Time Range.

Synopsis
Improve SQL query execution performance by optimizing timestamp handling and avoiding unnecessary conversions that impact indexing.

Business Objective
Modify the sweep logic so that it processes data based on a precise start and end time, 
ensuring that reports reflect the correct period of execution and avoiding inconsistencies caused by ambiguous time references.

Test Case: Validate Report Data for Specific Sweep Execution
Explanation
In ticket #303 (closed), we discussed that the report was fetching records from a previous sweep execution. For example, if a sweep runs at 9:00 AM and another at 11:00 AM, the report for the 11:00 AM sweep was incorrectly including records from the 9:00 AM sweep.
This issue has been fixed, so we only need to ensure that the report for a sweep does not include data from another execution.
Test Steps

Run a sweep at 9:00 AM and store the generated records.
Wait until the first execution being completed and trigger the sweep again.
Ensure that the report of the second execution doesn't have transactions of the first.


Test Case: Validate Report Data for Specific Sweep Execution
Explanation
In ticket #303 (closed), we discussed that the report was fetching records from a previous sweep execution. For example, if a sweep runs at 9:00 AM and another at 11:00 AM, the report for the 11:00 AM sweep was incorrectly including records from the 9:00 AM sweep.
This issue has been fixed, so we only need to ensure that the report for a sweep does not include data from another execution.
Test Steps

Run a sweep at 9:00 AM and store the generated records.
Wait until the first execution being completed and trigger the sweep again.
Ensure that the report of the second execution doesn't have transactions of the first.


------------------------------

UOWN | Atendimento | Ajustar o Relatório de Varredura para Recuperar Dados em um Intervalo Específico de Data/Hora.

Sinopse

Melhorar o desempenho da execução da consulta SQL otimizando o tratamento de carimbos de data/hora e evitando conversões desnecessárias que afetam a indexação.

Objetivo de Negócio

Modificar a lógica de varredura para processar dados com base em um horário de início e fim precisos, garantindo que os relatórios reflitam o período correto de execução e evitando inconsistências causadas por referências de tempo ambíguas.

Caso de Teste: Validar Dados do Relatório para uma Execução Específica de Varredura

Explicação

No ticket #303 (fechado), discutimos que o relatório estava recuperando registros de uma execução de varredura anterior. Por exemplo, se uma varredura era executada às 9:00 e outra às 11:00, o relatório da varredura das 11:00 incluía incorretamente registros da varredura das 9:00.

Esse problema foi corrigido, então agora só precisamos garantir que o relatório de uma varredura não inclua dados de outra execução.

Passos do Teste

Execute uma varredura às 9:00 e armazene os registros gerados.
Aguarde até que a primeira execução esteja concluída e dispare a varredura novamente.
Certifique-se de que o relatório da segunda execução não contém transações da primeira.
Caso de Teste: Validar Dados do Relatório para uma Execução Específica de Varredura

Explicação

No ticket #303 (fechado), discutimos que o relatório estava recuperando registros de uma execução de varredura anterior. Por exemplo, se uma varredura era executada às 9:00 e outra às 11:00, o relatório da varredura das 11:00 incluía incorretamente registros da varredura das 9:00.

Esse problema foi corrigido, então agora só precisamos garantir que o relatório de uma varredura não inclua dados de outra execução.

Passos do Teste

Execute uma varredura às 9:00 e armazene os registros gerados.
Aguarde até que a primeira execução esteja concluída e dispare a varredura novamente.
Certifique-se de que o relatório da segunda execução não contém transações da primeira.



--------------------------------------------------------------------------------------------

#Ticket 303#


Uown | SVC | New rule for 100 day Delinquency CC Rerun ProcessUown | SVC | Nova regra para 100 dias Delinquência CC Rerun Processo

Sinopse
O processo de repetição de delinquência, que tenta pagamentos adicionais em contas que permanecem inadimplentes após a varredura diária do cartão de crédito, 
foi desativado devido a problemas. Essa funcionalidade precisa ser revisada, corrigida e reativada para garantir o manuseio adequado dos pagamentos em atraso.

Objetivo Empresarial
Maximizar a recuperação de pagamentos em atraso, reativando o processo de repetição de delinquência, 
garantindo que as contas sinalizadas como inadimplentes após a varredura inicial do cartão de crédito sejam reprocessadas.

Pedido de Funcionalidade | Requisitos de Negócio
      Analise o existente processo de repetição de delinquência (delinquencyRerunCCPaymentsSweep) para identificar por que ele foi desativado.
        
      Resolva quaisquer problemas técnicos para garantir uma operação suave.
        
      Tente pagamentos adicionais apenas para contas onde:
        
      O pagamento recorrente foi aprovado;

      A conta continua inadimplente.
        
      Fornecer Relatório Adicional exibindo os resultados dos pagamentos adicionais processados durante a repetição da inadimplência.


Davi Artur @davi.artur.gow
@jose.memesdev

Etapas de Teste para Execução de Varredura:

1. Execute a Consulta Manualmente
Execute a seguinte consulta SQL em um cliente de banco de dados:
  SELECT distinct (s.account_pk)\n" +
            "FROM uown_sv_account a\n" +
            " JOIN uown_sv_sched_summary s ON a.pk = s.account_pk\n" +
            " JOIN uown_sv_credit_card cc ON cc.account_pk = s.account_pk\n" +
            " JOIN uown_sv_payment pmt ON pmt.account_pk = s.account_pk\n" +
            "WHERE (s.delinquency_as_of_date IS NULL OR s.delinquency_as_of_date < CURRENT_DATE)\n" +
            "  AND CURRENT_DATE - s.delinquency_as_of_date > 100\n" +
            "  AND a.account_status = 'ACTIVE'\n" +
            "  AND cc.is_deleted IS NOT TRUE\n" +
            "  AND cc.auto_pay IS TRUE\n" +
            "  AND cc.is_valid_card IS NOT FALSE\n" +
            "  AND pmt.status = 'PAID'\n" +
            "  AND pmt.cc_pk IS NOT NULL\n" +
            "AND (a.rating IS NULL OR a.rating NOT IN ('B','C','P','S','D','E','F','G','L','U'))
Verifique os registros retornados pela consulta. Esta consulta será realizada pela varredura, assim, você pode ver uma visualização das contas que serão processadas.

2. Acionar a Execução de Varredura
Chame o seguinte endpoint para executar a varredura:

POST /uown/svc/triggerScheduledTask/delinquencyRerunCCPaymentsSweep

Certifique-se de que a solicitação seja executada com sucesso.

3. Monitorar a Execução de Varredura
A execução da varredura pode levar alguns minutos.

Monitore as transações de cartão de crédito que estão sendo criadas no banco de dados:

SELECT * FROM uown_sv_credit_card_transaction
ORDER BY created_at DESC;
Verifique se novas transações estão sendo criadas conforme o esperado.

4. Validar Relatório de Email
Quando a execução da varredura estiver concluída, você deverá receber um relatório por e-mail.
Confirme se o relatório contém as contas que foram processadas.

5. Verificar Não Há Transações Duplicadas
Cada chave primária (PK) deve ser processada apenas uma vez.

6. Verificar o Tipo de Transação
Certifique-se de que as transações salvas na tabela uown_sv_credit_card_transaction tenham o valor _100_DAY_DELINQUENCY_RUN na coluna cc_transaction_type.

7. Conclusão do Teste
Se todas as etapas acima passarem com sucesso, o teste estará concluído.      

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Funcionalidade: Executar e validar a varredura DailyDelinquencyRerunCCSweep

  Cenário: Verificar contas elegíveis via consulta ao banco de dados
    Dado que eu tenho acesso ao banco de dados da UOWN
    Quando eu executar a consulta SQL para identificar contas com transações de cartão aprovadas no dia atual
    Então eu devo ver uma lista de contas que atendem aos critérios para a varredura

  Cenário: Acionar a execução da varredura
    Dado que eu tenho contas elegíveis para a varredura
    Quando eu chamar o endpoint "POST /uown/svc/triggerScheduledTask/dailyDelinquencyRerunCCSweep"
    Então a varredura deve ser executada com sucesso

  Cenário: Monitorar a criação de novas transações de cartão de crédito
    Dado que a varredura foi executada com sucesso
    Quando eu consultar as transações na tabela "uown_sv_credit_card_transaction"
    Então eu devo ver novas transações criadas com a tentativa de pagamento

  Cenário: Validar recebimento do relatório de e-mail
    Dado que a varredura foi concluída
    Quando eu verificar os relatórios de e-mail enviados pelo sistema
    Então eu devo ver um relatório contendo as contas processadas

  Cenário: Garantir que não há transações duplicadas
    Dado que as transações foram criadas pela varredura
    Quando eu verificar as chaves primárias das transações no banco de dados
    Então cada conta deve ser processada apenas uma vez

  Cenário: Validar o tipo de transação
    Dado que novas transações foram criadas
    Quando eu consultar a coluna "cc_transaction_type" na tabela "uown_sv_credit_card_transaction"
    Então todas as transações devem ter o valor "DAILY_DELINQUENCY_RUN" 

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Feature: Ajustar o Relatório de Varredura para Recuperar Dados em um Intervalo Específico de Data/Hora (Atendimento)

  # Cenário 1: Validar que cada varredura gera registros únicos dentro do seu período, mesmo havendo interseção entre execuções
  Cenário: Verificar que cada execução de varredura apresenta registros únicos, respeitando o intervalo definido
    Dado que a primeira execução de varredura é realizada às 11:00 com um intervalo de data/hora preciso
    Quando a varredura é executada
    Então o relatório gerado deve apresentar apenas registros únicos, sem duplicação interna

    Dado que a segunda execução de varredura é acionada em um intervalo subsequente com data/hora precisos
    Quando a varredura é executada
    Então o relatório da segunda execução deve apresentar apenas registros únicos
    E é permitido que alguns registros sejam comuns à primeira execução, desde que pertençam ao intervalo definido para a segunda varredura



  
Feature: Executar e Validar a Varredura DailyDelinquencyRerunCCSweep

  # Cenário 1: Verificar contas elegíveis via consulta SQL
  Scenario: 1 - Validar que a consulta SQL retorna as contas elegíveis para o rerun de inadimplência
    Given que eu tenho acesso ao banco de dados da UOWN
    When eu executo a consulta SQL para identificar contas com transações de cartão aprovadas no dia atual
    Then eu devo ver uma lista de contas que atendem aos critérios para a varredura
    And a lista de contas deve corresponder aos critérios definidos (ex.: pagamento recorrente aprovado, conta ativa, etc.)
-----
SELECT 
distinct (s.account_pk)
FROM 
uown_sv_account a
JOIN uown_sv_sched_summary s ON a.pk = s.account_pk
JOIN uown_sv_credit_card cc ON cc.account_pk = s.account_pk
JOIN uown_sv_payment pmt ON pmt.account_pk = s.account_pk
WHERE 
(s.delinquency_as_of_date IS NULL OR s.delinquency_as_of_date < CURRENT_DATE)
AND CURRENT_DATE - s.delinquency_as_of_date > 100
AND a.account_status = 'ACTIVE'
AND cc.is_deleted IS NOT TRUE
AND cc.auto_pay IS TRUE
AND cc.is_valid_card IS NOT FALSE
AND pmt.status = 'PAID'
AND pmt.cc_pk IS NOT NULL
AND (a.rating IS NULL OR a.rating NOT IN ('B','C','P','S','D','E','F','G','L','U'))
;
-----
-- 1. Execute a Consulta Manualmente
-- Execute a seguinte consulta SQL em um cliente de banco de dados:
SELECT 
distinct (s.account_pk),
a.account_status,a.activation_date,a.cc_auto_pay,a.lead_pk,
a.*,cc.*,pmt.*
FROM 
uown_sv_account a
JOIN uown_sv_sched_summary s ON a.pk = s.account_pk
JOIN uown_sv_credit_card cc ON cc.account_pk = s.account_pk
JOIN uown_sv_payment pmt ON pmt.account_pk = s.account_pk
WHERE 
(s.delinquency_as_of_date IS NULL OR s.delinquency_as_of_date < CURRENT_DATE)
AND CURRENT_DATE - s.delinquency_as_of_date > 100 
AND a.account_status = 'ACTIVE'
AND cc.is_deleted IS NOT TRUE
AND cc.auto_pay IS TRUE
AND cc.is_valid_card IS NOT FALSE
AND pmt.status = 'PAID'
AND pmt.cc_pk IS NOT NULL
AND (a.rating IS NULL OR a.rating NOT IN ('B','C','P','S','D','E','F','G','L','U'))
;
-- Verifique os registros retornados pela consulta. Esta consulta será realizada pela varredura, assim, você pode ver uma visualização das contas que serão processadas.
-----

  # Cenário 2: Acionar a execução da varredura
  Scenario: 2 - Acionar a execução do DailyDelinquencyRerunCCSweep com sucesso
    Given que existem contas elegíveis para a varredura
    When eu chamar o endpoint "POST /uown/svc/triggerScheduledTask/delinquencyRerunCCPaymentsSweep"
    Then a solicitação deve ser executada com sucesso
    And o status da resposta deve ser 200

https://svc-{{env}}.uownleasing.com/uown/svc/triggerScheduledTask/delinquencyRerunCCPaymentsSweep
-----

  # Cenário 3: Monitorar a criação de novas transações de cartão de crédito
  Scenario: 3 - Verificar que novas transações de cartão de crédito são criadas após a varredura
    Given que a varredura foi acionada com sucesso
    When eu consultar a tabela "uown_sv_credit_card_transaction" no banco de dados
    Then eu devo ver novas transações criadas que correspondam às contas processadas
    And os registros devem refletir as tentativas de pagamento adicionais

select 
uscct.lead_pk ,uscct.account_pk ,uscct.row_created_timestamp ,uscct.cc_type ,uscct.cc_transaction_type ,uscct.completed_time ,uscct.error ,uscct.error_code,uscct.status,
uscct.*
from 
uown_sv_credit_card_transaction uscct 
where
uscct.row_created_timestamp between '2025-03-16 00:00:00.000' and '2025-03-16 23:59:59.999'
;
-----    

  # Cenário 4: Validar recebimento do relatório por e-mail
  Scenario: 4 - Confirmar que o relatório de varredura é enviado por e-mail com os dados processados
    Given que a varredura foi concluída
    When eu verificar os relatórios de e-mail enviados pelo sistema
    Then eu devo ver um relatório contendo as contas processadas na varredura
    And o relatório deve listar as informações corretas de cada conta
-----    

  # Cenário 5: Garantir que não há transações duplicadas
  Scenario: 5 - Verificar que cada conta é processada apenas uma vez na varredura
    Given que a varredura foi executada
    When eu consultar as chaves primárias das transações na tabela "uown_sv_credit_card_transaction"
    Then cada conta deve aparecer apenas uma vez
    And não devem existir registros duplicados
-----~

  # Cenário 6: Validar o tipo de transação nas novas transações
  Scenario: 6 - Confirmar que as transações criadas possuem o tipo "DAILY_DELINQUENCY_RUN"
    Given que novas transações foram criadas pela varredura
    When eu consultar a coluna "cc_transaction_type" na tabela "uown_sv_credit_card_transaction"
    Then todas as transações devem ter o valor "DAILY_DELINQUENCY_RUN"
-----    

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa2

| Test Case | Test Data | Status |
| ------ | ------ | ------ |
| Verify that each sweep execution generates a report with unique records for its respective range, allowing common records to appear in different executions if they fall within the defined periods |  | PASS |

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verifique se cada execução da varredura gera um relatório com registros únicos para seu respectivo intervalo, 
permitindo que registros comuns apareçam em execuções distintas se estiverem dentro dos períodos definidos.

Verify that each sweep execution generates a report with unique records for its respective range, 
allowing common records to appear in different executions if they fall within the defined periods.

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

OK in qa2

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in stg

| Test Case | Test Data | Status |
| ------ | ------ | ------ |
| Verify that each sweep execution generates a report with unique records for its respective range, allowing common records to appear in different executions if they fall within the defined periods |  | WIP |

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

OK in stg

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
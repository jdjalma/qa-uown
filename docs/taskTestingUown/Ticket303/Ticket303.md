------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/303

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Uown | SVC | Nova regra para 100 dias Delinquência CC Rerun Processo

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
http://svc-{{env}}.uownleasing.com
https://svc-{{env}}.uownleasing.com/uown/svc/triggerScheduledTask/delinquencyRerunCCPaymentsSweep

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

------------------------------------------------------------------------------------------------------------------------------------------------------------------    
Tests in qa1 

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| -- | -- | Verify eligible accounts via database query. |  | PASS |
| -- | -- | Check if the scan execution returns success |  | PASS |
| -- | -- | Monitor the creation of new credit card transactions |  | PASS |
| -- | -- | Validate the receipt of the email report |  | PASS |
| -- | -- | Ensure that there are no duplicate transactions |  | PASS |
| -- | -- | Validate the transaction type DAILY_DELINQUENCY_RUN |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verificar contas elegíveis via consulta ao banco de dados
Verify eligible accounts via database query

Verificar se a execução da varredura retorna sucesso
Check if the scan execution returns success

Monitorar a criação de novas transações de cartão de crédito
Monitor the creation of new credit card transactions

Validar o recebimento do relatório por e-mail
Validate the receipt of the email report

Garantir que não há transações duplicadas
Ensure that there are no duplicate transactions

Validar o tipo de transação DAILY_DELINQUENCY_RUN
Validate the transaction type DAILY_DELINQUENCY_RUN

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa1

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verifique as transações de cartão de crédito recebidas via email, garantindo a execução sem duplicação, ao rodar a varredura delinquencyRerunCCPaymentsSweep
Verify credit card transactions and their types, ensuring execution without duplication, when running the delinquencyRerunCCPaymentsSweep scan

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Check the credit card transactions received in the report via email, ensuring execution without duplication when running the delinquencyRerunCCPaymentsSweep scan.


Tests in staging

| LeadPk | Merchant | Test Case | Test Data | Status | 
| ------ | ------ | ------ | ------ | ------ |
| -- | -- | Check the credit card transactions received in the report via email, ensuring execution without duplication when running the delinquencyRerunCCPaymentsSweep scan. |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in staging

------------------------------------------------------------------------------------------------------------------------------------------------------------------
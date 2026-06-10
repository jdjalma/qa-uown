------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/320

------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | SVC | Adicionar uma nova varredura "DailyDelinquencyRerunCCSweep"

Sinopse
Esta tarefa envolve a criação de um novo Processo de Varredura nomeado “DailyDelinquencyRerunCCSweep” identificar contas inadimplentes 
e tentar novamente transações com cartão de crédito que foram previamente aprovadas no mesmo dia. 
O objetivo é maximizar a cobrança de pagamentos de clientes cujos pagamentos foram processados com sucesso no início do dia.

Objetivo Empresarial
O objetivo desta varredura é aumentar a recuperação de pagamentos de clientes inadimplentes, 
executando uma tentativa adicional no mesmo dia para transações com cartão de crédito que foram previamente aprovadas. 

Pedido de Funcionalidade | Requisitos de Negócio 
      
Identificar Transações Aprovadas:        
      Consulta o Tabela de transações de cartão de crédito SV encontrar transações com cartão de crédito aprovado no dia atual.
      Assegurar o data de publicação da transação corresponde ao data atual.
      
Verifique se há Contas Inadimplentes:
Cruzar com resumo do cronograma, garantindo que delinquency_as_of_date < data atual.

Excluir Certas Classificações de Conta:
A conta deve atender a um dos seguintes critérios:
      classificação IS NULL
      classificação NOT IN ('P', 'C', 'D', 'B') (onde “B” indica falência, “P” significa acordo de pagamento, etc.).
      
Certifique-se de que a Conta está Ativa:
O status da conta deve ser “Active” para ser elegível para o processo de varredura.

Execute o Processo de Varredura:   
      Gerar um consulta/script para automatizar essa filtragem e executar o segunda tentativa de pagamento para transações identificadas.     
      Certifique-se de que apenas as contas que atendem a todas as condições acima sejam processadas.



Davi Artur @davi.artur.gow
@jose.memesdev

Etapas de Teste para Execução de Varredura

1. Execute a Consulta Manualmente

Execute a seguinte consulta SQL em um cliente de banco de dados local:

SELECT distinct(ss.account_pk) FROM uown_sv_credit_card_transaction cc
JOIN uown_sv_sched_summary ss ON ss.account_pk = cc.account_pk
JOIN uown_sv_account acc ON acc.pk = ss.account_pk
WHERE cc.posting_date = CURRENT_DATE
AND cc.cc_action = 'SALE'
AND cc.status = 'APPROVED'
AND ss.delinquency_as_of_date < CURRENT_DATE
AND acc.account_status = 'ACTIVE'
AND (acc.rating IS NULL OR acc.rating NOT IN ('B','C','P','S','D','E','F','G','L','U'))

Verifique os registros retornados pela consulta. Esta consulta será realizada pela varredura, assim, você pode ver uma visualização das contas que serão processadas.

2. Acionar a Execução de Varredura
Chame o seguinte endpoint para executar a varredura:

POST /uown/svc/triggerScheduledTask/dailyDelinquencyRerunCCSweep

Certifique-se de que a solicitação seja executada com sucesso.

3. Monitorar a Execução de Varredura
A execução da varredura pode levar alguns minutos.

Monitore as transações de cartão de crédito que estão sendo criadas no banco de dados:

SELECT pk, cc_transaction_type, row_created_timestamp FROM uown_sv_credit_card_transaction
ORDEM POR Pk DESC LIMIT 100;


- Verifique se novas transações estão sendo criadas conforme o esperado.

### **4. Validar relatório de e-mail**
- Assim que a execução da varredura for concluída, você deverá receber um relatório de e-mail.
- Confirme se o relatório contém as contas que foram processadas.

### **5. Verificar se não há transações duplicadas**
- Cada chave primária (PK) deve ser processada apenas uma vez.

### **6. Verificar tipo de transação**
- Certifique-se de que as transações salvas na tabela uown_sv_credit_card_transaction tenham o valor DAILY_DELINQUENCY_RUN na coluna cc_transaction_type.

### **7. Conclusão do teste**
- Se todas as etapas acima forem aprovadas com sucesso, o teste estará concluído.

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

Verifique as transações de cartão de crédito e seus tipos, garantindo a execução sem duplicação, ao rodar a varredura dailyDelinquencyRerunCCSweep
Verify credit card transactions and their types, ensuring execution without duplication, when running the DailyDelinquencyRerunCCSweep scan

------------------------------------------------------------------------------------------------------------------------------------------------------------------
Tests in staging

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| -- | -- | Check the credit card transactions received in the report via email, ensuring execution without duplication when running the DailyDelinquencyRerunCCSweep scan |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in staging

------------------------------------------------------------------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/346

------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Servicing | Paid_out_early_epo Returned Payments

Synopsis
It was observed that a customer made a paid-off 90 days on 01/03, but their payment was returned on 04/03, 
and their account was not automatically re-opened. We need to analyze the reason for this and correct it.


Business Objective
Automatically re-open accounts with returned payments so that Agents do not have to do it manually.

Feature Request | Business Requirements
1. Analyze the logic behind this functionality.     
2. Ensure that the account is automatically reopened if the payment is returned.
https://gitlab.com/-/project/62177899/uploads/82100dafe2685eb7fbdfa181a3a5995a/image.png


Sowjanya Kaligineedi @skaligineedi
@fernandogmartins Steps to replicate the issue:

#346 (comment 2433894369)
1. Create a Request ACH for an active account within the 90-day EPO period, with a total amount equal to the EPO amount. Use the following bank account numbers:
Routing Number: 021000021
Account Number (ending in 1): 123456781

2. Send ACH Payment:
Run this URL: https://svc-{env}.uownleasing.com/uown/svc/sendACHPaymentsSweep
This sends the ACH payment to the third-party vendor, Profituity, which handles the interaction with the actual bank. 
At this point system marks the ACH payment as SENT.

3. Check ACH Payment Status:
Wait 5 minutes, then run: https://svc-{env}.uownleasing.com/uown/svc/getSendACHPaymentsStatusSweep
This checks with the vendor to see if they received the file. If everything is correct, the ACH payment will be posted on 
the account(check payments page on servicing) and account should be marked as PAID_OUT_EARLY_EPO.

4. Get ACH Payment Status:
Run: https://svc-{env}.uownleasing.com/uown/svc/getStatusDatePaymentsListSweep
Normally, in prod this sweeps gets the status of the ACH payment after 2-3 days. But in this test, since we are using an 
account ending in 1, the system marks the payment as RETURNED once you run this sweep(as per the test setup).
Check the ACH history page in servicing to see that the payment is marked as RETURNED.

5. Reverse the ACH Payment:
Run: https://svc-{env}.uownleasing.com/uown/svc/reverseAchPaymentsSweep
This reverses the payment on account((check payments page on servicing - payment should have been marked as reversed), 
and the account should be marked back as ACTIVE instead of PAID_OUT_EARLY_EPO since payment that marked account PAID_OUT_EARLY_EPO reversed.

The changes to handle the PAID_OUT_EARLY_EPO status that you were making before(dd19eb18) should fix the issue. 
Please replicate the issue using steps provided, and once the changes you made resolve the issue, submit an Merge Request (MR).

Fernando Martins fernandogmartins
Queries that need to be updated on production:
uown_sv_sql_config: ISELIGIBLEFORREAPROVAL
uown_sv_sql_config: OPENTOBUYCUSTOMERS
uown_sv_sql_config: RERUNACH
uown_sv_sql_config: GETFUNDINGREPORT
uown_scheduled_task: paidInFullAccountEmailSweep
uown_scheduled_task: sendDailyBorrowingBaseReport

Fernando Martins @fernandogmartins
Testing Steps:

Follow the described steps: #346 (comment 2433894369)
Validate that the status PAID_OUT_EARLY_EPO was changed to ACTIVE after running the reverseAchPaymentsSweep.
Verify if the logs and the Alert were properly created.

-----

UOWN | Servicing | Pagamentos Retornados de Paid_out_early_epo

Sinopse
Foi observado que um cliente realizou um pagamento de 90 dias em 01/03, mas o pagamento foi retornado em 04/03, e a conta não foi reaberta automaticamente. Precisamos analisar o motivo e corrigi-lo.

Objetivo de Negócio
Reabrir automaticamente contas com pagamentos retornados para que os agentes não precisem fazer isso manualmente.

Solicitação de Recurso | Requisitos de Negócio
Analisar a lógica por trás dessa funcionalidade.
Garantir que a conta seja reaberta automaticamente se o pagamento for retornado.
https://gitlab.com/-/project/62177899/uploads/82100dafe2685eb7fbdfa181a3a5995a/image.png
Sowjanya Kaligineedi @skaligineedi

@fernandogmartins Passos para replicar o problema:
#346 (comentário 2433894369)
Criar uma solicitação ACH para uma conta ativa dentro do período EPO de 90 dias, com o valor total igual ao montante EPO. Use os seguintes números de conta bancária:
Número de Roteamento: 021000021
Número da Conta (terminando em 1): 123456781
Enviar Pagamento ACH:
Execute esta URL: https://svc-{env}.uownleasing.com/uown/svc/sendACHPaymentsSweep
Isso envia o pagamento ACH ao fornecedor terceirizado, Profituity, que gerencia a interação com o banco. Nesse ponto, o sistema marca o pagamento ACH como ENVIADO.
Verificar o Status do Pagamento ACH:
Aguarde 5 minutos e execute: https://svc-{env}.uownleasing.com/uown/svc/getSendACHPaymentsStatusSweep
Isso verifica com o fornecedor se o arquivo foi recebido. Se tudo estiver correto, o pagamento ACH será registrado na conta (verifique a página de pagamentos no servicing) e a conta deve ser marcada como PAID_OUT_EARLY_EPO.
Obter o Status do Pagamento ACH:
Execute: https://svc-{env}.uownleasing.com/uown/svc/getStatusDatePaymentsListSweep
Normalmente, em produção, esse sweep obtém o status do pagamento ACH após 2-3 dias. Mas neste teste, como usamos uma conta terminando em 1, o sistema marca o pagamento como RETORNADO ao executar este sweep (conforme configuração de teste).
Verifique a página de histórico ACH no servicing para confirmar que o pagamento está marcado como RETORNADO.
Reverter o Pagamento ACH:
Execute: https://svc-{env}.uownleasing.com/uown/svc/reverseAchPaymentsSweep
Isso reverte o pagamento na conta (verifique a página de pagamentos no servicing - o pagamento deve ser marcado como revertido), e a conta deve voltar a ser marcada como ATIVA em vez de PAID_OUT_EARLY_EPO, já que o pagamento que marcou a conta como PAID_OUT_EARLY_EPO foi revertido.
As alterações para lidar com o status PAID_OUT_EARLY_EPO que você estava fazendo antes (dd19eb18) devem resolver o problema. Por favor, replique o problema usando os passos fornecidos e, após as alterações resolverem o problema, envie um Merge Request (MR).

Fernando Martins @fernandogmartins

Consultas que precisam ser atualizadas em produção:
uown_sv_sql_config: ISELIGIBLEFORREAPROVAL
uown_sv_sql_config: OPENTOBUYCUSTOMERS
uown_sv_sql_config: RERUNACH
uown_sv_sql_config: GETFUNDINGREPORT
uown_scheduled_task: paidInFullAccountEmailSweep
uown_scheduled_task: sendDailyBorrowingBaseReport

Fernando Martins @fernandogmartins

Passos de Teste:
Siga os passos descritos: #346 (comentário 2433894369)
Valide que o status PAID_OUT_EARLY_EPO foi alterado para ATIVO após executar o reverseAchPaymentsSweep.
Verifique se os logs e o Alerta foram criados corretamente.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

📋 Requisito da Tarefa
Reabrir automaticamente contas com pagamentos retornados para que os agentes não precisem fazer isso manualmente.
O pagamento de 90 dias, que foi marcado como "PAID_OUT_EARLY_EPO", deve ser revertido corretamente quando o pagamento for retornado, e a conta deve ser automaticamente reaberta.

🧪 Cenários de Teste Gherkin

Scenario 1 – Verificar se a conta é reaberta automaticamente após o pagamento retornado

Scenario: 1 - Verificar se a conta é reaberta automaticamente após o pagamento retornado
  Given que o pagamento ACH foi revertido com sucesso
  When o pagamento retornado é processado
  Then a conta deve ser reaberta automaticamente e marcada como ATIVA
  And verifique no banco de dados que o status da conta foi alterado para ATIVA
  And verifique nos logs que a reversão do pagamento foi registrada corretamente

🔍 Verifique se, após o pagamento ACH ser revertido, a conta é reaberta automaticamente e marcada como "ATIVA" no banco de dados e nos logs.
📝 Explicação: Este cenário valida se o sistema reabre automaticamente a conta e marca como "ATIVA" após a reversão do pagamento retornado.
✅ Resultado Esperado: A conta é reaberta automaticamente e marcada como "ATIVA", com os registros de reversão nos logs.

-----

Scenario 2 – Verificar se o status "PAID_OUT_EARLY_EPO" é alterado para "ATIVA" após a reversão do pagamento

Scenario: 2 - Verificar se o status "PAID_OUT_EARLY_EPO" é alterado para "ATIVA" após a reversão do pagamento
  Given que o pagamento ACH foi revertido com sucesso
  When o pagamento retornado é processado e a reversão é concluída
  Then o status da conta deve ser alterado de PAID_OUT_EARLY_EPO para ATIVA
  And verifique na interface que o status da conta foi alterado corretamente
  And verifique no banco de dados que o status da conta foi alterado para ATIVA

🔍 Verifique se, ao reverter o pagamento ACH, o status da conta é alterado de "PAID_OUT_EARLY_EPO" para "ATIVA".
📝 Explicação: Esse cenário assegura que o status da conta seja alterado corretamente para "ATIVA" após a reversão do pagamento ACH.
✅ Resultado Esperado: O status da conta é alterado corretamente de "PAID_OUT_EARLY_EPO" para "ATIVA" na interface e no banco de dados.

-----

Scenario 3 – Verificar a criação de logs e alertas após a reversão do pagamento

Scenario: 3 - Verificar a criação de logs e alertas após a reversão do pagamento
  Given que o pagamento ACH foi revertido com sucesso
  When a reversão do pagamento é processada
  Then um log detalhado da reversão deve ser criado
  And um alerta de reversão deve ser gerado corretamente
  And verifique nos logs que os detalhes da reversão do pagamento foram registrados

🔍 Verifique se, após a reversão do pagamento, os logs e alertas são gerados corretamente para documentar o processo.
📝 Explicação: Esse cenário valida a criação de logs e alertas após a reversão do pagamento, para garantir o acompanhamento adequado do processo.
✅ Resultado Esperado: Logs e alertas são criados corretamente, detalhando a reversão do pagamento ACH.

-----

Scenario 4 – Verificar o status do pagamento ACH após a execução do sweep getStatusDatePaymentsListSweep

Scenario: 4 - Verificar o status do pagamento ACH após a execução do sweep `getStatusDatePaymentsListSweep`
  Given que o pagamento ACH foi enviado e processado
  When a execução do sweep `getStatusDatePaymentsListSweep` é realizada
  Then o status do pagamento ACH deve ser registrado como "RETORNADO" no histórico
  And verifique no banco de dados que o status foi corretamente atualizado como "RETORNADO"

🔍 Verifique se o status do pagamento ACH é corretamente atualizado para "RETORNADO" após a execução do sweep getStatusDatePaymentsListSweep.
📝 Explicação: Esse cenário valida a atualização do status do pagamento ACH após o sweep, quando o pagamento é retornado.
✅ Resultado Esperado: O status do pagamento ACH é corretamente registrado como "RETORNADO" na interface e no banco de dados.

-----

Scenario 5 – Verificar se o pagamento ACH é revertido corretamente ao executar o reverseAchPaymentsSweep

Scenario: 5 - Verificar se o pagamento ACH é revertido corretamente ao executar o `reverseAchPaymentsSweep`
  Given que o pagamento ACH foi registrado como "RETORNADO"
  When o `reverseAchPaymentsSweep` é executado
  Then o pagamento deve ser revertido e o status da conta alterado para "ATIVA"
  And verifique no banco de dados que o pagamento foi revertido e a conta foi reaberta

🔍 Verifique se a execução do reverseAchPaymentsSweep reverte corretamente o pagamento ACH e reabre a conta, alterando seu status para "ATIVA".
📝 Explicação: Este cenário valida que a execução do sweep de reversão (reverseAchPaymentsSweep) funciona corretamente, revertendo o pagamento e reabrindo a conta.
✅ Resultado Esperado: O pagamento ACH é revertido corretamente e o status da conta é alterado para "ATIVA".

-----

Scenario 6 – Verificar se a execução do sendACHPaymentsStatusSweep retorna o status correto do pagamento ACH

Scenario: 6 - Verificar se a execução do `sendACHPaymentsStatusSweep` retorna o status correto do pagamento ACH
  Given que o pagamento ACH foi enviado e está sendo processado
  When o `sendACHPaymentsStatusSweep` é executado
  Then o status do pagamento ACH deve ser retornado corretamente
  And verifique nos logs que o status do pagamento ACH foi registrado corretamente como "PAID_OUT_EARLY_EPO" ou "RETORNADO"

🔍 Verifique se o sweep sendACHPaymentsStatusSweep retorna o status correto do pagamento ACH, registrando-o como "PAID_OUT_EARLY_EPO" ou "RETORNADO".
📝 Explicação: Este cenário garante que o sweep sendACHPaymentsStatusSweep retorne e registre o status correto do pagamento ACH no sistema.
✅ Resultado Esperado: O status do pagamento ACH é corretamente registrado como "PAID_OUT_EARLY_EPO" ou "RETORNADO".

-----

🧾 Resumo dos Requisitos e Cenários
| Requisito	                            |                        Cenário(s) que cobre |
| Reabrir automaticamente contas com pagamentos retornados.	                | 1, 2, 5 |
| Garantir que o status "PAID_OUT_EARLY_EPO" seja alterado para "ATIVA".          | 2 |
| Validar a criação de logs e alertas após a reversão do pagamento.	              | 3 |
| Verificar o status do pagamento ACH após a execução do sweep de status.	   | 4, 6 |
| Validar a reversão do pagamento ACH com a execução do reverseAchPaymentsSweep.  | 5 |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verifique se a execução do reverseAchPaymentsSweep reverte corretamente o pagamento ACH e reabre a conta, alterando seu status para "ATIVA."
Verify that running reverseAchPaymentsSweep correctly reverses the ACH payment and reopens the account, changing its status to "ACTIVE."
------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa1

| AccountPk | Merchant | Test Case | Test Data | Status | Observation |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 3832 and 3833 | Progress Mobility | Verify that running reverseAchPaymentsSweep correctly reverses the ACH payment and reopens the account, changing its status to "ACTIVE." |  | ERROR | When running reverseAchPaymentsSweep, the payment is not reversed, and the status is not changed to ACTIVE |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa1

------------------------------------------------------------------------------------------------------------------------------------------------------------------

stg

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in stg

| AccountPk | Merchant | Test Case | Test Data | Status | Observation |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 206269 | Progress Mobility | Verify that running reverseAchPaymentsSweep correctly reverses the ACH payment and reopens the account, changing its status to "ACTIVE." |  | PASS | -- |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in stg

------------------------------------------------------------------------------------------------------------------------------------------------------------------
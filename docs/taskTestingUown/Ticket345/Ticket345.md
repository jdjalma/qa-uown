------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/345

------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/345

UOWN | Servicing | Automatic P Rating removal if payment fails.


Synopsis
When a customer who has a credit card with a scheduled payment on the 10th (for example) contacts Uown to postpone this payment, 
and the Agent reschedules it to the 15th (for example), a P Rating Letter (Payment Arrangement) is added. However, 
when the payment is not made on the new scheduled date, the P Rating remains. 
It is necessary for the P Rating to be automatically removed if the payment is not made for any reason.

Business Objective
Automatically removing the P Rating (Payment Arrangement) is important so that the UOWN Agent does not have to manually check 
and execute the removal every time this error occurs.

Feature Request | Business Requirements   
Analyze and identify the root cause of the error.    
Ensure that the P Rating (Payment Arrangement) is removed whenever the payment is not made.


Fernando Martins @fernandogmartins

Testing Steps:
Add a invalid credit card for a account.
Examples:
Card Declined                           4000300011112220
Invalid Transaction                     4000300311112227
Invalid Issuer                          4000300411112226
Insufficient funds                      4000300611112224
Make a Payment Arrangement with the start date in the future
Check if it was scheduled
Go to the table uown_sv_credit_card_transaction and alter the posting date to be today instead of in the future
Run /uown/svc/sendCreditCardPaymentsSweep and validate if the P rating was removed

-----

Em Português
https://gitlab.com/uown/backend/svc/-/issues/345

UOWN | Servicing | Remoção Automática da Classificação P se o Pagamento Falhar

Sinopse
Quando um cliente com cartão de crédito com pagamento agendado para o dia 10 (por exemplo) entra em contato com a Uown para adiar esse pagamento, e o Agente reagenda para o dia 15 (por exemplo), uma Carta de Classificação P (Acordo de Pagamento) é adicionada. No entanto, quando o pagamento não é realizado na nova data agendada, a Classificação P permanece. É necessário que a Classificação P seja removida automaticamente se o pagamento não for realizado por qualquer motivo.

Objetivo de Negócio
Remover automaticamente a Classificação P (Acordo de Pagamento) é importante para que o Agente da UOWN não precise verificar e executar a remoção manualmente sempre que esse erro ocorrer.
Solicitação de Recurso | Requisitos de Negócio
Analisar e identificar a causa raiz do erro.
Garantir que a Classificação P (Acordo de Pagamento) seja removida sempre que o pagamento não for realizado.


Fernando Martins @fernandogmartins

Passos de Teste:
Adicionar um cartão de crédito inválido para uma conta.

Exemplos:
Cartão Recusado: 4000300011112220
Transação Inválida: 4000300311112227
Emissor Inválido: 4000300411112226
Fundos Insuficientes: 4000300611112224
Fazer um Acordo de Pagamento com a data de início no futuro.
Verificar se foi agendado.
Ir para a tabela uown_sv_credit_card_transaction e alterar a data de postagem para hoje, em vez de uma data futura.
Executar /uown/svc/sendCreditCardPaymentsSweep
validar se a Classificação P foi removida.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

📋 Requisito da Tarefa
Remover automaticamente o P Rating (Pagamento Arranjado) se o pagamento agendado não for realizado.
A tarefa exige que o sistema remova automaticamente o P Rating (Payment Arrangement) quando o pagamento não for feito, 
evitando que o Agente precise realizar a remoção manualmente.


🧪 Cenários de Teste Gherkin

Scenario 1 – Verificar se o P Rating é removido quando o pagamento falha devido ao cartão de crédito inválido

Scenario: 1 - Verificar se o P Rating é removido quando o pagamento falha devido ao cartão de crédito inválido
  Given que o usuário adiciona um cartão de crédito inválido à conta
  When o pagamento é agendado para o dia 15
  And o pagamento não é realizado devido ao cartão de crédito inválido
  Then o P Rating (Pagamento Arranjado) deve ser removido automaticamente
  And verifique no banco de dados que o P Rating foi removido da conta

🔍 Verifique se o P Rating (Pagamento Arranjado) é removido automaticamente quando o pagamento falha devido a um cartão de crédito inválido.
📝 Explicação: Este cenário valida se o P Rating é removido automaticamente quando um pagamento falha devido a problemas no cartão de crédito.
✅ Resultado Esperado: O P Rating é removido automaticamente e não permanece na conta.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verifique se o P Rating (Pagamento Arranjado) é removido automaticamente quando o pagamento falha devido a um cartão de crédito inválido
Verify that the P Rating (Payment Arrangement) is automatically removed when the payment fails due to an invalid credit card

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa1

| AccountPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 3695 | Progress Mobility | Verify that the P Rating (Payment Arrangement) is automatically removed when the payment fails due to an invalid credit card |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa1

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in stg

| AccountPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 206281 | Tire Agent | Verify that the P Rating (Payment Arrangement) is automatically removed when the payment fails due to an invalid credit card |  | PASS |


Tests in stg

| AccountPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 206281 | Tire Agent | Verify that the P Rating (Payment Arrangement) is automatically removed when the payment fails due to an invalid credit card | ![stg-345-c1_1_](/uploads/987e5816a3763d55b39b54384157792a/stg-345-c1_1_.png){width=910 height=739}![stg-345-c1_2_](/uploads/fc84a98556a4c5355fafa0357654e077/stg-345-c1_2_.png){width=910 height=739}![stg-345-c1_3_](/uploads/5925dcc6cca3e5c22966f3dc9fd7b7ab/stg-345-c1_3_.png){width=1439 height=739}![stg-345-c1_4_](/uploads/6a38347e29ef77ffce4de46134bdf739/stg-345-c1_4_.png){width=1439 height=739}![stg-345-c1_5_](/uploads/485286841d889488bbf71874d9a538f3/stg-345-c1_5_.png){width=1439 height=739}![stg-345-c1_6_](/uploads/18ba42d102d17162f6b7994fa3904efe/stg-345-c1_6_.png){width=1439 height=739}![stg-345-c1_7_](/uploads/2e39747387f7aebc2108bb449c744e68/stg-345-c1_7_.png){width=1439 height=739}![stg-345-c1_8_](/uploads/f82fd5da8428ea25136e104e3eeba25e/stg-345-c1_8_.png){width=1439 height=739}![stg-345-c1_9_](/uploads/6b548c68943f1c24e8b1c60af8853f0a/stg-345-c1_9_.png){width=1160 height=144}![stg-345-c1_10_](/uploads/6b514eaa5db6a1b510454898799614e3/stg-345-c1_10_.png){width=1160 height=144}![stg-345-c1_11_](/uploads/8ea49a0a8a1fc367e9516c4904b338cc/stg-345-c1_11_.png){width=1117 height=543}![stg-345-c1_12_](/uploads/c48742a461404528fcf2cc19399a15f7/stg-345-c1_12_.png){width=1430 height=740}![stg-345-c1_13_](/uploads/71d8031fc274b0128ab593ad22a1fd9e/stg-345-c1_13_.png){width=1430 height=740} | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

andre.lima.gow@uownleasing.com
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/344

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Servicing | Improvement of the "DailyDelinquencyRerunCCSweep"

Synopsis
In this task, we aim to improve an existing functionality, the "DailyDelinquencyRerunCCSweep".
Your function is to identify delinquent accounts and reattempt credit card transactions that were previously approved on the same day.

Business Objective
The goal is to maximize payment collection from customers whose payments were successfully processed earlier in the day.

Feature Request | Business Requirements
Increase the number of threads used to process transactions

Davi Artur @davi.artur.gow
@jose.mendesdev, 
it's similar to the ones done previously: trigger the sweep and wait for the report to arrive. 
I can write the tests steps again if you want, but I think that's not necessary.

-----

UOWN | Serviços | Melhoria do "DailyDelinquencyRerunCCSweep"

Sinopse
Nesta tarefa, buscamos melhorar uma funcionalidade existente, o "DailyDelinquencyRerunCCSweep".
Sua função é identificar contas inadimplentes e tentar novamente transações de cartão de crédito que foram aprovadas anteriormente no mesmo dia.

Objetivo de Negócio
O objetivo é maximizar a cobrança de pagamentos de clientes cujos pagamentos foram processados com sucesso mais cedo no dia.

Solicitação de Recurso | Requisitos de Negócio
Aumentar o número de threads usadas para processar transações

Davi Artur @davi.artur.gow
@jose.mendesdev,
é semelhante aos realizados anteriormente: acione a varredura e aguarde o relatório chegar.
Posso escrever os passos de teste novamente se você quiser, mas acho que não é necessário.

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa1

| Test Case | Test Data | Status |
| ------ | ------ | ------ |
| Check the credit card transactions received in the report via email, ensuring execution without duplication when running the DailyDelinquencyRerunCCSweep scan |  | PASS |

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa1

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

stg

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in stg

| Test Case | Test Data | Status |
| ------ | ------ | ------ |
| Check the credit card transactions received in the report via email, ensuring execution without duplication when running the DailyDelinquencyRerunCCSweep scan |  | PASS |
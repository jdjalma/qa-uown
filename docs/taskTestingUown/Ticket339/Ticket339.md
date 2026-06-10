------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/339

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Synopsis
Currently, accounts that meet the criteria for Paid Out status remain open, requiring manual intervention for closure. This feature request aims to automate the status change when specific conditions are met

Business Objective
Implement an automated process to update account status to Paid Out when all payments are complete, and no further due dates exist. This will reduce manual effort and improve efficiency in account management.

Feature Request | Business Requirements
Automatically update accounts to Paid Out status if they meet the following criteria:
* All regular payments have been paid, no more scheduled regular payments
* Contract paid in full without fees
* Remaining balance is the amount of one regular payment or less

davi marra @davimarrauownleasing

Steps to Reproduce
1. Create a new account with scheduled regular payments.
2. Make a single payment large enough to cover all regular payments.
3. Ensure that only a fee (e.g., NSF fee) remains unpaid.
4. Wait or trigger the process that runs the auto-paid out validation.
5. Confirm that the account was automatically updated to "Paid Out".
6. Check the logs or activity history to ensure the update was performed correctly.

Success Criteria:
* All regular payments must be fully paid.
* Only fees (not principal payments) may remain pending.
* Remaining balance must be equal to or less than one regular payment.
* The account status should be updated to "Paid Out" automatically.

-----

Atualmente, contas que atendem aos critérios para o status "Pago" permanecem abertas, exigindo intervenção manual para fechamento. 
Esta solicitação de recurso visa automatizar a mudança de status quando condições específicas forem atendidas.

Objetivo de Negócio
Implementar um processo automatizado para atualizar o status da conta para "Pago" quando todos os pagamentos estiverem concluídos 
e não houver mais datas de vencimento. 
Isso reduzirá o esforço manual e melhorará a eficiência na gestão de contas.

Solicitação de Recurso | Requisitos de Negócio
Atualizar automaticamente as contas para o status "Pago" se atenderem aos seguintes critérios:
* Todos os pagamentos regulares foram pagos, sem mais pagamentos regulares agendados.
* Contrato pago integralmente sem taxas.
* Saldo remanescente é o valor de um pagamento regular ou menos.

davi marra @davimarrauownleasing
Passos para Reproduzir?
1. Criar uma nova conta com pagamentos regulares agendados.
2. Realizar um único pagamento grande o suficiente para cobrir todos os pagamentos regulares.
3. Garantir que apenas uma taxa (ex.: taxa NSF) permaneça não paga.
4. Aguardar ou acionar o processo que executa a validação automática de "Pago".
5. Confirmar que a conta foi atualizada automaticamente para "Pago".
6. Verificar os logs ou histórico de atividades para garantir que a atualização foi realizada corretamente.

Critérios de Sucesso:
* Todos os pagamentos regulares devem estar totalmente pagos.
* Apenas taxas (não pagamentos principais) podem permanecer pendentes.
* O saldo remanescente deve ser igual ou inferior a um pagamento regular.
  se for maior que um pagamento regular?
  se for menor?
* O status da conta deve ser atualizado automaticamente para "Pago".

------------------------------------------------------------------------------------------------------------------------------------------------------------------

🧪 Cenário 1: Pagamentos regulares não totalmente pagos

Cenário: Conta com pagamentos regulares ainda pendentes
  Dado que uma conta foi criada com pagamentos regulares agendados
  E que apenas 2 pagamentos foram realizados
  Quando o processo automático de validação de "Pago" for executado
  Então o status da conta não deve ser alterado para "Pago"

-----  

🧪 Cenário 2: Pagamentos futuros agendados ainda presentes

Cenário: Conta com pagamentos regulares futuros ainda agendados
  Dado que uma conta foi criada com pagamentos regulares mensais
  E que um pagamento grande foi feito, mas ainda existem parcelas agendadas para o futuro
  Quando o processo automático de validação de "Pago" for executado
  Então o status da conta não deve ser alterado para "Pago"

-----

🧪 Cenário 3: Conta com taxa pendente

Cenário: Conta com taxa pendente mesmo após pagamento total
  Dado que todos os pagamentos regulares foram pagos
  E que existe uma taxa pendente
  Quando o processo automático de validação de "Pago" for executado
  Então o status da conta deve ser alterado para "Pago"

-----

🧪 Cenário 4: Saldo remanescente maior que um pagamento regular

Cenário: Conta com saldo remanescente superior ao valor de um pagamento regular
  Dado que todos os pagamentos regulares foram pagos
  E que o saldo restante na conta é maior que um pagamento regular
  Quando o processo automático de validação de "Pago" for executado
  Então o status da conta não deve ser alterado para "Pago"

-----

🧪 Cenário 5: Erro no processo automático

Cenário: Falha no processo automático de validação de status
  Dado que a conta atende a todos os critérios para mudança de status para "Pago"
  E que ocorre uma falha no processo de execução automática
  Quando o processo automático de validação de "Pago" for executado
  Então o status da conta não deve ser alterado para "Pago"

-----

🧪 Cenário 8: Conta com acordo de pagamento em aberto

Cenário: Conta com acordo de pagamento em aberto
  Dado que todos os pagamentos regulares foram pagos
  E que existe um acordo de pagamento em aberto associado à conta
  Quando o processo automático de validação de "Pago" for executado
  Então o status da conta não deve ser alterado para "Pago"

-----

https://svc-website-qa1.uownleasing.com/customer-information/3750

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verificar se o status da conta não é alterado para "Paid" when regular payments are still pending and only part was paid
Verify the account status doesn't change to "Paid" when regular payments are still pending and only part was paid

Verificar se o status da conta não é alterado para "Pago" quando existem parcelas de pagamentos futuros agendadas, mesmo após um pagamento grande
Verify the account status doesn't change to "Paid" when future payment installments are scheduled, even after a large payment

Verificar se o status da conta é alterado para "Pago" quando todos os pagamentos regulares são pagos, mas existe uma taxa pendente
Verify the account status changes to "Paid" when all regular payments are paid, but a fee is pending

Verificar se o status da conta não é alterado para "Pago" quando o saldo remanescente é maior que o valor de um pagamento regular, mesmo após todos os pagamentos regulares serem quitados
Verify the account status doesn't change to "Paid" when the remaining balance is greater than a regular payment amount, even after all regular payments are settled

Verificar se o status da conta não é alterado para "Pago" quando o processo automático de validação falha, mesmo que a conta atenda aos critérios para mudança de status
Verify the account status doesn't change to "Paid" when the automatic validation process fails, even if the account meets the status change criteria

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa1

| AccountPk | Merchant | Test Case | Status |
| ------ | ------ | ------ | ------ |
| 3756 | Progress Mobility | Verify the account status doesn't change to "Paid" when regular payments are still pending and only part was paid | PASS |
| 3756 | Progress Mobility | Verify the account status doesn't change to "Paid" when future payment installments are scheduled, even after a large payment | PASS |
| 3741 | Progress Mobility | Verify the account status changes to "Paid" when all regular payments are paid, but a fee is pending | PASS |
| 3757 | Progress Mobility | Verify the account status doesn't change to "Paid" when the remaining balance is greater than a regular payment amount, even after all regular payments are settled | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa1

------------------------------------------------------------------------------------------------------------------------------------------------------------------


todos os pagamentos estiverem concluidos -> status altera para pago
todos os pagamentos estiverem concluidos -> status nao altera para pago(pagamento parcial)
Se tiver pagamento agendado -> nao muda status para pago
Se nao tiver pagamento agendado -> muda status para pago
Se o contrato foi quitado sem taxas -> muda o status para pago
Se o contrato foi quitado com taxas -> nao muda o status para pago
Se o saldo remanescente foi maior que uma parcela -> nao muda o status para pago
Se o saldo remanescente foi menor ou igual que uma parcela -> muda o status para pago


todos os pagamentos concluidos
sem pagamentos agendados
quitado sem taxas
saldo restante após o pagamento é menor que o valor de uma parcela

status muda para paid_out

-----

todos os pagamentos concluidos
com pagamentos agendados
quitado sem taxas
o saldo remanescente foi menor ou igual que uma parcela

status nao muda para paid_out

-----

todos os pagamentos concluidos
sem pagamentos agendados
quitado com taxas
o saldo remanescente foi menor ou igual que uma parcela

status nao muda para paid_out

-----

todos os pagamentos não estao concluidos, há pagamentos pagos parcialmente
sem pagamentos agendados
quitado sem taxas
saldo restante após o pagamento é menor que o valor de uma parcela

status nao muda para paid_out

-----

Cenário 1: Todos os pagamentos concluídos, sem pagamentos agendados, quitado sem taxas pendentes de pagamento, saldo menor que uma parcela e o saldo restante após o pagamento é maior que o valor da taxa pendente de pagamento(se houver)
  Dado que todos os pagamentos foram concluídos
  E não existem pagamentos agendados não quitados
  E o contrato foi quitado sem taxas pendentes de pagamento
  E o saldo restante após o pagamento é menor que o valor de uma parcela
  E o saldo restante após o pagamento é maior que o valor da taxa pendente de pagamento(se houver)
  Quando a ultima parcela for paga, o processo automático de validação de "Pago" é executado
  Então o status da conta deve ser alterado para "Pago"

tem pagamento agendado nao quitado
saldo restante após o pagamento da ultima parcela É menor que o valor da parcela
nao há taxas pendente de pagamento com valor maior que o restante que sobrou ao pagar
-----


Cenário 3: Todos os pagamentos concluídos, sem pagamentos agendados, quitado com taxas pendentes de pagamento, saldo menor ou igual a uma parcela e o saldo restante após o pagamento é maior que o valor da taxa pendente de pagamento(se houver)
  Dado que todos os pagamentos foram concluídos
  E não existem pagamentos agendados não quitados
  E o contrato foi quitado com taxas pendentes de pagamento
  E o saldo restante após o pagamento é menor que o valor de uma parcela
  E o saldo restante após o pagamento é menor que o valor da taxa pendente de pagamento
  Quando o processo automático de validação de "Pago" for executado
  Então o status da conta não deve ser alterado para "Pago"

-----

Cenário 4: Pagamentos não concluídos, sem pagamentos agendados, quitado sem taxas pendentes de pagamento, saldo menor que uma parcela
  Dado que nem todos os pagamentos foram concluídos (há pagamentos pagos parcialmente)
  E não existem pagamentos agendados não quitados
  E o contrato foi quitado sem taxas pendentes de pagamento
  E o saldo restante após o pagamento é menor que o valor de uma parcela
  Quando o processo automático de validação de "Pago" for executado
  Então o status da conta não deve ser alterado para "Pago"





Conta com todas as parcelas pagas exceto a ultima
conta tem um valor de EPO pago menor que o EPO balance
Valor do EPO é realocado para quitar a ultima parcela
Status da conta deve alterar para paid_out

Conta com todas as parcelas pagas exceto a ultima
conta tem um valor de EPO pago menor que o EPO balance
Ultima parcela é paga e valor do EPO pago fica na conta
Status da conta deve alterar para paid_out


Verifique se, ao realocar o valor do EPO pago (menor que o EPO balance) para quitar a última parcela, o status da conta é alterado para "paid_out".
Verify that, when reallocating the paid EPO amount (less than the EPO balance) to settle the last installment, the account status is changed to "paid_out".

Verifique se, ao pagar a última parcela com o valor do EPO pago (menor que o EPO balance) permanecendo na conta, o status da conta é alterado para "paid_out".
Verify that, when paying the last installment with the paid EPO amount (less than the EPO balance) remaining in the account, the account status is changed to "paid_out".


1. Cliente paga ultima parcela + taxas com um cartão novo via portal Website, de conta com taxa criada e valor de EPO pago. Saldo restante é menor que o valor de um pagamento regular, status da conta deve ser alterado para paid_out. Saldo restante é maior que o valor de um pagamento regular, status da conta não deve ser alterado para paid_out.
Given conta tem a ultima parcela paga parcialmente
And todas as outras parcelas estao pagas
And conta tem uma taxa criada
And conta tem um valor de EPO pago
And conta exibe status Partially Paid para EPO
And conta está dentro do período elegível para EPO
When cliente paga ultima parcela + taxas com um cartão novo(que nao tem em servicing) via portal Website
Então todas as parcelas estão pagas
E se o saldo restante é menor que o valor de um pagamento regular
O status da conta deve ser alterado para "paid_out"
E se o saldo restante é maior que o valor de um pagamento
O status da conta nao deve ser alterado para "paid_out"

2. Agente quita Ultima parcela + taxas com um cartão que não está cadastrado pela opção payment no portal Servicing, de conta com taxa criada e valor de EPO pago. Saldo restante é menor que o valor de um pagamento regular, status da conta deve ser alterado para paid_out. Saldo restante é maior que o valor de um pagamento regular, status da conta não deve ser alterado para paid_out.
Given conta tem a ultima parcela paga pendente de pagamento
And todas as outras parcelas estao pagas
And conta tem uma taxa criada
And conta tem um valor de EPO pago
And conta exibe status Partially Paid para EPO
And conta está dentro do período elegível para EPO
When a ultima parcela + taxas é paga com um cartão que não está cadastrado pela opção payment
Then todas as parcelas estão pagas
And se o saldo restante é menor que o valor de um pagamento regular
O status da conta deve ser alterado para "paid_out"
And se o saldo restante é maior que o valor de um pagamento regular
O status da conta nao deve ser alterado para "paid_out"

3. 
Given conta tem a ultima parcela paga pendente de pagamento
And todas as outras parcelas estao pagas
And conta tem um valor de EPO pago
And conta exibe status Partially Paid para EPO
And conta está fora do período elegível para EPO
When a ultima parcela é paga com um cartão cadastrado pela opção payment/epo
Then todas as parcelas estão pagas
And se o saldo restante é menor que o valor de um pagamento regular
O status da conta deve ser alterado para "paid_out"
And se o saldo restante é maior que o valor de um pagamento regular
O status da conta nao deve ser alterado para "paid_out"

Given conta tem a ultima parcela paga pendente de pagamento
And todas as outras parcelas estao pagas
And conta tem uma taxa criada
And conta está fora do período elegível para EPO
And existe acordos de pagamento criados com um cartão nao cadastrado e com datas superiores a data de vencimento da ultima parcela
When a ultima parcela é paga pela opção payment/epo
Then todas as parcelas estão pagas
And se o saldo restante é menor que o valor de um pagamento regular
O status da conta deve ser alterado para "paid_out"
And se o saldo restante é maior que o valor de um pagamento regular
O status da conta nao deve ser alterado para "paid_out"

Given conta tem a ultima parcela paga pendente de pagamento
And todas as outras parcelas estao pagas
And conta tem uma taxa criada
And conta tem um valor de EPO pago
And conta exibe status Partially Paid para EPO
And conta está fora do período elegível para EPO
When o valor de EPO é realocado para quitar a ultima parcela
Then todas as parcelas estão pagas exceto a taxa
And O status da conta não deve ser alterado para "paid_out"
When o valor de EPO é realocado para quitar as taxas pendentes de pagamento
Then todas as parcelas estão pagas
And se o saldo restante é menor que o valor de um pagamento regular
O status da conta deve ser alterado para "paid_out"
And se o saldo restante é maior que o valor de um pagamento regular
O status da conta nao deve ser alterado para "paid_out"



pagamento via servicing

pagamento via website
Cliente paga ultima parcela -> paid_out

realocar pagamento
fora do periodo elegivel para epo
acordo de pagamento com um novo cartão

payment
payment/epo
EPO

pagamento com cartao novo





--> Todos os pagamentos regulares foram efetuados, sem mais pagamentos regulares agendados.
--> Contrato pago integralmente, sem taxas.
O saldo restante é o valor de um pagamento regular ou menos.

valor total do contrato diferente do valor total de parcelas pagas
base amount = parcela
total amount = parcela + taxas
total do contrato com taxa



------------------------------------------------------------------------------------------------------------------------------------------------------------------

Cenário 1
Melhoria:
Cliente paga a última parcela e taxas usando um cartão novo via Website. Se o saldo restante for menor que o valor de um pagamento regular, o status deve ser alterado para "paid_out". Se for maior, não deve ser alterado.
Frase:
Verifique se, ao pagar a última parcela e taxas com um cartão novo via Website, o status da conta é alterado para "paid_out" quando o saldo restante é menor que o valor de um pagamento regular, e não é alterado quando o saldo é maior.


Cenário 2
Melhoria:
Agente quita a última parcela e taxas usando um cartão não cadastrado via Servicing. Se o saldo restante for menor que o valor de um pagamento regular, o status deve ser alterado para "paid_out". Se for maior, não deve ser alterado.
Frase:
Verifique se, ao quitar a última parcela e taxas com um cartão não cadastrado via Servicing, o status da conta é alterado para "paid_out" quando o saldo restante é menor que o valor de um pagamento regular, e não é alterado quando o saldo é maior.


Cenário 3
Melhoria:
Conta está fora do período elegível para EPO. Última parcela é paga com cartão cadastrado. Se o saldo restante for menor que o valor de um pagamento regular, o status deve ser alterado para "paid_out". Se for maior, não deve ser alterado.
Frase:
Verifique se, ao pagar a última parcela com um cartão cadastrado estando fora do período elegível para EPO, o status da conta é alterado para "paid_out" quando o saldo restante é menor que o valor de um pagamento regular, e não é alterado quando o saldo é maior.


Cenário 4
Melhoria:
Conta está fora do período elegível para EPO, com taxa criada e acordo de pagamento com cartão não cadastrado e datas superiores ao vencimento da última parcela. Última parcela é paga pela opção payment/epo. Se o saldo restante for menor que o valor de um pagamento regular, o status deve ser alterado para "paid_out". Se for maior, não deve ser alterado.
Frase:
Verifique se, ao pagar a última parcela pela opção payment/epo em uma conta fora do período elegível para EPO, com taxa criada e acordo de pagamento com cartão não cadastrado, o status da conta é alterado para "paid_out" quando o saldo restante é menor que o valor de um pagamento regular, e não é alterado quando o saldo é maior.


Cenário 5
Melhoria:
Conta está fora do período elegível para EPO. Valor de EPO é realocado para quitar a última parcela: todas as parcelas ficam pagas exceto a taxa, e o status não deve ser alterado para "paid_out". Se o valor de EPO é realocado para quitar as taxas, e o saldo restante for menor que o valor de um pagamento regular, o status deve ser alterado para "paid_out". Se for maior, não deve ser alterado.
Frases:
Verifique se, ao realocar o valor de EPO para quitar a última parcela em uma conta fora do período elegível para EPO, o status da conta não é alterado para "paid_out" quando ainda resta uma taxa pendente.
Verifique se, ao realocar o valor de EPO para quitar as taxas pendentes em uma conta fora do período elegível para EPO, o status da conta é alterado para "paid_out" quando o saldo restante é menor que o valor de um pagamento regular, e não é alterado quando o saldo é maior.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Cenário: Pagamento da última parcela e taxas via Website com cartão novo
  Dado que a conta possui todas as parcelas pagas, exceto a última
  E existe uma taxa criada na conta
  E há um valor de EPO pago
  E o cliente está dentro do período elegível para EPO
  Quando o cliente paga a última parcela e as taxas com um cartão novo via Website
  Então, se o saldo restante for menor que o valor de um pagamento regular
    O status da conta deve ser alterado para "paid_out"
  E se o saldo restante for maior que o valor de um pagamento regular
    O status da conta não deve ser alterado para "paid_out"
12569 10542




Cenário: Quitação da última parcela e taxas via Servicing com cartão não cadastrado
  Dado que a conta possui todas as parcelas pagas, exceto a última
  E existe uma taxa criada na conta
  E há um valor de EPO pago
  E o cliente está dentro do período elegível para EPO
  Quando o agente quita a última parcela e as taxas com um cartão não cadastrado
  Então, se o saldo restante for menor que o valor de um pagamento regular
    O status da conta deve ser alterado para "paid_out"
  E se o saldo restante for maior que o valor de um pagamento regular
    O status da conta não deve ser alterado para "paid_out"
12571 10543




Cenário: Pagamento da última parcela fora do período elegível para EPO
  Dado que a conta possui todas as parcelas pagas, exceto a última
  E há um valor de EPO pago
  E o cliente está fora do período elegível para EPO
  Quando o cliente paga a última parcela com um cartão cadastrado
  Então, se o saldo restante for menor que o valor de um pagamento regular
    O status da conta deve ser alterado para "paid_out"
  E se o saldo restante for maior que o valor de um pagamento regular
    O status da conta não deve ser alterado para "paid_out"





Cenário: Pagamento da última parcela com acordo de pagamento e taxa criada, fora do período elegível para EPO
  Dado que a conta possui todas as parcelas pagas, exceto a última
  E existe uma taxa criada na conta
  E existe um acordo de pagamento criado com cartão não cadastrado e data superior ao vencimento da última parcela
  E o cliente está fora do período elegível para EPO
  Quando o cliente paga a última parcela pela opção payment/epo
  Então, se o saldo restante for menor que o valor de um pagamento regular
    O status da conta deve ser alterado para "paid_out"
  E se o saldo restante for maior que o valor de um pagamento regular
    O status da conta não deve ser alterado para "paid_out"





Cenário: Realocação do valor de EPO para quitar última parcela ou taxas fora do período elegível para EPO
  Dado que a conta possui todas as parcelas pagas, exceto a última
  E existe uma taxa criada na conta
  E há um valor de EPO pago
  E o cliente está fora do período elegível para EPO
  Quando o valor de EPO é realocado para quitar a última parcela
  Então o status da conta não deve ser alterado para "paid_out" se ainda houver taxa pendente
  Quando o valor de EPO é realocado para quitar as taxas pendentes
  Então, se o saldo restante for menor que o valor de um pagamento regular
    O status da conta deve ser alterado para "paid_out"
  E se o saldo restante for maior que o valor de um pagamento regular
    O status da conta não deve ser alterado para "paid_out"




todos os pagamentos regulares estao quitados
o dia atual de pagamento deve maior ou igual a data de vencimento da ultima parcela





valor total do contrato diferente do valor total de parcelas pagas
base amount = parcela
total amount = parcela + taxas
total do contrato com taxa




------------------------------------------------------------------------------------------------------------------------------------------------------------------


Feature: Contrato Paid_Out
  Como usuário do sistema financeiro
  Quero que o status do contrato seja atualizado automaticamente para Paid_Out
  Para que eu tenha segurança na gestão dos contratos

  Scenario Outline: Contrato deve ser Paid_Out quando o total pago atinge o valor do contrato
    Given um contrato com valor total de "<valorContrato>"
      And o cliente realizou pagamentos regulares totalizando "<pagamentosRegulares>"
      And o cliente realizou pagamentos EPO totalizando "<pagamentosEpo>"
      And o cliente realizou pagamentos de taxas totalizando "<pagamentosTaxas>"
    When o sistema verifica o status de pagamento
    Then o status do contrato deve ser "<statusEsperado>"

    Examples:
      |AccountPk | valorContrato       | pagamentosRegulares | pagamentosEpo | pagamentosTaxas | statusEsperado | Observation |
      | 10551    | $3,194.57            | 114.35               | 0              | 0                | Paid_Out        |        |
      | 10552    | $3,201.92            | 50                   | 64.35          | 0                | Paid_Out        |  ERRO  |
      | 10553    | $3,201.92            | 0                    | 114.35         | 0                | Paid_Out        |        |
      | 10554    | $3,201.92            | 75                   | 75             | 0                | Paid_Out        |  ERRO  |
      | 10555    | $3,201.92            | -                    | -              | 0                | Paid_Out        |        |
      |          | 500                  | 480                  | 0              | 20               | Paid_Out        |        |
      |          | 500                  | 400                  | 95             | 0                | Paid_Out        |        |
      |          | 500                  | 400                  | 90             | 0                | Não Paid_Out    |        |
      |          | 500                  | 500                  | 0              | 10               | Paid_Out        |        |



  Scenario Outline: Pequenas diferenças são consideradas para Paid_Out
    Given um contrato com valor total "<valor_contrato>"
      And o cliente realizou pagamentos totais somando "<valor_pago>"
    When a diferença entre o valor pago e o contrato for "<diferenca>"
    Then o contrato será considerado "<status_esperado>"

    Examples:
      | valor_contrato | valor_pago | diferenca | status_esperado |
      | 500            | 495        | 5         | Paid_Out        |
      | 500            | 494        | 6         | Não Paid_Out    |
      | 1000           | 996        | 4         | Paid_Out        |
      | 1000           | 990        | 10        | Não Paid_Out    |


Scenario: Pagamento parcial entre parcelas e EPO fechando valor total
  Given um contrato com valor total de "500"
    And o cliente pagou 4 parcelas regulares totalizando "400"
    And pagou parcialmente mais uma parcela no valor de "50"
    And fez um pagamento EPO adicional no valor de "50"
  When o sistema verifica o status de pagamento
  Then o status do contrato deve ser "Paid_Out"

Scenario: Pagamento misto, parcela regular e restante EPO
  Given um contrato com valor total de "500"
    And o cliente realiza um único pagamento no valor de "600"
    And "500" são alocados nas parcelas regulares
    And "100" são alocados no EPO
  When o sistema verifica o status de pagamento
  Then o status do contrato deve ser "Paid_Out"



Tests in qa2

Feature: Paid_Out Contract
  As a financial system user
  I want the contract status to be automatically updated to Paid_Out
  So that I have confidence in contract management

  Scenario Outline: Contract should be Paid_Out when the total paid reaches the contract value
    Given a contract with a total value of "<contractValue>"
      And the customer made regular payments totaling "<regularPayments>"
      And the customer made EPO payments totaling "<epoPayments>"
      And the customer made fee payments totaling "<feePayments>"
    When the system checks the payment status
    Then the contract status should be "<expectedStatus>"

    Examples:
      |AccountPk | contractValue      | regularPayments | epoPayments | feePayments | expectedStatus | Test Data | Status |
      | ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
      | 10551    | $3,194.57          | 114.35          | 0           | 0           | Paid_Out       |           | PASS   |
      | 10552    | $3,201.92          | 50              | 64.35       | 0           | Paid_Out       |           | ERROR  |
      | 10553    | $3,201.92          | 0               | 114.35      | 0           | Paid_Out       |           | PASS   |
      | 10554    | $3,201.92          | 75              | 75          | 0           | Paid_Out       |           | ERROR  |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Erro retornou ao dev

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verificar se, ao efetuar o pagamento de uma conta dentro do período elegível para 90-day pay off, o status passa a ser PAID_OUT_EARLY_EPO.
Verify that when a payment is made within the eligible 90-day pay-off period, the account status becomes PAID_OUT_EARLY_EPO.

Verificar se, ao efetuar o pagamento de uma conta fora do prazo de elegibilidade para 90-day pay off, o status passa a ser PAID_OUT_EARLY.
Verify that when a payment is made outside the 90-day pay-off eligibility window, the account status becomes PAID_OUT_EARLY.

Verificar se, ao efetuar o pagamento na data de vencimento ou após ela, para uma conta não elegível ao 90-day pay off, quando o saldo remanescente após o pagamento for menor ou igual ao valor de uma parcela regular ou à soma das cobranças de fees, o status passa a ser PAID_OUT.
Verify that when a payment is made on or after the due date for an account not eligible for the 90-day pay off, and the remaining balance after payment is less than or equal to the amount of a regular installment or the total fees charged, the status becomes PAID_OUT.

Verificar se, ao efetuar o pagamento na data de vencimento ou após ela, para uma conta não elegível ao 90-day pay off, quando o saldo remanescente após o pagamento for maior que o valor de uma parcela regular mais as taxas (se houver), o status da conta não deve ser PAID_OUT.
Verify that when making payment on or after the due date for an account not eligible for 90-day pay off, when the remaining balance after payment is greater than the amount of a regular installment plus fees (if any), the account status should not be PAID_OUT.

-----

Tests in qa2

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 10621 | Progress Mobility | Verify that when a payment is made within the eligible 90-day pay-off period, the account status becomes PAID_OUT_EARLY_EPO. |  | PASS |
| 10622 | Progress Mobility | Verify that when a payment is made outside the 90-day pay-off eligibility window, the account status becomes PAID_OUT_EARLY. |  | PASS |
| 10623 | Progress Mobility | Verify that when a payment is made on or after the due date for an account not eligible for the 90-day pay off, and the remaining balance after payment is less than or equal to the amount of a regular installment or the total fees charged, the status becomes PAID_OUT. |  | PASS |
| 10626 and 10627 | Progress Mobility | Verify that when making payment on or after the due date for an account not eligible for 90-day pay off, when the remaining balance after payment is greater than the amount of a regular installment plus fees (if any), the account status should not be PAID_OUT. |  | ERROR |

-----

Tests in qa2

| LeadPk | Merchant | Test Case | Test Data | Status | Observation |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 10621 | Progress Mobility | Verify that when a payment is made within the eligible 90-day pay-off period, the account status becomes PAID_OUT_EARLY_EPO. | ![qa2-339-c1-290525_1_](/uploads/3e0023748a8d43495a9be1cac601bade/qa2-339-c1-290525_1_.png){width=1434 height=740}![qa2-339-c1-290525_2_](/uploads/6e93837b6c9b0b9ba0458313b203c67d/qa2-339-c1-290525_2_.png){width=1434 height=740}![qa2-339-c1-290525_3_](/uploads/d88cf81d7d52ed99dde693cfd502f349/qa2-339-c1-290525_3_.png){width=1434 height=740} | PASS | -- |
| 10622 | Progress Mobility | Verify that when a payment is made outside the 90-day pay-off eligibility window, the account status becomes PAID_OUT_EARLY. | ![qa2-339-c2-290525_1_](/uploads/8c7c6d6ef73ccf39eb50e5de6727eca0/qa2-339-c2-290525_1_.png){width=1434 height=740}![qa2-339-c2-290525_2_](/uploads/fb0de13e4fae3ac450803750ef523687/qa2-339-c2-290525_2_.png){width=1434 height=740} | PASS | -- |
| 10623 | Progress Mobility | Verify that when a payment is made on or after the due date for an account not eligible for the 90-day pay off, and the remaining balance after payment is less than or equal to the amount of a regular installment or the total fees charged, the status becomes PAID_OUT. | ![qa2-339-c3-290525_1_](/uploads/c59a25c133dd5df80b90cb5b85d1c33a/qa2-339-c3-290525_1_.png){width=1434 height=740}![qa2-339-c3-290525_2_](/uploads/5028d914b6778165d17f4e64de3c1758/qa2-339-c3-290525_2_.png){width=1434 height=740}![qa2-339-c3-290525_3_](/uploads/c1877c827108f8eb1cadaa3189ad8b7f/qa2-339-c3-290525_3_.png){width=1434 height=740}![qa2-339-c3-290525_4_](/uploads/3497674fe2b95bf49b90ade953318a3b/qa2-339-c3-290525_4_.png){width=1434 height=740} | PASS | -- |
| 10626 and 10627 | Progress Mobility | Verify that when making payment on or after the due date for an account not eligible for 90-day pay off, when the remaining balance after payment is greater than the amount of a regular installment plus fees (if any), the account status should not be PAID_OUT. | ![qa2-339-c4-290525_1_](/uploads/53978d06efe60e9728fdc8a2d20a436c/qa2-339-c4-290525_1_.png){width=1434 height=740}![qa2-339-c4-290525_2_](/uploads/64e6c385690ec1e1d1a550cae38ce3e1/qa2-339-c4-290525_2_.png){width=1434 height=740}![qa2-339-c4-290525_3_](/uploads/26c8e25ded6308950e1ff606480ba52c/qa2-339-c4-290525_3_.png){width=1434 height=740}![qa2-339-c4-290525_4_](/uploads/8fce54c0a06276a7e2b47d177d7c07ba/qa2-339-c4-290525_4_.png){width=1434 height=740}![qa2-339-c4-290525_5_](/uploads/b99add9dc07529a9d99000ca673dd791/qa2-339-c4-290525_5_.png){width=1434 height=740}![qa2-339-c4-290525_6_](/uploads/14d72e3b1422fb8066b5ab2a9067784f/qa2-339-c4-290525_6_.png){width=1434 height=740}![qa2-339-c4-290525_7_](/uploads/048da10fff117ed4e769179cc2e9895c/qa2-339-c4-290525_7_.png){width=1434 height=740}![qa2-339-c4-290525_8_](/uploads/e5fd8bee8adda770d6c837268e6b35a0/qa2-339-c4-290525_8_.png){width=1434 height=740}![qa2-339-c4-290525_9_](/uploads/c110b9ebb5903da20755f46574318975/qa2-339-c4-290525_9_.png){width=1434 height=740} | PASS | -- |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa2

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in stg

| LeadPk | Merchant | Test Case | Test Data | Status | Observation |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 206331| Progress Mobility | Verify that when a payment is made within the eligible 90-day pay-off period, the account status becomes PAID_OUT_EARLY_EPO. |  | PASS | -- |
| 206332 | Progress Mobility | Verify that when a payment is made outside the 90-day pay-off eligibility window, the account status becomes PAID_OUT_EARLY. |  | PASS | -- |
| 206334 | Progress Mobility | Verify that when a payment is made on or after the due date for an account not eligible for the 90-day pay off, and the remaining balance after payment is less than or equal to the amount of a regular installment or the total fees charged, the status becomes PAID_OUT. |  | PASS | -- |
| 206335 | Progress Mobility | Verify that when making payment on or after the due date for an account not eligible for 90-day pay off, when the remaining balance after payment is greater than the amount of a regular installment plus fees (if any), the account status should not be PAID_OUT. |  | PASS | -- |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in stg

------------------------------------------------------------------------------------------------------------------------------------------------------------------
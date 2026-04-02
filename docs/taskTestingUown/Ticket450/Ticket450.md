----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/servicing/-/issues/450

------------------------------------------------------------------------------------------------------------------------------------------------------------------

OWN | Manutenção | Corrigir a causa raiz de não ser possível processar o pagamento para o acordo de pagamento com uma vez CC na manutenção

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Feature: Processamento de pagamento para acordo de pagamento (Payment Arrangement)

    Background:
    Given o usuário está logado no sistema
    And acessa a tela de pagamento de um acordo de pagamento existente

    Scenario Outline: C1 - Processar pagamento com <tipoPagamento> em <parcelas> parcela(s)
        Given o usuário seleciona "<tipoPagamento>" como método de pagamento
        And escolhe pagar em "<parcelas>" parcela(s)
        When confirma o pagamento
        Then o pagamento deve ser processado com sucesso
        And o sistema deve registrar o pagamento corretamente
        And check que o status do pagamento é "Aprovado"
        And check que o recibo do pagamento está disponível
        When o usuário busca a transação correspondente ao pagamento realizado em CC transactions
        Then a transação deve conter o acordo de pagamento corretamente
        And deve exibir o "<tipoPagamento>" como método de pagamento
        And deve exibir "<parcelas>" parcela(s) no detalhamento
        Wheno usuário busca a entrada correspondente ao pagamento realizado no log
        Then o log deve conter o registro do acordo de pagamento
        And deve exibir "<tipoPagamento>" como método de pagamento
        And deve exibir "<parcelas>" parcela(s) como quantidade de pagamentos
        And o status do pagamento deve ser "Aprovado"

        Examples:
        | tipoPagamento | parcelas |
        | CC           | 1        |
        | CC           | 2        |
        | CC           | 10        |
        | ACH          | 1        |

    Scenario: C2 - Processar pagamento com cartão inválido e ser rejeitado
        Given o usuário seleciona "CC" como método de pagamento  
        And insere um cartão de crédito inválido  
        And escolhe pagar em "1" parcela  
        When confirma o pagamento  
        Then o pagamento deve ser rejeitado  
        And o sistema deve exibir uma mensagem de erro informando o motivo da rejeição 


------------------------------------------------------------------------------------------------------------------------------------------------------------------
Tests in qa1

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| X | X | Verify that a payment is successfully processed using CC as the payment method with 1 installment. | | PASS |
| X | X | Verify that a payment is successfully processed using CC as the payment method with 2 installments. | | PASS |
| X | X | Verify that a payment is successfully processed using CC as the payment method with 10 installments. | | PASS |
| X | X | Verify that a payment is successfully processed using ACH as the payment method with 1 installment. | | PASS |
| X | X | Verify that a payment attempt using an invalid credit card is rejected and the system displays an error message. | | PASS |
| X | X | Verify that a payment arrangement for a new lease is successfully processed using a credit card in a single installment. | | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verifique se um acordo de pagamento pagamento é processado com sucesso usando CC como método de pagamento com 1 parcela.
Verify that a payment agreement is successfully processed using CC as the payment method with 1 installment.

Verifique se um acordo de pagamento é processado com sucesso usando CC como método de pagamento com 2 parcelas.
Verify that a payment agreement is successfully processed using CC as the payment method with 2 installments.

Verifique se um acordo de pagamento é processado com sucesso usando CC como método de pagamento com 10 parcelas.
Verify that a payment agreement is successfully processed using CC as the payment method with 10 installments.

Verifique se um acordo de pagamento é processado com sucesso usando ACH como método de pagamento com 1 parcela.
Verify that a payment agreement is successfully processed using ACH as the payment method with 1 installment.

Verifique se uma tentativa de acordo de pagamento usando um cartão de crédito inválido é rejeitada e se o sistema exibe uma mensagem de erro.
Verify that a payment agreement attempt using an invalid credit card is rejected and the system displays an error message.

Verifique se um acordo de pagamento para um novo contrato de locação foi processado com sucesso usando um cartão de crédito em uma única parcela.
Verify that a payment agreement arrangement for a new lease is successfully processed using a credit card in a single installment.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa1

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in staging

| AccountPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 205918 | Tire Agent | Verify that a payment agreement is successfully processed using CC as the payment method with 1 installment | | PASS |
| 205918 | Tire Agent | Verify that a payment agreement is successfully processed using CC as the payment method with 2 installments | | PASS |
| 205918 | Tire Agent | Verify that a payment agreement is successfully processed using CC as the payment method with 10 installments | | PASS |
| 205918 | Tire Agent | Verify that a payment agreement is successfully processed using ACH as the payment method with 1 installment | | PASS |
| 205918 | Tire Agent | Verify that a payment agreement attempt using an invalid credit card is rejected and the system displays an error message | | PASS |
| 205918 | Tire Agent | Verify that a payment agreement arrangement for a new lease is successfully processed using a credit card in a single installment | | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in staging

------------------------------------------------------------------------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Servicing | Investigate "SYSTEM" Being Logged as Agent in SPA Transactions
Aberto
  Tíquete criado em 1 hora por Yuri Araujo
Synopsis
In Servicing, when a SPA (Single Payment) is performed by an Agent, the system logs the transaction in the CC Transactions screen, where the Agent column typically displays the name of the user who executed the action. However, it has been observed that in some cases in Production, this field is being populated with the value "SYSTEM", indicating that the system did not recognize the responsible Agent.

Business Objective
Investigate and identify the root cause of the failure to recognize the Agent in the Production environment, ensuring accurate traceability of actions performed in the system and integrity of transactional logs.

Feature Request | Business Requirements
Analyze the SPA logging process in the CC Transactions screen to understand how the Agent field is populated.

Verify which conditions may cause the system to assign "SYSTEM" instead of the Agent’s name.

Compare behavior across Sandbox, QA1, and Staging environments (where the Agent is correctly recognized) and Production (where the issue occurs).

Validate whether differences in authentication, permissions, or execution flow exist between environments.

Identify any specific scenario or error condition that could lead to the failure in Agent identification.

Propose fixes or improvements if a root cause is found.

Ensure that future transaction logs in Production correctly reflect the Agent’s name for SPA actions.

-----

UOWN | Servicing | Investigar "SYSTEM" Sendo Registrado como Agente em Transações SPA
Status: Aberto
Ticket criado em: 1 hora por Yuri Araujo
Sinopse
No Servicing, quando um SPA (Pagamento Único) é executado por um Agente, o sistema registra a transação na tela CC Transactions, onde a coluna Agent normalmente exibe o nome do usuário que executou a ação. No entanto, foi observado que em alguns casos em Produção, esse campo está sendo preenchido com o valor "SYSTEM", indicando que o sistema não reconheceu o Agente responsável.
Objetivo de Negócio
Investigar e identificar a causa raiz da falha no reconhecimento do Agente no ambiente de Produção, garantindo rastreabilidade precisa das ações executadas no sistema e integridade dos logs transacionais.
Solicitação de Funcionalidade | Requisitos de Negócio
Análise e Investigação:

Analisar o processo de logging de SPA na tela CC Transactions para entender como o campo Agent é preenchido
Verificar quais condições podem fazer com que o sistema atribua "SYSTEM" em vez do nome do Agente

Comparação entre Ambientes:

Comparar comportamento entre os ambientes Sandbox, QA1 e Staging (onde o Agente é reconhecido corretamente) e Produção (onde o problema ocorre)
Validar se existem diferenças na autenticação, permissões ou fluxo de execução entre os ambientes

Identificação de Cenários:

Identificar qualquer cenário específico ou condição de erro que possa levar à falha na identificação do Agente

Resolução e Melhorias:

Propor correções ou melhorias se uma causa raiz for encontrada
Garantir que futuros logs de transação em Produção reflitam corretamente o nome do Agente para ações de pagamento unico

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Feature: Logging do Agente em Transações SPA no Servicing
  Como um Agente do Servicing
  Eu quero que o sistema registre corretamente minha identidade ao realizar transações SPA
  Para que os logs de transação mantenham rastreabilidade precisa e integridade de auditoria

  Background:
    Given o Agente está logado no sistema Servicing
    And o Agente tem permissões válidas para realizar transações de cartão de crédito
    And a conta do cliente está acessível

  @smoke @regression @database
  Scenario: Pagamento Imediato com Cartão de Crédito - Identidade do Agente Registrada Corretamente
    Given o Agente "John.Smith" está autenticado no sistema
    And o cliente possui saldo em aberto
    When o Agente realiza um pagamento imediato com cartão de crédito de $100.00
    And a transação é processada com sucesso
    Then a transação deve ser registrada na tela CC Transactions
    And a coluna Agent deve exibir "John.Smith"
    And na tabela do banco de dados "uown_sv_credit_card_transaction"
      | Campo    | Valor Esperado |
      | username | John.Smith     |
      | userID   | John.Smith     |
    And o campo username NÃO deve conter "SYSTEM"
    And o campo userID NÃO deve conter "SYSTEM"

  @smoke @regression @database @future_payment
  Scenario: Pagamento com Cartão de Crédito com Data Futura - Identidade do Agente Registrada Corretamente
    Given o Agente "Jane.Doe" está autenticado no sistema
    And o cliente possui saldo em aberto
    When o Agente agenda um pagamento com cartão de crédito de $250.00 com data futura "2024-12-31"
    And o pagamento futuro é agendado com sucesso
    Then a transação agendada deve ser registrada na tela CC Transactions
    And a coluna Agent deve exibir "Jane.Doe"
    And na tabela do banco de dados "uown_sv_credit_card_transaction"
      | Campo    | Valor Esperado |
      | username | Jane.Doe       |
      | userID   | Jane.Doe       |
    And o campo username NÃO deve conter "SYSTEM"
    And o campo userID NÃO deve conter "SYSTEM"
    And o campo payment_date deve refletir "2024-12-31"

  @smoke @regression @database @payment_arrangement
  Scenario: Acordo de Pagamento com Cartão de Crédito - Identidade do Agente Registrada Corretamente
    Given o Agente "Mike.Johnson" está autenticado no sistema
    And o cliente solicita um acordo de pagamento
    When o Agente cria um acordo de pagamento com cartão de crédito com:
      | Valor Total       | $500.00    |
      | Parcelas          | 3          |
      | Primeiro Pagamento| 2024-01-15 |
    And o acordo de pagamento é criado com sucesso
    Then cada parcela deve ser registrada na tela CC Transactions
    And a coluna Agent para cada transação deve exibir "Mike.Johnson"
    And na tabela do banco de dados "uown_sv_credit_card_transaction" para cada parcela
      | Campo    | Valor Esperado |
      | username | Mike.Johnson   |
      | userID   | Mike.Johnson   |
    And o campo username NÃO deve conter "SYSTEM" para nenhuma parcela
    And o campo userID NÃO deve conter "SYSTEM" para nenhuma parcela

     @smoke @regression @database @customer_portal
  Scenario: Pagamento Imediato com Cartão de Crédito pelo Portal - Identidade do Cliente Registrada Corretamente
    Given o Cliente "customer123@email.com" está autenticado no Portal do Cliente
    And o cliente possui saldo em aberto
    When o Cliente realiza um pagamento imediato com cartão de crédito de $100.00
    And a transação é processada com sucesso
    Then a transação deve ser registrada na tela CC Transactions no Servicing
    And a coluna Agent deve exibir "customer123@email.com" ou "CUSTOMER_PORTAL"
    And na tabela do banco de dados "uown_sv_credit_card_transaction"
      | Campo    | Valor Esperado                    |
      | username | customer123@email.com             |
      | userID   | customer123@email.com ou CUSTOMER |
    And no log do Servicing a transação deve exibir:
      | Campo       | Valor Esperado        |
      | User        | customer123@email.com |
      | Source      | Customer Portal       |
      | Action Type | Customer Payment      |
    And o campo username NÃO deve conter "SYSTEM"
    And o campo userID NÃO deve conter "SYSTEM"


Validar que ao realizar um pagamento imediato com cartão de crédito, o sistema registra corretamente o nome do agente nas colunas username e userID do banco de dados, sem exibir 'SYSTEM'
Validate that when performing an immediate credit card payment, the system correctly records the agent's name in the username and userID database columns, without displaying 'SYSTEM'.

Verificar que ao agendar um pagamento com cartão de crédito para data futura, a identidade do agente é preservada corretamente nos logs de transação e no banco de dados
Verify that when scheduling a credit card payment for a future date, the agent's identity is correctly preserved in transaction logs and database.

Confirmar que ao criar um acordo de pagamento parcelado com cartão de crédito, todas as parcelas mantêm a identificação correta do agente responsável pela criação do acordo
Confirm that when creating an installment payment arrangement with credit card, all installments maintain the correct identification of the agent responsible for creating the arrangement.


-----

Tests in stg

| AccountPk | Merchant | Test Case | Test Data | Status | Observation |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 206355 | Progress Mobility | Validate that when performing an immediate credit card payment, the system correctly records the agent's name in the username and userID database columns, without displaying 'SYSTEM'. |  | PASS | -- |
| 206358 | Progress Mobility | Verify that when scheduling a credit card payment for a future date, the agent's identity is correctly preserved in transaction logs and database. |  | PASS | -- |
| 206358 | Progress Mobility | Confirm that when creating an installment payment arrangement with credit card, all installments maintain the correct identification of the agent responsible for creating the arrangement. |  | ERROR | @davi.artur.gow In the payment agreement, the user displayed is system.  |

-----

When realizar acordo de pagamento
Then o usuário responsável pela criação de todas as parcelas deve ser o usuário logado
And no banco de dados, na tabela uown_sv_credit_card_transaction, a coluna agent_username deve armazenar o nome do usuário logado
And não deve armazenar um valor diferente do nome do usuario logado em agent_username em nenhum registro de parcela
-----
When making a payment agreement
Then the user responsible for creating all installments must be the logged-in user
And in the database, in the uown_sv_credit_card_transaction table, the agent_username column must store the name of the logged-in user
And no value other than the logged-in user's name should be stored in agent_username in any installment record

-----

tarefa retornou porque o cenario 3 esta incorreto
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/368

UOWN | SVC | Fix refMerchantCodes filtering in GetFundingTransactions endpoint
Open
  Ticket created 2 weeks ago by Yuri Araujo
BUG
Currently, the GetFundingTransactions endpoint does not return the correct records when filtering by refMerchantCodes. Even when valid refMerchantCodes are provided, the response either returns unexpected data or an empty list.

FIX
Investigate the filtering logic for refMerchantCodes in the GetFundingTransactions endpoint. Fix the behavior so that when one or more refMerchantCodes are sent in the request, the endpoint correctly applies the filter and returns only the matching records. Ensure the filter accurately matches the provided refMerchantCodes and works properly with multiple values.


-----

UOWN | SVC | Corrigir filtragem de refMerchantCodes no endpoint GetFundingTransactions
Aberto
  Tíquete criado 2 semanas atrás por Yuri Araujo
BUG
Atualmente, o endpoint GetFundingTransactions não retorna os registros corretos ao filtrar por refMerchantCodes. 
Mesmo quando refMerchantCodes válidos são fornecidos, a resposta retorna dados inesperados ou uma lista vazia.

CORREÇÃO
Investigar a lógica de filtragem de refMerchantCodes no endpoint GetFundingTransactions. Corrigir o comportamento para que, quando um ou mais refMerchantCodes forem enviados na requisição, o endpoint aplique corretamente o filtro e retorne apenas os registros correspondentes. Garantir que o filtro corresponda com precisão aos refMerchantCodes fornecidos e funcione corretamente com múltiplos valores.

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------



lease cancelado
  9105
  cliquei em modify lease e apaguei um produto
  status mudou para signed mas lease nao saiu dos resultados
  9110
  modify lease e apagou iten
  status mudou para signed mas lease nao saiu dos resultados
**VERIFICAR ESSE COMPORTAMENTO**

merchant desativado
  ok
  nao exibe resultados de merchant desativado
varios merchants com leases criados filtrando por menos merchants, exemplo tem lease criado para 3 merchants diferentes e voce por resultados para 2 merchants
  ok, exibe resultados somente dos refMerchantCodes inseridos


https://svc-{{env}}.uownleasing.com/uown/getFundingTransactionsForDateRange


Tests in qa1

| LeadPk | Merchant                           | Caso de Teste                                                                                                     | Dados de Teste                                                                                | Status |
|--------|------------------------------------|------------------------------------------------------------------------------------------------------------------ |-----------------------------------------------------------------------------------------------|--------|
| —      | payTomorrow, KS3015, KS5936        | Requisição válida com múltiplos merchants                                                                         | fromDate=2025-05-01, toDate=2025-07-30, refMerchantCodes com múltiplos códigos                |  PASS  |
| —      | payTomorrow                        | fromDate > toDate                                                                                                 | fromDate=2025-08-01, toDate=2025-07-30                                                        |  PASS  |
| —      | payTomorrow                        | Apenas fromDate informado                                                                                         | fromDate=2025-05-01, toDate=null                                                              |  PASS  |
| —      | payTomorrow                        | Apenas toDate informado                                                                                           | fromDate=null, toDate=2025-07-30                                                              |  PASS  |
| —      | payTomorrow                        | refMerchantCodes vazio                                                                                            | fromDate=2025-05-01, toDate=2025-07-30, refMerchantCodes=[]                                   |  PASS  |
| —      | payTomorrow                        | Data inválida                                                                                                     | fromDate=2024-13-01, toDate=2024-14-31                                                        |  PASS  |
| —      | payTomorrow                        | Nenhum resultado                                                                                                  | fromDate=2030-01-01, toDate=2030-01-02 (mock retorna data=[])                                 |  PASS  |
| —      | payTomorrow                        | Sem header Authorization                                                                                          | fromDate=2025-05-01, toDate=2025-07-30, sem header Authorization                              |  PASS  |
| —      | FORBIDDEN_MERCHANT                 | Merchant proibido (FORBIDDEN_MERCHANT)                                                                            | fromDate=2025-05-01, toDate=2025-07-30, refMerchantCodes=[FORBIDDEN_MERCHANT]                 |  PASS  |
| —      | payTomorrow                        | Erro interno simulado (datas específicas)                                                                         | fromDate=2020-01-01, toDate=2025-12-31 (mock retorna status 500)                              |  PASS  |
| —      | --                                 | Verificar se não é exibido resultados para merchant desativado ao buscar pela API onde o merchant está desativado | --                                                                                            |  PASS  |
| —      | --                                 | Verificar se é exibido resultados somente dos merchants inseridos, mesmo havendo leases de outros merchants       | --                                                                                            |  PASS  |

-----

Tests in qa1

| LeadPk | Merchant                    | Test Case                                                                                                             | Test Data                                                                             | Status |
|--------|-----------------------------|-----------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------|--------|
| —      | payTomorrow, KS3015, KS5936 | Valid request with multiple merchants                                                                                 | fromDate=2025-05-01, toDate=2025-07-30, refMerchantCodes with multiple codes          |  PASS  |
| —      | payTomorrow                 | fromDate > toDate                                                                                                    | fromDate=2025-08-01, toDate=2025-07-30                                                |  PASS  |
| —      | payTomorrow                 | Only fromDate informed                                                                                               | fromDate=2025-05-01, toDate=null                                                      |  PASS  |
| —      | payTomorrow                 | Only toDate informed                                                                                                 | fromDate=null, toDate=2025-07-30                                                      |  PASS  |
| —      | payTomorrow                 | refMerchantCodes empty                                                                                               | fromDate=2025-05-01, toDate=2025-07-30, refMerchantCodes=[]                           |  PASS  |
| —      | payTomorrow                 | Invalid date                                                                                                         | fromDate=2024-13-01, toDate=2024-14-31                                                |  PASS  |
| —      | payTomorrow                 | No results                                                                                                           | fromDate=2030-01-01, toDate=2030-01-02 (mock returns data=[])                         |  PASS  |
| —      | payTomorrow                 | No Authorization header                                                                                              | fromDate=2025-05-01, toDate=2025-07-30, no Authorization header                       |  PASS  |
| —      | FORBIDDEN_MERCHANT          | Forbidden merchant (FORBIDDEN_MERCHANT)                                                                              | fromDate=2025-05-01, toDate=2025-07-30, refMerchantCodes=[FORBIDDEN_MERCHANT]         |  PASS  |
| —      | payTomorrow                 | Simulated internal error (specific dates)                                                                            | fromDate=2020-01-01, toDate=2025-12-31 (mock returns status 500)                      |  PASS  |
| —      | --                          | Check that results for deactivated merchants are not displayed when searching with a deactivated merchant via the API | --                                                                                    |  PASS  |
| —      | --                          | Check that only merchants provided are shown in the results, even if there are leases for other merchants            | --                                                                                    |  PASS  |



---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Requisição válida com múltiplos merchants
Garante que a API retorna apenas transações dos merchants informados em refMerchantCodes, com status "FUNDED" ou "REFUND", e inclui transações de mais de um merchant.

Erro: fromDate maior que toDate
Valida que a API retorna HTTP 400 e a mensagem de erro apropriada quando fromDate é maior que toDate.

Erro: Apenas fromDate informado
Verifica que ao enviar a requisição somente com fromDate (sem toDate), a API retorna HTTP 400 e uma mensagem indicando que ambas as datas são obrigatórias.

Erro: Apenas toDate informado
Verifica que ao enviar a requisição somente com toDate (sem fromDate), a API retorna HTTP 400 e uma mensagem indicando que ambas as datas são obrigatórias.

Requisição com refMerchantCodes vazio
Garante que quando refMerchantCodes é enviado como lista vazia, a API retorna HTTP 200 e status "OK", podendo retornar um conjunto de dados vazio.

Erro: Formato de data inválido
Assegura que a API retorna HTTP 400 e uma mensagem de "Bad Request" quando o formato da data é inválido (exemplo: mês 13).

Nenhum resultado encontrado
Verifica que a API retorna HTTP 200 e um array de dados vazio quando não há transações para os filtros informados.

-----

> ## Tests in stg
> ```gherkin
>
> ### Scenario: Valid request with multiple merchants
> Ensures the API returns only transactions for the merchants provided in refMerchantCodes, with status "FUNDED" or "REFUND", and includes transactions from more than one merchant.
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
> 
> ```gherkin
> ### Scenario: Error: fromDate is greater than toDate
> Validates that the API returns HTTP 400 and the appropriate error message when fromDate is after toDate.
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
> 
> ```gherkin
> ### Scenario: Error: Only fromDate informed
> Checks that submitting the request with only fromDate (missing toDate) returns HTTP 400 and a message indicating both dates are required.
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
> 
> ```gherkin
> ### Scenario: Error: Only toDate informed
> Checks that submitting the request with only toDate (missing fromDate) returns HTTP 400 and a message indicating both dates are required.
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
> 
> ```gherkin
> ### Scenario: Request with refMerchantCodes empty
> Verifies that when refMerchantCodes is provided as an empty list, the API returns HTTP 200 and status "OK", potentially with an empty data set.
> 
> ### Scenario: Error: Invalid date format
> Ensures the API returns HTTP 400 and a message indicating a bad request when the date format is invalid (e.g., month 13).
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
> 
> ```gherkin
> ### Scenario: No results found
> Checks that the API returns HTTP 200 and an empty data array when no transactions are found for the given filters.
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>

-----


> ## Tests in stg
> ```gherkin
>
> ### Scenario: Valid request with multiple merchants
> Ensures the API returns only transactions for the merchants provided in refMerchantCodes, with status "FUNDED" or "REFUND", and includes transactions from more than one merchant.
> | PASS |
> ```
>
![369-stg-MultipleMerchants-_1_](/uploads/54089a7d5a08df17a936b4ce86df66b8/369-stg-MultipleMerchants-_1_.png){width=636 height=675}![369-stg-MultipleMerchants-_2_](/uploads/2497e74bb407b4922aecbb07541feb07/369-stg-MultipleMerchants-_2_.png){width=636 height=675}![369-stg-MultipleMerchants-_3_](/uploads/d8b3dc977a384bd2c36c4260d45e1d15/369-stg-MultipleMerchants-_3_.png){width=264 height=78}![369-stg-MultipleMerchants-_4_](/uploads/b443a2b76ece2147f487ee3f89f3dc35/369-stg-MultipleMerchants-_4_.png){width=576 height=650}
>
> ```gherkin
> ### Scenario: Error: fromDate is greater than toDate
> Validates that the API returns HTTP 400 and the appropriate error message when fromDate is after toDate.
> | PASS |
> ```
>
![368-stg-FromdateMaiorTodate-_1_](/uploads/6be9fc30bfb47c4d27ab071f3bacaebd/368-stg-FromdateMaiorTodate-_1_.png){width=437 height=385}
>
> ```gherkin
> ### Scenario: Error: Only fromDate informed
> Checks that submitting the request with only fromDate (missing toDate) returns HTTP 400 and a message indicating both dates are required.
> | PASS |
> ```
> 
> ```gherkin
> ### Scenario: Error: Only toDate informed
> Checks that submitting the request with only toDate (missing fromDate) returns HTTP 400 and a message indicating both dates are required.
> | PASS |
> ```
> 
> ```gherkin
> ### Scenario: Request with refMerchantCodes empty
> Verifies that when refMerchantCodes is provided as an empty list, the API returns HTTP 200 and status "OK", potentially with an empty data set.
> 
> ### Scenario: Error: Invalid date format
> Ensures the API returns HTTP 400 and a message indicating a bad request when the date format is invalid (e.g., month 13).
> | PASS |
> ```
> 
> ```gherkin
> ### Scenario: No results found
> Checks that the API returns HTTP 200 and an empty data array when no transactions are found for the given filters.
> | PASS |
> ```

> ```gherkin
> Then Run the funding transactions API for merchant "<merchant>" with:
> | fromDate   | toDate     |
> | <fromDate> | <toDate>   |
> Then the response status should be 200
> And the response should have status field as "OK"
> Then the response should only contain transactions for the configured merchants
> Then each transaction should have status in "FUNDED,REFUND"
> Then the response should contain transactions for more than 1 merchant
> ```

> ```gherkin
> Then Run the funding transactions API for merchant "<merchant>" with:
> |  fromDate  |  toDate  |
> | <fromDate> | <toDate> |
> Then the response status should be 400
> Then the response should contain status message "fromDate cannot be greater than toDate"
> ```

> ```gherkin
> Then Run the funding transactions API for merchant "<merchant>" with:
> | toDate     |
> | <toDate> |
> Then the response status should be 400
> Then the response should contain status message "Both fromDate and toDate must be provided"
> ```

> ```gherkin
> Then Run the funding transactions API for merchant "<merchant>" with:
> | fromDate   |
> | <fromDate> |
> Then the response status should be 400
> Then the response should contain status message "Both fromDate and toDate must be provided"
> ```

> ```gherkin
> Then Run the funding transactions API for merchant "<merchant>" with:
> | fromDate   | toDate     | refMerchantCodes |
> | <fromDate> | <toDate>   | []               |
> Then the response status should be 200
> And the response should have status field as "OK"
> ```

> ```gherkin
> Then Run the funding transactions API for merchant "<merchant>" with:
> | fromDate     | toDate     |
> | 2024-13-01   | 2024-14-31 |
> Then the response status should be 400
> And the response should contain status message "Bad Request"
> ```

> ```gherkin
> Given the Funding Transactions Mock Server is running
> Then Run the funding transactions API for merchant "<merchant>" with:
> | fromDate   | toDate     |
> | <fromDate> | <toDate> |
> Then the response status should be 200
> And the response should contain no transactions
> And the Funding Transactions Mock Server is stopped
> ```

> ```gherkin
> Given the Funding Transactions Mock Server is running
> And I remove the authorization header
> Then Run the funding transactions API for merchant "<merchant>" with:
> | fromDate   | toDate     |
> | <fromDate> | <toDate> |
> Then the response status should be 401
> And the response should contain status message "Unauthorized"
> And the Funding Transactions Mock Server is stopped
> ```

> ```gherkin
> Given the Funding Transactions Mock Server is running
> And I use a forbidden merchant "FORBIDDEN_MERCHANT"
> Then Run the funding transactions API for merchant "<merchant>" with:
> | fromDate   | toDate     |
> | <fromDate> | <toDate> |
> Then the response status should be 403
> ```

> ```gherkin
> Given the Funding Transactions Mock Server is running
> Then Run the funding transactions API for merchant "<merchant>" with:
> | fromDate    | toDate      |
> | 2020-01-01  | 2025-12-31  |
> Then the response status should be 500
> Then the response should contain status message "Error retrieving funding transactions"
> And the Funding Transactions Mock Server is stopped    
> ```
>

-----

> ```gherkin
> Then Run the funding transactions API for merchant "<merchant>" with:
> | fromDate   | toDate     |
> | <fromDate> | <toDate>   |
> Then the response status should be 200
> And the response should have status field as "OK"
> Then the response should only contain transactions for the configured merchants
> Then each transaction should have status in "FUNDED,REFUND"
> Then the response should contain transactions for more than 1 merchant
> ```
> 
> ```gherkin
> Then Run the funding transactions API for merchant "<merchant>" with:
> |  fromDate  |  toDate  |
> | <fromDate> | <toDate> |
> Then the response status should be 400
> Then the response should contain status message "fromDate cannot be greater than toDate"
> ```
> 
> ```gherkin
> Then Run the funding transactions API for merchant "<merchant>" with:
> | toDate     |
> | <toDate> |
> Then the response status should be 400
> Then the response should contain status message "Both fromDate and toDate must be provided"
> ```
> 
> ```gherkin
> Then Run the funding transactions API for merchant "<merchant>" with:
> | fromDate   |
> | <fromDate> |
> Then the response status should be 400
> Then the response should contain status message "Both fromDate and toDate must be provided"
> ```
> 
> ```gherkin
> Then Run the funding transactions API for merchant "<merchant>" with:
> | fromDate     | toDate     |
> | 2024-13-01   | 2024-14-31 |
> Then the response status should be 400
> And the response should contain status message "Bad Request"
> ```
> 
> ```gherkin
> Given the Funding Transactions Mock Server is running
> Then Run the funding transactions API for merchant "<merchant>" with:
> | fromDate   | toDate     |
> | <fromDate> | <toDate> |
> Then the response status should be 200
> And the response should contain no transactions
> And the Funding Transactions Mock Server is stopped
> ```
> 
> ```gherkin
> Given the Funding Transactions Mock Server is running
> And I remove the authorization header
> Then Run the funding transactions API for merchant "<merchant>" with:
> | fromDate   | toDate     |
> | <fromDate> | <toDate> |
> Then the response status should be 401
> And the response should contain status message "Unauthorized"
> And the Funding Transactions Mock Server is stopped
> ```
> 
> ```gherkin
> Given the Funding Transactions Mock Server is running
> And I use a forbidden merchant "FORBIDDEN_MERCHANT"
> Then Run the funding transactions API for merchant "<merchant>" with:
> | fromDate   | toDate     |
> | <fromDate> | <toDate> |
> Then the response status should be 403
> ```
> 
> ```gherkin
> Given the Funding Transactions Mock Server is running
> Then Run the funding transactions API for merchant "<merchant>" with:
> | fromDate    | toDate      |
> | 2020-01-01  | 2025-12-31  |
> Then the response status should be 500
> Then the response should contain status message "Error retrieving funding transactions"
> And the Funding Transactions Mock Server is stopped
> ```
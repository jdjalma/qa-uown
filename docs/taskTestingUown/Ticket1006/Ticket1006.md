--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1006

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Origination | Servicing | Display lead and account creation date results in the search panel

Synopsis
Enhance the search results in both Origination and Servicing by adding a creation timestamp field. This will help in tracking the creation time of leads and accounts.

Business Objective
Improve search accuracy and provide better visibility into the creation time of leads and accounts for more efficient data management.

Feature Request | Business Requirements
• Origination: Display the lead create timestamp in the search results table.
• Servicing: Display the account create timestamp in the search results table.


Dploy instructions:
Two query have been modified getLeadsByCriteria and getAccountsByCriteria, the following code snippets can be used to update the queries

curl --location 'https://svc-<ENVIRONMENT_NAME>.uownleasing.com/uown/createOrUpdateSqlConfig' \
--header 'Content-Type: application/json' \
--data '{
    "sqlName": "getLeadsByCriteria",
    "sqlQuery": "WITH results AS (\n    SELECT\n        lead.pk AS leadPk,\n        lead.account_pk AS accountPk,\n        lead.lead_status AS leadStatus,\n        lead.internal_status AS internalStatus,\n        address.state,\n        CONCAT(customer.first_name, '\'' '\'', customer.last_name) AS givenName,\n        customer.ssn,\n        CONCAT(phone.area_code, phone.phone_number) AS phoneNumber,\n        email.email_address AS email,\n        merchant.merchant_name AS merchantName,\n        merchant.location_name AS merchantLocation,\n        merchant.client_type as clientType,\n        merchant.ref_merchant_code as refMerchantCode,\n        lead.row_created_timestamp AS createdTimestampe\n    FROM\n        uown_los_lead lead\n    JOIN\n        uown_los_customer customer ON customer.lead_pk = lead.pk\n    JOIN\n        uown_los_email email ON email.lead_pk = lead.pk\n    JOIN\n        uown_los_phone phone ON phone.lead_pk = lead.pk\n    JOIN\n        uown_los_address address ON address.lead_pk = lead.pk\n    JOIN\n        uown_merchant merchant ON merchant.pk = lead.merchant_pk\n    WHERE\n        (:fromDate IS NULL OR DATE(lead.row_created_timestamp) >= :fromDate)\n        AND (:toDate IS NULL OR DATE(lead.row_created_timestamp) <= :toDate)\n        AND (:leadPk IS NULL OR lead.pk = :leadPk)\n        AND (:accountPk IS NULL OR lead.account_pk = :accountPk)\n        AND (:ssn IS NULL OR customer.ssn = :ssn)\n        AND (:phoneNumber IS NULL OR CONCAT(phone.area_code, phone.phone_number) = :phoneNumber)\n        AND (:email IS NULL OR LOWER(email.email_address) = LOWER(:email))\n        AND (:state IS NULL OR LOWER(address.state) = LOWER(:state))\n        AND (\n            :givenName IS NULL\n            OR LOWER(customer.first_name) = LOWER(:givenName)\n            OR LOWER(customer.last_name) = LOWER(:givenName)\n            OR LOWER(CONCAT(customer.first_name, '\'' '\'', customer.last_name)) = LOWER(:givenName)\n        )\n        AND (:leadStatus IS NULL OR LOWER(lead.lead_status) = LOWER(:leadStatus))\n        AND (:internalStatus IS NULL OR LOWER(lead.internal_status) = LOWER(:internalStatus))\n        AND (:merchantName IS NULL OR LOWER(merchant.merchant_name) LIKE LOWER(:merchantName))\n        AND (:locationName IS NULL OR LOWER(merchant.location_name) LIKE LOWER(:locationName))\n        AND (\n            COALESCE(:merchantRefCodes, '\''*'\'') = '\''*'\''\n            OR merchant.ref_merchant_code IN (:merchantRefCodes)\n        )\n        AND (:searchByRefCode IS NULL OR LOWER(merchant.ref_merchant_code) LIKE LOWER(:searchByRefCode))\n),\ntotal_results AS (\n    SELECT\n        COUNT(*) AS total_results\n    FROM\n        results\n)\nSELECT\n    total_results AS totalResults,\n    results.*\nFROM\n    results,\n    total_results\nORDER BY\n    results.leadPk DESC\nLIMIT\n    :maxResults\nOFFSET\n    :fromResults"
}'

curl --location 'https://svc-<ENVIRONMENT_NAME>.uownleasing.com/uown/createOrUpdateSqlConfig' \
--header 'Content-Type: application/json' \
--data '{
    "sqlName": "getAccountsByCriteria",
    "sqlQuery": "WITH searchResults AS (\n    SELECT DISTINCT\n        account.pk as accountPk,\n        account.row_created_timestamp as rowCreatedTime,\n        account.activation_date as accountActivationDate,\n        CASE WHEN account.lead_pk = 1 THEN account.ref_account_id ELSE null END as rtoAccountNumber,\n        account.account_status as accountStatus,\n        customer.first_name as firstName,\n        customer.last_name as lastName,\n        customer.ssn as ssn,\n         address.state as state,\n        email.email_address as email,\n        phone.area_code as areaCode,\n        phone.phone_number as phone,\n        contract.contract_number as contractNumber,\n        CASE WHEN account.lead_pk = 1 THEN null ELSE account.lead_pk END as leadPk,\n        cc.cc_number as last4CC,\n        summary.next_payment_with_tax as nextPaymentAmount,\n        ROW_NUMBER() OVER (\n            PARTITION BY\n                account.pk\n            ORDER BY\n                cc.cc_last_four_digit DESC NULLS LAST\n        ) AS row_num,\n        account.row_created_timestamp AS createdTimestampe\n    FROM uown_sv_account account\n    JOIN uown_sv_customer customer ON customer.account_pk = account.pk\n    LEFT JOIN uown_sv_email email ON email.account_pk = account.pk AND email.email_type = '\''PRIMARY'\''\n    JOIN uown_sv_address address ON address.account_pk = account.pk AND address.address_type = '\''HOME'\''\n    LEFT JOIN uown_sv_phone phone ON phone.account_pk = account.pk AND phone.phone_type = '\''MOBILE'\''\n    LEFT JOIN uown_sv_contract contract ON contract.account_pk = account.pk AND contract.contract_type = '\''LEASE'\''\n    LEFT JOIN uown_sv_credit_card cc ON cc.account_pk = account.pk\n    LEFT JOIN uown_sv_sched_summary summary ON summary.account_pk = account.pk\n    WHERE ( :fromDate IS NULL OR date (account.row_created_timestamp) >= :fromDate )\n    AND ( :toDate IS NULL OR date(account.row_created_timestamp) <= :toDate  )\n      AND (:ssn IS NULL OR customer.ssn = :ssn)\n      AND (:refAccountId IS NULL OR account.ref_account_id = :refAccountId)\n      AND (:email IS NULL OR LOWER(email.email_address) = LOWER(:email))\n      AND (:accountPk IS NULL OR account.pk = :accountPk)\n      AND (:phoneNumber IS NULL OR CONCAT(phone.area_code, phone.phone_number) = :phoneNumber)\n      AND (:givenName IS NULL OR LOWER(customer.first_name) = LOWER(:givenName)\n            OR LOWER(customer.last_name) = LOWER(:givenName)\n            OR LOWER(CONCAT(customer.first_name, '\'' '\'', customer.last_name)) = LOWER(:givenName))\n      AND (:last4CC IS NULL OR cc.cc_last_four_digit = :last4CC)\n),\ntotalCount AS (\n    SELECT COUNT(*) AS totalResults\n    FROM searchResults\n    WHERE row_num = 1\n)\nSELECT\n    sr.*,\n    tc.totalResults\nFROM searchResults sr,\n     totalCount tc\nWHERE row_num = 1\nORDER BY\n    sr.accountPk DESC\nLIMIT :maxResults\nOFFSET :fromResults"
}'


Test instructions:
For the origination and servicing portals, respectively, the leads and the search page should include a 'Created At' column. 
In the origination portal, 'Created At' should reflect the lead creation date, while in the servicing portal, it should reflect the account creation date.


--------------------


UOWN | Originação | Atendimento | Exibir resultados de data de criação de leads e contas no painel de busca

Sinopse
Aprimorar os resultados de busca tanto na Originação quanto no Atendimento, adicionando um campo de carimbo de data/hora de criação. 
Isso ajudará a rastrear o momento de criação de leads e contas.

Objetivo de Negócio
Melhorar a precisão da busca e fornecer maior visibilidade sobre o momento de criação de leads e contas para uma gestão de dados mais eficiente.

Solicitação de Recurso | Requisitos de Negócio
• Originação: Exibir o carimbo de data/hora de criação do lead na tabela de resultados de busca
• Atendimento: Exibir o carimbo de data/hora de criação da conta na tabela de resultados de busca.


Instruções de Implantação:
Duas consultas foram modificadas: getLeadsByCriteria e getAccountsByCriteria. 
Os seguintes trechos de código podem ser usados para atualizar as consultas:

curl --location 'https://svc-<ENVIRONMENT_NAME>.uownleasing.com/uown/createOrUpdateSqlConfig' \
--header 'Content-Type: application/json' \
--data '{
    "sqlName": "getLeadsByCriteria",
    "sqlQuery": "WITH results AS (\n    SELECT\n        lead.pk AS leadPk,\n        lead.account_pk AS accountPk,\n        lead.lead_status AS leadStatus,\n        lead.internal_status AS internalStatus,\n        address.state,\n        CONCAT(customer.first_name, '\'' '\'', customer.last_name) AS givenName,\n        customer.ssn,\n        CONCAT(phone.area_code, phone.phone_number) AS phoneNumber,\n        email.email_address AS email,\n        merchant.merchant_name AS merchantName,\n        merchant.location_name AS merchantLocation,\n        merchant.client_type as clientType,\n        merchant.ref_merchant_code as refMerchantCode,\n        lead.row_created_timestamp AS createdTimestampe\n    FROM\n        uown_los_lead lead\n    JOIN\n        uown_los_customer customer ON customer.lead_pk = lead.pk\n    JOIN\n        uown_los_email email ON email.lead_pk = lead.pk\n    JOIN\n        uown_los_phone phone ON phone.lead_pk = lead.pk\n    JOIN\n        uown_los_address address ON address.lead_pk = lead.pk\n    JOIN\n        uown_merchant merchant ON merchant.pk = lead.merchant_pk\n    WHERE\n        (:fromDate IS NULL OR DATE(lead.row_created_timestamp) >= :fromDate)\n        AND (:toDate IS NULL OR DATE(lead.row_created_timestamp) <= :toDate)\n        AND (:leadPk IS NULL OR lead.pk = :leadPk)\n        AND (:accountPk IS NULL OR lead.account_pk = :accountPk)\n        AND (:ssn IS NULL OR customer.ssn = :ssn)\n        AND (:phoneNumber IS NULL OR CONCAT(phone.area_code, phone.phone_number) = :phoneNumber)\n        AND (:email IS NULL OR LOWER(email.email_address) = LOWER(:email))\n        AND (:state IS NULL OR LOWER(address.state) = LOWER(:state))\n        AND (\n            :givenName IS NULL\n            OR LOWER(customer.first_name) = LOWER(:givenName)\n            OR LOWER(customer.last_name) = LOWER(:givenName)\n            OR LOWER(CONCAT(customer.first_name, '\'' '\'', customer.last_name)) = LOWER(:givenName)\n        )\n        AND (:leadStatus IS NULL OR LOWER(lead.lead_status) = LOWER(:leadStatus))\n        AND (:internalStatus IS NULL OR LOWER(lead.internal_status) = LOWER(:internalStatus))\n        AND (:merchantName IS NULL OR LOWER(merchant.merchant_name) LIKE LOWER(:merchantName))\n        AND (:locationName IS NULL OR LOWER(merchant.location_name) LIKE LOWER(:locationName))\n        AND (\n            COALESCE(:merchantRefCodes, '\''*'\'') = '\''*'\''\n            OR merchant.ref_merchant_code IN (:merchantRefCodes)\n        )\n        AND (:searchByRefCode IS NULL OR LOWER(merchant.ref_merchant_code) LIKE LOWER(:searchByRefCode))\n),\ntotal_results AS (\n    SELECT\n        COUNT(*) AS total_results\n    FROM\n        results\n)\nSELECT\n    total_results AS totalResults,\n    results.*\nFROM\n    results,\n    total_results\nORDER BY\n    results.leadPk DESC\nLIMIT\n    :maxResults\nOFFSET\n    :fromResults"
}'

curl --location 'https://svc-<ENVIRONMENT_NAME>.uownleasing.com/uown/createOrUpdateSqlConfig' \
--header 'Content-Type: application/json' \
--data '{
    "sqlName": "getAccountsByCriteria",
    "sqlQuery": "WITH searchResults AS (\n    SELECT DISTINCT\n        account.pk as accountPk,\n        account.row_created_timestamp as rowCreatedTime,\n        account.activation_date as accountActivationDate,\n        CASE WHEN account.lead_pk = 1 THEN account.ref_account_id ELSE null END as rtoAccountNumber,\n        account.account_status as accountStatus,\n        customer.first_name as firstName,\n        customer.last_name as lastName,\n        customer.ssn as ssn,\n         address.state as state,\n        email.email_address as email,\n        phone.area_code as areaCode,\n        phone.phone_number as phone,\n        contract.contract_number as contractNumber,\n        CASE WHEN account.lead_pk = 1 THEN null ELSE account.lead_pk END as leadPk,\n        cc.cc_number as last4CC,\n        summary.next_payment_with_tax as nextPaymentAmount,\n        ROW_NUMBER() OVER (\n            PARTITION BY\n                account.pk\n            ORDER BY\n                cc.cc_last_four_digit DESC NULLS LAST\n        ) AS row_num,\n        account.row_created_timestamp AS createdTimestampe\n    FROM uown_sv_account account\n    JOIN uown_sv_customer customer ON customer.account_pk = account.pk\n    LEFT JOIN uown_sv_email email ON email.account_pk = account.pk AND email.email_type = '\''PRIMARY'\''\n    JOIN uown_sv_address address ON address.account_pk = account.pk AND address.address_type = '\''HOME'\''\n    LEFT JOIN uown_sv_phone phone ON phone.account_pk = account.pk AND phone.phone_type = '\''MOBILE'\''\n    LEFT JOIN uown_sv_contract contract ON contract.account_pk = account.pk AND contract.contract_type = '\''LEASE'\''\n    LEFT JOIN uown_sv_credit_card cc ON cc.account_pk = account.pk\n    LEFT JOIN uown_sv_sched_summary summary ON summary.account_pk = account.pk\n    WHERE ( :fromDate IS NULL OR date (account.row_created_timestamp) >= :fromDate )\n    AND ( :toDate IS NULL OR date(account.row_created_timestamp) <= :toDate  )\n      AND (:ssn IS NULL OR customer.ssn = :ssn)\n      AND (:refAccountId IS NULL OR account.ref_account_id = :refAccountId)\n      AND (:email IS NULL OR LOWER(email.email_address) = LOWER(:email))\n      AND (:accountPk IS NULL OR account.pk = :accountPk)\n      AND (:phoneNumber IS NULL OR CONCAT(phone.area_code, phone.phone_number) = :phoneNumber)\n      AND (:givenName IS NULL OR LOWER(customer.first_name) = LOWER(:givenName)\n            OR LOWER(customer.last_name) = LOWER(:givenName)\n            OR LOWER(CONCAT(customer.first_name, '\'' '\'', customer.last_name)) = LOWER(:givenName))\n      AND (:last4CC IS NULL OR cc.cc_last_four_digit = :last4CC)\n),\ntotalCount AS (\n    SELECT COUNT(*) AS totalResults\n    FROM searchResults\n    WHERE row_num = 1\n)\nSELECT\n    sr.*,\n    tc.totalResults\nFROM searchResults sr,\n     totalCount tc\nWHERE row_num = 1\nORDER BY\n    sr.accountPk DESC\nLIMIT :maxResults\nOFFSET :fromResults"
}'


Instruções de Teste:

Para os portais de originação e atendimento, respectivamente, as páginas de leads e busca devem incluir uma coluna "Criado em".
No portal de originação, "Criado em" deve refletir a data de criação do lead, enquanto no portal de atendimento, deve refletir a data de criação da conta.
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Requisito da Tarefa:
Melhorar os portais de Originação e Atendimento para que o painel de busca exiba uma coluna "Criado em" que contenha o carimbo de data/hora de criação dos registros. 
No portal de Originação, o campo deve refletir a data de criação dos leads; já no portal de Atendimento, 
deve refletir a data de criação das contas. Essa melhoria visa aprimorar a precisão da busca e a gestão dos dados.

----------

Cenários para o Portal de Originação:
Scenario 1.1 - Exibir data de criação do lead na tabela de resultados de busca (Origination)
Descrição:
Verificar se a tabela de resultados na página de Originação exibe a coluna "Criado em" com a data de criação dos leads.

Passos:
Given que a página de Originação está aberta
When o usuário visualiza a tabela de resultados de busca
Then a coluna "Criado em" deve estar presente e exibir a data de criação do lead
And a data exibida deve corresponder ao valor retornado no banco de dados

Resultado Esperado:
A coluna "Criado em" é exibida com a data correta para cada lead.

--

Scenario 1.2 - Filtrar resultados de leads por intervalo de data de criação (Origination)
Descrição:
Validar que ao aplicar um filtro de data (Data Inicial e Data Final), apenas os leads com data de criação dentro desse intervalo são apresentados.

Passos:
Given que leads com datas de criação variadas estão cadastrados
When o usuário insere a Data Inicial "01/01/2025" e a Data Final "31/01/2025" nos filtros de data e clica no botão de busca
Then os resultados devem apresentar apenas leads com datas de criação entre "01/01/2025" e "31/01/2025"
And a validação dos resultados deve ser confirmada no banco de dados

Resultado Esperado:
A tabela apresenta somente os leads cujo carimbo de data de criação está dentro do intervalo definido.

--

Scenario 1.3 - Exibir mensagem "Nenhum registro encontrado" para filtro sem resultados (Origination)
Descrição:
Verificar que, quando não há leads que atendam aos critérios do filtro de data, o sistema exibe uma mensagem informando que nenhum registro foi encontrado.

Passos:
Given que não existem leads com data de criação entre "01/01/2025" e "31/01/2025"
When o usuário insere a Data Inicial "01/01/2025" e a Data Final "31/01/2025" nos filtros de data e clica no botão de busca
Then deve ser exibida uma mensagem informando "Nenhum registro encontrado"
And a validação dos resultados deve ser confirmada no banco de dados

Resultado Esperado:
O sistema exibe a mensagem "Nenhum registro encontrado" e a consulta no banco de dados não retorna registros.

----------

Cenários para o Portal de Atendimento (Servicing)
Scenario 2.1 - Exibir data de criação da conta na tabela de resultados de busca (Servicing)

Descrição:
Verificar se a tabela de resultados na página de Atendimento exibe a coluna "Criado em" com a data de criação das contas.

Passos:
Given que a página de Atendimento está aberta
When o usuário visualiza a tabela de resultados de busca
Then a coluna "Criado em" deve estar presente e exibir a data de criação da conta
And a data exibida deve corresponder ao valor retornado no banco de dados

Resultado Esperado:
A coluna "Criado em" é exibida com a data correta para cada conta.

--

Scenario 2.2 - Filtrar resultados de contas por intervalo de data de criação (Servicing)
Descrição:
Validar que, ao aplicar um filtro de data, apenas as contas com data de criação dentro do intervalo especificado são exibidas.

Passos:
Given que contas com datas de criação variadas estão cadastradas
When o usuário insere a Data Inicial "01/02/2025" e a Data Final "28/02/2025" nos filtros de data e clica no botão de busca
Then os resultados devem apresentar apenas contas com data de criação entre "01/02/2025" e "28/02/2025"
And a validação dos resultados deve ser confirmada no banco de dados

Resultado Esperado:
A tabela de resultados apresenta somente as contas cujo carimbo de data de criação está dentro do intervalo definido.

--

Scenario 2.3 - Exibir mensagem "Nenhum registro encontrado" para filtro sem resultados (Servicing)
Descrição:
Verificar que, se o filtro de data não encontrar contas que atendam aos critérios, uma mensagem "Nenhum registro encontrado" é exibida.

Passos:
Given que não existem contas com data de criação entre "01/02/2025" e "28/02/2025"
When o usuário insere a Data Inicial "01/02/2025" e a Data Final "28/02/2025" nos filtros de data e clica no botão de busca
Then deve ser exibida uma mensagem informando "Nenhum registro encontrado"
And a validação dos resultados deve ser confirmada no banco de dados

Resultado Esperado:
O sistema exibe a mensagem "Nenhum registro encontrado" e não retorna resultados na consulta.
Esses cenários foram criados para cobrir os seguintes requisitos:

----------

Exibição do carimbo de data/hora de criação:

Nos portais de Originação e Atendimento, deve ser exibida uma coluna "Criado em" que contenha a data de criação dos registros (leads e contas, respectivamente).
Filtragem por intervalo de data:

Os usuários devem conseguir filtrar os registros com base em um intervalo de datas, e os resultados apresentados devem corresponder exatamente aos registros que se encaixam nesse critério, conforme os dados no banco.
Mensagens de ausência de registros:

Se nenhum registro corresponder aos filtros aplicados, uma mensagem informativa ("Nenhum registro encontrado") deve ser exibida para orientar o usuário.
Cada cenário foi estruturado para testar individualmente esses aspectos, garantindo que a implementação atenda ao requisito de melhorar a visibilidade dos carimbos de data/hora de criação nos painéis de busca dos portais.

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Feature: Display "Criado em" Column in Search Panel for Origination and Servicing

  # Cenários para o Portal de Originação

  Scenario: 1 - Exibir data de criação do lead na tabela de resultados de busca (Origination)
    Given que a página de Originação está aberta em um navegador desktop
    When o usuário visualiza a tabela de resultados de busca
    Then a coluna "Criado em" deve estar presente e exibir a data de criação do lead
    And a data exibida deve corresponder ao valor retornado no banco de dados

  Scenario: 2 - Filtrar resultados de leads por intervalo de data de criação (Origination)
    Given que leads com datas de criação variadas estão cadastrados
    When o usuário insere a Data Inicial "01/01/2025" e a Data Final "31/01/2025" nos filtros de data e clica no botão de busca
    Then os resultados devem apresentar apenas leads com datas de criação entre "01/01/2025" e "31/01/2025"
    And a validação dos resultados deve ser confirmada no banco de dados

  # Cenários para o Portal de Atendimento (Servicing)

  Scenario: 3 - Exibir data de criação da conta na tabela de resultados de busca (Servicing)
    Given que a página de Atendimento está aberta em um navegador desktop
    When o usuário visualiza a tabela de resultados de busca
    Then a coluna "Criado em" deve estar presente e exibir a data de criação da conta
    And a data exibida deve corresponder ao valor retornado no banco de dados

  Scenario: 4 - Filtrar resultados de contas por intervalo de data de criação (Servicing)
    Given que contas com datas de criação variadas estão cadastradas
    When o usuário insere a Data Inicial "01/02/2025" e a Data Final "28/02/2025" nos filtros de data e clica no botão de busca
    Then os resultados devem apresentar apenas contas com datas de criação entre "01/02/2025" e "28/02/2025"
    And a validação dos resultados deve ser confirmada no banco de dados

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verificar se a tabela de resultados na página de Originação exibe a coluna "Criado em" com a data de criação dos leads
Verify that the results table on the Origination page displays the "Created At" column with the lead creation dates

Validar que ao aplicar um filtro de data (Data Inicial e Data Final), apenas os leads com data de criação dentro desse intervalo são apresentado
Validate that, when applying a date filter (Start Date and End Date), only leads with creation dates within that range are displayed

Verificar se a tabela de resultados na página de Atendimento exibe a coluna "Criado em" com a data de criação das contas
Verify that the results table on the Servicing page displays the "Created At" column with the account creation dates

Validar que, ao aplicar um filtro de data, apenas as contas com data de criação dentro do intervalo especificado são exibidas
Validate that, when applying a date filter, only accounts with creation dates within the specified range are shown

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa2

| LeadPk/AccountPk | Merchant | Test Case | Test Data | Status | Observation |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 12250 | Progress Mobility | Verify that the results table on the Origination page displays the "Created At" column with the lead creation dates |  | PASS | -- |
| -- | -- | Validate that, when applying a date filter (Start Date and End Date), only leads with creation dates within that range are displayed |  | PASS | -- |
| 10388 | Progress Mobility | Verify that the results table on the Servicing page displays the "Created At" column with the account creation dates |  | PASS | -- |
| -- | -- | Validate that, when applying a date filter, only accounts with creation dates within the specified range are show |  | PASS | -- |

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa2

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in stg

| Test Case | Test Data | Status |
| ------ | ------ | ------ |
| Verify that the results table on the Origination page displays the "Created At" column with the lead creation dates |  | PASS |
| Validate that, when applying a date filter (Start Date and End Date), only leads with creation dates within that range are displayed |  | PASS |
| Verify that the results table on the Servicing page displays the "Created At" column with the account creation dates |  | PASS |
| Validate that, when applying a date filter, only accounts with creation dates within the specified range are show |  | PASS |

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in stg

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
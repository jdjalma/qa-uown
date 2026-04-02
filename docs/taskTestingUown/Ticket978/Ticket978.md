------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Origination | Add Sales Rep Code Filter and Display to Funding Queue

Synopsis
Enable filtering and display of the “Sales Rep Code” in the Funding Queue tab to enhance search and reporting functionality. This will replace the existing “Sales Person” filter and ensure “Sales Rep Code” is included in both the table display and exports.

Business Objective
A brief summary of the result the company aims to achieve

Feature Request | Business Requirements
Replace the current “Sales Person” filter in the Funding Queue tab with “Sales Rep Code.”
Add a column for “Sales Rep Code” in the Funding Queue table display.
Ensure “Sales Rep Code” is included in the CSV exports for Funding Queue.

davi marra - @davimarrauownleasing
Steps to reproduce for the New "Sales Rep Code" Feature

1️⃣ Access the Origination Portal
Open the Origination portal in your browser.

2️⃣ Navigate to the "Funding" Section
On the right-side menu, click on "Funding".

3️⃣ Verify the New Filter
In the filter fields, you should see the new filter labeled "Sales Rep Code".

4️⃣ Perform a Search
Enter search criteria that return data.

5️⃣ Check the Results Table
In the displayed results table, the new column "Sales Rep Code" should be visible.

6️⃣ Export and Validate the CSV File
Click on the "Download CSV" button at the top.
Open the exported spreadsheet and verify that the new column "Sales Rep Code" is included.

✅ Expected Outcome:
The "Sales Rep Code" filter should be available.
The "Sales Rep Code" column should appear in the search results.
The exported CSV file should include the "Sales Rep Code" column.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Feature: Sales Rep Code Management

  Background:
    Given o usuário está logado no sistema

  Scenario: C1 - Validar nome do campo em configurações do merchant
    When o usuário acessa a página de edição do merchant
    Then o nome do campo "UOwn Sales Rep Code" deve estar correto

  Scenario: C2 - Inserir valor em Sales Rep Code e validar na busca
    Given o usuário acessa a página de edição do merchant
    When insere um código no campo "UOwn Sales Rep Code"
    And salva as alterações
    And cria um lease
    And acessa a Funding Queue
    And realiza uma busca pelo código inserido
    Then o Sales Rep Code deve ser exibido corretamente na listagem

  Scenario: C3 - Validar nome da coluna Sales Rep Code na Funding Queue
    Given o usuário acessa a Funding Queue
    Then a coluna "Sales Rep Code" deve estar visível na tabela

  Scenario: C4 - Validar nome do campo de busca
    Given o usuário acessa a Funding Queue
    Then o nome do campo de busca "Sales Rep Code" deve estar correto

  Scenario: C5 - Criar lease e validar Sales Rep Code
    Given o usuário cria um novo lease associando um Sales Rep Code
    When altera o código no merchant
    Then o código no lease não deve ser alterado

  Scenario: C6 - Verificar armazenamento do Sales Rep Code no banco de dados
    Given o usuário acessa o banco de dados
    Then deve localizar a tabela e a coluna onde o Sales Rep Code está armazenado
    And entender seu comportamento ao alterar no merchant e nos leases

  Scenario: C7 - Realizar múltiplas buscas com diferentes valores no Sales Rep Code
    Given o usuário acessa a Funding Queue
    When realiza buscas com diferentes valores para Sales Rep Code
    Then os resultados apresentados devem corresponder corretamente ao código buscado

  Scenario: C8 - Validar Sales Rep Code no CSV enviado por e-mail
    Given o usuário realiza uma busca na Funding Queue
    When solicita o envio do relatório CSV por e-mail
    Then o arquivo recebido deve conter a coluna Sales Rep Code corretamente preenchida

  Scenario: C9 - Validar Sales Rep Code no CSV baixado
    Given o usuário realiza uma busca na Funding Queue
    When baixa o arquivo CSV
    Then o arquivo baixado deve conter a coluna Sales Rep Code corretamente preenchida

------------------------------------------------------------------------------------------------------------------------------------------------------------------

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| X | X | Verify that the field name "UOwn Sales Rep Code" is correctly displayed in the merchant settings | | PASS |
| X | X | Verify that after inserting a value in the "UOwn Sales Rep Code" field, saving the changes, and creating a lease, the code is correctly displayed in the Funding Queue search results | | PASS |
| X | X | Verify that the column "Sales Rep Code" is visible in the Funding Queue table | | PASS |
| X | X | Verify that the search field name "Sales Rep Code" is correctly displayed in the Funding Queue. | | PASS |
| X | X | Verify that after creating a new lease with an associated Sales Rep Code, modifying the code in the merchant does not alter the lease's code. | | PASS |
| X | X | Verify that the Sales Rep Code is correctly stored in the database by identifying the correct table and column | | PASS |
| X | X | Verify that performing multiple searches with different Sales Rep Code values returns the correct results | | PASS |
| X | X | Verify that the CSV report sent via email contains the "Sales Rep Code" column correctly filled | | PASS |
| X | X | Verify that the downloaded CSV file contains the "Sales Rep Code" column correctly filled | | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verifique se o nome do campo "UOwn Sales Rep Code" está corretamente exibido nas configurações do merchant.
Verify that the field name "UOwn Sales Rep Code" is correctly displayed in the merchant settings

Verifique se, após inserir um valor no campo "UOwn Sales Rep Code", salvar as alterações e criar um lease, o código é exibido corretamente nos resultados da busca na Funding Queue.
Verify that after inserting a value in the "UOwn Sales Rep Code" field, saving the changes, and creating a lease, the code is correctly displayed in the Funding Queue search results

Verifique se a coluna "Sales Rep Code" está visível na tabela da Funding Queue.
Verify that the column "Sales Rep Code" is visible in the Funding Queue table

Verifique se o nome do campo de busca "Sales Rep Code" está corretamente exibido na Funding Queue.
Verify that the search field name "Sales Rep Code" is correctly displayed in the Funding Queue.

Verifique se, após criar um novo lease com um Sales Rep Code associado, modificar o código no merchant não altera o código do lease.
Verify that after creating a new lease with an associated Sales Rep Code, modifying the code in the merchant does not alter the lease's code.

Verifique se o Sales Rep Code está corretamente armazenado no banco de dados, identificando a tabela e coluna corretas.
Verify that the Sales Rep Code is correctly stored in the database by identifying the correct table and column

Verifique se a realização de múltiplas buscas com diferentes valores no Sales Rep Code retorna os resultados corretos.
Verify that performing multiple searches with different Sales Rep Code values returns the correct results

Verifique se o relatório CSV enviado por e-mail contém a coluna "Sales Rep Code" corretamente preenchida.
Verify that the CSV report sent via email contains the "Sales Rep Code" column correctly filled

Verifique se o arquivo CSV baixado contém a coluna "Sales Rep Code" corretamente preenchida.
Verify that the downloaded CSV file contains the "Sales Rep Code" column correctly filled

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa1

------------------------------------------------------------------------------------------------------------------------------------------------------------------
Tests in staging

| LeadPk | Merchant | Test Case | Test Data | Status | Observation |
| ------ | ------ | ------ | ------ | ------ |------ |
| X | X | Verify that the field name "UOwn Sales Rep Code" is correctly displayed in the merchant settings | | PASS | -- |
| X | X | Verify that after inserting a value in the "UOwn Sales Rep Code" field, saving the changes, and creating a lease, the code is correctly displayed in the Funding Queue search results | | PASS | -- |
| X | X | Verify that the column "Sales Rep Code" is visible in the Funding Queue table | | PASS | -- |
| X | X | Verify that the search field name "Sales Rep Code" is correctly displayed in the Funding Queue. | | PASS | -- |
| X | X | Verify that after creating a new lease with an associated Sales Rep Code, modifying the code in the merchant does not alter the lease's code. | | PASS | -- |
| X | X | Verify that the Sales Rep Code is correctly stored in the database by identifying the correct table and column | | PASS | -- |
| X | X | Verify that performing multiple searches with different Sales Rep Code values returns the correct results | | PASS | -- |
| X | X | Verify that the CSV report sent via email contains the "Sales Rep Code" column correctly filled | | PASS | -- |
| X | X | Verify that the downloaded CSV file contains the "Sales Rep Code" column correctly filled | | PASS | -- |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in staging

------------------------------------------------------------------------------------------------------------------------------------------------------------------
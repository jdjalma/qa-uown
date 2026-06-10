--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1004

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Synopsis
A bug has been found on the search page where, when searching in any field and then changing the date, all previously entered fields are cleared. For example:
When searching using any field, the search works as expected. However, if the DATE field is modified, all other filters are reset/cleared.

Business Objective
Fix this functionality to ensure that users can perform consecutive searches while modifying the DATE field without losing previously entered fields.

Steps-to-Reproduce:
Access the Leads page.
Click on the "Filters" button.
Add any field (e.g., NAME).
Perform a search.        
Change the DATE field.


Test: Validation of Filter Persistence in Search
Check the video in the ticket description to see the behavior

Pre-requisites:
Access the search page.

Test Steps
Select a date range (From and To) and fill in other filter fields (e.g., email, SSN).
Perform a search and verify that the results are displayed correctly.
Change the date range and check if the other filter fields (email, SSN) remain unchanged.

Expected Result:
The updated search should be performed with the new date range while preserving the other filter values.


-----


Sinopse:
Foi encontrado um bug na página de busca onde, ao pesquisar em qualquer campo e depois alterar a data, todos os campos preenchidos anteriormente são limpos. Por exemplo:
Ao pesquisar usando qualquer campo, a busca funciona como esperado. No entanto, se o campo DATA for modificado, todos os outros filtros são redefinidos/limpados.

Objetivo de Negócio:
Corrigir essa funcionalidade para garantir que os usuários possam realizar buscas consecutivas enquanto modificam o campo DATA sem perder os campos preenchidos anteriormente.
Passos para Reproduzir:
Acesse a página de Leads.
Clique no botão "Filtros".
Adicione qualquer campo (por exemplo, NOME).
Realize uma busca.
Altere o campo DATA.


Teste: Validação da Persistência de Filtros na Busca
Verifique o vídeo na descrição do ticket para observar o comportamento.

Pré-requisitos:
Acesse a página de busca.

Passos do Teste:
Selecione um intervalo de datas (De e Até) e preencha outros campos de filtro (por exemplo, e-mail, SSN).
Realize uma busca e verifique se os resultados são exibidos corretamente.
Altere o intervalo de datas e confirme se os outros campos de filtro (e-mail, SSN) permanecem inalterados.

Resultado Esperado:
A busca atualizada deve ser realizada com o novo intervalo de datas, mantendo os valores dos outros filtros.
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Requisito da Tarefa:
Foi identificado um bug na página de busca onde, ao modificar o campo DATA, todos os demais filtros 
(SSN, Email, LeadPk, AccountPk, Phone Number, Customer Name, State, Lead Status, Internal Status, Merchant, Location e o campo de busca) são limpos. 
O objetivo é corrigir esse comportamento para que os usuários possam alterar o intervalo de datas sem perder os valores previamente inseridos, 
garantindo a precisão da busca e a integridade dos filtros aplicados.

-----

Cenários para Validação da Persistência dos Filtros
Scenario: 1 - Validar que a alteração do campo DATA não limpa o filtro "Customer name"
Descrição:
Este cenário verifica que, mesmo após alterar o intervalo de datas, o campo "Customer name" permanece preenchido com o valor informado, e os resultados da busca retornam apenas registros com o Customer name especificado.

Passos:
Given a página de Leads está aberta e o filtro "Customer name" foi preenchido.
When o usuário seleciona um intervalo de datas e realiza a busca, e depois altera o intervalo de datas sem reentrar o filtro "Customer name".
Then o valor inserido deve permanecer no campo "Customer name" e os resultados da busca devem corresponder aos registros que possuem o SSN Customer name informado, conforme verificado no banco de dados.

Resultado Esperado:
O campo "Customer name" mantém o valor  mesmo após a alteração do campo DATA.
Os resultados exibidos na tabela de busca são consistentes com o filtro aplicado e conferem com os dados armazenados no banco de dados.

-->OK
-----

Scenario: 2 - Validar que a alteração do campo DATA não limpa o filtro "Email"
Descrição:
Este cenário tem como objetivo confirmar que o filtro "Email" permanece inalterado após a modificação do intervalo de datas, e os resultados da busca apresentam somente os registros com o email especificado.

Passos:
Given a página de Leads está aberta e o filtro "Email" foi preenchido.
When o usuário seleciona um intervalo de datas e realiza a busca, e em seguida altera o intervalo de datas sem reentrar o filtro "Email".
Then o valor inserido deve permanecer no campo "Email" e os resultados devem corresponder aos registros filtrados por esse email, conforme os dados do banco de dados.

Resultado Esperado:
O campo "Email" mantém o valor "usuario@exemplo.com".
Os registros retornados na busca possuem o email "usuario@exemplo.com", conforme a validação no banco de dados.

-->OK
-----

Scenario: 3 - Validar que os filtros "LeadPk" e "AccountPk" permanecem inalterados após alteração do campo DATA
Descrição:
Este cenário valida que os campos "LeadPk" e "AccountPk" não são limpos ao modificar o intervalo de datas, mantendo os valores previamente inseridos, e que os resultados exibidos refletem corretamente esses filtros.

Passos:
Given a página de Leads está aberta e os filtros "LeadPk" e "AccountPk" foram preenchidos
When o usuário seleciona um intervalo de datas e realiza a busca, e depois altera o intervalo de datas sem reentrar os filtros "LeadPk" e "AccountPk".
Then os valores  inseridos em leadPk e AccountPk devem permanecer nos campos correspondentes, e os resultados da busca devem incluir somente os registros com esses identificadores, conforme o banco de dados.

Resultado Esperado:
Os campos "LeadPk" e "AccountPk" permanecem com os valores inseridos
A tabela de resultados apresenta somente os registros que possuem esses identificadores

-->OK
-----

Scenario: 4 - Validar que a alteração do campo DATA não limpa o filtro "Phone Number"
Descrição:
Neste cenário, o objetivo é assegurar que o campo "Phone Number" não seja limpo quando o intervalo de datas é alterado, mantendo seu valor e refletindo corretamente os resultados da busca.

Passos:
Given a página de Leads está aberta e o filtro "Phone Number" foi preenchido
When o usuário seleciona um intervalo de datas e realiza a busca, e depois altera o intervalo de datas sem reentrar o filtro "Phone Number".
Then o valor inserido deve continuar presente no campo "Phone Number" e os resultados devem mostrar apenas os registros correspondentes a esse número, conforme confirmado no banco de dados.

Resultado Esperado:
O campo "Phone Number" mantém o valor "1122334455".
Os registros retornados estão de acordo com o número informado.

-->OK
-----

Scenario: 5 - Validar que a alteração do campo DATA não limpa os filtros "State", "Lead Status", "Internal Status", "Merchant" e "Location"
Descrição:
Este cenário confirma que, após alterar o intervalo de datas, os filtros de "State", "Lead Status", "Internal Status", "Merchant" e "Location" permanecem inalterados, e os resultados da busca correspondem à combinação destes filtros.

Passos:
Given a página de Leads está aberta e os filtros "State", "Lead Status", "Internal Status", "Merchant" e "Location" foram preenchidos
When o usuário seleciona um intervalo de datas e realiza a busca, e depois altera o intervalo de datas sem reentrar os filtros mencionados.
Then os valores "CA", "New", "Active", "ProgressMobility" e "Sacramento" devem permanecer preenchidos e os resultados devem refletir os registros filtrados corretamente, conforme o banco de dados.

Resultado Esperado:
Os filtros permanecem com os valores inseridos.
A tabela de resultados apresenta os registros que correspondem à combinação dos filtros aplicados.

-->OK
-----

Scenario: 6 - Validar combinação de filtros (mínimo 4 filtros simultâneos) e persistência após alteração do campo DATA
Descrição:
Este cenário testa a persistência simultânea de múltiplos filtros, verificando que ao modificar o campo DATA os filtros combinados (neste caso, "Email", "SSN", "Customer Name" e "State") permanecem intactos e os resultados da busca refletem a combinação exata dos valores inseridos.
Passos:

Given a página de Leads está aberta e os filtros "Email", "SSN", "Customer Name" e "State" foram preenchidos
When o usuário insere um intervalo de datas e realiza a busca, e em seguida altera o intervalo de datas sem reentrar os filtros previamente preenchidos.
Then os filtros "Email", "SSN", "Customer Name" e "State" devem permanecer com os valores informados e os resultados apresentados devem corresponder à combinação dos filtros, conforme validado no banco de dados.

Resultado Esperado:
Todos os filtros aplicados (Email, SSN, Customer Name e State) permanecem inalterados mesmo após a alteração do intervalo de datas.
A tabela de resultados exibe os registros que correspondem exatamente à combinação dos valores inseridos, confirmados através de consulta no banco de dados.
-->OK

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Scenario 1
Verify that changing the DATE field does not clear the 'Customer name' filter, retaining its value and displaying only matching records
Verifique que alterar o campo DATA não limpa o filtro 'Customer name', mantendo seu valor e exibindo apenas os registros correspondentes

Scenario 2
Verify that modifying the DATA field does not reset the 'Email' filter, keeping the content filled and showing only records with that email.
Verifique que modificar o campo DATA não redefine o filtro 'Email', mantendo o conteudo preenchido e mostrando apenas registros com esse e-mai

Scenario 3
Verify that updating the DATE field leaves the 'LeadPk' and 'AccountPk' filters unchanged, preserving their values and returning only records
Verifique que atualizar o campo DATA mantém os filtros 'LeadPk' e 'AccountPk' inalterados, preservando seus valores e retornando apenas registros com esses identificadores

Scenario 4
Verify that changing the DATA field does not delete the 'Phone Number' filter, keeping its content and displaying only the corresponding records.
Verifique que alterar o campo DATA não apaga o filtro 'Phone Number', mantendo seu conteudo e exibindo apenas os registros correspondente

Scenario 5
Verify that changing the DATE field preserves the 'State', 'Lead Status', 'Internal Status', 'Merchant', and 'Location' filters, with results matching the combination
Verifique se a alteração do campo DATA preserva os filtros 'Estado', 'Status do lead', 'Status interno', 'Comerciante' e 'Local', com resultados correspondentes à combinação

Scenario 6
Verify that modifying the DATE field does not affect the combined 'Email', 'SSN', 'Customer Name', and 'State' filters, retaining all values and showing records matching
Verifique que modificar o campo DATA não afeta os filtros combinados 'Email', 'SSN', 'Customer Name' e 'State', mantendo todos os valores e exibindo registros correspondentes

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa2

| Test Case | Test Data | Status |
| ------ | ------ | ------ |
| Verify that changing the DATE field does not clear the 'Customer name' filter, retaining its value and displaying only matching records | ![1004-c1_1_](/uploads/534398f648f350eca3a3fb909a9dc355/1004-c1_1_.png){width=1425 height=717}![1004-c1_2_](/uploads/7f18558ac3e2dbebb7928f07908bed5a/1004-c1_2_.png){width=1425 height=717}![1004-c1_3_](/uploads/2dc7533f5ed2d5d11d070590449b10b7/1004-c1_3_.png){width=1425 height=717} | PASS |
| Verify that modifying the DATA field does not reset the 'Email' filter, keeping the content filled and showing only records with that email. | ![1004-c2_1_](/uploads/7d1492032f1e4ef151e4610f583b63bb/1004-c2_1_.png){width=1425 height=717}![1004-c2_2_](/uploads/34494a97f9ca9c288db8a880de03b401/1004-c2_2_.png){width=1425 height=717} | PASS |
| Verify that updating the DATE field leaves the 'LeadPk' and 'AccountPk' filters unchanged, preserving their values and returning only records | ![1004c3_1_](/uploads/810e074a739a2581475646e1900623d4/1004c3_1_.png){width=1425 height=717}![1004c3_2_](/uploads/3716819a37beff8b6bb6193979032894/1004c3_2_.png){width=1425 height=717}![1004c3_3_](/uploads/964ba68d291ef13808f99dcd9f8ad6b0/1004c3_3_.png){width=1425 height=717}![1004c3_4_](/uploads/6dce161a0f5d25432fb8fa23d9401ee1/1004c3_4_.png){width=1425 height=717} | PASS |
| Verify that changing the DATA field does not delete the 'Phone Number' filter, keeping its content and displaying only the corresponding records. | ![1004-c4_1_](/uploads/b236ccd4822caa1a4400f100848f51cf/1004-c4_1_.png){width=1425 height=717}![1004-c4_2_](/uploads/3aacf1e9d4e91ed78f7d211e86fd8cf4/1004-c4_2_.png){width=1425 height=717}![1004-c4_3_](/uploads/b8d82410963888b5b8dd6605ff321e48/1004-c4_3_.png){width=1425 height=717}![1004-c4_4_](/uploads/fb41c7e5e81e905fde8bdd35604d420c/1004-c4_4_.png){width=1425 height=717} | PASS |
| Verify that changing the DATE field preserves the 'State', 'Lead Status', 'Internal Status', 'Merchant', and 'Location' filters, keeping 'CA', 'New', 'Active', 'ProgressMobility', and 'Sacramento', with results matching the combination | ![1004c5_1_](/uploads/d0ad5b5d02e81ff25eb848064165705b/1004c5_1_.png){width=1425 height=717}![1004c5_2_](/uploads/1af57a94e0153179a516bf7eedb126a7/1004c5_2_.png){width=1425 height=717}![1004c5_3_](/uploads/8845f16ba51da70913a4ccd1de5bd49a/1004c5_3_.png){width=1425 height=717}![1004c5_4_](/uploads/1750923bf78a2db2254854c0a7d8fc58/1004c5_4_.png){width=1425 height=717}![1004c5_5_](/uploads/7ff69a40cdd7950f2ca665869a4f3188/1004c5_5_.png){width=1425 height=717}![1004c5_6_](/uploads/7cdca300f9b9ebb946da8600472ab90e/1004c5_6_.png){width=1425 height=717} | PASS |
| Verify that modifying the DATE field does not affect the combined 'Email', 'SSN', 'Customer Name', and 'State' filters, retaining all values and showing records matching | ![1004-c6_1_](/uploads/c560e9962c4ceecf5dd3a13365f3acb9/1004-c6_1_.png){width=1425 height=717}![1004-c6_2_](/uploads/30adb772c86c952b913619505a393248/1004-c6_2_.png){width=1425 height=717}![1004-c6_3_](/uploads/8ddef93080dc614b5455fb981faef1e7/1004-c6_3_.png){width=1425 height=717}![1004-c6_4_](/uploads/6f2ef292c6560396aa65cd61e39dd3a6/1004-c6_4_.png){width=1425 height=717}![1004-c6_5_](/uploads/b107f9c5d1ef72bacd9eff21df3d6883/1004-c6_5_.png){width=1425 height=717}![1004-c6_6_](/uploads/bff877870af28a8b6e24eeae61c94913/1004-c6_6_.png){width=1425 height=717}![1004-c6_7_](/uploads/40d628eb57de598b3f032eefc7637362/1004-c6_7_.png){width=1425 height=717} | PASS |

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa2

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in stg

| Test Case | Test Data | Status |
| ------ | ------ | ------ |
| Verify that changing the DATE field does not clear the 'Customer name' filter, retaining its value and displaying only matching records |  | PASS |
| Verify that modifying the DATA field does not reset the 'Email' filter, keeping the content filled and showing only records with that email. |  | PASS |
| Verify that updating the DATE field leaves the 'LeadPk' and 'AccountPk' filters unchanged, preserving their values and returning only records |  | PASS |
| Verify that changing the DATA field does not delete the 'Phone Number' filter, keeping its content and displaying only the corresponding records. |  | PASS |
| Verify that changing the DATE field preserves the 'State', 'Lead Status', 'Internal Status', 'Merchant', with results matching the combination |  | PASS |
| Verify that modifying the DATE field does not affect the combined 'Email', 'SSN', 'Customer Name', and 'State' filters, retaining all values and showing records matching |  | PASS |

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in stg

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
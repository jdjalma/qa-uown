------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1010

UOWN | Origination | Fix Log Activity Filter to Display All Available Types in ORIGINATION

Synopsis
The Log Activity filter dropdown is not displaying all available log types in ORIGINATION. Instead, 
it only shows the log types present in the currently loaded paginated results, leading to an incomplete filtering experience.

Business Objective
Ensure that the Log Activity filter dropdown always displays all available log types, regardless of pagination, 
so that users can apply accurate filters without being limited by the displayed entries.

Feature Request | Business Requirement  
1. Update the Log Activity filter dropdown to pull all possible log types from the backend, instead of relying on only the currently paginated data.
2. Ensure that users can filter logs accurately, even when only a subset of logs is loaded on the screen.

Marcos Silvano @marcos.pacheco.silva
Test instructions:
Perform the same tests executed for the activity logs for the customer in the #1001 (closed) but this time in the lead page from origination

-----

UOWN | Originação | Corrigir o Filtro de Atividade de Log para Exibir Todos os Tipos Disponíveis em ORIGINAÇÃO

Sinopse
O menu suspenso do filtro de Atividade de Log não está exibindo todos os tipos de log disponíveis em ORIGINAÇÃO. Em vez disso, ele mostra apenas os tipos de log presentes nos resultados paginados atualmente carregados, resultando em uma experiência de filtragem incompleta.

Objetivo de Negócio
Garantir que o menu suspenso do filtro de Atividade de Log sempre exiba todos os tipos de log disponíveis, independentemente da paginação, para que os usuários possam aplicar filtros precisos sem serem limitados pelas entradas exibidas.

Solicitação de Recurso | Requisito de Negócio

Atualizar o menu suspenso do filtro de Atividade de Log para buscar todos os tipos de log possíveis no backend, em vez de depender apenas dos dados paginados atualmente.
Garantir que os usuários possam filtrar os logs com precisão, mesmo quando apenas um subconjunto de logs está carregado na tela.
Marcos Silvano @marcos.pacheco.silva

Instruções de teste:
Realize os mesmos testes executados para os logs de atividade do cliente no #1001 (fechado), mas desta vez na página de leads em Originação.

------------------------------------------------------------------------------------------------------------------------------------------------------------------



nessa tarefa eu fiz testes de paginacao e rows per page que é selecionar o numero de registros que serao apresentados nos portais origination, servicing e website.





Origination
Filtrando por log activity que não está presente em tela mas esta presente no log em outra pagina no log de custumers do portal origination e comparado o tempo de processamento com ambiente staging
Realizado paginação para ultima pagina no no log de custumers do portal origination e comparado o tempo de processamento com ambiente staging
Realizado paginação para ultima pagina no no log de leads do portal origination e comparado o tempo de processamento com ambiente staging
Selecionado quantidade de registros apresentados(row per page) no log de leads do portal origination e comparado o tempo de processamento com ambiente staging
Adicionado notes no log de merchant do portal origination
Filtrando por log activity que não está presente em tela mas esta presente no log em outra pagina no log de merchant do portal Origination
Realizado paginação para ultima pagina no no log de merchant do portal origination e comparado o tempo de processamento com ambiente staging
Selecionado quantidade de registros apresentados(row per page) no log de merchant do portal origination e comparado o tempo de processamento com ambiente staging
Realizado paginação para ultima pagina na lista de leads, em overview do portal origination e comparado o tempo de processamento com ambiente staging
Selecionado quantidade de registros apresentados(row per page) na lista de leads, em overview do portal origination e comparado o tempo de processamento com ambiente staging
Selecionado quantidade de registros apresentados(row per page) na lista de leads, em Leads do portal Origination e comparado o tempo de processamento com ambiente staging

Servicing:
Adicionado novo log no log de servicing do portal Servicing e comparado o tempo de processamento com ambiente staging
Realizado paginação no log de servicing do portal Servicing e comparado o tempo de processamento com ambiente staging
Realizado paginação para ultima pagina no log de Payment Transactions do portal Servicing 
Selecionado quantidade de registros apresentados(row per page) no log de servicing do portal Servicing e comparado o tempo de processamento com ambiente staging
Realizado paginação para ultima pagina no log de Search do portal Servicing e comparado o tempo de processamento com ambiente staging
Filtrando por log activity que não está presente em tela mas esta presente no log em outra pagina no log de servicing do portal Servicing e comparado o tempo de processamento com ambiente staging

Website:
Paginacao no log de Account Activity
Search filtrando por Amount no log de Account Activity

Ams:
Realizado paginação para ultima pagina no log do Usuario do portal Ams e comparado o tempo de processamento com ambiente staging
Realizado paginação para ultima pagina na lista de Users do portal Ams e comparado o tempo de processamento com ambiente staging
Filtrado resultado por username nos filtros da lista de Users do portal Ams e feito download de arquivo csv validando se no arquivo contém todos os resultados filtrados e não somente da página exibidas
Selecionado quantidade de registros apresentados(row per page) na lista de Users do portal Ams e comparado o tempo de processamento com ambiente staging





 Origination
🇧🇷 Português | 🇺🇸 English
1. 
Filtrando por log activity não exibido em tela, mas presente em outra página no log de customers, e comparado o tempo com o ambiente staging.
Filtering by log activity not shown on screen but present on another page in the customer log, and compared loading time with staging.

2.
Paginando até a última página do log de customers e comparado o tempo com o ambiente staging.
Paginating to the last page of the customer log and compared loading time with staging.

3.
Paginando até a última página do log de leads e comparado o tempo com o ambiente staging.
Paginating to the last page of the leads log and compared loading time with staging.

4.
Mudando o número de registros por página no log de leads e comparado o tempo com o ambiente staging.
Changing the number of rows per page in the leads log and compared loading time with staging.

5.
Adicionado note no log de merchant.
Adding note in the merchant log.

6.
Filtrando por log activity não exibido em tela, mas presente em outra página no log de merchant.
Filtering by log activity not shown on screen but present on another page in the merchant log.

7.
Paginando até a última página do log de merchant e comparado o tempo com o ambiente staging.
Paging to the last page of the merchant log and compared loading time with staging.

8.
Mudando o número de registros por página no log de merchant e comparado o tempo com o ambiente staging.
Changing the number of rows per page in the merchant log and compared loading time with staging.

9.
Paginando até a última página da lista de leads no overview e comparado o tempo com o ambiente staging.
Paginating to the last page of the leads list in the overview and compared loading time with staging.

10.
Mudando o número de registros por página na lista de leads no overview e comparado o tempo com o ambiente staging.
Changing the number of rows per page in the leads list in the overview and compared loading time with staging.

11.
Mudando o número de registros por página na lista de leads em Leads e comparado o tempo com o ambiente staging.
Changing the number of rows per page in the leads list in Leads and compared loading time with staging.

🔹 Servicing
🇧🇷 Português | 🇺🇸 English
12.
Adicionando novo log no log de servicing e comparado o tempo com o ambiente staging.
Adding new entry in the servicing log and compared loading time with staging

13.
Paginando no log de servicing e comparado o tempo com o ambiente staging.
Paginating in the servicing log and compared loading time with staging

14.
Paginando até a última página do log de Payment Transactions.
Paginating to the last page of the Payment Transactions log

15.
Mudando o número de registros por página no log de servicing e comparado o tempo com o ambiente staging.
Changing the number of rows per page in the servicing log and compared loading time with staging

16.
Paginando até a última página do log de Search e comparado o tempo com o ambiente staging.
Paginating to the last page of the Search log and compared loading time with staging

17 .
Filtrando por log activity não exibido em tela, mas presente em outra página no log de servicing, e comparado o tempo com o ambiente staging.
Filtering by log activity not shown on screen but present on another page in the servicing log, and compared loading time with staging

🔹 Website
🇧🇷 Português | 🇺🇸 English
18.
Paginando no log de Account Activity.
Paginating in the Account Activity log

19.
Filtrando por Amount no log de Account Activity.
Filtering by Amount in the Account Activity log

🔹 Ams
🇧🇷 Português | 🇺🇸 English
20.
Paginando até a última página do log de Usuário e comparado o tempo com o ambiente staging.
Paginating to the last page of the User log and compared loading time with staging

21.
Paginando até a última página da lista de Users e comparado o tempo com o ambiente staging.
Paginating to the last page of the Users list and compared loading time with staging

22.
Filtrando por username na lista de Users e feito download do CSV, validando se contém todos os resultados filtrados e não só os da página exibida.
Filtering by username in the Users list and downloaded the CSV, validating that it contains all filtered results and not only those from the current page

23.
Alterando o número de registros por página na lista de Users e comparado o tempo com o ambiente staging.
Changing the number of rows per page in the Users list and compared loading time with staging

Em Origination, verifique se ao inserir uma nota do tipo log interno, estando na página 2 ou superior, o sistema retorna à página 1 e o contador de paginação acompanha da mudança de página, exibindo os dados da primeira página e informando a página correta no contador de paginação.
In Origination, check that when inserting an internal log note, on page 2 or higher, the system returns to page 1 and the pagination counter follows the page change, displaying the data from the first page and indicating the correct page in the pagination counter

Em Origination, verifique se ao selecionar um tipo de log no filtro de log activity e filtrar os resultados, e depois inserir uma nova nota do tipo log interno, o filtro selecionado é mantido e os dados apresentados correspondam ao filtro, exibindo somente resultados conforme o filtro aplicado
In Origination, check that when selecting a log type in the activity log filter and filtering the results, and then inserting a new internal log note, the selected filter is maintained and the data presented corresponds to the filter, displaying only results according to the applied filter

Em Servicing, verifique se ao inserir uma nota do tipo log interno, estando na página 2 ou superior, o sistema retorna à página 1 e o contador de paginação acompanha da mudança de página, exibindo os dados da primeira página e informando a página correta no contador de paginação.
In Servicing, check that when inserting an internal log note, on page 2 or higher, the system returns to page 1 and the pagination counter follows the page change, displaying the data from the first page and indicating the correct page in the pagination counter

Em Servicing, verifique se ao selecionar um tipo de log no filtro de log activity e filtrar os resultados, e depois inserir uma nova nota do tipo log interno, o filtro selecionado é mantido e os dados apresentados correspondam ao filtro, exibindo somente resultados conforme o filtro aplicado
In Servicing, check that when selecting a log type in the activity log filter and filtering the results, and then inserting a new internal log note, the selected filter is maintained and the data presented corresponds to the filter, displaying only results according to the applied filter

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa1

| Test Case | Test Data | Status |
| ------ | ------ | ------ |
| In Origination, Filtering by log activity not shown on screen but present on another page in the customer log, and compared loading time with staging |  | PASS |
| In Origination, Paginating to the last page of the customer log and compared loading time with staging |  | PASS |
| In Origination, Paginating to the last page of the leads log and compared loading time with staging |  | PASS |
| In Origination, Changing the number of rows per page in the leads log and compared loading time with staging |  | PASS |
| In Origination, Adding note in the merchant log |  | PASS |
| In Origination, Filtering by log activity not shown on screen but present on another page in the merchant log |  | PASS |
| In Origination, Paging to the last page of the merchant log and compared loading time with staging |  | PASS |
| In Origination, Changing the number of rows per page in the merchant log and compared loading time with staging |  | PASS |
| In Origination, Paginating to the last page of the leads list in the overview and compared loading time with staging |  | PASS |
| In Origination, Changing the number of rows per page in the leads list in the overview and compared loading time with staging |  | PASS |
| In Origination, Changing the number of rows per page in the leads list in Leads and compared loading time with staging |  | PASS |
| In Servicing, Adding new entry in the servicing log and compared loading time with staging |  | PASS |
| In Servicing, Paginating in the servicing log and compared loading time with staging |  | PASS |
| In Servicing, Paginating to the last page of the Payment Transactions log |  | PASS |
| In Servicing, Changing the number of rows per page in the servicing log and compared loading time with staging |  | PASS |
| In Servicing, Paginating to the last page of the Search log and compared loading time with staging |  | PASS |
| In Servicing, Filtering by log activity not shown on screen but present on another page in the servicing log, and compared loading time with staging |  | PASS |
| In Website, Paginating in the Account Activity log |  | PASS |
| In Website, Filtering by Amount in the Account Activity log |  | PASS |
| In Ams, Paginating to the last page of the User log and compared loading time with staging |  | PASS |
| In Ams, Paginating to the last page of the Users list and compared loading time with staging |  | PASS |
| In Ams, Filtering by username in the Users list and downloaded the CSV, validating that it contains all filtered results and not only those from the current page |  | PASS |
| In Ams, Changing the number of rows per page in the Users list and compared loading time with staging |  | PASS |





Tests in qa1

| Test Case | Test Data | Status | Observation |
| ------ | ------ | ------ | ------ |
| In Origination, Filtering by log activity not shown on screen but present on another page in the customer log. | ![qa1-1010-Origination-Customers-LogActivity-MesmoTempoComparadoStaging-c1_1_](/uploads/c9e5f8fa17fe363cfc78cda93a89cf1a/qa1-1010-Origination-Customers-LogActivity-MesmoTempoComparadoStaging-c1_1_.png){width=1440 height=742}![qa1-1010-Origination-Customers-LogActivity-MesmoTempoComparadoStaging-c1_2_](/uploads/f951473dd02615ffb18fa73c7689f7ee/qa1-1010-Origination-Customers-LogActivity-MesmoTempoComparadoStaging-c1_2_.png){width=1440 height=742}![qa1-1010-Origination-Customers-LogActivity-MesmoTempoComparadoStaging-c1_3_](/uploads/67f893419a1fec8286add017c70b9d58/qa1-1010-Origination-Customers-LogActivity-MesmoTempoComparadoStaging-c1_3_.png){width=1440 height=742} | PASS |  |
| In Origination, Paginating to the last page of the customer log and compared processing time with staging | ![qa1-1010-Origination-Customers-Paginar-MesmoTempoComparadoStaging-c1_1_](/uploads/ec57a9c6a7ad4105d0391c2ebe977b45/qa1-1010-Origination-Customers-Paginar-MesmoTempoComparadoStaging-c1_1_.png){width=1438 height=744}![qa1-1010-Origination-Customers-Paginar-MesmoTempoComparadoStaging-c1_2_](/uploads/d462a6111124753a08cd1ae3ec5d0d94/qa1-1010-Origination-Customers-Paginar-MesmoTempoComparadoStaging-c1_2_.png){width=1438 height=744}![qa1-1010-Origination-Customers-Paginar-MesmoTempoComparadoStaging-c1_3_](/uploads/b6235198559052fee47aa4f6d230da99/qa1-1010-Origination-Customers-Paginar-MesmoTempoComparadoStaging-c1_3_.png){width=1436 height=741}![qa1-1010-Origination-Customers-Paginar-MesmoTempoComparadoStaging-c1_4_](/uploads/e24f89f788b80be7c2484ef86ae3c871/qa1-1010-Origination-Customers-Paginar-MesmoTempoComparadoStaging-c1_4_.png){width=1436 height=739}![qa1-1010-Origination-Customers-Paginar-MesmoTempoComparadoStaging-c1_5_](/uploads/d5e28853f71e38ed07dca5ff4738d097/qa1-1010-Origination-Customers-Paginar-MesmoTempoComparadoStaging-c1_5_.png){width=1436 height=739} | PASS |  |
| In Origination, Paginating to the last page of the leads log and compared processing time with staging | ![qa1-1010-Origination-Leads-Paginar-MesmoTempoComparadoStaging-c1_1_](/uploads/1c8671a6981fad1f168aa0d02d330e32/qa1-1010-Origination-Leads-Paginar-MesmoTempoComparadoStaging-c1_1_.png){width=1436 height=741}![qa1-1010-Origination-Leads-Paginar-MesmoTempoComparadoStaging-c1_2_](/uploads/e29ce210921c65c9eca3a73186d36a0f/qa1-1010-Origination-Leads-Paginar-MesmoTempoComparadoStaging-c1_2_.png){width=1436 height=741}![qa1-1010-Origination-Leads-Paginar-MesmoTempoComparadoStaging-c1_3_](/uploads/8c60ad074ade5aaab9ee20a42ee4ef73/qa1-1010-Origination-Leads-Paginar-MesmoTempoComparadoStaging-c1_3_.png){width=1437 height=738}![qa1-1010-Origination-Leads-Paginar-MesmoTempoComparadoStaging-c1_4_](/uploads/1cd9974aacb28e7354c52ba5a612e401/qa1-1010-Origination-Leads-Paginar-MesmoTempoComparadoStaging-c1_4_.png){width=1437 height=738} | PASS |  |
| In Origination, Changing the number of rows per page in the leads list and compared processing time with staging | ![qa1-1010-Origination-Leads-RowsPerPage-MesmoTempoComparadoStaging-c1_1_](/uploads/f9fcf00395d5660cde7b86ee04f871a1/qa1-1010-Origination-Leads-RowsPerPage-MesmoTempoComparadoStaging-c1_1_.png){width=1437 height=738}![qa1-1010-Origination-Leads-RowsPerPage-MesmoTempoComparadoStaging-c1_2_](/uploads/a308b4be04a2d5ab1985ba443499ce69/qa1-1010-Origination-Leads-RowsPerPage-MesmoTempoComparadoStaging-c1_2_.png){width=1437 height=738}![qa1-1010-Origination-Leads-RowsPerPage-MesmoTempoComparadoStaging-c1_3_](/uploads/695bf548be5dee5452f522a08b1ccdef/qa1-1010-Origination-Leads-RowsPerPage-MesmoTempoComparadoStaging-c1_3_.png){width=1437 height=738}![qa1-1010-Origination-Leads-RowsPerPage-MesmoTempoComparadoStaging-c1_4_](/uploads/cc47eba2105a7d5abbaa300dbfa1590d/qa1-1010-Origination-Leads-RowsPerPage-MesmoTempoComparadoStaging-c1_4_.png){width=1437 height=740}![qa1-1010-Origination-Leads-RowsPerPage-MesmoTempoComparadoStaging-c1_5_](/uploads/de61ccd723565eca4e5f1265365d3b12/qa1-1010-Origination-Leads-RowsPerPage-MesmoTempoComparadoStaging-c1_5_.png){width=1437 height=740}![qa1-1010-Origination-Leads-RowsPerPage-MesmoTempoComparadoStaging-c1_6_](/uploads/f12a773771ec686be3726d174489e034/qa1-1010-Origination-Leads-RowsPerPage-MesmoTempoComparadoStaging-c1_6_.png){width=1437 height=740} | PASS |  |
| In Origination, Adding note in the merchant log | ![qa1-1010-Origination-Merchant-LogActivity-c1_2_](/uploads/73ab4366a4902d79e7b247847e0a8825/qa1-1010-Origination-Merchant-LogActivity-c1_2_.png){width=1436 height=743}![qa1-1010-Origination-Merchant-LogActivity-c1_3_](/uploads/bce458a43740ce30c0ca434bc12daa2e/qa1-1010-Origination-Merchant-LogActivity-c1_3_.png){width=1437 height=743}![qa1-1010-Origination-Merchant-LogActivity-c1_4_](/uploads/837d44e888e5b38b049094332878ab51/qa1-1010-Origination-Merchant-LogActivity-c1_4_.png){width=1437 height=743} | PASS |  |  |
| In Origination, Filtering by log activity in merchant log not shown on screen but present on another page in the merchant log | ![qa1-1010-Origination-Merchant-FilterLogActivity-c1_1_](/uploads/a2c728bad4c26a44dacff5bbac4b84fc/qa1-1010-Origination-Merchant-FilterLogActivity-c1_1_.png){width=1435 height=741}![qa1-1010-Origination-Merchant-FilterLogActivity-c1_2_](/uploads/95457b2630ba9dbd8bdc89984a038dae/qa1-1010-Origination-Merchant-FilterLogActivity-c1_2_.png){width=1441 height=741} | PASS |  |  |
| In Origination, Paging to the last page of the merchant log and compared processing time with staging | ![qa1-1010-Origination-Merchant-Paginar-MesmoTempoComparadoStaging-c1_1_](/uploads/5f67f37cbc0d6f44a569e99f98a80c62/qa1-1010-Origination-Merchant-Paginar-MesmoTempoComparadoStaging-c1_1_.png){width=1437 height=743}![qa1-1010-Origination-Merchant-Paginar-MesmoTempoComparadoStaging-c1_2_](/uploads/e30680002bfc2c4c73d9041027206506/qa1-1010-Origination-Merchant-Paginar-MesmoTempoComparadoStaging-c1_2_.png){width=1437 height=743}![qa1-1010-Origination-Merchant-Paginar-MesmoTempoComparadoStaging-c1_3_](/uploads/0fd554430fda14e39cd4131bb328a275/qa1-1010-Origination-Merchant-Paginar-MesmoTempoComparadoStaging-c1_3_.png){width=1439 height=738}![qa1-1010-Origination-Merchant-Paginar-MesmoTempoComparadoStaging-c1_4_](/uploads/0e787ad19f4999e867a2de31fb3eebf5/qa1-1010-Origination-Merchant-Paginar-MesmoTempoComparadoStaging-c1_4_.png){width=1439 height=738} | PASS |  |
| In Origination, Changing the number of rows per page in the merchant log and compared processing time with staging | ![qa1-1010-Origination-Merchant-RowsPerPage-MesmoTempoComparadoStaging-c1_1_](/uploads/b4f68fde5babcfecd3e5e277a52fad45/qa1-1010-Origination-Merchant-RowsPerPage-MesmoTempoComparadoStaging-c1_1_.png){width=1440 height=741}![qa1-1010-Origination-Merchant-RowsPerPage-MesmoTempoComparadoStaging-c1_2_](/uploads/1326f4a5818076f55845f026dc619cad/qa1-1010-Origination-Merchant-RowsPerPage-MesmoTempoComparadoStaging-c1_2_.png){width=1440 height=741}![qa1-1010-Origination-Merchant-RowsPerPage-MesmoTempoComparadoStaging-c1_3_](/uploads/7e181004628ac9e2e711731dd46b41c3/qa1-1010-Origination-Merchant-RowsPerPage-MesmoTempoComparadoStaging-c1_3_.png){width=1439 height=742}![qa1-1010-Origination-Merchant-RowsPerPage-MesmoTempoComparadoStaging-c1_4_](/uploads/ca88e37d7992f25df58e313e01373b55/qa1-1010-Origination-Merchant-RowsPerPage-MesmoTempoComparadoStaging-c1_4_.png){width=1439 height=742} | PASS |  |
| In Origination, Paginating to the last page of the leads list in the overview and compared processing time with staging | ![qa1-1010-Origination-Overview-_Paginar-MesmoTempoComparadoStaging-c1_1_](/uploads/7ed853132bef6addd6fe0c438c371243/qa1-1010-Origination-Overview-_Paginar-MesmoTempoComparadoStaging-c1_1_.png){width=1436 height=741} | PASS |  |
| In Origination, Changing the number of rows per page in the leads list in the overview and compared processing time with staging | ![qa1-1010-Origination-Overview-RowsPerPage-MesmoTempoComparadoStaging-c1_1_](/uploads/62512ec82c3e733933c043b940094007/qa1-1010-Origination-Overview-RowsPerPage-MesmoTempoComparadoStaging-c1_1_.png){width=1432 height=738}![qa1-1010-Origination-Overview-RowsPerPage-MesmoTempoComparadoStaging-c1_2_](/uploads/a3ec0f1405201f63296fd81e3589c4cc/qa1-1010-Origination-Overview-RowsPerPage-MesmoTempoComparadoStaging-c1_2_.png){width=1437 height=738}![qa1-1010-Origination-Overview-RowsPerPage-MesmoTempoComparadoStaging-c1_3_](/uploads/ece1f44955a3074a548f5ff0c5faceb9/qa1-1010-Origination-Overview-RowsPerPage-MesmoTempoComparadoStaging-c1_3_.png){width=1437 height=738}![qa1-1010-Origination-Overview-RowsPerPage-MesmoTempoComparadoStaging-c1_4_](/uploads/294261516ac02b9505072b30c5c0ae3d/qa1-1010-Origination-Overview-RowsPerPage-MesmoTempoComparadoStaging-c1_4_.png){width=1438 height=739}![qa1-1010-Origination-Overview-RowsPerPage-MesmoTempoComparadoStaging-c1_5_](/uploads/ec008ce4e205925016178f7a520cbab4/qa1-1010-Origination-Overview-RowsPerPage-MesmoTempoComparadoStaging-c1_5_.png){width=1438 height=739}![qa1-1010-Origination-Overview-RowsPerPage-MesmoTempoComparadoStaging-c1_6_](/uploads/84473093897e26d155090cfa68d1a2c5/qa1-1010-Origination-Overview-RowsPerPage-MesmoTempoComparadoStaging-c1_6_.png){width=1438 height=739} | PASS |  |
| In Origination, Changing the number of rows per page in the leads list in Leads and compared processing time with staging | ![qa1-1010-Origination-Leads-RowPerPage-MesmoTempoComparadoStaging-c1_1_](/uploads/2b5b21bf65c0c39efbf0a93f6e896325/qa1-1010-Origination-Leads-RowPerPage-MesmoTempoComparadoStaging-c1_1_.png){width=1440 height=742}![qa1-1010-Origination-Leads-RowPerPage-MesmoTempoComparadoStaging-c1_2_](/uploads/c83e779252afaa2509dbb25feb14186f/qa1-1010-Origination-Leads-RowPerPage-MesmoTempoComparadoStaging-c1_2_.png){width=1439 height=742}![qa1-1010-Origination-Leads-RowPerPage-MesmoTempoComparadoStaging-c1_3_](/uploads/b7721f81f46233f6c51129ec343e8461/qa1-1010-Origination-Leads-RowPerPage-MesmoTempoComparadoStaging-c1_3_.png){width=1439 height=742}![qa1-1010-Origination-Leads-RowPerPage-MesmoTempoComparadoStaging-c1_4_](/uploads/96943b7a25045ddbdba565db1d419b98/qa1-1010-Origination-Leads-RowPerPage-MesmoTempoComparadoStaging-c1_4_.png){width=1438 height=743}![qa1-1010-Origination-Leads-RowPerPage-MesmoTempoComparadoStaging-c1_5_](/uploads/0b89d8bb059b75b17c957a6fb30def6d/qa1-1010-Origination-Leads-RowPerPage-MesmoTempoComparadoStaging-c1_5_.png){width=1438 height=743}![qa1-1010-Origination-Leads-RowsPerPage-MesmoTempoComparadoStaging-c1_1_](/uploads/f4579038b1604d7b98f327a86a34ea1d/qa1-1010-Origination-Leads-RowsPerPage-MesmoTempoComparadoStaging-c1_1_.png){width=1437 height=738}![qa1-1010-Origination-Leads-RowsPerPage-MesmoTempoComparadoStaging-c1_2_](/uploads/3062f60eb8a65b6ce2a9287c5f82e0ae/qa1-1010-Origination-Leads-RowsPerPage-MesmoTempoComparadoStaging-c1_2_.png){width=1437 height=738}![qa1-1010-Origination-Leads-RowsPerPage-MesmoTempoComparadoStaging-c1_3_](/uploads/4be8e02a7c048458230601be0354566f/qa1-1010-Origination-Leads-RowsPerPage-MesmoTempoComparadoStaging-c1_3_.png){width=1437 height=738}![qa1-1010-Origination-Leads-RowsPerPage-MesmoTempoComparadoStaging-c1_4_](/uploads/257eccd31db2b7eb15964006fc039ce9/qa1-1010-Origination-Leads-RowsPerPage-MesmoTempoComparadoStaging-c1_4_.png){width=1437 height=740}![qa1-1010-Origination-Leads-RowsPerPage-MesmoTempoComparadoStaging-c1_5_](/uploads/dea2bd6ff843d195b0cd3a4418ddd45f/qa1-1010-Origination-Leads-RowsPerPage-MesmoTempoComparadoStaging-c1_5_.png){width=1437 height=740}![qa1-1010-Origination-Leads-RowsPerPage-MesmoTempoComparadoStaging-c1_6_](/uploads/f1bbc192b12591b75b636ed3828c7da6/qa1-1010-Origination-Leads-RowsPerPage-MesmoTempoComparadoStaging-c1_6_.png){width=1437 height=740} | PASS |  |
| In Servicing, Adding new entry in the servicing log and compared processing time with staging | ![qa1-1010-Servicing-AddNewLog-MesmoTempoComparadoStaging-c1_1_](/uploads/c34cbb0bf4b0171326eac3d48a9330c1/qa1-1010-Servicing-AddNewLog-MesmoTempoComparadoStaging-c1_1_.png){width=1437 height=741}![qa1-1010-Servicing-AddNewLog-MesmoTempoComparadoStaging-c1_2_](/uploads/e1eb89ef997d97f9b8f1de238936dc00/qa1-1010-Servicing-AddNewLog-MesmoTempoComparadoStaging-c1_2_.png){width=1437 height=741}![qa1-1010-Servicing-AddNewLog-MesmoTempoComparadoStaging-c1_3_](/uploads/cd400e3d8edbf47e865eedde068e4f79/qa1-1010-Servicing-AddNewLog-MesmoTempoComparadoStaging-c1_3_.png){width=1437 height=741}![qa1-1010-Servicing-AddNewLog-MesmoTempoComparadoStaging-c1_7_](/uploads/4f74107c36f31af2fcf686716af13370/qa1-1010-Servicing-AddNewLog-MesmoTempoComparadoStaging-c1_7_.png){width=1438 height=744}![qa1-1010-Servicing-AddNewLog-MesmoTempoComparadoStaging-c1_8_](/uploads/b6859ab8dad72f9a77dcc32dc7f6ee22/qa1-1010-Servicing-AddNewLog-MesmoTempoComparadoStaging-c1_8_.png){width=1438 height=744}![qa1-1010-Servicing-AddNewLog-MesmoTempoComparadoStaging-c1_9_](/uploads/652e931e734a4332e530608a03170608/qa1-1010-Servicing-AddNewLog-MesmoTempoComparadoStaging-c1_9_.png){width=1438 height=744} | PASS |  |
| In Servicing, Paginating in the servicing log and compared processing time with staging | ![qa1-1010-Servicing-ServicingPaginar-MesmoTempoComparadoStaging-c1_1_](/uploads/9a5b390c92088fdb9abda1d73c7e5128/qa1-1010-Servicing-ServicingPaginar-MesmoTempoComparadoStaging-c1_1_.png){width=1437 height=741}![qa1-1010-Servicing-ServicingPaginar-MesmoTempoComparadoStaging-c1_2_](/uploads/42499a15fbf76311679092aa9a4b9c6b/qa1-1010-Servicing-ServicingPaginar-MesmoTempoComparadoStaging-c1_2_.png){width=1437 height=741}![qa1-1010-Servicing-ServicingPaginar-MesmoTempoComparadoStaging-c1_3_](/uploads/8df1ea659b711ea663ff54f34ba3708b/qa1-1010-Servicing-ServicingPaginar-MesmoTempoComparadoStaging-c1_3_.png){width=1438 height=744}![qa1-1010-Servicing-ServicingPaginar-MesmoTempoComparadoStaging-c1_4_](/uploads/35a105496df1db2460231adc216a1575/qa1-1010-Servicing-ServicingPaginar-MesmoTempoComparadoStaging-c1_4_.png){width=1438 height=744} | PASS |  |
| In Servicing, Paginating to the last page of the Payment Transactions log | ![qa1-1010-Servicing-PaymentTransactions-c1_1_](/uploads/ca10d84f686ee28daea4661d4274a8ab/qa1-1010-Servicing-PaymentTransactions-c1_1_.png){width=1438 height=744}![qa1-1010-Servicing-PaymentTransactions-c1_2_](/uploads/6d522f84d9e30e6488af4cf20a07f6f4/qa1-1010-Servicing-PaymentTransactions-c1_2_.png){width=1438 height=744} | PASS |  |
| In Servicing, Changing the number of rows per page in the servicing log and compared processing time with staging | ![qa1-1010-Servicing-RowPerPage-MesmoTempoComparadoStaging-c1_1_](/uploads/23b81544f89eb08fe724233180c39295/qa1-1010-Servicing-RowPerPage-MesmoTempoComparadoStaging-c1_1_.png){width=1437 height=741}![qa1-1010-Servicing-RowPerPage-MesmoTempoComparadoStaging-c1_2_](/uploads/fc8344839f2650aba64f0209d6fee988/qa1-1010-Servicing-RowPerPage-MesmoTempoComparadoStaging-c1_2_.png){width=1437 height=741}![qa1-1010-Servicing-RowPerPage-MesmoTempoComparadoStaging-c1_3_](/uploads/db4509a48bc9315ff113aa87b95ad003/qa1-1010-Servicing-RowPerPage-MesmoTempoComparadoStaging-c1_3_.png){width=1437 height=741}![qa1-1010-Servicing-RowPerPage-MesmoTempoComparadoStaging-c1_4_](/uploads/bf61e95e84d7f6917287906eba88d98e/qa1-1010-Servicing-RowPerPage-MesmoTempoComparadoStaging-c1_4_.png){width=1438 height=744}![qa1-1010-Servicing-RowPerPage-MesmoTempoComparadoStaging-c1_5_](/uploads/f434c01091b1558daf33c9e7eab9c0ca/qa1-1010-Servicing-RowPerPage-MesmoTempoComparadoStaging-c1_5_.png){width=1438 height=744}![qa1-1010-Servicing-RowPerPage-MesmoTempoComparadoStaging-c1_6_](/uploads/6faf12116ca7d5c9ad8e80331a9901e3/qa1-1010-Servicing-RowPerPage-MesmoTempoComparadoStaging-c1_6_.png){width=1438 height=744}![qa1-1010-Servicing-RowPerPage-MesmoTempoComparadoStaging-c1_7_](/uploads/fde9ba06260f620642a8f6c347e56f61/qa1-1010-Servicing-RowPerPage-MesmoTempoComparadoStaging-c1_7_.png){width=1437 height=741}![qa1-1010-Servicing-RowPerPage-MesmoTempoComparadoStaging-c1_8_](/uploads/4b22b2458a8cd99f65425a9d0ae51126/qa1-1010-Servicing-RowPerPage-MesmoTempoComparadoStaging-c1_8_.png){width=1437 height=741}![qa1-1010-Servicing-RowPerPage-MesmoTempoComparadoStaging-c1_9_](/uploads/9dc582cefa6adedc797be4d544192a29/qa1-1010-Servicing-RowPerPage-MesmoTempoComparadoStaging-c1_9_.png){width=1437 height=741} | PASS |  |
| In Servicing, Paginating to the last page of the Search log and compared processing time with staging | ![qa1-1010-Servicing-Search-PaginarUltimaPagina-MesmoTempoComparadoStaging-c1_1_](/uploads/fe91e2364646a2135ee13ede0382523a/qa1-1010-Servicing-Search-PaginarUltimaPagina-MesmoTempoComparadoStaging-c1_1_.png){width=1437 height=741}![qa1-1010-Servicing-Search-PaginarUltimaPagina-MesmoTempoComparadoStaging-c1_2_](/uploads/7a74d874280141b0eb32347717d20eca/qa1-1010-Servicing-Search-PaginarUltimaPagina-MesmoTempoComparadoStaging-c1_2_.png){width=1437 height=741}![qa1-1010-Servicing-Search-PaginarUltimaPagina-MesmoTempoComparadoStaging-c1_3_](/uploads/93f3001822f014c9cae90f5503f01562/qa1-1010-Servicing-Search-PaginarUltimaPagina-MesmoTempoComparadoStaging-c1_3_.png){width=1437 height=741}![qa1-1010-Servicing-Search-PaginarUltimaPagina-MesmoTempoComparadoStaging-c1_4_](/uploads/4a9340cd920bf0decb9b11991dc4d939/qa1-1010-Servicing-Search-PaginarUltimaPagina-MesmoTempoComparadoStaging-c1_4_.png){width=1437 height=741} | PASS |  |
| In Servicing, Filtering by log activity not shown on screen but present on another page in the servicing log, and compared processing time with staging |  | PASS |  |
| In Website, Paginating in the Account Activity log | ![qa1-1010-Website-c1_1_](/uploads/8014781caa7ee6cf11185d21fe4686c9/qa1-1010-Website-c1_1_.png){width=1433 height=744}![qa1-1010-Website-c1_2_](/uploads/92cbcfa70f7818e989bac4e4bbb311a2/qa1-1010-Website-c1_2_.png){width=1433 height=744} | PASS |  |
| In Website, Filtering by Amount in the Account Activity log | ![qa1-1010-Website-c2_3_](/uploads/864f7e986b4cba831e4a1aba452efeb7/qa1-1010-Website-c2_3_.png){width=1433 height=744}![qa1-1010-Website-c2_4_](/uploads/527e0e409887eeb8307b2b4ea884a3e5/qa1-1010-Website-c2_4_.png){width=1433 height=744}![qa1-1010-Website-c2_5_](/uploads/f9a3f5d4df3fae19a2af4f4bbede9120/qa1-1010-Website-c2_5_.png){width=1433 height=744} | PASS |  |
| In Ams, Paginating to the last page of the User log and compared processing time with staging | ![qa1-1010-Ams-ListaUsers-PaginarLogUsuario-MesmoTempoComparadoStaging-c1_1_](/uploads/0f7e64ff405136af7df9066e00e675e0/qa1-1010-Ams-ListaUsers-PaginarLogUsuario-MesmoTempoComparadoStaging-c1_1_.png){width=1434 height=741}![qa1-1010-Ams-ListaUsers-PaginarLogUsuario-MesmoTempoComparadoStaging-c1_2_](/uploads/7a192c548de13ccf3cdfe9b3e88fdd0c/qa1-1010-Ams-ListaUsers-PaginarLogUsuario-MesmoTempoComparadoStaging-c1_2_.png){width=1434 height=741}![qa1-1010-Ams-ListaUsers-PaginarLogUsuario-MesmoTempoComparadoStaging-c1_3_](/uploads/5340d92261865325a2e2b46ce9371fdf/qa1-1010-Ams-ListaUsers-PaginarLogUsuario-MesmoTempoComparadoStaging-c1_3_.png){width=1436 height=739}![qa1-1010-Ams-ListaUsers-PaginarLogUsuario-MesmoTempoComparadoStaging-c1_4_](/uploads/bcb4957c1fb5862f0301c7b35e35f006/qa1-1010-Ams-ListaUsers-PaginarLogUsuario-MesmoTempoComparadoStaging-c1_4_.png){width=1436 height=739} | PASS |  |
| In Ams, Paginating to the last page of the Users list and compared processing time with staging | ![qa1-1010-Ams-ListaUsers-Paginar-MesmoTempoComparadoStaging-c1_1_](/uploads/ebb55293d09fc9f4ceebd6d4bc865f96/qa1-1010-Ams-ListaUsers-Paginar-MesmoTempoComparadoStaging-c1_1_.png){width=1440 height=742}![qa1-1010-Ams-ListaUsers-Paginar-MesmoTempoComparadoStaging-c1_2_](/uploads/cdb370b0745d59605690a76bce538040/qa1-1010-Ams-ListaUsers-Paginar-MesmoTempoComparadoStaging-c1_2_.png){width=1440 height=742}![qa1-1010-Ams-ListaUsers-Paginar-MesmoTempoComparadoStaging-c1_3_](/uploads/fe368b61ca80952abac55fd52c120255/qa1-1010-Ams-ListaUsers-Paginar-MesmoTempoComparadoStaging-c1_3_.png){width=1440 height=742}![qa1-1010-Ams-ListaUsers-Paginar-MesmoTempoComparadoStaging-c1_4_](/uploads/5339bccd629d6dc42af82852a3edbb9a/qa1-1010-Ams-ListaUsers-Paginar-MesmoTempoComparadoStaging-c1_4_.png){width=1439 height=745}![qa1-1010-Ams-ListaUsers-Paginar-MesmoTempoComparadoStaging-c1_5_](/uploads/e4b0b367538bfb779a7a371aec6c1a37/qa1-1010-Ams-ListaUsers-Paginar-MesmoTempoComparadoStaging-c1_5_.png){width=1439 height=745}![qa1-1010-Ams-ListaUsers-Paginar-MesmoTempoComparadoStaging-c1_6_](/uploads/bcca4b45ce05ac3ebfb2a414e336d48d/qa1-1010-Ams-ListaUsers-Paginar-MesmoTempoComparadoStaging-c1_6_.png){width=1439 height=745} | PASS |  |
| In Ams, Filtering by username in the Users list and downloaded the CSV, validating that it contains all filtered results and not only those from the current page | ![qa1-1010-Ams-Users-FiltrandoResultadosBaixandoCsv-c1_1_](/uploads/396560abfd7bbef38d470dff679a57df/qa1-1010-Ams-Users-FiltrandoResultadosBaixandoCsv-c1_1_.png){width=1437 height=804}![qa1-1010-Ams-Users-FiltrandoResultadosBaixandoCsv-c1_2_](/uploads/57e3a3dacb703e922480d9dd8d0c8fa5/qa1-1010-Ams-Users-FiltrandoResultadosBaixandoCsv-c1_2_.png){width=935 height=434}![qa1-1010-Ams-Users-FiltrandoResultadosBaixandoCsv-c1_3_](/uploads/f0395a876d3107589fe98122fd7dd6b5/qa1-1010-Ams-Users-FiltrandoResultadosBaixandoCsv-c1_3_.png){width=935 height=434} | PASS |  |
| Check that when inserting an internal log note, on page 2 or higher, the system returns to page 1 and the pagination counter follows the page change, displaying the data from the first page and indicating the correct page in the pagination counter |  | WIP |  |
| Check that when selecting a log type in the activity log filter and filtering the results, and then inserting a new internal log note, the selected filter is maintained and the data presented corresponds to the filter, displaying only results according to the applied filter |  | WIP |  |
------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa1

------------------------------------------------------------------------------------------------------------------------------------------------------------------

stg

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Origination
Português: Verifique se, em Origination, é possível filtrar por atividade de log não exibida na tela, mas presente em outra página nos logs de clientes, leads e merchant, paginar até a última página desses logs, alterar o número de linhas por página nos logs de leads e merchant, e adicionar nota no log do merchant.
Inglês: Verify that, in Origination, it is possible to filter by log activity not shown on screen but present on another page in customer, leads, and merchant logs, paginate to the last page of these logs, change the number of rows per page in leads and merchant logs, and add a note in the merchant log.

Servicing
Português: Verifique se, em Servicing, é possível adicionar nova entrada no log de servicing, filtrar por atividade de log não exibida na tela, mas presente em outra página no log de servicing, paginar até a última página dos logs de servicing, transações de pagamento e pesquisa, e alterar o número de linhas por página no log de servicing.
Inglês: Verify that, in Servicing, it is possible to add a new entry to the servicing log, filter by log activity not shown on screen but present on another page in the servicing log, paginate to the last page of servicing, payment transactions, and search logs, and change the number of rows per page in the servicing log.

Ams
Português: Verifique se, em Ams, é possível paginar até a última página dos logs de usuários e da lista de usuários, filtrar por nome de usuário na lista de usuários e baixar o CSV contendo todos os resultados filtrados, e alterar o número de linhas por página na lista de usuários.
Inglês: Verify that, in Ams, it is possible to paginate to the last page of user logs and the users list, filter by username in the users list and download a CSV containing all filtered results, and change the number of rows per page in the users list.

Verifique se, ao inserir uma nova nota de log interna na página 2 ou superior, o sistema mantém a página atual, com o contador de paginação não alterado, e garante que o log seja inserido na primeira página.
Verify that when a new internal log note is inserted on page 2 or higher, the system remains on the current page, without altering the pagination counter, and ensures that the inserted log appears on the first page

Verifique se, ao selecionar um tipo de log no filtro de log de atividade e filtrar os resultados, e depois inserir uma nova nota de log interna, o filtro selecionado é mantido e os dados apresentados correspondem ao filtro, exibindo apenas resultados de acordo com o filtro aplicado
Check that when selecting a log type in the activity log filter and filtering the results, and then inserting a new internal log note, the selected filter is maintained and the data presented corresponds to the filter, displaying only results according to the applied filter

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in stg

| Test Case | Test Data | Status | Observation
| ------ | ------ | ------ | ------ |
| Verify that, in Origination, it is possible to filter by log activity not shown on screen but present on another page in customer, leads, and merchant logs, paginate to the last page of these logs, change the number of rows per page in leads and merchant logs, and add a note in the merchant log | ![stg-1010-c1_1_](/uploads/dbcb6b40169f8cc87d5bc3eb92bc8181/stg-1010-c1_1_.png){width=1430 height=740}![stg-1010-c1_2_](/uploads/565f9387987f8464073a55c6dcc99af3/stg-1010-c1_2_.png){width=1430 height=740}![stg-1010-c1_3_](/uploads/0e761240a057e97df506d4e8f8171bc3/stg-1010-c1_3_.png){width=1430 height=740}![stg-1010-c1_4_](/uploads/0416add9d6dc0abd039bd15dc6ef7609/stg-1010-c1_4_.png){width=1430 height=740}![stg-1010-c1_5_](/uploads/5e0d102913c89f38e5b7c126f7219a51/stg-1010-c1_5_.png){width=1438 height=740}![stg-1010-c1_6_](/uploads/0055037f07c2f5eb333a193eb8033a87/stg-1010-c1_6_.png){width=1438 height=740}![stg-1010-c1_7_](/uploads/b412951955b6edca0b95e062fc8bf820/stg-1010-c1_7_.png){width=1438 height=740}![stg-1010-c1_8_](/uploads/20c7799b6b2b637d74e9563d338944f2/stg-1010-c1_8_.png){width=1438 height=740}![stg-1010-c1_9_](/uploads/ae20d07140776337eb39f42b9cf98bac/stg-1010-c1_9_.png){width=1438 height=740}![stg-1010-c1_10_](/uploads/07759336deb9b3d70213fa12e70a0cac/stg-1010-c1_10_.png){width=1438 height=740}![stg-1010-c1_11_](/uploads/3a90dc3ab7ffc08491deac128be148bc/stg-1010-c1_11_.png){width=1438 height=740}![stg-1010-c1_12_](/uploads/e613c24ba262a037cbc2e55d397bca85/stg-1010-c1_12_.png){width=1438 height=740}![stg-1010-c1_13_](/uploads/fbb9699a829dcdcca358e4710823eb9c/stg-1010-c1_13_.png){width=1438 height=740}![stg-1010-c1_14_](/uploads/4d51a99c3f6b497b8bcf4a40f0952258/stg-1010-c1_14_.png){width=1438 height=740}![stg-1010-c1_15_](/uploads/12c29d6ec36c4539d4d5bf568cc14bae/stg-1010-c1_15_.png){width=1438 height=740}![stg-1010-c1_16_](/uploads/e4f7908902e7d613bc6902f4ab714502/stg-1010-c1_16_.png){width=1438 height=740}![stg-1010-c1_17_](/uploads/d7068671131131140ec911b8bc71b645/stg-1010-c1_17_.png){width=1438 height=740}![stg-1010-c1_18_](/uploads/1aa5023cc135889c85f4ab3e9f034dd0/stg-1010-c1_18_.png){width=1438 height=740}![stg-1010-c1_19_](/uploads/cb32c07499899fb7b3dfcd174d854ede/stg-1010-c1_19_.png){width=1438 height=740} | PASS | -- |
| Verify that, in Servicing, it is possible to add a new entry to the servicing log, filter by log activity not shown on screen but present on another page in the servicing log, paginate to the last page of servicing, payment transactions, and search logs, and change the number of rows per page in the servicing log | ![stg-1010-c2_1_](/uploads/cbc0dbe8230edf52a95648d1cf0cfd19/stg-1010-c2_1_.png){width=1438 height=740}![stg-1010-c2_2_](/uploads/3f96009ffd319139ca6d31792f8ac7f4/stg-1010-c2_2_.png){width=1438 height=740}![stg-1010-c2_3_](/uploads/abf8124d23fb4385ac51f35fed117307/stg-1010-c2_3_.png){width=1438 height=740}![stg-1010-c2_4_](/uploads/86d2ad56d55d5fbdc0bc1c5c18073f0f/stg-1010-c2_4_.png){width=1438 height=740}![stg-1010-c2_5_](/uploads/d228627cf0ca275ee26514511c2ecc5e/stg-1010-c2_5_.png){width=1438 height=740}![stg-1010-c2_6_](/uploads/370e56fad27c3cdad17b8e1baad48ff0/stg-1010-c2_6_.png){width=1438 height=740}![stg-1010-c2_7_](/uploads/abce315f6d42dc1eeadabf90554ebda4/stg-1010-c2_7_.png){width=1438 height=740}![stg-1010-c2_8_](/uploads/7e6329f113acb3762a631fcdaa1842c5/stg-1010-c2_8_.png){width=1438 height=740}![stg-1010-c2_9_](/uploads/be12311231348a8fc22cc8a380c41833/stg-1010-c2_9_.png){width=1438 height=740}![stg-1010-c2_10_](/uploads/e002680eda691a29267963a468842c3e/stg-1010-c2_10_.png){width=1438 height=740}![stg-1010-c2_11_](/uploads/c6d8c535c247e9fefcdb627e8752ee43/stg-1010-c2_11_.png){width=1438 height=740}![stg-1010-c2_12_](/uploads/81ff3e3303b46800d5efd3aa6ea61f3a/stg-1010-c2_12_.png){width=1438 height=740} | PASS | -- |
| Verify that, in Ams, it is possible to paginate to the last page of user logs and the users list, filter by username in the users list and download a CSV containing all filtered results, and change the number of rows per page in the users list | ![stg-1010-c3_1_](/uploads/3a07bd835854c4c2875fb62a34ee05ef/stg-1010-c3_1_.png){width=1438 height=740}![stg-1010-c3_2_](/uploads/f96b5241a90b00dd3bd76856d12ae44b/stg-1010-c3_2_.png){width=1438 height=740}![stg-1010-c3_3_](/uploads/192270f07a1db0c97cc687d079b11060/stg-1010-c3_3_.png){width=1438 height=740}![stg-1010-c3_4_](/uploads/60fce700a9cd658bc3dfcc6be2b5e9d3/stg-1010-c3_4_.png){width=1438 height=740}![stg-1010-c3_5_](/uploads/f1d668a2d4a3e345fa224b16d359d376/stg-1010-c3_5_.png){width=1438 height=740}![stg-1010-c3_6_](/uploads/fdd4d597029da5e8620c41017d55dd0a/stg-1010-c3_6_.png){width=1438 height=740}![stg-1010-c3_7_](/uploads/18ae8c6c419eb0cbae179d68806416af/stg-1010-c3_7_.png){width=1438 height=740}![stg-1010-c3_8_](/uploads/fcb3b7e41060be5000b8b6b67358127e/stg-1010-c3_8_.png){width=1438 height=740}![stg-1010-c3_9_](/uploads/04ff2aee38c0156db5d72ca8a4d1ae0b/stg-1010-c3_9_.png){width=1438 height=740}![stg-1010-c3_10_](/uploads/e55384821ac5e621649f181045e71099/stg-1010-c3_10_.png){width=1438 height=740}![stg-1010-c3_11_](/uploads/9bd873d4083904489b093d567f8a1960/stg-1010-c3_11_.png){width=1438 height=740}![stg-1010-c3_12_](/uploads/31479c214715dc4e17c6e7e670fa8da4/stg-1010-c3_12_.png){width=1438 height=740}![stg-1010-c3_13_](/uploads/5d941ce67264aaeee8e8c849de094c0e/stg-1010-c3_13_.png){width=1438 height=740}![stg-1010-c3_14_](/uploads/731678f2e99de1bc3bfd8b51fa3a0cb2/stg-1010-c3_14_.png){width=1438 height=740}![stg-1010-c3_15_](/uploads/3475845c9317c59a0a8c16257865a5ee/stg-1010-c3_15_.png){width=1438 height=740} | PASS | -- |
| Verify that when a new internal log note is inserted on page 2 or higher, the system remains on the current page, without altering the pagination counter, and ensures that the inserted log appears on the first page | ![stg-1010-c4_1_](/uploads/3c9fc42829bfd29e38f9155189be7421/stg-1010-c4_1_.png){width=1432 height=741}![stg-1010-c4_2_](/uploads/3bd56fb7026c3424111da121ceb796a0/stg-1010-c4_2_.png){width=1432 height=741}![stg-1010-c4_3_](/uploads/8c7102e56c1563b76aa69aeb9bb15b30/stg-1010-c4_3_.png){width=1432 height=741}![stg-1010-c4_4_](/uploads/13a56dbe14905525a4ef310e42793aba/stg-1010-c4_4_.png){width=1432 height=741}![stg-1010-c4_5_](/uploads/34e99cea85654d1fc6e97b8c2898043a/stg-1010-c4_5_.png){width=1432 height=741} | PASS | -- |
| Check that when selecting a log type in the activity log filter and filtering the results, and then inserting a new internal log note, the selected filter is maintained and the data presented corresponds to the filter, displaying only results according to the applied filter | ![stg-1010-c5_1_](/uploads/2843159654f2f80a89fd81a3c695c296/stg-1010-c5_1_.png){width=1432 height=741}![stg-1010-c5_2_](/uploads/f6cd20885d174543c638ca33245c772c/stg-1010-c5_2_.png){width=1432 height=741}![stg-1010-c5_3_](/uploads/44d51f7fae3bbe64bb59239643860714/stg-1010-c5_3_.png){width=1432 height=741}![stg-1010-c5_4_](/uploads/e68591250da1d8e1a2321d84b89cdeab/stg-1010-c5_4_.png){width=1432 height=741} | ERROR - BACKLOG | When we perform the search after inserting the log note, results differing from the selected filter are displayed, it is necessary to create a task in the backlog |
------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in stg

------------------------------------------------------------------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1008

------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Origination | Create fields to separate the search between ID and Status on Activity Logs Search

Synopsis
Currently, the filters on the Customers page have two search fields. We need to modify one of them by replacing the search with UserID. 
We will keep the Log Activity search and add a search for Notes as well. It must be implemented in customer-information page from ORIGINATION and the lead,
program and merchant pages from SERVICING also in the user pages from AMS

Business Objective
This way, we can search separately by UserID and Notes.

Feature Request | Business Requirements
Create separate fields for searching by ID and searching by Status.
Ensure that the filter search is performed both on the front-end and back-end.
Make sure the search is executed across all pages, not just the one currently displayed on the screen.

-----

UOWN | Originação | Criar campos para separar a busca entre ID e Status na Pesquisa de Logs de Atividade

Sinopse
Atualmente, os filtros na página de Customers possuem dois campos de busca. Precisamos modificar um deles, substituindo a busca por UserID.
Manteremos a busca de Log de Atividade e adicionaremos uma busca por Notas também. Isso deve ser implementado nas páginas:
Realizar busca por userid e notas em todas as páginas.
Origination:
* Customers
* Configurações do Merchant
* Programs

Servicing:
* Servicing

Ams:
* Configuração do usuário


Objetivo de Negócio
Dessa forma, poderemos buscar separadamente por UserID e Notas.
    Realizar buscas por UserID e validar no frontend
    Realizar buscas por Notas e validar no frontend
    Realizar buscas por UserID e validar no backend
    Realizar buscas por Notas e validar no backend

Solicitação de Recurso | Requisitos de Negócio
Criar campos separados para busca por ID e por Status.
Garantir que a busca por filtro seja realizada tanto no front-end quanto no back-end.
Assegurar que a busca seja executada em todas as páginas, não apenas na página atualmente exibida na tela.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

📋 Requisito da Tarefa
Criar campos separados para busca entre ID e Status na Pesquisa de Logs de Atividade.
A busca deve ser realizada separadamente por UserID e Notas nas páginas de Origination, Servicing e AMS.
A busca deve ser válida tanto no front-end quanto no back-end e ser executada em todas as páginas mencionadas.


🧪 Cenários de Teste Gherkin

Scenario 1 – Verificar busca por UserID no front-end da página de Customers

Scenario: 1 - Verificar busca por UserID no front-end da página de Customers
  Given que o usuário está na página de Customers em Origination
  When ele realiza uma busca por UserID no campo de pesquisa
  Then os resultados devem exibir somente registros com o UserID correspondente
  And verifique na interface que os resultados exibem os dados corretos para o UserID

🔍 Verifique se ao realizar a busca por UserID na interface, apenas os registros com o UserID correspondente são exibidos.
📝 Explicação: Este cenário garante que o campo de busca por UserID funcione corretamente no front-end da página de Customers.
✅ Resultado Esperado: A interface exibe apenas os registros correspondentes ao UserID inserido.

-----

Scenario 2 – Verificar busca por Notas no front-end da página de Customers

Scenario: 2 - Verificar busca por Notas no front-end da página de Customers
  Given que o usuário está na página de Customers em Origination
  When ele realiza uma busca por Notas no campo de pesquisa
  Then os resultados devem exibir somente registros com as Notas correspondentes
  And verifique na interface que os resultados exibem os dados corretos para as Notas

🔍 Verifique se ao realizar a busca por Notas na interface, apenas os registros com as Notas correspondentes são exibidos.
📝 Explicação: Este cenário garante que a busca por Notas esteja funcionando corretamente no front-end da página de Customers.
✅ Resultado Esperado: A interface exibe apenas os registros que contêm as Notas correspondentes.

Erro: Nao foi possivel adicionar uma nota de log do tipo interno, o log inserido não é exibido em tela.
-----

Scenario 3 – Verificar busca por UserID no back-end da página de Customers

Scenario: 3 - Verificar busca por UserID no back-end da página de Customers
  Given que o usuário realiza a busca por UserID no back-end da página de Customers
  When o sistema executa a busca
  Then os resultados devem ser retornados com o UserID correspondente
  And verifique no banco de dados que os registros retornados têm o UserID correto

🔍 Verifique se o back-end retorna os registros com o UserID correto quando a busca é realizada.
📝 Explicação: Este cenário valida a funcionalidade da busca por UserID no back-end e a correção dos resultados retornados.
✅ Resultado Esperado: O banco de dados retorna os registros corretos com o UserID correspondente.

-----

Scenario 4 – Verificar busca por Notas no back-end da página de Customers

Scenario: 4 - Verificar busca por Notas no back-end da página de Customers
  Given que o usuário realiza a busca por Notas no back-end da página de Customers
  When o sistema executa a busca
  Then os resultados devem ser retornados com as Notas correspondentes
  And verifique no banco de dados que os registros retornados contêm as Notas corretas

🔍 Verifique se o back-end retorna os registros com as Notas corretas quando a busca é realizada.
📝 Explicação: Este cenário valida a funcionalidade da busca por Notas no back-end e a precisão dos resultados retornados.
✅ Resultado Esperado: O banco de dados retorna os registros corretos com as Notas correspondentes.

-----

Scenario 5 – Verificar busca por UserID no front-end da página de Configurações do Merchant

Scenario: 5 - Verificar busca por UserID no front-end da página de Configurações do Merchant
  Given que o usuário está na página de Configurações do Merchant em Origination
  When ele realiza uma busca por UserID no campo de pesquisa
  Then os resultados devem exibir somente registros com o UserID correspondente
  And verifique na interface que os resultados exibem os dados corretos para o UserID

🔍 Verifique se ao realizar a busca por UserID na interface, os resultados exibem somente registros correspondentes ao UserID inserido.
📝 Explicação: Esse cenário garante que a busca por UserID funcione corretamente na página de Configurações do Merchant.
✅ Resultado Esperado: A interface exibe apenas os registros que correspondem ao UserID.

-----

Scenario 6 – Verificar busca por Notas no front-end da página de Configurações do Merchant

Scenario: 6 - Verificar busca por Notas no front-end da página de Configurações do Merchant
  Given que o usuário está na página de Configurações do Merchant em Origination
  When ele realiza uma busca por Notas no campo de pesquisa
  Then os resultados devem exibir somente registros com as Notas correspondentes
  And verifique na interface que os resultados exibem os dados corretos para as Notas

🔍 Verifique se ao realizar a busca por Notas na interface, somente os registros com as Notas correspondentes são exibidos.
📝 Explicação: Este cenário valida a funcionalidade da busca por Notas na página de Configurações do Merchant.
✅ Resultado Esperado: A interface exibe somente os registros correspondentes às Notas.

-----

Scenario 7 – Verificar a busca por UserID na página de Servicing

Scenario: 7 - Verificar busca por UserID na página de Servicing
  Given que o usuário acessa a página de Servicing
  When ele realiza a busca por UserID
  Then os resultados devem exibir somente registros que correspondem ao UserID
  And verifique na interface que os resultados exibem os dados corretos para UserID
  And verifique no banco de dados que os registros retornados correspondem aos critérios

🔍 Verifique se ao realizar a busca por UserID e Notas na página de Servicing, apenas os registros correspondentes são exibidos.
📝 Explicação: Este cenário valida a combinação de busca por UserID e Notas na página de Servicing.
✅ Resultado Esperado: A interface e o banco de dados retornam os registros corretos com base nos critérios de busca.


userid incompleto
userid que nao existe
userId de internal
procurando uma note como userid
-----

Scenario 8 – Verificar a busca por  Notas na página de Servicing

Scenario: 8 - Verificar busca por  Notas na página de Servicing
  Given que o usuário acessa a página de Servicing
  When ele realiza a busca por Notas
  Then os resultados devem exibir somente registros que correspondem às Notas
  And verifique na interface que os resultados exibem os dados corretos para as Notas

🔍 Verifique se ao realizar a busca por UserID e Notas na página de Servicing, apenas os registros correspondentes são exibidos.
📝 Explicação: Este cenário valida a combinação de busca por UserID e Notas na página de Servicing.
✅ Resultado Esperado: A interface e o banco de dados retornam os registros corretos com base nos critérios de busca.


nota incompleto
nota que nao existe
nota de internal
procurando por uma nota usando informando userid
buscar da segunda pagina em diante e validar se é apresentados resultados e paginacao na primeira pagina

-----

Scenario 9 – Verificar a funcionalidade da busca na página de AMS (Configuração de Usuário)

Scenario: 9 - Verificar busca por UserID na página de AMS
  Given que o usuário está na página de Configuração de Usuário em AMS
  When ele realiza a busca por UserID
  Then os resultados devem exibir somente registros que correspondem ao UserID 
  And verifique na interface que os resultados exibem os dados corretos para UserID

🔍 Verifique se ao realizar a busca por UserID na página de Configuração de Usuário em AMS, os resultados estão corretos.
📝 Explicação: Este cenário valida a busca por UserID na página de AMS.
✅ Resultado Esperado: A interface e o banco de dados retornam os registros corretos com base nos critérios de busca.

-----

Scenario 10 – Verificar a funcionalidade da busca na página de AMS (Configuração de Usuário)

Scenario: 10 - Verificar busca por Notas na página de AMS
  Given que o usuário está na página de Configuração de Usuário em AMS
  When ele realiza a busca por Notas
  Then os resultados devem exibir somente registros que correspondem às Notas
  And verifique na interface que os resultados exibem os dados corretos para Notas
  And verifique no banco de dados que os registros retornados correspondem aos critérios

🔍 Verifique se ao realizar a busca por Notas na página de Configuração de Usuário em AMS, os resultados estão corretos.
📝 Explicação: Este cenário valida a busca por Notas na página de AMS.
✅ Resultado Esperado: A interface e o banco de dados retornam os registros corretos com base nos critérios de busca.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verifique se a busca por UserID no log da página de Customers em Origination exibe apenas registros com o UserID correspondente
Verify that searching by UserID in the Customers page log in Origination displays only matching UserID records

Verifique se a busca por Notas no log da página de Customers em Origination exibe apenas registros com as Notas correspondentes
Verify that searching by Notes in the Customers page log in Origination displays only matching Notes records

Verifique se o back-end retorna registros com o UserID correto ao buscar no log da página de Customers em Origination
Verify that the back-end returns records with the correct UserID when searching in the Customers page log in Origination

Verifique se o back-end retorna registros com as Notas corretas ao buscar no log da página de Customers em Origination
Verify that the back-end returns records with the correct Notes when searching in the Customers page log in Origination

Verifique se a busca por UserID no log das configurações do Merchant em Origination exibe apenas registros com o UserID correspondente
Verify that searching by UserID in the Merchant settings log in Origination displays only matching UserID records

Verifique se a busca por Notas no log das configurações do Merchant em Origination exibe apenas registros com as Notas correspondentes
Verify that searching by Notes in the Merchant settings log in Origination displays only matching Notes records

Verifique se a busca por UserID no log da página de Servicing exibe apenas registros correspondentes
Verify that searching by UserID in the Servicing page log displays only matching records

Verifique se a busca por Notas no log da página de Servicing exibe apenas registros correspondentes
Verify that searching by Notes in the Servicing page log displays only matching records

Verifique se a busca por UserID no log da página de Configuração de Usuário em AMS exibe apenas registros com o UserID correspondente
Verify that searching by UserID in the User Configuration page log in AMS displays only matching UserID records

Verifique se a busca por Notas no log da página de Configuração de Usuário em AMS exibe apenas registros com as Notas correspondentes
Verify that searching by Notes in the User Configuration page log in AMS displays only matching Notes records

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa1

| LeadPk/AccountPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 8373 | Progress Mobility | Verify that searching by UserID in the Customers page log in Origination displays only matching UserID records |  | PASS |
| 8373 | Progress Mobility | Verify that searching by Notes in the Customers page log in Origination displays only matching Notes records |  | PASS |
| 8372 | Progress Mobility | Verify that the back-end returns records with the correct Notes when searching in the Customers page log in Origination |  | PASS |
| 8372 | Progress Mobility | Verify that the back-end returns records with the correct Notes when searching in the Customers page log in Origination |  | PASS |
| 8372 | Progress Mobility | Verify that searching by UserID in the Merchant settings log in Origination displays only matching UserID records |  | PASS |
| 8372 | Progress Mobility | Verify that searching by Notes in the Merchant settings log in Origination displays only matching Notes records |  | PASS |
| 3687 | Progress Mobility | Verify that searching by UserID in the Servicing page log displays only matching records |  | PASS |
| 3687 | Progress Mobility | Verify that searching by UserID in the Servicing page log displays only matching records |  | PASS |
| -- | -- | Verify that searching by UserID in the User Configuration page log in AMS displays only matching UserID records |  | PASS |
| -- | -- | Verify that searching by Notes in the User Configuration page log in AMS displays only matching Notes records |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa1

------------------------------------------------------------------------------------------------------------------------------------------------------------------

stg

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verifique se a busca por UserID no log da página de Customers em Origination exibe apenas registros com o UserID correspondente
Verify that searching by UserID in the Customers page log in Origination displays only matching UserID records

Verifique se a busca por Notas no log da página de Customers em Origination exibe apenas registros com as Notas correspondentes
Verify that searching by Notes in the Customers page log in Origination displays only matching Notes records

Verifique se o back-end retorna registros com o UserID correto ao buscar no log da página de Customers em Origination
Verify that the back-end returns records with the correct UserID when searching in the Customers page log in Origination

Verifique se o back-end retorna registros com as Notas corretas ao buscar no log da página de Customers em Origination
Verify that the back-end returns records with the correct Notes when searching in the Customers page log in Origination

Verifique se a busca por UserID no log das configurações do Merchant em Origination exibe apenas registros com o UserID correspondente
Verify that searching by UserID in the Merchant settings log in Origination displays only matching UserID records

Verifique se a busca por Notas no log das configurações do Merchant em Origination exibe apenas registros com as Notas correspondentes
Verify that searching by Notes in the Merchant settings log in Origination displays only matching Notes records

Verifique se a busca por UserID no log da página de Servicing exibe apenas registros correspondentes
Verify that searching by UserID in the Servicing page log displays only matching records

Verifique se a busca por Notas no log da página de Servicing exibe apenas registros correspondentes
Verify that searching by Notes in the Servicing page log displays only matching records

Verifique se a busca por UserID no log da página de Configuração de Usuário em AMS exibe apenas registros com o UserID correspondente
Verify that searching by UserID in the User Configuration page log in AMS displays only matching UserID records

Verifique se a busca por Notas no log da página de Configuração de Usuário em AMS exibe apenas registros com as Notas correspondentes
Verify that searching by Notes in the User Configuration page log in AMS displays only matching Notes records

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in stg

| Test Case | Test Data | Status |
| --------- | --------- | ------ |
| Verify that searching by UserID in the Customers page log in Origination displays only matching UserID records |  | PASS |
| Verify that searching by Notes in the Customers page log in Origination displays only matching Notes records |  | PASS |
| Verify that the back-end returns records with the correct UserID when searching in the Customers page log in Origination |  | PASS |
| Verify that the back-end returns records with the correct Notes when searching in the Customers page log in Origination |  | PASS |
| Verify that searching by UserID in the Merchant settings log in Origination displays only matching UserID records |  | PASS |
| Verify that searching by Notes in the Merchant settings log in Origination displays only matching Notes records |  | PASS |
| Verify that searching by UserID in the Servicing page log displays only matching records |  | PASS |
| Verify that searching by Notes in the Servicing page log displays only matching records |  | PASS |
| Verify that searching by UserID in the User Configuration page log in AMS displays only matching UserID records |  | PASS |
| Verify that searching by Notes in the User Configuration page log in AMS displays only matching Notes records |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in stg

------------------------------------------------------------------------------------------------------------------------------------------------------------------
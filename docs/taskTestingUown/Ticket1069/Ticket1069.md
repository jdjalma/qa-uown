------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

✅ Requisitos Extraídos
Requisitos Funcionais (RF)
RF01: O campo de filtro Username deve estar presente na seção de filtros da página Merchant Modification History.
RF02: O usuário deve conseguir buscar registros informando parcial ou totalmente o nome do usuário (ILIKE com %).
RF03: A tabela de resultados deve exibir a coluna Username com os dados de quem realizou a alteração.
RF04: A ordenação dos registros deve manter a lógica atual (por timestamp), sem impacto pela adição do campo.
RF05: A busca pelo campo Username deve funcionar em conjunto com todos os demais filtros já existentes.
RF06: A nova coluna Username deve estar visível, alinhada e responsiva como as demais colunas.

Requisitos Não-Funcionais (RNF)
RNF01: O sistema deve ser responsivo mesmo com a nova coluna.
RNF02: A performance da busca não deve ser impactada negativamente pela adição do filtro.
RNF03: A nomenclatura do campo deve ser consistente entre frontend, backend e banco de dados (userName).
RNF04: O campo deve suportar rolagem (overflow) visual conforme configuração de valueContainer

-----

✅ Mapeamento Cenário x Requisito
| Cenário                                                                    | Requisitos Cobertos |
| -------------------------------------------------------------------------- | ------------------- |
| Display Username filter in filter section                                  | RF01                |
| Display Username column in result table                                    | RF03, RF06          |
| Search by full username                                                    | RF02, RF03          |
| Search by partial username                                                 | RF02, RF03          |
| Search with special characters in username                                 | RF02                |
| Search with empty username field                                           | RF02                |
| Search with whitespace-only in username                                    | RF02                |
| Use Username filter in combination with Merchant Name                      | RF02, RF05          |
| Use Username filter in combination with Program Name and Location          | RF02, RF05          |
| Ensure column alignment and responsiveness with Username column            | RF06, RNF01, RNF03  |
| Username field should allow vertical scroll when multiple entries selected | RNF04               |

-----

Funcionalidade: Histórico de Modificações de Comerciante - Filtro e Coluna de Nome de Usuário

  Contexto:
    Dado que estou na página "Histórico de Modificações de Comerciante" no Portal Origination

  Cenário: Exibir filtro de Nome de Usuário na seção de filtros
    Então devo ver um campo de filtro com o rótulo "Nome de Usuário"

  Cenário: Exibir a coluna de Nome de Usuário na tabela de resultados
    Quando eu realizar uma busca
    Então a tabela deve incluir uma coluna com o rótulo "Nome de Usuário"

  Cenário: Buscar por nome de usuário completo
    Dado que eu preencha o filtro "Nome de Usuário" com "john.doe"
    Quando eu realizar uma busca
    Então todas as linhas devem conter "john.doe" na coluna "Nome de Usuário"

  Cenário: Buscar por nome de usuário parcial
    Dado que eu preencha o filtro "Nome de Usuário" com "john"
    Quando eu realizar uma busca
    Então todas as linhas devem conter nomes de usuário que incluam "john"

  Cenário: Buscar com caracteres especiais no nome de usuário
    Dado que eu preencha o filtro "Nome de Usuário" com "@user.test_123"
    Quando eu realizar uma busca
    Então os resultados devem corresponder a nomes de usuário que contenham "@user.test_123"

  Cenário: Buscar com campo de nome de usuário vazio
    Dado que eu deixe o filtro "Nome de Usuário" em branco
    Quando eu realizar uma busca
    Então os resultados não devem ser filtrados por nome de usuário

  Cenário: Buscar com apenas espaços em branco no nome de usuário
    Dado que eu preencha o filtro "Nome de Usuário" com "     "
    Quando eu realizar uma busca
    Então o sistema deve tratar como entrada vazia e retornar os resultados sem filtro

  Cenário: Usar filtro de Nome de Usuário em conjunto com Merchant Ref Code
    Dado que eu preencha o filtro "Nome de Usuário" com "john"
    E preencha o filtro "Merchant Ref Code" com "KS2935"
    Quando eu realizar uma busca
    Então os resultados devem corresponder a ambos os filtros

  Cenário: Usar filtro de Nome de Usuário em conjunto com Merchant
    Dado que eu preencha o filtro "Nome de Usuário" com "ana"
    E preencha o filtro "Merchant" com "PromoPlus"
    Quando eu realizar uma busca
    Então os resultados devem corresponder a todos os filtros combinados

  Cenário: Garantir alinhamento e responsividade da coluna Nome de Usuário
    Quando eu realizar uma busca
    Então a coluna "Nome de Usuário" deve estar alinhada com as demais colunas
    E deve ser responsiva em diferentes tamanhos de tela

-----







## Funcionalidade: Histórico de Modificações de Comerciante - Filtro e Coluna de Nome de Usuário

### Contexto:
Dado que estou na página "Histórico de Modificações de Comerciante" no Portal Origination

### Cenário: Exibir filtro e coluna de Nome de Usuário
Então devo ver um campo de filtro com o rótulo "Nome de Usuário"  
E a tabela deve incluir uma coluna com o rótulo "Nome de Usuário"

### Cenário: Buscar por nome de usuário completo
Dado que eu preencha o filtro "Nome de Usuário" com "john.doe"  
Quando eu realizar uma busca  
Então todas as linhas devem conter "john.doe" na coluna "Nome de Usuário"

### Cenário: Buscar por nome de usuário parcial
Dado que eu preencha o filtro "Nome de Usuário" com "john"  
Quando eu realizar uma busca  
Então todas as linhas devem conter nomes de usuário que incluam "john"

### Cenário: Buscar com caracteres especiais no nome de usuário
Dado que eu preencha o filtro "Nome de Usuário" com "@user.test_123"  
Quando eu realizar uma busca  
Então os resultados devem corresponder a nomes de usuário que contenham "@user.test_123"

### Cenário: Buscar com campo de nome de usuário vazio ou com espaços
Dado que eu deixe o filtro "Nome de Usuário" em branco ou com apenas espaços  
Quando eu realizar uma busca  
Então os resultados não devem ser filtrados por nome de usuário

### Cenário: Usar filtro de Nome de Usuário em conjunto com Merchant Ref Code
Dado que eu preencha o filtro "Nome de Usuário" com "john"  
E preencha o filtro "Merchant Ref Code" com "KS2935"  
Quando eu realizar uma busca  
Então os resultados devem corresponder a ambos os filtros

### Cenário: Usar filtro de Nome de Usuário em conjunto com Merchant
Dado que eu preencha o filtro "Nome de Usuário" com "ana"  
E preencha o filtro "Merchant" com "PromoPlus"  
Quando eu realizar uma busca  
Então os resultados devem corresponder a todos os filtros combinados

### Cenário: Garantir alinhamento e responsividade da coluna Nome de Usuário
Quando eu realizar uma busca  
Então a coluna "Nome de Usuário" deve estar alinhada com as demais colunas  
E deve ser responsiva em diferentes tamanhos de tela

### Cenário: Persistência após realizar busca
Dado que eu preencha o filtro "Nome de Usuário" com "lucas"  
Quando eu realizar uma busca  
Então o valor "lucas" deve permanecer preenchido no campo "Nome de Usuário"

### Cenário: Persistência após sair e retornar à página
Dado que eu preencha o filtro "Nome de Usuário" com "maria"  
E eu saia da página e retorne posteriormente  
Então o filtro "Nome de Usuário" deve continuar preenchido com "maria"



### Background:
Given I am on the "Merchant Modification History" page in the Origination Portal

### Scenario: Display Username Filter and Column
Then I should see a filter field labeled "Username"  
And the table should include a column labeled "Username"

### Scenario: Search by Full Username
Given I fill in the "Username" filter with "john.doe"  
When I perform a search  
Then all rows should contain "john.doe" in the "Username" column

### Scenario: Search by Partial Username
Given I fill in the "Username" filter with "john"  
When I perform a search  
Then all rows should contain usernames that include "john"

### Scenario: Use Username Filter with Merchant Ref Code
Given I fill in the "Username" filter with "john"  
And fill in the "Merchant Ref Code" filter with "KS2935"  
When I perform a search  
Then results should match both filters

### Scenario: Use Username Filter with Merchant
Given I fill in the "Username" filter with "ana"  
And fill in the "Merchant" filter with "PromoPlus"  
When I perform a search  
Then results should match all combined filters

### Scenario: Column Alignment and Responsiveness
When I perform a search  
Then the "Username" column should be aligned with the other columns  
And it should be responsive across different screen sizes

### Scenario: Filter Persistence After Search
Given I fill in the "Username" filter with "lucas"  
When I perform a search  
Then the value "lucas" should remain filled in the "Username" field

### Scenario: Filter Persistence After Leaving and Returning to the Page
Given I fill in the "Username" filter with "maria"  
And I leave the page and return later  
Then the "Username" filter should still be filled with "maria"

-----

> ## Tests in qa1
> ```gherkin
> Given I am on the "Merchant Modification History" page in the Origination Portal
> 
> ### Scenario: Display Username Filter and Column
> Then I should see a filter field labeled "Username"  
> And the table should include a column labeled "Username"
> | ✅ PASS |
> 
> ### Scenario: Search by Full Username
> Given I fill in the "Username" filter with "Xpto.xpto"  
> When I perform a search  
> Then all rows should contain "Xpto.xpto" in the "Username" column
> | ✅ PASS |
>
> ### Scenario: Search by Partial Username
> Given I fill in the "Username" filter with "Xpto"  
> When I perform a search  
> Then all rows should contain usernames that include "Xpto"
> | ✅ PASS |
> 
> ### Scenario: Use Username Filter with Merchant Ref Code
> Given I fill in the "Username" filter with "Xpto"  
> And fill in the "Merchant Ref Code" filter with "KS2935"  
> When I perform a search  
> Then results should match both filters
> | ✅ PASS |
> 
> ### Scenario: Use Username Filter with Merchant
> Given I fill in the "Username" filter with "Xpto"  
> And fill in the "Merchant" filter with "PromoPlus"  
> When I perform a search  
> Then results should match all combined filters
> | ✅ PASS |
> 
> ### Scenario: Column Alignment and Responsiveness
> When I perform a search  
> Then the "Username" column should be aligned with the other columns  
> And it should be responsive across different screen sizes
> | ✅ PASS |
> 
> ### Scenario: Filter Persistence After Search
> Given I fill in the "Username" filter with "Xpto"  
> When I perform a search  
> Then the value "Xpto" should remain filled in the "Username" field
> | ✅ PASS |
> 
> ### Scenario: Filter Persistence After Leaving and Returning to the Page
> Given I fill in the "Username" filter with "Xpto"  
> And I leave the page and return later  
> Then the "Username" filter should still be filled with "Xpto"
> ```

![1069-qa1-origination-OK-LeaseTornadoFundedVisualizandoModificacaoMerchantModificationHistory-_1_](/uploads/40ecd2f9fbd93c59faff4e0715ea2307/1069-qa1-origination-OK-LeaseTornadoFundedVisualizandoModificacaoMerchantModificationHistory-_1_.png){width=1442 height=302}
![1069-qa1-origination-OK-LeaseTornadoFundedVisualizandoModificacaoMerchantModificationHistory-_2_](/uploads/911c2be19d4bd9e427a0f6bf8cd3879f/1069-qa1-origination-OK-LeaseTornadoFundedVisualizandoModificacaoMerchantModificationHistory-_2_.png){width=1334 height=78}

![1069-qa1-origination-MobileView__1_](/uploads/77b30aa2cd85a86b4add9402e67cbfa8/1069-qa1-origination-MobileView__1_.jpg)![1069-qa1-origination-MobileView__2_](/uploads/aeb61248bfddcd5f5035ec2cfa5bf899/1069-qa1-origination-MobileView__2_.jpg)![1069-qa1-origination-MobileView__3_](/uploads/74a81248fc4d9aa7ffa151cf6781b300/1069-qa1-origination-MobileView__3_.jpg)

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa1


> ## Tests in stg
> ```gherkin
> Given I am on the "Merchant Modification History" page in the Origination Portal
> 
> ### Scenario: Display Username Filter and Column
> Then I should see a filter field labeled "Username"  
> And the table should include a column labeled "Username"
> | PASS |
> 
> ### Scenario: Search by Full Username
> Given I fill in the "Username" filter with "Xpto.xpto"  
> When I perform a search  
> Then all rows should contain "Xpto.xpto" in the "Username" column
> | PASS |
>
> ### Scenario: Search by Partial Username
> Given I fill in the "Username" filter with "Xpto"  
> When I perform a search  
> Then all rows should contain usernames that include "Xpto"
> | PASS |
> 
> ### Scenario: Use Username Filter with Merchant Ref Code
> Given I fill in the "Username" filter with "Xpto"  
> And fill in the "Merchant Ref Code" filter with "KS2935"  
> When I perform a search  
> Then results should match both filters
> | PASS |
> 
> ### Scenario: Use Username Filter with Merchant
> Given I fill in the "Username" filter with "Xpto"  
> And fill in the "Merchant" filter with "PromoPlus"  
> When I perform a search  
> Then results should match all combined filters
> | PASS |
> 
> ### Scenario: Column Alignment and Responsiveness
> When I perform a search  
> Then the "Username" column should be aligned with the other columns  
> And it should be responsive across different screen sizes
> | PASS |
> 
> ### Scenario: Filter Persistence After Search
> Given I fill in the "Username" filter with "Xpto"  
> When I perform a search  
> Then the value "Xpto" should remain filled in the "Username" field
> | PASS |
> 
> ### Scenario: Filter Persistence After Leaving and Returning to the Page
> Given I fill in the "Username" filter with "Xpto"  
> And I leave the page and return later  
> Then the "Username" filter should still be filled with "Xpto"
> ```


![1069-stg-mobile-OK-_1_](/uploads/9ddf676f12d3f11412b621c5bee9f35e/1069-stg-mobile-OK-_1_.jpg)
![1069-stg-mobile-OK-_2_](/uploads/41fefc928cdc56e8e58f25b064ee9ab9/1069-stg-mobile-OK-_2_.jpg)
![1069-stg-desktop-OK-_1_](/uploads/b93a2ada644563f12047ba69434bf4c6/1069-stg-desktop-OK-_1_.png){width=1438 height=737}
![1069-stg-desktop-OK-_2_](/uploads/558fb0088efb7be2293cf120784fd731/1069-stg-desktop-OK-_2_.png){width=1438 height=737}

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in stg
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
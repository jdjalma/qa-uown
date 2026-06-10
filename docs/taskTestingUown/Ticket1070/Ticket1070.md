---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1070

## UOWN | Origination | CSV Download/Email in Funding Queue only includes visible rows despite “Select All” checkbox

**Status**: Open  
**Created**: 5 days ago by Yuri Araujo  
**Type**: BUG

### Problem
When accessing the **FUNDING** page in the **Origination Portal**, filtering a search and using the “Select All” checkbox, the system appears to select all matching results. However, when clicking on **Download CSV** or **Email CSV**, it only downloads/emails the rows currently visible on the page (i.e., the current view), instead of the entire filtered dataset.

### Expected Behavior
When the “Select All” checkbox is checked — indicating all filtered results — the **CSV Download** and **Email** options should include **all items** from the filtered search, not just the visible ones on the screen.

### Solution
Update the functionality so that when "Select All" is used, the actions (download/email) operate on the entire result set.

### QA
After the fix is deployed:
- Apply a filter on the Funding page.
- Click the “Select All” checkbox.
- Click Download CSV or Email CSV.
- Validate that **all filtered items** are included in the file/email, even if they are not visible on screen.


-----

## UOWN | Origination | Download/Email CSV na fila de Funding inclui apenas as linhas visíveis mesmo com o “Selecionar Todos” marcado

**Status**: Aberto  
**Criado em**: há 5 dias por Yuri Araujo  
**Tipo**: BUG

### Problema
Ao acessar a página **FUNDING** no **Portal de Originação**, aplicar um filtro e marcar a caixa de seleção “Selecionar Todos”, o sistema aparenta selecionar todos os resultados da busca. No entanto, ao clicar em **Download CSV** ou **Email CSV**, apenas as linhas visíveis na tela (visualização atual) são exportadas/enviadas.

### Comportamento Esperado
Quando a caixa “Selecionar Todos” estiver marcada — indicando todos os resultados filtrados — as opções de **Download CSV** e **Email** devem incluir **todos os itens** da busca filtrada, não apenas os visíveis na tela.

### Solução
Corrigir a funcionalidade para que, ao usar "Selecionar Todos", as ações (download/email) considerem todo o conjunto de resultados filtrados.

### QA
Após a correção:
- Aplique um filtro na página de Funding.
- Marque a caixa de seleção “Selecionar Todos”.
- Clique em Download CSV ou Email CSV.
- Verifique se **todos os itens filtrados** estão incluídos no arquivo/email, mesmo que não estejam visíveis na tela.

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

| Merchant | Test Case | Test Data | Status | Observacao |
| -------- | --------- | --------- | ------ | ------ |
| --        | Verifique que apenas os leases com o status selecionado são baixados ao marcar "Selecionar Todos". | Status = Approved | PASS |  |
| Progress Mobility, WeGetFinancing and Daniel's Jewelers        | Verifique que apenas os leases do merchant filtrado são baixados ao marcar "Selecionar Todos" e clicar em "Download CSV". | Merchant = UOWN Leasing | PASS |  |
| --        | Verifique que os leases dentro do intervalo de datas aplicado no filtro são baixados ao marcar "Selecionar Todos". | Data = 01/01/2024 a 31/12/2024 | PASS |  |
| --        | Verifique que o arquivo enviado por email contém todos os leases filtrados, inclusive os que não estão visíveis na tela. | Filtro qualquer + Email CSV | PASS | Email ficou pendente de disparo, será verificado em outro ambiente |
| --        | Verifique que ao aplicar múltiplos filtros simultâneos, todos os leases baixados correspondem aos critérios combinados. | Status + Data + Merchant | PASS |  |

-----
tests in qa1

| Merchant | Test Case | Test Data | Status | Observation |
| -------- | --------- | --------- | ------ | ----------- |
| --       | Verify that only leases with the selected status are downloaded when "Select All" is checked. | | PASS |  |
| Progress Mobility, WeGetFinancing and Daniel's Jewelers | Verify that only leases from the filtered merchant are downloaded when "Select All" is checked and "Download CSV" is clicked. |  | PASS |  |
| --       | Verify that leases within the date range applied in the filter are downloaded when "Select All" is checked. |  | PASS |  |
| --       | Verify that the file sent by email contains all filtered leases, including those not visible on screen. | | PASS | Email was not triggered, will be verified in another environment |
| --       | Verify that when applying multiple filters simultaneously, all downloaded leases match the combined criteria. | | PASS |  |

-----

tests in qa1

| Merchant | Test Case | Test Data | Status | Observation |
| -------- | --------- | --------- | ------ | ----------- |
| --       | Verify that only leases with the selected status are downloaded when "Select All" is checked. | ![1070-qa1-OK-StatusFundingFunded-_1_](/uploads/4c8021cc2121224134d3e8dd2d0ddd34/1070-qa1-OK-StatusFundingFunded-_1_.png){width=1041 height=735}![1070-qa1-OK-StatusFundingFunded-_2_](/uploads/b516cc4eb477a5d2e5db5cc6796bd6cf/1070-qa1-OK-StatusFundingFunded-_2_.png){width=1099 height=420}![1070-qa1-OK-StatusFundingFunded-_3_](/uploads/4330e953633c5a50951b22425e9e297c/1070-qa1-OK-StatusFundingFunded-_3_.png){width=1041 height=735}![1070-qa1-OK-StatusFundingFunded-_4_](/uploads/44921cf976860427dbd75971676dab8f/1070-qa1-OK-StatusFundingFunded-_4_.png){width=1091 height=399} | PASS | -- |
| Progress Mobility, WeGetFinancing and Daniel's Jewelers | Verify that only leases from the filtered merchant are downloaded when "Select All" is checked and "Download CSV" is clicked. | ![1070-qa1-OK-Merchant-_1_](/uploads/5593a99add8c73348eb74635e45b83d5/1070-qa1-OK-Merchant-_1_.png){width=1436 height=740}![1070-qa1-OK-Merchant-_2_](/uploads/f08d1b89137fdbc5273c1678b42e6a4e/1070-qa1-OK-Merchant-_2_.png){width=1094 height=39}![1070-qa1-OK-Merchant-_3_](/uploads/5a48ebdcd4959b3d08c3aa8130203915/1070-qa1-OK-Merchant-_3_.png){width=1041 height=739}![1070-qa1-OK-Merchant-_4_](/uploads/93e5bff7946f1bd787df7c44a5f5af57/1070-qa1-OK-Merchant-_4_.png){width=1097 height=69}![1070-qa1-OK-Merchant-_5_](/uploads/229c199c008b23cae0b66b86a832e9db/1070-qa1-OK-Merchant-_5_.png){width=1039 height=740}![1070-qa1-OK-Merchant-_6_](/uploads/19ecc1d8e59002bf791209b19ad5c4b5/1070-qa1-OK-Merchant-_6_.png){width=1098 height=345}![1070-qa1-OK-Merchant-_7_](/uploads/6c2f43babc26ee13d7aa0c34c647aead/1070-qa1-OK-Merchant-_7_.png){width=1437 height=741}![1070-qa1-OK-Merchant-_8_](/uploads/c7ee0c9e814ccb93ced23753ed3ce947/1070-qa1-OK-Merchant-_8_.png){width=1437 height=741}![1070-qa1-OK-Merchant-_9_](/uploads/9254e98149f38029613ec61e41a7c770/1070-qa1-OK-Merchant-_9_.png){width=1437 height=741} | PASS |  -- |
| --       | Verify that leases within the date range applied in the filter are downloaded when "Select All" is checked. | ![1070-qa1-OK-Data-_1_](/uploads/595ae4a46b07aec0b09a445fe64c982e/1070-qa1-OK-Data-_1_.png){width=1062 height=738}![1070-qa1-OK-Data-_2_](/uploads/399aaee66cf6c465117b241556e9ed75/1070-qa1-OK-Data-_2_.png){width=1106 height=144}![1070-qa1-OK-Data-_3_](/uploads/4aace67d904c4a1f297888366782f744/1070-qa1-OK-Data-_3_.png){width=1065 height=732}![1070-qa1-OK-Data-_4_](/uploads/bb95875f4fc52bc9424164ed27842052/1070-qa1-OK-Data-_4_.png){width=1107 height=196} | PASS |  |
| --       | Verify that the file sent by email contains all filtered leases, including those not visible on screen. | -- | PASS | Email was not triggered, will be verified in another environment |
| --       | Verify that when applying multiple filters simultaneously, all downloaded leases match the combined criteria. | ![1070-qa1-OK-MultiplosFiltros-_1_](/uploads/9e4128f7a1d0d15cb487a7cec0ba657c/1070-qa1-OK-MultiplosFiltros-_1_.png){width=1436 height=747}![1070-qa1-OK-MultiplosFiltros-_2_](/uploads/ab815c0410e778c33623a0a5970c35f2/1070-qa1-OK-MultiplosFiltros-_2_.png){width=1101 height=204}![1070-qa1-OK-MultiplosFiltros-_3_](/uploads/e0b176a17535eebeaa21c0e00de38ab5/1070-qa1-OK-MultiplosFiltros-_3_.png){width=1437 height=735}![1070-qa1-OK-MultiplosFiltros-_4_](/uploads/39ae179e3fa5c48805f0d639db09b29a/1070-qa1-OK-MultiplosFiltros-_4_.png){width=1094 height=446}![1070-qa1-OK-MultiplosFiltros-_5_](/uploads/21e00610ba117b540bb29e14a4f745b9/1070-qa1-OK-MultiplosFiltros-_5_.png){width=1094 height=446}![1070-qa1-OK-MultiplosFiltros-_6_](/uploads/56bede1160e4dbbb22502ce9297b0af9/1070-qa1-OK-MultiplosFiltros-_6_.png){width=1439 height=743}![1070-qa1-OK-MultiplosFiltros-_7_](/uploads/0c22fb843dd43a0c4300562302a88d42/1070-qa1-OK-MultiplosFiltros-_7_.png){width=1094 height=446}![1070-qa1-OK-MultiplosFiltros-_8_](/uploads/47139eb1f6503be2845ee14a01532358/1070-qa1-OK-MultiplosFiltros-_8_.png){width=1094 height=446}![1070-qa1-OK-MultiplosFiltros-_9_](/uploads/d291b9ced59de331b5fd0dce171b3e6e/1070-qa1-OK-MultiplosFiltros-_9_.png){width=1440 height=744}![1070-qa1-OK-MultiplosFiltros-_10_](/uploads/b72164824b8c0216b94c6c6d584bbb86/1070-qa1-OK-MultiplosFiltros-_10_.png){width=1440 height=744}![1070-qa1-OK-MultiplosFiltros-_11_](/uploads/0d5d6be8fb30f40453ab66d805720e58/1070-qa1-OK-MultiplosFiltros-_11_.png){width=1101 height=411} | PASS | -- |

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa1

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*VERIFICAR EM STG*
1070
hover com label select all



tests in stg

Verify that only leases with the selected status are downloaded when "Select All" is checked.
Verify that only leases from the filtered merchant are downloaded when "Select All" is checked and "Download 
Verify that leases within the date range applied in the filter are downloaded when "Select All" is checked. 
Verify that the file sent by email contains all filtered leases, including those not visible on screen. 
Verify that when applying multiple filters simultaneously, all downloaded leases match the combined criteria.

-----

Funcionalidade: Validação do download e envio de leases com base nos filtros aplicados e seleção total

  Cenário: Verificar leases com status selecionado
    Dado que estou na página Funding com um filtro de status aplicado
    Quando marco o checkbox "Selecionar Todos" e clico em "Download CSV"
    Então Verify that only leases with the selected status are downloaded when "Select All" is checked.

  Cenário: Verificar leases do merchant filtrado
    Dado que estou na página Funding com um filtro de merchant aplicado
    Quando marco o checkbox "Selecionar Todos" e clico em "Download CSV"
    Então Verify that only leases from the filtered merchant are downloaded when "Select All" is checked and "Download 

  Cenário: Verificar leases dentro do intervalo de datas
    Dado que estou na página Funding com um filtro de intervalo de datas aplicado
    Quando marco o checkbox "Selecionar Todos" e clico em "Download CSV"
    Então Verify that leases within the date range applied in the filter are downloaded when "Select All" is checked.

  Cenário: Verificar conteúdo do email com todos os leases filtrados
    Dado que estou na página Funding com filtros aplicados
    Quando marco o checkbox "Selecionar Todos" e clico em "Email CSV"
    Então Verify that the file sent by email contains all filtered leases, including those not visible on screen.

  Cenário: Verificar múltiplos filtros aplicados simultaneamente
    Dado que estou na página Funding com múltiplos filtros aplicados (status, data e merchant)
    Quando marco o checkbox "Selecionar Todos" e clico em "Download CSV"
    Então Verify that when applying multiple filters simultaneously, all downloaded leases match the combined criteria.

-----


> ## Tests in stg
>
> ```gherkin
> ### Feature: Validation of lease downloads and email based on applied filters and select all action
>
> ### Scenario: Verify leases with selected status
> Given I am on the Funding page with a status filter applied
> When I check the "Select All" checkbox and click "Download CSV"
> Then Verify that only leases with the selected status are downloaded when "Select All" is checked.
> | PASS |
> ```
>
> ```gherkin
> ### Scenario: Verify leases from the filtered merchant
> Given I am on the Funding page with a merchant filter applied
> When I check the "Select All" checkbox and click "Download CSV"
> Then Verify that only leases from the filtered merchant are downloaded when "Select All" is checked and "Download"
> | PASS |
> ```
>
> ```gherkin
> ### Scenario: Verify email file contains all filtered leases
> Given I am on the Funding page with filters applied
> When I check the "Select All" checkbox and click "Email CSV"
> Then Verify that the file sent by email contains all filtered leases, including those not visible on screen.
> | PASS |
> ```
>
> ```gherkin
> ### Scenario: Verify multiple filters applied simultaneously
> Given I am on the Funding page with multiple filters applied (status, date, and merchant)
> When I check the "Select All" checkbox and click "Download CSV"
> Then Verify that when applying multiple filters simultaneously, all downloaded leases match the combined criteria.
> | PASS |
> ```
>


---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
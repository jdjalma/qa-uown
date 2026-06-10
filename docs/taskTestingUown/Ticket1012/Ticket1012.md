------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1012

UOWN | Origination | Refactoring to improve loading performance on the Customers page

Synopsis
Currently, the Customers page loads all components and queries simultaneously, resulting in longer load times than expected. A code refactoring is necessary for both Origination and Servicing.

Business Objective
With this refactoring, we aim to improve page loading performance, ensuring that the most important parts load first.

Feature Request | Business Requirements
Refactor the code to enhance loading performance.  
Load endpoints separately so that the initial (and most important) part of the page loads first.
Ensure that the user’s waiting experience is minimized as much as possible.

New requirement, ensure NEW leads (that have very little information) doesn't logout the user due to 404 because of missing data

Test instructions
The modifications have been made only to the customer page in the origination portal.
The code used to load the page data was modified, the tests must assert the following know scenários.
* All cards and the top yellow bar have data filled and they are displayed properly
* leads in the NEW status must be displayed properly
* Modals and interactions in the page still works

-----

UOWN | Origination | Refatoração para melhorar performance de carregamento na página de Clientes

Sinopse
Atualmente, a página de Clientes carrega todos os componentes e executa todas as queries simultaneamente, resultando em tempos de carregamento mais longos do que o esperado. É necessária uma refatoração de código nos módulos Origination e Servicing.

Objetivo de Negócio
Com esta refatoração, buscamos melhorar a performance de carregamento da página, garantindo que as partes mais importantes sejam exibidas primeiro.

Requisição de Funcionalidade | Requisitos de Negócio
Refatorar o código para otimizar a performance de carregamento.
Carregar endpoints separadamente, de modo que a parte inicial (e mais crítica) da página seja exibida primeiro.
Minimizar ao máximo o tempo de espera percebido pelo usuário.

Novo requisito
Garantir que leads NOVOS (com informações muito escassas) não desconectem o usuário devido a um erro 404 por falta de dados.

Instruções de Teste
As modificações foram feitas apenas na página de Clientes do portal de Origination. O código de carregamento dos dados da página foi alterado; os testes devem validar os seguintes cenários conhecidos:
Todos os cards e a barra amarela superior estão com dados preenchidos e são exibidos corretamente.
Leads com status NEW devem ser exibidos corretamente.
Modais e demais interações da página continuam funcionando como antes.

Verifique se o tempo de carregamento da página foi otimizado
Verify that the pages load time has been optimized

Verifique se ao realizar request funding a tela é carregada exbindo o load
Verify that when performing a funding request, the screen loads displaying the loading indicator

Verifique se os componentes mais relevantes são carregados primeiro
Verify that the most relevant components are loaded first


Tests in qa2

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| X | X | Verify that the pages load time has been optimized |  | PASS |
| X | X | Verify that when performing a funding request, the screen loads displaying the loading indicator |  | PASS |
| X | X | Verify that the most relevant components are loaded first |  | PASS |


Tests in qa2

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 12681 and 12683 | Progress Mobility | Verify that the pages load time has been optimized | ![qa2-1012-TempoCarregamento_1_](/uploads/63428f9ca4c2dd15716d792efa3c14af/qa2-1012-TempoCarregamento_1_.png){width=1437 height=743}![qa2-1012-TempoCarregamento_2_](/uploads/eac11024ee6307da4d71ffd50c4ce7b9/qa2-1012-TempoCarregamento_2_.png){width=1440 height=744}![qa2-1012-TempoCarregamento_3_](/uploads/55a91717d6b0aa79b11dba0fdf2f2cbf/qa2-1012-TempoCarregamento_3_.png){width=1437 height=744}![qa2-1012-TempoCarregamento_4_](/uploads/0836e69f8a7e0ea1d1dd9dd81bd552c9/qa2-1012-TempoCarregamento_4_.png){width=1437 height=744}![qa2-1012-TempoCarregamento_5_](/uploads/b5b0b5595075200dc108ea596f80a3b7/qa2-1012-TempoCarregamento_5_.png){width=1436 height=719}![qa2-1012-TempoCarregamento_6_](/uploads/4357eff4e7f59e9dfd86dde01dcbec2e/qa2-1012-TempoCarregamento_6_.png){width=1437 height=744}![qa2-1012-TempoCarregamento_7_](/uploads/bb6b97b837593c54f9079aebb6c94077/qa2-1012-TempoCarregamento_7_.png){width=1438 height=745}![qa2-1012-TempoCarregamento_8_](/uploads/e8065aa9949cc78c79674e8df2ca64bb/qa2-1012-TempoCarregamento_8_.png){width=1437 height=744}![qa2-1012-TempoCarregamento_9_](/uploads/2e01aa617337d6629e15cd212b67b74e/qa2-1012-TempoCarregamento_9_.png){width=1440 height=740}![qa2-1012-TempoCarregamento_10_](/uploads/106c62b6495a0261a1a4247bb23fa899/qa2-1012-TempoCarregamento_10_.png){width=1437 height=742}![qa2-1012-videoCarregamentoTelaConexao3G_1_](/uploads/2160089d223b2eed8c9cc11d9c1e8eb2/qa2-1012-videoCarregamentoTelaConexao3G_1_.mp4)![qa2-1012-videoCarregamentoTela_1_](/uploads/bd6bfc9603c12a1d9ccd0a77c5d024e5/qa2-1012-videoCarregamentoTela_1_.mp4) | PASS |
| 12715 | Progress Mobility | Verify that when performing a funding request, the screen loads displaying the loading indicator | ![qa2-1012-c2_1_](/uploads/0301be2897196530bff2700cd7522638/qa2-1012-c2_1_.png){width=1435 height=743}![qa2-1012-c2_2_](/uploads/e79829998bc6c782fa7cc77525ffa067/qa2-1012-c2_2_.png){width=1435 height=743}![qa2-1012-c2_3_](/uploads/a8b252d37cb4d8968e55c8a2234fc1d3/qa2-1012-c2_3_.png){width=1435 height=743} | PASS |
| 12681 | Progress Mobility | Verify that the most relevant components are loaded first | ![qa2-1012-PrioridadeCArregamento_1_](/uploads/70556d5e32e3130ae2624c6d6f113f1f/qa2-1012-PrioridadeCArregamento_1_.png){width=1437 height=744}![qa2-1012-PrioridadeCArregamento_2_](/uploads/09f140be26c7350cc471bdbee3d1d048/qa2-1012-PrioridadeCArregamento_2_.png){width=1438 height=744} | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa2

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in stg

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| -- | -- | Verify that the pages load time has been optimized |  | PASS |
| 23671 | Progress Mobility | Verify that when performing a funding request, the screen loads displaying the loading indicator |  | PASS |
| 23671 | Progress Mobility | Verify that the most relevant components are loaded first |  | PASS |


Tests in stg

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| -- | -- | Verify that the pages load time has been optimized | -- | PASS |
| 23671 | Progress Mobility | Verify that when performing a funding request, the screen loads displaying the loading indicator | ![stg-1012-c2_1_](/uploads/a7adf93afb3b33491be119f3d2776eb3/stg-1012-c2_1_.png){width=1438 height=743}![stg-1012-c2_2_](/uploads/908b0c17517fc5f17647e9429215e125/stg-1012-c2_2_.png){width=1438 height=743}![stg-1012-c2_3_](/uploads/fb65c16283cbd4e4baba5d10c96fea67/stg-1012-c2_3_.png){width=1436 height=741}![stg-1012-c2_4_](/uploads/d1fcbec4f94d510fa0c305c1f0155363/stg-1012-c2_4_.png){width=1436 height=741} | PASS |
| 23671 | Progress Mobility | Verify that the most relevant components are loaded first | ![stg-1012-c3_1_](/uploads/fe7408d1b9afc19925267c2bbe04133f/stg-1012-c3_1_.png){width=1437 height=744}![stg-1012-c3_2_](/uploads/162bfe93289f004ba0dd337aea6cecbd/stg-1012-c3_2_.png){width=1437 height=744}![stg-1012-c3_3_](/uploads/b7fe479cecef0a3ba8639695bd1b1237/stg-1012-c3_3_.png){width=1437 height=744} | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in stg

------------------------------------------------------------------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1013

------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Origitination | Switch the Search Panel to the left side on the Funding page to better user experience

Synopsis
Just like it was done on the Leads page, the search panel should be moved to the left side on the Funding page.

Business Objective
This layout change aims to enhance the user experience by making the interface clearer and more intuitive.

Feature Request | Business Requirements
1. The panel should be moved to the left side.
2. The components must be the same as those on the Leads page to maintain a standardized layout.
3. Ensure that the search button remains fixed and easily accessible, just like on the Leads page.

-----

UOWN | Origination | Mude o Painel de Pesquisa para o lado esquerdo na página de Financiamento para melhorar a experiência do usuário

Sinopse
Assim como foi feito na página de Leads, o painel de pesquisa deve ser movido para o lado esquerdo na página de Financiamento.

Objetivo de Negócio
Essa alteração de layout visa melhorar a experiência do usuário, tornando a interface mais clara e intuitiva.

Solicitação de Recurso | Requisitos de Negócio

O painel deve ser movido para o lado esquerdo.
Os componentes devem ser os mesmos da página de Leads para manter um layout padronizado.
Garanta que o botão de pesquisa permaneça fixo e facilmente acessível, assim como na página de Leads.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

1. Responsiveness Test on Funding Page

Objective: Ensure that the search panel with filters adapts properly to different screen sizes.
- Open the Funding Page in a desktop browser.
- Verify that the search panel is correctly positioned on the left side.
- Test clicking and interacting with filters on each screen size to confirm usability.
- Validate that the page layout does not break at any resolution.


2. Functionality Test on Another Page

Objective: Ensure that filters continue to function as expected.
- Navigate to the overview where filters are used.
- Verify that all filters are visible and positioned correctly.

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

filtros de busca:
data inicial e data final
search by status date
    Funding
    funded
    request refund
    refunded
    status
    invoice Type
        lease
        purchased
    client Type
    sales rep code
    merchant
    location
    2 day funding exception
    5 day funding exception
*criar cenários para os filtros de busca e cenários combinando esses filtros de busca, combinando no minimo 4 filtros simultaneamente. em todos os cenários analisar os resultados apresentados comparando com os filtros inseridos.

verificar se ao preencher um parametro e mudar a data o parametro preenchi não é limpo, validar todos os filtros

------------------------------------------------------------------------------------------------------------------------------------------------------------------

📋 Requisito da Tarefa
O painel de pesquisa da página de Financiamento deve ser reposicionado para o lado esquerdo, com os mesmos filtros e layout da página de Leads, 
mantendo o botão de pesquisa fixo e acessível.
Além disso, todos os filtros devem funcionar corretamente, ser combináveis e manter seu valor mesmo com mudança de datas.

🧪 Cenários de Teste

Scenario 1 – Verificar reposicionamento do painel de filtros para o lado esquerdo

Scenario: 1 - Verificar se o painel de filtros foi movido para o lado esquerdo da página de Financiamento
  Given que o usuário acessa a página de Financiamento
  When a página é carregada
  Then o painel de pesquisa deve estar posicionado no lado esquerdo da tela

🔍 Verifique se o painel de pesquisa aparece no lado esquerdo da página de Financiamento.
📝 Explicação: Garante o cumprimento do requisito visual.
✅ Resultado Esperado: O painel aparece no lado esquerdo, como na página de Leads.

-----

Scenario 2 – Verificar se o botão de pesquisa permanece fixo e visível

Scenario: 2 - Validar se o botão de pesquisa está fixo e acessível no painel esquerdo
  Given que o usuário rola a página de Financiamento
  When o painel lateral estiver parcialmente fora da tela
  Then o botão de pesquisa deve continuar fixo e visível

🔍 Verifique se o botão de pesquisa permanece acessível mesmo durante a rolagem.
📝 Explicação: Garante boa usabilidade.
✅ Resultado Esperado: Botão fixo no painel esquerdo.

-----

Scenario 3 – Validar responsividade do painel de pesquisa

Scenario: 3 - Testar o comportamento responsivo do painel em diferentes resoluções
  Given que o usuário abre a página de Financiamento em diferentes tamanhos de tela
  When o layout é ajustado automaticamente
  Then o painel deve permanecer funcional e sem quebra visual


🔍 Verifique se o painel de pesquisa se adapta corretamente em resoluções variadas.
📝 Explicação: Garante consistência visual e funcional em todos os dispositivos.
✅ Resultado Esperado: Layout estável e filtros acessíveis.

-----

Scenario 4 – Verificar funcionalidade de todos os filtros individualmente

Scenario Outline: 4 - Validar filtros de busca individuais na página de Financiamento
  Given que o usuário acessa o painel de filtros
  When aplica o filtro "<filtro>" com um valor válido
  Then os resultados apresentados devem refletir o filtro aplicado

Examples:
  | filtro                   |
  | data inicial             |
  | data final               |
  | status date              |
  | status                   |
  | invoice type             |
  | client type              |
  | sales rep code           |
  | merchant                 |
  | location                 |
  | 2 day funding exception  |
  | 5 day funding exception  |

📌 (Utilize este como base para repetir com cada filtro individual)
🔍 Verifique se cada filtro é aplicado corretamente e retorna resultados coerentes com os valores informados.
📝 Explicação: Esse cenário cobre a funcionalidade de cada filtro de forma isolada, garantindo que todos os filtros do painel de Financiamento estão implementados corretamente e retornam os dados esperados
✅ Resultado Esperado: Os resultados apresentados devem estar filtrados com base no valor definido naquele filtro específico.

-----

Scenario 5 – Testar combinação de 4 filtros simultaneamente

Scenario: 5 - Validar combinação de 4 filtros simultaneamente
  Given que o usuário acessa o painel de filtros
  When aplica os filtros "status", "invoice type", "merchant" e "sales rep code"
  Then os resultados devem respeitar todos os critérios combinados


🔍 Verifique se os resultados respeitam a combinação de múltiplos filtros.
📝 Explicação: Garante que a busca complexa seja precisa e eficiente.
✅ Resultado Esperado: Apenas registros que correspondem a todos os filtros são exibidos.

-----

Scenario 6 – Validar persistência dos filtros ao alterar datas

Scenario: 6 - Validar se os filtros não são limpos ao alterar o filtro de data
  Given que o usuário preenche qualquer filtro (ex: merchant ou status)
  When altera a data inicial ou final no painel de filtros
  Then os filtros preenchidos anteriormente devem permanecer ativos

🔍 Verifique se o preenchimento dos filtros permanece ao alterar o período de data.
📝 Explicação: Garante usabilidade e evita perda de contexto na filtragem.
✅ Resultado Esperado: Filtros anteriores permanecem preenchidos.

-----

🧾 Requisitos e Cobertura
| Requisito	                                    | Cenário(s) que cobre |
| Painel reposicionado para o lado esquerdo	    |          1           |
| Botão de pesquisa fixo e visível	            |          2           |
| Responsividade em diferentes resoluções	    |          3           |
| Todos os filtros funcionando	                |          4           |
| Combinação de múltiplos filtros	            |          5           |
| Manter valores dos filtros ao mudar a data	|          6           |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verifique se o botão de pesquisa permanece acessível durante a rolagem
Check if the search button remains accessible during scrolling

Confirme se o painel de pesquisa se adapta corretamente a diferentes resoluções
Verify if the search panel adapts correctly to various resolutions

Garanta que cada filtro seja aplicado corretamente e retorne resultados consistentes com os valores informados
Ensure each filter is applied correctly and returns results consistent with the provided values

Confirme que os resultados respeitam a combinação de múltiplos filtros
Confirm the results respect the combination of multiple filters

Verifique se a mensagem de obrigatoriedade de preenchimento do campo "status", ao tentar salvar sem preenchimento, não está posicionada sobre o rótulo da opção "Invoice Type".
Verify that the required field message for "status", when attempting to save without filling it, is not positioned over the label of the "Invoice Type" option.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa1

| Test Case | Test Data | Status |
| ------ | ------ | ------ |
| Check if the search button remains accessible during scrolling |  | PASS |
| Verify if the search panel adapts correctly to various resolutions |  | PASS |
| Ensure each filter is applied correctly and returns results consistent with the provided values |  | PASS |
| Confirm the results respect the combination of multiple filters |  | PASS |



Tests in qa1

| Test Case | Test Data | Status |
| ------ | ------ | ------ |
| Check if the search button remains accessible during scrolling | ![qa1-1013-c2_1_](/uploads/1260001aacdb48d40e5c8f467a4284f3/qa1-1013-c2_1_.png){width=1426 height=742}![qa1-1013-c2_2_](/uploads/78db5d89e9456c1effb2080c60f267f0/qa1-1013-c2_2_.png){width=1426 height=742} | PASS |
| Verify if the search panel adapts correctly to various resolutions | ![qa1-1013-c3_1_](/uploads/299da2d3ceb67b51511bc8934d099122/qa1-1013-c3_1_.png){width=1426 height=742}![qa1-1013-c3_2_](/uploads/2f44dd25f93e7d199b5b0eaa2347275d/qa1-1013-c3_2_.png){width=1426 height=742}![qa1-1013-c3_3_](/uploads/2aa053eb401398e1bed37a994dd88b4c/qa1-1013-c3_3_.png){width=598 height=450}![qa1-1013-c3_4_](/uploads/d16878e21d1497af9980e72e52723dc7/qa1-1013-c3_4_.png){width=598 height=450}![qa1-1013-c3_5_](/uploads/4aaf43605cfd908f139a89c5ba090bd8/qa1-1013-c3_5_.png){width=948 height=702}![qa1-1013-c3_6_](/uploads/c9c6aab7785e171d2c8b42000b6b9574/qa1-1013-c3_6_.png){width=395 height=710}![qa1-1013-c3_7_](/uploads/4679f82c0d98bceb3f74ef9bd61d9419/qa1-1013-c3_7_.png){width=395 height=565} | PASS |
| Ensure each filter is applied correctly and returns results consistent with the provided values | ![qa1-1013-c4_1_](/uploads/96a0b3f158d6ae355979e13872425a22/qa1-1013-c4_1_.png){width=1432 height=736}![qa1-1013-c4_2_](/uploads/93ef84663a3bf573276b4a1ea2f71433/qa1-1013-c4_2_.png){width=1432 height=736}![qa1-1013-c4_3_](/uploads/5021c6fb04866a2bd561e68662d188f5/qa1-1013-c4_3_.png){width=1432 height=736}![qa1-1013-c4_4_](/uploads/fd8aa509beca009a85af264d6dee66d5/qa1-1013-c4_4_.png){width=1432 height=736}![qa1-1013-c4_5_](/uploads/05d582d589a0a4d661ee8a078788e010/qa1-1013-c4_5_.png){width=1432 height=736}![qa1-1013-c4_6_](/uploads/12d6ce4196e0521fb369d563fa48cc0c/qa1-1013-c4_6_.png){width=1432 height=736}![qa1-1013-c4_7_](/uploads/94a75ef0974d12bc4c72e4fec54160ed/qa1-1013-c4_7_.png){width=1432 height=736}![qa1-1013-c4_8_](/uploads/73749fba6b023a5ef6182a8c0507061d/qa1-1013-c4_8_.png){width=1432 height=736}![qa1-1013-c4_9_](/uploads/22199024ed1a3ffb31087fe29536578b/qa1-1013-c4_9_.png){width=1432 height=736}![qa1-1013-c4_10_](/uploads/d435229d511591c1bcaa61dc967b25fc/qa1-1013-c4_10_.png){width=1432 height=736}![qa1-1013-c4_11_](/uploads/d2b0b9dee8b262d4151b93f9b7193421/qa1-1013-c4_11_.png){width=1432 height=736}![qa1-1013-c4_12_](/uploads/cf618436143a6498e5616c85525b0519/qa1-1013-c4_12_.png){width=1432 height=736}![qa1-1013-c4_13_](/uploads/a2f28f873cdb78297380186c1813d748/qa1-1013-c4_13_.png){width=1432 height=736} | PASS |
| Confirm the results respect the combination of multiple filters | ![qa1-1013-c5_1_](/uploads/09cd95074f131d0b48d34280d5b47a13/qa1-1013-c5_1_.png){width=1432 height=736}![qa1-1013-c5_2_](/uploads/88c94eeadeb14efaaeafb0a4b3b60eac/qa1-1013-c5_2_.png){width=1432 height=736}![qa1-1013-c5_3_](/uploads/9941d2ca08ab73630a7e068cba5a46ef/qa1-1013-c5_3_.png){width=1432 height=736}![qa1-1013-c5_4_](/uploads/0a4be44c1199ee90bae168ff165ce937/qa1-1013-c5_4_.png){width=1432 height=736}![qa1-1013-c5_5_](/uploads/8d3122023b6cdd08a78f637682dd1ce7/qa1-1013-c5_5_.png){width=1432 height=736}![qa1-1013-c5_6_](/uploads/11a36b8738f8c6140eee3cbf06f22b3b/qa1-1013-c5_6_.png){width=1432 height=736}![qa1-1013-c5_7_](/uploads/5e62ce9f9adc4f48381304053e9c4fd7/qa1-1013-c5_7_.png){width=1432 height=736}![qa1-1013-c5_8_](/uploads/2026a0550bc310dcc5ad3021501077f0/qa1-1013-c5_8_.png){width=1432 height=736} | PASS |
| Verify that the required field message for "status", when attempting to save without filling it, is not positioned over the label of the "Invoice Type" option |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa1

------------------------------------------------------------------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1021

------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Origintation | Set Offer Protection Plan TRUE as default when create a NEW MERCHANT

Synopsis
When accessing the MERCHANT screen and clicking the ADD A NEW MERCHANT button, a new registration begins. Some options are pre-selected as TRUE or FALSE by default.
Currently, the default value for the OFFER PROTECTION PLAN option is FALSE, and it should be changed to TRUE by default.

Feature Request | Business Requirements
Change the default flag from FALSE to TRUE for OFFER PROTECTION PLAN.

davi marra @davimarrauownleasing
#STEPS TO REPRODUCE#
-> Check, when accessing the Merchant screen and clicking the ADD A NEW MERCHANT button, whether the OFFER PROTECTION PLAN option is selected by default with the status set to true.

-----

Em Português
UOWN | Originação | Definir o Plano de Proteção de Oferta como TRUE por padrão ao criar um NOVO COMERCIANTE

Sinopse
Ao acessar a tela de COMERCIANTE e clicar no botão ADICIONAR UM NOVO COMERCIANTE, um novo registro é iniciado. Algumas opções são pré-selecionadas como TRUE ou FALSE por padrão.
Atualmente, o valor padrão da opção PLANO DE PROTEÇÃO DE OFERTA é FALSE, e deve ser alterado para TRUE por padrão.

Solicitação de Recurso | Requisitos de Negócio
Alterar a flag padrão de FALSE para TRUE para o PLANO DE PROTEÇÃO DE OFERTA.

davi marra @davimarrauownleasing
#PASSOS PARA REPRODUZIR#
-> Verifique, ao acessar a tela de Comerciante e clicar no botão ADICIONAR UM NOVO COMERCIANTE, se a opção PLANO DE PROTEÇÃO DE OFERTA está selecionada por padrão com o status definido como true.
Adicionar Merchant
Clonar MerchantEditar merchant
Editar merchant
Excluir merchant

------------------------------------------------------------------------------------------------------------------------------------------------------------------

📋 Requisito da Tarefa
Definir o Plano de Proteção de Oferta como TRUE por padrão ao criar um NOVO COMERCIANTE.
A tarefa exige que, ao criar um novo comerciante na tela de cadastro, o campo "Plano de Proteção de Oferta" esteja pré-selecionado como TRUE por padrão, em vez de FALSE.


🧪 Cenários de Teste Gherkin

Scenario 1 – Verificar se o campo "Plano de Proteção de Oferta" está pré-selecionado como TRUE ao adicionar um novo comerciante

Scenario: 1 - Verificar se o campo "Plano de Proteção de Oferta" está pré-selecionado como TRUE ao adicionar um novo comerciante
  Given que o usuário acessa a tela de Comerciante
  When clica no botão "Adicionar um Novo Comerciante"
  Then a opção "Plano de Proteção de Oferta" deve estar pré-selecionada como TRUE
  And ao salvar o cadastro do comerciante a opção "Plano de Proteção de Oferta" deve ser exibida marcada
  And um log deve ser apresentado informando que o comerciante foi criado com a opção "Plano de Proteção de Oferta" selecionada

🔍 Verifique se, ao acessar a tela de Comerciante e clicar em "Adicionar um Novo Comerciante", o campo "Plano de Proteção de Oferta" é automaticamente marcado como TRUE.
📝 Explicação: Este cenário valida que a alteração do valor padrão para TRUE foi aplicada corretamente na interface.
✅ Resultado Esperado: O campo "Plano de Proteção de Oferta" está marcado como TRUE ao criar um novo comerciante.

--> Não é registrado log informando que merchant foi criado com opção Plano de Proteção de Oferta selecionada
-----

Scenario 2 – Verificar se a alteração do valor da flag é salva ao salvar o novo comerciante

Scenario: 2 - Verificar se a alteração do valor da flag é salva ao salvar o novo comerciante
  Given que o usuário acessa a tela de Comerciante e clica em "Adicionar um Novo Comerciante"
  And a opção "Plano de Proteção de Oferta" está pré-selecionada como TRUE
  When o usuário altera a opção para FALSE 
  And salva o novo comerciante
  Then o valor alterado deve ser salvo corretamente no banco de dados como FALSE
  And no log deve exibir "Plano de Proteção de Oferta" não selecionado ou selecionado como false

🔍 Verifique se, desmarcar a opção "Plano de Proteção de Oferta" e salvar o comerciante, o valor alterado é refletido corretamente no banco de dados.
📝 Explicação: Esse cenário garante que as alterações feitas na interface sejam corretamente refletidas no banco de dados após salvar o novo comerciante.
✅ Resultado Esperado: A alteração feita na interface é salva corretamente no banco de dados.

-----

Scenario 3 – Verificar a persistência da configuração do Plano de Proteção de Oferta ao editar um comerciante existente

Scenario: 3 - Verificar a persistência da configuração ao editar um comerciante existente
  Given que o usuário acessa a tela de Comerciante e clica em "Editar Comerciante" para um comerciante existente
  When o usuário altera o valor da opção "Plano de Proteção de Oferta"
  Then a opção "Plano de Proteção de Oferta" deve exibir o valor salvo (TRUE ou FALSE)

🔍 Verifique se a configuração do "Plano de Proteção de Oferta" (se TRUE ou FALSE) permanece conforme foi salva ao editar um comerciante existente.
📝 Explicação: Este cenário valida que a configuração de "Plano de Proteção de Oferta" é persistida corretamente quando um comerciante é editado.
✅ Resultado Esperado: O valor da opção "Plano de Proteção de Oferta" é exibido corretamente (TRUE ou FALSE) ao editar o comerciante.

-----

Scenario 4 – Verificar se o sistema salva o comerciante com o Plano de Proteção de Oferta configurado como TRUE ao clonar um comerciante

Scenario: 4 - Verificar se o sistema salva o comerciante com o Plano de Proteção de Oferta configurado como TRUE ao clonar um comerciante
  Given que o usuário acessa a tela de Comerciante e clica em "Clonar Comerciante" para um comerciante existente
  When o novo comerciante é clonado
  Then o "Plano de Proteção de Oferta" do novo comerciante deve ser configurado como TRUE por padrão

🔍 Verifique se, ao clonar um comerciante existente, o campo "Plano de Proteção de Oferta" é configurado como TRUE por padrão para o novo comerciante.
📝 Explicação: Esse cenário garante que, ao clonar um comerciante, o valor do "Plano de Proteção de Oferta" seja automaticamente configurado como TRUE, como no processo de criação.
✅ Resultado Esperado: O "Plano de Proteção de Oferta" é configurado como TRUE no comerciante clonado.

OK
Nao registra um log informando que o merchant foi criado com o protection plan ativado
-----

Scenario 5 – Verificar se o sistema salva o comerciante com o Plano de Proteção de Oferta configurado como FALSE ao clonar um comerciante

Scenario: 5 - Verificar se o sistema salva o comerciante com o Plano de Proteção de Oferta configurado como FALSE ao clonar um comerciante
  Given que o usuário acessa a tela de Comerciante e clica em "Clonar Comerciante" para um comerciante existente
  And desmarca a opção Offer Protection Plan que é exibida habilitada
  When o novo comerciante é clonado
  Then o "Plano de Proteção de Oferta" do novo comerciante deve ser configurado como FALSE por padrão

🔍 Verifique se, ao clonar um comerciante existente e desmaarcar a opção "Plano de Proteção de Oferta" e salvar, ao acessar o merchant clonado a opção "Plano de Proteção de Oferta" é exibida desmarcada.
📝 Explicação: Esse cenário garante que, ao clonar um comerciante, o valor do "Plano de Proteção de Oferta" seja automaticamente configurado como FALSE, como no processo de criação.
✅ Resultado Esperado: O "Plano de Proteção de Oferta" é configurado como TRUE no comerciante clonado.

ERROR
Opção Offer Protection Plan é desmarcada, o backend apresenta que envia e recebe a opção como false, porém em tela é apresentado a opção marcada e não é registrado um log que o comerciante foi criado com a opção desmarcada

------------------------------------------------------------------------------------------------------------------------------------------------------------------

1. 
Verifique se, ao acessar a tela de Comerciante e clicar em "Adicionar um Novo Comerciante", o campo "Plano de Proteção de Oferta" é automaticamente marcado como TRUE
Verify that, when accessing the Merchant screen and clicking "Add a New Merchant," the "Offer Protection Plan" field is automatically set to TRUE

2. 
Verifique se, ao cadastrar um comerciante, desmarcar "Plano de Proteção de Oferta" e salvar, o valor alterado é refletido corretamente no banco de dados
Verify that, when registering a merchant, unchecking "Offer Protection Plan," and saving, the changed value is correctly reflected in the database

3. 
Verifique se a configuração do "Plano de Proteção de Oferta" (TRUE ou FALSE) permanece conforme salva ao editar um comerciante existente.  
Verify that the "Offer Protection Plan" setting (TRUE or FALSE) remains as saved when editing an existing merchant

4. 
Verifique se, ao clonar um comerciante existente, o campo "Plano de Proteção de Oferta" é configurado como TRUE por padrão para o novo comerciante
Verify that, when cloning an existing merchant, the "Offer Protection Plan" field is set to TRUE by default for the new merchant

5.
Verifique se, ao clonar um comerciante existente, desmarcar "Plano de Proteção de Oferta" e salvar, o comerciante clonado exibe a opção desmarcada ao ser acessado
Verify that, when cloning an existing merchant, unchecking "Offer Protection Plan," and saving, the cloned merchant displays the option as unchecked when accessed

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa1

| Merchant | Test Case | Test Data | Status | Observation |
| ------ | ------ | ------ | ------ | ------ |
| Progress Mobility | Verify that, when accessing the Merchant screen and clicking "Add a New Merchant," the "Offer Protection Plan" field is automatically set to TRUE |  | PASS |  |
| Progress Mobility | Verify that, when registering a merchant, unchecking "Offer Protection Plan," and saving, the changed value is correctly reflected in the database |  | WIP|  |
| Progress Mobility | Verify that the "Offer Protection Plan" setting (TRUE or FALSE) remains as saved when editing an existing merchant |  | WIP |  |
| Progress Mobility | Verify that, when cloning an existing merchant, the "Offer Protection Plan" field is set to TRUE by default for the new merchant |  | PASS |  |
| Progress Mobility | Verify that, when cloning an existing merchant, unchecking "Offer Protection Plan," and saving, the cloned merchant displays the option as unchecked when accessed |  | WIP|  |


Tests in qa1

| Merchant | Test Case | Test Data | Status | Observation |
| ------ | ------ | ------ | ------ | ------ |
| Progress Mobility | Verify that, when accessing the Merchant screen and clicking "Add a New Merchant," the "Offer Protection Plan" field is automatically set to TRUE | ![qa1-1021-c1_1_](/uploads/563359574ba9ec88f39bb8c575b13702/qa1-1021-c1_1_.png){width=1438 height=741}![qa1-1021-c1_2_](/uploads/3f4dd54389a9ba225003231960d676f0/qa1-1021-c1_2_.png){width=1438 height=741}![qa1-1021-c1_3_](/uploads/55b7e6933acc45462e42a3196ea6c734/qa1-1021-c1_3_.png){width=1438 height=741}![qa1-1021-c1_4_](/uploads/f739102e7cbc7daab4b30ddd090d2be0/qa1-1021-c1_4_.png){width=1438 height=741}![qa1-1021-c1_5_](/uploads/e48efefa939c2d3cab1dd498105de84e/qa1-1021-c1_5_.png){width=1438 height=741}![qa1-1021-c1_6_](/uploads/6b165486604afef828cf92ddf8d02bba/qa1-1021-c1_6_.png){width=1438 height=741}![qa1-1021-c1_7_](/uploads/42ef0aa4f59b0370aff48cf78161baa6/qa1-1021-c1_7_.png){width=1438 height=741}![qa1-1021-c1_8_](/uploads/d0b26297d09c9e8f0d3019f17ae46f0f/qa1-1021-c1_8_.png){width=1438 height=741} | PASS |  |
| Progress Mobility | Verify that, when registering a merchant, unchecking "Offer Protection Plan," and saving, the changed value is correctly reflected in the database | ![qa1-1021-c2_E1___1_](/uploads/16604e4ce615b0a290248dba4ef64db1/qa1-1021-c2_E1___1_.png){width=1437 height=741}![qa1-1021-c2_E1___2_](/uploads/c0a556a7c556fe7f37cf1a04df5cc0e0/qa1-1021-c2_E1___2_.png){width=1437 height=741}![qa1-1021-c2_E1___3_](/uploads/e7ef7dde6a830b22f03f1d5e093c9f89/qa1-1021-c2_E1___3_.png){width=1437 height=741}![qa1-1021-c2_E1___4_](/uploads/ee64de2644543058d03dfd8274e883ed/qa1-1021-c2_E1___4_.png){width=1437 height=741}![qa1-1021-c2_E1___5_](/uploads/0d72a8608974fbe222b5f0422165e7c1/qa1-1021-c2_E1___5_.png){width=1437 height=741}![qa1-1021-c2_E1___6_](/uploads/7fa4f0170e9e299adcaea1c88dc5ea0f/qa1-1021-c2_E1___6_.png){width=1437 height=741}![qa1-1021-c2_E1___7_](/uploads/09fa74b59296f0d1cb9ecfd1c2ba7f80/qa1-1021-c2_E1___7_.png){width=1437 height=741}![qa1-1021-c2_E1___8_](/uploads/9a469d807ffe078a33b793db01b4094f/qa1-1021-c2_E1___8_.png){width=1437 height=741} | WIP | When registering a merchant and unchecking the protection plan option, the request shows "OfferInsurrance" as false, but the saved merchant displays the protection plan as selected |
| Progress Mobility | Verify that the "Offer Protection Plan" setting (TRUE or FALSE) remains as saved when editing an existing merchant | ![qa1-1021-c3_E1___1_](/uploads/e2d246069b094c13e103380166aceffc/qa1-1021-c3_E1___1_.png){width=1437 height=741}![qa1-1021-c3_E1___2_](/uploads/f981d37809fb058983eb47ff42b16e36/qa1-1021-c3_E1___2_.png){width=1437 height=741}![qa1-1021-c3_E1___3_](/uploads/aaad18d6dc9074383aec513baf499472/qa1-1021-c3_E1___3_.png){width=1437 height=741}![qa1-1021-c3_E1___4_](/uploads/dbeacdcba776f39444bad65d16240f82/qa1-1021-c3_E1___4_.png){width=1437 height=741}![qa1-1021-c3_E1___5_](/uploads/253b5507075ffc6466bc8de136c2777c/qa1-1021-c3_E1___5_.png){width=1437 height=741}![qa1-1021-c3_E1___6_](/uploads/f6dbe45cb204cf316f083408d1b055d9/qa1-1021-c3_E1___6_.png){width=1437 height=741} | WIP | When editing a merchant and unchecking the protection plan option, the request shows "OfferInsurrance" as false, but the saved merchant displays the protection plan as selected. |
| Progress Mobility | Verify that, when cloning an existing merchant, the "Offer Protection Plan" field is set to TRUE by default for the new merchant | ![qa1-1021-c4_1_](/uploads/88948819d7c27f1608213c5248f6e853/qa1-1021-c4_1_.png){width=1438 height=741}![qa1-1021-c4_2_](/uploads/edc15289b180d7763320abb64b97aada/qa1-1021-c4_2_.png){width=1438 height=741}![qa1-1021-c4_3_](/uploads/7bfae1e857e0db9c46b3243522d1c952/qa1-1021-c4_3_.png){width=1438 height=741}![qa1-1021-c4_4_](/uploads/73956e6c30534984d5c063d4f74c6d90/qa1-1021-c4_4_.png){width=1438 height=741}![qa1-1021-c4_5_](/uploads/a400ed0b5c19cb6b26279150d44b19a5/qa1-1021-c4_5_.png){width=1438 height=741}![qa1-1021-c4_6_](/uploads/446e00066621630c0488a9c401cb18fd/qa1-1021-c4_6_.png){width=1438 height=741}![qa1-1021-c4_7_](/uploads/453312cd711c5c5e9f8bca75684769db/qa1-1021-c4_7_.png){width=1438 height=741}![qa1-1021-c4_8_](/uploads/deae5167fb7d4ecf42d9eaabaf2272b7/qa1-1021-c4_8_.png){width=1438 height=741}![qa1-1021-c4_9_](/uploads/0eef46a54cf8e9505faa83c1cda0b36a/qa1-1021-c4_9_.png){width=1438 height=741}![qa1-1021-c4_10_](/uploads/38ae134039d7cc63df918166d8ea9f55/qa1-1021-c4_10_.png){width=1172 height=75} | PASS |  |
| Progress Mobility | Verify that, when cloning an existing merchant, unchecking "Offer Protection Plan," and saving, the cloned merchant displays the option as unchecked when accessed | ![qa1-1021-c5_E1___1_](/uploads/415f67f7cad6a7df9bb0d0f1783c81db/qa1-1021-c5_E1___1_.png){width=1430 height=742}![qa1-1021-c5_E1___2_](/uploads/016d578e4d556e1748f402c13cd36c18/qa1-1021-c5_E1___2_.png){width=1430 height=742}![qa1-1021-c5_E1___3_](/uploads/766b69959bb931e03fc441dc892f3e74/qa1-1021-c5_E1___3_.png){width=1175 height=64}![qa1-1021-c5_E1___4_](/uploads/7321dd4292d772c3e2332d70d67aeb0e/qa1-1021-c5_E1___4_.png){width=1437 height=741}![qa1-1021-c5_E1___5_](/uploads/d971bef583bc0b4769cbe8ae2ef01439/qa1-1021-c5_E1___5_.png){width=1437 height=741}![qa1-1021-c5_E1___6_](/uploads/39671a590013d6308fff0863a5525015/qa1-1021-c5_E1___6_.png){width=1437 height=741}![qa1-1021-c5_E1___7_](/uploads/e008af1c1a39ea768f811b7f539afa90/qa1-1021-c5_E1___7_.png){width=1437 height=741}![qa1-1021-c5_E1___8_](/uploads/e4d5634eb34cf18af24ef4c13fbde060/qa1-1021-c5_E1___8_.png){width=1437 height=741} | WIP| When cloning a merchant with the protection plan option unchecked, the cloned merchant’s settings show the protection plan as checked |


Tests in qa1

| Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ |
| Progress Mobility | Verify that, when accessing the Merchant screen and clicking "Add a New Merchant," the "Offer Protection Plan" field is automatically set to TRUE | ![qa1-1021-c1_1_](/uploads/563359574ba9ec88f39bb8c575b13702/qa1-1021-c1_1_.png){width=1438 height=741}![qa1-1021-c1_2_](/uploads/3f4dd54389a9ba225003231960d676f0/qa1-1021-c1_2_.png){width=1438 height=741}![qa1-1021-c1_3_](/uploads/55b7e6933acc45462e42a3196ea6c734/qa1-1021-c1_3_.png){width=1438 height=741}![qa1-1021-c1_4_](/uploads/f739102e7cbc7daab4b30ddd090d2be0/qa1-1021-c1_4_.png){width=1438 height=741}![qa1-1021-c1_5_](/uploads/e48efefa939c2d3cab1dd498105de84e/qa1-1021-c1_5_.png){width=1438 height=741}![qa1-1021-c1_6_](/uploads/6b165486604afef828cf92ddf8d02bba/qa1-1021-c1_6_.png){width=1438 height=741}![qa1-1021-c1_7_](/uploads/42ef0aa4f59b0370aff48cf78161baa6/qa1-1021-c1_7_.png){width=1438 height=741}![qa1-1021-c1_8_](/uploads/d0b26297d09c9e8f0d3019f17ae46f0f/qa1-1021-c1_8_.png){width=1438 height=741} | PASS |
| Progress Mobility | Verify that, when registering a merchant, unchecking "Offer Protection Plan," and saving, the changed value is correctly reflected in the database | ![qa1-1021-c2_1_](/uploads/31a175304a1c563723d7579c5d49225f/qa1-1021-c2_1_.png){width=1435 height=743}![qa1-1021-c2_2_](/uploads/f156b7e5b2ade491654a84b59e3a3eca/qa1-1021-c2_2_.png){width=1435 height=743}![qa1-1021-c2_3_](/uploads/3861e9fe60cba37627299ae947266320/qa1-1021-c2_3_.png){width=1435 height=743}![qa1-1021-c2_4_](/uploads/9a5cc0c1122f23afab595fd4fd2acd5f/qa1-1021-c2_4_.png){width=1435 height=743}![qa1-1021-c2_5_](/uploads/9b7a8a9fa768ee72303c98d2e2ca6e21/qa1-1021-c2_5_.png){width=1435 height=743}![qa1-1021-c2_6_](/uploads/96e6d3b68f5005b89df774f87f61521a/qa1-1021-c2_6_.png){width=1435 height=743}![qa1-1021-c2_7_](/uploads/d8fd1bacf1d50148a1b3a566f3ff112c/qa1-1021-c2_7_.png){width=1435 height=743}![qa1-1021-c2_8_](/uploads/5d005b631b43330239829faf09adb41f/qa1-1021-c2_8_.png){width=1435 height=743}![qa1-1021-c2_9_](/uploads/5af98c0b1d30292ed99e66c6f895e2d7/qa1-1021-c2_9_.png){width=1435 height=743}![qa1-1021-c2_10_](/uploads/11309b48a78afdaf6c76e361682b6f15/qa1-1021-c2_10_.png){width=1011 height=61} | PASS |
| Progress Mobility | Verify that the "Offer Protection Plan" setting (TRUE or FALSE) remains as saved when editing an existing merchant | ![qa1-1021-c3_1_](/uploads/54cbcfb61d3b7cbeb6e7cfd144e46467/qa1-1021-c3_1_.png){width=1437 height=743}![qa1-1021-c3_2_](/uploads/0b5861459983cc06023cfb63aa8afa2f/qa1-1021-c3_2_.png){width=1437 height=743}![qa1-1021-c3_3_](/uploads/6b83d930d844a756acaa69440e0e7d73/qa1-1021-c3_3_.png){width=1437 height=743}![qa1-1021-c3_4_](/uploads/80b7943a544a1b55320a974a5730eb25/qa1-1021-c3_4_.png){width=1437 height=743}![qa1-1021-c3_5_](/uploads/02c5a625be3041baf80543fe66705899/qa1-1021-c3_5_.png){width=1437 height=743}![qa1-1021-c3_6_](/uploads/4ddd5a8e756cb5815306c214894fb0cb/qa1-1021-c3_6_.png){width=1011 height=69} | PASS |
| Progress Mobility | Verify that, when cloning an existing merchant, the "Offer Protection Plan" field is set to TRUE by default for the new merchant | ![qa1-1021-c4_1_](/uploads/88948819d7c27f1608213c5248f6e853/qa1-1021-c4_1_.png){width=1438 height=741}![qa1-1021-c4_2_](/uploads/edc15289b180d7763320abb64b97aada/qa1-1021-c4_2_.png){width=1438 height=741}![qa1-1021-c4_3_](/uploads/7bfae1e857e0db9c46b3243522d1c952/qa1-1021-c4_3_.png){width=1438 height=741}![qa1-1021-c4_4_](/uploads/73956e6c30534984d5c063d4f74c6d90/qa1-1021-c4_4_.png){width=1438 height=741}![qa1-1021-c4_5_](/uploads/a400ed0b5c19cb6b26279150d44b19a5/qa1-1021-c4_5_.png){width=1438 height=741}![qa1-1021-c4_6_](/uploads/446e00066621630c0488a9c401cb18fd/qa1-1021-c4_6_.png){width=1438 height=741}![qa1-1021-c4_7_](/uploads/453312cd711c5c5e9f8bca75684769db/qa1-1021-c4_7_.png){width=1438 height=741}![qa1-1021-c4_8_](/uploads/deae5167fb7d4ecf42d9eaabaf2272b7/qa1-1021-c4_8_.png){width=1438 height=741}![qa1-1021-c4_9_](/uploads/0eef46a54cf8e9505faa83c1cda0b36a/qa1-1021-c4_9_.png){width=1438 height=741}![qa1-1021-c4_10_](/uploads/38ae134039d7cc63df918166d8ea9f55/qa1-1021-c4_10_.png){width=1172 height=75} | PASS |
| Progress Mobility | Verify that, when cloning an existing merchant, unchecking "Offer Protection Plan," and saving, the cloned merchant displays the option as unchecked when accessed | ![qa1-1021-c5_1_](/uploads/8ab82f1440c70252e4e868d7f41c134f/qa1-1021-c5_1_.png){width=1438 height=744}![qa1-1021-c5_2_](/uploads/fc1b7eb9e5db3ea8de9ef448cb0adee6/qa1-1021-c5_2_.png){width=1438 height=744}![qa1-1021-c5_3_](/uploads/9f6131b533b9c728f2526f32ccd3960c/qa1-1021-c5_3_.png){width=1438 height=744}![qa1-1021-c5_4_](/uploads/57b9adbbed197f5eede91dceb694b10c/qa1-1021-c5_4_.png){width=1438 height=744}![qa1-1021-c5_5_](/uploads/983813f1f1eb43acf4e8496ce0679577/qa1-1021-c5_5_.png){width=1438 height=744}![qa1-1021-c5_6_](/uploads/32c4e088ae6f44b05617777e5e5df3fc/qa1-1021-c5_6_.png){width=1438 height=744}![qa1-1021-c5_7_](/uploads/1a76ef8d3fce38403a7b01b12fdaac92/qa1-1021-c5_7_.png){width=1438 height=744}![qa1-1021-c5_8_](/uploads/a97d2b736e7139156179f24dac920f28/qa1-1021-c5_8_.png){width=1438 height=744}![qa1-1021-c5_9_](/uploads/c051d9dc9f27c46c1cb50c9e3fd1d10b/qa1-1021-c5_9_.png){width=1438 height=744}![qa1-1021-c5_10_](/uploads/77da78caa4e12bb07103a81362320183/qa1-1021-c5_10_.png){width=1085 height=65} | PASS|

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa1

------------------------------------------------------------------------------------------------------------------------------------------------------------------

stg

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in stg

Merchant | Test Case | Test Data | Status |
| ------ | --------- | --------- | ------ |
| Progress Mobility | Verify that, when accessing the Merchant screen and clicking "Add a New Merchant," the "Offer Protection Plan" field is automatically set to TRUE |  | PASS |
| Progress Mobility_new() | Verify that, when registering a merchant, unchecking "Offer Protection Plan," and saving, the changed value is correctly reflected in the database |  | PASS |
| PayTomorrow | Verify that the "Offer Protection Plan" setting (TRUE or FALSE) remains as saved when editing an existing merchant |  | PASS |
| Progress Mobility_clone | Verify that, when cloning an existing merchant, the "Offer Protection Plan" field is set to TRUE by default for the new merchant |  | PASS |
| PayTomorrow | Verify that, when cloning an existing merchant, unchecking "Offer Protection Plan," and saving, the cloned merchant displays the option as unchecked when accessed |  | PASS |

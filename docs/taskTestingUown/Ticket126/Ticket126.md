------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/website/-/issues/126

------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Customer Portal | Implement Protection Plan Enrollment in Customer Portal

Synopsis:
Add a fixed banner at the top of the Customer Portal. ("Protect yourself. Protect your lease for only $12.99/month") (See the mockup)

Business Objetctive:
The goal is to increase visibility for the lease protection offer and encourage customer subscriptions to the monthly protection service.
Feature Request | Business Requirements: 
* Should be fixed at the top of the customer portal UI
* Responsive (must adapt to different screen sizes)
* Should include a a link to redirect a customer to Protection Plan Enrollment


Sowjanya Kaligineedi @skaligineedi
@davi.artur.gow
Here are the services:
1.GET /uown/svc/getPlanEligibilityForAccount/{accountPk}
This service determines whether an account is eligible to be offered the protection plan. 
It checks if the account is already covered, account not active, or located in a state where the protection plan isn't offered. 
offerProtectionPlan is false, the protection plan banner should not be shown.

This service also returns the customer data so you don't have to call any other service. Important: When sending the customerId to Buddy in the offer element request, 
make sure to append an "A" to the accountPk. There's no need to call any other service for customer data.

Sample response : {
"offerProtectionPlan": true,
"basicCustomerData": {
"firstName": "Testmuguu",
"lastName": "Testerwfmar",
"dob": "1984-01-01",
"email": "fintechgroup777+cLvCy@gmail.com",
"phone": "7989015363",
"address1": "656 Test Street",
"address2": "",
"city": "Sacramento",
"state": "AK",
"zipCode": "94203"
},
"accountPk": 3694

2.POST /enrollAccountInProtectionPlan
Use this service when a customer opts in to the protection plan. On a onCheckout event with oncheckoutsuccess true, call this service to save the protection plan info.
{
"accountPk": 3694,
"optIn": true,
"customerId": null,
"policyId": null
}

Davi Artur
@davi.artur.gow
@jose.mendesdev # 
✅ Protection Plan Enrollment Test
Objective
Verify whether an account is eligible for the Protection Plan and validate the full enrollment process using a credit card.

🔹 Step 1 - Login
1. Go to the QA environment:
https://website-qa1.uownleasing.com/
2. Log in using valid test account credentials.

🔹 Step 2 - Check Eligibility
1. After logging in, on the Overview (Home) page, open the Network tab in your browser’s Developer Tools.
2. Look for the request: GET /getPlanEligibilityForAccount
3. In the response body, check the offerProtectionPlan property to determine if the logged-in account is eligible to enroll in the Protection Plan.

🔹 Step 3 - Start Enrollment
1. If the account is eligible, a blue banner will be visible on the screen.
2. Click the banner to begin the enrollment process.
3. Proceed through the contract reading and payment steps using a credit card.

🔹 Step 4 - Validate Enrollment Request
1. After filling in the credit card information and proceeding to the final step of the payment:
2. In the Network tab, look for the POST /enrollAccountInProtectionPlan request.
3. Inspect the request body, which should be similar to the following:
{
    "accountPk": 47,
    "optIn": true,
    "customerId": null,
    "policyId": null,
    "orderId": "o-19g6jm97huc8z"
}

------------------------------------------------------------------------------------------------------------------------------------------------------------------

**Português:**
UOWN | Portal do Cliente | Implementar Inscrição do Plano de Proteção no Portal do Cliente

Resumo:
Adicionar um banner fixo no topo do Portal do Cliente. ("Proteja-se. Proteja seu contrato de leasing por apenas $12,99/mês") (Veja o mockup)

Objetivo Comercial:
Aumentar a visibilidade da oferta de proteção de leasing e incentivar assinaturas de clientes para o serviço mensal de proteção.

Aqui estão os serviços:

GET /uown/svc/getPlanEligibilityForAccount/{accountPk}
Este serviço determina se uma conta é elegível para receber a oferta do plano de proteção.
Ele verifica se a conta já está coberta, se a conta não está ativa ou se está localizada em um estado onde o plano de proteção não é oferecido.
Se offerProtectionPlan for falso, o banner do plano de proteção não deve ser exibido.

Este serviço também retorna os dados do cliente, então você não precisa chamar nenhum outro serviço. Importante: Ao enviar o customerId para o Buddy na solicitação do elemento de oferta,
certifique-se de adicionar um "A" ao accountPk. Não há necessidade de chamar qualquer outro serviço para obter dados do cliente.

Requisitos:
* Deve ser fixado no topo da interface do portal do cliente um banner fixo no topo do Portal do Cliente. ("Proteja-se. Proteja seu contrato de leasing por apenas $12,99/mês")
* Responsivo (deve adaptar-se a diferentes tamanhos de tela)
* Deve incluir um link para redirecionar o cliente para a Inscrição do Plano de Proteção

Serviços disponíveis:

Este serviço também retorna os dados do cliente, dispensando chamadas adicionais. Importante: Ao enviar o customerId para o Buddy no elemento de oferta, 
adicione um "A" ao accountPk. Não é necessário chamar outros serviços para dados do cliente.

2. POST /enrollAccountInProtectionPlan
Use este serviço quando um cliente optar pelo plano de proteção. Em um evento onCheckout com oncheckoutsuccess verdadeiro, chame este serviço para salvar as informações do plano.

Teste do Plano de Proteção:
Objetivo: Verificar se uma conta é elegível e validar o processo completo de inscrição usando cartão de crédito.

Etapa 1 - Login
1. Acesse o ambiente QA
2. Faça login com credenciais de teste válidas

Etapa 2 - Verificar Elegibilidade
1. Na página inicial, abra as Ferramentas de Desenvolvedor
2. Procure a requisição GET /getPlanEligibilityForAccount
3. Verifique a propriedade offerProtectionPlan

Etapa 3 - Iniciar Inscrição
1. Se elegível, um banner azul será visível
2. Clique no banner para iniciar o processo
3. Prossiga pelas etapas de leitura do contrato e pagamento

Etapa 4 - Validar Requisição de Inscrição
1. Após preencher informações do cartão de crédito
2. Procure a requisição POST /enrollAccountInProtectionPlan
3. Inspecione o corpo da requisição

o cliente, em website pode alterar seu proprio email, o cliente deve ver o banner mesmo mudando o email

------------------------------------------------------------------------------------------------------------------------------------------------------------------

📋 Requisito da Tarefa
Adicionar um banner fixo no topo do Portal do Cliente, promovendo o Plano de Proteção de Leasing. 
O banner será exibido com base na elegibilidade da conta e redirecionará os clientes para a inscrição no plano de proteção. 
O banner deve ser responsivo e adaptar-se a diferentes tamanhos de tela. Também é necessário verificar se a alteração do email de um cliente no 
Portal de Servicing ou Website mantém a exibição do banner corretamente.

🧪 Cenários de Teste Gherkin

Scenario 1 – Verificar se o banner é exibido corretamente quando a conta é elegível para o plano de proteção

Scenario: 1 - Verificar se o banner é exibido corretamente quando a conta é elegível para o plano de proteção
  Given que o usuário está logado no Portal do Cliente
  And a conta do usuário é elegível para o plano de proteção
  When o banner "Proteja-se. Proteja seu contrato de leasing por apenas $12,99/mês" é exibido
  Then o banner deve ser exibido no topo da página
  And o banner deve ser responsivo, adaptando-se ao tamanho da tela
  And o banner deve incluir um link para redirecionar o cliente para a Inscrição do Plano de Proteção

🔍 Verifique se o banner de proteção é exibido corretamente no topo da página quando a conta do usuário é elegível para o plano de proteção.
📝 Explicação: Este cenário valida que o banner é exibido corretamente e é responsivo, com o link de redirecionamento funcionando conforme o esperado.
✅ Resultado Esperado: O banner é exibido no topo da página, é responsivo e inclui o link para a inscrição do plano de proteção.

-----

Scenario 2 – Verificar se o banner não é exibido quando a conta não é elegível para o plano de proteção

Scenario: 2 - Verificar se o banner não é exibido quando a conta não é elegível para o plano de proteção
  Given que o usuário está logado no Portal do Cliente
  And a conta do usuário não é elegível para o plano de proteção
  When o banner "Proteja-se. Proteja seu contrato de leasing por apenas $12,99/mês" é verificado
  Then o banner não deve ser exibido na página

🔍 Verifique se o banner de proteção não é exibido quando a conta do usuário não é elegível para o plano de proteção.
📝 Explicação: Esse cenário testa se o banner é ocultado corretamente quando a conta não atende aos critérios de elegibilidade para o plano de proteção.
✅ Resultado Esperado: O banner não é exibido quando a conta não é elegível.

-----

Scenario 3 – Verificar se o banner é exibido mesmo após alteração do email no Portal de Servicing

Scenario: 3 - Verificar se o banner é exibido mesmo após alteração do email no Portal de Servicing
  Given que o usuário está logado no Portal de Servicing
  And o usuário altera o email da conta
  When o cliente acessa a portal de clientes(website)
  Then o banner "Proteja-se. Proteja seu contrato de leasing por apenas $12,99/mês" deve continuar visível

🔍 Verifique se o banner de proteção continua visível após o usuário alterar o email da conta no Portal de Servicing.
📝 Explicação: Este cenário valida que, mesmo após alterações no email, o banner de proteção permanece visível quando a conta é elegível.
✅ Resultado Esperado: O banner deve permanecer visível, mesmo após a alteração do email no Portal de Servicing.  

-----

Scenario 4 – Verificar se o banner é exibido mesmo após alteração do email no Website

Scenario: 4 - Verificar se o banner é exibido mesmo após alteração do email no Website
  Given que o cliente está logado no Website
  And o cliente altera o email da conta
  When o cliente acessa a portal de clientes(website)
  Then o banner "Proteja-se. Proteja seu contrato de leasing por apenas $12,99/mês" deve continuar visível

🔍 Verifique se o banner de proteção continua visível após o cliente alterar o email no Website.
📝 Explicação: Este cenário valida que o banner de proteção permanece visível mesmo após a alteração do email no Website.
✅ Resultado Esperado: O banner deve permanecer visível, mesmo após a alteração do email no Website.

-----

Scenario 5 – Verificar a inscrição no plano de proteção com cartão de crédito

Scenario: 5 - Verificar a inscrição no plano de proteção com cartão de crédito

Scenario: 5 - Verificar a requisição POST para inscrição no plano de proteção com dados do cartão de crédito e CEP no Portal do Website
  Given que o cliente acessa o Portal do Website e deseja aderir ao plano de proteção
  And o cliente preenche os dados do cartão de crédito, incluindo o número do cartão, data de validade, CVV e CEP
  When o cliente submete o formulário para adesão ao plano de proteção
  Then a requisição POST para "/enrollAccountInProtectionPlan" deve ser enviada corretamente
  And o corpo da requisição deve conter os dados do cartão de crédito e o CEP preenchido
  And o campo "optIn" na requisição deve estar configurado como "true"
  And o status da requisição deve ser "Completed" se o pagamento for bem-sucedido
  And a requisição deve retornar um erro caso os dados de pagamento sejam inválidos ou haja fundos insuficientes

🔍 Verifique se, ao preencher os dados do cartão de crédito e o CEP no Portal do Website, a requisição POST para a inscrição no plano de proteção é enviada corretamente, incluindo todos os dados de pagamento necessários (cartão, data de validade, CVV e CEP)
📝 Explicação: Este cenário valida que a requisição POST para inscrever o cliente no plano de proteção é enviada corretamente com todos os dados de pagamento, e que a resposta será o status "Completed" quando o pagamento for bem-sucedido. Se houver problemas, como fundos insuficientes ou dados inválidos, o sistema deve retornar um erro.
✅ Resultado Esperado: A requisição POST deve ser enviada corretamente com os dados do cartão de crédito e CEP, o campo optIn deve estar true, e o status da requisição deve ser "Completed" ou um erro caso haja problemas no pagamento.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verifique se o banner de proteção é exibido corretamente no topo da página quando a conta do usuário é elegível para o plano de proteção
Verify if the protection banner is displayed correctly at the top of the page when the user's account is eligible for the protection plan

Verifique se o banner de proteção não é exibido quando a conta do usuário não é elegível para o plano de proteção
Verify if the protection banner is not displayed when the user's account is not eligible for the protection plan

Verifique se o banner de proteção continua visível após o usuário alterar o email da conta no Portal de Servicing
Verify if the protection banner remains visible after the user changes the account email in the Servicing Portal

Verifique se o banner de proteção continua visível após o cliente alterar o email no Website
Verify if the protection banner remains visible after the customer changes the email on the Website

Verifique se, ao preencher os dados do cartão de crédito e o CEP no Portal do Website, a requisição POST para a inscrição no plano de proteção é enviada corretamente, incluindo todos os dados de pagamento necessários (cartão, data de validade, CVV e CEP)
Check that, when filling in the credit card details and zip code on the Website Portal, the POST request for registration in the protection plan is sent correctly, including all necessary payment details (card, expiration date, CVV and zip code)

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa1

| Account | Test Case | Test Data | Status | Obervation |
| ------ | ------ | ------ | ------ | ------ |
| 206264 | Verify if the protection banner is displayed correctly at the top of the page when the user's account is eligible for the protection plan |  | PASS | -- |
| 206265 | Verify if the protection banner is not displayed when the user's account is not eligible for the protection plan |  | PASS |  |
| 206279 | Verify if the protection banner remains visible after the user changes the account email in the Servicing Portal |  | PASS |  |
| 206276 | Verify if the protection banner remains visible after the customer changes the email on the Website |  | PASS |  |
| 206266 | Check that, when filling in the credit card details and zip code on the Website Portal, the POST request for registration in the protection plan is sent correctly, including all necessary payment details |  | PASS |
------------------------------------------------------------------------------------------------------------------------------------------------------------------

Testar cenário 5, 6 e 7

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa1

| AccountPk | Merchant | Test Case | Test Data | Status | Obervation |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 3841 | Progress Mobility | Verify if the protection banner is displayed correctly at the top of the page when the user's account is eligible for the protection plan | ![qa1-126-c1_1_](/uploads/e8dd3a43fe3944cb29d376dcb86d10ba/qa1-126-c1_1_.png){width=1434 height=739}![qa1-126-c1_2_](/uploads/243101bfa7935697f36d7b4527caa0b8/qa1-126-c1_2_.png){width=411 height=705}![qa1-126-c1_3_](/uploads/1cc6e1f33fd0a9eb8cedfddee4fc9c17/qa1-126-c1_3_.png){width=411 height=574}![qa1-126-c1_4_](/uploads/717e02d7f8db2da43939bb7e6912a092/qa1-126-c1_4_.png){width=411 height=700}![qa1-126-c1_5_](/uploads/3a7c323dbd04a236923807f5618d0a04/qa1-126-c1_5_.png){width=1434 height=740}![qa1-126-c1_6_](/uploads/f3051df892fba05eb3728e09d3631563/qa1-126-c1_6_.png){width=1119 height=725}![qa1-126-c1_7_](/uploads/3dcd3959d6c90a6e6b1205454c86f5e1/qa1-126-c1_7_.png){width=1434 height=741}![qa1-126-c1_8_](/uploads/1469606196532a95678bdb826fae7da4/qa1-126-c1_8_.png){width=1434 height=741}![qa1-126-c1_9_](/uploads/bb49259e4c0fda97883462dc929f6207/qa1-126-c1_9_.png){width=1434 height=741}![qa1-126-c1_10_](/uploads/87caef32a05f12e3d106f6f370fd76ba/qa1-126-c1_10_.png){width=1434 height=741}![qa1-126-c1_11_](/uploads/fd378035f47734de409a59943b982478/qa1-126-c1_11_.png){width=1434 height=741}![qa1-126-c1_12_](/uploads/a1ab6c1ba0a7ef3f75f8900fab5ec52a/qa1-126-c1_12_.png){width=1434 height=741}![qa1-126-c1_13_](/uploads/70deca4d71a2c49af7b609b4909c5ae3/qa1-126-c1_13_.png){width=1434 height=741}![qa1-126-c1_14_](/uploads/6b9d095dfc4918be06733f580a3a544b/qa1-126-c1_14_.png){width=1434 height=741} | PASS | -- |
| 3842 | Tire Agent | Verify if the protection banner is not displayed when the user's account is not eligible for the protection plan | ![qa1-126-c2_1_](/uploads/cc2cc4580d9cf453bb875be58ca9c120/qa1-126-c2_1_.png){width=1438 height=438}![qa1-126-c2_2_](/uploads/46ee384286f6e1589860ec678f7505be/qa1-126-c2_2_.png){width=1125 height=716} | PASS |  |
| 3843 | Tire Agent | Verify if the protection banner remains visible after the user changes the account email in the Servicing Portal | ![qa1-126-c3_1_](/uploads/d7acff84e91d33c08a38a9f4dda2bdef/qa1-126-c3_1_.png){width=1437 height=738}![qa1-126-c3_2_](/uploads/06dc218fc65b6ac6b519bac5b6c0812d/qa1-126-c3_2_.png){width=1437 height=738}![qa1-126-c3_3_](/uploads/5bc735ee8216fb23c12057f2de710793/qa1-126-c3_3_.png){width=1437 height=738}![qa1-126-c3_4_](/uploads/2917cdf1510039188d60773594598072/qa1-126-c3_4_.png){width=1437 height=738}![qa1-126-c3_5_](/uploads/44f38a17f682ccb0f69a821c54547806/qa1-126-c3_5_.png){width=1437 height=738} | PASS |  |
| 3843 | Tire Agent | Verify if the protection banner remains visible after the customer changes the email on the Website | ![qa1-126-c4_1_](/uploads/12c9d5be2ab3ba9f9b6259e4d885bedc/qa1-126-c4_1_.png){width=1437 height=738}![qa1-126-c4_2_](/uploads/10a5f8e49a847fe9dcfff840b515f201/qa1-126-c4_2_.png){width=1437 height=738}![qa1-126-c4_3_](/uploads/47c2033adab11ad2f31730f74a520e38/qa1-126-c4_3_.png){width=1437 height=738}![qa1-126-c4_4_](/uploads/6c060f1e3a24abff4bc60e9a98b08ee8/qa1-126-c4_4_.png){width=1437 height=738}![qa1-126-c4_5_](/uploads/bf9f20dd80c2e6db3ad0135007ce5893/qa1-126-c4_5_.png){width=1437 height=738}![qa1-126-c4_6_](/uploads/7dde43f7d72ce505879e27df02b7b116/qa1-126-c4_6_.png){width=1437 height=738}![qa1-126-c4_7_](/uploads/5ad750edf1bac1d40d5a6479a4aba565/qa1-126-c4_7_.png){width=1437 height=738} | PASS |  |
| 3865 | Tire Agent | Check that, when filling in the credit card details and zip code on the Website Portal, the POST request for registration in the protection plan is sent correctly, including all necessary payment details (card, expiration date, CVV and zip code) |  | PASS | -- |
------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa1

------------------------------------------------------------------------------------------------------------------------------------------------------------------

stg

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Scenario 1 – Verificar o comportamento do banner de proteção quando o cliente não está protegido e acessa o portal website

Scenario: 1 - Verificar o comportamento do banner de proteção quando o cliente não está protegido e acessa o portal website
  Given que o cliente não aderiu ao plano de proteção na assinatura do contrato
  And o cliente acessa o Portal Website
  Then o banner "Plano de Proteção" deve ser exibido no Portal Website
  And o cliente deve ver a opção de aderir ao plano de proteção
  And verifique nos logs e no banco de dados que o status do cliente é "não protegido"

Verifique se o banner de proteção é exibido no Portal Website quando o cliente não está protegido e ainda pode optar por aderir ao plano de proteção.

-----

Scenario 2 – Verificar o comportamento do banner de proteção quando o cliente está protegido e acessa o portal website

Scenario: 2 - Verificar o comportamento do banner de proteção quando o cliente está protegido e acessa o portal website
  Given que o cliente aderiu ao plano de proteção na assinatura do contrato
  And o cliente acessa o Portal Website
  Then o banner "Plano de Proteção" **não** deve ser exibido no Portal Website
  And verifique nos logs e no banco de dados que o status do cliente é "protegido"

Verifique se, quando o cliente já está protegido, o banner de plano de proteção não é exibido no Portal Website.

-----

Scenario 3 – Verificar a adesão ao plano de proteção pelo cliente no portal website com saldo insuficiente

Scenario: 3 - Verificar a adesão ao plano de proteção pelo cliente no portal website com saldo insuficiente
  Given que o cliente tenta aderir ao plano de proteção no Portal Website
  And o cliente tem saldo insuficiente para completar o pagamento
  When a requisição GET /uown/svc/getProtectionPlanForAccount/{accountPk} retorna o erro "Failed Charge: Insufficient funds"
  Then o painel "Plano de Proteção" no Portal de Servicing deve exibir a mensagem de erro "Failed Charge: Insufficient funds"
  And o painel "Plano de Proteção" no Portal de Origination deve exibir a mesma mensagem de erro
  And verifique nos logs e no banco de dados que a falha foi registrada corretamente

Verifique se o erro "Saldo Insuficiente" é exibido no Portal Servicing e Portal Origination quando o cliente tenta aderir ao plano de proteção com saldo insuficiente.

-----

Scenario 4 – Verificar a adesão ao plano de proteção pelo cliente no portal website com saldo suficiente

Scenario: 4 - Verificar a adesão ao plano de proteção pelo cliente no portal website com saldo suficiente
  Given que o cliente tenta aderir ao plano de proteção no Portal Website
  And o cliente tem saldo suficiente para completar o pagamento
  When a requisição POST /enrollAccountInProtectionPlan é enviada com os dados de pagamento válidos
  Then o status do plano de proteção deve ser exibido como "Ativado"
  And o status deve ser atualizado para "Completed" no painel do plano de proteção no Portal de Servicing
  And o status deve ser atualizado para "Completed" no painel do plano de proteção no Portal de Origination
  And verifique nos logs e no banco de dados que o cliente foi registrado corretamente como protegido

Verifique se, quando o cliente tem saldo suficiente, o plano de proteção é ativado e o status é atualizado para "Completed" nos portais Servicing e Origination.

-----

Scenario 5 – Verificar o comportamento após o cliente alterar seu email no portal website

Scenario: 5 - Verificar o comportamento após o cliente alterar seu email no portal website quando não está protegido
  Given que o cliente optou por não aderir ao plano de proteção
  And o cliente alterou seu email no portal website
  When o cliente faz login novamente com o novo email
  Then o banner "Plano de Proteção" deve ser exibido no Portal Website
  And verifique nos logs e no banco de dados que a alteração de email foi registrada corretamente

Verifique se, ao alterar o email no Portal Website, o banner de proteção é exibido corretamente quando o cliente não está protegido.

-----

Scenario 6 – Verificar o comportamento após o cliente alterar seu email no portal website quando protegido

Scenario: 6 - Verificar o comportamento após o cliente alterar seu email no portal website quando protegido
  Given que o cliente aderiu ao plano de proteção
  And o cliente alterou seu email no portal website
  When o cliente faz login novamente com o novo email
  Then o banner "Plano de Proteção" não deve ser exibido no Portal Website
  And verifique nos logs e no banco de dados que a alteração de email foi registrada corretamente
  And verifique nos logs e no banco de dados que o status de proteção do cliente é "protegido"

Verifique se, ao alterar o email no Portal Website, o banner de proteção não é exibido quando o cliente já está protegido.

-----

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verifique se o banner de proteção é exibido corretamente no topo da página quando a conta do usuário é elegível para o plano de proteção
Verify if the protection banner is displayed correctly at the top of the page when the user's account is eligible for the protection plan

Verifique se o banner de proteção não é exibido quando a conta do usuário não é elegível para o plano de proteção
Verify if the protection banner is not displayed when the user's account is not eligible for the protection plan

Verifique se o banner de proteção continua visível após o usuário alterar o email da conta no Portal de Servicing
Verify if the protection banner remains visible after the user changes the account email in the Servicing Portal

Verifique se o banner de proteção continua visível após o cliente alterar o email no Website
Verify if the protection banner remains visible after the customer changes the email on the Website

Verifique se, ao preencher os dados do cartão de crédito e o CEP no Portal do Website, a requisição POST para a inscrição no plano de proteção é enviada corretamente, incluindo todos os dados de pagamento necessários 
Check that, when filling in the credit card details and zip code on the Website Portal, the POST request for registration in the protection plan is sent correctly, including all necessary payment details

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in stg

| AccountPk | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ |
| 206264 | Verify if the protection banner is displayed correctly at the top of the page when the user's account is eligible for the protection plan | ![stg-126-c1_1_](/uploads/03fd04439eb6bddb7fc24541b56d70c8/stg-126-c1_1_.png){width=1437 height=741} | PASS |
| 206265 | Verify if the protection banner is not displayed when the user's account is not eligible for the protection plan | ![stg-126-c2_1_](/uploads/5fb21bb0f5da03b8ffe287da46c218b2/stg-126-c2_1_.png){width=1438 height=741}![stg-126-c2_2_](/uploads/7dfc6837340c4808c1c9cbb3e42abe80/stg-126-c2_2_.png){width=1438 height=741}![stg-126-c2_3_](/uploads/f787bdf9558938eae98b40dd22e79a34/stg-126-c2_3_.png){width=1173 height=82}![stg-126-c2_4_](/uploads/b3c9ef549814f8b9a47012d369074058/stg-126-c2_4_.png){width=1440 height=742} | PASS |
| 206279 | Verify if the protection banner remains visible after the user changes the account email in the Servicing Portal | ![stg-126-c_AlteraEmailServicing_1__](/uploads/b41556b0fb312b874b0e0784f3c92c43/stg-126-c_AlteraEmailServicing_1__.png){width=1440 height=742}![stg-126-c_AlteraEmailServicing_2__](/uploads/69ea882792da649f2a1490a485ece567/stg-126-c_AlteraEmailServicing_2__.png){width=1440 height=742}![stg-126-c_AlteraEmailServicing_3__](/uploads/e9206c10ad52a360ddc0e010bef20ee3/stg-126-c_AlteraEmailServicing_3__.png){width=1440 height=742}![stg-126-c_AlteraEmailServicing_4__](/uploads/4c5afe9c075b478c788cc0755a7c7438/stg-126-c_AlteraEmailServicing_4__.png){width=1440 height=742}![stg-126-c_AlteraEmailServicing_5__](/uploads/fb72e8c4cf10015e860ce418990970f7/stg-126-c_AlteraEmailServicing_5__.png){width=1440 height=742}![stg-126-c_AlteraEmailServicing_6__](/uploads/ed3333960a2c0ebcd3375faf3fa8622b/stg-126-c_AlteraEmailServicing_6__.png){width=1440 height=742} | PASS |
| 206276 | Verify if the protection banner remains visible after the customer changes the email on the Website | ![stg-126-c6_1_](/uploads/d69dd7e9d2e84790083478a4a539762b/stg-126-c6_1_.png){width=1436 height=741}![stg-126-c6_2_](/uploads/3c3a70cb859941f653a31652b717e617/stg-126-c6_2_.png){width=1436 height=741}![stg-126-c6_3_](/uploads/1bd71202a0d52661a04d3fc4cb50e681/stg-126-c6_3_.png){width=1436 height=741}![stg-126-c6_4_](/uploads/29b9e038b35b89a10d1f0ea86b1ad60e/stg-126-c6_4_.png){width=1436 height=741}![stg-126-c6_5_](/uploads/5bc9693a8ae6347a99d64484cd8f9889/stg-126-c6_5_.png){width=1436 height=741}![stg-126-c6_6_](/uploads/6492cf6aac473167bf120da33bdcebb2/stg-126-c6_6_.png){width=1436 height=741}![stg-126-c6_7_](/uploads/8bdd55909ffc71b4297918d7822992ec/stg-126-c6_7_.png){width=1436 height=741}![stg-126-c6_8_](/uploads/4078a0e2c639e7d9b119b2b5e26f03f4/stg-126-c6_8_.png){width=1164 height=54}![stg-126-c6_9_](/uploads/1dad9801bef230e1edf2335cf60fdae3/stg-126-c6_9_.png){width=1430 height=741}![stg-126-c6_10_](/uploads/dc4f67dde193d38392f5f0c98f5f8343/stg-126-c6_10_.png){width=1430 height=741} | PASS |
| 206266 | Check that, when filling in the credit card details and zip code on the Website Portal, the POST request for registration in the protection plan is sent correctly, including all necessary payment details | ![stg-126-c4_4_](/uploads/6271831998a507b72c95085935828700/stg-126-c4_4_.png){width=1440 height=810}![stg-126-c4_5_](/uploads/29f8a2224778832b3d7d5c7d01b64443/stg-126-c4_5_.png){width=1439 height=738}![stg-126-c4_7_](/uploads/641a114c30792d18304670858a6e73c8/stg-126-c4_7_.png){width=1439 height=738}![stg-126-c4_8_](/uploads/d34ec0c7cc3575984adff49a1d69a60c/stg-126-c4_8_.png){width=1439 height=738} | PASS |
| 206279 | Pogress Mobility | Verify if, when joining the protection plan through the Website Portal, the "Opted In" status is correctly activated in the Servicing portal and that the enrollment date is recorded | ![stg-126-c3_1_](/uploads/f500d190954732f50611c1c9aff39373/stg-126-c3_1_.png){width=1437 height=741}![stg-126-c3_2_](/uploads/1928897cd7edbc45ad596e853c0b7576/stg-126-c3_2_.png){width=1440 height=810}![stg-126-c3_3_](/uploads/fdb16251748542121d9331ba43a650e5/stg-126-c3_3_.png){width=1437 height=741}![stg-126-c3_4_](/uploads/a57fb8268adb06ae8c42ca41877b73f1/stg-126-c3_4_.png){width=1437 height=741}![stg-126-c3_5_](/uploads/1cd7fa2d48f9c6e02756f946a97614d3/stg-126-c3_5_.png){width=1437 height=741}![stg-126-c3_6_](/uploads/2b754fa75959bbc6ac9ee1a0b7df10d1/stg-126-c3_6_.png){width=1437 height=741}![stg-126-c3_7_](/uploads/02e0004f0795ad6385f9931bfa05a3e7/stg-126-c3_7_.png){width=1437 height=741}![stg-126-c3_8_](/uploads/f1d36290ba5ab59bdd54ef7aa86f8c16/stg-126-c3_8_.png){width=1437 height=741}![stg-126-c3_9_](/uploads/46b045dd6390c98037d34e9dcbba2225/stg-126-c3_9_.png){width=1437 height=741}![stg-126-c3_10_](/uploads/7750b8869ab9cce73808e0bcf18040ce/stg-126-c3_10_.png){width=1437 height=741} | PASS |
| 206276 | Pogress Mobility | Verify if the error message is displayed correctly in both Servicing and Origination portals when the customer tries to join the protection plan in the Website Portal and the payment details are inconsistent | ![stg-126-c4_1_](/uploads/ee4cb1b875940d817e8b5c641258414f/stg-126-c4_1_.png){width=1437 height=741}![stg-126-c4_2_](/uploads/974394be20786ab7c13b8ff78446a038/stg-126-c4_2_.png){width=1440 height=810}![stg-126-c4_3_](/uploads/439984a91e0cc2cf631107b659fd733d/stg-126-c4_3_.png){width=1440 height=810}![stg-126-c4_4_](/uploads/b18061f005f047ded51a7d96c63c35f0/stg-126-c4_4_.png){width=1440 height=810}![stg-126-c4_5_](/uploads/c31dfff9f6423b89e18ba9b1447d5da0/stg-126-c4_5_.png){width=1439 height=738}![stg-126-c4_7_](/uploads/ddd24fae0052405e9c0f83338dffa64e/stg-126-c4_7_.png){width=1439 height=738}![stg-126-c4_8_](/uploads/3abf8e66ae6e74dc9c453c8584ad61c8/stg-126-c4_8_.png){width=1439 height=738}![stg-126-c4_9_](/uploads/1c66dd2a502a3c74739dfeac66d3e5cb/stg-126-c4_9_.png){width=1440 height=810}![stg-126-c4_10_](/uploads/bd414eadaaaf0d7c7df4356200c8ad31/stg-126-c4_10_.png){width=1434 height=742} | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in stg

------------------------------------------------------------------------------------------------------------------------------------------------------------------
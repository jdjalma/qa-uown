------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/servicing/-/issues/459

------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Servicing | Display and cc_peek_consent on the Servicing & Origination Portal

Synopsis
Based on the task of implementing a Pre-Authorization Form to obtain customer cc_peek_consent. In this task we have to add cc_peek_consent in the Origination and Servicing Portals:
Origination: For viewing purposes only, it will be displayed below the Credit Card section.
Servicing: This will be editable and will be in the Servicing Information section, a toggle button will be used for this and also the consent date.

Business Objective
Enable the Uown Agent to access and edit the customer consent for credit card peek authorization.

Feature Request | Business Requirements
* Make a change in the front-end so that the cc_peek_consent flag is displayed on both Origination and Servicing;
* The flag should be editable in Servicing (display in Servicing information section);
* Back-End should be able to update this flag. An activity log must be created;
* Create a menu nexto to Credit Card infos as shown in the mockup attached (video).
* Display the consent date when the flag is activated.


davi marra @davimarrauownleasing

✅ Steps to Reproduce:

On the Servicing Portal:
* Navigate to the Customer Information page.
* You should see the newly added fields: CC Peek Consent and Consent Date.
* These fields can be updated by clicking the edit icon in the Servicing Information section.
    * If the CC Peek Consent toggle is disabled, the Consent Date will also appear as disabled or empty (-).
    * If the toggle is enabled, the Consent Date will be automatically populated with the current date.
* Once saved, these fields will be updated in the account table.

On the Origination Portal:
* The fields CC Peek Consent and Consent Date are now displayed inside a new panel called Credit Card Peek Consent.
* In this view, the data is read-only – no edit mode is available.
* The values are pulled from the account and can be seen on the lead table.

-----

UOWN | Atendimento | Exibição e cc_peek_consent no Portal de Atendimento e Origination

Sinopse
Com base na tarefa de implementar um Formulário de Pré-Autorização para obter o cc_peek_consent do cliente. Nesta tarefa, devemos adicionar cc_peek_consent nos Portais de Originação e Atendimento:

Origination: Apenas para fins de visualização, será exibido abaixo da seção de Cartão de Crédito.
Atendimento: Será editável e estará na seção de Informações de Atendimento, um botão toggle será usado para isso e também para a data de consentimento.

Objetivo de Negócio
Permitir que o Agente Uown acesse e edite o consentimento do cliente para autorização de visualização do cartão de crédito.
Solicitação de Recurso | Requisitos de Negócio

Fazer uma alteração no front-end para que a flag cc_peek_consent seja exibida tanto na Originação quanto no Atendimento;
A flag deve ser editável no Atendimento (exibida na seção de Informações de Atendimento);
O Back-End deve ser capaz de atualizar esta flag. Um registro de atividade deve ser criado;
Criar um menu ao lado das informações do Cartão de Crédito conforme mostrado no mockup anexado (vídeo).
Exibir a data de consentimento quando a flag for ativada.
     quando é ativado, consent date é igual nos portais origination e servicing?

davi marra @davimarrauownleasing
✅ Passos para Reproduzir:
No Portal de Atendimento:

Navegue até a página de Informações do Cliente.
Você deverá ver os campos recém-adicionados: CC Peek Consent e Data de Consentimento.
Esses campos podem ser atualizados clicando no ícone de edição na seção Informações de Atendimento.

Se o toggle CC Peek Consent estiver desativado, a Data de Consentimento também aparecerá como desativada ou vazia (-).
Se o toggle estiver ativado, a Data de Consentimento será automaticamente preenchida com a data atual.


Depois de salvo, esses campos serão atualizados na tabela de contas.

No Portal de Originação:

Os campos CC Peek Consent e Data de Consentimento agora são exibidos dentro de um novo painel chamado Consentimento para Visualização de Cartão de Crédito.
Nesta visualização, os dados são somente leitura – nenhum modo de edição está disponível.
Os valores são extraídos da conta e podem ser vistos na tabela de leads.

-----

Validar em todos os cenários de testes se for possível e criar um cenário caso algum nao se enquadre nos cenários existentes:
* Registro de Logs;
* Verificar as alterações salvas no Banco de dados;
* Prevent Default no botão salvar com  a rede em conexão lenta;

verificar se o cara tem dinheiro antes de fazer a cobranca
ficará no painel de informacoes no servicing inferior direita
cliente assinou o termo de consentimento exibe em servicing 
agent em servicing pode alterar
em origination a informação ficará abaixo do container financeiro de cartao de credito
editavel somente em servicing NAO E EDITAVEL EM ORIGINATION
apresentar informacao no log da alteracao do ccPeek
apresentar data de ativacao do ccPeek
em servicing, quando ativar pega a data atual
quando assina pega a data da assinatura

cliente assina o contrato e seleciona ccpeek sim ou nao, deve apresentar em servicing se sim ativado com a data se nao desativado
quando ele manipula em servicing, liga mostra a data atual, desligou nao mostra data

objetivo é mostrar se o cliente aderiu ou nao ao ccpeek e permitir que o agent altere quando o cliente entrar em contato e pedir para ativar ou desativar.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

📋 Requisito da Tarefa
Adicionar e exibir o campo de consentimento de visualização do cartão de crédito (cc_peek_consent) tanto no Portal de Originação (somente para visualização) 
quanto no Portal de Atendimento (editável). A data de consentimento deve ser exibida ou alterada conforme o status da flag cc_peek_consent.

🧪 Cenários de Teste Gherkin

Scenario 1
Scenario Outline – Verificar se o campo cc_peek_consent e a Data de Consentimento são exibidos corretamente no Portal de Originação e Servicing após assinatura do contrato

Scenario Outline: 1 - Verificar se o campo cc_peek_consent e a Data de Consentimento são exibidos corretamente no Portal de Originação e Servicing após assinatura do contrato
  Given que o cliente assina o contrato selecionando "cc_peek_consent" como <cc_peek_consent_status> no Portal de Atendimento
  When o cliente acessa a página de informações no Portal de Servicing
  Then o campo "cc_peek_consent" deve estar <cc_peek_consent_status> e a data de consentimento deve exibir <consent_date_status>
  When o cliente acessa a página de informações no Portal de Origination
  Then o campo "cc_peek_consent" deve estar <cc_peek_consent_status> e a data de consentimento deve exibir <consent_date_status>

Examples:
  | cc_peek_consent_status | consent_date_status |
  | true                   | a data da assinatura |
  | false                  | não exibida          |

🔍 Verifique se o campo cc_peek_consent e a Data de Consentimento são exibidos corretamente no Portal de Servicing e Portal de Origination, conforme o valor de cc_peek_consent selecionado.
📝 Explicação: Este cenário usa um Scenario Outline para testar tanto os casos em que cc_peek_consent está ativado (true) quanto desativado (false), verificando a exibição correta da Data de Consentimento.
✅ Resultado Esperado:

Quando cc_peek_consent for true: O campo cc_peek_consent será ativado e a Data de Consentimento será exibida com a data da assinatura do contrato.
Quando cc_peek_consent for false: O campo cc_peek_consent será desativado e a Data de Consentimento não será exibida em ambos os portais.

Frase de Verificação para Evidenciar a Tarefa
Verifique se, ao assinar o contrato e selecionar cc_peek_consent como true ou false, o campo cc_peek_consent e a Data de Consentimento são atualizados corretamente no Portal de Servicing e no Portal de Origination, refletindo o estado de ativação ou desativação do consentimento de visualização do cartão de crédito.

Frase de Verificação para Evidenciar a Tarefa
Verifique se, ao assinar o contrato e selecionar cc_peek_consent como true ou false, o campo cc_peek_consent e a Data de Consentimento são atualizados 
corretamente no Portal de Servicing e Portal de Origination, refletindo o estado do consentimento de visualização do cartão de crédito

-----

Scenario 2
Scenario Outline - Verificar se o campo cc_peek_consent é editável no Portal de Servicing e reflete a alteração no Portal de Origination

Scenario Outline: 2 - Verificar se o campo cc_peek_consent é editável no Portal de Servicing e reflete a alteração no Portal de Origination
  Given que o usuário acessa a página de informações de atendimento no Portal de Servicing
  When o campo "cc_peek_consent" é exibido
  Then o campo "cc_peek_consent" deve ser editável e permitir a alteração do valor
  And se o "cc_peek_consent" for ativado em Servicing, a data de ativação deve ser exibida em Servicing
  And no Portal de Origination, o campo "cc_peek_consent" deve refletir a alteração e a data de ativação
  When o "cc_peek_consent" é desativado em Servicing
  Then a data de ativação deve ser removida em Servicing
  And no Portal de Origination, o campo "cc_peek_consent" deve refletir a desativação e não exibir a data de ativação

Examples:
  | cc_peek_consent_status | consent_date_status   |
  | true                   | data de ativação      |
  | false                  | não exibida           |

🔍 Verifique se, ao alterar o valor de cc_peek_consent no Portal de Servicing, a alteração é refletida corretamente no Portal de Origination. Quando o cc_peek_consent for ativado, a Data de Ativação deve ser exibida. Quando o cc_peek_consent for desativado, a Data de Ativação deve ser removida, e a alteração deve ser refletida em ambos os portais.
📝 Explicação: Este cenário usa Scenario Outline e Examples para testar tanto o caso de ativação quanto desativação do cc_peek_consent, verificando se a alteração é refletida em ambos os portais. A data de ativação deve ser exibida quando o consentimento for ativado e removida quando desativado.
✅ Resultado Esperado: O campo cc_peek_consent será editável no Portal de Servicing e refletirá corretamente no Portal de Origination, com a Data de Ativação exibida ou removida conforme o status de cc_peek_consent.

Frase de Verificação para Evidenciar a Tarefa
Verifique se, ao editar o campo cc_peek_consent no Portal de Servicing, a alteração é refletida no Portal de Origination, incluindo a Data de Ativação quando ativado e a remoção da data quando desativado

-----

Scenario 3
Scenario Outline - Verificar se a Data de Consentimento é exibida automaticamente no Portal de Atendimento e reflete as alterações no Portal de Originação

Scenario Outline: 3 - Verificar se a Data de Consentimento é preenchida automaticamente no Portal de Atendimento e reflete as alterações no Portal de Origination
  Given que o toggle de "cc_peek_consent" está <cc_peek_consent_status> no Portal de Atendimento
  When a data de consentimento é exibida no Portal de Atendimento
  Then a data de consentimento deve ser <consent_date_status> no Portal de Atendimento
  And no Portal de Origination, o campo "cc_peek_consent" deve refletir a alteração e exibir a mesma data de consentimento

Examples:
  | cc_peek_consent_status | consent_date_status   |
  | true                   | preenchida com a data atual |
  | false                  | não exibida           |

🔍 Verifique se, ao ativar ou desativar o toggle cc_peek_consent no Portal de Atendimento, a Data de Consentimento é preenchida ou removida automaticamente, e se a alteração é refletida corretamente no Portal de Origination.
📝 Explicação: Esse cenário usa Scenario Outline e Examples para validar que a Data de Consentimento seja exibida no Portal de Atendimento quando o cc_peek_consent for ativado e não exibida quando desativado, e que o Portal de Origination acompanhe essa alteração.
✅ Resultado Esperado: Quando cc_peek_consent é ativado, a Data de Consentimento é preenchida automaticamente com a data atual tanto no Portal de Atendimento quanto no Portal de Origination. Quando cc_peek_consent é desativado, a Data de Consentimento é removida, e essa alteração é refletida nos dois portais.

Frase de Verificação para Evidenciar a Tarefa
Verifique se, ao ativar ou desativar o toggle cc_peek_consent no Portal de Atendimento, a Data de Consentimento é exibida ou removida corretamente, e se a alteração é refletida de forma consistente no Portal de Origination

-----

🧾 Resumo dos Requisitos e Cenários

| Requisito                                         |                             Cenário(s) que cobre |
| Exibir o campo cc_peek_consent no Portal de Originação (somente leitura)	                    | 1, 6 |
| Tornar o campo cc_peek_consent editável no Portal de Atendimento	                               | 2 |
| Exibir e atualizar a data de consentimento corretamente ao ativar/desativar o cc_peek_consent	| 3, 4 |
| Garantir que o valor de cc_peek_consent seja salvo corretamente e exibido após salvar	           | 5 |
| Gerar logs detalhados para alterações no campo cc_peek_consent	                               | 7 |

------------------------------------------------------------------------------------------------------------------------------------------------------------------


Verify that when signing the contract and selecting cc_peek_consent as true or false, the cc_peek_consent field and Consent Date are correctly updated in both Servicing Portal and Origination Portal, reflecting the credit card peek consent state
Verificar se, ao assinar o contrato e selecionar cc_peek_consent como true ou false, o campo cc_peek_consent e a Data de Consentimento são atualizados corretamente no Portal de Servicing e Portal de Origination, refletindo o estado do consentimento de visualização do cartão de crédito

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa1

| LeadPk/AccountPk | Merchant | Test Case | Test Data | Status | Observation |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 8540 | Tire Agent | Verify that when signing the contract and selecting cc_peek_consent as true or false, the cc_peek_consent field and Consent Date are correctly updated in both Servicing Portal and Origination Portal, reflecting the credit card peek consent state | ![qa1-459-ccPeekTrue-c1_c1___1_](/uploads/5df472926cfc8c8e18453d2bd69d7745/qa1-459-ccPeekTrue-c1_c1___1_.png){width=1415 height=738}![qa1-459-ccPeekTrue-c1_c1___2_](/uploads/fb0b4b768bbb6e4c8cef5cb4bb52f402/qa1-459-ccPeekTrue-c1_c1___2_.png){width=1415 height=738}![qa1-459-ccPeekTrue-c1_c1___3_](/uploads/95d166048b01bff7d3a5b248ba88cf61/qa1-459-ccPeekTrue-c1_c1___3_.png){width=1415 height=738}![qa1-459-ccPeekFalse-c1_E1___1_](/uploads/b67a5ea296e7e486052605267e0602d3/qa1-459-ccPeekFalse-c1_E1___1_.png){width=1119 height=733}![qa1-459-ccPeekFalse-c1_E1___2_](/uploads/d1686b1eb12794239941a034f8cf969f/qa1-459-ccPeekFalse-c1_E1___2_.png){width=1415 height=738}![qa1-459-ccPeekFalse-c1_E1___3_](/uploads/af3612edb3c8d37e4bd1024fbdf28181/qa1-459-ccPeekFalse-c1_E1___3_.png){width=1145 height=82}![qa1-459-ccPeekFalse-c1_E1___4_](/uploads/f0b62ff0adc6cfbbea372ed775b092a3/qa1-459-ccPeekFalse-c1_E1___4_.png){width=1119 height=726}![qa1-459-ccPeekFalse-c1_E1___5_](/uploads/3e56b2fc0cedcbe22da4d6ad938dfef3/qa1-459-ccPeekFalse-c1_E1___5_.png){width=1425 height=801}![qa1-459-ccPeekFalse-c1_E1___6_](/uploads/e91e0b35d522d9842715945ac12056d1/qa1-459-ccPeekFalse-c1_E1___6_.png){width=1425 height=801}![qa1-459-ccPeekFalse-c1_E1___7_](/uploads/5bc77c90d1615e0384936d6eebf328a5/qa1-459-ccPeekFalse-c1_E1___7_.png){width=1425 height=801}![qa1-459-ccPeekFalse-c1_E1___8_](/uploads/26e23280352ed2f6ff6400eb3f36260e/qa1-459-ccPeekFalse-c1_E1___8_.png){width=1140 height=80}![qa1-459-ccPeekFalse-c1_E1___9_](/uploads/91a5c1625b81e98cc441fc81a1a2ae52/qa1-459-ccPeekFalse-c1_E1___9_.png){width=1430 height=741}![qa1-459-ccPeekFalse-c1_E1___10_](/uploads/6378838eb9bd90b6b78a52ba55933a56/qa1-459-ccPeekFalse-c1_E1___10_.png){width=1430 height=741}![qa1-459-ccPeekFalse-c1_E1___11_](/uploads/cd6be866f4a090b29848b4e3b2ffb3d1/qa1-459-ccPeekFalse-c1_E1___11_.png){width=1430 height=741} | PASS | When "No" is selected for CC Peek Consent, it displays and stores as "true". When "Yes" is selected for CC Peek Consent, the Consent Date is not displayed in Origination |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa1

| LeadPk/AccountPk | Merchant | Test Case | Test Data | Status | Observation |
| ------ | ------ | ------ | ------ | ------ | ------ |
|  | Tire Agent | Verify that when signing the contract and selecting cc_peek_consent as true or false, the cc_peek_consent field and Consent Date are correctly updated in both Servicing Portal and Origination Portal, reflecting the credit card peek consent state |  | PASS |  |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa1

------------------------------------------------------------------------------------------------------------------------------------------------------------------

stg

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Cenário 1 – Verificar se o campo cc_peek_consent e a Data de Consentimento são exibidos corretamente após assinatura do contrato
Objetivo: Verificar se, após o cliente assinar o contrato com a escolha de "cc_peek_consent" como true ou false, o campo e a data de consentimento são corretamente atualizados nos portais de Servicing e Origination.

Scenario Outline: Verificar se o campo cc_peek_consent e a Data de Consentimento são exibidos corretamente nos portais de Originação e Servicing após assinatura do contrato.
Given que o cliente assina o contrato selecionando "cc_peek_consent" como <cc_peek_consent_status> no Portal de Atendimento
When o agente acessa a página de informações no Portal de Servicing
Then o campo "cc_peek_consent" deve estar <cc_peek_consent_status> e a data de consentimento deve exibir <consent_date_status>
When o agente acessa a página de informações no Portal de Origination
Then o campo "cc_peek_consent" deve estar <cc_peek_consent_status> e a data de consentimento deve exibir <consent_date_status>
And verifique nos logs e no banco de dados que a alteração foi registrada corretamente

Example:
|cc_peek_consent_status	| consent_date_status|
|true                   | a data da assinatura|
|false	                |     não exibida     |

🔍 Verifique se o campo cc_peek_consent e a Data de Consentimento são exibidos corretamente nos portais de Servicing e Origination, refletindo o valor de cc_peek_consent selecionado durante a assinatura do contrato, com a Data de Consentimento sendo exibida ou não dependendo do status de ativação do campo
📝 Explicação: Este cenário testa a exibição do campo cc_peek_consent e a Data de Consentimento após a assinatura do contrato, considerando tanto o valor ativado quanto desativado. 
✅ Resultado Esperado: O campo cc_peek_consent será exibido corretamente nos dois portais, com a Data de Consentimento atualizada de acordo com o status de cc_peek_consent e registrado nos logs e banco de dados.

-----

Cenário 2 – Verificar a edição do campo cc_peek_consent no Portal de Servicing e a não reflexão no Portal de Origination
Objetivo: Verificar se o campo cc_peek_consent pode ser editado no Portal de Servicing e se a alteração não é refletida no Portal de Origination.

Scenario Outline: Verificar a edição do campo cc_peek_consent no Portal de Servicing e a não reflexão no Portal de Origination

Given que o usuário acessa a página de informações de atendimento no Portal de Servicing
When o campo "cc_peek_consent" é exibido
Then o campo "cc_peek_consent" deve ser editável e permitir a alteração do valor
And se o "cc_peek_consent" for ativado em Servicing, a data de ativação deve ser exibida em Servicing
When o "cc_peek_consent" é desativado em Servicing
Then a data de ativação deve ser removida em Servicing
And no Portal de Origination, o campo "cc_peek_consent" não deve refletir essa alteração
And verifique nos logs e no banco de dados que a alteração foi registrada corretamente

Examples:
|cc_peek_consent_status	| consent_date_status|
|true	                  |    data de ativação|
|false	                |         não exibida|

🔍 Verifique se, ao editar o valor de cc_peek_consent no Portal de Servicing, a alteração é refletida apenas neste portal e não no Portal de Origination, garantindo que o Origination mostre o valor de cc_peek_consent selecionado ao assinar o contrato
📝 Explicação: Esse cenário valida que, mesmo quando o campo é editado no Servicing, as alterações não devem ser refletidas no Origination. 
✅ Resultado Esperado: O campo cc_peek_consent será editável no Portal de Servicing, mas não refletirá alterações no Portal de Origination. O log e banco de dados devem registrar a alteração corretamente.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verifique se o campo cc_peek_consent e a Data de Consentimento são exibidos corretamente nos portais de Servicing e Origination, refletindo o valor de cc_peek_consent selecionado durante a assinatura do contrato, com a Data de Consentimento sendo exibida ou não dependendo do status de ativação do campo
Verify if the cc_peek_consent field and the Consent Date are correctly displayed in the Servicing and Origination portals, reflecting the cc_peek_consent value selected during contract signing, with the Consent Date being displayed or not depending on the field's activation status

Verifique se, ao editar o valor de cc_peek_consent no Portal de Servicing, a alteração é refletida apenas neste portal e não no Portal de Origination, garantindo que o Origination mostre o valor de cc_peek_consent selecionado ao assinar o contrato
Verify if, when editing the cc_peek_consent value in the Servicing Portal, the change is reflected only in this portal and not in the Origination Portal, ensuring that Origination shows the cc_peek_consent value selected when signing the contractRetryClaude can make mistakes. Please double-check responses

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in stg

| LeadPk/AccountPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 23329/206268 | Progress Mobility | Verify if the cc_peek_consent field and the Consent Date are correctly displayed in the Servicing and Origination portals, reflecting the cc_peek_consent value selected during contract signing, with the Consent Date being displayed or not depending on the field's activation status |  | PASS |
| 23330/206268 | Progress Mobility | Verify if, when editing the cc_peek_consent value in the Servicing Portal, the change is reflected only in this portal and not in the Origination Portal, ensuring that Origination shows the cc_peek_consent value selected when signing the contractRetryClaude can make mistakes. Please double-check responses |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in stg

------------------------------------------------------------------------------------------------------------------------------------------------------------------
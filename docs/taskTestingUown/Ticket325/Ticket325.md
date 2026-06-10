------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/325

------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Originação | Adicionar Bandeira do Comerciante para Negar Aplicações Automaticamente

Sinopse
Um novo sinalizador de nível de comerciante precisa ser introduzido, que, quando ativado, negará automaticamente todos os pedidos enviados por esse comerciante. 
Isso permitirá que os aplicativos prossigam pelo fluxo normal, mas assegure-se de que sempre resultem em negação, sem alertar o comerciante.

Objetivo Empresarial
Permitir a negação controlada de aplicativos para comerciantes específicos sob investigação ou revisão de conformidade.

Pedido de Funcionalidade | Requisitos de Negócio  
Adicionar um Novo Sinalizador à Configuração do Comerciante:
      Introduzir um novo sinalizador (auto deny applications) no configurações do comerciante.
      Esta bandeira deve ser alternável e padrão para falso.
 
Modificar a Lógica de Processamento de Aplicações:
      Se a bandeira é ativado todas as solicitações enviadas pelo comerciante devem ser negadas automaticamente.
      Certifique-se de que isso aconteça antes das etapas de subscrição ou aprovação.
  
Negar Aplicações Sem Alertar Comerciantes:
      As aplicações devem proceder como normal, mas o a decisão final deve ser sempre “Denied”.
      Nenhuma mensagem de erro deve ser exibida para merchants—just a resposta de negação de aplicação padrão.


Etapas de Teste:
Escolha um comerciante e selecione o sinalizador de negação automática:
Crie um lease e valide se é negado.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Feature: Rejeição Automática de Aplicações com Base nas Configurações do Merchant

  Background:
    Given estou logado no sistema como um usuário administrador
    And navego até a página de configuração do merchant

  Scenario Outline: Ativar configuração "Auto Deny Application" e verificar resultado ao criar lease via API
    When seleciono um merchant
    And <acao> a opção "Auto Deny Application"
    And salvo as alterações
    And submeto uma nova aplicação de lease para este merchant
    Then a aplicação deve <resultado>
    And o banco de dados deve refletir o status "<status_banco>" com status interno "<status_interno>"

    Examples:
      | acao     | resultado                        | status_banco | status_interno         |
      | ativo    | ser automaticamente negada      | Denied       | MERCHANT_AUTO_DENIED   |

  Scenario Outline: Desativar configuração "Auto Deny Application" e verificar resultado
    When seleciono um merchant
    And <acao> a opção "Auto Deny Application"
    And salvo as alterações
    And submeto uma nova aplicação de lease para este merchant
    Then a aplicação deve <resultado>
    And o banco de dados deve refletir o status "<status_banco>" com status interno "<status_interno>"

    Examples:
    | acao     | resultado                        | status_banco | status_interno         |
    | desativo | seguir o fluxo normal           | Aprovado     | UW_APPROVED      |

  Scenario Outline: Verificar rejeição do lease com a configuração Offer Protection Plan marcada
    When seleciono um merchant
    And ativo as opções:
      | Configuração                     |
      | <opcao1>                          |
      | <opcao2>                          |
    And salvo as alterações
    And submeto uma nova aplicação de lease para este merchant
    Then a aplicação deve ser automaticamente negada
    And devo ver a mensagem "Sorry, unfortunately your application is not accepted"
    And o banco de dados deve refletir o status "Denied" com status interno "MERCHANT_AUTO_DENIED"

    Examples:
      | opcao1                |
      | Offer Protection Plan  |

    Scenario Outline: Ativar configuração "Auto Deny Application" e verificar resultado ao criar lease manualmente
    When seleciono um merchant
    And <acao> a opção "Auto Deny Application"
    And salvo as alterações
    And submeto uma nova aplicação de lease para este merchant
    Then a aplicação deve <resultado>
    And o banco de dados deve refletir o status "<status_banco>" com status interno "<status_interno>"

    Examples:
      | acao     | resultado                        | status_banco | status_interno         |
      | ativado    | ser automaticamente negada      | Denied       | MERCHANT_AUTO_DENIED   |

    

------------------------------------------------------------------------------------------------------------------------------------------------------------------
Tests in qa1

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 8087, 8090, 8092, 8094, 8096, 8098, 8100 | Pay Tomorrow, Daniel's Jewelers, Progress Mobility, MyeyeMed, WeGetFinancing, Terrace Finance, Tire Agent | Verify that enabling the "Auto Deny Application" setting results in automatic denial when creating a lease via API. |  | PASS |
| 8101 | Tire Agent | Verify that disabling the "Auto Deny Application" setting allows the lease to be created normally. |  | PASS |
| 8088 | Pay Tomorrow | Verify that enabling the "Auto Deny Application" setting results in automatic denial when creating a lease manually. |  | PASS |
| 8090 | Daniel's Jewelers | Verify if an error message is logged when the application is denied. |  | PASS |
| -- | testMerchant  | Verify if the default value of the "Auto Deny Application" option is false. |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verifique que a ativação da configuração "Auto Deny Application" resulta na negação automática ao criar um lease via API.
Verify that enabling the "Auto Deny Application" setting results in automatic denial when creating a lease via API.

Verifique que a desativação da configuração "Auto Deny Application" permite a criação do lease normalmente.
Verify that disabling the "Auto Deny Application" setting allows the lease to be created normally.

Verifique que a ativação da configuração "Auto Deny Application" resulta na negação automática ao criar um lease manualmente.
Verify that enabling the "Auto Deny Application" setting results in automatic denial when creating a lease manually.

Verificar se é exibido mensagem de erro no log, quando o aplicativo é negado
Verificar se o padrão da opção Auto Deny Application é falso.

Verifique se uma mensagem de erro é registrada no log quando a aplicação é negada.
Verify if an error message is logged when the application is denied.

Verifique se o valor padrão da opção "Auto Deny Application" é falso.
Verify if the default value of the "Auto Deny Application" option is false.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa1

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in staging

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 19939 | Tire Agent | Verify that enabling the "Auto Deny Application" setting results in automatic denial when creating a lease via API |  | PASS |
| 19941 | Tire Agent | Verify that disabling the "Auto Deny Application" setting allows the lease to be created normally via API |  | PASS |
| 19942 | Tire Agent | Verify that enabling the "Auto Deny Application" setting results in automatic denial when creating a lease manually |  | PASS |
| 19942 | Tire Agent | Verify if an error message is logged when the application is denied |  | PASS |
| -- | Terrace Finance | Verify if the default value of the "Auto Deny Application" option is false |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in staging

------------------------------------------------------------------------------------------------------------------------------------------------------------------
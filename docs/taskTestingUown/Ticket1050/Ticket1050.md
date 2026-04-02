-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Origination | Implement PLAID Integration

Synopsis
Our platform currently lacks integration with Plaid, a widely adopted technology platform that enables secure connections between financial applications and bank accounts. The absence of this integration limits automation and efficiency in accessing users' banking data, negatively affecting user experience and overall product competitiveness.

Business Objective
Implementing Plaid integration will allow users to securely and efficiently connect their bank accounts, improving trust in the platform and enabling features that rely on real-time financial data. This will enhance user convenience and reduce the need for manual data entry.

Feature Request | Business Requirements
Implement integration with the Plaid API, following best practices for secure authentication as outlined in the official documentation:

https://plaid.com/docs/check/#integration-overview

https://plaid.com/docs/check/add-to-app/#listen-for-webhooks
Ensure the front-end uses Plaid Link to facilitate authentication and connection with financial institutions.
The back-end must handle token exchange securely and store tokens in compliance with data security standards and regulatory requirements.
Validate the complete flow for account authorization, connection, and retrieval of bank data via Plaid.
Add logging and metrics to enable traceability of the integration process.
Implement unit and integration tests covering critical points of the flow.

-----

UOWN | Originação | Implementar Integração com Plaid

Aberto

Tíquete criado há 1 mês por Yuri Araujo

Sinopse

Nossa plataforma atualmente não possui integração com o Plaid, uma plataforma de tecnologia amplamente adotada que permite conexões seguras entre aplicativos financeiros e 
contas bancárias. A ausência dessa integração limita a automação e a eficiência no acesso aos dados bancários dos usuários, 
impactando negativamente a experiência do usuário e a competitividade geral do produto.

Objetivo de Negócio

A implementação da integração com o Plaid permitirá que os usuários conectem suas contas bancárias de forma segura e eficiente, 
aumentando a confiança na plataforma e habilitando recursos que dependem de dados financeiros em tempo real. Isso melhorará 
a conveniência do usuário e reduzirá a necessidade de entrada manual de dados.

Solicitação de Recurso | Requisitos de Negócio
Implementar a integração com a API do Plaid, seguindo as melhores práticas para autenticação segura, conforme descrito na documentação oficial:

https://plaid.com/docs/check/#integration-overview

https://plaid.com/docs/check/add-to-app/#listen-for-webhooks

Garantir que o front-end utilize o Plaid Link para facilitar a autenticação e a conexão com instituições financeiras.
O back-end deve gerenciar a troca de tokens de forma segura e armazenar os tokens em conformidade com os padrões de segurança de dados e requisitos regulatórios.
Validar o fluxo completo de autorização de conta, conexão e recuperação de dados bancários via Plaid.
Adicionar logs e métricas para permitir a rastreabilidade do processo de integração.
Implementar testes unitários e de integração que cubram os pontos críticos do fluxo.

Marcos Silvano
@marcos.pacheco.silva
4 dias atrás
Maintainer

Instruções de teste
Reproduzível apenas no Sandbox

Vá para as configurações de um comerciante e ative a verificação do Plaid.

Crie uma nova aplicação para esse cliente, preencha todas as informações obrigatórias. Na última etapa, onde normalmente aparece a mensagem de parabéns pela aprovação, deve ser exibido um botão para conectar ao Plaid em vez disso. Clique no botão, preencha com as credenciais de teste e, uma vez concluído, uma nova entrada deve existir na tabela PlaidReport.

Também teste aplicações com o Plaid desativado.

A página precisa ser testada cuidadosamente em dispositivos móveis.

É necessário um número de telefone válido para completar o fluxo do Plaid, e será solicitado um usuário e senha. Procure por usuário e senha nos valores em #credit-and-income-testing-credentials na documentação do Plaid:
https://plaid.com/docs/sandbox/test-credentials/#credit-and-income-testing-credentials

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

1. Requisitos e Critérios de Aceite
Funcionais:
Ativação/desativação do Plaid no merchant.
Fluxo completo de conexão Plaid: autenticação, login, seleção de instituição, consentimento, sucesso/erro.
Persistência correta do relatório na tabela PlaidReport após finalização.
Teste para merchants com Plaid desativado (o botão Plaid não deve aparecer).
Validação de logging/erros e mensagens amigáveis para o usuário.
Compatibilidade mobile.

Não Funcionais:
Segurança: tokens não aparecem no front, fluxo seguro.
Logs e métricas adequadas (validação manual por log).
UX: feedback claro para o usuário nas etapas do fluxo Plaid.

-----

3. Pontos Críticos para Automação (UI/API)
UI Testes (Selenium/Cucumber):
Criação de aplicação e navegação até o passo do Plaid.
Abertura do modal/iframe do Plaid Link.
Interação dentro do Plaid (usuário/senha, seleção de instituição, consentimento).
Verificação da existência do botão "Connect with Plaid" (presente/ausente).
Checagem de feedback visual de sucesso/falha.
Responsividade/mobile via Selenium Grid ou BrowserStack.

API Testes (Rest-Assured):
Mock de requisição para /getPlaidToken e simulação dos retornos.
Checagem da criação de registros na tabela PlaidReport após fluxo.
Verificação de segurança dos tokens.

-----

 Checklist de Testes Manuais
Ativar/desativar Plaid no painel do merchant.
Testar todas as credenciais do sandbox disponíveis na documentação da Plaid, cobrindo fluxos normais, MFA, falhas e usuários de teste específicos.
Validar UX em diferentes browsers e dispositivos.
Confirmar via banco/logs a persistência correta dos relatórios.

-----

| Cenário                               | Requisito                                                 | Observação        |
| ------------------------------------- | --------------------------------------------------------- | ----------------- |
| Exibição do botão Plaid               | "Exibir botão apenas com Plaid ativo"                     | UI                |
| Conexão Plaid com credenciais válidas | "Permitir conectar conta pelo Plaid; persistir relatório" | UI/Backend        |
| Persistência no PlaidReport           | "Salvar dados na PlaidReport com status correto"          | DB/Backend        |
| Fluxo Plaid no mobile                 | "Compatível e responsivo no mobile"                       | UI Responsividade |
| Segurança dos tokens                  | "Não expor tokens sensíveis no front/logs"                | Segurança         |
| Validação de logs                     | "Registrar integração com logging e métricas adequadas"   | Observabilidade   |

-----

. Test Data & Sandbox
Use as credenciais de teste da Plaid para simular todos os tipos de usuários (user_good, user_credit_profile_poor, etc).
Documente quais combinações devem ser validadas para cobrir todos os tipos de resposta/mfa/erro do Plaid.

-----

Observações Técnicas
O front utiliza react-plaid-link para abrir o Plaid.
Backend faz toda a gestão do token e persistência, garantindo compliance.
Endpoint relevante para testes: /uown/los/getPlaidToken.
Persistência dos resultados e webhooks são registrados via PlaidReport.
Logs importantes para rastreabilidade e troubleshooting.

-----

Feature: Plaid Integration on Application Approval
  As a merchant user
  I want to connect a bank account via Plaid when required
  So that user data can be accessed securely and efficiently

  Background:
    Given I am logged in as a merchant user
    And the merchant has Plaid verification "<status>"

  @plaid @ui @smoke
  Scenario Outline: Exibição do botão Plaid após aprovação de aplicação
    When I create a new application and fill all required information
    And I reach the final approval screen
    Then I should <see_or_not> a "Connect with Plaid" button

    Examples:
      | status    | see_or_not  |
      | enabled   | see         |
      | disabled  | not see     |

  @plaid @ui @positive
  Scenario: Conexão Plaid com credenciais válidas
    Given Plaid verification is enabled for the merchant
    When I create a new application and reach the Plaid step
    And I click on "Connect with Plaid"
    And I fill Plaid credentials "user_good" and "pass_good"
    Then I should see a confirmation of successful connection
    And a new record should be created in PlaidReport for the application

  @plaid @ui @negative
  Scenario: Falha na autenticação Plaid
    Given Plaid verification is enabled for the merchant
    When I attempt to connect with Plaid using invalid credentials "user_bad" and "pass_bad"
    Then I should see an authentication error message
    And no new record should be created in PlaidReport

  @plaid @ui @integration
  Scenario: Persistência do relatório Plaid na base
    Given a successful Plaid connection for an application
    Then the PlaidReport table should contain an entry for the lead
    And the status should reflect "CHECK_REPORT_READY"

  @plaid @mobile
  Scenario: Fluxo Plaid no mobile
    Given I am accessing the application page via mobile device
    When I complete the Plaid connection flow
    Then the experience should be responsive and functionally equivalent to desktop

  @plaid @manual @logs
  Scenario: Validação de logs e métricas da integração Plaid
    When a Plaid connection is completed
    Then integration logs should record the user ID, status, and timestamps

  @plaid @manual @compliance
  Scenario: Segurança dos tokens e dados sensíveis
    When a Plaid connection is initiated
    Then sensitive tokens are not exposed to the frontend or logs

-----

Feature: Integração com Plaid na Aprovação de Aplicação
  Como um usuário comerciante
  Quero conectar uma conta bancária via Plaid quando necessário
  Para que os dados do usuário possam ser acessados de forma segura e eficiente

  Background:
    Dado que estou logado como um usuário comerciante
    E o comerciante tem a verificação Plaid "<status>"

  @plaid @ui @smoke
  Scenario Outline: Exibição do botão Plaid após aprovação de aplicação
    Quando eu crio uma nova aplicação e preencho todas as informações obrigatórias
    E chego à tela final de aprovação
    Então eu devo <ver_ou_nao> um botão "Conectar com Plaid"

    Examples:
      | status      | ver_ou_nao    |
      | habilitado  | ver           |
      | desabilitado| não ver       |

  @plaid @ui @positive
  Scenario: Conexão Plaid com credenciais válidas
    Dado que a verificação Plaid está habilitada para o comerciante
    Quando eu crio uma nova aplicação e chego à etapa Plaid
    E clico em "Conectar com Plaid"
    E preencho as credenciais Plaid "user_good" e "pass_good"
    Então devo ver uma confirmação de conexão bem-sucedida
    E um novo registro deve ser criado na tabela PlaidReport para a aplicação

  @plaid @ui @negative
  Scenario: Falha na autenticação Plaid
    Dado que a verificação Plaid está habilitada para o comerciante
    Quando eu tento conectar com Plaid usando credenciais inválidas "user_bad" e "pass_bad"
    Então devo ver uma mensagem de erro de autenticação
    E nenhum novo registro deve ser criado na tabela PlaidReport

  @plaid @ui @integration
  Scenario: Persistência do relatório Plaid na base
    Dado uma conexão Plaid bem-sucedida para uma aplicação
    Então a tabela PlaidReport deve conter uma entrada para o lead
    E o status deve refletir "CHECK_REPORT_READY"

  @plaid @mobile
  Scenario: Fluxo Plaid no mobile
    Dado que estou acessando a página de aplicação via dispositivo móvel
    Quando completo o fluxo de conexão Plaid
    Então a experiência deve ser responsiva e funcionalmente equivalente ao desktop

  @plaid @manual @logs
  Scenario: Validação de logs e métricas da integração Plaid
    Quando uma conexão Plaid é concluída
    Então os logs de integração devem registrar o ID do usuário, status e carimbos de data/hora

  @plaid @manual @compliance
  Scenario: Segurança dos tokens e dados sensíveis
    Quando uma conexão Plaid é iniciada
    Então os tokens sensíveis não devem ser expostos no frontend ou nos logs



1. Fluxo básico de sucesso
Usuário: user_good
Senha: pass_good
Resulta em uma conta conectada sem erros nem MFA.
lease: 90526

2. Testes de transações (transações dinâmicas)
Usuário: user_transactions_dynamic
Senha: qualquer senha
Vai simular contas com movimentações, histórico realista e disparar webhooks ao usar /transactions/refresh.
https://origination-sandbox.uownleasing.com/sendApplication?uuid=336463dc-5d00-4519-bfcd-8da7f82058d2_7145806359303528448&isBranded=true
lease: 90527


3. user_bank_income: usuário com múltiplos tipos de renda em nova instituição adicionada
lease: 90528

4. user_credit_bonus: salários com bônus
lease: 90529


5. fluxo de erro de “conta bloqueada”, use:
Usuário: user_good
Senha: error_ITEM_LOCKED
Resultado: Plaid vai mostrar o erro simulado e seu sistema deve tratar o erro corretamente.
90532

-----




### Cenário: Fluxo básico de sucesso com credenciais válidas
Dado que estou logado como um usuário elegível  
E a verificação Plaid está ativada para o merchant  
Quando inicio uma nova aplicação de leasing (Lease 90526)  
E preencho o Plaid com usuário "user_good" e senha "pass_good"  
E preencho um telefone válido  
E seleciono uma conta bancária válida  
Então a conta deve ser conectada com sucesso sem MFA  
E o sistema deve registrar a conexão no PlaidReport
| ✅ PASS | 90518, 90526, 90527 |

### Cenário: Fluxo de teste de transações dinâmicas
Dado que estou logado como um usuário elegível  
E a verificação Plaid está ativada para o merchant  
Quando inicio uma nova aplicação de leasing (Lease 90527)  
E preencho o Plaid com usuário "user_transactions_dynamic" e qualquer senha  
E seleciono uma conta bancária válida  
Então devo visualizar contas com histórico de transações realistas  
E o sistema deve processar e registrar PlaidReport  
| ✅ PASS | 90528 |

### Cenário: Fluxo com múltiplos tipos de renda
Dado que estou logado como um usuário elegível  
E a verificação Plaid está ativada para o merchant  
Quando inicio uma nova aplicação de leasing (Lease 90528)  
E preencho o Plaid com usuário "user_bank_income" e qualquer senha  
E seleciono uma conta bancária válida  
Então o Plaid deve simular múltiplos tipos de renda vinculados à conta  
E o sistema deve registrar corretamente o relatório Plaid  
| ✅ PASS | 90529 |

### Cenário: Fluxo com salários e bônus
Dado que estou logado como um usuário elegível  
E a verificação Plaid está ativada para o merchant  
Quando inicio uma nova aplicação de leasing (Lease 90529)  
E preencho o Plaid com usuário "user_credit_bonus" e qualquer senha  
E seleciono uma conta bancária válida  
Então o Plaid deve simular múltiplos salários, incluindo bônus  
E o relatório Plaid deve refletir esses valores  
| ✅ PASS | 90529 |

### Cenário: Fluxo de erro simulando conta bloqueada
Dado que estou logado como um usuário elegível  
E a verificação Plaid está ativada para o merchant  
Quando inicio uma nova aplicação de leasing (Lease 90532)  
E preencho o Plaid com usuário "user_good" e senha "error_ITEM_LOCKED"  
Então devo visualizar uma mensagem de erro informando que a conta está bloqueada  
E o sistema não deve registrar conexão bem sucedida no PlaidReport  
| ✅ PASS | 90532 |

-----

> ## Tests in qa1
> ```gherkin
>### Scenario: Basic success flow with valid credentials
>Given I am logged in as an eligible user  
>And Plaid verification is enabled for the merchant  
>When I start a new leasing application (Lease 90526)  
>And I fill Plaid with username "user_good" and password "pass_good"  
>And I enter a valid phone number  
>And I select a valid bank account  
>Then the account should be connected successfully without MFA  
>And the system should record the connection in PlaidReport  
>| PASS | 90526 |
> ```
>
> ```gherkin
>### Scenario: Test flow with dynamic transactions
>Given I am logged in as an eligible user  
>And Plaid verification is enabled for the merchant  
>When I start a new leasing application (Lease 90527)  
>And I fill Plaid with username "user_transactions_dynamic" and any password  
>And I select a valid bank account  
>Then I should see accounts with realistic transaction history  
>And the system should process and register the /transactions/refresh webhook  
>| PASS | 90527 |
> ```
>
> ```gherkin
>### Scenario: Flow with multiple income types
>Given I am logged in as an eligible user  
>And Plaid verification is enabled for the merchant  
>When I start a new leasing application (Lease 90528)  
>And I fill Plaid with username "user_bank_income" and any password  
>And I select a valid bank account  
>Then Plaid should simulate multiple types of income linked to the account  
>And the system should properly register the Plaid report  
>| PASS | 90528 |
> ```
>
> ```gherkin
>### Scenario: Flow with salaries and bonuses
>Given I am logged in as an eligible user  
>And Plaid verification is enabled for the merchant  
>When I start a new leasing application (Lease 90529)  
>And I fill Plaid with username "user_credit_bonus" and any password  
>And I select a valid bank account  
>Then Plaid should simulate multiple salaries, including bonuses  
>And the Plaid report should reflect these values  
>| PASS | 90529 |
> ```
>
> ```gherkin
>### Scenario: Error flow simulating locked account
>Given I am logged in as an eligible user  
>And Plaid verification is enabled for the merchant  
>When I start a new leasing application (Lease 90532)  
>And I fill Plaid with username "user_good" and password "error_ITEM_LOCKED"  
>Then I should see an error message informing that the account is locked  
>And the system should not record a successful connection in PlaidReport  
>| PASS | 90532 |
> ```
>

-----

> ## Tests in qa1
> ```gherkin
>### Scenario: Basic success flow with valid credentials
>Given I am logged in as an eligible user  
>And Plaid verification is enabled for the merchant  
>When I start a new leasing application (Lease 90526)  
>And I fill Plaid with username "user_good" and password "pass_good"  
>And I enter a valid phone number  
>And I select a valid bank account  
>Then the account should be connected successfully without MFA  
>And the system should record the connection in PlaidReport  
>| PASS | 90526, 90527 |
> ```
>
![1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_18_](/uploads/97410482d132ed7a1664425dbc69838f/1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_18_.png){width=848 height=741}![1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_19_](/uploads/419de1375b7e334308cc76acf9d68a23/1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_19_.png){width=848 height=741}![1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_20_](/uploads/64dfa3ada7af483ef41cab0309a0fa2e/1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_20_.png){width=848 height=741}![1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_21_](/uploads/61e0b6d1f161586bc3fc2567f53b26ea/1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_21_.png){width=848 height=741}![1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_22_](/uploads/95c202f6fea66795f03fe6ca68a0b134/1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_22_.png){width=848 height=741}![1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_23_](/uploads/b39b864108bff04f632ed30620f9cc3e/1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_23_.png){width=848 height=741}![1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_23_](/uploads/9bf56952518a24f6b14c58d387fef195/1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_23_.png){width=848 height=741}![1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_24_](/uploads/024874146d7616805c4369aa1afe6b98/1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_24_.png){width=848 height=771}![1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_25_](/uploads/8a51958781181ccc7d99428bde9a3f59/1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_25_.png){width=848 height=771}![1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_26_](/uploads/7ed1d0bc5a2dc1fec398436027ef3659/1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_26_.png){width=848 height=771}![1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_27_](/uploads/ebe650781d6fcf8324d893ca7d20e0ed/1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_27_.png){width=848 height=771}![1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_28_](/uploads/295cc27847b4842100f1f7d138300ff1/1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_28_.png){width=848 height=771}![1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_29_](/uploads/37f1350c965bc3b8d4e10fa77f3fcc88/1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_29_.png){width=848 height=771}{{1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-(30).png}}{{1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-(31).png}}![1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_32_](/uploads/a121fc8e6473e3726f5e4edba801a823/1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_32_.png){width=848 height=771}![1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_33_](/uploads/2d375f090764a8d4800177f4e04b2041/1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_33_.png){width=848 height=771}![1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_34_](/uploads/0ea2e2d0af273828d02804bd03162c35/1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_34_.png){width=1190 height=53}![1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_35_](/uploads/5a5c9f68aded98b893fc9c0bfe90014b/1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_35_.png){width=851 height=739}![1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_36_](/uploads/6fd63981a431532e0fc923bd55bf026c/1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_36_.png){width=851 height=739}![1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_37_](/uploads/30f3f98f5ca755ede2c1205f7f5553fa/1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_37_.png){width=851 height=739}![1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_38_](/uploads/5dfb5bd20adb8635f4e6ee5eb247c57a/1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_38_.png){width=1193 height=45}![1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_39_](/uploads/4a26257467f203d7c43340628dd7250d/1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_39_.png){width=411 height=709}![1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_40_](/uploads/73e72c8d71f3932c5dd4847fbd5102f0/1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_40_.png){width=411 height=709}![1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_41_](/uploads/832c2ca41f180353d53817ee8ffa3a81/1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_41_.png){width=411 height=709}![1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_42_](/uploads/de12f14757c46aa071f363fee5b27aef/1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_42_.png){width=411 height=709}![1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_43_](/uploads/6882fb9141aeb95d1b9f326a3a1019ea/1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_43_.png){width=1329 height=77}![1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_44_](/uploads/f00cc3e82127abf91f09a9e17c405613/1050-sandbox-c1-UserGood-BasicFlowNotValidCredential-OK-90526-_44_.png){width=1437 height=742}
![1050-sandbox-c1-BasicFlowNotValidCredencial-OK-90527-_1_](/uploads/6a568c79b78ad19369f8d6cc46623e85/1050-sandbox-c1-BasicFlowNotValidCredencial-OK-90527-_1_.jpg)![1050-sandbox-c1-BasicFlowNotValidCredencial-OK-90527-_2_](/uploads/2237890a0c199265d01d3f4f31416586/1050-sandbox-c1-BasicFlowNotValidCredencial-OK-90527-_2_.jpg)![1050-sandbox-c1-BasicFlowNotValidCredencial-OK-90527-_3_](/uploads/30df1936de02af1bc77ba858cf9520a5/1050-sandbox-c1-BasicFlowNotValidCredencial-OK-90527-_3_.jpg)![1050-sandbox-c1-BasicFlowNotValidCredencial-OK-90527-_4_](/uploads/f33d768e2025ba17de077be2df3ec7a6/1050-sandbox-c1-BasicFlowNotValidCredencial-OK-90527-_4_.jpg)![1050-sandbox-c1-BasicFlowNotValidCredencial-OK-90527-_4_](/uploads/6262ebf9e9d0bdbf8f918342dbe9d775/1050-sandbox-c1-BasicFlowNotValidCredencial-OK-90527-_4_.jpg)![1050-sandbox-c1-BasicFlowNotValidCredencial-OK-90527-_6_](/uploads/3a29b706fba3848ad9b8c32034252c15/1050-sandbox-c1-BasicFlowNotValidCredencial-OK-90527-_6_.jpg)![1050-sandbox-c1-BasicFlowNotValidCredencial-OK-90527-_7_](/uploads/4f4f8730ec19a3057ed95d59c2edb7a5/1050-sandbox-c1-BasicFlowNotValidCredencial-OK-90527-_7_.jpg)![1050-sandbox-c1-BasicFlowNotValidCredencial-OK-90527-_8_](/uploads/77ba17911a784e6400dfd35b2f1ace07/1050-sandbox-c1-BasicFlowNotValidCredencial-OK-90527-_8_.jpg)![1050-sandbox-c1-BasicFlowNotValidCredencial-OK-90527-_9_](/uploads/360f66ce7a6fa086c1462baa4272c905/1050-sandbox-c1-BasicFlowNotValidCredencial-OK-90527-_9_.jpg)![1050-sandbox-c1-BasicFlowNotValidCredencial-OK-90527-_10_](/uploads/76fae9fe741fd1e8b4b0b4e7f91367c5/1050-sandbox-c1-BasicFlowNotValidCredencial-OK-90527-_10_.jpg)![1050-sandbox-c1-BasicFlowNotValidCredencial-OK-90527-_11_](/uploads/88f173eed05af07b4582cfac7fd5f4af/1050-sandbox-c1-BasicFlowNotValidCredencial-OK-90527-_11_.jpg)![1050-sandbox-c1-BasicFlowNotValidCredencial-OK-90527-_12_](/uploads/00e87bd0d30cbeeb5460f650452e95b4/1050-sandbox-c1-BasicFlowNotValidCredencial-OK-90527-_12_.jpg)![1050-sandbox-c1-BasicFlowNotValidCredencial-OK-90527-_13_](/uploads/5e9c5f22d213840b9b21411094d99182/1050-sandbox-c1-BasicFlowNotValidCredencial-OK-90527-_13_.jpg)![1050-sandbox-c1-BasicFlowNotValidCredencial-OK-90527-_14_](/uploads/55152856459ad91bf594ec45c0b3280a/1050-sandbox-c1-BasicFlowNotValidCredencial-OK-90527-_14_.jpg)![1050-sandbox-c1-BasicFlowNotValidCredencial-OK-90527-_15_](/uploads/afed8529f06cea655ecc9b30e461742c/1050-sandbox-c1-BasicFlowNotValidCredencial-OK-90527-_15_.jpg)![1050-sandbox-c1-BasicFlowNotValidCredencial-OK-90527-_16_](/uploads/cad2a38fc99ea5d0fdf3becfe48e0c28/1050-sandbox-c1-BasicFlowNotValidCredencial-OK-90527-_16_.jpg)![1050-sandbox-c1-BasicFlowNotValidCredencial-OK-90527-_17_](/uploads/7c5e49ef2f4933b8db2f6ba88100a448/1050-sandbox-c1-BasicFlowNotValidCredencial-OK-90527-_17_.jpg)![1050-sandbox-c1-BasicFlowNotValidCredencial-OK-90527-_18_](/uploads/b57d1193a65566db402cd3f93ef17832/1050-sandbox-c1-BasicFlowNotValidCredencial-OK-90527-_18_.jpg)![1050-sandbox-c1-BasicFlowNotValidCredencial-OK-90527-_19_](/uploads/ab6b234d17d18124844711ef98115cde/1050-sandbox-c1-BasicFlowNotValidCredencial-OK-90527-_19_.jpg)![1050-sandbox-c1-BasicFlowNotValidCredencial-OK-90527-_20_](/uploads/00bc7861caf0c4e1e2d78d70ad9b1199/1050-sandbox-c1-BasicFlowNotValidCredencial-OK-90527-_20_.png){width=1437 height=742}![1050-sandbox-c1-BasicFlowNotValidCredencial-OK-90527-_21_](/uploads/04015518636095294d26cabd17c20e97/1050-sandbox-c1-BasicFlowNotValidCredencial-OK-90527-_21_.png){width=1188 height=51}![1050-sandbox-c1-BasicFlowNotValidCredencial-OK-90527-_22_](/uploads/7dbaf4c097ddd17dd4de6875e9f6ccb1/1050-sandbox-c1-BasicFlowNotValidCredencial-OK-90527-_22_.png){width=385 height=276}![1050-sandbox-c1-BasicFlowNotValidCredencial-OK-90527-_23_](/uploads/f4809dd01e69d90735cb062a65dbc575/1050-sandbox-c1-BasicFlowNotValidCredencial-OK-90527-_23_.png){width=471 height=717}![1050-sandbox-c1-BasicFlowNotValidCredencial-OK-90527-_24_](/uploads/56a4fdae8e9cdd96e01ec7dcc5768df4/1050-sandbox-c1-BasicFlowNotValidCredencial-OK-90527-_24_.png){width=471 height=717}![1050-sandbox-c1-BasicFlowNotValidCredencial-OK-90527-_25_](/uploads/2b00e34ad5df51300a8de3f3351921b6/1050-sandbox-c1-BasicFlowNotValidCredencial-OK-90527-_25_.png){width=1186 height=66}
>
> ```gherkin
>### Scenario: Test flow with dynamic transactions
>Given I am logged in as an eligible user  
>And Plaid verification is enabled for the merchant  
>When I start a new leasing application (Lease 90527)  
>And I fill Plaid with username "user_transactions_dynamic" and any password  
>And I select a valid bank account  
>Then I should see accounts with realistic transaction history  
>And the system should process and register the /transactions/refresh webhook  
>| PASS | --|
> ```
>
> ```gherkin
>### Scenario: Flow with multiple income types
>Given I am logged in as an eligible user  
>And Plaid verification is enabled for the merchant  
>When I start a new leasing application (Lease 90528)  
>And I fill Plaid with username "user_bank_income" and any password  
>And I select a valid bank account  
>Then Plaid should simulate multiple types of income linked to the account  
>And the system should properly register the Plaid report  
>| PASS | 90528 |
> ```
>
![1050-sandbox-c2-UserTransactionsDynamics-OK-90528-_1_](/uploads/0df92e35a0986d3e2e34d611e391a64c/1050-sandbox-c2-UserTransactionsDynamics-OK-90528-_1_.jpg)![1050-sandbox-c2-UserTransactionsDynamics-OK-90528-_2_](/uploads/577da6ac1274971c3e7459ab04dadf94/1050-sandbox-c2-UserTransactionsDynamics-OK-90528-_2_.jpg)![1050-sandbox-c2-UserTransactionsDynamics-OK-90528-_3_](/uploads/e733c3af7eb18c3ca1d2d61579660c92/1050-sandbox-c2-UserTransactionsDynamics-OK-90528-_3_.jpg)![1050-sandbox-c2-UserTransactionsDynamics-OK-90528-_4_](/uploads/13784e52f9cb38e6a3e988e115e5b4b1/1050-sandbox-c2-UserTransactionsDynamics-OK-90528-_4_.jpg)![1050-sandbox-c2-UserTransactionsDynamics-OK-90528-_5_](/uploads/98e72c86b762ba3fac4f3816f0b86047/1050-sandbox-c2-UserTransactionsDynamics-OK-90528-_5_.jpg)![1050-sandbox-c2-UserTransactionsDynamics-OK-90528-_6_](/uploads/2280e4eeb9de182fa55b1d596e760beb/1050-sandbox-c2-UserTransactionsDynamics-OK-90528-_6_.jpg)![1050-sandbox-c2-UserTransactionsDynamics-OK-90528-_7_](/uploads/fc7c1a3402325e925b0a0cfe2c35a9ce/1050-sandbox-c2-UserTransactionsDynamics-OK-90528-_7_.jpg)![1050-sandbox-c2-UserTransactionsDynamics-OK-90528-_8_](/uploads/e8159c213d3a6e8d83d6be69e6de5ba0/1050-sandbox-c2-UserTransactionsDynamics-OK-90528-_8_.jpg)![1050-sandbox-c2-UserTransactionsDynamics-OK-90528-_9_](/uploads/cca95480c32ba909617a1ab3852b4190/1050-sandbox-c2-UserTransactionsDynamics-OK-90528-_9_.jpg)![1050-sandbox-c2-UserTransactionsDynamics-OK-90528-_10_](/uploads/3b5607404a174610e084f0f3716e6302/1050-sandbox-c2-UserTransactionsDynamics-OK-90528-_10_.jpg)![1050-sandbox-c2-UserTransactionsDynamics-OK-90528-_11_](/uploads/797f1498a28a69c04eb7925b1f368435/1050-sandbox-c2-UserTransactionsDynamics-OK-90528-_11_.jpg)![1050-sandbox-c2-UserTransactionsDynamics-OK-90528-_12_](/uploads/0986b9182796e1f94a0e935324d37463/1050-sandbox-c2-UserTransactionsDynamics-OK-90528-_12_.jpg)![1050-sandbox-c2-UserTransactionsDynamics-OK-90528-_13_](/uploads/335c7d27aca99460cd35998bb0d269b7/1050-sandbox-c2-UserTransactionsDynamics-OK-90528-_13_.png){width=1439 height=746}![1050-sandbox-c2-UserTransactionsDynamics-OK-90528-_14_](/uploads/bef9812f42307ea0af23d5374729614c/1050-sandbox-c2-UserTransactionsDynamics-OK-90528-_14_.png){width=904 height=56}
>
> ```gherkin
>### Scenario: Flow with salaries and bonuses
>Given I am logged in as an eligible user  
>And Plaid verification is enabled for the merchant  
>When I start a new leasing application (Lease 90529)  
>And I fill Plaid with username "user_credit_bonus" and any password  
>And I select a valid bank account  
>Then Plaid should simulate multiple salaries, including bonuses  
>And the Plaid report should reflect these values  
>| PASS | 90529 |
> ```
>
![1050-sandbox-c3-UserBankIncome-OK-90529-_7_](/uploads/3f652abd73ff499d9165c1e31864f197/1050-sandbox-c3-UserBankIncome-OK-90529-_7_.png){width=904 height=56}![1050-sandbox-c3-UserBankIncome-OK-90529-_1_](/uploads/d18b25fd90840bb0034777c24f12b57c/1050-sandbox-c3-UserBankIncome-OK-90529-_1_.jpg)![1050-sandbox-c3-UserBankIncome-OK-90529-_2_](/uploads/09d3630101fb0ded5448b89a52c245bc/1050-sandbox-c3-UserBankIncome-OK-90529-_2_.jpg)![1050-sandbox-c3-UserBankIncome-OK-90529-_3_](/uploads/a6d96d80efdd227d5a75ee7aa0a2b655/1050-sandbox-c3-UserBankIncome-OK-90529-_3_.jpg)![1050-sandbox-c3-UserBankIncome-OK-90529-_4_](/uploads/2451aabd1c6c000f3f0b4c2bcf4dc5b5/1050-sandbox-c3-UserBankIncome-OK-90529-_4_.jpg)![1050-sandbox-c3-UserBankIncome-OK-90529-_6_](/uploads/c10d29056b19dcfa48a0051dc6b53f67/1050-sandbox-c3-UserBankIncome-OK-90529-_6_.jpg)![1050-sandbox-c3-UserBankIncome-OK-90529-_7_](/uploads/701cdc5b5399f888fbcecb21449a9cb3/1050-sandbox-c3-UserBankIncome-OK-90529-_7_.jpg)
>
> ```gherkin
>### Scenario: Error flow simulating locked account
>Given I am logged in as an eligible user  
>And Plaid verification is enabled for the merchant  
>When I start a new leasing application (Lease 90532)  
>And I fill Plaid with username "user_good" and password "error_ITEM_LOCKED"  
>Then I should see an error message informing that the account is locked  
>And the system should not record a successful connection in PlaidReport  
>| PASS | 90532 |
> ```
>

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

1. Cenário com Merchant COM Plaid habilitado
1.1 Pré-aprovação (Antes do Plaid)
Ação: Avance até a tela de pré-aprovação, mas não inicie o fluxo do Plaid ainda.

Validação:
Status do lead: UW_PENDING
Status interno: PLAID_PENDING
(Valide isso tanto via UI quanto, se possível, via API/database para garantir que os status foram setados corretamente.)

1.2 Iniciando o fluxo do Plaid
Ação: Inicie o fluxo Plaid Link (usuário clica para conectar conta bancária).
Validação:
Imediatamente após iniciar o Plaid Link e antes do usuário finalizar, o status deve permanecer:
Status do lead: UW_PENDING
Status interno: PLAID_IN_PROCESS (novo status implementado, verificar se foi atualizado corretamente assim que o link token é retornado).
O sistema deve bloquear a progressão enquanto não houver retorno do Plaid.

1.3 Finalização do fluxo Plaid
Ação: Complete todo o fluxo no Plaid Link até o final, como se o usuário tivesse conectado a conta com sucesso.

Validação:
Após receber o webhook de sucesso do Plaid (CHECK_REPORT_READY):
Status interno: PLAID_SUCCESS
Status do lead: UW_APPROVED

(Se o status interno for alterado mas o status do lead não for atualizado, é bug.)
Valide que o relatório financeiro do usuário foi gerado e está acessível para análise.
Registre os eventos de integração (logs/métricas).

1.4 Falha ou rejeição no fluxo
Ação: Simule uma rejeição ou falha no Plaid (ex: não conectar conta, fechar janela, usar credencial inválida, etc).

Validação:
Lead deve continuar como UW_PENDING e status interno não deve ir para PLAID_SUCCESS. Pode ser PLAID_FAILED ou outro status de erro, conforme implementação.
Usuário não deve conseguir avançar para aprovação.

2. Cenário com Merchant SEM Plaid habilitado
Ação: Execute o fluxo de originação normalmente para um merchant sem Plaid habilitado.

Validação:
O fluxo de status deve ser igual ao anterior à integração do Plaid, ou seja, não pode ser impactado (tudo funciona normalmente, sem travar no passo do Plaid, sem status internos relacionados ao Plaid).

3. Cobertura Adicional
Webhook
Valide que o sistema está recebendo, processando e registrando corretamente o webhook do Plaid.
Em caso de falha no webhook (ex: Plaid envia CHECK_REPORT_FAILED), status do lead não deve ser aprovado. Registrar erro.

Logs e Métricas
Confirme se o backend registra todos os eventos relevantes: geração do link token, início do Link, resposta do Plaid, falha/sucesso.

Dados Financeiros
Depois do fluxo Plaid, valide que os dados retornados realmente correspondem ao esperado (pelo menos um dado dummy no ambiente de sandbox). Exemplo: renda, saldo, etc.

Regressão
Verifique que merchants já existentes e flows antigos não foram impactados.







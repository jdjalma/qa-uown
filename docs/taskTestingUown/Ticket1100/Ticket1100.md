--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1100

UOWN | Origination | Set SEON as the Default Identity Verification Provider


Synopsis
Set SEON as the default identity verification provider in the system.
Expected: SEON set as TRUE and Intellicheck set as FALSE.

Business Objective
By defining SEON as the default verifier, we ensure:
    Standardization of the identity validation process.
    Improved compliance and fraud prevention.
    Reduction of errors or misconfigurations when selecting verification providers.

Feature Request | Business Requirements
    The system must automatically use SEON as the default identity verification tool for all new identity validation flows.
    If multiple verifiers exist in the configuration, SEON must take priority over the others.
    No manual selection should be required from the agent or user — the process should trigger SEON by default.
    Ensure proper logging of all identity verification requests and responses from SEON.
    Maintain flexibility for future changes, allowing administrators to switch the default provider through configuration if needed.

-----

UOWN | Originação | Definir SEON como Provedor Padrão de Verificação de Identidade
Sinopse

Definir o SEON como o provedor padrão de verificação de identidade no sistema.
Esperado: SEON definido como TRUE e Intellicheck definido como FALSE.

Objetivo de Negócio

Ao definir o SEON como verificador padrão, garantimos:

Padronização do processo de validação de identidade.

Maior conformidade e prevenção de fraudes.

Redução de erros ou configurações incorretas ao selecionar provedores de verificação.

Solicitação de Recurso | Requisitos de Negócio

O sistema deve usar automaticamente o SEON como ferramenta padrão de verificação de identidade para todos os novos fluxos de validação.

Se existirem vários verificadores na configuração, o SEON deve ter prioridade sobre os demais.

Nenhuma seleção manual deve ser exigida do agente ou usuário — o processo deve acionar o SEON por padrão.

Garantir o registro adequado de todas as solicitações e respostas de verificação de identidade do SEON.

Manter flexibilidade para alterações futuras, permitindo que administradores alternem o provedor padrão por meio de configuração, se necessário.

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Cenário 1: Criar novo merchant
Funcionalidade: Definir SEON como provedor padrão de verificação de identidade

Cenário: Criar um novo merchant
  Dado que estou na tela de "Add a New Company"
  Quando preencho os dados obrigatórios e salvo o merchant
  Então o campo "Require SEON Id Verification" deve estar habilitado por padrão
  E o campo "Require Intellicheck Id Verification" deve estar desabilitado por padrão
  E devo conseguir habilitar manualmente o "Require Intellicheck Id Verification" se desejar


Cenário 2: Clonar merchant existente
Funcionalidade: Definir SEON como provedor padrão de verificação de identidade

Cenário: Clonar merchant existente
  Dado que seleciono um merchant existente e aciono a opção "Clone"
  Quando o formulário do novo merchant é carregado
  Então o campo "Require SEON Id Verification" deve estar habilitado por padrão
  E o campo "Require Intellicheck Id Verification" deve estar desabilitado por padrão
  E devo conseguir habilitar manualmente o "Require Intellicheck Id Verification" se desejar



Cenário 3: Editar merchant existente
Funcionalidade: Definir SEON como provedor padrão de verificação de identidade

Cenário: Editar merchant existente
  Dado que acesso um merchant existente para edição
  Quando visualizo as configurações de requisitos de verificação de identidade
  Então o campo "Require SEON Id Verification" deve estar habilitado por padrão
  E o campo "Require Intellicheck Id Verification" deve estar desabilitado por padrão
  E devo conseguir habilitar manualmente o "Require Intellicheck Id Verification" se desejar

---

> ## Tests in qa1

Scenario 1: Create new merchant
> ```gherkin
> Feature: Set SEON as the default identity verification provider
> ### Scenario: Create a new merchant
> Given I am on the "Add a New Company" screen
> When I fill in the required fields and save the merchant
> Then the "Require SEON Id Verification" field should be enabled by default
> And the "Require Intellicheck Id Verification" field should be disabled by default
> And I should be able to manually enable "Require Intellicheck Id Verification" if desired
> | PASS |
> ```
>
>


Scenario 2: Clone existing merchant
> ```gherkin
> Feature: Set SEON as the default identity verification provider
> ### Scenario: Clone existing merchant
> Given I select an existing merchant and choose the "Clone" option
> When the new merchant form is loaded
> Then the "Require SEON Id Verification" field should be enabled by default
> And the "Require Intellicheck Id Verification" field should be disabled by default
> And I should be able to manually enable "Require Intellicheck Id Verification" if desired
> | PASS | Merchant:TestTicket1100 | 
> ```
>
>


Scenario 3: Edit existing merchant
> ```gherkin
> Feature: Set SEON as the default identity verification provider
> ### Scenario: Edit existing merchant
> Given I access an existing merchant for editing
> When I view the identity verification requirements settings
> Then the "Require SEON Id Verification" field should be enabled by default
> And the "Require Intellicheck Id Verification" field should be disabled by default
> And I should be able to manually enable "Require Intellicheck Id Verification" if desired
> | PASS | Merchant:TestTicket1100 | 
> ```
>
>


-----


> ## Tests in qa1

Scenario 1: Create new merchant
> ```gherkin
> Feature: Set SEON as the default identity verification provider
> ### Scenario: Create a new merchant
> Given I am on the "Add a New Company" screen
> When I fill in the required fields and save the merchant
> Then the "Require SEON Id Verification" field should be enabled by default
> And the "Require Intellicheck Id Verification" field should be disabled by default
> And I should be able to manually enable "Require Intellicheck Id Verification" if desired
> | PASS |
> ```
>
>
![Screenshot_21](/uploads/7c481f70208ac759f22c569a4ecb84dc/Screenshot_21.png){width=967 height=169}

![Screenshot_22](/uploads/7adff30db58d7badadfb0ddb0cd07b37/Screenshot_22.png){width=637 height=182}

![Screenshot_23](/uploads/3c454537bedeff3feb46c070546c6d92/Screenshot_23.png){width=637 height=182}

---

![Screenshot_24](/uploads/9471736c3829b4ad60312fce4efd710a/Screenshot_24.png){width=637 height=182}

![Screenshot_25](/uploads/2b2d4d786bd388d37d3a45ae6feb9c4b/Screenshot_25.png){width=1434 height=507}

![Screenshot_26](/uploads/5b51aa37d9e57cc9f3682146c308c034/Screenshot_26.png){width=450 height=45}
>
>

Scenario 2: Clone existing merchant
> ```gherkin
> Feature: Set SEON as the default identity verification provider
> ### Scenario: Clone existing merchant
> Given I select an existing merchant and choose the "Clone" option
> When the new merchant form is loaded
> Then the "Require SEON Id Verification" field should be enabled by default
> And the "Require Intellicheck Id Verification" field should be disabled by default
> And I should be able to manually enable "Require Intellicheck Id Verification" if desired
> | PASS | Merchant:TestTicket1100 | 
> ```
>
>
![Screenshot_27](/uploads/c925808109116447ae3ffc2d9da58ef5/Screenshot_27.png){width=672 height=551}

![Screenshot_28](/uploads/1c2669423f2c09622cdb3eab484eddcd/Screenshot_28.png){width=348 height=268}

![Screenshot_29](/uploads/29ac0e9e0920f3a4c30c6c8cf6f37572/Screenshot_29.png){width=662 height=177}

![Screenshot_30](/uploads/cc29f7a85d9dac86f85bc253dc3ee542/Screenshot_30.png){width=641 height=553}

![Screenshot_31](/uploads/9500f6494c10816151c95a6e593d056e/Screenshot_31.png){width=350 height=268}

![Screenshot_32](/uploads/10f630b516db79497421fd023fef7969/Screenshot_32.png){width=635 height=628}
>
>


Scenario 3: Edit existing merchant
> ```gherkin
> Feature: Set SEON as the default identity verification provider
> ### Scenario: Edit existing merchant
> Given I access an existing merchant for editing
> When I view the identity verification requirements settings
> Then the "Require SEON Id Verification" field should be enabled by default
> And the "Require Intellicheck Id Verification" field should be disabled by default
> And I should be able to manually enable "Require Intellicheck Id Verification" if desired
> | PASS | Merchant:TestTicket1100 | 
> ```
>
>
![Screenshot_33](/uploads/dc624596885d68b9983fa912c03d45d3/Screenshot_33.png){width=825 height=96}

![Screenshot_34](/uploads/5e49853a9dcca1ad5c36d10076c84168/Screenshot_34.png){width=257 height=96}

![Screenshot_35](/uploads/7a24fbf6f47daa7a865a118cbf1c0084/Screenshot_35.png){width=257 height=96}

![Screenshot_36](/uploads/01ec65c89ac0e9c5529d41a85489afc0/Screenshot_36.png){width=1431 height=738}

![Screenshot_37](/uploads/da8ead89d2e9ea1d785b75ae35562d5e/Screenshot_37.png){width=827 height=54}
>
>
------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/914

Uown | Origination | Integrate Radar Address Autocomplete API


Synopsis
To avoid fraudulent activity related to customer addresses we need to create an API integration to verify the customers address


Business Objective
Business wants to avoid fraudster activities related to customer delivery addresses


Feature Request | Business Requirements
Create an API integration for customer address verificatons


Testing Steps

Access the Page
    Navigate to the sendApplication page.

Check Radar Initialization

    When Radar initializes successfully:
        The Street Address input field should be enabled.
        All other address-related fields should be disabled.

    Verify initialization in the browser console:
        Radar SDK: initialized with test publishableKey.


Handle Radar Initialization Failure

    If Radar fails to initialize:
        All address fields should become enabled, except the state field, which remains disabled.
        The Street Address input should no longer call the Radar API.
        The user should be able to manually fill all address information.

One way to simulate failure: in config/uown-origination/.env (DevOps environment), remove the value from:
    RADAR_LICENSE_KEY=value

so that the credentials cannot be validated, causing Radar to fail.

Test Address Autocomplete (Success Case)
    In the Street Address field, type more than 5 characters.
    The system should call the API and display autocomplete suggestions for complete addresses.
    Select one of the suggestions.
    Verify that all relevant address fields are automatically populated with the selected data.

Test Manual Address Input (Failure Case)

When Radar fails or is unavailable:
    Manually fill in all address fields (except state, which remains disabled and is auto-filled based on the ZIP code).
    Ensure the user can proceed normally after entering all information.

Validate Application Submission
Complete the application and submit it.
Inspect the request payload from sendApplication:
    Success (Radar autocomplete used):
        mainAddressVerified: true

Failure (manual input/fallback):
    mainAddressVerified: false

------------------------------------------------------------------------------------------------------------------------------------------------------------------


Verificar Inicialização do Radar
    Quando o Radar for inicializado com sucesso: - ok
        O campo Street Address deve ser habilitado.
        Todos os outros campos relacionados ao endereço devem permanecer desabilitados. - ok
    Verificar a inicialização no console do navegador:
        Radar SDK: initialized with test publishableKey. - ok

Tratar Falha na Inicialização do Radar
    Se o Radar falhar na inicialização:
        Todos os campos de endereço devem ser habilitados, exceto o campo state, que permanece desabilitado.
        O campo Street Address não deve mais chamar a API do Radar.
        O usuário deve poder preencher manualmente todas as informações de endereço.

Uma maneira de simular a falha: no arquivo config/uown-origination/.env (ambiente DevOps), remover o valor de:
RADAR_LICENSE_KEY=value
para que as credenciais não possam ser validadas, causando falha na inicialização do Radar.

Testar Autocompletar de Endereço (Caso de Sucesso)
    No campo Street Address, digitar mais de 5 caracteres.
    O sistema deve chamar a API e exibir sugestões de autocompletar para endereços completos.
    Selecionar uma das sugestões.
    Verificar se todos os campos de endereço relevantes são preenchidos automaticamente com os dados selecionados.






Testar Entrada Manual de Endereço (Caso de Falha)
    Quando o Radar falhar ou estiver indisponível:
        Preencher manualmente todos os campos de endereço (exceto state, que permanece desabilitado e é preenchido automaticamente com base no código postal). - ok
        Garantir que o usuário possa prosseguir normalmente após inserir todas as informações. - ok

Validar Envio da Aplicação

Completar o formulário e enviá-lo.
    Inspecionar o payload da requisição de sendApplication:
        Sucesso (autocompletar do Radar utilizado):
            mainAddressVerified: true

Falha (entrada manual/fallback):
mainAddressVerified: false - ok

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Acessar a Página
    Navegar até a página sendApplication.

Verificar Inicialização do Radar
    Quando o Radar for inicializado com sucesso:
        O campo Street Address deve ser habilitado. - ok
        Todos os outros campos relacionados ao endereço devem permanecer desabilitados. - ok
    Verificar a inicialização no console do navegador: - ok
        Radar SDK: initialized with test publishableKey.

Testar Autocompletar de Endereço (Caso de Sucesso)
    No campo Street Address, digitar mais de 5 caracteres. - ok
    O sistema deve chamar a API e exibir sugestões de autocompletar para endereços completos. - ok
    Selecionar uma das sugestões. - ok
    Verificar se todos os campos de endereço relevantes são preenchidos automaticamente com os dados selecionados. - ok

Completar o formulário e enviá-lo.
    Inspecionar o payload da requisição de sendApplication:
        Sucesso (autocompletar do Radar utilizado):
            mainAddressVerified: true - ok


Uma maneira de simular a falha: no arquivo config/uown-origination/.env (ambiente DevOps), remover o valor de:
RADAR_LICENSE_KEY=value
para que as credenciais não possam ser validadas, causando falha na inicialização do Radar.

Tratar Falha na Inicialização do Radar
    Se o Radar falhar na inicialização:
        Todos os campos de endereço devem ser habilitados, exceto o campo state, que permanece desabilitado.
        O campo Street Address não deve mais chamar a API do Radar.
        O usuário deve poder preencher manualmente todas as informações de endereço.

Testar Entrada Manual de Endereço (Caso de Falha)
    Quando o Radar falhar ou estiver indisponível:
        Preencher manualmente todos os campos de endereço (exceto state, que permanece desabilitado e é preenchido automaticamente com base no código postal). - ok
        Garantir que o usuário possa prosseguir normalmente após inserir todas as informações. - ok

Falha (entrada manual/fallback):
mainAddressVerified: false - ok

-----

Usuário insere um endereço incorreto e o corrige para o endereço válido - ok
Durante o processo de preenchimento de dados para criação da aplicação, usuário fornece seu endereço anterior e avança para a próxima etapa, então retorna à etapa anterior e fornece o endereço atual - ok
Aplicações com endereços inválidos são aceitas - ok
Quando Radar está ativado, o campo mainAddressVerified no payload de envio da aplicação deve ser definido como true; quando Radar está desativado, o campo mainAddressVerified deve ser definido como false - ok

**User enters an incorrect address and corrects it to the valid address**

![Screenshot_at_Oct_22_09-49-00](/uploads/f150a2370f37259fdaae7e1503c9ed5b/Screenshot_at_Oct_22_09-49-00.png)

![Screenshot_at_Oct_22_09-54-42](/uploads/d24af197134838d2536ce12325f54cc1/Screenshot_at_Oct_22_09-54-42.png)

![Screenshot_at_Oct_22_09-55-07](/uploads/20dde125b3e8ed9e631f3a3534e7dc34/Screenshot_at_Oct_22_09-55-07.png)

![Screenshot_at_Oct_22_09-55-31](/uploads/036f1629ab5dfaecfe5d206abd718d59/Screenshot_at_Oct_22_09-55-31.png)

![Screenshot_at_Oct_22_09-57-03](/uploads/1dfdf145da0d3452cce7f1ac0ada2748/Screenshot_at_Oct_22_09-57-03.png)

![Screenshot_at_Oct_22_09-57-56](/uploads/920b2845366a00d86b0a10f7687e25ec/Screenshot_at_Oct_22_09-57-56.png)

> **| PASS |**

---

**During the application creation data entry process, user provides their previous address and proceeds to the next step, then returns to the previous step and provides the current address**

![Screenshot_at_Oct_22_09-57-03](/uploads/983778719a020b8d7ecfb341faf9f246/Screenshot_at_Oct_22_09-57-03.png)

![Screenshot_at_Oct_22_09-57-56](/uploads/0c8c79c66040d7f3052b6e95093aac48/Screenshot_at_Oct_22_09-57-56.png)

![Screenshot_at_Oct_22_09-59-17](/uploads/828491979ee00e91bb237c9210951e8e/Screenshot_at_Oct_22_09-59-17.png)

![Screenshot_at_Oct_22_09-59-34](/uploads/797ff2dfa6cc4331e1093e72f6a0b2ba/Screenshot_at_Oct_22_09-59-34.png)

![Screenshot_at_Oct_22_10-01-51](/uploads/97e24b7acb59a728510e7ac1c3c0d62b/Screenshot_at_Oct_22_10-01-51.png)

![Screenshot_at_Oct_22_10-02-20](/uploads/b293d4172b38b4e6c59ec595c263f83f/Screenshot_at_Oct_22_10-02-20.png)

> **| PASS |**

---
**Applications with invalid addresses continue to be accepted when Radar is disabled**

![Screenshot_at_Oct_22_15-42-26](/uploads/4da371f812a8dc6de7fb90d6e8c16d46/Screenshot_at_Oct_22_15-42-26.png)

![Screenshot_at_Oct_22_15-49-07](/uploads/2fc3d0fe02802fb29723e79fcb3ff270/Screenshot_at_Oct_22_15-49-07.png)

> **| PASS |**

---
**When Radar is enabled, the mainAddressVerified field in the application submission payload must be set to true; when Radar is disabled, the mainAddressVerified field must be set to false**

![Screenshot_at_Oct_22_15-17-09](/uploads/7cad950db60d72d33ad641661d02c3bc/Screenshot_at_Oct_22_15-17-09.png)

![Screenshot_at_Oct_22_15-33-25](/uploads/475a37c983b2edfeb4d3b357c45a110a/Screenshot_at_Oct_22_15-33-25.png)

> **| PASS |**
-----

RADAR_LICENSE_KEY=prj_test_pk_7ff403e84d39be6f8070217a462089e7c3b81352

https://gitlab.com/uown/devops/configuration/-/blob/uown-qa2/config/uown-origination/.env
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/420


UOWN | SVC | Refactoring the Address Validator to Automatically Add the State.


Testing Steps
Send a sendApplication request with a null state value.
Verify that the system correctly handles the missing state by fetching the state using the provided ZIP code.
Confirm that the application is accepted and not rejected by the validate address format process due to the missing state.

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | SVC | Refatorando o Validador de Endereço para Adicionar o Estado Automaticamente.

Passos de Teste
Enviar uma requisição sendApplication com o valor de estado nulo.
Verificar se o sistema trata corretamente a ausência do estado buscando o estado usando o CEP informado.
Confirmar que a aplicação é aceita e não é rejeitada pelo processo de validação de formato de endereço devido à ausência do estado.

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

25450




Funcionalidade: Validação de endereço com preenchimento automático do estado
  Para garantir que aplicações não sejam rejeitadas apenas pela ausência do estado
  Um sistema de validação de endereço deve buscar o estado a partir do CEP quando o campo de estado estiver nulo

  Cenário: Aplicação aceita quando o estado é nulo e recuperado pelo CEP
    Dado que uma requisição sendApplication é preparada com o campo de estado nulo
    E o CEP informado corresponde a um estado válido
    Quando a requisição sendApplication é enviada para o serviço de originação
    Então o sistema deve buscar automaticamente o estado utilizando o CEP informado
    E o campo de estado deve ser preenchido com o valor correto do estado
    E a aplicação não deve ser rejeitada pela validação de formato de endereço
    E a aplicação deve ser aceita com sucesso

Feature: Address validation with automatic state completion
  In order to prevent applications from being rejected due to a missing state
  An address validation system must fetch the state from the ZIP code when the state field is null

  Scenario: Application is accepted when state is null and resolved from ZIP code
    Given a sendApplication request is prepared with the state field set to null
    And the provided ZIP code corresponds to a valid state
    When the sendApplication request is sent to the origination service
    Then the system must automatically fetch the state using the provided ZIP code
    And the state field must be populated with the correct state value
    And the application must not be rejected by the address format validation
    And the application must be successfully accepted





> ## Tests in qa1

> ```gherkin

> Scenario: Application is accepted when state is null and resolved from ZIP code
> Given a sendApplication request is prepared with the state field set to null
> And the provided ZIP code corresponds to a valid state
> When the sendApplication request is sent to the origination service
> Then the system must automatically fetch the state using the provided ZIP code
> And the state field must be populated with the correct state value
> And the application must not be rejected by the address format validation
> And the application must be successfully accepted

> !

> **| PASS |**
> **|LeadPk: 25450|**
> ```

---

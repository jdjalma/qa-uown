------------------------------------------------------------------------------------------------------------------------------------------------------------------
https://gitlab.com/uown/backend/svc/-/issues/321

------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | SVC | Update "Invalid Link. lead is in CANCELLED_DUP_SSN status" para uma mensagem amigável

Sinopse
Atualmente, quando um comerciante envia um novo pedido de arrendamento para um cliente que já tem um arrendamento com o estado “Cancelled_Dup_SSN”, 
o sistema devolve a mensagem de erro “Cancelled Dup SSN”.

Pedido de Funcionalidade | Requisitos de Negócio
Em vez de exibir “Invalid Link. lead está em CANCELLED_DUP_SSN status”, exibir "A inscrição é cancelada. Por favor, reaplique."use lead.getLeadInfo().getLeadStatus() userTexto amigável
Não devem ser feitas alterações ao tratamento interno de casos SSN duplicados—apenas a mensagem apresentada deve ser atualizada.

Fernando Martins @fernandogmartins
Mantenedor
Etapas de Teste
Crie um contrato de arrendamento
Criar uma fatura
Salve o link gerado pela fatura (aquele em que você insere as informações do cartão de crédito)
Crie um novo contrato de arrendamento para o mesmo SSN
Verifique se a nova mensagem está presente

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Feature: Atualização da mensagem de erro para SSN duplicado

  Background:
    Given o usuário está logado no sistema

  Scenario: C1 - Criar um contrato de arrendamento
    When o usuário cria um novo contrato de arrendamento para um cliente
    Then o contrato deve ser criado com sucesso

  Scenario: C2 - Criar um novo contrato de arrendamento para o mesmo SSN e validar erro
    Given existe um contrato de arrendamento ativo para um SSN específico
    And o usuário tem o link do contrato gerado anteriormente
    When o usuário cria um novo contrato de arrendamento para o mesmo SSN
    And acessa o link do contrato anterior
    Then o sistema deve exibir a mensagem "Application is Cancelled. Please reapply"
    And o novo contrato não deve ser criado
    When o usuário tenta acessar o link do contrato gerado anteriormente
    Then o sistema deve exibir a mensagem de erro

  Scenario: C3 - Validar que a mensagem antiga não é exibida
    Given um novo contrato de arrendamento para um SSN duplicado foi tentado
    When a mensagem de erro é exibida
    Then a mensagem "Invalid Link. lead está em CANCELLED_DUP_SSN status" não deve estar visível

  Scenario: C4 - Garantir que o tratamento interno para SSN duplicado permanece inalterado
    Given um SSN duplicado foi detectado
    When o sistema processa a tentativa de arrendamento
    Then nenhuma alteração deve ser feita no tratamento interno do SSN duplicado
    And apenas a mensagem de erro exibida ao usuário deve ser alterada


------------------------------------------------------------------------------------------------------------------------------------------------------------------
Tests in qa1

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| X | X | Verify that the system allows the successful creation of a new lease contract | | PASS |
| X | X | Verify that when creating a new lease contract for an existing SSN, the system displays the message "Application is Cancelled. Please reapply" and prevents the creation of the new contract | | PASS |
| X | X | Verify that the message "Invalid Link. lead is in CANCELLED_DUP_SSN status" is not displayed when accessing a canceled lease contract | | PASS |
| X | X | Verify that the internal handling of duplicate SSNs continues to function correctly, with no changes to the business flow | | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

✅ C1 - Criar um contrato de arrendamento
PT: Verificar se o sistema permite a criação de um novo contrato de arrendamento com sucesso.
EN: Verify that the system allows the successful creation of a new lease contract.

✅ C2 - Criar um novo contrato de arrendamento para o mesmo SSN e validar erro
PT: Verificar se ao criar um novo contrato de arrendamento para um SSN existente, o sistema exibe a mensagem "Application is Cancelled. Please reapply" e impede a criação do novo contrato.
EN: Verify that when creating a new lease contract for an existing SSN, the system displays the message "Application is Cancelled. Please reapply" and prevents the creation of the new contract.

✅ C3 - Validar que a mensagem antiga não é exibida
PT: Verificar se a mensagem "Invalid Link. lead está em CANCELLED_DUP_SSN status" não é exibida ao acessar um contrato cancelado.
EN: Verify that the message "Invalid Link. lead is in CANCELLED_DUP_SSN status" is not displayed when accessing a canceled lease contract.

✅ C4 - Garantir que o tratamento interno para SSN duplicado permanece inalterado
PT: Verificar se o tratamento interno para SSN duplicado continua funcionando corretamente, sem alterações no fluxo de negócio.
EN: Verify that the internal handling of duplicate SSNs continues to function correctly, with no changes to the business flow.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa1

------------------------------------------------------------------------------------------------------------------------------------------------------------------
Tests in staging

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 19929 | Terrace Finance | Verify that the system allows the successful creation of a new lease contract | | PASS |
| 19933 and 19934 | Terrace Finance | Verify that when creating a new lease contract for an existing SSN, the system displays the message "Application is Cancelled. Please reapply" and prevents the creation of the new contract | | PASS |
| 19935 | Msa PoweSports | Verify that the message "Invalid Link. lead is in CANCELLED_DUP_SSN status" is not displayed when accessing a canceled lease contract | | PASS |
| 19931 | Tire Agent | Verify that the internal handling of duplicate SSNs continues to function correctly, with no changes to the business flow | | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in staging

------------------------------------------------------------------------------------------------------------------------------------------------------------------
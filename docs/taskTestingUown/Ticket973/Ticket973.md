------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/973

------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Origination| Fix Merchant URL Retention Issue on Clone

BUG
When cloning a merchant, the Merchant URL field retains the previous value, even if the field is cleared or modified before saving. The issue prevents users from properly updating or removing the URL.

Steps-to-Reproduce
1. Access the Origination Portal.
2. Navigate to the Merchant Management section.
3. Add a new merchant or clone an existing merchant.
4. Modify the Merchant URL field to a new value or clear the existing value.
5. Save the changes.
6. Navigate to the newly created or cloned merchant record.
7. Observe that the Merchant URL field displays the previous or default value instead of the updated one.

Marcos Silvano @marcos.pacheco.silva
Test steps
In the origination portal clone any merchant - 
any modifications to the merchant URL must be persisted and the expected value should be displayed when reopening the merchant info.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Feature: Retenção do campo Merchant URL ao clonar um Merchant

  Background:
    Given o usuário está logado no Origination Portal
    And acessa a seção de gerenciamento de Merchant

  Scenario: C1 - Verificar se o Merchant URL é mantido ao clonar um Merchant
    Given o usuário seleciona um Merchant existente
    When o usuário escolhe a opção de clonar esse Merchant
    Then o campo "Merchant URL" deve exibir o mesmo valor do Merchant original
    https://www.paytomorrow.com

  Scenario: C2 - Modificar o Merchant URL ao clonar um Merchant e validar persistência
    Given o usuário está na tela de clonagem de um Merchant
    When o usuário modifica o campo "Merchant URL" para um novo valor
    And salva as alterações
    Then o novo Merchant deve ser criado com o "Merchant URL" atualizado corretamente

  Scenario: C3 - Limpar o campo Merchant URL ao clonar um Merchant e validar persistência
    Given o usuário está na tela de clonagem de um Merchant
    When o usuário limpa o campo "Merchant URL"
    And salva as alterações
    Then o novo Merchant deve ser criado com o campo "Merchant URL" vazio

  Scenario: C4 - Validar o Merchant URL após salvar e reabrir o Merchant clonado
    Given o usuário clonou um Merchant e salvou as alterações
    When o usuário acessa novamente a página desse Merchant clonado
    Then o campo "Merchant URL" deve exibir o valor atualizado e não o valor antigo

  Scenario: C5 - Verificar se a correção funciona ao clonar múltiplos Merchants consecutivamente
    Given o usuário clona um Merchant e modifica o "Merchant URL"
    And salva o primeiro Merchant clonado
    When o usuário clona um segundo Merchant e modifica novamente o "Merchant URL"
    And salva o segundo Merchant clonado
    Then ambos os Merchants clonados devem exibir seus respectivos "Merchant URL" modificados corretamente

  Scenario: C6 - Garantir que ao editar um Merchant clonado, o campo Merchant URL pode ser atualizado corretamente
    Given o usuário criou um Merchant clonado com um "Merchant URL" específico
    When o usuário edita esse Merchant e modifica o "Merchant URL" para um novo valor
    And salva as alterações
    Then ao acessar novamente o Merchant, o "Merchant URL" deve exibir o valor atualizado

  Scenario: C7 - Garantir que o bug não ocorre em Merchants criados manualmente
    Given o usuário cria um novo Merchant manualmente sem clonagem
    When o usuário preenche o campo "Merchant URL" e salva as alterações
    Then ao acessar esse Merchant, o "Merchant URL" deve ser exibido corretamente sem alteração indesejada

------------------------------------------------------------------------------------------------------------------------------------------------------------------

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| X | X | Verify that the Merchant URL is preserved when cloning a Merchant |  | PASS |
| X | X | Verify that the Merchant URL can be modified when cloning a Merchant and ensure the change persists |  | PASS |
| X | X | Verify that the Merchant URL field can be cleared when cloning a Merchant and ensure the removal persists | | PASS |
| X | X | Verify that the Merchant URL persists after saving and reopening the cloned Merchant |  | PASS |
| X | X | Verify that the fix works when cloning multiple Merchants consecutively |  | PASS |
| X | X | Verify that the Merchant URL field can be correctly updated when editing a cloned Merchant | | PASS |
| X | X | Verify that the bug does not occur in manually created Merchants |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verificar se o Merchant URL é preservado ao clonar um Merchant
→ Verify that the Merchant URL is preserved when cloning a Merchant

Modificar o Merchant URL ao clonar um Merchant e validar a persistência da alteração
→ Verify that the Merchant URL can be modified when cloning a Merchant and ensure the change persists

Limpar o campo Merchant URL ao clonar um Merchant e validar a persistência da remoção
→ Verify that the Merchant URL field can be cleared when cloning a Merchant and ensure the removal persists

Validar a persistência do Merchant URL após salvar e reabrir o Merchant clonado
→ Verify that the Merchant URL persists after saving and reopening the cloned Merchant

Verificar se a correção funciona ao clonar múltiplos Merchants consecutivamente
→ Verify that the fix works when cloning multiple Merchants consecutively

Garantir que, ao editar um Merchant clonado, o campo Merchant URL pode ser atualizado corretamente
→ Verify that the Merchant URL field can be correctly updated when editing a cloned Merchant

Garantir que o bug não ocorre em Merchants criados manualmente
→ Verify that the bug does not occur in manually created Merchants

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa1

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in staging

| Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ |
| MSA PowerSports | Verify that the Merchant URL is preserved when cloning a Merchant |  | PASS |
| MSA PowerSports | Verify that the Merchant URL can be modified when cloning a Merchant and ensure the change persists |  | PASS |
| MSA PowerSports | Verify that the Merchant URL field can be cleared when cloning a Merchant and ensure the removal persists | | PASS |
| MSA PowerSports | Verify that the Merchant URL persists after saving and reopening the cloned Merchant |  | PASS |
| MSA PowerSports | Verify that the fix works when cloning multiple Merchants consecutively |  | PASS |
| MSA PowerSports | Verify that the Merchant URL field can be correctly updated when editing a cloned Merchant | | PASS |
| MSA PowerSports | Verify that the bug does not occur in manually created Merchants |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in staging

------------------------------------------------------------------------------------------------------------------------------------------------------------------
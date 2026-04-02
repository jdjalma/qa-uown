------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/servicing/-/issues/463

------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Servicing | Display Autopay and IsValid flags in Credit Card Section

Synopsis
Add the autoPay and isValid flags to the "View All" page interface found in the credit card section, displaying this information for each card. 
Add new columns with an edit icon next to each entry. The icon should allow quick and isolated editing of these two flags only.

Business Objective
* Increase transparency and control for Agents over the status of credit cards.
* Feature Request | Business Requirements
* Add two new columns: autoPay and isValid.
* Insert an edit icon at the end of each row.
* Editing must not allow modifying other card information.
* Validate the success of the operation and update the interface without reloading the entire page.
* Ensure that only users with appropriate permissions can view and edit the flags.


Marcos Silvano @marcos.pacheco.silva

test instructions
To modify the credit card info the pencil icon in the right side of the row must be clicked. Only one credit card should be editable at given time.
To persist the changes use the save button.

required permission
The option to edit the credit card should appear only if the role has the edit credit cards permission.

-----

UOWN | Serviços | Exibir as marcações de Autopay e IsValid na Seção de Cartão de Crédito
Sinopse
Adicionar as marcações autoPay e isValid à interface da página "Ver Tudo" encontrada na seção de cartão de crédito, exibindo esta informação para cada cartão.
Adicionar novas colunas com um ícone de edição ao lado de cada entrada. O ícone deve permitir a edição rápida e isolada apenas dessas duas marcações.
    Criar cenário que verifica se ao editar cc é alterado apenas o que foi editado
Objetivo de Negócio

Aumentar a transparência e o controle dos Agentes sobre o status dos cartões de crédito.
Solicitação de Recurso | Requisitos de Negócio
Adicionar duas novas colunas: autoPay e isValid.
Inserir um ícone de edição no final de cada linha.
   criar cenário para Verificar se é possivel editar mais de um cc simultaneamente
    criar cenário para Verificar os logs quando editar um cartão Autopay ativando/desativando autopay
    criar cenário para Verificar os logs quando editar um cartão Autopay desativando/ativando is valid
    criar cenário para Verificar os logs quando editar um cartao que não é autopay ativando autopay
    criar cenário para Verificar os logs quando editar um cartao que não é autopay desativando/ativando
A edição não deve permitir a modificação de outras informações do cartão.
Validar o sucesso da operação e atualizar a interface sem recarregar a página inteira.
Garantir que apenas usuários com permissões apropriadas possam visualizar e editar as marcações.

Marcos Silvano @marcos.pacheco.silva
Instruções de teste
Para modificar as informações do cartão de crédito, o ícone de lápis no lado direito da linha deve ser clicado. Apenas um cartão de crédito deve ser editável por vez.
Para persistir as alterações, use o botão salvar.
Permissão necessária
A opção para editar o cartão de crédito deve aparecer apenas se o papel tiver a permissão de editar cartões de crédito.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

📋 Requisito da Tarefa
Exibir as marcações autoPay e isValid na seção de Cartão de Crédito, com ícones de edição que permitem a edição isolada dessas marcações, sem modificar outras informações do cartão.
Garantir que apenas usuários com permissões apropriadas possam visualizar e editar essas marcações.


🧪 Cenários de Teste Gherkin

Scenario 1 – Verificar se apenas a marcação editada é alterada

Scenario: 1 - Verificar se apenas a marcação editada é alterada
  Given que o usuário acessa a página "Ver Tudo" na seção de Cartão de Crédito
  And o usuário clica no ícone de edição da marcação "autoPay" para um cartão de crédito
  When o usuário altera a marcação "autoPay"
  Then apenas a marcação "autoPay" deve ser alterada, sem modificar outras informações do cartão
  And o botão de salvar deve ser clicado para persistir a alteração

🔍 Verifique se, ao editar a marca de autoPay para um cartão de crédito, apenas essa marcação é alterada, sem modificar outros dados do cartão.
📝 Explicação: Este cenário valida que a edição isolada de um cartão de crédito respeita as modificações apenas nas marcações de autoPay e isValid, sem afetar outras informações.
✅ Resultado Esperado: A marca de autoPay é alterada corretamente, enquanto outras informações do cartão permanecem inalteradas.

-----

Scenario 2 – Verificar se é possível editar mais de um cartão de crédito simultaneamente

Scenario: 2 - Verificar se é possível editar mais de um cartão de crédito simultaneamente
  Given que o usuário acessa a página "Ver Tudo" na seção de Cartão de Crédito
  When o usuário tenta editar mais de um cartão de crédito ao mesmo tempo
  Then o sistema deve permitir a edição de apenas um cartão de cada vez
  And o ícone de edição deve ser desabilitado para os outros cartões enquanto uma edição estiver em andamento

🔍 Verifique se apenas um cartão de crédito pode ser editado por vez, e se os outros cartões estão desabilitados para edição enquanto um estiver sendo modificado.
📝 Explicação: Este cenário valida a restrição de edição de apenas um cartão de cada vez na interface.
✅ Resultado Esperado: O ícone de edição deve estar disponível apenas para um único cartão de crédito e os demais devem estar desabilitados para edição.

-----

Scenario 3 – Verificar os logs quando a marcação autoPay é ativada/desativada e garantir que apenas um cartão tenha autoPay ativado

Scenario: 3 - |Verificar os logs quando editar um cartão e alterar a marcação autoPay
  Given que o usuário clica no ícone de edição para alterar a marcação "autoPay" de um cartão de crédito
  And há **somente um cartão com autoPay ativado**
  When o usuário ativa ou desativa a marcação "autoPay" e salva a alteração
  Then o log de atividade deve registrar a alteração da marcação "autoPay"
  And o log deve incluir o valor alterado (ativado/desativado) e o ID do cartão alterado
  And deve garantir que apenas um cartão tenha autoPay ativado ao mesmo tempo

🔍 Verifique se, ao alterar a marcação autoPay, o log de atividade registra corretamente a alteração, incluindo o valor alterado (ativado ou desativado) e o ID do cartão alterado.
📝 Explicação: Esse cenário valida que a alteração da marcação autoPay seja registrada corretamente, somente um cartão pode ter autoPay ativado, e os logs de atividade reflitam a mudança corretamente.
✅ Resultado Esperado: O log de atividade deve registrar as alterações de autoPay, incluindo o ID do cartão e o status alterado. Além disso, garanta que apenas um cartão tenha autoPay ativado ao mesmo tempo, não permitindo múltiplos cartões com autoPay ativo.

Frase de Verificação para Evidenciar a Tarefa
Verifique se, ao alterar a marcação autoPay de um cartão, o log de atividade é gerado corretamente, refletindo a alteração da marcação ativada/desativada e o ID do cartão alterado, garantindo que somente um cartão tenha autoPay ativado ao mesmo tempo.

-----

Scenario 4 – Verificar os logs quando a marcação isValid é alterada

Scenario: 4 - Verificar os logs quando editar um cartão e alterar a marcação isValid
  Given que o usuário clica no ícone de edição para alterar a marcação "isValid" de um cartão de crédito
  When o usuário ativa ou desativa a marcação "isValid" e salva a alteração
  Then o log de atividade deve registrar a alteração da marcação "isValid"
  And o log deve incluir o valor alterado (ativado/desativado)

🔍 Verifique se, ao alterar a marcação isValid, o log de atividade registra a alteração corretamente, incluindo o autopay alterado (ativado ou desativado)
📝 Explicação: Esse cenário valida se o log de atividade reflete corretamente as modificações feitas na marcação isValid.
✅ Resultado Esperado: O log de atividade deve registrar as alterações de isValid e o status alterado.

-----

Scenario 5 – Verificar os logs quando um cartão sem autoPay ativo tem a marcação autoPay ativada

Scenario: 5 - Verificar os logs quando editar um cartão que não é autopay e ativar autoPay
  Given que o usuário clica no ícone de edição para um cartão de crédito que não possui autoPay
  When o usuário ativa a marcação "autoPay" e salva a alteração
  Then o log de atividade deve registrar a ativação do autoPay para o cartão
  And o log deve incluir o ID do cartão e o novo status do autoPay como "ativado"

🔍 Verifique se, ao ativar autoPay para um cartão que não possuía essa marcação, o log de atividade é gerado corretamente, registrando a ativação do autoPay.
📝 Explicação: Esse cenário valida se a ativação de autoPay em um cartão sem essa marcação ativa gera um log de atividade adequado.
✅ Resultado Esperado: O log de atividade deve registrar a ativação de autoPay, incluindo o ID do cartão e o novo status.

-----

Scenario 6 – Verificar os logs quando um cartão com autoPay é desativado

Scenario: 6 - Verificar os logs quando editar um cartão com autoPay e desativar autoPay
  Given que o usuário clica no ícone de edição para um cartão de crédito com autoPay ativo
  When o usuário desativa a marcação "autoPay" e salva a alteração
  Then o log de atividade deve registrar a desativação do autoPay para o cartão
  And o log deve incluir o ID do cartão e o novo status do autoPay como "desativado"

🔍 Verifique se, ao desativar autoPay para um cartão que já tinha essa marcação ativa, o log de atividade é gerado corretamente, registrando a desativação do autoPay.
📝 Explicação: Esse cenário valida se a desativação de autoPay para um cartão que já tinha essa marcação ativa gera um log de atividade adequado.
✅ Resultado Esperado: O log de atividade deve registrar a desativação de autoPay, incluindo o ID do cartão e o novo status.

-----

Scenario Outline 7 Verificar se a opção de editar o cartão de crédito é exibida somente para usuários com a permissão de editar cartões de crédito

Scenario Outline: 7 - Verificar se a opção de editar o cartão de crédito é exibida somente para usuários com a permissão de editar cartões de crédito
  Given que o usuário tem a permissão "<permission>"
  When o usuário acessa a página de informações de cartão de crédito
  Then o ícone de edição deve estar "<visibility>" para o cartão de crédito
  And o usuário deve ser capaz de editar a marcação "autoPay" para o cartão de crédito quando o ícone de edição estiver visível

  Examples:
    | permission            | visibility |
    | editar_cartao_credito | visível    |
    | sem editar_cartao_credito | oculto   |

🔍 Verifique se o ícone de edição está visível apenas para usuários com a permissão "editar_cartao_credito" e oculto para aqueles sem essa permissão.
📝 Explicação: Este Scenario Outline valida que a opção de editar um cartão de crédito só deve estar disponível para usuários com a permissão apropriada.
✅ Resultado Esperado: O ícone de edição será visível e editável para usuários com a permissão "editar_cartao_credito", e estará oculto para usuários sem essa permissão.
Frase de Verificação para Evidenciar a Tarefa:
Verifique se, quando o usuário tem a permissão "editar_cartao_credito", o ícone de edição do cartão de crédito é visível e funcional, e quando o usuário não tem a permissão, o ícone de edição deve estar oculto.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verifique se, ao editar a marca de autoPay para um cartão de crédito, apenas essa marcação é alterada, sem modificar outros dados do cartão
Verify if, when editing the autoPay flag for a credit card, only that flag is changed, without modifying other card data

Verifique se apenas um cartão de crédito pode ser editado por vez, e se os outros cartões estão desabilitados para edição enquanto um estiver sendo modificado
Verify if only one credit card can be edited at a time, and if other cards are disabled for editing while one is being modified

Verifique se, ao alterar a marcação autoPay de um cartão, o log de atividade é gerado corretamente, refletindo a alteração da marcação ativada/desativada, garantindo que somente um cartão tenha autoPay ativado
Verify if, when changing a card's autoPay flag, the activity log is correctly generated, reflecting the change of enabled/disabled flag, ensuring that only one card has autoPay enabled

Verifique se, ao alterar a marcação isValid, o log de atividade registra a alteração corretamente e o cartão é removido da exibição
Verify if, when changing the isValid flag, the activity log records the change correctly and the card is removed from displayRetryClaude can make mistakes. Please double-check responses.

Verifique se, ao ativar autoPay para um cartão que não possuía essa marcação, o log de atividade é gerado corretamente, registrando a ativação do autoPay
Verify if, when enabling autoPay for a card that did not have this flag, the activity log is correctly generated, recording the activation of autoPay

Verifique se, ao desativar autoPay para um cartão que já tinha essa marcação ativa, o log de atividade é gerado corretamente, registrando a desativação do autoPay
Verify if, when disabling autoPay for a card that already had this flag active, the activity log is correctly generated, recording the deactivation of autoPay

Verifique se o ícone de edição está visível apenas para usuários com a permissão "editar_cartao_credito" e oculto para aqueles sem essa permissão
Verify if the edit icon is visible only to users with the "edit_credit_card" permission and hidden for those without this permissionRetryClaude can make mistakes. Please double-check responses.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa1

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| X | X | Verify if, when editing the autoPay flag for a credit card, only that flag is changed, without modifying other card data |  | PASS |
| X | X | Verify if only one credit card can be edited at a time, and if other cards are disabled for editing while one is being modified |  | PASS |
| X | X | Verify if, when changing a card's autoPay flag, the activity log is correctly generated, reflecting the change of enabled/disabled flag, ensuring that only one card has autoPay enabled |  | PASS |
| X | X | Verify if, when changing the isValid flag, the activity log records the change correctly and the card is removed from displayRetryClaude can make mistakes. Please double-check responses. |  | PASS |
| X | X | Verify if, when enabling autoPay for a card that did not have this flag, the activity log is correctly generated, recording the activation of autoPay |  | PASS |
| X | X | Verify if, when disabling autoPay for a card that already had this flag active, the activity log is correctly generated, recording the deactivation of autoPay |  | PASS |
| X | X | Verify if the edit icon is visible only to users with the "edit_credit_card" permission and hidden for those without this permissionRetryClaude can make mistakes. Please double-check responses. |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa1

------------------------------------------------------------------------------------------------------------------------------------------------------------------

stg

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verifique se, ao editar a marca de autoPay para um cartão de crédito, apenas essa marcação é alterada, sem modificar outros dados do cartão
Verify if, when editing the autoPay flag for a credit card, only that flag is changed, without modifying other card data

Verifique se apenas um cartão de crédito pode ser editado por vez, e se os outros cartões estão desabilitados para edição enquanto um estiver sendo modificado
Verify if only one credit card can be edited at a time, and if other cards are disabled for editing while one is being modified

Verifique se, ao alterar a marcação autoPay de um cartão, o log de atividade é gerado corretamente, refletindo a alteração da marcação ativada/desativada, garantindo que somente um cartão tenha autoPay ativado
Verify if, when changing a card's autoPay flag, the activity log is correctly generated, reflecting the change of enabled/disabled flag, ensuring that only one card has autoPay enabled

Verifique se, ao alterar a marcação isValid, o log de atividade registra a alteração corretamente no log e banco de dados
Verify if, when changing the isValid flag, the activity log correctly records the change in the log and databaseRetryClaude can make mistakes. Please double-check responses.

Verifique se, ao ativar autoPay para um cartão que não possuía essa marcação, o log de atividade é gerado corretamente, registrando a ativação do autoPay
Verify if, when enabling autoPay for a card that did not have this flag, the activity log is correctly generated, recording the activation of autoPay

Verifique se, ao desativar autoPay para um cartão que já tinha essa marcação ativa, o log de atividade é gerado corretamente, registrando a desativação do autoPay
Verify if, when disabling autoPay for a card that already had this flag active, the activity log is correctly generated, recording the deactivation of autoPay

Verifique se o ícone de edição está visível apenas para usuários com a permissão "editar_cartao_credito" e oculto para aqueles sem essa permissão
Verify if the edit icon is visible only to users with the "edit_credit_card" permission and hidden for those without this permissionRetryClaude can make mistakes. Please double-check responses.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in stg

| AccountPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 206267 | Progress Mobility | Verify if, when editing the autoPay flag for a credit card, only that flag is changed, without modifying other card data |  | PASS |
| 206267 | Progress Mobility | Verify if only one credit card can be edited at a time, and if other cards are disabled for editing while one is being modified |  | PASS |
| 206267 | Progress Mobility | Verify if, when changing a card's autoPay flag, the activity log is correctly generated, reflecting the change of enabled/disabled flag, ensuring that only one card has autoPay enabled |  | PASS |
| 206267 | Progress Mobility | Verify if, when changing the isValid flag, the activity log records the change correctly and the card is removed from displayRetryClaude can make mistakes. Please double-check responses. |  | PASS |
| 206267 | Progress Mobility | Verify if, when enabling autoPay for a card that did not have this flag, the activity log is correctly generated, recording the activation of autoPay |  | PASS |
| 206267 | Progress Mobility | Verify if, when disabling autoPay for a card that already had this flag active, the activity log is correctly generated, recording the deactivation of autoPay |  | PASS |
| 206267 | Progress Mobility | Verify if the edit icon is visible only to users with the "edit_credit_card" permission and hidden for those without this permissionRetryClaude can make mistakes. Please double-check responses. |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in stg

------------------------------------------------------------------------------------------------------------------------------------------------------------------
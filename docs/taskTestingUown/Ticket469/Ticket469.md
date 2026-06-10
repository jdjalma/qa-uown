-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/servicing/-/issues/469

# UOWN | Servicing | Display modified credit card information in logs

**Status:** Open  
**Created:** 3 weeks ago by Yuri Araujo

## Synopsis
Currently, when performing actions on credit cards (such as editing, activation, deactivation, etc.), 
the system-generated log does not display which card was modified, making it difficult to trace and audit these actions.

## Business Objective
Improve traceability and transparency of credit card-related operations within the system. 
Displaying relevant card information (e.g., last four digits or internal ID) in the logs will help analysts, support agents, and auditors clearly 
understand which card was affected by each recorded action.

## Feature Request | Business Requirements

- Update the log generation logic for all credit card-related actions.
- Include a clear reference to the modified card in the log.
- Ensure the information is consistently displayed across all types of card changes.
- Validate that the log content is accessible and understandable in the admin interface.
- Ensure that no sensitive data (e.g., full card number) is exposed in the logs.

---

Tests Steps
## Steps to Reproduce

1. Log into the Servicing Portal.
2. Navigate to the Credit Card section.
3. Make sure the user has permission to edit cards.
4. Click on the "View All" button.
5. Click the edit (pencil icon) at the end of the row for any card listed under "All Credit Cards".
6. In the form that appears:
   - Set "Is Valid Card" to false.
   - Fill in the "Invalid Reason" field with any test message (e.g., test).
   - Click Save.
7. Verify that the activity log contains a message showing the last four digits of the card that was edited.

**📝 Example of expected log message:**  
`UPDATED : CreditCard[ isValidCard changed from true to false ; invalidCardReason changed to test on card **** 2224 ]`

---

## Image 1 - Description

> ![Imagem 1](attachment:image1)

- **Context:** Modal window titled **"All Credit Cards"** inside the Uown platform, displaying a list of credit cards for a customer.
- **Details shown:**
  - Columns: First Name, Last Name, Card Number (masked), Exp Date, Invalid Reason, Is Valid (toggle), Auto Pay (toggle).
  - Two cards are listed: one ending in 4242 (with toggle ON for "Is Valid" and "Auto Pay"), and another ending in 1111 (with toggle OFF for both).
  - The user is interacting with the "Is Valid" toggle for the card ending in 1111, changing its status.

## Image 2 - Description

> ![Imagem 2](attachment:image2)

- **Context:** Admin or audit log entry after performing the action described above.
- **Details shown:**
  - Log entry with date/time, event type (DATA_CHANGE), username (`jmendes.gow`).
  - Message:  
    `UPDATED : CreditCard[ isValidCard changed from true to false ; invalidCardReason changed to test ]`
  - **Observation:** The log does **not** yet display which card was changed (missing last four digits or ID).

---

## Expected Behavior

After performing the action (editing a card and saving), the log entry should clearly state which card was affected, for example:


--------------------


# UOWN | Servicing | Exibir informações do cartão de crédito modificado nos logs

**Status:** Aberto  
**Criado:** Há 3 semanas por Yuri Araujo

## Sinopse
Atualmente, ao realizar ações em cartões de crédito (como edição, ativação, desativação, etc.), o log gerado pelo sistema não exibe qual cartão foi modificado, 
dificultando o rastreamento e a auditoria dessas ações.

## Objetivo de Negócio
Melhorar a rastreabilidade e transparência das operações relacionadas a cartões de crédito dentro do sistema. 
Exibir informações relevantes do cartão (ex: últimos quatro dígitos ou ID interno) nos logs ajudará analistas, 
agentes de suporte e auditores a entenderem claramente qual cartão foi afetado por cada ação registrada.

## Requisito de Funcionalidade | Requisitos de Negócio

- Atualizar a lógica de geração dos logs para todas as ações relacionadas a cartões de crédito.
- Incluir uma referência clara ao cartão modificado no log.
- Garantir que a informação seja exibida de forma consistente em todos os tipos de alteração de cartão.
- Validar que o conteúdo do log seja acessível e compreensível na interface administrativa.
- Garantir que nenhum dado sensível (ex: número completo do cartão) seja exposto nos logs.

---

Tests Steps
## Passos para Reproduzir

1. Faça login no Portal de Atendimento (Servicing Portal).
2. Navegue até a seção de Cartões de Crédito.
3. Certifique-se de que o usuário tem permissão para editar cartões.
4. Clique no botão "Ver Todos" ("View All").
5. Clique no ícone de editar (lápis) no final da linha de qualquer cartão listado em "Todos os Cartões de Crédito".
6. No formulário que aparecer:
   - Defina "Cartão Válido" ("Is Valid Card") como falso.
   - Preencha o campo "Motivo da Invalidade" ("Invalid Reason") com qualquer mensagem de teste (ex: teste).
   - Clique em Salvar.
7. Verifique se o log de atividades contém uma mensagem mostrando os últimos quatro dígitos do cartão que foi editado.

**📝 Exemplo de mensagem esperada no log:**  
`UPDATED : CreditCard[ isValidCard changed from true to false ; invalidCardReason changed to test on card **** 2224 ]`

---

## Imagem 1 - Descrição

> ![Imagem 1](attachment:image1)

- **Contexto:** Janela modal intitulada **"Todos os Cartões de Crédito"** dentro da plataforma Uown, exibindo uma lista de cartões do cliente.
- **Detalhes exibidos:**
  - Colunas: Primeiro Nome, Sobrenome, Número do Cartão (mascarado), Data de Expiração, Motivo da Invalidade, É Válido (toggle), Débito Automático (toggle).
  - Dois cartões listados: um terminando em 4242 (com toggle ativado para "É Válido" e "Débito Automático") e outro terminando em 1111 (com ambos os toggles desativados).
  - O usuário está interagindo com o toggle "É Válido" do cartão terminando em 1111, alterando seu status.

## Imagem 2 - Descrição

> ![Imagem 2](attachment:image2)

- **Contexto:** Entrada de log administrativo ou de auditoria após executar a ação acima.
- **Detalhes exibidos:**
  - Log com data/hora, tipo do evento (DATA_CHANGE), usuário (`jmendes.gow`).
  - Mensagem:  
    `UPDATED : CreditCard[ isValidCard changed from true to false ; invalidCardReason changed to test ]`
  - **Observação:** O log **ainda não** exibe qual cartão foi alterado (faltam os últimos quatro dígitos ou ID).

---

## Comportamento Esperado

Após realizar a ação (editar um cartão e salvar), o log deve informar claramente qual cartão foi afetado, por exemplo:

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


Servicing
    Adicionar cartão de crédito
    Excluir cartão de Crédito
    Tornar inválido inserindo motivo
    Tornar válido --> Quando torna válido exibe que o motivo saiu de "Xpto" para "", podemos nesse caso exibir saiu de "Xpto" para "none"
    Ativar autopay
    Desativar autopay
    Autopay ativado para algum cartão, ativo autopay para outro cartão e salvo, cartão que tinha autopay ativado desativa automaticamente --> Quando torna válido exibe que o motivo saiu de "Xpto" para "", podemos nesse caso exibir saiu de "Xpto" para "none"
    Está inválido e autopay desativado, tornar válido e ativar autopay
    Está válido e autopay desativado, tornar inválido e ativar autopay
    Está inválido e autopay ativado, tornar válido e desativar autopay --> Quando torna válido exibe que o motivo saiu de "Xpto" para "", podemos nesse caso exibir saiu de "Xpto" para "none"
    Está válido e autopay ativado, tornar inválido e desativar autopay

-----

Quando um cartão é tornado válido, o campo `invalidCardReason` é limpo (fica vazio). Para manter clareza e padronização nos logs, sugiro que o sistema registre a alteração exibindo explicitamente que o motivo foi removido, mostrando, por exemplo:  
`invalidCardReason alterado de 'Xpto' para 'none'`  
Assim, fica claro que o invalidCardReason ficou sem preenchimento.

---

When a card is made valid, the `invalidCardReason` field is cleared (becomes empty). To maintain clarity and standardization in the logs, I suggest that the system records the change by explicitly displaying that the reason was removed, showing, for example:
`invalidCardReason changed from 'Xpto' to 'none'`
This way, it is clear that the invalidCardReason was left empty.

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Adicionar cartão de crédito.

Excluir cartão de crédito

Tornar inválido inserindo motivo

Tornar válido
Motivo removido, log ajustado para exibir mudança de "Xpto" para " ".

Ativar autopay

Desativar autopay

Ativar autopay em outro cartão (desativa anterior)

Verificar se ao tornar válido e ativar autopay em cc Inválido e autopay desativado exibe log
Motivo removido, log ajustado para exibir mudança de "Xpto" para " ".

Verificar se ao tornar inválido e ativar autopay em cc válido e autopay desativado exibe log 
Cartão invalidado e autopay ativado, ambos no log.

Verificar se ao tornar válido e desativar autopay em cc inválido e autopay ativado exibe log
Motivo removido, log ajustado para exibir mudança de "Xpto" para " ".

Verificar se ao tornar inválido e desativar autopay em cc válido e autopay ativado exibe log

-----

Tests in qa1

| AccountPk | Merchant | Test Case | Test Data | Status |
| ------ | -------- | --------- | --------- | ------ |
| 3930 | Progress Mobility | Adicionar cartão de crédito. | | PASS |
| 3930 | Progress Mobility | Excluir cartão de crédito. | | PASS |
| 3930 | Progress Mobility | Tornar inválido inserindo motivo. | | PASS |
| 3930 | Progress Mobility | Tornar válido: Motivo removido, log ajustado para exibir mudança de "Xpto" para "none". | | PASS |
| 3930 | Progress Mobility | Ativar autopay. | | PASS |
| 3930 | Progress Mobility | Desativar autopay. | | PASS |
| 3930 | Progress Mobility | Ativar autopay em outro cartão (desativa anterior). | | PASS |
| 3930 | Progress Mobility | Tornar válido e ativar autopay em cartão inválido e autopay desativado: Motivo removido, log ajustado para exibir mudança de "Xpto" para "none". | | PASS |
| 3930 | Progress Mobility | Tornar inválido e ativar autopay em cartão válido e autopay desativado: Cartão invalidado e autopay ativado, ambos no log. | | PASS |
| 3930 | Progress Mobility | Tornar válido e desativar autopay em cartão inválido e autopay ativado: Motivo removido, log ajustado para exibir mudança de "Xpto" para "none". | | PASS |
| 3930 | Progress Mobility | Tornar inválido e desativar autopay em cartão válido e autopay ativado. | | PASS |


-----

Tests in qa1

| AccountPk | Merchant           | Test Case | Test Data | Status |
| --------- | ------------------ | --------- | --------- | ------ |
| 3930      | Progress Mobility  | Add credit card. | | PASS |
| 3930      | Progress Mobility  | Delete credit card. | | PASS |
| 3930      | Progress Mobility  | Invalidate card by entering reason. | | PASS |
| 3930      | Progress Mobility  | Make card valid: Reason removed, log adjusted to show change from "Xpto" to " ". | | PASS |
| 3930      | Progress Mobility  | Enable autopay. | | PASS |
| 3930      | Progress Mobility  | Disable autopay. | | PASS |
| 3930      | Progress Mobility  | Enable autopay on another card (previous one automatically disabled). | | PASS |
| 3930      | Progress Mobility  | Make valid and enable autopay on card that was invalid and autopay disabled: Reason removed, log adjusted to show change from "Xpto" to " ". | | PASS |
| 3930      | Progress Mobility  | Make invalid and enable autopay on card that was valid and autopay disabled: Card invalidated and autopay enabled, both logged. | | PASS |
| 3930      | Progress Mobility  | Make valid and disable autopay on card that was invalid and autopay enabled: Reason removed, log adjusted to show change from "Xpto" to " ". | | PASS |
| 3930      | Progress Mobility  | Make invalid and disable autopay on card that was valid and autopay enabled. | | PASS |

-----

Tests in qa1

| AccountPk | Merchant           | Test Case | Test Data | Status |
| --------- | ------------------ | --------- | --------- | ------ |
| 3930      | Progress Mobility  | Add credit card. |![Screenshot_2](/uploads/9f105e648d95c5a6b2389e0f50c1fa2e/Screenshot_2.png){width=693 height=53} | PASS |
| 3930      | Progress Mobility  | Delete credit card. | ![delete](/uploads/b8c484ad202718f7b1cf308280d43947/delete.png){width=641 height=36} | PASS |
| 3930      | Progress Mobility  | Invalidate card by entering reason. | ![tonarinvalidoinserindomotivo](/uploads/88a687a4306ddb2e69598f9e250291dd/tonarinvalidoinserindomotivo.png){width=677 height=39} | PASS |
| 3930      | Progress Mobility  | Make card valid: Reason removed, log adjusted to show change from "Xpto" to " ". | ![Screenshot_2](/uploads/2209bb1cea79964c221392efc642cc82/Screenshot_2.png){width=690 height=43} | PASS |
| 3930      | Progress Mobility  | Enable autopay. | ![ativarautopay](/uploads/5705502550fff7834fbd341dda60c73e/ativarautopay.png){width=679 height=36} | PASS |
| 3930      | Progress Mobility  | Disable autopay. | ![desativarautopay](/uploads/306c65c9d11f05cdc63342626c11995d/desativarautopay.png){width=679 height=36} | PASS |
| 3930      | Progress Mobility  | Enable autopay on another card (previous one automatically disabled). | ![ativarautopay](/uploads/12f13e3b42ad88a97c060fd50abee129/ativarautopay.png){width=679 height=36} | PASS |
| 3930      | Progress Mobility  | Make valid and enable autopay on card that was invalid and autopay disabled: Reason removed, log adjusted to show change from "Xpto" to " ". | ![tonarvalidoativarautopay](/uploads/f572b8ade0289c65a9a5b70afb8cc436/tonarvalidoativarautopay.png){width=682 height=54} | PASS |
| 3930      | Progress Mobility  | Make invalid and enable autopay on card that was valid and autopay disabled: Card invalidated and autopay enabled, both logged. | ![tornarinvalidoauttopayativado](/uploads/bd980ba506a6ad0372a05a878818e6f5/tornarinvalidoauttopayativado.png){width=687 height=49} | PASS |
| 3930      | Progress Mobility  | Make valid and disable autopay on card that was invalid and autopay enabled: Reason removed, log adjusted to show change from "Xpto" to " ". | ![tornarvalidodesativarautopay](/uploads/0800fe498d2ea298c89eebf6e3b96e4d/tornarvalidodesativarautopay.png){width=687 height=50} | PASS |
| 3930      | Progress Mobility  | Make invalid and disable autopay on card that was valid and autopay enabled. | ![Screenshot_11](/uploads/d8ed955181ef7e0c6dd7355aacddb5a7/Screenshot_11.png){width=696 height=53} | PASS |

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

tests in stg

Tests in qa1



Add credit card. 
Delete credit card. 
Invalidate card by entering reason. 
Make card valid: Reason removed, log adjusted to show change from "Xpto" to " ". 
Enable autopay. 
Disable autopay. 
Enable autopay on another card (previous one automatically disabled).
Make valid and enable autopay on card that was invalid and autopay disabled: Reason removed, log adjusted to show change from "Xpto" to " ".
Make invalid and enable autopay on card that was valid and autopay disabled: Card invalidated and autopay enabled, both logged. 
Make valid and disable autopay on card that was invalid and autopay enabled: Reason removed, log adjusted to show change from "Xpto" to " ". 
Make invalid and disable autopay on card that was valid and autopay enabled.

Adicionar cartão de crédito.
Excluir cartão de crédito.
Invalidar cartão informando o motivo.
Tornar cartão válido: Motivo removido, log ajustado para mostrar a alteração de "Xpto" para " ".
Ativar pagamento automático (autopay).
Desativar pagamento automático (autopay).
Ativar pagamento automático em outro cartão (o anterior é desativado automaticamente).
Tornar válido e ativar pagamento automático em cartão que estava inválido e com autopay desativado: Motivo removido, log ajustado para mostrar a alteração de "Xpto" para " ".
Invalidar e ativar pagamento automático em cartão que estava válido e com autopay desativado: Cartão invalidado e autopay ativado, ambos registrados em log.
Tornar válido e desativar autopay em cartão que estava inválido e com autopay ativado: Motivo removido, log ajustado para mostrar a alteração de "Xpto" para " ".
Invalidar e desativar autopay em cartão que estava válido e com autopay ativado.

-----

> ## Tests in stg
> ```gherkin
>Feature: Exibição de informações do cartão modificado nos logs
>  
> ### Scenario: Registrar informações identificáveis ao adicionar um cartão de crédito
>  When o usuário adiciona um novo cartão de crédito
>  Then um log deve ser gerado contendo a referência ao cartão adicionado (últimos quatro dígitos ou ID interno)
>  And o log não deve exibir o número completo do cartão
> ```
>
img
>
> ```gherkin
> ### Scenario: Registrar informações identificáveis ao excluir um cartão de crédito
>  Given que o usuário possui um cartão de crédito cadastrado
>  When o usuário exclui o cartão de crédito
>  Then um log deve ser gerado contendo a referência ao cartão excluído (últimos quatro dígitos ou ID interno)
>  And o log não deve exibir o número completo do cartão
> ```
>
img
>
> ```gherkin
> ### Scenario: Registrar informações identificáveis ao invalidar um cartão de crédito
>  Given que o usuário possui um cartão de crédito válido
>  When o usuário invalida o cartão informando o motivo "Xpto"
>  Then um log deve ser gerado contendo a referência ao cartão invalidado (últimos quatro dígitos ou ID interno) e o motivo informado
>  And o log não deve exibir o número completo do cartão
>  
> ### Scenario: Registrar informações ao tornar um cartão válido removendo o motivo
>  Given que o cartão de crédito está inválido com motivo "Xpto"
>  When o usuário remove o motivo de invalidação
>  Then um log deve ser gerado contendo a referência ao cartão e a alteração do motivo de "Xpto" para " "
>  And o log não deve exibir o número completo do cartão
> ```
>
img
>
> ```gherkin
> ### Scenario: Registrar informações ao ativar ou desativar o pagamento automático (autopay)
>  Given que o usuário possui um cartão de crédito cadastrado
>  When o usuário ativa ou desativa o pagamento automático para o cartão
>  Then um log deve ser gerado contendo a referência ao cartão e a ação realizada (ativação ou desativação de autopay)
>  And o log não deve exibir o número completo do cartão
> ```
>
img
>
> ```gherkin
> ### Scenario: Registrar logs ao transferir autopay para outro cartão
>  Given que o usuário possui dois cartões e autopay está ativado em um deles
>  When o usuário ativa o pagamento automático no segundo cartão
>  Then um log deve ser gerado contendo as referências aos dois cartões (anterior e novo) e as ações realizadas (autopay desativado no anterior, ativado no novo)
>  And o log não deve exibir o número completo dos cartões
> ```
>
img
>
> ```gherkin
> ### Scenario: Validar que os logs estão acessíveis e compreensíveis na interface de administração
>  When um administrador acessa o histórico de logs de cartões de crédito
>  Then as informações de referência ao cartão (últimos quatro dígitos ou ID interno) devem estar visíveis em todos os logs de ações
>  And não deve ser possível visualizar o número completo do cartão em nenhum log
>  
> ### Scenario: Garantir consistência na exibição da referência do cartão em todos os tipos de ações
>  When qualquer ação de cartão de crédito é realizada (adição, exclusão, ativação, desativação, invalidação, etc.)
>  Then a referência ao cartão afetado deve estar presente no log correspondente de forma consistente
>  And o log não deve exibir dados sensíveis do cartão
> ```
>

-----

> ## Tests in stg
> ```gherkin
>
> ## Feature: Display of modified card information in logs
> 
> ### Scenario: Register identifiable information when adding a credit card
> When the user adds a new credit card
> Then a log must be generated containing a reference to the added card (last four digits or internal ID)
> And the log must not display the full card number
> | PASS |
> ```
>
> ```gherkin
> ### Scenario: Register identifiable information when deleting a credit card
> Given the user has a registered credit card
> When the user deletes the credit card
> Then a log must be generated containing a reference to the deleted card (last four digits or internal ID)
> And the log must not display the full card number
> | PASS |
> ```
>
> ```gherkin
> ### Scenario: Register identifiable information when invalidating a credit card
> Given the user has a valid credit card
> When the user invalidates the card providing the reason "Xpto"
> Then a log must be generated containing a reference to the invalidated card (last four digits or internal ID) and the provided reason
> And the log must not display the full card number
> | PASS |
> ```
>
> ```gherkin
> ### Scenario: Register information when making a card valid by removing the reason
> Given the credit card is invalid with reason "Xpto"
> When the user removes the invalidation reason
> Then a log must be generated containing a reference to the card and the change of reason from "Xpto" to ""
> And the log must not display the full card number
> | PASS | LeadPk / AccountPk | Merchant |
> ```
>
> ```gherkin
> #>## Scenario: Register information when enabling or disabling automatic payment (autopay)
> Given the user has a registered credit card
> When the user enables or disables automatic payment for the card
> Then a log must be generated containing a reference to the card and the action performed (enable or disable autopay)
> And the log must not display the full card number
> | PASS |
> ```
>
> ```gherkin
> ### Scenario: Register logs when transferring autopay to another card
> Given the user has two cards and autopay is enabled on one of them
> When the user enables automatic payment on the second card
> Then a log must be generated containing references to both cards (previous and new) and the actions performed (autopay disabled on the previous, enabled on the new)
> And the log must not display the full card numbers
> | PASS |
> ```
>
> ```gherkin
> ### Scenario: Validate that logs are accessible and understandable in the admin interface
> When an administrator accesses the credit card logs history
> Then the card reference information (last four digits or internal ID) must be visible in all action logs
> And it must not be possible to view the full card number in any log
> | PASS |
> ```
>
> ```gherkin
> ### Scenario: Ensure consistency in displaying the card reference in all action types
> When any credit card action is performed (addition, deletion, activation, deactivation, invalidation, etc.)
> Then the reference to the affected card must be present in the corresponding log in a consistent manner
> And the log must not display sensitive card data
> | PASS |
> ```
>
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## UOWN | Servicing | Do Not Call automatically selects Do Not Text Checkbox

**Status:** Open  
**Created by:** Yuri Araujo  
**Created:** 2 weeks ago

### 🧾 Synopsis
In the Servicing Portal, within the Primary Contact section of the lead details page, agents can view and edit the customer’s contact information, including managing communication preferences via checkboxes: Do Not Email, Do Not Call, and Do Not Text. When any of these checkboxes is selected, the system currently requires a mandatory Reason field to be filled in.

Additionally, selecting **Do Not Call** automatically selects **Do Not Text** due to legal requirements.

---

### 🎯 Business Objective
Improve operational efficiency and accuracy by simplifying how agents apply contact restrictions, while maintaining compliance with legal standards and allowing flexibility for customer-specific adjustments.

---

### 🧩 Feature Request | Business Requirements

- Ensure that **Do Not Text** is still automatically selected if **Do Not Call** is triggered independently (retain current behavior).
- Agents must still be able to **uncheck individual options** after selecting **Do Not Call**, based on customer input (e.g., unchecking **Do Not Text** if the customer agrees to receive SMS).
- All validations and required fields should remain in place (e.g., **Reason required** when any contact restriction is applied).
- The **UI should reflect** these behaviors clearly and be tested for both user experience and legal compliance.

---

### 🧪 Test Cases – "Do Not Contact" (Primary Contact Section) – Servicing Portal

**Objective**  
Ensure that the new **"Do Not Contact"** checkbox behaves correctly by automatically handling existing communication preferences (**Do Not Email**, **Do Not Call**, **Do Not Text**) while preserving legal compliance and agent flexibility.

#### ✅ Test Cases

1. **Select "Do Not Contact"**  
   - Automatically checks:
     - Do Not Email
     - Do Not Call
     - Do Not Text  
   - Applies the same Reason to all three.

2. **Manually uncheck options after selecting "Do Not Contact"**  
   - Agent can manually uncheck any of the three checkboxes.  
   - Reason remains only for the options still selected.

3. **Manual selection of "Do Not Call"**  
   - Automatically checks Do Not Text (existing behavior).  
   - Both require a Reason to be filled.

4. **Reason validation**  
   - Reason is mandatory when any contact restriction is enabled.  
   - Saving should be blocked if Reason is empty.

5. **Unchecking "Do Not Contact"**  
   - Does not automatically uncheck the other three checkboxes.  
   - Their states remain unchanged (manual edits are preserved).

6. **UI Behavior**  
   - UI clearly reflects all dependencies and selections.  
   - Proper validation messages, tooltips, or indicators are shown.

7. **Unchecking a specific option with "Do Not Contact" selected**  
   - Scenario:
     - All four are checked:
       - Do Not Contact
       - Do Not Email
       - Do Not Call
       - Do Not Text
     - Action:
       - Manually uncheck Do Not Email
     - Expected Result:
       - Do Not Call is automatically unchecked  
       - Do Not Text remains checked  
       - Do Not Contact remains checked

---

### 🔁 Notes
- The **Reason from "Do Not Contact"** should be copied to the three checkboxes only at the time of selection.
- After that, **manual edits should not resync or override** the Reason automatically.

-----


## UOWN | Servicing | "Do Not Call" seleciona automaticamente "Do Not Text"

**Status:** Aberto  
**Criado por:** Yuri Araujo  
**Criado há:** 2 semanas

### 🧾 Sinopse
No Portal Servicing, dentro da seção de Contato Principal na página de detalhes do lead, os agentes podem visualizar e editar as informações de contato do cliente, incluindo a gestão de preferências de comunicação através das checkboxes: **Do Not Email**, **Do Not Call** e **Do Not Text**. Quando qualquer uma dessas opções é marcada, o sistema exige que o campo **Reason** (Motivo) seja preenchido obrigatoriamente.

Além disso, ao marcar **Do Not Call**, o sistema **seleciona automaticamente o Do Not Text** por exigência legal.

---

### 🎯 Objetivo de Negócio
Melhorar a eficiência operacional e a precisão ao simplificar a forma como os agentes aplicam restrições de contato, mantendo a conformidade legal e permitindo flexibilidade para ajustes específicos do cliente.

---

### 🧩 Requisitos da Funcionalidade

- Garantir que **Do Not Text** continue sendo selecionado automaticamente quando **Do Not Call** for marcado (manter o comportamento atual).
- Os agentes devem continuar podendo **desmarcar as opções individualmente** após marcar o **Do Not Call**, com base no consentimento do cliente (ex: desmarcar Do Not Text se o cliente aceitar receber SMS).
- Todas as validações e campos obrigatórios devem ser mantidos (ex: campo **Reason obrigatório** quando qualquer restrição de contato for aplicada).
- A **interface deve refletir claramente** esses comportamentos, sendo testada quanto à usabilidade e conformidade legal.

---

### 🧪 Casos de Teste – "Do Not Contact" (Seção de Contato Principal) – Portal Servicing

**Objetivo**  
Garantir que a nova checkbox **"Do Not Contact"** funcione corretamente, lidando automaticamente com as preferências de comunicação existentes (**Do Not Email**, **Do Not Call**, **Do Not Text**) mantendo a conformidade legal e flexibilidade para os agentes.

#### ✅ Casos de Teste

1. **Selecionar "Do Not Contact"**  
   - Marca automaticamente:
     - Do Not Email
     - Do Not Call
     - Do Not Text  
   - Aplica o mesmo motivo para todas.

2. **Desmarcar manualmente após selecionar "Do Not Contact"**  
   - O agente pode desmarcar manualmente qualquer uma das três opções.  
   - O motivo permanece apenas para as opções ainda selecionadas.

3. **Selecionar manualmente "Do Not Call"**  
   - Marca automaticamente o **Do Not Text** (comportamento já existente).  
   - Ambas exigem o preenchimento do motivo.

4. **Validação do campo Reason**  
   - O campo motivo é obrigatório quando qualquer restrição de contato estiver ativa.  
   - O sistema deve bloquear o salvamento se o motivo estiver vazio.

5. **Desmarcar "Do Not Contact"**  
   - Não desmarca automaticamente as outras três opções.  
   - Seus estados permanecem como estavam (edições manuais são preservadas).

6. **Comportamento da Interface (UI)**  
   - A interface deve refletir claramente todas as dependências e seleções.  
   - Mensagens de validação, tooltips ou indicadores devem ser exibidos adequadamente.

7. **Desmarcar uma opção com "Do Not Contact" selecionado**  
   - Cenário:
     - Todas as quatro opções estão marcadas:
       - Do Not Contact
       - Do Not Email
       - Do Not Call
       - Do Not Text
     - Ação:
       - Desmarcar manualmente o **Do Not Email**
     - Resultado esperado:
       - **Do Not Call é desmarcado automaticamente**  
       - **Do Not Text permanece marcado**  
       - **Do Not Contact permanece marcado**

---

### 🔁 Observações
- O **motivo selecionado em "Do Not Contact"** deve ser copiado para as três checkboxes apenas no momento da seleção.
- Após isso, **edições manuais não devem ressincronizar ou sobrescrever** automaticamente o motivo.


------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


Com a remoção da funcionalidade "Do Not Contact" por decisão da área de negócio, e considerando apenas os testes atualizados postados pelo desenvolvedor Davi Artur, 
os requisitos para teste agora se restringem exclusivamente ao comportamento dos checkboxes Do Not Call e Do Not Text, conforme abaixo.

## 🇺🇸 Test Requirements (English)

1. **Select "Do Not Call"**
   - Select the "Do Not Call" checkbox
   - Verify that "Do Not Text" is auto-selected
   - Verify that the "Reason" field becomes required

   ✅ Expected Result:
   - "Do Not Text" is auto-checked
   - "Reason" field is required

2. **Uncheck "Do Not Text" after selecting "Do Not Call"**
   - Select "Do Not Call"
   - Manually uncheck "Do Not Text"
   - Fill in the "Reason" field
   - Click Save

   ✅ Expected Result:
   - "Do Not Text" can be unchecked
   - Save is successful
   - "Reason" remains required

3. **Select only "Do Not Text"**
   - Check only "Do Not Text"
   - Verify that "Reason" becomes required
   - Fill in "Reason" and Save

   ✅ Expected Result:
   - "Reason" is required
   - Save is successful

-----

✅ Requisitos para Teste – Contact Preferences (Servicing Portal)
## 🇧🇷 Requisitos (em português)

1. **Selecionar "Do Not Call"**
   - Selecionar a opção "Do Not Call"
   - Verificar se a opção "Do Not Text" é selecionada automaticamente
   - Verificar se o campo "Reason" se torna obrigatório

   ✅ Resultado Esperado:
   - "Do Not Text" é marcado automaticamente
   - O campo "Reason" é obrigatório

2. **Desmarcar "Do Not Text" após marcar "Do Not Call"**
   - Marcar "Do Not Call"
   - Desmarcar manualmente "Do Not Text"
   - Preencher o campo "Reason"
   - Clicar em "Salvar"

   ✅ Resultado Esperado:
   - "Do Not Text" pode ser desmarcado
   - O salvamento deve ocorrer com sucesso
   - O campo "Reason" continua obrigatório

3. **Selecionar apenas "Do Not Text"**
   - Marcar apenas "Do Not Text"
   - Verificar se o campo "Reason" se torna obrigatório
   - Preencher o campo "Reason" e salvar

   ✅ Resultado Esperado:
   - O campo "Reason" é obrigatório
   - O salvamento deve ocorrer com sucesso

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

✅ Resumo dos testes já realizados por você (Servicing/Origination)
Você já validou completamente:
"Do Not Email" (todos os fluxos: seleção, desmarque, cancelamento, validação de motivo, leitura do backend, persistência e edição)
"Do Not Call" no Origination:
Seleção com motivo
Cancelamento sem salvar
Validação de motivo obrigatório
Desabilitado fora do modo edição

✅ Requisitos novos válidos para testar (após remoção do Do Not Contact)
Restam 3 casos específicos no Servicing que você ainda não testou, conforme os testes atualizados do Davi:
| # | Cenário                                                                                    | Você testou? | Observação                                                                                                    |
| - | ------------------------------------------------------------------------------------------ | ------------ | ------------------------------------------------------------------------------------------------------------- |
| 1 | Selecionar "Do Not Call" → "Do Not Text" é auto-marcado → "Reason" fica obrigatório        | ❌ Não        | Você validou "Do Not Call" no Origination, mas não testou esse comportamento de auto-seleção no **Servicing** |
| 2 | Após marcar "Do Not Call", desmarcar "Do Not Text" manualmente → preencher motivo e salvar | ❌ Não        | Esse fluxo com desmarque manual e verificação da persistência só está descrito no novo escopo                 |
| 3 | Marcar apenas "Do Not Text" → "Reason" obrigatório → salvar com sucesso                    | ❌ Não        | Você ainda **não testou esse fluxo isolado** com "Do Not Text" no Servicing                                   |


Testes de 3 cenários no Servicing Portal:
1. [Servicing] Select "Do Not Call"
   - Validate that "Do Not Text" is automatically checked
   - Validate that "Reason" becomes required

2. [Servicing] Select "Do Not Call", then manually uncheck "Do Not Text"
   - Fill in "Reason"
   - Save
   - Validate that changes persist correctly

3. [Servicing] Select only "Do Not Text"
   - Ensure "Reason" becomes required
   - Fill "Reason" and save
   - Validate success

-----

# language: pt
Funcionalidade: Preferências de Contato no Portal Servicing

  Contexto:
    Dado que estou na seção "Primary Contact" de um lead no portal Servicing
    E o formulário está no modo de edição

  Cenário: Selecionar "Do Not Call" marca automaticamente "Do Not Text" e exige motivo
    Quando eu marco a opção "Do Not Call"
    Então a opção "Do Not Text" deve ser marcada automaticamente
    E o campo "Reason" deve se tornar obrigatório
cancelar motivo
cancelar

  Cenário: Desmarcar "Do Not Text" após selecionar "Do Not Call" e salvar com motivo
    Quando eu marco a opção "Do Not Call"
    E eu preencho o campo "Reason" com "Cliente solicitou não receber ligações"
    E eu desmarco manualmente a opção "Do Not Text"
    E eu clico em "Salvar"
    Então os dados devem ser salvos corretamente
    E apenas "Do Not Call" deve estar marcado
    E o campo "Reason" deve estar salvo corretamente para "Do Not Call"
desmarcar do not email junto
marcar do not cal, inserir motivo, marcar do not email, inserir motivo, salvar
sem demarcar do not email
   
  Cenário: Selecionar apenas "Do Not Text" e salvar com sucesso
    Quando eu marco apenas a opção "Do Not Text"
    Então o campo "Reason" deve se tornar obrigatório
    Quando eu preencho o campo "Reason" com "Cliente não deseja receber SMS"
    E eu clico em "Salvar"
    Então os dados devem ser salvos corretamente
    E a opção "Do Not Text" deve permanecer marcada
    E o motivo deve ser persistido corretamente

-----

# language: en
Feature: Contact Preferences in Servicing Portal

  Background:
    Given I am in the "Primary Contact" section of a lead in the Servicing portal
    And the form is in edit mode

  Scenario: Selecting "Do Not Call" automatically checks "Do Not Text" and requires Reason
    When I check the "Do Not Call" option
    Then the "Do Not Text" option should be automatically checked
    And the "Reason" field should become required

  Scenario: Unchecking "Do Not Text" after selecting "Do Not Call" and saving with Reason
    When I check the "Do Not Call" option
    And I manually uncheck the "Do Not Text" option
    And I fill in the "Reason" field with "Customer requested no phone calls"
    And I click "Save"
    Then the data should be saved correctly
    And only "Do Not Call" should remain checked
    And the "Reason" should be saved correctly for "Do Not Call"

  Scenario: Selecting only "Do Not Text" and saving successfully
    When I check only the "Do Not Text" option
    Then the "Reason" field should become required
    When I fill in the "Reason" field with "Customer does not want to receive SMS"
    And I click "Save"
    Then the data should be saved correctly
    And the "Do Not Text" option should remain checked
    And the reason should be properly persisted

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa1

| LeadPk/AccountPk | Test Case | Test Data | Status | Observation |
|--------|-----------|-----------|--------|-------------|
| 9404/3992 | [Servicing] Select "Do Not Email", provide a reason, and save, validating that the reason is correctly stored in the database and log. | - | PASS | - |
| 9404/3992 | [Servicing] Cancel the edit after selecting "Do Not Email" and entering a reason, ensuring no information is saved and the checkbox returns to its original state. | - | PASS | - |
| 9404/3992 | [Servicing] Attempt to save "Do Not Email" without a reason and check that the system displays the message "Reason is required" and saves no data. | - | PASS | - |
| 9404/3992 | [Servicing] Verify that when the section is not in edit mode, the "Do Not Email" checkbox remains disabled. | - | PASS | - |
| 9404/3992 | [Servicing] Select and unselect "Do Not Email" before saving and confirm that no changes are persisted. | - | PASS | - |
| 9404/3992 | [Servicing] Cancel the "Do Not Email" edit and visually confirm that the checkbox appears unchecked. | - | PASS | - |
| 9404/3992 | [Servicing] Select "Do Not Email" and "Do Not Call" with different reasons and confirm that both are saved correctly. | - | PASS | - |
| 9404/3992 | [Servicing] Validate that if the "Do Not Email" field comes pre-checked from the backend, it appears checked and allows editing. | - | PASS | - |
| 9404/3992 | [Servicing] Uncheck "Do Not Email" with a previously saved reason, click "Save", and verify that the reason is removed from the database and log. | - | PASS | - |
| 9404/3992 | [Origination] Verify that the "Do Not Contact" field is not displayed on the Origination portal. | - | PASS | - |
| 9404/3992 | [Origination] Edit and select "Do Not Call", provide a reason, and save, validating that the reason is saved correctly. | - | PASS | - |
| 9404/3992 | [Origination] Select "Do Not Call" and cancel the edit, validating that no changes are saved and the field returns to its original state. | - | PASS | - |
| 9404/3992 | [Origination] Attempt to save "Do Not Call" without providing a reason and confirm that the system blocks the action and displays "Reason is required". | - | PASS | - |
| 9404/3992 | [Origination] Verify that when the section is not in edit mode, the "Do Not Call" field remains disabled. | - | PASS | - |

# language: pt
Funcionalidade: Preferências de Contato no Portal Servicing

  Contexto:
    Dado que estou na seção "Primary Contact" de um lead no portal Servicing
    E o formulário está no modo de edição

  Cenário: Selecionar "Do Not Call" marca automaticamente "Do Not Text" e exige motivo
    Quando eu marco a opção "Do Not Call"
    Então a opção "Do Not Text" deve ser marcada automaticamente
    E o campo "Reason" deve se tornar obrigatório

  Cenário: Marcar "Do Not Call", preencher motivo e depois cancelar
    Quando eu marco a opção "Do Not Call"
    E eu preencho o campo "Reason" com "Cliente não quer ser contatado por telefone"
    E eu clico em "Cancelar"
    Então nenhuma alteração deve ser salva
    E a opção "Do Not Call" deve estar desmarcada
    E a opção "Do Not Text" também deve estar desmarcada

  Cenário: Desmarcar "Do Not Text" após selecionar "Do Not Call" e salvar com motivo
    Quando eu marco a opção "Do Not Call"
    E eu preencho o campo "Reason" com "Cliente solicitou não receber ligações"
    E eu desmarco manualmente a opção "Do Not Text"
    E eu clico em "Salvar"
    Então os dados devem ser salvos corretamente
    E apenas "Do Not Call" deve estar marcado
    E o campo "Reason" deve estar salvo corretamente para "Do Not Call"

  Cenário: Selecionar "Do Not Call" e "Do Not Email", inserir motivos diferentes e salvar
    Quando eu marco a opção "Do Not Call"
    E eu preencho o campo "Reason" com "Cliente não aceita chamadas"
    E eu marco a opção "Do Not Email"
    E eu preencho o campo "Reason" com "Cliente não deseja receber e-mails"
    E eu clico em "Salvar"
    Então ambas as opções devem ser salvas corretamente
    E os respectivos motivos devem estar persistidos corretamente

  Cenário: Selecionar "Do Not Call", marcar "Do Not Email" e salvar sem desmarcar nenhuma
    Quando eu marco a opção "Do Not Call"
    E eu preencho o campo "Reason" com "Cliente não aceita chamadas"
    E eu marco a opção "Do Not Email"
    E eu preencho o campo "Reason" com "Cliente não deseja receber e-mails"
    E eu clico em "Salvar"
    Então "Do Not Call" e "Do Not Email" devem permanecer marcados
    E os respectivos motivos devem ser salvos corretamente

  Cenário: Selecionar apenas "Do Not Text" e salvar com sucesso
    Quando eu marco apenas a opção "Do Not Text"
    Então o campo "Reason" deve se tornar obrigatório
    Quando eu preencho o campo "Reason" com "Cliente não deseja receber SMS"
    E eu clico em "Salvar"
    Então os dados devem ser salvos corretamente
    E a opção "Do Not Text" deve permanecer marcada
    E o motivo deve ser persistido corretamente

-----

# language: en
Feature: Contact Preferences in the Servicing Portal

  Background:
    Given I am in the "Primary Contact" section of a lead in the Servicing portal
    And the form is in edit mode
Scenario: Selecting "Do Not Call" automatically checks "Do Not Text" and requires a reason
    When I check the "Do Not Call" option
    Then the "Do Not Text" option should be automatically checked
    And the "Reason" field should become required

  Scenario: Select "Do Not Call", fill in reason and then cancel
    When I check the "Do Not Call" option
    And I fill in the "Reason" field with "Customer does not want to be called"
    And I click "Cancel"
    Then no changes should be saved
    And the "Do Not Call" option should be unchecked
    And the "Do Not Text" option should also be unchecked

  Scenario: Uncheck "Do Not Text" after selecting "Do Not Call" and save with reason
    When I check the "Do Not Call" option
    And I fill in the "Reason" field with "Customer requested not to receive calls"
    And I manually uncheck the "Do Not Text" option
    And I click "Save"
    Then the data should be saved correctly
    And only the "Do Not Call" option should remain checked
    And the "Reason" should be saved correctly for "Do Not Call"

  Scenario: Select "Do Not Call" and "Do Not Email", enter different reasons and save
    When I check the "Do Not Call" option
    And I fill in the "Reason" field with "Customer refuses phone calls"
    And I check the "Do Not Email" option
    And I fill in the "Reason" field with "Customer does not want to receive emails"
    And I click "Save"
    Then both options should be saved correctly
    And the corresponding reasons should be persisted properly

  Scenario: Select "Do Not Call" and "Do Not Email" and save without unchecking either
    When I check the "Do Not Call" option
    And I fill in the "Reason" field with "Customer refuses phone calls"
    And I check the "Do Not Email" option
    And I fill in the "Reason" field with "Customer does not want to receive emails"
    And I click "Save"
    Then both "Do Not Call" and "Do Not Email" should remain checked
    And their respective reasons should be saved correctly

  Scenario: Select only "Do Not Text" and save successfully
    When I check only the "Do Not Text" option
    Then the "Reason" field should become required
    When I fill in the "Reason" field with "Customer does not want to receive SMS"
    And I click "Save"
    Then the data should be saved correctly
    And the "Do Not Text" option should remain checked
    And the reason should be properly persisted
  
-----

Tests in qa1

| LeadPk/AccountPk | Test Case | Test Data | Status | Observation |
|------------------|-----------|-----------|--------|-------------|
| 9404/3992 | [Servicing] Select "Do Not Email", provide a reason, and save, validating that the reason is correctly stored in the database and log. | - | PASS | - |
| 9404/3992 | [Servicing] Cancel the edit after selecting "Do Not Email" and entering a reason, ensuring no information is saved and the checkbox returns to its original state. | - | PASS | - |
| 9404/3992 | [Servicing] Attempt to save "Do Not Email" without a reason and check that the system displays the message "Reason is required" and saves no data. | - | PASS | - |
| 9404/3992 | [Servicing] Verify that when the section is not in edit mode, the "Do Not Email" checkbox remains disabled. | - | PASS | - |
| 9404/3992 | [Servicing] Select and unselect "Do Not Email" before saving and confirm that no changes are persisted. | - | PASS | - |
| 9404/3992 | [Servicing] Cancel the "Do Not Email" edit and visually confirm that the checkbox appears unchecked. | - | PASS | - |
| 9404/3992 | [Servicing] Select "Do Not Email" and "Do Not Call" with different reasons and confirm that both are saved correctly. | - | PASS | - |
| 9404/3992 | [Servicing] Validate that if the "Do Not Email" field comes pre-checked from the backend, it appears checked and allows editing. | - | PASS | - |
| 9404/3992 | [Servicing] Uncheck "Do Not Email" with a previously saved reason, click "Save", and verify that the reason is removed from the database and log. | - | PASS | - |
| 9404/3992 | [Origination] Verify that the "Do Not Contact" field is not displayed on the Origination portal. | - | PASS | - |
| 9404/3992 | [Origination] Edit and select "Do Not Call", provide a reason, and save, validating that the reason is saved correctly. | - | PASS | - |
| 9404/3992 | [Origination] Select "Do Not Call" and cancel the edit, validating that no changes are saved and the field returns to its original state. | - | PASS | - |
| 9404/3992 | [Origination] Attempt to save "Do Not Call" without providing a reason and confirm that the system blocks the action and displays "Reason is required". | - | PASS | - |
| 9404/3992 | [Origination] Verify that when the section is not in edit mode, the "Do Not Call" field remains disabled. | - | PASS | - |
| 9404/3992 | [Servicing] Select "Do Not Call" and validate that 'Do Not Text' is auto-checked and Reason becomes required | - | PASS | - |
| 9404/3992 | [Servicing] Select "Do Not Call", fill in reason and then cancel. Ensure no data is saved and checkboxes are reset | - | PASS | - |
| 9404/3992 | [Servicing] Uncheck "Do Not Text" after selecting "Do Not Call" and save with reason. Validate correct persistence | - | PASS | - |
| 9404/3992 | [Servicing] Select "Do Not Call" and "Do Not Email" with different reasons and save. Confirm both are saved correctly | - | PASS | - |
| 9404/3992 | [Servicing] Select "Do Not Call" and "Do Not Email" and save without unchecking either. Validate both remain checked | - | PASS | - |
| 9404/3992 | [Servicing] Select only "Do Not Text", provide reason and save. Validate successful persistence | - | PASS | - |


-----

Tests in qa1

| LeadPk/AccountPk | Caso de Teste | Dados de Teste | Status | Observação |
|------------------|---------------|----------------|--------|-------------|
| 9404/3992 | [Servicing] Selecionar "Do Not Email", preencher o motivo e salvar, validando que o motivo é armazenado corretamente no banco de dados e no log. | - | PASS | - |
| 9404/3992 | [Servicing] Cancelar a edição após selecionar "Do Not Email" e preencher um motivo, garantindo que nenhuma informação seja salva e a checkbox volte ao estado original. | - | PASS | - |
| 9404/3992 | [Servicing] Tentar salvar "Do Not Email" sem motivo e verificar se o sistema exibe a mensagem "Reason is required" e não salva os dados. | - | PASS | - |
| 9404/3992 | [Servicing] Verificar que, quando a seção não está em modo de edição, a checkbox "Do Not Email" permanece desabilitada. | - | PASS | - |
| 9404/3992 | [Servicing] Selecionar e desmarcar "Do Not Email" antes de salvar e confirmar que nenhuma alteração é persistida. | - | PASS | - |
| 9404/3992 | [Servicing] Cancelar a edição de "Do Not Email" e confirmar visualmente que a checkbox aparece desmarcada. | - | PASS | - |
| 9404/3992 | [Servicing] Selecionar "Do Not Email" e "Do Not Call" com motivos diferentes e confirmar que ambos são salvos corretamente. | - | PASS | - |
| 9404/3992 | [Servicing] Validar que, se o campo "Do Not Email" vier marcado do backend, ele aparece marcado e permite edição. | - | PASS | - |
| 9404/3992 | [Servicing] Desmarcar "Do Not Email" com um motivo previamente salvo, clicar em "Salvar" e verificar que o motivo é removido do banco e do log. | - | PASS | - |
| 9404/3992 | [Origination] Verificar que o campo "Do Not Contact" não é exibido no portal Origination. | - | PASS | - |
| 9404/3992 | [Origination] Editar e selecionar "Do Not Call", preencher um motivo e salvar, validando que o motivo é salvo corretamente. | - | PASS | - |
| 9404/3992 | [Origination] Selecionar "Do Not Call" e cancelar a edição, validando que nenhuma alteração é salva e o campo volta ao estado original. | - | PASS | - |
| 9404/3992 | [Origination] Tentar salvar "Do Not Call" sem fornecer um motivo e confirmar que o sistema bloqueia a ação e exibe "Reason is required". | - | PASS | - |
| 9404/3992 | [Origination] Verificar que, quando a seção não está em modo de edição, o campo "Do Not Call" permanece desabilitado. | - | PASS | - |
| 9404/3992 | [Servicing] Selecionar "Do Not Call" e validar que "Do Not Text" é marcado automaticamente e o campo Reason se torna obrigatório | - | PASS | - |
| 9404/3992 | [Servicing] Selecionar "Do Not Call", preencher o motivo e depois cancelar. Garantir que nenhum dado seja salvo e as checkboxes sejam resetadas | - | PASS | - |
| 9404/3992 | [Servicing] Desmarcar "Do Not Text" após selecionar "Do Not Call" e salvar com motivo. Validar persistência correta | - | PASS | - |
| 9404/3992 | [Servicing] Selecionar "Do Not Call" e "Do Not Email" com motivos diferentes e salvar. Confirmar que ambos são salvos corretamente | - | PASS | - |
| 9404/3992 | [Servicing] Selecionar "Do Not Call" e "Do Not Email" e salvar sem desmarcar nenhuma. Validar que ambas permanecem marcadas | - | PASS | - |
| 9404/3992 | [Servicing] Selecionar apenas "Do Not Text", preencher o motivo e salvar. Validar persistência com sucesso | - | PASS | - |



------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


Tests in stg

Select "Do Not Email", provide a reason, and save, validating that the reason is correctly stored in the database and log.
Cancel the edit after selecting "Do Not Email" and entering a reason, ensuring no information is saved and the checkbox returns to its original state.
Attempt to save "Do Not Email" without a reason and check that the system displays the message "Reason is required" and saves no data.
Verify that when the section is not in edit mode, the "Do Not Email" checkbox remains disabled.
Select and unselect "Do Not Email" before saving and confirm that no changes are persisted.
Cancel the "Do Not Email" edit and visually confirm that the checkbox appears unchecked.
Select "Do Not Email" and "Do Not Call" with different reasons and confirm that both are saved correctly.
Validate that if the "Do Not Email" field comes pre-checked from the backend, it appears checked and allows editing
Uncheck "Do Not Email" with a previously saved reason, click "Save", and verify that the reason is removed from the database and log.
Verify that the "Do Not Contact" field is not displayed on the Origination portal. 
Edit and select "Do Not Call", provide a reason, and save, validating that the reason is saved correctly. 
Select "Do Not Call" and cancel the edit, validating that no changes are saved and the field returns to its original state.
Attempt to save "Do Not Call" without providing a reason and confirm that the system blocks the action and displays "Reason is required".
Verify that when the section is not in edit mode, the "Do Not Call" field remains disabled.
Select "Do Not Call" and validate that 'Do Not Text' is auto-checked and Reason becomes required
Select "Do Not Call", fill in reason and then cancel. Ensure no data is saved and checkboxes are reset
Uncheck "Do Not Text" after selecting "Do Not Call" and save with reason. Validate correct persistence
Select "Do Not Call" and "Do Not Email" with different reasons and save. Confirm both are saved correctly 
Select "Do Not Call" and "Do Not Email" and save without unchecking either. Validate both remain checked 
Select only "Do Not Text", provide reason and save. Validate successful persistence 

-----

Selecionar "Do Not Email", informar um motivo e salvar
Validar que o motivo é salvo corretamente no banco de dados e log.

Selecionar "Do Not Email", informar um motivo e cancelar a edição
Garantir que nenhuma informação é salva e o checkbox retorna ao estado original (desmarcado).

Tentar salvar "Do Not Email" sem motivo
Verificar que o sistema exibe a mensagem "Motivo é obrigatório" e não salva dados.

Com a seção fora do modo de edição, verificar que o checkbox "Do Not Email" permanece desabilitado.

Selecionar e desmarcar "Do Not Email" antes de salvar
Confirmar que nenhuma alteração é persistida.

Cancelar a edição de "Do Not Email" e confirmar visualmente que o checkbox aparece desmarcado.

Selecionar "Do Not Email" e "Do Not Call" com motivos diferentes e salvar
Validar que ambos são salvos corretamente com seus respectivos motivos.

Validar que, se o campo "Do Not Email" vier pré-marcado do backend, ele aparece marcado e permite edição.

Desmarcar "Do Not Email" que já tinha motivo salvo, clicar em "Salvar" e verificar que o motivo é removido do banco de dados e log.

Verificar que o campo "Do Not Contact" não é exibido no portal de Originação.

Selecionar "Do Not Call", informar um motivo e salvar
Validar que o motivo é salvo corretamente.

Selecionar "Do Not Call" e cancelar a edição
Garantir que nada é salvo e o campo volta ao estado original.

Tentar salvar "Do Not Call" sem motivo
Confirmar que o sistema bloqueia a ação e exibe "Motivo é obrigatório".

Com a seção fora do modo de edição, verificar que o campo "Do Not Call" permanece desabilitado.

Selecionar "Do Not Call" e validar que 'Do Not Text' é marcado automaticamente e Motivo torna-se obrigatório.

Selecionar "Do Not Call", preencher motivo e cancelar
Garantir que nenhum dado é salvo e os checkboxes são resetados.

Desmarcar "Do Not Text" após selecionar "Do Not Call" e salvar com motivo
Validar persistência correta dos campos.

Selecionar apenas "Do Not Text", fornecer motivo e salvar
Validar que é salvo corretamente.

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# Português

Funcionalidade: Gerenciamento dos campos Do Not Email, Do Not Call e Do Not Text

Cenário: Selecionar "Do Not Email", informar um motivo e salvar
  Dado que estou em modo de edição
  Quando seleciono o checkbox "Do Not Email"
  E informo um motivo
  E salvo as alterações
  Então o motivo deve ser salvo corretamente no banco de dados

Cenário: Selecionar "Do Not Email", informar um motivo e cancelar a edição
  Dado que estou em modo de edição
  Quando seleciono o checkbox "Do Not Email"
  E informo um motivo
  E cancelo a edição
  Então nenhuma informação deve ser salva
  E o checkbox deve retornar ao estado original

Cenário: Tentar salvar "Do Not Email" sem motivo
  Dado que estou em modo de edição
  Quando seleciono o checkbox "Do Not Email"
  E não informo um motivo
  E tento salvar
  Então o sistema deve exibir a mensagem "Motivo é obrigatório"
  E nenhum dado deve ser salvo

Cenário: Seção fora do modo de edição mantém "Do Not Email" desabilitado
  Dado que a seção não está em modo de edição
  Então o checkbox "Do Not Email" deve permanecer desabilitado

Cenário: Selecionar e desmarcar "Do Not Email" antes de salvar
  Dado que estou em modo de edição
  Quando seleciono o checkbox "Do Not Email"
  E em seguida desmarco o checkbox
  E salvo as alterações
  Então nenhuma alteração deve ser persistida

Cenário: Cancelar edição de "Do Not Email" deixa checkbox desmarcado
  Dado que estou em modo de edição
  Quando seleciono o checkbox "Do Not Email"
  E cancelo a edição
  Então o checkbox deve aparecer desmarcado

Cenário: Selecionar "Do Not Email" e "Do Not Call" com motivos diferentes e salvar
  Dado que estou em modo de edição
  Quando seleciono o checkbox "Do Not Email" e informo um motivo A
  E seleciono o checkbox "Do Not Call" e informo um motivo B
  E salvo as alterações
  Então ambos os motivos devem ser salvos corretamente

Cenário: "Do Not Email" pré-marcado do backend aparece marcado e permite edição
  Dado que o campo "Do Not Email" vem pré-marcado do backend
  Então ele deve aparecer marcado e permitir edição

Cenário: Desmarcar "Do Not Email" com motivo salvo remove motivo
  Dado que o campo "Do Not Email" já possui motivo salvo
  Quando desmarco o checkbox "Do Not Email"
  E salvo as alterações
  Então o motivo deve ser removido do banco de dados e do log

Cenário: Campo "Do Not Contact" não é exibido no portal de Originação
  Dado que estou no portal de Originação
  Então o campo "Do Not Contact" não deve ser exibido

Cenário: Selecionar "Do Not Call", informar motivo e salvar
  Dado que estou em modo de edição
  Quando seleciono o checkbox "Do Not Call"
  E informo um motivo
  E salvo as alterações
  Então o motivo deve ser salvo corretamente

Cenário: Selecionar "Do Not Call" e cancelar a edição
  Dado que estou em modo de edição
  Quando seleciono o checkbox "Do Not Call"
  E cancelo a edição
  Então nenhuma informação deve ser salva
  E o campo volta ao estado original

Cenário: Tentar salvar "Do Not Call" sem motivo
  Dado que estou em modo de edição
  Quando seleciono o checkbox "Do Not Call"
  E não informo um motivo
  E tento salvar
  Então o sistema deve bloquear a ação e exibir "Motivo é obrigatório"

Cenário: Seção fora do modo de edição mantém "Do Not Call" desabilitado
  Dado que a seção não está em modo de edição
  Então o campo "Do Not Call" deve permanecer desabilitado

Cenário: Selecionar "Do Not Call" auto-marca "Do Not Text" e torna motivo obrigatório
  Dado que estou em modo de edição
  Quando seleciono o checkbox "Do Not Call"
  Então o checkbox "Do Not Text" deve ser marcado automaticamente
  E o campo motivo deve ser obrigatório

Cenário: Selecionar "Do Not Call", preencher motivo e cancelar
  Dado que estou em modo de edição
  Quando seleciono o checkbox "Do Not Call"
  E informo um motivo
  E cancelo a edição
  Então nenhum dado deve ser salvo
  E os checkboxes devem ser resetados

Cenário: Desmarcar "Do Not Text" após selecionar "Do Not Call" e salvar com motivo
  Dado que estou em modo de edição
  Quando seleciono o checkbox "Do Not Call"
  E o checkbox "Do Not Text" é marcado automaticamente
  E desmarco o checkbox "Do Not Text"
  E informo um motivo
  E salvo as alterações
  Então a persistência dos campos deve ser feita corretamente

Cenário: Selecionar apenas "Do Not Text", informar motivo e salvar
  Dado que estou em modo de edição
  Quando seleciono apenas o checkbox "Do Not Text"
  E informo um motivo
  E salvo as alterações
  Então o motivo deve ser salvo corretamente

-----

> ## Tests in -
> ```gherkin
> Feature: Management of Do Not Email, Do Not Call, and Do Not Text fields
> 
> ### Scenario: Select "Do Not Email", provide a reason and save
> Given I am in edit mode
> When I check the "Do Not Email" checkbox
> And I provide a reason
> And I save the changes
> Then the reason should be correctly saved in the database and log
> | PASS |
> ```
> 
> ```gherkin
> ### Scenario: Select "Do Not Email", provide a reason and cancel edit
> Given I am in edit mode
> When I check the "Do Not Email" checkbox
> And I provide a reason
> And I cancel the edit
> Then no information should be saved
> And the checkbox should return to its original state
> | PASS |
> ```
>
> ```gherkin
> ### Scenario: Try to save "Do Not Email" without a reason
> Given I am in edit mode
> When I check the "Do Not Email" checkbox
> And I do not provide a reason
> And I try to save
> Then the system should display the message "Reason is required"
> And no data should be saved
> | PASS |
> ```
>
> ```gherkin
> ### Scenario: Section not in edit mode keeps "Do Not Email" disabled
> Given the section is not in edit mode
> Then the "Do Not Email" checkbox should remain disabled
> | PASS |
> ```
>
> ```gherkin
> ### Scenario: Select and unselect "Do Not Email" before saving
> Given I am in edit mode
> When I check the "Do Not Email" checkbox
> And I uncheck the checkbox
> And I save the changes
> Then no changes should be persisted
> | PASS |
> ```
>
> ```gherkin
> ### Scenario: Select "Do Not Email" and "Do Not Call" with different reasons and save
> Given I am in edit mode
> When I check the "Do Not Email" checkbox and provide reason A
> And I check the "Do Not Call" checkbox and provide reason B
> And I save the changes
> Then both reasons should be correctly saved
> | PASS |
> ```
>
> ```gherkin
> ### Scenario: "Do Not Email" pre-checked from backend appears checked and allows editing
> Given the "Do Not Email" field comes pre-checked from the backend
> Then it should appear checked and allow editing
> | PASS |
> ```
>
> ```gherkin
> ### Scenario: Uncheck "Do Not Email" with previously saved reason removes reason
> Given the "Do Not Email" field already has a saved reason
> When I uncheck the "Do Not Email" checkbox
> And I save the changes
> Then the reason should be removed from the database and log
> | PASS |
> ```
>
> ```gherkin
> ### Scenario: "Do Not Contact" field is not displayed on Origination portal
> Given I am on the Origination portal
> Then the "Do Not Contact" field should not be displayed
> | PASS |
> ```
>
> ```gherkin
> ### Scenario: Select "Do Not Call", provide a reason and save
> Given I am in edit mode
> When I check the "Do Not Call" checkbox
> And I provide a reason
> And I save the changes
> Then the reason should be correctly saved
> | PASS |
> ```
>
> ```gherkin
> ### Scenario: Try to save "Do Not Call" without a reason
> Given I am in edit mode
> When I check the "Do Not Call" checkbox
> And I do not provide a reason
> And I try to save
> Then the system should block the action and display "Reason is required"
> | PASS |
> ```
>
> ```gherkin
> ### Scenario: Section not in edit mode keeps "Do Not Call" disabled
> Given the section is not in edit mode
> Then the "Do Not Call" field should remain disabled
> | PASS |
> ```
>
> ```gherkin
> ### Scenario: Selecting "Do Not Call" auto-checks "Do Not Text" and makes reason required
> Given I am in edit mode
> When I check the "Do Not Call" checkbox
> Then the "Do Not Text" checkbox should be auto-checked
> And the reason field should be required
> | PASS |
> ```
>
> ```gherkin
> ### Scenario: Select "Do Not Call", fill in reason and cancel
> Given I am in edit mode
> When I check the "Do Not Call" checkbox
> And I provide a reason
> And I cancel the edit
> Then no data should be saved
> And the checkboxes should be reset
> | PASS |
> ```
>
> ```gherkin
> ### Scenario: Uncheck "Do Not Text" after selecting "Do Not Call" and save with reason
> Given I am in edit mode
> When I check the "Do Not Call" checkbox
> And the "Do Not Text" checkbox is auto-checked
> And I uncheck the "Do Not Text" checkbox
> And I provide a reason
> And I save the changes
> Then the fields should be correctly persisted
> | PASS |
> ```
>
> ```gherkin
> ### Scenario: Select only "Do Not Text", provide a reason and save
> Given I am in edit mode
> When I check only the "Do Not Text" checkbox
> And I provide a reason
> And I save the changes
> Then the reason should be correctly saved
> | PASS |
> ```
>
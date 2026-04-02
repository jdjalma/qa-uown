------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/360

# UOWN | Servicing | Add Validation to Require Reason for Do Not Call Requests

## Status
Open

## Synopsis
Currently, in the DNC (Do Not Call) feature, users can check the "Do Not Call" box and save the request without providing a reason. Although the system appears to accept the input (the box remains checked), once the page is refreshed, the selection is lost. This issue is reproducible across multiple accounts and affects all user roles.

## Business Objective
Ensure the integrity and traceability of DNC requests by enforcing mandatory input validation. Requiring a reason helps avoid data loss, ensures compliance with policies and potential legal standards, and improves the user experience by preventing misleading behavior.

## Requirements
- Add mandatory validation: do not allow saving a DNC request without a reason.
- Apply validation for all user roles.
- Display user feedback (tooltip or error message) if the reason is empty while the box is checked.
- Persist DNC selection and reason across saves and page reloads.

## QA Validation Scope
✅ Test Case: Validate "Do Not Call" (DNC) reason requirement and persistence  
**What to validate:**
- User cannot save the "Do Not Call" selection without a reason.
- When a valid reason is provided:
  - DNC checkbox remains selected after save.
  - The state persists after page refresh or navigation.

## Related
- Zendesk Ticket: 5650
- MRs: !394, !395, !594
- Epic: uown#7


-----

# UOWN | Servicing | Adicionar Validação para Exigir Motivo em Solicitações Do Not Call

## Status
Aberto

## Sinopse
Atualmente, na funcionalidade de "Do Not Call" (Não Ligar), os usuários podem marcar a opção e salvar a solicitação sem fornecer um motivo. Embora o sistema aparente aceitar a entrada (a caixa permanece marcada), ao atualizar a página, a seleção é perdida. Esse comportamento ocorre em várias contas e afeta todos os perfis de usuário.

## Objetivo de Negócio
Garantir a integridade e rastreabilidade das solicitações de "Do Not Call" aplicando validação obrigatória. Exigir um motivo evita perda de dados, assegura conformidade com políticas internas e possíveis exigências legais, além de melhorar a experiência do usuário ao evitar feedback enganoso.

## Requisitos
- Adicionar validação obrigatória: não permitir salvar a solicitação sem um motivo.
- Aplicar a validação para todos os tipos de usuário.
- Exibir mensagem de erro ou tooltip se o campo de motivo estiver vazio com a caixa marcada.
- Garantir persistência da seleção e do motivo após salvar e atualizar a página.

## Escopo de Validação QA
✅ Caso de Teste: Validar obrigatoriedade do motivo e persistência do estado "Do Not Call"  
**O que validar:**
- Usuário não pode salvar a seleção "Do Not Call" sem preencher o motivo.
- Com motivo válido:
  - Caixa permanece marcada após salvar.
  - Estado persiste após atualizar ou navegar.

## Relacionados
- Chamado Zendesk: 5650
- MRs: !394, !395, !594
- Épico: uown#7


------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


Funcionais
O usuário deve poder marcar a opção "Do Not Call", "Do Not Text" ou "Do Not Email".
Quando marcada qualquer opção de DNC, deve ser obrigatório preencher o motivo correspondente.
O botão de salvar deve permanecer desabilitado se o motivo estiver vazio.
Ao preencher o motivo e salvar, a seleção DNC deve persistir (checkbox marcado e motivo salvo).
A seleção e o motivo devem persistir após atualizar ou navegar na página.
Cada tipo de DNC possui seu campo de motivo correspondente (e.g. doNotCallMobileReason).
O botão de cancelar deve limpar o motivo e desmarcar a opção DNC.
A validação deve funcionar para todos os tipos de contato (mobile, work, home, primary email).
Deve ser exibida uma mensagem de erro caso o campo "motivo" esteja vazio.

Não Funcionais
A experiência do usuário deve ser clara e não permitir feedbacks enganosos (UX).
O sistema deve impedir a perda de dados com validações preventivas.
O comportamento deve ser consistente entre diferentes perfis de usuário.
A interface deve ser acessível para diferentes papéis (admin, agent etc).

-----

# language: pt
Funcionalidade: Validação do campo Motivo para opções Do Not Contact

  Contexto:
    Dado que o usuário está na página de preferências de contato

  # Caminhos Felizes
  Cenário: Selecionar Do Not Call Mobile com motivo válido
    Quando o usuário seleciona "Do Not Call Mobile"
    E informa "Usuário solicitou não ser contatado" no campo de motivo
    E clica em Salvar
    Então a checkbox "Do Not Call Mobile" permanece selecionada
    E o motivo é salvo corretamente

  Cenário: Selecionar Do Not Text Work com motivo válido
    Quando o usuário seleciona "Do Not Text Work"
    E informa "Prefere comunicação escrita apenas" no campo de motivo
    E clica em Salvar
    Então a checkbox "Do Not Text Work" permanece selecionada
    E o motivo é salvo corretamente

  Cenário: Selecionar Do Not Email Primary com motivo válido
    Quando o usuário seleciona "Do Not Email Primary"
    E informa "Email não utilizado" no campo de motivo
    E clica em Salvar
    Então a checkbox "Do Not Email Primary" permanece selecionada
    E o motivo é salvo corretamente

  # Casos de Erro
  Esquema do Cenário: Tentar salvar DNC sem motivo
    Quando o usuário seleciona "<Opção DNC>"
    E deixa o campo de motivo em branco
    E clica em Salvar
    Então é exibida uma mensagem de erro para o campo de motivo
    E a checkbox "<Opção DNC>" permanece desmarcada

    Exemplos:
      | Opção DNC              |
      | Do Not Call Mobile     |
      | Do Not Text Mobile     |
      | Do Not Call Work       |
      | Do Not Text Work       |
      | Do Not Call Home       |
      | Do Not Text Home       |
      | Do Not Email Primary   |

  # Fluxo Alternativo
  Cenário: Usuário cancela a ação de DNC
    Quando o usuário seleciona "Do Not Call Home"
    E informa "Não perturbar durante o horário de trabalho" no campo de motivo
    E clica em Cancelar
    Então a checkbox "Do Not Call Home" é desmarcada
    E o motivo é limpo

  Cenário: Persistência após navegação
    Quando o usuário seleciona "Do Not Text Home"
    E informa "Apenas ligações são permitidas" no campo de motivo
    E clica em Salvar
    E o usuário navega para outra página
    E retorna para a página de preferências de contato
    Então a checkbox "Do Not Text Home" permanece selecionada
    E o motivo "Apenas ligações são permitidas" é exibido

  # Casos Extremos
  Cenário: Motivo muito extenso
    Quando o usuário seleciona "Do Not Text Mobile"
    E informa um motivo com 1000 caracteres
    E clica em Salvar
    Então a checkbox "Do Not Text Mobile" permanece selecionada
    E o motivo é salvo corretamente

  Cenário: Caracteres especiais no motivo
    Quando o usuário seleciona "Do Not Call Work"
    E informa "!@#%&*()[]{}|:;<>?" no campo de motivo
    E clica em Salvar
    Então o motivo é aceito e salvo corretamente

  # Validação por perfil de usuário
  Esquema do Cenário: Validação igual para diferentes perfis
    Dado que o usuário está logado como "<Perfil>"
    Quando o usuário seleciona "Do Not Call Mobile"
    E deixa o campo de motivo em branco
    E clica em Salvar
    Então é exibida uma mensagem de erro para o campo de motivo

    Exemplos:
      | Perfil   |
      | Agente   |
      | Admin    |
      | Suporte  |
PASS. Removido a permissão applicant contact [edit] do usuário Agent e sem a permissao não visualizam o botão de edição

-----


| Cenário                                   | Requisitos Cobertos |
| ----------------------------------------- | ------------------- |
| Successfully select DNC (Call/Text/Email) | 1, 2, 4, 5, 6       |
| Attempt to save DNC without reason        | 2, 3, 9, 12         |
| User cancels the DNC action               | 7, 11               |
| User navigates away and returns           | 5, 4, 11            |
| Long reason / special characters          | 2, 4, 10            |
| Role-based validation                     | 2, 12, 13           |


| Lacuna Detectada                                                            | Recomendação                                                               |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Nenhum cenário cobre a exclusão de motivo após salvar                       | Criar cenário para remover o DNC e o motivo manual ou por "desmarcar"      |
| Validação apenas para "note", mas não de tamanho                            | Definir limites mínimo/máximo para o motivo e validar                      |
| Ações automáticas não testadas (e.g., formulário inválido impede submissão) | Incluir cenários com múltiplos erros no formulário                         |
| Testes de acessibilidade e UX não descritos                                 | Verificar foco automático, mensagens claras, uso de ARIA nos tooltips etc. |


------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa1

| LeadPk/AccountPk | Test Case | Test Data | Status | Observation |
|--------|-----------|-----------|--------|-------------|
| 9404/3992 | [Origination] Edit and select "Do Not Call", provide a reason, and save, validating that the reason is saved correctly. | - | PASS | - |
| 9404/3992 | [Origination] Attempt to save "Do Not Call" without providing a reason and confirm that the system blocks the action and displays "Reason is required". | - | PASS | - |
| 9404/3992 | [Origination] Select "Do Not Call" and cancel the edit, validating that no changes are saved and the field returns to its original state. | - | PASS | - |
| 9404/3992 | [Origination] Verify that when the section is not in edit mode, the "Do Not Call" field remains disabled. | - | PASS | - |
| 9404/3992 | [Servicing] Select "Do Not Email" and "Do Not Call" with different reasons and confirm that both are saved correctly. | - | PASS | - |


------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


Tests in stg

Edit and select "Do Not Call", provide a reason, and save, validating that the reason is saved correctly.
Attempt to save "Do Not Call" without providing a reason and confirm that the system blocks the action and displays "Reason is required"
Select "Do Not Call" and cancel the edit, validating that no changes are saved and the field returns to its original state.
Verify that when the section is not in edit mode, the "Do Not Call" field remains disabled.
Select "Do Not Email" and "Do Not Call" with different reasons and confirm that both are saved correctly.

Editar e selecionar "Do Not Call", fornecer um motivo e salvar, validando que o motivo é salvo corretamente.
Tentar salvar "Do Not Call" sem fornecer um motivo e confirmar que o sistema bloqueia a ação e exibe "Motivo é obrigatório".
Selecionar "Do Not Call" e cancelar a edição, validando que nenhuma alteração é salva e o campo retorna ao seu estado original.
Verificar que, quando a seção não está em modo de edição, o campo "Do Not Call" permanece desabilitado.
Selecionar "Do Not Email" e "Do Not Call" com motivos diferentes e confirmar que ambos são salvos corretamente.

-----

Cenário: Editar e selecionar "Do Not Call", fornecer um motivo e salvar, validando que o motivo é salvo corretamente
  Dado que o usuário está na seção de preferências de contato em modo de edição
  Quando o usuário seleciona "Do Not Call"
  E informa "Usuário solicitou não ser contatado" no campo de motivo
  E clica em Salvar
  Então a checkbox "Do Not Call" permanece selecionada
  E o motivo "Usuário solicitou não ser contatado" é salvo corretamente

Cenário: Tentar salvar "Do Not Call" sem fornecer um motivo e confirmar que o sistema bloqueia a ação e exibe "Motivo é obrigatório"
  Dado que o usuário está na seção de preferências de contato em modo de edição
  Quando o usuário seleciona "Do Not Call"
  E deixa o campo de motivo em branco
  E clica em Salvar
  Então o sistema bloqueia a ação
  E exibe a mensagem "Motivo é obrigatório"
  E nenhuma alteração é salva

Cenário: Selecionar "Do Not Call" e cancelar a edição, validando que nenhuma alteração é salva e o campo retorna ao seu estado original
  Dado que o usuário está na seção de preferências de contato em modo de edição
  Quando o usuário seleciona "Do Not Call"
  E informa "Não deseja receber ligações" no campo de motivo
  E clica em Cancelar
  Então a checkbox "Do Not Call" é desmarcada
  E o campo de motivo é limpo
  E nenhuma alteração é salva

Cenário: Verificar que, quando a seção não está em modo de edição, o campo "Do Not Call" permanece desabilitado
  Dado que o usuário está visualizando as preferências de contato sem editar
  Então a checkbox "Do Not Call" deve estar desabilitada

Cenário: Selecionar "Do Not Call" e "Do Not Text" com motivos diferentes e confirmar que ambos são salvos corretamente
  Dado que o usuário está na seção de preferências de contato em modo de edição
  Quando o usuário seleciona "Do Not Call"
  E informa "Não utiliza ligações" no campo de motivo
  E seleciona "Do Not Text"
  E informa "Prefere não receber mensagens" no campo de motivo
  E clica em Salvar
  Então a checkbox "Do Not Call" permanece selecionada
  E o motivo "Não utiliza ligações" é salvo corretamente
  E a checkbox "Do Not Text" permanece selecionada
  E o motivo "Prefere não receber mensagens" é salvo corretamente

-----

> ## Tests in stg
> ```gherkin
>
> ### Scenario: Edit and select "Do Not Call", provide a reason and save, validating that the reason is saved correctly
> Given the user is in the contact preferences section in edit mode
> When the user selects "Do Not Call"
> And enters "User requested not to be contacted" in the reason field
> And clicks Save
> Then the "Do Not Call" checkbox remains selected
> And the reason "User requested not to be contacted" is saved correctly
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
> 
> ```gherkin
> ### Scenario: Attempt to save "Do Not Call" without providing a reason and confirm that the system blocks the action and displays "Reason is required"
> Given the user is in the contact preferences section in edit mode
> When the user selects "Do Not Call"
> And leaves the reason field blank
> And clicks Save
> Then the system blocks the action
> And displays the message "Reason is required"
> And no changes are saved
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
> 
> ```gherkin
> ### Scenario: Select "Do Not Call" and cancel the edit, validating that no changes are saved and the field returns to its original state
> Given the user is in the contact preferences section in edit mode
> When the user selects "Do Not Call"
> And enters "Does not wish to receive calls" in the reason field
> And clicks Cancel
> Then the "Do Not Call" checkbox is unchecked
> And the reason field is cleared
> And no changes are saved
> | PASS | LeadPk 24057 / AccountPk 206398 | Merchant | 
> ```
> 
> ```gherkin
> ### Scenario: Verify that, when the section is not in edit mode, the "Do Not Call" field remains disabled
> Given the user is viewing the contact preferences without editing
> Then the "Do Not Call" checkbox must be disabled
> | PASS | LeadPk 24057 / AccountPk 206398 | Merchant | 
> ```
>
![360-stg-origination-c3-_1_](/uploads/148224ca43f804a2e79d4019fbe90561/360-stg-origination-c3-_1_.png){width=789 height=740}![360-stg-origination-c3-_2_](/uploads/609ec901869d4ad7911a22b7d07095b4/360-stg-origination-c3-_2_.png){width=789 height=740}![360-stg-origination-c3-_3_](/uploads/25122822f10e8ff3855851f5d56818ce/360-stg-origination-c3-_3_.png){width=789 height=740}![360-stg-origination-c3-_4_](/uploads/b5aed53b0bab049537afa5c08295b9df/360-stg-origination-c3-_4_.png){width=789 height=740}

![360-stg-servicing-c3-_1_](/uploads/9916cbdad254557bdce9c74ebb5fec65/360-stg-servicing-c3-_1_.png){width=789 height=740}![360-stg-servicing-c3-_2_](/uploads/91446287fe7a40a41c683ac5917c5b6e/360-stg-servicing-c3-_2_.png){width=789 height=740}![360-stg-servicing-c3-_3_](/uploads/b54441fec030ab17db967976e10e22db/360-stg-servicing-c3-_3_.png){width=789 height=740}![360-stg-servicing-c3-_4_](/uploads/c91c92fd9a380dbb1a905726f8242946/360-stg-servicing-c3-_4_.png){width=789 height=740}
> 
> ```gherkin
> ### Scenario: Select "Do Not Call" and "Do Not Text" with different reasons and confirm that both are saved correctly
> Given the user is in the contact preferences section in edit mode
> When the user selects "Do Not Call"
> And enters "Does not use phone calls" in the reason field
> And selects "Do Not Text"
> And enters "Prefers not to receive text messages" in the reason field
> And clicks Save
> Then the "Do Not Call" checkbox remains selected
> And the reason "Does not use phone calls" is saved correctly
> And the "Do Not Text" checkbox remains selected
> And the reason "Prefers not to receive text messages" is saved correctly
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
![360-stg-origination-c5-_1_](/uploads/ff9af92f6a35477ef4b57c75559db6da/360-stg-origination-c5-_1_.png){width=789 height=740}![360-stg-origination-c5-_2_](/uploads/4a20b850164920bce30b85a9831cc046/360-stg-origination-c5-_2_.png){width=789 height=740}![360-stg-origination-c5-_3_](/uploads/94ffaa993f6c68bebdb230555d0810b4/360-stg-origination-c5-_3_.png){width=789 height=740}![360-stg-origination-c5-_4_](/uploads/41c262b28374c2549956e0332089b971/360-stg-origination-c5-_4_.png){width=789 height=740}![360-stg-origination-c5-_5_](/uploads/b150289820651eec1dd4b41828764ff4/360-stg-origination-c5-_5_.png){width=789 height=740}![360-stg-origination-c5-_6_](/uploads/8ccabda0143872ba0210884ecd0cac2c/360-stg-origination-c5-_6_.png){width=1436 height=740}![360-stg-origination-c5-_7_](/uploads/60f4ea934739fcad07b4ce792e339cc0/360-stg-origination-c5-_7_.png){width=1436 height=740}![360-stg-origination-c5-_8_](/uploads/062b5b9a73176e10ba6920b610d83462/360-stg-origination-c5-_8_.png){width=1171 height=48}

![360-stg-servicing-c5-_1_](/uploads/3639df746ee687d866ad91857c58a85d/360-stg-servicing-c5-_1_.png){width=780 height=291}![360-stg-servicing-c5-_2_](/uploads/a70b38c3527b76a71c993ae26a940103/360-stg-servicing-c5-_2_.png){width=780 height=291}![360-stg-servicing-c5-_3_](/uploads/aab169eecc3cdf82ae5bd4eb1fbcfe96/360-stg-servicing-c5-_3_.png){width=780 height=291}![360-stg-servicing-c5-_4_](/uploads/abf400c74aad05c907ce0c5e12100064/360-stg-servicing-c5-_4_.png){width=1428 height=728}![360-stg-servicing-c5-_5_](/uploads/ecfc0b7b8bb56a845539517fc063462e/360-stg-servicing-c5-_5_.png){width=1428 height=728}![360-stg-servicing-c5-_6_](/uploads/f0efb16e78c0bda65d93a9d01e968e7f/360-stg-servicing-c5-_6_.png){width=767 height=287}![360-stg-servicing-c5-_7_](/uploads/790e50692ca98bdeabc5a08b2f53c7ad/360-stg-servicing-c5-_7_.png){width=767 height=287}![360-stg-servicing-c5-_8_](/uploads/6a929f3f882e3981a3a1a00eef76b09c/360-stg-servicing-c5-_8_.png){width=767 height=287}![360-stg-servicing-c5-_9_](/uploads/fdb05afd1f1287647469531c58e83723/360-stg-servicing-c5-_9_.png){width=767 height=287}![360-stg-servicing-c5-_10_](/uploads/4675acd67d7ae62896144035a42fd5ec/360-stg-servicing-c5-_10_.png){width=456 height=454}![360-stg-servicing-c5-_11_](/uploads/1430857e5c0c6a2acc748a1d3a06b408/360-stg-servicing-c5-_11_.png){width=1168 height=60}

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in stg

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
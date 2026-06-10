------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

    https://gitlab.com/uown/backend/svc/-/issues/361

    UOWN | Servicing | Fix Component Allowing Edits Without Section Edit Mode Enabled (Servicing and Origination)

    Synopsis
    Currently, one of the section components allows interaction even when the section's edit button has not been activated.
    This behavior is inconsistent with the other components in the same section, which correctly respect the locked state and only allow editing upon explicit activation.

    Business Objective
    Standardize component behavior to ensure interface consistency, prevent unintended changes, and improve user experience.
    This contributes to system reliability and reduces potential user errors.

    Feature Request | Business Requirements
    Ensure the component does not allow interaction/editing unless the section’s edit button is activated.
    Ensure that once editing is enabled and changes are made, the component correctly retains the saved data.
    Validate that the component behavior aligns with the other components in the same section.
    Validate that the behavior is consistent across both Servicing and Origination.
    CHECK IMAGEM BELOW

    -----

    UOWN | Servicing | Corrigir Componente Permitindo Edição Sem Modo de Edição da Seção Ativado (Servicing e Origination)

    Sinopse
    Atualmente, um dos componentes da seção permite interação mesmo quando o botão de edição da seção não foi ativado.
    Esse comportamento é inconsistente com os outros componentes da mesma seção, que respeitam corretamente o estado travado e só permitem edição após ativação explícita.

    Objetivo de Negócio
    Padronizar o comportamento dos componentes para garantir consistência na interface, evitar alterações não intencionais e melhorar a experiência do usuário.
    Isso contribui para a confiabilidade do sistema e reduz possíveis erros dos usuários.

    Solicitação de Funcionalidade | Requisitos de Negócio
    Garantir que o componente não permita interação/edição a menos que o botão de edição da seção esteja ativado.
    Garantir que, uma vez que a edição esteja habilitada e as alterações realizadas, o componente retém corretamente os dados salvos.
    Validar que o comportamento do componente esteja alinhado com os outros componentes da mesma seção.
    Validar que o comportamento seja consistente tanto no Servicing quanto no Origination.
    CHECK IMAGEM ABAIXO





    agent pode marcar para cliente nao receber ligacao ou mensagem de texto.
    verificaram que o componente estava errado
    permitia manipular sem editar
    nao deve permitir alterar opcoes/manipular sem editar

    clicar em edicao, editar dados para depois salvar
    nao permitir editar sem clicar em edicao
    verificar se a informacao é salva corretamente no bando de dados ao selecionar
    estava deixando selvar sem um motivo
    nao permitir salvar sem motivo nos botoes do not call e do not texto

    1. No portal Origination, o componente "Do Not Email" deve permitir interação apenas quando o botão de edição da seção estiver ativado. Após a habilitação da edição, o salvamento só será permitido se um motivo for informado. Ao fornecer o motivo e concluir as alterações, o componente deve armazenar corretamente os dados no banco de dados e registrar a ação no log.
    1. In the Origination portal, the "Do Not Email" component should allow interaction only when the section's edit button is activated. Once editing is enabled, saving should be permitted only if a reason is provided. Upon entering the reason and completing the changes, the component must correctly store the data in the database and log the action.

    2. No portal Origination, o componente "Do Not Email" deve permitir interação apenas quando o botão de edição da seção estiver ativado. Após a habilitação da edição, o salvamento será permitido somente se um motivo for informado. Ao salvar, apenas o motivo deve ser registrado. Se o usuário clicar em "Cancelar", o componente deve exibir a caixa de seleção desmarcada, sem armazenar o motivo no banco de dados ou no log.
    2. In the Origination portal, the "Do Not Email" component should allow interaction only when the section's edit button is activated. Once editing is enabled, saving is permitted only if a reason is provided. Upon saving, only the reason should be recorded. If the user clicks "Cancel," the component must display the checkbox as unchecked, without storing the reason in the database or log.
    Ao clicar em "Cancelar" após marcar a opção "do not email" e inserir um motivo, o sistema ainda salva a alteração, tanto na interface quanto no banco de dados. O esperado é que ao cancelar, nada seja salvo.
    When clicking "Cancel" after checking "do not email" and entering a reason, the system still saves the change, both in the interface and the database. The expected behavior is that nothing should be saved when canceling.

      2.  Em Origination, garantir que o componente do not call devem permitir interação somente quando o botão de edição da seção for ativado, uma vez que a edição esteja habilitada , permitir salvar somente se informar o motivo, ao informar o motivo e as alterações realizadas, o componente deve armazenar corretamente os dados salvos no banco de dados e log.

      3.  Em Origination, garantir que o componente do not text devem permitir interação somente quando o botão de edição da seção for ativado, uma vez que a edição esteja habilitada , permitir salvar somente se informar o motivo, ao informar o motivo e as alterações realizadas, o componente deve armazenar corretamente os dados salvos no banco de dados e log.

      4. No portal Servicing', o componente "Do Not Email" deve permitir interação apenas quando o botão de edição da seção estiver ativado. Após a habilitação da edição, o salvamento só será permitido se um motivo for informado. Ao fornecer o motivo e concluir as alterações, o componente deve armazenar corretamente os dados no banco de dados e registrar a ação no log.
      4. In the Servicing portal, the "Do Not Email" component should allow interaction only when the section's edit button is activated. Once editing is enabled, saving should be permitted only if a reason is provided. Upon entering the reason and completing the changes, the component must correctly store the data in the database and log the action.
      O componente "Do Not Email" permite interação mesmo sem o modo de edição ativado e deve permitir interação quando o botão de edição da seção estiver ativado.
      The "Do Not Email" component allows interaction even without edit mode enabled and should allow interaction when the section's edit button is enabled.

      5.  Em Servicing, garantir que o componente do not call devem permitir interação somente quando o botão de edição da seção for ativado, uma vez que a edição esteja habilitada e as alterações realizadas, o componente deve armazenar corretamente os dados salvos no banco de dados e log.

      6.  Em Servicing, garantir que o componente do not text devem permitir interação somente quando o botão de edição da seção for ativado, uma vez que a edição esteja habilitada e as alterações realizadas, o componente deve armazenar corretamente os dados salvos no banco de dados e log.

      -----

      | LeadPk/AccountPk | Merchant          | Test Case                                                                                                                                                                                                                                                                                                                                                                                            | Test Data | Status | Observation                                                                                                                                                                                                                  |
      | ------           | ------            | ------                                                                                                                                                                                                                                                                                                                                                                                               | ------    | ------ | ------                                                                                                                                                                                                                       |
      | 9054             | Progress Mobility | In the Origination portal, the "Do Not Email" component should allow interaction only when the section's edit button is activated. Once editing is enabled, saving is permitted only if a reason is provided. Upon saving, only the reason should be recorded. If the user clicks "Cancel," the component must display the checkbox as unchecked, without storing the reason in the database or log. |           | ERROR  | When clicking "Cancel" after checking "do not email" and entering a reason, the system still saves the change, both in the interface and the database. The expected behavior is that nothing should be saved when canceling. |
      | 3928             | Progress Mobility | In the Servicing portal, the "Do Not Email" component should allow interaction only when the section's edit button is activated. Once editing is enabled, saving should be permitted only if a reason is provided. Upon entering the reason and completing the changes, the component must correctly store the data in the database and log the action.                                              |           | PASS   | The "Do Not Email" component allows interaction even without edit mode enabled and should allow interaction when the section's edit button is enabled.                                                                       |

      -----

      | LeadPk/AccountPk | Merchant          | Test Case                                                                                                                                                                                                                                                                                                                                                                                            | Test Data                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Status | Observation                                                                                                                                                                                                                  |
      | ------           | ------            | ------                                                                                                                                                                                                                                                                                                                                                                                               | ------                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | ------ | ------                                                                                                                                                                                                                       |
      | 9054             | Progress Mobility | In the Origination portal, the "Do Not Email" component should allow interaction only when the section's edit button is activated. Once editing is enabled, saving is permitted only if a reason is provided. Upon saving, only the reason should be recorded. If the user clicks "Cancel," the component must display the checkbox as unchecked, without storing the reason in the database or log. | ![361-qa1-c2-ERROR-SalvarOMotivoSalvaTodosOsDadosQuandoCanceloDadosSaoSalvos-AoClicarParaSalvarMotivoSalvarSomenteMotivoAoClicarEmCancelarNaoSalvarMotivo-_E1__1_](/uploads/657d3b4538f59629e13ca7a256eefda2/361-qa1-c2-ERROR-SalvarOMotivoSalvaTodosOsDadosQuandoCanceloDadosSaoSalvos-AoClicarParaSalvarMotivoSalvarSomenteMotivoAoClicarEmCancelarNaoSalvarMotivo-_E1__1_.png){width=1437 height=739}![361-qa1-c2-ERROR-SalvarOMotivoSalvaTodosOsDadosQuandoCanceloDadosSaoSalvos-AoClicarParaSalvarMotivoSalvarSomenteMotivoAoClicarEmCancelarNaoSalvarMotivo-_E1__2_](/uploads/94a189b2d1b34b4242c98e8c9bd37273/361-qa1-c2-ERROR-SalvarOMotivoSalvaTodosOsDadosQuandoCanceloDadosSaoSalvos-AoClicarParaSalvarMotivoSalvarSomenteMotivoAoClicarEmCancelarNaoSalvarMotivo-_E1__2_.png){width=1437 height=739}![361-qa1-c2-ERROR-SalvarOMotivoSalvaTodosOsDadosQuandoCanceloDadosSaoSalvos-AoClicarParaSalvarMotivoSalvarSomenteMotivoAoClicarEmCancelarNaoSalvarMotivo-_E1__3_](/uploads/58411607c868fb14536d4301da6e3d12/361-qa1-c2-ERROR-SalvarOMotivoSalvaTodosOsDadosQuandoCanceloDadosSaoSalvos-AoClicarParaSalvarMotivoSalvarSomenteMotivoAoClicarEmCancelarNaoSalvarMotivo-_E1__3_.png){width=1437 height=739}![361-qa1-c2-ERROR-SalvarOMotivoSalvaTodosOsDadosQuandoCanceloDadosSaoSalvos-AoClicarParaSalvarMotivoSalvarSomenteMotivoAoClicarEmCancelarNaoSalvarMotivo-_E1__4_](/uploads/d03c70483bfa1e4eddb1f6e51ccd85d3/361-qa1-c2-ERROR-SalvarOMotivoSalvaTodosOsDadosQuandoCanceloDadosSaoSalvos-AoClicarParaSalvarMotivoSalvarSomenteMotivoAoClicarEmCancelarNaoSalvarMotivo-_E1__4_.png){width=1437 height=739}![361-qa1-c2-ERROR-SalvarOMotivoSalvaTodosOsDadosQuandoCanceloDadosSaoSalvos-AoClicarParaSalvarMotivoSalvarSomenteMotivoAoClicarEmCancelarNaoSalvarMotivo-_E1__5_](/uploads/234b3817b229605217a6f80ae91babae/361-qa1-c2-ERROR-SalvarOMotivoSalvaTodosOsDadosQuandoCanceloDadosSaoSalvos-AoClicarParaSalvarMotivoSalvarSomenteMotivoAoClicarEmCancelarNaoSalvarMotivo-_E1__5_.png){width=1437 height=739}![361-qa1-c2-ERROR-SalvarOMotivoSalvaTodosOsDadosQuandoCanceloDadosSaoSalvos-AoClicarParaSalvarMotivoSalvarSomenteMotivoAoClicarEmCancelarNaoSalvarMotivo-_E1__6_](/uploads/c7151d881c8327e9ea3221e5995f220a/361-qa1-c2-ERROR-SalvarOMotivoSalvaTodosOsDadosQuandoCanceloDadosSaoSalvos-AoClicarParaSalvarMotivoSalvarSomenteMotivoAoClicarEmCancelarNaoSalvarMotivo-_E1__6_.png){width=1437 height=739}![361-qa1-c2-ERROR-SalvarOMotivoSalvaTodosOsDadosQuandoCanceloDadosSaoSalvos-AoClicarParaSalvarMotivoSalvarSomenteMotivoAoClicarEmCancelarNaoSalvarMotivo-_E1__7_](/uploads/0ed577c5938b3cec4a3203401530c61d/361-qa1-c2-ERROR-SalvarOMotivoSalvaTodosOsDadosQuandoCanceloDadosSaoSalvos-AoClicarParaSalvarMotivoSalvarSomenteMotivoAoClicarEmCancelarNaoSalvarMotivo-_E1__7_.png){width=1168 height=69} | ERROR  | When clicking "Cancel" after checking "do not email" and entering a reason, the system still saves the change, both in the interface and the database. The expected behavior is that nothing should be saved when canceling. |
      | 3928             | Progress Mobility | In the Servicing portal, the "Do Not Email" component should allow interaction only when the section's edit button is activated. Once editing is enabled, saving should be permitted only if a reason is provided. Upon entering the reason and completing the changes, the component must correctly store the data in the database and log the action.                                              | ![361-qa1-c4-ERROR-PermitindoMarcarOpcaoDoNotEmailSemEditarComponente-DevePermitirEdicaoSomenteSeEditar-_E1__1_](/uploads/499f249929e82b9243e8d6415fbf9ad2/361-qa1-c4-ERROR-PermitindoMarcarOpcaoDoNotEmailSemEditarComponente-DevePermitirEdicaoSomenteSeEditar-_E1__1_.png){width=1437 height=740}![361-qa1-c4-ERROR-PermitindoMarcarOpcaoDoNotEmailSemEditarComponente-DevePermitirEdicaoSomenteSeEditar-_E1__2_](/uploads/fa5d93fa05c6a3f3bc121a93a9b8b826/361-qa1-c4-ERROR-PermitindoMarcarOpcaoDoNotEmailSemEditarComponente-DevePermitirEdicaoSomenteSeEditar-_E1__2_.png){width=1437 height=740}                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | ERROR  | The "Do Not Email" component allows interaction even without edit mode enabled and should allow interaction when the section's edit button is enabled.                                                                       |

      Erro cenário 2 e 4, depois de corrigido testar todos os cenpários.

      ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------



      ✅ Requisitos Extraídos
      Funcionais
      O componente Do Not Email só pode ser editado se o botão de edição da seção estiver ativado.
      O componente Do Not Call só pode ser editado se o botão de edição da seção estiver ativado.
      O componente Do Not Text só pode ser editado se o botão de edição da seção estiver ativado.
      O componente Do Not Contact só está presente no Servicing.
      O motivo deve ser obrigatório para que uma alteração seja salva.
      Ao clicar em "Cancelar", nenhuma informação deve ser salva nem exibida.
      Se marcado e depois desmarcado antes de salvar, nada deve ser persistido.
      O sistema deve salvar corretamente no banco de dados e registrar no log somente após confirmação.
      Campos devem estar visualmente desabilitados fora do modo de edição.
      Campos já marcados vindos do backend devem ser carregados corretamente, mas apenas reeditáveis no modo edição.
      A interface deve exibir feedback claro (mensagem de erro, campo vermelho) quando o campo motivo estiver vazio no momento do salvamento.

      Não Funcionais
      Consistência entre os portais Origination e Servicing.
      Prevenção de ações acidentais (não permitir salvar sem intenção explícita).
      Experiência do usuário com respostas visuais adequadas (mensagens, estados de botão, campos desabilitados).
      Persistência e reversão visual devem estar sincronizadas com a ação tomada (ex.: cancelar reverte visual).
      Compatibilidade e padronização com os demais componentes da mesma seção

      | ID do Cenário | Nome do Cenário                                                       | Requisitos Cobertos |
      | ------------- | --------------------------------------------------------------------- | ------------------- |
      | C01           | Editar e Salvar com motivo - Do Not Email (Servicing)                 | 1, 5, 8             |
      | C02           | Cancelar sem salvar - Do Not Email (Servicing)                        | 1, 6, 9             |
      | C03           | Salvar sem motivo - Do Not Email (Servicing)                          | 1, 5, 11            |
      | C04           | Editar bloqueado - Do Not Email (Servicing)                           | 1, 9                |
      | C05           | Editar reverso (Marcar > Desmarcar > Salvar) - Do Not Email           | 1, 7                |
      | C06           | Verificar estado visual após Cancelar - Do Not Email                  | 6, 9                |
      | C07           | Marcar múltiplos campos antes de salvar - Do Not Email e Call         | 1, 3, 8             |
      | C08           | Campo já marcado do backend - Do Not Email                            | 10, 1               |
      | C09           | Desmarcar campo já salvo - Do Not Email                               | 6, 10               |
      | C10           | Exibir erro de motivo vazio - Do Not Email                            | 5, 11               |
      | C11           | Campo inexistente em portal incorreto (Do Not Contact em Origination) | 4                   |


      | ID do Cenário | Nome do Cenário                                                       | Requisitos Cobertos |
      | ------------- | --------------------------------------------------------------------- | ------------------- |
      | C01           | Editar e Salvar com motivo - Do Not Email (Servicing)                 | 1, 5, 8             |
      | C02           | Cancelar sem salvar - Do Not Email (Servicing)                        | 1, 6, 9             |
      | C03           | Salvar sem motivo - Do Not Email (Servicing)                          | 1, 5, 11            |
      | C04           | Editar bloqueado - Do Not Email (Servicing)                           | 1, 9                |
      | C05           | Editar reverso (Marcar > Desmarcar > Salvar) - Do Not Email           | 1, 7                |
      | C06           | Verificar estado visual após Cancelar - Do Not Email                  | 6, 9                |
      | C07           | Marcar múltiplos campos antes de salvar - Do Not Email e Call         | 1, 3, 8             |
      | C08           | Campo já marcado do backend - Do Not Email                            | 10, 1               |
      | C09           | Desmarcar campo já salvo - Do Not Email                               | 6, 10               |
      | C10           | Exibir erro de motivo vazio - Do Not Email                            | 5, 11               |
      | C11           | Campo inexistente em portal incorreto (Do Not Contact em Origination) | 4                   |



Funcionalidade: Preferências de Contato - UOWN (Servicing e Origination)

Cenário: [Servicing] Editar e Salvar com motivo - Do Not Email
Dado que estou no portal Servicing
E a seção está no modo de edição
Quando eu marcar a opção "Do Not Email"
E informar o motivo "Cliente optou por não receber emails"
E clicar em "Salvar"
Então o motivo deve ser salvo no banco de dados e no log


Cenário: [Servicing] Cancelar sem salvar - Do Not Email
Dado que estou no portal Servicing
E a seção está no modo de edição
Quando eu marcar "Do Not Email" e informar um motivo
E clicar em "Cancelar"
Então nenhuma informação deve ser salva
E a caixa deve retornar ao estado desmarcado

Cenário: [Servicing] Tentar salvar sem motivo - Do Not Email
Dado que estou no portal Servicing
E a seção está no modo de edição
Quando eu marcar "Do Not Email" e clicar em "Salvar"
Então o sistema deve exibir mensagem "Motivo obrigatório"
E nenhuma informação deve ser salva

Cenário: [Servicing] Tentar editar sem ativar modo de edição - Do Not Email
Dado que estou no portal Servicing
E a seção NÃO está no modo de edição
Então o checkbox "Do Not Email" deve estar desabilitado

Cenário: [Servicing] Marcar e desmarcar antes de salvar - Do Not Email
Dado que estou no portal Servicing
E a seção está no modo de edição
Quando eu marcar e depois desmarcar o "Do Not Email"
E clicar em "Salvar"
Então nenhuma alteração deve ser salva

Cenário: [Servicing] Verificar estado visual após cancelar - Do Not Email
Dado que estou no portal Servicing
E a seção está no modo de edição
Quando eu marcar o "Do Not Email", informar motivo e clicar em "Cancelar"
Então a checkbox deve aparecer desmarcada na interface

Cenário: [Servicing] Marcar múltiplos campos - Do Not Email e Do Not Call
Dado que estou no portal Servicing
E a seção está no modo de edição
Quando eu marcar "Do Not Email" e "Do Not Call"
E informar motivos diferentes
E clicar em "Salvar"
Então cada motivo deve ser salvo corretamente no banco de dados e log

Cenário: [Servicing] Campo já marcado vindo do backend - Do Not Email
Dado que estou no portal Servicing
E a seção está no modo de edição
E o campo "Do Not Email" está previamente marcado
Quando eu visualizar o campo
Então ele deve exibir o estado marcado
E permitir edição

Cenário: [Servicing] Desmarcar campo com motivo salvo - Do Not Email
Dado que estou no portal Servicing
E "Do Not Email" está marcado e com motivo salvo
Quando eu desmarcar a opção e clicar em "Salvar"
Então o motivo anterior deve ser removido do banco de dados e log

Cenário: [Origination] Campo "Do Not Contact" não deve estar presente
Dado que estou no portal Origination
Então o campo "Do Not Contact" não deve estar visível

Cenário: [Origination] Editar e Salvar com motivo - Do Not Call
Dado que estou no portal Origination
E a seção está no modo de edição
Quando eu marcar "Do Not Call"
E informar o motivo
E clicar em "Salvar"
Então o motivo deve ser salvo no banco de dados e log

Cenário: [Origination] Cancelar edição sem salvar - Do Not Call
Dado que estou no portal Origination
E a seção está no modo de edição
Quando eu marcar "Do Not Call" e clicar em "Cancelar"
Então nenhuma informação deve ser salva
E o campo deve voltar ao estado original

Cenário: [Origination] Tentar salvar sem motivo - Do Not Call
Dado que estou no portal Origination
E a seção está no modo de edição
Quando eu marcar "Do Not Call" e não informar motivo
E clicar em "Salvar"
Então o sistema deve impedir a ação
E exibir uma mensagem "Motivo é obrigatório"

Cenário: [Origination] Tentar editar sem ativar modo de edição - Do Not Call
Dado que estou no portal Origination
E a seção NÃO está em modo de edição
Então o campo "Do Not Call" deve estar desabilitado


Cenário: [Servicing] Marcar 'Do Not Contact' marca todas as opções
Dado que o usuário está no portal Servicing
E a seção está no modo de edição
Quando o usuário marcar o checkbox 'Do Not Contact'
E inserir o motivo
Então os checkboxes 'Do Not Email', 'Do Not Call' e 'Do Not Text' devem ser automaticamente marcados
E todos os checkboxes devem ficar desabilitados após salvar

Cenário: [Servicing] Ao mudar de página a marcação de 'Do Not Contact' deve ser persistida
E a seção está no modo de edição
Quando o usuário marcar o checkbox 'Do Not Contact'
E salvar
E navegar para outra página
E quando retornar à página de clientes
Então a marcação em 'Do Not Contact' deve ser exibida
E o checkbox 'Do Not Contact' deve estar marcado

-----



Verificar se do not contact deve marcar tudo ou somente text e call





| LeadPk | Merchant | Caso de Teste | Dados de Teste | Status | Observacao |
|--------|----------|---------------|----------------|--------|------------|
| X | X | ```gherkin<br>Scenario: [Servicing] Editar e Salvar com motivo - Do Not Email<br>Given que estou no portal Servicing<br>And a seção está no modo de edição<br>When eu marcar a opção "Do Not Email"<br>And informar o motivo "Cliente optou por não receber emails"<br>And clicar em "Salvar"<br>Then o motivo deve ser salvo no banco de dados e no log<br>``` | - | PASS | - |
| X | X | ```gherkin<br>Scenario: [Servicing] Cancelar sem salvar - Do Not Email<br>Given que estou no portal Servicing<br>And a seção está no modo de edição<br>When eu marcar "Do Not Email" e informar um motivo<br>And clicar em "Cancelar"<br>Then nenhuma informação deve ser salva<br>And a caixa deve retornar ao estado desmarcado<br>``` | - | PASS | - |
| X | X | ```gherkin<br>Scenario: [Servicing] Tentar salvar sem motivo - Do Not Email<br>Given que estou no portal Servicing<br>And a seção está no modo de edição<br>When eu marcar "Do Not Email" e clicar em "Salvar"<br>Then o sistema deve exibir mensagem "Motivo obrigatório"<br>And nenhuma informação deve ser salva<br>``` | Mensagem de erro: Motivo obrigatório | FAIL | - |
| X | X | ```gherkin<br>Scenario: [Servicing] Tentar editar sem ativar modo de edição - Do Not Email<br>Given que estou no portal Servicing<br>And a seção NÃO está no modo de edição<br>Then o checkbox "Do Not Email" deve estar desabilitado<br>``` | - | PASS | - |
| X | X | ```gherkin<br>Scenario: [Servicing] Marcar e desmarcar antes de salvar - Do Not Email<br>Given que estou no portal Servicing<br>And a seção está no modo de edição<br>When eu marcar e depois desmarcar o "Do Not Email"<br>And clicar em "Salvar"<br>Then nenhuma alteração deve ser salva<br>``` | - | PASS | - |
| X | X | ```gherkin<br>Scenario: [Servicing] Verificar estado visual após cancelar - Do Not Email<br>Given que estou no portal Servicing<br>And a seção está no modo de edição<br>When eu marcar o "Do Not Email", informar motivo e clicar em "Cancelar"<br>Then a checkbox deve aparecer desmarcada na interface<br>``` | - | PASS | - |
| X | X | ```gherkin<br>Scenario: [Servicing] Marcar múltiplos campos - Do Not Email e Do Not Call<br>Given que estou no portal Servicing<br>And a seção está no modo de edição<br>When eu marcar "Do Not Email" e "Do Not Call"<br>And informar motivos diferentes<br>And clicar em "Salvar"<br>Then cada motivo deve ser salvo corretamente no banco de dados e log<br>``` | - | PASS | - |
| X | X | ```gherkin<br>Scenario: [Servicing] Campo já marcado vindo do backend - Do Not Email<br>Given que estou no portal Servicing<br>And a seção está no modo de edição<br>And o campo "Do Not Email" está previamente marcado<br>When eu visualizar o campo<br>Then ele deve exibir o estado marcado<br>And permitir edição<br>``` | - | PASS | - |
| X | X | ```gherkin<br>Scenario: [Servicing] Desmarcar campo com motivo salvo - Do Not Email<br>Given que estou no portal Servicing<br>And "Do Not Email" está marcado e com motivo salvo<br>When eu desmarcar a opção e clicar em "Salvar"<br>Then o motivo anterior deve ser removido do banco de dados e log<br>``` | - | PASS | - |
| X | X | ```gherkin<br>Scenario: [Origination] Campo "Do Not Contact" não deve estar presente<br>Given que estou no portal Origination<br>Then o campo "Do Not Contact" não deve estar visível<br>``` | - | PASS | - |
| X | X | ```gherkin<br>Scenario: [Origination] Editar e Salvar com motivo - Do Not Call<br>Given que estou no portal Origination<br>And a seção está no modo de edição<br>When eu marcar "Do Not Call"<br>And informar o motivo<br>And clicar em "Salvar"<br>Then o motivo deve ser salvo no banco de dados e log<br>``` | - | PASS | - |
| X | X | ```gherkin<br>Scenario: [Origination] Cancelar edição sem salvar - Do Not Call<br>Given que estou no portal Origination<br>And a seção está no modo de edição<br>When eu marcar "Do Not Call" e clicar em "Cancelar"<br>Then nenhuma informação deve ser salva<br>And o campo deve voltar ao estado original<br>``` | - | PASS | - |
| X | X | ```gherkin<br>Scenario: [Origination] Tentar salvar sem motivo - Do Not Call<br>Given que estou no portal Origination<br>And a seção está no modo de edição<br>When eu marcar "Do Not Call" e não informar motivo<br>And clicar em "Salvar"<br>Then o sistema deve impedir a ação<br>And exibir uma mensagem "Motivo é obrigatório"<br>``` | - | FAIL | - |
| X | X | ```gherkin<br>Scenario: [Origination] Tentar editar sem ativar modo de edição - Do Not Call<br>Given que estou no portal Origination<br>And a seção NÃO está em modo de edição<br>Then o campo "Do Not Call" deve estar desabilitado<br>``` | - | PASS | - |
| X | X | ```gherkin<br>Scenario: [Servicing] Marcar 'Do Not Contact' marca todas as opções<br>Given que o usuário está no portal Servicing<br>And a seção está no modo de edição<br>When o usuário marcar o checkbox 'Do Not Contact'<br>And inserir o motivo<br>Then os checkboxes 'Do Not Email', 'Do Not Call' e 'Do Not Text' devem ser automaticamente marcados<br>And todos os checkboxes devem ficar desabilitados após salvar<br>``` | - | PASS | - |
| X | X | ```gherkin<br>Scenario: [Servicing] Ao mudar de página a marcação de 'Do Not Contact' deve ser persistida<br>Given a seção está no modo de edição<br>When o usuário marcar o checkbox 'Do Not Contact'<br>And salvar<br>And navegar para outra página<br>And quando retornar à página de clientes<br>Then a marcação em 'Do Not Contact' deve ser exibida<br>And o checkbox 'Do Not Contact' deve estar marcado<br>``` | - | PASS | - |


```gherkin
Scenario: [Servicing] Edit and Save with reason - Do Not Email
Given I am on the Servicing portal
And the section is in edit mode
When I check the "Do Not Email" option
And provide the reason "Customer chose not to receive emails"
And click "Save"
Then the reason should be saved in the database and in the log
```

```gherkin
Scenario: [Servicing] Cancel without saving - Do Not Email
Given I am on the Servicing portal
And the section is in edit mode
When I check "Do Not Email" and provide a reason
And click "Cancel"
Then no information should be saved
And the checkbox should return to an unchecked state
```

```gherkin
Scenario: [Servicing] Try saving without reason - Do Not Email
Given I am on the Servicing portal
And the section is in edit mode
When I check "Do Not Email" and click "Save"
Then the system should display the message "Reason is required"
And no information should be saved
```

```gherkin
Scenario: [Servicing] Try editing without enabling edit mode - Do Not Email
Given I am on the Servicing portal
And the section is NOT in edit mode
Then the "Do Not Email" checkbox should be disabled
```

```gherkin
Scenario: [Servicing] Check and uncheck before saving - Do Not Email
Given I am on the Servicing portal
And the section is in edit mode
When I check and then uncheck the "Do Not Email"
And click "Save"
Then no changes should be saved
```

```gherkin
Scenario: [Servicing] Verify visual state after cancel - Do Not Email
Given I am on the Servicing portal
And the section is in edit mode
When I check "Do Not Email", provide a reason, and click "Cancel"
Then the checkbox should appear unchecked in the interface
```

```gherkin
Scenario: [Servicing] Check multiple fields - Do Not Email and Do Not Call
Given I am on the Servicing portal
And the section is in edit mode
When I check "Do Not Email" and "Do Not Call"
And provide different reasons
And click "Save"
Then each reason should be correctly saved in the database and log
```

```gherkin
Scenario: [Servicing] Field already checked from backend - Do Not Email
Given I am on the Servicing portal
And the section is in edit mode
And the "Do Not Email" field is already checked
When I view the field
Then it should appear as checked
And allow editing
```

```gherkin
Scenario: [Servicing] Uncheck field with saved reason - Do Not Email
Given I am on the Servicing portal
And "Do Not Email" is checked with a saved reason
When I uncheck the option and click "Save"
Then the previous reason should be removed from the database and log
```

```gherkin
Scenario: [Origination] "Do Not Contact" field must not be present
Given I am on the Origination portal
Then the "Do Not Contact" field should not be visible
```

```gherkin
Scenario: [Origination] Edit and Save with reason - Do Not Call
Given I am on the Origination portal
And the section is in edit mode
When I check "Do Not Call"
And provide the reason
And click "Save"
Then the reason should be saved in the database and log
```

```gherkin
Scenario: [Origination] Cancel edit without saving - Do Not Call
Given I am on the Origination portal
And the section is in edit mode
When I check "Do Not Call" and click "Cancel"
Then no information should be saved
And the field should return to its original state
```

```gherkin
Scenario: [Origination] Try saving without reason - Do Not Call
Given I am on the Origination portal
And the section is in edit mode
When I check "Do Not Call" and do not provide a reason
And click "Save"
Then the system should block the action
And display a message "Reason is required"
```

```gherkin
Scenario: [Origination] Try editing without enabling edit mode - Do Not Call
Given I am on the Origination portal
And the section is NOT in edit mode
Then the "Do Not Call" field should be disabled
```

```gherkin
Scenario: [Servicing] Checking 'Do Not Contact' checks all options
Given the user is on the Servicing portal
And the section is in edit mode
When the user checks the 'Do Not Contact' checkbox
And enters the reason
Then the 'Do Not Email', 'Do Not Call' and 'Do Not Text' checkboxes should be automatically checked
And all checkboxes should be disabled after saving
And the 'Do Not Contact' checkbox should be checked
```

```gherkin
Scenario: [Servicing] 'Do Not Contact' selection must persist after page change
Given the section is in edit mode
When the user checks the 'Do Not Contact' checkbox
And saves
And navigates to another page
And when returning to the customer page
Then the 'Do Not Contact' selection should be displayed
And the 'Do Not Contact' checkbox should be checked
```

| LeadPk | Merchant | Caso de Teste | Dados de Teste | Status | Observacao |
|--------|----------|---------------|----------------|--------|------------|
| X | X | [Servicing] Marcar "Do Not Email", informar a razão e salvar, validando que a razão é corretamente registrada no banco e no log. | - | PASS | - |
| X | X | [Servicing] Cancelar a edição após marcar "Do Not Email" e preencher a razão, garantindo que nenhuma informação seja salva e que o checkbox volte ao estado original. | - | PASS | - |
| X | X | [Servicing] Tentar salvar "Do Not Email" sem razão e verificar se o sistema exibe a mensagem "Reason is required" e não salva nenhuma informação. | - | PASS | - |
| X | X | [Servicing] Verificar que, com a seção fora do modo de edição, o checkbox "Do Not Email" permanece desabilitado. | - | PASS | - |
| X | X | [Servicing] Marcar e desmarcar "Do Not Email" antes de salvar e confirmar que nenhuma alteração é persistida. | - | PASS | - |
| X | X | [Servicing] Cancelar a edição de "Do Not Email" e verificar visualmente que o checkbox aparece desmarcado. | - | PASS | - |
| X | X | [Servicing] Marcar "Do Not Email" e "Do Not Call" com razões diferentes e confirmar que ambas são salvas corretamente. | - | PASS | - |
| X | X | [Servicing] Validar que, se o campo "Do Not Email" vier marcado do backend, ele aparece como marcado e permite edição. | - | PASS | - |
| X | X | [Servicing] Desmarcar "Do Not Email" com razão previamente salva, clicar em "Save" e verificar que a razão é removida do banco e do log. | - | PASS | - |
| X | X | [Origination] Verificar que o campo "Do Not Contact" não é exibido no portal Origination. | - | PASS | - |
| X | X | [Origination] Editar e marcar "Do Not Call", informar uma razão e salvar, validando que a razão é salva corretamente. | - | PASS | - |
| X | X | [Origination] Marcar "Do Not Call" e cancelar a edição, validando que nenhuma alteração é salva e que o campo retorna ao estado original. | - | PASS | - |
| X | X | [Origination] Tentar salvar "Do Not Call" sem informar razão e confirmar que o sistema bloqueia a ação e exibe a mensagem "Reason is required". | - | PASS | - |
| X | X | [Origination] Verificar que, com a seção fora do modo de edição, o campo "Do Not Call" permanece desabilitado. | - | PASS | - |
| X | X | [Servicing] Marcar "Do Not Contact" e verificar que os campos "Do Not Email", "Do Not Call" e "Do Not Text" são automaticamente marcados e desabilitados após salvar. | - | PASS | - |
| X | X | [Servicing] Salvar a marcação de "Do Not Contact" e confirmar que a seleção persiste ao navegar e retornar à página do cliente. | - | PASS | - |






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


------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


Tests in stg

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

-----

[Servicing] Selecione "Não Enviar E-mail", forneça um motivo e salve, validando que o motivo está corretamente armazenado no banco de dados e no log.
24027 - 206396
[Servicing] Cancele a edição após selecionar "Não Enviar E-mail" e inserir um motivo, garantindo que nenhuma informação seja salva e a caixa de seleção retorne ao seu estado original.
[Servicing] Tente salvar "Não Enviar E-mail" sem um motivo e verifique se o sistema exibe a mensagem "Motivo é obrigatório" e não salva nenhum dado.
[Servicing] Verifique se, quando a seção não está no modo de edição, a caixa de seleção "Não Enviar E-mail" permanece desabilitada.
[Servicing] Selecione e desmarque "Não Enviar E-mail" antes de salvar e confirme que nenhuma alteração é persistida.
[Servicing] Cancele a edição de "Não Enviar E-mail" e confirme visualmente que a caixa de seleção aparece desmarcada.
[Servicing] Selecione "Não Enviar E-mail" e "Não Telefonar" com motivos diferentes e confirme que ambos são salvos corretamente.
[Servicing] Valide que, se o campo "Não Enviar E-mail" vier pré-marcado do backend, ele aparece marcado e permite edição.
[Servicing] Desmarque "Não Enviar E-mail" com um motivo previamente salvo, clique em "Salvar" e verifique se o motivo é removido do banco de dados e do log.
[Origination] Edite e selecione "Não Telefonar", forneça um motivo e salve, validando que o motivo é salvo corretamente.
[Origination] Selecione "Não Telefonar" e cancele a edição, validando que nenhuma alteração é salva e o campo retorna ao seu estado original.
[Origination] Tente salvar "Não Telefonar" sem fornecer um motivo e confirme que o sistema bloqueia a ação e exibe "Motivo é obrigatório".
[Origination] Verifique se, quando a seção não está no modo de edição, o campo "Não Telefonar" permanece desabilitado.

-----


> ## Tests in stg
> ```gherkin
> Cenário: Selecionar "Não Enviar E-mail", fornecer um motivo e salvar
>   Dado que o usuário está logado no sistema
>   Quando seleciona "Não Enviar E-mail" e informa um motivo
>   E clica em "Salvar"
>   Então o motivo deve ser armazenado corretamente no banco de dados
> | PASS | LeadPk 24027 / AccountPk 206396 | Merchant | 
> ```
>
> 
> ```gherkin
> Cenário: Cancelar edição após selecionar "Não Enviar E-mail" e inserir um motivo
>   Dado que o usuário iniciou a edição de "Não Enviar E-mail" e inseriu um motivo
>   Quando cancela a edição
>   Então nenhuma informação deve ser salva
>   E a caixa de seleção deve retornar ao seu estado original
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
> 
> ```gherkin
> Cenário: Tentar salvar "Não Enviar E-mail" sem um motivo
>   Dado que o usuário selecionou "Não Enviar E-mail"
>   Quando tenta salvar sem informar um motivo
>   Então o sistema deve exibir a mensagem "Motivo é obrigatório"
>   E não deve salvar nenhum dado
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
> 
> ```gherkin
> Cenário: Caixa de seleção "Não Enviar E-mail" desabilitada quando fora do modo de edição
>   Dado que a seção não está no modo de edição
>   Então a caixa de seleção "Não Enviar E-mail" deve permanecer desabilitada
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
> 
> ```gherkin
> Cenário: Selecionar e desmarcar "Não Enviar E-mail" antes de salvar
>   Dado que o usuário selecionou "Não Enviar E-mail"
>   Quando desmarca a opção antes de salvar
>   Então nenhuma alteração deve ser persistida
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
> 
> ```gherkin
> Cenário: Cancelar edição de "Não Enviar E-mail" e verificar caixa desmarcada
>   Dado que o usuário iniciou a edição de "Não Enviar E-mail"
>   Quando cancela a edição
>   Então a caixa de seleção deve aparecer desmarcada
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
> 
> ```gherkin
> Cenário: Desmarcar "Não Enviar E-mail" com motivo previamente salvo
>   Dado que "Não Enviar E-mail" está marcado com um motivo previamente salvo
>   Quando o usuário desmarca e clica em "Salvar"
>   Então o motivo deve ser removido do banco de dados
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
> 
> ```gherkin 
> Cenário: Selecionar "Não Telefonar", fornecer um motivo e salvar
>   Dado que o usuário está na tela de atendimento
>   Quando seleciona "Não Telefonar" e informa um motivo
>   E clica em "Salvar"
>   Então o motivo deve ser salvo corretamente no banco de dados e no log
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
> 
> ```gherkin
> Cenário: Cancelar edição após selecionar "Não Telefonar" e inserir um motivo
>   Dado que o usuário iniciou a edição de "Não Telefonar" e inseriu um motivo
>   Quando cancela a edição
>   Então nenhuma informação deve ser salva
>   E a caixa de seleção deve retornar ao seu estado original
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
> 
> ```gherkin
> Cenário: Tentar salvar "Não Telefonar" sem um motivo
>   Dado que o usuário selecionou "Não Telefonar"
>   Quando tenta salvar sem informar um motivo
>   Então o sistema deve exibir a mensagem "Motivo é obrigatório"
>   E não deve salvar nenhum dado
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
> 
> ```gherkin
> Cenário: Caixa de seleção "Não Telefonar" desabilitada quando fora do modo de edição
>   Dado que a seção não está no modo de edição
>   Então a caixa de seleção "Não Telefonar" deve permanecer desabilitada
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
> 
> ```gherkin
> Cenário: Selecionar e desmarcar "Não Telefonar" antes de salvar
>   Dado que o usuário selecionou "Não Telefonar"
>   Quando desmarca a opção antes de salvar
>   Então nenhuma alteração deve ser persistida
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
> 
> ```gherkin
> Cenário: Cancelar edição de "Não Telefonar" e verificar caixa desmarcada
>   Dado que o usuário iniciou a edição de "Não Telefonar"
>   Quando cancela a edição
>   Então a caixa de seleção deve aparecer desmarcada
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
> 
> ```gherkin
> Cenário: Campo "Não Telefonar" pré-marcado vindo do backend
>   Dado que o campo "Não Telefonar" vem pré-marcado do backend
>   Então ele deve aparecer marcado
>   E permitir edição
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
> 
> ```gherkin
> Cenário: Desmarcar "Não Telefonar" com motivo previamente salvo
>   Dado que "Não Telefonar" está marcado com um motivo previamente salvo
>   Quando o usuário desmarca e clica em "Salvar"
>   Então o motivo deve ser removido do banco de dados e do log
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
> 
> ```gherkin
> Cenário: Selecionar "Não Enviar SMS/Texto", fornecer um motivo e salvar
>   Dado que o usuário está na tela de atendimento
>   Quando seleciona "Não Enviar SMS/Texto" e informa um motivo
>   E clica em "Salvar"
>   Então o motivo deve ser salvo corretamente no banco de dados e no log
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
> ```gherkin
> Cenário: Cancelar edição após selecionar "Não Enviar SMS/Texto" e inserir um motivo
>   Dado que o usuário iniciou a edição de "Não Enviar SMS/Texto" e inseriu um motivo
>   Quando cancela a edição
>   Então nenhuma informação deve ser salva
>   E a caixa de seleção deve retornar ao seu estado original
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
> ```gherkin
> Cenário: Tentar salvar "Não Enviar SMS/Texto" sem um motivo
>   Dado que o usuário selecionou "Não Enviar SMS/Texto"
>   Quando tenta salvar sem informar um motivo
>   Então o sistema deve exibir a mensagem "Motivo é obrigatório"
>   E não deve salvar nenhum dado
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
> ```gherkin
> Cenário: Caixa de seleção "Não Enviar SMS/Texto" desabilitada quando fora do modo de edição
>   Dado que a seção não está no modo de edição
>   Então a caixa de seleção "Não Enviar SMS/Texto" deve permanecer desabilitada
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
> ```gherkin
> Cenário: Selecionar e desmarcar "Não Enviar SMS/Texto" antes de salvar
>   Dado que o usuário selecionou "Não Enviar SMS/Texto"
>   Quando desmarca a opção antes de salvar
>   Então nenhuma alteração deve ser persistida
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
> ```gherkin
> Cenário: Cancelar edição de "Não Enviar SMS/Texto" e verificar caixa desmarcada
>   Dado que o usuário iniciou a edição de "Não Enviar SMS/Texto"
>   Quando cancela a edição
>   Então a caixa de seleção deve aparecer desmarcada
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
> ```gherkin
> Cenário: Campo "Não Enviar SMS/Texto" pré-marcado vindo do backend
>   Dado que o campo "Não Enviar SMS/Texto" vem pré-marcado do backend
>   Então ele deve aparecer marcado
>   E permitir edição
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
> ```gherkin
> Cenário: Desmarcar "Não Enviar SMS/Texto" com motivo previamente salvo
>   Dado que "Não Enviar SMS/Texto" está marcado com um motivo previamente salvo
>   Quando o usuário desmarca e clica em "Salvar"
>   Então o motivo deve ser removido do banco de dados e do log
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
>

-----



> ## Tests in stg
> ```gherkin
> ### Scenario: Select "Do Not Email", provide a reason, and save
>  Given the user is logged into the system
>  When selects "Do Not Email" and provides a reason
>  And clicks "Save"
>  Then the reason must be correctly stored in the database
>| PASS | LeadPk 24027 / AccountPk 206396 | Merchant Progress Mobility | 
> ```
![361-stg-Enabled-_1_](/uploads/71ff4c12eabb1c56e42f4e8a26eecae8/361-stg-Enabled-_1_.png){width=729 height=87}![361-stg-Enabled-_2_](/uploads/88b5119b16c32e78362791b6e3441dde/361-stg-Enabled-_2_.png){width=129 height=39}![361-stg-Enabled-_3_](/uploads/b8c6325c01476bdb7f0421561276ad8c/361-stg-Enabled-_3_.png){width=133 height=22}![361-stg-Enabled-_4_](/uploads/ae5a579eb6c64554ddd22a5e2440f187/361-stg-Enabled-_4_.png){width=1191 height=50}![361-stg-Enabled-_5_](/uploads/460341c20bf03598d83bbe86a306630f/361-stg-Enabled-_5_.png){width=826 height=317}![361-stg-Enabled-_6_](/uploads/908e55080e27700aa47da25828b625d1/361-stg-Enabled-_6_.png){width=826 height=317}![361-stg-Enabled-_7_](/uploads/a7d681f29a74fa82cc47b371b47c8e6d/361-stg-Enabled-_7_.png){width=826 height=317}![361-stg-Enabled-_8_](/uploads/2898a21b1c058f4de6c5dd571451a3fd/361-stg-Enabled-_8_.png){width=826 height=317}![361-stg-Enabled-_9_](/uploads/34f9e1343ad9752b4dcbdaacb97fea4f/361-stg-Enabled-_9_.png){width=315 height=71}![361-stg-Enabled-_10_](/uploads/477d55f03f638b22e4799b8b76d55751/361-stg-Enabled-_10_.png){width=696 height=51}![361-stg-Enabled-_11_](/uploads/86021ccd30e914b6af81008f6aec2071/361-stg-Enabled-_11_.png){width=1117 height=42}
> 
> ```gherkin
> ###Scenario: Cancel editing after selecting "Do Not Email" and entering a reason
>  Given the user started editing "Do Not Email" and entered a reason
>  When cancels the editing
>  Then no information must be saved
>  And the checkbox must return to its original state
>| PASS | LeadPk 24027 / AccountPk 206396 | Merchant Progress Mobility | 
> ```
> 
> 
> ```gherkin
> ###Scenario: Try to save "Do Not Email" without a reason
>  Given the user selected "Do Not Email"
>  When tries to save without providing a reason
>  Then the system must display the message "Reason is required"
>  And must not save any data
>| PASS | LeadPk 24027 / AccountPk 206396 | Merchant Progress Mobility | 
> ```
> 
> 
> ```gherkin
> ###Scenario: "Do Not Email" checkbox disabled when not in edit mode
>  Given the section is not in edit mode
>  Then the "Do Not Email" checkbox must remain disabled
>| PASS | LeadPk 24027 / AccountPk 206396 | Merchant Progress Mobility | 
> ```
> 
> 
> ```gherkin
> ###Scenario: Select and unselect "Do Not Email" before saving
>  Given the user selected "Do Not Email"
>  When unselects the option before saving
>  Then no change must be persisted
>| PASS | LeadPk 24027 / AccountPk 206396 | Merchant Progress Mobility | 
> ```
> 
> 
> ```gherkin
> ###Scenario: Cancel editing of "Do Not Email" and check checkbox unchecked
>  Given the user started editing "Do Not Email"
>  When cancels the editing
>  Then the checkbox must appear unchecked
>| PASS | LeadPk 24027 / AccountPk 206396 | Merchant Progress Mobility | 
> ```
> 
> 
> ```gherkin
> ###Scenario: Unselect "Do Not Email" with previously saved reason
>  Given "Do Not Email" is checked with a previously saved reason
>  When the user unselects it and clicks "Save"
>  Then the reason must be removed from the database
>| PASS | LeadPk 24027 / AccountPk 206396 | Merchant Progress Mobility | 
> ```
> 
> 
> ```gherkin
> ###Scenario: Select "Do Not Call", provide a reason, and save
>  Given the user is on the servicing screen
>  When selects "Do Not Call" and provides a reason
>  And clicks "Save"
>  Then the reason must be correctly saved in the database and log
>| PASS | LeadPk 24027 / AccountPk 206396 | Merchant Progress Mobility | 
> ```
> 
> 
> ```gherkin
> ###Scenario: Cancel editing after selecting "Do Not Call" and entering a reason
>  Given the user started editing "Do Not Call" and entered a reason
>  When cancels the editing
>  Then no information must be saved
>  And the checkbox must return to its original state
>| PASS | LeadPk 24027 / AccountPk 206396 | Merchant Progress Mobility | 
> ```
> 
> 
> ```gherkin
> ###Scenario: Try to save "Do Not Call" without a reason
>  Given the user selected "Do Not Call"
>  When tries to save without providing a reason
>  Then the system must display the message "Reason is required"
>  And must not save any data
>| PASS | LeadPk 24027 / AccountPk 206396 | Merchant Progress Mobility | 
> ```
> 
> 
> ```gherkin
> ###Scenario: "Do Not Call" checkbox disabled when not in edit mode
>  Given the section is not in edit mode
>  Then the "Do Not Call" checkbox must remain disabled
>| PASS | LeadPk 24027 / AccountPk 206396 | Merchant Progress Mobility | 
> ```
> 
> 
> ```gherkin
> ###Scenario: Select and unselect "Do Not Call" before saving
>  Given the user selected "Do Not Call"
>  When unselects the option before saving
>  Then no change must be persisted
>| PASS | LeadPk 24027 / AccountPk 206396 | Merchant Progress Mobility | 
> ```
> 
> 
> ```gherkin
> ###Scenario: Cancel editing of "Do Not Call" and check checkbox unchecked
>  Given the user started editing "Do Not Call"
>  When cancels the editing
>  Then the checkbox must appear unchecked
>| PASS | LeadPk 24027 / AccountPk 206396 | Merchant Progress Mobility | 
> ```
> 
> 
> ```gherkin
> ###Scenario: "Do Not Call" field pre-checked coming from backend
>  Given the "Do Not Call" field is pre-checked from the backend
>  Then it must appear checked
>  And allow editing
>| PASS | LeadPk 24027 / AccountPk 206396 | Merchant Progress Mobility | 
> ```
> 
> 
> ```gherkin
> ###Scenario: Unselect "Do Not Call" with previously saved reason
>  Given "Do Not Call" is checked with a previously saved reason
>  When the user unselects it and clicks "Save"
>  Then the reason must be removed from the database and log
>| PASS | LeadPk 24027 / AccountPk 206396 | Merchant Progress Mobility | 
> ```
![361-stg-Disabled-_1_](/uploads/f8d1516c1508dc791343802eca5cc394/361-stg-Disabled-_1_.png){width=811 height=255}![361-stg-Disabled-_2_](/uploads/3a9d8a82738d35872230ca626081d1e7/361-stg-Disabled-_2_.png){width=809 height=276}![361-stg-Disabled-_3_](/uploads/b00faceded831abbbd0e794be8b088a2/361-stg-Disabled-_3_.png){width=809 height=276}![361-stg-Disabled-_4_](/uploads/4811513f8fe9dcb2790692e6e278c3e0/361-stg-Disabled-_4_.png){width=809 height=276}![361-stg-Disabled-_5_](/uploads/355bae773d4ae028555c4778cb9e4f5c/361-stg-Disabled-_5_.png){width=150 height=72}![361-stg-Disabled-_6_](/uploads/004b233bf70efcc262930fa8aba74b12/361-stg-Disabled-_6_.png){width=244 height=50}![361-stg-Disabled-_7_](/uploads/a8f0b7e16fa8fce7f4dd81a9a767ee98/361-stg-Disabled-_7_.png){width=1191 height=48}
> 
> ```gherkin
> ###Scenario: Select "Do Not Text", provide a reason, and save
>  Given the user is on the servicing screen
>  When selects "Do Not Text" and provides a reason
>  And clicks "Save"
>  Then the reason must be correctly saved in the database and log
>| PASS | LeadPk 24027 / AccountPk 206396 | Merchant Progress Mobility | 
> ```
> 
> 
> ```gherkin
> ###Scenario: Cancel editing after selecting "Do Not Text" and entering a reason
>  Given the user started editing "Do Not Text" and entered a reason
>  When cancels the editing
>  Then no information must be saved
>  And the checkbox must return to its original state
>| PASS | LeadPk 24027 / AccountPk 206396 | Merchant Progress Mobility | 
> ```
> 
> 
> ```gherkin
> ###Scenario: Try to save "Do Not Text" without a reason
>  Given the user selected "Do Not Text"
>  When tries to save without providing a reason
>  Then the system must display the message "Reason is required"
>  And must not save any data
>| PASS | LeadPk 24027 / AccountPk 206396 | Merchant Progress Mobility | 
> ```
> 
> 
> ```gherkin
> ###Scenario: "Do Not Text" checkbox disabled when not in edit mode
>  Given the section is not in edit mode
>  Then the "Do Not Text" checkbox must remain disabled
>| PASS | LeadPk 24027 / AccountPk 206396 | Merchant Progress Mobility | 
> ```
> 
> 
> ```gherkin
> ###Scenario: Select and unselect "Do Not Text" before saving
>  Given the user selected "Do Not Text"
>  When unselects the option before saving
>  Then no change must be persisted
>| PASS | LeadPk 24027 / AccountPk 206396 | Merchant Progress Mobility | 
> ```
> 
> 
> ```gherkin
> ###Scenario: Cancel editing of "Do Not Text" and check checkbox unchecked
>  Given the user started editing "Do Not Text"
>  When cancels the editing
>  Then the checkbox must appear unchecked
>| PASS | LeadPk 24027 / AccountPk 206396 | Merchant Progress Mobility | 
> ```
> 
> 
> ```gherkin
> ###Scenario: "Do Not Text" field pre-checked coming from backend
>  Given the "Do Not Text" field is pre-checked from the backend
>  Then it must appear checked
>  And allow editing
>| PASS | LeadPk 24027 / AccountPk 206396 | Merchant Progress Mobility | 
> ```
> 
> 
> ```gherkin
> ###Scenario: Unselect "Do Not Text" with previously saved reason
>  Given "Do Not Text" is checked with a previously saved reason
>  When the user unselects it and clicks "Save"
>  Then the reason must be removed from the database and log
>| PASS | LeadPk 24027 / AccountPk 206396 | Merchant Progress Mobility | 
> ```
>
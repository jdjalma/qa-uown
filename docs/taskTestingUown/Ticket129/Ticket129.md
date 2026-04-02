------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/website/-/issues/129

UOWN | Customer Portal | Require Explicit Selection of Protection Plan Before Lease Signing

We need to ensure that the customer makes an intentional selection — either "Yes" or "No" — before advancing to the next step.
Technical Requirements:
• Update the lease application workflow to enforce an explicit selection for the protection plan.
• Users must actively choose either "Yes" or "No" before being allowed to continue to the lease signing page.
• If no option is selected, the "Continue" or "Next" button should remain disabled and an inline validation message should appear (e.g., "Please select an option to proceed").
• The default value for the selection must be unset (i.e., neither "Yes" nor "No" pre-selected).

------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Portal do Cliente | Exigir Seleção Explícita do Plano de Proteção Antes da Assinatura do Contrato de Locação

Precisamos garantir que o cliente faça uma seleção intencional — seja “Sim” ou “Não” — antes de avançar para a próxima etapa.
Requisitos Técnicos:
• Atualizar o fluxo de solicitação de locação para impor uma seleção explícita do plano de proteção.
• Os usuários devem escolher ativamente “Sim” ou “Não” antes de serem autorizados a continuar para a página de assinatura do contrato.
• Se nenhuma opção for selecionada, o botão “Continuar” ou “Próximo” deverá permanecer desabilitado e deverá aparecer uma mensagem de validação inline (por exemplo, “Por favor, selecione uma opção para prosseguir”).
• O valor padrão da seleção deve estar desmarcado (isto é, nem “Sim” nem “Não” devem vir pré-selecionados).

CLiente com conexão lenta tentou avançar sem selecionar opção, visualizou mensagem informando para selecionar uma opção para prosseguir, fechou navegador. Ao retornar para assinatura mensagem informando para selecionar uma opção para prosseguir não deve ser exibida.
Cliente fecha navegador e abre novamente para continuar assinatura selecionando opção para plano de proteção
CLiente inicia assinatura, seleciona plano de proteção, fica offline e retorna para concluir processo de assinatura, opção selecionada deve se manter selecionada
Plano de proteção deve ser exibido sem opção selecionada para o cliente
Se nenhuma opção for selecionada, o botão “Continuar” ou “Próximo” deverá permanecer desabilitado e deverá aparecer uma mensagem de validação inline (por exemplo, “Por favor, selecione uma opção para prosseguir”).

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Objetivo:
Garantir que o cliente faça uma seleção explícita entre “Sim” ou “Não” antes de continuar para a próxima etapa no processo de assinatura de locação. 
O botão de continuar (ou próximo) deve ficar desabilitado até que o usuário selecione uma das opções. 
Caso nenhuma opção seja escolhida, uma mensagem de validação deverá ser exibida, informando ao cliente para selecionar uma opção.

Requisitos Técnicos:
A seleção do plano de proteção deve ser feita de forma intencional, com as opções “Sim” e “Não” visíveis.
Caso o cliente não selecione nenhuma opção, o botão “Continuar” ou “Próximo” deve ficar desabilitado.
Se o cliente tentar avançar sem selecionar uma opção, uma mensagem de validação será exibida.
Se o cliente fechar o navegador e retornar à página de assinatura, a seleção feita previamente deve ser preservada.


Cenários de Teste Gherkin

Cenário 1 – Verificar se o botão de “Continuar” está desabilitado quando nenhuma opção for selecionada
Cenário: Verificar se o botão de “Continuar” está desabilitado quando nenhuma opção for selecionada
  Dado que o cliente acessa a página de solicitação de locação
  E nenhuma opção de plano de proteção ("Sim" ou "Não") foi selecionada
  Quando o cliente tenta avançar para a próxima etapa
  Então o botão “Continuar” deve estar desabilitado
  E uma mensagem de validação deve ser exibida informando “Please make a selection”
Explicação:
Este cenário testa o comportamento do sistema quando o cliente não seleciona nenhuma opção. O botão de "Continuar" deve permanecer desabilitado e uma mensagem de validação deverá ser exibida.
Resultado Esperado:
O botão “Continuar” ficará desabilitado.
A mensagem de validação será exibida solicitando que o cliente selecione uma opção.
Frase de Verificação:
Verifique se, ao não selecionar nenhuma opção de plano de proteção, o botão "Continuar" fica desabilitado e a mensagem de validação é exibida.

-----

Cenário 2 – Verificar se o botão de “Continuar” é habilitado após selecionar “Sim” ou “Não”
Cenário: Verificar se o botão de “Continuar” é habilitado após selecionar “Sim” ou “Não”
  Dado que o cliente acessa a página de solicitação de locação
  E o cliente seleciona a opção "Sim" ou "Não" para o plano de proteção
  Quando o cliente seleciona uma opção
  Então o botão “Continuar” deve ser habilitado
  E a mensagem de validação não deve ser exibida
Explicação:
Este cenário valida que, ao selecionar uma das opções, o botão “Continuar” deve ser habilitado e a mensagem de validação deve desaparecer.
Resultado Esperado:
O botão “Continuar” será habilitado.
A mensagem de validação desaparecerá.
Frase de Verificação:
Verifique se, ao selecionar uma das opções de plano de proteção, o botão "Continuar" é habilitado e a mensagem de validação desaparece.

-----

Cenário 3 – Verificar se a seleção de plano de proteção é preservada após o cliente fechar o navegador
Cenário: Verificar se a seleção de plano de proteção é preservada após o cliente fechar o navegador
  Dado que o cliente acessa a página de solicitação de locação
  E o cliente seleciona a opção "Sim" ou "Não" para o plano de proteção
  Quando o cliente fecha o navegador
  E o cliente retorna à página de solicitação de locação
  Então a opção selecionada deve ser preservada
  E a seleção deve estar visível ao cliente
Explicação:
Este cenário valida que a seleção do plano de proteção feita pelo cliente é mantida ao retornar à página de solicitação de locação após o navegador ser fechado.
Resultado Esperado:
A opção selecionada será preservada e visível ao cliente.
Frase de Verificação:
Verifique se, ao retornar à página de solicitação de locação após fechar o navegador, a opção de plano de proteção previamente selecionada é preservada.

-----

Cenário 4 – Verificar se a opção selecionada permanece quando o cliente fica offline e volta para concluir a assinatura
Cenário: Verificar se a opção selecionada permanece quando o cliente fica offline e volta para concluir a assinatura
  Dado que o cliente acessa a página de solicitação de locação
  E o cliente seleciona uma opção de plano de proteção
  E o cliente fica offline
  Quando o cliente volta para concluir a assinatura
  Então a opção selecionada deve permanecer selecionada
Explicação:
Este cenário valida que a opção de plano de proteção escolhida pelo cliente deve ser mantida quando o cliente ficar offline e retornar para continuar o processo de assinatura.
Resultado Esperado:
A opção selecionada será mantida após o cliente voltar à página para concluir a assinatura.
Frase de Verificação:
Verifique se, ao voltar para concluir a assinatura após ficar offline, a opção de plano de proteção selecionada anteriormente permanece selecionada.

-----

Entao se a tarefa pede para quando o cliente acessar o portal antes de assinar o contrato exibir as opcoes de adesao, e agora so pode acessar se tiver uma conta naquele status provavel que seja um cliente com um contrato quitado e esta fazendo outro lease

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa2

| Test Case | Test Data | Status |
| ------ | ------ | ------ |
| Verify that, as long as no protection plan option is selected, the “Continue” button remains disabled and, even after selecting a plan, the message stating that choosing a plan is mandatory stays displayed |  | PASS |
| Verify that when a protection plan option is selected, the “Continue” button is enabled, and that the message indicating that selecting a plan is mandatory continues to be displayed |  | PASS |

-----

Verifique se, enquanto nenhuma opção de adesão ao plano de proteção for selecionada, o botão “Continuar” permanece desabilitado e, mesmo após escolher um plano, a mensagem informando a obrigatoriedade da escolha continua visível
Verify that, as long as no protection plan option is selected, the “Continue” button remains disabled and, even after selecting a option, the message stating that choosing a plan is mandatory stays displayed

Verifique se, ao selecionar opção de plano de proteção, o botão “Continuar” é habilitado e, mesmo após selecionar o plano, a mensagem informando que a escolha de um plano é obrigatória continua sendo exibida
Verify that when a protection plan option is selected, the “Continue” button is enabled, and that the message indicating that selecting a plan is mandatory continues to be displayed

Verificar inclusão do cenário 3 e 4
Verifique se, ao retornar à página de solicitação de locação após fechar o navegador, a opção de plano de proteção previamente selecionada é preservada
Verify that when returning to the rental request page after closing the browser, the previously selected protection plan option is still preserved

Verifique se, ao voltar para concluir a assinatura após ficar offline, a opção de plano de proteção selecionada anteriormente permanece selecionada
Verify that when coming back online to complete the subscription after going offline, the previously selected protection plan option remains selected

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa2

| Test Case | Test Data | Status |
| ------ | ------ | ------ |
| Verify that, as long as no protection plan option is selected, the “Continue” button remains disabled and, even after selecting a plan, the message stating that choosing a plan is mandatory stays displayed | ![qa2-129-c1_1_](/uploads/f1612373129527cf2292768af176e1c5/qa2-129-c1_1_.png){width=1435 height=744}![qa2-129-c1_2_](/uploads/dd38b0de2c975cacf452799b70bf1ce6/qa2-129-c1_2_.png){width=1430 height=741} | PASS |
| Verify that when a protection plan option is selected, the “Continue” button is enabled, and that the message indicating that selecting a plan is mandatory continues to be displayed | ![qa2-129-c2_1_](/uploads/3256cbbbbda36e798739972b5d19ba14/qa2-129-c2_1_.png){width=301 height=647}![qa2-129-c2_2_](/uploads/c5f4475156d6e32ab8e259b44ebd410e/qa2-129-c2_2_.png){width=993 height=647}![qa2-129-c2_3_](/uploads/fd8bd1ec4a409d6955c874c4566d654b/qa2-129-c2_3_.png){width=1175 height=647}![qa2-129-c2_4_](/uploads/cc435d01ac2ddfe03671963cda29c283/qa2-129-c2_4_.png){width=1175 height=647}![qa2-129-c2_5_](/uploads/5a6ff650c4afe831b2c88aa277c82f8d/qa2-129-c2_5_.png){width=1175 height=647}![qa2-129-c2_6_](/uploads/5b6bd1fba9d0d62ab5f12990c57cc6bd/qa2-129-c2_6_.png){width=1175 height=647}![qa2-129-c2_7_](/uploads/eca798b0646bc1fb3b84bfe3ffe7b1e1/qa2-129-c2_7_.png){width=1175 height=647} | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa2

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in stg

| Test Case | Test Data | Status |
| ------ | ------ | ------ |
| Verify that, as long as no protection plan option is selected, the “Continue” button remains disabled and, even after selecting a plan, the message stating that choosing a plan is mandatory stays displayed |  | PASS |
| Verify that when a protection plan option is selected, the “Continue” button is enabled, and that the message indicating that selecting a plan is mandatory continues to be displayed |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in stg

------------------------------------------------------------------------------------------------------------------------------------------------------------------

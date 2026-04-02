----------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1062

UOWN | Origination | Fixes on Terms/Protection Plan Buttons and Session Persistence in Sentry

BUG
Three incorrect behaviors were identified related to the interface and monitoring:      
* Terms of Agreement: The action button was being rendered outside the main card on the page, whereas the expected behavior is for it to be inside the card.      
* Protection Plan: The button on this page is being disabled until there is user interaction. However, the expected behavior is that the button remains enabled, but if clicked without prior interaction, it should display an alert, similarly to how it currently works on the Terms of Agreement page.      
* Sentry (sentry.io): Session recordings are being interrupted after the page reloads. The correct behavior is that recordings should not be interrupted just because of a page reload.

FIX
* Terms of Agreement: Fix the button positioning to ensure it is rendered inside the corresponding card.      
* Protection Plan: Adjust the button logic so that it remains always enabled. When clicked without prior interaction, it should display an informational alert — following the same visual and functional pattern as the Terms of Agreement page.      
* Sentry: Investigate on Sentry for adjustments so that session recordings persist even after page reloads, ensuring continuous tracking of sessions and bugs.

-----

UOWN | Originação | Correções nos Botões de Termos/Plano de Proteção e Persistência de Sessão no Sentry

BUG
Foram identificados três comportamentos incorretos relacionados à interface e monitoramento:
* Termos de Acordo: O botão de ação estava sendo renderizado fora do cartão principal na página, enquanto o comportamento esperado é que ele esteja dentro do cartão.
* Plano de Proteção: O botão nesta página está desabilitado até que haja interação do usuário. No entanto, o comportamento esperado é que o botão permaneça habilitado, mas, se clicado sem interação prévia, deve exibir um alerta, semelhante ao funcionamento atual na página de Termos de Acordo.
* Sentry (sentry.io): As gravações de sessão estão sendo interrompidas após o recarregamento da página. O comportamento correto é que as gravações não sejam interrompidas apenas por causa de um recarregamento.

CORREÇÃO
* Termos de Acordo: Corrigir o posicionamento do botão para garantir que seja renderizado dentro do cartão correspondente.
* Plano de Proteção: Ajustar a lógica do botão para que permaneça sempre habilitado. Ao ser clicado sem interação prévia, deve exibir um alerta informativo, seguindo o mesmo padrão visual e funcional da página de Termos de Acordo.
* Sentry: Investigar no Sentry ajustes para que as gravações de sessão persistam mesmo após recarregamentos da página, garantindo rastreamento contínuo de sessões e erros.

----------------------------------------------------------------------------------------------------------------------------------------

* Termos de Acordo: Corrigir o posicionamento do botão para garantir que seja renderizado dentro do cartão correspondente.
  Agreement Terms: Fix the button positioning to ensure it is rendered within the corresponding card.
  --> Verificar o posicionamento do botão para garantir que seja renderizado dentro do container de termos do acordo
  --> Check the button placement to ensure it is rendered within the agreement terms container
    O botão está dentro do container dos termos do acordo em contratos assinados via portal ou IFrame
    The button is inside the agreement terms container in contracts signed via portal or IFrame  
* Plano de Proteção: Ajustar a lógica do botão para que permaneça sempre habilitado. Ao ser clicado sem interação prévia, deve exibir um alerta informativo, seguindo o mesmo padrão visual e funcional da página de Termos de Acordo.
  Protection Plan: Adjust the button logic so that it remains always enabled. If clicked without prior interaction, it should display an informational alert, following the same visual and functional pattern as the Agreement Terms page.
  --> Verificar se ao tentar prosseguir sem selecionar adesão ao plano de proteção, é exibido um alerta solicitando que o usuário opte por aderir ou não para continuar.
  --> When attempting to proceed without selecting the protection plan, an alert prompts the user to opt in or out to continue.
    Para contratos assinados via IFrame ou completeApplication, um aviso solicita que os usuários optem por participar ou não do plano de proteção para prosseguir. No entanto, as opções não selecionadas não são destacadas. Uma sugestão é mover o cursor e o foco para as opções de opt-in. Em dispositivos móveis, o prompt sobrepõe o botão "Continuar", exigindo que os usuários o fechem primeiro (um clique extra). No desktop, ele aparece no canto inferior direito e permanece visível após a conclusão do processo. Uma sugestão é fechá-lo automaticamente ao prosseguir.
        Em dispositivos moveis, outra sugestão é manter o botão "Continuar" fixo na tela, isso garante que, assim que o cliente fizer uma escolha (opt-in ou opt-out), o botão já esteja visível para que ele possa seguir imediatamente, sem rolar ou realizar cliques extras
    For contracts signed via IFrame or completeApplication, a prompt asks users to opt in or out of the protection plan in order to proceed. However, unselected options are not highlighted. One suggestion is to move the cursor and focus to the opt-in options. On mobile devices, the prompt overlays the “Continue” button, requiring users to close it first (an extra click). On desktop, it appears in the bottom right corner and remains visible after the process is complete. One suggestion is to have it automatically close when proceeding.
        On mobile devices, another suggestion is to keep the “Continue” button fixed to the screen, this ensures that as soon as the customer makes a choice (opt-in or opt-out), the button is already visible so that they can proceed immediately, without scrolling or making extra clicks.
* Sentry: Investigar no Sentry ajustes para que as gravações de sessão persistam mesmo após recarregamentos da página, garantindo rastreamento contínuo de sessões e erros.
  Sentry: Investigate adjustments in Sentry to ensure session recordings persist even after page reloads, guaranteeing continuous tracking of sessions and errors.
  --> Verificar se o recarregamento da página não gera novas gravações, no lease e portal Sentry, e se uma nova gravação é criada ao fechar e reabrir uma aba/janela com o endereço carregado.
  --> Check that reloading the page does not generate new recordings, in the lease and Sentry portal, and that a new recording is created when closing and reopening a tab/window with the loaded address.
    Ao assinar via completeApplication, uma nova gravação é gerada somente ao fechar e reabrir a aba/janela com a URL recarregada, mas não ao recarregar a página ou reabrir a aba com Ctrl+Shift+T, conforme esperado. Esse comportamento foi validado nas etapas de dados pessoais CC/ACH, termos de consentimento, plano de proteção e assinatura do contrato. Durante verificação de identidade (Intellicheck ou Seon), uma gravação é criada no lease, mas não no Sentry, retornando "gravação não encontrada" ao tentar acessá-la. Assinaturas via portal de parceiro (IFrame) não geram gravação no lease, não foi verificadoa se a gravação foi gerada no Sentry, pois o processo ocorre em sandbox. Gravações de assinaturas via IFrame devem gerar gravações no lease e no portal Sentry.
    When signing via completeApplication, a new recording is generated only when closing and reopening the tab/window with the reloaded URL, but not when reloading the page or reopening the tab with Ctrl+Shift+T, as expected. This behavior was validated in the steps for personal data CC/ACH, consent terms, protection plan and contract signing. During identity verification (Intellicheck or Seon), a recording is created in the lease, but not in Sentry, returning "record not found" when trying to access it. Signatures via the partner portal (IFrame) do not generate a recording in the lease, it was not verified whether the recording was generated in Sentry, as the process occurs in a sandbox. Signature recordings via IFrame should generate recordings in the lease and in the Sentry portal.

quando para o processo e continua é incrementado na gravacao
em cc/ach quando recarrega a pagina nao gera outra gravacao
em cc/ach quando fecha a aba e reabre a ultima aba usando ctrl+shift+t não gera outra gravacao
em cc/ach quando fecha a aba e reabre gera outra gravacao
nos termos e condições ao recarregar a pagina não gera outra gravacao
nos termos e condições ao fechar e abrir nova aba gera outra gravacao
no plano de proteção ao recarregar a pagina não gera outra gravacao
no plano de proteção ao fechar e abrir nova aba gera outra gravacao
na assinatura ao recarregar a pagina não gera outra gravacao
na assinatura ao fechar e abrir nova aba gera outra gravacao


Check the button placement to ensure it is rendered within the agreement terms container
When attempting to proceed without selecting the protection plan, an alert prompts the user to opt in or out to continue
Check that reloading the page does not generate new recordings, in the lease and Sentry portal, and that a new recording is created when closing and reopening a tab/window with the loaded address

Tests in qa2

| Test Case | Test Data | Status | Observation |
| ------ | ------ | ------ | ------ |
| Check the button placement to ensure it is rendered within the agreement terms container |  | PASS |  |
| When attempting to proceed without selecting the protection plan, an alert prompts the user to opt in or out to continue |  | PASS | For contracts signed via IFrame or completeApplication, a prompt asks users to opt in or out of the protection plan in order to proceed. However, unselected options are not highlighted. One suggestion is to move the cursor and focus to the opt-in options. On mobile devices, the prompt overlays the “Continue” button, requiring users to close it first (an extra click). On desktop, it appears in the bottom right corner and remains visible after the process is complete. One suggestion is to have it automatically close when proceeding. On mobile devices, another suggestion is to keep the “Continue” button fixed to the screen, this ensures that as soon as the customer makes a choice (opt-in or opt-out), the button is already visible so that they can proceed immediately, without scrolling or making extra clicks  |
| Check that reloading the page does not generate new recordings, in the lease and Sentry portal, and that a new recording is created when closing and reopening a tab/window with the loaded address |  | ERROR | When signing via completeApplication, a new recording is generated only when closing and reopening the tab/window with the reloaded URL, but not when reloading the page or reopening the tab with Ctrl+Shift+T, as expected. This behavior was validated in the steps for personal data CC/ACH, consent terms, protection plan and contract signing. During identity verification (Intellicheck or Seon), a recording is created in the lease, but not in Sentry, returning "record not found" when trying to access it. Signatures via the partner portal (IFrame) do not generate a recording in the lease, it was not verified whether the recording was generated in Sentry, as the process occurs in a sandbox. Signature recordings via IFrame should generate recordings in the lease and in the Sentry portal. |
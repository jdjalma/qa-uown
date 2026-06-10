----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1058

UOWN | Origination | Seon SDK Update

Synopsis
A new version of the Seon SDK, used for fraud prevention, has been released. To ensure compatibility and proper functioning of the application, the SDK must be updated, configuration changes (if any) reviewed, and the entire integration flow tested.

Business Objective
Ensure the application uses the latest version of the Seon SDK, taking advantage of security and performance improvements while keeping the integration functional and up to date.

Feature Request | Business Requirements
* Update the Seon SDK to the latest available version
* Check for any changes in configuration requirements introduced by the new SDK (e.g., required parameters, endpoints, headers)
* Adjust system code and configuration as needed for compatibility with the updated SDK
* Test the full Seon integration flow to ensure fraud checks are working as expected.

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
Testes

Em vários testes, mesmo utilizando documentos válidos, a resposta do sistema permaneceu em “reviewed” e não consegui obter uma aprovação direta.
Em outro cenário, cadastrei meus próprios dados, mas na etapa de verificação utilizei o documento de outra pessoa. Mesmo assim, o sistema aprovou a verificação normalmente, sem bloquear ou alertar sobre a diferença entre os dados do cadastro e os dados do documento.
Percebi também que, quando ocorre uma rejeição e o sistema solicita uma nova tentativa, a tela não é recarregada automaticamente e aparece em branco. Apenas ao atualizar manualmente, o componente de verificação de identidade volta a ser exibido.
Por fim, notei que o componente de leitura facial é bastante sensível, o que acaba dificultando um pouco o reconhecimento da face.

* In several tests, even when using valid documents, the system response remained in "reviewed" status and I was unable to get a direct approval.
* In another scenario, I registered with my own personal information but, during the verification step, I used someone else’s document. Still, the system approved the verification without blocking or warning about the mismatch between the registration data and the document data.
* I also noticed that when a rejection occurs and the system asks to try again, the screen does not automatically reload and displays as blank. Only after manually refreshing the page does the identity verification component appear again.
* The facial recognition component is quite sensitive, which makes it a bit difficult to complete the face reading successfully.

-----

@fernandogmartins On mobile devices, after a rejection, the Seon component is not automatically displayed, showing a blank page; upon reloading, the component appears. In cases of rejection, we should automatically redirect the customer when trying again.
![qa2-1058-c3-NaoPassouVerificacaoIdentidadeTelaexibeBrancoExibeSeonSeCarregarNovamente_1_](/uploads/471ae262a5bb82bf569338035b1864ca/qa2-1058-c3-NaoPassouVerificacaoIdentidadeTelaexibeBrancoExibeSeonSeCarregarNovamente_1_.png){width=1438 height=771}![qa2-1058-c3-NaoPassouVerificacaoIdentidadeTelaexibeBrancoExibeSeonSeCarregarNovamente_2_](/uploads/81a6f065a99772fbc2726db78df71641/qa2-1058-c3-NaoPassouVerificacaoIdentidadeTelaexibeBrancoExibeSeonSeCarregarNovamente_2_.jpg)![qa2-1058-c3-NaoPassouVerificacaoIdentidadeTelaexibeBrancoExibeSeonSeCarregarNovamente_3_](/uploads/6b632d0db85ec2ee02585405995ee848/qa2-1058-c3-NaoPassouVerificacaoIdentidadeTelaexibeBrancoExibeSeonSeCarregarNovamente_3_.jpg) When incorrect name or date of birth is entered, the block occurs in completeApplication during the CC/ACH step :white_check_mark:

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tarefa retornou e voltou para testes

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Fernando Martins @fernandogmartins

Testing Steps for Update Seon SDK - Fix Blank Screen Issue
Verify that the following issues no longer occur:
* The retry modal does not appear when a failure or cancellation happens.
* The user gets stuck on a blank screen after completing the Seon verification.

Testing Steps For Fix Seon Name Comparison
Previously, the internal name validation would incorrectly reject names with special characters. 
For example, if the application name was "Jose" and the document name was "José", the validation would fail. 
This issue has now been resolved.
Additionally, the Seon name verification logic has been updated to validate first and last names separately, 
instead of using the full name. When a mismatch occurs, the error message will now specify whether the issue is with the first name or the last name. 
For example:
Tue- 06/17/2025 8:02:23 a.m. EST      INTERNAL      MerchantPortal-fmartins.gow      Failed to verify identification for lead pk 676: [lastName]: expected one of [Martinez] but not found in document name "Férnando Goncalves Martins";

Testing Steps for Fix Provider Selection in Internal Validation
Previously, the backend determined which provider to use (Seon or Intellicheck) based only on the presence of a referenceId in the request. If the referenceId was present, it proceeded with Seon; if not, it defaulted to Intellicheck.
This logic caused issues in some edge cases where the referenceId was missing—not because Seon wasn’t used, but because the data had been lost from the frontend’s sessionStorage.
For example, a user might complete both the Seon verification and the internal validation, meaning both the success and idVerifySuccess columns were marked as true. In this state, Seon would not be started again, and no new referenceId would be generated. If the user did not sign the contract immediately and later returned to complete it, the original referenceId—which was only stored in sessionStorage—may have been lost. As a result, the frontend would no longer send the referenceId to the backend, and the backend would incorrectly assume that it should proceed with Intellicheck.
To prevent this, the logic now checks for the presence of saved records in the database before choosing a provider. The updated behavior is as follows:
If a referenceId is provided:
* And a Seon record exists → proceed with Seon.
* If no Seon record exists but an Intellicheck record does → proceed with Intellicheck and log this fallback
* If no record exists for either provider → do not proceed and log the failure
If a referenceId is not provided:
* And an Intellicheck record exists → proceed with Intellicheck
* If only a Seon record exists → proceed with Seon and log that Seon was used despite no referenceId
* If no record exists for either provider → do not proceed and log the failure.

-----

Fernando Martins @fernandogmartins
Passos de Teste para Atualização do Seon SDK - Correção do Problema de Tela em Branco

Verifique se os seguintes problemas não ocorrem mais:
* O modal de repetição não aparece quando ocorre uma falha ou cancelamento.
* O usuário fica preso em uma tela em branco após completar a verificação Seon.

Passos de Teste para Correção da Comparação de Nome no Seon
Anteriormente, a validação interna de nomes rejeitava incorretamente nomes com caracteres especiais.
* Por exemplo, se o nome do aplicativo fosse "Jose" e o nome do documento fosse "José", a validação falhava.
Esse problema agora foi resolvido.
Além disso, a lógica de verificação de nomes do Seon foi atualizada para validar primeiro nome e sobrenome separadamente, em vez de usar o nome completo. 
* Quando houver uma divergência, a mensagem de erro agora especificará se o problema é com o primeiro nome ou com o sobrenome.
Por exemplo:
Ter- 17/06/2025 8:02:23 a.m. EST INTERNAL MerchantPortal-fmartins.gow Falha ao verificar identificação para lead pk 676: [lastName]: esperado um dos [Martinez] mas não encontrado no nome do documento "Férnando Goncalves Martins";

Passos de Teste para Correção da Seleção do Provedor na Validação Interna
Anteriormente, o backend determinava qual provedor usar (Seon ou Intellicheck) com base apenas na presença de um referenceId na requisição. Se o referenceId estivesse presente, o processo seguia com o Seon; caso contrário, o padrão era Intellicheck.
Essa lógica causava problemas em alguns casos extremos, em que o referenceId estava ausente — não porque o Seon não foi usado, mas porque os dados foram perdidos no sessionStorage do frontend.
Por exemplo, um usuário poderia completar tanto a verificação Seon quanto a validação interna, o que significaria que ambas as colunas success e idVerifySuccess estavam marcadas como true. Nessa situação, o Seon não seria iniciado novamente e nenhum novo referenceId seria gerado. Se o usuário não assinasse o contrato imediatamente e retornasse mais tarde para concluí-lo, o referenceId original — que era armazenado apenas no sessionStorage — poderia ter sido perdido. Como resultado, o frontend não enviaria mais o referenceId para o backend, e o backend assumiria incorretamente que deveria continuar com o Intellicheck.
Para evitar isso, a lógica agora verifica a presença de registros salvos no banco de dados antes de escolher um provedor. O comportamento atualizado é o seguinte:
* Se um referenceId for fornecido:
    E existir um registro Seon → prossiga com o Seon.
* Se não existir um registro Seon, mas existir um registro Intellicheck → prossiga com o Intellicheck e registre esse fallback
* Se não existir registro para nenhum provedor → não prossiga e registre a falha
* Se um referenceId não for fornecido:
    E existir um registro Intellicheck → prossiga com o Intellicheck
* Se existir apenas um registro Seon → prossiga com o Seon e registre que o Seon foi usado mesmo sem referenceId
* Se não existir registro para nenhum provedor → não prossiga e registre a falha.

-----

mobile
documento digital

mobile
documento fisico

computador com camera
documento digital

computador com camera
documento fisico

computador sem camera
documento digital

computador sem camera
documento fisico

------

Os processos Seon e Intellicheck estão funcionando conforme esperado. Em alguns testes, a captura incorreta do nome no documento resultou em rejeição, mas o Seon indicou que o documento era inválido. O modal de repetição é exibido orientando a tentar novamente em caso de falha na verificação. Quando o status é "review", uma mensagem informa que os documentos foram enviados para inspeção posterior, permitindo prosseguir com as próximas etapas. As validações de nome e data de nascimento estão operando corretamente para Seon e Intellicheck. Se houver rejeição em completeApplication devido a nome ou data de nascimento incorretos no Lease, corrigir os dados resulta em validação bem-sucedida.
Seon and Intellicheck processes are working as expected. In some tests, incorrect name capture from the document led to rejection, but Seon indicated the document was invalid. The retry modal appears, prompting a retry upon verification failure. When the status is "review," a message indicates documents were sent for further inspection, allowing progression to the next steps. Name and birth date validations are functioning correctly for Seon and Intellicheck. If completeApplication rejects due to incorrect name or birth date in the Lease, correcting the data results in successful validation.

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
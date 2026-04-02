----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1057

UOWN | Origination | Investigate Application Flow Issues TireBros

BUG
A partner (TireBros) reported that some customers are unable to proceed during the application process, suspecting that a recent change might be blocking progress.

FIX
* Investigate the application flow, focusing particularly on:
* What happens when a card is rejected (e.g. authorization failure, validation error, etc.).
* If there's any recent change in the backend logic that could be impacting users at this step.
* Any inconsistencies or exceptions occurring on the Terms of Agreement page.
* Cross-check the backend for conditions or logic that could be causing application flow interruptions.
* Review and improve error messages displayed during card issues or process halts to ensure they are clear, user-friendly, and informative.
* If a fix is identified, prepare it for inclusion in the next release and coordinate testing scenarios that simulate the issue using different card types and flows.

Priyanka Namburu @pnamburu
@jose.mendesdev You can reproduce this error on sandbox by using a bad card on the CC/ACH page.
Should be fixed on qa2

Reproduced on sandbox using this card : 4000300911112221

Same card on Staging

-----

UOWN | Originação | Investigar Problemas no Fluxo de Aplicação TireBros

BUG
Um parceiro (TireBros) relatou que alguns clientes não conseguem prosseguir durante o processo de aplicação, suspeitando que uma alteração recente pode estar bloqueando o progresso.

CORREÇÃO
Investigar o fluxo de aplicação, com foco especial em:
O que acontece quando um cartão é rejeitado (por exemplo, falha de autorização, erro de validação, etc.).
Se há alguma alteração recente na lógica do backend que possa estar impactando os usuários nesta etapa.
Quaisquer inconsistências ou exceções que ocorram na página de Termos de Acordo.
Verificar no backend condições ou lógicas que possam estar causando interrupções no fluxo de aplicação.
Revisar e melhorar as mensagens de erro exibidas durante problemas com cartões ou paradas no processo, garantindo que sejam claras, amigáveis ao usuário e informativas.
Se uma correção for identificada, prepará-la para inclusão na próxima versão e coordenar cenários de teste que simulem o problema usando diferentes tipos de cartões e fluxos.

Priyanka Namburu @pnamburu
@jose.mendesdev Você pode reproduzir esse erro no ambiente sandbox usando um cartão inválido na página de CC/ACH.

Deveria estar corrigido no ambiente qa2.

Reproduzido no sandbox usando este cartão: 4000300911112221

Mesmo cartão no ambiente de Staging

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

4000300911112221

4000300211112228
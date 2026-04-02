------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1024

------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Origination | Protection Plan Terms of Agreement IFrame Error

BUG
When the customer is finalizing the lease and clicks on "See Protection Benefits", 
the Buddy IFrame in the Protection Plan subscription section fails to load.
As a result, the customer has no other option but to proceed by clicking the "Proceed to Signature" button. 
However, when this button is clicked, a request is sent to the backend — but since nothing seems to happen, 
the customer ends up clicking the button multiple times, causing several duplicate requests to be sent.

FIX
The first action to take is to disable the PROCEED TO SIGNATURE button after the first click.

-----

UOWN | Origination | Erro de IFrame nos Termos de Acordo do Plano de Proteção
BUG
Quando o cliente está finalizando o contrato de locação e clica em "Ver Benefícios de Proteção",
o IFrame do Buddy na seção de assinatura do Plano de Proteção não carrega.
Como resultado, o cliente não tem outra opção além de prosseguir clicando no botão "Prosseguir para Assinatura".
No entanto, quando este botão é clicado, uma solicitação é enviada ao backend — mas como nada parece acontecer,
o cliente acaba clicando no botão várias vezes, causando o envio de várias solicitações duplicadas.
CORREÇÃO
A primeira ação a ser tomada é desabilitar o botão PROSSEGUIR PARA ASSINATURA após o primeiro clique.

cenários para lentidao
sem conexao
fechar o navegador depois de clicar para gerar o contrato, continuar processo clicando novamente no link do contrato
qualquer outro tipo de cenário que possa atrapalhar o cliente a terminar o processo ou que possa causar lentidao pra tela carregar
------------------------------------------------------------------------------------------------------------------------------------------------------------------

📋 Requisito da Tarefa
Corrigir o erro de IFrame nos Termos de Acordo do Plano de Proteção, onde o IFrame do Buddy na seção de assinatura 
não carrega quando o cliente clica em "Ver Benefícios de Proteção". Além disso, desabilitar o botão "Prosseguir para Assinatura" 
após o primeiro clique para evitar múltiplas solicitações duplicadas. Também será necessário validar o comportamento do sistema em cenários de lentidão 
e falha de conexão, assegurando que o processo seja concluído corretamente ou que o usuário tenha uma experiência adequada.

🧪 Cenários de Teste Gherkin

Scenario 1 Verificar se o botão "Prosseguir para Assinatura" é desabilitado após o primeiro clique

Scenario: 1 - Verificar se o botão "Prosseguir para Assinatura" é desabilitado após o primeiro clique
  Given que o cliente está na seção de assinatura do Plano de Proteção
  When o cliente clica no botão "Ver Benefícios de Proteção"
  And o IFrame do Buddy carrega corretamente
  Then o botão "Prosseguir para Assinatura" deve ser desabilitado após o primeiro clique

🔍 Verifique se, ao clicar no botão "Prosseguir para Assinatura", o botão é desabilitado após o primeiro clique, impedindo múltiplos cliques.
📝 Explicação: Este cenário valida se a correção do botão está sendo aplicada corretamente, evitando múltiplas solicitações duplicadas.
✅ Resultado Esperado: O botão "Prosseguir para Assinatura" deve ser desabilitado após o primeiro clique.

-----

Scenario 2 Verificar o comportamento do botão "Prosseguir para Assinatura" quando o IFrame não carrega

Scenario: 2 - Verificar o comportamento do botão "Prosseguir para Assinatura" quando o IFrame não carrega
  Given que o cliente está na seção de assinatura do Plano de Proteção
  And o IFrame do Buddy não carrega corretamente
  When o cliente clica no botão "Prosseguir para Assinatura"
  Then o sistema não deve enviar solicitações duplicadas
  And verifique nos logs que a solicitação foi feita apenas uma vez

🔍 Verifique se o botão "Prosseguir para Assinatura" não envia solicitações duplicadas caso o IFrame não carregue corretamente.
📝 Explicação: Este cenário valida que o sistema não gera solicitações duplicadas quando o IFrame não carrega corretamente.
✅ Resultado Esperado: O sistema envia apenas uma solicitação, mesmo que o cliente clique no botão várias vezes.

-----

Scenario 3  Verifique se a tela de assinatura do contrato carrega corretamente mesmo com lentidão na rede.

Scenario: 3 - Testar prevenção de múltiplos cliques com lentidão na rede
    Given que o cliente clica no botão "Prosseguir para Assinatura"
    And há lentidão na rede que retarda a resposta
    When o sistema processa a solicitação
    Then o botão "Prosseguir para Assinatura" deve ser desabilitado imediatamente após o primeiro clique
    And permanecer desabilitado enquanto a solicitação é processada

🔍 Verifique se a tela de assinatura do contrato carrega corretamente mesmo com lentidão na rede.
📝 Explicação: Este cenário valida o comportamento do sistema em condições de lentidão de rede, garantindo que o contrato ainda seja carregado.
✅ Resultado Esperado: A tela de assinatura do contrato deve carregar corretamente, mesmo com a lentidão.

-----

Scenario 4 - Testar prevenção de requisições duplicadas do plano de proteção após fechamento do navegador

Scenario: 4 - Testar prevenção de requisições duplicadas do plano de proteção após fechamento do navegador
Given que o cliente clica no botão "Prosseguir para Assinatura" uma única vez
And fecha o navegador antes da conclusão do processo devido à lentidão da internet
When o cliente reabre o navegador e acessa novamente a página de contrato
Then o sistema deve identificar que uma requisição já foi enviada
And não permitir o envio de uma nova requisição para o plano de proteção

🔍 Verifique se apenas uma requisição para o plano de proteção é enviada, mesmo quando o cliente fecha e reabre o navegador devido a problemas de conexão.
📝 Explicação: Este cenário valida que o sistema mantém o registro da requisição original do plano de proteção, evitando duplicações quando o cliente interrompe o fluxo por problemas de conexão.
✅ Resultado Esperado: O sistema deve reconhecer que a solicitação já foi processada e não permitir uma segunda submissão do mesmo plano de proteção.

-----

Scenario 5 - Prevenir múltiplos cliques no plano de proteção durante perda de conexão

Scenario: 5 - Prevenir múltiplos cliques no plano de proteção durante perda de conexão
Given que o cliente está na página de contratação do plano de proteção
And o cliente perde a conexão com a internet
When o cliente clica no botão "Prosseguir para Assinatura"
Then o sistema deve detectar a falta de conexão
And exibir uma mensagem de erro informando que a conexão é necessária
And desabilitar o botão "Prosseguir para Assinatura" para prevenir múltiplos cliques
And impedir o envio de múltiplas requisições quando a conexão for restabelecida

🔍 Verifique se o sistema previne múltiplos cliques no plano de proteção quando há perda de conexão, evitando a geração de planos duplicados.
📝 Explicação: Este cenário valida que, mesmo sem conexão, o sistema impede cliques repetidos que poderiam resultar em múltiplas requisições quando a conexão for restabelecida.
✅ Resultado Esperado: O sistema detecta a falta de conexão, exibe mensagem de erro e desabilita o botão, prevenindo a geração de múltiplos planos de proteção.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verifique se o botão "Prosseguir para Assinatura" é desabilitado após o primeiro clique, impedindo múltiplos cliques
Verify if the "Proceed to Signature" button is disabled after first click, preventing multiple clicks


Verifique se o botão "Prosseguir para Assinatura" não envia solicitações duplicadas quando o IFrame não carrega
Verify if the "Proceed to Signature" button doesn't send duplicate requests when the IFrame fails to load


Verifique se a tela de assinatura do contrato carrega corretamente mesmo com rede lenta
Verify if the contract signature screen loads correctly even with slow network


Verifique se apenas uma requisição para o plano de proteção é enviada quando o cliente fecha e reabre o navegador devido a problemas de conexão
Verify if only one protection plan request is sent when the client closes and reopens the browser due to connection issues


Verifique se o sistema previne múltiplos cliques no plano de proteção durante perda de conexão, evitando a geração de planos duplicados
Verify if the system prevents multiple clicks on the protection plan during connection loss, avoiding duplicate plan generation

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa1

| Test Case | Test Data | Status |
| ------ | ------ | ------ |
| Verify if the "Proceed to Signature" button is disabled after first click, preventing multiple clicks |  | PASS |
| Verify if the "Proceed to Signature" button doesn't send duplicate requests when the IFrame fails to load |  | PASS |
| Verify if the contract signature screen loads correctly even with slow network |  | PASS |
| Verify if only one protection plan request is sent when the client closes and reopens the browser due to connection issues |  | PASS |
| Verify if the system prevents multiple clicks on the protection plan during connection loss, avoiding duplicate plan generation |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa1

------------------------------------------------------------------------------------------------------------------------------------------------------------------

stg

------------------------------------------------------------------------------------------------------------------------------------------------------------------


Verifique se o botão "Prosseguir para Assinatura" é desabilitado após o primeiro clique, impedindo múltiplos cliques
Verify if the "Proceed to Signature" button is disabled after first click, preventing multiple clicks


Verifique se o botão "Prosseguir para Assinatura" não envia solicitações duplicadas quando o IFrame não carrega
Verify if the "Proceed to Signature" button doesn't send duplicate requests when the IFrame fails to load


Verifique se a tela de assinatura do contrato carrega corretamente mesmo com rede lenta
Verify if the contract signature screen loads correctly even with slow network

Verifique se o sistema previne múltiplos cliques no plano de proteção durante perda de conexão, evitando a geração de planos duplicados
Verify if the system prevents multiple clicks on the protection plan during connection loss, avoiding duplicate plan generation

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in stg

| Test Case | Test Data | Status |
| ------ | ------ | ------ |
| Verify if the "Proceed to Signature" button is disabled after first click, preventing multiple clicks |  | PASS |
| Verify if the "Proceed to Signature" button doesn't send duplicate requests when the IFrame fails to load |  | PASS |
| Verify if the contract signature screen loads correctly even with slow network |  | PASS |
| Verify if the system prevents multiple clicks on the protection plan during connection loss, avoiding duplicate plan generation |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in stg

------------------------------------------------------------------------------------------------------------------------------------------------------------------
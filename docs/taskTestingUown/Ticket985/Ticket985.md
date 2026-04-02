----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/985

UOWN | Origination | Add Seon as Identity Verification Provider

Fernando Martins @fernandogmartins
Testing Steps
Context
Seon is an ID verification provider. Its usage is dynamically controlled via configuration to determine whether Intellicheck or Seon should be initialized. 
The verification process is triggered when the "Complete Application" page is accessed.

The two key identifiers are:
* referenceId: Created each time Seon is initialized, marking a session.
* userId: Tied to multiple sessions; our userId is the leadPk.

A user can have multiple sessions (referenceId), and the most recent one is considered for backend verification.
For verification, several factors are evaluated. If multiple critical checks fail, the verification is rejected.

Common Statuses
* APPROVED: No major verifications failed. The user was successfully validated. The success column is set to true.
* REVIEW: One major verification failed. Although not fully approved, this is still treated as a success, and the user can proceed. The success column is set to true.
* FAIL: Multiple major verifications failed. Identity could not be verified. The success column is set to false.
* ABANDONED: The session was prematurely ended, so verification was not completed. The success column is set to false.

id_verification_success vs success Columns
* success: Always set to true for statuses APPROVED or REVIEW.
* id_verification_success: An internal value set by IdVerificationService. It is only true if all internal validations pass.

If both values are true for the most recent record, Seon will not be initialized again when the user accesses the "Complete Application" page.

Before Testing
* Create a lease with a merchant where idCheckRequired is set to true in the merchant configuration.
* Have a valid document ready for scanning (National ID or driver's license).

Possible Test Flows
Hybrid
Access the "Complete Application" page via a computer browser. If Seon cannot detect a valid camera, a QR code will appear. 
Scan the QR code and complete the verification on your phone.

Computer
Use the computer camera to scan the document. Seon must recognize the camera as valid.

Mobile
Access the "Complete Application" page from a mobile browser and complete the entire process on the phone. (VPN is required when accessing lowers, except for sandbox.)

What Should Be Tested
idCheckProvider
This value determines which provider is initialized. It is configured under IdVerificationService in the configuration file.
* If set to INTELLICHECK, Intellicheck is initialized.
* If set to SEON, Seon is initialized.
Both providers should never be initialized at the same time. Verify the correct one is being used.

Modal Testing
There are two main modal scenarios to test:
1. Premature Exit
When the user tries to leave verification early:
Clicking the button opens a modal requiring reinitialization:
Ensure a new session is created after clicking the button.
2. Failure or Error
This modal appears when the user receives a failure or error response. Using a fake document always triggers a failure.
Happy Path Testing
Using a valid document in any of the test flows should yield an APPROVED result:
Or at least a REVIEW result:
In both cases, the user can proceed to the "Complete Application" page.

Submit Application Test
To test this in qa2, call the /uown/los/seonResults endpoint and pass the value from the result column in the Seon table from sandbox.
All requests from lowers are currently saved in sandbox.

Internal Validations
There are three validations performed:
1. Document Expiration Date
The document must not be expired.
2. Full Name Match
The extracted name must match the first and last name from the application. If it doesn't match and the first or last name has more than one name, 
it needs to match at least of those names.

Date of Birth Match
The extracted date of birth must match the one in the application.


If any of these validations fail, the user cannot proceed.
A log will indicate the failed validation, and the lead status will be set to SEON_ID_FAILED.

If All Validations Pass
The user will proceed to the Terms of Agreement screen. The lease status is set to contract created, and the id_verify_success column is set to true.

If the user accesses the "Complete Application" page again, Seon will not be triggered because both success and id_verify_success are true.
Testing for Intellicheck
Before Testing

Set the VPN on your mobile device.
Intellicheck requires a document with a barcode, such as:

Homer-Driver-License.pdf

In the configuration file, set INTELLICHECK as the provider and verify that it is correctly initialized.


Behavior and Logic
Intellicheck's verification flow is very similar to Seon's. The success and id_verify_success columns function as follows:


success: Indicates the value success from the Intellicheck payload is true.

id_verify_success: Set internally only if all validations pass.

Key Differences
Intellicheck is generally less strict than Seon, and it's possible to be approved using fake documents.
Internal Validations
Intellicheck performs the following checks to determine if id_verify_success should be set to true:


ID Expiration Check
The Intellicheck ID must not be expired.


First Name Check (disabled by default)
Compares the extracted first name with the one provided in the application.


Last Name Check
Compares the extracted last name with the one provided in the application.


Date of Birth Check
Compares the extracted date of birth with the one provided in the application.


If any of these validations fail:

The lead status will be set to INTELLICHECK_FAILED.
A log will be created detailing what failed.

If all validations pass:

The user will proceed normally in the application process.

-----

UOWN | Origination | Adicionar Seon como Provedor de Verificação de Identidade

Fernando Martins @fernandogmartins
Etapas de Teste

Contexto
Seon é um provedor de verificação de identidade. Seu uso é controlado dinamicamente via configuração para determinar se o Intellicheck ou o Seon deve ser inicializado. O processo de verificação é acionado quando a página “Complete Application” é acessada.

Os dois identificadores principais são:

referenceId: criado toda vez que o Seon é inicializado, marcando uma sessão.

userId: vinculado a múltiplas sessões; nosso userId é o leadPk.

Um usuário pode ter várias sessões (referenceId), e a mais recente é considerada para verificação no backend. Para a verificação, vários fatores são avaliados. Se múltiplas checagens críticas falharem, a verificação é rejeitada.

Status Comuns
APPROVED: Nenhuma verificação importante falhou. O usuário foi validado com sucesso. A coluna success fica true.

REVIEW: Uma verificação crítica falhou. Embora não totalmente aprovado, ainda é tratado como sucesso e o usuário pode prosseguir. A coluna success fica true.

FAIL: Múltiplas verificações críticas falharam. A identidade não pôde ser verificada. A coluna success fica false.

ABANDONED: A sessão foi encerrada prematuramente; a verificação não foi concluída. A coluna success fica false.

Colunas id_verification_success vs success

success: Sempre true para os status APPROVED ou REVIEW.

id_verification_success: Valor interno definido pelo IdVerificationService. É true somente se todas as validações internas passarem.

Se ambos os valores forem true no registro mais recente, o Seon não será inicializado novamente quando o usuário acessar a página “Complete Application”.

Antes de Testar
Criar um lease com o merchant configurado com idCheckRequired = true.

Ter um documento válido pronto para escanear (Documento Nacional ou CNH).

Fluxos de Teste Possíveis
Hybrid

Acesse a página “Complete Application” em um navegador de computador. Se o Seon não detectar câmera válida, um QR Code aparecerá.

Escaneie o QR Code e conclua a verificação no celular.

Computer

Use a câmera do computador para escanear o documento. O Seon deve reconhecer a câmera como válida.

Mobile

Acesse a página “Complete Application” pelo navegador móvel e conclua todo o processo no telefone. (VPN é obrigatória fora do sandbox.)

O Que Testar
idCheckProvider
Determina qual provedor é inicializado (configurado em IdVerificationService):

INTELLICHECK → Intellicheck é inicializado.

SEON → Seon é inicializado.
Os dois nunca devem ser inicializados simultaneamente. Verificar se o correto está sendo usado.

Teste de Modais
Saída Prematura

Quando o usuário tenta sair da verificação antes do fim, ao clicar em fechar, exibe modal solicitando reinitialização.

Após clicar em “Reinitialize”, deve ser criada uma nova sessão (novo referenceId).

Falha ou Erro

Usar documento falso sempre dispara falha.

O modal de erro deve aparecer com opções “Done” ou “Retry” e impedir avanço até nova tentativa.

Happy Path
Usar documento válido em qualquer fluxo deve resultar em APPROVED ou, no mínimo, REVIEW.

Em ambos os casos, o usuário pode prosseguir para a página “Complete Application”.

Teste de Submit Application
No ambiente qa2, chamar o endpoint /uown/los/seonResults passando o valor da coluna result da tabela Seon no sandbox.

Validações Internas (Seon)
Data de Expiração: o documento não pode estar vencido.

Nome Completo: o nome extraído deve coincidir com o primeiro e último nome da aplicação (se houver múltiplos nomes, basta coincidir com ao menos um).

Data de Nascimento: deve coincidir com a da aplicação.

❌ Se qualquer validação falhar, o usuário não pode prosseguir. Um log indicará a falha e o lead status será SEON_ID_FAILED.

✅ Se todas passarem, o usuário segue para Terms of Agreement, o status do lease é contract_created e a coluna id_verify_success fica true.

Teste para Intellicheck
Antes de Testar

Ativar VPN no dispositivo móvel.

Intellicheck requer documento com código de barras (ex.: Homer-Driver-License.pdf).

Em configuração, definir INTELLICHECK e verificar inicialização correta.

Comportamento e Lógica

Fluxo semelhante ao do Seon.

success: true se o payload do Intellicheck indicar sucesso.

id_verification_success: true somente se todas as validações internas passarem.

Diferenças-Chave

Intellicheck é menos rigoroso; pode aprovar com documentos falsos.

Validações Internas (Intellicheck)

Verificação de Expiração: o ID não pode estar expirado.

Validação de Primeiro Nome (desabilitada por padrão).

Validação de Último Nome.

Validação de Data de Nascimento.

❌ Se qualquer validação falhar: lead status → INTELLICHECK_FAILED, e um log detalha o erro.

✅ Se todas passarem: o usuário segue normalmente no processo de origination.

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Cliente inicia processo seon em mais de um sessão, a sessão mais recente é a valida. O cliente segue para Terms of Agreement, o status do lease é contract_created e a coluna id_verify_success fica true.
Cliente realiza processo seon com sucesso nas múltiplas verificações, então status deve ser APPROVED e coluna success fica true
Cliente realiza processo seon com falha em uma verificação crítica entre as múltiplas verificações, então status deve ser REVIEW e coluna success fica true
Cliente realiza processo seon com falha em múltiplas verificações, então status deve ser FAIL e coluna success fica false. o cliente não pode prosseguir. Um log indicará a falha e o lead status será SEON_ID_FAILED.
Cliente inicia processo seon e processdo de verificação de identidade não é concluida, então status deve ser ABANDONED e coluna success fica false

Cliente inicia processo por um dispositivo sem camêra, deve ser exibido qr code para continuar processo em outro dispositivo e ao concluir a validação de identidade é retornado ao dispositivo sem camêra que iniciou processo para conclusão
Cliente inicia processo por um computador com camêra, todo o processo inclusive o processo de validação de identidade é feito no dispositivo que inicia processo
Cliente inicia processo por um dispositivo móvel, todo o processo inclusive o processo de validação de identidade é feito no dispositivo que inicia processo
Cliente inicia processo seon e tenta sair da verificação antes da conclusão, ao clicar em fechar, exibe modal solicitando reinitialização. Após clicar em “Reinitialize”, deve ser criada uma nova sessão (novo referenceId).
-----

Verificar referenceId
--
Verificar userId
--
Verificar idCheckProvider - Determina qual provedor é inicializado 
INTELLICHECK → Intellicheck é inicializado.
SEON → Seon é inicializado.
Os dois nunca devem ser inicializados simultaneamente. Verificar se o correto está sendo usado.
--
Verificar Data de Expiração - O documento não pode estar vencido.
--
Nome Completo: o nome extraído deve coincidir com o primeiro e último nome da aplicação (se houver múltiplos nomes, basta coincidir com ao menos um).
--
Data de Nascimento: deve coincidir com a da aplicação.

Testar o caminho feliz (verificação bem-sucedida)

Testar cenários de falha

Testar interrupções pelo usuário

Verificar o tratamento de erros

Verificar o gerenciamento de sessões

Validar o processamento dos resultados

Testar as personalizações de tema
-----

# language: pt
Funcionalidade: Verificação de identidade via Seon e Intellicheck  
  Como usuário do sistema  
  Quero validar minha identidade via Seon ou Intellicheck  
  Para que apenas clientes válidos prossigam no fluxo de origination

  Contexto:
    Dado que o merchant está configurado com idCheckRequired = true  
    E existe um lease válido para o usuário  
    E o usuário possui documento pronto para escaneamento  

  # ================================================================
  # 1. Fluxos de múltiplas sessões e múltiplas validações Seon
  # ================================================================

  @sessao-recente
  Cenário: Cliente inicia o processo Seon em múltiplas sessões – apenas a sessão mais recente é válida  
    Dado que o idCheckProvider está definido como SEON  
    E o usuário está em um computador sem câmera e inicia a verificação Seon pela primeira vez  
    E o sistema gera um referenceId = "REF1" para essa primeira sessão  
    Quando o usuário, sem concluir a primeira sessão, acessa um dispositivo móvel e inicia a verificação Seon novamente  
    Então o sistema deve gerar um novo referenceId = "REF2"  
    E o sistema deve invalidar a sessão com referenceId "REF1"  
    E a única sessão ativa deve ser "REF2"  
    Quando Seon completa todas as validações internas com sucesso na sessão "REF2"  
    Então retornar status APPROVED  
    E coluna success deve ficar true  
    E o usuário pode prosseguir para “Terms of Agreement”  
    E o lease deve ser atualizado para status contract_created  
    E a coluna id_verify_success deve ficar true  

  @sucesso-multiplas-validações
  Cenário: Cliente realiza processo Seon com sucesso em múltiplas validações internas  
    Dado que o idCheckProvider está definido como SEON  
    E o usuário está em um computador com câmera e inicia a verificação Seon  
    E o sistema gera um referenceId para essa sessão  
    Quando Seon processa as várias validações internas (data de expiração, nome completo, data de nascimento, etc.) e todas passam  
    Então retornar status APPROVED  
    E coluna success deve ficar true  
    E registrar os valores de referenceId e userId corretamente no backend  

  @falha-uma-verificacao-critica
  Cenário: Cliente falha em uma verificação crítica entre múltiplas validações Seon  
    Dado que o idCheckProvider está definido como SEON  
    E o usuário está em um dispositivo móvel e inicia a verificação Seon  
    E o sistema gera um referenceId para essa sessão  
    Quando Seon processa as validações internas e detecta falha crítica (por exemplo, Nome incompatível)  
    Então retornar status REVIEW  
    E coluna success deve ficar true  
    E o log deve detalhar “Extracted name does not match application name”  
    E o usuário pode revisar informações mas não avançar sem intervenção manual  

  @falha-multiplas-verificações
  Cenário: Cliente falha em múltiplas verificações internas Seon  
    Dado que o idCheckProvider está definido como SEON  
    E o usuário está em um computador com câmera e inicia a verificação Seon  
    E o sistema gera um referenceId para essa sessão  
    Quando Seon processa as validações internas e detecta pelo menos duas falhas (por exemplo, data expirada e data de nascimento incompatível)  
    Então retornar status FAIL  
    E coluna success deve ficar false  
    E o usuário não pode prosseguir no fluxo  
    E o sistema deve registrar no log “Multiple validation failures”  
    E o lead status deve ser atualizado para SEON_ID_FAILED  

  @abandonado
  Cenário: Cliente inicia processo Seon e não conclui a verificação de identidade  
    Dado que o idCheckProvider está definido como SEON  
    E o usuário está em um computador sem câmera e inicia a verificação Seon  
    E o sistema gera um referenceId para essa sessão  
    Quando o usuário fecha o navegador ou abandona o fluxo antes da conclusão  
    Então retornar status ABANDONED  
    E coluna success deve ficar false  
    E o lead status deve indicar ABANDONED  

  # ================================================================
  # 2. Verificações de campos de documento no Seon
  # ================================================================

  @validacoes-internas-seon
  Esquema do Cenário: Validações internas do Seon para documentos inválidos  
    Dado que o idCheckProvider está definido como SEON  
    E o usuário está em um computador com câmera e submete um documento com <campo inválido>  
    Quando Seon processa a validação interna correspondente  
    Então o lead status deve ser SEON_ID_FAILED  
    E o log deve detalhar “<mensagem de erro>”  

    Exemplos:
      | campo inválido      | mensagem de erro                                                     |
      | data expirada       | “Document expired on <data_documento>”                                |
      | nome incompatível   | “Extracted name does not match application name”                      |
      | data de nascimento  | “DateOfBirth mismatch: expected <data_aplicacao> but got <data_doc>”  |

  @referencia-userid
  Cenário: Verificar geração e consistência de referenceId e userId  
    Dado que o idCheckProvider está definido como SEON  
    E o usuário está em um computador sem câmera e inicia a verificação Seon  
    Quando o sistema cria a sessão Seon  
    Então o backend deve armazenar corretamente o referenceId e o userId associados à sessão  
    E não deve haver outra sessão ativa com o mesmo referenceId ou userId  

  # ================================================================
  # 3. Fluxos de dispositivo (câmera, sem câmera, móvel)
  # ================================================================

  @fluxo-hybrid
  Cenário: Verificação híbrida via QR Code (desktop sem câmera)  
    Dado que o idCheckProvider está definido como SEON  
    E o usuário está em um computador sem câmera e acessa a página "Complete Application"  
    Quando o sistema exibe um QR Code  
    E o usuário escaneia o QR Code em dispositivo móvel e conclui a verificação no celular  
    Então o backend deve criar uma sessão Seon (referenceId) na fase de desktop  
    E ao finalizar no celular, deve atualizar a mesma sessão com resultado de verificação  
    E retornar status APPROVED ou REVIEW conforme as validações internas  
    E coluna success deve ficar true ou false de acordo com o resultado final  

  @fluxo-computer
  Cenário: Verificação via câmera do computador (desktop com câmera)  
    Dado que o idCheckProvider está definido como SEON  
    E o usuário está em um desktop com câmera integrada e funcional e acessa a página "Complete Application"  
    Quando o usuário escaneia o documento com a câmera do computador  
    Então Seon deve processar e validar o documento localmente  
    E retornar status APPROVED ou REVIEW  
    E coluna success deve ficar true ou false de acordo com o resultado  
    E o usuário prossegue ou aguarda intervenção  

  @fluxo-mobile
  Cenário: Verificação completa em dispositivo móvel  
    Dado que o idCheckProvider está definido como SEON  
    E o usuário acessa a página "Complete Application" em um dispositivo móvel  
    Quando o usuário completa todo o fluxo de captura e validação de identidade no dispositivo móvel  
    Então Seon deve retornar status APPROVED ou REVIEW  
    E coluna success deve ficar true ou false conforme o resultado  
    E o usuário prossegue ou aguarda intervenção  

  @muda-dispositivo
  Cenário: Troca de dispositivo durante verificação QR Code  
    Dado que o idCheckProvider está definido como SEON  
    E o usuário inicia verificação Seon em desktop sem câmera e obtém referenceId = "REFQRCODE"  
    E não concluiu o fluxo naquele dispositivo  
    Quando o usuário abre "Complete Application" em um dispositivo móvel com o mesmo userId  
    Então o sistema deve reconhecer a sessão ativa "REFQRCODE"  
    E não criar nova sessão até que a verificação seja concluída ou expirada  

  @reabrir-navegador
  Cenário: Fechar e reabrir navegador durante exibição de QR Code  
    Dado que o idCheckProvider está definido como SEON  
    E o usuário está em um computador sem câmera e visualiza um QR Code gerado para a sessão referenceId = "REFX"  
    Quando o usuário fecha o navegador antes de escanear e depois reabre a mesma página dentro de 5 minutos  
    Então o sistema deve exibir o mesmo QR Code para "REFX"  
    E manter a sessão ativa até seu TTL expirar (5 minutos)  
    Quando o QR Code expirar (após 5 minutos sem uso)  
    Então a sessão deve ser marcada como ABANDONED  

  # ================================================================
  # 4. Interrupções, erros e fallback de provedor
  # ================================================================

  @modal-prematuro
  Cenário: Saída prematura do modal de verificação Seon  
    Dado que o usuário está em um computador com câmera e no modal de verificação Seon (session referenceId ativa)  
    Quando o usuário clica no botão fechar (X) ou “Go Back”  
    Então deve aparecer um modal “ID Verification Required” com botão “Reinitialize”  
    Quando o usuário clica em “Reinitialize”  
    Então o sistema deve invalidar a sessão corrente  
    E criar uma nova sessão Seon (novo referenceId)  
    E exibir novamente o fluxo de verificação  

  @modal-falha
  Cenário: Modal de falha ou erro no fluxo Seon  
    Dado que o usuário está em um dispositivo móvel e usa documento falso ou inválido no fluxo Seon  
    E Seon retorna status FAIL ou ERROR para referenceId  
    Quando o sistema recebe o resultado  
    Então mostrar modal “Unsuccessful verification” com opções “Done” e “Retry”  
    E coluna success deve ficar false  
    E não permitir que o usuário avance no processo até nova tentativa  

  @rede-lenta
  Cenário: Rede lenta durante a inicialização do provedor Seon  
    Dado que o usuário está em um computador sem câmera e a latência de rede simula ≥ 5 segundos para inicializar Seon  
    Quando o usuário inicia a verificação Seon  
    Então o sistema deve exibir indicador de carregamento (spinner)  
    E se após 10 segundos não houver resposta do Seon  
    Então mostrar mensagem de erro “Serviço indisponível. Tente novamente mais tarde.”  
    E registrar “Seon initialization timeout” no log  

  @fallback-provider
  Cenário: Falha no Seon e fallback para Intellicheck  
    Dado que o idCheckProvider está definido como SEON  
    E o usuário está em um computador com câmera  
    E Seon retorna erro de timeout ou indisponível ao tentar inicializar  
    Quando o sistema detecta a falha ao iniciar Seon  
    Então o sistema deve alterar idCheckProvider para INTELLICHECK  
    E inicializar Intellicheck no mesmo fluxo de verificação  
    E manter o mesmo userId  
    E criar um novo referenceId para Intellicheck  
    E prosseguir com as validações via Intellicheck  

  # ================================================================
  # 5. Fluxo Intellicheck e validações internas
  # ================================================================

  @intellicheck-flow
  Cenário: Fluxo de verificação Intellicheck  
    Dado que idCheckProvider = INTELLICHECK  
    E o usuário está em um dispositivo móvel e possui documento com barcode (por exemplo, CNH com código de barras)  
    Quando o usuário escaneia o documento via Intellicheck  
    E Intellicheck processa as validações internas (data de expiração, nome completo, data de nascimento)  
    Então retornar status APPROVED ou REVIEW conforme as validações  
    E coluna success deve ficar true para APPROVED/REVIEW e false para FAIL  
    E aplicar as mesmas regras de id_verification_success no lease  

  @validacoes-internas-intellicheck
  Esquema do Cenário: Validações internas do Intellicheck para documentos inválidos  
    Dado que idCheckProvider = INTELLICHECK  
    E o usuário está em um computador com câmera e submete documento com <campo inválido>  
    Quando Intellicheck processa a validação interna correspondente  
    Então o lead status deve ser INTELLICHECK_FAILED  
    E o log deve detalhar “<mensagem de erro>”  

    Exemplos:
      | campo inválido      | mensagem de erro                                                     |
      | data expirada       | “Intellicheck ID expired on <data_documento>”                         |
      | nome incompatível   | “First/Last Name mismatch with application”                           |
      | data de nascimento  | “DateOfBirth mismatch: expected <data_aplicacao> but got <data_doc>”  |

  # ================================================================
  # 6. Endpoint de Callback e processamento de resultados
  # ================================================================

  @endpoint-seon
  Cenário: Testar endpoint de callback /uown/los/seonResults no ambiente QA2  
    Dado que estamos no ambiente QA2  
    E o sandbox contém resultado “<result>” para a sessão referenceId ativa  
    Quando chamamos POST /uown/los/seonResults com body { "result": "<result>" }  
    Então o sistema deve aplicar esse resultado à sessão Seon correspondente  
    E atualizar status e coluna success conforme <result>  
    E registrar “Callback received” no log  

  # ================================================================
  # 7. Testes gerais e personalizações de tema
  # ================================================================

  @happy-path
  Cenário: Testar o caminho feliz de verificação Seon  
    Dado que o usuário está em um computador com câmera e utiliza documento válido  
    Quando Seon completa as validações internas sem erros  
    Então retornar status APPROVED  
    E coluna success deve ficar true  
    E permitir que o usuário prossiga para “Terms of Agreement”  
    E atualizar lease para contract_created  
    E atualizar id_verify_success = true  

  @testes-falha
  Cenário: Testar cenários de falha gerais  
    Dado que o usuário está em um dispositivo móvel e utiliza documento com falha crítica ou múltiplas falhas  
    Quando Seon processa as validações internas e detecta erro  
    Então retornar status REVIEW (se falha crítica única) ou FAIL (se múltiplas falhas)  
    E coluna success deve ficar true (caso REVIEW) ou false (caso FAIL)  
    E aplicar lead status apropriado (SEON_ID_FAILED, se FAIL)  

  @testes-interrupcao
  Cenário: Testar interrupções pelo usuário  
    Dado que o usuário está em um computador sem câmera e inicia verificação Seon ou Intellicheck  
    Quando o usuário interrompe (fecha o navegador ou sai do fluxo) antes da conclusão  
    Então retornar status ABANDONED  
    E coluna success deve ficar false  
    E o lease ou lead status deve refletir a interrupção  

  @tratamento-erros
  Cenário: Verificar tratamento de erros no fluxo de verificação  
    Dado que o usuário está em um dispositivo móvel  
    Quando ocorrer erro de rede, timeout ou exceção interna durante a verificação  
    Então o sistema deve exibir mensagem amigável “Ocorreu um erro. Tente novamente.”  
    E registrar detalhes do erro no log (ex.: “Seon initialization timeout” ou “Intellicheck service unavailable”)  
    E o usuário pode tentar reiniciar a verificação  

  @gerenciamento-sessoes
  Cenário: Verificar gerenciamento correto de sessões de verificação  
    Dado que o usuário inicia múltiplas verificações Seon e Intellicheck em diversos dispositivos (computador com câmera, computador sem câmera e dispositivo móvel)  
    Quando o usuário muda de provedor ou reabre a página em qualquer um desses dispositivos  
    Então deve haver apenas uma sessão ativa por userId a qualquer momento  
    E todas as sessões expiradas devem ser marcadas como ABANDONED ou FAIL  

  @processamento-resultados
  Cenário: Validar processamento correto dos resultados de verificação  
    Dado que o sistema recebe callback de Seon ou Intellicheck com resultado  
    Quando o resultado chega ao endpoint /uown/los/{provedor}Results  
    Então o sistema deve correlacionar o resultado ao referenceId e userId corretos  
    E atualizar lease ou lead status conforme o resultado (APPROVED, REVIEW, FAIL, ABANDONED)  
    E preencher a coluna id_verification_success ou success de acordo com o provedor  

  @customizacao-tema
  Cenário: Testar personalizações de tema durante o fluxo de verificação  
    Dado que o usuário está em um computador com câmera  
    E o merchant configurou cores, logotipo e textos personalizados para a interface de verificação  
    Quando o fluxo Seon ou Intellicheck é inicializado  
    Então a página deve exibir o logotipo correto e as cores configuradas pelo merchant  
    E textos de instrução devem refletir a personalização definida  
    E não deve aparecer nenhum elemento padrão sem estilização  



Português (melhorado)
Quando o processo é realizado em um computador sem câmera, utilizando um dispositivo móvel para ler o QR code exibido na tela, após iniciar o procedimento e obter sucesso (após algumas rejeições), a verificação de identidade é concluída com êxito, mas em seguida ocorre uma falha ao localizar o registro no Seon.
No teste feito em um computador com câmera e em um dispositivo móvel, após a leitura do documento é retornada a mensagem “token de autorização ausente”.
A tarefa será aprovada porque a verificação de identidade estará configurada para o Intellicheck, e o processo pelo Intellicheck permanece inalterado.

English (improved)
When the process is executed on a computer without a camera, using a mobile device to scan the QR code displayed on the screen, after starting the procedure and succeeding (following a few rejections), the identity verification completes successfully, but then an error occurs indicating that the Seon record could not be found.
In the test performed on a computer with a camera and a mobile device, after scanning the document, a “missing authorization token” message is returned.
The task will be approved because identity verification will be configured through Intellicheck, and the Intellicheck process remains unchanged.


Process carried out through a device with a camera:

Criar um lease submetendo a validação de identidade por meio do Intellicheck
Create a lease by submitting identity verification through Intellicheck

Tests in stg

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 23677 | Progress Mobility | Create a lease by submitting identity verification through Intellicheck |  | PASS |

https://origination-stg.uownleasing.com/completeApplication?uuid=23d41919-2223-4670-8975-24aaca4807fa_6030787715866349568&selectedPaymentFrequency=WEEKLY&isBranded=false
https://origination-stg.uownleasing.com/completeApplication?uuid=c619c701-93e1-4c73-b7bd-0289230ff830_6030449478333419520&selectedPaymentFrequency=WEEKLY&isBranded=false
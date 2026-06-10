            ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

            https://gitlab.com/uown/frontend/origination/-/issues/1035

            UOWN | Servicing | Refactoring to improve loading performance on the Customers page

            Fernando Martins @fernandogmartins
            Testing Steps
            Sanity Testing – Customer Page
            Perform general sanity testing on the Customer page, with a focus on the following:
            Credit Card, Bank Account, and Servicing Information sections:
            Verify that data is correctly displayed, updated, and deleted as expected.
            Ensure that all user interactions result in the correct UI and backend behavior.
            Performance Check:
            Confirm that the page loads without noticeable delay.
            Check that UI elements update promptly when interacting with the page (e.g., after saving or deleting data).
            Check if the blank screen error when reloading the page no longer happens

            -----

            UOWN | Atendimento | Refatoração para melhorar o desempenho de carregamento na página de Clientes

            Fernando Martins @fernandogmartins
            Passos de Teste
            Teste de Sanidade – Página de Clientes
            Realize testes gerais de sanidade na página de Clientes, com foco nos seguintes pontos:
            Seções de Cartão de Crédito, Conta Bancária e Informações de Atendimento:
            Verifique se os dados são exibidos, atualizados e excluídos corretamente conforme esperado.
            Certifique-se de que todas as interações do usuário resultam no comportamento correto da interface e do backend.

            Verificação de Desempenho:
            Confirme que a página carrega sem atrasos perceptíveis.
            Verifique se os elementos da interface atualizam rapidamente ao interagir com a página (por exemplo, após salvar ou excluir dados).
            Confirme que o erro de tela em branco ao recarregar a página não ocorre mais.

            ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

            1. Requisitos Extraídos
            Requisitos Funcionais:
            O sistema deve exibir corretamente os dados nas seções de Cartão de Crédito, Conta Bancária e Informações de Atendimento (Servicing Information) na página de Clientes.
            O sistema deve permitir a atualização e exclusão dos dados nessas seções e refletir as mudanças tanto na interface quanto no backend.
            Todas as interações do usuário nessas seções devem gerar o comportamento esperado, incluindo permissões de edição baseadas em perfil.
            O sistema deve carregar a página de Cliente sem atraso perceptível, exibindo os componentes necessários rapidamente.
            Os elementos da interface devem ser atualizados imediatamente após ações de salvar ou excluir (sem delays ou inconsistências).
            Ao recarregar a página de Cliente, não deve ocorrer tela em branco (blank screen error).
            Os painéis (componentes) devem exibir indicadores de carregamento (“loading”) quando apropriado.
            O modal de verificação de informações do cliente deve ser exibido corretamente quando necessário (exemplo: novo cliente ou não verificado).
            O sistema deve garantir que os dados de contato (endereço, telefone, e-mail) sejam apresentados e editados corretamente.
            O usuário deve conseguir visualizar todas as informações de cartão ou conta bancária via modais específicos (“Ver Todos”).
            O log de atividades deve ser carregado corretamente e permitir paginação/filtragem.
            Erros de backend devem ser tratados e exibidos de forma amigável, sem travar a tela.

            Requisitos Não Funcionais:
            O tempo de carregamento da página deve ser curto e sem travamentos visíveis (“sem atraso perceptível”).
            Não pode haver tela em branco após reload.
            O feedback de carregamento deve ser claro (spinners, indicadores visuais nos painéis).
            O sistema deve funcionar corretamente em todos os navegadores suportados.
            Os dados devem ser atualizados de forma otimizada (evitar requisições e renderizações desnecessárias).

            Casos de Borda e Condições de Erro:
            O sistema deve lidar corretamente com ausência de dados (listas vazias, ausência de cartões/contas, campos não preenchidos).
            Deve exibir mensagens de erro amigáveis para falhas de backend.
            Permissões devem ser respeitadas: usuário sem permissão não pode editar ou visualizar certas informações.
            O usuário deve ser notificado caso tente sair da página com alterações não salvas.
            O painel não deve tentar renderizar com dados indefinidos/nulos.

            -----

            Funcionalidade: Carregamento e Interação de Dados na Página de Clientes

            Contexto:
            Dado que estou logado e tenho acesso à página de Clientes

            # Caminho Feliz: Carregamento e exibição de dados
            Cenário: Página de Cliente carrega e exibe todas as seções corretamente
            Quando acesso a página de Cliente para uma conta válida
            Então as seções de Cartão de Crédito, Conta Bancária e Informações de Atendimento exibem os dados corretos
            E nenhuma tela em branco é exibida

            Cenário: Usuário atualiza informações do cliente com sucesso
            Dado que possuo permissão de edição das informações do cliente
            Quando atualizo informações na seção de Atendimento
            E salvo as alterações
            Então as mudanças são refletidas imediatamente na interface e no backend

            Cenário: Usuário exclui dados de uma seção
            Dado que possuo permissão de edição da seção
            Quando excluo um Cartão de Crédito ou Conta Bancária
            Então o item é removido da interface
            E o backend não lista mais esse item
            E nenhuma tela em branco é exibida
            Erro - Quando o componente de conta bancária e cartão de crédito não contém dados é exibido load e tela branca nos componentes

            Cenário: Usuário visualiza todos os cartões de crédito em um modal
            Quando clico em "Ver Todos" na seção de Cartão de Crédito
            Então um modal é exibido com a lista de todos os cartões de crédito

            Cenário: Usuário visualiza todas as contas bancárias em um modal
            Quando clico em "Ver Todos" na seção de Conta Bancária
            Então um modal é exibido com a lista de todas as contas bancárias

            # Performance & UX
            Cenário: Página de Cliente carrega sem atraso perceptível
            Quando acesso a página de Cliente
            Então o conteúdo da página e todos os painéis são exibidos em até 2 segundos

            Cenário: Elementos da interface atualizam rapidamente após salvar dados
            Dado que atualizei informações de atendimento do cliente
            Quando salvo as alterações
            Então os dados atualizados são exibidos instantaneamente na interface

            Cenário: Indicadores de carregamento são exibidos durante o carregamento dos dados
            Quando os dados de um painel estão sendo carregados
            Então um indicador de carregamento é exibido na respectiva seção

            Cenário: Não ocorre tela em branco ao recarregar a página
            Quando recarrego a página de Cliente
            Então todas as seções esperadas são exibidas, sem tela em branco

            # Casos de Borda
            Cenário: Página de Cliente carrega com listas vazias
            Dado que o cliente não possui cartões de crédito, contas bancárias ou informações de atendimento
            Quando acesso a página de Cliente
            Então cada seção exibe uma mensagem de estado vazio e nenhum erro é apresentado
            Erro - Quando o componente de conta bancária e cartão de crédito não contém dados é exibido load e tela branca nos componentes

            Cenário: Usuário sem permissão de edição não pode editar dados
            Dado que não possuo permissão de edição
            Quando tento editar informações do cliente
            Então os campos estão desabilitados

            Cenário: Sistema lida com erro do backend de forma amigável
            Quando o backend retorna erro ao buscar ou salvar dados
            Então uma mensagem de erro é exibida ao usuário
            E a página não trava nem apresenta tela em branco

            Esquema do Cenário: Seções lidam com dados indefinidos/nulos ou ausentes
            Dado que os dados da seção <secao> estão indefinidos ou nulos
            Quando acesso a página de Cliente
            Então a seção <secao> exibe mensagem de estado vazio sem travar

            Exemplos:
            | secao             |
            | Cartão de Crédito |
            | Conta Bancária    |
            | Contato           |
            Erro - Quando o componente de conta bancária e cartão de crédito não contém dados é exibido load e tela branca nos componentes

            # Log de Atividades
            Cenário: Log de atividades carrega e pagina corretamente
            Quando abro o Log de Atividades
            Então as entradas são exibidas com paginação e filtros
            E alterar o número de linhas ou filtros recarrega os dados corretamente

            # Compatibilidade de navegadores (sanidade manual)
            Cenário: Página de Cliente funciona em todos os navegadores suportados
            Quando acesso a página de Cliente em qualquer navegador suportado
            Então a página carrega e funciona como esperado


            Cenário: Adicionar cartão de crédito quando não existe nenhum cadastrado
            Dado que o cliente não possui nenhum cartão de crédito cadastrado
            Quando acesso a página de Cliente
            E clico em "Adicionar Cartão de Crédito"
            E preencho as informações obrigatórias e salvo
            Então o novo cartão de crédito é exibido na seção de cartões
            E o backend armazena o cartão cadastrado corretamente
            Ao clicar para adicionar um cartão, caso nenhum cartão esteja cadastrado, nenhuma ação é executada.

            -----

            | #  | Cenário (Resumo)                                           | Requisitos Cobertos |
            | -- | ---------------------------------------------------------- | ------------------- |
            | 1  | Página de Cliente carrega e exibe todas as seções          | 1, 4, 6, 18, 22     |
            | 2  | Atualiza informações do cliente com sucesso                | 2, 3, 5, 9          |
            | 3  | Usuário exclui dados de uma seção                          | 2, 5, 12, 18        |
            | 4  | Visualiza todos os cartões de crédito                      | 10, 20, 18          |
            | 5  | Visualiza todas as contas bancárias                        | 10, 20, 18          |
            | 6  | Carregamento sem atraso perceptível                        | 4, 13, 14           |
            | 7  | Elementos da interface atualizam rapidamente               | 5, 13, 17           |
            | 8  | Indicadores de carregamento                                | 7, 15               |
            | 9  | Não ocorre tela em branco ao recarregar                    | 6, 14               |
            | 10 | Página de Cliente com listas vazias                        | 18, 22              |
            | 11 | Sem permissão, usuário não pode editar                     | 3, 20               |
            | 12 | Usuário alertado ao sair com alterações não salvas         | 21                  |
            | 13 | Sistema lida com erro do backend                           | 12, 19              |
            | 14 | Seções lidam com dados indefinidos/nulos                   | 18, 22              |
            | 15 | Modal de verificação exibida quando necessário             | 8                   |
            | 16 | Modal de verificação não exibida para clientes verificados | 8                   |
            | 17 | Log de atividades carrega e pagina corretamente            | 11, 5, 17           |
            | 18 | Página de Cliente funciona em todos os navegadores         | 16                  |

            -----

            4. Lacunas, Observações e Recomendações
            Lacunas Identificadas:
            Não foram detalhados cenários para permissões muito específicas (ex: “editar apenas o CPF”, “editar apenas o e-mail”).
            Não foram criados cenários para concorrência (dois usuários editando ao mesmo tempo).
            Testes de performance detalhados ou de stress não foram incluídos (NFR 17 tratado só em parte).
            A compatibilidade entre navegadores está coberta apenas como cenário manual.

            Recomendações:
            Adicionar cenários automatizados para performance e testes de carga.
            Expandir cenários de permissões conforme regras de negócio (caso cada campo exija permissões separadas).
            Incluir testes de acessibilidade (A11y) para garantir boa experiência para todos os usuários.
            Considerar cenários de auditoria e log para compliance, se aplicável.
            Para cenários não-funcionais mais técnicos (renderização otimizada, concorrência), sugerir testes exploratórios ou automatizados avançados.


            ### Tests in qa1

            #### Português

            | LeadPk | Merchant | Caso de Teste                                                                                                 | Dados do Teste                                                                                                              | Status |
            | ------ | -------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------ |
            | X      | X        | Página de Cliente carrega e exibe todas as seções corretamente                                                | -                                                                                                                           | PASS   |
            | X      | X        | Usuário atualiza informações do cliente com sucesso                                                           | -                                                                                                                           | PASS   |
            | X      | X        | Usuário exclui dados de uma seção                                                                             | Quando o componente de conta bancária e cartão de crédito não contém dados é exibido load e tela branca nos componentes     | FAIL   |
            | X      | X        | Usuário visualiza todos os cartões de crédito em um modal                                                     | -                                                                                                                           | PASS   |
            | X      | X        | Usuário visualiza todas as contas bancárias em um modal                                                       | -                                                                                                                           | PASS   |
            | X      | X        | Página de Cliente carrega sem atraso perceptível                                                              | -                                                                                                                           | PASS   |
            | X      | X        | Elementos da interface atualizam rapidamente após salvar dados                                                | -                                                                                                                           | PASS   |
            | X      | X        | Indicadores de carregamento são exibidos durante o carregamento dos dados                                     | -                                                                                                                           | PASS   |
            | X      | X        | Não ocorre tela em branco ao recarregar a página                                                              | -                                                                                                                           | PASS   |
            | X      | X        | Página de Cliente carrega com listas vazias                                                                   | Quando o componente de conta bancária e cartão de crédito não contém dados é exibido load e tela branca nos componentes     | FAIL   |
            | X      | X        | Usuário sem permissão de edição não pode editar dados                                                         | -                                                                                                                           | PASS   |
            | X      | X        | Sistema lida com erro do backend de forma amigável                                                            | -                                                                                                                           | PASS   |
            | X      | X        | Seções lidam com dados indefinidos/nulos ou ausentes                                                          | Quando o componente de conta bancária e cartão de crédito não contém dados é exibido load e tela branca nos componentes     | FAIL   |
            | X      | X        | Log de atividades carrega e pagina corretamente                                                               | -                                                                                                                           | PASS   |
            | X      | X        | Página de Cliente funciona em todos os navegadores suportados                                                 | -                                                                                                                           | PASS   |
            | X      | X        | Adicionar cartão de crédito quando não existe nenhum cadastrado                                               | Ao clicar para adicionar um cartão, caso nenhum cartão esteja cadastrado, nenhuma ação é executada                          | FAIL   |

            ---

Tests in qa1

| LeadPk | Merchant          | Test Case                                                    | Test Data | Status | Observation |
| ------ | ----------------- | ------------------------------------------------------------ | --------- | ------ | ---------   |  
| 3991   | Progress Mobility | Customer page loads and displays all sections correctly      | -         | PASS   |             |
| 3991   | Progress Mobility | User successfully updates customer information               | -         | PASS   |             |
| 3991   | Progress Mobility | User deletes data from a section                             | -         | PASS   |             |
| 3991   | Progress Mobility | User views all credit cards in a modal                       | -         | PASS   |             |
| 3991   | Progress Mobility | User views all bank accounts in a modal                      | -         | PASS   |             |
| 3991   | Progress Mobility | Customer page loads without noticeable delay                 | -         | PASS   |             |
| 3991   | Progress Mobility | Interface elements update quickly after saving data          | -         | PASS   |             |
| 3991   | Progress Mobility | Loading indicators are displayed while data is being loaded  | -         | PASS   |             |
| 3991   | Progress Mobility | No blank screen occurs when reloading the page               | -         | PASS   |             |
| 3991   | Progress Mobility | Customer page loads with empty lists                         | -         | PASS   |             |
| 3991   | Progress Mobility | User without edit permission cannot edit data                | -         | PASS   |             |
| 3991   | Progress Mobility | System handles backend error gracefully                      | -         | PASS   |             |
| 3991   | Progress Mobility | Activity log loads and paginates correctly                   | -         | PASS   |             |
| 3991   | Progress Mobility | Customer page works in all supported browsers                | -         | PASS   |             |
| 3991   | Progress Mobility | Add credit card when none are registered                     | -         | PASS   |             |



---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in stg

Customer page loads and displays all sections correctly    
User successfully updates customer information             
User deletes data from a section                           
User views all credit cards in a modal                     
User views all bank accounts in a modal                    
Customer page loads without noticeable delay               
Interface elements update quickly after saving data        
Loading indicators are displayed while data is being loaded
No blank screen occurs when reloading the page             
Customer page loads with empty lists                       
User without edit permission cannot edit data              
System handles backend error gracefully                    
Activity log loads and paginates correctly                 
Customer page works in all supported browsers              
Add credit card when none are registered    
206399               

-----



@happy_path
Cenário: Página de Cliente carrega e exibe todas as seções corretamente
  Dado que estou na página de Clientes com dados válidos
  Quando acesso a página de Clientes
  Então todas as seções (Cartão de Crédito, Conta Bancária e Atendimento) exibem os dados corretos

@happy_path
Cenário: Usuário atualiza informações do cliente com sucesso
  Dado que estou na página de Clientes com permissão de edição
  Quando atualizo as informações do cliente
  E salvo as alterações
  Então as mudanças são refletidas na interface e no backend

@happy_path
Cenário: Usuário exclui dados de uma seção
  Dado que possuo permissão de exclusão na página de Clientes
  Quando excluo um Cartão de Crédito ou Conta Bancária
  Então o item é removido da interface e do backend

@visualizacao
Cenário: Usuário visualiza todos os cartões de crédito em um modal
  Dado que há cartões de crédito cadastrados
  Quando clico em "Ver Todos" na seção de Cartão de Crédito
  Então um modal é exibido com a lista de todos os cartões de crédito

@visualizacao
Cenário: Usuário visualiza todas as contas bancárias em um modal
  Dado que há contas bancárias cadastradas
  Quando clico em "Ver Todos" na seção de Conta Bancária
  Então um modal é exibido com a lista de todas as contas bancárias

@performance
Cenário: Página de Cliente carrega sem atraso perceptível
  Quando acesso a página de Clientes
  Então todo o conteúdo é exibido em até 2 segundos

@ux
Cenário: Indicadores de carregamento são exibidos durante o carregamento dos dados
  Quando dados de uma seção estão sendo carregados
  Então um indicador de carregamento é exibido na respectiva seção

@borda
Cenário: Não ocorre tela em branco ao recarregar a página
  Quando recarrego a página de Clientes
  Então todas as seções são exibidas, sem tela em branco

@edge_case
Cenário: Página de Cliente carrega com listas vazias
  Dado que o cliente não possui cartões de crédito, contas bancárias ou informações de atendimento
  Quando acesso a página de Clientes
  Então cada seção suas labels mas os valores com estado vazio e nenhum erro é apresentado

@permissao
Cenário: Usuário sem permissão de edição não pode editar dados
  Dado que não possuo permissão de edição
  Quando tento editar informações do cliente
  Então os campos estão ocultos

@erro
Cenário: Sistema lida com erro do backend de forma amigável
  Quando o backend retorna erro ao buscar ou salvar dados
  Então uma mensagem de erro é exibida ao usuário
  E a página não trava nem apresenta tela em branco

@log
Cenário: Log de atividades carrega e pagina corretamente
  Quando abro o log de atividades
  Então vejo as entradas com paginação e filtros
  E ao alterar número de linhas ou filtros, os dados são recarregados corretamente

@cross_browser
Cenário: Página de Cliente funciona em todos os navegadores suportados
  Quando acesso a página de Clientes em qualquer navegador suportado
  Então a página carrega e funciona como esperado

@adicao
Cenário: Adicionar cartão de crédito quando não existe nenhum cadastrado
  Dado que não existe nenhum cartão de crédito cadastrado
  Quando clico em "Adicionar Cartão de Crédito" e preencho os campos obrigatórios
  Então o novo cartão de crédito é exibido na seção e salvo no backend

-----------------------------------------------------------------------------------------------------------------------------


> ## Tests in -
> ```gherkin
> Scenario: Página de Cliente carrega e exibe todas as seções corretamente
> Given que estou na página de Clientes com dados válidos
> When acesso a página de Clientes
> Then todas as seções (Cartão de Crédito, Conta Bancária e Atendimento) exibem os dados corretos
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>

> 
> ```gherkin
> Scenario: Usuário atualiza informações do cliente com sucesso
> Given que estou na página de Clientes com permissão de edição
> When atualizo as informações do cliente
> And salvo as alterações
> Then as mudanças são refletidas na interface e no backend
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>

> 
> ```gherkin
> Scenario: Usuário exclui dados de uma seção
> Given que possuo permissão de exclusão na página de Clientes
> When excluo um Cartão de Crédito ou Conta Bancária
> Then o item é removido da interface e do backend
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>

> 
> ```gherkin
> Scenario: Usuário visualiza todos os cartões de crédito em um modal
> Given que há cartões de crédito cadastrados
> When clico em "Ver Todos" na seção de Cartão de Crédito
> Then um modal é exibido com a lista de todos os cartões de crédito
> 
> Scenario: Usuário visualiza todas as contas bancárias em um modal
> Given que há contas bancárias cadastradas
> When clico em "Ver Todos" na seção de Conta Bancária
> Then um modal é exibido com a lista de todas as contas bancárias
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>

> 
> ```gherkin
> Scenario: Página de Cliente carrega sem atraso perceptível
> When acesso a página de Clientes
> Then todo o conteúdo é exibido em até 2 segundos
> 
> Scenario: Indicadores de carregamento são exibidos durante o carregamento dos dados
> When dados de uma seção estão sendo carregados
> Then um indicador de carregamento é exibido na respectiva seção
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>

> 
> ```gherkin
> Scenario: Não ocorre tela em branco ao recarregar a página
> When recarrego a página de Clientes
> Then todas as seções são exibidas, sem tela em branco
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>

> 
> ```gherkin
> Scenario: Página de Cliente carrega com listas vazias
> Given que o cliente não possui cartões de crédito, contas bancárias ou informações de atendimento
> When acesso a página de Clientes
> Then cada seção suas labels mas os valores com estado vazio e nenhum erro é apresentado
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>

> 
> ```gherkin
> Scenario: Usuário sem permissão de edição não pode editar dados
> Given que não possuo permissão de edição
> When tento editar informações do cliente
> Then os campos estão ocultos
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>

> 
> ```gherkin
> Scenario: Sistema lida com erro do backend de forma amigável
> When o backend retorna erro ao buscar ou salvar dados
> Then uma mensagem de erro é exibida ao usuário
> And a página não trava nem apresenta tela em branco
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>

> 
> ```gherkin
> Scenario: Log de atividades carrega e pagina corretamente
> When abro o log de atividades
> Then vejo as entradas com paginação e filtros
> And ao alterar número de linhas ou filtros, os dados são recarregados corretamente
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>

> 
> ```gherkin
> Scenario: Página de Cliente funciona em todos os navegadores suportados
> When acesso a página de Clientes em qualquer navegador suportado
> Then a página carrega e funciona como esperado
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>

> 
> ```gherkin
> Scenario: Adicionar cartão de crédito quando não existe nenhum cadastrado
> Given que não existe nenhum cartão de crédito cadastrado
> When clico em "Adicionar Cartão de Crédito" e preencho os campos obrigatórios
> Then o novo cartão de crédito é exibido na seção e salvo no backend
> ```
>

-------


            ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


> ## Tests in stg
> ```gherkin
>
> ### Scenario: Customer page loads and displays all sections correctly
> Given I am on the Customers page with valid data
> When I access the Customers page
> Then all sections (Credit Card, Bank Account, and Servicing) display the correct data
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
> ```gherkin
> ### Scenario: User successfully updates customer information
> Given I am on the Customers page with edit permission
> When I update the customer information
> And I save the changes
> Then the changes are reflected in the UI and in the backend
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
> ```gherkin
> ### Scenario: User deletes data from a section
> Given I have delete permission on the Customers page
> When I delete a Credit Card or Bank Account
> Then the item is removed from the UI and from the backend
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
> ```gherkin
> ### Scenario: User views all credit cards in a modal
> Given there are registered credit cards
> When I click "View All" in the Credit Card section
> Then a modal is displayed with the list of all credit cards
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
> ```gherkin
> ### Scenario: User views all bank accounts in a modal
> Given there are registered bank accounts
> When I click "View All" in the Bank Account section
> Then a modal is displayed with the list of all bank accounts
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
> ```gherkin
> ### Scenario: Customer page loads without noticeable delay
> When I access the Customers page
> Then all content is displayed within 2 seconds
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
> ```gherkin
> ### Scenario: Loading indicators are displayed while data is being loaded
> When data in a section is loading
> Then a loading indicator is displayed in the respective section
> 
> ### Scenario: No blank screen occurs when reloading the page
> When I reload the Customers page
> Then all sections are displayed, with no blank screen
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
> ```gherkin
> ### Scenario: Customer page loads with empty lists
> Given the customer has no credit cards, bank accounts, or servicing information
> When I access the Customers page
> Then each section shows its labels but the values are empty and no error is displayed
> 
> ### Scenario: User without edit permission cannot edit data
> Given I do not have edit permission
> When I try to edit customer information
> Then the fields are hidden
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
![1035-stg-OK-SemPermissaoNaoEditaDados-_1_](/uploads/64e8c91fb3c1e36abcb8c22900c94f34/1035-stg-OK-SemPermissaoNaoEditaDados-_1_.png){width=315 height=705}![1035-stg-OK-SemPermissaoNaoEditaDados-_2_](/uploads/d1efe85c8f3ab5410adfb0460bba9d64/1035-stg-OK-SemPermissaoNaoEditaDados-_2_.png){width=1429 height=760}![1035-stg-OK-SemPermissaoNaoEditaDados-_3_](/uploads/b207d327911d74f0644094c8909cbb55/1035-stg-OK-SemPermissaoNaoEditaDados-_3_.png){width=1429 height=760}
>
> ```gherkin
> ### Scenario: System handles backend error gracefully
> When the backend returns an error when fetching or saving data
> Then an error message is displayed to the user
> And the page does not freeze or show a blank screen
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
> ```gherkin
> ### Scenario: Activity log loads and paginates correctly
> When I open the activity log
> Then I see the entries with pagination and filters
> And when I change the number of rows or filters, the data is reloaded correctly
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
> ```gherkin
> ### Scenario: Customer page works in all supported browsers
> When I access the Customers page in any supported browser
> Then the page loads and works as expected
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
> ```gherkin
> ### Scenario: Add credit card when none are registered
> Given there is no registered credit card
> When I click "Add Credit Card" and fill in the required fields
> Then the new credit card is displayed in the section and saved in the backend
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>

            ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in stg

            ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
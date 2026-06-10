-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/384

UOWN | Servicing | Improve Display of Long text logs in the Notes (Servicing & Origination)

Synopsis
In both the Servicing and Origination Portals, when users encounter long text entries in the Notes section (at the bottom of the page),
the system currently applies a scrollable area within each note. While this prevents excessive vertical stretching of the column and maintains visual structure, 
users have reported difficulty reading long notes in this format.

See the mpckup below

Business Objective
Enhance user experience by improving how long note entries are displayed and accessed, ensuring easier reading and navigation without compromising layout or functionality.
This improvement targets a frequent user activity, reviewing historical logs and aims to make it more intuitive and efficient.

Feature Request | Business Requirements


        
      
Consistent Row Size
All log rows in the Notes table must maintain a fixed height by default.   
Expandable Rows (Individual)
      For logs with text exceeding the display limit, show a downward arrow icon indicating the entry can be expanded.
      Clicking this arrow should expand only that specific log row to display the full text.
      Clicking again should collapse the log back to default view. 
Expand/Collapse All
      Add a downward arrow icon in the Notes header/title.
      When clicked, this should expand all long-text logs at once.
      When clicked again, it should collapse all expanded logs back to default.
UI/UX Guidelines
      The expansion should be smooth and clearly distinguish between expanded and collapsed states.
      Ensure icons are intuitive and consistent with the portal’s current design.


Pages that display the activity logs table:
Origination

merchant
lead
programs

Servicing

customer

As you can see in the ticket attachments, Yuri created a mockup that was used to implement the new changes.
You must validade the table functionality, and guarantee that the logs are displayed correctly and the users can 'open' and 'close' 
the logs and see them without encountering errors or missing information.

-----

UOWN | Servicing | Melhorar a exibição de logs de texto longo em Notas (Servicing & Origination)

Sinopse
Em ambos os Portais de Servicing e Origination, quando os usuários encontram entradas de texto longas na seção de Notas (na parte inferior da página),
o sistema atualmente aplica uma área rolável dentro de cada nota. Embora isso evite o alongamento vertical excessivo da coluna e mantenha a estrutura visual,
usuários relataram dificuldade para ler notas longas nesse formato.

Veja o mpckup abaixo

Objetivo de Negócio
Aprimorar a experiência do usuário melhorando a forma como entradas de notas longas são exibidas e acessadas, garantindo leitura e navegação mais fáceis sem comprometer o layout ou a funcionalidade.
Essa melhoria tem como alvo uma atividade frequente do usuário — revisar logs históricos — e visa torná-la mais intuitiva e eficiente.

Solicitação de Recurso | Requisitos de Negócio

Tamanho de Linha Consistente
Todas as linhas de log na tabela de Notas devem manter uma altura fixa por padrão.
Linhas Expansíveis (Individuais)
Para logs com texto que exceda o limite de exibição, mostrar um ícone de seta para baixo indicando que a entrada pode ser expandida.
Ao clicar nessa seta, somente aquela linha de log específica deve ser expandida para exibir o texto completo.
Ao clicar novamente, o log deve ser recolhido de volta à visualização padrão.
Expandir/Recolher Tudo
Adicionar um ícone de seta para baixo no cabeçalho/título de Notas.
Ao clicar, isso deve expandir todos os logs de texto longo de uma vez.
Ao clicar novamente, isso deve recolher todos os logs expandidos de volta ao padrão.
Diretrizes de UI/UX
A expansão deve ser suave e distinguir claramente entre os estados expandido e recolhido.
Garantir que os ícones sejam intuitivos e consistentes com o design atual do portal.

Páginas que exibem a tabela de logs de atividade:
Origination
merchant
lead
programs

Servicing
customer

Como você pode ver nos anexos do ticket, Yuri criou um mockup que foi usado para implementar as novas alterações.
Você deve validar a funcionalidade da tabela e garantir que os logs sejam exibidos corretamente e que os usuários possam “abrir” e “fechar”
os logs e visualizá-los sem encontrar erros ou informações ausentes.

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

R7.1.25.43.0_ImproveDisplayOfLongTextLogsInTheNotes_Ticket384

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verifique a estrutura de log que tenho no projeto,
Preciso de um metodo que aceita parametro adicionar buscar pegar
quando o parametro esta true chama o metodo de adicionar, buscar ou pegar
dentro de cada metodo tem o codigo para fazer as acoes
se eu nao quero usar um metodo no outro eu so nao chamo ele
Deixe o metodo o mais genérifo possivel porque dai posso usar em todos as paginas que tem log
por exemplo, para adicionar log passo true para o metodo pai e no feature eu informo os dados do log que será adicionado
para buscar eu informo a notes userID ou logActivity eu quero e dai o metodo preenche ou seleciona no campo correto
para pegar o log eu passo a notes do log e ele é encontrado

O fluxo deve ser:
Adicionar log com um tipo que não existe em Log Activity e texto lorem ipsum muito grande
Validar se o tipo de log selecionado na criação do log está disponivel para selecionar em Log Activity

Buscar pelo log inserindo uma parte do texto da nota usando o campo de busca notes
Validar se o log criado é encontrado na tabela de logs

Adicionar log com um tipo que existe em Log Activity e texto lorem ipsum médio
Validar se o tipo de log selecionado na criação do log está disponivel para selecionar em Log Activity

Buscar pelo log inserindo o userId usando o campo de busca User id
Validar se o log criado é encontrado na tabela de logs

Adicionar log com um tipo que não existe em Log Activity e texto lorem ipsum muito grande
Validar se o tipo de log selecionado na criação do log está disponivel para selecionar em Log Activity

Buscar pelo log selecionando o tipo selecionado ao criar o log usando o select de busca Log Activity
Validar se o log criado é encontrado na tabela de logs

clicar no icone na coluna notes da tabela de logs, isso deve expandir todos os logs de texto longo de uma vez.
Validar que os logs com icone de expansão expandiram
Validar que A expansão deve ser suave e distinguir claramente entre os estados expandido e recolhido

clicar novamente no icone na coluna notes da tabela de logs, isso deve recolher todos os logs expandidos de volta ao padrão
Validar que os logs com icone de expansão reduziram
Validar que ao reduzir deve ser suave e distinguir claramente entre os estados expandido e recolhido

Clicar no icone na frente da nota de texto longo na tabela de logs, isso deve expandir todos os logs de texto longo de uma vez.
Validar que os logs com icone de expansão expandiram

Ao clicar novamente no icone na frente da nota de texto longo na tabela de logs, isso deve recolher todos os logs expandidos de volta ao padrão.
Validar que os logs com icone de expansão reduziram

-----

Adicionar log
selecionar tipo de log
inserir texto log
salvar

filtrar log
clicar para expandir filtro(criar estrutura para validar antes do click se ja esta expandido)
Preencher parametro de busca(campos texto notes e UserId) ou selecionar log activity(react-select)
clicar em buscar

Criar validação que verifica a adição do tipo de log em log activity quando criado um log com o tipo

buscar por log na tabela
verificar no projeto estrutura para percorrer as colunas e linhas para selecionar o registo que foi passado

criar uma estrutura para ser possivel buscar na tabela de log por log com texto grande e log que contem o icone de expansao para visualizar todo o texto

so converse comigo em portugues
Nao use primeira pessoa para criar os cenários
Sempre priorize o comportamento para criar os cenários 
quando for criar algo novo verifique no projeto se ja temos metodos prontos para reutilizar
importante conferir se o metodo existe em CommonHelpers
prints e comentarios deixe em ingles
Se precisar de estrutura de banco de dados tenho em DAtabaseUtil
Se precisar de estrutura de API tenho em ApiSteps
Insira try catch onde é necessários
para digitar sempre use ElementUtility.sendkeys()
para clicar sempre use ElementUtility.click() ou ElementUtility.clickButtonByIterable()
Para criar novos metodos sempre prioriza user/reaproveitar veriFyPanel, getByType, ValidationType, validateColumnValues, accessPortal, insertData, PageConfig, Portal
Na criade um método ou função sempre foque em deixar o mais genérico e reutilizavel possivel


Criei o fluxo R7.1.25.43.0_ImproveDisplayOfLongTextLogsInTheNotes_Ticket384 para fazer isso
No fluxo ja tenho acesso a todas as paginas que preciso para fazer realizar o processo.
deixei um comentário #PROCESSO DE LOG# 
onde é necessário Realizar o processo que montamos

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

> ## Tests in qa2
> ```gherkin
>
> ### Scenario: Improve display of long text logs
> When Navigate to merchants page
> And Filter merchants by Ref Merchant Code
> And Add log with type INTERNAL and note "UI LongLog Test INTERNAL - Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non dui. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas."malesuada fames ac turpis egestas".
> And Search logs by notes "UI LongLog Test" userId "" type "INTERNAL"
> Then Should see log of type "INTERNAL" containing "UI LongLog Test" in notes
> When Expand all long log notes
> And Collapse all long log notes
> And Navigate to the individual customer page and get the accountPk
> And Search logs by notes "Created" userId "" type "CORRESPONDENCE"
> Then Should see log of type "CORRESPONDENCE" containing "Created" in notes
> When Expand all long log notes
> And Collapse all long log notes
> And Validate customer page information
> And Test merchant portal quick search methods
> And Transfer to servicing main page
> And Log in to service portal
> And Open customer information
> And Add log with type INTERNAL and note "UI LongLog Test INTERNAL - Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non dui. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas."
> And Search logs by notes "UI LongLog Test" userId "" type "INTERNAL"
> Then Should see log of type "INTERNAL" containing "UI LongLog Test" in notes
> When Expand all long log notes
> And Collapse all long log notes
> Then Test is successful
> | PASS | LeadPk: 13377 | AccountPk:10761 | Merchant: Progress Mobility | 
> ```
>
>
[R7.1.25.43.0_ImproveDisplayOfLongTextLogsInTheNotes_Ticket384_QA2_2025_08_24_0541_35320.html](/uploads/27534701838aa17277c3a8bedeafbe2a/R7.1.25.43.0_ImproveDisplayOfLongTextLogsInTheNotes_Ticket384_QA2_2025_08_24_0541_35320.html)
>
>
>

"-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok i qa2

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1121

UOWN | Origination | Enhance Select All Checkbox to Merchant Setting Page

Synopsis
As a system user, I want the Select All checkbox to select all items returned by a search (not just the current page) so that I can perform bulk actions or downloads without missing results hidden by pagination.
Currently, when using the Select All checkbox, only the items visible on the current page are selected (up to 100 results). This creates problems for users who need to download or apply actions to all search results when the query spans multiple pages.

Take a look on Screenshot Section
Fix this behavior in Merchant Setting page.


Business Objective
The limitation prevents efficient bulk operations and requires repetitive manual work, reducing productivity. By updating the Select All behavior, users will:
    Save time by applying actions across all results at once.
    Avoid errors or omissions caused by pagination.
    Benefit from a consistent experience with the Funding page, where this feature has already been implemented.


Feature Request | Business Requirements
    Update the Select All checkbox to apply to all search results, not only the current page.
    Ensure the checkbox action persists across paginated results (beyond the 100 items visible per page).
    Add a hover description to the checkbox with the text: “SELECT ALL”.
    Maintain consistency with the Funding page implementation.
    Confirm that bulk actions (e.g., download, updates) apply correctly to the full dataset selected.
    Ensure performance is not degraded when handling large result sets.


Test instructions
The select all option in the "merchant settings" on origination portal used to update only the visible merchants in the page;
Now it should update the merchants on all pages, along that change a modal should be displayed to confirm modification to multiple pages.

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Originação | Aprimorar a caixa de seleção “Selecionar tudo” na página de Configurações do Comerciante


Sinopse
Como usuário do sistema, quero que a caixa de seleção Select All selecione todos os itens retornados por uma busca (não apenas a página atual) 
para que eu possa realizar ações em massa ou downloads sem perder resultados ocultos pela paginação.
Atualmente, ao usar a caixa de seleção Select All, apenas os itens visíveis na página atual são selecionados (até 100 resultados). Isso cria problemas para usuários que precisam baixar ou aplicar ações a todos os resultados da busca quando a consulta abrange várias páginas.

Dê uma olhada na seção de capturas de tela (Screenshot Section).
Corrija esse comportamento na página Merchant Setting.


Objetivo de Negócio
A limitação impede operações em massa eficientes e exige trabalho manual repetitivo, reduzindo a produtividade. Ao atualizar o comportamento do Select All, os usuários irão:
Economizar tempo aplicando ações em todos os resultados de uma só vez.
Evitar erros ou omissões causados pela paginação.
Se beneficiar de uma experiência consistente com a Funding page, onde esse recurso já foi implementado.


Solicitação de Recurso | Requisitos de Negócio
Atualizar a caixa de seleção Select All para aplicar a todos os resultados da busca, não apenas à página atual.
Garantir que a ação da caixa de seleção persista através de resultados paginados (além dos 100 itens visíveis por página).
Adicionar uma descrição ao passar o mouse (hover) na caixa de seleção com o texto: “SELECT ALL”.
Manter a consistência com a implementação da Funding page.
Confirmar que as ações em massa (por exemplo, download, atualizações) se aplicam corretamente ao conjunto completo de dados selecionados.
Garantir que o desempenho não seja degradado ao lidar com grandes conjuntos de resultados.


Instruções de Teste
A opção select all nas “merchant settings” no portal de originação costumava atualizar apenas os comerciantes visíveis na página;
Agora ela deve atualizar os comerciantes em todas as páginas e, junto com essa mudança, um modal deve ser exibido para confirmar a modificação em múltiplas páginas.


-------------------------------------------------------------------------------------------------------------------------------------------------------------------------

When Usuário acessa Configurações do Comerciante
And clica em select all
Then Todos os itens retornados pela busca devem ser selecionados
E Passar o mouse (hover) na caixa de seleção deve exibir o texto: “SELECT ALL”.
When Salvar alterações com merchants selecinados em múltiplas páginas
Then Modal deve ser exibida para confirmar a modificação em múltiplas páginas
When Clicar para fazer download dos resultados retornados pela busca 
Then Deve baixar todos os resultados retornados pela busca 

-----

marcar e navegar pelas paginas validando que esta tudo selecionado
ERRO
    --> Selecionar todos os resultados e mudar quantidade de resultados exibidos remove marcação
    --> Selecionar todos os resultados e mudar página remove marcação  

Filtrar merchants, selecionar tudo e atualizar, verificar se todos os merchants foram atualizados
OK
ERRO ao atualizar todos os merchants inserindo notes
ERRO ao atualizar todos os merchants inserindo todos os programas

Atualizar todos os merchants e verificar desempenho
OK 2 segundos
--> Não atualiza, fica travado.

-->Hover com mensagem SELECT ALL nao está funcionando

-----

Marcos, sobre a 1121:

Ao selecionar todos ou alguns resultados e alterar a quantidade de itens exibidos, a seleção é removida.

Ao selecionar todos ou alguns resultados e mudar de página, a seleção é removida.

Ao selecionar todos os merchants e tentar inserir uma nota em todos, o sistema trava e o processo não é concluído.

Ao atualizar programas para um conjunto com mais de 30 merchants, ocorre “Unexpected server error” e o processo não é concluído.

Ao passar o mouse sobre o checkbox de “Selecionar tudo”, o tooltip/hover “SELECT ALL” não é exibido.

Ao marcar vários checkboxes individualmente (sem usar “Selecionar tudo”), a interface indica erroneamente que todos foram selecionados.

-----

1. ~~Ao selecionar todos ou alguns resultados e alterar a quantidade de itens exibidos, a seleção é removida.~~
2. ~~Ao selecionar todos ou alguns resultados e mudar de página, a seleção é removida.~~
3. Ao selecionar todos os merchants e tentar inserir uma nota em todos, o sistema trava e o processo não é concluído.
4. Ao atualizar programas para um conjunto com mais de 30 merchants, ocorre “Unexpected server error” e o processo não é concluído.
5. Ao passar o mouse sobre o checkbox de “Selecionar tudo”, o tooltip/hover “SELECT ALL” não é exibido.
6. ~~Ao marcar vários checkboxes individualmente (sem usar “Selecionar tudo”), a interface indica erroneamente que todos foram selecionados.~~
 
-----



> ## Tests in qa1

@marcos.pacheco.silva I ran into issues when adding notes and programs to all merchants.

- When selecting up to 50 merchants and trying to add all programs, it takes an average of 5 minutes.
![Screenshot_49](/uploads/a954012e08ff2a0d4ae813e5b7833d42/Screenshot_49.png){width=959 height=743}
![Screenshot_50](/uploads/02611a13282cc09fab6f2861c3eb3122/Screenshot_50.png){width=1440 height=743}

- If more than 50 are selected, it returns “Unexpected Server Error.”


- When all merchants are selected and a note insertion is requested, the screen freezes and the process does not complete.

------------------------------------------------------------------------------------------------------------------------------------------------------------------------- 

3. Ao selecionar todos os merchants e tentar inserir uma nota em todos, o sistema trava e o processo não é concluído.
4. Ao atualizar programas para um conjunto com mais de 50 merchants, ocorre “Unexpected server error” e o processo não é concluído.
5. Ao passar o mouse sobre o checkbox de “Selecionar tudo”, o tooltip/hover “SELECT ALL” não é exibido.
---
- When selecting up to 50 merchants and trying to add all programs, it takes an average of 5 minutes.
- If more than 50 are selected, it returns “Unexpected Server Error.”
- When all merchants are selected and a note insertion is requested, the screen freezes and the process does not complete.

Atualizacao de massa de Sales Rep Code para 15 merchants
213 merchants sao configurados em massa para o numero de dias de expiracao da aprovacao para 1 dia
212 merchants recebem uma nota interna 
Todos os programas sao incluidos em 31 merchants
-----

---
**Mass update of Sales Rep Code for 15 merchants**


---

**213 merchants are configured in bulk for the number of approval expiration days to 1 day**


---

**212 merchants receive an internal note**


---

**All programs are included in 31 merchants**


---

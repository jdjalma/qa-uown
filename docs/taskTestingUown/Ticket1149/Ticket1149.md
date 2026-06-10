----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1149


UOWN | Origination | Add Program Group Filter Dropdown to Programs Page


Synopsis
Currently, on the Programs page in the Origination Portal, the filter section allows users to search by Program Name.
To improve usability and make it easier to find grouped programs, a new dropdown filter field must be added for Program Group selection.
The new filter must function like a searchable dropdown, allowing the user to type within it to locate a specific group.
Once selected, the system should return all programs associated with that chosen group.


Business Objective
Introducing a Program Group filter enhances the user experience and efficiency of managing programs.

This will allow users to:
Quickly identify programs that belong to a particular group.
Reduce manual search effort.
Simplify program organization and analysis for business and support teams.


Feature Request | Business Requirements
New Filter Field
      Add a new dropdown field to the Programs page filter area labeled “Program Group”.
      The dropdown must support typing and searching (searchable dropdown).
Filter Functionality
    When a Program Group is selected, the table should display only programs that belong to that specific group.
UI/UX
    Maintain consistency with the existing filter styling and behavior.  
Validation and Testing
    Verify that selecting a group correctly filters the results.

![alt text](image.png)


Test Steps
![alt text](image-1.png)

You must check that the user is able to filter the programs by the group name
The search feature must still working as it was
Test if the pagination still working with and without the filters

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

**UOWN | Origination | Adicionar Filtro de Grupo de Programas na Página de Programas**


### **Sinopse**
Atualmente, na página de Programas no Portal Origination, a seção de filtros permite que os usuários busquem por Nome do Programa. Para melhorar a usabilidade e facilitar a localização de programas agrupados, um novo campo de filtro do tipo dropdown deve ser adicionado para a seleção de Grupo de Programas. O novo filtro deve funcionar como um dropdown pesquisável, permitindo ao usuário digitar para localizar um grupo específico. Uma vez selecionado, o sistema deve retornar todos os programas associados ao grupo escolhido.


### **Objetivo do Negócio**
A introdução de um filtro para Grupo de Programas melhora a experiência do usuário e a eficiência no gerenciamento dos programas. Isso permitirá que os usuários:

* Identifiquem rapidamente programas que pertencem a um grupo específico.
* Reduzam o esforço de busca manual.
* Simplifiquem a organização e análise de programas para as equipes de negócios e suporte.


### **Requisitos de Funcionalidade | Requisitos de Negócio**

**Novo Campo de Filtro**
* Adicionar um novo campo de filtro do tipo dropdown à área de filtros da página de Programas, intitulado "Grupo de Programas".
* O dropdown deve suportar digitação e busca (dropdown pesquisável).

**Funcionalidade do Filtro**
* Quando um Grupo de Programas for selecionado, a tabela deve exibir apenas os programas pertencentes a esse grupo específico.

**UI/UX**
* Manter a consistência com o estilo e comportamento dos filtros existentes.


**Validação e Testes**

* Verificar se a seleção de um grupo filtra corretamente os resultados.
![alt text](image.png)

### **Passos para Teste**
![alt text](image-1.png)

1. Verificar se o usuário é capaz de filtrar os programas pelo nome do grupo.
2. A funcionalidade de busca deve continuar funcionando como antes.
3. Testar se a paginação ainda funciona com e sem os filtros.

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

1. Quando um usuário acessa a página Programs no Origination Portal, um novo campo de filtro dropdown intitulado "Program Group" deve estar visível na seção de filtros ao lado do filtro de busca por Program Name, mantendo consistência com o estilo e comportamento dos filtros existentes
1. When a user accesses the Programs page in the Origination Portal, a new dropdown filter field titled "Program Group" should be visible in the filter section next to the existing Program Name filter, maintaining consistency with the style and behavior of the existing filters

2. Quando um usuário clica no dropdown "Program Group" na página Programs, uma lista pesquisável de todos os grupos de programas disponíveis deve ser exibida, permitindo que o usuário digite para buscar um grupo específico sem necessidade de recarregar a página
2. When a user clicks on the "Program Group" dropdown on the Programs page, a searchable list of all available program groups should be displayed, allowing the user to type and search for a specific group without needing to reload the page

3. Quando um usuário seleciona um Program Group específico no dropdown de filtro da página Programs e realiza a busca, a tabela deve ser atualizada imediatamente exibindo apenas os programas que pertencem ao grupo selecionado
3.When a user selects a specific Program Group in the filter dropdown on the Programs page and performs the search, the table should be immediately updated to display only the programs that belong to the selected group

4. Quando um usuário mantém o filtro de busca por Program Name e seleciona um Program Group simultaneamente na página Programs, o sistema deve aplicar ambos os filtros juntos, exibindo apenas programas que correspondem ao nome E pertencem ao grupo selecionado
4. When a user keeps the Program Name search filter and selects a Program Group simultaneously on the Programs page, the system should apply both filters together, displaying only programs that match the name AND belong to the selected group

5. Quando um usuário limpa ou deseleciona o filtro "Program Group" e realiza busca, na página Programs após ter feito uma seleção, a tabela deve retornar a exibir todos os programas disponíveis (ou apenas os filtrados por busca se houver), restaurando o comportamento padrão sem perda de dados
5. When a user clears or deselects the "Program Group" filter and performs a search on the Programs page after making a selection, the table should return to displaying all available programs (or only those filtered by search if applicable), restoring the default behavior without any data loss

---

> ## Tests in qa1


> ```gherkin

> **When a user accesses the Programs page in the Origination Portal, a new dropdown filter field titled "Program Group" should be visible in the filter section next to the existing Program Name filter, maintaining consistency with the style and behavior of the existing filters**

> !

> **| PASS |**
> ```

---

> ```gherkin

> **When a user clicks on the "Program Group" dropdown on the Programs page, a searchable list of all available program groups should be displayed, allowing the user to type and search for a specific group without needing to reload the page**

> !

> **| PASS |**
> ```

---

> ```gherkin

> **When a user selects a specific Program Group in the filter dropdown on the Programs page and performs the search, the table should be immediately updated to display only the programs that belong to the selected group**

> !

> **| PASS |**
> ```

---

> ```gherkin

> **When a user keeps the Program Name search filter and selects a Program Group simultaneously on the Programs page, the system should apply both filters together, displaying only programs that match the name AND belong to the selected group**

> !

> **| PASS |**
> ```

---

> ```gherkin

> **When a user clears or deselects the "Program Group" filter and performs a search on the Programs page after making a selection, the table should return to displaying all available programs (or only those filtered by search if applicable), restoring the default behavior without any data loss**

> !

> **| PASS |**
> ```

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
STG

> ## Tests in stg


> ```gherkin

> **When a user accesses the Programs page in the Origination Portal, a new dropdown filter field titled "Program Group" should be visible in the filter section next to the existing Program Name filter, maintaining consistency with the style and behavior of the existing filters**

> ![Screenshot_at_Nov_16_11-14-51](/uploads/f79243bd90622baff34fc3e5f2c8b078/Screenshot_at_Nov_16_11-14-51.png){width=900 height=179}

> **| PASS |**
> ```

---

> ```gherkin

> **When a user clicks on the "Program Group" dropdown on the Programs page, a searchable list of all available program groups should be displayed, allowing the user to type and search for a specific group without needing to reload the page**

> ![Screenshot_at_Nov_16_11-15-51](/uploads/a74edb1db4a85e09eea34def55a00932/Screenshot_at_Nov_16_11-15-51.png){width=900 height=438}

> **| PASS |**
> ```

---

> ```gherkin

> **When a user selects a specific Program Group in the filter dropdown on the Programs page and performs the search, the table should be immediately updated to display only the programs that belong to the selected group**

> ![Screenshot_at_Nov_16_11-16-23](/uploads/159048ba03489343ae7f543732b7984d/Screenshot_at_Nov_16_11-16-23.png){width=900 height=430}
> ![Screenshot_at_Nov_16_11-16-32](/uploads/c8458b045f1dad43089c94b062f5c7c9/Screenshot_at_Nov_16_11-16-32.png){width=900 height=572}
> ![Screenshot_at_Nov_16_11-17-27](/uploads/3e66d4facdae599bd01d475f5fff6bf7/Screenshot_at_Nov_16_11-17-27.png){width=900 height=441}
> ![Screenshot_at_Nov_16_11-20-55](/uploads/aba224612f861c524d2480c42c2513b6/Screenshot_at_Nov_16_11-20-55.png){width=900 height=445}

> **| PASS |**
> ```

---

> ```gherkin

> **When a user keeps the Program Name search filter and selects a Program Group simultaneously on the Programs page, the system should apply both filters together, displaying only programs that match the name AND belong to the selected group**

> ![image](/uploads/9628dd6ced30464c69bb22b8b223dc65/image.png){width=782 height=600}

> ![Screenshot_at_Nov_16_11-22-02](/uploads/9de1d8c9db49bc85e3202dd0ee618bbe/Screenshot_at_Nov_16_11-22-02.png){width=900 height=403}

> **| PASS |**
> ```

---

> ```gherkin

> **When a user clears or deselects the "Program Group" filter and performs a search on the Programs page after making a selection, the table should return to displaying all available programs (or only those filtered by search if applicable), restoring the default behavior without any data loss**

> **| PASS |**
> ```

---

> ```gherkin

> ****

> **| PASS |**
> ```

---

> ```gherkin

> **When the system makes a call to the /uown/getAllMerchantPrograms API with the payload
{
    "search": "",
    "pageNumber": 0,
    "maxResults": 100,
    "groupName": "groupNameText"
}
then it should return status 200 with an array of programs where all items contain the property "groupName": "groupNameText"**

> ![Screenshot_at_Nov_16_11-33-52](/uploads/b52b1635f87df703c15cae2bbdb98176/Screenshot_at_Nov_16_11-33-52.png){width=900 height=529}
> ![Screenshot_at_Nov_16_11-35-30](/uploads/d5a3e8b952857068d7b113782c4c4418/Screenshot_at_Nov_16_11-35-30.png){width=900 height=552}

> **| PASS |**
> ```

---
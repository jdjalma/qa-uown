---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1106


UOWN | Origination | Update Merchant Settings Page Programs Section to Display Programs by Group


Synopsis
* As a business user, I want to view and add programs by group so that I can quickly assign them without clicking on each program individually.
* Update the Programs section on the Merchant Settings page to display merchant programs grouped by their Group Name. Instead of having an “+” button for every program, provide an option to select groups or multiple programs, with a single “Add” button at the top.
Mockup on Attatchments


Business Objective
The current Merchant Settings page is cluttered and inefficient, requiring repetitive manual work. Group-based display and bulk selection will:
* Improve usability by organizing programs.
* Enable faster application of programs to merchants.
* Reduce repetitive clicking and manual assignment.


Feature Request | Business Requirements
* Modify the Merchant Settings page to display programs grouped by Group Name.
* Remove the “+” button for each individual program.
* Add an option to select a group, which auto-selects all programs under it.
* Allow users to select multiple individual programs as an alternative.
* Provide a single “Add” button at the top to apply selected groups/programs.
* Ensure program assignments are updated correctly in the merchant’s configuration.
* Validate that duplicate assignments are avoided.
    Maintain existing functionality while enhancing usability.


As the ticket description requests, you use these points for testing:
* Remove the “+” button for each individual program.
* Add an option to select a group, which auto-selects all programs under it.
* Allow users to select multiple individual programs as an alternative.
* Provide a single “Add” button at the top to apply selected groups/programs.
* Ensure program assignments are updated correctly in the merchant’s configuration.
* Validate that duplicate assignments are avoided.
* Maintain existing functionality while enhancing usability.

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# UOWN | Originação | Atualizar Seção de Programas da Página de Configurações do Comerciante para Exibir Programas por Grupo

Sinopse
* Como um usuário de negócios, eu quero visualizar e adicionar programas por grupo para que eu possa atribuí-los rapidamente sem clicar em cada programa individualmente.
* Atualizar a seção de Programas na página de Configurações do Comerciante para exibir programas do comerciante agrupados por seu Nome de Grupo. Em vez de ter um botão "+" para cada programa, fornecer uma opção para selecionar grupos ou múltiplos programas, com um único botão "Adicionar" no topo.
Mockup nos Anexos

Objetivo de Negócio
A página atual de Configurações do Comerciante está desorganizada e ineficiente, requerendo trabalho manual repetitivo. Exibição baseada em grupos e seleção em massa irão:
* Melhorar a usabilidade organizando os programas.
* Permitir aplicação mais rápida de programas aos comerciantes.
* Reduzir cliques repetitivos e atribuição manual.

Solicitação de Funcionalidade | Requisitos de Negócio
* Modificar a página de Configurações do Comerciante para exibir programas agrupados por Nome do Grupo.
* Remover o botão "+" de cada programa individual.
* Adicionar uma opção para selecionar um grupo, que auto-seleciona todos os programas sob ele.
* Permitir que usuários selecionem múltiplos programas individuais como alternativa.
* Fornecer um único botão "Adicionar" no topo para aplicar grupos/programas selecionados.
* Garantir que as atribuições de programas sejam atualizadas corretamente na configuração do comerciante.
* Validar que atribuições duplicadas sejam evitadas.
* Manter a funcionalidade existente enquanto melhora a usabilidade.

Como a descrição do ticket solicita, você usa estes pontos para teste:
* Remover o botão "+" de cada programa individual.
* Adicionar uma opção para selecionar um grupo, que auto-seleciona todos os programas sob ele.
* Permitir que usuários selecionem múltiplos programas individuais como alternativa.
* Fornecer um único botão "Adicionar" no topo para aplicar grupos/programas selecionados.
* Garantir que as atribuições de programas sejam atualizadas corretamente na configuração do comerciante.
* Validar que atribuições duplicadas sejam evitadas.
* Manter a funcionalidade existente enquanto melhora a usabilidade.

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Cria grupo
    Verificar BD
Insere programas no grupo
    Verificar BD
Clona programa 1 programa
    Verificar BD
Clonar 2 ou mais programas
    Verificar BD
Clona grupo
    Verificar BD

Insere programas clonados e nao clonados no grupo
    Verificar BD
Insere programas clonados e nao clonados no grupo clonado
    Verificar BD

Insere grupo de programa no merchant
    Verificar BD
    Verificar Log
Altera grupo de programa do merchant
    Verificar BD
    Verificar Log
Remove grupo de programa do merchant
    Verificar BD
    Verificar Log

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Cenário: Usuário adiciona em massa todos os programas de um novo grupo em mais de 30 comerciantes
    Dado que o usuário cria um novo grupo de programas
    E cria um novo programa
    E adiciona o programa criado ao grupo
    E adiciona outros programas existentes ao grupo
    Quando o usuário salva as alterações
    Então o usuário vê uma mensagem de sucesso "Grupo criado com sucesso"
    E o banco de dados contém o grupo e programas criados corretamente
    Quando o usuário acessa a página de Configurações do Comerciante
    E seleciona mais de 30 comerciantes ativos filtrados por categoria
    E seleciona o grupo de programas recém-configurado
    E seleciona todos os programas do grupo
    E clica em salvar alterações
    Então o usuário vê uma mensagem de sucesso "Programas adicionados com sucesso"
    E o banco de dados confirma que todos os programas do grupo foram adicionados aos comerciantes selecionados
    E o log de auditoria registra a adição em massa de programas aos comerciantes com timestamp e usuário

-----

> ## Tests in qa2

> ```gherkin
> ### Scenario: User bulk adds all programs from a new group to more than 30 merchants
> Given the user creates a new program group
> And creates a new program
> And adds the created program to the group
> And adds other existing programs to the group
> When the user saves the changes
> Then the user sees a success message "Group created successfully"
> And the database contains the group and programs created correctly
> When the user accesses the Merchant Settings page
> And selects more than 30 active merchants filtered by category
> And selects the newly configured program group
> And selects all programs from the group
> And clicks save changes
> Then the user sees a success message "Programs added successfully"
> And the database confirms all programs from the group were added to selected merchants
> And the audit log records the bulk addition of programs to merchants with timestamp and user
> 
> | PASS |
> 
> ```
![Screenshot_at_Oct_23_09-04-46](/uploads/0e107c3e49a6e1762a0b88a1d528d50f/Screenshot_at_Oct_23_09-04-46.png)
![Screenshot_at_Oct_23_09-05-08](/uploads/de560afd85a6d4fbb4e54b2c7cfffc05/Screenshot_at_Oct_23_09-05-08.png)
![Screenshot_at_Oct_23_09-08-38](/uploads/6e691972fe08e5bc7278889f7ba93fb6/Screenshot_at_Oct_23_09-08-38.png)
![Screenshot_at_Oct_23_09-18-04](/uploads/58d10284ced84ee1810e052e2fce84d3/Screenshot_at_Oct_23_09-18-04.png)
![Screenshot_at_Oct_23_09-28-22](/uploads/ffa4247943fa7b8ea055c24d155ae32d/Screenshot_at_Oct_23_09-28-22.png)
![Screenshot_at_Oct_23_09-39-46](/uploads/c7961059bae68a5e33e450fb5a45fa04/Screenshot_at_Oct_23_09-39-46.png)
![Screenshot_at_Oct_23_09-40-01](/uploads/f89119786f7fc2bc0a878985d5333047/Screenshot_at_Oct_23_09-40-01.png)
![Screenshot_at_Oct_23_09-40-58](/uploads/bf1b4a455b6f20e9212a7b3765d279f1/Screenshot_at_Oct_23_09-40-58.png)
![Screenshot_at_Oct_23_09-43-48](/uploads/bfc24aacf7bc171a52378ef5a2d04cbe/Screenshot_at_Oct_23_09-43-48.png)
![Screenshot_at_Oct_23_09-44-21](/uploads/e972e35995da15fc166231f9befacbcf/Screenshot_at_Oct_23_09-44-21.png)
![Screenshot_at_Oct_23_09-47-20](/uploads/71fdb3e92bfeb8bd429f71b8bf87733a/Screenshot_at_Oct_23_09-47-20.png)
![Screenshot_at_Oct_23_09-48-53](/uploads/8ce3d2d11f5eee3e17cdca30c827209d/Screenshot_at_Oct_23_09-48-53.png)
![Screenshot_at_Oct_23_09-49-13](/uploads/fb8de5e71290ba1c2d064fa380e930ef/Screenshot_at_Oct_23_09-49-13.png)
![Screenshot_at_Oct_23_09-49-39](/uploads/160b9f6e01bce9f810fb9ffeaaab8b0d/Screenshot_at_Oct_23_09-49-39.png)
![Screenshot_at_Oct_23_09-58-46](/uploads/a9aae950bf54db6d84267fc108f1f7d4/Screenshot_at_Oct_23_09-58-46.png)
![Screenshot_at_Oct_23_09-59-03](/uploads/b326645bdb816d25cee2dd14d8252c5f/Screenshot_at_Oct_23_09-59-03.png)
![Screenshot_at_Oct_23_10-03-55](/uploads/988ae216b41f73e54277cf592c6e70bd/Screenshot_at_Oct_23_10-03-55.png)

> ```gherkin
> ### Scenario: User changes a program's group and sees the changes reflected
> Given a program exists associated with a group
> When the user changes the program's group on the Programs page
> Then the programs list displays the program in the new group immediately
> When the user accesses the Merchant Settings page
> Then the "Program Group Name" field displays the program's new group
> When the user views the previous group on the Programs page
> Then the program no longer appears listed in the previous group
> And the database reflects the program's group change
> And the program's audit log displays the group change history with date/time and responsible user
> 
> | PASS |
> ```
![Screenshot_at_Oct_23_10-33-06](/uploads/cc09d998e3a8bf5362f22495c3ea4125/Screenshot_at_Oct_23_10-33-06.png)
![Screenshot_at_Oct_23_10-33-33](/uploads/1ba86bb0d326b2b8578ad50ec32832a6/Screenshot_at_Oct_23_10-33-33.png)
![Screenshot_at_Oct_23_10-36-37](/uploads/91f6842f36ad3beef85d2d5650e98cb7/Screenshot_at_Oct_23_10-36-37.png)
![Screenshot_at_Oct_23_10-37-09](/uploads/fd4e6e7b3f3e6fd27cb5a5fd18c23369/Screenshot_at_Oct_23_10-37-09.png)
![Screenshot_at_Oct_23_10-37-25](/uploads/03e9454d023c2723c932bfb73a9b5c7f/Screenshot_at_Oct_23_10-37-25.png)
![Screenshot_at_Oct_23_10-38-44](/uploads/fb0bca08b69e2b1fc1653e4d41d1f000/Screenshot_at_Oct_23_10-38-44.png)
![Screenshot_at_Oct_23_10-41-58](/uploads/4a0e67d37a0a5b0807eef878e4831611/Screenshot_at_Oct_23_10-41-58.png)
![Screenshot_at_Oct_23_10-43-45](/uploads/2ee3160aa47a9771f0b289ea5d52411e/Screenshot_at_Oct_23_10-43-45.png)
![Screenshot_at_Oct_23_10-44-40](/uploads/a11c64a07b3c837d05237c9aacfc4e7b/Screenshot_at_Oct_23_10-44-40.png)
![Screenshot_at_Oct_23_10-46-04](/uploads/29229c97d267e3099521b6b3a627a624/Screenshot_at_Oct_23_10-46-04.png)
![Screenshot_at_Oct_23_10-46-33](/uploads/e7547adb8dfd7401b67c0b0e99708fe0/Screenshot_at_Oct_23_10-46-33.png)


> ```gherkin
> ### Scenario: User removes programs in bulk by selecting group on merchant settings page
> Given merchants exist with assigned programs from a specific group
> When the user accesses the Merchant Settings page
> And selects active merchants filtered by category
> And selects the configured program group for removal
> And marks the option "Remove all programs from group"
> And confirms and saves the changes
> Then the user sees a success message "Programs removed successfully"
> And the database confirms all programs from the group were removed from selected merchants
> And the audit log records the bulk deletion of programs with details of affected merchants
> 
> | PASS |
> ```
![Screenshot_at_Oct_23_10-50-02](/uploads/4f84721c5f45d64d4c5c98c6cc48d632/Screenshot_at_Oct_23_10-50-02.png)
![Screenshot_at_Oct_23_10-50-17](/uploads/773761bb0f4a9ad4a98cdb6d21056d32/Screenshot_at_Oct_23_10-50-17.png)
![Screenshot_at_Oct_23_10-50-29](/uploads/6422423625883c6792465988490ed9d9/Screenshot_at_Oct_23_10-50-29.png)
![Screenshot_at_Oct_23_10-51-03](/uploads/df33fd8cb07477cd290ec7d5983994f5/Screenshot_at_Oct_23_10-51-03.png)
![Screenshot_at_Oct_23_10-51-23](/uploads/0d262f5811fbc1a1f7bff7b0a0862cf2/Screenshot_at_Oct_23_10-51-23.png)
![Screenshot_at_Oct_23_10-54-25](/uploads/a3fdd4d15cd04535d9077b0f1afdb972/Screenshot_at_Oct_23_10-54-25.png)
![Screenshot_at_Oct_23_10-54-43](/uploads/6d47d1b72ab34808aaafd082733eefc7/Screenshot_at_Oct_23_10-54-43.png)
![Screenshot_at_Oct_23_10-56-08](/uploads/f65bfbab7d695a39a93389981aab9fac/Screenshot_at_Oct_23_10-56-08.png)
![Screenshot_at_Oct_23_10-56-26](/uploads/6d12024c17dc8a154450d6702d335132/Screenshot_at_Oct_23_10-56-26.png)
![Screenshot_at_Oct_23_10-56-40](/uploads/8f31649bc0f1ab41ab7a673b610c63e4/Screenshot_at_Oct_23_10-56-40.png)
![Screenshot_at_Oct_23_10-56-55](/uploads/1f9358644a641325ee1a2a11ba298d07/Screenshot_at_Oct_23_10-56-55.png)
![Screenshot_at_Oct_23_10-57-07](/uploads/11212628abe4630b43b836017f6b131b/Screenshot_at_Oct_23_10-57-07.png)
![Screenshot_at_Oct_23_10-57-22](/uploads/a3d34045a8ab4812a65b81fc3dd98920/Screenshot_at_Oct_23_10-57-22.png)
![Screenshot_at_Oct_23_10-57-37](/uploads/e8a68707003d4b05c812dd168e2afd4a/Screenshot_at_Oct_23_10-57-37.png)
![Screenshot_at_Oct_23_10-57-52](/uploads/43fc9b343c33b8c278353c167b5d5c60/Screenshot_at_Oct_23_10-57-52.png)
![Screenshot_at_Oct_23_10-58-08](/uploads/f99b2e99ad45801dfdfe089a0609f1e0/Screenshot_at_Oct_23_10-58-08.png)
![Screenshot_at_Oct_23_10-58-21](/uploads/c39c3d4a4a93686c105636bc39b4eee6/Screenshot_at_Oct_23_10-58-21.png)
![Screenshot_at_Oct_23_10-58-36](/uploads/916ffffc66a0906716fd7aa26621a719/Screenshot_at_Oct_23_10-58-36.png)
![Screenshot_at_Oct_23_11-11-11](/uploads/7bfc7c0ca282deca931f9a4e58d8e270/Screenshot_at_Oct_23_11-11-11.png)

> ```gherkin
> ### Scenario: User applies all programs from a cloned group to more than 30 merchants
> Given the user clones an existing group
> And the group contains all available programs
> When the user applies all programs from the group
> And the application is performed for more than 30 merchants
> Then all programs should be successfully applied to the merchants
> And each merchant should receive all programs from the group
> And the system should display a success message confirming bulk application
> And the database should reflect all program assignments for each merchant
> And the audit log should record the bulk operation with timestamp and user details
> 
> | PASS |
> ```
![Screenshot_at_Oct_23_12-05-50](/uploads/26f2a62250aba0258dca62679a715ad8/Screenshot_at_Oct_23_12-05-50.png)
![Screenshot_at_Oct_23_12-06-21](/uploads/39ac8099a1f5b98a3644217e8315133c/Screenshot_at_Oct_23_12-06-21.png)
![Screenshot_at_Oct_23_12-07-03](/uploads/aef37cd55f4c8b74b47863bcd136174b/Screenshot_at_Oct_23_12-07-03.png)
![Screenshot_at_Oct_23_12-09-07](/uploads/f62ce2b502471039f3f53ef384955dbb/Screenshot_at_Oct_23_12-09-07.png)
![Screenshot_at_Oct_23_12-09-25](/uploads/1fe79ff3b2ef28d37a50898f5d0bfb2e/Screenshot_at_Oct_23_12-09-25.png)
![Screenshot_at_Oct_23_12-10-11](/uploads/53b4edca166c723b6b485412a71e13d5/Screenshot_at_Oct_23_12-10-11.png)
![Screenshot_at_Oct_23_12-30-21](/uploads/d0e3ea70490e616e5fdab5377d7566f2/Screenshot_at_Oct_23_12-30-21.png)
![Screenshot_at_Oct_23_12-31-56](/uploads/f7e0be41e0bfc82daa69ea16adb43c5c/Screenshot_at_Oct_23_12-31-56.png)
![Screenshot_at_Oct_23_12-32-18](/uploads/ef7856bba7b287d94bd844f5ab836722/Screenshot_at_Oct_23_12-32-18.png)
![Screenshot_at_Oct_23_12-38-32](/uploads/42276e0a37610ec83fea269220626717/Screenshot_at_Oct_23_12-38-32.png)
![Screenshot_at_Oct_23_12-39-40](/uploads/d212028889740b948b176fc7cd5a9591/Screenshot_at_Oct_23_12-39-40.png)

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------







































> ## Tests in stg

> ```gherkin
> ### Scenario: User bulk adds all programs from a new group to more than 30 merchants
> Given the user creates a new program group
> And creates a new program
> And adds the created program to the group
> And adds other existing programs to the group
> When the user saves the changes
> Then the user sees a success message "Group created successfully"
> And the database contains the group and programs created correctly
> When the user accesses the Merchant Settings page
> And selects more than 30 active merchants filtered by category
> And selects the newly configured program group
> And selects all programs from the group
> And clicks save changes
> Then the user sees a success message "Programs added successfully"
> And the database confirms all programs from the group were added to selected merchants
> And the audit log records the bulk addition of programs to merchants with timestamp and user
> 
> | PASS |
> 
> ```


> ```gherkin
> ### Scenario: User changes a program's group and sees the changes reflected
> Given a program exists associated with a group
> When the user changes the program's group on the Programs page
> Then the programs list displays the program in the new group immediately
> When the user accesses the Merchant Settings page
> Then the "Program Group Name" field displays the program's new group
> When the user views the previous group on the Programs page
> Then the program no longer appears listed in the previous group
> And the database reflects the program's group change
> And the program's audit log displays the group change history with date/time and responsible user
> 
> | PASS |
> ```



> ```gherkin
> ### Scenario: User removes programs in bulk by selecting group on merchant settings page
> Given merchants exist with assigned programs from a specific group
> When the user accesses the Merchant Settings page
> And selects active merchants filtered by category
> And selects the configured program group for removal
> And marks the option "Remove all programs from group"
> And confirms and saves the changes
> Then the user sees a success message "Programs removed successfully"
> And the database confirms all programs from the group were removed from selected merchants
> And the audit log records the bulk deletion of programs with details of affected merchants
> 
> | PASS |
> ```
> 

> ```gherkin
> ### Scenario: User applies all programs from a cloned group to more than 30 merchants
> Given the user clones an existing group
> And the group contains all available programs
> When the user applies all programs from the group
> And the application is performed for more than 30 merchants
> Then all programs should be successfully applied to the merchants
> And each merchant should receive all programs from the group
> And the system should display a success message confirming bulk application
> And the database should reflect all program assignments for each merchant
> And the audit log should record the bulk operation with timestamp and user details
> 
> | PASS |
> ```
> 

> **| PASS |**

---

**Removing all programs from all merchants**

> 

> **| PASS |**

---

**Inserting programs via API**

> 

> **| PASS |**

---





------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1104


UOWN | Origination | Add Group Name Field to Merchant Programs


Status: Open
Ticket created: 1 month ago by Yuri Araujo


Synopsis
As a business user, I want to assign merchant programs to groups so that I can organize and reuse them more efficiently.


Feature Summary:
Introduce a Group Name field for every merchant program.
The field should be presented as a dropdown, allowing the user to select an existing group or create a new one using a “+” button.


Business Objective
Currently, managing variations across programs for different merchants requires manual duplication and technical support.
By grouping programs, business users can:
Define default groups (e.g., a standard set of 18 programs auto-applied to new merchants).
Create custom groups (e.g., EPO 5%, EPO 10%) for specific conditions.
This reduces manual work, avoids errors, and provides flexibility for program management.


Feature Request / Business Requirements
Add a Group Name field to all merchant programs.
The field must be a dropdown showing available groups.
Include a “+” button option in the dropdown to allow creation of new groups directly from the interface.
Associate each merchant program with exactly one group.
Ensure new groups are immediately available for selection in other programs.
Update database schema and APIs to persist the group name with each program.
Provide validation to avoid duplicate group names.


Attachments
📎 Program Page - Add a Program Group in an Individual New Program.mp4
📷 Screenshot-1
📷 Screenshot-2

Steps to Reproduce
Go to the Program Page.
Click Add New Program.
Verify the presence of the Group Name dropdown.
Check that the “+” button allows creating new groups.
Ensure new groups appear in the list immediately after creation.


Activity Log
Yuri Araujo created and updated the ticket.
Davi Artur assigned as developer.
Priyanka Namburu set priority to high and advanced the workflow to ready-for-development.
Davi Artur mentioned in merge requests svc!1135 and frontend!1282 (merged).
José Mendes added as maintainer for testing.


Test Steps (by Davi Artur)
You must be able to create or select an existing program group.
You must be able to filter programs to be cloned by group name.
Check the search input; it should still work as before.

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Origination | Adicionar Campo Nome do Grupo em Programas de Comerciante

Status: Aberto
Tíquete criado: há 1 mês por Yuri Araujo

Sinopse

Como usuário de negócios, quero atribuir programas de comerciantes a grupos para organizá-los e reutilizá-los de forma mais eficiente.


Resumo da Funcionalidade:
Introduzir um campo Nome do Grupo para cada programa de comerciante.
O campo deve ser apresentado como um dropdown, permitindo ao usuário selecionar um grupo existente ou criar um novo usando o botão “+”.


Objetivo de Negócio
Atualmente, o gerenciamento de variações entre programas de diferentes comerciantes exige duplicação manual e suporte técnico.
Ao agrupar programas, os usuários de negócios poderão:
Definir grupos padrão (ex: um conjunto de 18 programas aplicados automaticamente a novos comerciantes).
Criar grupos personalizados (ex: EPO 5%, EPO 10%) para condições específicas.
Isso reduz o trabalho manual, evita erros e oferece flexibilidade na gestão de programas.


Solicitação da Funcionalidade / Requisitos de Negócio
Adicionar um campo Nome do Grupo em todos os programas de comerciante.
O campo deve ser um dropdown exibindo os grupos disponíveis.
Incluir um botão “+” no dropdown para criar novos grupos diretamente pela interface.
Associar cada programa de comerciante a apenas um grupo.
Garantir que novos grupos fiquem disponíveis imediatamente para seleção em outros programas.
Atualizar o schema do banco de dados e as APIs para persistir o nome do grupo em cada programa.
Adicionar validação para evitar nomes de grupos duplicados.


Anexos
📎 Program Page - Add a Program Group in an Individual New Program.mp4
📷 Captura de tela 1
📷 Captura de tela 2


Passos para Reproduzir
Acessar a página de Programas.
Clicar em Adicionar Novo Programa.
Verificar a presença do dropdown Nome do Grupo.
Confirmar que o botão “+” permite criar novos grupos.
Garantir que novos grupos apareçam imediatamente após a criação.


Registro de Atividade
Yuri Araujo criou e atualizou o tíquete.
Davi Artur designado como desenvolvedor.
Priyanka Namburu definiu a prioridade como alta e avançou o fluxo para pronto para desenvolvimento.
Davi Artur mencionado nos merge requests svc!1135 e frontend!1282 (mesclados).
José Mendes adicionado como mantenedor para testes.


Passos de Teste (por Davi Artur)
Deve ser possível criar ou selecionar um grupo de programa existente.
Deve ser possível filtrar os programas a serem clonados por nome de grupo.
O campo de busca deve continuar funcionando como antes.

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


 4 arquivos
+
55
−
2
Arquivos
4
Pesquisar (por exemplo, *.vue) (F)

components/
‎program-form‎

inde
‎x.tsx‎
+34 -1

domain
‎/stores‎

progr
‎am.tsx‎
+18 -0

pages/p
‎rograms‎

inde
‎x.tsx‎
+2 -0

serv
‎er.js‎
+1 -1

 components/program-form/index.tsx 
+
34
−
1

Visualizado
@@ -9,13 +9,14 @@ import {Frequencies} from '@enums/Frequencies';
import {LendingCategoryType} from '@enums/LendingCategoryType';
import classNames from 'classnames';
import {FormikProps} from 'formik';
import React, {useEffect} from 'react';
import React, {useEffect, useState} from 'react';
import {Col, Form, Row, Button} from 'reactstrap';
import styles from './index.module.scss';
import {convertStringToOptionType} from '@utils/helper';
import {faPercentage} from '@fortawesome/free-solid-svg-icons';
import {ProgramLog} from '@models';
import {CloneProgram} from '@components/clone-program';
import {showToast} from '@uownleasing/common-utilities';

interface ProgramFormProps {
  formik: FormikProps<any>;
@@ -29,6 +30,7 @@ interface ProgramFormProps {
    maxResults?: number,
    isGetAll?: boolean,
  ) => Promise<ResponseType>;
  getMerchantProgramsGroupName: () => Promise<ResponseType>;
}

const ProgramForm = (props: ProgramFormProps) => {
@@ -39,7 +41,11 @@ const ProgramForm = (props: ProgramFormProps) => {
    frequencyOverride,
    setProgramLogs,
    getAllMerchantPrograms,
    getMerchantProgramsGroupName,
  } = props;

  const [programGroups, setProgramGroups] = useState([]);

  const resetAll = () => {
    formik?.resetForm();
    setDisplayProgramScreen(false);
@@ -49,6 +55,20 @@ const ProgramForm = (props: ProgramFormProps) => {
    return () => setProgramLogs(defaultPaginatedResp([]));
  }, []);

  useEffect(() => {
    const loadProgramsGroup = async () => {
      const {data, status} = await getMerchantProgramsGroupName();

      if (status >= 400) {
        showToast('error', 'An error has occured to load the programs groups.');
        return;
      }

      setProgramGroups(data as string[]);
    };
    loadProgramsGroup();
  }, []);

  return (
    <Form id="addOrEditMerchantProgramForm" onSubmit={formik.handleSubmit}>
      <div className={styles.actionButtonsContainer}>
@@ -229,6 +249,19 @@ const ProgramForm = (props: ProgramFormProps) => {
            type="currency"
          />
        </Col>
        <Col xs={6} className="mb-2">
          <InputField
            formik={formik}
            name="groupName"
            label="Program Group"
            type="select"
            options={programGroups?.map((pg) => ({
              key: pg,
              value: pg,
              label: pg,
            }))}
          />
        </Col>
        <Col xs={12} className="mb-2">
          <InputField
            formik={formik}
 domain/stores/program.tsx 
+
18
−
0

Visualizado
@@ -87,6 +87,24 @@ export class ProgramStore extends BaseStore {
    return responseData;
  };

  @action
  getMerchantProgramsGroupName = async (): Promise<ResponseType> => {
    const utilityStore = this.rootStore?.utilityStore;
    const response = await utilityStore?.sendRequest({
      method: 'GET',
      url: '/uown/getMerchantProgramsGroupName',
      isHandleLoader: true,
    });

    const responseData: ResponseType = {
      status: response?.status || 500,
      message: response?.message || '',
      data: response?.data || []
    };

    return responseData;
  };

  @action
  getLogsForProgram = async (
    programPk: number,

---


 4 arquivos
+
16
−
0
Arquivos
4
Pesquisar (por exemplo, *.vue) (F)

src/main/java/co
‎m/uownleasing/svc‎

db/rep
‎ository‎

MerchantProg
‎ramRepo.java‎
+6 -0

po
‎jo‎

ProgramI
‎nfo.java‎
+1 -0

re
‎st‎

AdminContr
‎oller.java‎
+5 -0

ser
‎vice‎

MerchantProgr
‎amService.java‎
+4 -0

 src/main/java/com/uownleasing/svc/db/repository/MerchantProgramRepo.java 
+
6
−
0

Visualizado
@@ -30,6 +30,12 @@ public interface MerchantProgramRepo extends JpaRepository<MerchantProgram, Long
        "order by mp.rowCreatedTimestamp desc")
    List<MerchantProgram> findByMerchantPk(long merchantPk);

    @Query("select distinct mp.programInfo.groupName " +
        "from MerchantProgram mp " +
        "where mp.programInfo.groupName is not null " +
        "order by mp.programInfo.groupName")
    List<String> findDistinctGroupNames();

    @Query(value = "SELECT mp.* FROM uown_merchant_program mp " +
        "WHERE ((:search IS NULL) or (:search IS NOT NULL and mp.program_name ilike CAST(:search AS VARCHAR)))", nativeQuery = true)
    Page<MerchantProgram> findAllMerchantProgramsBySearch(String search,  Pageable pageable);
 src/main/java/com/uownleasing/svc/pojo/ProgramInfo.java 
+
1
−
0

Visualizado
@@ -45,6 +45,7 @@ public class ProgramInfo {
    private String states = "AK, AL, AR, AS, AZ, CA, CO, CT, DC, DE, FL, GA, GU, HI, IA, ID, IL, IN, KS, KY, LA, MA, MD, ME, MI, MN, MO, MP, MS, MT, NC, ND, NE, NH, NJ, NM, NV, NY, OH, OK, OR, PA, PR, RI, SC, SD, TN, TX, UM, UT, VA, VI, VT, WA, WI, WV, WY";
    private BigDecimal processingFeeOverride;
    private BigDecimal amountChargedAtSigning = BigDecimal.ZERO;
    private String groupName;

    public LendingCategoryType getLendingCategoryType() {
        return lendingCategoryType == null ? LendingCategoryType.LTO : lendingCategoryType;
 src/main/java/com/uownleasing/svc/rest/AdminController.java 
+
5
−
0

Visualizado
@@ -253,6 +253,11 @@ public class AdminController {
        return merchantProgramService.createOrUpdate(programInfo);
    }

    @GetMapping(value = "/getMerchantProgramsGroupName")
    public List<String> getMerchantProgramsGroupName() {
        return merchantProgramService.findDistinctGroupNames();
    }

    @PostMapping("/updateMerchants")
    public void updateMerchants(@RequestBody MerchantsUpdateRequest request) {
        merchantService.updateMerchants(request);
 src/main/java/com/uownleasing/svc/service/MerchantProgramService.java 
+
4
−
0

Visualizado
@@ -64,6 +64,10 @@ public class MerchantProgramService {
        return merchantProgramRepo.findByMerchantPk(merchantPk);
    }

    public List<String> findDistinctGroupNames() {
        return merchantProgramRepo.findDistinctGroupNames();
    }

    public MerchantProgram getMerchantProgramByProgramId(String programId){
        return merchantProgramRepo.findByProgramInfo_ProgramId(programId).orElse(null);
    }

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

O sistema deve exibir o campo "Program Group" como dropdown na página de criação de novo programa.
O sistema deve exibir o campo "Program Group" como dropdown na página de edição de programa existente.
O sistema deve carregar e exibir todos os grupos de programas disponíveis no dropdown "Program Group".
O sistema deve permitir ao usuário selecionar um grupo existente do dropdown "Program Group".
O sistema deve permitir ao usuário criar um novo grupo através do botão "+" no dropdown "Program Group".
O sistema deve tornar novo grupo disponível imediatamente para seleção após sua criação.
O sistema deve persistir o nome do grupo selecionado no banco de dados quando o programa é salvo.
O sistema deve retornar apenas grupos não nulos quando buscar grupos distintos via endpoint /getMerchantProgramsGroupName.
O sistema deve ordenar alfabeticamente os nomes dos grupos ao exibi-los no dropdown.
O sistema deve validar que não existem nomes de grupos duplicados no banco de dados.
O sistema deve permitir que cada programa de comerciante seja associado a exatamente um grupo.
O sistema deve exibir mensagem de erro quando falha ao carregar os grupos de programas.
O sistema deve filtrar corretamente os programas a serem clonados por nome de grupo.
O sistema deve manter a funcionalidade de busca por nome de programa independentemente do filtro de grupo.
O sistema deve adicionar o campo groupName ao ProgramInfo com persistência no banco de dados.
O sistema deve retornar a lista de nomes de grupos distintos através do endpoint GET /uown/getMerchantProgramsGroupName.
O sistema deve atualizar a query SQL para buscar grupos não nulos ordenados alfabeticamente.

---

```cucumber

O sistema deve exibir o campo "Program Group" como dropdown na página de criação de novo programa.
The system should display the "Program Group" field as a dropdown on the new program creation page.

O sistema deve exibir o campo "Program Group" como dropdown na página de edição de programa existente.
The system should display the "Program Group" field as a dropdown on the existing program edit page.

O sistema deve carregar e exibir todos os grupos de programas disponíveis no dropdown "Program Group".
The system should load and display all available program groups in the "Program Group" dropdown.

O sistema deve permitir ao usuário selecionar um grupo existente do dropdown "Program Group".
The system should allow the user to select an existing group from the "Program Group" dropdown.

O sistema deve tornar novo grupo disponível imediatamente para seleção após sua criação.
The system should make the new group immediately available for selection after its creation.
    ERROR -> Nao torna disponivel imediatamente

O sistema deve persistir o nome do grupo selecionado no banco de dados quando o programa é salvo.
The system should persist the selected group name in the database when the program is saved.

O sistema deve retornar apenas grupos não nulos quando buscar grupos distintos via endpoint /getMerchantProgramsGroupName.
The system should return only non-null groups when fetching distinct groups via endpoint /getMerchantProgramsGroupName.

O sistema deve ordenar alfabeticamente os nomes dos grupos ao exibi-los no dropdown.
The system should alphabetically sort group names when displaying them in the dropdown.

O sistema deve permitir que cada programa de comerciante seja associado a exatamente um grupo.
The system should allow each merchant program to be associated with exactly one group.

O sistema deve exibir mensagem de erro quando falha ao carregar os grupos de programas.
The system should display an error message when it fails to load program groups.

O sistema deve filtrar corretamente os programas a serem clonados por nome de grupo.
The system should correctly filter programs to be cloned by group name.

O sistema deve manter a funcionalidade de busca por nome de programa independentemente do filtro de grupo.
The system should maintain program name search functionality regardless of group filter.

O sistema deve adicionar o campo groupName ao ProgramInfo com persistência no banco de dados.
The system should add the groupName field to ProgramInfo with database persistence.

O sistema deve retornar a lista de nomes de grupos distintos através do endpoint GET /uown/getMerchantProgramsGroupName.
The system should return the list of distinct group names through the endpoint GET /uown/getMerchantProgramsGroupName.

O sistema deve atualizar a query SQL para buscar grupos não nulos ordenados alfabeticamente.
The system should update the SQL query to fetch non-null groups sorted alphabetically.
```

-----

The system should display the "Program Group" field as a dropdown on the new program creation page
The system should display the "Program Group" field as a dropdown on the existing program edit page
The system should load and display all available program groups in the "Program Group" dropdown
The system should load and display all available program groups in the "Program Group" dropdown
The system should make the new group immediately available for selection after its creation
    ERROR -> Nao torna disponivel imediatamente
The system should persist the selected group name in the database when the program is saved
The system should return only non-null groups when fetching distinct groups via endpoint /getMerchantProgramsGroupName
The system should alphabetically sort group names when displaying them in the dropdown
The system should allow each merchant program to be associated with exactly one group
The system should display an error message when it fails to load program groups
The system should correctly filter programs to be cloned by group name
The system should maintain program name search functionality regardless of group filter
The system should add the groupName field to ProgramInfo with database persistence
The system should update the SQL query to fetch non-null groups sorted alphabetically



> ```gherkin

> **The system should display the "Program Group" field as a dropdown on the new program creation page**

> 

> **| PASS |**
> ```

> ```gherkin

> **The system should display the "Program Group" field as a dropdown on the existing program edit page**

> 

> **| PASS |**
> ```

> ```gherkin

> **The system should load and display all available program groups in the "Program Group" dropdown**

> 

> **| PASS |**
> ```

> ```gherkin

> **The system should allow the user to select an existing group from the "Program Group" dropdown**

> 

> **| PASS |**
> ```

> ```gherkin

> **
The system should make the new group immediately available for selection after its creation
    ERROR -> Nao torna disponivel imediatamente**

> 

> **| ERROR |**
> ```

> ```gherkin

> **The system should persist the selected group name in the database when the program is saved**

> 

> **| PASS |**
> ```

> ```gherkin

> **The system should return only non-null groups when fetching distinct groups via endpoint /getMerchantProgramsGroupName**

> 

> **| PASS |**
> ```

> ```gherkin

> ****

> 

> **| PASS |**
> ```

> ```gherkin

> **The system should alphabetically sort group names when displaying them in the dropdown**

> 

> **| PASS |**
> ```

> ```gherkin

> **The system should allow each merchant program to be associated with exactly one group**

> 

> **| PASS |**
> ```

> ```gherkin

> **The system should display an error message when it fails to load program groups**

> 

> **| PASS |**
> ```

> ```gherkin

> **The system should correctly filter programs to be cloned by group name**

> 

> **| PASS |**
> ```

> ```gherkin

> ****

> 

> **| PASS |**
> ```

> ```gherkin

> **The system should maintain program name search functionality regardless of group filter**

> 

> **| PASS |**
> ```

> ```gherkin

> **The system should add the groupName field to ProgramInfo with database persistence**

> 

> **| PASS |**
> ```


> ```gherkin

> **The system should return the list of distinct group names through the endpoint GET /uown/getMerchantProgramsGroupName**

> 

> **| PASS |**
> ```




> ```gherkin

> **The system should update the SQL query to fetch non-null groups sorted alphabetically**

> 

> **| PASS |**
> ```

---


---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Quando o usuário remove um grupo ou associa um grupo a um programa que antes não possuía grupo, o log exibe incorretamente valores vazios ou null.

https://origination-qa2.uownleasing.com/merchant/B082922-10010514475_clone?from=merchantSetting
![alt text](image.png)


- `Quando um usuário remove um grupo de um programa ou associa um programa que antes não possuía grupo a um novo grupo, o sistema não deve gerar log com valores vazios ou null`
When a user removes a group from a program or associates a program that previously had no group with a new group, the system must not generate logs with empty or null values.

---

> ```gherkin

> **When a user removes a group from a program or associates a program that previously had no group with a new group, the system must not generate logs with empty or null values.**

> 

> **| ERROR |** When the user removes a group or associates a group with a program that previously had no group, the log incorrectly displays empty or null values.
> ```

---

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

2017 NC Program (Quick Pay 13mo 30% 11% Floor 1R)



Stg - 


> ```gherkin

> **The system should display the "Program Group" field as a dropdown on the new program creation page**

> 

> **| PASS |**
> ```

> ```gherkin

> **The system should display the "Program Group" field as a dropdown on the existing program edit page**

> 

> **| PASS |**
> ```

> ```gherkin

> **The system should load and display all available program groups in the "Program Group" dropdown**

> 

> **| PASS |**
> ```

> ```gherkin

> **The system should allow the user to select an existing group from the "Program Group" dropdown**

> 

> **| PASS |**
> ```

> ```gherkin

> **The system should display the programs screen when creating a new program group**

> 

> **| ERROR |**
> ```

> ```gherkin

> **The system should persist the selected group name in the database when the program is saved**

> 

> **| PASS |**
> ```

> ```gherkin

> **The system should return only non-null groups when fetching distinct groups via endpoint /getMerchantProgramsGroupName**

> 

> **| PASS |**
> ```

> ```gherkin

> ****

> 

> **| PASS |**
> ```

> ```gherkin

> **The system should alphabetically sort group names when displaying them in the dropdown**

> 

> **| PASS |**
> ```

> ```gherkin

> **The system should allow each merchant program to be associated with exactly one group**

> 

> **| PASS |**
> ```

> ```gherkin

> **The system should display an error message when it fails to load program groups**

> 

> **| PASS |**
> ```

> ```gherkin

> **The system should correctly filter programs to be cloned by group name**

> 

> **| PASS |**
> ```

> ```gherkin

> ****

> 

> **| PASS |**
> ```

> ```gherkin

> **The system should maintain program name search functionality regardless of group filter**

> 

> **| PASS |**
> ```

> ```gherkin

> **The system should add the groupName field to ProgramInfo with database persistence**

> 

> **| PASS |**
> ```


> ```gherkin

> **The system should return the list of distinct group names through the endpoint GET /uown/getMerchantProgramsGroupName**

> 

> **| PASS |**
> ```




> ```gherkin

> **The system should update the SQL query to fetch non-null groups sorted alphabetically**

> 

> **| PASS |**
> ```

---

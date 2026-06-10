-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------



## UOWN | Origination | Create Program Settings Page with Group and Bulk Editing

### Synopsis
As a system user, I want a Program Settings page where I can edit multiple program records at once, so that I can efficiently apply updates to several programs without needing to edit each one individually.

In the Origination Portal, the existing Programs page allows users to create and edit individual programs by filling in multiple configuration fields. With the introduction of Program Groups, new programs are now created or cloned already associated with a group.

To support efficient management of these grouped programs, a new page called **Program Settings** must be created. This page will function similarly to the existing **Merchant Settings** page but focused on programs, enabling users to bulk edit program information.

**Mockup below**

---

### Business Objective
The purpose of this new page is to improve operational efficiency and reduce repetitive manual work when multiple programs require updates.  
By allowing users to perform mass updates, this feature will:

- Simplify maintenance of program attributes across groups;  
- Ensure consistency between related programs;  
- Reduce dependency on technical support for bulk changes.

---

### Feature Request | Business Requirements

#### New Page Creation
- Create a new page titled **Program Settings** in the Origination Portal.  
- The layout and interaction should follow the same design principles as the **Merchant Settings** page.

#### Program Selection
- Allow users to select one or multiple programs from a list.  
- Provide an option to select by **Group Name**, automatically selecting all programs within that group.

#### Bulk Editing Capability
- Enable modification of all fields currently available in the Programs page (e.g., fees, terms, EPO, conditions, etc.).  
- Upon saving, the selected programs should be updated simultaneously with the new values.

#### Validation and Confirmation
- Include field validation identical to the existing Programs page.  
- Display a confirmation modal summarizing which programs will be updated before applying the changes.

#### UI/UX Considerations
- Maintain a clear, intuitive layout consistent with the Merchant Settings page.

#### Logging
- Generate logs for each bulk update, including user, timestamp, and modified fields.  
- Ensure all changes are properly tracked in the system’s change history.

#### Access and Permissions
- Restrict access to the Program Settings page to authorized roles (e.g., admin, manager, business users).

#### Testing and Documentation
- Validate all update scenarios (single, multiple, and by group).

![alt text](image.png)

---

### Adding Notes

#### New Filter Field
- Add a new dropdown field to the Programs page filter area labeled **“Program Group”**.  
- The dropdown must support typing and searching (**searchable dropdown**).

#### Filter Functionality
- When a Program Group is selected, the table should display only programs that belong to that specific group.

---

### Attachment(s)
- Frame 37.png  
- Screenshot-1  
- Screenshot-2  

Insert / Attach related screenshots

---

### Steps-to-Reproduce
List the steps required to verify the implemented feature

---

### Atributos

**Status:** To do  
**Responsáveis:** Davi Artur  
**Etiquetas:** dev, full-stack, priority high, type business request, workflow qa-in-process  
**Principal:** Uown | RU10.25.1.46.0  
**Marco:** Uown | RU11.25.1.46.0  

---

### Participantes
Davi Artur  
Priyanka Namburu  
Yuri Araujo  
Jose Mendes  
Davi Marra

---

### Desenvolvimento

#### Merge Requests
- [/uown/frontend/origination#1105] R1.46.0 program settings page — !1312 (Mesclado)  
- [/uown/frontend/origination#1105] R1.46.0 program settings permissions — ams !32 (Mesclado)  
- [/uown/frontend/origination#1105] R1.46.0 program settings page — svc !1162 (Mesclado)

---

### Atividade

- Yuri Araujo set status to To do — 2 meses atrás  
- Labels added: `dev`, `full-stack`, `type business request`, `priority high`  
- Davi Artur iniciou desenvolvimento — 2 semanas atrás  
- Merge requests realizados — 1 semana atrás  
- Priyanka Namburu mencionada em commits recentes  
- Davi Artur adicionou `workflow ready-for-qa` — 3 dias atrás

---

### Test Steps (por Davi Artur)

- New permissions automatically assigned for admin and managers (image)  
![alt text](image-1.png)

- Similar to the update programs, we have this new page (image)  
![alt text](image-2.png)

- The icon on the navbar must appear only for users that have the permissions to access the page  
- You must be able to update the selected programs on it.  
- You must guarantee that we're just updating the selected programs when editing.  
- We can just update the fields that we've selected to avoid change unwanted fields  
- Test the table filters and pagination  
- Check the program logs after update

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# UOWN | Origination | Criar Página de Configurações de Programas com Edição em Grupo e em Massa

**Aberto**  
Tíquete criado há 2 meses por **Yuri Araujo**

---

## UOWN | Origination | Criar Página de Configurações de Programas com Edição em Grupo e em Massa

### Sinopse
Como usuário do sistema, desejo uma página de **Configurações de Programas** onde eu possa editar múltiplos registros de programas ao mesmo tempo, para que eu possa aplicar atualizações de forma eficiente sem precisar editar cada um individualmente.

No Portal Origination, a página atual de **Programas** permite criar e editar programas individualmente preenchendo diversos campos de configuração.  
Com a introdução dos **Grupos de Programas**, novos programas agora são criados ou clonados já associados a um grupo.

Para oferecer uma gestão eficiente desses programas agrupados, deve ser criada uma nova página chamada **Program Settings**.  
Essa página funcionará de forma semelhante à existente **Merchant Settings**, mas focada em programas, permitindo a edição em massa das informações.

**Mockup abaixo**

---

### Objetivo de Negócio
O propósito desta nova página é **melhorar a eficiência operacional** e **reduzir o trabalho manual repetitivo** quando múltiplos programas precisam ser atualizados.  
Ao permitir atualizações em massa, este recurso proporcionará:

- Simplificação na manutenção dos atributos de programas entre grupos;  
- Garantia de consistência entre programas relacionados;  
- Redução da dependência de suporte técnico para mudanças em massa.

---

### Solicitação de Funcionalidade | Requisitos de Negócio

#### Criação da Nova Página
- Criar uma nova página intitulada **Program Settings** no Portal Origination;  
- O layout e a interação devem seguir os mesmos princípios da página **Merchant Settings**.

#### Seleção de Programas
- Permitir ao usuário selecionar um ou vários programas de uma lista;  
- Incluir a opção de selecionar por **Nome do Grupo**, que automaticamente seleciona todos os programas pertencentes a esse grupo.

#### Capacidade de Edição em Massa
- Habilitar a modificação de todos os campos atualmente disponíveis na página de Programas (ex.: taxas, prazos, EPO, condições etc.);  
- Ao salvar, todos os programas selecionados devem ser atualizados simultaneamente com os novos valores.

#### Validação e Confirmação
- Incluir validações de campo idênticas às da página de Programas;  
- Exibir um modal de confirmação resumindo quais programas serão atualizados antes de aplicar as alterações.

#### Considerações de UI/UX
- Manter um layout claro e intuitivo, consistente com a página de Merchant Settings.

#### Registro de Logs
- Gerar logs para cada atualização em massa, incluindo usuário, data/hora e campos modificados;  
- Garantir que todas as alterações sejam devidamente rastreadas no histórico do sistema.

#### Acesso e Permissões
- Restringir o acesso à página de **Program Settings** apenas a papéis autorizados (ex.: admin, manager, business users).

#### Testes e Documentação
- Validar todos os cenários de atualização (individual, múltipla e por grupo).

---

### Notas Adicionais

#### Novo Campo de Filtro
- Adicionar um novo campo dropdown na área de filtros da página de Programas, rotulado como **“Program Group”**;  
- O dropdown deve permitir digitação e pesquisa (**dropdown pesquisável**).

#### Funcionalidade do Filtro
- Quando um grupo de programa for selecionado, a tabela deve exibir apenas os programas pertencentes a esse grupo.

![](image-3.png)

---

### Anexos
- Frame 37.png  
- Screenshot-1  
- Screenshot-2  

Inserir / Anexar capturas de tela relacionadas

---

### Passos para Reproduzir
Listar as etapas necessárias para verificar a funcionalidade implementada.

---

### Atributos

**Status:** To do  
**Responsáveis:** Davi Artur  
**Etiquetas:** dev, full-stack, prioridade alta, tipo business request, workflow qa-in-process  
**Principal:** Uown | RU10.25.1.46.0  
**Marco:** Uown | RU11.25.1.46.0  

---

### Participantes
Davi Artur  
Priyanka Namburu  
Yuri Araujo  
Jose Mendes  
Davi Marra

---

### Desenvolvimento

#### Merge Requests
- [/uown/frontend/origination#1105] R1.46.0 program settings page — !1312 (Mesclado)  
- [/uown/frontend/origination#1105] R1.46.0 program settings permissions — ams !32 (Mesclado)  
- [/uown/frontend/origination#1105] R1.46.0 program settings page — svc !1162 (Mesclado)

---

### Atividade

- Yuri Araujo definiu status como “To do” — 2 meses atrás  
- Labels adicionadas: `dev`, `full-stack`, `type business request`, `priority high`  
- Davi Artur iniciou desenvolvimento — 2 semanas atrás  
- Merge requests realizados — 1 semana atrás  
- Priyanka Namburu mencionada em commits recentes  
- Davi Artur adicionou `workflow ready-for-qa` — 3 dias atrás

---

### Passos de Teste (por Davi Artur)

- Novas permissões atribuídas automaticamente para administradores e gerentes (imagem); 
![alt text](image-4.png)

- Página semelhante à de atualização de programas (imagem);  
![alt text](image-5.png)

- O ícone na barra de navegação deve aparecer apenas para usuários com permissão de acesso à página;  
- Deve ser possível atualizar os programas selecionados;  
- Garantir que apenas os programas selecionados sejam atualizados ao editar;  
- Atualizar somente os campos selecionados para evitar alterações indesejadas;  
- Testar filtros da tabela e paginação;  
- Verificar os logs de programa após a atualização.

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Alteracoes dev:


 15 arquivos
+
766
−
18
Arquivos
15
Pesquisar (por exemplo, *.vue) (F)

compo
‎nents‎

program-sett
‎ings-buttons‎

index.mo
‎dule.scss‎
+23 -0

inde
‎x.tsx‎
+36 -0

program-set
‎tings-panel‎

index.mo
‎dule.scss‎
+4 -0

inde
‎x.tsx‎
+212 -0

program-set
‎tings-table‎

index.mo
‎dule.scss‎
+3 -0

inde
‎x.tsx‎
+160 -0

domain
‎/stores‎

progr
‎am.tsx‎
+20 -1

layout
‎s/auth‎

inde
‎x.tsx‎
+19 -0

pa
‎ges‎

program
‎Settings‎

index.mo
‎dule.scss‎
+39 -0

inde
‎x.tsx‎
+166 -0

prog
‎rams‎

inde
‎x.tsx‎
+47 -12

public
‎/images‎

program-setting
‎s-page-icon.svg‎
+13 -0

 components/program-settings-buttons/index.module.scss  0 → 100644
+
23
−
0

Visualizado
.cancelButton {
  background: #d1d1d1;
  color: var(--black);
  font-size: 14px;
  width: 120px;
  height: 45px;
  border: 0;
  border-radius: 2px;
}

.saveButton {
  background: var(--primary);
  color: var(--white);
  font-size: 14px;
  width: 120px;
  height: 45px;
  border: 0;
  border-radius: 2px;
}

.container {
    display: flex;
}
\ No newline at end of file
 components/program-settings-buttons/index.tsx  0 → 100644
+
36
−
0

Visualizado
import React from 'react';
import {Button} from '@uownleasing/common-ui';
import styles from './index.module.scss';
import classNames from 'classnames';

interface Props {
  cancel: {
    onClick: () => void;
    disabled?: boolean;
  };
  save: {
    onClick: () => void;
    disabled: boolean;
  };
}

export const ProgramSettingsButtons = ({cancel, save}: Props) => {
  return (
    <div className={styles?.container}>
      <Button
        className={styles?.cancelButton}
        buttonStyle="primary"
        isDisabled={cancel.disabled}
        onClick={cancel.onClick}>
        CANCEL
      </Button>
      <Button
        isDisabled={save.disabled}
        className={classNames('ml-2', styles?.saveButton)}
        buttonStyle="primary"
        onClick={save.onClick}>
        SAVE
      </Button>
    </div>
  );
};
 components/program-settings-panel/index.module.scss  0 → 100644
+
4
−
0

Visualizado
.container {
  margin-top: 3.1rem;
  width: 50%;
}
 components/program-settings-panel/index.tsx  0 → 100644
+
212
−
0

Visualizado
import React, {useMemo} from 'react';
import {Frequencies} from '@enums/Frequencies';
import {LendingCategoryType} from '@enums/LendingCategoryType';
import {faPercentage} from '@fortawesome/free-solid-svg-icons';
import {CollapsableEditLayout, InputField} from '@uownleasing/common-ui';
import {convertStringToOptionType} from '@utils/helper';
import {FormikProps} from 'formik';
import {Col, Form, Row} from 'reactstrap';
import styles from './index.module.scss';

interface Props {
  programGroups: string[];
  programsFormik: FormikProps<any>;
}

export const ProgramSettingsPanel = ({
  programGroups,
  programsFormik,
}: Props) => {
  const programGroupsFiltered = useMemo(() => {
    const programGroupsCopy = Array.from(programGroups);
    programGroupsCopy.unshift('');
    return programGroupsCopy;
  }, [programGroups, programsFormik.values.groupName]);

  return (
    <div className={styles.container}>
      <CollapsableEditLayout title="Settings" isEditable={false}>
        <Form
          id="addOrEditMerchantProgramForm"
          onSubmit={programsFormik.handleSubmit}>
          <Row className="mb-2">
            <Col xs={12} className="mb-2">
              <InputField
                formik={programsFormik}
                name="groupName"
                label="Program Group"
                type="select"
                options={programGroupsFiltered}
                disabled={true}
              />
            </Col>
          </Row>
          <Row className="mb-2">
            <Col xs={12} md className="mb-2">
              <InputField
                formik={programsFormik}
                name="termMonths"
                type="number"
                label="Term Months"
                placeholder="13"
                min={0}
              />
            </Col>
            <Col xs={12} md className="mb-2">
              <InputField
                formik={programsFormik}
                name="moneyFactor"
                type="number"
                label="Money Factor"
                min={0}
                step="any"
                placeholder="16.99"
                rightIcon={faPercentage}
              />
            </Col>
            <Col>
              <InputField
                formik={programsFormik}
                name="payoffDiscount"
                type="number"
                label="Pay Off Discount"
                placeholder="30"
                min={0}
                step="any"
                rightIcon={faPercentage}
              />
            </Col>
          </Row>

          <Row className="mb-2">
            <Col xs={12} md className="mb-2">
              <InputField
                formik={programsFormik}
                name="epoDays"
                type="number"
                label="EPO Days"
                placeholder="90"
                min={0}
              />
            </Col>
            <Col>
              <InputField
                formik={programsFormik}
                name="epoFeePercent"
                label="EPO Fee Percent"
                type="number"
                min={0}
                step="any"
                placeholder="0"
                rightIcon={faPercentage}
              />
            </Col>
            <Col xs={12} md className="mb-2">
              <InputField
                formik={programsFormik}
                name="minCartAmount"
                type="currency"
                label="Minimum Cart Amount"
                placeholder="0"
              />
            </Col>
          </Row>

          <Row className="mb-2">
            <Col>
              <InputField
                formik={programsFormik}
                name="maxCartAmount"
                label="Max Cart Amount"
                placeholder="0"
                type="currency"
              />
            </Col>
            <Col xs={12} md className="mb-2">
              <InputField
                formik={programsFormik}
                name="dealerDiscount"
                label="Dealer Discount Override"
                type="number"
                min={0}
                step="any"
                rightIcon={faPercentage}
              />
            </Col>
          </Row>

          <Row className="mb-2">
            <Col>
              <InputField
                formik={programsFormik}
                name="processingFeeOverride"
                label="Processing Fee Override"
                type="currency"
                placeholder="4"
              />
            </Col>
            <Col xs={6} md className="mb-2">
              <InputField
                formik={programsFormik}
                name="lendingCategoryType"
                type="select"
                label="Lending Category"
                options={Object.keys(LendingCategoryType)}
                onChange={async (val) => {
                  const value = val?.value || '';
                  await programsFormik?.setFieldValue(
                    'lendingCategoryType',
                    value,
                  );

                  if (value === LendingCategoryType.LTO) {
                    await programsFormik?.setFieldValue(
                      'allowedFrequencyOverride',
                      convertStringToOptionType(
                        `${Frequencies.WEEKLY}, ${Frequencies.BI_WEEKLY}`,
                      ),
                    );
                  } else if (value === LendingCategoryType.NEAR_PRIME) {
                    await programsFormik?.setFieldValue(
                      'allowedFrequencyOverride',
                      convertStringToOptionType(Frequencies.MONTHLY),
                    );
                  } else if (value === LendingCategoryType.PRIME) {
                    const convertedFreq = convertStringToOptionType('');
                    await programsFormik?.setFieldValue(
                      'allowedFrequencyOverride',
                      convertedFreq,
                    );
                  }
                }}
              />
            </Col>
          </Row>

          <Row className="mb-2">
            <Col xs={12} md className="mb-2">
              <InputField
                formik={programsFormik}
                name="allowedFrequencyOverride"
                label="Allowed Frequency Override"
                type="multi-select"
                options={Object.keys(Frequencies) || []}
              />
            </Col>
          </Row>

          <Row className="mb-2">
            <Col xs={6} className="mb-2">
              <InputField
                formik={programsFormik}
                name="amountChargedAtSigning"
                label="Amount Charged at Signing"
                type="currency"
              />
            </Col>
          </Row>
        </Form>
      </CollapsableEditLayout>
    </div>
  );
};
 components/program-settings-table/index.module.scss  0 → 100644
+
3
−
0

Visualizado
.container {
  max-width: 50%;
}
 components/program-settings-table/index.tsx  0 → 100644
+
160
−
0

Visualizado
import React, {useCallback, useEffect, useState} from 'react';
import {ProgramStore} from '@stores/program';
import {UtilityStore} from '@stores/utility';
import {defaultPaginatedResp, FilterTable} from '@uownleasing/common-ui';
import {programPageTableColumns} from '@utils/data-table-columns';
import {
  dataTableCustomStyles,
  paginationRowsPerPageOptions,
} from '@utils/helper';
import {useFormik} from 'formik';
import {useMemo} from 'react';
import {getProgramTableFilter} from '@utils/program-table-config';
import styles from './index.module.scss';

interface Props {
  utilityStore: UtilityStore;
  programStore: ProgramStore;
  setProgramsSelectedPks: (pks: number[]) => void;
  programGroups: string[];
  refreshPrograms: boolean;
}

export const ProgramSettingsTable = ({
  programStore,
  utilityStore,
  setProgramsSelectedPks,
  programGroups,
  refreshPrograms,
}: Props) => {
  const [paginationTotalRows, setPaginationTotalRows] = useState(10);
  const [paginationPerPage, setPaginationPerPage] = useState<number>();

  const handleGetPrograms = () => {
    const paginationSettings = programStore?.paginationSettings;
    const searchWord = paginationSettings?.searchKey || '';
    const pageNum = paginationSettings?.pageNumber;
    const maxNum = paginationSettings?.maxResults;
    getAllMerchPrograms(searchWord, pageNum, maxNum);
    setPaginationPerPage(maxNum);
  };

  useEffect(() => {
    handleGetPrograms();

    return () => programStore?.setProgramLogs(defaultPaginatedResp([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const configColumns = useMemo(() => {
    return programPageTableColumns(() => {}, false)?.map((column) => ({
      ...column,
      label: column?.name,
      value: column?.name,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [allPrograms, setAllPrograms] = useState([]);
  const searchFormik = useFormik({
    initialValues: {
      search: programStore?.paginationSettings?.searchKey || '',
      groupName: '',
    },
    onSubmit: ({groupName, search}) => {
      getAllMerchPrograms(search, 0, 10, groupName);
    },
  });

  const getAllMerchPrograms = async (
    search: string = '',
    page: number = 0,
    maxResults: number = 10,
    groupName: string = '',
  ) => {
    const {data} = await programStore?.getAllMerchantPrograms(
      search,
      page,
      maxResults,
      false,
      groupName,
    );
    const {merchantPrograms, totalCount} = data || {};
    setAllPrograms(merchantPrograms || []);
    setPaginationTotalRows(totalCount);
  };

  useEffect(() => {
    searchFormik.submitForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshPrograms]);

  const tableFilterProps = getProgramTableFilter(searchFormik, programGroups);

  const onChangePage = useCallback(
    async (page: number) => {
      const searchKeyword = searchFormik?.values?.search || '';
      await getAllMerchPrograms(
        searchKeyword,
        page - 1,
        paginationPerPage,
        searchFormik.values.groupName,
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchFormik?.values, paginationPerPage],
  );

  const onChangeRowsPerPage = useCallback(
    async (newPerPage: number, page: number) => {
      const searchKeyword = searchFormik?.values?.search || '';
      await getAllMerchPrograms(
        searchKeyword,
        page - 1,
        newPerPage,
        searchFormik.values.groupName,
      );
      setPaginationPerPage(newPerPage);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchFormik?.values, setPaginationPerPage],
  );
  const onSelectedRowsChange = (rows: {pk: number}[]) => {
    setProgramsSelectedPks(rows.map((program) => program.pk));
  };

  return (
    <div className={styles.container}>
      <FilterTable
        isResizeable
        dataStructure="programInfo"
        columns={configColumns as any}
        customStyles={dataTableCustomStyles}
        selectableRows
        data={allPrograms || []}
        defaultSortAsc={true}
        filterProps={tableFilterProps}
        formik={searchFormik}
        onChangePage={onChangePage}
        onChangeRowsPerPage={onChangeRowsPerPage}
        pagination
        paginationServer
        paginationDefaultPage={
          programStore?.paginationSettings?.pageNumber + 1 || 0
        }
        onSelectedRowsChange={(r) =>
          onSelectedRowsChange(r.selectedRows as {pk: number}[])
        }
        paginationPerPage={paginationPerPage}
        paginationRowsPerPageOptions={paginationRowsPerPageOptions}
        paginationTotalRows={paginationTotalRows}
        striped
        progressPending={utilityStore?.isLoading}
        onRowClicked={() => {}}
        pointerOnHover
        highlightOnHover
        responsive
      />
    </div>
  );
};
 domain/stores/program.tsx 
+
20
−
1

Visualizado
@@ -39,12 +39,13 @@ export class ProgramStore extends BaseStore {
    pageNumber: number = 0,
    maxResults: number = 10,
    isGetAll: boolean = false,
    groupName: string = '',
  ): Promise<ResponseType> => {
    const utilityStore = this.rootStore?.utilityStore;
    const response = await utilityStore?.sendRequest({
      method: 'POST',
      url: '/uown/getAllMerchantPrograms',
      data: {search, pageNumber, maxResults},
      data: {search, pageNumber, maxResults, groupName},
      isHandleLoader: true,
    });

@@ -87,6 +88,24 @@ export class ProgramStore extends BaseStore {
    return responseData;
  };

  @action
  updatePrograms = async (body: any): Promise<ResponseType> => {
    const utilityStore = this.rootStore?.utilityStore;
    const response = await utilityStore?.sendRequest({
      method: 'POST',
      url: '/uown/updatePrograms',
      data: body,
      isHandleLoader: true,
    });

    const responseData: ResponseType = {
      status: response?.status || 500,
      message: response?.message || '',
    };

    return responseData;
  };

  @action
  clonePrograms = async (body: any): Promise<ResponseType> => {
    const utilityStore = this.rootStore?.utilityStore;
 layouts/auth/index.tsx 
+
19
−
0

Visualizado
@@ -333,6 +333,8 @@ const AuthWrapper = (props: AuthWrapperProps) => {
  );
  const hasProgramViewPermission = hasViewPermission(permissions, 'programs');

  const hasProgramSettingsViewPermission = hasViewPermission(permissions, 'programSettings');

  const hasChangeApprovalStatusPermission = hasRestrictedModifyPermission(
    permissions,
    'lead_status_denied_to_approved',
@@ -497,6 +499,23 @@ const AuthWrapper = (props: AuthWrapperProps) => {
        await router.push(`/${path}`);
      },
    },
    {
      label: 'Program Settings',
      target: 'programSettings',
      permission: hasProgramSettingsViewPermission,
      icon: (
        <Image
          src={'/images/program-settings-page-icon.svg'}
          width={40}
          height={34}
          className="mx-0 width-inherit"
        />
      ),
      onClick: async (path: string) => {
        utilityStore?.setIsLoading(true);
        await router.push(`/${path}`);
      },
    },
    {
      label: 'Rebate',
      target: 'rebate',
 pages/programSettings/index.module.scss  0 → 100644
+
39
−
0

Visualizado
.programForm {
  &__cancelButton {
    background: #d1d1d1;
    color: var(--black);
    font-size: 14px;
    width: 120px;
    height: 45px;
    border: 0;
    border-radius: 2px;
  }

  &__saveButton {
    background: var(--primary);
    color: var(--white);
    font-size: 14px;
    width: 120px;
    height: 45px;
    border: 0;
    border-radius: 2px;
  }
}

.actionButtonsContainer {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;

  @media screen and (max-width: 675px) {
    flex-flow: column;
    gap: 0.5rem;
  }
}

.componentsContainer {
 display: flex;
 justify-content: space-between;
 flex-wrap: nowrap;
 gap: 1rem;
}
\ No newline at end of file
 pages/programSettings/index.tsx  0 → 100644
+
166
−
0

Visualizado
import React, {useEffect, useMemo, useState} from 'react';
import AuthWrapper from '@layouts/auth';
import {inject, observer} from 'mobx-react';
import {UtilityStore} from '@stores/utility';
import {ProgramStore} from '@stores/program';
import styles from './index.module.scss';
import {ProgramSettingsPanel} from '@components/program-settings-panel';
import {ProgramSettingsButtons} from '@components/program-settings-buttons';
import {ProgramSettingsTable} from '@components/program-settings-table';
import {showToast} from '@uownleasing/common-utilities';
import {useFormik} from 'formik';
import * as Yup from 'yup';

interface Props {
  programStore: ProgramStore;
  utilityStore: UtilityStore;
}

const ProgramSettings = ({programStore, utilityStore}: Props) => {
  utilityStore.setIsLoading(false);

  const [programGroups, setProgramGroups] = useState([]);
  const [refreshPrograms, setRefreshPrograms] = useState(false);

  const formik = useFormik({
    initialValues: {
      programsSelectedPks: [],
      moneyFactor: 0,
      payoffDiscount: 0,
      epoDays: 0,
      epoFeePercent: 0,
      termMonths: 0,
      lendingCategoryType: '',
      allowedFrequencyOverride: [],
      dealerDiscount: 0,
      minCartAmount: '0.00',
      maxCartAmount: '0.00',
      processingFeeOverride: '0.00',
      amountChargedAtSigning: '0.00',
      groupName: undefined,
    },
    validationSchema: Yup.object().shape({
      moneyFactor: Yup.number().optional(),
      payoffDiscount: Yup.number().optional(),
      epoDays: Yup.number().optional(),
      epoFeePercent: Yup.number().optional(),
      termMonths: Yup.number().optional(),
      minCartAmount: Yup.number().optional(),
      maxCartAmount: Yup.number().optional(),
      dealerDiscount: Yup.number(),
      allowedFrequencyOverride: Yup.array(),
      processingFeeOverride: Yup.number().nullable(),
      amountChargedAtSigning: Yup.number().optional(),
    }),
    onSubmit: async (values) => {
      const body = {
        programData: {},
        programPks: values.programsSelectedPks,
      };
      Object.entries(values).forEach(([key, value]) => {
        if (value === formik.initialValues[key]) {
          return;
        }

        if (key !== 'programsSelectedPks') {
          if (typeof value === 'string') {
            body.programData[key] = value?.trim();
          } else {
            body.programData[key] = value;
          }
        }

        if (key === 'allowedFrequencyOverride') {
          body.programData[key] = value
            .map((v: {value: string}) => v.value)
            .join(',');
        }
      });
      const {status} = await programStore.updatePrograms(body);

      if (status >= 400) {
        showToast(
          'error',
          'An error has occured while updating the programs. Please try again.',
        );
        return;
      }

      showToast('success', 'Programs have been successfully updated!');
      formik.resetForm();
      setRefreshPrograms(true);
    },
  });

  useEffect(() => {
    const fetchProgramGroups = async () => {
      const {data, status} = await programStore.getMerchantProgramsGroupName();
      if (status >= 400) {
        showToast('error', 'Unable to load program groups.');
        return;
      }
      setProgramGroups(data);
    };

    fetchProgramGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isSaveBtnDisabled = useMemo(() => {
    const initialValues = Object.assign({}, formik.initialValues);
    const currentValues = formik.values;
    initialValues.programsSelectedPks = currentValues.programsSelectedPks;
    if (currentValues.hasOwnProperty('groupName')) {
      delete initialValues.groupName;
    }
    return JSON.stringify(initialValues) === JSON.stringify(currentValues);
  }, [formik.initialValues, formik.values]);

  return (
    <AuthWrapper
      title="PROGRAM SETTINGS"
      isPageLoading={false}
      childButton={
        <ProgramSettingsButtons
          save={{
            onClick: () => {
              formik.handleSubmit();
            },
            disabled:
              isSaveBtnDisabled ||
              formik.values.programsSelectedPks.length === 0,
          }}
          cancel={{
            onClick: () => {
              formik.setValues({
                ...formik.initialValues,
                programsSelectedPks: formik.values.programsSelectedPks,
              });
            },
            disabled: false,
          }}
        />
      }>
      <div className={styles.componentsContainer}>
        <ProgramSettingsTable
          refreshPrograms={refreshPrograms}
          programStore={programStore}
          utilityStore={utilityStore}
          setProgramsSelectedPks={(pks) =>
            formik.setFieldValue('programsSelectedPks', pks)
          }
          programGroups={programGroups}
        />
        <ProgramSettingsPanel
          programsFormik={formik}
          programGroups={programGroups}
        />
      </div>
    </AuthWrapper>
  );
};

export default inject(
  'programStore',
  'utilityStore',
)(observer(ProgramSettings));
 pages/programs/index.tsx 
+
47
−
12

Visualizado
@@ -45,6 +45,7 @@ const Programs = (props: ProgramProps) => {
  const [frequency, setFrequency] = useState('');
  const [configColumns, setConfigColumns] = useState([]);
  const [activityLogsIsLoading, setActivityLogsIsLoading] = useState(false);
  const [programGroups, setProgramGroups] = useState([]);

  const permissions = utilityStore?.rootStore?.accountStore?.permissions;
  const hasCreateOrUpdateMerchantPermission = hasModifyPermission(
@@ -61,6 +62,7 @@ const Programs = (props: ProgramProps) => {

  const getAllMerchPrograms = async (
    search: string = '',
    groupName: string = '',
    page: number = 0,
    maxResults: number = 10,
  ) => {
@@ -68,6 +70,8 @@ const Programs = (props: ProgramProps) => {
      search,
      page,
      maxResults,
      false,
      groupName,
    );
    const {data} = response;
    const {merchantPrograms, totalCount} = data || {};
@@ -85,10 +89,29 @@ const Programs = (props: ProgramProps) => {
    const searchWord = paginationSettings?.searchKey || '';
    const pageNum = paginationSettings?.pageNumber;
    const maxNum = paginationSettings?.maxResults;
    getAllMerchPrograms(searchWord, pageNum, maxNum);
    getAllMerchPrograms(
      searchWord,
      searchFormik.values.groupName,
      pageNum,
      maxNum,
    );
    setPaginationPerPage(maxNum);
  };

  useEffect(() => {
    const fetchProgramGroups = async () => {
      const {data, status} = await programStore.getMerchantProgramsGroupName();
      if (status >= 400) {
        showToast('error', 'Unable to load program groups.');
        return;
      }
      setProgramGroups(data);
    };

    fetchProgramGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    handleGetPrograms();

@@ -116,10 +139,12 @@ const Programs = (props: ProgramProps) => {
  });

  const searchFormik = useFormik({
    initialValues: {search: programStore?.paginationSettings?.searchKey || ''},
    onSubmit: (values) => {
      const {search} = values;
      getAllMerchPrograms(search);
    initialValues: {
      search: programStore?.paginationSettings?.searchKey || '',
      groupName: '',
    },
    onSubmit: ({groupName, search}) => {
      getAllMerchPrograms(search, groupName);
    },
  });

@@ -291,18 +316,28 @@ const Programs = (props: ProgramProps) => {
    }
  }, [programsFormik?.values?.states]);

  const tableFilterProps = getProgramTableFilter(searchFormik);
  const tableFilterProps = getProgramTableFilter(searchFormik, programGroups);

  const onChangePage = async (page: number) => {
    const searchKeyword = searchFormik?.values?.search || '';
    await getAllMerchPrograms(searchKeyword, page - 1, paginationPerPage);
  };
  const onChangeRowsPerPage = async (newPerPage: number, page: number) => {
    const searchKeyword = searchFormik?.values?.search || '';
    await getAllMerchPrograms(searchKeyword, page - 1, newPerPage);
    setPaginationPerPage(newPerPage);
    const groupName = searchFormik?.values?.groupName;
    await getAllMerchPrograms(
      searchKeyword,
      groupName,
      page - 1,
      paginationPerPage,
    );
  };

  const onChangeRowsPerPage =
    () => async (newPerPage: number, page: number) => {
      const searchKeyword = searchFormik?.values?.search || '';
      const groupName = searchFormik?.values?.groupName;

      await getAllMerchPrograms(searchKeyword, groupName, page - 1, newPerPage);
      setPaginationPerPage(newPerPage);
    };

  const AddNewProgramButton = () => {
    return (
      <Button
 public/images/program-settings-page-icon.svg  0 → 100644
+
13
−
0

Visualizado
<?xml version="1.0" encoding="UTF-8"?>
<svg id="Camada_1" xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 30 24">
  <!-- Generator: Adobe Illustrator 30.0.0, SVG Export Plug-In . SVG Version: 2.1.1 Build 123)  -->
  <defs>
    <style>
      .st0 {
        fill: #fff;
      }
    </style>
  </defs>
  <path class="st0" d="M22.5,14.1h-1.2c-.5,0-.9-.3-1-.8l-.3-1.2c-.2,0-.4-.2-.5-.3l-1.2.4c-.5.2-1,0-1.2-.5l-.6-1c-.2-.4-.2-.9.2-1.3l.9-.8c0,0,0-.2,0-.3s0-.2,0-.3l-.9-.8c-.4-.3-.4-.8-.2-1.3l.6-1c.2-.4.7-.6,1.2-.5l1.2.4c.2-.1.3-.2.5-.3l.3-1.2c0-.5.5-.8,1-.8h1.2c.5,0,.9.3,1,.8l.3,1.2c.2,0,.4.2.5.3l1.2-.4c.5-.2,1,0,1.2.5l.6,1c.2.4.2.9-.2,1.3l-.9.8c0,0,0,.2,0,.3s0,.2,0,.3l.9.8c.4.3.4.9.2,1.3l-.6,1c-.2.4-.7.6-1.2.5l-1.2-.4c-.2.1-.3.2-.5.3l-.2,1.2c0,.5-.5.8-1,.8ZM19.6,11h.2c.2.3.5.4.7.5h.2c0,0,.3,1.7.3,1.7,0,.1.1.2.3.2h1.2c.1,0,.2,0,.3-.2l.3-1.6h.2c.3-.2.5-.3.7-.5h.2c0-.1,1.5.4,1.5.4.1,0,.3,0,.3-.1l.6-1c0-.1,0-.2,0-.3l-1.2-1.1v-.2c0-.1,0-.3,0-.4s0-.3,0-.4v-.2s1.2-1.1,1.2-1.1c0,0,.1-.2,0-.3l-.6-1c0-.1-.2-.2-.3-.1l-1.5.5h-.2c-.2-.3-.5-.4-.7-.5h-.2c0,0-.3-1.7-.3-1.7,0-.1-.1-.2-.3-.2h-1.2c-.1,0-.2,0-.3.2h0s-.3,1.6-.3,1.6h-.2c-.3.2-.5.3-.7.5h-.2c0,.1-1.5-.4-1.5-.4-.1,0-.3,0-.3.1l-.6,1c0,.1,0,.2,0,.3l1.2,1.1v.2c0,.1,0,.3,0,.4s0,.3,0,.4v.2s-1.2,1.1-1.2,1.1c0,0-.1.2,0,.3l.6,1c0,.1.2.2.3.1l1.6-.5ZM21.9,10.3c-.5,0-1-.2-1.4-.6-.4-.4-.6-.9-.6-1.4,0-.5.2-1,.6-1.4.4-.4.9-.6,1.4-.6.5,0,1,.2,1.4.6.4.4.6.9.6,1.4,0,1.1-.9,2-2,2h0ZM21.9,7.1h0c-.3,0-.6.1-.9.4-.2.2-.4.5-.4.9,0,.3.1.6.4.9.2.2.5.4.9.4h0c.7,0,1.2-.6,1.2-1.2,0-.3-.1-.6-.4-.9-.2-.2-.5-.4-.9-.4Z"/>
  <path class="st0" d="M25.8,13.2s0,0,0,0c-.2,0-.4,0-.6-.1l-.5-.2v.6c-.2.4-.4.7-.6.9l.8-.4v5.5l-4.6,2.2v-5.5l2.4-1.1s0,0,0,0h-1.2c-.3,0-.5,0-.8-.2l-.8.4-4.4-2.1,1.3-.6c-.1-.1-.3-.3-.4-.4l-.2-.4-1.4.7v-5.5l.8-.4c0-.4,0-.8.3-1.2h0c0,0-1.6.7-1.6.7l-4.4-2.1,4.4-2,3.2,1.5c.2,0,.4-.1.6-.1s.4,0,.6.1l.5.2v-.4c0,0-4.8-2.2-4.8-2.2-.1,0-.3,0-.4,0l-5.6,2.5c-.1,0-.2.1-.2.2,0,0,0,0,0,0,0,0,0,0,0,.2,0,0,0,0,0,0,0,0,0,0,0,0v6.5l-5.3,2.4c-.1,0-.2.1-.2.2,0,0,0,0,0,0,0,0,0,0,0,.2,0,0,0,0,0,0,0,0,0,0,0,0v6.6c0,.2.1.4.3.5l5.6,2.7c0,0,.1,0,.2,0s.1,0,.2,0l5.3-2.6,5.3,2.6c0,0,.1,0,.2,0s.1,0,.2,0l5.6-2.7c.2,0,.3-.3.3-.5v-6.6s0,0,0,0,0,0,0,0c0,0,0,0,0,0ZM8.1,21.8l-4.6-2.2v-5.5l4.6,2.2v5.5ZM8.6,15.4l-4.4-2.1,4.4-2,4.4,2-4.4,2.1ZM13.6,19.6l-4.6,2.2v-5.5l4.6-2.2v5.5ZM13.6,12.5l-4.6-2.2v-5.5l4.6,2.2v5.5ZM19.2,21.8l-4.6-2.2v-5.5l4.6,2.2v5.5Z"/>
</svg>
\ No newline at end of file
 utils/program-table-config/index.tsx 
+
14
−
1

Visualizado
export const getProgramTableFilter = (formik) => ({
export const getProgramTableFilter = (formik, programGroups: string[]) => ({
  filterBtnTitle: 'Filters',
  filterBtnStyle: 'secondary',
  options: [
@@ -13,5 +13,18 @@ export const getProgramTableFilter = (formik) => ({
      },
      maxWidth: '500px',
    },
    {
      type: 'select',
      name: 'groupName',
      placeholder: 'Groups',
      label: 'Program Groups',
      isFilterLabelsSameLine: true,
      options: programGroups,
      onChange: (e: {value: string}) => {
        formik.setFieldValue('groupName', e?.value);
      },
      maxWidth: '500px',
      mixWidth: '200px',
    },
  ],
});
 utils/data-table-columns.tsx 
+
4
−
4

Visualizado
@@ -9,7 +9,7 @@ import {
  getDate,
} from '@uownleasing/common-utilities';
import {Alert, InputField} from '@uownleasing/common-ui';
import {Button, UncontrolledTooltip} from 'reactstrap';
import {Button} from 'reactstrap';
import {
  faCheck,
  faCircleXmark,
@@ -2959,7 +2959,7 @@ export const blacklistPageTableColumns = (formik: any) => {
  ];
};

export const programPageTableColumns = (handleProgramClick: (row) => void) => {
export const programPageTableColumns = (handleProgramClick: (row) => void, redirectable = true) => {
  return [
    {
      name: 'Program Name',
@@ -2969,8 +2969,8 @@ export const programPageTableColumns = (handleProgramClick: (row) => void) => {
        <div
          className={classNames(
            styles?.dataTableColumn__cursorPointer,
            styles?.dataTableColumn__blueFile,
            styles?.dataTableColumn__textUnderline,
            redirectable && styles?.dataTableColumn__blueFile,
            redirectable && styles?.dataTableColumn__textUnderline,
          )}
          onClick={() => handleProgramClick(row)}>
          {row?.programInfo?.programName}
 server.js 
+
6
−
0

Visualizado
@@ -334,6 +334,12 @@ const permissionsMapping = {
    },
    get: [],
  },
  programSettings: {
    post: {
      update_programs: '/uown/updatePrograms',
    },
    get: ['/uown/getMerchantProgramsGroupName'],
  },
  blacklist: {
    post: {
      add_to_blacklist: '/uown/createOrUpdateBlackListItem',

--


+
9
−
1

Visualizado
@@ -339,6 +339,10 @@ public class Uown extends EnvironmentService {
                {"leads email csv", "modify", "leads/email_csv", "", ""},
                {"leads get_leads_by_criteria [modify]", "modify", "leads/get_leads_by_criteria", "", ""},

                {"programSettings [view]", "access", "programSettings", "", ""},
                {"programSettings list programs [access]", "access", "programSettings/get_all_merchant_programs", "", ""},
                {"programSettings update programs [modify]", "modify", "programSettings/update_programs", "", ""},

                {"invoice [access]", "access", "invoice", "", ""},
                {"invoice merchant bank info [view]", "restricted/view/full", "invoice/get_merchant_bank_info", "", ""}
            })
@@ -731,7 +735,11 @@ public class Uown extends EnvironmentService {
                    "leads get_basic_merchant_info_by_ref_code [modify]",
                    "leads get_leads_by_criteria [modify]",
                    "invoice [access]",
                    "invoice merchant bank info [view]"
                    "invoice merchant bank info [view]",

                    "programSettings [view]",
                    "programSettings list programs [access]",
                    "programSettings update programs [modify]"
                    ),
                    null, "", true),

--


 10 arquivos
+
479
−
15
Arquivos
10
Pesquisar (por exemplo, *.vue) (F)

s
‎rc‎

main/java/com/
‎uownleasing/svc‎

db/rep
‎ository‎

MerchantProg
‎ramRepo.java‎
+11 -3

po
‎jo‎

MerchantProgramS
‎earchFilter.java‎
+2 -0

MerchantProgramsU
‎pdateRequest.java‎
+18 -0

re
‎st‎

AdminContr
‎oller.java‎
+8 -1

ser
‎vice‎

MerchantProgr
‎amService.java‎
+3 -2

UpdateProgram
‎sService.java‎
+105 -0

uti
‎lity‎

Conversion
‎Utils.java‎
+62 -0

test/java/com/
‎uownleasing/svc‎

service/merchan
‎tProgramService‎

CloneProgra
‎msTest.java‎
+8 -9

uti
‎lity‎

ConversionUt
‎ilsTest.java‎
+107 -0

UpdateProgramsS
‎erviceTest.java‎
+155 -0

 src/main/java/com/uownleasing/svc/db/repository/MerchantProgramRepo.java 
+
11
−
3

Visualizado
@@ -37,9 +37,17 @@ public interface MerchantProgramRepo extends JpaRepository<MerchantProgram, Long
        "order by mp.programInfo.groupName")
    List<String> findDistinctGroupNames();

    @Query(value = "SELECT mp.* FROM uown_merchant_program mp " +
        "WHERE ((:search IS NULL) or (:search IS NOT NULL and mp.program_name ilike CAST(:search AS VARCHAR)))", nativeQuery = true)
    Page<MerchantProgram> findAllMerchantProgramsBySearch(String search,  Pageable pageable);
    @Query(value = """
        SELECT mp.*
        FROM uown_merchant_program mp
        WHERE
            ((:search IS NULL) OR (:search IS NOT NULL AND mp.program_name ILIKE CAST(:search AS VARCHAR)))
          AND
            ((:groupName IS NULL) OR (:groupName IS NOT NULL AND mp.group_name ILIKE CAST(:groupName AS VARCHAR)))
        """,
        nativeQuery = true
    )
    Page<MerchantProgram> findAllMerchantProgramsBySearch(String search, String groupName, Pageable pageable);

    @Query(value = "SELECT EXISTS (SELECT 1 FROM uown_merchant_program mp WHERE UPPER(mp.group_name) = UPPER(:groupName))", nativeQuery = true)
    boolean existsByGroupName(@Param("groupName") String groupName);
 src/main/java/com/uownleasing/svc/pojo/MerchantProgramSearchFilter.java 
+
2
−
0

Visualizado
@@ -23,5 +23,7 @@ public class MerchantProgramSearchFilter {
    @JsonAlias("searchKey")
    private String searchKey;

    @JsonProperty("groupName")
    private String groupName;
}
 src/main/java/com/uownleasing/svc/pojo/MerchantProgramsUpdateRequest.java  0 → 100644
+
18
−
0

Visualizado
package com.uownleasing.svc.pojo;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@ToString
public class MerchantProgramsUpdateRequest {
    private List<Long> programPks = new ArrayList<>();
    private Map<String, Object> programData = new HashMap<>();
}
 src/main/java/com/uownleasing/svc/rest/AdminController.java 
+
8
−
1

Visualizado
@@ -50,6 +50,8 @@ public class AdminController {

    private final MerchantProgramService merchantProgramService;

    private final UpdateProgramsService updateProgramsService;

    private final StateConfigurationsService stateConfigurationsService;

    private final SvGCSService gcsService;
@@ -232,7 +234,7 @@ public class AdminController {

    @PostMapping(value = "/getAllMerchantPrograms")
    public MerchantProgramSearchResult getMerchantPrograms(@RequestBody MerchantProgramSearchFilter filter) {
        return merchantProgramService.getAllMerchantPrograms(filter.getSearchKey(), false, filter.getPageNumber(), filter.getMaxResults());
        return merchantProgramService.getAllMerchantPrograms(filter.getSearchKey(), false, filter.getPageNumber(), filter.getMaxResults(), filter.getGroupName());
    }

    @GetMapping(value = "/removeProgramForMerchant/{merchantPk}/{programPk}")
@@ -242,6 +244,11 @@ public class AdminController {
        merchantToProgramService.removeProgramForMerchant(merchantPk, programPk);
    }

    @PostMapping(value="/updatePrograms")
    public void updatePrograms(@RequestBody MerchantProgramsUpdateRequest request){
        updateProgramsService.updatePrograms(request);
    }

    @PostMapping(value = "/removeProgramsFromMerchant")
    public void removeProgramsFromMerchant(@RequestParam Long merchantPk, @RequestParam String programPks) {
        // param programPks should be a comma-delimited list
 src/main/java/com/uownleasing/svc/service/MerchantProgramService.java 
+
3
−
2

Visualizado
@@ -32,7 +32,7 @@ public class MerchantProgramService {

    public MerchantProgram createOrUpdate(ProgramInfo programInfo) {
        MerchantProgram merchantProgram ;
        MerchantProgramSearchResult merchantProgramSearchResult = getAllMerchantPrograms(programInfo.getProgramName(), true, null, null);
        MerchantProgramSearchResult merchantProgramSearchResult = getAllMerchantPrograms(programInfo.getProgramName(), true, null, null, null);
        Boolean checkDuplicate = merchantProgramSearchResult.getTotalCount() == 0 ? Boolean.FALSE : Boolean.TRUE;

        if(programInfo.getProgramPk() > 0) {
@@ -112,7 +112,7 @@ public class MerchantProgramService {
        return merchantProgramRepo.findByPk(programPk);
    }

    public MerchantProgramSearchResult getAllMerchantPrograms(String search, Boolean isFullMatch, Integer pageNumber, Integer maxResults) {
    public MerchantProgramSearchResult getAllMerchantPrograms(String search, Boolean isFullMatch, Integer pageNumber, Integer maxResults, String groupName) {

        if(StringUtils.isNotBlank(search))
            search = isFullMatch ?  search  :  "%" + search + "%";
@@ -121,6 +121,7 @@ public class MerchantProgramService {

        MerchantProgramSearchResult merchantProgramSearchResult = new MerchantProgramSearchResult();
        Page<MerchantProgram> result = merchantProgramRepo.findAllMerchantProgramsBySearch(search,
            StringUtils.isEmpty(groupName) ? null : groupName,
            pageNumber == null || maxResults == null ? Pageable.unpaged() : PageRequest.of(pageNumber, maxResults));
        merchantProgramSearchResult.setMerchantPrograms(result.getContent());
        merchantProgramSearchResult.setMoreResults(pageNumber != null && maxResults != null && pageNumber != result.getTotalPages()-1);
 src/main/java/com/uownleasing/svc/service/UpdateProgramsService.java  0 → 100644
+
105
−
0

Visualizado
package com.uownleasing.svc.service;

import com.uownleasing.svc.config.ThreadAttributes;
import com.uownleasing.svc.db.entity.MerchantProgram;
import com.uownleasing.svc.db.repository.MerchantProgramRepo;
import com.uownleasing.svc.exceptions.SvcException;
import com.uownleasing.svc.pojo.MerchantProgramsUpdateRequest;
import com.uownleasing.svc.pojo.ProgramInfo;
import com.uownleasing.svc.utility.ConversionUtils;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.collections.MapUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.beans.PropertyDescriptor;
import java.lang.reflect.Method;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
public class UpdateProgramsService {
    private final MerchantProgramRepo merchantProgramRepo;
    private final MerchantLogService merchantLogService;

    @Autowired
    public UpdateProgramsService(MerchantProgramRepo merchantProgramRepo, MerchantLogService merchantLogService) {
        this.merchantProgramRepo = merchantProgramRepo;
        this.merchantLogService = merchantLogService;
    }

    public void updatePrograms(MerchantProgramsUpdateRequest request) {
        if (CollectionUtils.isEmpty(request.getProgramPks())) {
            throw new SvcException("The list of programs cannot be empty.");
        }

        Map<Method, Object> setters = buildSetters(request.getProgramData());

        for (Long pk : request.getProgramPks()) {
            updateSingleProgram(pk, setters);
        }
    }

    private Map<Method, Object> buildSetters(Map<String, Object> programData) {
        if (MapUtils.isEmpty(programData)) {
            return null;
        }

        return programData.entrySet().stream()
            .collect(Collectors.toMap(
                e -> getSetterMethod(e.getKey()),
                Map.Entry::getValue
            ));
    }

    private Method getSetterMethod(String propertyName) {
        try {
            return new PropertyDescriptor(
                propertyName,
                ProgramInfo.class,
                "get" + StringUtils.capitalize(propertyName),
                "set" + StringUtils.capitalize(propertyName)
            ).getWriteMethod();
        } catch (Exception ex) {
            log.error("[updatePrograms] Error getting setter method {} for program info", propertyName, ex);
            return null;
        }
    }

    private void updateSingleProgram(Long pk, Map<Method, Object> setters) {
        MerchantProgram program = merchantProgramRepo.findByPk(pk);
        ProgramInfo oldProgramInfo = copyProgramInfo(program.getProgramInfo());

        if (MapUtils.isNotEmpty(setters)) {
            try {
                applySetters(program.getProgramInfo(), setters);
                merchantProgramRepo.save(program);
                merchantLogService.createMerchantActivity(oldProgramInfo, program.getProgramInfo(), ThreadAttributes.getUsername());
            } catch (Exception e) {
                log.error("[updatePrograms] Error trying to update program pk: {}", pk, e);
            }
        }
    }

    private ProgramInfo copyProgramInfo(ProgramInfo programInfo) {
        ProgramInfo copy = new ProgramInfo();
        org.springframework.beans.BeanUtils.copyProperties(programInfo, copy);
        return copy;
    }

    private void applySetters(ProgramInfo programInfo, Map<Method, Object> setters) throws Exception {
        for (Map.Entry<Method, Object> entry : setters.entrySet()) {
            Method method = entry.getKey();
            Object value = entry.getValue();

            if (method != null && value != null) {
                Class<?> expectedType = method.getParameterTypes()[0];
                Object convertedValue = ConversionUtils.convertValue(value, expectedType);
                method.invoke(programInfo, convertedValue);
            }
        }
    }
}
 src/main/java/com/uownleasing/svc/utility/ConversionUtils.java  0 → 100644
+
62
−
0

Visualizado
package com.uownleasing.svc.utility;

import java.math.BigDecimal;

public class ConversionUtils {
    private ConversionUtils() {
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    public static Object convertValue(Object value, Class<?> targetType) {
        if (value == null) return null;

        if (targetType.isAssignableFrom(value.getClass())) {
            return value;
        }

        if (targetType == BigDecimal.class) {
            if (value instanceof Number) {
                return BigDecimal.valueOf(((Number) value).doubleValue());
            }
            if (value instanceof String) {
                try {
                    return new BigDecimal((String) value);
                } catch (NumberFormatException e) {
                    throw new IllegalArgumentException("Invalid BigDecimal value: " + value, e);
                }
            }
        }

        if (targetType == Boolean.class || targetType == boolean.class) {
            if (value instanceof Boolean) return value;
            if (value instanceof String) return Boolean.parseBoolean((String) value);
            if (value instanceof Number) return ((Number) value).intValue() != 0;
        }

        if (value instanceof Number) {
            Number number = (Number) value;
            if (targetType == Integer.class || targetType == int.class) return number.intValue();
            if (targetType == Long.class || targetType == long.class) return number.longValue();
            if (targetType == Double.class || targetType == double.class) return number.doubleValue();
            if (targetType == Float.class || targetType == float.class) return number.floatValue();
            if (targetType == Short.class || targetType == short.class) return number.shortValue();
            if (targetType == Byte.class || targetType == byte.class) return number.byteValue();
        }

        if (targetType.isEnum()) {
            try {
                return Enum.valueOf((Class<Enum>) targetType, value.toString());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException(
                    "Invalid enum value '" + value + "' for type " + targetType.getSimpleName(), e
                );
            }
        }

        if (targetType == String.class) {
            return String.valueOf(value);
        }

        return value;
    }
}
 src/test/java/com/uownleasing/svc/MerchantProgramServiceTest.java → src/test/java/com/uownleasing/svc/service/merchantProgramService/CloneProgramsTest.java 
+
8
−
9

Visualizado
package com.uownleasing.svc;
package com.uownleasing.svc.service.merchantProgramService;

import com.twilio.base.Page;
import com.uownleasing.common.enumeration.LogType;
import com.uownleasing.svc.db.entity.MerchantProgram;
import com.uownleasing.svc.db.repository.MerchantProgramRepo;
@@ -13,7 +12,6 @@ import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
@@ -22,13 +20,14 @@ import org.springframework.data.domain.PageImpl;
import org.thymeleaf.util.StringUtils;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.never;

public class MerchantProgramServiceTest {

public class CloneProgramsTest {
    @InjectMocks
    private MerchantProgramService merchantProgramService;
    @Mock
@@ -65,7 +64,7 @@ public class MerchantProgramServiceTest {
        List<ProgramInfo> programsInfo = List.of(p1, p2);
        String groupName = "GroupX";

        when(merchantProgramRepo.findAllMerchantProgramsBySearch(anyString(), any()))
        when(merchantProgramRepo.findAllMerchantProgramsBySearch(anyString(), anyString(), any()))
            .thenReturn(new PageImpl<>(List.of()));
        when(merchantProgramRepo.findByPk(mp1.getPk()))
            .thenReturn(mp1);
@@ -108,7 +107,7 @@ public class MerchantProgramServiceTest {
        MerchantProgram mp1 = mockMerchantProgram(programInfo);
        MerchantProgram existingProgram = mockMerchantProgram(programInfo);

        when(merchantProgramRepo.findAllMerchantProgramsBySearch(anyString(), any()))
        when(merchantProgramRepo.findAllMerchantProgramsBySearch(anyString(), anyString(), any()))
            .thenReturn(new PageImpl<>(List.of(existingProgram)));
        when(merchantProgramRepo.findByPk(mp1.getPk()))
            .thenReturn(mp1);
@@ -137,7 +136,7 @@ public class MerchantProgramServiceTest {

        MerchantProgram existingProgram = mockMerchantProgram(programInfo);

        when(merchantProgramRepo.findAllMerchantProgramsBySearch(anyString(), any()))
        when(merchantProgramRepo.findAllMerchantProgramsBySearch(anyString(), anyString(), any()))
            .thenReturn(new PageImpl<>(List.of(existingProgram)));
        when(merchantProgramRepo.findByPk(mp1.getPk()))
            .thenReturn(mp1);
 src/test/java/com/uownleasing/svc/utility/ConversionUtilsTest.java  0 → 100644
+
107
−
0

Visualizado
package com.uownleasing.svc.utility;

import org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;

public class ConversionUtilsTest {

    @Test
    void shouldReturnNullWhenValueIsNull() {
        assertNull(ConversionUtils.convertValue(null, String.class));
    }

    @Test
    void shouldReturnSameValueWhenAlreadyAssignable() {
        String value = "test";
        assertSame(value, ConversionUtils.convertValue(value, String.class));
    }

    @Test
    void shouldConvertNumberToBigDecimal() {
        assertEquals(BigDecimal.valueOf(10.5), ConversionUtils.convertValue(10.5, BigDecimal.class));
    }

    @Test
    void shouldConvertStringToBigDecimal() {
        assertEquals(new BigDecimal("123.45"), ConversionUtils.convertValue("123.45", BigDecimal.class));
    }

    @Test
    void shouldThrowWhenInvalidBigDecimalString() {
        assertThrows(IllegalArgumentException.class, () -> ConversionUtils.convertValue("abc", BigDecimal.class));
    }

    @Test
    void shouldConvertStringToBoolean() {
        assertTrue((Boolean) ConversionUtils.convertValue("true", Boolean.class));
        assertFalse((Boolean) ConversionUtils.convertValue("false", Boolean.class));
    }

    @Test
    void shouldConvertNumberToBoolean() {
        assertTrue((Boolean) ConversionUtils.convertValue(1, Boolean.class));
        assertFalse((Boolean) ConversionUtils.convertValue(0, Boolean.class));
    }

    @Test
    void shouldConvertNumberToInteger() {
        assertEquals(42, ConversionUtils.convertValue(42.9, Integer.class));
    }

    @Test
    void shouldConvertNumberToLong() {
        assertEquals(42L, ConversionUtils.convertValue(42, Long.class));
    }

    @Test
    void shouldConvertNumberToDouble() {
        assertEquals(42.5, ConversionUtils.convertValue(42.5f, Double.class));
    }

    @Test
    void shouldConvertNumberToFloat() {
        assertEquals(42.5f, ConversionUtils.convertValue(42.5, Float.class));
    }

    @Test
    void shouldConvertNumberToShort() {
        assertEquals((short) 5, ConversionUtils.convertValue(5, Short.class));
    }

    @Test
    void shouldConvertNumberToByte() {
        assertEquals((byte) 5, ConversionUtils.convertValue(5, Byte.class));
    }

    enum SampleEnum { ONE, TWO }

    @Test
    void shouldConvertStringToEnum() {
        assertEquals(SampleEnum.ONE, ConversionUtils.convertValue("ONE", SampleEnum.class));
    }

    @Test
    void shouldThrowWhenInvalidEnumValue() {
        assertThrows(IllegalArgumentException.class, () -> ConversionUtils.convertValue("THREE", SampleEnum.class));
    }

    @Test
    void shouldConvertToString() {
        assertEquals("123", ConversionUtils.convertValue(123, String.class));
    }

    @Test
    void shouldReturnValueWhenNoConversionPossible() {
        Object custom = new Object();
        assertSame(custom, ConversionUtils.convertValue(custom, custom.getClass()));
    }
}
 src/test/java/com/uownleasing/svc/UpdateProgramsServiceTest.java  0 → 100644
+
155
−
0

Visualizado
package com.uownleasing.svc;

import com.uownleasing.common.enumeration.LendingCategoryType;
import com.uownleasing.svc.db.entity.MerchantProgram;
import com.uownleasing.svc.db.repository.MerchantProgramRepo;
import com.uownleasing.svc.enumeration.MerchantProgramType;
import com.uownleasing.svc.exceptions.SvcException;
import com.uownleasing.svc.pojo.MerchantProgramsUpdateRequest;
import com.uownleasing.svc.pojo.ProgramInfo;
import com.uownleasing.svc.service.UpdateProgramsService;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class UpdateProgramsServiceTest {
    @Mock
    private MerchantProgramRepo merchantProgramRepo;

    @InjectMocks
    private UpdateProgramsService updateProgramsService;

    private MerchantProgram mockProgram;

    @BeforeEach
    void setUp() {
        ProgramInfo mockProgramInfo = new ProgramInfo();
        mockProgramInfo.setProgramId("P-123");
        mockProgramInfo.setProgramName("Old Program");
        mockProgramInfo.setPeakCampaignId(111);
        mockProgramInfo.setOffPeakCampaignId(222);
        mockProgramInfo.setMoneyFactor(new BigDecimal("0.123456"));
        mockProgramInfo.setQuickPayPct(new BigDecimal("0.12"));
        mockProgramInfo.setPayoffDiscount(new BigDecimal("0.15"));
        mockProgramInfo.setChargeAppFeeIfDeliveryIsZero(true);
        mockProgramInfo.setDealerDiscount(new BigDecimal("0.10"));
        mockProgramInfo.setMaxDollarAmount(new BigDecimal("9999.99"));
        mockProgramInfo.setDealerRebate(new BigDecimal("0.20"));
        mockProgramInfo.setEpoDays(90);
        mockProgramInfo.setEpoFeePercent(new BigDecimal("0.05"));
        mockProgramInfo.setMinCartAmount(new BigDecimal("50.00"));
        mockProgramInfo.setMaxCartAmount(new BigDecimal("1000.00"));
        mockProgramInfo.setTermMonths(13);
        mockProgramInfo.setProgramType(MerchantProgramType.SAME_AS_CASH);
        mockProgramInfo.setLendingCategoryType(LendingCategoryType.LTO);
        mockProgramInfo.setAllowedFrequencyOverride("MONTHLY");
        mockProgramInfo.setStates("AK, AL, AR");
        mockProgramInfo.setProcessingFeeOverride(new BigDecimal("1.5"));
        mockProgramInfo.setAmountChargedAtSigning(new BigDecimal("25.00"));
        mockProgramInfo.setGroupName("Old Group");

        mockProgram = new MerchantProgram();
        mockProgram.setPk(1L);
        mockProgram.setProgramInfo(mockProgramInfo);
    }

    @Test
    void shouldThrowExceptionWhenProgramsPksIsEmpty() {
        // Arrange
        MerchantProgramsUpdateRequest request = new MerchantProgramsUpdateRequest();
        request.setProgramPks(Collections.emptyList());

        // Act & Assert
        Assertions.assertThrows(SvcException.class, () -> updateProgramsService.updatePrograms(request));
    }

    @Test
    void shouldUpdateSpecifiedFieldsAndKeepOthersUnchanged() {
        // Arrange
        MerchantProgramsUpdateRequest request = new MerchantProgramsUpdateRequest();
        request.setProgramPks(List.of(1L));

        Map<String, Object> data = new HashMap<>();
        data.put("groupName", "New Group Name");
        data.put("minCartAmount", 96.5);
        request.setProgramData(data);

        when(merchantProgramRepo.findByPk(1L)).thenReturn(mockProgram);

        // Act
        updateProgramsService.updatePrograms(request);

        // Assert
        ProgramInfo updated = mockProgram.getProgramInfo();
        Assertions.assertEquals("New Group Name", updated.getGroupName());
        Assertions.assertEquals(new BigDecimal("96.5"), updated.getMinCartAmount());

        Assertions.assertEquals("P-123", updated.getProgramId());
        Assertions.assertEquals("Old Program", updated.getProgramName());
        Assertions.assertEquals(111, updated.getPeakCampaignId());
        Assertions.assertEquals(222, updated.getOffPeakCampaignId());
        Assertions.assertEquals(new BigDecimal("0.123456"), updated.getMoneyFactor());
        Assertions.assertEquals(new BigDecimal("0.12"), updated.getQuickPayPct());
        Assertions.assertEquals(new BigDecimal("0.15"), updated.getPayoffDiscount());
        Assertions.assertTrue(updated.getChargeAppFeeIfDeliveryIsZero());
        Assertions.assertEquals(new BigDecimal("0.10"), updated.getDealerDiscount());
        Assertions.assertEquals(new BigDecimal("9999.99"), updated.getMaxDollarAmount());
        Assertions.assertEquals(new BigDecimal("0.20"), updated.getDealerRebate());
        Assertions.assertEquals(90, updated.getEpoDays());
        Assertions.assertEquals(new BigDecimal("0.05"), updated.getEpoFeePercent());
        Assertions.assertEquals(new BigDecimal("1000.00"), updated.getMaxCartAmount());
        Assertions.assertEquals(13, updated.getTermMonths());
        Assertions.assertEquals(MerchantProgramType.SAME_AS_CASH, updated.getProgramType());
        Assertions.assertEquals(LendingCategoryType.LTO, updated.getLendingCategoryType());
        Assertions.assertEquals("MONTHLY", updated.getAllowedFrequencyOverride());
        Assertions.assertEquals("AK, AL, AR", updated.getStates());
        Assertions.assertEquals(new BigDecimal("1.5"), updated.getProcessingFeeOverride());
        Assertions.assertEquals(new BigDecimal("25.00"), updated.getAmountChargedAtSigning());

        verify(merchantProgramRepo, times(1)).save(mockProgram);
    }

    @Test
    void shouldNotSaveWhenProgramDataIsEmpty() {
        // Arrange
        MerchantProgramsUpdateRequest request = new MerchantProgramsUpdateRequest();
        request.setProgramPks(List.of(1L));
        request.setProgramData(Collections.emptyMap());
        when(merchantProgramRepo.findByPk(1L)).thenReturn(mockProgram);

        // Act
        updateProgramsService.updatePrograms(request);

        // Assert
        verify(merchantProgramRepo, never()).save(any());
    }

    @Test
    void shouldIgnoreInvalidFieldAndContinueExecution() {
        // Arrange
        MerchantProgramsUpdateRequest request = new MerchantProgramsUpdateRequest();
        request.setProgramPks(List.of(1L));
        request.setProgramData(Map.of("nonExistentField", "test"));
        when(merchantProgramRepo.findByPk(1L)).thenReturn(mockProgram);

        // Act & Assert
        Assertions.assertDoesNotThrow(() -> updateProgramsService.updatePrograms(request));
    }
}

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

1. Quando um usuário com permissão programSettings acessa a página Program Settings, o ícone deve aparecer na barra de navegação e o usuário deve ser capaz de visualizar a tabela de programas com opções de seleção
1. When a user with programSettings permission accesses the Program Settings page, the icon should appear in the navigation bar and the user should be able to view the program table with selection options

2.1 Quando um usuário seleciona um ou múltiplos programas na tabela do Program Settings e altera campos financeiros (como Money Factor, Pay Off Discount e Processing Fee Override) para ajustar programas de clientes com histórico de inadimplência, apenas os campos alterados devem ser atualizados nos programas selecionados, mantendo os demais campos inalterados. O sistema deve gerar logs detalhados para cada campo modificado, registrando o valor anterior e o novo valor
2.1 When a user selects one or multiple programs in the Program Settings table and changes financial fields (such as Money Factor, Pay Off Discount, and Processing Fee Override) to adjust programs for clients with a history of delinquency, only the changed fields should be updated in the selected programs, keeping the other fields unchanged. The system must generate detailed logs for each modified field, recording the previous value and the new value.

2.2 Quando um usuário seleciona um ou múltiplos programas no Program Settings e ajusta limites de valor (Min Cart Amount, Max Cart Amount) e a frequência de pagamento (Allowed Frequency Override) para minimizar riscos financeiros, o sistema deve atualizar somente esses campos alterados, preservando todos os outros dados originais dos programas. Cada alteração deve ser registrada em log, indicando quais campos foram modificados. 
2.2 When a user selects one or multiple programs in Program Settings and adjusts value limits (Min Cart Amount, Max Cart Amount) and payment frequency (Allowed Frequency Override) to minimize financial risks, the system should update only these changed fields, preserving all other original program data. Each modification must be logged, indicating which fields were changed.

2.3 Quando um usuário seleciona um ou múltiplos programas na tabela do Program Settings e modifica campos de entrada e taxas (Amount Charged at Signing, Dealer Discount Override, EPO Fee Percent) para endurecer condições de leasing voltadas a clientes de risco mais alto, apenas os campos alterados devem ser atualizados nos programas selecionados, mantendo os demais inalterados. O sistema deve gerar logs individuais para cada campo atualizado, permitindo rastreabilidade das mudanças.
2.3 When a user selects one or multiple programs in the Program Settings table and modifies input fields and fees (Amount Charged at Signing, Dealer Discount Override, EPO Fee Percent) to harden leasing conditions for higher-risk clients, only the changed fields should be updated in the selected programs, keeping the others unchanged. The system must generate individual logs for each updated field, allowing traceability of changes.

3. Quando um usuário tenta salvar alterações sem selecionar nenhum programa na página Program Settings, o botão Save deve permanecer desabilitado.
3. When a user tries to save changes without selecting any program on the Program Settings page, the Save button must remain disabled.

4. Quando um usuário cancela as alterações no painel de edição do Program Settings, os valores dos campos devem retornar aos valores iniciais mantendo os programas selecionados.
4. When a user cancels the changes in the Program Settings edit panel, the field values should revert to the initial values, keeping the selected programs.

5. Quando um usuário sem permissão programSettings tenta acessar a página Program Settings, o ícone não deve aparecer na barra de navegação e a página deve ser bloqueada.
5. When a user without programSettings permission tries to access the Program Settings page, the icon should not appear in the navigation bar and the page should be blocked.

6. Quando múltiplos usuários com permissão programSettings acessam simultaneamente a página Program Settings e selecionam diferentes programas, cada um deve visualizar e editar apenas os programas que selecionou sem conflitos e paginar normalmente.
6. When multiple users with programSettings permission access the Program Settings page simultaneously and select different programs, each should view and edit only the programs they selected without conflicts and paginate normally.

7. Na tabela do Program Settings, a coluna Program Name deve ser não clicável (sem redirecionamento) diferente da página Programs, permitindo apenas a seleção de linhas.
7. In the Program Settings table, the Program Name column should be non-clickable (without redirection) unlike the Programs page, allowing only row selection.

8. Quando um usuário aplica filtros de busca e/ou Program Group na página Program Settings, a paginação deve funcionar corretamente ao navegar entre páginas.
8. When a user applies search filters and/or Program Group on the Program Settings page, pagination should work correctly when navigating between pages.

9. Quando o backend recebe uma requisição para atualizar programas com apenas alguns campos preenchidos, deve atualizar apenas esses campos e manter os demais valores originais, gerando logs apenas para os campos modificados.
9. When the backend receives a request to update programs with only some fields filled in, it should update only those fields and keep the other original values, generating logs only for the modified fields.

-----


> ## Tests in qa1

> ```gherkin

> **When a user with programSettings permission accesses the Program Settings page, the icon should appear in the navigation bar and the user should be able to view the program table with selection options**

> !

> **| PASS |**
> ```

---

> ```gherkin

> **When a user selects one or multiple programs in the Program Settings table and changes financial fields (such as Money Factor, Pay Off Discount, and Processing Fee Override) to adjust programs for clients with a history of delinquency, only the changed fields should be updated in the selected programs, keeping the other fields unchanged. The system must generate detailed logs for each modified field, recording the previous value and the new value**

> !

> **| PASS |**
> ```

---

> ```gherkin

> **When a user selects one or multiple programs in Program Settings and adjusts value limits (Min Cart Amount, Max Cart Amount) and payment frequency (Allowed Frequency Override) to minimize financial risks, the system should update only these changed fields, preserving all other original program data. Each modification must be logged, indicating which fields were changed**

> !

> **| PASS |**
> ```

---

> ```gherkin

> **When a user selects one or multiple programs in the Program Settings table and modifies input fields and fees (Amount Charged at Signing, Dealer Discount Override, EPO Fee Percent) to harden leasing conditions for higher-risk clients, only the changed fields should be updated in the selected programs, keeping the others unchanged. The system must generate individual logs for each updated field, allowing traceability of changes**

> !

> **| PASS |**
> ```

---

> ```gherkin

> **When a user tries to save changes without selecting any program on the Program Settings page, the Save button must remain disabled**

> !

> **| PASS |**
> ```

---

> ```gherkin

> **When a user cancels the changes in the Program Settings edit panel, the field values should revert to the initial values, keeping the selected programs**

> !

> **| PASS |**
> ```

---

> ```gherkin

> **When a user without programSettings permission tries to access the Program Settings page, the icon should not appear in the navigation bar and the page should be blocked**

> !

> **| PASS |**
> ```

---

> ```gherkin

> **When multiple users with programSettings permission access the Program Settings page simultaneously and select different programs, each should view and edit only the programs they selected without conflicts and paginate normally**

> !

> **| PASS |**
> ```

---

> ```gherkin

> **In the Program Settings table, the Program Name column should be non-clickable (without redirection) unlike the Programs page, allowing only row selection**

> !

> **| PASS |**
> ```

---

> ```gherkin

> **When a user applies search filters and/or Program Group on the Program Settings page, pagination should work correctly when navigating between pages**

> !

> **| PASS |**
> ```

---

> ```gherkin

> **When the backend receives a request to update programs with only some fields filled in, it should update only those fields and keep the other original values, generating logs only for the modified fields**

> !

> **| PASS |**
> ```

---

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

STG



> ## Tests in stg

> ```gherkin

> **When a user with programSettings permission accesses the Program Settings page, the icon should appear in the navigation bar and the user should be able to view the program table with selection options**

> ![image](/uploads/3f05f3f4dae453898803daadabc6213e/image.png){width=900 height=447}

> **| PASS |**
> ```

---

> ```gherkin

> **When a user selects one or multiple programs in the Program Settings table and changes financial fields (such as Money Factor, Pay Off Discount, and Processing Fee Override) to adjust programs for clients with a history of delinquency, only the changed fields should be updated in the selected programs, keeping the other fields unchanged. The system must generate detailed logs for each modified field, recording the previous value and the new value**

> ![Screenshot_at_Nov_17_16-14-01](/uploads/ecc1bfb67e83724fd88e518b3867fe5a/Screenshot_at_Nov_17_16-14-01.png){width=900 height=444}
> ![Screenshot_at_Nov_17_16-14-08](/uploads/95ed5c1d86b31bc0b0a762005d8ec19e/Screenshot_at_Nov_17_16-14-08.png){width=900 height=443}
> ![Screenshot_at_Nov_17_16-14-20](/uploads/bbedfcc96546a0058df03f081a92147f/Screenshot_at_Nov_17_16-14-20.png){width=900 height=445}
> ![Screenshot_at_Nov_17_16-16-26](/uploads/a95be968b896ed4b0b6aecc76ccaa499/Screenshot_at_Nov_17_16-16-26.png){width=862 height=600}
> ![Screenshot_at_Nov_17_16-16-46](/uploads/194929adae4cdc5b0d1943b97e6c7da6/Screenshot_at_Nov_17_16-16-46.png){width=861 height=600}
> ![Screenshot_at_Nov_17_16-17-06](/uploads/df2845aaa522898d4a23c80ea3621491/Screenshot_at_Nov_17_16-17-06.png){width=900 height=445}
> ![Screenshot_at_Nov_17_16-17-43](/uploads/53c3cb9982638a9d72684ad36285e0b3/Screenshot_at_Nov_17_16-17-43.png){width=900 height=109}
> ![Screenshot_at_Nov_17_16-18-57](/uploads/206cae03132395f98c89689097bc4a78/Screenshot_at_Nov_17_16-18-57.png){width=900 height=446}
> ![Screenshot_at_Nov_17_16-19-07](/uploads/4cd3e815f6c1fe83d996c948e007940c/Screenshot_at_Nov_17_16-19-07.png){width=900 height=107}
> ![Screenshot_at_Nov_17_16-20-52](/uploads/8df24fa447272e6ce7fd636d54b3e20b/Screenshot_at_Nov_17_16-20-52.png){width=900 height=448}
> ![Screenshot_at_Nov_17_16-21-00](/uploads/e7915c34f94ffc327ab7b1bec0fdc814/Screenshot_at_Nov_17_16-21-00.png){width=900 height=107}
> ![Screenshot_at_Nov_17_16-25-18](/uploads/a38e268efc885501fab59745394e14cf/Screenshot_at_Nov_17_16-25-18.png){width=900 height=27}
> ![Screenshot_at_Nov_17_16-25-49](/uploads/6a6e049d1ff334d384ab39c6938f2be2/Screenshot_at_Nov_17_16-25-49.png){width=900 height=31}
> ![Screenshot_at_Nov_17_16-26-11](/uploads/bd644cd42d4134ef6e994ec4f7df0696/Screenshot_at_Nov_17_16-26-11.png){width=900 height=29}

> **| PASS |**
> ```

---

> ```gherkin

> **When a user selects one or multiple programs in Program Settings and adjusts value limits (Min Cart Amount, Max Cart Amount) and payment frequency (Allowed Frequency Override) to minimize financial risks, the system should update only these changed fields, preserving all other original program data. Each modification must be logged, indicating which fields were changed**

> ![Screenshot_at_Nov_17_16-29-49](/uploads/822e781768ed9264fd20d2b7790629e0/Screenshot_at_Nov_17_16-29-49.png){width=900 height=443}
> ![Screenshot_at_Nov_17_16-29-57](/uploads/dea4c1656b75b2d119a8fcca7bea3110/Screenshot_at_Nov_17_16-29-57.png){width=900 height=446}
> ![Screenshot_at_Nov_17_16-30-50](/uploads/ef1e206f267496f878449d28a3eb14fe/Screenshot_at_Nov_17_16-30-50.png){width=786 height=600}
> ![Screenshot_at_Nov_17_16-31-07](/uploads/dfe9a5252ef89d0d2c2d026366c9e4a4/Screenshot_at_Nov_17_16-31-07.png){width=864 height=600}
> ![Screenshot_at_Nov_17_16-31-35](/uploads/f4d07ececf7c97ec76a017ebcd28e0f7/Screenshot_at_Nov_17_16-31-35.png){width=900 height=447}
> ![Screenshot_at_Nov_17_16-31-45](/uploads/7064bb3a659984706f8af68244b43b36/Screenshot_at_Nov_17_16-31-45.png){width=900 height=117}
> ![Screenshot_at_Nov_17_16-32-01](/uploads/08ec49b323f585aa0d8611d5f07e726f/Screenshot_at_Nov_17_16-32-01.png){width=900 height=444}
> ![Screenshot_at_Nov_17_16-32-08](/uploads/30d6eb90ff23722d8a482d0de0dfe365/Screenshot_at_Nov_17_16-32-08.png){width=900 height=98}

> **| PASS |**
> ```

---

> ```gherkin

> **When a user selects one or multiple programs in the Program Settings table and modifies input fields and fees (Amount Charged at Signing, Dealer Discount Override, EPO Fee Percent) to harden leasing conditions for higher-risk clients, only the changed fields should be updated in the selected programs, keeping the others unchanged. The system must generate individual logs for each updated field, allowing traceability of changes**

![image](/uploads/4754eaf202f9ba5c5a9dbd7d0d8c670b/image.png){width=864 height=600}

> ![Screenshot_at_Nov_17_16-33-47](/uploads/63a3b712f65d414a062689fce0ebd646/Screenshot_at_Nov_17_16-33-47.png){width=787 height=600}
> ![Screenshot_at_Nov_17_16-38-12](/uploads/0105d73c6dfb46eef0d2d9006a96fcc3/Screenshot_at_Nov_17_16-38-12.png){width=900 height=445}
> ![Screenshot_at_Nov_17_16-38-28](/uploads/8543c508d2add4cbf6130eedf9bcf073/Screenshot_at_Nov_17_16-38-28.png){width=900 height=79}

> **| PASS |**
> ```

---

> ```gherkin

> **When a user tries to save changes without selecting any program on the Program Settings page, the Save button must remain disabled**

> ![image](/uploads/99baaa0611f1a34986c997a69bbbb150/image.png){width=782 height=600}

> **| PASS |**
> ```

---

> ```gherkin

> **When a user cancels the changes in the Program Settings edit panel, the field values should revert to the initial values, keeping the selected programs**

> **| PASS |**
> ```

---

> ```gherkin

> **When a user without programSettings permission tries to access the Program Settings page, the icon should not appear in the navigation bar and the page should be blocked**

> ![image](/uploads/518ab3613b9a607862f9122d9f49cd4b/image.png){width=900 height=445}

> **| PASS |**
> ```

---

> ```gherkin

> **When multiple users with programSettings permission access the Program Settings page simultaneously and select different programs, each should view and edit only the programs they selected without conflicts and paginate normally**

> **| PASS |**
> ```

---

> ```gherkin

> **In the Program Settings table, the Program Name column should be non-clickable (without redirection) unlike the Programs page, allowing only row selection**

> ![image](/uploads/5168f5adb79c148a35d97620b91452a4/image.png){width=573 height=128}

> **| PASS |**
> ```

---

> ```gherkin

> **When a user applies search filters and/or Program Group on the Program Settings page, pagination should work correctly when navigating between pages**

> **| PASS |**
> ```

---

> ```gherkin

> **When the backend receives a request to update programs with only some fields filled in, it should update only those fields and keep the other original values, generating logs only for the modified fields**

> **| PASS |**
> ```

---

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
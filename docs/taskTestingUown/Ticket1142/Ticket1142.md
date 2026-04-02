---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

R7.1.25.46.0

```markdown
# UOWN | Origination | Remove Selector from fundingModificationHistory page  
# UOWN | Origination | Remover o seletor da página fundingModificationHistory  

---

## 🇺🇸 English

### Status  
Open  
Ticket created 1 week ago by **Marcos Silvano**

### Description  
**UOWN | Origination | Remove Selector from `fundingModificationHistory` page**  
The selectors on that page are redundant and don't work for the email CSV functionality.

### Attributes  
**Status:** To do  
**Assignee:** Marcos Silvano  
**Labels:** dev, full-stack, priority: low, workflow: qa-in-process  
**Milestone:** Uown | RU11.25.1.46.0  
**Parent Epic:** Uown | RU10.25.1.46.0  

### Development  
**Merge Request:** [!1308](uown/frontend/origination!1308)  
**Description:** R1.46.0 row selectors removed from funding modification history  
**Merged:** ✅  

### Participants  
- Marcos Silvano  
- Yuri Araujo  
- Priyanka Namburu  

### Test Instructions  
The `fundingModificationHistory` page selectors were exclusively used by the export CSV and send CSV email features, both of which have been nonfunctional for a long time.  
Removing these selectors helps **simplify** and **clean up** the page.

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## 🇧🇷 Português


**UOWN | Origination | Remover o seletor da página `fundingModificationHistory`**  
Os seletores dessa página são redundantes e não funcionam corretamente com a funcionalidade de exportação e envio de CSV por e-mail.

### Atributos  
**Status:** A fazer  
**Responsável:** Marcos Silvano  
**Etiquetas:** dev, full-stack, prioridade: baixa, workflow: qa-in-process  
**Marco:** Uown | RU11.25.1.46.0  
**Épico Principal:** Uown | RU10.25.1.46.0  

### Desenvolvimento  
**Merge Request:** [!1308](uown/frontend/origination!1308)  
**Descrição:** R1.46.0 seletores de linha removidos da página funding modification history  
**Mesclado:** ✅  

### Participantes  
- Marcos Silvano  
- Yuri Araujo  
- Priyanka Namburu  

### Instruções de Teste  
Os seletores da página `fundingModificationHistory` eram utilizados exclusivamente pelas funcionalidades de exportação e envio de CSV por e-mail, ambas inoperantes há bastante tempo.  
A remoção desses seletores **simplifica** e **limpa** a estrutura da página.
```

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Alteracoes dev:


 3 arquivos
+
23
−
38
Arquivos
3
Pesquisar (por exemplo, *.vue) (F)

domain
‎/stores‎

funding-modifica
‎tion-history.tsx‎
+4 -4

mod
‎els‎

funding-modificati
‎on-history-body.ts‎
+1 -1

pages/fundingMod
‎ificationHistory‎

inde
‎x.tsx‎
+18 -33

 domain/stores/funding-modification-history.tsx 
+
4
−
4

Visualizado
import {ResponseType} from '@uownleasing/common-ui';
import {persist} from '@uownleasing/mobx-persist-session';
import {FundingtModificationHistoryBody} from '@models';
import {FundingModificationHistoryBody} from '@models';
import {action, makeObservable, observable} from 'mobx';
import {BaseStore} from './base';
import {RootStore} from './root';
@@ -8,7 +8,7 @@ import {RootStore} from './root';
export class FundingModificationHistoryStore extends BaseStore {
  @observable
  @persist('object')
  searchQuery: FundingtModificationHistoryBody = undefined;
  searchQuery: FundingModificationHistoryBody = undefined;

  constructor(rootStore: RootStore) {
    super(rootStore);
@@ -17,7 +17,7 @@ export class FundingModificationHistoryStore extends BaseStore {

  @action
  getFundingModifications = async (
    body: FundingtModificationHistoryBody,
    body: FundingModificationHistoryBody,
  ): Promise<ResponseType> => {
    const {utilityStore} = this.rootStore;

@@ -43,7 +43,7 @@ export class FundingModificationHistoryStore extends BaseStore {
  };

  @action
  setSearchQuery = (searchQuery: FundingtModificationHistoryBody) => {
  setSearchQuery = (searchQuery: FundingModificationHistoryBody) => {
    this.searchQuery = searchQuery;
  };

 models/funding-modification-history-body.ts 
+
1
−
1

Visualizado
export interface FundingtModificationHistoryBody {
export interface FundingModificationHistoryBody {
  startDate: string;
  endDate: string;
  pageNumber: number;
 pages/fundingModificationHistory/index.tsx 
+
18
−
33

Visualizado
@@ -16,7 +16,7 @@ import {
} from '@utils/helper';
import {
  FundingModificationItems,
  FundingtModificationHistoryBody,
  FundingModificationHistoryBody,
} from '@models';
import {OverviewStore} from '@stores/overview';
import * as Yup from 'yup';
@@ -36,17 +36,13 @@ const FundingModificationHistory = (props: FundingModificationHistoryProps) => {
    FundingModificationItems[]
  >([]);
  const [emailModalOpen, setEmailModalOpen] = useState<boolean>(false);
  const [selectedRows, setSelectedRows] = useState<FundingModificationItems[]>(
    [],
  );
  const [allRowsSelected, setAllRowsSelected] = useState<boolean>(false);
  const [csvData, setCsvData] = useState<FundingModificationItems[]>([]);
  const [totalCount, setTotalCount] = useState<number>();

  const handlePayload = (
    data: Partial<FundingtModificationHistoryBody>,
  ): FundingtModificationHistoryBody => {
    const payload: FundingtModificationHistoryBody = {
    data: Partial<FundingModificationHistoryBody>,
  ): FundingModificationHistoryBody => {
    const payload: FundingModificationHistoryBody = {
      startDate: formatDate({
        f: 'api',
        d: getDate(data?.startDate || ''),
@@ -69,7 +65,7 @@ const FundingModificationHistory = (props: FundingModificationHistoryProps) => {
  };

  const handleGetFundingModifications = async (
    payload: Partial<FundingtModificationHistoryBody>,
    payload: Partial<FundingModificationHistoryBody>,
  ) => {
    try {
      const dataPayload = handlePayload(payload);
@@ -96,7 +92,7 @@ const FundingModificationHistory = (props: FundingModificationHistoryProps) => {
  useEffect(() => {
    const promises = [];
    promises.push(handleGetFundingModifications(searchQuery));
    Promise.all(promises).then(() => utilityStore?.setIsLoading(false));
    Promise.all(promises).then(() => utilityStore.setIsLoading(false));
  }, []);

  const formik = useFormik({
@@ -137,9 +133,9 @@ const FundingModificationHistory = (props: FundingModificationHistoryProps) => {
  const filterProps = getFundingModificationHistoryConfig(formik);

  const onChangePage = async (page: number) => {
    const {startDate, endDate} = formik?.values || {};
    const {startDate, endDate} = formik.values || {};
    await handleGetFundingModifications({
      ...formik?.values,
      ...formik.values,
      startDate: formatDate({f: 'api', d: getDate(startDate)}) || '',
      endDate: formatDate({f: 'api', d: getDate(endDate)}) || '',
      pageNumber: page - 1,
@@ -148,9 +144,9 @@ const FundingModificationHistory = (props: FundingModificationHistoryProps) => {
  };

  const onChangeRowsPerPage = async (newPerPage: number, page: number) => {
    const {startDate, endDate} = formik?.values || {};
    const {startDate, endDate} = formik.values || {};
    await handleGetFundingModifications({
      ...formik?.values,
      ...formik.values,
      startDate: formatDate({f: 'api', d: getDate(startDate)}) || '',
      endDate: formatDate({f: 'api', d: getDate(endDate)}) || '',
      pageNumber: page - 1,
@@ -168,7 +164,7 @@ const FundingModificationHistory = (props: FundingModificationHistoryProps) => {
    ...column,
    key: column?.key?.split('.')?.[1] || column?.key,
  }));
  const csvDownloadName = `Funding Modification History (${formik?.values?.startDate} - ${formik?.values?.endDate}).csv`;
  const csvDownloadName = `Funding Modification History (${formik.values?.startDate} - ${formik.values?.endDate}).csv`;

  const formatCsvData = (data: any[]) => {
    const formattedData =
@@ -185,10 +181,7 @@ const FundingModificationHistory = (props: FundingModificationHistoryProps) => {
  };

  const updateCSVData = async () => {
    if (selectedRows?.length && !allRowsSelected) {
      const csvLeads = formatCsvData(selectedRows);
      setCsvData(csvLeads);
    } else if (allRowsSelected || fundingModifications?.length > 0) {
    if (fundingModifications?.length > 0) {
      const {
        startDate,
        endDate,
@@ -196,10 +189,10 @@ const FundingModificationHistory = (props: FundingModificationHistoryProps) => {
        oldLeadStatus,
        newFundingQueueStatus,
        oldFundingQueueStatus,
      } = formik?.values;
      } = formik.values;
      const maxRes = 5000;
      const totalItems = totalCount || maxRes;
      const payload: Partial<FundingtModificationHistoryBody> = {
      const payload: Partial<FundingModificationHistoryBody> = {
        startDate: formatDate({f: 'api', d: startDate}),
        endDate: formatDate({f: 'api', d: endDate}),
        maxResults: totalItems,
@@ -232,16 +225,11 @@ const FundingModificationHistory = (props: FundingModificationHistoryProps) => {

  const endpointParams = () => ({
    body: handlePayload({
      ...formik?.values,
      ...formik.values,
      maxResults: searchQuery?.totalRows,
    }),
  });

  const handleRowSelection = ({allSelected, selectedRows}) => {
    allSelected !== allRowsSelected && setAllRowsSelected(allSelected);
    setSelectedRows(selectedRows);
  };

  return (
    <AuthWrapper title="Funding Modification History">
      <div>
@@ -260,9 +248,7 @@ const FundingModificationHistory = (props: FundingModificationHistoryProps) => {
          paginationRowsPerPageOptions={paginationRowsPerPageOptions}
          paginationTotalRows={searchQuery?.totalRows}
          paginationPerPage={searchQuery?.maxResults || 10}
          selectableRows={true}
          onSelectedRowsChange={handleRowSelection}
          progressPending={utilityStore?.isLoading}
          progressPending={utilityStore.isLoading}
          highlightOnHover
          striped
        />
@@ -271,12 +257,11 @@ const FundingModificationHistory = (props: FundingModificationHistoryProps) => {
      <EmailCSVModal
        emailModal={emailModalOpen}
        setEmailModal={setEmailModalOpen}
        sendEmailCSV={overviewStore?.sendEmailCSV}
        isLoading={utilityStore?.isLoading}
        sendEmailCSV={overviewStore.sendEmailCSV}
        isLoading={utilityStore.isLoading}
        columnKeys={emailCsvCols}
        endpointParams={endpointParams()}
        endpoint="/uown/los/getFundingModifications"
        selectedRows={selectedRows?.map((row) => '' + row?.leadPk)}
      />
    </AuthWrapper>
  );

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Ao acessar a página fundingModificationHistory, o usuário não deve visualizar seletores de linha (checkboxes) e as funcionalidades de exportação CSV e envio por email devem processar todos os registros conforme os filtros aplicados
When accessing the fundingModificationHistory page, the user should not see any row selectors (checkboxes), and the CSV export and email send functionalities must process all records according to the applied filters

Quando o usuário filtra registros por data de início e fim na página fundingModificationHistory, a tabela deve exibir corretamente os resultados, paginar mantendo o estado sem seletores de linha e respeitar as permissões do usuário
When the user filters records by start and end dates on the fundingModificationHistory page, the table must correctly display the results, paginate while maintaining state without row selectors, and respect the user’s permissions

Na API, as requisições para fundingModifications devem processar corretamente sem depender do parâmetro de linhas selecionadas, retornando todos os registros conforme os filtros (startDate, endDate, leadStatus) aplicados
In the API, requests to fundingModifications must process correctly without relying on the selected rows parameter, returning all records according to the applied filters (startDate, endDate, leadStatus)

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


> ## Tests in qa1

> ```gherkin

> **When accessing the fundingModificationHistory page, the user should not see any row selectors (checkboxes), and the CSV export and email send functionalities must process all records according to the applied filters.**

> ![Screenshot_at_Nov_03_13-44-37](/uploads/441b2480428018ee83b50155cf853ec0/Screenshot_at_Nov_03_13-44-37.png){width=1550 height=984}
> ![Screenshot_at_Nov_03_13-44-52](/uploads/99dab27f6c08a0949ac00b33bc728d0c/Screenshot_at_Nov_03_13-44-52.png){width=1552 height=989}
> ![Screenshot_at_Nov_03_13-46-43](/uploads/279cc2560848a1da3569d5f202176ec8/Screenshot_at_Nov_03_13-46-43.png){width=766 height=311}
> ![Screenshot_at_Nov_03_13-49-59](/uploads/2672127bdc3ef9e90ac5dbd9ec16c4e6/Screenshot_at_Nov_03_13-49-59.png){width=484 height=634}
> ![Screenshot_at_Nov_03_13-50-14](/uploads/c16aa8f3be064eb05fbd85b0417003bf/Screenshot_at_Nov_03_13-50-14.png){width=476 height=616}
> ![Screenshot_at_Nov_03_13-52-43](/uploads/21a88ed32641cfaf92f5829f3bf8aef0/Screenshot_at_Nov_03_13-52-43.png){width=912 height=676}
> ![Screenshot_at_Nov_03_13-54-19](/uploads/8753f69c3b52bc0624790e474e268534/Screenshot_at_Nov_03_13-54-19.png){width=1329 height=981}
> ![Screenshot_at_Nov_03_13-54-30](/uploads/396376dbe553d25660dc3c34d69dbe66/Screenshot_at_Nov_03_13-54-30.png){width=1329 height=946}
> ![Screenshot_at_Nov_03_13-55-38](/uploads/f7486ed1aa0b61d4ccea91b425eab74e/Screenshot_at_Nov_03_13-55-38.png){width=914 height=660}
> ![Screenshot_at_Nov_03_13-56-16](/uploads/c5f4817c58e6b49be027338a53cca122/Screenshot_at_Nov_03_13-56-16.png){width=772 height=390}
> ![Screenshot_at_Nov_03_13-57-24](/uploads/8e804789cf498ab5685f5cce2fe7c040/Screenshot_at_Nov_03_13-57-24.png){width=463 height=636}
> ![Screenshot_at_Nov_03_13-57-40](/uploads/f4359552ef94d726aaf6c58ad2d77d90/Screenshot_at_Nov_03_13-57-40.png){width=460 height=636}
> ![Screenshot_at_Nov_03_14-04-34](/uploads/97e4177bb3f9c34e2492132f7ae63da5/Screenshot_at_Nov_03_14-04-34.png){width=1322 height=989}
> ![Screenshot_at_Nov_03_14-04-45](/uploads/19a84ab12729f72ef405e91c1671c4ef/Screenshot_at_Nov_03_14-04-45.png){width=1332 height=985}
> ![Screenshot_at_Nov_03_14-05-53](/uploads/ebbff7d5262880bcad7c423e667fd8c1/Screenshot_at_Nov_03_14-05-53.png){width=765 height=313}

> **| PASS |**
> ```

---

> ```gherkin

> **When the user filters records by start and end dates on the fundingModificationHistory page, the table must correctly display the results, paginate while maintaining state without row selectors, and respect the user’s permissions.**

> 

> **| PASS |**
> ```

---

> ```gherkin

> **In the API, requests to fundingModifications must process correctly without relying on the selected rows parameter, returning all records according to the applied filters (startDate, endDate, leadStatus).**

> !

> **| PASS |**
> ```

---

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

> ## Tests in stg

> ```gherkin

> **When accessing the fundingModificationHistory page, the user should not see any row selectors (checkboxes), and the CSV export and email send functionalities must process all records according to the applied filters.**

> ![image](/uploads/adad61102bdf73dc94813a34f3a7e7ec/image.png){width=900 height=449}
![Screenshot_at_Nov_18_07-37-26](/uploads/8cf1c495a18de7d43eae786d904ea0e4/Screenshot_at_Nov_18_07-37-26.png){width=600 height=260}
![Screenshot_at_Nov_18_07-37-42](/uploads/6187f480c16cbbd03c67680043fc2650/Screenshot_at_Nov_18_07-37-42.png){width=534 height=600}
![Screenshot_at_Nov_18_07-39-00](/uploads/c3283a0c8eaca9d0721c55f998f897ce/Screenshot_at_Nov_18_07-39-00.png){width=637 height=106}
![Screenshot_at_Nov_18_07-39-17](/uploads/83093a8778ddb290565376ea5c2e3236/Screenshot_at_Nov_18_07-39-17.png){width=642 height=151}
![Screenshot_at_Nov_18_07-40-34](/uploads/17f859232bdbc1190a1dd5f840ed76d6/Screenshot_at_Nov_18_07-40-34.png){width=816 height=600}

> **| PASS |**
> ```

---

> ```gherkin

> **When the user filters records by start and end dates on the fundingModificationHistory page, the table must correctly display the results, paginate while maintaining state without row selectors, and respect the user’s permissions.**

> ![Screenshot_at_Nov_18_07-45-00](/uploads/a57e1c1715ad5b691ea2204726c13cd4/Screenshot_at_Nov_18_07-45-00.png){width=829 height=600}
![Screenshot_at_Nov_18_07-45-32](/uploads/a799d1ca33b5160f1135fd211b1c3dc6/Screenshot_at_Nov_18_07-45-32.png){width=390 height=268}
![Screenshot_at_Nov_18_07-46-25](/uploads/a8c2d5ec20daa61708a2be6a20353bf9/Screenshot_at_Nov_18_07-46-25.png){width=822 height=600}
![Screenshot_at_Nov_18_07-46-43](/uploads/efd8e08b24bc7498a0f10bee5ffdbf86/Screenshot_at_Nov_18_07-46-43.png){width=597 height=243}
![Screenshot_at_Nov_18_07-52-14](/uploads/c35e3c161df0e30b32eda22ff74839b5/Screenshot_at_Nov_18_07-52-14.png){width=499 height=96}
![Screenshot_at_Nov_18_07-53-01](/uploads/7c8c30da0115cddc04f584d195535691/Screenshot_at_Nov_18_07-53-01.png){width=900 height=250}
![Screenshot_at_Nov_18_07-53-44](/uploads/45d051279416ad6d587bca6af8863cf7/Screenshot_at_Nov_18_07-53-44.png){width=499 height=104}
![Screenshot_at_Nov_18_07-54-39](/uploads/96017cc0411d858c2f5a1721c64d7c26/Screenshot_at_Nov_18_07-54-39.png){width=900 height=382}
![Screenshot_at_Nov_18_07-55-38](/uploads/61cec8d21223189f0fa2a69443b85e97/Screenshot_at_Nov_18_07-55-38.png){width=381 height=50}
![Screenshot_at_Nov_18_07-56-03](/uploads/d76f7f091830eb8f1734c8a804f82c4a/Screenshot_at_Nov_18_07-56-03.png){width=900 height=377}
![Screenshot_at_Nov_18_07-56-04](/uploads/c7920750189d79a70043283ad79c0c6e/Screenshot_at_Nov_18_07-56-04.png){width=479 height=52}
![Screenshot_at_Nov_18_07-56-59](/uploads/d9c4756d3b0e68b1a00691a3cf351dbf/Screenshot_at_Nov_18_07-56-59.png){width=900 height=448}


> **| PASS |**
> ```

---

> ```gherkin

> **In the API, requests to fundingModifications must process correctly without relying on the selected rows parameter, returning all records according to the applied filters (startDate, endDate, leadStatus).**

> ![Screenshot_at_Nov_18_08-01-35](/uploads/6a1862261f747156fd218fe853577368/Screenshot_at_Nov_18_08-01-35.png){width=900 height=556}

> **| PASS |**
> ```

---


---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
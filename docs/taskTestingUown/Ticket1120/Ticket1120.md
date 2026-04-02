----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1120


UOWN | Origination | Improve Log Sorting Visibility and Alignment in Notes Table


Synopsis
Improve the visibility and usability of log sorting in the notes table.

Users should clearly see which columns can be sorted and intuitively understand how sorting is being applied, improving the clarity and usability of the logs table.
\\> All the tables in ORIGINATION AND SERVICING.

## Business Objective
Currently, the sorting icons (arrows) are misaligned, have low visibility, and behave inconsistently depending on the screen resolution. This causes confusion and gives the impression that sorting is incorrect.

Feature Request | Business Requirements
Ensure that all sorting icons (Date, Type, User, Notes) are visible and properly aligned with their respective columns.
Avoid having icons hidden until hover — they should always be visible.
Correct the layout so that it doesn’t look like only the “Notes” column can be sorted.
Keep the current sorting functionality, only improving the UI and user experience.

CURRENTLY:
![alt text](image.png)

MOCKUP:
![alt text](image-1.png)

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Origination | Melhorar a Visibilidade e Alinhamento da Ordenação de Logs na Tabela de Notas

Sinopse
Melhorar a visibilidade e usabilidade da ordenação de logs na tabela de notas.

Os usuários devem conseguir ver claramente quais colunas podem ser ordenadas e entender intuitivamente como a ordenação está sendo aplicada, melhorando a clareza e usabilidade da tabela de logs.

Todas as tabelas em ORIGINATION E SERVICING.

Objetivo de Negócio
Atualmente, os ícones de ordenação (setas) estão desalinhados, com baixa visibilidade e comportamento inconsistente dependendo da resolução da tela. Isso causa confusão e passa a impressão de que a ordenação está incorreta.

Requisitos de Funcionalidade | Requisitos de Negócio
Garantir que todos os ícones de ordenação (Data, Tipo, Usuário, Notas) sejam visíveis e devidamente alinhados com suas respectivas colunas.
Evitar que os ícones fiquem ocultos até o hover — eles devem ser sempre visíveis.
Corrigir o layout para que não pareça que apenas a coluna “Notas” pode ser ordenada.
Manter a funcionalidade de ordenação atual, apenas melhorando a interface e a experiência do usuário.

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Alterações dev:

 17 arquivos
+
646
−
892
Arquivos
17
Pesquisar (por exemplo, *.vue) (F)

ap
‎ps‎

.git
‎keep‎
+0 -0

libs/co
‎mmon-ui‎

s
‎rc‎

l
‎ib‎

data-
‎table‎

filter-
‎options‎

inde
‎x.tsx‎
+18 -10

filterTableC
‎omponent.tsx‎
+13 -7

inde
‎x.tsx‎
+9 -5

layouts/collapsabl
‎e-edit/activity-log‎

index.st
‎ories.tsx‎
+381 -718

inde
‎x.tsx‎
+135 -80

logN
‎otes‎

index.mo
‎dule.scss‎
+4 -2

inde
‎x.tsx‎
+75 -55

navbar/s
‎earch-bar‎

index.st
‎ories.tsx‎
+0 -1

mod
‎els‎

activi
‎ty-log‎

inde
‎x.ts‎
+5 -5

filter-ta
‎ble-column‎

 apps/.gitkeep excluído  100644 → 0
+
0
−
0

Visualizado
 libs/common-ui/src/lib/data-table/filter-options/index.tsx 
+
18
−
10

Visualizado
@@ -46,11 +46,23 @@ export const FilterOptions = (props: FilterOptionsProps) => {
                  md={maxCol ? '' : 4}
                  lg={hasMoreThanSixCols ? 4 : ''}
                  xl
                  className={classNames(
                    'w-100 p-0',
                    styles?.widthOverride,
                  )}
                  style={maxCol ? { minWidth, maxHeight: formik.errors[input.name] ? "4.5rem" : "3.5rem" } : { maxWidth, minWidth, maxHeight: formik.errors[input.name] ? "4.5rem" : "3.5rem" }}
                  className={classNames('w-100 p-0', styles?.widthOverride)}
                  style={
                    maxCol
                      ? {
                          minWidth,
                          maxHeight: formik.errors[input.name]
                            ? '4.5rem'
                            : '3.5rem',
                        }
                      : {
                          maxWidth,
                          minWidth,
                          maxHeight: formik.errors[input.name]
                            ? '4.5rem'
                            : '3.5rem',
                        }
                  }
                >
                  <InputField
                    isCalendarPositionFixed
@@ -96,11 +108,7 @@ export const FilterOptions = (props: FilterOptionsProps) => {
        )}
      >
        {filterProps?.options
          ?.filter(
            (option) =>
              typeof option?.hasPermission === 'undefined' ||
              option?.hasPermission
          )
          ?.filter((option) => !option?.hasPermission)
          ?.map((input, i) => {
            const { minWidth, maxWidth = '400px', ...inputProps } = input || {};
            return (
 libs/common-ui/src/lib/data-table/filterTableComponent.tsx 
+
13
−
7

Visualizado
@@ -3,7 +3,7 @@ import { Button } from '../buttons/main';
import styles from './index.module.scss';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import DataTable, { TableColumn, TableRow } from 'react-data-table-component';
import DataTable, { TableColumn } from 'react-data-table-component';
import { ConfigColumns } from './config-columns/index';
import { CSVDownload } from './csv-download/index';
import { FilterTableProps } from '.';
@@ -13,7 +13,7 @@ import { faFilter, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { ResizeableColumn } from 'src';
import { Tab, Tabs } from 'react-bootstrap';

export const FilterTableComponent = <T extends TableRow>(props: FilterTableProps<T>) => {
export const FilterTableComponent = <T,>(props: FilterTableProps<T>) => {
  const {
    children,
    columns,
@@ -51,7 +51,7 @@ export const FilterTableComponent = <T extends TableRow>(props: FilterTableProps
  // key prop and/or dataStructure prop is mandatory for sortable to work properly

  const [columnWidths, setColumnWidths] = useState<string[]>(
    columns.map((col: TableColumn<TableRow>) => col?.width || '50px')
    columns.map((col: TableColumn<T>) => col?.width || '50px')
  );
  const [resizingColumnIndex, setResizingColumnIndex] = useState<number | null>(
    null
@@ -103,6 +103,7 @@ export const FilterTableComponent = <T extends TableRow>(props: FilterTableProps
      }
    }
  };

  const handleMouseUp = (e: MouseEvent) => {
    e?.stopPropagation();
    setResizingColumnIndex(null);
@@ -110,7 +111,7 @@ export const FilterTableComponent = <T extends TableRow>(props: FilterTableProps
    document?.removeEventListener('mouseup', handleMouseUp);
  };

  const nameHeader = (props: ResizeableColumn) => {
  const nameHeader = (props: ResizeableColumn): React.ReactNode => {
    const { label, columnWidths, index, handleMouseDown, hasCell } = props;
    const inlineStyles = {
      width: hasCell ? '100%' : columnWidths?.[index],
@@ -139,7 +140,7 @@ export const FilterTableComponent = <T extends TableRow>(props: FilterTableProps
    );
  };

  const resizableColumns: TableColumn<TableRow>[] = columns.map(
  const resizableColumns: TableColumn<T>[] = columns.map(
    (column: any, index: number) => ({
      ...column,
      width: column?.cell ? column?.width : columnWidths?.[index],
@@ -292,7 +293,7 @@ export const FilterTableComponent = <T extends TableRow>(props: FilterTableProps
      )}

      {searchPanelOnLeft ? (
        <div className='d-flex flex-row' style={{gap: "1rem"}}>
        <div className="d-flex flex-row" style={{ gap: '1rem' }}>
          {formik && (
            <Collapse isOpen={toggleComponents}>
              <FilterOptions
@@ -304,7 +305,12 @@ export const FilterTableComponent = <T extends TableRow>(props: FilterTableProps
            </Collapse>
          )}
          <div
            style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: toggleComponents ? "75%" : "100%" }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              maxWidth: toggleComponents ? '75%' : '100%',
            }}
          >
            <DataTable
              columns={isResizeable ? resizableColumns : columns}

---


 9 arquivos
+
69
−
31
Arquivos
9
Pesquisar (por exemplo, *.vue) (F)

mod
‎els‎

activit
‎y-log.ts‎
+0 -6

merchan
‎t-log.ts‎
+4 -10

pa
‎ges‎

cust
‎omers‎

[leadP
‎k].tsx‎
+16 -1

merc
‎hant‎

[refMercha
‎ntCode].tsx‎
+16 -1

newAppl
‎ication‎

inde
‎x.tsx‎
+1 -2

prog
‎rams‎

inde
‎x.tsx‎
+11 -1

ut
‎ils‎

data-table-
‎columns.tsx‎
+3 -4

packag
‎e.json‎
+1 -1

yarn
‎.lock‎
+17 -5

 models/activity-log.ts 
+
0
−
6

Visualizado
@@ -49,12 +49,6 @@ export class ActivityLog {
  @persist
  rowUpdatedTimestamp: string;
  @observable
  @persist
  tenantId: number;
  @observable
  @persist
  webUserId: number;
  @observable
  @persist('object')
  activityLogInfo: ActivityLogInfo;
}
 models/merchant-log.ts 
+
4
−
10

Visualizado
import { ActivityLogInfo } from "@uownleasing/common-ui";
import { persist } from "@uownleasing/mobx-persist-session";
import { observable } from "mobx";
import {ActivityLogInfo} from '@uownleasing/common-ui';
import {persist} from '@uownleasing/mobx-persist-session';
import {observable} from 'mobx';

export class MerchantLog {
  @observable
@@ -16,12 +16,6 @@ export class MerchantLog {
  @persist
  rowUpdatedTimestamp: string;
  @observable
  @persist
  tenantId: number;
  @observable
  @persist
  webUserId: number;
  @observable
  @persist('object')
  activityLogInfo: ActivityLogInfo;
}
\ No newline at end of file
}
 pages/customers/[leadPk].tsx 
+
16
−
1

Visualizado
@@ -22,7 +22,12 @@ import {UtilityStore} from '@stores/utility';
import {OverviewStore} from '@stores/overview';
import SalesRepPanel from '../../components/customer-info-panels/sales-rep';
import {useRouter} from 'next/router';
import {ActivityLogRequest, BasicMerchantInfo, RecordBody} from '@models';
import {
  ActivityLog,
  ActivityLogRequest,
  BasicMerchantInfo,
  RecordBody,
} from '@models';
import {
  hasModifyPermission,
  hasRestrictedModifyPermission,
@@ -125,6 +130,15 @@ const Customers = ({
    [],
  );

  const setActivityLogs = useCallback(
    (content: ActivityLog[]) =>
      customerStore.setActivityLogs({
        ...customerStore.activityLogs,
        content,
      }),
    [customerStore],
  );

  const latestCCAccount = useMemo<CreditCardProps['ccInfo']>(() => {
    const creditCards = customerStore?.creditCardProps?.creditCards || [];
    const creditCardInfo = creditCards.slice(-1)[0]?.creditCardInfo;
@@ -707,6 +721,7 @@ const Customers = ({
              logTypes={customerStore.activityLogs.filtersOptions?.logTypes}
              onSubmitFilters={onSubmitFilters}
              progressPending={customerStore.isLoadingActivityLogs}
              setActivityLogs={setActivityLogs}
            />
          </Col>
        </Row>
 pages/merchant/[refMerchantCode].tsx 
+
16
−
1

Visualizado
@@ -18,7 +18,12 @@ import {
} from '@uownleasing/common-ui';
import {useFormik} from 'formik';
import config from '@config/project-config';
import {BasicMerchantInfo, MerchantInfo, MerchantProgram} from '@models';
import {
  BasicMerchantInfo,
  MerchantInfo,
  MerchantLog,
  MerchantProgram,
} from '@models';
import {ProgramStore} from '@stores/program';
import DeleteMerchantModal from '@components/merchant-info-panels/delete-merchant-modal';
import {useRouter} from 'next/router';
@@ -51,6 +56,15 @@ const MerchantDetailPage = ({
    useState<BasicMerchantInfo[]>();
  const [activityLogsIsLoading, setActivityLogsIsLoading] = useState(false);

  const setActivityLogs = useCallback(
    (content: MerchantLog[]) =>
      merchantStore.setMerchantLogs({
        ...merchantStore.merchantLogs,
        content,
      }),
    [merchantStore],
  );

  const onSubmitFilters = useCallback(
    async (filters: ActivityLogFilters) => {
      setActivityLogsIsLoading(true);
@@ -289,6 +303,7 @@ const MerchantDetailPage = ({
            onChangeRowsPerPage={onChangeRowsPerPage}
            logTypes={merchantStore.merchantLogs.filtersOptions?.logTypes || []}
            onSubmitFilters={onSubmitFilters}
            setActivityLogs={setActivityLogs}
          />
        </>
      )}

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Ícones de ordenação mais visíveis e alinhados em Customers, Merchant e Program
More Visible and Aligned Sorting Icons in Customers, Merchant, and Program

-----


> ## Tests in qa1


> ```gherkin

> **More Visible and Aligned Sorting Icons in Customers, Merchant, and Program**

> ![Screenshot_at_Nov_13_09-03-24](/uploads/ec7ffa9c5b018b51d4ea15c327a6e088/Screenshot_at_Nov_13_09-03-24.png){width=900 height=481}
> ![Screenshot_at_Nov_13_10-05-21](/uploads/0dcf1f2b7ab13e233f88259f604553f8/Screenshot_at_Nov_13_10-05-21.png){width=900 height=447}
> ![WhatsApp_Image_2025-11-13_at_08.50.08__2_](/uploads/a5f8abf72d24cececb50d94ed32804a1/WhatsApp_Image_2025-11-13_at_08.50.08__2_.jpeg){width=278 height=600}
> ![WhatsApp_Image_2025-11-13_at_08.50.09__1_](/uploads/2678d1e6861fb6a5c007ccb09d58f9ce/WhatsApp_Image_2025-11-13_at_08.50.09__1_.jpeg){width=278 height=600}
> ![WhatsApp_Image_2025-11-13_at_08.50.09__2_](/uploads/f63ff401242ecc72df6b9c6c39993154/WhatsApp_Image_2025-11-13_at_08.50.09__2_.jpeg){width=278 height=600}

> **| PASS |**
> ```

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

STG

> ## Tests in stg


> ```gherkin

> **More Visible and Aligned Sorting Icons in Customers, Merchant, and Program**

> ![Screenshot_at_Nov_16_12-13-11](/uploads/d22515cc2b4a1b17ce810efe4f9de5a9/Screenshot_at_Nov_16_12-13-11.png){width=900 height=447}
> ![Screenshot_at_Nov_16_12-13-50](/uploads/d845acfc08538bd33b1996b898d60291/Screenshot_at_Nov_16_12-13-50.png){width=900 height=568}
![Screenshot_at_Nov_16_12-14-20](/uploads/91a1477eba5ce94bd07fc8cb2ff2a5e6/Screenshot_at_Nov_16_12-14-20.png){width=900 height=447}
![Screenshot_at_Nov_16_12-14-44](/uploads/ef90404d5a11847ca3548430939b5fa5/Screenshot_at_Nov_16_12-14-44.png){width=900 height=421}
![Screenshot_at_Nov_16_12-15-04](/uploads/2428492cd89feb28613eab63b85bfb80/Screenshot_at_Nov_16_12-15-04.png){width=900 height=448}
![Screenshot_at_Nov_16_12-15-27](/uploads/215be9eb79def9b1ccdd6ca588606787/Screenshot_at_Nov_16_12-15-27.png){width=900 height=368}
![Screenshot_at_Nov_16_12-15-50](/uploads/ddbeae7b002b54efca1a014082ec049d/Screenshot_at_Nov_16_12-15-50.png){width=900 height=446}
![Screenshot_at_Nov_16_12-16-07](/uploads/84ac4229ec55a2f33a6a6129de1dbffc/Screenshot_at_Nov_16_12-16-07.png){width=900 height=448}
![Screenshot_at_Nov_16_12-19-33](/uploads/57ce19330f1cda77631468f872998954/Screenshot_at_Nov_16_12-19-33.png){width=900 height=448}
![Screenshot_at_Nov_16_12-20-57](/uploads/1ae530c9dcf26cb38692066fc3524595/Screenshot_at_Nov_16_12-20-57.png){width=900 height=447}
![Screenshot_at_Nov_16_12-21-13](/uploads/124be044130d901dd8b172a6c59cf976/Screenshot_at_Nov_16_12-21-13.png){width=900 height=308}
![Screenshot_at_Nov_16_12-21-25](/uploads/846de9d3773e490451fc25841fba6a55/Screenshot_at_Nov_16_12-21-25.png){width=900 height=305}
![Screenshot_at_Nov_16_12-21-38](/uploads/8384e954dc440e1c93c61a5dd0f5a9d5/Screenshot_at_Nov_16_12-21-38.png){width=900 height=314}
![Screenshot_at_Nov_16_12-22-55](/uploads/648a169e660a6b9dd4b703170442e1b3/Screenshot_at_Nov_16_12-22-55.png){width=900 height=566}
![Screenshot_at_Nov_16_12-23-37](/uploads/5ef155798087578e5124bacbbd5b282a/Screenshot_at_Nov_16_12-23-37.png){width=900 height=445}
![Screenshot_at_Nov_16_12-23-51](/uploads/26df626d0f2ea3bf78369fbff32ace7d/Screenshot_at_Nov_16_12-23-51.png){width=900 height=456}
![Screenshot_at_Nov_16_13-04-05](/uploads/cf5b6bb6aa795d5e0494f37fd8232001/Screenshot_at_Nov_16_13-04-05.png){width=900 height=446}
![Screenshot_at_Nov_16_13-04-24](/uploads/7684a42de4931c4022559b9677c3d82f/Screenshot_at_Nov_16_13-04-24.png){width=900 height=107}
![Screenshot_at_Nov_16_13-04-36](/uploads/74edfb7845345ed5c8e3ba6bb3b9bab7/Screenshot_at_Nov_16_13-04-36.png){width=900 height=102}
![Screenshot_at_Nov_16_13-04-48](/uploads/51b2aa3d458158ca5bc3a3b6d8a29a63/Screenshot_at_Nov_16_13-04-48.png){width=900 height=137}
![Screenshot_at_Nov_16_13-05-03](/uploads/4f52feb0f2e5efb6799293edf0e9eb10/Screenshot_at_Nov_16_13-05-03.png){width=900 height=138}

> **| PASS |**
> ```

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

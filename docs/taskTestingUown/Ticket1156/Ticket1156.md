--------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1156


## 🇺🇸 English

### **UOWN | Origination | Fix Line Break Formatting in CSV Download from Merchant Modification History**

#### **Synopsis**

It was identified that when downloading the CSV file from the **Merchant Modification History** page, the exported data contains line breaks within rows, causing records to be split across multiple lines.

This formatting issue makes the file difficult to read, process, and use in spreadsheet applications.

The goal of this task is to analyze, identify the root cause, and fix the CSV generation so that each record is exported on **a single line**, ensuring a clean, consistent, and properly structured file.

#### **Context and Notes**

* Reported issues included:

  * Inconsistent column wrapping
  * Random blank spaces
  * Inability to sort data correctly
* The inconsistent column wrapping issue was fixed in release **R1.46.0**
* Blank fields are still present and require further investigation
* The CSV data correctly reflects the database; blank values already exist at the data source
* Even when no blank fields are present, sorting by **Username**, **LogType**, and **Notes** does not behave as expected

#### **Implemented Changes**

* The **Merchant Modification History** page should no longer display rows with empty merchant information
* A **new page** was added, accessible from the sidebar via a new icon
* Access to the new page requires the following permissions:

  * `program modification history [access]`
  * `program modification history download csv`
  * `get program modification history`
* This new page was not built based on explicit business requirements;
  the displayed data and available filters were designed based on what seemed most appropriate for program history
* The icon for the merchant history page was updated to better represent its purpose

---

--------------------------------------------------------------------------------------------------------------------------------------------------------

## 🇧🇷 Português

### **UOWN | Origination | Correção da Formatação de Quebra de Linha no Download CSV do Histórico de Modificação de Merchant**

#### **Sinopse**

Foi identificado que, ao realizar o download do arquivo CSV na página **Merchant Modification History**, os dados exportados contêm quebras de linha dentro das linhas do arquivo, fazendo com que as informações sejam divididas em múltiplas linhas.

Esse problema de formatação dificulta a leitura, o processamento e o uso do arquivo em aplicações de planilhas.

O objetivo desta tarefa é analisar, identificar a causa raiz e corrigir a geração do CSV para garantir que cada registro seja exportado em **uma única linha**, assegurando um arquivo limpo, consistente e corretamente estruturado.

#### **Contexto e Observações**

* Problemas reportados incluíam:

  * Quebra inconsistente de colunas (column wrapping)
  * Espaços em branco aparentemente aleatórios
  * Dificuldade para ordenação (sorting)
* A quebra inconsistente de colunas foi corrigida na versão **R1.46.0**
* Os campos em branco continuam ocorrendo e requerem investigação adicional
* Os dados no CSV refletem corretamente o banco de dados; os campos vazios já estão vazios na origem
* Mesmo sem campos em branco, a ordenação por **Username**, **LogType** e **Notes** não funciona conforme esperado

#### **Modificações Implementadas**

* A página **Merchant Modification History** não deve mais exibir registros com informações de merchant vazias
* Foi adicionada uma **nova página**, acessível pelo menu lateral através de um novo ícone
* O acesso à nova página requer as seguintes permissões:

  * `program modification history [access]`
  * `program modification history download csv`
  * `get program modification history`
* Essa nova página não foi construída a partir de requisitos de negócio formais;
  os dados exibidos e os filtros disponíveis foram definidos com base no que pareceu mais adequado para o histórico de programas
* O ícone da página de histórico de merchant foi atualizado para um símbolo mais representativo de sua finalidade

---

--------------------------------------------------------------------------------------------------------------------------------------------------------

Alterações dev:


 10 arquivos
+
527
−
63
Arquivos
10
Pesquisar (por exemplo, *.vue) (F)

domain
‎/stores‎

merchant-modific
‎ation-history.tsx‎
+58 -2

layout
‎s/auth‎

inde
‎x.tsx‎
+20 -0

mod
‎els‎

inde
‎x.ts‎
+1 -0

merchant-mo
‎d-history.ts‎
+1 -15

program-mod
‎-history.ts‎
+17 -0

pa
‎ges‎

merchantModif
‎icationHistory‎

inde
‎x.tsx‎
+5 -5

programModifi
‎cationHistory‎

inde
‎x.tsx‎
+297 -0

ut
‎ils‎

merchant-modificat
‎ion-history-config‎

inde
‎x.tsx‎
+58 -16

data-table-
‎columns.tsx‎
+45 -1

serv
‎er.js‎
+25 -24

 domain/stores/merchant-modification-history.tsx 
+
58
−
2

Visualizado
@@ -3,6 +3,7 @@ import {persist} from '@uownleasing/mobx-persist-session';
import {
  MerchantModificationHistory,
  MerchantModificationHistoryBody,
  ProgramModificationHistory,
} from '@models';
import {makeObservable, action, observable} from 'mobx';
import {BaseStore} from './base';
@@ -13,10 +14,18 @@ export class MerchantModificationHistoryStore extends BaseStore {
  @persist('object')
  searchQuery: MerchantModificationHistoryBody = undefined;

  @observable
  @persist('object')
  searchProgramQuery: MerchantModificationHistoryBody = undefined;

  @observable
  @persist('list')
  modifiedMerchants: MerchantModificationHistory[] = [];

  @observable
  @persist('list')
  modifiedPrograms: ProgramModificationHistory[] = [];

  @observable
  logTypesOptions: Options[] = [];

@@ -31,7 +40,7 @@ export class MerchantModificationHistoryStore extends BaseStore {
    isCsvDownload?: boolean,
  ): Promise<
    ResponseTyped<{
      merchantActivityLog: MerchantModificationHistory[];
      items: MerchantModificationHistory[];
      moreResults: boolean;
      totalCount: number;
    }>
@@ -48,7 +57,7 @@ export class MerchantModificationHistoryStore extends BaseStore {
    if (!isCsvDownload) {
      this.setSearchQuery(body);
      if (response?.status === 200) {
        this.setModifiedMerchants(response?.data?.merchantActivityLog || []);
        this.setModifiedMerchants(response?.data?.items || []);
        this.setSearchQuery({
          ...body,
          totalRows: response?.data?.totalCount,
@@ -63,6 +72,37 @@ export class MerchantModificationHistoryStore extends BaseStore {
    };
  };

  @action
  getModifiedPrograms = async (
    body: MerchantModificationHistoryBody,
    isCsvDownload?: boolean,
  ) => {
    const utilityStore = this.rootStore.utilityStore;
    const response = await utilityStore.sendRequest({
      method: 'POST',
      url: '/uown/getProgramDataChangeResults',
      data: body,
      isHandleLoader: true,
    });

    if (!isCsvDownload) {
      this.setSearchProgramQuery(body);
      if (response?.status === 200) {
        this.setModifiedPrograms(response?.data?.items || []);
        this.setSearchProgramQuery({
          ...body,
          totalRows: response?.data?.totalCount,
        });
      }
    }

    return {
      status: response?.status || 500,
      message: response?.message || '',
      data: response?.data || {},
    };
  };

  @action
  getLogTypesOptions = async (): Promise<void> => {
    const utilityStore = this?.rootStore?.utilityStore;
@@ -93,14 +133,30 @@ export class MerchantModificationHistoryStore extends BaseStore {
    this.modifiedMerchants = modifieLeads;
  };

  @action
  setModifiedPrograms = (
    modifiedPrograms: MerchantModificationHistory[],
  ): void => {
    this.modifiedPrograms = modifiedPrograms;
  };

  @action
  setSearchQuery = (searchQuery: MerchantModificationHistoryBody): void => {
    this.searchQuery = searchQuery;
  };

  @action
  setSearchProgramQuery = (
    searchQuery: MerchantModificationHistoryBody,
  ): void => {
    this.searchProgramQuery = searchQuery;
  };

  @action
  reset = (): void => {
    this.searchQuery = undefined;
    this.searchProgramQuery = undefined;
    this.modifiedMerchants = [];
    this.modifiedPrograms = [];
  };
}


 1 arquivo
+
4
−
0
 src/main/java/com/uownleasing/ams/environment/Uown.java 
+
4
−
0

Visualizado
@@ -360,6 +360,10 @@ public class Uown extends EnvironmentService {
                {"get merchant modification history", "modify", "merchantModificationHistory/get_merchant_data_change_results", "", ""},
                {"merchant modification history download csv", "modify", "merchantModificationHistory/download_csv", "allows user to download csv file of merchant modification history", ""},

                {"program modification history [access]", "access", "programModificationHistory", "", ""},
                {"get program modification history", "modify", "programModificationHistory/get_program_data_change_results", "", ""},
                {"program modification history download csv", "modify", "programModificationHistory/download_csv", "allows user to download csv file of program modification history", ""},

                {"merchant programs [access]", "access", "programs", "", ""},
                {"merchant programs [modify]", "modify", "programs/create_or_update_program", "", ""},
                {"manage program groups [modify]", "modify", "programs/manage_program_groups", "", ""},


 10 arquivos
+
170
−
55
Arquivos
10
Pesquisar (por exemplo, *.vue) (F)

src/main/java/co
‎m/uownleasing/svc‎

db/rep
‎ository‎

MerchantLo
‎gRepo.java‎
+37 -12

po
‎jo‎

re
‎st‎

MerchantLog
‎Result.java‎
+1 -1

ProgramLog
‎Result.java‎
+13 -0

ProgramLogRe
‎sultItem.java‎
+22 -0

MerchantLog
‎Request.java‎
+0 -1

ProgramLogR
‎equest.java‎
+17 -0

re
‎st‎

AdminContr
‎oller.java‎
+9 -2

ser
‎vice‎

MerchantLog
‎Service.java‎
+26 -12

MerchantSe
‎rvice.java‎
+0 -27

ProgramLogS
‎ervice.java‎
+45 -0

 src/main/java/com/uownleasing/svc/db/repository/MerchantLogRepo.java 
+
37
−
12

Visualizado
@@ -3,7 +3,6 @@ package com.uownleasing.svc.db.repository;
import com.uownleasing.common.enumeration.LogType;
import com.uownleasing.svc.common.db.repository.SvCommonRepo;
import com.uownleasing.svc.db.entity.MerchantActivityLog;
import org.hibernate.jpa.TypedParameterValue;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
@@ -11,6 +10,7 @@ import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.Collection;
import java.util.Map;

public interface MerchantLogRepo extends JpaRepository<MerchantActivityLog, Long>, SvCommonRepo<MerchantActivityLog, Long> {

@@ -46,16 +46,41 @@ public interface MerchantLogRepo extends JpaRepository<MerchantActivityLog, Long
    )
    Collection<LogType> getLogTypesForProgramPk(long programPK);

    @Query(value = "SELECT activitylog.* FROM uown_merchant_activity_log activitylog\n" +
        "LEFT JOIN uown_merchant_program program on program.pk = activitylog.program_pk\n" +
        "WHERE activitylog.row_created_timestamp BETWEEN CAST(:startDate as DATE) AND (CAST(:endDate as DATE) +  INTERVAL '1 day')\n" +
        "  AND (CAST(:merchantName as VARCHAR) IS NULL OR (CAST(:merchantName as VARCHAR) IS NOT NULL AND activitylog.merchant_name = CAST(:merchantName as VARCHAR)) )\n" +
        "  AND (CAST(:merchantLocation as VARCHAR) IS NULL OR (CAST(:merchantLocation as VARCHAR) IS NOT NULL AND activitylog.location_name = CAST(:merchantLocation as VARCHAR)))\n" +
        "  AND (CAST(:logType as VARCHAR) IS NULL OR CAST(:logType as VARCHAR) = '' OR activitylog.log_type = CAST(:logType as VARCHAR))\n" +
        "  AND (CAST(:merchantRefCode as VARCHAR) IS NULL OR (CAST(:merchantRefCode as VARCHAR) IS NOT NULL AND activitylog.merchant_ref_code = CAST(:merchantRefCode as VARCHAR)))\n" +
        "  AND (CAST(:userName as VARCHAR) IS NULL OR activitylog.created_by ILIKE CONCAT('%', CAST(:userName as VARCHAR), '%'))\n" +
        "  AND (CAST(:programName as VARCHAR) IS NULL OR (CAST(:programName as VARCHAR) IS NOT NULL AND program.program_name = CAST(:programName as VARCHAR)))\n" +
        " ORDER BY activitylog.row_created_timestamp desc"
    @Query(value = """
        SELECT activitylog.* FROM uown_merchant_activity_log activitylog
        WHERE activitylog.row_created_timestamp BETWEEN CAST(:startDate AS DATE) AND (CAST(:endDate AS DATE) +  INTERVAL '1 day')
          AND (CAST(:merchantName AS VARCHAR) IS NULL OR (CAST(:merchantName AS VARCHAR) IS NOT NULL AND activitylog.merchant_name = CAST(:merchantName AS VARCHAR)) )
          AND (CAST(:merchantLocation AS VARCHAR) IS NULL OR (CAST(:merchantLocation AS VARCHAR) IS NOT NULL AND activitylog.location_name = CAST(:merchantLocation AS VARCHAR)))
          AND (CAST(:logType AS VARCHAR) IS NULL OR CAST(:logType AS VARCHAR) = '' OR activitylog.log_type = CAST(:logType AS VARCHAR))
          AND (CAST(:merchantRefCode AS VARCHAR) IS NULL OR (CAST(:merchantRefCode AS VARCHAR) IS NOT NULL AND activitylog.merchant_ref_code = CAST(:merchantRefCode AS VARCHAR)))
          AND (CAST(:userName AS VARCHAR) IS NULL OR activitylog.created_by ILIKE CONCAT('%', CAST(:userName AS VARCHAR), '%'))
          AND activitylog.merchant_pk IS NOT NULL
          AND activitylog.log_type <> 'PROGRAM_DATA_CHANGE'
         ORDER BY activitylog.row_created_timestamp DESC"""
        , nativeQuery = true)
    Page<MerchantActivityLog> findAllByMerchantAndLocation(LocalDate startDate, LocalDate endDate, String merchantName, String merchantLocation, String logType, String merchantRefCode, String userName, String programName, Pageable pageable);
    Page<MerchantActivityLog> getAllMerchantLogs(LocalDate startDate, LocalDate endDate, String merchantName, String merchantLocation, String logType, String merchantRefCode, String userName, Pageable pageable);

    @Query(value = """
        SELECT
              program.pk "programPk",
              program.program_name "programName",
              program.states "states",
              activityLog.pk "activityPk",
              activitylog.row_created_timestamp "rowCreatedTimestamp",
              activitylog.notes "notes",
              activitylog.created_by "createdBy"
        FROM uown_merchant_activity_log activitylog
        RIGHT OUTER JOIN uown_merchant_program program ON
        program.pk = activitylog.program_pk
        WHERE activitylog.merchant_pk IS NULL
        AND activitylog.row_created_timestamp BETWEEN CAST(:startDate AS DATE) AND (CAST(:endDate AS DATE) + INTERVAL '1 day')
        AND (CAST(:userName AS VARCHAR) IS NULL
          OR activitylog.created_by ILIKE CONCAT('%', CAST(:userName AS VARCHAR), '%'))
        AND (CAST(:programName AS VARCHAR) IS NULL
          OR (CAST(:programName AS VARCHAR) IS NOT NULL
            AND program.program_name = CAST(:programName AS VARCHAR)))
        ORDER BY activitylog.row_created_timestamp DESC
        """,
        nativeQuery = true)
    Page<Map<String, Object>> getAllProgramLogs(LocalDate startDate, LocalDate endDate, String userName, String programName, Pageable pageable);
}
 src/main/java/com/uownleasing/svc/pojo/rest/MerchantLogResult.java 
+
1
−
1

Visualizado
@@ -12,7 +12,7 @@ import java.util.List;
@ToString
public class MerchantLogResult {

    private List<MerchantActivityLog> merchantActivityLog;
    private List<MerchantActivityLog> items;
    private Long totalCount;
    private Boolean moreResults;
}
 src/main/java/com/uownleasing/svc/pojo/rest/ProgramLogResult.java  0 → 100644
+
13
−
0

Visualizado
package com.uownleasing.svc.pojo.rest;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class ProgramLogResult {
    private List<ProgramLogResultItem> items;
    private Long totalCount;
    private Boolean moreResults;
}


 2 arquivos
+
35
−
10
Arquivos
2
Pesquisar (por exemplo, *.vue) (F)

domain
‎/stores‎

merchant-modific
‎ation-history.tsx‎
+8 -2

pages/merchantMo
‎dificationHistory‎

inde
‎x.tsx‎
+27 -8

 domain/stores/merchant-modification-history.tsx 
+
8
−
2

Visualizado
import {Options, ResponseType} from '@uownleasing/common-ui';
import {Options, ResponseTyped} from '@uownleasing/common-ui';
import {persist} from '@uownleasing/mobx-persist-session';
import {
  MerchantModificationHistory,
@@ -29,7 +29,13 @@ export class MerchantModificationHistoryStore extends BaseStore {
  getModifiedMerchants = async (
    body: MerchantModificationHistoryBody,
    isCsvDownload?: boolean,
  ): Promise<ResponseType> => {
  ): Promise<
    ResponseTyped<{
      merchantActivityLog: MerchantModificationHistory[];
      moreResults: boolean;
      totalCount: number;
    }>
  > => {
    const utilityStore = this?.rootStore?.utilityStore;

    const response = await utilityStore?.sendRequest({
 pages/merchantModificationHistory/index.tsx 
+
27
−
8

Visualizado
@@ -3,7 +3,12 @@ import AuthWrapper from '@layouts/auth';
import {inject, observer} from 'mobx-react';
import {FilterTable, Options} from '@uownleasing/common-ui';
import {UtilityStore} from '@stores/utility';
import {getDate, formatDate, hasModifyPermission, showToast} from '@uownleasing/common-utilities';
import {
  getDate,
  formatDate,
  hasModifyPermission,
  showToast,
} from '@uownleasing/common-utilities';
import {
  dataTableCustomStyles,
  paginationRowsPerPageOptions,
@@ -50,14 +55,28 @@ const MerchantModificationHistory = (
    modProps: MerchantModificationHistoryBody,
    isCsvDownload?: boolean,
  ) => {
    const response = await getModifiedMerchants(modProps, isCsvDownload);
    const {status, data, message} = response;
    if (!isCsvDownload) {
    const {status, data, message} = await getModifiedMerchants(
      modProps,
      isCsvDownload,
    );
    if (isCsvDownload) {
      setCsvData(
        Array.isArray(data.merchantActivityLog)
          ? data.merchantActivityLog.map((modificationHistory) => ({
              ...modificationHistory,
              activityLogInfo: {
                ...modificationHistory.activityLogInfo,
                notes: modificationHistory.activityLogInfo.notes.replaceAll(
                  '\n',
                  String.raw`\n`,
                ),
              },
            }))
          : [],
      );
    } else {
      const {totalCount} = data;

      formik?.setFieldValue('totalRows', totalCount);
    } else {
      setCsvData(data?.merchantActivityLog);
    }

    if (status !== 200) {
@@ -176,7 +195,7 @@ const MerchantModificationHistory = (
  };

  const handleCsvData = async () => {
    const {from, to} = formik?.values;
    const {from, to} = formik?.values ?? {};
    const body = {
      ...formik?.values,
      pageNumber: 0,

--------------------------------------------------------------------------------------------------------------------------------------------------------


## Tests in qa1

---

1. Access to the **Merchant Modification History** page must be available only to users with the `merchant modification history [access]` permission.

![Screenshot_at_Jan_12_09-09-02](/uploads/607cc05317e151fcab21d8c1736c86c6/Screenshot_at_Jan_12_09-09-02.png){width=820 height=63}

![Screenshot_at_Jan_12_09-10-18](/uploads/03f9f55960eec4f51a1d21f4fa4e98c2/Screenshot_at_Jan_12_09-10-18.png){width=55 height=600}

![image](/uploads/26a27736854601c01e377a059a7f0766/image.png){width=825 height=112}

![image](/uploads/66266692c57af391d6c2b8a680c5dd2c/image.png){width=63 height=600}

**| PASS |**

---

2. The CSV download button/action on the **Merchant Modification History** page must be available only to users with the `merchant modification history download csv` permission.

![Screenshot_at_Jan_12_10-22-35](/uploads/3dfd7791b53c569c7ea611e36b7fa33f/Screenshot_at_Jan_12_10-22-35.png){width=820 height=57}

![Screenshot_at_Jan_12_10-22-52](/uploads/2c5e2a7604cff2015bbb2086eb87371a/Screenshot_at_Jan_12_10-22-52.png){width=900 height=476}

![Screenshot_at_Jan_12_10-24-07](/uploads/ac9f014a27a7577aaff082b3f65391ef/Screenshot_at_Jan_12_10-24-07.png){width=826 height=113}

![Screenshot_at_Jan_12_10-24-23](/uploads/0ba13799ff1c6f82f0d1db25dacb72e5/Screenshot_at_Jan_12_10-24-23.png){width=900 height=482}

**| PASS |**

---

3. Logs associated with a valid merchant (`merchant_pk` not null) must be displayed **only** on the **Merchant Modification History** page.

![Screenshot_at_Jan_12_09-41-18](/uploads/aeddfa8f2ec6fe12b906e9d376308c8c/Screenshot_at_Jan_12_09-41-18.png){width=900 height=68}

![Screenshot_at_Jan_12_09-41-57](/uploads/4aa8279f08cedfbf858dbd9d87a714d5/Screenshot_at_Jan_12_09-41-57.png){width=900 height=297}

![Screenshot_at_Jan_12_09-42-22](/uploads/af6750655bb528f8ae59c2f125ba704f/Screenshot_at_Jan_12_09-42-22.png){width=900 height=71}

![Screenshot_at_Jan_12_09-42-44](/uploads/9929be228ec952a3bb08ad05c32da938/Screenshot_at_Jan_12_09-42-44.png){width=900 height=248}

![Screenshot_at_Jan_12_09-43-01](/uploads/9f26eab12ee9d0d8313038b0b53f1618/Screenshot_at_Jan_12_09-43-01.png){width=900 height=56}

![Screenshot_at_Jan_12_09-43-10](/uploads/80225752b658b920d79773ce44a3055d/Screenshot_at_Jan_12_09-43-10.png){width=900 height=226}

**| PASS |**

---

4. Logs of type **PROGRAM_DATA_CHANGE** must not be displayed on the **Merchant Modification History** page.

![Screenshot_at_Jan_12_09-47-52](/uploads/01ca19dab981ada3604019af3ba16caa/Screenshot_at_Jan_12_09-47-52.png){width=900 height=489}

![Screenshot_at_Jan_12_09-48-04](/uploads/6add287ed16f10d9e442d09e8c2796ba/Screenshot_at_Jan_12_09-48-04.png){width=900 height=232}

![Screenshot_at_Jan_12_09-49-07](/uploads/86a43a5da93cc1e8f933cda92951d76b/Screenshot_at_Jan_12_09-49-07.png){width=900 height=489}

![Screenshot_at_Jan_12_09-49-13](/uploads/765483593b6f204eb4926706457ac1df/Screenshot_at_Jan_12_09-49-13.png){width=900 height=278}

**| PASS |**

---

5. The CSV must not contain records associated with logs that have no merchant (`merchant_pk = NULL`).

**| PASS |**

---

6. The CSV must contain **one record per line**, with no internal line breaks.

![Screenshot_at_Jan_12_10-15-17](/uploads/a88fa70d922a632bcd072d8ebd0d137e/Screenshot_at_Jan_12_10-15-17.png){width=900 height=87}

![Screenshot_at_Jan_12_10-17-25](/uploads/8dfba522f4ed840e298185c3912249b1/Screenshot_at_Jan_12_10-17-25.png){width=900 height=180}

**| PASS |**

---

7. Line breaks in the **Notes** field content must be escaped as `\n` and must not generate additional lines in the CSV.

**| PASS |**

---

8. The CSV must not contain empty rows.

**| PASS |**

---

9. The interface must display only records that are valid for the page context, ensuring consistency with the exported CSV.

**| PASS |**

---

--------------------------------------------------------------------------------------------------------------------------------------------------------

qa1


## Tests in qa1

---

1. Access to the **Merchant Modification History** page must be available only to users with the `merchant modification history [access]` permission.

![Screenshot_at_Jan_12_09-09-02](/uploads/607cc05317e151fcab21d8c1736c86c6/Screenshot_at_Jan_12_09-09-02.png){width=820 height=63}

![Screenshot_at_Jan_12_09-10-18](/uploads/03f9f55960eec4f51a1d21f4fa4e98c2/Screenshot_at_Jan_12_09-10-18.png){width=55 height=600}

![image](/uploads/26a27736854601c01e377a059a7f0766/image.png){width=825 height=112}

![image](/uploads/66266692c57af391d6c2b8a680c5dd2c/image.png){width=63 height=600}

**| PASS |**

---

2. The CSV download button/action on the **Merchant Modification History** page must be available only to users with the `merchant modification history download csv` permission.

![Screenshot_at_Jan_12_10-22-35](/uploads/3dfd7791b53c569c7ea611e36b7fa33f/Screenshot_at_Jan_12_10-22-35.png){width=820 height=57}

![Screenshot_at_Jan_12_10-22-52](/uploads/2c5e2a7604cff2015bbb2086eb87371a/Screenshot_at_Jan_12_10-22-52.png){width=900 height=476}

![Screenshot_at_Jan_12_10-24-07](/uploads/ac9f014a27a7577aaff082b3f65391ef/Screenshot_at_Jan_12_10-24-07.png){width=826 height=113}

![Screenshot_at_Jan_12_10-24-23](/uploads/0ba13799ff1c6f82f0d1db25dacb72e5/Screenshot_at_Jan_12_10-24-23.png){width=900 height=482}

**| PASS |**

---

3. Logs associated with a valid merchant (`merchant_pk` not null) must be displayed **only** on the **Merchant Modification History** page.

![Screenshot_at_Jan_12_09-41-18](/uploads/aeddfa8f2ec6fe12b906e9d376308c8c/Screenshot_at_Jan_12_09-41-18.png){width=900 height=68}

![Screenshot_at_Jan_12_09-41-57](/uploads/4aa8279f08cedfbf858dbd9d87a714d5/Screenshot_at_Jan_12_09-41-57.png){width=900 height=297}

![Screenshot_at_Jan_12_09-42-22](/uploads/af6750655bb528f8ae59c2f125ba704f/Screenshot_at_Jan_12_09-42-22.png){width=900 height=71}

![Screenshot_at_Jan_12_09-42-44](/uploads/9929be228ec952a3bb08ad05c32da938/Screenshot_at_Jan_12_09-42-44.png){width=900 height=248}

![Screenshot_at_Jan_12_09-43-01](/uploads/9f26eab12ee9d0d8313038b0b53f1618/Screenshot_at_Jan_12_09-43-01.png){width=900 height=56}

![Screenshot_at_Jan_12_09-43-10](/uploads/80225752b658b920d79773ce44a3055d/Screenshot_at_Jan_12_09-43-10.png){width=900 height=226}

**| PASS |**

---

4. Logs of type **PROGRAM_DATA_CHANGE** must not be displayed on the **Merchant Modification History** page.

![Screenshot_at_Jan_12_09-47-52](/uploads/01ca19dab981ada3604019af3ba16caa/Screenshot_at_Jan_12_09-47-52.png){width=900 height=489}

![Screenshot_at_Jan_12_09-48-04](/uploads/6add287ed16f10d9e442d09e8c2796ba/Screenshot_at_Jan_12_09-48-04.png){width=900 height=232}

![Screenshot_at_Jan_12_09-49-07](/uploads/86a43a5da93cc1e8f933cda92951d76b/Screenshot_at_Jan_12_09-49-07.png){width=900 height=489}

![Screenshot_at_Jan_12_09-49-13](/uploads/765483593b6f204eb4926706457ac1df/Screenshot_at_Jan_12_09-49-13.png){width=900 height=278}

**| PASS |**

---

5. The CSV must not contain records associated with logs that have no merchant (`merchant_pk = NULL`).

**| PASS |**

---

6. The CSV must contain **one record per line**, with no internal line breaks.

![Screenshot_at_Jan_12_10-15-17](/uploads/a88fa70d922a632bcd072d8ebd0d137e/Screenshot_at_Jan_12_10-15-17.png){width=900 height=87}

![Screenshot_at_Jan_12_10-17-25](/uploads/8dfba522f4ed840e298185c3912249b1/Screenshot_at_Jan_12_10-17-25.png){width=900 height=180}

**| PASS |**

---

7. Line breaks in the **Notes** field content must be escaped as `\n` and must not generate additional lines in the CSV.

**| PASS |**

---

8. The CSV must not contain empty rows.

**| PASS |**

---

9. The interface must display only records that are valid for the page context, ensuring consistency with the exported CSV.

**| PASS |**

---

--------------------------------------------------------------------------------------------------------------------------------------------------------

## Tests in stg

---

1. Access to the **Merchant Modification History** page must be available only to users with the `merchant modification history [access]` permission.



**| PASS |**

---

2. The CSV download button/action on the **Merchant Modification History** page must be available only to users with the `merchant modification history download csv` permission.



**| PASS |**

---

3. Logs associated with a valid merchant (`merchant_pk` not null) must be displayed **only** on the **Merchant Modification History** page.



**| PASS |**

---

4. Logs of type **PROGRAM_DATA_CHANGE** must not be displayed on the **Merchant Modification History** page.



**| PASS |**

---

5. The CSV must not contain records associated with logs that have no merchant (`merchant_pk = NULL`).

**| PASS |**

---

6. The CSV must contain **one record per line**, with no internal line breaks.



**| PASS |**

---

7. Line breaks in the **Notes** field content must be escaped as `\n` and must not generate additional lines in the CSV.

**| PASS |**

---

8. The CSV must not contain empty rows.

**| PASS |**

---

9. The interface must display only records that are valid for the page context, ensuring consistency with the exported CSV.

**| PASS |**

---


--------------------------------------------------------------------------------------------------------------------------------------------------------



## Tests in stg

---

1. Access to the **Merchant Modification History** page must be available only to users with the `merchant modification history [access]` permission.



**| PASS |**

---

2. The CSV download button/action on the **Merchant Modification History** page must be available only to users with the `merchant modification history download csv` permission.



**| PASS |**

---

3. Logs associated with a valid merchant (`merchant_pk` not null) must be displayed **only** on the **Merchant Modification History** page.



**| PASS |**

---

4. Logs of type **PROGRAM_DATA_CHANGE** must not be displayed on the **Merchant Modification History** page.



**| PASS |**

---

5. The CSV must not contain records associated with logs that have no merchant (`merchant_pk = NULL`).

**| PASS |**

---

6. The CSV must contain **one record per line**, with no internal line breaks.



**| PASS |**

---

7. Line breaks in the **Notes** field content must be escaped as `\n` and must not generate additional lines in the CSV.

**| PASS |**

---

8. The CSV must not contain empty rows.

**| PASS |**

---

9. The interface must display only records that are valid for the page context, ensuring consistency with the exported CSV.

**| PASS |**

---
------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1072

UOWN | Origination | Add "Merchant Support" Field to Merchant Settings Page for Bulk Updates

Synopsis
Currently, in the Origination Portal, the Merchant Support field is available only on the individual Merchant detail page, 
where a support representative can be assigned to that specific merchant. To enable bulk updates and streamline support assignments, 
this field should also be made available in the Merchant Settings page.


Business Objective
Allow administrators or support teams to efficiently manage support assignments by enabling batch updates of the Merchant Support field across multiple merchants at once. This reduces the need for manual, merchant-by-merchant changes and improves scalability and data consistency.

Feature Request | Business Requirements
Add the Merchant Support field to the Merchant Settings page in the Origination Portal.
The field should match the same format, behavior, and validation rules as the existing one on the individual Merchant page.
Allow the selection or input of a support representative for one or more merchants via the Merchant Settings interface.
Ensure changes to the Merchant Support field in this section are properly saved and reflected in each merchant’s profile.
Validate UI placement and interaction based on the provided print and mockup.
Ensure permissions and access to edit this field are consistent with existing role-based access controls.


Davi Artur @davi.artur.gow
@jose.mendes
On the merchant settings page, we've the new field: "merchant support"
We need to guarantee that the form still working and the new field is updating the selected merchants correctly

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Alterações Dev:

Comparar
e
 7 arquivos
+
392
−
235
Arquivos
7
Search (e.g. *.vue) (F)

compo
‎nents‎

customer-i
‎nfo-panels‎

index.mo
‎dule.scss‎
+6 -0

sales-
‎rep.tsx‎
+13 -6

merchant-i
‎nfo-panels‎

add-or-edit-
‎merchant.tsx‎
+35 -5

merchant-se
‎tting-panels‎

merchant-s
‎ettings.tsx‎
+12 -0

pages/m
‎erchant‎

[refMercha
‎ntCode].tsx‎
+284 -0

inde
‎x.tsx‎
+38 -223

ut
‎ils‎

data-table-
‎columns.tsx‎
+4 -1

 pages/merchant/[refMerchantCode].tsx  0 → 100644
+
284
−
0

Visualizado
import React, {useCallback, useEffect, useState} from 'react';
import {inject, observer} from 'mobx-react';
import {OverviewStore} from '@stores/overview';
import {UtilityStore} from '@stores/utility';
import {paginationRowsPerPageOptions} from '@utils/helper';
import {
  hasModifyPermission,
  hasRestrictedModifyPermission,
  showToast,
} from '@uownleasing/common-utilities';
import AddOrEditMerchant from '../../components/merchant-info-panels/add-or-edit-merchant';
import AuthWrapper from '@layouts/auth';
import {MerchantStore} from '@stores/merchant';
import {
  ActivityLogFilters,
  ActivityLogPanel,
  Options,
} from '@uownleasing/common-ui';
import {useFormik} from 'formik';
import config from '@config/project-config';
import {BasicMerchantInfo, MerchantInfo, MerchantProgram} from '@models';
import {ProgramStore} from '@stores/program';
import DeleteMerchantModal from '@components/merchant-info-panels/delete-merchant-modal';
import {useRouter} from 'next/router';

interface MerchantProps {
  merchantStore: MerchantStore;
  overviewStore: OverviewStore;
  programStore: ProgramStore;
  utilityStore: UtilityStore;
}

const MerchantDetailPage = (props: MerchantProps) => {
  const router = useRouter();
  const {refMerchantCode} = router.query;
  const {merchantStore, overviewStore, utilityStore} = props;
  const [merchantBeingEdited, setMerchantBeingEdited] =
    useState<MerchantInfo | null>(null);
  const [isLoadingMerchantData, setIsLoadingMerchantData] = useState(true);
  const [displayAddOrEditMerchantScreen, setDisplayAddOrEditMerchantScreen] =
    useState(false);
  const [allPrograms] = useState<MerchantProgram[]>([]);
  const [allProgramOptions, setAllProgramOptions] = useState<Options[]>([]);
  const [openDeleteMerchantModal, setOpenDeleteMerchantModal] = useState(false);

  const [basicMerchantsInfo, setBasicCloneMerchantsInfo] =
    useState<BasicMerchantInfo[]>();
  const [activityLogsIsLoading, setActivityLogsIsLoading] = useState(false);
  useEffect(() => {
    const getBasicMerchantInfoByRefCode = async () => {
      const merchantCode =
        overviewStore?.rootStore?.accountStore?.merchantReferenceCode || '';
      const basicInfoResponse =
        await overviewStore?.getBasicMerchantInfoByRefCode(merchantCode);

      if (basicInfoResponse.status < 400) {
        setBasicCloneMerchantsInfo(
          basicInfoResponse.data as BasicMerchantInfo[],
        );
      }
    };
    getBasicMerchantInfoByRefCode();
  }, [overviewStore]);
  const onSubmitFilters = useCallback(
    async (filters: ActivityLogFilters) => {
      setActivityLogsIsLoading(true);
      await merchantStore.getLogsForMerchant(merchantBeingEdited?.merchantPK, {
        page: 0,
        size: merchantStore.merchantLogs.size,
        logTypes: filters.logTypes,
        notes: filters.notes,
        createdBy: filters.userId,
      });
      setActivityLogsIsLoading(false);
    },
    [merchantBeingEdited?.merchantPK, merchantStore],
  );

  const onChangePage = useCallback(
    async (page: number, _totalRows: number, filters: ActivityLogFilters) => {
      setActivityLogsIsLoading(true);
      await merchantStore.getLogsForMerchant(merchantBeingEdited?.merchantPK, {
        page: page - 1,
        size: merchantStore.merchantLogs.size,
        logTypes: filters.logTypes,
        notes: filters.notes,
        createdBy: filters.userId,
      });
      setActivityLogsIsLoading(false);
    },
    [merchantBeingEdited?.merchantPK, merchantStore],
  );

  const onChangeRowsPerPage = useCallback(
    async (
      currentRowsPerPage: number,
      _currentPage: number,
      filters: ActivityLogFilters,
    ) => {
      setActivityLogsIsLoading(true);
      await merchantStore.getLogsForMerchant(merchantBeingEdited?.merchantPK, {
        page: 0,
        size: currentRowsPerPage,
        logTypes: filters.logTypes,
        notes: filters.notes,
        createdBy: filters.userId,
      });
      setActivityLogsIsLoading(false);
    },
    [merchantBeingEdited?.merchantPK, merchantStore],
  );

  const permissions = utilityStore?.rootStore?.accountStore?.permissions;

  const deleteMerchantFormik = useFormik({
    initialValues: {
      isItemChecked: false,
      selectedRow: undefined,
    },
    onSubmit: async (values) => {
      const {selectedRow} = values;
      const hasMerchantInfo: boolean =
        typeof selectedRow !== undefined &&
        typeof selectedRow?.merchantInfo !== undefined;
      if (hasMerchantInfo) {
        const payload: MerchantInfo = selectedRow?.merchantInfo;
        payload.isDeleted = true;
        const response = await merchantStore?.createOrUpdateMerchant(
          payload,
          true,
        );
        const {status, message} = response;

        if (status === 200) {
          showToast('success', 'Merchant deleted successfully');
          setOpenDeleteMerchantModal(false);
        } else {
          showToast(
            'error',
            message || 'An error has occured. Please try again.',
          );
        }
      }
    },
  });

  useEffect(() => {
    const getBasicMerchantInfoByRefCode = async () => {
      setIsLoadingMerchantData(true);
      const basicInfoResponse = await overviewStore?.getMerchantsByRefCode(
        refMerchantCode as string,
      );
      setIsLoadingMerchantData(false);

      if (basicInfoResponse.status < 400 && basicInfoResponse.data[0]) {
        setMerchantBeingEdited(basicInfoResponse.data[0].merchantInfo);

        return;
      }
    };
    getBasicMerchantInfoByRefCode();
  }, [overviewStore, refMerchantCode, router]);

  const hasCreateOrUpdateMerchantPermission = hasModifyPermission(
    permissions,
    'merchant',
    'create_or_update_merchant',
  );
  const hasCreateOrUpdateMerchantLogPermission = hasModifyPermission(
    permissions,
    'merchant',
    'create_or_update_merchant_log',
  );

  const hasInternalNotesModifyPermission = hasRestrictedModifyPermission(
    permissions,
    'merchant_internal_notes',
  );

  const hasCreateOrUpdateMerchantLogPermissionOnly =
    !hasCreateOrUpdateMerchantPermission &&
    hasCreateOrUpdateMerchantLogPermission;

  const title = `MERCHANTS > ${
    refMerchantCode === 'new' ? 'ADD A NEW' : 'EDIT'
  } COMPANY`;

  useEffect(() => {
    const programOptions: Options[] = (allPrograms || []).map((prog) => {
      return {
        label: prog?.programInfo?.programName || '',
        value: prog?.programInfo?.programName || '',
        key: String(prog?.programInfo?.programPk) || null,
      };
    });
    setAllProgramOptions(programOptions);
  }, [allPrograms]);

  useEffect(() => {
    if (displayAddOrEditMerchantScreen && merchantBeingEdited?.merchantPK) {
      setActivityLogsIsLoading(true);
      merchantStore
        ?.getLogsForMerchant(merchantBeingEdited?.merchantPK)
        .then(() => setActivityLogsIsLoading(false));
    }
  }, [displayAddOrEditMerchantScreen, merchantBeingEdited]);

  return (
    <AuthWrapper title={title} childButton={<></>}>
      {(hasCreateOrUpdateMerchantPermission ||
        hasCreateOrUpdateMerchantLogPermission) && (
        <>
          <AddOrEditMerchant
            isLoadingMerchantData={isLoadingMerchantData}
            accountStore={utilityStore?.rootStore?.accountStore}
            utilityStore={utilityStore}
            setDisplayAddOrEditMerchantScreen={
              setDisplayAddOrEditMerchantScreen
            }
            createOrUpdateMerchant={merchantStore?.createOrUpdateMerchant}
            merchantBeingEdited={merchantBeingEdited}
            setMerchantBeingEdited={setMerchantBeingEdited}
            basicMerchantsInfo={basicMerchantsInfo}
            clientTypes={merchantStore?.clientTypes}
            inventoryCategories={merchantStore?.inventoryCategories}
            verifyMerchantReferenceCode={
              merchantStore?.verifyMerchantReferenceCode
            }
            createOrUpdateMerchantBankAccount={
              merchantStore?.createOrUpdateMerchantBankAccount
            }
            addProgramsToMerchant={merchantStore?.addProgramsToMerchant}
            removeProgramsFromMerchant={
              merchantStore?.removeProgramsFromMerchant
            }
            getMerchantProgram={merchantStore?.getMerchantProgramsByMerchant}
            getClonedMerchantInfo={merchantStore?.getClonedMerchantInfo}
            getLogsForMerchant={merchantStore?.getLogsForMerchant}
            hasCreateOrUpdateMerchantLogPermissionOnly={
              hasCreateOrUpdateMerchantLogPermissionOnly
            }
            allProgramOptions={allProgramOptions}
            createInventoryCategory={merchantStore?.createInventoryCategory}
            getMerchantsByCriteria={async () => {
              await merchantStore?.getMerchantsByCriteria(
                merchantStore?.filterCriteria,
              );
            }}
          />
          <ActivityLogPanel
            createOrUpdateLog={merchantStore.createOrUpdateMerchantLog}
            config={config}
            accountPk={merchantBeingEdited?.merchantPK}
            activityLogs={merchantStore.merchantLogs.content}
            setIsLoading={utilityStore?.setIsLoading}
            hasNotesInternalPermission={hasInternalNotesModifyPermission}
            hasNotesStandardPermission={hasCreateOrUpdateMerchantLogPermission}
            progressPending={activityLogsIsLoading}
            paginationServer
            paginationTotalRows={merchantStore.merchantLogs?.totalElements}
            paginationPerPage={merchantStore.merchantLogs?.size}
            paginationRowsPerPageOptions={paginationRowsPerPageOptions}
            onChangePage={onChangePage}
            onChangeRowsPerPage={onChangeRowsPerPage}
            logTypes={merchantStore.merchantLogs.filtersOptions?.logTypes || []}
            onSubmitFilters={onSubmitFilters}
          />
        </>
      )}
      <DeleteMerchantModal
        isOpen={openDeleteMerchantModal}
        setIsOpen={() => setOpenDeleteMerchantModal(!openDeleteMerchantModal)}
        formik={deleteMerchantFormik}
      />
    </AuthWrapper>
  );
};

export default inject(
  'merchantStore',
  'overviewStore',
  'programStore',
  'utilityStore',
)(observer(MerchantDetailPage));
 pages/merchant/index.tsx 
+
38
−
223

Visualizado
import React, {useCallback, useEffect, useState} from 'react';
import React, {useEffect, useState} from 'react';
import {inject, observer} from 'mobx-react';
import {OverviewStore} from '@stores/overview';
import {UtilityStore} from '@stores/utility';
@@ -8,13 +8,8 @@ import {
  paginationRowsPerPageOptions,
  toTitleCase,
} from '@utils/helper';
import {
  hasModifyPermission,
  hasRestrictedModifyPermission,
  showToast,
} from '@uownleasing/common-utilities';
import {hasModifyPermission, showToast} from '@uownleasing/common-utilities';
import {merchantPageTableColumns} from '@utils/data-table-columns';
import AddOrEditMerchant from '../../components/merchant-info-panels/add-or-edit-merchant';
import AuthWrapper from '@layouts/auth';
import classNames from 'classnames';
import styles from './index.module.scss';
@@ -25,18 +20,15 @@ import {
  getMerchantFilterProps,
} from '@utils/merchant-table-config';
import {
  ActivityLogFilters,
  ActivityLogPanel,
  defaultPaginatedResp,
  EmailCSVModal,
  FilterTable,
  Options,
} from '@uownleasing/common-ui';
import {useFormik} from 'formik';
import config from '@config/project-config';
import {BasicMerchantInfo, MerchantInfo, MerchantProgram} from '@models';
import {MerchantInfo} from '@models';
import {ProgramStore} from '@stores/program';
import DeleteMerchantModal from '@components/merchant-info-panels/delete-merchant-modal';
import {useRouter} from 'next/router';

interface MerchantProps {
  merchantStore: MerchantStore;
@@ -46,7 +38,7 @@ interface MerchantProps {
}

const MerchantPage = (props: MerchantProps) => {
  const {merchantStore, overviewStore, programStore, utilityStore} = props;
  const {merchantStore, overviewStore, utilityStore} = props;
  const [allMerchantsData, setAllMerchantsData] = useState(
    merchantStore?.adminMerchants || [],
  );
@@ -57,63 +49,8 @@ const MerchantPage = (props: MerchantProps) => {
  const [totalRows, setTotalRows] = useState(0);
  const [columns, setColumns] = useState([]);
  const [configColumns, setConfigColumns] = useState([]);
  const [allPrograms, setAllPrograms] = useState<MerchantProgram[]>([]);
  const [allProgramOptions, setAllProgramOptions] = useState<Options[]>([]);
  const [openDeleteMerchantModal, setOpenDeleteMerchantModal] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [basicMerchantsInfo, setBasicCloneMerchantsInfo] =
    useState<BasicMerchantInfo[]>();
  const [activityLogsIsLoading, setActivityLogsIsLoading] = useState(false);

  const onSubmitFilters = useCallback(
    async (filters: ActivityLogFilters) => {
      setActivityLogsIsLoading(true);
      await merchantStore.getLogsForMerchant(merchantBeingEdited?.merchantPK, {
        page: 0,
        size: merchantStore.merchantLogs.size,
        logTypes: filters.logTypes,
        notes: filters.notes,
        createdBy: filters.userId,
      });
      setActivityLogsIsLoading(false);
    },
    [merchantBeingEdited?.merchantPK, merchantStore],
  );

  const onChangePage = useCallback(
    async (page: number, _totalRows: number, filters: ActivityLogFilters) => {
      setActivityLogsIsLoading(true);
      await merchantStore.getLogsForMerchant(merchantBeingEdited?.merchantPK, {
        page: page - 1,
        size: merchantStore.merchantLogs.size,
        logTypes: filters.logTypes,
        notes: filters.notes,
        createdBy: filters.userId,
      });
      setActivityLogsIsLoading(false);
    },
    [merchantBeingEdited?.merchantPK, merchantStore],
  );

  const onChangeRowsPerPage = useCallback(
    async (
      currentRowsPerPage: number,
      _currentPage: number,
      filters: ActivityLogFilters,
    ) => {
      setActivityLogsIsLoading(true);
      await merchantStore.getLogsForMerchant(merchantBeingEdited?.merchantPK, {
        page: 0,
        size: currentRowsPerPage,
        logTypes: filters.logTypes,
        notes: filters.notes,
        createdBy: filters.userId,
      });
      setActivityLogsIsLoading(false);
    },
    [merchantBeingEdited?.merchantPK, merchantStore],
  );

  const permissions = utilityStore?.rootStore?.accountStore?.permissions;

  const updateCSVData = async () => {
@@ -191,22 +128,7 @@ const MerchantPage = (props: MerchantProps) => {
      }
    },
  });

  useEffect(() => {
    const getBasicMerchantInfoByRefCode = async () => {
      const merchantCode =
        overviewStore?.rootStore?.accountStore?.merchantReferenceCode || '';
      const basicInfoResponse =
        await overviewStore?.getBasicMerchantInfoByRefCode(merchantCode);

      if (basicInfoResponse.status < 400) {
        setBasicCloneMerchantsInfo(
          basicInfoResponse.data as BasicMerchantInfo[],
        );
      }
    };
    getBasicMerchantInfoByRefCode();
  }, [overviewStore]);
  const router = useRouter();

  useEffect(() => {
    setConfigColumns(
@@ -214,8 +136,7 @@ const MerchantPage = (props: MerchantProps) => {
        deleteMerchantFormik,
        setOpenDeleteMerchantModal,
        (merchant: MerchantInfo) => {
          setMerchantBeingEdited(merchant);
          setDisplayAddOrEditMerchantScreen(true);
          router.push(`merchant/${merchant.refMerchantCode}`);
        },
      ).map((column) => {
        if (formik?.values?.[column?.name]) {
@@ -286,44 +207,15 @@ const MerchantPage = (props: MerchantProps) => {
    },
  });

  const hasCreateOrUpdateMerchantPermission = hasModifyPermission(
    permissions,
    'merchant',
    'create_or_update_merchant',
  );

  const hasCreateOrUpdateMerchantLogPermission = hasModifyPermission(
    permissions,
    'merchant',
    'create_or_update_merchant_log',
  );

  const hasEmailCSVPermission = hasModifyPermission(
    permissions,
    'merchant',
    'email_csv',
  );

  const hasInternalNotesModifyPermission = hasRestrictedModifyPermission(
    permissions,
    'merchant_internal_notes',
  );

  const hasCreateOrUpdateMerchantLogPermissionOnly =
    !hasCreateOrUpdateMerchantPermission &&
    hasCreateOrUpdateMerchantLogPermission;

  const addOrEditTitle = merchantBeingEdited ? 'EDIT' : 'ADD A NEW';

  const title = !displayAddOrEditMerchantScreen
    ? 'MERCHANTS'
    : `MERCHANTS > ${addOrEditTitle} COMPANY`;

  useEffect(() => {
    utilityStore.setIsLoading(true);
    const promises = [];
    promises.push(programStore?.getAllMerchantPrograms('', 0, null, true)); //keep as first
    promises.push(merchantStore?.getAllClientTypes());
    promises.push(merchantStore?.getAllInventoryCategories());
    promises.push(
      merchantStore?.getMerchantsByCriteria({
@@ -339,7 +231,7 @@ const MerchantPage = (props: MerchantProps) => {
      }),
    );
    // Fulfills all promises and sets the main table data.
    Promise.all(promises).then((res) => {
    Promise.all(promises).then(() => {
      setColumns(
        merchantPageTableColumns(
          deleteMerchantFormik,
@@ -355,8 +247,6 @@ const MerchantPage = (props: MerchantProps) => {
        })),
      );

      const allMerchProgs = res[0]?.data?.merchantPrograms;
      setAllPrograms(allMerchProgs || []);
      setTotalRows(merchantStore?.filterCriteria?.totalRows || 10);
      utilityStore.setIsLoading(false);
    });
@@ -375,17 +265,6 @@ const MerchantPage = (props: MerchantProps) => {
    setAllMerchantsData(merchantStore?.adminMerchants || []);
  }, [displayAddOrEditMerchantScreen, merchantStore?.adminMerchants]);

  useEffect(() => {
    const programOptions: Options[] = (allPrograms || []).map((prog) => {
      return {
        label: prog?.programInfo?.programName || '',
        value: prog?.programInfo?.programName || '',
        key: String(prog?.programInfo?.programPk) || null,
      };
    });
    setAllProgramOptions(programOptions);
  }, [allPrograms]);

  const AddNewCompanyButton = () => {
    return (
      <Button
@@ -393,6 +272,7 @@ const MerchantPage = (props: MerchantProps) => {
        onClick={() => {
          setDisplayAddOrEditMerchantScreen(true);
          merchantStore?.setMerchantLogs(defaultPaginatedResp([]));
          router.push('/merchant/new');
        }}>
        ADD NEW COMPANY
      </Button>
@@ -469,10 +349,7 @@ const MerchantPage = (props: MerchantProps) => {

  useEffect(() => {
    if (displayAddOrEditMerchantScreen && merchantBeingEdited?.merchantPk) {
      setActivityLogsIsLoading(true);
      merchantStore
        ?.getLogsForMerchant(merchantBeingEdited?.merchantPk)
        .then(() => setActivityLogsIsLoading(false));
      merchantStore?.getLogsForMerchant(merchantBeingEdited?.merchantPk);
    }
  }, [displayAddOrEditMerchantScreen, merchantBeingEdited]);

@@ -487,106 +364,44 @@ const MerchantPage = (props: MerchantProps) => {

  return (
    <AuthWrapper
      title={title}
      title={'MERCHANTS'}
      childButton={
        !displayAddOrEditMerchantScreen &&
        !hasViewPermissionOnly &&
        AddNewCompanyButton()
      }>
      {displayAddOrEditMerchantScreen &&
      (hasCreateOrUpdateMerchantPermission ||
        hasCreateOrUpdateMerchantLogPermission) ? (
        <>
          <AddOrEditMerchant
            accountStore={utilityStore?.rootStore?.accountStore}
            utilityStore={utilityStore}
            setDisplayAddOrEditMerchantScreen={
              setDisplayAddOrEditMerchantScreen
            }
            createOrUpdateMerchant={merchantStore?.createOrUpdateMerchant}
            merchantBeingEdited={merchantBeingEdited}
            setMerchantBeingEdited={setMerchantBeingEdited}
            basicMerchantsInfo={basicMerchantsInfo}
            clientTypes={merchantStore?.clientTypes}
            inventoryCategories={merchantStore?.inventoryCategories}
            verifyMerchantReferenceCode={
              merchantStore?.verifyMerchantReferenceCode
            }
            createOrUpdateMerchantBankAccount={
              merchantStore?.createOrUpdateMerchantBankAccount
            }
            addProgramsToMerchant={merchantStore?.addProgramsToMerchant}
            removeProgramsFromMerchant={
              merchantStore?.removeProgramsFromMerchant
            }
            getMerchantProgram={merchantStore?.getMerchantProgramsByMerchant}
            getClonedMerchantInfo={merchantStore?.getClonedMerchantInfo}
            getLogsForMerchant={merchantStore?.getLogsForMerchant}
            hasCreateOrUpdateMerchantLogPermissionOnly={
              hasCreateOrUpdateMerchantLogPermissionOnly
            }
            allProgramOptions={allProgramOptions}
            createInventoryCategory={merchantStore?.createInventoryCategory}
            getMerchantsByCriteria={async () => {
              await merchantStore?.getMerchantsByCriteria(
                merchantStore?.filterCriteria,
              );
            }}
          />
          <ActivityLogPanel
            createOrUpdateLog={merchantStore.createOrUpdateMerchantLog}
            config={config}
            accountPk={merchantBeingEdited?.merchantPK}
            activityLogs={merchantStore.merchantLogs.content}
            setIsLoading={utilityStore?.setIsLoading}
            hasNotesInternalPermission={hasInternalNotesModifyPermission}
            hasNotesStandardPermission={hasCreateOrUpdateMerchantLogPermission}
            progressPending={activityLogsIsLoading}
            paginationServer
            paginationTotalRows={merchantStore.merchantLogs?.totalElements}
            paginationPerPage={merchantStore.merchantLogs?.size}
            paginationRowsPerPageOptions={paginationRowsPerPageOptions}
            onChangePage={onChangePage}
            onChangeRowsPerPage={onChangeRowsPerPage}
            logTypes={merchantStore.merchantLogs.filtersOptions?.logTypes || []}
            onSubmitFilters={onSubmitFilters}
          />
        </>
      ) : (
        <div className="mt-3">
          <FilterTable
            isResizeable
            columns={configColumns}
            configColumnProps={configColumnProps}
            csvDownloadProps={merchantCSVProps}
            customStyles={dataTableCustomStyles}
            data={allMerchantsData}
            defaultSortAsc={true}
            filterProps={filterProps}
            formik={formik}
            onChangePage={handlePageChange}
            onChangeRowsPerPage={handlePerRowsChange}
            pagination
            paginationPerPage={merchantStore?.filterCriteria?.max_results}
            paginationRowsPerPageOptions={paginationRowsPerPageOptions}
            paginationServer
            paginationTotalRows={merchantStore?.filterCriteria?.totalRows}
            paginationDefaultPage={
              merchantStore?.filterCriteria?.page_number + 1 || 0
            }
            striped
            isOpen={isFilterTableOpen}
            progressPending={utilityStore?.isLoading}
            highlightOnHover
          />
        </div>
      )}
      <div className="mt-3">
        <FilterTable
          isResizeable
          columns={configColumns}
          configColumnProps={configColumnProps}
          csvDownloadProps={merchantCSVProps}
          customStyles={dataTableCustomStyles}
          data={allMerchantsData}
          defaultSortAsc={true}
          filterProps={filterProps}
          formik={formik}
          onChangePage={handlePageChange}
          onChangeRowsPerPage={handlePerRowsChange}
          pagination
          paginationPerPage={merchantStore?.filterCriteria?.max_results}
          paginationRowsPerPageOptions={paginationRowsPerPageOptions}
          paginationServer
          paginationTotalRows={merchantStore?.filterCriteria?.totalRows}
          paginationDefaultPage={
            merchantStore?.filterCriteria?.page_number + 1 || 0
          }
          striped
          isOpen={isFilterTableOpen}
          progressPending={utilityStore?.isLoading}
          highlightOnHover
        />
      </div>
      <DeleteMerchantModal
        isOpen={openDeleteMerchantModal}
        setIsOpen={() => setOpenDeleteMerchantModal(!openDeleteMerchantModal)}
        formik={deleteMerchantFormik}
      />

      <EmailCSVModal
        emailModal={isEmailModalOpen}
        setEmailModal={setIsEmailModalOpen}
 utils/data-table-columns.tsx 
+
4
−
1

Visualizado
@@ -3671,7 +3671,10 @@ export const merchantSettingTableColumns = () => {
      width: '250px',
      selector: (row) => (
        <div className={classNames(styles?.dataTableColumn__textUnderline)}>
          {row?.merchantInfo?.refMerchantCode}
          <Link
            href={`merchant/${row?.merchantInfo?.refMerchantCode}?from=merchantSetting`}>
            <a target="_blank">{row?.merchantInfo?.refMerchantCode}</a>
          </Link>
        </div>
      ),
    },

-----

Comparar
e
 2 arquivos
+
1
−
1
Arquivos
2
Search (e.g. *.vue) (F)

components/cust
‎omer-info-panels‎

index.mo
‎dule.scss‎
+1 -0

sales-
‎rep.tsx‎
+0 -1

 components/customer-info-panels/index.module.scss 
+
1
−
0

Visualizado
@@ -83,6 +83,7 @@

.refMerchantCodeLink{
  div > div {
      color: var(--navbar-hover);
      text-decoration: underline
  }
}
 components/customer-info-panels/sales-rep.tsx 
+
0
−
1

Visualizado
@@ -308,7 +308,6 @@ const SalesRepPanel = (props: SalesRepPanelProps) => {
                label="Reference Merchant Code"
                name="refMerchantCode"
                isReadOnly={true}
                style={{textDecoration: 'underline'}}
              />
            </a>
          </Link>


------------------------------------------------------------------------------------------------------------------------------------------------------------------

R7.1.25.43.0_AddMerchantSupportFieldToMerchantSettingsPageForBulkUpdates_Ticket1072

------------------------------------------------------------------------------------------------------------------------------------------------------------------

### Português
**Cenário Outline: Filtrar por Sales Rep Code, selecionar todos, capturar código e abrir por código para validar Merchant Support**
  # Filtra por código do representante de vendas antes de aplicar o Select All
  Quando Filtrar merchants por Sales Rep Code "<salesRepCode>"
  E Selecionar todos os merchants para atualização em massa
  E Capturar um código de merchant da lista de configurações
  E Abrir o merchant capturado por código
  Então Verificar o painel "Configurações do Merchant" com os valores:
    | campo            | valor                | tipoDeValidação |
    | Merchant Support | <expectedSupportVal> | TEXT_EQUALS    |

**Exemplos:**
  | salesRepCode |
  | 270092       |    

-----    

> ## Tests in qa2
> ```gherkin
> ### Scenario Outline: Filter by Sales Rep Code, select all, capture code, and open by code to validate Merchant Support**
> When Filter merchants by Sales Rep Code "<salesRepCode>"
> And Select all merchants for bulk update
> And Capture a merchant code from settings list
> And Open captured merchant by code
> Then Verify panel "Merchant Settings" with values:
> | field            | value                | validationType |
> | Merchant Support | <expectedSupportVal> | TEXT_EQUALS    |
> 
> **Examples:**
> | salesRepCode |
> | 270092       |
>
> | ERROR |
> The merchant support entered during the bulk update is not being displayed on the interface, in the logs, nor in the database.
> ```
>
>

-----

> ## Tests in qa2
> ```gherkin
> ### Scenario Outline: Filter by Sales Rep Code, select all, capture code, and open by code to validate Merchant Support**
> When Filter merchants by Sales Rep Code "<salesRepCode>"
> And Select all merchants for bulk update
> And Capture a merchant code from settings list
> And Open captured merchant by code
> Then Verify panel "Merchant Settings" with values
> | field            | value                | validationType |
> | Merchant Support | <expectedSupportVal> | TEXT_EQUALS    |
> 
> Examples
> | salesRepCode |
> | 270092       |
>
> | PASS |
> ```
>
>
[R7.1.25.43.0_AddMerchantSupportFieldToMerchantSettingsPageForBulkUpdates_Ticket1072_QA2_2025_08_19_2016_21617.html](/uploads/221341234367058a11db99b632ce5789/R7.1.25.43.0_AddMerchantSupportFieldToMerchantSettingsPageForBulkUpdates_Ticket1072_QA2_2025_08_19_2016_21617.html)
>
>
>

------------------------------------------------------------------------------------------------------------------------------------------------------------------

> ## Tests in stg
> ```gherkin
> ### Scenario Outline: Filter by Sales Rep Code, select all, capture code, and open by code to validate Merchant Support**
> When Filter merchants by Sales Rep Code "<salesRepCode>"
> And Select all merchants for bulk update
> And Capture a merchant code from settings list
> And Open captured merchant by code
> Then Verify panel "Merchant Settings" with values
> | field            | value                | validationType |
> | Merchant Support | <expectedSupportVal> | TEXT_EQUALS    |
> 
> Examples
> | Merchant | salesRepCode | merchantSupportText |
> | Everly | 270092       | Rainold - Seller and customer support |
>
> | PASS |
> ```
>
>

>
>
>
------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1082

UOWN | Origination | Improve SEON Fraud Check Configuration by Grouping Related Flags

Synopsis
Enhance the merchant setup interface by grouping SEON-related verification flags (Verify IP, Verify Email, Verify Phone) under the main "Is Fraud Check Required" (SEON) flag to improve clarity and ease of use during configuration and training.

Mockup on SCREENSHOT FIELD, Take a look.

Business Objective
To streamline merchant onboarding and setup by making fraud check options clearer and more logically structured. 
This change will make it easier for internal teams to understand and configure fraud detection parameters, especially as responsibility is shared or transitioned between team members.

Feature Request | Business Requirements

------------------------------------------------------------------------------------------------------------------------------------------------------------------
      
1. Group SEON Related Flags 
      Modify the merchant configuration UI to nest the following options under the "Is Fraud Check Required" (SEON) flag:
      Verify IP
      Verify Email
      Verify Phone
      This should be implemented as a visual and logical grouping only — no change in backend logic is required unless discussed separately.
      

2. Maintain Current Behavior
Ensure that enabling Fraud Check along with any combination of the three sub-options continues to behave as currently implemented:  
      When verifyIp is selected, IP address is sent to SEON.
      Same for email and phone if selected.

     
3. Conditions to select and deselect
When the "Is Fraud Check Required" (SEON) flag is selected, all three sub-options (Verify IP, Verify Email, and Verify Phone) should automatically be selected as well.   
      If SEON is unchecked, all three sub-options must also be unchecked. 
      If SEON is checked, each of the three sub-options can be individually deselected afterward, allowing flexibility in specific configurations.

    
4. No Functional Change to Other Flags
The following flags remain separate and unaffected:
      Check UW for Verification
      Allow Purchase Option

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


alterações dev:

Comparar
e
 4 arquivos
+
124
−
45
Arquivos
4
Search (e.g. *.vue) (F)

compo
‎nents‎

for
‎mik‎

checkbox-
‎input.tsx‎
+11 -3

merchant-i
‎nfo-panels‎

settin
‎gs.tsx‎
+93 -36

layout
‎s/auth‎

inde
‎x.tsx‎
+5 -5

serv
‎er.js‎
+15 -1

 components/formik/checkbox-input.tsx 
+
11
−
3

Visualizado
@@ -7,6 +7,7 @@ export interface CheckBoxInputProps {
  label?: string;
  isRequired?: boolean;
  isReadOnly?: boolean;
  extendsOnChange?: (newValue: boolean) => void;
  mutuallyExclusiveWith?: string | string[];
}

@@ -18,6 +19,7 @@ export const CheckBoxInput = (props: CheckBoxInputProps) => {
    isRequired = false,
    isReadOnly = false,
    mutuallyExclusiveWith,
    extendsOnChange,
  } = props;

  const currentValue = !!formik?.values?.[name];
@@ -27,9 +29,12 @@ export const CheckBoxInput = (props: CheckBoxInputProps) => {
    if (isReadOnly) return;

    const newValue = !currentValue;
    

    if (!newValue) {
      formik.setFieldValue(name, false);
      if (extendsOnChange) {
        extendsOnChange(newValue);
      }
      return;
    }

@@ -38,7 +43,7 @@ export const CheckBoxInput = (props: CheckBoxInputProps) => {
        ? mutuallyExclusiveWith
        : [mutuallyExclusiveWith];

      others.forEach(field => {
      others.forEach((field) => {
        if (formik.values[field]) {
          formik.setFieldValue(field, false);
        }
@@ -46,6 +51,9 @@ export const CheckBoxInput = (props: CheckBoxInputProps) => {
    }

    formik.setFieldValue(name, true);
    if (extendsOnChange) {
      extendsOnChange(newValue);
    }
  };

  return (
@@ -68,4 +76,4 @@ export const CheckBoxInput = (props: CheckBoxInputProps) => {
      </Label>
    </div>
  );
};
\ No newline at end of file
};
 components/merchant-info-panels/settings.tsx 
+
93
−
36

Visualizado
/* eslint-disable react-hooks/exhaustive-deps */
import {Col, Collapse, Row} from 'reactstrap';
import React, {useEffect, useState} from 'react';
import styles from './index.module.scss';
@@ -18,8 +19,9 @@ import {handleKeyDown} from './merchant-helper';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faChevronDown, faChevronUp} from '@fortawesome/pro-light-svg-icons';
import {IconProp} from '@fortawesome/fontawesome-svg-core';
import { UtilityStore } from '@stores/utility';
import {UtilityStore} from '@stores/utility';
import {inject, observer} from 'mobx-react';
import {FormikProps} from 'formik';

export const TERMINATION_REASONS = [
  '200 - Customer Performance',
@@ -36,15 +38,35 @@ export const TERMINATION_REASONS = [
];

interface SettingsPanelProps {
  formik: any;
  formik: FormikProps<{
    isFraudCheckRequired: boolean;
    useNeustar: boolean;
    useSentilink: boolean;
    verifyPhone: boolean;
    verifyEmail: boolean;
    verifyIp: boolean;
    sendMergedFundingReport: string;
    sendAutomatedFundingReport: boolean;
    mergedFundingReportEmails: Options[];
    fundingReportEmails: Options[];
    isActive: boolean;
    isItemSplit: boolean;
    useWebhook: boolean;
    clientType: string;
    validStates: Options[];
  }>;
  stateOptions: string[];
  hasCreateOrUpdateMerchantLogPermissionOnly: boolean;
  utilityStore: UtilityStore;
}

const SettingsPanel = (props: SettingsPanelProps) => {
  const {formik, stateOptions, hasCreateOrUpdateMerchantLogPermissionOnly, utilityStore} =
    props;
  const {
    formik,
    stateOptions,
    hasCreateOrUpdateMerchantLogPermissionOnly,
    utilityStore,
  } = props;
  const [currentStateOptions, setCurrentStateOptions] = useState([]);
  const [emailInputValue, setEmailInputValue] = useState('');
  const [mergedEmailInputValue, setMergedEmailInputValue] = useState('');
@@ -90,6 +112,31 @@ const SettingsPanel = (props: SettingsPanelProps) => {
    );
  }, []);

  useEffect(() => {
    const isAllVerificationsSettedFalse =
      !formik.values.verifyPhone &&
      !formik.values.verifyEmail &&
      !formik.values.verifyIp;

    const isOneVerificationsSettedTrue =
      formik.values.verifyPhone ||
      formik.values.verifyEmail ||
      formik.values.verifyIp;

    if (isAllVerificationsSettedFalse) {
      formik.setFieldValue('isFraudCheckRequired', false);
      return;
    }

    if (isOneVerificationsSettedTrue) {
      formik.setFieldValue('isFraudCheckRequired', true);
    }
  }, [
    formik.values.verifyPhone,
    formik.values.verifyEmail,
    formik.values.verifyIp,
  ]);

  const isMerchantTypeDisabled =
    formik?.values?.clientType?.includes('PAY_TOMORROW') ||
    isEqual(formik?.values?.clientType, 'TIRE_AGENT');
@@ -105,7 +152,7 @@ const SettingsPanel = (props: SettingsPanelProps) => {
    'merchant',
    'modify_minimum_lease_amount',
  );
  

  return (
    <CollapsableEditLayout title="Settings" isEditable={false}>
      <Row className={styles?.panel__row}>
@@ -148,8 +195,7 @@ const SettingsPanel = (props: SettingsPanelProps) => {
        className={classNames(
          'py-2 px-3 mb-2 d-flex justify-content-between cursor-pointer',
          styles?.panel__title,
        )}
      >
        )}>
        Status
        <div>
          <FontAwesomeIcon icon={handleShowIcon(showStatus)} />
@@ -261,8 +307,7 @@ const SettingsPanel = (props: SettingsPanelProps) => {
        className={classNames(
          'py-2 px-3 mb-2 mt-3 d-flex justify-content-between cursor-pointer',
          styles?.panel__title,
        )}
      >
        )}>
        Fee
        <div>
          <FontAwesomeIcon icon={handleShowIcon(showFee)} />
@@ -297,8 +342,7 @@ const SettingsPanel = (props: SettingsPanelProps) => {
        className={classNames(
          'py-2 px-3 mb-2 mt-3 d-flex justify-content-between cursor-pointer',
          styles?.panel__title,
        )}
      >
        )}>
        Status Change
        <div>
          <FontAwesomeIcon icon={handleShowIcon(showStatusChange)} />
@@ -327,8 +371,7 @@ const SettingsPanel = (props: SettingsPanelProps) => {
        className={classNames(
          'py-2 px-3 mb-2 mt-3 d-flex justify-content-between cursor-pointer',
          styles?.panel__title,
        )}
      >
        )}>
        Others
        <div>
          <FontAwesomeIcon icon={handleShowIcon(showOther)} />
@@ -457,8 +500,7 @@ const SettingsPanel = (props: SettingsPanelProps) => {
        className={classNames(
          'py-2 px-3 mb-2 mt-3 d-flex justify-content-between cursor-pointer',
          styles?.panel__title,
        )}
      >
        )}>
        Fraud
        <div>
          <FontAwesomeIcon icon={handleShowIcon(showFraud)} />
@@ -471,8 +513,41 @@ const SettingsPanel = (props: SettingsPanelProps) => {
            formik={formik}
            label="Is Fraud Check Required"
            name="isFraudCheckRequired"
            mutuallyExclusiveWith="isFraudCheckRequired"
            isReadOnly={hasCreateOrUpdateMerchantLogPermissionOnly}
            extendsOnChange={(newValue: boolean) => {
              if (newValue) {
                formik.setFieldValue('verifyPhone', true);
                formik.setFieldValue('verifyEmail', true);
                formik.setFieldValue('verifyIp', true);
              } else {
                formik.setFieldValue('verifyPhone', false);
                formik.setFieldValue('verifyEmail', false);
                formik.setFieldValue('verifyIp', false);
              }
            }}
          />
          <div className="ml-4">
            <CheckBoxInput
              formik={formik}
              label="Verify Phone"
              name="verifyPhone"
              isReadOnly={hasCreateOrUpdateMerchantLogPermissionOnly}
            />
            <CheckBoxInput
              formik={formik}
              label="Verify Email"
              name="verifyEmail"
              isReadOnly={hasCreateOrUpdateMerchantLogPermissionOnly}
            />
            <CheckBoxInput
              formik={formik}
              label="Verify IP"
              name="verifyIp"
              isReadOnly={hasCreateOrUpdateMerchantLogPermissionOnly}
            />
          </div>

          <CheckBoxInput
            formik={formik}
            label="Use Neustar"
@@ -485,24 +560,6 @@ const SettingsPanel = (props: SettingsPanelProps) => {
            name="useSentilink"
            isReadOnly={hasCreateOrUpdateMerchantLogPermissionOnly}
          />
          <CheckBoxInput
            formik={formik}
            label="Verify Phone"
            name="verifyPhone"
            isReadOnly={hasCreateOrUpdateMerchantLogPermissionOnly}
          />
          <CheckBoxInput
            formik={formik}
            label="Verify Email"
            name="verifyEmail"
            isReadOnly={hasCreateOrUpdateMerchantLogPermissionOnly}
          />
          <CheckBoxInput
            formik={formik}
            label="Verify IP"
            name="verifyIp"
            isReadOnly={hasCreateOrUpdateMerchantLogPermissionOnly}
          />
        </div>
      </Collapse>

@@ -638,7 +695,7 @@ const SettingsPanel = (props: SettingsPanelProps) => {
          <FlipSwitch
            className={styles?.flipSwitch}
            label="Send Merged Funding Report"
            checked={formik?.values?.sendMergedFundingReport}
            checked={!!formik?.values?.sendMergedFundingReport}
            name="sendMergedFundingReport"
            isWriteMode={false}
            onChange={() => null}
@@ -646,7 +703,7 @@ const SettingsPanel = (props: SettingsPanelProps) => {
        </Col>
      </Row>

      <Collapse isOpen={formik?.values?.sendMergedFundingReport}>
      <Collapse isOpen={!!formik?.values?.sendMergedFundingReport}>
        <Row className={classNames(styles?.panel__row)}>
          <Col xs={6}>
            <InputField
@@ -708,7 +765,7 @@ const SettingsPanel = (props: SettingsPanelProps) => {
        </Col>
      </Row>

      <Collapse isOpen={formik?.values?.sendAutomatedFundingReport}>
      <Collapse isOpen={!!formik?.values?.sendAutomatedFundingReport}>
        <Row className={classNames(styles?.panel__row)}>
          <Col xs={6}>
            <InputField
 layouts/auth/index.tsx 
+
5
−
5

Visualizado
@@ -25,7 +25,7 @@ import {
import {inject, observer} from 'mobx-react';
import Image from 'next/image';
import {useRouter} from 'next/router';
import React, {useEffect, useMemo, useState} from 'react';
import React, {useEffect, useMemo, useRef, useState} from 'react';

export interface AuthWrapperProps {
  children: React.ReactNode | React.ReactNode[];
@@ -70,7 +70,7 @@ const AuthWrapper = (props: AuthWrapperProps) => {
  const [isMoveContractToSignedModalOpen, setIsMoveContractToSignedModalOpen] =
    useState(false);
  const isShowingAlert = customerStore?.isShowingAlert || false;
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isLoggingOut = useRef(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>(
    customerStore?.quickSearchResults,
  );
@@ -601,10 +601,10 @@ const AuthWrapper = (props: AuthWrapperProps) => {

  const handleLogout = async () => {
    if (typeof window !== 'undefined') {
      if (!isLoggingOut) {
        setIsLoggingOut(true);
      if (!isLoggingOut.current) {
        isLoggingOut.current = true;
        const responseCode = await accountStore?.logout();
        if (typeof router !== 'undefined' && router?.isReady) {
        if (typeof router !== 'undefined') {
          await router?.push('/');
        }
        return responseCode;
 server.js 
+
15
−
1

Visualizado
@@ -43,6 +43,18 @@ hazelcastProto.all = (callback) => {

const MAX_JWT_AGE = 60 * 15; // 15 minutes

const normalizeMerchantDetailstRoute = (routePath) => {
  try {
    const isMerchantDetailsPage = routePath.match(/^\/merchant\/.+/);
    if (isMerchantDetailsPage) {
      return '/merchant';
    }
    return routePath;
  } catch (error) {
    return routePath;
  }
};

const bankAccountNumberMask = (permissions, bankAccountNumber) => {
  if (!bankAccountNumber) {
    return;
@@ -1413,7 +1425,9 @@ app
      const reqMethod = req?.method || '';
      const userPathName =
        req?.headers?.['user-path'] || req?.session?.userPathName;
      const path = userPathName?.replace('/', '');
      const path = normalizeMerchantDetailstRoute(
        userPathName?.replace('/', ''),
      );
      if (
        !reqPath.includes('/uown/') ||
        hasWhitelistedPermission(reqMethod, reqPath)

Comparar
e
 4 arquivos
+
124
−
45
Arquivos
4
Search (e.g. *.vue) (F)

compo
‎nents‎

for
‎mik‎

checkbox-
‎input.tsx‎
+11 -3

merchant-i
‎nfo-panels‎

settin
‎gs.tsx‎
+93 -36

layout
‎s/auth‎

inde
‎x.tsx‎
+5 -5

serv
‎er.js‎
+15 -1

 components/formik/checkbox-input.tsx 
+
11
−
3

Visualizado
@@ -7,6 +7,7 @@ export interface CheckBoxInputProps {
  label?: string;
  isRequired?: boolean;
  isReadOnly?: boolean;
  extendsOnChange?: (newValue: boolean) => void;
  mutuallyExclusiveWith?: string | string[];
}

@@ -18,6 +19,7 @@ export const CheckBoxInput = (props: CheckBoxInputProps) => {
    isRequired = false,
    isReadOnly = false,
    mutuallyExclusiveWith,
    extendsOnChange,
  } = props;

  const currentValue = !!formik?.values?.[name];
@@ -27,9 +29,12 @@ export const CheckBoxInput = (props: CheckBoxInputProps) => {
    if (isReadOnly) return;

    const newValue = !currentValue;
    

    if (!newValue) {
      formik.setFieldValue(name, false);
      if (extendsOnChange) {
        extendsOnChange(newValue);
      }
      return;
    }

@@ -38,7 +43,7 @@ export const CheckBoxInput = (props: CheckBoxInputProps) => {
        ? mutuallyExclusiveWith
        : [mutuallyExclusiveWith];

      others.forEach(field => {
      others.forEach((field) => {
        if (formik.values[field]) {
          formik.setFieldValue(field, false);
        }
@@ -46,6 +51,9 @@ export const CheckBoxInput = (props: CheckBoxInputProps) => {
    }

    formik.setFieldValue(name, true);
    if (extendsOnChange) {
      extendsOnChange(newValue);
    }
  };

  return (
@@ -68,4 +76,4 @@ export const CheckBoxInput = (props: CheckBoxInputProps) => {
      </Label>
    </div>
  );
};
\ No newline at end of file
};
 components/merchant-info-panels/settings.tsx 
+
93
−
36

Visualizado
/* eslint-disable react-hooks/exhaustive-deps */
import {Col, Collapse, Row} from 'reactstrap';
import React, {useEffect, useState} from 'react';
import styles from './index.module.scss';
@@ -18,8 +19,9 @@ import {handleKeyDown} from './merchant-helper';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faChevronDown, faChevronUp} from '@fortawesome/pro-light-svg-icons';
import {IconProp} from '@fortawesome/fontawesome-svg-core';
import { UtilityStore } from '@stores/utility';
import {UtilityStore} from '@stores/utility';
import {inject, observer} from 'mobx-react';
import {FormikProps} from 'formik';

export const TERMINATION_REASONS = [
  '200 - Customer Performance',
@@ -36,15 +38,35 @@ export const TERMINATION_REASONS = [
];

interface SettingsPanelProps {
  formik: any;
  formik: FormikProps<{
    isFraudCheckRequired: boolean;
    useNeustar: boolean;
    useSentilink: boolean;
    verifyPhone: boolean;
    verifyEmail: boolean;
    verifyIp: boolean;
    sendMergedFundingReport: string;
    sendAutomatedFundingReport: boolean;
    mergedFundingReportEmails: Options[];
    fundingReportEmails: Options[];
    isActive: boolean;
    isItemSplit: boolean;
    useWebhook: boolean;
    clientType: string;
    validStates: Options[];
  }>;
  stateOptions: string[];
  hasCreateOrUpdateMerchantLogPermissionOnly: boolean;
  utilityStore: UtilityStore;
}

const SettingsPanel = (props: SettingsPanelProps) => {
  const {formik, stateOptions, hasCreateOrUpdateMerchantLogPermissionOnly, utilityStore} =
    props;
  const {
    formik,
    stateOptions,
    hasCreateOrUpdateMerchantLogPermissionOnly,
    utilityStore,
  } = props;
  const [currentStateOptions, setCurrentStateOptions] = useState([]);
  const [emailInputValue, setEmailInputValue] = useState('');
  const [mergedEmailInputValue, setMergedEmailInputValue] = useState('');
@@ -90,6 +112,31 @@ const SettingsPanel = (props: SettingsPanelProps) => {
    );
  }, []);

  useEffect(() => {
    const isAllVerificationsSettedFalse =
      !formik.values.verifyPhone &&
      !formik.values.verifyEmail &&
      !formik.values.verifyIp;

    const isOneVerificationsSettedTrue =
      formik.values.verifyPhone ||
      formik.values.verifyEmail ||
      formik.values.verifyIp;

    if (isAllVerificationsSettedFalse) {
      formik.setFieldValue('isFraudCheckRequired', false);
      return;
    }

    if (isOneVerificationsSettedTrue) {
      formik.setFieldValue('isFraudCheckRequired', true);
    }
  }, [
    formik.values.verifyPhone,
    formik.values.verifyEmail,
    formik.values.verifyIp,
  ]);

  const isMerchantTypeDisabled =
    formik?.values?.clientType?.includes('PAY_TOMORROW') ||
    isEqual(formik?.values?.clientType, 'TIRE_AGENT');
@@ -105,7 +152,7 @@ const SettingsPanel = (props: SettingsPanelProps) => {
    'merchant',
    'modify_minimum_lease_amount',
  );
  

  return (
    <CollapsableEditLayout title="Settings" isEditable={false}>
      <Row className={styles?.panel__row}>
@@ -148,8 +195,7 @@ const SettingsPanel = (props: SettingsPanelProps) => {
        className={classNames(
          'py-2 px-3 mb-2 d-flex justify-content-between cursor-pointer',
          styles?.panel__title,
        )}
      >
        )}>
        Status
        <div>
          <FontAwesomeIcon icon={handleShowIcon(showStatus)} />
@@ -261,8 +307,7 @@ const SettingsPanel = (props: SettingsPanelProps) => {
        className={classNames(
          'py-2 px-3 mb-2 mt-3 d-flex justify-content-between cursor-pointer',
          styles?.panel__title,
        )}
      >
        )}>
        Fee
        <div>
          <FontAwesomeIcon icon={handleShowIcon(showFee)} />
@@ -297,8 +342,7 @@ const SettingsPanel = (props: SettingsPanelProps) => {
        className={classNames(
          'py-2 px-3 mb-2 mt-3 d-flex justify-content-between cursor-pointer',
          styles?.panel__title,
        )}
      >
        )}>
        Status Change
        <div>
          <FontAwesomeIcon icon={handleShowIcon(showStatusChange)} />
@@ -327,8 +371,7 @@ const SettingsPanel = (props: SettingsPanelProps) => {
        className={classNames(
          'py-2 px-3 mb-2 mt-3 d-flex justify-content-between cursor-pointer',
          styles?.panel__title,
        )}
      >
        )}>
        Others
        <div>
          <FontAwesomeIcon icon={handleShowIcon(showOther)} />
@@ -457,8 +500,7 @@ const SettingsPanel = (props: SettingsPanelProps) => {
        className={classNames(
          'py-2 px-3 mb-2 mt-3 d-flex justify-content-between cursor-pointer',
          styles?.panel__title,
        )}
      >
        )}>
        Fraud
        <div>
          <FontAwesomeIcon icon={handleShowIcon(showFraud)} />
@@ -471,8 +513,41 @@ const SettingsPanel = (props: SettingsPanelProps) => {
            formik={formik}
            label="Is Fraud Check Required"
            name="isFraudCheckRequired"
            mutuallyExclusiveWith="isFraudCheckRequired"
            isReadOnly={hasCreateOrUpdateMerchantLogPermissionOnly}
            extendsOnChange={(newValue: boolean) => {
              if (newValue) {
                formik.setFieldValue('verifyPhone', true);
                formik.setFieldValue('verifyEmail', true);
                formik.setFieldValue('verifyIp', true);
              } else {
                formik.setFieldValue('verifyPhone', false);
                formik.setFieldValue('verifyEmail', false);
                formik.setFieldValue('verifyIp', false);
              }
            }}
          />
          <div className="ml-4">
            <CheckBoxInput
              formik={formik}
              label="Verify Phone"
              name="verifyPhone"
              isReadOnly={hasCreateOrUpdateMerchantLogPermissionOnly}
            />
            <CheckBoxInput
              formik={formik}
              label="Verify Email"
              name="verifyEmail"
              isReadOnly={hasCreateOrUpdateMerchantLogPermissionOnly}
            />
            <CheckBoxInput
              formik={formik}
              label="Verify IP"
              name="verifyIp"
              isReadOnly={hasCreateOrUpdateMerchantLogPermissionOnly}
            />
          </div>

          <CheckBoxInput
            formik={formik}
            label="Use Neustar"
@@ -485,24 +560,6 @@ const SettingsPanel = (props: SettingsPanelProps) => {
            name="useSentilink"
            isReadOnly={hasCreateOrUpdateMerchantLogPermissionOnly}
          />
          <CheckBoxInput
            formik={formik}
            label="Verify Phone"
            name="verifyPhone"
            isReadOnly={hasCreateOrUpdateMerchantLogPermissionOnly}
          />
          <CheckBoxInput
            formik={formik}
            label="Verify Email"
            name="verifyEmail"
            isReadOnly={hasCreateOrUpdateMerchantLogPermissionOnly}
          />
          <CheckBoxInput
            formik={formik}
            label="Verify IP"
            name="verifyIp"
            isReadOnly={hasCreateOrUpdateMerchantLogPermissionOnly}
          />
        </div>
      </Collapse>

@@ -638,7 +695,7 @@ const SettingsPanel = (props: SettingsPanelProps) => {
          <FlipSwitch
            className={styles?.flipSwitch}
            label="Send Merged Funding Report"
            checked={formik?.values?.sendMergedFundingReport}
            checked={!!formik?.values?.sendMergedFundingReport}
            name="sendMergedFundingReport"
            isWriteMode={false}
            onChange={() => null}
@@ -646,7 +703,7 @@ const SettingsPanel = (props: SettingsPanelProps) => {
        </Col>
      </Row>

      <Collapse isOpen={formik?.values?.sendMergedFundingReport}>
      <Collapse isOpen={!!formik?.values?.sendMergedFundingReport}>
        <Row className={classNames(styles?.panel__row)}>
          <Col xs={6}>
            <InputField
@@ -708,7 +765,7 @@ const SettingsPanel = (props: SettingsPanelProps) => {
        </Col>
      </Row>

      <Collapse isOpen={formik?.values?.sendAutomatedFundingReport}>
      <Collapse isOpen={!!formik?.values?.sendAutomatedFundingReport}>
        <Row className={classNames(styles?.panel__row)}>
          <Col xs={6}>
            <InputField
 layouts/auth/index.tsx 
+
5
−
5

Visualizado
@@ -25,7 +25,7 @@ import {
import {inject, observer} from 'mobx-react';
import Image from 'next/image';
import {useRouter} from 'next/router';
import React, {useEffect, useMemo, useState} from 'react';
import React, {useEffect, useMemo, useRef, useState} from 'react';

export interface AuthWrapperProps {
  children: React.ReactNode | React.ReactNode[];
@@ -70,7 +70,7 @@ const AuthWrapper = (props: AuthWrapperProps) => {
  const [isMoveContractToSignedModalOpen, setIsMoveContractToSignedModalOpen] =
    useState(false);
  const isShowingAlert = customerStore?.isShowingAlert || false;
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isLoggingOut = useRef(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>(
    customerStore?.quickSearchResults,
  );
@@ -601,10 +601,10 @@ const AuthWrapper = (props: AuthWrapperProps) => {

  const handleLogout = async () => {
    if (typeof window !== 'undefined') {
      if (!isLoggingOut) {
        setIsLoggingOut(true);
      if (!isLoggingOut.current) {
        isLoggingOut.current = true;
        const responseCode = await accountStore?.logout();
        if (typeof router !== 'undefined' && router?.isReady) {
        if (typeof router !== 'undefined') {
          await router?.push('/');
        }
        return responseCode;
 server.js 
+
15
−
1

Visualizado
@@ -43,6 +43,18 @@ hazelcastProto.all = (callback) => {

const MAX_JWT_AGE = 60 * 15; // 15 minutes

const normalizeMerchantDetailstRoute = (routePath) => {
  try {
    const isMerchantDetailsPage = routePath.match(/^\/merchant\/.+/);
    if (isMerchantDetailsPage) {
      return '/merchant';
    }
    return routePath;
  } catch (error) {
    return routePath;
  }
};

const bankAccountNumberMask = (permissions, bankAccountNumber) => {
  if (!bankAccountNumber) {
    return;
@@ -1413,7 +1425,9 @@ app
      const reqMethod = req?.method || '';
      const userPathName =
        req?.headers?.['user-path'] || req?.session?.userPathName;
      const path = userPathName?.replace('/', '');
      const path = normalizeMerchantDetailstRoute(
        userPathName?.replace('/', ''),
      );
      if (
        !reqPath.includes('/uown/') ||
        hasWhitelistedPermission(reqMethod, reqPath)

Comparar
e
 4 arquivos
+
124
−
45
Arquivos
4
Search (e.g. *.vue) (F)

compo
‎nents‎

for
‎mik‎

checkbox-
‎input.tsx‎
+11 -3

merchant-i
‎nfo-panels‎

settin
‎gs.tsx‎
+93 -36

layout
‎s/auth‎

inde
‎x.tsx‎
+5 -5

serv
‎er.js‎
+15 -1

 components/formik/checkbox-input.tsx 
+
11
−
3

Visualizado
@@ -7,6 +7,7 @@ export interface CheckBoxInputProps {
  label?: string;
  isRequired?: boolean;
  isReadOnly?: boolean;
  extendsOnChange?: (newValue: boolean) => void;
  mutuallyExclusiveWith?: string | string[];
}

@@ -18,6 +19,7 @@ export const CheckBoxInput = (props: CheckBoxInputProps) => {
    isRequired = false,
    isReadOnly = false,
    mutuallyExclusiveWith,
    extendsOnChange,
  } = props;

  const currentValue = !!formik?.values?.[name];
@@ -27,9 +29,12 @@ export const CheckBoxInput = (props: CheckBoxInputProps) => {
    if (isReadOnly) return;

    const newValue = !currentValue;
    

    if (!newValue) {
      formik.setFieldValue(name, false);
      if (extendsOnChange) {
        extendsOnChange(newValue);
      }
      return;
    }

@@ -38,7 +43,7 @@ export const CheckBoxInput = (props: CheckBoxInputProps) => {
        ? mutuallyExclusiveWith
        : [mutuallyExclusiveWith];

      others.forEach(field => {
      others.forEach((field) => {
        if (formik.values[field]) {
          formik.setFieldValue(field, false);
        }
@@ -46,6 +51,9 @@ export const CheckBoxInput = (props: CheckBoxInputProps) => {
    }

    formik.setFieldValue(name, true);
    if (extendsOnChange) {
      extendsOnChange(newValue);
    }
  };

  return (
@@ -68,4 +76,4 @@ export const CheckBoxInput = (props: CheckBoxInputProps) => {
      </Label>
    </div>
  );
};
\ No newline at end of file
};
 components/merchant-info-panels/settings.tsx 
+
93
−
36

Visualizado
/* eslint-disable react-hooks/exhaustive-deps */
import {Col, Collapse, Row} from 'reactstrap';
import React, {useEffect, useState} from 'react';
import styles from './index.module.scss';
@@ -18,8 +19,9 @@ import {handleKeyDown} from './merchant-helper';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faChevronDown, faChevronUp} from '@fortawesome/pro-light-svg-icons';
import {IconProp} from '@fortawesome/fontawesome-svg-core';
import { UtilityStore } from '@stores/utility';
import {UtilityStore} from '@stores/utility';
import {inject, observer} from 'mobx-react';
import {FormikProps} from 'formik';

export const TERMINATION_REASONS = [
  '200 - Customer Performance',
@@ -36,15 +38,35 @@ export const TERMINATION_REASONS = [
];

interface SettingsPanelProps {
  formik: any;
  formik: FormikProps<{
    isFraudCheckRequired: boolean;
    useNeustar: boolean;
    useSentilink: boolean;
    verifyPhone: boolean;
    verifyEmail: boolean;
    verifyIp: boolean;
    sendMergedFundingReport: string;
    sendAutomatedFundingReport: boolean;
    mergedFundingReportEmails: Options[];
    fundingReportEmails: Options[];
    isActive: boolean;
    isItemSplit: boolean;
    useWebhook: boolean;
    clientType: string;
    validStates: Options[];
  }>;
  stateOptions: string[];
  hasCreateOrUpdateMerchantLogPermissionOnly: boolean;
  utilityStore: UtilityStore;
}

const SettingsPanel = (props: SettingsPanelProps) => {
  const {formik, stateOptions, hasCreateOrUpdateMerchantLogPermissionOnly, utilityStore} =
    props;
  const {
    formik,
    stateOptions,
    hasCreateOrUpdateMerchantLogPermissionOnly,
    utilityStore,
  } = props;
  const [currentStateOptions, setCurrentStateOptions] = useState([]);
  const [emailInputValue, setEmailInputValue] = useState('');
  const [mergedEmailInputValue, setMergedEmailInputValue] = useState('');
@@ -90,6 +112,31 @@ const SettingsPanel = (props: SettingsPanelProps) => {
    );
  }, []);

  useEffect(() => {
    const isAllVerificationsSettedFalse =
      !formik.values.verifyPhone &&
      !formik.values.verifyEmail &&
      !formik.values.verifyIp;

    const isOneVerificationsSettedTrue =
      formik.values.verifyPhone ||
      formik.values.verifyEmail ||
      formik.values.verifyIp;

    if (isAllVerificationsSettedFalse) {
      formik.setFieldValue('isFraudCheckRequired', false);
      return;
    }

    if (isOneVerificationsSettedTrue) {
      formik.setFieldValue('isFraudCheckRequired', true);
    }
  }, [
    formik.values.verifyPhone,
    formik.values.verifyEmail,
    formik.values.verifyIp,
  ]);

  const isMerchantTypeDisabled =
    formik?.values?.clientType?.includes('PAY_TOMORROW') ||
    isEqual(formik?.values?.clientType, 'TIRE_AGENT');
@@ -105,7 +152,7 @@ const SettingsPanel = (props: SettingsPanelProps) => {
    'merchant',
    'modify_minimum_lease_amount',
  );
  

  return (
    <CollapsableEditLayout title="Settings" isEditable={false}>
      <Row className={styles?.panel__row}>
@@ -148,8 +195,7 @@ const SettingsPanel = (props: SettingsPanelProps) => {
        className={classNames(
          'py-2 px-3 mb-2 d-flex justify-content-between cursor-pointer',
          styles?.panel__title,
        )}
      >
        )}>
        Status
        <div>
          <FontAwesomeIcon icon={handleShowIcon(showStatus)} />
@@ -261,8 +307,7 @@ const SettingsPanel = (props: SettingsPanelProps) => {
        className={classNames(
          'py-2 px-3 mb-2 mt-3 d-flex justify-content-between cursor-pointer',
          styles?.panel__title,
        )}
      >
        )}>
        Fee
        <div>
          <FontAwesomeIcon icon={handleShowIcon(showFee)} />
@@ -297,8 +342,7 @@ const SettingsPanel = (props: SettingsPanelProps) => {
        className={classNames(
          'py-2 px-3 mb-2 mt-3 d-flex justify-content-between cursor-pointer',
          styles?.panel__title,
        )}
      >
        )}>
        Status Change
        <div>
          <FontAwesomeIcon icon={handleShowIcon(showStatusChange)} />
@@ -327,8 +371,7 @@ const SettingsPanel = (props: SettingsPanelProps) => {
        className={classNames(
          'py-2 px-3 mb-2 mt-3 d-flex justify-content-between cursor-pointer',
          styles?.panel__title,
        )}
      >
        )}>
        Others
        <div>
          <FontAwesomeIcon icon={handleShowIcon(showOther)} />
@@ -457,8 +500,7 @@ const SettingsPanel = (props: SettingsPanelProps) => {
        className={classNames(
          'py-2 px-3 mb-2 mt-3 d-flex justify-content-between cursor-pointer',
          styles?.panel__title,
        )}
      >
        )}>
        Fraud
        <div>
          <FontAwesomeIcon icon={handleShowIcon(showFraud)} />
@@ -471,8 +513,41 @@ const SettingsPanel = (props: SettingsPanelProps) => {
            formik={formik}
            label="Is Fraud Check Required"
            name="isFraudCheckRequired"
            mutuallyExclusiveWith="isFraudCheckRequired"
            isReadOnly={hasCreateOrUpdateMerchantLogPermissionOnly}
            extendsOnChange={(newValue: boolean) => {
              if (newValue) {
                formik.setFieldValue('verifyPhone', true);
                formik.setFieldValue('verifyEmail', true);
                formik.setFieldValue('verifyIp', true);
              } else {
                formik.setFieldValue('verifyPhone', false);
                formik.setFieldValue('verifyEmail', false);
                formik.setFieldValue('verifyIp', false);
              }
            }}
          />
          <div className="ml-4">
            <CheckBoxInput
              formik={formik}
              label="Verify Phone"
              name="verifyPhone"
              isReadOnly={hasCreateOrUpdateMerchantLogPermissionOnly}
            />
            <CheckBoxInput
              formik={formik}
              label="Verify Email"
              name="verifyEmail"
              isReadOnly={hasCreateOrUpdateMerchantLogPermissionOnly}
            />
            <CheckBoxInput
              formik={formik}
              label="Verify IP"
              name="verifyIp"
              isReadOnly={hasCreateOrUpdateMerchantLogPermissionOnly}
            />
          </div>

          <CheckBoxInput
            formik={formik}
            label="Use Neustar"
@@ -485,24 +560,6 @@ const SettingsPanel = (props: SettingsPanelProps) => {
            name="useSentilink"
            isReadOnly={hasCreateOrUpdateMerchantLogPermissionOnly}
          />
          <CheckBoxInput
            formik={formik}
            label="Verify Phone"
            name="verifyPhone"
            isReadOnly={hasCreateOrUpdateMerchantLogPermissionOnly}
          />
          <CheckBoxInput
            formik={formik}
            label="Verify Email"
            name="verifyEmail"
            isReadOnly={hasCreateOrUpdateMerchantLogPermissionOnly}
          />
          <CheckBoxInput
            formik={formik}
            label="Verify IP"
            name="verifyIp"
            isReadOnly={hasCreateOrUpdateMerchantLogPermissionOnly}
          />
        </div>
      </Collapse>

@@ -638,7 +695,7 @@ const SettingsPanel = (props: SettingsPanelProps) => {
          <FlipSwitch
            className={styles?.flipSwitch}
            label="Send Merged Funding Report"
            checked={formik?.values?.sendMergedFundingReport}
            checked={!!formik?.values?.sendMergedFundingReport}
            name="sendMergedFundingReport"
            isWriteMode={false}
            onChange={() => null}
@@ -646,7 +703,7 @@ const SettingsPanel = (props: SettingsPanelProps) => {
        </Col>
      </Row>

      <Collapse isOpen={formik?.values?.sendMergedFundingReport}>
      <Collapse isOpen={!!formik?.values?.sendMergedFundingReport}>
        <Row className={classNames(styles?.panel__row)}>
          <Col xs={6}>
            <InputField
@@ -708,7 +765,7 @@ const SettingsPanel = (props: SettingsPanelProps) => {
        </Col>
      </Row>

      <Collapse isOpen={formik?.values?.sendAutomatedFundingReport}>
      <Collapse isOpen={!!formik?.values?.sendAutomatedFundingReport}>
        <Row className={classNames(styles?.panel__row)}>
          <Col xs={6}>
            <InputField
 layouts/auth/index.tsx 
+
5
−
5

Visualizado
@@ -25,7 +25,7 @@ import {
import {inject, observer} from 'mobx-react';
import Image from 'next/image';
import {useRouter} from 'next/router';
import React, {useEffect, useMemo, useState} from 'react';
import React, {useEffect, useMemo, useRef, useState} from 'react';

export interface AuthWrapperProps {
  children: React.ReactNode | React.ReactNode[];
@@ -70,7 +70,7 @@ const AuthWrapper = (props: AuthWrapperProps) => {
  const [isMoveContractToSignedModalOpen, setIsMoveContractToSignedModalOpen] =
    useState(false);
  const isShowingAlert = customerStore?.isShowingAlert || false;
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isLoggingOut = useRef(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>(
    customerStore?.quickSearchResults,
  );
@@ -601,10 +601,10 @@ const AuthWrapper = (props: AuthWrapperProps) => {

  const handleLogout = async () => {
    if (typeof window !== 'undefined') {
      if (!isLoggingOut) {
        setIsLoggingOut(true);
      if (!isLoggingOut.current) {
        isLoggingOut.current = true;
        const responseCode = await accountStore?.logout();
        if (typeof router !== 'undefined' && router?.isReady) {
        if (typeof router !== 'undefined') {
          await router?.push('/');
        }
        return responseCode;
 server.js 
+
15
−
1

Visualizado
@@ -43,6 +43,18 @@ hazelcastProto.all = (callback) => {

const MAX_JWT_AGE = 60 * 15; // 15 minutes

const normalizeMerchantDetailstRoute = (routePath) => {
  try {
    const isMerchantDetailsPage = routePath.match(/^\/merchant\/.+/);
    if (isMerchantDetailsPage) {
      return '/merchant';
    }
    return routePath;
  } catch (error) {
    return routePath;
  }
};

const bankAccountNumberMask = (permissions, bankAccountNumber) => {
  if (!bankAccountNumber) {
    return;
@@ -1413,7 +1425,9 @@ app
      const reqMethod = req?.method || '';
      const userPathName =
        req?.headers?.['user-path'] || req?.session?.userPathName;
      const path = userPathName?.replace('/', '');
      const path = normalizeMerchantDetailstRoute(
        userPathName?.replace('/', ''),
      );
      if (
        !reqPath.includes('/uown/') ||
        hasWhitelistedPermission(reqMethod, reqPath)
Comparar
e
 4 arquivos
+
124
−
45
Arquivos
4
Search (e.g. *.vue) (F)

compo
‎nents‎

for
‎mik‎

checkbox-
‎input.tsx‎
+11 -3

merchant-i
‎nfo-panels‎

settin
‎gs.tsx‎
+93 -36

layout
‎s/auth‎

inde
‎x.tsx‎
+5 -5

serv
‎er.js‎
+15 -1

 components/formik/checkbox-input.tsx 
+
11
−
3

Visualizado
@@ -7,6 +7,7 @@ export interface CheckBoxInputProps {
  label?: string;
  isRequired?: boolean;
  isReadOnly?: boolean;
  extendsOnChange?: (newValue: boolean) => void;
  mutuallyExclusiveWith?: string | string[];
}

@@ -18,6 +19,7 @@ export const CheckBoxInput = (props: CheckBoxInputProps) => {
    isRequired = false,
    isReadOnly = false,
    mutuallyExclusiveWith,
    extendsOnChange,
  } = props;

  const currentValue = !!formik?.values?.[name];
@@ -27,9 +29,12 @@ export const CheckBoxInput = (props: CheckBoxInputProps) => {
    if (isReadOnly) return;

    const newValue = !currentValue;
    

    if (!newValue) {
      formik.setFieldValue(name, false);
      if (extendsOnChange) {
        extendsOnChange(newValue);
      }
      return;
    }

@@ -38,7 +43,7 @@ export const CheckBoxInput = (props: CheckBoxInputProps) => {
        ? mutuallyExclusiveWith
        : [mutuallyExclusiveWith];

      others.forEach(field => {
      others.forEach((field) => {
        if (formik.values[field]) {
          formik.setFieldValue(field, false);
        }
@@ -46,6 +51,9 @@ export const CheckBoxInput = (props: CheckBoxInputProps) => {
    }

    formik.setFieldValue(name, true);
    if (extendsOnChange) {
      extendsOnChange(newValue);
    }
  };

  return (
@@ -68,4 +76,4 @@ export const CheckBoxInput = (props: CheckBoxInputProps) => {
      </Label>
    </div>
  );
};
\ No newline at end of file
};
 components/merchant-info-panels/settings.tsx 
+
93
−
36

Visualizado
/* eslint-disable react-hooks/exhaustive-deps */
import {Col, Collapse, Row} from 'reactstrap';
import React, {useEffect, useState} from 'react';
import styles from './index.module.scss';
@@ -18,8 +19,9 @@ import {handleKeyDown} from './merchant-helper';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faChevronDown, faChevronUp} from '@fortawesome/pro-light-svg-icons';
import {IconProp} from '@fortawesome/fontawesome-svg-core';
import { UtilityStore } from '@stores/utility';
import {UtilityStore} from '@stores/utility';
import {inject, observer} from 'mobx-react';
import {FormikProps} from 'formik';

export const TERMINATION_REASONS = [
  '200 - Customer Performance',
@@ -36,15 +38,35 @@ export const TERMINATION_REASONS = [
];

interface SettingsPanelProps {
  formik: any;
  formik: FormikProps<{
    isFraudCheckRequired: boolean;
    useNeustar: boolean;
    useSentilink: boolean;
    verifyPhone: boolean;
    verifyEmail: boolean;
    verifyIp: boolean;
    sendMergedFundingReport: string;
    sendAutomatedFundingReport: boolean;
    mergedFundingReportEmails: Options[];
    fundingReportEmails: Options[];
    isActive: boolean;
    isItemSplit: boolean;
    useWebhook: boolean;
    clientType: string;
    validStates: Options[];
  }>;
  stateOptions: string[];
  hasCreateOrUpdateMerchantLogPermissionOnly: boolean;
  utilityStore: UtilityStore;
}

const SettingsPanel = (props: SettingsPanelProps) => {
  const {formik, stateOptions, hasCreateOrUpdateMerchantLogPermissionOnly, utilityStore} =
    props;
  const {
    formik,
    stateOptions,
    hasCreateOrUpdateMerchantLogPermissionOnly,
    utilityStore,
  } = props;
  const [currentStateOptions, setCurrentStateOptions] = useState([]);
  const [emailInputValue, setEmailInputValue] = useState('');
  const [mergedEmailInputValue, setMergedEmailInputValue] = useState('');
@@ -90,6 +112,31 @@ const SettingsPanel = (props: SettingsPanelProps) => {
    );
  }, []);

  useEffect(() => {
    const isAllVerificationsSettedFalse =
      !formik.values.verifyPhone &&
      !formik.values.verifyEmail &&
      !formik.values.verifyIp;

    const isOneVerificationsSettedTrue =
      formik.values.verifyPhone ||
      formik.values.verifyEmail ||
      formik.values.verifyIp;

    if (isAllVerificationsSettedFalse) {
      formik.setFieldValue('isFraudCheckRequired', false);
      return;
    }

    if (isOneVerificationsSettedTrue) {
      formik.setFieldValue('isFraudCheckRequired', true);
    }
  }, [
    formik.values.verifyPhone,
    formik.values.verifyEmail,
    formik.values.verifyIp,
  ]);

  const isMerchantTypeDisabled =
    formik?.values?.clientType?.includes('PAY_TOMORROW') ||
    isEqual(formik?.values?.clientType, 'TIRE_AGENT');
@@ -105,7 +152,7 @@ const SettingsPanel = (props: SettingsPanelProps) => {
    'merchant',
    'modify_minimum_lease_amount',
  );
  

  return (
    <CollapsableEditLayout title="Settings" isEditable={false}>
      <Row className={styles?.panel__row}>
@@ -148,8 +195,7 @@ const SettingsPanel = (props: SettingsPanelProps) => {
        className={classNames(
          'py-2 px-3 mb-2 d-flex justify-content-between cursor-pointer',
          styles?.panel__title,
        )}
      >
        )}>
        Status
        <div>
          <FontAwesomeIcon icon={handleShowIcon(showStatus)} />
@@ -261,8 +307,7 @@ const SettingsPanel = (props: SettingsPanelProps) => {
        className={classNames(
          'py-2 px-3 mb-2 mt-3 d-flex justify-content-between cursor-pointer',
          styles?.panel__title,
        )}
      >
        )}>
        Fee
        <div>
          <FontAwesomeIcon icon={handleShowIcon(showFee)} />
@@ -297,8 +342,7 @@ const SettingsPanel = (props: SettingsPanelProps) => {
        className={classNames(
          'py-2 px-3 mb-2 mt-3 d-flex justify-content-between cursor-pointer',
          styles?.panel__title,
        )}
      >
        )}>
        Status Change
        <div>
          <FontAwesomeIcon icon={handleShowIcon(showStatusChange)} />
@@ -327,8 +371,7 @@ const SettingsPanel = (props: SettingsPanelProps) => {
        className={classNames(
          'py-2 px-3 mb-2 mt-3 d-flex justify-content-between cursor-pointer',
          styles?.panel__title,
        )}
      >
        )}>
        Others
        <div>
          <FontAwesomeIcon icon={handleShowIcon(showOther)} />
@@ -457,8 +500,7 @@ const SettingsPanel = (props: SettingsPanelProps) => {
        className={classNames(
          'py-2 px-3 mb-2 mt-3 d-flex justify-content-between cursor-pointer',
          styles?.panel__title,
        )}
      >
        )}>
        Fraud
        <div>
          <FontAwesomeIcon icon={handleShowIcon(showFraud)} />
@@ -471,8 +513,41 @@ const SettingsPanel = (props: SettingsPanelProps) => {
            formik={formik}
            label="Is Fraud Check Required"
            name="isFraudCheckRequired"
            mutuallyExclusiveWith="isFraudCheckRequired"
            isReadOnly={hasCreateOrUpdateMerchantLogPermissionOnly}
            extendsOnChange={(newValue: boolean) => {
              if (newValue) {
                formik.setFieldValue('verifyPhone', true);
                formik.setFieldValue('verifyEmail', true);
                formik.setFieldValue('verifyIp', true);
              } else {
                formik.setFieldValue('verifyPhone', false);
                formik.setFieldValue('verifyEmail', false);
                formik.setFieldValue('verifyIp', false);
              }
            }}
          />
          <div className="ml-4">
            <CheckBoxInput
              formik={formik}
              label="Verify Phone"
              name="verifyPhone"
              isReadOnly={hasCreateOrUpdateMerchantLogPermissionOnly}
            />
            <CheckBoxInput
              formik={formik}
              label="Verify Email"
              name="verifyEmail"
              isReadOnly={hasCreateOrUpdateMerchantLogPermissionOnly}
            />
            <CheckBoxInput
              formik={formik}
              label="Verify IP"
              name="verifyIp"
              isReadOnly={hasCreateOrUpdateMerchantLogPermissionOnly}
            />
          </div>

          <CheckBoxInput
            formik={formik}
            label="Use Neustar"
@@ -485,24 +560,6 @@ const SettingsPanel = (props: SettingsPanelProps) => {
            name="useSentilink"
            isReadOnly={hasCreateOrUpdateMerchantLogPermissionOnly}
          />
          <CheckBoxInput
            formik={formik}
            label="Verify Phone"
            name="verifyPhone"
            isReadOnly={hasCreateOrUpdateMerchantLogPermissionOnly}
          />
          <CheckBoxInput
            formik={formik}
            label="Verify Email"
            name="verifyEmail"
            isReadOnly={hasCreateOrUpdateMerchantLogPermissionOnly}
          />
          <CheckBoxInput
            formik={formik}
            label="Verify IP"
            name="verifyIp"
            isReadOnly={hasCreateOrUpdateMerchantLogPermissionOnly}
          />
        </div>
      </Collapse>

@@ -638,7 +695,7 @@ const SettingsPanel = (props: SettingsPanelProps) => {
          <FlipSwitch
            className={styles?.flipSwitch}
            label="Send Merged Funding Report"
            checked={formik?.values?.sendMergedFundingReport}
            checked={!!formik?.values?.sendMergedFundingReport}
            name="sendMergedFundingReport"
            isWriteMode={false}
            onChange={() => null}
@@ -646,7 +703,7 @@ const SettingsPanel = (props: SettingsPanelProps) => {
        </Col>
      </Row>

      <Collapse isOpen={formik?.values?.sendMergedFundingReport}>
      <Collapse isOpen={!!formik?.values?.sendMergedFundingReport}>
        <Row className={classNames(styles?.panel__row)}>
          <Col xs={6}>
            <InputField
@@ -708,7 +765,7 @@ const SettingsPanel = (props: SettingsPanelProps) => {
        </Col>
      </Row>

      <Collapse isOpen={formik?.values?.sendAutomatedFundingReport}>
      <Collapse isOpen={!!formik?.values?.sendAutomatedFundingReport}>
        <Row className={classNames(styles?.panel__row)}>
          <Col xs={6}>
            <InputField
 layouts/auth/index.tsx 
+
5
−
5

Visualizado
@@ -25,7 +25,7 @@ import {
import {inject, observer} from 'mobx-react';
import Image from 'next/image';
import {useRouter} from 'next/router';
import React, {useEffect, useMemo, useState} from 'react';
import React, {useEffect, useMemo, useRef, useState} from 'react';

export interface AuthWrapperProps {
  children: React.ReactNode | React.ReactNode[];
@@ -70,7 +70,7 @@ const AuthWrapper = (props: AuthWrapperProps) => {
  const [isMoveContractToSignedModalOpen, setIsMoveContractToSignedModalOpen] =
    useState(false);
  const isShowingAlert = customerStore?.isShowingAlert || false;
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isLoggingOut = useRef(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>(
    customerStore?.quickSearchResults,
  );
@@ -601,10 +601,10 @@ const AuthWrapper = (props: AuthWrapperProps) => {

  const handleLogout = async () => {
    if (typeof window !== 'undefined') {
      if (!isLoggingOut) {
        setIsLoggingOut(true);
      if (!isLoggingOut.current) {
        isLoggingOut.current = true;
        const responseCode = await accountStore?.logout();
        if (typeof router !== 'undefined' && router?.isReady) {
        if (typeof router !== 'undefined') {
          await router?.push('/');
        }
        return responseCode;
 server.js 
+
15
−
1

Visualizado
@@ -43,6 +43,18 @@ hazelcastProto.all = (callback) => {

const MAX_JWT_AGE = 60 * 15; // 15 minutes

const normalizeMerchantDetailstRoute = (routePath) => {
  try {
    const isMerchantDetailsPage = routePath.match(/^\/merchant\/.+/);
    if (isMerchantDetailsPage) {
      return '/merchant';
    }
    return routePath;
  } catch (error) {
    return routePath;
  }
};

const bankAccountNumberMask = (permissions, bankAccountNumber) => {
  if (!bankAccountNumber) {
    return;
@@ -1413,7 +1425,9 @@ app
      const reqMethod = req?.method || '';
      const userPathName =
        req?.headers?.['user-path'] || req?.session?.userPathName;
      const path = userPathName?.replace('/', '');
      const path = normalizeMerchantDetailstRoute(
        userPathName?.replace('/', ''),
      );
      if (
        !reqPath.includes('/uown/') ||
        hasWhitelistedPermission(reqMethod, reqPath)

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

R7.1.25.43.0_ImproveSeonFraudCheckConfigurationByGroupingRelatedFlags_Ticket1082

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


> ## Tests in qa2
> ```gherkin
> Given I am on the identity verification process for a merchant
>
> ### Scenario Outline: Validate SEON behavior (main and subflags) and logs + DB
> When Filter merchants by Ref Merchant Code "<merchant>"
> 
> And Set setting "Is Fraud Check Required" to true
> Then Verify SEON Fraud Check settings reflect changes
> And Save merchant settings
> Then In database, merchant "<merchant>" has SEON flags
> 
> And Set setting "Is Fraud Check Required" to false
> Then Verify SEON Fraud Check settings reflect changes
> And Save merchant settings
> Then Validate latest merchant log change for field "Is Fraud Check Required" from "true" to "false"
> Then In database, merchant "<merchant>" has SEON flags
> 
> And Set setting "Is Fraud Check Required" to true
> And Set setting "Verify Email" to false
> Then Verify SEON Fraud Check settings reflect changes
> And Save merchant settings
> Then Validate latest merchant log change for field "Verify Email" from "true" to "false"
> Then In database, merchant "<merchant>" has SEON flags
> 
> And Set setting "Is Fraud Check Required" to false
> And Set setting "Verify Phone" to true
> Then Verify SEON Fraud Check settings reflect changes
> And Save merchant settings
> Then Validate latest merchant log change for field "Verify Phone" from "false" to "true"
> Then Validate latest merchant log change for field "Is Fraud Check Required" from "false" to "true"
> Then In database, merchant "<merchant>" has SEON flags
> 
> And Set setting "Is Fraud Check Required" to true
> And Set setting "Verify Phone" to false
> And Set setting "Verify Email" to false
> And Set setting "Verify IP" to false
> Then Verify SEON Fraud Check settings reflect changes
> And Save merchant settings
> Then Validate latest merchant log change for field "Verify IP" from "true" to "false"
> Then Validate latest merchant log change for field "Is Fraud Check Required" from "true" to "false"
> Then In database, merchant "<merchant>" has SEON flags
> | PASS | Merchant: Progress Mobility | 
> ```
>
>

>
>
>

------------------------------------------------------------------------------------------------------------------------------------------------------------------
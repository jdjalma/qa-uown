---------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1197

UOWN | ORIGINATION | Full Rebranding of Application flows (Kornerstone)


Synopsis
The Origination currently includes a two-step application flow:
1. Send Application – the Merchant sends the application to the Customer to complete personal information
2. Complete Application – after pre-approval, the Customer provides banking details, adds additional information, and signs the contract
This entire application flow must be rebranded using Kornerstone colors and logo whenever it belongs to the Kornerstone flow.

Business Objective
Ensure brand consistency and a unified customer experience throughout the Kornerstone application journey, reinforcing brand identity, trust, and professionalism from application submission through contract signing.

Feature Request | Business Requirements
    When the application belongs to the Kornerstone flow:
        The entire application flow must use:
            Kornerstone brand colors
            Kornerstone logo
Rebranding must apply to:
    Send Application screens
    Complete Application screens        
Non-Kornerstone flows should remain unchanged

--kc-green: #8FC31F;
--kc-purple: #86217F;
--kc-gray: #d5d5d5;

test instructions
Both Send Application and Complete Application screens should be fully customized when accessing the page via the kornerstone link, changes include color, icons, text.
The send application page had one new image added be sure it appears as expected.

---------------------------------------------------------------------------------------------------------------------------------------------------------

---

# UOWN | ORIGINATION | Rebranding Completo dos Fluxos de Aplicação (Kornerstone)

## Sinopse

Atualmente, o Origination possui um fluxo de aplicação em duas etapas:

1. **Enviar Aplicação (Send Application)** – o lojista envia a aplicação para o cliente preencher as informações pessoais.
2. **Completar Aplicação (Complete Application)** – após a pré-aprovação, o cliente informa os dados bancários, adiciona informações extras e assina o contrato.

Todo esse fluxo de aplicação deve receber o rebranding com as cores e o logo da **Kornerstone** sempre que a aplicação pertencer ao fluxo Kornerstone.

---

## Objetivo de Negócio

Garantir consistência de marca e uma experiência unificada para o cliente durante toda a jornada de aplicação Kornerstone, reforçando identidade da marca, confiança e profissionalismo — desde o envio da aplicação até a assinatura do contrato.

---

## Solicitação de Funcionalidade | Requisitos de Negócio

### Quando a aplicação pertencer ao fluxo Kornerstone:

Todo o fluxo deve utilizar:

* Cores da marca Kornerstone
* Logo da Kornerstone

O rebranding deve ser aplicado em:

* Telas de **Send Application**
* Telas de **Complete Application**

Fluxos que **não** são Kornerstone devem permanecer inalterados.

---

## Paleta de cores Kornerstone

```css
--kc-green:  #8FC31F;
--kc-purple: #86217F;
--kc-gray:   #d5d5d5;
```

---

## Instruções de Teste

* Tanto as telas de **Send Application** quanto de **Complete Application** devem estar totalmente customizadas ao acessar a página pelo link Kornerstone.
  As mudanças incluem:

  * cores
  * ícones
  * textos

* A página **Send Application** recebeu uma nova imagem — verifique se ela aparece corretamente.

---

---------------------------------------------------------------------------------------------------------------------------------------------------------

Alteracoes dev:



utils/helper.tsx

import {Options} from '@uownleasing/common-ui';
import * as Yup from 'yup';
import {v4 as uuidv4} from 'uuid';
import {FormikProps} from 'formik';
import kountSDK from '@kount/kount-web-client-sdk';

export const dataTableCustomStyles = {
  headCells: {
    style: {
      fontSize: '13px',
      fontWeight: '500',
      background: '#eaeaea',
      color: '#313131',
      fontFamily: 'Gotham-Medium',
    },
  },
  rows: {
    style: {
      fontFamily: 'Gotham-Book',
      fontSize: '13px',
      color: '#313131',
      'padding-top': '5px',
    },
  },
  responsiveWrapper: {
    style: {
      overflow: 'auto',
    },
  },
};

export const convertStringToOptionType = (value: string): Options[] => {
  const arrayValue: string[] = (value && value.split(',')) || [];
  const options: Options[] = arrayValue?.map((state) => {
    const trimmedState = state.trim() || '';
    return {
      label: trimmedState,
      value: trimmedState,
      key: trimmedState,
    };
  });

  return options || [];
};

export const paginationRowsPerPageOptions: number[] = [
  10, 15, 20, 25, 30, 40, 50, 100,
];

export const getURL = (section: string) => {
  let url = '';
  if (section.includes('application')) {
    url = '/uown/getApplicationCountDetails';
  } else if (section.includes('approval')) {
    url = '/uown/getApprovalRateDetails';
  } else if (section.includes('avgApproval')) {
    url = '/uown/getAvgApprovalDetails';
  } else if (section.includes('openApproval')) {
    url = '/uown/getOpenApprovalAmt';
  } else if (section.includes('fundedAmt')) {
    url = '/uown/getFundedAmtDetails';
  } else if (section.includes('signedLease')) {
    url = '/uown/getSignedLeaseApprovals';
  } else if (section.includes('expiringApp')) {
    url = '/uown/getExpiringAppDetails';
  } else if (section.includes('conversion')) {
    url = '/uown/getConversionRate';
  }
  return url;
};

export const statusMapping = {
  NEW: 'Pending',
  PENDING_UW: 'Pending',
  UW_APPROVED: 'Approved',
  UW_DENIED: 'Denied',
  DENIED: 'Denied',
  UW_REVIEW: 'In review',
  UW_ERROR: 'Error',
  ERROR: 'Error',
  OTHER: 'Error',
  PENDING_FRAUD_CHECK: 'Error',
  FRAUD_CHECK_FAILED: 'Error',
  CANCELLED_DUP_SSN: 'Cancelled',
  CANCELLED_DUP_DENIAL: 'Cancelled',
  ORDER_CANCELLED: 'Invoice Cancelled',
  CONTRACT_CREATED: 'Contract Created',
  SIGNED: 'Signed',
  EXPIRED_CONTRACT: 'Contract Expired',
  CANCELLED_CONTRACT: 'Contract Cancelled',
  READY_TO_FUND: 'Ready to Fund',
  FUNDING: 'Funding',
  FUNDED: 'Funded',
  EXPIRED: 'Expired',
  LEASE_MOD_REQUESTED: 'Lease Modification Requested',
  INCOMPLETE: 'Incomplete',
};

export const internalStatusMapping = {
  DELINQUENCY_DENIED: 'Delinquency Denied',
  DELINQUENCY_APPROVED: 'Delinquency Approved',
  FRAUD_DENIED: 'Fraud Denied',
  FRAUD_APPROVED: 'Fraud Approved',
  BLACKLIST_DENIED: 'Blacklist Denied',
  BLACKLIST_APPROVED: 'Blacklist Approved',
  INVOICE_CREATED: 'Invoice Created',
  INVOICE_CANCELLED: 'Invoice Cancelled',
  BANK_VERIFICATION_SUBMITTED: 'Bank Verification Submitted',
  BANK_VERIFICATION_DENIED: 'Bank Verification Denied',
  BANK_VERIFICATION_APPROVED: 'Bank Verification Approved',
  BANK_VERIFICATION_ERROR: 'Bank Verification Error',
  INTELLICHECK_FAILED: 'Intellicheck Failed',
  CC_VALIDATION_FAILED: 'CC Validation Failed',
  CONTRACT_GEN_ERROR: 'Contract Generation Error',
  COMPLETE_APPLICATION_LOADED: 'Complete Application Loaded',
  COMPLETE_ESIGN_LOADED: 'Complete Esign Loaded',
};

export const merchantCategoryMapping = {
  OTHER: 'Other',
  FURNITURE: 'Furniture',
  TIRES: 'Tires',
  // RETAIL: 'Retail', currently not being accepted by BE
  SHED: 'Shed',
  LIVINGROOM: 'Living Room',
  BEDROOM: 'Bedroom',
  DININGROOM: 'Dining room',
  APPLIANCES: 'Appliances',
  ELECTRONICS: 'Electronics',
  TIRE_PARTS: 'Tire Parts',
  AUTOMOTIVES: 'Automotives',
  AUTOMOTIVE_ACCESSORIES: 'Automotive Accessories',
};

export const convertMerchantCategoriesToEnum = (categories) => {
  return categories?.map((category) => {
    for (const [key, value] of Object.entries(merchantCategoryMapping)) {
      if (value?.toLowerCase() === category?.value?.toLowerCase()) {
        return key;
      }
    }
  });
};

export const getStatus = (status: String) => {
  for (const [key, value] of Object.entries(statusMapping)) {
    if (value === status) {
      return key;
    }
  }

  return null;
};

export const padNumber = (numberToPad = 0) => {
  return ('0' + numberToPad).slice(-2);
};

// 57 total including US Territories
export const programStates = {
  AK: 'Alaska',
  AL: 'Alabama',
  AR: 'Arkansas',
  AS: 'American Samoa',
  AZ: 'Arizona',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DC: 'Washington, D.C.',
  DE: 'Delaware',
  FL: 'Florida',
  GA: 'Georgia',
  GU: 'Guam',
  HI: 'Hawaii',
  IA: 'Iowa',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  KS: 'Kansan',
  KY: 'Kentucky',
  LA: 'Louisiana',
  MA: 'Massachusetts',
  MD: 'Maryland',
  ME: 'Maine',
  MI: 'Michigan',
  MN: 'Minnesota',
  MO: 'Missouri',
  MP: 'Northern Mariana Island',
  MS: 'Mississippi',
  MT: 'Montana',
  NC: 'North Carolina',
  ND: 'North Dakota',
  NE: 'Nebraska',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NV: 'Nevada',
  NY: 'New York',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  PR: 'Puerto Rico',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UM: 'United States Minor Outlying Islands',
  UT: 'Utah',
  VA: 'Virginia',
  VI: 'Virgin Islands',
  VT: 'Vermont',
  WA: 'Washington',
  WI: 'Wisconsin',
  WV: 'West Virginia',
  WY: 'Wyoming',
};

export const validationObject = {
  date: Yup.string().matches(
    /(0[1-9]|1[012])[- \/.](0[1-9]|[12][0-9]|3[01])[- \/.](19|20)\d\d/,
    'Invalid Date',
  ),
  email: Yup.string().matches(
    /^[-!#$%&'*+/0-9=?A-Z^_a-z`{|}~](\.?[-!#$%&'*+/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z])+$/,
    'Invalid Email.',
  ),
  card: Yup.string().matches(/^[\d\s]+$/, 'Invalid Card.'),
  phone: Yup.string().matches(
    /^(\+\d{1,2}\s)?\(\d{3}\)[\s ]\d{3}[\s.-]\d{4}$/,
    'Invalid Phone Number.',
  ),
};

export const handleKountSessionID = (
  clientID: string,
  isProd: boolean,
  formik?: FormikProps<any>,
  setKountSessionId?: (kountSessionId: string) => void,
  setSubmitted?: (submitted: boolean) => void,
): string => {
  const sessionID = (uuidv4() || '').replace(/-/g, '');

  const kountConfig = {
    clientID,
    environment: isProd ? 'PROD' : 'TEST',
    isSinglePageApp: true,
    callbacks: {
      'collect-end': (params: {SessionID: string}) => {
        const collectionID = params.SessionID;

        if (formik) {
          formik.setFieldValue('kountSessionId', collectionID);
        }

        if (setKountSessionId) {
          setKountSessionId(collectionID);
        }

        if (setSubmitted) {
          setSubmitted(false);
        }

        console.log('[Kount] Device data collection completed');
      },
    },
  };

  try {
    const sdk = kountSDK(kountConfig, sessionID);
    if (sdk) {
      console.log(`[Kount] SDK initialized (${isProd ? 'PROD' : 'TEST'})`);
      return sdk.sessionID;
    } else {
      console.log('[Kount] SDK did not initialize');
    }
  } catch (error) {
    console.error('[Kount] Failed to initialize SDK', error);
  }

  return sessionID;
};

export const handlePostMessageCheck = (
  redirectUrl: string = '',
  message: string = '',
) => {
  if (redirectUrl && redirectUrl?.includes('postMessage=true')) {
    // eslint-disable-next-line no-console
    console.log(message || 'Success, Message Sent!');
    window?.top?.postMessage('uown_success', '*');
    window?.parent?.postMessage('uown_success', '*');
    window?.postMessage?.('uown_success', '*');
  }
};

export const toTitleCase = (strArray: string[]) => {
  const strArrayExists =
    strArray && strArray.length > 0 && Array.isArray(strArray);
  if (strArrayExists) {
    return strArray.map((str) => {
      const titleCased = str
        .toLowerCase()
        .split(/[_\s]/)
        .map((word) => word.charAt(0).toUpperCase() + word.substring(1))
        .join(' ');

      return titleCased;
    });
  } else {
    return strArray;
  }
};

export const stringMatch = (
  inputString: string,
  stringArray: string[],
): string => {
  const hasStringArray =
    stringArray && stringArray?.length > 0 && Array.isArray(stringArray);
  if (hasStringArray) {
    const parsedString = inputString?.replace(/[^a-zA-Z]/g, '')?.toLowerCase();
    const parsedStringArray = stringArray?.find((str) => {
      const parsedStr = str?.replace(/[^a-zA-Z]/g, '')?.toLowerCase();
      return parsedStr === parsedString;
    });

    return parsedStringArray;
  } else {
    return undefined;
  }
};

export const convertToAPIValue = (value: string) => {
  const apiValue = value?.toUpperCase()?.replaceAll(' ', '_');
  return apiValue || null;
};

export const inIFrame = () => {
  try {
    return window.self !== window.top;
  } catch (ex) {
    console.error('unable to reach top DOM element', ex);
    return true;
  }
};

export const isKornerStone = ({
  info,
  isKornerstoneCustomer,
}: {
  info?: {company?: string} | null;
  isKornerstoneCustomer?: boolean;
} = {}): boolean => {
  const isKornerstoneDomain =
    typeof globalThis !== 'undefined' &&
    globalThis.location.hostname.includes('kornerstone');
  const isKornerstoneCompany = info?.company === 'KORNERSTONE';
  return isKornerstoneDomain || isKornerstoneCompany || !!isKornerstoneCustomer;
};

export const loadKornerstoneTheme = (
  args: {
    accountInfo?: {company?: string} | null;
    isKornerstoneCustomer?: boolean;
  } = {},
): boolean => {
  const enableKornerstone = isKornerStone(args);
  if (enableKornerstone) {
    document.documentElement.dataset.theme = 'ks';
  } else {
    delete document.documentElement.dataset.theme;
  }
  return enableKornerstone;
};

export const decideApplicationUrl = {
  getMissingRequiredFieldsUrl: (
    uuid: string | null,
    shortCode: string | null,
  ) => {
    return shortCode
      ? `/uown/los/missing-fields/${shortCode}`
      : `/uown/los/getMissingRequiredFields/${uuid}`;
  },
  getFinalizeRequiredFieldsUrl: (
    uuid: string | null,
    shortCode: string | null,
  ) => {
    return shortCode
      ? `/uown/los/finalize-fields/${shortCode}`
      : `/uown/los/getFinalizeApplicationFields/${uuid}`;
  },
  getEsignFieldsUrl: (uuid: string | null, shortCode: string | null) => {
    return shortCode
      ? `/uown/los/esign-fields/${shortCode}`
      : `/uown/los/getEsignFields/${uuid}`;
  },
};




pages/payment/index.tsx

import React, {useEffect, useState} from 'react';
import AuthenticatedLayout from '../../layout/authenticated';
import {
  InputField,
  SectionHeader,
  Button,
  AllocationType,
  Options,
  Modal,
} from '@uownleasing/common-ui';
import {
  convertNumberToCurrency,
  convertCurrencyToFloat,
  showToast,
  isEqual,
  formatDate,
  getDate,
} from '@uownleasing/common-utilities';
import {useRouter} from 'next/router';
import {Row, Col, Form} from 'reactstrap';
import {useFormik} from 'formik';
import {inject, observer} from 'mobx-react';
import {CustomerStore} from '@stores/customer';
import {
  makePaymentBankAccountTableColumns,
  makePaymentCreditCardTableColumns,
  dataTableCustomStyles,
} from 'utils/data-table-columns';
import DataTable from 'react-data-table-component';
import * as Yup from 'yup';
import publicIp from 'public-ip';

import {AccountStore} from '@stores/account';
import {UtilityStore} from '@stores/utility';
import classNames from 'classnames';
import styles from './index.module.scss';
import {
  CreditCard,
  BankAccounts,
  MakeCreditCardPaymentRequest,
  ACHPaymentRequestType,
} from '@models';
import {useToggleState} from '@utils/hooks/useToggleState';
import {useAccountStatus} from '@utils/hooks/useAccountStatus';
import {isKornerstone} from '../../utils/helper';

interface PaymentProps {
  accountStore: AccountStore;
  customerStore: CustomerStore;
  utilityStore: UtilityStore;
}

const Payment = (props: PaymentProps) => {
  const {accountStore, customerStore, utilityStore} = props;
  const router = useRouter();

  const accountSummary = customerStore?.accountSummary;
  const pastDueAmount = accountSummary?.pastDueAmount || 0;
  const nextPaymentDueAmount = accountSummary?.nextPaymentDueAmount || 0;
  const payOffAmount = accountSummary?.epoBalance || 0;
  const accountPk = accountStore?.accountPk;
  const contractBalance = accountSummary?.contractBalance;
  const totalPaymentDue = accountSummary?.totalPaymentDue || 0;
  const defaultBank: BankAccounts = customerStore?.bankAccounts?.find(
    (bankAccount) => isEqual(bankAccount?.bankAccountInfo?.autoPay, true),
  );
  const defaultCard = customerStore?.creditCards?.find((creditCard) =>
    isEqual(creditCard?.creditCardInfo?.autoPay, true),
  );
  const selectedPayment = defaultBank ? defaultBank : defaultCard || undefined;
  const [earlyPayoutModal, toggleEarlyPayoutModal] = useToggleState(false);

  const getAllocationType = (allocationType: string = ''): string => {
    const allocationTypes = {
      'Next Payment Due': AllocationType.DEFAULT,
      'Early Payout': AllocationType.EPO_ONLY,
    };

    return allocationType ? allocationTypes?.[allocationType] : null;
  };

  const {isAccountInactive} = useAccountStatus(customerStore?.accountSummary);

  const formik = useFormik({
    initialValues: {
      pastDueAmount: pastDueAmount,
      paymentAmount: 0,
      amountToPaySelector: isEqual(utilityStore?.amountToPaySelector, 'EPO')
        ? 'payOff'
        : 'totalPaymentDue',
      allocationType: 'Next Payment Due',
      paymentDateSelector: 'today',
      paymentDate: '',
      selectedPaymentMethod: selectedPayment,
    },
    validationSchema: Yup.object({
      pastDueAmount: Yup.string(),
      paymentAmount: Yup.number()
        .typeError('You must specify a number for the fee amount.')
        .when('amountToPaySelector', {
          is: 'other',
          then: Yup.number().min(
            5,
            'Payment amount must be greater than $5.00.',
          ),
        }),
      amountToPaySelector: Yup.string(),
      paymentDateSelector: Yup.string(),
      paymentDate: Yup.string(),
      selectedPaymentMethod: Yup.object(),
    }),
    onSubmit: async (values) => {
      const {
        amountToPaySelector,
        paymentDateSelector,
        selectedPaymentMethod,
        allocationType = '',
        paymentAmount,
        paymentDate,
      } = values;
      const formattedAmount = convertCurrencyToFloat(paymentAmount || 0);
      const formattedPaymentDate = formatDate({f: 'api', d: paymentDate || ''});
      const selectedAllocationType = getAllocationType(allocationType);

      let amountToPay = 0;
      if (isEqual(amountToPaySelector, 'other') && paymentAmount) {
        amountToPay = formattedAmount;
      } else if (isEqual(amountToPaySelector, 'paymentDue')) {
        amountToPay = nextPaymentDueAmount;
      } else if (isEqual(amountToPaySelector, 'totalPaymentDue')) {
        amountToPay = totalPaymentDue;
      } else if (isEqual(amountToPaySelector, 'payOff')) {
        amountToPay = payOffAmount;
      } else if (isEqual(amountToPaySelector, 'pastDue')) {
        amountToPay = pastDueAmount;
      }

      let paymentDateSelected = '';
      if (isEqual(paymentDateSelector, 'today')) {
        paymentDateSelected = formatDate({d: getDate(), f: 'api'});
      } else if (isEqual(paymentDateSelector, 'schedule')) {
        paymentDateSelected = formattedPaymentDate;
      }

      if (!amountToPay) {
        showToast('error', 'Please specify an amount to pay.');
      } else if (!(amountToPay === payOffAmount) && amountToPay < 5) {
        showToast('error', 'Payment amount must be greater than $5.00.');
      } else if (!paymentDateSelected) {
        showToast('error', 'Please select a payment date.');
      } else if (
        !(selectedPaymentMethod?.type && selectedPaymentMethod?.number)
      ) {
        showToast('error', 'Please select a payment method.');
      } else if (isAccountInactive) {
        showToast(
          'error',
          'Your account is Paid Out, No payment required at this time.',
        );
      } else if (amountToPay > contractBalance) {
        showToast(
          'error',
          'Please enter an amount less than contract balance.',
        );
      } else if (
        !isEqual(selectedAllocationType, 'EPO_ONLY') &&
        !isEqual(selectedAllocationType, 'DEFAULT')
      ) {
        showToast('error', 'Please specify an allocation type.');
      } else {
        if (selectedPaymentMethod?.type === 'bankAccount') {
          const createOrUpdateACHPaymentRequest: ACHPaymentRequestType = {
            accountPk: accountPk,
            postingDate: formatDate({
              d: paymentDateSelected,
              f: 'api',
            }),
            bankData: {
              bankAccountPk: selectedPaymentMethod?.bankData?.bankAccountPk,
              isAutoPay: selectedPaymentMethod?.bankData?.autoPay,
            },
            bankAccountType: selectedPaymentMethod?.type,
            allocationStrategy: selectedAllocationType,
            amount: amountToPay,
            useBankDataOnFile: true,
          };
          const response = await customerStore.createOrUpdateACHPayment(
            createOrUpdateACHPaymentRequest,
          );
          const {status, message, data} = response;
          if (status === 200 && !message && !data?.error) {
            const messageToDisplay =
              paymentDateSelector && paymentDateSelector === 'today'
                ? 'Payment successful.'
                : 'Payment scheduled successfully.';
            showToast('success', messageToDisplay);
            await router.push('/overview');
          } else {
            showToast(
              'error',
              message || data?.error || 'Unable to submit payment.',
            );
          }
        } else if (selectedPaymentMethod?.type === 'cc') {
          const isCardOnFile = selectedPaymentMethod?.ccInfo?.autoPay || false;
          const makeCreditCardPaymentRequest: MakeCreditCardPaymentRequest = {
            amount: amountToPay,
            postingDate: formatDate({
              d: paymentDateSelected,
              f: 'api',
            }),
            allocationStrategy: selectedAllocationType,
            useCardOnFile: isCardOnFile,
            ipAddress: await publicIp.v4(),
            chargeFee: true,
            ccInfo: isCardOnFile ? undefined : selectedPaymentMethod?.ccInfo,
          };
          const response = await customerStore.makeCreditCardPayment(
            makeCreditCardPaymentRequest,
          );
          const {status, message, data} = response;

          if (status === 200 && !message && !data?.error) {
            const messageToDisplay =
              paymentDateSelector && paymentDateSelector === 'today'
                ? 'Payment successful.'
                : 'Payment scheduled successfully.';
            showToast('success', messageToDisplay);
            await router.push('/overview');
          } else {
            showToast(
              'error',
              message ||
                data?.error ||
                'Unable to make payment. Please try again or contact UOwn support.',
            );
          }
        } else {
          showToast('error', 'Unknown payment method.');
        }
      }
    },
  });

  const loadFinancialInformation = (pk) => {
    utilityStore.setIsLoading(true);

    const promises = [
      customerStore.getCreditCards(pk),
      customerStore.getBankAccounts(pk),
      accountStore.getAnalytics('/payment'),
      customerStore.getConvenienceFee(),
    ];

    Promise.all(promises).then(() => {
      utilityStore.setIsLoading(false);
    });
  };

  useEffect(() => {
    if (accountStore?.accountPk) {
      loadFinancialInformation(accountStore?.accountPk);
    }
  }, [accountStore.accountPk]);

  return (
    <AuthenticatedLayout
      backgroundColor={
        customerStore.isKornerstoneCustomer ? styles.kc_background : ''
      }>
      <MakePaymentForm
        formik={formik}
        bankAccounts={customerStore?.bankAccounts}
        creditCards={customerStore?.creditCards}
        nextPaymentDueAmount={nextPaymentDueAmount}
        payOffAmount={payOffAmount}
        pastDueAmount={pastDueAmount}
        totalPaymentDue={totalPaymentDue}
        isLoading={utilityStore?.isLoading}
        toggleEarlyPayoutModal={toggleEarlyPayoutModal}
        defaultBank={defaultBank}
        defaultCard={defaultCard}
        convenienceFee={customerStore.convenienceFee || '1'}
        isKornerstoneCustomer={customerStore.isKornerstoneCustomer}
        accountInfo={customerStore.accountInfo}
      />
      <Modal
        children={`This payment will be applied to the total balance of the lease, and will not affect your payment due on ${customerStore?.accountSummary?.nextDueDate}. Click APPLY TO EARLY PAYOFF to continue.`}
        hasNoSecondaryOption
        hasFooter
        isOpen={earlyPayoutModal}
        onPrimaryButtonSubmit={toggleEarlyPayoutModal}
        primaryButtonText="Apply To Early Payoff"
        setIsOpen={toggleEarlyPayoutModal}
        title="Notice"
      />
    </AuthenticatedLayout>
  );
};

interface MakePaymentFormProps {
  formik: any;
  bankAccounts: BankAccounts[];
  creditCards: CreditCard[];
  nextPaymentDueAmount: number;
  payOffAmount: number;
  pastDueAmount: number;
  totalPaymentDue: number;
  isLoading: boolean;
  toggleEarlyPayoutModal: () => void;
  defaultBank: BankAccounts;
  defaultCard: CreditCard;
  convenienceFee: string;
  isKornerstoneCustomer: boolean;
  accountInfo?: {company?: string} | null;
}

const MakePaymentForm = (props: MakePaymentFormProps) => {
  const {
    formik,
    bankAccounts,
    creditCards,
    nextPaymentDueAmount,
    payOffAmount,
    pastDueAmount,
    totalPaymentDue,
    isLoading,
    toggleEarlyPayoutModal,
    defaultBank,
    defaultCard,
    convenienceFee,
    isKornerstoneCustomer,
    accountInfo,
  } = props;

  const [currentCcChecked, setCurrentCcChecked] = useState(null);
  const [currentBankChecked, setCurrentBankChecked] = useState(null);

  const router = useRouter();

  const shouldShowConvenienceFeeMessage = () => {
    const isKornerstoneContext = isKornerstone(
      accountInfo,
      isKornerstoneCustomer,
    );
    const selectedMethod = formik.values.selectedPaymentMethod;

    return (
      selectedMethod?.type === 'cc' &&
      (!isKornerstoneContext || selectedMethod?.ccInfo?.ccVendor === 'OMNIFUND')
    );
  };

  const handleOnChange = (row, i: number) => {
    const ccNumber = row?.creditCardInfo?.ccNumber || '';
    const accountNumber = row?.bankAccountInfo?.accountNumber || '';
    if (ccNumber) {
      formik.setFieldValue('selectedPaymentMethod', {
        type: 'cc',
        number: ccNumber,
        ccInfo: row?.creditCardInfo,
      });

      if (
        currentCcChecked === null &&
        !defaultBank &&
        defaultCard &&
        row?.creditCardInfo?.autoPay
      ) {
        setCurrentCcChecked(undefined);
        formik.setFieldValue('selectedPaymentMethod', undefined);
      } else if (currentCcChecked === i) {
        setCurrentCcChecked(undefined);
        formik.setFieldValue('selectedPaymentMethod', undefined);
      } else {
        setCurrentCcChecked(i);
        setCurrentBankChecked(undefined);
      }
    } else if (accountNumber) {
      formik.setFieldValue('selectedPaymentMethod', {
        type: 'bankAccount',
        number: accountNumber,
        bankData: row?.bankAccountInfo,
      });

      if (
        currentBankChecked === null &&
        defaultBank &&
        row?.bankAccountInfo?.autoPay
      ) {
        setCurrentBankChecked(undefined);
        formik.setFieldValue('selectedPaymentMethod', undefined);
      } else if (currentBankChecked === i) {
        setCurrentBankChecked(undefined);
        formik.setFieldValue('selectedPaymentMethod', undefined);
      } else {
        setCurrentBankChecked(i);
        setCurrentCcChecked(undefined);
      }
    } else {
      formik.setFieldValue('selectedPaymentMethod', undefined);
    }
  };

  return (
    <Form
      id="makePaymentForm"
      className={classNames(styles?.paymentContainer, 'm-3 px-2')}
      onSubmit={formik.handleSubmit}>
      <Row className={classNames(styles?.paymentContainer__title, 'my-2')}>
        <SectionHeader title="MAKE A PAYMENT" />
      </Row>

      <Row
        className={classNames(
          styles?.paymentContainer__subContainer,
          'mt-4 px-2 py-4 bg-white',
        )}>
        <Col
          xs={12}
          xl={2}
          className={classNames(
            styles?.paymentContainer__paymentAmount1,
            ' mb-4 mb-xl-0',
          )}>
          1. Payment Amount
        </Col>

        <Col
          xs={12}
          xl={10}
          className={classNames(styles?.paymentContainer__paymentAmount2)}>
          <div className="d-flex flex-row align-items-center pl-3 pl-xl-0">
            <InputField
              formik={formik}
              className="mt-3 pt-1"
              type="radio"
              name="pastDue"
              onChange={() => {
                formik?.setFieldValue('amountToPaySelector', 'pastDue');
              }}
              checked={isEqual(formik?.values?.amountToPaySelector, 'pastDue')}
              isBorderInvisible
              isDisabled={isEqual(pastDueAmount, 0)}
            />
            <div className="d-flex align-self-center ml-2 mb-2">
              <span className="mr-2">Total Past Due:</span>
              {!isNaN(pastDueAmount)
                ? convertNumberToCurrency(pastDueAmount)
                : ''}
            </div>
          </div>

          <div className="d-flex flex-row align-items-center pl-3 pl-xl-0">
            <InputField
              formik={formik}
              className="mt-3 pt-1"
              name="paymentDue"
              onChange={() => {
                formik?.setFieldValue('amountToPaySelector', 'paymentDue');
              }}
              checked={isEqual(
                formik?.values?.amountToPaySelector,
                'paymentDue',
              )}
              type="radio"
              isBorderInvisible
            />
            <div className="d-flex align-self-center ml-2 mb-2">
              <span className="mr-2">Next Payment Due:</span>
              {!isNaN(nextPaymentDueAmount)
                ? convertNumberToCurrency(nextPaymentDueAmount)
                : ''}
            </div>
          </div>

          <div className="d-flex flex-row align-items-center pl-3 pl-xl-0">
            <InputField
              formik={formik}
              className="mt-3 pt-1"
              name="totalPaymentDue"
              onChange={() => {
                formik?.setFieldValue('amountToPaySelector', 'totalPaymentDue');
              }}
              checked={isEqual(
                formik?.values?.amountToPaySelector,
                'totalPaymentDue',
              )}
              type="radio"
              isBorderInvisible
            />
            <div className="d-flex align-self-center ml-2 mb-2">
              <span className="mr-2">Total Payment Due:</span>
              {!isNaN(totalPaymentDue)
                ? convertNumberToCurrency(totalPaymentDue)
                : ''}
            </div>
          </div>

          <div className="d-flex flex-row align-items-center pl-3 pl-xl-0">
            <InputField
              formik={formik}
              className="mt-3 pt-1"
              name="payOff"
              onChange={() => {
                formik?.setFieldValue('amountToPaySelector', 'payOff');
              }}
              checked={isEqual(formik?.values?.amountToPaySelector, 'payOff')}
              type="radio"
              isBorderInvisible
            />
            <div className="d-flex align-self-center ml-2 mb-2">
              <span className="mr-2">Balance if Paid Off Today:</span>
              {!isNaN(payOffAmount)
                ? convertNumberToCurrency(payOffAmount)
                : ''}
            </div>
          </div>

          <div className="d-flex flex-column flex-sm-row align-items-md-center pl-3 pl-xl-0">
            <div
              className={classNames(
                styles?.paymentContainer__other,
                'd-flex align-items-center mr-3',
              )}>
              <InputField
                formik={formik}
                className="mt-3 pt-1"
                name="other"
                onChange={() => {
                  formik?.setFieldValue('amountToPaySelector', 'other');
                }}
                checked={isEqual(formik?.values?.amountToPaySelector, 'other')}
                type="radio"
                isBorderInvisible
              />
              <div className="d-flex align-self-center ml-2 mb-2">Other:</div>
            </div>

            <div
              className={classNames(
                styles?.paymentContainer__paymentAmountInput,
                'd-flex justify-content-start align-items-end py-1',
              )}>
              <InputField
                formik={formik}
                name="paymentAmount"
                onChange={(e) => {
                  formik?.setFieldValue('paymentAmount', e);
                }}
                type="currency"
                isDisabled={
                  !isEqual(formik.values.amountToPaySelector, 'other')
                }
              />

              <div
                className={classNames(
                  styles?.paymentContainer__minAmount,
                  'ml-2',
                )}>
                (Min. $5.00)
              </div>
            </div>
          </div>

          <div className="d-flex flex-row align-items-center mt-4 ml-2 pl-3 pl-xl-0">
            <div className="d-flex align-self-center justify-self-center mr-3 mb-2">
              Apply Payment To:
            </div>
            <InputField
              formik={formik}
              type="select"
              name="allocationType"
              placeholder="Choose an Allocation Type..."
              options={['Next Payment Due', 'Early Payout']}
              onChange={(allocationType: Options) => {
                const selectedType = allocationType?.value;
                formik?.setFieldValue('allocationType', selectedType);

                selectedType === 'Early Payout' && toggleEarlyPayoutModal();
              }}
            />
          </div>
        </Col>
      </Row>

      <Row
        className={classNames(
          styles?.paymentContainer__subContainer,
          'mt-4 px-2 py-4 bg-white',
        )}>
        <Col
          xs={12}
          xl={2}
          className={classNames(
            styles?.paymentContainer__paymentDate1,
            'mb-4 mb-xl-0',
          )}>
          2. Payment Date
        </Col>
        <Col
          xs={12}
          xl={10}
          className={classNames(styles?.paymentContainer__paymentDate2)}>
          <div className="d-flex flex-row align-items-center pl-3 pl-xl-0">
            <InputField
              formik={formik}
              className="mt-3 pt-1"
              name="today"
              type="radio"
              onChange={() => {
                formik?.setFieldValue('paymentDateSelector', 'today');
              }}
              checked={isEqual(formik?.values?.paymentDateSelector, 'today')}
              isBorderInvisible
            />
            <div className="d-flex align-self-center ml-2 mb-2">
              Make a Payment Today
            </div>
          </div>

          <div className="d-flex flex-row align-items-sm-center pl-3 pl-xl-0">
            <InputField
              className="mt-3 pt-1"
              formik={formik}
              name="schedule"
              type="radio"
              onChange={() => {
                formik?.setFieldValue('paymentDateSelector', 'schedule');
              }}
              checked={isEqual(formik?.values?.paymentDateSelector, 'schedule')}
              isBorderInvisible
            />

            <div className="d-flex flex-column flex-sm-row justify-content-start align-items-center ml-2">
              <div
                className={classNames(
                  styles?.paymentContainer__schedulePayment,
                  'mr-3 mb-2',
                )}>
                Schedule a Payment:
              </div>
              <InputField
                className="py-1"
                formik={formik}
                name="paymentDate"
                type="date"
                isDisabled={
                  !isEqual(formik.values.paymentDateSelector, 'schedule')
                }
                min={formatDate({
                  d: getDate(),
                  f: 'user',
                })}
              />
            </div>
          </div>
        </Col>
      </Row>

      <Row
        className={classNames(
          styles?.paymentContainer__subContainer,
          'mt-4 px-2 py-4 bg-white',
        )}>
        <Col
          className={classNames(
            styles?.paymentContainer__paymentMethod,
            'mb-4 mb-xl-3',
          )}>
          3. Payment Method
        </Col>

        {(bankAccounts || creditCards) && (
          <div className="mt-2 px-3 w-100">
            <div
              className={classNames(
                styles?.paymentContainer__dataTable,
                'w-100 ',
              )}>
              <DataTable
                columns={makePaymentBankAccountTableColumns(
                  handleOnChange,
                  currentBankChecked,
                )}
                data={bankAccounts || ['']}
                defaultSortFieldId="bankAccountInfo.accountNumber"
                defaultSortAsc={false}
                customStyles={dataTableCustomStyles}
              />
            </div>

            <div className="my-3">
              <Button
                className={
                  isKornerstoneCustomer ? styles.kc_secondary_button : ''
                }
                onClick={() => router.push('/manage-payment-methods')}
                buttonStyle="secondary">
                Manage Bank Account
              </Button>
            </div>
            <div
              className={classNames(
                styles?.paymentContainer__dataTable,
                'w-100 ',
              )}>
              <DataTable
                columns={makePaymentCreditCardTableColumns(
                  handleOnChange,
                  currentCcChecked,
                  !defaultBank && !!defaultCard,
                )}
                data={creditCards || ['']}
                defaultSortFieldId="creditCardInfo.ccNumber"
                defaultSortAsc={false}
                customStyles={dataTableCustomStyles}
              />
            </div>

            <div className="my-3">
              <Button
                className={
                  isKornerstoneCustomer ? styles.kc_secondary_button : ''
                }
                buttonStyle="secondary"
                onClick={() => router.push('/manage-payment-methods')}>
                Add a Card
              </Button>
            </div>
          </div>
        )}
      </Row>

      {shouldShowConvenienceFeeMessage() && (
        <Row className={classNames(styles?.loadedContainer__infoText, 'my-2')}>
          ${convenienceFee} Convenience Fee charged by processor on all Debit or
          Credit Card Payments. ACH payments are not subject to the fee. If you
          would like to switch your payment method to ACH, please&nbsp;
          <a
            href="/manage-payment-methods"
            style={{color: '#007bff', textDecoration: 'underline'}}>
            click here
          </a>
          .
        </Row>
      )}

      <Row className="mt-4">
        <Button
          className={classNames(
            isKornerstoneCustomer
              ? styles.kc_primary_button
              : styles?.submitBtn,
            'py-2 px-5',
          )}
          buttonStyle="primary"
          onClick={() => {
            formik.handleSubmit();
          }}
          disabled={isLoading || !formik?.values?.selectedPaymentMethod}>
          MAKE A PAYMENT
        </Button>
      </Row>
    </Form>
  );
};

export default inject(
  'accountStore',
  'customerStore',
  'utilityStore',
)(observer(Payment));






pages/contact/index.tsx

import React, {useEffect} from 'react';
import AuthenticatedLayout from '../../layout/authenticated';
import {Form, Row, Col, Input} from 'reactstrap';
import {Button, SectionHeader} from '@uownleasing/common-ui';
import {useFormik} from 'formik';
import * as Yup from 'yup';
import {CustomerStore} from '@stores/customer';
import EMAIl from '../../api/email';
import {inject, observer} from 'mobx-react';
import {useRouter} from 'next/router';
import {showToast} from '@uownleasing/common-utilities';
import classNames from 'classnames';
import styles from './index.module.scss';
import {AccountStore} from '@stores/account';
import {KornerstoneContactUs} from 'components/kornerstone/contactUs';
import {getContactPhoneNumber} from '../../utils/helper';

interface ContactProps {
  accountStore: AccountStore;
  customerStore: CustomerStore;
}

const Contact = (props: ContactProps) => {
  const {accountStore, customerStore} = props;

  const router = useRouter();

  const customerName = customerStore?.accountSummary?.customerFullName || '';

  const primaryEmailObject =
    customerStore?.primaryCustomerContactInfo?.emailList.find(
      (email) => (email?.emailInfo?.emailType || '') === 'PRIMARY',
    );
  const primaryEmail = primaryEmailObject?.emailInfo.emailAddress || '';

  const primaryPhoneObject =
    customerStore?.primaryCustomerContactInfo?.phoneList &&
    customerStore?.primaryCustomerContactInfo?.phoneList[0] &&
    customerStore?.primaryCustomerContactInfo?.phoneList[0].phoneInfo;
  const primaryPhoneNumber =
    primaryPhoneObject?.areaCode + primaryPhoneObject?.phoneNumber || '';

  const accountNumber = customerStore?.rootStore?.accountStore?.accountPk || '';

  const contactPhoneNumber = getContactPhoneNumber(
    customerStore?.accountInfo,
    customerStore?.isKornerstoneCustomer,
  );
  const digitsOnly = contactPhoneNumber.replace(/\D/g, '');
  const telLink = `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(
    3,
    6,
  )}-${digitsOnly.slice(6)}`;

  useEffect(() => {
    accountStore.getAnalytics('/contact');
    customerStore.getEmailCategories();
  }, []);

  const formik = useFormik({
    initialValues: {
      customerName: customerName,
      primaryEmail: primaryEmail,
      primaryPhoneNumber: primaryPhoneNumber,
      accountNumber: accountNumber,
      message: '',
      category: '',
    },
    validationSchema: Yup.object({
      message: Yup.string().required('Issue description is required.'),
      category: Yup.string()
        .required('Category is required.')
        .notOneOf([''], 'Please select a category.'),
    }),
    onSubmit: (values, {resetForm}) => {
      const selectedCategory = customerStore.emailCategories.find(
        (c) => c.value === values.category,
      );

      const company = customerStore.accountInfo?.company || 'UOWN';
      const data: any = Object.assign({}, values);
      data.subject = `[${company}] - ${selectedCategory.label} - ${values.accountNumber} - ${values.customerName}`;
      data.to = selectedCategory.to;

      const userToken = accountStore?.userToken;
      const errorMessage =
        'Unable to submit your support ticket. Please try again or call uown directly for support.';

      EMAIl.send(data, userToken)
        .then(async (res) => {
          try {
            const responseData = await res.json();
            if (res.ok && responseData.success) {
              showToast(
                'success',
                'Successfully submitted your support ticket.',
              );
              resetForm();
            } else {
              showToast('error', responseData.message || errorMessage);
            }
          } catch (error) {
            showToast('error', errorMessage);
          }
        })
        .catch(() => {
          showToast('error', errorMessage);
        });
    },
    validateOnBlur: false,
  });

  if (customerStore.isKornerstoneCustomer)
    return (
      <AuthenticatedLayout className={styles.kc_background}>
        <div className={classNames(styles?.contactContainer, 'p-3 mx-2')}>
          <KornerstoneContactUs
            customerStore={customerStore}
            formik={formik}
            router={router}
          />
        </div>
      </AuthenticatedLayout>
    );

  return (
    <AuthenticatedLayout backgroundColor="background-white">
      <div className={classNames(styles?.contactContainer, 'p-3 mx-2')}>
        <Form id="contactForm" onSubmit={formik.handleSubmit}>
          <Row className={classNames(styles?.contactContainer__title)}>
            <SectionHeader title="CONTACT US" />
          </Row>
          <Row className={classNames(styles?.contactContainer__text, 'my-2')}>
            Experiencing an issue with your current lease? To help you better,
            please choose the area that best describes your issue.
          </Row>
          <Row
            className={classNames(
              styles?.contactContainer__subContainer,
              'my-3',
            )}>
            <Col className="p-2">
              <div
                className={classNames(
                  styles?.contactContainer__generalInquiriesLabel,
                  'm-2',
                )}>
                For General Inquiries
              </div>
              <div className="m-2">
                Call
                <Button className="px-0 mx-1" buttonStyle="secondary" noBorder>
                  <a href={`tel:+1-${telLink}`}>{contactPhoneNumber}</a>
                </Button>
              </div>
            </Col>
          </Row>
          <Row
            className={classNames(
              styles?.contactContainer__subContainer,
              'my-3',
            )}>
            <Col className="p-2">
              <Row
                className={classNames(
                  styles?.contactContainer__createSupportTicket,
                  'mx-2',
                )}>
                Create a Support Ticket
              </Row>
              <Row className="my-2 mx-2">
                <Col xs={12} lg={7} className="px-0">
                  <Input
                    type="select"
                    name="category"
                    id="category"
                    value={formik.values.category}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="form-control">
                    <option value="">Select a category</option>
                    {customerStore.emailCategories.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Input>
                  {formik.submitCount > 0 && formik.errors.category && (
                    <div className={styles.contactContainer__inlineError}>
                      {formik.errors.category}
                    </div>
                  )}
                </Col>
              </Row>
              <Row className="mx-2 my-3">Brief Description of the Issue</Row>
              <Row className="my-2 mx-2">
                <Col xs={12} lg={7} className="px-0">
                  <Input
                    type="textarea"
                    name="message"
                    value={formik.values.message}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  {formik.touched.message && formik.errors.message ? (
                    <div
                      className={classNames(
                        styles?.contactContainer__inlineError,
                      )}>
                      {formik.errors.message}
                    </div>
                  ) : null}
                </Col>
              </Row>
              <div className="d-flex p-2 align-items-center flex-column flex-sm-row">
                <div>
                  <Button
                    className={classNames(
                      styles?.contactContainer__submitTicket,
                    )}
                    buttonStyle="primary"
                    type="submit">
                    SUBMIT TICKET
                  </Button>
                </div>
                <div className="mx-3 my-3">
                  <Button
                    className={classNames()}
                    buttonStyle="secondary"
                    onClick={() => router.push('/overview')}>
                    Cancel
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        </Form>
      </div>
    </AuthenticatedLayout>
  );
};

export default inject('accountStore', 'customerStore')(observer(Contact));








components/kornerstone/contactUs/index.tsx

import React from 'react';
import {Button, SectionHeader} from '@uownleasing/common-ui';
import classNames from 'classnames';
import {Col, Form, Input, Row} from 'reactstrap';
import styles from './index.module.scss';
import {FormikValues} from 'formik';
import {CustomerStore} from '@stores/customer';
import {NextRouter} from 'next/router';
import {getContactPhoneNumber} from '../../../utils/helper';

interface Props {
  customerStore: CustomerStore;
  formik: FormikValues;
  router: NextRouter;
}

export const KornerstoneContactUs = ({
  formik,
  customerStore,
  router,
}: Props) => {
  const contactPhoneNumber = getContactPhoneNumber(
    customerStore?.accountInfo,
    customerStore?.isKornerstoneCustomer,
  );
  const digitsOnly = contactPhoneNumber.replace(/\D/g, '');
  const telLink = `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(
    3,
    6,
  )}-${digitsOnly.slice(6)}`;

  return (
    <div className={styles.container}>
      <Form id="contactForm" onSubmit={formik.handleSubmit}>
        <Row className={classNames(styles?.title)}>
          <SectionHeader title="CONTACT US" />
        </Row>
        <Row className={classNames(styles?.text, 'my-2')}>
          Experiencing an issue with your current lease? To help you better,
          please choose the area that best describes your issue.
        </Row>
        <Row className={classNames(styles?.subContainer, 'my-3 bg-white')}>
          <Col className="p-2">
            <div className={classNames(styles?.generalInquiriesLabel, 'm-2')}>
              For General Inquiries
            </div>
            <div className={styles.phoneNumberContainer}>
              Call:
              <Button className="px-0 mx-1" buttonStyle="secondary" noBorder>
                <a href={`tel:+1-${telLink}`}>{contactPhoneNumber}</a>
              </Button>
            </div>
          </Col>
        </Row>
        <Row
          className={classNames(
            styles?.contactContainer__subContainer,
            styles?.kc_styles,
            'my-3 bg-white',
          )}>
          <Col className="p-2">
            <Row
              className={classNames(
                styles?.contactContainer__createSupportTicket,
                'mx-2',
              )}>
              Create a Support Ticket
            </Row>
            <Row className="my-2 mx-2">
              <Col xs={12} lg={7} className="px-0">
                <Input
                  type="select"
                  name="category"
                  id="category"
                  value={formik.values.category}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="form-control">
                  <option value="">Select a category</option>
                  {customerStore.emailCategories.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Input>
                {formik.submitCount > 0 && formik.errors.category && (
                  <div className={styles?.inputErrorMessage}>
                    {formik.errors.category}
                  </div>
                )}
              </Col>
            </Row>
            <Row className="mx-2 my-3">Brief Description of the Issue</Row>
            <Row className="my-2 mx-2">
              <Col xs={12} lg={7} className="px-0">
                <Input
                  type="textarea"
                  name="message"
                  value={formik.values.message}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.message && formik.errors.message ? (
                  <div className={styles?.inputErrorMessage}>
                    {formik.errors.message}
                  </div>
                ) : null}
              </Col>
            </Row>
            <div className="d-flex p-2 align-items-center flex-column flex-sm-row">
              <div>
                <Button
                  className={classNames(styles?.contactContainer__submitTicket)}
                  buttonStyle="primary"
                  type="submit">
                  SUBMIT TICKET
                </Button>
              </div>
              <div className="mx-3 my-3">
                <Button
                  className={classNames()}
                  buttonStyle="secondary"
                  onClick={() => router.push('/overview')}>
                  Cancel
                </Button>
              </div>
            </div>
          </Col>
        </Row>
      </Form>
    </div>
  );
};





components/item-split/index.tsx

import React from 'react';
import {UtilityStore} from '@stores/utility';
import styles from './index.module.scss';
import classNames from 'classnames';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faInfoCircle} from '@fortawesome/free-solid-svg-icons';
import {Button, FilterTable} from '@uownleasing/common-ui';
import {itemSplitColumns} from '@utils/data-table-columns';
import {dataTableCustomStyles} from '@utils/helper';
import {filter} from 'lodash';
import {
  showToast,
  convertNumberToCurrency,
} from '@uownleasing/common-utilities';
import {ItemPaymentSummary} from '@models';
import {ProjectConfig} from '@config/project-config';

interface ItemSplitProps {
  utilityStore: UtilityStore;
  itemPaymentSummary: ItemPaymentSummary;
  config: ProjectConfig;
}

const ItemSplit = (props: ItemSplitProps) => {
  const {utilityStore, itemPaymentSummary, config} = props;
  return (
    <div
      className={classNames(
        'd-flex flex-column p-5 w-100 vh-100',
        styles?.container,
      )}>
      <div className="d-flex align-items-center mb-5">
        <FontAwesomeIcon
          icon={faInfoCircle}
          size="2x"
          className={classNames('mr-2', styles?.icon)}
        />
        <span className={styles?.bold}>
          Thank you for selecting {config.fullName} to provide you with a simple
          lease to own payment program to complete your purchase.
        </span>
      </div>

      <div>
        <span className={styles?.bold}>
          Your payment details are shown below:
        </span>
        <div className="pt-2">
          Total lease amount:{' '}
          <span className={styles?.bold}>
            {convertNumberToCurrency(itemPaymentSummary?.leaseAmount)}
          </span>
        </div>
        <div className="pt-2">
          Approved amount:{' '}
          <span className={styles?.bold}>
            {convertNumberToCurrency(itemPaymentSummary?.approvalAmount)}
          </span>
        </div>
        <div className="pt-2">
          Minimum amount you need to pay to finalize the application:{' '}
          <span className={styles?.bold}>
            {convertNumberToCurrency(itemPaymentSummary?.purchaseNowAmount)}*
          </span>
        </div>

        <div className={classNames('pt-4', styles?.salesTax)}>
          *Purchase total includes sales tax
        </div>
      </div>

      <div className="mt-5">
        <p className={classNames('mb-0', styles?.bold)}>Items On Lease:</p>
        <div className="border">
          <FilterTable
            columns={itemSplitColumns()}
            customStyles={dataTableCustomStyles}
            data={itemPaymentSummary?.itemsOnLease}
          />
        </div>

        <p className={classNames('pt-5 mb-0', styles?.bold)}>
          Items To Purchase:
        </p>
        <div className="border">
          <FilterTable
            columns={itemSplitColumns()}
            customStyles={dataTableCustomStyles}
            data={itemPaymentSummary?.itemsToPurchase}
          />
        </div>
      </div>

      <div className="d-flex mt-5">
        <Button
          buttonStyle="primary"
          type="submit"
          onClick={() => {
            utilityStore?.setMissingFields(
              filter(
                utilityStore?.missingFields,
                (field) => field !== 'purchaseNowItem',
              ),
            );
          }}>
          Confirm
        </Button>
        <Button
          className="ml-3"
          buttonStyle="secondary"
          type="submit"
          onClick={() => {
            showToast(
              'error',
              'Your item total exceeds the approved credit limit. Please modify your cart items if you wish to proceed without purchasing any items.',
            );
          }}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default ItemSplit;



components/missing-data-panel/index.module.scss

.missingDataPanel {
  font-family: var(--regular-font);
  background: var(--hover-color);

  &__header {
    font-size: 14px;
  }

  &__agreement {
    font-size: 14px;
    font-family: var(--bold-font) !important;
  }

  &__icon {
    color: var(--secondary) !important;
  }

  &__feeAmount {
    font-family: var(--bold-font);
  }

  &__submitButton {
    background: var(--primary);
    color: var(--white);
    font-size: 14px;
    width: 200px;
    height: 45px;
    border: 0;
    border-radius: 0;

    &:is(:hover, :active, :focus, :not(:disabled):not(.disabled):active, :disabled) {
      background: var(--primary-selected);
      border-color: var(--primary-selected);
    }

    &:is(:focus, :not(:disabled):not(.disabled):active:focus, :disabled) {
      box-shadow: 0 0 0 0.2rem var(--primary-selected);
    }
  }

  .welcomeMessageBody {
    margin-bottom: 0.5rem;
  }
}




components/missing-data-panel/index.tsx

import * as Yup from 'yup';
import {FormikProps, useFormik} from 'formik';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faInfoCircle} from '@fortawesome/free-solid-svg-icons';
import {Col, Row} from 'reactstrap';
import MissingDataForm from '../missing-data-form';
import classNames from 'classnames';
import {Button} from 'react-bootstrap';
import React, {useEffect, useRef, useState} from 'react';
import {toast} from 'react-toastify';
import {
  isNumber,
  convertNumberToCurrency,
  getCreditCardType,
  showToast,
  formatDate,
  getDate,
} from '@uownleasing/common-utilities';
import {ResponseType} from '@uownleasing/common-ui';
import styles from './index.module.scss';
import {UtilityStore} from '@stores/utility';
import {ItemPaymentSummary} from '@models';
import {ProjectConfig} from '@config/project-config';

interface MissingDataPanelProps {
  achDiscount: number;
  missingFields: string[];
  authorizeCreditCard?: (
    ccNumber: string,
    ccExp: string,
    cvc: string,
    ccFirstName: string,
    ccLastName: string,
    kountSessionId: string,
  ) => Promise<ResponseType>;
  feeToBeCharged: number;
  securityDeposit: number;
  submitApplication: (any) => Promise<ResponseType | void>;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  firstPayDate: string;
  utilityStore: UtilityStore;
  isMissingPayDates: boolean;
  handleKountSessionID: (
    formik: FormikProps<any>,
    setSubmitted?: (submitted: boolean) => void,
  ) => string;
  itemPaymentSummary: ItemPaymentSummary;
  signingFeeExists: boolean;
  leadPk: number;
  optionalAchText: string[];
  NID: string;
  merchantRefCode: string;
  isFinalizeApplicationPage?: boolean;
  welcomeMessageTitle?: string;
  welcomeMessageBody?: string;
  config: ProjectConfig;
}

const MissingDataPanel = (props: MissingDataPanelProps) => {
  const {
    achDiscount,
    missingFields = [],
    submitApplication,
    feeToBeCharged,
    securityDeposit,
    authorizeCreditCard,
    isLoading,
    setIsLoading,
    firstPayDate,
    utilityStore,
    isMissingPayDates,
    handleKountSessionID,
    itemPaymentSummary,
    signingFeeExists,
    leadPk,
    optionalAchText,
    NID,
    merchantRefCode,
    isFinalizeApplicationPage,
    welcomeMessageBody,
    welcomeMessageTitle,
    config,
  } = props;

  const [isVerifyBankAccount, setIsVerifyBankAccount] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isFeeToBeCharged = feeToBeCharged && feeToBeCharged > 0;
  const isSecurityDepositToBeCharged = securityDeposit && securityDeposit > 0;

  const achFields = [
    'bankAccountCustomerFirstName',
    'bankAccountCustomerLastName',
    'bankAccountType',
    'bankAccountNumber',
    'bankRoutingNumber',
    'achReEnterAccountNumber',
  ];
  const ccFields = [
    'ccFirstName',
    'ccLastName',
    'ccType',
    'ccValue',
    'ccExpMonth',
    'ccExpYear',
    'cvc',
  ];

  const initialValues: any = {};
  const validationSchema: any = {};

  const filteredMissingFields = [];

  if (missingFields.includes('ccInfo')) {
    filteredMissingFields.push('ccInfo');
  }
  if (missingFields.includes('bankAccountInfo')) {
    filteredMissingFields.push('bankAccountInfo');
  }
  missingFields.forEach((field) => {
    if (
      field !== 'achAutoPay' &&
      field !== 'ccAutoPay' &&
      field !== 'bankAccountInfo' &&
      field !== 'ccInfo'
    ) {
      filteredMissingFields.push(field);
    }
  });

  const isFirstPaymentDateMissing = missingFields?.includes('firstPaymentDate');

  filteredMissingFields.forEach((missingField) => {
    const fieldName = missingField || '';
    if (fieldName === 'bankAccountInfo') {
      achFields.forEach((newField) => {
        initialValues[newField] = '';
        const fieldType = newField.toLowerCase().includes('number')
          ? 'number'
          : 'string';
        const fieldTypeError =
          fieldType === 'string'
            ? 'This field must only contain letters.'
            : 'This field must only contain numbers.';

        const isNumberType = fieldType === 'number';
        let yupType = isNumberType
          ? Yup.string().matches(/^\d+$/, fieldTypeError)
          : Yup.string().matches(/^[a-zA-Z]+$/, fieldTypeError);

        if (
          newField === 'bankAccountCustomerFirstName' ||
          newField === 'bankAccountCustomerLastName'
        ) {
          yupType = Yup.string().matches(
            /^\s*[A-Za-z]+(?: [A-Za-z]+)*\s*$/,
            fieldTypeError,
          );
        }

        const isAccountNum = newField?.toLowerCase()?.includes('accountnumber');

        const minNum = isAccountNum ? 5 : 9;
        const minMessage = isAccountNum
          ? 'Account number must be at least 5 digits long'
          : 'Routing number must be 9 digits long';

        validationSchema[newField] = Yup.string().when({
          is: () => isFirstPaymentDateMissing,
          then: isNumberType
            ? Yup.string()
                .required('Field is required')
                .matches(/^\d+$/, 'Must be only digits')
                .min(minNum, minMessage)
            : Yup.string().required('Field is required'),
          otherwise: yupType,
        });
      });
    } else if (fieldName === 'ccInfo') {
      ccFields.forEach((newField) => {
        initialValues[newField] = '';

        const fieldType =
          newField.toLowerCase().includes('number') ||
          newField.toLowerCase().includes('value') ||
          newField === 'cvc' ||
          newField.includes('Exp')
            ? 'number'
            : 'string';

        let fieldTypeError =
          fieldType === 'string'
            ? 'This field must only contain letters.'
            : 'This field must only contain numbers.';

        if (newField === 'cvc') {
          validationSchema[newField] = Yup.string()
            .required('Credit/Debit Card Info Required')
            .typeError(fieldTypeError)
            .matches(
              /^(?!000$)(?!999$)\d{3,4}$/,
              'Please enter a valid CVC/CVV.',
            );
        } else if (fieldType === 'number') {
          validationSchema[newField] = Yup.number()
            .required('Credit/Debit Card Info Required')
            .typeError(fieldTypeError);
        } else {
          validationSchema[newField] = Yup.string()
            .required('Credit/Debit Card Info Required')
            .matches(/^[a-zA-Z\s]+$/, fieldTypeError);
        }
      });
    } else if (fieldName === 'firstPaymentDate') {
      initialValues[fieldName] = formatDate({
        f: 'user',
        d: firstPayDate || getDate(),
      });
      validationSchema[fieldName] = Yup.string().required('Field is required');
    } else {
      validationSchema[fieldName] = Yup.string().required('Field is required');
      initialValues[fieldName] = '';
    }
  });

  const hasNoMissingFields = (filteredMissingFields || []).length === 0;

  const formik = useFormik({
    initialValues: initialValues,
    validationSchema: Yup.object().shape(
      hasNoMissingFields ? {} : validationSchema,
    ),
    onSubmit: async (values, {setSubmitting}) => {
      setSubmitting(true);
      toast.dismiss();

      const request: any = {
        desiredPaymentFrequency:
          utilityStore?.selectedPaymentFrequency ||
          values?.payFrequency ||
          null,
        appUuid: '',
        neuroIdentity: String(leadPk) || null,
        neuroSiteId: NID,
        referenceId: sessionStorage.getItem('seonReferenceId') || '',
      };

      const {
        bankAccountCustomerFirstName,
        bankAccountCustomerLastName,
        bankAccountType,
        bankAccountNumber,
        bankRoutingNumber,
        achReEnterAccountNumber,
        firstPaymentDate,
      } = values;
      const {
        ccFirstName,
        ccLastName,
        ccType,
        ccValue,
        ccExpMonth,
        ccExpYear,
        cvc,
        kountSessionId = '',
      } = values;

      const isAchDataEnteredInForm =
        bankAccountCustomerFirstName ||
        bankAccountCustomerLastName ||
        bankAccountType ||
        bankAccountNumber ||
        bankRoutingNumber ||
        achReEnterAccountNumber;
      const isAllAchDataEntered =
        bankAccountCustomerFirstName &&
        bankAccountCustomerLastName &&
        bankAccountType &&
        bankAccountNumber &&
        bankRoutingNumber &&
        achReEnterAccountNumber;
      const isCcDataEnteredInForm =
        ccFirstName || ccLastName || ccValue || ccExpMonth || ccExpYear || cvc;
      const isAllCcDataEntered =
        ccFirstName &&
        ccLastName &&
        ccType &&
        ccValue &&
        ccExpMonth &&
        ccExpYear &&
        cvc;

      const shouldAchErrorBeShown =
        utilityStore?.isBankVerificationRequired &&
        isAchDataEnteredInForm &&
        !isAllAchDataEntered &&
        !(filteredMissingFields || []).includes('ccInfo');
      const shouldCcErrorBeShown =
        (filteredMissingFields || []).includes('ccInfo') &&
        isCcDataEnteredInForm &&
        !isAllCcDataEntered;

      const valueFieldNames = Object.keys(values) || [];

      if (isCcDataEnteredInForm) {
        request.ccInfo = {};
        request.ccInfo.kountSessionId = kountSessionId || '';
      }

      const valueFieldNamesFiltered = valueFieldNames.filter(
        (value) =>
          value !== 'ccInfo' &&
          value !== 'ccExpMonth' &&
          value !== 'ccExpYear' &&
          value !== 'achReEnterAccountNumber',
      );

      valueFieldNamesFiltered?.map((key) => {
        const value = values[key] || '';
        if (!value) {
          return;
        } else if (ccFields?.includes(key) && request?.ccInfo) {
          request.ccInfo[key] = value;
        } else {
          request[key] = value;
        }
      });

      if (values?.bankAccountNumber) {
        request.achAutoPay = true;
      }
      if (firstPaymentDate) {
        request.firstPaymentDate = formatDate({
          f: 'api',
          d: firstPaymentDate,
        });
      }
      if (values?.nextPayDate) {
        request.nextPayDate = formatDate({f: 'api', d: values?.nextPayDate});
      }

      const ccExp =
        (values?.ccExpMonth || '') + '/' + (values?.ccExpYear || '');
      const ccInfo = request?.ccInfo;

      const isOnlyMissingAch =
        filteredMissingFields?.length > 0 &&
        filteredMissingFields?.includes('bankAccountInfo') &&
        !filteredMissingFields?.includes('ccInfo');

      const isAccountNumberMatch =
        values?.bankAccountNumber &&
        (values?.bankAccountNumber || '') ===
          (values?.achReEnterAccountNumber || '');

      if (
        !utilityStore?.isBankVerificationRequired &&
        isAchDataEnteredInForm &&
        !isAllAchDataEntered
      ) {
        achFields.forEach((field) => {
          if (values[field]) {
            delete request[field];
          }
        });
      }
      if (
        request.bankAccountCustomerFirstName &&
        request.bankAccountCustomerLastName
      ) {
        request.bankAccountCustomerFirstName =
          request.bankAccountCustomerFirstName?.trim();
        request.bankAccountCustomerLastName =
          request.bankAccountCustomerLastName?.trim();
      }

      if (hasNoMissingFields) {
        await submitApplication(request);
      } else if (
        utilityStore?.isBankVerificationRequired &&
        bankRoutingNumber &&
        (bankRoutingNumber.length !== 9 || !isNumber(bankRoutingNumber))
      ) {
        showToast(
          'error',
          'The bank routing number must be exactly 9 digits long and can only contain numbers.',
        );
      } else if (
        utilityStore?.isBankVerificationRequired &&
        bankAccountNumber &&
        (bankAccountNumber.length < 5 || !isNumber(bankAccountNumber))
      ) {
        showToast(
          'error',
          'The account number must be at least 5 digits long and must only contain numbers.',
        );
      } else if (shouldAchErrorBeShown) {
        showToast(
          'error',
          'Please ensure that all bank account payment information is provided.',
        );
      } else if (shouldCcErrorBeShown) {
        showToast(
          'error',
          'Please ensure that all card payment information is provided.',
        );
      } else if (
        bankAccountNumber &&
        !isAccountNumberMatch &&
        utilityStore?.isBankVerificationRequired
      ) {
        showToast(
          'error',
          'Your account numbers do not match. Please try again.',
        );
      } else if (ccInfo && (ccType || '') === 'OTHER') {
        showToast(
          'error',
          'The card number you provided does not belong to Visa, Mastercard, American Express, or Discover. Please provide a different card or contact us for assistance.',
        );
      } else if (ccInfo) {
        const ccNumber = request?.ccInfo?.ccValue || '';
        request.ccInfo.ccNumber = ccNumber?.replace(/ /g, '');
        delete request.ccInfo.ccValue;
        request.ccInfo.ccExp = ccExp;
        request.ccInfo.autoPay = true;

        const authorizeCreditCardResponse = await authorizeCreditCard(
          request?.ccInfo?.ccNumber || '',
          ccExp,
          ccInfo?.cvc || '',
          ccInfo?.ccFirstName || '',
          ccInfo?.ccLastName || '',
          kountSessionId || '',
        );

        if (authorizeCreditCardResponse?.status) {
          setSubmitted(true);
        }

        if (authorizeCreditCardResponse?.status === 200) {
          request.ccInfo.preAuthStatus =
            authorizeCreditCardResponse?.data?.ccInfo?.preAuthStatus || null;

          if (utilityStore?.isBankVerificationRequired) {
            setIsLoading(true);
            setIsVerifyBankAccount(true);
          } else {
            await submitApplication(request);
          }
        } else {
          showToast(
            'error',
            authorizeCreditCardResponse?.message ||
              authorizeCreditCardResponse?.data?.error ||
              'Credit card is not valid',
          );
          return;
        }

        if (!utilityStore?.isBankVerificationRequired) {
          if (isFeeToBeCharged) {
            await submitApplication(request);
          }
        } else {
          await submitApplication(request);
        }
      } else if (
        utilityStore?.isBankVerificationRequired &&
        isAccountNumberMatch &&
        isAllAchDataEntered &&
        isOnlyMissingAch
      ) {
        await submitApplication(request);
      } else {
        await submitApplication(request);
      }

      setSubmitting(false);
    },
  });

  const ref = useRef(null);

  useEffect(() => {
    handleKountSessionID(formik);
  }, []);

  useEffect(() => {
    submitted && handleKountSessionID(formik, setSubmitted);
  }, [submitted]);

  let submitBtnText = '';

  if (hasNoMissingFields) {
    submitBtnText = 'Sign Contract';
  } else if (isMissingPayDates) {
    submitBtnText = 'Next';
  } else if (isFirstPaymentDateMissing) {
    submitBtnText = 'VERIFY';
  } else {
    submitBtnText = 'Submit';
  }

  const {purchaseNowAmount} = itemPaymentSummary || {};

  const isInvalidCvc =
    formik?.values?.cvc?.toString() === '000' ||
    formik?.values?.cvc?.toString() === '999';

  return (
    <>
      {!isVerifyBankAccount && (
        <div
          ref={ref}
          id="missingDataPanel"
          className={classNames(
            'p-4 min-vh-100 w-100',
            styles?.missingDataPanel,
          )}>
          <div
            className={classNames(
              'd-flex align-items-start',
              styles?.missingDataPanel__header,
            )}>
            <FontAwesomeIcon
              icon={faInfoCircle}
              size="2x"
              className={classNames('mr-2', styles?.missingDataPanel__icon)}
            />
            {(() => {
              const hasNoMissingFields =
                (filteredMissingFields || []).length === 0;

              if (hasNoMissingFields) {
                return (
                  <div>
                    Thank you for selecting {config.fullName} to provide you
                    with a simple Lease to Own payment program to complete your
                    purchase. Please click on the button below to review and
                    sign your contract.
                  </div>
                );
              }

              const introMessage = !isFinalizeApplicationPage ? (
                <div>
                  Thank you for selecting {config.fullName} to provide you with
                  a simple Lease to Own payment program to complete your
                  purchase.
                </div>
              ) : (
                <div>
                  <h3>{welcomeMessageTitle}</h3>
                  <div className={styles?.welcomeMessageBody}>
                    {welcomeMessageBody}
                  </div>
                </div>
              );

              let additionalMessage: React.ReactNode = null;

              if (isMissingPayDates) {
                if (!isFinalizeApplicationPage) {
                  additionalMessage = (
                    <span>Please verify the following information.</span>
                  );
                }
              } else if (isFeeToBeCharged || isSecurityDepositToBeCharged) {
                if (filteredMissingFields?.includes('ccInfo')) {
                  additionalMessage = (
                    <span>
                      <div className="my-3">
                        By entering your credit card information and clicking
                        submit below, you agree{' '}
                        {!isNaN(purchaseNowAmount) &&
                          purchaseNowAmount > 0 && (
                            <>
                              that the card will be charged the{' '}
                              <span
                                className={styles?.missingDataPanel__feeAmount}>
                                {convertNumberToCurrency(
                                  purchaseNowAmount || 0,
                                )}
                              </span>{' '}
                              when you click on submit and also
                            </>
                          )}{' '}
                        to a preauthorization of{' '}
                        <span className={styles?.missingDataPanel__feeAmount}>
                          {convertNumberToCurrency(
                            feeToBeCharged || securityDeposit,
                          )}
                        </span>
                        {signingFeeExists ? (
                          <span>
                            {' '}
                            initial payment which will be charged after signing.
                            If you choose not to sign the lease, this amount
                            will be held as preauthorization until released by
                            your bank.
                          </span>
                        ) : (
                          <span>
                            , the amount equal to your processing fee/deposit
                            where applicable, until the lease is signed, or the
                            preauthorization is released by your bank.
                          </span>
                        )}
                      </div>

                      <div>
                        In addition, the card you provide will be used to
                        process your first payment when due. Account information
                        provided will be used for Auto Pay.
                      </div>
                    </span>
                  );
                }
              } else {
                additionalMessage = (
                  <div className="mt-3">
                    We need to collect your method of payment for the future.
                  </div>
                );
              }

              return (
                <div>
                  {introMessage}
                  {additionalMessage}
                </div>
              );
            })()}
          </div>

          <Row>
            <Col xs={12} lg={10}>
              <MissingDataForm
                achDiscount={achDiscount}
                formik={formik}
                missingFields={filteredMissingFields}
                isFeeToBeCharged={isFeeToBeCharged}
                isBankVerificationRequired={
                  utilityStore?.isBankVerificationRequired
                }
                itemPaymentSummary={itemPaymentSummary}
                setSubmitted={setSubmitted}
                optionalAchText={optionalAchText}
                NID={NID}
                leadPk={leadPk}
                merchantRefCode={merchantRefCode}
                isFinalizeApplicationPage={isFinalizeApplicationPage}
              />

              {submitBtnText === 'Submit' && (
                <div
                  className={classNames(
                    'd-flex align-self-center mt-4',
                    styles?.missingDataPanel__agreement,
                  )}>
                  By clicking submit, you agree to the terms of the
                  preauthorization on the credit card, if provided. If you
                  choose not to sign the lease after you have clicked submit,
                  the preauthorization will remain on the card until it is
                  released by your bank.
                </div>
              )}
              <div
                className={classNames('d-flex', {
                  'justify-content-end':
                    (filteredMissingFields || []).length > 0,
                  'justify-content-center':
                    (filteredMissingFields || []).length === 0,
                })}>
                <Button
                  data-nid-target="completeApplicationSubmitBtn"
                  id="completeApplication-submit"
                  className={classNames(
                    'text-uppercase my-4',
                    styles?.missingDataPanel__submitButton,
                  )}
                  onClick={async () => {
                    if (submitBtnText?.toLowerCase() === 'submit') {
                      try {
                        window?.nid('applicationSubmit');
                      } catch (error) {
                        // eslint-disable-next-line no-console
                        console.log('NID Err: ', error);
                      }
                    }
                    if (!isMissingPayDates) {
                      setSubmitted(false);
                      const values = formik?.values || {};

                      const ccTypeToCheck = values?.ccType
                        ? values?.ccType
                        : getCreditCardType(values?.ccValue);
                      if (!values?.ccType) {
                        formik?.setFieldValue('ccType', ccTypeToCheck);
                      }

                      const isAllCcDataEntered =
                        values?.ccFirstName &&
                        values?.ccLastName &&
                        values?.ccType &&
                        values?.ccValue &&
                        values?.ccExpMonth &&
                        values?.ccExpYear &&
                        values?.cvc;

                      if (
                        (filteredMissingFields || []).includes('ccInfo') &&
                        !isAllCcDataEntered &&
                        !hasNoMissingFields
                      ) {
                        showToast(
                          'error',
                          'Please provide Credit/Debit Card information to proceed.',
                        );
                      }
                    }
                  }}
                  form="missingDataForm"
                  type="submit"
                  disabled={
                    isLoading ||
                    formik?.isSubmitting ||
                    submitted ||
                    isInvalidCvc
                  }>
                  {submitBtnText}
                </Button>
              </div>
            </Col>
            <Col />
          </Row>
        </div>
      )}
    </>
  );
};

export default MissingDataPanel;






components/purchase-insurance/index.module.scss

.buddyOfferContainer {
  display: flex;
  flex-flow: column;
  background-color: white;
  z-index: 1050;
  width: 100%;
  outline: 0;
  top: 0;
  bottom: 0;
  position: fixed;
  overflow-y: scroll;
  min-height: 100%;
  align-items: center;
}

div.buddyOfferIframeContainer {
  width: 100%;
  max-width: 1060px;
}

.submitButton {
  background: var(--primary);
  color: var(--white);
  font-size: 14px;
  width: 120px;
  height: 45px;
  border: 0;
  border-radius: 0;
  margin-bottom: 15px;

  &:is(:hover, :active, :focus, :not(:disabled):not(.disabled):active) {
    background: var(--primary-selected);
    border-color: var(--primary-selected);
  }

  &:is(:focus, :not(:disabled):not(.disabled):active:focus) {
    box-shadow: 0 0 0 0.2rem var(--primary-selected);
  }
}






components/purchase-insurance/index.tsx

import BuddyOfferElement, {useConfig} from '@buddy-technology/offer-component';
import classNames from 'classnames';
import React, {useCallback, useMemo, useState} from 'react';
import {Button} from 'react-bootstrap';
import styles from './index.module.scss';
import {SubmitApplicationResponse} from 'models/submit-application-response';
import {UtilityStore} from '@stores/utility';
import {ProtectionPlan} from 'models/protection-plan';
import {showToast} from '@uownleasing/common-utilities';

const encodeObject = (payload: unknown) => {
  return window.btoa(JSON.stringify(payload));
};

type PurchaseInsuranceProps = {
  isProd: boolean;
  onClick: () => void;
  btnText: string;
  showComponent: boolean;
  submitApplicationResponse: SubmitApplicationResponse;
  utilityStore: UtilityStore;
  buddyOfferConfigURL: string;
  partnerID: string;
};

export const PurchaseInsurance = ({
  isProd,
  onClick,
  btnText,
  showComponent,
  utilityStore,
  submitApplicationResponse: {
    basicCustomerData,
    itemsOnLease: [
      {
        itemInfo: {leadPk},
      },
    ],
  },
  buddyOfferConfigURL,
  partnerID,
}: PurchaseInsuranceProps) => {
  const [optedIn, setOptedIn] = useState<boolean>(null);
  const [submitBtnLock, setSubmitBtnLock] = useState(false);
  const [submitFailCount, setSubmitFailCount] = useState(0);
  const [offerElementResponse, setOfferElementResponse] = useState<string>();

  const offerElementData = useMemo(() => {
    const {firstName, lastName, phone, email, dob, ...address} =
      basicCustomerData;
    const countryCode = '+1';
    const dataParts = dob.split('-');
    const dateOfBirth = `${dataParts[1]}/${dataParts[2]}/${dataParts[0]}`;
    return {
      customer: {
        firstName,
        lastName,
        phone: countryCode + phone,
        email,
        dob: dateOfBirth,
        address: {
          line1: address.address1,
          line2: address.address2,
          city: address.city,
          state: address.state,
          postalCode: address.zipCode,
        },
      },
      policy: {
        meta: {
          partnerName: 'Uown',
          customerId: String(leadPk),
        },
      },
    };
  }, [basicCustomerData, leadPk]);

  const protectionPlanReqData = useMemo<ProtectionPlan>(
    () => ({
      leadPk,
      optIn: optedIn,
      offerElementResponse: offerElementResponse,
    }),
    [leadPk, offerElementResponse, optedIn],
  );

  const stage = useMemo<'STAGING' | 'PRODUCTION'>(
    () => (isProd ? 'PRODUCTION' : 'STAGING'),
    [isProd],
  );

  const onOptIn = useCallback((payload) => {
    setOptedIn(true);
    setOfferElementResponse(encodeObject(payload));
  }, []);

  const onOptOut = useCallback((payload) => {
    setOptedIn(false);
    setOfferElementResponse(encodeObject(payload));
  }, []);

  const onUserEvent = useCallback((event) => {
    // eslint-disable-next-line no-console
    console.debug('purchase-insurance', 'event', event);
  }, []);

  const onSubmitBtnClick = useCallback(async () => {
    if (optedIn === null) {
      showToast(
        'error',
        'You must opt in or out of the protection plan to proceed!',
      );
      return;
    }
    setSubmitBtnLock(true);
    try {
      await utilityStore.createProtectionPlan(protectionPlanReqData);
      onClick();
    } catch (e) {
      console.error('purchase-insurance-submit-btn', e);
      setSubmitFailCount(() => submitFailCount + 1);
      if (submitFailCount > 1) {
        onClick();
      }
    }
    setSubmitBtnLock(false);
  }, [onClick, protectionPlanReqData, submitFailCount, utilityStore]);

  const {isLoading, config} = useConfig(buddyOfferConfigURL);

  if (isLoading) {
    return <></>;
  }

  return (
    <div
      className={classNames(styles?.buddyOfferContainer)}
      hidden={!showComponent}>
      <div className={classNames(styles?.buddyOfferIframeContainer)}>
        <BuddyOfferElement
          ion="AON_PURCHASEPROTECTION"
          partnerID={partnerID}
          stage={stage}
          viewType="offer-only"
          data={{...offerElementData}}
          theme={config.themeBase}
          onOptIn={onOptIn}
          onOptOut={onOptOut}
          onUserEvent={onUserEvent}
        />
      </div>
      <Button
        className={classNames(
          'text-uppercase w-auto px-md-2 px-5',
          styles?.submitButton,
        )}
        id="purchase-insurance-submit-btn"
        disabled={submitBtnLock}
        onClick={onSubmitBtnClick}>
        {btnText}
      </Button>
    </div>
  );
};






components/send-application-form/panels/customer-information.tsx

import React, {useState} from 'react';
import {Col, Row} from 'reactstrap';
import {InputField} from '@uownleasing/common-ui';
import {SendApplicationRequest} from '@models';
import moment from 'moment';
import styles from './index.module.scss';
import classNames from 'classnames';
import RadarAutocomplete from '@components/radar/radarAutocomplete';

interface CustomerInfoPanelProps {
  formik: any;
  sendApplicationRequest: SendApplicationRequest;
  setSendApplicationRequest: (
    sendApplicationRequest: SendApplicationRequest,
  ) => void;
  getStateForZipcode: (zipCode: string) => Promise<string>;
  RADAR_LICENSE_KEY: string;
}

const CustomerInfoPanel: React.FC<CustomerInfoPanelProps> = ({
  formik,
  getStateForZipcode,
  RADAR_LICENSE_KEY,
}) => {
  const [radarFailed, setRadarFailed] = useState(false);
  const handleAddressSelect = (address: any) => {
    if (!address) return;

    formik.setFieldValue('mainAddress1', address.addressLabel || '');
    formik.setFieldValue('mainCity', address.city || '');
    formik.setFieldValue('mainStateOrProvince', address.stateCode || '');
    formik.setFieldValue('mainPostalCode', address.postalCode || '');
    formik.setFieldValue('mainAddressVerified', true);
  };

  return (
    <form id="new-application-form" onSubmit={formik?.handleSubmit}>
      <Row className={classNames(styles?.panel__container)}>
        <Col
          xs={12}
          xl={4}
          className="d-flex flex-row justify-content-between align-items-center mb-3">
          <InputField
            formik={formik}
            data-nid-target="mainFirstName"
            name="mainFirstName"
            type="name"
            label="First Name"
            isRequired
            placeholder="First Name"
            className={styles?.panel__input}
            isLabelBold={true}
          />
        </Col>
        <Col
          xs={12}
          xl={3}
          className="d-flex flex-row justify-content-between align-items-center mb-3">
          <InputField
            formik={formik}
            data-nid-target="mainMiddleName"
            name="mainMiddleName"
            type="name"
            placeholder="Middle Name"
            label="Middle Name"
            className={styles?.panel__input}
            isLabelBold={true}
          />
        </Col>
        <Col
          xs={12}
          xl={3}
          className="d-flex flex-row justify-content-between align-items-center mb-3">
          <InputField
            formik={formik}
            data-nid-target="mainLastName"
            name="mainLastName"
            type="name"
            placeholder="Last Name"
            isRequired
            label="Last Name"
            className={styles?.panel__input}
            isLabelBold={true}
          />
        </Col>
        <Col xs={12} xl={2} className="mb-3">
          <InputField
            formik={formik}
            data-nid-target="mainSuffix"
            name="mainSuffix"
            type="select"
            placeholder="Suffix"
            label="Suffix"
            className={classNames(styles?.panel__input, styles.selector_custom)}
            isLabelBold={true}
            options={['Jr', 'Sr', 'I', 'II', 'III', 'IV', 'V']}
          />
        </Col>
      </Row>

      <Row className={classNames(styles?.panel__container)}>
        <Col
          xs={12}
          lg={6}
          className="d-flex flex-row justify-content-between align-items-center mb-3">
          <InputField
            formik={formik}
            data-nid-target="mainSSN"
            name="mainSSN"
            type="text"
            isNumbersOnly={true}
            isRequired
            placeholder="Social Security Number"
            label="Social Security Number"
            maxLength={9}
            className={styles?.panel__input}
            isLabelBold={true}
          />
        </Col>
        <Col
          xs={12}
          lg={6}
          className={classNames(
            styles?.panel__DOB,
            'd-flex flex-row justify-content-between align-items-center mb-3',
          )}>
          <InputField
            formik={formik}
            data-nid-target="mainDOB"
            name="mainDOB"
            type="date"
            isRequired
            max={moment().subtract(18, 'years').format('YYYY-MM-DD')}
            placeholder="Birthdate"
            label="Birthdate"
            className={styles?.panel__input}
            isLabelBold={true}
          />
        </Col>
      </Row>

      <Row className={classNames(styles?.panel__container)}>
        <Col
          xs={12}
          lg={6}
          className="d-flex flex-row justify-content-between align-items-center mb-3">
          <InputField
            formik={formik}
            data-nid-target="mainCellPhone"
            name="mainCellPhone"
            type="phone-number"
            maxLength={14}
            placeholder="Mobile Phone"
            label="Mobile Phone"
            className={styles?.panel__input}
            isLabelBold={true}
            isRequired
          />
        </Col>
        <Col
          xs={12}
          lg={6}
          className="d-flex flex-row justify-content-between align-items-center mb-3">
          <InputField
            formik={formik}
            data-nid-target="emailAddress"
            name="emailAddress"
            type="email"
            isRequired
            placeholder="Email"
            label="Email"
            className={styles?.panel__input}
            isLabelBold={true}
          />
        </Col>
      </Row>

      <Row
        className={classNames(
          styles?.panel__container,
          'd-flex align-items-center',
        )}>
        <Col
          xs={12}
          lg={6}
          className="d-flex flex-row justify-content-between align-items-center mb-3">
          <InputField
            id="mainAddress1"
            formik={formik}
            data-nid-target="mainAddress1"
            name="mainAddress1"
            type="text"
            placeholder="Street Address"
            label="Street Address"
            className={styles?.panel__input}
            isLabelBold={true}
            onChange={() => formik.setFieldValue('mainAddressVerified', false)}
            isRequired
          />
        </Col>

        <Col
          xs={12}
          lg={6}
          className="d-flex flex-row justify-content-between align-items-center mb-3">
          <InputField
            formik={formik}
            data-nid-target="mainPostalCode"
            name="mainPostalCode"
            type="text"
            placeholder="Zip Code"
            label="Zip Code"
            className={styles?.panel__input}
            isNumbersOnly={true}
            maxLength={5}
            isLabelBold={true}
            isDisabled={!radarFailed}
            onChange={async (newValue = '') => {
              formik.setFieldValue('mainAddressVerified', false);
              const isFullZipCode = newValue?.length === 5;
              if (isFullZipCode) {
                const stateForZipCode = await getStateForZipcode(newValue);
                formik?.setFieldValue('mainStateOrProvince', stateForZipCode);
              }
            }}
            isRequired
          />
        </Col>
      </Row>

      <Row className={classNames(styles?.panel__container)}>
        <Col
          xs={12}
          lg={6}
          className="d-flex flex-row justify-content-between align-items-center mb-3">
          <InputField
            formik={formik}
            data-nid-target="mainCity"
            name="mainCity"
            type="text"
            placeholder="City"
            label="City"
            className={styles?.panel__input}
            isLabelBold={true}
            isDisabled={!radarFailed}
            onChange={() => formik.setFieldValue('mainAddressVerified', false)}
            isRequired
          />
        </Col>
        <Col
          xs={12}
          lg={6}
          className="d-flex flex-row justify-content-between align-items-center mb-3">
          <InputField
            formik={formik}
            data-nid-target="mainStateOrProvince"
            name="mainStateOrProvince"
            type="text"
            placeholder="State"
            label="State"
            className={styles?.panel__input}
            isDisabled={true}
            onChange={() => formik.setFieldValue('mainAddressVerified', false)}
            isLabelBold={true}
            isRequired
          />
        </Col>
      </Row>

      <RadarAutocomplete
        RADAR_LICENSE_KEY={RADAR_LICENSE_KEY}
        targetId="mainAddress1"
        onSelect={handleAddressSelect}
        onError={(err) => setRadarFailed(Boolean(err))}
        onDisabledChange={(disabled) => setRadarFailed(Boolean(disabled))}
      />
    </form>
  );
};

export default CustomerInfoPanel;






components/send-application-form/panels/disclaimer.tsx

import {Col, Row} from 'reactstrap';
import {InputField} from '@uownleasing/common-ui';
import React from 'react';
import styles from './index.module.scss';
import classNames from 'classnames';
import {projectConfig} from '@config/project-config';

interface DisclaimerPanelProps {
  formik: any;
  isKornerstone: boolean;
}

const DisclaimerPanel = ({formik, isKornerstone}: DisclaimerPanelProps) => {
  const {helpEmail, contactPhone, termsOfServiceLink, privacyPolicyLink} =
    projectConfig(isKornerstone);

  return (
    <form id="new-application-form" onSubmit={formik?.handleSubmit}>
      <Row className="d-flex align-items-center">
        <Col
          xs={12}
          className="d-flex flex-row justify-content-between align-items-center mb-3 mb-lg-0">
          <InputField
            formik={formik}
            data-nid-target="mainCurrentOrFutureBankruptcy"
            name="mainCurrentOrFutureBankruptcy"
            type="select"
            label="Are you currently in open bankruptcy, or are you planning to file bankruptcy?"
            placeholder="Select one"
            className={styles?.panel__input}
            options={['Yes', 'No']}
            isLabelBold={true}
          />
        </Col>
      </Row>

      <Row
        className={classNames(
          'd-flex align-items-center mt-5 pl-1',
          styles?.panel__checkboxContainer,
        )}>
        <Col xs={12} className="d-flex flex-row mb-3 mb-lg-0 ml-3">
          <div>
            <InputField
              formik={formik}
              data-nid-target="isAgreedToStatements"
              name="isAgreedToStatements"
              type="checkbox"
              placeholder=""
            />
          </div>
          <div className="mt-2">
            I hereby consent to receive transactional messages specific to my
            account via SMS/Text Messages.You can text STOP to be removed. I
            understand that message and data rates may apply. Message frequency
            varies. Data obtained through the short code program will not be
            shared with any third-parties for their marketing reasons/purposes.
            You may text HELP for additional help or contact customer support at{' '}
            <a className="navigation-link" href={`mailto:${helpEmail}`}>
              {helpEmail}
            </a>{' '}
            or {contactPhone}. Here is our privacy policy:{' '}
            <a
              className="navigation-link"
              href={privacyPolicyLink}
              target="_blank">
              {privacyPolicyLink}
            </a>
            . Carriers are not liable for delayed or undelivered messages.
          </div>
        </Col>
      </Row>

      <Row className={classNames('mt-4 pl-1', styles?.panel__agreement)}>
        <Col xs={12} className="d-flex flex-row mb-3 mb-lg-0 ml-3">
          <div>
            <InputField
              formik={formik}
              data-nid-target="isAgreedToPrivacyPolicy"
              name="isAgreedToPrivacyPolicy"
              type="checkbox"
              placeholder=""
            />
          </div>
          <div className="mt-2">
            I agree to{' '}
            <a
              href={privacyPolicyLink}
              target="_blank"
              className={styles?.panel__termsLink}>
              Privacy Policy
            </a>{' '}
            and{' '}
            <a
              href={termsOfServiceLink}
              target="_blank"
              className={styles?.panel__termsLink}>
              Terms of Service
            </a>
            .
          </div>
        </Col>
      </Row>
    </form>
  );
};

export default DisclaimerPanel;






components/send-application-form/panels/index.module.scss

@import '@styles/media-query.scss';

.panel {
  &__input {
    width: 100%;
    height: 40px !important;
    @include media-breakpoint-down(lg) {
      margin-bottom: 1.75rem !important;
    }

    div > div > div > div {
      box-shadow: none !important;
    }
  }

  &__container {
    @include media-breakpoint-up(xl) {
      margin-bottom: 1.5rem !important;
    }
  }

  &__checkboxContainer {
    font-family: var(--bold-font);
    color: var(--primary-font);
    accent-color: var(--primary);
  }

  &__agreement {
    font-family: var(--regular-font);
    accent-color: var(--primary);
  }

  &__termsLink {
    color: var(--primary) !important;
    cursor: pointer !important;
  }

  &__link {
    color: var(--navbar-hover) !important;
    text-decoration: underline !important;
  }
}

.inputContainer {
  padding-top: 1.5rem;
  margin-top: 1rem;

  @media screen and (max-width: 1200px) {
     padding-top: 0rem;
     margin-top: .5rem;
  }

  @media screen and (max-width: 992px) {
     padding-top: 0rem;
     margin-top: .5rem;
  }
}

.mainNextPayDate {
  margin-top: .4rem;
}





components/send-application-form/index.module.scss

@import '@styles/media-query.scss';

.sendApplicationContainer {
  background: var(--white);
  font-family: var(--regular-font);
  border-radius: 5px;
  box-shadow: 1px 1px 20px 0 rgba(134, 134, 134, 0.2) !important;
  max-width: 100%;

  &__category {
    font-size: 50px !important;
    @include media-breakpoint-down(md) {
      font-weight: 500 !important;
      font-size: 30px !important;
    }
  }
}

.sendApplicationFooter {
  max-width: 100%;

  &__button {
    background-color: var(--white) !important;
    border-radius: 30px !important;
    border-color: var(--white) !important;
    height: 40px !important;
    color: var(--primary-font);

    &:hover {
      color: var(--primary-font) !important;
    }

    &:focus {
      box-shadow: 0 0 0;
      color: var(--primary-font) !important;
    }

    &:disabled {
      color: var(--primary-font) !important;
    }
  }
}

.applicationPanel {
  &__container {
    font-family: var(--regular-font);
  }

  &__title {
    font-family: var(--bold-font);
    font-size: 30px;
  }

  &__title a {
    color: var(--primary) !important
  }

  &__title a:hover {
    color: var(--primary-selected) !important
  }

  &__description {
    font-size: 20px;
  }

  &__link {
    color: var(--navbar-hover);
  }
}





components/send-application-form/index.tsx

/* eslint-disable no-console */
import useNeuroid from '@components/neuro/useNeuroId';
import {PlaidBankVerificationComponent} from '@components/plaid-bank-verification';
import {VerifyPhoneNumber} from '@components/verify-phone-number';
import {SendApplicationRequest, SendApplicationResponse} from '@models';
import {CustomerStore} from '@stores/customer';
import {UtilityStore} from '@stores/utility';
import {
  cloneObject,
  convertNumberToCurrency,
  formatDate,
  showToast,
} from '@uownleasing/common-utilities';
import classNames from 'classnames';
import {useFormik} from 'formik';
import {inject, observer} from 'mobx-react';
import {CanContinueApplication} from 'models/can-continue-application';
import {useRouter} from 'next/router';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Button} from 'react-bootstrap';
import {Container} from 'reactstrap';
import * as Yup from 'yup';
import styles from './index.module.scss';
import CustomerInfoPanel from './panels/customer-information';
import DisclaimerPanel from './panels/disclaimer';
import EmploymentAndFinancialInformationPanel, {
  lengthOfEmploymentMapping,
  payScheduleMapping,
} from './panels/employment-and-financial-information';
import {GetServerSideProps} from 'next';
import {ProjectConfig} from '@config/project-config';

declare global {
  interface Window {
    nid: (a: string, b?: unknown, c?: unknown) => {};
    seon?: {
      init?: (cfg?: unknown) => void;
      getSession?: () => Promise<string>;
    };
  }
}

const defaultApplicationResponse = (): SendApplicationRequest => ({
  appUuid: '',
  emailAddress: '',
  mainAddress1: '',
  mainCellPhone: '',
  mainCity: '',
  mainCurrentOrFutureBankruptcy: false,
  mainDOB: '',
  mainEmployerName: null,
  mainEmploymentDuration: null,
  mainFirstName: '',
  mainMiddleName: '',
  mainLastName: '',
  mainLastPayDate: '',
  mainMonthlyIncome: 0,
  mainPayFrequency: '',
  mainPostalCode: '',
  mainSSN: '',
  merchantNumber: '',
  merchantName: '',
  seonFingerprintText: '',
  neuroIdentity: '',
  neuroSiteId: '',
  mainAddressVerified: false,
  mainBankAccountNumber: '',
  mainBankRoutingNumber: '',
  mainCreditCardBin: '',
});

const ApplicationResponsePanel = ({
  applicationResponse,
  applicationResponseCode,
  companyWebsite,
  utilityStore,
  leadPk,
}: {
  applicationResponse: SendApplicationResponse;
  applicationResponseCode: number;
  companyWebsite: string;
  utilityStore: UtilityStore;
  leadPk: number;
}) => {
  if (applicationResponseCode === 400) {
    return <ApplicationDeclinedPanel companyWebsite={companyWebsite} />;
  }
  if (applicationResponseCode !== 200) {
    console.debug(
      'send-application-form return an exception',
      applicationResponseCode,
    );
    return <ApplicationErrorPanel companyWebsite={companyWebsite} />;
  }
  if (applicationResponse.isPlaidRequired) {
    return (
      <PlaidBankVerificationComponent
        leadPk={leadPk}
        {...applicationResponse}
        utilityStore={utilityStore}
      />
    );
  }
  return <ApplicationSubmittedPanel {...applicationResponse} />;
};

const ResumePlaidVerificationPanel: React.FC<{
  leadPk: number;
  locationName: string;
  customerFirstName: string;
  utilityStore: UtilityStore;
  customerStore: CustomerStore;
  verifyPhone: boolean;
  config: ProjectConfig;
}> = ({
  leadPk,
  locationName,
  customerFirstName,
  utilityStore,
  customerStore,
  verifyPhone,
  config,
}) => {
  const [phoneVerified, setPhoneVerified] = useState<boolean>();
  if (verifyPhone && !phoneVerified) {
    return (
      <VerifyPhoneNumber
        leadPk={leadPk}
        setPhoneVerified={setPhoneVerified}
        verifyPhoneNumber={customerStore.verifyPhoneBeforeSigning}
        config={config}
      />
    );
  }
  return (
    <PlaidBankVerificationComponent
      leadPk={leadPk}
      locationName={locationName}
      customerFirstName={customerFirstName}
      utilityStore={utilityStore}
    />
  );
};

interface SendApplicationFormProps {
  utilityStore?: UtilityStore;
  customerStore?: CustomerStore;
  NID: string;
  activeApplicationStep: number;
  setActiveApplicationStep: (activeApplicationStep: number) => void;
  isSeonLoaded: boolean;
  setIsSeonLoaded: (isSeonLoaded: boolean) => void;
  isAnotherWindowOpen: boolean;
  RADAR_LICENSE_KEY: string;
  isKornerstone: boolean;
  config: ProjectConfig;
}

const SendApplicationForm = ({
  activeApplicationStep,
  setActiveApplicationStep,
  utilityStore,
  customerStore,
  isSeonLoaded,
  setIsSeonLoaded,
  isAnotherWindowOpen,
  NID,
  RADAR_LICENSE_KEY,
  isKornerstone,
  config,
}: SendApplicationFormProps) => {
  const router = useRouter();
  const ref = useRef(null);
  const [leadPk, setLeadPk] = useState<number>();
  const [applicationResponse, setApplicationResponse] =
    useState<SendApplicationResponse>();
  const [canContinueResp, setCanContinueResp] =
    useState<Partial<CanContinueApplication>>();

  const setAdditionFunnel = useCallback(() => {
    window.nid('start', {linkedSiteId: 'form_items340'});
    window.nid('setVariable', 'funnel', 'leadgen');
  }, []);

  useNeuroid({
    NID,
    identify: leadPk,
    setAdditionFunnel,
  });

  const [sendApplicationRequest, setSendApplicationRequest] =
    useState<SendApplicationRequest>(defaultApplicationResponse());
  const [applicationResponseCode, setApplicationResponseCode] = useState(-1);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [isDisabled, setIsDisabled] = useState(true);
  const setShortCodeAndLoadAppStatus = useCallback(async () => {
    utilityStore.reset();
    // Remove on 1.50
    const uuid = router.query?.uuid || '';
    const shortCode = router.query?.shortCode || '';
    if (shortCode) {
      const shortCodeString = Array.isArray(shortCode)
        ? shortCode.join('')
        : shortCode;
      customerInfoFormik.setFieldValue('shortCode', shortCodeString);
      utilityStore.setUuid(shortCodeString);
      utilityStore.setIsLoading(true);
      const response = await utilityStore.canContinueApplication(
        '',
        shortCodeString,
      );
      utilityStore.setIsLoading(false);
      setCanContinueResp(response);
      setLeadPk(response.leadPk);
      customerInfoFormik.setFieldValue(
        'merchantNumber',
        response.refMerchantCode,
      );
      if (response.canContinuePlaid) {
        setActiveApplicationStep(4);
      } else if (response.canContinueApplication) {
        setActiveApplicationStep(0);
      } else {
        setActiveApplicationStep(-2);
      }
    }

    // Remove on 1.50
    if (uuid) {
      const uuidString = Array.isArray(uuid) ? uuid.join('') : uuid;
      customerInfoFormik.setFieldValue('appUuid', uuidString);
      utilityStore.setUuid(uuidString);
      utilityStore.setIsLoading(true);
      const response = await utilityStore.canContinueApplication(
        uuidString,
        '',
      );
      utilityStore.setIsLoading(false);
      setCanContinueResp(response);
      setLeadPk(response.leadPk);
      customerInfoFormik.setFieldValue(
        'merchantNumber',
        response.refMerchantCode,
      );
      if (response.canContinuePlaid) {
        setActiveApplicationStep(4);
      } else if (response.canContinueApplication) {
        setActiveApplicationStep(0);
      } else {
        setActiveApplicationStep(-2);
      }
    }
  }, [
    router.query?.uuid,
    router.query?.shortCode,
    setActiveApplicationStep,
    utilityStore,
  ]);

  const getSeonSessionData = async (): Promise<string> => {
    if (typeof window === 'undefined' || !window.seon?.getSession) {
      return '';
    }
    try {
      const seonSession = await window.seon.getSession();
      return seonSession || '';
    } catch {
      return '';
    }
  };

  const getSessionId = useCallback(async (): Promise<string> => {
    console.log('[SEON] getSessionId:start');

    try {
      const res = await customerStore?.getSessionId?.();
      console.log('[SEON] customerStore.getSessionId status =', res?.status);
    } catch (e) {
      console.error('[SEON] customerStore.getSessionId error', e);
    }

    if (typeof window === 'undefined') {
      console.warn('[SEON] window undefined (SSR)');
      return '';
    }

    const seon =
      ((window as any).seon as
        | {init?: () => void; getSession?: () => Promise<string>}
        | undefined) || undefined;

    if (!seon || typeof seon.getSession !== 'function') {
      console.warn('[SEON] SDK not loaded yet');
      return '';
    }

    try {
      try {
        typeof seon.init === 'function' && seon.init();
      } catch {}

      const t0 =
        typeof window !== 'undefined' &&
        window.performance &&
        typeof window.performance.now === 'function'
          ? window.performance.now()
          : Date.now();

      const session = await seon.getSession();

      const t1 =
        typeof window !== 'undefined' &&
        window.performance &&
        typeof window.performance.now === 'function'
          ? window.performance.now()
          : Date.now();

      const ms = Math.round(t1 - t0);

      console.log('[SEON] getSession: success', {
        len: session?.length ?? 0,
        ms,
      });

      setIsSeonLoaded(false);
      return session || '';
    } catch (e) {
      console.error('[SEON] getSession: error', e);
      return '';
    }
  }, [customerStore, setIsSeonLoaded]);

  const customerInfoFormik = useFormik({
    initialValues: {
      appUuid: '',
      shortCode: '',
      merchantNumber: '',
      mainFirstName: '',
      mainMiddleName: '',
      mainLastName: '',
      mainSuffix: '',
      mainSSN: '',
      mainDOB: '',
      mainCellPhone: '',
      emailAddress: '',
      mainAddress1: '',
      mainPostalCode: '',
      mainCity: '',
      mainStateOrProvince: '',
      mainAddressVerified: false,
    },
    validationSchema: Yup.object({
      mainFirstName: Yup.string().required('First Name is required.'),
      mainMiddleName: Yup.string().optional(),
      mainLastName: Yup.string().required('Last Name is required.'),
      mainSuffix: Yup.string().optional(),
      mainSSN: Yup.string()
        .length(9, 'SSN must be 9 digits long')
        .required('Social Security Number is required.'),
      mainDOB: Yup.string().required('Date of Birth is required.'),
      mainCellPhone: Yup.string().required('Mobile Phone is required.'),
      emailAddress: Yup.string()
        .matches(
          /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i,
          'Please enter a valid email address.',
        )
        .required('Email is required.'),
      mainAddress1: Yup.string().required('Street Address is required.'),
      mainPostalCode: Yup.string()
        .length(5, 'Zip Code must be 5 digits long.')
        .matches(/^\d*$/, 'ZIP codes must be numeric.')
        .required('Zip Code is required.'),
      mainCity: Yup.string().required('City is required.'),
      mainStateOrProvince: Yup.string(),
      mainAddressVerified: Yup.boolean(),
    }),
    onSubmit: async (values, {setSubmitting}) => {
      setSubmitting(true);
      const currentSendApplicationRequest: SendApplicationRequest = cloneObject(
        sendApplicationRequest,
      );
      Object.keys(values).forEach((field) => {
        const rawValue = values?.[field];
        let fieldValue = rawValue ?? '';
        const isMainDOB = field === 'mainDOB';
        if (isMainDOB) {
          fieldValue = formatDate({f: 'api', d: fieldValue});
        } else if (field === 'mainCellPhone') {
          fieldValue = fieldValue.replace(/\D/g, '');
        }
        currentSendApplicationRequest[field] =
          typeof fieldValue === 'string' ? fieldValue.trim() : fieldValue;
      });

      if ((currentSendApplicationRequest?.mainCellPhone || '').length !== 10) {
        showToast(
          'error',
          'US phone numbers must be numeric and exactly 10 digits long.',
        );
      } else {
        setSendApplicationRequest(currentSendApplicationRequest);
        setActiveApplicationStep(1);
      }
      setSubmitting(false);
    },
  });

  const employmentAndFinancialInfoFormik = useFormik({
    initialValues: {
      mainEmployerName: null,
      mainPayFrequency: '',
      mainLastPayDate: '',
      mainNextPayDate: '',
      mainMonthlyIncome: null,
      mainEmploymentDuration: null,
      mainBankAccountNumber: '',
      mainBankRoutingNumber: '',
      mainCreditCardBin: '',
    },
    validationSchema: Yup.object({
      mainPayFrequency: Yup.string().required('Your Pay Schedule is required.'),
      mainLastPayDate: Yup.string().required('Last Pay Date is required.'),
      mainNextPayDate: Yup.string().required('Next Pay Date is required.'),
      mainMonthlyIncome: Yup.number()
        .typeError(
          'Please use only numbers when providing your monthly income.',
        )
        .required('Gross Monthly Income is required.'),
      mainBankRoutingNumber: Yup.string()
        .matches(/^\d*$/, 'Routing number must be numeric.')
        .max(9, 'Routing number must be up to 9 digits.'),
      mainBankAccountNumber: Yup.string()
        .matches(/^\d*$/, 'Account number must be numeric.')
        .max(17, 'Account number must be up to 17 digits.'),
      mainCreditCardBin: Yup.string().matches(
        /^\d{0,6}$/,
        'Credit card bin must be numeric and up to 6 digits.',
      ),
    }),
    onSubmit: async (values, {setSubmitting}) => {
      setSubmitting(true);
      setActiveApplicationStep(2);
      const currentSendApplicationRequest: SendApplicationRequest = cloneObject(
        sendApplicationRequest,
      );

      const getMapKeyByValue = (mapping = {}, value = '') => {
        let keyToReturn = '';
        Object.keys(mapping).forEach((key) => {
          const currentKeyValue = mapping?.[key];
          if (currentKeyValue && currentKeyValue === value) {
            keyToReturn = key;
          }
        });
        return keyToReturn;
      };

      Object.keys(values).forEach((field = '') => {
        const isMainPayFrequency = field === 'mainPayFrequency';
        const isMainEmploymentDuration = field === 'mainEmploymentDuration';
        const isMainLastPayDate = field === 'mainLastPayDate';
        const isMainNextPayDate = field === 'mainNextPayDate';
        let valueToStore = values?.[field];
        if (isMainLastPayDate || isMainNextPayDate) {
          valueToStore = formatDate({f: 'api', d: valueToStore});
        } else if (isMainPayFrequency) {
          valueToStore = getMapKeyByValue(payScheduleMapping, valueToStore);
        } else if (isMainEmploymentDuration) {
          valueToStore = getMapKeyByValue(
            lengthOfEmploymentMapping,
            valueToStore,
          );
        }
        currentSendApplicationRequest[field] = valueToStore;
      });
      if (currentSendApplicationRequest.mainEmploymentDuration === '') {
        currentSendApplicationRequest.mainEmploymentDuration = null;
      }
      setSendApplicationRequest(currentSendApplicationRequest);
      setSubmitting(false);
    },
  });

  const disclaimerFormik = useFormik({
    initialValues: {
      mainCurrentOrFutureBankruptcy: '',
      isAgreedToStatements: false,
      isAgreedToPrivacyPolicy: false,
    },
    validationSchema: Yup.object({
      mainCurrentOrFutureBankruptcy: Yup.string().required(
        'Bankruptcy information is required.',
      ),
      isAgreedToStatements: Yup.boolean().required(
        'Your agreement to the aforementioned statements is required.',
      ),
      isAgreedToPrivacyPolicy: Yup.boolean().required(
        'Your agreement to the aforementioned statements is required.',
      ),
    }),
    onSubmit: async (values, {setSubmitting}) => {
      setSubmitting(true);
      const uuid: string =
        router.query?.uuid && typeof router.query?.uuid === 'string'
          ? router.query?.uuid
          : '';

      const shortCode: string =
        router.query?.shortCode && typeof router.query?.shortCode === 'string'
          ? router.query?.shortCode
          : '';
      utilityStore.setIsLoading(true);

      let response = await utilityStore.canContinueApplication(uuid, shortCode);

      if (response.canContinueApplication) {
        const {
          mainCurrentOrFutureBankruptcy = '',
          isAgreedToStatements,
          isAgreedToPrivacyPolicy,
        } = values;
        const isAllCheckboxClicked =
          isAgreedToStatements && isAgreedToPrivacyPolicy;
        const currentSendApplicationRequest: SendApplicationRequest =
          cloneObject(sendApplicationRequest);
        currentSendApplicationRequest.appUuid = response.uuid;

        currentSendApplicationRequest.mainCurrentOrFutureBankruptcy =
          mainCurrentOrFutureBankruptcy.toLowerCase() === 'yes';

        const seonSessionData = await getSeonSessionData();
        currentSendApplicationRequest.seonFingerprintText =
          seonSessionData || '';

        currentSendApplicationRequest.neuroIdentity = leadPk
          ? String(leadPk)
          : '';
        currentSendApplicationRequest.neuroSiteId = NID;
        if (mainCurrentOrFutureBankruptcy && isAllCheckboxClicked) {
          const sendApplicationResponse = await utilityStore.sendApplication(
            currentSendApplicationRequest,
          );

          const isPlaidRequired =
            sendApplicationResponse?.data?.isPlaidRequired ?? false;

          const applicationStatus =
            sendApplicationResponse?.data?.appApprovalStatus || '';

          window.nid('applicationSubmit');
          const isApplicationApproved =
            applicationStatus?.toUpperCase() === 'APPROVED';

          if (isApplicationApproved || isPlaidRequired) {
            setApplicationResponseCode(200);
          } else if (applicationStatus) {
            setApplicationResponseCode(400);
          } else {
            setApplicationResponseCode(500);
          }

          setApplicationResponse(sendApplicationResponse?.data);

          setActiveApplicationStep(3);
        } else if (!isAllCheckboxClicked) {
          showToast(
            'error',
            'Your agreement to the aforementioned statements is required.',
          );
        } else {
          showToast(
            'error',
            'Something went wrong. Please try reloading this page.',
          );
        }
      } else {
        setActiveApplicationStep(-2);
      }
      utilityStore.setIsLoading(false);
      setSubmitting(false);
    },
  });

  useEffect(() => {
    if (isSeonLoaded) {
      getSessionId();
    }
  }, [getSessionId, isSeonLoaded]);

  useEffect(() => {
    if (isAnotherWindowOpen) {
      setActiveApplicationStep(-3);
    } else {
      setShortCodeAndLoadAppStatus();
    }
  }, [
    // Remove on 1.50
    router.query?.uuid,
    router.query?.shortCode,
    isAnotherWindowOpen,
    setShortCodeAndLoadAppStatus,
    setActiveApplicationStep,
  ]);

  useEffect(() => {
    const isSubmitting =
      disclaimerFormik.isSubmitting ||
      employmentAndFinancialInfoFormik.isSubmitting ||
      customerInfoFormik.isSubmitting ||
      false;

    setIsFormSubmitting(isSubmitting);
  }, [
    customerInfoFormik.isSubmitting,
    disclaimerFormik.isSubmitting,
    employmentAndFinancialInfoFormik.isSubmitting,
  ]);

  useEffect(() => {
    const checkIsDisabled = async () => {
      if (isFormSubmitting) {
        setIsDisabled(true);
        return;
      }

      if (activeApplicationStep === 0 && !customerInfoFormik.isValid) {
        setIsDisabled(true);
        return;
      }

      if (activeApplicationStep === 1) {
        await employmentAndFinancialInfoFormik.validateForm();
        if (!employmentAndFinancialInfoFormik.isValid) {
          setIsDisabled(true);
          return;
        }
      }

      if (activeApplicationStep === 2) {
        await disclaimerFormik.validateForm();
        if (!disclaimerFormik.isValid) {
          setIsDisabled(true);
          return;
        }
      }

      setIsDisabled(false);
      return false;
    };
    checkIsDisabled();
  }, [
    isFormSubmitting,
    activeApplicationStep,
    disclaimerFormik.values,
    disclaimerFormik.isValid,
    customerInfoFormik.values,
    customerInfoFormik.isValid,
    employmentAndFinancialInfoFormik.values,
    employmentAndFinancialInfoFormik.isValid,
  ]);

  return (
    <div ref={ref} id={'applicationForm'}>
      <Container
        className={classNames('p-3 p-md-5', styles?.sendApplicationContainer)}>
        <div
          className={classNames(
            'mb-4',
            styles?.sendApplicationContainer__category,
          )}>
          {activeApplicationStep === 0 && 'Your Information'}
          {activeApplicationStep === 1 && 'Employment & Financial'}
          {activeApplicationStep === 2 && 'Legal & Disclaimer'}
        </div>
        {activeApplicationStep === -2 && (
          <ApplicationNotAvailablePanel companyWebsite={config.website} />
        )}
        {activeApplicationStep === -1 && <div>Loading...</div>}
        {activeApplicationStep === 0 && (
          <CustomerInfoPanel
            formik={customerInfoFormik}
            sendApplicationRequest={sendApplicationRequest}
            setSendApplicationRequest={setSendApplicationRequest}
            getStateForZipcode={customerStore?.getStateForZipcode}
            RADAR_LICENSE_KEY={RADAR_LICENSE_KEY}
          />
        )}
        {activeApplicationStep === 1 && (
          <EmploymentAndFinancialInformationPanel
            formik={employmentAndFinancialInfoFormik}
            sendApplicationRequest={sendApplicationRequest}
            setSendApplicationRequest={setSendApplicationRequest}
          />
        )}
        {activeApplicationStep === 2 && (
          <DisclaimerPanel
            formik={disclaimerFormik}
            isKornerstone={isKornerstone}
          />
        )}
        {activeApplicationStep === 3 && (
          <ApplicationResponsePanel
            utilityStore={utilityStore}
            companyWebsite={config.website}
            applicationResponse={applicationResponse}
            applicationResponseCode={applicationResponseCode}
            leadPk={leadPk}
          />
        )}
        {activeApplicationStep === 4 && (
          <ResumePlaidVerificationPanel
            leadPk={leadPk}
            locationName={canContinueResp.merchantLocationName}
            customerFirstName={canContinueResp.customerFirstName}
            utilityStore={utilityStore}
            customerStore={customerStore}
            verifyPhone={canContinueResp.verifyPhone}
            config={config}
          />
        )}
        {(isAnotherWindowOpen || activeApplicationStep === -3) && (
          <ApplicationAlreadyOpenPanel />
        )}
      </Container>

      {!isNaN(activeApplicationStep) &&
      activeApplicationStep >= 0 &&
      activeApplicationStep < 3 ? (
        <Container
          className={classNames(
            'd-flex w-100 justify-content-center justify-content-md-end mt-5 p-0',
            styles?.sendApplicationFooter,
          )}>
          {activeApplicationStep > 0 ? (
            <Button
              data-nid-target="sendApplication-PrevBtn"
              className={classNames(
                'bg-transparent text-uppercase px-5 mr-3',
                styles?.sendApplicationFooter__button,
              )}
              onClick={() => {
                const previousStep =
                  activeApplicationStep > 0 ? activeApplicationStep - 1 : 0;
                setActiveApplicationStep(previousStep);
              }}>
              Prev
            </Button>
          ) : (
            <></>
          )}
          <Button
            type="submit"
            form="new-application-form"
            data-nid-target={
              activeApplicationStep && activeApplicationStep === 2
                ? 'sendApplication-submitBtn'
                : 'sendApplication-nextBtn'
            }
            disabled={isDisabled}
            className={classNames(
              'text-uppercase px-5',
              styles?.sendApplicationFooter__button,
            )}>
            {activeApplicationStep && activeApplicationStep === 2
              ? 'Submit'
              : 'Next'}
          </Button>
        </Container>
      ) : (
        <></>
      )}
    </div>
  );
};

interface ApplicationNotAvailablePanelProps {
  companyWebsite: string;
}
const ApplicationNotAvailablePanel = ({
  companyWebsite,
}: ApplicationNotAvailablePanelProps) => {
  return (
    <div className={styles?.applicationPanel__container}>
      <div className={styles?.applicationPanel__title}>Sorry</div>

      <div
        className={classNames('mt-5', styles?.applicationPanel__description)}>
        Your application link has expired. Please reapply with a new link or the
        most recent link you received.
      </div>

      <div
        className={classNames('mt-3', styles?.applicationPanel__description)}>
        Please click{' '}
        <a href={companyWebsite} className={styles?.applicationPanel__link}>
          here
        </a>{' '}
        to access our home page.
      </div>
    </div>
  );
};

interface ApplicationSubmittedPanel extends SendApplicationResponse {}

const ApplicationSubmittedPanel = ({
  customerFirstName,
  locationName,
  creditLimit,
}: ApplicationSubmittedPanel) => {
  return (
    <div className={styles?.applicationPanel__container}>
      <div className={styles?.applicationPanel__title}>
        Congratulations, {customerFirstName}!
      </div>

      <div
        className={classNames('mt-5', styles?.applicationPanel__description)}>
        You have been approved for a {convertNumberToCurrency(creditLimit)}{' '}
        lease at {locationName}.
      </div>
      <div
        className={classNames('mt-3', styles?.applicationPanel__description)}>
        {locationName} will have record of your approval in their system and you
        are now able to complete your purchase.
      </div>
      <div
        className={classNames('mt-3', styles?.applicationPanel__description)}>
        A copy of this approval has been sent to your email address on file.
        Don't see it? Please check your SPAM folder.
      </div>
      <div
        className={classNames('mt-2', styles?.applicationPanel__description)}>
        A text message would be sent in the same time.
      </div>
    </div>
  );
};

interface ApplicationDeclinedPanelProps {
  companyWebsite: string;
}
export const ApplicationDeclinedPanel = ({
  companyWebsite,
}: ApplicationDeclinedPanelProps) => {
  return (
    <div className={styles?.applicationPanel__container}>
      <div className={styles?.applicationPanel__title}>
        Sorry, unfortunately your application is not accepted
      </div>

      <div
        className={classNames('mt-5', styles?.applicationPanel__description)}>
        Please click{' '}
        <a href={companyWebsite} className={styles?.applicationPanel__link}>
          here
        </a>{' '}
        to access our home page.
      </div>
    </div>
  );
};

interface ApplicationErrorPanelProps {
  companyWebsite: string;
}
const ApplicationErrorPanel = ({
  companyWebsite,
}: ApplicationErrorPanelProps) => {
  return (
    <div className={styles?.applicationPanel__container}>
      <div className={styles?.applicationPanel__title}>
        Something Went Wrong!
      </div>

      <div
        className={classNames('mt-5', styles?.applicationPanel__description)}>
        Please contact uown for assistance or click{' '}
        <a href={companyWebsite} className={styles?.applicationPanel__link}>
          here
        </a>{' '}
        to access our home page.
      </div>
    </div>
  );
};

const ApplicationAlreadyOpenPanel = () => {
  const isWindow: boolean = typeof window !== 'undefined';
  return (
    <div className={styles?.applicationPanel__container}>
      <div className={styles?.applicationPanel__title}>
        Your application is already open in another window. Click{' '}
        <a
          className="cursor-pointer text-info"
          onClick={() => isWindow && window.location.reload()}>
          here
        </a>{' '}
        to continue your application within this window.
      </div>

      <div
        className={classNames('mt-5', styles?.applicationPanel__description)}>
        If you believe you have received this message in error, please restart
        your browser and try again.
      </div>
    </div>
  );
};

type Props = {
  RADAR_LICENSE_KEY: string;
};

export const getServerSideProps: GetServerSideProps<Props> = async () => ({
  props: {
    RADAR_LICENSE_KEY: process.env.RADAR_LICENSE_KEY || '',
  },
});

export default inject(
  'utilityStore',
  'customerStore',
)(observer(SendApplicationForm));





components/states-activity-logs-table/index.tsx

import React, {useCallback, useEffect, useState} from 'react';
import {ActivityLogPanel} from '@uownleasing/common-ui';
import {StateConfigLog, StateStore} from '@stores/state';
import {paginationRowsPerPageOptions} from '@utils/helper';
import config from '@config/project-config';

interface StateProps {
  stateStore: StateStore;
  reloadActivityLog: boolean;
}

export const StatesActivityLogsTable = ({
  stateStore,
  reloadActivityLog,
}: StateProps) => {
  const [logs, setLogs] = useState<StateConfigLog[]>([]);
  const [paginationTotalRows, setPaginationTotalRows] = useState(10);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [pageNumber, setPageNumber] = useState<number>(0);

  const getLogs = async (body: {
    statePk: number;
    pageNumber: number;
    maxResults: number;
  }) => {
    const data = await stateStore.getActivityLogs({
      maxResults: body.maxResults,
      pageNumber: body.pageNumber,
      statePk: body.statePk,
    });
    setPaginationTotalRows(data.data.totalElements);
    setLogs(data?.data.content);
  };

  useEffect(() => {
    getLogs({maxResults: 10, pageNumber: 0, statePk: null});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    getLogs({maxResults: rowsPerPage, pageNumber, statePk: null});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadActivityLog]);

  const onChangePage = useCallback(
    async (page: number) => {
      setPageNumber(page - 1);
      getLogs({
        maxResults: rowsPerPage,
        pageNumber: page - 1,
        statePk: null,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rowsPerPage],
  );

  const onSubmitFilters = async (filters) => {
    let statePk: number | null = null;

    if (filters.state) {
      statePk = stateStore.states.find(
        ({stateConfigurationsInfo: {state}}) => state === filters.state,
      )?.pk;
    }

    getLogs({
      maxResults: rowsPerPage,
      pageNumber: pageNumber,
      statePk,
    });
  };

  const onChangeRowsPerPage = useCallback(
    async (rowsPerPage: number, page: number) => {
      setRowsPerPage(rowsPerPage);
      getLogs({
        maxResults: rowsPerPage,
        pageNumber: page - 1,
        statePk: null,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <ActivityLogPanel
      config={config}
      activityLogs={logs}
      setIsLoading={() => {}}
      paginationServer
      paginationTotalRows={paginationTotalRows}
      paginationPerPage={rowsPerPage}
      paginationRowsPerPageOptions={paginationRowsPerPageOptions}
      onChangePage={onChangePage}
      onChangeRowsPerPage={onChangeRowsPerPage}
      logTypes={['STATE_CONFIG_CHANGE']}
      onSubmitFilters={onSubmitFilters}
      progressPending={false}
      setActivityLogs={setLogs}
      hasNotesStandardPermission={false}
      hasNotesInternalPermission={false}
      overwriteDefaultFilters={[
        {
          type: 'select',
          name: 'state',
          label: 'State',
          options: stateStore.states.map(
            ({stateConfigurationsInfo}) => stateConfigurationsInfo.state,
          ),
          inputCustomStyles: {
            valueContainer: (provided) => ({
              ...provided,
              maxHeight: '30px',
              overflow: 'auto',
            }),
            control: (provided) => ({
              ...provided,
              width: '350px',
            }),
          },
        },
      ]}
    />
  );
};






components/terms-of-agreement-form/index.module.scss

@import '@styles/media-query.scss';

.termsOfAgreement {
  font-family: var(--regular-font);
  background: var(--hover-color);
  font-size: 14px;

  &__form {
    width: 75% !important;

    @include media-breakpoint-down(lg) {
      width: 100% !important;
    }

    &__container {
      flex-direction: column;
      align-items: center;

      background: var(--white);
      box-shadow: 1px 1px 20px 0 rgba(134, 134, 134, 0.2) !important;

      &__body {
        width: 60% !important;

        @include media-breakpoint-down(lg) {
          width: 100% !important;
        }

        &__title {
          font-family: var(--bold-font);
          font-size: 20px;
        }

        &__span {
          font-family: var(--bold-font);
          font-size: 18px;
        }

        &__description {
          font-family: var(--bold-font);
        }

        &__icon {
          color: var(--secondary);
          cursor: pointer;
        }

        &__link {
          color: var(--navbar-hover) !important;
          text-decoration: underline !important;
        }

        &__checkbox {
          accent-color: var(--primary);
        }
      }

      &__submitButton {
        background: var(--primary);
        color: var(--white);
        font-size: 14px;
        width: 120px;
        height: 45px;
        border: 0;
        border-radius: 0;

        &:is(:hover, :active, :focus, :not(:disabled):not(.disabled):active) {
          background: var(--primary-selected);
          border-color: var(--primary-selected);
        }

        &:is(:focus, :not(:disabled):not(.disabled):active:focus) {
          box-shadow: 0 0 0 0.2rem var(--primary-selected);
        }
      }
    }
  }
}

.termsOfAgreementBox {
  border-radius: 5px;

  &__title {
    font-family: var(--bold-font);
    font-size: 16px;
  }

  &__primaryBorder {
    border: 1px solid var(--primary) !important;
  }

  &__earlyPurchaseBorder {
    border: 1px solid #f4d961 !important;
  }

  &__primaryBg {
    background: var(--primary) !important;
  }

  &__earlyPurchaseBg {
    background: #f4d961 !important;
  }

  &__white {
    color: var(--white);
  }

  &__black {
    color: var(--black);
  }
}





components/terms-of-agreement-form/index.tsx

import {SubmitApplicationResponse} from '@models';
import React, {useEffect, useCallback, useRef, useState, useMemo} from 'react';
import {Col, Form, Row, Tooltip} from 'reactstrap';
import {
  convertNumberToCurrency,
  formatDate,
  isEqual,
  showToast,
} from '@uownleasing/common-utilities';
import {FilterTable, InputField} from '@uownleasing/common-ui';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faInfoCircle} from '@fortawesome/free-solid-svg-icons';
import {Button} from 'react-bootstrap';
import classNames from 'classnames';
import {useFormik} from 'formik';
import * as Yup from 'yup';
import $ from 'jquery';
import styles from './index.module.scss';
import AlternativeContractModalVendor from 'components/modals/alternative-contract-vendor';
import {itemSplitColumns} from '@utils/data-table-columns';
import {dataTableCustomStyles} from '@utils/helper';
import {PurchaseInsurance} from '@components/purchase-insurance';
import {UtilityStore} from '@stores/utility';
import {ProjectConfig} from '@config/project-config';

const PROCEED_TO_ESIGN_TXT = 'Proceed to signature';

interface TermsOfAgreementProps {
  isProd: boolean;
  offerInsurance: boolean;
  submitApplicationResponse: SubmitApplicationResponse;
  embeddedSigningUrl: string;
  config: ProjectConfig;
  getEsignRedirectUrlByLead: (status: string) => Promise<string>;
  removeParentOrTopOnIframe: boolean;
  allowCloseOnIframe: boolean;
  utilityStore: UtilityStore;
  buddyOfferConfigURL: string;
  partnerID: string;
}

const TermsOfAgreement = (props: TermsOfAgreementProps) => {
  const {
    submitApplicationResponse,
    embeddedSigningUrl,
    config,
    getEsignRedirectUrlByLead,
    removeParentOrTopOnIframe,
    allowCloseOnIframe,
    isProd,
    offerInsurance,
    utilityStore,
    buddyOfferConfigURL,
    partnerID,
  } = props;

  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [isAltContractVendorModalOpen, setIsAltContractVendorModalOpen] =
    useState(false);

  const termsOfAgreementFormik = useFormik({
    initialValues: {
      isInfoConfirmed: false,
      isEverythingAgreed: false,
    },
    validationSchema: Yup.object().shape({
      isInfoConfirmed: Yup.boolean(),
      // .required('You must confirm that all information is true and complete.')
      // .oneOf([true], 'You must confirm that all information is true and complete.'),
      isEverythingAgreed: Yup.boolean(),
      // .required('You must agree to our privacy policy, terms and conditions, and consent for electronic disclosures.')
      // .oneOf([true], 'You must agree to our privacy policy, terms and conditions, and consent for electronic disclosures.'),
    }),
    onSubmit: async (values) => {
      const {isInfoConfirmed, isEverythingAgreed} = values;

      const isSignwell = embeddedSigningUrl.includes('signwell');

      const doesSignwellExist = $('#SignWell-Modal-Embedded').length > 0;
      // eslint-disable-next-line no-console
      console.log('$(#SignWell-Modal-Embedded)', $('#SignWell-Modal-Embedded'));
      // eslint-disable-next-line no-console
      console.log('doesSignwellExist', doesSignwellExist);
      if (isSignwell && !doesSignwellExist && document) {
        // eslint-disable-next-line no-console
        console.log('appending script');
        const head = document.getElementsByTagName('head')[0];
        const script = document.createElement('script');
        script.src = 'https://static.signwell.com/assets/embedded.js';
        head.appendChild(script);
        // eslint-disable-next-line no-console
        console.log('terms of agreement appended script');
      }

      if (!isInfoConfirmed) {
        showToast(
          'error',
          'You must confirm that all information is true and complete.',
        );
      } else if (!isEverythingAgreed) {
        showToast(
          'error',
          'You must agree to our privacy policy, terms and conditions, and consent for electronic disclosures.',
        );
      } else {
        offerInsurance ? setShowInsuranceModal(true) : openSignwell();
      }
    },
  });

  const ref = useRef(null);

  const fixIOSIframeZoom = () => {
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);

    if (!isIOS) return;

    const modal = document.getElementById('SignWell-Modal-Embedded');
    if (modal) {
      modal.style.width = '100%';
      modal.style.height = `${window.innerHeight}px`;
    }

    const iframe = document.querySelector(
      '#SignWell-Embedded-Iframe-Container iframe',
    ) as any | null;

    if (iframe) {
      iframe.style.width = '160%';
      iframe.style.height = '100%';
      iframe.style.transform = 'scale(0.7)';
      iframe.style.transformOrigin = '0 0';
    }

    window.scrollTo(0, 1);
  };

  const openSignwell = useCallback(() => {
    const isSignwell = embeddedSigningUrl.includes('signwell');
    if (isSignwell) {
      // eslint-disable-next-line no-console
      console.log('terms of agreement good - launching new signwell modal');
      // eslint-disable-next-line no-console
      console.log('removeParentOrTopOnIframe', removeParentOrTopOnIframe);
      // eslint-disable-next-line no-console
      console.log('allowCloseOnIframe', allowCloseOnIframe);
      try {
        // @ts-ignore
        // eslint-disable-next-line no-undef
        const signWellEmbed = new SignWellEmbed({
          url: embeddedSigningUrl,
          allowClose: allowCloseOnIframe,
          iframeRedirect: removeParentOrTopOnIframe,
          events: {
            completed: async (e) => {
              fixIOSIframeZoom();
              // eslint-disable-next-line no-console
              console.log('terms of agreement agree completed event: ', e);
              const redirectUrl = await getEsignRedirectUrlByLead('completed');
              // eslint-disable-next-line no-console
              console.log('redirectUrl', redirectUrl);
            },
            closed: async (e) => {
              fixIOSIframeZoom();
              // eslint-disable-next-line no-console
              console.log('terms of agreement closed event: ', e);
              const redirectUrl = await getEsignRedirectUrlByLead('closed');
              // eslint-disable-next-line no-console
              console.log('redirectUrl', redirectUrl);
            },
            declined: async (e) => {
              fixIOSIframeZoom();
              // eslint-disable-next-line no-console
              console.log('terms of agreement declined event: ', e);
              const redirectUrl = await getEsignRedirectUrlByLead('declined');
              // eslint-disable-next-line no-console
              console.log('redirectUrl', redirectUrl);
            },
            error: (e) => {
              fixIOSIframeZoom();
              // eslint-disable-next-line no-console
              console.log('terms of agreement error event: ', e);
              showToast(
                'error',
                `Unable to retrieve document. Please try again or contact ${config.name} support at ${config.contactPhone}`,
              );
            },
          },
        });
        signWellEmbed.open();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('Could not open Signwell', error);
        showToast(
          'error',
          `An error has occurred. Please try again or contact ${config.name} support at ${config.contactPhone}`,
        );
      }
      setTimeout(fixIOSIframeZoom, 5000);
    } else {
      // eslint-disable-next-line no-console
      console.log('Defaulting to Panda Docs');
      setIsAltContractVendorModalOpen(true);
    }
  }, [
    allowCloseOnIframe,
    embeddedSigningUrl,
    getEsignRedirectUrlByLead,
    removeParentOrTopOnIframe,
  ]);

  const concludePurchaseProtection = useCallback(() => {
    setShowInsuranceModal(false);
    openSignwell();
  }, [openSignwell]);

  const purchaseInsuranceComponent = useMemo(() => {
    if (!offerInsurance) {
      // eslint-disable-next-line no-console
      console.debug('offer insurance is disabled');
      return;
    }
    return (
      <PurchaseInsurance
        isProd={isProd}
        onClick={concludePurchaseProtection}
        btnText={PROCEED_TO_ESIGN_TXT}
        showComponent={showInsuranceModal}
        submitApplicationResponse={submitApplicationResponse}
        utilityStore={utilityStore}
        buddyOfferConfigURL={buddyOfferConfigURL}
        partnerID={partnerID}
      />
    );
  }, [
    buddyOfferConfigURL,
    concludePurchaseProtection,
    isProd,
    offerInsurance,
    partnerID,
    showInsuranceModal,
    submitApplicationResponse,
    utilityStore,
  ]);

  return (
    <>
      {purchaseInsuranceComponent}
      <div
        ref={ref}
        className={classNames(
          'd-flex align-items-start justify-content-center min-vh-100',
          styles?.termsOfAgreement,
        )}>
        {isAltContractVendorModalOpen && (
          <AlternativeContractModalVendor
            isOpen={isAltContractVendorModalOpen}
            setIsOpen={setIsAltContractVendorModalOpen}
            embeddedSigningUrl={embeddedSigningUrl}
            getEsignRedirectUrlByLead={getEsignRedirectUrlByLead}
          />
        )}
        <TermsOfAgreementForm
          formik={termsOfAgreementFormik}
          submitApplicationResponse={submitApplicationResponse}
          offerInsurance={offerInsurance}
          config={config}
        />
      </div>
    </>
  );
};

interface TermsOfAgreementFormProps {
  formik: any;
  submitApplicationResponse: SubmitApplicationResponse;
  offerInsurance: boolean;
  config: ProjectConfig;
}

const TermsOfAgreementForm = (props: TermsOfAgreementFormProps) => {
  const {formik, submitApplicationResponse, offerInsurance, config} = props;

  const {
    _90DayAmount = null,
    firstPaymentAmount = null,
    firstPaymentDueDate = '',
    paymentFrequency = '',
    numberOfPayments = null,
    paymentAmount = null,
    totalContractAmount = null,
    termInMonths = null,
    epoDays = null,
    itemsOnLease = [],
  } = submitApplicationResponse;

  const [tooltipHovered, setTooltip] = useState(false);
  const earlyPurchaseOptionDays = epoDays || 90;
  const toggle = () => setTooltip(!tooltipHovered);

  useEffect(() => {
    const titleEl = document.getElementById('title');
    titleEl.scrollIntoView();
  }, []);

  return (
    <Form
      id="termsOfAgreementForm"
      onSubmit={formik.handleSubmit}
      onKeyDown={(e) => e.preventDefault()}
      className={classNames(
        'd-flex flex-column justify-content-center',
        styles?.termsOfAgreement__form,
      )}>
      <div
        className={classNames(
          'd-flex justify-content-center my-4',
          styles?.termsOfAgreement__form__container,
        )}>
        <div
          className={classNames(
            'p-3',
            styles?.termsOfAgreement__form__container__body,
          )}>
          <div
            id="title"
            className={classNames(
              'text-center pb-2',
              styles?.termsOfAgreement__form__container__body__title,
            )}>
            Terms of Agreement
          </div>

          <TermsOfAgreementBox
            title="First Payment"
            color="blue"
            className="text-center">
            <div>
              Your initial Lease payment is{' '}
              <span
                className={
                  styles?.termsOfAgreement__form__container__body__span
                }>
                {convertNumberToCurrency(firstPaymentAmount)}
              </span>
            </div>
            <div className="my-2">
              due on{' '}
              <span
                className={
                  styles?.termsOfAgreement__form__container__body__span
                }>
                {formatDate({f: 'user', d: firstPaymentDueDate})}
              </span>
            </div>
            <div>(includes tax and processing fee if applicable)</div>
          </TermsOfAgreementBox>

          <div className="my-3">
            We make every attempt to set your first payment date to your next
            pay date. If the date shown above does not meet your needs, please
            call us at 877-357-5474.
          </div>

          <TermsOfAgreementBox
            title={`${earlyPurchaseOptionDays} Day Early Purchase Option`}
            color="blue"
            className="text-center">
            <div>Total Payment</div>
            <div className="my-2">Amount</div>
            <div className="my-2">
              {' '}
              <span className="font-family-gotham-bold font-size_18px">
                {convertNumberToCurrency(_90DayAmount)}
              </span>
            </div>
          </TermsOfAgreementBox>

          <div className="my-3" />

          <TermsOfAgreementBox
            title={termInMonths + ' Months to Ownership'}
            color="blue">
            <Row className="text-center">
              <Col
                xs={12}
                xl={3}
                className="d-flex flex-column justify-content-between">
                <div>Payment Frequency</div>
                <div
                  className={classNames(
                    'mt-2 text-capitalize',
                    styles?.termsOfAgreement__form__container__body__description,
                  )}>
                  {(paymentFrequency || '').toLowerCase().replace(/_/g, ' ')}
                </div>
              </Col>

              <Col
                xs={12}
                xl={3}
                className="d-flex flex-column justify-content-between mt-2 mt-xl-0">
                <div># of Payments</div>
                <div
                  className={classNames(
                    'mt-2',
                    styles?.termsOfAgreement__form__container__body__description,
                  )}>
                  {numberOfPayments}
                </div>
              </Col>

              <Col
                xs={12}
                xl={3}
                className="d-flex flex-column justify-content-between mt-2 mt-xl-0">
                <div>Payment Amount</div>
                <div
                  className={classNames(
                    'mt-2',
                    styles?.termsOfAgreement__form__container__body__description,
                  )}>
                  {convertNumberToCurrency(paymentAmount)}
                </div>
              </Col>

              <Col
                xs={12}
                xl={3}
                className="d-flex flex-column justify-content-between mt-2 mt-xl-0">
                <div>Total Payment Amount</div>
                <div
                  className={classNames(
                    'mt-2',
                    styles?.termsOfAgreement__form__container__body__description,
                  )}>
                  {convertNumberToCurrency(totalContractAmount)}
                </div>
              </Col>
            </Row>
          </TermsOfAgreementBox>

          <TermsOfAgreementBox
            title="Early Purchase Options"
            color="yellow"
            className="my-4">
            If you wish to own the merchandise, you must make {numberOfPayments}{' '}
            payments over {termInMonths} months. However you have a{' '}
            <span
              className={
                styles?.termsOfAgreement__form__container__body__description
              }>
              {earlyPurchaseOptionDays} Day Early Purchase Option
            </span>
            <span id="earlyPurchaseInfo" className="mx-1">
              <FontAwesomeIcon
                icon={faInfoCircle}
                className={
                  styles?.termsOfAgreement__form__container__body__icon
                }
              />
            </span>
            <Tooltip
              placement="bottom"
              isOpen={tooltipHovered}
              target="earlyPurchaseInfo"
              toggle={toggle}>
              In order to exercise your {earlyPurchaseOptionDays} day option you
              must make all regularly scheduled payments on time and either make
              additional payments or a final lump sum payment prior to the
              expiration date.
            </Tooltip>
            available to you. Please see the details of this program when you
            sign your lease. In addition, after the {earlyPurchaseOptionDays}{' '}
            day early purchase option expires there are discounts available for
            you to obtain ownership of your items at any point during the
            remainder of the lease.
          </TermsOfAgreementBox>

          {itemsOnLease && itemsOnLease?.length > 0 && (
            <TermsOfAgreementBox color="blue" title="Items On Lease">
              <FilterTable
                className="rounded-bottom"
                columns={itemSplitColumns()}
                data={itemsOnLease}
                customStyles={dataTableCustomStyles}
              />
            </TermsOfAgreementBox>
          )}

          <div className="d-flex flex-row mb-1 mx-4 align-items-center">
            <div className="mr-2 mb-1">
              <InputField
                formik={formik}
                name="isInfoConfirmed"
                type="checkbox"
                className={classNames(
                  styles?.termsOfAgreement__form__container__body__checkbox,
                )}
              />
            </div>
            <div>I confirm all information is true and complete.</div>
          </div>

          <div className="d-flex flex-row mb-3 mx-4 align-items-center">
            <div className="mr-2 mb-1">
              <InputField
                formik={formik}
                name="isEverythingAgreed"
                type="checkbox"
                placeholder=""
                className={classNames(
                  styles?.termsOfAgreement__form__container__body__checkbox,
                )}
              />
            </div>
            <div>
              I agree to{' '}
              <a
                href={config.privacyPolicyLink}
                target="_blank"
                className={
                  styles?.termsOfAgreement__form__container__body__link
                }>
                Privacy Policy
              </a>
              ,{' '}
              <a
                href={config.termsOfServiceLink}
                target="_blank"
                className={
                  styles?.termsOfAgreement__form__container__body__link
                }>
                Terms and Conditions
              </a>
              , and{' '}
              <a
                href={config.electronicDisclosureLink}
                target="_blank"
                className={
                  styles?.termsOfAgreement__form__container__body__link
                }>
                Consent for Electronic Disclosures
              </a>
              .
            </div>
          </div>
        </div>
        <div className="d-flex justify-content-center my-4">
          <Button
            className={classNames(
              'text-uppercase w-auto px-md-2 px-5',
              styles?.termsOfAgreement__form__container__submitButton,
            )}
            type="submit"
            form="termsOfAgreementForm">
            {offerInsurance ? 'See Protection Benefits' : PROCEED_TO_ESIGN_TXT}
          </Button>
        </div>
      </div>
    </Form>
  );
};

export interface TermsOfAgreementBoxProps {
  children: React.ReactNode | React.ReactNode[];
  className?: string;
  title: string;
  color: string;
}

export const TermsOfAgreementBox = (props: TermsOfAgreementBoxProps) => {
  const {children, title, color, className} = props;
  const isItemsOnLease = title?.toLowerCase() === 'items on lease';
  return (
    <div
      className={classNames(
        styles?.termsOfAgreementBox,
        isEqual(color, 'blue') && styles?.termsOfAgreementBox__primaryBorder,
        isEqual(color, 'yellow') &&
          styles?.termsOfAgreementBox__earlyPurchaseBorder,
        className,
      )}>
      <div
        className={classNames(
          'p-1 text-center',
          styles?.termsOfAgreementBox__title,
          isEqual(color, 'blue') && styles?.termsOfAgreementBox__primaryBg,
          isEqual(color, 'yellow') &&
            styles?.termsOfAgreementBox__earlyPurchaseBg,
          isEqual(color, 'blue') && styles?.termsOfAgreementBox__white,
          isEqual(color, 'yellow') && styles?.termsOfAgreementBox__black,
        )}>
        {title}
      </div>
      <div className={isItemsOnLease ? 'p-0' : 'p-3'}>{children}</div>
    </div>
  );
};

export default TermsOfAgreement;







config/project-config.ts

interface TableStyleConfig {
  style: {
    background?: string;
    fontSize?: string;
    fontWeight?: string;
    color?: string;
    fontFamily?: string;
  };
}

export interface ProjectConfig {
  hours: string;
  contactEmail: string;
  contactPhone: string;
  contactFax: string;
  loginLogo: any;
  navbarLogo: any;
  helpGuidePath: string;
  mainLoggedInPage: string;
  isContactBarShown: boolean;
  privacyPolicyLink: string;
  termsOfServiceLink: string;
  contactUsLink: string;
  tableStyles: {
    headRow: TableStyleConfig;
    headCells: TableStyleConfig;
    rows: TableStyleConfig;
  };
  timeout: number;
  debounce: number;
  events: string[];
  searchBarPlaceholder: string;
  crossTab: boolean;
  website: string;
  electronicDisclosureLink: string;
  helpEmail: string;
  name: string;
  fullName: string;
  customerServiceEmail: string;
}

const BASE_CONFIG: Omit<
  ProjectConfig,
  | 'name'
  | 'fullName'
  | 'hours'
  | 'contactPhone'
  | 'contactFax'
  | 'loginLogo'
  | 'helpEmail'
  | 'privacyPolicyLink'
  | 'termsOfServiceLink'
  | 'electronicDisclosureLink'
  | 'website'
  | 'customerServiceEmail'
  | 'contactUsLink'
> = {
  contactEmail: 'app@uownleasing.com',
  navbarLogo: require('@images/company-logo-navbar.svg'),
  helpGuidePath: '/help-guide/HTML/uown-merchant-site.html',
  mainLoggedInPage: '/overview',
  isContactBarShown: true,
  tableStyles: {
    headRow: {
      style: {
        background: '#eaeaea',
      },
    },
    headCells: {
      style: {
        fontSize: '14px',
        fontWeight: '500',
        background: '#eaeaea',
        color: '#313131',
        fontFamily: 'Gotham-Medium',
      },
    },
    rows: {
      style: {
        fontFamily: 'Gotham-Book',
        fontSize: '14px',
        color: '#313131',
      },
    },
  },
  timeout: 15,
  debounce: 20,
  events: ['mousemove', 'keydown', 'keypress', 'mouseenter', 'mousewheel'],
  searchBarPlaceholder: 'Quick search by applicant name or reference #',
  crossTab: true,
};

const BRAND_CONFIGS = {
  kornerstone: {
    name: 'Kornerstone',
    fullName: 'Kornerstone living',
    hours: 'Mon-Sat 8am-12am ET; Sun 11am-11pm ET',
    contactPhone: '(888) 521-5111',
    contactFax: '',
    contactUsLink: 'https://uownleasing.com/contact-kornerstone-living/',
    loginLogo: require('@images/kornerstone-logo.svg'),
    helpEmail: 'support@kornerstoneliving.com',
    privacyPolicyLink: 'https://uownleasing.com/privacy-policy-kornerstone/',
    termsOfServiceLink: 'https://uownleasing.com/terms-of-service-kornerstone/',
    electronicDisclosureLink: 'https://uownleasing.com/kornerstone-electronic-disclosures/',
    website: 'https://www.kornerstoneliving.com/',
    customerServiceEmail: 'cs@kornerstoneliving.com',
  },
  uown: {
    name: 'Uown',
    fullName: 'Uown Leasing',
    hours: 'Mon-Sat 9AM-10PM ET; Sun 11AM-9PM ET',
    contactPhone: '(877) 353-8696',
    contactFax: '(877) 353-8706',
    contactUsLink: 'https://uownleasing.com/contact/',
    loginLogo: require('@images/company-logo-login.svg'),
    helpEmail: 'help@uownleasing.com',
    privacyPolicyLink: 'https://uownleasing.com/privacy-policy/',
    termsOfServiceLink: 'https://uownleasing.com/terms-of-service/',
    electronicDisclosureLink: 'https://uownleasing.com/electronic-disclosures/',
    website: 'https://uownleasing.com/',
    customerServiceEmail: 'customerservice@uownleasing.com',
  },
};

export const projectConfig = (isKornerstone: boolean): ProjectConfig => ({
  ...BASE_CONFIG,
  ...(isKornerstone ? BRAND_CONFIGS.kornerstone : BRAND_CONFIGS.uown),
});

export default projectConfig(false); // default Uown configuration






images/kornerstone-logo.svg





layout/side-nav/index.module.scss

.containers {
  color: var(--secondary);
  width: 300px;
  font-size: 12px;
  font-family: var(--gotham-book);
}





layout/side-nav/index.tsx

import React from 'react';
import {UtilityStore} from '@stores/utility';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faEnvelope, faFax, faPhone} from '@fortawesome/pro-light-svg-icons';
import {inject, observer} from 'mobx-react';
import Image from 'next/image';
import {Loader} from '@uownleasing/common-ui';
import styles from './index.module.scss';
import classNames from 'classnames';
import {ProjectConfig} from '@config/project-config';

interface SideNavLayoutLayoutProps {
  children: React.ReactNode;
  utilityStore?: UtilityStore;
  isKornerstone: boolean;
  config: ProjectConfig;
}

const SideNavLayout = (props: SideNavLayoutLayoutProps) => {
  const {children, utilityStore, isKornerstone, config} = props;

  return (
    <div className="d-flex flex-column flex-md-row w-100 vh-100 overflow_hidden">
      {utilityStore?.isLoading ? <Loader /> : <div />}
      <div
        className={classNames(
          'd-flex flex-column align-items-center justify-content-between',
          styles?.containers,
        )}>
        <div className="my-2 my-md-5 px-4">
          <Image
            src={config.loginLogo}
            alt={isKornerstone ? 'kornerstone Logo' : 'uOwn Logo'}
            className="d-flex align-self-start"
          />
        </div>

        <div className="d-flex flex-column justify-content-end py-2 py-md-5 w-100 background_ededed flex-grow-1">
          <div className="d-flex flex-row">
            <div>
              <FontAwesomeIcon
                className="width_50px"
                icon={faPhone}
                size="1x"
              />
            </div>

            <div>{config.contactPhone}</div>
          </div>

          {config.contactFax && (
            <div className="d-flex flex-row">
              <div>
                <FontAwesomeIcon
                  className="width_50px"
                  icon={faFax}
                  size="1x"
                />
              </div>

              <div>{config.contactFax}</div>
            </div>
          )}

          <div
            className="d-flex flex-row cursor-pointer"
            onClick={() =>
              window
                .open(`mailto:${config.customerServiceEmail}`, '_blank')
                .focus()
            }>
            <div>
              <FontAwesomeIcon
                className="width_50px"
                icon={faEnvelope}
                size="1x"
              />
            </div>

            <div>{config.customerServiceEmail}</div>
          </div>
        </div>
      </div>

      <div className="flex-row overflow-auto flex-grow-1">{children}</div>
    </div>
  );
};

export default inject('utilityStore')(observer(SideNavLayout));





layouts/auth/index.tsx

import CustomerSummary from '@components/customer-summary';
import InputApprovalAmountModal from '@components/input-approval-amount-modal';
import {MoveContractToSignedModal} from '@components/move-contract-to-signed-modal';
import config from '@config/project-config';
import {CustomerStatus} from '@enums/CustomerStatus';
import {light} from '@fortawesome/fontawesome-svg-core/import.macro';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {ApprovalAmount} from '@models';
import {AccountStore} from '@stores/account';
import {CustomerStore} from '@stores/customer';
import {UtilityStore} from '@stores/utility';
import {
  AlertBlock,
  AuthenticatedLayout,
  SearchResult,
  SearchType,
} from '@uownleasing/common-ui';
import {
  hasModifyPermission,
  hasRestrictedModifyPermission,
  hasViewPermission,
  isEqual,
  showToast,
} from '@uownleasing/common-utilities';
import {inject, observer} from 'mobx-react';
import Image from 'next/image';
import {useRouter} from 'next/router';
import React, {useEffect, useMemo, useRef, useState} from 'react';

export interface AuthWrapperProps {
  children: React.ReactNode | React.ReactNode[];
  accountStore?: AccountStore;
  customerStore?: CustomerStore;
  utilityStore?: UtilityStore;
  setRefAccount?: (refAccount: string) => void;
  className?: string;
  setReloadActivityLog?: (isReloadActivityLog: boolean) => void;
  title?: string;
  childButton?: React.ReactNode;
  isPageLoading?: boolean;
  enableLoader?: boolean;
}

const NavbarLogo = () => <Image src={config.navbarLogo} alt="company-logo" />;

const NEW_REVIEW_LOG_REFRESH_TIME = 60000 * 90; // 1.5 hours

const AuthWrapper = (props: AuthWrapperProps) => {
  const {
    accountStore,
    customerStore,
    utilityStore,
    children,
    className,
    childButton,
    setRefAccount,
    setReloadActivityLog,
    title,
    isPageLoading,
    enableLoader = true,
  } = props;
  const router = useRouter();
  const currentPath = (router?.asPath || '').toLowerCase();

  const [hasRecentlyMadeGetUsersRequest, setHasRecentlyMadeGetUsersRequest] =
    useState(false);
  const [usersOnPage, setUsersOnPage] = useState([]);
  const [displayInputApprovalAmountModal, setDisplayInputApprovalAmountModal] =
    useState(false);
  const [isChangingToApproved, setIsChangingToApproved] = useState(false);
  const [isMoveContractToSignedModalOpen, setIsMoveContractToSignedModalOpen] =
    useState(false);
  const isShowingAlert = customerStore?.isShowingAlert || false;
  const isLoggingOut = useRef(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>(
    customerStore?.quickSearchResults,
  );

  const getUsersOnPage = () => {
    setTimeout(async () => {
      setHasRecentlyMadeGetUsersRequest(true);
      const usersOnPageResponse = await utilityStore?.getUsersOnPage();
      setUsersOnPage(usersOnPageResponse);
      setTimeout(() => {
        setHasRecentlyMadeGetUsersRequest(false);
      }, 2000);
    }, 1000);
  };

  useEffect(() => {
    if (currentPath?.startsWith('/customers')) {
      getUsersOnPage();
    }
  }, []);

  useEffect(() => {
    const resetVisitedAccounts = setInterval(() => {
      customerStore?.setVisitedAccounts([]);
    }, NEW_REVIEW_LOG_REFRESH_TIME);

    return () => clearInterval(resetVisitedAccounts);
  }, []);

  const isCustomersPage = (currentPath || '').includes('customers');

  const accountPk = customerStore.accountPk || null;

  const isAlertsSummaryShown = useMemo(() => {
    return (
      isCustomersPage &&
      accountPk &&
      customerStore?.alertMessages &&
      customerStore?.alertMessages.length > 0
    );
  }, [accountPk, customerStore?.alertMessages, isCustomersPage]);

  useEffect(() => {
    utilityStore?.setPreviousPath(router?.asPath || '');
  }, [router?.asPath, utilityStore]);

  useEffect(() => {
    setSearchResults(customerStore?.quickSearchResults);
  }, [customerStore?.quickSearchResults]);

  const isLeadEligibleForAmtChange =
    customerStore.leadStatus &&
    (isEqual(customerStore.leadStatus, 'UW_APPROVED') ||
      isEqual(customerStore.leadStatus, 'CONTRACT_CREATED'));

  const handleClick = async (approvalAmount: number, comment: string) => {
    const currentLeadPk = customerStore?.leadPk();
    if (hasOverrideApprovalAmountPermission && isLeadEligibleForAmtChange) {
      const request: ApprovalAmount = {
        leadPk: currentLeadPk || null,
        approvalAmount: approvalAmount,
        comment: comment || '',
      };
      const response = await customerStore?.overrideApprovalAmount(request);
      const newApprovalAmount = response?.data?.newApprovalAmount || 0;
      const oldApprovalAmount = response?.data?.oldApprovalAmount || 0;
      if (response?.status === 200) {
        showToast(
          'success',
          `Successfully changed approval amount from $${oldApprovalAmount} to $${newApprovalAmount}`,
        );
      } else {
        showToast(
          'error',
          response?.message || 'Unable to change approval amount at this time',
        );
      }
    } else {
      const response = await customerStore?.changeLeadStatus({
        leadPk: currentLeadPk,
        newLeadStatus: CustomerStatus.UW_APPROVED,
        approvalAmount: approvalAmount,
        comment: comment || '',
      });

      if (response?.status === 200) {
        showToast(
          'success',
          'Successfully changed the approval status to approved.',
        );
        setReloadActivityLog(true);
      } else {
        showToast(
          'error',
          response?.message || 'Unable to change the status to approved.',
        );
      }
    }
  };

  const toggleAlerts = async () => {
    customerStore?.toggleAlerts(!isShowingAlert);
  };

  const InfoBar = () => {
    return (
      isCustomersPage && (
        <div
          className="d-flex flex-column w-100 z-index-secondary"
          key="customer-summary-container">
          <CustomerSummary
            setReloadActivityLog={setReloadActivityLog}
            setRefAccount={setRefAccount}
            customerName={customerStore.customerName()}
            status={customerStore.leadStatus}
            internalStatus={customerStore?.leadInfo?.internalStatus}
            moveToServicing={customerStore.moveToServicing}
            referenceNumber={(customerStore?.leadInfo?.leadPk || '').toString()}
            accountPk={(customerStore?.leadInfo?.accountPk || '').toString()}
            setIsCustomerLeaseModalOpen={
              utilityStore?.setIsCustomerLeaseModalOpen
            }
            isLeaseInfoAvailable={!!customerStore?.invoiceInfo}
            isEligibleToSettle={isEqual(
              customerStore?.leadStatus,
              CustomerStatus.SIGNED,
            )}
            isEligibleToResendESign={isEqual(
              customerStore?.leadStatus,
              CustomerStatus.CONTRACT_CREATED,
            )}
            primaryEmail={customerStore?.customerEmail()}
            handleResendESign={customerStore?.resendESign}
            isStatusDenied={isEqual(
              customerStore?.leadStatus,
              CustomerStatus.UW_DENIED,
            )}
            isStatusApproved={
              isEqual(customerStore?.leadStatus, CustomerStatus.UW_APPROVED) ||
              isEqual(customerStore?.leadStatus, CustomerStatus.ORDER_CANCELLED)
            }
            isInvoiceCreated={
              !!customerStore?.invoiceInfo?.invoiceInfo &&
              !isEqual(
                customerStore?.invoiceInfo?.invoiceInfo?.invoiceStatus,
                CustomerStatus.CANCELLED,
              )
            }
            invoiceNumber={
              customerStore?.invoiceInfo?.invoiceInfo?.merchantInvoiceNumber ||
              customerStore?.invoiceInfo?.invoiceInfo?.invoiceNumber ||
              ''
            }
            changeLeadStatus={customerStore.changeLeadStatus}
            leadPk={customerStore?.leadPk}
            permissions={accountStore?.permissions}
            isEligibleToChangeLeadStatus={
              isEqual(
                customerStore?.leadStatus,
                CustomerStatus.READY_TO_FUND,
              ) ||
              isEqual(customerStore?.leadStatus, CustomerStatus.FUNDING) ||
              isEqual(customerStore?.leadStatus, CustomerStatus.FUNDED)
            }
            isEligibleToExpireLead={
              isEqual(customerStore?.leadStatus, CustomerStatus.UW_APPROVED) ||
              isEqual(
                customerStore?.leadStatus,
                CustomerStatus.CONTRACT_CREATED,
              ) ||
              isEqual(customerStore?.leadStatus, CustomerStatus.SIGNED)
            }
            isEligibleToChangeApprovalStatus={
              isEqual(customerStore?.leadStatus, CustomerStatus.UW_DENIED) ||
              isEqual(customerStore?.leadStatus, CustomerStatus.DENIED)
            }
            isModifyInvoiceButtonShown={
              isEqual(customerStore?.leadStatus, CustomerStatus.SIGNED) ||
              isEqual(customerStore?.leadStatus, CustomerStatus.FUNDING) ||
              isEqual(customerStore?.leadStatus, CustomerStatus.FUNDED)
            }
            setDisplayInputApprovalAmountModal={(value) => {
              setDisplayInputApprovalAmountModal(value);
              if (!value) {
                setIsChangingToApproved(false);
              }
            }}
            setIsChangingToApproved={setIsChangingToApproved}
            setIsMoveContractToSignedModalOpen={
              setIsMoveContractToSignedModalOpen
            }
            setIsLeaseModified={customerStore?.setIsLeaseModified}
            isLoading={utilityStore?.isLoading}
            getDocumentStatus={customerStore?.getDocumentStatus}
            allowChangeToExpired={
              customerStore?.invoiceInfo?.merchantInfo?.allowChangeToExpired
            }
            SERVICING_URL={accountStore?.SERVICING_URL}
            approvalAmount={
              customerStore?.leadInfo?.maxApprovalAmount ||
              customerStore?.leadInfo?.approvalAmount
            }
            runUnderWriting={customerStore?.runUnderWriting}
            invoiceStatus={
              customerStore?.invoiceInfo?.invoiceInfo?.invoiceStatus || ''
            }
            setIsAddNewInvoice={customerStore?.setIsAddNewInvoice}
            checkRemainingApprovalAmount={
              customerStore?.checkRemainingApprovalAmount
            }
            sendTrustPilotInvitation={customerStore?.sendTrustpilotInvitation}
            blacklistAllItemsForLead={customerStore?.blacklistAllItemsForLead}
            createOrUpdateInvoiceInfo={customerStore?.createOrUpdateInvoiceInfo}
            invoiceInfo={customerStore?.invoiceInfo}
          />
          {isAlertsSummaryShown && (
            <AlertBlock
              accountPk={accountPk}
              allAlerts={customerStore?.alertMessages || []}
              hasShowAlertPermission={isShowingAlert}
              toggleAlerts={toggleAlerts}
            />
          )}
        </div>
      )
    );
  };

  Object.assign(config, {
    amsWebsiteUrl: accountStore?.amsWebsiteUrl || '',
  });

  const permissions = accountStore?.permissions;

  const hasOverviewViewPermission = hasViewPermission(permissions, 'overview');

  const hasCustomersViewPermission = hasViewPermission(
    permissions,
    'customers',
  );

  const hasLeadsViewPermission = hasViewPermission(permissions, 'leads');

  const hasFundingViewPermission = hasViewPermission(permissions, 'funding');

  const hasStateConfigsViewPermission = hasViewPermission(
    permissions,
    'stateConfigs',
  );

  const hasAlertsViewPermission = hasViewPermission(permissions, 'alerts');

  const hasCreateNewApplicationViewPermission = hasViewPermission(
    permissions,
    'newApplication',
  );

  const hasOverrideApprovalAmountPermission = hasModifyPermission(
    permissions,
    'customers',
    'override_approval_amount',
  );

  const hasMerchantViewPermission = hasViewPermission(permissions, 'merchant');
  const hasMerchantSettingViewPermission = hasViewPermission(
    permissions,
    'merchantSetting',
  );
  const hasBlacklistViewPermission = hasViewPermission(
    permissions,
    'blacklist',
  );
  const hasProgramViewPermission = hasViewPermission(permissions, 'programs');

  const hasProgramSettingsViewPermission = hasViewPermission(
    permissions,
    'programSettings',
  );

  const hasChangeApprovalStatusPermission = hasRestrictedModifyPermission(
    permissions,
    'lead_status_denied_to_approved',
  );

  const hasModificationReportViewPermission = hasViewPermission(
    permissions,
    'modificationReport',
  );

  const hasMerchantModificationHistoryViewPermission = hasViewPermission(
    permissions,
    'merchantModificationHistory',
  );

  const hasProgramModificationHistoryViewPermission = hasViewPermission(
    permissions,
    'programModificationHistory',
  );

  const haErrorLogViewPermission = hasViewPermission(permissions, 'errorLog');

  const hasRebateViewPermission = hasViewPermission(permissions, 'rebate');

  const hasOpenToBuyViewPermission = hasViewPermission(
    permissions,
    'openToBuy',
  );

  const hasFundingModificationHistoryViewPermission = hasViewPermission(
    permissions,
    'fundingModificationHistory',
  );

  const sidebarLinks = [
    {
      label: 'Overview',
      target: 'overview',
      permission: hasOverviewViewPermission,
      icon: <FontAwesomeIcon icon={light('home-lg-alt')} size="2x" />,
      onClick: async (path: string) => {
        utilityStore?.setIsLoading(true);
        await router?.push(`/${path}`);
      },
    },
    {
      label: 'Customers',
      target: 'customers',
      permission:
        hasCustomersViewPermission &&
        (!!accountPk || currentPath.startsWith('/customers/')),
      icon: <FontAwesomeIcon icon={light('users')} size="2x" />,
      onClick: async (path: string) => {
        utilityStore?.setIsLoading(true);
        await router?.push(`/${path}/${accountPk}`);
      },
    },
    {
      label: 'Leads',
      target: 'leads',
      permission: hasLeadsViewPermission,
      icon: <FontAwesomeIcon icon={light('user-group')} size="2x" />,
      onClick: async (path: string) => {
        utilityStore?.setIsLoading(true);
        await router?.push(`/${path}`);
      },
    },
    {
      label: 'Funding',
      target: 'funding',
      permission: hasFundingViewPermission,
      icon: <FontAwesomeIcon icon={light('funnel-dollar')} size="2x" />,
      onClick: async (path: string) => {
        utilityStore?.setIsLoading(true);
        await router?.push(`/${path}`);
      },
    },
    {
      label: 'Funding Modification History',
      target: 'fundingModificationHistory',
      permission: hasFundingModificationHistoryViewPermission,
      icon: (
        <FontAwesomeIcon icon={light('rectangle-vertical-history')} size="2x" />
      ),
      onClick: async (path: string) => {
        utilityStore?.setIsLoading(true);
        await router?.push(`/${path}`);
      },
    },
    {
      label: 'Modification Report',
      target: 'modificationReport',
      permission: hasModificationReportViewPermission,
      icon: <FontAwesomeIcon icon={light('file-invoice')} size="2x" />,
      onClick: async (path: string) => {
        utilityStore?.setIsLoading(true);
        await router?.push(`/${path}`);
      },
    },
    {
      label: 'Merchant Modification History',
      target: 'merchantModificationHistory',
      permission: hasMerchantModificationHistoryViewPermission,
      icon: (
        <FontAwesomeIcon
          icon={light('rectangle-history-circle-user')}
          size="2x"
        />
      ),
      onClick: async (path: string) => {
        utilityStore?.setIsLoading(true);
        await router?.push(`/${path}`);
      },
    },
    {
      label: 'Program Modification History',
      target: 'programModificationHistory',
      permission: hasProgramModificationHistoryViewPermission,
      icon: <FontAwesomeIcon icon={light('rectangle-history')} size="2x" />,
      onClick: async (path: string) => {
        utilityStore?.setIsLoading(true);
        await router?.push(`/${path}`);
      },
    },
    {
      label: 'Alerts',
      target: 'alerts',
      permission: hasAlertsViewPermission,
      icon: <FontAwesomeIcon icon={light('exclamation-square')} size="2x" />,
      onClick: async (path: string) => {
        utilityStore?.setIsLoading(true);
        await router?.push(`/${path}`);
      },
    },
    {
      label: 'Error Log',
      target: 'errorLog',
      permission: haErrorLogViewPermission,
      icon: <FontAwesomeIcon icon={light('exclamation-triangle')} size="2x" />,
      onClick: async (path: string) => {
        utilityStore?.setIsLoading(true);
        await router?.push(`/${path}`);
      },
    },
    {
      label: 'New Application',
      target: 'newApplication',
      permission: hasCreateNewApplicationViewPermission,
      icon: <FontAwesomeIcon icon={light('clipboard-list')} size="2x" />,
      onClick: async (path: string) => {
        utilityStore?.setIsLoading(true);
        await router.push(`/${path}`);
      },
    },
    {
      label: 'State Configs',
      target: 'stateConfigs',
      permission: hasStateConfigsViewPermission,
      icon: <FontAwesomeIcon icon={light('map-location')} size="2x" />,
      onClick: async (path: string) => {
        await router?.push(`/${path}`);
      },
    },
    {
      label: 'Merchant',
      target: 'merchant',
      permission: hasMerchantViewPermission,
      icon: <FontAwesomeIcon icon={light('user-cog')} size="2x" />,
      onClick: async (path: string) => {
        utilityStore?.setIsLoading(true);
        await router.push(`/${path}`);
      },
    },
    {
      label: 'Merchant Setting',
      target: 'merchantSetting',
      permission: hasMerchantSettingViewPermission,
      icon: <FontAwesomeIcon icon={light('users-cog')} size="2x" />,
      onClick: async (path: string) => {
        utilityStore?.setIsLoading(true);
        await router.push(`/${path}`);
      },
    },
    {
      label: 'Programs',
      target: 'programs',
      permission: hasProgramViewPermission,
      icon: <FontAwesomeIcon icon={light('cube')} size="2x" />,
      onClick: async (path: string) => {
        utilityStore?.setIsLoading(true);
        await router.push(`/${path}`);
      },
    },
    {
      label: 'Program Settings',
      target: 'programSettings',
      permission: hasProgramSettingsViewPermission,
      icon: <FontAwesomeIcon icon={light('cubes')} size="2x" />,
      onClick: async (path: string) => {
        utilityStore?.setIsLoading(true);
        await router.push(`/${path}`);
      },
    },
    {
      label: 'Rebate',
      target: 'rebate',
      permission: hasRebateViewPermission,
      icon: <FontAwesomeIcon icon={light('hand-holding-dollar')} size="2x" />,
      onClick: async (path: string) => {
        utilityStore?.setIsLoading(true);
        await router.push(`/${path}`);
      },
    },
    {
      label: 'Blacklist',
      target: 'blacklist',
      permission: hasBlacklistViewPermission,
      icon: <FontAwesomeIcon icon={light('user-lock')} size="2x" />,
      onClick: async (path: string) => {
        utilityStore?.setIsLoading(true);
        await router?.push(`/${path}`);
      },
    },
    {
      label: 'Open To Buy',
      target: 'openToBuy',
      permission: hasOpenToBuyViewPermission,
      icon: <FontAwesomeIcon icon={light('money-check-dollar')} size="2x" />,
      onClick: async (path: string) => {
        utilityStore?.setIsLoading(true);
        await router?.push(`/${path}`);
      },
    },
    {
      label: 'Viewing',
      target: 'viewing',
      permission:
        hasCustomersViewPermission && currentPath?.startsWith('/customers'),
      icon: <FontAwesomeIcon icon={light('eye')} size="2x" />,
      onClick: () => undefined,
      usersOnPage: usersOnPage,
      showUsersOnPage: async () => {
        if (!hasRecentlyMadeGetUsersRequest) {
          await getUsersOnPage();
        }
      },
    },
  ];

  const searchResultColumns = [
    {
      label: 'Name',
      key: 'customerName',
    },
    {
      label: 'Phone Number',
      key: 'phoneNumber',
    },
    {
      label: 'Account Pk',
      key: 'accountPk',
    },
    {
      label: 'Lead Pk',
      key: 'leadPk',
    },
  ];

  const moreResultsColumn = [
    {
      label: 'Invoice #',
      key: 'invoiceNumber',
    },
    {
      label: 'Status',
      key: 'leadStatus',
    },
    {
      label: 'SSN',
      key: 'ssn',
    },
    {
      label: 'UUID',
      key: 'uuid',
    },
    {
      label: 'Last 4 CC',
      key: 'last4CC',
    },
  ];

  const onSearchResultItemClick = async (
    searchResult: SearchResult,
    e?: React.MouseEvent,
  ) => {
    const leadPk = searchResult?.leadPk || null;
    const isMetaKeyPressed = e?.metaKey || false;
    if (leadPk && !isMetaKeyPressed) {
      await router.push(`/customers/${leadPk}`);
      return;
    } else if (!leadPk) {
      showToast('error', 'Unable to navigate to the target account.');
    }
  };

  const handleLogout = async () => {
    if (typeof window !== 'undefined') {
      if (!isLoggingOut.current) {
        isLoggingOut.current = true;
        const responseCode = await accountStore?.logout();
        if (typeof router !== 'undefined') {
          await router?.push('/');
        }
        return responseCode;
      } else {
        // eslint-disable-next-line no-console
        console.log('Already logging out');
        return 200;
      }
    }
  };

  const isLoading = enableLoader && (utilityStore.isLoading || isPageLoading);

  const searchTypeOptions = Object.keys(SearchType);
  const filteredSearchTypeOptions = searchTypeOptions?.filter(
    (option) =>
      option !== SearchType['Contract #'] &&
      option !== SearchType['Ref Account ID'],
  );

  return (
    <AuthenticatedLayout
      router={router}
      title={title}
      className={className}
      username={accountStore?.username}
      NavbarLogo={NavbarLogo}
      accountPk={accountPk}
      config={config}
      getSimpleSearchResults={customerStore?.getSimpleSearchResults}
      isLoading={isLoading}
      isSideBarCollapsed={utilityStore?.isSideBarCollapsed}
      logout={handleLogout}
      refresh={accountStore?.refresh}
      permissions={permissions}
      quickSearchResults={searchResults}
      setAccountPk={customerStore?.setAccountPk}
      setIsErrorCoolDown={utilityStore?.setIsErrorCoolDown}
      setIsLoading={utilityStore?.setIsLoading}
      setIsSideBarCollapsed={utilityStore?.setIsSideBarCollapsed}
      isSideBarShown
      userToken={accountStore?.userToken}
      onSearchResultItemClick={onSearchResultItemClick}
      childButton={childButton}
      hasSearchPermission={hasOverviewViewPermission}
      navbarLinks={[]}
      sidebarLinks={sidebarLinks}
      searchResultColumns={searchResultColumns}
      moreResultsColumn={moreResultsColumn}
      clearSavedUrl={() => utilityStore?.setPreviousPath('')}
      searchTypeOptions={filteredSearchTypeOptions}
      searchType={utilityStore?.searchType}
      setSearchType={utilityStore?.setSearchType}
      InfoBar={<InfoBar />}
      UserIcon={
        <FontAwesomeIcon icon={light('user-circle')} color="#fff" size="2x" />
      }>
      {displayInputApprovalAmountModal && (
        <InputApprovalAmountModal
          displayInputApprovalAmountModal={displayInputApprovalAmountModal}
          setDisplayInputApprovalAmountModal={
            setDisplayInputApprovalAmountModal
          }
          handleClick={handleClick}
          isLeadEligibleForAmtChange={isLeadEligibleForAmtChange}
          initialApprovalAmount={
            customerStore?.leadInfo?.maxApprovalAmount ||
            customerStore?.leadInfo?.approvalAmount
          }
          leadStatus={customerStore?.leadStatus}
          isChangingToApproved={isChangingToApproved}
        />
      )}
      {hasChangeApprovalStatusPermission && isMoveContractToSignedModalOpen && (
        <MoveContractToSignedModal
          onConfirm={async (comment) => {
            const response = await customerStore.changeLeadStatus({
              leadPk: accountPk,
              newLeadStatus: CustomerStatus?.SIGNED,
              comment,
            });
            return response?.message;
          }}
          isModalOpen={isMoveContractToSignedModalOpen}
          setIsModalOpen={setIsMoveContractToSignedModalOpen}
        />
      )}
      {children}
    </AuthenticatedLayout>
  );
};

export default inject(
  'accountStore',
  'customerStore',
  'utilityStore',
)(observer(AuthWrapper));





layouts/no-auth/index.tsx

import React from 'react';
import {inject, observer} from 'mobx-react';
import config from '@config/project-config';
import {UnauthenticatedLayout} from '@uownleasing/common-ui';
import {UtilityStore} from '@stores/utility';
import {useRouter} from 'next/router';
import Image from 'next/image';

const NavbarLogo = () => <Image src={config.navbarLogo} alt="company-logo" />;

export interface NoAuthWrapperProps {
  children: React.ReactNode | React.ReactNode[];
  utilityStore?: UtilityStore;
  isContactBarHidden?: boolean;
  isLoaderAlwaysOn?: boolean;
  isNavbarShown?: boolean;
}

const NoAuthWrapper = (props: NoAuthWrapperProps) => {
  const {
    children,
    utilityStore,
    isContactBarHidden,
    isNavbarShown,
    isLoaderAlwaysOn,
  } = props;
  const router = useRouter();
  return (
    <UnauthenticatedLayout
      pathname={router?.pathname}
      isLoading={isLoaderAlwaysOn || utilityStore?.isLoading}
      config={config}
      isContactBarShown={isContactBarHidden ? false : config.isContactBarShown}
      isNavbarShown={isNavbarShown}
      NavbarLogo={NavbarLogo}>
      {children}
    </UnauthenticatedLayout>
  );
};

export default inject('utilityStore')(observer(NoAuthWrapper));





pages/completeApplication/index.tsx

import IntellicheckToolkit from '@components/intellicheck-toolkit';
import ItemSplit from '@components/item-split';
import MissingDataPanel from '@components/missing-data-panel';
import MissingPaymentProgram from '@components/missing-payment-program';
import VerificationCancelledModal from '@components/modals/seon/seon-cancelled';
import SeonVerificationFailedModal from '@components/modals/seon/seon-failed';
import SeonVerificationComponent from '@components/seon/seonIdVerification';
import TermsOfAgreement from '@components/terms-of-agreement-form';
import VerificationMessage from '@components/verification-message';
import VerifyPhoneNumber from '@components/verify-phone-number';
import AdBlockDetectedModal from '@components/modals/adblock';
import NoAuthWrapper from '@layouts/no-auth';
import {GetMissingRequiredFieldsParams} from '@models';
import {CustomerStore} from '@stores/customer';
import {UtilityStore} from '@stores/utility';
import {
  handleKountSessionID,
  handlePostMessageCheck,
  loadKornerstoneTheme,
} from '@utils/helper';
import {isEqual, showToast} from '@uownleasing/common-utilities';

import * as Sentry from '@sentry/react';
import {useDetectAdBlock} from 'adblock-detect-react';
import $ from 'jquery';
import {inject, observer} from 'mobx-react';
import type {GetServerSideProps} from 'next';
import {useRouter} from 'next/router';
import Script from 'next/script';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {projectConfig} from '@config/project-config';

interface CompleteApplicationProps {
  utilityStore: UtilityStore;
  customerStore: CustomerStore;
  isLocalhost: boolean;
  isProd: boolean;
  clientID: string;
  SENTRY_DSN: string;
  NID: string;
  BUDDY_OFFER_CONFIG_URL: string;
  PARTNER_ID: string;
  SEON_LICENSE_KEY: string;
}

const CompleteApplication = ({
  customerStore,
  utilityStore,
  isLocalhost,
  isProd,
  clientID,
  SENTRY_DSN,
  NID,
  BUDDY_OFFER_CONFIG_URL,
  PARTNER_ID,
  SEON_LICENSE_KEY,
}: CompleteApplicationProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isBranded, setIsBranded] = useState(false);

  const [isIntellicheckCompleted, setIsIntellicheckCompleted] = useState(false);
  const [showCancelledModal, setShowCancelledModal] = useState(false);
  const [showFailedModal, setShowFailedModal] = useState(false);
  const [showAdBlockModal, setShowAdBlockModal] = useState(false);
  const [isReinitializing, setIsReinitializing] = useState(false);
  const [isSeonCompleted, setIsSeonCompleted] = useState(false);
  const initializedRef = useRef(false);
  const [isIdVerificationPassed, setIsIdVerificationPassed] = useState(false);
  const [isMissingPayDates, setIsMissingPayDates] = useState(false);
  const [filteredMissingFields, setFilteredMissingFields] = useState([]);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [optionalAchText, setOptionalAchText] = useState<string[]>([]);
  const [merchantRefCode, setMerchantRefCode] = useState('');
  const [currentLeadPk, setCurrentLeadPk] = useState<number>(null);
  const [offerInsurance, setOfferInsurance] = useState(false);
  const [seonTouched, setSeonTouched] = useState(false);
  const [isKornerstoneCustomer, setIsKornerstoneCustomer] = useState(false);
  const config = useMemo(
    () => projectConfig(isKornerstoneCustomer),
    [isKornerstoneCustomer],
  );
  const adBlockDetected = useDetectAdBlock();

  const isTargetFlagPresent = (name: string) => {
    return (router?.query?.[name] || '') === 'true';
  };

  useEffect(() => {
    if (!Sentry.getClient()) {
      try {
        // eslint-disable-next-line no-console
        console.log('S INIT()');
        Sentry.init({
          dsn: SENTRY_DSN,
          debug: false,
          environment: isProd ? 'production' : 'development',
          replaysOnErrorSampleRate: 0,
          replaysSessionSampleRate: 1.0,
          integrations: [],
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('Sentry already init()', error);
      }
    }
  });

  const replayInit = () => {
    const replay = Sentry.getReplay();
    if (!replay) {
      try {
        const integration = Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
          maskAllInputs: false,
          minReplayDuration: 1000,
          stickySession: true,
          networkDetailAllowUrls: [
            window.location.origin,
            'https://ssl.kaptcha.com',
            'https://receiver.neuroid.cloud',
          ],
          networkRequestHeaders: ['X-Custom-Header'],
          networkResponseHeaders: ['X-Custom-Header'],
        });
        Sentry.addIntegration(integration);
        // eslint-disable-next-line no-console
        console.log('handlerRecordId', 'Rep init()');
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('handlerRecordId', 'Rep instance already exists', error);
      }
    } else {
      try {
        replay?.start();
        // eslint-disable-next-line no-console
        console.log('handlerRecordId', 'Rep start()');
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('handlerRecordId', 'Rep failed to start', error);
      }
    }
  };

  const getMissingRequiredFields = async (payFrequency = '') => {
    setIsBranded(isTargetFlagPresent('isBranded'));
    const payFreq = router?.query?.selectedPaymentFrequency || '';
    const selectedPaymentFrequency = payFrequency || payFreq || '';
    const getMissingRequiredFieldsRequest: GetMissingRequiredFieldsParams = {
      uuid: router?.query?.uuid || '',
      shortCode: '',
      selectedPaymentFrequency: selectedPaymentFrequency,
    };
    const {data, message, status} = await utilityStore.getMissingRequiredFields(
      getMissingRequiredFieldsRequest,
    );

    if (data && status === 200) {
      const fName = data?.customerFirstName || '';
      const lName = data?.customerLastName || '';
      const hasName = fName || lName;
      const fullName = `${fName} ${lName}`;
      const text =
        typeof data?.optionalAchText === 'string'
          ? JSON.stringify(data.optionalAchText)
          : '';
      const optionalStrings = (text || '')?.split('\\n') || [];
      const stringsToDisplay = optionalStrings?.map((str) =>
        str?.replace(/["\\]/g, ''),
      );
      setOptionalAchText(stringsToDisplay);
      setCurrentLeadPk(data?.leadPk || null);

      Sentry?.setUser({
        id: data?.leadPk,
        username: hasName
          ? `${fullName} - ${data?.leadPk || ''}`
          : String(data?.leadPk),
      });

      if (data?.recordSigningFlow) {
        replayInit();
      }

      setMerchantRefCode(data?.merchantRefCode || '');

      setOfferInsurance(data?.isOfferInsuranceRequired);
    }

    if (data?.leadPk) {
      initializeCustomerInfo(data?.leadPk);
    }

    if (
      utilityStore?.missingFields.includes('lastPayDate') ||
      utilityStore?.missingFields.includes('nextPayDate') ||
      utilityStore?.missingFields.includes('payFrequency')
    ) {
      setIsMissingPayDates(true);
    } else {
      setIsMissingPayDates(false);
    }

    if (
      data?.idCheckPassed ||
      isLocalhost ||
      !utilityStore?.isIdCheckRequired
    ) {
      setIsIdVerificationPassed(true);
    }

    utilityStore.setIsLoading(false);
    if (status === 200) {
      setIsLoaded(true);
    } else {
      showToast('error', message);
    }
  };

  const initializeCustomerInfo = async (leadPk: number) => {
    await customerStore?.setAccountPk(leadPk);
    await customerStore?.getEmploymentInfo(leadPk);
  };

  useEffect(() => {
    utilityStore.setIsLoading(true);
    const UUID = router?.query?.uuid;
    if (UUID) {
      getMissingRequiredFields();
    }
    setIsKornerstoneCustomer(loadKornerstoneTheme());
  }, [router?.query?.uuid, utilityStore]);

  useEffect(() => {
    if (isIntellicheckCompleted) {
      utilityStore?.getIntellicheckResults();
    }
  }, [isIntellicheckCompleted]);

  const handleSubmitApplication = async (reqData: any) => {
    const submitApplicationResponse = await utilityStore?.submitApplication(
      reqData,
    );
    const {message, status} = submitApplicationResponse;

    const embeddedSigningUrl =
      utilityStore?.submitApplicationResponse?.embeddedSigningUrl || '';
    const isSignwell = embeddedSigningUrl?.includes('signwell') || false;

    const removeParentOrTopOnIframe =
      utilityStore?.submitApplicationResponse?.removeParentOrTopOnIframe ||
      false;

    const allowCloseOnIframe =
      utilityStore?.submitApplicationResponse?.allowCloseOnIframe || false;

    if (message) {
      showToast('error', message);
      if (status === 412) {
        utilityStore?.setIsLoading(true);
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.reload();
          } else {
            router?.reload();
          }
        }, 2000);
      }
    } else if (isSignwell && embeddedSigningUrl) {
      const doesSignwellExist = $('#SignWell-Modal-Embedded').length > 0;

      // eslint-disable-next-line no-console
      console.log(
        'complete application pre-load $(#SignWell-Modal-Embedded)',
        $('#SignWell-Modal-Embedded'),
      );
      // eslint-disable-next-line no-console
      console.log(
        'complete application pre-load doesSignwellExist',
        doesSignwellExist,
      );

      if (!doesSignwellExist && document) {
        // eslint-disable-next-line no-console
        console.log('complete application pre-load appending script');
        const head = document.getElementsByTagName('head')[0];
        const script = document.createElement('script');
        script.src = 'https://static.signwell.com/assets/embedded.js';
        head.appendChild(script);
        // eslint-disable-next-line no-console
        console.log('complete application pre-load appended script');
      }

      // eslint-disable-next-line no-console
      console.log('removeParentOrTopOnIframe', removeParentOrTopOnIframe);
      // eslint-disable-next-line no-console
      console.log('allowCloseOnIframe', allowCloseOnIframe);

      // @ts-ignore
      // eslint-disable-next-line no-undef
      const signWellEmbed = new SignWellEmbed({
        allowClose: allowCloseOnIframe,
        iframeRedirect: removeParentOrTopOnIframe,
        events: {
          completed: async (e) => {
            // eslint-disable-next-line no-console
            console.log('complete application pre-load completed event: ', e);
            const redirectUrl = await utilityStore?.getEsignRedirectUrlByLead(
              'completed',
            );
            // eslint-disable-next-line no-console
            console.log('redirectUrl', redirectUrl);
          },
          closed: async (e) => {
            // eslint-disable-next-line no-console
            console.log('complete application pre-load closed event: ', e);
            const redirectUrl = await utilityStore?.getEsignRedirectUrlByLead(
              'closed',
            );
            // eslint-disable-next-line no-console
            console.log('redirectUrl', redirectUrl);
          },
          declined: async (e) => {
            // eslint-disable-next-line no-console
            console.log('complete application pre-load declined event: ', e);
            const redirectUrl = await utilityStore?.getEsignRedirectUrlByLead(
              'declined',
            );
            // eslint-disable-next-line no-console
            console.log('redirectUrl', redirectUrl);
          },
          error: (e) => {
            // eslint-disable-next-line no-console
            console.log('complete application pre-load error event: ', e);
            showToast(
              'error',
              `Unable to retrieve document. Please try again or contact ${config.name} support at ${config.contactPhone}`,
            );
          },
        },
      });
      signWellEmbed.open();
      $('#SignWell-Modal-Embedded').addClass('d-none').removeClass('d-block');
    } else {
      // eslint-disable-next-line no-console
      console.log(
        'The following embeddedSigningUrl was received:',
        embeddedSigningUrl,
      );
      utilityStore?.setIsLoading(true);
      await router?.push('/landing-page');
      utilityStore?.setIsLoading(false);
    }

    return submitApplicationResponse;
  };

  const handleNext = async (req: {
    lastPayDate: string;
    nextPayDate: string;
    payFrequency: string;
  }) => {
    const response = await customerStore?.createOrUpdateEmployment({
      ...customerStore?.employmentInfo?.employmentInfo,
      lastPayDate: req?.lastPayDate,
      nextPayDate: req?.nextPayDate,
      payFrequency: req?.payFrequency,
    });

    if (!response) {
      utilityStore?.setIsLoading(true);
      await getMissingRequiredFields();
      utilityStore?.setIsLoading(false);
    }
  };

  useEffect(() => {
    let missingFields = utilityStore?.missingFields || [];
    missingFields = isMissingPayDates
      ? missingFields?.filter(
          (field) =>
            !isEqual(field, 'desiredPaymentFrequency') &&
            (isEqual(field, 'nextPayDate') ||
              isEqual(field, 'lastPayDate') ||
              isEqual(field, 'payFrequency')),
        )
      : missingFields?.filter(
          (field) => !isEqual(field, 'desiredPaymentFrequency'),
        );

    setFilteredMissingFields(missingFields);
  }, [utilityStore?.missingFields, isMissingPayDates]);

  const paymentProgramData = customerStore?.paymentProgramData || [];
  const getPaymentProgram = async () => {
    const leadPk = utilityStore?.leadPk || null;
    await customerStore?.getPaymentOptions(leadPk);
  };

  const missingPurchaseNowItems =
    utilityStore?.missingFields?.includes('purchaseNowItem');
  const missingDesiredPaymentFrequency = utilityStore?.missingFields?.includes(
    'desiredPaymentFrequency',
  );
  const isBankVerificationRequired = utilityStore?.isBankVerificationRequired;
  const redirectUrl = customerStore?.redirectUrl;

  useEffect(() => {
    if (utilityStore.recordSigningFlow) {
      const replayId = Sentry.getReplay()?.getReplayId();
      if (replayId && currentLeadPk) {
        const idSent = sessionStorage?.getItem('sentUuid');
        const isSameId = idSent && idSent === replayId;

        if (!isSameId) {
          // eslint-disable-next-line no-console
          console.log('handlerRecordId - sent replayId', replayId);
          customerStore?.storeRecordingInfo(currentLeadPk, replayId);
        }
      }

      if (!replayId) {
        replayInit();
      }
    }
  }, [currentLeadPk, customerStore, utilityStore.recordSigningFlow]);

  const handleSeonReinitialize = async () => {
    setIsReinitializing(true);
    try {
      setShowCancelledModal(false);
      setShowFailedModal(false);
      setTimeout(() => window.location.reload(), 100);
    } finally {
      setIsReinitializing(false);
    }
  };

  const handleCancelled = () => {
    setShowCancelledModal(true);
  };

  const handleFailed = () => {
    setShowFailedModal(true);
  };

  useEffect(() => {
    const handlePostMessageEvent = (event) => {
      if (event?.data === 'uown_success') {
        // eslint-disable-next-line no-console
        console.log(
          event?.data,
          ' was sent to top window from completeApplication page',
        );
      }
    };

    if (redirectUrl && !isLoading) {
      // eslint-disable-next-line no-console
      console.log('REDIRECTING...');
      showToast(
        'success',
        'Thank you for signing your lease. You will now be redirected...',
      );
      handlePostMessageCheck(
        redirectUrl,
        'Post Message sent on completeApplication page.',
      );
      utilityStore?.setIsLoading(true);

      if (typeof window !== 'undefined') {
        window.addEventListener('message', handlePostMessageEvent);
      }

      setTimeout(async () => {
        const integration = Sentry.getReplay();
        if (integration != null) {
          await integration.flush();
        } else {
          console.error('Rep flush failed integration reference is null');
        }
      }, 1000);

      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 2000);
    }

    return () => window?.removeEventListener('message', handlePostMessageEvent);
  }, [redirectUrl]);

  useEffect(() => {
    setIsLoading(false);

    return () => {
      customerStore?.setRedirectUrl(undefined);
      utilityStore?.setSubmitApplicationResponse(undefined);
    };
  }, []);

  useEffect(() => {
    if (utilityStore.idCheckProvider === 'SEON' && adBlockDetected) {
      setShowAdBlockModal(true);
    }
  }, [adBlockDetected, utilityStore.idCheckProvider]);

  return (
    <NoAuthWrapper isContactBarHidden={!isBranded} isNavbarShown={isBranded}>
      <VerificationCancelledModal
        isOpen={showCancelledModal}
        setIsOpen={setShowCancelledModal}
        onReinitialize={handleSeonReinitialize}
        isLoading={isReinitializing}
      />
      <SeonVerificationFailedModal
        isOpen={showFailedModal}
        setIsOpen={setShowFailedModal}
        onReinitialize={handleSeonReinitialize}
        isLoading={isReinitializing}
      />
      <AdBlockDetectedModal
        isOpen={showAdBlockModal}
        setIsOpen={setShowAdBlockModal}
        onReinitialize={handleSeonReinitialize}
        isLoading={isReinitializing}
      />
      {utilityStore?.isIdCheckRequired && !isIdVerificationPassed && (
        <>
          {utilityStore.idCheckProvider === 'SEON' && (
            <SeonVerificationComponent
              utilityStore={utilityStore}
              SEON_LICENSE_KEY={SEON_LICENSE_KEY}
              initializedRef={initializedRef}
              onCancelled={handleCancelled}
              onFailed={handleFailed}
              setIsSeonCompleted={setIsSeonCompleted}
              onVerificationEventTriggered={() => setSeonTouched(true)}
            />
          )}

          {utilityStore?.idCheckProvider === 'INTELLICHECK' && (
            <Script
              type="text/javascript"
              src="/IDN-UI-Toolkit/IDN-Base/IDN-Base.js"
            />
          )}
        </>
      )}
      <Script
        type="text/javascript"
        src="https://static.signwell.com/assets/embedded.js"
      />
      {utilityStore?.isBankVerificationSubmitted ? (
        <VerificationMessage
          title="Check Your Inbox"
          message={`Thank you for selecting ${config.fullName} to provide you with a
                simple Lease to Own payment program. To complete your purchase,
                please check your email for the next step.`}
          secondaryMessage="Don't see the email? Please check your spam folder."
        />
      ) : !isLoading &&
        utilityStore?.submitApplicationResponse &&
        utilityStore?.submitApplicationResponse?.embeddedSigningUrl ? (
        <TermsOfAgreement
          config={config}
          isProd={isProd}
          buddyOfferConfigURL={BUDDY_OFFER_CONFIG_URL}
          partnerID={PARTNER_ID}
          offerInsurance={offerInsurance}
          submitApplicationResponse={utilityStore?.submitApplicationResponse}
          embeddedSigningUrl={
            utilityStore?.submitApplicationResponse?.embeddedSigningUrl
          }
          getEsignRedirectUrlByLead={utilityStore?.getEsignRedirectUrlByLead}
          removeParentOrTopOnIframe={
            utilityStore?.submitApplicationResponse
              ?.removeParentOrTopOnIframe || false
          }
          allowCloseOnIframe={
            utilityStore?.submitApplicationResponse?.allowCloseOnIframe || false
          }
          utilityStore={utilityStore}
        />
      ) : (
        <div id="missingDataPanelContainer" className="h-100">
          {isLoaded &&
            !isIdVerificationPassed &&
            utilityStore?.isIdCheckRequired &&
            utilityStore?.idCheckProvider === 'INTELLICHECK' && (
              <IntellicheckToolkit
                setIsIntellicheckCompleted={setIsIntellicheckCompleted}
              />
            )}

          {utilityStore?.phoneVerificationRequired &&
          !phoneVerified &&
          isIdVerificationPassed ? (
            <VerifyPhoneNumber
              config={config}
              leadPk={utilityStore?.leadPk}
              verifyPhoneNumber={customerStore?.verifyPhoneBeforeSigning}
              setPhoneVerified={setPhoneVerified}
            />
          ) : (
            isLoaded &&
            (!utilityStore?.isIdCheckRequired ||
              (utilityStore?.idCheckProvider === 'SEON' &&
                (isSeonCompleted || seonTouched)) ||
              (utilityStore?.idCheckProvider === 'INTELLICHECK' &&
                isIntellicheckCompleted) ||
              isIdVerificationPassed) && (
              <>
                {!isMissingPayDates &&
                missingDesiredPaymentFrequency &&
                !isBankVerificationRequired ? (
                  <MissingPaymentProgram
                    paymentFrequencyData={paymentProgramData}
                    getPaymentProgram={getPaymentProgram}
                    setPaymentFrequency={async (payFreq) => {
                      await utilityStore?.setIsLoading(true);
                      await utilityStore?.setSelectedPaymentFrequency(payFreq);
                      await getMissingRequiredFields(payFreq);
                      await utilityStore?.setIsLoading(false);
                    }}
                  />
                ) : missingPurchaseNowItems ? (
                  <ItemSplit
                    utilityStore={utilityStore}
                    itemPaymentSummary={utilityStore?.itemPaymentSummary}
                    config={config}
                  />
                ) : (
                  <MissingDataPanel
                    config={config}
                    missingFields={filteredMissingFields}
                    authorizeCreditCard={utilityStore?.authorizeCreditCard}
                    achDiscount={utilityStore?.achDiscount || null}
                    feeToBeCharged={utilityStore?.feeToBeCharged || null}
                    securityDeposit={utilityStore?.securityDeposit || null}
                    signingFeeExists={utilityStore?.signingFeeExists}
                    submitApplication={
                      isMissingPayDates ? handleNext : handleSubmitApplication
                    }
                    isLoading={utilityStore?.isLoading}
                    setIsLoading={utilityStore?.setIsLoading}
                    firstPayDate={utilityStore?.firstPaymentDate}
                    utilityStore={utilityStore}
                    isMissingPayDates={isMissingPayDates}
                    handleKountSessionID={(formik, setSubmitted) =>
                      handleKountSessionID(
                        clientID,
                        isProd,
                        formik,
                        undefined,
                        setSubmitted,
                      )
                    }
                    itemPaymentSummary={utilityStore?.itemPaymentSummary}
                    leadPk={currentLeadPk}
                    optionalAchText={optionalAchText}
                    NID={NID}
                    merchantRefCode={merchantRefCode}
                  />
                )}
              </>
            )
          )}
        </div>
      )}
    </NoAuthWrapper>
  );
};

type Props = {
  isLocalhost: boolean;
  clientID: string;
  isProd: boolean;
  SENTRY_DSN: string;
  NID: string;
  PARTNER_ID: string;
  BUDDY_OFFER_CONFIG_URL: string;
};

export const getServerSideProps: GetServerSideProps<Props> = async (
  context,
) => ({
  props: {
    isLocalhost: context?.req?.headers?.host?.includes('localhost') || false,
    isProd:
      context?.req?.headers?.host?.includes('prd') ||
      context?.req?.headers?.host?.includes('prod') ||
      context?.req?.headers?.host?.includes('merchant') ||
      false,
    clientID: process.env.KOUNTMID || null,
    SENTRY_DSN:
      process.env.SENTRY_DSN ||
      'https://8be28f7fbc68047b6933193afb61c007@o4506266512916480.ingest.sentry.io/4506266517766144',
    NID: process.env.NID || null,
    BUDDY_OFFER_CONFIG_URL:
      process.env.BUDDY_OFFER_CONFIG_URL ||
      'https://staging.embed.buddy.insure/aon/aon-purchaseprotection-config-react.js',
    SEON_LICENSE_KEY: process.env.SEON_LICENSE_KEY || null,
    ID_CHECK_PROVIDER: process.env.ID_CHECK_PROVIDER || '',
    PARTNER_ID: process.env.PARTNER_ID || 'p-buddytest',
  },
});

export default inject(
  'customerStore',
  'utilityStore',
)(observer(CompleteApplication));





pages/completeEsign/index.tsx

import React, {useCallback, useEffect, useState} from 'react';
import {inject, observer} from 'mobx-react';
import {UtilityStore} from '@stores/utility';
import NoAuthWrapper from '@layouts/no-auth';
import {CustomerStore} from '@stores/customer';
import Script from 'next/script';
import {useRouter} from 'next/router';
import VerifyPhoneNumber from '@components/verify-phone-number';
import {showToast} from '@uownleasing/common-utilities';
import $ from 'jquery';
import {EsignContractBody} from '@models';
import MissingPaymentProgram from '@components/missing-payment-program';
import TermsOfAgreement from '@components/terms-of-agreement-form';
import config from '@config/project-config';

interface CompleteEsignProps {
  customerStore: CustomerStore;
  utilityStore: UtilityStore;
}

const CompleteEsign = (props: CompleteEsignProps) => {
  const {customerStore, utilityStore} = props;
  const [phoneVerified, setPhoneVerified] = useState(false);
  const router = useRouter();
  const leadPk = utilityStore?.leadPk || null;
  const uuid = router?.query?.uuid;
  const shortCode = router?.query?.shortCode;
  const stringShortCode: string =
    (typeof shortCode === 'string' && shortCode) || '';
  const stringUuid: string = (typeof uuid === 'string' && uuid) || '';
  const fpd = utilityStore?.firstPaymentDate || '';
  const frequency = utilityStore?.selectedPaymentFrequency || '';

  const getEsignFields = async () => {
    if (stringUuid) {
      const response = await utilityStore?.getEsignFields(
        stringUuid,
        stringShortCode,
      );
      const {status, message} = response;

      if (status !== 200) {
        showToast(
          'error',
          message ||
            'An error has occurred. Please contact UOwn customer support if the problem persist.',
        );
      }
    }
  };

  const handleGenerateEsignContract = async () => {
    const body: EsignContractBody = {
      leadPk: utilityStore?.leadPk || null,
      desiredPaymentFrequency: frequency,
      firstPaymentDate: fpd,
    };
    const response = await utilityStore?.generateEsignContract(body);
    const {status, message} = response;
    if (status === 200) {
      const embeddedSigningUrl =
        utilityStore?.submitApplicationResponse?.embeddedSigningUrl || '';
      const isSignwell = embeddedSigningUrl?.includes('signwell') || false;
      const removeParentOrTopOnIframe =
        utilityStore?.submitApplicationResponse?.removeParentOrTopOnIframe ||
        false;
      const allowCloseOnIframe =
        utilityStore?.submitApplicationResponse?.allowCloseOnIframe || false;

      if (isSignwell && embeddedSigningUrl) {
        const doesSignwellExist = $('#SignWell-Modal-Embedded').length > 0;

        // eslint-disable-next-line no-console
        console.log(
          'complete application pre-load $(#SignWell-Modal-Embedded)',
          $('#SignWell-Modal-Embedded'),
        );
        // eslint-disable-next-line no-console
        console.log(
          'complete application pre-load doesSignwellExist',
          doesSignwellExist,
        );

        if (!doesSignwellExist && document) {
          // eslint-disable-next-line no-console
          console.log('complete application pre-load appending script');
          const head = document.getElementsByTagName('head')[0];
          const script = document.createElement('script');
          script.src = 'https://static.signwell.com/assets/embedded.js';
          head.appendChild(script);
          // eslint-disable-next-line no-console
          console.log('complete application pre-load appended script');
        }

        // eslint-disable-next-line no-console
        console.log('removeParentOrTopOnIframe', removeParentOrTopOnIframe);
        // eslint-disable-next-line no-console
        console.log('allowCloseOnIframe', allowCloseOnIframe);

        // @ts-ignore
        // eslint-disable-next-line no-undef
        const signWellEmbed = new SignWellEmbed({
          allowClose: allowCloseOnIframe,
          iframeRedirect: removeParentOrTopOnIframe,
          events: {
            completed: async (e) => {
              // eslint-disable-next-line no-console
              console.log('complete application pre-load completed event: ', e);
              const redirectUrl = await utilityStore?.getEsignRedirectUrlByLead(
                'completed',
              );
              // eslint-disable-next-line no-console
              console.log('redirectUrl', redirectUrl);

              if (redirectUrl) {
                showToast(
                  'success',
                  'Thank you for signing your lease. You will now be redirected...',
                );
                window.location.href = redirectUrl;
              } else {
                // eslint-disable-next-line no-console
                console.log(
                  'No redirect url returned so no redirect will happen from our end',
                );
              }
            },
            closed: async (e) => {
              // eslint-disable-next-line no-console
              console.log('complete application pre-load closed event: ', e);
              const redirectUrl = await utilityStore?.getEsignRedirectUrlByLead(
                'closed',
              );
              // eslint-disable-next-line no-console
              console.log('redirectUrl', redirectUrl);
            },
            declined: async (e) => {
              // eslint-disable-next-line no-console
              console.log('complete application pre-load declined event: ', e);
              const redirectUrl = await utilityStore?.getEsignRedirectUrlByLead(
                'declined',
              );
              // eslint-disable-next-line no-console
              console.log('redirectUrl', redirectUrl);

              if (redirectUrl) {
                showToast('success', 'You will now be redirected...');
                window.location.href = redirectUrl;
              } else {
                // eslint-disable-next-line no-console
                console.log(
                  'No redirect url returned so no redirect will happen from our end',
                );
              }
            },
          },
        });
        signWellEmbed.open();
        $('#SignWell-Modal-Embedded').addClass('d-none').removeClass('d-block');
      }
    } else {
      showToast(
        'error',
        message ||
          'An error has occurred. Please contact UOwn customer support if the problem persist.',
      );
    }
  };

  useEffect(() => {
    getEsignFields();
  }, [uuid]);

  const selectPaymentProgramStep =
    utilityStore?.paymentPrograms && utilityStore?.paymentPrograms?.length > 0;

  useEffect(() => {
    if (fpd && frequency) {
      utilityStore?.setPaymentPrograms([]);
      handleGenerateEsignContract();
    }
  }, [fpd, frequency]);

  const resetStore = useCallback(() => {
    utilityStore?.setSelectedPaymentFrequency('');
    utilityStore?.setFirstPaymentDate('');
    utilityStore?.setSubmitApplicationResponse(undefined);
    utilityStore?.setPhoneVerificationRequired(false);
    utilityStore?.setLeadPk(null);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('unload', resetStore);
    }
  }, []);

  return (
    <NoAuthWrapper isContactBarHidden>
      <Script
        type="text/javascript"
        src="https://static.signwell.com/assets/embedded.js"
      />
      {!phoneVerified && (
        <VerifyPhoneNumber
          leadPk={leadPk}
          verifyPhoneNumber={customerStore?.verifyPhoneBeforeSigning}
          setPhoneVerified={setPhoneVerified}
          config={config}
        />
      )}

      {selectPaymentProgramStep && !(fpd && frequency) && phoneVerified && (
        <MissingPaymentProgram
          paymentFrequencyData={utilityStore?.paymentPrograms}
          setPaymentFrequency={utilityStore?.setSelectedPaymentFrequency}
          setFirstPaymentDate={utilityStore?.setFirstPaymentDate}
        />
      )}

      {utilityStore?.submitApplicationResponse &&
        utilityStore?.submitApplicationResponse?.embeddedSigningUrl &&
        !selectPaymentProgramStep && (
          <TermsOfAgreement
            config={config}
            submitApplicationResponse={utilityStore?.submitApplicationResponse}
            embeddedSigningUrl={
              utilityStore?.submitApplicationResponse?.embeddedSigningUrl
            }
            getEsignRedirectUrlByLead={utilityStore?.getEsignRedirectUrlByLead}
            removeParentOrTopOnIframe={
              utilityStore?.submitApplicationResponse
                ?.removeParentOrTopOnIframe || false
            }
            allowCloseOnIframe={
              utilityStore?.submitApplicationResponse?.allowCloseOnIframe ||
              false
            }
            isProd={false}
            offerInsurance={false}
            utilityStore={utilityStore}
            buddyOfferConfigURL={''}
            partnerID={''}
          />
        )}
    </NoAuthWrapper>
  );
};

export default inject('customerStore', 'utilityStore')(observer(CompleteEsign));





pages/finalizeApplication/index.tsx

import React from 'react';
import {inject, observer} from 'mobx-react';
import {UtilityStore} from '@stores/utility';
import {CustomerStore} from '@stores/customer';
import type {GetServerSideProps} from 'next';
import {MerchantStore} from '@stores/merchant';

interface FinalizeApplicationProps {
  merchantStore: MerchantStore;
  utilityStore: UtilityStore;
  customerStore: CustomerStore;
  isLocalhost: boolean;
  isProd: boolean;
  clientID: string;
  SENTRY_DSN: string;
  NID: string;
}

const FinalizeApplication = (props: FinalizeApplicationProps) => {
  return <FinalizeApplication {...props} />;
};

type Props = {
  isLocalhost: boolean;
  clientID: string;
  isProd: boolean;
  SENTRY_DSN: string;
  NID: string;
};

export const getServerSideProps: GetServerSideProps<Props> = async (
  context,
) => ({
  props: {
    isLocalhost: context?.req?.headers?.host?.includes('localhost') || false,
    isProd:
      context?.req?.headers?.host?.includes('prd') ||
      context?.req?.headers?.host?.includes('prod') ||
      context?.req?.headers?.host?.includes('merchant') ||
      false,
    clientID: process.env.KOUNTMID || null,
    SENTRY_DSN: process.env.SENTRY_DSN || null,
    NID: process.env.NID || null,
  },
});

export default inject(
  'customerStore',
  'utilityStore',
  'merchantStore',
)(observer(FinalizeApplication));






pages/newApplication/index.tsx

import {CustomerStore} from '@stores/customer';
import {OverviewStore} from '@stores/overview';
import {UtilityStore} from '@stores/utility';
import {sortBy, uniq, uniqBy} from 'lodash';
import {inject, observer} from 'mobx-react';
import React, {useState, useEffect, useMemo} from 'react';
import {Button, Input} from 'reactstrap';
import {
  getMerchantObj,
  newApplicationTableColumns,
} from '@utils/data-table-columns';
import {
  formatPhoneNumber,
  formatDate,
  isEqual,
  getDate,
  showToast,
} from '@uownleasing/common-utilities';
import classNames from 'classnames';
import {useFormik} from 'formik';
import {InputType} from 'reactstrap/lib/Input';
import * as Yup from 'yup';
import {AccountStore} from '@stores/account';
import AuthWrapper from '@layouts/auth';
import styles from './index.module.scss';
import {
  BasicMerchantInfo,
  DropdownSelect,
  NewApplicationInfo,
  NewApplicationRequest,
} from '@models';
import {
  dataTableCustomStyles,
  paginationRowsPerPageOptions,
} from '@utils/helper';
import {FilterTable} from '@uownleasing/common-ui';
import {getNewApplicationFilterProps} from '@utils/new-application-table-config';

interface NewApplicationProps {
  accountStore: AccountStore;
  customerStore: CustomerStore;
  overviewStore: OverviewStore;
  utilityStore: UtilityStore;
}

const NewApplication = (props: NewApplicationProps) => {
  const {accountStore, customerStore, overviewStore, utilityStore} = props;
  const [newApplicationTableData, setNewApplicationTableData] = useState<
    NewApplicationRequest[]
  >([]);
  const [currentMerchant, setCurrentMerchant] = useState('');
  const [currentMerchantLocation, setCurrentMerchantLocation] = useState('');
  const [isProgressPending, setIsProgressPending] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalRows, setTotalRows] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const merchantCode = accountStore?.merchantReferenceCode || '';
  const [basicMerchantInfo, setBasicMerchantInfo] = useState<
    BasicMerchantInfo[]
  >([]);

  const [merchantsByLocation, setMerchantsByLocation] = useState([]);

  const getLocationsForTargetMerchant = (targetMerchant = '') => {
    const availableLocations =
      basicMerchantInfo &&
      basicMerchantInfo?.length > 0 &&
      basicMerchantInfo
        ?.filter(
          (merch) =>
            merch?.acceptsNewApps &&
            isEqual(merch?.merchantName, targetMerchant),
        )
        ?.map((merch) => {
          return `${merch?.merchantLocation || ''} - ${
            merch?.merchantCode || ''
          }`;
        });

    const sortedLocations = sortBy(
      availableLocations || [],
      (location) => location,
    );
    setMerchantsByLocation(sortedLocations || []);
  };

  const todaysDate = formatDate({f: 'api', d: getDate()});

  useEffect(() => {
    utilityStore.setIsLoading(true);
    const promises = [];
    setStartDate(todaysDate);
    setEndDate(todaysDate);
    promises.push(
      overviewStore?.getSendApplicationRequestsByCriteria({
        from: startDate || todaysDate,
        to: endDate || todaysDate,
        pageNumber: 0,
        maxResults: rowsPerPage,
        searchString: '',
        merchantNames: [],
      }),
    );
    promises.push(overviewStore?.getBasicMerchantInfoByRefCode(merchantCode));
    Promise.all(promises).then((res) => {
      utilityStore.setIsLoading(false);
      const hasMerchData = res?.[1]?.status === 200;
      const merchantData = (hasMerchData && res?.[1]?.data) || [];
      setBasicMerchantInfo(merchantData);
      setNewApplicationTableData(res?.[0].data.results || []);
      setTotalRows(res?.[0].data.totalCount);
    });

    return () => overviewStore?.setApplicationRequests([]);
  }, []);

  // newApplicationForm
  const formik = useFormik({
    initialValues: {
      custEmailAddress: '',
      phone: '',
      refMerchantCode: '',
      merchant: '',
    },
    validationSchema: Yup.object({
      custEmailAddress: Yup.string().email('Invalid email'),
      phone: Yup.string()
        .matches(
          /^((\\+[1-9]{1,4}[ \\-]*)|(\\([0-9]{2,3}\\)[ \\-]*)|([0-9]{2,4})[ \\-]*)*?[0-9]{3,4}?[ \\-]*[0-9]{3,4}?$/,
          'Please enter a 10 digit number only',
        )
        .min(10, 'Phone # must be a 10 digit number')
        .max(10, 'Phone # must be a 10 digit number'),
      reMerchantCode: Yup.string(),
    }),
    onSubmit: async (values) => {
      const {custEmailAddress, phone, refMerchantCode} = values;

      if (values) {
        const request: NewApplicationInfo = {
          custEmailAddress,
          custPhoneNumber: phone,
          refMerchantCode,
        };

        if (formik.isValid && formik.dirty) {
          await utilityStore?.setIsLoading(true);
          const response = await customerStore?.sendNewApplication(request);
          await utilityStore?.setIsLoading(false);

          if (response?.status === 200) {
            showToast(
              'success',
              `Application sent to ${
                custEmailAddress && phone
                  ? `${custEmailAddress} and ${formatPhoneNumber(phone)}`
                  : custEmailAddress
                  ? custEmailAddress
                  : formatPhoneNumber(phone)
              }`,
            );
            formik.resetForm();
            setCurrentMerchant('');
            setCurrentMerchantLocation('');
          } else {
            showToast(
              'error',
              response?.message ||
                'Unable to send application. Please try again or contact uown support',
            );
            formik.resetForm();
            setCurrentMerchant('');
            setCurrentMerchantLocation('');
          }
        }
      }
    },
  });

  const getSendApplicationFormk = useFormik({
    initialValues: {
      fromDate: formatDate({f: 'user', d: getDate()}),
      toDate: formatDate({f: 'user', d: getDate()}),
      merchant: [],
      searchString: '',
    },
    onSubmit: async (values) => {
      const {fromDate, toDate, merchant, searchString} = values;

      const formattedFromDate = formatDate({f: 'api', d: fromDate});
      const formattedToDate = formatDate({f: 'api', d: toDate});
      const merchantNames: string[] = merchant
        ?.map((element) =>
          element?.label === 'Select All' ? null : element?.label || '',
        )
        .filter((_) => Boolean(_));

      utilityStore.setIsLoading(true);
      let applications =
        await overviewStore.getSendApplicationRequestsByCriteria({
          from: formattedFromDate || todaysDate,
          to: formattedToDate || todaysDate,
          pageNumber: 0,
          maxResults: 10,
          merchantNames,
          searchString,
        });

      setNewApplicationTableData(applications?.data?.results || []);
      setTotalRows(applications.data.totalCount);

      utilityStore.setIsLoading(false);

      setStartDate(formattedFromDate);
      setEndDate(formattedToDate);
    },
  });

  let merchantObj: DropdownSelect[] = getMerchantObj(basicMerchantInfo);
  const merchantObject = merchantObj;
  const merchants = basicMerchantInfo || [];
  const merchantLocations: string[] =
    (merchants &&
      merchants?.length > 0 &&
      merchants?.map((merchant) => merchant?.merchantLocation)) ||
    [];
  const sortedMerchantLocations = sortBy(merchantLocations, (merch) =>
    merch?.toLowerCase(),
  );
  const uniqMerchantLocations = uniqBy(
    sortedMerchantLocations,
    (merch) => merch,
  );

  const filterProps = getNewApplicationFilterProps({
    formik: getSendApplicationFormk,
    merchantObject,
    uniqMerchantLocations,
    merchants,
  });

  const handlePaginationAction = async (
    pageNumber: number,
    newPerPage: number,
  ) => {
    setIsProgressPending(true);
    const {merchant, searchString} = getSendApplicationFormk.values;
    const merchantNames: string[] = merchant
      ?.map((element) =>
        element?.label === 'Select All' ? null : element?.label || '',
      )
      .filter((_) => Boolean(_));
    const applications =
      await overviewStore.getSendApplicationRequestsByCriteria({
        pageNumber: pageNumber - 1,
        maxResults: newPerPage || 10,
        from: formatDate({f: 'api', d: startDate}),
        to: formatDate({f: 'api', d: endDate}),
        searchString,
        merchantNames,
      });

    setNewApplicationTableData(applications?.data?.results || []);
    setRowsPerPage(newPerPage);
    setIsProgressPending(false);
  };

  const handlePageChange = async (pageNumber: number) => {
    await handlePaginationAction(pageNumber, rowsPerPage);
  };

  const handleRowsPerPageChange = async (
    newPerPage: number,
    pageNumber: number,
  ) => {
    await handlePaginationAction(pageNumber, newPerPage);
  };

  const columns = useMemo(
    () => newApplicationTableColumns(() => utilityStore?.setIsLoading(true)),
    [utilityStore],
  );

  return (
    <AuthWrapper title="NEW APPLICATION">
      <div className="d-flex flex-column flex-lg-row mt-4">
        <div className="mr-0 mr-lg-3 mb-3 mb-lg-0">
          <NewApplicationSummaryBox
            formik={formik}
            description="Email"
            section="email"
            inputType="email"
            name="custEmailAddress"
            placeholder="example@domain.com"
            value=""
            inputValue={formik.values.custEmailAddress}
            setIsLoading={utilityStore?.setIsLoading}
          />
        </div>

        <div className="mr-0 mr-lg-3 mb-3 mb-lg-0">
          <NewApplicationSummaryBox
            formik={formik}
            description="Phone"
            section="phone"
            inputType="text"
            name="phone"
            placeholder="8004567890"
            value=""
            inputValue={formik.values.phone}
            setIsLoading={utilityStore?.setIsLoading}
          />
        </div>

        <div className="mr-0 mr-lg-3 mb-3 mb-lg-0">
          <NewApplicationOptionMenu
            label="Merchant"
            options={['Select a merchant'].concat(
              uniq(
                (basicMerchantInfo &&
                  basicMerchantInfo?.length > 0 &&
                  basicMerchantInfo
                    .filter((merchant) => merchant?.acceptsNewApps)
                    .map((merchant) => merchant?.merchantName)) ||
                  [],
              ),
            )}
            isDisabled={false}
            value={currentMerchant}
            onSelect={async (e) => {
              const merchantValue = e?.target?.value || '';
              setCurrentMerchant(merchantValue);
              getLocationsForTargetMerchant(merchantValue);
              formik?.setFieldValue('refMerchantCode', '');
            }}
            isTitleOnTop={true}
          />
        </div>

        <div className="mr-0 mr-lg-3 mb-3 mb-lg-0">
          <NewApplicationOptionMenu
            label="Location"
            options={['Select a location'].concat(merchantsByLocation)}
            isDisabled={!currentMerchant}
            value={currentMerchantLocation}
            onSelect={(e) => {
              const merchantLocationName = e?.target?.value || '';
              const refCode = merchantLocationName?.split(' - ')?.pop() || '';

              const filteredMerchantCode =
                basicMerchantInfo &&
                basicMerchantInfo?.length > 0 &&
                basicMerchantInfo.find(
                  (merchant) =>
                    merchant?.merchantCode === refCode &&
                    merchant?.merchantName === currentMerchant,
                );

              const merchRefCode = filteredMerchantCode?.merchantCode || '';

              setCurrentMerchantLocation(merchantLocationName);
              formik.setFieldValue('refMerchantCode', merchRefCode?.trim());
            }}
            isTitleOnTop={true}
          />
        </div>

        <div className="d-flex align-items-end">
          <Button
            type="submit"
            className={classNames(
              'text-uppercase px-4',
              styles?.newApplication__sendButton,
              (!(formik.isValid && currentMerchant) ||
                !currentMerchantLocation ||
                !formik.values.refMerchantCode ||
                !(formik.values.custEmailAddress || formik.values.phone)) &&
                styles?.newApplication__disabledButton,
            )}
            disabled={
              !(formik.isValid && currentMerchant) ||
              !currentMerchantLocation ||
              !formik.values.refMerchantCode ||
              !(formik.values.custEmailAddress || formik.values.phone)
            }
            onClick={() => formik.handleSubmit()}>
            Send
          </Button>
        </div>
      </div>

      <div className={styles?.newApplication__divider} />

      <FilterTable
        isResizeable
        columns={columns}
        customStyles={dataTableCustomStyles}
        data={newApplicationTableData}
        defaultSortAsc={false}
        defaultSortFieldId="applicationDate"
        filterProps={filterProps}
        formik={getSendApplicationFormk}
        onChangePage={handlePageChange}
        onChangeRowsPerPage={handleRowsPerPageChange}
        pagination={true}
        paginationRowsPerPageOptions={paginationRowsPerPageOptions}
        paginationServer={true}
        paginationTotalRows={totalRows}
        paginationPerPage={rowsPerPage}
        paginationDefaultPage={1}
        striped={true}
        progressPending={isProgressPending}
        highlightOnHover
      />
    </AuthWrapper>
  );
};

interface NewApplicationOptionMenuProps {
  label: string;
  options: string[];
  onSelect: (e) => void;
  value: string;
  isDisabled: boolean;
  isTitleOnTop?: boolean;
}

const NewApplicationOptionMenu = (props: NewApplicationOptionMenuProps) => {
  const {
    label,
    options = [],
    onSelect,
    value,
    isDisabled,
    isTitleOnTop,
  } = props;
  const isMerchant = label === 'Merchant';
  const isLocation = label === 'Location';
  const isDays = label === 'days';
  return (
    <div
      className={classNames(
        'd-flex align-items-center mr-2',
        styles?.applicationOptionMenu,
        isTitleOnTop && styles?.applicationOptionMenu__titleOnTop,
        {
          'w-100': !isDays,
        },
      )}>
      <div
        className={classNames(
          'text-capitalize',
          styles?.applicationOptionMenu__label,
          isDays && styles?.applicationOptionMenu__dayInputLabel,
          {
            'w-100 text-left': isTitleOnTop,
            'mr-2 mb-2': !isTitleOnTop,
          },
        )}>
        {label}
      </div>
      <div className="w-100">
        <Input
          type="select"
          value={value}
          onChange={onSelect}
          disabled={isDisabled}
          className={classNames(
            styles?.applicationOptionMenu__menuInput,
            isDays && styles?.applicationOptionMenu__dayInput,
            {
              'w-100': !isMerchant && !isLocation && !isDays,
              'mb-2': !isTitleOnTop,
            },
          )}>
          {options.map((option, index) => {
            return <option key={'option' + index}>{option}</option>;
          })}
        </Input>
      </div>
    </div>
  );
};

interface NewApplicationSummaryBoxProps {
  formik: any;
  description: string;
  section: string;
  value: any;
  setIsLoading: (isLoading: boolean) => void;
  inputType: InputType;
  name: string;
  inputValue: any;
  placeholder?: string;
}

const NewApplicationSummaryBox = (props: NewApplicationSummaryBoxProps) => {
  const {formik, description, value, inputType, name, inputValue, placeholder} =
    props;
  return (
    <div
      className={classNames(
        'd-flex flex-column justify-content-between h-100 p-2',
        styles?.summaryBox,
      )}>
      <div
        className={classNames('d-flex flex-column', styles?.summaryBox__body)}>
        <div className="mr-3">{description}</div>
        <div className="d-flex flex-column align-items-center">
          <Input
            placeholder={placeholder}
            type={inputType}
            className={classNames(styles?.summaryBox__summaryInput)}
            name={name}
            value={inputValue}
            onChange={formik.handleChange}
          />
          {formik.errors[name] || formik.touched[name] ? (
            <div className={styles?.summaryBox__error}>
              {formik.errors[name]}
            </div>
          ) : null}
        </div>
      </div>
      <div className={styles?.summaryBox__value}>{value}</div>
    </div>
  );
};

export default inject(
  'accountStore',
  'customerStore',
  'overviewStore',
  'utilityStore',
)(observer(NewApplication));






pages/programs/index.tsx

import React, {useCallback, useEffect, useState} from 'react';
import AuthWrapper from '@layouts/auth';
import {
  ActivityLogFilters,
  ActivityLogPanel,
  defaultPaginatedResp,
  FilterTable,
} from '@uownleasing/common-ui';
import {
  showToast,
  stateOptions,
  hasModifyPermission,
  convertCurrencyToFloat,
} from '@uownleasing/common-utilities';
import {useFormik} from 'formik';
import {getProgramTableFilter} from '@utils/program-table-config';
import {programPageTableColumns} from '@utils/data-table-columns';
import {
  dataTableCustomStyles,
  paginationRowsPerPageOptions,
  convertStringToOptionType,
} from '@utils/helper';
import {inject, observer} from 'mobx-react';
import {UtilityStore} from '@stores/utility';
import ProgramForm from '@components/program-form';
import * as Yup from 'yup';
import {ProgramStore} from '@stores/program';
import {ProgramInfo, ProgramLog} from '@models';
import {isString} from 'lodash';
import {Button} from 'reactstrap';
import {LendingCategoryType} from '@enums/LendingCategoryType';
import config from '@config/project-config';

interface ProgramProps {
  programStore: ProgramStore;
  utilityStore: UtilityStore;
}

const Programs = (props: ProgramProps) => {
  const {programStore, utilityStore} = props;
  const [displayProgramScreen, setDisplayProgramScreen] = useState(false);
  const [allPrograms, setAllPrograms] = useState([]);
  const [paginationTotalRows, setPaginationTotalRows] = useState(10);
  const [paginationPerPage, setPaginationPerPage] = useState<number>();
  const [frequency, setFrequency] = useState('');
  const [configColumns, setConfigColumns] = useState([]);
  const [activityLogsIsLoading, setActivityLogsIsLoading] = useState(false);
  const [programGroups, setProgramGroups] = useState([]);

  const permissions = utilityStore?.rootStore?.accountStore?.permissions;
  const hasCreateOrUpdateMerchantPermission = hasModifyPermission(
    permissions,
    'programs',
    'create_or_update_program',
  );

  const hasManageProgramGroupsPermission = hasModifyPermission(
    permissions,
    'programs',
    'manage_program_groups',
  );

  const getAllMerchPrograms = async (
    search: string = '',
    groupName: string = '',
    page: number = 0,
    maxResults: number = 10,
  ) => {
    const response = await programStore?.getAllMerchantPrograms(
      search,
      page,
      maxResults,
      false,
      groupName,
    );
    const {data} = response;
    const {merchantPrograms, totalCount} = data || {};
    setAllPrograms(merchantPrograms || []);
    setPaginationTotalRows(totalCount);
  };

  const resetOnSubmit = () => {
    programsFormik?.resetForm();
    setDisplayProgramScreen(false);
  };

  const handleGetPrograms = () => {
    const paginationSettings = programStore?.paginationSettings;
    const searchWord = paginationSettings?.searchKey || '';
    const pageNum = paginationSettings?.pageNumber;
    const maxNum = paginationSettings?.maxResults;
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

    return () => programStore?.setProgramLogs(defaultPaginatedResp([]));
  }, []);

  useEffect(() => {
    setConfigColumns(
      programPageTableColumns(handleProgramClick)?.map((column) => ({
        ...column,
        label: column?.name,
        value: column?.name,
      })),
    );
  }, []);

  const allStateOptions = Object.keys(stateOptions);
  const allStates = allStateOptions?.map((key) => {
    const trimmedKey = key?.trim() || '';
    return {
      label: trimmedKey,
      value: trimmedKey,
      key: trimmedKey,
    };
  });

  const searchFormik = useFormik({
    initialValues: {
      search: programStore?.paginationSettings?.searchKey || '',
      groupName: '',
    },
    onSubmit: ({groupName, search}) => {
      getAllMerchPrograms(search, groupName);
    },
  });

  const programsFormik = useFormik({
    initialValues: {
      programName: '',
      moneyFactor: 0.169999 * 100,
      payoffDiscount: 0.3 * 100,
      epoDays: 90,
      epoFeePercent: 0,
      termMonths: 13,
      states: allStates,
      programPk: null,
      lendingCategoryType: LendingCategoryType.LTO,
      allowedFrequencyOverride: convertStringToOptionType('WEEKLY, BI_WEEKLY'),
      dealerDiscount: 0,
      minCartAmount: 0,
      maxCartAmount: 0,
      processingFeeOverride: 0,
      amountChargedAtSigning: 0,
      groupName: '',
    },
    validationSchema: Yup.object().shape({
      programName: Yup.string().required('Program Name is required.'),
      moneyFactor: Yup.number().required('Money Factor is required.'),
      payoffDiscount: Yup.number().required('Pay Off Discount is required.'),
      epoDays: Yup.number().required('EPO Days is required.'),
      epoFeePercent: Yup.number().required('EPO Fee Percent is required.'),
      termMonths: Yup.number().required('Term Months is required.'),
      states: Yup.array().min(1, 'States is required'),
      minCartAmount: Yup.number().required('Minimum Cart Amount is required.'),
      maxCartAmount: Yup.number().required('Max Cart Amount is required.'),
      dealerDiscount: Yup.number(),
      allowedFrequencyOverride: Yup.array(),
      processingFeeOverride: Yup.number().nullable(),
      amountChargedAtSigning: Yup.number().required(
        'Amount Charged at Signing is required.',
      ),
    }),
    onSubmit: async (values) => {
      const {
        states,
        minCartAmount,
        maxCartAmount,
        processingFeeOverride,
        amountChargedAtSigning,
      } = values;
      const selectedStates = states?.map((state) => state?.label || []);
      const stringStates = selectedStates?.join(',') || '';
      const allowedFrequencyOverride = values?.allowedFrequencyOverride?.map(
        (val) => val?.label,
      );
      const stringFreqs = allowedFrequencyOverride?.join(',') || '';
      const requestBody: ProgramInfo = {
        ...values,
        moneyFactor: values?.moneyFactor / 100,
        payoffDiscount: values?.payoffDiscount / 100,
        epoFeePercent: values?.epoFeePercent / 100,
        dealerDiscount: values?.dealerDiscount / 100,
        minCartAmount: convertCurrencyToFloat(minCartAmount || 0),
        maxCartAmount: convertCurrencyToFloat(maxCartAmount || 0),
        processingFeeOverride: convertCurrencyToFloat(
          processingFeeOverride || 0,
        ),
        amountChargedAtSigning: convertCurrencyToFloat(
          amountChargedAtSigning || 0,
        ),
        allowedFrequencyOverride: stringFreqs,
        states: stringStates,
        groupName: values.groupName
          ? values.groupName.trim().replace(/\s{2,}/g, ' ')
          : null,
      };

      if (requestBody) {
        const response = await programStore?.createOrUpdateMerchantProgram(
          requestBody,
        );
        const {message, status} = response || {};

        if (status === 200) {
          const messageToShow = values?.programPk ? 'modified' : 'added';
          showToast(
            'success',
            `Program has been ${messageToShow} successfully.`,
          );
          handleGetPrograms();
          resetOnSubmit();
        } else {
          showToast(
            'error',
            message || 'An error has occured. Please try again.',
          );
        }
      } else {
        showToast(
          'error',
          'Please make sure all fields are filled in correctly.',
        );
      }
    },
  });
  const onSubmitFilters = useCallback(
    async (filters: ActivityLogFilters) => {
      setActivityLogsIsLoading(true);
      await programStore.getLogsForProgram(programsFormik?.values?.programPk, {
        page: 0,
        size: programStore.programLogs.size,
        logTypes: filters.logTypes,
        notes: filters.notes,
        createdBy: filters.userId,
      });
      setActivityLogsIsLoading(false);
    },
    [programsFormik?.values?.programPk, programStore],
  );

  const onChangePageLogs = useCallback(
    async (page: number, _totalRows: number, filters: ActivityLogFilters) => {
      setActivityLogsIsLoading(true);
      await programStore.getLogsForProgram(programsFormik?.values?.programPk, {
        page: page - 1,
        size: programStore.programLogs.size,
        logTypes: filters.logTypes,
        notes: filters.notes,
        createdBy: filters.userId,
      });
      setActivityLogsIsLoading(false);
    },
    [programsFormik?.values?.programPk, programStore],
  );

  const onChangeRowsPerPageLogs = useCallback(
    async (
      currentRowsPerPage: number,
      _currentPage: number,
      filters: ActivityLogFilters,
    ) => {
      setActivityLogsIsLoading(true);
      await programStore.getLogsForProgram(programsFormik?.values?.programPk, {
        page: 0,
        size: currentRowsPerPage,
        logTypes: filters.logTypes,
        notes: filters.notes,
        createdBy: filters.userId,
      });
      setActivityLogsIsLoading(false);
    },
    [programsFormik?.values?.programPk, programStore],
  );

  const setActivityLogs = useCallback(
    (content: ProgramLog[]) =>
      programStore.setProgramLogs({
        ...programStore.programLogs,
        content,
      }),
    [programStore],
  );

  const getCurrentSelectedStates = async (currentStates) => {
    const listsOfSelectedStates = currentStates && currentStates?.split(',');
    const states = listsOfSelectedStates?.map((state, index) => {
      const trimmedState = state?.trim() || '';
      return {
        label: trimmedState,
        value: trimmedState,
        key: trimmedState + '_' + index,
      };
    });
    await programsFormik?.setFieldValue('states', states);
  };

  useEffect(() => {
    const currentStates = programsFormik?.values?.states || '';
    if (currentStates && isString(currentStates)) {
      getCurrentSelectedStates(currentStates);
    }
  }, [programsFormik?.values?.states]);

  const tableFilterProps = getProgramTableFilter(searchFormik, programGroups);

  const onChangePage = async (page: number) => {
    const searchKeyword = searchFormik?.values?.search || '';
    const groupName = searchFormik?.values?.groupName;
    await getAllMerchPrograms(
      searchKeyword,
      groupName,
      page - 1,
      paginationPerPage,
    );
  };

  const onChangeRowsPerPage = async (newPerPage: number, page: number) => {
    const searchKeyword = searchFormik?.values?.search || '';
    const groupName = searchFormik?.values?.groupName;

    await getAllMerchPrograms(searchKeyword, groupName, page - 1, newPerPage);
    setPaginationPerPage(newPerPage);
  };

  const AddNewProgramButton = () => {
    return (
      <Button
        className="submit-button border-0 width_200px rounded-0"
        onClick={() => {
          setFrequency('');
          setDisplayProgramScreen(true);
        }}>
        ADD NEW PROGRAM
      </Button>
    );
  };

  const handleProgramClick = async (row) => {
    const programInfo = row?.programInfo;
    const freq = programInfo?.allowedFrequencyOverride || '';
    await programsFormik?.setValues({
      ...programInfo,
      moneyFactor: programInfo?.moneyFactor * 100,
      payoffDiscount: programInfo?.payoffDiscount * 100,
      epoFeePercent: programInfo?.epoFeePercent * 100,
      dealerDiscount: programInfo?.dealerDiscount * 100,
      allowedFrequencyOverride: convertStringToOptionType(freq),
    });
    if (programInfo?.programPk) {
      await programStore?.getLogsForProgram(programInfo.programPk);
    }

    setDisplayProgramScreen(true);
    setFrequency(freq);
  };

  return (
    <AuthWrapper
      title="PROGRAMS"
      childButton={
        !displayProgramScreen &&
        hasCreateOrUpdateMerchantPermission &&
        AddNewProgramButton()
      }>
      <div className="mt-3">
        {displayProgramScreen && hasCreateOrUpdateMerchantPermission ? (
          <>
            <ProgramForm
              formik={programsFormik}
              allStates={allStates}
              setDisplayProgramScreen={setDisplayProgramScreen}
              frequencyOverride={frequency}
              setProgramLogs={programStore?.setProgramLogs}
              getAllMerchantPrograms={programStore?.getAllMerchantPrograms}
              getMerchantProgramsGroupName={
                programStore?.getMerchantProgramsGroupName
              }
              getAllStateConfigurations={
                programStore?.getAllStateConfigurations
              }
              clonePrograms={programStore.clonePrograms}
              hasManageProgramGroupsPermission={
                hasManageProgramGroupsPermission
              }
            />
            {programsFormik?.values?.programPk && (
              <div className="mt-4">
                <ActivityLogPanel
                  config={config}
                  activityLogs={programStore.programLogs.content}
                  accountPk={programsFormik.values.programPk}
                  hasNotesInternalPermission={true}
                  hasNotesStandardPermission={true}
                  setIsLoading={utilityStore?.setIsLoading}
                  progressPending={activityLogsIsLoading}
                  paginationServer
                  paginationTotalRows={programStore.programLogs?.totalElements}
                  paginationPerPage={programStore.programLogs?.size}
                  paginationRowsPerPageOptions={paginationRowsPerPageOptions}
                  onChangePage={onChangePageLogs}
                  onChangeRowsPerPage={onChangeRowsPerPageLogs}
                  logTypes={
                    programStore.programLogs.filtersOptions?.logTypes || []
                  }
                  onSubmitFilters={onSubmitFilters}
                  setActivityLogs={setActivityLogs}
                />
              </div>
            )}
          </>
        ) : (
          <FilterTable
            isResizeable
            dataStructure="programInfo"
            columns={configColumns}
            customStyles={dataTableCustomStyles}
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
            paginationPerPage={paginationPerPage}
            paginationRowsPerPageOptions={paginationRowsPerPageOptions}
            paginationTotalRows={paginationTotalRows}
            striped
            progressPending={utilityStore?.isLoading}
            onRowClicked={handleProgramClick}
            pointerOnHover
            highlightOnHover
            responsive
          />
        )}
      </div>
    </AuthWrapper>
  );
};

export default inject('programStore', 'utilityStore')(observer(Programs));





pages/sendApplication/index.module.scss

.sendApplication {
  background: var(--opaque-primary-color-background);
}





pages/sendApplication/index.tsx

import React from 'react';
import type {GetServerSideProps} from 'next';
import dynamic from 'next/dynamic';
import {SendApplication} from '@components/temp/sendApplication';

const Application = (props: Props) => {
  return <SendApplication {...props} />;
};

type Props = {
  NID: string;
  RADAR_LICENSE_KEY: string;
};

export const getServerSideProps: GetServerSideProps<Props> = async () => ({
  props: {
    NID: process.env.NID_NEW_APPLICATION || '',
    RADAR_LICENSE_KEY: process.env.RADAR_LICENSE_KEY || '',
  },
});

export default dynamic(() => Promise.resolve(Application), {
  ssr: false,
});






pages/index.tsx

import React, {useCallback, useEffect} from 'react';
import * as Sentry from '@sentry/react';
import {inject, observer} from 'mobx-react';
import {AccountStore} from '@stores/account';
import {UtilityStore} from '@stores/utility';
import {showToast} from '@uownleasing/common-utilities';
import {useRouter} from 'next/router';
import {LoginContainer} from '@uownleasing/common-ui';
import config from '@config/project-config';
import Image from 'next/image';
import NoAuthWrapper from '@layouts/no-auth';
import {addReplayIntegration, initializedClient} from '@utils/sentry';

interface HomeProps {
  accountStore: AccountStore;
  utilityStore: UtilityStore;
  sampleRateOnError: number;
  sessionSampleRate: number;
  sentryDSN: string;
}

const Home = (props: HomeProps) => {
  const {accountStore, utilityStore} = props;
  const {setIsLoading} = utilityStore || {};

  const router = useRouter();

  const initializeSentryReplay = useCallback(async () => {
    initializedClient({
      replay: {
        sampleRateOnError: props.sampleRateOnError,
        sessionSampleRate: props.sessionSampleRate,
      },
      sentryDSN: props.sentryDSN,
    });
    const replay = Sentry.getReplay();
    if (!replay) {
      addReplayIntegration();
    }
  }, [props.sampleRateOnError, props.sentryDSN, props.sessionSampleRate]);

  useEffect(() => {
    accountStore.reset();
    utilityStore.setIsLoading(false);
    initializeSentryReplay();
  }, [accountStore, initializeSentryReplay, utilityStore]);

  const handleLogin = async (e, email, password, rememberMe) => {
    e.preventDefault();

    const responseCode = await accountStore?.login(email, password, rememberMe);
    const previousPath = JSON.parse(
      JSON.stringify(utilityStore?.previousPath?.origination || ''),
    );
    const permissionPathName = previousPath?.replace(/\/|[0-9]/g, '');
    const hasPagePermission =
      accountStore?.permissions?.access?.[permissionPathName];
    const previousPathToUse =
      previousPath !== '/' && hasPagePermission ? previousPath : undefined;
    if (responseCode === 200) {
      showToast('success', 'Login successful. Please wait...');
      utilityStore?.setPreviousPath();
      await router.push(previousPathToUse || '/overview');
      // await router.push('/overview', undefined, {shallow: false});
    } else if (responseCode === 401) {
      setIsLoading(false);
      showToast('error', 'Invalid credentials');
    } else if (responseCode === 403) {
      setIsLoading(false);
      showToast(
        'error',
        'Your account is not assigned to any particular merchant. Please contact your account administrator.',
      );
    } else if (responseCode === 423) {
      setIsLoading(false);
      showToast(
        'error',
        'Your account has been locked. Please try again later or contact your account administrator.',
      );
    } else {
      setIsLoading(false);
      showToast('error', 'Unable to login. Please try again later!');
    }
  };

  const CompanyLogo = () => <Image src={config.loginLogo} alt="company-logo" />;

  return (
    <NoAuthWrapper>
      <LoginContainer
        CompanyLogo={CompanyLogo}
        pageTitle="Merchant Login"
        rememberMeUsername={accountStore?.rememberMe || ''}
        requestPasswordReset={accountStore?.requestPasswordReset}
        verifyPasswordResetCode={accountStore?.verifyPasswordResetCode}
        completePasswordReset={accountStore?.completePasswordReset}
        handleLogin={handleLogin}
        handleReload={() => router?.reload()}
        config={config}
      />
    </NoAuthWrapper>
  );
};

import type {GetServerSideProps} from 'next';

type Props = {
  sampleRateOnError: number;
  sessionSampleRate: number;
  sentryDSN: string;
};

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const props = {
    sampleRateOnError: Number(process.env.SAMPLE_RATE_ON_ERROR),
    sessionSampleRate: Number(process.env.SESSION_SAMPLE_RATE),
    sentryDSN: process.env.SENTRY_DSN,
  };
  return {props};
};

export default inject('accountStore', 'utilityStore')(observer(Home));





styles/globals.scss

@import '~bootstrap/scss/bootstrap';

:root {
  --white: #fff;
  --black: #000;
  --red: #fb0022;
  --green: #049e38;
  --error: #e50000;
  --primary: #1cade4;
  --secondary: #1895c4;
  --loader: #1895c4;
  --primary-selected: #0d5672;
  --show-password: #5bcbf5;
  --hide-password: #959595;
  --primary-font: #313131;
  --border: #bababa;
  --dark-border: #969696;
  --navbar-hover: #006b8e;
  --navbar-selected: #016b8e;
  --alert-background: #ffe6e6;
  --account-summary-green: #f9ffcb;
  --login-icon-background: #fafafc;
  --navbar-background-color: #1cade4;
  --navbar-font-color: #fff;
  --default-page-background-color: #f4f4f4;
  --sidebar-selected-triangle-color: #fff;
  --hover-color: #eaeaea;
  --regular-font: gotham-book;
  --bold-font: gotham-medium;
  --disabled: #959595;
  --login-container-background-color: #fff;
  --login-container-primary-button-background-color: #fff;
  --login-container-primary-button-text-color: #1cade4;
  --unauthenticated-layout-footer-background-color: #1cade4;
  --btn-border-radius: 2px;
  --background: #ededed;
  --gray-background: #6d6a6a;
  --opaque-primary-color-background: #5bcbf5;
}

[data-theme='ks'] {
  --primary: #8fc31f;
  --primary-selected: #82a92c;
  --navbar-hover: #5f8313;
  --secondary: #86217f;
  --opaque-secondary: #9d4797;
  --opaque-primary-color-background: #b7dc6a;
  --loader: var(--primary);
}

@import 'media-query.scss';
$sidebar-bg-color: #1895c4;
$sidebar-width: 125px;
$sidebar-collapsed-width: 86px;
$pixel-sizes: 0, 3px, 5px, 9px, 10px, 11px, 12px, 13px, 14px, 15px, 16px, 17px,
  18px, 19px, 20px, 24px, 25px, 30px, 37px, 40px, 45px, 50px, 75px;
$width-sizes: 50px, 90px, 100px, 130px, 150px, 200px, 300px, 760px;
$width-percents: (
  '20per': 20%,
  '25per': 25%,
  '33per': 33%,
  '40per': 40%,
  '50per': 50%,
  '60per': 60%,
  '75per': 75%,
  '100per': 100%,
);
$rem-sizes: (
  '75rem': 0.75rem,
  '1rem': 1rem,
  '2rem': 2rem,
);
$buttons: 'submit' #1cade4 #fff, 'remove' #d1d1d1 #000, 'cancel' #fff #000;

@font-face {
  font-family: 'Gotham-Book';
  src: local('Gotham'), url('/fonts/Gotham-Book.otf') format('opentype');
}

@font-face {
  font-family: 'Gotham-Medium';
  src: local('Gotham'), url('/fonts/Gotham-Medium.otf') format('opentype');
}

html,
body {
  padding: 0;
  margin: 0;
  font-family: Helvetica, Arial, sans-serif;
  font-size: 18px;

  --gotham-book: gotham-book;
  --gotham-medium: gotham-medium;
  --color-black: #000;
  --color-red: #fb0022;
  --color-error: #e50000;
}

@media (max-width: 576px) {
  body {
    font-size: 14px;
  }
}

a,
a:active,
a:hover,
a:visited {
  color: inherit;
  text-decoration: none;
  outline: none;
}

* {
  box-sizing: border-box;
}

h1.main {
  font-size: 50px;
}

h1 {
  font-size: 36px;
}

h2 {
  font-size: 24px;
}

h3 {
  font-size: 20px;
}

h4 {
  font-size: 18px;
}

.pop-up-form {
  color: #313131;
  font-stretch: normal;
  font-style: normal;
  letter-spacing: normal;

  &__key {
    font-family: var(--gotham-book);
    font-size: 14px;
    font-weight: normal;
    line-height: 1.38;
    text-align: right;
  }

  &__value {
    font-family: var(--gotham-medium);
    font-size: 16px;
    font-weight: 500;
    line-height: 1.44;
    text-align: left;
  }
}

.pop-up-form-header {
  font-family: var(--gotham-medium);
  font-size: 20px;
  font-weight: 500;
  line-height: 1.42;
  text-align: left;
  color: #313131;
}

/* Disables the table header for the react data table components */
.rdt_TableHeader {
  display: none !important;
}

.cursor-pointer {
  cursor: pointer !important;
}

.cursor {
  &_initial {
    cursor: initial !important;
  }
}

.user-select-none {
  user-select: none;
}

.font-family-gotham {
  font-family: var(--gotham-book);
}

.font-family-gotham-bold {
  font-family: var(--gotham-medium);
}

.color-white {
  color: var(--white) !important;
}

.color-black {
  color: var(--color-black) !important;
}

.color-red {
  color: var(--color-red);
}

.error-color {
  color: var(--color-error);
}

.background-white {
  background: var(--white) !important;
}

.background-gray {
  background: #f4f4f4 !important;
}

//NOTE: Do not delete until verified it's no longer being used
.background-dark-gray {
  background: #777 !important;
}

.background-blue {
  background: #30c3e7;
}

.background-f7f7f7 {
  background: #f7f7f7;
}

.invisible {
  opacity: 0;
}

.button-link {
  border: none;
  background: var(--white);
  color: #1cade4;
  text-decoration: underline;
}

.overflow {
  &_hidden {
    overflow: hidden !important;
  }
}

.outline {
  &_none {
    outline: none !important;
  }
}

.position {
  &_unset {
    position: unset !important;
  }
}

.width-inherit {
  width: inherit !important;
}

.opacity-70 {
  opacity: 0.7;
}

.z-index-top {
  z-index: 1049;
}

.z-index-secondary {
  z-index: 1048;
}

@each $name, $background, $color in $buttons {
  .#{$name}-button {
    background: $background;
    color: $color;
    font-size: 14px;
    width: 120px;
    height: 45px;
  }
}

.submit-button:hover {
  background: #1895c4;
}

.primary-button {
  background: #1cade4;
  color: #fff;
  font-size: 14px;
  height: 45px;
  border-radius: 0 !important;
  border: none;
}

.horizontal-scroll {
  overflow-x: auto;
  white-space: nowrap;
}

@each $pixel-size in $pixel-sizes {
  .font-size-#{$pixel-size} {
    font-size: $pixel-size !important;
  }

  .font-size_#{$pixel-size} {
    font-size: $pixel-size !important;

    @if $pixel-size == 50px {
      &-desktop-30px-mobile {
        font-size: $pixel-size !important;
        @include media-breakpoint-down(md) {
          font-weight: 500 !important;
          font-size: 30px !important;
        }
      }
    }
  }

  .border-radius-#{$pixel-size} {
    border-radius: $pixel-size !important;
  }

  .mx_#{$pixel-size} {
    margin-left: $pixel-size !important;
    margin-right: $pixel-size !important;
  }

  .px_#{$pixel-size} {
    padding-left: $pixel-size !important;
    padding-right: $pixel-size !important;
  }

  .my_#{$pixel-size} {
    margin-top: $pixel-size !important;
    margin-bottom: $pixel-size !important;
  }

  .py_#{$pixel-size} {
    padding-top: $pixel-size !important;
    padding-bottom: $pixel-size !important;
  }

  .height_#{$pixel-size} {
    height: $pixel-size !important;
  }

  .margin_#{$pixel-size} {
    margin: $pixel-size !important;
  }

  .margin_top-#{$pixel-size} {
    margin-top: $pixel-size !important;
  }

  .margin_left-#{$pixel-size} {
    margin-left: $pixel-size !important;
  }

  .margin_right-#{$pixel-size} {
    margin-right: $pixel-size !important;
  }

  .padding_#{$pixel-size} {
    margin: $pixel-size !important;
  }

  .padding_top-#{$pixel-size} {
    margin-top: $pixel-size !important;
  }

  .padding_left-#{$pixel-size} {
    margin-left: $pixel-size !important;
  }

  .padding_right-#{$pixel-size} {
    margin-right: $pixel-size !important;
  }
}

.height {
  &_modal-body {
    height: calc(100vh - 165px) !important;
    @include media-breakpoint-down(xs) {
      height: calc(100vh - 300px) !important;
    }
  }
}

@each $name, $rem-size in $rem-sizes {
  .margin-top-#{$name} {
    margin-top: $rem-size;
  }

  .margin-bottom-#{$name} {
    margin-bottom: $rem-size;
  }

  .padding-#{$name} {
    padding: $rem-size;
  }

  .padding-x-#{name} {
    padding-left: $rem-size;
    padding-right: $rem-size;
  }

  .padding-y-#{$name} {
    padding-top: $rem-size;
    padding-bottom: $rem-size;
  }
}

//-----WIDTH PIXEL-----\\
@each $width-size in $width-sizes {
  .width_#{$width-size} {
    width: $width-size !important;

    @if $width-size == 200px or $width-size == 300px {
      @include media-breakpoint-down(sm) {
        width: 100% !important;
      }
    }
  }

  .max-width_#{$width-size} {
    max-width: $width-size !important;
  }
}

//-----WIDTH PERCENT-----\\
@each $name, $width-percent in $width-percents {
  .max-width_#{$name} {
    max-width: $width-percent !important;
  }

  .width_#{$name} {
    width: $width-percent !important;
  }
}

.width {
  &_300px-100per-on-xl {
    width: 300px !important;

    @include media-breakpoint-down(lg) {
      width: 100% !important;
    }
  }

  &_75per-100per-mobile {
    width: 75% !important;

    @include media-breakpoint-down(lg) {
      width: 100% !important;
    }
  }

  &_60per-100per-mobile {
    width: 60% !important;

    @include media-breakpoint-down(lg) {
      width: 100% !important;
    }
  }
}

.title {
  background-color: #ededed;
  font-family: var(--gotham-medium);
  font-size: 16px;
  font-weight: 500;
  font-stretch: normal;
  font-style: normal;
  line-height: 1.38;
  letter-spacing: normal;
  text-align: left;
  color: #313131;
}

.card-header {
  background-color: var(--white, white) !important;
  font-family: var(--gotham-medium);
  font-size: 18px;
  font-weight: 500;
  font-stretch: normal;
  font-style: normal;
  line-height: 1.44;
  letter-spacing: normal;
  text-align: left;
  color: #313131;

  @include media-breakpoint-down(lg) {
    font-size: 14px;
  }
}

.loader-with-nav-on-top-height {
  height: calc(100vh - 115px) !important;
}

.border-1px-gray {
  border: solid 0.5px #969696 !important;
}

.card-padding {
  padding: 1.25em !important;
}

.square-20px {
  width: 20px !important;
  height: 20px !important;
}

.color-313131 {
  color: #313131 !important;
}

.blue-link {
  color: #006b8e !important;
  text-decoration: underline !important;
}

.navigation-link {
  color: var(--navbar-hover);
  text-decoration: underline;
}

.left {
  &_80x {
    left: 80px !important;
  }
}

.color {
  &_white {
    color: var(--white, white) !important;
  }

  &_000 {
    color: #000 !important;
  }

  &_5bcbf5 {
    color: #5bcbf5 !important;
  }

  &_006b8e {
    color: #006b8e !important;
  }

  &_049e38 {
    color: #049e38 !important;
  }

  &_313131 {
    color: #313131 !important;
  }

  &_1cade4 {
    color: #1cade4 !important;
  }
}

.background {
  &_midnightBlue {
    background: #191170 !important;
  }

  &_5bcbf5 {
    background: #5bcbf5 !important;
  }

  &_eaeaea {
    background: #eaeaea !important;
  }

  &_ededed {
    background: #ededed !important;
  }

  &_fafafc {
    background: #fafafc !important;
  }

  &_fff {
    background: #fff !important;
  }

  &_016b8e {
    background: #016b8e !important;
  }

  &_1cade4 {
    background: #1cade4 !important;
  }

  &_1895c4 {
    background: #1895c4 !important;
  }

  &_f4d961 {
    background: #f4d961 !important;
  }

  &_ffe6e6 {
    background: #ffe6e6 !important;
  }

  &_disabled-button {
    background: #5a6268 !important;
  }
}

.border {
  &_half-px-707070 {
    border: 0.5px solid #707070;
  }

  &_1px-solid-1895c4 {
    border: 1px solid #1895c4 !important;
  }

  &_1px-solid-f4d961 {
    border: 1px solid #f4d961 !important;
  }

  &_1px-solid-bababa {
    border: 1px solid #bababa !important;
  }

  &_1px-solid-black {
    border: 1px solid #000 !important;
  }
}

.border-bottom {
  &_half-px-707070 {
    border-bottom: 0.5px solid #707070;
  }

  &_half-px-cbcbcb {
    border-bottom: 0.5px solid #cbcbcb;
  }

  &_half-px-d5d5d5 {
    border-bottom: 0.5px solid #d5d5d5;
  }
}

select.overview-selector {
  -webkit-appearance: none;
  -moz-appearance: none;
  -o-appearance: none;
  padding: 0 !important;
  width: 90px;
  border-radius: unset;
  border-top: none;
  border-left: none;
  border-right: none;
  border-bottom: 1px solid #006b8e;
}

.overview-selector-icon {
  margin-left: -15px !important;
}

.upload-button {
  height: 40px;
  border: 0.5px solid #919191;
  border-radius: 2px;
}

.box-shadow {
  box-shadow: 1px 1px 20px 0 rgba(134, 134, 134, 0.2) !important;
}

.inline-error {
  color: #e50000 !important;
}

.alert-red-color {
  color: #f00;
}

.text-overflow-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

//Programs tooltip styling
.tooltip-inner:has(.processing-fee-tooltip-content) {
  max-width: none !important;
  white-space: normal !important;
  max-height: 80vh !important;
  overflow-y: auto !important;
}

.tooltip-inner .processing-fee-tooltip-content {
  display: block;
  max-width: 100%;
}

.tooltip .tooltip-inner:has(.processing-fee-tooltip-content) {
  max-width: fit-content !important;
  min-width: auto !important;
  max-height: 80vh !important;
  overflow-y: auto !important;
}

//BIN tooltip styling
.tooltip-inner:has(.bin-tooltip-content) {
  max-width: 350px !important;
  white-space: normal !important;
}

.tooltip-inner .bin-tooltip-content {
  display: block;
  max-width: 100%;
}






.env.development

SEON_LICENSE_KEY# internal integrations
API_URL=https://svc-dev2.uownleasing.com
AMS_URL=https://ams-dev2.uownleasing.com
AMS_WEBSITE_URL=https://svc-website-dev2.uownleasing.com
SERVICING_URL=https://svc-dev2.uownleasing.com
# log control
LOG_LEVEL=debug
USE_STRUCTURED_LOGS=false
# performance monitoring & error tracking
# SENTRY_DSN=https://<DNS_USER>@<DNS_PASS>.ingest.us.sentry.io/<ORG_ID>
# SENTRY_ORG=gguown
# fraud protection
# protection plan
BUDDY_OFFER_CONFIG_URL=https://staging.embed.buddy.insure/aon/aon-purchaseprotection-config-react.js
PARTNER_ID=p-buddytest
# document and identify verification
INTELLICHECK_IDN_URL=https://idn.intellicheck.com
INTELLICHECK_SDK_URL=http://idn-server.intellicheck.svc.cluster.local:80
# document and identity verification
SEON_API_URL=https://idv-eu.seon.io
SEON_LICENSE_KEY=aba8d18d-f6a7-4e9e-9713-ddb8d36d8533
SESSION_SAMPLE_RATE=0
SAMPLE_RATE_ON_ERROR=0.1
RADAR_LICENSE_KEY=<RADAR_TEST_KEY>





.eslintrc.js

module.exports = {
  root: true,
  extends: ['@react-native-community'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react-hooks'],
  ignorePatterns: [
    'public/help-guide/*',
    'public/IDN-UI-Toolkit/*',
  ],
  rules: {
    'no-console': ['error', {allow: ['warn', 'error']}],
    'react-hooks/rules-of-hooks': 'warn', // Checks rules of Hooks
    'react-hooks/exhaustive-deps': 'warn', // Checks effect dependencies
    'prettier/prettier': [
      'warn',
      {
        endOfLine: 'auto',
      },
    ],
  },
  globals: {
    localStorage: true,
    sessionStorage: true,
    JSX: true,
    globalThis: true,
  },
};

---------------------------------------------------------------------------------------------------------------------------------------------------------

O que Priyanka quer garantir
Ela está preocupada com regressão em QA, principalmente:
URLs geradas antes do deploy (old leads existentes no banco)
URLs geradas depois do deploy (new leads criados após subir em QA)
Ou seja: não basta testar só coisa nova — tem que garantir que nada que já existia “quebrou”.
Fluxo sugerido por Priyanka para testar as URLs após deploy em QA
✅ 1) Testar “old leads” (já existentes)
Após o deploy em QA (ex.: QA1), vocês precisam validar:
todas as URLs e serviços
para leads já existentes no banco
Objetivo: garantir compatibilidade com dados antigos (regressão).
Ela cita explicitamente:
“old leads existing in the database” 
✅ 2) Criar um “new lead” e gerar uma URL nova (antes do deploy)
Ela sugere que José ou você (Yuri):
Criem uma nova application
Gerem o link/URL
Enviem o link para vocês mesmos
Mas NÃO submetam ainda
Ela fala isso claramente:
“create a new application and send it… send that link over to yourself. Don’t submit anything…” 
Objetivo: ter um link real “recém-gerado” pronto para validação depois.
✅ 3) Após o deploy em QA, validar que essa URL criada ainda funciona
Depois que o deploy terminar, vocês devem:
Abrir o link que vocês enviaram para vocês mesmos
Confirmar que a submissão ainda funciona
“make sure you are able to submit after everything is deployed as well” 
Objetivo: validar se o deploy não quebra o fluxo quando a URL foi criada “em outro momento/estado do sistema”.
Por que esse fluxo é importante (o “risco” que ela está prevenindo)
Esse tipo de teste pega problemas como:
URL expirada / inválida
serviço/endpoint mudou e a URL antiga aponta para algo errado
parâmetros mudaram (ex.: incluir term months / frequency etc)
mudanças de validação quebrando submissão de link antigo
Ela reforça que:
“there are a lot of changes… we’ll need more time to test… a lot of moving pieces” 
Checklist rápido (resumo prático)
Depois do deploy em QA:
✅ Testar URLs/serviços com leads antigos
✅ Criar um lead novo e gerar link antes do deploy
✅ Após o deploy, abrir esse link e confirmar que dá para submeter normalmente
✅ Repetir com mais de um caso, se possível (para reduzir risco)
StandUp - UOWN
StandUp - UOWN
StandUp - UOWN
StandUp - UOWN

---------------------------------------------------------------------------------------------------------------------------------------------------------


## 1. Objetivo

Garantir o correto funcionamento da integração e modernização do fluxo de aplicação entre a **Uown Leasing** e a fintech adquirida (**Kornerstone**), assegurando:

* Compatibilidade com **URLs antigas** (backward compatibility)
* Funcionamento correto das **novas URLs**
* Aplicação correta de **temas visuais por domínio**
* Envio correto de **templates de e-mail e SMS**, conforme o fluxo

## 2. Escopo

### Incluído

* Testes dos fluxos de aplicação:

  * `sendApplication`
  * `finalizeApplication`
  * `completeApplication`
* URLs antigas e novas
* Fluxo **Uown** e fluxo **Kornerstone**
* Validação de tema (branding) por domínio
* Validação de templates de **E-mail** e **SMS**

### Fora do escopo

* Testes de performance
* Testes de carga
* Integrações externas não relacionadas ao fluxo de aplicação

## 3. Pré-requisitos

* Ambiente disponível: DEV / QA / STAGING
* Lead válido cadastrado no sistema
* Lead contendo:

  * `uuid`
  * `shortCode`
* Feature flags de rebranding habilitadas (se aplicável)
* Serviço de envio de e-mail e SMS ativo

## 4. Modelos de URL

### 4.1 URLs Antigas (devem continuar funcionando)

* `origination-{env}.uowleansing.com/sendApplication?uuid={uuid}&paymentFrequency={frequency}`
* `origination-{env}.uowleansing.com/finalizeApplication?uuid={uuid}&paymentFrequency={frequency}`
* `origination-{env}.uowleansing.com/completeApplication?uuid={uuid}&paymentFrequency={frequency}`

### 4.2 URLs Novas

#### Fluxo Uown

* `apply-{env}.uowleansing.com/{shortCode}/send`
* `secure-{env}.uowleansing.com/{shortCode}/finalize`
* `secure-{env}.uowleansing.com/{shortCode}/complete`

#### Fluxo Kornerstone

* `apply-{env}.kornerstonecredit.com/{shortCode}/send`
* `secure-{env}.kornerstonecredit.com/{shortCode}/complete`

## 5. Temas e Branding

* O tema das telas **deve ser definido com base no domínio de acesso**
* Validar:

  * Logos
  * Cores primárias e secundárias
  * Identidade visual (Uown vs Kornerstone)
* O tema **não deve vazar** entre domínios diferentes

## 6. Templates de Comunicação – Kornerstone

### 6.1 Templates de E-mail

Devem ser testados e validados quanto a:

* Conteúdo correto
* Branding Kornerstone
* Links apontando para as **novas URLs**

Templates:

* `ApprovalEmail`
* `SendApplicationEmail`
* `DeclineEmail`
* `ActivationNotice`
* `Welcome`
* `InitialPaymentReminder`
* `FinalizePurchaseEmail`

### 6.2 Templates de SMS

* `SendApplication`
* `ApprovalMessage`
* `FinalizePurchase`

## 7. Cenários de Teste

### CT-01 – Send Application (URLs antigas)

**Fluxos:** Uown / Kornerstone

**Passos:**

1. Acessar a URL antiga de `sendApplication`
2. Informar `uuid` e `paymentFrequency`

**Resultado esperado:**

* Fluxo executado com sucesso
* Tela exibida corretamente
* Tema aplicado conforme domínio
* Comunicação enviada com template correto

---

### CT-02 – Send Application (URLs novas)

**Fluxos:** Uown / Kornerstone

**Passos:**

1. Acessar a nova URL usando `shortCode`

**Resultado esperado:**

* Fluxo executado com sucesso
* Tema correto aplicado
* Templates de e-mail/SMS corretos enviados

---

### CT-03 – Finalize Application

Validar:

* URLs antigas e novas
* Persistência correta do estado da aplicação
* Tema correto

---

### CT-04 – Complete Application

Validar:

* URLs antigas e novas
* Conclusão correta do fluxo
* Envio de comunicações finais

## 8. Critérios de Aceite

* Todas as URLs antigas continuam funcionais
* Novas URLs funcionam conforme esperado
* Temas corretos aplicados por domínio
* Leads recebem **somente** os templates correspondentes ao fluxo
* Nenhum erro em QA/STAGING

## 9. Observações

* Documento vivo, sujeito a ajustes conforme evolução da integração
* Atenção especial a regressões causadas por rebranding

---------------------------------------------------------------------------------------------------------------------------------------------------------

criar aplicação para comerciante synchrony
buscar quick search por uuid usa o uuid grande antigo nao usa short code
fluxo antigo com url antiga
fluxo novo com url nova
Validar ao menos um template
abrir url antiga e abrir na nova manipulando a url
Realizar modify lease de uma aplicação ja funding 

---------------------------------------------------------------------------------------------------------------------------------------------------------



---

  Scenario Outline : Ativação do tema Kornerstone
    Given a criação de uma aplicação para kornerstone
    When a página de aplicação é carregada
    Then o elemento raiz do documento deve possuir data-theme igual a "ks"
    And as variáveis de cor devem refletir os valores Kornerstone
      | name                               | value    |
      | --primary                          | #8FC31F  |
      | --primary-selected                 | #82A92C  |
      | --secondary                        | #86217F  |
      | --opaque-primary-color-background  | #B7DC6A  |

  Scenario: Fluxo não-Kornerstone permanece com tema padrão
    Given o domínio não contém "kornerstone"
    And a empresa do cliente não é "KORNERSTONE"
    And o store indica que o cliente não é Kornerstone
    When a página de aplicação é carregada
    Then o atributo data-theme do elemento raiz não deve estar definido
    And as cores padrão UOWN devem ser mantidas

  Scenario: Layout, logo e links legais em fluxo Kornerstone
    Given o link de Send Application pertence a um fluxo Kornerstone elegível
    When a tela de Send Application é carregada
    Then o container principal deve utilizar o background var(--opaque-primary-color-background) do tema Kornerstone
    And o logo exibido deve ser o arquivo de logo Kornerstone
    And os links e contatos no Disclaimer devem apontar para recursos Kornerstone
    And o layout deve manter legibilidade e contraste adequados

  Scenario: Fluxo Send Application não-Kornerstone
    Given o link de Send Application pertence a um fluxo não-Kornerstone
    When a tela de Send Application é carregada
    Then cores, logo e links legais devem ser UOWN
    And a nova imagem não deve causar quebras ou sobreposições no layout

Scenario: Tela para completar informações pendentes com branding Kornerstone
  Given o lead pertence a um fluxo Kornerstone elegível
  And ainda existem informações obrigatórias a serem preenchidas antes da assinatura
  When a tela para completar essas informações é exibida
  Then as mensagens de introdução devem mencionar o nome completo da Kornerstone
  And as cores de destaque da tela (ícones, botões e avisos) devem seguir o tema Kornerstone

  When todas as informações obrigatórias são preenchidas e enviadas com sucesso
  And a página é recarregada ou o fluxo avança para a próxima etapa
  Then o tema Kornerstone deve permanecer ativo
  And o telefone de suporte e as cores de destaque devem continuar de acordo com a configuração Kornerstone

Scenario: Tela de divisão de itens (Allow Purchase Option) com branding Kornerstone
  Given o lead pertence a um fluxo Kornerstone elegível
  And o merchant possui "Allow Purchase Option" ativo
  And o valor do carrinho excede o limite aprovado
  When a tela de escolha de itens no lease e itens para pagar à vista é exibida
  Then o conteúdo deve usar o nome Kornerstone
  And as tabelas de itens devem manter legibilidade com o tema Kornerstone

  Scenario: Fluxo Complete Application   não-Kornerstone
    Given o lead pertence a um fluxo não-Kornerstone
    When a página de Complete Application é acessada
    Then textos, cores, links e logo devem ser UOWN


---







---------------------------------------------------------------------------------------------------------------------------------------------------------

## Tests in sandbox

### Scenario 1: Kornerstone theme activation
```markdown
- Given an application is created for Kornerstone
- When the application page loads
- Then the root document element must have data-theme equal to "ks"
- And the color variables must reflect the Kornerstone values
```

| name                              | value   |
|-----------------------------------|---------|
| --primary                         | #8FC31F |
| --primary-selected                | #82A92C |
| --secondary                       | #86217F |
| --opaque-primary-color-background | #B7DC6A |

Screenshot

**PASS**

---
### Scenario 2: Non-Kornerstone flow keeps default theme
```markdown
- Given the domain does not contain "kornerstone"
- And the client’s company is not "KORNERSTONE"
- And the store indicates the client is not Kornerstone
- When the application page loads
- Then the data-theme attribute on the root element must not be set
- And the default UOWN colors must be preserved
```

Screenshot

**PASS**

---
### Scenario 3: Layout, logo, and legal links in a Kornerstone flow
```markdown
- Given the Send Application link belongs to an eligible Kornerstone flow
- When the Send Application screen loads
- Then the main container must use the Kornerstone theme background var(--opaque-primary-color-background)
- And the displayed logo must be the Kornerstone logo asset
- And the links and contacts in the Disclaimer must point to Kornerstone resources
- And the layout must maintain adequate readability and contrast
```

Screenshot

**PASS**

---
### Scenario 4: Non-Kornerstone Send Application flow
```markdown
- Given the Send Application link belongs to a non-Kornerstone flow
- When the Send Application screen loads
- Then colors, logo, and legal links must be UOWN
- And the new image must not cause layout breaks or overlap
```

Screenshot

**PASS**

---
### Scenario 5: Pending information screen with Kornerstone branding
```markdown
- Given the lead belongs to an eligible Kornerstone flow
- And there are still required fields to fill before signing
- When the screen to complete those details is displayed
- Then the introductory messages must mention the full Kornerstone name
- And the screen’s highlight colors (icons, buttons, notices) must follow the Kornerstone theme
- When all required information is successfully submitted and the flow advances
- Then the Kornerstone theme must remain active
- And the support phone number and highlight colors must stay aligned with the Kornerstone configuration
```

Screenshot

**PASS**

---
### Scenario 6: Allow Purchase Option screen with Kornerstone branding
```markdown
- Given the lead belongs to an eligible Kornerstone flow
- And the merchant has the "Allow Purchase Option" enabled
- And the cart value exceeds the approved limit
- When the screen to split lease items from upfront-payment items is displayed
- Then the content must use the Kornerstone name
- And the item tables must maintain readability within the Kornerstone theme
```

Screenshot

**PASS**

---
### Scenario 7: Non-Kornerstone Complete Application flow
```markdown
- Given the lead belongs to a non-Kornerstone flow
- When the Complete Application page is accessed
- Then texts, colors, links, and logo must be UOWN
```

Screenshot

**PASS**

---


---------------------------------------------------------------------------------------------------------------------------------------------------------


https://origination-qa2.uownleasing.com/completeApplication?uuid={uuid}_{id}&selectedPaymentFrequency=WEEKLY&isBranded=false

origination-qa2.uowleansing.com/sendApplication?uuid={uuid}_{id}&paymentFrequency={frequency}
origination-qa2.uowleansing.com/finalizeApplication?uuid={uuid}_{id}&paymentFrequency={frequency}
origination-qa2.uowleansing.com/completeApplication?uuid={uuid}_{id}&paymentFrequency={frequency}




verificar a edicao dos itens do invoice





14797(Kornerstone - API)
d2dfe542-de80-4b43-a88f-3e91a6f3fb19
-6678474520836333568
https://origination-qa2.uownleasing.com/completeApplication?uuid=d2dfe542-de80-4b43-a88f-3e91a6f3fb19_-6678474520836333568&selectedPaymentFrequency=WEEKLY&isBranded=false
https://secure-qa2.kornerstoneliving.com/wPIW2nap/complete?selectedPaymentFrequency=WEEKLY&isBranded=false - email
--> ERRO > Essa aplicação esta funding, no link antigo informa que esta funding, no link novo informa que o link é invalido para entrar em contato com o comerciante
--> falar com priyanka


https://origination-sandbox.uownleasing.com/completeApplication?uuid=97991df4-8f9d-48db-94bb-8ac81bfd5f89_-6662292013120401408&amp;selectedPaymentFrequency=WEEKLY&amp;isBranded=false
https://secure-qa2.kornerstoneliving.com/kzHcalZt/complete?selectedPaymentFrequency=WEEKLY&amp;isBranded=false





https://secure-stg.kornerstoneliving.com/obUea1gp/complete?selectedPaymentFrequency=WEEKLY
699261a9-531b-452c-9e9a-e59c8a39c011
-6402183001643307008
https://origination-sandbox.uownleasing.com/completeApplication?uuid=699261a9-531b-452c-9e9a-e59c8a39c011_-6402183001643307008&amp;selectedPaymentFrequency=WEEKLY&amp;isBranded=false